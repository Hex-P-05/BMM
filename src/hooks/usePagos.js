// src/hooks/usePagos.js
import { useState, useCallback } from 'react';
import api from '../api/axios';

export const usePagos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Registrar pago completo de un ticket
  // Backend usa: /api/pagos/registros/
  const registrarPago = useCallback(async (ticketId, pagoData = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Asegurar que monto sea un número válido
      const monto = parseFloat(pagoData.monto) || 0;
      
      const response = await api.post('/pagos/registros/', {
        ticket: ticketId,
        monto: monto.toFixed(2),
        fecha_pago: pagoData.fecha_pago || new Date().toISOString().split('T')[0],
        concepto_pago: pagoData.concepto_pago || '',
        referencia: pagoData.referencia || '',
        observaciones: pagoData.observaciones || ''
      });

      return { success: true, data: response.data };

    } catch (err) {
      console.error('Error registrando pago:', err);
      console.error('Response data:', err.response?.data);
      
      // Extraer mensaje de error del backend
      let errorMsg = 'Error al registrar el pago';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.monto) {
          errorMsg = `Monto: ${data.monto}`;
        } else if (data.ticket) {
          errorMsg = `Ticket: ${data.ticket}`;
        } else if (data.non_field_errors) {
          errorMsg = data.non_field_errors.join(', ');
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

  // Cerrar operación
  const cerrarOperacion = useCallback(async (ticketId, cierreData = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Asegurar que monto_final sea un número válido
      const montoFinal = parseFloat(cierreData.monto_final) || 0;
      
      const response = await api.post('/pagos/cierres/', {
        ticket: ticketId,
        monto_final: montoFinal.toFixed(2),
        desglose: cierreData.desglose || {},
        observaciones: cierreData.observaciones || ''
      });

      return { success: true, data: response.data };

    } catch (err) {
      console.error('Error cerrando operación:', err);
      console.error('Response data:', err.response?.data);
      
      let errorMsg = 'Error al cerrar la operación';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.ticket) {
          errorMsg = Array.isArray(data.ticket) ? data.ticket[0] : data.ticket;
        } else if (data.non_field_errors) {
          errorMsg = data.non_field_errors.join(', ');
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

  // Obtener datos para comprobante PDF
  const getDatosComprobante = useCallback(async (cierreId) => {
    try {
      const response = await api.get(`/pagos/cierres/${cierreId}/datos_comprobante/`);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error obteniendo datos comprobante:', err);
      return { success: false, error: 'Error al obtener datos del comprobante' };
    }
  }, []);

  // Obtener historial de pagos de un ticket
  const getHistorialPagos = useCallback(async (ticketId) => {
    try {
      const response = await api.get(`/pagos/registros/?ticket=${ticketId}`);
      return { success: true, data: response.data.results || response.data };
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
    getDatosComprobante,
    getHistorialPagos,
    clearError: () => setError(null)
  };
};

export default usePagos;