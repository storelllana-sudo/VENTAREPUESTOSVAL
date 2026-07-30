-- ===========================================================================
-- ARCHIVO: 006_indexes.sql
-- DESCRIPCIÓN: Índices de alto rendimiento para búsquedas rápidas en el ERP
-- ===========================================================================

-- 1. CONTROL DE BÚSQUEDAS EN EL MAESTRO DE PRODUCTOS (REPUESTOS)
-- Acelera la búsqueda exacta por código interno
CREATE INDEX idx_productos_sku 
ON productos(codigo_sku);

-- Acelera las búsquedas por repuestos originales de fábrica (Crucial en mesón)
CREATE INDEX idx_productos_oem 
ON productos(codigo_oem);

-- Acelera las búsquedas cuando el bodeguero usa pistolas lectoras de barras
CREATE INDEX idx_productos_barra 
ON productos(codigo_barra);

-- Permite buscar repuestos escribiendo el nombre (Ej: "Pastillas", "Amortiguador")
CREATE INDEX idx_productos_nombre 
ON productos(nombre_articulo);


-- 2. LOGÍSTICA E INVENTARIO (STOCK EN TIEMPO REAL)
-- Optimiza las consultas cruzadas que hacen las funciones para verificar e inyectar stock por bodega
CREATE INDEX idx_stock_bodega_producto 
ON stock_bodegas(bodega_id, producto_id);


-- 3. MÓDULO AUTOMOTRIZ: CLIENTES Y VEHÍCULOS
-- Permite buscar instantáneamente la ficha de un auto al ingresar al taller o local por su placa chilena
CREATE INDEX idx_vehiculos_patente 
ON vehiculos_clientes(patente);

-- Acelera la identificación del número de chasis internacional para no errar en el repuesto alternativo
CREATE INDEX idx_vehiculos_vin 
ON vehiculos_clientes(vin);


-- 4. MATRIZ DE COMPATIBILIDAD INTEGRADA
-- El vendedor usualmente busca: Marca -> Modelo -> Año. Este índice compuesto cubre ese árbol completo.
CREATE INDEX idx_compatibilidad_arbol 
ON compatibilidades_productos(marca, modelo, anio_inicio, anio_fin);


-- 5. HISTÓRIAL Y OPERACIONES (TRAZABILIDAD)
-- Acelera la generación de reportes mensuales, cierres de caja diarios y auditorías del Kárdex
CREATE INDEX idx_movimientos_fecha 
ON movimientos_inventario(fecha);

CREATE INDEX idx_ventas_fecha 
ON ventas(fecha_venta);
