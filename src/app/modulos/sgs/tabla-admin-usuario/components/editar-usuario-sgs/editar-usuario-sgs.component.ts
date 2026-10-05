import { Component, Inject } from '@angular/core';
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
export class EditarUsuarioSgsComponent {

    instancias: any[] = [];
    instanciaSeleccionada: any;

    usuario: any = { MAIL: '', GP_CUSTNMBR: '' };

    aplicacionActual: any = null;
    aplicacionesSeleccionadas: any[] = [];
    aplicaciones: any[] = [];
    estaModificandoApp: boolean = false;
    huboCambiosEnApps: boolean = false;

    modoCrearInstancia = false;
    nuevaInstancia: any = { MAIL: '', GP_CUSTNMBR: '', NOMBRE: '', APELLIDO: '' };

    constructor(
        public dialogRef: MatDialogRef<EditarUsuarioSgsComponent>,
        private usuarioAdminService: UsuarioAdminService,
        @Inject(MAT_DIALOG_DATA) public data: {
            usuario: any,
            instancias?: any[]
        }
    ) {
        this.instancias = (data.instancias ?? [data.usuario]).slice().sort((a: any, b: any) => {
            if (a.ACTIVO !== b.ACTIVO) return a.ACTIVO === '1' ? -1 : 1;
            return Number(a.ID_USUARIO) - Number(b.ID_USUARIO);
        });
        this.seleccionarInstancia(this.instancias[0]);
    }

    seleccionarInstancia(inst: any): void {
        this.instanciaSeleccionada = inst;
        this.usuario = { ...inst };
        this.aplicacionesSeleccionadas = [];
        this.modoCrearInstancia = false;
        this.cargarAplicaciones();
    }

    cargarAplicaciones(): void {
        this.usuarioAdminService.getAplicaciones().subscribe({
            next: (res) => {
                this.aplicaciones = res.data || res || [];
                const sysNames: string[] = this.usuario.sistemas || [];
                const appIds: any[] = this.usuario.ID_APLICACION || [];

                this.aplicacionesSeleccionadas = this.aplicaciones.filter(app => {
                    const appId = this.obtenerId(app);
                    const appName = app?.SISTEMA || app?.nombre || app?.NOMBRE;
                    return (appName && sysNames.includes(appName)) ||
                        (appIds.includes(appId)) ||
                        (appIds.includes(String(appId)));
                });
            },
            error: (err) => console.error('Error al cargar aplicaciones', err)
        });
    }

    obtenerId(app: any): any {
        return app?.ID || app?.id || app?.ID_APLICACION;
    }

    agregarAplicacion(): void {
        if (!this.aplicacionActual) return;
        const idActual = this.obtenerId(this.aplicacionActual);
        const yaExiste = this.aplicacionesSeleccionadas.find(a => String(this.obtenerId(a)) === String(idActual));

        if (!yaExiste) {
            this.estaModificandoApp = true;
            const appParaAgregar = this.aplicacionActual;
            this.usuarioAdminService.addAplicacionToUser({ ID_USUARIO: this.usuario.ID_USUARIO, ID_SISTEMA: idActual }).subscribe({
                next: () => {
                    this.aplicacionesSeleccionadas.push(appParaAgregar);
                    this.aplicacionActual = null;
                    this.estaModificandoApp = false;
                    this.huboCambiosEnApps = true;
                },
                error: () => {
                    this.estaModificandoApp = false;
                    Swal.fire('Error', 'No se pudo agregar la aplicación.', 'error');
                }
            });
        } else {
            this.aplicacionActual = null;
        }
    }

    eliminarAplicacion(app: any): void {
        const idEliminar = this.obtenerId(app);
        this.estaModificandoApp = true;
        this.usuarioAdminService.deleteAplicacionFromUser({ ID_USUARIO: this.usuario.ID_USUARIO, ID_SISTEMA: idEliminar }).subscribe({
            next: () => {
                this.aplicacionesSeleccionadas = this.aplicacionesSeleccionadas.filter(a => String(this.obtenerId(a)) !== String(idEliminar));
                this.estaModificandoApp = false;
                this.huboCambiosEnApps = true;
            },
            error: () => {
                this.estaModificandoApp = false;
                Swal.fire('Error', 'No se pudo eliminar la aplicación.', 'error');
            }
        });
    }

