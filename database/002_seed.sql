-- ===========================================================================
-- ARCHIVO: 002_seed.sql
-- DESCRIPCIÓN: Set de Datos Iniciales de Alta Densidad (Entorno Chile)
-- ===========================================================================

-- 1. INFRAESTRUCTURA DE EMPRESA Y USUARIOS CORRESPONSALES
INSERT INTO empresas (id, rut_empresa, razon_social, giro, direccion)
VALUES (
    'e1111111-1111-1111-1111-111111111111',
    '76888888-1',
    'Repuestos VAL SpA',
    'Venta de Repuestos Automotrices',
    'Av. 10 de Julio 1234, Santiago'
);

INSERT INTO usuarios (id, empresa_id, nombre_usuario, correo, rol, activo)
VALUES (
    '88888888-8888-8888-8888-888888888888', -- ID de Cajero/Admin de tu función
    'e1111111-1111-1111-1111-111111111111',
    'Administrador Central',
    'admin@repuestosval.cl',
    'ADMINISTRADOR',
    TRUE
);

-- 2. INFRAESTRUCTURA LOGÍSTICA: BODEGAS Y UBICACIONES
INSERT INTO bodegas (id, empresa_id, nombre, direccion, activo)
VALUES 
('b0de6a11-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Casa Matriz - 10 de Julio', 'Av. 10 de Julio 1234, Santiago', TRUE),
('b0de6a22-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'Bodega Logística Quilicura', 'Av. Américo Vespucio 456, Quilicura', TRUE);

INSERT INTO ubicaciones_productos (id, bodega_id, pasillo, rack, nivel, posicion)
VALUES 
('u-frenos-1', 'b0de6a11-1111-1111-1111-111111111111', 'Pasillo A', 'Rack 01', 'Nivel 1', 'Gaveta A'),
('u-motor-1', 'b0de6a11-1111-1111-1111-111111111111', 'Pasillo B', 'Rack 04', 'Nivel 3', 'Espacio Libre');

-- 3. LAS 13 CATEGORÍAS CRÍTICAS DEL ÁRBOL AUTOMOTRIZ
INSERT INTO categorias (id, empresa_id, nombre, descripcion)
VALUES 
('cat-01', 'e1111111-1111-1111-1111-111111111111', 'Motor', 'Componentes internos de motor, empaquetaduras y distribución'),
('cat-02', 'e1111111-1111-1111-1111-111111111111', 'Frenos', 'Discos, pastillas, tambores, balatas y cilindros'),
('cat-03', 'e1111111-1111-1111-1111-111111111111', 'Suspensión', 'Amortiguadores, espirales, cazoletas y bandejas'),
('cat-04', 'e1111111-1111-1111-1111-111111111111', 'Dirección', 'Terminales de dirección, homocinéticas y cremalleras'),
('cat-05', 'e1111111-1111-1111-1111-111111111111', 'Encendido', 'Bujías, bobinas, cables de bujía y calentadores'),
('cat-06', 'e1111111-1111-1111-1111-111111111111', 'Lubricación', 'Bombas de aceite, cárter y enfriadores'),
('cat-07', 'e1111111-1111-1111-1111-111111111111', 'Refrigeración', 'Radiadores, bombas de agua, termostatos y depósitos'),
('cat-08', 'e1111111-1111-1111-1111-111111111111', 'Electricidad', 'Alternadores, motores de partida y fusibles'),
('cat-09', 'e1111111-1111-1111-1111-111111111111', 'Sensores', 'Sensores MAF, CKP, Oxígeno, ABS y Presión'),
('cat-10', 'e1111111-1111-1111-1111-111111111111', 'Iluminación', 'Focos delanteros, focos traseros, ampolletas y ópticos'),
('cat-11', 'e1111111-1111-1111-1111-111111111111', 'Filtros', 'Filtros de aceite, aire, cabina y combustible de mantenimiento'),
('cat-12', 'e1111111-1111-1111-1111-111111111111', 'Aceites', 'Aceites de motor sintéticos, semisintéticos y fluidos de transmisión'),
('cat-13', 'e1111111-1111-1111-1111-111111111111', 'Accesorios', 'Plumillas, refrigerantes, aditivos y pernos de rueda');

-- 4. CLIENTES Y VEHÍCULOS (Formatos de patentes y VIN chilenos)
INSERT INTO clientes (id, empresa_id, rut, nombre, email, telefono)
VALUES 
('cli-01', 'e1111111-1111-1111-1111-111111111111', '12345678-9', 'Juan Pérez', 'juan.perez@gmail.com', '+56911112222'),
('cli-02', 'e1111111-1111-1111-1111-111111111111', '15678912-3', 'Pedro Soto', 'pedro.soto@outlook.com', '+56933334444'),
('cli-03', 'e1111111-1111-1111-1111-111111111111', '76456789-2', 'Empresa Transportes Chile S.A.', 'logistica@transchile.cl', '+56225556666');

INSERT INTO vehiculos_clientes (id, cliente_id, patente, vin, marca, modelo, anio, motor, transmision)
VALUES 
('veh-01', 'cli-01', 'KPLW23', '93HXXXXXXK123456', 'Toyota', 'Corolla', 2019, '1ZR-FE', 'MANUAL'),
('veh-02', 'cli-02', 'RSTV88', '8A1XXXXXXJ789101', 'Hyundai', 'Accent', 2021, 'G4LC', 'AUTOMÁTICA'),
('veh-03', 'cli-03', 'GHJK12', '1G1XXXXXXF246810', 'Chevrolet', 'Sail', 2018, 'LCU', 'MANUAL');

-- 5. MAESTRO DE PRODUCTOS (Casos de repuestos comunes multimarca)
INSERT INTO productos (id, empresa_id, categoria_id, codigo_sku, codigo_oem, codigo_fabricante, codigo_barra, nombre_articulo, precio_costo, precio_venta, garantia_meses, imagen_url, codigo_qr)
VALUES 
-- Producto de tu prueba en pgAdmin (Toyota Corolla)
('a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cat-02', 'PAST-TOY-COR-01', '04465-12610', 'PN-1845', '7891234567890', 'Pastillas de Freno Delanteras Toyota Corolla', 45000.00, 81000.00, 6, 'https://repuestosval.cl', 'QR-PAST-TOY-01'),
-- Hyundai Accent
('prod-02', 'e1111111-1111-1111-1111-111111111111', 'cat-11', 'FIL-ACE-HYU-05', '26300-35505', 'W811/80', '7891234567891', 'Filtro de Aceite Hyundai Accent / Kia Rio', 5500.00, 12000.00, 3, 'https://repuestosval.cl', 'QR-FIL-HYU-05'),
-- Chevrolet Sail
('prod-03', 'e1111111-1111-1111-1111-111111111111', 'cat-03', 'AMOR-DEL-CHEV-SAIL', '95943141', '3330021', '7891234567892', 'Amortiguador Delantero Derecho Chevrolet Sail', 28000.00, 49990.00, 12, 'https://repuestosval.cl', 'QR-AMOR-CHEV-03'),
-- Nissan Versa
('prod-04', 'e1111111-1111-1111-1111-111111111111', 'cat-05', 'BUJ-IRID-NIS-VER', '22401-1KT1B', 'DF6H-11B', '7891234567893', 'Bujía de Iridio Nissan Versa / March (Set de 4)', 18000.00, 35000.00, 6, 'https://repuestosval.cl', 'QR-BUJ-NIS-04');

-- 6. MATRIZ DE COMPATIBILIDAD CON TRANSMISIÓN INCLUIDA
INSERT INTO compatibilidades_productos (producto_id, marca, modelo, anio_inicio, anio_fin, motor, cilindrada, version_vehiculo, combustible, transmision)
VALUES 
('a1111111-1111-1111-1111-111111111111', 'Toyota', 'Corolla', 2019, 2024, '1ZR-FE', '1.6L', 'GLI', 'Gasolina', 'MANUAL'),
('a1111111-1111-1111-1111-111111111111', 'Toyota', 'Corolla', 2019, 2024, '2ZR-FE', '1.8L', 'SE-G', 'Gasolina', 'CVT'),
('prod-02', 'Hyundai', 'Accent', 2017, 2023, 'G4LC', '1.4L', 'HCI', 'Gasolina', 'AUTOMÁTICA'),
('prod-03', 'Chevrolet', 'Sail', 2015, 2021, 'LCU', '1.5L', 'LS / LT', 'Gasolina', 'MANUAL');

-- 7. REGISTRO DE STOCK INICIAL Y SU RESPECTIVA AUDITORÍA EN KÁRDEX
-- Carga directa del inventario inicial
INSERT INTO stock_bodegas (producto_id, bodega_id, ubicacion_id, stock_actual, stock_minimo, stock_maximo)
VALUES 
('a1111111-1111-1111-1111-111111111111', 'b0de6a11-1111-1111-1111-111111111111', 'u-frenos-1', 50, 5, 100),
('prod-02', 'b0de6a11-1111-1111-1111-111111111111', NULL, 150, 10, 300),
('prod-03', 'b0de6a11-1111-1111-1111-111111111111', 'u-motor-1', 30, 4, 80);

-- Trazabilidad obligatoria: Tienen que existir movimientos que justifiquen el stock inicial
INSERT INTO movimientos_inventario (producto_id, bodega_id, tipo_movimiento, cantidad, referencia_id, detalle_adicional)
VALUES 
('a1111111-1111-1111-1111-111111111111', 'b0de6a11-1111-1111-1111-111111111111', 'INGRESO_CARGA_INICIAL', 50, NULL, 'Carga inicial del sistema de inventarios'),
('prod-02', 'b0de6a11-1111-1111-1111-111111111111', 'INGRESO_CARGA_INICIAL', 150, NULL, 'Carga inicial del sistema de inventarios'),
('prod-03', 'b0de6a11-1111-1111-1111-111111111111', 'INGRESO_CARGA_INICIAL', 30, NULL, 'Carga inicial del sistema de inventarios');

-- 8. PROVEEDORES Y FLUJO DE COMPRAS HISTÓRICAS COMPLETO
INSERT INTO proveedores (id, empresa_id, rut, nombre, telefono, email, direccion)
VALUES ('prov-01', 'e1111111-1111-1111-1111-111111111111', '76123456-K', 'Distribuidora Internacional RepuestosVal SpA', '+56987654321', 'importaciones@repuestosval.cl', 'Av. Brasil 456, Santiago');

-- Registro de factura de adquisición que incrementa bodegas
INSERT INTO compras (id, empresa_id, proveedor_id, bodega_destino_id, numero_factura, total, estado)
VALUES ('comp-factura-101', 'e1111111-1111-1111-1111-111111111111', 'prov-01', 'b0de6a11-1111-1111-1111-111111111111', 'FACT-10144', 36000.00, 'PROCESADA');

-- Detalle que conecta Proveedor -> Compra -> Producto
INSERT INTO detalle_compras (compra_id, producto_id, cantidad, precio_costo_unitario)
VALUES ('comp-factura-101', 'prod-04', 2, 18000.00); 

-- El stock del producto 4 se actualiza de forma transparente por los triggers generados.
