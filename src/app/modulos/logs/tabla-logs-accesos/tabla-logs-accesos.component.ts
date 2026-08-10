import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LogsService } from '../services/logs.service';
import { LogAcceso } from '../models/log-error.model';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import { ModalService } from '../../../shared/services/modal.service';
import { ModalDetalleAccesoComponent } from './components/modal-detalle-acceso/modal-detalle-acceso.component';
import { parseFechaLog, formatFechaLog } from '../utils/fecha-log.util';
import Swal from 'sweetalert2';

function toFechaInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// El back rechaza rangos de más de 31 días, así que un rango más largo se parte en tramos de a lo sumo esa cantidad de días.
const MAX_DIAS_RANGO = 31;

function splitRangoFechas(desde: string, hasta: string, maxDias: number = MAX_DIAS_RANGO): { desde: string; hasta: string }[] {
  const tramos: { desde: string; hasta: string }[] = [];
  let inicio = new Date(`${desde}T00:00:00Z`);
  const fin = new Date(`${hasta}T00:00:00Z`);

  while (inicio <= fin) {
    const finTramo = new Date(inicio);
    finTramo.setUTCDate(finTramo.getUTCDate() + (maxDias - 1));
    if (finTramo > fin) finTramo.setTime(fin.getTime());

    tramos.push({ desde: toFechaInput(inicio), hasta: toFechaInput(finTramo) });

    inicio = new Date(finTramo);
    inicio.setUTCDate(inicio.getUTCDate() + 1);
  }

  return tramos;
}

@Component({
  selector: 'app-tabla-logs-accesos',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, MatPaginatorModule, SpinnerGrandeComponent],
  templateUrl: './tabla-logs-accesos.component.html',
  styleUrl: './tabla-logs-accesos.component.scss'
})
export class TablaLogsAccesosComponent implements OnInit {

  accesos: LogAcceso[] = [];
  filteredItems: LogAcceso[] = [];
  displayedItems: LogAcceso[] = [];
  cargando: boolean = true;

  // Filtros: fecha/uri/metodo/usuario se mandan al back (GET /logs-entrada/all?desde=&hasta=&uri=&metodo=&usuario=)
  fechaDesde: string = '';
  fechaHasta: string = '';
  searchTerm: string = '';
  selectedMetodo: string = '';
  usuarioFiltro: string = '';

  // Aplicación no tiene param en el back todavía, se filtra en el cliente sobre lo ya traído
  aplicacionFiltro: string = '';

  metodos: string[] = ['GET', 'POST', 'PUT', 'DELETE'];

  // Ordenamiento y paginado: se aplican en el cliente sobre el resultado ya filtrado por el back
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  pageSize: number = 5;
  pageIndex: number = 0;
  totalItems: number = 0;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Rango que se usa mientras el usuario no elija sus propias fechas (los inputs arrancan vacíos).
  private readonly fechaDesdePorDefecto: string;
  private readonly fechaHastaPorDefecto: string;

  private filtroTextoSubject = new Subject<void>();

  constructor(private logsService: LogsService, private modalService: ModalService) {
    const hoy = new Date();
    const hace7dias = new Date();
    hace7dias.setDate(hoy.getDate() - 7);
    this.fechaHastaPorDefecto = toFechaInput(hoy);
    this.fechaDesdePorDefecto = toFechaInput(hace7dias);

    this.filtroTextoSubject.pipe(debounceTime(400)).subscribe(() => this.cargarAccesos());
  }

  ngOnInit(): void {
    this.cargarAccesos();
  }

  onFiltroTexto(): void {
    this.filtroTextoSubject.next();
  }

  cargarAccesos(
    desde: string = this.fechaDesde || this.fechaDesdePorDefecto,
    hasta: string = this.fechaHasta || this.fechaHastaPorDefecto
  ): void {
    if (!desde || !hasta) return;

    this.cargando = true;
    const tramos = splitRangoFechas(desde, hasta);

    forkJoin(
      tramos.map(tramo => this.logsService.getAccesos(tramo.desde, tramo.hasta, {
        uri: this.searchTerm.trim() || undefined,
        metodo: this.selectedMetodo || undefined,
        usuario: this.usuarioFiltro.trim() || undefined
      }))
    ).subscribe({
      next: (respuestas: LogAcceso[][]) => {
        this.accesos = respuestas.flatMap(respuesta => respuesta || [])
          .sort((a, b) => parseFechaLog(b.timestamp).getTime() - parseFechaLog(a.timestamp).getTime());
        this.cargando = false;
        this.procesarResultado();
      },
      error: (err: any) => {
        console.error('Error cargando el log de accesos:', err);
        this.accesos = [];
        this.cargando = false;
        this.procesarResultado();
        this.mostrarError(err);
      }
    });
  }

  private mostrarError(err: any): void {
    const mensaje = err?.error?.error || err?.error?.message || 'Ocurrió un error al obtener los logs de accesos.';
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#222'
    });
  }

  onFiltroAplicacion(): void {
    this.procesarResultado();
  }

  procesarResultado(): void {
    const term = this.aplicacionFiltro.trim().toLowerCase();
    this.filteredItems = term
      ? this.accesos.filter(item => item.aplicacion && item.aplicacion.toLowerCase().includes(term))
      : [...this.accesos];
    this.totalItems = this.filteredItems.length;

    if (this.sortColumn) {
      this.doSort(this.sortColumn, this.sortDirection);
    } else {
      this.pageIndex = 0;
      this.updateDisplayedItems();
    }
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'asc') this.sortDirection = 'desc';
      else if (this.sortDirection === 'desc') {
        this.sortDirection = '';
        this.sortColumn = '';
      }
      else this.sortDirection = 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    if (!this.sortColumn) {
      this.procesarResultado();
      return;
    }

    this.doSort(this.sortColumn, this.sortDirection);
  }

  private doSort(column: string, direction: string) {
    this.filteredItems.sort((a: any, b: any) => {
      let valA = a[column] ?? '';
      let valB = b[column] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    this.updateDisplayedItems();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column || !this.sortDirection) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedItems();
  }

  updateDisplayedItems(): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.displayedItems = this.filteredItems.slice(startIndex, startIndex + this.pageSize);
  }

  getMetodoColor(metodo: string): { bg: string; color: string; border: string } {
    switch (metodo) {
      case 'POST': return { bg: '#e6f4ea', color: '#1e8e3e', border: '#ceead6' };
      case 'PUT': return { bg: '#fff6e0', color: '#b67a00', border: '#fbe5a7' };
      case 'DELETE': return { bg: '#fce8e6', color: '#d93025', border: '#fad2cf' };
      default: return { bg: '#e8f0fe', color: '#1a56db', border: '#c3d9fd' };
    }
  }

  formatFecha(dateStr: string): string {
    return formatFechaLog(dateStr);
  }

  verDetalle(item: LogAcceso): void {
    this.modalService.open(ModalDetalleAccesoComponent, { acceso: item }, '1300px', '95vw', ['custom-modal-panel', 'logs-detalle-modal-panel']);
  }
}
