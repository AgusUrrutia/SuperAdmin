import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const userStorage = sessionStorage.getItem('user');

    if (!userStorage) {
        router.navigate(['/login']);
        return false;
    }
    /* Comentar bloque cuando se quiera probar el acceso a API solo 
    const user = JSON.parse(userStorage);
    const roles: string[] = user.roles || [];

    if (!roles.includes('Superadmin')) {
        sessionStorage.clear();
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        router.navigate(['/login']);
        return false;
    }
*/
    return true;
};
