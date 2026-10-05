import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { UsuarioAdminService } from '../../sgs/services/usuario-admin.service';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import { ModalGestionarAplicacionesComponent } from './components/modal-gestionar-aplicaciones/modal-gestionar-aplicaciones.component';

type SortDirection = 'asc' | 'desc' | '';

// Listado de usuarios de todas las aplicaciones.
// Usa la misma request que Usuarios SGS (ek-usuarios via UsuarioAdminService, trae todos en tandas)
// y la misma logica: agrupa las cuentas por mail y busca/filtra/ordena/pagina en el front.
@Component({
  selector: 'app-usuarios-aplicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule, MatIconModule, MatDialogModule, SpinnerGrandeComponent],
  templateUrl: './usuarios-aplicaciones.component.html',
  styleUrls: ['./usuarios-aplicaciones.component.scss']
})
export class UsuariosAplicacionesComponent implements OnInit, OnDestroy {

  cargando: boolean = true;
  rawUsers: any[] = [];
  groupedUserList: any[] = [];
  filteredUserList: any[] = [];
  displayedUsers: any[] = [];
  aplicaciones: any[] = [];

  searchTerm: string = '';
  selectedEstado: string = '';

  pageSize = 10;
  currentPage = 0;
  totalItems = 0;

  sortColumn: string = '';
  sortDirection: SortDirection = '';

  private subs = new Subscription();

  constructor(
    private usuarioAdminService: UsuarioAdminService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.subs.add(this.usuarioAdminService.getAplicaciones().subscribe(res => {
      this.aplicaciones = res.data || res || [];
    }));
    this.subs.add(this.usuarioAdminService.users$.subscribe(res => {
      if (res !== null) {
        this.rawUsers = res;
        this.buildGroupedList();
        this.applyFilters();
        this.cargando = false;
      }
    }));
    this.usuarioAdminService.reloadUsers();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // Agrupa las cuentas (instancias) por mail; el representante es la primera activa
  buildGroupedList(): void {
    const map = new Map<string, any>();
    for (const user of this.rawUsers) {
      const mail = (user.MAIL || '').toLowerCase().trim();
      if (!map.has(mail)) {
        map.set(mail, { ...user, instancias: [user] });
      } else {
        map.get(mail)!.instancias.push(user);
      }
    }
    for (const group of map.values()) {
      group.instancias.sort((a: any, b: any) => {
        if (a.ACTIVO !== b.ACTIVO) return a.ACTIVO === '1' ? -1 : 1;
        return Number(a.ID_USUARIO) - Number(b.ID_USUARIO);
      });
      const primary = group.instancias[0];
      Object.keys(primary).forEach((k: string) => { if (k !== 'instancias') group[k] = primary[k]; });
    }
    this.groupedUserList = Array.from(map.values());
  }

  // Nombres de las aplicaciones de todas las cuentas del mail
  getGroupedSistemas(group: any): string[] {
    if (!group.instancias) return [];
    const unique = new Set<string>();
    for (const inst of group.instancias) {
      if (inst.sistemas && Array.isArray(inst.sistemas) && inst.sistemas.length > 0) {
        inst.sistemas.forEach((s: string) => unique.add(s));
      } else if (inst.ID_APLICACION && Array.isArray(inst.ID_APLICACION) && inst.ID_APLICACION.length > 0) {
        for (const id of inst.ID_APLICACION) {
          const app = this.aplicaciones.find(a =>
            String(a?.ID || a?.id || a?.ID_APLICACION) === String(id)
          );
          const name = app?.SISTEMA || app?.nombre || app?.NOMBRE;
          if (name) unique.add(name);
        }
      }
    }
    return Array.from(unique);
  }

  applyFilters(): void {
    let filtered = [...this.groupedUserList];

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      // Busca en todas las cuentas del mail, no solo en la principal
      const coincide = (u: any) =>
        u.ID_USUARIO?.toString().includes(term) ||
        u.MAIL?.toLowerCase().includes(term) ||
        u.NOMBRE?.toLowerCase().includes(term) ||
        u.APELLIDO?.toLowerCase().includes(term) ||
        u.GP_CUSTNMBR?.toLowerCase().includes(term);
      filtered = filtered.filter(group => (group.instancias || [group]).some(coincide));
    }

    if (this.selectedEstado) {
      filtered = filtered.filter(group => group.ACTIVO === this.selectedEstado);
    }

    this.filteredUserList = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 0;
    this.updateDisplayedUsers();
  }

  updateDisplayedUsers(): void {
    let sortedList = [...this.filteredUserList];

    if (this.sortColumn && this.sortDirection) {
      sortedList.sort((a, b) => {
        const aValue = a[this.sortColumn];
        const bValue = b[this.sortColumn];
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return this.sortDirection === 'asc' ? -1 : 1;
        if (bValue == null) return this.sortDirection === 'asc' ? 1 : -1;
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
        } else {
          comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    const startIndex = this.currentPage * this.pageSize;
    this.displayedUsers = sortedList.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedUsers();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'desc') this.sortDirection = 'asc';
      else if (this.sortDirection === 'asc') { this.sortDirection = ''; this.sortColumn = ''; }
      else this.sortDirection = 'desc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.updateDisplayedUsers();
  }

  // Abre el modal para asignar/quitar aplicaciones a cada cuenta del usuario
  gestionarAplicaciones(group: any): void {
    const dialogRef = this.dialog.open(ModalGestionarAplicacionesComponent, {
      width: '700px',
      disableClose: true,
      data: { usuario: group, instancias: group.instancias || [group] }
    });
    dialogRef.afterClosed().subscribe(huboCambios => {
      if (huboCambios) this.usuarioAdminService.reloadUsers();
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : this.sortDirection === 'desc' ? 'arrow_downward' : 'unfold_more';
  }
}
