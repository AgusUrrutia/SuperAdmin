import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LogAcceso, LogAccesoFiltros, LogError, LogErrorFiltros } from '../models/log-error.model';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  //private apiUrl = 'http://apiqa.ranko.com.ar/super-admin';
  //private rootUrl = 'http://apiqa.ranko.com.ar';

  private apiUrl = 'http://api.ranko.com.ar/super-admin';
  private rootUrl = 'http://api.ranko.com.ar';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getErrores(filtros?: LogErrorFiltros): Observable<LogError[]> {
    let params = new HttpParams();
    if (filtros?.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros?.desde) params = params.set('desde', filtros.desde);
    if (filtros?.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros?.codigo) params = params.set('codigo', filtros.codigo);

    return this.http.get<LogError[]>(`${this.apiUrl}/logs`, { headers: this.getHeaders(), params });
  }

  getAccesos(desde: string, hasta: string, filtros?: LogAccesoFiltros): Observable<LogAcceso[]> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (filtros?.uri) params = params.set('uri', filtros.uri);
    if (filtros?.metodo) params = params.set('metodo', filtros.metodo);
    if (filtros?.usuario) params = params.set('usuario', filtros.usuario);

    return this.http.get<LogAcceso[]>(`${this.rootUrl}/logs-entrada/all`, { headers: this.getHeaders(), params });
  }
}
