-- ===========================================================================
-- ARCHIVO: tests/001_test_ventas.sql
-- DESCRIPCIÓN: Suite de Pruebas Automatizadas para el Motor de Ventas y Caja
-- NOTA: Se ejecuta dentro de una transacción con ROLLBACK para no alterar la BD.
-- ===========================================================================

BEGIN;

-- ===========================================================================
-- CONFIGURACIÓN DEL ENTORNO DE PRUEBA (IDs del Seed de datos)
-- ===========================================================================
DO $$
DECLARE
    v_cliente_id      UUID := 'cli-01';
    v_auto_id         UUID := 'veh-01'; -- Toyota Corolla 2019 (Compatible)
    v_auto_incomp     UUID := 'veh-02'; -- Hyundai Accent (Incompatible)
    v_cajero_id       UUID := '88888888-8888-8888-8888-888888888888';
    v_bodega_id       UUID := 'b0de6a11-1111-1111-1111-111111111111';
    v_producto_id     UUID := 'a1111111-1111-1111-1111-111111111111'; -- Pastillas Corolla (Stock: 50)
    v_prod_inactivo   UUID := 'prod-inactivo-test';
    v_resultado       RECORD;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'INICIANDO SUITE DE PRUEBAS: MOTOR DE VENTAS V2';
    RAISE NOTICE '==================================================';

    -- Preparar producto inactivo para el Caso 5
    INSERT INTO productos (id, empresa_id, codigo_sku, nombre_articulo, precio_venta, activo)
    VALUES (v_prod_inactivo, 'e1111111-1111-1111-1111-111111111111', 'TEST-INACTIVO', 'Filtro Dado de Baja', 10000, FALSE);


    -- -----------------------------------------------------------------------
    -- CASO 1: VENTA NORMAL EXITOSA (Camino feliz)
    -- -----------------------------------------------------------------------
    BEGIN
        RAISE NOTICE 'Ejecutando Caso 1: Venta normal con vehículo compatible...';
        
        SELECT * INTO v_resultado FROM fn_procesar_venta_caja_v2(
            v_cliente_id, v_auto_id, v_bodega_id, v_cajero_id, v_producto_id, 
            2, -- Cantidad
            10.0, -- Descuento 10%
            'DEBITO'
        );
        
        -- Verificar que se hayan calculado bien los totales
        IF v_resultado.total_boleta_clp = 145800 THEN -- (81000 * 2) - 10% desc = 145.800
            RAISE NOTICE '✅ CASO 1 PASADO: Venta procesada y montos correctos ($%).', v_resultado.total_boleta_clp;
        ELSE
            RAISE EXCEPTION '❌ CASO 1 FALLÓ: Cálculo incorrecto de totales. Recibido: %', v_resultado.total_boleta_clp;
        END IF;
    END;


    -- -----------------------------------------------------------------------
    -- CASO 2: STOCK INSUFICIENTE (Validación logística)
    -- -----------------------------------------------------------------------
    BEGIN
        RAISE NOTICE 'Ejecutando Caso 2: Intento de venta sobrepasando el stock...';
        
        SELECT * INTO v_resultado FROM fn_procesar_venta_caja_v2(
            v_cliente_id, v_auto_id, v_bodega_id, v_cajero_id, v_producto_id, 
            100, -- Cantidad mayor a las 48 unidades restantes
            0.0, 'EFECTIVO'
        );
        
        RAISE EXCEPTION '❌ CASO 2 FALLÓ: El sistema permitió vender sin stock disponible.';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%Quiebre de stock%' THEN
            RAISE NOTICE '✅ CASO 2 PASADO: Sistema bloqueó la venta por falta de stock de forma correcta.';
        ELSE
            RAISE EXCEPTION '❌ CASO 2 FALLÓ: Se lanzó un error inesperado: %', SQLERRM;
        END IF;
    END;


    -- -----------------------------------------------------------------------
    -- CASO 3: DESCUENTO INVÁLIDO (Regla comercial)
    -- -----------------------------------------------------------------------
    BEGIN
        RAISE NOTICE 'Ejecutando Caso 3: Intento de aplicar descuento excesivo (60%%)...';
        
        SELECT * INTO v_resultado FROM fn_procesar_venta_caja_v2(
            v_cliente_id, v_auto_id, v_bodega_id, v_cajero_id, v_producto_id, 
            1, 60.0, 'EFECTIVO'
        );
        
        RAISE EXCEPTION '❌ CASO 3 FALLÓ: El sistema permitió un descuento superior al límite del 50%%.';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%Políticas comerciales%' THEN
            RAISE NOTICE '✅ CASO 3 PASADO: Descuento excesivo rechazado correctamente.';
        ELSE
            RAISE EXCEPTION '❌ CASO 3 FALLÓ: Se lanzó un error inesperado: %', SQLERRM;
        END IF;
    END;


    -- -----------------------------------------------------------------------
    -- CASO 4: ERROR DE COMPATIBILIDAD (Filtro técnico automotriz)
    -- -----------------------------------------------------------------------
    BEGIN
        RAISE NOTICE 'Ejecutando Caso 4: Intento de venta de repuesto incompatible con el auto...';
        
        SELECT * INTO v_resultado FROM fn_procesar_venta_caja_v2(
            v_cliente_id, 
            v_auto_incomp, -- Hyundai Accent con Pastillas de Corolla
            v_bodega_id, v_cajero_id, v_producto_id, 
            1, 0.0, 'TRANSFERENCIA'
        );
        
        RAISE EXCEPTION '❌ CASO 4 FALLÓ: El sistema permitió vender una pieza incompatible sin advertencia.';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%Alerta Técnica%' THEN
            RAISE NOTICE '✅ CASO 4 PASADO: Motor de compatibilidad bloqueó la venta incompatible exitosamente.';
        ELSE
            RAISE EXCEPTION '❌ CASO 4 FALLÓ: Se lanzó un error inesperado: %', SQLERRM;
        END IF;
    END;


    -- -----------------------------------------------------------------------
    -- CASO 5: PRODUCTO DADO DE BAJA (Gobernanza de catálogo)
    -- -----------------------------------------------------------------------
    BEGIN
        RAISE NOTICE 'Ejecutando Caso 5: Intento de venta de un producto inactivo...';
        
        SELECT * INTO v_resultado FROM fn_procesar_venta_caja_v2(
            v_cliente_id, v_auto_id, v_bodega_id, v_cajero_id, v_prod_inactivo, 
            1, 0.0, 'EFECTIVO'
        );
        
        RAISE EXCEPTION '❌ CASO 5 FALLÓ: El sistema permitió vender un artículo inactivo.';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%Catálogo: El repuesto solicitado no existe%' THEN
            RAISE NOTICE '✅ CASO 5 PASADO: Bloqueo de producto dado de baja ejecutado de forma correcta.';
        ELSE
            RAISE EXCEPTION '❌ CASO 5 FALLÓ: Se lanzó un error inesperado: %', SQLERRM;
        END IF;
    END;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'SUITE COMPLETADA: TODOS LOS CASOS CRÍTICOS PASARON';
    RAISE NOTICE '==================================================';

END $$;

-- Hacemos ROLLBACK obligatorio para limpiar la base de datos de pruebas
ROLLBACK;
