// src/views/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Anchor, Truck, Briefcase, 
  Plus, Edit2, Trash2, Search, Save, X, Database, CheckCircle
} from 'lucide-react';

// --- CONFIGURACIÓN DE LOS CATÁLOGOS ---
const CATALOGOS_CONFIG = {
  empresas: {
    label: 'Empresas',
    desc: 'Mis razones sociales',
    icon: Building2,
    fields: [
      { key: 'nombre', label: 'Razón Social', type: 'text' },
      { key: 'rfc', label: 'RFC', type: 'text' },
      { key: 'direccion', label: 'Dirección Fiscal', type: 'text' }
    ]
  },
  clientes: {
    label: 'Clientes',
    desc: 'Cartera de clientes',
    icon: Users,
    fields: [
      { key: 'nombre', label: 'Nombre Cliente', type: 'text' },
      { key: 'contacto', label: 'Nombre Contacto', type: 'text' },
      { key: 'email', label: 'Correo Electrónico', type: 'email' }
    ]
  },
  proveedores: {
    label: 'Proveedores',
    desc: 'Navieras y transporte',
    icon: Truck,
    fields: [
      { key: 'nombre', label: 'Nombre Proveedor', type: 'text' },
      { key: 'servicio', label: 'Tipo Servicio', type: 'select', options: ['Transporte', 'Naviera', 'Patio', 'Otro'] }
    ]
  },
  puertos: {
    label: 'Puertos',
    desc: 'Aduanas activas',
    icon: Anchor,
    fields: [
      { key: 'nombre', label: 'Nombre Puerto', type: 'text' },
      { key: 'codigo', label: 'Código (3 letras)', type: 'text' },
      { key: 'pais', label: 'País', type: 'text' }
    ]
  },
  trabajadores: {
    label: 'Usuarios',
    desc: 'Accesos al sistema',
    icon: Briefcase,
    fields: [
      { key: 'nombre', label: 'Nombre Completo', type: 'text' },
      { key: 'email', label: 'Usuario/Email', type: 'text' },
      { key: 'rol', label: 'Rol', type: 'select', options: ['admin', 'operativo', 'pagos', 'visita'] }
    ]
  }
};

const AdminPanel = () => {
  const [activeCatalog, setActiveCatalog] = useState('empresas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // --- DATOS SIMULADOS ---
  const [fakeData, setFakeData] = useState({
    empresas: [
      { id: 1, nombre: 'AduanaSoft SA de CV', rfc: 'ADM230101XYZ', direccion: 'Av. Reforma 222' }
    ],
    clientes: [
      { id: 2, nombre: 'Cliente Ejemplo S.A.', contacto: 'Juan Pérez', email: 'juan@cliente.com' }
    ],
    proveedores: [],
    puertos: [
      { id: 3, nombre: 'Manzanillo', codigo: 'ZLO', pais: 'México' }
    ],
    trabajadores: []
  });

  // Limpiar búsqueda al cambiar de catálogo
  useEffect(() => {
    setSearchTerm('');
    setIsModalOpen(false);
    setEditingItem(null);
  }, [activeCatalog]);

  const currentConfig = CATALOGOS_CONFIG[activeCatalog];
  const currentData = fakeData[activeCatalog] || [];

  const filteredData = currentData.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(val => 
      String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // --- HANDLERS ---
  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar registro?')) {
      setFakeData(prev => ({
        ...prev,
        [activeCatalog]: prev[activeCatalog].filter(i => i.id !== id)
      }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (editingItem) {
      setFakeData(prev => ({
        ...prev,
        [activeCatalog]: prev[activeCatalog].map(i => i.id === editingItem.id ? { ...i, ...data } : i)
      }));
    } else {
      const newItem = { id: Date.now(), ...data };
      setFakeData(prev => ({
        ...prev,
        [activeCatalog]: [...prev[activeCatalog], newItem]
      }));
    }
    setIsModalOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* 1. SELECCIÓN DE CATÁLOGO (Grid Superior) */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Selecciona un catálogo para administrar:</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(CATALOGOS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeCatalog === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCatalog(key)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                  ${isActive 
                    ? 'border-blue-500 bg-blue-50 shadow-sm transform scale-[1.02]' 
                    : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <div className={`p-3 rounded-full mb-2 ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon size={24} />
                </div>
                <span className={`font-bold text-sm ${isActive ? 'text-blue-700' : 'text-slate-600'}`}>
                  {config.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 hidden md:block">
                  {config.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ÁREA DE TRABAJO (Tabla y Buscador) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
        
        {/* Header de la Tabla */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-t-xl">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {currentConfig.label}
              <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded-full text-slate-500 border border-slate-200">
                {filteredData.length} registros
              </span>
            </h1>
          </div>
          
          <div className="flex w-full sm:w-auto gap-3">
             <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder={`Buscar en ${currentConfig.label}...`}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button 
               onClick={handleAddNew}
               className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm shadow-sm whitespace-nowrap"
             >
               <Plus size={18} className="mr-2" />
               Nuevo
             </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {filteredData.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  {currentConfig.fields.map(field => (
                    <th key={field.key} className="p-4 whitespace-nowrap">{field.label}</th>
                  ))}
                  <th className="p-4 text-right w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {currentConfig.fields.map(field => (
                      <td key={`${item.id}-${field.key}`} className="p-4 text-slate-700 font-medium">
                        {item[field.key]}
                      </td>
                    ))}
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // ESTADO VACÍO (Empty State)
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100">
                <Database size={48} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-600 mb-1">Lista vacía</h3>
              <p className="text-slate-400 mb-6 max-w-sm">
                No hay {currentConfig.label.toLowerCase()} registrados todavía.
              </p>
              
              <button 
                onClick={handleAddNew}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg hover:scale-105"
              >
                <Plus size={20} className="mr-2" />
                Registrar Primer {currentConfig.label.slice(0, -1)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL (Formulario) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                {editingItem ? <Edit2 size={20} className="text-blue-500"/> : <Plus size={20} className="text-green-500"/>}
                {editingItem ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full p-1 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {currentConfig.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      name={field.key}
                      defaultValue={editingItem?.[field.key] || ''}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {field.options.map(opt => (
                         <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.key}
                      defaultValue={editingItem?.[field.key] || ''}
                      placeholder={`Ingresa ${field.label.toLowerCase()}...`}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  )}
                </div>
              ))}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  <Save size={18} />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;