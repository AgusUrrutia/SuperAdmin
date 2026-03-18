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
    estaCargando: boolean = false;

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
        }
    }

    guardar(): void {
        if (!this.mail.trim()) {
            Swal.fire('Error', 'El email del usuario es requerido', 'error');
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
            ACTIVO: this.activo
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

    cancelar(): void {
        this.dialogRef.close(false);
    }
}
