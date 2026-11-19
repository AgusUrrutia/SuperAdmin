import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { AppsMenuAdminService, RolGrupoApp, SistemaAdmin, TipoRolGrupo } from '../../../services/apps-menu-admin.service';

// ABM de los roles y grupos propios de una app (SISTEMA_ROL / SISTEMA_GRUPO).
// Cada cambio se guarda en el momento. Un rol/grupo asignado a usuarios no se puede eliminar: se desactiva
// (inactivo = el login no lo devuelve y no se puede asignar).
@Component({
  selector: 'app-modal-roles-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './modal-roles-grupos.component.html',
  styleUrls: ['../modal-aplicaciones.scss', './modal-roles-grupos.component.scss']
})
export class ModalRolesGruposComponent implements OnInit {

  pestana: TipoRolGrupo = 'rol';

  roles: RolGrupoApp[] = [];
  grupos: RolGrupoApp[] = [];
  cargando = true;

  nuevo = { NOMBRE: '', DESCRIPCION: '' };
  // Fila en edicion (una a la vez)
  editandoId: number | null = null;
  edicion = { NOMBRE: '', DESCRIPCION: '' };

  guardando = false;
  huboCambios = false;

  constructor(
    public dialogRef: MatDialogRef<ModalRolesGruposComponent>,
    private appsMenuAdminService: AppsMenuAdminService,
    @Inject(MAT_DIALOG_DATA) public data: { sistema: SistemaAdmin }
  ) { }

  ngOnInit(): void {
    this.cargar();
  }

  get etiqueta(): string {
    return this.pestana === 'rol' ? 'rol' : 'grupo';
  }

  get items(): RolGrupoApp[] {
    return this.pestana === 'rol' ? this.roles : this.grupos;
  }

  cargar(): void {
    this.cargando = true;
    this.appsMenuAdminService.getRolesGrupos(this.data.sistema.ID).subscribe({
      next: res => {
        this.roles = res?.roles || [];
        this.grupos = res?.grupos || [];
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  cambiarPestana(tipo: TipoRolGrupo): void {
    if (this.guardando) return;
    this.pestana = tipo;
    this.cancelarEdicion();
    this.nuevo = { NOMBRE: '', DESCRIPCION: '' };
  }

  private terminoOk(mensaje: string): void {
    this.guardando = false;
    this.huboCambios = true;
    Swal.fire({ icon: 'success', title: mensaje, timer: 1200, showConfirmButton: false });
    this.cargar();
  }

  agregar(): void {
    const nombre = this.nuevo.NOMBRE.trim();
    if (!nombre || this.guardando) return;
    this.guardando = true;
    this.appsMenuAdminService.crearRolGrupo(this.pestana, {
      ID_SISTEMA: this.data.sistema.ID,
      NOMBRE: nombre,
      DESCRIPCION: this.nuevo.DESCRIPCION.trim() || null
    }).subscribe({
      next: () => {
        this.nuevo = { NOMBRE: '', DESCRIPCION: '' };
        this.terminoOk(this.pestana === 'rol' ? 'Rol creado' : 'Grupo creado');
      },
      error: () => this.guardando = false
    });
  }

  editar(item: RolGrupoApp): void {
    this.editandoId = item.ID;
    this.edicion = { NOMBRE: item.NOMBRE, DESCRIPCION: item.DESCRIPCION || '' };
  }

  cancelarEdicion(): void {
    this.editandoId = null;
  }

  guardarEdicion(item: RolGrupoApp): void {
    if (this.guardando) return;
    const nombre = this.edicion.NOMBRE.trim();
    const descripcion = this.edicion.DESCRIPCION.trim() || null;
    if (!nombre) return;
    const payload: any = { ID: item.ID };
    if (nombre !== item.NOMBRE) payload.NOMBRE = nombre;
    if (descripcion !== (item.DESCRIPCION || null)) payload.DESCRIPCION = descripcion;
    if (Object.keys(payload).length === 1) {
      this.cancelarEdicion();
      return;
    }

    const guardar = () => {
      this.guardando = true;
      this.appsMenuAdminService.updateRolGrupo(this.pestana, payload).subscribe({
        next: () => {
          this.cancelarEdicion();
          this.terminoOk(this.pestana === 'rol' ? 'Rol actualizado' : 'Grupo actualizado');
        },
        error: () => this.guardando = false
      });
    };

    // El login devuelve el nombre: si hay usuarios, la app que lo use tiene que reconocer el nombre nuevo
    if (payload.NOMBRE && item.USUARIOS > 0) {
      Swal.fire({
        icon: 'question',
        title: `¿Renombrar "${item.NOMBRE}"?`,
        text: `Lo tienen ${item.USUARIOS} usuario(s). La aplicación recibe el nombre en el login, así que debe reconocer "${nombre}".`,
        showCancelButton: true,
        confirmButtonText: 'Renombrar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#222'
      }).then(r => { if (r.isConfirmed) guardar(); });
    } else {
      guardar();
    }
  }

  toggleActivo(item: RolGrupoApp, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.guardando) {
      input.checked = item.ACTIVO;
      return;
    }
    this.guardando = true;
    this.appsMenuAdminService.updateRolGrupo(this.pestana, { ID: item.ID, ACTIVO: !item.ACTIVO }).subscribe({
      next: () => {
        item.ACTIVO = !item.ACTIVO;
        this.guardando = false;
        this.huboCambios = true;
      },
      error: () => {
        input.checked = item.ACTIVO;
        this.guardando = false;
      }
    });
  }

  eliminar(item: RolGrupoApp): void {
    if (this.guardando) return;
    if (item.USUARIOS > 0) {
      Swal.fire({
        icon: 'info',
        title: 'No se puede eliminar',
        text: `"${item.NOMBRE}" lo tienen ${item.USUARIOS} usuario(s). Quitáselo desde Aplicaciones → Usuarios o desactivalo.`,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#222'
      });
      return;
    }
    Swal.fire({
      icon: 'warning',
      title: `¿Eliminar el ${this.etiqueta} "${item.NOMBRE}"?`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.guardando = true;
      this.appsMenuAdminService.eliminarRolGrupo(this.pestana, item.ID).subscribe({
        next: () => this.terminoOk(this.pestana === 'rol' ? 'Rol eliminado' : 'Grupo eliminado'),
        error: () => this.guardando = false
      });
    });
  }

  onCerrar(): void {
    this.dialogRef.close(this.huboCambios);
  }
}
