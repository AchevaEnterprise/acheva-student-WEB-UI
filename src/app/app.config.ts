import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideHighcharts } from 'highcharts-angular';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorHandlerInterceptor } from './core/interceptors/error-handler.interceptor';
import { retryInterceptor } from './core/interceptors/retry.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([errorHandlerInterceptor, retryInterceptor, authInterceptor])
    ),
    provideHighcharts(),
    provideNativeDateAdapter(),
  ],
};
