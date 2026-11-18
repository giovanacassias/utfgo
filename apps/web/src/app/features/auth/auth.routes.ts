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
    title: 'Criar conta | UTFgo',
    loadComponent: () => import('./pages/register/register.page').then((module) => module.RegisterPage),
  },
  {
    path: 'validar-codigo',
    loadComponent: () =>
      import('./pages/verify-pin/verify-pin.page').then((module) => module.VerifyPinPage),
  },
];
