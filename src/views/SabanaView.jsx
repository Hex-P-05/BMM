// src/views/SabanaView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ListView from './ListView';
import { Ship, Truck, FileCheck, Filter, MapPin, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const SabanaView = ({
  // No usamos la prop 'data' de App para evitar conflictos,
  // cargamos todo aquí para controlar las pestañas.
  onPayAll,
  onCloseOperation,
  onEdit,
  // Prop para forzar refresh desde afuera (cuando se crea una operación)
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

  // Determinar tab inicial según rol
  const getInitialTab = () => {
    if (isLogistica) return 'logistica';
    if (isClasificacion) return 'clasificacion';
    return 'revalidaciones'; // Por defecto siempre cae aquí
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [filteredPuerto, setFilteredPuerto] = useState('todos');
  
  // Ref para evitar doble fetch solo en el mismo tab
  const fetchingRef = useRef(false);

  const fetchTickets = async (tab, puerto, force = false) => {
    // Si ya está buscando y no es forzado, salimos
    if (fetchingRef.current && !force) return;
    
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      
      // Solo filtrar por tipo si NO es "todos"
      if (tab !== 'todos') {
        params.append('tipo_operacion', tab);
      }
      
      if (esGlobal && puerto !== 'todos') {
        params.append('puerto', puerto);
      }
      
      console.log('Fetching:', `/api/operaciones/tickets/?${params.toString()}`);
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

  // 1. EFECTO MAESTRO: Detecta cuando el rol termina de cargar
  // Si entras como Logística, primero carga Revalidaciones (default).
  // Este efecto detecta el cambio a Logística y corrige el rumbo automáticamente.
  useEffect(() => {
    const correctTab = getInitialTab();

    // Si el tab actual no coincide con el rol real del usuario (y no es Admin/Pagos que pueden ver todo)
    if (correctTab !== activeTab && !isAdmin && !isPagos) {
      console.log(`Corrigiendo Tab: de ${activeTab} a ${correctTab}`);
      setActiveTab(correctTab);
      // Forzamos el fetch inmediatamente
      fetchTickets(correctTab, filteredPuerto, true);
    } else {
      // Carga inicial normal
      fetchTickets(activeTab, filteredPuerto);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevalidaciones, isLogistica, isClasificacion, puertoCodigo]);

  // 2. EFECTO DE REFRESH: Cuando refreshKey cambia, refrescamos los datos
  // Esto permite que App.jsx fuerce un refresh después de crear operaciones/pagos
  useEffect(() => {
    if (refreshKey > 0) {
      console.log('SabanaView: Refresh forzado desde App');
      fetchTickets(activeTab, filteredPuerto, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]); 


  // Cuando cambia el tab manualmente
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Forzamos fetch al cambiar de tab
    fetchTickets(newTab, filteredPuerto, true);
  };

  const handlePuertoChange = (newPuerto) => {
    setFilteredPuerto(newPuerto);
    fetchTickets(activeTab, newPuerto, true);
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
        
        {/* Info bar opcional */}
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
        // === LA CLAVE ===
        // Al poner el key con el nombre del tab, obligamos a React a borrar 
        // la tabla vieja y pintar una nueva cuando cambia de Revalidaciones a Logística.
        // Esto asegura que las columnas se recalculen desde cero.
        key={activeTab} 
        
        data={data}
        onPayAll={async (ticketId) => {
          await onPayAll(ticketId);
          setData(prevData => prevData.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, estatus: 'pagado' }
              : ticket
          ));
        }}
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
    </div>
  );
};

export default SabanaView;