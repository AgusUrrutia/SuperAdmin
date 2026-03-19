import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioService } from '../../../services/usuario.service';
import { ModalEditarComponent } from '../modal-editar/modal-editar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-editar-distribuidor',
  standalone: true,
  imports: [
    MatButtonModule,
    FormsModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './modal-editar-distribuidor.component.html',
  styleUrls: ['../modal-crear/modal-crear.component.scss'] // Usar estilo centralizado SGS
})
export class ModalEditarDistribuidorComponent implements OnInit{
  usuario: any = {
    MAIL: '',
    GP_CUSTNMBR: '',
    ROLES: []
  };

  rol: any;
  rolesDisponibles: any[] = [];
  loadingRoles = false;

  // Opciones para los checkboxes (puedes personalizarlas)
  opciones: any[] = [];
  //  = [
  //   { id: 'opcion1', label: 'Administrativo' },
  //   { id: 'opcion2', label: 'Comercial' },
  //   { id: 'opcion3', label: 'Tecnico' }
  // ];

  // Almacena las opciones seleccionadas (por ID)
  opcionesSeleccionadas: any[] = []; // valor inicial opcional

  constructor(
    public dialogRef: MatDialogRef<ModalEditarComponent>,
    private userService: UsuarioService,
    @Inject(MAT_DIALOG_DATA) public data: {
      roles: any[],
      usuario: any,
      rol: any
      rolData: any
    }
  ) {
    
    this.usuario = { ...data.usuario };
    console.log('Usuario recibido en el modal:', this.usuario);
    this.rolesDisponibles = data.roles;
    this.rol = data.rol;
    console.log('Rol recibido en el modal:', this.rol);
    
    // Estos son los perfiles seleccionados
    // this.opcionesSeleccionadas = (data.rolData[0].perfiles_asignados || []).map((perfil: any) => perfil.id_perfil);
    console.log('Opciones seleccionadas iniciales:', this.opcionesSeleccionadas);
    
  }


  ngOnInit(): void {

    this.userService.getPerfilesPermitidos(this.rol.ID_ROLES).subscribe(
      (perfiles: any[]) => {
        this.opciones = perfiles[0].perfiles_posibles_del_rol.map((perfil: any) => ({
          id_perfil: perfil.id_perfil, 
          nombre_perfil: perfil.nombre_perfil
        }));
        
        // Volver a extraer los IDs para asegurar consistencia
        this.opcionesSeleccionadas = (this.data.rolData[0].perfiles_asignados || []).map((perfil: any) => perfil.id_perfil);
        
        console.log('Opciones disponibles:', this.opciones);
        console.log('IDs seleccionados finales:', this.opcionesSeleccionadas);
      },
      (error: any) => {
        console.error('Error al cargar perfiles permitidos:', error);
      }
    );
  }
  addPerfilToUser(perfilId: string): void {
    const idRol = this.rol.ID_ROLES;
    this.userService.addPerfilToUser(idRol, perfilId).subscribe({
      next: (response: any) => {
        console.log('Perfil agregado al usuario con éxito:', response);
      },
      error: (error: any) => {
        console.error('Error al agregar perfil al usuario:', error);
      }
    });
  }
  isPerfilSelected(idPerfil: string): boolean {
    // console.log('Verificando si el perfil está seleccionado:', idPerfil, this.opcionesSeleccionadas);
    return this.opcionesSeleccionadas.some(perfil => perfil=== idPerfil);
  }
  

  // Método auxiliar para marcar/desmarcar
  toggleOpcion(perfilId: string, event: any): void {
    const checked = event.target ? event.target.checked : event.checked; // Compatibility for native checkbox
    
    if (checked) {
      // Buscar el objeto completo del perfil
      const perfilCompleto = this.opciones.find(p => p.id_perfil === perfilId);
      if (perfilCompleto && !this.opcionesSeleccionadas.some(p => p.id_perfil === perfilId)) {
        this.opcionesSeleccionadas.push(perfilCompleto);
      }
    } else {
      this.opcionesSeleccionadas = this.opcionesSeleccionadas.filter(p => p.id_perfil !== perfilId);
    }
    
    console.log('Perfiles seleccionados:', this.opcionesSeleccionadas);
    
    // Llamar al servicio
    const idRol = this.rol.ID_ROLES;
    this.userService.addPerfilToUser(idRol, perfilId).subscribe({
      next: (response: any) => {
        console.log('Perfil actualizado con éxito:', response);
      },
      error: (error: any) => {
        console.error('Error al actualizar perfil:', error);
        // Revertir si hay error
        if (checked) {
          this.opcionesSeleccionadas = this.opcionesSeleccionadas.filter(p => p.id_perfil !== perfilId);
        } else {
          const perfilCompleto = this.opciones.find(p => p.id_perfil === perfilId);
          if (perfilCompleto) this.opcionesSeleccionadas.push(perfilCompleto);
        }
      }
    });
  }



  guardar(): void {
    // Ejemplo: guardar en usuario.OPCIONES
    this.usuario.OPCIONES = [...this.opcionesSeleccionadas];
    this.dialogRef.close(this.usuario);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}