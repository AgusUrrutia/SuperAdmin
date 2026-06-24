import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UsuarioService } from '../../../services/usuario.service';
import { SpinnerGrandeComponent } from '../../../../../shared/components/spinner-grande/spinner-grande.component';
import { forkJoin, of, switchMap } from 'rxjs';
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
  guardando: boolean = false;

  rolesOcultos: string[] = [
    'Distribuidores Administración',
    'Grandes Cuentas Administración',
    'Superadmin'
  ];

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
    const rolesFiltrados = this.getFilteredRoles();
    if (rolesFiltrados && rolesFiltrados.length > 0) {
      this.rolSeleccionadoPermisos = rolesFiltrados[0];
      this.cargarModulosPorRol(this.rolSeleccionadoPermisos);
    }
  }

  getFilteredRoles(): any[] {
    if (!this.usuario.ROLES) return [];
    return this.usuario.ROLES.filter((rol: any) => !this.rolesOcultos.includes(rol.ROL));
  }

  cargarModulosPorRol(rol: any): void {
    if (!rol) return;

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

  guardarTodosLosPermisos(): void {
    if (!this.rolSeleccionadoPermisos) return;

    const sinCambios = this.modulos.every(m =>
      m.lectura === m.originalLectura && m.escritura === m.originalEscritura
    );
    if (sinCambios) {
      Swal.fire({
        title: 'Sin cambios',
        text: 'No se realizaron cambios en los permisos.',
        icon: 'info',
        confirmButtonColor: '#222'
      });
      return;
    }

    const nombreRol = this.rolSeleccionadoPermisos.ROL;
    const rolMaestro = (this.data.roles || []).find((r: any) =>
      (r.nombre?.toLowerCase() === nombreRol?.toLowerCase()) ||
      (r.ROL?.toLowerCase() === nombreRol?.toLowerCase())
    );
    const idRolReal = rolMaestro
      ? (rolMaestro.valor || rolMaestro.ID_ROLES)
      : (this.rolSeleccionadoPermisos.ID_ROLES || this.rolSeleccionadoPermisos.ID_ROL || this.rolSeleccionadoPermisos.id_rol);

    // Solo módulos que realmente cambiaron
    const modulosCambiados = this.modulos.filter(m =>
      m.lectura !== m.originalLectura || m.escritura !== m.originalEscritura
    );

    // Módulos que tenían permisos y cambiaron (ya sea de nivel o para quitarlos):
    // hay que removerlos primero para evitar duplicate key en el INSERT
    const aRemover = modulosCambiados.filter(m => m.originalLectura || m.originalEscritura);

    // Módulos que ahora tienen al menos un permiso activo → se van a re-insertar
    const permisos = modulosCambiados
      .filter(m => m.lectura || m.escritura)
      .map(m => ({
        ID_USUARIO: this.usuario.ID_USUARIO,
        ID_MENU: m.ID_MENU,
        ID_ROL: idRolReal,
        ID_ACCION: m.escritura ? 2 : 1
      }));

    this.guardando = true;

    const removerYLuegoPersistir = () => {
      if (permisos.length === 0) {
        Swal.fire({ title: 'Guardado', text: 'Permisos actualizados.', icon: 'success', timer: 1500, showConfirmButton: false });
        this.guardando = false;
        this.cargarModulosPorRol(this.rolSeleccionadoPermisos);
        return;
      }
      this.userService.savePermisosLote(permisos).subscribe({
        next: (res) => {
          if (res === null) { this.guardando = false; return; }
          Swal.fire({ title: 'Guardado', text: 'Permisos guardados correctamente.', icon: 'success', timer: 1500, showConfirmButton: false });
          this.guardando = false;
          this.cargarModulosPorRol(this.rolSeleccionadoPermisos);
        },
        error: () => { this.guardando = false; }
      });
    };

    if (aRemover.length > 0) {
      forkJoin(aRemover.map(m => this.userService.quitarPermiso(this.usuario.ID_USUARIO, m.ID_MENU))).subscribe({
        next: () => removerYLuegoPersistir(),
        error: () => { this.guardando = false; }
      });
    } else {
      removerYLuegoPersistir();
    }
  }

  onCancelar(): void { this.dialogRef.close(); }
}
