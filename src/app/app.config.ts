import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ssoInitializer } from './core/services/sso';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([errorInterceptor])),
    importProvidersFrom(MatDialogModule),
    // Ingreso por SSO desde otra app (#sso=<token>)
    { provide: APP_INITIALIZER, useFactory: ssoInitializer, deps: [HttpClient], multi: true }
  ]
};
