/**
 * Types and interfaces for the Mechanic Workshop Management System (InterTaller)
 */

export type UserRole = 'admin' | 'advisor' | 'mechanic' | 'warehouse' | 'client';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  creditBalance: number;
  calle?: string;
  cp?: string;
  colonia?: string;
  alcaldia?: string;
  telFijo?: string;
  hasWhatsapp?: boolean;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  vin: string;
  mileage: number;
  color: string;
  engomadoColor: 'yellow' | 'pink' | 'red' | 'green' | 'blue'; // CDMX verification
  plateEnding: string; // CDMX verification
  motor?: string;
  serie?: string;
}

export type EmployeeRole = 'Cajero' | 'Asesor' | 'Mecanico';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  commissionRate: number; // e.g. 15 for 15%
  active: boolean;
  phone: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  brand: string;
  compatibility: string; // Description of compatible vehicles
  stock: number;
  minStock: number;
  cost: number;
  price: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  date: string;
  status: 'Pendiente' | 'Recibido';
  items: {
    itemId: string;
    qty: number;
    cost: number;
  }[];
  total: number;
}

export interface PartRequisition {
  id: string;
  orderId: string; // Service Order ID
  itemId: string;
  qty: number;
  mechanicId: string;
  status: 'Pendiente' | 'Despachado' | 'Rechazado';
  date: string;
}

export interface Checklist {
  scratches: boolean;
  dents: boolean;
  fuelLevel: number; // 0, 25, 50, 75, 100
  tools: boolean;
  spareTire: boolean;
  jack: boolean;
  extinguisher: boolean;
  photos: string[]; // Mock data URI or text
  
  // Custom SAE fields matching paper form checklist
  tapetes?: boolean;
  encendedor?: boolean;
  estereo?: boolean;
  tarjetaCirculacion?: boolean;
  compVerificacion?: boolean;
  polizaSeguro?: boolean;
  segurosRuedas?: boolean;
  gato?: boolean;
  herramienta?: boolean;
  extintor?: boolean;
  llantaRefaccion?: boolean;
  sensoresPresencia?: boolean;
  camaraReversa?: boolean;
  
  inspeccionMotor?: string;
  objetosValor?: string;
}

export interface BudgetLineItem {
  id: string;
  type: 'refaccion' | 'mano_de_obra';
  description: string;
  qty: number;
  unitPrice: number;
  approved: boolean | null; // null = Pending, true = Approved, false = Rejected
}

export interface PresupuestoItem {
  id: string;
  codigo?: string;
  descripcion: string;
  cantidad: number;
  importeUnitario: number;
  total: number;
}

export interface Presupuesto {
  id: string;
  numero: string; // Folio de presupuesto e.g. "202"
  fecha: string; // e.g. "07/07/2026"
  asesor: string; // e.g. "Alberto Flores Hdz."
  
  // Datos del Cliente
  clienteNombre: string;
  clienteCalle: string;
  clienteCpColonia: string;
  clienteAlcaldia: string;
  clienteTelefono: string;
  
  // Datos del Vehículo
  marcaMotor: string; // e.g. "FORD-RANGER / 2.3L"
  modeloColor: string; // e.g. "2012 / BLANCO"
  matriculaVin: string; // e.g. "865-XXJ / 8AFER5AD8C6453240"
  kilometros: number;
  
  // Items / Conceptos
  items: PresupuestoItem[];
  
  // Pago, Validez y Totales
  formaPago: string; // "CONTADO" | "TARJETA" | "TRANSFERENCIA" | "CRÉDITO"
  total: number;
  validezDias: number; // 12
  diasEntrega?: number;
  notas?: string;
  
  // Opcionales para vinculación
  clientId?: string;
  vehicleId?: string;
  serviceOrderId?: string;
  
  createdAt: string;
  status: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado' | 'Convertido';
}

export interface OrdenReparacionItem {
  id: string;
  codigo?: string;
  descripcion: string;
  cantidad: number;
}

export interface OrdenReparacion {
  id: string;
  numero: string; // e.g. "180"
  fecha: string; // e.g. "07/07/2026"
  asesor: string; // e.g. "Alberto Flores Hdz."
  
