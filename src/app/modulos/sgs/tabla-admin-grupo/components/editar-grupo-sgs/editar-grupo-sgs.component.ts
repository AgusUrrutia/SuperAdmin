import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { GroupService } from '../../../services/group.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-editar-grupo-sgs',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    templateUrl: './editar-grupo-sgs.component.html',
    styleUrl: './editar-grupo-sgs.component.scss'
})
export class EditarGrupoSgsComponent implements OnInit {
    id: any;
    nombreGrupo: string = '';
    estaCargando: boolean = false;

    constructor(
        private groupService: GroupService,
        public dialogRef: MatDialogRef<EditarGrupoSgsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    ngOnInit(): void {
        if (this.data) {
            this.id = this.data.id || this.data.ID || this.data.GRUPO_ID;
            this.nombreGrupo = this.data.nombreGrupo || this.data.GRUPO || this.data['Nombre Grupo'] || '';
        }
    }

    guardar(): void {
        if (!this.nombreGrupo.trim()) {
            Swal.fire('Error', 'El nombre del grupo es requerido', 'error');
            return;
        }

        this.estaCargando = true;
        const grupoEditado = {
            ID: this.id,
            GRUPO: this.nombreGrupo
        };

        this.groupService.updateGroup(grupoEditado).subscribe({
            next: (res) => {
                this.estaCargando = false;
                if (res) {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: 'El grupo ha sido actualizado correctamente.',
                        icon: 'success',
                        confirmButtonColor: '#222'
                    });
                    this.dialogRef.close(true);
                }
            },
            error: (err) => {
                this.estaCargando = false;
                console.error('Error al actualizar grupo:', err);
            }
        });
    }

    cancelar(): void {
        this.dialogRef.close(false);
    }
}
