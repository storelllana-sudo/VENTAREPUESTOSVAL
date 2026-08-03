import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import authService from "../api/auth.js";

const DashboardLayout = () => {
  const location = useLocation();
  const username = localStorage.getItem("username") || "Usuario";

  // Ítems de navegación de la Sidebar
  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: "🏠" },
    { name: "Productos", path: "/productos", icon: "📦" },
    { name: "Bodegas", path: "/bodegas", icon: "🏭" },
    { name: "Ventas", path: "/ventas", icon: "🧾" },
    { name: "Clientes", path: "/clientes", icon: "👥" },
    { name: "Compatibilidades", path: "/compatibilidades", icon: "🔎" },
    { name: "Reportes", path: "/reportes", icon: "📊" },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans select-none">
      {/* SIDEBAR FIJA - ESTILO AZUL PROFUNDO GEMINI */}
      <aside className="w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between shadow-2xl z-20 border-r border-slate-800/40">
        <div>
          {/* Logo Corporativo Estilo Gemini */}
          <div className="p-5 bg-slate-950/80 flex items-center gap-2 border-b border-slate-800/60 backdrop-blur-sm">
            <span className="text-xl animate-pulse">✨</span>
            <span className="font-extrabold text-sm tracking-widest bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              REPUESTOS VAL
            </span>
          </div>
          
          {/* Menú de Navegación Estilo Gemini */}
          <nav className="p-4 space-y-1.5 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                  <span className="text-base filter drop-shadow-sm">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Botón de Cerrar Sesión Estilo Gemini */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40">
          <button
            onClick={() => authService.logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-900/30"
          >
            <span>🚪</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENEDOR DERECHO - REESTRUCTURADO A MODO OSCURO */}
      <div className="flex flex-col flex-1 overflow-hidden bg-slate-950">
        {/* HEADER SUPERIOR OSCURO */}
        <header className="h-16 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between px-8 shadow-md z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-slate-500">Ecosistema ERP v3</span>
          </div>
          
          {/* Info Usuario Online */}
          <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-1.5 rounded-full border border-slate-800/50">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-300">
              Operador: <span className="text-blue-400 font-mono">{username}</span>
            </span>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO DINÁMICO */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950 text-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
