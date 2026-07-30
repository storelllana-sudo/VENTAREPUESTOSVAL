-- ===========================================================================
-- ARCHIVO: 003_functions.sql (ARQUITECTURA COMPUESTA ULTRA-MODULAR V2)
-- DESCRIPCIÓN: Desacoplamiento Absoluto de Reglas, Compatibilidad y Auditoría
-- ===========================================================================

-- 1. COMPONENTE ATÓMICO: VALIDACIÓN DE REGLAS FINANCIERAS Y DE PASARELA
CREATE OR REPLACE FUNCTION fn_venta_validar_parametros(
    p_cantidad INT,
    p_porcentaje_descuento NUMERIC,
    p_medio_pago VARCHAR
) RETURNS VOID AS $$
BEGIN
    IF p_cantidad <= 0 THEN
        RAISE EXCEPTION 'Operación rechazada: La cantidad debe ser mayor a cero.';
    END IF;

    IF p_porcentaje_descuento < 0 OR p_porcentaje_descuento > 50 THEN
        RAISE EXCEPTION 'Políticas comerciales: El descuento no puede exceder el 50%%.';
    END IF;

    IF UPPER(p_medio_pago) NOT IN ('EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA') THEN
        RAISE EXCEPTION 'Pasarela financiera: El medio de pago [%] no es válido.', p_medio_pago;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- 2. COMPONENTE ATÓMICO: VERIFICACIÓN SEGURO DE CLIENTE EXISITENTE
CREATE OR REPLACE FUNCTION fn_venta_validar_cliente(
    p_cliente_id UUID,
    p_empresa_id UUID
) RETURNS VOID AS $$
DECLARE
    v_existe BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM clientes WHERE id = p_cliente_id AND empresa_id = p_empresa_id
    ) INTO v_existe;

    IF NOT v_existe THEN
        RAISE EXCEPTION 'Seguridad Comercial: El cliente especificado no existe o no pertenece a esta empresa.';
    END IF;
END;
$$ LANGUAGE plpgsql;


-- 3. COMPONENTE ATÓMICO: VERIFICACIÓN TÉCNICA DE COMPATIBILIDAD AUTOMOTRIZ (Punto 4)
CREATE OR REPLACE FUNCTION fn_venta_verificar_compatibilidad(
    p_producto_id UUID,
    p_automovil_id UUID
) RETURNS VOID AS $$
DECLARE
    v_marca_auto VARCHAR;
    v_modelo_auto VARCHAR;
    v_anio_auto INT;
    v_es_compatible BOOLEAN;
BEGIN
    -- Si no se asocia un automóvil a la venta (venta rápida de mesón), se permite pasar
    IF p_automovil_id IS NULL THEN
        RETURN;
    END IF;

    -- Obtener datos del vehículo del cliente
    SELECT marca, modelo, anio INTO v_marca_auto, v_modelo_auto, v_anio_auto
    FROM vehiculos_clientes WHERE id = p_automovil_id;

    -- Verificar si existe coincidencia exacta en la matriz de compatibilidades
    SELECT EXISTS (
        SELECT 1 FROM compatibilidades_productos
        WHERE producto_id = p_producto_id
          AND ILIKE(marca, v_marca_auto)
          AND ILIKE(modelo, v_modelo_auto)
          AND v_anio_auto BETWEEN anio_inicio AND anio_fin
    ) INTO v_es_compatible;

    IF NOT v_es_compatible THEN
        -- Lanzamos una advertencia controlada (bloqueante o informativa según política)
        RAISE EXCEPTION 'Alerta Técnica: El repuesto seleccionado NO es compatible con el vehículo del cliente (% % %).', v_marca_auto, v_modelo_auto, v_anio_auto;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- 4. COMPONENTE ATÓMICO: CONTROL DE CONCURRENCIA EN GAVETA DE STOCK
CREATE OR REPLACE FUNCTION fn_venta_verificar_y_bloquear_stock(
    p_producto_id UUID,
    p_bodega_id UUID,
    p_cantidad INT
) RETURNS VOID AS $$
DECLARE
    v_stock_actual INT;
