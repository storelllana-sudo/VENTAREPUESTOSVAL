import React from 'react';

export default function FilaProducto({ prod }) {
  const tieneStock = prod.stock_actual > 0;

  return (
    <tr className="border-b border-[#30363d] hover:bg-[#21262d]/40 transition-colors">
      <td className="px-6 py-4 font-mono text-xs font-semibold text-[#58a6ff]">
        {prod.codigo_sku}
      </td>
      <td className="px-6 py-4 font-medium text-[#c9d1d9]">
        {prod.nombre_articulo}
      </td>
      <td className="px-6 py-4 text-[#8b949e]">
        {prod.marca_fabricante || 'N/A'}
      </td>
      <td className="px-6 py-4 text-right font-semibold text-white">
        ${prod.precio_venta_neto?.toLocaleString('es-CL')}
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`font-bold ${tieneStock ? 'text-[#56d364]' : 'text-red-400'}`}>
          {prod.stock_actual || 0} u.
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            tieneStock
              ? 'bg-green-500/10 text-[#56d364] border-green-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          {tieneStock ? 'Disponible' : 'Sin Stock'}
        </span>
      </td>
    </tr>
  );
}
