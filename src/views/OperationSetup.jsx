import React, { useState, useEffect } from 'react';
import { FileText, Save, RefreshCw, AlertCircle, CheckCircle, Package, Calendar, Shield } from 'lucide-react';
import api from '../api/axios'; // Asegúrate que la ruta a tu api sea correcta
import { useAuth } from '../context/AuthContext';

const OperationSetup = () => {

    const { puertoId } = useAuth();  // <-- Agregar esta línea

  // --- ESTADOS ---
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [navieras, setNavieras] = useState([]);
  const [agentesAduanales, setAgentesAduanales] = useState([]);

  // Estado del formulario (Solo datos maestros)
  const [formData, setFormData] = useState({
    empresa: '',
    prefijo: '',
    bl_master: '',
    contenedor: '',
    pedimento_prefijo: '',
    pedimento_consecutivo: '',
    eta: '',
    dias_libres: 7,
    naviera: '',
    agente_aduanal: '',
    sensibilidad_contenido: 'verde',
    observaciones: '' // Aquí pueden poner la descripción de la mercancía
  });

  const [consecutivoEditable, setConsecutivoEditable] = useState('001');
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }
  const [blDuplicadoError, setBlDuplicadoError] = useState('');

  // --- CARGA DE CATÁLOGOS ---
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [empRes, navRes, agentesRes] = await Promise.all([
          api.get('catalogos/empresas/'),
          api.get('catalogos/navieras/'),
          api.get('catalogos/agentes-aduanales/')
        ]);
        setEmpresas(empRes.data.results || empRes.data);
        setNavieras(navRes.data.results || navRes.data);
        setAgentesAduanales(agentesRes.data.results || agentesRes.data);
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
          const response = await api.get(`operaciones/tickets/siguiente_consecutivo/?prefijo=${formData.prefijo.toUpperCase()}`);
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

  // --- VERIFICAR BL DUPLICADO ---
  useEffect(() => {
    const verificarBL = async () => {
      if (formData.bl_master && formData.bl_master.length >= 3) {
        try {
          const response = await api.get(`operaciones/tickets/?bl_master=${formData.bl_master.toUpperCase()}&tipo_operacion=clasificacion`);
          const tickets = response.data.results || response.data;
          if (tickets.length > 0) {
            setBlDuplicadoError(`Ya existe una operación con el BL "${formData.bl_master.toUpperCase()}"`);
          } else {
            setBlDuplicadoError('');
          }
        } catch (error) {
          console.error("Error al verificar BL", error);
          setBlDuplicadoError('');
        }
      } else {
        setBlDuplicadoError('');
      }
    };

    const timeoutId = setTimeout(() => {
        verificarBL();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.bl_master]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'prefijo' || name === 'bl_master' || name === 'contenedor' || name === 'pedimento_prefijo' || name === 'pedimento_consecutivo'
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
      setNotification({ type: 'error', message: 'Faltan campos obligatorios (Importador, Prefijo, BL o Contenedor)' });
      setLoading(false);
      return;
    }

    // Validar BL duplicado
    if (blDuplicadoError) {
      setNotification({ type: 'error', message: blDuplicadoError });
      setLoading(false);
      return;
    }

    try {
      // Preparamos el payload.
      // NOTA: Usamos el endpoint de tickets pero SIN concepto de pago,
      // esto crea el registro "base" para que los demás lo encuentren.
      const payload = {
        empresa: formData.empresa,
        prefijo: formData.prefijo,
        bl_master: formData.bl_master,
        contenedor: formData.contenedor,
        pedimento_prefijo: formData.pedimento_prefijo,
        pedimento_consecutivo: formData.pedimento_consecutivo,
        pedimento: `${formData.pedimento_prefijo}${formData.pedimento_consecutivo}`,
        eta: formData.eta || null,
        dias_libres: formData.dias_libres,
        naviera: formData.naviera || null,
        agente_aduanal: formData.agente_aduanal || null,
        sensibilidad_contenido: formData.sensibilidad_contenido,
        observaciones: formData.observaciones,
        consecutivo: parseInt(consecutivoEditable),
        tipo_operacion: 'clasificacion',
        fecha_alta: new Date().toISOString().split('T')[0],
        divisa: 'MXN',
        concepto: 1,
        proveedor: null,
        importe: 0,
        puerto: puertoId,
      };

      await api.post('operaciones/tickets/', payload);

      setNotification({ type: 'success', message: `¡Operación ${formData.prefijo}-${consecutivoEditable} creada exitosamente!` });

      // Limpiar formulario para el siguiente (manteniendo empresa y prefijo por comodidad)
      setFormData(prev => ({
        ...prev,
        bl_master: '',
        contenedor: '',
        pedimento_prefijo: '',
        pedimento_consecutivo: '',
        observaciones: '',
        sensibilidad_contenido: 'verde',
        // eta y dias_libres se mantienen igual pq suelen ser lotes
      }));

      // Recargar consecutivo (incrementar uno visualmente)
      setConsecutivoEditable(prev => String(parseInt(prev) + 1).padStart(3, '0'));

    } catch (error) {
      console.error("Error al guardar", error);
      const errorMsg = error.response?.data?.bl_master?.[0] ||
                       error.response?.data?.detail ||
                       'Error al guardar la operación. Revisa tu conexión.';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Colores del semáforo de sensibilidad
  const getSensibilidadStyle = (valor) => {
    switch(valor) {
      case 'rojo': return { bg: 'bg-red-500', ring: 'ring-red-300', text: 'text-red-700' };
      case 'amarillo': return { bg: 'bg-yellow-400', ring: 'ring-yellow-200', text: 'text-yellow-700' };
      case 'verde': return { bg: 'bg-emerald-500', ring: 'ring-emerald-300', text: 'text-emerald-700' };
      default: return { bg: 'bg-gray-400', ring: 'ring-gray-200', text: 'text-gray-700' };
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
              <h1 className="text-2xl font-bold tracking-tight">Apertura de Expediente</h1>
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">Importador *</label>
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
                    className={`w-full p-2.5 bg-white border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase font-medium shadow-sm ${blDuplicadoError ? 'border-red-500' : 'border-slate-300'}`}
                    required
                  />
                  {blDuplicadoError ? (
                    <p className="text-[10px] text-red-500 mt-1 font-medium">{blDuplicadoError}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">Este dato será usado por Revalidaciones</p>
                  )}
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

                {/* AGENTE ADUANAL - Nuevo campo */}
                <div className="lg:col-span-2">
                   <label className="block text-xs font-bold text-slate-600 mb-1">Agente Aduanal</label>
                   <select
                    name="agente_aduanal"
                    value={formData.agente_aduanal}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Seleccionar --</option>
                    {agentesAduanales.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* NAVIERA - OPCIONAL */}
                <div className="lg:col-span-2">
                   <label className="block text-xs font-bold text-slate-600 mb-1">Naviera <span className="text-slate-400 font-normal">(opcional)</span></label>
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
                  <p className="text-[10px] text-slate-400 mt-1">Puede ser llenado posteriormente por Revalidación</p>
                </div>

                {/* PEDIMENTO - OPCIONAL con formato 4+7 */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pedimento <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <div className="flex gap-2">
                    <input
                      name="pedimento_prefijo"
                      value={formData.pedimento_prefijo}
                      onChange={handleChange}
                      placeholder="0000"
                      maxLength={4}
                      className="w-24 p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 uppercase font-mono text-center"
                    />
                    <span className="flex items-center text-slate-400 font-bold">-</span>
                    <input
                      name="pedimento_consecutivo"
                      value={formData.pedimento_consecutivo}
                      onChange={handleChange}
                      placeholder="0000000"
                      maxLength={7}
                      className="flex-1 p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 uppercase font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Formato: 4 caracteres + 7 caracteres. Puede ser llenado por Revalidación</p>
                </div>

                {/* ETA */}
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
                    value={7} // <--- Valor fijo visual
                    disabled  // <--- Bloqueado para que no lo editen
                    className="w-full p-2.5 bg-slate-100 text-slate-500 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 font-bold cursor-not-allowed"
                  />
                   {/* Input oculto para asegurar que el state tenga el valor si usas handleChange,
                       aunque lo mejor es asegurar que el formData tenga 7 por defecto */}
                </div>

              </div>
            </div>

            {/* SECCIÓN 3: SEMÁFORO DE SENSIBILIDAD */}
            <div className="mb-8 bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield size={14} />
                Sensibilidad del Contenido
              </h3>

              <div className="flex flex-wrap gap-4">
                {[
                  { value: 'rojo', label: 'Contenido Sensible', color: 'bg-red-500', ring: 'ring-red-300', hover: 'hover:bg-red-600' },
                  { value: 'amarillo', label: 'Contenido Tolerable', color: 'bg-yellow-400', ring: 'ring-yellow-200', hover: 'hover:bg-yellow-500' },
                  { value: 'verde', label: 'Contenido Común', color: 'bg-emerald-500', ring: 'ring-emerald-300', hover: 'hover:bg-emerald-600' }
                ].map(option => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, sensibilidad_contenido: option.value }))}
                    className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${
                      formData.sensibilidad_contenido === option.value
                        ? `border-slate-400 bg-white shadow-lg ring-2 ${option.ring}`
                        : 'border-transparent bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full ${option.color} shadow-md ${formData.sensibilidad_contenido === option.value ? 'scale-110' : ''} transition-transform`}></div>
                    <span className={`text-sm font-bold ${formData.sensibilidad_contenido === option.value ? 'text-slate-700' : 'text-slate-500'}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN 4: DESCRIPCIÓN */}
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
                  <div className={`w-5 h-5 rounded-full ${getSensibilidadStyle(formData.sensibilidad_contenido).bg} shadow-lg`}></div>
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
                {formData.pedimento_prefijo && (
                  <div className="mt-3 text-center text-[10px] text-slate-500">
                    Pedimento: {formData.pedimento_prefijo}-{formData.pedimento_consecutivo || '0000000'}
                  </div>
                )}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                className="text-slate-500 font-bold text-sm px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  bl_master: '',
                  contenedor: '',
                  pedimento_prefijo: '',
                  pedimento_consecutivo: '',
                  sensibilidad_contenido: 'verde'
                }))} // Reseteo parcial
              >
                Limpiar Formulario
              </button>

              <button
                type="submit"
                disabled={loading || blDuplicadoError}
                className={`
                  flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all
                  ${loading || blDuplicadoError ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/30 hover:-translate-y-0.5'}
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
