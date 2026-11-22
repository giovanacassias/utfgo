import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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

/** Manages the meeting point list, creation with uniqueness check and soft delete (status toggle). */
@Injectable({ providedIn: 'root' })
export class MeetingPointsService {
  private readonly http = inject(HttpClient);
  // TODO #2: Replace the shared json-server base URL and REST calls with NestJS meeting-points endpoints.
  private readonly apiUrl = inject(API_URL).replace(/\/+$/, '');

  private readonly _points = signal<MeetingPoint[]>([]);
  private readonly _loadingLoad = signal<boolean>(false);
  private readonly _loadingCreate = signal<boolean>(false);
  private readonly _loadingToggle = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly points = this._points.asReadonly();
  readonly loading = {
    load: this._loadingLoad.asReadonly(),
    create: this._loadingCreate.asReadonly(),
    toggle: this._loadingToggle.asReadonly(),
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
        }),
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
    const currentPoint = this._points().find((point) => point.id === id);
    if (!currentPoint) {
      this._error.set(NOT_FOUND_ERROR);
      return null;
    }

    this._loadingToggle.set(true);
    this._error.set(null);

    try {
      // TODO #2: Replace json-server PATCH with the NestJS meeting-points status endpoint.
      const updated = await firstValueFrom(
        this.http.patch<MeetingPoint>(`${this.apiUrl}/meeting-points/${id}`, {
          isActive: !currentPoint.isActive,
        }),
      );

      this._points.update((current) =>
        current.map((point) => (point.id === id ? updated : point)),
      );
      return updated;
    } catch (err: unknown) {
      this._error.set(this.formatError(err, TOGGLE_ERROR));
      return null;
    } finally {
      this._loadingToggle.set(false);
    }
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
    return value.trim().toLowerCase();
  }

  private formatError(err: unknown, fallbackMessage: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return NETWORK_ERROR;
      }

      const serverMessage =
        typeof err.error?.message === 'string' ? err.error.message.trim() : '';
      if (serverMessage) {
        return serverMessage;
      }
      if (err.status === 409) {
        return DUPLICATE_MEETING_POINT_ERROR;
      }
    }

    return fallbackMessage;
  }
}
