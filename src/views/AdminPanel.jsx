// src/views/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Anchor, Truck, Briefcase, 
  Plus, Edit2, Trash2, Search, Save, X, Database, 
  Ship, Container, FileText, CheckSquare
} from 'lucide-react';

// --- CONFIGURACIÓN VISUAL (Sin conexión a API) ---
const CATALOGOS_CONFIG = {
  empresas: {
    label: 'Empresas Operadoras',
    desc: 'B&MM, MICRA, etc.',
    icon: Building2,
    fields: [
      { key: 'nombre', label: 'Nombre Corto', type: 'text', required: true },
      { key: 'razon_social', label: 'Razón Social', type: 'text' },
      { key: 'rfc', label: 'RFC', type: 'text' },
      { key: 'es_principal', label: 'Es Principal', type: 'checkbox' },
      { key: 'activo', label: 'Activo', type: 'checkbox', default: true }
    ]
  },
  clientes: {
    label: 'Clientes',
    desc: 'Cartera y prefijos',
    icon: Users,
    fields: [
      { key: 'nombre', label: 'Nombre Cliente', type: 'text', required: true },
      { key: 'prefijo', label: 'Prefijo (3 letras)', type: 'text', required: true },
      { key: 'empresa_asociada', label: 'Empresa Asociada', type: 'select_local', source: 'empresas' }, // Relación simulada
      { key: 'contacto', label: 'Contacto', type: 'text' },
      { key: 'telefono', label: 'Teléfono', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'activo', label: 'Activo', type: 'checkbox', default: true }
    ]
  },
  proveedores: {
    label: 'Proveedores',
    desc: 'Logística y transporte',
    icon: Truck,
    fields: [
      { key: 'nombre', label: 'Nombre Proveedor', type: 'text', required: true },
      { key: 'banco', label: 'Banco', type: 'text' },
      { key: 'cuenta', label: 'Cuenta', type: 'text' },
      { key: 'clabe', label: 'CLABE', type: 'text' },
      { key: 'contacto', label: 'Contacto', type: 'text' },
      { key: 'activo', label: 'Activo', type: 'checkbox', default: true }
    ]
  },
  navieras: {
    label: 'Navieras',
    desc: 'Líneas navieras',
    icon: Ship,
    fields: [
      { key: 'nombre', label: 'Nombre Naviera', type: 'text', required: true },
      { key: 'codigo', label: 'Código', type: 'text' },
      { key: 'activo', label: 'Activo', type: 'checkbox', default: true }
    ]
  },
  puertos: {
    label: 'Puertos',
    desc: 'Catálogo de puertos',
    icon: Anchor,
    fields: [
      { key: 'nombre', label: 'Nombre Puerto', type: 'text', required: true },
      { key: 'codigo', label: 'Código (MZN, VER...)', type: 'text', required: true },
      { key: 'activo', label: 'Activo', type: 'checkbox', default: true }
    ]
  },
  terminales: {
    label: 'Terminales',
    desc: 'Recintos fiscalizados',
    icon: Container,
    fields: [
      { key: 'nombre', label: 'Nombre Terminal', type: 'text', required: true },
      { key: 'puerto', label: 'Puerto', type: 'select_local', source: 'puertos' },
      { key: 'banco', label: 'Banco', type: 'text' },
      { key: 'clabe', label: 'CLABE', type: 'text' },
      { key: 'activo', label: 'Activo', type: 'checkbox', default: true }
    ]
  },
  agentes: {
    label: 'Agentes Aduanales',
    desc: 'Patentes y datos',
    icon: FileText,
    fields: [
      { key: 'nombre', label: 'Nombre AA', type: 'text', required: true },
      { key: 'patente', label: 'Patente', type: 'text' },
      { key: 'banco', label: 'Banco', type: 'text' },
      { key: 'clabe', label: 'CLABE', type: 'text' },
      { key: 'activo', label: 'Activo', type: 'checkbox', default: true }
    ]
  },
  trabajadores: {
    label: 'Usuarios',
    desc: 'Accesos al sistema',
    icon: Briefcase,
    fields: [
      { key: 'username', label: 'Usuario', type: 'text', required: true },
      { key: 'first_name', label: 'Nombre', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'rol', label: 'Rol', type: 'select', options: ['Admin', 'Operativo', 'Pagos', 'Visita'] },
      { key: 'activo', label: 'Activo', type: 'checkbox', default: true }
    ]
  }
};

