import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ServiceOrder, Client, Vehicle, Employee, Presupuesto, OrdenReparacion, NotaSalida } from '../types';
import { getTemplateConfig } from './pdfTemplateStorage';
import { formatDateToDisplay } from './dateUtils';

/**
 * Returns the raw HTML string representing the official SAE Presupuesto form,
 * styled exactly like the physical paper document.
 */
/**
 * Returns the raw HTML string representing the official SAE Presupuesto form (Formato 2),
 * styled and positioned directly on top of the physical background format using calibrated coordinates.
 */
export function getSaePresupuestoHtml(presupuesto: Presupuesto): string {
  // Load calibrated template configuration for Formato 2
  const template = getTemplateConfig('formato2');
  const formatoBgUrl = template.bgUrl || "https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato%202%20(1).png";

  const getStyle = (fieldId: string, fallback: { x: number; y: number; fontSize?: number; fontWeight?: string; color?: string; align?: string; width?: number }) => {
    const f = template.fields.find(item => item.id === fieldId);
    const x = f ? f.x : fallback.x;
    const y = f ? f.y : fallback.y;
    const fontSize = f?.fontSize ?? fallback.fontSize ?? 11;
    const fontWeight = f?.fontWeight ?? fallback.fontWeight ?? 'normal';
    const color = f?.color ?? fallback.color ?? '#000000';
    const align = f?.align ?? fallback.align ?? 'left';
    const width = f?.width ?? fallback.width;

    return `position: absolute !important; top: ${y}px !important; left: ${x}px !important; ${width ? `width: ${width}px !important;` : ''} text-align: ${align} !important; font-size: ${fontSize}px !important; font-weight: ${fontWeight} !important; color: ${color} !important; line-height: normal !important; white-space: nowrap !important; overflow: visible !important; z-index: 10 !important;`;
  };

  // Get table column coordinates from template fields or fallbacks
  const colCod = template.fields.find(f => f.id === 'tabla_r1_codigo') || { x: 47, y: 330, align: 'center', fontSize: 11 };
  const colDesc = template.fields.find(f => f.id === 'tabla_r1_descripcion') || { x: 106, y: 330, align: 'left', fontSize: 11 };
  const colCant = template.fields.find(f => f.id === 'tabla_r1_cantidad') || { x: 572, y: 330, align: 'center', fontSize: 11 };
  const colUnit = template.fields.find(f => f.id === 'tabla_r1_unitario') || { x: 608, y: 329, align: 'right', fontSize: 11 };
  const colTot = template.fields.find(f => f.id === 'tabla_r1_total') || { x: 674, y: 329, align: 'right', fontSize: 11 };

  const r2Cod = template.fields.find(f => f.id === 'tabla_r2_codigo');
  const startY = (colCod as any).y ?? (colDesc as any).y ?? 330;
  const rowSpacing = r2Cod && (r2Cod as any).y ? Math.max(18, Math.min(45, (r2Cod as any).y - startY)) : 28;

  // Calculate table rows based on calibrated Y and spacing
  const items = presupuesto.items || [];
  const rowsHtml = items.slice(0, 24).map((item, idx) => {
    const yCod = ((colCod as any).y ?? startY) + (idx * rowSpacing);
    const yDesc = ((colDesc as any).y ?? startY) + (idx * rowSpacing);
    const yCant = ((colCant as any).y ?? startY) + (idx * rowSpacing);
    const yUnit = ((colUnit as any).y ?? startY) + (idx * rowSpacing);
    const yTot = ((colTot as any).y ?? startY) + (idx * rowSpacing);
    const itemTotal = item.total || ((item.cantidad || 1) * (item.importeUnitario || 0));
    const descText = (item.descripcion || '').replace(/\r?\n/g, ' ').trim();
    let descFontSize = colDesc.fontSize || 11;
    if (descText.length > 85) {
      descFontSize = Math.min(descFontSize, 8);
    } else if (descText.length > 68) {
      descFontSize = Math.min(descFontSize, 9);
    } else if (descText.length > 52) {
      descFontSize = Math.min(descFontSize, 10);
    }
    const maxDescWidth = Math.max(380, (colCant.x || 572) - (colDesc.x || 106) - 10);

    return `
      <div style="position: absolute !important; top: ${yCod}px !important; left: ${colCod.x}px !important; font-size: ${colCod.fontSize || 11}px !important; font-weight: bold !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colCod.align || 'center'} !important; color: #000000 !important; z-index: 10 !important;">
        ${item.codigo || ''}
      </div>
      <div style="position: absolute !important; top: ${yDesc}px !important; left: ${colDesc.x}px !important; width: ${maxDescWidth}px !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; font-size: ${descFontSize}px !important; font-weight: normal !important; text-align: ${colDesc.align || 'left'} !important; color: #000000 !important; z-index: 10 !important;">
        ${descText}
      </div>
      <div style="position: absolute !important; top: ${yCant}px !important; left: ${colCant.x}px !important; font-size: ${colCant.fontSize || 11}px !important; font-weight: normal !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colCant.align || 'center'} !important; color: #000000 !important; z-index: 10 !important;">
        ${item.cantidad || 1}
      </div>
      <div style="position: absolute !important; top: ${yUnit}px !important; left: ${colUnit.x}px !important; font-size: ${colUnit.fontSize || 11}px !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colUnit.align || 'right'} !important; color: #000000 !important; z-index: 10 !important;">
        $${(item.importeUnitario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div style="position: absolute !important; top: ${yTot}px !important; left: ${colTot.x}px !important; font-size: ${colTot.fontSize || 11}px !important; font-weight: normal !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colTot.align || 'right'} !important; color: #000000 !important; z-index: 10 !important;">
        $${itemTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    `;
  }).join('');

  return `
    <div style="position: relative !important; width: 750px !important; height: 980px !important; margin: 0 auto !important; font-family: 'Arial', 'Helvetica', sans-serif !important; color: #000000 !important; background-color: #FFFFFF !important; box-sizing: border-box !important; overflow: hidden !important;">
      
      <!-- Fondo Oficial Formato 2 (Presupuestos SAE) -->
      <img src="${formatoBgUrl}" crossorigin="anonymous" style="position: absolute !important; top: 0 !important; left: 0 !important; width: 750px !important; height: 980px !important; object-fit: fill !important; z-index: 0 !important;" alt="Fondo Formato 2 Presupuesto SAE" />

      <!-- Capa de Datos Calibrada -->
      <div style="position: absolute !important; top: 0 !important; left: 0 !important; width: 750px !important; height: 980px !important; z-index: 10 !important;">
        
        <!-- Número de Salida / Folio Presupuesto -->
        <div style="${getStyle('numero_salida', { x: 490, y: 206, fontSize: 14, fontWeight: '900', color: '#D32F2F', align: 'left' })}">
          ${presupuesto.numero}
        </div>

        <!-- Fecha -->
        <div style="${getStyle('fecha', { x: 620, y: 206, fontSize: 11, fontWeight: 'bold', color: '#000000', align: 'left' })}">
          ${formatDateToDisplay(presupuesto.fecha)}
        </div>

        <!-- CLIENTE (Nombre / Razón Social) -->
        <div style="${getStyle('cliente_nombre', { x: 140, y: 214, fontSize: 11, fontWeight: 'bold' })}">
          ${presupuesto.clienteNombre || ''}
        </div>

        <!-- Calle -->
        <div style="${getStyle('cliente_calle', { x: 134, y: 239, fontSize: 11 })}">
          ${presupuesto.clienteCalle || ''}
        </div>

        <!-- CP / Colonia -->
        <div style="${getStyle('cliente_cp_colonia', { x: 139, y: 258, fontSize: 11 })}">
          ${presupuesto.clienteCpColonia || ''}
        </div>

        <!-- Alcaldía -->
        <div style="${getStyle('cliente_alcaldia', { x: 137, y: 276, fontSize: 11 })}">
          ${presupuesto.clienteAlcaldia || ''}
        </div>

        <!-- Teléfono -->
        <div style="${getStyle('cliente_telefono', { x: 134, y: 293, fontSize: 11 })}">
          ${presupuesto.clienteTelefono || ''}
        </div>

        <!-- Marca / Motor -->
        <div style="${getStyle('vehiculo_marca_motor', { x: 516, y: 240, fontSize: 11, fontWeight: 'bold' })}">
          ${presupuesto.marcaMotor || ''}
        </div>

        <!-- Modelo / Color -->
        <div style="${getStyle('vehiculo_modelo_color', { x: 520, y: 259, fontSize: 11 })}">
          ${presupuesto.modeloColor || ''}
        </div>

        <!-- Matrícula -->
        <div style="${getStyle('vehiculo_matricula', { x: 495, y: 277, fontSize: 11, fontWeight: 'bold' })}">
          ${presupuesto.matriculaVin || ''}
        </div>

        <!-- Kilómetros -->
        <div style="${getStyle('vehiculo_kilometros', { x: 504, y: 295, fontSize: 11 })}">
          ${presupuesto.kilometros ? `${presupuesto.kilometros.toLocaleString()} Kms` : ''}
        </div>

        <!-- Renglones de la Tabla de Repuestos / Servicios -->
        ${rowsHtml}

        <!-- ORD. DE SERV. # -->
        <div style="${getStyle('orden_de_servicio_numero', { x: 522, y: 955, fontSize: 11, fontWeight: 'bold' })}">
          ${presupuesto.ordenServicioNumero || presupuesto.numero}
        </div>

        <!-- Total General -->
        <div style="${getStyle('total_general', { x: 642, y: 882, fontSize: 11, fontWeight: '900', align: 'right' })}">
          $${(presupuesto.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        <!-- Forma de Pago -->
        <div style="${getStyle('forma_pago', { x: 170, y: 835, fontSize: 11, fontWeight: 'bold' })}">
          ${presupuesto.formaPago || 'CONTADO'}
        </div>

      </div>
    </div>
  `;
}

/**
 * Helper to ensure all images in the HTML container are fully loaded before rendering with html2canvas.
 */
async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  const promises = images.map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });
  await Promise.all(promises);
}

/**
 * Returns the raw HTML string representing the official SAE reception form,
 * styled exactly like the physical paper.
 */
export function getSaeHtml(
  order: ServiceOrder,
  client: Client | undefined,
  vehicle: Vehicle | undefined,
  employees: Employee[]
): string {
  // Find employee names
  const advisorName = employees.find(e => e.id === order.advisorId)?.name || 'Alberto Flores Hdz.';
  const mechanicName = order.tecnico || employees.find(e => e.id === order.mechanicId)?.name || 'Mecánico Asignado';

  // Get date and time
  const dateStr = formatDateToDisplay(order.fecha || (order.dateOpened ? order.dateOpened.split(' ')[0] : ''));
  const timeStr = order.hora || (order.dateOpened && order.dateOpened.split(' ').length > 1 ? order.dateOpened.split(' ')[1].substring(0, 5) : '10:00');

  // Load calibrated template configuration
  const template = getTemplateConfig('formato1');
  const formatoBgUrl = template.bgUrl || "https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato1.png";

  // Helper to get CSS style for any calibrated field with bounding box & overflow protection
  const getStyle = (
    fieldId: string, 
    fallback: { 
      x: number; 
      y: number; 
      fontSize?: number; 
      fontWeight?: string; 
      color?: string; 
      align?: string; 
      width?: number;
      maxWidth?: number;
      maxHeight?: number;
      wrap?: boolean;
      lineHeight?: number | string;
    }
  ) => {
    const f = template.fields.find(item => item.id === fieldId);
    const x = f ? f.x : fallback.x;
    const y = f ? f.y : fallback.y;
    let fontSize = f?.fontSize ?? fallback.fontSize ?? 11;
    // When dynamic auto-shrink is activated (fallback.fontSize is smaller), prioritize smaller size to fit bounding box
    if (fallback.fontSize && fallback.fontSize < fontSize) {
      fontSize = fallback.fontSize;
    }
    const fontWeight = f?.fontWeight ?? fallback.fontWeight ?? 'normal';
    const color = f?.color ?? fallback.color ?? '#000000';
    const align = f?.align ?? fallback.align ?? 'left';
    const width = f?.width ?? fallback.width;
    const maxWidth = fallback.maxWidth ?? width;
    const maxHeight = fallback.maxHeight;
    const wrap = fallback.wrap ?? false;
    const lineHeight = fallback.lineHeight ?? (wrap ? '1.3' : 'normal');

    return `position: absolute !important; top: ${y}px !important; left: ${x}px !important; ${
      width ? `width: ${width}px !important;` : ''
    } ${maxWidth ? `max-width: ${maxWidth}px !important;` : ''} ${
      maxHeight ? `max-height: ${maxHeight}px !important;` : ''
    } text-align: ${align} !important; font-size: ${fontSize}px !important; font-weight: ${fontWeight} !important; color: ${color} !important; line-height: ${lineHeight} !important; ${
      wrap
        ? `white-space: pre-wrap !important; word-break: break-word !important; overflow-wrap: break-word !important; overflow: visible !important;`
        : `white-space: nowrap !important; overflow: visible !important;`
    } z-index: 10 !important;`;
  };

  // Helper for checklist mark ('X')
  const renderCheckMark = (val: boolean | undefined, fieldIdSi: string, fieldIdNo: string, fallbackSi: { x: number; y: number }, fallbackNo: { x: number; y: number }) => {
    const targetId = val === true ? fieldIdSi : fieldIdNo;
    const fallback = val === true ? fallbackSi : fallbackNo;
    const f = template.fields.find(item => item.id === targetId);
    const x = f ? f.x : fallback.x;
    const y = f ? f.y : fallback.y;
    const fontSize = f?.fontSize ?? 13;
    const fontWeight = f?.fontWeight ?? '900';
    const color = f?.color ?? '#000000';
    const width = f?.width ?? 16;
    const align = f?.align ?? 'center';

    return `<div style="position: absolute !important; top: ${y}px !important; left: ${x}px !important; font-weight: ${fontWeight} !important; font-size: ${fontSize}px !important; color: ${color} !important; line-height: 1 !important; width: ${width}px !important; text-align: ${align} !important; z-index: 10 !important;">✕</div>`;
  };

  return `
    <div style="position: relative !important; width: 750px !important; height: 980px !important; margin: 0 auto !important; font-family: 'Arial', 'Helvetica', sans-serif !important; color: #000000 !important; background-color: #FFFFFF !important; box-sizing: border-box !important; overflow: hidden !important;">
      
      <!-- Full Background Form Image -->
      <img src="${formatoBgUrl}" crossorigin="anonymous" style="position: absolute !important; top: 0 !important; left: 0 !important; width: 750px !important; height: 980px !important; object-fit: fill !important; z-index: 0 !important;" alt="Fondo Formato SAE" />

      <!-- Data Overlay Layer (Dynamic values positioned directly over image fields) -->
      <div style="position: absolute !important; top: 0 !important; left: 0 !important; width: 750px !important; height: 980px !important; z-index: 10 !important; font-size: 11px !important;">

        <!-- Folio Number (Positioned inside the capsule box at top right) -->
        <div style="${getStyle('folio', { x: 655, y: 38, fontSize: 18, fontWeight: '900', color: '#D32F2F', align: 'center', width: 100 })} font-family: 'Courier New', monospace, sans-serif !important;">
          ${order.folio || order.id.replace('OS-', '')}
        </div>

        <!-- Section 1: Datos del cliente -->
        <!-- Cliente -->
        <div style="${getStyle('cliente_nombre', { x: 145, y: 137, fontSize: 11, fontWeight: 'bold' })}">
          ${client?.name || ''}
        </div>
        <!-- E-Mail -->
        <div style="${getStyle('cliente_email', { x: 515, y: 136, fontSize: 10.5 })}">
          ${client?.email || ''}
        </div>
        <!-- Tel. Cel -->
        <div style="${getStyle('cliente_telefono_cel', { x: 135, y: 161, fontSize: 11 })}">
          ${client?.phone || ''}
        </div>
        <!-- Tel -->
        <div style="${getStyle('cliente_telefono_fijo', { x: 490, y: 161, fontSize: 11 })}">
          ${client?.telFijo || ''}
        </div>
        <!-- Calle -->
        <div style="${getStyle('cliente_direccion_calle', { x: 120, y: 184, fontSize: 10.5 })}">
          ${client?.calle || client?.address || ''}
        </div>
        <!-- C.P. -->
        <div style="${getStyle('cliente_cp', { x: 685, y: 184, fontSize: 11 })}">
          ${client?.cp || ''}
        </div>
        <!-- Colonia -->
        <div style="${getStyle('cliente_colonia', { x: 140, y: 208, fontSize: 11 })}">
          ${client?.colonia || ''}
        </div>
        <!-- Alcaldía -->
        <div style="${getStyle('cliente_alcaldia', { x: 575, y: 208, fontSize: 11 })}">
          ${client?.alcaldia || ''}
        </div>

        <!-- Section 2: Datos del auto -->
        <!-- Auto (Marca) -->
        <div style="${getStyle('auto_marca', { x: 140, y: 268, fontSize: 11, fontWeight: 'bold', width: 200, maxWidth: 200 })}">
          ${vehicle?.brand || ''}
        </div>
        <!-- Modelo -->
        <div style="${getStyle('auto_modelo_anio', { x: 354, y: 268, fontSize: 11, width: 150, maxWidth: 150 })}">
          ${vehicle?.model || ''} ${vehicle?.year ? `(${vehicle.year})` : ''}
        </div>
        <!-- Placas -->
        <div style="${getStyle('auto_placas', { x: 512, y: 268, fontSize: 11, fontWeight: 'bold', align: 'center', width: 150, maxWidth: 150 })}">
          ${vehicle?.plate || ''}
        </div>
        <!-- Kms -->
        <div style="${getStyle('auto_kilometraje', { x: 676, y: 268, fontSize: 11, align: 'center' })}">
          ${vehicle?.mileage ? vehicle.mileage.toLocaleString() : ''}
        </div>
        <!-- No. de Serie -->
        <div style="${getStyle('auto_serie_vin', { x: 175, y: 288, fontSize: 10.5, width: 280, maxWidth: 280 })} font-family: monospace !important;">
          ${vehicle?.serie || vehicle?.vin || ''}
        </div>
        <!-- Motor (con límite de ancho para no invadir el color) -->
        <div style="${getStyle('auto_motor', { x: 470, y: 288, fontSize: 11, width: 155, maxWidth: 155 })}">
          ${vehicle?.motor || ''}
        </div>
        <!-- Color -->
        <div style="${getStyle('auto_color', { x: 636, y: 288, fontSize: 11, width: 100, maxWidth: 100 })}">
          ${vehicle?.color || ''}
        </div>

        <!-- Checklist Marks -->
        <!-- Column 1 -->
        ${renderCheckMark(order.checklist?.tapetes, 'check_tapetes_si', 'check_tapetes_no', { x: 219, y: 320 }, { x: 294, y: 320 })}
        ${renderCheckMark(order.checklist?.encendedor, 'check_encendedor_si', 'check_encendedor_no', { x: 218, y: 343 }, { x: 294, y: 343 })}
        ${renderCheckMark(order.checklist?.estereo, 'check_estereo_si', 'check_estereo_no', { x: 218, y: 368 }, { x: 294, y: 368 })}
        ${renderCheckMark(order.checklist?.tarjetaCirculacion, 'check_tarjeta_circulacion_si', 'check_tarjeta_circulacion_no', { x: 218, y: 388 }, { x: 294, y: 388 })}
        ${renderCheckMark(order.checklist?.compVerificacion, 'check_verificacion_si', 'check_verificacion_no', { x: 218, y: 411 }, { x: 294, y: 411 })}
        ${renderCheckMark(order.checklist?.polizaSeguro, 'check_poliza_seguro_si', 'check_poliza_seguro_no', { x: 218, y: 434 }, { x: 294, y: 434 })}
        ${renderCheckMark(order.checklist?.segurosRuedas, 'check_seguros_ruedas_si', 'check_seguros_ruedas_no', { x: 218, y: 457 }, { x: 294, y: 457 })}

        <!-- Column 2 -->
        ${renderCheckMark(order.checklist?.gato || order.checklist?.jack, 'check_gato_si', 'check_gato_no', { x: 560, y: 320 }, { x: 634, y: 320 })}
        ${renderCheckMark(order.checklist?.herramienta || order.checklist?.tools, 'check_herramienta_si', 'check_herramienta_no', { x: 560, y: 352 }, { x: 634, y: 352 })}
        ${renderCheckMark(order.checklist?.extintor || order.checklist?.extinguisher, 'check_extintor_si', 'check_extintor_no', { x: 559, y: 371 }, { x: 634, y: 371 })}
        ${renderCheckMark(order.checklist?.llantaRefaccion || order.checklist?.spareTire, 'check_llanta_refaccion_si', 'check_llanta_refaccion_no', { x: 559, y: 394 }, { x: 634, y: 394 })}
        ${renderCheckMark(order.checklist?.sensoresPresencia, 'check_sensores_si', 'check_sensores_no', { x: 559, y: 415 }, { x: 635, y: 415 })}
        ${renderCheckMark(order.checklist?.camaraReversa, 'check_camara_reversa_si', 'check_camara_reversa_no', { x: 559, y: 440 }, { x: 635, y: 440 })}

        <!-- Gasolina Percentage (Desactivado temporalmente) -->
        <!--
        <div style="${getStyle('gasolina_nivel', { x: 628, y: 440, fontSize: 11, fontWeight: 'bold', color: '#D32F2F', align: 'center' })}">
          \${order.checklist?.fuelLevel !== undefined ? order.checklist.fuelLevel : 50}%
        </div>
        -->

        <!-- Inspección Componentes de Motor -->
        <div style="${(() => {
          const text = order.checklist?.inspeccionMotor || 'Ninguno';
          const fieldX = template.fields.find(f => f.id === 'inspeccion_componentes_motor')?.x ?? 158;
          const availWidth = Math.max(160, 365 - fieldX);
          return getStyle('inspeccion_componentes_motor', { 
            x: 158, 
            y: 482, 
            fontSize: text.length > 45 ? 9 : 10.5, 
            width: availWidth,
            maxWidth: availWidth,
            wrap: true,
            maxHeight: 36,
            lineHeight: text.length > 45 ? '14px' : '18px'
          });
        })()}">
          ${order.checklist?.inspeccionMotor || 'Ninguno'}
        </div>

        <!-- Objetos de Valor (Auto-ajuste dinámico: multilínea y auto-escalado para no salirse a columna 4) -->
        <div style="${(() => {
          const text = order.checklist?.objetosValor || 'Ninguno';
          const fieldX = template.fields.find(f => f.id === 'objetos_de_valor')?.x ?? 55;
          const availWidth = Math.max(160, 365 - fieldX);
          
          let fSize = 10.5;
          let lHeight = '18px';
          if (text.length > 80) {
            fSize = 8;
            lHeight = '13px';
          } else if (text.length > 40) {
            fSize = 9;
            lHeight = '15px';
          }
          
          return getStyle('objetos_de_valor', { 
            x: 55, 
            y: 552, 
            fontSize: fSize, 
            width: availWidth, 
            maxWidth: availWidth,
            wrap: true, 
            maxHeight: 38, 
            lineHeight: lHeight 
          });
        })()}">
          ${order.checklist?.objetosValor || 'Ninguno'}
        </div>

        <!-- Section 3: Descripción del servicio (Auto-ajuste milimétrico a los 5 renglones y límite de ancho a columna 4) -->
        <div style="${(() => {
          const text = order.reportedFailure || 'Servicio General';
          const fieldX = template.fields.find(f => f.id === 'servicio_descripcion')?.x ?? 38;
          const availWidth = Math.max(220, 365 - fieldX);
          
          const lineCount = (text.match(/\n/g) || []).length + 1;
          let fSize = 10.5;
          let lHeight = '20px'; // Altura exacta de los renglones impresos de fondo
          
          if (text.length > 250 || lineCount > 5) {
            fSize = 8;
            lHeight = '15px';
          } else if (text.length > 140 || lineCount > 4) {
            fSize = 9.2;
            lHeight = '18px';
          } else if (text.length > 70 || lineCount > 2) {
            fSize = 10;
            lHeight = '19px';
          }
          
          return getStyle('servicio_descripcion', { 
            x: 38, 
            y: 660, 
            fontSize: fSize, 
            fontWeight: 'normal', 
            width: availWidth, 
            maxWidth: availWidth,
            wrap: true, 
            maxHeight: 98, // Límite exacto de los 5 renglones (~98px)
            lineHeight: lHeight 
          });
        })()}">
          ${order.reportedFailure || 'Servicio General'}
        </div>

        <!-- Fecha -->
        <div style="${getStyle('servicio_fecha', { x: 80, y: 755, fontSize: 11, fontWeight: 'bold' })}">
          ${dateStr}
        </div>
        <!-- Hora -->
        <div style="${getStyle('servicio_hora', { x: 235, y: 755, fontSize: 11, fontWeight: 'bold' })}">
          ${timeStr}
        </div>
        <!-- Técnico -->
        <div style="${getStyle('servicio_tecnico', { x: 90, y: 778, fontSize: 11 })}">
          ${mechanicName}
        </div>

        <!-- Firma del Cliente -->
        <div style="${getStyle('firma_cliente_grafico', { x: 120, y: 810, width: 190, align: 'center' })} height: 48px !important; display: flex !important; align-items: center !important; justify-content: center !important;">
          ${order.clientSignature ? `
            <img src="${order.clientSignature}" crossorigin="anonymous" style="max-height: 48px !important; max-width: 190px !important; object-fit: contain !important;" />
          ` : ''}
        </div>

      </div>
    </div>
  `;
}

/**
 * Downloads the SAE work order as a beautiful high-fidelity PDF.
 */
export async function generateSaePdf(
  order: ServiceOrder,
  client: Client | undefined,
  vehicle: Vehicle | undefined,
  employees: Employee[]
): Promise<void> {
  const container = document.createElement('div');
  container.id = 'sae-pdf-render-root';
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '750px';
  container.style.padding = '0px';
  container.style.backgroundColor = '#FFFFFF';
  container.style.color = '#111827';
  container.style.fontFamily = '"Arial", sans-serif';
  container.style.fontSize = '11px';
  container.style.lineHeight = '1.4';
  container.style.zIndex = '-9999';
  container.style.opacity = '0.99';
  container.style.pointerEvents = 'none';

  container.innerHTML = getSaeHtml(order, client, vehicle, employees);
  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pdfWidth = 215.9; // Letter width in mm
    const pdfHeight = 279.4; // Letter height in mm
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const filename = `Orden_SAE_Folio_${order.folio || order.id.replace('OS-', '')}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating SAE Order PDF:', error);
    alert('Ocurrió un error al generar el PDF. Por favor reintente.');
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generates and returns a PDF file binary as a Blob.
 */
export async function generateSaePdfBlob(
  order: ServiceOrder,
  client: Client | undefined,
  vehicle: Vehicle | undefined,
  employees: Employee[]
): Promise<Blob | null> {
  const container = document.createElement('div');
  container.id = 'sae-pdf-render-root-pdf-blob';
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '750px';
  container.style.padding = '0px';
  container.style.backgroundColor = '#FFFFFF';
  container.style.color = '#111827';
  container.style.fontFamily = '"Arial", sans-serif';
  container.style.fontSize = '11px';
  container.style.lineHeight = '1.4';
  container.style.zIndex = '-9999';
  container.style.opacity = '0.99';
  container.style.pointerEvents = 'none';

  container.innerHTML = getSaeHtml(order, client, vehicle, employees);
  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pdfWidth = 215.9; // Letter width in mm
    const pdfHeight = 279.4; // Letter height in mm
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating SAE PDF blob:', error);
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generates and returns a PNG Image file binary as a Blob.
 */
export async function generateSaeImageBlob(
  order: ServiceOrder,
  client: Client | undefined,
  vehicle: Vehicle | undefined,
  employees: Employee[]
): Promise<Blob | null> {
  const container = document.createElement('div');
  container.id = 'sae-pdf-render-root-image';
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '750px';
  container.style.padding = '0px';
  container.style.backgroundColor = '#FFFFFF';
  container.style.color = '#111827';
  container.style.fontFamily = '"Arial", sans-serif';
  container.style.fontSize = '11px';
  container.style.lineHeight = '1.4';
  container.style.zIndex = '-9999';
  container.style.opacity = '0.99';
  container.style.pointerEvents = 'none';

  container.innerHTML = getSaeHtml(order, client, vehicle, employees);
  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  } catch (error) {
    console.error('Error generating SAE image blob:', error);
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Downloads the SAE work order as a high-fidelity PNG image.
 */
export async function downloadSaeImage(
  order: ServiceOrder,
  client: Client | undefined,
  vehicle: Vehicle | undefined,
  employees: Employee[]
): Promise<void> {
  const blob = await generateSaeImageBlob(order, client, vehicle, employees);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Orden_SAE_Folio_${order.folio || order.id.replace('OS-', '')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copies the SAE work order image directly into the user's Clipboard.
 * This allows quick "Paste (Ctrl+V)" inside WhatsApp Web or Email clients.
 */
export async function copySaeImageToClipboard(
  order: ServiceOrder,
  client: Client | undefined,
  vehicle: Vehicle | undefined,
  employees: Employee[]
): Promise<boolean> {
  try {
    const blob = await generateSaeImageBlob(order, client, vehicle, employees);
    if (!blob) return false;

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob
      })
    ]);
    return true;
  } catch (error) {
    console.error('Error copying SAE image to clipboard:', error);
    return false;
  }
}

/**
 * Shares the document using the native Web Share API (mostly on mobile devices).
 */
export async function shareSaeOrderMobile(
  order: ServiceOrder,
  client: Client | undefined,
  vehicle: Vehicle | undefined,
  employees: Employee[],
  type: 'pdf' | 'png' = 'pdf'
): Promise<boolean> {
  try {
    if (type === 'pdf') {
      const pdfBlob = await generateSaePdfBlob(order, client, vehicle, employees);
      if (!pdfBlob) return false;
      const file = new File(
        [pdfBlob],
        `Orden_SAE_Folio_${order.folio || order.id.replace('OS-', '')}.pdf`,
        { type: 'application/pdf' }
      );
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Orden SAE Folio ${order.folio || order.id.replace('OS-', '')}`,
          text: `Te compartimos la Orden de Entrada Digital de tu vehículo en SAE.`
        });
        return true;
      }
    } else {
      const pngBlob = await generateSaeImageBlob(order, client, vehicle, employees);
      if (!pngBlob) return false;
      const file = new File(
        [pngBlob],
        `Orden_SAE_Folio_${order.folio || order.id.replace('OS-', '')}.png`,
        { type: 'image/png' }
      );
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Orden SAE Folio ${order.folio || order.id.replace('OS-', '')}`,
          text: `Te compartimos la imagen de tu Orden de Entrada Digital de tu vehículo en SAE.`
        });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error using Web Share API:', error);
    return false;
  }
}

export async function generateSaePresupuestoPdfBlob(presupuesto: Presupuesto): Promise<Blob | null> {
  const container = document.createElement('div');
  container.id = 'sae-pdf-render-root-presupuesto';
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '750px';
  container.style.padding = '0px';
  container.style.backgroundColor = '#FFFFFF';
  container.style.color = '#111827';
  container.style.fontFamily = '"Arial", sans-serif';
  container.style.fontSize = '11px';
  container.style.lineHeight = '1.4';
  container.style.zIndex = '-9999';
  container.style.opacity = '0.99';
  container.style.pointerEvents = 'none';

  container.innerHTML = getSaePresupuestoHtml(presupuesto);
  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pdfWidth = 215.9; // Letter width in mm
    const pdfHeight = 279.4; // Letter height in mm
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating Presupuesto PDF blob:', error);
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadSaePresupuestoPdf(presupuesto: Presupuesto): Promise<void> {
  const pdfBlob = await generateSaePresupuestoPdfBlob(presupuesto);
  if (!pdfBlob) return;
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Presupuesto_SAE_Folio_${presupuesto.numero}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareSaePresupuestoMobile(presupuesto: Presupuesto): Promise<boolean> {
  try {
    const pdfBlob = await generateSaePresupuestoPdfBlob(presupuesto);
    if (!pdfBlob) return false;
    const file = new File(
      [pdfBlob],
      `Presupuesto_SAE_Folio_${presupuesto.numero}.pdf`,
      { type: 'application/pdf' }
    );
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Presupuesto SAE Folio ${presupuesto.numero}`,
        text: `Te compartimos el Presupuesto oficial de tu vehículo en Servicio Automotriz Especializado (SAE).`
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sharing Presupuesto mobile:', error);
    return false;
  }
}

