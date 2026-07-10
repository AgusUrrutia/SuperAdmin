import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioAdminService } from '../../../services/usuario-admin.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-crear-usuario-sgs',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    templateUrl: './crear-usuario-sgs.component.html',
    styleUrl: './crear-usuario-sgs.component.scss'
})
export class CrearUsuarioSgsComponent implements OnInit {
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

    constructor(
        private usuarioAdminService: UsuarioAdminService,
        public dialogRef: MatDialogRef<CrearUsuarioSgsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { existingMails?: string[] }
    ) { }

    ngOnInit(): void {
        this.cargarAplicaciones();
    }

    cargarAplicaciones(): void {
        this.usuarioAdminService.getAplicaciones().subscribe({
            next: (res) => {
                this.aplicaciones = res.data || res || [];
            },
            error: (err) => console.error('Error al cargar aplicaciones', err)
        });
    }

    agregarAplicacion(): void {
        if (!this.aplicacionActual) return;
        
        const idActual = this.obtenerId(this.aplicacionActual);
        const yaExiste = this.aplicacionesSeleccionadas.find(a => this.obtenerId(a) === idActual);
        
        if (!yaExiste) {
            this.aplicacionesSeleccionadas.push(this.aplicacionActual);
        }
        this.aplicacionActual = null;
    }

    eliminarAplicacion(app: any): void {
        const idEliminar = this.obtenerId(app);
        this.aplicacionesSeleccionadas = this.aplicacionesSeleccionadas.filter(a => this.obtenerId(a) !== idEliminar);
    }

    obtenerId(app: any): any {
        return app?.ID || app?.id || app?.ID_APLICACION;
    }

    guardar(): void {
        if (!this.mail.trim()) {
            Swal.fire('Error', 'El email del usuario es requerido', 'error');
            return;
        }

        const mailNormalizado = this.mail.toLowerCase().trim();
        const existingMails = this.data?.existingMails ?? [];
        if (existingMails.includes(mailNormalizado)) {
            Swal.fire({
                icon: 'warning',
                title: 'Email duplicado',
                text: 'Ya existe un usuario con ese email. Si deseas agregar otra cuenta, usá la opción "Editar" en la tabla y creá una nueva instancia desde el modal de edición.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#222'
            });
            return;
        }

        if (!this.aplicacionesSeleccionadas || this.aplicacionesSeleccionadas.length === 0) {
            Swal.fire('Error', 'Debe seleccionar al menos una aplicación', 'error');
            return;
        }

        this.estaCargando = true;
        const nuevoUsuario = {
            MAIL: this.mail,
            NOMBRE: this.nombre,
            APELLIDO: this.apellido,
            MAIL_PERSONAL: this.mailPersonal,
            GP_CUSTNMBR: this.gpCustnmbr,
            ACTIVO: this.activo,
            ID_APLICACION: this.aplicacionesSeleccionadas.map(a => this.obtenerId(a))
        };

        this.usuarioAdminService.createUser(nuevoUsuario).subscribe({
            next: (res) => {
                this.estaCargando = false;
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'El usuario ha sido creado correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#222'
                });
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.estaCargando = false;
                console.error('Error al crear usuario:', err);
            }
        });
    }

    cancelar(): void {
        this.dialogRef.close(false);
    }
}
