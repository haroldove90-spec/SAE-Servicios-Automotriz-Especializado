-- ==========================================================
-- SQL Setup Script for SAE (Servicio Automotriz Especializado)
-- Run this script in your Supabase SQL Editor to provision
-- the database tables.
-- ==========================================================

-- Disable RLS (Row Level Security) or configure open access policies
-- as this app handles synchronization from local states for full-stack.

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS clients (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "creditLimit" NUMERIC DEFAULT 0,
  "creditBalance" NUMERIC DEFAULT 0,
  "calle" TEXT,
  "cp" TEXT,
  "colonia" TEXT,
  "alcaldia" TEXT,
  "telFijo" TEXT,
  "hasWhatsapp" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  "id" TEXT PRIMARY KEY,
  "ownerId" TEXT REFERENCES clients("id") ON DELETE CASCADE,
  "brand" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "plate" TEXT NOT NULL,
  "vin" TEXT NOT NULL,
  "mileage" INTEGER NOT NULL,
  "color" TEXT NOT NULL,
  "engomadoColor" TEXT NOT NULL,
  "plateEnding" TEXT NOT NULL,
  "motor" TEXT,
  "serie" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "commissionRate" NUMERIC DEFAULT 0,
  "active" BOOLEAN DEFAULT true,
  "phone" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "compatibility" TEXT,
  "stock" INTEGER DEFAULT 0,
  "minStock" INTEGER DEFAULT 0,
  "cost" NUMERIC DEFAULT 0,
  "price" NUMERIC DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "contact" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT REFERENCES suppliers("id") ON DELETE CASCADE,
  "date" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "items" JSONB DEFAULT '[]'::jsonb,
  "total" NUMERIC DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Part Requisitions Table
CREATE TABLE IF NOT EXISTS requisitions (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "itemId" TEXT REFERENCES inventory("id") ON DELETE CASCADE,
  "qty" INTEGER NOT NULL,
  "mechanicId" TEXT REFERENCES employees("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Service Orders Table
CREATE TABLE IF NOT EXISTS service_orders (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT REFERENCES clients("id") ON DELETE CASCADE,
  "vehicleId" TEXT REFERENCES vehicles("id") ON DELETE CASCADE,
  "advisorId" TEXT REFERENCES employees("id") ON DELETE SET NULL,
  "mechanicId" TEXT REFERENCES employees("id") ON DELETE SET NULL,
  "reportedFailure" TEXT,
  "checklist" JSONB DEFAULT '{}'::jsonb,
  "diagnostics" TEXT,
  "diagnosticPhotos" JSONB DEFAULT '[]'::jsonb,
  "status" TEXT NOT NULL,
  "items" JSONB DEFAULT '[]'::jsonb,
  "timeLogs" JSONB DEFAULT '[]'::jsonb,
  "isClockedIn" BOOLEAN DEFAULT false,
  "isPaused" BOOLEAN DEFAULT false,
  "totalHoursWorked" NUMERIC DEFAULT 0,
  "dateOpened" TEXT NOT NULL,
  "dateClosed" TEXT,
  "payments" JSONB DEFAULT '[]'::jsonb,
  "folio" TEXT,
  "fecha" TEXT,
  "hora" TEXT,
  "tecnico" TEXT,
  "clientSignature" TEXT,
  "mechanicSignature" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" NUMERIC DEFAULT 0,
  "date" TEXT NOT NULL,
  "description" TEXT,
  "referenceId" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Workshop Settings Table
CREATE TABLE IF NOT EXISTS workshop_settings (
  "id" TEXT PRIMARY KEY DEFAULT 'default',
  "name" TEXT NOT NULL,
  "rfc" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "logoUrl" TEXT,
  "terms" TEXT,
  "taxRate" NUMERIC DEFAULT 0,
  "bankDetails" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure created_at exists if table already existed
ALTER TABLE workshop_settings ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Insert Default/Initial Workshop Settings if they don't exist
INSERT INTO workshop_settings ("id", "name", "rfc", "address", "phone", "email", "logoUrl", "terms", "taxRate", "bankDetails")
VALUES (
  'default',
  'SERVICIO AUTOMOTRIZ ESPECIALIZADO',
  'XAXX010101000',
  'Av. de las Palmas 100, Lomas de Chapultepec, CDMX',
  '55 1234 5678',
  'contacto@sae.com',
  'https://appdesignproyectos.com/sre.png',
  'Contrato de adhesión regulado de acuerdo con la NOM-174-SCFI-2007 para talleres de reparación de vehículos.',
  16.0,
  'Banco SAE - CLABE: 0123 4567 8901 2345 67'
)
ON CONFLICT ("id") DO NOTHING;

-- Enable public access for demo purposes (Disable Row Level Security)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_settings DISABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 11. TABLA PARA CONFIGURACIÓN DE PLANTILLAS Y COORDENADAS PDF
-- Formatos 1, 2, 3 y 4 (Recepción, Presupuesto, Orden de Reparación y Salida)
-- ==========================================================

CREATE TABLE IF NOT EXISTS sae_pdf_templates (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  bg_url TEXT NOT NULL,
  canvas_width INTEGER DEFAULT 750,
  canvas_height INTEGER DEFAULT 980,
  fields JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar seguridad por filas (RLS) y políticas de acceso
ALTER TABLE sae_pdf_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica de plantillas" ON sae_pdf_templates;
CREATE POLICY "Permitir lectura publica de plantillas" 
ON sae_pdf_templates FOR SELECT USING (true);

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
  '[{"id":"folio","label":"Folio Orden","section":"encabezado","x":610,"y":122,"fontSize":15,"fontWeight":"900","color":"#DC2626","align":"left"},{"id":"fecha","label":"Fecha de Ingreso","section":"encabezado","x":438,"y":126,"fontSize":11,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"hora","label":"Hora de Ingreso","section":"encabezado","x":535,"y":126,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"cliente_nombre","label":"Nombre del Cliente","section":"cliente","x":135,"y":188,"fontSize":11,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"cliente_calle","label":"Calle y Número","section":"cliente","x":135,"y":206,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"cliente_cp","label":"Código Postal","section":"cliente","x":135,"y":224,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"cliente_colonia","label":"Colonia","section":"cliente","x":215,"y":224,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"cliente_alcaldia","label":"Alcaldía / Municipio","section":"cliente","x":135,"y":242,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"cliente_telfijo","label":"Teléfono Fijo","section":"cliente","x":135,"y":260,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"cliente_celular","label":"Celular","section":"cliente","x":230,"y":260,"fontSize":10,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"auto_placas","label":"Placas / Matrícula","section":"auto","x":505,"y":188,"fontSize":12,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"auto_marca","label":"Marca","section":"auto","x":505,"y":206,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"auto_modelo","label":"Modelo","section":"auto","x":505,"y":224,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"auto_color","label":"Color","section":"auto","x":505,"y":242,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"auto_kms","label":"Kilometraje Actual","section":"auto","x":505,"y":260,"fontSize":10,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"auto_motor","label":"Motor","section":"auto","x":640,"y":206,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"auto_ano","label":"Año","section":"auto","x":640,"y":224,"fontSize":10,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"auto_serie","label":"Número de Serie / VIN","section":"auto","x":640,"y":242,"fontSize":9,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"falla_reportada","label":"Falla Reportada por Cliente","section":"observaciones","x":50,"y":748,"fontSize":10,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"observaciones_diagnostico","label":"Diagnóstico y Observaciones","section":"observaciones","x":50,"y":785,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"firma_cliente","label":"Firma del Cliente","section":"firmas","x":170,"y":915,"fontSize":9,"fontWeight":"normal","color":"#000000","align":"center"},{"id":"firma_asesor","label":"Firma del Asesor / Taller","section":"firmas","x":570,"y":915,"fontSize":9,"fontWeight":"normal","color":"#000000","align":"center"}]'::jsonb
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
  '[{"id":"numero_presupuesto","label":"Número de Presupuesto","section":"encabezado","x":625,"y":192,"fontSize":14,"fontWeight":"900","color":"#DC2626","align":"left"},{"id":"cliente_nombre","label":"Nombre del Cliente","section":"cliente","x":135,"y":198,"fontSize":10.5,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"cliente_calle","label":"Calle y Número","section":"cliente","x":135,"y":219,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"cliente_cp_colonia","label":"C.P. y Colonia","section":"cliente","x":135,"y":239,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"cliente_alcaldia","label":"Alcaldía / Municipio","section":"cliente","x":135,"y":258,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"cliente_telefono","label":"Teléfono","section":"cliente","x":135,"y":277,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"auto_marca_motor","label":"Marca / Motor","section":"auto","x":505,"y":219,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"auto_modelo_color","label":"Modelo / Color","section":"auto","x":505,"y":239,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"auto_placas","label":"Matrícula / Placas","section":"auto","x":505,"y":258,"fontSize":10,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"auto_kms","label":"Kilómetros","section":"auto","x":505,"y":277,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"tabla_r1_desc","label":"R1: Refacción Descripción","section":"tabla","x":105,"y":320,"fontSize":9,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"tabla_r1_cant","label":"R1: Refacción Cantidad","section":"tabla","x":525,"y":320,"fontSize":9,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"tabla_r1_precio","label":"R1: Refacción Precio Unitario","section":"tabla","x":605,"y":320,"fontSize":9,"fontWeight":"normal","color":"#000000","align":"right"},{"id":"tabla_r1_total","label":"R1: Refacción Total","section":"tabla","x":685,"y":320,"fontSize":9,"fontWeight":"bold","color":"#000000","align":"right"},{"id":"tabla_mo1_desc","label":"MO1: Mano de Obra Descripción","section":"tabla","x":105,"y":640,"fontSize":9,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"tabla_mo1_total","label":"MO1: Mano de Obra Total","section":"tabla","x":685,"y":640,"fontSize":9,"fontWeight":"bold","color":"#000000","align":"right"},{"id":"total_refacciones","label":"Suma Total Refacciones","section":"pie_pagina","x":685,"y":605,"fontSize":10,"fontWeight":"bold","color":"#000000","align":"right"},{"id":"total_mano_obra","label":"Suma Mano de Obra","section":"pie_pagina","x":685,"y":855,"fontSize":10,"fontWeight":"bold","color":"#000000","align":"right"},{"id":"total_general","label":"Gran Total Presupuesto","section":"pie_pagina","x":685,"y":930,"fontSize":13,"fontWeight":"900","color":"#000000","align":"right"},{"id":"condicion_pago","label":"Condiciones de Pago","section":"pie_pagina","x":140,"y":929,"fontSize":10,"fontWeight":"bold","color":"#000000","align":"left"}]'::jsonb
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
  '[{"id":"fecha","label":"Fecha","section":"encabezado","x":454,"y":138,"fontSize":11,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"numero_orden","label":"Número de Orden","section":"encabezado","x":635,"y":138,"fontSize":15,"fontWeight":"900","color":"#D32F2F","align":"left"},{"id":"rotacion_presion_aire","label":"Rotación y Presión de Aire a Llantas","section":"revisiones","x":330,"y":191,"fontSize":11,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"rev_limpiaparabrisas","label":"Rev. Limpia Parabrisas y Chisgueteros","section":"revisiones","x":334,"y":227,"fontSize":11,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"rev_luces","label":"Rev. de Luces","section":"revisiones","x":160,"y":261,"fontSize":11,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"rev_niveles_general","label":"Y Niveles en General","section":"revisiones","x":323,"y":261,"fontSize":11,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"matricula_placas","label":"Matrícula / Placas","section":"auto","x":480,"y":188,"fontSize":11,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"marca_motor","label":"Marca / Motor","section":"auto","x":495,"y":212,"fontSize":10.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"modelo_color","label":"Modelo / Color","section":"auto","x":500,"y":237,"fontSize":10.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"kilometraje","label":"Kms.","section":"auto","x":450,"y":259,"fontSize":10.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"tabla_r1_marca","label":"R1: Marca","section":"tabla","x":82,"y":320,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"tabla_r1_descripcion","label":"R1: Descripción Repuesto / Trabajo","section":"tabla","x":128,"y":320,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"tabla_r1_cantidad","label":"R1: Cantidad","section":"tabla","x":664,"y":320,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"tabla_r2_marca","label":"R2: Marca","section":"tabla","x":82,"y":344,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"tabla_r2_descripcion","label":"R2: Descripción Repuesto / Trabajo","section":"tabla","x":128,"y":344,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"tabla_r2_cantidad","label":"R2: Cantidad","section":"tabla","x":664,"y":344,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"tabla_r3_marca","label":"R3: Marca","section":"tabla","x":82,"y":368,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"tabla_r3_descripcion","label":"R3: Descripción Repuesto / Trabajo","section":"tabla","x":128,"y":368,"fontSize":9.5,"fontWeight":"normal","color":"#000000","align":"left"},{"id":"tabla_r3_cantidad","label":"R3: Cantidad","section":"tabla","x":664,"y":368,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"tecnico_responsable","label":"Técnico Responsable","section":"pie_pagina","x":115,"y":934,"fontSize":10.5,"fontWeight":"bold","color":"#000000","align":"left"}]'::jsonb
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
  '[{"id":"numero_salida","label":"Número de Salida","section":"encabezado_control","x":488,"y":206,"fontSize":14,"fontFamily":"monospace","fontWeight":"900","color":"#DC2626","align":"left"},{"id":"cliente_nombre","label":"Cliente (Nombre)","section":"datos_cliente","x":140,"y":214,"fontSize":10,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"cliente_calle","label":"Calle y Número","section":"datos_cliente","x":134,"y":239,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"cliente_cp_colonia","label":"C.P. y Colonia","section":"datos_cliente","x":139,"y":258,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"cliente_alcaldia","label":"Alcaldía / Municipio","section":"datos_cliente","x":137,"y":276,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"cliente_telefono","label":"Teléfono","section":"datos_cliente","x":134,"y":293,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"vehiculo_marca_motor","label":"Marca / Motor","section":"datos_vehiculo","x":516,"y":240,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"vehiculo_modelo_color","label":"Modelo / Color","section":"datos_vehiculo","x":520,"y":259,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"vehiculo_matricula","label":"Matrícula (Placas)","section":"datos_vehiculo","x":495,"y":277,"fontSize":10,"fontWeight":"900","color":"#000000","align":"left"},{"id":"vehiculo_kilometros","label":"Kilómetros","section":"datos_vehiculo","x":504,"y":295,"fontSize":9.5,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"tabla_r1_codigo","label":"Columna Código","section":"tabla_repuestos","x":73,"y":334,"fontSize":9,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"tabla_r1_descripcion","label":"Columna Repuestos (Descripción)","section":"tabla_repuestos","x":107,"y":334,"fontSize":9,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"tabla_r1_cantidad","label":"Columna Cantidad","section":"tabla_repuestos","x":536,"y":334,"fontSize":9,"fontWeight":"bold","color":"#000000","align":"center"},{"id":"tabla_r1_importe","label":"Columna Importe Unitario","section":"tabla_repuestos","x":611,"y":334,"fontSize":9,"fontWeight":"bold","color":"#000000","align":"right"},{"id":"tabla_r1_total","label":"Columna Total Partida","section":"tabla_repuestos","x":681,"y":334,"fontSize":9,"fontWeight":"bold","color":"#000000","align":"right"},{"id":"orden_de_servicio_numero","label":"Ord. de Serv. #","section":"pie_pagina","x":504,"y":929,"fontSize":10,"fontWeight":"bold","color":"#000000","align":"left"},{"id":"total_general","label":"Total General","section":"pie_pagina","x":686,"y":933,"fontSize":13,"fontFamily":"monospace","fontWeight":"900","color":"#000000","align":"right"}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  bg_url = EXCLUDED.bg_url,
  canvas_width = EXCLUDED.canvas_width,
  canvas_height = EXCLUDED.canvas_height,
  fields = EXCLUDED.fields,
  updated_at = now();
