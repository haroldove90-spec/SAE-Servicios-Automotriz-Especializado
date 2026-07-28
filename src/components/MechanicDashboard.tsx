import React, { useState } from 'react';
import { 
  Play, Pause, Square, FileText, Camera, Package, ChevronRight, Check, X,
  Clock, AlertCircle, Wrench, RefreshCw, Smartphone, Layers, CheckSquare
} from 'lucide-react';
import { Client, Vehicle, Employee, InventoryItem, ServiceOrder, BudgetLineItem } from '../types';

interface MechanicDashboardProps {
  employees: Employee[];
  inventory: InventoryItem[];
  orders: ServiceOrder[];
  clients: Client[];
  vehicles: Vehicle[];
  clockInOrder: (orderId: string) => void;
  pauseOrder: (orderId: string, reason: string) => void;
  clockOutOrder: (orderId: string) => void;
  updateOrderDiagnostics: (orderId: string, diagnostics: string, photos: string[]) => void;
  submitPartRequisition: (orderId: string, itemId: string, qty: number, mechanicId: string) => void;
  updateOrderStatus: (orderId: string, status: any) => void;
  activeTab?: 'tasks' | 'diagnostics' | 'parts';
  setActiveTab?: (tab: 'tasks' | 'diagnostics' | 'parts') => void;
}

