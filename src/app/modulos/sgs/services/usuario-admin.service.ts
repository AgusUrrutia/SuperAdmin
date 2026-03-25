import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as proyectSettings from '../../../core/services/proyectSettings';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class UsuarioAdminService {
    private url: string = proyectSettings.onlineUrlBase;

    constructor(private http: HttpClient) { }

    private makeHeaders(): HttpHeaders {
        let token = '';
        try {
            const userStorage = sessionStorage.getItem('user') || localStorage.getItem('user');
            if (userStorage) {
                const userData = JSON.parse(userStorage);
                token = userData.token || '';
            }
        } catch (e) {
            console.warn('Error parsing user storage:', e);
        }
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    private users = new BehaviorSubject<any[] | null>(null);
    users$ = this.users.asObservable();

    getUsers(estado: string = 'all', fetch: number = 100, offset: number = 0, buscar: string = ''): Observable<any> {
        const headers = this.makeHeaders();
        let endpoint = `${this.url}/ek-usuarios/${estado}/${fetch}/${offset}/`;
        if (buscar) {
            endpoint += buscar;
        }

        return this.http.get<any>(endpoint, { headers }).pipe(
            catchError(error => {
                console.error('Error al obtener los usuarios:', error);
                this.showErrorAlert('Error al obtener los usuarios', this.extractErrorMessage(error));
                return of([]);
            })
        );
    }

    getUserById(id: string): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.get<any>(`${this.url}/ek-usuarios/get/${id}`, { headers }).pipe(
            catchError(error => {
                console.error('Error al obtener el usuario:', error);
                this.showErrorAlert('Error al obtener el usuario', this.extractErrorMessage(error));
                return of(null);
            })
        );
    }

    private aplicacionesCache = new BehaviorSubject<any[] | null>(null);

    getAplicaciones(): Observable<any> {
        if (this.aplicacionesCache.value !== null) {
            return of(this.aplicacionesCache.value);
        }

        const headers = this.makeHeaders();
        return this.http.get<any>(`${this.url}/aplicaciones/get`, { headers }).pipe(
            tap(res => {
                this.aplicacionesCache.next(res.data ? res.data : res);
            }),
            catchError(error => {
                console.error('Error al obtener las aplicaciones:', error);
                this.showErrorAlert('Error al obtener las aplicaciones', this.extractErrorMessage(error));
                return of([]);
            })
        );
    }

    createUser(userData: any): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(`${this.url}/ek-usuarios/create`, userData, { headers }).pipe(
            tap(() => this.reloadUsers()),
            catchError(error => {
                console.error('Error al crear el usuario:', error);
                this.showErrorAlert('Error al crear el usuario', this.extractErrorMessage(error));
                throw error;
            })
        );
    }

    updateUser(userData: any): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(`${this.url}/ek-usuarios/update`, userData, { headers }).pipe(
            tap(() => this.reloadUsers()),
            catchError(error => {
                console.error('Error al actualizar el usuario:', error);
                this.showErrorAlert('Error al actualizar el usuario', this.extractErrorMessage(error));
                throw error;
            })
        );
    }

    deleteUser(id: string): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.get<any>(`${this.url}/ek-usuarios/delete/${id}`, { headers }).pipe(
            tap(() => this.reloadUsers()),
            catchError(error => {
                console.error('Error al eliminar el usuario:', error);
                this.showErrorAlert('Error al eliminar el usuario', this.extractErrorMessage(error));
                throw error;
            })
        );
    }

    addAplicacionToUser(payload: { ID_USUARIO: number | string, ID_SISTEMA: number | string }): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(`${this.url}/aplicaciones/add`, payload, { headers }).pipe(
            catchError(error => {
                console.error('Error al agregar aplicación al usuario:', error);
                this.showErrorAlert('Error al agregar aplicación', this.extractErrorMessage(error));
                throw error;
            })
        );
    }

    deleteAplicacionFromUser(payload: { ID_USUARIO: number | string, ID_SISTEMA: number | string }): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(`${this.url}/aplicaciones/delete`, payload, { headers }).pipe(
            catchError(error => {
                console.error('Error al quitar aplicación al usuario:', error);
                this.showErrorAlert('Error al quitar aplicación', this.extractErrorMessage(error));
                throw error;
            })
        );
    }

    reloadUsers(estado: string = 'all', fetch: number = 100, offset: number = 0, buscar: string = ''): void {
        this.getUsers(estado, fetch, offset, buscar).subscribe(res => {
            if (res) {
                this.users.next(res);
            }
        });
    }

    private showErrorAlert(title: string, text: string): void {
        Swal.fire({
            icon: 'error',
            title: title,
            text: text,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#222'
        });
    }

    private extractErrorMessage(error: any): string {
        if (error?.error?.message) return error.error.message;
        if (error?.message) return error.message;
        return 'Ocurrió un error inesperado. Por favor, intente más tarde.';
    }
}
