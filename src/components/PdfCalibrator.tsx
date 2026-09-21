import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Save, RotateCcw, Download, ZoomIn, ZoomOut, Move, 
  Database, Copy, Check, Crosshair, Search, ChevronRight, Sliders,
  Eye, AlertCircle, Info, Sparkles, CheckCircle2, ChevronDown
} from 'lucide-react';
import { 
  PdfTemplateConfig, 
  PdfTemplateField, 
  TemplateSection,
  DEFAULT_FORMATO_1,
  INITIAL_TEMPLATES_MAP,
  getTemplateConfig, 
  saveTemplateConfig, 
  resetTemplateConfig,
  SUPABASE_SQL_SCRIPT
} from '../utils/pdfTemplateStorage';
import { generateSaePdf } from '../utils/saePdf';
import { ServiceOrder, Client, Vehicle, Employee } from '../types';

interface PdfCalibratorProps {
  orders?: ServiceOrder[];
  clients?: Client[];
  vehicles?: Vehicle[];
  employees?: Employee[];
}

export default function PdfCalibrator({
  orders = [],
  clients = [],
  vehicles = [],
  employees = []
}: PdfCalibratorProps) {
  // Format selector
  const [selectedFormatId, setSelectedFormatId] = useState<string>('formato1');
  const [config, setConfig] = useState<PdfTemplateConfig>(() => getTemplateConfig('formato1'));
  
  // Selected field for fine adjustment
  const [selectedFieldId, setSelectedFieldId] = useState<string>('folio');
  const [activeSection, setActiveSection] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Canvas zoom
  const [zoom, setZoom] = useState<number>(1);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartPosRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  
  // UI notifications and modal
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Load config when format changes
  useEffect(() => {
    const loaded = getTemplateConfig(selectedFormatId);
    setConfig(loaded);
    if (loaded.fields.length > 0) {
      setSelectedFieldId(loaded.fields[0].id);
    }
  }, [selectedFormatId]);

  const selectedField = config.fields.find(f => f.id === selectedFieldId) || config.fields[0];

  // Update a field's properties
  const updateField = (id: string, updates: Partial<PdfTemplateField>) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  // Nudge coordinates
  const nudge = (dx: number, dy: number) => {
    if (!selectedField) return;
    const newX = Math.max(0, Math.min(config.width, selectedField.x + dx));
    const newY = Math.max(0, Math.min(config.height, selectedField.y + dy));
    updateField(selectedField.id, { x: newX, y: newY });
  };

  // Keyboard navigation for precision adjustment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (!selectedField) return;

      const step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudge(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudge(0, step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudge(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudge(step, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedField]);

  // Handle Save
  const handleSave = async () => {
    const res = await saveTemplateConfig(config);
    setSaveStatus({
      message: res.message,
      type: res.success ? 'success' : 'error'
    });
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Handle Reset to Gemini Defaults
  const handleReset = () => {
    if (window.confirm('¿Deseas restablecer las coordenadas a los valores iniciales recomendados por Gemini?')) {
      const def = resetTemplateConfig(selectedFormatId);
      setConfig(def);
      setSaveStatus({
        message: 'Coordenadas restablecidas a los valores de calibración iniciales.',
        type: 'success'
      });
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Test PDF generation with current coordinates
  const handleTestPdfDownload = async () => {
    setIsGeneratingPdf(true);
    try {
      // First save current state so PDF generator reads latest
      await saveTemplateConfig(config);

      // Create a sample order or use the first existing order
      const sampleOrder: ServiceOrder = orders.length > 0 ? orders[0] : {
        id: 'OS-0409',
        folio: '409A',
        clientId: 'client-1',
        vehicleId: 'veh-1',
        advisorId: 'emp-1',
        mechanicId: 'emp-2',
        reportedFailure: 'Revisión general de frenos y afinación de motor',
        diagnostics: 'Inspección completada conforme a protocolo',
        diagnosticPhotos: [],
        status: 'En_Reparacion',
        items: [],
        timeLogs: [],
        isClockedIn: false,
        isPaused: false,
        totalHoursWorked: 2.5,
        dateOpened: '2026-09-21 19:29',
        payments: [],
        fecha: '2026-09-21',
        hora: '19:29',
        tecnico: 'Martín "El Tuercas" Domínguez',
        checklist: {
          scratches: false,
          dents: false,
          fuelLevel: 50,
          tools: false,
          spareTire: false,
          jack: true,
          extinguisher: true,
          photos: [],
          tapetes: true,
          encendedor: true,
          estereo: true,
          tarjetaCirculacion: false,
          compVerificacion: false,
          polizaSeguro: false,
          segurosRuedas: true,
          extintor: true,
          sensoresPresencia: false,
          camaraReversa: false,
          inspeccionMotor: 'Ninguno',
          objetosValor: 'Prueba'
        }
      };

      const sampleClient: Client = clients.length > 0 ? clients[0] : {
        id: 'client-1',
        name: 'Sofia Rodriguez Vega',
        phone: '55 9876 1234',
        email: 'sofia.vega@hotmail.com',
        address: 'Av. Revolución 1024, Mixcoac, CDMX',
        calle: 'Av. Revolución 1024',
        cp: '03910',
        colonia: 'Mixcoac',
        alcaldia: 'Benito Juárez',
        telFijo: '55 1234 5678',
        creditLimit: 5000,
        creditBalance: 0
      };

      const sampleVehicle: Vehicle = vehicles.length > 0 ? vehicles[0] : {
        id: 'veh-1',
        ownerId: 'client-1',
        brand: 'Chevrolet',
        model: 'Aveo',
        year: 2018,
        plate: '789-DEF',
        vin: '3G1TA5582TG123587',
        serie: '3G1TA5582TG123587',
        motor: '1.5L 4 Cil',
        mileage: 89300,
        color: 'Negro Brillante',
        engomadoColor: 'yellow',
        plateEnding: '8'
      };

      await generateSaePdf(sampleOrder, sampleClient, sampleVehicle, employees);
      setSaveStatus({
        message: '¡PDF de prueba generado y descargado con tus coordenadas exactas!',
        type: 'success'
      });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Error generando el PDF de prueba: ' + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Copy SQL script
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Filtered fields list
  const filteredFields = config.fields.filter(f => {
    const matchesSection = activeSection === 'todos' || f.section === activeSection;
    const matchesQuery = !searchQuery || 
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesQuery;
  });

  // Drag handling on visual canvas
  const handleMouseDownOnField = (e: React.MouseEvent, field: PdfTemplateField) => {
    e.stopPropagation();
    setSelectedFieldId(field.id);
    setIsDragging(true);
    dragStartPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: field.x,
      initialY: field.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartPosRef.current || !selectedField) return;
    const deltaX = Math.round((e.clientX - dragStartPosRef.current.mouseX) / zoom);
    const deltaY = Math.round((e.clientY - dragStartPosRef.current.mouseY) / zoom);
    
    const newX = Math.max(0, Math.min(config.width, dragStartPosRef.current.initialX + deltaX));
    const newY = Math.max(0, Math.min(config.height, dragStartPosRef.current.initialY + deltaY));
    
    updateField(selectedField.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartPosRef.current = null;
  };

  return (
    <div id="pdf-calibrator-module" className="space-y-6">
      {/* Header and Format Selector Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
                <Sliders size={20} />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Calibrador de Formatos y Plantillas PDF
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Ajusta manualmente y al milímetro las coordenadas (X, Y) de cada texto, folio y casilla "X" para que encajen a la perfección sobre la plantilla impresa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
              title="Ver el script SQL para crear la tabla sae_pdf_templates en Supabase"
            >
              <Database size={15} className="text-emerald-600" />
              <span>Código SQL Supabase</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
              title="Restablecer a valores de fábrica"
            >
              <RotateCcw size={15} />
              <span>Restablecer</span>
            </button>

            <button
              onClick={handleTestPdfDownload}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF Prueba'}</span>
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#8D6A28] hover:bg-[#aa8134] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#8D6A28]/20 transition-all cursor-pointer"
            >
              <Save size={15} />
              <span>Guardar Calibración</span>
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {saveStatus && (
          <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            saveStatus.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveStatus.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-red-600" />}
            <span>{saveStatus.message}</span>
          </div>
        )}

        {/* 4 Formats Navigation Tabs */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-2">
              Formato:
            </span>
            {[
              { id: 'formato1', label: '1. Orden de Recepción SAE', active: true, badge: 'Calibrando' },
              { id: 'formato2', label: '2. Presupuesto', active: false, badge: 'Próximamente' },
              { id: 'formato3', label: '3. Orden de Reparación', active: false, badge: 'Próximamente' },
              { id: 'formato4', label: '4. Nota de Salida', active: false, badge: 'Próximamente' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFormatId(f.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  selectedFormatId === f.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                  selectedFormatId === f.id
                    ? 'bg-amber-400 text-slate-950'
                    : f.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {f.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls (1/3) & Right Visual Canvas (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Coordinates Fine Controller */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Active Field Fine Controller Card */}
          {selectedField ? (
            <div className="bg-white rounded-2xl border-2 border-amber-500/40 p-4 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                    Campo Seleccionado
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedField.label}
                  </h3>
                  <code className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedField.id}
                  </code>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                    X: {selectedField.x}px | Y: {selectedField.y}px
                  </div>
                </div>
              </div>

              {/* Precise Step Controls (Nudge Buttons) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                {/* Horizontal X Axis */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1 text-blue-700">
                      ↔ Eje Horizontal (X)
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-normal">Valor:</span>
                      <input 
                        type="number"
                        value={selectedField.x}
                        onChange={(e) => updateField(selectedField.id, { x: parseInt(e.target.value) || 0 })}
                        className="w-16 px-1.5 py-0.5 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs"
                      />
                      <span className="text-slate-400">px</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-center font-mono text-[11px]">
                    <button onClick={() => nudge(-10, 0)} className="py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">-10</button>
                    <button onClick={() => nudge(-5, 0)} className="py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">-5</button>
                    <button onClick={() => nudge(-1, 0)} className="py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">-1</button>
                    <button onClick={() => nudge(1, 0)} className="py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">+1</button>
                    <button onClick={() => nudge(5, 0)} className="py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">+5</button>
                    <button onClick={() => nudge(10, 0)} className="py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">+10</button>
                  </div>
                </div>

                {/* Vertical Y Axis */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1 text-purple-700">
                      ↕ Eje Vertical (Y)
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-normal">Valor:</span>
                      <input 
                        type="number"
                        value={selectedField.y}
                        onChange={(e) => updateField(selectedField.id, { y: parseInt(e.target.value) || 0 })}
                        className="w-16 px-1.5 py-0.5 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs"
                      />
                      <span className="text-slate-400">px</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-center font-mono text-[11px]">
                    <button onClick={() => nudge(0, -10)} className="py-1 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">-10</button>
                    <button onClick={() => nudge(0, -5)} className="py-1 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">-5</button>
                    <button onClick={() => nudge(0, -1)} className="py-1 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">-1</button>
                    <button onClick={() => nudge(0, 1)} className="py-1 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">+1</button>
                    <button onClick={() => nudge(0, 5)} className="py-1 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">+5</button>
                    <button onClick={() => nudge(0, 10)} className="py-1 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded font-semibold transition-colors cursor-pointer">+10</button>
                  </div>
                </div>
              </div>

              {/* Typography & Alignment Controls */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Tamaño de Fuente (px)</label>
                  <input
                    type="number"
                    value={selectedField.fontSize || 11}
                    onChange={(e) => updateField(selectedField.id, { fontSize: parseFloat(e.target.value) || 11 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                    min="8"
                    max="28"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Alineación</label>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                    {(['left', 'center', 'right'] as const).map(a => (
                      <button
                        key={a}
                        onClick={() => updateField(selectedField.id, { align: a })}
                        className={`flex-1 py-1.5 text-center text-xs font-bold capitalize transition-colors ${
                          selectedField.align === a ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {a === 'left' ? 'Izq' : a === 'center' ? 'Cen' : 'Der'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Grosor de Letra</label>
                  <select
                    value={selectedField.fontWeight || 'normal'}
                    onChange={(e) => updateField(selectedField.id, { fontWeight: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Negrita (Bold)</option>
                    <option value="900">Pesada (900)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Color del Texto</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedField.color || '#000000'}
                      onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <span className="font-mono text-xs text-slate-600 uppercase">
                      {selectedField.color || '#000000'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-amber-50/50 p-2 rounded-lg border border-amber-200/50 flex items-center gap-1.5">
                <Info size={14} className="text-amber-600 shrink-0" />
                <span>Tip: Puedes usar las <strong>flechas del teclado</strong> (← ↑ ↓ →) para mover el elemento seleccionado con precisión milimétrica (con Shift mueves 5px).</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-xs">
              Selecciona un campo para ver sus coordenadas y ajustarlo.
            </div>
          )}

          {/* Section Filter and Fields List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Catálogo de Campos ({filteredFields.length})
              </h4>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar campo (ej: placas, folio, tapetes)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8D6A28]"
              />
            </div>

            {/* Section Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'encabezado', label: 'Folio' },
                { id: 'cliente', label: 'Cliente' },
                { id: 'auto', label: 'Auto' },
                { id: 'checklist_col1', label: 'Check Col 1' },
                { id: 'checklist_col2', label: 'Check Col 2' },
                { id: 'observaciones', label: 'Observaciones' },
                { id: 'servicio', label: 'Servicio' },
                { id: 'firmas', label: 'Firmas' }
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                    activeSection === sec.id
                      ? 'bg-[#8D6A28] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Scrollable Fields List */}
            <div className="max-h-[360px] overflow-y-auto space-y-1 pr-1 divide-y divide-slate-50">
              {filteredFields.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFieldId(f.id)}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                    selectedFieldId === f.id
                      ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="truncate">{f.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">X: {f.x}px • Y: {f.y}px</div>
                  </div>
                  <ChevronRight size={14} className={selectedFieldId === f.id ? 'text-amber-800' : 'text-slate-300'} />
                </button>
              ))}
              {filteredFields.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  No se encontraron campos con ese criterio.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Visual Live Interactive Canvas (750 x 980) */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Canvas Viewport Toolbar */}
          <div className="bg-slate-900 text-white rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400">Lienzo en Vivo</span>
              <span className="text-slate-400 text-[11px] font-mono">
                Dimensión real PDF: {config.width}px × {config.height}px
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Guides toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={showGuides}
                  onChange={(e) => setShowGuides(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-[11px]">Guías</span>
              </label>

              {/* Bounding box toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={showBoxes}
                  onChange={(e) => setShowBoxes(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-[11px]">Recuadros</span>
              </label>

              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setZoom(z => Math.max(0.4, parseFloat((z - 0.1).toFixed(1))))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Alejar"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="px-2 font-mono text-[11px] text-amber-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(1.5, parseFloat((z + 0.1).toFixed(1))))}
                  className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Acercar"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Scaled Canvas Container */}
          <div 
            className="bg-slate-200 rounded-2xl border border-slate-300 p-4 overflow-auto max-h-[820px] flex justify-center items-start shadow-inner relative"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* The 750 x 980 Stage */}
            <div 
              style={{
                width: `${config.width}px`,
                height: `${config.height}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                position: 'relative',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                userSelect: 'none',
                overflow: 'hidden'
              }}
              className="transition-transform duration-75"
            >
              {/* Background Form Image */}
              <img 
                src={config.bgUrl} 
                alt={config.nombre} 
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
                crossOrigin="anonymous"
              />

              {/* Optional Subtle Calibration Grid */}
              {showGuides && (
                <div 
                  className="absolute inset-0 pointer-events-none z-10 opacity-15"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                  }}
                />
              )}

              {/* Crosshair guidelines passing through the selected element */}
              {showGuides && selectedField && (
                <>
                  <div 
                    className="absolute left-0 w-full border-t border-dashed border-red-500/60 pointer-events-none z-20"
                    style={{ top: `${selectedField.y}px` }}
                  />
                  <div 
                    className="absolute top-0 h-full border-l border-dashed border-red-500/60 pointer-events-none z-20"
                    style={{ left: `${selectedField.x}px` }}
                  />
                </>
              )}

              {/* Render Every Calibrated Field */}
              {config.fields.map(field => {
                const isSelected = field.id === selectedFieldId;
                const sample = field.sampleValue || field.label;

                return (
                  <div
                    key={field.id}
                    onMouseDown={(e) => handleMouseDownOnField(e, field)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFieldId(field.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${field.x}px`,
                      top: `${field.y}px`,
                      fontSize: `${field.fontSize || 11}px`,
                      fontWeight: field.fontWeight || 'normal',
                      color: field.color || '#000000',
                      textAlign: field.align || 'left',
                      width: field.width ? `${field.width}px` : 'auto',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.1,
                      cursor: isDragging && isSelected ? 'grabbing' : 'grab',
                      zIndex: isSelected ? 40 : 25
                    }}
                    className={`transition-shadow select-none ${
                      showBoxes || isSelected ? 'px-0.5' : ''
                    } ${
                      isSelected 
                        ? 'ring-2 ring-amber-500 bg-amber-400/25 rounded shadow-lg' 
                        : showBoxes 
                          ? 'hover:ring-1 hover:ring-blue-400 hover:bg-blue-100/30' 
                          : ''
                    }`}
                    title={`${field.label} (X: ${field.x}px, Y: ${field.y}px)`}
                  >
                    {/* Badge showing coordinate for selected item */}
                    {isSelected && (
                      <span className="absolute -top-5 left-0 bg-slate-900 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-50">
                        {field.id}: ({field.x}, {field.y})
                      </span>
                    )}
                    {sample}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Supabase SQL Script Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Database className="text-emerald-600" size={20} />
                <h3 className="font-bold text-slate-900 text-base">
                  Script SQL para Supabase (sae_pdf_templates)
                </h3>
              </div>
              <button 
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded-lg"
              >
                Cerrar ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Copia este script y ejecútalo en el <strong>SQL Editor</strong> de tu proyecto Supabase para que las calibraciones que guardes se sincronicen en la nube de forma persistente:
            </p>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[300px]">
                {SUPABASE_SQL_SCRIPT}
              </pre>
              <button
                onClick={handleCopySql}
                className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong>Nota:</strong> Incluso sin ejecutar el script en Supabase, tus cambios de coordenadas ya se guardan instantáneamente en el almacenamiento local de este navegador y se aplican de inmediato en cualquier PDF que exportes.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
