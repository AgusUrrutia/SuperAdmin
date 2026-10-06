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

    private manejarError(titulo: string, error: any): Observable<never> {
        console.error(titulo, error);
        const texto = error?.error?.error || error?.error?.message || error?.message || 'Ocurrió un error inesperado. Por favor, intente más tarde.';
        Swal.fire({ icon: 'error', title: titulo, text: texto, confirmButtonText: 'Aceptar', confirmButtonColor: '#222' });
        return throwError(() => error);
    }
}
