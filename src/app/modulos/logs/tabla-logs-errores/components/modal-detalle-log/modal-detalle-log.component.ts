import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LogError } from '../../../models/log-error.model';
import { formatFechaLog } from '../../../utils/fecha-log.util';

@Component({
  selector: 'app-modal-detalle-log',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './modal-detalle-log.component.html',
  styleUrl: './modal-detalle-log.component.scss'
})
export class ModalDetalleLogComponent {
  error: LogError;
  mensajeFormateado: string;

  constructor(
    public dialogRef: MatDialogRef<ModalDetalleLogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { error: LogError }
  ) {
    this.error = this.data.error;
    this.mensajeFormateado = this.formatearMensaje(this.error.message);
  }

  private formatearMensaje(message: string): string {
    try {
      return JSON.stringify(JSON.parse(message), null, 2);
    } catch {
      return message;
    }
  }

  getStatusGroup(statusCode: string): '2xx' | '4xx' | '5xx' | 'otro' {
    const codigo = parseInt(statusCode, 10);
    if (codigo >= 200 && codigo < 400) return '2xx';
    if (codigo >= 400 && codigo < 500) return '4xx';
    if (codigo >= 500) return '5xx';
    return 'otro';
  }

  formatFecha(dateStr: string): string {
    return formatFechaLog(dateStr);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
