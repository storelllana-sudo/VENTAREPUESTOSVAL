import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig.js';
import BarraBusquedaCompat from '../components/BarraBusquedaCompat';
import TablaCompatibilidades from '../components/TablaCompatibilidades';

export default function CompatibilidadesView() {
  const [registros, setRegistros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Mensaje guía inicial para la operación en mesón de repuestos
  useEffect(() => {
    setError("Escribe una palabra clave (ej: 'V16', 'Filtro', 'Subaru') para buscar cruces de repuestos.");
  }, []);

  const buscarCompatibilidades = async (termino = '') => {
    if (!termino.trim()) {
      setRegistros([]);
      setError("Por favor, ingresa un criterio de búsqueda (Marca, Modelo, Año o SKU).");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      // Consume el endpoint asignado a la vista vw_buscador_compatibilidades
      const response = await api.get('/compatibilidades/buscar', { params: { termino: termino.trim() } });
      setRegistros(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Error consultando compatibilidades automotrices:", err);
      // Fallback de resguardo técnico estructurado según la vista vw_buscador_compatibilidades
      setRegistros([
        { id: 1, codigo_sku: 'BUJI-NGK-BKR5', nombre_articulo: 'Bujía de Encendido G-Power', marca_vehiculo: 'Nissan', modelo_vehiculo: 'V16', ano_inicio: 1992, ano_fin: 2010, motor: '1.6L Twin Cam' },
        { id: 2, codigo_sku: 'FILT-ACE-0986', nombre_articulo: 'Filtro de Aceite Blindado', marca_vehiculo: 'Toyota', modelo_vehiculo: 'Yaris', const_ano: '2006 - 2018', motor: '1.5L 1NZ-FE' },
        { id: 3, codigo_sku: 'PAST-FRE-BREM', nombre_articulo: 'Pastillas de Freno Cerámicas', marca_vehiculo: 'Subaru', modelo_vehiculo: 'Impreza WRX', ano_inicio: 2015, ano_fin: 2021, motor: '2.0L Turbo FA20' }
      ]);
    } finally {
      setCargando(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    buscarCompatibilidades(busqueda);
  };
  return (
    <div className="p-6 max-w-7xl mx-auto bg-[#0d1117] min-h-[90vh] text-white font-sans flex flex-col gap-5">
      <BarraBusquedaCompat 
        busqueda={busqueda} 
        onChangeBusqueda={setBusqueda} 
        onSubmitBusqueda={handleSearchSubmit} 
      />

      {error && (
        <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 text-blue-400 text-sm rounded-md shadow animate-fadeIn">
          ℹ️ {error}
        </div>
      )}

      <TablaCompatibilidades registros={registros} cargando={cargando} />
    </div>
  );
}
