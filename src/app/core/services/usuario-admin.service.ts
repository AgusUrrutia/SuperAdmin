import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UsuarioAdminService {

  constructor(private http: HttpClient) { }

  /**
   * Mock de creación de usuario
   */
  createUser(usuario: any): Observable<any> {
    console.log('Creando usuario:', usuario);
    // Simulamos una respuesta exitosa
    return of({ success: true, data: usuario }).pipe(delay(1000));
  }

  /**
   * Mock de actualización de usuario
   */
  updateUser(id: any, usuario: any): Observable<any> {
    console.log('Actualizando usuario:', id, usuario);
    // Simulamos una respuesta exitosa
    return of({ success: true, data: usuario }).pipe(delay(1000));
  }
}
