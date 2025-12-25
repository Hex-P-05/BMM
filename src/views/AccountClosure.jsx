// src/views/AccountClosure.jsx
import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { ClipboardCheck, Search, X, Download, Calculator, FileText, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/helpers';

const AccountClosure = ({ data = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Hoja de cálculo para el cierre
  const [spreadsheet, setSpreadsheet] = useState({
    // Conceptos del cliente
    venta: 0,
    almacenajes: 0,
    transporte: 0,
    demoras: 0,
    estadias: 0,
    maniobras: 0,
    honorarios: 0,
    otros: 0,
    // Anticipos recibidos
    anticipo1: 0,
    anticipo2: 0,
    anticipo3: 0
  });

  // Filtrar opciones de búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      (item.bl_master?.toLowerCase().includes(term)) ||
      (item.contenedor?.toLowerCase().includes(term)) ||
      (item.comentarios?.toLowerCase().includes(term))
    ).slice(0, 10);
  }, [data, searchTerm]);

  // Seleccionar un item
  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm(`${item.bl_master || item.bl} - ${item.contenedor}`);
    setShowDropdown(false);
    
    // Pre-cargar datos del ticket si existen
    setSpreadsheet({
      venta: 0,
      almacenajes: parseFloat(item.costo_almacenaje) || 0,
      transporte: parseFloat(item.costo_transporte) || 0,
      demoras: parseFloat(item.costo_demoras) || 0,
      estadias: 0,
      maniobras: parseFloat(item.costo_operativos) || 0,
      honorarios: 0,
      otros: parseFloat(item.costo_apoyo) || 0,
      anticipo1: 0,
      anticipo2: 0,
      anticipo3: 0
    });
  };

  // Limpiar selección
  const handleClear = () => {
    setSelectedItem(null);
    setSearchTerm('');
    setSpreadsheet({
      venta: 0, almacenajes: 0, transporte: 0, demoras: 0,
      estadias: 0, maniobras: 0, honorarios: 0, otros: 0,
      anticipo1: 0, anticipo2: 0, anticipo3: 0
    });
  };

  // Manejar cambios en la hoja de cálculo
  const handleCalcChange = (e) => {
    const { name, value } = e.target;
    setSpreadsheet({ ...spreadsheet, [name]: parseFloat(value) || 0 });
  };

  // Cálculos
  const totalCliente = spreadsheet.venta + spreadsheet.almacenajes + spreadsheet.transporte +
    spreadsheet.demoras + spreadsheet.estadias + spreadsheet.maniobras +
    spreadsheet.honorarios + spreadsheet.otros;

  const totalAnticipo = spreadsheet.anticipo1 + spreadsheet.anticipo2 + spreadsheet.anticipo3;
  const diferencia = totalCliente - totalAnticipo;
  const esSaldoAFavor = diferencia < 0;

  // Generar PDF
  const handleSavePDF = () => {
    if (!selectedItem) return;
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = 20;

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('ADUANASOFT', margin, 20);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Estado de Cuenta Final', margin, 30);

      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 190, 25, { align: 'right' });

      // Datos del contenedor
      y = 55;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DE LA OPERACIÓN', margin, y);

      y += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const drawInfoRow = (label, value) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value || '-', margin + 50, y);
        y += 7;
      };

      drawInfoRow('Empresa:', selectedItem.empresa?.nombre || selectedItem.empresa || '');
      drawInfoRow('BL Master:', selectedItem.bl_master || selectedItem.bl || '');
      drawInfoRow('Contenedor:', selectedItem.contenedor || '');
      drawInfoRow('Referencia:', selectedItem.comentarios || '');

      // Tabla de conceptos
      y += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DESGLOSE DE COBROS AL CLIENTE', margin, y);

      y += 8;
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, 170, 8, 'F');
      doc.setFontSize(9);
      doc.text('CONCEPTO', margin + 5, y + 6);
      doc.text('MONTO', 170, y + 6, { align: 'right' });

      y += 10;
      const conceptos = [
        { label: 'Venta / Mercancía', value: spreadsheet.venta },
        { label: 'Almacenajes', value: spreadsheet.almacenajes },
        { label: 'Transporte', value: spreadsheet.transporte },
        { label: 'Demoras', value: spreadsheet.demoras },
        { label: 'Estadías', value: spreadsheet.estadias },
        { label: 'Maniobras / Operativos', value: spreadsheet.maniobras },
        { label: 'Honorarios', value: spreadsheet.honorarios },
        { label: 'Otros gastos', value: spreadsheet.otros }
      ];

      doc.setFont('helvetica', 'normal');
      conceptos.forEach(c => {
        if (c.value > 0) {
          doc.text(c.label, margin + 5, y);
          doc.text(`$${c.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 170, y, { align: 'right' });
          y += 6;
        }
      });

      // Total cliente
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, 190, y);
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL CLIENTE:', margin + 5, y);
      doc.text(`$${totalCliente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 170, y, { align: 'right' });

      // Anticipos
      y += 15;
      doc.setFontSize(12);
      doc.text('ANTICIPOS RECIBIDOS', margin, y);

      y += 8;
      doc.setFillColor(220, 252, 231);
      doc.rect(margin, y, 170, 8, 'F');
      doc.setFontSize(9);
      doc.text('ANTICIPO', margin + 5, y + 6);
      doc.text('MONTO', 170, y + 6, { align: 'right' });

      y += 10;
      doc.setFont('helvetica', 'normal');
      if (spreadsheet.anticipo1 > 0) {
        doc.text('Anticipo 1', margin + 5, y);
        doc.text(`$${spreadsheet.anticipo1.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 170, y, { align: 'right' });
        y += 6;
      }
      if (spreadsheet.anticipo2 > 0) {
        doc.text('Anticipo 2', margin + 5, y);
        doc.text(`$${spreadsheet.anticipo2.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 170, y, { align: 'right' });
        y += 6;
      }
      if (spreadsheet.anticipo3 > 0) {
        doc.text('Anticipo 3', margin + 5, y);
        doc.text(`$${spreadsheet.anticipo3.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 170, y, { align: 'right' });
        y += 6;
      }

      // Total anticipos
      y += 5;
      doc.line(margin, y, 190, y);
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL ANTICIPOS:', margin + 5, y);
      doc.text(`$${totalAnticipo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 170, y, { align: 'right' });

      // Saldo final
      y += 15;
      if (esSaldoAFavor) {
        doc.setFillColor(220, 252, 231); // Verde claro
      } else {
        doc.setFillColor(254, 226, 226); // Rojo claro
      }
      doc.rect(margin, y, 170, 15, 'F');
      doc.setFontSize(14);
      if (esSaldoAFavor) {
        doc.setTextColor(22, 163, 74); // Verde
      } else {
        doc.setTextColor(220, 38, 38); // Rojo
      }
      doc.text(esSaldoAFavor ? 'SALDO A FAVOR:' : 'SALDO PENDIENTE:', margin + 5, y + 10);
      doc.text(`$${Math.abs(diferencia).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 170, y + 10, { align: 'right' });

      // Footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text('Documento generado por AduanaSoft', 105, 285, { align: 'center' });

      doc.save(`Cierre_${selectedItem.contenedor || 'cuenta'}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setGenerating(false);
    }
  };

  // Input de moneda reutilizable
  const CurrencyInput = ({ name, value, label }) => (
    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
        <input
          type="number"
          name={name}
          value={value || ''}
          onChange={handleCalcChange}
          placeholder="0.00"
          className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-right font-mono outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-12">
      {/* Buscador */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <ClipboardCheck className="mr-2 text-blue-600" />
          Cierre de Cuenta
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Busca una operación para generar su estado de cuenta final
        </p>

        <div className="relative">
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
            Buscar Contenedor / BL
          </label>
          <div className="flex items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Escribe para buscar..."
                className="w-full pl-10 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg uppercase"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
              />
            </div>
            {selectedItem && (
              <button
                onClick={handleClear}
                className="ml-2 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Dropdown de resultados */}
          {showDropdown && searchTerm && !selectedItem && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-b-lg z-50 max-h-60 overflow-y-auto mt-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 transition-colors"
                  >
                    <div className="font-bold text-slate-700">{item.bl_master || item.bl}</div>
                    <div className="text-xs text-slate-500">
                      {item.empresa?.nombre || item.empresa} - {item.contenedor}
                    </div>
                    <div className="text-xs text-blue-600 font-mono mt-1">{item.comentarios}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400">
                  No se encontraron resultados
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hoja de cálculo */}
      {selectedItem && (
        <div className="bg-white shadow-lg border border-slate-200 rounded-xl overflow-hidden">
          {/* Header del ticket */}
          <div className="bg-slate-800 text-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">{selectedItem.contenedor}</h3>
                <p className="text-slate-300 text-sm">{selectedItem.empresa?.nombre || selectedItem.empresa}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">BL Master</p>
                <p className="font-mono">{selectedItem.bl_master || selectedItem.bl}</p>
              </div>
            </div>
            <div className="mt-2 px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded inline-block">
              {selectedItem.comentarios}
            </div>
          </div>

          {/* Cuerpo de la hoja de cálculo */}
          <div className="p-6 space-y-6">
            {/* Sección: Cobros al cliente */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center">
                <Calculator size={16} className="mr-2 text-blue-600" />
                Cobros al Cliente
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CurrencyInput name="venta" value={spreadsheet.venta} label="Venta / Mercancía" />
                <CurrencyInput name="almacenajes" value={spreadsheet.almacenajes} label="Almacenajes" />
                <CurrencyInput name="transporte" value={spreadsheet.transporte} label="Transporte" />
                <CurrencyInput name="demoras" value={spreadsheet.demoras} label="Demoras" />
                <CurrencyInput name="estadias" value={spreadsheet.estadias} label="Estadías" />
                <CurrencyInput name="maniobras" value={spreadsheet.maniobras} label="Maniobras" />
                <CurrencyInput name="honorarios" value={spreadsheet.honorarios} label="Honorarios" />
                <CurrencyInput name="otros" value={spreadsheet.otros} label="Otros" />
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                <span className="font-bold text-blue-800">Total Cliente:</span>
                <span className="text-xl font-bold text-blue-800">{formatCurrency(totalCliente)}</span>
              </div>
            </div>

            {/* Sección: Anticipos */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center">
                <DollarSign size={16} className="mr-2 text-green-600" />
                Anticipos Recibidos
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <CurrencyInput name="anticipo1" value={spreadsheet.anticipo1} label="Anticipo 1" />
                <CurrencyInput name="anticipo2" value={spreadsheet.anticipo2} label="Anticipo 2" />
                <CurrencyInput name="anticipo3" value={spreadsheet.anticipo3} label="Anticipo 3" />
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg flex justify-between items-center">
                <span className="font-bold text-green-800">Total Anticipos:</span>
                <span className="text-xl font-bold text-green-800">{formatCurrency(totalAnticipo)}</span>
              </div>
            </div>

            {/* Sección: Saldo final */}
            <div className={`p-4 rounded-xl ${esSaldoAFavor ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-bold ${esSaldoAFavor ? 'text-green-700' : 'text-red-700'}`}>
                    {esSaldoAFavor ? 'SALDO A FAVOR DEL CLIENTE' : 'SALDO PENDIENTE DE COBRO'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {esSaldoAFavor ? 'El cliente tiene un crédito a favor' : 'Monto que el cliente debe pagar'}
                  </p>
                </div>
                <span className={`text-3xl font-bold ${esSaldoAFavor ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(Math.abs(diferencia))}
                </span>
              </div>
            </div>
          </div>

          {/* Footer con botón de descarga */}
          <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={handleSavePDF}
              disabled={generating}
              className="px-6 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 text-sm font-bold flex items-center transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText size={16} className="mr-2" />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!selectedItem && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <Search size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Busca una operación para comenzar</p>
          <p className="text-slate-400 text-sm mt-1">
            Podrás calcular el estado de cuenta y generar el PDF de cierre
          </p>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para el ícono de dólar
const DollarSign = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

export default AccountClosure;