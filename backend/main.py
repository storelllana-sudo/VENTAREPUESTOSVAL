import os
import json
import logging
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from typing import Optional, List, Any, Generic, TypeVar
from uuid import UUID
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
from psycopg2.extras import register_uuid
from jose import JWTError, jwt
from passlib.context import CryptContext

# Registrar adaptador UUID para PostgreSQL
register_uuid()

# 1. CONFIGURACIÓN DE SEGURIDAD Y CONFIGURACIÓN CRIPTOGRÁFICA (JWT / BCRYPT)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v2/auth/login")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "7c48f883b24f5a9e3381a17926b48d21c3b1e95fa784d1bc945893d2c88f1234")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # Jornada laboral estándar (8 horas)

# CONFIGURACIÓN DE LOGGING ESTRUCTURADO
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("ERP_VAL_API")

# CORRECCIÓN DE RUTA PARA .ENV: Localiza de forma exacta la raíz un nivel arriba
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# AUDITORÍA DE INYECCIÓN DE VARIABLES EN CONSOLA
print("\n========== VARIABLES DETECTADAS ==========")
print("DB_PASSWORD =", "CONFIGURADA" if os.getenv("DB_PASSWORD") else "None 🔴")
print("ALLOWED_ORIGINS =", os.getenv("ALLOWED_ORIGINS"))
print("==========================================\n")
# Instanciar el Connection Pool corporativo de repuestos_val_db
try:
    db_pool = SimpleConnectionPool(
        minconn=5,
        maxconn=50,
        host="localhost",
        database="repuestos_val_db",
        user="postgres",
        password=os.getenv("DB_PASSWORD"),
        port=5432,
        connect_timeout=5,
        options="-c client_encoding=utf8"
    )
    logger.info("Pool de conexiones PostgreSQL iniciado con éxito.")
except Exception as e:
    logger.critical(f"Fallo catastrófico al inicializar el Connection Pool: {str(e)}")
    raise e

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    if db_pool:
        db_pool.closeall()
        logger.info("Connection Pool de PostgreSQL cerrado limpiamente.")

# Instancia central de FastAPI
app = FastAPI(
    title="ERP Repuestos VAL - API",
    description="Ecosistema de servicios backend corporativos con seguridad RBAC y motor multiproducto v3",
    version="3.1.0",
    lifespan=lifespan
)

# CONFIGURACIÓN DINÁMICA Y EXPLÍCITA DE CORS
# Se procesa la variable de entorno o se asignan los puertos locales por defecto
origins_env = os.getenv("ALLOWED_ORIGINS")
if origins_env:
    origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]

# Inyección inmediata del middleware para interceptar las cabeceras del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_resource():
    """Entrega una conexión pura del pool y garantiza su devolución al finalizar el request"""
    conn = db_pool.getconn()
    try:
        yield conn
    finally:
        db_pool.putconn(conn)
