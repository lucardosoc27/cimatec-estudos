import {
  ApplicationConfig,
  LOCALE_ID,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { USAR_MOCK, dadosMockInterceptor } from './services/mock/dados-mock';
import { SESSAO_SIMULADA, sessaoSimuladaInterceptor } from './services/mock/sessao-simulada';

// Necessário para o DatePipe escrever "quarta-feira, 16/09" em vez do formato inglês.
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    // Enquanto o back-end não existe, os dois interceptors respondem às chamadas /api no navegador.
    // Cada um desliga pela sua constante; com as duas em false, tudo vai para o Spring pelo proxy.
    // A sessão simulada só existe em desenvolvimento (ng serve): um build de produção nunca a registra.
    provideHttpClient(withInterceptors([
      ...(SESSAO_SIMULADA && isDevMode() ? [sessaoSimuladaInterceptor] : []),
      ...(USAR_MOCK ? [dadosMockInterceptor] : []),
    ])),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
