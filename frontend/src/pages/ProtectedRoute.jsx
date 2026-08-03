import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  console.log("=== INSPECCIÓN DE SEGURIDAD EN RUTA ===");
  console.log("¿Token detectado en LocalStorage?:", !!token);

  if (!token || token.trim() === "") {
    console.warn("ACCESO DENEGADO: Redirigiendo al Login.");
    return <Navigate to="/login" replace />;
  }

  console.log("ACCESO CONCEDIDO: Cargando vistas del ERP.");

  return <Outlet />;
};

export default ProtectedRoute;