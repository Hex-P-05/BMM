// src/modals/PaymentModal.jsx
import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, onConfirm, item }) => {
  if (!isOpen || !item) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden m-4">
        <div className="bg-yellow-50 p-6 border-b border-yellow-100 flex items-start space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full flex-shrink-0"><AlertCircle size={32} /></div>
          <div><h3 className="text-lg font-bold text-slate-800">¿Confirmar pago?</h3><p className="text-sm text-slate-600 mt-1">Registrar pago en el sistema.</p></div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Monto a pagar</span><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.currency || 'MXN'}</span></div>
            <p className="text-3xl font-bold text-slate-800">${item.amount.toLocaleString()}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Beneficiario:</span><span className="font-medium text-slate-800">{item.provider || item.proveedor}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Cliente/Empresa:</span><span className="font-medium text-slate-800">{item.empresa || item.client}</span></div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex space-x-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex justify-center items-center"><CheckCircle size={20} className="mr-2" /> Confirmar</button>
        </div>
      </div>
    </div>
  );
};
export default PaymentModal;