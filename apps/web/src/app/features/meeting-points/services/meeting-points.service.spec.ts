import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { appConfig, WALLET_API_URL } from '../../../app.config';
import { API_URL } from '../../../core/api-url.token';
import { CreateMeetingPointPayload, MeetingPoint } from '../models/meeting-point.model';
import { MeetingPointsService } from './meeting-points.service';

const DUPLICATE_MESSAGE = 'Já existe um ponto de encontro com este nome neste endereço.';
const NETWORK_MESSAGE =
  'Não foi possível conectar ao servidor de pontos de encontro. Verifique sua conexão e tente novamente.';

describe('MeetingPointsService (CA11, CA12, CA14)', () => {
  const mockApiUrl = 'http://api.utfgo.test';

  const activePoint: MeetingPoint = {
    id: 'point-1',
    name: 'Entrada Principal — Câmpus Curitiba',
    address: 'Avenida Sete de Setembro, 3165 — Rebouças, Curitiba/PR',
    latitude: -25.4385,
    longitude: -49.2687,
    isActive: true,
    createdAt: '2026-11-01T12:00:00.000Z',
  };

  const inactivePoint: MeetingPoint = {
    id: 'point-2',
    name: 'Estação de Ônibus — Câmpus Curitiba',
    address: 'Avenida Sete de Setembro, 3165 — Rebouças, Curitiba/PR',
    latitude: -25.439,
    longitude: -49.269,
    isActive: false,
    createdAt: '2026-11-02T12:00:00.000Z',
  };

  const newPointPayload: CreateMeetingPointPayload = {
    name: 'Biblioteca Central',
    address: 'Avenida Sete de Setembro, 3165 — Rebouças, Curitiba/PR',
    latitude: -25.4392,
    longitude: -49.2694,
    isActive: true,
  };

  let service: MeetingPointsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: mockApiUrl },
      ],
    });

    service = TestBed.inject(MeetingPointsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  async function loadPoints(points: MeetingPoint[] = [activePoint, inactivePoint]): Promise<void> {
    const loadPromise = service.loadPoints();
    httpTesting.expectOne(`${mockApiUrl}/meeting-points`).flush(points);
    await loadPromise;
  }

  it('uses the generic API_URL token and keeps WALLET_API_URL provided in appConfig', () => {
    expect(appConfig.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provide: API_URL }),
        expect.objectContaining({ provide: WALLET_API_URL }),
      ]),
    );
  });

  it('starts with empty/default readonly signals', () => {
    expect(service.points()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.loading.load()).toBe(false);
    expect(service.loading.create()).toBe(false);
    expect(service.loading.toggle()).toBe(false);
    expect(service.error()).toBeNull();
  });

  describe('loading', () => {
    it('loads meeting points from GET /meeting-points', async () => {
      const loadPromise = service.loadPoints();
      expect(service.loading.load()).toBe(true);

      const req = httpTesting.expectOne(`${mockApiUrl}/meeting-points`);
      expect(req.request.method).toBe('GET');
      req.flush([activePoint, inactivePoint]);

      await loadPromise;

      expect(service.points()).toEqual([activePoint, inactivePoint]);
      expect(service.loading.load()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('keeps load and toggle indicators independent when both operations overlap', async () => {
      await loadPoints([activePoint]);

      const secondLoad = service.loadPoints();
      const getRequest = httpTesting.expectOne(`${mockApiUrl}/meeting-points`);
      const togglePromise = service.toggleStatus(activePoint.id);
      const patchRequest = httpTesting.expectOne(`${mockApiUrl}/meeting-points/${activePoint.id}`);

      expect(service.loading.load()).toBe(true);
      expect(service.loading.toggle()).toBe(true);
      expect(service.isLoading()).toBe(true);

      getRequest.flush([activePoint]);
      await secondLoad;

      expect(service.loading.load()).toBe(false);
      expect(service.loading.toggle()).toBe(true);
      expect(service.isLoading()).toBe(true);

      patchRequest.flush({ ...activePoint, isActive: false });
      await togglePromise;

      expect(service.loading.toggle()).toBe(false);
      expect(service.isLoading()).toBe(false);
    });

    it('reports a network failure on load instead of the generic load message', async () => {
      const loadPromise = service.loadPoints();

      httpTesting
        .expectOne(`${mockApiUrl}/meeting-points`)
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      await loadPromise;

      expect(service.error()).toBe(NETWORK_MESSAGE);
      expect(service.loading.load()).toBe(false);
      expect(service.points()).toEqual([]);
    });
  });

  describe('CA11 — Cadastro com dados válidos', () => {
    it('POSTs a new meeting point forcing isActive true regardless of the payload', async () => {
      const payload: CreateMeetingPointPayload = { ...newPointPayload, isActive: false };

      const createdPoint: MeetingPoint = {
        ...payload,
        id: 'point-new',
        isActive: true,
        createdAt: '2026-11-22T10:00:00.000Z',
      };

      const createPromise = service.createPoint(payload);

      const req = httpTesting.expectOne(`${mockApiUrl}/meeting-points`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ ...payload, isActive: true });
      req.flush(createdPoint);

      const created = await createPromise;

      expect(created).toEqual(createdPoint);
      expect(service.points()).toContainEqual(createdPoint);
      expect(service.error()).toBeNull();
      expect(service.loading.create()).toBe(false);
    });

    it('ignores a second createPoint while the first POST is still in flight', async () => {
      const first = service.createPoint(newPointPayload);
      const second = service.createPoint(newPointPayload);

      const requests = httpTesting.match(`${mockApiUrl}/meeting-points`);
      expect(requests).toHaveLength(1);
      expect(requests[0].request.method).toBe('POST');

      const createdPoint: MeetingPoint = {
        ...newPointPayload,
        id: 'point-new',
        createdAt: '2026-11-22T10:00:00.000Z',
      };
      requests[0].flush(createdPoint);

      expect(await first).toEqual(createdPoint);
      expect(await second).toBeNull();
      expect(service.points()).toEqual([createdPoint]);
      expect(service.error()).toBeNull();
    });
  });

  describe('CA12 — Bloqueio de duplicidade de nome', () => {
    it('blocks creation when name and address match an existing point after trim/case normalization', async () => {
      await loadPoints([activePoint]);

      const duplicatePayload: CreateMeetingPointPayload = {
        name: '  entrada principal — câmpus curitiba  ',
        address: '  AVENIDA SETE DE SETEMBRO, 3165 — REBOUÇAS, CURITIBA/PR  ',
        latitude: -25.4385,
        longitude: -49.2687,
        isActive: true,
      };

      const created = await service.createPoint(duplicatePayload);

      expect(created).toBeNull();
      expect(service.error()).toBe(DUPLICATE_MESSAGE);
      httpTesting.expectNone((req) => req.method === 'POST');
      expect(service.points()).toEqual([activePoint]);
    });

    it('shows the server uniqueness message when the local list is empty (direct link to /novo)', async () => {
      const created = service.createPoint(newPointPayload);

      const req = httpTesting.expectOne(`${mockApiUrl}/meeting-points`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: DUPLICATE_MESSAGE }, { status: 409, statusText: 'Conflict' });

      expect(await created).toBeNull();
      expect(service.error()).toBe(DUPLICATE_MESSAGE);
      expect(service.points()).toEqual([]);
      expect(service.loading.create()).toBe(false);
    });
  });

  describe('CA14 — Desativação / Reativação (Soft Delete)', () => {
    it('deactivates a point via PATCH /meeting-points/:id and updates the reactive state without DELETE', async () => {
      await loadPoints([activePoint, inactivePoint]);

      const togglePromise = service.toggleStatus(activePoint.id);

      const req = httpTesting.expectOne(`${mockApiUrl}/meeting-points/${activePoint.id}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ isActive: false });

      const updatedPoint: MeetingPoint = { ...activePoint, isActive: false };
      req.flush(updatedPoint);

      const updated = await togglePromise;

      expect(updated).toEqual(updatedPoint);
      expect(service.points()).toEqual([updatedPoint, inactivePoint]);
      expect(service.points()).toHaveLength(2);
      expect(service.loading.toggle()).toBe(false);
      httpTesting.expectNone((req) => req.method === 'DELETE');
    });

    it('reactivates an inactive point via PATCH /meeting-points/:id with isActive true', async () => {
      await loadPoints([inactivePoint]);

      const togglePromise = service.toggleStatus(inactivePoint.id);

      const req = httpTesting.expectOne(`${mockApiUrl}/meeting-points/${inactivePoint.id}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ isActive: true });

      const updatedPoint: MeetingPoint = { ...inactivePoint, isActive: true };
      req.flush(updatedPoint);

      const updated = await togglePromise;

      expect(updated).toEqual(updatedPoint);
      expect(service.points()).toEqual([updatedPoint]);
      httpTesting.expectNone((req) => req.method === 'DELETE');
    });

    it('preserves a server message on toggle failure instead of the generic toggle message', async () => {
      await loadPoints([activePoint]);

      const togglePromise = service.toggleStatus(activePoint.id);

      httpTesting
        .expectOne(`${mockApiUrl}/meeting-points/${activePoint.id}`)
        .flush({ message: 'Ponto bloqueado para alteração.' }, {
          status: 422,
          statusText: 'Unprocessable Entity',
        });

      expect(await togglePromise).toBeNull();
      expect(service.error()).toBe('Ponto bloqueado para alteração.');
      expect(service.points()).toEqual([activePoint]);
      expect(service.loading.toggle()).toBe(false);
    });
  });
});
