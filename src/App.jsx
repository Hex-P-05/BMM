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
  User,
  Shield,
  Edit,
  Lock,
  Check,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  Calculator, 
  Trash2,     
  Download,   
  Printer,
  Package,
  MapPin
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
  AreaChart,
  Area
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

// --- COMPONENTE MODAL DE SEGURIDAD ---
const PaymentModal = ({ isOpen, onClose, onConfirm, item }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all scale-100">
        <div className="bg-yellow-50 p-6 border-b border-yellow-100 flex items-start space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full flex-shrink-0">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">¿Confirmar Pago?</h3>
            <p className="text-sm text-slate-600 mt-1">
              Estás a punto de registrar un pago en el sistema. Asegúrate de haber realizado la transferencia bancaria primero.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Monto a Pagar</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">MXN</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">${item.amount.toLocaleString()}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Beneficiario:</span>
              <span className="font-medium text-slate-800">{item.provider}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-medium text-slate-800">{item.client}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Referencia:</span>
              <span className="font-mono font-medium text-slate-800 bg-slate-100 px-1 rounded">{item.concept}</span>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex space-x-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex justify-center items-center">
            <CheckCircle size={20} className="mr-2" /> Confirmar Transferencia
          </button>
        </div>
      </div>
    </div>
  );
};

