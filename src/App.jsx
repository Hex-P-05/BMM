import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Table as TableIcon, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Ship, 
  DollarSign,
  Plus,
  Search,
  Menu,
  X,
  Tag,
  User,
  Shield,
  Edit,
  Lock,
  Check,
  TrendingUp,   // Nuevo
  TrendingDown, // Nuevo
  Activity,     // Nuevo
  Bell          // Nuevo
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,    // Nuevo
  Area          // Nuevo
} from 'recharts';

// --- UTILIDADES ---

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const calculateStatus = (etaString) => {
  if (!etaString) return 'ok';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = etaString.split('-').map(Number);
  const etaDate = new Date(year, month - 1, day);
  const diffTime = etaDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays < 0) return 'expired';
  if (diffDays < 10) return 'danger';
  if (diffDays <= 21) return 'warning';
  return 'ok';
};

// --- DATOS INICIALES ---
const rawData = [
  { id: 1, bl: 'HLCU12345678', provider: 'HAPAG', client: 'Importadora México S.A.', clientCode: 'IMP', reason: 'FLETE', container: 'MSKU987654', eta: addDays(45), payment: 'paid', paymentDate: '2025-06-10', paymentDelay: 0, amount: 15000, concept: 'HAPAG IMP 1 FLETE' },
  { id: 2, bl: 'MAEU87654321', provider: 'MAERSK', client: 'Logística Global', clientCode: 'LOG', reason: 'DEMORAS', container: 'TCLU123000', eta: addDays(-5), payment: 'paid', paymentDate: '2025-06-12', paymentDelay: 5, amount: 22500, concept: 'MAERSK LOG 1 DEMORAS' },
  { id: 3, bl: 'COSU11223344', provider: 'COSCO', client: 'Textiles del Norte', clientCode: 'TEX', reason: 'GARANTÍA', container: 'MRKU554433', eta: addDays(-3), payment: 'pending', paymentDate: null, paymentDelay: 0, amount: 18000, concept: 'COSCO TEX 1 GARANTÍA' },
  { id: 4, bl: 'MSKU99887766', provider: 'ONE', client: 'Importadora México S.A.', clientCode: 'IMP', reason: 'ALMACENAJE', container: 'MSKU111222', eta: addDays(25), payment: 'pending', paymentDate: null, paymentDelay: 0, amount: 12000, concept: 'ONE IMP 2 ALMACENAJE' },
];

const initialData = rawData.map(item => ({
  ...item,
  status: calculateStatus(item.eta)
}));

const COLORS = {
  ok: '#10B981', warning: '#F59E0B', danger: '#EF4444', expired: '#991B1B', primary: '#2563EB', secondary: '#8b5cf6'
};

// --- COMPONENTES UI ---

const StatusBadge = ({ item }) => {
  if (item.payment === 'paid') {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${item.paymentDelay > 0 ? 'bg-green-700' : 'bg-green-600'}`}>
        <Check size={14} className="mr-1" strokeWidth={3} />
        {item.paymentDelay > 0 
          ? `PAGADO (+${item.paymentDelay} días retraso)` 
          : 'PAGADO'}
      </span>
    );
  }

  const config = {
    ok: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'A Tiempo' },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Alerta' },
    danger: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Urgente' },
    expired: { color: 'bg-red-800 text-white', icon: AlertTriangle, label: 'Vencido' },
  };
  
  const current = config[item.status] || config.ok;
  const Icon = current.icon;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${current.color}`}>
      <Icon size={12} className="mr-1" />
      {current.label}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    ejecutivo: 'bg-blue-100 text-blue-800 border-blue-200',
    pagos: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border uppercase ${styles[role] || styles.ejecutivo}`}>
      {role}
    </span>
  );
};

// Componente de Tarjeta Mejorado
const KPICard = ({ title, value, icon: Icon, colorClass, trend, trendValue, subtext }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
        <Icon size={24} />
      </div>
    </div>
    
    <div className="flex items-center text-xs">
      {trend === 'up' && <TrendingUp size={14} className="text-green-500 mr-1" />}
      {trend === 'down' && <TrendingDown size={14} className="text-red-500 mr-1" />}
      {trendValue && (
        <span className={`font-bold mr-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trendValue}
        </span>
      )}
      <span className="text-slate-400">{subtext}</span>
    </div>
  </div>
);

// --- VISTAS ---

