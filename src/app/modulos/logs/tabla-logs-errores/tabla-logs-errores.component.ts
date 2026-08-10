import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LogsService } from '../services/logs.service';
import { LogError } from '../models/log-error.model';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import { ModalService } from '../../../shared/services/modal.service';
import { ModalDetalleLogComponent } from './components/modal-detalle-log/modal-detalle-log.component';
import { parseFechaLog, formatFechaLog } from '../utils/fecha-log.util';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tabla-logs-errores',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, MatPaginatorModule, SpinnerGrandeComponent],
  templateUrl: './tabla-logs-errores.component.html',
  styleUrl: './tabla-logs-errores.component.scss'
})
export class TablaLogsErroresComponent implements OnInit {

  errores: LogError[] = [];
  filteredItems: LogError[] = [];
  displayedItems: LogError[] = [];
  cargando: boolean = true;

  // Filtros: buscar/desde/hasta/codigo se mandan al back (GET /super-admin/logs?buscar=&desde=&hasta=&codigo=)
  searchTerm: string = '';
  codigoFiltro: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';

  // Aplicación no tiene param en el back todavía, se filtra en el cliente sobre lo ya traído
  aplicacionFiltro: string = '';

  // Ordenamiento y paginado: se aplican en el cliente sobre el resultado ya filtrado por el back
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  pageSize: number = 5;
  pageIndex: number = 0;
  totalItems: number = 0;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private filtroTextoSubject = new Subject<void>();

  constructor(private logsService: LogsService, private modalService: ModalService) {
    this.filtroTextoSubject.pipe(debounceTime(400)).subscribe(() => this.cargarErrores());
  }

  ngOnInit(): void {
    this.cargarErrores();
  }

  onFiltroTexto(): void {
    this.filtroTextoSubject.next();
  }

  onFiltroAplicacion(): void {
    this.procesarResultado();
  }

  cargarErrores(): void {
    this.cargando = true;
    this.logsService.getErrores({
      buscar: this.searchTerm.trim() || undefined,
      codigo: this.codigoFiltro.trim() || undefined,
      desde: this.fechaDesde || undefined,
      hasta: this.fechaHasta || undefined
    }).subscribe({
      next: (response: LogError[]) => {
        this.errores = [...(response || [])]
          .sort((a, b) => parseFechaLog(b.created_at).getTime() - parseFechaLog(a.created_at).getTime());
        this.cargando = false;
        this.procesarResultado();
      },
      error: (err: any) => {
        console.error('Error cargando el log de errores:', err);
        this.errores = [];
        this.cargando = false;
        this.procesarResultado();
        this.mostrarError(err);
      }
    });
  }

  private mostrarError(err: any): void {
    const mensaje = err?.error?.error || err?.error?.message || 'Ocurrió un error al obtener los logs de errores.';
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#222'
    });
  }

  procesarResultado(): void {
    const term = this.aplicacionFiltro.trim().toLowerCase();
    this.filteredItems = term
      ? this.errores.filter(item => item.aplicacion && item.aplicacion.toLowerCase().includes(term))
      : [...this.errores];
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

  getStatusGroup(statusCode: string): '2xx' | '4xx' | '5xx' | 'otro' {
    const codigo = parseInt(statusCode, 10);
    if (codigo >= 200 && codigo < 400) return '2xx';
    if (codigo >= 400 && codigo < 500) return '4xx';
    if (codigo >= 500) return '5xx';
    return 'otro';
  }

  formatFecha(dateStr: string): string {
    return formatFechaLog(dateStr);
  }

  verDetalle(item: LogError): void {
    this.modalService.open(ModalDetalleLogComponent, { error: item }, '1300px', '95vw', ['custom-modal-panel', 'logs-detalle-modal-panel']);
  }
}
