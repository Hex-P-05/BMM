// src/hooks/useAdminCatalogos.js
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

// Mapeo de catálogos a endpoints del backend
const CATALOG_ENDPOINTS = {
  empresas: '/catalogos/empresas/',
  clientes: '/catalogos/clientes/',
  proveedores: '/catalogos/proveedores/',
  navieras: '/catalogos/navieras/',
  puertos: '/catalogos/puertos/',
  terminales: '/catalogos/terminales/',
  agentes: '/catalogos/agentes/',
  trabajadores: '/usuarios/'
};

export const useAdminCatalogos = () => {
  // Estado para cada catálogo
  const [data, setData] = useState({
    empresas: [],
    clientes: [],
    proveedores: [],
    navieras: [],
    puertos: [],
    terminales: [],
    agentes: [],
    trabajadores: []
  });

  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);

  // Cargar un catálogo específico
  const fetchCatalog = useCallback(async (catalogKey) => {
    const endpoint = CATALOG_ENDPOINTS[catalogKey];
    if (!endpoint) {
      console.warn(`No endpoint defined for catalog: ${catalogKey}`);
      return [];
    }

    setLoading(prev => ({ ...prev, [catalogKey]: true }));

    try {
      const response = await api.get(endpoint);
      // Django REST Framework puede paginar o no
      const items = response.data.results || response.data;

      setData(prev => ({ ...prev, [catalogKey]: items }));
      return items;
    } catch (err) {
      console.error(`Error fetching ${catalogKey}:`, err);
      setError(`Error al cargar ${catalogKey}`);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, [catalogKey]: false }));
    }
  }, []);

  // Cargar todos los catálogos
  const fetchAllCatalogs = useCallback(async () => {
    setGlobalLoading(true);
    setError(null);

    try {
      const catalogKeys = Object.keys(CATALOG_ENDPOINTS);

      const results = await Promise.allSettled(
        catalogKeys.map(key => fetchCatalog(key))
      );

      // Log errores si los hay
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to load ${catalogKeys[index]}:`, result.reason);
        }
      });

    } catch (err) {
      console.error('Error fetching all catalogs:', err);
      setError('Error al cargar los catálogos');
    } finally {
      setGlobalLoading(false);
    }
  }, [fetchCatalog]);

  // Cargar catálogos al montar
  useEffect(() => {
    fetchAllCatalogs();
  }, [fetchAllCatalogs]);

  // Crear nuevo registro
  const createItem = useCallback(async (catalogKey, itemData) => {
    const endpoint = CATALOG_ENDPOINTS[catalogKey];
    if (!endpoint) throw new Error(`No endpoint for ${catalogKey}`);

    setLoading(prev => ({ ...prev, [catalogKey]: true }));

    try {
      const response = await api.post(endpoint, itemData);
      const newItem = response.data;

      // Actualizar estado local
      setData(prev => ({
        ...prev,
        [catalogKey]: [...prev[catalogKey], newItem]
      }));

      return { success: true, data: newItem };
    } catch (err) {
      console.error(`Error creating ${catalogKey}:`, err);
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.message ||
                       JSON.stringify(err.response?.data) ||
                       'Error al crear registro';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(prev => ({ ...prev, [catalogKey]: false }));
    }
  }, []);

  // Actualizar registro existente
  const updateItem = useCallback(async (catalogKey, id, itemData) => {
    const endpoint = CATALOG_ENDPOINTS[catalogKey];
    if (!endpoint) throw new Error(`No endpoint for ${catalogKey}`);

    setLoading(prev => ({ ...prev, [catalogKey]: true }));

    try {
      const response = await api.put(`${endpoint}${id}/`, itemData);
      const updatedItem = response.data;

      // Actualizar estado local
      setData(prev => ({
        ...prev,
        [catalogKey]: prev[catalogKey].map(item =>
          item.id === id ? updatedItem : item
        )
      }));

      return { success: true, data: updatedItem };
    } catch (err) {
      console.error(`Error updating ${catalogKey}:`, err);
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.message ||
                       JSON.stringify(err.response?.data) ||
                       'Error al actualizar registro';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(prev => ({ ...prev, [catalogKey]: false }));
    }
  }, []);

  // Eliminar registro
  const deleteItem = useCallback(async (catalogKey, id) => {
    const endpoint = CATALOG_ENDPOINTS[catalogKey];
    if (!endpoint) throw new Error(`No endpoint for ${catalogKey}`);

    setLoading(prev => ({ ...prev, [catalogKey]: true }));

    try {
      await api.delete(`${endpoint}${id}/`);

      // Actualizar estado local
      setData(prev => ({
        ...prev,
        [catalogKey]: prev[catalogKey].filter(item => item.id !== id)
      }));

      return { success: true };
    } catch (err) {
      console.error(`Error deleting ${catalogKey}:`, err);
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.message ||
                       'Error al eliminar registro';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(prev => ({ ...prev, [catalogKey]: false }));
    }
  }, []);

  // Obtener items de un catálogo
  const getItems = useCallback((catalogKey) => {
    return data[catalogKey] || [];
  }, [data]);

  // Verificar si un catálogo está cargando
  const isLoading = useCallback((catalogKey) => {
    return loading[catalogKey] || false;
  }, [loading]);

  return {
    // Datos por catálogo
    data,
    empresas: data.empresas,
    clientes: data.clientes,
    proveedores: data.proveedores,
    navieras: data.navieras,
    puertos: data.puertos,
    terminales: data.terminales,
    agentes: data.agentes,
    trabajadores: data.trabajadores,

    // Estado
    loading,
    globalLoading,
    error,

    // Métodos CRUD
    fetchCatalog,
    fetchAllCatalogs,
    createItem,
    updateItem,
    deleteItem,

    // Helpers
    getItems,
    isLoading,
    refresh: fetchAllCatalogs
  };
};

export default useAdminCatalogos;
