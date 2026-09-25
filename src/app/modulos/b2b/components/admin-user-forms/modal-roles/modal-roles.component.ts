import { Component, Inject, Injector, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioService } from '../../../services/usuario.service';
import { ModalEditarDistribuidorComponent } from '../modal-editar-distribuidor/modal-editar-distribuidor.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './modal-roles.component.html',
  styleUrls: ['./modal-roles.component.scss']
})
export class ModalRolesComponent implements OnInit {
  usuario: any;
  rolesDisponibles: any[] = [];
  rolSeleccionado: any = null;
  loadingRoles = false;

  constructor(
    public dialogRef: MatDialogRef<ModalRolesComponent>,
    private userService: UsuarioService,
    private dialog: MatDialog,
    private injector: Injector,
    @Inject(MAT_DIALOG_DATA) public data: {
      usuario: any,
      roles: any[]
    }
  ) {
    this.usuario = { ...data.usuario };
    this.rolesDisponibles = data.roles || [];
  }

  ngOnInit(): void {
    this.cargarRolesDelUsuario();
  }

  cargarRolesDelUsuario(): void {
    this.rolesDisponibles = this.data.roles;
    this.loadingRoles = true;
    this.userService.getAllRolesByUser(this.usuario.ID_USUARIO).subscribe({
      next: (roles) => {
        this.usuario.ROLES = roles;
        this.rolesDisponibles = this.rolesDisponibles.filter((r: any) => !roles.some((ur: any) => ur.ROL === r.nombre));
        this.loadingRoles = false;
      },
      error: (err) => {
        console.error('Error al cargar roles', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los roles.' });
        this.loadingRoles = false;
      }
    });
  }

  agregarRol(rolObj: any): void {
    if (!rolObj || this.usuario.ROLES.some((r: any) => r.ROL === rolObj.nombre)) return;

    Swal.fire({ title: 'Agregando rol...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.userService.addRoleToUser(this.usuario.ID_USUARIO, rolObj.valor, rolObj.nombre).subscribe({
      next: (response) => {
        Swal.close();
        this.rolSeleccionado = null;
        this.cargarRolesDelUsuario();
        this.userService.reloadUsers();
      },
      error: (error) => {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo agregar el rol.' });
      }
    });
  }

  eliminarRol(rolID: string): void {
    this.userService.removeRoleFromUser(rolID).subscribe({
      next: () => {
        this.cargarRolesDelUsuario();
        this.userService.reloadUsers();
      },
      error: (err) => { Swal.fire('Error', 'No se pudo eliminar el rol.', 'error'); }
    });
  }

  editarPerfilesRol(rol: any): void {
    this.userService.getRolData(rol.ID_ROLES).subscribe({
      next: (rolData) => {
        this.dialog.open(ModalEditarDistribuidorComponent, {
          width: '700px',
          disableClose: true,
          // Mantiene la misma instancia de UsuarioService (B2B o SGS) que usa este modal
          injector: this.injector,
          data: { rolData: rolData, rol: rol, usuario: this.usuario }
        });
      },
      error: (err) => { Swal.fire('Error', 'No se pudieron obtener los datos.', 'error'); }
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
