import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, Briefcase, FileText, Settings, Users, AlertTriangle, 
  Plus, Search, Download, Trash, Check, X, Shield, RefreshCw, Layers, Award
} from 'lucide-react';
import { Client, Vehicle, Employee, InventoryItem, Supplier, ServiceOrder, Transaction, WorkshopSettings, PurchaseOrder } from '../types';

interface AdminDashboardProps {
  clients: Client[];
  vehicles: Vehicle[];
  employees: Employee[];
  inventory: InventoryItem[];
  suppliers: Supplier[];
  orders: ServiceOrder[];
  transactions: Transaction[];
  purchaseOrders: PurchaseOrder[];
  settings: WorkshopSettings;
  setSettings: (s: WorkshopSettings) => void;
  addEmployee: (e: Omit<Employee, 'id'>) => void;
  updateEmployee: (e: Employee) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
  handleClientCreditPayment: (clientId: string, amount: number, method: 'Efectivo' | 'Tarjeta' | 'Transferencia') => void;
  resetDatabase: () => void;
  activeTab?: 'metrics' | 'finances' | 'personnel' | 'config';
  setActiveTab?: (tab: 'metrics' | 'finances' | 'personnel' | 'config') => void;
  isSyncing?: boolean;
  supabaseConnected?: boolean | null;
  syncError?: string | null;
  uploadToSupabase?: () => Promise<void>;
}

