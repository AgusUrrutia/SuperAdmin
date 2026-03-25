import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioAdminService } from '../services/usuario-admin.service';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CrearUsuarioSgsComponent } from './components/crear-usuario-sgs/crear-usuario-sgs.component';
import { EditarUsuarioSgsComponent } from './components/editar-usuario-sgs/editar-usuario-sgs.component';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-tabla-admin-usuario',
    standalone: true,
    imports: [CommonModule, MatDialogModule, SpinnerGrandeComponent],
    templateUrl: './tabla-admin-usuario.component.html',
    styles: [`
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
  `]
})
export class TablaAdminUsuarioComponent implements OnInit {

    cargando: boolean = true;
    filas: any[] = [];
    rawUsers: any[] = [];
    aplicaciones: any[] = [];

    constructor(
        private usuarioAdminService: UsuarioAdminService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.usuarioAdminService.users$.subscribe((res) => {
            if (res !== null) {
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

            return {
                ...user,
                "ID Usuario": user.ID_USUARIO,
                "Email/Usuario": user.MAIL || user.ID_USUARIO,
                "Nombre": nombreCompleto,
                "Aplicaciones": appsString,
                "GP Customer": user.GP_CUSTNMBR || '-',
                "Estado": user.ACTIVO === '1' ? 'Activo' : 'Inactivo',
                "Intentos": user.INTENTOS_FALLIDOS || 0
            };
        });
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

    eliminarUsuario(usuario: any): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar al usuario ${usuario.Nombre}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#222',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
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
