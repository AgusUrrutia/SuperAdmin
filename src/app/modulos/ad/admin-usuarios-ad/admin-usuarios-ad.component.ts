import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { HttpClientModule } from '@angular/common/http';
import { ModalCrearUsuarioAdComponent } from './components/modal-crear-usuario-ad/modal-crear-usuario-ad.component';
import { ModalCambiarContrasenaAdComponent } from './components/modal-cambiar-contrasena-ad/modal-cambiar-contrasena-ad.component';
import { AdUsuariosService } from '../services/ad-usuarios.service';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import Swal from 'sweetalert2';

type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-admin-usuarios-ad',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatPaginatorModule, SpinnerGrandeComponent],
  templateUrl: './admin-usuarios-ad.component.html',
  styleUrls: ['./admin-usuarios-ad.component.scss']
})
export class AdminUsuariosAdComponent implements OnInit {
  usuarios: any[] = [];
  cargando: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Variables de filtrado y paginación
  pageSize = 5;
  currentPage = 0;
  totalItems = 0;
  displayedUsers: any[] = [];
  searchTerm: string = '';
  selectedEstado: string = '';
  filteredUserList: any[] = [];

  // Variables de ordenamiento
  sortColumn: string = '';
  sortDirection: SortDirection = '';

  constructor(private dialog: MatDialog, private adUserService: AdUsuariosService) { }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.adUserService.getUsuariosConAcciones().subscribe({
      next: (response: any) => {
        // En algunas APIs la respuesta es directamente el Array, en otras viene envuelto en un objeto (ej: { status: 'success', data: [...] })
        const arrayUsuarios = Array.isArray(response) ? response : (response.data && Array.isArray(response.data)) ? response.data : null;

        if (arrayUsuarios) {
          // Mapear la respuesta de la API al formato que usa la vista
          this.usuarios = arrayUsuarios.map((u: any) => ({
            ...u,
            nombre: u.NOMBRE,
            apellido: u.APELLIDO,
            correo: u.MAIL,
            estado: u.ACTIVO === '1' ? 'Activo' : 'Inactivo',
            expanded: false,
            tareas: (u.Acciones || []).map((acc: any) => ({
              ...acc,
              descripcion: this.translateActionType(acc.ActionType),
              mensaje: acc.ResultMessage || '---',
              estado: this.translateStatus(acc.Status),
              fecha: this.formatDate(acc.StartedAt)
            }))
          }));
        } else {
          console.error('El servidor devolvió un error de autenticación u otro formato:', response);
          this.usuarios = [];
        }
        this.applyFilters(); // Llamar a applyFilters después de mapear
        // Simular un poco de delay si la red es rápida para que se vea el spinner
        setTimeout(() => {
          this.cargando = false;
        }, 500);
      },
      error: (err: any) => {
        console.error('Error HTTP cargando usuarios AD:', err);
        this.cargando = false;
      }
    });
  }

  private translateActionType(type: string): string {
    if (!type) return 'Acción desconocida';
    const t = type.toUpperCase();
    if (t === 'CREATE') return 'Creación de usuario';
    if (t === 'RESET_PASSWORD') return 'Cambio de contraseña';
    if (t === 'UPDATE' || t === 'UPDATE_PASSWORD') return 'Cambiar contraseña';
    if (t === 'DELETE' || t === 'DISABLE') return 'Desactivar cuenta';
    return type;
  }

  private translateStatus(status: string): string {
    if (!status) return 'Pendiente';
    const s = status.toUpperCase();
    if (s === 'OK' || s === 'SUCCESS') return 'Exitoso';
    if (s === 'PENDING') return 'Pendiente';
    if (s === 'FAILED' || s === 'ERROR') return 'Error';
    return status;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  updateDisplayedUsers(): void {
    let sortedList = [...this.filteredUserList];
    if (this.sortColumn && this.sortDirection) {
      sortedList.sort((a, b) => {
        const aValue = a[this.sortColumn];
        const bValue = b[this.sortColumn];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return this.sortDirection === 'asc' ? -1 : 1;
        if (bValue == null) return this.sortDirection === 'asc' ? 1 : -1;

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
        } else {
          comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }

        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedUsers = sortedList.slice(startIndex, endIndex);
  }

  applyFilters(): void {
    let filtered = [...this.usuarios];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          (user.nombre && user.nombre.toLowerCase().includes(term)) ||
          (user.apellido && user.apellido.toLowerCase().includes(term)) ||
          (user.correo && user.correo.toLowerCase().includes(term))
      );
    }

    if (this.selectedEstado) {
      filtered = filtered.filter(user => user.estado === this.selectedEstado);
    }

    this.filteredUserList = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 0;
    this.updateDisplayedUsers();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedUsers();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      if (this.sortDirection === 'desc') {
        this.sortDirection = 'asc';
      } else if (this.sortDirection === 'asc') {
        this.sortDirection = '';
        this.sortColumn = '';
      } else {
        this.sortDirection = 'desc';
      }
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.updateDisplayedUsers();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'unfold_more';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : this.sortDirection === 'desc' ? 'arrow_downward' : 'unfold_more';
  }

  toggleRow(usuario: any) {
    usuario.expanded = !usuario.expanded;
  }

  crearUsuario() {
    console.log('Abriendo modal Crear nuevo usuario AD');

    const dialogRef = this.dialog.open(ModalCrearUsuarioAdComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'custom-modal-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Usuario creado desde modal', result);
        this.cargando = true;

        const samAccountName = result.correo.split('@')[0];

        const payload = {
          SamAccountName: samAccountName,
          Name: `${result.nombre} ${result.apellido}`,
          GivenName: result.nombre,
          Surname: result.apellido,
          UPN: result.correo,
          Description: result.descripcion || "Usuario creado a través de la interfaz web",
          OU: "OU=ResellersEK2,OU=EK2,OU=Exchange,DC=ranko,DC=com,DC=ar",
          Password: result.contrasena,
          Enabled: true
        };

        this.adUserService.crearUsuario(payload).subscribe({
          next: (response) => {
            console.log('Respuesta del servidor:', response);
            this.cargando = false;
            Swal.fire({
              icon: 'success',
              title: '¡Acción Ejecutada!',
              text: 'La acción de creación de usuario se ha encolado correctamente.',
              confirmButtonColor: '#000000',
              confirmButtonText: 'Aceptar'
            });
            this.cargarUsuarios();
          },
          error: (err) => {
            console.error('Error al crear usuario:', err);
            this.cargando = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al crear el usuario. Por favor intente más tarde.',
              confirmButtonColor: '#d33',
              confirmButtonText: 'Cerrar'
            });
          }
        });
      }
    });
  }

  cambiarContrasena(usuario: any) {
    console.log('Abriendo modal Cambiar contraseña para:', usuario);
    const dialogRef = this.dialog.open(ModalCambiarContrasenaAdComponent, {
      width: '450px',
      disableClose: true,
      data: { usuario },
      panelClass: 'custom-modal-backdrop'
    });

    dialogRef.afterClosed().subscribe(password => {
      if (password) {
        this.cargando = true;
        const idUsuario = usuario.ID_USUARIO || usuario.ID;
        const samAccountName = usuario.correo ? usuario.correo.split('@')[0] : '';

        const payload = {
          "JSON": {
            SamAccountName: samAccountName,
            Password: password,
            Unlock: true
          },
          "ID_USUARIO": idUsuario
        };

        this.adUserService.cambiarContrasena(idUsuario, payload).subscribe({
          next: (response) => {
            console.log('Respuesta del servidor cambiar pass:', response);
            this.cargando = false;
            Swal.fire({
              icon: 'success',
              title: '¡Contraseña Actualizada!',
              text: 'La acción de cambiar contraseña se ha encolado correctamente.',
              confirmButtonColor: '#000000',
              confirmButtonText: 'Aceptar'
            });
            this.cargarUsuarios();
          },
          error: (err) => {
            console.error('Error al cambiar contraseña:', err);
            this.cargando = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un problema al cambiar la contraseña. Por favor intente más tarde.',
              confirmButtonColor: '#000000',
              confirmButtonText: 'Cerrar'
            });
          }
        });
      }
    });
  }
}
