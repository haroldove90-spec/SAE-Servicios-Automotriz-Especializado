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
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
