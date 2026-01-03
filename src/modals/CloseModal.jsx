// src/modals/CloseModal.jsx
import React, { useState } from 'react';
import { CheckCircle, X, Download, Loader2 } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';

const CloseModal = ({ isOpen, onClose, onConfirm, item, tickets = [], loading = false }) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen || !item) return null;

  // Si no se pasan tickets, usar el item como único ticket (compatibilidad)
  const ticketList = tickets.length > 0 ? tickets : [item];

  console.log('CloseModal - item:', item);
  console.log('CloseModal - tickets prop:', tickets);
  console.log('CloseModal - ticketList:', ticketList);


  // Calcular total de todos los tickets
  const totalImporte = ticketList.reduce((sum, t) => sum + (parseFloat(t.importe) || 0), 0);
  
  // Obtener divisa del primer ticket
  const divisa = ticketList[0]?.divisa || 'MXN';

  // Identificador del grupo
  const identifier = item.bl_master || item.contenedor || 'Operación';

  const handleConfirmClose = async () => {
    console.log('handleConfirmClose iniciado');
    setIsClosing(true);
    try {
      // Cerrar todos los tickets del grupo
      for (const ticket of ticketList) {
        console.log('Cerrando ticket:', ticket.id);
        if (onConfirm) {
          const result = await onConfirm(ticket.id);
          console.log('Resultado:', result);
        }
      }
      console.log('Todos los tickets cerrados, llamando onClose');
      onClose();
    } catch (err) {
      console.error('Error cerrando operación:', err);
    } finally {
      setIsClosing(false);
    }
};

  const handleCloseAndDownload = async () => {
    // Primero cerrar
    await handleConfirmClose();
    // Luego descargar PDF
    generatePDF(ticketList, `Comprobante_${identifier}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold flex items-center">
              <CheckCircle className="mr-2"/> Cerrar operación
            </h3>
            <p className="text-emerald-100 text-sm">
              {identifier} - {ticketList.length} concepto(s)
            </p>
          </div>
          <button onClick={onClose} disabled={isClosing}>
            <X className="text-white hover:bg-emerald-700 rounded p-1" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">
              Desglose de pagos
            </h4>
            
            {ticketList.length > 0 ? (
              <div className="space-y-2">
                {ticketList.map((ticket, idx) => (
                  <div 
                    key={ticket.id || idx} 
                    className="flex justify-between items-center border-b border-slate-100 pb-2"
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700">
                        {ticket.observaciones?.split(' - ')[0] || ticket.observaciones || 'Concepto'}
                      </span>
                      {ticket.proveedor_nombre && (
                        <span className="text-xs text-slate-400 ml-2">
                          → {ticket.proveedor_nombre}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800">
                        ${parseFloat(ticket.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">{ticket.divisa}</span>
                    </div>
                    <div className="ml-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ticket.estatus === 'cerrado' ? 'bg-slate-200 text-slate-600' :
                        ticket.estatus === 'pagado' ? 'bg-green-100 text-green-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {ticket.estatus === 'cerrado' ? 'Cerrado' : 
                         ticket.estatus === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 text-sm mb-4">Sin desglose de costos</p>
            )}
            
            {/* Total */}
            <div className="mt-4 p-3 bg-slate-100 rounded flex justify-between items-center font-bold text-slate-800 border border-slate-200">
              <span>TOTAL FINAL</span>
              <span>${totalImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {divisa}</span>
            </div>

            {/* Warning si hay tickets pendientes */}
            {ticketList.some(t => t.estatus === 'pendiente') && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                <strong>Atención:</strong> Hay conceptos pendientes de pago. Al cerrar, se marcarán como cerrados.
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-white flex gap-3">
          <button 
            onClick={handleConfirmClose}
            disabled={isClosing || loading}
            className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isClosing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Cerrando...
              </>
            ) : (
              'Confirmar y cerrar'
            )}
          </button>
          <button 
            onClick={handleCloseAndDownload}
            disabled={isClosing || loading}
            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} /> Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseModal;