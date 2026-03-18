import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as proyectSettings from '../../../core/services/proyectSettings';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class GroupService {
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

    private groups = new BehaviorSubject<any[]>([]);
    groups$ = this.groups.asObservable();

    private users = new BehaviorSubject<any[]>([]);
    users$ = this.users.asObservable();

    private forms = new BehaviorSubject<any[]>([]);
    forms$ = this.forms.asObservable();

    private groupName = new BehaviorSubject<string>('');
    groupName$ = this.groupName.asObservable();

    setUsers(users: any[]): void {
        this.users.next(users);
    }

    setForms(forms: any[]): void {
        this.forms.next(forms);
    }

    setGroupName(name: string): void {
        this.groupName.next(name);
    }

    getGroupName(): string {
        return this.groupName.getValue();
    }

    getAllGroups(): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.get<any[]>(`${this.url}/sgs/panel-admin/data`, { headers }).pipe(
            catchError(error => {
                console.error('Error al obtener los grupos:', error);
                this.showErrorAlert('Error al obtener los grupos', 'Por favor, intente más tarde.');
                return of([]);
            })
        );
    }

    getUsersArray(usersString: string): string[] {
        if (!usersString?.trim()) return [];
        return usersString
            .split(',')
            .map(u => u.trim())
            .filter(u => u.length > 0);
    }

    createGroup(group: any): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(`${this.url}/grupo/create`, group, { headers }).pipe(
            catchError(error => {
                console.error('Error al crear el grupo:', error);
                this.showErrorAlert('Error al crear el grupo', this.extractErrorMessage(error));
                return of(null);
            })
        );
    }

    updateGroup(group: any): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(`${this.url}/grupo/update`, group, { headers }).pipe(
            catchError(error => {
                console.error('Error al actualizar el grupo:', error);
                this.showErrorAlert('Error al actualizar el grupo', this.extractErrorMessage(error));
                return of(null);
            })
        );
    }

    deleteGroup(groupId: number): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.get<any>(`${this.url}/grupo/delete/${groupId}`, { headers }).pipe(
            catchError(error => {
                console.error('Error al eliminar el grupo:', error);
                this.showErrorAlert('Error al eliminar el grupo', this.extractErrorMessage(error));
                return of(null);
            })
        );
    }

    reloadGroups(): void {
        this.getAllGroups().subscribe(res => {
            if (res) {
                this.groups.next(res);
                if (res.USUARIOS) this.users.next(res.USUARIOS);
                if (res.FORMULARIOS) this.forms.next(res.FORMULARIOS);
            }
        });
    }

    getUsersByGroup(groupId: string): Observable<any[]> {
        const headers = this.makeHeaders();
        return this.http.get<any[]>(`${this.url}ek-grupos/usuarios/${groupId}`, { headers }).pipe(
            catchError(error => {
                console.error('Error al obtener usuarios del grupo:', error);
                return of([]);
            })
        );
    }

    addUserToGroup(groupId: string, userId: string): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(
            `${this.url}/sgs/panel-admin/editar-grupo/agregar-usuarios`,
            {
                GRUPO_ID: groupId,
                USUARIOS: [userId]
            },
            { headers }
        ).pipe(
            catchError(error => {
                console.error('Error al asignar usuario al grupo:', error);
                this.showErrorAlert('Error al asignar usuario', this.extractErrorMessage(error));
                return of(null);
            })
        );
    }

    addFormToGroup(groupId: string, formId: string): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(
            `${this.url}/sgs/panel-admin/editar-grupo/agregar-formularios`,
            {
                ID_GRUPO: groupId,
                FORMULARIOS: [formId]
            },
            { headers }
        ).pipe(
            catchError(error => {
                console.error('Error al asignar formulario al grupo:', error);
                this.showErrorAlert('Error al asignar formulario', this.extractErrorMessage(error));
                return of(null);
            })
        );
    }

    removeUserFromGroup(groupId: string, userId: string): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(
            `${this.url}/sgs/panel-admin/editar-grupo/quitar-usuarios`,
            {
                ID_GRUPO: groupId,
                USUARIOS: [userId]
            },
            { headers }
        ).pipe(
            catchError(error => {
                console.error('Error al eliminar usuario del grupo:', error);
                this.showErrorAlert('Error al eliminar usuario', this.extractErrorMessage(error));
                return of(null);
            })
        );
    }

    removeFormFromGroup(groupId: string, formId: string): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(
            `${this.url}/sgs/panel-admin/editar-grupo/quitar-formularios`,
            {
                ID_GRUPO: groupId,
                FORMULARIOS: [formId]
            },
            { headers }
        ).pipe(
            catchError(error => {
                console.error('Error al eliminar formulario del grupo:', error);
                this.showErrorAlert('Error al eliminar formulario', this.extractErrorMessage(error));
                return of(null);
            })
        );
    }

    getPermissionsByGroup(groupId: string): Observable<any[]> {
        const headers = this.makeHeaders();
        return this.http.get<any[]>(`${this.url}ek-grupos/permisos/${groupId}`, { headers }).pipe(
            catchError(error => {
                console.error('Error al obtener permisos del grupo:', error);
                return of([]);
            })
        );
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

    toggleGroupStatus(groupId: number): Observable<any> {
        const headers = this.makeHeaders();
        return this.http.post<any>(
            `${this.url}ek-grupos/toggle-activo/${groupId}`,
            {},
            { headers }
        ).pipe(
            catchError(error => {
                console.error('Error al cambiar estado del grupo:', error);
                this.showErrorAlert('Error al cambiar estado', this.extractErrorMessage(error));
                return of(null);
            })
        );
    }
}
