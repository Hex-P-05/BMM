// src/hooks/useContenedores.js
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * Hook para manejar Contenedores y las tres sábanas operativas:
 * - Logística (terminales, usa # contenedor)
 * - Revalidaciones (navieras, usa BL)
 * - Clasificación (datos iniciales)
 */
export const useContenedores = () => {
  const [contenedores, setContenedores] = useState([]);
  const [operacionesLogistica, setOperacionesLogistica] = useState([]);
  const [operacionesRevalidacion, setOperacionesRevalidacion] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  // ==================== CONTENEDORES ====================

  const fetchContenedores = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `/operaciones/contenedores/?${params}` : '/operaciones/contenedores/';
      const response = await api.get(url);

      const data = response.data.results || response.data;
      setContenedores(data);

    } catch (err) {
      console.error('Error fetching contenedores:', err);
      setError('Error al cargar los contenedores');
    } finally {
      setLoading(false);
    }
  }, []);

  const createContenedor = async (data) => {
    try {
      const response = await api.post('/operaciones/contenedores/', data);
      setContenedores(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating contenedor:', err);
      return {
        success: false,
        error: err.response?.data || 'Error al crear el contenedor'
      };
    }
  };

  const fetchContenedoresDashboard = useCallback(async () => {
    try {
      const response = await api.get('/operaciones/contenedores/dashboard/');
      setDashboard(response.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  }, []);

  // ==================== OPERACIONES LOGISTICA ====================

  const fetchOperacionesLogistica = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `/operaciones/logistica/?${params}` : '/operaciones/logistica/';
      const response = await api.get(url);

      const data = response.data.results || response.data;
      setOperacionesLogistica(data);
      return { success: true, data };

    } catch (err) {
      // Si es 403, el usuario no tiene permiso (es normal para otros roles)
      if (err.response?.status === 403) {
        setOperacionesLogistica([]);
        return { success: false, forbidden: true };
      }
      console.error('Error fetching operaciones logistica:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const createOperacionLogistica = async (data) => {
    try {
      const response = await api.post('/operaciones/logistica/', data);
      setOperacionesLogistica(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating operacion logistica:', err);
      return {
        success: false,
        error: err.response?.data || 'Error al crear operación de logística'
      };
    }
  };

  const getNextConsecutivoLogistica = async (prefijo) => {
    try {
      const response = await api.get(`/operaciones/logistica/siguiente_consecutivo/?prefijo=${prefijo}`);
      return response.data.siguiente_consecutivo;
    } catch (err) {
      console.error('Error getting consecutivo logistica:', err);
      return 1;
    }
  };

  // ==================== OPERACIONES REVALIDACION ====================

  const fetchOperacionesRevalidacion = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `/operaciones/revalidaciones/?${params}` : '/operaciones/revalidaciones/';
      const response = await api.get(url);

      const data = response.data.results || response.data;
      setOperacionesRevalidacion(data);
      return { success: true, data };

    } catch (err) {
      // Si es 403, el usuario no tiene permiso (es normal para otros roles)
      if (err.response?.status === 403) {
        setOperacionesRevalidacion([]);
        return { success: false, forbidden: true };
      }
      console.error('Error fetching operaciones revalidacion:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const createOperacionRevalidacion = async (data) => {
    try {
      const response = await api.post('/operaciones/revalidaciones/', data);
      setOperacionesRevalidacion(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating operacion revalidacion:', err);
      return {
        success: false,
        error: err.response?.data || 'Error al crear operación de revalidación'
      };
    }
  };

  const getNextConsecutivoRevalidacion = async (prefijo) => {
    try {
      const response = await api.get(`/operaciones/revalidaciones/siguiente_consecutivo/?prefijo=${prefijo}`);
      return response.data.siguiente_consecutivo;
    } catch (err) {
      console.error('Error getting consecutivo revalidacion:', err);
      return 1;
    }
  };

  // ==================== CLASIFICACIONES ====================

  const fetchClasificaciones = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `/operaciones/clasificaciones/?${params}` : '/operaciones/clasificaciones/';
      const response = await api.get(url);

      const data = response.data.results || response.data;
      setClasificaciones(data);
      return { success: true, data };

    } catch (err) {
      // Si es 403, el usuario no tiene permiso (es normal para otros roles)
      if (err.response?.status === 403) {
        setClasificaciones([]);
        return { success: false, forbidden: true };
      }
      console.error('Error fetching clasificaciones:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const createClasificacion = async (data) => {
    try {
      const response = await api.post('/operaciones/clasificaciones/', data);
      setClasificaciones(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating clasificacion:', err);
      return {
        success: false,
        error: err.response?.data || 'Error al crear clasificación'
      };
    }
  };

  const darVistoBueno = async (clasificacionId) => {
    try {
      const response = await api.post(`/operaciones/clasificaciones/${clasificacionId}/dar_visto_bueno/`);
      await fetchClasificaciones();
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error giving visto bueno:', err);
      return {
        success: false,
        error: err.response?.data?.error || 'Error al dar visto bueno'
      };
    }
  };

  // ==================== REFRESH ALL ====================

  const refresh = useCallback(() => {
    fetchContenedores();
    fetchContenedoresDashboard();
    // Intentar cargar sábanas (ignorar errores 403)
    fetchOperacionesLogistica();
    fetchOperacionesRevalidacion();
    fetchClasificaciones();
  }, [fetchContenedores, fetchContenedoresDashboard, fetchOperacionesLogistica, fetchOperacionesRevalidacion, fetchClasificaciones]);

  // Cargar datos iniciales
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    // Contenedores
    contenedores,
    dashboard,
    fetchContenedores,
    createContenedor,

    // Logística
    operacionesLogistica,
    fetchOperacionesLogistica,
    createOperacionLogistica,
    getNextConsecutivoLogistica,

    // Revalidación
    operacionesRevalidacion,
    fetchOperacionesRevalidacion,
    createOperacionRevalidacion,
    getNextConsecutivoRevalidacion,

    // Clasificación
    clasificaciones,
    fetchClasificaciones,
    createClasificacion,
    darVistoBueno,

    // Estado
    loading,
    error,

    // Utilidades
    refresh,
  };
};

export default useContenedores;
