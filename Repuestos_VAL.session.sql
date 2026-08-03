-- 1. Forzamos la eliminación segura si ya existe de antes como Vista Materializada
DROP MATERIALIZED VIEW IF EXISTS vw_buscador_compatibilidades CASCADE;

-- 2. Creamos la VISTA MATERIALIZADA Senior definitiva con el stock real
CREATE MATERIALIZED VIEW vw_buscador_compatibilidades AS
SELECT 
    p.id AS producto_id,                          
    p.codigo_sku,
    p.nombre_articulo,
    COALESCE(p.codigo_fabricante, '') AS marca_fabricante, 
    COALESCE(p.precio_venta, 0.00)::NUMERIC(12,2) AS precio_venta_neto,
    COALESCE(SUM(sb.stock_actual), 0)::INTEGER AS stock_actual, 
    LOWER(
        p.codigo_sku || ' ' || 
        COALESCE(p.codigo_oem, '') || ' ' || 
        COALESCE(p.codigo_fabricante, '') || ' ' || 
        COALESCE(p.codigo_barra, '') || ' ' || 
        p.nombre_articulo
    ) AS documento_indexado
FROM productos p
LEFT JOIN stock_bodegas sb ON p.id = sb.producto_id 
WHERE p.activo = true
GROUP BY p.id, p.codigo_sku, p.nombre_articulo, p.codigo_fabricante, p.precio_venta, p.codigo_oem, p.codigo_barra;

-- 3. Creamos el índice único sobre el ID
CREATE UNIQUE INDEX idx_vw_buscador_id ON vw_buscador_compatibilidades (producto_id);

-- 4. Creamos el índice de alto rendimiento sobre el texto indexado
CREATE INDEX idx_vw_buscador_documento ON vw_buscador_compatibilidades USING btree (documento_indexado);
