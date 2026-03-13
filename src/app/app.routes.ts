import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./core/layout/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'users',
        loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'sgs',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
    ]
  },
  {
    path: 'b2b',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
    ]
  },
  {
    path: 'ad',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
    ]
  }
];
