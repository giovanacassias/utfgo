import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="min-h-dvh bg-surface-muted font-sans text-text-primary lg:grid lg:grid-cols-3">
      <aside class="hidden bg-tertiary p-12 text-on-tertiary lg:block">
        <p class="text-title font-extrabold">UTFgo</p>
        <h2 class="mt-10 text-display font-bold">Caronas solidárias no seu câmpus</h2>
        <p class="mt-4 text-body">
          Conectamos estudantes, professores e servidores em viagens mais sustentáveis e econômicas.
        </p>
      </aside>
      <div class="flex flex-col px-6 py-6 lg:col-span-2 lg:bg-background lg:px-12 lg:py-12">
        <a
          routerLink="/"
          class="inline-flex min-h-12 items-center self-start rounded-control px-3 text-small font-semibold text-tertiary"
          >Voltar</a
        >
        <div class="mx-auto my-auto w-full max-w-(--breakpoint-sm)">
          <header class="py-6 text-center lg:text-left">
            <p class="text-brand font-extrabold lg:text-title">
              UTF<span class="text-primary">go</span>
            </p>
            <h1 class="mt-4 text-title font-bold">Criar conta</h1>
            <p class="mt-2 text-small text-text-secondary">
              Use seu e-mail institucional da UTFPR.
            </p>
          </header>
          <form
            class="grid gap-4 rounded-card border border-border bg-background p-5 lg:p-8"
            [formGroup]="form"
            [attr.aria-busy]="isSending()"
            (ngSubmit)="sendCode()"
          >
            @for (field of fields; track field.key) {
              <div class="grid gap-2">
                <label [for]="field.key" class="text-small font-semibold">{{ field.label }}</label>
                <input
                  [id]="field.key"
                  [type]="field.type"
                  [formControlName]="field.key"
                  [attr.autocomplete]="field.autocomplete"
                  aria-required="true"
                  [readOnly]="isSending()"
                  [attr.aria-invalid]="hasError(field.key)"
                  [attr.aria-describedby]="hasError(field.key) ? field.key + '-error' : null"
                  class="min-h-12 w-full rounded-control border border-border bg-surface-muted px-3 py-2 text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
                />
                @if (hasError(field.key)) {
                  <p [id]="field.key + '-error'" class="text-small" role="alert">
                    {{ field.error }}
                  </p>
                }
              </div>
            }
            @if (requestError(); as message) {
              <p
                class="rounded-control border-s-4 border-danger bg-danger-surface p-3 text-small"
                role="alert"
              >
                {{ message }}
              </p>
            }
            <button
              type="submit"
              [disabled]="isSending()"
              class="min-h-12 rounded-control bg-primary px-4 py-3 text-small font-bold text-on-primary hover:bg-primary-hover disabled:bg-control-disabled disabled:text-text-secondary"
            >
              {{ isSending() ? 'Enviando código…' : 'Enviar código de acesso' }}
            </button>
            <p class="text-center text-small text-text-secondary lg:text-left">
              Você receberá um código PIN de uso único por e-mail.
            </p>
          </form>
          <p class="mt-6 text-center text-small lg:text-left">
            Já tem uma conta?
            <a routerLink="/entrar" class="font-semibold text-tertiary underline">Entrar</a>
          </p>
        </div>
      </div>
    </main>
  `,
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly fields = [
    {
      key: 'name',
      label: 'Nome completo',
      type: 'text',
      autocomplete: 'name',
      error: 'Informe seu nome completo.',
    },
    {
      key: 'email',
      label: 'E-mail institucional',
      type: 'email',
      autocomplete: 'email',
      error: 'Informe um e-mail institucional da UTFPR.',
    },
    {
      key: 'campus',
      label: 'Câmpus',
      type: 'text',
      autocomplete: 'off',
      error: 'Informe seu câmpus.',
    },
  ] as const;
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        (control: AbstractControl<string>) => (control.value.trim() ? null : { required: true }),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        (control: AbstractControl<string>) =>
          !control.value || this.authService.isInstitutionalEmail(control.value)
            ? null
            : { institutionalEmail: true },
      ],
    }),
    campus: new FormControl('', {
      nonNullable: true,
      validators: [
        (control: AbstractControl<string>) => (control.value.trim() ? null : { required: true }),
      ],
    }),
  });
  protected readonly isSending = signal(false);
  protected readonly requestError = signal<string | null>(null);
  protected hasError(key: 'name' | 'email' | 'campus'): boolean {
    const control = this.form.controls[key];
    return control.touched && control.invalid;
  }
  protected async sendCode(): Promise<void> {
    if (this.isSending()) return;
    this.requestError.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.isSending.set(true);
    try {
      const challenge = await firstValueFrom(
        this.authService
          .sendRegistrationOtp(this.form.getRawValue())
          .pipe(takeUntilDestroyed(this.destroyRef)),
        { defaultValue: null },
      );
      if (challenge && !this.destroyRef.destroyed) {
        await this.router.navigateByUrl('/validar-codigo', { state: { email: challenge.email } });
      }
    } catch (error) {
      this.requestError.set(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o código. Verifique sua conexão e tente novamente.',
      );
    } finally {
      this.isSending.set(false);
    }
  }
}
