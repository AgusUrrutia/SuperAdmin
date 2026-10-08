import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { SIN_LOGOUT_EN_403 } from '../interceptors/error.interceptor';
import * as myGlobals from './proyectSettings';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private url: string = ""


    constructor(private http: HttpClient) {
        let transferenciaUrl = "/";
        if (myGlobals.localServerUrl) {
            this.url = myGlobals.localUrlBase;
        } else {
            this.url = myGlobals.onlineUrlBase;
        }
    }

    login(usuario: string, contraseña: string): Observable<any> {

        const body = {
            user: usuario,
            password: contraseña
        };


        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });


        return this.http.post<any>(`${this.url}/login`, body, { headers });
    }

    // Login contra la API productiva del B2B (rankodigital) para obtener su token
    loginB2B(usuario: string, contraseña: string): Observable<any> {

        const body = {
            user: usuario,
            password: contraseña
        };


        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });


        return this.http.post<any>(`${myGlobals.b2bUrlBase}login`, body, { headers });
    }

    // Token a usar en el módulo B2B (API de rankodigital), compatible con los dos estados:
    // - Si la API del B2B ya valida contra la base común EK_SEGURIDAD, acepta el mismo token del login
    //   (se comprueba con /verification, que no genera token nuevo) y se usa ese.
    // - Si todavía usa su propia base, lo rechaza: se hace el login del B2B como antes. Sin contraseña
    //   (ingreso por SSO) no hay segundo login y el módulo B2B queda sin token.
    // Devuelve null si no se pudo obtener ninguno.
    tokenB2B(token: string, usuario?: string, contraseña?: string): Observable<string | null> {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        const context = new HttpContext().set(SIN_LOGOUT_EN_403, true);
        return this.http.get<any>(`${myGlobals.b2bUrlBase}verification`, { headers, context }).pipe(
            map(() => token as string | null),
            catchError(() => {
                if (!usuario || !contraseña) return of(null);
                return this.loginB2B(usuario, contraseña).pipe(
                    map((r: any) => (r?.token as string) || null),
                    catchError((e) => { console.error('Error durante el login B2B:', e); return of(null); })
                );
            })
        );
    }

}
