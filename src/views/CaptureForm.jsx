// src/views/CaptureForm.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Lock } from 'lucide-react';
import { EMPRESAS_DB, CONCEPTOS_DB, PROVEEDORES_DB } from '../data/constants';
import { calculateStatus } from '../utils/helpers';

const CaptureForm = ({ onSave, onCancel, existingData, role, userName }) => {
  if (role === 'pagos') return <div className="p-10 text-center text-red-500 font-bold">Acceso denegado.</div>;

  const [formData, setFormData] = useState({
    empresa: '', 
    fechaAlta: new Date().toISOString().split('T')[0], 
    concepto: '', 
    prefijo: '', 
    consecutivo: 0, 
    contenedor: '', 
    pedimento: '', 
    factura: '', 
    proveedor: '', 
    banco: '', 
    cuenta: '', 
    clabe: '',
    bl: '', 
    eta: '', 
    freeDays: 7, 
    currency: 'MXN',
    costDemoras: 0, costAlmacenaje: 0, costOperativos: 0, costPortuarios: 0, 
    costApoyo: 0, costImpuestos: 0, costLiberacion: 0, costTransporte: 0
  });

  const [totalAmount, setTotalAmount] = useState(0);
  const [generatedComments, setGeneratedComments] = useState('');
  const [previewConsecutivo, setPreviewConsecutivo] = useState('#');

  useEffect(() => {
    const sum = 
      (parseFloat(formData.costDemoras) || 0) + (parseFloat(formData.costAlmacenaje) || 0) +
      (parseFloat(formData.costOperativos) || 0) + (parseFloat(formData.costPortuarios) || 0) +
      (parseFloat(formData.costApoyo) || 0) + (parseFloat(formData.costImpuestos) || 0) +
      (parseFloat(formData.costLiberacion) || 0) + (parseFloat(formData.costTransporte) || 0);
    setTotalAmount(sum);
  }, [formData]);

  useEffect(() => {
    let nextNum = 0;
    if (formData.prefijo && formData.prefijo.length === 3) {
        const count = existingData.filter(d => d.prefijo === formData.prefijo.toUpperCase()).length;
        nextNum = count + 1;
    }
    setPreviewConsecutivo(nextNum > 0 ? nextNum : '#');
    const cleanContenedor = formData.contenedor ? formData.contenedor.toUpperCase() : '';
    const cleanConcepto = formData.concepto || '...';
    const cleanPrefijo = formData.prefijo ? formData.prefijo.toUpperCase() : '...';
    
    const comment = `${cleanConcepto} ${cleanPrefijo} ${nextNum > 0 ? nextNum : '#'} ${cleanContenedor}`;
    setGeneratedComments(comment);
  }, [formData.prefijo, formData.concepto, formData.contenedor, existingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'prefijo') {
        if (value.length <= 3) setFormData({ ...formData, [name]: value.toUpperCase() });
        return;
    }
    if (name === 'proveedor') {
        const prov = PROVEEDORES_DB.find(p => p.nombre === value);
        if (prov) {
            setFormData({ ...formData, proveedor: value, banco: prov.banco, cuenta: prov.cuenta, clabe: prov.clabe });
        } else {
            setFormData({ ...formData, proveedor: value, banco: '', cuenta: '', clabe: '' });
        }
        return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const count = existingData.filter(d => d.prefijo === formData.prefijo).length;
    const finalConsecutivo = count + 1;
    const finalComment = `${formData.concepto} ${formData.prefijo} ${finalConsecutivo} ${formData.contenedor.toUpperCase()}`;

    onSave({ 
      ...formData, 
      container: formData.contenedor.toUpperCase(),
      ejecutivo: userName, 
      consecutivo: finalConsecutivo,
      comentarios: finalComment,
      amount: totalAmount, 
      status: calculateStatus(formData.eta), 
      payment: 'pending', 
      paymentDate: null, 
      paymentDelay: 0, 
      editCount: 0 
    });
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <div>
             <h2 className="text-xl font-bold text-slate-800 flex items-center"><FileText className="mr-2 text-blue-600" /> Alta de contenedor</h2>
             <p className="text-xs text-slate-500">Ejecutivo: <b>{userName}</b></p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
             <h3 className="text-xs font-bold text-blue-800 uppercase mb-4">Datos de identificación</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Empresa</label>
                    <select required name="empresa" value={formData.empresa} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none">
                        <option value="">-- Seleccionar --</option>
                        {EMPRESAS_DB.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Fecha alta</label>
                    <input type="date" name="fechaAlta" value={formData.fechaAlta} onChange={handleChange} className="w-full p-2 border rounded text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Prefijo (3 Letras)</label>
                    <input required name="prefijo" value={formData.prefijo} onChange={handleChange} placeholder="Ej. IMP" className="w-full p-2 border rounded text-sm uppercase font-bold text-center tracking-widest border-blue-300 focus:bg-blue-50 outline-none" maxLength={3} />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Concepto</label>
                    <select required name="concepto" value={formData.concepto} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none">
                        <option value="">-- Seleccionar --</option>
                        {CONCEPTOS_DB.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Contenedor</label>
                    <input required name="contenedor" value={formData.contenedor} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">BL Master</label>
                    <input required name="bl" value={formData.bl} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" />
                </div>
             </div>
             
             <div className="mt-4 p-3 bg-slate-800 text-white rounded-lg flex items-center justify-between shadow-inner">
                <div>
                    <span className="text-[10px] text-slate-400 uppercase block mb-1">Comentarios (Generado Automáticamente)</span>
                    <span className="font-mono text-sm font-bold text-yellow-400 tracking-wide">{generatedComments}</span>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Consecutivo Actual</span>
                    <span className="font-bold text-white text-lg">{previewConsecutivo}</span>
                </div>
             </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
             <h3 className="text-xs font-bold text-slate-600 uppercase mb-4">Datos financieros y proveedor</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Proveedor</label>
                    <select required name="proveedor" value={formData.proveedor} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-white outline-none">
                        <option value="">-- Seleccionar --</option>
                        {PROVEEDORES_DB.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-[10px] font-bold text-slate-500 mb-1 block">Banco</label><input readOnly value={formData.banco} className="w-full p-2 bg-slate-200 border rounded text-xs font-bold" /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 mb-1 block">Cuenta</label><input readOnly value={formData.cuenta} className="w-full p-2 bg-slate-200 border rounded text-xs" /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 mb-1 block">Clabe</label><input readOnly value={formData.clabe} className="w-full p-2 bg-slate-200 border rounded text-xs" /></div>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Pedimento</label><input name="pedimento" value={formData.pedimento} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" /></div>
                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Factura</label><input name="factura" value={formData.factura} onChange={handleChange} className="w-full p-2 border rounded text-sm uppercase outline-none" /></div>
                <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-bold text-slate-600 mb-1 block">ETA</label><input required type="date" name="eta" value={formData.eta} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-600 mb-1 block">Días libres</label><input required type="number" name="freeDays" value={formData.freeDays} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none" /></div>
                </div>
             </div>
          </div>

          <div className="col-span-1 md:col-span-2 border-t pt-4">
               <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700">Desglose de costos</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="text-xs p-1 border rounded font-bold text-blue-600 bg-white"><option value="MXN">MXN</option><option value="USD">USD</option></select>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {name:'costDemoras',l:'Demoras'}, {name:'costAlmacenaje',l:'Almacenaje'},
                    {name:'costOperativos',l:'Operativos'}, {name:'costPortuarios',l:'Portuarios'},
                    {name:'costApoyo',l:'Apoyo'}, {name:'costImpuestos',l:'Impuestos'},
                    {name:'costLiberacion',l:'Liberación'}, {name:'costTransporte',l:'Transporte'}
                  ].map(f => (
                      <div key={f.name}>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">{f.l}</label>
                          <div className="relative"><span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span><input type="number" name={f.name} className="w-full pl-5 p-1.5 border rounded text-sm text-right outline-none focus:border-blue-500" onChange={handleChange} placeholder="0"/></div>
                      </div>
                  ))}
               </div>
               <div className="mt-4 flex justify-end">
                  <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                     <span className="text-xs text-slate-500 mr-2 uppercase font-bold">Total a registrar:</span>
                     <span className="text-lg font-bold text-slate-800">${totalAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">{formData.currency}</span></span>
                  </div>
               </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={onCancel} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center shadow-lg font-bold transition-all"><Lock size={16} className="mr-2" /> Dar de alta</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CaptureForm;