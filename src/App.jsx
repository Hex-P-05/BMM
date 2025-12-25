// src/App.jsx
import React, { useState } from 'react';
import { 
  LayoutDashboard, Table as TableIcon, Plus, 
  ClipboardCheck, Calculator, ChevronRight, 
  ChevronLeft, Ship, User, LogOut 
} from 'lucide-react';
import api from './api/axios';
// Vistas
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import ListView from './views/ListView';
import CaptureForm from './views/CaptureForm';
import AccountClosure from './views/AccountClosure';
import QuoteGenerator from './views/QuoteGenerator';

// Modales
import PaymentModal from './modals/PaymentModal';
import EditModal from './modals/EditModal';
import CloseModal from './modals/CloseModal';

// Componentes
import RoleBadge from './components/RoleBadge';

// Utils & Data
import { rawData } from './data/constants';
import { calculateStatus } from './utils/helpers';

// Datos iniciales
const initialData = rawData.map(item => ({
  ...item,
  status: calculateStatus(item.eta)
}));

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('admin');
  const [userName, setUserName] = useState('ADMIN'); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);

  // Estados de modales
  const [paymentConfirmation, setPaymentConfirmation] = useState({ isOpen: false, item: null });
  const [editingItem, setEditingItem] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [itemToClose, setItemToClose] = useState(null);

  const handleLogin = (userRole, name) => { setRole(userRole); setUserName(name); setIsLoggedIn(true); };
  const handleLogout = () => { setIsLoggedIn(false); setActiveTab('dashboard'); };
  
  const handleSave = (newItem) => {
    const itemWithId = { ...newItem, id: Date.now() };
    setData([itemWithId, ...data]);
    setActiveTab('list');
  };

  const handleEditClick = (item) => setEditingItem(item);
  
  const handleSaveEdit = (editedItem) => {
    const newData = data.map(item => 
      item.id === editedItem.id 
      ? { ...editedItem, status: calculateStatus(editedItem.eta), editCount: (item.editCount || 0) + 1 } 
      : item
    );
    setData(newData);
    setEditingItem(null);
  };

  const initiatePayment = (id) => { 
    const item = data.find(i => i.id === id); 
    if (item) setPaymentConfirmation({ isOpen: true, item }); 
  };
  
  const executePayment = () => { 
    const { item } = paymentConfirmation; 
    if (!item) return; 
    handlePayAll(item.id); 
    setPaymentConfirmation({ isOpen: false, item: null }); 
  };

  const handlePayItem = (id, costKey) => {
    const newData = data.map(d => 
      d.id === id ? { ...d, paidFlags: { ...(d.paidFlags || {}), [costKey]: true } } : d
    );
    setData(newData);
  };

  const handlePayAll = (id) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newData = data.map(d => 
      d.id === id 
      ? { 
          ...d, 
          payment: 'paid', 
          paymentDate: todayStr, 
          paidFlags: { 
            costDemoras: true, costAlmacenaje: true, costOperativos: true, 
            costPortuarios: true, costApoyo: true, costImpuestos: true, 
            costLiberacion: true, costTransporte: true 
          } 
        } 
      : d
    );
    setData(newData);
  };

  const handleCloseOperation = (item) => {
    if (item.payment !== 'paid') {
       if(!window.confirm("⚠️ PAGOS PENDIENTES\n¿Deseas continuar?")) return;
       handlePayAll(item.id); 
       setItemToClose({ ...item, payment: 'paid' });
    } else {
       setItemToClose(item);
    }
    setCloseModalOpen(true);
  };

  const confirmClose = () => {
    const newData = data.map(d => {
       if (d.id === itemToClose.id) return { ...d, status: 'closed' };
       return d;
    });
    setData(newData);
    setCloseModalOpen(false);
    setItemToClose(null);
  };

  const NavItem = ({ id, icon: Icon, label }) => {
    if (role === 'pagos' && id === 'capture') return null;
    return (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-300 ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isSidebarCollapsed ? 'justify-center' : ''}`} 
        title={isSidebarCollapsed ? label : ''}
      >
        <Icon size={20} className={`${isSidebarCollapsed ? '' : 'mr-3'}`} />
        {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
      </button>
    );
  };

  if (!isLoggedIn) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 relative">
      <PaymentModal isOpen={paymentConfirmation.isOpen} item={paymentConfirmation.item} onClose={() => setPaymentConfirmation({ isOpen: false, item: null })} onConfirm={executePayment} />
      <EditModal isOpen={!!editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveEdit} item={editingItem} role={role} />
      <CloseModal isOpen={closeModalOpen} onClose={confirmClose} item={itemToClose} />

      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out relative`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-9 bg-blue-600 text-white p-1 rounded-full shadow-lg border-2 border-slate-100 hover:bg-blue-700 transition-colors z-20">
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"><Ship size={20} className="text-white" /></div>
            {!isSidebarCollapsed && (<div className="overflow-hidden"><span className="text-lg font-bold tracking-tight whitespace-nowrap">AduanaSoft</span><p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">v2.3 Beta</p></div>)}
        </div>

        <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Visión general" />
          <NavItem id="list" icon={TableIcon} label="Sábana operativa" />
          <NavItem id="capture" icon={Plus} label="Alta de contenedores" />
          <NavItem id="closure" icon={ClipboardCheck} label="Cierre de cuenta" /> 
          {(role === 'admin' || role === 'ejecutivo') && (<div className={`mt-6 ${isSidebarCollapsed ? 'border-t border-slate-800 pt-6' : ''}`}><NavItem id="quotes" icon={Calculator} label="Cotizador" /></div>)}
        </nav>

        <div className="p-4 border-t border-slate-800">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-4`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0"><User size={20} /></div>
                {!isSidebarCollapsed && (<div className="overflow-hidden"><p className="text-sm font-medium whitespace-nowrap">Hola, {userName}</p><RoleBadge role={role} /></div>)}
            </div>
            <button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-center px-4'} py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors text-xs font-bold`}>
                <LogOut size={14} className={`${isSidebarCollapsed ? '' : 'mr-2'}`} /> {!isSidebarCollapsed && "Cerrar sesión"}
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {activeTab === 'list' && 'Gestión y pagos'}
                <span className="hidden md:inline-flex ml-4 transform scale-90 origin-left"><RoleBadge role={role} /></span>
            </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && <DashboardView data={data} />}
          {activeTab === 'capture' && <CaptureForm onSave={handleSave} onCancel={() => setActiveTab('dashboard')} existingData={data} role={role} userName={userName} />}
          {activeTab === 'list' && (
            <ListView 
                data={data} 
                onPayItem={handlePayItem} 
                onPayAll={handlePayAll} 
                onCloseOperation={handleCloseOperation} 
                role={role} 
                onEdit={handleEditClick} 
            />
          )}
          {activeTab === 'closure' && <AccountClosure data={data} />}
          {activeTab === 'quotes' && <QuoteGenerator role={role} />}
        </div>
      </main>
    </div>
  );
}