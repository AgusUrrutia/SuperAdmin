import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { SIN_LOGOUT_EN_403 } from '../interceptors/error.interceptor';
import { firstValueFrom } from 'rxjs';
import * as proyectSettings from './proyectSettings';
import { guardarSesion } from './sesion';

// SSO entre apps (SGS, B2B, SUPERADMIN). Todas las APIs validan el token contra la base común
// EK_SEGURIDAD, así que el mismo token sirve en todas.
// - Al abrir otra app desde el menú de apps se le pasa el token en el fragmento: <link>#sso=<token>.
//   Va en el fragmento (#) porque el navegador no lo manda al servidor ni queda en logs.
// - Al arrancar, si la URL trae #sso=, se valida con GET /verification (no genera token nuevo, así
//   que no invalida la sesión de la app de origen), se guarda la sesión y se borra el fragmento.

const SSO_PARAM = 'sso';

export function linkConSso(link: string): string {
  if (!link) return link;
  let token = '';
  try {
    token = JSON.parse(sessionStorage.getItem('user') || '{}').token || '';
  } catch { }
  if (!token) return link;
  return `${link.split('#')[0]}#${SSO_PARAM}=${encodeURIComponent(token)}`;
}

function leerTokenSso(): string | null {
  const m = new RegExp(`[#&]${SSO_PARAM}=([^&]+)`).exec(window.location.hash);
  return m ? decodeURIComponent(m[1]) : null;
}

// APP_INITIALIZER: corre antes de la primera navegación, así el authGuard ya encuentra la sesión.
export function ssoInitializer(http: HttpClient) {
  return async () => {
    const token = leerTokenSso();
    if (!token) return;

    // Sacar el token de la URL y del historial antes de cualquier otra cosa
    history.replaceState(null, '', window.location.pathname + window.location.search);

    try {
      const datos: any = await firstValueFrom(
        http.get(`${proyectSettings.onlineUrlBase}verification`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      );
      // Mismo criterio que el login: SUPERADMIN solo para el rol Superadmin
      if (!(datos?.roles || []).includes('Superadmin')) return;
      // Módulo B2B: el mismo token si la API del B2B ya usa la base común; si no, queda sin token
      // (sin contraseña no hay login aparte). Ver UsuarioService.tokenB2B.
      let tokenB2B: string | null = null;
      try {
        await firstValueFrom(http.get(`${proyectSettings.b2bUrlBase}verification`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
          context: new HttpContext().set(SIN_LOGOUT_EN_403, true)
        }));
        tokenB2B = token;
      } catch { }
      guardarSesion(datos, token, tokenB2B);
    } catch (e) {
      // Token vencido o inválido: se sigue sin sesión y el authGuard manda al login
      console.error('SSO: no se pudo validar el token recibido', e);
    }
  };
}
