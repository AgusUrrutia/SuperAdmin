import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LogAcceso } from '../../../models/log-error.model';
import { formatFechaLog } from '../../../utils/fecha-log.util';

@Component({
  selector: 'app-modal-detalle-acceso',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './modal-detalle-acceso.component.html',
  styleUrl: './modal-detalle-acceso.component.scss'
})
export class ModalDetalleAccesoComponent {
  acceso: LogAcceso;
  bodyFormateado: string;

  constructor(
    public dialogRef: MatDialogRef<ModalDetalleAccesoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { acceso: LogAcceso }
  ) {
    this.acceso = this.data.acceso;
    this.bodyFormateado = this.formatearBody(this.acceso.body);
  }

  private formatearBody(body: any): string {
    if (body === null || body === undefined) return '--';
    if (typeof body === 'string') {
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        return body;
      }
    }
    if (Array.isArray(body) && body.length === 0) return '[]';
    return JSON.stringify(body, null, 2);
  }

  formatFecha(dateStr: string): string {
    return formatFechaLog(dateStr);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
