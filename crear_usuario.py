import os
import psycopg2
from dotenv import load_dotenv
from passlib.context import CryptContext

# 1. Cargar configuración desde el archivo .env
load_dotenv()

# 2. Configurar el contexto de hashing idéntico al de FastAPI
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def registrar_administrador():
    username = "admin_val"
    password_plana = "val_secret_2026"
    nombre_completo = "Administrador Sistema VAL"
    rol_correcto = "Administrador"  # <--- ¡Valor exacto validado por el CHECK de PostgreSQL!
    
    # Generar hash seguro único mediante bcrypt
    password_hash = pwd_context.hash(password_plana)
    
    print(" -> Generando hash seguro...")
    
    conn = None
    cursor = None
    try:
        # Conectar a PostgreSQL usando las variables individuales del .env
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT")
        )
        conn.set_client_encoding('UTF8')
        cursor = conn.cursor()
        
        # Limpiar el registro provisorio erróneo si existe
        cursor.execute("DELETE FROM usuarios WHERE username = %s;", (username,))
        
        # Insertar el usuario con todos sus parámetros correctos
        query = """
            INSERT INTO usuarios (username, password_hash, nombre_completo, rol, activo)
            VALUES (%s, %s, %s, %s, %s);
        """
        cursor.execute(query, (username, password_hash, nombre_completo, rol_correcto, True))
        
        conn.commit()
        print(f"✅ ¡Usuario '{username}' creado/actualizado con éxito con hash Bcrypt legítimo!")
        
    except Exception as e:
        if conn:
            try: conn.set_client_encoding('UTF8')
            except: pass
        print(f"❌ Error al interactuar con la base de datos: {e}")
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

if __name__ == "__main__":
    registrar_administrador()
