import React from 'react';

export default function PaginacionProd({ productosLength, offset, limit, cargando, onAnterior, onSiguiente }) {
  if (productosLength === 0) return null;

  return (
    <div className="bg-[#161b22] px-6 py-4 border-t border-[#30363d] flex items-center justify-between text-sm">
      <div className="text-xs text-[#8b949e]">
        Mostrando registros desde el índice{' '}
        <span className="font-semibold text-white">{offset + 1}</span>{' '}
        en adelante.
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAnterior}
          disabled={offset === 0 || cargando}
          className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={onSiguiente}
          disabled={productosLength < limit || cargando}
          className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
