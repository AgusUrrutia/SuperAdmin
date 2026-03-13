import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

}
