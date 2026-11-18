import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  {
    path: 'inicio',
    loadComponent: () =>
      import('./pages/home-placeholder/home-placeholder.page').then(
        (module) => module.HomePlaceholderPage,
      ),
  },
];
