// src/views/DashboardView.jsx
import React, { useMemo } from 'react';
import { Ship, Clock, AlertTriangle, DollarSign, TrendingUp, Loader2, RefreshCw, CheckCircle, Truck } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import KPICard from '../components/KPICard';
import { formatCurrency, formatDate } from '../utils/helpers';

const CHART_COLORS = {
  transito: '#0ea5e9',
  ok: '#10b981',
  warning: '#f59e0b',
  danger: '#dc2626'
};

// RECIBIMOS "onNavigate" DEL PADRE PARA CAMBIAR PESTAÑA SIN ROUTER
const DashboardView = ({ data = [], loading, onRefresh, onNavigate }) => {

  // -----------------------------------------------------------------------
  // 1. LÓGICA MAESTRA (Semáforos)
  // -----------------------------------------------------------------------
  const calcularEstado = (eta, tipoOperacion) => {
    if (!eta) return { status: 'unknown', color: 'gray' };
    let fechaEta;
    const etaStr = eta.toString();
    if (etaStr.includes('/')) {
      const [dia, mes, anio] = etaStr.split('/');
      fechaEta = new Date(`${anio}-${mes}-${dia}T00:00:00`);
    } else {
      fechaEta = new Date(`${etaStr.substring(0, 10)}T00:00:00`);
    }
    if (isNaN(fechaEta.getTime())) return { status: 'error', color: 'gray' };
    
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const diffMs = hoy - fechaEta;
    const diasTranscurridos = Math.floor(diffMs / (1000 * 60 * 60 * 24)); 

    // Logística (7 Días)
    if (tipoOperacion === 'logistica') {
       if (diasTranscurridos < 0) return { status: 'transito', label: 'En tránsito' };
       if (diasTranscurridos <= 3) return { status: 'ok', label: 'Días libres' };
       if (diasTranscurridos <= 6) return { status: 'warning', label: 'Por vencer' };
       return { status: 'danger', label: 'Almacenaje' };
    } 
    // Revalidación (21 Días)
    else {
        if (diasTranscurridos < 0) return { status: 'transito', label: 'Por arribar' };
        if (diasTranscurridos <= 6) return { status: 'ok', label: 'Libre' };
        if (diasTranscurridos <= 21) return { status: 'warning', label: 'Riesgo' };
        return { status: 'danger', label: 'Demora' };
    }
  };

  // -----------------------------------------------------------------------
  // 2. PROCESAMIENTO DE DATOS
  // -----------------------------------------------------------------------
  const dashboardData = useMemo(() => {
    const gruposUnicos = {};
    let totalDeuda = 0;

    data.forEach(ticket => {
        if (ticket.estatus === 'pendiente') {
            totalDeuda += parseFloat(ticket.importe || 0);
        }
        const key = ticket.bl_master || ticket.contenedor || 'SIN-ID';
        if (!gruposUnicos[key]) {
            gruposUnicos[key] = {
                id: key, eta: ticket.eta, tipo: ticket.tipo_operacion,
                empresa: ticket.empresa_nombre || ticket.empresa, estatus: ticket.estatus, tickets: []
            };
        }
        gruposUnicos[key].tickets.push(ticket);
    });

    const listaOperaciones = Object.values(gruposUnicos);
    const stats = { transito: 0, ok: 0, warning: 0, danger: 0, totalOperaciones: listaOperaciones.length, pendientes: 0 };

    listaOperaciones.forEach(op => {
        if (op.estatus !== 'cerrado') {
            const analisis = calcularEstado(op.eta, op.tipo);
            if (stats[analisis.status] !== undefined) stats[analisis.status]++;
            if (op.estatus === 'pendiente') stats.pendientes++;
        }
    });

    const empresasMap = {};
    listaOperaciones.forEach(op => {
        if(op.estatus !== 'cerrado') empresasMap[op.empresa] = (empresasMap[op.empresa] || 0) + 1;
    });
    
    const chartEmpresas = Object.keys(empresasMap)
        .map(key => ({ name: key, cantidad: empresasMap[key] }))
        .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    return { stats, totalDeuda, chartEmpresas, listaOperaciones };
  }, [data]);

  const { stats, totalDeuda, chartEmpresas, listaOperaciones } = dashboardData;

  // -----------------------------------------------------------------------
  // 3. WIDGET ARRIBOS (Semanal)
  // -----------------------------------------------------------------------
  const chartArribos = useMemo(() => {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const proximosDias = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(hoy); d.setDate(d.getDate() + i);
        return { labelCompleto: `${diasSemana[d.getDay()]} ${d.getDate()}`, diaSemana: diasSemana[d.getDay()], cantidad: 0, fecha: d };
    });
    listaOperaciones.forEach(op => {
        if (!op.eta) return;
        let fechaEta;
        const etaStr = op.eta.toString();
        if (etaStr.includes('/')) {
             const [d, m, a] = etaStr.split('/'); fechaEta = new Date(`${a}-${m}-${d}T00:00:00`);
        } else { fechaEta = new Date(`${etaStr.substring(0, 10)}T00:00:00`); }
        fechaEta.setHours(0,0,0,0);
        const match = proximosDias.find(p => p.fecha.getTime() === fechaEta.getTime());
        if (match) match.cantidad++;
    });
    return proximosDias;
  }, [listaOperaciones]);

  const pieData = [
    { name: 'En Tránsito', value: stats.transito, color: CHART_COLORS.transito },
    { name: 'Tiempo Libre', value: stats.ok, color: CHART_COLORS.ok },
    { name: 'En Riesgo', value: stats.warning, color: CHART_COLORS.warning },
    { name: 'Con Cargos', value: stats.danger, color: CHART_COLORS.danger },
  ].filter(d => d.value > 0);

  // -----------------------------------------------------------------------
  // 4. MANEJO DE CLIC (Navegación Manual)
  // -----------------------------------------------------------------------
  const handleCardClick = (filtroEstado) => {
    // Si hay items y la función onNavigate existe (viene del padre), la ejecutamos
    if (stats[filtroEstado] > 0 && onNavigate) {
      onNavigate('list', filtroEstado); 
    }
  };

  // -----------------------------------------------------------------------
  // 5. RENDERIZADO
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Control</h1>
          <p className="text-sm text-slate-500">Vista general operativa ({stats.totalOperaciones} operaciones activas)</p>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} disabled={loading} className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 disabled:opacity-50 transition-colors shadow-sm">
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        )}
      </div>

      {/* KPI Cards CLICKEABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => handleCardClick('transito')} className={`transition-all duration-200 ${stats.transito > 0 ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]' : ''}`}>
            <KPICard title="Por Arribar" value={stats.transito} icon={Truck} colorClass="bg-sky-100 text-sky-600" subtext="Contenedores en camino" />
        </div>
        <div onClick={() => handleCardClick('ok')} className={`transition-all duration-200 ${stats.ok > 0 ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]' : ''}`}>
            <KPICard title="En Tiempo Libre" value={stats.ok} icon={CheckCircle} colorClass="bg-emerald-100 text-emerald-600" subtext="Sin riesgo de cobro" />
        </div>
        <div onClick={() => handleCardClick('warning')} className={`transition-all duration-200 ${stats.warning > 0 ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]' : ''}`}>
            <KPICard title="Atención Requerida" value={stats.warning} icon={Clock} colorClass="bg-amber-100 text-amber-600" subtext="Próximos a vencer" />
        </div>
        <div onClick={() => handleCardClick('danger')} className={`transition-all duration-200 ${stats.danger > 0 ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]' : ''}`}>
            <KPICard title="Generando Costos" value={stats.danger} icon={AlertTriangle} colorClass="bg-red-100 text-red-600" subtext="Demoras o Almacenajes" />
        </div>
      </div>

      {/* Gráficas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Ship size={20} className="text-slate-400"/> Estatus de la Flota</h3>
          {pieData.length > 0 ? (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip formatter={(value) => [value, 'Contenedores']} /><Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>} /></PieChart></ResponsiveContainer></div>
          ) : (<div className="h-64 flex items-center justify-center bg-slate-50 rounded text-slate-400">Sin datos activos</div>)}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-blue-600" /> Carga Activa por Cliente</h3>
          {chartEmpresas.length > 0 ? (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartEmpresas} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} /><Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} /></BarChart></ResponsiveContainer></div>
          ) : (<div className="h-64 flex items-center justify-center bg-slate-50 rounded text-slate-400">{loading ? <Loader2 className="animate-spin"/> : 'Sin datos'}</div>)}
        </div>
      </div>

      {/* Widget Arribos */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-blue-500" /> Arribos esta semana</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartArribos} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="labelCompleto" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [value, 'Contenedores']} /><Bar dataKey="cantidad" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} name="Arribos" /></BarChart></ResponsiveContainer></div>
      </div>

      {/* Flujo de Efectivo */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between">
         <div className="flex items-center gap-4 mb-4 md:mb-0"><div className="p-3 bg-white/10 rounded-full"><DollarSign size={24} className="text-emerald-400"/></div><div><p className="text-slate-400 text-sm font-medium">Flujo pendiente de cobro</p><h2 className="text-3xl font-bold tracking-tight">{formatCurrency(totalDeuda)}</h2></div></div>
         <div className="text-right"><p className="text-xs text-slate-400 mb-1">Conceptos pendientes</p><p className="text-xl font-bold">{stats.pendientes}</p></div>
      </div>

      {/* Tabla Recientes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Operaciones Recientes</h3>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase"><th className="p-3">Operación</th><th className="p-3">Cliente</th><th className="p-3 text-center">ETA</th><th className="p-3 text-center">Estado</th><th className="p-3 text-right">Monto</th></tr></thead><tbody>{listaOperaciones.slice(0, 5).map((op, idx) => {const analisis = calcularEstado(op.eta, op.tipo); const totalGrupo = op.tickets.reduce((sum, t) => sum + parseFloat(t.importe || 0), 0); return (<tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors"><td className="p-3 font-mono font-bold text-slate-700">{op.id}</td><td className="p-3 text-slate-600">{op.empresa}</td><td className="p-3 text-center text-xs font-bold text-slate-500">{op.eta ? formatDate(op.eta) : '-'}</td><td className="p-3 text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${analisis.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : analisis.status === 'warning' ? 'bg-amber-100 text-amber-700' : analisis.status === 'danger' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700' }`}>{analisis.label}</span></td><td className="p-3 text-right font-bold text-slate-700">{totalGrupo > 0 ? (formatCurrency(totalGrupo)) : (<span className="inline-block px-2 py-1 text-[10px] text-slate-500 font-medium italic bg-slate-100 border border-slate-200 rounded-md">Apertura de Expediente</span>)}</td></tr>)})}</tbody></table></div>
      </div>
    </div>
  );
};
export default DashboardView;