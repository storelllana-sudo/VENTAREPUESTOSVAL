import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../api/auth.js";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Estado para alternar visibilidad
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const data = await authService.login(formData.username, formData.password);
      if (data && data.access_token) {
        navigate("/dashboard");
      } else {
        setError("Error en las credenciales devueltas por el servidor.");
      }
    } catch (err) {
      console.error("Error en Login.jsx:", err);
      const backendError = err.response?.data?.detail || err.message || "Error al conectar con el servidor.";
      setError(backendError);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Luces de fondo ambientales y cálidas al estilo Gemini */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Tarjeta de Login Principal */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800/80 z-10 transition-all duration-300 hover:border-slate-700/50">
        
        {/* Encabezado / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xl mb-3 shadow-lg shadow-indigo-500/20 animate-pulse">
            ✨
          </div>
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-wide">
            REPUESTOS VAL
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wider uppercase">
            Ingresar al Sistema ERP
          </p>
        </div>

        {/* Mensaje de Error Estilizado */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-900/50 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide block">
              Nombre de Usuario
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
              placeholder="Ej: admin_val"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide block">
              Contraseña de Acceso
            </label>
            {/* Contenedor relativo para posicionar el ícono del ojo */}
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-11 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                placeholder="••••••••"
                required
              />
              
              {/* Botón interactivo con el icono del ojo */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors duration-200"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  // Ícono SVG: Ojo tachado (Ocultar)
                  <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  // Ícono SVG: Ojo abierto (Mostrar)
                  <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            Iniciar Sesión Continua
          </button>
        </form>

        {/* Pie de página de la tarjeta */}
        <div className="mt-8 text-center border-t border-slate-800/60 pt-4">
          <p className="text-[10px] text-slate-500 tracking-widest uppercase font-semibold">
            Seguridad Corporativa SSL / JWT Activa
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
