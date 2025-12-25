// src/views/QuoteGenerator.jsx
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Calculator, Ship, DollarSign, Download, MapPin, Globe } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const QuoteGenerator = ({ role }) => {
  const [quoteData, setQuoteData] = useState({
    clientName: '', currency: 'MXN', bl: '', container: '', eta: '', deliveryDate: '',
    port: 'MANZANILLO', terminal: 'CONTECON', demurrageDays: 0, storageDays: 0, naviera: '',
    costDemoras: 0, costAlmacenaje: 0, costOperativos: 0, costPortuarios: 0, costApoyo: 0,
    costImpuestos: 0, costLiberacion: 0, costTransporte: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumber = name.startsWith('cost') || name.endsWith('Days');
    setQuoteData({ 
        ...quoteData, 
        [name]: isNumber ? (parseFloat(value) || 0) : value 
    });
  };

  const subtotal = 
    quoteData.costDemoras + quoteData.costAlmacenaje + quoteData.costOperativos + 
    quoteData.costPortuarios + quoteData.costApoyo + quoteData.costImpuestos + 
    quoteData.costLiberacion + quoteData.costTransporte;

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
    doc.text("SOLUCIONES LOGÍSTICAS INTEGRALES", 38, 26);

    doc.setFontSize(9);
    doc.text("Av. del Puerto 123, Manzanillo, Col.", 200, 12, { align: 'right' });
    doc.text("Tel: +52 (314) 333-0000", 200, 17, { align: 'right' });
    doc.text("contacto@aduanasoft.com", 200, 22, { align: 'right' });

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

    drawRow("BL / EMBARQUE", quoteData.bl);
    drawRow("CONTENEDOR", quoteData.container);
    drawRow("ETA", formatDate(quoteData.eta));
    drawRow("FECHA DE ENTREGA", formatDate(quoteData.deliveryDate), rowGreen);
    drawRow("PUERTO", quoteData.port);
    drawRow("TERMINAL", quoteData.terminal);
    drawRow("DIAS DE DEMORAS", quoteData.demurrageDays);
    drawRow("DIAS DE ALMACENAJE", quoteData.storageDays);
    drawRow("NAVIERA", quoteData.naviera);

    y += 2; 

    const formatMoney = (val) => `$ ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    drawRow("DEMORAS", quoteData.costDemoras > 0 ? formatMoney(quoteData.costDemoras) : "-");
    drawRow("ALMACENAJE", formatMoney(quoteData.costAlmacenaje));
    drawRow("COSTOS OPERATIVOS", formatMoney(quoteData.costOperativos));
    drawRow("GASTOS PORTUARIOS", formatMoney(quoteData.costPortuarios));
    drawRow("APOYO EXTRAORDINARIO", formatMoney(quoteData.costApoyo), null, textRed, true);
    drawRow("IMPUESTOS", formatMoney(quoteData.costImpuestos));
    drawRow("LIBERACION", quoteData.costLiberacion > 0 ? formatMoney(quoteData.costLiberacion) : "-");
    drawRow("TRANSPORTE", formatMoney(quoteData.costTransporte));
    
    y += 2;
    drawRow(`TOTAL ESTIMADO (${quoteData.currency})`, formatMoney(subtotal), rowYellow, [0,0,0], true);

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
                        { l: 'Demoras', k: 'costDemoras' }, { l: 'Almacenaje', k: 'costAlmacenaje' },
                        { l: 'Costos Operativos', k: 'costOperativos' }, { l: 'Gastos Portuarios', k: 'costPortuarios' },
                        { l: 'Apoyo', k: 'costApoyo', color: 'text-red-600' }, { l: 'Impuestos', k: 'costImpuestos' },
                        { l: 'Liberación', k: 'costLiberacion' }, { l: 'Transporte', k: 'costTransporte' },
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

      <div className="hidden lg:flex bg-slate-200 p-8 rounded-xl overflow-y-auto h-full shadow-inner justify-center items-start">
        <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] relative flex flex-col font-sans text-slate-800 text-sm scale-90 origin-top">
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
            {/* ... PREVISUALIZACIÓN SIMPLIFICADA PARA AHORRAR ESPACIO ... */}
        </div>
      </div>
    </div>
  );
};
export default QuoteGenerator;