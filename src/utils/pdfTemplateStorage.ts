/**
 * PDF Templates Configuration and Storage
 * Supports real-time coordinate calibration for SAE Formats (1, 2, 3, 4).
 */
import { supabase } from '../lib/supabase';

export type TemplateSection = 
  | 'encabezado'
  | 'cliente'
  | 'auto'
  | 'checklist_col1'
  | 'checklist_col2'
  | 'observaciones'
  | 'servicio'
  | 'firmas'
  | 'tabla'
  | 'pie_pagina'
  | 'revisiones'
  | 'encabezado_control'
  | 'datos_cliente'
  | 'datos_vehiculo'
  | 'tabla_repuestos'
  | 'tabla_servicios'
  | 'totales';

export interface PdfTemplateField {
  id: string;
  label: string;
  section: TemplateSection;
  x: number; // in pixels (based on 750px width canvas)
  y: number; // in pixels (based on 980px height canvas)
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '900';
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
  sampleValue?: string;
}

export interface PdfTemplateConfig {
  id: string; // 'formato1' | 'formato2' | 'formato3' | 'formato4'
  nombre: string;
  bgUrl: string;
  width: number;
  height: number;
  fields: PdfTemplateField[];
}

/**
 * Initial Default Configuration for FORMATO 1 (Orden de Recepción SAE)
 * Based on Gemini's analyzed coordinate map for https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato1.png
 */
