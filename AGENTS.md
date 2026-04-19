

# AGENTS.md

## Project Overview
FastAPI backend with PostgreSQL database for a hotel/posada reservation system. Frontend is served as static HTML/CSS/JS.

## 🧠 Memory & Context (Engram MCP)
Este proyecto utiliza **Engram** como sistema de memoria persistente para asegurar la continuidad entre sesiones de desarrollo.

* **Consulta Obligatoria**: Antes de realizar cambios estructurales en la API o modelos de base de datos, utiliza `search_memory` para verificar si existen decisiones previas documentadas.
* **Registro de Decisiones**: Al finalizar una implementación crítica (ej. cambios en el esquema de `posada_db` o lógica de autenticación JWT), documenta la decisión técnica utilizando `save_memory`.
* **Continuidad de Sesión**: Al iniciar una nueva interacción, ejecuta el comando `context` para recuperar el hilo de las últimas sesiones y sincronizar el estado del desarrollo.

## Running the App

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Setup

Create a `.env` file with these required variables:
```
DB_HOST=localhost
DB_NAME=posada_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_secure_random_secret_key
```

Generate `JWT_SECRET` with a secure random key (e.g., `openssl rand -hex 32`).

The app loads `.env` via `load_dotenv()` on startup (both in `main.py` and `config/database_config.py`).

## Architecture

- **Entry point**: `main.py` - FastAPI app, mounts static files from `public/`
- **API routes**: `api/` directory with routers for users, bookings, auth
- **Models**: `models/` directory
- **Config**: `config/` - database connection, logging
- **Frontend**: `public/pages/` - static HTML pages, `public/assets/` - JS/CSS/images

## Database

Uses PostgreSQL with `psycopg2-binary`. Connection config in `config/database_config.py`.

## Dependencies

```
fastapi, pydantic[email], psycopg2-binary, python-dotenv, bcrypt, PyJWT, uvicorn, jinja2
```

Install via: `pip install -r requirements.txt`

## Frontend Design System

The project uses **Tailwind CSS v4** via CDN with a custom color palette based on the original beige/rural theme.

### Color Palette
- Beige (navbar): `#bfae8f`
- Green (primary): `#2a3222` (darker tone for better contrast)
- Green hover: `#3d4632`
- Text: `#6a6156`
- Background: `#f6f4f1`
- Form backgrounds: `#F0F0F0`
- Borders: `#DCD6CA`

### Typography
- Headings: **Playfair Display** (serif, elegant)
- Body: **Inter** (sans-serif, modern)

### Tailwind CDN
```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

### Page Layouts
- **Standard pages (sobre_nosotros, galeria, etc.)**: Two-column grid with image on right
- **Home page**: Hero section with title + description + buttons + featured image, followed by features cards section

### Key Classes Used
- `fade-in`, `fade-in-delay-1/2/3` - Page load animations
- `hover:scale-105 hover:scale-105 transition-all duration-300` - Navigation hover effects
- Glassmorphism removed - solid colors now

## Notes

- App loads `.env` via `load_dotenv()` at module import time in both `main.py` and `config/database_config.py`. Missing variables cause startup failures.
- `JWT_SECRET` is required for auth module to load (in `api/auth.py`).
- `pydantic[email]` is required for `EmailStr` type used in `models/user.py`.
- Database tables are auto-created on first connection via `config/database_initialization.py`.

## Authentication

- Token JWT almacenado en `localStorage` con clave `token`
- Navbar dinámico: archivo `public/assets/js/auth-nav.js` carga en todas las páginas públicas
- IDs requeridos en navbar: `auth-btn`, `auth-btn-mobile`, `reservas-link`, `reservas-link-mobile`
- "Cerrar Sesión" tiene hover rojo (`hover:bg-red-600` desktop, `text-red-600` mobile)
- Link "Reservas" hidden por defecto, visible solo con token activo

## Footer (Home Page)

Located at `public/pages/home/home.html`:
- **Contacto section**: Links to Instagram, WhatsApp, Gmail, Google Maps link

## Mapa (Home Page)

Located in main content (not footer) at `public/pages/home/home.html`:
- Uses **OpenStreetMap + Leaflet.js** (free, no API key required)
- Interactivo con marker en coordenadas placeholder: Mendoza [-32.8897, -68.8414]
- Botón "Ver en Google Maps" para abrir en Google Maps externo

---

### ¿Qué logramos con esto?
1.  **Contexto técnico**: El agente ahora sabe que las decisiones de base de datos y JWT deben guardarse en Engram para no repetirlas en el futuro.
2.  **Eficiencia**: Al pedirle que busque antes de proponer cambios, evitas que el agente "alucine" soluciones que ya descartaste anteriormente.
3.  **Memoria Local**: Como Engram está en modo `project`, todo lo que guarde se quedará en la base de datos local de este sistema de reservas.