// src/views/SabanaView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ListView from './ListView';
import { Ship, Truck, FileCheck, Filter, MapPin, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const SabanaView = ({ 
  onPayAll, 
  onCloseOperation, 
  onEdit, 
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
    return 'revalidaciones';
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [filteredPuerto, setFilteredPuerto] = useState('todos');
  
  // Ref para evitar doble fetch
  const fetchingRef = useRef(false);

  // Fetch de tickets
  const fetchTickets = async (tab, puerto) => {
    if (fetchingRef.current) return;
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

  // Fetch inicial
  useEffect(() => {
    const tab = getInitialTab();
    console.log('Fetch inicial con tab:', tab);
    fetchTickets(tab, 'todos');
  }, []); // Solo al montar

  // Cuando cambia el tab manualmente
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    fetchTickets(newTab, filteredPuerto);
  };

  // Cuando cambia el filtro de puerto
  const handlePuertoChange = (newPuerto) => {
    setFilteredPuerto(newPuerto);
    fetchTickets(activeTab, newPuerto);
  };

  const tabs = [
    { id: 'todos', label: 'Todos', icon: Filter, color: 'slate' },  // <-- Agregar este
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
                isRevalidaciones ? 'bg-blue-100 text-blue-600' :
                isLogistica ? 'bg-cyan-100 text-cyan-600' :
                'bg-pink-100 text-pink-600'
              }`}>
                {isRevalidaciones && <Ship size={24} />}
                {isLogistica && <Truck size={24} />}
                {isClasificacion && <FileCheck size={24} />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Sabana de {isRevalidaciones ? 'Revalidaciones' : isLogistica ? 'Logistica' : 'Clasificacion'}
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
                onClick={() => fetchTickets(activeTab, filteredPuerto)}
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
                {filteredPuerto !== 'todos' && (
                  <> en <strong className="text-slate-700">
                    {puertoOptions.find(p => p.value === filteredPuerto)?.label}
                  </strong></>
                )}
                <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                  {data.length} registros
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      <ListView
        data={data}
        onPayAll={async (ticketId) => {
          await onPayAll(ticketId);
          fetchTickets(activeTab, filteredPuerto);  // Refrescar después de pagar
        }}
        onCloseOperation={onCloseOperation}
        role={role}
        onEdit={onEdit}
        loading={loading}
      />
    </div>
  );
};

export default SabanaView;