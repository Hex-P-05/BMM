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
          console.log('Usuario data:', response.data);  // <-- Agregar esto
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

  // =====================
  // ROLES (5 roles)
  // =====================
  const role = user?.rol || null;
  const userName = user?.nombre || '';
  
  const isAdmin = role === 'admin';
  const isRevalidaciones = role === 'revalidaciones';
  const isLogistica = role === 'logistica';
  const isPagos = role === 'pagos';
  const isClasificacion = role === 'clasificacion';

  // =====================
  // PUERTO ASIGNADO
  // =====================
  // Admin siempre ve todo (sin filtro de puerto)
  // Pagos sin puerto asignado ve todo
  // Pagos con puerto asignado solo ve su puerto
  // Revalidaciones, Logística y Clasificación tienen puerto asignado
  const puertoAsignado = user?.puerto_asignado || null;
  const puertoId = puertoAsignado?.id || user?.puerto_asignado_id || null;
  const puertoNombre = puertoAsignado?.nombre || null;
  const puertoCodigo = puertoAsignado?.codigo || null;

  // ¿Usuario tiene puerto asignado? (para filtrar operaciones)
  const tienePuerto = !!puertoId;
  // Admin siempre es global, Pagos solo es global si NO tiene puerto asignado
  const esGlobal = isAdmin || (isPagos && !tienePuerto);

  // =====================
  // PERMISOS
  // =====================
  
  // Crear contenedores: Admin y Clasificación
  const canCreateContainers = isAdmin || isClasificacion;
  
  // Ver sábana de logística: Admin, Logística, Pagos
  // Revalidaciones y Clasificación NO PUEDEN VER
  const canViewLogistica = isAdmin || isLogistica || isPagos;

  // Ver sábana de revalidaciones: Admin, Revalidaciones
  // Logística, Pagos y Clasificación NO PUEDEN VER
  const canViewRevalidaciones = isAdmin || isRevalidaciones;

  // Ver sábana de clasificación: Admin, Clasificación
  // Otros roles NO PUEDEN VER
  const canViewClasificacion = isAdmin || isClasificacion;
  
  // Crear operaciones de logística: Admin, Logística
  const canCreateOpsLogistica = isAdmin || isLogistica;
  
  // Crear operaciones de revalidación: Admin, Revalidaciones
  const canCreateOpsRevalidacion = isAdmin || isRevalidaciones;
  
  // Registrar pagos: Admin, Pagos
  const canRegisterPayments = isAdmin || isPagos;
  
  // Pagar demoras: Admin, Revalidaciones (solo ellos)
  const canPayDemoras = isAdmin || isRevalidaciones;
  
  // Pagar almacenajes: Admin, Logística, Pagos
  const canPayAlmacenajes = isAdmin || isLogistica || isPagos;
  
  // Cerrar operaciones: Admin, Pagos
  const canCloseOperations = isAdmin || isPagos;
  
  // Cotizaciones: Todos
  const canCreateQuotes = true;
  
  // Gestionar catálogos: Solo Admin
  const canManageCatalogs = isAdmin;
  
  // Ver bitácora: Solo Admin
  const canViewAuditLog = isAdmin;

  // Editar en sábana
  const canEditAll = isAdmin;
  const canEditDatesOnly = isRevalidaciones || isLogistica;

  // =====================
  // LEGACY (compatibilidad con código anterior)
  // =====================
  const canCreateTickets = canCreateContainers;

  const value = {
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    
    // Datos del usuario
    role,
    userName,
    
    // Puerto asignado
    puertoAsignado,
    puertoId,
    puertoNombre,
    puertoCodigo,
    tienePuerto,
    esGlobal,
    
    // Roles
    isAdmin,
    isRevalidaciones,
    isLogistica,
    isPagos,
    isClasificacion,
    
    // Permisos
    canCreateContainers,
    canViewLogistica,
    canViewRevalidaciones,
    canViewClasificacion,
    canCreateOpsLogistica,
    canCreateOpsRevalidacion,
    canRegisterPayments,
    canPayDemoras,
    canPayAlmacenajes,
    canCloseOperations,
    canCreateQuotes,
    canManageCatalogs,
    canViewAuditLog,
    canEditAll,
    canEditDatesOnly,

    // Legacy
    canCreateTickets,
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