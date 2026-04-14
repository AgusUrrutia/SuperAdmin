import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { AdUsuariosService } from '../services/ad-usuarios.service';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';

@Component({
  selector: 'app-historial-acciones-ad',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, MatPaginatorModule, SpinnerGrandeComponent],
  templateUrl: './historial-acciones-ad.component.html',
  styleUrls: ['./historial-acciones-ad.component.scss']
})
export class HistorialAccionesAdComponent implements OnInit {

  historialGeneral: any[] = [];
  filteredItems: any[] = [];
  displayedItems: any[] = [];
  cargando: boolean = true;

  // Filtros
  searchTerm: string = '';
  selectedEstado: string = '';

  // Ordenamiento
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  // Paginación
  pageSize: number = 5;
  pageIndex: number = 0;
  totalItems: number = 0;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private adUserService: AdUsuariosService) { }

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.adUserService.getAcciones().subscribe({
      next: (response: any) => {
        const dataArray = Array.isArray(response) ? response : (response.data && Array.isArray(response.data)) ? response.data : null;

        if (dataArray) {
          this.historialGeneral = dataArray.map((item: any) => {
            return {
              usuario: this.extractUsuario(item),
              descripcion: this.translateActionType(item.ActionType),
              estado: this.translateStatus(item.Status),
              fechaInicio: this.formatDate(item.StartedAt),
              fechaFin: this.formatDate(item.FinishedAt),
              mensaje: item.ResultMessage || '-',
              bloqueadaPor: item.LockedBy || '-'
            };
          });
        } else {
          console.error("El servidor devolvió un formato no iterable para el historial de acciones:", response);
          this.historialGeneral = [];
        }

        setTimeout(() => {
          this.cargando = false;
          this.applyFilters();
        }, 500);
      },
      error: (err: any) => {
        console.error('Error cargando el historial de acciones AD:', err);
        this.cargando = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.historialGeneral];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.usuario && item.usuario.toLowerCase().includes(term)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(term)) ||
        (item.mensaje && item.mensaje.toLowerCase().includes(term))
      );
    }

    if (this.selectedEstado) {
      result = result.filter(item => item.estado === this.selectedEstado);
    }

    this.filteredItems = result;
    this.totalItems = this.filteredItems.length;

    if (this.sortColumn) {
      this.doSort(this.sortColumn, this.sortDirection);
    } else {
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
      // Re-aplicar filtros restablece el orden original (asumiendo que applyFilters lo hace sin sortColumn)
      this.applyFilters();
      return;
    }

    this.doSort(this.sortColumn, this.sortDirection);
  }

  private doSort(column: string, direction: string) {
    this.filteredItems.sort((a, b) => {
      let valA = a[column] || '';
      let valB = b[column] || '';

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

  private extractUsuario(item: any): string {
    if (item.PayloadJson) {
      try {
        const payload = JSON.parse(item.PayloadJson);
        if (payload && payload.UPN) {
          return payload.UPN;
        }
      } catch (e) {
      }
    }

    if (item.ResultMessage) {
      const emailMatch = item.ResultMessage.match(/Email \[([^\]]+)\]/);
      if (emailMatch && emailMatch[1]) {
        return emailMatch[1];
      }

      const userMatch = item.ResultMessage.match(/Usuario \[([^\]]+)\]/);
      if (userMatch && userMatch[1]) {
        return userMatch[1];
      }
    }

    return 'Usuario desconocido';
  }

  private translateActionType(type: string): string {
    if (!type) return 'Acción desconocida';
    const t = type.toUpperCase();
    if (t === 'CREATE') return 'Creación de usuario';
    if (t === 'RESET_PASSWORD') return 'Restablecer contraseña';
    if (t === 'UPDATE' || t === 'UPDATE_PASSWORD') return 'Cambiar contraseña';
    if (t === 'DELETE' || t === 'DISABLE') return 'Desactivar cuenta';
    return type;
  }

  private translateStatus(status: string): string {
    if (!status) return 'Pendiente';
    const s = status.toUpperCase();
    if (s === 'OK' || s === 'SUCCESS') return 'Exitoso';
    if (s === 'PENDING') return 'Pendiente';
    if (s === 'FAILED' || s === 'ERROR') return 'Error';
    return status;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString();
  }
}
