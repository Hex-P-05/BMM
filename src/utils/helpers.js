// src/utils/helpers.js

/**
 * Agrega días a la fecha actual
 */
export const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Formatea fecha a DD/MM/YYYY
 * Acepta: "YYYY-MM-DD", "YYYY-MM-DDTHH:MM:SS", "DD/MM/YYYY", Date object, null/undefined
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  
  try {
    // Si es string
    if (typeof dateInput === 'string') {
      // Si ya viene en formato DD/MM/YYYY, devolverlo tal cual
      if (dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateInput;
      }
      
      // Si tiene formato ISO completo (con T)
      if (dateInput.includes('T')) {
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
      }
      
      // Si tiene formato YYYY-MM-DD
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateInput.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Devolver el string tal cual si no matchea ningún patrón conocido
      return dateInput;
    }
    
    // Si es objeto Date
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      const day = String(dateInput.getDate()).padStart(2, '0');
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const year = dateInput.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Si es número (timestamp)
    if (typeof dateInput === 'number') {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    
    return '-';
  } catch (error) {
    console.error('Error formatting date:', dateInput, error);
    return '-';
  }
};

/**
 * Formatea fecha ISO a DD/MM/YYYY HH:MM
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '-';
  }
};

/**
 * Calcula diferencia en días entre una fecha y hoy
 */
export const getDaysDiff = (dateInput) => {
  if (!dateInput) return null;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let targetDate;
    
    if (typeof dateInput === 'string') {
      if (dateInput.includes('T')) {
        targetDate = new Date(dateInput);
      } else if (dateInput.includes('-')) {
        const [year, month, day] = dateInput.split('-').map(Number);
        targetDate = new Date(year, month - 1, day);
      } else {
        targetDate = new Date(dateInput);
      }
    } else if (dateInput instanceof Date) {
      targetDate = dateInput;
    } else {
      return null;
    }
    
    if (isNaN(targetDate.getTime())) return null;
    
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return null;
  }
};

/**
 * Calcula el semáforo de estatus basado en días restantes
 * Sincronizado con el backend (ver models.py de operaciones)
 */
export const calculateSemaforo = (etaString, diasLibres = 0) => {
  if (!etaString) return 'verde';
  
  // Calcular fecha límite (ETA + días libres)
  let fechaLimite;
  try {
    if (typeof etaString === 'string') {
      if (etaString.includes('T')) {
        fechaLimite = new Date(etaString);
      } else {
        const [year, month, day] = etaString.split('-').map(Number);
        fechaLimite = new Date(year, month - 1, day);
      }
    } else {
      fechaLimite = new Date(etaString);
    }
    
    if (isNaN(fechaLimite.getTime())) return 'verde';
    
    // Sumar días libres
    fechaLimite.setDate(fechaLimite.getDate() + (diasLibres || 0));
  } catch (error) {
    return 'verde';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  fechaLimite.setHours(0, 0, 0, 0);
  
  const diffTime = fechaLimite - today;
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (dias < 0) return 'vencido';
  if (dias < 10) return 'rojo';
  if (dias <= 21) return 'amarillo';
  return 'verde';
};

/**
 * Calcula estatus para compatibilidad con código existente
 * Mapea semáforo a los estatus usados en el frontend original
 */
export const calculateStatus = (etaString, diasLibres = 0) => {
  const semaforo = calculateSemaforo(etaString, diasLibres);
  const map = {
    verde: 'ok',
    amarillo: 'warning',
    rojo: 'danger',
    vencido: 'expired'
  };
  return map[semaforo] || 'ok';
};

/**
 * Formatea número como moneda
 */
export const formatCurrency = (amount, currency = 'MXN') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  
  const num = parseFloat(amount) || 0;
  
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'MXN',
    minimumFractionDigits: 2
  });
  
  return formatter.format(num);
};

/**
 * Formatea número con separadores de miles
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('es-MX').format(num);
};

/**
 * Genera comentario automático para ticket
 */
export const generateComentario = (concepto, prefijo, consecutivo, contenedor) => {
  return `${concepto || ''} ${prefijo || ''} ${consecutivo || ''} ${contenedor || ''}`.trim().toUpperCase();
};

/**
 * Valida formato de contenedor (4 letras + 7 dígitos)
 */
export const validateContenedor = (contenedor) => {
  const regex = /^[A-Z]{4}\d{7}$/;
  return regex.test(contenedor?.toUpperCase() || '');
};

/**
 * Trunca texto con ellipsis
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Convierte fecha de Django a formato local
 */
export const djangoDateToLocal = (djangoDate) => {
  if (!djangoDate) return null;
  try {
    // Django envía YYYY-MM-DD o ISO, lo convertimos a Date local
    if (typeof djangoDate === 'string' && !djangoDate.includes('T')) {
      return new Date(djangoDate + 'T00:00:00');
    }
    return new Date(djangoDate);
  } catch (error) {
    return null;
  }
};

/**
 * Obtiene valor seguro de un objeto (para compatibilidad backend/frontend)
 */
export const safeGet = (obj, path, defaultValue = '') => {
  if (!obj) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  
  return result ?? defaultValue;
};