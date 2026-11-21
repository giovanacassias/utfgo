import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
    <div class="flex min-h-dvh flex-col bg-surface-muted font-sans text-text-primary">
      <header class="mx-auto w-full max-w-(--breakpoint-xl) px-6 pt-12 text-center lg:px-12 lg:text-left">
        <p class="text-brand font-extrabold">
          UTF<span class="text-primary">go</span>
        </p>
        <p class="mt-3 text-caption font-semibold uppercase text-text-secondary">Carona universitária</p>
      </header>

      <main
        class="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 px-6 py-12
               lg:my-auto lg:grid-cols-5 lg:gap-x-12 lg:px-12"
      >
        <div class="flex min-w-0 flex-col justify-center gap-3 text-center lg:col-span-3 lg:text-left">
          <h1 class="text-body font-extrabold sm:text-title-small lg:text-display">
            Mobilidade colaborativa da <span class="text-primary">UTFPR</span>
          </h1>
          <p class="text-body text-text-secondary">
            Conectando alunos, professores e servidores para viagens diárias mais sustentáveis e
            econômicas
          </p>
        </div>

        <dl
          class="grid gap-4 px-2
                 lg:col-span-2 lg:col-start-4 lg:row-span-2 lg:row-start-1 lg:content-center"
        >
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3">
            <img class="row-span-2" src="landing/community.svg" width="32" height="32" alt="" />
            <dt class="font-semibold">Comunidade acadêmica</dt>
            <dd class="text-small text-text-secondary">
              Caronas exclusivas entre membros da UTFPR.
            </dd>
          </div>
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3">
            <img class="row-span-2" src="landing/price.svg" width="32" height="32" alt="" />
            <dt class="font-semibold">Preço acessível</dt>
            <dd class="text-small text-text-secondary">R$ 2,00 por viagem.</dd>
          </div>
          <div class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3">
            <img class="row-span-2" src="landing/verified.svg" width="32" height="32" alt="" />
            <dt class="font-semibold">Acesso validado</dt>
            <dd class="text-small text-text-secondary">Acesso por e-mail institucional.</dd>
          </div>
        </dl>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-center lg:col-span-3 lg:flex-wrap lg:justify-start">
          <a
            routerLink="/entrar"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-4
                   py-3 text-center text-small font-bold text-on-primary hover:bg-primary-hover
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
          >
            <img class="shrink-0" src="landing/email.svg" width="15" height="12" alt="" />
            Entrar com e-mail institucional
          </a>
          <a
            routerLink="/criar-conta"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-4
                   py-3 text-center text-small font-bold hover:bg-background
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
          >
            <img class="shrink-0" src="landing/create-account.svg" width="17" height="12" alt="" />
            Criar conta
          </a>
        </div>
      </main>

      <footer class="mt-auto px-6 pt-6 pb-12 text-center text-caption text-text-secondary lg:mt-0">
        <p class="mx-auto max-w-sm">
          Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade da UTFPR.
        </p>
      </footer>
    </div>
  `,
})
export class LandingPage {}
