import os
import logging
from contextlib import contextmanager
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor, register_uuid
from dotenv import load_dotenv
from pathlib import Path

register_uuid()
logger = logging.getLogger("ERP_VAL_API")

# Localizar archivo de entorno .env en la raíz del backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(BASE_DIR / "backend" / ".env")

# POLÍTICAS DE NEGOCIO CORPORATIVAS GLOBALIZADAS
IMPUESTO_IVA = 0.19
ROLES_CAJA_PERMITIDOS = ["Administrador", "Vendedor"]
ALLOWED_ORIGINS = [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5175", "http://127.0.0.1:5175"
]

try:
    db_pool = SimpleConnectionPool(
        minconn=5, maxconn=50, host="localhost", database="repuestos_val_db",
        user="postgres", password=os.getenv("DB_PASSWORD"), port=5432,
        connect_timeout=5, options="-c client_encoding=utf8"
    )
    logger.info("Connection Pool de PostgreSQL estructurado con éxito en database/connection.py.")
except Exception as e:
    logger.critical(f"Fallo catastrófico al inicializar el pool de conexiones: {str(e)}")
    raise e

@contextmanager
def get_db_connection():
    """Garantiza el préstamo y la devolución automática de conexiones limpias al Connection Pool"""
    conn = db_pool.getconn()
    try:
        yield conn
    finally:
        db_pool.putconn(conn)
