import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CepService } from './cep.service';
import {
  CEP_NOT_FOUND_ERROR,
  CEP_NETWORK_ERROR,
  ViaCepResponse,
} from '../models/meeting-point.model';

describe('CepService (CA8, CA9, CA10)', () => {
  let service: CepService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CepService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CepService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('CA8 — Consulta automática de CEP', () => {
    it('dispatches GET to ViaCEP with sanitized 8-digit CEP and maps address fields', async () => {
      const mockViaCepResponse: ViaCepResponse = {
        cep: '80230-901',
        logradouro: 'Avenida Sete de Setembro',
        complemento: '3165',
        bairro: 'Rebouças',
        localidade: 'Curitiba',
        uf: 'PR',
      };

      const addressPromise = firstValueFrom(service.lookup('80230-901'));

      const req = httpTesting.expectOne('https://viacep.com.br/ws/80230901/json/');
      expect(req.request.method).toBe('GET');
      req.flush(mockViaCepResponse);

      const address = await addressPromise;
      expect(address).toEqual({
        cep: '80230-901',
        street: 'Avenida Sete de Setembro',
        neighborhood: 'Rebouças',
        city: 'Curitiba',
        state: 'PR',
      });
    });

    it('works with unmasked 8-digit CEP', async () => {
      const mockViaCepResponse: ViaCepResponse = {
        cep: '80230-901',
        logradouro: 'Avenida Sete de Setembro',
        bairro: 'Rebouças',
        localidade: 'Curitiba',
        uf: 'PR',
      };

      const addressPromise = firstValueFrom(service.lookup('80230901'));

      const req = httpTesting.expectOne('https://viacep.com.br/ws/80230901/json/');
      req.flush(mockViaCepResponse);

      const address = await addressPromise;
      expect(address.city).toBe('Curitiba');
      expect(address.state).toBe('PR');
    });
  });

  describe('CA9 — Erro de CEP inválido ou não encontrado', () => {
    it('synchronously rejects CEPs with fewer than 8 digits without making HTTP call', async () => {
      await expect(firstValueFrom(service.lookup('1234567'))).rejects.toThrow(
        CEP_NOT_FOUND_ERROR,
      );
      httpTesting.expectNone('https://viacep.com.br/ws/1234567/json/');
    });

    it('synchronously rejects CEPs with more than 8 digits without making HTTP call', async () => {
      await expect(firstValueFrom(service.lookup('123456789'))).rejects.toThrow(
        CEP_NOT_FOUND_ERROR,
      );
      httpTesting.expectNone('https://viacep.com.br/ws/123456789/json/');
    });

    it('synchronously rejects empty or non-numeric strings without making HTTP call', async () => {
      await expect(firstValueFrom(service.lookup('abcdefgh'))).rejects.toThrow(
        CEP_NOT_FOUND_ERROR,
      );
      await expect(firstValueFrom(service.lookup(''))).rejects.toThrow(
        CEP_NOT_FOUND_ERROR,
      );
      httpTesting.expectNone('https://viacep.com.br/ws//json/');
    });

    it('rejects when ViaCEP returns { erro: "true" }', async () => {
      const addressPromise = firstValueFrom(service.lookup('99999-999'));

      const req = httpTesting.expectOne('https://viacep.com.br/ws/99999999/json/');
      req.flush({ erro: 'true' });

      await expect(addressPromise).rejects.toThrow(CEP_NOT_FOUND_ERROR);
    });

    it('rejects when ViaCEP returns { erro: true }', async () => {
      const addressPromise = firstValueFrom(service.lookup('99999999'));

      const req = httpTesting.expectOne('https://viacep.com.br/ws/99999999/json/');
      req.flush({ erro: true });

      await expect(addressPromise).rejects.toThrow(CEP_NOT_FOUND_ERROR);
    });
  });

  describe('CA10 — Resiliência a falhas de rede no ViaCEP', () => {
    it('returns clear network error message on HTTP 500 error', async () => {
      const addressPromise = firstValueFrom(service.lookup('80230-901'));

      const req = httpTesting.expectOne('https://viacep.com.br/ws/80230901/json/');
      req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });

      await expect(addressPromise).rejects.toThrow(CEP_NETWORK_ERROR);
    });

    it('returns clear network error message on HTTP 404 error', async () => {
      const addressPromise = firstValueFrom(service.lookup('80230-901'));

      const req = httpTesting.expectOne('https://viacep.com.br/ws/80230901/json/');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      await expect(addressPromise).rejects.toThrow(CEP_NETWORK_ERROR);
    });

    it('returns clear network error message on network failure / offline', async () => {
      const addressPromise = firstValueFrom(service.lookup('80230-901'));

      const req = httpTesting.expectOne('https://viacep.com.br/ws/80230901/json/');
      req.error(new ProgressEvent('error'));

      await expect(addressPromise).rejects.toThrow(CEP_NETWORK_ERROR);
    });
  });

  describe('Utility methods: cleanCep & isValidCep', () => {
    it('cleanCep removes formatting characters', () => {
      expect(service.cleanCep('80230-901')).toBe('80230901');
      expect(service.cleanCep(' 80.230-901 ')).toBe('80230901');
      expect(service.cleanCep('abc')).toBe('');
    });

    it('isValidCep validates 8-digit numeric strings', () => {
      expect(service.isValidCep('80230901')).toBe(true);
      expect(service.isValidCep('80230-901')).toBe(true);
      expect(service.isValidCep('8023090')).toBe(false);
      expect(service.isValidCep('802309011')).toBe(false);
      expect(service.isValidCep('abcdefgh')).toBe(false);
      expect(service.isValidCep('')).toBe(false);
    });
  });
});
