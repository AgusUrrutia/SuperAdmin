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

  // Usuarios agrupados por mail
  groupedUserList: any[] = [];

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
        this.buildGroupedList();
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
          this.buildGroupedList();
          this.applyFilters(true); // preservar página y filtros activos al recargar
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


  buildGroupedList(): void {
    const map = new Map<string, any>();
    for (const user of this.userList) {
      const mail = (user.MAIL || '').toLowerCase().trim();
      if (!map.has(mail)) {
        map.set(mail, {
          ...user,           // propiedades representativas del grupo
          instancias: [user] // todas las instancias con ese mail
        });
      } else {
        map.get(mail).instancias.push(user);
      }
    }
    this.groupedUserList = Array.from(map.values());
  }

  getGroupedRoles(group: any): string[] {
    if (!group.instancias) return [];
    const allRoles = new Set<string>();
    for (const inst of group.instancias) {
      const roles = this.splitRoles(inst.ROLES);
      for (const r of roles) {
        allRoles.add(r);
      }
    }
    return Array.from(allRoles);
  }

  getGroupedSistemas(group: any): any[] {
    if (!group.instancias) return [];
    const uniqueApps = new Map<string, any>();
    for (const inst of group.instancias) {
      if (inst.SISTEMAS && Array.isArray(inst.SISTEMAS)) {
        for (const app of inst.SISTEMAS) {
          const id = app.ID || app.id || app.ID_APLICACION;
          if (id && !uniqueApps.has(String(id))) {
            uniqueApps.set(String(id), app);
          }
        }
      }
    }
    return Array.from(uniqueApps.values());
  }

  get existingMails(): string[] {
    return this.userList.map(u => (u.MAIL || '').toLowerCase().trim()).filter(Boolean);
  }

  applyFilters(preservePage: boolean = false): void {
    let filtered = [...this.groupedUserList];

    // Filtro por búsqueda (ID, email, nombre, razón social, cliente GP)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        group =>
          group.ID_USUARIO?.toString().includes(term) ||
          group.MAIL?.toLowerCase().includes(term) ||
          group.NOMBRE?.toLowerCase().includes(term) ||
          group.APELLIDO?.toLowerCase().includes(term) ||
          group.RAZONSOCIAL?.toLowerCase().includes(term) ||
          group.GP_CUSTNMBR?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado (ACTIVO = "1", INACTIVO = "0")
    if (this.selectedEstado) {
      filtered = filtered.filter(group => group.ACTIVO === this.selectedEstado);
    }

    this.filteredUserList = filtered;
    this.totalItems = filtered.length;

    if (!preservePage) {
      this.currentPage = 0;
    } else {
      // Si la página actual ya no existe (ej: se eliminó el último item de esa página), ajustar
      const maxPage = Math.max(0, Math.ceil(this.totalItems / this.pageSize) - 1);
      if (this.currentPage > maxPage) {
        this.currentPage = maxPage;
      }
    }

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
          permisosHeredar: this.permisosHeredar,
          existingMails: this.existingMails // <-- nuevo: para validar duplicados
        }
      });
    });
  }

  editarUsuario(group: any) {
    this.userService.getAllRoles().subscribe((roles) => {
      this.userSelected = group;
      console.log('Grupo seleccionado para editar:', this.userSelected);
      const dialogRef = this.dialog.open(ModalEditarComponent, {
        width: '90vw',
        disableClose: true,
        data: {
          roles: roles,
          usuario: this.userSelected,
          instancias: group.instancias, // <-- nuevo: todas las instancias del grupo
          permisosHeredar: this.permisosHeredar
        }
      });
      dialogRef.afterClosed().subscribe(() => {
        this.userService.reloadUsers();
      });
    });
  }

  gestionarRoles(group: any) {
    const list = group.instancias || [group];
    if (list.length <= 1) {
      this.abrirModalRoles(list[0]);
    } else {
      const inputOptions: { [key: string]: string } = {};
      list.forEach((inst: any) => {
        inputOptions[inst.ID_USUARIO] = `${inst.GP_CUSTNMBR || 'Sin cliente'} - ${inst.NOMBRE} ${inst.APELLIDO} (ID: ${inst.ID_USUARIO})`;
      });
      Swal.fire({
        title: 'Seleccionar cuenta',
        text: 'Este correo tiene múltiples cuentas. Selecciona cuál deseas gestionar:',
        input: 'select',
        inputOptions: inputOptions,
        inputPlaceholder: 'Seleccione una cuenta',
        showCancelButton: true,
        confirmButtonColor: '#222',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Gestionar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        inputValidator: (value) => {
          return new Promise((resolve) => {
            if (value) {
              resolve();
            } else {
              resolve('Debes seleccionar una cuenta');
            }
          });
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const selectedUser = list.find((inst: any) => String(inst.ID_USUARIO) === String(result.value));
          if (selectedUser) {
            this.abrirModalRoles(selectedUser);
          }
        }
      });
    }
  }

  private abrirModalRoles(usuario: any) {
    this.userService.getAllRoles().subscribe((roles) => {
      const dialogRef = this.dialog.open(ModalRolesComponent, {
        width: '600px',
        disableClose: true,
        data: {
          roles: roles,
          usuario: usuario
        }
      });
      dialogRef.afterClosed().subscribe(() => {
        this.userService.reloadUsers();
      });
    });
  }

  gestionarPermisos(group: any) {
    const list = group.instancias || [group];
    if (list.length <= 1) {
      this.abrirModalPermisos(list[0]);
    } else {
      const inputOptions: { [key: string]: string } = {};
      list.forEach((inst: any) => {
        inputOptions[inst.ID_USUARIO] = `${inst.GP_CUSTNMBR || 'Sin cliente'} - ${inst.NOMBRE} ${inst.APELLIDO} (ID: ${inst.ID_USUARIO})`;
      });
      Swal.fire({
        title: 'Seleccionar cuenta',
        text: 'Este correo tiene múltiples cuentas. Selecciona de cuál deseas gestionar los permisos:',
        input: 'select',
        inputOptions: inputOptions,
        inputPlaceholder: 'Seleccione una cuenta',
        showCancelButton: true,
        confirmButtonColor: '#222',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Gestionar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        inputValidator: (value) => {
          return new Promise((resolve) => {
            if (value) {
              resolve();
            } else {
              resolve('Debes seleccionar una cuenta');
            }
          });
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const selectedUser = list.find((inst: any) => String(inst.ID_USUARIO) === String(result.value));
          if (selectedUser) {
            this.abrirModalPermisos(selectedUser);
          }
        }
      });
    }
  }

  private abrirModalPermisos(usuario: any) {
    this.userService.getAllRoles().subscribe((roles) => {
      const dialogRef = this.dialog.open(ModalPermisosComponent, {
        width: '800px',
        disableClose: true,
        data: {
          roles: roles,
          usuario: usuario,
          permisosHeredar: this.permisosHeredar
        }
      });
      dialogRef.afterClosed().subscribe(() => {
        this.userService.reloadUsers();
      });
    });
  }

  eliminarUsuario(group: any) {
    const list = group.instancias || [group];
    if (list.length <= 1) {
      this.confirmarEliminar(list[0]);
    } else {
      const inputOptions: { [key: string]: string } = {};
      list.forEach((inst: any) => {
        inputOptions[inst.ID_USUARIO] = `${inst.GP_CUSTNMBR || 'Sin cliente'} - ${inst.NOMBRE} ${inst.APELLIDO} (ID: ${inst.ID_USUARIO})`;
      });
      Swal.fire({
        title: 'Seleccionar cuenta a eliminar',
        text: 'Este correo tiene múltiples cuentas. Selecciona cuál deseas eliminar:',
        input: 'select',
        inputOptions: inputOptions,
        inputPlaceholder: 'Seleccione una cuenta',
        showCancelButton: true,
        confirmButtonColor: '#c53030',
        cancelButtonColor: '#222',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        inputValidator: (value) => {
          return new Promise((resolve) => {
            if (value) {
              resolve();
            } else {
              resolve('Debes seleccionar una cuenta');
            }
          });
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const selectedUser = list.find((inst: any) => String(inst.ID_USUARIO) === String(result.value));
          if (selectedUser) {
            this.confirmarEliminar(selectedUser);
          }
        }
      });
    }
  }

  private confirmarEliminar(usuario: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la cuenta GP ${usuario.GP_CUSTNMBR || '—'} de ${usuario.NOMBRE}`,
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
            this.buildGroupedList();
            this.applyFilters();
            this.userService.reloadUsers();
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