    toggleActivo(): void {
        const nuevoEstado = this.usuario.ACTIVO === '1' ? '0' : '1';
        const payload = {
            ...this.usuario,
            ACTIVO: nuevoEstado,
            ID_APLICACION: this.aplicacionesSeleccionadas.map(a => this.obtenerId(a))
        };
        this.usuarioAdminService.updateUser(payload).subscribe({
            next: () => {
                this.usuario.ACTIVO = nuevoEstado;
                const idx = this.instancias.findIndex(i => i.ID_USUARIO === this.usuario.ID_USUARIO);
                if (idx !== -1) this.instancias[idx] = { ...this.instancias[idx], ACTIVO: nuevoEstado };
                const titulo = nuevoEstado === '0' ? 'Usuario deshabilitado' : 'Usuario habilitado';
                const texto = nuevoEstado === '0' ? 'La cuenta ha sido deshabilitada con éxito.' : 'La cuenta ha sido habilitada con éxito.';
                Swal.fire({ title: titulo, text: texto, icon: 'success', confirmButtonColor: '#222', timer: 1500, showConfirmButton: false });
                this.usuarioAdminService.reloadUsers();
                this.huboCambiosEnApps = true;
            },
            error: () => Swal.fire('Error', 'No se pudo cambiar el estado de la cuenta.', 'error')
        });
    }

    guardar(): void {
        if (!this.usuario.MAIL || !this.usuario.GP_CUSTNMBR) {
            Swal.fire('Campos incompletos', 'Por favor completa todos los campos requeridos.', 'warning');
            return;
        }

        this.usuario.ID_APLICACION = this.aplicacionesSeleccionadas.map(a => this.obtenerId(a));

        Swal.fire({ title: 'Guardando cambios...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        this.usuarioAdminService.updateUser(this.usuario).subscribe({
            next: () => {
                Swal.close();
                const idx = this.instancias.findIndex(i => i.ID_USUARIO === this.usuario.ID_USUARIO);
                if (idx !== -1) this.instancias[idx] = { ...this.instancias[idx], ...this.usuario };
                Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Los cambios se han guardado con éxito.', timer: 1500, showConfirmButton: false });
                this.usuarioAdminService.reloadUsers();
                this.huboCambiosEnApps = true;
            },
            error: () => {
                Swal.close();
                Swal.fire('Error', 'No se pudo actualizar la cuenta.', 'error');
            }
        });
    }

    abrirCrearInstancia(): void {
        this.modoCrearInstancia = true;
        this.nuevaInstancia = {
            MAIL: this.usuario.MAIL,
            NOMBRE: this.usuario.NOMBRE,
            APELLIDO: this.usuario.APELLIDO,
            GP_CUSTNMBR: ''
        };
    }

    cancelarCrearInstancia(): void {
        this.modoCrearInstancia = false;
    }

    crearInstancia(): void {
        if (!this.nuevaInstancia.GP_CUSTNMBR) {
            Swal.fire('Campo requerido', 'El Código Cliente GP es obligatorio.', 'warning');
            return;
        }
        Swal.fire({ title: 'Creando instancia...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        this.nuevaInstancia.ID_APLICACION = [];

        this.usuarioAdminService.createUser(this.nuevaInstancia).subscribe({
            next: (response) => {
                Swal.close();
                Swal.fire({ title: '¡Instancia creada!', text: 'La cuenta ha sido vinculada con éxito.', icon: 'success', timer: 2000, showConfirmButton: false });
                this.modoCrearInstancia = false;
                this.usuarioAdminService.reloadUsers();
                this.huboCambiosEnApps = true;

                if (response) {
                    const nueva = {
                        ...this.nuevaInstancia,
                        ID_USUARIO: response.ID_USUARIO || response.id || response.data?.ID_USUARIO,
                        ACTIVO: '1',
                        sistemas: []
                    };
                    this.instancias.push(nueva);
                    this.seleccionarInstancia(nueva);
                } else {
                    const mail = this.nuevaInstancia.MAIL.toLowerCase().trim();
                    // Busca en la API las cuentas de ese mail (no solo entre los primeros registros)
                    this.usuarioAdminService.getUsers('all', 500, 0, mail).subscribe((allUsers: any[]) => {
                        this.instancias = allUsers.filter(u => (u.MAIL || '').toLowerCase().trim() === mail);
                        const creada = this.instancias.find(i => i.GP_CUSTNMBR === this.nuevaInstancia.GP_CUSTNMBR) || this.instancias[this.instancias.length - 1];
                        if (creada) this.seleccionarInstancia(creada);
                    });
                }
            },
            error: () => {
                Swal.close();
                Swal.fire('Error', 'No se pudo crear la instancia.', 'error');
            }
        });
    }

    onCancelar(): void {
        this.dialogRef.close(this.huboCambiosEnApps);
    }
}
