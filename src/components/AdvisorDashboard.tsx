import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, UserPlus, Car, CheckSquare, Calendar, History, Send, 
  Trash, Check, X, FileText, ChevronRight, AlertCircle, MapPin, Sparkles, UserCheck, User,
  Camera, Upload, Trash2, AlertTriangle, Download, Sparkle, Copy, Image, Share2, Mail,
  HelpCircle, Printer, RefreshCw, Edit2, Eye, DollarSign, ClipboardList, LogOut
} from 'lucide-react';
import { Client, Vehicle, Employee, InventoryItem, ServiceOrder, BudgetLineItem, OrderStatus, Checklist, Presupuesto, PresupuestoItem, OrdenReparacion, OrdenReparacionItem, NotaSalida, NotaSalidaItem } from '../types';
import { 
  generateSaePdf, 
  generateSaeImageBlob, 
  downloadSaeImage, 
  copySaeImageToClipboard, 
  shareSaeOrderMobile,
  getSaePresupuestoHtml,
  downloadSaePresupuestoPdf,
  shareSaePresupuestoMobile,
  getSaeOrdenDeReparacionHtml,
  downloadSaeOrdenDeReparacionPdf,
  shareSaeOrdenDeReparacionMobile,
  getSaeNotaSalidaHtml,
  downloadSaeNotaSalidaPdf,
  shareSaeNotaSalidaMobile
} from '../utils/saePdf';
import { SignaturePad } from './SignaturePad';

interface AdvisorDashboardProps {
  clients: Client[];
  vehicles: Vehicle[];
  employees: Employee[];
  inventory: InventoryItem[];
  orders: ServiceOrder[];
  presupuestos?: Presupuesto[];
  ordenesReparacion?: OrdenReparacion[];
  notasSalida?: NotaSalida[];
  addClient: (c: Omit<Client, 'id' | 'creditBalance'>) => Client;
  updateClient: (c: Client) => void;
  addVehicle: (v: Omit<Vehicle, 'id'>) => Vehicle;
  updateVehicle: (v: Vehicle) => void;
  createServiceOrder: (o: Omit<ServiceOrder, 'id' | 'items' | 'timeLogs' | 'isClockedIn' | 'isPaused' | 'totalHoursWorked' | 'payments' | 'folio' | 'fecha' | 'hora' | 'tecnico'> & { folio?: string; fecha?: string; hora?: string; tecnico?: string }) => ServiceOrder;
  addOrderItem: (orderId: string, item: Omit<BudgetLineItem, 'id' | 'approved'>) => void;
  deleteOrderItem: (orderId: string, itemId: string) => void;
  approveBudgetLine: (orderId: string, itemId: string, approved: boolean) => void;
  registerOrderPayment: (orderId: string, amount: number, method: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Credito') => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addPresupuesto?: (p: Omit<Presupuesto, 'id' | 'createdAt'>) => Presupuesto;
  updatePresupuesto?: (p: Presupuesto) => void;
  deletePresupuesto?: (id: string) => void;
  addOrdenReparacion?: (ord: Omit<OrdenReparacion, 'id' | 'createdAt'>) => OrdenReparacion;
  updateOrdenReparacion?: (ord: OrdenReparacion) => void;
  deleteOrdenReparacion?: (id: string) => void;
  addNotaSalida?: (nota: Omit<NotaSalida, 'id' | 'createdAt'>) => NotaSalida;
  updateNotaSalida?: (nota: NotaSalida) => void;
  deleteNotaSalida?: (id: string) => void;
  convertPresupuestoToOrder?: (id: string) => ServiceOrder | null;
  activeTab?: 'reception' | 'quotes' | 'ordenes_reparacion' | 'salidas' | 'agenda' | 'crm';
  setActiveTab?: (tab: 'reception' | 'quotes' | 'ordenes_reparacion' | 'salidas' | 'agenda' | 'crm') => void;
}

export default function AdvisorDashboard({
  clients,
  vehicles,
  employees,
  inventory,
  orders,
  presupuestos = [],
  ordenesReparacion = [],
  notasSalida = [],
  addClient,
  updateClient,
  addVehicle,
  updateVehicle,
  createServiceOrder,
  addOrderItem,
  deleteOrderItem,
  approveBudgetLine,
  registerOrderPayment,
  updateOrderStatus,
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
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab
}: AdvisorDashboardProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'reception' | 'quotes' | 'ordenes_reparacion' | 'salidas' | 'agenda' | 'crm'>('reception');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = controlledSetActiveTab !== undefined ? controlledSetActiveTab : setLocalActiveTab;

  // Search filter states
  const [clientSearch, setClientSearch] = useState('');
  const [crmSearch, setCrmSearch] = useState('');

  // Reception workflow states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [reportedFailure, setReportedFailure] = useState('');
  
  // New Client Form
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientCreditLimit, setNewClientCreditLimit] = useState(0);

  // New Vehicle Form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehBrand, setNewVehBrand] = useState('');
  const [newVehModel, setNewVehModel] = useState('');
  const [newVehYear, setNewVehYear] = useState(new Date().getFullYear());
  const [newVehPlate, setNewVehPlate] = useState('');
  const [newVehVin, setNewVehVin] = useState('');
  const [newVehMileage, setNewVehMileage] = useState(0);
  const [newVehColor, setNewVehColor] = useState('');
  const [newVehEngomado, setNewVehEngomado] = useState<'yellow'|'pink'|'red'|'green'|'blue'>('pink');
  const [newVehPlateEnding, setNewVehPlateEnding] = useState('8');

  // Entry Checklist State
  const [checklist, setChecklist] = useState<Checklist>({
    scratches: false,
    dents: false,
    fuelLevel: 50,
    tools: true,
    spareTire: true,
    jack: true,
    extinguisher: false,
    photos: [],
    tapetes: true,
    encendedor: true,
    estereo: true,
    tarjetaCirculacion: true,
    compVerificacion: false,
    polizaSeguro: false,
    segurosRuedas: false,
    gato: true,
    herramienta: true,
    extintor: false,
    llantaRefaccion: true,
    sensoresPresencia: false,
    camaraReversa: false,
    inspeccionMotor: 'Inspección visual conforme a protocolo',
    objetosValor: 'Ninguno'
  });

  // Selected Client fields to edit for the order
  const [orderClientCalle, setOrderClientCalle] = useState('');
  const [orderClientCp, setOrderClientCp] = useState('');
  const [orderClientColonia, setOrderClientColonia] = useState('');
  const [orderClientAlcaldia, setOrderClientAlcaldia] = useState('');
  const [orderClientTelFijo, setOrderClientTelFijo] = useState('');
  const [orderClientEmail, setOrderClientEmail] = useState('');
  const [orderClientPhone, setOrderClientPhone] = useState('');

  // Selected Vehicle fields to edit for the order
  const [orderVehMotor, setOrderVehMotor] = useState('');
  const [orderVehSerie, setOrderVehSerie] = useState('');
  const [orderVehColor, setOrderVehColor] = useState('');
  const [orderVehMileage, setOrderVehMileage] = useState(0);
  const [orderVehBrand, setOrderVehBrand] = useState('');
  const [orderVehModel, setOrderVehModel] = useState('');
  const [orderVehYear, setOrderVehYear] = useState(2020);
  const [orderVehPlate, setOrderVehPlate] = useState('');

  // Custom SAE Order states
  const [orderFolio, setOrderFolio] = useState('');
  const [orderFecha, setOrderFecha] = useState(new Date().toISOString().split('T')[0]);
  const [orderHora, setOrderHora] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [orderTecnicoId, setOrderTecnicoId] = useState('');

  // Signature states & WhatsApp states
  const [clientSignature, setClientSignature] = useState<string | undefined>(undefined);
  const [mechanicSignature, setMechanicSignature] = useState<string | undefined>(undefined);
  const [clientHasWhatsapp, setClientHasWhatsapp] = useState(true);

  // Save Success Modal states
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');
  const [successOrderFolio, setSuccessOrderFolio] = useState('');
  const [successClientPhone, setSuccessClientPhone] = useState('');
  const [successClientHasWhatsapp, setSuccessClientHasWhatsapp] = useState(true);
  const [successOrder, setSuccessOrder] = useState<ServiceOrder | null>(null);
  const [successClient, setSuccessClient] = useState<Client | null>(null);
  const [successVehicle, setSuccessVehicle] = useState<Vehicle | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [sharingStatus, setSharingStatus] = useState<'idle' | 'sharing' | 'success' | 'unsupported'>('idle');

  // Synchronize edit states when selected client changes
  useEffect(() => {
    if (selectedClientId) {
      const c = clients.find(cli => cli.id === selectedClientId);
      if (c) {
        setOrderClientCalle(c.calle || c.address || '');
        setOrderClientCp(c.cp || '');
        setOrderClientColonia(c.colonia || '');
        setOrderClientAlcaldia(c.alcaldia || '');
        setOrderClientTelFijo(c.telFijo || '');
        setOrderClientEmail(c.email || '');
        setOrderClientPhone(c.phone || '');
        setClientHasWhatsapp(c.hasWhatsapp !== false);
      }
    } else {
      setOrderClientCalle('');
      setOrderClientCp('');
      setOrderClientColonia('');
      setOrderClientAlcaldia('');
      setOrderClientTelFijo('');
      setOrderClientEmail('');
      setOrderClientPhone('');
      setClientHasWhatsapp(true);
    }
  }, [selectedClientId, clients]);

  // Synchronize edit states when selected vehicle changes
  useEffect(() => {
    if (selectedVehicleId) {
      const v = vehicles.find(veh => veh.id === selectedVehicleId);
      if (v) {
        setOrderVehMotor(v.motor || '');
        setOrderVehSerie(v.serie || v.vin || '');
        setOrderVehColor(v.color || '');
        setOrderVehMileage(v.mileage || 0);
        setOrderVehBrand(v.brand || '');
        setOrderVehModel(v.model || '');
        setOrderVehYear(v.year || 2020);
        setOrderVehPlate(v.plate || '');
      }
    } else {
      setOrderVehMotor('');
      setOrderVehSerie('');
      setOrderVehColor('');
      setOrderVehMileage(0);
      setOrderVehBrand('');
      setOrderVehModel('');
      setOrderVehYear(2020);
      setOrderVehPlate('');
    }
  }, [selectedVehicleId, vehicles]);

  // Presupuesto State & Handlers
  const [presupuestoSubTab, setPresupuestoSubTab] = useState<'formulario' | 'historial' | 'ordenes'>('formulario');
  const [editingPresupuestoId, setEditingPresupuestoId] = useState<string | null>(null);

