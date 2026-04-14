import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-crear-usuario-ad',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './modal-crear-usuario-ad.component.html',
  styleUrl: './modal-crear-usuario-ad.component.scss'
})
export class ModalCrearUsuarioAdComponent {
  nuevoUsuario = {
    nombre: '',
    apellido: '',
    correo: '',
    contrasena: '',
    descripcion: ''
  };

  mostrarContrasena: boolean = false;

  constructor(public dialogRef: MatDialogRef<ModalCrearUsuarioAdComponent>) { }

  crear(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.apellido || !this.nuevoUsuario.correo || !this.nuevoUsuario.contrasena) {
      return; // Basic validation block, the UI has required checks
    }

    // Simular creación
    console.log('Creando usuario AD:', this.nuevoUsuario);
    this.dialogRef.close(this.nuevoUsuario);
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
