from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from psycopg2.extras import RealDictCursor
from src.database.connection import ROLES_CAJA_PERMITIDOS, get_db_connection
from src.models.schemas import ApiResponse, SolicitudVenta, VentaDataResponse, BusquedaProductoResponse, BusquedaClienteResponse, BodegaResponse
from src.middleware.auth import verificar_password, crear_token_acceso, obtener_usuario_actual
from src.services.logistica import LogisticaService

auth_router = APIRouter(prefix="/api/v2/auth", tags=["Seguridad"])
operaciones_router = APIRouter(prefix="/api/v2", tags=["Operaciones ERP"])

@auth_router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with get_db_connection() as db:
        with db.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM usuarios WHERE username = %s;", (form_data.username,))
            usuario = cursor.fetchone()
            if not usuario or not verificar_password(form_data.password, usuario["password_hash"]):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Nombre de usuario o contraseña incorrectos.")
            if not usuario["activo"]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="El usuario se encuentra inactivo.")
            token_jwt = crear_token_acceso(data={"sub": usuario["username"], "rol": usuario["rol"]})
            return {"access_token": token_jwt, "token_type": "bearer"}

@operaciones_router.post("/ventas/procesar-caja", response_model=ApiResponse[VentaDataResponse], status_code=status.HTTP_201_CREATED)
def procesar_venta_caja(datos: SolicitudVenta, usuario_actual: dict = Depends(obtener_usuario_actual)):
    if usuario_actual["rol"] not in ROLES_CAJA_PERMITIDOS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permisos insuficientes para facturar en caja.")
    if not datos.productos:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La lista de productos no puede estar vacía.")
    try:
        comprobante = LogisticaService.ejecutar_venta_transaccional(datos)
        return {"success": True, "data": {"v_id": comprobante.get('v_id'), "v_total": comprobante.get('v_total'), "v_estado": comprobante.get('v_estado')}, "error": None}
    except Exception as e:
        error_msg = str(e)
        if "Stock insuficiente" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Fallo en transacción: {error_msg}")

@operaciones_router.get("/productos/buscar", response_model=ApiResponse[List[BusquedaProductoResponse]])
def buscar_repuestos(termino: str = ""):
    try:
        resultados = LogisticaService.buscar_repuestos_compatibles(termino)
        return {"success": True, "data": resultados, "error": None}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@operaciones_router.get("/clientes/buscar", response_model=ApiResponse[List[BusquedaClienteResponse]])
def buscar_clientes(termino: str = "", usuario_actual: dict = Depends(obtener_usuario_actual)):
    try:
        resultados = LogisticaService.buscar_clientes_activos(termino)
        return {"success": True, "data": resultados, "error": None}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@operaciones_router.get("/bodegas", response_model=ApiResponse[List[BodegaResponse]])
def listar_bodegas(usuario_actual: dict = Depends(obtener_usuario_actual)):
    try:
        resultados = LogisticaService.listar_bodegas_activas()
        return {"success": True, "data": resultados, "error": None}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
