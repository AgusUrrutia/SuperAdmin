import { Injectable } from '@angular/core';
import { UsuarioService } from '../../b2b/services/usuario.service';
import * as proyectSettings from '../../../core/services/proyectSettings';

// Mismo servicio que el del B2B pero apuntando a la API comun (api.ranko) con el token de SGS.
// Lo usa SGS para el modal de roles, que sigue pegandole a la API comun.
@Injectable()
export class UsuarioRolesSgsService extends UsuarioService {
  protected override url: string = proyectSettings.onlineUrlBase;
  protected override tokenKey: string = 'token';
}