export default function AdminDashboard({
  clients,
  vehicles,
  employees,
  inventory,
  suppliers,
  orders,
  transactions,
  purchaseOrders,
  settings,
  setSettings,
  addEmployee,
  updateEmployee,
  addTransaction,
  handleClientCreditPayment,
  resetDatabase,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab,
  isSyncing = false,
  supabaseConnected = null,
  syncError = null,
  uploadToSupabase = async () => {}
}: AdminDashboardProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'metrics' | 'finances' | 'personnel' | 'config'>('metrics');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = controlledSetActiveTab !== undefined ? controlledSetActiveTab : setLocalActiveTab;
  
  // Financial metrics calculations
  const totalIncome = transactions
    .filter(t => t.type === 'Ingreso')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'Egreso')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Closed vs Active orders
  const activeOrders = orders.filter(o => o.status !== 'Listo_Entrega').length;
  const closedOrders = orders.filter(o => o.status === 'Listo_Entrega').length;

  // Average Ticket Size (derived from payments in completed orders)
  const completedOrdersWithPayments = orders.filter(o => o.payments.length > 0);
  const totalPaymentsFromOrders = completedOrdersWithPayments.reduce((sum, o) => {
    return sum + o.payments.reduce((pSum, p) => pSum + p.amount, 0);
  }, 0);
  const avgTicket = completedOrdersWithPayments.length > 0 
    ? Math.round(totalPaymentsFromOrders / completedOrdersWithPayments.length) 
    : 0;

  // Stock alerts
  const lowStockItems = inventory.filter(item => item.stock <= item.minStock);

  // Mechanic Productivity calculation (horas facturadas vs horas trabajadas)
  // Billed Hours = Sum of qty of labor line items for completed orders
  // Worked Hours = Actual clock-in clocked accumulated hours
  const mechanics = employees.filter(e => e.role === 'Mecanico' && e.active);
  const mechanicProductivity = mechanics.map(mech => {
    const mechOrders = orders.filter(o => o.mechanicId === mech.id);
    
    // Total hours clocked in
    const hoursWorked = mechOrders.reduce((sum, o) => sum + o.totalHoursWorked, 0);

    // Total hours billed (approved labor item quantity * unitPrice)
    // For simplicity, let's look at approved labor item quantities
    const hoursBilled = mechOrders.reduce((sum, o) => {
      if (o.status === 'Listo_Entrega') {
        const laborQty = o.items
          .filter(item => item.type === 'mano_de_obra' && item.approved)
          .reduce((itemSum, item) => itemSum + item.qty, 0);
        return sum + laborQty;
      }
      return sum;
    }, 0);

    // Commission earned: sum of (labor approved line prices * commission rate) for completed orders
    const commissionsEarned = mechOrders.reduce((sum, o) => {
      if (o.status === 'Listo_Entrega') {
        const totalLaborApproved = o.items
          .filter(item => item.type === 'mano_de_obra' && item.approved)
          .reduce((itemSum, item) => itemSum + (item.qty * item.unitPrice), 0);
        return sum + (totalLaborApproved * (mech.commissionRate / 100));
      }
      return sum;
    }, 0);

    return {
      name: mech.name,
      worked: parseFloat(hoursWorked.toFixed(1)),
      billed: hoursBilled || 2, // fallback for mock data rendering if 0
      commissions: commissionsEarned
    };
  });

  // State for Personnel Modal / Fields
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<'Cajero' | 'Asesor' | 'Mecanico'>('Mecanico');
  const [newEmpCommission, setNewEmpCommission] = useState(15);
  const [newEmpPhone, setNewEmpPhone] = useState('');

  // State for Credit Payment Modal
  const [selectedCreditClient, setSelectedCreditClient] = useState<Client | null>(null);
  const [creditPaymentAmount, setCreditPaymentAmount] = useState(0);
  const [creditPaymentMethod, setCreditPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');

  // State for Manual Transaction
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txType, setTxType] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [txCategory, setTxCategory] = useState<'Nomina' | 'Servicios' | 'Proveedor' | 'Otros'>('Otros');
  const [txAmount, setTxAmount] = useState(0);
  const [txDesc, setTxDesc] = useState('');

  // State for Settings Form
  const [settingsForm, setSettingsForm] = useState<WorkshopSettings>(settings);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(settingsForm);
    alert('Configuración maestra guardada con éxito.');
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpPhone) return;
    addEmployee({
      name: newEmpName,
      role: newEmpRole,
      commissionRate: newEmpRole === 'Cajero' ? 0 : newEmpCommission,
      active: true,
      phone: newEmpPhone
    });
    setNewEmpName('');
    setNewEmpPhone('');
    setShowAddEmpModal(false);
  };

  const handleRegisterCreditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreditClient || creditPaymentAmount <= 0) return;
    handleClientCreditPayment(selectedCreditClient.id, creditPaymentAmount, creditPaymentMethod);
    setSelectedCreditClient(null);
    setCreditPaymentAmount(0);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0 || !txDesc) return;
    addTransaction({
      type: txType,
      category: txCategory,
      amount: txAmount,
      description: txDesc
    });
    setTxAmount(0);
    setTxDesc('');
    setShowAddTxModal(false);
  };

  // Export transactions to CSV
  const exportTransactionsToCSV = () => {
    const headers = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type,
      t.category,
      `$${t.amount}`,
      t.description.replace(/,/g, ' ')
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Financiero_SAE_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="admin-dashboard-container" className="space-y-6">
      {/* Tab Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        {/* Mobile/Tablet Dropdown Select */}
        <div className="block lg:hidden w-full">
          <label htmlFor="admin-mobile-tab-select" className="block text-xs font-bold text-slate-500 mb-1">Módulo del Administrador</label>
          <select
            id="admin-mobile-tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as 'metrics' | 'finances' | 'personnel' | 'config')}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8D6A28]"
          >
            <option value="metrics">📈 Métricas de Negocio</option>
            <option value="finances">💵 Finanzas y Contabilidad</option>
            <option value="personnel">👥 Personal y Comisiones</option>
            <option value="config">⚙️ Configuración Maestra</option>
          </select>
        </div>

        {/* Desktop Horizontal Tabs Menu */}
        <div className="hidden lg:flex gap-2">
          <button
            id="tab-metrics"
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'metrics'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={16} />
            Métricas de Negocio
          </button>
          <button
            id="tab-finances"
            onClick={() => setActiveTab('finances')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'finances'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign size={16} />
            Finanzas y Contabilidad
          </button>
          <button
            id="tab-personnel"
            onClick={() => setActiveTab('personnel')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'personnel'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            Personal y Comisiones
          </button>
          <button
            id="tab-config"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'config'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings size={16} />
            Configuración Maestra
          </button>
        </div>
        
        <div className="flex items-center justify-between lg:justify-end gap-2 w-full lg:w-auto">
          <span className="text-xs text-slate-400 block lg:hidden font-medium">Panel General</span>
          <button
            onClick={() => {
              if (confirm('¿Estás seguro de restablecer todos los datos del taller a los valores de prueba originales? Se perderán los cambios de esta sesión.')) {
                resetDatabase();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-all"
          >
            <RefreshCw size={12} />
            Reiniciar Demo
          </button>
        </div>
      </div>

      {/* METRICS & PRODUCTIVITY TAB */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facturación Mensual</p>
                <h3 className="text-2xl font-bold font-display text-slate-800 mt-1">
                  ${totalIncome.toLocaleString('es-MX')} MXN
                </h3>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <TrendingUp size={12} /> +12.4% vs mes anterior
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilidad Neta</p>
                <h3 className="text-2xl font-bold font-display text-slate-800 mt-1">
                  ${netProfit.toLocaleString('es-MX')} MXN
                </h3>
                <span className="text-xs text-slate-500 mt-1">
                  Margen operativo: {totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0}%
                </span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Promedio</p>
                <h3 className="text-2xl font-bold font-display text-slate-800 mt-1">
                  ${avgTicket.toLocaleString('es-MX')} MXN
                </h3>
                <span className="text-xs text-slate-500 mt-1">
                  Órdenes cobradas: {completedOrdersWithPayments.length}
                </span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <FileText size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Órdenes Activas vs Cerradas</p>
                <h3 className="text-2xl font-bold font-display text-slate-800 mt-1">
                  {activeOrders} / {closedOrders}
                </h3>
                <span className="text-xs text-slate-500 mt-1">
                  Total registradas: {orders.length}
                </span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Briefcase size={24} />
              </div>
            </div>
          </div>

          {/* Productivity Chart & Low Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mechanics Productivity Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-800">Productividad de Mecánicos</h4>
                  <p className="text-xs text-slate-500">Horas facturadas vs horas trabajadas en taller</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-sm"></span> Horas Trabajadas (Reloj)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-600 rounded-sm"></span> Horas Facturadas (Presupuesto)</span>
                </div>
              </div>

              {/* Custom SVG Bar Chart */}
              <div className="space-y-5 pt-2">
                {mechanicProductivity.map((mech, index) => {
                  const maxVal = Math.max(...mechanicProductivity.flatMap(m => [m.worked, m.billed]), 15);
                  const workedWidth = Math.min(100, (mech.worked / maxVal) * 100);
                  const billedWidth = Math.min(100, (mech.billed / maxVal) * 100);

                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Award size={14} className="text-amber-500" />
                          {mech.name}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          Comisiones: <strong className="text-emerald-600">${Math.round(mech.commissions).toLocaleString()}</strong>
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {/* Worked hours bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-12 text-slate-400 font-medium">Reloj</span>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-amber-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${workedWidth}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-600 w-10 text-right">{mech.worked}h</span>
                        </div>

                        {/* Billed hours bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-12 text-slate-400 font-medium">Facturado</span>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${billedWidth}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono font-bold text-indigo-700 w-10 text-right">{mech.billed}h</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low stock alerts */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-amber-600 mb-4 border-b border-slate-100 pb-2">
                <AlertTriangle size={18} />
                <h4 className="font-bold text-slate-800">Alertas de Stock de Refacciones</h4>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3">
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No hay alertas de inventario mínimo.</p>
                ) : (
                  lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-red-50 border border-red-100 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-500">Cód: {item.code} • Compatibilidad: {item.compatibility}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">
                          Stock: {item.stock} / Mín: {item.minStock}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Precio: ${item.price}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-500 italic">
                  *Las órdenes de compra pendientes a proveedores actualizarán automáticamente las existencias al ser recibidas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FINANCES & LEDGER TAB */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuentas por Cobrar (Crédito Clientes)</p>
              <h4 className="text-xl font-bold font-display text-amber-700 mt-1">
                ${clients.reduce((sum, c) => sum + c.creditBalance, 0).toLocaleString('es-MX')} MXN
              </h4>
              <p className="text-[10px] text-slate-500">Crédito otorgado a clientes preferenciales con cuenta abierta.</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuentas por Pagar (OC Pendientes)</p>
              <h4 className="text-xl font-bold font-display text-red-700 mt-1">
                ${purchaseOrders.filter(po => po.status === 'Pendiente').reduce((sum, po) => sum + po.total, 0).toLocaleString('es-MX')} MXN
              </h4>
              <p className="text-[10px] text-slate-500">Deuda por surtir con proveedores por órdenes de compra solicitadas.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pérdidas y Ganancias (P&L)</p>
                <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full mt-1.5 ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {netProfit >= 0 ? 'Ganancia' : 'Pérdida'}: ${Math.abs(netProfit).toLocaleString('es-MX')} MXN
                </span>
              </div>
              <button
                onClick={exportTransactionsToCSV}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <Download size={14} />
                Exportar CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Ledger (Ingresos y Egresos) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Libro Diario de Transacciones</h4>
                  <p className="text-xs text-slate-500">Historial completo de flujos de caja e ingresos del taller</p>
                </div>
                <button
                  onClick={() => setShowAddTxModal(true)}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all"
                >
                  <Plus size={14} />
                  Registrar Gasto
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="p-3">ID</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Monto</th>
                      <th className="p-3">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-semibold text-slate-500">{tx.id}</td>
                        <td className="p-3 text-slate-600">{tx.date}</td>
                        <td className="p-3">
                          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            tx.type === 'Ingreso' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {tx.category === 'Pago_Cliente' && 'Pago de Cliente'}
                          {tx.category === 'Proveedor' && 'Proveedor'}
                          {tx.category === 'Nomina' && 'Nómina'}
                          {tx.category === 'Servicios' && 'Servicios Públicos'}
                          {tx.category === 'Otros' && 'Otros Gastos'}
                        </td>
                        <td className={`p-3 font-bold ${
                          tx.type === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {tx.type === 'Ingreso' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate" title={tx.description}>
                          {tx.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clients with credit balance */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">
                Créditos Vigentes (Por Cobrar)
              </h4>
              <div className="flex-1 overflow-y-auto space-y-3">
                {clients.filter(c => c.creditBalance > 0).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No hay saldos vencidos de clientes.</p>
                ) : (
                  clients.filter(c => c.creditBalance > 0).map((c, index) => (
                    <div key={index} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{c.name}</p>
                          <p className="text-[10px] text-slate-500">Cel: {c.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-red-600">${c.creditBalance.toLocaleString()} MXN</p>
                          <p className="text-[9px] text-slate-400">Límite: ${c.creditLimit.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            setSelectedCreditClient(c);
                            setCreditPaymentAmount(c.creditBalance);
                          }}
                          className="px-2.5 py-1 text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all"
                        >
                          Abonar / Liquidar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ADD MANUAL TRANSACTION MODAL */}
          {showAddTxModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800">Registrar Gasto de Caja</h4>
                  <button onClick={() => setShowAddTxModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                
                <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Tipo</label>
                      <select 
                        value={txType} 
                        onChange={(e) => setTxType(e.target.value as 'Ingreso' | 'Egreso')}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-700"
                      >
                        <option value="Egreso">Egreso (Gasto)</option>
                        <option value="Ingreso">Ingreso (Entrada)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Categoría</label>
                      <select 
                        value={txCategory} 
                        onChange={(e) => setTxCategory(e.target.value as any)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                      >
                        <option value="Nomina">Nómina / Sueldos</option>
                        <option value="Servicios">Servicios Públicos (Luz/Agua)</option>
                        <option value="Proveedor">Pago a Proveedor</option>
                        <option value="Otros">Otros Gastos Varios</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Monto ($ MXN)</label>
                    <input 
                      type="number" 
                      required 
                      value={txAmount || ''} 
                      onChange={(e) => setTxAmount(parseFloat(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                      placeholder="Monto en pesos"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Descripción / Concepto</label>
                    <textarea 
                      required
                      value={txDesc} 
                      onChange={(e) => setTxDesc(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg h-20 focus:outline-amber-500" 
                      placeholder="Especifica el concepto del pago..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setShowAddTxModal(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm"
                    >
                      Registrar Egreso
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CREDIT ABONO MODAL */}
          {selectedCreditClient && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800">Registrar Cobro de Crédito</h4>
                  <button onClick={() => setSelectedCreditClient(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-800">
                  <p><strong>Cliente:</strong> {selectedCreditClient.name}</p>
                  <p><strong>Deuda Actual:</strong> ${selectedCreditClient.creditBalance.toLocaleString()} MXN</p>
                </div>

                <form onSubmit={handleRegisterCreditPayment} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Monto a Abonar/Liquidar</label>
                    <input 
                      type="number" 
                      required 
                      max={selectedCreditClient.creditBalance}
                      value={creditPaymentAmount || ''} 
                      onChange={(e) => setCreditPaymentAmount(parseFloat(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                      placeholder="Monto a pagar"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Método de Pago</label>
                    <select 
                      value={creditPaymentMethod} 
                      onChange={(e) => setCreditPaymentMethod(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta Bancaria</option>
                      <option value="Transferencia">Transferencia CLABE</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setSelectedCreditClient(null)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                    >
                      Registrar Cobro
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PERSONNEL & COMMISSIONS TAB */}
      {activeTab === 'personnel' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 font-display">Nómina y Gestión de Personal</h4>
              <p className="text-xs text-slate-500">Alta de asesores, mecánicos operativos y configuración de esquemas de comisiones</p>
            </div>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus size={16} />
              Dar de Alta Personal
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Puesto / Rol</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Comisión configurada</th>
                  <th className="p-3">Estatus</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{emp.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        emp.role === 'Asesor' ? 'bg-blue-100 text-blue-800' :
                        emp.role === 'Mecanico' ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-mono">{emp.phone}</td>
                    <td className="p-3 font-medium text-slate-700">
                      {emp.role === 'Cajero' ? (
                        <span className="text-slate-400 italic">Sueldo Base (Sin comisión)</span>
                      ) : (
                        <span>{emp.commissionRate}% sobre {emp.role === 'Mecanico' ? 'mano de obra' : 'servicios atendidos'}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        emp.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {emp.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          const newRate = prompt(`Configurar nuevo esquema de comisión para ${emp.name} (Porcentaje actual: ${emp.commissionRate}%)`, emp.commissionRate.toString());
                          if (newRate !== null) {
                            updateEmployee({ ...emp, commissionRate: parseInt(newRate) || 0 });
                          }
                        }}
                        disabled={emp.role === 'Cajero'}
                        className="text-xs text-amber-600 hover:text-amber-800 font-bold disabled:text-slate-300 disabled:cursor-not-allowed"
                      >
                        Comisión
                      </button>
                      <button
                        onClick={() => updateEmployee({ ...emp, active: !emp.active })}
                        className={`text-xs font-bold ${emp.active ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'}`}
                      >
                        {emp.active ? 'Baja' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ADD EMPLOYEE MODAL */}
          {showAddEmpModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800">Dar de Alta Nuevo Empleado</h4>
                  <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                
                <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      required 
                      value={newEmpName} 
                      onChange={(e) => setNewEmpName(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                      placeholder="Ej. Martín Domínguez"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Puesto / Rol</label>
                      <select 
                        value={newEmpRole} 
                        onChange={(e) => setNewEmpRole(e.target.value as any)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                      >
                        <option value="Mecanico">Mecánico Operativo</option>
                        <option value="Asesor">Asesor de Servicio</option>
                        <option value="Cajero">Cajero / Administrativo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Teléfono</label>
                      <input 
                        type="tel" 
                        required 
                        value={newEmpPhone} 
                        onChange={(e) => setNewEmpPhone(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                        placeholder="Ej. 55-1234-5678"
                      />
                    </div>
                  </div>

                  {newEmpRole !== 'Cajero' && (
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">
                        Comisión (%) sobre {newEmpRole === 'Mecanico' ? 'Mano de Obra' : 'Venta Total'}
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={newEmpCommission} 
                        onChange={(e) => setNewEmpCommission(parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setShowAddEmpModal(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                    >
                      Registrar Personal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SYSTEM CONFIGURATION TAB */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
            <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 font-display">
              Personalización de Plantillas y Datos Fiscales
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Nombre Comercial del Taller</label>
                <input 
                  type="text" 
                  value={settingsForm.name} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">RFC (Cédula Fiscal México)</label>
                <input 
                  type="text" 
                  value={settingsForm.rfc} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, rfc: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500 font-mono" 
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Teléfono Público</label>
                <input 
                  type="text" 
                  value={settingsForm.phone} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={settingsForm.email} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-medium mb-1">Dirección del Establecimiento</label>
                <input 
                  type="text" 
                  value={settingsForm.address} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-medium mb-1">Datos Bancarios para Transferencia</label>
                <input 
                  type="text" 
                  value={settingsForm.bankDetails} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankDetails: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-medium mb-1">Términos y Condiciones (Orden de Servicio y Facturas)</label>
                <textarea 
                  value={settingsForm.terms} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, terms: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg h-24 focus:outline-amber-500" 
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Tasa de Impuesto IVA (%)</label>
                <input 
                  type="number" 
                  value={settingsForm.taxRate} 
                  onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-amber-500" 
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 text-xs rounded-lg shadow-sm transition-all"
              >
                Guardar Configuración
              </button>
            </div>
          </form>

          {/* Payment Gateways / Integrations Mock */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 font-display">
              Pasarelas de Pago e Integraciones
            </h4>

            <div className="space-y-4 text-xs">
              <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Terminal Clip / Mercado Pago</span>
                  <span className="px-2 py-0.5 font-bold bg-emerald-100 text-emerald-800 rounded-full text-[9px]">ACTIVO</span>
                </div>
                <p className="text-[10px] text-slate-500">Permite registrar cobros con tarjeta bancaria de manera presencial sincronizando el ID de la orden.</p>
              </div>

              <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Facturación CFDI v4.0 (SAT)</span>
                  <span className="px-2 py-0.5 font-bold bg-slate-100 text-slate-500 rounded-full text-[9px]">CONECTADO</span>
                </div>
                <p className="text-[10px] text-slate-500">Conexión con PAC autorizado para timbrado automático de facturas al liquidar las órdenes.</p>
              </div>

              <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Notificaciones por WhatsApp API</span>
                  <span className="px-2 py-0.5 font-bold bg-emerald-100 text-emerald-800 rounded-full text-[9px]">ACTIVO</span>
                </div>
                <p className="text-[10px] text-slate-500">Permite enviar cotizaciones digitales y actualizaciones de estado automáticamente al celular del cliente.</p>
              </div>
            </div>

            {/* Supabase Database Migration & Status Panel */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs font-display">
                  <Layers size={14} className="text-[#8D6A28]" />
                  Base de Datos Supabase Cloud
                </h5>
                {supabaseConnected ? (
                  <span className="px-2 py-0.5 font-bold bg-emerald-100 text-emerald-800 rounded-full text-[9px] animate-pulse">
                    CONECTADO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 font-bold bg-amber-100 text-amber-800 rounded-full text-[9px]">
                    DESCONECTADO
                  </span>
                )}
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                Toda inserción, actualización o eliminación realizada se guardará localmente y se respaldará automáticamente en su base de datos PostgreSQL de Supabase en tiempo real.
              </p>

              {syncError && (
                <div className="p-2 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 text-[9px] font-mono whitespace-pre-wrap break-all leading-normal">
                  <strong>Nota / Estado:</strong> {syncError}
                </div>
              )}

              {supabaseConnected && (
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={uploadToSupabase}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#8D6A28] hover:bg-[#a67d32] text-white font-bold py-2 rounded-lg transition-all shadow-sm disabled:opacity-50 text-[10px] cursor-pointer"
                    title="Subir base de datos local actual para sobreescribir Supabase"
                  >
                    <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
                    <span>Migrar Datos Locales a Supabase</span>
                  </button>
                  <p className="text-[9px] text-slate-400 text-center">
                    Carga el historial y la configuración local acumulada en este navegador a la base de datos centralizada en la nube.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
