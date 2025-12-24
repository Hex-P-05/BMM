import React, { useState, useMemo, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { 
  LayoutDashboard, FileText, Table as TableIcon, AlertTriangle, CheckCircle, 
  Clock, Ship, DollarSign, Plus, Search, Menu, X, User, Edit, Lock, 
  TrendingUp, TrendingDown, Activity, AlertCircle, Calculator, Trash2, 
  Download, Printer, Package, MapPin, Key, LogOut, Check, 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ShieldAlert, Eye, EyeOff,
  Anchor, ClipboardCheck, Phone, Globe, Calendar, Landmark
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

// --- UTILIDAD DE GENERACIÓN DE PDF (MOTOR GRÁFICO ORIGINAL) ---
const generatePDF = (itemsToPrint, filename = 'Comprobantes.pdf') => {
  const doc = new jsPDF();
  
  itemsToPrint.forEach((item, index) => {
    if (index > 0) doc.addPage(); 

    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("AduanaSoft", 15, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Comprobante de Cierre Operativo", 15, 30);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 150, 30, { align: 'right' });

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 50, 180, 35, 3, 3, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.text("EMPRESA:", 25, 65);
    doc.text("BL MASTER:", 110, 65);
    doc.text("CONTENEDOR:", 110, 75);
    
    doc.setFont("helvetica", "normal");
    doc.text(item.empresa || item.client || '', 50, 65); // Ajuste para nuevo campo
    doc.text(item.bl, 145, 65);
    doc.text(item.container || item.contenedor, 145, 75);

    let yPos = 100;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Desglose de Costos", 15, 95);
    
    doc.setDrawColor(203, 213, 225);
    doc.line(15, 98, 195, 98);

    const costs = [
        { l: 'Demoras', v: item.costDemoras }, { l: 'Almacenaje', v: item.costAlmacenaje },
        { l: 'Costos Operativos', v: item.costOperativos }, { l: 'Gastos Portuarios', v: item.costPortuarios },
        { l: 'Apoyo Extraordinario', v: item.costApoyo }, { l: 'Impuestos', v: item.costImpuestos },
        { l: 'Liberación Abandono', v: item.costLiberacion }, { l: 'Transporte', v: item.costTransporte }
    ];

    doc.setFontSize(10);
    costs.forEach(c => {
        if (c.v > 0) {
            yPos += 10;
            doc.setFont("helvetica", "normal");
            doc.text(c.l, 25, yPos);
            doc.setFont("helvetica", "bold");
            doc.text(`$${c.v.toLocaleString()}`, 185, yPos, { align: 'right' });
            doc.setDrawColor(241, 245, 249);
            doc.line(25, yPos + 3, 185, yPos + 3);
        }
    });

    yPos += 20;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(120, yPos - 10, 75, 15, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("TOTAL PAGADO", 125, yPos);
    doc.text(`$${item.amount.toLocaleString()} ${item.currency}`, 190, yPos, { align: 'right' });
  });

  doc.save(filename);
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

// --- NUEVAS BASES DE DATOS ---
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

// --- DATOS INICIALES (Adaptados a nueva estructura) ---
const rawData = [
  { 
    id: 1, bl: 'HLCU12345678', eta: addDays(45), freeDays: 7, editCount: 0, payment: 'paid', paymentDate: '2025-06-10', paymentDelay: 0, currency: 'MXN',
    // NUEVOS CAMPOS
    ejecutivo: 'JOAN', empresa: 'IMPORTADORA MÉXICO S.A.', fechaAlta: '2025-05-20', concepto: 'ALMACENAJES', prefijo: 'IMP', consecutivo: 1, contenedor: 'MSKU987654',
    comentarios: 'ALMACENAJES IMP 1 MSKU987654', pedimento: '2300-112233', factura: 'A-101',
    proveedor: 'HAPAG-LLOYD', banco: 'BBVA', cuenta: '0123456789', clabe: '012001012345678901',
    // COSTOS
    costDemoras: 0, costAlmacenaje: 5000, costOperativos: 5000, costPortuarios: 2000, costApoyo: 0, costImpuestos: 1000, costLiberacion: 0, costTransporte: 7000,
    amount: 20000, status: 'active', paidFlags: {} 
  },
  { 
    id: 2, bl: 'MAEU87654321', eta: addDays(-5), freeDays: 14, editCount: 1, payment: 'paid', paymentDate: '2025-06-12', paymentDelay: 5, currency: 'USD',
    ejecutivo: 'MARIA', empresa: 'LOGÍSTICA GLOBAL', fechaAlta: '2025-05-22', concepto: 'PAMA', prefijo: 'LOG', consecutivo: 1, contenedor: 'TCLU123000',
    comentarios: 'PAMA LOG 1 TCLU123000', pedimento: '2300-998877', factura: '',
    proveedor: 'MAERSK MEXICO', banco: 'CITIBANAMEX', cuenta: '9876543210', clabe: '002001987654321099',
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

// --- COMPONENTES UI AUXILIARES (Badge, KPI, etc) ---
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

const RoleBadge = ({ role, collapsed }) => {
  const styles = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    ejecutivo: 'bg-blue-100 text-blue-800 border-blue-200',
    pagos: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };
  if (collapsed) return <div className={`w-3 h-3 rounded-full ${styles[role] || styles.ejecutivo} border`}></div>;
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
      {trendValue && <span className={`font-bold mr-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{trendValue}</span>}
      <span className="text-slate-400">{subtext}</span>
    </div>
  </div>
);

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

  const costInputs = [
    { key: 'costDemoras', label: 'Demoras' }, { key: 'costAlmacenaje', label: 'Almacenaje' },
    { key: 'costOperativos', label: 'Costos operativos' }, { key: 'costPortuarios', label: 'Gastos portuarios' },
    { key: 'costApoyo', label: 'Apoyo' }, { key: 'costImpuestos', label: 'Impuestos' },
    { key: 'costLiberacion', label: 'Liberación abandono' }, { key: 'costTransporte', label: 'Transporte' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto m-4">
        <div className="bg-blue-50 p-6 border-b border-blue-100 flex justify-between items-center sticky top-0 z-20">
          <div>
             <h3 className="text-lg font-bold text-slate-800 flex items-center"><Edit size={20} className="mr-2 text-blue-600"/> Editar contenedor</h3>
             <p className="text-xs text-slate-500 hidden sm:block">{isRestricted ? `Modo restringido (${item.editCount + 1}/2)` : 'Modo administrador'}</p>
          </div>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1">
             <label className="text-xs font-bold text-slate-500 mb-1 block">BL (master)</label>
             <input disabled name="bl" value={editData.bl} onChange={handleChange} className="w-full p-2 border rounded bg-slate-100 text-slate-500 cursor-not-allowed" />
          </div>
          <div className="col-span-1">
             <label className="text-xs font-bold text-slate-500 mb-1 block">Contenedor</label>
             <input disabled name="container" value={editData.container || editData.contenedor} onChange={handleChange} className="w-full p-2 border rounded bg-slate-100 text-slate-500 cursor-not-allowed" />
          </div>
          
          <div className="col-span-1">
             <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">Fecha ETA {isRestricted && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}</label>
             <input type="date" name="eta" value={editData.eta} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="col-span-1">
             <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">Días libres {isRestricted && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}</label>
             <input type="number" name="freeDays" value={editData.freeDays} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="col-span-1 sm:col-span-2 border-t pt-4 mt-2">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 sm:mb-0">Desglose de costos</label>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">Total: ${editData.amount.toLocaleString()}</span>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {costInputs.map(field => (
                    <div key={field.key}>
                        <label className="text-[10px] font-medium text-slate-500 mb-1 block truncate" title={field.label}>{field.label}</label>
                        <div className="relative">
                            <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                            <input disabled={isRestricted} type="number" name={field.key} value={editData[field.key]} onChange={handleChange} className={`w-full pl-4 p-2 border rounded text-xs text-right outline-none ${isRestricted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`} />
                        </div>
                    </div>
                ))}
             </div>
             {isRestricted && <p className="text-[10px] text-red-400 mt-3 italic">* Costos editables solo por Administrador.</p>}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 sticky bottom-0 z-20">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded text-sm font-bold">Cancelar</button>
           <button onClick={() => onSave(editData)} className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-sm font-bold">Guardar cambios</button>
        </div>
      </div>
    </div>
  );
};

const CloseModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  const handleCloseAndDownload = () => {
    generatePDF([item], `Comprobante_${item.bl}.pdf`); 
    onClose();
  };

  const costList = [
    { l: 'Demoras', v: item.costDemoras }, { l: 'Almacenaje', v: item.costAlmacenaje },
    { l: 'Costos operativos', v: item.costOperativos }, { l: 'Gastos portuarios', v: item.costPortuarios },
    { l: 'Apoyo', v: item.costApoyo }, { l: 'Impuestos', v: item.costImpuestos },
    { l: 'Liberación', v: item.costLiberacion }, { l: 'Transporte', v: item.costTransporte }
  ].filter(c => c.v > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div><h3 className="text-xl font-bold flex items-center"><CheckCircle className="mr-2"/> Cerrar operación</h3><p className="text-emerald-100 text-sm">Se generará el registro final del contenedor.</p></div>
          <button onClick={onClose}><X className="text-white hover:bg-emerald-700 rounded p-1" /></button>
        </div>
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">Resumen financiero</h4>
            {costList.map((c, i) => (
              <div key={i} className="flex justify-between border-b border-slate-50 pb-2 mb-2 text-sm"><span className="text-slate-600">{c.l}</span><span className="font-bold text-slate-800">${c.v.toLocaleString()}</span></div>
            ))}
            <div className="mt-4 p-3 bg-slate-100 rounded flex justify-between items-center font-bold text-slate-800 border border-slate-200"><span>TOTAL FINAL</span><span>${item.amount.toLocaleString()} {item.currency}</span></div>
          </div>
        </div>
        <div className="p-4 border-t bg-white flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors">Confirmar y cerrar</button>
          <button onClick={handleCloseAndDownload} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg flex justify-center items-center gap-2"><Download size={18} /> Descargar PDF</button>
        </div>
      </div>
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, onConfirm, item }) => {
  if (!isOpen || !item) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden m-4">
        <div className="bg-yellow-50 p-6 border-b border-yellow-100 flex items-start space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full flex-shrink-0"><AlertCircle size={32} /></div>
          <div><h3 className="text-lg font-bold text-slate-800">¿Confirmar pago?</h3><p className="text-sm text-slate-600 mt-1">Registrar pago en el sistema.</p></div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Monto a pagar</span><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.currency || 'MXN'}</span></div>
            <p className="text-3xl font-bold text-slate-800">${item.amount.toLocaleString()}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Beneficiario:</span><span className="font-medium text-slate-800">{item.provider || item.proveedor}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Cliente/Empresa:</span><span className="font-medium text-slate-800">{item.empresa || item.client}</span></div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex space-x-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex justify-center items-center"><CheckCircle size={20} className="mr-2" /> Confirmar</button>
        </div>
      </div>
    </div>
  );
};

// --- LOGIN (ACTUALIZADO: DETECTA NOMBRE) ---
const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    // SIMULACIÓN DE NOMBRES PARA CAMPO EJECUTIVO
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
          <div className="flex items-center space-x-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Ship size={24} className="text-white" /></div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">AduanaSoft</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Bienvenido de nuevo</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" autoFocus />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <div className="relative">
                    <Key className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
            </div>
            {error && (<div className="bg-red-50 text-red-600 text-xs p-3 rounded flex items-center"><AlertCircle size={14} className="mr-2" />{error}</div>)}
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Iniciar sesión</button>
          </form>
          <div className="mt-8 text-center text-xs text-slate-400">
             <p>Pruebas: joan@aduanasoft.com / ops</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuoteGenerator = ({ role }) => {
  const [quoteData, setQuoteData] = useState({
    // Datos Generales
    clientName: '',
    currency: 'MXN',
    
    // Datos Operativos
    bl: '',
    container: '',
    eta: '',
    deliveryDate: '',
    port: 'MANZANILLO',
    terminal: 'CONTECON',
    demurrageDays: 0,
    storageDays: 0,
    naviera: '',
    
    // Costos
    costDemoras: 0,
    costAlmacenaje: 0,
    costOperativos: 0,
    costPortuarios: 0,
    costApoyo: 0,
    costImpuestos: 0,
    costLiberacion: 0,
    costTransporte: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Detectar si es un campo numérico
    const isNumber = name.startsWith('cost') || name.endsWith('Days');
    setQuoteData({ 
        ...quoteData, 
        [name]: isNumber ? (parseFloat(value) || 0) : value 
    });
  };

  // Suma total
  const subtotal = 
    quoteData.costDemoras + quoteData.costAlmacenaje + quoteData.costOperativos + 
    quoteData.costPortuarios + quoteData.costApoyo + quoteData.costImpuestos + 
    quoteData.costLiberacion + quoteData.costTransporte;

  // --- GENERAR PDF MEMBRETADO ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const m = 20; // Margen X
    let y = 0;    // Posición Y

    // Colores
    const corporateBlue = [15, 23, 42]; 
    const rowGreen = [220, 252, 231];
    const rowYellow = [254, 249, 195];
    const textRed = [185, 28, 28];
    const border = [80, 80, 80];

    // --- 1. MEMBRETE SUPERIOR ---
    doc.setFillColor(...corporateBlue);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Logo
    doc.setFillColor(255, 255, 255);
    doc.circle(25, 17, 8, 'F');
    doc.setTextColor(...corporateBlue);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("A", 22.5, 22);

    // Nombre Empresa
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("ADUANASOFT", 38, 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("SOLUCIONES LOGÍSTICAS INTEGRALES", 38, 26);

    // Datos Contacto
    doc.setFontSize(9);
    doc.text("Av. del Puerto 123, Manzanillo, Col.", 200, 12, { align: 'right' });
    doc.text("Tel: +52 (314) 333-0000", 200, 17, { align: 'right' });
    doc.text("contacto@aduanasoft.com", 200, 22, { align: 'right' });

    // --- 2. TÍTULO Y CLIENTE ---
    y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COTIZACIÓN DE SERVICIOS", 105, y, { align: 'center' });
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`ATENCIÓN A: ${quoteData.clientName || "CLIENTE GENERAL"}`, m, y);
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 190, y, { align: 'right' });

    y += 10;

    // --- 3. TABLA DE DATOS ---
    const drawRow = (label, value, bgColor = null, textColor = [0,0,0], boldValue = false) => {
        const rowHeight = 7.5; 
        
        // Etiqueta (Izquierda)
        doc.setDrawColor(...border);
        doc.setFillColor(255, 255, 255);
        if (bgColor) doc.setFillColor(...bgColor);
        doc.rect(m, y, 90, rowHeight, 'FD'); 
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(label, m + 85, y + 5, { align: 'right' });

        // Valor (Derecha)
        doc.setFillColor(255, 255, 255);
        if (bgColor) doc.setFillColor(...bgColor);
        doc.rect(m + 90, y, 80, rowHeight, 'FD');

        doc.setFont("helvetica", boldValue ? "bold" : "normal");
        doc.setTextColor(...textColor);
        doc.text(value ? value.toString() : "-", m + 130, y + 5, { align: 'center' });

        y += rowHeight;
    };

    // Filas de Datos
    drawRow("BL / EMBARQUE", quoteData.bl);
    drawRow("CONTENEDOR", quoteData.container);
    drawRow("ETA", formatDate(quoteData.eta));
    drawRow("FECHA DE ENTREGA", formatDate(quoteData.deliveryDate), rowGreen);
    drawRow("PUERTO", quoteData.port);
    drawRow("TERMINAL", quoteData.terminal);
    drawRow("DIAS DE DEMORAS", quoteData.demurrageDays);
    drawRow("DIAS DE ALMACENAJE", quoteData.storageDays);
    drawRow("NAVIERA", quoteData.naviera);

    // Separador
    y += 2; 

    // Filas de Costos
    const formatMoney = (val) => `$ ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    
    drawRow("DEMORAS", quoteData.costDemoras > 0 ? formatMoney(quoteData.costDemoras) : "-");
    drawRow("ALMACENAJE", formatMoney(quoteData.costAlmacenaje));
    drawRow("COSTOS OPERATIVOS", formatMoney(quoteData.costOperativos));
    drawRow("GASTOS PORTUARIOS", formatMoney(quoteData.costPortuarios));
    drawRow("APOYO EXTRAORDINARIO", formatMoney(quoteData.costApoyo), null, textRed, true);
    drawRow("IMPUESTOS", formatMoney(quoteData.costImpuestos));
    drawRow("LIBERACION", quoteData.costLiberacion > 0 ? formatMoney(quoteData.costLiberacion) : "-");
    drawRow("TRANSPORTE", formatMoney(quoteData.costTransporte));
    
    // Total
    y += 2;
    drawRow(`TOTAL ESTIMADO (${quoteData.currency})`, formatMoney(subtotal), rowYellow, [0,0,0], true);

    // --- 4. FOOTER ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...corporateBlue);
    doc.rect(0, pageHeight - 20, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("www.aduanasoft.com | Documento Oficial", 105, pageHeight - 9, { align: 'center' });

    doc.save(`Cotizacion_${quoteData.container || 'Cliente'}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12 animate-fade-in h-[calc(100vh-100px)] overflow-hidden">
      
      {/* --- EDITOR --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto h-full flex flex-col">
        <div className="p-6 flex-1">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Calculator className="mr-2 text-blue-600"/> Cotizador Membretado
            </h2>

            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">Datos Generales</h3>
                
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-600">Nombre del Cliente</label>
                        <input name="clientName" value={quoteData.clientName} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white" placeholder="Ej. Comercializadora del Norte S.A." />
                    </div>
                    <div className="w-32">
                        <label className="text-xs font-bold text-slate-600">Divisa</label>
                        <select name="currency" value={quoteData.currency} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white font-bold text-blue-600">
                            <option value="MXN">MXN</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
                
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center mt-4"><Ship size={14} className="mr-1"/> Datos Operativos</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className="text-xs font-bold text-slate-600">BL</label><input name="bl" value={quoteData.bl} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white uppercase font-mono" /></div>
                    <div className="col-span-2"><label className="text-xs font-bold text-slate-600">Contenedor</label><input name="container" value={quoteData.container} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white uppercase font-mono" /></div>
                    <div><label className="text-xs font-bold text-slate-600">ETA</label><input type="date" name="eta" value={quoteData.eta} onChange={handleChange} className="w-full p-2 border rounded text-sm" /></div>
                    <div><label className="text-xs font-bold text-green-700">F. Entrega</label><input type="date" name="deliveryDate" value={quoteData.deliveryDate} onChange={handleChange} className="w-full p-2 border border-green-300 bg-green-50 rounded text-sm" /></div>
                    <div><label className="text-xs font-bold text-slate-600">Puerto</label><input name="port" value={quoteData.port} onChange={handleChange} className="w-full p-2 border rounded text-sm" /></div>
                    <div><label className="text-xs font-bold text-slate-600">Terminal</label><input name="terminal" value={quoteData.terminal} onChange={handleChange} className="w-full p-2 border rounded text-sm" /></div>
                    <div><label className="text-xs font-bold text-slate-600">Días Demoras</label><input type="number" name="demurrageDays" value={quoteData.demurrageDays} onChange={handleChange} className="w-full p-2 border rounded text-sm" /></div>
                    <div><label className="text-xs font-bold text-slate-600">Días Almacenaje</label><input type="number" name="storageDays" value={quoteData.storageDays} onChange={handleChange} className="w-full p-2 border rounded text-sm" /></div>
                    <div className="col-span-2"><label className="text-xs font-bold text-slate-600">Naviera</label><input name="naviera" value={quoteData.naviera} onChange={handleChange} className="w-full p-2 border rounded text-sm" /></div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center"><DollarSign size={14} className="mr-1"/> Costos ({quoteData.currency})</h3>
                <div className="space-y-3">
                    {[
                        { l: 'Demoras', k: 'costDemoras' },
                        { l: 'Almacenaje', k: 'costAlmacenaje' },
                        { l: 'Costos Operativos', k: 'costOperativos' },
                        { l: 'Gastos Portuarios', k: 'costPortuarios' },
                        { l: 'Apoyo', k: 'costApoyo', color: 'text-red-600' },
                        { l: 'Impuestos', k: 'costImpuestos' },
                        { l: 'Liberación', k: 'costLiberacion' },
                        { l: 'Transporte', k: 'costTransporte' },
                    ].map((field) => (
                        <div key={field.k} className="flex items-center justify-between">
                            <label className={`text-xs font-bold ${field.color || 'text-slate-600'} uppercase w-1/2`}>{field.l}</label>
                            <div className="w-1/2 relative"><span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span><input type="number" name={field.k} value={quoteData[field.k] || ''} onChange={handleChange} className="w-full p-1.5 pl-6 border rounded text-sm text-right outline-none focus:border-blue-500" placeholder="0.00"/></div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200 bg-yellow-50 p-2 -mx-2 rounded">
                        <label className="text-sm font-bold text-slate-800 uppercase">Total ({quoteData.currency})</label>
                        <span className="text-lg font-mono font-bold text-slate-900">${subtotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50"><button onClick={handleDownloadPDF} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center transition-all"><Download size={20} className="mr-2"/> Descargar PDF Membretado</button></div>
      </div>

      {/* --- PREVISUALIZACIÓN --- */}
      <div className="hidden lg:flex bg-slate-200 p-8 rounded-xl overflow-y-auto h-full shadow-inner justify-center items-start">
        <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] relative flex flex-col font-sans text-slate-800 text-sm scale-90 origin-top">
            
            {/* Header Visual */}
            <div className="bg-slate-900 h-24 flex items-center px-8 justify-between text-white">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold text-xl">A</div>
                    <div><h1 className="text-2xl font-bold tracking-widest">ADUANASOFT</h1><p className="text-[10px] tracking-wide opacity-80">SOLUCIONES LOGÍSTICAS</p></div>
                </div>
                <div className="text-right text-[10px] opacity-90 space-y-0.5">
                    <p className="flex items-center justify-end gap-1"><MapPin size={10}/> Av. del Puerto 123</p>
                    <p className="flex items-center justify-end gap-1"><Globe size={10}/> www.aduanasoft.com</p>
                </div>
            </div>

            <div className="p-12 flex-1">
                <h2 className="text-center text-xl font-bold text-slate-800 mb-2">COTIZACIÓN DE SERVICIOS</h2>
                <div className="text-center text-xs text-slate-500 mb-8">{new Date().toLocaleDateString()}</div>
                
                <div className="mb-6"><span className="text-xs font-bold text-slate-500 uppercase">Cliente:</span> <span className="text-lg font-bold block">{quoteData.clientName || "..."}</span></div>

                {/* Tabla Visual */}
                <div className="border border-slate-800 text-xs">
                    {[
                        { l: "BL / EMBARQUE", v: quoteData.bl },
                        { l: "CONTENEDOR", v: quoteData.container },
                        { l: "ETA", v: formatDate(quoteData.eta) },
                        { l: "FECHA ENTREGA", v: formatDate(quoteData.deliveryDate), bg: "bg-green-100" },
                        { l: "PUERTO", v: quoteData.port },
                        { l: "TERMINAL", v: quoteData.terminal },
                        { l: "DIAS DEMORAS", v: quoteData.demurrageDays },
                        { l: "DIAS ALMACENAJE", v: quoteData.storageDays },
                        { l: "NAVIERA", v: quoteData.naviera },
                    ].map((r, i) => (
                        <div key={i} className={`flex border-b border-slate-800 ${r.bg || ''}`}>
                            <div className="w-1/2 p-2 border-r border-slate-800 text-right font-bold bg-slate-50">{r.l}</div>
                            <div className="w-1/2 p-2 text-center">{r.v || '-'}</div>
                        </div>
                    ))}

                    <div className="h-4 bg-slate-200 border-b border-slate-800"></div>

                    {[
                        { l: "DEMORAS", v: quoteData.costDemoras },
                        { l: "ALMACENAJE", v: quoteData.costAlmacenaje },
                        { l: "COSTOS OPERATIVOS", v: quoteData.costOperativos },
                        { l: "GASTOS PORTUARIOS", v: quoteData.costPortuarios },
                        { l: "APOYO", v: quoteData.costApoyo, color: "text-red-600" },
                        { l: "IMPUESTOS", v: quoteData.costImpuestos },
                        { l: "LIBERACION", v: quoteData.costLiberacion },
                        { l: "TRANSPORTE", v: quoteData.costTransporte },
                    ].map((r, i) => (
                        <div key={i + 10} className="flex border-b border-slate-800">
                            <div className="w-1/2 p-2 border-r border-slate-800 text-right font-bold bg-slate-50">{r.l}</div>
                            <div className={`w-1/2 p-2 text-center font-mono ${r.color || ''}`}>{r.v > 0 ? `$${r.v.toLocaleString()}` : '-'}</div>
                        </div>
                    ))}

                    <div className="flex bg-yellow-100 font-bold text-sm">
                        <div className="w-1/2 p-3 border-r border-slate-800 text-right">TOTAL ESTIMADO ({quoteData.currency})</div>
                        <div className="w-1/2 p-3 text-center">${subtotal.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 text-white text-[10px] text-center p-4">www.aduanasoft.com</div>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD (TU CÓDIGO ORIGINAL) ---
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

// --- CAPTURE FORM (REESCRITO CON TU NUEVA LÓGICA) ---
const CaptureForm = ({ onSave, onCancel, existingData, role, userName }) => {
  if (role === 'pagos') return <div className="p-10 text-center text-red-500 font-bold">Acceso denegado: Rol no autorizado para capturas.</div>;

  const [formData, setFormData] = useState({
    // CAMPOS NUEVOS
    empresa: '',
    fechaAlta: new Date().toISOString().split('T')[0],
    concepto: '',
    prefijo: '',
    consecutivo: 0, 
    contenedor: '',
    pedimento: '',
    factura: '',
    proveedor: '', // Selector
    banco: '',     // Auto
    cuenta: '',    // Auto
    clabe: '',     // Auto

    // CAMPOS PRESERVADOS
    bl: '', eta: '', freeDays: 7, currency: 'MXN',
    costDemoras: 0, costAlmacenaje: 0, costOperativos: 0, costPortuarios: 0,
    costApoyo: 0, costImpuestos: 0, costLiberacion: 0, costTransporte: 0
  });
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [generatedComments, setGeneratedComments] = useState('');

  // Auto-cálculo de total
  useEffect(() => {
    const sum = 
      (parseFloat(formData.costDemoras) || 0) + (parseFloat(formData.costAlmacenaje) || 0) +
      (parseFloat(formData.costOperativos) || 0) + (parseFloat(formData.costPortuarios) || 0) +
      (parseFloat(formData.costApoyo) || 0) + (parseFloat(formData.costImpuestos) || 0) +
      (parseFloat(formData.costLiberacion) || 0) + (parseFloat(formData.costTransporte) || 0);
    setTotalAmount(sum);
  }, [formData]);

  // Lógica de Comentarios y Consecutivo
  useEffect(() => {
    let nextNum = 0;
    if (formData.prefijo && formData.prefijo.length === 3) {
        const count = existingData.filter(d => d.prefijo === formData.prefijo.toUpperCase()).length;
        nextNum = count + 1;
    }
    const cleanContenedor = formData.contenedor ? formData.contenedor.toUpperCase() : '';
    const cleanConcepto = formData.concepto || '...';
    const cleanPrefijo = formData.prefijo ? formData.prefijo.toUpperCase() : '...';
    
    // CONCATENACIÓN SOLICITADA
    const comment = `${cleanConcepto} ${cleanPrefijo} ${nextNum || '#'} ${cleanContenedor}`;
    setGeneratedComments(comment);
  }, [formData.prefijo, formData.concepto, formData.contenedor, existingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Filtro Prefijo (Max 3 chars)
    if (name === 'prefijo') {
        if (value.length <= 3) setFormData({ ...formData, [name]: value.toUpperCase() });
        return;
    }

    // Filtro Proveedor (Auto-llenado Bancos)
    if (name === 'proveedor') {
        const prov = PROVEEDORES_DB.find(p => p.nombre === value);
        if (prov) {
            setFormData({ ...formData, proveedor: value, banco: prov.banco, cuenta: prov.cuenta, clabe: prov.clabe });
        } else {
            setFormData({ ...formData, proveedor: value, banco: '', cuenta: '', clabe: '' });
        }
        return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const count = existingData.filter(d => d.prefijo === formData.prefijo).length;
    const finalConsecutivo = count + 1;
    const finalComment = `${formData.concepto} ${formData.prefijo} ${finalConsecutivo} ${formData.contenedor.toUpperCase()}`;

    onSave({ 
      ...formData, 
      ejecutivo: userName, // NOMBRE DEL USUARIO
      consecutivo: finalConsecutivo,
      comentarios: finalComment,
      amount: totalAmount, 
      status: calculateStatus(formData.eta), 
      payment: 'pending', paymentDate: null, paymentDelay: 0, editCount: 0 
    });
  };

  const costFieldsInputs = [
    { name: 'costDemoras', label: 'Demoras' }, { name: 'costAlmacenaje', label: 'Almacenaje' },
    { name: 'costOperativos', label: 'Costos operativos' }, { name: 'costPortuarios', label: 'Gastos portuarios' },
    { name: 'costApoyo', label: 'Apoyo' }, { name: 'costImpuestos', label: 'Impuestos' },
    { name: 'costLiberacion', label: 'Liberación abandono' }, { name: 'costTransporte', label: 'Transporte' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div><h2 className="text-xl font-bold text-slate-800 flex items-center"><FileText className="mr-2 text-blue-600" /> Alta de nuevo contenedor</h2><p className="text-slate-500 text-sm">Ejecutivo: <b>{userName}</b></p></div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* SECCIÓN DATOS GENERALES */}
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
             <h3 className="text-xs font-bold text-blue-800 uppercase mb-4">Datos Identificación</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2"><label className="text-xs font-bold text-slate-600 mb-1 block">Empresa</label><select required name="empresa" value={formData.empresa} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none"><option value="">-- Seleccionar --</option>{EMPRESAS_DB.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}</select></div>
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Fecha Alta</label><input type="date" name="fechaAlta" value={formData.fechaAlta} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Prefijo (3 Letras)</label><input required name="prefijo" value={formData.prefijo} onChange={handleChange} placeholder="Ej. IMP" className="w-full p-2 border rounded text-sm uppercase font-bold text-center tracking-widest outline-none border-blue-300 focus:bg-blue-50" maxLength={3} /></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Concepto</label><select required name="concepto" value={formData.concepto} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none"><option value="">-- Seleccionar --</option>{CONCEPTOS_DB.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Contenedor</label><input required name="contenedor" value={formData.contenedor} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">BL Master</label><input required name="bl" value={formData.bl} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" /></div>
             </div>
             {/* VISUALIZADOR DE COMENTARIOS AUTOMÁTICOS */}
             <div className="mt-4 p-3 bg-slate-800 text-white rounded-lg flex items-center justify-between shadow-inner"><div><span className="text-[10px] text-slate-400 uppercase block mb-1">Comentarios (Generado)</span><span className="font-mono text-sm font-bold text-yellow-400 tracking-wide">{generatedComments}</span></div></div>
          </div>

          {/* SECCIÓN FINANCIERA */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
             <h3 className="text-xs font-bold text-slate-600 uppercase mb-4 flex items-center"><Landmark size={14} className="mr-1"/> Datos Financieros y Proveedor</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Proveedor</label><select required name="proveedor" value={formData.proveedor} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none"><option value="">-- Seleccionar --</option>{PROVEEDORES_DB.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}</select></div>
                <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-[10px] font-bold text-slate-500 mb-1 block">Banco</label><input readOnly value={formData.banco} className="w-full p-2 bg-slate-200 border rounded text-xs font-bold text-slate-700" /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 mb-1 block">Cuenta</label><input readOnly value={formData.cuenta} className="w-full p-2 bg-slate-200 border rounded text-xs text-slate-700" /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 mb-1 block">Clabe</label><input readOnly value={formData.clabe} className="w-full p-2 bg-slate-200 border rounded text-xs text-slate-700" /></div>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Pedimento</label><input name="pedimento" value={formData.pedimento} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Factura</label><input name="factura" value={formData.factura} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" /></div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-bold text-slate-600 mb-1 block">ETA</label><input required type="date" name="eta" value={formData.eta} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-600 mb-1 block">Días Libres</label><input required type="number" name="freeDays" value={formData.freeDays} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none" /></div>
                </div>
             </div>
          </div>

          <div className="col-span-1 md:col-span-2 border-t pt-4">
               <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700">Desglose de costos (Granularidad)</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="text-xs p-1 border rounded font-bold text-blue-600 bg-white"><option value="MXN">MXN</option><option value="USD">USD</option></select>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {costFieldsInputs.map(field => (
                      <div key={field.name}>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">{field.label}</label>
                          <div className="relative"><span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span><input type="number" name={field.name} className="w-full pl-5 p-1.5 border rounded text-sm text-right outline-none focus:border-blue-500" onChange={handleChange} placeholder="0" /></div>
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
          <div className="flex justify-end space-x-3 pt-4 border-t"><button type="button" onClick={onCancel} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center shadow-lg shadow-blue-200 font-bold transition-all transform hover:-translate-y-0.5"><Lock size={16} className="mr-2" /> Dar de alta</button></div>
        </form>
      </div>
    </div>
  );
};



const ListView = ({ data, onPayItem, onPayAll, onCloseOperation, role, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('full'); // 'full' o 'simple'
  
  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);
  
  // Filtros de búsqueda
  const filteredData = data.filter(item => 
    item.bl.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.comentarios && item.comentarios.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (item.contenedor && item.contenedor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isSimpleView = viewMode === 'simple';
  
  // PERMISOS (Aquí está la lógica clave que pediste)
  const canPay = role === 'admin' || role === 'pagos';
  const canEdit = role === 'admin' || role === 'ejecutivo'; // Pagos da FALSE aquí

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      {/* BARRA SUPERIOR: TÍTULO, TOGGLE Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">Sábana operativa</h2>
            {/* Solo Admin y Pagos ven el toggle de vistas */}
            {(role === 'admin' || role === 'pagos') && (
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                        onClick={() => setViewMode('full')} 
                        className={`px-3 py-1 rounded-md text-xs font-bold ${viewMode === 'full' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Completa
                    </button>
                    <button 
                        onClick={() => setViewMode('simple')} 
                        className={`px-3 py-1 rounded-md text-xs font-bold ${viewMode === 'simple' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        Pagos
                    </button>
                </div>
            )}
        </div>
        <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm" 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 relative">
        <div className="overflow-auto h-[calc(100vh-200px)] w-full relative"> 
          <table className="w-full text-left border-collapse min-w-[2000px]">
            <thead className="sticky top-0 z-40 shadow-sm">
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase h-12">
                    <th className="p-4 w-12 sticky left-0 z-50 bg-slate-50 border-r"></th>
                    
                    {/* COLUMNAS DINÁMICAS */}
                    {!isSimpleView && <th className="p-4 w-16 text-center sticky left-12 z-50 bg-slate-50 border-r">Ej</th>}
                    
                    <th className="p-4 min-w-[200px] sticky left-12 z-40 bg-slate-50 border-r">Empresa</th>
                    <th className="p-4 min-w-[250px] bg-slate-50">Comentarios</th>
                    
                    {!isSimpleView && <th className="p-4 min-w-[100px] bg-slate-50 text-center">Fecha</th>}
                    
                    <th className="p-4 min-w-[120px] bg-slate-50 font-bold text-slate-700">Contenedor</th>
                    <th className="p-4 min-w-[120px] bg-slate-50">Pedimento</th>
                    
                    {!isSimpleView && <th className="p-4 min-w-[100px] bg-slate-50">Factura</th>}
                    
                    <th className="p-4 min-w-[150px] bg-slate-50 text-blue-800">Proveedor</th>
                    <th className="p-4 min-w-[100px] bg-slate-50 text-slate-400">Banco</th>
                    <th className="p-4 min-w-[120px] bg-slate-50 text-slate-400">Cuenta</th>
                    <th className="p-4 min-w-[150px] bg-slate-50 text-slate-400">CLABE</th>
                    <th className="p-4 min-w-[120px] bg-slate-50 text-center">ETA</th>
                    <th className="p-4 min-w-[150px] text-right bg-slate-50">Total</th>
                    
                    {/* COLUMNA ACCIONES: Solo visible si NO es vista simple Y si tiene permiso de editar */}
                    {!isSimpleView && canEdit && <th className="p-4 text-center bg-slate-50">Acciones</th>}
                </tr>
            </thead>
            <tbody className="text-sm">
              {filteredData.map((item) => (
                <React.Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${expandedRow === item.id ? 'bg-blue-50/30' : ''}`}>
                        <td className="p-4 text-center cursor-pointer sticky left-0 z-20 bg-white border-r border-slate-100" onClick={() => toggleRow(item.id)}>
                            {expandedRow === item.id ? <ChevronUp size={18} className="text-blue-500"/> : <ChevronDown size={18} className="text-slate-400"/>}
                        </td>

                        {!isSimpleView && <td className="p-4 text-center sticky left-12 z-20 bg-white border-r font-bold text-slate-400">{item.ejecutivo}</td>}
                        
                        <td className="p-4 font-bold text-slate-700 truncate">{item.empresa}</td>
                        <td className="p-4">
                            <span className="inline-block px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono font-bold text-slate-700 shadow-sm whitespace-nowrap">
                                {item.comentarios}
                            </span>
                        </td>
                        
                        {!isSimpleView && <td className="p-4 text-center text-xs">{formatDate(item.fechaAlta)}</td>}
                        
                        <td className="p-4 font-mono font-bold">{item.contenedor}</td>
                        <td className="p-4 text-xs">{item.pedimento || '-'}</td>
                        
                        {!isSimpleView && <td className="p-4 text-xs">{item.factura || '-'}</td>}
                        
                        <td className="p-4 text-xs font-bold text-blue-700">{item.proveedor}</td>
                        <td className="p-4 text-[10px] text-slate-500">{item.banco}</td>
                        <td className="p-4 text-[10px] text-slate-500 font-mono">{item.cuenta}</td>
                        <td className="p-4 text-[10px] text-slate-500 font-mono">{item.clabe}</td>
                        
                        <td className="p-4 text-center">
                            <StatusBadge item={item} /> 
                            <div className="text-[10px] mt-1 text-slate-400">{formatDate(item.eta)}</div>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-800">${item.amount.toLocaleString()}</td>
                        
                        {/* BOTÓN EDITAR: Validado con canEdit (false para Pagos) */}
                        {!isSimpleView && canEdit && (
                            <td className="p-4 text-center">
                                <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                    <Edit size={16}/>
                                </button>
                            </td>
                        )}
                    </tr>
                    
                    {/* DESGLOSE EXPANDIBLE */}
                    {expandedRow === item.id && (
                        <tr className="bg-slate-50">
                            <td colSpan={isSimpleView ? "12" : "15"} className="p-0 border-b border-slate-200 shadow-inner">
                                <div className="p-6">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b pb-2">Desglose de costos</h4>
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
                                                    <button 
                                                        onClick={() => onPayItem(item.id, c.k)} 
                                                        disabled={item.paidFlags?.[c.k] || item.payment === 'paid'} 
                                                        className={`ml-2 p-1 rounded text-[10px] font-bold uppercase ${item.paidFlags?.[c.k] || item.payment === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}
                                                    >
                                                        {item.paidFlags?.[c.k] || item.payment === 'paid' ? 'Pagado' : 'Pagar'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        {canPay && item.payment !== 'paid' && (
                                            <button onClick={() => onPayAll(item.id)} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded shadow hover:bg-emerald-700 text-xs">
                                                Saldar total
                                            </button>
                                        )}
                                        <button onClick={() => onCloseOperation(item)} className="px-4 py-2 bg-slate-800 text-white font-bold rounded shadow hover:bg-slate-900 text-xs flex items-center">
                                            <Lock size={12} className="mr-2"/> Cerrar operación
                                        </button>
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

const AccountClosure = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Estado del formulario manual
  const [spreadsheet, setSpreadsheet] = useState({
    venta: 0, almacenajes: 0, transporte: 0, demoras: 0, estadias: 0, otros: 0,
    anticipo1: 0, anticipo2: 0, anticipo3: 0
  });

  const filteredOptions = data.filter(item => 
    item.bl.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.contenedor && item.contenedor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm(`${item.bl} - ${item.contenedor || item.container}`);
    setShowDropdown(false);
    setSpreadsheet({
        venta: 0, almacenajes: 0, transporte: 0, demoras: 0, estadias: 0, otros: 0,
        anticipo1: 0, anticipo2: 0, anticipo3: 0
    });
  };

  const handleCalcChange = (e) => {
    const { name, value } = e.target;
    setSpreadsheet({ ...spreadsheet, [name]: parseFloat(value) || 0 });
  };

  // Cálculos
  const totalCliente = spreadsheet.venta + spreadsheet.almacenajes + spreadsheet.transporte + spreadsheet.demoras + spreadsheet.estadias + spreadsheet.otros;
  const totalAnticipo = spreadsheet.anticipo1 + spreadsheet.anticipo2 + spreadsheet.anticipo3;
  const diferencia = totalCliente - totalAnticipo;

  // --- FUNCIÓN DE PDF ---
  const handleSavePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let yPos = 20;

    // Colores personalizados (RGB)
    const black = [30, 30, 30];
    const orangeBg = [255, 247, 237]; 
    const orangeBorder = [253, 186, 116]; 
    const greenBg = [240, 253, 244]; 
    const greenBorder = [134, 239, 172]; 
    const redBg = [254, 242, 242]; 
    const redText = [185, 28, 28]; 

    // 1. ENCABEZADO NEGRO
    doc.setFillColor(...black);
    doc.rect(0, 0, 210, 50, 'F'); 

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ESTADO DE CUENTA FINAL", margin, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Resumen de cierre operativo y financiero", margin, 26);
    
    doc.setFontSize(9);
    doc.text(`CLIENTE: ${selectedItem.empresa || selectedItem.client}`, margin, 35);
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 190, 35, { align: 'right' });
    
    doc.text(`BL MASTER: ${selectedItem.bl}`, margin, 43);
    doc.text(`CONTENEDOR: ${selectedItem.contenedor || selectedItem.container}`, 190, 43, { align: 'right' });

    yPos = 70;

    // Función auxiliar para dibujar filas
    const drawRow = (label, value, bgColor, borderColor) => {
        doc.setFillColor(...bgColor);
        doc.setDrawColor(...borderColor);
        doc.rect(margin, yPos, 85, 10, 'F');
        doc.rect(margin, yPos, 85, 10, 'S');
        doc.rect(margin + 85, yPos, 85, 10, 'S');
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, margin + 80, yPos + 7, { align: 'right' });
        doc.setFont("helvetica", "normal");
        doc.text(`$${value.toLocaleString()}`, margin + 165, yPos + 7, { align: 'right' });
        yPos += 10;
    };

    // 2. SECCIÓN CARGOS (NARANJA)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("CARGOS AL CLIENTE", margin, yPos - 5);
    
    const cargos = [
        { l: 'VENTA DE CONTENEDOR', v: spreadsheet.venta },
        { l: 'ALMACENAJES', v: spreadsheet.almacenajes },
        { l: 'TRANSPORTE', v: spreadsheet.transporte },
        { l: 'DEMORAS', v: spreadsheet.demoras },
        { l: 'ESTADÍAS', v: spreadsheet.estadias },
        { l: 'OTROS', v: spreadsheet.otros },
    ];

    cargos.forEach(c => drawRow(c.l, c.v, orangeBg, orangeBorder));

    doc.setFillColor(255, 237, 213); 
    doc.rect(margin, yPos, 170, 12, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CLIENTE", margin + 80, yPos + 8, { align: 'right' });
    doc.text(`$${totalCliente.toLocaleString()}`, margin + 165, yPos + 8, { align: 'right' });
    yPos += 20;

    // 3. SECCIÓN ANTICIPOS (VERDE)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("ANTICIPOS RECIBIDOS", margin, yPos - 5);

    const anticipos = [
        { l: 'ANTICIPO 1', v: spreadsheet.anticipo1 },
        { l: 'ANTICIPO 2', v: spreadsheet.anticipo2 },
        { l: 'ANTICIPO 3', v: spreadsheet.anticipo3 },
    ];

    anticipos.forEach(a => drawRow(a.l, a.v, greenBg, greenBorder));

    doc.setFillColor(220, 252, 231); 
    doc.rect(margin, yPos, 170, 12, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL ANTICIPOS", margin + 80, yPos + 8, { align: 'right' });
    doc.text(`$${totalAnticipo.toLocaleString()}`, margin + 165, yPos + 8, { align: 'right' });
    yPos += 25;

    // 4. DIFERENCIA (ROJO GRAN FINAL)
    doc.setDrawColor(185, 28, 28); 
    doc.setLineWidth(1);
    doc.setFillColor(...redBg);
    doc.roundedRect(margin, yPos, 170, 25, 3, 3, 'FD'); 

    doc.setTextColor(...redText);
    doc.setFontSize(14);
    doc.text("DIFERENCIA A PAGAR / SALDO", margin + 85, yPos + 10, { align: 'center' });
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(`$${diferencia.toLocaleString()}`, margin + 85, yPos + 20, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Este documento es un comprobante interno de cierre de cuenta.", 105, 280, { align: 'center' });

    doc.save(`Cierre_${selectedItem.bl}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-12">
      {/* SELECCIÓN DE CONTENEDOR */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <ClipboardCheck className="mr-2 text-blue-600"/> Cierre de Cuenta
        </h2>
        <div className="relative">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Buscar Contenedor / BL</label>
            <div className="flex items-center">
                <Search className="absolute left-3 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Escribe para buscar..." 
                    className="w-full pl-10 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg uppercase"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                />
                {selectedItem && (
                    <button onClick={() => { setSelectedItem(null); setSearchTerm(''); }} className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded"><X/></button>
                )}
            </div>
            
            {showDropdown && searchTerm && !selectedItem && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-b-lg z-50 max-h-60 overflow-y-auto">
                    {filteredOptions.map(item => (
                        <div key={item.id} onClick={() => handleSelect(item)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50">
                            <div className="font-bold text-slate-700">{item.bl}</div>
                            <div className="text-xs text-slate-500">{item.empresa || item.client} - {item.contenedor || item.container}</div>
                        </div>
                    ))}
                    {filteredOptions.length === 0 && <div className="p-3 text-slate-400 text-sm">No se encontraron resultados.</div>}
                </div>
            )}
        </div>
      </div>

      {selectedItem ? (
        <div className="bg-white shadow-2xl border border-slate-300 w-full max-w-4xl mx-auto font-sans">
            {/* ENCABEZADO VISUAL (HTML) */}
            <div className="bg-black text-white p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center border-b-4 border-slate-600">
                <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-widest">Cierre de Cuenta</h3>
                    <div className="text-sm font-bold mt-1">{selectedItem.empresa || selectedItem.client}</div>
                    <div className="text-xs text-gray-400">{selectedItem.bl}</div>
                </div>
                <div className="text-right md:text-left">
                    <div className="text-xs text-gray-400 uppercase">ETA</div>
                    <div className="font-mono font-bold text-lg">{formatDate(selectedItem.eta)}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-400 uppercase">FECHA CIERRE</div>
                    <div className="font-mono font-bold text-lg">{new Date().toLocaleDateString()}</div>
                </div>
            </div>

            {/* CUERPO DE LA TABLA (HTML) */}
            <div className="p-8 space-y-1 bg-white">
                {[
                    { label: 'VENTA DE CONTENEDOR', name: 'venta' },
                    { label: 'ALMACENAJES', name: 'almacenajes' },
                    { label: 'TRANSPORTE', name: 'transporte' },
                    { label: 'DEMORAS', name: 'demoras' },
                    { label: 'ESTADÍAS', name: 'estadias' },
                    { label: 'OTROS', name: 'otros' }
                ].map((row, idx) => (
                    <div key={idx} className="flex border-b border-slate-200">
                        <div className="w-1/2 p-2 bg-orange-50 border-r border-slate-200 font-bold text-slate-700 uppercase text-sm flex items-center justify-end pr-4">
                            {row.label}
                        </div>
                        <div className="w-1/2 p-1 relative">
                            <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                            <input type="number" name={row.name} value={spreadsheet[row.name] || ''} onChange={handleCalcChange} className="w-full h-full p-2 pl-8 text-right font-mono text-slate-800 outline-none bg-transparent" placeholder="0.00"/>
                        </div>
                    </div>
                ))}

                <div className="flex border-t-2 border-black mt-2">
                    <div className="w-1/2 p-3 bg-orange-200 border-r border-black font-extrabold text-red-900 uppercase text-sm flex items-center justify-end pr-4">TOTAL CLIENTE</div>
                    <div className="w-1/2 p-3 bg-orange-100 text-right font-mono font-bold text-xl text-slate-900">${totalCliente.toLocaleString()}</div>
                </div>

                <div className="h-6"></div>

                {[
                    { label: 'ANTICIPO 1', name: 'anticipo1' },
                    { label: 'ANTICIPO 2', name: 'anticipo2' },
                    { label: 'ANTICIPO 3', name: 'anticipo3' }
                ].map((row, idx) => (
                    <div key={idx} className="flex border-b border-slate-200">
                        <div className="w-1/2 p-2 bg-green-50 border-r border-slate-200 font-bold text-green-800 uppercase text-sm flex items-center justify-end pr-4">{row.label}</div>
                        <div className="w-1/2 p-1 relative">
                            <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                            <input type="number" name={row.name} value={spreadsheet[row.name] || ''} onChange={handleCalcChange} className="w-full h-full p-2 pl-8 text-right font-mono text-slate-800 outline-none bg-transparent" placeholder="0.00"/>
                        </div>
                    </div>
                ))}

                <div className="flex border-t-2 border-green-600">
                    <div className="w-1/2 p-3 bg-green-200 border-r border-green-600 font-extrabold text-green-900 uppercase text-sm flex items-center justify-end pr-4">TOTAL ANTICIPO</div>
                    <div className="w-1/2 p-3 bg-green-100 text-right font-mono font-bold text-xl text-green-900">${totalAnticipo.toLocaleString()}</div>
                </div>

                <div className="h-6"></div>

                <div className="flex border-4 border-red-800 shadow-lg transform scale-105 origin-center my-4">
                    <div className="w-1/2 p-4 bg-red-300 border-r-4 border-red-800 font-extrabold text-red-950 uppercase text-lg flex items-center justify-end pr-4">DIFERENCIA</div>
                    <div className="w-1/2 p-4 bg-red-200 text-right font-mono font-extrabold text-3xl text-red-900">${diferencia.toLocaleString()}</div>
                </div>
            </div>
            
            {/* BOTÓN GUARDAR PDF */}
            <div className="p-4 bg-slate-100 border-t border-slate-300 flex justify-end">
                <button 
                    onClick={handleSavePDF} 
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 flex items-center transition-transform hover:-translate-y-1"
                >
                    <Download size={20} className="mr-2"/> Guardar PDF
                </button>
            </div>
        </div>
      ) : (
        <div className="text-center py-20 opacity-50">
            <div className="inline-block p-6 bg-slate-200 rounded-full mb-4"><ClipboardCheck size={64} className="text-slate-400"/></div>
            <p className="text-xl font-bold text-slate-500">Selecciona un contenedor para comenzar el cierre</p>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('admin');
  const [userName, setUserName] = useState('ADMIN'); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(initialData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modales
  const [paymentConfirmation, setPaymentConfirmation] = useState({ isOpen: false, item: null });
  const [editingItem, setEditingItem] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [itemToClose, setItemToClose] = useState(null);

  const handleLogin = (userRole, name) => { setRole(userRole); setUserName(name); setIsLoggedIn(true); };
  const handleLogout = () => { setIsLoggedIn(false); setActiveTab('dashboard'); };
  
  const handleSave = (newItem) => {
    const itemWithId = { ...newItem, id: Date.now() };
    setData([itemWithId, ...data]);
    setActiveTab('list');
  };

  const handleEditClick = (item) => setEditingItem(item);
  const handleSaveEdit = (editedItem) => {
    const newData = data.map(item => item.id === editedItem.id ? { ...editedItem, status: calculateStatus(editedItem.eta), editCount: (item.editCount || 0) + 1 } : item);
    setData(newData);
    setEditingItem(null);
  };

  const initiatePayment = (id) => { const item = data.find(i => i.id === id); if (item) { setPaymentConfirmation({ isOpen: true, item }); } };
  const executePayment = () => { const { item } = paymentConfirmation; if (!item) return; handlePayAll(item.id); setPaymentConfirmation({ isOpen: false, item: null }); };

  const handlePayItem = (id, costKey) => {
      const newData = data.map(d => d.id === id ? { ...d, paidFlags: { ...(d.paidFlags || {}), [costKey]: true } } : d);
      setData(newData);
  };

  const handlePayAll = (id) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const newData = data.map(d => d.id === id ? { ...d, payment: 'paid', paymentDate: todayStr, paidFlags: { costDemoras: true, costAlmacenaje: true, costOperativos: true, costPortuarios: true, costApoyo: true, costImpuestos: true, costLiberacion: true, costTransporte: true } } : d);
      setData(newData);
  };

  const handleCloseOperation = (item) => {
      if (item.payment !== 'paid') {
         if(!window.confirm("⚠️ PAGOS PENDIENTES\n¿Deseas continuar?")) return;
         handlePayAll(item.id); 
         setItemToClose({ ...item, payment: 'paid' });
      } else {
         setItemToClose(item);
      }
      setCloseModalOpen(true);
  };

    const confirmClose = () => {
    const newData = data.map(d => {
       // Aquí actualizamos explícitamente el estatus a 'closed'
       if (d.id === itemToClose.id) {
           return { ...d, status: 'closed' };
       }
       return d;
    });
    setData(newData);
    setCloseModalOpen(false);
    setItemToClose(null);
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
      <PaymentModal isOpen={paymentConfirmation.isOpen} item={paymentConfirmation.item} onClose={() => setPaymentConfirmation({ isOpen: false, item: null })} onConfirm={executePayment} />
      <EditModal isOpen={!!editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveEdit} item={editingItem} role={role} />
      <CloseModal isOpen={closeModalOpen} onClose={confirmClose} item={itemToClose} />

      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out relative`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-9 bg-blue-600 text-white p-1 rounded-full shadow-lg border-2 border-slate-100 hover:bg-blue-700 transition-colors z-20">{isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}><div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"><Ship size={20} className="text-white" /></div>{!isSidebarCollapsed && (<div className="overflow-hidden"><span className="text-lg font-bold tracking-tight whitespace-nowrap">AduanaSoft</span><p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">v2.3 Beta</p></div>)}</div>
        <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Visión general" />
          <NavItem id="list" icon={TableIcon} label="Sábana operativa" />
          <NavItem id="capture" icon={Plus} label="Alta de contenedores" />
          <NavItem id="closure" icon={ClipboardCheck} label="Cierre de cuenta" /> 
          {(role === 'admin' || role === 'ejecutivo') && (<div className={`mt-6 ${isSidebarCollapsed ? 'border-t border-slate-800 pt-6' : ''}`}><NavItem id="quotes" icon={Calculator} label="Cotizador" /></div>)}
        </nav>
        <div className="p-4 border-t border-slate-800"><div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-4`}><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0"><User size={20} /></div>{!isSidebarCollapsed && (<div className="overflow-hidden"><p className="text-sm font-medium whitespace-nowrap">Hola, {userName}</p><RoleBadge role={role} /></div>)}</div><button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-center px-4'} py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors text-xs font-bold`}><LogOut size={14} className={`${isSidebarCollapsed ? '' : 'mr-2'}`} /> {!isSidebarCollapsed && "Cerrar sesión"}</button></div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10"><div className="text-xl font-bold text-slate-800 flex items-center gap-2">{activeTab === 'list' && 'Gestión y pagos'}<span className="hidden md:inline-flex ml-4 transform scale-90 origin-left"><RoleBadge role={role} /></span></div></header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <DashboardView data={data} />}
          {activeTab === 'capture' && <CaptureForm onSave={handleSave} onCancel={() => setActiveTab('dashboard')} existingData={data} role={role} userName={userName} />}
          {activeTab === 'list' && <ListView data={data} onPayItem={handlePayItem} onPayAll={handlePayAll} onCloseOperation={handleCloseOperation} role={role} onEdit={handleEditClick} />}
          {activeTab === 'closure' && <AccountClosure data={data} />}
          {activeTab === 'quotes' && <QuoteGenerator role={role} />}
        </div>
      </main>
    </div>
  );
}