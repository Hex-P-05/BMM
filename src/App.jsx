import React, { useState, useMemo, useEffect } from 'react';
// --- LIBRERÍAS PARA PDF ---
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; 
// --------------------------

import { 
  LayoutDashboard, FileText, Table as TableIcon, AlertTriangle, CheckCircle, 
  Clock, Ship, DollarSign, Plus, Search, Menu, X, User, Edit, Lock, 
  TrendingUp, TrendingDown, Activity, AlertCircle, Calculator, Trash2, 
  Download, Printer, Package, MapPin, Key, LogOut, Check, 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ShieldAlert, CreditCard 
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

// --- DATOS INICIALES (MOCKS CON STATUS DE PAGO DETALLADO) ---
// paidFlags: Objeto que rastrea qué se ha pagado individualmente
const rawData = [
  { 
    id: 1, bl: 'HLCU12345678', provider: 'HAPAG', client: 'Importadora México S.A.', clientCode: 'IMP', reason: 'FLETE', container: 'MSKU987654', eta: addDays(45), freeDays: 7, editCount: 0, paymentDate: '2025-06-10', paymentDelay: 0, currency: 'MXN', concept: 'HAPAG IMP 1 FLETE',
    costDemoras: 0, costAlmacenaje: 0, costOperativos: 5000, costPortuarios: 2000, costApoyo: 0, costImpuestos: 1000, costLiberacion: 0, costTransporte: 7000,
    amount: 15000,
    paidFlags: { costDemoras: true, costAlmacenaje: true, costOperativos: true, costPortuarios: true, costApoyo: true, costImpuestos: true, costLiberacion: true, costTransporte: true } // Todo pagado
  },
  { 
    id: 2, bl: 'MAEU87654321', provider: 'MAERSK', client: 'Logística Global', clientCode: 'LOG', reason: 'DEMORAS', container: 'TCLU123000', eta: addDays(-5), freeDays: 14, editCount: 1, paymentDate: null, paymentDelay: 0, currency: 'USD', concept: 'MAERSK LOG 1 DEMORAS',
    costDemoras: 15000, costAlmacenaje: 5000, costOperativos: 1000, costPortuarios: 0, costApoyo: 0, costImpuestos: 500, costLiberacion: 0, costTransporte: 1000,
    amount: 22500,
    paidFlags: { costDemoras: true, costAlmacenaje: false, costOperativos: false, costPortuarios: true, costApoyo: true, costImpuestos: false, costLiberacion: true, costTransporte: false } // Parcial
  },
  { 
    id: 3, bl: 'COSU11223344', provider: 'COSCO', client: 'Textiles del Norte', clientCode: 'TEX', reason: 'GARANTÍA', container: 'MRKU554433', eta: addDays(-3), freeDays: 21, editCount: 2, paymentDate: null, paymentDelay: 0, currency: 'MXN', concept: 'COSCO TEX 1 GARANTÍA',
    costDemoras: 0, costAlmacenaje: 0, costOperativos: 0, costPortuarios: 0, costApoyo: 18000, costImpuestos: 0, costLiberacion: 0, costTransporte: 0,
    amount: 18000,
    paidFlags: { costDemoras: false, costAlmacenaje: false, costOperativos: false, costPortuarios: false, costApoyo: false, costImpuestos: false, costLiberacion: false, costTransporte: false } // Nada pagado
  },
];

const NAVIERAS_DB = [
  { id: '1', nombre: 'HAPAG-LLOYD', rfc: 'HPL990202ABC', direccion: 'Calle Hamburgo 15, Juárez, CDMX' },
  { id: '2', nombre: 'MAERSK MEXICO', rfc: 'MAE980101XYZ', direccion: 'Av. Paseo de la Reforma 222, CDMX' },
  { id: '3', nombre: 'COSCO SHIPPING', rfc: 'COS000303QWE', direccion: 'Blvd. Manuel Ávila Camacho 40, Edo Mex' },
  { id: '4', nombre: 'MSC MEXICO', rfc: 'MSC112233R55', direccion: 'Av. Ejército Nacional 843, CDMX' },
  { id: '5', nombre: 'ONE (OCEAN NETWORK)', rfc: 'ONE223344T88', direccion: 'Insurgentes Sur 1458, CDMX' },
];

const initialData = rawData.map(item => ({
  ...item,
  status: calculateStatus(item.eta)
}));

const COLORS = {
  ok: '#10B981', warning: '#F59E0B', danger: '#EF4444', expired: '#991B1B', primary: '#2563EB', secondary: '#8b5cf6'
};

// --- COMPONENTES UI AUXILIARES ---

// Función auxiliar para checar si todo está pagado
const checkPaymentStatus = (item) => {
  const keys = ['costDemoras', 'costAlmacenaje', 'costOperativos', 'costPortuarios', 'costApoyo', 'costImpuestos', 'costLiberacion', 'costTransporte'];
  // Verificamos si hay ALGUN costo mayor a 0 que NO esté pagado
  const hasPending = keys.some(k => (item[k] > 0) && !item.paidFlags?.[k]);
  return hasPending ? 'pending' : 'paid';
};

const PaymentStatusBadge = ({ item }) => {
  const status = checkPaymentStatus(item);

  if (status === 'paid') {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm bg-green-600">
        <Check size={14} className="mr-1" strokeWidth={3} />
        PAGADO
      </span>
    );
  }
  
  // ESTADO NARANJA (PENDIENTE)
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
      <Clock size={14} className="mr-1" />
      Pendiente de pago
    </span>
  );
};

