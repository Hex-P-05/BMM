// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag para evitar múltiples intentos de refresh
let isRefreshing = false;

// Interceptor de request: Inyecta el token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: Maneja errores y refresh de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // No intentar refresh en rutas de auth
    const isAuthRoute = originalRequest.url?.includes('/auth/');
    
    // Si el token expiró, no es ruta de auth, y no hemos intentado refresh
    if (error.response?.status === 401 && !isAuthRoute && !originalRequest._retry && !isRefreshing) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        isRefreshing = true;
        
        try {
          // Intentar refresh del token
          const response = await axios.post('/api/auth/refresh/', {
            refresh: refreshToken
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          isRefreshing = false;

          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);

        } catch (refreshError) {
          isRefreshing = false;
          // Refresh falló, limpiar tokens (no redirigir, dejar que el UI maneje)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;