export const DEFAULT_FORMATO_1: PdfTemplateConfig = {
  id: 'formato1',
  nombre: 'Formato 1: Orden de Recepción SAE',
  bgUrl: 'https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato1.png',
  width: 750,
  height: 980,
  fields: [
    // Encabezado
    {
      id: 'folio',
      label: 'Número de Folio',
      section: 'encabezado',
      x: 655,
      y: 41,
      fontSize: 18,
      fontWeight: '900',
      color: '#D32F2F',
      align: 'center',
      width: 100,
      sampleValue: '409A'
    },

    // Sección 1: Datos del Cliente
    {
      id: 'cliente_nombre',
      label: 'Cliente (Nombre)',
      section: 'cliente',
      x: 145,
      y: 137,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: 'Sofia Rodriguez Vega'
    },
    {
      id: 'cliente_email',
      label: 'Cliente E-Mail',
      section: 'cliente',
      x: 515,
      y: 136,
      fontSize: 10.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'sofia.vega@hotmail.com'
    },
    {
      id: 'cliente_telefono_cel',
      label: 'Cliente Tel. Cel.',
      section: 'cliente',
      x: 135,
      y: 161,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '55 9876 1234'
    },
    {
      id: 'cliente_telefono_fijo',
      label: 'Cliente Tel. Fijo',
      section: 'cliente',
      x: 490,
      y: 161,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '55 1234 5678'
    },
    {
      id: 'cliente_direccion_calle',
      label: 'Cliente Calle y Número',
      section: 'cliente',
      x: 120,
      y: 184,
      fontSize: 10.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Av. Revolución 1024, Mixcoac, CDMX'
    },
    {
      id: 'cliente_cp',
      label: 'Cliente Código Postal (C.P.)',
      section: 'cliente',
      x: 685,
      y: 184,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '03910'
    },
    {
      id: 'cliente_colonia',
      label: 'Cliente Colonia',
      section: 'cliente',
      x: 140,
      y: 208,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Mixcoac'
    },
    {
      id: 'cliente_alcaldia',
      label: 'Cliente Alcaldía / Municipio',
      section: 'cliente',
      x: 575,
      y: 208,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Benito Juárez'
    },

    // Sección 2: Datos del Auto
    {
      id: 'auto_marca',
      label: 'Auto (Marca)',
      section: 'auto',
      x: 140,
      y: 268,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: 'Chevrolet'
    },
    {
      id: 'auto_modelo_anio',
      label: 'Modelo y Año',
      section: 'auto',
      x: 354,
      y: 268,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Aveo (2018)'
    },
    {
      id: 'auto_placas',
      label: 'Placas',
      section: 'auto',
      x: 512,
      y: 268,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: '789-DEF'
    },
    {
      id: 'auto_kilometraje',
      label: 'Kilometraje (Kms)',
      section: 'auto',
      x: 676,
      y: 268,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'center',
      sampleValue: '89,300'
    },
    {
      id: 'auto_serie_vin',
      label: 'No. de Serie / VIN',
      section: 'auto',
      x: 175,
      y: 288,
      fontSize: 10.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '3G1TA5582TG123587'
    },
    {
      id: 'auto_motor',
      label: 'Motor',
      section: 'auto',
      x: 470,
      y: 288,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '1.5L 4 Cil'
    },
    {
      id: 'auto_color',
      label: 'Color del Auto',
      section: 'auto',
      x: 636,
      y: 288,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Negro Brillante'
    },

    // Sección Checklist: Columna 1 (Sí / No)
    {
      id: 'check_tapetes_si',
      label: 'Tapetes [SÍ]',
      section: 'checklist_col1',
      x: 219,
      y: 320,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_tapetes_no',
      label: 'Tapetes [NO]',
      section: 'checklist_col1',
      x: 294,
      y: 320,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_encendedor_si',
      label: 'Encendedor [SÍ]',
      section: 'checklist_col1',
      x: 218,
      y: 343,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_encendedor_no',
      label: 'Encendedor [NO]',
      section: 'checklist_col1',
      x: 294,
      y: 343,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_estereo_si',
      label: 'Estéreo [SÍ]',
      section: 'checklist_col1',
      x: 218,
      y: 368,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_estereo_no',
      label: 'Estéreo [NO]',
      section: 'checklist_col1',
      x: 294,
      y: 368,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_tarjeta_circulacion_si',
      label: 'Tarjeta Circulación [SÍ]',
      section: 'checklist_col1',
      x: 218,
      y: 388,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_tarjeta_circulacion_no',
      label: 'Tarjeta Circulación [NO]',
      section: 'checklist_col1',
      x: 294,
      y: 388,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_verificacion_si',
      label: 'Comp. Verificación [SÍ]',
      section: 'checklist_col1',
      x: 218,
      y: 411,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_verificacion_no',
      label: 'Comp. Verificación [NO]',
      section: 'checklist_col1',
      x: 294,
      y: 411,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_poliza_seguro_si',
      label: 'Póliza Seguro [SÍ]',
      section: 'checklist_col1',
      x: 218,
      y: 434,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_poliza_seguro_no',
      label: 'Póliza Seguro [NO]',
      section: 'checklist_col1',
      x: 294,
      y: 434,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_seguros_ruedas_si',
      label: 'Seguros de Ruedas [SÍ]',
      section: 'checklist_col1',
      x: 218,
      y: 457,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_seguros_ruedas_no',
      label: 'Seguros de Ruedas [NO]',
      section: 'checklist_col1',
      x: 294,
      y: 457,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },

    // Sección Checklist: Columna 2 (Gato, Herramienta, Extintor...)
    {
      id: 'check_gato_si',
      label: 'Gato [SÍ]',
      section: 'checklist_col2',
      x: 560,
      y: 320,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_gato_no',
      label: 'Gato [NO]',
      section: 'checklist_col2',
      x: 634,
      y: 320,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_herramienta_si',
      label: 'Herramienta [SÍ]',
      section: 'checklist_col2',
      x: 560,
      y: 352,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_herramienta_no',
      label: 'Herramienta [NO]',
      section: 'checklist_col2',
      x: 634,
      y: 352,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_extintor_si',
      label: 'Extintor [SÍ]',
      section: 'checklist_col2',
      x: 559,
      y: 371,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_extintor_no',
      label: 'Extintor [NO]',
      section: 'checklist_col2',
      x: 634,
      y: 371,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_llanta_refaccion_si',
      label: 'Llanta de refacción [SÍ]',
      section: 'checklist_col2',
      x: 559,
      y: 394,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_llanta_refaccion_no',
      label: 'Llanta de refacción [NO]',
      section: 'checklist_col2',
      x: 634,
      y: 394,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_sensores_si',
      label: 'Sensores de presencia [SÍ]',
      section: 'checklist_col2',
      x: 559,
      y: 415,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_sensores_no',
      label: 'Sensores de presencia [NO]',
      section: 'checklist_col2',
      x: 635,
      y: 415,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_camara_reversa_si',
      label: 'Cámara de reversa [SÍ]',
      section: 'checklist_col2',
      x: 559,
      y: 440,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'check_camara_reversa_no',
      label: 'Cámara de reversa [NO]',
      section: 'checklist_col2',
      x: 635,
      y: 440,
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
      align: 'center',
      width: 16,
      sampleValue: '✕'
    },
    {
      id: 'gasolina_nivel',
      label: 'Nivel de Gasolina (%)',
      section: 'checklist_col2',
      x: 628,
      y: 440,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#D32F2F',
      align: 'center',
      sampleValue: '50%'
    },

    // Observaciones adicionales
    {
      id: 'observacion_seguros_ruedas',
      label: 'Observación Seguros de Ruedas',
      section: 'observaciones',
      x: 320,
      y: 458,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Inspección visual conforme a protocolo'
    },
    {
      id: 'inspeccion_componentes_motor',
      label: 'Inspección Componentes Motor',
      section: 'observaciones',
      x: 158,
      y: 482,
      fontSize: 10.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Ninguno'
    },
    {
      id: 'objetos_de_valor',
      label: 'Objetos de Valor',
      section: 'observaciones',
      x: 55,
      y: 552,
      fontSize: 10.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      width: 310,
      sampleValue: 'Prueba'
    },

    // Sección 3: Descripción del Servicio
    {
      id: 'servicio_descripcion',
      label: 'Motivo de Visita / Falla',
      section: 'servicio',
      x: 38,
      y: 660,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      width: 320,
      sampleValue: 'Revisión general del sistema de frenos y afinación mayor'
    },
    {
      id: 'servicio_fecha',
      label: 'Fecha de Servicio',
      section: 'servicio',
      x: 80,
      y: 755,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: '2026-09-21'
    },
    {
      id: 'servicio_hora',
      label: 'Hora de Servicio',
      section: 'servicio',
      x: 235,
      y: 755,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: '19:29'
    },
    {
      id: 'servicio_tecnico',
      label: 'Nombre del Técnico / Mecánico',
      section: 'servicio',
      x: 90,
      y: 778,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Martín "El Tuercas" Domínguez'
    },

    // Sección Firmas
    {
      id: 'firma_cliente_grafico',
      label: 'Firma Digital del Cliente',
      section: 'firmas',
      x: 120,
      y: 810,
      width: 190,
      fontSize: 11,
      fontWeight: 'normal',
      color: '#000000',
      align: 'center',
      sampleValue: '[Firma manuscrita]'
    }
  ]
};

