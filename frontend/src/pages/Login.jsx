import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/auth.js";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await authService.login(username, password);
            
            if (data.access_token) {
                localStorage.setItem("token_erp_val", data.access_token);
                navigate("/dashboard");
            } else {
                setError("Respuesta del servidor inválida.");
            }
                } catch (err) {
            console.error("=== ERROR CRÍTICO DE LOGIN ===", err);

            if (err.response) {
                // El backend respondió con un código de estado (401, 403, 422, etc.)
                console.error("CÓDIGO HTTP RECIBIDO:", err.response.status);
                console.error("CUERPO DE LA RESPUESTA:", err.response.data);

                const mensajeServidor = err.response.data?.detail || "Error en los datos de acceso.";
                setError(`Error ${err.response.status}: ${mensajeServidor}`);
            } else if (err.request) {
                // La petición se envió pero el backend nunca respondió (Error de puerto o CORS)
                console.error("SIN RESPUESTA DEL SERVIDOR (Fallo de red o puerto equivocado)");
                setError("No hay conexión con el servidor. Verifica el puerto de FastAPI.");
            } else {
                // Error al configurar la petición antes de enviarla
                console.error("ERROR DE CONFIGURACIÓN:", err.message);
                setError(`Error interno: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }

    };

    return (
        // 1. Fondo de pantalla principal oscurecido estilo espacio tecnológico
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
            
            {/* 2. Tarjeta con el degradado azul/índigo de Gemini y bordes más suaves */}
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-950 p-8 shadow-2xl border border-blue-900/30">
                <div>
                    {/* 3. Textos cambiados a blanco y azul brillante para alta legibilidad */}
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white drop-shadow-md">
                        ERP Sistema de Ventas
                    </h2>
                    <p className="mt-2 text-center text-sm text-blue-200">
                        Inicia sesión para acceder al panel
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-950/50 p-4 text-sm text-red-200 border border-red-800">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            {/* 4. Etiquetas cambiadas a tonos azulados */}
                            <label htmlFor="username" className="block text-sm font-medium text-blue-100 mb-1">
                                Usuario
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="relative block w-full rounded-md border border-blue-700/50 bg-slate-900/60 px-3 py-2 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 sm:text-sm transition-all"
                                placeholder="Ej: admin_val"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-1">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full rounded-md border border-blue-700/50 bg-slate-900/60 px-3 py-2 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 sm:text-sm transition-all"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        {/* 5. Botón de ingreso interactivo con transiciones de color azul eléctrico */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                        >
                            {loading ? "Autenticando..." : "Ingresar al Sistema"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
