import os
import json
import logging
from pathlib import Path
from typing import Optional, Generic, TypeVar, List
from contextlib import asynccontextmanager
from uuid import UUID
import asyncpg
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
from dotenv import load_dotenv

# =======================================================================
# 1. CAPA DE CONFIGURACIÓN ESTRICTA (ENVIRONMENT VALIDATION)
# =======================================================================
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / "backend" / ".env")

class Settings(BaseModel):
    JWT_SECRET_KEY: str = Field(default_factory=lambda: os.getenv("JWT_SECRET_KEY", ""))
    ALGORITHM: str = "HS256"
    
    DB_USER: str = Field(default_factory=lambda: os.getenv("DB_USER", "postgres"))
    DB_PASSWORD: str = Field(default_factory=lambda: os.getenv("DB_PASSWORD", ""))
    DB_HOST: str = Field(default_factory=lambda: os.getenv("DB_HOST", "127.0.0.1"))
    DB_PORT: int = Field(default_factory=lambda: int(os.getenv("DB_PORT", 5432)))
    DB_NAME: str = Field(default_factory=lambda: os.getenv("DB_NAME", ""))
    
    CORS_ORIGINS: list[str] = Field(default_factory=list)

    @model_validator(mode='before')
    @classmethod
    def validate_environment(cls, data: dict) -> dict:
        """Garantiza el principio Fail-Fast: la API no arranca si faltan secretos esenciales."""
        db_pass = os.getenv("DB_PASSWORD")
        db_name = os.getenv("DB_NAME")
        jwt_key = os.getenv("JWT_SECRET_KEY")
        
        if not db_pass or not db_name or not jwt_key:
            raise ValueError(
                "CRITICAL ERROR: Las variables de entorno esenciales (DB_PASSWORD, DB_NAME, JWT_SECRET_KEY) "
                "deben estar configuradas explícitamente en el archivo .env."
            )
            
        raw_cors = os.getenv("CORS_ORIGINS") or os.getenv("ALLOWED_ORIGINS") or "http://localhost:5175,http://127.0.0.1:5175"
        data["CORS_ORIGINS"] = [origin.strip() for origin in raw_cors.split(",")]
        return data

settings = Settings()
logger = logging.getLogger("ERP_VAL_API")
# =======================================================================
# 2. CAPA DE INFRAESTRUCTURA DE DATOS (RESERVOIR POOL PATTERN)
# =======================================================================
class DatabaseProvider:
    def __init__(self, cfg: Settings):
        self.cfg = cfg
        self._pool: Optional[asyncpg.Pool] = None

    async def initialize(self) -> None:
        try:
            self._pool = await asyncpg.create_pool(
                user=self.cfg.DB_USER,
                password=self.cfg.DB_PASSWORD,
                host=self.cfg.DB_HOST,
                port=self.cfg.DB_PORT,
                database=self.cfg.DB_NAME,
                min_size=5,
                max_size=50,
                timeout=5.0
            )
            logger.info("Pool de conexiones asyncpg iniciado de manera segura para Repuestos VAL.")
        except Exception as e:
            logger.critical(f"Fallo catastrófico al inicializar el Pool de Conexiones: {str(e)}")
            raise e

    async def close(self) -> None:
        if self._pool:
            await self._pool.close()
            logger.info("Pool de conexiones de infraestructura cerrado de forma limpia.")

    @asynccontextmanager
    async def get_connection(self):
        if not self._pool:
            raise RuntimeError("Excepción de Infraestructura: El pool de datos no se encuentra inicializado.")
        async with self._pool.acquire() as connection:
            yield connection

db_provider = DatabaseProvider(settings)

async def get_db_conn():
    """Inyector de dependencias aislado para FastAPI"""
    async with db_provider.get_connection() as conn:
        yield conn
# =======================================================================
# 3. MODELOS DE VALIDACIÓN E INMUTABILIDAD (SCHEMAS / DTOs)
# =======================================================================
T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None

class ProductoItem(BaseModel):
    producto_id: UUID
    cantidad: int = Field(..., gt=0, description="La cantidad del artículo debe ser estrictamente entera y positiva")

    class Config:
        frozen = True

class SolicitudVenta(BaseModel):
    empresa_id: int
    bodega_id: int
    medio_pago: str = "EFECTIVO"
    productos: list[ProductoItem]

    class Config:
        frozen = True

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
# =======================================================================
# 4. CAPA DE REPOSITORIOS (PERSISTENCIA Y ABSTRACCIÓN SQL)
# =======================================================================
class CatalogRepository:
    def __init__(self, conn: asyncpg.Connection):
        self.conn = conn

    async def buscar_repuestos(self, termino: str) -> List[dict]:
        query = """
        SELECT producto_id::UUID, codigo_sku, nombre_articulo,
               COALESCE(marca_fabricante, '') AS marca_fabricante,
               COALESCE(precio_venta_neto, 0)::FLOAT AS precio_venta_neto,
               COALESCE(stock_actual, 0)::INT AS stock_actual
        FROM vw_buscador_compatibilidades
        WHERE documento_indexado ILIKE $1
        LIMIT 50;
        """
        termino_limpio = f"%{termino.strip().upper()}%" if termino.strip() else "%"
        records = await self.conn.fetch(query, termino_limpio)
        return [dict(r) for r in records]
