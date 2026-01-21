import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideHighcharts } from 'highcharts-angular';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorHandlerInterceptor } from './core/interceptors/error-handler.interceptor';
import { retryInterceptor } from './core/interceptors/retry.interceptor';

import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { ProfileEffects } from './core/store/profile/profile.effect';
import { profileReducer } from './core/store/profile/profile.reducer';
import { SchoolEffects } from './core/store/school/school.effect';
import { schoolReducer } from './core/store/school/school.reducer';
import { NotificationEffects } from './core/store/notification/notification.effect';
import { notificationReducer } from './core/store/notification/notification.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([errorHandlerInterceptor, retryInterceptor, authInterceptor])
    ),
    provideStore({
      profile: profileReducer,
      school: schoolReducer,
      notification: notificationReducer,
    }),
    provideEffects([ProfileEffects, SchoolEffects, NotificationEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideHighcharts(),
    provideNativeDateAdapter(),
  ],
};
