// src/hooks/useTickets.js
// NOTA: Este hook mantiene el endpoint legacy /operaciones/tickets/
// Para nuevas funcionalidades usar useContenedores.js
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  // Fetch de contenedores (tickets legacy)
  const fetchTickets = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(filters).toString();
      const url = params ? `/operaciones/tickets/?${params}` : '/operaciones/tickets/';
      const response = await api.get(url);

      // Django REST Framework pagina los resultados
      const data = response.data.results || response.data;
      setTickets(data);

    } catch (err) {
      console.error('Error fetching contenedores:', err);
      setError('Error al cargar los contenedores');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch de datos del dashboard
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await api.get('/operaciones/tickets/dashboard/');
      setDashboard(response.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  }, []);

  // Crear contenedor
  const createTicket = async (ticketData) => {
    try {
      const response = await api.post('/operaciones/tickets/', ticketData);
      setTickets(prev => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating contenedor:', err);
      return {
        success: false,
        error: err.response?.data || 'Error al crear el contenedor'
      };
    }
  };

  // Editar contenedor
  const updateTicket = async (id, ticketData) => {
    try {
      const response = await api.patch(`/operaciones/tickets/${id}/`, ticketData);
      setTickets(prev => prev.map(t => t.id === id ? response.data : t));
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating contenedor:', err);
      return {
        success: false,
        error: err.response?.data || 'Error al actualizar el contenedor'
      };
    }
  };

  // Editar ETA (endpoint específico para Revalidaciones)
  const updateEta = async (id, etaData) => {
    try {
      const response = await api.post(`/operaciones/tickets/${id}/editar_eta/`, etaData);
      await fetchTickets(); // Refrescar lista
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating ETA:', err);
      return {
        success: false,
        error: err.response?.data?.error || 'Error al actualizar ETA'
      };
    }
  };

  // Obtener siguiente consecutivo
  const getNextConsecutivo = async (prefijo) => {
    try {
      const response = await api.get(`/operaciones/tickets/siguiente_consecutivo/?prefijo=${prefijo}`);
      return response.data.siguiente_consecutivo;
    } catch (err) {
      console.error('Error getting consecutivo:', err);
      return 1;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchTickets();
    fetchDashboard();
  }, [fetchTickets, fetchDashboard]);

  return {
    // Alias: contenedores = tickets (para transición gradual)
    tickets,
    contenedores: tickets,
    loading,
    error,
    dashboard,
    // Métodos
    fetchTickets,
    fetchContenedores: fetchTickets,
    fetchDashboard,
    createTicket,
    createContenedor: createTicket,
    updateTicket,
    updateContenedor: updateTicket,
    updateEta,
    getNextConsecutivo,
    // Refresh
    refresh: () => {
      fetchTickets();
      fetchDashboard();
    }
  };
};

export default useTickets;