const RoleBadge = ({ role, collapsed }) => {
  const styles = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    ejecutivo: 'bg-blue-100 text-blue-800 border-blue-200',
    pagos: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };
  
  if (collapsed) {
     return <div className={`w-3 h-3 rounded-full ${styles[role] || styles.ejecutivo} border`}></div>
  }

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border uppercase ${styles[role] || styles.ejecutivo}`}>
      {role === 'ejecutivo' ? 'Revalidaciones' : role}
    </span>
  );
};

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

// --- MODAL DE EDICIÓN ---
const EditModal = ({ isOpen, onClose, onSave, item, role }) => {
  if (!isOpen || !item) return null;

  const isRestricted = role !== 'admin';
  const [editData, setEditData] = useState({ ...item });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name.startsWith('cost') ? (parseFloat(value) || 0) : value;
    
    if (name.startsWith('cost')) {
        const newData = { ...editData, [name]: val };
        const total = 
            (newData.costDemoras || 0) + (newData.costAlmacenaje || 0) + (newData.costOperativos || 0) + 
            (newData.costPortuarios || 0) + (newData.costApoyo || 0) + (newData.costImpuestos || 0) + 
            (newData.costLiberacion || 0) + (newData.costTransporte || 0);
        setEditData({ ...newData, amount: total });
    } else {
        setEditData({ ...editData, [name]: value });
    }
  };

  const handleSave = () => {
    onSave(editData);
  };

  const costInputs = [
    { key: 'costDemoras', label: 'Demoras' }, { key: 'costAlmacenaje', label: 'Almacenaje' },
    { key: 'costOperativos', label: 'Costos operativos' }, { key: 'costPortuarios', label: 'Gastos portuarios' },
    { key: 'costApoyo', label: 'Apoyo' }, { key: 'costImpuestos', label: 'Impuestos' },
    { key: 'costLiberacion', label: 'Liberación abandono' }, { key: 'costTransporte', label: 'Transporte' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-50 p-6 border-b border-blue-100 flex justify-between items-center sticky top-0 z-20">
          <div>
             <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Edit size={20} className="mr-2 text-blue-600"/> Editar contenedor
             </h3>
             <p className="text-xs text-slate-500">
               {isRestricted 
                 ? `Modo restringido: Solo puedes editar fechas y días libres. (Edición ${item.editCount + 1}/2)` 
                 : 'Modo administrador: Acceso total.'}
             </p>
          </div>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-1"><label className="text-xs font-bold text-slate-500 mb-1 block">BL (master)</label><input disabled name="bl" value={editData.bl} onChange={handleChange} className="w-full p-2 border rounded bg-slate-100 text-slate-500 cursor-not-allowed" /></div>
          <div className="col-span-1"><label className="text-xs font-bold text-slate-500 mb-1 block">Contenedor</label><input disabled name="container" value={editData.container} onChange={handleChange} className="w-full p-2 border rounded bg-slate-100 text-slate-500 cursor-not-allowed" /></div>
          
          <div className="col-span-1"><label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">Fecha ETA {isRestricted && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}</label><input type="date" name="eta" value={editData.eta} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div className="col-span-1"><label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">Días libres {isRestricted && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}</label><input type="number" name="freeDays" value={editData.freeDays} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" /></div>

          <div className="col-span-2 border-t pt-4 mt-2">
             <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-slate-500 uppercase">Desglose de costos</label><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">Total: ${editData.amount.toLocaleString()}</span></div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {costInputs.map(field => (
                    <div key={field.key}>
                        <label className="text-[10px] font-medium text-slate-500 mb-1 block">{field.label}</label>
                        <input disabled={isRestricted} type="number" name={field.key} value={editData[field.key]} onChange={handleChange} className={`w-full p-2 border rounded text-xs text-right outline-none ${isRestricted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`} />
                    </div>
                ))}
             </div>
             {isRestricted && <p className="text-[10px] text-red-400 mt-3 italic">* Para modificar montos o datos fiscales contacte a un administrador.</p>}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 sticky bottom-0 z-20">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded text-sm font-bold">Cancelar</button>
           <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-sm font-bold">Guardar cambios</button>
        </div>
      </div>
    </div>
  );
};

// --- NUEVO MODAL DE PAGOS (DETALLADO Y RESUMEN) ---
const DetailedPaymentModal = ({ isOpen, onClose, onConfirm, pendingItems, isBulk }) => {
  if (!isOpen || !pendingItems) return null;

  // Calculamos el total a pagar en este momento
  const totalToPay = pendingItems.reduce((acc, curr) => acc + curr.amount, 0);
  const currency = pendingItems[0]?.currency || 'MXN';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden transform transition-all scale-100">
        
        <div className="bg-blue-600 p-6 border-b border-blue-700 flex items-start space-x-4">
          <div className="p-3 bg-white/20 text-white rounded-full flex-shrink-0">
            <CreditCard size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Confirmación de pago</h3>
            <p className="text-sm text-blue-100 mt-1">
              {isBulk ? 'Estás a punto de liquidar todos los conceptos pendientes.' : 'Estás a punto de registrar un pago individual.'}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-6">
             <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Conceptos a pagar</span>
                <span className="text-xs font-bold text-slate-400">{pendingItems.length} ítem(s)</span>
             </div>
             <div className="max-h-48 overflow-y-auto">
               <table className="w-full text-sm text-left">
                 <tbody className="divide-y divide-slate-200">
                   {pendingItems.map((item, idx) => (
                     <tr key={idx}>
                       <td className="p-3 text-slate-600 font-medium">{item.label}</td>
                       <td className="p-3 text-right font-bold text-slate-800">${item.amount.toLocaleString()}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             <div className="p-4 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
                <span className="font-bold text-blue-800">Total a liquidar:</span>
                <span className="text-xl font-bold text-blue-900">${totalToPay.toLocaleString()} <span className="text-sm font-normal">{currency}</span></span>
             </div>
          </div>
          
          <p className="text-xs text-center text-slate-400">
            Al confirmar, los conceptos seleccionados se marcarán como <span className="font-bold text-green-600">PAGADOS</span> y se registrará la fecha de hoy.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex space-x-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex justify-center items-center">
            <CheckCircle size={20} className="mr-2" /> Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (email === 'admin@aduanasoft.com' && password === 'admin') { onLogin('admin'); } 
    else if (email === 'operaciones@aduanasoft.com' && password === 'ops') { onLogin('ejecutivo'); } 
    else if (email === 'pagos@aduanasoft.com' && password === 'pagos') { onLogin('pagos'); } 
    else { setError('Credenciales incorrectas. Intenta: admin@aduanasoft.com / admin'); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 w-full">
          <div className="flex items-center space-x-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Ship size={24} className="text-white" /></div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">AduanaSoft</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Bienvenido de nuevo</h2>
          <p className="text-slate-500 text-sm mb-6 text-center">Ingresa a tu cuenta para gestionar operaciones.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label><div className="relative"><User className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="usuario@empresa.com" autoFocus /></div></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label><div className="relative"><Key className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" /></div></div>
            {error && (<div className="bg-red-50 text-red-600 text-xs p-3 rounded flex items-center"><AlertCircle size={14} className="mr-2" />{error}</div>)}
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Iniciar sesión</button>
          </form>
          <div className="mt-8 text-center"><p className="text-xs text-slate-400">v2.2 Beta | © 2025 AduanaSoft</p></div>
        </div>
      </div>
    </div>
  );
};

const QuoteGenerator = ({ role }) => {
  if (role === 'pagos') return <div className="p-10 text-center text-red-500 font-bold">Acceso denegado: Solo admin y revalidaciones pueden cotizar.</div>;

  const [quoteData, setQuoteData] = useState({
    clienteNombre: '', clienteReferencia: '', fechaEmision: new Date().toISOString().split('T')[0],
    bl: '', contenedor: '', eta: '', fechaEntrega: '', puerto: 'MANZANILLO', terminal: 'CONTECON', diasDemoras: 0, diasAlmacenaje: 0, naviera: '',
    costoDemoras: 0, costoAlmacenaje: 0, costosOperativos: 0, costoGastosPortuarios: 0, apoyo: 0, impuestos: 0, liberacion: 0, transporte: 0,
    currency: 'MXN'
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setQuoteData({ ...quoteData, [name]: type === 'number' ? parseFloat(value) || 0 : value });
  };

  const subtotal = quoteData.costoDemoras + quoteData.costoAlmacenaje + quoteData.costosOperativos + quoteData.costoGastosPortuarios + quoteData.apoyo + quoteData.impuestos + quoteData.liberacion + quoteData.transporte;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-content');
    if(!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const cleanRef = quoteData.clienteReferencia.replace(/[^a-zA-Z0-9-_]/g, '');
      const fileName = cleanRef ? `${cleanRef}.pdf` : `Cotizacion_AduanaSoft_${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Hubo un error al generar el PDF.");
    }
  };

  const tableRows = [
    { label: '提货单// BL', value: quoteData.bl, isMoney: false },
    { label: '容器 // CONTENEDOR', value: quoteData.contenedor, isMoney: false },
    { label: '预计到达时间// ETA', value: formatDate(quoteData.eta), isMoney: false },
    { label: '交货日期// FECHA DE ENTREGA', value: formatDate(quoteData.fechaEntrega), isMoney: false, className: 'bg-green-100' },
    { label: '卸货港 // PUERTO', value: quoteData.puerto, isMoney: false },
    { label: '码头 // TERMINAL', value: quoteData.terminal, isMoney: false },
    { label: '延誤數日// DIAS DE DEMORAS', value: quoteData.diasDemoras, isMoney: false },
    { label: '储存天數 // DIAS DE ALMACENAJE', value: quoteData.diasAlmacenaje, isMoney: false },
    { label: '航运公司// NAVIERA', value: quoteData.naviera, isMoney: false },
    { label: '延误// DEMORAS', value: quoteData.costoDemoras, isMoney: true },
    { label: '贮存// ALMACENAJE', value: quoteData.costoAlmacenaje, isMoney: true },
    { label: '營運成本// COSTOS OPERATIVOS', value: quoteData.costosOperativos, isMoney: true },
    { label: '港口费用// GASTOS PORTUARIOS', value: quoteData.costoGastosPortuarios, isMoney: true },
    { label: '支援// APOYO', value: quoteData.apoyo, isMoney: true, labelClass: 'text-red-500 font-bold' },
    { label: '税收// IMPUESTOS', value: quoteData.impuestos, isMoney: true },
    { label: '摆脱遗弃// LIBERACION DE ABANDONO', value: quoteData.liberacion, isMoney: true },
    { label: '運輸// TRANSPORTE', value: quoteData.transporte, isMoney: true },
  ];

  const costFields = [
    { id: 'costoDemoras', label: 'Demoras' }, { id: 'costoAlmacenaje', label: 'Almacenaje' }, { id: 'costosOperativos', label: 'Costos operativos' }, { id: 'costoGastosPortuarios', label: 'Gastos portuarios' },
    { id: 'apoyo', label: 'Apoyo' }, { id: 'impuestos', label: 'Impuestos' }, { id: 'liberacion', label: 'Liberación abandono' }, { id: 'transporte', label: 'Transporte' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in pb-8">
      <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center border-b pb-2"><Edit size={18} className="mr-2 text-blue-600"/> Editar cotización</h3>
        <div className="space-y-4">
           <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
             <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Datos del encabezado</h4>
             <div className="space-y-2">
                <input name="clienteNombre" placeholder="Razón social cliente" value={quoteData.clienteNombre} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
                <div className="grid grid-cols-2 gap-2"><input name="clienteReferencia" placeholder="Referencia (nombre PDF)" value={quoteData.clienteReferencia} onChange={handleChange} className="p-2 border rounded text-sm font-bold text-slate-700" /><input type="date" name="fechaEmision" value={quoteData.fechaEmision} onChange={handleChange} className="p-2 border rounded text-sm" /></div>
             </div>
          </div>
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Datos operativos</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 grid grid-cols-2 gap-3"><input name="bl" placeholder="BL Master" value={quoteData.bl} onChange={handleChange} className="p-2 border rounded text-sm uppercase" /><input name="contenedor" placeholder="Contenedor" value={quoteData.contenedor} onChange={handleChange} className="p-2 border rounded text-sm uppercase" /></div>
              <div className="col-span-1"><label className="text-[10px] text-slate-400 font-bold block mb-1">ETA</label><input type="date" name="eta" value={quoteData.eta} onChange={handleChange} className="w-full p-2 border rounded text-sm" /></div>
              <div className="col-span-1"><label className="text-[10px] text-green-600 font-bold block mb-1">ENTREGA</label><input type="date" name="fechaEntrega" value={quoteData.fechaEntrega} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-green-50 border-green-200" /></div>
              <input name="puerto" placeholder="Puerto" value={quoteData.puerto} onChange={handleChange} className="p-2 border rounded text-sm" /><input name="terminal" placeholder="Terminal" value={quoteData.terminal} onChange={handleChange} className="p-2 border rounded text-sm" />
              <div className="col-span-2"><input name="naviera" placeholder="Naviera" value={quoteData.naviera} onChange={handleChange} className="w-full p-2 border rounded text-sm" /></div>
              <div className="col-span-2 grid grid-cols-2 gap-3 mt-2">
                <div><label className="text-xs font-bold text-slate-500 mb-1 block">Días demoras</label><div className="flex items-center"><input type="number" name="diasDemoras" value={quoteData.diasDemoras} onChange={handleChange} className="w-full p-2 border border-r-0 rounded-l text-sm text-center outline-none" /><span className="bg-slate-200 border border-slate-300 rounded-r px-2 py-2 text-xs text-slate-600 font-bold">Días</span></div></div>
                <div><label className="text-xs font-bold text-slate-500 mb-1 block">Días almacenaje</label><div className="flex items-center"><input type="number" name="diasAlmacenaje" value={quoteData.diasAlmacenaje} onChange={handleChange} className="w-full p-2 border border-r-0 rounded-l text-sm text-center outline-none" /><span className="bg-slate-200 border border-slate-300 rounded-r px-2 py-2 text-xs text-slate-600 font-bold">Días</span></div></div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold text-slate-500 uppercase">Costos</h4><select name="currency" value={quoteData.currency} onChange={handleChange} className="text-xs p-1 border rounded font-bold text-blue-600 bg-white shadow-sm outline-none"><option value="MXN">MXN (Pesos)</option><option value="USD">USD (Dólares)</option></select></div>
            <div className="space-y-3">{costFields.map((field) => (<div key={field.id} className="flex items-center justify-between"><label className="text-xs font-medium text-slate-600 w-1/3">{field.label}</label><div className="relative w-2/3"><span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">$</span><input type="number" name={field.id} value={quoteData[field.id]} onChange={handleChange} placeholder="0.00" className="w-full p-2 pl-6 border rounded text-sm text-right font-mono focus:border-blue-500 outline-none" /></div></div>))}</div>
          </div>
        </div>
      </div>
      <div className="lg:w-2/3 bg-slate-200 rounded-xl p-8 overflow-y-auto flex flex-col items-center shadow-inner relative">
        <div className="absolute top-4 right-4 z-10"><button onClick={handleDownloadPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold flex items-center hover:bg-blue-700 transition-transform transform hover:-translate-y-1"><Download size={16} className="mr-2" /> Descargar PDF</button></div>
        <div id="invoice-content" className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-2xl text-slate-900 font-sans border border-slate-300 relative flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
              <div className="flex items-center"><div className="w-14 h-14 bg-blue-900 text-white rounded flex items-center justify-center mr-4"><Ship size={28} /></div><div><h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">AduanaSoft</h1><p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Logística y despacho</p><p className="text-[9px] text-slate-400 mt-1">Av. Puerto Interior 55, Manzanillo, Colima.<br/>RFC: ADU20250101-XM3</p></div></div>
              <div className="text-right"><h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Cotización</h2><p className="text-[10px] text-slate-500 mt-1">Fecha: {formatDate(quoteData.fechaEmision)}</p></div>
            </div>
            <div className="mb-4 bg-slate-50 p-3 rounded border border-slate-100">
               <div className="grid grid-cols-2 gap-4 text-xs"><div><span className="block text-[9px] font-bold text-slate-400 uppercase">Cliente / razón social</span><span className="font-bold text-slate-800 uppercase">{quoteData.clienteNombre || 'CLIENTE MOSTRADOR'}</span></div><div><span className="block text-[9px] font-bold text-slate-400 uppercase">Referencia</span><span className="font-bold text-slate-800 uppercase">{quoteData.clienteReferencia || 'S/N'}</span></div></div>
            </div>
            <div className="border-2 border-black">
              <div className="bg-blue-100 border-b border-black py-1 text-center"><h2 className="text-base font-bold text-red-600 tracking-wide uppercase">价格 // COTIZACION</h2></div>
              {tableRows.map((row, index) => (<div key={index} className={`flex border-b border-black last:border-0 text-xs ${row.className || ''}`}><div className="w-1/2 border-r border-black py-1 px-2 flex items-center justify-end text-right bg-white"><span className={`font-medium uppercase text-[11px] ${row.labelClass || 'text-black'}`}>{row.label}</span></div><div className="w-1/2 py-1 px-2 flex items-center justify-center bg-white"><span className="font-bold text-slate-800">{row.isMoney && <span className="text-[9px] mr-1 text-slate-500 font-normal">{quoteData.currency}</span>}{row.isMoney ? `$${row.value.toLocaleString(undefined, {minimumFractionDigits: 2})}` : (row.value || '-')}</span></div></div>))}
              <div className="flex border-t-2 border-black bg-yellow-300"><div className="w-1/2 border-r border-black py-1 px-2 text-right flex items-center justify-end"><span className="text-sm font-bold">SUBTOTAL</span></div><div className="w-1/2 py-1 px-2 text-center flex flex-col justify-center"><span className="text-base font-bold"><span className="text-[10px] mr-1 font-normal">{quoteData.currency}</span>${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div></div>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-300 pt-2">
             <div className="flex justify-between items-end text-[9px] text-slate-400">
                <div className="max-w-[60%]"><p className="font-bold uppercase text-slate-600 mb-1">Términos y condiciones</p><p>1. Esta cotización tiene una vigencia de 7 días naturales.</p><p>2. Precios sujetos a cambios sin previo aviso por parte de la naviera.</p></div>
                <div className="text-right"><p className="mb-4">__________________________<br/>Firma de conformidad</p><p>AduanaSoft v2.2 | Página 1 de 1</p></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ data }) => {
  const total = data.length;
  // Ajuste de lógica para contar pendientes basados en status de pago real
  const warning = data.filter(i => i.status === 'warning' && checkPaymentStatus(i) === 'pending').length;
  const danger = data.filter(i => (i.status === 'danger' || i.status === 'expired') && checkPaymentStatus(i) === 'pending').length;
  const pendingMoney = data.filter(i => checkPaymentStatus(i) === 'pending').reduce((acc, curr) => acc + curr.amount, 0); // Simplificado para el dashboard
  
  const clientData = useMemo(() => { const counts = {}; data.forEach(item => { counts[item.client] = (counts[item.client] || 0) + 1; }); return Object.keys(counts).map(key => ({ name: key, count: counts[key] })); }, [data]);
  const statusData = [{ name: 'A tiempo', value: total - warning - danger }, { name: 'Riesgo', value: warning }, { name: 'Penalizado', value: danger }];
  const performanceData = [{ name: 'Lun', operaciones: 12, monto: 15000 }, { name: 'Mar', operaciones: 19, monto: 22000 }, { name: 'Mié', operaciones: 15, monto: 18000 }, { name: 'Jue', operaciones: 25, monto: 35000 }, { name: 'Vie', operaciones: 32, monto: 45000 }, { name: 'Sáb', operaciones: 20, monto: 28000 }, { name: 'Dom', operaciones: 10, monto: 12000 }];
  const recentActivities = [{ id: 1, user: 'Admin', action: 'Pago registrado', details: 'BL HLCU123...', time: 'Hace 5 min' }, { id: 2, user: 'Ejecutivo', action: 'Nueva captura', details: 'Cliente: Textil...', time: 'Hace 24 min' }, { id: 3, user: 'Sistema', action: 'Alerta generada', details: 'ETA vencido MAEU...', time: 'Hace 1 hora' }, { id: 4, user: 'Pagos', action: 'Cierre de día', details: 'Reporte generado', time: 'Ayer' }];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Contenedores activos" value={total} icon={Ship} colorClass="bg-blue-100 text-blue-600" trend="up" trendValue="+12%" subtext="vs mes pasado" />
        <KPICard title="Alertas (próximos)" value={warning} icon={Clock} colorClass="bg-yellow-100 text-yellow-600" trend="down" trendValue="-5%" subtext="mejoría en tiempos" />
        <KPICard title="Críticos (vencidos)" value={danger} icon={AlertTriangle} colorClass="bg-red-100 text-red-600" trend="up" trendValue="+2" subtext="requiere atención" />
        <KPICard title="Cuentas por cobrar" value={`$${(pendingMoney/1000).toFixed(1)}k`} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-600" trend="up" trendValue="+8%" subtext="flujo de caja proyectado" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6"><div><h3 className="text-lg font-bold text-slate-800">Dinámica semanal</h3><p className="text-xs text-slate-400">Volumen de operaciones y montos</p></div><select className="bg-slate-50 border border-slate-200 text-xs rounded-md p-1 outline-none text-slate-600"><option>Últimos 7 días</option><option>Este mes</option></select></div>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData}><defs><linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} /><YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} /><Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} /><Area type="monotone" dataKey="monto" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorOps)" name="Monto ($)" /></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Activity size={18} className="mr-2 text-blue-500"/> Actividad reciente</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">{recentActivities.map((act) => (<div key={act.id} className="flex items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3 flex-shrink-0 text-xs font-bold">{act.user.charAt(0)}</div><div><p className="text-sm font-medium text-slate-700">{act.action}</p><p className="text-xs text-slate-400">{act.details}</p><p className="text-[10px] text-slate-300 mt-1">{act.time}</p></div></div>))}</div>
          <button className="mt-4 w-full py-2 text-xs text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">Ver todo el historial</button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-start justify-between"><div><h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Salud de la operación</h3><p className="text-2xl font-bold text-slate-800">92% <span className="text-sm font-normal text-slate-400">Eficiencia</span></p></div><div className="h-48 w-full max-w-xs"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value"><Cell fill={COLORS.ok} /><Cell fill={COLORS.warning} /><Cell fill={COLORS.danger} /></Pie><Tooltip /><Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" /></PieChart></ResponsiveContainer></div></div>
        </div>
      </div>
    </div>
  );
};

