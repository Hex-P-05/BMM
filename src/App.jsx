import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; 
import { 
  LayoutDashboard, FileText, Table as TableIcon, AlertTriangle, CheckCircle, 
  Clock, Ship, DollarSign, Plus, Search, Menu, X, User, Edit, Lock, 
  TrendingUp, TrendingDown, Activity, AlertCircle, Calculator, Trash2, 
  Download, Printer, Package, MapPin, Key, LogOut, Check, 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ShieldAlert, Eye, EyeOff, 
  Anchor, ClipboardCheck
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

// --- UTILIDAD DE GENERACIÓN DE PDF (MOTOR GRÁFICO) ---
const generatePDF = (itemsToPrint, filename = 'Comprobantes.pdf') => {
  const doc = new jsPDF();
  
  itemsToPrint.forEach((item, index) => {
    if (index > 0) doc.addPage(); // Nueva página para cada recibo

    // Fondo y Encabezado
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(0, 0, 210, 297, 'F'); // Fondo completo
    
    doc.setFillColor(37, 99, 235); // Azul header
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("AduanaSoft", 15, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Comprobante de Cierre Operativo", 15, 30);

    // Datos del Contenedor
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 150, 30, { align: 'right' });

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 50, 180, 35, 3, 3, 'F'); // Caja datos
    
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", 25, 65);
    doc.text("BL MASTER:", 110, 65);
    doc.text("CONTENEDOR:", 110, 75);
    
    doc.setFont("helvetica", "normal");
    doc.text(item.client, 50, 65);
    doc.text(item.bl, 145, 65);
    doc.text(item.container, 145, 75);

    // Tabla de Costos
    let yPos = 100;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Desglose de Costos", 15, 95);
    
    // Línea divisoria
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
            doc.setDrawColor(241, 245, 249); // Línea sutil
            doc.line(25, yPos + 3, 185, yPos + 3);
        }
    });

    // Total
    yPos += 20;
    doc.setFillColor(30, 41, 59); // Slate-800
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

