import { Component, Injector, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioAdminService } from '../services/usuario-admin.service';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { CrearUsuarioSgsComponent } from './components/crear-usuario-sgs/crear-usuario-sgs.component';
import { EditarUsuarioSgsComponent } from './components/editar-usuario-sgs/editar-usuario-sgs.component';
import { UsuarioService } from '../../b2b/services/usuario.service';
import { UsuarioRolesSgsService } from '../services/usuario-roles-sgs.service';
import { ModalRolesComponent } from '../../b2b/components/admin-user-forms/modal-roles/modal-roles.component';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

type SortDirection = 'asc' | 'desc' | '';

@Component({
    selector: 'app-tabla-admin-usuario',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatPaginatorModule, SpinnerGrandeComponent, FormsModule, MatIconModule],
    // El modal de roles desde SGS sigue pegandole a la API comun (api.ranko)
    providers: [{ provide: UsuarioService, useClass: UsuarioRolesSgsService }],
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
        mat-icon { color: #222; }
      }
    }
    .table-fixed { table-layout: fixed; width: 100%; }
    .col-email   { width: 220px; }
    .col-nombre  { width: 200px; }
    .col-gp      { width: 130px; }
    .col-estado  { width: 110px; }
    .col-intentos { width: 90px; }
    .col-apps     { width: 160px; }
    .col-cuentas  { width: 110px; }
    .col-acciones { width: 240px; }
    .text-truncate { overflow: hidden; display: block; white-space: nowrap; text-overflow: ellipsis; max-width: 100%; }
    .btn-dark-custom {
      background-color: #222; color: white; border: none;
      padding: 8px 20px; border-radius: 6px; font-weight: 500; transition: all 0.2s;
      &:hover { background-color: #444; }
    }
    .btn-primary  { background-color: #2b6cb0; border-color: #2b6cb0; }
    .btn-dark     { background-color: #222; border-color: #222; }
    .btn-danger   { background-color: #c53030; border-color: #c53030; }
    td { min-height: 75px; vertical-align: middle; }
  `]
})
export class TablaAdminUsuarioComponent implements OnInit {

    cargando: boolean = true;
    rawUsers: any[] = [];
    groupedUserList: any[] = [];
    filteredUserList: any[] = [];
    displayedUsers: any[] = [];
    aplicaciones: any[] = [];

    searchTerm: string = '';
    selectedEstado: string = '';

    pageSize = 5;
    currentPage = 0;
    totalItems = 0;

    sortColumn: string = '';
    sortDirection: SortDirection = '';

    constructor(
        private usuarioAdminService: UsuarioAdminService,
        private usuarioService: UsuarioService,
        private dialog: MatDialog,
        private injector: Injector
    ) { }

    ngOnInit(): void {
        this.usuarioAdminService.getAplicaciones().subscribe(res => {
            this.aplicaciones = res.data || res || [];
        });
        this.usuarioAdminService.users$.subscribe((res) => {
            if (res !== null) {
                this.rawUsers = res;
                this.buildGroupedList();
                this.applyFilters();
                this.cargando = false;
            }
        });
        this.usuarioAdminService.reloadUsers();
    }

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
            // El representante del grupo es siempre la primera instancia (principal/activa)
            const primary = group.instancias[0];
            Object.keys(primary).forEach((k: string) => { if (k !== 'instancias') group[k] = primary[k]; });
        }
        this.groupedUserList = Array.from(map.values());
    }

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

        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(group =>
                group.ID_USUARIO?.toString().includes(term) ||
                group.MAIL?.toLowerCase().includes(term) ||
                group.NOMBRE?.toLowerCase().includes(term) ||
                group.APELLIDO?.toLowerCase().includes(term) ||
                group.GP_CUSTNMBR?.toLowerCase().includes(term)
            );
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

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) return 'unfold_more';
        return this.sortDirection === 'asc' ? 'arrow_upward' : this.sortDirection === 'desc' ? 'arrow_downward' : 'unfold_more';
    }

    get existingMails(): string[] {
        return this.rawUsers.map(u => (u.MAIL || '').toLowerCase().trim()).filter(Boolean);
    }

    crearUsuario(): void {
        const dialogRef = this.dialog.open(CrearUsuarioSgsComponent, {
            width: '700px',
            disableClose: true,
            data: { existingMails: this.existingMails }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.usuarioAdminService.reloadUsers();
        });
    }

    editarUsuario(group: any): void {
        const dialogRef = this.dialog.open(EditarUsuarioSgsComponent, {
            width: '1100px',
            disableClose: true,
            data: {
                usuario: group,
                instancias: group.instancias
            }
        });
        dialogRef.afterClosed().subscribe(() => {
            this.usuarioAdminService.reloadUsers();
        });
    }

    gestionarRoles(group: any): void {
        const list = group.instancias || [group];
        if (list.length <= 1) {
            this.abrirModalRoles(list[0]);
        } else {
            const inputOptions: { [key: string]: string } = {};
            list.forEach((inst: any) => {
                inputOptions[inst.ID_USUARIO] = `${inst.GP_CUSTNMBR || 'Sin cliente'} - ${inst.NOMBRE} ${inst.APELLIDO} (ID: ${inst.ID_USUARIO})`;
            });
            Swal.fire({
                title: 'Seleccionar cuenta',
                text: 'Este correo tiene múltiples cuentas. Selecciona cuál deseas gestionar:',
                input: 'select',
                inputOptions,
                inputPlaceholder: 'Seleccione una cuenta',
                showCancelButton: true,
                confirmButtonColor: '#222',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Gestionar',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => new Promise(resolve => {
                    resolve(value ? undefined : 'Debes seleccionar una cuenta');
                })
            }).then(result => {
                if (result.isConfirmed && result.value) {
                    const selected = list.find((inst: any) => String(inst.ID_USUARIO) === String(result.value));
                    if (selected) this.abrirModalRoles(selected);
                }
            });
        }
    }

    private abrirModalRoles(usuario: any): void {
        this.usuarioService.getAllRoles().subscribe(roles => {
            const dialogRef = this.dialog.open(ModalRolesComponent, {
                width: '600px',
                injector: this.injector,
                disableClose: true,
                data: { roles, usuario }
            });
            dialogRef.afterClosed().subscribe(() => this.usuarioAdminService.reloadUsers());
        });
    }

    eliminarUsuario(group: any): void {
        const list = group.instancias || [group];
        if (list.length <= 1) {
            this.confirmarEliminar(list[0]);
        } else {
            const inputOptions: { [key: string]: string } = {};
            list.forEach((inst: any) => {
                inputOptions[inst.ID_USUARIO] = `${inst.GP_CUSTNMBR || 'Sin cliente'} - ${inst.NOMBRE} ${inst.APELLIDO} (ID: ${inst.ID_USUARIO})`;
            });
            Swal.fire({
                title: 'Seleccionar cuenta a eliminar',
                text: 'Este correo tiene múltiples cuentas. Selecciona cuál deseas eliminar:',
                input: 'select',
                inputOptions,
                inputPlaceholder: 'Seleccione una cuenta',
                showCancelButton: true,
                confirmButtonColor: '#c53030',
                cancelButtonColor: '#222',
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => new Promise(resolve => {
                    resolve(value ? undefined : 'Debes seleccionar una cuenta');
                })
            }).then(result => {
                if (result.isConfirmed && result.value) {
                    const selected = list.find((inst: any) => String(inst.ID_USUARIO) === String(result.value));
                    if (selected) this.confirmarEliminar(selected);
                }
            });
        }
    }

    private confirmarEliminar(usuario: any): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar la cuenta GP ${usuario.GP_CUSTNMBR || '—'} de ${usuario.NOMBRE}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#222',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                this.usuarioAdminService.deleteUser(usuario.ID_USUARIO).subscribe(() => {
                    this.rawUsers = this.rawUsers.filter(u => u.ID_USUARIO !== usuario.ID_USUARIO);
                    this.buildGroupedList();
                    this.applyFilters();
                    this.usuarioAdminService.reloadUsers();
                });
            }
        });
    }
}
