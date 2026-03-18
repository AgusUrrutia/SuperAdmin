import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { GroupService } from '../../../services/group.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-crear-grupo-sgs',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    templateUrl: './crear-grupo-sgs.component.html',
    styleUrl: './crear-grupo-sgs.component.scss'
})
export class CrearGrupoSgsComponent implements OnInit {
    nombreGrupo: string = '';
    estaCargando: boolean = false;

    constructor(
        private groupService: GroupService,
        public dialogRef: MatDialogRef<CrearGrupoSgsComponent>
    ) { }

    ngOnInit(): void { }

    guardar(): void {
        if (!this.nombreGrupo.trim()) {
            Swal.fire('Error', 'El nombre del grupo es requerido', 'error');
            return;
        }

        this.estaCargando = true;
        const nuevoGrupo = {
            GRUPO: this.nombreGrupo
        };

        this.groupService.createGroup(nuevoGrupo).subscribe({
            next: (res) => {
                this.estaCargando = false;
                if (res) {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: 'El grupo ha sido creado correctamente.',
                        icon: 'success',
                        confirmButtonColor: '#222'
                    });
                    this.dialogRef.close(true);
                }
            },
            error: (err) => {
                this.estaCargando = false;
                console.error('Error al crear grupo:', err);
            }
        });
    }

    cancelar(): void {
        this.dialogRef.close(false);
    }
}
