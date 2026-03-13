# Documento Técnico: Proyecto SuperAdmin

## 1. Stack Tecnológico de Frontend
El proyecto está inicializado utilizando tecnologías modernas del ecosistema Angular.

### Frameworks y Lenguajes
- **Framework Principal:** Angular (Versión 17.3.0+)
- **Lenguaje:** TypeScript (~5.4.2)
- **Arquitectura de Componentes:** Componentes Standalone (No se utilizan NgModules (`app.module.ts`), la configuración de rutas vive en `app.routes.ts`).
- **Manejo de Reactividad:** RxJS (~7.8.0), integrado con las nuevas características de control flow y (posiblemente) Signals de Angular 17.
- **Estilos:** SCSS (Sass) global y a nivel de componente.
- **Librerías de UI y Componentes:**
  - **Angular Material:** Componentes UI nativos de Angular siguiendo Material Design.
  - **Bootstrap:** Sistema de grid y clases utilitarias para diseño responsivo.
  - **SweetAlert2:** Librería para gestionar notificaciones y alertas modales (popups).

### Herramientas y Entorno (DevDependencies)
- **CLI:** Angular CLI (Versión 17.3.17)
- **Compilación/Bundling:** Esbuild / Angular DevKit
- **Testing Unitario:** Jasmine Core (~5.1.0) y Karma (~6.4.0)

## 2. Entidades de Dominio Propuestas (Estructura de Datos)
Dado que el proyecto recién ha sido inicializado y no contiene entidades previas, se establecen las siguientes entidades fundamentales requeridas para un sistema **SuperAdmin** a ser implementadas en el futuro próximo:

1. **`User` (Usuario):**
   - `id`: string (UUID)
   - `email`: string
   - `name`: string
   - `isActive`: boolean
   - `roleId`: string
   - `createdAt`: Date

2. **`Role` (Rol):**
   - `id`: string (UUID)
   - `name`: string (ej. 'SYSTEM_ADMIN', 'SUPPORT')
   - `permissions`: string[] (arreglo de identificadores de permisos)

3. **`Tenant` / `Organization` (Inquilino):**
   - `id`: string (UUID)
   - `name`: string
   - `subscriptionStatus`: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'
   - `contactEmail`: string
   - `createdAt`: Date

4. **`AuditLog` (Log de Auditoría):**
   - `id`: string (UUID)
   - `action`: string (ej. 'CREATE_USER', 'DELETE_TENANT')
   - `performedBy`: string (User ID)
   - `timestamp`: Date
   - `details`: string (JSON object)

## 3. Configuración de Rutas (Angular Router)
La generación de las siguientes rutas base está proyectada en `src/app/app.routes.ts`:

- `/auth/login`: Módulo de autenticación - Componente público (standalone).
- `/dashboard`: Módulo core post-inicio de sesión (Ruta protegida por Guard `canActivate`).
- `/users`: Gestión del CRUD de usuarios del sistema.
  - `/users/new`
  - `/users/:id`
- `/roles`: Gestión y visualización de permisos.
- `/tenants`: Listado y administración de las empresas/clientes B2B registrados en el sistema.
- `/settings`: Configuraciones globales de la plataforma.

### Enlaces y Redirecciones Externas
- Múltiples secciones del Layout incorporan anclajes (tags `<a>`) con `target="_blank"` para conectar el actual proyecto con plataformas externas como Ranko Digital (ej. `https://www.rankodigital.com.ar/b2b`).

## 4. Estructura de Carpetas Recomendada para Escalabilidad
Se recomienda generar el scaffolding interno de Angular 17 bajo la siguiente estructura orientada a dominios:

```text

src/app
├── core
│   └── layout
│       └── admin-layout
│           ├── sidebar
│           ├── navbar
│           ├── login
│          
│
├── shared
│   └── components
│    
└── pages
      
``` 



## 5. Implementaciones Destacadas

### Gestión de Roles y Usuarios
- **Modales CRUD Premium:** Implementación de `CrearUsuarioComponent`, `EditarUsuarioComponent` y `RolesModalComponent` con diseño estandarizado y neutrura cromática.
- **Lógica de Asignación de Roles:** Sistema de búsqueda predictiva con `MatAutocomplete` y gestión de listados locales con confirmaciones mediante `SweetAlert2`.
- **Paginación en Modales:** Implementación de lógica de paginado manual para optimizar la visualización de datos en espacios reducidos.
- **ModalService:** Capa de abstracción sobre `MatDialog` para centralizar la configuración de diálogos (panelClass, width, height fijo).
- **Servicios Centralizados:** `UsuarioAdminService` gestiona las operaciones de integración (mock) mediante observables de RxJS.

*Nota para la IA:* El sistema ha evolucionado integrando un robusto framework de componentes para la administración de usuarios. Los nuevos módulos deben seguir la arquitectura de componentes Standalone y el sistema de diseño neutro establecido.
