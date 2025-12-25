// src/views/DashboardView.jsx
import React from 'react';
import { Ship, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import KPICard from '../components/KPICard';
import { COLORS } from '../data/constants';

const DashboardView = ({ data }) => {
  const total = data.length;
  const warning = data.filter(i => i.status === 'warning' && i.payment === 'pending').length;
  const danger = data.filter(i => (i.status === 'danger' || i.status === 'expired') && i.payment === 'pending').length;
  const pendingMoney = data.filter(i => i.payment === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const statusData = [{ name: 'A tiempo', value: total - warning - danger }, { name: 'Riesgo', value: warning }, { name: 'Penalizado', value: danger }];
  
  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Contenedores activos" value={total} icon={Ship} colorClass="bg-blue-100 text-blue-600" trend="up" trendValue="+12%" subtext="vs mes pasado" />
        <KPICard title="Alertas (próximos)" value={warning} icon={Clock} colorClass="bg-amber-100 text-amber-600" trend="down" trendValue="-5%" subtext="mejoría" />
        <KPICard title="Críticos (vencidos)" value={danger} icon={AlertTriangle} colorClass="bg-rose-100 text-rose-600" trend="up" trendValue="+2" subtext="requiere atención" />
        <KPICard title="Cuentas por cobrar" value={`$${(pendingMoney/1000).toFixed(1)}k`} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-600" trend="up" trendValue="+8%" subtext="flujo proyectado" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Estado General</h3>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded text-slate-400">Gráficas Originales Conservadas</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="h-48 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value"><Cell fill={COLORS.ok} /><Cell fill={COLORS.warning} /><Cell fill={COLORS.danger} /></Pie><Tooltip /><Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" /></PieChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
};
export default DashboardView;