/**
 * Placeholder templates for Formatos 2, 3 and 4 ready to receive future coordinates
 */
export const DEFAULT_FORMATO_2: PdfTemplateConfig = {
  id: 'formato2',
  nombre: 'Formato 2: Presupuesto SAE',
  bgUrl: 'https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato%202.png',
  width: 750,
  height: 980,
  fields: [
    // Encabezado / Control
    {
      id: 'numero_salida',
      label: 'Número de Folio / Presupuesto',
      section: 'encabezado',
      x: 490,
      y: 206,
      fontSize: 14,
      fontWeight: '900',
      color: '#D32F2F',
      align: 'left',
      sampleValue: '202'
    },
    {
      id: 'fecha',
      label: 'Fecha del Presupuesto',
      section: 'encabezado',
      x: 620,
      y: 206,
      fontSize: 10.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: '21/09/2026'
    },

    // Datos del Cliente
    {
      id: 'cliente_nombre',
      label: 'CLIENTE (Nombre / Razón Social)',
      section: 'cliente',
      x: 140,
      y: 214,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: 'Congregación de la Misión'
    },
    {
      id: 'cliente_calle',
      label: 'Calle y Número',
      section: 'cliente',
      x: 134,
      y: 239,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Av. San Fernando #154'
    },
    {
      id: 'cliente_cp_colonia',
      label: 'C.P. / Colonia',
      section: 'cliente',
      x: 139,
      y: 258,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '14000 Tlalpan Centro'
    },
    {
      id: 'cliente_alcaldia',
      label: 'Alcaldía / Municipio',
      section: 'cliente',
      x: 137,
      y: 276,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Tlalpan'
    },
    {
      id: 'cliente_telefono',
      label: 'Teléfono',
      section: 'cliente',
      x: 134,
      y: 293,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '73 5266 8332'
    },

    // Datos del Vehículo
    {
      id: 'vehiculo_marca_motor',
      label: 'Marca / Motor',
      section: 'auto',
      x: 516,
      y: 240,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: 'FORD-RANGER / 2.3L'
    },
    {
      id: 'vehiculo_modelo_color',
      label: 'Modelo / Color',
      section: 'auto',
      x: 520,
      y: 259,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '2012 / BLANCO'
    },
    {
      id: 'vehiculo_matricula',
      label: 'Matrícula / Placas',
      section: 'auto',
      x: 495,
      y: 277,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: '865-XXJ'
    },
    {
      id: 'vehiculo_kilometros',
      label: 'Kilómetros',
      section: 'auto',
      x: 504,
      y: 295,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '161,282 km'
    },

    // Tabla de Repuestos / Partidas (Muestra de renglones calibrados)
    // Renglón 1
    {
      id: 'tabla_r1_codigo',
      label: 'R1: Código',
      section: 'tabla',
      x: 73,
      y: 345,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'KIT-01'
    },
    {
      id: 'tabla_r1_descripcion',
      label: 'R1: Descripción Repuesto / Servicio',
      section: 'tabla',
      x: 107,
      y: 345,
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Cambio de balatas delanteras cerámicas'
    },
    {
      id: 'tabla_r1_cantidad',
      label: 'R1: Cantidad',
      section: 'tabla',
      x: 536,
      y: 345,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: '1'
    },
    {
      id: 'tabla_r1_unitario',
      label: 'R1: Importe Unitario',
      section: 'tabla',
      x: 611,
      y: 345,
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'right',
      sampleValue: '1,450.00'
    },
    {
      id: 'tabla_r1_total',
      label: 'R1: Total Partida',
      section: 'tabla',
      x: 681,
      y: 345,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'right',
      sampleValue: '1,450.00'
    },

    // Renglón 2
    {
      id: 'tabla_r2_codigo',
      label: 'R2: Código',
      section: 'tabla',
      x: 73,
      y: 368,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'MNT-04'
    },
    {
      id: 'tabla_r2_descripcion',
      label: 'R2: Descripción Repuesto / Servicio',
      section: 'tabla',
      x: 107,
      y: 368,
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Rectificado de discos de freno delanteros'
    },
    {
      id: 'tabla_r2_cantidad',
      label: 'R2: Cantidad',
      section: 'tabla',
      x: 536,
      y: 368,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: '2'
    },
    {
      id: 'tabla_r2_unitario',
      label: 'R2: Importe Unitario',
      section: 'tabla',
      x: 611,
      y: 368,
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'right',
      sampleValue: '350.00'
    },
    {
      id: 'tabla_r2_total',
      label: 'R2: Total Partida',
      section: 'tabla',
      x: 681,
      y: 368,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'right',
      sampleValue: '700.00'
    },

    // Renglón 3
    {
      id: 'tabla_r3_codigo',
      label: 'R3: Código',
      section: 'tabla',
      x: 73,
      y: 391,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'MO-02'
    },
    {
      id: 'tabla_r3_descripcion',
      label: 'R3: Descripción Repuesto / Servicio',
      section: 'tabla',
      x: 107,
      y: 391,
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Mano de obra y purga de sistema de frenos'
    },
    {
      id: 'tabla_r3_cantidad',
      label: 'R3: Cantidad',
      section: 'tabla',
      x: 536,
      y: 391,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: '1'
    },
    {
      id: 'tabla_r3_unitario',
      label: 'R3: Importe Unitario',
      section: 'tabla',
      x: 611,
      y: 391,
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'right',
      sampleValue: '850.00'
    },
    {
      id: 'tabla_r3_total',
      label: 'R3: Total Partida',
      section: 'tabla',
      x: 681,
      y: 391,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'right',
      sampleValue: '850.00'
    },

    // Pie de Página
    {
      id: 'orden_de_servicio_numero',
      label: "Ord. de Servicio # (Espacio derecha de 'ORD. DE SERV. #')",
      section: 'pie_pagina',
      x: 504,
      y: 929,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: 'OS-409A'
    },
    {
      id: 'total_general',
      label: "Total General (Casilla blanca debajo de 'Total')",
      section: 'pie_pagina',
      x: 681,
      y: 933,
      fontSize: 12.5,
      fontWeight: '900',
      color: '#000000',
      align: 'right',
      sampleValue: '$3,000.00'
    },
    {
      id: 'forma_pago',
      label: 'Forma de Pago',
      section: 'pie_pagina',
      x: 140,
      y: 929,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: 'CONTADO'
    }
  ]
};

