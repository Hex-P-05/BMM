// src/views/CaptureForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Lock, Loader2, AlertCircle, Check, X, Search, Package, Truck, DollarSign } from 'lucide-react';
import { useCatalogos } from '../hooks/useCatalogos';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// Conceptos disponibles para Revalidaciones
const CONCEPTOS_REVALIDACIONES = [
  { id: 'cargos_locales', nombre: 'CARGOS LOCALES' },
  { id: 'cambio_aa', nombre: 'CAMBIO A.A' },
  { id: 'flete_maritimo', nombre: 'FLETE MARÍTIMO' },
  { id: 'demoras', nombre: 'DEMORAS' },
  { id: 'garantia', nombre: 'GARANTÍA' },
  { id: 'limpieza', nombre: 'LIMPIEZA' },
  { id: 'rev_tardia', nombre: 'REV TARDÍA' },
  { id: 'seguridad', nombre: 'SEGURIDAD' },
  { id: 'isps', nombre: 'ISPS' },
  { id: 'transito_interno', nombre: 'TRÁNSITO INTERNO' },
  { id: 'retransmision', nombre: 'RETRANSMISIÓN' },
  { id: 'multa', nombre: 'MULTA' },
  { id: 'seg_revalidacion', nombre: 'SEG. REVALIDACIÓN' },
  { id: 'sac', nombre: 'SAC' },
  { id: 't3_almacenaje', nombre: 'T3 ALMACENAJE' },
  { id: 'cedi', nombre: 'CEDI' },
];

// --- CONCEPTOS LOGÍSTICA ORGANIZADOS ---
const CONCEPTOS_LOGISTICA_ALL = [
  // LOGÍSTICA
  { id: 'impuestos', nombre: 'IMPUESTOS' },
  { id: 'honorarios_aa', nombre: 'HONORARIOS A.A.' },
  { id: 'honorarios_comer', nombre: 'HONORARIOS COMER' },
  { id: 'no_previo', nombre: 'NO PREVIO' },
  { id: 'anticipo', nombre: 'ANTICIPO' },
  { id: 'maniobras', nombre: 'MANIOBRAS' },
  { id: 'almacenajes', nombre: 'ALMACENAJES' },
  { id: 'uva', nombre: 'UVA' },
  { id: 'complemento_impuestos', nombre: 'COMPLEMENTO IMPUESTOS' },
  { id: 'constancia', nombre: 'CONSTANCIA' },

  // TRANSPORTE
  { id: 'flete', nombre: 'FLETE' },
  { id: 'sobrepeso', nombre: 'SOBREPESO' },
  { id: 'flete_falso', nombre: 'FLETE EN FALSO' },
  { id: 'estadias_jaula', nombre: 'ESTADÍAS JAULA/ROJO' },
  { id: 'burrero', nombre: 'BURRERO' },
  { id: 'reexpedicion', nombre: 'REEXPEDICIÓN' },
  { id: 'maniobra_carga', nombre: 'MANIOBRA CARGA' },
  { id: 'maniobra_descarga', nombre: 'MANIOBRA DESCARGA' },
  { id: 'consulta', nombre: 'CONSULTA' },
  { id: 'tiempo_extra_descarga', nombre: 'TIEMPO EXTRA DESCARGA' },
  { id: 'limpieza_log', nombre: 'LIMPIEZA' },
  { id: 'custodia', nombre: 'CUSTODIA' },
  { id: 'estadia', nombre: 'ESTADÍA (General)' },
  { id: 'estadias_patio', nombre: 'ESTADÍAS EN PATIO' },
  { id: 'reconocimiento', nombre: 'RECONOCIMIENTO' },
  { id: 'apoyo_ferreo', nombre: 'APOYO FÉRREO' },

  // CIERRE DE CUENTA
  { id: 'monto_depositado', nombre: 'MONTO DEPOSITADO' },
  { id: 'total_gastos', nombre: 'TOTAL DE GASTOS' },
  { id: 'deudor', nombre: 'DEUDOR' },
  { id: 'apoyos', nombre: 'APOYOS' },
  { id: 'gastos_revalidacion', nombre: 'GASTOS REVALIDACIÓN' },
  { id: 'garantia_contenedor', nombre: 'GARANTÍA CONTENEDOR' },
  { id: 'vacio', nombre: 'VACÍO' },
  { id: 'otros', nombre: 'OTROS' },

  // EXTRAS
  { id: 'g1', nombre: 'G1' },
  { id: 'profepa', nombre: 'PROFEPA' },
  { id: 'rectificacion', nombre: 'RECTIFICACION' },
  { id: 'servicios', nombre: 'SERVICIOS' },
  { id: 'certificados', nombre: 'CERTIFICADOS' },
  { id: 'pama', nombre: 'PAMA' },
];

