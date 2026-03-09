# Informe de Estilos Core (Basado en Prototipo)

La aplicación implementa un diseño de Panel de Administración (Admin Dashboard) centrado en una navegación lateral principal que utiliza **Bootstrap 5** como motor de estilos y grillas.

## 1. Patrón Arquitectónico del Layout (`AdminLayoutComponent`)
El diseño principal (shell) sigue un patrón de **dos columnas**:
- **Menú Lateral (Sidebar):** Ubicado a la izquierda, funciona de manera persistente (o colapsable en pantallas pequeñas). Controla la navegación global (Ej: `Categorías`, usuarios, configuración).
- **Contenido Principal:** Ocupa el espacio restante a la derecha y contiene una barra superior (Navbar) opcional y el área dinámica manejada por el `<router-outlet>`.

## 2. Decisiones de Interfaz de Usuario (Bootstrap Utilities)

### Sidebar (Navegación Oscura)
Tomando como base la captura de pantalla provista:
- **Fondo Oscuro:** Se utiliza `bg-dark` o un tono similar personalizado (ej. `#1a1e23`) para lograr un contraste fuerte frente al fondo grisáceo del panel central.
- **Tipografía:** Textos claros o blancos (`text-white`) para el branding superior ("Hardware ST").
- **Estructura Interna:** Uso de listas (`ul`, `li`, `.nav`, `.flex-column`) para estructurar los elementos del menú vertical de forma nativa con Bootstrap.

### Dropdowns y Navegaciones
- **Categorías (Menú Desplegable):** Construido usando las directivas nativas de Bootstrap (`.dropdown-menu`, `.dropdown-toggle`).
- El menú se despliega sobre fondo blanco puro (`bg-white`), presentando los listados de hardware ("Motherboards", "Tarjetas Gráficas", etc.) con textos legibles en tono oscuro (`text-dark` o `text-secondary`).

### Área Principal y NavBar
- **Fondo Central:** El área de contenido y la tabla de datos descansan sobre una superficie gris clara (`bg-light` o similar, ej. `#d1d1d1` en el prototipo) para separar visualmente la zona de acciones ("Sidebar") de la zona de información.
- **Top Navbar:** Diseñada como envoltorio para encabezados, perfil de usuario (ej. Admin User) y un menú Dropdown tipo "App Switcher" (icono grid 3x3) para redirección nativa con `<a target="_blank">` hacia diferentes ecosistemas hermanos, como la plataforma B2B de rankodigital. Se incorpora el logo en la base del Sidebar.

## 3. Integración Visual
La aplicación integra Angular con:
- **Iconografía:** Posible uso de FontAwesome, Bootstrap Icons o Material Icons para los símbolos lógicos (ej. el chip de *Hardware ST* o el símbolo "X").
- **Componentes HTML Base:**
  - Tablas para listar colecciones (`table`, `table-striped`).
  - Textos de encabezado fuertes para centrado (`<h1 class="text-center">`).

*Nota para el equipo de desarrollo:* Todas las clases CSS personalizadas o anulaciones a la lógica base de Bootstrap deben limitarse y localizarse dentro de `styles.scss` (para estilos globales del layout) o en el propio CSS del componente en cascada (`sidebar.component.scss`).
