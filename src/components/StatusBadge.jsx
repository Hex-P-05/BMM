// src/components/StatusBadge.jsx
import React from 'react';
import { Lock, Check, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const StatusBadge = ({ item }) => {
  if (item.status === 'closed') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-white shadow-md">
        <Lock size={12} className="mr-1" />
        CERRADO
      </span>
    );
  }

  if (item.payment === 'paid') {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${item.paymentDelay > 0 ? 'bg-slate-700' : 'bg-blue-600'}`}>
        <Check size={14} className="mr-1" strokeWidth={3} />
        {item.paymentDelay > 0 ? 'PAGADO (Retraso)' : 'PAGADO'}
      </span>
    );
  }

  const config = {
    ok: { color: 'bg-emerald-500 text-white', icon: CheckCircle, label: 'En tiempo' },
    warning: { color: 'bg-amber-500 text-white', icon: Clock, label: 'Atención' },
    danger: { color: 'bg-rose-600 text-white', icon: AlertTriangle, label: 'Crítico' },
    expired: { color: 'bg-slate-800 text-white', icon: AlertTriangle, label: 'Vencido' },
  };
  
  const current = config[item.status] || config.ok;
  const Icon = current.icon;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${current.color}`}>
      <Icon size={12} className="mr-1" />
      {current.label}
    </span>
  );
};
export default StatusBadge;