// src/views/ListView.jsx
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Edit, Lock, FileText, Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/helpers';
import { generatePDF } from '../utils/pdfGenerator';

const ListView = ({ data = [], onPayItem, onPayAll, onCloseOperation, role, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('full');
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);
  
  // Filtro con validación para evitar crashes
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.bl_master?.toLowerCase() || '').includes(term) ||
      (item.bl?.toLowerCase() || '').includes(term) ||
      (item.comentarios?.toLowerCase() || '').includes(term) ||
      (item.contenedor?.toLowerCase() || '').includes(term)
    );
  });

  const isSimpleView = viewMode === 'simple';
  
  // Permisos por rol:
  // - admin: todo
  // - pagos: pagar, cerrar
  // - revalidaciones: editar solo fechas/ETA/días libres (se maneja en EditModal)
  const canPay = role === 'admin' || role === 'pagos';
  const canEditAll = role === 'admin';
  const canEditDatesOnly = role === 'revalidaciones';
  const canEdit = canEditAll || canEditDatesOnly;
  const canClose = role === 'admin' || role === 'pagos';
  
  // Compatibilidad: backend usa 'estatus', frontend viejo usa 'status'
  const closedItems = filteredData.filter(item => 
    (item.estatus === 'cerrado') || (item.status === 'closed')
  );

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

  // Helper para obtener valores con compatibilidad backend/frontend
  const getValue = (item, backendKey, frontendKey, defaultValue = '') => {
    return item[backendKey] ?? item[frontendKey] ?? defaultValue;
  };

  const getImporte = (item) => {
    const value = item.importe ?? item.amount ?? 0;
    return parseFloat(value) || 0;
  };

  const isClosed = (item) => {
    return item.estatus === 'cerrado' || item.status === 'closed';
  };

  const isPaid = (item) => {
    return item.estatus === 'pagado' || item.payment === 'paid';
  };

  // Obtener nombre de empresa (puede venir como objeto o string)
  const getEmpresaNombre = (item) => {
    // Primero intentar campo directo del backend
    if (item.empresa_nombre) return item.empresa_nombre;
    // Si viene como objeto
    if (typeof item.empresa === 'object' && item.empresa !== null) {
      return item.empresa.nombre || '';
    }
    // Si es string, devolverlo
    if (typeof item.empresa === 'string') return item.empresa;
    return '';
  };

  // Obtener nombre de proveedor (puede venir como objeto o string)
  const getProveedorNombre = (item) => {
    if (item.proveedor_nombre) return item.proveedor_nombre;
    if (typeof item.proveedor === 'object' && item.proveedor !== null) {
      return item.proveedor.nombre || '';
    }
    if (typeof item.proveedor === 'string') return item.proveedor;
    return '';
  };

  // Obtener datos bancarios del proveedor
  const getProveedorBanco = (item) => {
    if (item.proveedor_banco) return item.proveedor_banco;
    if (typeof item.proveedor === 'object' && item.proveedor !== null) {
      return item.proveedor.banco || '';
    }
    return item.banco || '';
  };

  const getProveedorCuenta = (item) => {
    if (item.proveedor_cuenta) return item.proveedor_cuenta;
    if (typeof item.proveedor === 'object' && item.proveedor !== null) {
      return item.proveedor.cuenta || '';
    }
    return item.cuenta || '';
  };

  const getProveedorClabe = (item) => {
    if (item.proveedor_clabe) return item.proveedor_clabe;
    if (typeof item.proveedor === 'object' && item.proveedor !== null) {
      return item.proveedor.clabe || '';
    }
    return item.clabe || '';
  };

  // Obtener ejecutivo (primer nombre solamente)
  const getEjecutivoNombre = (item) => {
    let nombreCompleto = '';
    
    // Primero intentar campo directo del backend
    if (item.ejecutivo_nombre) {
      nombreCompleto = item.ejecutivo_nombre;
    } else if (typeof item.ejecutivo === 'object' && item.ejecutivo !== null) {
      nombreCompleto = item.ejecutivo.nombre || item.ejecutivo.email || '';
    } else if (typeof item.ejecutivo === 'string') {
      nombreCompleto = item.ejecutivo;
    }
    
    // Extraer solo el primer nombre
    if (nombreCompleto) {
      const primerNombre = nombreCompleto.split(' ')[0];
      return primerNombre.toUpperCase();
    }
    
    return '';
  };

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800">Sábana operativa</h2>
          {(role === 'admin' || role === 'pagos') && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setViewMode('full')} 
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${viewMode === 'full' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Completa
              </button>
              <button 
                onClick={() => setViewMode('simple')} 
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${viewMode === 'simple' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
              >
                Simple
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por BL, contenedor, comentarios..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-72 outline-none focus:ring-2 focus:ring-blue-500" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDownload} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow hover:bg-red-700 flex items-center gap-2"
            >
              <FileText size={14} /> Descargar {selectedIds.length} PDF(s)
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="p-4 w-12 bg-slate-50 border-r">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded accent-blue-600" 
                    onChange={handleSelectAll} 
                    checked={closedItems.length > 0 && selectedIds.length === closedItems.length} 
                    disabled={closedItems.length === 0} 
                  />
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
                const itemIsClosed = isClosed(item);
                const itemIsPaid = isPaid(item);
                
                return (
                  <React.Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${expandedRow === item.id ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-4 text-center bg-white border-r border-slate-100">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item.id)} 
                          onChange={() => handleSelectRow(item.id)} 
                          disabled={!itemIsClosed} 
                          className={`w-4 h-4 rounded ${itemIsClosed ? 'cursor-pointer accent-blue-600' : 'cursor-not-allowed bg-slate-100'}`} 
                        />
                      </td>
                      <td className="p-4 text-center cursor-pointer bg-white border-r border-slate-100" onClick={() => toggleRow(item.id)}>
                        {expandedRow === item.id ? <ChevronUp size={18} className="text-blue-500"/> : <ChevronDown size={18} className="text-slate-400"/>}
                      </td>
                      {!isSimpleView && (
                        <td className="p-4 text-center bg-white border-r font-bold text-slate-400">
                          {getEjecutivoNombre(item)}
                        </td>
                      )}
                      <td className="p-4 font-bold text-slate-700 truncate">{getEmpresaNombre(item)}</td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono font-bold text-slate-700 shadow-sm whitespace-nowrap">
                          {item.comentarios || '-'}
                        </span>
                      </td>
                      {!isSimpleView && (
                        <td className="p-4 text-center text-xs">
                          {formatDate(item.fecha_alta || item.fechaAlta)}
                        </td>
                      )}
                      <td className="p-4 font-mono font-bold">{item.contenedor || '-'}</td>
                      <td className="p-4 text-xs">{item.pedimento || '-'}</td>
                      {!isSimpleView && <td className="p-4 text-xs">{item.factura || '-'}</td>}
                      <td className="p-4 text-xs font-bold text-blue-700">{getProveedorNombre(item)}</td>
                      <td className="p-4 text-[10px] text-slate-500">{getProveedorBanco(item)}</td>
                      <td className="p-4 text-[10px] text-slate-500 font-mono">{getProveedorCuenta(item)}</td>
                      <td className="p-4 text-[10px] text-slate-500 font-mono">{getProveedorClabe(item)}</td>
                      <td className="p-4 text-center">
                        <StatusBadge item={item} />
                        <div className="text-[10px] mt-1 text-slate-400">{formatDate(item.eta)}</div>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">
                        ${getImporte(item).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          disabled={!itemIsClosed} 
                          onClick={() => generatePDF([item], `Comprobante_${item.bl_master || item.bl || item.contenedor}.pdf`)} 
                          className={`p-2 rounded transition-colors ${itemIsClosed ? 'text-red-600 hover:bg-red-50 hover:shadow-sm' : 'text-slate-300 cursor-not-allowed'}`} 
                          title={itemIsClosed ? "Descargar PDF" : "Operación no cerrada"}
                        >
                          <FileText size={18} />
                        </button>
                      </td>
                      {!isSimpleView && canEdit && (
                        <td className="p-4 text-center">
                          <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                            <Edit size={16}/>
                          </button>
                        </td>
                      )}
                    </tr>
                    {expandedRow === item.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={isSimpleView ? "13" : "17"} className="p-0 border-b border-slate-200 shadow-inner">
                          <div className="p-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b pb-2">Desglose de costos</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              {[
                                {l:'Demoras', k:'costo_demoras', kOld:'costDemoras'}, 
                                {l:'Almacenaje', k:'costo_almacenaje', kOld:'costAlmacenaje'},
                                {l:'Operativos', k:'costo_operativos', kOld:'costOperativos'}, 
                                {l:'Portuarios', k:'costo_gastos_portuarios', kOld:'costPortuarios'},
                                {l:'Apoyo', k:'costo_apoyo', kOld:'costApoyo'}, 
                                {l:'Impuestos', k:'costo_impuestos', kOld:'costImpuestos'},
                                {l:'Liberación', k:'costo_liberacion', kOld:'costLiberacion'}, 
                                {l:'Transporte', k:'costo_transporte', kOld:'costTransporte'}
                              ].map((c) => {
                                const costValue = parseFloat(item[c.k] ?? item[c.kOld] ?? 0) || 0;
                                return (
                                  <div key={c.k} className="flex justify-between items-center p-2 bg-white border rounded shadow-sm">
                                    <span className="text-xs text-slate-500 font-bold uppercase">{c.l}</span>
                                    <span className="font-mono font-bold text-slate-800">${costValue.toLocaleString()}</span>
                                    {canPay && (costValue > 0) && (
                                      <button 
                                        onClick={() => onPayItem && onPayItem(item.id, c.k)} 
                                        disabled={item.paidFlags?.[c.k] || itemIsPaid} 
                                        className={`ml-2 p-1 rounded text-[10px] font-bold uppercase ${item.paidFlags?.[c.k] || itemIsPaid ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}
                                      >
                                        {item.paidFlags?.[c.k] || itemIsPaid ? 'Pagado' : 'Pagar'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-end gap-3">
                              {canPay && !itemIsPaid && (
                                <button 
                                  onClick={() => onPayAll && onPayAll(item.id)} 
                                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded shadow hover:bg-emerald-700 text-xs"
                                >
                                  Saldar total
                                </button>
                              )}
                              {itemIsClosed ? (
                                <span className="px-4 py-2 bg-slate-100 text-slate-400 font-bold rounded shadow-inner text-xs flex items-center border border-slate-200 cursor-not-allowed">
                                  <Lock size={12} className="mr-2"/> Operación cerrada
                                </span>
                              ) : canClose && (
                                <button 
                                  onClick={() => onCloseOperation && onCloseOperation(item)} 
                                  className="px-4 py-2 bg-slate-800 text-white font-bold rounded shadow hover:bg-slate-900 text-xs flex items-center"
                                >
                                  <Lock size={12} className="mr-2"/> Cerrar operación
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          
          {/* Empty state */}
          {filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Search size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay contenedores para mostrar</p>
              <p className="text-sm">Crea un nuevo contenedor desde "Alta de contenedores"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListView;