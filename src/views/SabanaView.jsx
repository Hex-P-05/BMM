// src/views/SabanaView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ListView from './ListView';
import { Ship, Truck, FileCheck, Filter, MapPin, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import PaymentModal from '../modals/PaymentModal'; // <--- 1. IMPORTAR MODAL

const SabanaView = ({
  // onPayAll original del padre (se usa como fallback o para refrescar globales)
  onPayAll,
  onCloseOperation,
  onEdit,
  refreshKey = 0,
}) => {
  const {
    role,
    isAdmin,
    isPagos,
    isRevalidaciones,
    isLogistica,
    isClasificacion,
    esGlobal,
    puertoCodigo,
  } = useAuth();

  const getInitialTab = () => {
    if (isLogistica) return 'logistica';
    if (isClasificacion) return 'clasificacion';
    return 'revalidaciones';
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [filteredPuerto, setFilteredPuerto] = useState('todos');
  
  // --- 2. ESTADO PARA EL MODAL DE PAGO ---
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, item: null });
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchingRef = useRef(false);

  const fetchTickets = async (tab, puerto, force = false) => {
    if (fetchingRef.current && !force) return;
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (tab !== 'todos') params.append('tipo_operacion', tab);
      if (esGlobal && puerto !== 'todos') params.append('puerto', puerto);
      
      const response = await api.get(`/operaciones/tickets/?${params.toString()}`);
      const tickets = response.data.results || response.data;
      setData(tickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setData([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    const correctTab = getInitialTab();
    if (correctTab !== activeTab && !isAdmin && !isPagos) {
      setActiveTab(correctTab);
      fetchTickets(correctTab, filteredPuerto, true);
    } else {
      fetchTickets(activeTab, filteredPuerto);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevalidaciones, isLogistica, isClasificacion, puertoCodigo]);

  useEffect(() => {
    if (refreshKey > 0) {
      fetchTickets(activeTab, filteredPuerto, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]); 

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    fetchTickets(newTab, filteredPuerto, true);
  };

  const handlePuertoChange = (newPuerto) => {
    setFilteredPuerto(newPuerto);
    fetchTickets(activeTab, newPuerto, true);
  };

  // --- 3. NUEVA LÓGICA: ABRIR MODAL AL DAR CLIC EN "PAGAR" ---
  const handleOpenPaymentModal = (ticketId) => {
    // Buscamos el ticket completo en la data local para mostrar info en el modal
    const ticket = data.find(t => t.id === ticketId);
    if (ticket) {
      setPaymentModal({ isOpen: true, item: ticket });
    }
  };

  // --- 4. NUEVA LÓGICA: EJECUTAR PAGO CON ARCHIVO (FormData) ---
  const handleExecutePayment = async (ticketId, file) => {
    setPaymentLoading(true);
    try {
      // Usamos FormData para enviar campos + archivo
      const payload = new FormData();
      payload.append('estatus', 'pagado');
      payload.append('fecha_pago', new Date().toISOString().split('T')[0]);
      
      if (file) {
        payload.append('comprobante_pago', file);
      }

      // Llamada directa a la API (PATCH)
      const response = await api.patch(`/operaciones/tickets/${ticketId}/`, payload);
      
      if (response.data) {
        // Actualizar la tabla localmente sin recargar todo
        setData(prevData => prevData.map(ticket => 
          ticket.id === ticketId 
            ? { 
                ...ticket, 
                estatus: 'pagado',
                // Si el backend devuelve el objeto actualizado con la URL del archivo, la guardamos
                comprobante_pago: response.data.comprobante_pago || ticket.comprobante_pago 
              }
            : ticket
        ));
        
        // Cerrar modal
        setPaymentModal({ isOpen: false, item: null });
      }
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('Error al registrar el pago. Verifique la consola.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const tabs = [
    { id: 'todos', label: 'Todos', icon: Filter, color: 'slate' },
    { id: 'revalidaciones', label: 'Revalidaciones', icon: Ship, color: 'blue' },
    { id: 'logistica', label: 'Logistica', icon: Truck, color: 'cyan' },
    { id: 'clasificacion', label: 'Clasificacion', icon: FileCheck, color: 'pink' },
  ];

  const puertoOptions = [
    { value: 'todos', label: 'Todos los puertos' },
    { value: 'MZN', label: 'Manzanillo' },
    { value: 'LZC', label: 'Lazaro Cardenas' },
  ];

  const canSwitchSabanas = isAdmin || isPagos;

  return (
    <div className="space-y-4">
      {/* --- HEADER DE FILTROS (Sin cambios) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {canSwitchSabanas ? (
            <div className="flex gap-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? 'text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    style={isActive ? { 
                        backgroundColor: tab.color === 'slate' ? '#475569' :
                                        tab.color === 'blue' ? '#2563eb' : 
                                        tab.color === 'cyan' ? '#0891b2' : 
                                        '#db2777'
                      } : {}}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                activeTab === 'revalidaciones' ? 'bg-blue-100 text-blue-600' :
                activeTab === 'logistica' ? 'bg-cyan-100 text-cyan-600' :
                'bg-pink-100 text-pink-600'
              }`}>
                {activeTab === 'revalidaciones' && <Ship size={24} />}
                {activeTab === 'logistica' && <Truck size={24} />}
                {activeTab === 'clasificacion' && <FileCheck size={24} />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Sabana de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-sm text-slate-500">
                  Puerto: {puertoCodigo || 'No asignado'}
                </p>
              </div>
            </div>
          )}

          {canSwitchSabanas && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-slate-400" />
                <select
                  value={filteredPuerto}
                  onChange={(e) => handlePuertoChange(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {puertoOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => fetchTickets(activeTab, filteredPuerto, true)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
        </div>
        
        {canSwitchSabanas && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter size={14} />
              <span>
                Mostrando: <strong className="text-slate-700">
                  {tabs.find(t => t.id === activeTab)?.label}
                </strong>
                <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                  {data.length} registros
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      <ListView
        key={activeTab} 
        data={data}
        // --- 5. INTERCEPTAMOS EL ONPAYALL ---
        // En lugar de llamar a la prop del padre, abrimos nuestro modal local
        onPayAll={handleOpenPaymentModal} 
        
        onCloseOperation={async (ticketPrincipal, ticketsDelGrupo) => {
          await onCloseOperation(ticketPrincipal, ticketsDelGrupo);
          
          if (ticketsDelGrupo && ticketsDelGrupo.length > 0) {
            const idsCerrados = ticketsDelGrupo.map(t => t.id);
            setData(prevData => prevData.map(ticket => 
              idsCerrados.includes(ticket.id) 
                ? { ...ticket, estatus: 'cerrado' } 
                : ticket
            ));
          } else {
             setData(prevData => prevData.map(ticket => 
              ticket.id === ticketPrincipal.id 
                ? { ...ticket, estatus: 'cerrado' } 
                : ticket
            ));
          }
        }}
        role={role}
        onEdit={onEdit}
        loading={loading}
      />

      {/* --- 6. RENDERIZAMOS EL MODAL DE PAGO --- */}
      <PaymentModal 
        isOpen={paymentModal.isOpen}
        item={paymentModal.item}
        onClose={() => setPaymentModal({ isOpen: false, item: null })}
        onConfirm={handleExecutePayment}
        loading={paymentLoading}
      />
    </div>
  );
};

export default SabanaView;