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
  // ── Instancias ───────────────────────────────────────────────────────────
  instancias: any[] = [];             // todas las instancias con el mismo mail
  instanciaSeleccionada: any;         // la instancia actualmente activa en el panel de edición

  // ── Estado de la instancia activa ────────────────────────────────────────
  usuario: any = {
    MAIL: '',
    GP_CUSTNMBR: ''
  };

  aplicacionActual: any = null;
  aplicacionesSeleccionadas: any[] = [];
  aplicaciones: any[] = [];
  estaModificandoApp: boolean = false;
  huboCambiosEnApps: boolean = false;

  // ── Crear nueva instancia ────────────────────────────────────────────────
  modoCrearInstancia = false;
  nuevaInstancia: any = { MAIL: '', GP_CUSTNMBR: '', NOMBRE: '', APELLIDO: '' };

  constructor(
    public dialogRef: MatDialogRef<ModalEditarComponent>,
    private userService: UsuarioService,
    @Inject(MAT_DIALOG_DATA) public data: {
      usuario: any,
      instancias?: any[]
    }
  ) {
    this.instancias = data.instancias ?? [data.usuario];
    this.seleccionarInstancia(this.instancias[0]);
  }

  ngOnInit(): void {
    // Las aplicaciones se cargan dinámicamente al seleccionar instancia
  }

  seleccionarInstancia(inst: any): void {
    this.instanciaSeleccionada = inst;
    this.usuario = { ...inst };
    this.aplicacionesSeleccionadas = [];
    this.modoCrearInstancia = false;
    this.cargarAplicaciones();
  }

  cargarAplicaciones(): void {
    this.userService.getAplicaciones().subscribe({
      next: (res) => {
        this.aplicaciones = res.data || res || [];
        if (this.usuario.SISTEMAS && this.usuario.SISTEMAS.length > 0) {
          const sysIds = this.usuario.SISTEMAS.map((s: any) => String(this.obtenerId(s)));
          this.aplicacionesSeleccionadas = this.aplicaciones.filter(app => sysIds.includes(String(this.obtenerId(app))));
        } else {
          this.aplicacionesSeleccionadas = [];
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
          // Actualizar en el objeto usuario local la lista de sistemas
          if (!this.usuario.SISTEMAS) this.usuario.SISTEMAS = [];
          this.usuario.SISTEMAS.push(appParaAgregar);
          const idx = this.instancias.findIndex(i => i.ID_USUARIO === this.usuario.ID_USUARIO);
          if (idx !== -1) {
            this.instancias[idx] = { ...this.instancias[idx], SISTEMAS: [...this.usuario.SISTEMAS] };
          }
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
        // Actualizar en el objeto usuario local la lista de sistemas
        if (this.usuario.SISTEMAS) {
          this.usuario.SISTEMAS = this.usuario.SISTEMAS.filter((s: any) => String(this.obtenerId(s)) !== String(idEliminar));
        }
        const idx = this.instancias.findIndex(i => i.ID_USUARIO === this.usuario.ID_USUARIO);
        if (idx !== -1) {
          this.instancias[idx] = { ...this.instancias[idx], SISTEMAS: this.usuario.SISTEMAS ? [...this.usuario.SISTEMAS] : [] };
        }
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
        const nuevoEstado = this.usuario.ACTIVO === '1' ? '0' : '1';
        this.usuario.ACTIVO = nuevoEstado;
        
        // Actualizar en la lista local de instancias
        const idx = this.instancias.findIndex(i => i.ID_USUARIO === this.usuario.ID_USUARIO);
        if (idx !== -1) {
          this.instancias[idx] = { ...this.instancias[idx], ACTIVO: nuevoEstado };
        }

        if(nuevoEstado === "0"){
          Swal.fire('Usuario deshabilitado', 'La cuenta ha sido deshabilitada con éxito.', 'success');
        } else {
          Swal.fire('Usuario habilitado', 'La cuenta ha sido habilitada con éxito.', 'success');
        }
        
        this.userService.reloadUsers();
        this.huboCambiosEnApps = true;
      },
      error: (err) => {
        console.error('Error al cambiar el estado del usuario:', err);
        Swal.fire('Error', 'No se pudo cambiar el estado de la cuenta.', 'error');
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

    Swal.fire({
      title: 'Guardando cambios...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.userService.updateUser(this.usuario).subscribe({
      next: (response) => {
        Swal.close();
        console.log('Usuario actualizado con éxito:', response);
        
        // Actualizar la instancia activa en la lista local
        const idx = this.instancias.findIndex(i => i.ID_USUARIO === this.usuario.ID_USUARIO);
        if (idx !== -1) {
          this.instancias[idx] = { ...this.instancias[idx], ...this.usuario };
        }

        Swal.fire({
          icon: 'success',
          title: '¡Guardado!',
          text: 'Los cambios se han guardado con éxito.',
          timer: 1500,
          showConfirmButton: false
        });

        this.userService.reloadUsers();
        this.huboCambiosEnApps = true;
      },
      error: (error) => {
        Swal.close();
        console.error('Error al actualizar el usuario:', error);
        Swal.fire('Error', 'No se pudo actualizar la cuenta.', 'error');
      }
    });
  }

  // ── Nueva instancia ──────────────────────────────────────────────────────
  abrirCrearInstancia(): void {
    this.modoCrearInstancia = true;
    this.nuevaInstancia = {
      MAIL: this.usuario.MAIL,
      NOMBRE: this.usuario.NOMBRE,
      APELLIDO: this.usuario.APELLIDO,
      GP_CUSTNMBR: ''
    };
  }

  cancelarCrearInstancia(): void {
    this.modoCrearInstancia = false;
  }

  crearInstancia(): void {
    if (!this.nuevaInstancia.GP_CUSTNMBR) {
      Swal.fire('Campo requerido', 'El Código Cliente GP es obligatorio.', 'warning');
      return;
    }
    Swal.fire({ title: 'Creando instancia...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    // Configurar la nueva instancia
    this.nuevaInstancia.ID_APLICACION = [];

    this.userService.createUser(this.nuevaInstancia).subscribe({
      next: (response) => {
        Swal.close();
        Swal.fire({ 
          title: '¡Instancia creada!', 
          text: 'La cuenta ha sido vinculada con éxito. Ahora puedes asignarle aplicaciones.', 
          icon: 'success', 
          timer: 2000, 
          showConfirmButton: false 
        });
        this.modoCrearInstancia = false;
        this.userService.reloadUsers();
        this.huboCambiosEnApps = true;

        if (response) {
          const nueva = { 
            ...this.nuevaInstancia, 
            ID_USUARIO: response.ID_USUARIO || response.id || response.data?.ID_USUARIO,
            ACTIVO: '1', 
            SISTEMAS: [] 
          };
          this.instancias.push(nueva);
          this.seleccionarInstancia(nueva);
        } else {
          // Si el servidor no devuelve el ID, lo recargamos filtrando por mail
          this.userService.getAllUsers().subscribe((allUsers) => {
            const mail = this.nuevaInstancia.MAIL.toLowerCase().trim();
            this.instancias = allUsers.filter(u => (u.MAIL || '').toLowerCase().trim() === mail);
            const creada = this.instancias.find(i => i.GP_CUSTNMBR === this.nuevaInstancia.GP_CUSTNMBR) || this.instancias[this.instancias.length - 1];
            if (creada) {
              this.seleccionarInstancia(creada);
            }
          });
        }
      },
      error: () => {
        Swal.close();
        Swal.fire('Error', 'No se pudo crear la instancia.', 'error');
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close(this.huboCambiosEnApps);
  }
}
