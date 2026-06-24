import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioAdminService } from '../services/usuario-admin.service';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { CrearUsuarioSgsComponent } from './components/crear-usuario-sgs/crear-usuario-sgs.component';
import { EditarUsuarioSgsComponent } from './components/editar-usuario-sgs/editar-usuario-sgs.component';
import { UsuarioService } from '../../b2b/services/usuario.service';
import { ModalRolesComponent } from '../../b2b/components/admin-user-forms/modal-roles/modal-roles.component';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-tabla-admin-usuario',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatPaginatorModule, SpinnerGrandeComponent, FormsModule, MatIconModule],
    templateUrl: './tabla-admin-usuario.component.html',
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
    /* Estilos para estabilizar la tabla */
    .table-fixed {
      table-layout: fixed;
      width: 100%;
    }
    .col-id { width: 90px; }
    .col-email { width: 220px; }
    .col-nombre { width: 220px; }
    .col-gp { width: 130px; }
    .col-apps { width: 140px; }   /*  */
    .col-estado { width: 120px; }
    .col-intentos { width: 90px; }
    .col-acciones { width: 260px; }
    
    .text-truncate {
      overflow: hidden;
      display: block;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 100%;
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
    td { min-height: 75px; vertical-align: middle; }
  `]
})
export class TablaAdminUsuarioComponent implements OnInit {

    cargando: boolean = true;
    filas: any[] = [];
    filteredFilas: any[] = [];
    displayedFilas: any[] = [];
    rawUsers: any[] = [];
    aplicaciones: any[] = [];
    userSelected: any;

    // Filtros
    searchTerm: string = '';
    selectedEstado: string = '';

    // Paginación
    pageSize = 5;
    currentPage = 0;
    totalItems = 0;

    // Ordenamiento
    sortColumn: string = '';
    sortDirection: 'asc' | 'desc' | '' = '';

    constructor(
        private usuarioAdminService: UsuarioAdminService,
        private usuarioService: UsuarioService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.usuarioAdminService.users$.subscribe((res) => {
            if (res !== null) {
                const isReload = this.rawUsers.length > 0;
                this._preservePageOnNextLoad = isReload;
                this.rawUsers = res;
                this.processUserData(this.rawUsers);
                this.cargando = false;
            }
        });

        this.usuarioAdminService.reloadUsers();

        // Prefetch aplicaciones para el modal y la visualización de la tabla
        this.usuarioAdminService.getAplicaciones().subscribe(res => {
            this.aplicaciones = res.data || res || [];
            if (this.rawUsers.length > 0) {
                this.processUserData(this.rawUsers);
            }
        });
    }

    processUserData(res: any[]): void {
        this.filas = res.map((user: any) => {
            const nombreCompleto = [user.NOMBRE, user.APELLIDO].filter(Boolean).join(' ') ||
                user.MAIL ||
                user.ID_USUARIO;

            let appsString = '-';

            if (user.sistemas && Array.isArray(user.sistemas) && user.sistemas.length > 0) {
                // Si el backend envía directamente un array de strings ["SGS", "B2B"]
                appsString = user.sistemas.join(', ');
            } else {
                const appsIds = user.ID_APLICACION || user.APLICACIONES || user.id_aplicacion || [];
                let appsIdsToMatch: any[] = [];
                if (Array.isArray(appsIds)) {
                    appsIdsToMatch = appsIds.map((a: any) => a.ID || a.id || a.ID_APLICACION || a);
                } else if (typeof appsIds === 'string') {
                    appsIdsToMatch = appsIds.split(',').map(a => a.trim());
                } else if (typeof appsIds === 'number') {
                    appsIdsToMatch = [appsIds];
                }

                if (this.aplicaciones && this.aplicaciones.length > 0 && appsIdsToMatch.length > 0) {
                    const appNames = this.aplicaciones.filter(app => {
                        const appId = app?.ID || app?.id || app?.ID_APLICACION;
                        return appsIdsToMatch.includes(appId) || appsIdsToMatch.includes(String(appId)) || appsIdsToMatch.includes(Number(appId));
                    }).map(app => app.SISTEMA || app.nombre || app.NOMBRE);

                    if (appNames.length > 0) {
                        appsString = appNames.join(', ');
                    } else {
                        appsString = appsIdsToMatch.join(', ');
                    }
                } else if (appsIdsToMatch.length > 0) {
                    if (Array.isArray(appsIds) && typeof appsIds[0] === 'object') {
                        const appNames = appsIds.map((a: any) => a.SISTEMA || a.nombre || a.NOMBRE || a.ID || a.id || a.ID_APLICACION);
                        appsString = appNames.join(', ');
                    } else {
                        appsString = appsIdsToMatch.join(', ');
                    }
                }
            }

            return {
                ...user,
                "ID Usuario": user.ID_USUARIO,
                "Email/Usuario": user.MAIL || user.ID_USUARIO,
                "Nombre": nombreCompleto,
                "Aplicaciones": appsString,   /*  */
                "GP Customer": user.GP_CUSTNMBR || '-',
                "Estado": user.ACTIVO === '1' ? 'Activo' : 'Inactivo',
                "Intentos": user.INTENTOS_FALLIDOS || 0
            };
        });

        this.applyFilters(this._preservePageOnNextLoad);
        this._preservePageOnNextLoad = false;
    }

    private _preservePageOnNextLoad: boolean = false;

    applyFilters(preservePage: boolean = false): void {
        let filtered = [...this.filas];

        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(f =>
                String(f["ID Usuario"]).toLowerCase().includes(term) ||
                String(f["Email/Usuario"]).toLowerCase().includes(term) ||
                String(f["Nombre"]).toLowerCase().includes(term) ||
                String(f["GP Customer"]).toLowerCase().includes(term)
            );
        }

        if (this.selectedEstado) {
            filtered = filtered.filter(f => f.ACTIVO === this.selectedEstado);
        }

        this.filteredFilas = filtered;
        this.totalItems = filtered.length;

        if (!preservePage) {
            this.currentPage = 0;
        } else {
            const maxPage = Math.max(0, Math.ceil(this.totalItems / this.pageSize) - 1);
            if (this.currentPage > maxPage) {
                this.currentPage = maxPage;
            }
        }

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

    crearUsuario(): void {
        const dialogRef = this.dialog.open(CrearUsuarioSgsComponent, {
            width: '700px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.usuarioAdminService.reloadUsers();
            }
        });
    }

    editarUsuario(usuario: any): void {
        const dialogRef = this.dialog.open(EditarUsuarioSgsComponent, {
            width: '700px',
            disableClose: true,
            data: usuario
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.usuarioAdminService.reloadUsers();
            }
        });
    }

    gestionarRoles(usuario: any) {
        this.usuarioService.getAllRoles().subscribe((roles) => {
            this.userSelected = usuario;
            const dialogRef = this.dialog.open(ModalRolesComponent, {
                width: '600px',
                disableClose: true,
                data: {
                    roles: roles,
                    usuario: this.userSelected
                }
            });

            // Note: The B2B modal reloads users inside itself using its own service,
            // but we might want to reload SGS users when the dialog closes if roles affect the view.
            dialogRef.afterClosed().subscribe(() => {
                this.usuarioAdminService.reloadUsers();
            });
        });
    }

    eliminarUsuario(usuario: any): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar al usuario ${usuario.Nombre}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#222',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.usuarioAdminService.deleteUser(usuario.ID_USUARIO).subscribe(() => {
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'El usuario ha sido eliminado.',
                        icon: 'success',
                        confirmButtonColor: '#222'
                    });
                });
            }
        });
    }
}
