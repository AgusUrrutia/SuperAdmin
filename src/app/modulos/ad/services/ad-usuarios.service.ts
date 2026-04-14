import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdUsuariosService {
  private apiUrl = 'http://apiqa.ranko.com.ar/super-admin'; 

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getUsuariosConAcciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios-acciones`, { headers: this.getHeaders() });
  }

  getAcciones(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/acciones`, { headers: this.getHeaders() });
  }

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/crear-usuario`, usuario, { headers: this.getHeaders() });
  }

  cambiarContrasena(idUsuario: string | number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cambiar-pass?ID_USUARIO=${idUsuario}`, payload, { headers: this.getHeaders() });
  }

}
