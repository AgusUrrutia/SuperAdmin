import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioAdminService } from '../../../../core/services/usuario-admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-crear-usuario',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    templateUrl: './crear.component.html',
    styleUrl: './crear.component.scss'
})
export class CrearUsuarioComponent {
    static label = 'Crear Usuario';
    static tooltip = "Crear Usuario"
    static icon = '';
    static title = "Crear usuario"
    
    mail: string = '';
    nombre: string = '';
    apellido: string = '';
    mailPersonal: string = '';
    gpCustnmbr: string = '';
    activo: string = '1';
    estaCargando: boolean = false;

    constructor(
        private usuarioAdminService: UsuarioAdminService,
        public dialogRef: MatDialogRef<CrearUsuarioComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    guardar(): void {
        if (!this.mail.trim()) {
            Swal.fire('Error', 'El email del usuario es requerido', 'error');
            return;
        }

        this.estaCargando = true;
        const nuevoUsuario = {
            MAIL: this.mail,
            NOMBRE: this.nombre,
            APELLIDO: this.apellido,
            MAIL_PERSONAL: this.mailPersonal,
            GP_CUSTNMBR: this.gpCustnmbr,
            ACTIVO: this.activo
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
