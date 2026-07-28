import React, { useState } from 'react';
import { 
  Car, Clock, ShieldAlert, FileCheck, CheckCircle2, AlertTriangle, 
  Wallet, ListFilter, CreditCard, Check, X, BellRing, Sparkles, ChevronRight
} from 'lucide-react';
import { Client, Vehicle, ServiceOrder, BudgetLineItem, OrderStatus } from '../types';

interface CustomerPortalProps {
  clients: Client[];
  vehicles: Vehicle[];
  orders: ServiceOrder[];
  approveBudgetLine: (orderId: string, itemId: string, approved: boolean) => void;
  activeTab?: 'tracking' | 'budget' | 'alerts';
  setActiveTab?: (tab: 'tracking' | 'budget' | 'alerts') => void;
}

export default function CustomerPortal({
  clients,
  vehicles,
  orders,
  approveBudgetLine,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab
}: CustomerPortalProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'tracking' | 'budget' | 'alerts'>('tracking');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = controlledSetActiveTab !== undefined ? controlledSetActiveTab : setLocalActiveTab;

  // Let the user pick which customer perspective to view
  const [selectedClientId, setSelectedClientId] = useState('cli-1'); // Default: Alejandro González (VW Jetta)
  const activeClient = clients.find(c => c.id === selectedClientId);

  // Filter vehicles owned by this customer
  const clientVehicles = vehicles.filter(v => v.ownerId === selectedClientId);
  const [selectedVehicleId, setSelectedVehicleId] = useState(clientVehicles[0]?.id || '');
  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId);

  // Filter orders for the selected vehicle
  const vehicleOrders = orders.filter(o => o.vehicleId === selectedVehicleId);
  // Pick active service order if any, otherwise default to latest order
  const activeServiceOrder = vehicleOrders.find(o => o.status !== 'Listo_Entrega') || vehicleOrders[0];

  const getOrderStatusStep = (status: OrderStatus) => {
    switch(status) {
      case 'Diagnostico': return 1;
      case 'Esperando_Refacciones': return 2;
      case 'En_Reparacion': return 3;
      case 'Control_Calidad': return 4;
      case 'Listo_Entrega': return 5;
      default: return 1;
    }
  };

  const getOrderStatusMessage = (status: OrderStatus) => {
    switch(status) {
      case 'Diagnostico': 
        return 'Nuestro técnico certificado está escaneando e inspeccionando los sistemas de tu auto para emitir un diagnóstico preciso.';
      case 'Esperando_Refacciones': 
        return 'Ya diagnosticamos tu auto y solicitamos las refacciones originales necesarias al almacén o estamos en espera de tu aprobación digital.';
      case 'En_Reparacion': 
        return '¡Manos a la obra! Tu mecánico asignado está realizando la reparación correspondiente en la bahía de trabajo.';
      case 'Control_Calidad': 
        return 'Tu auto se encuentra en fase de pruebas de carretera y escaneo final de seguridad para certificar la excelencia del servicio.';
      case 'Listo_Entrega': 
        return '¡Buenas noticias! Tu automóvil está 100% listo, lavado y aspirado en zona de resguardo para que pases a retirarlo.';
      default: 
        return '';
    }
  };

  // Verification helper based on CDMX/Edomex regulations
  const getVerificationAlert = (veh: Vehicle) => {
    let engomadoText = '';
    let period = '';
    let textColor = '';
    let bgColor = '';

    switch(veh.engomadoColor) {
      case 'yellow':
        engomadoText = 'Amarillo (Terminación de placa 5 o 6)';
        period = 'Primer Semestre: Enero-Febrero • Segundo Semestre: Julio-Agosto';
        textColor = 'text-amber-800';
        bgColor = 'bg-amber-50';
        break;
      case 'pink':
        engomadoText = 'Rosa (Terminación de placa 7 o 8)';
        period = 'Primer Semestre: Febrero-Marzo • Segundo Semestre: Agosto-Septiembre';
        textColor = 'text-pink-800';
        bgColor = 'bg-pink-50';
        break;
      case 'red':
        engomadoText = 'Rojo (Terminación de placa 3 o 4)';
        period = 'Primer Semestre: Marzo-Abril • Segundo Semestre: Septiembre-Octubre';
        textColor = 'text-red-800';
        bgColor = 'bg-red-50';
        break;
      case 'green':
        engomadoText = 'Verde (Terminación de placa 1 o 2)';
        period = 'Primer Semestre: Abril-Mayo • Segundo Semestre: Octubre-Noviembre';
        textColor = 'text-emerald-800';
        bgColor = 'bg-emerald-50';
        break;
      case 'blue':
        engomadoText = 'Azul (Terminación de placa 9 o 0)';
        period = 'Primer Semestre: Mayo-Junio • Segundo Semestre: Noviembre-Diciembre';
        textColor = 'text-blue-800';
        bgColor = 'bg-blue-50';
        break;
    }

    return { engomadoText, period, textColor, bgColor };
  };

  // Totals calculations
  const getTotals = (order: ServiceOrder) => {
    const approvedSubtotal = order.items
      .filter(i => i.approved === true)
      .reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    
    const pendingSubtotal = order.items
      .filter(i => i.approved === null)
      .reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);

    const totalApproved = approvedSubtotal * 1.16;
    const totalPayments = order.payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      approvedSubtotal,
      pendingSubtotal,
      totalApproved,
      totalPayments,
      balance: totalApproved - totalPayments
    };
  };

  return (
    <div id="customer-portal-container" className="space-y-6">
      {/* Customer selector bar (for ease of previewing different mock users) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-3 bg-slate-50 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-600 text-white rounded-lg">
            <Car size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 font-display">Portal de Consulta para Clientes</h4>
            <p className="text-xs text-slate-500">Transparencia absoluta en el seguimiento de tu auto</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div>
            <span className="text-slate-500">Iniciar sesión como:</span>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                // Auto-select first car of selected customer
                const firstCar = vehicles.find(v => v.ownerId === e.target.value);
                setSelectedVehicleId(firstCar?.id || '');
              }}
              className="ml-2 p-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 font-bold"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {clientVehicles.length > 1 && (
            <div>
              <span className="text-slate-500">Mis Autos:</span>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="ml-2 p-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 font-bold"
              >
                {clientVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {activeVehicle ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TRACKING & STEPPER PANEL */}
          <div className="lg:col-span-2 space-y-6">
            {/* Realtime Repair Tracking */}
            {activeServiceOrder ? (
              <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 ${activeTab === 'tracking' ? 'block' : 'hidden lg:block'}`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="bg-amber-100 text-amber-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      Orden: {activeServiceOrder.id}
                    </span>
                    <h4 className="font-bold text-slate-800 font-display mt-1">Estatus del Vehículo</h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <Clock size={12} className="text-slate-400" /> Ingresó: {activeServiceOrder.dateOpened.split(' ')[0]}
                  </div>
                </div>

                {/* Vertical/Horizontal Stepper */}
                <div className="space-y-4 pt-1">
                  <div className="relative flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Background Progress Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 hidden md:block"></div>
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 hidden md:block transition-all duration-500"
                      style={{ width: `${(getOrderStatusStep(activeServiceOrder.status) - 1) * 25}%` }}
                    ></div>

                    {/* Stepper bubbles */}
                    {[
                      { step: 1, label: 'Diagnóstico', statusKey: 'Diagnostico' },
                      { step: 2, label: 'Cotización', statusKey: 'Esperando_Refacciones' },
                      { step: 3, label: 'Reparación', statusKey: 'En_Reparacion' },
                      { step: 4, label: 'Calidad', statusKey: 'Control_Calidad' },
                      { step: 5, label: 'Entregar', statusKey: 'Listo_Entrega' }
                    ].map((st) => {
                      const activeStep = getOrderStatusStep(activeServiceOrder.status);
                      const isCompleted = st.step < activeStep;
                      const isActive = st.step === activeStep;

                      return (
                        <div key={st.step} className="relative z-10 flex flex-col items-center gap-1 bg-white p-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                            isCompleted ? 'bg-emerald-500 text-white' :
                            isActive ? 'bg-amber-600 text-white ring-4 ring-amber-100 scale-110' :
                            'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {isCompleted ? <Check size={14} /> : st.step}
                          </div>
                          <span className={`text-[10px] font-bold ${isActive ? 'text-amber-700' : 'text-slate-500'}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic friendly stage description */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-3 text-xs text-slate-700 items-start mt-4">
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">
                        Etapa Actual: <span className="text-amber-700 font-display font-medium">{activeServiceOrder.status.replace('_', ' ').toUpperCase()}</span>
                      </p>
                      <p className="text-slate-500 mt-1 leading-relaxed">{getOrderStatusMessage(activeServiceOrder.status)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-xs text-slate-500">
                <Car size={32} className="text-slate-300 mx-auto mb-1" />
                No hay órdenes de servicio activas asociadas a este vehículo.
              </div>
            )}

            {/* BUDGET APPROVAL SYSTEM */}
            {activeServiceOrder && activeServiceOrder.items.some(i => i.approved === null) && (
              <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 ${activeTab === 'budget' ? 'block' : 'hidden lg:block'}`}>
                <div className="border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <ShieldAlert size={18} />
                    <h4 className="font-bold text-slate-800 font-display">Presupuestos sugeridos pendientes de tu aprobación</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Autoriza o declina partidas individuales para que el mecánico pueda comenzar a trabajar.</p>
                </div>

                <div className="space-y-3">
                  {activeServiceOrder.items
                    .filter(item => item.approved === null)
                    .map((item) => (
                      <div key={item.id} className="p-4 border border-amber-100 bg-amber-50/20 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                        <div>
                          <span className={`inline-block px-1.5 py-0.2 rounded font-bold text-[9px] uppercase mb-1.5 ${
                            item.type === 'refaccion' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type === 'refaccion' ? 'Refacción Sugerida' : 'Mano de Obra'}
                          </span>
                          <h5 className="font-bold text-slate-800">{item.description}</h5>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Precio unitario: ${item.unitPrice.toLocaleString()} MXN • Cantidad: {item.qty}</p>
                        </div>

                        <div className="flex sm:flex-col items-end gap-2 shrink-0">
                          <strong className="text-slate-800 font-mono text-sm">${(item.qty * item.unitPrice).toLocaleString()}</strong>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                approveBudgetLine(activeServiceOrder.id, item.id, true);
                                alert('¡Partida aprobada digitalmente! El asesor y el mecánico han sido notificados para surtir el repuesto.');
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={12} /> Aprobar
                            </button>
                            <button
                              onClick={() => {
                                approveBudgetLine(activeServiceOrder.id, item.id, false);
                                alert('Presupuesto declinado.');
                              }}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 font-bold rounded-lg border border-red-200"
                            >
                              Declinar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* PREVIOUS COMPLETED SERVICE HISTORY (CARNET DIGITAL) */}
            <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 ${activeTab === 'tracking' ? 'block' : 'hidden lg:block'}`}>
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 font-display">
                Carnet de Mantenimiento Digital (Historial)
              </h4>

              <div className="space-y-4">
                {vehicleOrders.filter(o => o.status === 'Listo_Entrega').length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No tienes servicios completados anteriormente registrados en este taller.</p>
                ) : (
                  vehicleOrders
                    .filter(o => o.status === 'Listo_Entrega')
                    .map((o) => (
                      <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">{o.id}</span>
                          <span className="text-slate-400">{o.dateClosed}</span>
                        </div>
                        <p className="text-slate-700"><strong>Servicios realizados:</strong></p>
                        <ul className="list-disc pl-4 text-slate-600 text-[11px] space-y-0.5">
                          {o.items.filter(i => i.approved).map((i, idx) => (
                            <li key={idx}>{i.description}</li>
                          ))}
                        </ul>
                        {o.diagnostics && (
                          <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-50">
                            <strong>Notas Técnicas:</strong> {o.diagnostics}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* LOCAL SMART ALERTS & REMINDERS SIDEBAR */}
          <div className="space-y-6">
            {/* Local CDMX/Edomex verification details */}
            <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 ${activeTab === 'alerts' ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center gap-1.5 text-indigo-600 border-b border-slate-100 pb-2">
                <BellRing size={18} className="animate-pulse" />
                <h4 className="font-bold text-slate-800 font-display">Alertas Inteligentes Locales</h4>
              </div>

              {/* Vehicle specs and verification periods */}
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border ${getVerificationAlert(activeVehicle).bgColor} ${getVerificationAlert(activeVehicle).textColor} text-xs space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Verificación CDMX / Edomex</span>
                    <span className="inline-block px-1.5 py-0.2 rounded font-bold bg-white text-[9px] uppercase shadow-sm">Oficial</span>
                  </div>
                  <p>Tu engomado es: <strong className="uppercase">{getVerificationAlert(activeVehicle).engomadoText}</strong></p>
                  <p className="leading-relaxed">Debes acudir a verificar tu auto en los periodos:</p>
                  <p className="font-bold bg-white/60 p-2 rounded border border-black/5 mt-1 font-mono text-[10px]">
                    {getVerificationAlert(activeVehicle).period}
                  </p>
                </div>

                {/* Service Mileage Projection */}
                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span>Próximo Servicio Preventivo</span>
                  </div>
                  <p>Kilometraje reportado al ingreso: <strong>{activeVehicle.mileage.toLocaleString()} KM</strong></p>
                  <p className="leading-relaxed">Nuestra proyección de kilometraje sugiere agendar afinación y cambio de aceite sintético a los:</p>
                  <p className="font-bold font-mono text-amber-700 bg-white p-2 rounded border border-slate-100 text-center">
                    {Math.round(activeVehicle.mileage / 10000 + 1) * 10000} KM
                  </p>
                </div>
              </div>
            </div>

            {/* INVOICES & PAYMENTS STATEMENT */}
            {activeServiceOrder && (
              <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 ${activeTab === 'budget' ? 'block' : 'hidden lg:block'}`}>
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 font-display flex items-center gap-1.5">
                  <Wallet size={16} className="text-indigo-600" />
                  Estado de Cuenta & Facturas
                </h4>

                <div className="text-xs space-y-3">
                  <div className="flex justify-between font-bold border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Subtotal Aprobado:</span>
                    <span className="font-mono">${getTotals(activeServiceOrder).approvedSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-b border-slate-50 pb-2">
                    <span className="text-slate-500">Impuesto IVA (16%):</span>
                    <span className="font-mono">${Math.round(getTotals(activeServiceOrder).approvedSubtotal * 0.16).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-b border-slate-100 pb-2 text-slate-800">
                    <span>Total Presupuesto:</span>
                    <span className="font-mono">${Math.round(getTotals(activeServiceOrder).totalApproved).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between font-bold bg-emerald-50 text-emerald-800 p-2 rounded-lg">
                    <span>Abonos / Pagado:</span>
                    <span className="font-mono">${getTotals(activeServiceOrder).totalPayments.toLocaleString()} MXN</span>
                  </div>

                  <div className="flex justify-between font-bold bg-red-50 text-red-800 p-2 rounded-lg">
                    <span>Saldo Pendiente:</span>
                    <span className="font-mono">${Math.round(getTotals(activeServiceOrder).balance).toLocaleString()} MXN</span>
                  </div>

                  {activeServiceOrder.payments.length > 0 && (
                    <div className="pt-2">
                      <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Historial de Transacciones</p>
                      <div className="space-y-1.5">
                        {activeServiceOrder.payments.map((p) => (
                          <div key={p.id} className="flex justify-between items-center text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100 font-mono">
                            <span className="text-slate-500">{p.date.split('T')[0]} ({p.method})</span>
                            <span className="font-bold text-emerald-600">+${p.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      alert(`[PAC Timbrado Mock] Iniciando solicitud de descarga de factura fiscal (CFDI v4.0) con RFC ${clients.find(c => c.id === selectedClientId)?.name}.\nSe ha enviado el archivo XML y PDF a tu correo.`);
                    }}
                    disabled={getTotals(activeServiceOrder).totalPayments === 0}
                    className="w-full flex items-center justify-center gap-1.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold py-2 rounded-lg transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <CreditCard size={14} />
                    Descargar Factura SAT (XML/PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center flex flex-col justify-center items-center">
          <Car size={48} className="text-slate-300 mb-2 animate-bounce" />
          <p className="text-sm font-semibold text-slate-500">Selecciona tu perfil de cliente en la parte superior para consultar tu auto.</p>
        </div>
      )}
    </div>
  );
}
