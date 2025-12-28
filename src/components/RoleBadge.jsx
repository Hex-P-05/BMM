// src/components/RoleBadge.jsx
import React from 'react';

const RoleBadge = ({ role, collapsed }) => {
  const styles = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    revalidaciones: 'bg-blue-100 text-blue-800 border-blue-200',
    logistica: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    pagos: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    clasificacion: 'bg-pink-100 text-pink-800 border-pink-200',
  };

  const labels = {
    admin: 'Admin',
    revalidaciones: 'Revalidaciones',
    logistica: 'Logística',
    pagos: 'Pagos',
    clasificacion: 'Clasificación',
  };

  if (collapsed) {
    return (
      <div className={`w-3 h-3 rounded-full ${styles[role] || styles.revalidaciones} border`}></div>
    );
  }

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border uppercase ${styles[role] || styles.revalidaciones}`}>
      {labels[role] || role}
    </span>
  );
};

// Badge para mostrar el puerto asignado
export const PuertoBadge = ({ codigo, nombre, collapsed }) => {
  const styles = {
    MZN: 'bg-orange-100 text-orange-800 border-orange-200',
    LZC: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const style = styles[codigo] || 'bg-gray-100 text-gray-800 border-gray-200';

  if (collapsed) {
    return (
      <div className={`w-3 h-3 rounded-full ${style} border`}></div>
    );
  }

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border uppercase ${style}`}>
      {codigo || nombre || 'Global'}
    </span>
  );
};

export default RoleBadge;