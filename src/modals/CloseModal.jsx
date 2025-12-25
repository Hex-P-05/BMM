// src/modals/CloseModal.jsx
import React from 'react';
import { CheckCircle, X, Download } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';

const CloseModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  const handleCloseAndDownload = () => {
    generatePDF([item], `Comprobante_${item.bl_master || item.bl || item.contenedor}.pdf`); 
    onClose();
  };

  // Helper para obtener valores con compatibilidad backend/frontend
  const getCost = (backendKey, frontendKey) => {
    return parseFloat(item[backendKey] ?? item[frontendKey] ?? 0) || 0;
  };

  const getImporte = () => {
    return parseFloat(item.importe ?? item.amount ?? 0) || 0;
  };

  const costList = [
    { l: 'Demoras', v: getCost('costo_demoras', 'costDemoras') },
    { l: 'Almacenaje', v: getCost('costo_almacenaje', 'costAlmacenaje') },
    { l: 'Costos operativos', v: getCost('costo_operativos', 'costOperativos') },
    { l: 'Gastos portuarios', v: getCost('costo_gastos_portuarios', 'costPortuarios') },
    { l: 'Apoyo', v: getCost('costo_apoyo', 'costApoyo') },
    { l: 'Impuestos', v: getCost('costo_impuestos', 'costImpuestos') },
    { l: 'Liberación', v: getCost('costo_liberacion', 'costLiberacion') },
    { l: 'Transporte', v: getCost('costo_transporte', 'costTransporte') }
  ].filter(c => c.v > 0);

  const totalImporte = getImporte();
  const divisa = item.divisa || item.currency || 'MXN';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold flex items-center">
              <CheckCircle className="mr-2"/> Cerrar operación
            </h3>
            <p className="text-emerald-100 text-sm">Se generará el registro final del contenedor.</p>
          </div>
          <button onClick={onClose}>
            <X className="text-white hover:bg-emerald-700 rounded p-1" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">Resumen financiero</h4>
            
            {costList.length > 0 ? (
              costList.map((c, i) => (
                <div key={i} className="flex justify-between border-b border-slate-50 pb-2 mb-2 text-sm">
                  <span className="text-slate-600">{c.l}</span>
                  <span className="font-bold text-slate-800">${c.v.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 text-sm py-4">Sin desglose de costos</p>
            )}
            
            <div className="mt-4 p-3 bg-slate-100 rounded flex justify-between items-center font-bold text-slate-800 border border-slate-200">
              <span>TOTAL FINAL</span>
              <span>${totalImporte.toLocaleString()} {divisa}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t bg-white flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            Confirmar y cerrar
          </button>
          <button 
            onClick={handleCloseAndDownload} 
            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg flex justify-center items-center gap-2"
          >
            <Download size={18} /> Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseModal;