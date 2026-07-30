-- ===========================================================================
-- ARCHIVO: 001_schema.sql
-- DESCRIPCIÓN: Definición de tablas del núcleo del ERP (Módulos Base)
-- ===========================================================================

-- 1. EXTENSIONES DEL SISTEMA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ===========================================================================
-- ADICIÓN PARA AUDITORÍA, TELEMETRÍA Y CONTROL DE CONTEXTOS (Puntos 1, 4, 7)
-- ===========================================================================

-- Tipo enumerado para controlar de forma estricta los contextos de operación
CREATE TYPE tipo_contexto AS ENUM ('VENTA', 'COMPRA', 'AJUSTE', 'DEVOLUCION', 'MIGRACION');

-- Tabla maestra de auditoría para registrar intrusiones e intentos fallidos
CREATE TABLE auditoria_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de telemetría para monitorear el rendimiento de triggers y funciones lentas
CREATE TABLE logs_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    funcion_ejecutada VARCHAR(100) NOT NULL,
    duracion_ms INT NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MÓDULO BASE: CATEGORÍAS DE REPUESTOS
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MÓDULO LOGÍSTICA: BODEGAS Y UBICACIONES FÍSICAS
CREATE TABLE bodegas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE ubicaciones_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bodega_id UUID REFERENCES bodegas(id) ON DELETE CASCADE,
    pasillo VARCHAR(50),
    rack VARCHAR(50),
    nivel VARCHAR(50),
    posicion VARCHAR(50)
);

-- 4. MÓDULO SEGURIDAD: ROLES Y PERMISOS FLEXIBLES
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE permisos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

CREATE TABLE rol_permisos (
    rol_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id UUID REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

-- 5. MÓDULO CORE: CATÁLOGO DE PRODUCTOS (REPUESTOS)
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    categoria_id UUID REFERENCES categorias(id),
    codigo_sku VARCHAR(50) NOT NULL,
    codigo_oem VARCHAR(100),       
    codigo_fabricante VARCHAR(100), 
    codigo_barra VARCHAR(50),
    nombre_articulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_costo NUMERIC(12, 2) DEFAULT 0.00,
    precio_venta NUMERIC(12, 2) DEFAULT 0.00,
    peso NUMERIC(8,2),  
    alto NUMERIC(8,2),  
    ancho NUMERIC(8,2), 
    largo NUMERIC(8,2), 
    garantia_meses INT DEFAULT 3,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_sku_empresa UNIQUE (empresa_id, codigo_sku)
);

-- 6. MÓDULO LOGÍSTICA: CONTROL DE STOCK POR BODEGA
CREATE TABLE stock_bodegas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    bodega_id UUID REFERENCES bodegas(id) ON DELETE CASCADE,
    ubicacion_id UUID REFERENCES ubicaciones_productos(id),
    stock_actual INT DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    stock_maximo INT DEFAULT 100,
    CONSTRAINT unique_producto_bodega UNIQUE (producto_id, bodega_id)
);

-- 7. MÓDULO CORE: COMPATIBILIDAD AUTOMOTRIZ DETALLADA
CREATE TABLE compatibilidades_productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    marca VARCHAR(100) NOT NULL,      
    modelo VARCHAR(100) NOT NULL,     
    anio_inicio INT NOT NULL,         
    anio_fin INT NOT NULL,            
    motor VARCHAR(100),               
    cilindrada VARCHAR(50),           
    version_vehiculo VARCHAR(100),    
    combustible VARCHAR(50)           
);

-- 8. MÓDULO OPERACIONES: PROVEEDORES Y COMPRAS
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    rut VARCHAR(12) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(100),
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_rut_proveedor UNIQUE (empresa_id, rut)
);

CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    proveedor_id UUID REFERENCES proveedores(id),
    bodega_destino_id UUID REFERENCES bodegas(id),
    numero_factura VARCHAR(50),
    fecha_compra TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(12, 2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'PROCESADA'
);

CREATE TABLE detalle_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_costo_unitario NUMERIC(12, 2) NOT NULL
);

-- 9. MÓDULO OPERACIONES: VENTAS Y MOVIMIENTOS DE INVENTARIO
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    bodega_origen_id UUID REFERENCES bodegas(id),
    fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(12,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'COMPLETADA'
);

CREATE TABLE detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL
);

CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id),
    bodega_id UUID REFERENCES bodegas(id),
    tipo_movimiento VARCHAR(50) NOT NULL, 
    cantidad INT NOT NULL,
    referencia_id UUID, 
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
