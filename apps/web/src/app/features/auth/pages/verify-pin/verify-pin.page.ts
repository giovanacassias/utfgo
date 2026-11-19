import { Location } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-verify-pin-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="min-h-dvh bg-surface-muted px-6 py-6 font-sans text-text-primary">
      <div class="mx-auto w-full max-w-(--breakpoint-sm)">
        <a
          routerLink="/entrar"
          aria-label="Voltar"
          class="inline-flex size-12 items-center justify-center rounded-control hover:bg-background
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
        >
          <svg aria-hidden="true" class="size-5" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 5-7 7 7 7M5 12h14" />
          </svg>
        </a>

        <header class="pt-6 pb-8 text-center">
          <svg aria-hidden="true" class="mx-auto rounded-full border border-border bg-background text-tertiary"
               width="96" height="96" viewBox="0 0 96 96" fill="currentColor">
            <path d="M53.175 61.5L46.8 55.125L48.9 53.025L53.175 57.3L61.65 48.825L63.75 50.925L53.175 61.5M35.25 58.5C34.425 58.5 33.7188 58.2062 33.1313 57.6187C32.5438 57.0312 32.25 56.325 32.25 55.5V37.5C32.25 36.675 32.5438 35.9688 33.1313 35.3813C33.7188 34.7938 34.425 34.5 35.25 34.5H59.25C60.075 34.5 60.7812 34.7938 61.3687 35.3813C61.9562 35.9688 62.25 36.675 62.25 37.5V44.025L53.2125 53.0625L48.9 48.75L42.5625 55.0875L45.975 58.5H35.25M47.25 48L59.25 40.5V37.5L47.25 45L35.25 37.5V40.5L47.25 48" />
          </svg>
          <h1 class="mt-6 text-title-small font-extrabold sm:text-title">
            Digite o código de verificação
          </h1>
          <p class="mt-2 text-small wrap-anywhere text-text-secondary">
            Enviamos um código de segurança de 6 dígitos para
            @if (email) {
              {{ email }}.
            } @else {
              o seu e-mail institucional.
            }
          </p>
        </header>

        <form [formGroup]="form" (ngSubmit)="confirm()" [attr.aria-busy]="busy()">
          <div class="grid justify-items-center gap-4 rounded-card bg-background p-4 sm:p-6">
            <label for="pin" class="text-caption font-semibold uppercase text-text-secondary">
              Código de 6 dígitos
            </label>
            <div class="relative w-full max-w-xs rounded-control focus-within:ring-2
                        focus-within:ring-tertiary focus-within:ring-offset-2">
              <input
                id="pin"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                formControlName="code"
                [readOnly]="busy()"
                [attr.aria-invalid]="error() ? 'true' : null"
                [attr.aria-describedby]="error() ? 'pin-error' : null"
                class="absolute inset-0 z-10 size-full cursor-text opacity-0"
              />
              <div aria-hidden="true" class="grid grid-cols-6 gap-1 sm:gap-2">
                @for (position of positions; track position) {
                  <span
                    class="flex min-h-12 items-center justify-center rounded-control border
                           bg-surface-muted text-title-small font-bold"
                    [class.border-border]="!error()"
                    [class.border-danger]="error()"
                  >
                    @if (code()[position]; as digit) {
                      {{ digit }}
                    } @else {
                      <span class="text-text-secondary">·</span>
                    }
                  </span>
                }
              </div>
            </div>
            @if (error(); as message) {
              <p id="pin-error" role="alert"
                 class="w-full rounded-control border-s-4 border-danger bg-danger-surface p-3 text-small">
                {{ message }}
              </p>
            }
            @if (resent()) {
              <p role="status" class="text-small text-text-secondary">Código reenviado com sucesso.</p>
            }
            <button
              type="button"
              (click)="resend()"
              [disabled]="busy()"
              class="inline-flex min-h-12 items-center gap-2 rounded-control px-3 text-small
                     font-semibold text-tertiary hover:bg-surface-muted focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-tertiary
                     disabled:text-text-secondary"
            >
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
                <path d="M9.975 11.025L11.025 9.975L8.25 7.2V3.75H6.75V7.8L9.975 11.025M7.5 15A7.5 7.5 0 1 1 7.5 0A7.5 7.5 0 1 1 7.5 15M7.5 13.5A6 6 0 1 0 7.5 1.5A6 6 0 1 0 7.5 13.5" />
              </svg>
              Reenviar código agora
            </button>
          </div>

          <button
            type="submit"
            [disabled]="busy()"
            class="mt-8 min-h-12 w-full rounded-control bg-primary px-4 py-3 text-small font-bold
                   text-on-primary hover:bg-primary-hover focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-tertiary
                   disabled:bg-control-disabled disabled:text-text-secondary"
          >
            Confirmar código
          </button>
        </form>

        <p class="mt-4 flex items-center justify-center gap-2 text-center text-caption text-text-secondary">
          <svg aria-hidden="true" class="shrink-0 text-tertiary" width="15" height="14"
               viewBox="0 0 15 14" fill="currentColor">
            <path d="M6.75 13.5V12H12.75V6.675C12.75 5.2125 12.2406 3.97187 11.2219 2.95312C10.2031 1.93438 8.9625 1.425 7.5 1.425C6.0375 1.425 4.79688 1.93438 3.77813 2.95312C2.75938 3.97187 2.25 5.2125 2.25 6.675V11.25H1.5A1.5 1.5 0 0 1 0 9.75V8.25C0 7.7 0.25 7.25 0.75 6.95625L0.80625 5.9625C1.25 2.45 3.95 0 7.5 0C11.05 0 13.75 2.45 14.1938 5.94375L14.25 6.91875C14.75 7.15 15 7.55 15 8.1375V9.8625C15 10.45 14.75 10.85 14.25 11.0813V12C14.25 12.8284 13.5784 13.5 12.75 13.5H6.75" />
            <circle cx="5.25" cy="7.5" r=".75" />
            <circle cx="9.75" cy="7.5" r=".75" />
            <path d="M3.01875 7.0875C2.93125 5.7625 3.33125 4.625 4.21875 3.675C5.10625 2.725 6.2125 2.25 7.5375 2.25C8.65 2.25 9.62813 2.60313 10.4719 3.30938C11.3156 4.01562 11.825 4.91875 12 6.01875C10.8625 6.00625 9.81563 5.7 8.85938 5.1C7.90312 4.5 7.16875 3.6875 6.65625 2.6625C6.45625 3.6625 6.03438 4.55312 5.39062 5.33437C4.74687 6.11562 3.95625 6.7 3.01875 7.0875" />
          </svg>
          Para ajuda com o login corporativo, procure o suporte da UTFPR.
        </p>

        <p class="mt-8 flex items-start gap-3 rounded-card bg-background p-4 text-caption text-text-secondary">
          <svg aria-hidden="true" class="shrink-0 rounded-full bg-surface-muted text-tertiary"
               width="24" height="26" viewBox="0 0 24 26" fill="currentColor">
            <path fill-rule="evenodd"
                  d="M8 21A1.333 1.333 0 0 1 6.667 19.667V13A1.333 1.333 0 0 1 8 11.667H8.667V10.333A3.333 3.333 0 0 1 15.333 10.333V11.667H16A1.333 1.333 0 0 1 17.333 13V19.667A1.333 1.333 0 0 1 16 21H8ZM12 17.667A1.333 1.333 0 1 0 12 15A1.333 1.333 0 1 0 12 17.667ZM10 11.667H14V10.333A2 2 0 0 0 10 10.333V11.667Z" />
          </svg>
          <span>
            Este código é de uso pessoal e intransferível, válido por 10 minutos.
            Professores e alunos da UTFPR nunca devem compartilhar credenciais.
          </span>
        </p>
      </div>
    </main>
  `,
})
export class VerifyPinPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly email = (inject(Location).getState() as { email?: string }).email ?? '';
  protected readonly form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });
  protected readonly positions = [0, 1, 2, 3, 4, 5];
  protected readonly code = toSignal(this.form.controls.code.valueChanges, { initialValue: '' });
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resent = signal(false);

  protected async confirm(): Promise<void> {
    if (this.busy()) return;
    this.error.set(null);
    this.resent.set(false);
    if (this.form.invalid) {
      this.error.set('O código deve ter 6 dígitos.');
      return;
    }
    this.busy.set(true);
    try {
      const session = await firstValueFrom(
        this.auth
          .confirmOtp(this.form.controls.code.value)
          .pipe(takeUntilDestroyed(this.destroyRef)),
        { defaultValue: null },
      );
      if (session && !this.destroyRef.destroyed) await this.router.navigateByUrl('/inicio');
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Não foi possível confirmar o código. Verifique sua conexão e tente novamente.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async resend(): Promise<void> {
    if (this.busy()) return;
    this.error.set(null);
    this.resent.set(false);
    this.busy.set(true);
    try {
      const challenge = await firstValueFrom(
        this.auth.resendOtp().pipe(takeUntilDestroyed(this.destroyRef)),
        { defaultValue: null },
      );
      if (challenge && !this.destroyRef.destroyed) this.resent.set(true);
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Não foi possível reenviar o código. Verifique sua conexão e tente novamente.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
