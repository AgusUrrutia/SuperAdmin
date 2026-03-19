import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, pipe, switchMap } from 'rxjs';
import * as proyectSettings from '../../../core/services/proyectSettings';
import Swal from 'sweetalert2';
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private url: string = proyectSettings.onlineUrlBase;
  addressDemo: any[] = [
    { id: 1, nombre: 'Casa', calle: 'Calle 123', localidad: 'Localidad A', cod_postal: '12345', numero: '123', piso: '1', departamento: 'A', provincia: 'Provincia X', comentario: '', metodo: "envio" },
    { id: 2, nombre: 'Oficina', calle: 'Avenida 456', localidad: 'Localidad B', cod_postal: '67890', numero: '456', piso: '2', departamento: 'B', provincia: 'Provincia Y', comentario: '', metodo: "envio" },
  ]

  constructor(private http: HttpClient) { }



  makeHeaders() {
    let headers = new HttpHeaders();
    let user = null;
    console.log();

    if (typeof window !== 'undefined' && !!localStorage.getItem('token')) {
      user = sessionStorage?.getItem('user');
    }
    user = sessionStorage?.getItem('user');
    let token = "";
    if (user) {
      token = (JSON.parse(user)).token;
    }

    headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`

    });
    return headers;
  }



  private users = new BehaviorSubject<any[]>([]);
  users$ = this.users.asObservable();

  // NOmbre de usuario

  private userName = new BehaviorSubject<string>('');
  userName$ = this.userName.asObservable();
  setUserName(name: string) {
    this.userName.next(name);
  }
  getUserName(): string {
    return this.userName.getValue();
  }


  login(usuario: string, contraseña: string): Observable<any> {
    const body = {
      user: usuario,
      password: contraseña
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.url}login`, body, { headers });
  }

  logOut(): void {
    Swal.fire({
      title: 'Cerrando sesión...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    })
    setTimeout(() => {
      localStorage.clear();
      location.reload();
      Swal.close();
    }, 1000);
  }


  getAddress(idCliente: string | undefined): Observable<any[]> {
    let headers = this.makeHeaders();

    let usergp = localStorage.getItem('userGp');

    let user = undefined;
    if (idCliente !== undefined) {
      user = idCliente;
    } else {
      user = usergp;
    }


    // if(!usergp){
    //   Swal.fire({
    //     icon: 'warning',
    //     title: 'No se puede utilizar el servicio de direcciones',
    //     text: 'Se designará un array demo de direcciones',
    //     confirmButtonText: 'Aceptar',
    //     confirmButtonColor: '#222'
    //   });
    //   return of(this.addressDemo);
    // }

    return this.http.get<any[]>(`${this.url}/b2b/direciones/user/${user}`, { headers }).pipe(
      // Si la respuesta es un array vacío, retornar el array demo

      map((response: any[]) => {
        if (response.length === 0) {
          return this.addressDemo;
        }
        return response;
      })
      //Si la respuesta es un 404, retorna el array demo
      , catchError((error) => {
        console.log('Error al obtener las direcciones:', error);

        if (error.status === 404) {
          console.log("Error 404, retornando array demo");
          return of(this.addressDemo);
        } else {
          console.log("Respuesta no válida, retornando array vacío");

          return of([]);
        }
      })
    );
  }




  getAllUsers(): Observable<any[]> {
    let headers = this.makeHeaders();
    return this.http.get<any[]>(`${this.url}ek-usuarios/all/full`, { headers }).pipe(
      map(users => {
        // Transformamos cada usuario para agregarle rolesArray
        return users.map(user => ({
          ...user, // Asumiendo que el campo se llama 'roles'
        }));
      }),
      catchError((error) => {
        console.error('Error al obtener los usuarios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al obtener los usuarios',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of([]);
      })
    );
  }



  getAllUsersByClient(): Observable<any> { // Quitamos el [] porque ahora es un objeto
    const userGP = localStorage.getItem('userGp');
    const id_usuario = localStorage.getItem('id_usuario');
    let headers = this.makeHeaders();
  
    return this.http.get<any>(`${this.url}/b2b/panel-admin/obtener-usuarios-cliente-y-permisos/${userGP}/${id_usuario}`, { headers }).pipe(
      map(res => {
        const rawUsers = res?.USUARIOS || [];
        const permisos = res?.PERMISOS || []; // Extraemos los permisos
  
        // Agrupamos usuarios
        const grouped = rawUsers.reduce((acc: any, current: any) => {
          const id = current.ID_USUARIO;
          if (!acc[id]) {
            acc[id] = {
              ...current,
              rolesArray: []
            };
          }
          acc[id].rolesArray.push({
            id_rol: current.id_rol,
            nombre_rol: current.ROL,
            id_roles_relacion: current.ID_ROLES
          });
          return acc;
        }, {});
  
        // Retornamos UN SOLO OBJETO con ambas listas
        return {
          usuarios: Object.values(grouped),
          permisos: permisos
        };
      }),
      catchError((error) => {
        console.error('Error:', error);
        // ... tu lógica de Swal ...
        return of({ usuarios: [], permisos: [] });
      })
    );
  }




  getRolesArray(roles: string): string[] {
    console.log('Roles recibidos:', roles);
    if (!roles) return [];
    return roles.split(',').map(role => role.trim());
  }
  createUser(user: any): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.post<any>(`${this.url}ek-usuarios/create`, user, { headers }).pipe(
      catchError((error) => {
        console.error('Error al crear el usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al crear el usuario',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of(null);
      })
    );
  }

  getPerfilesPermitidos(idUser: String): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.get<any[]>(`${this.url}b2b/panel-admin/user-rol-perfiles/${idUser}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener los perfiles permitidos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al obtener los perfiles permitidos',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of([]);
      })
    );
  }


  updateUser(user: any): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.post<any>(`${this.url}ek-usuarios/update`, user, { headers }).pipe(
      catchError((error) => {
        console.error('Error al actualizar el usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar el usuario',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of(null);
      })
    );
  }

  addRoleToUser(userId: string, roleId: string, nombreRol: String): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.post<any>(`${this.url}roles/create`,
      {
        ID_USER: userId,
        ID_ROL: roleId,
        ROL: nombreRol
      },
      { headers }).pipe(
        catchError((error) => {
          console.error('Error al agregar el rol al usuario:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al agregar el rol',
            text: 'Por favor, intente más tarde.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#222'
          });
          return of(null);
        })
      );
  }

  getRolData(roleId: string): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.get<any>(`${this.url}ek-usuarios/perfiles/${roleId}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener los datos del rol:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al obtener los datos del rol',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of(null);
      })
    );
  }
  removeRoleFromUser(roleId: string): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.get<any>(`${this.url}roles/delete/${roleId}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al eliminar el rol del usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar el rol',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of(null);
      })
    );
  }


  getAllRoles(): Observable<any[]> {
    let headers = this.makeHeaders();
    return this.http.get<any[]>(`${this.url}roles/all`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener los roles:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al obtener los roles',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of([]);
      })
    );
  }
  getAllRolesByUser(userId: string): Observable<any[]> {
    let headers = this.makeHeaders();
    return this.http.get<any[]>(`${this.url}roles/usuario/${userId}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener los roles del usuario:', error);
        return of([]);
      })
    );
  }

  reloadUsers(): void {
    // Al estar integrados en Super Admin, siempre cargamos todos usando getAllUsers
    this.getAllUsers().subscribe(users => {
      this.users.next(users);
    });
  }


  getAllModules(): Observable<any[]> {
    const headers = this.makeHeaders();

    return this.http.get<any[]>(`${this.url}/b2b/menus/`, { headers }).pipe(
      switchMap((response: any[]) => {
        console.log('Módulos obtenidos:', response);
        return of(response); // Devolver los módulos obtenidos
      }),
      catchError((error) => {
        if (error.status === 403) {

          console.error('Acceso denegado. Redirigiendo a la página de inicio de sesión.');
          this.logOut();

        }
        // Manejar el error y retornar un array vacío

        console.error('Error al obtener los módulos:', error);
        return of([]); // Manejar el error y retornar un array vacío
      })
    );
  }

  getModulesByRole(roleId: string): Observable<any[]> {
    const headers = this.makeHeaders();

    return this.http.get<any[]>(`${this.url}/b2b/menus/${roleId}`, { headers }).pipe(
      switchMap((response: any[]) => {
        console.log('Módulos por rol obtenidos:', response);
        return of(response); // Devolver los módulos obtenidos
      }),
      catchError((error) => {
        if (error.status === 403) {

          console.error('Acceso denegado. Redirigiendo a la página de inicio de sesión.');
          this.logOut();

        }
        // Manejar el error y retornar un array vacío

        console.error('Error al obtener los módulos por rol:', error);
        return of([]); // Manejar el error y retornar un array vacío
      })
    );
  }

  quitarPermiso(userId: string, menuId: string): Observable<any> {
    const headers = this.makeHeaders();

    return this.http.post<any>(`${this.url}/b2b/panel-admin/quitar-acceso-menu`,
      {
        ID_USUARIO: userId,
        ID_MENU: menuId,

      },

      { headers }).pipe(
        catchError((error) => {
          console.error('Error al quitar el permiso del usuario:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al quitar el permiso',
            text: 'Por favor, intente más tarde.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#222'
          });
          return of(null);
        })
      );
  }


  // /b2b/panel-admin/obtener-accesos-permisos-usuario/
  getIntegratedModules(user: string): Observable<any[]> {
    const headers = this.makeHeaders();

    return this.http.get<any[]>(`${this.url}/b2b/panel-admin/obtener-accesos-permisos-usuario/${user}`, { headers }).pipe(
      switchMap((response: any[]) => {
        console.log('Módulos integrados obtenidos:', response);
        return of(response); // Devolver los módulos obtenidos
      }),
      catchError((error) => {
        if (error.status === 403) {

          console.error('Acceso denegado. Redirigiendo a la página de inicio de sesión.');
          this.logOut();

        }
        // Manejar el error y retornar un array vacío

        console.error('Error al obtener los módulos integrados:', error);
        return of([]); // Manejar el error y retornar un array vacío
      })
    );
  }

  updatePermissions(userId: string, menuId: string, accionId: any, rolId: string): Observable<any> {
    const headers = this.makeHeaders();
    //     el body tiene que ser 
    //     'ID_USUARIO'
    // 'ID_MENU'
    // 'ID_ACCION'
    // 'ID_ROL'

    return this.http.post<any>(`${this.url}/b2b/panel-admin/guardar-acceso-permiso`,
      {
        ID_USUARIO: userId,
        ID_MENU: menuId,
        ID_ACCION: accionId,
        ID_ROL: rolId
      },
      { headers }).pipe(
        catchError((error) => {
          console.error('Error al actualizar los permisos del usuario:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar los permisos',
            text: 'Por favor, intente más tarde.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#222'
          });
          return of(null);
        })
      );
  }


  deleteUser(userId: number): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.get<any>(`${this.url}ek-usuarios/delete/${userId}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al eliminar el usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar el usuario',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of(null);
      })
    );
  }

  getDataAccount(): Observable<any> {
    let headers = this.makeHeaders();
    let userGP = localStorage.getItem('userGp');
    return this.http.get<any>(`${this.url}b2b/clientes/${userGP}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener los datos de la cuenta:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al obtener los datos de la cuenta',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of(null);
      })
    );
  }

  getAccount(): Observable<any> {
    let headers = this.makeHeaders();
    let userGP = localStorage.getItem('userGp');
    return this.http.get<any>(`${this.url}b2b/cliente/cuenta/${userGP}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener los datos de la cuenta:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al obtener los datos de la cuenta',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of(null);
      })
    );
  }

  changePassword(passwordData: any): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.post<any>(`${this.url}/change-password-ad`, passwordData, { headers }).pipe(
      catchError((error) => {
        console.error('Error al cambiar la contraseña:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cambiar la contraseña',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of(null);
      })
    );
  }

  changeActivo(userId: number): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.post<any>(`${this.url}ek-usuarios/toggle-activo/${userId}`, {}, { headers }).pipe(
      catchError((error) => {
        console.error('Error al deshabilitar el usuario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al deshabilitar/habilitar el usuario',
          text: 'Por favor, intente más tarde.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#222'
        });
        return of(null);
      })
    );
  }

  addPerfilToUser(roleId: string, perfilId: string): Observable<any> {
    let headers = this.makeHeaders();
    return this.http.post<any>(`${this.url}/b2b/panel-admin/add-perfil-user`,
      {
        ID_USUARIO_ROL: roleId,
        ID_PERFIL: perfilId
      },
      { headers }).pipe(
        catchError((error) => {
          console.error('Error al agregar el perfil al rol:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error al agregar el perfil',
            text: 'Por favor, intente más tarde.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#222'
          });
          return of(null);
        })
      );
  }
}

