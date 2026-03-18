import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GroupService } from '../../../services/group.service';
import { AutocompleteSelectComponent } from '../../../../../shared/components/autocomplete-select/autocomplete-select.component';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-modal-editar-grupo-sgs',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        AutocompleteSelectComponent
    ],
    templateUrl: './modal-editar-grupo-sgs.component.html',
    styleUrl: './modal-editar-grupo-sgs.component.scss'
})
export class ModalEditarGrupoSgsComponent implements OnInit {
    grupo: any;
    usuariosDisponibles: any[] = [];
    formulariosDisponibles: any[] = [];

    usuariosSeleccionados: any[] = [];
    formulariosSeleccionados: any[] = [];

    searchUsuario: string = '';
    searchFormulario: string = '';

    usuariosFiltrados: any[] = [];
    formulariosFiltrados: any[] = [];

    usuariosNoSeleccionados: any[] = [];
    formulariosNoSeleccionados: any[] = [];

    usuarioSeleccionadoDropdown: string = '';
    formularioSeleccionadoDropdown: string = '';

    pageSizeUsuario = 5;
    currentPageUsuario = 0;
    totalUsuarios = 0;

    pageSizeFormulario = 5;
    currentPageFormulario = 0;
    totalFormularios = 0;

    Math = Math;

    constructor(
        public dialogRef: MatDialogRef<ModalEditarGrupoSgsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private groupService: GroupService
    ) { }

    ngOnInit(): void {
        this.grupo = this.data.grupo || {};
        this.usuariosDisponibles = this.data.usuarios || [];
        this.formulariosDisponibles = this.data.formularios || [];

        // En el nuevo sistema los datos vienen mapeados un poco diferente
        this.usuariosSeleccionados = Array.isArray(this.data.grupo.USUARIOS_ID)
            ? this.data.grupo.USUARIOS_ID.map((id: string) => {
                const u = this.usuariosDisponibles.find(user => user.ID_USUARIO === id);
                return { ID_USUARIO: id, MAIL: u ? (u.NOMBRE || u.MAIL || id) : id };
            })
            : [];

        this.formulariosSeleccionados = Array.isArray(this.data.grupo.FORMULARIOS_ID)
            ? this.data.grupo.FORMULARIOS_ID.map((id: string) => {
                const f = this.formulariosDisponibles.find(form => form.ID === id);
                return { ID: id, NOMBRE: f ? (f.NOMBRE || f.FORMULARIO || id) : id };
            })
            : [];

        this.applyUsuarioFilter();
        this.applyFormularioFilter();
    }

    applyUsuarioFilter(): void {
        let filtered = [...this.usuariosSeleccionados];
        if (this.searchUsuario.trim()) {
            const term = this.searchUsuario.toLowerCase().trim();
            filtered = filtered.filter(u =>
                String(u.ID_USUARIO)?.toLowerCase().includes(term) ||
                String(u.MAIL)?.toLowerCase().includes(term)
            );
        }
        this.usuariosFiltrados = filtered;
        this.totalUsuarios = filtered.length;
        this.currentPageUsuario = 0;
        this.updateUsuariosNoSeleccionados();
    }

    applyFormularioFilter(): void {
        let filtered = [...this.formulariosSeleccionados];
        if (this.searchFormulario.trim()) {
            const term = this.searchFormulario.toLowerCase().trim();
            filtered = filtered.filter(f =>
                String(f.ID)?.toLowerCase().includes(term) ||
                String(f.NOMBRE)?.toLowerCase().includes(term)
            );
        }
        this.formulariosFiltrados = filtered;
        this.totalFormularios = filtered.length;
        this.currentPageFormulario = 0;
        this.updateFormulariosNoSeleccionados();
    }

    updateUsuariosNoSeleccionados(): void {
        const idsSeleccionados = new Set(this.usuariosSeleccionados.map(u => u.ID_USUARIO));
        this.usuariosNoSeleccionados = this.usuariosDisponibles
            .filter(u => !idsSeleccionados.has(u.ID_USUARIO))
            .map(u => ({ id: u.ID_USUARIO, label: u.NOMBRE || u.MAIL || u.ID_USUARIO }));
    }

