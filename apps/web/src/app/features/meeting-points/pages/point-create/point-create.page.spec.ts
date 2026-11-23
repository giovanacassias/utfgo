import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { API_URL } from '../../../../core/api-url.token';
import { MEETING_POINTS_ROUTES } from '../../meeting-points.routes';
import { PointCreatePage } from './point-create.page';

describe('PointCreatePage', () => {
  const createUrl = '/pontos-de-encontro/novo';
  const listUrl = '/pontos-de-encontro';
  const endpoint = '/api/meeting-points';
  const viaCepUrl = 'https://viacep.com.br/ws/80230901/json/';
  const viaCepAddress = {
    cep: '80230-901',
    logradouro: 'Avenida Sete de Setembro',
    bairro: 'Rebouças',
    localidade: 'Curitiba',
    uf: 'PR',
  };
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'pontos-de-encontro', children: MEETING_POINTS_ROUTES }]),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  async function openForm(): Promise<void> {
    await harness.navigateByUrl(createUrl, PointCreatePage);
  }

  function input(name: string): HTMLInputElement {
    const field = harness.routeNativeElement?.querySelector<HTMLInputElement>(
      `input[formControlName="${name}"]`,
    );
    expect(field, `Campo ${name}`).toBeTruthy();
    return field!;
  }

  function enter(name: string, value: string): void {
    const field = input(name);
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function saveButton(): HTMLButtonElement {
    const button =
      harness.routeNativeElement?.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(button).toBeTruthy();
    return button!;
  }

  async function fillForm(cep = '80230-901'): Promise<void> {
    enter('name', ' Biblioteca Central ');
    enter('cep', cep);
    http.expectOne({ method: 'GET', url: viaCepUrl }).flush(viaCepAddress);
    enter('number', '3165');
    enter('latitude', '0');
    enter('longitude', '-49.2693');
    await harness.fixture.whenStable();
  }

  it('consulta o CEP ao completar oito dígitos e preenche rua, bairro e cidade/UF', async () => {
    await openForm();
    enter('cep', '8023090');
    http.expectNone((request) => request.url.startsWith('https://viacep.com.br'));
    enter('cep', '80230901');
    http.expectOne({ method: 'GET', url: viaCepUrl }).flush(viaCepAddress);
    await harness.fixture.whenStable();

    expect(input('street').value).toBe('Avenida Sete de Setembro');
    expect(input('neighborhood').value).toBe('Rebouças');
    expect(input('cityState').value).toBe('Curitiba/PR');
  });

  it('avisa sobre CEP com formato inválido ao sair do campo', async () => {
    await openForm();
    enter('cep', '80230-90');
    input('cep').dispatchEvent(new Event('blur'));
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'CEP não encontrado. Verifique o número digitado.',
    );
    http.expectNone((request) => request.url.startsWith('https://viacep.com.br'));
  });

  it('avisa quando o CEP não existe e mantém o endereço editável', async () => {
    await openForm();
    enter('cep', '80230-901');
    http.expectOne(viaCepUrl).flush({ erro: true });
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'CEP não encontrado. Verifique o número digitado.',
    );
    expect(input('street').disabled).toBe(false);
    expect(input('street').readOnly).toBe(false);
  });

  it('permite salvar o endereço manualmente quando a consulta de CEP falha', async () => {
    await openForm();
    enter('cep', '80230-901');
    http.expectOne(viaCepUrl).error(new ProgressEvent('error'));
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'Preencha o endereço manualmente.',
    );
    enter('name', 'Biblioteca');
    enter('street', 'Avenida Sete de Setembro');
    enter('number', '3165');
    enter('neighborhood', 'Rebouças');
    enter('cityState', 'Curitiba/PR');
    enter('latitude', '-25.4394');
    enter('longitude', '-49.2693');
    await harness.fixture.whenStable();

    expect(saveButton().disabled).toBe(false);
  });

  it('desabilita o botão com nome ausente ou CEP inválido', async () => {
    await openForm();
    expect(saveButton().disabled).toBe(true);
    await fillForm();
    expect(saveButton().disabled).toBe(false);
    enter('name', '   ');
    await harness.fixture.whenStable();
    expect(saveButton().disabled).toBe(true);
    enter('name', 'Biblioteca');
    enter('cep', '80230-90');
    await harness.fixture.whenStable();
    expect(saveButton().disabled).toBe(true);
  });

  it('descarta dados do CEP anterior e preserva a edição manual se a nova consulta falhar', async () => {
    await openForm();
    await fillForm();
    expect(saveButton().disabled).toBe(false);
    enter('street', 'Avenida corrigida manualmente');

    enter('cep', '80020-310');
    http
      .expectOne({ method: 'GET', url: 'https://viacep.com.br/ws/80020310/json/' })
      .error(new ProgressEvent('error'));
    await harness.fixture.whenStable();

    expect(saveButton().disabled).toBe(true);
    expect(input('street').value).toBe('Avenida corrigida manualmente');
    expect(input('neighborhood').value).toBe('');
    expect(input('cityState').value).toBe('');

    enter('neighborhood', 'Centro');
    enter('cityState', 'Curitiba/PR');
    await harness.fixture.whenStable();
    expect(saveButton().disabled).toBe(false);
  });

  it('valida os limites geográficos das coordenadas', async () => {
    await openForm();
    await fillForm();
    enter('latitude', '-91');
    await harness.fixture.whenStable();
    expect(saveButton().disabled).toBe(true);
    enter('latitude', '-90');
    enter('longitude', '181');
    await harness.fixture.whenStable();
    expect(saveButton().disabled).toBe(true);
    enter('longitude', '180');
    await harness.fixture.whenStable();
    expect(saveButton().disabled).toBe(false);
  });

  it('envia os dados de um ponto ativo e exibe a confirmação na listagem', async () => {
    await openForm();
    await fillForm();
    saveButton().click();
    const request = http.expectOne({ method: 'POST', url: endpoint });
    expect(request.request.body).toEqual({
      name: 'Biblioteca Central',
      address: 'Avenida Sete de Setembro, 3165 — Rebouças, Curitiba/PR',
      latitude: 0,
      longitude: -49.2693,
      isActive: true,
    });
    expect(router.url).toBe(createUrl);
    request.flush({ ...request.request.body, id: 'point-1', createdAt: '2026-11-22T12:00:00Z' });
    await harness.fixture.whenStable();

    expect(router.url).toBe(listUrl);
    http.expectOne({ method: 'GET', url: endpoint }).flush([]);
    expect(
      Array.from(harness.routeNativeElement!.querySelectorAll('[role="status"]')).map((status) =>
        status.textContent?.trim(),
      ),
    ).toContain('Ponto de encontro cadastrado com sucesso.');

    await openForm();
    await harness.navigateByUrl(listUrl);
    http.expectOne({ method: 'GET', url: endpoint }).flush([]);
    expect(harness.routeNativeElement?.textContent).not.toContain(
      'Ponto de encontro cadastrado com sucesso.',
    );
  });

  it('exibe o erro de unicidade do cadastro e mantém o formulário na página', async () => {
    await openForm();
    await fillForm();
    saveButton().click();
    http
      .expectOne({ method: 'POST', url: endpoint })
      .flush(
        { message: 'Já existe um ponto de encontro com este nome neste endereço.' },
        { status: 409, statusText: 'Conflict' },
      );
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'Já existe um ponto de encontro com este nome neste endereço.',
    );
    expect(router.url).toBe(createUrl);
    expect(input('name').value).toBe(' Biblioteca Central ');
  });
});