const CaptureForm = ({ onSave, onCancel, existingData, role }) => {
  if (role === 'pagos') return <div className="p-10 text-center text-red-500 font-bold">Acceso denegado: Rol no autorizado para capturas.</div>;

  const [formData, setFormData] = useState({
    bl: '', provider: '', rfc: '', address: '', client: '', reason: 'GARANTÍA', container: '', eta: '', currency: 'MXN',
    freeDays: 7,
    costDemoras: 0, costAlmacenaje: 0, costOperativos: 0, costPortuarios: 0,
    costApoyo: 0, costImpuestos: 0, costLiberacion: 0, costTransporte: 0
  });
  const [totalAmount, setTotalAmount] = useState(0);
  
  const [generatedConcept, setGeneratedConcept] = useState('');
  const [clientConsecutive, setClientConsecutive] = useState(1);

  useEffect(() => {
    const sum = 
      (parseFloat(formData.costDemoras) || 0) + (parseFloat(formData.costAlmacenaje) || 0) +
      (parseFloat(formData.costOperativos) || 0) + (parseFloat(formData.costPortuarios) || 0) +
      (parseFloat(formData.costApoyo) || 0) + (parseFloat(formData.costImpuestos) || 0) +
      (parseFloat(formData.costLiberacion) || 0) + (parseFloat(formData.costTransporte) || 0);
    setTotalAmount(sum);
  }, [formData]);

  useEffect(() => {
    const code = formData.client ? formData.client.substring(0, 3).toUpperCase() : 'XXX';
    const matches = existingData.filter(item => item.client.trim().toLowerCase() === formData.client.trim().toLowerCase());
    const nextNum = matches.length + 1;
    setClientConsecutive(nextNum);
    const providerStr = formData.provider ? formData.provider.toUpperCase() : 'EMP';
    const reasonStr = formData.reason.toUpperCase();
    setGeneratedConcept(`${providerStr} ${code} ${nextNum} ${reasonStr}`);
  }, [formData.provider, formData.client, formData.reason, existingData]);

  const handleNavieraChange = (e) => {
    const nombreSeleccionado = e.target.value;
    const naviera = NAVIERAS_DB.find(n => n.nombre === nombreSeleccionado);
    if (naviera) { setFormData({ ...formData, provider: naviera.nombre, rfc: naviera.rfc, address: naviera.direccion }); } 
    else { setFormData({ ...formData, provider: nombreSeleccionado, rfc: '', address: '' }); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const calculatedStatus = calculateStatus(formData.eta);
    onSave({ 
      ...formData, 
      clientCode: formData.client.substring(0, 3).toUpperCase(),
      amount: totalAmount, 
      status: calculatedStatus, 
      paymentDate: null,
      paymentDelay: 0,
      editCount: 0, 
      paidFlags: {}, // Inicializa sin pagos
      concept: generatedConcept 
    });
  };
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const costFieldsInputs = [
    { name: 'costDemoras', label: 'Demoras' }, { name: 'costAlmacenaje', label: 'Almacenaje' },
    { name: 'costOperativos', label: 'Costos operativos' }, { name: 'costPortuarios', label: 'Gastos portuarios' },
    { name: 'costApoyo', label: 'Apoyo' }, { name: 'costImpuestos', label: 'Impuestos' },
    { name: 'costLiberacion', label: 'Liberación abandono' }, { name: 'costTransporte', label: 'Transporte' },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div><h2 className="text-xl font-bold text-slate-800 flex items-center"><FileText className="mr-2 text-blue-600" /> Alta de nuevo contenedor</h2><p className="text-slate-500 text-sm">Los datos fiscales se autocompletarán al seleccionar naviera.</p></div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center"><Ship size={14} className="mr-1"/> Datos de la naviera y concepto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Naviera / proveedor</label><select required name="provider" className="w-full p-2 border rounded text-sm bg-white outline-none" onChange={handleNavieraChange} value={formData.provider}><option value="">-- Selecciona naviera --</option>{NAVIERAS_DB.map(nav => (<option key={nav.id} value={nav.nombre}>{nav.nombre}</option>))}<option value="OTRA">OTRA (Manual)</option></select></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Cliente</label><input required name="client" placeholder="Nombre del cliente" className="w-full p-2 border rounded text-sm outline-none" onChange={handleChange} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
               <div><label className="text-xs font-medium text-slate-600 mb-1 block">RFC (emisor)</label><input name="rfc" value={formData.rfc} onChange={handleChange} placeholder="Autocompletado..." className="w-full p-2 border rounded text-sm bg-white font-mono text-slate-600 outline-none" /></div>
               <div className="md:col-span-2"><label className="text-xs font-medium text-slate-600 mb-1 block">Dirección fiscal</label><input name="address" value={formData.address} onChange={handleChange} placeholder="Autocompletado..." className="w-full p-2 border rounded text-sm bg-white text-slate-600 outline-none" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="md:col-span-3"><label className="text-xs font-medium text-slate-600 mb-1 block">Motivo</label><select name="reason" className="w-full p-2 border rounded text-sm bg-white outline-none" onChange={handleChange}><option>GARANTÍA</option><option>FLETE</option><option>ALMACENAJE</option><option>DEMORAS</option></select></div>
            </div>
            <div className="mt-3 p-3 bg-slate-800 text-green-400 font-mono text-sm rounded flex justify-between items-center shadow-inner"><span className="flex items-center"><FileText size={14} className="mr-2"/> {generatedConcept}</span><span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">Consecutivo #{clientConsecutive}</span></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2"><label className="text-sm font-bold text-slate-700">BL (master)</label><input required name="bl" className="w-full p-2 border rounded uppercase font-mono outline-none" onChange={handleChange} placeholder="HLCU..." /></div>
            <div><label className="text-sm font-medium text-slate-700">Contenedor</label><input required name="container" className="w-full p-2 border rounded uppercase outline-none" onChange={handleChange} placeholder="MSKU..." /></div>
            <div><label className="text-sm font-medium text-slate-700">Fecha ETA</label><input required name="eta" type="date" className="w-full p-2 border rounded outline-none" onChange={handleChange} /></div>
            <div><label className="text-sm font-medium text-slate-700">Días libres</label><input required name="freeDays" type="number" value={formData.freeDays} className="w-full p-2 border rounded outline-none" onChange={handleChange} /></div>
            
            <div className="col-span-2 border-t pt-4">
               <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700">Desglose de costos</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="text-xs p-1 border rounded font-bold text-blue-600 bg-white"><option value="MXN">MXN (Pesos)</option><option value="USD">USD (Dólares)</option></select>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {costFieldsInputs.map(field => (
                      <div key={field.name}>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">{field.label}</label>
                          <div className="relative">
                             <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                             <input type="number" name={field.name} className="w-full pl-5 p-1.5 border rounded text-sm text-right outline-none focus:border-blue-500" onChange={handleChange} placeholder="0" />
                          </div>
                      </div>
                  ))}
               </div>
               <div className="mt-4 flex justify-end">
                  <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                     <span className="text-xs text-slate-500 mr-2 uppercase font-bold">Total a registrar:</span>
                     <span className="text-lg font-bold text-slate-800">${totalAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{formData.currency}</span></span>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t"><button type="button" onClick={onCancel} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center shadow-lg shadow-blue-200 font-bold transition-all transform hover:-translate-y-0.5"><Lock size={16} className="mr-2" /> Dar de alta</button></div>
        </form>
      </div>
    </div>
  );
};

