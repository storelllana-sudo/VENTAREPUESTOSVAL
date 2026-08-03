import React from "react";

const DashboardView = () => {
  // Datos KPI con colores optimizados para alto contraste en modo oscuro
  const cardsKpi = [
    { title: "Productos Activos", value: "1,240", icon: "📦", color: "border-blue-500/80 text-blue-400 bg-blue-950/30" },
    { title: "Stock Total Disponible", value: "4,850 u", icon: "🏭", color: "border-emerald-500/80 text-emerald-400 bg-emerald-950/30" },
    { title: "Ventas del Día", value: "$450,000 CLP", icon: "🧾", color: "border-purple-500/80 text-purple-400 bg-purple-950/30" },
    { title: "Alertas de Inventario", value: "3 Críticas", icon: "⚠️", color: "border-amber-500/80 text-amber-400 bg-amber-950/30" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Panel de Control General</h1>
        <p className="text-sm text-slate-400">Métricas operacionales de Repuestos VAL.</p>
      </div>

      {/* REJILLA DE TARJETAS KPI - MODO OSCURO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardsKpi.map((kpi, idx) => (
          <div key={idx} className={`bg-slate-900 p-6 rounded-xl shadow-lg border-l-4 ${kpi.color.split(" ")[0]} border-slate-800 flex items-center justify-between`}>
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-400 block">{kpi.title}</span>
              <span className="text-xl font-bold text-slate-100 block">{kpi.value}</span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${kpi.color.split(" ").slice(1).join(" ")}`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* CONTENEDOR DE ACTIVIDAD TRANSACCIONAL */}
      <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800/80">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Actividad Transaccional Reciente</h2>
        <div className="p-8 border-2 border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-center">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-sm font-medium text-slate-300">Historial listo para recibir flujos analíticos</p>
          <p className="text-xs text-slate-500 mt-1">Los datos reales de PostgreSQL se conectarán en la siguiente etapa transaccional.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
