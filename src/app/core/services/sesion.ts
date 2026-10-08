// Guarda la sesión del usuario. La usan el login y el ingreso por SSO (core/services/sso.ts),
// así las dos entradas dejan exactamente lo mismo en localStorage/sessionStorage.
// `datos` es la respuesta de POST /login o de GET /verification (mismo formato, sin el token).
// `tokenB2B` es el token del módulo B2B (ver UsuarioService.tokenB2B): el mismo `token` cuando la API
// del B2B usa la base común, el de su propio login si no, o null si no se pudo obtener.
export function guardarSesion(datos: any, token: string, tokenB2B: string | null = token): void {
  localStorage.setItem('token', token);
  const user = {
    token: token,
    'update-token': datos['update-token'],
    formulariosSGS: datos.formulariosSGS,
    usuario: datos.usuario,
    grupos: datos.grupos,
    roles: datos.roles,
    // Apps asignadas al usuario (por ID); se usan para filtrar el menu de apps
    sistemas_permitidos_ids: datos.sistemas_permitidos_ids,
    // El módulo B2B lee este campo
    tokenB2B: tokenB2B
  };
  sessionStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('usuario', datos.usuario);
  if (tokenB2B) {
    localStorage.setItem('tokenB2B', tokenB2B);
  } else {
    localStorage.removeItem('tokenB2B');
  }
}
