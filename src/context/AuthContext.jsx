// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

    // Si el token expiró y no hemos intentado refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Intentar refresh del token
          const response = await axios.post('/api/auth/refresh/', {
            refresh: refreshToken
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);

        } catch (refreshError) {
          // Refresh falló, limpiar tokens y redirigir al login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      } else {
        // No hay refresh token, redirigir al login
        localStorage.removeItem('access_token');
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default api;