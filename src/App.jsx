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
  Tag
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
  Legend
} from 'recharts';

// --- UTILIDADES DE FECHA ---

// Función robusta para sumar días a hoy (para generar datos demo siempre válidos)
const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Función para formatear fecha visualmente a dd/mm/aaaa
const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Función centralizada para calcular estatus
// Reglas:
// < 0 días (Ya pasó): Penalización (ROJO)
// 0 - 9 días (Muy cerca): Crítico (ROJO)
// 10 - 21 días: Alerta (AMARILLO)
// > 21 días: A Tiempo (VERDE)
const calculateStatus = (etaString) => {
  if (!etaString) return 'ok';
  
  // Crear fechas en UTC para evitar errores de zona horaria (evitar que hoy cuente como ayer)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse manual para asegurar año, mes, día exactos del input
  const [year, month, day] = etaString.split('-').map(Number);
  const etaDate = new Date(year, month - 1, day); // Mes es 0-indexado
  
  const diffTime = etaDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays < 0) return 'expired'; // Nueva categoría visual para lo que ya venció
  if (diffDays < 10) return 'danger'; // 0 a 9 días
  if (diffDays <= 21) return 'warning'; // 10 a 21 días
  return 'ok'; // Más de 21 días
};

// --- DATOS SIMULADOS INICIALES (DINÁMICOS) ---
// Usamos addDays para que la demo siempre tenga sentido relativo al día que se presenta
const rawData = [
  { id: 1, bl: 'HLCU12345678', provider: 'HAPAG', client: 'Importadora México S.A.', clientCode: 'IMP', reason: 'FLETE', container: 'MSKU987654', eta: addDays(45), payment: 'paid', amount: 15000, concept: 'HAPAG IMP 1 FLETE' },
  { id: 2, bl: 'MAEU87654321', provider: 'MAERSK', client: 'Logística Global', clientCode: 'LOG', reason: 'DEMORAS', container: 'TCLU123000', eta: addDays(15), payment: 'pending', amount: 22500, concept: 'MAERSK LOG 1 DEMORAS' }, // Saldrá Warning (15 días)
  { id: 3, bl: 'COSU11223344', provider: 'COSCO', client: 'Textiles del Norte', clientCode: 'TEX', reason: 'GARANTÍA', container: 'MRKU554433', eta: addDays(-3), payment: 'pending', amount: 18000, concept: 'COSCO TEX 1 GARANTÍA' }, // Saldrá Expired (-3 días)
  { id: 4, bl: 'MSKU99887766', provider: 'ONE', client: 'Importadora México S.A.', clientCode: 'IMP', reason: 'ALMACENAJE', container: 'MSKU111222', eta: addDays(25), payment: 'pending', amount: 12000, concept: 'ONE IMP 2 ALMACENAJE' },
  { id: 5, bl: 'HLCU55667788', provider: 'HAPAG', client: 'Automotriz Bajío', clientCode: 'AUT', reason: 'GARANTÍA', container: 'HLCU998877', eta: addDays(5), payment: 'paid', amount: 45000, concept: 'HAPAG AUT 1 GARANTÍA' }, // Saldrá Danger (5 días)
];

// Procesamos los datos iniciales para calcular sus estatus reales
const initialData = rawData.map(item => ({
  ...item,
  status: calculateStatus(item.eta)
}));

const COLORS = {
  ok: '#10B981',      // Verde
  warning: '#F59E0B', // Amarillo
  danger: '#EF4444',  // Rojo
  expired: '#991B1B', // Rojo Oscuro (Vencido)
  primary: '#2563EB', // Azul
};

// --- COMPONENTES AUXILIARES ---

