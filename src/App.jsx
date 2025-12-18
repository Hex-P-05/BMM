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
  Lock
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
  { id: 1, bl: 'HLCU12345678', provider: 'HAPAG', client: 'Importadora México S.A.', clientCode: 'IMP', reason: 'FLETE', container: 'MSKU987654', eta: addDays(45), payment: 'paid', paymentDate: '2025-06-10', amount: 15000, concept: 'HAPAG IMP 1 FLETE' },
  { id: 2, bl: 'MAEU87654321', provider: 'MAERSK', client: 'Logística Global', clientCode: 'LOG', reason: 'DEMORAS', container: 'TCLU123000', eta: addDays(15), payment: 'pending', paymentDate: null, amount: 22500, concept: 'MAERSK LOG 1 DEMORAS' },
  { id: 3, bl: 'COSU11223344', provider: 'COSCO', client: 'Textiles del Norte', clientCode: 'TEX', reason: 'GARANTÍA', container: 'MRKU554433', eta: addDays(-3), payment: 'pending', paymentDate: null, amount: 18000, concept: 'COSCO TEX 1 GARANTÍA' },
  { id: 4, bl: 'MSKU99887766', provider: 'ONE', client: 'Importadora México S.A.', clientCode: 'IMP', reason: 'ALMACENAJE', container: 'MSKU111222', eta: addDays(25), payment: 'pending', paymentDate: null, amount: 12000, concept: 'ONE IMP 2 ALMACENAJE' },
];

const initialData = rawData.map(item => ({
  ...item,
  status: calculateStatus(item.eta)
}));

const COLORS = {
  ok: '#10B981', warning: '#F59E0B', danger: '#EF4444', expired: '#991B1B', primary: '#2563EB',
};

// --- COMPONENTES UI ---

const StatusBadge = ({ status }) => {
  const config = {
    ok: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'A Tiempo' },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Alerta' },
    danger: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Urgente' },
    expired: { color: 'bg-red-800 text-white', icon: AlertTriangle, label: 'Vencido' },
  };
  const current = config[status] || config.ok;
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

// --- VISTAS ---

const DashboardView = ({ data }) => {
  const total = data.length;
  const warning = data.filter(i => i.status === 'warning').length;
  const danger = data.filter(i => i.status === 'danger' || i.status === 'expired').length;
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div><p className="text-slate-500 text-xs uppercase font-bold">Activos</p><h3 className="text-2xl font-bold text-slate-800">{total}</h3></div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Ship size={24}/></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div><p className="text-slate-500 text-xs uppercase font-bold">Alerta</p><h3 className="text-2xl font-bold text-slate-800">{warning}</h3></div>
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Clock size={24}/></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div><p className="text-slate-500 text-xs uppercase font-bold">Críticos</p><h3 className="text-2xl font-bold text-slate-800">{danger}</h3></div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={24}/></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div><p className="text-slate-500 text-xs uppercase font-bold">Por Cobrar</p><h3 className="text-2xl font-bold text-slate-800">${pendingMoney.toLocaleString()}</h3></div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={24}/></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Volumen por Cliente</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Estatus General</h3>
          <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  <Cell fill={COLORS.ok} />
                  <Cell fill={COLORS.warning} />
                  <Cell fill={COLORS.danger} />
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

const CaptureForm = ({ onSave, onCancel, existingData, role }) => {
  // SEGURIDAD: Si no es Admin ni Ejecutivo, no debería ver esto
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

  // Permisos según rol
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
                  <td className="p-4 text-center"><StatusBadge status={item.status} /></td>
                  <td className="p-4 text-right font-medium">${item.amount.toLocaleString()}</td>
                  <td className="p-4 text-center text-xs text-slate-500">
                    {item.payment === 'paid' ? formatDate(item.paymentDate) : '-'}
                  </td>
                  <td className="p-4 flex justify-center space-x-2">
                    {/* Botón de Pago: Solo Pagos y Admin */}
                    {canPay && item.payment === 'pending' && (
                      <button 
                        onClick={() => onTogglePayment(item.id)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-100 text-xs font-bold flex items-center"
                      >
                        <DollarSign size={14} className="mr-1"/> Pagar
                      </button>
                    )}
                    {item.payment === 'paid' && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded text-xs font-bold border border-slate-200 cursor-not-allowed">
                        Pagado
                      </span>
                    )}

                    {/* Botón Editar: Solo Admin */}
                    {canEdit && (
                      <button 
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar (Solo Admin)"
                      >
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
  
  // --- ESTADO DE ROL (Simulación de Login) ---
  const [role, setRole] = useState('admin'); // 'admin', 'ejecutivo', 'pagos'

  const handleSave = (newItem) => {
    const itemWithId = { ...newItem, id: Date.now() };
    setData([itemWithId, ...data]);
    setActiveTab('list'); // Al guardar, se bloquea (no vuelve al form) y va a la lista
  };

  const togglePayment = (id) => {
    const todayStr = new Date().toISOString().split('T')[0]; // Fecha actual YYYY-MM-DD
    const updatedData = data.map(item => {
      if (item.id === id && item.payment === 'pending') {
        return { ...item, payment: 'paid', paymentDate: todayStr };
      }
      return item;
    });
    setData(updatedData);
  };

  const handleEdit = (item) => {
    alert(`Modo Edición (Admin): Aquí se abriría el formulario con los datos de ${item.bl} para modificar.`);
  };

  // Menú dinámico según Rol
  const NavItem = ({ id, icon: Icon, label }) => {
    // Si eres 'Pagos', no ves 'Capturar'
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
      
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Ship size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">AduanaSoft</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">v2.0 Roles & Security</p>
        </div>
        
        <nav className="flex-1 p-4">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3">Menú</p>
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="list" icon={TableIcon} label="Sábana Operativa" />
          <NavItem id="capture" icon={Plus} label="Capturar Ticket" />
        </nav>

        {/* SELECTOR DE ROLES (DEMO) */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Simular Rol:</label>
          <select 
            value={role} 
            onChange={(e) => {
              setRole(e.target.value);
              // Si cambia a Pagos y estaba en Captura, mover a Dashboard para evitar error visual
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
            <User size={20} />
          </div>
          <div>
            <p className="text-sm font-medium">Usuario Activo</p>
            <RoleBadge role={role} />
          </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col animate-fade-in">
           <div className="p-6 flex justify-between items-center">
              <span className="text-lg font-bold">Menú</span>
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={28} /></button>
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded hover:bg-slate-100">
            <Menu className="text-slate-800" />
          </button>
          
          <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {activeTab === 'dashboard' && 'Visión General'}
            {activeTab === 'list' && 'Gestión y Pagos'}
            {activeTab === 'capture' && 'Alta de Documentos'}
            <span className="hidden md:inline-flex ml-4 transform scale-90 origin-left">
              <RoleBadge role={role} />
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="hidden lg:flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium">
                <DollarSign size={14} className="mr-1"/> USD: $20.54
             </div>
             <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200">
               <Shield size={16} />
             </div>
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