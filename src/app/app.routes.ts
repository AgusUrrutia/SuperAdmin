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
      {
        path: 'grupos',
        loadComponent: () => import('./modulos/sgs/tabla-admin-grupo/tabla-admin-grupo.component').then(m => m.TablaAdminGrupoComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./modulos/sgs/tabla-admin-usuario/tabla-admin-usuario.component').then(m => m.TablaAdminUsuarioComponent)
      },
      {
        path: '',
        redirectTo: 'grupos',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'b2b',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'usuarios',
        loadComponent: () => import('./modulos/b2b/admin-usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent)
      },
      {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'ad',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'usuarios',
        loadComponent: () => import('./modulos/ad/admin-usuarios-ad/admin-usuarios-ad.component').then(m => m.AdminUsuariosAdComponent)
      },
      {
        path: 'historial',
        loadComponent: () => import('./modulos/ad/historial-acciones-ad/historial-acciones-ad.component').then(m => m.HistorialAccionesAdComponent)
      },
      {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'aplicaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'usuarios',
        loadComponent: () => import('./modulos/aplicaciones/usuarios-aplicaciones/usuarios-aplicaciones.component').then(m => m.UsuariosAplicacionesComponent)
      },
      {
        path: 'apps',
        loadComponent: () => import('./modulos/aplicaciones/apps-aplicaciones/apps-aplicaciones.component').then(m => m.AppsAplicacionesComponent)
      },
      {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'logs',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'errores',
        loadComponent: () => import('./modulos/logs/tabla-logs-errores/tabla-logs-errores.component').then(m => m.TablaLogsErroresComponent)
      },
      {
        path: 'accesos',
        loadComponent: () => import('./modulos/logs/tabla-logs-accesos/tabla-logs-accesos.component').then(m => m.TablaLogsAccesosComponent)
      },
      {
        path: '',
        redirectTo: 'errores',
        pathMatch: 'full'
      }
    ]
  }
];
