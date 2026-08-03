import axios from "axios";

const API_URL = "http://localhost:8000/api/v2";

console.log("=== ERP REPUESTOS VAL ===");
console.log("API:", API_URL);

const authService = {
  async login(username, password) {
    const formData = new URLSearchParams();

    formData.append("username", username);
    formData.append("password", password);

    const response = await axios.post(
      `${API_URL}/auth/login`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data?.access_token) {
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("username", username);
    }

    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/login";
  },

  getToken() {
    return localStorage.getItem("token");
  },

  isAuthenticated() {
    const token = localStorage.getItem("token");
    return !!token && token.trim() !== "";
  },
};

// Exportación nombrada
export { authService };

// Exportación por defecto
export default authService;