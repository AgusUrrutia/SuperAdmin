import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsuarioService } from '../../../services/usuario.service';
import Swal from 'sweetalert2';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-editar',
  standalone: true,
  imports: [
    MatButtonModule,
    FormsModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './modal-editar.component.html',
  styleUrls: ['../modal-crear/modal-crear.component.scss']
})
export class ModalEditarComponent {
  usuario: any = {
    MAIL: '',
    GP_CUSTNMBR: ''
  };

  constructor(
    public dialogRef: MatDialogRef<ModalEditarComponent>,
    private userService: UsuarioService,
    @Inject(MAT_DIALOG_DATA) public data: {
      usuario: any
    }
  ) {
    this.usuario = { ...data.usuario };
  }

  changeActivo(): void {
    this.userService.changeActivo(this.usuario.ID_USUARIO).subscribe({
      next: () => {
        if(this.usuario.ACTIVO === "1"){
          Swal.fire('Usuario deshabilitado', 'El usuario ha sido deshabilitado con éxito.', 'success');
        } else {
          Swal.fire('Usuario habilitado', 'El usuario ha sido habilitado con éxito.', 'success');
        }
        this.userService.reloadUsers();
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error al deshabilitar el usuario:', err);
        Swal.fire('Error', 'No se pudo deshabilitar el usuario.', 'error');
      }
    });
  }

  guardar(): void {
    if (!this.usuario.MAIL || !this.usuario.GP_CUSTNMBR) {
      Swal.fire('Campos incompletos', 'Por favor completa todos los campos requeridos.', 'warning');
      return;
    }
    
    // Mostramos un loader similar a otros componentes
    Swal.fire({
      title: 'Guardando cambios...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.userService.updateUser(this.usuario).subscribe({
      next: (response) => {
        Swal.close();
        console.log('Usuario actualizado con éxito:', response);
        this.userService.reloadUsers();
        this.dialogRef.close(this.usuario);
      },
      error: (error) => {
        Swal.close();
        console.error('Error al actualizar el usuario:', error);
        Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error');
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
