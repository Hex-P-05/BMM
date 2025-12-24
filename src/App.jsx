import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; 
import { 
  LayoutDashboard, FileText, Table as TableIcon, AlertTriangle, CheckCircle, 
  Clock, Ship, DollarSign, Plus, Search, Menu, X, User, Edit, Lock, 
  TrendingUp, TrendingDown, Activity, AlertCircle, Calculator, Trash2, 
  Download, Printer, Package, MapPin, Key, LogOut, Check, 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ShieldAlert, Eye, EyeOff, 
  Anchor // <--- ¡ESTE ES EL CULPABLE! TIENE QUE ESTAR AQUÍ
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
  
  // NUEVOS ESTADOS PARA CIERRE DE OPERACIÓN
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [itemToClose, setItemToClose] = useState(null);

  // --- 4. MANEJADORES DE AUTENTICACIÓN ---
  const handleLogin = (userRole) => {
    setRole(userRole);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  // --- 5. LÓGICA DE DATOS (CRUD) ---
  const handleSave = (newItem) => {
    const itemWithId = { ...newItem, id: Date.now(), statusETA: calculateStatus(newItem.eta) };
    setData([itemWithId, ...data]);
    setActiveTab('list');
  };

  const handleSaveEdit = (editedItem) => {
    const newData = data.map(item => {
      if (item.id === editedItem.id) {
        // Actualizamos datos y aumentamos contador de ediciones
        return { 
            ...editedItem, 
            statusETA: calculateStatus(editedItem.eta), // Recalcular estatus ETA
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

  // --- 6. LÓGICA DE PAGOS (NUEVA Y GRANULAR) ---

  // A) Iniciar pago global (Modal antiguo, opcional si usas el botón "Pagar Todo")
  const initiatePayment = (id) => { 
      const item = data.find(i => i.id === id); 
      if (item) { setPaymentConfirmation({ isOpen: true, item }); } 
  };

  // B) Ejecutar pago global desde el modal de confirmación
  const executePayment = () => {
    const { item } = paymentConfirmation;
    if (!item) return;
    handlePayAll(item.id); // Reutilizamos la lógica de pagar todo
    setPaymentConfirmation({ isOpen: false, item: null }); 
  };

  // C) Pagar un concepto individual (Botones pequeños en la sábana)
  const handlePayItem = (id, costKey) => {
      const newData = data.map(d => {
        if (d.id === id) {
          const currentFlags = d.paidFlags || {};
          return { 
              ...d, 
              paidFlags: { ...currentFlags, [costKey]: true } 
          };
        }
        return d;
      });
      setData(newData);
  };

  // D) Pagar TODO el contenedor (Botón verde "Pagar Todo")
  const handlePayAll = (id) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const newData = data.map(d => {
        if (d.id === id) {
          // Calculamos retraso si aplica
          const diffDays = getDaysDiff(d.eta);
          let delay = 0; 
          if (diffDays < 0) { delay = Math.abs(diffDays); }

          return { 
              ...d, 
              payment: 'paid', 
              paymentDate: todayStr, 
              paymentDelay: delay,
              // Marcamos todas las banderas individuales como true también
              paidFlags: {
                  costDemoras: true, costAlmacenaje: true, costOperativos: true, costPortuarios: true,
                  costApoyo: true, costImpuestos: true, costLiberacion: true, costTransporte: true
              }
          };
        }
        return d;
      });
      setData(newData);
  };

  // --- 7. LÓGICA DE CIERRE DE OPERACIÓN (NUEVA) ---
  
  const handleCloseOperation = (item) => {
      // Regla: No cerrar si no está pagado todo (Opcional, aquí pregunto)
      if (item.payment !== 'paid') {
         const confirm = window.confirm("⚠️ PAGOS PENDIENTES\n\nEste contenedor aún tiene saldos pendientes. Al cerrarlo se marcará todo como PAGADO automáticamente.\n\n¿Deseas continuar?");
         if(!confirm) return;
         
         // Si dice que sí, pagamos todo primero en memoria temporal para el recibo
         const itemPagado = { ...item, payment: 'paid' };
         handlePayAll(item.id); // Actualizamos estado real
         setItemToClose(itemPagado); // Pasamos el item ya "pagado" al modal
      } else {
         setItemToClose(item);
      }
      setCloseModalOpen(true);
  };

  const confirmClose = () => {
       const newData = data.map(d => {
         if (d.id === itemToClose.id) {
           return { ...d, status: 'closed' }; // Estatus especial que bloquea todo
         }
         return d;
       });
       setData(newData);
       setCloseModalOpen(false);
       setItemToClose(null);
  };

  // --- 8. RENDERIZADO DE MENÚ LATERAL (HELPER) ---
  const NavItem = ({ id, icon: Icon, label }) => {
    if (role === 'pagos' && id === 'capture') return null;
    return (
      <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} 
        className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-300 ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isSidebarCollapsed ? 'justify-center' : ''}`} 
        title={isSidebarCollapsed ? label : ''}
      >
        <Icon size={20} className={`${isSidebarCollapsed ? '' : 'mr-3'}`} />
        {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
      </button>
    );
  };

  // --- 9. CONDICIONAL DE LOGIN ---
  if (!isLoggedIn) { return <LoginView onLogin={handleLogin} />; }

  // AQUI SIGUE EL RETURN...

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 relative">
      <PaymentModal 
        isOpen={paymentConfirmation.isOpen} 
        item={paymentConfirmation.item} 
        onClose={() => setPaymentConfirmation({ isOpen: false, item: null })} 
        onConfirm={executePayment} 
      />
      
      <EditModal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        onSave={handleSaveEdit} 
        item={editingItem} 
        role={role} 
      />

      {/* --- AGREGAR ESTE MODAL DE CIERRE AQUÍ --- */}
      <CloseModal 
        isOpen={closeModalOpen} 
        onClose={confirmClose} 
        item={itemToClose} 
      />

      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out relative`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-9 bg-blue-600 text-white p-1 rounded-full shadow-lg border-2 border-slate-100 hover:bg-blue-700 transition-colors z-20">
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"><Ship size={20} className="text-white" /></div>
          {!isSidebarCollapsed && (<div className="overflow-hidden"><span className="text-lg font-bold tracking-tight whitespace-nowrap">AduanaSoft</span><p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">v2.2 Production</p></div>)}
        </div>
        <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          {!isSidebarCollapsed && <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3 animate-fade-in">Menú</p>}
          <NavItem id="dashboard" icon={LayoutDashboard} label="Visión general" />
          <NavItem id="list" icon={TableIcon} label="Sábana operativa" />
          <NavItem id="capture" icon={Plus} label="Alta de contenedores" />
          {(role === 'admin' || role === 'ejecutivo') && (
            <div className={`mt-6 ${isSidebarCollapsed ? 'border-t border-slate-800 pt-6' : ''}`}>
              {!isSidebarCollapsed && <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3 animate-fade-in">Comercial</p>}
              <NavItem id="quotes" icon={Calculator} label="Generador de cotizaciones" />
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-4`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0"><User size={20} /></div>
            {!isSidebarCollapsed && (<div className="overflow-hidden"><p className="text-sm font-medium whitespace-nowrap">Usuario activo</p><RoleBadge role={role} /></div>)}
          </div>
          <button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-center px-4'} py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors text-xs font-bold`} title={isSidebarCollapsed ? "Cerrar sesión" : ""}>
            <LogOut size={14} className={`${isSidebarCollapsed ? '' : 'mr-2'}`} /> {!isSidebarCollapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col animate-fade-in">
           {/* ... (código del menú móvil sigue igual) ... */}
           {/* Por brevedad asumo que copias el menú móvil que ya tenías o quieres que te lo repita? */}
           {/* Si lo necesitas completo dime, pero aquí lo importante es el MAIN abajo */}
           <div className="p-6 border-b border-slate-800 flex justify-between items-start"><div><div className="flex items-center space-x-2"><div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center"><Ship size={20} className="text-white" /></div><span className="text-lg font-bold tracking-tight">AduanaSoft</span></div></div><button onClick={() => setIsMobileMenuOpen(false)} className="p-1"><X size={28} /></button></div><nav className="flex-1 p-6"><NavItem id="dashboard" icon={LayoutDashboard} label="Visión general" /><NavItem id="list" icon={TableIcon} label="Sábana operativa" /><NavItem id="capture" icon={Plus} label="Alta de contenedores" />{(role === 'admin' || role === 'ejecutivo') && (<NavItem id="quotes" icon={Calculator} label="Generador de cotizaciones" />)}<div className="mt-8 pt-6 border-t border-slate-700"><div className="flex items-center space-x-3 mb-6"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold"><User size={16} /></div><div className="text-sm">Rol actual: <RoleBadge role={role} /></div></div><button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg font-bold"><LogOut size={18} className="mr-2" /> Cerrar sesión</button></div></nav>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded hover:bg-slate-100"><Menu className="text-slate-800" /></button>
          <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {activeTab === 'dashboard' && 'Visión general'}
            {activeTab === 'list' && 'Gestión y pagos'}
            {activeTab === 'capture' && 'Alta de documentos'}
            {activeTab === 'quotes' && 'Generador de cotizaciones'}
            <span className="hidden md:inline-flex ml-4 transform scale-90 origin-left"><RoleBadge role={role} /></span>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden lg:flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium"><DollarSign size={14} className="mr-1"/> USD: $20.54</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <DashboardView data={data} />}
          {activeTab === 'capture' && <CaptureForm onSave={handleSave} onCancel={() => setActiveTab('dashboard')} existingData={data} role={role} />}
          
          {/* --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE: PASAR LAS PROPS NUEVAS --- */}
          {activeTab === 'list' && (
            <ListView 
              data={data} 
              onPayItem={handlePayItem}        // <--- NUEVO
              onPayAll={handlePayAll}          // <--- NUEVO
              onCloseOperation={handleCloseOperation} // <--- NUEVO
              onInitiatePayment={initiatePayment} 
              role={role} 
              onEdit={handleEditClick} 
            />
          )}
          
          {activeTab === 'quotes' && <QuoteGenerator role={role} />}
        </div>
      </main>
    </div>
  );
}