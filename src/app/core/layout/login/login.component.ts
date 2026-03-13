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

      this.usuarioSrv.login(this.username, this.password).subscribe(
        (response: any) => {
          Swal.close();
          localStorage.setItem('token', response.token);
          const user = {
            token: response.token,
            'update-token': response['update-token'],
            formulariosSGS: response.formulariosSGS,
            usuario: response.usuario,
            grupos: response.grupos,
            roles: response.roles
          };
          sessionStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('usuario', response.usuario);
          this.router.navigate(['/']);
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
