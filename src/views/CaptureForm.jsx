// src/views/CaptureForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Lock, Loader2, AlertCircle, Check, X, Search, Package, Truck, DollarSign } from 'lucide-react';
import { useCatalogos } from '../hooks/useCatalogos';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// --- DEFINICIÓN DE CONCEPTOS ---

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

// Conceptos de Logística (TOTAL REORGANIZADO)
const CONCEPTOS_LOGISTICA_ALL = [
  // --- SECCIÓN LOGÍSTICA ---
  { id: 'impuestos', nombre: 'IMPUESTOS' },
  { id: 'honorarios_aa', nombre: 'HONORARIOS A.A.' },
  { id: 'honorarios_comer', nombre: 'HONORARIOS COMER' },
  { id: 'no_previo', nombre: 'NO PREVIO' },
  { id: 'anticipo', nombre: 'ANTICIPO' },
  { id: 'maniobras', nombre: 'MANIOBRAS' },
  { id: 'almacenajes', nombre: 'ALMACENAJES' },
  { id: 'uva', nombre: 'UVA' },
  { id: 'complemento_impuestos', nombre: 'COMPLEMENTO IMPUESTOS' }, // Movido
  { id: 'constancia', nombre: 'CONSTANCIA' }, // Movido

  // --- SECCIÓN TRANSPORTE ---
  { id: 'flete', nombre: 'FLETE' },
  { id: 'sobrepeso', nombre: 'SOBREPESO' },
  { id: 'flete_falso', nombre: 'FLETE EN FALSO' },
  { id: 'estadias_jaula', nombre: 'ESTADÍAS EN JAULA O ROJO' },
  { id: 'burrero', nombre: 'BURRERO' },
  { id: 'reexpedicion', nombre: 'REEXPEDICIÓN' },
  { id: 'maniobra_carga', nombre: 'MANIOBRAS DE CARGA' },
  { id: 'maniobra_descarga', nombre: 'MANIOBRAS DE DESCARGA' },
  { id: 'consulta', nombre: 'CONSULTA' },
  { id: 'tiempo_extra_descarga', nombre: 'TIEMPO EXTRA DESCARGA' },
  { id: 'limpieza', nombre: 'LIMPIEZA' },
  { id: 'custodia', nombre: 'CUSTODIA' },
  { id: 'estadia', nombre: 'ESTADÍA (General)' }, // Movido
  { id: 'estadias_patio', nombre: 'ESTADÍAS EN PATIO' }, // Movido
  { id: 'reconocimiento', nombre: 'RECONOCIMIENTO' }, // Movido
  { id: 'apoyo_ferreo', nombre: 'APOYO FÉRREO' }, // Movido

  // --- SECCIÓN CIERRE DE CUENTA ---
  { id: 'monto_depositado', nombre: 'MONTO DEPOSITADO' },
  { id: 'total_gastos', nombre: 'TOTAL DE GASTOS' },
  { id: 'deudor', nombre: 'DEUDOR' },
  { id: 'apoyos', nombre: 'APOYOS' },
  { id: 'gastos_revalidacion', nombre: 'GASTOS DE REVALIDACIÓN' },
  { id: 'garantia_contenedor', nombre: 'GARANTÍA DE CONTENEDOR' },
  { id: 'vacio', nombre: 'VACÍO' }, // Movido
  { id: 'otros', nombre: 'OTROS' },
  
  // Conceptos extra (sobrantes que irán a "Otros")
  { id: 'g1', nombre: 'G1' },
  { id: 'profepa', nombre: 'PROFEPA' },
  { id: 'rectificacion', nombre: 'RECTIFICACION' },
  { id: 'servicios', nombre: 'SERVICIOS' },
  { id: 'certificados', nombre: 'CERTIFICADOS' },
  { id: 'pama', nombre: 'PAMA' },
];

// --- GRUPOS PARA VISUALIZACIÓN ---
const GRUPO_LOGISTICA_IDS = [
  'impuestos', 'honorarios_aa', 'honorarios_comer', 'no_previo', 
  'anticipo', 'maniobras', 'almacenajes', 'uva', 
  'complemento_impuestos', 'constancia'
];

