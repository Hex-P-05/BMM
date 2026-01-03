// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';

export const generatePDF = (tickets = [], filename = 'Desglose_Operativo.pdf') => {
  if (!tickets || tickets.length === 0) {
    alert("No hay datos para generar el PDF");
    return;
  }

  const doc = new jsPDF();
  // Tomamos los datos generales del primer ticket del grupo
  const headerData = tickets[0];
  
  const corporateBlue = [37, 99, 235]; // #2563eb
  const textDark = [51, 65, 85];       // #334155
  const textLight = [100, 116, 139];   // #64748b

  // --- 1. HEADER Y DATOS GENERALES ---
  
  // Fondo Header
  doc.setFillColor(...corporateBlue);
  doc.rect(0, 0, 210, 40, 'F');

  // Títulos
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("AduanaSoft", 15, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Desglose de Operación", 15, 30);

  // Fecha
  doc.setFontSize(10);
  doc.text(`Emisión: ${new Date().toLocaleDateString('es-MX')}`, 195, 30, { align: 'right' });

  // Caja de Datos de la Operación
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(15, 50, 180, 25, 3, 3, 'FD');

  doc.setTextColor(...textDark);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  
  // Fila 1 de datos
  doc.text("EMPRESA / CLIENTE:", 20, 60);
  doc.text("BL MASTER:", 90, 60);
  doc.text("CONTENEDOR:", 150, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const empresaNombre = headerData.empresa_nombre || headerData.empresa?.nombre || headerData.empresa || '-';
  doc.text(String(empresaNombre).substring(0, 35), 20, 66);
  doc.text(headerData.bl_master || '-', 90, 66);
  doc.text(headerData.contenedor || '-', 150, 66);

  // --- 2. TABLA DE CONCEPTOS ---

  let y = 90;
  
  // Encabezados de tabla
  doc.setFillColor(...corporateBlue);
  doc.rect(15, y, 180, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  
  doc.text("CONCEPTO / REFERENCIA", 20, y + 5);
  doc.text("PROVEEDOR", 100, y + 5);
  doc.text("ESTATUS", 140, y + 5);
  doc.text("IMPORTE", 190, y + 5, { align: 'right' });

  y += 10;

  // Iteración de tickets
  let totalImporte = 0;
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "normal");

  tickets.forEach((ticket, index) => {
    // Control de paginación básico
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // Fondo alternado para filas
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 4, 180, 10, 'F');
    }

    const concepto = ticket.observaciones || ticket.comentarios || 'Sin concepto';
    // Limpiamos el concepto si viene muy largo o con formato "CONCEPTO - PREFIJO..."
    const conceptoCorto = concepto.split(' - ')[0] || concepto; 
    const referencia = concepto.length > 35 ? concepto.substring(0, 35) + '...' : concepto;

    // Columna 1: Concepto
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(conceptoCorto, 20, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...textLight);
    doc.text(referencia, 20, y + 4);
    
    // Columna 2: Proveedor
    doc.setTextColor(...textDark);
    doc.setFontSize(8);
    doc.text(ticket.proveedor_nombre || '-', 100, y + 2);

    // Columna 3: Estatus
    const estatus = (ticket.estatus || 'pendiente').toUpperCase();
    doc.setFontSize(7);
    if (estatus === 'PAGADO') doc.setTextColor(22, 163, 74); // Green
    else if (estatus === 'CERRADO') doc.setTextColor(71, 85, 105); // Slate
    else doc.setTextColor(202, 138, 4); // Yellow/Amber
    doc.text(estatus, 140, y + 2);

    // Columna 4: Importe
    const importe = parseFloat(ticket.importe || 0);
    totalImporte += importe;
    
    doc.setTextColor(...textDark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`$${importe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 190, y + 2, { align: 'right' });

    y += 12;
  });

  // Línea final
  doc.setDrawColor(203, 213, 225);
  doc.line(15, y, 195, y);
  y += 5;

  // --- 3. TOTALES ---
  
  y += 5;
  doc.setFillColor(...corporateBlue); // Caja azul para el total
  doc.roundedRect(130, y, 65, 12, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL OPERACIÓN:", 135, y + 7);
  doc.text(`$${totalImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 190, y + 7, { align: 'right' });

  // Pie de página
  const pageHeight = doc.internal.pageSize.height;
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Documento generado por AduanaSoft v2.3", 105, pageHeight - 10, { align: 'center' });

  doc.save(filename);
};