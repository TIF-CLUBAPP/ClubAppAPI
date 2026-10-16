import axios from 'axios';

// URL base del backend (sin "/api"). Configurable mediante VITE_API_URL;
// por defecto usa el backend local de desarrollo (http://localhost:5236).
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL || 'http://localhost:5236').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Adjunta automáticamente el token a cualquier petición futura
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// Interceptor de respuesta: si recibimos 401, limpiamos la sesión y redirigimos a login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado - limpiar almacenamiento local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Redirigir a login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
