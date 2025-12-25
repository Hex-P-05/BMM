// src/data/constants.js

// Colores para gráficas y semáforos
export const COLORS = {
  ok: '#10B981',       // Verde - En tiempo
  warning: '#F59E0B',  // Amarillo - Alerta
  danger: '#EF4444',   // Rojo - Crítico
  expired: '#991B1B',  // Rojo oscuro - Vencido
  primary: '#2563EB',  // Azul principal
  secondary: '#8b5cf6' // Púrpura
};

// Configuración del semáforo de alertas (días)
export const SEMAFORO_CONFIG = {
  verde: { min: 22, label: 'En tiempo', color: COLORS.ok },
  amarillo: { min: 10, max: 21, label: 'Atención', color: COLORS.warning },
  rojo: { min: 0, max: 9, label: 'Crítico', color: COLORS.danger },
  vencido: { max: -1, label: 'Vencido', color: COLORS.expired }
};

// Divisas soportadas
export const DIVISAS = [
  { value: 'MXN', label: 'Pesos Mexicanos' },
  { value: 'USD', label: 'Dólares Americanos' }
];

// Estatus de tickets
export const ESTATUS_TICKET = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800' },
  pagado: { label: 'Pagado', color: 'bg-blue-100 text-blue-800' },
  cerrado: { label: 'Cerrado', color: 'bg-slate-100 text-slate-800' }
};

// Roles del sistema
export const ROLES = {
  admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  ejecutivo: { label: 'Revalidaciones', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  pagos: { label: 'Pagos', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
};

// Conceptos de costo (para desglose)
export const CONCEPTOS_COSTO = [
  { key: 'costo_demoras', label: 'Demoras', chino: '延误' },
  { key: 'costo_almacenaje', label: 'Almacenaje', chino: '贮存' },
  { key: 'costo_operativos', label: 'Costos Operativos', chino: '营运成本' },
  { key: 'costo_gastos_portuarios', label: 'Gastos Portuarios', chino: '港口费用' },
  { key: 'costo_apoyo', label: 'Apoyo', chino: '支援', destacado: true },
  { key: 'costo_impuestos', label: 'Impuestos', chino: '税收' },
  { key: 'costo_liberacion', label: 'Liberación', chino: '摆脱遗弃' },
  { key: 'costo_transporte', label: 'Transporte', chino: '運輸' }
];

// Nota: Los catálogos (empresas, conceptos, proveedores) ahora vienen del backend
// Ya no se hardcodean aquí. Usa el hook useCatalogos() para obtenerlos.