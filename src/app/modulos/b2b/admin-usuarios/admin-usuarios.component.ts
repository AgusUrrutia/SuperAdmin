import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../services/usuario.service';
import { MatDialog } from '@angular/material/dialog';
import { ModalCrearComponent } from '../components/admin-user-forms/modal-crear/modal-crear.component';
import { ModalEditarComponent } from '../components/admin-user-forms/modal-editar/modal-editar.component';
import { ModalRolesComponent } from '../components/admin-user-forms/modal-roles/modal-roles.component';
import { ModalPermisosComponent } from '../components/admin-user-forms/modal-permisos/modal-permisos.component';
import { SpinnerGrandeComponent } from '../../../shared/components/spinner-grande/spinner-grande.component';
import Swal from 'sweetalert2';

// Definimos un tipo para las direcciones de ordenamiento
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, MatIconModule, MatPaginatorModule, FormsModule, SpinnerGrandeComponent], // Asegúrate de tener MatIconModule importado si no lo estabas usando antes
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss']
})
export class AdminUsuariosComponent implements OnInit {
  @Input() userList: any[] = [];
  @Input() userSelected: any;
  rol: string | null = "";
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  cargando: boolean = true;
  pageSize = 5;
  currentPage = 0;
  totalItems = 0;
  displayedUsers: any[] = [];
  searchTerm: string = '';
  selectedEstado: string = '';
  filteredUserList: any[] = [];
  permisosHeredar: any[] = [];

  // Roles que no se deben mostrar en la UI
  rolesOcultos: string[] = [
    'Distribuidores Administración',
    'Grandes Cuentas Administración',
    'Superadmin',
    //'Operaciones' // Ejemplo para habilitar de nuevo (comentado)
  ];

  // --- Nuevas propiedades para ordenamiento ---
  sortColumn: string = '';
  sortDirection: SortDirection = '';
  // ------------------------------------------

