# Documento Conceptual: Proyecto SuperAdmin

## 1. Visión General del Proyecto
El proyecto **SUPERADMIN** es una aplicación web Frontend diseñada para actuar como el panel de administración central de más alto nivel dentro de una arquitectura o plataforma de software. Su objetivo principal es proveer a los administradores globales las herramientas necesarias para gestionar todo el ecosistema de la aplicación.

### Modales y Componentes de Acción
Recientemente se ha definido un **Sistema de Diseño para Modales** que prioriza la claridad y el control:
- **Paleta de Colores Neutra:** Uso predominante de Negro (`#222`) y Gris oscuro (`#555`) para textos y botones principales, eliminando distracciones cromáticas y mejorando el contraste.
- **Tipografía Nítida:** Etiquetas de formulario (`section-label`) en mayúsculas, tamaño reducido y peso visual fuerte para una lectura rápida.
- **Cabeceras Estandarizadas:** Fondo blanco, ícono representativo de la acción, título en negrita y botón de cierre (X) discreto.
- **Estabilidad Visual:** Los modales mantienen una altura fija para evitar "saltos" en la interfaz al filtrar datos o navegar por páginas.
- **Botones de Acción:** Botón principal en color negro sólido (`#222`) alineado a la derecha, siguiendo la jerarquía visual de la aplicación.
- **Input Placeholders:** Oscurecidos para garantizar la legibilidad en pantallas con diferentes niveles de brillo.

## 2. Propósito y Objetivos
- **Gestión Centralizada:** Permitir la administración de múltiples inquilinos (Tenants/Organizaciones), usuarios globales y configuraciones del sistema desde una única interfaz gráfica.
- **Control de Acceso (RBAC):** Gestionar de forma granular los roles y permisos que rigen la seguridad y los accesos de la plataforma.
- **Auditoría y Monitoreo:** Ofrecer visibilidad total sobre las acciones que suceden en el sistema mediante registros de auditoría (logs) y métricas globales.
- **Configuración del Sistema:** Centralizar la parametrización de variables del entorno, integraciones con terceros y reglas de negocio globales.
- **Diseño e Interfaz de Usuario:** Utilizar estándares de diseño modernos y eficientes mediante la integración de **Angular Material** (componentes UI base), **Bootstrap** (sistema de grilla y utilidades responsivas) y **SweetAlert2** (alertas interactivas).

## 3. Alcance Funcional Propuesto
Dado el contexto de un sistema SuperAdmin, la plataforma deberá ofrecer:
1. **Módulo de Autenticación y Autorización:** Login seguro para administradores de alto nivel.
2. **Dashboard Global:** Resumen estadístico (KPIs) del estado general de la plataforma (usuarios activos, errores del sistema, nuevas organizaciones registradas).
3. **Módulo de Usuarios y Roles:** Creación, edición y eliminación de usuarios. Incluye un sistema avanzado de asignación de roles mediante un modal interactivo con búsqueda predictiva (autocomplete) y gestión de listados.
4. **Módulo de Tenants (Organizaciones):** Soporte para gestionar clientes B2B, sus licencias, límites de uso y estado de cuenta.
5. **Módulo de Auditoría y Logs:** Historial inmutable de acciones críticas realizadas en el sistema.
6. **Integración Externa (App Switcher):** Panel rápido en el navbar para acceder o redirigir de forma fluidada a módulos externos (SGS, B2B), empleando vínculos directos como `https://www.rankodigital.com.ar/b2b`.
7. **Sistema de Modales Estandarizado:** Implementación de una interfaz de usuario coherente para todas las acciones CRUD (Crear, Editar, Asignar Roles), garantizando estabilidad visual y usabilidad.

## 4. Audiencia / Usuarios Finales
Este panel **no** está destinado a clientes finales, sino a personal interno, como:
- Administradores de Sistemas (SysAdmins).
- Personal de Soporte Técnico (Tier 2/3).
- Gerentes de Producto y Operaciones.

*Nota para IA:* El sistema se encuentra actualmente en su fase de inicialización (scaffolding), por lo que las funcionalidades listadas representan la hoja de ruta funcional hacia la cual debe ser construida y orientada la aplicación.
