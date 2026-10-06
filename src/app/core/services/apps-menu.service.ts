import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as proyectSettings from './proyectSettings';

export interface AppsMenuItem {
    id?: number;
    app_name: string;
    id_sistema: number | null;
    image: string | null;
    link: string;
    orden?: number;
    activo?: boolean;
    extras?: {
        abrir_en_nueva_pestana?: boolean;
        descripcion?: string | null;
        grupos_permitidos?: string[];
    };
}

// Esta misma app (ADMIN = id_sistema 5): no se muestra en su propio menu
const ID_SISTEMA_APP_ACTUAL = 5;

// Trae las apps del menu (icono de grilla del navbar) desde ek-apps-menu y muestra solo las que
// el usuario tiene asignadas: id_sistema tiene que estar en sistemas_permitidos_ids del usuario.
// Se compara siempre por ID, nunca por nombre. El orden es el que devuelve la API.
@Injectable({
    providedIn: 'root'
})
export class AppsMenuService {
    private url: string = proyectSettings.onlineUrlBase;

    // Apps del menu compartidas: el navbar se suscribe y se actualiza cuando alguien llama a recargar()
    // (ej: al editar una app en Aplicaciones -> Apps), sin recargar la pagina
    private apps = new BehaviorSubject<AppsMenuItem[]>([]);
    apps$ = this.apps.asObservable();

    constructor(private http: HttpClient) { }

    recargar(): void {
        this.getApps().subscribe(apps => this.apps.next(apps));
    }

    private getUser(): any {
        try {
            return JSON.parse(sessionStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    }

    private makeHeaders(): HttpHeaders {
        return new HttpHeaders({ Authorization: `Bearer ${this.getUser().token || ''}` });
    }

    // Apps del usuario: se piden siempre a /verification para tener los permisos actuales
    // (en SuperAdmin se editan permisos y el login guardado puede quedar desactualizado).
    // Si /verification falla, se usa lo guardado del login.
    // Si la API no devuelve sistemas_permitidos_ids (API vieja), se devuelve null y no se muestra ninguna app.
    private getSistemasPermitidosIds(): Observable<number[] | null> {
        const idsLogin = this.getUser().sistemas_permitidos_ids;
        const respaldo = Array.isArray(idsLogin) ? idsLogin : null;
        return this.http.get<any>(`${this.url}verification`, { headers: this.makeHeaders() }).pipe(
            map(res => Array.isArray(res?.sistemas_permitidos_ids) ? res.sistemas_permitidos_ids : null),
            catchError(error => {
                console.error('Error al obtener las apps del usuario:', error);
                return of(respaldo);
            })
        );
    }

    getApps(): Observable<AppsMenuItem[]> {
        const menu$ = this.http.get<AppsMenuItem[]>(`${this.url}ek-apps-menu`, { headers: this.makeHeaders() }).pipe(
            catchError(error => {
                console.error('Error al obtener el menu de aplicaciones:', error);
                return of([] as AppsMenuItem[]);
            })
        );

        return forkJoin({ menu: menu$, ids: this.getSistemasPermitidosIds() }).pipe(
            map(({ menu, ids }) => {
                const permitidos = new Set((ids ?? []).map(Number));
                return (menu || []).filter(app =>
                    app.id_sistema != null &&
                    permitidos.has(Number(app.id_sistema)) &&
                    Number(app.id_sistema) !== ID_SISTEMA_APP_ACTUAL
                );
            })
        );
    }
}