const StatusBadge = ({ status }) => {
  const config = {
    ok: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'A Tiempo (>21 días)' },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Alerta (10-21 días)' },
    danger: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Urgente (<10 días)' },
    expired: { color: 'bg-red-800 text-white', icon: AlertTriangle, label: 'Vencido / Penalizado' },
  };
  const current = config[status] || config.ok;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${current.color}`}>
      <Icon size={14} className="mr-1" />
      {current.label}
    </span>
  );
};

const Card = ({ title, value, icon: Icon, colorClass, subtext }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- VISTAS PRINCIPALES ---

const DashboardView = ({ data }) => {
  const total = data.length;
  const warning = data.filter(i => i.status === 'warning').length;
  const danger = data.filter(i => i.status === 'danger' || i.status === 'expired').length;
  const pendingMoney = data.filter(i => i.payment === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

  const clientData = useMemo(() => {
    const counts = {};
    data.forEach(item => {
      counts[item.client] = (counts[item.client] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
  }, [data]);

  const statusData = [
    { name: 'A Tiempo', value: total - warning - danger },
    { name: 'Riesgo', value: warning },
    { name: 'Penalizado', value: danger },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Contenedores Activos" value={total} icon={Ship} colorClass="bg-blue-600" subtext="+2 ingresados hoy" />
        <Card title="En Alerta (10-21 días)" value={warning} icon={Clock} colorClass="bg-yellow-500" subtext="Planificar liberación" />
        <Card title="Riesgo / Vencidos" value={danger} icon={AlertTriangle} colorClass="bg-red-500" subtext="<10 días o Vencidos" />
        <Card title="Pagos Pendientes" value={`$${pendingMoney.toLocaleString()}`} icon={DollarSign} colorClass="bg-slate-600" subtext="MXN Total Acumulado" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Volumen por Cliente</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Semáforo de Riesgo</h3>
          <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell key="cell-0" fill={COLORS.ok} />
                  <Cell key="cell-1" fill={COLORS.warning} />
                  <Cell key="cell-2" fill={COLORS.danger} />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const CaptureForm = ({ onSave, onCancel, existingData }) => {
  const [formData, setFormData] = useState({
    bl: '',
    provider: '', 
    client: '',
    clientCode: '', 
    reason: 'GARANTÍA',
    container: '',
    eta: '',
    amount: ''
  });

  const [generatedConcept, setGeneratedConcept] = useState('');
  const [clientConsecutive, setClientConsecutive] = useState(1);

  // Efecto para calcular consecutivo y concepto
  useEffect(() => {
    const code = formData.client ? formData.client.substring(0, 3).toUpperCase() : 'XXX';
    
    // LÓGICA DE CONSECUTIVO POR CLIENTE
    const matches = existingData.filter(item => 
      item.client.trim().toLowerCase() === formData.client.trim().toLowerCase()
    );
    const nextNum = matches.length + 1;
    setClientConsecutive(nextNum);

    const providerStr = formData.provider ? formData.provider.toUpperCase() : 'EMP';
    const reasonStr = formData.reason.toUpperCase();
    
    // Concepto
    const concept = `${providerStr} ${code} ${nextNum} ${reasonStr}`;
    setGeneratedConcept(concept);
    
  }, [formData.provider, formData.client, formData.reason, existingData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Cálculo centralizado y correcto del estatus
    const calculatedStatus = calculateStatus(formData.eta);

    onSave({ 
      ...formData, 
      clientCode: formData.client.substring(0, 3).toUpperCase(),
      amount: parseFloat(formData.amount), 
      status: calculatedStatus, 
      payment: 'pending',
      concept: generatedConcept 
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <FileText className="mr-2 text-blue-600" />
              Nueva Captura de Ticket
            </h2>
            <p className="text-slate-500 text-sm mt-1">Ingresa los datos. El consecutivo se calcula por cliente.</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-bold">
             Consecutivo Cliente: #{clientConsecutive}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center">
              <Tag size={16} className="mr-2" />
              Generación de Concepto de Pago
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Empresa (Naviera)</label>
                <input 
                  required
                  name="provider"
                  type="text" 
                  placeholder="Ej. ONE, MAERSK"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 outline-none uppercase"
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cliente</label>
                <input 
                  required
                  name="client"
                  type="text" 
                  placeholder="Nombre Cliente (para consecutivo)"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 outline-none"
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Motivo</label>
                <select 
                  name="reason"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 outline-none bg-white"
                  onChange={handleChange}
                  value={formData.reason}
                >
                  <option value="GARANTÍA">GARANTÍA</option>
                  <option value="FLETE">FLETE</option>
                  <option value="ALMACENAJE">ALMACENAJE</option>
                  <option value="DEMORAS">DEMORAS</option>
                  <option value="REPARACIÓN">REPARACIÓN</option>
                </select>
              </div>
            </div>

            <div className="mt-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">Vista Previa del Concepto (Automático)</label>
              <div className="w-full p-4 bg-slate-800 text-green-400 font-mono text-sm md:text-lg rounded-lg border border-slate-700 flex flex-col md:flex-row justify-between items-center shadow-inner">
                <span className="break-all">{generatedConcept}</span>
                <span className="text-xs text-slate-500 italic md:ml-4 mt-2 md:mt-0">Empresa + Cliente + #{clientConsecutive} + Motivo</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Número de BL (Master Key)
              </label>
              <input 
                required
                name="bl"
                type="text" 
                placeholder="Ej. HLCU12345678"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase tracking-wider font-mono"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">ID Contenedor</label>
              <input 
                required
                name="container"
                type="text" 
                placeholder="Ej. MSKU..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 outline-none uppercase"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha ETA (Llegada)</label>
              <input 
                required
                name="eta"
                type="date" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 outline-none"
                onChange={handleChange}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Monto Total a Pagar (MXN)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  required
                  name="amount"
                  type="number" 
                  placeholder="0.00"
                  className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 outline-none font-bold text-slate-700"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end space-x-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-md transition-all flex items-center"
            >
              <CheckCircle size={18} className="mr-2" />
              Generar Orden y Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ListView = ({ data, onTogglePayment }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => 
    item.bl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.container.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.concept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 md:mb-0">Sábana de Operaciones</h2>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por BL, Cliente, Contenedor o Concepto..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Concepto de Pago</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">BL / Contenedor</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ETA</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estatus</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm mb-1">{item.client}</span>
                      <div className="flex items-center text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 w-fit">
                        <Tag size={10} className="mr-1" />
                        {item.concept}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-medium text-slate-800">{item.bl}</span>
                      <span className="text-xs text-slate-500">{item.container}</span>
                      <span className="text-xs text-blue-600 font-semibold">{item.provider}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 text-sm">{formatDate(item.eta)}</td>
                  <td className="p-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-4 text-right font-medium text-slate-700">
                    ${item.amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => onTogglePayment(item.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        item.payment === 'paid' 
                        ? 'bg-slate-100 text-slate-500 cursor-default'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      {item.payment === 'paid' ? 'Pagado' : 'Registrar Pago'}
                    </button>
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

  const handleSave = (newItem) => {
    // ID único simulado
    const itemWithId = { ...newItem, id: Date.now() };
    setData([itemWithId, ...data]);
    setActiveTab('list');
  };

  const togglePayment = (id) => {
    const updatedData = data.map(item => {
      if (item.id === id) {
        return { ...item, payment: item.payment === 'pending' ? 'paid' : 'pending' };
      }
      return item;
    });
    setData(updatedData);
  };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg transition-colors ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} className="mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Ship size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">AduanaSoft</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">v1.4 Format Date</p>
        </div>
        
        <nav className="flex-1 p-4">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3">Principal</p>
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="list" icon={TableIcon} label="Sábana Operativa" />
          
          <p className="px-4 text-xs font-bold text-slate-500 uppercase mt-6 mb-3">Operación</p>
          <NavItem id="capture" icon={Plus} label="Capturar Ticket" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <div>
              <p className="text-sm font-medium">Administrador</p>
              <p className="text-xs text-slate-500">Agencia Central</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col animate-fade-in">
           <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Ship size={20} className="text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">AduanaSoft</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X size={28} />
              </button>
           </div>
           <nav className="flex-1 p-6">
              <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem id="list" icon={TableIcon} label="Sábana Operativa" />
              <NavItem id="capture" icon={Plus} label="Capturar Ticket" />
           </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex items-center text-slate-800 font-bold p-2 -ml-2 rounded hover:bg-slate-100"
          >
            <Menu className="mr-3" /> AduanaSoft
          </button>
          
          <div className="hidden md:block text-xl font-bold text-slate-800">
            {activeTab === 'dashboard' && 'Visión General'}
            {activeTab === 'list' && 'Gestión y Pagos'}
            {activeTab === 'capture' && 'Alta de Documentos'}
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="hidden lg:flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium">
                <DollarSign size={14} className="mr-1"/>
                USD Hoy: $20.54 MXN
             </div>
             <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative">
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
               <AlertTriangle size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <DashboardView data={data} />}
          {activeTab === 'capture' && <CaptureForm onSave={handleSave} onCancel={() => setActiveTab('dashboard')} existingData={data} />}
          {activeTab === 'list' && <ListView data={data} onTogglePayment={togglePayment} />}
        </div>
      </main>
    </div>
  );
}