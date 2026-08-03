from pydantic import BaseModel, Field
from typing import Optional, List, Generic, TypeVar
from uuid import UUID

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None

class ProductoItem(BaseModel):
    producto_id: UUID
    cantidad: int = Field(..., gt=0, description="La cantidad en caja debe ser mayor a cero")

class SolicitudVenta(BaseModel):
    empresa_id: int = Field(..., description="ID numérico de la empresa emisora")
    bodega_id: int = Field(..., description="ID numérico de la sucursal de origen")
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
    cliente_id: int
    rut: str
    nombre_completo: str

class BodegaResponse(BaseModel):
    bodega_id: int
    nombre: str
