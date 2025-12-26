// src/views/CaptureForm.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useCatalogos } from '../hooks/useCatalogos';
import api from '../api/axios';

const CaptureForm = ({ onSave, onCancel, role, userName }) => {
  // Acceso denegado para rol pagos
  if (role === 'pagos') {
    return (
      <div className="p-10 text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <p className="text-red-500 font-bold">Acceso denegado</p>
        <p className="text-slate-500 text-sm mt-2">No tienes permisos para crear contenedores.</p>
      </div>
    );
  }

  // Hook de catálogos del backend
  const { empresas, conceptos, proveedores, loading: catalogosLoading } = useCatalogos();

  const [formData, setFormData] = useState({
    empresa: '',
    fecha_alta: new Date().toISOString().split('T')[0],
    concepto: '',
    prefijo: '',
    contenedor: '',
    pedimento: '',
    factura: '',
    proveedor: '',
    bl_master: '',
    eta: '',
    dias_libres: 7,
    divisa: 'MXN',
    // Desglose de costos
    costo_demoras: 0,
    costo_almacenaje: 0,
    costo_operativos: 0,
    costo_gastos_portuarios: 0,
    costo_apoyo: 0,
    costo_impuestos: 0,
    costo_liberacion: 0,
    costo_transporte: 0,
    observaciones: ''
  });

  const [proveedorData, setProveedorData] = useState({ banco: '', cuenta: '', clabe: '' });
  const [generatedComments, setGeneratedComments] = useState('');
  const [previewConsecutivo, setPreviewConsecutivo] = useState('#');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calcular importe total automáticamente
  const importeTotal = 
    (parseFloat(formData.costo_demoras) || 0) +
    (parseFloat(formData.costo_almacenaje) || 0) +
    (parseFloat(formData.costo_operativos) || 0) +
    (parseFloat(formData.costo_gastos_portuarios) || 0) +
    (parseFloat(formData.costo_apoyo) || 0) +
    (parseFloat(formData.costo_impuestos) || 0) +
    (parseFloat(formData.costo_liberacion) || 0) +
    (parseFloat(formData.costo_transporte) || 0);
  // Obtener siguiente consecutivo del backend
  useEffect(() => {
    const fetchConsecutivo = async () => {
      if (formData.prefijo && formData.prefijo.length >= 2) {
        try {
          const response = await api.get(`/operaciones/tickets/siguiente_consecutivo/?prefijo=${formData.prefijo.toUpperCase()}`);
          setPreviewConsecutivo(response.data.siguiente_consecutivo);
        } catch (err) {
          console.error('Error fetching consecutivo:', err);
          setPreviewConsecutivo(1);
        }
      } else {
        setPreviewConsecutivo('#');
      }
    };

    const timeoutId = setTimeout(fetchConsecutivo, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.prefijo]);

  // Generar comentarios automáticamente
  useEffect(() => {
    const conceptoNombre = conceptos.find(c => c.id === parseInt(formData.concepto))?.nombre || '...';
    const cleanContenedor = formData.contenedor ? formData.contenedor.toUpperCase() : '';
    const cleanPrefijo = formData.prefijo ? formData.prefijo.toUpperCase() : '...';
    const consecutivo = previewConsecutivo !== '#' ? previewConsecutivo : '#';

    const comment = `${conceptoNombre} ${cleanPrefijo} ${consecutivo} ${cleanContenedor}`;
    setGeneratedComments(comment);
  }, [formData.prefijo, formData.concepto, formData.contenedor, previewConsecutivo, conceptos]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'prefijo') {
      if (value.length <= 10) {
        setFormData({ ...formData, [name]: value.toUpperCase() });
      }
      return;
    }

    if (name === 'proveedor') {
      const prov = proveedores.find(p => p.id === parseInt(value));
      if (prov) {
        setProveedorData({
          banco: prov.banco || '',
          cuenta: prov.cuenta || '',
          clabe: prov.clabe || ''
        });
      } else {
        setProveedorData({ banco: '', cuenta: '', clabe: '' });
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Preparar datos para el backend
      const ticketData = {
        empresa: parseInt(formData.empresa),
        fecha_alta: formData.fecha_alta,
        concepto: parseInt(formData.concepto),
        prefijo: formData.prefijo.toUpperCase(),
        contenedor: formData.contenedor.toUpperCase(),
        bl_master: formData.bl_master.toUpperCase(),
        pedimento: formData.pedimento.toUpperCase(),
        factura: formData.factura.toUpperCase(),
        proveedor: formData.proveedor ? parseInt(formData.proveedor) : null,
        eta: formData.eta || null,
        dias_libres: parseInt(formData.dias_libres) || 7,
        divisa: formData.divisa,
        // Importe total calculado
        importe: importeTotal,
        // Desglose de costos
        costo_demoras: parseFloat(formData.costo_demoras) || 0,
        costo_almacenaje: parseFloat(formData.costo_almacenaje) || 0,
        costo_operativos: parseFloat(formData.costo_operativos) || 0,
        costo_gastos_portuarios: parseFloat(formData.costo_gastos_portuarios) || 0,
        costo_apoyo: parseFloat(formData.costo_apoyo) || 0,
        costo_impuestos: parseFloat(formData.costo_impuestos) || 0,
        costo_liberacion: parseFloat(formData.costo_liberacion) || 0,
        costo_transporte: parseFloat(formData.costo_transporte) || 0,
        observaciones: formData.observaciones
      };

      await onSave(ticketData);

    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.response?.data?.detail || 'Error al crear el contenedor');
    } finally {
      setSubmitting(false);
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
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FileText className="mr-2 text-blue-600" /> Alta de contenedor
          </h2>
          <p className="text-xs text-slate-500">Ejecutivo: <b>{userName}</b></p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
              <AlertCircle size={18} className="mr-2" />
              {error}
            </div>
          )}

          {/* Sección: Datos de identificación */}
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
            <h3 className="text-xs font-bold text-blue-800 uppercase mb-4">Datos de identificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 mb-1 block">Empresa *</label>
                <select
                  required
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full p-2 border rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {empresas.filter(e => e.activo !== false).map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Fecha alta</label>
                <input
                  type="date"
                  name="fecha_alta"
                  value={formData.fecha_alta}
                  onChange={handleChange}
                  className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Prefijo *</label>
                <input
                  required
                  name="prefijo"
                  value={formData.prefijo}
                  onChange={handleChange}
                  placeholder="Ej. IMP"
                  className="w-full p-2 border rounded text-sm uppercase font-bold text-center tracking-widest border-blue-300 focus:bg-blue-50 outline-none"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Concepto *</label>
                <select
                  required
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  className="w-full p-2 border rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {conceptos.filter(c => c.activo !== false).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Contenedor *</label>
                <input
                  required
                  name="contenedor"
                  value={formData.contenedor}
                  onChange={handleChange}
                  placeholder="MSKU1234567"
                  className="w-full p-2 border rounded text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">BL Master *</label>
                <input
                  required
                  name="bl_master"
                  value={formData.bl_master}
                  onChange={handleChange}
                  placeholder="HLCU12345678"
                  className="w-full p-2 border rounded text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Comentarios generados */}
            <div className="mt-4 p-3 bg-slate-800 text-white rounded-lg flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Comentarios (Generado Automáticamente)</span>
                <span className="font-mono text-sm font-bold text-yellow-400 tracking-wide">{generatedComments}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Consecutivo</span>
                <span className="font-bold text-white text-lg">{previewConsecutivo}</span>
              </div>
            </div>
          </div>

          {/* Sección: Datos financieros y proveedor */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-600 uppercase mb-4">Datos financieros y proveedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Proveedor</label>
                <select
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleChange}
                  className="w-full p-2 border rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {proveedores.filter(p => p.activo !== false).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">Banco</label>
                  <input readOnly value={proveedorData.banco} className="w-full p-2 bg-slate-200 border rounded text-xs font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">Cuenta</label>
                  <input readOnly value={proveedorData.cuenta} className="w-full p-2 bg-slate-200 border rounded text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">CLABE</label>
                  <input readOnly value={proveedorData.clabe} className="w-full p-2 bg-slate-200 border rounded text-xs" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
                <label className="text-xs font-bold text-slate-600 mb-1 block">Factura</label>
                <input
                  name="factura"
                  value={formData.factura}
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
          </div>

          {/* Sección: Desglose de costos */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase">Desglose de costos</h3>
              <select
                name="divisa"
                value={formData.divisa}
                onChange={handleChange}
                className="text-xs p-1 border rounded font-bold text-blue-600 bg-white"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'costo_demoras', label: 'Demoras' },
                { name: 'costo_almacenaje', label: 'Almacenaje' },
                { name: 'costo_operativos', label: 'Costos Operativos' },
                { name: 'costo_gastos_portuarios', label: 'Gastos Portuarios' },
                { name: 'costo_apoyo', label: 'Apoyo' },
                { name: 'costo_impuestos', label: 'Impuestos' },
                { name: 'costo_liberacion', label: 'Liberación' },
                { name: 'costo_transporte', label: 'Transporte' }
              ].map(field => (
                <div key={field.name}>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{field.label}</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-5 p-1.5 border rounded text-sm text-right outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total calculado */}
            <div className="mt-4 p-3 bg-emerald-100 rounded-lg border border-emerald-200 flex justify-between items-center">
              <span className="text-sm font-bold text-emerald-800 uppercase">Total a registrar:</span>
              <span className="text-xl font-bold text-emerald-800">
                ${importeTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} 
                <span className="text-xs font-normal text-emerald-600 ml-1">{formData.divisa}</span>
              </span>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales..."
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
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center shadow-lg font-bold transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Lock size={16} className="mr-2" />
                  Dar de alta
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