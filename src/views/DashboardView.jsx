// src/views/DashboardView.jsx
import React from 'react';
import { Ship, Clock, AlertTriangle, DollarSign, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import KPICard from '../components/KPICard';
import { COLORS } from '../data/constants';
import { formatCurrency } from '../utils/helpers';

const DashboardView = ({ data = [], dashboard, loading, onRefresh }) => {
  // Si hay datos del backend (endpoint /dashboard/), usarlos
  // Si no, calcular desde los tickets locales
  const kpis = dashboard?.kpis || {
    contenedores_activos: data.filter(i => i.estatus === 'pendiente').length,
    alertas_preventivas: data.filter(i => i.semaforo === 'amarillo').length,
    casos_criticos: data.filter(i => i.semaforo === 'rojo' || i.semaforo === 'vencido').length,
    monto_por_cobrar: data.filter(i => i.estatus === 'pendiente').reduce((acc, curr) => acc + parseFloat(curr.importe || 0), 0)
  };

  // Datos para la gráfica de pie
  const statusData = [
    { name: 'A tiempo', value: Math.max(0, kpis.contenedores_activos - kpis.alertas_preventivas - kpis.casos_criticos), color: COLORS.ok },
    { name: 'En riesgo', value: kpis.alertas_preventivas, color: COLORS.warning },
    { name: 'Críticos', value: kpis.casos_criticos, color: COLORS.danger }
  ].filter(item => item.value > 0);

  // Datos por empresa (del backend o calculados)
  const porEmpresa = dashboard?.por_empresa || [];

  // Datos por estatus
  const porEstatus = dashboard?.por_estatus || [
    { estatus: 'pendiente', cantidad: data.filter(i => i.estatus === 'pendiente').length },
    { estatus: 'pagado', cantidad: data.filter(i => i.estatus === 'pagado').length },
    { estatus: 'cerrado', cantidad: data.filter(i => i.estatus === 'cerrado').length }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header con botón de refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Resumen de operaciones en tiempo real</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Contenedores activos"
          value={kpis.contenedores_activos}
          icon={Ship}
          colorClass="bg-blue-100 text-blue-600"
          subtext="operaciones pendientes"
        />
        <KPICard
          title="Alertas preventivas"
          value={kpis.alertas_preventivas}
          icon={Clock}
          colorClass="bg-amber-100 text-amber-600"
          subtext="10-21 días restantes"
        />
        <KPICard
          title="Casos críticos"
          value={kpis.casos_criticos}
          icon={AlertTriangle}
          colorClass="bg-rose-100 text-rose-600"
          subtext="< 10 días o vencidos"
        />
        <KPICard
          title="Por cobrar"
          value={formatCurrency(kpis.monto_por_cobrar)}
          icon={DollarSign}
          colorClass="bg-emerald-100 text-emerald-600"
          subtext="total pendiente"
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica de barras - Por empresa */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-600" />
            Operaciones por Empresa
          </h3>
          {porEmpresa.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porEmpresa.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="empresa__nombre" 
                    type="category" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'cantidad' ? value : formatCurrency(value),
                      name === 'cantidad' ? 'Contenedores' : 'Monto'
                    ]}
                  />
                  <Bar dataKey="cantidad" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded text-slate-400">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 size={24} className="animate-spin mr-2" />
                  Cargando datos...
                </div>
              ) : (
                'Sin datos para mostrar'
              )}
            </div>
          )}
        </div>

        {/* Gráfica de pie - Estado de operaciones */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Estado de Operaciones</h3>
          {statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Contenedores']} />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded text-slate-400">
              Sin operaciones
            </div>
          )}
        </div>
      </div>

      {/* Tabla resumen por estatus */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Resumen por Estatus</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {porEstatus.map((item) => {
            const config = {
              pendiente: { label: 'Pendientes', color: 'bg-amber-500', bgColor: 'bg-amber-50' },
              pagado: { label: 'Pagados', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
              cerrado: { label: 'Cerrados', color: 'bg-slate-500', bgColor: 'bg-slate-50' }
            };
            const cfg = config[item.estatus] || config.pendiente;
            
            return (
              <div key={item.estatus} className={`${cfg.bgColor} p-4 rounded-lg border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{cfg.label}</p>
                    <p className="text-2xl font-bold text-slate-800">{item.cantidad}</p>
                  </div>
                  <div className={`w-3 h-12 ${cfg.color} rounded-full`}></div>
                </div>
                {item.monto && (
                  <p className="text-xs text-slate-500 mt-2">
                    Total: {formatCurrency(item.monto)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tickets recientes */}
      {data.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Últimos contenedores</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 font-bold text-slate-600">Contenedor</th>
                  <th className="text-left p-3 font-bold text-slate-600">Empresa</th>
                  <th className="text-left p-3 font-bold text-slate-600">Comentarios</th>
                  <th className="text-right p-3 font-bold text-slate-600">Importe</th>
                  <th className="text-center p-3 font-bold text-slate-600">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 5).map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">{ticket.contenedor}</td>
                    <td className="p-3">{ticket.empresa?.nombre || ticket.empresa}</td>
                    <td className="p-3 text-slate-600">{ticket.comentarios}</td>
                    <td className="p-3 text-right font-bold">{formatCurrency(ticket.importe)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        ticket.estatus === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                        ticket.estatus === 'pagado' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {ticket.estatus?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;