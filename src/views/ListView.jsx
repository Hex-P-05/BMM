import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Edit, Lock, FileText, Search, DollarSign, Download, FolderOpen } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/helpers';
import { generatePDF } from '../utils/pdfGenerator';
import api from '../api/axios';

const ListView = ({ data = [], onPayItem, onPayAll, onCloseOperation, role, onEdit, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('full');

  // Estado para edición de BL/Contenedor (solo admin)
  const [editingTicket, setEditingTicket] = useState(null);
  const [editForm, setEditForm] = useState({ bl_master: '', contenedor: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  
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
      // -----------------------------------------------------------------------
      // Ya no ocultamos "Apertura de Expediente" - ahora lo mostramos diferente
      // -----------------------------------------------------------------------

      // Determinar el identificador principal
      const isLogistica = ticket.tipo_operacion === 'logistica';
      
      const baseId = isLogistica 
        ? (ticket.contenedor || ticket.bl_master || 'SIN-ID')
        : (ticket.bl_master || ticket.contenedor || 'SIN-ID');
      
      // Agrupamos por ID + CONSECUTIVO + PREFIJO
      const uniqueGroupKey = `${baseId}-${ticket.prefijo}-${ticket.consecutivo}`;

      if (!groups[uniqueGroupKey]) {
        groups[uniqueGroupKey] = {
          uniqueKey: uniqueGroupKey, 
          identifier: baseId,         
          consecutivo: ticket.consecutivo, 
          prefijo: ticket.prefijo,
          
          isLogistica,
          tickets: [],
          
          // Datos "Cabecera" 
          empresa: ticket.empresa_nombre || '',
          empresa_id: ticket.empresa,
          bl_master: ticket.bl_master,
          contenedor: ticket.contenedor,
          pedimento: ticket.pedimento,
          eta: ticket.eta,
          dias_libres: ticket.dias_libres,
          ejecutivo: ticket.ejecutivo_nombre || '',
          puerto: ticket.puerto_codigo || '',
          
          // Acumuladores
          totalImporte: 0,

          // Para el semáforo, usar el peor caso del grupo
          semaforo: 'verde',
          estatus: 'pendiente',

          // Nuevo: marcar si es apertura de expediente
          es_apertura_expediente: false,
          sensibilidad_contenido: ticket.sensibilidad_contenido || 'verde'
        };
      }

      // Agregamos el ticket al grupo
      groups[uniqueGroupKey].tickets.push(ticket);

      // Marcar si algún ticket es apertura de expediente
      if (ticket.es_apertura_expediente) {
        groups[uniqueGroupKey].es_apertura_expediente = true;
        groups[uniqueGroupKey].sensibilidad_contenido = ticket.sensibilidad_contenido || 'verde';
      }

      // Sumamos el importe
      groups[uniqueGroupKey].totalImporte += parseFloat(ticket.importe) || 0;
      
      // Actualizar semáforo al peor caso
      const semaforoPriority = { 
        'vencido': 5, 
        'rojo': 4, 
        'amarillo': 3, 
        'azul': 2,    
        'verde': 1 
      };
      
      if (semaforoPriority[ticket.semaforo] > semaforoPriority[groups[uniqueGroupKey].semaforo]) {
        groups[uniqueGroupKey].semaforo = ticket.semaforo;
      }
      
      // Lógica de estatus del grupo
      const currentStatus = groups[uniqueGroupKey].estatus;
      if (ticket.estatus === 'cerrado') {
          groups[uniqueGroupKey].estatus = 'cerrado';
      } else if (ticket.estatus === 'pendiente' && currentStatus !== 'cerrado') {
          groups[uniqueGroupKey].estatus = 'pendiente';
      } else if (ticket.estatus === 'pagado' && currentStatus === 'pagado') {
          // Se mantiene pagado si todos van pagados
      }
      
    });
    
    // Segunda pasada para definir estatus final de grupos mixtos
    Object.values(groups).forEach(g => {
        if (g.tickets.some(t => t.estatus === 'pendiente') && g.estatus !== 'cerrado') {
            g.estatus = 'pendiente';
        } else if (g.tickets.every(t => t.estatus === 'pagado') && g.estatus !== 'cerrado') {
            g.estatus = 'pagado';
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

  // Función para abrir el modal de edición de BL/Contenedor
  const openEditModal = (ticket) => {
    setEditingTicket(ticket);
    setEditForm({
      bl_master: ticket.bl_master || '',
      contenedor: ticket.contenedor || ''
    });
  };

  // Función para guardar los cambios de BL/Contenedor
  const saveEditBLContenedor = async () => {
    if (!editingTicket) return;
    setSavingEdit(true);
    try {
      await api.patch(`operaciones/tickets/${editingTicket.id}/`, {
        bl_master: editForm.bl_master.toUpperCase(),
        contenedor: editForm.contenedor.toUpperCase()
      });
      // Recargar la página para ver los cambios
      window.location.reload();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert(error.response?.data?.detail || 'Error al guardar los cambios');
    } finally {
      setSavingEdit(false);
      setEditingTicket(null);
    }
  };

  const isClosed = (group) => group.estatus === 'cerrado';
  const isPaid = (group) => group.estatus === 'pagado';

  // Filtrar conceptos visibles según rol
  const getVisibleTickets = (tickets) => {
    if (canSeeAllConceptos) return tickets;
    return tickets.filter(t => {
      if (role === 'revalidaciones') return t.tipo_operacion === 'revalidaciones';
      if (role === 'logistica') return t.tipo_operacion === 'logistica';
      if (role === 'clasificacion') return t.tipo_operacion === 'clasificacion';
      return true;
    });
  };

  // Calcular días exactos de multa
  const calcularDiasPenalty = (eta, tipoOperacion) => {
    if (!eta) return 0;
    let fechaEta;
    const etaStr = eta.toString();
    if (etaStr.includes('/')) {
      const [dia, mes, anio] = etaStr.split('/');
      fechaEta = new Date(`${anio}-${mes}-${dia}T00:00:00`);
    } else {
      fechaEta = new Date(`${etaStr.substring(0, 10)}T00:00:00`);
    }
    if (isNaN(fechaEta.getTime())) return 0;

    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const diffMs = hoy - fechaEta;
    const diasTranscurridos = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diasTranscurridos < 0) return 0;

    if (tipoOperacion === 'logistica') {
        return diasTranscurridos > 7 ? diasTranscurridos - 7 : 0;
    } else {
        return diasTranscurridos > 21 ? diasTranscurridos - 21 : 0;
    }
  };

  // Semáforo
  const calcularSemaforo = (eta, tipoOperacion, estatus) => {
    if (estatus === 'cerrado') {
        return { color: 'bg-slate-200', texto: 'Cerrado', dias: '-' };
    }
    if (!eta) return { color: 'bg-slate-300', texto: '-', dias: 0 };

    let fechaEta;
    const etaStr = eta.toString();
    if (etaStr.includes('/')) {
      const [dia, mes, anio] = etaStr.split('/');
      fechaEta = new Date(`${anio}-${mes}-${dia}T00:00:00`);
    } else {
      fechaEta = new Date(`${etaStr.substring(0, 10)}T00:00:00`);
    }

    if (isNaN(fechaEta.getTime())) return { color: 'bg-slate-300', texto: 'Error', dias: 0 };

    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const diffMs = hoy - fechaEta;
    const diasTranscurridos = Math.floor(diffMs / (1000 * 60 * 60 * 24)); 

    if (tipoOperacion === 'logistica') {
       if (diasTranscurridos < 0) {
           return { color: 'bg-sky-500', texto: 'En tránsito', dias: Math.abs(diasTranscurridos) };
       }
       const diasLibresTotales = 7;
       const restantes = diasLibresTotales - diasTranscurridos;
       if (diasTranscurridos <= 3) {
           return { color: 'bg-emerald-500', texto: 'Días libres', dias: restantes };
       }
       if (diasTranscurridos <= 6) {
           return { color: 'bg-yellow-400', texto: 'Por vencer', dias: restantes };
       }
       return { color: 'bg-red-600', texto: 'Almacenaje', dias: Math.abs(restantes) }; 
    } else {
        if (diasTranscurridos < 0) {
            const diasParaLlegar = Math.abs(diasTranscurridos);
            if (diasParaLlegar <= 10) return { color: 'bg-sky-500', texto: 'Por arribar', dias: diasParaLlegar };
            return { color: 'bg-slate-400', texto: 'En camino', dias: diasParaLlegar };
        }
        const LIMITE_TOTAL = 21; 
        const diasRestantesParaLimite = LIMITE_TOTAL - diasTranscurridos;
        if (diasTranscurridos > 21) {
            return { color: 'bg-red-600', texto: 'Demora', dias: diasTranscurridos - 21 };
        } else if (diasTranscurridos >= 15) {
            return { color: 'bg-orange-500', texto: 'Crítico', dias: diasRestantesParaLimite };
        } else if (diasTranscurridos >= 7) {
            return { color: 'bg-yellow-400', texto: 'Alerta', dias: diasRestantesParaLimite };
        }
        return { color: 'bg-emerald-500', texto: 'Libre', dias: diasRestantesParaLimite };
    }
  };

  // --- CÁLCULO DINÁMICO DE COLUMNAS PARA EL COLSPAN ---
  // Base: 11 columnas
  // Simple: 11
  // Full: 11 + 2 (EJ, Fecha) = 13
  // Full + Edit: 13 + 1 (Acciones) = 14
  const getColSpan = () => {
    let cols = 11; 
    if (!isSimpleView) cols += 2; 
    if (!isSimpleView && canEdit) cols += 1;
    return cols;
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 w-12 bg-slate-50"></th>
              {!isSimpleView && <th className="p-4 bg-slate-50 text-left">EJ</th>}
              <th className="p-4 bg-slate-50 text-left">Empresa</th>
              <th className="p-4 bg-slate-50 text-left min-w-[200px]">Identificador</th>
              {!isSimpleView && <th className="p-4 bg-slate-50 text-center">Fecha</th>}
              <th className="p-4 bg-slate-50 text-left">BL / Contenedor</th>
              <th className="p-4 bg-slate-50 text-left">Pedimento</th>  
              <th className="p-4 bg-slate-50 text-center">ETA</th>
              <th className="p-4 bg-slate-50 text-center font-bold">
                {role === 'logistica' ? 'Días libres almacenaje' : 
                role === 'revalidaciones' ? 'Días libres demora' : 
                'Estatus Operativo'}
              </th>             
              <th className="p-4 bg-slate-50 text-center text-red-600 font-bold">
                {role === 'logistica' ? 'Días Alm.' : 'Días Dem.'}
              </th>
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
                <React.Fragment key={group.uniqueKey}>
                  <tr className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${expandedRow === group.identifier ? 'bg-blue-50/30' : ''}`}>
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
                      <div className="flex items-center gap-2">
                        {/* Indicador de sensibilidad del contenido */}
                        {group.sensibilidad_contenido && group.sensibilidad_contenido !== 'verde' && (
                          <div
                            className={`w-3 h-3 rounded-full shadow-sm flex-shrink-0 ${
                              group.sensibilidad_contenido === 'rojo' ? 'bg-red-500' :
                              group.sensibilidad_contenido === 'amarillo' ? 'bg-yellow-400' :
                              'bg-emerald-500'
                            }`}
                            title={`Sensibilidad: ${
                              group.sensibilidad_contenido === 'rojo' ? 'Contenido sensible' :
                              group.sensibilidad_contenido === 'amarillo' ? 'Contenido tolerable' :
                              'Contenido común'
                            }`}
                          />
                        )}
                        <span className="inline-block px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono font-bold text-slate-700 shadow-sm">
                          {group.prefijo} {group.consecutivo || ''} {group.identifier}
                        </span>
                      </div>
                    </td>

                    {!isSimpleView && (
                      <td className="p-4 text-center text-xs text-slate-500">
                        {formatDate(group.tickets[0]?.fecha_alta)}
                      </td>
                    )}

                    <td className="p-4 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div>{group.bl_master || '-'}</div>
                          {group.contenedor && group.contenedor !== group.bl_master && (
                            <div className="text-slate-400">{group.contenedor}</div>
                          )}
                        </div>
                        {/* Botón de edición de BL/Contenedor (solo admin) */}
                        {canEditAll && (
                          <button
                            onClick={() => openEditModal(group.tickets[0])}
                            className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar BL/Contenedor"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-xs">{group.pedimento || '-'}</td>

                    <td className="p-4 text-center text-xs font-bold text-slate-700">
                      {group.eta ? formatDate(group.eta) : '-'}
                    </td>

                    <td className="p-4 text-center">
                      {(() => {
                        const esLogistica = group.isLogistica || role === 'logistica';
                        const info = calcularSemaforo(group.eta, esLogistica ? 'logistica' : 'revalidaciones', group.estatus);
                        
                        return (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div 
                              className={`w-4 h-4 rounded-full shadow-sm border-2 border-white ${info.color}`} 
                              title={info.texto}
                            ></div>
                            <span className={`text-[10px] font-bold tracking-wide ${
                              info.color.includes('red') ? 'text-red-600' : 
                              info.color.includes('orange') ? 'text-orange-600' :
                              info.color.includes('yellow') ? 'text-yellow-600' :
                              info.color.includes('emerald') ? 'text-emerald-600' : 'text-slate-500'
                            }`}>
                              {info.dias} {
                                info.texto === 'Cerrado' ? '' :
                                info.color.includes('red') ? 'días ex' : 
                                info.texto === 'Libre' || info.texto === 'Días libres' ? 'días rest' : 
                                info.texto === 'Por arribar' ? 'días para' : 'días'
                              }
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    
                    <td className="p-4 text-center">
                      {(() => {
                        const esLogistica = group.isLogistica || role === 'logistica';
                        const diasExtra = calcularDiasPenalty(group.eta, esLogistica ? 'logistica' : 'revalidaciones');
                        
                        return (
                          <div className={`font-mono font-bold text-sm ${diasExtra > 0 ? 'text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100' : 'text-slate-300'}`}>
                            {diasExtra > 0 ? `+${diasExtra}` : '-'}
                          </div>
                        );
                      })()}
                    </td>
                    
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {visibleTickets.length}
                      </span>
                    </td>

                    <td className="p-4 text-right font-bold">
                      {group.es_apertura_expediente && group.totalImporte === 0 ? (
                        <span className="inline-flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1 rounded-full text-xs">
                          <FolderOpen size={14} />
                          Apertura de expediente
                        </span>
                      ) : (
                        <span className="text-slate-800">
                          ${group.totalImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      )}
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

                  {expandedRow === group.identifier && (
                    <tr className="bg-slate-50">
                      {/* --- CORRECCIÓN DE COLSPAN --- */}
                      <td colSpan={getColSpan()} className="p-0 border-b-2 border-slate-200">
                        <div className="p-6">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <DollarSign size={14} />
                            Desglose de pagos ({visibleTickets.length} conceptos)
                          </h4>
                          
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
                                  <th className="p-3 text-center font-bold">Comprobante</th>
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
                                    <td className="p-3 text-center">
                                      {ticket.comprobante_pago ? (
                                        <a
                                          href={ticket.comprobante_pago}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                          title="Descargar comprobante"
                                        >
                                          <Download size={14} />
                                        </a>
                                      ) : (
                                        <span className="text-slate-300">-</span>
                                      )}
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
                                  <td></td>
                                  {canPay && <td></td>}
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          <div className="flex justify-end gap-3">
                            {canPay && !groupIsPaid && !groupIsClosed && visibleTickets.some(t => t.estatus === 'pendiente') && (
                              <button 
                                onClick={() => {
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
                                  onCloseOperation && onCloseOperation(group.tickets[0], group.tickets);
                                }}              
                                className="px-4 py-2 bg-slate-800 text-white font-bold rounded shadow hover:bg-slate-900 text-xs flex items-center"
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

        {filteredGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Search size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay contenedores para mostrar</p>
            <p className="text-sm">Crea un nuevo contenedor desde "Alta de pago"</p>
          </div>
        )}
      </div>

      {/* Modal de edición de BL/Contenedor (solo admin) */}
      {editingTicket && canEditAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit size={20} />
                Editar BL / Contenedor
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                Solo el administrador puede modificar estos campos
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  BL Master
                </label>
                <input
                  type="text"
                  value={editForm.bl_master}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bl_master: e.target.value.toUpperCase() }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                  placeholder="Ingresa el BL Master"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  # Contenedor
                </label>
                <input
                  type="text"
                  value={editForm.contenedor}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contenedor: e.target.value.toUpperCase() }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                  placeholder="Ingresa el número de contenedor"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
              <button
                onClick={() => setEditingTicket(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditBLContenedor}
                disabled={savingEdit}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingEdit ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListView;