import React from 'react';

export default function ToolBar({ historialVentas, mostrarHistorial, setMostrarHistorial }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center bg-[#161b22] p-4 rounded-lg border border-[#30363d]">
        <span className="text-xs text-[#8b949e]">
          Atajos: <b className="text-[#58a6ff]">F2</b> Buscador | <b className="text-[#58a6ff]">F8</b> Pago | <b className="text-[#58a6ff]">F10</b> Guardar Venta | <b className="text-[#58a6ff]">Esc</b> Limpiar
        </span>
        <button 
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
          className="bg-[#21262d] text-[#c9d1d9] border border-[#30363d] px-3 py-1.5 rounded text-xs hover:bg-[#30363d] transition-colors cursor-pointer"
        >
          📋 Últimas Ventas ({historialVentas.length})
        </button>
      </div>

      {mostrarHistorial && (
        <div className="bg-[#161b22] p-4 rounded-lg border border-[#388bfd] shadow-lg">
          <h4 className="text-[#58a6ff] font-semibold mb-2 text-sm">Historial Reciente de la Caja</h4>
          {historialVentas.length === 0 ? (
            <p className="text-[#8b949e] text-xs m-0">No se registran transacciones en esta sesión operativa.</p>
          ) : (
            <div className="divide-y divide-[#30363d]">
              {historialVentas.map((v) => (
                <div key={v.id} className="flex justify-between py-2 text-xs">
                  <span>Hora: <b className="text-white">{v.fecha}</b> (ID: {v.id})</span>
                  <span>Artículos: {v.items} ítems — <b className="text-[#56d364]">${v.total.toLocaleString('es-CL')}</b></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
