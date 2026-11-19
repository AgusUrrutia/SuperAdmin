import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import { AppMenuAdmin, AppsMenuAdminService, SistemaAdmin } from '../services/apps-menu-admin.service';
import { AppsMenuService } from '../../../core/services/apps-menu.service';
import { ModalAppMenuComponent } from './components/modal-app-menu/modal-app-menu.component';
import { ModalSistemaComponent } from './components/modal-sistema/modal-sistema.component';
import { ModalNuevaAplicacionComponent } from './components/modal-nueva-aplicacion/modal-nueva-aplicacion.component';
import { ModalRolesGruposComponent } from './components/modal-roles-grupos/modal-roles-grupos.component';

type Pestana = 'menu' | 'sistemas';

// ABM del menu de apps (EK_Apps_Menu) y del catalogo de apps (SISTEMA) que se asignan a los usuarios
@Component({
  selector: 'app-apps-aplicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, SpinnerGrandeComponent],
  templateUrl: './apps-aplicaciones.component.html',
  styleUrls: ['./apps-aplicaciones.component.scss']
})
export class AppsAplicacionesComponent implements OnInit {

  pestana: Pestana = 'menu';

  apps: AppMenuAdmin[] = [];
  cargandoApps = true;
  mostrarInactivas = true;

  sistemas: SistemaAdmin[] = [];
  cargandoSistemas = true;

  constructor(
    private appsMenuAdminService: AppsMenuAdminService,
    private appsMenuService: AppsMenuService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.cargarApps();
    this.cargarSistemas();
  }

  cambiarPestana(pestana: Pestana): void {
    this.pestana = pestana;
  }

  // ---------- Menu ----------

  cargarApps(): void {
    this.cargandoApps = true;
    this.appsMenuAdminService.getApps().subscribe({
      next: apps => {
        this.apps = apps || [];
        this.cargandoApps = false;
      },
      error: () => this.cargandoApps = false
    });
  }

  get appsVisibles(): AppMenuAdmin[] {
    return this.mostrarInactivas ? this.apps : this.apps.filter(a => a.ACTIVO);
  }

  editarApp(app: AppMenuAdmin): void {
    const dialogRef = this.dialog.open(ModalAppMenuComponent, {
      width: '700px',
      disableClose: true,
      data: { app, sistemas: this.sistemas }
    });
    dialogRef.afterClosed().subscribe(huboCambios => {
      if (huboCambios) {
        this.cargarApps();
        this.cargarSistemas(); // cambia el contador de filas del menu
        this.appsMenuService.recargar(); // actualiza el menu de apps del navbar en el momento
      }
    });
  }

  // ---------- Sistemas ----------

  cargarSistemas(): void {
    this.cargandoSistemas = true;
    this.appsMenuAdminService.getSistemas().subscribe({
      next: sistemas => {
        this.sistemas = sistemas || [];
        this.cargandoSistemas = false;
      },
      error: () => this.cargandoSistemas = false
    });
  }

  editarSistema(sistema: SistemaAdmin): void {
    const dialogRef = this.dialog.open(ModalSistemaComponent, {
      width: '550px',
      disableClose: true,
      data: { sistema }
    });
    dialogRef.afterClosed().subscribe(huboCambios => {
      if (huboCambios) {
        this.cargarSistemas();
        this.cargarApps(); // el nombre del sistema se propaga a la descripcion del menu
        this.appsMenuService.recargar();
      }
    });
  }

  // Alta completa: sistema + roles + grupos + fila del menu (opcional)
  nuevaAplicacion(): void {
    const dialogRef = this.dialog.open(ModalNuevaAplicacionComponent, {
      width: '760px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(huboCambios => {
      if (huboCambios) {
        this.pestana = 'sistemas';
        this.cargarSistemas();
        this.cargarApps();
        this.appsMenuService.recargar();
      }
    });
  }

  gestionarRolesGrupos(sistema: SistemaAdmin): void {
    const dialogRef = this.dialog.open(ModalRolesGruposComponent, {
      width: '800px',
      disableClose: true,
      data: { sistema }
    });
    dialogRef.afterClosed().subscribe(huboCambios => {
      if (huboCambios) this.cargarSistemas(); // cambian los contadores
    });
  }
}
