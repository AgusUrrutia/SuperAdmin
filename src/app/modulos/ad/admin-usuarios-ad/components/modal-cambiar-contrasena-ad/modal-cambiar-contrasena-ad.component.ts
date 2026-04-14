import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-cambiar-contrasena-ad',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './modal-cambiar-contrasena-ad.component.html',
  styleUrl: './modal-cambiar-contrasena-ad.component.scss'
})
export class ModalCambiarContrasenaAdComponent {
  contrasenaData = {
    nueva: '',
    confirmar: ''
  };

  usuario: any;
  mostrarNueva: boolean = false;
  mostrarConfirmar: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ModalCambiarContrasenaAdComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.usuario = data?.usuario;
  }

  cambiar(): void {
    if (!this.contrasenaData.nueva || !this.contrasenaData.confirmar) {
      return; 
    }
    
    if (this.contrasenaData.nueva !== this.contrasenaData.confirmar) {
      // Handled in HTML, but good to double check
      return;
    }

    // Simular cambio
    console.log('Cambiando contraseña al usuario AD:', this.usuario?.correo, this.contrasenaData);
    this.dialogRef.close(this.contrasenaData.nueva);
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
