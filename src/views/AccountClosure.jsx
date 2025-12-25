// src/views/AccountClosure.jsx
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { ClipboardCheck, Search, X, Download } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const AccountClosure = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [spreadsheet, setSpreadsheet] = useState({
    venta: 0, almacenajes: 0, transporte: 0, demoras: 0, estadias: 0, otros: 0,
    anticipo1: 0, anticipo2: 0, anticipo3: 0
  });

  const filteredOptions = data.filter(item => 
    item.bl.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.contenedor && item.contenedor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm(`${item.bl} - ${item.contenedor || item.container}`);
    setShowDropdown(false);
    setSpreadsheet({
        venta: 0, almacenajes: 0, transporte: 0, demoras: 0, estadias: 0, otros: 0,
        anticipo1: 0, anticipo2: 0, anticipo3: 0
    });
  };

  const handleCalcChange = (e) => {
    const { name, value } = e.target;
    setSpreadsheet({ ...spreadsheet, [name]: parseFloat(value) || 0 });
  };

  const totalCliente = spreadsheet.venta + spreadsheet.almacenajes + spreadsheet.transporte + spreadsheet.demoras + spreadsheet.estadias + spreadsheet.otros;
  const totalAnticipo = spreadsheet.anticipo1 + spreadsheet.anticipo2 + spreadsheet.anticipo3;
  const diferencia = totalCliente - totalAnticipo;

  const handleSavePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let yPos = 20;
    // ... TU LÓGICA DE PDF DE CIERRE DE CUENTA AQUÍ ...
    // (Puedes copiar la lógica exacta del componente original)
    doc.text("ESTADO DE CUENTA FINAL", margin, 20);
    doc.save(`Cierre_${selectedItem.bl}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <ClipboardCheck className="mr-2 text-blue-600"/> Cierre de Cuenta
        </h2>
        <div className="relative">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Buscar Contenedor / BL</label>
            <div className="flex items-center">
                <Search className="absolute left-3 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Escribe para buscar..." 
                    className="w-full pl-10 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg uppercase"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                />
                {selectedItem && (
                    <button onClick={() => { setSelectedItem(null); setSearchTerm(''); }} className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded"><X/></button>
                )}
            </div>
            
            {showDropdown && searchTerm && !selectedItem && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-b-lg z-50 max-h-60 overflow-y-auto">
                    {filteredOptions.map(item => (
                        <div key={item.id} onClick={() => handleSelect(item)} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50">
                            <div className="font-bold text-slate-700">{item.bl}</div>
                            <div className="text-xs text-slate-500">{item.empresa || item.client} - {item.contenedor || item.container}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
      {/* ... TABLA DE CÁLCULO ... */}
      {selectedItem && (
          <div className="bg-white shadow-2xl border border-slate-300 w-full max-w-4xl mx-auto font-sans p-8">
               <h3 className="text-lg font-bold">Resumen para: {selectedItem.bl}</h3>
               {/* Inputs de la hoja de cálculo */}
          </div>
      )}
    </div>
  );
};
export default AccountClosure;v