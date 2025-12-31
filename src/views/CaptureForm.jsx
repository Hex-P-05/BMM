// src/views/CaptureForm.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Lock, Loader2, AlertCircle, Check, X } from 'lucide-react';
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

// Conceptos disponibles para Logística (para futuro)
const CONCEPTOS_LOGISTICA = [
  { id: 'impuestos', nombre: 'IMPUESTOS' },
  { id: 'honorarios_aa', nombre: 'HONORARIOS AA' },
  { id: 'maniobras', nombre: 'MANIOBRAS' },
  { id: 'almacenajes', nombre: 'ALMACENAJES' },
  { id: 'cierre_cuenta', nombre: 'CIERRE DE CUENTA' },
  { id: 'constancia', nombre: 'CONSTANCIA' },
  { id: 'complemento_impuestos', nombre: 'COMPLEMENTO IMPUESTOS' },
  { id: 'uva', nombre: 'UVA' },
  { id: 'g1', nombre: 'G1' },
  { id: 'anticipo', nombre: 'ANTICIPO' },
  { id: 'previo', nombre: 'PREVIO' },
  { id: 'profepa', nombre: 'PROFEPA' },
  { id: 'flete', nombre: 'FLETE' },
  { id: 'maniobra_carga', nombre: 'MANIOBRA DE CARGA' },
  { id: 'maniobra_descarga', nombre: 'MANIOBRA DE DESCARGA' },
  { id: 'consulta', nombre: 'CONSULTA' },
  { id: 'estadia', nombre: 'ESTADIA' },
  { id: 'burrero', nombre: 'BURRERO' },
  { id: 'estadias_patio', nombre: 'ESTADIAS EN PATIO' },
  { id: 'reexpedicion', nombre: 'REEXPEDICION' },
  { id: 'flete_falso', nombre: 'FLETE EN FALSO' },
  { id: 'estadias_jaula', nombre: 'ESTADIAS EN JAULA' },
  { id: 'limpieza', nombre: 'LIMPIEZA' },
  { id: 'reconocimiento', nombre: 'RECONOCIMIENTO' },
  { id: 'vacio', nombre: 'VACIO' },
  { id: 'sobrepeso', nombre: 'SOBREPESO' },
  { id: 'tiempo_extra_descarga', nombre: 'TIEMPO EXTRA DESCARGA' },
  { id: 'apoyo_ferreo', nombre: 'APOYO FERREO' },
  { id: 'rectificacion', nombre: 'RECTIFICACION' },
  { id: 'servicios', nombre: 'SERVICIOS' },
  { id: 'certificados', nombre: 'CERTIFICADOS' },
  { id: 'honorarios_comer', nombre: 'HONORARIOS COMER' },
  { id: 'no_previo', nombre: 'NO PREVIO' },
  { id: 'pama', nombre: 'PAMA' },
];

