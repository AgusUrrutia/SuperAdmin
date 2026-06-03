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
import Swal from 'sweetalert2';

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

  nuevoUsuario: any = {
    NOMBRE: '',
    MAIL: '',
    GP_CUSTNMBR: '' 
  };

  aplicacionActual: any = null;
  aplicacionesSeleccionadas: any[] = [];
  aplicaciones: any[] = [];

  // Recibimos los roles desde el componente que abre el modal
  constructor(
    public dialogRef: MatDialogRef<ModalCrearComponent>,
    private userService: UsuarioService,
    @Inject(MAT_DIALOG_DATA) public data: { 
      roles: any, 
      permisosHeredar: any[],
      existingMails?: string[] // <-- nuevo
    }
  ) {}

  ngOnInit(): void {
    this.cargarAplicaciones();
  }

  cargarAplicaciones(): void {
    this.userService.getAplicaciones().subscribe({
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

  crear(): void {
    if (!this.nuevoUsuario.NOMBRE || !this.nuevoUsuario.MAIL || !this.nuevoUsuario.GP_CUSTNMBR) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor, complete todos los campos marcados con *',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#222'
      });
      return;
    }

    // Validación de correo duplicado
    const mail = (this.nuevoUsuario.MAIL || '').toLowerCase().trim();
    const existing = this.data.existingMails ?? [];
    if (existing.includes(mail)) {
      Swal.fire({
        icon: 'warning',
        title: 'Email duplicado',
        text: 'Ya existe un usuario con ese email. Si deseas agregar otra cuenta, usa la opción "Editar" en la tabla y crea una nueva instancia desde el modal de edición.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#222'
      });
      return;
    }
    
    if (this.aplicacionesSeleccionadas.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan aplicaciones',
        text: 'Debe seleccionar al menos una aplicación para el usuario.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#222'
      });
      return;
    }

    this.nuevoUsuario.ID_APLICACION = this.aplicacionesSeleccionadas.map(a => String(this.obtenerId(a)));
    
    console.log('Creando usuario:', this.nuevoUsuario);
    
    this.userService.createUser(this.nuevoUsuario).subscribe({
      next: (response) => {
        console.log('Usuario creado con éxito:', response);
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'El usuario ha sido creado correctamente.',
          confirmButtonColor: '#222'
        });
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
