import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-roles-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatAutocompleteModule],
  templateUrl: './roles-modal.component.html',
  styleUrl: './roles-modal.component.scss'
})
export class RolesModalComponent implements OnInit {
  busquedaUsuario: string = '';
  filtroTabla: string = '';
  totalCount: number = 0;
  
  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 5; // Altura fija para 5 filas
  totalPaginas: number = 1;

  // Usuarios disponibles para el Autocomplete
  usuariosDisponibles = [
    { id: 101, email: 'adbugnone@ranko.com.ar' },
    { id: 102, email: 'albasili@ranko.com.ar' },
    { id: 103, email: 'algenovese@ranko.com.ar' },
    { id: 104, email: 'alglorioso@ranko.com.ar' },
    { id: 105, email: 'alrossi@ranko.com.ar' },
    { id: 106, email: 'alsidicaro@ranko.com.ar' },
    { id: 107, email: 'alsilva@ranko.com.ar' }
  ];

  usuariosSugeridos: any[] = [];
  
  // Datos de la tabla (usuarios ya asignados)
  usuarios = [
    { id: 257, email: 'sguzman@ranko.com.ar' },
    { id: 268, email: 'vojeda@ranko.com.ar' },
    { id: 288, email: 'admin4' },
    { id: 77, email: 'fesantos@ranko.com.ar' },
    { id: 2, email: 'admin1' }
  ];

  constructor(
    public dialogRef: MatDialogRef<RolesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.actualizarTotales();
  }

  actualizarTotales() {
    this.totalCount = this.usuarios.length;
    this.totalPaginas = Math.ceil(this.usuariosFiltradosBase.length / this.itemsPorPagina) || 1;
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
  }

  get usuariosFiltradosBase() {
    return this.usuarios.filter(u => 
      u.email.toLowerCase().includes(this.filtroTabla.toLowerCase()) || 
      u.id.toString().includes(this.filtroTabla)
    );
  }

  get usuariosFiltrados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.usuariosFiltradosBase.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(delta: number) {
    const nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
  }

  filtrarUsuarios() {
    const filterValue = this.busquedaUsuario.toLowerCase();
    
    // Buscamos si ya hay un match exacto
    const matchExacto = this.usuariosDisponibles.find(u => u.email.toLowerCase() === filterValue);

    if (matchExacto) {
        // Si ya escribió el mail completo y coincide exactamente, cerramos las sugerencias
        this.usuariosSugeridos = [];
    } else {
        // Si no, seguimos filtrando normalmente
        this.usuariosSugeridos = this.usuariosDisponibles.filter(op => 
          op.email.toLowerCase().includes(filterValue)
        );
    }
  }

  seleccionarUsuario(email: string) {
    this.busquedaUsuario = email;
    // Ya NO llama a agregarUsuario() automáticamente
  }

  agregarUsuario() {
    if (!this.busquedaUsuario.trim()) return;
    
    // Buscamos el usuario en la lista de disponibles por su email exacto
    const usuarioAAgregar = this.usuariosDisponibles.find(
        u => u.email.toLowerCase() === this.busquedaUsuario.toLowerCase()
    );
    
    if (usuarioAAgregar) {
        if (this.usuarios.some(u => u.id === usuarioAAgregar.id)) {
            Swal.fire('Atención', 'Este usuario ya está asignado', 'info');
            return;
        }

        this.usuarios.unshift({ ...usuarioAAgregar });
        this.actualizarTotales();
        this.paginaActual = 1; // Volver a la primera página para ver el nuevo
        this.busquedaUsuario = '';
        this.usuariosSugeridos = [];
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Usuario añadido',
          showConfirmButton: false,
          timer: 2000
        });
    } else {
        Swal.fire('Error', 'Debe seleccionar un usuario válido de la lista', 'error');
    }
  }

  quitarUsuario(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas quitar este usuario del rol?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#222',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarios = this.usuarios.filter(u => u.id !== id);
        this.actualizarTotales();
        Swal.fire('¡Eliminado!', 'El usuario ha sido quitado.', 'success');
      }
    });
  }

  cerrar() {
    this.dialogRef.close();
  }
}
