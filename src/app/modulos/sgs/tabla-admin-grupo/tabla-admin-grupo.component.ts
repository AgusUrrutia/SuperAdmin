import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupService } from '../services/group.service';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CrearGrupoSgsComponent } from './components/crear-grupo-sgs/crear-grupo-sgs.component';
import { EditarGrupoSgsComponent } from './components/editar-grupo-sgs/editar-grupo-sgs.component';
import { ModalEditarGrupoSgsComponent } from './components/modal-editar-grupo-sgs/modal-editar-grupo-sgs.component';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-tabla-admin-grupo',
    standalone: true,
    imports: [CommonModule, MatDialogModule, SpinnerGrandeComponent],
    templateUrl: './tabla-admin-grupo.component.html',
    styles: [`
    .btn-dark-custom {
      background-color: #222;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s;
      &:hover {
        background-color: #444;
      }
    }
    .btn-primary { background-color: #2b6cb0; border-color: #2b6cb0; }
    .btn-dark { background-color: #222; border-color: #222; }
    .btn-danger { background-color: #c53030; border-color: #c53030; }
  `]
})
export class TablaAdminGrupoComponent implements OnInit {

    cargando: boolean = true;
    filas: any[] = [];
    usuarios: any[] = [];
    formularios: any[] = [];

    constructor(
        private groupService: GroupService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.groupService.groups$.subscribe((res: any) => {
            // El BehaviorSubject inicializa con [], así que esperamos a que llegue el objeto real con GRUPOS
            if (res && res.GRUPOS !== undefined) {
                this.processGroupData(res);
                this.usuarios = res.USUARIOS || [];
                this.formularios = res.FORMULARIOS || [];
                this.cargando = false;
            }
        });

        this.groupService.reloadGroups();
    }

    processGroupData(res: any): void {
        const todosLosGrupos = res.GRUPOS || [];
        const gruposUsuarios = res.GRUPOS_USUARIOS_FORMULARIOS || [];

        this.filas = todosLosGrupos.map((grupo: any) => {
            const detalle = gruposUsuarios.find((g: any) => g.GRUPO_ID === grupo.ID);
            return {
                ...grupo,
                "ID Grupo": grupo.ID,
                "Nombre Grupo": grupo.GRUPO,
                "Cant. Usuarios": detalle?.USUARIOS_ID?.length || 0,
                "Cant. Formularios": detalle?.FORMULARIOS_ID?.length || 0,
                GRUPO_ID: grupo.ID,
                GRUPO: grupo.GRUPO,
                USUARIOS_ID: detalle?.USUARIOS_ID || [],
                FORMULARIOS_ID: detalle?.FORMULARIOS_ID || []
            };
        });
    }

    crearGrupo(): void {
        const dialogRef = this.dialog.open(CrearGrupoSgsComponent, {
            width: '500px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.groupService.reloadGroups();
            }
        });
    }

    editarGrupo(grupo: any): void {
        const dialogRef = this.dialog.open(ModalEditarGrupoSgsComponent, {
            width: '950px',
            disableClose: true,
            data: {
                grupo: grupo,
                usuarios: this.usuarios,
                formularios: this.formularios
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            // El modal maneja sus propias acciones de guardado parcial en el servicio
            // pero recargamos por si acaso hubo cambios estructurales
            this.groupService.reloadGroups();
        });
    }

    cambiarNombreGrupo(grupo: any): void {
        const dialogRef = this.dialog.open(EditarGrupoSgsComponent, {
            width: '500px',
            disableClose: true,
            data: grupo
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.groupService.reloadGroups();
            }
        });
    }

    eliminarGrupo(grupo: any): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar el grupo "${grupo.GRUPO}"`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#222',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.groupService.deleteGroup(grupo.ID).subscribe((res) => {
                    if (res) {
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'El grupo ha sido eliminado.',
                            icon: 'success',
                            confirmButtonColor: '#222'
                        });
                        this.groupService.reloadGroups();
                    }
                });
            }
        });
    }
}