# ---------------------------------------------------------------------------
# LOGICA CRIPTOGRÁFICA DE AUXILIO
# ---------------------------------------------------------------------------
def verificar_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def crear_token_acceso(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def obtener_usuario_actual(token: str = Depends(oauth2_scheme), db=Depends(get_db_resource)):
    """Inyecta de forma segura el usuario autenticado validando su firma y vigencia en cada request"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de acceso inválidas o expiradas.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    cursor = None
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT usuario_id, username, nombre_completo, rol, activo FROM usuarios WHERE username = %s;", (username,))
        usuario = cursor.fetchone()
        if usuario is None or not usuario["activo"]:
            raise credentials_exception
        return usuario
    finally:
        if cursor and not cursor.closed:
            cursor.close()

# ---------------------------------------------------------------------------
# MODELOS DE VALIDACIÓN DE ENTRADAS Y RESPUESTAS (Pydantic)
# ---------------------------------------------------------------------------
T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None

class ProductoItem(BaseModel):
    producto_id: UUID
    cantidad: int = Field(..., gt=0, description="La cantidad debe ser mayor a cero")

class SolicitudVenta(BaseModel):
    empresa_id: UUID
    bodega_id: UUID
    medio_pago: str = "EFECTIVO"
    productos: List[ProductoItem]

class VentaDataResponse(BaseModel):
    v_id: UUID
    v_total: float
    v_estado: str

class BusquedaProductoResponse(BaseModel):
    producto_id: UUID
    codigo_sku: str
    nombre_articulo: str
    marca_fabricante: str
    precio_venta_neto: float
    stock_actual: int

class BusquedaClienteResponse(BaseModel):
    cliente_id: UUID
    rut: str
    nombre_completo: str

class BodegaResponse(BaseModel):
    bodega_id: UUID
    nombre: str
# ---------------------------------------------------------------------------
# ENDPOINTS DE AUTENTICACIÓN Y SEGURIDAD
# ---------------------------------------------------------------------------
@app.post("/api/v2/auth/login", tags=["Seguridad y Control de Accesos"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db_resource)):
    """Verifica el usuario contra la base de datos relacional y emite un token JWT firmado de sesión"""
    cursor = None
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM usuarios WHERE username = %s;", (form_data.username,))
        usuario = cursor.fetchone()
        if not usuario or not verificar_password(form_data.password, usuario["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nombre de usuario o contraseña incorrectos."
            )
        if not usuario["activo"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="El usuario se encuentra inactivo.")
            
        token_jwt = crear_token_acceso(data={"sub": usuario["username"], "rol": usuario["rol"]})
        logger.info(f"LOGIN_EXITOSO | Usuario: {usuario['username']} | Rol: {usuario['rol']}")
        return {"access_token": token_jwt, "token_type": "bearer"}
    finally:
        if cursor and not cursor.closed:
            cursor.close()

# ---------------------------------------------------------------------------
# ENDPOINTS OPERATIVOS (PROTEGIDOS POR AUTENTICACIÓN RBAC)
# ---------------------------------------------------------------------------
@app.post(
    "/api/v2/ventas/procesar-caja",
    status_code=status.HTTP_201_CREATED,
    response_model=ApiResponse[VentaDataResponse],
    tags=["Caja y Ventas"]
)
def procesar_venta_caja(datos: SolicitudVenta, db=Depends(get_db_resource), usuario_actual: dict = Depends(obtener_usuario_actual)):
    """Invoca de forma transaccional el orquestador PL/pgSQL en la base de datos."""
    if usuario_actual["rol"] not in ["Administrador", "Vendedor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acceso denegado: El rol '{usuario_actual['rol']}' no cuenta con permisos para facturar en caja."
        )
    cursor = None
    try:
        if not datos.productos:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La lista de productos no puede estar vacía.")
        cursor = db.cursor(cursor_factory=RealDictCursor)
        query = "SELECT * FROM fn_procesar_venta_caja_v3(%s::UUID, %s::UUID, %s::VARCHAR, %s::JSONB);"
        productos_json = json.dumps([
            {"producto_id": str(item.producto_id), "cantidad": item.cantidad}
            for item in datos.productos
        ])
        cursor.execute(query, (datos.empresa_id, datos.bodega_id, datos.medio_pago, productos_json))
        comprobante = cursor.fetchone()
        if comprobante is None:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error en motor transaccional: No hubo datos de respuesta.")
        try:
            db.commit()
        except Exception as commit_error:
            db.rollback()
            logger.error(f"Falla en confirmación de red durante Commit: {str(commit_error)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error de comunicación al consolidar la venta. Se aplicó Rollback defensivo.")
            
        venta_id = comprobante.get('v_id')
        total = comprobante.get('v_total')
        estado = comprobante.get('v_estado')
        logger.info(f"VENTA_EMITIDA | Venta: {venta_id} | Cajero: {usuario_actual['username']} | Total: ${total} CLP | Estado: {estado}")
        return {
            "success": True,
            "data": {
                "v_id": venta_id,
                "v_total": total,
                "v_estado": estado
            },
            "error": None
        }
    except psycopg2.Error as e:
        if db:
            db.rollback()
        error_msg = str(e.diag.message_primary) if e.diag and e.diag.message_primary else str(e)
        logger.warning(f"DATABASE_EXCEP | pgcode: {e.pgcode} | Detalle: {error_msg}")
        if "Stock insuficiente" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error_msg)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Excepción de base de datos ({e.pgcode}): {error_msg}")
    finally:
        if cursor and not cursor.closed:
            cursor.close()

@app.get(
    "/api/v2/productos/buscar",
    response_model=ApiResponse[List[BusquedaProductoResponse]],
    tags=["Catálogo y Productos"]
)
def buscar_repuestos_compatibles(termino: str = "", db=Depends(get_db_resource)):
    """Realiza una búsqueda de repuestos en la vista analítica (Ruta pública para consulta rápida)"""
    cursor = None
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        query = """
        SELECT producto_id, codigo_sku, nombre_articulo, marca_fabricante, precio_venta_neto, stock_actual
        FROM vw_buscador_compatibilidades
        WHERE documento_indexado ILIKE %s LIMIT 50;
        """
        termino_limpio = f"%{termino.strip().upper()}%" if termino.strip() else "%"
        cursor.execute(query, (termino_limpio,))
        resultados = cursor.fetchall()
        return {"success": True, "data": resultados, "error": None}
    except psycopg2.Error as e:
        error_msg = str(e.diag.message_primary) if e.diag and e.diag.message_primary else str(e)
        logger.error(f"DATABASE_ERROR en Buscador | pgcode: {e.pgcode} | Detalle: {error_msg}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al procesar la búsqueda.")
    finally:
        if cursor and not cursor.closed:
            cursor.close()

@app.get(
    "/api/v2/clientes/buscar",
    response_model=ApiResponse[List[BusquedaClienteResponse]],
    tags=["Caja y Ventas"]
)
def buscar_clientes(termino: str = "", db=Depends(get_db_resource), usuario_actual: dict = Depends(obtener_usuario_actual)):
    """Busca clientes activos por Nombre o RUT para asociarlos a la venta en caja."""
    cursor = None
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        query = """
        SELECT cliente_id, rut, nombre_completo
        FROM clientes
        WHERE (nombre_completo ILIKE %s OR rut ILIKE %s) AND activo = true
        LIMIT 10;
        """
        termino_limpio = f"%{termino.strip().upper()}%" if termino.strip() else "%"
        cursor.execute(query, (termino_limpio, termino_limpio))
        resultados = cursor.fetchall()
        return {"success": True, "data": resultados, "error": None}
    except psycopg2.Error as e:
        logger.error(f"DATABASE_ERROR en Buscar Clientes: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al buscar clientes.")
    finally:
        if cursor and not cursor.closed:
            cursor.close()

@app.get(
    "/api/v2/bodegas",
    response_model=ApiResponse[List[BodegaResponse]],
    tags=["Caja y Ventas"]
)
def listar_bodegas(db=Depends(get_db_resource), usuario_actual: dict = Depends(obtener_usuario_actual)):
    """Lista las bodegas del sistema para definir el origen del inventario vendido."""
    cursor = None
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        query = "SELECT bodega_id, nombre FROM bodegas WHERE activa = true ORDER BY nombre;"
        cursor.execute(query)
        resultados = cursor.fetchall()
        return {"success": True, "data": resultados, "error": None}
    except psycopg2.Error as e:
        logger.error(f"DATABASE_ERROR en Listar Bodegas: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error al listar bodegas.")
    finally:
        if cursor and not cursor.closed:
            cursor.close()