/**
 * Returns the raw HTML string representing the official SAE Orden de Reparación form (Formato 3),
 * styled and positioned directly on top of the physical background format using calibrated coordinates.
 */
export function getSaeOrdenDeReparacionHtml(orden: OrdenReparacion): string {
  // Load calibrated template configuration for Formato 3
  const template = getTemplateConfig('formato3');
  const formatoBgUrl = template.bgUrl || "https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato%203%20(1).png";

  const getStyle = (fieldId: string, fallback: { x: number; y: number; fontSize?: number; fontWeight?: string; color?: string; align?: string; width?: number }) => {
    const f = template.fields.find(item => item.id === fieldId);
    const x = f ? f.x : fallback.x;
    const y = f ? f.y : fallback.y;
    const fontSize = f?.fontSize ?? fallback.fontSize ?? 11;
    const fontWeight = f?.fontWeight ?? fallback.fontWeight ?? 'normal';
    const color = f?.color ?? fallback.color ?? '#000000';
    const align = f?.align ?? fallback.align ?? 'left';
    const width = f?.width ?? fallback.width;

    return `position: absolute !important; top: ${y}px !important; left: ${x}px !important; ${width ? `width: ${width}px !important;` : ''} text-align: ${align} !important; font-size: ${fontSize}px !important; font-weight: ${fontWeight} !important; color: ${color} !important; line-height: normal !important; white-space: nowrap !important; overflow: visible !important; z-index: 10 !important;`;
  };

  // Get table column coordinates from template fields or fallbacks
  const colMarca = template.fields.find(f => f.id === 'tabla_r1_marca') || { x: 82, y: 320, align: 'center', fontSize: 11 };
  const colDesc = template.fields.find(f => f.id === 'tabla_r1_descripcion') || { x: 128, y: 320, align: 'left', fontSize: 11 };
  const colCant = template.fields.find(f => f.id === 'tabla_r1_cantidad') || { x: 664, y: 320, align: 'center', fontSize: 11 };

  const r2Marca = template.fields.find(f => f.id === 'tabla_r2_marca');
  const startY = (colMarca as any).y ?? (colDesc as any).y ?? 320;
  const rowSpacing = r2Marca && (r2Marca as any).y ? Math.max(18, Math.min(45, (r2Marca as any).y - startY)) : 24;

  // Calculate table rows (using calibrated coordinates and spacing)
  const items = orden.items || [];
  const rowsHtml = items.slice(0, 24).map((item, idx) => {
    const yMarca = ((colMarca as any).y ?? startY) + (idx * rowSpacing);
    const yDesc = ((colDesc as any).y ?? startY) + (idx * rowSpacing);
    const yCant = ((colCant as any).y ?? startY) + (idx * rowSpacing);
    const descText = (item.descripcion || '').replace(/\r?\n/g, ' ').trim();
    let descFontSize = colDesc.fontSize || 11;
    if (descText.length > 95) {
      descFontSize = Math.min(descFontSize, 8);
    } else if (descText.length > 75) {
      descFontSize = Math.min(descFontSize, 9);
    } else if (descText.length > 58) {
      descFontSize = Math.min(descFontSize, 10);
    }
    const maxDescWidth = Math.max(400, (colCant.x || 664) - (colDesc.x || 128) - 10);
    return `
      <div style="position: absolute !important; top: ${yMarca}px !important; left: ${colMarca.x}px !important; font-size: ${colMarca.fontSize || 11}px !important; font-weight: bold !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colMarca.align || 'center'} !important; color: #000000 !important; z-index: 10 !important;">
        ${item.marca || item.codigo || ''}
      </div>
      <div style="position: absolute !important; top: ${yDesc}px !important; left: ${colDesc.x}px !important; width: ${maxDescWidth}px !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; font-size: ${descFontSize}px !important; text-align: ${colDesc.align || 'left'} !important; color: #000000 !important; z-index: 10 !important;">
        ${descText}
      </div>
      <div style="position: absolute !important; top: ${yCant}px !important; left: ${colCant.x}px !important; font-size: ${colCant.fontSize || 11}px !important; font-weight: bold !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colCant.align || 'center'} !important; color: #000000 !important; z-index: 10 !important;">
        ${item.cantidad || 1}
      </div>
    `;
  }).join('');

  const rotacionPresionAire = orden.rotacionPresionAire || orden.rotacionAireLlantas || '';
  const revLimpiaparabrisas = orden.revLimpiaparabrisas || orden.revLimpiaParabrisas || '';
  const revLuces = orden.revLuces || orden.revLucesNivelesEngral || '';
  const revNivelesGeneral = orden.revNivelesGeneral || orden.revLucesNivelesEngral || '';
  const matriculaPlacas = orden.matriculaPlacas || orden.matriculaVin || '';
  const tecnicoResponsable = orden.tecnicoResponsable || orden.tecnico || '';

  return `
    <div style="position: relative !important; width: 750px !important; height: 980px !important; margin: 0 auto !important; font-family: 'Arial', 'Helvetica', sans-serif !important; color: #000000 !important; background-color: #FFFFFF !important; box-sizing: border-box !important; overflow: hidden !important;">
      
      <!-- Fondo Oficial Formato 3 (Orden de Reparación SAE) -->
      <img src="${formatoBgUrl}" crossorigin="anonymous" style="position: absolute !important; top: 0 !important; left: 0 !important; width: 750px !important; height: 980px !important; object-fit: fill !important; z-index: 0 !important;" alt="Fondo Formato 3 Orden de Reparación SAE" />

      <!-- Capa de Datos Calibrada -->
      <div style="position: absolute !important; top: 0 !important; left: 0 !important; width: 750px !important; height: 980px !important; z-index: 10 !important;">
        
        <!-- Fecha -->
        <div style="${getStyle('fecha', { x: 454, y: 138, fontSize: 11, fontWeight: 'bold', align: 'left' })}">
          ${formatDateToDisplay(orden.fecha)}
        </div>

        <!-- Número de Orden -->
        <div style="${getStyle('numero_orden', { x: 635, y: 138, fontSize: 15, fontWeight: '900', color: '#D32F2F', align: 'left' })}">
          ${orden.numero}
        </div>

        <!-- Revisiones Rápidas -->
        ${rotacionPresionAire ? `
          <div style="${getStyle('rotacion_presion_aire', { x: 330, y: 191, fontSize: 11, fontWeight: 'bold', align: 'center' })}">
            ${rotacionPresionAire}
          </div>
        ` : ''}

        ${revLimpiaparabrisas ? `
          <div style="${getStyle('rev_limpiaparabrisas', { x: 334, y: 227, fontSize: 11, fontWeight: 'bold', align: 'center' })}">
            ${revLimpiaparabrisas}
          </div>
        ` : ''}

        ${revLuces ? `
          <div style="${getStyle('rev_luces', { x: 160, y: 261, fontSize: 11, fontWeight: 'bold', align: 'center' })}">
            ${revLuces}
          </div>
        ` : ''}

        ${revNivelesGeneral ? `
          <div style="${getStyle('rev_niveles_general', { x: 323, y: 261, fontSize: 11, fontWeight: 'bold', align: 'center' })}">
            ${revNivelesGeneral}
          </div>
        ` : ''}

        <!-- Datos del Vehículo -->
        <div style="${getStyle('matricula_placas', { x: 480, y: 188, fontSize: 11, fontWeight: 'bold', align: 'left' })}">
          ${matriculaPlacas}
        </div>

        <div style="${getStyle('marca_motor', { x: 495, y: 212, fontSize: 11, fontWeight: 'normal', align: 'left' })}">
          ${orden.marcaMotor}
        </div>

        <div style="${getStyle('modelo_color', { x: 500, y: 237, fontSize: 11, fontWeight: 'normal', align: 'left' })}">
          ${orden.modeloColor}
        </div>

        <div style="${getStyle('kilometraje', { x: 450, y: 259, fontSize: 11, fontWeight: 'normal', align: 'left' })}">
          ${orden.kilometros ? `${orden.kilometros.toLocaleString('es-MX')} km` : ''}
        </div>

        <!-- Tabla de Repuestos Dinámica -->
        ${rowsHtml}

        <!-- Técnico Responsable -->
        ${tecnicoResponsable ? `
          <div style="${getStyle('tecnico_responsable', { x: 115, y: 934, fontSize: 11, fontWeight: 'bold', align: 'left' })}">
            ${tecnicoResponsable}
          </div>
        ` : ''}

      </div>
    </div>
  `;
}

