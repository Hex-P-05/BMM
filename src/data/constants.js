export const COLORS = {
  ok: '#10B981', warning: '#F59E0B', danger: '#EF4444', expired: '#991B1B', primary: '#2563EB', secondary: '#8b5cf6'
};

export const EMPRESAS_DB = [
    { id: 1, nombre: 'IMPORTADORA MÉXICO S.A.' },
    { id: 2, nombre: 'LOGÍSTICA GLOBAL' },
    { id: 3, nombre: 'TEXTILES DEL NORTE' },
    { id: 4, nombre: 'AUTOMOTRIZ BAJÍO' }
];

export const CONCEPTOS_DB = ['ALMACENAJES', 'PAMA', 'HONORARIOS', 'FLETE', 'DEMORAS', 'REVALIDACIÓN', 'MANIOBRAS'];

export const PROVEEDORES_DB = [
  { id: 1, nombre: 'HAPAG-LLOYD', banco: 'BBVA', cuenta: '0123456789', clabe: '012001012345678901' },
  { id: 2, nombre: 'MAERSK MEXICO', banco: 'CITIBANAMEX', cuenta: '9876543210', clabe: '002001987654321099' },
  { id: 3, nombre: 'COSCO SHIPPING', banco: 'SANTANDER', cuenta: '5554443332', clabe: '014001555444333222' },
  { id: 4, nombre: 'MSC MEXICO', banco: 'HSBC', cuenta: '1112223334', clabe: '021001111222333444' },
  { id: 5, nombre: 'ONE NET', banco: 'BANORTE', cuenta: '9998887776', clabe: '072001999888777666' },
];

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const rawData = [
  { 
    id: 1, bl: 'HLCU12345678', eta: addDays(45), freeDays: 7, editCount: 0, payment: 'paid', paymentDate: '2025-06-10', paymentDelay: 0, currency: 'MXN',
    ejecutivo: 'JOAN', empresa: 'IMPORTADORA MÉXICO S.A.', fechaAlta: '2025-05-20', concepto: 'ALMACENAJES', prefijo: 'IMP', consecutivo: 1, contenedor: 'MSKU987654',
    comentarios: 'ALMACENAJES IMP 1 MSKU987654', pedimento: '2300-112233', factura: 'A-101',
    proveedor: 'HAPAG-LLOYD', banco: 'BBVA', cuenta: '0123456789', clabe: '012001012345678901',
    costDemoras: 0, costAlmacenaje: 5000, costOperativos: 5000, costPortuarios: 2000, costApoyo: 0, costImpuestos: 1000, costLiberacion: 0, costTransporte: 7000,
    amount: 20000, status: 'active', paidFlags: {} 
  },
  { 
    id: 2, bl: 'MAEU87654321', eta: addDays(-5), freeDays: 14, editCount: 1, payment: 'paid', paymentDate: '2025-06-12', paymentDelay: 5, currency: 'USD',
    ejecutivo: 'MARIA', empresa: 'LOGÍSTICA GLOBAL', fechaAlta: '2025-05-22', concepto: 'PAMA', prefijo: 'LOG', consecutivo: 1, contenedor: 'TCLU123000',
    comentarios: 'PAMA LOG 1 TCLU123000', pedimento: '2300-998877', factura: '',
    proveedor: 'MAERSK MEXICO', banco: 'CITIBANAMEX', cuenta: '9876543210', clabe: '002001987654321099',
    costDemoras: 15000, costAlmacenaje: 5000, costOperativos: 1000, costPortuarios: 0, costApoyo: 0, costImpuestos: 500, costLiberacion: 0, costTransporte: 1000,
    amount: 22500, status: 'active', paidFlags: {}
  }
];