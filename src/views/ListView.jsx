// src/views/ListView.jsx
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Edit, Lock, FileText, Search, DollarSign } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/helpers';
import { generatePDF } from '../utils/pdfGenerator';

const ListView = ({ data = [], onPayItem, onPayAll, onCloseOperation, role, onEdit, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('full');
  const [selectedIds, setSelectedIds] = useState([]);

  // Permisos por rol
  const canPay = role === 'admin' || role === 'pagos';
  const canEditAll = role === 'admin';
  const canEditDatesOnly = role === 'revalidaciones' || role === 'logistica';
  const canEdit = canEditAll || canEditDatesOnly;
  const canClose = role === 'admin' || role === 'pagos';
  const canSeeAllConceptos = role === 'admin' || role === 'pagos';

  // Agrupar tickets por identificador (bl_master para revalidaciones, contenedor para logística)
  const groupedData = useMemo(() => {
    const groups = {};
    
    data.forEach(ticket => {
      // Determinar el identificador según tipo_operacion
      const isLogistica = ticket.tipo_operacion === 'logistica';
      const identifier = isLogistica 
        ? (ticket.contenedor || ticket.bl_master || `ticket-${ticket.id}`)
        : (ticket.bl_master || ticket.contenedor || `ticket-${ticket.id}`);
      
      if (!groups[identifier]) {
        groups[identifier] = {
          identifier,
          isLogistica,
          tickets: [],
          empresa: ticket.empresa_nombre || '',
          empresa_id: ticket.empresa,
          prefijo: ticket.prefijo,
          bl_master: ticket.bl_master,
          contenedor: ticket.contenedor,
          pedimento: ticket.pedimento,
          eta: ticket.eta,
          dias_libres: ticket.dias_libres,
          ejecutivo: ticket.ejecutivo_nombre || '',
          puerto: ticket.puerto_codigo || '',
          totalImporte: 0,
          // Para el semáforo, usar el peor caso
          semaforo: 'verde',
          estatus: 'pendiente'
        };
      }
      
      groups[identifier].tickets.push(ticket);
      groups[identifier].totalImporte += parseFloat(ticket.importe) || 0;
      
      // Actualizar semáforo al peor caso
      const semaforoPriority = { 'vencido': 4, 'rojo': 3, 'amarillo': 2, 'verde': 1 };
      if (semaforoPriority[ticket.semaforo] > semaforoPriority[groups[identifier].semaforo]) {
        groups[identifier].semaforo = ticket.semaforo;
      }
      
      // Si alguno está pagado o cerrado, actualizar
      if (ticket.estatus === 'cerrado') groups[identifier].estatus = 'cerrado';
      else if (ticket.estatus === 'pagado' && groups[identifier].estatus !== 'cerrado') {
        groups[identifier].estatus = 'pagado';
      }
    });
    
    return Object.values(groups);
  }, [data]);

  // Filtro de búsqueda
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedData;
    const term = searchTerm.toLowerCase();
    return groupedData.filter(group => 
      group.identifier.toLowerCase().includes(term) ||
      group.bl_master?.toLowerCase().includes(term) ||
      group.contenedor?.toLowerCase().includes(term) ||
      group.empresa?.toLowerCase().includes(term) ||
      group.tickets.some(t => t.observaciones?.toLowerCase().includes(term))
    );
  }, [groupedData, searchTerm]);

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);
  const isSimpleView = viewMode === 'simple';

  const isClosed = (group) => group.estatus === 'cerrado';
  const isPaid = (group) => group.estatus === 'pagado';

  // Filtrar conceptos visibles según rol
  const getVisibleTickets = (tickets) => {
    if (canSeeAllConceptos) return tickets;
    // Otros roles solo ven sus propios tickets
    return tickets.filter(t => {
      if (role === 'revalidaciones') return t.tipo_operacion === 'revalidaciones';
      if (role === 'logistica') return t.tipo_operacion === 'logistica';
      if (role === 'clasificacion') return t.tipo_operacion === 'clasificacion';
      return true;
    });
  };

  // Obtener color del semáforo
  const getSemaforoColor = (semaforo) => {
    switch (semaforo) {
      case 'verde': return 'bg-green-500';
      case 'amarillo': return 'bg-yellow-500';
      case 'rojo': return 'bg-red-500';
      case 'vencido': return 'bg-purple-600';
      default: return 'bg-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-slate-800">Sábana operativa</h3>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'full' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >
              Completa
            </button>
            <button
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'simple' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >
              Simple
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por BL, contenedor, comentario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 w-12 bg-slate-50"></th>
              <th className="p-4 w-12 bg-slate-50"></th>
              {!isSimpleView && <th className="p-4 bg-slate-50 text-left">EJ</th>}
              <th className="p-4 bg-slate-50 text-left">Empresa</th>
              <th className="p-4 bg-slate-50 text-left min-w-[200px]">Identificador</th>
              {!isSimpleView && <th className="p-4 bg-slate-50 text-center">Fecha</th>}
              <th className="p-4 bg-slate-50 text-left">BL / Contenedor</th>
              <th className="p-4 bg-slate-50 text-left">Pedimento</th>
              <th className="p-4 bg-slate-50 text-center">ETA</th>
              <th className="p-4 bg-slate-50 text-center">Conceptos</th>
              <th className="p-4 bg-slate-50 text-right min-w-[120px]">Total</th>
              <th className="p-4 bg-slate-50 text-center">Estado</th>
              {!isSimpleView && canEdit && <th className="p-4 bg-slate-50 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredGroups.map((group) => {
              const groupIsClosed = isClosed(group);
              const groupIsPaid = isPaid(group);
              const visibleTickets = getVisibleTickets(group.tickets);
              
              return (
                <React.Fragment key={group.identifier}>
                  {/* Fila principal del grupo */}
                  <tr className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${expandedRow === group.identifier ? 'bg-blue-50/30' : ''}`}>
                    <td className="p-4 text-center">
                      <div className={`w-3 h-3 rounded-full ${getSemaforoColor(group.semaforo)}`} title={group.semaforo}></div>
                    </td>
                    <td className="p-4 text-center cursor-pointer" onClick={() => toggleRow(group.identifier)}>
                      {expandedRow === group.identifier 
                        ? <ChevronUp size={18} className="text-blue-500"/> 
                        : <ChevronDown size={18} className="text-slate-400"/>
                      }
                    </td>
                    {!isSimpleView && (
                      <td className="p-4 font-bold text-slate-400 text-xs">
                        {group.ejecutivo?.split(' ')[0]?.toUpperCase() || '-'}
                      </td>
                    )}
                    <td className="p-4 font-bold text-slate-700">{group.empresa}</td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono font-bold text-slate-700 shadow-sm">
                        {group.prefijo} {group.tickets[0]?.consecutivo || ''} {group.identifier}
                      </span>
                    </td>
                    {!isSimpleView && (
                      <td className="p-4 text-center text-xs text-slate-500">
                        {formatDate(group.tickets[0]?.fecha_alta)}
                      </td>
                    )}
                    <td className="p-4 font-mono text-xs">
                      <div>{group.bl_master || '-'}</div>
                      {group.contenedor && group.contenedor !== group.bl_master && (
                        <div className="text-slate-400">{group.contenedor}</div>
                      )}
                    </td>
                    <td className="p-4 text-xs">{group.pedimento || '-'}</td>
                    <td className="p-4 text-center text-xs">
                      {formatDate(group.eta)}
                      {group.dias_libres && (
                        <div className="text-slate-400">{group.dias_libres}d libres</div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {visibleTickets.length}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      ${group.totalImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        groupIsClosed ? 'bg-slate-200 text-slate-600' :
                        groupIsPaid ? 'bg-green-100 text-green-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {groupIsClosed ? 'Cerrado' : groupIsPaid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    {!isSimpleView && canEdit && (
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => onEdit(group.tickets[0])} 
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit size={16}/>
                        </button>
                      </td>
                    )}
                  </tr>

                  {/* Fila expandida con desglose */}
                  {expandedRow === group.identifier && (
                    <tr className="bg-slate-50">
                      <td colSpan={isSimpleView ? 11 : 13} className="p-0 border-b-2 border-slate-200">
                        <div className="p-6">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <DollarSign size={14} />
                            Desglose de pagos ({visibleTickets.length} conceptos)
                          </h4>
                          
                          {/* Tabla de conceptos */}
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-100 text-slate-600 uppercase">
                                  <th className="p-3 text-left font-bold">Concepto / Referencia</th>
                                  <th className="p-3 text-left font-bold">Proveedor</th>
                                  <th className="p-3 text-left font-bold">Banco</th>
                                  <th className="p-3 text-left font-bold">Cuenta</th>
                                  <th className="p-3 text-left font-bold">CLABE</th>
                                  <th className="p-3 text-right font-bold">Importe</th>
                                  <th className="p-3 text-center font-bold">Estado</th>
                                  {canPay && <th className="p-3 text-center font-bold">Acción</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {visibleTickets.map((ticket, idx) => (
                                  <tr key={ticket.id} className={`border-t border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    <td className="p-3">
                                      <div className="font-bold text-slate-700">{ticket.observaciones?.split(' - ')[0] || ticket.observaciones || 'Sin concepto'}</div>
                                      <div className="text-slate-400 font-mono">{ticket.observaciones || ticket.comentarios}</div>
                                    </td>
                                    <td className="p-3 font-medium text-blue-700">
                                      {ticket.proveedor_nombre || '-'}
                                    </td>
                                    <td className="p-3 text-slate-500">
                                      {ticket.proveedor_banco || '-'}
                                    </td>
                                    <td className="p-3 font-mono text-slate-500">
                                      {ticket.proveedor_cuenta || '-'}
                                    </td>
                                    <td className="p-3 font-mono text-slate-500">
                                      {ticket.proveedor_clabe || '-'}
                                    </td>
                                    <td className="p-3 text-right font-bold text-slate-800">
                                      ${parseFloat(ticket.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      <span className="text-slate-400 ml-1">{ticket.divisa}</span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        ticket.estatus === 'cerrado' ? 'bg-slate-200 text-slate-600' :
                                        ticket.estatus === 'pagado' ? 'bg-green-100 text-green-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {ticket.estatus === 'cerrado' ? 'Cerrado' : 
                                         ticket.estatus === 'pagado' ? 'Pagado' : 'Pendiente'}
                                      </span>
                                    </td>
                                    {canPay && (
                                      <td className="p-3 text-center">
                                        {ticket.estatus === 'pendiente' && (
                                          <button
                                            onClick={() => onPayAll && onPayAll(ticket.id)}
                                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                                          >
                                            Pagar
                                          </button>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-slate-100 font-bold">
                                  <td colSpan={5} className="p-3 text-right text-slate-600">TOTAL:</td>
                                  <td className="p-3 text-right text-slate-800">
                                    ${visibleTickets.reduce((sum, t) => sum + (parseFloat(t.importe) || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td></td>
                                  {canPay && <td></td>}
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Acciones del grupo */}
                          <div className="flex justify-end gap-3">
                            {canPay && !groupIsPaid && !groupIsClosed && visibleTickets.some(t => t.estatus === 'pendiente') && (
                              <button 
                                onClick={() => {
                                  // Pagar todos los tickets pendientes del grupo
                                  visibleTickets.filter(t => t.estatus === 'pendiente').forEach(t => {
                                    onPayAll && onPayAll(t.id);
                                  });
                                }}
                                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded shadow hover:bg-emerald-700 text-xs"
                              >
                                Saldar todos ({visibleTickets.filter(t => t.estatus === 'pendiente').length})
                              </button>
                            )}
                            {groupIsClosed ? (
                              <span className="px-4 py-2 bg-slate-100 text-slate-400 font-bold rounded shadow-inner text-xs flex items-center border border-slate-200">
                                <Lock size={12} className="mr-2"/> Operación cerrada
                              </span>
                            ) : canClose && (
                              <button 
                                onClick={() => {
                                  console.log('Cerrando grupo:', group);
                                  console.log('Tickets del grupo:', group.tickets);
                                  onCloseOperation && onCloseOperation(group.tickets[0], group.tickets);
                                }}              className="px-4 py-2 bg-slate-800 text-white font-bold rounded shadow hover:bg-slate-900 text-xs flex items-center"
                              >
                                <Lock size={12} className="mr-2"/> Cerrar operación
                              </button>
                            )}
                            <button 
                              onClick={() => generatePDF(group.tickets, `Desglose_${group.identifier}.pdf`)} 
                              className="px-4 py-2 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 text-xs flex items-center"
                            >
                              <FileText size={12} className="mr-2"/> Descargar PDF
                            </button>
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
        {filteredGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Search size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay contenedores para mostrar</p>
            <p className="text-sm">Crea un nuevo contenedor desde "Alta de pago"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;