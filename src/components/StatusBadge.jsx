// src/components/StatusBadge.jsx
import React from 'react';
import { Lock, Check, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const StatusBadge = ({ item }) => {
  // Compatibilidad: backend usa 'estatus', frontend viejo usa 'status'
  const estatus = item.estatus || item.status;
  const semaforo = item.semaforo || item.status;
  const payment = item.estatus_pago || item.payment;
  const paymentDelay = item.dias_retraso_pago || item.paymentDelay || 0;

  // Si está cerrado
  if (estatus === 'cerrado' || estatus === 'closed') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-white shadow-md">
        <Lock size={12} className="mr-1" />
        CERRADO
      </span>
    );
  }

  // Si está pagado
  if (estatus === 'pagado' || payment === 'paid' || payment === 'pagado') {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${paymentDelay > 0 ? 'bg-slate-700' : 'bg-blue-600'}`}>
        <Check size={14} className="mr-1" strokeWidth={3} />
        {paymentDelay > 0 ? 'PAGADO (Retraso)' : 'PAGADO'}
      </span>
    );
  }

  // Configuración de semáforo
  const config = {
    // Backend
    verde: { color: 'bg-emerald-500 text-white', icon: CheckCircle, label: 'En tiempo' },
    amarillo: { color: 'bg-amber-500 text-white', icon: Clock, label: 'Atención' },
    rojo: { color: 'bg-rose-600 text-white', icon: AlertTriangle, label: 'Crítico' },
    vencido: { color: 'bg-slate-800 text-white', icon: AlertTriangle, label: 'Vencido' },
    // Frontend viejo
    ok: { color: 'bg-emerald-500 text-white', icon: CheckCircle, label: 'En tiempo' },
    warning: { color: 'bg-amber-500 text-white', icon: Clock, label: 'Atención' },
    danger: { color: 'bg-rose-600 text-white', icon: AlertTriangle, label: 'Crítico' },
    expired: { color: 'bg-slate-800 text-white', icon: AlertTriangle, label: 'Vencido' },
  };
  
  const current = config[semaforo] || config.verde || config.ok;
  const Icon = current.icon;

  // Calcular días restantes
  const getDiasRestantes = () => {
    if (item.dias_restantes !== undefined) return item.dias_restantes;
    if (item.dias_libres_restantes !== undefined) return item.dias_libres_restantes;
    
    // Calcular si tenemos ETA y días libres
    if (item.eta && (item.dias_libres !== undefined || item.freeDays !== undefined)) {
      const eta = new Date(item.eta);
      const diasLibres = item.dias_libres ?? item.freeDays ?? 7;
      const fechaLimite = new Date(eta);
      fechaLimite.setDate(fechaLimite.getDate() + diasLibres);
      const hoy = new Date();
      const diffTime = fechaLimite - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    return null;
  };

  const diasRestantes = getDiasRestantes();
  
  return (
    <div className="flex flex-col items-center">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${current.color}`}>
        <Icon size={12} className="mr-1" />
        {current.label}
      </span>
      {diasRestantes !== null && (
        <span className="text-[10px] text-slate-500 mt-1">
          {diasRestantes > 0 ? `${diasRestantes} días restantes` : diasRestantes === 0 ? 'Vence hoy' : `${Math.abs(diasRestantes)} días vencido`}
        </span>
      )}
    </div>
  );
};

export default StatusBadge;