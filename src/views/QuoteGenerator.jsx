// src/views/QuoteGenerator.jsx
import React, { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import { 
  Calculator, Ship, DollarSign, Download, MapPin, Globe, 
  FileText, Save, User, Phone, Mail, CheckCircle, Trash2, List 
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

const QuoteGenerator = ({ role }) => {
  // Estado para la lista de cotizaciones pendientes (Simulación de BD)
  const [pendingQuotes, setPendingQuotes] = useState([]);

  // Estado del formulario
  const [quoteData, setQuoteData] = useState({
    // Datos Cliente / Identificación
    clientName: '',
    prefix: '',        // Nuevo
    consecutive: '',   // Nuevo
    contactName: '',   // Nuevo
    contactPhone: '',  // Nuevo
    contactEmail: '',  // Nuevo
    
    // Datos Operativos
    currency: 'MXN',
    bl: '',
    container: '',
    eta: '',
    deliveryDate: '',
    port: '',
    terminal: '',
    demurrageDays: '',
    storageDays: '',
    naviera: '',
    
    // Costos
    costDemoras: '',
    costAlmacenaje: '',
    costOperativos: '',
    costPortuarios: '',
    costApoyo: '',
    costImpuestos: '',
    costLiberacion: '',
    costTransporte: ''
  });

  // Manejo de cambios en inputs
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setQuoteData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-generar prefijo si se edita el cliente y el prefijo está vacío
      if (name === 'clientName' && !prev.prefix) {
        newData.prefix = value.slice(0, 3).toUpperCase();
      }
      return newData;
    });
  }, []);

  // Función para obtener número de un valor string
  const getNum = (val) => parseFloat(val) || 0;

  const subtotal = 
    getNum(quoteData.costDemoras) + getNum(quoteData.costAlmacenaje) + getNum(quoteData.costOperativos) + 
    getNum(quoteData.costPortuarios) + getNum(quoteData.costApoyo) + getNum(quoteData.costImpuestos) + 
    getNum(quoteData.costLiberacion) + getNum(quoteData.costTransporte);

  const formatMoney = (val) => {
    const num = getNum(val);
    return num > 0 ? `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-';
  };

  // -----------------------------------------------------------------------
  // ACCIONES DE PRE-ALTA (NUEVO FLUJO)
  // -----------------------------------------------------------------------
  const handleSaveDraft = () => {
    if (!quoteData.clientName || !quoteData.bl) {
      alert("Por favor ingrese al menos el Cliente y el BL para guardar.");
      return;
    }

    const newQuote = {
      id: Date.now(),
      date: new Date().toISOString(),
      status: 'borrador', // Estado inicial
      ...quoteData,
      total: subtotal
    };

    setPendingQuotes([newQuote, ...pendingQuotes]);
    
    // Opcional: Limpiar formulario o notificar
    alert("Cotización guardada en 'Pendientes de Validación'");
  };

  const handleApprove = (id) => {
    if (!window.confirm("¿Confirmar operación? Se generará el registro en la Sábana Operativa.")) return;
    // AQUÍ IRÍA LA LLAMADA A TU API PARA CREAR EL TICKET REAL
    console.log("Aprobando cotización ID:", id);
    setPendingQuotes(prev => prev.filter(q => q.id !== id));
  };

  const handleDiscard = (id) => {
    if (!window.confirm("¿Descartar esta cotización permanentemente?")) return;
    setPendingQuotes(prev => prev.filter(q => q.id !== id));
  };

  // -----------------------------------------------------------------------
  // GENERACIÓN DE PDF (LÓGICA EXISTENTE MANTENIDA)
  // -----------------------------------------------------------------------
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const m = 20; 
    let y = 0;   
    const corporateBlue = [15, 23, 42]; 
    const rowGreen = [220, 252, 231];
    const rowYellow = [254, 249, 195];
    const textRed = [185, 28, 28];
    const border = [80, 80, 80];

    doc.setFillColor(...corporateBlue);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(25, 17, 8, 'F');
    doc.setTextColor(...corporateBlue);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("A", 22.5, 22);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("ADUANASOFT", 38, 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Soluciones logísticas integrales", 38, 26);

    doc.setFontSize(9);
    doc.text("Av. del Puerto 123, Manzanillo, Col.", 200, 12, { align: 'right' });
    doc.text("Tel: +52 (314) 333-0000", 200, 17, { align: 'right' });
    doc.text("contacto@aduanasoft.com", 200, 22, { align: 'right' });

    y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Cotización de servicios", 105, y, { align: 'center' });
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Atención a: ${quoteData.clientName || "Cliente general"}`, m, y);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 190, y, { align: 'right' });

    y += 10;

    const drawRow = (label, value, bgColor = null, textColor = [0,0,0], boldValue = false) => {
      const rowHeight = 7.5; 
      doc.setDrawColor(...border);
      doc.setFillColor(255, 255, 255);
      if (bgColor) doc.setFillColor(...bgColor);
      doc.rect(m, y, 90, rowHeight, 'FD'); 
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(label, m + 85, y + 5, { align: 'right' });

      doc.setFillColor(255, 255, 255);
      if (bgColor) doc.setFillColor(...bgColor);
      doc.rect(m + 90, y, 80, rowHeight, 'FD');

      doc.setFont("helvetica", boldValue ? "bold" : "normal");
      doc.setTextColor(...textColor);
      doc.text(value ? value.toString() : "-", m + 130, y + 5, { align: 'center' });
      y += rowHeight;
    };

    drawRow("BL / Embarque", quoteData.bl || '-');
    drawRow("Contenedor", quoteData.container || '-');
    drawRow("ETA", quoteData.eta ? formatDate(quoteData.eta) : '-');
    drawRow("Fecha de entrega", quoteData.deliveryDate ? formatDate(quoteData.deliveryDate) : '-', rowGreen);
    drawRow("Puerto", quoteData.port || '-');
    drawRow("Terminal", quoteData.terminal || '-');
    drawRow("Días de demoras", quoteData.demurrageDays || '-');
    drawRow("Días de almacenaje", quoteData.storageDays || '-');
    drawRow("Naviera", quoteData.naviera || '-');

    y += 2; 

    drawRow("Demoras", formatMoney(quoteData.costDemoras));
    drawRow("Almacenaje", formatMoney(quoteData.costAlmacenaje));
    drawRow("Costos operativos", formatMoney(quoteData.costOperativos));
    drawRow("Gastos portuarios", formatMoney(quoteData.costPortuarios));
    drawRow("Apoyo extraordinario", formatMoney(quoteData.costApoyo), null, textRed, true);
    drawRow("Impuestos", formatMoney(quoteData.costImpuestos));
    drawRow("Liberación", formatMoney(quoteData.costLiberacion));
    drawRow("Transporte", formatMoney(quoteData.costTransporte));
    
    y += 2;
    drawRow(`Total estimado (${quoteData.currency})`, `$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, rowYellow, [0,0,0], true);

    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(...corporateBlue);
    doc.rect(0, pageHeight - 20, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("www.aduanasoft.com | Documento oficial", 105, pageHeight - 9, { align: 'center' });

    doc.save(`Cotizacion_${quoteData.container || 'Cliente'}.pdf`);
  };

  // Componente de fila para la previsualización
  const PreviewRow = ({ label, value, highlight, isGreen }) => (
    <div className={`flex border-b border-slate-200 ${isGreen ? 'bg-green-50' : highlight ? 'bg-yellow-50' : ''}`}>
      <div className="w-1/2 p-2 text-xs text-slate-600 text-right pr-4 border-r border-slate-200">{label}</div>
      <div className={`w-1/2 p-2 text-xs text-center ${highlight ? 'font-bold' : ''}`}>{value || '-'}</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in space-y-8">
      
      {/* SECCIÓN SUPERIOR: FORMULARIO Y PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto flex flex-col">
          <div className="p-6 flex-1">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Calculator className="mr-2 text-blue-600"/> Cotizador & Pre-alta
            </h2>

            {/* Datos generales / Identificación */}
            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                <User size={14} className="mr-1"/> Datos del Cliente
              </h3>
              
              <div className="space-y-3">
                {/* Nombre y Divisa */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre del cliente</label>
                    <input 
                      name="clientName" 
                      value={quoteData.clientName} 
                      onChange={handleChange} 
                      className="w-full p-2 border rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="Ej. Comercializadora del Norte S.A." 
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Divisa</label>
                    <select 
                      name="currency" 
                      value={quoteData.currency} 
                      onChange={handleChange} 
                      className="w-full p-2 border rounded text-sm bg-white font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MXN">MXN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                {/* Prefijo y Consecutivo (NUEVO) */}
                <div className="flex gap-4 bg-white p-3 rounded border border-slate-200">
                  <div className="w-32">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Prefijo (Auto)</label>
                    <input 
                      name="prefix" 
                      value={quoteData.prefix} 
                      onChange={handleChange} 
                      className="w-full p-1.5 border rounded text-sm font-mono uppercase bg-slate-50 text-center outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="ABC" 
                      maxLength={4}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Consecutivo</label>
                    <input 
                      name="consecutive" 
                      value={quoteData.consecutive} 
                      onChange={handleChange} 
                      className="w-full p-1.5 border rounded text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="001" 
                    />
                  </div>
                </div>

                {/* Contacto (NUEVO) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre Contacto</label>
                    <input name="contactName" value={quoteData.contactName} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none" placeholder="Encargado de logística" />
                  </div>
                  <div className="col-span-1 relative">
                    <Phone size={12} className="absolute left-2 top-2.5 text-slate-400"/>
                    <input name="contactPhone" value={quoteData.contactPhone} onChange={handleChange} className="w-full pl-6 p-2 border rounded text-xs bg-white outline-none" placeholder="Teléfono" />
                  </div>
                  <div className="col-span-2 relative">
                    <Mail size={12} className="absolute left-2 top-2.5 text-slate-400"/>
                    <input name="contactEmail" value={quoteData.contactEmail} onChange={handleChange} className="w-full pl-6 p-2 border rounded text-xs bg-white outline-none" placeholder="correo@empresa.com" />
                  </div>
                </div>
              </div>
              
              {/* Datos operativos */}
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center mt-6">
                <Ship size={14} className="mr-1"/> Datos operativos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">BL</label>
                  <input name="bl" value={quoteData.bl} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white uppercase font-mono outline-none focus:ring-2 focus:ring-blue-500" placeholder="HLCU12345678" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Contenedor</label>
                  <input name="container" value={quoteData.container} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white uppercase font-mono outline-none focus:ring-2 focus:ring-blue-500" placeholder="MSKU1234567" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">ETA</label>
                  <input type="date" name="eta" value={quoteData.eta} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-green-700 mb-1 block">Fecha de entrega</label>
                  <input type="date" name="deliveryDate" value={quoteData.deliveryDate} onChange={handleChange} className="w-full p-2 border border-green-300 bg-green-50 rounded text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Puerto</label>
                  <input name="port" value={quoteData.port} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Manzanillo" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Terminal</label>
                  <input name="terminal" value={quoteData.terminal} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contecon" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Días demoras</label>
                  <input type="number" name="demurrageDays" value={quoteData.demurrageDays} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" min="0"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Días almacenaje</label>
                  <input type="number" name="storageDays" value={quoteData.storageDays} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" min="0"/>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Naviera</label>
                  <input name="naviera" value={quoteData.naviera} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Hapag-Lloyd, Maersk, etc." />
                </div>
              </div>
            </div>

            {/* Costos */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                <DollarSign size={14} className="mr-1"/> Costos ({quoteData.currency})
              </h3>
              <div className="space-y-3">
                {[
                  { l: 'Demoras', k: 'costDemoras' },
                  { l: 'Almacenaje', k: 'costAlmacenaje' },
                  { l: 'Costos operativos', k: 'costOperativos' },
                  { l: 'Gastos portuarios', k: 'costPortuarios' },
                  { l: 'Apoyo', k: 'costApoyo', color: 'text-red-600' },
                  { l: 'Impuestos', k: 'costImpuestos' },
                  { l: 'Liberación', k: 'costLiberacion' },
                  { l: 'Transporte', k: 'costTransporte' },
                ].map((field) => (
                  <div key={field.k} className="flex items-center justify-between">
                    <label className={`text-xs font-medium ${field.color || 'text-slate-600'} w-1/2`}>{field.l}</label>
                    <div className="w-1/2 relative">
                      <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                      <input 
                        type="number" 
                        name={field.k} 
                        value={quoteData[field.k]} 
                        onChange={handleChange} 
                        className="w-full p-1.5 pl-6 border rounded text-sm text-right outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200 bg-yellow-50 p-2 -mx-2 rounded">
                  <label className="text-sm font-bold text-slate-800">Total ({quoteData.currency})</label>
                  <span className="text-lg font-mono font-bold text-slate-900">
                    ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botones de Acción */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
            <button 
              onClick={handleSaveDraft}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-lg flex items-center justify-center transition-all"
            >
              <Save size={20} className="mr-2"/> Guardar Pre-alta
            </button>
            
            <button 
              onClick={handleDownloadPDF} 
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center transition-all"
            >
              <Download size={20} className="mr-2"/> Descargar PDF
            </button>
          </div>
        </div>

        {/* Columna Derecha: Previsualización PDF */}
        <div className="hidden lg:flex bg-slate-200 p-6 rounded-xl overflow-y-auto shadow-inner justify-center items-start">
          <div className="bg-white shadow-2xl w-full max-w-md relative flex flex-col font-sans text-slate-800 text-sm rounded-lg overflow-hidden scale-90 origin-top">
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold text-lg">A</div>
                <div>
                  <h1 className="text-lg font-bold tracking-wide">ADUANASOFT</h1>
                  <p className="text-[9px] tracking-wide opacity-80">Soluciones logísticas</p>
                </div>
              </div>
              <div className="text-right text-[9px] opacity-90 space-y-0.5">
                <p className="flex items-center justify-end gap-1"><MapPin size={9}/> Av. del Puerto 123</p>
                <p className="flex items-center justify-end gap-1"><Globe size={9}/> www.aduanasoft.com</p>
              </div>
            </div>

            {/* Título */}
            <div className="p-3 text-center border-b">
              <h2 className="font-bold text-slate-800">Cotización de servicios</h2>
              <p className="text-[10px] text-slate-500">
                {quoteData.clientName || 'Cliente general'} • {new Date().toLocaleDateString('es-MX')}
              </p>
            </div>

            {/* Datos */}
            <div className="text-xs">
              <PreviewRow label="Cliente" value={quoteData.clientName} highlight />
              <PreviewRow label="Identificador" value={`${quoteData.prefix || ''} ${quoteData.consecutive || ''}`} />
              <PreviewRow label="BL / Embarque" value={quoteData.bl} />
              <PreviewRow label="Contenedor" value={quoteData.container} />
              <PreviewRow label="ETA" value={quoteData.eta ? formatDate(quoteData.eta) : null} />
              <PreviewRow label="Fecha de entrega" value={quoteData.deliveryDate ? formatDate(quoteData.deliveryDate) : null} isGreen />
              <PreviewRow label="Puerto" value={quoteData.port} />
              <PreviewRow label="Terminal" value={quoteData.terminal} />
              <PreviewRow label="Días demoras" value={quoteData.demurrageDays} />
              <PreviewRow label="Días almacenaje" value={quoteData.storageDays} />
              <PreviewRow label="Naviera" value={quoteData.naviera} />
              
              <div className="h-2 bg-slate-100"></div>
              
              <PreviewRow label="Demoras" value={formatMoney(quoteData.costDemoras)} />
              <PreviewRow label="Almacenaje" value={formatMoney(quoteData.costAlmacenaje)} />
              <PreviewRow label="Costos operativos" value={formatMoney(quoteData.costOperativos)} />
              <PreviewRow label="Gastos portuarios" value={formatMoney(quoteData.costPortuarios)} />
              <PreviewRow label="Apoyo" value={formatMoney(quoteData.costApoyo)} />
              <PreviewRow label="Impuestos" value={formatMoney(quoteData.costImpuestos)} />
              <PreviewRow label="Liberación" value={formatMoney(quoteData.costLiberacion)} />
              <PreviewRow label="Transporte" value={formatMoney(quoteData.costTransporte)} />
              
              <PreviewRow 
                label={`Total (${quoteData.currency})`} 
                value={`$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} 
                highlight 
              />
            </div>

            {/* Footer */}
            <div className="bg-slate-900 p-2 text-center text-white text-[8px]">
              www.aduanasoft.com | Documento oficial
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: LISTA DE PENDIENTES (NUEVO) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
              <List size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-700">Cotizaciones por Validar</h3>
              <p className="text-xs text-slate-500">
                Solo el rol <strong>Clasificación</strong> puede oficializar estos registros en la Sábana.
              </p>
            </div>
          </div>
          <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full">
            {pendingQuotes.length} pendientes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">Cliente / ID</th>
                <th className="p-4">BL / Contenedor</th>
                <th className="p-4">Contacto</th>
                <th className="p-4 text-center">Fecha</th>
                {/* Mostramos acciones solo si es clasificacion o admin, o para demo, siempre */}
                <th className="p-4 text-center">Acciones (Clasificación)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingQuotes.length > 0 ? pendingQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{quote.clientName}</div>
                    <div className="text-xs font-mono bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded inline-block mt-1 border border-yellow-200">
                      {quote.prefix || 'SIN'}-{quote.consecutive || '000'}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-600">
                    <div className="font-bold text-slate-700">{quote.bl}</div>
                    {quote.container && <div className="text-xs text-slate-400">{quote.container}</div>}
                  </td>
                  <td className="p-4 text-xs">
                    <div className="font-medium text-slate-700">{quote.contactName || '-'}</div>
                    <div className="text-slate-400">{quote.contactPhone}</div>
                    <div className="text-blue-500">{quote.contactEmail}</div>
                  </td>
                  <td className="p-4 text-center text-slate-500 text-xs">
                    {new Date(quote.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    {/* Botones simulados de Clasificación */}
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleApprove(quote.id)}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        title="Validar y Pasar a Operación"
                      >
                        <CheckCircle size={18} />
                      </button>
                      
                      <button 
                        onClick={() => handleDiscard(quote.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Descartar Cotización"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} className="opacity-20"/>
                      <p>No hay cotizaciones pendientes por revisar</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default QuoteGenerator;