// --- DATOS INICIALES (MOCKS CON TODOS LOS CAMPOS DE PAGOS) ---
// --- DATOS INICIALES (MOCKS ACTUALIZADOS) ---
const rawData = [
  { 
    id: 1, bl: 'HLCU12345678', provider: 'HAPAG', client: 'Importadora México S.A.', clientCode: 'IMP', reason: 'FLETE', container: 'MSKU987654', eta: addDays(45), freeDays: 7, editCount: 0, payment: 'paid', paymentDate: '2025-06-10', paymentDelay: 0, currency: 'MXN', concept: 'HAPAG IMP 1 FLETE',
    // DATOS NUEVOS
    terminal: 'CONTECON', 
    observation: 'Contenedor con carga frágil.',
    // COSTOS
    costDemoras: 0, costAlmacenaje: 0, costOperativos: 5000, costPortuarios: 2000, costApoyo: 0, costImpuestos: 1000, costLiberacion: 0, costTransporte: 7000,
    amount: 15000, status: 'active', paidFlags: {} 
  },
  { 
    id: 2, bl: 'MAEU87654321', provider: 'MAERSK', client: 'Logística Global', clientCode: 'LOG', reason: 'DEMORAS', container: 'TCLU123000', eta: addDays(-5), freeDays: 14, editCount: 1, payment: 'paid', paymentDate: '2025-06-12', paymentDelay: 5, currency: 'USD', concept: 'MAERSK LOG 1 DEMORAS',
    terminal: 'TIMSA', 
    observation: '',
    costDemoras: 15000, costAlmacenaje: 5000, costOperativos: 1000, costPortuarios: 0, costApoyo: 0, costImpuestos: 500, costLiberacion: 0, costTransporte: 1000,
    amount: 22500, status: 'active', paidFlags: {}
  },
  { 
    id: 3, bl: 'COSU11223344', provider: 'COSCO', client: 'Textiles del Norte', clientCode: 'TEX', reason: 'GARANTÍA', container: 'MRKU554433', eta: addDays(5), freeDays: 21, editCount: 2, payment: 'pending', paymentDate: null, paymentDelay: 0, currency: 'MXN', concept: 'COSCO TEX 1 GARANTÍA',
    terminal: 'SSA MÉXICO', 
    observation: 'Requiere revisión previa.',
    costDemoras: 0, costAlmacenaje: 0, costOperativos: 0, costPortuarios: 0, costApoyo: 18000, costImpuestos: 0, costLiberacion: 0, costTransporte: 0,
    amount: 18000, status: 'active', paidFlags: {}
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
const StatusBadge = ({ item }) => {
  if (item.payment === 'paid') {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${item.paymentDelay > 0 ? 'bg-slate-700' : 'bg-blue-600'}`}>
        <Check size={14} className="mr-1" strokeWidth={3} />
        {item.paymentDelay > 0 ? 'PAGADO (Retraso)' : 'PAGADO'}
      </span>
    );
  }
  // Colores Sólidos para el Semáforo
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

// --- MODAL DE EDICIÓN CON LOS 8 CAMPOS DE PAGO ---
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

  const handleSave = () => { onSave(editData); };

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
             <input disabled name="container" value={editData.container} onChange={handleChange} className="w-full p-2 border rounded bg-slate-100 text-slate-500 cursor-not-allowed" />
          </div>
          
          {/* CAMPOS EDITABLES PARA REVALIDACIÓN */}
          <div className="col-span-1">
             <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">Fecha ETA {isRestricted && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}</label>
             <input type="date" name="eta" value={editData.eta} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="col-span-1">
             <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center">Días libres {isRestricted && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 rounded">Editable</span>}</label>
             <input type="number" name="freeDays" value={editData.freeDays} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* CAMPOS INFORMATIVOS (BLOQUEADOS PARA REVALIDACIÓN) */}
          <div className="col-span-1">
             <label className="text-xs font-bold text-slate-500 mb-1 block">Terminal</label>
             <input disabled={isRestricted} name="terminal" value={editData.terminal} onChange={handleChange} className={`w-full p-2 border rounded ${isRestricted ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} />
          </div>
          <div className="col-span-1">
             <label className="text-xs font-bold text-slate-500 mb-1 block">Observaciones</label>
             <input disabled={isRestricted} name="observation" value={editData.observation} onChange={handleChange} className={`w-full p-2 border rounded ${isRestricted ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} />
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
             {isRestricted && <p className="text-[10px] text-red-400 mt-3 italic">* Contacte a Admin para otros cambios.</p>}
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

// --- NUEVO MODAL PARA CERRAR OPERACIÓN Y PDF ---
const CloseModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  // Manejador para cerrar Y descargar
  const handleCloseAndDownload = () => {
    generatePDF([item], `Comprobante_${item.bl}.pdf`); // Usamos la nueva función
    onClose();
  };

  const costList = [
    { l: 'Demoras', v: item.costDemoras }, { l: 'Almacenaje', v: item.costAlmacenaje },
    { l: 'Operativos', v: item.costOperativos }, { l: 'Portuarios', v: item.costPortuarios },
    { l: 'Apoyo', v: item.costApoyo }, { l: 'Impuestos', v: item.costImpuestos },
    { l: 'Liberación', v: item.costLiberacion }, { l: 'Transporte', v: item.costTransporte }
  ].filter(c => c.v > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div><h3 className="text-xl font-bold flex items-center"><CheckCircle className="mr-2"/> Cerrar Operación</h3><p className="text-emerald-100 text-sm">Se generará el registro final del contenedor.</p></div>
          <button onClick={onClose}><X className="text-white hover:bg-emerald-700 rounded p-1" /></button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">Resumen Financiero</h4>
            {costList.map((c, i) => (
              <div key={i} className="flex justify-between border-b border-slate-50 pb-2 mb-2 text-sm"><span className="text-slate-600">{c.l}</span><span className="font-bold text-slate-800">${c.v.toLocaleString()}</span></div>
            ))}
            <div className="mt-4 p-3 bg-slate-100 rounded flex justify-between items-center font-bold text-slate-800 border border-slate-200"><span>TOTAL FINAL</span><span>${item.amount.toLocaleString()} {item.currency}</span></div>
          </div>
        </div>

        <div className="p-4 border-t bg-white flex gap-3">
          {/* BOTÓN 1: SOLO CERRAR (OK) */}
          <button onClick={onClose} className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors">
            Confirmar y Cerrar
          </button>
          {/* BOTÓN 2: DESCARGAR Y CERRAR */}
          <button onClick={handleCloseAndDownload} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg flex justify-center items-center gap-2">
            <Download size={18} /> Descargar PDF
          </button>
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
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Beneficiario:</span><span className="font-medium text-slate-800">{item.provider}</span></div>
            <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">Cliente:</span><span className="font-medium text-slate-800">{item.client}</span></div>
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

const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-8 w-full">
          <div className="flex items-center space-x-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Ship size={24} className="text-white" /></div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">AduanaSoft</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Bienvenido de nuevo</h2>
          <p className="text-slate-500 text-sm mb-6 text-center">Ingresa a tu cuenta para gestionar operaciones.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="usuario@empresa.com" autoFocus />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <div className="relative">
                    <Key className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                        placeholder="••••••••" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none">
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                </div>
            </div>
            {error && (<div className="bg-red-50 text-red-600 text-xs p-3 rounded flex items-center"><AlertCircle size={14} className="mr-2" />{error}</div>)}
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Iniciar sesión</button>
          </form>
          <div className="mt-8 text-center"><p className="text-xs text-slate-400">v2.2 Beta | © 2025 AduanaSoft</p></div>
        </div>
      </div>
    </div>
  );
};

// --- GENERADOR DE COTIZACIONES (EDITOR + PREVISUALIZACIÓN + PDF NATIVO) ---
const QuoteGenerator = ({ role }) => {
  const [clientInfo, setClientInfo] = useState({
    name: '', rfc: '', address: '', date: new Date().toISOString().split('T')[0], validUntil: addDays(15)
  });

  const [items, setItems] = useState([{ id: 1, description: 'Servicio de Maniobras en Terminal', amount: 0 }]);

  const addItem = () => setItems([...items, { id: Date.now(), description: '', amount: 0 }]);
  const removeItem = (id) => { if (items.length > 1) setItems(items.filter(i => i.id !== id)); };
  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: field === 'amount' ? (parseFloat(value) || 0) : value } : item));
  };

  const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  // --- FUNCIÓN GENERADORA DE PDF (NATIVA - Motor Gráfico) ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let yPos = 20;
    const primaryColor = [37, 99, 235]; const lightBg = [239, 246, 255]; const borderColor = [191, 219, 254]; const darkText = [30, 41, 59]; const lightText = [100, 116, 139];

    // Header Azul
    doc.setFillColor(...primaryColor); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("COTIZACIÓN", margin, 20);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("Servicios Logísticos y Aduanales", margin, 26);
    doc.text("AduanaSoft México S.A. de C.V.", 190, 15, { align: 'right' }); doc.text("RFC: ADU990101XYZ", 190, 20, { align: 'right' });

    // Datos Cliente
    doc.setDrawColor(...borderColor); doc.setFillColor(255, 255, 255); doc.roundedRect(margin, 45, 170, 25, 2, 2, 'S');
    doc.setTextColor(...lightText); doc.setFontSize(8); doc.text("PREPARADO PARA:", margin + 5, 52); doc.text("FECHA DE EMISIÓN:", 130, 52); doc.text("VÁLIDA HASTA:", 130, 62);
    doc.setTextColor(...darkText); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text(clientInfo.name || "CLIENTE MOSTRADOR", margin + 5, 58);
    doc.setFont("helvetica", "normal"); doc.text(clientInfo.rfc || "", margin + 5, 63); doc.text(formatDate(clientInfo.date), 155, 52); doc.text(formatDate(clientInfo.validUntil), 155, 62);

    // Tabla
    yPos = 85; doc.setFillColor(...lightBg); doc.rect(margin, yPos, 170, 10, 'F'); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor); doc.text("DESCRIPCIÓN DEL SERVICIO", margin + 5, yPos + 7); doc.text("IMPORTE", 185, yPos + 7, { align: 'right' });
    yPos += 15; doc.setTextColor(...darkText); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    items.forEach((item) => {
        doc.text(item.description, margin + 5, yPos); doc.text(`$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 185, yPos, { align: 'right' });
        doc.setDrawColor(241, 245, 249); doc.line(margin, yPos + 3, 190, yPos + 3); yPos += 10;
    });

    // Totales
    yPos += 10; const xTotals = 130;
    doc.text("Subtotal:", xTotals, yPos); doc.text(`$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 185, yPos, { align: 'right' }); yPos += 8;
    doc.text("IVA (16%):", xTotals, yPos); doc.text(`$${iva.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 185, yPos, { align: 'right' }); yPos += 10;
    doc.setFillColor(...primaryColor); doc.roundedRect(xTotals - 5, yPos - 6, 65, 12, 1, 1, 'F'); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.text("TOTAL NETO", xTotals, yPos + 2); doc.text(`$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 185, yPos + 2, { align: 'right' });

    // Footer
    doc.setTextColor(...lightText); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("TÉRMINOS Y CONDICIONES: Precios en MXN. Sujeto a cambios sin previo aviso.", margin, 270);
    doc.save(`Cotizacion_${clientInfo.name.substring(0, 10) || 'Cliente'}.pdf`);
  };

  return (
    // Layout principal de dos columnas
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12 animate-fade-in h-[calc(100vh-100px)] overflow-hidden">
      
      {/* --- COLUMNA IZQUIERDA: EDITOR --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto h-full flex flex-col">
        <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <Calculator className="mr-2 text-blue-600"/> Editor de Cotización
            </h2>

            {/* Formulario Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Cliente</label><input type="text" className="w-full p-2 border rounded outline-none text-sm" placeholder="Nombre..." value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">RFC</label><input type="text" className="w-full p-2 border rounded outline-none text-sm font-mono uppercase" placeholder="XAXX..." value={clientInfo.rfc} onChange={e => setClientInfo({...clientInfo, rfc: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Emisión</label><input type="date" className="w-full p-2 border rounded outline-none text-sm" value={clientInfo.date} onChange={e => setClientInfo({...clientInfo, date: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Vencimiento</label><input type="date" className="w-full p-2 border rounded outline-none text-sm" value={clientInfo.validUntil} onChange={e => setClientInfo({...clientInfo, validUntil: e.target.value})} /></div>
            </div>

            {/* Editor de Conceptos */}
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-left">
                    <thead className="bg-slate-100 text-xs text-slate-500 uppercase font-bold"><tr><th className="p-2 pl-4">Concepto</th><th className="p-2 text-right w-32">Importe</th><th className="p-2 w-8"></th></tr></thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-t border-slate-100 bg-white">
                                <td className="p-2 pl-4"><input type="text" className="w-full p-1 bg-transparent outline-none text-sm" placeholder="Descripción..." value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)}/></td>
                                <td className="p-2 relative"><span className="absolute left-3 top-3 text-slate-400 text-xs">$</span><input type="number" className="w-full p-1 pl-6 bg-transparent outline-none text-right font-mono text-sm" placeholder="0.00" value={item.amount || ''} onChange={(e) => updateItem(item.id, 'amount', e.target.value)}/></td>
                                <td className="p-2 text-center"><button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={addItem} className="w-full py-2 bg-slate-50 text-blue-600 text-xs font-bold uppercase hover:bg-blue-50 transition-colors border-t border-slate-200 flex items-center justify-center"><Plus size={14} className="mr-1"/> Agregar Concepto</button>
            </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="mt-4 pt-4 border-t border-slate-200">
             <button onClick={handleDownloadPDF} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center transition-transform hover:-translate-y-1">
                <Download size={20} className="mr-2"/> Descargar PDF Oficial
            </button>
        </div>
      </div>

      {/* --- COLUMNA DERECHA: PREVISUALIZACIÓN EN VIVO --- */}
      <div className="hidden lg:block bg-slate-200 p-8 rounded-xl overflow-y-auto h-full shadow-inner flex justify-center">
        {/* Hoja de papel visual */}
        <div className="bg-white shadow-2xl w-full max-w-lg min-h-[600px] relative flex flex-col font-sans text-slate-800 text-sm">
            {/* Header Visual */}
            <div className="h-24 bg-blue-600 p-6 text-white flex justify-between items-start">
                <div><h1 className="text-2xl font-bold tracking-tight">COTIZACIÓN</h1><p className="text-blue-100 text-xs mt-1">Servicios Logísticos y Aduanales</p></div>
                <div className="text-right text-xs opacity-80"><p>AduanaSoft México</p><p>Manzanillo, Col.</p></div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
                {/* Info Cliente Visual */}
                <div className="border border-blue-200 rounded-lg p-4 mb-6 bg-blue-50/50 flex justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Preparado para:</p>
                        <p className="font-bold text-lg truncate">{clientInfo.name || <span className="text-slate-300 italic">Nombre del cliente...</span>}</p>
                        <p className="font-mono text-xs uppercase text-slate-500">{clientInfo.rfc}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Fechas:</p>
                        <p className="text-xs"><span className="text-slate-500">Emisión:</span> {formatDate(clientInfo.date)}</p>
                        <p className="text-xs"><span className="text-slate-500">Vence:</span> {formatDate(clientInfo.validUntil)}</p>
                    </div>
                </div>

                {/* Tabla Visual (Solo lectura) */}
                <div className="flex-1 mb-6">
                    <table className="w-full text-left mb-4">
                        <thead className="bg-blue-50 text-blue-700 text-[10px] uppercase font-bold"><tr><th className="p-2 py-3">Descripción</th><th className="p-2 py-3 text-right">Importe</th></tr></thead>
                        <tbody className="text-xs divide-y divide-slate-100">
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td className="p-2 py-3 pr-4 text-slate-700">{item.description || <span className="text-slate-300 italic">Sin descripción...</span>}</td>
                                    <td className="p-2 py-3 text-right font-mono font-bold">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                 {/* Totales Visuales */}
                 <div className="flex justify-end border-t border-slate-200 pt-4">
                    <div className="w-1/2 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-500"><span>Subtotal:</span><span className="font-mono">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-slate-500"><span>IVA (16%):</span><span className="font-mono">${iva.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-lg font-bold text-white bg-blue-600 p-3 rounded-lg shadow-md mt-2">
                            <span>Total Neto:</span>
                            <span className="font-mono">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer Visual */}
            <div className="p-4 bg-slate-50 text-[10px] text-slate-400 text-center border-t">
                <FileText size={12} className="inline mr-1"/> Previsualización de documento. Los precios pueden variar.
            </div>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ data }) => {
  const total = data.length;
  const warning = data.filter(i => i.status === 'warning' && i.payment === 'pending').length;
  const danger = data.filter(i => (i.status === 'danger' || i.status === 'expired') && i.payment === 'pending').length;
  const pendingMoney = data.filter(i => i.payment === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const clientData = useMemo(() => { const counts = {}; data.forEach(item => { counts[item.client] = (counts[item.client] || 0) + 1; }); return Object.keys(counts).map(key => ({ name: key, count: counts[key] })); }, [data]);
  const statusData = [{ name: 'A tiempo', value: total - warning - danger }, { name: 'Riesgo', value: warning }, { name: 'Penalizado', value: danger }];
  const performanceData = [{ name: 'Lun', operaciones: 12, monto: 15000 }, { name: 'Mar', operaciones: 19, monto: 22000 }, { name: 'Mié', operaciones: 15, monto: 18000 }, { name: 'Jue', operaciones: 25, monto: 35000 }, { name: 'Vie', operaciones: 32, monto: 45000 }, { name: 'Sáb', operaciones: 20, monto: 28000 }, { name: 'Dom', operaciones: 10, monto: 12000 }];
  const recentActivities = [{ id: 1, user: 'Admin', action: 'Pago registrado', details: 'BL HLCU123...', time: 'Hace 5 min' }, { id: 2, user: 'Ejecutivo', action: 'Nueva captura', details: 'Cliente: Textil...', time: 'Hace 24 min' }, { id: 3, user: 'Sistema', action: 'Alerta generada', details: 'ETA vencido MAEU...', time: 'Hace 1 hora' }, { id: 4, user: 'Pagos', action: 'Cierre de día', details: 'Reporte generado', time: 'Ayer' }];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Contenedores activos" value={total} icon={Ship} colorClass="bg-blue-100 text-blue-600" trend="up" trendValue="+12%" subtext="vs mes pasado" />
        <KPICard title="Alertas (próximos)" value={warning} icon={Clock} colorClass="bg-amber-100 text-amber-600" trend="down" trendValue="-5%" subtext="mejoría en tiempos" />
        <KPICard title="Críticos (vencidos)" value={danger} icon={AlertTriangle} colorClass="bg-rose-100 text-rose-600" trend="up" trendValue="+2" subtext="requiere atención" />
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

// --- CAPTURE FORM CON DESGLOSE VISIBLE (CORREGIDO) ---
const CaptureForm = ({ onSave, onCancel, existingData, role }) => {
  if (role === 'pagos') return <div className="p-10 text-center text-red-500 font-bold">Acceso denegado: Rol no autorizado para capturas.</div>;

  const [formData, setFormData] = useState({
    bl: '', provider: '', rfc: '', address: '', client: '', reason: 'GARANTÍA', container: '', eta: '', currency: 'MXN',
    freeDays: 7, terminal: '', observation: '', // <--- NUEVOS CAMPOS
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
      payment: 'pending',
      paymentDate: null,
      paymentDelay: 0,
      editCount: 0, 
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
            
            {/* NUEVOS CAMPOS: TERMINAL Y OBSERVACIONES */}
            <div><label className="text-sm font-medium text-slate-700">Terminal</label><input name="terminal" className="w-full p-2 border rounded outline-none" placeholder="Ej. CONTECON" onChange={handleChange} /></div>
            <div><label className="text-sm font-medium text-slate-700">Observaciones</label><input name="observation" className="w-full p-2 border rounded outline-none" placeholder="Comentarios adicionales..." onChange={handleChange} /></div>

            <div className="col-span-1 md:col-span-2 border-t pt-4">
               <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700">Desglose de costos (Granularidad)</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="text-xs p-1 border rounded font-bold text-blue-600 bg-white"><option value="MXN">MXN (Pesos)</option><option value="USD">USD (Dólares)</option></select>
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
  
  // --- NUEVO: ESTADO PARA SELECCIÓN MÚLTIPLE ---
  const [selectedIds, setSelectedIds] = useState([]);

  const tableContainerRef = React.useRef(null);

  const filteredData = data.filter(item => 
    item.bl.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.container.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canPay = role === 'admin' || role === 'pagos';
  const canSeeEdit = role === 'admin' || role === 'ejecutivo';

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

  // --- LÓGICA DE SELECCIÓN ---
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
        setSelectedIds([]); // Deseleccionar todo
    } else {
        setSelectedIds(filteredData.map(d => d.id)); // Seleccionar todo lo visible
    }
  };

  const toggleSelectItem = (id) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
        setSelectedIds([...selectedIds, id]);
    }
  };

  // --- LÓGICA DE DESCARGA MASIVA ---
  const handleBulkDownload = () => {
      const itemsToPrint = data.filter(d => selectedIds.includes(d.id));
      if (itemsToPrint.length === 0) return;
      generatePDF(itemsToPrint, `Reporte_Masivo_${itemsToPrint.length}_ops.pdf`);
  };

  const scrollTable = (direction) => {
    if (tableContainerRef.current) {
        const scrollAmount = 400;
        tableContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const costMap = [
    { k: 'costDemoras', l: 'Demoras' }, { k: 'costAlmacenaje', l: 'Almacenaje' },
    { k: 'costOperativos', l: 'Operativos' }, { k: 'costPortuarios', l: 'Portuarios' },
    { k: 'costApoyo', l: 'Apoyo' }, { k: 'costImpuestos', l: 'Impuestos' },
    { k: 'costLiberacion', l: 'Liberación' }, { k: 'costTransporte', l: 'Transporte' }
  ];

  const renderDaysDiff = (etaString) => {
    const diff = getDaysDiff(etaString);
    if (diff < 0) return <span className="text-[10px] font-bold text-red-600 block">Hace {Math.abs(diff)} días</span>;
    if (diff === 0) return <span className="text-[10px] font-bold text-orange-600 block">¡Llega hoy!</span>;
    return <span className="text-[10px] font-medium text-slate-400 block">Faltan {diff} días</span>;
  };

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">Sábana operativa</h2>
            {/* BOTÓN DE DESCARGA MASIVA (Aparece si hay seleccionados) */}
            {selectedIds.length > 0 && (
                <button onClick={handleBulkDownload} className="flex items-center px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-lg hover:bg-slate-900 transition-all animate-bounce-in">
                    <Download size={14} className="mr-2"/> Descargar ({selectedIds.length}) seleccionados
                </button>
            )}
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button onClick={() => scrollTable('left')} className="p-2 hover:bg-white rounded-md transition-all text-slate-500 hover:text-blue-600 shadow-sm"><ChevronLeft size={18}/></button>
                <div className="w-px bg-slate-300 mx-1 my-1"></div>
                <button onClick={() => scrollTable('right')} className="p-2 hover:bg-white rounded-md transition-all text-slate-500 hover:text-blue-600 shadow-sm"><ChevronRight size={18}/></button>
            </div>
            <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 relative">
        <div ref={tableContainerRef} className="overflow-auto h-[calc(100vh-200px)] w-full relative"> 
          <table className="w-full text-left border-collapse min-w-[1900px]">
            <thead className="sticky top-0 z-40 shadow-sm">
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase h-12">
                    
                    {/* CHECKBOX (STICKY 0) */}
                    <th className="p-4 w-12 sticky left-0 top-0 z-50 bg-slate-50 border-r border-b border-slate-200 text-center">
                        <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === filteredData.length && filteredData.length > 0} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/>
                    </th>

                    {/* FLECHA (STICKY 12 -> Desplazado por el checkbox) */}
                    <th className="p-4 w-12 sticky left-12 top-0 z-50 bg-slate-50 border-r border-b border-slate-200"></th>
                    
                    {/* CONCEPTO (STICKY 24) */}
                    <th className="p-4 w-48 sticky left-24 top-0 z-50 bg-slate-50 border-r border-b border-slate-200">Concepto</th>
                    
                    {/* BL (STICKY 72) */}
                    <th className="p-4 w-48 sticky left-72 top-0 z-50 bg-slate-50 border-r border-b border-slate-300 shadow-lg md:shadow-none">BL / Contenedor</th>
                    
                    {/* COLUMNAS NORMALES */}
                    <th className="p-4 w-40 bg-slate-50">ETA & Semáforo</th>
                    <th className="p-4 w-32 text-center bg-slate-50">Días libres</th>
                    <th className="p-4 w-32 text-center bg-slate-50">Estatus Op.</th>
                    <th className="p-4 w-40 text-right bg-slate-50">Monto total</th>
                    <th className="p-4 w-40 text-center bg-slate-50">Fecha Pago</th>
                    
                    {/* NUEVA COLUMNA: COMPROBANTE */}
                    <th className="p-4 w-32 text-center bg-slate-50">Comprobante</th>

                    <th className="p-4 w-40 text-center bg-slate-50">Acciones</th>
                    <th className="p-4 text-center bg-slate-50 min-w-[200px]">Observaciones</th>
                    <th className="p-4 text-center bg-slate-50 min-w-[150px]">Naviera</th>
                    <th className="p-4 text-center bg-slate-50 min-w-[150px]">Terminal</th>
                </tr>
            </thead>
            <tbody className="text-sm">
              {filteredData.map((item) => {
                const isFullyPaid = item.payment === 'paid'; 
                const paidFlags = item.paidFlags || {}; 
                const isSelected = selectedIds.includes(item.id);

                return (
                <React.Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${isSelected ? 'bg-blue-50' : ''} ${expandedRow === item.id ? 'bg-blue-50/30' : ''}`}>
                        
                        {/* 1. CHECKBOX (STICKY LEFT 0) */}
                        <td className="p-4 text-center sticky left-0 z-20 bg-white border-r border-slate-100">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectItem(item.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/>
                        </td>

                        {/* 2. FLECHA (STICKY LEFT 12) */}
                        <td className="p-4 text-center cursor-pointer sticky left-12 z-20 bg-white border-r border-slate-100" onClick={() => toggleRow(item.id)}>
                            {expandedRow === item.id ? <ChevronUp size={18} className="text-blue-500"/> : <ChevronDown size={18} className="text-slate-400"/>}
                        </td>

                        {/* 3. CLIENTE (STICKY LEFT 24) */}
                        <td className="p-4 sticky left-24 z-20 bg-white border-r border-slate-100">
                            <div className="font-bold text-slate-700 truncate w-40" title={item.client}>{item.client}</div>
                            <div className="inline-block mt-1 px-2 py-0.5 bg-slate-100 border rounded text-[10px] font-mono text-slate-600 truncate max-w-[150px]">{item.concept}</div>
                        </td>

                        {/* 4. BL (STICKY LEFT 72) */}
                        <td className="p-4 sticky left-72 z-20 bg-white border-r border-slate-300 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.1)]">
                            <div className="font-mono font-bold text-blue-700">{item.bl}</div>
                            <div className="text-xs text-slate-500 font-bold">{item.container}</div>
                        </td>

                        <td className="p-4"><div className="flex flex-col"><span className="font-bold text-slate-700 text-xs mb-1">{formatDate(item.eta)}</span><StatusBadge item={item} />{renderDaysDiff(item.eta)}</div></td>
                        <td className="p-4 text-center"><div className="inline-flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg border border-slate-200 min-w-[60px]"><span className="text-[10px] text-slate-400 uppercase font-bold mb-1">Libres</span><div className="flex items-center text-slate-700 font-bold"><Clock size={14} className="mr-1 text-slate-400"/> {item.freeDays}</div></div></td>
                        <td className="p-4 text-center">{item.status === 'closed' ? <span className="px-2 py-1 bg-slate-800 text-white rounded text-[10px] font-bold uppercase tracking-wider">Cerrado</span> : <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200">Activo</span>}</td>
                        <td className="p-4 text-right font-medium"><div className="text-lg font-bold text-slate-700">${item.amount.toLocaleString()}</div><div className="text-[10px] text-slate-400 font-bold">{item.currency}</div></td>
                        <td className="p-4 text-center text-xs text-slate-500">{item.payment === 'paid' ? <div><span className="block font-bold text-emerald-600">PAGADO</span><span className="text-[10px]">{formatDate(item.paymentDate)}</span></div> : '-'}</td>
                        
                        {/* 9. NUEVA COLUMNA: COMPROBANTE */}
                        <td className="p-4 text-center">
                            {item.status === 'closed' ? (
                                <button onClick={() => generatePDF([item], `Comprobante_${item.bl}.pdf`)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-200 transition-all group" title="Descargar Comprobante">
                                    <FileText size={18} className="group-hover:scale-110 transition-transform"/>
                                </button>
                            ) : (
                                <span className="text-xs text-slate-300 italic">Pendiente</span>
                            )}
                        </td>

                        <td className="p-4 flex justify-center space-x-2">
                            {canSeeEdit && item.status !== 'closed' && (
                                <button onClick={() => onEdit(item)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all" title="Editar"><Edit size={18}/></button>
                            )}
                        </td>
                        <td className="p-4 text-xs text-slate-400 italic truncate max-w-[200px]">Sin observaciones...</td>
                        <td className="p-4 text-xs text-slate-500 text-center">{item.provider}</td>
                        <td className="p-4 text-xs text-slate-500 text-center">CONTECON</td>
                    </tr>
                    
                    {expandedRow === item.id && (
                        <tr className="bg-slate-50 animate-fade-in">
                            <td colSpan="13" className="p-0 border-b border-slate-200 shadow-inner">
                                <div className="pl-[410px] p-6 relative min-w-max"> 
                                    <div className="absolute left-0 top-0 bottom-0 w-[410px] bg-slate-100 border-r border-slate-200 z-10 flex flex-col justify-center p-6 space-y-4">
                                        <div><h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Cliente & Concepto</h4><div className="font-bold text-slate-700 text-lg truncate" title={item.client}>{item.client}</div><div className="inline-block mt-1 px-3 py-1 bg-white border rounded-md text-xs font-mono text-slate-600 shadow-sm">{item.concept}</div></div>
                                        <div><h4 className="text-xs font-bold text-slate-500 uppercase mb-1">BL & Contenedor</h4><div className="font-mono font-bold text-blue-700 text-lg">{item.bl}</div><div className="text-sm text-slate-600 font-bold">{item.container}</div></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        {costMap.map((c) => {
                                            const monto = item[c.k] || 0;
                                            const isPaid = paidFlags[c.k] || isFullyPaid;
                                            return (
                                                <div key={c.k} className={`p-3 rounded-lg border flex flex-col justify-between shadow-sm transition-all ${monto > 0 ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                    <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{c.l}</span><span className={`font-mono font-bold ${monto > 0 ? 'text-slate-800' : 'text-slate-300'}`}>${monto.toLocaleString()}</span></div>
                                                    {monto > 0 && canPay && item.status !== 'closed' && (
                                                        <button disabled={isPaid} onClick={() => onPayItem(item.id, c.k)} className={`w-full py-1.5 text-[10px] font-bold rounded flex items-center justify-center transition-colors uppercase tracking-wide ${isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default' : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}>{isPaid ? <><Check size={10} className="mr-1"/> Pagado</> : 'Pagar Item'}</button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {canPay && item.status !== 'closed' && (
                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                            {!isFullyPaid && <button onClick={() => onPayAll(item.id)} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center transition-transform hover:-translate-y-0.5"><CheckCircle size={16} className="mr-2"/> SALDAR TODO</button>}
                                            <button onClick={() => onCloseOperation(item)} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center transition-transform hover:-translate-y-0.5"><Lock size={16} className="mr-2"/> CERRAR OPERACIÓN</button>
                                        </div>
                                    )}
                                    {item.status === 'closed' && (<div className="w-full bg-slate-100 border border-slate-200 rounded p-3 text-center"><p className="text-slate-500 text-xs font-bold flex items-center justify-center"><Lock size={12} className="mr-2"/> Operación cerrada y archivada. No se permiten más cambios.</p></div>)}
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

// --- MÓDULO DE CIERRE DE CUENTA (CON PDF CORREGIDO) ---
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
    item.container.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm(`${item.bl} - ${item.container}`);
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

  // --- FUNCIÓN DE PDF CORREGIDA ---
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

    // 1. ENCABEZADO NEGRO (CORREGIDO)
    doc.setFillColor(...black);
    // Aumentamos un poco la altura del fondo negro (de 45 a 50)
    doc.rect(0, 0, 210, 50, 'F'); 

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ESTADO DE CUENTA FINAL", margin, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Resumen de cierre operativo y financiero", margin, 26);
    
    // Datos del Header (REORGANIZADOS PARA NO ENCIMARSE)
    doc.setFontSize(9);
    // Línea 1 de datos (Y=35)
    doc.text(`CLIENTE: ${selectedItem.client}`, margin, 35);
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 190, 35, { align: 'right' });
    
    // Línea 2 de datos (Y=43) - Bajamos estos datos para dar espacio
    doc.text(`BL MASTER: ${selectedItem.bl}`, margin, 43);
    doc.text(`CONTENEDOR: ${selectedItem.container}`, 190, 43, { align: 'right' });

    yPos = 70; // Ajustamos la posición inicial del contenido

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
                            <div className="text-xs text-slate-500">{item.client} - {item.container}</div>
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
                    <div className="text-sm font-bold mt-1">{selectedItem.client}</div>
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
  // --- 1. ESTADOS GENERALES Y AUTENTICACIÓN ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('admin');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- 2. ESTADOS DE NAVEGACIÓN Y DATOS ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(initialData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- 3. ESTADOS DE LOS MODALES ---
  const [paymentConfirmation, setPaymentConfirmation] = useState({ isOpen: false, item: null });
  const [editingItem, setEditingItem] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [itemToClose, setItemToClose] = useState(null);

  // --- 4. MANEJADORES DE AUTENTICACIÓN ---
  const handleLogin = (userRole) => { setRole(userRole); setIsLoggedIn(true); };
  const handleLogout = () => { setIsLoggedIn(false); setActiveTab('dashboard'); };

  // --- 5. LÓGICA DE DATOS (CRUD) ---
  const handleSave = (newItem) => {
    const itemWithId = { ...newItem, id: Date.now(), statusETA: calculateStatus(newItem.eta) };
    setData([itemWithId, ...data]);
    setActiveTab('list');
  };

  const handleSaveEdit = (editedItem) => {
    const newData = data.map(item => {
      if (item.id === editedItem.id) {
        return { 
            ...editedItem, 
            statusETA: calculateStatus(editedItem.eta), 
            editCount: (item.editCount || 0) + 1 
        };
      }
      return item;
    });
    setData(newData);
    setEditingItem(null); 
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

  // --- 6. LÓGICA DE PAGOS ---
  const initiatePayment = (id) => { 
      const item = data.find(i => i.id === id); 
      if (item) { setPaymentConfirmation({ isOpen: true, item }); } 
  };

  const executePayment = () => {
    const { item } = paymentConfirmation;
    if (!item) return;
    handlePayAll(item.id);
    setPaymentConfirmation({ isOpen: false, item: null }); 
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
          const diffDays = getDaysDiff(d.eta);
          let delay = 0; 
          if (diffDays < 0) { delay = Math.abs(diffDays); }

          return { 
              ...d, payment: 'paid', paymentDate: todayStr, paymentDelay: delay,
              paidFlags: { costDemoras: true, costAlmacenaje: true, costOperativos: true, costPortuarios: true, costApoyo: true, costImpuestos: true, costLiberacion: true, costTransporte: true }
          };
        }
        return d;
      });
      setData(newData);
  };

  // --- 7. LÓGICA DE CIERRE ---
  const handleCloseOperation = (item) => {
      if (item.payment !== 'paid') {
         const confirm = window.confirm("⚠️ PAGOS PENDIENTES\n\nEste contenedor aún tiene saldos pendientes. Al cerrarlo se marcará todo como PAGADO automáticamente.\n\n¿Deseas continuar?");
         if(!confirm) return;
         const itemPagado = { ...item, payment: 'paid' };
         handlePayAll(item.id); 
         setItemToClose(itemPagado);
      } else {
         setItemToClose(item);
      }
      setCloseModalOpen(true);
  };

  const confirmClose = () => {
       const newData = data.map(d => {
         if (d.id === itemToClose.id) { return { ...d, status: 'closed' }; }
         return d;
       });
       setData(newData);
       setCloseModalOpen(false);
       setItemToClose(null);
  };

  // --- 8. HELPER MENU ---
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
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}><div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"><Ship size={20} className="text-white" /></div>{!isSidebarCollapsed && (<div className="overflow-hidden"><span className="text-lg font-bold tracking-tight whitespace-nowrap">AduanaSoft</span><p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">v2.2 Production</p></div>)}</div>
        
        <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          {!isSidebarCollapsed && <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3 animate-fade-in">Menú</p>}
          
          <NavItem id="dashboard" icon={LayoutDashboard} label="Visión general" />
          <NavItem id="list" icon={TableIcon} label="Sábana operativa" />
          <NavItem id="capture" icon={Plus} label="Alta de contenedores" />
          
          {/* AQUÍ ESTÁ EL NUEVO BOTÓN DE CIERRE DE CUENTA */}
          <NavItem id="closure" icon={ClipboardCheck} label="Cierre de cuenta" /> 

          {(role === 'admin' || role === 'ejecutivo') && (
            <div className={`mt-6 ${isSidebarCollapsed ? 'border-t border-slate-800 pt-6' : ''}`}>
              {!isSidebarCollapsed && <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3 animate-fade-in">Comercial</p>}
              <NavItem id="quotes" icon={Calculator} label="Generador de cotizaciones" />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800"><div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-4`}><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0"><User size={20} /></div>{!isSidebarCollapsed && (<div className="overflow-hidden"><p className="text-sm font-medium whitespace-nowrap">Usuario activo</p><RoleBadge role={role} /></div>)}</div><button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-center px-4'} py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors text-xs font-bold`} title={isSidebarCollapsed ? "Cerrar sesión" : ""}><LogOut size={14} className={`${isSidebarCollapsed ? '' : 'mr-2'}`} /> {!isSidebarCollapsed && "Cerrar sesión"}</button></div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start"><div><div className="flex items-center space-x-2"><div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center"><Ship size={20} className="text-white" /></div><span className="text-lg font-bold tracking-tight">AduanaSoft</span></div></div><button onClick={() => setIsMobileMenuOpen(false)} className="p-1"><X size={28} /></button></div>
            <nav className="flex-1 p-6">
                <NavItem id="dashboard" icon={LayoutDashboard} label="Visión general" />
                <NavItem id="list" icon={TableIcon} label="Sábana operativa" />
                <NavItem id="capture" icon={Plus} label="Alta de contenedores" />
                
                {/* TAMBIÉN AGREGADO AL MENÚ MÓVIL */}
                <NavItem id="closure" icon={ClipboardCheck} label="Cierre de cuenta" />

                {(role === 'admin' || role === 'ejecutivo') && (<NavItem id="quotes" icon={Calculator} label="Generador de cotizaciones" />)}
                <div className="mt-8 pt-6 border-t border-slate-700"><div className="flex items-center space-x-3 mb-6"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold"><User size={16} /></div><div className="text-sm">Rol actual: <RoleBadge role={role} /></div></div><button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg font-bold"><LogOut size={18} className="mr-2" /> Cerrar sesión</button></div>
            </nav>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10"><button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded hover:bg-slate-100"><Menu className="text-slate-800" /></button><div className="text-xl font-bold text-slate-800 flex items-center gap-2">{activeTab === 'dashboard' && 'Visión general'}{activeTab === 'list' && 'Gestión y pagos'}{activeTab === 'capture' && 'Alta de documentos'}{activeTab === 'quotes' && 'Generador de cotizaciones'}{activeTab === 'closure' && 'Cierre de Cuenta'}<span className="hidden md:inline-flex ml-4 transform scale-90 origin-left"><RoleBadge role={role} /></span></div><div className="flex items-center space-x-4"><div className="hidden lg:flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium"><DollarSign size={14} className="mr-1"/> USD: $20.54</div></div></header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          
          {activeTab === 'dashboard' && <DashboardView data={data} />}
          {activeTab === 'capture' && <CaptureForm onSave={handleSave} onCancel={() => setActiveTab('dashboard')} existingData={data} role={role} />}
          
          {activeTab === 'list' && (
            <ListView 
                data={data} 
                onPayItem={handlePayItem} 
                onPayAll={handlePayAll} 
                onCloseOperation={handleCloseOperation} 
                onInitiatePayment={initiatePayment}
                role={role} 
                onEdit={handleEditClick} 
            />
          )}

          {/* AQUÍ SE RENDERIZA EL NUEVO MÓDULO */}
          {activeTab === 'closure' && <AccountClosure data={data} />}

          {activeTab === 'quotes' && <QuoteGenerator role={role} />}
        </div>
      </main>
    </div>
  );
}