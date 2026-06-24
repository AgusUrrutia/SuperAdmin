import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupService } from '../services/group.service';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CrearGrupoSgsComponent } from './components/crear-grupo-sgs/crear-grupo-sgs.component';
import { EditarGrupoSgsComponent } from './components/editar-grupo-sgs/editar-grupo-sgs.component';
import { ModalEditarGrupoSgsComponent } from './components/modal-editar-grupo-sgs/modal-editar-grupo-sgs.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-tabla-admin-grupo',
    standalone: true,
    imports: [CommonModule, MatDialogModule, SpinnerGrandeComponent, MatPaginatorModule, MatIconModule, FormsModule],
    templateUrl: './tabla-admin-grupo.component.html',
    styles: [`
    .cursor-pointer {
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s;
      &:hover {
        color: #222 !important;
        background-color: rgba(0,0,0,0.03);
      }
      mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
        color: #adb5bd;
        transition: all 0.2s;
      }
      &.active-sort {
        color: #222 !important;
        mat-icon {
          color: #222;
        }
      }
    }
    .btn-dark-custom {
      background-color: #222;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s;
      &:hover {
        background-color: #444;
      }
    }
    .btn-primary { background-color: #2b6cb0; border-color: #2b6cb0; }
    .btn-dark { background-color: #222; border-color: #222; }
    .btn-danger { background-color: #c53030; border-color: #c53030; }

    /* Estabilización de tabla */
    .table-fixed {
      table-layout: fixed;
      width: 100%;
    }
    .col-id { width: 110px; }
    .col-nombre { width: 150px; }
    .col-cant { width: 180px; }
    .col-acciones { width: 330px; }
    
    td { min-height: 75px; vertical-align: middle; }
    .text-truncate {
      overflow: hidden;
      display: block;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  `]
})
export class TablaAdminGrupoComponent implements OnInit {

    cargando: boolean = true;
    filas: any[] = [];
    filteredFilas: any[] = [];
    displayedFilas: any[] = [];
    usuarios: any[] = [];
    formularios: any[] = [];

    // Filtros
    searchTerm: string = '';

    // Paginación
    pageSize = 5;
    currentPage = 0;
    totalItems = 0;

    // Ordenamiento
    sortColumn: string = '';
    sortDirection: 'asc' | 'desc' | '' = '';

    constructor(
        private groupService: GroupService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.groupService.groups$.subscribe((res: any) => {
            // El BehaviorSubject inicializa con [], así que esperamos a que llegue el objeto real con GRUPOS
            if (res && res.GRUPOS !== undefined) {
                this.processGroupData(res);
                this.usuarios = res.USUARIOS || [];
                this.formularios = res.FORMULARIOS || [];
                this.cargando = false;
            }
        });

        this.groupService.reloadGroups();
    }

    processGroupData(res: any): void {
        const todosLosGrupos = res.GRUPOS || [];
        const gruposUsuarios = res.GRUPOS_USUARIOS_FORMULARIOS || [];

        this.filas = todosLosGrupos.map((grupo: any) => {
            const detalle = gruposUsuarios.find((g: any) => g.GRUPO_ID === grupo.ID);
            return {
                ...grupo,
                "ID Grupo": grupo.ID,
                "Nombre Grupo": grupo.GRUPO,
                "Cant. Usuarios": detalle?.USUARIOS_ID?.length || 0,
                "Cant. Formularios": detalle?.FORMULARIOS_ID?.length || 0,
                GRUPO_ID: grupo.ID,
                GRUPO: grupo.GRUPO,
                USUARIOS_ID: detalle?.USUARIOS_ID || [],
                FORMULARIOS_ID: detalle?.FORMULARIOS_ID || []
            };
        }).sort((a: any, b: any) => b["ID Grupo"] - a["ID Grupo"]);

        this.applyFilters();
    }

    applyFilters(): void {
        let filtered = [...this.filas];

        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(f =>
                String(f["ID Grupo"]).toLowerCase().includes(term) ||
                String(f["Nombre Grupo"]).toLowerCase().includes(term)
            );
        }

        this.filteredFilas = filtered;
        this.totalItems = filtered.length;
        this.currentPage = 0;
        this.updateDisplayedFilas();
    }

    onSort(column: string): void {
        if (this.sortColumn === column) {
            if (this.sortDirection === 'desc') {
                this.sortDirection = 'asc';
            } else if (this.sortDirection === 'asc') {
                this.sortDirection = '';
                this.sortColumn = '';
            } else {
                this.sortDirection = 'desc';
            }
        } else {
            this.sortColumn = column;
            this.sortDirection = 'desc';
        }
        this.updateDisplayedFilas();
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) {
            return 'unfold_more';
        }
        return this.sortDirection === 'asc' ? 'arrow_upward' : this.sortDirection === 'desc' ? 'arrow_downward' : 'unfold_more';
    }

    updateDisplayedFilas(): void {
        let sortedList = [...this.filteredFilas];

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
        const endIndex = startIndex + this.pageSize;
        this.displayedFilas = sortedList.slice(startIndex, endIndex);
    }

    onPageChange(event: PageEvent): void {
        this.currentPage = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updateDisplayedFilas();
    }

    crearGrupo(): void {
        const dialogRef = this.dialog.open(CrearGrupoSgsComponent, {
            width: '500px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.groupService.reloadGroups();
            }
        });
    }

    editarGrupo(grupo: any): void {
        const dialogRef = this.dialog.open(ModalEditarGrupoSgsComponent, {
            width: '950px',
            disableClose: true,
            data: {
                grupo: grupo,
                usuarios: this.usuarios,
                formularios: this.formularios
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            // El modal maneja sus propias acciones de guardado parcial en el servicio
            // pero recargamos por si acaso hubo cambios estructurales
            this.groupService.reloadGroups();
        });
    }

    cambiarNombreGrupo(grupo: any): void {
        const dialogRef = this.dialog.open(EditarGrupoSgsComponent, {
            width: '500px',
            disableClose: true,
            data: grupo
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.groupService.reloadGroups();
            }
        });
    }

    eliminarGrupo(grupo: any): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar el grupo "${grupo.GRUPO}"`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#222',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.groupService.deleteGroup(grupo.ID).subscribe((res) => {
                    if (res) {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'El grupo ha sido eliminado.',
                            icon: 'success',
                            confirmButtonColor: '#222'
                        });
                        this.groupService.reloadGroups();
                    }
                });
            }
        });
    }
}
