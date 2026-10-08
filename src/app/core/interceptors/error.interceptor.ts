import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Marca para requests cuyo 403 es una respuesta esperada y no un fin de sesión
// (p. ej. comprobar si la API del B2B acepta el token, ver UsuarioService.tokenB2B).
export const SIN_LOGOUT_EN_403 = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 403 && !req.context.get(SIN_LOGOUT_EN_403)) {
                sessionStorage.removeItem('user');
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
