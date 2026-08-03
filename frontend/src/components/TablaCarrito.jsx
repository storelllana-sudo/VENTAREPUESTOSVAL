import React from 'react';

export default function TablaCarrito({ carrito, onActualizarQuantity = () => {}, onActualizarCantidad, onEliminarDelCarrito }) {
  // Manejador flexible por si el orquestador usa onActualizarCantidad o el prop estándar
  const handleQtyChange = onActualizarCantidad || onActualizarQuantity;

  return (
    <div className="bg-[#161b22] p-4 rounded-lg border border-[#30363d] flex flex-col min-h-[220px]">
      <h3 className="text-[#f0f6fc] font-semibold text-lg mb-3">Carrito de Ventas</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-[#30363d] text-[#8b949e] font-medium">
              <th className="p-2 pl-0">SKU</th>
              <th className="p-2">Artículo</th>
              <th className="p-2">Cant.</th>
              <th className="p-2">Precio Neto</th>
              <th className="p-2">Total Ítem</th> 
              <th className="p-2 text-center">Quitar</th> 
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {carrito.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-14 text-center text-[#8b949e]">
                  <div className="text-2xl mb-1">📭</div>
                  El carrito está vacío. Agregue productos mediante el buscador o escáner láser.
                </td>
              </tr>
            ) : (
              carrito.map((item) => (
                <tr key={item.producto_id} className="hover:bg-[#21262d]/50 transition-colors">
                  <td className="py-3 px-2 text-[#c9d1d9] font-mono">{item.codigo_sku}</td>
                  <td className="py-3 px-2 text-[#c9d1d9]">{item.nombre_articulo}</td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      min="1"
                      max={item.stock_maximo}
                      value={item.cantidad}
                      onChange={(e) => handleQtyChange(item.producto_id, e.target.value)}
                      className="w-14 bg-[#21262d] text-white border border-[#30363d] rounded p-1 text-center focus:outline-none focus:border-[#388bfd]"
                    />
                  </td>
                  <td className="py-3 px-2 text-[#c9d1d9]">${item.precio_venta_neto.toLocaleString('es-CL')}</td>
                  <td className="py-3 px-2 text-[#f0f6fc] font-semibold">${(item.precio_venta_neto * item.cantidad).toLocaleString('es-CL')}</td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => onEliminarDelCarrito(item.producto_id)}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 px-3 py-1 rounded font-bold transition-all duration-200 cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
