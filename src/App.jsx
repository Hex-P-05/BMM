import React, { useState, useMemo, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { 
  LayoutDashboard, FileText, Table as TableIcon, AlertTriangle, CheckCircle, 
  Clock, Ship, DollarSign, Plus, Search, Menu, X, User, Edit, Lock, 
  TrendingUp, TrendingDown, Activity, AlertCircle, Calculator, Trash2, 
  Download, Printer, Package, MapPin, Key, LogOut, Check, 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ShieldAlert, Eye, EyeOff,
  Anchor, ClipboardCheck, Phone, Globe, Calendar, ToggleLeft, ToggleRight, Landmark
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
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

const getDaysDiff = (etaString) => {
  if (!etaString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = etaString.split('-').map(Number);
  const etaDate = new Date(year, month - 1, day);
  const diffTime = etaDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const calculateStatus = (etaString) => {
  if (!etaString) return 'ok';
  const diffDays = getDaysDiff(etaString);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'danger';
  if (diffDays <= 15) return 'warning';
  return 'ok';
};

// --- BASES DE DATOS (MOCKS) ---
const EMPRESAS_DB = [
    { id: 1, nombre: 'IMPORTADORA MÉXICO S.A.' },
    { id: 2, nombre: 'LOGÍSTICA GLOBAL' },
    { id: 3, nombre: 'TEXTILES DEL NORTE' },
    { id: 4, nombre: 'AUTOMOTRIZ BAJÍO' }
];

const CONCEPTOS_DB = ['ALMACENAJES', 'PAMA', 'HONORARIOS', 'FLETE', 'DEMORAS', 'REVALIDACIÓN', 'MANIOBRAS'];

const PROVEEDORES_DB = [
  { id: 1, nombre: 'HAPAG-LLOYD', banco: 'BBVA', cuenta: '0123456789', clabe: '012001012345678901' },
  { id: 2, nombre: 'MAERSK MEXICO', banco: 'CITIBANAMEX', cuenta: '9876543210', clabe: '002001987654321099' },
  { id: 3, nombre: 'COSCO SHIPPING', banco: 'SANTANDER', cuenta: '5554443332', clabe: '014001555444333222' },
  { id: 4, nombre: 'MSC MEXICO', banco: 'HSBC', cuenta: '1112223334', clabe: '021001111222333444' },
  { id: 5, nombre: 'ONE NET', banco: 'BANORTE', cuenta: '9998887776', clabe: '072001999888777666' },
];

// --- DATOS INICIALES (MIGRADOS A LA NUEVA ESTRUCTURA) ---
const rawData = [
  { 
    id: 1, 
    ejecutivo: 'JOAN',
    empresa: 'IMPORTADORA MÉXICO S.A.',
    fechaAlta: '2025-05-20',
    concepto: 'ALMACENAJES',
    prefijo: 'IMP',
    consecutivo: 1,
    contenedor: 'MSKU987654',
    comentarios: 'ALMACENAJES IMP 1 MSKU987654', // Concatenación automática
    pedimento: '2300-112233',
    factura: 'A-101',
    proveedor: 'HAPAG-LLOYD',
    banco: 'BBVA',
    cuenta: '0123456789',
    clabe: '012001012345678901',
    
    // Lógica conservada
    bl: 'HLCU12345678', 
    eta: addDays(45), freeDays: 7, editCount: 0, payment: 'paid', paymentDate: '2025-06-10', paymentDelay: 0, currency: 'MXN',
    costDemoras: 0, costAlmacenaje: 5000, costOperativos: 5000, costPortuarios: 2000, costApoyo: 0, costImpuestos: 1000, costLiberacion: 0, costTransporte: 7000,
    amount: 20000, status: 'active', paidFlags: {} 
  },
  { 
    id: 2, 
    ejecutivo: 'MARIA',
    empresa: 'LOGÍSTICA GLOBAL',
    fechaAlta: '2025-05-22',
    concepto: 'PAMA',
    prefijo: 'LOG',
    consecutivo: 1,
    contenedor: 'TCLU123000',
    comentarios: 'PAMA LOG 1 TCLU123000',
    pedimento: '2300-998877',
    factura: '',
    proveedor: 'MAERSK MEXICO',
    banco: 'CITIBANAMEX',
    cuenta: '9876543210',
    clabe: '002001987654321099',

    bl: 'MAEU87654321', 
    eta: addDays(-5), freeDays: 14, editCount: 1, payment: 'paid', paymentDate: '2025-06-12', paymentDelay: 5, currency: 'USD',
    costDemoras: 15000, costAlmacenaje: 5000, costOperativos: 1000, costPortuarios: 0, costApoyo: 0, costImpuestos: 500, costLiberacion: 0, costTransporte: 1000,
    amount: 22500, status: 'active', paidFlags: {}
  }
];

const initialData = rawData.map(item => ({
  ...item,
  status: calculateStatus(item.eta)
}));

const COLORS = {
  ok: '#10B981', warning: '#F59E0B', danger: '#EF4444', expired: '#991B1B', primary: '#2563EB', secondary: '#8b5cf6'
};

// --- COMPONENTES UI AUXILIARES (Badge, KPI, etc... Mismos que antes) ---
const StatusBadge = ({ item }) => {
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

// --- COMPONENTE LOGIN (Actualizado para simular nombre de usuario) ---
const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    // Simulamos nombres de pila para el campo "Ejecutivo"
    if (email === 'admin@aduanasoft.com' && password === 'admin') { onLogin('admin', 'ADMIN'); } 
    else if (email === 'joan@aduanasoft.com' && password === 'ops') { onLogin('ejecutivo', 'JOAN'); } 
    else if (email === 'maria@aduanasoft.com' && password === 'ops') { onLogin('ejecutivo', 'MARIA'); }
    else if (email === 'pagos@aduanasoft.com' && password === 'pagos') { onLogin('pagos', 'PAGOS'); } 
    else { setError('Credenciales incorrectas.'); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-8 w-full">
            <h2 className="text-xl font-bold text-center mb-6">Acceso AduanaSoft</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-2 border rounded" placeholder="Correo" />
                <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full p-2 border rounded" placeholder="Contraseña" />
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Entrar</button>
            </form>
            <div className="mt-4 text-xs text-slate-400">
                <p>Prueba: joan@aduanasoft.com / ops</p>
                <p>Prueba: pagos@aduanasoft.com / pagos</p>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- FORMULARIO DE CAPTURA (NUEVA LÓGICA) ---
const CaptureForm = ({ onSave, onCancel, existingData, role, userName }) => {
  if (role === 'pagos') return <div className="p-10 text-center text-red-500 font-bold">Acceso denegado.</div>;

  const [formData, setFormData] = useState({
    // Nuevos campos
    empresa: '',
    fechaAlta: new Date().toISOString().split('T')[0], // Default hoy
    concepto: '',
    prefijo: '',
    consecutivo: 0, // Se calculará
    contenedor: '',
    pedimento: '',
    factura: '',
    proveedor: '',
    
    // Datos Bancarios (Auto-llenados)
    banco: '',
    cuenta: '',
    clabe: '',

    // Campos existentes necesarios
    bl: '', 
    eta: '', 
    freeDays: 7, 
    currency: 'MXN',
    costDemoras: 0, costAlmacenaje: 0, costOperativos: 0, costPortuarios: 0,
    costApoyo: 0, costImpuestos: 0, costLiberacion: 0, costTransporte: 0
  });

  const [totalAmount, setTotalAmount] = useState(0);
  const [generatedComments, setGeneratedComments] = useState('');

  // 1. Calcular Monto Total
  useEffect(() => {
    const sum = 
      (parseFloat(formData.costDemoras) || 0) + (parseFloat(formData.costAlmacenaje) || 0) +
      (parseFloat(formData.costOperativos) || 0) + (parseFloat(formData.costPortuarios) || 0) +
      (parseFloat(formData.costApoyo) || 0) + (parseFloat(formData.costImpuestos) || 0) +
      (parseFloat(formData.costLiberacion) || 0) + (parseFloat(formData.costTransporte) || 0);
    setTotalAmount(sum);
  }, [formData]);

  // 2. Lógica de Consecutivo y Comentarios (AUTO)
  useEffect(() => {
    // Calcular consecutivo basado en el prefijo
    let nextNum = 0;
    if (formData.prefijo && formData.prefijo.length === 3) {
        const count = existingData.filter(d => d.prefijo === formData.prefijo.toUpperCase()).length;
        nextNum = count + 1;
    }

    // Generar comentario
    const cleanContenedor = formData.contenedor ? formData.contenedor.toUpperCase() : '';
    const cleanConcepto = formData.concepto || '...';
    const cleanPrefijo = formData.prefijo ? formData.prefijo.toUpperCase() : '...';
    
    // FORMATO: CONCEPTO + PREFIJO + CONSECUTIVO + CONTENEDOR
    const comment = `${cleanConcepto} ${cleanPrefijo} ${nextNum || '#'} ${cleanContenedor}`;

    setGeneratedComments(comment);
    // Actualizamos el estado del consecutivo (no el form directamente para evitar loops infinitos si no se maneja bien, pero aquí lo haremos al enviar)
  }, [formData.prefijo, formData.concepto, formData.contenedor, existingData]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Lógica especial para Prefijo (Max 3 chars, Upper)
    if (name === 'prefijo') {
        if (value.length <= 3) {
            setFormData({ ...formData, [name]: value.toUpperCase() });
        }
        return;
    }

    // Lógica especial para Proveedor (Autollenado de Banco)
    if (name === 'proveedor') {
        const prov = PROVEEDORES_DB.find(p => p.nombre === value);
        if (prov) {
            setFormData({ 
                ...formData, 
                proveedor: value, 
                banco: prov.banco, 
                cuenta: prov.cuenta, 
                clabe: prov.clabe 
            });
        } else {
            setFormData({ ...formData, proveedor: value, banco: '', cuenta: '', clabe: '' });
        }
        return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Recalcular consecutivo final al guardar para asegurar integridad
    const count = existingData.filter(d => d.prefijo === formData.prefijo).length;
    const finalConsecutivo = count + 1;
    const finalComment = `${formData.concepto} ${formData.prefijo} ${finalConsecutivo} ${formData.contenedor.toUpperCase()}`;

    const calculatedStatus = calculateStatus(formData.eta);
    
    onSave({ 
      ...formData,
      ejecutivo: userName, // Nombre del usuario logueado
      consecutivo: finalConsecutivo,
      comentarios: finalComment,
      amount: totalAmount, 
      status: calculatedStatus, 
      payment: 'pending',
      paymentDate: null,
      paymentDelay: 0,
      editCount: 0
    });
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-10">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center"><FileText className="mr-2 text-blue-600" /> Alta de Contenedor</h2>
          <p className="text-xs text-slate-500">Ejecutivo de captura: <span className="font-bold text-slate-700">{userName}</span></p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* SECCIÓN 1: DATOS ADMINISTRATIVOS */}
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
            <h3 className="text-xs font-bold text-blue-800 uppercase mb-4 flex items-center"><Package size={14} className="mr-1"/> Datos de Identificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Empresa</label>
                    <select required name="empresa" value={formData.empresa} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">-- Seleccionar --</option>
                        {EMPRESAS_DB.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Fecha Alta</label>
                    <input type="date" name="fechaAlta" value={formData.fechaAlta} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none" />
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-600 mb-1 block">Prefijo (3 Letras)</label>
                     <input required name="prefijo" value={formData.prefijo} onChange={handleChange} placeholder="Ej. IMP" className="w-full p-2 border rounded text-sm uppercase font-bold text-center tracking-widest outline-none border-blue-300 focus:bg-blue-50" maxLength={3} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Concepto</label>
                    <select required name="concepto" value={formData.concepto} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none">
                        <option value="">-- Seleccionar --</option>
                        {CONCEPTOS_DB.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Contenedor</label>
                    <input required name="contenedor" value={formData.contenedor} onChange={handleChange} placeholder="ABCD123456" className="w-full p-2 border rounded text-sm uppercase outline-none" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">BL Master</label>
                    <input required name="bl" value={formData.bl} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" />
                </div>
            </div>

            {/* PREVISUALIZACIÓN DE COMENTARIOS AUTOMÁTICOS */}
            <div className="mt-4 p-3 bg-slate-800 text-white rounded-lg flex items-center justify-between shadow-inner">
                <div>
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Comentarios (Generado Automáticamente)</span>
                    <span className="font-mono text-sm font-bold text-yellow-400 tracking-wide">{generatedComments}</span>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Consecutivo Previsto</span>
                    <span className="font-bold text-white text-lg">#{existingData.filter(d => d.prefijo === formData.prefijo).length + 1}</span>
                </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS DE PAGO Y PROVEEDOR */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
             <h3 className="text-xs font-bold text-slate-600 uppercase mb-4 flex items-center"><Landmark size={14} className="mr-1"/> Datos Financieros y Proveedor</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Proveedor</label>
                    <select required name="proveedor" value={formData.proveedor} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none">
                        <option value="">-- Seleccionar --</option>
                        {PROVEEDORES_DB.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Banco</label>
                        <input readOnly value={formData.banco} className="w-full p-2 bg-slate-200 border rounded text-xs font-bold text-slate-700" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Cuenta</label>
                        <input readOnly value={formData.cuenta} className="w-full p-2 bg-slate-200 border rounded text-xs text-slate-700" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Clabe</label>
                        <input readOnly value={formData.clabe} className="w-full p-2 bg-slate-200 border rounded text-xs text-slate-700" />
                    </div>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Pedimento</label>
                    <input name="pedimento" value={formData.pedimento} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Factura (Opcional)</label>
                    <input name="factura" value={formData.factura} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">ETA</label>
                        <input required type="date" name="eta" value={formData.eta} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Días Libres</label>
                        <input required type="number" name="freeDays" value={formData.freeDays} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none" />
                    </div>
                </div>
             </div>
          </div>

          {/* SECCIÓN 3: COSTOS */}
          <div className="border-t pt-4">
               <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700">Desglose de costos (Granularidad)</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="text-xs p-1 border rounded font-bold text-blue-600 bg-white"><option value="MXN">MXN</option><option value="USD">USD</option></select>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {k: 'costDemoras', l: 'Demoras'}, {k: 'costAlmacenaje', l: 'Almacenaje'},
                    {k: 'costOperativos', l: 'Operativos'}, {k: 'costPortuarios', l: 'Portuarios'},
                    {k: 'costApoyo', l: 'Apoyo'}, {k: 'costImpuestos', l: 'Impuestos'},
                    {k: 'costLiberacion', l: 'Liberación'}, {k: 'costTransporte', l: 'Transporte'}
                  ].map(f => (
                      <div key={f.k}>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">{f.l}</label>
                          <div className="relative"><span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span><input type="number" name={f.k} className="w-full pl-5 p-1.5 border rounded text-sm text-right outline-none focus:border-blue-500" onChange={handleChange} placeholder="0" /></div>
                      </div>
                  ))}
               </div>
               <div className="mt-4 flex justify-end">
                  <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                     <span className="text-xs text-slate-500 mr-2 uppercase font-bold">Total:</span>
                     <span className="text-lg font-bold text-slate-800">${totalAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{formData.currency}</span></span>
                  </div>
               </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t"><button type="button" onClick={onCancel} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center shadow-lg shadow-blue-200 font-bold"><Lock size={16} className="mr-2" /> Guardar Registro</button></div>
        </form>
      </div>
    </div>
  );
};

// --- LIST VIEW (SÁBANA OPERATIVA) REESTRUCTURADA ---
const ListView = ({ data, onPayItem, onPayAll, onCloseOperation, role, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('full'); // 'full' or 'simple' (Pagos)
  const [selectedIds, setSelectedIds] = useState([]);
  
  const canPay = role === 'admin' || role === 'pagos';
  const tableContainerRef = useRef(null);

  // Filtros
  const filteredData = data.filter(item => 
    item.bl.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.comentarios.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.contenedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

  // --- DEFINICIÓN DE COLUMNAS SEGÚN VISTA ---
  // VISTA PAGOS (Simplificada) vs VISTA REVALIDACIÓN (Completa)
  const isSimpleView = viewMode === 'simple';

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">Sábana Operativa</h2>
            
            {/* TOGGLE SWITCH PARA VISTA PAGOS */}
            {(role === 'admin' || role === 'pagos') && (
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                        onClick={() => setViewMode('full')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'full' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Vista Completa
                    </button>
                    <button 
                        onClick={() => setViewMode('simple')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'simple' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Vista Pagos
                    </button>
                </div>
            )}
        </div>
        
        <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar BL, Contenedor, Comentario..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 relative">
        <div ref={tableContainerRef} className="overflow-auto h-[calc(100vh-200px)] w-full relative"> 
          <table className="w-full text-left border-collapse min-w-[2000px]">
            <thead className="sticky top-0 z-40 shadow-sm">
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase h-12">
                    
                    {/* COLUMNAS FIJAS (COMUNES) */}
                    <th className="p-4 w-12 sticky left-0 z-50 bg-slate-50 border-r"></th> {/* Expand Toggle */}
                    
                    {/* COLUMNAS DINÁMICAS */}
                    {!isSimpleView && <th className="p-4 w-16 text-center sticky left-12 z-50 bg-slate-50 border-r">Ej</th>}
                    
                    <th className="p-4 min-w-[200px] sticky left-12 z-40 bg-slate-50 border-r">Empresa</th>
                    <th className="p-4 min-w-[250px] bg-slate-50">Comentarios (Concatenado)</th>
                    
                    {!isSimpleView && <th className="p-4 min-w-[100px] bg-slate-50 text-center">Fecha Alta</th>}
                    
                    <th className="p-4 min-w-[120px] bg-slate-50 font-bold text-slate-700">Contenedor</th>
                    <th className="p-4 min-w-[120px] bg-slate-50">Pedimento</th>
                    
                    {!isSimpleView && <th className="p-4 min-w-[100px] bg-slate-50">Factura</th>}
                    
                    <th className="p-4 min-w-[150px] bg-slate-50 text-blue-800">Proveedor</th>
                    
                    {/* DATOS BANCARIOS (SIEMPRE VISIBLES EN VISTA PAGOS, O FULL) */}
                    <th className="p-4 min-w-[100px] bg-slate-50 text-slate-400">Banco</th>
                    <th className="p-4 min-w-[120px] bg-slate-50 text-slate-400">Cuenta</th>
                    <th className="p-4 min-w-[150px] bg-slate-50 text-slate-400">CLABE</th>
                    
                    {/* LOGÍSTICA */}
                    <th className="p-4 min-w-[120px] bg-slate-50 text-center">ETA & Semáforo</th>
                    
                    {/* FINANCIERO */}
                    <th className="p-4 min-w-[150px] text-right bg-slate-50">Importe Total</th>
                    
                    {!isSimpleView && <th className="p-4 text-center bg-slate-50">Acciones</th>}
                </tr>
            </thead>
            <tbody className="text-sm">
              {filteredData.map((item) => {
                const isPaid = item.payment === 'paid'; 
                return (
                <React.Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${expandedRow === item.id ? 'bg-blue-50/30' : ''}`}>
                        
                        {/* 1. TOGGLE DETALLES */}
                        <td className="p-4 text-center cursor-pointer sticky left-0 z-20 bg-white border-r border-slate-100" onClick={() => toggleRow(item.id)}>
                            {expandedRow === item.id ? <ChevronUp size={18} className="text-blue-500"/> : <ChevronDown size={18} className="text-slate-400"/>}
                        </td>

                        {/* 2. EJECUTIVO (Solo Full) */}
                        {!isSimpleView && <td className="p-4 text-center sticky left-12 z-20 bg-white border-r font-bold text-slate-400">{item.ejecutivo}</td>}

                        {/* 3. EMPRESA */}
                        <td className="p-4 font-bold text-slate-700 truncate">{item.empresa}</td>

                        {/* 4. COMENTARIOS (CONCATENADOS) */}
                        <td className="p-4">
                            <span className="inline-block px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono font-bold text-slate-700 shadow-sm whitespace-nowrap">
                                {item.comentarios}
                            </span>
                        </td>

                        {/* 5. FECHA (Solo Full) */}
                        {!isSimpleView && <td className="p-4 text-center text-xs">{formatDate(item.fechaAlta)}</td>}

                        {/* 6. CONTENEDOR */}
                        <td className="p-4 font-mono font-bold">{item.contenedor}</td>

                        {/* 7. PEDIMENTO */}
                        <td className="p-4 text-xs">{item.pedimento || '-'}</td>

                        {/* 8. FACTURA (Solo Full) */}
                        {!isSimpleView && <td className="p-4 text-xs">{item.factura || '-'}</td>}

                        {/* 9. PROVEEDOR */}
                        <td className="p-4 text-xs font-bold text-blue-700">{item.proveedor}</td>

                        {/* 10. BANCOS */}
                        <td className="p-4 text-[10px] text-slate-500">{item.banco}</td>
                        <td className="p-4 text-[10px] text-slate-500 font-mono">{item.cuenta}</td>
                        <td className="p-4 text-[10px] text-slate-500 font-mono">{item.clabe}</td>

                        {/* 11. SEMÁFORO */}
                        <td className="p-4 text-center"><StatusBadge item={item} /> <div className="text-[10px] mt-1 text-slate-400">{formatDate(item.eta)}</div></td>

                        {/* 12. IMPORTE */}
                        <td className="p-4 text-right font-bold text-slate-800">${item.amount.toLocaleString()}</td>

                        {/* 13. ACCIONES (Solo Full) */}
                        {!isSimpleView && (
                            <td className="p-4 text-center">
                                <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                            </td>
                        )}
                    </tr>
                    
                    {/* DESGLOSE EXPANDIBLE (Mismo para ambas vistas, pero vital para Pagos) */}
                    {expandedRow === item.id && (
                        <tr className="bg-slate-50 animate-fade-in">
                            <td colSpan={isSimpleView ? "12" : "15"} className="p-0 border-b border-slate-200 shadow-inner">
                                <div className="p-6"> 
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b pb-2">Desglose de Costos & Acciones de Pago</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        {[
                                            {l:'Demoras', k:'costDemoras'}, {l:'Almacenaje', k:'costAlmacenaje'},
                                            {l:'Operativos', k:'costOperativos'}, {l:'Portuarios', k:'costPortuarios'},
                                            {l:'Apoyo', k:'costApoyo'}, {l:'Impuestos', k:'costImpuestos'},
                                            {l:'Liberación', k:'costLiberacion'}, {l:'Transporte', k:'costTransporte'}
                                        ].map((c) => (
                                            <div key={c.k} className="flex justify-between items-center p-2 bg-white border rounded shadow-sm">
                                                <span className="text-xs text-slate-500 font-bold uppercase">{c.l}</span>
                                                <span className="font-mono font-bold text-slate-800">${(item[c.k] || 0).toLocaleString()}</span>
                                                {canPay && (item[c.k] > 0) && (
                                                    <button onClick={() => onPayItem(item.id, c.k)} disabled={item.paidFlags?.[c.k] || isPaid} className={`ml-2 p-1 rounded text-[10px] font-bold uppercase ${item.paidFlags?.[c.k] || isPaid ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}>
                                                        {item.paidFlags?.[c.k] || isPaid ? 'Pagado' : 'Pagar'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        {canPay && !isPaid && <button onClick={() => onPayAll(item.id)} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded shadow hover:bg-emerald-700 text-xs">Saldar Total</button>}
                                        <button onClick={() => onCloseOperation(item)} className="px-4 py-2 bg-slate-800 text-white font-bold rounded shadow hover:bg-slate-900 text-xs flex items-center"><Lock size={12} className="mr-2"/> Cerrar Operación</button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
              )})} 
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- APP COMPONENT ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('admin');
  const [userName, setUserName] = useState('ADMIN'); // Nuevo estado para el nombre del ejecutivo

  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modales
  const [paymentConfirmation, setPaymentConfirmation] = useState({ isOpen: false, item: null });
  const [editingItem, setEditingItem] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [itemToClose, setItemToClose] = useState(null);

  const handleLogin = (userRole, name) => { 
      setRole(userRole); 
      setUserName(name); 
      setIsLoggedIn(true); 
  };
  
  const handleLogout = () => { setIsLoggedIn(false); setActiveTab('dashboard'); };

  const handleSave = (newItem) => {
    const itemWithId = { ...newItem, id: Date.now() };
    setData([itemWithId, ...data]);
    setActiveTab('list');
  };

  const handlePayItem = (id, costKey) => {
      const newData = data.map(d => {
        if (d.id === id) {
          const currentFlags = d.paidFlags || {};
          return { ...d, paidFlags: { ...currentFlags, [costKey]: true } };
        }
        return d;
      });
      setData(newData);
  };

  const handlePayAll = (id) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const newData = data.map(d => {
        if (d.id === id) {
          return { 
              ...d, payment: 'paid', paymentDate: todayStr,
              paidFlags: { costDemoras: true, costAlmacenaje: true, costOperativos: true, costPortuarios: true, costApoyo: true, costImpuestos: true, costLiberacion: true, costTransporte: true }
          };
        }
        return d;
      });
      setData(newData);
  };

  const handleCloseOperation = (item) => {
      // Lógica simplificada para el ejemplo
      alert(`Cerrando operación para ${item.contenedor}`);
      const newData = data.map(d => d.id === item.id ? { ...d, status: 'closed' } : d);
      setData(newData);
  };

  if (!isLoggedIn) { return <LoginView onLogin={handleLogin} />; }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 relative">
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out relative`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-9 bg-blue-600 text-white p-1 rounded-full shadow-lg border-2 border-slate-100 hover:bg-blue-700 transition-colors z-20">{isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}><div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"><Ship size={20} className="text-white" /></div>{!isSidebarCollapsed && (<div className="overflow-hidden"><span className="text-lg font-bold tracking-tight whitespace-nowrap">AduanaSoft</span><p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">v2.3 Beta</p></div>)}</div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />{!isSidebarCollapsed && "Dashboard"}</button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg ${activeTab === 'list' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}><TableIcon size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />{!isSidebarCollapsed && "Sábana Operativa"}</button>
          <button onClick={() => setActiveTab('capture')} className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg ${activeTab === 'capture' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}><Plus size={20} className={isSidebarCollapsed ? '' : 'mr-3'} />{!isSidebarCollapsed && "Alta Contenedor"}</button>
        </nav>

        <div className="p-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 mb-2 text-center">{userName} ({role})</div>
            <button onClick={handleLogout} className="w-full py-2 bg-red-900/50 text-red-200 rounded text-xs font-bold">Cerrar Sesión</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
            <h1 className="text-xl font-bold text-slate-800">Panel de Control</h1>
            <div className="flex items-center gap-2 text-sm"><User size={16}/> Hola, <span className="font-bold">{userName}</span></div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <div className="p-10 text-center text-slate-500">Dashboard en construcción...</div>}
          {activeTab === 'capture' && <CaptureForm onSave={handleSave} onCancel={() => setActiveTab('dashboard')} existingData={data} role={role} userName={userName} />}
          {activeTab === 'list' && (
            <ListView 
                data={data} 
                onPayItem={handlePayItem} 
                onPayAll={handlePayAll} 
                onCloseOperation={handleCloseOperation} 
                role={role} 
                onEdit={() => {}} 
            />
          )}
        </div>
      </main>
    </div>
  );
}