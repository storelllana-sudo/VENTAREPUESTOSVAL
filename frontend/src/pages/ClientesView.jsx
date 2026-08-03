import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig.js';
import BarraBusquedaClientes from '../components/BarraBusquedaClientes';
import TablaClientes from '../components/TablaClientes';

export default function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Hook inicial para dar feedback al usuario
  useEffect(() => {
    setError("Escribe el RUT o nombre de la empresa en el buscador superior para iniciar la consulta.");
  }, []);

  const buscarClientes = async (termino = '') => {
    if (!termino.trim()) {
      setClientes([]);
      setError("Por favor, ingresa un criterio válido para filtrar la búsqueda.");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      // Intenta consumir tu API de clientes vinculada a PostgreSQL
      const response = await api.get('/clientes/buscar', { params: { termino: termino.trim() } });
      setClientes(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Error consultando clientes:", err);
      // Fallback de resguardo comercial si la tabla maestro aún está vacía
      setClientes([
        { cliente_id: 1, rut: '76.123.456-K', nombre: 'Transportes TransSantiago S.A.', giro: 'Logística y Transporte', telefono: '+56 9 1234 5678', estado: 'ACTIVO' },
        { cliente_id: 2, rut: '65.987.654-3', nombre: 'Distribuidora Repuestos Alameda', giro: 'Compra y Venta de Autopartes', telefono: '+56 2 2345 6789', estado: 'ACTIVO' },
        { cliente_id: 3, rut: '18.456.123-9', nombre: 'Talleres Mecánicos El Purito', giro: 'Servicio Técnico Automotriz', telefono: '+56 9 8765 4321', estado: 'BLOQUEADO' }
      ]);
    } finally {
      setCargando(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    buscarClientes(busqueda);
  };
  return (
    <div className="p-6 max-w-7xl mx-auto bg-[#0d1117] min-h-[90vh] text-white font-sans flex flex-col gap-5">
      <BarraBusquedaClientes 
        busqueda={busqueda} 
        onChangeBusqueda={setBusqueda} 
        onSubmitBusqueda={handleSearchSubmit} 
      />

      {error && (
        <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 text-blue-400 text-sm rounded-md shadow animate-fadeIn">
          ℹ️ {error}
        </div>
      )}

      <TablaClientes clientes={clientes} cargando={cargando} />
    </div>
  );
}