const DashboardView = ({ data }) => {
  const total = data.length;
  const warning = data.filter(i => i.status === 'warning' && i.payment === 'pending').length;
  const danger = data.filter(i => (i.status === 'danger' || i.status === 'expired') && i.payment === 'pending').length;
  const pendingMoney = data.filter(i => i.payment === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

  const clientData = useMemo(() => {
    const counts = {};
    data.forEach(item => { counts[item.client] = (counts[item.client] || 0) + 1; });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
  }, [data]);

  const statusData = [
    { name: 'A Tiempo', value: total - warning - danger },
    { name: 'Riesgo', value: warning },
    { name: 'Penalizado', value: danger },
  ];

  // Datos simulados para gráfica de tendencia
  const performanceData = [
    { name: 'Lun', operaciones: 12, monto: 15000 },
    { name: 'Mar', operaciones: 19, monto: 22000 },
    { name: 'Mié', operaciones: 15, monto: 18000 },
    { name: 'Jue', operaciones: 25, monto: 35000 },
    { name: 'Vie', operaciones: 32, monto: 45000 },
    { name: 'Sáb', operaciones: 20, monto: 28000 },
    { name: 'Dom', operaciones: 10, monto: 12000 },
  ];

  const recentActivities = [
    { id: 1, user: 'Admin', action: 'Pago registrado', details: 'BL HLCU123...', time: 'Hace 5 min' },
    { id: 2, user: 'Ejecutivo', action: 'Nueva captura', details: 'Cliente: Textil...', time: 'Hace 24 min' },
    { id: 3, user: 'Sistema', action: 'Alerta generada', details: 'ETA vencido MAEU...', time: 'Hace 1 hora' },
    { id: 4, user: 'Pagos', action: 'Cierre de día', details: 'Reporte generado', time: 'Ayer' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* 1. KPIs con Tendencias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Contenedores Activos" 
          value={total} 
          icon={Ship} 
          colorClass="bg-blue-100 text-blue-600" 
          trend="up" 
          trendValue="+12%" 
          subtext="vs mes pasado" 
        />
        <KPICard 
          title="Alertas (Próximos)" 
          value={warning} 
          icon={Clock} 
          colorClass="bg-yellow-100 text-yellow-600" 
          trend="down" 
          trendValue="-5%" 
          subtext="mejoría en tiempos" 
        />
        <KPICard 
          title="Críticos (Vencidos)" 
          value={danger} 
          icon={AlertTriangle} 
          colorClass="bg-red-100 text-red-600" 
          trend="up" 
          trendValue="+2" 
          subtext="requiere atención" 
        />
        <KPICard 
          title="Cuentas por Cobrar" 
          value={`$${(pendingMoney/1000).toFixed(1)}k`} 
          icon={DollarSign} 
          colorClass="bg-emerald-100 text-emerald-600" 
          trend="up" 
          trendValue="+8%" 
          subtext="flujo de caja proyectado" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Gráfica Principal: Tendencia de Operaciones (Area Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Dinámica Semanal</h3>
              <p className="text-xs text-slate-400">Volumen de operaciones y montos</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-xs rounded-md p-1 outline-none text-slate-600">
              <option>Últimos 7 días</option>
              <option>Este Mes</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="monto" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorOps)" name="Monto ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Feed de Actividad Reciente */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Activity size={18} className="mr-2 text-blue-500"/> Actividad Reciente
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3 flex-shrink-0 text-xs font-bold">
                  {act.user.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{act.action}</p>
                  <p className="text-xs text-slate-400">{act.details}</p>
                  <p className="text-[10px] text-slate-300 mt-1">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 text-xs text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
            Ver todo el historial
          </button>
        </div>

        {/* 4. Gráficas Secundarias */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Volumen por Cliente</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} hide />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.secondary} radius={[4, 4, 4, 4]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Salud de la Operación</h3>
              <p className="text-2xl font-bold text-slate-800">92% <span className="text-sm font-normal text-slate-400">Eficiencia</span></p>
            </div>
            <div className="h-48 w-full max-w-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    <Cell fill={COLORS.ok} />
                    <Cell fill={COLORS.warning} />
                    <Cell fill={COLORS.danger} />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CaptureForm = ({ onSave, onCancel, existingData, role }) => {
  if (role === 'pagos') return <div className="p-10 text-center text-red-500 font-bold">Acceso Denegado: Rol no autorizado para capturas.</div>;

  const [formData, setFormData] = useState({
    bl: '', provider: '', client: '', reason: 'GARANTÍA', container: '', eta: '', amount: ''
  });
  const [generatedConcept, setGeneratedConcept] = useState('');
  const [clientConsecutive, setClientConsecutive] = useState(1);

  useEffect(() => {
    const code = formData.client ? formData.client.substring(0, 3).toUpperCase() : 'XXX';
    const matches = existingData.filter(item => item.client.trim().toLowerCase() === formData.client.trim().toLowerCase());
    const nextNum = matches.length + 1;
    setClientConsecutive(nextNum);
    const providerStr = formData.provider ? formData.provider.toUpperCase() : 'EMP';
    const reasonStr = formData.reason.toUpperCase();
    setGeneratedConcept(`${providerStr} ${code} ${nextNum} ${reasonStr}`);
  }, [formData.provider, formData.client, formData.reason, existingData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const calculatedStatus = calculateStatus(formData.eta);
    onSave({ 
      ...formData, 
      clientCode: formData.client.substring(0, 3).toUpperCase(),
      amount: parseFloat(formData.amount), 
      status: calculatedStatus, 
      payment: 'pending',
      paymentDate: null,
      paymentDelay: 0,
      concept: generatedConcept 
    });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <FileText className="mr-2 text-blue-600" /> Nueva Captura
            </h2>
            <p className="text-slate-500 text-sm">Los cambios se bloquearán al guardar.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Generador de Concepto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required name="provider" placeholder="Empresa (Naviera)" className="p-2 border rounded text-sm" onChange={handleChange} />
              <input required name="client" placeholder="Cliente" className="p-2 border rounded text-sm" onChange={handleChange} />
              <select name="reason" className="p-2 border rounded text-sm bg-white" onChange={handleChange}>
                <option>GARANTÍA</option><option>FLETE</option><option>ALMACENAJE</option><option>DEMORAS</option>
              </select>
            </div>
            <div className="mt-3 p-3 bg-slate-800 text-green-400 font-mono text-sm rounded flex justify-between">
              <span>{generatedConcept}</span>
              <span className="text-xs text-slate-500">Consecutivo #{clientConsecutive}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="text-sm font-bold text-slate-700">BL (Master)</label>
              <input required name="bl" className="w-full p-2 border rounded uppercase font-mono" onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Contenedor</label>
              <input required name="container" className="w-full p-2 border rounded uppercase" onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Fecha ETA</label>
              <input required name="eta" type="date" className="w-full p-2 border rounded" onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Monto (MXN)</label>
              <input required name="amount" type="number" className="w-full p-2 border rounded font-bold" onChange={handleChange} />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded text-slate-600">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
              <Lock size={16} className="mr-2" /> Guardar y Bloquear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ListView = ({ data, onTogglePayment, role, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = data.filter(item => 
    item.bl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.container.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canPay = role === 'admin' || role === 'pagos';
  const canEdit = role === 'admin';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Sábana Operativa</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <th className="p-4">Concepto</th>
                <th className="p-4">BL / Contenedor</th>
                <th className="p-4">ETA</th>
                <th className="p-4 text-center">Estatus</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-center">Pagado El</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-700">{item.client}</div>
                    <div className="inline-block mt-1 px-2 py-0.5 bg-slate-100 border rounded text-xs font-mono text-slate-600">
                      {item.concept}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-mono font-medium">{item.bl}</div>
                    <div className="text-xs text-slate-500">{item.container}</div>
                  </td>
                  <td className="p-4 text-slate-600">{formatDate(item.eta)}</td>
                  <td className="p-4 text-center">
                    {/* Usamos el nuevo StatusBadge que recibe el item completo */}
                    <StatusBadge item={item} />
                  </td>
                  <td className="p-4 text-right font-medium">${item.amount.toLocaleString()}</td>
                  <td className="p-4 text-center text-xs text-slate-500">
                    {item.payment === 'paid' ? formatDate(item.paymentDate) : '-'}
                  </td>
                  <td className="p-4 flex justify-center space-x-2">
                    {canPay && item.payment === 'pending' && (
                      <button 
                        onClick={() => onTogglePayment(item.id)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-100 text-xs font-bold flex items-center"
                      >
                        <DollarSign size={14} className="mr-1"/> Pagar
                      </button>
                    )}
                    {item.payment === 'paid' && (
                      <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded text-xs font-bold border border-slate-200 cursor-not-allowed">
                        Completado
                      </span>
                    )}
                    {canEdit && (
                      <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar (Solo Admin)">
                        <Edit size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(initialData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState('admin');

  const handleSave = (newItem) => {
    const itemWithId = { ...newItem, id: Date.now() };
    setData([itemWithId, ...data]);
    setActiveTab('list');
  };

  const togglePayment = (id) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    const updatedData = data.map(item => {
      if (item.id === id && item.payment === 'pending') {
        // --- LÓGICA DE DÍAS DE RETRASO AL PAGAR ---
        const [year, month, day] = item.eta.split('-').map(Number);
        const etaDate = new Date(year, month - 1, day);
        const diffTime = etaDate - today; // Diferencia en milisegundos
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Si diffDays es negativo, significa que HOY es después de la fecha límite (ETA)
        // Ejemplo: ETA fue hace 5 días (-5). delay = 5.
        let delay = 0;
        if (diffDays < 0) {
           delay = Math.abs(diffDays);
        }

        return { 
          ...item, 
          payment: 'paid', 
          paymentDate: todayStr,
          paymentDelay: delay // Guardamos cuántos días tarde se pagó (0 si fue a tiempo)
        };
      }
      return item;
    });
    setData(updatedData);
  };

  const handleEdit = (item) => {
    alert(`Modo Edición (Admin): Modificar ${item.bl}.`);
  };

  const NavItem = ({ id, icon: Icon, label }) => {
    if (role === 'pagos' && id === 'capture') return null;
    return (
      <button
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg transition-colors ${
          activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={20} className="mr-3" />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Ship size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">AduanaSoft</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">v2.1 Smart Payments</p>
        </div>
        <nav className="flex-1 p-4">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3">Menú</p>
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="list" icon={TableIcon} label="Sábana Operativa" />
          <NavItem id="capture" icon={Plus} label="Capturar Ticket" />
        </nav>
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Simular Rol:</label>
          <select 
            value={role} 
            onChange={(e) => {
              setRole(e.target.value);
              if (e.target.value === 'pagos' && activeTab === 'capture') setActiveTab('dashboard');
            }}
            className="w-full bg-slate-900 text-white text-sm p-2 rounded border border-slate-600 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="admin">Admin (Total)</option>
            <option value="ejecutivo">Ejecutivo (Captura)</option>
            <option value="pagos">Pagos (Solo Lectura)</option>
          </select>
        </div>
        <div className="p-4 border-t border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold"><User size={20} /></div>
          <div><p className="text-sm font-medium">Usuario Activo</p><RoleBadge role={role} /></div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col animate-fade-in">
           <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Ship size={20} className="text-white" />
                  </div>
                  <span className="text-lg font-bold tracking-tight">AduanaSoft</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">v2.1 Smart Payments</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1"><X size={28} /></button>
           </div>
           <nav className="flex-1 p-6">
              <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem id="list" icon={TableIcon} label="Sábana Operativa" />
              <NavItem id="capture" icon={Plus} label="Capturar Ticket" />
              
              {/* SELECTOR DE ROL MÓVIL (AÑADIDO) */}
              <div className="mt-8 pt-6 border-t border-slate-700">
                <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Simular Rol (Demo Móvil):</label>
                <select 
                  value={role} 
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value === 'pagos' && activeTab === 'capture') setActiveTab('dashboard');
                  }}
                  className="w-full bg-slate-800 text-white text-sm p-3 rounded border border-slate-600 focus:ring-blue-500 outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="ejecutivo">Ejecutivo</option>
                  <option value="pagos">Pagos</option>
                </select>
                <div className="mt-4 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold"><User size={16} /></div>
                  <div className="text-sm">Rol actual: <RoleBadge role={role} /></div>
                </div>
              </div>
           </nav>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded hover:bg-slate-100"><Menu className="text-slate-800" /></button>
          <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {activeTab === 'dashboard' && 'Visión General'}
            {activeTab === 'list' && 'Gestión y Pagos'}
            {activeTab === 'capture' && 'Alta de Documentos'}
            <span className="hidden md:inline-flex ml-4 transform scale-90 origin-left"><RoleBadge role={role} /></span>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden lg:flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium"><DollarSign size={14} className="mr-1"/> USD: $20.54</div>
             <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200"><Shield size={16} /></div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <DashboardView data={data} />}
          {activeTab === 'capture' && <CaptureForm onSave={handleSave} onCancel={() => setActiveTab('dashboard')} existingData={data} role={role} />}
          {activeTab === 'list' && <ListView data={data} onTogglePayment={togglePayment} role={role} onEdit={handleEdit} />}
        </div>
      </main>
    </div>
  );
}