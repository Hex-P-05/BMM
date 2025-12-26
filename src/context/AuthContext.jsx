// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión activa al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          const response = await api.get('/usuarios/me/');
          setUser(response.data);
          setIsLoggedIn(true);
        } catch (error) {
          // Token inválido, limpiar
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // 1. Obtener tokens
      const authResponse = await api.post('/auth/login/', { 
        email,    // ← El backend usa email como USERNAME_FIELD
        password 
      });

      const { access, refresh } = authResponse.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // 2. Obtener datos del usuario
      const userResponse = await api.get('/usuarios/me/');
      setUser(userResponse.data);
      setIsLoggedIn(true);

      return { success: true };

    } catch (error) {
      console.error('Error en login:', error);
      
      let errorMessage = 'Error de conexión con el servidor.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Por favor verifica tus datos.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsLoggedIn(false);
  };

  // Propiedades derivadas del rol
  const role = user?.rol || null;
  const userName = user?.nombre || '';
  const isAdmin = role === 'admin';
  const isEjecutivo = role === 'ejecutivo';
  const isPagos = role === 'pagos';
  // NOTA: El rol 'ejecutivo' en el backend se muestra como 'Revalidaciones' en la UI
  // isRevalidaciones es un alias de isEjecutivo para compatibilidad
  const isRevalidaciones = isEjecutivo;

  // Permisos: Ejecutivo/Revalidaciones puede crear y editar contenedores
  const canCreateTickets = isAdmin || isEjecutivo;
  const canRegisterPayments = isAdmin || isPagos || isEjecutivo;
  const canCloseOperations = isAdmin || isEjecutivo;
  const canEditTickets = isAdmin || isEjecutivo;

  const value = {
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    // Datos del usuario
    role,
    userName,
    // Permisos
    isAdmin,
    isEjecutivo,
    isPagos,
    isRevalidaciones,
    canCreateTickets,
    canRegisterPayments,
    canCloseOperations,
    canEditTickets,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;