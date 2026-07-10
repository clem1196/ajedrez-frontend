// src/services/api.ts
import axios from 'axios';

// Configuramos la URL base apuntando a tu backend de Node.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 💡 INTERCEPTOR: Agrega el token JWT automáticamente en cada petición si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chess_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;