export const DEFAULT_FORMATO_3: PdfTemplateConfig = {
  id: 'formato3',
  nombre: 'Formato 3: Orden de Reparación SAE',
  bgUrl: 'https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato%203.png',
  width: 750,
  height: 980,
  fields: [
    // Encabezado / Control
    {
      id: 'fecha',
      label: 'Fecha (Línea a la derecha de Fecha:)',
      section: 'encabezado',
      x: 454,
      y: 138,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: '07/07/2026'
    },
    {
      id: 'numero_orden',
      label: 'Número de Orden (Línea derecha de Número:)',
      section: 'encabezado',
      x: 635,
      y: 138,
      fontSize: 15,
      fontWeight: '900',
      color: '#D32F2F',
      align: 'left',
      sampleValue: '180'
    },

    // Revisiones Rápidas
    {
      id: 'rotacion_presion_aire',
      label: 'Rotación y Presión de Aire a Llantas',
      section: 'revisiones',
      x: 330,
      y: 191,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'OK'
    },
    {
      id: 'rev_limpiaparabrisas',
      label: 'Rev. Limpia Parabrisas y Chisgueteros',
      section: 'revisiones',
      x: 334,
      y: 227,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'OK'
    },
    {
      id: 'rev_luces',
      label: 'Rev. de Luces',
      section: 'revisiones',
      x: 160,
      y: 261,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'OK'
    },
    {
      id: 'rev_niveles_general',
      label: 'Y Niveles en General',
      section: 'revisiones',
      x: 323,
      y: 261,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'OK'
    },

    // Datos del Vehículo
    {
      id: 'matricula_placas',
      label: 'Matrícula / Placas (Línea derecha de Matrícula:)',
      section: 'auto',
      x: 480,
      y: 188,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: '865-XXJ'
    },
    {
      id: 'marca_motor',
      label: 'Marca / Motor (Línea derecha de Marca/Motor:)',
      section: 'auto',
      x: 495,
      y: 212,
      fontSize: 10.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'FORD-RANGER / 2.3L'
    },
    {
      id: 'modelo_color',
      label: 'Modelo / Color (Línea derecha de Modelo/Color:)',
      section: 'auto',
      x: 500,
      y: 237,
      fontSize: 10.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '2012 / BLANCO'
    },
    {
      id: 'kilometraje',
      label: 'Kms. (Línea derecha de Kms.:)',
      section: 'auto',
      x: 450,
      y: 259,
      fontSize: 10.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: '161,282 km'
    },

    // Tabla de Repuestos - Renglones de muestra
    // Renglón 1
    {
      id: 'tabla_r1_marca',
      label: 'R1: Marca',
      section: 'tabla',
      x: 82,
      y: 320,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'BREMBO'
    },
    {
      id: 'tabla_r1_descripcion',
      label: 'R1: Descripción Repuesto / Trabajo',
      section: 'tabla',
      x: 128,
      y: 320,
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Juego de balatas cerámicas delanteras'
    },
    {
      id: 'tabla_r1_cantidad',
      label: 'R1: Cantidad',
      section: 'tabla',
      x: 664,
      y: 320,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: '1'
    },

    // Renglón 2
    {
      id: 'tabla_r2_marca',
      label: 'R2: Marca',
      section: 'tabla',
      x: 82,
      y: 344,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'MOTORCRAFT'
    },
    {
      id: 'tabla_r2_descripcion',
      label: 'R2: Descripción Repuesto / Trabajo',
      section: 'tabla',
      x: 128,
      y: 344,
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Rectificado de discos delanteros'
    },
    {
      id: 'tabla_r2_cantidad',
      label: 'R2: Cantidad',
      section: 'tabla',
      x: 664,
      y: 344,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: '2'
    },

    // Renglón 3
    {
      id: 'tabla_r3_marca',
      label: 'R3: Marca',
      section: 'tabla',
      x: 82,
      y: 368,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: 'SAE-MO'
    },
    {
      id: 'tabla_r3_descripcion',
      label: 'R3: Descripción Repuesto / Trabajo',
      section: 'tabla',
      x: 128,
      y: 368,
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
      sampleValue: 'Mano de obra especializada e instalación'
    },
    {
      id: 'tabla_r3_cantidad',
      label: 'R3: Cantidad',
      section: 'tabla',
      x: 664,
      y: 368,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
      sampleValue: '1'
    },

    // Pie de Formulario
    {
      id: 'tecnico_responsable',
      label: 'Técnico Responsable (Línea al lado de TECNICO)',
      section: 'pie_pagina',
      x: 115,
      y: 934,
      fontSize: 10.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left',
      sampleValue: 'Martín Domínguez (Mecánico en Jefe)'
    }
  ]
};

