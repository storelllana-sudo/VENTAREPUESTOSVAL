import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import DashboardView from "./pages/DashboardView.jsx";
import ProductosView from "./pages/ProductosView.jsx";
import VentasView from "./pages/VentasView.jsx"; // CORREGIDO: Ruta actualizada a la carpeta pages

// Marcador estructural para las vistas que se maquetarán después
const ViewPlaceholder = ({ title }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h1 className="text-xl font-bold text-slate-800 mb-2">{title}</h1>
    <p className="text-sm text-slate-400">Módulo estructural en fase de maquetación de interfaz.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública obligatoria */}
        <Route path="/login" element={<Login />} />
        
        {/* Bloque Defensivo de Rutas Protegidas bajo JWT */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Las pantallas hijas se inyectan en el Outlet del contenedor */}
            <Route path="/dashboard" element={<DashboardView />} />
            
            {/* RUTA REAL CONECTADA */}
            <Route path="/productos" element={<ProductosView />} />
            
            {/* RUTA DE CAJA Y VENTAS CONECTADA AL CONTRATO REAL (SWAGGER) */}
            <Route path="/ventas" element={<VentasView />} />
            
            {/* Resto de placeholders del sistema */}
            <Route path="/bodegas" element={<ViewPlaceholder title="Control de Bodegas y Stock Regional" />} />
            <Route path="/clientes" element={<ViewPlaceholder title="Directorio de Clientes Activos" />} />
            <Route path="/compatibilidades" element={<ViewPlaceholder title="Buscador de Compatibilidades Avanzado" />} />
            <Route path="/reportes" element={<ViewPlaceholder title="Módulo Analítico y Reportes de Auditoría" />} />
          </Route>
        </Route>
        
        {/* Redirección automática de seguridad por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
