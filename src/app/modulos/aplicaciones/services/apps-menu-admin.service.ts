import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as proyectSettings from '../../../core/services/proyectSettings';
import Swal from 'sweetalert2';

// Fila del menu de apps (EK_Apps_Menu) tal como la devuelve /ek-apps-menu/all y /get/{id}
export interface AppMenuAdmin {
    ID: number;
    ID_SISTEMA: number | null;
    SISTEMA: string | null;
    APP_NAME: string;
    DESCRIPCION: string | null;
    IMAGE: string | null;
    IMAGE_URL: string | null;
    LINK: string;
    ORDEN: number;
    ACTIVO: boolean;
    ABRIR_EN_NUEVA_PESTANA: boolean;
    GRUPOS_PERMITIDOS: string[];
}

// App del catalogo (SISTEMA) con cuantos usuarios y filas del menu la usan
export interface SistemaAdmin {
    ID: number;
    SISTEMA: string;
    NOMBRE: string | null;
    USUARIOS: number;
    FILAS_MENU: number;
    // Cantidad de roles y grupos propios de la app (la API vieja no los manda)
    ROLES?: number;
    GRUPOS?: number;
}

// Rol o grupo propio de una app (SISTEMA_ROL / SISTEMA_GRUPO). Son independientes entre si.
export type TipoRolGrupo = 'rol' | 'grupo';

export interface RolGrupoApp {
    ID: number;
    ID_SISTEMA: number;
    NOMBRE: string;
    DESCRIPCION: string | null;
    ACTIVO: boolean;
    USUARIOS: number; // cuentas que lo tienen asignado
}

export interface RolesGruposApp {
    roles: RolGrupoApp[];
    grupos: RolGrupoApp[];
}

// IDs asignados a una cuenta (de todas las apps)
export interface AsignacionesUsuario {
    roles: number[];
    grupos: number[];
}

export interface ItemNuevoRolGrupo {
    NOMBRE: string;
    DESCRIPCION?: string | null;
}

// Alta completa: sistema + fila del menu opcional + roles y grupos, en una transaccion
export interface NuevaAplicacion {
    SISTEMA: string;
    NOMBRE: string | null;
    MENU: {
        IMAGE: string | null;
        LINK: string;
        ORDEN: number;
        ACTIVO: boolean;
        ABRIR_EN_NUEVA_PESTANA: boolean;
    } | null;
    ROLES: ItemNuevoRolGrupo[];
    GRUPOS: ItemNuevoRolGrupo[];
}

export interface LogoMenu {
    file: string;
    url: string;
}

// ABM del menu de apps y del catalogo de apps (rutas /ek-apps-menu/* de la API comun).
// La API exige el rol Superadmin. APP_NAME y DESCRIPCION del menu salen del SISTEMA vinculado (no se envian).
@Injectable({
    providedIn: 'root'
})
export class AppsMenuAdminService {
    private url: string = proyectSettings.onlineUrlBase;

    constructor(private http: HttpClient) { }