export const DEFAULT_FORMATO_4: PdfTemplateConfig = {
  id: 'formato4',
  nombre: 'Formato 4: Salida SAE',
  bgUrl: 'https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato%204.png',
  width: 750,
  height: 980,
  fields: [
    // Encabezado y Control
    {
      id: 'numero_salida',
      label: 'Número de Salida',
      section: 'encabezado_control',
      x: 488,
      y: 206,
      fontSize: 14,
      fontFamily: 'monospace',
      fontWeight: '900',
      color: '#DC2626',
      align: 'left'
    },
    // Datos del Cliente
    {
      id: 'cliente_nombre',
      label: 'Cliente (Nombre)',
      section: 'datos_cliente',
      x: 140,
      y: 214,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cliente_calle',
      label: 'Calle y Número',
      section: 'datos_cliente',
      x: 134,
      y: 239,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cliente_cp_colonia',
      label: 'C.P. y Colonia',
      section: 'datos_cliente',
      x: 139,
      y: 258,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cliente_alcaldia',
      label: 'Alcaldía / Municipio',
      section: 'datos_cliente',
      x: 137,
      y: 276,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cliente_telefono',
      label: 'Teléfono',
      section: 'datos_cliente',
      x: 134,
      y: 293,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    // Datos del Vehículo
    {
      id: 'vehiculo_marca_motor',
      label: 'Marca / Motor',
      section: 'datos_vehiculo',
      x: 516,
      y: 240,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'vehiculo_modelo_color',
      label: 'Modelo / Color',
      section: 'datos_vehiculo',
      x: 520,
      y: 259,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'vehiculo_matricula',
      label: 'Matrícula (Placas)',
      section: 'datos_vehiculo',
      x: 495,
      y: 277,
      fontSize: 10,
      fontWeight: '900',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'vehiculo_kilometros',
      label: 'Kilómetros',
      section: 'datos_vehiculo',
      x: 504,
      y: 295,
      fontSize: 9.5,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    // Columnas de la Tabla de Repuestos
    {
      id: 'tabla_r1_codigo',
      label: 'Columna Código',
      section: 'tabla_repuestos',
      x: 73,
      y: 334,
      fontSize: 9,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'tabla_r1_descripcion',
      label: 'Columna Repuestos (Descripción)',
      section: 'tabla_repuestos',
      x: 107,
      y: 334,
      fontSize: 9,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'tabla_r1_cantidad',
      label: 'Columna Cantidad',
      section: 'tabla_repuestos',
      x: 536,
      y: 334,
      fontSize: 9,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'tabla_r1_importe',
      label: 'Columna Importe Unitario',
      section: 'tabla_repuestos',
      x: 611,
      y: 334,
      fontSize: 9,
      fontWeight: 'bold',
      color: '#000000',
      align: 'right'
    },
    {
      id: 'tabla_r1_total',
      label: 'Columna Total Partida',
      section: 'tabla_repuestos',
      x: 681,
      y: 334,
      fontSize: 9,
      fontWeight: 'bold',
      color: '#000000',
      align: 'right'
    },
    // Pie de Página
    {
      id: 'orden_de_servicio_numero',
      label: 'Ord. de Serv. #',
      section: 'pie_pagina',
      x: 504,
      y: 929,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'total_general',
      label: 'Total General',
      section: 'pie_pagina',
      x: 686,
      y: 933,
      fontSize: 13,
      fontFamily: 'monospace',
      fontWeight: '900',
      color: '#000000',
      align: 'right'
    }
  ]
};

export const INITIAL_TEMPLATES_MAP: Record<string, PdfTemplateConfig> = {
  formato1: DEFAULT_FORMATO_1,
  formato2: DEFAULT_FORMATO_2,
  formato3: DEFAULT_FORMATO_3,
  formato4: DEFAULT_FORMATO_4
};

const LOCAL_STORAGE_KEY_PREFIX = 'wt_pdf_template_';

/**
 * Gets the current active template configuration from localStorage (or fallback default)
 */
export function getTemplateConfig(formatId: string = 'formato1'): PdfTemplateConfig {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${formatId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as PdfTemplateConfig;
      // Merge with default fields in case new fields were introduced
      const def = INITIAL_TEMPLATES_MAP[formatId] || DEFAULT_FORMATO_1;
      const fieldMap = new Map(parsed.fields.map(f => [f.id, f]));
      const mergedFields = def.fields.map(df => fieldMap.get(df.id) || df);
      return {
        ...def,
        ...parsed,
        fields: mergedFields
      };
    }
  } catch (err) {
    console.warn(`Error reading template ${formatId} from localStorage:`, err);
  }
  return INITIAL_TEMPLATES_MAP[formatId] || DEFAULT_FORMATO_1;
}

/**
 * Saves a template configuration to localStorage and synchronizes with Supabase
 */
export async function saveTemplateConfig(config: PdfTemplateConfig): Promise<{ success: boolean; cloudSynced: boolean; message: string }> {
  try {
    // 1. Local storage instant persistence
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${config.id}`, JSON.stringify(config));
    
    // 2. Try Supabase cloud persistence
    let cloudSynced = false;
    try {
      const { error } = await supabase.from('sae_pdf_templates').upsert({
        id: config.id,
        nombre: config.nombre,
        bg_url: config.bgUrl,
        canvas_width: config.width,
        canvas_height: config.height,
        fields: config.fields,
        updated_at: new Date().toISOString()
      });
      if (!error) {
        cloudSynced = true;
      } else {
        console.warn('Supabase template upsert note (table might need creation):', error.message);
      }
    } catch (sbErr) {
      console.warn('Supabase offline or table missing:', sbErr);
    }

    return {
      success: true,
      cloudSynced,
      message: cloudSynced 
        ? 'Plantilla guardada localmente y sincronizada con la nube Supabase.' 
        : 'Plantilla guardada con éxito en este dispositivo.'
    };
  } catch (err: any) {
    console.error('Error saving template config:', err);
    return {
      success: false,
      cloudSynced: false,
      message: err.message || 'Error al guardar la plantilla.'
    };
  }
}

/**
 * Restores a template to its initial Gemini-calibrated defaults
 */
export function resetTemplateConfig(formatId: string = 'formato1'): PdfTemplateConfig {
  const def = INITIAL_TEMPLATES_MAP[formatId] || DEFAULT_FORMATO_1;
  localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${formatId}`, JSON.stringify(def));
  return def;
}

/**
 * SQL script needed for Supabase database to persist templates in the cloud
 */
export const SUPABASE_SQL_SCRIPT = `-- ========================================================
-- TABLA PARA CONFIGURACIÓN DE PLANTILLAS Y COORDENADAS PDF
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/gydwduicwpxznmvngwlb/sql
-- ========================================================

CREATE TABLE IF NOT EXISTS sae_pdf_templates (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  bg_url TEXT NOT NULL,
  canvas_width INTEGER DEFAULT 750,
  canvas_height INTEGER DEFAULT 980,
  fields JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar seguridad por filas (RLS)
ALTER TABLE sae_pdf_templates ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública / anónima
DROP POLICY IF EXISTS "Permitir lectura publica de plantillas" ON sae_pdf_templates;
CREATE POLICY "Permitir lectura publica de plantillas" 
ON sae_pdf_templates FOR SELECT USING (true);

-- Política de inserción y actualización
DROP POLICY IF EXISTS "Permitir modificacion de plantillas" ON sae_pdf_templates;
CREATE POLICY "Permitir modificacion de plantillas" 
ON sae_pdf_templates FOR ALL USING (true);

COMMENT ON TABLE sae_pdf_templates IS 'Guarda las posiciones de calibración milimétrica para los formatos de PDF del taller SAE.';

-- SEED: Formato 1 (Orden de Recepción SAE)
INSERT INTO sae_pdf_templates (id, nombre, bg_url, canvas_width, canvas_height, fields)
VALUES (
  'formato1',
  'Formato 1: Orden de Recepción SAE',
  'https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato1.png',
  750,
  980,
  '${JSON.stringify(DEFAULT_FORMATO_1.fields).replace(/'/g, "''")}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  bg_url = EXCLUDED.bg_url,
  canvas_width = EXCLUDED.canvas_width,
  canvas_height = EXCLUDED.canvas_height,
  fields = EXCLUDED.fields,
  updated_at = now();

-- SEED: Formato 2 (Presupuestos SAE)
INSERT INTO sae_pdf_templates (id, nombre, bg_url, canvas_width, canvas_height, fields)
VALUES (
  'formato2',
  'Formato 2: Presupuesto SAE',
  'https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato%202.png',
  750,
  980,
  '${JSON.stringify(DEFAULT_FORMATO_2.fields).replace(/'/g, "''")}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  bg_url = EXCLUDED.bg_url,
  canvas_width = EXCLUDED.canvas_width,
  canvas_height = EXCLUDED.canvas_height,
  fields = EXCLUDED.fields,
  updated_at = now();

-- SEED: Formato 3 (Orden de Reparación SAE)
INSERT INTO sae_pdf_templates (id, nombre, bg_url, canvas_width, canvas_height, fields)
VALUES (
  'formato3',
  'Formato 3: Orden de Reparación SAE',
  'https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato%203.png',
  750,
  980,
  '${JSON.stringify(DEFAULT_FORMATO_3.fields).replace(/'/g, "''")}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  bg_url = EXCLUDED.bg_url,
  canvas_width = EXCLUDED.canvas_width,
  canvas_height = EXCLUDED.canvas_height,
  fields = EXCLUDED.fields,
  updated_at = now();

-- SEED: Formato 4 (Salida SAE)
INSERT INTO sae_pdf_templates (id, nombre, bg_url, canvas_width, canvas_height, fields)
VALUES (
  'formato4',
  'Formato 4: Salida SAE',
  'https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato%204.png',
  750,
  980,
  '${JSON.stringify(DEFAULT_FORMATO_4.fields).replace(/'/g, "''")}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  bg_url = EXCLUDED.bg_url,
  canvas_width = EXCLUDED.canvas_width,
  canvas_height = EXCLUDED.canvas_height,
  fields = EXCLUDED.fields,
  updated_at = now();
`;
