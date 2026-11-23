import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  CEP_NETWORK_ERROR,
  CEP_NOT_FOUND_ERROR,
  CepAddress,
  ViaCepResponse,
} from '../models/meeting-point.model';

const VIACEP_BASE_URL = 'https://viacep.com.br/ws';

@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly http = inject(HttpClient);

  /**
   * Sanitizes a CEP string by stripping all non-digit characters.
   */
  cleanCep(cep: string): string {
    return (cep || '').replace(/\D/g, '');
  }

  /**
   * Validates if the given string represents an 8-digit CEP.
   */
  isValidCep(cep: string): boolean {
    const cleaned = this.cleanCep(cep);
    return /^\d{8}$/.test(cleaned);
  }

  /**
   * Queries ViaCEP for address information corresponding to the provided CEP.
   * Rejects if the CEP is malformed, not found in the postal database, or if a network error occurs.
   */
  lookup(cep: string): Observable<CepAddress> {
    const cleaned = this.cleanCep(cep);

    if (!this.isValidCep(cleaned)) {
      return throwError(() => new Error(CEP_NOT_FOUND_ERROR));
    }

    return this.http.get<ViaCepResponse>(`${VIACEP_BASE_URL}/${cleaned}/json/`).pipe(
      map((response) => {
        if (response.erro === true || response.erro === 'true') {
          throw new Error(CEP_NOT_FOUND_ERROR);
        }

        return this.mapToCepAddress(response, cleaned);
      }),
      catchError((error: unknown) => {
        if (error instanceof Error && error.message === CEP_NOT_FOUND_ERROR) {
          return throwError(() => error);
        }

        return throwError(() => new Error(CEP_NETWORK_ERROR));
      }),
    );
  }

  private mapToCepAddress(response: ViaCepResponse, fallbackCep: string): CepAddress {
    return {
      cep: response.cep || fallbackCep,
      street: response.logradouro || '',
      neighborhood: response.bairro || '',
      city: response.localidade || '',
      state: response.uf || '',
    };
  }
}