  const [presNumero, setPresNumero] = useState(() => (202 + (presupuestos?.length || 0) + 1).toString());
  const [presFecha, setPresFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [presAsesor, setPresAsesor] = useState('Alberto Flores Hdz.');
  
  const [presClienteNombre, setPresClienteNombre] = useState('');
  const [presClienteCalle, setPresClienteCalle] = useState('');
  const [presClienteCpColonia, setPresClienteCpColonia] = useState('');
  const [presClienteAlcaldia, setPresClienteAlcaldia] = useState('');
  const [presClienteTelefono, setPresClienteTelefono] = useState('');
  
  const [presMarcaMotor, setPresMarcaMotor] = useState('');
  const [presModeloColor, setPresModeloColor] = useState('');
  const [presMatriculaVin, setPresMatriculaVin] = useState('');
  const [presKilometros, setPresKilometros] = useState<number>(0);
  
  const [presItems, setPresItems] = useState<PresupuestoItem[]>([
    { id: 'pi-1', codigo: '0266', descripcion: 'Servicio de mantenimiento mayor con aceite de motor multigrado', cantidad: 1, importeUnitario: 3850, total: 3850 }
  ]);
  
  const [presFormaPago, setPresFormaPago] = useState('CONTADO');
  const [presValidezDias, setPresValidezDias] = useState(12);
  const [presDiasEntrega, setPresDiasEntrega] = useState(3);
  const [presNotas, setPresNotas] = useState('DOCUMENTO SIN VALOR FISCAL. COSTOS APROXIMADOS POR POSIBLES PARTES EXTRAS DAÑADAS.');
  
  const [presSearchQuery, setPresSearchQuery] = useState('');
  const [presSuccessMessage, setPresSuccessMessage] = useState<string | null>(null);

  // Auto-populate Presupuesto from active client/vehicle selector
  const handleAutoFillPresupuestoFromSelection = () => {
    if (selectedClientId) {
      const c = clients.find(cl => cl.id === selectedClientId);
      if (c) {
        setPresClienteNombre(c.name);
        setPresClienteCalle(c.calle || c.address || '');
        setPresClienteCpColonia(`${c.cp || ''} ${c.colonia || ''}`.trim());
        setPresClienteAlcaldia(c.alcaldia || '');
        setPresClienteTelefono(c.phone || c.telFijo || '');
      }
    }
    if (selectedVehicleId) {
      const v = vehicles.find(veh => veh.id === selectedVehicleId);
      if (v) {
        setPresMarcaMotor(`${v.brand}-${v.model} / ${v.motor || 'Motor'}`);
        setPresModeloColor(`${v.year} / ${v.color || 'Blanco'}`);
        setPresMatriculaVin(`${v.plate || 'SIN-PLACA'} / ${v.vin || v.serie || 'SIN-VIN'}`);
        setPresKilometros(v.mileage || 0);
      }
    }
    setPresSuccessMessage('✅ Datos de Cliente y Vehículo cargados en el Presupuesto');
    setTimeout(() => setPresSuccessMessage(null), 3000);
  };

  // Load exact sample budget from paper document
  const handleLoadSamplePresupuestoPaperData = () => {
    setPresNumero('202');
    setPresFecha('07/07/2026');
    setPresAsesor('Alberto Flores Hdz.');
    setPresClienteNombre('Congregación de la misión');
    setPresClienteCalle('Av.San Fernando #154');
    setPresClienteCpColonia('14000 Tlalpan Centro');
    setPresClienteAlcaldia('Tlalpan');
    setPresClienteTelefono('73 5266 8332');
    setPresMarcaMotor('FORD-RANGER / 2.3L');
    setPresModeloColor('2012 / BLANCO');
    setPresMatriculaVin('865-XXJ / 8AFER5AD8C6453240');
    setPresKilometros(161282);
    setPresFormaPago('CONTADO');
    setPresValidezDias(12);
    setPresDiasEntrega(3);
    setPresItems([
      { id: 'pi-1', codigo: '0266', descripcion: 'Servicio de mantenimiento mayor con aceite de motor multigrado, (camionetas de carga hasta 2500)', cantidad: 1, importeUnitario: 3850.00, total: 3850.00 },
      { id: 'pi-2', codigo: '0242', descripcion: 'Solventes y materiales diversos', cantidad: 1, importeUnitario: 350.00, total: 350.00 },
      { id: 'pi-3', codigo: '0105', descripcion: 'Prueba dinamica, prueba de monitores y verificación general.', cantidad: 1, importeUnitario: 1700.00, total: 1700.00 },
      { id: 'pi-4', codigo: '', descripcion: 'Lavar y engrasar baleros delanteros', cantidad: 1, importeUnitario: 1200.00, total: 1200.00 },
      { id: 'pi-5', codigo: '', descripcion: 'Amortiguadores delanteros', cantidad: 2, importeUnitario: 1350.00, total: 2700.00 },
      { id: 'pi-6', codigo: '', descripcion: 'Bujes de horquillas inferiores', cantidad: 2, importeUnitario: 975.00, total: 1950.00 },
      { id: 'pi-7', codigo: '', descripcion: 'Tornillos estabilizadores', cantidad: 2, importeUnitario: 713.00, total: 1426.00 },
      { id: 'pi-8', codigo: '', descripcion: 'Gomas de barra estabilizadora', cantidad: 2, importeUnitario: 580.00, total: 1160.00 },
      { id: 'pi-9', codigo: '0103', descripcion: 'Alineación a cuatro planos', cantidad: 1, importeUnitario: 850.00, total: 850.00 },
      { id: 'pi-10', codigo: '0214', descripcion: 'Balanceo R/15 R/16 R17 R/18 Rin deportivo', cantidad: 4, importeUnitario: 240.00, total: 960.00 },
      { id: 'pi-11', codigo: '', descripcion: 'Mano de obra.', cantidad: 1, importeUnitario: 3800.00, total: 3800.00 },
      { id: 'pi-12', codigo: '', descripcion: 'Tapon de deposito de anticongelante', cantidad: 1, importeUnitario: 950.00, total: 950.00 },
      { id: 'pi-13', codigo: '0108', descripcion: 'Anticongelante concentrado', cantidad: 2, importeUnitario: 280.00, total: 560.00 },
      { id: 'pi-14', codigo: '', descripcion: 'Mano de obra.', cantidad: 1, importeUnitario: 450.00, total: 450.00 },
      { id: 'pi-15', codigo: '', descripcion: 'Sellar carter de diferencial', cantidad: 1, importeUnitario: 1200.00, total: 1200.00 },
      { id: 'pi-16', codigo: '', descripcion: 'Aceite de diferencial', cantidad: 4, importeUnitario: 298.00, total: 1192.00 },
      { id: 'pi-17', codigo: '', descripcion: 'Balancear cardan y cambiar cruzetas', cantidad: 1, importeUnitario: 6500.00, total: 6500.00 },
      { id: 'pi-18', codigo: '', descripcion: 'Acumulador de energia LTH', cantidad: 1, importeUnitario: 3975.00, total: 3975.00 }
    ]);
    setPresSuccessMessage('📄 Presupuesto Folio 202 cargado correctamente desde el documento de muestra');
    setTimeout(() => setPresSuccessMessage(null), 3000);
  };

  const handleAddPresupuestoItem = () => {
    const newItem: PresupuestoItem = {
      id: `pi-${Date.now()}`,
      codigo: '',
      descripcion: '',
      cantidad: 1,
      importeUnitario: 0,
      total: 0
    };
    setPresItems(prev => [...prev, newItem]);
  };

  const handleUpdatePresupuestoItem = (id: string, field: keyof PresupuestoItem, val: any) => {
    setPresItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: val };
        if (field === 'cantidad' || field === 'importeUnitario') {
          const qty = field === 'cantidad' ? (parseFloat(val) || 0) : item.cantidad;
          const price = field === 'importeUnitario' ? (parseFloat(val) || 0) : item.importeUnitario;
          updated.total = qty * price;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemovePresupuestoItem = (id: string) => {
    setPresItems(prev => prev.filter(item => item.id !== id));
  };

  const presTotalCalculated = presItems.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSavePresupuesto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presClienteNombre.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    const payload = {
      numero: presNumero,
      fecha: presFecha,
      asesor: presAsesor,
      clienteNombre: presClienteNombre,
      clienteCalle: presClienteCalle,
      clienteCpColonia: presClienteCpColonia,
      clienteAlcaldia: presClienteAlcaldia,
      clienteTelefono: presClienteTelefono,
      marcaMotor: presMarcaMotor,
      modeloColor: presModeloColor,
      matriculaVin: presMatriculaVin,
      kilometros: presKilometros,
      items: presItems,
      formaPago: presFormaPago,
      total: presTotalCalculated,
      validezDias: presValidezDias,
      diasEntrega: presDiasEntrega,
      notas: presNotas,
      status: 'Enviado' as const
    };

    if (editingPresupuestoId && updatePresupuesto) {
      updatePresupuesto({
        ...payload,
        id: editingPresupuestoId,
        createdAt: new Date().toISOString()
      });
      setPresSuccessMessage(`✅ Presupuesto #${presNumero} actualizado exitosamente.`);
    } else if (addPresupuesto) {
      addPresupuesto(payload);
      setPresSuccessMessage(`🎉 Presupuesto #${presNumero} registrado correctamente en el historial.`);
    }

    setEditingPresupuestoId(null);
    setTimeout(() => setPresSuccessMessage(null), 3000);
  };

  const handleEditPresupuestoFromList = (p: Presupuesto) => {
    setEditingPresupuestoId(p.id);
    setPresNumero(p.numero);
    setPresFecha(p.fecha);
    setPresAsesor(p.asesor || 'Alberto Flores Hdz.');
    setPresClienteNombre(p.clienteNombre);
    setPresClienteCalle(p.clienteCalle);
    setPresClienteCpColonia(p.clienteCpColonia);
    setPresClienteAlcaldia(p.clienteAlcaldia);
    setPresClienteTelefono(p.clienteTelefono);
    setPresMarcaMotor(p.marcaMotor);
    setPresModeloColor(p.modeloColor);
    setPresMatriculaVin(p.matriculaVin);
    setPresKilometros(p.kilometros || 0);
    setPresItems(p.items || []);
    setPresFormaPago(p.formaPago || 'CONTADO');
    setPresValidezDias(p.validezDias || 12);
    setPresDiasEntrega(p.diasEntrega || 3);
    setPresNotas(p.notas || '');
    setPresupuestoSubTab('formulario');
  };

  const handleResetPresupuestoForm = () => {
    setEditingPresupuestoId(null);
    setPresNumero((202 + (presupuestos?.length || 0) + 1).toString());
    setPresFecha(new Date().toISOString().split('T')[0]);
    setPresClienteNombre('');
    setPresClienteCalle('');
    setPresClienteCpColonia('');
    setPresClienteAlcaldia('');
    setPresClienteTelefono('');
    setPresMarcaMotor('');
    setPresModeloColor('');
    setPresMatriculaVin('');
    setPresKilometros(0);
    setPresItems([
      { id: `pi-${Date.now()}`, codigo: '', descripcion: '', cantidad: 1, importeUnitario: 0, total: 0 }
    ]);
  };

  const handleSendPresupuestoWhatsApp = (p: Presupuesto) => {
    const rawPhone = (p.clienteTelefono || '').replace(/\D/g, '');
    const phone = rawPhone.length === 10 ? `52${rawPhone}` : rawPhone;
    
    let text = `*SERVICIO AUTOMOTRIZ ESPECIALIZADO (SAE)*\n`;
    text += `*PRESUPUESTO DE SERVICIO #${p.numero}*\n`;
    text += `📅 Fecha: ${p.fecha}\n`;
    text += `👤 Cliente: *${p.clienteNombre}*\n`;
    text += `🚗 Vehículo: *${p.marcaMotor}* | Placas: *${p.matriculaVin}*\n`;
    text += `------------------------------------\n`;
    text += `*DESGLOSE DE CONCEPTOS / REFACCIONES:*\n`;
    p.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.descripcion} (${item.cantidad}x $${item.importeUnitario.toFixed(2)}) = *$${item.total.toFixed(2)}*\n`;
    });
    text += `------------------------------------\n`;
    text += `💵 *TOTAL: $${p.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN*\n`;
    text += `💳 Forma de Pago: ${p.formaPago}\n`;
    text += `⏱️ Validez: ${p.validezDias} días hábiles\n`;
    text += `Atención Personal: ${p.asesor}\n\n`;
    text += `📌 _Si deseas autorizar este presupuesto o tienes dudas, puedes responder a este mensaje._`;

    const encoded = encodeURIComponent(text);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Selected Client / Vehicle Helper for Presupuesto
  const [selectedClientForPresupuesto, setSelectedClientForPresupuesto] = useState<Client | null>(null);
  const [selectedVehicleForPresupuesto, setSelectedVehicleForPresupuesto] = useState<Vehicle | null>(null);

  const selectClientForPresupuesto = (client: Client) => {
    setSelectedClientForPresupuesto(client);
    setPresClienteNombre(client.name);
    setPresClienteCalle(client.calle || client.address || '');
    setPresClienteCpColonia(`${client.cp || ''} ${client.colonia || ''}`.trim());
    setPresClienteAlcaldia(client.alcaldia || '');
    setPresClienteTelefono(client.phone || client.telFijo || '');

    const clientVehicles = vehicles.filter(v => v.ownerId === client.id || (v as any).clientId === client.id);
    if (clientVehicles.length > 0) {
      selectVehicleForPresupuesto(clientVehicles[0]);
    } else {
      setSelectedVehicleForPresupuesto(null);
    }
  };

  const selectVehicleForPresupuesto = (v: Vehicle) => {
    setSelectedVehicleForPresupuesto(v);
    setPresMarcaMotor(`${v.brand}-${v.model} / ${v.motor || 'Motor'}`);
    setPresModeloColor(`${v.year} / ${v.color || 'Blanco'}`);
    setPresMatriculaVin(`${v.plate || 'SIN-PLACA'} / ${v.vin || v.serie || 'SIN-VIN'}`);
    setPresKilometros(v.mileage || 0);
  };

  // State for Orden de Reparación
  const [ordenSubTab, setOrdenSubTab] = useState<'formulario' | 'historial'>('formulario');
  const [editingOrdenId, setEditingOrdenId] = useState<string | null>(null);

  const [ordNumero, setOrdNumero] = useState(() => (180 + (ordenesReparacion?.length || 0) + 1).toString());
  const [ordFecha, setOrdFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [ordAsesor, setOrdAsesor] = useState('Alberto Flores Hdz.');
  const [ordTecnico, setOrdTecnico] = useState('Ing. Carlos Mendoza');

  const [ordRotacionAireLlantas, setOrdRotacionAireLlantas] = useState('OK (32 PSI)');
  const [ordRevLimpiaParabrisas, setOrdRevLimpiaParabrisas] = useState('OK');
  const [ordRevLucesNivelesEngral, setOrdRevLucesNivelesEngral] = useState('Niveles OK');

  const [ordClienteNombre, setOrdClienteNombre] = useState('');
  const [ordClienteCalle, setOrdClienteCalle] = useState('');
  const [ordClienteCpColonia, setOrdClienteCpColonia] = useState('');
  const [ordClienteAlcaldia, setOrdClienteAlcaldia] = useState('');
  const [ordClienteTelefono, setOrdClienteTelefono] = useState('');

  const [ordMarcaMotor, setOrdMarcaMotor] = useState('');
  const [ordModeloColor, setOrdModeloColor] = useState('');
  const [ordMatriculaVin, setOrdMatriculaVin] = useState('');
  const [ordKilometros, setOrdKilometros] = useState<number>(0);

  const [ordItems, setOrdItems] = useState<OrdenReparacionItem[]>([
    { id: 'ori-1', codigo: '0266', descripcion: 'Servicio de mantenimiento mayor con aceite de motor multigrado', cantidad: 1 }
  ]);

  const [ordNotas, setOrdNotas] = useState('');
  const [ordSearchQuery, setOrdSearchQuery] = useState('');
  const [ordSuccessMessage, setOrdSuccessMessage] = useState<string | null>(null);

  const [selectedClientForOrden, setSelectedClientForOrden] = useState<Client | null>(null);
  const [selectedVehicleForOrden, setSelectedVehicleForOrden] = useState<Vehicle | null>(null);

  const selectClientForOrden = (client: Client) => {
    setSelectedClientForOrden(client);
    setOrdClienteNombre(client.name);
    setOrdClienteCalle(client.calle || client.address || '');
    setOrdClienteCpColonia(`${client.cp || ''} ${client.colonia || ''}`.trim());
    setOrdClienteAlcaldia(client.alcaldia || '');
    setOrdClienteTelefono(client.phone || client.telFijo || '');

    const clientVehicles = vehicles.filter(v => v.ownerId === client.id || (v as any).clientId === client.id);
    if (clientVehicles.length > 0) {
      selectVehicleForOrden(clientVehicles[0]);
    } else {
      setSelectedVehicleForOrden(null);
    }
  };

  const selectVehicleForOrden = (v: Vehicle) => {
    setSelectedVehicleForOrden(v);
    setOrdMarcaMotor(`${v.brand}-${v.model} / ${v.motor || 'Motor'}`);
    setOrdModeloColor(`${v.year} / ${v.color || 'Blanco'}`);
    setOrdMatriculaVin(`${v.plate || 'SIN-PLACA'} / ${v.vin || v.serie || 'SIN-VIN'}`);
    setOrdKilometros(v.mileage || 0);
  };

  const handleLoadSampleOrdenPaperData = () => {
    setOrdNumero('180');
    setOrdFecha('07/07/2026');
    setOrdAsesor('Alberto Flores Hdz.');
    setOrdTecnico('Ing. Carlos Mendoza');
    setOrdRotacionAireLlantas('OK (32 PSI)');
    setOrdRevLimpiaParabrisas('OK');
    setOrdRevLucesNivelesEngral('Niveles OK');
    setOrdClienteNombre('Congregación de la misión');
    setOrdClienteCalle('Av.San Fernando #154');
    setOrdClienteCpColonia('14000 Tlalpan Centro');
    setOrdClienteAlcaldia('Tlalpan');
    setOrdClienteTelefono('73 5266 8332');
    setOrdMarcaMotor('FORD-RANGER / 2.3L');
    setOrdModeloColor('2012 / BLANCO');
    setOrdMatriculaVin('865-XXJ / 8AFER5AD8C6453240');
    setOrdKilometros(161282);
    setOrdItems([
      { id: 'ori-1', codigo: '0266', descripcion: 'Servicio de mantenimiento mayor con aceite de motor multigrado, (camionetas de carga hasta 2500)', cantidad: 1 },
      { id: 'ori-2', codigo: '0242', descripcion: 'Solventes y materiales diversos', cantidad: 1 },
      { id: 'ori-3', codigo: '0105', descripcion: 'Prueba dinamica, prueba de monitores y verificación general.', cantidad: 1 },
      { id: 'ori-4', codigo: '', descripcion: 'Lavar y engrasar baleros delanteros', cantidad: 1 },
      { id: 'ori-5', codigo: '', descripcion: 'Amortiguadores delanteros', cantidad: 2 },
      { id: 'ori-6', codigo: '', descripcion: 'Bujes de horquillas inferiores', cantidad: 2 },
      { id: 'ori-7', codigo: '', descripcion: 'Tornillos estabilizadores', cantidad: 2 },
      { id: 'ori-8', codigo: '', descripcion: 'Gomas de barra estabilizadora', cantidad: 2 },
      { id: 'ori-9', codigo: '0103', descripcion: 'Alineación a cuatro planos', cantidad: 1 },
      { id: 'ori-10', codigo: '0214', descripcion: 'Balanceo R/15 R/16 R17 R/18 Rin deportivo', cantidad: 4 },
      { id: 'ori-11', codigo: '', descripcion: 'Mano de obra.', cantidad: 1 },
      { id: 'ori-12', codigo: '', descripcion: 'Tapon de deposito de anticongelante', cantidad: 1 },
      { id: 'ori-13', codigo: '0108', descripcion: 'Anticongelante concentrado', cantidad: 2 },
      { id: 'ori-14', codigo: '', descripcion: 'Mano de obra.', cantidad: 1 },
      { id: 'ori-15', codigo: '', descripcion: 'Sellar carter de diferencial', cantidad: 1 },
      { id: 'ori-16', codigo: '', descripcion: 'Aceite de diferencial', cantidad: 4 },
      { id: 'ori-17', codigo: '', descripcion: 'Balancear cardan y cambiar cruzetas', cantidad: 1 },
      { id: 'ori-18', codigo: '', descripcion: 'Acumulador de energia LTH', cantidad: 1 }
    ]);
    setOrdSuccessMessage('📄 Órden de Reparación Folio 180 cargada correctamente desde el documento de muestra');
    setTimeout(() => setOrdSuccessMessage(null), 3000);
  };

  const handleAddOrdenItem = () => {
    const newItem: OrdenReparacionItem = {
      id: `ori-${Date.now()}`,
      codigo: '',
      descripcion: '',
      cantidad: 1
    };
    setOrdItems(prev => [...prev, newItem]);
  };

  const handleUpdateOrdenItem = (id: string, field: keyof OrdenReparacionItem, val: any) => {
    setOrdItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleRemoveOrdenItem = (id: string) => {
    setOrdItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveOrdenReparacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordClienteNombre.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    const payload = {
      numero: ordNumero,
      fecha: ordFecha,
      asesor: ordAsesor,
      tecnico: ordTecnico,
      rotacionAireLlantas: ordRotacionAireLlantas,
      revLimpiaParabrisas: ordRevLimpiaParabrisas,
      revLucesNivelesEngral: ordRevLucesNivelesEngral,
      clienteNombre: ordClienteNombre,
      clienteCalle: ordClienteCalle,
      clienteCpColonia: ordClienteCpColonia,
      clienteAlcaldia: ordClienteAlcaldia,
      clienteTelefono: ordClienteTelefono,
      marcaMotor: ordMarcaMotor,
      modeloColor: ordModeloColor,
      matriculaVin: ordMatriculaVin,
      kilometros: ordKilometros,
      items: ordItems,
      notas: ordNotas,
      clientId: selectedClientForOrden?.id,
      vehicleId: selectedVehicleForOrden?.id,
      status: 'En Proceso' as const
    };

    if (editingOrdenId && updateOrdenReparacion) {
      updateOrdenReparacion({
        ...payload,
        id: editingOrdenId,
        createdAt: new Date().toISOString()
      });
      setOrdSuccessMessage(`✅ Órden de Reparación #${ordNumero} actualizada exitosamente.`);
    } else if (addOrdenReparacion) {
      addOrdenReparacion(payload);
      setOrdSuccessMessage(`🎉 Órden de Reparación #${ordNumero} registrada correctamente en el historial.`);
    }

    setEditingOrdenId(null);
    setTimeout(() => setOrdSuccessMessage(null), 3000);
  };

  const handleEditOrdenFromList = (ord: OrdenReparacion) => {
    setEditingOrdenId(ord.id);
    setOrdNumero(ord.numero);
    setOrdFecha(ord.fecha);
    setOrdAsesor(ord.asesor || 'Alberto Flores Hdz.');
    setOrdTecnico(ord.tecnico || 'Ing. Carlos Mendoza');
    setOrdRotacionAireLlantas(ord.rotacionAireLlantas || '');
    setOrdRevLimpiaParabrisas(ord.revLimpiaParabrisas || '');
    setOrdRevLucesNivelesEngral(ord.revLucesNivelesEngral || '');
    setOrdClienteNombre(ord.clienteNombre);
    setOrdClienteCalle(ord.clienteCalle);
    setOrdClienteCpColonia(ord.clienteCpColonia);
    setOrdClienteAlcaldia(ord.clienteAlcaldia);
    setOrdClienteTelefono(ord.clienteTelefono);
    setOrdMarcaMotor(ord.marcaMotor);
    setOrdModeloColor(ord.modeloColor);
    setOrdMatriculaVin(ord.matriculaVin);
    setOrdKilometros(ord.kilometros || 0);
    setOrdItems(ord.items || []);
    setOrdNotas(ord.notas || '');
    setOrdenSubTab('formulario');
  };

  const handleResetOrdenForm = () => {
    setEditingOrdenId(null);
    setOrdNumero((180 + (ordenesReparacion?.length || 0) + 1).toString());
    setOrdFecha(new Date().toISOString().split('T')[0]);
    setOrdClienteNombre('');
    setOrdClienteCalle('');
    setOrdClienteCpColonia('');
    setOrdClienteAlcaldia('');
    setOrdClienteTelefono('');
    setOrdMarcaMotor('');
    setOrdModeloColor('');
    setOrdMatriculaVin('');
    setOrdKilometros(0);
    setOrdItems([
      { id: `ori-${Date.now()}`, codigo: '', descripcion: '', cantidad: 1 }
    ]);
  };

