import React, { useState } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  Layers, 
  ShieldCheck, 
  Network, 
  Key, 
  FileCode, 
  Server,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'prisma' | 'sql' | 'er' | 'architecture'>('prisma');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const PRISMA_SCHEMA = `// ==========================================================
// MICARTA MULTI-TENANT ARCHITECTURE SCHEMA (Prisma ORM)
// Database: PostgreSQL 16+ with Row-Level Security (RLS)
// ==========================================================

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ----------------------------------------------------------
// 1. ROLES DEL SISTEMA (6 NIVELES DE ACCESO ESTRICTOS)
// ----------------------------------------------------------
enum SystemRole {
  ADMIN               // Superadministrador SaaS (Acceso global)
  OWNER               // Dueño de franquicia / Cadena de restaurantes
  RESTAURANT_MANAGER  // Gerente o administrador de local específico
  WAITER              // Mesero / Mozo (Comandas en salón y mesas)
  DELIVERY            // Repartidor motorizado (Órdenes a domicilio)
  CUSTOMER            // Cliente final (Carta QR, autoservicio)
}

enum OrderStatus {
  PENDING             // Recibido / Por confirmar
  IN_KITCHEN          // En preparación en cocina
  READY               // Listo para entrega o despacho
  ON_THE_WAY          // En camino con repartidor
  DELIVERED           // Entregado y cerrado
  CANCELLED           // Cancelado con motivo
}

enum OrderType {
  DINE_IN             // En mesa / Salón
  TAKEAWAY            // Para recoger en barra
  DELIVERY            // Despacho a domicilio
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}

// ----------------------------------------------------------
// 2. MULTI-TENANCY & RESTAURANTES (LINK ÚNICO Y BRANDING)
// ----------------------------------------------------------
model Restaurant {
  id              String         @id @default(uuid())
  slug            String         @unique // Link único editable: /r/brasas-fuego
  name            String
  tagline         String?
  cuisineType     String
  phone           String?
  address         String?
  latitude        Float?
  longitude       Float?
  isActive        Boolean        @default(true)
  
  // Identidad Visual y Paleta de Colores Independiente (JSONB)
  brandingConfig  Json           // { primary: "#EA580C", secondary: "#C2410C", accent: "#F59E0B", darkBg: "#18181B", font: "Syne" }
  
  // Relaciones
  ownerId         String
  owner           User           @relation("OwnerRestaurants", fields: [ownerId], references: [id])
  staffMembers    RestaurantStaff[]
  categories      MenuCategory[]
  menuItems       MenuItem[]
  diningTables    DiningTable[]
  orders          Order[]
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([slug])
  @@index([ownerId])
}

// ----------------------------------------------------------
// 3. USUARIOS Y ASIGNACIÓN DE ROLES (RBAC MULTI-TENANT)
// ----------------------------------------------------------
model User {
  id              String         @id @default(uuid())
  email           String         @unique
  passwordHash    String
  fullName        String
  phone           String?
  avatarUrl       String?
  systemRole      SystemRole     @default(CUSTOMER)
  isActive        Boolean        @default(true)
  
  // Relaciones
  ownedRestaurants Restaurant[]   @relation("OwnerRestaurants")
  staffProfiles    RestaurantStaff[]
  placedOrders     Order[]        @relation("CustomerOrders")
  deliveredOrders  Order[]        @relation("CourierOrders")
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([email])
  @@index([systemRole])
}

// Tabla pivote para asignar personal a sedes específicas
model RestaurantStaff {
  id              String         @id @default(uuid())
  userId          String
  restaurantId    String
  assignedRole    SystemRole     // RESTAURANT_MANAGER, WAITER, DELIVERY
  isActive        Boolean        @default(true)
  
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  restaurant      Restaurant     @relation(fields: [restaurantId], references: [id], onDelete: Cascade)

  createdAt       DateTime       @default(now())

  @@unique([userId, restaurantId, assignedRole])
  @@index([restaurantId])
}

// ----------------------------------------------------------
// 4. CARTA DIGITAL: CATEGORÍAS Y PLATOS
// ----------------------------------------------------------
model MenuCategory {
  id              String         @id @default(uuid())
  restaurantId    String
  name            String
  description     String?
  sortOrder       Int            @default(0)
  isActive        Boolean        @default(true)

  restaurant      Restaurant     @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  items           MenuItem[]

  createdAt       DateTime       @default(now())

  @@index([restaurantId, sortOrder])
}

model MenuItem {
  id              String         @id @default(uuid())
  restaurantId    String
  categoryId      String
  name            String
  description     String
  price           Decimal        @db.Decimal(10, 2)
  imageUrl        String?
  isAvailable     Boolean        @default(true)
  isChefSpecial   Boolean        @default(false)
  isPopular       Boolean        @default(false)
  prepTimeMinutes Int            @default(15)
  allergens       String[]       // Array de alérgenos: ["Gluten", "Lácteos"]

  restaurant      Restaurant     @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  category        MenuCategory   @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  orderItems      OrderItem[]

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([restaurantId, categoryId])
  @@index([restaurantId, isAvailable])
}

// ----------------------------------------------------------
// 5. MESAS Y SALÓN
// ----------------------------------------------------------
model DiningTable {
  id              String         @id @default(uuid())
  restaurantId    String
  tableNumber     String         // Ej: "Mesa 04", "Terraza 2"
  capacity        Int            @default(4)
  qrCodeUrl       String?        // URL de enlace con el slug del local
  isOccupied      Boolean        @default(false)

  restaurant      Restaurant     @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  orders          Order[]

  @@unique([restaurantId, tableNumber])
}

// ----------------------------------------------------------
// 6. COMANDAS Y PEDIDOS EN TIEMPO REAL (KDS)
// ----------------------------------------------------------
model Order {
  id              String         @id @default(uuid())
  restaurantId    String
  orderNumber     String         // Consecutivo diario, ej: "BF-104"
  type            OrderType      @default(DINE_IN)
  status          OrderStatus    @default(PENDING)
  paymentStatus   PaymentStatus  @default(PENDING)
  
  // Vinculaciones opcionales según el tipo de pedido
  tableId         String?
  diningTable     DiningTable?   @relation(fields: [tableId], references: [id])
  
  customerId      String?
  customer        User?          @relation("CustomerOrders", fields: [customerId], references: [id])
  customerName    String
  customerPhone   String?
  deliveryAddress String?
  
  // Personal involucrado
  courierId       String?
  courier         User?          @relation("CourierOrders", fields: [courierId], references: [id])
  
  // Montos
  subtotal        Decimal        @db.Decimal(10, 2)
  tax             Decimal        @db.Decimal(10, 2)
  deliveryFee     Decimal        @default(0.00) @db.Decimal(10, 2)
  total           Decimal        @db.Decimal(10, 2)
  
  restaurant      Restaurant     @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  items           OrderItem[]

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([restaurantId, status])
  @@index([restaurantId, createdAt])
}

model OrderItem {
  id              String         @id @default(uuid())
  orderId         String
  menuItemId      String
  name            String         // Snapshot histórico del nombre
  unitPrice       Decimal        @db.Decimal(10, 2)
  quantity        Int            @default(1)
  notes           String?        // Ej: "Término medio, sin sal"
  modifiers       Json?          // Modificadores seleccionados

  order           Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItem        MenuItem       @relation(fields: [menuItemId], references: [id])

  @@index([orderId])
}`;

  const SQL_DDL = `-- ==========================================================
-- MICARTA: POSTGRESQL MULTI-TENANT DDL & RLS POLICIES
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TIPOS ENUMERADOS
CREATE TYPE system_role AS ENUM (
  'ADMIN', 'OWNER', 'RESTAURANT_MANAGER', 'WAITER', 'DELIVERY', 'CUSTOMER'
);

CREATE TYPE order_status AS ENUM (
  'PENDING', 'IN_KITCHEN', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'
);

CREATE TYPE order_type AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- 2. TABLA DE USUARIOS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  system_role system_role NOT NULL DEFAULT 'CUSTOMER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA DE RESTAURANTES (TENANT ROOT CON LINK ÚNICO EDITABLE)
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL, -- Link único: /r/brasas-fuego
  name VARCHAR(255) NOT NULL,
  tagline TEXT,
  cuisine_type VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  branding_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Paleta de colores aislada
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);

-- 4. PERSONAL ASIGNADO POR RESTAURANTE
CREATE TABLE restaurant_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  assigned_role system_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id, assigned_role)
);

-- 5. CATEGORÍAS DE CARTA DIGITAL
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PLATOS DEL MENÚ
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_chef_special BOOLEAN NOT NULL DEFAULT FALSE,
  prep_time_minutes INT NOT NULL DEFAULT 15,
  allergens TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_rest_cat ON menu_items(restaurant_id, category_id);

-- 7. PEDIDOS Y COMANDAS EN TIEMPO REAL
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  type order_type NOT NULL DEFAULT 'DINE_IN',
  status order_status NOT NULL DEFAULT 'PENDING',
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  table_number VARCHAR(50),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  delivery_address TEXT,
  courier_id UUID REFERENCES users(id),
  subtotal NUMERIC(10, 2) NOT NULL,
  tax NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_rest_status ON orders(restaurant_id, status);

-- 8. POLÍTICA DE ROW-LEVEL SECURITY (RLS) PARA AISLAMIENTO DE TENANTS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_orders ON orders
  FOR ALL
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND system_role = 'ADMIN'
    )
  );`;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Entregable Técnico 1
              </span>
              <span className="text-xs text-neutral-400">Arquitectura Backend & Esquema Relacional</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne']">
              Esquema de Base de Datos & Multitenencia SaaS
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Diseño relacional escalable para soportar 6 roles de usuario, aislamiento estricto de datos por sede, links únicos editables y cartas digitales independientes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center min-w-[100px]">
              <span className="text-[11px] text-neutral-400 block">Roles RBAC</span>
              <strong className="text-sm font-bold text-white">6 Niveles</strong>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center min-w-[100px]">
              <span className="text-[11px] text-neutral-400 block">Aislamiento</span>
              <strong className="text-sm font-bold text-white">RLS + Slug</strong>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-neutral-800">
          <button
            onClick={() => setActiveSubTab('prisma')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
              activeSubTab === 'prisma'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Prisma Schema</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sql')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
              activeSubTab === 'sql'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQL DDL + RLS</span>
          </button>

          <button
            onClick={() => setActiveSubTab('er')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
              activeSubTab === 'er'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Diagrama ER</span>
          </button>

          <button
            onClick={() => setActiveSubTab('architecture')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
              activeSubTab === 'architecture'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Patrones & Seguridad</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'prisma' && (
        <div className="relative rounded-3xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-xl">
          <div className="px-5 py-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-neutral-400 ml-2">prisma/schema.prisma</span>
            </div>
            <button
              onClick={() => copyToClipboard(PRISMA_SCHEMA, 'prisma')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition cursor-pointer"
            >
              {copied === 'prisma' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Prisma Schema</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-xs font-mono text-neutral-300 overflow-x-auto leading-relaxed max-h-[620px] scrollbar-thin scrollbar-thumb-neutral-700">
            {PRISMA_SCHEMA}
          </pre>
        </div>
      )}

      {activeSubTab === 'sql' && (
        <div className="relative rounded-3xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-xl">
          <div className="px-5 py-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-neutral-400 ml-2">database/schema.sql (PostgreSQL)</span>
            </div>
            <button
              onClick={() => copyToClipboard(SQL_DDL, 'sql')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition cursor-pointer"
            >
              {copied === 'sql' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SQL DDL</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-xs font-mono text-neutral-300 overflow-x-auto leading-relaxed max-h-[620px] scrollbar-thin scrollbar-thumb-neutral-700">
            {SQL_DDL}
          </pre>
        </div>
      )}

      {activeSubTab === 'er' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Entity: Restaurant */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white">Restaurant (Tenant Root)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">1 : N</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-neutral-300">
              <li className="text-amber-400 font-bold">🔑 id: UUID (PK)</li>
              <li className="text-emerald-400 font-semibold">🔗 slug: VARCHAR (UNIQUE)</li>
              <li>name: VARCHAR(255)</li>
              <li>cuisine_type: VARCHAR(100)</li>
              <li className="text-cyan-400">branding_config: JSONB</li>
              <li>owner_id: UUID (FK ➔ User)</li>
              <li>is_active: BOOLEAN</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
              Controla link público, paleta de colores CSS y límite de comandas.
            </div>
          </div>

          {/* Entity: User & Roles */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white">User (6 Roles)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">1 : N</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-neutral-300">
              <li className="text-purple-400 font-bold">🔑 id: UUID (PK)</li>
              <li className="text-neutral-200">email: VARCHAR (UNIQUE)</li>
              <li>password_hash: VARCHAR</li>
              <li>full_name: VARCHAR</li>
              <li className="text-amber-400 font-semibold">system_role: ENUM</li>
              <li className="text-neutral-500 pl-4 text-[10px] leading-tight">
                [ADMIN, OWNER, RESTAURANT_MANAGER, WAITER, DELIVERY, CUSTOMER]
              </li>
            </ul>
            <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
              Autenticación JWT con claims de rol y multi-tenant scopes.
            </div>
          </div>

          {/* Entity: RestaurantStaff */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:border-blue-500/40 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Network className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white">RestaurantStaff (N:M)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">Join Table</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-neutral-300">
              <li className="text-blue-400 font-bold">🔑 id: UUID (PK)</li>
              <li>user_id: UUID (FK ➔ User)</li>
              <li>restaurant_id: UUID (FK ➔ Restaurant)</li>
              <li className="text-amber-400">assigned_role: ENUM</li>
              <li>is_active: BOOLEAN</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
              Permite que un mesero o gerente trabaje en una o varias sedes simultáneamente.
            </div>
          </div>

          {/* Entity: MenuCategory & Items */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white">MenuItem (Carta Digital)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">N : 1</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-neutral-300">
              <li className="text-emerald-400 font-bold">🔑 id: UUID (PK)</li>
              <li>restaurant_id: UUID (FK)</li>
              <li>category_id: UUID (FK)</li>
              <li>name: VARCHAR</li>
              <li className="text-amber-400">price: NUMERIC(10,2)</li>
              <li>is_available: BOOLEAN</li>
              <li>allergens: TEXT[]</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
              Soporta modificadores (término de carne, salsas, extras) e imágenes.
            </div>
          </div>

          {/* Entity: Order & OrderItems */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:border-rose-500/40 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                  <Server className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white">Order (Comandas en Vivo)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">1 : N Items</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-neutral-300">
              <li className="text-rose-400 font-bold">🔑 id: UUID (PK)</li>
              <li>restaurant_id: UUID (FK)</li>
              <li className="text-emerald-400">order_number: VARCHAR</li>
              <li className="text-amber-400">type: [DINE_IN, TAKEAWAY, DELIVERY]</li>
              <li className="text-cyan-400">status: [PENDING..DELIVERED]</li>
              <li>courier_id: UUID (FK ➔ User)</li>
              <li>total: NUMERIC(10,2)</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
              Base del Kitchen Display System (KDS) y liquidación de propinas.
            </div>
          </div>

          {/* Entity: DiningTable */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:border-cyan-500/40 transition">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white">DiningTable (Mesas & QR)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">1 : N Orders</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-neutral-300">
              <li className="text-cyan-400 font-bold">🔑 id: UUID (PK)</li>
              <li>restaurant_id: UUID (FK)</li>
              <li>table_number: VARCHAR</li>
              <li>capacity: INT</li>
              <li className="text-emerald-400">qr_code_url: TEXT</li>
              <li>is_occupied: BOOLEAN</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
              QR dinámico con token de mesa para pedidos directos sin app móvil.
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'architecture' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/70">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2 font-['Syne']">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Decisiones de Arquitectura de Software (Senior Architect Insights)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-300 leading-relaxed mt-4">
              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <h4 className="font-bold text-amber-400 mb-1">1. Estrategia de Multitenencia</h4>
                <p className="text-xs text-neutral-400">
                  Optamos por <strong>Base de datos compartida con discriminador de Tenant y Row-Level Security (RLS)</strong>. Este enfoque minimiza el costo de infraestructura en etapa de escalamiento masivo mientras que garantiza un aislamiento criptográfico y lógico mediante políticas SQL que impiden que un restaurante acceda a las comandas de otro.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <h4 className="font-bold text-amber-400 mb-1">2. Enlace Único Editable (Slug Engine)</h4>
                <p className="text-xs text-neutral-400">
                  Cada restaurante define su slug en el campo <code>slug</code> con restricción <code>UNIQUE</code>. El router frontend resuelve las rutas <code>/r/:slug</code> y consulta el backend con cache en Redis, cargando en menos de 50ms la configuración de branding e imagen del restaurante.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <h4 className="font-bold text-amber-400 mb-1">3. Control de Acceso Basado en Roles (RBAC 6 Niveles)</h4>
                <p className="text-xs text-neutral-400">
                  Los 6 niveles cubren desde la administración del cluster SaaS (superadmin), pasando por los dueños con reportes de utilidades consolidados, gerentes de sede, meseros con terminal de comandas ultra-ágil, repartidores con geolocalización, hasta clientes sin registro previo vía escaneo QR.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <h4 className="font-bold text-amber-400 mb-1">4. Paletas de Colores Dinámicas (CSS Variables Injected)</h4>
                <p className="text-xs text-neutral-400">
                  La columna <code>branding_config (JSONB)</code> almacena las propiedades cromáticas. En tiempo de ejecución, el cliente renderiza las vistas inyectando variables CSS en el elemento raíz (<code>--primary</code>, <code>--accent</code>, <code>--dark-bg</code>), manteniendo el bundle de Tailwind liviano y 100% personalizable.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