    private makeHeaders(): HttpHeaders {
        let token = '';
        try {
            token = JSON.parse(sessionStorage.getItem('user') || '{}').token || '';
        } catch {
            /* ignore */
        }
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    // ---------- Menu ----------

    getApps(): Observable<AppMenuAdmin[]> {
        return this.http.get<AppMenuAdmin[]>(`${this.url}ek-apps-menu/all`, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al obtener el menú de aplicaciones', err)));
    }

    getApp(id: number): Observable<AppMenuAdmin> {
        return this.http.get<AppMenuAdmin>(`${this.url}ek-apps-menu/get/${id}`, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al obtener la aplicación', err)));
    }

    // ID mas solo los campos que cambian
    updateApp(payload: any): Observable<any> {
        return this.http.post<any>(`${this.url}ek-apps-menu/update`, payload, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al actualizar la aplicación', err)));
    }

    // Baja logica (ACTIVO = 0); para reactivar se usa updateApp con ACTIVO = true
    desactivarApp(id: number): Observable<any> {
        return this.http.post<any>(`${this.url}ek-apps-menu/delete/${id}`, {}, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al desactivar la aplicación', err)));
    }

    getLogos(): Observable<LogoMenu[]> {
        return this.http.get<LogoMenu[]>(`${this.url}ek-apps-menu/logos`, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al obtener los logos', err)));
    }

    // ---------- Catalogo SISTEMA ----------

    getSistemas(): Observable<SistemaAdmin[]> {
        return this.http.get<SistemaAdmin[]>(`${this.url}ek-apps-menu/sistemas`, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al obtener los sistemas', err)));
    }

    // Solo se puede cambiar el nombre largo; la sigla no se modifica
    updateSistema(payload: { ID: number, NOMBRE: string | null }): Observable<any> {
        return this.http.post<any>(`${this.url}ek-apps-menu/sistemas/update`, payload, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al actualizar el sistema', err)));
    }

    crearAplicacion(payload: NuevaAplicacion): Observable<any> {
        return this.http.post<any>(`${this.url}ek-apps-menu/aplicaciones/create`, payload, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al crear la aplicación', err)));
    }

    // ---------- Roles y grupos propios de cada app ----------

    private rutaTipo(tipo: TipoRolGrupo): string {
        return tipo === 'rol' ? 'roles' : 'grupos';
    }

    // Sin idSistema trae los de todas las apps
    getRolesGrupos(idSistema?: number): Observable<RolesGruposApp> {
        const ruta = idSistema != null ? `ek-apps-menu/sistemas/${idSistema}/roles-grupos` : 'ek-apps-menu/roles-grupos';
        return this.http.get<RolesGruposApp>(`${this.url}${ruta}`, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al obtener los roles y grupos', err)));
    }

    crearRolGrupo(tipo: TipoRolGrupo, payload: { ID_SISTEMA: number, NOMBRE: string, DESCRIPCION: string | null }): Observable<any> {
        return this.http.post<any>(`${this.url}ek-apps-menu/sistemas/${this.rutaTipo(tipo)}/create`, payload, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError(`Error al crear el ${tipo}`, err)));
    }

    // ID mas solo los campos que cambian (NOMBRE, DESCRIPCION, ACTIVO)
    updateRolGrupo(tipo: TipoRolGrupo, payload: any): Observable<any> {
        return this.http.post<any>(`${this.url}ek-apps-menu/sistemas/${this.rutaTipo(tipo)}/update`, payload, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError(`Error al actualizar el ${tipo}`, err)));
    }

    // La API solo lo borra si ninguna cuenta lo tiene asignado (si no, 409)
    eliminarRolGrupo(tipo: TipoRolGrupo, id: number): Observable<any> {
        return this.http.post<any>(`${this.url}ek-apps-menu/sistemas/${this.rutaTipo(tipo)}/delete/${id}`, {}, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError(`Error al eliminar el ${tipo}`, err)));
    }

    getAsignacionesUsuario(idUsuario: number | string): Observable<AsignacionesUsuario> {
        return this.http.get<AsignacionesUsuario>(`${this.url}ek-apps-menu/usuario/${idUsuario}/roles-grupos`, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError('Error al obtener los roles y grupos del usuario', err)));
    }

    // Asigna o quita un rol/grupo a una cuenta; devuelve las asignaciones actualizadas en data
    cambiarAsignacion(accion: 'add' | 'remove', payload: { ID_USUARIO: number | string, TIPO: TipoRolGrupo, ID: number }): Observable<any> {
        const titulo = accion === 'add' ? `Error al asignar el ${payload.TIPO}` : `Error al quitar el ${payload.TIPO}`;
        return this.http.post<any>(`${this.url}ek-apps-menu/usuario/roles-grupos/${accion}`, payload, { headers: this.makeHeaders() })
            .pipe(catchError(err => this.manejarError(titulo, err)));
    }

    private manejarError(titulo: string, error: any): Observable<never> {
        console.error(titulo, error);
        const texto = error?.error?.error || error?.error?.message || error?.message || 'Ocurrió un error inesperado. Por favor, intente más tarde.';
        Swal.fire({ icon: 'error', title: titulo, text: texto, confirmButtonText: 'Aceptar', confirmButtonColor: '#222' });
        return throwError(() => error);
    }
}
