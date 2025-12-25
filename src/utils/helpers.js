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
 * Formatea fecha de YYYY-MM-DD a DD/MM/YYYY
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Formatea fecha ISO a DD/MM/YYYY HH:MM
 */
export const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calcula diferencia en días entre ETA y hoy
 */
export const getDaysDiff = (etaString) => {
  if (!etaString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = etaString.split('-').map(Number);
  const etaDate = new Date(year, month - 1, day);
  const diffTime = etaDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calcula el semáforo de estatus basado en días restantes
 * Ahora sincronizado con el backend (ver models.py de operaciones)
 */
export const calculateSemaforo = (etaString) => {
  if (!etaString) return 'verde';
  
  const dias = getDaysDiff(etaString);
  
  if (dias === null) return 'verde';
  if (dias < 0) return 'vencido';
  if (dias < 10) return 'rojo';
  if (dias <= 21) return 'amarillo';
  return 'verde';
};

/**
 * Calcula estatus para compatibilidad con código existente
 * Mapea semáforo a los estatus usados en el frontend original
 */
export const calculateStatus = (etaString) => {
  const semaforo = calculateSemaforo(etaString);
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
  if (amount === null || amount === undefined) return '$0.00';
  
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'MXN',
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

/**
 * Formatea número con separadores de miles
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
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
  // Django envía YYYY-MM-DD, lo convertimos a Date local
  return new Date(djangoDate + 'T00:00:00');
};