const AdminPanel = () => {
  const [activeCatalog, setActiveCatalog] = useState('empresas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // --- DATOS FALSOS (ESTADO LOCAL) ---
  // Aquí simulamos que ya hay datos cargados para que no se vea vacío
  const [fakeData, setFakeData] = useState({
    empresas: [
      { id: 1, nombre: 'AduanaSoft', razon_social: 'AduanaSoft SA de CV', rfc: 'ASM230101XYZ', es_principal: true, activo: true },
      { id: 2, nombre: 'MICRA', razon_social: 'Micra Logistics S.A.', rfc: 'MIC990909ABC', es_principal: true, activo: true }
    ],
    clientes: [
      { id: 3, nombre: 'Grupo Modelo', prefijo: 'GPO', empresa_asociada: 'AduanaSoft', contacto: 'Juan Pérez', telefono: '555-1234', email: 'juan@modelo.com', activo: true },
      { id: 4, nombre: 'Amazon MX', prefijo: 'AMZ', empresa_asociada: 'MICRA', contacto: 'Ana López', telefono: '555-5678', email: 'ana@amazon.com', activo: true }
    ],
    proveedores: [
      { id: 5, nombre: 'Transportes Castores', banco: 'Bancomer', cuenta: '1234567890', clabe: '012180012345678901', activo: true },
      { id: 6, nombre: 'Maersk Logistics', banco: 'Santander', cuenta: '0987654321', clabe: '014180098765432109', activo: true }
    ],
    navieras: [
      { id: 7, nombre: 'Hapag Lloyd', codigo: 'HLC', activo: true },
      { id: 8, nombre: 'MSC', codigo: 'MSC', activo: true }
    ],
    puertos: [
      { id: 9, nombre: 'Manzanillo', codigo: 'MZN', activo: true },
      { id: 10, nombre: 'Veracruz', codigo: 'VER', activo: true },
      { id: 11, nombre: 'Lázaro Cárdenas', codigo: 'LZC', activo: true }
    ],
    terminales: [
      { id: 12, nombre: 'CONTECON', puerto: 'Manzanillo', activo: true },
      { id: 13, nombre: 'SSA MEXICO', puerto: 'Veracruz', activo: true }
    ],
    agentes: [
      { id: 14, nombre: 'Agencia Aduanal López', patente: '1234', activo: true }
    ],
    trabajadores: [
      { id: 15, username: 'admin', first_name: 'Administrador', email: 'admin@sistema.com', rol: 'Admin', activo: true },
      { id: 16, username: 'operador', first_name: 'Juan Operaciones', email: 'ops@sistema.com', rol: 'Operativo', activo: true }
    ]
  });

  const currentConfig = CATALOGOS_CONFIG[activeCatalog];
  const currentData = fakeData[activeCatalog] || [];

  // Resetear búsqueda al cambiar pestaña
  useEffect(() => {
    setSearchTerm('');
    setIsModalOpen(false);
    setEditingItem(null);
  }, [activeCatalog]);

  // Filtrado
  const filteredData = currentData.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(val => 
      String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // --- HANDLERS (Solo modifican el estado local) ---
  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar registro (Simulado)?')) {
      setFakeData(prev => ({
        ...prev,
        [activeCatalog]: prev[activeCatalog].filter(i => i.id !== id)
      }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newData = {};

    // Procesar campos
    currentConfig.fields.forEach(field => {
      const value = formData.get(field.key);
      if (field.type === 'checkbox') {
        newData[field.key] = value === 'on';
      } else {
        newData[field.key] = value;
      }
    });
    
    // Asegurar defaults
    currentConfig.fields.forEach(field => {
       if(field.type === 'checkbox' && newData[field.key] === undefined) {
           newData[field.key] = false; 
       }
    });

    if (editingItem) {
      // Editar existente
      setFakeData(prev => ({
        ...prev,
        [activeCatalog]: prev[activeCatalog].map(i => i.id === editingItem.id ? { ...i, ...newData, id: editingItem.id } : i)
      }));
    } else {
      // Crear nuevo (ID random)
      const newItem = { id: Date.now(), ...newData };
      setFakeData(prev => ({
        ...prev,
        [activeCatalog]: [...prev[activeCatalog], newItem]
      }));
    }
    setIsModalOpen(false);
  };

  // Helper para obtener opciones de relaciones locales (ej. Lista de Empresas para el select de Clientes)
  const getLocalOptions = (sourceKey) => {
    return (fakeData[sourceKey] || []).map(item => item.nombre || item.username || item.razon_social);
  };

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* 1. NAVEGACIÓN DE CATÁLOGOS (ARRIBA) */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Administración del Sistema (Modo Visual)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(CATALOGOS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeCatalog === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCatalog(key)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                  ${isActive 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <Icon size={20} className="mb-1" />
                <span className="text-xs font-bold text-center leading-tight">
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TABLA Y BUSCADOR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
        
        {/* Header Tabla */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-t-xl">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {currentConfig.label}
              <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500 border">
                {filteredData.length} registros
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">{currentConfig.desc}</p>
          </div>
          
          <div className="flex w-full sm:w-auto gap-3">
             <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm shadow-sm whitespace-nowrap transition-colors">
               <Plus size={18} className="mr-2" />
               Nuevo
             </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-x-auto relative min-h-[300px]">
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
                    {currentConfig.fields.map(field => {
                       let val = item[field.key];
                       if (field.type === 'checkbox') {
                         val = val ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Sí</span> 
                                   : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">No</span>;
                       }
                       return (
                         <td key={field.key} className="p-4 text-slate-700 font-medium whitespace-nowrap">
                           {val || '-'}
                         </td>
                       );
                    })}
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Database size={48} className="text-slate-300 mb-4" />
              <p>No hay registros aquí.</p>
              <button onClick={handleAddNew} className="mt-4 text-blue-600 font-medium hover:underline">
                Crea el primero
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL (Formulario) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                {editingItem ? <Edit2 size={20} className="text-blue-500"/> : <Plus size={20} className="text-green-500"/>}
                {editingItem ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {currentConfig.fields.map(field => {
                const defaultValue = editingItem ? editingItem[field.key] : field.default;
                
                return (
                  <div key={field.key}>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {(field.type === 'text' || field.type === 'email') && (
                      <input
                        type={field.type}
                        name={field.key}
                        defaultValue={defaultValue || ''}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        required={field.required}
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        name={field.key}
                        defaultValue={defaultValue || ''}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                      >
                        <option value="">-- Seleccionar --</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}

                    {/* Select Inteligente que carga datos de otros catálogos locales */}
                    {field.type === 'select_local' && (
                      <select
                        name={field.key}
                        defaultValue={defaultValue || ''}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                      >
                        <option value="">-- Seleccionar {field.label} --</option>
                        {getLocalOptions(field.source).map((opt, idx) => (
                          <option key={idx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name={field.key}
                          defaultChecked={defaultValue !== undefined ? defaultValue : true}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-600">Habilitado / Activo</span>
                      </label>
                    )}
                  </div>
                );
              })}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all flex justify-center items-center gap-2">
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