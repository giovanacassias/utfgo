import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';
import { WALLET_API_URL } from './app.config';
import { AuthService } from './core/auth/auth.service';
import { AuthSession } from './core/models/auth.model';
import { PlaceholderPage } from './features/home/placeholder.page';
import { WALLET_ROUTES } from './features/wallet/wallet.routes';
import { WalletOverviewPage } from './features/wallet/pages/wallet-overview/wallet-overview.page';

describe('app routes: /cofrinho (wallet feature)', () => {
  const apiUrl = 'http://api.utfgo.test';
  const session = signal<AuthSession | null>(null);
  let harness: RouterTestingHarness;
  let router: Router;
  let httpMock: HttpTestingController;

  function flushWallet(): void {
    httpMock.expectOne(`${apiUrl}/users/user-1`).flush({
      id: 'user-1',
      email: 'caio@alunos.utfpr.edu.br',
      name: 'Caio',
      role: 'PASSENGER',
      status: 'ACTIVE',
      createdAt: '2026-10-01T10:00:00.000Z',
    });
    httpMock.expectOne(`${apiUrl}/wallets?userId=user-1`).flush([
      {
        id: 'wallet-1',
        userId: 'user-1',
        tokenBalance: 8,
        penaltyPoints: 0,
        updatedAt: '2026-10-10T14:26:00.000Z',
      },
    ]);
    httpMock.expectOne(`${apiUrl}/orders?userId=user-1`).flush([]);
    httpMock.expectOne(`${apiUrl}/payments`).flush([]);
  }

  beforeEach(async () => {
    session.set({
      token: 'token',
      user: {
        id: 'user-1',
        name: 'Ana',
        email: 'ana@utfpr.edu.br',
        campus: 'Curitiba',
        role: 'PASSENGER',
        status: 'ACTIVE',
      },
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WALLET_API_URL, useValue: apiUrl },
        { provide: AuthService, useValue: { session: session.asReadonly() } },
      ],
    });
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('replaces the placeholder with wallet child routes loaded via loadChildren', () => {
    const shell = routes.find((route) => route.children !== undefined);
    const cofrinho = shell?.children?.find((route) => route.path === 'cofrinho');

    expect(cofrinho?.loadChildren).toEqual(expect.any(Function));
    expect(cofrinho?.loadComponent).toBeUndefined();
  });

  it('exposes the overview page at the wallet root path', async () => {
    const root = WALLET_ROUTES.find((route) => route.path === '');
    expect(root).toBeDefined();
    const page = await (root?.loadComponent as () => Promise<unknown>)();
    expect(page).toBe(WalletOverviewPage);
    expect(page).not.toBe(PlaceholderPage);
  });

  it('renders the wallet overview inside the authenticated shell and loads the wallet', async () => {
    await harness.navigateByUrl('/cofrinho');
    flushWallet();
    await harness.fixture.whenStable();
    harness.detectChanges();

    const shell = harness.fixture.nativeElement.querySelector('app-shell') as HTMLElement;
    expect(router.url).toBe('/cofrinho');
    expect(shell.querySelector('main [data-wallet-balance]')?.textContent).toContain('8 fichas');
    expect(shell.querySelector('nav a[href="/cofrinho"]')?.classList.contains('bg-tertiary')).toBe(
      true,
    );
  });

  it('keeps /cofrinho protected by authGuard', async () => {
    session.set(null);
    await harness.navigateByUrl('/cofrinho');

    expect(router.url).toBe('/entrar');
  });

  it('keeps /inicio and the login untouched', async () => {
    await harness.navigateByUrl('/inicio');
    expect(router.url).toBe('/inicio');
    session.set(null);
    await harness.navigateByUrl('/entrar');
    expect(router.url).toBe('/entrar');
  });
});
