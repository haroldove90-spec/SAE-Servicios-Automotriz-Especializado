import { useState, useEffect } from 'react';
import { Client, Vehicle, Employee, InventoryItem, Supplier, ServiceOrder, Transaction, WorkshopSettings, PartRequisition, PurchaseOrder, OrderStatus, BudgetLineItem, TimeLog, Presupuesto, OrdenReparacion, NotaSalida } from './types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_VEHICLES, 
  INITIAL_EMPLOYEES, 
  INITIAL_INVENTORY, 
  INITIAL_SUPPLIERS, 
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_REQUISITIONS, 
  INITIAL_ORDERS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SETTINGS,
  INITIAL_PRESUPUESTOS,
  INITIAL_ORDENES_REPARACION,
  INITIAL_NOTAS_SALIDA
} from './mockData';
import { supabase } from './lib/supabase';
import { initPdfTemplatesFromCloud } from './utils/pdfTemplateStorage';

const sortNewestFirst = <T extends { id: string }>(arr: T[]): T[] => {
  return [...arr].sort((a, b) => {
    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numB - numA;
    return b.id.localeCompare(a.id);
  });
};

const DELETED_IDS_KEY = 'wt_deleted_ids';

export const getDeletedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
};

export const recordDeletedId = (id: string) => {
  if (!id) return;
  try {
    const current = getDeletedIds();
    current.add(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Error saving deleted ID:', e);
  }
};

export const recordDeletedIds = (ids: string[]) => {
  if (!ids || ids.length === 0) return;
  try {
    const current = getDeletedIds();
    ids.forEach(id => { if (id) current.add(id); });
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Error saving deleted IDs:', e);
  }
};

export function useWorkshopState() {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [requisitions, setRequisitions] = useState<PartRequisition[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [ordenesReparacion, setOrdenesReparacion] = useState<OrdenReparacion[]>([]);
  const [notasSalida, setNotasSalida] = useState<NotaSalida[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<WorkshopSettings>(INITIAL_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Supabase states
  const [isSyncing, setIsSyncing] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Initialize data from LocalStorage or mock data, then fetch from Supabase
  useEffect(() => {
    const initializeData = async () => {
      const deletedIds = getDeletedIds();
      const hasInitialized = localStorage.getItem('wt_initialized') === 'true';

      const parseAndFilter = <T extends { id: string }>(raw: string | null, fallback: T[]): T[] => {
        if (raw !== null) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              return parsed.filter(item => item && !deletedIds.has(item.id));
            }
          } catch (e) {
            console.warn('JSON parse error in local state:', e);
          }
        }
        // If never initialized before, seed with initial mock data filtered by deletedIds
        if (!hasInitialized) {
          return fallback.filter(item => item && !deletedIds.has(item.id));
        }
        return [];
      };

      const localClients = localStorage.getItem('wt_clients');
      const localVehicles = localStorage.getItem('wt_vehicles');
      const localEmployees = localStorage.getItem('wt_employees');
      const localInventory = localStorage.getItem('wt_inventory');
      const localSuppliers = localStorage.getItem('wt_suppliers');
      const localPurchaseOrders = localStorage.getItem('wt_purchase_orders');
      const localRequisitions = localStorage.getItem('wt_requisitions');
      const localOrders = localStorage.getItem('wt_orders');
      const localPresupuestos = localStorage.getItem('wt_presupuestos');
      const localOrdenesReparacion = localStorage.getItem('wt_ordenes_reparacion');
      const localNotasSalida = localStorage.getItem('wt_notas_salida');
      const localTransactions = localStorage.getItem('wt_transactions');
      const localSettings = localStorage.getItem('wt_settings');

      setClients(sortNewestFirst(parseAndFilter(localClients, INITIAL_CLIENTS)));
      setVehicles(sortNewestFirst(parseAndFilter(localVehicles, INITIAL_VEHICLES)));
      setEmployees(sortNewestFirst(parseAndFilter(localEmployees, INITIAL_EMPLOYEES)));
      setInventory(sortNewestFirst(parseAndFilter(localInventory, INITIAL_INVENTORY)));
      setSuppliers(sortNewestFirst(parseAndFilter(localSuppliers, INITIAL_SUPPLIERS)));
      setPurchaseOrders(sortNewestFirst(parseAndFilter(localPurchaseOrders, INITIAL_PURCHASE_ORDERS)));
      setRequisitions(sortNewestFirst(parseAndFilter(localRequisitions, INITIAL_REQUISITIONS)));
      setOrders(sortNewestFirst(parseAndFilter(localOrders, INITIAL_ORDERS)));
      setPresupuestos(sortNewestFirst(parseAndFilter(localPresupuestos, INITIAL_PRESUPUESTOS)));
      setOrdenesReparacion(sortNewestFirst(parseAndFilter(localOrdenesReparacion, INITIAL_ORDENES_REPARACION)));
      setNotasSalida(sortNewestFirst(parseAndFilter(localNotasSalida, INITIAL_NOTAS_SALIDA)));
      setTransactions(sortNewestFirst(parseAndFilter(localTransactions, INITIAL_TRANSACTIONS)));

      localStorage.setItem('wt_initialized', 'true');
      
      let parsedSettings = localSettings ? JSON.parse(localSettings) : INITIAL_SETTINGS;
      if (parsedSettings) {
        // Strip out database metadata fields that might exist in old localStorage
        delete (parsedSettings as any).updated_at;
        delete (parsedSettings as any).created_at;
        delete (parsedSettings as any).id;
      }
      if (parsedSettings && parsedSettings.address && (parsedSettings.address.includes('Palmas') || parsedSettings.address.includes('palmas'))) {
        parsedSettings.address = INITIAL_SETTINGS.address;
        parsedSettings.phone = INITIAL_SETTINGS.phone;
      }
      setSettings(parsedSettings);
      setLoaded(true);

      // Now, try fetching from Supabase to hydrate with latest cloud data
      await Promise.allSettled([
        fetchFromSupabase(true),
        initPdfTemplatesFromCloud()
      ]);
    };

    initializeData();
  }, []);

  const fetchFromSupabase = async (isInitialLoad = false) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      // Pull templates in background
      initPdfTemplatesFromCloud().catch(e => console.warn('Templates cloud fetch note:', e));

      // Fetch all tables from Supabase in parallel
      const [
        clientsRes,
        vehiclesRes,
        employeesRes,
        inventoryRes,
        suppliersRes,
        poRes,
        requisitionsRes,
        ordersRes,
        txRes,
        settingsRes,
        presupuestosRes,
        ordenesRepRes,
        notasSalidaRes
      ] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('purchase_orders').select('*'),
        supabase.from('requisitions').select('*'),
        supabase.from('service_orders').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('workshop_settings').select('*').eq('id', 'default').maybeSingle(),
        supabase.from('presupuestos').select('*'),
        supabase.from('ordenes_reparacion').select('*'),
        supabase.from('notas_salida').select('*')
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;
      if (employeesRes.error) throw employeesRes.error;
      if (inventoryRes.error) throw inventoryRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      if (poRes.error) throw poRes.error;
      if (requisitionsRes.error) throw requisitionsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (txRes.error) throw txRes.error;

      // Connection is successful
      setSupabaseConnected(true);

      const deletedIds = getDeletedIds();

      // Proactively scrub any records from Supabase that were deleted locally
      const remoteDatasets: { table: string; items: any[] | null }[] = [
        { table: 'clients', items: clientsRes.data },
        { table: 'vehicles', items: vehiclesRes.data },
        { table: 'employees', items: employeesRes.data },
        { table: 'inventory', items: inventoryRes.data },
        { table: 'suppliers', items: suppliersRes.data },
        { table: 'purchase_orders', items: poRes.data },
        { table: 'requisitions', items: requisitionsRes.data },
        { table: 'service_orders', items: ordersRes.data },
        { table: 'transactions', items: txRes.data },
        { table: 'presupuestos', items: presupuestosRes.data },
        { table: 'ordenes_reparacion', items: ordenesRepRes.data },
        { table: 'notas_salida', items: notasSalidaRes.data }
      ];

      for (const ds of remoteDatasets) {
        if (ds.items && ds.items.length > 0) {
          const zombies = ds.items.filter(item => item && deletedIds.has(item.id));
          for (const z of zombies) {
            supabase.from(ds.table).delete().eq('id', z.id).catch(err => {
              console.warn(`Error background scrubbing deleted record ${z.id} from ${ds.table}:`, err);
            });
          }
        }
      }

      const filterDeleted = <T extends { id: string }>(items: T[] | null | undefined): T[] => {
        if (!items) return [];
        return items.filter(i => i && !deletedIds.has(i.id));
      };

      // Set clean authoritative data from Supabase directly into state
      if (clientsRes.data) {
        const clean = sortNewestFirst(filterDeleted(clientsRes.data));
        setClients(clean);
        localStorage.setItem('wt_clients', JSON.stringify(clean));
      }
      if (vehiclesRes.data) {
        const clean = sortNewestFirst(filterDeleted(vehiclesRes.data));
        setVehicles(clean);
        localStorage.setItem('wt_vehicles', JSON.stringify(clean));
      }
      if (employeesRes.data) {
        const clean = sortNewestFirst(filterDeleted(employeesRes.data));
        setEmployees(clean);
        localStorage.setItem('wt_employees', JSON.stringify(clean));
      }
      if (inventoryRes.data) {
        const clean = sortNewestFirst(filterDeleted(inventoryRes.data));
        setInventory(clean);
        localStorage.setItem('wt_inventory', JSON.stringify(clean));
      }
      if (suppliersRes.data) {
        const clean = sortNewestFirst(filterDeleted(suppliersRes.data));
        setSuppliers(clean);
        localStorage.setItem('wt_suppliers', JSON.stringify(clean));
      }
      if (poRes.data) {
        const clean = sortNewestFirst(filterDeleted(poRes.data));
        setPurchaseOrders(clean);
        localStorage.setItem('wt_purchase_orders', JSON.stringify(clean));
      }
      if (requisitionsRes.data) {
        const clean = sortNewestFirst(filterDeleted(requisitionsRes.data));
        setRequisitions(clean);
        localStorage.setItem('wt_requisitions', JSON.stringify(clean));
      }
      if (ordersRes.data) {
        const clean = sortNewestFirst(filterDeleted(ordersRes.data));
        setOrders(clean);
        localStorage.setItem('wt_orders', JSON.stringify(clean));
      }
      if (txRes.data) {
        const clean = sortNewestFirst(filterDeleted(txRes.data));
        setTransactions(clean);
        localStorage.setItem('wt_transactions', JSON.stringify(clean));
      }
      if (!presupuestosRes.error && presupuestosRes.data) {
        const clean = sortNewestFirst(filterDeleted(presupuestosRes.data));
        setPresupuestos(clean);
        localStorage.setItem('wt_presupuestos', JSON.stringify(clean));
      }
      if (!ordenesRepRes.error && ordenesRepRes.data) {
        const clean = sortNewestFirst(filterDeleted(ordenesRepRes.data));
        setOrdenesReparacion(clean);
        localStorage.setItem('wt_ordenes_reparacion', JSON.stringify(clean));
      }
      if (!notasSalidaRes.error && notasSalidaRes.data) {
        const clean = sortNewestFirst(filterDeleted(notasSalidaRes.data));
        setNotasSalida(clean);
        localStorage.setItem('wt_notas_salida', JSON.stringify(clean));
      }
      
      if (settingsRes.data) {
        const { id, created_at, updated_at, ...cleanSettingsData } = settingsRes.data as any;
        setSettings(prev => ({ ...prev, ...cleanSettingsData }));
        localStorage.setItem('wt_settings', JSON.stringify(cleanSettingsData));
      }

      console.log('Fidelidad Supabase: Todo sincronizado correctamente sin registros eliminados.');
    } catch (err: any) {
      console.warn('Supabase Connection or Schema issue:', err);
      // If table/relation doesn't exist yet, we still set connection as True but with distinct warning
      if (err.code === '42P01') {
        setSupabaseConnected(true);
        setSyncError('Conectado, pero falta ejecutar el script SQL de creación de tablas.');
      } else {
        setSupabaseConnected(false);
        setSyncError(err.message || 'Error de conexión');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to format workshop settings payload safely for Supabase schema (strips updated_at/created_at)
  const formatWorkshopSettingsPayload = (st: any) => ({
    id: 'default',
    name: st?.name || '',
    rfc: st?.rfc || '',
    address: st?.address || '',
    phone: st?.phone || '',
    email: st?.email || '',
    logoUrl: st?.logoUrl || '',
    terms: st?.terms || '',
    taxRate: typeof st?.taxRate === 'number' ? st.taxRate : 16,
    bankDetails: st?.bankDetails || ''
  });

  const uploadToSupabase = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const deletedIds = getDeletedIds();
      const filterActive = <T extends { id: string }>(items: T[]): T[] => {
        return items.filter(i => i && !deletedIds.has(i.id));
      };

      const activeClients = filterActive(clients);
      const activeVehicles = filterActive(vehicles);
      const activeEmployees = filterActive(employees);
      const activeInventory = filterActive(inventory);
      const activeSuppliers = filterActive(suppliers);
      const activePO = filterActive(purchaseOrders);
      const activeReq = filterActive(requisitions);
      const activeOrders = filterActive(orders);
      const activeTx = filterActive(transactions);
      const activePres = filterActive(presupuestos);
      const activeOrdRep = filterActive(ordenesReparacion);
      const activeNotas = filterActive(notasSalida);

      if (activeClients.length > 0) {
        const { error } = await supabase.from('clients').upsert(activeClients);
        if (error) throw error;
      }
      if (activeVehicles.length > 0) {
        const { error } = await supabase.from('vehicles').upsert(activeVehicles);
        if (error) throw error;
      }
      if (activeEmployees.length > 0) {
        const { error } = await supabase.from('employees').upsert(activeEmployees);
        if (error) throw error;
      }
      if (activeInventory.length > 0) {
        const { error } = await supabase.from('inventory').upsert(activeInventory);
        if (error) throw error;
      }
      if (activeSuppliers.length > 0) {
        const { error } = await supabase.from('suppliers').upsert(activeSuppliers);
        if (error) throw error;
      }
      if (activePO.length > 0) {
        const { error } = await supabase.from('purchase_orders').upsert(activePO);
        if (error) throw error;
      }
      if (activeReq.length > 0) {
        const { error } = await supabase.from('requisitions').upsert(activeReq);
        if (error) throw error;
      }
      if (activeOrders.length > 0) {
        const { error } = await supabase.from('service_orders').upsert(activeOrders);
        if (error) throw error;
      }
      if (activeTx.length > 0) {
        const { error } = await supabase.from('transactions').upsert(activeTx);
        if (error) throw error;
      }
      if (activePres.length > 0) {
        const { error } = await supabase.from('presupuestos').upsert(activePres);
        if (error) throw error;
      }
      if (activeOrdRep.length > 0) {
        const { error } = await supabase.from('ordenes_reparacion').upsert(activeOrdRep);
        if (error) throw error;
      }
      if (activeNotas.length > 0) {
        const { error } = await supabase.from('notas_salida').upsert(activeNotas);
        if (error) throw error;
      }
      if (settings) {
        const { error } = await supabase.from('workshop_settings').upsert(formatWorkshopSettingsPayload(settings));
        if (error) throw error;
      }

      setSupabaseConnected(true);
      console.log('Todos los datos locales migrados correctamente a Supabase.');
    } catch (err: any) {
      console.error('Error uploading to Supabase:', err);
      setSyncError(err.message || 'Error al sincronizar datos locales');
      setSupabaseConnected(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to centralize safe background syncing with Supabase
  const safeUpsert = async (table: string, data: any) => {
    try {
      let payload = data;
      if (table === 'workshop_settings' && payload && typeof payload === 'object' && !Array.isArray(payload)) {
        payload = formatWorkshopSettingsPayload(payload);
      }
      if (Array.isArray(payload)) {
        const deletedIds = getDeletedIds();
        payload = payload.filter((item: any) => item && !deletedIds.has(item.id));
      }
      if (Array.isArray(payload) && payload.length === 0) {
        return;
      }
      const { error } = await supabase.from(table).upsert(payload);
      if (error) {
        console.warn(`Error auto-syncing table ${table}:`, error.message);
      }
    } catch (err) {
      console.error(`Exception auto-syncing table ${table}:`, err);
    }
  };

  // Sync to LocalStorage & Supabase Background Sync
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_clients', JSON.stringify(clients));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('clients', clients);
    }
  }, [clients, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_vehicles', JSON.stringify(vehicles));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('vehicles', vehicles);
    }
  }, [vehicles, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_employees', JSON.stringify(employees));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('employees', employees);
    }
  }, [employees, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_inventory', JSON.stringify(inventory));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('inventory', inventory);
    }
  }, [inventory, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_suppliers', JSON.stringify(suppliers));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('suppliers', suppliers);
    }
  }, [suppliers, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_purchase_orders', JSON.stringify(purchaseOrders));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('purchase_orders', purchaseOrders);
    }
  }, [purchaseOrders, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_requisitions', JSON.stringify(requisitions));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('requisitions', requisitions);
    }
  }, [requisitions, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_orders', JSON.stringify(orders));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('service_orders', orders);
    }
  }, [orders, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_presupuestos', JSON.stringify(presupuestos));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('presupuestos', presupuestos);
    }
  }, [presupuestos, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_ordenes_reparacion', JSON.stringify(ordenesReparacion));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('ordenes_reparacion', ordenesReparacion);
    }
  }, [ordenesReparacion, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_notas_salida', JSON.stringify(notasSalida));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('notas_salida', notasSalida);
    }
  }, [notasSalida, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_transactions', JSON.stringify(transactions));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('transactions', transactions);
    }
  }, [transactions, loaded, supabaseConnected]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('wt_settings', JSON.stringify(settings));
    if (supabaseConnected && !isSyncing) {
      safeUpsert('workshop_settings', formatWorkshopSettingsPayload(settings));
    }
  }, [settings, loaded, supabaseConnected]);


  // Actions

  // 1. Clients
  const addClient = (client: Omit<Client, 'id' | 'creditBalance'>) => {
    const newClient: Client = {
      ...client,
      id: `cli-${Date.now()}`,
      creditBalance: 0
    };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const deleteClient = (clientId: string) => {
    // 1. Collect cascaded dependent IDs
    const clientVehicles = vehicles.filter(v => v.ownerId === clientId);
    const vehicleIds = clientVehicles.map(v => v.id);
    const clientOrders = orders.filter(o => o.clientId === clientId);
    const orderIds = clientOrders.map(o => o.id);
    const clientPresupuestos = presupuestos.filter(p => p.clientId === clientId);
    const presIds = clientPresupuestos.map(p => p.id);
    const clientOrdenesRep = ordenesReparacion.filter(o => o.clientId === clientId);
    const ordRepIds = clientOrdenesRep.map(o => o.id);
    const clientNotas = notasSalida.filter(n => n.clientId === clientId);
    const notaIds = clientNotas.map(n => n.id);

    const allDeletedIds = [clientId, ...vehicleIds, ...orderIds, ...presIds, ...ordRepIds, ...notaIds];
    recordDeletedIds(allDeletedIds);

    // 2. Immediate local state cleanup
    setClients(prev => prev.filter(c => c.id !== clientId));
    setVehicles(prev => prev.filter(v => v.ownerId !== clientId));
    setOrders(prev => prev.filter(o => o.clientId !== clientId));
    setPresupuestos(prev => prev.filter(p => p.clientId !== clientId));
    setOrdenesReparacion(prev => prev.filter(o => o.clientId !== clientId));
    setNotasSalida(prev => prev.filter(n => n.clientId !== clientId));

    // 3. Delete from Supabase
    Promise.allSettled([
      supabase.from('clients').delete().eq('id', clientId),
      supabase.from('vehicles').delete().eq('ownerId', clientId),
      supabase.from('service_orders').delete().eq('clientId', clientId),
      supabase.from('presupuestos').delete().eq('clientId', clientId),
      supabase.from('ordenes_reparacion').delete().eq('clientId', clientId),
      supabase.from('notas_salida').delete().eq('clientId', clientId)
    ]).then(results => {
      console.log('Client and associated records removed from Supabase successfully.');
    }).catch(err => {
      console.error('Error deleting client from Supabase:', err);
    });
  };

  // 2. Vehicles
  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `veh-${Date.now()}`
    };
    setVehicles(prev => [newVehicle, ...prev]);
    return newVehicle;
  };

  const updateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };

  const deleteVehicle = (vehicleId: string) => {
    const relatedOrders = orders.filter(o => o.vehicleId === vehicleId);
    const orderIds = relatedOrders.map(o => o.id);
    const allDeleted = [vehicleId, ...orderIds];
    recordDeletedIds(allDeleted);

    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    setOrders(prev => prev.filter(o => o.vehicleId !== vehicleId));
    setPresupuestos(prev => prev.filter(p => p.vehicleId !== vehicleId));
    setOrdenesReparacion(prev => prev.filter(o => o.vehicleId !== vehicleId));
    setNotasSalida(prev => prev.filter(n => n.vehicleId !== vehicleId));

    Promise.allSettled([
      supabase.from('vehicles').delete().eq('id', vehicleId),
      supabase.from('service_orders').delete().eq('vehicleId', vehicleId),
      supabase.from('presupuestos').delete().eq('vehicleId', vehicleId),
      supabase.from('ordenes_reparacion').delete().eq('vehicleId', vehicleId),
      supabase.from('notas_salida').delete().eq('vehicleId', vehicleId)
    ]).catch(err => {
      console.error('Error deleting vehicle from Supabase:', err);
    });
  };

  // 3. Employees & Commissions
  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}`
    };
    setEmployees(prev => [newEmployee, ...prev]);
  };

  const updateEmployee = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
  };

  const deleteEmployee = (employeeId: string) => {
    recordDeletedId(employeeId);
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
    supabase.from('employees').delete().eq('id', employeeId).then(({ error }) => {
      if (error) console.error('Error deleting employee from Supabase:', error);
    });
  };

  // 4. Inventory
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `part-${Date.now()}`
    };
    setInventory(prev => [newItem, ...prev]);
  };

  const updateInventoryItem = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const deleteInventoryItem = (itemId: string) => {
    recordDeletedId(itemId);
    setInventory(prev => prev.filter(i => i.id !== itemId));
    supabase.from('inventory').delete().eq('id', itemId).then(({ error }) => {
      if (error) console.error('Error deleting inventory item from Supabase:', error);
    });
  };

  // 5. Purchase Orders
  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id' | 'status'>) => {
    const newPO: PurchaseOrder = {
      ...po,
      id: `OC-${1000 + purchaseOrders.length + 1}`,
      status: 'Pendiente'
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
  };

  const deletePurchaseOrder = (poId: string) => {
    recordDeletedId(poId);
    setPurchaseOrders(prev => prev.filter(p => p.id !== poId));
    supabase.from('purchase_orders').delete().eq('id', poId).then(({ error }) => {
      if (error) console.error('Error deleting purchase order from Supabase:', error);
    });
  };

  const receivePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po || po.status === 'Recibido') return;

    // Update PO status
    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'Recibido' } : p));

    // Update stock & cost average in Inventory
    setInventory(prev => prev.map(invItem => {
      const poLine = po.items.find(pi => pi.itemId === invItem.id);
      if (poLine) {
        const newStock = invItem.stock + poLine.qty;
        // Calculate new weighted cost average:
        const totalPreviousCost = invItem.stock * invItem.cost;
        const totalNewCost = poLine.qty * poLine.cost;
        const newAvgCost = Math.round((totalPreviousCost + totalNewCost) / newStock);
        return {
          ...invItem,
          stock: newStock,
          cost: newAvgCost
        };
      }
      return invItem;
    }));

    // Register Expense Transaction
    const supplier = suppliers.find(s => s.id === po.supplierId);
    addTransaction({
      type: 'Egreso',
      category: 'Proveedor',
      amount: po.total,
      description: `Pago de Orden de Compra ${po.id} a ${supplier?.name || 'Proveedor'}`
    });
  };

  // 6. Service Orders & Workflows
  const createServiceOrder = (orderData: Omit<ServiceOrder, 'id' | 'items' | 'timeLogs' | 'isClockedIn' | 'isPaused' | 'totalHoursWorked' | 'payments'>) => {
    const newId = `OS-${1000 + orders.length + 1}`;
    const newOrder: ServiceOrder = {
      ...orderData,
      id: newId,
      items: [],
      timeLogs: [],
      isClockedIn: false,
      isPaused: false,
      totalHoursWorked: 0,
      payments: []
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedOrder: ServiceOrder = { ...o, status };
        if (status === 'Listo_Entrega' && !o.dateClosed) {
          updatedOrder.dateClosed = new Date().toISOString().split('T')[0];
        }
        return updatedOrder;
      }
      return o;
    }));
  };

  const updateOrderDiagnostics = (orderId: string, diagnostics: string, photos: string[] = []) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          diagnostics,
          diagnosticPhotos: [...o.diagnosticPhotos, ...photos]
        };
      }
      return o;
    }));
  };

  // Edit / Add Items to Order Quote (items)
  const addOrderItem = (orderId: string, item: Omit<BudgetLineItem, 'id' | 'approved'>) => {
    const newItem: BudgetLineItem = {
      ...item,
      id: `item-${Date.now()}`,
      approved: null // Starts as pending approval
    };
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: [...o.items, newItem]
        };
      }
      return o;
    }));
  };

  const deleteOrderItem = (orderId: string, itemId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.filter(i => i.id !== itemId)
        };
      }
      return o;
    }));
  };

  const deleteServiceOrder = (orderId: string) => {
    // 1. Gather linked requisitions and child records
    const linkedReqs = requisitions.filter(r => r.orderId === orderId);
    const reqIds = linkedReqs.map(r => r.id);
    const allDeletedIds = [orderId, ...reqIds];
    recordDeletedIds(allDeletedIds);

    // 2. Remove locally
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setRequisitions(prev => prev.filter(r => r.orderId !== orderId));

    // 3. Remove in Supabase
    Promise.allSettled([
      supabase.from('service_orders').delete().eq('id', orderId),
      supabase.from('requisitions').delete().eq('orderId', orderId)
    ]).then(() => {
      console.log(`Service order ${orderId} permanently removed from Supabase.`);
    }).catch(err => {
      console.error('Error deleting service order from Supabase:', err);
    });
  };

  const approveBudgetLine = (orderId: string, itemId: string, approved: boolean) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(item => {
          if (item.id === itemId) {
            return { ...item, approved };
          }
          return item;
        });
        
        // If an item requires parts and gets approved, we might automatically suggest waiting for parts,
        // or let the staff handle that transition.
        return {
          ...o,
          items: updatedItems
        };
      }
      return o;
    }));
  };

  // Clock-in / Clock-out mechanics logic
  const clockInOrder = (orderId: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newLog: TimeLog = { action: o.isPaused ? 'resume' : 'start', timestamp: now };
        return {
          ...o,
          isClockedIn: true,
          isPaused: false,
          timeLogs: [...o.timeLogs, newLog]
        };
      }
      return o;
    }));
  };

  const pauseOrder = (orderId: string, reason: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newLog: TimeLog = { action: 'pause', timestamp: now, reason };
        
        // Calculate accrued hours from previous start/resume
        let calculatedHours = o.totalHoursWorked;
        const lastLog = o.timeLogs[o.timeLogs.length - 1];
        if (lastLog && (lastLog.action === 'start' || lastLog.action === 'resume')) {
          const diffMs = new Date(now).getTime() - new Date(lastLog.timestamp).getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          calculatedHours += parseFloat(diffHours.toFixed(2));
        }

        return {
          ...o,
          isClockedIn: false,
          isPaused: true,
          totalHoursWorked: calculatedHours,
          timeLogs: [...o.timeLogs, newLog],
          status: reason === 'Falta de refacción' ? 'Esperando_Refacciones' : o.status
        };
      }
      return o;
    }));
  };

  const clockOutOrder = (orderId: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newLog: TimeLog = { action: 'stop', timestamp: now };
        
        // Calculate final hours
        let calculatedHours = o.totalHoursWorked;
        const lastLog = o.timeLogs[o.timeLogs.length - 1];
        if (lastLog && (lastLog.action === 'start' || lastLog.action === 'resume')) {
          const diffMs = new Date(now).getTime() - new Date(lastLog.timestamp).getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          calculatedHours += parseFloat(diffHours.toFixed(2));
        }

        return {
          ...o,
          isClockedIn: false,
          isPaused: false,
          totalHoursWorked: calculatedHours,
          timeLogs: [...o.timeLogs, newLog]
        };
      }
      return o;
    }));
  };

  // 7. Part Requisitions (Mechanic -> Warehouse)
  const submitPartRequisition = (orderId: string, itemId: string, qty: number, mechanicId: string) => {
    const newReq: PartRequisition = {
      id: `req-${Date.now()}`,
      orderId,
      itemId,
      qty,
      mechanicId,
      status: 'Pendiente',
      date: new Date().toISOString().split('T')[0]
    };
    setRequisitions(prev => [newReq, ...prev]);
  };

  const handleRequisitionStatus = (reqId: string, status: 'Despachado' | 'Rechazado') => {
    const req = requisitions.find(r => r.id === reqId);
    if (!req || req.status !== 'Pendiente') return;

    // Update req status
    setRequisitions(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));

    if (status === 'Despachado') {
      // Deduct stock
      setInventory(prev => prev.map(item => {
        if (item.id === req.itemId) {
          return {
            ...item,
            stock: Math.max(0, item.stock - req.qty)
          };
        }
        return item;
      }));

      // Add to Service Order parts (approved automatically since dispatched by stock room)
      const inventoryPart = inventory.find(i => i.id === req.itemId);
      if (inventoryPart) {
        const orderPartItem: Omit<BudgetLineItem, 'id' | 'approved'> = {
          type: 'refaccion',
          description: `${inventoryPart.name} (Código: ${inventoryPart.code})`,
          qty: req.qty,
          unitPrice: inventoryPart.price
        };
        // Add to order items
        setOrders(prev => prev.map(o => {
          if (o.id === req.orderId) {
            // Check if parts is already in items: if yes, increase qty. If not, add new line.
            const existingIndex = o.items.findIndex(it => it.description.includes(inventoryPart.code));
            if (existingIndex !== -1) {
              const updatedItems = [...o.items];
              updatedItems[existingIndex] = {
                ...updatedItems[existingIndex],
                qty: updatedItems[existingIndex].qty + req.qty,
                approved: true
              };
              return { ...o, items: updatedItems };
            } else {
              const newItem: BudgetLineItem = {
                id: `item-${Date.now()}`,
                ...orderPartItem,
                approved: true
              };
              return { ...o, items: [...o.items, newItem] };
            }
          }
          return o;
        }));
      }
    }
  };

  const deleteRequisition = (reqId: string) => {
    recordDeletedId(reqId);
    setRequisitions(prev => prev.filter(r => r.id !== reqId));
    supabase.from('requisitions').delete().eq('id', reqId).then(({ error }) => {
      if (error) console.error('Error deleting requisition from Supabase:', error);
    });
  };

  // 8. Financial Transactions (Payments / Invoicing)
  const addTransaction = (tx: Omit<Transaction, 'id' | 'date'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const deleteTransaction = (txId: string) => {
    recordDeletedId(txId);
    setTransactions(prev => prev.filter(t => t.id !== txId));
    supabase.from('transactions').delete().eq('id', txId).then(({ error }) => {
      if (error) console.error('Error deleting transaction from Supabase:', error);
    });
  };

  const registerOrderPayment = (orderId: string, amount: number, method: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Credito') => {
    const paymentId = `pay-${Date.now()}`;
    const paymentDate = new Date().toISOString();
    
    // Add payment to service order
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          payments: [...o.payments, { id: paymentId, amount, date: paymentDate, method }]
        };
      }
      return o;
    }));

    // If method is Credit, increase Client's credit balance
    const order = orders.find(o => o.id === orderId);
    if (order && method === 'Credito') {
      setClients(prev => prev.map(c => {
        if (c.id === order.clientId) {
          return {
            ...c,
            creditBalance: c.creditBalance + amount
          };
        }
        return c;
      }));
    }

    // Register income transaction
    const client = clients.find(c => c.id === order?.clientId);
    addTransaction({
      type: 'Ingreso',
      category: 'Pago_Cliente',
      amount,
      description: `Pago ${method} por Orden ${orderId} - Cliente: ${client?.name || 'Cliente'}`,
      referenceId: orderId
    });
  };

  const handleClientCreditPayment = (clientId: string, amount: number, method: 'Efectivo' | 'Tarjeta' | 'Transferencia') => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          creditBalance: Math.max(0, c.creditBalance - amount)
        };
      }
      return c;
    }));

    const client = clients.find(c => c.id === clientId);
    addTransaction({
      type: 'Ingreso',
      category: 'Pago_Cliente',
      amount,
      description: `Abono a cuenta de crédito - Cliente: ${client?.name || 'Cliente'}`
    });
  };

  // 9. Suppliers
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`
    };
    setSuppliers(prev => [newSupplier, ...prev]);
  };

  const deleteSupplier = (supplierId: string) => {
    recordDeletedId(supplierId);
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    supabase.from('suppliers').delete().eq('id', supplierId).then(({ error }) => {
      if (error) console.error('Error deleting supplier from Supabase:', error);
    });
  };

  // 7. Presupuestos (Budgets / Estimates)
  const addPresupuesto = (p: Omit<Presupuesto, 'id' | 'createdAt'>): Presupuesto => {
    const newId = `pres-${Date.now()}`;
    const newPresupuesto: Presupuesto = {
      ...p,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setPresupuestos(prev => [newPresupuesto, ...prev]);
    return newPresupuesto;
  };

  const updatePresupuesto = (updated: Presupuesto) => {
    setPresupuestos(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deletePresupuesto = (id: string) => {
    recordDeletedId(id);
    setPresupuestos(prev => prev.filter(p => p.id !== id));
    supabase.from('presupuestos').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Error deleting presupuesto from Supabase:', error);
    });
  };

  const addOrdenReparacion = (ord: Omit<OrdenReparacion, 'id' | 'createdAt'>) => {
    const newId = `ord-${Date.now()}`;
    const newOrd: OrdenReparacion = {
      ...ord,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setOrdenesReparacion(prev => [newOrd, ...prev]);
    return newOrd;
  };

  const updateOrdenReparacion = (updated: OrdenReparacion) => {
    setOrdenesReparacion(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const deleteOrdenReparacion = (id: string) => {
    recordDeletedId(id);
    setOrdenesReparacion(prev => prev.filter(o => o.id !== id));
    supabase.from('ordenes_reparacion').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Error deleting orden de reparacion from Supabase:', error);
    });
  };

  const convertPresupuestoToOrder = (presupuestoId: string): ServiceOrder | null => {
    const pres = presupuestos.find(p => p.id === presupuestoId);
    if (!pres) return null;

    // 1. Find or create client
    let client = clients.find(c => c.name.toLowerCase() === pres.clienteNombre.toLowerCase() || (pres.clienteTelefono && c.phone === pres.clienteTelefono));
    let clientId = client ? client.id : '';
    if (!client) {
      const newClient = addClient({
        name: pres.clienteNombre || 'Cliente Presupuesto',
        phone: pres.clienteTelefono || '55-0000-0000',
        email: 'cliente@ejemplo.com',
        address: pres.clienteCalle || 'CDMX',
        creditLimit: 0,
        calle: pres.clienteCalle,
        cp: pres.clienteCpColonia.split(' ')[0] || '',
        colonia: pres.clienteCpColonia,
        alcaldia: pres.clienteAlcaldia
      });
      clientId = newClient.id;
    }

    // 2. Find or create vehicle
    let vehicle = vehicles.find(v => (v.plate && pres.matriculaVin && pres.matriculaVin.includes(v.plate)) || v.ownerId === clientId);
    let vehicleId = vehicle ? vehicle.id : '';
    if (!vehicle) {
      const parts = pres.marcaMotor.split('/');
      const brand = parts[0]?.trim() || 'Desconocida';
      const newVeh = addVehicle({
        ownerId: clientId,
        brand,
        model: pres.modeloColor.split('/')[0]?.trim() || 'Modelo',
        year: 2020,
        plate: pres.matriculaVin.split('/')[0]?.trim() || 'SIN-PLACA',
        vin: pres.matriculaVin.split('/')[1]?.trim() || 'VIN-000',
        mileage: pres.kilometros || 0,
        color: pres.modeloColor.split('/')[1]?.trim() || 'Blanco',
        engomadoColor: 'pink',
        plateEnding: '8'
      });
      vehicleId = newVeh.id;
    }

    // 3. Create Service Order with items
    const newId = `OS-${1000 + orders.length + 1}`;
    const budgetItems: BudgetLineItem[] = pres.items.map((item, idx) => ({
      id: `bli-${idx + 1}`,
      type: item.descripcion.toLowerCase().includes('mano de obra') ? 'mano_de_obra' : 'refaccion',
      description: item.descripcion,
      qty: item.cantidad,
      unitPrice: item.importeUnitario,
      approved: true
    }));

    const newOrder: ServiceOrder = {
      id: newId,
      clientId,
      vehicleId,
      advisorId: 'emp-1',
      mechanicId: 'emp-2',
      reportedFailure: `Presupuesto Folio #${pres.numero}: ${pres.items.slice(0, 3).map(i => i.descripcion).join(', ')}`,
      checklist: {
        scratches: false,
        dents: false,
        fuelLevel: 50,
        tools: true,
        spareTire: true,
        jack: true,
        extinguisher: false,
        photos: []
      },
      diagnostics: `Generado automáticamente a partir del Presupuesto #${pres.numero} (${pres.fecha})`,
      diagnosticPhotos: [],
      status: 'Diagnostico',
      items: budgetItems,
      timeLogs: [],
      isClockedIn: false,
      isPaused: false,
      totalHoursWorked: 0,
      dateOpened: new Date().toISOString().split('T')[0],
      payments: [],
      folio: pres.numero,
      fecha: pres.fecha,
      tecnico: pres.asesor
    };

    setOrders(prev => [newOrder, ...prev]);

    // Mark budget as converted
    updatePresupuesto({
      ...pres,
      status: 'Convertido',
      serviceOrderId: newId
    });

    return newOrder;
  };

  const addNotaSalida = (nota: Omit<NotaSalida, 'id' | 'createdAt'>) => {
    const newNota: NotaSalida = {
      ...nota,
      id: `sal-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setNotasSalida(prev => [newNota, ...prev]);
    return newNota;
  };

  const updateNotaSalida = (nota: NotaSalida) => {
    setNotasSalida(prev => prev.map(n => n.id === nota.id ? nota : n));
  };

  const deleteNotaSalida = (id: string) => {
    recordDeletedId(id);
    setNotasSalida(prev => prev.filter(n => n.id !== id));
    supabase.from('notas_salida').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Error deleting nota de salida from Supabase:', error);
    });
  };

  // Reset database to initial values
  const resetDatabase = () => {
    try {
      localStorage.removeItem(DELETED_IDS_KEY);
      localStorage.removeItem('wt_initialized');
    } catch (e) {
      console.warn('Error resetting deleted ids storage:', e);
    }

    setClients(INITIAL_CLIENTS);
    setVehicles(INITIAL_VEHICLES);
    setEmployees(INITIAL_EMPLOYEES);
    setInventory(INITIAL_INVENTORY);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setRequisitions(INITIAL_REQUISITIONS);
    setOrders(INITIAL_ORDERS);
    setPresupuestos(INITIAL_PRESUPUESTOS);
    setOrdenesReparacion(INITIAL_ORDENES_REPARACION);
    setNotasSalida(INITIAL_NOTAS_SALIDA);
    setTransactions(INITIAL_TRANSACTIONS);
    setSettings(INITIAL_SETTINGS);
    
    localStorage.setItem('wt_clients', JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem('wt_vehicles', JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem('wt_employees', JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem('wt_inventory', JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem('wt_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
    localStorage.setItem('wt_purchase_orders', JSON.stringify(INITIAL_PURCHASE_ORDERS));
    localStorage.setItem('wt_requisitions', JSON.stringify(INITIAL_REQUISITIONS));
    localStorage.setItem('wt_orders', JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem('wt_presupuestos', JSON.stringify(INITIAL_PRESUPUESTOS));
    localStorage.setItem('wt_ordenes_reparacion', JSON.stringify(INITIAL_ORDENES_REPARACION));
    localStorage.setItem('wt_notas_salida', JSON.stringify(INITIAL_NOTAS_SALIDA));
    localStorage.setItem('wt_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem('wt_settings', JSON.stringify(INITIAL_SETTINGS));
  };

  return {
    clients,
    vehicles,
    employees,
    inventory,
    suppliers,
    purchaseOrders,
    requisitions,
    orders,
    presupuestos,
    ordenesReparacion,
    notasSalida,
    transactions,
    settings,
    setSettings,
    
    // Supabase Sync State & Actions
    isSyncing,
    supabaseConnected,
    syncError,
    fetchFromSupabase,
    uploadToSupabase,
    
    // Actions
    addClient,
    updateClient,
    deleteClient,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addPurchaseOrder,
    receivePurchaseOrder,
    deletePurchaseOrder,
    createServiceOrder,
    deleteServiceOrder,
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
    deleteRequisition,
    addTransaction,
    deleteTransaction,
    registerOrderPayment,
    handleClientCreditPayment,
    addSupplier,
    deleteSupplier,
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
  };
}
