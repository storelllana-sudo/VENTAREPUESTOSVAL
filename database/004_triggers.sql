-- ===========================================================================
-- ARCHIVO: 004_triggers.sql (ARQUITECTURA MODULAR ULTRA-PERFORMANTE)
-- DESCRIPCIÓN: Desacoplamiento de Lógica Operativa mediante Funciones Atómicas
-- ===========================================================================

-- SUB-FUNCIÓN 1: VALIDACIÓN EXCLUSIVA DE PERMISOS Y AUDITORÍA DE INTRUSIONES
CREATE OR REPLACE FUNCTION fn_logistica_validar_permiso(
    p_usuario_id UUID, 
    p_old_stock INT, 
    p_new_stock INT, 
    p_producto_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tiene_permiso BOOLEAN;
    v_ip_cliente VARCHAR(50) := inet_client_addr()::VARCHAR; 
    v_app_cliente TEXT := current_setting('application_name', true); 
BEGIN
    -- Validamos si el usuario cuenta con el permiso requerido en la matriz multi-rol
    SELECT EXISTS (
        SELECT 1 FROM usuario_roles ur
        JOIN rol_permisos rp ON ur.rol_id = rp.rol_id
        JOIN permisos p ON rp.permiso_id = p.id
        WHERE ur.usuario_id = p_usuario_id AND p.clave = 'inventario.ajustar'
    ) INTO v_tiene_permiso;

    -- Si no cuenta con el permiso, registramos la intrusión de forma aislada
    IF NOT v_tiene_permiso THEN
        INSERT INTO auditoria_sistema (usuario_id, accion, descripcion)
        VALUES (
            p_usuario_id,
            'INTENTO_FALLIDO_AJUSTE_STOCK',
            E'Intrusión desde IP: ' || COALESCE(v_ip_cliente, 'Local/Directo') || ' [' || COALESCE(v_app_cliente, 'Desconocido') || E']\n' ||
            'Producto ID: ' || p_producto_id || E'\n' ||
            'Intento de Cambio Manual: ' || p_old_stock || ' -> ' || p_new_stock
        );
    END IF;
    RETURN v_tiene_permiso;
END;
$$ LANGUAGE plpgsql;


-- SUB-FUNCIÓN 2: REGISTRO EXCLUSIVO DE MOVIMIENTOS EN KÁRDEX
CREATE OR REPLACE FUNCTION fn_logistica_registrar_movimiento(
    p_producto_id UUID, 
    p_bodega_id UUID, 
    p_cantidad_dif INT, 
    p_old_stock INT, 
    p_new_stock INT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO movimientos_inventario (
        producto_id, bodega_id, tipo_movimiento, cantidad, referencia_id, detalle_adicional
    ) VALUES (
        p_producto_id, p_bodega_id, 'AJUSTE_MANUAL', p_cantidad_dif, NULL,
        'Ajuste manual de almacén. Historial físico: ' || p_old_stock || ' -> ' || p_new_stock
    );
END;
$$ LANGUAGE plpgsql;


-- ORQUESTADOR PRINCIPAL: EL TRIGGER (SÓLO EVALÚA CONTEXTO Y DERIVA RESPONSABILIDADES)
CREATE OR REPLACE FUNCTION fn_trg_control_y_auditoria_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_usuario_id UUID;
    v_contexto_str VARCHAR(50);
    v_contexto tipo_contexto; 
    v_tiempo_inicio TIMESTAMP := clock_timestamp();
BEGIN
    -- OPTIMIZACIÓN: Salida inmediata si no hay alteración numérica real
    IF NEW.stock_actual = OLD.stock_actual THEN
        RETURN NEW;
    END IF;

    -- VALIDACIÓN INDUSTRIAL: Blindaje contra stock negativo
    IF NEW.stock_actual < 0 THEN
        RAISE EXCEPTION 'Error logístico: La operación dejaría la bodega con saldo negativo (% unidades).', NEW.stock_actual;
    END IF;

    -- Capturar variables de sesión del entorno de la aplicación
    BEGIN
        v_usuario_id   := NULLIF(current_setting('app.current_usuario_id', true), '')::UUID;
        v_contexto_str := NULLIF(current_setting('app.operation_context', true), '');
        
        IF v_contexto_str IS NOT NULL THEN
            v_contexto := v_contexto_str::tipo_contexto;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_usuario_id := NULL;
        v_contexto   := NULL; 
    END;

    -- CASE DE CONTEXTOS OPERATIVOS: Control granular según el ENUM seguro
    CASE v_contexto
        WHEN 'VENTA', 'COMPRA', 'DEVOLUCION', 'MIGRACION' THEN
            -- Operaciones automatizadas por el sistema: Pasan directo sin validar permisos manuales
            NULL; 
        ELSE
            -- Si el contexto es 'AJUSTE' o no está definido, se considera un cambio manual directo
            IF v_usuario_id IS NOT NULL THEN
                -- Llamar a la función atómica de verificación de permisos
                IF NOT fn_logistica_validar_permiso(v_usuario_id, OLD.stock_actual, NEW.stock_actual, NEW.producto_id) THEN
                    RAISE EXCEPTION 'Acceso denegado: Su usuario no cuenta con el privilegio institucional [inventario.ajustar].';
                END IF;

                -- Llamar a la función atómica de registro en kárdex
                PERFORM fn_logistica_registrar_movimiento(
                    NEW.producto_id, NEW.bodega_id, (NEW.stock_actual - OLD.stock_actual), OLD.stock_actual, NEW.stock_actual
                );
            END IF;
    END CASE;

    -- REGISTRO DE RENDIMIENTO: Monitorear si la ejecución del trigger se vuelve lenta
    INSERT INTO logs_sistema (usuario_id, funcion_ejecutada, duracion_ms)
    VALUES (v_usuario_id, 'trg_control_y_auditoria_stock', (EXTRACT(EPOCH FROM (clock_timestamp() - v_tiempo_inicio)) * 1000)::INT);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ASOCIACIÓN DEL TRIGGER ORQUESTADOR
DROP TRIGGER IF EXISTS trg_antes_actualizar_stock_manual ON stock_bodegas;
CREATE TRIGGER trg_antes_actualizar_stock_manual
BEFORE UPDATE OF stock_actual ON stock_bodegas
FOR EACH ROW
EXECUTE FUNCTION fn_trg_control_y_auditoria_stock();
