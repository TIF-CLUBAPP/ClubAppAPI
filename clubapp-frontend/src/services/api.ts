import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5236/api',
});

// Adjunta automáticamente el token a cualquier petición futura
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});