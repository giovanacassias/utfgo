import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'UTFgo | Carona universitária',
    loadComponent: () =>
      import('./pages/landing/landing.page').then((module) => module.LandingPage),
  },
  {
    path: 'entrar',
    title: 'Entrar | UTFgo',
    loadComponent: () => import('./pages/login/login.page').then((module) => module.LoginPage),
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
