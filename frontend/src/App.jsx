import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx";


// Vista de prueba para confirmar el éxito del inicio de sesión
const DashboardDummy = () => {
    const handleLogout = () => {
        localStorage.removeItem("token_erp_val");
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg p-6 shadow-md border border-green-200">
                <h1 className="text-2xl font-bold text-green-600">¡Conexión Exitosa!</h1>
                <p className="mt-2 text-gray-600">Autenticado correctamente en el sistema de ventas.</p>
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono break-all text-gray-700">
                    <strong>JWT Token activo:</strong> {localStorage.getItem("token_erp_val")}
                </div>
                <button 
                    onClick={handleLogout}
                    className="mt-6 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 text-sm font-semibold transition-colors"
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta pública */}
                <Route path="/login" element={<Login />} />

                {/* Rutas protegidas por token */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardDummy />} />
                </Route>

                {/* Redirección automática */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
