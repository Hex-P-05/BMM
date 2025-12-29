// src/views/SabanaView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ListView from './ListView';
import { Ship, Truck, FileCheck, Filter, MapPin } from 'lucide-react';

const SabanaView = ({ 
  data = [], 
  onPayAll, 
  onCloseOperation, 
  onEdit, 
  loading,
  puertos = []
}) => {
  const {
    role,
    isAdmin,
    isPagos,
    isRevalidaciones,
    isLogistica,
    isClasificacion,
    esGlobal,
    puertoId,
    puertoCodigo,
  } = useAuth();

  // Tab activa (para Admin/Pagos que pueden ver todas)
  const [activeTab, setActiveTab] = useState('revalidaciones');
  
  // Filtro de puerto (para Admin/Pagos)
  const [filteredPuerto, setFilteredPuerto] = useState('todos');

  // Determinar qué sábana mostrar según el rol
  useEffect(() => {
    if (isRevalidaciones) {
      setActiveTab('revalidaciones');
    } else if (isLogistica) {
      setActiveTab('logistica');
    } else if (isClasificacion) {
      setActiveTab('clasificacion');
    }
    // Admin y Pagos mantienen su selección
  }, [isRevalidaciones, isLogistica, isClasificacion]);

  // Filtrar datos por sábana/tipo
  const getFilteredData = () => {
    let filtered = [...data];

    // Si NO es global, filtrar por puerto del usuario
    if (!esGlobal && puertoId) {
      filtered = filtered.filter(item => {
        const itemPuertoId = item.puerto_id || item.puerto?.id;
        return itemPuertoId === puertoId;
      });
    }

    // Si ES global y tiene filtro de puerto seleccionado
    if (esGlobal && filteredPuerto !== 'todos') {
      filtered = filtered.filter(item => {
        const itemPuertoCodigo = item.puerto_codigo || item.puerto?.codigo;
        return itemPuertoCodigo === filteredPuerto;
      });
    }

    // TODO: Cuando tengamos endpoints separados, filtrar por tipo de sábana
    // Por ahora mostramos todos los tickets
    
    return filtered;
  };

  const filteredData = getFilteredData();

  // Tabs disponibles para Admin/Pagos
  const tabs = [
    { id: 'revalidaciones', label: 'Revalidaciones', icon: Ship, color: 'blue' },
    { id: 'logistica', label: 'Logística', icon: Truck, color: 'cyan' },
    { id: 'clasificacion', label: 'Clasificación', icon: FileCheck, color: 'pink' },
  ];

  // Opciones de puerto para filtro
  const puertoOptions = [
    { value: 'todos', label: 'Todos los puertos' },
    { value: 'MZN', label: 'Manzanillo' },
    { value: 'LZC', label: 'Lázaro Cárdenas' },
  ];

  // ¿Puede ver múltiples sábanas?
  const canSwitchSabanas = isAdmin || isPagos;

  return (
    <div className="space-y-4">
      {/* Header con tabs y filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Tabs de sábana (solo Admin/Pagos) */}
          {canSwitchSabanas ? (
            <div className="flex gap-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      isActive
                        ? `bg-${tab.color}-600 text-white shadow-md`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    style={isActive ? { 
                      backgroundColor: tab.color === 'blue' ? '#2563eb' : 
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
            // Título para usuarios con rol específico
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
                  Sábana de {isRevalidaciones ? 'Revalidaciones' : isLogistica ? 'Logística' : 'Clasificación'}
                </h2>
                <p className="text-sm text-slate-500">
                  Puerto: {puertoCodigo || 'No asignado'}
                </p>
              </div>
            </div>
          )}

          {/* Filtro de puerto (solo Admin/Pagos) */}
          {canSwitchSabanas && (
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-slate-400" />
              <select
                value={filteredPuerto}
                onChange={(e) => setFilteredPuerto(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {puertoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Info de sábana activa para Admin/Pagos */}
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
                  {filteredData.length} registros
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de datos */}
      <ListView
        data={filteredData}
        onPayAll={onPayAll}
        onCloseOperation={onCloseOperation}
        role={role}
        onEdit={onEdit}
        loading={loading}
      />
    </div>
  );
};

export default SabanaView;