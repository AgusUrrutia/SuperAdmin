import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioAdminService } from '../../../../sgs/services/usuario-admin.service';

// Gestiona las aplicaciones asignadas a cada cuenta (instancia) de un usuario.
// Cada cambio se guarda en el momento con aplicaciones/add y aplicaciones/delete (mismas requests que SGS).
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

  constructor(
    public dialogRef: MatDialogRef<ModalGestionarAplicacionesComponent>,
    private usuarioAdminService: UsuarioAdminService,
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
    if (this.guardandoAppId) return;
    this.instanciaSeleccionada = inst;
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