// Alias for backwards compatibility
export const getSaeOrdenReparacionHtml = getSaeOrdenDeReparacionHtml;

export async function generateSaeOrdenDeReparacionPdfBlob(orden: OrdenReparacion): Promise<Blob | null> {
  const container = document.createElement('div');
  container.id = 'sae-pdf-render-root-orden-reparacion';
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '750px';
  container.style.padding = '0px';
  container.style.backgroundColor = '#FFFFFF';
  container.style.color = '#111827';
  container.style.fontFamily = '"Arial", sans-serif';
  container.style.fontSize = '11px';
  container.style.lineHeight = '1.4';
  container.style.zIndex = '-9999';
  container.style.opacity = '0.99';
  container.style.pointerEvents = 'none';

  container.innerHTML = getSaeOrdenDeReparacionHtml(orden);
  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pdfWidth = 215.9; // Letter width in mm
    const pdfHeight = 279.4; // Letter height in mm
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating Orden de Reparación PDF blob:', error);
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

// Alias for backwards compatibility
export const generateSaeOrdenReparacionPdfBlob = generateSaeOrdenDeReparacionPdfBlob;

export async function downloadSaeOrdenDeReparacionPdf(orden: OrdenReparacion): Promise<void> {
  const pdfBlob = await generateSaeOrdenDeReparacionPdfBlob(orden);
  if (!pdfBlob) return;
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Orden_de_Reparacion_SAE_Numero_${orden.numero}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareSaeOrdenDeReparacionMobile(orden: OrdenReparacion): Promise<boolean> {
  try {
    const pdfBlob = await generateSaeOrdenDeReparacionPdfBlob(orden);
    if (!pdfBlob) return false;
    const file = new File(
      [pdfBlob],
      `Orden_de_Reparacion_SAE_Numero_${orden.numero}.pdf`,
      { type: 'application/pdf' }
    );
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Órden de Reparación SAE Número ${orden.numero}`,
        text: `Te compartimos la Órden de Reparación oficial de tu vehículo en Servicio Automotriz Especializado (SAE).`
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sharing Orden de Reparación mobile:', error);
    return false;
  }
}

// Aliases for backwards compatibility
export const downloadSaeOrdenReparacionPdf = downloadSaeOrdenDeReparacionPdf;
export const shareSaeOrdenReparacionMobile = shareSaeOrdenDeReparacionMobile;

/**
 * Returns raw HTML string representing the official SAE Nota de Salida form,
 * matching physical paper format 4 (Folio/Salida 187) with exact calibrated coordinates.
 */
export function getSaeNotaSalidaHtml(nota: NotaSalida): string {
  const template = getTemplateConfig('formato4');
  const formatoBgUrl = template.bgUrl || 'https://gydwduicwpxznmvngwlb.supabase.co/storage/v1/object/public/formatos/formato%204%20(1).png';

  const getStyle = (fieldId: string, fallback: { x: number; y: number; fontSize?: number; fontWeight?: string; color?: string; align?: string; fontFamily?: string; width?: number }) => {
    const f = template.fields.find(item => item.id === fieldId);
    const x = f ? f.x : fallback.x;
    const y = f ? f.y : fallback.y;
    const fontSize = f?.fontSize ?? fallback.fontSize ?? 11;
    const fontWeight = f?.fontWeight || fallback.fontWeight || 'normal';
    const color = f?.color || fallback.color || '#000000';
    const align = f?.align || fallback.align || 'left';
    const fontFamily = f?.fontFamily || fallback.fontFamily || 'Arial, sans-serif';
    const width = f?.width ?? fallback.width;

    return `position: absolute !important; top: ${y}px !important; left: ${x}px !important; ${width ? `width: ${width}px !important;` : ''} font-size: ${fontSize}px !important; font-weight: ${fontWeight} !important; color: ${color} !important; text-align: ${align} !important; font-family: ${fontFamily} !important; line-height: normal !important; white-space: nowrap !important; overflow: visible !important; z-index: 10 !important;`;
  };

  const colCodigo = template.fields.find(f => f.id === 'tabla_r1_codigo') || { x: 73, y: 328, align: 'center', fontSize: 11 };
  const colDesc = template.fields.find(f => f.id === 'tabla_r1_descripcion') || { x: 107, y: 328, align: 'left', fontSize: 11 };
  const colCant = template.fields.find(f => f.id === 'tabla_r1_cantidad') || { x: 536, y: 328, align: 'center', fontSize: 11 };
  const colImporte = template.fields.find(f => f.id === 'tabla_r1_importe') || { x: 611, y: 328, align: 'right', fontSize: 11 };
  const colTotal = template.fields.find(f => f.id === 'tabla_r1_total') || { x: 681, y: 328, align: 'right', fontSize: 11 };

  const r2Codigo = template.fields.find(f => f.id === 'tabla_r2_codigo');
  const startY = (colCodigo as any).y ?? (colDesc as any).y ?? 328;
  const rowSpacing = r2Codigo && (r2Codigo as any).y ? Math.max(18, Math.min(45, (r2Codigo as any).y - startY)) : 23.5;

  const items = nota.items || [];
  // Row limits: Y superior = 33.2% (~328px), Y inferior = 91.5% (~897px)
  const rowsHtml = items.slice(0, 24).map((item, idx) => {
    const yCod = ((colCodigo as any).y ?? startY) + (idx * rowSpacing);
    const yDesc = ((colDesc as any).y ?? startY) + (idx * rowSpacing);
    const yCant = ((colCant as any).y ?? startY) + (idx * rowSpacing);
    const yImp = ((colImporte as any).y ?? startY) + (idx * rowSpacing);
    const yTot = ((colTotal as any).y ?? startY) + (idx * rowSpacing);
    const descText = (item.descripcion || '').replace(/\r?\n/g, ' ').trim();
    let descFontSize = colDesc.fontSize || 11;
    if (descText.length > 78) {
      descFontSize = Math.min(descFontSize, 8);
    } else if (descText.length > 60) {
      descFontSize = Math.min(descFontSize, 9);
    } else if (descText.length > 45) {
      descFontSize = Math.min(descFontSize, 10);
    }
    const maxDescWidth = Math.max(320, (colCant.x || 536) - (colDesc.x || 107) - 10);
    return `
      <div style="position: absolute !important; top: ${yCod}px !important; left: ${colCodigo.x}px !important; font-size: ${colCodigo.fontSize || 11}px !important; font-weight: bold !important; font-family: monospace !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colCodigo.align || 'center'} !important; color: #000000 !important; z-index: 10 !important;">
        ${item.codigo || ''}
      </div>
      <div style="position: absolute !important; top: ${yDesc}px !important; left: ${colDesc.x}px !important; width: ${maxDescWidth}px !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; font-size: ${descFontSize}px !important; text-align: ${colDesc.align || 'left'} !important; color: #000000 !important; z-index: 10 !important;">
        ${descText}
      </div>
      <div style="position: absolute !important; top: ${yCant}px !important; left: ${colCant.x}px !important; font-size: ${colCant.fontSize || 11}px !important; font-weight: bold !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colCant.align || 'center'} !important; color: #000000 !important; z-index: 10 !important;">
        ${item.cantidad || 1}
      </div>
      <div style="position: absolute !important; top: ${yImp}px !important; left: ${colImporte.x}px !important; font-size: ${colImporte.fontSize || 11}px !important; font-family: monospace !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colImporte.align || 'right'} !important; color: #000000 !important; z-index: 10 !important;">
        ${(item.importeUnitario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div style="position: absolute !important; top: ${yTot}px !important; left: ${colTotal.x}px !important; font-size: ${colTotal.fontSize || 11}px !important; font-weight: bold !important; font-family: monospace !important; line-height: normal !important; overflow: visible !important; white-space: nowrap !important; text-align: ${colTotal.align || 'right'} !important; color: #000000 !important; z-index: 10 !important;">
        ${(item.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    `;
  }).join('');

  return `
    <div style="position: relative !important; width: 750px !important; height: 980px !important; margin: 0 auto !important; font-family: 'Arial', 'Helvetica', sans-serif !important; color: #000000 !important; background-color: #FFFFFF !important; box-sizing: border-box !important; overflow: hidden !important;">
      
      <!-- Fondo Oficial Formato 4 (Salida SAE) -->
      <img src="${formatoBgUrl}" crossorigin="anonymous" style="position: absolute !important; top: 0 !important; left: 0 !important; width: 750px !important; height: 980px !important; object-fit: fill !important; z-index: 0 !important;" alt="Fondo Formato 4 Salida SAE" />

      <!-- Capa de Datos Calibrada -->
      <div style="position: absolute !important; top: 0 !important; left: 0 !important; width: 750px !important; height: 980px !important; z-index: 10 !important;">
        
        <!-- Número de Salida -->
        <div style="${getStyle('numero_salida', { x: 488, y: 206, fontSize: 14, fontFamily: 'monospace', fontWeight: '900', color: '#DC2626', align: 'left' })}">
          ${nota.numero}
        </div>

        <!-- Fecha de Salida -->
        <div style="${getStyle('fecha', { x: 620, y: 206, fontSize: 11, fontWeight: 'bold', color: '#000000', align: 'left' })}">
          ${formatDateToDisplay(nota.fecha)}
        </div>

        <!-- Datos del Cliente -->
        <div style="${getStyle('cliente_nombre', { x: 140, y: 214, fontSize: 11, fontWeight: '700', align: 'left' })}">
          ${nota.clienteNombre || ''}
        </div>

        <div style="${getStyle('cliente_calle', { x: 134, y: 239, fontSize: 11, fontWeight: '600', align: 'left' })}">
          ${nota.clienteCalle || ''}
        </div>

        <div style="${getStyle('cliente_cp_colonia', { x: 139, y: 258, fontSize: 11, fontWeight: '600', align: 'left' })}">
          ${nota.clienteCpColonia || ''}
        </div>

        <div style="${getStyle('cliente_alcaldia', { x: 137, y: 276, fontSize: 11, fontWeight: '600', align: 'left' })}">
          ${nota.clienteAlcaldia || ''}
        </div>

        <div style="${getStyle('cliente_telefono', { x: 134, y: 293, fontSize: 11, fontWeight: '600', align: 'left' })}">
          ${nota.clienteTelefono || ''}
        </div>

        <!-- Datos del Vehículo -->
        <div style="${getStyle('vehiculo_marca_motor', { x: 516, y: 240, fontSize: 11, fontWeight: '600', align: 'left' })}">
          ${nota.marcaMotor || ''}
        </div>

        <div style="${getStyle('vehiculo_modelo_color', { x: 520, y: 259, fontSize: 11, fontWeight: '600', align: 'left' })}">
          ${nota.modeloColor || ''}
        </div>

        <div style="${getStyle('vehiculo_matricula', { x: 495, y: 277, fontSize: 11, fontWeight: '800', align: 'left' })}">
          ${nota.matriculaVin || ''}
        </div>

        <div style="${getStyle('vehiculo_kilometros', { x: 504, y: 295, fontSize: 11, fontWeight: '600', align: 'left' })}">
          ${nota.kilometros ? `${nota.kilometros.toLocaleString('es-MX')} km` : ''}
        </div>

        <!-- Partidas / Repuestos Dinámica -->
        ${rowsHtml}

        <!-- Pie de Página: Orden de Servicio # -->
        ${nota.ordenServicioNumero ? `
          <div style="${getStyle('orden_de_servicio_numero', { x: 504, y: 929, fontSize: 11, fontWeight: '700', align: 'left' })}">
            ${nota.ordenServicioNumero}
          </div>
        ` : ''}

        <!-- Pie de Página: Total General -->
        <div style="${getStyle('total_general', { x: 686, y: 933, fontSize: 13, fontFamily: 'monospace', fontWeight: '900', align: 'right' })}">
          $${(nota.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

      </div>
    </div>
  `;
}

export async function generateSaeNotaSalidaPdfBlob(nota: NotaSalida): Promise<Blob | null> {
  const container = document.createElement('div');
  container.id = 'sae-pdf-render-root-nota-salida';
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '750px';
  container.style.padding = '0px';
  container.style.backgroundColor = '#FFFFFF';
  container.style.color = '#111827';
  container.style.fontFamily = '"Arial", sans-serif';
  container.style.fontSize = '11px';
  container.style.lineHeight = '1.4';
  container.style.zIndex = '-999999';
  container.style.opacity = '1';
  container.style.visibility = 'visible';
  container.style.pointerEvents = 'none';

  container.innerHTML = getSaeNotaSalidaHtml(nota);
  document.body.appendChild(container);

  try {
    const images = Array.from(container.getElementsByTagName('img'));
    await Promise.all(
      images.map(
        img =>
          new Promise(resolve => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              setTimeout(() => resolve(false), 3500);
            }
          })
      )
    );

    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pdfWidth = 215.9; // Letter width in mm
    const pdfHeight = 279.4; // Letter height in mm
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating Nota de Salida PDF blob:', error);
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadSaeNotaSalidaPdf(nota: NotaSalida): Promise<void> {
  const pdfBlob = await generateSaeNotaSalidaPdfBlob(nota);
  if (!pdfBlob) return;
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Nota_de_Salida_SAE_Numero_${nota.numero}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareSaeNotaSalidaMobile(nota: NotaSalida): Promise<boolean> {
  try {
    const pdfBlob = await generateSaeNotaSalidaPdfBlob(nota);
    if (!pdfBlob) return false;
    const file = new File(
      [pdfBlob],
      `Nota_de_Salida_SAE_Numero_${nota.numero}.pdf`,
      { type: 'application/pdf' }
    );
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Nota de Salida SAE Número ${nota.numero}`,
        text: `Te compartimos la Nota de Salida oficial de tu vehículo en Servicio Automotriz Especializado (SAE).`
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sharing Nota de Salida mobile:', error);
    return false;
  }
}
