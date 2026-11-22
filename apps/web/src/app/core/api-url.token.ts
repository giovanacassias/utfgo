import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

// TODO #2: Point API_URL to the NestJS API once backend integration replaces json-server.
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.walletApiUrl,
});
