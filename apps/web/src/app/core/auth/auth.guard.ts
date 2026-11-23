import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.session() ? true : router.parseUrl('/entrar');
};

export const adminGuard: CanActivateFn = () => {
  const session = inject(AuthService).session();
  return session?.user.role === 'ADMIN' && session.user.status === 'ACTIVE'
    ? true
    : inject(Router).parseUrl(session ? '/inicio' : '/entrar');
};
