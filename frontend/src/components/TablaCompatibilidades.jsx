import React from 'react';

export default function TablaCompatibilidades({ registros, cargando }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className="bg-[#0d1117] text-[#8b949e] uppercase font-semibold text-xs border-b border-[#30363d]">
            <tr>
              <th className="px-6 py-4">SKU Repuesto</th>
              <th className="px-6 py-4">Nombre Artículo</th>
              <th className="px-6 py-4">Vehículo Compatible</th>
              <th className="px-6 py-4 text-center">Año Aplicación</th>
              <th className="px-6 py-4 text-center">Motorización</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
            {cargando ? (
              <tr>
                <td colSpan="5" className="text-center py-14 text-[#8b949e]">
                  <div className="w-5 h-5 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Cruzando compatibilidades con vw_buscador_compatibilidades...
                </td>
              </tr>
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-14 text-[#8b949e]">
                  🔍 No se registran compatibilidades en pantalla. Ingresa una marca o componente para consultar.
                </td>
              </tr>
            ) : (
              registros.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-[#21262d]/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-[#58a6ff]">
                    {item.codigo_sku || 'SKU-PENDIENTE'}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {item.nombre_articulo || item.repuesto}
                  </td>
                  <td className="px-6 py-4 text-[#c9d1d9]">
                    <span className="font-semibold text-[#f0f6fc]">{item.marca_vehiculo}</span> {item.modelo_vehiculo}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-[#8b949e]">
                    {item.ano_inicio && item.ano_fin 
                      ? `${item.ano_inicio} - ${item.ano_fin}` 
                      : item.ano || 'Todos'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-[#30363d] text-[#8b949e] px-2.5 py-1 rounded border border-[#444c56] text-xs font-mono">
                      {item.motor || item.cilindrada || 'N/A'}
                    </span>
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
