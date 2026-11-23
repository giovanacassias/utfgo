import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { API_URL } from '../../../core/api-url.token';
import { CreateMeetingPointPayload, MeetingPoint } from '../models/meeting-point.model';

export const DUPLICATE_MEETING_POINT_ERROR =
  'Já existe um ponto de encontro com este nome neste endereço.';

const LOAD_ERROR = 'Não foi possível carregar os pontos de encontro. Tente novamente.';
const CREATE_ERROR = 'Não foi possível cadastrar o ponto de encontro. Tente novamente.';
const TOGGLE_ERROR = 'Não foi possível atualizar o status do ponto de encontro. Tente novamente.';
const NOT_FOUND_ERROR = 'Ponto de encontro não encontrado.';
const NETWORK_ERROR =
  'Não foi possível conectar ao servidor de pontos de encontro. Verifique sua conexão e tente novamente.';

export interface MeetingPointDetails {
  point: MeetingPoint | null;
  error: string | null;
}

/** Manages the meeting point list, creation with uniqueness check and soft delete (status toggle). */
@Injectable({ providedIn: 'root' })
export class MeetingPointsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  // TODO #2: Replace the shared json-server base URL and REST calls with NestJS meeting-points endpoints.
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');

  private readonly _points = signal<MeetingPoint[]>([]);
  private readonly _loadingLoad = signal<boolean>(false);
  private readonly _loadingCreate = signal<boolean>(false);
  private readonly pendingToggles = signal(0);
  private readonly _error = signal<string | null>(null);

  readonly points = this._points.asReadonly();
  readonly loading = {
    load: this._loadingLoad.asReadonly(),
    create: this._loadingCreate.asReadonly(),
    toggle: computed(() => this.pendingToggles() > 0),
  };
  readonly isLoading = computed(
    () => this.loading.load() || this.loading.create() || this.loading.toggle(),
  );
  readonly error = this._error.asReadonly();

  /** Loads every meeting point from the backend. */
  async loadPoints(): Promise<void> {
    this._loadingLoad.set(true);
    this._error.set(null);

    try {
      // TODO #2: Replace json-server GET with the NestJS meeting-points listing endpoint.
      const points = await firstValueFrom(
        this.http.get<MeetingPoint[]>(`${this.apiUrl}/meeting-points`),
      );

      this._points.set(points);
    } catch (err: unknown) {
      this._error.set(this.formatError(err, LOAD_ERROR));
    } finally {
      this._loadingLoad.set(false);
    }
  }

  loadPoint(id: string): Observable<MeetingPointDetails> {
    const url = `${this.apiUrl}/meeting-points/${encodeURIComponent(id)}`;
    return this.http.get<MeetingPoint>(url).pipe(
      map((point) => {
        this.storePoint(point);
        return { point, error: null };
      }),
      catchError((err: unknown) =>
        of({
          point: null,
          error:
            err instanceof HttpErrorResponse && err.status === 404
              ? null
              : this.formatError(err, LOAD_ERROR),
        }),
      ),
    );
  }

  /** Creates a meeting point with isActive forced to true, unless name + address duplicate an existing one. */
  async createPoint(payload: CreateMeetingPointPayload): Promise<MeetingPoint | null> {
    if (this._loadingCreate()) {
      return null;
    }

    if (this.hasDuplicate(payload.name, payload.address)) {
      this._error.set(DUPLICATE_MEETING_POINT_ERROR);
      return null;
    }

    this._loadingCreate.set(true);
    this._error.set(null);

    try {
      // TODO #2: Replace json-server POST with the NestJS meeting-points creation endpoint.
      const created = await firstValueFrom(
        this.http.post<MeetingPoint>(`${this.apiUrl}/meeting-points`, {
          ...payload,
          isActive: true,
        }, this.writeOptions()),
      );

      this._points.update((current) => [created, ...current]);
      return created;
    } catch (err: unknown) {
      this._error.set(this.formatError(err, CREATE_ERROR));
      return null;
    } finally {
      this._loadingCreate.set(false);
    }
  }

  /** Toggles isActive through PATCH, replacing the list item with the server response (no physical deletion). */
  async toggleStatus(id: string): Promise<MeetingPoint | null> {
    const url = `${this.apiUrl}/meeting-points/${encodeURIComponent(id)}`;
    this.pendingToggles.update((pending) => pending + 1);
    this._error.set(null);

    try {
      const currentPoint =
        this._points().find((point) => point.id === id) ??
        (await firstValueFrom(this.http.get<MeetingPoint>(url)));

      // TODO #2: Replace json-server PATCH with the NestJS meeting-points status endpoint.
      const updated = await firstValueFrom(
        this.http.patch<MeetingPoint>(url, { isActive: !currentPoint.isActive }, this.writeOptions()),
      );

      this.storePoint(updated);
      return updated;
    } catch (err: unknown) {
      this._error.set(
        err instanceof HttpErrorResponse && err.status === 404
          ? NOT_FOUND_ERROR
          : this.formatError(err, TOGGLE_ERROR),
      );
      return null;
    } finally {
      this.pendingToggles.update((pending) => pending - 1);
    }
  }

  private storePoint(point: MeetingPoint): void {
    this._points.update((current) => {
      if (!current.some(({ id }) => id === point.id)) {
        return [...current, point];
      }

      return current.map((item) => item.id === point.id ? point : item);
    });
  }

  private hasDuplicate(name: string, address: string): boolean {
    const normalizedName = this.normalize(name);
    const normalizedAddress = this.normalize(address);

    return this._points().some(
      (point) =>
        this.normalize(point.name) === normalizedName &&
        this.normalize(point.address) === normalizedAddress,
    );
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
      .replace(/\s+/g, ' ').replace(/\s*([,/—])\s*/g, '$1');
  }

  private writeOptions(): { headers?: Record<string, string> } {
    const token = this.auth.session()?.token;
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  private formatError(err: unknown, fallbackMessage: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401 || err.status === 403) {
        return 'Entre novamente com uma conta de administrador para gerenciar pontos de encontro.';
      }
      if (err.status === 0) {
        return NETWORK_ERROR;
      }

      if (err.status === 409 || err.status === 422) {
        const serverMessage =
          typeof err.error?.message === 'string' ? err.error.message.trim() : '';
        return serverMessage || (err.status === 409 ? DUPLICATE_MEETING_POINT_ERROR : fallbackMessage);
      }
    }

    return fallbackMessage;
  }
}