BEGIN
    -- PESSIMISTIC LOCKING: Candado transaccional anti-condiciones de carrera
    SELECT stock_actual INTO v_stock_actual
    FROM stock_bodegas
    WHERE producto_id = p_producto_id AND bodega_id = p_bodega_id
    FOR UPDATE;

    IF v_stock_actual IS NULL OR v_stock_actual < p_cantidad THEN
        RAISE EXCEPTION 'Quiebre de stock: Saldo insuficiente en bodega (Disponible: % unidades).', COALESCE(v_stock_actual, 0);
    END IF;
END;
$$ LANGUAGE plpgsql;


-- 5. COMPONENTE ATÓMICO: ARITMÉTICA FINANCIERA (DESGLOSE IMPOSITIVO NETO/IVA)
CREATE OR REPLACE FUNCTION fn_venta_calcular_totales(
    p_precio_venta NUMERIC,
    p_cantidad INT,
    p_porcentaje_descuento NUMERIC
) RETURNS TABLE (
    neto_total INT,
    neto_unitario INT, -- Agregado para corregir el Punto 2
    descuento INT,
    iva INT,
    total INT
) AS $$
DECLARE
    v_subtotal NUMERIC := p_precio_venta * p_cantidad;
    v_descuento NUMERIC := ROUND(v_subtotal * (p_porcentaje_descuento / 100.0));
    v_total NUMERIC := ROUND(v_subtotal - v_descuento);
    v_neto_total NUMERIC := ROUND(v_total / 1.19);
    v_neto_unitario NUMERIC := ROUND((p_precio_venta - (p_precio_venta * (p_porcentaje_descuento / 100.0))) / 1.19);
BEGIN
    RETURN QUERY SELECT 
        v_neto_total::INT, 
        v_neto_unitario::INT, 
        v_descuento::INT, 
        (v_total - v_neto_total)::INT, 
        v_total::INT;
END;
$$ LANGUAGE plpgsql;


-- 6. COMPONENTE ATÓMICO: INSERCIÓN EXCLUSIVA DE DOCUMENTO (CABECERA)
CREATE OR REPLACE FUNCTION fn_venta_insertar_cabecera(
    p_empresa_id UUID, p_usuario_id UUID, p_cliente_id UUID, p_bodega_id UUID,
    p_neto INT, p_descuento INT, p_iva INT, p_total INT, p_medio_pago VARCHAR
) RETURNS TABLE (v_id UUID, v_folio INT) AS $$
DECLARE
    v_venta_id UUID;
    v_folio_generado INT;
BEGIN
    INSERT INTO ventas (
        empresa_id, usuario_id, cliente_id, bodega_origen_id, 
        subtotal_neto, descuento_aplicado, iva_19, total_clp, forma_pago, estado
    ) VALUES (
        p_empresa_id, p_usuario_id, p_cliente_id, p_bodega_id,
        p_neto, p_descuento, p_iva, p_total, UPPER(p_medio_pago), 'PAGADA'
    ) RETURNING id, COALESCE(folio, 0) INTO v_venta_id, v_folio_generado;

    -- Registrar evento exitoso en auditoría del sistema (Punto 9)
    INSERT INTO auditoria_sistema (usuario_id, accion, descripcion)
    VALUES (
        p_usuario_id,
        'EMISION_VENTA_CAJA',
        'Venta emitida exitosamente. Folio: ' || v_folio_generado || ' | Total: $' || p_total || ' CLP | Bodega ID: ' || p_bodega_id
    );

    RETURN QUERY SELECT v_venta_id, v_folio_generado;
END;
$$ LANGUAGE plpgsql;


