import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { AppsMenuAdminService, SistemaAdmin } from '../../../services/apps-menu-admin.service';

// Edicion del nombre largo de un sistema.
// La sigla no se puede modificar: el codigo la compara por texto y sale en sistemas_permitidos.
@Component({
  selector: 'app-modal-sistema',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './modal-sistema.component.html',
  styleUrls: ['../modal-aplicaciones.scss']
})
export class ModalSistemaComponent {

  nombre: string;
  guardando = false;

  constructor(
    public dialogRef: MatDialogRef<ModalSistemaComponent>,
    private appsMenuAdminService: AppsMenuAdminService,
    @Inject(MAT_DIALOG_DATA) public data: { sistema: SistemaAdmin }
  ) {
    this.nombre = data.sistema.NOMBRE || '';
  }

  guardar(): void {
    if (this.guardando) return;
    const nombre = this.nombre.trim() || null;
    if (nombre === (this.data.sistema.NOMBRE || null)) {
      // No cambio nada
      this.dialogRef.close(false);
      return;
    }

    this.guardando = true;
    this.appsMenuAdminService.updateSistema({ ID: this.data.sistema.ID, NOMBRE: nombre }).subscribe({
      next: () => {
        this.guardando = false;
        Swal.fire({ icon: 'success', title: 'Sistema actualizado', timer: 1500, showConfirmButton: false });
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
