from fastapi import FastAPI, APIRouter, Request
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from api import crear_usuario, autenticar_creacion_usuario, reservas, login, usuarios
from dotenv import load_dotenv
from config.logging_config import logger
import os
load_dotenv()  # Carga las variables desde el archivo .env
logger.info(f"Main.py: DB_PASSWORD loaded: {bool(os.getenv('DB_PASSWORD'))}")
logger.info(f"Main.py: CWD: {os.getcwd()}")

app = FastAPI(debug=False)

# Handler personalizado para errores de validación
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Extraer los errores y formatear mensajes
    errors = []
    for error in exc.errors():
        field = '.'.join(str(loc) for loc in error['loc'])
        msg = error['msg']  # Mensaje de Pydantic o validator
        # Customize email validation error message
        if 'email' in field and 'valid email' in msg.lower():
            msg = 'El formato de email es inválido'
        errors.append(f'Error en {field}: {msg}')

    return JSONResponse(
        status_code=422,
        content={'detail': 'Datos inválidos. Por favor revise: ', 'errors': errors}
    )

# Handler para HTTPException general (errores como password corta)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={'detail': exc.detail}
    )

# Handler para excepciones generales no manejadas
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception in {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={'detail': 'Error interno del servidor'}
    )

@app.get("/")
def root():
    return FileResponse("public/pages/home/home.html")

@app.get("/iniciar_sesion")
def iniciar_sesion_page():
    return FileResponse("public/pages/crear_usuario/crear_usuario.html")

@app.get("/ya_tengo_sesion")
def ya_tengo_sesion():
    return FileResponse("public/pages/ya_tengo_sesion/ya_tengo_sesion.html")

@app.get("/login")
def login_page():
    return FileResponse("public/pages/login/login.html")

@app.get("/crear_reserva")
def crear_reserva():
    return FileResponse('public/pages/crear_reserva/crear_reserva.html')

@app.get("/gestion_usuarios")
def gestion_usuarios():
    return FileResponse('public/pages/gestion_usuarios/gestion_usuarios.html')

@app.get("/sobre_nosotros")
def sobre_nosotros():
    return FileResponse('public/pages/sobre_nosotros/sobre_nosotros.html')

@app.get("/galeria")
def galeria():
    return FileResponse('public/pages/galeria/galeria.html')

app.mount("/static", StaticFiles(directory='public'), name='static')

# Incluir routers
app.include_router(crear_usuario.router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(autenticar_creacion_usuario.router, prefix="/autenticar_creacion_usuario", tags=["Autenticación"])
app.include_router(reservas.router, prefix="/api", tags=["Reservas"])
app.include_router(login.router, prefix="/api", tags=["Autenticación"])
app.include_router(usuarios.router, prefix="/api", tags=["Usuarios"])

logger.info(f"FastAPI debug mode enabled: {app.debug}")