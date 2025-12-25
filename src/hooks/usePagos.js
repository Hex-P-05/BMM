// src/hooks/usePagos.js
import { useState, useCallback } from 'react';
import api from '../api/axios';

export const usePagos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Registrar pago completo de un ticket
  const registrarPago = useCallback(async (ticketId, pagoData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/pagos/pagos/', {
        ticket: ticketId,
        monto: pagoData.monto,
        fecha_pago: pagoData.fecha_pago || new Date().toISOString().split('T')[0],
        referencia: pagoData.referencia || '',
        observaciones: pagoData.observaciones || ''
      });

      return { success: true, data: response.data };

    } catch (err) {
      console.error('Error registrando pago:', err);
      const errorMsg = err.response?.data?.error || 'Error al registrar el pago';
      setError(errorMsg);
      return { success: false, error: errorMsg };

    } finally {
      setLoading(false);
    }
  }, []);

  // Cerrar operación
  const cerrarOperacion = useCallback(async (ticketId, cierreData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/pagos/cierres/', {
        ticket: ticketId,
        monto_final: cierreData.monto_final,
        desglose: cierreData.desglose || {},
        observaciones: cierreData.observaciones || ''
      });

      return { success: true, data: response.data };

    } catch (err) {
      console.error('Error cerrando operación:', err);
      const errorMsg = err.response?.data?.error || 'Error al cerrar la operación';
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
      const response = await api.get(`/pagos/pagos/?ticket=${ticketId}`);
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