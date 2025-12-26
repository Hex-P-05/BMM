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
      const authResponse = await api.post('/auth/login/', { 
        email,
        password 
      });

      const { access, refresh } = authResponse.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

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
  // Solo hay 3 roles: admin, revalidaciones, pagos
  const role = user?.rol || null;
  const userName = user?.nombre || '';
  const isAdmin = role === 'admin';
  const isRevalidaciones = role === 'revalidaciones';
  const isPagos = role === 'pagos';

  // Permisos:
  // - Alta contenedores: admin, revalidaciones
  // - Editar todo en sábana: solo admin
  // - Editar solo fechas/ETA/días libres: revalidaciones
  // - Pagar: admin, pagos
  // - Cerrar en sábana: admin, pagos
  // - Cotizador y Cierre de cuenta: todos
  
  const canCreateTickets = isAdmin || isRevalidaciones;
  const canEditAll = isAdmin;
  const canEditDatesOnly = isRevalidaciones;
  const canRegisterPayments = isAdmin || isPagos;
  const canCloseOperations = isAdmin || isPagos;

  const value = {
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    // Datos del usuario
    role,
    userName,
    // Roles
    isAdmin,
    isRevalidaciones,
    isPagos,
    // Permisos
    canCreateTickets,
    canEditAll,
    canEditDatesOnly,
    canRegisterPayments,
    canCloseOperations,
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