  constructor(
    private userService: UsuarioService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.cargando = true; // Reiniciamos el estado por si acaso

    // En SUPERADMIN, como es un panel global, ejecutaremos directamente getAllUsers
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        console.log('Todos los usuarios:', res);
        const rawData = Array.isArray(res) ? res : res?.[0] || [];
        this.userList = [...rawData];
        this.applyFilters();

        // Damos un pequeño respiro para que el DOM se entere del cambio e impacte el spinner si la red es lenta
        setTimeout(() => {
          this.cargando = false;
        }, 500);
      },
      error: (err) => {
        console.error('Error al obtener usuarios:', err);
        this.cargando = false;
      }
    });

    this.userService.users$.subscribe({
      next: (users) => {
        if (users && users.length > 0) {
          console.log('Usuarios recibidos desde el observable:', users);
          this.userList = users;
          this.applyFilters();
          this.cargando = false;
        }
      }
    });
  }

  // Método para actualizar los usuarios mostrados según la página actual y el ordenamiento
  updateDisplayedUsers(): void {
    // 1. Ordenar la lista filtrada si hay una columna activa
    let sortedList = [...this.filteredUserList];
    if (this.sortColumn && this.sortDirection) {
      sortedList.sort((a, b) => {
        const aValue = a[this.sortColumn];
        const bValue = b[this.sortColumn];

        // Manejar valores nulos o indefinidos
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return this.sortDirection === 'asc' ? -1 : 1;
        if (bValue == null) return this.sortDirection === 'asc' ? 1 : -1;

        // Comparar cadenas o números
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
        } else {
          comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }

        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // 2. Calcular el slice para la paginación
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedUsers = sortedList.slice(startIndex, endIndex);
  }


  applyFilters(): void {
    let filtered = [...this.userList];

    // Filtro por búsqueda (ID, email, nombre, razón social, cliente GP)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.ID_USUARIO?.toString().includes(term) ||
          user.MAIL?.toLowerCase().includes(term) ||
          user.NOMBRE?.toLowerCase().includes(term) ||
          user.APELLIDO?.toLowerCase().includes(term) ||
          user.RAZONSOCIAL?.toLowerCase().includes(term) ||
          user.GP_CUSTNMBR?.toLowerCase().includes(term)
      );
    }

    // ✅ Filtro por estado (ACTIVO = "1", INACTIVO = "2")
    if (this.selectedEstado) {
      filtered = filtered.filter(user => user.ACTIVO === this.selectedEstado);
    }

    this.filteredUserList = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 0; // Resetear a primera página
    this.updateDisplayedUsers();
  }

  // Manejador de eventos de paginación
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedUsers(); // Actualizar la vista con la nueva página
  }

  // --- Nuevo método para manejar el clic en la cabecera ---
  onSort(column: string): void {
    if (this.sortColumn === column) {
      // Si es la misma columna, cambiar la dirección: desc -> asc -> '' -> desc
      if (this.sortDirection === 'desc') {
        this.sortDirection = 'asc';
      } else if (this.sortDirection === 'asc') {
        this.sortDirection = '';
        this.sortColumn = ''; // Limpiar la columna activa
      } else { // '' -> desc
        this.sortDirection = 'desc';
      }
    } else {
      // Si es otra columna, ordenar por ella descendente
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }

    // Actualizar la lista mostrada con el nuevo ordenamiento
    this.updateDisplayedUsers();
  }

  // --- Nuevo método para determinar el icono de ordenamiento ---
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'unfold_more'; // Icono neutro si no es la columna activa
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : this.sortDirection === 'desc' ? 'arrow_downward' : 'unfold_more';
  }
  // ----------------------------------------------------------


  // Si en el futuro agregas fecha, podrías usar esto
  formatDate(dateStr: string): string {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(2);
    return `${day}/${month}/${year}`;
  }



  crearUsuario() {
    this.userService.getAllRoles().subscribe((roles) => {
      console.log('Roles disponibles:', roles);
      const dialogRef = this.dialog.open(ModalCrearComponent, {
        width: '40vw',
        disableClose: true,
        data: {
          roles: roles,
          permisosHeredar: this.permisosHeredar
        }
      });
    });
  }
  editarUsuario(usuario: any) {
    // Aseguramos que los roles sean un array
    this.userService.getAllRoles().subscribe((roles) => {
      this.userSelected = usuario;
      console.log('Usuario seleccionado para editar:', this.userSelected);
      // Aquí podrías abrir un modal o hacer algo con el usuario seleccionado
      const dialogRef = this.dialog.open(ModalEditarComponent, {
        width: '600px',
        disableClose: true,
        data: {
          roles: roles,
          usuario: this.userSelected,
          permisosHeredar: this.permisosHeredar
        }
      });
      dialogRef.afterClosed().subscribe(() => {
        this.userService.reloadUsers();
      });
    })
  }

  gestionarRoles(usuario: any) {
    this.userService.getAllRoles().subscribe((roles) => {
      this.userSelected = usuario;
      const dialogRef = this.dialog.open(ModalRolesComponent, {
        width: '600px',
        disableClose: true,
        data: {
          roles: roles,
          usuario: this.userSelected
        }
      });
    });
  }

  gestionarPermisos(usuario: any) {
    this.userService.getAllRoles().subscribe((roles) => {
      this.userSelected = usuario;
      const dialogRef = this.dialog.open(ModalPermisosComponent, {
        width: '800px',
        disableClose: true,
        data: {
          roles: roles,
          usuario: this.userSelected,
          permisosHeredar: this.permisosHeredar
        }
      });
    });
  }

  eliminarUsuario(usuario: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar al usuario ${usuario.NOMBRE}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#222',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Usuario a eliminar:', usuario);
        this.userService.deleteUser(usuario.ID_USUARIO).subscribe({
          next: (response) => {
            console.log('Usuario eliminado con éxito:', response);
            this.userList = this.userList.filter(u => u.ID_USUARIO !== usuario.ID_USUARIO);
            this.userService.reloadUsers();
            this.applyFilters(); // Reaplicar filtros para actualizar la vista
          },
          error: (error) => {
            console.error('Error al eliminar el usuario:', error);
          }
        });
      }
    });
  }

  // tengo que hacer uana funcion que mediante un usuario que tiene una propiedad en string separe a un array los roles ('Administrador, Reseller')
  // Por ejemplo:
  splitRoles(rolesInput: any): string[] {
    if (!rolesInput) return [];
    
    let rolesString = '';
    if (Array.isArray(rolesInput)) {
      rolesString = rolesInput.map(r => r.ROL || r).join(',');
    } else {
      rolesString = String(rolesInput);
    }

    return rolesString.split(',')
      .map(role => role.trim())
      .filter(role => role && !this.rolesOcultos.includes(role));
  }

}