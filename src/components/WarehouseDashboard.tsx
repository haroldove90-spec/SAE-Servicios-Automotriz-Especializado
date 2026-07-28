import React, { useState } from 'react';
import { 
  Package, Search, Plus, Trash, Check, X, AlertTriangle, Truck, 
  ShoppingBag, Clipboard, RefreshCw, Barcode, HelpCircle, ChevronRight
} from 'lucide-react';
import { InventoryItem, Supplier, PurchaseOrder, PartRequisition, Employee, ServiceOrder } from '../types';

interface WarehouseDashboardProps {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  requisitions: PartRequisition[];
  employees: Employee[];
  orders: ServiceOrder[];
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'status'>) => void;
  receivePurchaseOrder: (poId: string) => void;
  handleRequisitionStatus: (reqId: string, status: 'Despachado' | 'Rechazado') => void;
  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  activeTab?: 'catalog' | 'requisitions' | 'purchases';
  setActiveTab?: (tab: 'catalog' | 'requisitions' | 'purchases') => void;
}

export default function WarehouseDashboard({
  inventory,
  suppliers,
  purchaseOrders,
  requisitions,
  employees,
  orders,
  addInventoryItem,
  updateInventoryItem,
  addPurchaseOrder,
  receivePurchaseOrder,
  handleRequisitionStatus,
  addSupplier,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab
}: WarehouseDashboardProps) {
  const [localActiveTab, setLocalActiveTab] = useState<'catalog' | 'requisitions' | 'purchases'>('catalog');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = controlledSetActiveTab !== undefined ? controlledSetActiveTab : setLocalActiveTab;

  // Search filter states
  const [inventorySearch, setInventorySearch] = useState('');

  // Add Part Form
  const [showAddPart, setShowAddPart] = useState(false);
  const [newPartCode, setNewPartCode] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartBrand, setNewPartBrand] = useState('');
  const [newPartCompatibility, setNewPartCompatibility] = useState('');
  const [newPartStock, setNewPartStock] = useState(10);
  const [newPartMinStock, setNewPartMinStock] = useState(2);
  const [newPartCost, setNewPartCost] = useState(0);
  const [newPartPrice, setNewPartPrice] = useState(0);

  // Add Supplier Form
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Purchase Order Form State
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poItemId, setPoItemId] = useState(inventory[0]?.id || '');
  const [poQty, setPoQty] = useState(5);
  const [poCost, setPoCost] = useState(0);

  // Filter Inventory list
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    item.code.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    item.compatibility.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartCode || !newPartName || newPartPrice <= 0) return;
    addInventoryItem({
      code: newPartCode,
      name: newPartName,
      brand: newPartBrand,
      compatibility: newPartCompatibility,
      stock: newPartStock,
      minStock: newPartMinStock,
      cost: newPartCost,
      price: newPartPrice
    });
    // reset
    setNewPartCode('');
    setNewPartName('');
    setNewPartBrand('');
    setNewPartCompatibility('');
    setNewPartPrice(0);
    setNewPartCost(0);
    setShowAddPart(false);
    alert('Nueva refacción guardada y dada de alta en el catálogo.');
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supPhone) return;
    addSupplier({
      name: supName,
      contact: supContact,
      phone: supPhone,
      email: supEmail,
      address: supAddress
    });
    setSupName('');
    setSupPhone('');
    setSupEmail('');
    setShowAddSupplier(false);
    alert('Proveedor registrado con éxito.');
  };

  const handleCreatePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !poItemId || poQty <= 0) return;
    
    const selectedItem = inventory.find(i => i.id === poItemId);
    const costToUse = poCost || (selectedItem ? selectedItem.cost : 100);

    addPurchaseOrder({
      supplierId: selectedSupplierId,
      date: new Date().toISOString().split('T')[0],
      items: [
        { itemId: poItemId, qty: poQty, cost: costToUse }
      ],
      total: costToUse * poQty
    });

    setPoQty(5);
    setPoCost(0);
    setShowCreatePO(false);
    alert('Orden de Compra creada. Puedes visualizarla en el módulo de Compras para ingresarla al recibir el embarque.');
  };

  return (
    <div id="warehouse-dashboard-container" className="space-y-6">
      {/* Tab Menu */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        {/* Mobile/Tablet Dropdown Select */}
        <div className="block lg:hidden w-full">
          <label htmlFor="warehouse-mobile-tab-select" className="block text-xs font-bold text-slate-500 mb-1">Módulo de Almacén</label>
          <select
            id="warehouse-mobile-tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as 'catalog' | 'requisitions' | 'purchases')}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8D6A28]"
          >
            <option value="catalog">📦 Catálogo e Inventario</option>
            <option value="requisitions">📋 Requisiciones de Mecánicos ({requisitions.filter(r => r.status === 'Pendiente').length} pendientes)</option>
            <option value="purchases">🚚 Compras y Proveedores</option>
          </select>
        </div>

        {/* Desktop Horizontal Tabs Menu */}
        <div className="hidden lg:flex gap-2">
          <button
            id="warehouse-tab-catalog"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'catalog'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package size={16} />
            Catálogo e Inventario
          </button>
          <button
            id="warehouse-tab-requisitions"
            onClick={() => setActiveTab('requisitions')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'requisitions'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clipboard size={16} />
            Requisiciones de Mecánicos
            {requisitions.filter(r => r.status === 'Pendiente').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                {requisitions.filter(r => r.status === 'Pendiente').length}
              </span>
            )}
          </button>
          <button
            id="warehouse-tab-purchases"
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'purchases'
                ? 'bg-[#8D6A28] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck size={16} />
            Compras y Proveedores
          </button>
        </div>
      </div>

      {/* REPLACEMENT PARTS CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Buscar por código, pieza o modelo..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-amber-500"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <button
              onClick={() => setShowAddPart(true)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus size={16} />
              Agregar Refacción al Catálogo
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="p-3">Código / SKU</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Marca</th>
                    <th className="p-3">Compatibilidad Vehicular</th>
                    <th className="p-3 text-center">Stock Real</th>
                    <th className="p-3 text-right">Costo Prom.</th>
                    <th className="p-3 text-right">Precio Venta</th>
                    <th className="p-3 text-center">Estado Alerta</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const isLowStock = item.stock <= item.minStock;
                    return (
                      <tr key={item.id} className="border-b border-slate-5 hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold flex items-center gap-1.5 w-max">
                            <Barcode size={12} />
                            {item.code}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-3 text-slate-600">{item.brand}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate" title={item.compatibility}>{item.compatibility}</td>
                        <td className="p-3 text-center">
                          <strong className={`font-mono text-sm ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                            {item.stock} pzas
                          </strong>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">${item.cost.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">${item.price.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full text-[9px] animate-pulse">
                              <AlertTriangle size={10} /> REORDENAR (Mín: {item.minStock})
                            </span>
                          ) : (
                            <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[9px]">
                              Suficiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADD PART MODAL */}
          {showAddPart && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 font-display">Registrar Nueva Refacción</h4>
                  <button onClick={() => setShowAddPart(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                
                <form onSubmit={handleCreatePart} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Código / SKU</label>
                      <input type="text" required value={newPartCode} onChange={(e) => setNewPartCode(e.target.value.toUpperCase())} className="w-full p-2 border border-slate-200 rounded-lg uppercase font-mono" placeholder="Ej. BAL-DEL-JETTA" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Nombre Comercial</label>
                      <input type="text" required value={newPartName} onChange={(e) => setNewPartName(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Ej. Balatas de Cerámica" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Marca del Fabricante</label>
                      <input type="text" required value={newPartBrand} onChange={(e) => setNewPartBrand(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Ej. Wagner" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Compatibilidades de Autos</label>
                      <input type="text" required value={newPartCompatibility} onChange={(e) => setNewPartCompatibility(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Ej. Jetta A6 (2015-2019)" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Stock Inicial</label>
                      <input type="number" required value={newPartStock} onChange={(e) => setNewPartStock(parseInt(e.target.value) || 0)} className="w-full p-2 border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Stock Mínimo (Alerta)</label>
                      <input type="number" required value={newPartMinStock} onChange={(e) => setNewPartMinStock(parseInt(e.target.value) || 1)} className="w-full p-2 border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Costo Unitario ($)</label>
                      <input type="number" required value={newPartCost || ''} onChange={(e) => setNewPartCost(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Ej. 450" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Precio de Venta ($)</label>
                      <input type="number" required value={newPartPrice || ''} onChange={(e) => setNewPartPrice(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Ej. 890" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button type="button" onClick={() => setShowAddPart(false)} className="px-3 py-1.5 text-slate-600">Cancelar</button>
                    <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-lg shadow-sm">Guardar Refacción</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MECHANICS PARTS REQUISITIONS TAB */}
      {activeTab === 'requisitions' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-800 font-display">Peticiones de Refacciones desde Bahías de Trabajo</h4>
            <p className="text-xs text-slate-500">Valida existencias físicas y despacha digitalmente los materiales solicitados por mecánicos en tiempo real</p>
          </div>

          <div className="overflow-x-auto text-xs pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-3">ID Orden</th>
                  <th className="p-3">Refacción Solicitada</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3">Solicitó (Mecánico)</th>
                  <th className="p-3 text-center">Stock disponible</th>
                  <th className="p-3 text-center">Estatus</th>
                  <th className="p-3 text-right">Acciones de Almacén</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-slate-400 italic">No hay requisiciones pendientes del personal operativo.</td>
                  </tr>
                ) : (
                  requisitions.map((req) => {
                    const item = inventory.find(i => i.id === req.itemId);
                    const mech = employees.find(e => e.id === req.mechanicId);
                    return (
                      <tr key={req.id} className="border-b border-slate-5 hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{req.orderId}</span>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{item?.name || 'Refacción Desconocida'}</p>
                          <p className="text-[10px] text-slate-500">Código: {item?.code}</p>
                        </td>
                        <td className="p-3 text-center font-bold font-mono text-slate-700">{req.qty} pza(s)</td>
                        <td className="p-3 font-semibold text-slate-700">{mech?.name}</td>
                        <td className="p-3 text-center font-mono">
                          <strong className={item && item.stock < req.qty ? 'text-red-600' : 'text-slate-800'}>
                            {item?.stock || 0} pzas
                          </strong>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 font-bold text-[10px] rounded-full ${
                            req.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            req.status === 'Despachado' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {req.status === 'Pendiente' && (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  if (item && item.stock < req.qty) {
                                    alert('¡Atención! No cuentas con suficiente stock físico para despachar esta requisición.');
                                    return;
                                  }
                                  handleRequisitionStatus(req.id, 'Despachado');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 text-[11px] rounded transition-all flex items-center gap-0.5"
                              >
                                <Check size={12} /> Despachar
                              </button>
                              <button
                                onClick={() => handleRequisitionStatus(req.id, 'Rechazado')}
                                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2 py-1 text-[11px] rounded border border-red-200 transition-all"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                          {req.status === 'Despachado' && (
                            <span className="text-slate-400 text-[10px] italic">Surtido el {req.date}</span>
                          )}
                          {req.status === 'Rechazado' && (
                            <span className="text-red-500 text-[10px] italic">Rechazada</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPLIERS & PURCHASES TAB */}
      {activeTab === 'purchases' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Orders management list */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800 font-display">Órdenes de Compra a Proveedores</h4>
              <button
                onClick={() => setShowCreatePO(true)}
                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <ShoppingBag size={14} />
                Nueva Orden Compra
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="p-3">Código PO</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3">Fecha Emisión</th>
                    <th className="p-3">Refacción Solicitada</th>
                    <th className="p-3 text-right">Total Pedido</th>
                    <th className="p-3 text-center">Estatus</th>
                    <th className="p-3 text-right">Acción Entrada</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => {
                    const sup = suppliers.find(s => s.id === po.supplierId);
                    return (
                      <tr key={po.id} className="border-b border-slate-5 hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-700">{po.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{sup?.name}</td>
                        <td className="p-3 text-slate-500">{po.date}</td>
                        <td className="p-3">
                          {po.items.map((pi, idx) => {
                            const item = inventory.find(i => i.id === pi.itemId);
                            return (
                              <p key={idx} className="text-slate-600">
                                {item?.name} x {pi.qty} pzas
                              </p>
                            );
                          })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">${po.total.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 font-bold text-[10px] rounded-full ${
                            po.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {po.status === 'Pendiente' ? (
                            <button
                              onClick={() => {
                                receivePurchaseOrder(po.id);
                                alert(`¡Orden ${po.id} ingresada! El stock ha sido actualizado e incorporado con promedio de costo.`);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 text-[11px] rounded transition-all"
                            >
                              Dar Entrada Almacén
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Ingresada</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suppliers sidebar registry */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-800">Catálogo de Proveedores</h4>
                <button
                  onClick={() => setShowAddSupplier(true)}
                  className="p-1 hover:bg-slate-100 rounded text-amber-600"
                  title="Dar de alta proveedor"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {suppliers.map((s) => (
                  <div key={s.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <p className="text-slate-500">Contacto: <strong>{s.contact}</strong></p>
                    <p className="text-slate-500 font-mono">Tel: {s.phone}</p>
                    <p className="text-slate-400 text-[10px] truncate">{s.email}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] text-slate-500 italic">
              * El ingreso de órdenes de compra recalcula de manera dinámica el costo promedio de las refacciones para mantener la precisión en los reportes de utilidad.
            </div>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      {showCreatePO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800">Crear Orden de Compra (Reabasto)</h4>
              <button onClick={() => setShowCreatePO(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePurchaseOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Seleccionar Proveedor</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-500 font-medium mb-1">Refacción a Surtir</label>
                  <select
                    value={poItemId}
                    onChange={(e) => setPoItemId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  >
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Cantidad de Piezas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poQty}
                    onChange={(e) => setPoQty(parseInt(e.target.value) || 5)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    value={poCost || ''}
                    onChange={(e) => setPoCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                    placeholder="Sugerir costo actual..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => setShowCreatePO(false)} className="px-3 py-1.5 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-lg shadow-sm">Generar Reabasto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {showAddSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800">Dar de Alta Proveedor</h4>
              <button onClick={() => setShowAddSupplier(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Razón Social / Nombre</label>
                <input type="text" required value={supName} onChange={(e) => setSupName(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Refaccionaria..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Contacto Ejecutivo</label>
                  <input type="text" value={supContact} onChange={(e) => setSupContact(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Lic. Martínez" />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Teléfono</label>
                  <input type="tel" required value={supPhone} onChange={(e) => setSupPhone(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="55-1234-5678" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Correo Pedidos</label>
                <input type="email" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="pedidos@proveedor.mx" />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1">Dirección Bodega</label>
                <input type="text" value={supAddress} onChange={(e) => setSupAddress(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => setShowAddSupplier(false)} className="px-3 py-1.5 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-lg shadow-sm">Registrar Proveedor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
