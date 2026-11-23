import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { appConfig } from '../../app.config';
import { AuthService } from '../../core/auth/auth.service';
import { AuthSession } from '../../core/models/auth.model';

@Component({ template: '' })
class RouteInputProbe {
  readonly id = input.required<string>();
}

describe('Meeting point navigation', () => {
  let router: Router;
  const session = signal<AuthSession | null>(null);

  beforeEach(() => {
    session.set(null);
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: AuthService, useValue: { session } }],
    });
    router = TestBed.inject(Router);
  });

  it('binds a route parameter to a required signal input with the application configuration', async () => {
    router.resetConfig([...router.config, { path: 'input-probe/:id', component: RouteInputProbe }]);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/input-probe/point-42', RouteInputProbe);

    expect(page.id()).toBe('point-42');
  });

  it.each([
    '/pontos-de-encontro',
    '/pontos-de-encontro/novo',
    '/pontos-de-encontro/point-42',
  ])('redirects a visitor from %s to /entrar', async (path) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(path);

    expect(router.url).toBe('/entrar');
  });

  it('opens meeting point management in the shell when the Home shortcut is clicked', async () => {
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
    const harness = await RouterTestingHarness.create('/inicio');
    const shell = harness.routeNativeElement;
    const shortcut = shell?.querySelector<HTMLAnchorElement>(
      'main app-home-page a[href="/pontos-de-encontro"]',
    );

    expect(shortcut?.textContent?.trim()).toBe('Pontos de encontro');
    shortcut?.click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/pontos-de-encontro');
    expect(harness.routeNativeElement).toBe(shell);
  });
});