const GRUPO_LOGISTICA_IDS = ['impuestos', 'honorarios_aa', 'honorarios_comer', 'no_previo', 'anticipo', 'maniobras', 'almacenajes', 'uva', 'complemento_impuestos', 'constancia'];
const GRUPO_TRANSPORTE_IDS = ['flete', 'sobrepeso', 'flete_falso', 'estadias_jaula', 'burrero', 'reexpedicion', 'maniobra_carga', 'maniobra_descarga', 'consulta', 'tiempo_extra_descarga', 'limpieza_log', 'custodia', 'estadia', 'estadias_patio', 'reconocimiento', 'apoyo_ferreo'];
const GRUPO_CIERRE_IDS = ['monto_depositado', 'total_gastos', 'deudor', 'apoyos', 'gastos_revalidacion', 'garantia_contenedor', 'vacio', 'otros'];

const CaptureForm = ({ onSave, onCancel, role, userName }) => {
  const { isRevalidaciones, isLogistica, isClasificacion, isAdmin, canCreateContainers, puertoId } = useAuth();
  
  // Hook de catálogos del backend
  const { empresas, proveedores, navieras, loading: catalogosLoading } = useCatalogos();

  // ESTADO: Buscador de conceptos
  const [conceptoSearch, setConceptoSearch] = useState('');

  // Estado del formulario - datos del contenedor
  const [formData, setFormData] = useState({
    empresa: '',
    fecha_alta: new Date().toISOString().split('T')[0],
    prefijo: '',
    contenedor: '',
    bl_master: '',
    naviera: '',
    pedimento: '',
    eta: '',
    dias_libres: 7,
    divisa: 'MXN',
    observaciones: ''
  });

  // Estado para conceptos seleccionados y sus montos
  const [conceptosSeleccionados, setConceptosSeleccionados] = useState({});
  
  // Estado para datos de naviera (para mostrar datos bancarios según concepto)
  const [navieraData, setNavieraData] = useState({
    banco: '',
    cuenta: '',
    clabe: '',
    aba_swift: '',
    beneficiario: '',
    tipo_concepto: ''
  });

  // Estado para naviera seleccionada completa (con cuentas y montos fijos)
  const [navieraSeleccionada, setNavieraSeleccionada] = useState(null);
  
  const [previewConsecutivo, setPreviewConsecutivo] = useState('001');
  const [consecutivoEditable, setConsecutivoEditable] = useState('');
  const [consecutivoHeredado, setConsecutivoHeredado] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Acceso denegado si no puede crear
  if (!canCreateContainers && !isRevalidaciones && !isLogistica && !isAdmin) {
    return (
      <div className="p-10 text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <p className="text-red-500 font-bold">Acceso denegado</p>
        <p className="text-slate-500 text-sm mt-2">No tienes permisos para dar de alta pagos.</p>
      </div>
    );
  }

  // LÓGICA DE CLASIFICACIÓN DE CONCEPTOS (useMemo)
  const { revalidacionesSection, logisticaSection, transporteSection, cierreSection, otrosSection, conceptosDisponibles } = useMemo(() => {
    // Caso 1: Revalidaciones puro (lista simple)
    if (isRevalidaciones && !isAdmin) {
      return { 
        revalidacionesSection: CONCEPTOS_REVALIDACIONES, 
        logisticaSection: [], 
        transporteSection: [], 
        cierreSection: [], 
        otrosSection: [],
        conceptosDisponibles: CONCEPTOS_REVALIDACIONES
      };
    }

    // Caso 2: Logística o Admin (listas agrupadas)
    const filtrados = CONCEPTOS_LOGISTICA_ALL.filter(c => 
      c.nombre.toLowerCase().includes(conceptoSearch.toLowerCase())
    );

    // Admin ve todos los conceptos
    const allConceptos = isAdmin 
      ? [...CONCEPTOS_REVALIDACIONES, ...CONCEPTOS_LOGISTICA_ALL]
      : CONCEPTOS_LOGISTICA_ALL;

    return {
      revalidacionesSection: isAdmin ? CONCEPTOS_REVALIDACIONES : [],
      logisticaSection: filtrados.filter(c => GRUPO_LOGISTICA_IDS.includes(c.id)),
      transporteSection: filtrados.filter(c => GRUPO_TRANSPORTE_IDS.includes(c.id)),
      cierreSection: filtrados.filter(c => GRUPO_CIERRE_IDS.includes(c.id)),
      otrosSection: filtrados.filter(c => 
        !GRUPO_LOGISTICA_IDS.includes(c.id) && 
        !GRUPO_TRANSPORTE_IDS.includes(c.id) && 
        !GRUPO_CIERRE_IDS.includes(c.id)
      ),
      conceptosDisponibles: allConceptos
    };
  }, [isLogistica, isAdmin, isRevalidaciones, conceptoSearch]);

  // Formatear consecutivo con ceros
  const formatConsecutivo = (num) => {
    return String(num).padStart(3, '0');
  };

  // Calcular importe total de conceptos seleccionados
  const importeTotal = Object.values(conceptosSeleccionados).reduce((sum, concepto) => {
    return sum + (parseFloat(concepto.monto) || 0);
  }, 0);

  // Contar conceptos seleccionados
  const conceptosActivos = Object.keys(conceptosSeleccionados).length;

  // Función para buscar la cuenta bancaria según el concepto
  const buscarCuentaPorConcepto = (naviera, conceptoNombre) => {
    if (!naviera || !naviera.cuentas || !conceptoNombre) return null;

    // Normalizar el nombre del concepto para comparación
    const conceptoNormalizado = conceptoNombre.toUpperCase().trim();

    // Buscar cuenta que contenga el concepto en su tipo_concepto
    const cuentaEncontrada = naviera.cuentas.find(cuenta => {
      const tiposConcepto = cuenta.tipo_concepto.toUpperCase().split(',').map(t => t.trim());
      return tiposConcepto.some(tipo =>
        tipo.includes(conceptoNormalizado) || conceptoNormalizado.includes(tipo)
      );
    });

    // Si no encontramos match exacto, usar la primera cuenta disponible
    return cuentaEncontrada || naviera.cuentas[0] || null;
  };

  // Función para buscar monto fijo por naviera y concepto
  const buscarMontoFijo = (naviera, conceptoNombre) => {
    if (!naviera || !naviera.montos_fijos || !conceptoNombre) return null;

    const conceptoNormalizado = conceptoNombre.toUpperCase().trim();

    const montoEncontrado = naviera.montos_fijos.find(mf =>
      mf.concepto_nombre.toUpperCase().trim() === conceptoNormalizado
    );

    return montoEncontrado || null;
  };

  // Función para actualizar datos bancarios cuando cambia naviera o concepto
  const actualizarDatosBancarios = (naviera, conceptosSeleccionadosActuales) => {
    if (!naviera || !naviera.cuentas || naviera.cuentas.length === 0) {
      setNavieraData({ banco: '', cuenta: '', clabe: '', aba_swift: '', beneficiario: '', tipo_concepto: '' });
      return;
    }

    // Obtener el primer concepto seleccionado para determinar la cuenta
    const conceptosKeys = Object.keys(conceptosSeleccionadosActuales);
    if (conceptosKeys.length > 0) {
      const primerConcepto = conceptosSeleccionadosActuales[conceptosKeys[0]];
      const cuenta = buscarCuentaPorConcepto(naviera, primerConcepto.nombre);
      if (cuenta) {
        setNavieraData({
          banco: cuenta.banco || '',
          cuenta: cuenta.cuenta || '',
          clabe: cuenta.clabe || '',
          aba_swift: cuenta.aba_swift || '',
          beneficiario: cuenta.beneficiario || '',
          tipo_concepto: cuenta.tipo_concepto || ''
        });
        return;
      }
    }

    // Si no hay conceptos seleccionados, usar la primera cuenta
    const primeraCuenta = naviera.cuentas[0];
    setNavieraData({
      banco: primeraCuenta.banco || '',
      cuenta: primeraCuenta.cuenta || '',
      clabe: primeraCuenta.clabe || '',
      aba_swift: primeraCuenta.aba_swift || '',
      beneficiario: primeraCuenta.beneficiario || '',
      tipo_concepto: primeraCuenta.tipo_concepto || ''
    });
  };

  // Obtener siguiente consecutivo
  useEffect(() => {
    const fetchConsecutivo = async () => {
      if (consecutivoHeredado) return;
      
      if (formData.prefijo && formData.prefijo.length >= 2) {
        try {
          const response = await api.get(`/operaciones/tickets/siguiente_consecutivo/?prefijo=${formData.prefijo.toUpperCase()}`);
          const nextNum = response.data.siguiente_consecutivo;
          const formatted = formatConsecutivo(nextNum);
          setPreviewConsecutivo(formatted);
          setConsecutivoEditable(formatted);
        } catch (err) {
          console.error('Error fetching consecutivo:', err);
          setPreviewConsecutivo('001');
          setConsecutivoEditable('001');
        }
      }
    };

    const timeoutId = setTimeout(fetchConsecutivo, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.prefijo, consecutivoHeredado]);

  // Manejar cambio de consecutivo manual
  const handleConsecutivoChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 5) {
      setConsecutivoEditable(value.padStart(3, '0').slice(-Math.max(3, value.length)));
    }
  };

  // Buscar datos por contenedor (Logística)
  const buscarDatosContenedor = async () => {
    if (!formData.contenedor || formData.contenedor.length < 4) return;

    try {
      const response = await api.get(`/operaciones/tickets/?contenedor=${formData.contenedor.toUpperCase()}&tipo_operacion=clasificacion&ordering=-fecha_creacion`);
      const resultados = response.data.results || response.data;

      if (resultados && resultados.length > 0) {
        const previo = resultados[0];
        console.log("Datos heredados de clasificación:", previo);

        setFormData(prev => ({
          ...prev,
          empresa: previo.empresa || prev.empresa,
          bl_master: previo.bl_master || prev.bl_master,
          pedimento: previo.pedimento || prev.pedimento,
          eta: previo.eta || prev.eta,
          dias_libres: previo.dias_libres ?? prev.dias_libres,
          prefijo: previo.prefijo || prev.prefijo,
          naviera: previo.naviera || prev.naviera,
        }));

        if (previo.naviera) {
          const nav = navieras?.find(n => n.id === parseInt(previo.naviera));
          if (nav) {
            setNavieraSeleccionada(nav);
            actualizarDatosBancarios(nav, conceptosSeleccionados);
          }
        }

        if (previo.consecutivo) {
          const consHeredado = String(previo.consecutivo).padStart(3, '0');
          setConsecutivoEditable(consHeredado);
          setPreviewConsecutivo(consHeredado);
          setConsecutivoHeredado(true);
        }
      } else {
        console.log("No se encontró el contenedor en Clasificaciones");
      }
    } catch (err) {
      console.error("No se encontraron datos previos para este contenedor", err);
    }
  };

  // Buscar datos por BL (Revalidaciones)
  const buscarDatosBL = async () => {
    if (!formData.bl_master || formData.bl_master.length < 4) return;

    const blBusqueda = formData.bl_master.toUpperCase();

    try {
      const response = await api.get(`/operaciones/tickets/?bl_master=${blBusqueda}&tipo_operacion=clasificacion&ordering=-fecha_creacion`);
      const resultados = response.data.results || response.data;

      if (resultados && resultados.length > 0) {
        const clasificacion = resultados[0];
        console.log("BL encontrado en Clasificación:", clasificacion);

        setFormData(prev => ({
          ...prev,
          empresa: clasificacion.empresa || prev.empresa,
          contenedor: clasificacion.contenedor || prev.contenedor,
          eta: clasificacion.eta || prev.eta,
          dias_libres: clasificacion.dias_libres ?? prev.dias_libres,
          pedimento: clasificacion.pedimento || prev.pedimento,
          prefijo: clasificacion.prefijo || prev.prefijo,
          naviera: clasificacion.naviera || prev.naviera,
        }));

        if (clasificacion.naviera) {
          const nav = navieras?.find(n => n.id === parseInt(clasificacion.naviera));
          if (nav) {
            setNavieraSeleccionada(nav);
            actualizarDatosBancarios(nav, conceptosSeleccionados);
          }
        }

        if (clasificacion.consecutivo) {
          const consHeredado = String(clasificacion.consecutivo).padStart(3, '0');
          setConsecutivoEditable(consHeredado);
          setPreviewConsecutivo(consHeredado);
          setConsecutivoHeredado(true);
        }

        console.log("Datos cargados exitosamente desde clasificación");
      } else {
        console.log("No se encontró el BL en tickets de Clasificación");
      }
    } catch (err) {
      console.error("Error buscando datos por BL:", err);
    }
  };

  // Generar comentario para un concepto
  const generarComentario = (conceptoNombre) => {
    const cleanPrefijo = formData.prefijo ? formData.prefijo.toUpperCase() : '---';
    const consecutivo = consecutivoEditable || '001';
    const identificador = isLogistica 
      ? (formData.contenedor ? formData.contenedor.toUpperCase() : '---')
      : (formData.bl_master ? formData.bl_master.toUpperCase() : '---');
    return `${cleanPrefijo} ${consecutivo} - ${conceptoNombre} - ${identificador}`;
  };

  // Toggle concepto seleccionado
  const toggleConcepto = (conceptoId, conceptoNombre) => {
    setConceptosSeleccionados(prev => {
      if (prev[conceptoId]) {
        const { [conceptoId]: removed, ...rest } = prev;
        // Actualizar datos bancarios con los conceptos restantes
        if (navieraSeleccionada) {
          setTimeout(() => actualizarDatosBancarios(navieraSeleccionada, rest), 0);
        }
        return rest;
      } else {
        // Buscar si hay monto fijo para este concepto
        let montoInicial = '';
        let esFijo = false;

        if (navieraSeleccionada) {
          const montoFijo = buscarMontoFijo(navieraSeleccionada, conceptoNombre);
          if (montoFijo) {
            montoInicial = montoFijo.monto.toString();
            esFijo = true;
          }
        }

        const nuevoConcepto = {
          nombre: conceptoNombre,
          monto: montoInicial,
          proveedor: '', // Proveedor específico para este concepto
          esFijo: esFijo,
          comentario: generarComentario(conceptoNombre)
        };

        const nuevosConceptos = {
          ...prev,
          [conceptoId]: nuevoConcepto
        };

        // Actualizar datos bancarios con el nuevo concepto
        if (navieraSeleccionada) {
          setTimeout(() => actualizarDatosBancarios(navieraSeleccionada, nuevosConceptos), 0);
        }

        return nuevosConceptos;
      }
    });
  };

  // Actualizar monto de un concepto
  const updateConceptoMonto = (conceptoId, monto) => {
    setConceptosSeleccionados(prev => ({
      ...prev,
      [conceptoId]: {
        ...prev[conceptoId],
        monto: monto
      }
    }));
  };

  // Actualizar proveedor de un concepto
  const updateConceptoProveedor = (conceptoId, proveedorId) => {
    setConceptosSeleccionados(prev => ({
      ...prev,
      [conceptoId]: {
        ...prev[conceptoId],
        proveedor: proveedorId
      }
    }));
  };

  // Actualizar comentarios cuando cambian los datos del contenedor
  useEffect(() => {
    setConceptosSeleccionados(prev => {
      const updated = {};
      for (const [id, concepto] of Object.entries(prev)) {
        updated[id] = {
          ...concepto,
          comentario: generarComentario(concepto.nombre)
        };
      }
      return updated;
    });
  }, [formData.prefijo, formData.contenedor, formData.bl_master, consecutivoEditable]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'prefijo') {
      if (value.length <= 10) {
        setFormData({ ...formData, [name]: value.toUpperCase() });
      }
      return;
    }

    if (name === 'naviera') {
      const nav = navieras?.find(n => n.id === parseInt(value));
      setNavieraSeleccionada(nav || null);

      if (nav) {
        // Actualizar datos bancarios según conceptos ya seleccionados
        actualizarDatosBancarios(nav, conceptosSeleccionados);

        // Auto-llenar montos fijos para conceptos ya seleccionados
        if (nav.montos_fijos && nav.montos_fijos.length > 0) {
          setConceptosSeleccionados(prev => {
            const updated = { ...prev };
            for (const [id, concepto] of Object.entries(updated)) {
              const montoFijo = buscarMontoFijo(nav, concepto.nombre);
              if (montoFijo && !concepto.monto) {
                updated[id] = {
                  ...concepto,
                  monto: montoFijo.monto.toString(),
                  esFijo: true
                };
              }
            }
            return updated;
          });
        }
      } else {
        setNavieraData({ banco: '', cuenta: '', clabe: '', aba_swift: '', beneficiario: '', tipo_concepto: '' });
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (conceptosActivos === 0) {
      setError('Debes seleccionar al menos un concepto');
      setSubmitting(false);
      return;
    }

    try {
      let successCount = 0;
      let errorMessages = [];
      const consecutivoNumerico = parseInt(consecutivoEditable) || 1;

      for (const [conceptoId, concepto] of Object.entries(conceptosSeleccionados)) {
        // Para revalidaciones, buscar la cuenta de naviera adecuada para este concepto
        let navieraCuentaId = null;
        if (isRevalidaciones && navieraSeleccionada && navieraSeleccionada.cuentas) {
          const cuentaEncontrada = buscarCuentaPorConcepto(navieraSeleccionada, concepto.nombre);
          if (cuentaEncontrada) {
            navieraCuentaId = cuentaEncontrada.id;
          }
        }

        const ticketData = {
          empresa: parseInt(formData.empresa),
          fecha_alta: formData.fecha_alta,
          prefijo: formData.prefijo.toUpperCase(),
          consecutivo: consecutivoNumerico,
          contenedor: formData.contenedor?.toUpperCase() || '',
          bl_master: formData.bl_master.toUpperCase(),
          pedimento: formData.pedimento?.toUpperCase() || '',
          eta: formData.eta || null,
          dias_libres: parseInt(formData.dias_libres) || 7,
          divisa: formData.divisa,
          importe: parseFloat(concepto.monto) || 0,
          observaciones: concepto.comentario + (formData.observaciones ? `\n${formData.observaciones}` : ''),
          tipo_operacion: isRevalidaciones ? 'revalidaciones' :
                          isLogistica ? 'logistica' :
                          isClasificacion ? 'clasificacion' : 'revalidaciones',
          puerto: puertoId || null,
          // Campos de naviera para revalidaciones
          naviera: isRevalidaciones && formData.naviera ? parseInt(formData.naviera) : null,
          naviera_cuenta: navieraCuentaId,
          // Campo de proveedor para logística (ahora por concepto)
          proveedor: (isLogistica || isAdmin) && concepto.proveedor ? parseInt(concepto.proveedor) : null
        };

        try {
          await onSave(ticketData);
          successCount++;
        } catch (err) {
          errorMessages.push(`${concepto.nombre}: ${err.message || 'Error'}`);
        }
      }

      if (errorMessages.length > 0) {
        setError(`Algunos pagos no se guardaron: ${errorMessages.join(', ')}`);
      }

    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.response?.data?.detail || 'Error al crear los pagos');
    } finally {
      setSubmitting(false);
    }
  };

  // Seleccionar/deseleccionar todos
  const seleccionarTodos = () => {
    if (conceptosActivos === conceptosDisponibles.length) {
      setConceptosSeleccionados({});
    } else {
      const todos = {};
      conceptosDisponibles.forEach(c => {
        todos[c.id] = {
          nombre: c.nombre,
          monto: '',
          proveedor: '',
          comentario: generarComentario(c.nombre)
        };
      });
      setConceptosSeleccionados(todos);
    }
  };

  // Renderizar tarjeta de concepto
  const renderConceptCard = (concepto) => {
    const isSelected = !!conceptosSeleccionados[concepto.id];
    const conceptoData = conceptosSeleccionados[concepto.id];
    const tieneMontoFijo = conceptoData?.esFijo;

    // Verificar si hay monto fijo disponible para este concepto (aunque no esté seleccionado)
    const montoFijoDisponible = navieraSeleccionada ? buscarMontoFijo(navieraSeleccionada, concepto.nombre) : null;

    return (
      <div
        key={concepto.id}
        className={`rounded-lg border-2 transition-all ${
          isSelected
            ? tieneMontoFijo
              ? 'border-emerald-500 bg-emerald-50 shadow-md'
              : 'border-blue-500 bg-white shadow-md'
            : montoFijoDisponible
              ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
              : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleConcepto(concepto.id, concepto.nombre)}
          className="w-full p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${
              isSelected
                ? tieneMontoFijo ? 'text-emerald-700' : 'text-blue-700'
                : montoFijoDisponible ? 'text-emerald-600' : 'text-slate-600'
            }`}>
              {concepto.nombre}
            </span>
            {montoFijoDisponible && !isSelected && (
              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                ${montoFijoDisponible.monto}
              </span>
            )}
          </div>
          <div className={`w-5 h-5 rounded flex items-center justify-center ${
            isSelected
              ? tieneMontoFijo ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
              : 'bg-slate-200'
          }`}>
            {isSelected && <Check size={14} />}
          </div>
        </button>

        {isSelected && (
          <div className="px-3 pb-3 space-y-2">
            {/* Selector de proveedor (solo para Logística/Admin) */}
            {(isLogistica || isAdmin) && (
              <select
                value={conceptoData?.proveedor || ''}
                onChange={(e) => updateConceptoProveedor(concepto.id, e.target.value)}
                className="w-full p-1.5 border border-green-300 rounded text-xs bg-white outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">-- Proveedor --</option>
                {proveedores.filter(p => p.activo !== false).map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            )}

            {/* Mostrar datos bancarios del proveedor seleccionado */}
            {(isLogistica || isAdmin) && conceptoData?.proveedor && (() => {
              const prov = proveedores.find(p => p.id === parseInt(conceptoData.proveedor));
              if (!prov) return null;
              return (
                <div className="text-[9px] bg-green-50 p-1.5 rounded border border-green-200">
                  <span className="text-green-700 font-bold">{prov.nombre}</span>
                  {prov.banco && <span className="text-slate-500"> | {prov.banco}</span>}
                  {prov.clabe && <span className="text-slate-500"> | {prov.clabe}</span>}
                </div>
              );
            })()}

            <div className="relative">
              <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
              <input
                type="number"
                value={conceptoData?.monto || ''}
                onChange={(e) => updateConceptoMonto(concepto.id, e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className={`w-full pl-5 p-1.5 border rounded text-sm text-right outline-none focus:ring-1 ${
                  tieneMontoFijo
                    ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-500'
                    : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {tieneMontoFijo && (
                <span className="absolute right-2 top-1.5 text-[9px] text-emerald-600 font-bold">
                  FIJO
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 mt-1 truncate" title={conceptoData?.comentario}>
              {conceptoData?.comentario}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Loading de catálogos
  if (catalogosLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-blue-600 mr-3" />
        <span className="text-slate-600">Cargando catálogos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FileText className="mr-2 text-blue-600" /> Alta de pago
            <span className="ml-3 text-sm font-normal text-slate-500">
              ({isRevalidaciones ? 'Revalidaciones' : isLogistica ? 'Logística' : 'Admin'})
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ejecutivo: <b>{userName}</b></p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sección: Datos del contenedor */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-600 uppercase mb-4">Datos del contenedor</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Empresa *</label>
                <select
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {empresas.filter(e => e.activo !== false).map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Prefijo *</label>
                <input
                  name="prefijo"
                  value={formData.prefijo}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  placeholder="Ej: HGO"
                  className="w-full p-2 border rounded text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contenedor solo para Logística */}
              {(isLogistica || isAdmin) && (
                <div className="relative">
                  <label className="text-xs font-bold text-slate-600 mb-1 block"># Contenedor {isLogistica ? '*' : ''}</label>
                  <input
                    name="contenedor"
                    value={formData.contenedor}
                    onChange={handleChange}
                    onBlur={buscarDatosContenedor}
                    required={isLogistica}
                    placeholder="ABCD1234567"
                    className="w-full p-2 border rounded text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-8 text-slate-300 pointer-events-none">
                    <Search size={14} />
                  </div>
                </div>
              )}

              {/* BL Master */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-600 mb-1 block">BL Master {isRevalidaciones ? '*' : ''}</label>
                <input
                  name="bl_master"
                  value={formData.bl_master}
                  onChange={handleChange}
                  onBlur={buscarDatosBL}
                  required={isRevalidaciones}
                  placeholder="BL123456789"
                  className="w-full p-2 border rounded text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute right-3 top-8 text-slate-300 pointer-events-none">
                  <Search size={14} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Pedimento</label>
                <input
                  name="pedimento"
                  value={formData.pedimento}
                  onChange={handleChange}
                  placeholder="Número de pedimento"
                  className="w-full p-2 border rounded text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">ETA</label>
                <input
                  type="date"
                  name="eta"
                  value={formData.eta}
                  onChange={handleChange}
                  className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Días libres</label>
                <input
                  type="number"
                  name="dias_libres"
                  value={formData.dias_libres}
                  onChange={handleChange}
                  min={0}
                  className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Naviera (solo para Revalidaciones) */}
              {isRevalidaciones && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Naviera</label>
                  <select
                    name="naviera"
                    value={formData.naviera}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Seleccionar --</option>
                    {navieras.map(n => (
                      <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>

            {/* Datos bancarios de naviera */}
            {isRevalidaciones && navieraData.banco && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-blue-700">Datos bancarios de la naviera:</p>
                  {navieraData.tipo_concepto && (
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                      {navieraData.tipo_concepto}
                    </span>
                  )}
                </div>
                {navieraData.beneficiario && (
                  <div className="mb-2 pb-2 border-b border-blue-200">
                    <span className="text-[10px] text-slate-500">Beneficiario:</span>
                    <p className="text-xs font-bold text-slate-700">{navieraData.beneficiario}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Banco:</span>
                    <strong className="text-slate-700">{navieraData.banco}</strong>
                  </div>
                  {navieraData.cuenta && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">Cuenta:</span>
                      <strong className="text-slate-700">{navieraData.cuenta}</strong>
                    </div>
                  )}
                  {navieraData.clabe && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">CLABE:</span>
                      <strong className="text-slate-700">{navieraData.clabe}</strong>
                    </div>
                  )}
                  {navieraData.aba_swift && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">ABA/SWIFT:</span>
                      <strong className="text-slate-700">{navieraData.aba_swift}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview de Referencia (ESTILO OSCURO) */}
            <div className="mt-4 p-4 bg-slate-800 rounded-lg shadow-inner border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* LADO IZQUIERDO: VISUALIZACIÓN DE LA REFERENCIA */}
              <div className="flex-1 overflow-hidden w-full">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block flex items-center gap-2">
                  Referencia Base
                  {conceptosActivos > 1 && (
                    <span className="bg-blue-600 text-white text-[9px] px-1.5 rounded-full">
                      Multi-conceptos
                    </span>
                  )}
                </span>
                
                <div className="font-mono text-sm md:text-lg font-bold text-yellow-400 tracking-wide flex flex-wrap items-center gap-x-2">
                  {/* 1. PREFIJO */}
                  <span className="text-yellow-400">{formData.prefijo || '---'}</span>
                  
                  {/* 2. CONSECUTIVO */}
                  <span className="text-yellow-200">{consecutivoEditable}</span>
                  
                  <span className="text-slate-600 font-light">|</span>

                  {/* 3. CONCEPTO */}
                  <span className="text-white bg-slate-700/50 px-2 py-0.5 rounded text-xs md:text-sm uppercase truncate max-w-[200px] border border-slate-600">
                    {(() => {
                      const keys = Object.keys(conceptosSeleccionados);
                      if (keys.length === 0) return "CONCEPTO";
                      if (keys.length === 1) return conceptosSeleccionados[keys[0]].nombre;
                      return `VARIOS (${keys.length})`;
                    })()}
                  </span>

                  <span className="text-slate-600 font-light">|</span>

                  {/* 4. IDENTIFICADOR */}
                  <span className="text-blue-300">
                    {isLogistica ? (formData.contenedor || '---') : (formData.bl_master || '---')}
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Formato: Prefijo + Consecutivo + Concepto + Identificador
                </p>
              </div>

              {/* LADO DERECHO: EDICIÓN MANUAL DEL CONSECUTIVO */}
              <div className="flex items-center gap-3 bg-slate-900 px-3 py-1 rounded border border-slate-600">
                 <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Consecutivo</span>
                 <input 
                   type="text" 
                   value={consecutivoEditable} 
                   onChange={handleConsecutivoChange} 
                   className="w-16 bg-transparent text-white text-xl font-bold text-center border-b-2 border-slate-500 focus:border-yellow-400 outline-none transition-colors font-mono" 
                   maxLength={5} 
                 />
              </div>
            </div>

          {/* Sección: Selección de conceptos */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-blue-800 uppercase">
                Conceptos a registrar ({conceptosActivos} seleccionados)
              </h3>
              <div className="flex items-center gap-3">
                {(isLogistica || isAdmin) && (
                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 text-blue-400" size={14}/>
                    <input 
                      type="text" 
                      placeholder="Filtrar..." 
                      className="pl-7 p-1 w-32 text-xs border rounded-full outline-none focus:ring-1 focus:ring-blue-400 bg-white" 
                      value={conceptoSearch} 
                      onChange={(e) => setConceptoSearch(e.target.value)} 
                    />
                  </div>
                )}
                <select
                  name="divisa"
                  value={formData.divisa}
                  onChange={handleChange}
                  className="text-xs p-1 border rounded font-bold text-blue-600 bg-white"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                </select>
                <button
                  type="button"
                  onClick={seleccionarTodos}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {conceptosActivos === conceptosDisponibles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
            </div>
            
            {/* RENDERING DE GRID */}
            {(isLogistica || isAdmin) ? (
              <div className="space-y-6">
                {/* REVALIDACIONES (solo Admin) */}
                {isAdmin && revalidacionesSection.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                      <FileText size={12}/> REVALIDACIONES
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {revalidacionesSection.map(c => renderConceptCard(c))}
                    </div>
                  </div>
                )}

                {/* GRUPO LOGÍSTICA */}
                {logisticaSection.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                      <Package size={12}/> LOGÍSTICA
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {logisticaSection.map(c => renderConceptCard(c))}
                    </div>
                  </div>
                )}

                {/* GRUPO TRANSPORTE */}
                {transporteSection.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-2 mt-4 flex items-center gap-1">
                      <Truck size={12}/> TRANSPORTE
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {transporteSection.map(c => renderConceptCard(c))}
                    </div>
                  </div>
                )}

                {/* GRUPO CIERRE */}
                {cierreSection.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-2 mt-4 flex items-center gap-1">
                      <DollarSign size={12}/> CIERRE DE CUENTA
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {cierreSection.map(c => renderConceptCard(c))}
                    </div>
                  </div>
                )}

                {/* OTROS */}
                {otrosSection.length > 0 && (
                  <div className="opacity-80">
                    <h4 className="text-xs font-bold text-slate-400 mb-2 mt-4">OTROS</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {otrosSection.map(c => renderConceptCard(c))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* REVALIDACIONES (Grid simple) */
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {revalidacionesSection.map(c => renderConceptCard(c))}
              </div>
            )}

            {/* Total calculado */}
            {conceptosActivos > 0 && (
              <div className="mt-6 p-3 bg-emerald-100 rounded-lg border border-emerald-200 flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-800 uppercase">
                  Total ({conceptosActivos} concepto{conceptosActivos !== 1 ? 's' : ''}):
                </span>
                <span className="text-xl font-bold text-emerald-800">
                  ${importeTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} 
                  <span className="text-xs font-normal text-emerald-600 ml-1">{formData.divisa}</span>
                </span>
              </div>
            )}
          </div>

          {/* Observaciones generales */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Observaciones generales</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales que se agregarán a todos los conceptos..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || conceptosActivos === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center shadow-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Lock size={16} className="mr-2" />
                  Dar de alta {conceptosActivos} pago{conceptosActivos !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaptureForm;