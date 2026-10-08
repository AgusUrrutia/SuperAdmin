import { AfterViewInit, Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { UsuarioService } from '../../services/usuario.service';
import Swal from 'sweetalert2';
import { guardarSesion } from '../../services/sesion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements AfterViewInit {
  hide = true;
  password = "";
  username: string = '';
  nroCliente: string = '';

  constructor(
    private fb: FormBuilder,
    private usuarioSrv: UsuarioService,
    private router: Router
  ) {
  }

  onSubmit() {
    if (this.username !== '' && this.password !== '') {
      Swal.fire({
        title: 'Cargando...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Login en la API de SGS. Para el módulo B2B se usa el mismo token si la API del B2B ya valida
      // contra la base común EK_SEGURIDAD; si no, se hace su login aparte (ver UsuarioService.tokenB2B).
      // Con la base común NO se puede hacer el segundo login: invalidaría el token del primero.
      this.usuarioSrv.login(this.username, this.password).subscribe(
        (response: any) => {
          const roles: string[] = response.roles || [];
          if (!roles.includes('Superadmin')) {
            Swal.close();
            Swal.fire({
              icon: 'error',
              title: 'Permisos denegados',
              text: 'No cuenta con los permisos necesarios para acceder a esta aplicación.',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#222'
            });
            return;
          }

          this.usuarioSrv.tokenB2B(response.token, this.username, this.password).subscribe((tokenB2B) => {
            Swal.close();
            guardarSesion(response, response.token, tokenB2B);
            this.router.navigate(['/']);

            if (!tokenB2B) {
              Swal.fire({
                icon: 'warning',
                title: 'Sin acceso a B2B',
                text: 'No se pudo iniciar sesión en la API del B2B. Las acciones del módulo B2B no van a funcionar.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#222'
              });
            }
          });
        },
        (error: any) => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al iniciar sesión. Por favor, verifique sus credenciales.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#222'
          });
          console.error('Error durante el login:', error);
        }
      );
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Completar campos',
        text: 'Por favor complete todos los campos.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#222'
      });
    }
  }

  ngAfterViewInit(): void {
    const usuarioInput = document.getElementById('usuario') as HTMLInputElement;
    if (usuarioInput) {
      usuarioInput.focus();
    }
  }
}
