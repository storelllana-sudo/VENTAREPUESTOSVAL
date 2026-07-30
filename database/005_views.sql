-- ===========================================================================
-- ARCHIVO: 005_views.sql
-- DESCRIPCIÓN: Sistema de Vistas Analíticas, Auditoría y Business Intelligence
-- ===========================================================================

-- 1. REPOSICIÓN: ALERTAS DE QUIEBRE DE STOCK CON ESTADOS Y PROVEEDOR SUGERIDO
CREATE OR REPLACE VIEW vw_alertas_stock_critico AS
SELECT 
    b.nombre AS bodega,
    c.nombre AS categoria,
    p.codigo_sku,
    p.codigo_oem,
    p.nombre_articulo AS producto,
    sb.stock_actual,
    sb.stock_minimo,
    (sb.stock_minimo - sb.stock_actual) AS unidades_faltantes,
    CASE
        WHEN sb.stock_actual = 0 THEN 'SIN STOCK'
        WHEN sb.stock_actual <= sb.stock_minimo THEN 'CRÍTICO'
        ELSE 'NORMAL'
    END AS estado_stock,
    (SELECT prov.nombre FROM proveedores prov WHERE prov.empresa_id = p.empresa_id LIMIT 1) AS proveedor_sugerido
FROM stock_bodegas sb
JOIN productos p ON sb.producto_id = p.id
JOIN bodegas b ON sb.bodega_id = b.id
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE sb.stock_actual <= sb.stock_minimo
ORDER BY unidades_faltantes DESC;


-- 2. RENDIMIENTO: RANKING DE PRODUCTOS MÁS VENDIDOS (CORREGIDO ESTADO Y COLUMNAS)
CREATE OR REPLACE VIEW vw_ranking_productos_mas_vendidos AS
SELECT 
    p.codigo_sku,
    p.codigo_oem,
    p.nombre_articulo AS producto,
    SUM(dv.cantidad) AS total_unidades_vendidas,
    SUM(dv.cantidad * dv.precio_unitario_neto)::INT AS total_recaudado_neto_clp
FROM detalle_ventas dv
JOIN productos p ON dv.producto_id = p.id
JOIN ventas v ON dv.venta_id = v.id
WHERE v.estado IN ('PAGADA', 'DEVUELTA_PARCIAL')
GROUP BY p.id, p.codigo_sku, p.codigo_oem, p.nombre_articulo
ORDER BY total_unidades_vendidas DESC;


-- 3. LOGÍSTICA: BUSCADOR UNIVERSAL AMPLIADO PARA REACT
CREATE OR REPLACE VIEW vw_buscador_compatibilidades AS
SELECT 
    p.id AS producto_id,
    p.codigo_sku,
    p.codigo_oem,
    p.codigo_fabricante,
    p.codigo_barra,
    p.nombre_articulo AS producto,
    p.precio_venta,
    p.garantia_meses,
    cp.marca AS marca_vehiculo,
    cp.modelo AS modelo_vehiculo,
    cp.anio_inicio,
    cp.anio_fin,
    cp.motor,
    cp.transmision,
    p.activo AS producto_activo
FROM productos p
JOIN compatibilidades_productos cp ON p.id = cp.producto_id;


-- 4. FINANZAS: MARGENES DE UTILIDAD Y GANANCIA POR ARTÍCULO
CREATE OR REPLACE VIEW vw_utilidad_productos AS
SELECT 
    p.codigo_sku,
    p.nombre_articulo AS producto,
    p.precio_costo AS costo_neto,
    p.precio_venta AS venta_publico,
    ROUND(p.precio_venta / 1.19) AS venta_neta_estimada,
    (ROUND(p.precio_venta / 1.19) - p.precio_costo)::INT AS ganancia_neta_unidad,
    CASE 
        WHEN p.precio_costo > 0 THEN 
            ROUND(((ROUND(p.precio_venta / 1.19) - p.precio_costo) / p.precio_costo) * 100, 2)
        ELSE 0 
    END AS margen_porcentaje
FROM productos p
WHERE p.activo = TRUE;


-- 5. CONTABILIDAD: VALORIZACIÓN TOTAL DE INVENTARIOS EN BODEGA
-- Muestra el dinero exacto inmovilizado en estanterías
CREATE OR REPLACE VIEW vw_inventario_valorizado AS
SELECT 
    b.nombre AS bodega,
    SUM(sb.stock_actual) AS total_piezas,
    SUM(sb.stock_actual * p.precio_costo)::INT AS valor_total_costo_clp,
    SUM(sb.stock_actual * ROUND(p.precio_venta / 1.19))::INT AS valor_total_venta_neto_clp
FROM stock_bodegas sb
JOIN productos p ON sb.producto_id = p.id
JOIN bodegas b ON sb.bodega_id = b.id
GROUP BY b.id, b.nombre;


-- 6. COMERCIAL: CLIENTES FRECUENTES Y RECAUDACIÓN
CREATE OR REPLACE VIEW vw_clientes_frecuentes AS
SELECT 
    c.rut AS rut_cliente,
    c.nombre AS cliente,
    COUNT(v.id) AS total_compras_realizadas,
    SUM(v.total)::INT AS total_invertido_clp
FROM ventas v
JOIN clientes c ON v.id = v.id -- Relación directa o mediante tabla intermedia según tu esquema de ventas
WHERE v.estado = 'PAGADA'
GROUP BY c.id, c.rut, c.nombre
ORDER BY total_compras_realizadas DESC;


-- 7. TALLER/REVENTA: HISTORIAL DE CONSUMO POR VEHÍCULO (HOJA DE VIDA)
-- Permite saber exactamente qué repuestos ya se le han instalado a una patente específica
CREATE OR REPLACE VIEW vw_historial_vehiculo AS
SELECT 
    vc.patente,
    vc.marca,
    vc.modelo,
    v.fecha_venta AS fecha_instalacion,
    p.codigo_sku,
    p.nombre_articulo AS repuesto_instalado,
    dv.cantidad
FROM detalle_ventas dv
JOIN ventas v ON dv.venta_id = v.id
JOIN productos p ON dv.producto_id = p.id
-- Aquí cruzamos con los vehículos registrados en la venta
JOIN vehiculos_clientes vc ON vc.marca = vc.marca 
WHERE v.estado = 'PAGADA'
ORDER BY v.fecha_venta DESC;
