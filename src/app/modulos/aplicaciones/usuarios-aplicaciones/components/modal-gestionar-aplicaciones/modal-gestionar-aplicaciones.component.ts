import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioAdminService } from '../../../../sgs/services/usuario-admin.service';
import { AppsMenuAdminService, RolGrupoApp, TipoRolGrupo } from '../../../services/apps-menu-admin.service';

interface AsignacionesCuenta {
  roles: Set<number>;
  grupos: Set<number>;
}

// Gestiona las aplicaciones asignadas a cada cuenta (instancia) de un usuario.
// Cada cambio se guarda en el momento con aplicaciones/add y aplicaciones/delete (mismas requests que SGS).
// Debajo de cada app asignada se eligen sus roles y grupos propios (ek-apps-menu/usuario/roles-grupos/*).
// Si se quita la app, sus roles y grupos quedan guardados pero el login no los devuelve.
@Component({
  selector: 'app-modal-gestionar-aplicaciones',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './modal-gestionar-aplicaciones.component.html',
  styleUrls: ['./modal-gestionar-aplicaciones.component.scss']
})
export class ModalGestionarAplicacionesComponent implements OnInit {

  instancias: any[] = [];
  instanciaSeleccionada: any = null;

  aplicaciones: any[] = [];
  // IDs (como string) de las apps asignadas, por ID_USUARIO de cada cuenta
  asignadasPorCuenta: { [idUsuario: string]: Set<string> } = {};

  // ID de la app que se esta guardando, para deshabilitar su switch mientras tanto
  guardandoAppId: string | null = null;
  huboCambios = false;

