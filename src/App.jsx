// src/App.jsx
import React, { useState } from 'react';
import { 
  LayoutDashboard, Table as TableIcon, Plus, 
  ClipboardCheck, Calculator, ChevronRight, 
  ChevronLeft, Ship, User, LogOut, Loader2
} from 'lucide-react';

// Context
import { useAuth } from './context/AuthContext';

// Hooks
import { useTickets } from './hooks/useTickets';
import { usePagos } from './hooks/usePagos';
import { useCatalogos } from './hooks/useCatalogos';

// Vistas
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import SabanaView from './views/SabanaView';
import CaptureForm from './views/CaptureForm';
import AccountClosure from './views/AccountClosure';
import QuoteGenerator from './views/QuoteGenerator';

// Modales
import PaymentModal from './modals/PaymentModal';
import EditModal from './modals/EditModal';
import CloseModal from './modals/CloseModal';

// Componentes
import RoleBadge, { PuertoBadge } from './components/RoleBadge';

function AppContent() {
  const { 
    isLoggedIn, 
    loading: authLoading, 
    logout, 
    role, 
    userName,
    puertoCodigo,
    puertoNombre,
    esGlobal,
    isAdmin,
    isPagos,
    // Permisos
    canCreateContainers,
    isRevalidaciones,
    isLogistica,
    isClasificacion,
  } = useAuth();
  
  // Hooks de datos
  const { 
    tickets, 
    loading: ticketsLoading, 
    dashboard,
    createTicket, 
    updateTicket,
    getNextConsecutivo,
    refresh: refreshTickets 
  } = useTickets();
  
  const { 
    registrarPago, 
    cerrarOperacion, 
    loading: pagosLoading 
  } = usePagos();
  
  const catalogos = useCatalogos();

  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal States
  const [paymentConfirmation, setPaymentConfirmation] = useState({ isOpen: false, item: null });
  const [editingItem, setEditingItem] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [itemToClose, setItemToClose] = useState(null);

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView />;
  }

  // === HANDLERS ===
  const handleSave = async (newItem) => {
    const result = await createTicket(newItem);
    if (result.success) {
      setActiveTab('list');
      refreshTickets();
    } else {
      alert('Error al crear el contenedor: ' + JSON.stringify(result.error));
    }
  };

  const handleEditClick = (item) => setEditingItem(item);

  const handleSaveEdit = async (editedItem) => {
    const result = await updateTicket(editedItem.id, editedItem);
    if (result.success) {
      setEditingItem(null);
      refreshTickets();
    } else {
      alert('Error al editar: ' + JSON.stringify(result.error));
    }
  };

  const handlePayAll = async (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const result = await registrarPago(ticketId, {
      monto: ticket.importe,
      fecha_pago: new Date().toISOString().split('T')[0]
    });
    if (result.success) {
      refreshTickets();
    } else {
      alert('Error al registrar pago: ' + result.error);
    }
  };

  const executePayment = async () => {
    const { item } = paymentConfirmation;
    if (!item) return;
    await handlePayAll(item.id);
    setPaymentConfirmation({ isOpen: false, item: null });
  };

  const handleCloseOperation = (item) => {
    setItemToClose(item);
    setCloseModalOpen(true);
  };

  const confirmClose = async () => {
    if (!itemToClose) return;
    const result = await cerrarOperacion(itemToClose.id, {
      monto_final: itemToClose.importe,
      desglose: {}
    });
    if (result.success) {
      refreshTickets();
    } else {
      alert('Error al cerrar operacion: ' + result.error);
    }
    setCloseModalOpen(false);
    setItemToClose(null);
  };

  const canViewSabana = isAdmin || isPagos || isRevalidaciones || isLogistica || isClasificacion;
  const canCapture = canCreateContainers || isRevalidaciones || isLogistica;

  const NavItem = ({ id, icon: Icon, label, visible = true }) => {
    if (!visible) return null;
    return (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-300 
          ${activeTab === id 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          } 
          ${isSidebarCollapsed ? 'justify-center' : ''}`
        } 
        title={isSidebarCollapsed ? label : ''}
      >
        <Icon size={20} className={`${isSidebarCollapsed ? '' : 'mr-3'}`} />
        {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 relative">
      <PaymentModal 
        isOpen={paymentConfirmation.isOpen} 
        item={paymentConfirmation.item} 
        onClose={() => setPaymentConfirmation({ isOpen: false, item: null })} 
        onConfirm={executePayment}
        loading={pagosLoading}
      />
      <EditModal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        onSave={handleSaveEdit} 
        item={editingItem} 
        role={role} 
      />
      <CloseModal 
        isOpen={closeModalOpen} 
        onClose={confirmClose} 
        item={itemToClose} 
      />

      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out relative`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          className="absolute -right-3 top-9 bg-blue-600 text-white p-1 rounded-full shadow-lg border-2 border-slate-100 hover:bg-blue-700 transition-colors z-20"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Ship size={20} className="text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <span className="text-lg font-bold tracking-tight whitespace-nowrap">AduanaSoft</span>
              <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">v2.5 Beta</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Vision general" />
          <NavItem id="list" icon={TableIcon} label="Sabana operativa" visible={canViewSabana} />
          <NavItem id="capture" icon={Plus} label="Alta de pago" visible={canCapture} />
          <NavItem id="closure" icon={ClipboardCheck} label="Cierre de cuenta" visible={isAdmin || isPagos} />
          <NavItem id="quotes" icon={Calculator} label="Cotizador" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-4`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
              <User size={20} />
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium whitespace-nowrap">Hola, {userName}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <RoleBadge role={role} />
                  {!esGlobal && puertoCodigo && (
                    <PuertoBadge codigo={puertoCodigo} nombre={puertoNombre} />
                  )}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={logout} 
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-center px-4'} py-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors text-xs font-bold`}
          >
            <LogOut size={14} className={`${isSidebarCollapsed ? '' : 'mr-2'}`} /> 
            {!isSidebarCollapsed && "Cerrar sesion"}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {activeTab === 'dashboard' && 'Vision general'}
            {activeTab === 'list' && 'Sabana operativa'}
            {activeTab === 'capture' && 'Alta de pago'}
            {activeTab === 'closure' && 'Cierre de cuenta'}
            {activeTab === 'quotes' && 'Cotizador'}
            <span className="hidden md:inline-flex ml-4 transform scale-90 origin-left gap-2">
              <RoleBadge role={role} />
              {!esGlobal && puertoCodigo && (
                <PuertoBadge codigo={puertoCodigo} nombre={puertoNombre} />
              )}
            </span>
          </div>
          {ticketsLoading && (
            <div className="flex items-center text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin mr-2" />
              Actualizando...
            </div>
          )}
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView data={tickets} dashboard={dashboard} />
          )}
          {activeTab === 'capture' && canCapture && (
            <CaptureForm 
              onSave={handleSave} 
              onCancel={() => setActiveTab('dashboard')} 
              existingData={tickets} 
              role={role} 
              userName={userName}
              catalogos={catalogos}
              getNextConsecutivo={getNextConsecutivo}
            />
          )}
          {activeTab === 'list' && canViewSabana && (
            <SabanaView 
              data={tickets} 
              onPayAll={handlePayAll}
              onCloseOperation={handleCloseOperation} 
              onEdit={handleEditClick}
              loading={ticketsLoading}
            />
          )}
          {activeTab === 'closure' && (isAdmin || isPagos) && (
            <AccountClosure data={tickets} />
          )}
          {activeTab === 'quotes' && <QuoteGenerator role={role} />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}