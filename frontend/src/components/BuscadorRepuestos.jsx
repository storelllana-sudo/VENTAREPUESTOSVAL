import React from 'react';

export default function BuscadorRepuestos({ inputRef, busquedaProducto, onChangeBusqueda, productosFiltrados, onAgregarAlCarrito }) {
  return (
    <div className="bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
      <h3 className="text-[#f0f6fc] font-semibold text-lg mb-3">Buscador de Repuestos</h3>
      <input
        type="text"
        ref={inputRef}
        placeholder="Buscar repuesto por SKU, Nombre o Lector de Barra (F2)..."
        value={busquedaProducto}
        onChange={(e) => onChangeBusqueda(e.target.value)}
        className="w-full bg-[#21262d] text-white border border-[#30363d] rounded p-2.5 focus:outline-none focus:border-[#388bfd] text-sm"
      />
      
      {productosFiltrados.length > 0 && (
        <div className="bg-[#21262d] border border-[#30363d] rounded mt-1 max-h-48 overflow-y-auto divide-y divide-[#30363d] shadow-xl">
          {productosFiltrados.map((p) => {
            const esStockCritico = p.stock_disponible > 0 && p.stock_disponible <= 3;
            const sinStock = p.stock_disponible <= 0;
            
            return (
              <div
                key={p.producto_id}
                onClick={() => !sinStock && onAgregarAlCarrito(p)}
                className={`p-3 flex justify-between items-center transition-colors ${sinStock ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-[#30363d]'}`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="text-[#f0f6fc] font-medium text-sm">{p.nombre_articulo}</div>
                  <div className="text-xs flex gap-3">
                    <span className="text-[#8b949e]">SKU: {p.codigo_sku}</span>
                    <span className={`font-semibold ${sinStock ? 'text-red-500' : esStockCritico ? 'text-amber-500 animate-pulse' : 'text-[#8b949e]'}`}>
                      {sinStock ? 'Agotado (Venta Bloqueada)' : `Stock: ${p.stock_disponible} u.`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-[#56d364] font-bold text-sm">
                    ${(p.precio_venta_neto || 0).toLocaleString('es-CL')}
                  </span>
                  {!sinStock && (
                    <span className="bg-[#30363d] text-[#58a6ff] px-2 py-0.5 rounded text-xs border border-[#444c56]">
                      Agregar +
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
