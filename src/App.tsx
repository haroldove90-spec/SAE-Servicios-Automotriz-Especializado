/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, User, Wrench, Package, Car, Laptop, Clock, 
  Settings, CheckCircle2, ChevronRight, Menu, HelpCircle, AlertTriangle,
  Smartphone, Download, X, Home, LogOut, TrendingUp, DollarSign, Users,
  FileText, Calendar, History, ListFilter, BellRing, Database, Cloud, RefreshCw, ClipboardList
} from 'lucide-react';
import { useWorkshopState } from './useWorkshopState';
import { UserRole } from './types';

// Dashboard Components
import AdminDashboard from './components/AdminDashboard';
import AdvisorDashboard from './components/AdvisorDashboard';
import MechanicDashboard from './components/MechanicDashboard';
import WarehouseDashboard from './components/WarehouseDashboard';
import CustomerPortal from './components/CustomerPortal';

export default function App() {
  const {
    clients,
    vehicles,
    employees,
    inventory,
    suppliers,
    purchaseOrders,
    requisitions,
    orders,
    transactions,
    settings,
    setSettings,
    presupuestos,
    ordenesReparacion,
    notasSalida,
    
    // Supabase Sync State & Actions
    isSyncing,
    supabaseConnected,
    syncError,
    fetchFromSupabase,
    uploadToSupabase,
    
    // Actions
    addClient,
    updateClient,
    addVehicle,
    updateVehicle,
    addEmployee,
    updateEmployee,
    addInventoryItem,
    updateInventoryItem,
    addPurchaseOrder,
    receivePurchaseOrder,
    createServiceOrder,
    updateOrderStatus,
    updateOrderDiagnostics,
    addOrderItem,
    deleteOrderItem,
    approveBudgetLine,
    clockInOrder,
    pauseOrder,
    clockOutOrder,
    submitPartRequisition,
    handleRequisitionStatus,
    addTransaction,
    registerOrderPayment,
    handleClientCreditPayment,
    addSupplier,
    addPresupuesto,
    updatePresupuesto,
    deletePresupuesto,
    addOrdenReparacion,
    updateOrdenReparacion,
    deleteOrdenReparacion,
    addNotaSalida,
    updateNotaSalida,
    deleteNotaSalida,
    convertPresupuestoToOrder,
    resetDatabase
  } = useWorkshopState();

  // Active view role
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('sae_current_role');
    return (saved as UserRole) || 'admin';
  });
  
  // Landing page active state
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    const saved = localStorage.getItem('sae_show_landing');
    return saved !== null ? saved === 'true' : true;
  });

  // Persistent active tabs for each role, allowing persistent selection between role switches!
  const [adminTab, setAdminTab] = useState<'metrics' | 'finances' | 'personnel' | 'config'>(() => {
    return (localStorage.getItem('sae_admin_tab') as any) || 'metrics';
  });
  const [advisorTab, setAdvisorTab] = useState<'reception' | 'quotes' | 'ordenes_reparacion' | 'salidas' | 'agenda' | 'crm'>(() => {
    const saved = localStorage.getItem('sae_advisor_tab');
    if (saved === 'agenda' || saved === 'crm') return 'reception';
    return (saved as any) || 'reception';
  });
  const [mechanicTab, setMechanicTab] = useState<'tasks' | 'diagnostics' | 'parts'>(() => {
    return (localStorage.getItem('sae_mechanic_tab') as any) || 'tasks';
  });
  const [warehouseTab, setWarehouseTab] = useState<'catalog' | 'requisitions' | 'purchases'>(() => {
    return (localStorage.getItem('sae_warehouse_tab') as any) || 'catalog';
  });
  const [clientTab, setClientTab] = useState<'tracking' | 'budget' | 'alerts'>(() => {
    return (localStorage.getItem('sae_client_tab') as any) || 'tracking';
  });

  // Keep state updated in localStorage
  useEffect(() => {
    localStorage.setItem('sae_current_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('sae_show_landing', String(showLanding));
  }, [showLanding]);

  useEffect(() => {
    localStorage.setItem('sae_admin_tab', adminTab);
  }, [adminTab]);

  useEffect(() => {
    localStorage.setItem('sae_advisor_tab', advisorTab);
  }, [advisorTab]);

  useEffect(() => {
    localStorage.setItem('sae_mechanic_tab', mechanicTab);
  }, [mechanicTab]);

  useEffect(() => {
    localStorage.setItem('sae_warehouse_tab', warehouseTab);
  }, [warehouseTab]);

  useEffect(() => {
    localStorage.setItem('sae_client_tab', clientTab);
  }, [clientTab]);

  // Define tab navigation details for each role
  const getRoleTabs = () => {
    switch(currentRole) {
      case 'admin':
        return [
          { id: 'metrics', label: 'Métricas', icon: TrendingUp },
          { id: 'finances', label: 'Finanzas', icon: DollarSign },
          { id: 'personnel', label: 'Personal', icon: Users },
          { id: 'config', label: 'Config', icon: Settings },
        ];
      case 'advisor':
        return [
          { id: 'reception', label: 'Recepción', icon: Car },
          { id: 'quotes', label: 'Presupuestos', icon: FileText },
          { id: 'ordenes_reparacion', label: 'Órdenes de Reparación', icon: ClipboardList },
          { id: 'salidas', label: 'Salidas', icon: LogOut },
        ];
      case 'mechanic':
        return [
          { id: 'tasks', label: 'Tareas', icon: ListFilter },
          { id: 'diagnostics', label: 'Diagnóstico', icon: Wrench },
          { id: 'parts', label: 'Refacciones', icon: Package },
        ];
      case 'warehouse':
        return [
          { id: 'catalog', label: 'Catálogo', icon: Package },
          { id: 'requisitions', label: 'Pedidos', icon: FileText },
          { id: 'purchases', label: 'Compras', icon: Download },
        ];
      case 'client':
        return [
          { id: 'tracking', label: 'Seguimiento', icon: Car },
          { id: 'budget', label: 'Presupuesto', icon: DollarSign },
          { id: 'alerts', label: 'Alertas CDMX', icon: BellRing },
        ];
      default:
        return [];
    }
  };

  const getActiveTabValue = () => {
    switch(currentRole) {
      case 'admin': return adminTab;
      case 'advisor': return advisorTab;
      case 'mechanic': return mechanicTab;
      case 'warehouse': return warehouseTab;
      case 'client': return clientTab;
    }
  };

  const setActiveTabValue = (val: string) => {
    switch(currentRole) {
      case 'admin': setAdminTab(val as any); break;
      case 'advisor': setAdvisorTab(val as any); break;
      case 'mechanic': setMechanicTab(val as any); break;
      case 'warehouse': setWarehouseTab(val as any); break;
      case 'client': setClientTab(val as any); break;
    }
  };
  
  // Mobile responsive menu toggle
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  // Clock state (Simulating real-world CDMX Local Time)
  const [timeStr, setTimeStr] = useState('15:52:24');
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 font-sans text-slate-800 flex flex-col selection:bg-amber-600 selection:text-white ${!showLanding ? 'pb-24' : ''}`}>
      
      {/* WORKSHOP MAIN LOGO HEADER - Shown only when a role dashboard is active */}
      {!showLanding && (
        <header className="bg-white border-b border-slate-200 py-3 px-4 lg:py-4 lg:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Logo & Workshop Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <img 
                  src="https://appdesignproyectos.com/sre.png" 
                  alt="Servicio Automotriz Especializado" 
                  className="h-10 w-auto sm:h-14 object-contain bg-black/40 p-1 rounded-xl border border-white/10 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-lg md:text-xl font-bold font-display text-slate-800 tracking-tight flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="truncate">SERVICIO AUTOMOTRIZ ESPECIALIZADO</span>
                  <span className="text-[8px] sm:text-[10px] bg-[#8D6A28] text-white px-1.5 sm:px-2 py-0.5 rounded-full font-sans font-semibold uppercase border border-[#8D6A28]/20 shrink-0 w-fit">
                    SAE PWA
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5 hidden lg:flex items-center gap-1.5">
                  <span>RFC: <strong>{settings.rfc}</strong></span>
                  <span>•</span>
                  <span className="truncate">{settings.address}</span>
                </p>
              </div>
            </div>

            {/* Quick Logout button for mobile & tablet (shows up in the header) */}
            <div className="flex lg:hidden items-center shrink-0">
              <button
                onClick={() => setShowLanding(true)}
                className="flex items-center gap-1 bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white px-2.5 py-1.5 rounded-xl border border-red-500/20 text-xs font-bold cursor-pointer transition-all shadow-sm"
                title="Cerrar Sesión / Cambiar de Rol"
              >
                <LogOut size={14} className="text-red-500" />
                <span>Salir</span>
              </button>
            </div>

            {/* Time & Quick Stats Dashboard */}
            <div className="hidden lg:flex items-center flex-wrap gap-4 text-xs font-semibold justify-end">
              {/* Back to Home Button */}
              <button
                onClick={() => setShowLanding(true)}
                className="flex items-center gap-2 bg-white/5 text-slate-300 px-4 py-2.5 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all text-xs cursor-pointer shadow-sm"
                title="Volver a la selección de roles"
              >
                <Home size={15} className="text-[#F8B232]" />
                <span>Volver a Inicio</span>
              </button>

              {/* PWA Install Button */}
              <button
                onClick={handleInstallClick}
                id="pwa-install-nav-btn"
                className="flex items-center gap-2 bg-[#8D6A28] text-white px-4 py-2.5 rounded-xl font-bold border border-white/10 hover:bg-[#aa8134] transition-all text-xs cursor-pointer shadow-md hover:shadow-[#8D6A28]/20"
                title="Instalar Aplicación SAE en tu dispositivo"
              >
                <Smartphone size={15} className="animate-pulse text-amber-300" />
                <span>Instalar App SAE</span>
              </button>

              {/* Supabase Cloud Connection Status */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs shadow-sm">
                <Database size={15} className={supabaseConnected ? "text-emerald-500 animate-pulse" : "text-amber-500"} />
                <div className="text-left">
                  <p className="text-[9px] text-slate-400 font-bold uppercase leading-none tracking-wider">Supabase Cloud</p>
                  <p className="font-mono text-[10px] font-bold text-slate-700 leading-none mt-1">
                    {supabaseConnected === true ? (
                      <span className="text-emerald-600">Conectado</span>
                    ) : supabaseConnected === false ? (
                      <span className="text-red-500">Error Conexión</span>
                    ) : (
                      <span className="text-slate-400">Verificando...</span>
                    )}
                  </p>
                </div>
                {supabaseConnected && (
                  <button
                    onClick={() => fetchFromSupabase()}
                    disabled={isSyncing}
                    className="ml-1 p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Sincronizar ahora con Supabase"
                  >
                    <RefreshCw size={11} className={isSyncing ? "animate-spin text-[#8D6A28]" : ""} />
                  </button>
                )}
                {!supabaseConnected && syncError && (
                  <div className="relative group ml-1">
                    <AlertTriangle size={12} className="text-amber-500 cursor-help" />
                    <div className="absolute right-0 top-6 hidden group-hover:block bg-slate-950 text-white text-[10px] p-2.5 rounded-xl border border-slate-800 shadow-xl w-60 z-50 text-left leading-relaxed">
                      {syncError}
                    </div>
                  </div>
                )}
              </div>

              {/* CDMX Time Tracker */}
              <div className="text-right hidden md:block">
                <p className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Simulación Local CDMX</p>
                <div className="flex items-center gap-1.5 justify-end mt-0.5 text-slate-700 font-mono">
                  <Clock size={12} className="text-slate-400" />
                  <span>15 de Julio de 2026, {timeStr}</span>
                </div>
              </div>

              {/* Quick counters */}
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl flex gap-4 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Órdenes</p>
                  <p className="font-mono font-bold text-slate-800">{orders.length}</p>
                </div>
                <div className="border-l border-slate-200 h-6 self-center"></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Stock Ref.</p>
                  <p className="font-mono font-bold text-slate-800">
                    {inventory.reduce((sum, item) => sum + item.stock, 0)}
                  </p>
                </div>
                <div className="border-l border-slate-200 h-6 self-center"></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Ingresos</p>
                  <p className="font-mono font-bold text-emerald-600">
                    ${transactions.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </header>
      )}

      {/* MASTER CONTAINER FOR WORKFLOW */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {showLanding ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 min-h-[70vh]">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl flex flex-col items-center text-center"
            >
              {/* Majestic SAE Logo */}
              <img 
                src="https://appdesignproyectos.com/sre.png" 
                alt="Servicio Automotriz Especializado (SAE)" 
                className="h-28 sm:h-36 w-auto object-contain bg-black/40 p-3 rounded-2xl border border-white/10 shadow-2xl mb-12"
                referrerPolicy="no-referrer"
              />

              {/* Grid of access icons with name (No description, strictly requested) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 w-full max-w-5xl">
                {[
                  { id: 'admin', name: 'Administrador / Dueño', icon: Shield },
                  { id: 'advisor', name: 'Asesor / Recepción', icon: User },
                  { id: 'mechanic', name: 'Mecánico / Técnico', icon: Wrench },
                  { id: 'warehouse', name: 'Almacén e Inventarios', icon: Package },
                  { id: 'client', name: 'Portal del Cliente', icon: Car }
                ].map((roleItem) => {
                  const IconComponent = roleItem.icon;
                  return (
                    <motion.button
                      key={roleItem.id}
                      whileHover={{ scale: 1.05, borderColor: '#8D6A28', boxShadow: '0 10px 15px -3px rgba(141, 106, 40, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCurrentRole(roleItem.id as UserRole);
                        setShowLanding(false);
                      }}
                      className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 cursor-pointer transition-all aspect-square text-center shadow-sm hover:shadow-md"
                    >
                      <div className="p-3 sm:p-4 bg-[#8D6A28]/10 text-[#8D6A28] rounded-full mb-2 sm:mb-4 border border-[#8D6A28]/20 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 stroke-[1.8]" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-800">{roleItem.name}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Install PWA Button on Landing */}
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 bg-[#8D6A28] text-white px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-[#aa8134] transition-all text-xs cursor-pointer shadow-lg hover:shadow-[#8D6A28]/20"
                >
                  <Smartphone size={16} className="animate-pulse text-amber-300" />
                  <span>Instalar Aplicación SAE</span>
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Dynamic Warning Header explaining the active simulation mode */}
            <div className={`p-4 rounded-xl border flex gap-3 text-xs items-start ${
              currentRole === 'admin' ? 'bg-amber-50 border-amber-200 text-amber-900' :
              currentRole === 'advisor' ? 'bg-blue-50 border-blue-200 text-blue-900' :
              currentRole === 'mechanic' ? 'bg-orange-50 border-orange-200 text-orange-900' :
              currentRole === 'warehouse' ? 'bg-purple-50 border-purple-200 text-purple-900' :
              'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="p-1.5 rounded-lg bg-white shadow-sm shrink-0 font-bold text-base flex justify-center items-center">
                {currentRole === 'admin' && '👑'}
                {currentRole === 'advisor' && '📋'}
                {currentRole === 'mechanic' && '🔧'}
                {currentRole === 'warehouse' && '📦'}
                {currentRole === 'client' && '🚗'}
              </div>
              <div>
                <h5 className="font-bold flex items-center gap-1">
                  <span>Vista de Rol: </span>
                  <strong className="underline decoration-2">
                    {currentRole === 'admin' && 'Administrador General / Dueño del Taller'}
                    {currentRole === 'advisor' && 'Asesor de Servicio / Recepcionista'}
                    {currentRole === 'mechanic' && 'Mecánico / Técnico Operativo'}
                    {currentRole === 'warehouse' && 'Administrador de Almacén e Inventarios'}
                    {currentRole === 'client' && 'Portal / Monitor del Cliente'}
                  </strong>
                </h5>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {currentRole === 'admin' && 'Estás viendo el control global. Aquí supervisas facturación, utilidades, gráficos de horas mecánicas, administras empleados con esquemas de comisiones y editas plantillas de cotizaciones.'}
                  {currentRole === 'advisor' && 'Estás simulando la recepción del auto. Puedes registrar clientes/autos, realizar el checklist visual de entrada, cotizar mano de obra y refacciones, registrar abonos y agendar citas en bahías.'}
                  {currentRole === 'mechanic' && 'Estás simulando la tablet de taller de un técnico mecánico. Desde aquí fichas entrada/pausas de tiempo en órdenes, escribes reportes de diagnóstico técnico con fotos y requieres refacciones al almacén.'}
                  {currentRole === 'warehouse' && 'Estás controlando el almacén. Aquí despachas las refacciones requeridas por mecánicos en tiempo real, registras proveedores, emites órdenes de compra y controlas stocks mínimos.'}
                  {currentRole === 'client' && 'Estás simulando la perspectiva del cliente. Puedes dar seguimiento en tiempo real (tracking) de las fases de tu auto, autorizar/declinar presupuestos digitales y consultar alertas de verificación CDMX.'}
                </p>
              </div>
            </div>

            {/* CONTROLLER SWITCH ANIMATED FRAME */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRole}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="focus:outline-none"
              >
                {currentRole === 'admin' && (
                  <AdminDashboard
                    clients={clients}
                    vehicles={vehicles}
                    employees={employees}
                    inventory={inventory}
                    suppliers={suppliers}
                    orders={orders}
                    transactions={transactions}
                    purchaseOrders={purchaseOrders}
                    settings={settings}
                    setSettings={setSettings}
                    addEmployee={addEmployee}
                    updateEmployee={updateEmployee}
                    addTransaction={addTransaction}
                    handleClientCreditPayment={handleClientCreditPayment}
                    resetDatabase={resetDatabase}
                    activeTab={adminTab}
                    setActiveTab={setAdminTab}
                    isSyncing={isSyncing}
                    supabaseConnected={supabaseConnected}
                    syncError={syncError}
                    uploadToSupabase={uploadToSupabase}
                  />
                )}

                {currentRole === 'advisor' && (
                  <AdvisorDashboard
                    clients={clients}
                    vehicles={vehicles}
                    employees={employees}
                    inventory={inventory}
                    orders={orders}
                    presupuestos={presupuestos}
                    ordenesReparacion={ordenesReparacion}
                    notasSalida={notasSalida}
                    addClient={addClient}
                    updateClient={updateClient}
                    addVehicle={addVehicle}
                    updateVehicle={updateVehicle}
                    createServiceOrder={createServiceOrder}
                    addOrderItem={addOrderItem}
                    deleteOrderItem={deleteOrderItem}
                    approveBudgetLine={approveBudgetLine}
                    registerOrderPayment={registerOrderPayment}
                    updateOrderStatus={updateOrderStatus}
                    addPresupuesto={addPresupuesto}
                    updatePresupuesto={updatePresupuesto}
                    deletePresupuesto={deletePresupuesto}
                    addOrdenReparacion={addOrdenReparacion}
                    updateOrdenReparacion={updateOrdenReparacion}
                    deleteOrdenReparacion={deleteOrdenReparacion}
                    addNotaSalida={addNotaSalida}
                    updateNotaSalida={updateNotaSalida}
                    deleteNotaSalida={deleteNotaSalida}
                    convertPresupuestoToOrder={convertPresupuestoToOrder}
                    activeTab={advisorTab}
                    setActiveTab={setAdvisorTab}
                  />
                )}

                {currentRole === 'mechanic' && (
                  <MechanicDashboard
                    employees={employees}
                    inventory={inventory}
                    orders={orders}
                    clients={clients}
                    vehicles={vehicles}
                    clockInOrder={clockInOrder}
                    pauseOrder={pauseOrder}
                    clockOutOrder={clockOutOrder}
                    updateOrderDiagnostics={updateOrderDiagnostics}
                    submitPartRequisition={submitPartRequisition}
                    updateOrderStatus={updateOrderStatus}
                    activeTab={mechanicTab}
                    setActiveTab={setMechanicTab}
                  />
                )}

                {currentRole === 'warehouse' && (
                  <WarehouseDashboard
                    inventory={inventory}
                    suppliers={suppliers}
                    purchaseOrders={purchaseOrders}
                    requisitions={requisitions}
                    employees={employees}
                    orders={orders}
                    addInventoryItem={addInventoryItem}
                    updateInventoryItem={updateInventoryItem}
                    addPurchaseOrder={addPurchaseOrder}
                    receivePurchaseOrder={receivePurchaseOrder}
                    handleRequisitionStatus={handleRequisitionStatus}
                    addSupplier={addSupplier}
                    activeTab={warehouseTab}
                    setActiveTab={setWarehouseTab}
                  />
                )}

                {currentRole === 'client' && (
                  <CustomerPortal
                    clients={clients}
                    vehicles={vehicles}
                    orders={orders}
                    approveBudgetLine={approveBudgetLine}
                    activeTab={clientTab}
                    setActiveTab={setClientTab}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}

      </main>

      {/* COMPLIANT FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 px-6 text-xs text-center text-slate-400 space-y-2">
        <p className="max-w-2xl mx-auto">
          <strong>Servicio Automotriz Especializado (SAE) Dashboard</strong> • Desarrollado con los más altos estándares de fidelidad y usabilidad interactiva. Sincronización local persistente en tiempo real.
        </p>
        <p className="text-[11px] font-semibold text-slate-500">
          Programa desarrollado por <span className="text-amber-500">App Design</span> - D.G. Harold Anguiano
        </p>
        <p className="font-mono text-[10px]">
          Simulación de Operación Mecánica • Port 3000 • CDMX Verificación Vehicular Integrada • Licencia Comercial SAE
        </p>
      </footer>

      {/* MANUAL PWA INSTALLATION GUIDE MODAL */}
      <AnimatePresence>
        {showInstallGuide && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#010101] border-2 border-[#8D6A28]/50 max-w-md w-full rounded-2xl p-6 shadow-2xl shadow-[#8D6A28]/10 text-white relative"
            >
              <button 
                onClick={() => setShowInstallGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/10"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <img 
                  src="https://appdesignproyectos.com/saeicono.png" 
                  alt="SAE Icono" 
                  className="w-16 h-16 rounded-2xl shadow-lg border border-[#8D6A28]/30 object-contain"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-xl font-bold font-display tracking-tight text-white">Instalar App SAE</h3>
                  <p className="text-xs text-slate-400 mt-1">Lleva el Servicio Automotriz Especializado directamente en tu pantalla de inicio móvil o tablet.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-sm font-semibold text-[#F8B232] flex items-center gap-1.5">
                    <Smartphone size={16} />
                    <span>En iPhone y iPad (Safari):</span>
                  </h4>
                  <ol className="list-decimal list-inside text-xs text-slate-300 mt-2 space-y-1 pl-1">
                    <li>Toca el botón <strong className="text-white">Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra de navegación.</li>
                    <li>Desplázate hacia abajo y selecciona <strong className="text-white">"Agregar a Inicio"</strong>.</li>
                    <li>Confirma el nombre <strong className="text-white">SAE</strong> para tener acceso inmediato.</li>
                  </ol>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-sm font-semibold text-[#F8B232] flex items-center gap-1.5">
                    <Smartphone size={16} />
                    <span>En Android (Chrome / Edge / Opera):</span>
                  </h4>
                  <ol className="list-decimal list-inside text-xs text-slate-300 mt-2 space-y-1 pl-1">
                    <li>Toca el menú de <strong className="text-white">3 puntos</strong> en la esquina superior derecha del navegador.</li>
                    <li>Selecciona <strong className="text-white">"Instalar aplicación"</strong> o <strong className="text-white">"Agregar a la pantalla principal"</strong>.</li>
                    <li>¡Listo! La app se ejecutará de forma independiente sin barras de navegador.</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={() => setShowInstallGuide(false)}
                className="w-full mt-6 py-2.5 bg-[#8D6A28] text-white rounded-xl font-bold border border-[#8D6A28]/40 hover:bg-[#aa8134] transition-all text-sm cursor-pointer shadow-md"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERSISTENT BOTTOM NAVIGATION BAR (for Mobile, Tablet & Fullscreen) */}
      {!showLanding && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#010101]/95 backdrop-blur-md border-t-2 border-[#8D6A28]/50 py-1.5 px-2 sm:px-4 shadow-2xl z-40 block">
          <div className="max-w-7xl mx-auto">
            <div className={`grid ${getRoleTabs().length === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-1 w-full text-center`}>
              
              {/* Module Buttons for current role */}
              {getRoleTabs().map((item) => {
                const IconComponent = item.icon;
                const isActive = getActiveTabValue() === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTabValue(item.id)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 px-1.5 rounded-xl transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#8D6A28] text-white border border-white/10 shadow-lg shadow-[#8D6A28]/10' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 text-amber-500" />
                    <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                  </button>
                );
              })}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
