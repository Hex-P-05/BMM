// src/modals/EditModal.jsx
import React, { useState, useEffect } from 'react';
import { Edit, X, AlertCircle, Loader2 } from 'lucide-react';

const EditModal = ({ isOpen, onClose, onSave, item, role, loading }) => {
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');

  // Sincronizar con item cuando cambia
  useEffect(() => {
    if (item) {
      setEditData({
        ...item,
        // Mapear campos del backend a los del frontend si es necesario
        eta: item.eta || '',
        dias_libres: item.dias_libres ?? item.freeDays ?? 7,
        importe: item.importe ?? item.amount ?? 0,
        contenedor: item.contenedor || item.container || '',
        bl_master: item.bl_master || item.bl || ''
      });
      setError('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const isRestricted = role !== 'admin';
  const edicionesUsadas = item.contador_ediciones ?? item.editCount ?? 0;
  const edicionesRestantes = Math.max(0, 2 - edicionesUsadas);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError('');

    // Validaciones
    if (!editData.eta) {
      setError('La fecha ETA es requerida');
      return;
    }

    // Preparar datos para enviar
    const dataToSave = {
      id: editData.id,
      eta: editData.eta,
      dias_libres: parseInt(editData.dias_libres) || 7,
    };

    // Si es admin, puede editar más campos
    if (!isRestricted) {
      dataToSave.importe = parseFloat(editData.importe) || 0;
      dataToSave.observaciones = editData.observaciones;
    }

    try {
      await onSave(dataToSave);
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="bg-blue-50 p-6 border-b border-blue-100 flex justify-between items-center sticky top-0 z-20">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Edit size={20} className="mr-2 text-blue-600" />
              Editar operación
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isRestricted ? (
                <span className={edicionesRestantes === 0 ? 'text-red-500' : 'text-amber-600'}>
                  Modo restringido • {edicionesRestantes} ediciones restantes
                </span>
              ) : (
                <span className="text-green-600">Modo administrador • Sin restricciones</span>
              )}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Advertencia de ediciones para ejecutivos */}
          {isRestricted && edicionesRestantes <= 1 && (
            <div className="bg-amber-50 text-amber-700 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              {edicionesRestantes === 0 
                ? 'Has alcanzado el límite de ediciones. Contacta al administrador.'
                : 'Esta es tu última edición disponible para este contenedor.'
              }
            </div>
          )}

          {/* Campos no editables (solo lectura) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">BL Master</label>
              <input
                disabled
                value={editData.bl_master || ''}
                className="w-full p-2 border rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Contenedor</label>
              <input
                disabled
                value={editData.contenedor || ''}
                className="w-full p-2 border rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          {/* Campos editables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center">
                Fecha ETA
                <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  Editable
                </span>
              </label>
              <input
                type="date"
                name="eta"
                value={editData.eta || ''}
                onChange={handleChange}
                disabled={isRestricted && edicionesRestantes === 0}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center">
                Días libres
                <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  Editable
                </span>
              </label>
              <input
                type="number"
                name="dias_libres"
                value={editData.dias_libres || 7}
                onChange={handleChange}
                min="0"
                disabled={isRestricted && edicionesRestantes === 0}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Campos solo para admin */}
          {!isRestricted && (
            <div className="border-t pt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
                Campos de administrador
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Importe</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400">$</span>
                    <input
                      type="number"
                      name="importe"
                      value={editData.importe || 0}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-7 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Divisa</label>
                  <select
                    name="divisa"
                    value={editData.divisa || 'MXN'}
                    onChange={handleChange}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Observaciones</label>
                <textarea
                  name="observaciones"
                  value={editData.observaciones || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Info adicional */}
          {isRestricted && (
            <p className="text-[10px] text-slate-400 italic">
              * Como usuario de Revalidaciones, solo puedes editar ETA y días libres. 
              Para modificar otros campos, contacta al administrador.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 sticky bottom-0 z-20">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (isRestricted && edicionesRestantes === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-sm font-bold flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;