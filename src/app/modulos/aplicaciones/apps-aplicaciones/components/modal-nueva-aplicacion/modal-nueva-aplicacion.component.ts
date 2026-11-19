import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { AppsMenuAdminService, ItemNuevoRolGrupo, LogoMenu, NuevaAplicacion, TipoRolGrupo } from '../../../services/apps-menu-admin.service';

// Alta de una aplicacion: sistema (sigla + nombre), sus roles, sus grupos (si tiene) y opcionalmente
// su fila en el menu de apps (⊞). La API crea todo en una transaccion (ek-apps-menu/aplicaciones/create).
// Los usuarios son los mismos de siempre; los roles y grupos de la app se asignan despues desde
// Aplicaciones -> Usuarios.
@Component({
  selector: 'app-modal-nueva-aplicacion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './modal-nueva-aplicacion.component.html',
  styleUrls: ['../modal-aplicaciones.scss']
})
export class ModalNuevaAplicacionComponent implements OnInit {

  sigla = '';
  nombre = '';

  roles: ItemNuevoRolGrupo[] = [];
  grupos: ItemNuevoRolGrupo[] = [];
  tieneGrupos = false;
  // Lo que se esta escribiendo para agregar, por tipo
  nuevo: { [tipo in TipoRolGrupo]: ItemNuevoRolGrupo } = {
    rol: { NOMBRE: '', DESCRIPCION: '' },
    grupo: { NOMBRE: '', DESCRIPCION: '' }
  };

  agregarAlMenu = false;
  menu = {
    IMAGE: null as string | null,
    LINK: '',
    ORDEN: 0,
    ABRIR_EN_NUEVA_PESTANA: true,
    // Inactiva por defecto: se activa cuando la app este lista
    ACTIVO: false
  };

  logos: LogoMenu[] = [];
  cargandoLogos = true;
  guardando = false;

  constructor(
    public dialogRef: MatDialogRef<ModalNuevaAplicacionComponent>,
    private appsMenuAdminService: AppsMenuAdminService
  ) { }

  ngOnInit(): void {
    this.appsMenuAdminService.getLogos().subscribe({
      next: logos => {
        this.logos = logos || [];
        this.cargandoLogos = false;
      },
      error: () => this.cargandoLogos = false
    });
  }

  // La sigla va en mayusculas, sin espacios ni simbolos (es lo que sale en sistemas_permitidos)
  normalizarSigla(): void {
    this.sigla = this.sigla.toUpperCase().replace(/[^A-Z0-9_]/g, '');
  }

  nuevoDe(tipo: TipoRolGrupo): ItemNuevoRolGrupo {
    return this.nuevo[tipo];
  }

  lista(tipo: TipoRolGrupo): ItemNuevoRolGrupo[] {
    return tipo === 'rol' ? this.roles : this.grupos;
  }

  // silencioso: al guardar, lo que quedo escrito se suma sin avisar si ya estaba
  agregar(tipo: TipoRolGrupo, silencioso = false): void {
    const nombre = (this.nuevo[tipo].NOMBRE || '').trim();
    if (!nombre) return;
    const lista = this.lista(tipo);
    if (lista.some(i => i.NOMBRE.toLowerCase() === nombre.toLowerCase())) {
      if (!silencioso) this.avisar('Nombre repetido', `Ya agregaste "${nombre}".`);
      return;
    }
    lista.push({ NOMBRE: nombre, DESCRIPCION: (this.nuevo[tipo].DESCRIPCION || '').trim() || null });
    this.nuevo[tipo] = { NOMBRE: '', DESCRIPCION: '' };
  }

  quitar(tipo: TipoRolGrupo, index: number): void {
    this.lista(tipo).splice(index, 1);
  }

  seleccionarLogo(file: string | null): void {
    this.menu.IMAGE = file;
  }

  private avisar(titulo: string, texto: string): void {
    Swal.fire({ icon: 'warning', title: titulo, text: texto, confirmButtonText: 'Aceptar', confirmButtonColor: '#222' });
  }

  guardar(): void {
    if (this.guardando) return;
    this.normalizarSigla();
    if (!this.sigla) {
      this.avisar('Sigla requerida', 'Ingresá la sigla de la aplicación (ej: TEU). Después no se puede modificar.');
      return;
    }
    // Lo que quedo escrito sin apretar "Agregar" tambien se guarda
    this.agregar('rol', true);
    if (this.tieneGrupos) this.agregar('grupo', true);

    if (this.agregarAlMenu) {
      const link = this.menu.LINK.trim();
      if (!/^https?:\/\//i.test(link)) {
        this.avisar('Link inválido', 'Para agregarla al menú, el link debe empezar con http:// o https://.');
        return;
      }
      if (!Number.isInteger(Number(this.menu.ORDEN))) {
        this.avisar('Orden inválido', 'El orden debe ser un número entero.');
        return;
      }
    }

    const payload: NuevaAplicacion = {
      SISTEMA: this.sigla,
      NOMBRE: this.nombre.trim() || null,
      MENU: this.agregarAlMenu ? { ...this.menu, LINK: this.menu.LINK.trim(), ORDEN: Number(this.menu.ORDEN) } : null,
      ROLES: this.roles,
      GRUPOS: this.tieneGrupos ? this.grupos : []
    };

    this.guardando = true;
    this.appsMenuAdminService.crearAplicacion(payload).subscribe({
      next: () => {
        this.guardando = false;
        Swal.fire({ icon: 'success', title: 'Aplicación creada', timer: 1500, showConfirmButton: false });
        this.dialogRef.close(true);
      },
      // El servicio ya muestra el error
      error: () => this.guardando = false
    });
  }

  onCerrar(): void {
    this.dialogRef.close(false);
  }
}
