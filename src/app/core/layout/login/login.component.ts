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
import { catchError, forkJoin, of } from 'rxjs';

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

      // Se loguea contra las dos APIs: SGS (api.ranko) y B2B (rankodigital).
      // Si falla la de B2B se permite el ingreso igual, solo queda sin token B2B.
      forkJoin({
        sgs: this.usuarioSrv.login(this.username, this.password),
        b2b: this.usuarioSrv.loginB2B(this.username, this.password).pipe(
          catchError((errorB2B: any) => {
            console.error('Error durante el login B2B:', errorB2B);
            return of(null);
          })
        )
      }).subscribe(
        ({ sgs: response, b2b: responseB2B }: any) => {
          Swal.close();

          const roles: string[] = response.roles || [];
          if (!roles.includes('Superadmin')) {
            Swal.fire({
              icon: 'error',
              title: 'Permisos denegados',
              text: 'No cuenta con los permisos necesarios para acceder a esta aplicación.',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#222'
            });
            return;
          }

          localStorage.setItem('token', response.token);
          const user = {
            token: response.token,
            'update-token': response['update-token'],
            formulariosSGS: response.formulariosSGS,
            usuario: response.usuario,
            grupos: response.grupos,
            roles: response.roles,
            tokenB2B: responseB2B?.token || null
          };
          sessionStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('usuario', response.usuario);
          if (responseB2B?.token) {
            localStorage.setItem('tokenB2B', responseB2B.token);
          } else {
            localStorage.removeItem('tokenB2B');
          }
          this.router.navigate(['/']);

          if (!responseB2B?.token) {
            Swal.fire({
              icon: 'warning',
              title: 'Sin acceso a B2B',
              text: 'No se pudo iniciar sesión en la API del B2B. Las acciones del módulo B2B no van a funcionar.',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#222'
            });
          }
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