// --- NUEVO COMPONENTE: GENERADOR DE COTIZACIONES ---
// --- COMPONENTE: GENERADOR DE COTIZACIONES (VERSIÓN PDF MEMBRETADO) ---
const QuoteGenerator = ({ role }) => {
  if (role === 'pagos') return <div className="p-10 text-center text-red-500 font-bold">Acceso Denegado: Solo Admin y Revalidaciones pueden cotizar.</div>;

  // 1. ESTADO: Agregamos datos del CLIENTE para el membrete
  const [quoteData, setQuoteData] = useState({
    // Datos del Cliente (Para el membrete)
    clienteNombre: '',
    clienteReferencia: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    
    // Datos de la Tabla (La imagen que mandaste)
    bl: '',
    contenedor: '',
    eta: '',
    fechaEntrega: '',
    puerto: 'MANZANILLO',
    terminal: 'CONTECON',
    diasDemoras: 0,
    diasAlmacenaje: 0,
    naviera: '',
    // Costos
    costoDemoras: 0,
    costoAlmacenaje: 0,
    costosOperativos: 0,
    apoyo: 0,
    impuestos: 0,
    liberacion: 0,
    transporte: 0,
    currency: 'MXN'
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setQuoteData({
      ...quoteData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  // Cálculo del Subtotal
  const subtotal = 
    quoteData.costoDemoras + 
    quoteData.costoAlmacenaje + 
    quoteData.costosOperativos + 
    quoteData.apoyo + 
    quoteData.impuestos + 
    quoteData.liberacion + 
    quoteData.transporte;

  // Filas de la tabla (Idénticas a tu imagen)
  const tableRows = [
    { label: '提货单// BL', value: quoteData.bl, isMoney: false },
    { label: '容器 // CONTENEDOR', value: quoteData.contenedor, isMoney: false },
    { label: '预计到达时间// ETA', value: formatDate(quoteData.eta), isMoney: false },
    { label: '交货日期// FECHA DE ENTREGA', value: formatDate(quoteData.fechaEntrega), isMoney: false, className: 'bg-green-100 print:bg-green-100' }, // print:bg asegura que el color salga en el PDF
    { label: '卸货港 // PUERTO', value: quoteData.puerto, isMoney: false },
    { label: '码头 // TERMINAL', value: quoteData.terminal, isMoney: false },
    { label: '延誤數日// DIAS DE DEMORAS', value: quoteData.diasDemoras, isMoney: false },
    { label: '储存天數 // DIAS DE ALMACENAJE', value: quoteData.diasAlmacenaje, isMoney: false },
    { label: '航运公司// NAVIERA', value: quoteData.naviera, isMoney: false },
    { label: '延误// DEMORAS', value: quoteData.costoDemoras, isMoney: true },
    { label: '贮存// ALMACENAJE', value: quoteData.costoAlmacenaje, isMoney: true },
    { label: '營運成本// COSTOS OPERATIVOS', value: quoteData.costosOperativos, isMoney: true },
    { label: '支援// APOYO', value: quoteData.apoyo, isMoney: true, labelClass: 'text-red-500 font-bold' },
    { label: '税收// IMPUESTOS', value: quoteData.impuestos, isMoney: true },
    { label: '摆脱遗弃// LIBERACION DE ABANDONO', value: quoteData.liberacion, isMoney: true },
    { label: '運輸// TRANSPORTE', value: quoteData.transporte, isMoney: true },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in pb-8">
      
      {/* --- ESTILOS DE IMPRESIÓN (EL TRUCO MÁGICO) --- */}
      <style>
        {`
          @media print {
            /* Ocultar todo lo que NO sea la hoja de cotización */
            body * { visibility: hidden; }
            .printable-area, .printable-area * { visibility: visible; }
            .printable-area { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              margin: 0; 
              padding: 0;
              box-shadow: none;
              border: none;
            }
            /* Ocultar botones y scrollbars */
            .no-print { display: none !important; }
            /* Forzar colores de fondo (para que salga el verde y amarillo) */
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>

      {/* --- PANEL IZQUIERDO: FORMULARIO (NO SE IMPRIME) --- */}
      <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto no-print">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center border-b pb-2">
          <Edit size={18} className="mr-2 text-blue-600"/> Editar Cotización
        </h3>

        <div className="space-y-4">
          
          {/* 1. Datos del Cliente (Para el Membrete) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
             <h4 className="text-xs font-bold text-blue-800 uppercase mb-3">Datos del Encabezado</h4>
             <div className="space-y-2">
                <input name="clienteNombre" placeholder="Razón Social Cliente" value={quoteData.clienteNombre} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
                <div className="grid grid-cols-2 gap-2">
                   <input name="clienteReferencia" placeholder="Referencia Cliente" value={quoteData.clienteReferencia} onChange={handleChange} className="p-2 border rounded text-sm" />
                   <input type="date" name="fechaEmision" value={quoteData.fechaEmision} onChange={handleChange} className="p-2 border rounded text-sm" />
                </div>
             </div>
          </div>

          {/* 2. Datos Operativos (Tabla) */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Datos Operativos</h4>
            <div className="grid grid-cols-2 gap-3">
              <input name="bl" placeholder="BL Master" value={quoteData.bl} onChange={handleChange} className="p-2 border rounded text-sm uppercase" />
              <input name="contenedor" placeholder="Contenedor" value={quoteData.contenedor} onChange={handleChange} className="p-2 border rounded text-sm uppercase" />
              
              <div className="col-span-1">
                <label className="text-[10px] text-slate-400 font-bold">ETA</label>
                <input type="date" name="eta" value={quoteData.eta} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] text-green-600 font-bold">ENTREGA</label>
                <input type="date" name="fechaEntrega" value={quoteData.fechaEntrega} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-green-50 border-green-200" />
              </div>

              <input name="puerto" placeholder="Puerto" value={quoteData.puerto} onChange={handleChange} className="p-2 border rounded text-sm" />
              <input name="terminal" placeholder="Terminal" value={quoteData.terminal} onChange={handleChange} className="p-2 border rounded text-sm" />
              
              <div className="col-span-2">
                <input name="naviera" placeholder="Naviera" value={quoteData.naviera} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
              </div>

              <div className="relative">
                 <span className="absolute right-2 top-2 text-[10px] text-slate-400">Días</span>
                 <input type="number" name="diasDemoras" placeholder="Días Demoras" value={quoteData.diasDemoras} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
              </div>
              <div className="relative">
                 <span className="absolute right-2 top-2 text-[10px] text-slate-400">Días</span>
                 <input type="number" name="diasAlmacenaje" placeholder="Días Almacenaje" value={quoteData.diasAlmacenaje} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
              </div>
            </div>
          </div>

          {/* 3. Costos */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex justify-between items-center mb-3">
               <h4 className="text-xs font-bold text-slate-500 uppercase">Costos</h4>
               <select name="currency" value={quoteData.currency} onChange={handleChange} className="text-xs p-1 border rounded font-bold text-blue-600 bg-white"><option>MXN</option><option>USD</option></select>
            </div>
            
            <div className="space-y-2">
              {/* Mapeamos solo los campos de dinero */}
              {[
                { k: 'costoDemoras', l: 'Demoras' },
                { k: 'costoAlmacenaje', l: 'Almacenaje' },
                { k: 'costosOperativos', l: 'Costos Operativos' },
                { k: 'apoyo', l: 'Apoyo' },
                { k: 'impuestos', l: 'Impuestos' },
                { k: 'liberacion', l: 'Liberación Abandono' },
                { k: 'transporte', l: 'Transporte' },
              ].map((field) => (
                <div key={field.k} className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">{field.l}</label>
                  <div className="relative w-1/2">
                    <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                    <input 
                      type="number" 
                      name={field.k} 
                      value={quoteData[field.k]} 
                      onChange={handleChange} 
                      className="w-full p-1 pl-4 border rounded text-sm text-right font-mono focus:border-blue-500 outline-none" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- PANEL DERECHO: VISTA PREVIA & PDF (ÁREA IMPRIMIBLE) --- */}
      <div className="lg:w-2/3 bg-slate-200 rounded-xl p-8 overflow-y-auto flex flex-col items-center shadow-inner relative">
        
        {/* Botón Flotante para Descargar */}
        <div className="absolute top-4 right-4 no-print z-10">
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold flex items-center hover:bg-blue-700 transition-transform transform hover:-translate-y-1"
          >
            <Printer size={16} className="mr-2" /> Guardar como PDF
          </button>
        </div>

        {/* --- HOJA A4 MEMBRETADA (printable-area) --- */}
        {/* Nota: max-w-[21cm] simula el ancho real de una hoja carta/A4 */}
        <div className="printable-area bg-white w-full max-w-[21cm] min-h-[29.7cm] p-12 shadow-2xl text-slate-900 font-sans border border-slate-300 relative flex flex-col justify-between">
          
          <div>
            {/* 1. MEMBRETE / ENCABEZADO */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
              <div className="flex items-center">
                {/* Logo Simulado */}
                <div className="w-16 h-16 bg-blue-900 text-white rounded flex items-center justify-center mr-4">
                  <Ship size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">AduanaSoft</h1>
                  <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Logística & Despacho</p>
                  <p className="text-[10px] text-slate-400 mt-1">Av. Puerto Interior 55, Manzanillo, Colima.<br/>RFC: ADU20250101-XM3</p>
                </div>
              </div>
              
              <div className="text-right">
                <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Cotización</h2>
                <p className="text-sm font-bold text-slate-800 mt-1">Folio: <span className="text-red-600">QT-{new Date().getFullYear()}-{Math.floor(Math.random() * 1000)}</span></p>
                <p className="text-xs text-slate-500 mt-1">Fecha: {formatDate(quoteData.fechaEmision)}</p>
              </div>
            </div>

            {/* 2. DATOS DEL CLIENTE */}
            <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Cliente / Razón Social</span>
                    <span className="font-bold text-slate-800 uppercase">{quoteData.clienteNombre || 'CLIENTE MOSTRADOR'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Referencia</span>
                    <span className="font-bold text-slate-800 uppercase">{quoteData.clienteReferencia || 'S/N'}</span>
                  </div>
               </div>
            </div>

            {/* 3. TABLA PRINCIPAL (ESTILO IMAGEN) */}
            <div className="border-2 border-black">
              {/* Título Tabla */}
              <div className="bg-blue-100 border-b border-black py-2 text-center print:bg-blue-100">
                <h2 className="text-lg font-bold text-red-600 tracking-wide uppercase">价格 // COTIZACION</h2>
              </div>

              {/* Cuerpo Tabla */}
              {tableRows.map((row, index) => (
                <div key={index} className={`flex border-b border-black last:border-0 text-sm ${row.className || ''}`}>
                  <div className="w-1/2 border-r border-black p-2 flex items-center justify-end text-right bg-white">
                    <span className={`font-medium uppercase text-xs ${row.labelClass || 'text-black'}`}>
                      {row.label}
                    </span>
                  </div>
                  <div className="w-1/2 p-2 flex items-center justify-center bg-white">
                    <span className="font-bold text-slate-800">
                      {row.isMoney && <span className="text-[10px] mr-1 text-slate-500 font-normal">{quoteData.currency}</span>}
                      {row.isMoney 
                        ? `$${row.value.toLocaleString(undefined, {minimumFractionDigits: 2})}` 
                        : (row.value || '-')}
                    </span>
                  </div>
                </div>
              ))}

              {/* Subtotal */}
              <div className="flex border-t-2 border-black bg-yellow-300 print:bg-yellow-300">
                <div className="w-1/2 border-r border-black p-2 text-right">
                   <span className="text-sm font-bold">SUBTOTAL</span>
                </div>
                <div className="w-1/2 p-2 text-center">
                   <span className="text-lg font-bold">
                      <span className="text-xs mr-1 font-normal">{quoteData.currency}</span>
                      ${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                   </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. FOOTER / PIE DE PÁGINA */}
          <div className="mt-8 border-t border-slate-300 pt-4">
             <div className="flex justify-between items-end text-[10px] text-slate-400">
                <div className="max-w-[60%]">
                   <p className="font-bold uppercase text-slate-600 mb-1">Términos y Condiciones</p>
                   <p>1. Esta cotización tiene una vigencia de 7 días naturales.</p>
                   <p>2. Precios sujetos a cambios sin previo aviso por parte de la naviera.</p>
                   <p>3. El pago debe realizarse en la moneda indicada o al tipo de cambio FIX del día.</p>
                </div>
                <div className="text-right">
                   <p className="mb-4">__________________________<br/>Firma de Conformidad</p>
                   <p>AduanaSoft v2.2 | Página 1 de 1</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Contenedores Activos" value={total} icon={Ship} colorClass="bg-blue-100 text-blue-600" trend="up" trendValue="+12%" subtext="vs mes pasado" />
        <KPICard title="Alertas (Próximos)" value={warning} icon={Clock} colorClass="bg-yellow-100 text-yellow-600" trend="down" trendValue="-5%" subtext="mejoría en tiempos" />
        <KPICard title="Críticos (Vencidos)" value={danger} icon={AlertTriangle} colorClass="bg-red-100 text-red-600" trend="up" trendValue="+2" subtext="requiere atención" />
        <KPICard title="Cuentas por Cobrar" value={`$${(pendingMoney/1000).toFixed(1)}k`} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-600" trend="up" trendValue="+8%" subtext="flujo de caja proyectado" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div><h3 className="text-lg font-bold text-slate-800">Dinámica Semanal</h3><p className="text-xs text-slate-400">Volumen de operaciones y montos</p></div>
            <select className="bg-slate-50 border border-slate-200 text-xs rounded-md p-1 outline-none text-slate-600"><option>Últimos 7 días</option><option>Este Mes</option></select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs><linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="monto" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorOps)" name="Monto ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Activity size={18} className="mr-2 text-blue-500"/> Actividad Reciente</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3 flex-shrink-0 text-xs font-bold">{act.user.charAt(0)}</div>
                <div><p className="text-sm font-medium text-slate-700">{act.action}</p><p className="text-xs text-slate-400">{act.details}</p><p className="text-[10px] text-slate-300 mt-1">{act.time}</p></div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 text-xs text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">Ver todo el historial</button>
        </div>

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
            <div><h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Salud de la Operación</h3><p className="text-2xl font-bold text-slate-800">92% <span className="text-sm font-normal text-slate-400">Eficiencia</span></p></div>
            <div className="h-48 w-full max-w-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    <Cell fill={COLORS.ok} /><Cell fill={COLORS.warning} /><Cell fill={COLORS.danger} />
                  </Pie>
                  <Tooltip /><Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- DATOS MOCK DE NAVIERAS (Pon esto arriba del componente o en un archivo aparte) ---
const NAVIERAS_DB = [
  { id: '1', nombre: 'HAPAG-LLOYD', rfc: 'HPL990202ABC', direccion: 'Calle Hamburgo 15, Juárez, CDMX' },
  { id: '2', nombre: 'MAERSK MEXICO', rfc: 'MAE980101XYZ', direccion: 'Av. Paseo de la Reforma 222, CDMX' },
  { id: '3', nombre: 'COSCO SHIPPING', rfc: 'COS000303QWE', direccion: 'Blvd. Manuel Ávila Camacho 40, Edo Mex' },
  { id: '4', nombre: 'MSC MEXICO', rfc: 'MSC112233R55', direccion: 'Av. Ejército Nacional 843, CDMX' },
  { id: '5', nombre: 'ONE (OCEAN NETWORK)', rfc: 'ONE223344T88', direccion: 'Insurgentes Sur 1458, CDMX' },
];

const CaptureForm = ({ onSave, onCancel, existingData, role }) => {
  if (role === 'pagos') return <div className="p-10 text-center text-red-500 font-bold">Acceso Denegado: Rol no autorizado para capturas.</div>;

  // 1. Agregamos rfc y dirección al estado inicial
  const [formData, setFormData] = useState({
    bl: '', 
    provider: '', 
    rfc: '',
    address: '',
    client: '', 
    reason: 'GARANTÍA', 
    container: '', 
    eta: '', 
    amount: '',
    currency: 'MXN' // <--- AGREGAMOS ESTO (Por defecto Pesos)
  });
  
  const [generatedConcept, setGeneratedConcept] = useState('');
  const [clientConsecutive, setClientConsecutive] = useState(1);

  // Tu useEffect original (lo dejé intacto para que siga generando el concepto)
  useEffect(() => {
    const code = formData.client ? formData.client.substring(0, 3).toUpperCase() : 'XXX';
    const matches = existingData.filter(item => item.client.trim().toLowerCase() === formData.client.trim().toLowerCase());
    const nextNum = matches.length + 1;
    setClientConsecutive(nextNum);
    const providerStr = formData.provider ? formData.provider.toUpperCase() : 'EMP';
    const reasonStr = formData.reason.toUpperCase();
    setGeneratedConcept(`${providerStr} ${code} ${nextNum} ${reasonStr}`);
  }, [formData.provider, formData.client, formData.reason, existingData]);

  // --- LÓGICA NUEVA: MANEJO DE NAVIERA ---
  const handleNavieraChange = (e) => {
    const nombreSeleccionado = e.target.value;
    
    // Buscamos si existe en nuestra "Base de Datos"
    const naviera = NAVIERAS_DB.find(n => n.nombre === nombreSeleccionado);

    if (naviera) {
      // Si existe, autocompletamos RFC y Dirección
      setFormData({
        ...formData,
        provider: naviera.nombre,
        rfc: naviera.rfc,
        address: naviera.direccion
      });
    } else {
      // Si eligió "Otra" o limpió, solo actualizamos el nombre y limpiamos lo demás
      setFormData({
        ...formData,
        provider: nombreSeleccionado,
        rfc: '',
        address: ''
      });
    }
  };

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
              <FileText className="mr-2 text-blue-600" /> Nueva Captura de Ticket
            </h2>
            <p className="text-slate-500 text-sm">Los datos fiscales se autocompletarán al seleccionar naviera.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* SECCIÓN 1: DATOS FISCALES Y CONCEPTO */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
              <Ship size={14} className="mr-1"/> Datos de la Naviera & Concepto
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* SELECTOR DE NAVIERA (MEJORADO) */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Naviera / Proveedor</label>
                <select 
                  required 
                  name="provider" 
                  className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  onChange={handleNavieraChange}
                  value={formData.provider}
                >
                  <option value="">-- Selecciona Naviera --</option>
                  {NAVIERAS_DB.map(nav => (
                    <option key={nav.id} value={nav.nombre}>{nav.nombre}</option>
                  ))}
                  <option value="OTRA">OTRA (Manual)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Cliente</label>
                <input required name="client" placeholder="Nombre del Cliente" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
              </div>
            </div>

            {/* NUEVOS CAMPOS: RFC Y DIRECCIÓN (Autocompletables pero Editables) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
               <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">RFC (Emisor)</label>
                  <input 
                    name="rfc" 
                    value={formData.rfc} 
                    onChange={handleChange} 
                    placeholder="Autocompletado..." 
                    className="w-full p-2 border rounded text-sm bg-white font-mono text-slate-600 focus:border-blue-400 outline-none" 
                  />
               </div>
               <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Dirección Fiscal</label>
                  <input 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    placeholder="Autocompletado..." 
                    className="w-full p-2 border rounded text-sm bg-white text-slate-600 focus:border-blue-400 outline-none" 
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Este input ahora es solo visual si eligieron "OTRA", o podrías ocultarlo. 
                   Por ahora dejamos el selector de motivo */}
               <div className="md:col-span-3">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Motivo del Ticket</label>
                  <select name="reason" className="w-full p-2 border rounded text-sm bg-white outline-none" onChange={handleChange}>
                    <option>GARANTÍA</option><option>FLETE</option><option>ALMACENAJE</option><option>DEMORAS</option>
                  </select>
               </div>
            </div>

            <div className="mt-3 p-3 bg-slate-800 text-green-400 font-mono text-sm rounded flex justify-between items-center shadow-inner">
              <span className="flex items-center"><FileText size={14} className="mr-2"/> {generatedConcept}</span>
              <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">Consecutivo #{clientConsecutive}</span>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS OPERATIVOS (Igual que antes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="text-sm font-bold text-slate-700">BL (Master)</label>
              <input required name="bl" className="w-full p-2 border rounded uppercase font-mono focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} placeholder="HLCU..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Contenedor</label>
              <input required name="container" className="w-full p-2 border rounded uppercase focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} placeholder="MSKU..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Fecha ETA</label>
              <input required name="eta" type="date" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
            </div>
            {/* --- INICIO DEL CAMBIO: MONTO CON DIVISA --- */}
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Monto y Divisa</label>
              <div className="flex space-x-2">
                
                {/* 1. Selector de Moneda */}
                <select 
                  name="currency" 
                  value={formData.currency} 
                  onChange={handleChange}
                  className="w-1/3 p-2 border rounded font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="MXN">MXN (Pesos)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>

                {/* 2. Input del Monto (Ajustado) */}
                <div className="relative w-2/3">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input 
                    required 
                    name="amount" 
                    type="number" 
                    className="w-full pl-6 p-2 border rounded font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                    onChange={handleChange} 
                    placeholder="0.00" 
                  />
                </div>
                
              </div>
            </div>
            {/* --- FIN DEL CAMBIO --- */}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center shadow-lg shadow-blue-200 font-bold transition-all transform hover:-translate-y-0.5">
              <Lock size={16} className="mr-2" /> Guardar Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ListView = ({ data, onInitiatePayment, role, onEdit }) => {
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
                    <StatusBadge item={item} />
                  </td>
                  <td className="p-4 text-right font-medium">
                    {/* Muestra la moneda en pequeño y gris antes del monto */}
                    <span className="text-[10px] text-slate-400 mr-1 font-bold align-top">
                      {item.currency || 'MXN'}
                    </span>
                    ${item.amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-center text-xs text-slate-500">
                    {item.payment === 'paid' ? formatDate(item.paymentDate) : '-'}
                  </td>
                  <td className="p-4 flex justify-center space-x-2">
                    {canPay && item.payment === 'pending' && (
                      <button 
                        onClick={() => onInitiatePayment(item.id)} // Llama a la función que abre el modal
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

  // --- ESTADO DEL MODAL DE CONFIRMACIÓN ---
  const [paymentConfirmation, setPaymentConfirmation] = useState({ isOpen: false, item: null });

  const handleSave = (newItem) => {
    const itemWithId = { ...newItem, id: Date.now() };
    setData([itemWithId, ...data]);
    setActiveTab('list');
  };

  // Paso 1: Solicitud de pago (Abre el modal)
  const initiatePayment = (id) => {
    const item = data.find(i => i.id === id);
    if (item) {
      setPaymentConfirmation({ isOpen: true, item });
    }
  };

  // Paso 2: Ejecución Real (Al confirmar en el modal)
  const executePayment = () => {
    const { item } = paymentConfirmation;
    if (!item) return;

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    const updatedData = data.map(d => {
      if (d.id === item.id) {
        // --- LÓGICA DE DÍAS DE RETRASO ---
        const [year, month, day] = d.eta.split('-').map(Number);
        const etaDate = new Date(year, month - 1, day);
        const diffTime = etaDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        let delay = 0;
        if (diffDays < 0) {
           delay = Math.abs(diffDays);
        }

        return { 
          ...d, 
          payment: 'paid', 
          paymentDate: todayStr,
          paymentDelay: delay 
        };
      }
      return d;
    });

    setData(updatedData);
    setPaymentConfirmation({ isOpen: false, item: null }); // Cerrar modal y limpiar
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
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 relative">
      
      {/* MODAL DE CONFIRMACIÓN (Global) */}
      <PaymentModal 
        isOpen={paymentConfirmation.isOpen}
        item={paymentConfirmation.item}
        onClose={() => setPaymentConfirmation({ isOpen: false, item: null })}
        onConfirm={executePayment}
      />

      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Ship size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">AduanaSoft</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">v2.2 Quotes Module</p>
        </div>
        <nav className="flex-1 p-4">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3">Menú</p>
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="list" icon={TableIcon} label="Sábana Operativa" />
          <NavItem id="capture" icon={Plus} label="Capturar Ticket" />
          
          {/* NUEVO ITEM: COTIZACIONES (Solo Admin y Ejecutivo) */}
          {(role === 'admin' || role === 'ejecutivo') && (
            <div className="mt-6">
              <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-3">Comercial</p>
              <NavItem id="quotes" icon={Calculator} label="Cotizaciones" />
            </div>
          )}
        </nav>
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Simular Rol:</label>
          <select 
            value={role} 
            onChange={(e) => {
              setRole(e.target.value);
              if (e.target.value === 'pagos' && (activeTab === 'capture' || activeTab === 'quotes')) {
                setActiveTab('dashboard');
              }
            }}
            className="w-full bg-slate-900 text-white text-sm p-2 rounded border border-slate-600 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="admin">Admin (Total)</option>
            <option value="ejecutivo">Ejecutivo (Revalidaciones)</option>
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
                <p className="text-xs text-slate-500 mt-2">v2.2 Quotes Module</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1"><X size={28} /></button>
           </div>
           <nav className="flex-1 p-6">
              <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem id="list" icon={TableIcon} label="Sábana Operativa" />
              <NavItem id="capture" icon={Plus} label="Capturar Ticket" />
              {(role === 'admin' || role === 'ejecutivo') && (
                <NavItem id="quotes" icon={Calculator} label="Cotizaciones" />
              )}
              
              <div className="mt-8 pt-6 border-t border-slate-700">
                <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Simular Rol (Demo Móvil):</label>
                <select 
                  value={role} 
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value === 'pagos' && (activeTab === 'capture' || activeTab === 'quotes')) {
                      setActiveTab('dashboard');
                    }
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
            {activeTab === 'quotes' && 'Generador de Cotizaciones'}
            <span className="hidden md:inline-flex ml-4 transform scale-90 origin-left"><RoleBadge role={role} /></span>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden lg:flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium"><DollarSign size={14} className="mr-1"/> USD: $20.54</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <DashboardView data={data} />}
          {activeTab === 'capture' && <CaptureForm onSave={handleSave} onCancel={() => setActiveTab('dashboard')} existingData={data} role={role} />}
          {activeTab === 'list' && <ListView data={data} onInitiatePayment={initiatePayment} role={role} onEdit={handleEdit} />}
          {activeTab === 'quotes' && <QuoteGenerator role={role} />}
        </div>
      </main>
    </div>
  );
}