// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';

// Helper para obtener valores con compatibilidad backend/frontend
const getValue = (item, backendKey, frontendKey, defaultValue = '') => {
  return item[backendKey] ?? item[frontendKey] ?? defaultValue;
};

const getCost = (item, backendKey, frontendKey) => {
  return parseFloat(item[backendKey] ?? item[frontendKey] ?? 0) || 0;
};

const getImporte = (item) => {
  return parseFloat(item.importe ?? item.amount ?? 0) || 0;
};

const getEmpresaNombre = (item) => {
  if (typeof item.empresa === 'object' && item.empresa !== null) {
    return item.empresa.nombre || '';
  }
  return item.empresa || item.client || '';
};

export const generatePDF = (itemsToPrint, filename = 'Comprobantes.pdf') => {
  const doc = new jsPDF();
  
  itemsToPrint.forEach((item, index) => {
    if (index > 0) doc.addPage(); 

    // Fondo
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Header azul
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("AduanaSoft", 15, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Comprobante de Cierre Operativo", 15, 30);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`, 195, 30, { align: 'right' });

    // Caja de datos principales
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 50, 180, 35, 3, 3, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text("EMPRESA:", 25, 62);
    doc.text("BL MASTER:", 25, 72);
    doc.text("CONTENEDOR:", 110, 62);
    doc.text("REFERENCIA:", 110, 72);
    
    doc.setFont("helvetica", "normal");
    // Compatibilidad con backend
    const empresa = getEmpresaNombre(item);
    const blMaster = getValue(item, 'bl_master', 'bl', '-');
    const contenedor = getValue(item, 'contenedor', 'container', '-');
    const comentarios = item.comentarios || '-';
    
    doc.text(String(empresa).substring(0, 25), 50, 62);
    doc.text(blMaster, 50, 72);
    doc.text(contenedor, 145, 62);
    doc.text(String(comentarios).substring(0, 20), 145, 72);

    // Título desglose
    let yPos = 100;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Desglose de Costos", 15, 95);
    
    doc.setDrawColor(203, 213, 225);
    doc.line(15, 98, 195, 98);

    // Costos con compatibilidad backend/frontend
    const costs = [
      { l: 'Demoras', v: getCost(item, 'costo_demoras', 'costDemoras') },
      { l: 'Almacenaje', v: getCost(item, 'costo_almacenaje', 'costAlmacenaje') },
      { l: 'Costos Operativos', v: getCost(item, 'costo_operativos', 'costOperativos') },
      { l: 'Gastos Portuarios', v: getCost(item, 'costo_gastos_portuarios', 'costPortuarios') },
      { l: 'Apoyo Extraordinario', v: getCost(item, 'costo_apoyo', 'costApoyo') },
      { l: 'Impuestos', v: getCost(item, 'costo_impuestos', 'costImpuestos') },
      { l: 'Liberación Abandono', v: getCost(item, 'costo_liberacion', 'costLiberacion') },
      { l: 'Transporte', v: getCost(item, 'costo_transporte', 'costTransporte') }
    ];

    doc.setFontSize(10);
    let hasAnyCost = false;
    
    costs.forEach(c => {
      if (c.v > 0) {
        hasAnyCost = true;
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(c.l, 25, yPos);
        doc.setFont("helvetica", "bold");
        doc.text(`$${c.v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 185, yPos, { align: 'right' });
        doc.setDrawColor(241, 245, 249);
        doc.line(25, yPos + 3, 185, yPos + 3);
      }
    });

    // Si no hay costos desglosados, mostrar mensaje
    if (!hasAnyCost) {
      yPos += 10;
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("Sin desglose de costos disponible", 105, yPos, { align: 'center' });
    }

    // Total
    yPos += 25;
    const totalImporte = getImporte(item);
    const divisa = item.divisa || item.currency || 'MXN';
    
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(100, yPos - 12, 95, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PAGADO", 105, yPos);
    doc.text(`$${totalImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${divisa}`, 190, yPos, { align: 'right' });

    // Información adicional
    yPos += 30;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    const fechaAlta = item.fecha_alta || item.fechaAlta;
    const eta = item.eta;
    const diasLibres = item.dias_libres ?? item.freeDays;
    
    if (fechaAlta) {
      doc.text(`Fecha de alta: ${new Date(fechaAlta).toLocaleDateString('es-MX')}`, 15, yPos);
    }
    if (eta) {
      doc.text(`ETA: ${new Date(eta).toLocaleDateString('es-MX')}`, 80, yPos);
    }
    if (diasLibres !== undefined) {
      doc.text(`Días libres: ${diasLibres}`, 140, yPos);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Documento generado por AduanaSoft", 105, 285, { align: 'center' });
    doc.text(`Página ${index + 1} de ${itemsToPrint.length}`, 105, 290, { align: 'center' });
  });

  doc.save(filename);
};