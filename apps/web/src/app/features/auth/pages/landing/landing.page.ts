import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
    <div class="min-h-dvh bg-surface-muted font-sans text-text-primary">
      <header class="mx-auto max-w-(--breakpoint-xl) px-6 pt-12 text-center lg:px-12 lg:text-left">
        <p class="text-brand font-extrabold lg:text-title">
          UTF<span class="text-primary">go</span>
        </p>
        <p class="text-caption font-semibold uppercase text-text-secondary">Carona universitária</p>
      </header>

      <main class="mx-auto grid max-w-(--breakpoint-xl) gap-8 px-6 py-12 lg:grid-cols-2 lg:px-12">
        <div class="flex flex-col justify-center gap-3 text-center lg:text-left">
          <h1 class="text-title font-extrabold lg:text-display">
            A cidade fica mais perto quando a gente vai junto.
          </h1>
          <p class="text-body text-text-secondary">
            Encontre ou ofereça caronas com a comunidade da UTFPR para os trajetos até o câmpus.
          </p>
        </div>

        <dl
          class="grid gap-6 rounded-card border border-border bg-warning-surface p-6
                 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:content-center lg:p-10"
        >
          <div>
            <dt class="font-semibold">Comunidade acadêmica</dt>
            <dd class="text-small text-text-secondary">
              Caronas exclusivas entre membros da UTFPR.
            </dd>
          </div>
          <div>
            <dt class="font-semibold">Preço acessível</dt>
            <dd class="text-small text-text-secondary">R$ 2,00 por viagem.</dd>
          </div>
          <div>
            <dt class="font-semibold">Acesso validado</dt>
            <dd class="text-small text-text-secondary">Acesso por e-mail institucional.</dd>
          </div>
        </dl>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <a
            routerLink="/entrar"
            class="inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-4
                   py-3 text-center text-small font-bold text-on-primary hover:bg-primary-hover
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
          >
            Entrar com e-mail institucional
          </a>
          <a
            routerLink="/criar-conta"
            class="inline-flex min-h-12 items-center justify-center rounded-control border border-border
                   bg-background px-4 py-3 text-center text-small font-bold hover:bg-surface-muted
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
          >
            Criar conta
          </a>
        </div>
      </main>
    </div>
  `,
})
export class LandingPage {}
