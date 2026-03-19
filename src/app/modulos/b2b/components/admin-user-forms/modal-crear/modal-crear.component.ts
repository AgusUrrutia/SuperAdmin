import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UsuarioService } from '../../../services/usuario.service';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-crear',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatOptionModule,
    MatSelectModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './modal-crear.component.html',
  styleUrl: './modal-crear.component.scss'
})
export class ModalCrearComponent {

  nuevoUsuario: any= {
    MAIL: '',
    GP_CUSTNMBR: '' 
  };

  // Recibimos los roles desde el componente que abre el modal
  constructor(
    public dialogRef: MatDialogRef<ModalCrearComponent>,
    private userService: UsuarioService,
    @Inject(MAT_DIALOG_DATA) public data: { 
      roles: any, 
      permisosHeredar: any[]
    }
  ) {
    if (data?.roles) {
    }
  }

  crear(): void {
    if (!this.nuevoUsuario.MAIL || 
        !this.nuevoUsuario.GP_CUSTNMBR) {
      return;
    }
    console.log('Creando usuario:', this.nuevoUsuario);
    
    this.userService.createUser(this.nuevoUsuario).subscribe({
      next: (response) => {
        console.log('Usuario creado con éxito:', response);
        this.userService.reloadUsers();
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error al crear el usuario:', error);
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
