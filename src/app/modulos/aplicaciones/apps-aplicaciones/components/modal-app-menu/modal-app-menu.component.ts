import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { AppMenuAdmin, AppsMenuAdminService, LogoMenu, SistemaAdmin } from '../../../services/apps-menu-admin.service';

interface FormApp {
  ID_SISTEMA: number | null;
  IMAGE: string | null;
  LINK: string;
  ORDEN: number;
  ABRIR_EN_NUEVA_PESTANA: boolean;
  ACTIVO: boolean;
}

// Edicion de una fila del menu de apps (EK_Apps_Menu).
// APP_NAME y DESCRIPCION no se editan: los toma la API del sistema vinculado (ID_SISTEMA).
// Se manda ID mas solo los campos que cambiaron.
// GRUPOS_PERMITIDOS no se edita aca: no se envia, asi la API mantiene el valor que tenga.
@Component({
  selector: 'app-modal-app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './modal-app-menu.component.html',
  styleUrls: ['../modal-aplicaciones.scss']
})
export class ModalAppMenuComponent implements OnInit {

  form: FormApp;
  private original: FormApp;

  logos: LogoMenu[] = [];
  cargandoLogos = true;
  guardando = false;

  constructor(
    public dialogRef: MatDialogRef<ModalAppMenuComponent>,
    private appsMenuAdminService: AppsMenuAdminService,
    @Inject(MAT_DIALOG_DATA) public data: { app: AppMenuAdmin, sistemas: SistemaAdmin[] }
  ) {
    const app = data.app;
    this.form = {
      ID_SISTEMA: app.ID_SISTEMA ?? null,
      // IMAGE puede venir como URL completa (filas viejas): se toma el nombre del archivo para marcar el logo
      IMAGE: app.IMAGE ? app.IMAGE.split('/').pop() || null : null,
      LINK: app.LINK || '',
      ORDEN: app.ORDEN ?? 0,
      ABRIR_EN_NUEVA_PESTANA: app.ABRIR_EN_NUEVA_PESTANA,
      ACTIVO: app.ACTIVO
    };
    this.original = { ...this.form };
  }

  ngOnInit(): void {
    this.appsMenuAdminService.getLogos().subscribe({
      next: logos => {
        this.logos = logos || [];
        this.cargandoLogos = false;
      },
      error: () => this.cargandoLogos = false
    });
  }

  get sistemaSeleccionado(): SistemaAdmin | undefined {
    return this.data.sistemas.find(s => s.ID === Number(this.form.ID_SISTEMA));
  }

  seleccionarLogo(file: string | null): void {
    this.form.IMAGE = file;
  }

  private linkValido(link: string): boolean {
    return link.trim() === '' || /^https?:\/\//i.test(link.trim());
  }

  // ID mas solo lo que cambio
  private armarPayload(): any {
    const campos: any = {
      ID_SISTEMA: Number(this.form.ID_SISTEMA),
      IMAGE: this.form.IMAGE,
      LINK: this.form.LINK.trim(),
      ORDEN: Number(this.form.ORDEN),
      ABRIR_EN_NUEVA_PESTANA: this.form.ABRIR_EN_NUEVA_PESTANA,
      ACTIVO: this.form.ACTIVO
    };
    const o = this.original;
    const payload: any = { ID: this.data.app.ID };
    if (Number(o.ID_SISTEMA) !== campos.ID_SISTEMA) payload.ID_SISTEMA = campos.ID_SISTEMA;
    if ((o.IMAGE || null) !== (campos.IMAGE || null)) payload.IMAGE = campos.IMAGE;
    if (o.LINK.trim() !== campos.LINK) payload.LINK = campos.LINK;
    if (Number(o.ORDEN) !== campos.ORDEN) payload.ORDEN = campos.ORDEN;
    if (o.ABRIR_EN_NUEVA_PESTANA !== campos.ABRIR_EN_NUEVA_PESTANA) payload.ABRIR_EN_NUEVA_PESTANA = campos.ABRIR_EN_NUEVA_PESTANA;
    if (o.ACTIVO !== campos.ACTIVO) payload.ACTIVO = campos.ACTIVO;
    return payload;
  }

  private avisar(titulo: string, texto: string): void {
    Swal.fire({ icon: 'warning', title: titulo, text: texto, confirmButtonText: 'Aceptar', confirmButtonColor: '#222' });
  }

  guardar(): void {
    if (this.guardando) return;
    if (!this.form.ID_SISTEMA) {
      this.avisar('Sistema requerido', 'Seleccioná el sistema al que pertenece la app.');
      return;
    }
    if (!this.linkValido(this.form.LINK)) {
      this.avisar('Link inválido', 'El link debe empezar con http:// o https:// (o quedar vacío).');
      return;
    }
    if (!Number.isInteger(Number(this.form.ORDEN))) {
      this.avisar('Orden inválido', 'El orden debe ser un número entero.');
      return;
    }

    const payload = this.armarPayload();
    if (Object.keys(payload).length === 1) {
      // Solo vino el ID: no hay nada para guardar
      this.dialogRef.close(false);
      return;
    }

    this.guardando = true;
    this.appsMenuAdminService.updateApp(payload).subscribe({
      next: () => {
        this.guardando = false;
        Swal.fire({
          icon: 'success',
          title: 'Aplicación actualizada',
          timer: 1500,
          showConfirmButton: false
        });
        this.dialogRef.close(true);
      },
      // El servicio ya muestra el error
      error: () => this.guardando = false
    });
  }

  onCerrar(): void {
    this.dialogRef.close(false);
  }
}
