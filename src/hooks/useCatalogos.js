// src/hooks/useCatalogos.js
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const useCatalogos = () => {
  const [empresas, setEmpresas] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [navieras, setNavieras] = useState([]);
  const [puertos, setPuertos] = useState([]);
  const [terminales, setTerminales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch de todos los catálogos
  const fetchCatalogos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        empresasRes,
        conceptosRes,
        proveedoresRes,
        navierasRes,
        puertosRes,
        terminalesRes
      ] = await Promise.all([
        api.get('/catalogos/empresas/'),
        api.get('/catalogos/conceptos/'),
        api.get('/catalogos/proveedores/'),
        api.get('/catalogos/navieras/'),
        api.get('/catalogos/puertos/'),
        api.get('/catalogos/terminales/')
      ]);

      // Django REST Framework puede paginar o no
      setEmpresas(empresasRes.data.results || empresasRes.data);
      setConceptos(conceptosRes.data.results || conceptosRes.data);
      setProveedores(proveedoresRes.data.results || proveedoresRes.data);
      setNavieras(navierasRes.data.results || navierasRes.data);
      setPuertos(puertosRes.data.results || puertosRes.data);
      setTerminales(terminalesRes.data.results || terminalesRes.data);

    } catch (err) {
      console.error('Error fetching catalogos:', err);
      setError('Error al cargar los catálogos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar catálogos al montar
  useEffect(() => {
    fetchCatalogos();
  }, [fetchCatalogos]);

  // Obtener proveedor por ID (para autocompletar datos bancarios)
  const getProveedorById = useCallback((id) => {
    return proveedores.find(p => p.id === id) || null;
  }, [proveedores]);

  // Obtener proveedor por nombre
  const getProveedorByNombre = useCallback((nombre) => {
    return proveedores.find(p => p.nombre === nombre) || null;
  }, [proveedores]);

  // Obtener terminales por puerto
  const getTerminalesByPuerto = useCallback((puertoId) => {
    return terminales.filter(t => t.puerto === puertoId);
  }, [terminales]);

  return {
    // Datos
    empresas,
    conceptos,
    proveedores,
    navieras,
    puertos,
    terminales,
    // Estado
    loading,
    error,
    // Métodos
    fetchCatalogos,
    getProveedorById,
    getProveedorByNombre,
    getTerminalesByPuerto,
    refresh: fetchCatalogos
  };
};

export default useCatalogos;