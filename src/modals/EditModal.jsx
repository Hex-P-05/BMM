// src/modals/EditModal.jsx
import React, { useState, useEffect } from 'react';
import { Edit, X } from 'lucide-react';

const EditModal = ({ isOpen, onClose, onSave, item, role }) => {
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (item) {
      setEditData({ ...item });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Permisos:
  // - admin: puede editar todo
  // - revalidaciones: solo puede editar ETA, fechas, días libres
  // - pagos: no puede editar (no debería llegar aquí)
  const isAdmin = role === 'admin';
  const isRevalidaciones = role === 'revalidaciones';
  const canEditAll = isAdmin;
  const canEditDatesOnly = isRevalidaciones;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name.startsWith('cost') || name.startsWith('costo_') ? (parseFloat(value) || 0) : value;
    
    if (name.startsWith('cost') || name.startsWith('costo_')) {
      const newData = { ...editData, [name]: val };
      // Calcular total (compatibilidad con ambos nombres de campos)
      const total = 
        (parseFloat(newData.costo_demoras) || parseFloat(newData.costDemoras) || 0) + 
        (parseFloat(newData.costo_almacenaje) || parseFloat(newData.costAlmacenaje) || 0) + 
        (parseFloat(newData.costo_operativos) || parseFloat(newData.costOperativos) || 0) + 
        (parseFloat(newData.costo_gastos_portuarios) || parseFloat(newData.costPortuarios) || 0) + 
        (parseFloat(newData.costo_apoyo) || parseFloat(newData.costApoyo) || 0) + 
        (parseFloat(newData.costo_impuestos) || parseFloat(newData.costImpuestos) || 0) + 
        (parseFloat(newData.costo_liberacion) || parseFloat(newData.costLiberacion) || 0) + 
        (parseFloat(newData.costo_transporte) || parseFloat(newData.costTransporte) || 0);
      setEditData({ ...newData, importe: total, amount: total });
    } else {
      setEditData({ ...editData, [name]: value });
    }
  };

  const costInputs = [
    { key: 'costo_demoras', keyOld: 'costDemoras', label: 'Demoras' }, 
    { key: 'costo_almacenaje', keyOld: 'costAlmacenaje', label: 'Almacenaje' },
    { key: 'costo_operativos', keyOld: 'costOperativos', label: 'Costos operativos' }, 
    { key: 'costo_gastos_portuarios', keyOld: 'costPortuarios', label: 'Gastos portuarios' },
    { key: 'costo_apoyo', keyOld: 'costApoyo', label: 'Apoyo' }, 
    { key: 'costo_impuestos', keyOld: 'costImpuestos', label: 'Impuestos' },
    { key: 'costo_liberacion', keyOld: 'costLiberacion', label: 'Liberación abandono' }, 
    { key: 'costo_transporte', keyOld: 'costTransporte', label: 'Transporte' },
  ];

  const getTotal = () => {
    return parseFloat(editData.importe) || parseFloat(editData.amount) || 0;
  };

  const getCostValue = (key, keyOld) => {
    return editData[key] ?? editData[keyOld] ?? 0;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto m-4">
        <div className="bg-blue-50 p-6 border-b border-blue-100 flex justify-between items-center sticky top-0 z-20">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Edit size={20} className="mr-2 text-blue-600"/> Editar contenedor
            </h3>
            <p className="text-xs text-slate-500 hidden sm:block">
              {canEditAll ? 'Modo administrador - Edición completa' : 
               canEditDatesOnly ? 'Modo revalidaciones - Solo fechas y días libres' : 
               'Sin permisos de edición'}
            </p>
          </div>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* BL - Solo lectura para todos */}
          <div className="col-span-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">BL (master)</label>
            <input 
              disabled 
              name="bl" 
              value={editData.bl_master || editData.bl || ''} 
              className="w-full p-2 border rounded bg-slate-100 text-slate-500 cursor-not-allowed" 
            />
          </div>
          
          {/* Contenedor - Solo lectura para todos */}
          <div className="col-span-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Contenedor</label>
            <input 
              disabled 
              name="container" 
              value={editData.contenedor || editData.container || ''} 
              className="w-full p-2 border rounded bg-slate-100 text-slate-500 cursor-not-allowed" 
            />
          </div>
          
          {/* ETA - Editable por admin y revalidaciones */}
          <div className="col-span-1">
            <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">
              Fecha ETA 
              {canEditDatesOnly && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}
            </label>
            <input 
              type="date" 
              name="eta" 
              value={editData.eta || ''} 
              onChange={handleChange} 
              disabled={!canEditAll && !canEditDatesOnly}
              className={`w-full p-2 border rounded outline-none ${
                (canEditAll || canEditDatesOnly) 
                  ? 'border-slate-300 focus:ring-2 focus:ring-blue-500' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`} 
            />
          </div>
          
          {/* Días libres - Editable por admin y revalidaciones */}
          <div className="col-span-1">
            <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">
              Días libres 
              {canEditDatesOnly && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}
            </label>
            <input 
              type="number" 
              name="dias_libres" 
              value={editData.dias_libres ?? editData.freeDays ?? ''} 
              onChange={handleChange} 
              disabled={!canEditAll && !canEditDatesOnly}
              className={`w-full p-2 border rounded outline-none ${
                (canEditAll || canEditDatesOnly) 
                  ? 'border-slate-300 focus:ring-2 focus:ring-blue-500' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`} 
            />
          </div>

          {/* Fecha de pago - Editable por admin y revalidaciones */}
          <div className="col-span-1">
            <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">
              Fecha de pago 
              {canEditDatesOnly && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}
            </label>
            <input 
              type="date" 
              name="fecha_pago" 
              value={editData.fecha_pago || ''} 
              onChange={handleChange} 
              disabled={!canEditAll && !canEditDatesOnly}
              className={`w-full p-2 border rounded outline-none ${
                (canEditAll || canEditDatesOnly) 
                  ? 'border-slate-300 focus:ring-2 focus:ring-blue-500' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`} 
            />
          </div>

          {/* Fecha de alta - Editable por admin y revalidaciones */}
          <div className="col-span-1">
            <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">
              Fecha de alta 
              {canEditDatesOnly && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}
            </label>
            <input 
              type="date" 
              name="fecha_alta" 
              value={editData.fecha_alta || ''} 
              onChange={handleChange} 
              disabled={!canEditAll && !canEditDatesOnly}
              className={`w-full p-2 border rounded outline-none ${
                (canEditAll || canEditDatesOnly) 
                  ? 'border-slate-300 focus:ring-2 focus:ring-blue-500' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`} 
            />
          </div>

          {/* Desglose de costos - Solo editable por admin */}
          <div className="col-span-1 sm:col-span-2 border-t pt-4 mt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 sm:mb-0">Desglose de costos</label>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                Total: ${getTotal().toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {costInputs.map(field => (
                <div key={field.key}>
                  <label className="text-[10px] font-medium text-slate-500 mb-1 block truncate" title={field.label}>
                    {field.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                    <input 
                      disabled={!canEditAll} 
                      type="number" 
                      name={field.key} 
                      value={getCostValue(field.key, field.keyOld)} 
                      onChange={handleChange} 
                      className={`w-full pl-4 p-2 border rounded text-xs text-right outline-none ${
                        canEditAll 
                          ? 'focus:ring-2 focus:ring-blue-500' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`} 
                    />
                  </div>
                </div>
              ))}
            </div>
            {!canEditAll && (
              <p className="text-[10px] text-red-400 mt-3 italic">
                * Costos editables solo por Administrador.
              </p>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 sticky bottom-0 z-20">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded text-sm font-bold"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave(editData)} 
            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-sm font-bold"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;