  // Quality and revision checks matching paper
  rotacionAireLlantas?: string;
  revLimpiaParabrisas?: string;
  revLucesNivelesEngral?: string;
  tecnico?: string;

  // Datos del Cliente
  clienteNombre: string;
  clienteCalle: string;
  clienteCpColonia: string;
  clienteAlcaldia: string;
  clienteTelefono: string;
  
  // Datos del Vehículo
  marcaMotor: string; // e.g. "FORD-RANGER / 2.3L"
  modeloColor: string; // e.g. "2012 / BLANCO"
  matriculaVin: string; // e.g. "865-XXJ / 8AFER5AD8C6453240"
  kilometros: number;
  
  // Items / Desglose
  items: OrdenReparacionItem[];
  
  notas?: string;
  
  clientId?: string;
  vehicleId?: string;
  serviceOrderId?: string;
  
  createdAt: string;
  status: 'En Proceso' | 'Completada' | 'Entregada' | 'Cancelada';
}

export interface NotaSalidaItem {
  id: string;
  codigo?: string;
  descripcion: string;
  cantidad: number;
  importeUnitario: number;
  total: number;
}

export interface NotaSalida {
  id: string;
  numero: string; // e.g. "187"
  fecha: string; // e.g. "16/07/2026"
  asesor: string; // e.g. "Alberto Flores Hdz."
  
  // Datos del Cliente
  clienteNombre: string;
  clienteCalle: string;
  clienteCpColonia: string;
  clienteAlcaldia: string;
  clienteTelefono: string;
  
  // Datos del Vehículo
  marcaMotor: string; // e.g. "FORD-RANGER / 2.3L"
  modeloColor: string; // e.g. "2012 / BLANCO"
  matriculaVin: string; // e.g. "865-XXJ / 8AFER5AD8C6453240"
  kilometros: number;
  
  // Condición de Pago, Garantía y Referencias
  formaPago: string; // e.g. "CONTADO"
  garantia: string; // e.g. "30 DIAS Ó 2,000 KMS. LO QUE OCURRA PRIMERO"
  ordenServicioNumero: string; // e.g. "378A"
  
  // Items / Desglose
  items: NotaSalidaItem[];
  
  subtotal?: number;
  iva?: number;
  total: number;
  
  clientId?: string;
  vehicleId?: string;
  serviceOrderId?: string;
  
  createdAt: string;
  status: 'Emitida' | 'Pagada' | 'Cancelada';
}

export interface TimeLog {
  action: 'start' | 'pause' | 'resume' | 'stop';
  timestamp: string;
  reason?: string; // e.g. "Falta de refacción"
}

export type OrderStatus = 'Diagnostico' | 'Esperando_Refacciones' | 'En_Reparacion' | 'Control_Calidad' | 'Listo_Entrega';

export interface ServiceOrder {
  id: string; // OS-XXXX
  clientId: string;
  vehicleId: string;
  advisorId: string;
  mechanicId: string;
  reportedFailure: string; // Motivo de visita / Falla reportada
  checklist: Checklist;
  diagnostics: string; // Notas del mecánico
  diagnosticPhotos: string[]; // Evidence photos
  status: OrderStatus;
  items: BudgetLineItem[];
  timeLogs: TimeLog[];
  isClockedIn: boolean;
  isPaused: boolean;
  totalHoursWorked: number; // calculated hours
  dateOpened: string;
  dateClosed?: string;
  payments: {
    id: string;
    amount: number;
    date: string;
    method: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Credito';
  }[];
  
  // Custom SAE fields
  folio?: string;
  fecha?: string;
  hora?: string;
  tecnico?: string;
  clientSignature?: string; // Base64 PNG signature
  mechanicSignature?: string; // Base64 PNG signature
}

export type TransactionType = 'Ingreso' | 'Egreso';
export type TransactionCategory = 'Pago_Cliente' | 'Proveedor' | 'Nomina' | 'Servicios' | 'Otros';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  description: string;
  referenceId?: string; // ServiceOrder id or Supplier id
}

export interface WorkshopSettings {
  name: string;
  rfc: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  terms: string;
  taxRate: number; // e.g. 16 for 16% (IVA México)
  bankDetails: string;
}
