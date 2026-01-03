import React, { useState, useEffect } from 'react';
import { FileText, Save, RefreshCw, AlertCircle, CheckCircle, Package, Calendar } from 'lucide-react';
import api from '../api/axios'; // Asegúrate que la ruta a tu api sea correcta

const OperationSetup = () => {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [navieras, setNavieras] = useState([]);
  
  // Estado del formulario (Solo datos maestros)
  const [formData, setFormData] = useState({
    empresa: '',
    prefijo: '',
    bl_master: '',
    contenedor: '',
    pedimento: '',
    eta: '',
    dias_libres: 7,
    naviera: '',
    observaciones: '' // Aquí pueden poner la descripción de la mercancía
  });

  const [consecutivoEditable, setConsecutivoEditable] = useState('001');
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }

  // --- CARGA DE CATÁLOGOS ---
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [empRes, navRes] = await Promise.all([
          api.get('/catalogos/empresas/'),
          api.get('/catalogos/navieras/')
        ]);
        setEmpresas(empRes.data.results || empRes.data);
        setNavieras(navRes.data.results || navRes.data);
      } catch (error) {
        console.error("Error cargando catálogos", error);
      }
    };
    fetchCatalogs();
  }, []);

  // --- OBTENER CONSECUTIVO AL CAMBIAR PREFIJO ---
  useEffect(() => {
    const fetchConsecutivo = async () => {
      if (formData.prefijo && formData.prefijo.length >= 2) {
        try {
          const response = await api.get(`/operaciones/tickets/siguiente_consecutivo/?prefijo=${formData.prefijo.toUpperCase()}`);
          // El backend devuelve { siguiente_consecutivo: 123 }
          const nextVal = response.data.siguiente_consecutivo || 1;
          setConsecutivoEditable(String(nextVal).padStart(3, '0'));
        } catch (error) {
          console.error("Error al obtener consecutivo", error);
          setConsecutivoEditable('001');
        }
      }
    };
    
    // Debounce simple para no saturar el servidor mientras escribe
    const timeoutId = setTimeout(() => {
        fetchConsecutivo();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.prefijo]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'prefijo' || name === 'bl_master' || name === 'contenedor' || name === 'pedimento' 
              ? value.toUpperCase() 
              : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    // Validación básica
    if (!formData.empresa || !formData.prefijo || !formData.bl_master || !formData.contenedor) {
      setNotification({ type: 'error', message: 'Faltan campos obligatorios (Empresa, Prefijo, BL o Contenedor)' });
      setLoading(false);
      return;
    }

    try {
      // Preparamos el payload. 
      // NOTA: Usamos el endpoint de tickets pero SIN concepto de pago, 
      // esto crea el registro "base" para que los demás lo encuentren.
      const payload = {
        ...formData,
        consecutivo: parseInt(consecutivoEditable),
        tipo_operacion: 'clasificacion', 
        fecha_alta: new Date().toISOString().split('T')[0],
        
        // --- AGREGA ESTO PARA QUE EL BACKEND NO LLORE ---
        importe: 0,
        divisa: 'MXN',
        // Como clasificación no tiene concepto de pago, mandamos null si el serializer lo permite, 
        // o si te pide concepto obligatorio, tendrás que crear uno dummy en BD que se llame "ALTA OPERACION".
        // Por tu serializer (allow_null=True), esto debería pasar bien:
        concepto: null 
      };

      await api.post('/operaciones/tickets/', payload);

      setNotification({ type: 'success', message: `¡Operación ${formData.prefijo}-${consecutivoEditable} creada exitosamente!` });
      
      // Limpiar formulario para el siguiente (manteniendo empresa y prefijo por comodidad)
      setFormData(prev => ({
        ...prev,
        bl_master: '',
        contenedor: '',
        pedimento: '',
        observaciones: '',
        // eta y dias_libres se mantienen igual pq suelen ser lotes
      }));
      
      // Recargar consecutivo (incrementar uno visualmente)
      setConsecutivoEditable(prev => String(parseInt(prev) + 1).padStart(3, '0'));

    } catch (error) {
      console.error("Error al guardar", error);
      setNotification({ type: 'error', message: 'Error al guardar la operación. Revisa tu conexión.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* ENCABEZADO MORADO - DISTINTIVO DE CLASIFICACIÓN */}
        <div className="bg-purple-700 rounded-t-xl p-6 shadow-lg text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-600 rounded-lg border border-purple-500">
                <FileText size={24} className="text-purple-100" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Alta de operación</h1>
            </div>
            <p className="text-purple-200 text-sm ml-1">
              Módulo de clasificación • Registro de referencias
            </p>
          </div>
          
          {/* Indicador visual de rol */}
          <div className="bg-purple-800/50 px-4 py-2 rounded-full border border-purple-600 backdrop-blur-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-100 flex items-center gap-2">
              <Package size={14} />
              Clasificación
            </span>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="bg-white rounded-b-xl shadow-lg border-x border-b border-slate-200 p-8">
          
          {/* Notificaciones */}
          {notification && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
              <span className="font-medium">{notification.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* SECCIÓN 1: IDENTIDAD DE LA OPERACIÓN */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Identidad del Cliente
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Empresa *</label>
                  <select
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {empresas.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Prefijo *</label>
                    <input
                      name="prefijo"
                      value={formData.prefijo}
                      onChange={handleChange}
                      placeholder="Ej: HGO"
                      maxLength={10}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 uppercase font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Consecutivo</label>
                    <input
                      value={consecutivoEditable}
                      onChange={(e) => setConsecutivoEditable(e.target.value)}
                      className="w-full p-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DATOS DEL VIAJE (VINCULACIÓN) */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
              
              <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar size={14} />
                Datos del Viaje y Carga
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* BL MASTER - OBLIGATORIO */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">BL Master *</label>
                  <input
                    name="bl_master"
                    value={formData.bl_master}
                    onChange={handleChange}
                    placeholder="Escribe el BL Master..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase font-medium shadow-sm"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Este dato será usado por Revalidaciones</p>
                </div>

                {/* CONTENEDOR - OBLIGATORIO */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1"># Contenedor *</label>
                  <input
                    name="contenedor"
                    value={formData.contenedor}
                    onChange={handleChange}
                    placeholder="ABCD1234567"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase font-medium shadow-sm"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Este dato será usado por Logística</p>
                </div>

                {/* OTROS DATOS */}
                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Naviera</label>
                   <select
                    name="naviera"
                    value={formData.naviera}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Seleccionar --</option>
                    {navieras.map(n => (
                      <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Pedimento</label>
                   <input
                    name="pedimento"
                    value={formData.pedimento}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 uppercase"
                  />
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">ETA (Llegada)</label>
                   <input
                    type="date"
                    name="eta"
                    value={formData.eta}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Días Libres</label>
                   <input
                    type="number"
                    name="dias_libres"
                    value={formData.dias_libres}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

              </div>
            </div>

            {/* SECCIÓN 3: DESCRIPCIÓN */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">Descripción de la Mercancía / Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="2"
                placeholder="Ej: Electrónicos, Textiles, Carga General..."
                className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              ></textarea>
            </div>

            {/* PREVIEW TIPO TARJETA DE CRÉDITO (DETALLE VISUAL) */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl w-full max-w-md border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Referencia Maestra</span>
                  <div className="w-8 h-5 bg-yellow-500 rounded flex items-center justify-center text-[8px] text-black font-bold">CHIP</div>
                </div>
                <div className="text-center font-mono text-2xl font-bold text-yellow-400 tracking-wider mb-4">
                  {formData.prefijo || 'XXX'} {consecutivoEditable}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                  <div>
                     <div className="text-[8px] text-slate-500">BL Master</div>
                     {formData.bl_master || 'PENDIENTE'}
                  </div>
                  <div className="text-right">
                     <div className="text-[8px] text-slate-500">Contenedor</div>
                     {formData.contenedor || 'PENDIENTE'}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                className="text-slate-500 font-bold text-sm px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setFormData(prev => ({ ...prev, bl_master: '', contenedor: '', pedimento: '' }))} // Reseteo parcial
              >
                Limpiar Formulario
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className={`
                  flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all
                  ${loading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/30 hover:-translate-y-0.5'}
                `}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Crear Operación
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default OperationSetup;