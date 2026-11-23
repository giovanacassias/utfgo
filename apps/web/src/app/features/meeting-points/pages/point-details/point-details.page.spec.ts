import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
  name: 'Portão principal',
  address: 'Rua Desembargador Westphalen, 500',
  isActive: false,
};

describe('PointDetailsPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    const session = signal<AuthSession>({
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

    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { session } },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  function detailsView(): HTMLElement {
    return harness.routeNativeElement!.querySelector<HTMLElement>('app-point-details')!;
  }

  async function openLibrary(): Promise<HTMLElement> {
    await harness.navigateByUrl('/pontos-de-encontro/library');
    http.expectOne({ method: 'GET', url: '/api/meeting-points' }).flush([gate, library]);
    await harness.fixture.whenStable();
    return detailsView();
  }

  it('selects the point from the URL and switches details when the URL parameter changes', async () => {
    const libraryDetails = await openLibrary();

    expect(libraryDetails.querySelector('h1')?.textContent).toContain(library.name);
    expect(libraryDetails.textContent).toContain(library.address);
    expect(libraryDetails.textContent).not.toContain(gate.name);

    await harness.navigateByUrl('/pontos-de-encontro/gate');
    expect(detailsView().querySelector('h1')?.textContent).toContain(gate.name);
    expect(detailsView().textContent).toContain(gate.address);
  });

  it('patches the point in each direction and confirms the resulting status', async () => {
    const details = await openLibrary();
    const action = () => details.querySelector<HTMLButtonElement>('button')!;

    expect(action().textContent?.trim()).toBe('Desativar ponto');
    action().click();
    const deactivate = http.expectOne({ method: 'PATCH', url: '/api/meeting-points/library' });
    expect(deactivate.request.body).toEqual({ isActive: false });
    deactivate.flush({ ...library, isActive: false });
    await harness.fixture.whenStable();

    expect(details.querySelector('[role="status"]')?.textContent).toContain('desativado');
    expect(details.textContent).toContain('Inativo');
    expect(action().textContent?.trim()).toBe('Reativar ponto');

    action().click();
    const reactivate = http.expectOne({ method: 'PATCH', url: '/api/meeting-points/library' });
    expect(reactivate.request.body).toEqual({ isActive: true });
    reactivate.flush(library);
    await harness.fixture.whenStable();

    expect(details.querySelector('[role="status"]')?.textContent).toContain('reativado');
    expect(details.textContent).toContain('Ativo');
  });
});