const ListView = ({ data, onPayComponent, onPayRemaining, role, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const filteredData = data.filter(item => item.bl.toLowerCase().includes(searchTerm.toLowerCase()) || item.client.toLowerCase().includes(searchTerm.toLowerCase()) || item.container.toLowerCase().includes(searchTerm.toLowerCase()));
  const canPay = role === 'admin' || role === 'pagos';
  const canSeeEdit = role === 'admin' || role === 'ejecutivo';

  const toggleRow = (id) => {
    if (expandedRow === id) { setExpandedRow(null); } else { setExpandedRow(id); }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><h2 className="text-xl font-bold text-slate-800">Sábana operativa</h2><div className="relative w-72"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-4 w-10"></th>
                    <th className="p-4">Concepto</th>
                    <th className="p-4">BL / Contenedor</th>
                    <th className="p-4">ETA / Días libres</th>
                    <th className="p-4 text-center">Estatus</th>
                    <th className="p-4 text-right">Monto total</th>
                    <th className="p-4 text-center">Pagado el</th>
                    <th className="p-4 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody className="text-sm">
              {filteredData.map((item) => (
                <React.Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${expandedRow === item.id ? 'bg-blue-50/50' : ''}`}>
                        <td className="p-4 text-center cursor-pointer" onClick={() => toggleRow(item.id)}>
                            {expandedRow === item.id ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                        </td>
                        <td className="p-4"><div className="font-bold text-slate-700">{item.client}</div><div className="inline-block mt-1 px-2 py-0.5 bg-slate-100 border rounded text-xs font-mono text-slate-600">{item.concept}</div></td>
                        <td className="p-4"><div className="font-mono font-medium">{item.bl}</div><div className="text-xs text-slate-500">{item.container}</div></td>
                        <td className="p-4"><div className="text-slate-600">{formatDate(item.eta)}</div><div className="text-[10px] text-slate-400">{item.freeDays} días libres</div></td>
                        <td className="p-4 text-center"><PaymentStatusBadge item={item} /></td>
                        <td className="p-4 text-right font-medium"><span className="text-[10px] text-slate-400 mr-1 font-bold align-top">{item.currency || 'MXN'}</span>${item.amount.toLocaleString()}</td>
                        <td className="p-4 text-center text-xs text-slate-500">{checkPaymentStatus(item) === 'paid' ? formatDate(item.paymentDate) : '-'}</td>
                        <td className="p-4 flex justify-center space-x-2">
                            {canSeeEdit && (<button onClick={() => onEdit(item)} className={`p-1.5 rounded transition-colors ${role === 'ejecutivo' && item.editCount >= 2 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title={role === 'ejecutivo' && item.editCount >= 2 ? "Edición bloqueada por el sistema" : "Editar contenedor"}>{role === 'ejecutivo' && item.editCount >= 2 ? <ShieldAlert size={16} /> : <Edit size={16} />}</button>)}
                        </td>
                    </tr>
                    
                    {expandedRow === item.id && (
                        <tr className="bg-slate-50 animate-fade-in">
                            <td colSpan="8" className="p-4 border-b border-slate-200 shadow-inner">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 px-8">
                                    {[
                                        { k: 'costDemoras', l: 'Demoras', v: item.costDemoras }, { k: 'costAlmacenaje', l: 'Almacenaje', v: item.costAlmacenaje },
                                        { k: 'costOperativos', l: 'Costos operativos', v: item.costOperativos }, { k: 'costPortuarios', l: 'Gastos portuarios', v: item.costPortuarios },
                                        { k: 'costApoyo', l: 'Apoyo', v: item.costApoyo }, { k: 'costImpuestos', l: 'Impuestos', v: item.costImpuestos },
                                        { k: 'costLiberacion', l: 'Liberación abandono', v: item.costLiberacion }, { k: 'costTransporte', l: 'Transporte', v: item.costTransporte }
                                    ].map((cost, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-slate-200 pb-1 h-8">
                                            <span className="text-xs text-slate-500 font-medium">{cost.l}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-700 font-mono">${(cost.v || 0).toLocaleString()}</span>
                                                
                                                {/* Lógica del Botón de Pago Individual */}
                                                {canPay && cost.v > 0 && (
                                                    item.paidFlags?.[cost.k] ? (
                                                        <span className="text-green-600" title="Pagado"><CheckCircle size={14}/></span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => onPayComponent(item, cost.k, cost.l)}
                                                            className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold border border-indigo-200 hover:bg-indigo-100"
                                                        >
                                                            Pagar
                                                        </button>
                                                    )
                                                )}
                                                {!canPay && cost.v > 0 && item.paidFlags?.[cost.k] && <span className="text-green-600"><CheckCircle size={14}/></span>}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="col-span-2 md:col-start-4 pt-2 flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800 uppercase">Total calculado:</span>
                                            <span className="text-lg font-bold text-blue-600 font-mono">${item.amount.toLocaleString()} <span className="text-xs text-slate-400">{item.currency}</span></span>
                                        </div>
                                        {canPay && checkPaymentStatus(item) === 'pending' && (
                                            <button 
                                                onClick={() => onPayRemaining(item)}
                                                className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg shadow hover:bg-green-700 flex items-center"
                                            >
                                                <DollarSign size={14} className="mr-1" /> Liquidar restante
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('admin');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const handleLogin = (userRole) => { setRole(userRole); setIsLoggedIn(true); };
  const handleLogout = () => { setIsLoggedIn(false); setActiveTab('dashboard'); };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(initialData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [paymentConfirmation, setPaymentConfirmation] = useState({ isOpen: false, item: null, pendingItems: [], isBulk: false });
  const [editingItem, setEditingItem] = useState(null);

  const handleSave = (newItem) => {
    const itemWithId = { ...newItem, id: Date.now() };
    setData([itemWithId, ...data]);
    setActiveTab('list');
  };

  const handleSaveEdit = (editedItem) => {
    const newData = data.map(item => {
      if (item.id === editedItem.id) {
        return { ...editedItem, editCount: (item.editCount || 0) + 1 };
      }
      return item;
    });
    setData(newData);
    setEditingItem(null); 
  };

  // --- LÓGICA DE PAGOS ---
  
  // 1. Pagar un solo componente
  const initiateSinglePayment = (item, key, label) => {
    setPaymentConfirmation({ 
        isOpen: true, 
        item, 
        pendingItems: [{ label: label, amount: item[key] || 0, key: key, currency: item.currency }],
        isBulk: false
    });
  };

  // 2. Pagar todo lo restante
  const initiateBulkPayment = (item) => {
    const keys = [
        { k: 'costDemoras', l: 'Demoras' }, { k: 'costAlmacenaje', l: 'Almacenaje' },
        { k: 'costOperativos', l: 'Costos operativos' }, { k: 'costPortuarios', l: 'Gastos portuarios' },
        { k: 'costApoyo', l: 'Apoyo' }, { k: 'costImpuestos', l: 'Impuestos' },
        { k: 'costLiberacion', l: 'Liberación abandono' }, { k: 'costTransporte', l: 'Transporte' }
    ];
    
    // Filtramos solo los que tienen monto > 0 y NO están pagados
    const pending = keys
        .filter(c => (item[c.k] > 0) && !item.paidFlags?.[c.k])
        .map(c => ({ label: c.l, amount: item[c.k], key: c.k, currency: item.currency }));

    if (pending.length === 0) return;

    setPaymentConfirmation({
        isOpen: true,
        item,
        pendingItems: pending,
        isBulk: true
    });
  };

  // 3. Ejecutar el pago (Confirmación)
  const executePayment = () => {
    const { item, pendingItems } = paymentConfirmation;
    if (!item) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const updatedData = data.map(d => {
      if (d.id === item.id) {
        // Actualizamos los flags de pago
        const newFlags = { ...(d.paidFlags || {}) };
        pendingItems.forEach(p => {
            newFlags[p.key] = true;
        });

        return { 
          ...d, 
          paidFlags: newFlags,
          paymentDate: todayStr // Actualizamos fecha de último pago
        };
      }
      return d;
    });

    setData(updatedData);
    setPaymentConfirmation({ isOpen: false, item: null, pendingItems: [], isBulk: false }); 
  };

  const handleEditClick = (item) => {
    if (role === 'ejecutivo') {
       if (item.editCount >= 2) {
         alert("⚠️ ACCESO DENEGADO\n\nEste contenedor ya ha sido modificado 2 veces. Por política de seguridad, solo un administrador puede realizar cambios adicionales.");
         return;
       }
    }
    setEditingItem(item);
  };

  const NavItem = ({ id, icon: Icon, label }) => {
    if (role === 'pagos' && id === 'capture') return null;
    return (
      <button onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-300 ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isSidebarCollapsed ? 'justify-center' : ''}`} title={isSidebarCollapsed ? label : ''}>
        <Icon size={20} className={`${isSidebarCollapsed ? '' : 'mr-3'}`} />
        {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
      </button>
    );
  };

  if (!isLoggedIn) { return <LoginView onLogin={handleLogin} />; }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 relative">
      <DetailedPaymentModal 
        isOpen={paymentConfirmation.isOpen} 
        onClose={() => setPaymentConfirmation({ isOpen: false, item: null, pendingItems: [] })} 
        onConfirm={executePayment} 
        pendingItems={paymentConfirmation.pendingItems}
        isBulk={paymentConfirmation.isBulk}
      />
      <EditModal isOpen={!!editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveEdit} item={editingItem} role={role} />

      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out relative`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-9 bg-blue-600 text-white p-1 rounded-full shadow-lg border-2 border-slate-100 hover:bg-blue-700 transition-colors z-20">{isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}><div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"><Ship size={20} className="text-white" /></div>{!isSidebarCollapsed && (<div className="overflow-hidden"><span className="text-lg font-bold tracking-tight whitespace-nowrap">AduanaSoft</span><p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">v2.2 Production</p></div>)}</div>
        <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          {!isSidebarCollapsed && <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3 animate-fade-in">Menú</p>}
          <NavItem id="dashboard" icon={LayoutDashboard} label="Visión general" /><NavItem id="list" icon={TableIcon} label="Sábana operativa" /><NavItem id="capture" icon={Plus} label="Alta de contenedores" />
          {(role === 'admin' || role === 'ejecutivo') && (<div className={`mt-6 ${isSidebarCollapsed ? 'border-t border-slate-800 pt-6' : ''}`}>{!isSidebarCollapsed && <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3 animate-fade-in">Comercial</p>}<NavItem id="quotes" icon={Calculator} label="Generador de cotizaciones" /></div>)}
        </nav>
        <div className="p-4 border-t border-slate-800"><div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-4`}><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0"><User size={20} /></div>{!isSidebarCollapsed && (<div className="overflow-hidden"><p className="text-sm font-medium whitespace-nowrap">Usuario activo</p><RoleBadge role={role} /></div>)}</div><button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-center px-4'} py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors text-xs font-bold`} title={isSidebarCollapsed ? "Cerrar sesión" : ""}><LogOut size={14} className={`${isSidebarCollapsed ? '' : 'mr-2'}`} /> {!isSidebarCollapsed && "Cerrar sesión"}</button></div>
      </aside>

      {isMobileMenuOpen && (<div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col animate-fade-in"><div className="p-6 border-b border-slate-800 flex justify-between items-start"><div><div className="flex items-center space-x-2"><div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center"><Ship size={20} className="text-white" /></div><span className="text-lg font-bold tracking-tight">AduanaSoft</span></div></div><button onClick={() => setIsMobileMenuOpen(false)} className="p-1"><X size={28} /></button></div><nav className="flex-1 p-6"><NavItem id="dashboard" icon={LayoutDashboard} label="Visión general" /><NavItem id="list" icon={TableIcon} label="Sábana operativa" /><NavItem id="capture" icon={Plus} label="Alta de contenedores" />{(role === 'admin' || role === 'ejecutivo') && (<NavItem id="quotes" icon={Calculator} label="Generador de cotizaciones" />)}<div className="mt-8 pt-6 border-t border-slate-700"><div className="flex items-center space-x-3 mb-6"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold"><User size={16} /></div><div className="text-sm">Rol actual: <RoleBadge role={role} /></div></div><button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg font-bold"><LogOut size={18} className="mr-2" /> Cerrar sesión</button></div></nav></div>)}

      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10"><button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded hover:bg-slate-100"><Menu className="text-slate-800" /></button><div className="text-xl font-bold text-slate-800 flex items-center gap-2">{activeTab === 'dashboard' && 'Visión general'}{activeTab === 'list' && 'Gestión y pagos'}{activeTab === 'capture' && 'Alta de documentos'}{activeTab === 'quotes' && 'Generador de cotizaciones'}<span className="hidden md:inline-flex ml-4 transform scale-90 origin-left"><RoleBadge role={role} /></span></div><div className="flex items-center space-x-4"><div className="hidden lg:flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium"><DollarSign size={14} className="mr-1"/> USD: $20.54</div></div></header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <DashboardView data={data} />}
          {activeTab === 'capture' && <CaptureForm onSave={handleSave} onCancel={() => setActiveTab('dashboard')} existingData={data} role={role} />}
          {activeTab === 'list' && <ListView data={data} onPayComponent={initiateSinglePayment} onPayRemaining={initiateBulkPayment} role={role} onEdit={handleEditClick} />}
          {activeTab === 'quotes' && <QuoteGenerator role={role} />}
        </div>
      </main>
    </div>
  );
}