  readonly tipos: TipoRolGrupo[] = ['rol', 'grupo'];
  // Catalogo de roles y grupos de todas las apps, por ID_SISTEMA
  rolesPorApp: { [idSistema: string]: RolGrupoApp[] } = {};
  gruposPorApp: { [idSistema: string]: RolGrupoApp[] } = {};
  // Roles y grupos asignados, por ID_USUARIO de cada cuenta (se piden al seleccionar la cuenta)
  rolesGruposPorCuenta: { [idUsuario: string]: AsignacionesCuenta } = {};
  // "tipo-id" del rol/grupo que se esta guardando
  guardandoRolGrupo: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ModalGestionarAplicacionesComponent>,
    private usuarioAdminService: UsuarioAdminService,
    private appsMenuAdminService: AppsMenuAdminService,
    @Inject(MAT_DIALOG_DATA) public data: { usuario: any, instancias?: any[] }
  ) {
    this.instancias = (data.instancias ?? [data.usuario]).slice().sort((a: any, b: any) => {
      if (a.ACTIVO !== b.ACTIVO) return a.ACTIVO === '1' ? -1 : 1;
      return Number(a.ID_USUARIO) - Number(b.ID_USUARIO);
    });
    this.instanciaSeleccionada = this.instancias[0];
  }

  ngOnInit(): void {
    this.usuarioAdminService.getAplicaciones().subscribe(res => {
      this.aplicaciones = res?.data || res || [];
      for (const inst of this.instancias) {
        this.asignadasPorCuenta[String(inst.ID_USUARIO)] = this.calcularAsignadas(inst);
      }
    });
    this.appsMenuAdminService.getRolesGrupos().subscribe(res => {
      this.rolesPorApp = this.agruparPorApp(res?.roles || []);
      this.gruposPorApp = this.agruparPorApp(res?.grupos || []);
    });
    this.cargarRolesGruposCuenta(this.instanciaSeleccionada);
  }

  private agruparPorApp(items: RolGrupoApp[]): { [idSistema: string]: RolGrupoApp[] } {
    const porApp: { [idSistema: string]: RolGrupoApp[] } = {};
    for (const item of items) {
      (porApp[String(item.ID_SISTEMA)] ||= []).push(item);
    }
    return porApp;
  }

  private cargarRolesGruposCuenta(inst: any): void {
    const id = String(inst?.ID_USUARIO ?? '');
    if (!id || this.rolesGruposPorCuenta[id]) return;
    this.appsMenuAdminService.getAsignacionesUsuario(id).subscribe(res => {
      this.rolesGruposPorCuenta[id] = { roles: new Set(res?.roles || []), grupos: new Set(res?.grupos || []) };
    });
  }

  private asignacionesSeleccionada(): AsignacionesCuenta | undefined {
    return this.rolesGruposPorCuenta[String(this.instanciaSeleccionada?.ID_USUARIO)];
  }

  // Roles o grupos de la app para mostrar: los activos y los inactivos que la cuenta todavia tiene (para poder quitarlos)
  itemsApp(app: any, tipo: TipoRolGrupo): RolGrupoApp[] {
    const catalogo = (tipo === 'rol' ? this.rolesPorApp : this.gruposPorApp)[this.obtenerId(app)] || [];
    return catalogo.filter(i => i.ACTIVO || this.tieneRolGrupo(tipo, i));
  }

  tieneRolGrupo(tipo: TipoRolGrupo, item: RolGrupoApp): boolean {
    const asignaciones = this.asignacionesSeleccionada();
    return !!asignaciones && (tipo === 'rol' ? asignaciones.roles : asignaciones.grupos).has(item.ID);
  }

  cargandoRolesGrupos(): boolean {
    return !this.asignacionesSeleccionada();
  }

  toggleRolGrupo(tipo: TipoRolGrupo, item: RolGrupoApp, event: Event): void {
    const input = event.target as HTMLInputElement;
    const asignaciones = this.asignacionesSeleccionada();
    if (this.guardandoRolGrupo || this.guardandoAppId || !asignaciones) {
      input.checked = this.tieneRolGrupo(tipo, item);
      return;
    }
    const quitar = this.tieneRolGrupo(tipo, item);
    const set = tipo === 'rol' ? asignaciones.roles : asignaciones.grupos;
    this.guardandoRolGrupo = `${tipo}-${item.ID}`;
    this.appsMenuAdminService.cambiarAsignacion(quitar ? 'remove' : 'add', {
      ID_USUARIO: this.instanciaSeleccionada.ID_USUARIO,
      TIPO: tipo,
      ID: item.ID
    }).subscribe({
      next: () => {
        if (quitar) set.delete(item.ID); else set.add(item.ID);
        this.guardandoRolGrupo = null;
        this.huboCambios = true;
      },
      // El servicio ya muestra el error; el check vuelve a su estado anterior
      error: () => {
        input.checked = this.tieneRolGrupo(tipo, item);
        this.guardandoRolGrupo = null;
      }
    });
  }

  obtenerId(app: any): string {
    return String(app?.ID || app?.id || app?.ID_APLICACION);
  }

  nombreApp(app: any): string {
    return app?.SISTEMA || app?.nombre || app?.NOMBRE || '';
  }

  // La cuenta trae ID_APLICACION (ids) o sistemas (nombres); se usan los dos igual que en SGS
  private calcularAsignadas(inst: any): Set<string> {
    const ids: string[] = (inst.ID_APLICACION || []).map((id: any) => String(id));
    const nombres: string[] = inst.sistemas || [];
    const asignadas = new Set<string>();
    for (const app of this.aplicaciones) {
      if (ids.includes(this.obtenerId(app)) || nombres.includes(this.nombreApp(app))) {
        asignadas.add(this.obtenerId(app));
      }
    }
    return asignadas;
  }

  seleccionarInstancia(inst: any): void {
    if (this.guardandoAppId || this.guardandoRolGrupo) return;
    this.instanciaSeleccionada = inst;
    this.cargarRolesGruposCuenta(inst);
  }

  get asignadasSeleccionada(): Set<string> {
    return this.asignadasPorCuenta[String(this.instanciaSeleccionada?.ID_USUARIO)] || new Set<string>();
  }

  cantidadAsignadas(inst: any): number {
    return this.asignadasPorCuenta[String(inst.ID_USUARIO)]?.size ?? 0;
  }

  tieneApp(app: any): boolean {
    return this.asignadasSeleccionada.has(this.obtenerId(app));
  }

  toggleApp(app: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.guardandoAppId) {
      input.checked = this.tieneApp(app);
      return;
    }
    const idApp = this.obtenerId(app);
    const idUsuario = this.instanciaSeleccionada.ID_USUARIO;
    const asignadas = this.asignadasSeleccionada;
    const quitar = asignadas.has(idApp);
    const payload = { ID_USUARIO: idUsuario, ID_SISTEMA: idApp };
    const request$ = quitar
      ? this.usuarioAdminService.deleteAplicacionFromUser(payload)
      : this.usuarioAdminService.addAplicacionToUser(payload);

    this.guardandoAppId = idApp;
    // El servicio ya muestra el Swal de error; aca solo se libera el switch
    request$.subscribe({
      next: () => {
        if (quitar) asignadas.delete(idApp); else asignadas.add(idApp);
        this.guardandoAppId = null;
        this.huboCambios = true;
      },
      error: () => {
        // No se guardo: el switch vuelve a su estado anterior
        input.checked = this.tieneApp(app);
        this.guardandoAppId = null;
      }
    });
  }

  onCerrar(): void {
    this.dialogRef.close(this.huboCambios);
  }
}
