import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `<section class="flex flex-col items-start gap-4">
    <h1 class="text-title font-bold">Olá, {{ session()?.user?.name }}</h1>
    <a
      routerLink="/pontos-de-encontro"
      class="inline-flex min-h-11 items-center rounded-control border border-border bg-background px-4 py-3 font-semibold hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
    >
      Pontos de encontro
    </a>
  </section>`,
})
export class HomePage {
  protected readonly session = inject(AuthService).session;
}
