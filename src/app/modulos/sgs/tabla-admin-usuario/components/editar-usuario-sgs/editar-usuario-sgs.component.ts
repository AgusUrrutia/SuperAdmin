import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioAdminService } from '../../../services/usuario-admin.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-editar-usuario-sgs',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    templateUrl: './editar-usuario-sgs.component.html',
    styleUrl: './editar-usuario-sgs.component.scss'
})
export class EditarUsuarioSgsComponent implements OnInit {
    id: any;
    mail: string = '';
    nombre: string = '';
    apellido: string = '';
    mailPersonal: string = '';
    gpCustnmbr: string = '';
    activo: string = '1';
    aplicacionActual: any = null;
    aplicacionesSeleccionadas: any[] = [];
    aplicaciones: any[] = [];
    estaCargando: boolean = false;
    estaModificandoApp: boolean = false;
    huboCambiosEnApps: boolean = false;

    constructor(
        private usuarioAdminService: UsuarioAdminService,
        public dialogRef: MatDialogRef<EditarUsuarioSgsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    ngOnInit(): void {
        if (this.data) {
            this.id = this.data.id || this.data.ID || this.data.ID_USUARIO;
            this.mail = this.data.email || this.data.MAIL || '';
            this.nombre = this.data.nombre || this.data.NOMBRE || '';
            this.apellido = this.data.apellido || this.data.APELLIDO || '';
            this.mailPersonal = this.data.mailPersonal || this.data.MAIL_PERSONAL || '';
            this.gpCustnmbr = this.data.gpCustnmbr || this.data.GP_CUSTNMBR || '';
            this.activo = (this.data.activo || this.data.ACTIVO || '1').toString();

            // Extract initial application IDs
            let appsIdsToMatch: any[] = [];
            let sysNamesToMatch: string[] = [];

            if (this.data.sistemas && Array.isArray(this.data.sistemas)) {
                sysNamesToMatch = this.data.sistemas;
            }

            const apps = this.data.ID_APLICACION || this.data.APLICACIONES || this.data.id_aplicacion || [];
            if (Array.isArray(apps)) {
                appsIdsToMatch = apps.map(a => a.ID || a.id || a.ID_APLICACION || a);
            } else if (typeof apps === 'string') {
                appsIdsToMatch = apps.split(',').map(a => a.trim());
            } else if (typeof apps === 'number') {
                appsIdsToMatch = [apps];
            }
            this.cargarAplicaciones(appsIdsToMatch, sysNamesToMatch);
        } else {
            this.cargarAplicaciones([], []);
        }
    }

    cargarAplicaciones(appsIdsToMatch: any[], sysNamesToMatch: string[] = []): void {
        this.usuarioAdminService.getAplicaciones().subscribe({
            next: (res) => {
                this.aplicaciones = res.data || res || [];
                if (appsIdsToMatch.length > 0 || sysNamesToMatch.length > 0) {
                    this.aplicacionesSeleccionadas = this.aplicaciones.filter(app => {
                        const appId = this.obtenerId(app);
                        const appName = app?.SISTEMA || app?.nombre || app?.NOMBRE;
                        return appsIdsToMatch.includes(appId) ||
                            appsIdsToMatch.includes(String(appId)) ||
                            appsIdsToMatch.includes(Number(appId)) ||
                            (appName && sysNamesToMatch.includes(appName));
                    });
                }
            },
            error: (err) => console.error('Error al cargar aplicaciones', err)
        });
    }

    agregarAplicacion(): void {
        if (!this.aplicacionActual) return;

        const idActual = this.obtenerId(this.aplicacionActual);
        const yaExiste = this.aplicacionesSeleccionadas.find(a => this.obtenerId(a) === idActual);

        if (!yaExiste) {
            this.estaModificandoApp = true;
            const appParaAgregar = this.aplicacionActual;

            this.usuarioAdminService.addAplicacionToUser({ ID_USUARIO: this.id, ID_SISTEMA: idActual }).subscribe({
                next: () => {
                    this.aplicacionesSeleccionadas.push(appParaAgregar);
                    this.aplicacionActual = null;
                    this.estaModificandoApp = false;
                    this.huboCambiosEnApps = true;
                },
                error: () => {
                    this.estaModificandoApp = false;
                }
            });
        } else {
            this.aplicacionActual = null;
        }
    }

    eliminarAplicacion(app: any): void {
        const idEliminar = this.obtenerId(app);
        this.estaModificandoApp = true;

        this.usuarioAdminService.deleteAplicacionFromUser({ ID_USUARIO: this.id, ID_SISTEMA: idEliminar }).subscribe({
            next: () => {
                this.aplicacionesSeleccionadas = this.aplicacionesSeleccionadas.filter(a => this.obtenerId(a) !== idEliminar);
                this.estaModificandoApp = false;
                this.huboCambiosEnApps = true;
            },
            error: () => {
                this.estaModificandoApp = false;
            }
        });
    }

    obtenerId(app: any): any {
        return app?.ID || app?.id || app?.ID_APLICACION;
    }

    guardar(): void {
        if (!this.mail.trim()) {
            Swal.fire('Error', 'El email del usuario es requerido', 'error');
            return;
        }
        if (!this.aplicacionesSeleccionadas || this.aplicacionesSeleccionadas.length === 0) {
            Swal.fire('Error', 'Debe seleccionar al menos una aplicación', 'error');
            return;
        }

        this.estaCargando = true;
        const usuarioEditado = {
            ID_USUARIO: this.id,
            MAIL: this.mail,
            NOMBRE: this.nombre,
            APELLIDO: this.apellido,
            MAIL_PERSONAL: this.mailPersonal,
            GP_CUSTNMBR: this.gpCustnmbr,
            ACTIVO: this.activo,
            ID_APLICACION: this.aplicacionesSeleccionadas.map(a => this.obtenerId(a))
        };

        this.usuarioAdminService.updateUser(usuarioEditado).subscribe({
            next: (res) => {
                this.estaCargando = false;
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'El usuario ha sido actualizado correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#222'
                });
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.estaCargando = false;
                console.error('Error al actualizar usuario:', err);
            }
        });
    }

    toggleActivo(): void {
        const nuevoEstado = this.activo === '1' ? '0' : '1';
        const payload = {
            ID_USUARIO: this.id,
            MAIL: this.mail,
            NOMBRE: this.nombre,
            APELLIDO: this.apellido,
            MAIL_PERSONAL: this.mailPersonal,
            GP_CUSTNMBR: this.gpCustnmbr,
            ACTIVO: nuevoEstado,
            ID_APLICACION: this.aplicacionesSeleccionadas.map(a => this.obtenerId(a))
        };

        this.usuarioAdminService.updateUser(payload).subscribe({
            next: () => {
                this.activo = nuevoEstado;
                const titulo = nuevoEstado === '0' ? 'Usuario deshabilitado' : 'Usuario habilitado';
                const texto = nuevoEstado === '0'
                    ? 'La cuenta ha sido deshabilitada con éxito.'
                    : 'La cuenta ha sido habilitada con éxito.';
                Swal.fire({ title: titulo, text: texto, icon: 'success', confirmButtonColor: '#222' });
            },
            error: () => {}
        });
    }

    cancelar(): void {
        this.dialogRef.close(this.huboCambiosEnApps);
    }
}
