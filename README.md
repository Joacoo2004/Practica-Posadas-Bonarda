# Posadas Bonarda - Sistema de Reservas

Sistema de gestión de reservas para una posada rural, desarrollado con FastAPI y PostgreSQL.

## Características

- **Gestión de usuarios**: Registro, autenticación y administración de usuarios
- **Sistema de reservas**: Creación, consulta y eliminación de reservas de habitaciones
- **Disponibilidad**: Control de disponibilidad de habitaciones por fechas
- **Autenticación JWT**: Seguridad mediante tokens JWT

## Requisitos

- Python 3.12+
- PostgreSQL 14+
- Las dependencias detalladas en `requirements.txt`

## Instalación

1. Clonar el repositorio y crear un entorno virtual:

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# O: venv\Scripts\activate  # Windows
```

2. Instalar dependencias:

```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno en `.env`:

```
DB_HOST=localhost
DB_NAME=posada_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_PORT=5432
JWT_SECRET=genera_un_token_seguro
```

Para generar `JWT_SECRET`:
```bash
openssl rand -hex 32
```

4. Ejecutar el servidor:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

5. Acceder a la aplicación en `http://localhost:8000`

## Estructura del Proyecto

```
.
├── api/                                    # Endpoints de la API
│   ├── auth.py                             # Autenticación JWT
│   ├── crear_usuario.py                    # Registro de usuarios
│   ├── autenticar_creacion_usuario.py      # Login
│   ├── reservas.py                         # Gestión de reservas
│   └── usuarios.py                         # Administración de usuarios
├── config/                                 # Configuración
│   ├── database_config.py                  # Configuración de BD
│   ├── database_operations.py              # Operaciones de BD
│   ├── database_initialization.py          # Inicialización de tablas
│   └── logging_config.py                   # Logging
├── models/                                 # Modelos Pydantic
│   ├── user.py
│   ├── booking.py
│   └── ...
├── public/                                 # Frontend estático
│   ├── pages/                              # Páginas HTML
│   └── assets/                             # CSS, JS, imágenes
├── main.py                                 # Punto de entrada
└── requirements.txt                        # Dependencias
```

## Base de Datos

El sistema crea automaticamente las siguientes tablas:

- **usuarios**: Datos de clientes registrados
- **habitaciones**: 4 habitaciones disponibles
- **precios**: Tarifa por noche
- **reservas**: Reservas de clientes
- **pagos**: Registros de pagos

### Inicialización

Las tablas se crean automáticamente al iniciar si no existen. También puedes ejecutar la inicialización manualmente:

```python
from config.database_initialization import initialize_posada_system
from config.database_connection import connect_postgresql

connection, cursor = connect_postgresql()
initialize_posada_system(cursor, connection)
```

## API Endpoints

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-----------|
| POST | `/autenticar_creacion_usuario` | Iniciar sesión |
| POST | `/usuarios/crear` | Registrarse |

### Reservas

| Método | Ruta | Descripción |
|--------|------|-----------|
| GET | `/api/reservas` | Listar mis reservas |
| POST | `/api/reservas` | Crear reserva |
| DELETE | `/api/reservas/{id}` | Cancelar reserva |
| GET | `/api/reservas/pendientes` | Reservas pendientes (admin) |
| GET | `/api/disponibilidad` | Consultar disponibilidad |

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-----------|
| GET | `/api/usuarios` | Listar usuarios (admin) |
| PUT | `/api/usuarios/{id}` | Actualizar usuario |
| DELETE | `/api/usuarios/{id}` | Eliminar usuario |

## Desarrollo

### Rutas disponibles del frontend

- `/` - Página principal
- `/iniciar_sesion` - Inicio de sesión y registro
- `/login` - Inicio de sesión
- `/crear_reserva` - Nueva reserva
- `/gestion_usuarios` - Administración de usuarios
- `/sobre_nosotros` - Información de la posada
- `/galeria` - Galería de imágenes

### Tecnologías

- **Backend**: FastAPI, Pydantic, psycopg2
- **Base de datos**: PostgreSQL
- **Autenticación**: PyJWT, bcrypt
- **Frontend**: HTML, **Tailwind CSS v4** (CDN), JavaScript vanilla

## Diseño Visual

### Paleta de Colores
- Beige (navbar): `#bfae8f`
- Verde oscuro: `#2a3222`
- Verde hover: `#3d4632`
- Texto: `#6a6156`
- Fondo: `#f6f4f1`
- Formularios: `#F0F0F0`
- Bordes: `#DCD6CA`

### Tipografías
- **Títulos**: Playfair Display (serif, elegante)
- **Texto general**: Inter (sans-serif, moderna)

### Estructura de Página
- **Home**: Hero + features cards
- **Sobre Nosotros / Galería**: Grid dos columnas
- **Crear Reserva / Registro**: Formularios centrado

### Efectos
- Fade-in en carga de páginas (`fade-in`, `fade-in-delay-1/2/3`)
- Hover con escala en navegación (`hover:scale-105`)
- Transiciones suaves (`transition-all duration-300`)

## Licencia

MIT