import json
import logging
from psycopg2.extras import RealDictCursor
from src.database.connection import get_db_connection

logger = logging.getLogger("ERP_VAL_API")

class LogisticaService:
    @staticmethod
    def ejecutar_venta_transaccional(datos) -> dict:
        with get_db_connection() as db:
            with db.cursor(cursor_factory=RealDictCursor) as cursor:
                query = "SELECT * FROM fn_procesar_venta_caja_v3(%s::INTEGER, %s::INTEGER, %s::VARCHAR, %s::JSONB);"
                productos_json = json.dumps([
                    {"producto_id": str(item.producto_id), "cantidad": item.cantidad}
                    for item in datos.productos
                ])
                cursor.execute(query, (datos.empresa_id, datos.bodega_id, datos.medio_pago, productos_json))
                comprobante = cursor.fetchone()
                if comprobante is None:
                    db.rollback()
                    raise Exception("Error en motor transaccional SQL: No hubo respuesta.")
                db.commit()
                return comprobante

    @staticmethod
    def buscar_repuestos_compatibles(termino: str) -> list:
        with get_db_connection() as db:
            with db.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                    SELECT producto_id::UUID AS producto_id, codigo_sku, nombre_articulo,
                           COALESCE(marca, '') AS marca_fabricante, COALESCE(precio_venta_neto, 0)::FLOAT AS precio_venta_neto,
                           COALESCE(stock_actual, 0)::INT AS stock_actual
                    FROM vw_buscador_compatibilidades WHERE documento_indexado ILIKE %s LIMIT 50;
                """
                termino_limpio = f"%{termino.strip().upper()}%" if termino.strip() else "%"
                cursor.execute(query, (termino_limpio,))
                return cursor.fetchall()

    @staticmethod
    def buscar_clientes_activos(termino: str) -> list:
        with get_db_connection() as db:
            with db.cursor(cursor_factory=RealDictCursor) as cursor:
                query = "SELECT id AS cliente_id, rut, nombre_completo FROM clientes WHERE (nombre_completo ILIKE %s OR rut ILIKE %s) AND activo = true LIMIT 10;"
                termino_limpio = f"%{termino.strip().upper()}%" if termino.strip() else "%"
                cursor.execute(query, (termino_limpio, termino_limpio))
                return cursor.fetchall()

    @staticmethod
    def listar_bodegas_activas() -> list:
        with get_db_connection() as db:
            with db.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT id AS bodega_id, nombre FROM bodegas WHERE activo = true ORDER BY nombre;")
                return cursor.fetchall()
