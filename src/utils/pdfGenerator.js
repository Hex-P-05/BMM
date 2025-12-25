// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';

export const generatePDF = (itemsToPrint, filename = 'Comprobantes.pdf') => {
  const doc = new jsPDF();
  
  itemsToPrint.forEach((item, index) => {
    if (index > 0) doc.addPage(); 

    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 297, 'F');
    
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
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 150, 30, { align: 'right' });

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 50, 180, 35, 3, 3, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.text("EMPRESA:", 25, 65);
    doc.text("BL MASTER:", 110, 65);
    doc.text("CONTENEDOR:", 110, 75);
    
    doc.setFont("helvetica", "normal");
    doc.text(item.empresa || item.client || '', 50, 65);
    doc.text(item.bl, 145, 65);
    doc.text(item.container || item.contenedor, 145, 75);

    let yPos = 100;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Desglose de Costos", 15, 95);
    
    doc.setDrawColor(203, 213, 225);
    doc.line(15, 98, 195, 98);

    const costs = [
        { l: 'Demoras', v: item.costDemoras }, { l: 'Almacenaje', v: item.costAlmacenaje },
        { l: 'Costos Operativos', v: item.costOperativos }, { l: 'Gastos Portuarios', v: item.costPortuarios },
        { l: 'Apoyo Extraordinario', v: item.costApoyo }, { l: 'Impuestos', v: item.costImpuestos },
        { l: 'Liberación Abandono', v: item.costLiberacion }, { l: 'Transporte', v: item.costTransporte }
    ];

    doc.setFontSize(10);
    costs.forEach(c => {
        if (c.v > 0) {
            yPos += 10;
            doc.setFont("helvetica", "normal");
            doc.text(c.l, 25, yPos);
            doc.setFont("helvetica", "bold");
            doc.text(`$${c.v.toLocaleString()}`, 185, yPos, { align: 'right' });
            doc.setDrawColor(241, 245, 249);
            doc.line(25, yPos + 3, 185, yPos + 3);
        }
    });

    yPos += 20;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(120, yPos - 10, 75, 15, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("TOTAL PAGADO", 125, yPos);
    doc.text(`$${item.amount.toLocaleString()} ${item.currency}`, 190, yPos, { align: 'right' });
  });

  doc.save(filename);
};