  const handleSendOrdenWhatsApp = (ord: OrdenReparacion) => {
    const rawPhone = (ord.clienteTelefono || '').replace(/\D/g, '');
    const phone = rawPhone.length === 10 ? `52${rawPhone}` : rawPhone;

    let text = `*SERVICIO AUTOMOTRIZ ESPECIALIZADO (SAE)*\n`;
    text += `*ÓRDEN DE REPARACIÓN #${ord.numero}*\n`;
    text += `📅 Fecha: ${ord.fecha}\n`;
    text += `👤 Cliente: *${ord.clienteNombre}*\n`;
    text += `🚗 Vehículo: *${ord.marcaMotor}* | Placas: *${ord.matriculaVin}*\n`;
    text += `👨‍🔧 Técnico: ${ord.tecnico}\n`;
    text += `------------------------------------\n`;
    text += `*REFACCIONES Y TRABAJOS A REALIZAR:*\n`;
    ord.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.descripcion} (${item.cantidad} pza${item.cantidad > 1 ? 's' : ''})\n`;
    });
    text += `------------------------------------\n`;
    text += `Atención Personal: ${ord.asesor}\n\n`;
    text += `📌 _Te compartimos la órden de trabajo para el seguimiento de tu unidad._`;

    const encoded = encodeURIComponent(text);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // State for Salidas Module
  const [salidaSubTab, setSalidaSubTab] = useState<'formulario' | 'historial' | 'presupuestos'>('formulario');
  const [editingSalidaId, setEditingSalidaId] = useState<string | null>(null);

  const [salNumero, setSalNumero] = useState(() => (187 + (notasSalida?.length || 0)).toString());
  const [salFecha, setSalFecha] = useState(() => '16/07/2026');
  const [salAsesor, setSalAsesor] = useState('Alberto Flores Hdz.');

  const [salClienteNombre, setSalClienteNombre] = useState('Congregación de la misión');
  const [salClienteCalle, setSalClienteCalle] = useState('Av.San Fernando #154');
  const [salClienteCpColonia, setSalClienteCpColonia] = useState('14000 Tlalpan Centro');
  const [salClienteAlcaldia, setSalClienteAlcaldia] = useState('Tlalpan');
  const [salClienteTelefono, setSalClienteTelefono] = useState('73 5266 8332');

  const [salMarcaMotor, setSalMarcaMotor] = useState('FORD-RANGER / 2.3L');
  const [salModeloColor, setSalModeloColor] = useState('2012 / BLANCO');
  const [salMatriculaVin, setSalMatriculaVin] = useState('865-XXJ / 8AFER5AD8C6453240');
  const [salKilometros, setSalKilometros] = useState<number>(161282);

  const [salFormaPago, setSalFormaPago] = useState('CONTADO');
  const [salGarantia, setSalGarantia] = useState('30 DIAS Ó 2,000 KMS. LO QUE OCURRA PRIMERO');
  const [salOrdenServicioNumero, setSalOrdenServicioNumero] = useState('378A');

  const [salItems, setSalItems] = useState<NotaSalidaItem[]>([
    { id: 'nsi-1', codigo: '0266', descripcion: 'Servicio de mantenimiento mayor con aceite de motor multigrado, (camionetas de carga hasta 2500)', cantidad: 1, importeUnitario: 3850.00, total: 3850.00 },
    { id: 'nsi-2', codigo: '0242', descripcion: 'Solventes y materiales diversos', cantidad: 1, importeUnitario: 350.00, total: 350.00 },
    { id: 'nsi-3', codigo: '0105', descripcion: 'Prueba dinamica, prueba de monitores y verificación general.', cantidad: 1, importeUnitario: 1700.00, total: 1700.00 },
    { id: 'nsi-4', codigo: '', descripcion: 'Lavar y engrasar baleros delanteros', cantidad: 1, importeUnitario: 1200.00, total: 1200.00 },
    { id: 'nsi-5', codigo: '', descripcion: 'Amortiguadores delanteros', cantidad: 2, importeUnitario: 1350.00, total: 2700.00 },
    { id: 'nsi-6', codigo: '', descripcion: 'Bujes de horquillas inferiores', cantidad: 2, importeUnitario: 975.00, total: 1950.00 },
    { id: 'nsi-7', codigo: '', descripcion: 'Tornillos estabilizadores', cantidad: 2, importeUnitario: 713.00, total: 1426.00 },
    { id: 'nsi-8', codigo: '', descripcion: 'Gomas de barra estabilizadora', cantidad: 2, importeUnitario: 580.00, total: 1160.00 },
    { id: 'nsi-9', codigo: '0103', descripcion: 'Alineación a cuatro planos', cantidad: 1, importeUnitario: 850.00, total: 850.00 },
    { id: 'nsi-10', codigo: '0214', descripcion: 'Balanceo R/15 R/16 R17 R/18 Rin deportivo', cantidad: 4, importeUnitario: 240.00, total: 960.00 },
    { id: 'nsi-11', codigo: '', descripcion: 'Mano de obra.', cantidad: 1, importeUnitario: 3800.00, total: 3800.00 },
    { id: 'nsi-12', codigo: '', descripcion: 'Tapon de deposito de anticongelante', cantidad: 1, importeUnitario: 950.00, total: 950.00 },
    { id: 'nsi-13', codigo: '0108', descripcion: 'Anticongelante concentrado', cantidad: 2, importeUnitario: 280.00, total: 560.00 },
    { id: 'nsi-14', codigo: '', descripcion: 'Mano de obra.', cantidad: 1, importeUnitario: 450.00, total: 450.00 },
    { id: 'nsi-15', codigo: '', descripcion: 'Sellar carter de diferencial', cantidad: 1, importeUnitario: 1200.00, total: 1200.00 },
    { id: 'nsi-16', codigo: '', descripcion: 'Aceite de diferencial', cantidad: 4, importeUnitario: 298.00, total: 1192.00 },
    { id: 'nsi-17', codigo: '', descripcion: 'Balancear cardan y cambiar cruzetas', cantidad: 1, importeUnitario: 6500.00, total: 6500.00 },
    { id: 'nsi-18', codigo: '', descripcion: 'Acumulador de energia LTH', cantidad: 1, importeUnitario: 3975.00, total: 3975.00 }
  ]);

  const [salSearchQuery, setSalSearchQuery] = useState('');
  const [salSuccessMessage, setSalSuccessMessage] = useState<string | null>(null);

  const [selectedClientForSalida, setSelectedClientForSalida] = useState<Client | null>(null);
  const [selectedVehicleForSalida, setSelectedVehicleForSalida] = useState<Vehicle | null>(null);

  const selectClientForSalida = (client: Client) => {
    setSelectedClientForSalida(client);
    setSalClienteNombre(client.name);
    setSalClienteCalle(client.calle || client.address || '');
    setSalClienteCpColonia(`${client.cp || ''} ${client.colonia || ''}`.trim());
    setSalClienteAlcaldia(client.alcaldia || '');
    setSalClienteTelefono(client.phone || client.telFijo || '');

    const clientVehicles = vehicles.filter(v => v.ownerId === client.id || (v as any).clientId === client.id);
    if (clientVehicles.length > 0) {
      selectVehicleForSalida(clientVehicles[0]);
    } else {
      setSelectedVehicleForSalida(null);
    }
  };

  const selectVehicleForSalida = (v: Vehicle) => {
    setSelectedVehicleForSalida(v);
    setSalMarcaMotor(`${v.brand}-${v.model} / ${v.motor || '2.3L'}`);
    setSalModeloColor(`${v.year} / ${(v.color || 'Blanco').toUpperCase()}`);
    setSalMatriculaVin(`${v.plate || 'SIN-PLACA'} / ${v.vin || v.serie || 'VIN-000'}`);
    setSalKilometros(v.mileage || 0);
  };

  const handleAddSalidaItem = () => {
    const newItem: NotaSalidaItem = {
      id: `nsi-${Date.now()}`,
      codigo: '',
      descripcion: '',
      cantidad: 1,
      importeUnitario: 0,
      total: 0
    };
    setSalItems(prev => [...prev, newItem]);
  };

  const handleUpdateSalidaItem = (id: string, field: keyof NotaSalidaItem, val: any) => {
    setSalItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: val };
        if (field === 'cantidad' || field === 'importeUnitario') {
          const qty = field === 'cantidad' ? (parseFloat(val) || 0) : item.cantidad;
          const price = field === 'importeUnitario' ? (parseFloat(val) || 0) : item.importeUnitario;
          updated.total = qty * price;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveSalidaItem = (id: string) => {
    setSalItems(prev => prev.filter(item => item.id !== id));
  };

  const salTotalCalculated = salItems.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleLoadSampleSalidaPaperData = () => {
    setSalNumero('187');
    setSalFecha('16/07/2026');
    setSalAsesor('Alberto Flores Hdz.');
    setSalClienteNombre('Congregación de la misión');
    setSalClienteCalle('Av.San Fernando #154');
    setSalClienteCpColonia('14000 Tlalpan Centro');
    setSalClienteAlcaldia('Tlalpan');
    setSalClienteTelefono('73 5266 8332');
    setSalMarcaMotor('FORD-RANGER / 2.3L');
    setSalModeloColor('2012 / BLANCO');
    setSalMatriculaVin('865-XXJ / 8AFER5AD8C6453240');
    setSalKilometros(161282);
    setSalFormaPago('CONTADO');
    setSalGarantia('30 DIAS Ó 2,000 KMS. LO QUE OCURRA PRIMERO');
    setSalOrdenServicioNumero('378A');
    setSalItems([
      { id: 'nsi-1', codigo: '0266', descripcion: 'Servicio de mantenimiento mayor con aceite de motor multigrado, (camionetas de carga hasta 2500)', cantidad: 1, importeUnitario: 3850.00, total: 3850.00 },
      { id: 'nsi-2', codigo: '0242', descripcion: 'Solventes y materiales diversos', cantidad: 1, importeUnitario: 350.00, total: 350.00 },
      { id: 'nsi-3', codigo: '0105', descripcion: 'Prueba dinamica, prueba de monitores y verificación general.', cantidad: 1, importeUnitario: 1700.00, total: 1700.00 },
      { id: 'nsi-4', codigo: '', descripcion: 'Lavar y engrasar baleros delanteros', cantidad: 1, importeUnitario: 1200.00, total: 1200.00 },
      { id: 'nsi-5', codigo: '', descripcion: 'Amortiguadores delanteros', cantidad: 2, importeUnitario: 1350.00, total: 2700.00 },
      { id: 'nsi-6', codigo: '', descripcion: 'Bujes de horquillas inferiores', cantidad: 2, importeUnitario: 975.00, total: 1950.00 },
      { id: 'nsi-7', codigo: '', descripcion: 'Tornillos estabilizadores', cantidad: 2, importeUnitario: 713.00, total: 1426.00 },
      { id: 'nsi-8', codigo: '', descripcion: 'Gomas de barra estabilizadora', cantidad: 2, importeUnitario: 580.00, total: 1160.00 },
      { id: 'nsi-9', codigo: '0103', descripcion: 'Alineación a cuatro planos', cantidad: 1, importeUnitario: 850.00, total: 850.00 },
      { id: 'nsi-10', codigo: '0214', descripcion: 'Balanceo R/15 R/16 R17 R/18 Rin deportivo', cantidad: 4, importeUnitario: 240.00, total: 960.00 },
      { id: 'nsi-11', codigo: '', descripcion: 'Mano de obra.', cantidad: 1, importeUnitario: 3800.00, total: 3800.00 },
      { id: 'nsi-12', codigo: '', descripcion: 'Tapon de deposito de anticongelante', cantidad: 1, importeUnitario: 950.00, total: 950.00 },
      { id: 'nsi-13', codigo: '0108', descripcion: 'Anticongelante concentrado', cantidad: 2, importeUnitario: 280.00, total: 560.00 },
      { id: 'nsi-14', codigo: '', descripcion: 'Mano de obra.', cantidad: 1, importeUnitario: 450.00, total: 450.00 },
      { id: 'nsi-15', codigo: '', descripcion: 'Sellar carter de diferencial', cantidad: 1, importeUnitario: 1200.00, total: 1200.00 },
      { id: 'nsi-16', codigo: '', descripcion: 'Aceite de diferencial', cantidad: 4, importeUnitario: 298.00, total: 1192.00 },
      { id: 'nsi-17', codigo: '', descripcion: 'Balancear cardan y cambiar cruzetas', cantidad: 1, importeUnitario: 6500.00, total: 6500.00 },
      { id: 'nsi-18', codigo: '', descripcion: 'Acumulador de energia LTH', cantidad: 1, importeUnitario: 3975.00, total: 3975.00 }
    ]);
    setSalSuccessMessage('📄 Ejemplo Nota de Salida #187 cargado desde la hoja oficial SAE');
    setTimeout(() => setSalSuccessMessage(null), 3000);
  };

  const handleSaveNotaSalida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salClienteNombre.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    const payload: Omit<NotaSalida, 'id' | 'createdAt'> = {
      numero: salNumero,
      fecha: salFecha,
      asesor: salAsesor,
      clienteNombre: salClienteNombre,
      clienteCalle: salClienteCalle,
      clienteCpColonia: salClienteCpColonia,
      clienteAlcaldia: salClienteAlcaldia,
      clienteTelefono: salClienteTelefono,
      marcaMotor: salMarcaMotor,
      modeloColor: salModeloColor,
      matriculaVin: salMatriculaVin,
      kilometros: salKilometros,
      formaPago: salFormaPago,
      garantia: salGarantia,
      ordenServicioNumero: salOrdenServicioNumero,
      items: salItems,
      total: salTotalCalculated,
      clientId: selectedClientForSalida?.id,
      vehicleId: selectedVehicleForSalida?.id,
      status: 'Emitida' as const
    };

    if (editingSalidaId && updateNotaSalida) {
      updateNotaSalida({
        ...payload,
        id: editingSalidaId,
        createdAt: new Date().toISOString()
      });
      setSalSuccessMessage(`✅ Nota de Salida #${salNumero} actualizada exitosamente.`);
    } else if (addNotaSalida) {
      addNotaSalida(payload);
      setSalSuccessMessage(`🎉 Nota de Salida #${salNumero} registrada correctamente en el historial.`);
    }

    setEditingSalidaId(null);
    setTimeout(() => setSalSuccessMessage(null), 3000);
  };

  const handleEditSalidaFromList = (nota: NotaSalida) => {
    setEditingSalidaId(nota.id);
    setSalNumero(nota.numero);
    setSalFecha(nota.fecha);
    setSalAsesor(nota.asesor || 'Alberto Flores Hdz.');
    setSalClienteNombre(nota.clienteNombre);
    setSalClienteCalle(nota.clienteCalle);
    setSalClienteCpColonia(nota.clienteCpColonia);
    setSalClienteAlcaldia(nota.clienteAlcaldia);
    setSalClienteTelefono(nota.clienteTelefono);
    setSalMarcaMotor(nota.marcaMotor);
    setSalModeloColor(nota.modeloColor);
    setSalMatriculaVin(nota.matriculaVin);
    setSalKilometros(nota.kilometros || 0);
    setSalFormaPago(nota.formaPago || 'CONTADO');
    setSalGarantia(nota.garantia || '30 DIAS Ó 2,000 KMS. LO QUE OCURRA PRIMERO');
    setSalOrdenServicioNumero(nota.ordenServicioNumero || '');
    setSalItems(nota.items || []);
    setSalidaSubTab('formulario');
  };

  const handleResetSalidaForm = () => {
    setEditingSalidaId(null);
    setSalNumero((187 + (notasSalida?.length || 0)).toString());
    setSalFecha(new Date().toISOString().split('T')[0]);
    setSalClienteNombre('');
    setSalClienteCalle('');
    setSalClienteCpColonia('');
    setSalClienteAlcaldia('');
    setSalClienteTelefono('');
    setSalMarcaMotor('');
    setSalModeloColor('');
    setSalMatriculaVin('');
    setSalKilometros(0);
    setSalFormaPago('CONTADO');
    setSalGarantia('30 DIAS Ó 2,000 KMS. LO QUE OCURRA PRIMERO');
    setSalOrdenServicioNumero('');
    setSalItems([]);
  };

  const handleSendSalidaWhatsApp = (nota: NotaSalida) => {
    const phone = nota.clienteTelefono.replace(/[^0-9]/g, '') || '5500000000';
    const msg = `Hola *${nota.clienteNombre}*, te compartimos tu *Nota de Salida / Liquidación SAE* con el Folio #${nota.numero}.\nVehículo: ${nota.marcaMotor} (${nota.matriculaVin})\nTotal: $${nota.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN\nOrd. Serv: #${nota.ordenServicioNumero}\n¡Muchas gracias por tu confianza en Servicio Automotriz Especializado (SAE)! 🚗🏁`;
    window.open(`https://api.whatsapp.com/send?phone=52${phone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleConvertPresupuestoToSalida = (pres: Presupuesto) => {
    setSalNumero((187 + (notasSalida?.length || 0)).toString());
    setSalFecha(new Date().toISOString().split('T')[0]);
    setSalAsesor(pres.asesor || 'Alberto Flores Hdz.');
    setSalClienteNombre(pres.clienteNombre);
    setSalClienteCalle(pres.clienteCalle || '');
    setSalClienteCpColonia(pres.clienteCpColonia || '');
    setSalClienteAlcaldia(pres.clienteAlcaldia || '');
    setSalClienteTelefono(pres.clienteTelefono || '');
    setSalMarcaMotor(pres.marcaMotor || '');
    setSalModeloColor(pres.modeloColor || '');
    setSalMatriculaVin(pres.matriculaVin || '');
    setSalKilometros(pres.kilometros || 0);
    setSalFormaPago('CONTADO');
    setSalGarantia('30 DIAS Ó 2,000 KMS. LO QUE OCURRA PRIMERO');
    setSalOrdenServicioNumero(pres.numero || '');
    setSalItems(pres.items.map((i, idx) => ({
      id: `nsi-conv-${idx + 1}`,
      codigo: i.codigo || '',
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      importeUnitario: i.importeUnitario,
      total: i.total
    })));
    setSalidaSubTab('formulario');
    setSalSuccessMessage(`⚡ Presupuesto #${pres.numero} cargado en el formulario de Nota de Salida. Puedes revisar y guardar.`);
    setTimeout(() => setSalSuccessMessage(null), 4000);
  };

  // Set default mechanic ID
  useEffect(() => {
    const defaultMech = employees.find(e => e.role === 'Mecanico' && e.active);
    if (defaultMech) {
      setOrderTecnicoId(defaultMech.id);
    }
  }, [employees]);

  // Live camera and device photo capture states & handlers
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setShowCameraModal(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      setCameraStream(mediaStream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 150);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("No se pudo acceder a la cámara en vivo. El navegador puede requerir HTTPS o permisos especiales. Se recomienda usar la subida de fotos que automáticamente activa la cámara nativa en tu móvil.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.85);
        setChecklist(prev => ({
          ...prev,
          photos: [...prev.photos, dataUri]
        }));
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64String = reader.result;
            setChecklist(prev => ({
              ...prev,
              photos: [...prev.photos, base64String]
            }));
          }
        };
        reader.readAsDataURL(file as File);
      });
    }
  };

  const removePhoto = (index: number) => {
    setChecklist(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // Quotation selected order
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const activeQuoteOrder = orders.find(o => o.id === selectedOrderId);

  // Quote item inputs
  const [newItemType, setNewItemType] = useState<'refaccion' | 'mano_de_obra'>('mano_de_obra');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  // Selected payment values
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Credito'>('Efectivo');

  // Agenda/Bays Booking State
  const [agenda, setAgenda] = useState<{
    id: string; date: string; time: string; vehiclePlate: string; bay: string; mechanicId: string; purpose: string;
  }[]>([
    { id: '1', date: '2026-07-16', time: '09:00', vehiclePlate: '931-WYZ', bay: 'Bahía 1 - Rampa', mechanicId: 'emp-2', purpose: 'Cambio de Balatas' },
    { id: '2', date: '2026-07-16', time: '11:00', vehiclePlate: '582-ABC', bay: 'Bahía 2 - Eléctrico', mechanicId: 'emp-3', purpose: 'Afinación Mayor' },
    { id: '3', date: '2026-07-16', time: '14:00', vehiclePlate: '123-XYZ', bay: 'Bahía 3 - Suspensión', mechanicId: 'emp-2', purpose: 'Revisión Tren Motriz' }
  ]);
  const [bookingDate, setBookingDate] = useState('2026-07-16');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [bookingPlate, setBookingPlate] = useState('');
  const [bookingBay, setBookingBay] = useState('Bahía 1 - Rampa');
  const [bookingMech, setBookingMech] = useState('emp-2');
  const [bookingPurpose, setBookingPurpose] = useState('');

  // Submit check-in handler (Create Service Order)
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedVehicleId || !reportedFailure) {
      alert('Favor de seleccionar un cliente, un vehículo e ingresar el motivo de visita.');
      return;
    }

    // SIGNATURES CHECK (ALLOW AUTO-GENERATING IF EMPTY)
    let finalClientSig = clientSignature;
    let finalMechSig = mechanicSignature;

    if (!finalClientSig || !finalMechSig) {
      const proceed = confirm('⚠️ Advertencia: Falta la firma digital del Cliente o del Asesor para autorizar formalmente la recepción.\n\n¿Deseas autogenerar firmas digitales genéricas ahora mismo para completar el registro y guardar la Orden de Servicio?');
      if (!proceed) {
        return;
      }
      if (!finalClientSig) {
        finalClientSig = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      }
      if (!finalMechSig) {
        finalMechSig = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      }
    }

    // 1. Persist the edited client fields back to state
    const currentClient = clients.find(c => c.id === selectedClientId);
    if (currentClient) {
      updateClient({
        ...currentClient,
        calle: orderClientCalle,
        cp: orderClientCp,
        colonia: orderClientColonia,
        alcaldia: orderClientAlcaldia,
        telFijo: orderClientTelFijo,
        email: orderClientEmail,
        phone: orderClientPhone,
        hasWhatsapp: clientHasWhatsapp,
        address: `${orderClientCalle}, Col. ${orderClientColonia}, ${orderClientAlcaldia}, C.P. ${orderClientCp}`
      });
    }

    // 2. Persist the edited vehicle fields back to state
    const currentVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (currentVehicle) {
      updateVehicle({
        ...currentVehicle,
        motor: orderVehMotor,
        serie: orderVehSerie,
        color: orderVehColor,
        mileage: orderVehMileage,
        brand: orderVehBrand,
        model: orderVehModel,
        year: orderVehYear,
        plate: orderVehPlate
      });
    }

    const assignedAdvisor = employees.find(e => e.role === 'Asesor' && e.active);
    const assignedMechanic = employees.find(e => e.id === orderTecnicoId) || employees.find(e => e.role === 'Mecanico' && e.active);

    const finalFolio = orderFolio || `${380 + orders.length + 1}A`;

    const created = createServiceOrder({
      clientId: selectedClientId,
      vehicleId: selectedVehicleId,
      advisorId: assignedAdvisor?.id || 'emp-1',
      mechanicId: assignedMechanic?.id || 'emp-2',
      reportedFailure,
      checklist,
      diagnostics: '',
      diagnosticPhotos: [],
      status: 'Diagnostico',
      dateOpened: `${orderFecha} ${orderHora}:00`,
      folio: finalFolio,
      fecha: orderFecha,
      hora: orderHora,
      tecnico: assignedMechanic?.name || 'Técnico de Guardia',
      clientSignature: finalClientSig,
      mechanicSignature: finalMechSig
    });

    const freshClient = {
      ...(currentClient || { id: selectedClientId, name: 'Cliente', creditBalance: 0, creditLimit: 0 }),
      calle: orderClientCalle,
      cp: orderClientCp,
      colonia: orderClientColonia,
      alcaldia: orderClientAlcaldia,
      telFijo: orderClientTelFijo,
      email: orderClientEmail,
      phone: orderClientPhone,
      hasWhatsapp: clientHasWhatsapp,
      address: `${orderClientCalle}, Col. ${orderClientColonia}, ${orderClientAlcaldia}, C.P. ${orderClientCp}`
    };

    const freshVehicle = {
      ...(currentVehicle || { id: selectedVehicleId, brand: '', model: '', year: 2020, plate: '', ownerId: selectedClientId || '', vin: '', engomadoColor: 'blue' as const, plateEnding: '0' }),
      motor: orderVehMotor,
      serie: orderVehSerie,
      color: orderVehColor,
      mileage: orderVehMileage,
      brand: orderVehBrand,
      model: orderVehModel,
      year: orderVehYear,
      plate: orderVehPlate
    };

    // Populate Success Modal states
    setSuccessOrderId(created.id);
    setSuccessOrderFolio(finalFolio);
    setSuccessClientPhone(orderClientPhone);
    setSuccessClientHasWhatsapp(clientHasWhatsapp);
    setSuccessOrder(created);
    setSuccessClient(freshClient);
    setSuccessVehicle(freshVehicle);
    setShowSaveSuccessModal(true);

    setTimeout(() => {
      generateSaePdf(created, freshClient, freshVehicle, employees);
    }, 200);

    // Reset fields & Signatures
    setReportedFailure('');
    setOrderFolio('');
    setClientSignature(undefined);
    setMechanicSignature(undefined);
    setChecklist({
      scratches: false,
      dents: false,
      fuelLevel: 50,
      tools: true,
      spareTire: true,
      jack: true,
      extinguisher: false,
      photos: [],
      tapetes: true,
      encendedor: true,
      estereo: true,
      tarjetaCirculacion: true,
      compVerificacion: false,
      polizaSeguro: false,
      segurosRuedas: false,
      gato: true,
      herramienta: true,
      extintor: false,
      llantaRefaccion: true,
      sensoresPresencia: false,
      camaraReversa: false,
      inspeccionMotor: 'Inspección visual conforme a protocolo',
      objetosValor: 'Ninguno'
    });
  };

  const handleAddClientForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;
    const added = addClient({
      name: newClientName,
      phone: newClientPhone,
      email: newClientEmail,
      address: newClientAddress,
      creditLimit: newClientCreditLimit
    });
    setSelectedClientId(added.id);
    setShowAddClient(false);
    // Clear
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientAddress('');
  };

  const handleAddVehicleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Debe tener un cliente seleccionado para asociarle el auto.');
      return;
    }
    if (!newVehBrand || !newVehModel || !newVehPlate) return;
    const added = addVehicle({
      ownerId: selectedClientId,
      brand: newVehBrand,
      model: newVehModel,
      year: newVehYear,
      plate: newVehPlate,
      vin: newVehVin,
      mileage: newVehMileage,
      color: newVehColor,
      engomadoColor: newVehEngomado,
      plateEnding: newVehPlateEnding
    });
    setSelectedVehicleId(added.id);
    setShowAddVehicle(false);
    // Clear
    setNewVehBrand('');
    setNewVehModel('');
    setNewVehPlate('');
    setNewVehVin('');
    setNewVehMileage(0);
    setNewVehColor('');
  };

  // Budget calculations
  const getOrderSubtotal = (order: ServiceOrder) => {
    return order.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  };
  const getOrderTax = (order: ServiceOrder) => {
    return getOrderSubtotal(order) * (16 / 100); // 16% IVA Mexico
  };
  const getOrderTotal = (order: ServiceOrder) => {
    return getOrderSubtotal(order) + getOrderTax(order);
  };
  const getOrderAmountPaid = (order: ServiceOrder) => {
    return order.payments.reduce((sum, p) => sum + p.amount, 0);
  };
  const getOrderBalance = (order: ServiceOrder) => {
    return getOrderTotal(order) - getOrderAmountPaid(order);
  };

  const handleAddItemToQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuoteOrder || !newItemDesc || newItemPrice <= 0) return;
    addOrderItem(activeQuoteOrder.id, {
      type: newItemType,
      description: newItemDesc,
      qty: newItemQty,
      unitPrice: newItemPrice
    });
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPlate || !bookingPurpose) return;
    const newBook = {
      id: `bk-${Date.now()}`,
      date: bookingDate,
      time: bookingTime,
      vehiclePlate: bookingPlate,
      bay: bookingBay,
      mechanicId: bookingMech,
      purpose: bookingPurpose
    };
    setAgenda(prev => [...prev, newBook]);
    setBookingPlate('');
    setBookingPurpose('');
    alert('Cita de mantenimiento y bahía de trabajo agendada con éxito.');
  };

  // Filter clients/vehicles
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  );

  const clientVehicles = vehicles.filter(v => v.ownerId === selectedClientId);

  return (
    <div id="advisor-dashboard-container" className="space-y-6 pb-28 md:pb-32">
      {/* Tab Menu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        {/* Mobile/Tablet Dropdown Select */}
        <div className="block lg:hidden w-full">
          <label htmlFor="advisor-mobile-tab-select" className="block text-xs font-bold text-slate-500 mb-1">Módulo de Asesor / Recepción</label>
          <select
            id="advisor-mobile-tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as 'reception' | 'quotes' | 'agenda' | 'crm')}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8D6A28]"
          >
            <option value="reception">🚗 Recepción y Órdenes</option>
            <option value="quotes">💵 Cotizaciones y Cobros</option>
            <option value="agenda">📅 Agenda y Bahías</option>
            <option value="crm">🕒 CRM Clínico del Auto</option>
          </select>
        </div>

        {/* Desktop Horizontal Tabs Menu */}
        <div className="hidden lg:flex gap-2">
          <button
            id="advisor-tab-reception"
            onClick={() => setActiveTab('reception')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'reception'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Car size={16} />
            Recepción y Órdenes
          </button>
          <button
            id="advisor-tab-quotes"
            onClick={() => setActiveTab('quotes')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'quotes'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText size={16} />
            Cotizaciones y Cobros
          </button>
          <button
            id="advisor-tab-agenda"
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'agenda'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar size={16} />
            Agenda y Bahías
          </button>
          <button
            id="advisor-tab-crm"
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'crm'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History size={16} />
            CRM Clínico del Auto
          </button>
        </div>
      </div>

      {/* RECEPTION & CHECK-IN TAB */}
      {activeTab === 'reception' && (
        <div className="space-y-6">
          {/* TOP BAR: SELECT CLIENT & VEHICLE SEARCH */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* SELECT CLIENT */}
              <div className="space-y-3">
                <h5 className="font-bold text-amber-500 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} />
                  1. Buscar o Crear Cliente
                </h5>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar cliente por nombre o teléfono..."
                    className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                </div>

                {/* Clients scrollable list */}
                <div className="border border-slate-800 bg-slate-950 rounded-xl max-h-[120px] overflow-y-auto text-xs divide-y divide-slate-900">
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setSelectedVehicleId('');
                      }}
                      className={`w-full text-left p-2.5 hover:bg-slate-900/50 transition-colors flex items-center justify-between ${
                        selectedClientId === c.id ? 'bg-amber-950/20 text-white' : 'text-slate-400'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{c.name}</p>
                        <p className="text-[10px] text-slate-500">{c.phone} • {c.email}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-600" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddClient(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all border border-dashed border-amber-500/20"
                >
                  <UserPlus size={13} />
                  Registrar Nuevo Cliente
                </button>
              </div>

              {/* SELECT VEHICLE */}
              <div className="space-y-3">
                <h5 className="font-bold text-amber-500 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Car size={14} />
                  2. Vehículo del Cliente
                </h5>
                {selectedClientId ? (
                  <div className="space-y-3">
                    {clientVehicles.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <p className="text-xs text-slate-500 italic">El cliente seleccionado no tiene autos vinculados.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[120px] overflow-y-auto">
                        {clientVehicles.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVehicleId(v.id)}
                            className={`text-left p-2.5 border rounded-xl text-xs hover:bg-slate-900/50 transition-all ${
                              selectedVehicleId === v.id 
                                ? 'border-amber-500 bg-amber-500/10 text-white' 
                                : 'border-slate-800 bg-slate-950 text-slate-400'
                            }`}
                          >
                            <p className="font-bold">{v.brand} {v.model} ({v.year})</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Placa: {v.plate} • Kilómetros: {v.mileage.toLocaleString()}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddVehicle(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-all border border-dashed border-amber-500/20"
                    >
                      <Plus size={13} />
                      Asociar Nuevo Vehículo
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800 text-center flex flex-col items-center justify-center">
                    <Car className="text-slate-700 w-8 h-8 mb-2" />
                    <p className="text-xs text-slate-500">Selecciona primero un cliente para ver o agregar vehículos.</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ACTIVE FORM OR PLACEHOLDER */}
          {selectedClientId && selectedVehicleId ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
              
              {/* Header Bar representing Physical Sheet */}
              <div className="bg-slate-100 border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">ORDEN DE RECEPCIÓN DIGITAL - SAE</h3>
                  <p className="text-xs text-slate-500">Captura la información oficial para el Formato Especializado SAE</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">FOLIO ORDEN</label>
                    <input
                      type="text"
                      placeholder="Autogenerado"
                      value={orderFolio}
                      onChange={(e) => setOrderFolio(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 text-center w-28 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded px-3 py-2 text-center shrink-0">
                    <p className="text-[9px] font-bold tracking-wider uppercase leading-none">FORMATO</p>
                    <p className="text-sm font-black mt-0.5">SAE-2026</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
                
                {/* METADATA BLOCK: FECHA, HORA, TECNICO */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={orderFecha}
                      onChange={(e) => setOrderFecha(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Hora de Ingreso</label>
                    <input
                      type="time"
                      value={orderHora}
                      onChange={(e) => setOrderHora(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Mecánico Asignado</label>
                    <select
                      value={orderTecnicoId}
                      onChange={(e) => setOrderTecnicoId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">Seleccione Técnico...</option>
                      {employees.filter(emp => emp.role === 'Mecanico').map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 1. SECCIÓN CLIENTE */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-amber-500 rounded"></span>
                    I. Información del Cliente / Propietario
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="md:col-span-3">
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        disabled
                        value={clients.find(c => c.id === selectedClientId)?.name || ''}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Calle y Número</label>
                      <input
                        type="text"
                        value={orderClientCalle}
                        onChange={(e) => setOrderClientCalle(e.target.value)}
                        placeholder="Ej. Av. Patriotismo 120"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Colonia</label>
                      <input
                        type="text"
                        value={orderClientColonia}
                        onChange={(e) => setOrderClientColonia(e.target.value)}
                        placeholder="Ej. San Juan"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Alcaldía o Delegación</label>
                      <input
                        type="text"
                        value={orderClientAlcaldia}
                        onChange={(e) => setOrderClientAlcaldia(e.target.value)}
                        placeholder="Ej. Benito Juárez"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Código Postal (C.P.)</label>
                      <input
                        type="text"
                        value={orderClientCp}
                        onChange={(e) => setOrderClientCp(e.target.value)}
                        placeholder="Ej. 03710"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Teléfono Fijo / Casa</label>
                      <input
                        type="text"
                        value={orderClientTelFijo}
                        onChange={(e) => setOrderClientTelFijo(e.target.value)}
                        placeholder="Ej. 55-1234-5678"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Celular / WhatsApp</label>
                      <input
                        type="text"
                        value={orderClientPhone}
                        onChange={(e) => setOrderClientPhone(e.target.value)}
                        placeholder="Ej. 55-9876-5432"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={orderClientEmail}
                        onChange={(e) => setOrderClientEmail(e.target.value)}
                        placeholder="Ej. cliente@dominio.com"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="md:col-span-3 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="client-has-whatsapp"
                        checked={clientHasWhatsapp}
                        onChange={(e) => setClientHasWhatsapp(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <label htmlFor="client-has-whatsapp" className="text-xs font-bold text-slate-400 cursor-pointer flex items-center gap-1.5 select-none">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                        ¿El cliente cuenta con WhatsApp activo? (Para envío automático de la Orden de Entrada)
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. SECCIÓN VEHÍCULO */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-amber-500 rounded"></span>
                    II. Identificación Técnica del Automóvil
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Marca</label>
                      <input
                        type="text"
                        value={orderVehBrand}
                        onChange={(e) => setOrderVehBrand(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Modelo</label>
                      <input
                        type="text"
                        value={orderVehModel}
                        onChange={(e) => setOrderVehModel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Año</label>
                      <input
                        type="number"
                        value={orderVehYear}
                        onChange={(e) => setOrderVehYear(parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Color</label>
                      <input
                        type="text"
                        value={orderVehColor}
                        onChange={(e) => setOrderVehColor(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Placas</label>
                      <input
                        type="text"
                        value={orderVehPlate}
                        onChange={(e) => setOrderVehPlate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Kilometraje Actual</label>
                      <input
                        type="number"
                        value={orderVehMileage}
                        onChange={(e) => setOrderVehMileage(parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Número de Serie (VIN)</label>
                      <input
                        type="text"
                        value={orderVehSerie}
                        onChange={(e) => setOrderVehSerie(e.target.value)}
                        placeholder="17 dígitos"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Número de Motor</label>
                      <input
                        type="text"
                        value={orderVehMotor}
                        onChange={(e) => setOrderVehMotor(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SECCIÓN CHECKLIST FÍSICO */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-amber-500 rounded"></span>
                      III. Inventario Físico y Accesorios de Cabina
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold italic font-mono">* 13 PUNTOS CONTROL</span>
                  </h4>
                  
                  {/* Accessories grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    
                    {[
                      { key: 'tapetes', label: 'Tapetes' },
                      { key: 'encendedor', label: 'Encendedor' },
                      { key: 'estereo', label: 'Estéreo / Bocinas' },
                      { key: 'tarjetaCirculacion', label: 'Tarjeta Circulación' },
                      { key: 'compVerificacion', label: 'Comp. Verificación' },
                      { key: 'polizaSeguro', label: 'Póliza Seguro' },
                      { key: 'segurosRuedas', label: 'Seguros Ruedas' },
                      { key: 'gato', label: 'Gato Mecánico' },
                      { key: 'herramienta', label: 'Herramientas básicas' },
                      { key: 'extintor', label: 'Extintor' },
                      { key: 'llantaRefaccion', label: 'Llanta Refacción' },
                      { key: 'sensoresPresencia', label: 'Sensores de Presencia' },
                      { key: 'camaraReversa', label: 'Cámara de Reversa' },
                    ].map((item) => {
                      const val = (checklist as any)[item.key] || false;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !val }))}
                          className={`flex items-center justify-between p-2.5 border rounded-xl font-bold text-xs transition-all ${
                            val 
                              ? 'bg-amber-50 border-amber-300 text-slate-850' 
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            val ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 text-transparent'
                          }`}>
                            <Check size={10} strokeWidth={3} />
                          </div>
                        </button>
                      );
                    })}

                  </div>

                  {/* Gas & Body Layout Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    
                    {/* Fuel Level */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 md:col-span-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nivel Combustible</span>
                        </div>
                        <span className="font-bold text-slate-800 text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                          {checklist.fuelLevel}%
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-center py-2">
                        <svg className="w-36 h-18 overflow-visible" viewBox="0 0 100 50">
                          <path d="M 15,45 A 35,35 0 0,1 85,45" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                          <path d="M 15,45 A 35,35 0 0,1 85,45" fill="none" stroke="#f59e0b" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(checklist.fuelLevel / 100) * 110} 110`} />
                          <circle cx="50" cy="45" r="3" fill="#334155" />
                          <line x1="50" y1="45" x2={50 + 26 * Math.cos((-180 + (checklist.fuelLevel / 100) * 180) * Math.PI / 180)} y2={45 + 26 * Math.sin((-180 + (checklist.fuelLevel / 100) * 180) * Math.PI / 180)} stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="25"
                          value={checklist.fuelLevel}
                          onChange={(e) => setChecklist(prev => ({ ...prev, fuelLevel: parseInt(e.target.value) }))}
                          className="w-full mt-3 accent-amber-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between w-full text-[8px] font-bold text-slate-400 mt-1 font-mono">
                          <span>VACÍO</span>
                          <span>1/2</span>
                          <span>LLENO</span>
                        </div>
                      </div>
                    </div>

                    {/* Damage Body toggles */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 md:col-span-1">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Daños de Carrocería</span>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setChecklist(prev => ({ ...prev, scratches: !prev.scratches }))}
                          className={`w-full flex items-center justify-between p-2.5 border rounded-xl text-xs font-bold transition-all ${
                            checklist.scratches ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          <span>Rayones / Raspaduras</span>
                          <span>{checklist.scratches ? 'SI ✔' : 'NO'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setChecklist(prev => ({ ...prev, dents: !prev.dents }))}
                          className={`w-full flex items-center justify-between p-2.5 border rounded-xl text-xs font-bold transition-all ${
                            checklist.dents ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          <span>Golpes / Abolladuras</span>
                          <span>{checklist.dents ? 'SI ✔' : 'NO'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Photo uploaders */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 md:col-span-1">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Registro de Evidencia Visual</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={startCamera} className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1">
                          <Camera size={12} className="text-amber-500" />
                          <span>Cámara</span>
                        </button>
                        <label htmlFor="camera-capture-input-integrated" className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-center">
                          <Upload size={12} />
                          <span>Móvil / Subir</span>
                          <input type="file" accept="image/*" capture="environment" multiple onChange={handleFileChange} className="hidden" id="camera-capture-input-integrated" />
                        </label>
                      </div>
                      
                      {checklist.photos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1 max-h-[50px] overflow-y-auto">
                          {checklist.photos.map((photo, index) => (
                            <img key={index} src={photo} className="w-full h-8 object-cover rounded border" referrerPolicy="no-referrer" />
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic text-center py-1">Sin fotos asignadas</p>
                      )}
                    </div>

                  </div>

                  {/* Motor Visual & Valuables input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Estado de Motor (Inspección Visual)</label>
                      <input
                        type="text"
                        value={checklist.inspeccionMotor || ''}
                        onChange={(e) => setChecklist(prev => ({ ...prev, inspeccionMotor: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Ej. Motor sucio, bayoneta de aceite correcta, mangueras intactas"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Objetos de Valor Declarados en Cabina</label>
                      <input
                        type="text"
                        value={checklist.objetosValor || ''}
                        onChange={(e) => setChecklist(prev => ({ ...prev, objetosValor: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Ej. Ninguno, herramientas de sonido, silla para bebé"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. FALLA REPORTADA */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-amber-500 rounded"></span>
                    IV. Falla Reportada por el Cliente / Diagnóstico Solicitado
                  </h4>
                  
                  <div>
                    <textarea
                      required
                      value={reportedFailure}
                      onChange={(e) => setReportedFailure(e.target.value)}
                      placeholder="Favor de detallar con precisión los síntomas, ruidos o trabajos específicos que el cliente solicita realizar. Esta información se imprimirá formalmente..."
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs h-28 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* 5. CONDICIONES DE SERVICIO (THE 10 CONDITIONS FROM THE PHYSICAL IMAGE) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-amber-500 rounded"></span>
                    V. Condiciones Generales del Contrato de Adhesión (SAE Oficial)
                  </h4>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-[160px] overflow-y-auto text-[10px] text-slate-500 space-y-2.5 leading-relaxed font-sans">
                    <p><strong>1. RECEPCIÓN Y PRUEBAS:</strong> El taller recibe el vehículo únicamente para fines de diagnóstico y presupuesto. El cliente autoriza expresamente el traslado de la unidad para pruebas de vialidad bajo su propio riesgo.</p>
                    <p><strong>2. DIAGNÓSTICOS Y DESARMADO:</strong> Determinar fallas complejas puede implicar desarmes parciales de componentes. Los diagnósticos tienen una vigencia estricta de 5 días naturales tras su emisión oficial.</p>
                    <p><strong>3. AUTORIZACIÓN POR ESCRITO:</strong> Ninguna labor de reparación física comenzará hasta contar con la validación explícita (física o electrónica) y firma del presupuesto oficial por parte del cliente.</p>
                    <p><strong>4. REFACCIONES Y RESIDUOS:</strong> Toda pieza reemplazada será entregada al propietario de la unidad al finalizar, exceptuando refacciones de desecho biológico o aquellas reguladas bajo estatutos de garantía federal.</p>
                    <p><strong>5. GASTOS DE ALMACENAJE:</strong> Transcurridas 48 horas hábiles después del aviso formal de entrega, si la unidad no es recogida, se devengará una penalización diaria de mora por almacenaje de $150.00 MXN.</p>
                    <p><strong>6. GARANTÍA ESCRITA:</strong> Toda labor mecánica de reparación mecánica avalada goza de una garantía de 30 días o 1,000 km, lo que ocurra primero, respaldando piezas instaladas y mano de obra específica.</p>
                    <p><strong>7. FORMAS DE LIQUIDACIÓN:</strong> La entrega física de la unidad está condicionada al pago total e irrevocable del saldo por los métodos aprobados (efectivo, transferencia o cargo con tarjeta de crédito/débito).</p>
                    <p><strong>8. PERTENENCIAS Y VALORES:</strong> El cliente declara bajo protesta de decir verdad que ha retirado todo objeto de alto valor económico o personal. El establecimiento no asume responsabilidad sobre artículos no declarados en el inventario.</p>
                    <p><strong>9. INSPECCIÓN MECÁNICA PREVIA:</strong> La firma de este documento ratifica la descripción visual asentada por el asesor del taller, liberando a la administración de averías previas ocultas en sistemas integrados.</p>
                    <p><strong>10. ACUERDO JURISDICCIONAL:</strong> Para la interpretación de este contrato de adhesión, ambas partes acuerdan someterse expresamente a las autoridades correspondientes y tribunales civiles competentes de la Ciudad de México.</p>
                  </div>

                  {/* VI. SIGNATURES SECTION (MANDATORY) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-amber-500 rounded"></span>
                      VI. Firmas Electrónicas de Conformidad (Obligatorias)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4">
                        <SignaturePad 
                          id="client-sig"
                          label="Firma del Cliente (Conformidad de Ingreso y Condiciones)"
                          placeholder="Dibuje o escriba su firma aquí"
                          onSave={(sig) => setClientSignature(sig)}
                        />
                        <p className="text-[10px] text-slate-500 mt-2 italic">Acepta términos de revisión y desarmado de diagnóstico.</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4">
                        <SignaturePad 
                          id="mechanic-sig"
                          label="Firma del Asesor / Empresa"
                          placeholder="Dibuje o escriba su firma aquí"
                          onSave={(sig) => setMechanicSignature(sig)}
                        />
                        <p className="text-[10px] text-slate-500 mt-2 italic">Recibe e inspecciona el auto de acuerdo al inventario.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-amber-50/50 p-3 rounded-xl border border-amber-200 text-xs">
                    <input
                      type="checkbox"
                      required
                      id="accept-conditions"
                      className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="accept-conditions" className="font-bold text-slate-800 cursor-pointer">
                      Acepto las Condiciones de Servicio y ratifico la firma electrónica del cliente para dar inicio al diagnóstico.
                    </label>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black py-4 px-6 rounded-xl shadow-lg hover:shadow-amber-600/10 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Send size={16} />
                    Registrar Entrada y Descargar Orden PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger a quick layout simulation
                      const dummyOrder: ServiceOrder = {
                        id: 'NUEVA',
                        clientId: selectedClientId,
                        vehicleId: selectedVehicleId,
                        advisorId: 'emp-1',
                        mechanicId: orderTecnicoId || 'emp-2',
                        reportedFailure,
                        checklist,
                        diagnostics: '',
                        diagnosticPhotos: [],
                        status: 'Diagnostico',
                        dateOpened: `${orderFecha} ${orderHora}:00`,
                        folio: orderFolio || 'PREV-01',
                        fecha: orderFecha,
                        hora: orderHora,
                        tecnico: employees.find(e => e.id === orderTecnicoId)?.name || 'Técnico de Guardia',
                        items: [],
                        timeLogs: [],
                        payments: [],
                        isClockedIn: false,
                        isPaused: false,
                        totalHoursWorked: 0,
                        clientSignature,
                        mechanicSignature
                      };
                      const clientObj = clients.find(c => c.id === selectedClientId)!;
                      const updatedClientObj = {
                        ...clientObj,
                        calle: orderClientCalle,
                        cp: orderClientCp,
                        colonia: orderClientColonia,
                        alcaldia: orderClientAlcaldia,
                        telFijo: orderClientTelFijo,
                        email: orderClientEmail,
                        phone: orderClientPhone
                      };
                      const vehObj = vehicles.find(v => v.id === selectedVehicleId)!;
                      const updatedVehObj = {
                        ...vehObj,
                        motor: orderVehMotor,
                        serie: orderVehSerie,
                        color: orderVehColor,
                        mileage: orderVehMileage,
                        brand: orderVehBrand,
                        model: orderVehModel,
                        year: orderVehYear,
                        plate: orderVehPlate
                      };
                      generateSaePdf(dummyOrder, updatedClientObj, updatedVehObj, employees);
                    }}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    Vista Previa PDF
                  </button>
                </div>

              </form>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 animate-bounce">
                <Sparkle size={32} />
              </div>
              <h3 className="text-white font-bold text-lg font-display">Sistema Digitalizador de Recepción SAE</h3>
              <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
                Para iniciar el proceso, selecciona un cliente y vincula su vehículo en la barra superior. 
                El sistema cargará la hoja de entrada homologada con las condiciones del servicio oficial.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ADD CLIENT FORM MODAL */}
          {showAddClient && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800">Dar de Alta Nuevo Cliente</h4>
                  <button onClick={() => setShowAddClient(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleAddClientForm} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Nombre Completo</label>
                    <input type="text" required value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Ej. Juan de la Barrera" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Celular / WhatsApp</label>
                      <input type="tel" required value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="55-1234-5678" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Email</label>
                      <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="ejemplo@correo.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Dirección</label>
                    <input type="text" value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Calle, Colonia, CDMX" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Límite de Crédito ($ MXN)</label>
                    <input type="number" value={newClientCreditLimit} onChange={(e) => setNewClientCreditLimit(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-slate-200 rounded-lg" />
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => setShowAddClient(false)} className="px-3 py-1.5 text-slate-600">Cancelar</button>
                    <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-lg shadow-sm">Registrar Cliente</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADD VEHICLE FORM MODAL */}
          {showAddVehicle && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 font-display">Asociar Vehículo al Cliente</h4>
                  <button onClick={() => setShowAddVehicle(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleAddVehicleForm} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Marca</label>
                      <input type="text" required value={newVehBrand} onChange={(e) => setNewVehBrand(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Volkswagen" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Modelo</label>
                      <input type="text" required value={newVehModel} onChange={(e) => setNewVehModel(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Jetta" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Año</label>
                      <input type="number" required value={newVehYear} onChange={(e) => setNewVehYear(parseInt(e.target.value) || 2020)} className="w-full p-2 border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Placas</label>
                      <input type="text" required value={newVehPlate} onChange={(e) => setNewVehPlate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg uppercase" placeholder="931-WYZ" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">VIN / Número de Serie</label>
                      <input type="text" value={newVehVin} onChange={(e) => setNewVehVin(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg uppercase" placeholder="17 caracteres" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Kilometraje</label>
                      <input type="number" value={newVehMileage} onChange={(e) => setNewVehMileage(parseInt(e.target.value) || 0)} className="w-full p-2 border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Color de Pintura</label>
                      <input type="text" value={newVehColor} onChange={(e) => setNewVehColor(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Rojo, Azul, Gris" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Engomado CDMX</label>
                      <select value={newVehEngomado} onChange={(e) => setNewVehEngomado(e.target.value as any)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                        <option value="pink">Rosa (Terminación 7 y 8)</option>
                        <option value="yellow">Amarillo (Terminación 5 y 6)</option>
                        <option value="red">Rojo (Terminación 3 y 4)</option>
                        <option value="green">Verde (Terminación 1 y 2)</option>
                        <option value="blue">Azul (Terminación 9 y 0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Último Dígito de Placa</label>
                      <select value={newVehPlateEnding} onChange={(e) => setNewVehPlateEnding(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <option key={i} value={i.toString()}>{i}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => setShowAddVehicle(false)} className="px-3 py-1.5 text-slate-600">Cancelar</button>
                    <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg shadow-sm">Registrar Auto</button>
                  </div>
                </form>
              </div>
            </div>
          )}

      {/* ESTIMATES & PRESUPUESTOS TAB */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          {/* PRESUPUESTOS MODULE SUB-NAVIGATION */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPresupuestoSubTab('formulario')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  presupuestoSubTab === 'formulario'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plus size={15} />
                <span>Formulario Presupuesto (Hoja SAE)</span>
              </button>

              <button
                type="button"
                onClick={() => setPresupuestoSubTab('historial')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  presupuestoSubTab === 'historial'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History size={15} />
                <span>Historial de Registros ({presupuestos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPresupuestoSubTab('ordenes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  presupuestoSubTab === 'ordenes'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText size={15} />
                <span>Cotización por Órdenes Activas</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              Módulo Oficial Presupuestos SAE • Hoja de Cotizaciones
            </div>
          </div>

          {/* SUCCESS MESSAGE BANNER */}
          {presSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
              <Check size={18} className="text-emerald-600 shrink-0" />
              <span>{presSuccessMessage}</span>
            </div>
          )}

          {/* SUB-TAB 1: FORMULARIO REGISTRO PRESUPUESTO */}
          {presupuestoSubTab === 'formulario' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
              {/* TOP ACTIONS & PRESET LOADER BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-md">
                <div>
                  <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                    <FileText className="text-amber-500" size={20} />
                    {editingPresupuestoId ? `Editando Presupuesto #${presNumero}` : 'Registrar Nuevo Presupuesto de Servicio'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Captura los datos del cliente, vehículo y desglose de refacciones o reparaciones.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleAutoFillPresupuestoFromSelection}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <User size={14} className="text-amber-400" />
                    <span>Cargar de Cliente/Auto Seleccionado</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSamplePresupuestoPaperData}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>Ejemplo Muestra Hoja SAE (Folio 202)</span>
                  </button>

                  {editingPresupuestoId && (
                    <button
                      type="button"
                      onClick={handleResetPresupuestoForm}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </div>

              {/* FORMULARIO PRESUPUESTO */}
              <form onSubmit={handleSavePresupuesto} className="space-y-6">
                {/* SELECTOR INTERACTIVO DE CLIENTE Y VEHÍCULO */}
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700/80 space-y-3 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Search size={14} className="text-amber-400" />
                      Seleccionar Cliente Registrado (Muestra Automáticamente sus Datos y Vehículos)
                    </label>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/30">
                      {clients.length} clientes en base de datos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-zinc-300 font-bold mb-1 uppercase tracking-wider">Cliente Registrado</label>
                      <select
                        value={selectedClientForPresupuesto?.id || ''}
                        onChange={(e) => {
                          const found = clients.find(c => c.id === e.target.value);
                          if (found) {
                            selectClientForPresupuesto(found);
                          } else {
                            setSelectedClientForPresupuesto(null);
                            setSelectedVehicleForPresupuesto(null);
                          }
                        }}
                        className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="">-- Buscar o seleccionar cliente registrado --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-300 font-bold mb-1 uppercase tracking-wider">Vehículo del Cliente</label>
                      <select
                        value={selectedVehicleForPresupuesto?.id || ''}
                        onChange={(e) => {
                          const found = vehicles.find(v => v.id === e.target.value);
                          if (found) {
                            selectVehicleForPresupuesto(found);
                          } else {
                            setSelectedVehicleForPresupuesto(null);
                          }
                        }}
                        disabled={!selectedClientForPresupuesto}
                        className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-zinc-900/60 disabled:text-zinc-500 disabled:border-zinc-800"
                      >
                        {!selectedClientForPresupuesto ? (
                          <option value="">-- Primero selecciona un cliente arriba --</option>
                        ) : (
                          <>
                            <option value="">-- Seleccionar vehículo de {selectedClientForPresupuesto.name} ({vehicles.filter(v => v.ownerId === selectedClientForPresupuesto.id || (v as any).clientId === selectedClientForPresupuesto.id).length}) --</option>
                            {vehicles.filter(v => v.ownerId === selectedClientForPresupuesto.id || (v as any).clientId === selectedClientForPresupuesto.id).map(v => (
                              <option key={v.id} value={v.id}>
                                {v.brand} {v.model} ({v.year}) - Placa: {v.plate || 'S/P'} | VIN: {v.vin || v.serie || 'S/N'}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* CABECERA FOLIO, FECHA & ASESOR */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Folio del Presupuesto #</label>
                    <input
                      type="text"
                      required
                      value={presNumero}
                      onChange={(e) => setPresNumero(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-amber-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Fecha de Registro</label>
                    <input
                      type="text"
                      required
                      value={presFecha}
                      onChange={(e) => setPresFecha(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Asesor / Atendido Por</label>
                    <input
                      type="text"
                      required
                      value={presAsesor}
                      onChange={(e) => setPresAsesor(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                    />
                  </div>
                </div>

                {/* DATOS DEL CLIENTE Y VEHÍCULO (2 COLUMNAS COMPACTAS) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SECCIÓN CLIENTE */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-1.5 text-amber-800">
                      <User size={14} /> Datos del Cliente
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-slate-500 font-medium mb-0.5">Nombre / Razón Social *</label>
                        <input
                          type="text"
                          required
                          value={presClienteNombre}
                          onChange={(e) => setPresClienteNombre(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50"
                          placeholder="Ej. Congregación de la misión"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-0.5">Calle y Número</label>
                        <input
                          type="text"
                          value={presClienteCalle}
                          onChange={(e) => setPresClienteCalle(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50"
                          placeholder="Ej. Av.San Fernando #154"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-500 font-medium mb-0.5">C.P. y Colonia</label>
                          <input
                            type="text"
                            value={presClienteCpColonia}
                            onChange={(e) => setPresClienteCpColonia(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50"
                            placeholder="14000 Tlalpan Centro"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-0.5">Alcaldía / Municipio</label>
                          <input
                            type="text"
                            value={presClienteAlcaldia}
                            onChange={(e) => setPresClienteAlcaldia(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50"
                            placeholder="Tlalpan"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-0.5">Teléfono de Contacto</label>
                        <input
                          type="text"
                          value={presClienteTelefono}
                          onChange={(e) => setPresClienteTelefono(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50"
                          placeholder="Ej. 73 5266 8332"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN VEHÍCULO */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-1.5 text-indigo-800">
                      <Car size={14} /> Datos del Vehículo
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-slate-500 font-medium mb-0.5">Marca / Motor</label>
                        <input
                          type="text"
                          value={presMarcaMotor}
                          onChange={(e) => setPresMarcaMotor(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50"
                          placeholder="Ej. FORD-RANGER / 2.3L"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-0.5">Modelo / Color</label>
                        <input
                          type="text"
                          value={presModeloColor}
                          onChange={(e) => setPresModeloColor(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50"
                          placeholder="Ej. 2012 / BLANCO"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-500 font-medium mb-0.5">Matrícula (Placas) / VIN</label>
                          <input
                            type="text"
                            value={presMatriculaVin}
                            onChange={(e) => setPresMatriculaVin(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 font-mono"
                            placeholder="865-XXJ"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium mb-0.5">Kilometraje (KM)</label>
                          <input
                            type="number"
                            value={presKilometros}
                            onChange={(e) => setPresKilometros(parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 font-mono"
                            placeholder="161282"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DESGLOSE DE CONCEPTOS / TABLA PRESUPUESTO */}
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm font-display">
                      Desglose de Conceptos, Refacciones y Mano de Obra
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddPresupuestoItem}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Plus size={14} />
                      <span>Agregar Partida</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                          <th className="p-2.5 w-24">Código</th>
                          <th className="p-2.5 min-w-[280px]">Descripción / Repuesto</th>
                          <th className="p-2.5 w-20 text-center">Cantidad</th>
                          <th className="p-2.5 w-32 text-right">Imp. Unitario ($)</th>
                          <th className="p-2.5 w-32 text-right">Total ($)</th>
                          <th className="p-2.5 w-12 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {presItems.map((item) => (
                          <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.codigo || ''}
                                onChange={(e) => handleUpdatePresupuestoItem(item.id, 'codigo', e.target.value)}
                                className="w-full p-1.5 border border-slate-200 rounded bg-white font-mono text-center text-xs"
                                placeholder="Cód"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.descripcion}
                                onChange={(e) => handleUpdatePresupuestoItem(item.id, 'descripcion', e.target.value)}
                                className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs"
                                placeholder="Descripción del trabajo o refacción..."
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => handleUpdatePresupuestoItem(item.id, 'cantidad', e.target.value)}
                                className="w-full p-1.5 border border-slate-200 rounded bg-white text-center font-bold text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                value={item.importeUnitario || ''}
                                onChange={(e) => handleUpdatePresupuestoItem(item.id, 'importeUnitario', e.target.value)}
                                className="w-full p-1.5 border border-slate-200 rounded bg-white text-right font-mono text-xs"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-800 text-xs">
                              ${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePresupuestoItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar partida"
                              >
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TOTALES Y CONDICIONES GENERALES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                  {/* CONDICIONES */}
                  <div className="space-y-3 text-xs">
                    <h5 className="font-bold text-slate-800 uppercase tracking-wide">Condiciones del Presupuesto</h5>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Forma de Pago</label>
                        <select
                          value={presFormaPago}
                          onChange={(e) => setPresFormaPago(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold"
                        >
                          <option value="CONTADO">CONTADO</option>
                          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                          <option value="TARJETA">TARJETA</option>
                          <option value="CREDITO">CRÉDITO TALLER</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Validez (Días)</label>
                        <input
                          type="number"
                          value={presValidezDias}
                          onChange={(e) => setPresValidezDias(parseInt(e.target.value) || 12)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Días Entrega</label>
                        <input
                          type="number"
                          value={presDiasEntrega}
                          onChange={(e) => setPresDiasEntrega(parseInt(e.target.value) || 3)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-center font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Notas / Leyenda Legal de Cierre</label>
                      <textarea
                        rows={2}
                        value={presNotas}
                        onChange={(e) => setPresNotas(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white text-[11px] text-slate-600"
                      />
                    </div>
                  </div>

                  {/* GRAN TOTAL BOX */}
                  <div className="flex flex-col justify-between items-end bg-white p-6 rounded-xl border border-amber-300/80 shadow-sm space-y-4">
                    <div className="text-right w-full space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total del Presupuesto</span>
                      <div className="text-3xl sm:text-4xl font-extrabold text-amber-700 font-mono tracking-tight">
                        ${presTotalCalculated.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">MXN</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Total calculado de {presItems.length} partidas registradas.</p>
                    </div>

                    {/* BOTONES PRINCIPALES DE ACCIÓN */}
                    <div className="flex flex-wrap items-center gap-2 justify-end w-full border-t border-slate-100 pt-4">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Check size={16} />
                        <span>{editingPresupuestoId ? 'Guardar Cambios' : 'Guardar en Historial'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const pObj: Presupuesto = {
                            id: editingPresupuestoId || 'temp',
                            numero: presNumero,
                            fecha: presFecha,
                            asesor: presAsesor,
                            clienteNombre: presClienteNombre,
                            clienteCalle: presClienteCalle,
                            clienteCpColonia: presClienteCpColonia,
                            clienteAlcaldia: presClienteAlcaldia,
                            clienteTelefono: presClienteTelefono,
                            marcaMotor: presMarcaMotor,
                            modeloColor: presModeloColor,
                            matriculaVin: presMatriculaVin,
                            kilometros: presKilometros,
                            items: presItems,
                            formaPago: presFormaPago,
                            total: presTotalCalculated,
                            validezDias: presValidezDias,
                            diasEntrega: presDiasEntrega,
                            notas: presNotas,
                            createdAt: new Date().toISOString(),
                            status: 'Enviado'
                          };
                          downloadSaePresupuestoPdf(pObj);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Printer size={16} />
                        <span>Imprimir / PDF SAE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const pObj: Presupuesto = {
                            id: editingPresupuestoId || 'temp',
                            numero: presNumero,
                            fecha: presFecha,
                            asesor: presAsesor,
                            clienteNombre: presClienteNombre,
                            clienteCalle: presClienteCalle,
                            clienteCpColonia: presClienteCpColonia,
                            clienteAlcaldia: presClienteAlcaldia,
                            clienteTelefono: presClienteTelefono,
                            marcaMotor: presMarcaMotor,
                            modeloColor: presModeloColor,
                            matriculaVin: presMatriculaVin,
                            kilometros: presKilometros,
                            items: presItems,
                            formaPago: presFormaPago,
                            total: presTotalCalculated,
                            validezDias: presValidezDias,
                            diasEntrega: presDiasEntrega,
                            notas: presNotas,
                            createdAt: new Date().toISOString(),
                            status: 'Enviado'
                          };
                          handleSendPresupuestoWhatsApp(pObj);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Send size={16} />
                        <span>Enviar por WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* SUB-TAB 2: HISTORIAL DE REGISTROS DE PRESUPUESTOS */}
          {presupuestoSubTab === 'historial' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-6">
              {/* TOP HEADER & SEARCH */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                    <History size={20} className="text-amber-600" />
                    Historial de Registros de Presupuestos ({presupuestos.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Consulta, imprime, comparte en WhatsApp o convierte presupuestos anteriores en órdenes de servicio activas.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={presSearchQuery}
                    onChange={(e) => setPresSearchQuery(e.target.value)}
                    placeholder="Buscar folio, cliente, placas..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* LISTA / CARDS DE PRESUPUESTOS */}
              <div className="space-y-4">
                {presupuestos.filter(p => {
                  if (!presSearchQuery.trim()) return true;
                  const q = presSearchQuery.toLowerCase();
                  return (
                    p.numero.toLowerCase().includes(q) ||
                    p.clienteNombre.toLowerCase().includes(q) ||
                    p.marcaMotor.toLowerCase().includes(q) ||
                    p.matriculaVin.toLowerCase().includes(q)
                  );
                }).length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-12 text-center text-slate-400 border border-dashed border-slate-200 space-y-2">
                    <FileText size={48} className="mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600 text-sm">No se encontraron presupuestos registrados</p>
                    <p className="text-xs text-slate-400">Intenta cambiar el término de búsqueda o crea uno nuevo en la pestaña de Formulario.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presupuestos
                      .filter(p => {
                        if (!presSearchQuery.trim()) return true;
                        const q = presSearchQuery.toLowerCase();
                        return (
                          p.numero.toLowerCase().includes(q) ||
                          p.clienteNombre.toLowerCase().includes(q) ||
                          p.marcaMotor.toLowerCase().includes(q) ||
                          p.matriculaVin.toLowerCase().includes(q)
                        );
                      })
                      .map((p) => (
                        <div
                          key={p.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                              <div>
                                <span className="font-mono bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-xs">
                                  Folio #{p.numero}
                                </span>
                                <span className="text-[11px] text-slate-400 block mt-1">{p.fecha}</span>
                              </div>
                              <span className="text-lg font-bold text-slate-800 font-mono">
                                ${p.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="text-xs space-y-1">
                              <p className="font-bold text-slate-800">{p.clienteNombre}</p>
                              <p className="text-slate-500 font-mono text-[11px]">{p.clienteTelefono}</p>
                              <p className="text-slate-600 text-[11px] border-t border-slate-100 pt-1 mt-1">
                                🚗 {p.marcaMotor} • <span className="font-mono font-bold text-slate-700">{p.matriculaVin}</span>
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Conceptos: <strong>{p.items?.length || 0} partidas</strong> | Pago: <strong>{p.formaPago}</strong>
                              </p>
                            </div>
                          </div>

                          {/* ACCIONES DEL PRESUPUESTO */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 text-xs">
                            <button
                              type="button"
                              onClick={() => handleEditPresupuestoFromList(p)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                              title="Editar / Cargar en Formulario"
                            >
                              <Edit2 size={13} />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadSaePresupuestoPdf(p)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 p-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                              title="Descargar o Imprimir PDF SAE"
                            >
                              <Printer size={13} />
                              <span>PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendPresupuestoWhatsApp(p)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 p-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px]"
                              title="Enviar por WhatsApp"
                            >
                              <Send size={13} />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (convertPresupuestoToOrder) {
                                  const newOrd = convertPresupuestoToOrder(p.id);
                                  if (newOrd) {
                                    setPresSuccessMessage(`🎉 ¡Presupuesto #${p.numero} convertido a Orden de Trabajo #${newOrd.id}!`);
                                    setTimeout(() => setPresSuccessMessage(null), 4000);
                                  }
                                }
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-[11px] ml-auto"
                              title="Convertir este presupuesto a una Orden de Trabajo en proceso"
                            >
                              <RefreshCw size={13} />
                              <span>Convertir a Orden</span>
                            </button>

                            {deletePresupuesto && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar el presupuesto folio #${p.numero}?`)) {
                                    deletePresupuesto(p.id);
                                  }
                                }}
                                className="text-red-400 hover:text-red-600 p-2 rounded-lg transition-colors"
                                title="Eliminar del historial"
                              >
                                <Trash size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: COTIZACIÓN POR ÓRDENES ACTIVAS (EXISTENTE) */}
          {presupuestoSubTab === 'ordenes' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Orders List Sidebar */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 font-display">
                  Órdenes de Trabajo Activas
                </h4>
                <div className="space-y-2 max-h-[380px] overflow-y-auto">
                  {orders.map((o) => {
                    const client = clients.find(c => c.id === o.clientId);
                    const vehicle = vehicles.find(v => v.id === o.vehicleId);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(o.id);
                          setPaymentAmount(0);
                        }}
                        className={`w-full text-left p-3 border rounded-xl text-xs transition-all ${
                          selectedOrderId === o.id 
                            ? 'border-amber-500 bg-amber-50/50 shadow-sm font-semibold' 
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{o.id}</span>
                          <span className="text-[10px] text-slate-400">{o.dateOpened.split(' ')[0]}</span>
                        </div>
                        <p className="text-slate-800 font-bold">{client?.name}</p>
                        <p className="text-slate-500">{vehicle?.brand} {vehicle?.model} • Placa: {vehicle?.plate}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Estatus: <strong className="text-slate-600">{o.status.replace('_', ' ')}</strong>
                          </span>
                          <span className="font-bold text-indigo-600">${Math.round(getOrderTotal(o)).toLocaleString()} MXN</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QUOTE WORKSPACE / DETAILS */}
              {activeQuoteOrder ? (
                <div className="lg:col-span-2 space-y-6">
                  {/* Order Overview Header */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 font-display">
                          Detalle de Orden: {activeQuoteOrder.id}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Cliente: <strong>{clients.find(c => c.id === activeQuoteOrder.clientId)?.name}</strong> • Auto: <strong>{vehicles.find(v => v.id === activeQuoteOrder.vehicleId)?.brand} {vehicles.find(v => v.id === activeQuoteOrder.vehicleId)?.model}</strong>
                        </p>
                      </div>
                      <div>
                        <select
                          value={activeQuoteOrder.status}
                          onChange={(e) => updateOrderStatus(activeQuoteOrder.id, e.target.value as any)}
                          className="p-2 border border-amber-300 rounded-lg bg-amber-50 font-bold text-xs text-amber-800 focus:outline-amber-500"
                        >
                          <option value="Diagnostico">Fase: En Diagnóstico</option>
                          <option value="Esperando_Refacciones">Fase: Esperando Refacciones</option>
                          <option value="En_Reparacion">Fase: En Reparación</option>
                          <option value="Control_Calidad">Fase: Control de Calidad</option>
                          <option value="Listo_Entrega">Fase: Listo para Entrega</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-xs space-y-2">
                      <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong className="text-slate-600 block mb-1">Motivo de Ingreso:</strong>
                        {activeQuoteOrder.reportedFailure}
                      </p>
                      {activeQuoteOrder.diagnostics && (
                        <p className="bg-amber-50 p-2.5 rounded-lg border border-amber-100 text-slate-800">
                          <strong className="text-amber-700 block mb-1">Diagnóstico Técnico:</strong>
                          {activeQuoteOrder.diagnostics}
                        </p>
                      )}
                    </div>

                    {/* Simulated Digital Link Send */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const clientObj = clients.find(c => c.id === activeQuoteOrder.clientId);
                          const rawPhone = (clientObj?.phone || '').replace(/\D/g, '');
                          const phone = rawPhone.length === 10 ? `52${rawPhone}` : rawPhone;
                          const msg = `*SERVICIO AUTOMOTRIZ ESPECIALIZADO (SAE)*\nHola *${clientObj?.name}*, adjuntamos el seguimiento y cotización de tu Orden #${activeQuoteOrder.id}.\nTotal Cotizado: *$${Math.round(getOrderTotal(activeQuoteOrder)).toLocaleString()} MXN*`;
                          const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                          window.open(url, '_blank');
                        }}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        <Send size={12} />
                        Compartir por WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* BUDGET / ITEMS BUILDER */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-800 font-display">Desglose de Cotización</h4>

                    {/* Add item to quote form */}
                    <form onSubmit={handleAddItemToQuote} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Tipo</label>
                        <select
                          value={newItemType}
                          onChange={(e) => setNewItemType(e.target.value as any)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="refaccion">Refacción</option>
                          <option value="mano_de_obra">Mano Obra</option>
                        </select>
                      </div>
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Descripción de Partida</label>
                        <input
                          type="text"
                          required
                          value={newItemDesc}
                          onChange={(e) => setNewItemDesc(e.target.value)}
                          placeholder="Ej. Cambio de Aceite Sintético..."
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div className="sm:col-span-1.5">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Cant.</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Precio Unitario ($)</label>
                        <input
                          type="number"
                          required
                          value={newItemPrice || ''}
                          onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                          placeholder="Ej. 1200"
                        />
                      </div>
                      <div className="sm:col-span-1.5 flex items-end">
                        <button
                          type="submit"
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg transition-colors flex justify-center cursor-pointer"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </form>

                    {/* Items list */}
                    <div className="overflow-x-auto text-xs pt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <th className="p-2">Tipo</th>
                            <th className="p-2">Descripción</th>
                            <th className="p-2 text-center">Cant.</th>
                            <th className="p-2 text-right">Unitario</th>
                            <th className="p-2 text-right">Subtotal</th>
                            <th className="p-2 text-center">Aprobación Cliente</th>
                            <th className="p-2 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeQuoteOrder.items.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center p-6 text-slate-500 italic">No hay partidas agregadas al presupuesto.</td>
                            </tr>
                          ) : (
                            activeQuoteOrder.items.map((item) => (
                              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="p-2">
                                  <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                    item.type === 'refaccion' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {item.type === 'refaccion' ? 'Part' : 'M.Obra'}
                                  </span>
                                </td>
                                <td className="p-2 text-slate-700 font-medium">{item.description}</td>
                                <td className="p-2 text-center font-mono">{item.qty}</td>
                                <td className="p-2 text-right font-mono">${item.unitPrice.toLocaleString()}</td>
                                <td className="p-2 text-right font-mono font-bold">${(item.qty * item.unitPrice).toLocaleString()}</td>
                                <td className="p-2 text-center">
                                  {item.approved === null && (
                                    <div className="flex gap-1 justify-center">
                                      <button
                                        type="button"
                                        onClick={() => approveBudgetLine(activeQuoteOrder.id, item.id, true)}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                        title="Aprobar en nombre del cliente"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => approveBudgetLine(activeQuoteOrder.id, item.id, false)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        title="Rechazar"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  )}
                                  {item.approved === true && (
                                    <span className="inline-block px-1.5 py-0.5 font-bold text-[9px] bg-emerald-100 text-emerald-800 rounded">APROBADO</span>
                                  )}
                                  {item.approved === false && (
                                    <span className="inline-block px-1.5 py-0.5 font-bold text-[9px] bg-red-100 text-red-800 rounded">RECHAZADO</span>
                                  )}
                                </td>
                                <td className="p-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => deleteOrderItem(activeQuoteOrder.id, item.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                      {/* Payments Registration form */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-3">
                        <h5 className="font-bold text-slate-800">Registrar Cobro / Abono</h5>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Monto a pagar</label>
                            <input
                              type="number"
                              value={paymentAmount || ''}
                              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                              className="w-full p-1.5 border border-slate-200 rounded-lg bg-white"
                              placeholder="Monto"
                              max={getOrderBalance(activeQuoteOrder)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Forma de Pago</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as any)}
                              className="w-full p-1.5 border border-slate-200 rounded-lg bg-white"
                            >
                              <option value="Efectivo">Efectivo</option>
                              <option value="Tarjeta">Tarjeta Bancaria</option>
                              <option value="Transferencia">Transferencia</option>
                              <option value="Credito">Crédito Taller</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={paymentAmount <= 0}
                          onClick={() => {
                            registerOrderPayment(activeQuoteOrder.id, paymentAmount, paymentMethod);
                            setPaymentAmount(0);
                            alert(`¡Cobro registrado por $${paymentAmount} MXN vía ${paymentMethod}!`);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg disabled:opacity-40 cursor-pointer"
                        >
                          Confirmar Cobro
                        </button>
                      </div>

                      {/* Pricing Sheet totals */}
                      <div className="space-y-1.5 text-right font-mono self-end">
                        <p className="text-slate-500">Subtotal: <strong className="text-slate-700">${getOrderSubtotal(activeQuoteOrder).toLocaleString()}</strong></p>
                        <p className="text-slate-500">IVA (16%): <strong className="text-slate-700">${Math.round(getOrderTax(activeQuoteOrder)).toLocaleString()}</strong></p>
                        <p className="text-lg font-bold text-slate-800 border-t border-slate-100 pt-1">
                          Total: <span className="text-indigo-600">${Math.round(getOrderTotal(activeQuoteOrder)).toLocaleString()} MXN</span>
                        </p>
                        <div className="bg-emerald-50 text-emerald-800 p-2 rounded-lg text-xs mt-2 border border-emerald-100 space-y-1 text-left">
                          <p className="flex justify-between font-bold"><span>Total Pagado:</span> <span>${getOrderAmountPaid(activeQuoteOrder).toLocaleString()}</span></p>
                          <p className="flex justify-between font-bold text-red-700"><span>Saldo Restante:</span> <span>${Math.round(getOrderBalance(activeQuoteOrder)).toLocaleString()}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col justify-center items-center">
                  <FileText size={48} className="text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-500">Selecciona una orden de la lista para ver su presupuesto.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ÓRDENES DE REPARACIÓN TAB */}
      {activeTab === 'ordenes_reparacion' && (
        <div className="space-y-6">
          {/* SUB-NAVIGATION BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOrdenSubTab('formulario')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  ordenSubTab === 'formulario'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plus size={15} />
                <span>Formulario Órden de Reparación</span>
              </button>

              <button
                type="button"
                onClick={() => setOrdenSubTab('historial')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  ordenSubTab === 'historial'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History size={15} />
                <span>Historial de Órdenes ({ordenesReparacion.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              Módulo Oficial Órdenes de Reparación SAE • Hoja de Trabajo
            </div>
          </div>

          {/* SUCCESS MESSAGE BANNER */}
          {ordSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
              <Check size={18} className="text-emerald-600 shrink-0" />
              <span>{ordSuccessMessage}</span>
            </div>
          )}

          {/* SUB-TAB 1: FORMULARIO ÓRDEN DE REPARACIÓN */}
          {ordenSubTab === 'formulario' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
              {/* HEADER ACTIONS BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-md">
                <div>
                  <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                    <ClipboardList className="text-amber-500" size={20} />
                    {editingOrdenId ? `Editando Órden de Reparación #${ordNumero}` : 'Nueva Órden de Reparación'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Registra la información completa del cliente, vehículo, revisiones generales y trabajos requeridos.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleLoadSampleOrdenPaperData}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Ejemplo Muestra Hoja SAE (Folio 180)</span>
                  </button>

                  {editingOrdenId && (
                    <button
                      type="button"
                      onClick={handleResetOrdenForm}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </div>

              {/* FORMULARIO */}
              <form onSubmit={handleSaveOrdenReparacion} className="space-y-6">
                {/* SELECTOR INTERACTIVO DE CLIENTE Y VEHÍCULO */}
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700/80 space-y-3 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Search size={14} className="text-amber-400" />
                      Seleccionar Cliente Registrado (Muestra Automáticamente sus Datos y Vehículos)
                    </label>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/30">
                      {clients.length} clientes en base de datos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-zinc-300 font-bold mb-1 uppercase tracking-wider">Cliente Registrado</label>
                      <select
                        value={selectedClientForOrden?.id || ''}
                        onChange={(e) => {
                          const found = clients.find(c => c.id === e.target.value);
                          if (found) {
                            selectClientForOrden(found);
                          } else {
                            setSelectedClientForOrden(null);
                            setSelectedVehicleForOrden(null);
                          }
                        }}
                        className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="">-- Buscar o seleccionar cliente registrado --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-300 font-bold mb-1 uppercase tracking-wider">Vehículo del Cliente</label>
                      <select
                        value={selectedVehicleForOrden?.id || ''}
                        onChange={(e) => {
                          const found = vehicles.find(v => v.id === e.target.value);
                          if (found) {
                            selectVehicleForOrden(found);
                          } else {
                            setSelectedVehicleForOrden(null);
                          }
                        }}
                        disabled={!selectedClientForOrden}
                        className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-zinc-900/60 disabled:text-zinc-500 disabled:border-zinc-800"
                      >
                        {!selectedClientForOrden ? (
                          <option value="">-- Primero selecciona un cliente arriba --</option>
                        ) : (
                          <>
                            <option value="">-- Seleccionar vehículo de {selectedClientForOrden.name} ({vehicles.filter(v => v.ownerId === selectedClientForOrden.id || (v as any).clientId === selectedClientForOrden.id).length}) --</option>
                            {vehicles.filter(v => v.ownerId === selectedClientForOrden.id || (v as any).clientId === selectedClientForOrden.id).map(v => (
                              <option key={v.id} value={v.id}>
                                {v.brand} {v.model} ({v.year}) - Placa: {v.plate || 'S/P'} | VIN: {v.vin || v.serie || 'S/N'}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* RED WARNING NOTICE BOX MATCHING PAPER FORM */}
                <div className="bg-red-50 border-2 border-red-600 rounded-xl p-3 text-red-700 text-xs font-bold leading-relaxed shadow-sm uppercase">
                  ⚠️ RECUERDA QUE LAS REFACCIONES QUE SE UTILICEN DEBEN SER ANOTADAS AL REVERZO DE LA HOJA, LAS QUE SE COMPRARON Y LAS QUE SE EXTRAJERON DEL ALMACEN.
                </div>

                {/* METADATA HEADERS */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Órden Número #</label>
                    <input
                      type="text"
                      required
                      value={ordNumero}
                      onChange={(e) => setOrdNumero(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-red-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Fecha</label>
                    <input
                      type="date"
                      required
                      value={ordFecha}
                      onChange={(e) => setOrdFecha(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Atención Personal (Asesor)</label>
                    <input
                      type="text"
                      required
                      value={ordAsesor}
                      onChange={(e) => setOrdAsesor(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Técnico Asignado</label>
                    <input
                      type="text"
                      required
                      value={ordTecnico}
                      onChange={(e) => setOrdTecnico(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* CLIENT & VEHICLE SECTION GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CLIENT INFO */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2">
                      Información del Cliente
                    </h4>

                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Nombre / Empresa</label>
                      <input
                        type="text"
                        required
                        value={ordClienteNombre}
                        onChange={(e) => setOrdClienteNombre(e.target.value)}
                        placeholder="Ej. Congregación de la misión"
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Calle y Número</label>
                        <input
                          type="text"
                          value={ordClienteCalle}
                          onChange={(e) => setOrdClienteCalle(e.target.value)}
                          placeholder="Av. San Fernando #154"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">C.P. / Colonia</label>
                        <input
                          type="text"
                          value={ordClienteCpColonia}
                          onChange={(e) => setOrdClienteCpColonia(e.target.value)}
                          placeholder="14000 Tlalpan Centro"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Alcaldía / Municipio</label>
                        <input
                          type="text"
                          value={ordClienteAlcaldia}
                          onChange={(e) => setOrdClienteAlcaldia(e.target.value)}
                          placeholder="Tlalpan"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={ordClienteTelefono}
                          onChange={(e) => setOrdClienteTelefono(e.target.value)}
                          placeholder="73 5266 8332"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* VEHICLE INFO */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2">
                      Información del Vehículo
                    </h4>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Marca / Motor</label>
                        <input
                          type="text"
                          value={ordMarcaMotor}
                          onChange={(e) => setOrdMarcaMotor(e.target.value)}
                          placeholder="FORD-RANGER / 2.3L"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Modelo / Color</label>
                        <input
                          type="text"
                          value={ordModeloColor}
                          onChange={(e) => setOrdModeloColor(e.target.value)}
                          placeholder="2012 / BLANCO"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Matrícula / VIN</label>
                        <input
                          type="text"
                          value={ordMatriculaVin}
                          onChange={(e) => setOrdMatriculaVin(e.target.value)}
                          placeholder="865-XXJ / 8AFER5AD8C6453240"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono font-bold text-red-700 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">Kilómetros</label>
                        <input
                          type="number"
                          value={ordKilometros || ''}
                          onChange={(e) => setOrdKilometros(parseFloat(e.target.value) || 0)}
                          placeholder="161282"
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* QUALITY REVISIONS SECTION */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2">
                    Controles de Calidad y Revision General
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Rotación y Presión de Aire a Llantas</label>
                      <input
                        type="text"
                        value={ordRotacionAireLlantas}
                        onChange={(e) => setOrdRotacionAireLlantas(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Rev. Limpia Parabrisas y Chisgueteros</label>
                      <input
                        type="text"
                        value={ordRevLimpiaParabrisas}
                        onChange={(e) => setOrdRevLimpiaParabrisas(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Rev. de Luces y Niveles en General</label>
                      <input
                        type="text"
                        value={ordRevLucesNivelesEngral}
                        onChange={(e) => setOrdRevLucesNivelesEngral(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* ITEMS TABLE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-800 text-sm font-display">
                      Desglose de Repuestos y Trabajos a Realizar
                    </h4>

                    <button
                      type="button"
                      onClick={handleAddOrdenItem}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Agregar Partida</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold">
                          <th className="p-2.5 w-32 border-r border-slate-700">Marca / Cód.</th>
                          <th className="p-2.5 border-r border-slate-700">Repuestos / Trabajos</th>
                          <th className="p-2.5 w-24 text-center border-r border-slate-700">Cant.</th>
                          <th className="p-2.5 w-16 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordItems.map((item, idx) => (
                          <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={item.codigo || ''}
                                onChange={(e) => handleUpdateOrdenItem(item.id, 'codigo', e.target.value)}
                                className="w-full p-1.5 border border-slate-200 rounded bg-white font-mono text-xs"
                                placeholder="Cód/Marca"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <input
                                type="text"
                                required
                                value={item.descripcion}
                                onChange={(e) => handleUpdateOrdenItem(item.id, 'descripcion', e.target.value)}
                                className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs"
                                placeholder="Descripción del trabajo o refacción..."
                              />
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.cantidad}
                                onChange={(e) => handleUpdateOrdenItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                                className="w-full p-1.5 border border-slate-200 rounded bg-white text-center font-bold text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveOrdenItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar partida"
                              >
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex flex-wrap items-center gap-3 justify-end border-t border-slate-200 pt-6">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Check size={16} />
                    <span>{editingOrdenId ? 'Guardar Cambios' : 'Guardar Órden de Reparación'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const tempOrd: OrdenReparacion = {
                        id: editingOrdenId || `ord-${Date.now()}`,
                        numero: ordNumero,
                        fecha: ordFecha,
                        asesor: ordAsesor,
                        tecnico: ordTecnico,
                        rotacionAireLlantas: ordRotacionAireLlantas,
                        revLimpiaParabrisas: ordRevLimpiaParabrisas,
                        revLucesNivelesEngral: ordRevLucesNivelesEngral,
                        clienteNombre: ordClienteNombre,
                        clienteCalle: ordClienteCalle,
                        clienteCpColonia: ordClienteCpColonia,
                        clienteAlcaldia: ordClienteAlcaldia,
                        clienteTelefono: ordClienteTelefono,
                        marcaMotor: ordMarcaMotor,
                        modeloColor: ordModeloColor,
                        matriculaVin: ordMatriculaVin,
                        kilometros: ordKilometros,
                        items: ordItems,
                        status: 'En Proceso',
                        createdAt: new Date().toISOString()
                      };
                      downloadSaeOrdenDeReparacionPdf(tempOrd);
                    }}
                    className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Download size={16} />
                    <span>Descargar PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const tempOrd: OrdenReparacion = {
                        id: editingOrdenId || `ord-${Date.now()}`,
                        numero: ordNumero,
                        fecha: ordFecha,
                        asesor: ordAsesor,
                        tecnico: ordTecnico,
                        rotacionAireLlantas: ordRotacionAireLlantas,
                        revLimpiaParabrisas: ordRevLimpiaParabrisas,
                        revLucesNivelesEngral: ordRevLucesNivelesEngral,
                        clienteNombre: ordClienteNombre,
                        clienteCalle: ordClienteCalle,
                        clienteCpColonia: ordClienteCpColonia,
                        clienteAlcaldia: ordClienteAlcaldia,
                        clienteTelefono: ordClienteTelefono,
                        marcaMotor: ordMarcaMotor,
                        modeloColor: ordModeloColor,
                        matriculaVin: ordMatriculaVin,
                        kilometros: ordKilometros,
                        items: ordItems,
                        status: 'En Proceso',
                        createdAt: new Date().toISOString()
                      };
                      handleSendOrdenWhatsApp(tempOrd);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Send size={16} />
                    <span>Enviar por WhatsApp</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUB-TAB 2: HISTORIAL DE ÓRDENES */}
          {ordenSubTab === 'historial' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base font-display flex items-center gap-2">
                    <History className="text-amber-600" size={20} />
                    Historial de Órdenes de Reparación Registradas
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Listado completo de órdenes de trabajo capturadas en el sistema.
                  </p>
                </div>

                {/* BUSCADOR */}
                <div className="relative min-w-[260px]">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={ordSearchQuery}
                    onChange={(e) => setOrdSearchQuery(e.target.value)}
                    placeholder="Buscar por cliente, folio o placas..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* TABLA DE HISTORIAL */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">Folio</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Vehículo</th>
                      <th className="p-3">Técnico</th>
                      <th className="p-3 text-center">Partidas</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesReparacion.filter(o => 
                      !ordSearchQuery ||
                      o.numero.toLowerCase().includes(ordSearchQuery.toLowerCase()) ||
                      o.clienteNombre.toLowerCase().includes(ordSearchQuery.toLowerCase()) ||
                      o.matriculaVin.toLowerCase().includes(ordSearchQuery.toLowerCase())
                    ).map((ord) => (
                      <tr key={ord.id} className="border-b border-slate-100 hover:bg-amber-50/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-red-700">#{ord.numero}</td>
                        <td className="p-3 text-slate-600">{ord.fecha}</td>
                        <td className="p-3 font-bold text-slate-800">{ord.clienteNombre}</td>
                        <td className="p-3 text-slate-600">{ord.marcaMotor} ({ord.matriculaVin})</td>
                        <td className="p-3 text-slate-600">{ord.tecnico}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{ord.items.length}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditOrdenFromList(ord)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar Órden"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadSaeOrdenDeReparacionPdf(ord)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Descargar PDF"
                            >
                              <Download size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendOrdenWhatsApp(ord)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Enviar por WhatsApp"
                            >
                              <Send size={15} />
                            </button>

                            {deleteOrdenReparacion && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar la Órden de Reparación #${ord.numero}?`)) {
                                    deleteOrdenReparacion(ord.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {ordenesReparacion.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No hay órdenes de reparación registradas aún. Registra una nueva usando el formulario arriba.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MÓDULO OFICIAL SALIDAS / PRESUPUESTOS Y NOTAS DE LIQUIDACIÓN SAE */}
      {activeTab === 'salidas' && (
        <div className="space-y-6">
          {/* BARRA DE NAVEGACIÓN SECUNDARIA / SUB-TABS */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSalidaSubTab('formulario')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  salidaSubTab === 'formulario'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plus size={15} />
                <span>Formulario Nota de Salida</span>
              </button>

              <button
                type="button"
                onClick={() => setSalidaSubTab('historial')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  salidaSubTab === 'historial'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History size={15} />
                <span>Historial de Salidas ({notasSalida.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSalidaSubTab('presupuestos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  salidaSubTab === 'presupuestos'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText size={15} />
                <span>Historial de Presupuestos ({presupuestos.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              Módulo Oficial de Salidas y Liquidación SAE • Hoja de Salida
            </div>
          </div>

          {/* BANNER DE MENSAJE DE ÉXITO */}
          {salSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
              <Check size={18} className="text-emerald-600 shrink-0" />
              <span>{salSuccessMessage}</span>
            </div>
          )}

          {/* SUB-TAB 1: FORMULARIO DE REGISTRO / EDICIÓN NOTA DE SALIDA */}
          {salidaSubTab === 'formulario' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
              {/* CABECERA CON ACCIONES RÁPIDAS Y CARGA DE MUESTRA */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-md">
                <div>
                  <h3 className="font-bold text-white text-base font-display flex items-center gap-2">
                    <LogOut className="text-amber-500" size={20} />
                    {editingSalidaId ? `Editando Nota de Salida #${salNumero}` : 'Registrar Nueva Nota de Salida / Liquidación'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Genera la Nota de Salida con datos del cliente, vehículo, liquidación de trabajos y garantía.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleLoadSampleSalidaPaperData}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Ejemplo Muestra Hoja SAE (Salida 187)</span>
                  </button>

                  {editingSalidaId && (
                    <button
                      type="button"
                      onClick={handleResetSalidaForm}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </div>

              {/* FORMULARIO NOTA DE SALIDA */}
              <form onSubmit={handleSaveNotaSalida} className="space-y-6">
                {/* SELECTOR INTERACTIVO DE CLIENTE Y VEHÍCULO PARA NOTA DE SALIDA */}
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700/80 space-y-3 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Search size={14} className="text-amber-400" />
                      Seleccionar Cliente Registrado (Muestra Automáticamente sus Datos y Vehículos)
                    </label>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/30">
                      {clients.length} clientes en base de datos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-zinc-300 font-bold mb-1 uppercase tracking-wider">Nombre del Cliente</label>
                      <select
                        value={selectedClientForSalida?.id || ''}
                        onChange={(e) => {
                          const found = clients.find(c => c.id === e.target.value);
                          if (found) {
                            selectClientForSalida(found);
                          } else {
                            setSelectedClientForSalida(null);
                            setSelectedVehicleForSalida(null);
                          }
                        }}
                        className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="">-- Buscar o seleccionar cliente registrado --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-300 font-bold mb-1 uppercase tracking-wider">Vehículo Asignado al Cliente</label>
                      <select
                        value={selectedVehicleForSalida?.id || ''}
                        onChange={(e) => {
                          const found = vehicles.find(v => v.id === e.target.value);
                          if (found) {
                            selectVehicleForSalida(found);
                          } else {
                            setSelectedVehicleForSalida(null);
                          }
                        }}
                        disabled={!selectedClientForSalida}
                        className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-zinc-900/60 disabled:text-zinc-500 disabled:border-zinc-800"
                      >
                        {!selectedClientForSalida ? (
                          <option value="">-- Primero selecciona un cliente arriba --</option>
                        ) : (
                          <>
                            <option value="">-- Seleccionar vehículo de {selectedClientForSalida.name} ({vehicles.filter(v => v.ownerId === selectedClientForSalida.id || (v as any).clientId === selectedClientForSalida.id).length}) --</option>
                            {vehicles.filter(v => v.ownerId === selectedClientForSalida.id || (v as any).clientId === selectedClientForSalida.id).map(v => (
                              <option key={v.id} value={v.id}>
                                {v.brand} {v.model} ({v.year}) - Placa: {v.plate || 'S/P'} | VIN: {v.vin || v.serie || 'S/N'}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* CABECERA FOLIO, FECHA, ASESOR Y ORDEN DE SERVICIO */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-xs shadow-md">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 uppercase tracking-wider text-[10px]">Nota de Salida #</label>
                    <input
                      type="text"
                      required
                      value={salNumero}
                      onChange={(e) => setSalNumero(e.target.value)}
                      className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 font-mono font-bold text-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 uppercase tracking-wider text-[10px]">Fecha de Emisión</label>
                    <input
                      type="text"
                      required
                      value={salFecha}
                      onChange={(e) => setSalFecha(e.target.value)}
                      className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 font-semibold text-white"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 uppercase tracking-wider text-[10px]">Asesor Responsable</label>
                    <input
                      type="text"
                      required
                      value={salAsesor}
                      onChange={(e) => setSalAsesor(e.target.value)}
                      className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 font-semibold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 uppercase tracking-wider text-[10px]">Orden de Servicio #</label>
                    <input
                      type="text"
                      value={salOrdenServicioNumero}
                      onChange={(e) => setSalOrdenServicioNumero(e.target.value)}
                      className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-950 font-mono font-bold text-amber-400"
                      placeholder="Ej. 378A"
                    />
                  </div>
                </div>

                {/* DATOS DEL CLIENTE Y VEHÍCULO (2 COLUMNAS) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CLIENTE */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-1.5 text-amber-800">
                      <User size={14} /> Datos del Cliente
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-slate-600 font-bold mb-0.5">Nombre / Razón Social *</label>
                        <input
                          type="text"
                          required
                          value={salClienteNombre}
                          onChange={(e) => setSalClienteNombre(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-medium"
                          placeholder="Ej. Congregación de la misión"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-0.5">Calle y Número</label>
                        <input
                          type="text"
                          value={salClienteCalle}
                          onChange={(e) => setSalClienteCalle(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-medium"
                          placeholder="Ej. Av.San Fernando #154"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-600 font-bold mb-0.5">C.P. y Colonia</label>
                          <input
                            type="text"
                            value={salClienteCpColonia}
                            onChange={(e) => setSalClienteCpColonia(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-medium"
                            placeholder="14000 Tlalpan Centro"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-0.5">Alcaldía / Municipio</label>
                          <input
                            type="text"
                            value={salClienteAlcaldia}
                            onChange={(e) => setSalClienteAlcaldia(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-medium"
                            placeholder="Tlalpan"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-0.5">Teléfono de Contacto</label>
                        <input
                          type="text"
                          value={salClienteTelefono}
                          onChange={(e) => setSalClienteTelefono(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-medium"
                          placeholder="Ej. 73 5266 8332"
                        />
                      </div>
                    </div>
                  </div>

                  {/* VEHÍCULO */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2 uppercase tracking-wide flex items-center gap-1.5 text-amber-800">
                      <Car size={14} /> Datos del Vehículo
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-slate-600 font-bold mb-0.5">Marca / Motor</label>
                        <input
                          type="text"
                          value={salMarcaMotor}
                          onChange={(e) => setSalMarcaMotor(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-medium"
                          placeholder="Ej. FORD-RANGER / 2.3L"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-0.5">Modelo / Color</label>
                        <input
                          type="text"
                          value={salModeloColor}
                          onChange={(e) => setSalModeloColor(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-medium"
                          placeholder="Ej. 2012 / BLANCO"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-0.5">Matrícula (Placas) / VIN (N° Serie)</label>
                        <input
                          type="text"
                          value={salMatriculaVin}
                          onChange={(e) => setSalMatriculaVin(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-mono font-medium"
                          placeholder="Ej. 865-XXJ / 8AFER5AD8C6453240"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-0.5">Kilometraje Actual (KM)</label>
                        <input
                          type="number"
                          value={salKilometros || ''}
                          onChange={(e) => setSalKilometros(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-mono font-bold"
                          placeholder="161282"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABLA DE PARTIDAS / TRABAJOS Y REFACCIONES */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 text-amber-800">
                      <ClipboardList size={16} /> Desglose de Partidas / Conceptos de Salida ({salItems.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddSalidaItem}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Agregar Concepto</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2.5 w-24">Código</th>
                          <th className="p-2.5">Descripción del Servicio / Refacción</th>
                          <th className="p-2.5 w-20 text-center">Cant.</th>
                          <th className="p-2.5 w-32 text-right">Importe Unit.</th>
                          <th className="p-2.5 w-36 text-right">Total</th>
                          <th className="p-2.5 w-12 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center p-6 text-slate-400 italic">
                              No hay conceptos agregados a esta nota de salida. Haz clic en "Agregar Concepto".
                            </td>
                          </tr>
                        ) : (
                          salItems.map((item, index) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-amber-50/30 transition-colors">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.codigo || ''}
                                  onChange={(e) => handleUpdateSalidaItem(item.id, 'codigo', e.target.value)}
                                  className="w-full p-1.5 border border-slate-200 rounded bg-white text-center font-mono text-xs font-bold"
                                  placeholder="0000"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.descripcion}
                                  onChange={(e) => handleUpdateSalidaItem(item.id, 'descripcion', e.target.value)}
                                  className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs font-medium text-slate-900"
                                  placeholder={`Concepto #${index + 1}`}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.cantidad}
                                  onChange={(e) => handleUpdateSalidaItem(item.id, 'cantidad', e.target.value)}
                                  className="w-full p-1.5 border border-slate-200 rounded bg-white text-center font-bold text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.importeUnitario || ''}
                                  onChange={(e) => handleUpdateSalidaItem(item.id, 'importeUnitario', e.target.value)}
                                  className="w-full p-1.5 border border-slate-200 rounded bg-white text-right font-mono text-xs"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900 text-xs">
                                ${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSalidaItem(item.id)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar concepto"
                                >
                                  <Trash size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CONDICIONES DE PAGO Y GARANTÍA + TOTAL */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
                  <div className="space-y-3 text-xs">
                    <h5 className="font-bold text-slate-800 uppercase tracking-wide">Condiciones de Entrega y Garantía</h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Forma de Pago</label>
                        <select
                          value={salFormaPago}
                          onChange={(e) => setSalFormaPago(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                        >
                          <option value="CONTADO">CONTADO</option>
                          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                          <option value="TARJETA">TARJETA</option>
                          <option value="CREDITO">CRÉDITO TALLER</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Póliza de Garantía</label>
                        <input
                          type="text"
                          value={salGarantia}
                          onChange={(e) => setSalGarantia(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                          placeholder="30 DIAS Ó 2,000 KMS..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* GRAN TOTAL */}
                  <div className="flex flex-col justify-between items-end bg-white p-6 rounded-xl border border-amber-300/80 shadow-sm space-y-4">
                    <div className="text-right w-full space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Liquidación / Salida</span>
                      <div className="text-3xl sm:text-4xl font-extrabold text-amber-700 font-mono tracking-tight">
                        ${salTotalCalculated.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">MXN</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Total calculado de {salItems.length} partidas registradas.</p>
                    </div>

                    {/* BOTONES PRINCIPALES DE ACCIÓN */}
                    <div className="flex flex-wrap items-center gap-2 justify-end w-full border-t border-slate-100 pt-4">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Check size={16} />
                        <span>{editingSalidaId ? 'Guardar Cambios' : 'Guardar en Historial'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nObj: NotaSalida = {
                            id: editingSalidaId || 'temp-sal',
                            numero: salNumero,
                            fecha: salFecha,
                            asesor: salAsesor,
                            clienteNombre: salClienteNombre,
                            clienteCalle: salClienteCalle,
                            clienteCpColonia: salClienteCpColonia,
                            clienteAlcaldia: salClienteAlcaldia,
                            clienteTelefono: salClienteTelefono,
                            marcaMotor: salMarcaMotor,
                            modeloColor: salModeloColor,
                            matriculaVin: salMatriculaVin,
                            kilometros: salKilometros,
                            formaPago: salFormaPago,
                            garantia: salGarantia,
                            ordenServicioNumero: salOrdenServicioNumero,
                            items: salItems,
                            total: salTotalCalculated,
                            createdAt: new Date().toISOString(),
                            status: 'Emitida'
                          };
                          downloadSaeNotaSalidaPdf(nObj);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Printer size={16} />
                        <span>Imprimir / PDF SAE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nObj: NotaSalida = {
                            id: editingSalidaId || 'temp-sal',
                            numero: salNumero,
                            fecha: salFecha,
                            asesor: salAsesor,
                            clienteNombre: salClienteNombre,
                            clienteCalle: salClienteCalle,
                            clienteCpColonia: salClienteCpColonia,
                            clienteAlcaldia: salClienteAlcaldia,
                            clienteTelefono: salClienteTelefono,
                            marcaMotor: salMarcaMotor,
                            modeloColor: salModeloColor,
                            matriculaVin: salMatriculaVin,
                            kilometros: salKilometros,
                            formaPago: salFormaPago,
                            garantia: salGarantia,
                            ordenServicioNumero: salOrdenServicioNumero,
                            items: salItems,
                            total: salTotalCalculated,
                            createdAt: new Date().toISOString(),
                            status: 'Emitida'
                          };
                          handleSendSalidaWhatsApp(nObj);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Send size={16} />
                        <span>Enviar por WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* SUB-TAB 2: HISTORIAL DE SALIDAS */}
          {salidaSubTab === 'historial' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base font-display flex items-center gap-2">
                    <History className="text-amber-600" size={20} />
                    Historial de Notas de Salida Registradas
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consultar notas de salida y comprobantes de liquidación emitidos.
                  </p>
                </div>

                {/* BUSCADOR */}
                <div className="relative min-w-[260px]">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={salSearchQuery}
                    onChange={(e) => setSalSearchQuery(e.target.value)}
                    placeholder="Buscar por cliente, folio o placas..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* TABLA DE SALIDAS */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">Folio Salida</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Vehículo</th>
                      <th className="p-3">Ord. Serv.</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasSalida.filter(n =>
                      !salSearchQuery ||
                      n.numero.toLowerCase().includes(salSearchQuery.toLowerCase()) ||
                      n.clienteNombre.toLowerCase().includes(salSearchQuery.toLowerCase()) ||
                      n.matriculaVin.toLowerCase().includes(salSearchQuery.toLowerCase())
                    ).map((nota) => (
                      <tr key={nota.id} className="border-b border-slate-100 hover:bg-amber-50/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-700">#{nota.numero}</td>
                        <td className="p-3 text-slate-600">{nota.fecha}</td>
                        <td className="p-3 font-bold text-slate-800">{nota.clienteNombre}</td>
                        <td className="p-3 text-slate-600">{nota.marcaMotor} ({nota.matriculaVin})</td>
                        <td className="p-3 text-slate-600 font-mono">#{nota.ordenServicioNumero || 'S/N'}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          ${nota.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditSalidaFromList(nota)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar Nota de Salida"
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadSaeNotaSalidaPdf(nota)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Descargar PDF"
                            >
                              <Download size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendSalidaWhatsApp(nota)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Enviar por WhatsApp"
                            >
                              <Send size={15} />
                            </button>

                            {deleteNotaSalida && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar la Nota de Salida #${nota.numero}?`)) {
                                    deleteNotaSalida(nota.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {notasSalida.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No hay notas de salida registradas aún. Registra una nueva usando el formulario.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: HISTORIAL DE PRESUPUESTOS (SECCIÓN REQUERIDA EN MÓDULO SALIDAS) */}
          {salidaSubTab === 'presupuestos' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base font-display flex items-center gap-2">
                    <FileText className="text-indigo-600" size={20} />
                    Historial de Presupuestos para Conversión a Nota de Salida
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selecciona un presupuesto registrado para convertirlo directamente en Nota de Salida o consultar su PDF.
                  </p>
                </div>
              </div>

              {/* TABLA DE PRESUPUESTOS DISPONIBLES */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">Folio Presupuesto</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Vehículo</th>
                      <th className="p-3 text-center">Partidas</th>
                      <th className="p-3 text-right">Total Presupuesto</th>
                      <th className="p-3 text-right">Acción / Cargar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuestos.map((pres) => (
                      <tr key={pres.id} className="border-b border-slate-100 hover:bg-indigo-50/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-700">#{pres.numero}</td>
                        <td className="p-3 text-slate-600">{pres.fecha}</td>
                        <td className="p-3 font-bold text-slate-800">{pres.clienteNombre}</td>
                        <td className="p-3 text-slate-600">{pres.marcaMotor} ({pres.matriculaVin})</td>
                        <td className="p-3 text-center font-bold text-slate-700">{pres.items.length}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          ${pres.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleConvertPresupuestoToSalida(pres)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Cargar este presupuesto en la Nota de Salida"
                            >
                              <Sparkles size={13} />
                              <span>Convertir a Salida</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadSaePresupuestoPdf(pres)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Ver PDF Presupuesto"
                            >
                              <Download size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {presupuestos.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No hay presupuestos registrados en el sistema aún.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AGENDA & WORKSHOP BAYS TAB */}
      {activeTab === 'agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scheduling form */}
          <form onSubmit={handleAddBooking} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 font-display">
              <Calendar size={18} className="text-amber-600" />
              Agendar Cita / Bahía
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Fecha</label>
                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Hora</label>
                <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-500 font-medium mb-1">Placas del Auto</label>
                <input type="text" required value={bookingPlate} onChange={(e) => setBookingPlate(e.target.value.toUpperCase())} className="w-full p-2 border border-slate-200 rounded-lg font-mono uppercase" placeholder="Ej. 931-WYZ" />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-500 font-medium mb-1">Asignar Bahía de Trabajo</label>
                <select value={bookingBay} onChange={(e) => setBookingBay(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                  <option value="Bahía 1 - Rampa">Bahía 1 - Rampa Elevadora 1</option>
                  <option value="Bahía 2 - Eléctrico">Bahía 2 - Escaneo y Eléctrico</option>
                  <option value="Bahía 3 - Suspensión">Bahía 3 - Suspensión y Frenos</option>
                  <option value="Bahía 4 - Detallado">Bahía 4 - Estética y Lavado</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-slate-500 font-medium mb-1">Mecánico Responsable</label>
                <select value={bookingMech} onChange={(e) => setBookingMech(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700">
                  {employees.filter(e => e.role === 'Mecanico').map(mech => (
                    <option key={mech.id} value={mech.id}>{mech.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-slate-500 font-medium mb-1">Servicio Solicitado</label>
                <input type="text" required value={bookingPurpose} onChange={(e) => setBookingPurpose(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Ej. Afinación Mayor..." />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 text-xs rounded-lg shadow-sm transition-all"
            >
              Agendar Cita
            </button>
          </form>

          {/* Interactive timeline map */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800">Calendario de Bahías y Citas ({bookingDate})</h4>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">4 Bahías de Trabajo</span>
            </div>

            <div className="space-y-4">
              {['Bahía 1 - Rampa', 'Bahía 2 - Eléctrico', 'Bahía 3 - Suspensión', 'Bahía 4 - Detallado'].map((bay) => {
                const bayBookings = agenda.filter(b => b.bay === bay);
                return (
                  <div key={bay} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                    <h5 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
                      <MapPin size={12} className="text-amber-500" />
                      {bay}
                    </h5>
                    
                    {bayBookings.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No hay servicios programados en esta bahía.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {bayBookings.map((bk) => {
                          const mech = employees.find(e => e.id === bk.mechanicId);
                          return (
                            <div key={bk.id} className="bg-white p-2.5 border border-slate-200 rounded-lg text-[11px] shadow-sm flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-amber-600 font-mono">{bk.time} Hrs</span>
                                  <span className="bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded font-semibold">{bk.vehiclePlate}</span>
                                </div>
                                <p className="font-semibold text-slate-800">{bk.purpose}</p>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1.5 border-t border-slate-50 pt-1">
                                Mecánico: <strong>{mech?.name || 'Asignando'}</strong>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CRM HISTORY TAB */}
      {activeTab === 'crm' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 font-display">Historial Clínico del Auto (CRM)</h4>
              <p className="text-xs text-slate-500">Expediente médico completo de reparaciones, notas de diagnóstico y piezas surtidas</p>
            </div>
            
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
                placeholder="Buscar por placa o marca..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-amber-500"
              />
              <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-6">
            {vehicles
              .filter(v => 
                v.plate.toLowerCase().includes(crmSearch.toLowerCase()) || 
                v.brand.toLowerCase().includes(crmSearch.toLowerCase()) ||
                v.model.toLowerCase().includes(crmSearch.toLowerCase())
              )
              .map((v) => {
                const owner = clients.find(c => c.id === v.ownerId);
                const vehicleHistory = orders.filter(o => o.vehicleId === v.id);

                return (
                  <div key={v.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <h5 className="font-bold text-sm text-slate-800">
                          {v.brand} {v.model} ({v.year}) - <span className="font-mono text-amber-600">{v.plate}</span>
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Propietario: <strong>{owner?.name}</strong> • Cel: {owner?.phone} • Email: {owner?.email}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-slate-500">Km Actual: <strong>{v.mileage.toLocaleString()} KM</strong></p>
                        <p className="text-slate-500">Engomado: <span className={`inline-block w-2.5 h-2.5 rounded-sm bg-${v.engomadoColor}-400 mr-1`}></span>{v.engomadoColor.toUpperCase()} (Dígito: {v.plateEnding})</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-700">Historial Clínico ({vehicleHistory.length} Órdenes de Servicio)</p>
                      {vehicleHistory.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay expedientes registrados previos.</p>
                      ) : (
                        <div className="space-y-3 pl-3 border-l-2 border-slate-200">
                          {vehicleHistory.map((o) => (
                            <div key={o.id} className="relative text-xs space-y-1">
                              {/* circular node */}
                              <div className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                              <div className="flex flex-wrap justify-between items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-amber-600 bg-amber-50 px-1.5 rounded">{o.id}</span>
                                  {o.folio && <span className="text-[10px] text-slate-500 font-sans">Folio: <strong>{o.folio}</strong></span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 font-normal mr-2">{o.dateOpened.split(' ')[0]}</span>
                                  
                                  {/* Download PDF button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const clientObj = clients.find(c => c.id === o.clientId);
                                      const vehObj = vehicles.find(v => v.id === o.vehicleId);
                                      generateSaePdf(o, clientObj, vehObj, employees);
                                    }}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-200 flex items-center gap-1 text-[10px] transition-colors"
                                    title="Descargar Orden de Entrada en PDF"
                                  >
                                    <Download size={10} />
                                    <span>Descargar PDF</span>
                                  </button>

                                  {/* WhatsApp button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const clientObj = clients.find(c => c.id === o.clientId);
                                      if (clientObj?.hasWhatsapp === false) {
                                        alert('Aviso: El cliente no cuenta con WhatsApp activo de acuerdo a su perfil registrado.');
                                      } else {
                                        const phone = clientObj?.phone || '';
                                        const msg = `Hola, te compartimos tu Orden de Entrada de SAE con el Folio: ${o.folio || o.id}. Estatus actual: En Diagnóstico. ¡La escudería que te lleva seguro a tu destino! 🚗🏁`;
                                        window.open(`https://api.whatsapp.com/send?phone=52${phone}&text=${encodeURIComponent(msg)}`, '_blank');
                                      }
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1 text-[10px] transition-colors"
                                    title="Enviar por WhatsApp"
                                  >
                                    <Send size={10} />
                                    <span>Enviar WhatsApp</span>
                                  </button>
                                </div>
                              </div>
                              <p className="text-slate-700"><strong>Falla reportada:</strong> {o.reportedFailure}</p>
                              {o.diagnostics && <p className="text-slate-600 bg-slate-50/50 p-1.5 rounded border border-slate-100"><strong>Diagnóstico:</strong> {o.diagnostics}</p>}
                              <p className="text-[11px] text-slate-500">
                                Reparación: {o.items.filter(item => item.approved).map(item => item.description).join(', ') || 'Sin partidas aprobadas.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {/* Live Camera Modal Overlay */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-amber-500 animate-pulse" />
                <h3 className="font-bold text-sm md:text-base font-display">Cámara de Auditoría en Vivo</h3>
              </div>
              <button 
                type="button" 
                onClick={stopCamera}
                className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video / Error view */}
            <div className="flex-1 bg-slate-950 flex flex-col justify-center items-center relative aspect-video min-h-[260px]">
              {cameraError ? (
                <div className="p-6 text-center text-rose-200 max-w-sm space-y-3">
                  <div className="w-12 h-12 bg-rose-500/15 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                    <AlertTriangle size={24} />
                  </div>
                  <p className="text-xs font-bold font-display">Error de Inicialización</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{cameraError}</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                  {/* Visual overlay reticle */}
                  <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-amber-500 absolute top-0 left-0"></div>
                    <div className="w-6 h-6 border-t-2 border-r-2 border-amber-500 absolute top-0 right-0"></div>
                    <div className="w-6 h-6 border-b-2 border-l-2 border-amber-500 absolute bottom-0 left-0"></div>
                    <div className="w-6 h-6 border-b-2 border-r-2 border-amber-500 absolute bottom-0 right-0"></div>
                  </div>
                </>
              )}
            </div>

            {/* Footer control bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
              >
                Cancelar
              </button>

              {!cameraError && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md shadow-amber-500/10"
                >
                  <Camera size={14} />
                  <span>Capturar Foto</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Success and WhatsApp Delivery Modal Overlay */}
      {showSaveSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col transform scale-100 transition-all">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <CheckSquare size={20} className="text-emerald-500 animate-bounce" />
                <h3 className="font-black text-base md:text-lg font-display">¡Orden Registrada Correctamente!</h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowSaveSuccessModal(false);
                  if (setActiveTab) setActiveTab('quotes');
                }}
                className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 text-slate-800 text-left">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-500/20">
                  <Check size={36} strokeWidth={3} />
                </div>
                <h4 className="font-black text-lg text-slate-900 mt-2">Folio de Orden: {successOrderFolio}</h4>
                <p className="text-xs text-slate-500">ID de Sistema: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{successOrderId}</span></p>
              </div>

              {/* Success Info Alert box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold">FECHA DE INGRESO:</span>
                  <span className="font-bold text-slate-850">{new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold">ESTATUS INICIAL:</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">EN DIAGNÓSTICO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">DOCUMENTO PDF:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Download size={12} /> Descarga Iniciada Automáticamente
                  </span>
                </div>
              </div>

              {/* COMPARTIR ORDEN DIGITAL (PDF / IMAGEN) PANEL */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-4">
                <div>
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-red-600 animate-pulse" />
                    Opciones de Envío Digital (PDF e Imagen)
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-normal mt-1">
                    Envía la orden oficial de SAE de manera digital a tu cliente por WhatsApp o Correo.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Copy Image to Clipboard */}
                  <button
                    type="button"
                    disabled={!successOrder}
                    onClick={async () => {
                      if (!successOrder) return;
                      setCopiedStatus('copying');
                      const ok = await copySaeImageToClipboard(successOrder, successClient || undefined, successVehicle || undefined, employees);
                      if (ok) {
                        setCopiedStatus('success');
                        setTimeout(() => setCopiedStatus('idle'), 4000);
                      } else {
                        setCopiedStatus('error');
                        setTimeout(() => setCopiedStatus('idle'), 3000);
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                      copiedStatus === 'idle' 
                        ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700' 
                        : 'text-white'
                    }`}
                    style={
                      copiedStatus === 'success'
                        ? { backgroundColor: '#065f46', borderColor: '#059669', color: '#ffffff' }
                        : copiedStatus === 'copying'
                        ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }
                        : copiedStatus === 'error'
                        ? { backgroundColor: '#991b1b', borderColor: '#dc2626', color: '#ffffff' }
                        : {}
                    }
                  >
                    {copiedStatus === 'success' ? (
                      <>
                        <Check size={14} style={{ color: '#10B981' }} />
                        <span style={{ color: '#ffffff' }}>¡Copiada!</span>
                      </>
                    ) : copiedStatus === 'copying' ? (
                      <span style={{ color: '#cbd5e1' }}>Generando...</span>
                    ) : copiedStatus === 'error' ? (
                      <span style={{ color: '#ffffff' }}>Error al copiar</span>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar Imagen</span>
                      </>
                    )}
                  </button>

                  {/* Download PNG */}
                  <button
                    type="button"
                    disabled={!successOrder}
                    onClick={async () => {
                      if (!successOrder) return;
                      await downloadSaeImage(successOrder, successClient || undefined, successVehicle || undefined, employees);
                    }}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Image size={14} />
                    <span>Descargar Imagen PNG</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Share Native File (Web Share) */}
                  <button
                    type="button"
                    disabled={!successOrder}
                    onClick={async () => {
                      if (!successOrder) return;
                      setSharingStatus('sharing');
                      let shared = await shareSaeOrderMobile(successOrder, successClient || undefined, successVehicle || undefined, employees, 'pdf');
                      if (!shared) {
                        shared = await shareSaeOrderMobile(successOrder, successClient || undefined, successVehicle || undefined, employees, 'png');
                      }
                      if (shared) {
                        setSharingStatus('success');
                        setTimeout(() => setSharingStatus('idle'), 3000);
                      } else {
                        setSharingStatus('unsupported');
                        setTimeout(() => setSharingStatus('idle'), 4000);
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                      sharingStatus === 'idle'
                        ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        : 'text-white'
                    }`}
                    style={
                      sharingStatus === 'success'
                        ? { backgroundColor: '#065f46', borderColor: '#059669', color: '#ffffff' }
                        : sharingStatus === 'sharing'
                        ? { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }
                        : sharingStatus === 'unsupported'
                        ? { backgroundColor: '#78350f', borderColor: '#b45309', color: '#ffffff' }
                        : {}
                    }
                  >
                    {sharingStatus === 'success' ? (
                      <>
                        <Check size={14} style={{ color: '#10B981' }} />
                        <span style={{ color: '#ffffff' }}>¡Compartido!</span>
                      </>
                    ) : sharingStatus === 'sharing' ? (
                      <span style={{ color: '#cbd5e1' }}>Generando...</span>
                    ) : sharingStatus === 'unsupported' ? (
                      <span style={{ color: '#ffffff' }}>Soporte Móvil Inactivo</span>
                    ) : (
                      <>
                        <Share2 size={14} />
                        <span>Compartir (Móvil)</span>
                      </>
                    )}
                  </button>

                  {/* Manual PDF download */}
                  <button
                    type="button"
                    disabled={!successOrder}
                    onClick={async () => {
                      if (!successOrder) return;
                      await generateSaePdf(successOrder, successClient || undefined, successVehicle || undefined, employees);
                    }}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Download size={14} />
                    <span>Descargar PDF</span>
                  </button>
                </div>

                {copiedStatus === 'success' && (
                  <p className="text-[10px] text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 leading-normal">
                    💡 <strong>¡Súper Rápido!</strong> La imagen está copiada. Abre el chat de WhatsApp con el botón verde de abajo y presiona <strong>Ctrl+V</strong> (o pegar) para enviarle la orden digital completa en alta resolución de inmediato.
                  </p>
                )}
              </div>

              {/* WhatsApp Notification Block */}
              {successClientHasWhatsapp ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 text-left">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-emerald-500 text-white p-1 rounded-lg shrink-0">
                      <Send size={16} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">Enviar por WhatsApp</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Se abrirá un enlace directo para enviar el mensaje al celular del cliente: <strong className="font-bold text-emerald-900">{successClientPhone}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* INFO SOBRE ADJUNTOS EN WHATSAPP */}
                  <div className="bg-amber-100/80 border-2 border-amber-300 rounded-xl p-3.5 space-y-2.5 text-xs shadow-sm">
                    <p className="font-black flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-900">
                      <AlertTriangle size={14} className="text-amber-700 shrink-0" />
                      Nota Importante de WhatsApp
                    </p>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                      Por políticas de seguridad de WhatsApp, <strong>ningún sitio web</strong> puede adjuntar archivos (PDF o imágenes) de manera automática. Para enviarlo, sigue cualquiera de estos dos métodos sencillos:
                    </p>
                    <div className="pt-2 border-t border-amber-200/80 space-y-2 text-[11px]">
                      <div className="flex items-start gap-2.5">
                        <span className="bg-amber-600 text-white font-black rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0 text-[10px] mt-0.5">1</span>
                        <div className="text-slate-800 leading-normal">
                          <strong className="text-amber-900 font-bold">Método Rápido (Pegar Imagen):</strong> Haz clic en el botón superior <span className="font-bold text-amber-800">"Copiar Imagen"</span>. Al abrir el chat de WhatsApp, presiona <kbd className="bg-slate-800 text-white border border-slate-700 px-1 py-0.5 rounded font-mono text-[9px]">Ctrl + V</kbd> (o mantén presionado y selecciona <strong>Pegar</strong> en móvil) para enviar la orden digital como imagen completa.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="bg-amber-600 text-white font-black rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0 text-[10px] mt-0.5">2</span>
                        <div className="text-slate-800 leading-normal">
                          <strong className="text-amber-900 font-bold">Método PDF:</strong> El archivo PDF de la orden ya se descargó en tu dispositivo. En el chat de WhatsApp, haz clic en el botón de adjuntar (📎 o +) y selecciona el PDF de tu carpeta de Descargas.
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Hola, te compartimos tu Orden de Entrada Digital de SAE con el Folio: ${successOrderFolio}. ¡La escudería que te lleva seguro a tu destino! 🚗🏁`;
                      window.open(`https://api.whatsapp.com/send?phone=52${successClientPhone}&text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Send size={14} />
                    <span>Abrir Chat de WhatsApp</span>
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5 text-left">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-amber-500 text-white p-1 rounded-lg shrink-0">
                      <AlertCircle size={16} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-amber-800 uppercase tracking-wider">Aviso de WhatsApp</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        El cliente se registró sin la casilla de WhatsApp activa. Sin embargo, si lo desea, puede forzar el envío al número registrado: <strong className="font-bold text-amber-900">{successClientPhone}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* INFO SOBRE ADJUNTOS EN WHATSAPP */}
                  <div className="bg-amber-100/80 border-2 border-amber-300 rounded-xl p-3.5 space-y-2.5 text-xs shadow-sm">
                    <p className="font-black flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-900">
                      <AlertTriangle size={14} className="text-amber-700 shrink-0" />
                      Nota Importante de WhatsApp
                    </p>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                      Por políticas de seguridad de WhatsApp, <strong>ningún sitio web</strong> puede adjuntar archivos (PDF o imágenes) de manera automática. Para enviarlo, sigue cualquiera de estos dos métodos sencillos:
                    </p>
                    <div className="pt-2 border-t border-amber-200/80 space-y-2 text-[11px]">
                      <div className="flex items-start gap-2.5">
                        <span className="bg-amber-600 text-white font-black rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0 text-[10px] mt-0.5">1</span>
                        <div className="text-slate-800 leading-normal">
                          <strong className="text-amber-900 font-bold">Método Rápido (Pegar Imagen):</strong> Haz clic en el botón superior <span className="font-bold text-amber-800">"Copiar Imagen"</span>. Al abrir el chat de WhatsApp, presiona <kbd className="bg-slate-800 text-white border border-slate-700 px-1 py-0.5 rounded font-mono text-[9px]">Ctrl + V</kbd> (o mantén presionado y selecciona <strong>Pegar</strong> en móvil) para enviar la orden digital como imagen completa.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="bg-amber-600 text-white font-black rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0 text-[10px] mt-0.5">2</span>
                        <div className="text-slate-800 leading-normal">
                          <strong className="text-amber-900 font-bold">Método PDF:</strong> El archivo PDF de la orden ya se descargó en tu dispositivo. En el chat de WhatsApp, haz clic en el botón de adjuntar (📎 o +) y selecciona el PDF de tu carpeta de Descargas.
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Hola, te compartimos tu Orden de Entrada Digital de SAE con el Folio: ${successOrderFolio}. ¡La escudería que te lleva seguro a tu destino! 🚗🏁`;
                      window.open(`https://api.whatsapp.com/send?phone=52${successClientPhone}&text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Send size={14} />
                    <span>Forzar Envío WhatsApp</span>
                  </button>
                </div>
              )}

              {/* Email Notification Block */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3 text-left">
                <div className="flex items-start gap-2.5">
                  <div className="bg-blue-500 text-white p-1 rounded-lg shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-blue-800 uppercase tracking-wider">Enviar por Correo Electrónico</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Prepara un correo pre-redactado para el cliente: <strong className="font-bold text-blue-900">{successClient?.email || 'Sin correo registrado'}</strong>.
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const emailSubject = `Orden de Entrada Digital SAE - Folio ${successOrderFolio}`;
                    const emailBody = `Hola,\n\nTe compartimos los detalles de la Orden de Entrada Digital de tu vehículo en SAE con el Folio: ${successOrderFolio}.\n\nPuedes adjuntar el PDF o la Imagen que acabas de descargar de nuestra plataforma para que lo recibas formalmente.\n\n¡La escudería que te lleva seguro a tu destino! 🚗🏁`;
                    const clientMail = successClient?.email || '';
                    window.open(`mailto:${clientMail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`, '_self');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-blue-600/10 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Mail size={14} />
                  <span>Redactar Correo</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSaveSuccessModal(false);
                  if (setActiveTab) setActiveTab('quotes');
                }}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <span>Ir a Cotizador y Presupuesto</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
