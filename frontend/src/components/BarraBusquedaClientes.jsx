import React from 'react';

export default function BarraBusquedaClientes({ busqueda, onChangeBusqueda, onSubmitBusqueda }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f6fc]">
          Gestión de Clientes Corporativos
        </h1>
        <p className="text-sm text-[#8b949e] mt-1">
          Ecosistema ERP Repuestos VAL — Cartera de Clientes y Créditos
        </p>
      </div>
      <form onSubmit={onSubmitBusqueda} className="flex gap-2 w-full md:w-96">
        <input
          type="text"
          className="w-full px-4 py-2.5 bg-[#21262d] text-white border border-[#30363d] rounded-lg focus:outline-none focus:border-[#388bfd] text-sm placeholder-[#8b949e]"
          placeholder="Buscar por RUT, Razón Social o Nombre..."
          value={busqueda}
          onChange={(e) => onChangeBusqueda(e.target.value)}
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#238636] hover:bg-[#2ea44f] text-white rounded-lg text-sm font-medium transition-all active:scale-[0.98] border border-[#2ea44f] cursor-pointer"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
