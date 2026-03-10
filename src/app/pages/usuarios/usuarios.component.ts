import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../shared/services/modal.service';
import { CrearUsuarioComponent } from './components/crear-usuario/crear.component';
import { RolesModalComponent } from './components/roles-modal/roles-modal.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.component.html',
  styles: [`
    .btn-dark-custom {
      background-color: #222;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 500;
      transition: background-color 0.2s;
      &:hover {
        background-color: #444;
      }
    }
  `]
})
export class UsuariosComponent {

  usuarios = [
    { id: '#001', nombre: 'John Doe', correo: 'admin@ranko.com', rol: 'SuperAdmin', estado: 'Activo', conexion: 'Hace 2 horas' },
    { id: '#002', nombre: 'Jane Smith', correo: 'user@ranko.com', rol: 'Soporte', estado: 'Activo', conexion: 'Ayer' },
    { id: '#003', nombre: 'Mario Ruiz', correo: 'mario.rz@ranko.com', rol: 'Ventas', estado: 'Inactivo', conexion: 'Hace 2 semanas' }
  ];

  constructor(private modalService: ModalService) {}

  abrirModal() {
    this.modalService.open(CrearUsuarioComponent).afterClosed().subscribe(res => {
      if (res) {
        console.log('Usuario creado, refrescando lista...');
      }
    });
  }

  abrirModalRoles(usuario: any) {
    this.modalService.open(RolesModalComponent, { usuario }, '650px').afterClosed().subscribe(res => {
      console.log('Modal de roles cerrado');
    });
  }
}
