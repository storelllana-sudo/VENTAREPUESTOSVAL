import React from 'react';

export default function AlertasProductos({ error }) {
  if (!error) return null;

  const esMensajeInicial = error.includes('comenzar') || error.includes('Por favor');

  return (
    <div
      className={`mb-5 p-4 border-l-4 text-sm rounded-md shadow-sm ${
        esMensajeInicial
          ? 'bg-blue-500/10 border-blue-500 text-blue-400'
          : 'bg-red-500/10 border-red-500 text-red-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{esMensajeInicial ? 'ℹ️' : '⚠️'}</span>
        <span>{error}</span>
      </div>
    </div>
  );
}
