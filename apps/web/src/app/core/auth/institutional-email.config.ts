import { InjectionToken } from '@angular/core';

export const INSTITUTIONAL_EMAIL_DOMAINS = new InjectionToken<readonly string[]>(
  'Institutional email domains',
  {
    providedIn: 'root',
    factory: () => ['alunos.utfpr.edu.br', 'utfpr.edu.br'],
  },
);
