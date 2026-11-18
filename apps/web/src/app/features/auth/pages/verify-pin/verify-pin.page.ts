import { Location } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-verify-pin-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="min-h-dvh bg-surface-muted px-6 py-6 font-sans text-text-primary">
      <a routerLink="/entrar" class="inline-flex min-h-12 items-center rounded-control px-3 text-small font-semibold text-tertiary">Voltar</a>
      <div class="mx-auto w-full max-w-(--breakpoint-sm)">
        <header class="py-6 text-center">
          <p class="text-brand font-extrabold">UTF<span class="text-primary">go</span></p>
          <h1 class="mt-4 text-title font-bold">Valide seu código</h1>
          <p class="mt-2 text-small text-text-secondary">Digite o código de 6 dígitos enviado para {{ email }}.</p>
        </header>
        <form [formGroup]="form" (ngSubmit)="confirm()" [attr.aria-busy]="busy()" class="grid gap-4 rounded-card border border-border bg-background p-5 lg:p-8">
          <label for="pin" class="text-small font-semibold">Código de acesso</label>
          <input id="pin" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" formControlName="code" [readOnly]="busy()" [attr.aria-invalid]="error() ? 'true' : null" [attr.aria-describedby]="error() ? 'pin-error' : null" class="min-h-12 w-full rounded-control border border-border bg-surface-muted px-3 py-2 text-body" />
          @if (error(); as message) { <p id="pin-error" role="alert" class="rounded-control border-s-4 border-danger bg-danger-surface p-3 text-small">{{ message }}</p> }
          @if (resent()) { <p role="status" class="text-small text-text-secondary">Código reenviado com sucesso.</p> }
          <button type="submit" [disabled]="busy()" class="min-h-12 rounded-control bg-primary px-4 py-3 text-small font-bold text-on-primary disabled:bg-control-disabled">Confirmar código</button>
          <button type="button" (click)="resend()" [disabled]="busy()" class="min-h-12 rounded-control px-4 py-3 text-small font-semibold text-tertiary">Reenviar código</button>
        </form>
      </div>
    </main>
  `,
})
export class VerifyPinPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly email = (inject(Location).getState() as { email?: string }).email ?? '';
  protected readonly form = new FormGroup({ code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] }) });
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resent = signal(false);

  protected async confirm(): Promise<void> {
    if (this.busy()) return;
    this.error.set(null); this.resent.set(false);
    if (this.form.invalid) { this.error.set('O código deve ter 6 dígitos.'); return; }
    this.busy.set(true);
    try {
      const session = await firstValueFrom(this.auth.confirmOtp(this.form.controls.code.value).pipe(takeUntilDestroyed(this.destroyRef)), { defaultValue: null });
      if (session && !this.destroyRef.destroyed) await this.router.navigateByUrl('/inicio');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Não foi possível confirmar o código. Verifique sua conexão e tente novamente.');
    } finally { this.busy.set(false); }
  }

  protected async resend(): Promise<void> {
    if (this.busy()) return;
    this.error.set(null); this.resent.set(false); this.busy.set(true);
    try {
      const challenge = await firstValueFrom(this.auth.resendOtp().pipe(takeUntilDestroyed(this.destroyRef)), { defaultValue: null });
      if (challenge && !this.destroyRef.destroyed) this.resent.set(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Não foi possível reenviar o código. Verifique sua conexão e tente novamente.');
    } finally { this.busy.set(false); }
  }
}
