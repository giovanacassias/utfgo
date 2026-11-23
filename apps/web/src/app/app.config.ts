import {
  ApplicationConfig,
  InjectionToken,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { API_URL } from './core/api-url.token';

// TODO #2: Point WALLET_API_URL to the NestJS API once backend integration replaces json-server.
export const WALLET_API_URL = new InjectionToken<string>('WALLET_API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    // TODO #2: Temporary json-server base URL providers until NestJS API integration.
    { provide: API_URL, useValue: environment.apiUrl },
    { provide: WALLET_API_URL, useExisting: API_URL },
  ],
};
