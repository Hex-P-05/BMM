// src/views/ListView.jsx
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Edit, Lock, FileText, Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/helpers';
import { generatePDF } from '../utils/pdfGenerator';

const ListView = ({ data, onPayItem, onPayAll, onCloseOperation, role, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('full');
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);
  
  const filteredData = data.filter(item => 
    item.bl.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.comentarios && item.comentarios.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (item.contenedor && item.contenedor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isSimpleView = viewMode === 'simple';
  const canPay = role === 'admin' || role === 'pagos';
  const canEdit = role === 'admin' || role === 'ejecutivo';
  const closedItems = filteredData.filter(item => item.status === 'closed');

  const handleSelectAll = (e) => {
    if (e.target.checked) {
        const allClosedIds = closedItems.map(i => i.id);
        setSelectedIds(allClosedIds);
    } else {
        setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
        setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDownload = () => {
    const itemsToPrint = data.filter(item => selectedIds.includes(item.id));
    if (itemsToPrint.length > 0) {
        generatePDF(itemsToPrint, `Comprobantes_Masivos_${new Date().toLocaleDateString()}.pdf`);
        setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">Sábana operativa</h2>
            {(role === 'admin' || role === 'pagos') && (
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button onClick={() => setViewMode('full')} className={`px-3 py-1 rounded-md text-xs font-bold ${viewMode === 'full' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Completa</button>
                    <button onClick={() => setViewMode('simple')} className={`px-3 py-1 rounded-md text-xs font-bold ${viewMode === 'simple' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Pagos</button>
                </div>
            )}
            {selectedIds.length > 0 && (
                <button onClick={handleBulkDownload} className="flex items-center animate-fade-in px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 text-xs font-bold transition-all">
                    <FileText size={16} className="mr-2"/> Descargar seleccionados ({selectedIds.length})
                </button>
            )}
        </div>
        <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none text-sm" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 relative">
        <div className="overflow-auto h-[calc(100vh-200px)] w-full relative"> 
          <table className="w-full text-left border-collapse min-w-[2000px]">
            <thead className="sticky top-0 z-40 shadow-sm">
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase h-12">
                    <th className="p-4 w-10 bg-slate-50 border-r text-center">
                        <input type="checkbox" className="w-4 h-4 rounded cursor-pointer accent-blue-600" onChange={handleSelectAll} checked={closedItems.length > 0 && selectedIds.length === closedItems.length} disabled={closedItems.length === 0} />
                    </th>
                    <th className="p-4 w-12 bg-slate-50 border-r"></th>
                    {!isSimpleView && <th className="p-4 w-16 text-center bg-slate-50 border-r">Ej</th>}
                    <th className="p-4 min-w-[200px] bg-slate-50 border-r">Empresa</th>
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
                    <th className="p-4 text-center bg-slate-50 min-w-[100px]">Comprobante</th>
                    {!isSimpleView && canEdit && <th className="p-4 text-center bg-slate-50">Acciones</th>}
                </tr>
            </thead>
            <tbody className="text-sm">
              {filteredData.map((item) => {
                const isClosed = item.status === 'closed';
                return (
                <React.Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${expandedRow === item.id ? 'bg-blue-50/30' : ''}`}>
                        <td className="p-4 text-center bg-white border-r border-slate-100">
                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectRow(item.id)} disabled={!isClosed} className={`w-4 h-4 rounded ${isClosed ? 'cursor-pointer accent-blue-600' : 'cursor-not-allowed bg-slate-100'}`} />
                        </td>
                        <td className="p-4 text-center cursor-pointer bg-white border-r border-slate-100" onClick={() => toggleRow(item.id)}>
                            {expandedRow === item.id ? <ChevronUp size={18} className="text-blue-500"/> : <ChevronDown size={18} className="text-slate-400"/>}
                        </td>
                        {!isSimpleView && <td className="p-4 text-center bg-white border-r font-bold text-slate-400">{item.ejecutivo}</td>}
                        <td className="p-4 font-bold text-slate-700 truncate">{item.empresa}</td>
                        <td className="p-4"><span className="inline-block px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono font-bold text-slate-700 shadow-sm whitespace-nowrap">{item.comentarios}</span></td>
                        {!isSimpleView && <td className="p-4 text-center text-xs">{formatDate(item.fechaAlta)}</td>}
                        <td className="p-4 font-mono font-bold">{item.contenedor}</td>
                        <td className="p-4 text-xs">{item.pedimento || '-'}</td>
                        {!isSimpleView && <td className="p-4 text-xs">{item.factura || '-'}</td>}
                        <td className="p-4 text-xs font-bold text-blue-700">{item.proveedor}</td>
                        <td className="p-4 text-[10px] text-slate-500">{item.banco}</td>
                        <td className="p-4 text-[10px] text-slate-500 font-mono">{item.cuenta}</td>
                        <td className="p-4 text-[10px] text-slate-500 font-mono">{item.clabe}</td>
                        <td className="p-4 text-center"><StatusBadge item={item} /> <div className="text-[10px] mt-1 text-slate-400">{formatDate(item.eta)}</div></td>
                        <td className="p-4 text-right font-bold text-slate-800">${item.amount.toLocaleString()}</td>
                        <td className="p-4 text-center">
                             <button disabled={!isClosed} onClick={() => generatePDF([item], `Comprobante_${item.bl}.pdf`)} className={`p-2 rounded transition-colors ${isClosed ? 'text-red-600 hover:bg-red-50 hover:shadow-sm' : 'text-slate-300 cursor-not-allowed'}`} title={isClosed ? "Descargar PDF" : "Operación no cerrada"}>
                                <FileText size={18} />
                             </button>
                        </td>
                        {!isSimpleView && canEdit && (
                            <td className="p-4 text-center">
                                <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                            </td>
                        )}
                    </tr>
                    {expandedRow === item.id && (
                        <tr className="bg-slate-50">
                            <td colSpan={isSimpleView ? "13" : "16"} className="p-0 border-b border-slate-200 shadow-inner">
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
                                                    <button onClick={() => onPayItem(item.id, c.k)} disabled={item.paidFlags?.[c.k] || item.payment === 'paid'} className={`ml-2 p-1 rounded text-[10px] font-bold uppercase ${item.paidFlags?.[c.k] || item.payment === 'paid' ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}>
                                                        {item.paidFlags?.[c.k] || item.payment === 'paid' ? 'Pagado' : 'Pagar'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        {canPay && item.payment !== 'paid' && <button onClick={() => onPayAll(item.id)} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded shadow hover:bg-emerald-700 text-xs">Saldar total</button>}
                                        {item.status === 'closed' ? (
                                            <span className="px-4 py-2 bg-slate-100 text-slate-400 font-bold rounded shadow-inner text-xs flex items-center border border-slate-200 cursor-not-allowed">
                                                <Lock size={12} className="mr-2"/> Operación cerrada
                                            </span>
                                        ) : (
                                            <button onClick={() => onCloseOperation(item)} className="px-4 py-2 bg-slate-800 text-white font-bold rounded shadow hover:bg-slate-900 text-xs flex items-center">
                                                <Lock size={12} className="mr-2"/> Cerrar operación
                                            </button>
                                        )}
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
export default ListView;