import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';

import { appConfig } from '../../../../app.config';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthSession } from '../../../../core/models/auth.model';
import { MeetingPoint } from '../../models/meeting-point.model';

const library: MeetingPoint = {
  id: 'library',
  name: 'Entrada da Biblioteca',
  address: 'Avenida Sete de Setembro, 3165',
  latitude: -25.44,
  longitude: -49.27,
  isActive: true,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const gate: MeetingPoint = {
  ...library,
  id: 'gate',
  name: 'Portão da Biblioteca',
  address: 'Rua Desembargador Westphalen, 500',
  isActive: false,
};

describe('PointsListPage', () => {
  let harness: RouterTestingHarness;
  let view: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    const session = signal<AuthSession>({
      token: 'session-token',
      user: {
        id: 'user-1',
        name: 'Ana UTFPR',
        email: 'ana@alunos.utfpr.edu.br',
        campus: 'Curitiba',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { session } },
      ],
    });

    harness = await RouterTestingHarness.create('/pontos-de-encontro');
    view = harness.fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the skeleton before rendering the deferred cards with name, address and status', async () => {
    expect(view.querySelector('app-point-search')).not.toBeNull();
    const [grid] = await harness.fixture.getDeferBlocks();
    expect(grid).toBeDefined();
    expect(view.querySelector('[role="status"]')?.textContent).toContain(
      'Carregando pontos de encontro',
    );

    http.expectOne({ method: 'GET', url: '/api/meeting-points' }).flush([library, gate]);
    await harness.fixture.whenStable();

    expect(view.querySelectorAll('app-point-card')).toHaveLength(0);
    await grid.render(DeferBlockState.Complete);

    const cards = view.querySelectorAll('app-point-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain(library.name);
    expect(cards[0].textContent).toContain(library.address);
    expect(cards[0].textContent).toContain('Ativo');
    expect(cards[1].textContent).toContain(gate.name);
    expect(cards[1].textContent).toContain(gate.address);
    expect(cards[1].textContent).toContain('Inativo');
    expect(view.querySelector('a[href="/pontos-de-encontro/novo"]')?.textContent?.trim()).toBe(
      'Novo ponto de encontro',
    );
    expect(view.querySelector('a[href="/pontos-de-encontro/library"]')).not.toBeNull();
  });

  it('reacts to the search and active-only controls while retaining cards by ID', async () => {
    const search = view.querySelector<HTMLInputElement>('app-point-search input[type="search"]');
    const onlyActive = view.querySelector<HTMLInputElement>(
      'app-point-search input[type="checkbox"]',
    );
    expect(search).not.toBeNull();
    expect(onlyActive).not.toBeNull();

    http.expectOne({ method: 'GET', url: '/api/meeting-points' }).flush([library, gate]);
    const [grid] = await harness.fixture.getDeferBlocks();
    await grid.render(DeferBlockState.Complete);

    const libraryCard = view.querySelector('app-point-card');
    search!.value = '  BIBLIOTECA ';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();
    expect(view.querySelectorAll('app-point-card')).toHaveLength(2);

    onlyActive!.click();
    await harness.fixture.whenStable();
    expect(view.querySelectorAll('app-point-card')).toHaveLength(1);
    expect(view.querySelector('app-point-card')).toBe(libraryCard);

    search!.value = 'portão';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();
    expect(view.querySelectorAll('app-point-card')).toHaveLength(0);

    onlyActive!.click();
    await harness.fixture.whenStable();
    expect(view.querySelectorAll('app-point-card')).toHaveLength(1);
    const gateCard = view.querySelector('app-point-card');
    expect(gateCard?.textContent).toContain(gate.name);

    view.querySelector<HTMLButtonElement>('app-point-card button')!.click();
    const update = http.expectOne({ method: 'PATCH', url: '/api/meeting-points/gate' });
    expect(update.request.body).toEqual({ isActive: true });
    update.flush({ ...gate, isActive: true });
    await harness.fixture.whenStable();

    expect(view.querySelector('app-point-card')).toBe(gateCard);
    expect(gateCard?.textContent).toContain('Ativo');
  });
});