export default function MechanicDashboard({
  employees,
  inventory,
  orders,
  clients,
  vehicles,
  clockInOrder,
  pauseOrder,
  clockOutOrder,
  updateOrderDiagnostics,
  submitPartRequisition,
  updateOrderStatus,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab
}: MechanicDashboardProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'tasks' | 'diagnostics' | 'parts'>('tasks');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = controlledSetActiveTab !== undefined ? controlledSetActiveTab : setLocalActiveTab;

  // Select which mechanic profile we are simulating (simplifies testing)
  const mechanics = employees.filter(e => e.role === 'Mecanico' && e.active);
  const [selectedMechanicId, setSelectedMechanicId] = useState(mechanics[0]?.id || 'emp-2');
  const activeMechanic = employees.find(e => e.id === selectedMechanicId);

  // Filter orders assigned to this mechanic
  const mechanicOrders = orders.filter(o => o.mechanicId === selectedMechanicId);

  // Selected active order in mechanic workspace
  const [selectedOrderId, setSelectedOrderId] = useState(mechanicOrders[0]?.id || '');
  const activeOrder = orders.find(o => o.id === selectedOrderId);

  // Form states
  const [diagnosticNote, setDiagnosticNote] = useState(activeOrder?.diagnostics || '');
  const [mockPhotoUrl, setMockPhotoUrl] = useState('');
  
  // Requisition states
  const [reqPartId, setReqPartId] = useState('');
  const [reqPartQty, setReqPartQty] = useState(1);

  // Sync diagnostic input when switching orders
  React.useEffect(() => {
    if (activeOrder) {
      setDiagnosticNote(activeOrder.diagnostics || '');
    }
  }, [selectedOrderId, activeOrder]);

  const handleSaveDiagnostics = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    updateOrderDiagnostics(activeOrder.id, diagnosticNote, mockPhotoUrl ? [mockPhotoUrl] : []);
    setMockPhotoUrl('');
    alert('Diagnóstico guardado con éxito. Las fotos/notas se reflejarán inmediatamente en la cotización y portal de cliente.');
  };

  const handleSendRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !reqPartId) return;
    submitPartRequisition(activeOrder.id, reqPartId, reqPartQty, selectedMechanicId);
    setReqPartId('');
    setReqPartQty(1);
    alert('Requisición digital enviada a almacén con éxito. Recibirás un aviso cuando sea despachada.');
  };

  const getElapsedTime = (order: ServiceOrder) => {
    // Return formatted hours worked
    return `${order.totalHoursWorked.toFixed(1)} Hrs`;
  };

  return (
    <div id="mechanic-dashboard-container" className="space-y-6">
      {/* Mechanic Switcher and Tablet View Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3 bg-slate-50 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Smartphone className="text-amber-600 hidden sm:block" size={24} />
          <div>
            <h4 className="font-bold text-slate-800 font-display flex items-center gap-1.5 text-base">
              <Wrench size={18} className="text-amber-600 animate-spin-slow" />
              Terminal de Taller (Operativo)
            </h4>
            <p className="text-xs text-slate-500">Diseño compacto optimizado para tablets y celulares en bahías de trabajo</p>
          </div>
        </div>
        
        {/* Profile toggler */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Técnico Actual:</span>
          <select
            value={selectedMechanicId}
            onChange={(e) => {
              setSelectedMechanicId(e.target.value);
              setSelectedOrderId('');
            }}
            className="p-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
          >
            {mechanics.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ASSIGNED ORDERS SIDEBAR */}
        <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 ${activeTab === 'tasks' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h5 className="font-bold text-slate-800">Mi Fila de Tareas</h5>
            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
              {mechanicOrders.length} Órdenes
            </span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto">
            {mechanicOrders.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No tienes órdenes asignadas pendientes.</p>
            ) : (
              mechanicOrders.map((o) => {
                const vehicle = vehicles.find(v => v.id === o.vehicleId);
                const client = clients.find(c => c.id === o.clientId);
                return (
                  <button
                    key={o.id}
                    onClick={() => {
                      setSelectedOrderId(o.id);
                      setActiveTab('diagnostics');
                    }}
                    className={`w-full text-left p-3.5 border rounded-xl text-xs transition-all flex justify-between items-start ${
                      selectedOrderId === o.id 
                        ? 'border-amber-500 bg-amber-50/50 shadow-sm font-semibold' 
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">{o.id}</span>
                        {o.isClockedIn && (
                          <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" title="Trabajando en este auto"></span>
                        )}
                        {o.isPaused && (
                          <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full" title="Pausado"></span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 mt-1">{vehicle?.brand} {vehicle?.model}</p>
                      <p className="text-slate-400 font-mono text-[10px]">Placas: {vehicle?.plate}</p>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        o.status === 'Diagnostico' ? 'bg-amber-100 text-amber-800' :
                        o.status === 'Esperando_Refacciones' ? 'bg-red-100 text-red-800' :
                        o.status === 'En_Reparacion' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {o.status.replace('_', ' ')}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono flex items-center gap-0.5 justify-end">
                        <Clock size={10} /> {getElapsedTime(o)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* WORKSPACE AREA */}
        {activeOrder ? (
          <div className={`lg:col-span-2 space-y-6 ${activeTab !== 'tasks' ? 'block' : 'hidden lg:block'}`}>
            {/* 1. Time management clock card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cronómetro de Tarea</span>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={20} className={activeOrder.isClockedIn ? 'text-emerald-500 animate-pulse' : 'text-slate-400'} />
                  <span className="text-2xl font-bold font-mono text-slate-800">{getElapsedTime(activeOrder)}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Acumulado en tiempo real</p>
              </div>

              {/* Time logs triggers */}
              <div className="md:col-span-2 flex flex-wrap gap-2.5 justify-end">
                {!activeOrder.isClockedIn ? (
                  <button
                    onClick={() => {
                      clockInOrder(activeOrder.id);
                      updateOrderStatus(activeOrder.id, 'En_Reparacion');
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Play size={14} />
                    Fichar Entrada (Iniciar)
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const reason = prompt('Motivo de la pausa (Ej: Falta de refacción, Espera de autorización, Herramienta ocupada):', 'Falta de refacción');
                        if (reason) {
                          pauseOrder(activeOrder.id, reason);
                        }
                      }}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow-sm transition-all"
                    >
                      <Pause size={14} />
                      Pausar Trabajo
                    </button>

                    <button
                      onClick={() => {
                        clockOutOrder(activeOrder.id);
                        updateOrderStatus(activeOrder.id, 'Control_Calidad');
                        alert('¡Trabajo terminado! La orden ha sido enviada a Control de Calidad.');
                      }}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow-sm transition-all"
                    >
                      <Square size={14} />
                      Fichar Salida (Terminar)
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2. Diagnostics & multimedia submission */}
              <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 ${activeTab === 'diagnostics' ? 'block' : 'hidden md:block'}`}>
                <h5 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <FileText size={16} className="text-amber-600" />
                  Diagnóstico y Evidencia
                </h5>

                <form onSubmit={handleSaveDiagnostics} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">Notas del Diagnóstico Técnico</label>
                    <textarea
                      required
                      value={diagnosticNote}
                      onChange={(e) => setDiagnosticNote(e.target.value)}
                      placeholder="Escribe aquí los desperfectos encontrados, piezas a cambiar, horas estimadas de mano de obra..."
                      className="w-full p-2.5 border border-slate-200 rounded-lg h-28 focus:outline-amber-500"
                    />
                  </div>

                  {/* Simulate multimedia attachment */}
                  <div>
                    <label className="block text-slate-500 mb-1 flex items-center gap-1.5">
                      <Camera size={14} />
                      Evidencia Fotográfica (Simulado)
                    </label>
                    <select
                      value={mockPhotoUrl}
                      onChange={(e) => setMockPhotoUrl(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                    >
                      <option value="">-- Simular Foto de Evidencia --</option>
                      <option value="https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=60">Balatas desgastadas y metalizadas</option>
                      <option value="https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=400&auto=format&fit=crop&q=60">Fuga de líquido amortiguador trasero</option>
                      <option value="https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&auto=format&fit=crop&q=60">Filtro de aire saturado de polvo</option>
                    </select>
                  </div>

                  {activeOrder.diagnosticPhotos.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="font-semibold text-[10px] text-slate-400">Fotos cargadas previamente:</p>
                      <div className="flex gap-2">
                        {activeOrder.diagnosticPhotos.map((ph, idx) => (
                          <img key={idx} src={ph} className="w-12 h-12 object-cover rounded-lg border border-slate-200" alt="Evidencia" referrerPolicy="no-referrer" />
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs"
                  >
                    Guardar Diagnóstico
                  </button>
                </form>
              </div>

              {/* 3. Requisition of replacement parts */}
              <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 ${activeTab === 'parts' ? 'block' : 'hidden md:block'}`}>
                <div>
                  <h5 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 mb-3">
                    <Package size={16} className="text-amber-600" />
                    Solicitar Refacción (Almacén)
                  </h5>

                  <form onSubmit={handleSendRequisition} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Seleccionar Pieza Necesaria</label>
                      <select
                        required
                        value={reqPartId}
                        onChange={(e) => setReqPartId(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                      >
                        <option value="">-- Elegir Refacción del Catálogo --</option>
                        {inventory.map((item) => (
                          <option key={item.id} value={item.id} disabled={item.stock === 0}>
                            {item.name} {item.stock === 0 ? '(Agotada)' : `(Disp: ${item.stock})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Cantidad Requerida</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={reqPartQty}
                        onChange={(e) => setReqPartQty(parseInt(e.target.value) || 1)}
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!reqPartId}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs disabled:opacity-40"
                    >
                      Enviar Requisición Digital
                    </button>
                  </form>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-500 italic">
                  *Esta requisición se enviará a la terminal del Almacenista. Una vez despachada, se restará del stock y se agregará al costo total de la orden del auto de manera automática sin necesidad de que dejes tu bahía.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`lg:col-span-2 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col justify-center items-center ${activeTab !== 'tasks' ? 'block' : 'hidden lg:block'}`}>
            <Smartphone size={48} className="text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-500">Selecciona una orden de la lista para acceder a la terminal táctil de trabajo.</p>
            <button 
              onClick={() => setActiveTab('tasks')} 
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-xs cursor-pointer block lg:hidden"
            >
              Ver Mi Fila de Tareas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
