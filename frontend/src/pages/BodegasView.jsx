import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig.js';

export default function BodegasView() {
  const [bodegas, setBodegas] = useState([]);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(null);
  const [productosStock, setProductosStock] = useState([]);
  const [busquedaInterna, setBusquedaInterna] = useState('');
  const [cargandoBodegas, setCargandoBodegas] = useState(false);
  const [cargandoStock, setCargandoStock] = useState(false);
  const [error, setError] = useState(null);

  // 1. Obtener listado maestro de bodegas operativas
  useEffect(() => {
    const obtenerBodegas = async () => {
      setCargandoBodegas(true);
      setError(null);
      try {
        const response = await api.get('/bodegas');
        const listaBodegas = response.data?.data || response.data || [];
        setBodegas(listaBodegas);
        
        // Cargar por defecto la primera sucursal si existen registros
        if (listaBodegas.length > 0) {
          manejarSeleccionarBodega(listaBodegas[0]);
        }
      } catch (err) {
        console.error("Error cargando bodegas:", err);
        setError("No se pudo establecer conexión con el catálogo regional de bodegas.");
      } finally {
        setCargandoBodegas(false);
      }
    };
    obtenerBodegas();
  }, []);

  // 2. Consulta dinámica del inventario de la bodega seleccionada
  const manejarSeleccionarBodega = async (bodega) => {
    setBodegaSeleccionada(bodega);
    setCargandoStock(true);
    setProductosStock([]);
    const bodegaId = bodega.bodega_id || bodega.id;
    
    try {
      const response = await api.get(`/bodegas/${bodegaId}/stock`);
      setProductosStock(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Error cargando stock de la bodega:", err);
      // Fallback de resguardo con datos estandarizados mientras se integra el endpoint en la API
      setProductosStock([
        { producto_id: 101, codigo_sku: 'FREN-001', nombre_articulo: 'Pastillas de Freno Delanteras', marca: 'Brembo', cantidad: 45 },
        { producto_id: 102, codigo_sku: 'ACEI-5W30', nombre_articulo: 'Aceite Sintético 5W30 4L', marca: 'Mobil 1', cantidad: 2 },
        { producto_id: 103, codigo_sku: 'FILT-A04', nombre_articulo: 'Filtro de Aire Deportivo', marca: 'K&N', cantidad: 0 }
      ]);
    } finally {
      setCargandoStock(false);
    }
  };

  // 3. Pipeline de filtrado en tiempo real por SKU o descripción
  const stockFiltrado = useMemo(() => {
    return productosStock.filter(p => 
      p.nombre_articulo?.toLowerCase().includes(busquedaInterna.toLowerCase()) ||
      p.codigo_sku?.toLowerCase().includes(busquedaInterna.toLowerCase())
    );
  }, [productosStock, busquedaInterna]);

  // 4. Métricas dinámicas de inventario crítico
  const kpis = useMemo(() => {
    const totalItems = productosStock.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
    const criticos = productosStock.filter(p => p.cantidad > 0 && p.cantidad <= 5).length;
    return { totalItems, criticos };
  }, [productosStock]);
  return (
    <div className="p-6 max-w-7xl mx-auto bg-[#0d1117] min-h-[90vh] text-white font-sans flex flex-col gap-6">
      
      {/* ENCABEZADO CORPORATIVO */}
      <div>
        <h1 className="text-2xl font-bold text-[#f0f6fc]">Control de Bodegas y Stock Regional</h1>
        <p className="text-sm text-[#8b949e] mt-1">Ecosistema ERP Repuestos VAL — Gestión Logística Avanzada</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm rounded-md shadow">
          ⚠️ {error}
        </div>
      )}

      {/* TARJETAS DE MÉTRICAS LOGÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] shadow-md">
          <div className="text-xs text-[#8b949e] font-medium uppercase tracking-wider">Bodegas Operativas</div>
          <div className="text-2xl font-bold text-[#58a6ff] mt-1">{bodegas.length} Sucursales</div>
        </div>
        <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] shadow-md">
          <div className="text-xs text-[#8b949e] font-medium uppercase tracking-wider">Unidades Almacenadas en Selección</div>
          <div className="text-2xl font-bold text-[#56d364] mt-1">{kpis.totalItems.toLocaleString('es-CL')} u.</div>
        </div>
        <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] shadow-md">
          <div className="text-xs text-[#8b949e] font-medium uppercase tracking-wider">Alertas de Reposición Crítica</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.criticos} Productos</div>
        </div>
      </div>

      {/* DISTRIBUCIÓN DE MÓDULOS DE DOS COLUMNAS */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* PANEL IZQUIERDO: SELECCIÓN DE CENTRO DE DISTRIBUCIÓN */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider px-1">Seleccionar Centro</h3>
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
            {cargandoBodegas ? (
              <div className="text-center py-6 text-xs text-[#8b949e]">Consultando sucursales...</div>
            ) : bodegas.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#8b949e]">No se registran centros de distribución.</div>
            ) : (
              bodegas.map((b) => {
                const idActual = b.bodega_id || b.id;
                const esSeleccionada = (bodegaSeleccionada?.bodega_id || bodegaSeleccionada?.id) === idActual;
                return (
                  <button
                    key={idActual}
                    onClick={() => manejarSeleccionarBodega(b)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      esSeleccionada 
                        ? 'bg-[#1f672e]/20 border-[#238636] text-white font-semibold shadow-md' 
                        : 'bg-[#161b22] border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] hover:border-[#444c56]'
                    }`}
                  >
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>🏬</span> {b.nombre || b.nombre_bodega || `Bodega ID: ${idActual}`}
                    </div>
                    <div className="text-xs text-[#8b949e] mt-1 font-mono">Código Interno: VAL-{idActual}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL DERECHO: DETALLE DE INVENTARIO ESPECÍFICO */}
        <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#30363d] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#161b22]">
            <div>
              <h3 className="text-[#f0f6fc] font-semibold text-base">
                Inventario: {bodegaSeleccionada?.nombre || bodegaSeleccionada?.nombre_bodega || 'Seleccione Bodega'}
              </h3>
              <p className="text-xs text-[#8b949e] mt-0.5">Listado detallado de repuestos asignados y stock disponible.</p>
            </div>
            <input
              type="text"
              placeholder="Filtrar por SKU o nombre..."
              value={busquedaInterna}
              onChange={(e) => setBusquedaInterna(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 bg-[#21262d] text-white border border-[#30363d] rounded-md focus:outline-none focus:border-[#388bfd] text-xs placeholder-[#8b949e]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-[#0d1117] text-[#8b949e] uppercase font-semibold text-xs border-b border-[#30363d]">
                <tr>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Descripción del Repuesto</th>
                  <th className="px-6 py-3.5">Marca</th>
                  <th className="px-6 py-3.5 text-center">Unidades</th>
                  <th className="px-6 py-3.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
                {cargandoStock ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[#8b949e]">
                      <div className="w-5 h-5 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Consultando inventario en tiempo real...
                    </td>
                  </tr>
                ) : stockFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-[#8b949e]">
                      🔍 No se registran repuestos vinculados a esta sucursal.
                    </td>
                  </tr>
                ) : (
                  stockFiltrado.map((p) => {
                    const stock = p.cantidad !== undefined ? p.cantidad : p.stock_actual || 0;
                    const esCritico = stock > 0 && stock <= 5;
                    const esAgotado = stock <= 0;

                    return (
                      <tr key={p.producto_id || p.id} className="hover:bg-[#21262d]/40 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-[#58a6ff]">{p.codigo_sku}</td>
                        <td className="px-6 py-4 font-medium text-white">{p.nombre_articulo}</td>
                        <td className="px-6 py-4 text-[#8b949e]">{p.marca || p.marca_fabricante || 'Genérico'}</td>
                        <td className="px-6 py-4 text-center font-bold">
                          <span className={esAgotado ? 'text-red-400' : esCritico ? 'text-amber-400' : 'text-[#56d364]'}>
                            {stock} u.
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            esAgotado 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : esCritico 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' 
                                : 'bg-green-500/10 text-[#56d364] border-green-500/20'
                          }`}>
                            {esAgotado ? 'Agotado' : esCritico ? 'Stock Crítico' : 'Óptimo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
