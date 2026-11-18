import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/route-placeholder/route-placeholder.page').then(
        (module) => module.RoutePlaceholderPage,
      ),
  },
  {
    path: 'entrar',
    loadComponent: () =>
      import('./pages/route-placeholder/route-placeholder.page').then(
        (module) => module.RoutePlaceholderPage,
      ),
  },
  {
    path: 'criar-conta',
    loadComponent: () =>
      import('./pages/route-placeholder/route-placeholder.page').then(
        (module) => module.RoutePlaceholderPage,
      ),
  },
  {
    path: 'validar-codigo',
    loadComponent: () =>
      import('./pages/route-placeholder/route-placeholder.page').then(
        (module) => module.RoutePlaceholderPage,
      ),
  },
];
