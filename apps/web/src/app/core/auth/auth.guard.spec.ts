import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthService } from './auth.service';
import { AuthSession } from '../models/auth.model';
import { routes } from '../../app.routes';
import { authGuard } from './auth.guard';

describe('authGuard and protected routing', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  const session = signal<AuthSession | null>(null);

  beforeEach(async () => {
    session.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: { session: session.asReadonly() },
        },
      ],
    });

    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  it('keeps UI component declarations outside the application route composition', () => {
    expect(routes.every((route) => route.component === undefined)).toBe(true);
  });

  it('lazy-loads public routes, the app shell, and protected feature routes', () => {
    const publicRoutes = routes[0];
    const protectedRoutes = routes.find((route) => route.canActivate?.includes(authGuard));

    expect(publicRoutes.loadChildren).toEqual(expect.any(Function));
    expect(protectedRoutes?.loadComponent).toEqual(expect.any(Function));
    expect(
      protectedRoutes?.children?.every(
        (route) => route.loadComponent !== undefined || route.loadChildren !== undefined,
      ),
    ).toBe(true);
  });

  it('redirects a visitor without a session from /inicio to /entrar', async () => {
    await harness.navigateByUrl('/inicio');

    expect(router.url).toBe('/entrar');
  });

  it('renders /inicio as a child route inside the authenticated app shell', async () => {
    session.set({
      token: 'session-token',
      user: {
        id: 'user-1',
        name: 'Ana UTFPR',
        email: 'ana@alunos.utfpr.edu.br',
        campus: 'Curitiba',
        role: 'PASSENGER',
        status: 'ACTIVE',
      },
    });

    await harness.navigateByUrl('/inicio');

    expect(router.url).toBe('/inicio');
    const shell = harness.fixture.nativeElement.querySelector('app-shell');
    expect(shell?.textContent).toContain('Olá, Ana UTFPR');
  });
  it.each([
    ['/caronas', 'Caronas'],
    ['/cofrinho', 'Cofrinho'],
    ['/pontos-de-encontro', 'Pontos de encontro'],
    ['/meu-historico', 'Meu histórico'],
    ['/meu-perfil', 'Meu perfil'],
  ])('protects %s and displays its active destination', async (path, label) => {
    await harness.navigateByUrl(path);
    expect(router.url).toBe('/entrar');
    session.set({
      token: 'token',
      user: {
        id: '1',
        name: 'Ana',
        email: 'ana@utfpr.edu.br',
        campus: 'Curitiba',
        role: path === '/pontos-de-encontro' ? 'ADMIN' : 'PASSENGER',
        status: 'ACTIVE',
      },
    });
    await harness.navigateByUrl(path);
    harness.detectChanges();
    const shell = harness.fixture.nativeElement.querySelector('app-shell');
    expect(router.url).toBe(path);
    expect(shell.querySelector('main').textContent).toContain(label);
    expect(shell.querySelector(`nav a[href="${path}"]`).classList.contains('bg-tertiary')).toBe(
      true,
    );
  });
});
