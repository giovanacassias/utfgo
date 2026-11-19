import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
  selector: 'app-login-page',
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
          aria-label="Voltar"
          class="inline-flex size-12 items-center justify-center self-start rounded-control
                 hover:bg-background lg:hover:bg-surface-muted
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
        >
          <svg aria-hidden="true" class="size-5" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 5-7 7 7 7M5 12h14" />
          </svg>
        </a>

        <div class="mx-auto my-auto w-full max-w-(--breakpoint-sm)">
          <header class="pt-12 pb-12 text-center lg:pt-6 lg:pb-8 lg:text-left">
            <p class="text-brand font-extrabold">
              UTF<span class="text-primary">go</span>
            </p>
            <p class="mt-8 text-small text-text-secondary lg:mt-4">
              Acesse o aplicativo usando exclusivamente seu e-mail
              institucional de aluno ou professor da UTFPR
            </p>
          </header>

          <form
            class="grid gap-5 rounded-card bg-background p-5 lg:gap-4 lg:border lg:border-border lg:p-8"
            [formGroup]="form"
            [attr.aria-busy]="isSending()"
            (ngSubmit)="sendCode()"
          >
            <div class="grid gap-2">
              <label for="login-email" class="text-small font-semibold">E-mail institucional</label>
              <div class="relative">
                <svg aria-hidden="true" class="pointer-events-none absolute inset-y-0 start-4 my-auto text-tertiary"
                     width="19" height="15" viewBox="0 0 19 15" fill="currentColor">
                  <path d="M9.16667 15L3.33333 11.8333V6.83333L0 5L9.16667 0L18.3333 5V11.6667H16.6667V5.91667L15 6.83333V11.8333L9.16667 15M9.16667 8.08333L14.875 5L9.16667 1.91667L3.45833 5L9.16667 8.08333M9.16667 13.1042L13.3333 10.8542V7.70833L9.16667 10L5 7.70833V10.8542L9.16667 13.1042" />
                </svg>
                <input
                  id="login-email"
                  type="email"
                  aria-required="true"
                  autocomplete="email"
                  formControlName="email"
                  placeholder="usuario@alunos.utfpr.edu.br"
                  [readOnly]="isSending()"
                  [attr.aria-invalid]="showEmailError()"
                  [attr.aria-describedby]="showEmailError() ? 'login-email-error' : null"
                  [class.border-transparent]="!showEmailError()"
                  [class.border-danger]="showEmailError()"
                  class="min-h-12 w-full rounded-control border bg-surface-muted ps-12 pe-3
                         py-2 text-body placeholder:text-text-secondary focus-visible:outline-2
                         focus-visible:outline-offset-2 focus-visible:outline-tertiary"
                />
              </div>
              @if (showEmailError()) {
                <p id="login-email-error" class="text-small" role="alert">
                  Informe um e-mail institucional da UTFPR.
                </p>
              }
            </div>
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
              class="min-h-12 rounded-control bg-primary px-4 py-3 text-small font-bold
                     text-on-primary hover:bg-primary-hover focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-tertiary
                     disabled:bg-control-disabled disabled:text-text-secondary"
            >
              {{ isSending() ? 'Enviando código…' : 'Enviar código de acesso' }}
            </button>
            <div class="mt-3 flex items-center gap-3 text-text-secondary">
              <svg aria-hidden="true" class="shrink-0 text-tertiary"
                   width="18" height="32" viewBox="0 0 18 32" fill="currentColor">
                <path d="M14.0625 23.3973L8.4 17.7348C8 18.4098 7.45625 18.9504 6.76875 19.3566C6.08125 19.7629 5.325 19.966 4.5 19.966C3.25 19.966 2.1875 19.5285 1.3125 18.6535C0.4375 17.7785 0 16.716 0 15.466C0 14.641 0.203125 13.8848 0.609375 13.1973C1.01562 12.5098 1.55625 11.966 2.23125 11.566L0.31875 9.65352L1.3875 8.60352L15.1125 22.3473L14.0625 23.3973M15 13.216L17.25 15.466L13.8188 18.8973L11.4375 16.5348L12.375 15.841L13.725 16.8535L15.1313 15.466L14.3813 14.716H9.61875L8.11875 13.216H15M4.5 18.466C5.1375 18.466 5.70312 18.2941 6.19688 17.9504C6.69063 17.6066 7.05 17.1598 7.275 16.6098L3.35625 12.691C2.80625 12.916 2.35938 13.2754 2.01562 13.7691C1.67188 14.2629 1.5 14.8285 1.5 15.466C1.5 16.291 1.79375 16.9973 2.38125 17.5848C2.96875 18.1723 3.675 18.466 4.5 18.466M4.5 16.966C4.0875 16.966 3.73438 16.8191 3.44062 16.5254C3.14687 16.2316 3 15.8785 3 15.466C3 15.0535 3.14687 14.7004 3.44062 14.4066C3.73438 14.1129 4.0875 13.966 4.5 13.966C4.9125 13.966 5.26562 14.1129 5.55937 14.4066C5.85312 14.7004 6 15.0535 6 15.466C6 15.8785 5.85312 16.2316 5.55937 16.5254C5.26562 16.8191 4.9125 16.966 4.5 16.966" />
              </svg>
              <p class="flex-1 text-center text-caption lg:text-left">
                Sem campo de senha necessário. Enviaremos um código PIN de uso único.
              </p>
            </div>
          </form>

          <p class="mt-12 pt-3 text-center text-small font-semibold text-text-secondary lg:mt-6 lg:pt-0 lg:text-left">
            <a
              routerLink="/criar-conta"
              aria-label="É o primeiro acesso? Clique aqui para criar conta"
              class="inline-flex min-h-12 items-center rounded-control px-2
                     text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-tertiary"
            >
              É o primeiro acesso? Clique aqui
            </a>
          </p>
        </div>
      </div>
    </main>
  `,
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup({
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
  });

  private readonly email = this.form.controls.email;
  private readonly emailEvents = toSignal(this.email.events);

  protected readonly isSending = signal(false);
  protected readonly requestError = signal<string | null>(null);
  protected readonly showEmailError = computed(() => {
    this.emailEvents();
    return this.email.touched && this.email.invalid;
  });

  protected async sendCode(): Promise<void> {
    if (this.isSending()) {
      return;
    }

    this.requestError.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.isSending.set(true);
    try {
      const challenge = await firstValueFrom(
        this.authService.sendLoginOtp(this.email.value).pipe(takeUntilDestroyed(this.destroyRef)),
        { defaultValue: null },
      );
      if (challenge && !this.destroyRef.destroyed) {
        await this.router.navigateByUrl('/validar-codigo', { state: { email: challenge.email } });
      }
    } catch (error) {
      this.requestError.set(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o código. Tente novamente.',
      );
    } finally {
      this.isSending.set(false);
    }
  }
}
