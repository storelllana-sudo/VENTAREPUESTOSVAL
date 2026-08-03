import React from 'react';

export default function EncabezadoTablaProd() {
  return (
    <thead className="bg-[#161b22] text-[#8b949e] text-xs uppercase font-semibold border-b border-[#30363d]">
      <tr>
        <th className="px-6 py-4">SKU</th>
        <th className="px-6 py-4">Nombre Artículo</th>
        <th className="px-6 py-4">Marca / Fabricante</th>
        <th className="px-6 py-4 text-right">Precio Neto</th>
        <th className="px-6 py-4 text-center">Stock</th>
        <th className="px-6 py-4 text-center">Estado</th>
      </tr>
    </thead>
  );
}
