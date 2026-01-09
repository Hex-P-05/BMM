// src/hooks/usePagos.js
import { useState, useCallback } from 'react';
import api from '../api/axios';

export const usePagos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Registrar pago completo de un ticket con soporte para comprobante
  const registrarPago = useCallback(async (ticketId, pagoData = {}, comprobante = null) => {
    setLoading(true);
    setError(null);

    try {
      let response;

      // Si hay archivo comprobante, usar FormData
      if (comprobante) {
        const formData = new FormData();
        formData.append('estatus', 'pagado');
        formData.append('fecha_pago', pagoData.fecha_pago || new Date().toISOString().split('T')[0]);
        formData.append('comprobante_pago', comprobante);

        response = await api.patch(`/operaciones/tickets/${ticketId}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Sin archivo, enviar JSON normal
        response = await api.patch(`/operaciones/tickets/${ticketId}/`, {
          estatus: 'pagado',
          fecha_pago: pagoData.fecha_pago || new Date().toISOString().split('T')[0]
        });
      }

      return { success: true, data: response.data };

    } catch (err) {
      console.error('Error registrando pago:', err);

      let errorMsg = 'Error al registrar el pago';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else {
          errorMsg = JSON.stringify(data);
        }
      }

      setError(errorMsg);
      return { success: false, error: errorMsg };

    } finally {
      setLoading(false);
    }
  }, []);

  // Cerrar operación (simplificado)
  const cerrarOperacion = useCallback(async (ticketId, cierreData = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Simplemente actualizar el estatus del ticket a "cerrado"
      const response = await api.patch(`/operaciones/tickets/${ticketId}/`, {
        estatus: 'cerrado'
      });

      return { success: true, data: response.data };

    } catch (err) {
      console.error('Error cerrando operación:', err);
      
      let errorMsg = 'Error al cerrar la operación';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else {
          errorMsg = JSON.stringify(data);
        }
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };

    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener historial de pagos de un ticket
  const getHistorialPagos = useCallback(async (ticketId) => {
    try {
      const response = await api.get(`/operaciones/tickets/${ticketId}/`);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error obteniendo historial:', err);
      return { success: false, error: 'Error al obtener historial de pagos' };
    }
  }, []);

  return {
    loading,
    error,
    registrarPago,
    cerrarOperacion,
    getHistorialPagos,
    clearError: () => setError(null)
  };
};

export default usePagos;