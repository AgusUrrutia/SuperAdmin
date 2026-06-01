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

  get correoCorporativo(): string {
    const cleanString = (str: string) => str ? str.trim().toLowerCase().replace(/ñ/g, 'n') : '';

    const nombre = cleanString(this.nuevoUsuario.nombre).substring(0, 2);
    const apellido = cleanString(this.nuevoUsuario.apellido).replace(/\s+/g, '');
    
    if (nombre || apellido) {
      return `${nombre}${apellido}@ranko.com.ar`;
    }
    return '';
  }

  get tieneEnie(): boolean {
    const nombreCompleto = (this.nuevoUsuario.nombre || '') + (this.nuevoUsuario.apellido || '');
    return nombreCompleto.toLowerCase().includes('ñ');
  }

  crear(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.apellido || !this.nuevoUsuario.correo || !this.nuevoUsuario.contrasena) {
      return; // Basic validation block, the UI has required checks
    }

    // Simular creación
    const resultado = {
      ...this.nuevoUsuario,
      correoCorporativo: this.correoCorporativo
    };
    console.log('Creando usuario AD:', resultado);
    this.dialogRef.close(resultado);
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
