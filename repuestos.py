import psycopg2
from psycopg2 import extras

# Configuración de tu base de datos local en Chile
DB_CONFIG = {
    "dbname": "repuestos_val_db",
    "user": "postgres",
    "password": "aguila8450553",  # <-- Borra esto y pon la contraseña que creaste al instalar PostgreSQL
    "host": "localhost",
    "port": "5432"
}

def conectar_db():
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def registrar_venta_repuesto(empresa_id, repuesto_id, cantidad, pct_descuento, forma_pago):
    """
    Registra ventas aplicando descuentos (0% al 50%).
    Redondea automáticamente los Pesos Chilenos (CLP) y descuenta el stock.
    """
    if pct_descuento < 0 or pct_descuento > 50:
        return {"error": "Descuento inválido. Permitido entre 0% y 50%."}
        
    formas_pago_validas = ["EFECTIVO", "DEBITO", "CREDITO", "TRANSFERENCIA", "WEBPAY"]
    if forma_pago.upper() not in formas_pago_validas:
        return {"error": "Medio de pago no válido en Chile."}

    conn = conectar_db()
    if not conn:
        return {"error": "Base de datos desconectada."}
        
    cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
    
    try:
        conn.autocommit = False
        
        # Bloquear fila para evitar ventas duplicadas al mismo tiempo
        cursor.execute("SELECT precio_clp, stock FROM repuestos WHERE id = %s AND empresa_id = %s FOR UPDATE;", (repuesto_id, empresa_id))
        articulo = cursor.fetchone()
        
        if not articulo:
            conn.rollback()
            return {"error": "El repuesto no existe en el catálogo."}
            
        precio_unidad = articulo["precio_clp"]
        stock_disponible = articulo["stock"]
        
        if stock_disponible < cantidad:
            conn.rollback()
            return {"error": f"Falta de stock. Disponibles: {stock_disponible}"}
            
        # Cálculos económicos en CLP sin decimales
        subtotal = precio_unidad * cantidad
        monto_rebaja = round(subtotal * (pct_descuento / 100.0))
        total_final_clp = subtotal - monto_rebaja
        
        # Descontar stock físicamente
        cursor.execute("UPDATE repuestos SET stock = stock - %s WHERE id = %s;", (cantidad, repuesto_id))
        
        # Guardar boleta de venta
        query_boleta = """
            INSERT INTO ventas_repuestos (empresa_id, repuesto_id, cantidad, subtotal, descuento_aplicado, total_clp, forma_pago)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;
        """
        cursor.execute(query_boleta, (empresa_id, repuesto_id, cantidad, subtotal, monto_rebaja, total_final_clp, forma_pago.upper()))
        id_venta = cursor.fetchone()["id"]
        
        conn.commit()
        return {
            "status": "VENTA_APROBADA",
            "boleta_id": id_venta,
            "subtotal": subtotal,
            "descuento_pesos": monto_rebaja,
            "total_clp": total_final_clp,
            "medio_pago": forma_pago.upper()
        }
    except Exception as e:
        conn.rollback()
        return {"error": f"Error en caja: {e}"}
    finally:
        cursor.close()
        conn.close()
