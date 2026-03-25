import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UsuarioService } from '../../../services/usuario.service';
import { SpinnerGrandeComponent } from '../../../../../shared/components/spinner-grande/spinner-grande.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-permisos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    SpinnerGrandeComponent
  ],
  templateUrl: './modal-permisos.component.html',
  styleUrls: ['./modal-permisos.component.scss']
})
export class ModalPermisosComponent implements OnInit {
  usuario: any;
  rolSeleccionadoPermisos: any = null;
  modulos: any[] = [];
  modulosIntegrados: any[] = [];
  cargando: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ModalPermisosComponent>,
    private userService: UsuarioService,
    @Inject(MAT_DIALOG_DATA) public data: {
      usuario: any,
      roles: any[],
      permisosHeredar: any[]
    }
  ) {
    this.usuario = { ...data.usuario };
  }

  ngOnInit(): void {
    if (this.usuario.ROLES && this.usuario.ROLES.length > 0) {
      this.rolSeleccionadoPermisos = this.usuario.ROLES[0];
      this.cargarModulosPorRol(this.rolSeleccionadoPermisos);
    }
  }

  cargarModulosPorRol(rol: any): void {
    if (!rol) return;
    const esAdministrador = true; // Simulating localstorage rol for permissions mapping as per previous logic

    if (this.data.permisosHeredar?.length > 0) {
      this.userService.getIntegratedModules(this.usuario.ID_USUARIO).subscribe({
        next: (integrados) => {
          this.modulosIntegrados = integrados;
          this.procesarPermisosHeredarMostrarTodos(integrados);
        },
        error: () => this.procesarPermisosHeredarMostrarTodos([])
      });
      return;
    }

    this.cargando = true;
    this.userService.getModulesByRole(rol.ROL).subscribe({
      next: (modules) => {
        const modulosBase = modules.map((m: any) => ({ ...m, lectura: false, escritura: false }));
        this.userService.getIntegratedModules(this.usuario.ID_USUARIO).subscribe({
          next: (integrados) => {
            this.modulosIntegrados = integrados;
            this.modulos = modulosBase.map((modulo: any) => {
              const p = integrados.filter((i) => i.ID_MENU === modulo.ID_MENU);
              let tL = p.some((x) => x.ID_ACCION === "1");
              let tE = p.some((x) => x.ID_ACCION === "2");
              if (tE) { tL = true; tE = true; }
              return {
                ...modulo,
                lectura: tL,
                escritura: tE,
                originalLectura: tL,
                originalEscritura: tE
              };
            });
            this.cargando = false;
          },
          error: () => this.cargando = false
        });
      },
      error: () => this.cargando = false
    });
  }

  private procesarPermisosHeredarMostrarTodos(integrados: any[]): void {
    const modulosAgrupados = new Map<string, any>();
    (this.data.permisosHeredar || []).forEach((permiso) => {
      const idMenu = permiso.ID_MENU;
      if (!modulosAgrupados.has(idMenu)) {
        const pUsuario = integrados.filter((i: any) => i.ID_MENU === idMenu);
        const tL = pUsuario.some((p: any) => p.ID_ACCION === "1");
        const tE = pUsuario.some((p: any) => p.ID_ACCION === "2");
        modulosAgrupados.set(idMenu, {
          ID_MENU: idMenu,
          MENU: permiso.NOMBRE_MENU || permiso.MENU,
          lectura: tL || tE, escritura: tE,
          ID_ROL: permiso.ID_ROL, NOMBRE_ROL: permiso.NOMBRE_ROL
        });
      }
    });
    this.modulos = Array.from(modulosAgrupados.values());
  }

  enviarPermisoModulo(modulo: any): void {
    let accion: any = 0;
    if (modulo.lectura && modulo.escritura) accion = 2;
    else if (modulo.lectura) accion = 1;
    else if (modulo.escritura) accion = 2;

    if (!modulo.lectura && !modulo.escritura) {
      this.userService.quitarPermiso(this.usuario.ID_USUARIO, modulo.ID_MENU).subscribe({
        next: () => {
          Swal.fire({ title: 'Permiso removido', text: `Permiso removido.`, icon: 'success', timer: 1000, showConfirmButton: false });
          this.cargarModulosPorRol(this.rolSeleccionadoPermisos);
        }
      });
      return;
    }

    // 1. Buscamos el nombre del rol que tenemos seleccionado
    const nombreRol = this.rolSeleccionadoPermisos.ROL;

    // 2. Buscamos en la lista maestra de roles (data.roles) que vino del backend (getAllRoles).
    // Usamos 'nombre' o 'ROL' para comparar, y el campo 'valor' o 'ID_ROLES' para extraer el ID.
    const rolMaestro = (this.data.roles || []).find(r =>
      (r.nombre?.toLowerCase() === nombreRol?.toLowerCase()) ||
      (r.ROL?.toLowerCase() === nombreRol?.toLowerCase())
    );

    // 3. Priorizamos el ID del rol maestro, de lo contrario usamos el que ya tenía el usuario.
    const idRolReal = rolMaestro ? (rolMaestro.valor || rolMaestro.ID_ROLES) :
      (this.rolSeleccionadoPermisos.ID_ROLES ||
        this.rolSeleccionadoPermisos.ID_ROL ||
        this.rolSeleccionadoPermisos.id_rol);

    console.log('--- Resumen de Roles ---');
    console.log('Nombre Rol Seleccionado:', nombreRol);
    console.log('Rol Maestro encontrado:', rolMaestro);
    console.log('ID Final a enviar:', idRolReal);

    // ✅ Validación: Evitar duplicados si no hubo cambios reales
    if (modulo.lectura === modulo.originalLectura && modulo.escritura === modulo.originalEscritura) {
      Swal.fire({
        title: 'Sin cambios',
        text: 'Este permiso ya se encuentra guardado con los mismos valores.',
        icon: 'info',
        confirmButtonColor: '#222'
      });
      return;
    }

    this.userService.updatePermissions(this.usuario.ID_USUARIO, modulo.ID_MENU, accion, idRolReal).subscribe({
      next: () => {
        Swal.fire({ title: 'Guardado', text: `Permisos guardados.`, icon: 'success', timer: 1000, showConfirmButton: false });
        // Actualizamos el estado original para que no vuelva a chillar hasta que cambie algo
        modulo.originalLectura = modulo.lectura;
        modulo.originalEscritura = modulo.escritura;
      }
    });
  }

  onCancelar(): void { this.dialogRef.close(); }
}
