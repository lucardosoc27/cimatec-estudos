import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { USAR_MOCK, dadosMockInterceptor } from './services/mock/dados-mock';

// Necessário para o DatePipe escrever "quarta-feira, 16/09" em vez do formato inglês.
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    // Login, sessão e a chave de mentoria já vêm do Spring, pelo proxy do ng serve (URL relativa,
    // para o HttpClient mandar o X-XSRF-TOKEN). O resto de /api ainda é respondido no navegador
    // pelo mock de dados; com USAR_MOCK = false, tudo vai para o Spring.
    provideHttpClient(withInterceptors(USAR_MOCK ? [dadosMockInterceptor] : [])),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
