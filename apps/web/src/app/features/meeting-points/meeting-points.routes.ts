import { Routes } from '@angular/router';

export const MEETING_POINTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/points-list/points-list.page').then((module) => module.PointsListPage),
  },
];
