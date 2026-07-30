-- ===========================================================================
-- ARCHIVO: 007_roles.sql
-- DESCRIPCIÓN: Inicialización Dinámica de Permisos y Roles sin UUIDs fijos
-- ===========================================================================

-- 1. POBLAR MATRIZ EXPANDIDA DE PERMISOS MAESTROS (22 Permisos Críticos)
INSERT INTO permisos (clave, descripcion) VALUES
-- Ventas
('ventas.crear', 'Permite procesar ventas en caja'),
('ventas.editar', 'Permite modificar borradores de preventas'),
('ventas.anular', 'Permite anular boletas/facturas emitidas'),
('ventas.devolver', 'Permite gestionar devoluciones y notas de crédito'),
-- Clientes
('clientes.crear', 'Permite registrar nuevos clientes en el sistema'),
('clientes.editar', 'Permite modificar datos de clientes y vehículos'),
-- Productos y Precios
('productos.crear', 'Permite añadir nuevos repuestos al catálogo'),
('productos.editar', 'Permite actualizar fichas técnicas de artículos'),
('productos.eliminar', 'Permite dar de baja o inactivar productos'),
('precios.modificar', 'Permite alterar la lista de precios de venta'),
-- Compras y Proveedores
('compras.crear', 'Permite generar órdenes de compra a proveedores'),
('compras.aprobar', 'Permite autorizar y recepcionar facturas de compra'),
-- Inventario y Logística
('inventario.ver', 'Permite consultar stock físico y ubicaciones'),
('inventario.ajustar', 'Permite realizar ajustes manuales de inventario'),
('inventario.transferir', 'Permite traspasar stock entre bodegas sucursales'),
-- Garantías
('garantias.crear', 'Permite emitir pólizas de garantía por repuestos dañados'),
-- Administración de Usuarios
('usuarios.crear', 'Permite registrar personal en la empresa'),
('usuarios.editar', 'Permite modificar perfiles de trabajadores'),
('roles.editar', 'Permite alterar la matriz de permisos de los roles'),
-- Business Intelligence
('reportes.ver', 'Permite descargar reportes Excel/PDF de movimientos'),
('dashboard.ver', 'Permite visualizar paneles gráficos analíticos'),
('configuracion.modificar', 'Permite cambiar datos de la empresa y sucursales'),
('auditoria.ver', 'Permite examinar el historial de modificaciones del sistema');


-- 2. CREACIÓN DE ROLES UTILIZANDO GENERACIÓN DE UUID NATAL
INSERT INTO roles (empresa_id, nombre, descripcion) VALUES
('e1111111-1111-1111-1111-111111111111', 'ADMINISTRADOR', 'Acceso total sin restricciones a todo el ERP'),
('e1111111-1111-1111-1111-111111111111', 'VENDEDOR', 'Acceso enfocado al mesón de atención, clientes y caja'),
('e1111111-1111-1111-1111-111111111111', 'BODEGUERO', 'Acceso operativo a logística, compras y almacén');


-- 3. ASIGNACIÓN MATRICIAL DINÁMICA DE PERMISOS (Evita UUIDs Manuales)

-- A. El Administrador hereda el 100% de los permisos mediante un CROSS JOIN completo
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'ADMINISTRADOR';

-- B. Asignación selectiva para el rol VENDEDOR
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON TRUE
WHERE r.nombre = 'VENDEDOR'
  AND p.clave IN (
    'ventas.crear', 'ventas.editar', 'ventas.descuento',
    'clientes.crear', 'clientes.editar', 
    'inventario.ver', 'garantias.crear', 'dashboard.ver'
  );

-- C. Asignación selectiva para el rol BODEGUERO
INSERT INTO rol_permisos (rol_id, permission_id) -- Modificar a permiso_id según tu schema unificado
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON TRUE
WHERE r.nombre = 'BODEGUERO'
  AND p.clave IN (
    'inventario.ver', 'inventario.ajustar', 'inventario.transferir',
    'compras.crear', 'compras.aprobar', 'productos.crear', 'productos.editar'
  );


-- 4. POBLAR TABLA INTERMEDIA MULTI-ROL (SEED DE PRUEBA DE ROLES)
-- Asignamos al Administrador del seed ('88888888-8888-8888-8888-888888888888') su rol correspondiente de forma dinámica
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT '88888888-8888-8888-8888-888888888888', id 
FROM roles 
WHERE nombre = 'ADMINISTRADOR';