const CaptureForm = ({ onSave, onCancel, role, userName }) => {
  const { isRevalidaciones, isLogistica, isClasificacion, isAdmin, canCreateContainers, puertoId } = useAuth();
  
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

  // Determinar qué conceptos mostrar según el rol
  const conceptosDisponibles = isRevalidaciones ? CONCEPTOS_REVALIDACIONES : 
                               isLogistica ? CONCEPTOS_LOGISTICA : 
                               CONCEPTOS_REVALIDACIONES; // Admin ve todos

  // Hook de catálogos del backend
  const { empresas, proveedores, navieras, loading: catalogosLoading } = useCatalogos();

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
  
  // Estado para datos de naviera (para mostrar datos bancarios)
  const [navieraData, setNavieraData] = useState({ banco: '', cuenta: '', clabe: '' });
  
  const [previewConsecutivo, setPreviewConsecutivo] = useState('001');
  const [consecutivoEditable, setConsecutivoEditable] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  // Obtener siguiente consecutivo del backend
  useEffect(() => {
    const fetchConsecutivo = async () => {
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
      } else {
        setPreviewConsecutivo('001');
        setConsecutivoEditable('001');
      }
    };

    const timeoutId = setTimeout(fetchConsecutivo, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.prefijo]);

  // Manejar cambio de consecutivo manual
  const handleConsecutivoChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 5) {
      setConsecutivoEditable(value.padStart(3, '0').slice(-Math.max(3, value.length)));
    }
  };

  // Generar comentario para un concepto (Revalidaciones usa BL, no contenedor)
  const generarComentario = (conceptoNombre) => {
    const cleanPrefijo = formData.prefijo ? formData.prefijo.toUpperCase() : '---';
    const consecutivo = consecutivoEditable || '001';
    const cleanBL = formData.bl_master ? formData.bl_master.toUpperCase() : '---';
    
    // Para Revalidaciones: CONCEPTO - PREFIJO CONSECUTIVO - BL
    if (isRevalidaciones) {
      return `${conceptoNombre} - ${cleanPrefijo} ${consecutivo} - ${cleanBL}`;
    }
    
    // Para Logística: CONCEPTO - PREFIJO CONSECUTIVO - CONTENEDOR
    const cleanContenedor = formData.contenedor ? formData.contenedor.toUpperCase() : '---';
    return `${conceptoNombre} - ${cleanPrefijo} ${consecutivo} - ${cleanContenedor}`;
  };

  // Toggle concepto seleccionado
  const toggleConcepto = (conceptoId, conceptoNombre) => {
    setConceptosSeleccionados(prev => {
      if (prev[conceptoId]) {
        // Deseleccionar
        const { [conceptoId]: removed, ...rest } = prev;
        return rest;
      } else {
        // Seleccionar
        return {
          ...prev,
          [conceptoId]: {
            nombre: conceptoNombre,
            monto: '',
            comentario: generarComentario(conceptoNombre)
          }
        };
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
      if (nav && nav.cuentas && nav.cuentas.length > 0) {
        const cuenta = nav.cuentas[0];
        setNavieraData({
          banco: cuenta.banco || '',
          cuenta: cuenta.cuenta || '',
          clabe: cuenta.clabe || ''
        });
      } else {
        setNavieraData({ banco: '', cuenta: '', clabe: '' });
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  // Enviar formulario - crea un registro por cada concepto seleccionado
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit iniciado');
    console.log('isLogistica:', isLogistica, 'puertoId:', puertoId);
    console.log('conceptosSeleccionados:', conceptosSeleccionados);
    console.log('conceptosActivos:', conceptosActivos);
    setSubmitting(true);
    setError('');

    if (conceptosActivos === 0) {
      console.log('ERROR: No hay conceptos seleccionados');
      setError('Debes seleccionar al menos un concepto');
      setSubmitting(false);
      return;
    }

    console.log('Pasó validación, iniciando loop...');
    





    if (conceptosActivos === 0) {
      setError('Debes seleccionar al menos un concepto');
      setSubmitting(false);
      return;
    }

    try {
      // Crear un ticket por cada concepto seleccionado
      let successCount = 0;
      let errorMessages = [];

      for (const [conceptoId, concepto] of Object.entries(conceptosSeleccionados)) {
        console.log('Procesando concepto:', conceptoId, concepto);
        const ticketData = {
        
          empresa: parseInt(formData.empresa),
          fecha_alta: formData.fecha_alta,
          prefijo: formData.prefijo.toUpperCase(),
          contenedor: formData.contenedor?.toUpperCase() || '',
          bl_master: formData.bl_master.toUpperCase(),
          pedimento: formData.pedimento?.toUpperCase() || '',
          eta: formData.eta || null,
          dias_libres: parseInt(formData.dias_libres) || 7,
          divisa: formData.divisa,
          importe: parseFloat(concepto.monto) || 0,
          // El comentario generado incluye el concepto
          observaciones: concepto.comentario + (formData.observaciones ? `\n${formData.observaciones}` : ''),
          tipo_operacion: isRevalidaciones ? 'revalidaciones' : 
                          isLogistica ? 'logistica' : 
                          isClasificacion ? 'clasificacion' : 'revalidaciones',
          puerto: puertoId || null
        };
        console.log('ticketData a enviar:', ticketData);
        try {
          await onSave(ticketData);
          console.log('Ticket guardado exitosamente');
          successCount++;
        } catch (err) {
          errorMessages.push(`${concepto.nombre}: ${err.message || 'Error'}`);
        }
      }

      if (successCount === conceptosActivos) {
        // Todos guardados exitosamente - el onSave ya maneja la redirección
      } else if (errorMessages.length > 0) {
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
      // Deseleccionar todos
      setConceptosSeleccionados({});
    } else {
      // Seleccionar todos
      const todos = {};
      conceptosDisponibles.forEach(c => {
        todos[c.id] = {
          nombre: c.nombre,
          monto: '',
          comentario: generarComentario(c.nombre)
        };
      });
      setConceptosSeleccionados(todos);
    }
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
            <FileText className="mr-2 text-blue-600" /> Alta de Pago
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
              {!isRevalidaciones && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block"># Contenedor *</label>
                  <input
                    name="contenedor"
                    value={formData.contenedor}
                    onChange={handleChange}
                    required
                    placeholder="ABCD1234567"
                    className="w-full p-2 border rounded text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">BL Master *</label>
                <input
                  name="bl_master"
                  value={formData.bl_master}
                  onChange={handleChange}
                  required
                  placeholder="BL123456"
                  className="w-full p-2 border rounded text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Naviera</label>
                <select
                  name="naviera"
                  value={formData.naviera}
                  onChange={handleChange}
                  className="w-full p-2 border rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {navieras?.filter(n => n.activo !== false).map(n => (
                    <option key={n.id} value={n.id}>{n.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Pedimento</label>
                <input
                  name="pedimento"
                  value={formData.pedimento}
                  onChange={handleChange}
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
                  min="0"
                  className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Preview del consecutivo */}
            <div className="mt-4 p-3 bg-slate-800 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Referencia base</span>
                <span className="font-mono text-sm font-bold text-yellow-400 tracking-wide">
                  {formData.prefijo || '---'} {consecutivoEditable} | {isRevalidaciones ? (formData.bl_master || '---') : (formData.contenedor || '---')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Consecutivo</span>
                <input
                  type="text"
                  value={consecutivoEditable}
                  onChange={handleConsecutivoChange}
                  className="w-16 bg-slate-700 text-white text-lg font-bold text-center rounded border border-slate-600 focus:border-yellow-400 outline-none"
                  maxLength={5}
                />
              </div>
            </div>
          </div>

          {/* Sección: Selección de conceptos */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-blue-800 uppercase">
                Conceptos a registrar ({conceptosActivos} seleccionados)
              </h3>
              <div className="flex items-center gap-3">
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
            
            {/* Grid de conceptos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {conceptosDisponibles.map(concepto => {
                const isSelected = !!conceptosSeleccionados[concepto.id];
                return (
                  <div 
                    key={concepto.id}
                    className={`rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-white shadow-md' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Header del concepto (clickeable) */}
                    <button
                      type="button"
                      onClick={() => toggleConcepto(concepto.id, concepto.nombre)}
                      className="w-full p-3 flex items-center justify-between"
                    >
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                        {concepto.nombre}
                      </span>
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200'
                      }`}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </button>
                    
                    {/* Input de monto (solo si está seleccionado) */}
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
                            className="w-full pl-5 p-1.5 border border-blue-300 rounded text-sm text-right outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        {/* Preview del comentario generado */}
                        <p className="text-[9px] text-slate-400 mt-1 truncate" title={conceptosSeleccionados[concepto.id]?.comentario}>
                          {conceptosSeleccionados[concepto.id]?.comentario}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total calculado */}
            {conceptosActivos > 0 && (
              <div className="mt-4 p-3 bg-emerald-100 rounded-lg border border-emerald-200 flex justify-between items-center">
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