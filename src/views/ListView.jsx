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
  // CORRECCIÓN: Ahora agrupamos también por CONSECUTIVO para respetar la lógica del cliente
  const groupedData = useMemo(() => {
    const groups = {};
    
    data.forEach(ticket => {
      // Determinar el identificador principal
      const isLogistica = ticket.tipo_operacion === 'logistica';
      
      // Lógica de agrupación:
      // 1. Usamos el Contenedor (Logística) o BL (Revalidación) como eje principal.
      // 2. Si el cliente quiere ver "XAO 1" separado de "XAO 2", agregamos el consecutivo a la llave.
      
      const baseId = isLogistica 
        ? (ticket.contenedor || ticket.bl_master || 'SIN-ID')
        : (ticket.bl_master || ticket.contenedor || 'SIN-ID');
      
      // IMPORTANTE: Agrupamos por ID + CONSECUTIVO para que XAO 1 no se mezcle con XAO 2
      // Si prefieres ver todo el contenedor junto, quita `ticket.consecutivo` de aquí.
      const uniqueGroupKey = `${baseId}-${ticket.prefijo}-${ticket.consecutivo}`;

      if (!groups[uniqueGroupKey]) {
        groups[uniqueGroupKey] = {
          uniqueKey: uniqueGroupKey, // Llave técnica para React
          identifier: baseId,         // Lo que mostramos visualmente (HOLA123)
          consecutivo: ticket.consecutivo, // Para mostrar "XAO 1"
          prefijo: ticket.prefijo,
          
          isLogistica,
          tickets: [],
          
          // Datos "Cabecera" (Tomamos del primer ticket, asumiendo que son iguales en el grupo)
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
          estatus: 'pendiente'
        };
      }
      
      // Agregamos el ticket al grupo
      groups[uniqueGroupKey].tickets.push(ticket);
      
      // Sumamos el importe
      groups[uniqueGroupKey].totalImporte += parseFloat(ticket.importe) || 0;
      
      // Actualizar semáforo al peor caso
      // Agregamos 'azul' con prioridad baja o media según prefieras. 
      // Aquí lo pongo bajo el verde porque es informativo, no urgente.
      const semaforoPriority = { 
        'vencido': 5, 
        'rojo': 4, 
        'amarillo': 3, 
        'azul': 2,    // <--- NUEVO (Informativo, más relevante que verde simple)
        'verde': 1 
      };
      
      if (semaforoPriority[ticket.semaforo] > semaforoPriority[groups[uniqueGroupKey].semaforo]) {
        groups[uniqueGroupKey].semaforo = ticket.semaforo;
      }
      
      // Lógica de estatus del grupo:
      // Si todos están pagados -> Pagado
      // Si uno está pendiente -> Pendiente
      // Si está cerrado -> Cerrado
      const currentStatus = groups[uniqueGroupKey].estatus;
      if (ticket.estatus === 'cerrado') {
          groups[uniqueGroupKey].estatus = 'cerrado';
      } else if (ticket.estatus === 'pendiente' && currentStatus !== 'cerrado') {
          groups[uniqueGroupKey].estatus = 'pendiente';
      } else if (ticket.estatus === 'pagado' && currentStatus === 'pagado') {
          // Se mantiene pagado si todos van pagados
      }
      
    });
    
    // Segunda pasada para definir estatus final de grupos mixtos (algunos pagados, otros no)
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

  // --- NUEVA LÓGICA DE SEMÁFORO ---
  // --- LÓGICA MAESTRA DE SEMÁFORO (FINAL v2) ---
  const calcularSemaforo = (eta, tipoOperacion) => {
    // 1. Validaciones
    if (!eta) return { color: 'bg-slate-300', texto: '-', dias: 0 };

    // 2. Limpieza de Fecha
    let fechaEta;
    const etaStr = eta.toString();
    if (etaStr.includes('/')) {
      const [dia, mes, anio] = etaStr.split('/');
      fechaEta = new Date(`${anio}-${mes}-${dia}T00:00:00`);
    } else {
      fechaEta = new Date(`${etaStr.substring(0, 10)}T00:00:00`);
    }

    if (isNaN(fechaEta.getTime())) return { color: 'bg-slate-300', texto: 'Error', dias: 0 };

    // 3. Días transcurridos (Hoy - ETA)
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const diffMs = hoy - fechaEta;
    const diasTranscurridos = Math.floor(diffMs / (1000 * 60 * 60 * 24)); 

    // =========================================================
    // CASO A: LOGÍSTICA (7 Días libres | Verde -> Amarillo -> Rojo)
    // =========================================================
    if (tipoOperacion === 'logistica') {
       // --- 1. Antes de llegar: Azul ---
       if (diasTranscurridos < 0) {
           return { color: 'bg-sky-500', texto: 'En tránsito', dias: Math.abs(diasTranscurridos) };
       }
       
       // --- 2. Ya llegó (Cuenta de días libres restantes) ---
       const diasLibresTotales = 7;
       const restantes = diasLibresTotales - diasTranscurridos;

       // Verde: 0 a 3 días después de ETA (Te quedan 7, 6, 5 o 4 días)
       if (diasTranscurridos <= 3) {
           return { color: 'bg-emerald-500', texto: 'Días libres', dias: restantes };
       }
       
       // Amarillo: 4 a 6 días después de ETA (Te quedan 3, 2 o 1 día)
       if (diasTranscurridos <= 6) {
           return { color: 'bg-yellow-400', texto: 'Por vencer', dias: restantes };
       }

       // Rojo: 7 días o más (Se acabaron los 7 libres, empieza el cobro)
       // día 7 = 1 día de almacenaje
       return { color: 'bg-red-600', texto: 'Almacenaje', dias: Math.abs(restantes) }; 
    }

    // =========================================================
    // CASO B: REVALIDACIÓN (Ciclo de 21 Días)
    // =========================================================
    else {
        // Azul: Antes de llegar
        if (diasTranscurridos < 0) {
            const diasParaLlegar = Math.abs(diasTranscurridos);
            if (diasParaLlegar <= 10) return { color: 'bg-sky-500', texto: 'Por arribar', dias: diasParaLlegar };
            return { color: 'bg-slate-400', texto: 'En camino', dias: diasParaLlegar };
        }

        // Cuenta regresiva hacia el límite de 21 días
        const LIMITE_TOTAL = 21; 
        const diasRestantesParaLimite = LIMITE_TOTAL - diasTranscurridos;

        if (diasTranscurridos > 21) {
            return { color: 'bg-red-600', texto: 'Demora', dias: diasTranscurridos - 21 };
        } else if (diasTranscurridos >= 15) {
            return { color: 'bg-orange-500', texto: 'Crítico', dias: diasRestantesParaLimite };
        } else if (diasTranscurridos >= 7) {
            return { color: 'bg-yellow-400', texto: 'Alerta', dias: diasRestantesParaLimite };
        }

        // Verde (0-6 días)
        return { color: 'bg-emerald-500', texto: 'Libre', dias: diasRestantesParaLimite };
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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              {/* Solo dejamos una columna para la flecha de expandir */}
              <th className="p-4 w-12 bg-slate-50"></th>
              
              {!isSimpleView && <th className="p-4 bg-slate-50 text-left">EJ</th>}
              <th className="p-4 bg-slate-50 text-left">Empresa</th>
              <th className="p-4 bg-slate-50 text-left min-w-[200px]">Identificador</th>
              {!isSimpleView && <th className="p-4 bg-slate-50 text-center">Fecha</th>}
              <th className="p-4 bg-slate-50 text-left">BL / Contenedor</th>
              <th className="p-4 bg-slate-50 text-left">Pedimento</th>  
              <th className="p-4 bg-slate-50 text-center">ETA</th>
              {/* Título dinámico según el rol */}
              <th className="p-4 bg-slate-50 text-center font-bold">
                {role === 'logistica' ? 'Días libres almacenaje' : 
                role === 'revalidaciones' ? 'Días libres demora' : 
                'Estatus Operativo'}
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
                <React.Fragment key={group.identifier}>
                  {/* Fila principal del grupo */}
                  <tr className={`hover:bg-slate-50 border-b border-slate-100 transition-colors ${expandedRow === group.identifier ? 'bg-blue-50/30' : ''}`}>
                    
                    {/* --- ELIMINADO EL TD DEL SEMÁFORO QUE ESTABA AQUÍ --- */}

                    {/* Columna 1: Flecha (ahora es la primera) */}
                    <td className="p-4 text-center cursor-pointer" onClick={() => toggleRow(group.identifier)}>
                      {expandedRow === group.identifier 
                        ? <ChevronUp size={18} className="text-blue-500"/> 
                        : <ChevronDown size={18} className="text-slate-400"/>
                      }
                    </td>

                    {/* Columna: EJ (Oculta en simple) */}
                    {!isSimpleView && (
                      <td className="p-4 font-bold text-slate-400 text-xs">
                        {group.ejecutivo?.split(' ')[0]?.toUpperCase() || '-'}
                      </td>
                    )}

                    {/* Columna: Empresa */}
                    <td className="p-4 font-bold text-slate-700">{group.empresa}</td>

                    {/* Columna: Identificador */}
                    <td className="p-4">
                      <span className="inline-block px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono font-bold text-slate-700 shadow-sm">
                        {group.prefijo} {group.tickets[0]?.consecutivo || ''} {group.identifier}
                      </span>
                    </td>

                    {/* Columna: Fecha Alta (Oculta en simple) */}
                    {!isSimpleView && (
                      <td className="p-4 text-center text-xs text-slate-500">
                        {formatDate(group.tickets[0]?.fecha_alta)}
                      </td>
                    )}

                    {/* Columna: BL / Contenedor */}
                    <td className="p-4 font-mono text-xs">
                      <div>{group.bl_master || '-'}</div>
                      {group.contenedor && group.contenedor !== group.bl_master && (
                        <div className="text-slate-400">{group.contenedor}</div>
                      )}
                    </td>

                    {/* Columna: Pedimento */}
                    <td className="p-4 text-xs">{group.pedimento || '-'}</td>

                   {/* --- COLUMNA 1: ETA (FECHA) --- */}
                    <td className="p-4 text-center text-xs font-bold text-slate-700">
                      {/* Si hay fecha la mostramos, si no, un guión */}
                      {group.eta ? formatDate(group.eta) : '-'}
                    </td>

                    {/* --- COLUMNA 2: SEMÁFORO INTELIGENTE --- */}
                    <td className="p-4 text-center">
                      {(() => {
                        // 1. Calculamos el estado para esta fila específica
                        const esLogistica = group.isLogistica || role === 'logistica';
                        const info = calcularSemaforo(group.eta, esLogistica ? 'logistica' : 'revalidaciones');
                        
                        return (
                          <div className="flex flex-col items-center justify-center gap-1">
                            {/* Bolita de color */}
                            <div 
                              className={`w-4 h-4 rounded-full shadow-sm border-2 border-white ${info.color}`} 
                              title={info.texto}
                            ></div>
                            
                            {/* Texto: Muestra días restantes o días de exceso si es rojo */}
                            <span className={`text-[10px] font-bold tracking-wide ${
                              info.color.includes('red') ? 'text-red-600' : 
                              info.color.includes('orange') ? 'text-orange-600' :
                              info.color.includes('yellow') ? 'text-yellow-600' :
                              info.color.includes('emerald') ? 'text-emerald-600' : 'text-slate-500'
                            }`}>
                              {info.dias} {info.color.includes('red') ? 'días ex' : 
                                           info.texto === 'Libre' || info.texto === 'Días libres' ? 'días rest' : 
                                           info.texto === 'Por arribar' ? 'días para' : 'días'}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Columna: Conteo Conceptos */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {visibleTickets.length}
                      </span>
                    </td>

                    {/* Columna: Total */}
                    <td className="p-4 text-right font-bold text-slate-800">
                      ${group.totalImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Columna: Estado */}
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        groupIsClosed ? 'bg-slate-200 text-slate-600' :
                        groupIsPaid ? 'bg-green-100 text-green-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {groupIsClosed ? 'Cerrado' : groupIsPaid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>

                    {/* Columna: Acciones */}
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
                      <td colSpan={isSimpleView ? 10 : 12} className="p-0 border-b-2 border-slate-200">
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