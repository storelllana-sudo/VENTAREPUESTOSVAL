import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig.js';

export default function ProductosView() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Paginación
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  // Buscar productos
  const buscarProductos = async (termino = '', currentOffset = 0) => {
    if (!termino.trim()) {
      setProductos([]);
      setError(
        'Por favor, ingresa un SKU, marca o nombre para buscar un repuesto.'
      );
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const response = await api.get('/productos/buscar', {
        params: {
          termino: termino.trim(),
          limit: limit,
          offset: currentOffset,
        },
      });

      if (response.data && response.data.success) {
        setProductos(response.data.data || []);
      } else {
        setError(
          response.data?.error ||
            'Error desconocido al buscar productos.'
        );
      }
    } catch (err) {
      console.error('Error buscando productos:', err);

      if (err.response && err.response.status === 400) {
        setError(
          err.response.data?.detail ||
            'El servidor rechazó la consulta por término inválido.'
        );
      } else {
        setError(
          'No se pudo conectar con el servidor corporativo.'
        );
      }
    } finally {
      setCargando(false);
    }
  };

  // Mensaje inicial
  useEffect(() => {
    setError(
      'Escribe un término en el buscador superior para comenzar la consulta.'
    );
  }, []);

  // Nueva búsqueda: siempre vuelve a la primera página
  const handleSearchSubmit = (e) => {
    e.preventDefault();

    setOffset(0);
    buscarProductos(busqueda, 0);
  };

  // Siguiente página
  const handleSiguiente = () => {
    const nuevoOffset = offset + limit;

    setOffset(nuevoOffset);
    buscarProductos(busqueda, nuevoOffset);
  };

  // Página anterior
  const handleAnterior = () => {
    const nuevoOffset = Math.max(0, offset - limit);

    setOffset(nuevoOffset);
    buscarProductos(busqueda, nuevoOffset);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Encabezado y búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de Productos e Inventario
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Ecosistema ERP Repuestos VAL
          </p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="flex gap-2 w-full md:w-96"
        >
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-800"
            placeholder="Buscar por SKU, marca o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Mensajes */}
      {error && (
        <div
          className={`mb-4 p-4 border-l-4 text-sm rounded ${
            error.includes('comenzar')
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'bg-red-50 border-red-500 text-red-700'
          }`}
        >
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse">

            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Nombre Artículo</th>
                <th className="px-6 py-4">Marca / Fabricante</th>
                <th className="px-6 py-4 text-right">Precio Neto</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">

              {/* Cargando */}
              {cargando ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-gray-400"
                  >
                    Buscando en el catálogo de repuestos...
                  </td>
                </tr>

              ) : productos.length === 0 ? (

                /* Sin resultados */
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-gray-400"
                  >
                    No hay productos en pantalla. Realiza una búsqueda válida.
                  </td>
                </tr>

              ) : (

                /* Productos */
                productos.map((prod) => (
                  <tr
                    key={prod.producto_id}
                    className="hover:bg-gray-50 transition-colors"
                  >

                    <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                      {prod.codigo_sku}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-800">
                      {prod.nombre_articulo}
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {prod.marca_fabricante || 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      $
                      {prod.precio_venta_neto?.toLocaleString('es-CL')}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block font-semibold ${
                          prod.stock_actual > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {prod.stock_actual} u.
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          prod.stock_actual > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {prod.stock_actual > 0
                          ? 'Disponible'
                          : 'Sin Stock'}
                      </span>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* Paginación */}
        {productos.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">

            <div className="text-xs text-gray-500">
              Mostrando registros desde el índice{' '}
              <span className="font-semibold">
                {offset + 1}
              </span>{' '}
              en adelante.
            </div>

            <div className="flex gap-2">

              {/* Anterior */}
              <button
                type="button"
                onClick={handleAnterior}
                disabled={offset === 0 || cargando}
                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors"
              >
                Anterior
              </button>

              {/* Siguiente */}
              <button
                type="button"
                onClick={handleSiguiente}
                disabled={
                  productos.length < limit || cargando
                }
                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors"
              >
                Siguiente
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}