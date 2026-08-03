import React from 'react';

export default function TablaClientes({ clientes, cargando }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className="bg-[#0d1117] text-[#8b949e] uppercase font-semibold text-xs border-b border-[#30363d]">
            <tr>
              <th className="px-6 py-4">RUT</th>
              <th className="px-6 py-4">Nombre / Razón Social</th>
              <th className="px-6 py-4">Giro Comercial</th>
              <th className="px-6 py-4">Teléfono / Contacto</th>
              <th className="px-6 py-4 text-center">Estado Comercial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
            {cargando ? (
              <tr>
                <td colSpan="5" className="text-center py-14 text-[#8b949e]">
                  <div className="w-5 h-5 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Consultando cartera de clientes en tiempo real...
                </td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-14 text-[#8b949e]">
                  🔍 No hay clientes en pantalla. Realiza una búsqueda válida para iniciar.
                </td>
              </tr>
            ) : (
              clientes.map((c) => {
                const esActivo = c.estado === 'ACTIVO' || c.activo === true || c.estado_comercial !== 'BLOQUEADO';
                return (
                  <tr key={c.cliente_id || c.id} className="hover:bg-[#21262d]/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-[#58a6ff]">
                      {c.rut || c.rut_cliente}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {c.nombre || c.razon_social}
                    </td>
                    <td className="px-6 py-4 text-[#8b949e]">
                      {c.giro || c.giro_comercial || 'Venta de Repuestos'}
                    </td>
                    <td className="px-6 py-4 text-[#c9d1d9] font-mono">
                      {c.telefono || c.celular || 'Sin Registro'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        esActivo
                          ? 'bg-green-500/10 text-[#56d364] border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {esActivo ? 'Venta Habilitada' : 'Línea Bloqueada'}
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
  );
}
