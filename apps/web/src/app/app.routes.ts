import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

// TODO #8: Replace these destinations with the lazy meeting point feature routes.
const loadMeetingPointPlaceholder = () =>
  import('./features/home/placeholder.page').then((module) => module.PlaceholderPage);

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/app-shell/app-shell.component').then(
        (module) => module.AppShellComponent,
      ),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./features/home/home.page').then((module) => module.HomePage),
      },
      {
        path: 'caronas',
        data: { title: 'Caronas' },
        loadComponent: () =>
          import('./features/home/placeholder.page').then((module) => module.PlaceholderPage),
      },
      {
        path: 'cofrinho',
        loadChildren: () =>
          import('./features/wallet/wallet.routes').then((module) => module.WALLET_ROUTES),
      },
      {
        path: 'pontos-de-encontro',
        loadChildren: () => [
          {
            path: '',
            pathMatch: 'full',
            data: { title: 'Pontos de encontro' },
            loadComponent: loadMeetingPointPlaceholder,
          },
          {
            path: 'novo',
            data: { title: 'Novo ponto de encontro' },
            loadComponent: loadMeetingPointPlaceholder,
          },
          {
            path: ':id',
            data: { title: 'Detalhes do ponto de encontro' },
            loadComponent: loadMeetingPointPlaceholder,
          },
        ],
      },
      {
        path: 'meu-historico',
        data: { title: 'Meu histórico' },
        loadComponent: () =>
          import('./features/home/placeholder.page').then((module) => module.PlaceholderPage),
      },
      {
        path: 'meu-perfil',
        data: { title: 'Meu perfil' },
        loadComponent: () =>
          import('./features/home/placeholder.page').then((module) => module.PlaceholderPage),
      },
    ],
  },
];