    updateFormulariosNoSeleccionados(): void {
        const idsSeleccionados = new Set(this.formulariosSeleccionados.map(f => f.ID));
        this.formulariosNoSeleccionados = this.formulariosDisponibles
            .filter(f => !idsSeleccionados.has(f.ID))
            .map(f => ({ id: f.ID, label: f.NOMBRE || f.FORMULARIO || f.ID }));
    }

    agregarUsuario(): void {
        if (!this.usuarioSeleccionadoDropdown) return;
        const item = this.usuariosNoSeleccionados.find(u => u.id === this.usuarioSeleccionadoDropdown);

        this.groupService.addUserToGroup(this.grupo.GRUPO_ID, this.usuarioSeleccionadoDropdown).subscribe(response => {
            if (response) {
                this.usuariosSeleccionados.push({
                    ID_USUARIO: this.usuarioSeleccionadoDropdown,
                    MAIL: item ? item.label : this.usuarioSeleccionadoDropdown
                });
                this.usuarioSeleccionadoDropdown = '';
                this.applyUsuarioFilter();
                this.groupService.reloadGroups();
            }
        });
    }

    agregarFormulario(): void {
        if (!this.formularioSeleccionadoDropdown) return;
        const item = this.formulariosNoSeleccionados.find(f => f.id === this.formularioSeleccionadoDropdown);

        this.groupService.addFormToGroup(this.grupo.GRUPO_ID, this.formularioSeleccionadoDropdown).subscribe(response => {
            if (response) {
                this.formulariosSeleccionados.push({
                    ID: this.formularioSeleccionadoDropdown,
                    NOMBRE: item ? item.label : this.formularioSeleccionadoDropdown
                });
                this.formularioSeleccionadoDropdown = '';
                this.applyFormularioFilter();
                this.groupService.reloadGroups();
            }
        });
    }

    eliminarUsuario(idUsuario: string): void {
        Swal.fire({
            title: '¿Está seguro?',
            text: '¿Desea eliminar este usuario del grupo?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#222',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.groupService.removeUserFromGroup(this.grupo.GRUPO_ID, idUsuario).subscribe(response => {
                    if (response) {
                        this.usuariosSeleccionados = this.usuariosSeleccionados.filter(u => u.ID_USUARIO !== idUsuario);
                        this.applyUsuarioFilter();
                        this.groupService.reloadGroups();
                    }
                });
            }
        });
    }

    eliminarFormulario(idFormulario: string): void {
        Swal.fire({
            title: '¿Está seguro?',
            text: '¿Desea eliminar este formulario del grupo?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#222',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.groupService.removeFormFromGroup(this.grupo.GRUPO_ID, idFormulario).subscribe(response => {
                    if (response) {
                        this.formulariosSeleccionados = this.formulariosSeleccionados.filter(f => f.ID !== idFormulario);
                        this.applyFormularioFilter();
                        this.groupService.reloadGroups();
                    }
                });
            }
        });
    }

    changePageUsuario(delta: number): void {
        const newPage = this.currentPageUsuario + delta;
        const maxPage = Math.ceil(this.totalUsuarios / this.pageSizeUsuario) - 1;
        if (newPage >= 0 && newPage <= maxPage) this.currentPageUsuario = newPage;
    }

    changePageFormulario(delta: number): void {
        const newPage = this.currentPageFormulario + delta;
        const maxPage = Math.ceil(this.totalFormularios / this.pageSizeFormulario) - 1;
        if (newPage >= 0 && newPage <= maxPage) this.currentPageFormulario = newPage;
    }

    getUsuariosPage(): any[] {
        const startIndex = this.currentPageUsuario * this.pageSizeUsuario;
        return this.usuariosFiltrados.slice(startIndex, startIndex + this.pageSizeUsuario);
    }

    getFormulariosPage(): any[] {
        const startIndex = this.currentPageFormulario * this.pageSizeFormulario;
        return this.formulariosFiltrados.slice(startIndex, startIndex + this.pageSizeFormulario);
    }

    cancelar(): void {
        this.dialogRef.close(null);
    }
}
