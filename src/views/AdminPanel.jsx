// src/views/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  Building2, Users, Anchor, Truck, Briefcase,
  Plus, Edit2, Trash2, Search, Save, X, Database,
  Ship, Container, FileText, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import useAdminCatalogos from '../hooks/useAdminCatalogos';

// --- CONFIGURACIÓN DE CATÁLOGOS ---
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
      { key: 'empresa_asociada', label: 'Empresa Asociada', type: 'select_relation', source: 'empresas', valueKey: 'id', labelKey: 'nombre' },
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
      { key: 'puerto', label: 'Puerto', type: 'select_relation', source: 'puertos', valueKey: 'id', labelKey: 'nombre' },
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
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'first_name', label: 'Nombre', type: 'text' },
      { key: 'last_name', label: 'Apellido', type: 'text' },
      { key: 'rol', label: 'Rol', type: 'select', options: [
        { value: 'admin', label: 'Admin' },
        { value: 'revalidaciones', label: 'Revalidaciones' },
        { value: 'logistica', label: 'Logística' },
        { value: 'pagos', label: 'Pagos' },
        { value: 'clasificacion', label: 'Clasificación' }
      ]},
      { key: 'activo', label: 'Activo', type: 'checkbox', default: true }
    ],
    extraCreateFields: [
      { key: 'password', label: 'Contraseña', type: 'password', required: true }
    ]
  }
};

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-[10000] animate-in slide-in-from-right`}>
      <Icon size={20} />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X size={16} />
      </button>
    </div>
  );
};

const AdminPanel = () => {
  const [activeCatalog, setActiveCatalog] = useState('empresas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Hook para CRUD de catálogos
  const {
    data,
    globalLoading,
    error,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    fetchCatalog
  } = useAdminCatalogos();

  const currentConfig = CATALOGOS_CONFIG[activeCatalog];
  const currentData = data[activeCatalog] || [];
  const catalogLoading = isLoading(activeCatalog);

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

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // --- HANDLERS ---
  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;

    const result = await deleteItem(activeCatalog, id);

    if (result.success) {
      showToast('Registro eliminado correctamente', 'success');
    } else {
      showToast(result.error || 'Error al eliminar', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.target);
    const newData = {};

    // Obtener campos (incluyendo extras para creación)
    const allFields = editingItem
      ? currentConfig.fields
      : [...currentConfig.fields, ...(currentConfig.extraCreateFields || [])];

    // Procesar campos
    allFields.forEach(field => {
      const value = formData.get(field.key);
      if (field.type === 'checkbox') {
        newData[field.key] = value === 'on';
      } else if (field.type === 'select_relation') {
        // Para relaciones, enviar el ID numérico o null
        newData[field.key] = value ? parseInt(value, 10) : null;
      } else {
        newData[field.key] = value || '';
      }
    });

    // Asegurar defaults para checkboxes no marcados
    allFields.forEach(field => {
      if (field.type === 'checkbox' && newData[field.key] === undefined) {
        newData[field.key] = false;
      }
    });

    let result;
    if (editingItem) {
      result = await updateItem(activeCatalog, editingItem.id, newData);
    } else {
      result = await createItem(activeCatalog, newData);
    }

    setSaving(false);

    if (result.success) {
      showToast(
        editingItem ? 'Registro actualizado correctamente' : 'Registro creado correctamente',
        'success'
      );
      setIsModalOpen(false);
      setEditingItem(null);
    } else {
      showToast(result.error || 'Error al guardar', 'error');
    }
  };

  // Helper para obtener opciones de relaciones (de otros catálogos)
  const getRelationOptions = (field) => {
    const sourceData = data[field.source] || [];
    return sourceData.map(item => ({
      value: item[field.valueKey],
      label: item[field.labelKey]
    }));
  };

  // Helper para mostrar valor de relación en tabla
  const getRelationDisplay = (item, field) => {
    const sourceData = data[field.source] || [];
    const relatedId = item[field.key];
    const related = sourceData.find(s => s.id === relatedId);
    return related ? related[field.labelKey] : '-';
  };

  // Loading global
  if (globalLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-500 font-medium">Cargando catálogos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Error global */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. NAVEGACIÓN DE CATÁLOGOS (ARRIBA) */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Administración del Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(CATALOGOS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = activeCatalog === key;
            const count = (data[key] || []).length;
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
                <span className="text-[10px] text-slate-400 mt-0.5">{count}</span>
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
              {catalogLoading && <Loader2 size={16} className="animate-spin text-blue-500" />}
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
             <button
               onClick={handleAddNew}
               className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm shadow-sm whitespace-nowrap transition-colors"
             >
               <Plus size={18} className="mr-2" />
               Nuevo
             </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-x-auto relative min-h-[300px]">
          {catalogLoading && !currentData.length ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredData.length > 0 ? (
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
                         val = val
                           ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Sí</span>
                           : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">No</span>;
                       } else if (field.type === 'select_relation') {
                         val = getRelationDisplay(item, field);
                       } else if (field.type === 'select' && field.options) {
                         const option = field.options.find(o => o.value === val);
                         val = option ? option.label : val;
                       }

                       return (
                         <td key={field.key} className="p-4 text-slate-700 font-medium whitespace-nowrap">
                           {val || '-'}
                         </td>
                       );
                    })}
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar"
                      >
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
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
                disabled={saving}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {/* Campos normales */}
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
                        disabled={saving}
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        name={field.key}
                        defaultValue={defaultValue || ''}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                        disabled={saving}
                      >
                        <option value="">-- Seleccionar --</option>
                        {field.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}

                    {/* Select que carga datos de otros catálogos */}
                    {field.type === 'select_relation' && (
                      <select
                        name={field.key}
                        defaultValue={defaultValue || ''}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                        disabled={saving}
                      >
                        <option value="">-- Seleccionar {field.label} --</option>
                        {getRelationOptions(field).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                          disabled={saving}
                        />
                        <span className="text-sm font-medium text-slate-600">Habilitado / Activo</span>
                      </label>
                    )}
                  </div>
                );
              })}

              {/* Campos extras solo para creación (ej: password para usuarios) */}
              {!editingItem && currentConfig.extraCreateFields?.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type}
                    name={field.key}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required={field.required}
                    disabled={saving}
                  />
                </div>
              ))}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Guardar
                    </>
                  )}
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
