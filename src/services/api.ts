// src/services/api.ts
import axios from 'axios';

// Asegura que lea la variable de Vercel o use el fallback local
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR: Agrega el token JWT automáticamente
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