const GRUPO_TRANSPORTE_IDS = [
  'flete', 'sobrepeso', 'flete_falso', 'estadias_jaula', 'burrero', 
  'reexpedicion', 'maniobra_carga', 'maniobra_descarga', 'consulta', 
  'tiempo_extra_descarga', 'limpieza', 'custodia', 
  'estadia', 'estadias_patio', 'reconocimiento', 'apoyo_ferreo'
];

const GRUPO_CIERRE_IDS = [
  'monto_depositado', 'total_gastos', 'deudor', 'apoyos', 
  'gastos_revalidacion', 'garantia_contenedor', 'vacio', 'otros'
];

const CaptureForm = ({ onSave, onCancel, role, userName }) => {
  const { isRevalidaciones, isLogistica, isClasificacion, isAdmin, canCreateContainers, puertoId } = useAuth();
  const { empresas, navieras, loading: catalogosLoading } = useCatalogos();

  // Estado del formulario
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

  const [conceptosSeleccionados, setConceptosSeleccionados] = useState({});
  const [navieraData, setNavieraData] = useState({ banco: '', cuenta: '', clabe: '' });
  const [previewConsecutivo, setPreviewConsecutivo] = useState('001');
  const [consecutivoEditable, setConsecutivoEditable] = useState('');
  const [consecutivoHeredado, setConsecutivoHeredado] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [conceptoSearch, setConceptoSearch] = useState('');

  // 1. Clasificar conceptos para renderizado
  const { revalidaciones, logisticaSection, transporteSection, cierreSection, otrosSection } = useMemo(() => {
    // Si NO es logística ni admin (es revalidación puro)
    if (!isLogistica && !isAdmin) {
      return { revalidaciones: CONCEPTOS_REVALIDACIONES, logisticaSection: [], transporteSection: [], cierreSection: [], otrosSection: [] };
    }

    const filtrados = CONCEPTOS_LOGISTICA_ALL.filter(c => 
      c.nombre.toLowerCase().includes(conceptoSearch.toLowerCase())
    );

    const logistica = filtrados.filter(c => GRUPO_LOGISTICA_IDS.includes(c.id));
    const transporte = filtrados.filter(c => GRUPO_TRANSPORTE_IDS.includes(c.id));
    const cierre = filtrados.filter(c => GRUPO_CIERRE_IDS.includes(c.id));
    
    // Los que no están en ningún grupo específico van a "Otros"
    const otros = filtrados.filter(c => 
      !GRUPO_LOGISTICA_IDS.includes(c.id) && 
      !GRUPO_TRANSPORTE_IDS.includes(c.id) && 
      !GRUPO_CIERRE_IDS.includes(c.id)
    );

    return { 
      revalidaciones: [], 
      logisticaSection: logistica, 
      transporteSection: transporte, 
      cierreSection: cierre,
      otrosSection: otros 
    };
  }, [isLogistica, isAdmin, conceptoSearch]);

  // Acceso denegado
  if (!canCreateContainers && !isRevalidaciones && !isLogistica && !isAdmin) {
    return (
      <div className="p-10 text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <p className="text-red-500 font-bold">Acceso denegado</p>
      </div>
    );
  }

  // --- LÓGICA DE CONSECUTIVO Y BÚSQUEDA ---
  const formatConsecutivo = (num) => String(num).padStart(3, '0');

  useEffect(() => {
    const fetchConsecutivo = async () => {
      if (consecutivoHeredado) return;
      if (formData.prefijo && formData.prefijo.length >= 2) {
        try {
          const response = await api.get(`/operaciones/tickets/siguiente_consecutivo/?prefijo=${formData.prefijo.toUpperCase()}`);
          const formatted = formatConsecutivo(response.data.siguiente_consecutivo);
          setPreviewConsecutivo(formatted);
          setConsecutivoEditable(formatted);
        } catch (err) {
          setPreviewConsecutivo('001');
          setConsecutivoEditable('001');
        }
      }
    };
    const timeoutId = setTimeout(fetchConsecutivo, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.prefijo, consecutivoHeredado]);

  const handleConsecutivoChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 5) setConsecutivoEditable(value.padStart(3, '0').slice(-Math.max(3, value.length)));
  };

  const buscarDatosContenedor = async () => {
    if (!formData.contenedor || formData.contenedor.length < 4) return;
    try {
      const response = await api.get(`/operaciones/tickets/?contenedor=${formData.contenedor.toUpperCase()}&tipo_operacion=clasificacion&ordering=-fecha_creacion`);
      const resultados = response.data.results || response.data;
      if (resultados && resultados.length > 0) {
        const previo = resultados[0];
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
        if (previo.consecutivo) {
          const ch = String(previo.consecutivo).padStart(3, '0');
          setConsecutivoEditable(ch);
          setPreviewConsecutivo(ch);
          setConsecutivoHeredado(true);
        }
      }
    } catch (err) { console.error(err); }
  };

  const buscarDatosBL = async () => {
    if (!formData.bl_master || formData.bl_master.length < 4) return;
    try {
      const response = await api.get(`/operaciones/tickets/?bl_master=${formData.bl_master.toUpperCase()}&tipo_operacion=clasificacion&ordering=-fecha_creacion`);
      const resultados = response.data.results || response.data;
      if (resultados && resultados.length > 0) {
        const previo = resultados[0];
        setFormData(prev => ({
          ...prev,
          empresa: previo.empresa || prev.empresa,
          contenedor: previo.contenedor || prev.contenedor,
          pedimento: previo.pedimento || prev.pedimento,
          eta: previo.eta || prev.eta,
          prefijo: previo.prefijo || prev.prefijo,
          naviera: previo.naviera || prev.naviera,
        }));
        if (previo.consecutivo) {
          const ch = String(previo.consecutivo).padStart(3, '0');
          setConsecutivoEditable(ch);
          setPreviewConsecutivo(ch);
          setConsecutivoHeredado(true);
        }
      }
    } catch (err) { console.error(err); }
  };

  const generarComentario = (conceptoNombre) => {
    const cleanPrefijo = formData.prefijo ? formData.prefijo.toUpperCase() : '---';
    const consecutivo = consecutivoEditable || '001';
    const identificador = isLogistica 
      ? (formData.contenedor ? formData.contenedor.toUpperCase() : '---')
      : (formData.bl_master ? formData.bl_master.toUpperCase() : '---');
    return `${cleanPrefijo} ${consecutivo} - ${conceptoNombre} - ${identificador}`;
  };

  const getBeneficiarioPorConcepto = (conceptoNombre) => {
    if (!formData.naviera) return null;
    const naviera = navieras?.find(n => n.id === parseInt(formData.naviera));
    if (!naviera || !naviera.cuentas || naviera.cuentas.length === 0) return null;
    const conceptoLower = conceptoNombre.toLowerCase();
    const cuenta = naviera.cuentas.find(c => {
      const tipoLower = c.tipo_concepto.toLowerCase();
      return tipoLower.includes(conceptoLower) || conceptoLower.includes(tipoLower);
    });
    const finalCuenta = cuenta || naviera.cuentas[0];
    return {
      beneficiario: finalCuenta.beneficiario || naviera.nombre,
      banco: finalCuenta.banco,
      cuenta: finalCuenta.cuenta,
      clabe: finalCuenta.clabe,
      moneda: finalCuenta.moneda
    };
  };

  const toggleConcepto = (conceptoId, conceptoNombre) => {
    setConceptosSeleccionados(prev => {
      if (prev[conceptoId]) {
        const { [conceptoId]: removed, ...rest } = prev;
        return rest;
      } else {
        const beneficiario = formData.naviera ? getBeneficiarioPorConcepto(conceptoNombre) : null;
        return {
          ...prev,
          [conceptoId]: {
            nombre: conceptoNombre,
            monto: '',
            comentario: generarComentario(conceptoNombre),
            beneficiario: beneficiario
          }
        };
      }
    });
  };

  const updateConceptoMonto = (conceptoId, monto) => {
    setConceptosSeleccionados(prev => ({
      ...prev,
      [conceptoId]: { ...prev[conceptoId], monto: monto }
    }));
  };

  useEffect(() => {
    setConceptosSeleccionados(prev => {
      const updated = {};
      for (const [id, concepto] of Object.entries(prev)) {
        updated[id] = { ...concepto, comentario: generarComentario(concepto.nombre) };
      }
      return updated;
    });
  }, [formData.prefijo, formData.contenedor, formData.bl_master, consecutivoEditable]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'prefijo') {
      if (value.length <= 10) setFormData({ ...formData, [name]: value.toUpperCase() });
      return;
    }
    if (name === 'naviera') {
      const nav = navieras?.find(n => n.id === parseInt(value));
      if (nav && nav.cuentas && nav.cuentas.length > 0) {
        const cuenta = nav.cuentas[0];
        setNavieraData({ banco: cuenta.banco || '', cuenta: cuenta.cuenta || '', clabe: cuenta.clabe || '' });
      } else {
        setNavieraData({ banco: '', cuenta: '', clabe: '' });
      }
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (Object.keys(conceptosSeleccionados).length === 0) {
      setError('Debes seleccionar al menos un concepto');
      setSubmitting(false);
      return;
    }

    try {
      let successCount = 0;
      let errorMessages = [];
      const consecutivoNumerico = parseInt(consecutivoEditable) || 1;

      for (const [conceptoId, concepto] of Object.entries(conceptosSeleccionados)) {
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
          tipo_operacion: isRevalidaciones ? 'revalidaciones' : 'logistica',
          puerto: puertoId || null
        };
        try {
          await onSave(ticketData);
          successCount++;
        } catch (err) {
          errorMessages.push(`${concepto.nombre}: ${err.message || 'Error'}`);
        }
      }

      if (successCount > 0 && errorMessages.length === 0) {
        // Todo bien
      } else if (errorMessages.length > 0) {
        setError(`Algunos pagos no se guardaron: ${errorMessages.join(', ')}`);
      }
    } catch (err) {
      console.error(err);
      setError('Error general al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const ConceptCard = ({ concepto }) => {
    const isSelected = !!conceptosSeleccionados[concepto.id];
    return (
      <div 
        className={`rounded-lg border-2 transition-all ${
          isSelected ? 'border-blue-500 bg-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleConcepto(concepto.id, concepto.nombre)}
          className="w-full p-3 flex items-center justify-between"
        >
          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
            {concepto.nombre}
          </span>
          <div className={`w-5 h-5 rounded flex items-center justify-center ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200'}`}>
            {isSelected && <Check size={14} />}
          </div>
        </button>
        {isSelected && (
          <div className="px-3 pb-3">
            <div className="relative">
              <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
              <input
                type="number"
                value={conceptosSeleccionados[concepto.id]?.monto || ''}
                onChange={(e) => updateConceptoMonto(concepto.id, e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-5 p-1.5 border border-blue-300 rounded text-sm text-right outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 truncate" title={conceptosSeleccionados[concepto.id]?.comentario}>
              {conceptosSeleccionados[concepto.id]?.comentario}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (catalogosLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 size={32} className="animate-spin text-blue-600 mr-3" /> <span className="text-slate-600">Cargando catálogos...</span></div>;
  }

  const conceptosActivos = Object.keys(conceptosSeleccionados).length;
  const importeTotal = Object.values(conceptosSeleccionados).reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FileText className="mr-2 text-blue-600" /> Alta de pago
            <span className="ml-3 text-sm font-normal text-slate-500">
              ({isRevalidaciones ? 'Revalidaciones' : 'Logística'})
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ejecutivo: <b>{userName}</b></p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center"><AlertCircle size={20} className="mr-2" />{error}</div>}

          {/* Sección Datos Contenedor */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-600 uppercase mb-4">Datos de Referencia</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Empresa *</label>
                <select name="empresa" value={formData.empresa} onChange={handleChange} required className="w-full p-2 border rounded text-sm bg-white">
                  <option value="">-- Seleccionar --</option>
                  {empresas.filter(e => e.activo !== false).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Prefijo *</label>
                <input name="prefijo" value={formData.prefijo} onChange={handleChange} required maxLength={10} placeholder="Ej: HGO" className="w-full p-2 border rounded text-sm uppercase" />
              </div>
              {!isRevalidaciones && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block"># Contenedor *</label>
                  <input name="contenedor" value={formData.contenedor} onChange={handleChange} onBlur={buscarDatosContenedor} required placeholder="ABCD1234567" className="w-full p-2 border rounded text-sm uppercase" />
                </div>
              )}
              {!isLogistica && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">BL Master *</label>
                  <input name="bl_master" value={formData.bl_master} onChange={handleChange} onBlur={buscarDatosBL} required={!isLogistica} placeholder="BL123456" className="w-full p-2 border rounded text-sm uppercase" />
                </div>
              )}
            </div>
            
            <div className="mt-4 p-4 bg-slate-800 rounded-lg shadow-inner border border-slate-700 flex justify-between items-center">
              <div className="text-yellow-400 font-mono text-lg font-bold">
                 {formData.prefijo || '---'} {consecutivoEditable} 
                 <span className="text-slate-500 mx-2">|</span>
                 <span className="text-white text-sm bg-slate-700 px-2 py-1 rounded">CONCEPTO</span>
                 <span className="text-slate-500 mx-2">|</span>
                 <span className="text-blue-300">{isLogistica ? (formData.contenedor || '---') : (formData.bl_master || '---')}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] text-slate-400 uppercase">Consecutivo</span>
                 <input type="text" value={consecutivoEditable} onChange={handleConsecutivoChange} className="w-16 bg-transparent text-white text-xl font-bold text-center border-b border-slate-500 outline-none" maxLength={5} />
              </div>
            </div>
          </div>

          {/* Sección Selección de Conceptos */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-blue-800 uppercase">Conceptos a registrar</h3>
              <div className="relative">
                 <Search className="absolute left-2 top-1.5 text-blue-400" size={14}/>
                 <input type="text" placeholder="Filtrar..." className="pl-7 p-1 text-xs border rounded-full outline-none" value={conceptoSearch} onChange={(e) => setConceptoSearch(e.target.value)} />
              </div>
            </div>

            {(isLogistica || isAdmin) ? (
               <div className="space-y-6">
                 {/* GRUPO LOGÍSTICA */}
                 {logisticaSection.length > 0 && (
                   <div>
                     <h4 className="text-xs font-bold text-slate-500 flex items-center mb-2"><Package size={14} className="mr-1"/> SECCIÓN LOGÍSTICA</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {logisticaSection.map(c => <ConceptCard key={c.id} concepto={c} />)}
                     </div>
                   </div>
                 )}

                 {/* GRUPO TRANSPORTE */}
                 {transporteSection.length > 0 && (
                   <div>
                     <h4 className="text-xs font-bold text-slate-500 flex items-center mb-2 mt-2"><Truck size={14} className="mr-1"/> SECCIÓN TRANSPORTE</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {transporteSection.map(c => <ConceptCard key={c.id} concepto={c} />)}
                     </div>
                   </div>
                 )}

                 {/* GRUPO CIERRE */}
                 {cierreSection.length > 0 && (
                   <div>
                     <h4 className="text-xs font-bold text-slate-500 flex items-center mb-2 mt-2"><DollarSign size={14} className="mr-1"/> SECCIÓN CIERRE DE CUENTA</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {cierreSection.map(c => <ConceptCard key={c.id} concepto={c} />)}
                     </div>
                   </div>
                 )}
                 
                 {otrosSection.length > 0 && (
                   <div className="opacity-70 hover:opacity-100 transition-opacity">
                      <h4 className="text-xs font-bold text-slate-400 mb-2 mt-2">OTROS</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {otrosSection.map(c => <ConceptCard key={c.id} concepto={c} />)}
                      </div>
                   </div>
                 )}
               </div>
            ) : (
               /* REVALIDACIONES */
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CONCEPTOS_REVALIDACIONES.map(c => <ConceptCard key={c.id} concepto={c} />)}
               </div>
            )}
            
            {conceptosActivos > 0 && (
              <div className="mt-4 p-3 bg-emerald-100 rounded-lg border border-emerald-200 flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-800 uppercase">Total ({conceptosActivos} conceptos):</span>
                <span className="text-xl font-bold text-emerald-800">${importeTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {formData.divisa}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onCancel} disabled={submitting} className="px-4 py-2 border rounded text-slate-600 font-medium">Cancelar</button>
            <button type="submit" disabled={submitting || conceptosActivos === 0} className="px-6 py-2 bg-blue-600 text-white rounded font-bold shadow-lg flex items-center">
               {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Lock size={16} className="mr-2" />}
               Dar de alta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaptureForm;