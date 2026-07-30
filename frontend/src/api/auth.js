import axios from "axios";

// Forzamos la URL real apuntando directamente al puerto 8000 de tu servidor Python
const API_URL = "http://localhost:8000/api/v2";

console.log("=== SISTEMA DE EMERGENCIA ACTIVADO ===");
console.log("CONECTANDO DIRECTAMENTE A:", API_URL);

export const authService = {
    async login(username, password) {
        // Formatear las credenciales como exige OAuth2PasswordRequestForm en FastAPI (FORMULARIO)
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        // Ejecutar la petición HTTP enviando los datos como x-www-form-urlencoded
        const response = await axios.post(`${API_URL}/auth/login`, formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        // Devuelve {"access_token": "...", "token_type": "bearer"}
        return response.data; 
    }
};