-- ===========================================================================
-- ORQUESTADOR CENTRAL EVOLUCIONADO: FLUJO DE NEGOCIO SECO E INTELIGENTE
-- ===========================================================================
CREATE OR REPLACE FUNCTION fn_procesar_venta_caja_v2(
    p_cliente_id UUID,
    p_automovil_id UUID,        -- Vinculado activamente para validar compatibilidad (Punto 1 y 4)
    p_bodega_id UUID,           -- Recibido explícitamente para evitar arbitrariedades (Punto 3)
    p_cajero_id UUID,
    p_producto_id UUID,
    p_cantidad INT,
    p_porcentaje_descuento NUMERIC,
    p_medio_pago VARCHAR
)
RETURNS TABLE (
    boleta_id UUID,
    folio_boleta INT,
    neto INT,
    descuento INT,
    iva INT,
    total_boleta_clp INT
) AS $$
DECLARE
    v_precio_venta NUMERIC;
    v_empresa_id UUID;
    v_financiero RECORD;
    v_documento RECORD;
BEGIN
    -- 1. Validar parámetros financieros base
    PERFORM fn_venta_validar_parametros(p_cantidad, p_porcentaje_descuento, p_medio_pago);

    -- 2. Configurar variables de entorno seguras para los Triggers del Kárdex
    PERFORM set_config('app.current_usuario_id', p_cajero_id::TEXT, true);
    PERFORM set_config('app.operation_context', 'VENTA', true);

    -- 3. Consultar datos maestros del repuestos asegurando que esté ACTIVO (Punto 8)
    SELECT precio_venta, empresa_id INTO v_precio_venta, v_empresa_id 
    FROM productos 
    WHERE id = p_producto_id AND activo = TRUE;
    
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Catálogo: El repuesto solicitado no existe o fue dado de baja del sistema.'; 
    END IF;

    -- 4. Validar existencia y consistencia del cliente corporativo (Punto 7)
    PERFORM fn_venta_validar_cliente(p_cliente_id, v_empresa_id);

    -- 5. Ejecutar motor de compatibilidad automotriz (Punto 4)
    PERFORM fn_venta_verificar_compatibilidad(p_producto_id, p_automovil_id);

    -- 6. Congelar y asegurar stock contra condiciones de carrera concurrentes
    PERFORM fn_venta_verificar_y_bloquear_stock(p_producto_id, p_bodega_id, p_cantidad);

    -- 7. Procesar aritmética impositiva desglosada
    SELECT * INTO v_financiero FROM fn_venta_calcular_totales(v_precio_venta, p_cantidad, p_porcentaje_descuento);

    -- 8. Decrementar stock físico (Esto detonará transparentemente tus triggers de Kárdex y logs)
    UPDATE stock_bodegas 
    SET stock_actual = stock_actual - p_cantidad 
    WHERE producto_id = p_producto_id AND bodega_id = p_bodega_id;

    -- 9. Registrar documento fiscal de venta (Cabecera + Auditoría integrada)
    SELECT * INTO v_documento FROM fn_venta_insertar_cabecera(
        v_empresa_id, p_cajero_id, p_cliente_id, p_bodega_id,
        v_financiero.neto_total, v_financiero.descuento, v_financiero.iva, v_financiero.total, p_medio_pago
    );

    -- 10. Registrar línea del documento aplicando el PRECIO UNITARIO NETO REAL (Corregido Punto 2)
    INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario_neto)
    VALUES (v_documento.v_id, p_producto_id, p_cantidad, v_financiero.neto_unitario);

    -- 11. Liberación de variables de sesión en éxito
    PERFORM set_config('app.current_usuario_id', '', true);
    PERFORM set_config('app.operation_context', '', true);

    RETURN QUERY SELECT 
        v_documento.v_id, v_documento.v_folio, 
        v_financiero.neto_total, v_financiero.descuento, v_financiero.iva, v_financiero.total;

EXCEPTION WHEN OTHERS THEN
    -- Mitigación residual obligatoria en caso de rollback
    PERFORM set_config('app.current_usuario_id', '', true);
    PERFORM set_config('app.operation_context', '', true);
    RAISE;
END;
$$ LANGUAGE plpgsql;
