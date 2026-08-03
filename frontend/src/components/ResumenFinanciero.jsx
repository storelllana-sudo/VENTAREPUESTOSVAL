import React from 'react';

export default function ResumenFinanciero({ 
  totalNeto, descuentoPorcentaje, setDescuentoPorcentaje, iva, totalGeneral,
  medioPago, setMedioPago, selectRef, efectivoRecibido, setEfectivoRecibido, vuelto,
  cargandoVenta, carritoLength, onProcesarVenta 
}) {
  return (
    <div className="w-full lg:w-96 bg-[#161b22] p-5 rounded-lg border border-[#30363d] h-fit flex flex-col gap-4 shadow-xl">
      <h2 className="text-[#f0f6fc] font-bold text-xl m-0">Resumen Financiero</h2>
      <hr className="border-[#30363d]" />
      
      <div className="flex justify-between items-center text-sm text-[#c9d1d9]">
        <span>Neto Venta:</span>
        <span className="font-semibold text-[#f0f6fc]">${totalNeto.toLocaleString('es-CL')}</span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-[#c9d1d9]">Descuento Aplicado:</span>
        <div className="flex items-center gap-1.5">
          <input 
            type="number" min="0" max="100" 
            value={descuentoPorcentaje} 
            onChange={(e) => setDescuentoPorcentaje(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
            className="w-12 p-1 bg-[#21262d] text-white border border-[#30363d] rounded text-center focus:outline-none focus:border-[#388bfd]" 
          />
          <span className="text-[#8b949e] text-xs">%</span>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-[#c9d1d9]">
        <span>IVA Real (19%):</span>
        <span className="font-semibold text-[#f0f6fc]">${iva.toLocaleString('es-CL')}</span>
      </div>
      
      <hr className="border-[#30363d]" />
      
      <div className="flex justify-between items-center font-bold text-xl text-[#56d364]">
        <span>TOTAL COMPRA:</span>
        <span>${totalGeneral.toLocaleString('es-CL')}</span>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-[#c9d1d9] text-xs font-medium">Medio de Pago (*):</label>
        <select
          ref={selectRef}
          value={medioPago}
          onChange={(e) => setMedioPago(e.target.value)}
          className="w-full bg-[#21262d] text-white border border-[#30363d] rounded-md p-2.5 text-sm cursor-pointer focus:outline-none focus:border-[#388bfd]"
        >
          <option value="EFECTIVO">Efectivo (F8)</option>
          <option value="DEBITO">Tarjeta de Débito</option>
          <option value="CREDITO">Tarjeta de Crédito</option>
          <option value="TRANSFERENCIA">Transferencia Bancaria</option>
        </select>
      </div>

      {medioPago === 'EFECTIVO' && (
        <div className="bg-[#21262d] p-4 rounded-md border border-[#30363d] flex flex-col gap-3">
          <div>
            <label className="block text-[#c9d1d9] text-xs font-medium mb-1.5">Efectivo Recibido (*):</label>
            <input
              type="number" placeholder="Ej: 20000"
              value={efectivoRecibido}
              onChange={(e) => setEfectivoRecibido(e.target.value)}
              className="w-full bg-[#0d1117] text-white border border-[#30363d] rounded p-2 text-lg font-bold focus:outline-none focus:border-[#388bfd]"
            />
          </div>

          {vuelto !== null && (
            <div className={`p-3 rounded border text-center ${vuelto >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <span className={`block text-xs font-semibold mb-0.5 ${vuelto >= 0 ? 'text-[#56d364]' : 'text-red-400'}`}>
                {vuelto >= 0 ? 'VUELTO A ENTREGAR:' : 'FALTA DINERO:'}
              </span>
              <span className={`text-2xl font-black ${vuelto >= 0 ? 'text-[#56d364]' : 'text-red-400'}`}>
                ${Math.abs(vuelto).toLocaleString('es-CL')}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onProcesarVenta}
        disabled={cargandoVenta || carritoLength === 0}
        className={`w-full py-3.5 mt-2 rounded-md font-bold text-white transition-all flex justify-center items-center gap-2 border ${
          cargandoVenta || carritoLength === 0 
            ? 'bg-emerald-800/40 border-emerald-800/20 text-white/40 cursor-not-allowed' 
            : 'bg-[#238636] border-[#2ea44f] hover:bg-[#2ea44f] cursor-pointer active:scale-[0.99]'
        }`}
      >
        {cargandoVenta ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>PROCESANDO...</span>
          </>
        ) : (
          <span>🛒 PROCESAR VENTA (F10)</span>
        )}
      </button>
    </div>
  );
}
