import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api/axiosConfig';

// Importación de submódulos atómicos con arquitectura limpia corporativa
import ToastNotification from '../components/ToastNotification';
import ToolBar from '../components/ToolBar';
import BuscadorRepuestos from '../components/BuscadorRepuestos';
import TablaCarrito from '../components/TablaCarrito';
import ResumenFinanciero from '../components/ResumenFinanciero';

export default function VentasView() {
  // Referencias mutables para capturar ráfagas del escáner y enfocar inputs
  const inputBuscadorRef = useRef(null);
  const selectMedioPagoRef = useRef(null);
  const codigoBarrasBuffer = useRef('');
  const ultimoCaracterTime = useRef(0);

  // Estados coordinadores de lógica de negocio y catálogos
  const [bodegas, setBodegas] = useState([]);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [medioPago, setMedioPago] = useState('EFECTIVO');
  // Estados avanzados comerciales, de robustez técnica e interfaz flotante
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [cargandoVenta, setCargandoVenta] = useState(false);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'success' });

  // Disparador nativo para el manejo de Toasts profesionales
  const mostrarToast = (mensaje, tipo = 'success') => {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => setToast({ visible: false, mensaje: '', tipo: 'success' }), 4000);
  };

  // Carga asíncrona de maestros utilizando el cliente Axios configurado
  useEffect(() => {
    const cargarBodegas = async () => {
      try {
        const response = await api.get('/bodegas');
        setBodegas(response.data?.data || response.data || []);
      } catch (err) {
        mostrarToast("Error al cargar el catálogo de bodegas", "error");
      }
    };
    cargarBodegas();
    if (inputBuscadorRef.current) inputBuscadorRef.current.focus(); // Autofocus POS
  }, []);
  useEffect(() => {
    const manejarTecladoGlobal = async (e) => {
      // --- CAPTURA DE HOTKEYS DE NAVEGACIÓN ---
      if (e.key === 'F2') {
        e.preventDefault();
        if (inputBuscadorRef.current) inputBuscadorRef.current.focus();
        mostrarToast("Buscador enfocado", "info");
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (selectMedioPagoRef.current) selectMedioPagoRef.current.focus();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setBusquedaProducto('');
        setProductosFiltrados([]);
        setMostrarHistorial(false);
        if (inputBuscadorRef.current) inputBuscadorRef.current.focus();
        return;
      }
      if ((e.key === 'F10' || (e.ctrlKey && e.key === 'Enter')) && !cargandoVenta) {
        e.preventDefault();
        procesarVentaCaja();
        return;
      }

      // --- ESCUCHADOR DE CÓDIGO DE BARRAS DE ALTA VELOCIDAD ---
      const ahora = Date.now();
      if (document.activeElement.tagName === 'INPUT' && document.activeElement !== inputBuscadorRef.current && e.key !== 'Enter') {
        return;
      }

      if (e.key === 'Enter') {
        if (codigoBarrasBuffer.current.length >= 4 && (ahora - ultimoCaracterTime.current) < 100) {
          e.preventDefault();
          const skuDetectado = codigoBarrasBuffer.current.trim();
          codigoBarrasBuffer.current = '';
          
          try {
            const response = await api.get('/productos/buscar', { params: { termino: skuDetectado } });
            const lista = response.data?.data || response.data || [];
            const productoExacto = lista.find(p => p.codigo_sku === skuDetectado);
            if (productoExacto) {
              if (productoExacto.stock_disponible <= 0) {
                mostrarToast(`Error: ${productoExacto.nombre_articulo} no tiene stock`, "error");
              } else {
                agregarAlCarrito(productoExacto);
                mostrarToast(`Añadido: ${productoExacto.nombre_articulo}`);
              }
            } else {
              mostrarToast(`No se encontró el SKU: ${skuDetectado}`, "error");
            }
          } catch (err) {
            console.error(err);
          }
        }
        codigoBarrasBuffer.current = '';
        return;
      }

      if (e.key.length === 1) {
        if (ahora - ultimoCaracterTime.current > 50) codigoBarrasBuffer.current = '';
        codigoBarrasBuffer.current += e.key;
        ultimoCaracterTime.current = ahora;
      }
    };

    window.addEventListener('keydown', manejarTecladoGlobal);
    return () => window.removeEventListener('keydown', manejarTecladoGlobal);
  }, [carrito, bodegaSeleccionada, medioPago, efectivoRecibido, descuentoPorcentaje, cargandoVenta]);
  const manejarBuscarProducto = async (termino) => {
    setBusquedaProducto(termino);
    if (termino.length < 3) return setProductosFiltrados([]);
    try {
      const response = await api.get('/productos/buscar', { params: { termino } });
      setProductosFiltrados(response.data?.data || response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const agregarAlCarrito = (prod) => {
    if (prod.stock_disponible <= 0) return;
    if (carrito.some(item => item.producto_id === prod.producto_id)) {
      const itemExistente = carrito.find(item => item.producto_id === prod.producto_id);
      if (itemExistente.cantidad >= prod.stock_disponible) {
        mostrarToast(`Límite alcanzado: Solo quedan ${prod.stock_disponible} u.`, "error");
        return;
      }
      actualizarCantidad(prod.producto_id, itemExistente.cantidad + 1);
      return;
    }
    setCarrito([...carrito, {
      producto_id: prod.producto_id,
      nombre_articulo: prod.nombre_articulo,
      codigo_sku: prod.codigo_sku,
      precio_venta_neto: prod.precio_venta_neto || 0, 
      cantidad: 1,
      stock_maximo: prod.stock_disponible || 999 
    }]);
    setProductosFiltrados([]);
    setBusquedaProducto('');
  };

  const actualizarCantidad = (id, valor) => {
    const cant = parseInt(valor, 10);
    setCarrito(carrito.map(item => {
      if (item.producto_id === id) {
        const cantidadFinal = cant > 0 ? cant : 1;
        if (cantidadFinal > item.stock_maximo) {
          mostrarToast(`Máximo stock disponible: ${item.stock_maximo} u.`, "error");
          return { ...item, cantidad: item.stock_maximo };
        }
        return { ...item, cantidad: cantidadFinal };
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.producto_id !== id));
    mostrarToast("Artículo removido del carrito", "info");
  };
  // Pipeline optimizado con useMemo para cálculos matemáticos en tiempo real
  const { totalNeto, iva, totalGeneral, vuelto } = useMemo(() => {
    const netoBase = carrito.reduce((acc, item) => acc + (item.precio_venta_neto * item.cantidad), 0);
    const descuentoCalculado = Math.round(netoBase * (descuentoPorcentaje / 100));
    const netoConDescuento = Math.max(0, netoBase - descuentoCalculado);
    const impuesto = Math.round(netoConDescuento * 0.19);
    const total = netoConDescuento + impuesto;
    const recibido = parseInt(efectivoRecibido, 10) || 0;
    return { 
      totalNeto: netoConDescuento, iva: impuesto, totalGeneral: total,
      vuelto: efectivoRecibido !== '' ? (recibido - total) : null 
    };
  }, [carrito, efectivoRecibido, descuentoPorcentaje]);

  const procesarVentaCaja = async () => {
    if (!bodegaSeleccionada || carrito.length === 0) {
      mostrarToast("Campos obligatorios incompletos: Seleccione Bodega y Productos.", "error");
      return;
    }
    if (medioPago === 'EFECTIVO' && efectivoRecibido !== '' && vuelto < 0) {
      mostrarToast("Error: El efectivo ingresado es insuficiente.", "error");
      return;
    }

    setCargandoVenta(true); // Bloqueo de concurrencia activo
    try {
      const response = await api.post('/ventas/procesar-caja', {
        empresa_id: 1, 
        bodega_id: parseInt(bodegaSeleccionada, 10),
        medio_pago: medioPago,
        descuento_aplicado: descuentoPorcentaje,
        productos: carrito.map(item => ({ producto_id: item.producto_id, cantidad: item.cantidad }))
      });
      if (response.status === 201 || response.status === 200) {
        mostrarToast("💰 ¡Venta procesada con éxito!");
        // Agregar registro inmediato al historial de últimas cajas
        setHistorialVentas(prev => [{ id: response.data?.venta_id || Math.floor(Math.random() * 100000), fecha: new Date().toLocaleTimeString(), total: totalGeneral, items: carrito.length }, ...prev].slice(0, 5));
        setCarrito([]);
        setEfectivoRecibido('');
        setDescuentoPorcentaje(0);
        if (inputBuscadorRef.current) inputBuscadorRef.current.focus();
      }
    } catch (err) {
      mostrarToast("Error crítico al procesar la venta.", "error");
    } finally {
      setCargandoVenta(false); // Liberar estado de carga
    }
  };
  return (
    <div className="flex flex-col lg:flex-row gap-5 p-5 bg-[#0d1117] text-white min-h-[85vh] font-sans relative">
      {/* Componente Global de Alertas Flotantes */}
      <ToastNotification toast={toast} />
      
      {/* SECCIÓN OPERATIVA IZQUIERDA */}
      <div className="flex-1 flex flex-col gap-5">
        <ToolBar historialVentas={historialVentas} mostrarHistorial={mostrarHistorial} setMostrarHistorial={setMostrarHistorial} />
        
        {/* Parámetros de Caja */}
        <div className="bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
          <h3 className="text-[#f0f6fc] font-semibold text-lg mb-3">Configuración de Caja</h3>
          <div className="flex items-center gap-3">
            <label className="text-[#c9d1d9] text-sm">Bodega de Origen (*):</label>
            <select
              value={bodegaSeleccionada}
              onChange={(e) => setBodegaSeleccionada(e.target.value)}
              className="p-2 bg-[#21262d] text-white border border-[#30363d] rounded cursor-pointer text-sm focus:outline-none focus:border-[#388bfd]"
            >
              <option value="">Seleccione una bodega...</option>
              {bodegas.map(b => <option key={b.bodega_id || b.id} value={b.bodega_id || b.id}>{b.nombre || b.nombre_bodega}</option>)}
            </select>
          </div>
        </div>

        {/* Componentes Atómicos Inyectados */}
        <BuscadorRepuestos inputRef={inputBuscadorRef} busquedaProducto={busquedaProducto} onChangeBusqueda={manejarBuscarProducto} productosFiltrados={productosFiltrados} onAgregarAlCarrito={agregarAlCarrito} />
        <TablaCarrito carrito={carrito} onActualizarCantidad={actualizarCantidad} onEliminarDelCarrito={eliminarDelCarrito} />
      </div>

      {/* SECCIÓN DE COBRO Y CONSOLIDACIÓN DERECHA */}
      <ResumenFinanciero 
        totalNeto={totalNeto} descuentoPorcentaje={descuentoPorcentaje} setDescuentoPorcentaje={setDescuentoPorcentaje} iva={iva} totalGeneral={totalGeneral}
        medioPago={medioPago} setMedioPago={setMedioPago} selectRef={selectMedioPagoRef} efectivoRecibido={efectivoRecibido} setEfectivoRecibido={setEfectivoRecibido}
        vuelto={vuelto} cargandoVenta={cargandoVenta} carritoLength={carrito.length} onProcesarVenta={procesarVentaCaja} 
      />
    </div>
  );
}
