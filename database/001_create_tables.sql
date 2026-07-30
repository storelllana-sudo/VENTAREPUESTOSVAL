-- Habilitar extensión para generar IDs seguros automáticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE EMPRESAS CLIENTES (Permite que tu software sea SaaS multi-empresa)
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_empresa VARCHAR(12) NOT NULL UNIQUE,
    razon_social VARCHAR(150) NOT NULL,
    giro VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rut_chileno_formato CHECK (rut_empresa ~ '^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$')
);

-- 2. TABLA DE PROVEEDORES DE REPUESTOS
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    rut_proveedor VARCHAR(12) NOT NULL,
    nombre_proveedor VARCHAR(150) NOT NULL,
    contacto_nombre VARCHAR(100),
    email_contacto VARCHAR(100),
    CONSTRAINT unq_proveedor_por_empresa UNIQUE(empresa_id, rut_proveedor)
);

-- 3. TABLA DE CATEGORÍAS DE REPUESTOS
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre_categoria VARCHAR(100) NOT NULL,
    CONSTRAINT unq_categoria_por_empresa UNIQUE(empresa_id, nombre_categoria)
);

-- 4. TABLA MAESTRA DE REPUESTOS (Control estricto de Stock y SKU)
CREATE TABLE repuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    codigo_sku VARCHAR(50) NOT NULL,
    codigo_barra VARCHAR(50),
    nombre_pieza VARCHAR(150) NOT NULL,
    marca_repuesto VARCHAR(100) NOT NULL, -- Ej: Brembo, Bosch, Monrroe
    modelo_auto_compatible VARCHAR(200),  -- Modelos y años compatibles
    precio_costo INT NOT NULL DEFAULT 0,  -- Para calcular ganancias reales
    precio_venta_clp INT NOT NULL,        -- Sin decimales para el mercado nacional
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,  -- Alerta para reponer inventario
    ubicacion_bodega VARCHAR(100),       -- Ej: Pasillo B - Estante 4
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_sku_por_empresa UNIQUE (empresa_id, codigo_sku),
    CONSTRAINT check_precios CHECK (precio_venta_clp >= precio_costo),
    CONSTRAINT check_stock_positivo CHECK (stock_actual >= 0)
);

-- 5. TABLA DE VENTAS / DETALLE DE CAJA
CREATE TABLE ventas_repuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    folio_boleta SERIAL, -- Número correlativo automático para la PyME
    subtotal INT NOT NULL,
    descuento_aplicado INT NOT NULL DEFAULT 0,
    total_clp INT NOT NULL,
    forma_pago VARCHAR(30) NOT NULL,
    fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_descuento_limite CHECK (descuento_aplicado >= 0),
    CONSTRAINT check_forma_pago_valida CHECK (forma_pago IN ('EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA', 'WEBPAY'))
);

-- 6. TABLA INTERMEDIA: DETALLE DE LA VENTA (Maneja múltiples repuestos por boleta)
CREATE TABLE detalles_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas_repuestos(id) ON DELETE CASCADE,
    repuesto_id UUID NOT NULL REFERENCES repuestos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario_clp INT NOT NULL
);
