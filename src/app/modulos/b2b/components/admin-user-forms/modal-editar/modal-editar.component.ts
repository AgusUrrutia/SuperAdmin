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
  styleUrls: ['./modal-editar.component.scss']
})
export class ModalEditarComponent {
  usuario: any = {
    MAIL: '',
    GP_CUSTNMBR: ''
  };

  aplicacionActual: any = null;
  aplicacionesSeleccionadas: any[] = [];
  aplicaciones: any[] = [];
  estaModificandoApp: boolean = false;
  huboCambiosEnApps: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ModalEditarComponent>,
    private userService: UsuarioService,
    @Inject(MAT_DIALOG_DATA) public data: {
      usuario: any
    }
  ) {
    this.usuario = { ...data.usuario };
  }

  ngOnInit(): void {
    this.cargarAplicaciones();
  }

  cargarAplicaciones(): void {
    this.userService.getAplicaciones().subscribe({
      next: (res) => {
        this.aplicaciones = res.data || res || [];
        if (this.usuario.SISTEMAS && this.usuario.SISTEMAS.length > 0) {
          const sysIds = this.usuario.SISTEMAS.map((s: any) => String(this.obtenerId(s)));
          this.aplicacionesSeleccionadas = this.aplicaciones.filter(app => sysIds.includes(String(this.obtenerId(app))));
        }
      },
      error: (err) => console.error('Error al cargar aplicaciones', err)
    });
  }

  obtenerId(app: any): any {
    return app?.ID || app?.id || app?.ID_APLICACION;
  }

  agregarAplicacion(): void {
    if (!this.aplicacionActual) return;
    const idActual = this.obtenerId(this.aplicacionActual);
    const yaExiste = this.aplicacionesSeleccionadas.find(a => String(this.obtenerId(a)) === String(idActual));

    if (!yaExiste) {
      this.estaModificandoApp = true;
      const appParaAgregar = this.aplicacionActual;
      this.userService.addAplicacionToUser({ ID_USUARIO: this.usuario.ID_USUARIO, ID_SISTEMA: idActual }).subscribe({
        next: () => {
          this.aplicacionesSeleccionadas.push(appParaAgregar);
          this.aplicacionActual = null;
          this.estaModificandoApp = false;
          this.huboCambiosEnApps = true;
        },
        error: () => {
          this.estaModificandoApp = false;
          Swal.fire('Error', 'No se pudo agregar la aplicación.', 'error');
        }
      });
    } else {
      this.aplicacionActual = null;
    }
  }

  eliminarAplicacion(app: any): void {
    const idEliminar = this.obtenerId(app);
    this.estaModificandoApp = true;

    this.userService.deleteAplicacionFromUser({ ID_USUARIO: this.usuario.ID_USUARIO, ID_SISTEMA: idEliminar }).subscribe({
      next: () => {
        this.aplicacionesSeleccionadas = this.aplicacionesSeleccionadas.filter(a => String(this.obtenerId(a)) !== String(idEliminar));
        this.estaModificandoApp = false;
        this.huboCambiosEnApps = true;
      },
      error: () => {
        this.estaModificandoApp = false;
        Swal.fire('Error', 'No se pudo eliminar la aplicación.', 'error');
      }
    });
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
    
    if (this.aplicacionesSeleccionadas.length === 0) {
      Swal.fire('Error', 'Debe seleccionar al menos una aplicación.', 'error');
      return;
    }

    this.usuario.ID_APLICACION = this.aplicacionesSeleccionadas.map(a => this.obtenerId(a));

    
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
    if (this.huboCambiosEnApps) {
        this.userService.reloadUsers();
    }
    this.dialogRef.close(this.huboCambiosEnApps);
  }
}
