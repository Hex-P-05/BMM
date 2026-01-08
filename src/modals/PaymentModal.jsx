// src/modals/PaymentModal.jsx
import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, DollarSign, Check } from 'lucide-react';

const PaymentModal = ({ isOpen, item, onClose, onConfirm, loading }) => {
  const [file, setFile] = useState(null);

  if (!isOpen || !item) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    // Enviamos el ID y el archivo (puede ser null si no subió nada)
    onConfirm(item.id, file);
    setFile(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100">
        
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <DollarSign size={20} /> Registrar Pago
          </h3>
          <button onClick={onClose} className="text-emerald-100 hover:text-white hover:bg-emerald-700 rounded-full p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Resumen del cobro */}
          <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            {/* Identificador de la operación */}
            {(item.bl_master || item.contenedor) && (
              <div className="mb-3 pb-3 border-b border-slate-200">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">
                  {item.bl_master ? 'BL' : 'Contenedor'}
                </p>
                <p className="font-mono font-bold text-blue-700">
                  {item.bl_master || item.contenedor}
                </p>
              </div>
            )}

            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Concepto a liquidar</p>
            <p className="text-slate-800 font-medium text-lg mb-1">
              {item.observaciones?.split(' - ')[0] || item.concepto_nombre || item.comentarios || 'Sin descripción'}
            </p>
            {item.comentarios && item.comentarios !== item.observaciones && (
              <p className="text-xs text-slate-400 font-mono">{item.comentarios}</p>
            )}
            <div className="flex justify-between items-end border-t border-slate-200 pt-2 mt-2">
               <span className="text-xs text-slate-400">Monto:</span>
               <span className="text-xl font-bold text-emerald-600">
                 ${parseFloat(item.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {item.divisa}
               </span>
            </div>
          </div>

          {/* Área de carga de archivo */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              Adjuntar Comprobante (Opcional)
            </label>
            
            <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors relative 
              ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}`}>
              
              <input 
                type="file" 
                id="comprobante-upload" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              
              {!file ? (
                <>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                    <Upload size={24} />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Clic para subir PDF o Imagen</span>
                  <span className="text-xs text-slate-400 mt-1">Máx 5MB</span>
                </>
              ) : (
                <div className="flex items-center gap-3 w-full z-10">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
                    <p className="text-xs text-emerald-600">
                      {(file.size / 1024).toFixed(0)} KB - Listo para subir
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); setFile(null); }} 
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Quitar archivo"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-8 flex gap-3">
            <button 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Confirmar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;