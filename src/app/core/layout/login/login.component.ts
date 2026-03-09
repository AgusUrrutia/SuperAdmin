import { AfterViewInit, Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

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

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
  }

  onSubmit() {
    if (this.username !== '' && this.password !== '') {
      console.log('Login credentials:', this.username, this.password);
      // alert('Login intent - User: ' + this.username);
    } else {
      console.warn('Please fill all fields');
    }
  }

  ngAfterViewInit(): void {
    const usuarioInput = document.getElementById('usuario') as HTMLInputElement;
    if (usuarioInput) {
      usuarioInput.focus();
    }
  }
}