# =======================================================================
# 5. CAPA DE SERVICIOS (DOMAIN LOGIC / TRANSACTION MANAGERS)
# =======================================================================
class VentaService:
    def __init__(self, conn: asyncpg.Connection):
        self.conn = conn

    async def procesar_venta_caja(self, datos: SolicitudVenta) -> VentaDataResponse:
        # Serialización de datos de negocio
        productos_json = json.dumps([
            {"producto_id": str(item.producto_id), "cantidad": item.cantidad}
            for item in datos.productos
        ])
        
        # Bloque transaccional atómico
        async with self.conn.transaction():
            query = "SELECT * FROM fn_procesar_venta_caja_v3($1::INTEGER, $2::INTEGER, $3::VARCHAR, $4::JSONB);"
            comprobante = await self.conn.fetchrow(
                query, datos.empresa_id, datos.bodega_id, datos.medio_pago, productos_json
            )
            
            if not comprobante:
                raise asyncpg.InternalServerError("Database Engine Error: No se retornaron datos desde PL/pgSQL.")
                
            return VentaDataResponse(
                v_id=comprobante['v_id'],
                v_total=comprobante['v_total'],
                v_estado=comprobante['v_estado']
            )
# =======================================================================
# 6. CAPA TRANSVERSAL (MIDDLEWARE EXCEPCIONES Y SEGURIDAD)
# =======================================================================
async def database_exception_handler(request: Request, exc: asyncpg.PostgresError):
    error_msg = getattr(exc, 'message', str(exc))
    pgcode = getattr(exc, 'sqlstate', 'UNKNOWN')
    
    # Mapeo Senior: Clasificación exacta de errores de motor transaccional
    if "Stock insuficiente" in error_msg or pgcode == "23514":
        status_code = status.HTTP_409_CONFLICT
    elif pgcode.startswith("23"):
        status_code = status.HTTP_400_BAD_REQUEST
    else:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "data": None, "error": f"Error base de datos ({pgcode}): {error_msg}"}
    )

class SecurityGuard:
    """Clase extensible para validación de contextos de seguridad"""
    @staticmethod
    async def obtener_usuario_actual() -> dict:
        # Aquí se integrará la lógica JWT real usando settings.JWT_SECRET_KEY en el futuro
        return {"usuario_id": 1, "username": "admin", "rol": "Administrador", "activo": True}
# =======================================================================
# 7. CONTROLADORES, MIDDLEWARES Y ORQUESTACIÓN PRINCIPAL
# =======================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de recursos globales en el arranque
    await db_provider.initialize()
    yield
    # Limpieza absoluta de recursos en el apagado
    await db_provider.close()

app = FastAPI(
    title="ERP Repuestos VAL - Enterprise API", 
    version="3.1.0", 
    lifespan=lifespan
)

# Registro de controladores globales de excepciones
app.add_exception_handler(asyncpg.PostgresError, database_exception_handler)

# Configuración decoupled de políticas de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v2/ventas/procesar-caja", status_code=status.HTTP_201_CREATED, response_model=ApiResponse[VentaDataResponse], tags=["Ventas"])
async def procesar_venta_caja(
    datos: SolicitudVenta,
    conn: asyncpg.Connection = Depends(get_db_conn),
    usuario_actual: dict = Depends(SecurityGuard.obtener_usuario_actual)
):
    if usuario_actual["rol"] not in ["Administrador", "Vendedor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permisos insuficientes para esta operación.")
    if not datos.productos:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La solicitud debe incluir al menos un producto.")
        
    service = VentaService(conn)
    resultado = await service.procesar_venta_caja(datos)
    return ApiResponse(success=True, data=resultado)

@app.get("/api/v2/productos/buscar", response_model=ApiResponse[list[BusquedaProductoResponse]], tags=["Productos"])
async def buscar_repuestos_compatibles(
    termino: str = "", 
    conn: asyncpg.Connection = Depends(get_db_conn)
):
    repository = CatalogRepository(conn)
    resultados = await repository.buscar_repuestos(termino)
    return ApiResponse(success=True, data=resultados)

if __name__ == "__main__":
    import uvicorn
    # Se usa string-import format para soportar correctamente el hot-reloading en desarrollo
    uvicorn.run("__main__:app", host="127.0.0.1", port=8000, reload=True)
