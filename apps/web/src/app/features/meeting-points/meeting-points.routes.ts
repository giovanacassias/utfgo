import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';

import { MeetingPointDetails, MeetingPointsService } from './services/meeting-points.service';

const meetingPointResolver: ResolveFn<MeetingPointDetails> = (route) =>
  inject(MeetingPointsService).loadPoint(route.paramMap.get('id')!);

export const MEETING_POINTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/points-list/points-list.page').then((module) => module.PointsListPage),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./pages/point-create/point-create.page').then((module) => module.PointCreatePage),
  },
  {
    path: ':id',
    resolve: { details: meetingPointResolver },
    loadComponent: () =>
      import('./pages/point-details/point-details.page').then((module) => module.PointDetailsPage),
  },
];
