import { Restaurant, MenuCategory, MenuItem, User, Order, DaySchedule, RestaurantTable, StaffShift, TableZone } from '../types';

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { day: 'Lunes', isOpen: true, openTime: '12:00', closeTime: '23:00', notes: 'Almuerzo & Cena a la brasa' },
  { day: 'Martes', isOpen: true, openTime: '12:00', closeTime: '23:00', notes: 'Almuerzo & Cena a la brasa' },
  { day: 'Miércoles', isOpen: true, openTime: '12:00', closeTime: '23:30', notes: 'Cenas & Noches de Pisco' },
  { day: 'Jueves', isOpen: true, openTime: '12:00', closeTime: '00:00', notes: 'Horario nocturno extendido' },
  { day: 'Viernes', isOpen: true, openTime: '12:00', closeTime: '01:00', notes: 'Música en vivo & Cenas' },
  { day: 'Sábado', isOpen: true, openTime: '11:30', closeTime: '01:00', notes: 'Servicio continuo de fin de semana' },
  { day: 'Domingo', isOpen: true, openTime: '11:30', closeTime: '22:30', notes: 'Almuerzos familiares' },
];

export const generateTablesForRestaurant = (
  restaurantId: string, 
  count: number = 12,
  waiterIds: string[] = ['u-5', 'u-5b', 'u-5c']
): RestaurantTable[] => {
  return Array.from({ length: count }, (_, idx) => {
    const num = idx + 1;
    const zone: TableZone = num <= 5 ? 'SALON' : num <= 8 ? 'TERRAZA' : num <= 11 ? 'VIP' : 'BARRA';
    const capacity = num % 4 === 0 ? 6 : num % 2 === 0 ? 4 : 2;
    const assignedWaiter = waiterIds.length > 0 ? [waiterIds[idx % waiterIds.length]] : [];
    
    return {
      id: `tbl-${restaurantId}-${num}`,
      restaurantId,
      number: num,
      name: `Mesa ${num < 10 ? '0' + num : num}`,
      zone,
      capacity,
      status: num === 4 || num === 2 ? 'OCCUPIED' : num === 8 ? 'RESERVED' : 'AVAILABLE',
      assignedWaiterIds: assignedWaiter,
      currentOrderId: num === 4 ? 'ord-101' : undefined,
      qrCodeParam: `${num}`,
      notes: zone === 'TERRAZA' ? 'Zona exterior con vista' : zone === 'VIP' ? 'Box privado climatizado' : undefined
    };
  });
};

export const generateShiftsForRestaurant = (
  restaurantId: string,
  waiterIds: string[] = ['u-5', 'u-5b'],
  riderIds: string[] = ['u-7']
): StaffShift[] => [
  {
    id: `shift-${restaurantId}-1`,
    restaurantId,
    name: 'Turno Mañana (Almuerzos Salón)',
    startTime: '11:00',
    endTime: '16:30',
    applicableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    roleTarget: 'WAITER',
    assignedUserIds: waiterIds.slice(0, 1),
    colorBadge: '#38BDF8'
  },
  {
    id: `shift-${restaurantId}-2`,
    restaurantId,
    name: 'Turno Tarde / Cenas & Coctelería',
    startTime: '16:30',
    endTime: '23:30',
    applicableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    roleTarget: 'WAITER',
    assignedUserIds: waiterIds.slice(1, 2).length ? waiterIds.slice(1, 2) : waiterIds.slice(0, 1),
    colorBadge: '#F59E0B'
  },
  {
    id: `shift-${restaurantId}-3`,
    restaurantId,
    name: 'Turno Motorizado Delivery & Despacho',
    startTime: '18:00',
    endTime: '00:30',
    applicableDays: ['Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    roleTarget: 'DELIVERY',
    assignedUserIds: riderIds,
    colorBadge: '#10B981'
  },
  {
    id: `shift-${restaurantId}-4`,
    restaurantId,
    name: 'Turno Cocina & Comandas (KDS)',
    startTime: '11:00',
    endTime: '23:30',
    applicableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    roleTarget: 'KITCHEN',
    assignedUserIds: ['u-k1'],
    colorBadge: '#F97316'
  }
];

export const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-brasas',
    name: 'Brasas y Fuegos',
    tagline: 'Cortes Angus a la Leña, Parrillas Familiares & Coctelería de Autor',
    cuisineType: 'Parrillas & Carnes al Carbón',
    slug: 'brasas-y-fuegos',
    address: 'Av. Los Conquistadores 840, San Isidro',
    phone: '+51 987 654 321',
    rating: 4.9,
    reviewCount: 428,
    logoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&auto=format&fit=crop&q=80',
    ownerId: 'u-2',
    templateId: 'tmpl-luxury',
    branding: {
      primaryColor: '#D4AF37',       // Oro noble
      secondaryColor: '#0F2D24',     // Verde esmeralda oscuro
      accentColor: '#E2C275',        // Dorado champagne
      darkBgColor: '#071A14',        // Esmeralda noche profundo
      cardBgColor: '#0C261F',
      textColor: '#FAF8F5',
      fontDisplay: 'Cinzel, serif'
    },
    metrics: {
      dailyRevenue: 4890.50,
      activeOrders: 9,
      avgTicket: 48.20,
      customerRating: 4.9,
      totalTables: 24,
      occupancyRate: 85
    },
    isOpen: true,
    totalTablesCount: 24,
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    shifts: generateShiftsForRestaurant('rest-brasas', ['u-5'], ['u-7']),
    tables: generateTablesForRestaurant('rest-brasas', 24, ['u-5']),
    waiterPermissions: {
      canCancelOrders: false,
      canApplyDiscounts: true,
      canAssignTables: true,
      canSplitBills: true,
      requireSupervisorPin: true,
      maxActiveTables: 6
    },
    kitchenPermissions: {
      canMarkReady: true,
      canRejectItems: true,
      canManageStockOut: true,
      canReorderQueue: true,
      autoPrintTickets: true,
      soundAlerts: true,
      stationFilter: 'Parrilla & Carnes'
    },
    deliveryPermissions: {
      canAcceptCash: true,
      maxActiveOrders: 3,
      autoAssignZone: true,
      gpsSpeedTracking: true,
      allowedZones: ['San Isidro', 'Miraflores', 'San Borja']
    },
    customerAccessSettings: {
      qrOrderingEnabled: true,
      guestCheckout: true,
      allowCashAtTable: true,
      vipDiscountPercent: 10,
      maxOrderAmount: 500,
      welcomeMessage: '¡Bienvenidos al templo del fuego y la parrilla artesanal!',
      wifiPassword: 'BrasasFuego2026'
    }
  },
  {
    id: 'rest-criollo',
    name: 'Criollo & Tradición',
    tagline: 'Sazón Criolla Ancestral & Pisco Bar',
    cuisineType: 'Comida Criolla',
    slug: 'criollo-tradicion',
    address: 'Jr. Huallaga 412, Centro Histórico',
    phone: '+51 912 345 678',
    rating: 4.8,
    reviewCount: 512,
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&auto=format&fit=crop&q=80',
    ownerId: 'u-3',
    templateId: 'tmpl-criollo',
    branding: {
      primaryColor: '#B45309',       // Terracota cálido
      secondaryColor: '#78350F',     // Madera caoba
      accentColor: '#D97706',        // Ají amarillo ocre
      darkBgColor: '#1C1917',        // Piedra oscura
      cardBgColor: '#292524',
      textColor: '#FFFBEB',
      fontDisplay: 'Plus Jakarta Sans, sans-serif'
    },
    metrics: {
      dailyRevenue: 3420.00,
      activeOrders: 6,
      avgTicket: 32.50,
      customerRating: 4.8,
      totalTables: 20,
      occupancyRate: 70
    },
    isOpen: true,
    totalTablesCount: 20,
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    shifts: generateShiftsForRestaurant('rest-criollo', ['u-5b'], ['u-7']),
    tables: generateTablesForRestaurant('rest-criollo', 20, ['u-5b']),
    waiterPermissions: {
      canCancelOrders: true,
      canApplyDiscounts: false,
      canAssignTables: true,
      canSplitBills: true,
      requireSupervisorPin: false,
      maxActiveTables: 8
    },
    kitchenPermissions: {
      canMarkReady: true,
      canRejectItems: true,
      canManageStockOut: true,
      canReorderQueue: true,
      autoPrintTickets: true,
      soundAlerts: true,
      stationFilter: 'Cocina Caliente & Guisos'
    },
    deliveryPermissions: {
      canAcceptCash: true,
      maxActiveOrders: 4,
      autoAssignZone: true,
      gpsSpeedTracking: false,
      allowedZones: ['Centro de Lima', 'Breña', 'Jesús María']
    },
    customerAccessSettings: {
      qrOrderingEnabled: true,
      guestCheckout: true,
      allowCashAtTable: true,
      vipDiscountPercent: 15,
      maxOrderAmount: 350,
      welcomeMessage: 'Sazón con tradición de antaño y cocteles de pisco puro.',
      wifiPassword: 'CriolloPisco2026'
    }
  },
  {
    id: 'rest-loop',
    name: 'Loop Burger & Subs',
    tagline: 'Smash Burgers Dobles, Subs Gourmet & Shakes',
    cuisineType: 'Sandwichería & Burgers',
    slug: 'loop-burger-subs',
    address: 'Calle Schell 319, Miraflores',
    phone: '+51 999 111 222',
    rating: 4.7,
    reviewCount: 680,
    logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&auto=format&fit=crop&q=80',
    ownerId: 'u-2',
    templateId: 'tmpl-neon',
    branding: {
      primaryColor: '#DC2626',       // Rojo dinamita
      secondaryColor: '#991B1B',     // Borgoña street
      accentColor: '#F59E0B',        // Queso Cheddar fundido
      darkBgColor: '#09090B',        // Negro asfalto
      cardBgColor: '#18181B',
      textColor: '#FFFFFF',
      fontDisplay: 'Syne, sans-serif'
    },
    metrics: {
      dailyRevenue: 5210.80,
      activeOrders: 14,
      avgTicket: 22.90,
      customerRating: 4.7,
      totalTables: 16,
      occupancyRate: 92
    },
    isOpen: true,
    totalTablesCount: 16,
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    shifts: generateShiftsForRestaurant('rest-loop', ['u-5'], ['u-7']),
    tables: generateTablesForRestaurant('rest-loop', 16, ['u-5']),
    waiterPermissions: {
      canCancelOrders: false,
      canApplyDiscounts: true,
      canAssignTables: true,
      canSplitBills: false,
      requireSupervisorPin: false,
      maxActiveTables: 5
    },
    kitchenPermissions: {
      canMarkReady: true,
      canRejectItems: true,
      canManageStockOut: true,
      canReorderQueue: true,
      autoPrintTickets: true,
      soundAlerts: true,
      stationFilter: 'Plancha Smash & Frituras'
    },
    deliveryPermissions: {
      canAcceptCash: false,
      maxActiveOrders: 5,
      autoAssignZone: true,
      gpsSpeedTracking: true,
      allowedZones: ['Miraflores', 'Barranco', 'San Isidro', 'Surquillo']
    },
    customerAccessSettings: {
      qrOrderingEnabled: true,
      guestCheckout: true,
      allowCashAtTable: false,
      vipDiscountPercent: 10,
      maxOrderAmount: 200,
      welcomeMessage: 'Smash auténtico, pan brioche horneado a diario y shakes cremosos.',
      wifiPassword: 'LoopSmash2026'
    }
  },
  {
    id: 'rest-costa',
    name: 'Costa Marina',
    tagline: 'Cevichito Pliz - Cevichería Contemporánea & Pesca Artesanal del Día',
    cuisineType: 'Cevichería & Mariscos',
    slug: 'cevichito-pliz',
    address: 'Malecón de la Reserva 102, Miraflores',
    phone: '+51 945 678 901',
    rating: 4.9,
    reviewCount: 390,
    logoUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=160&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=900&auto=format&fit=crop&q=80',
    ownerId: 'u-3',
    templateId: 'tmpl-marine',
    branding: {
      primaryColor: '#1B667A',       // Azul verdoso oscuro
      secondaryColor: '#8A9B57',     // Verde olivo
      accentColor: '#D98262',        // Terracota
      darkBgColor: '#EAEBDC',        // Crema marfil
      cardBgColor: '#EAEBDC',
      dishCardBgColor: '#EAEBDC',
      textColor: '#1B667A',          // Azul verdoso oscuro
      fontDisplay: 'Outfit, sans-serif',
      buttonColor: '#D98262',        // Botón terracota
      buttonTextColor: '#EAEBDC',    // Texto crema marfil
      restaurantNameFont: 'Outfit, sans-serif',
      restaurantNameColor: '#1B667A' // Nombre en azul verdoso oscuro
    },
    metrics: {
      dailyRevenue: 4150.20,
      activeOrders: 8,
      avgTicket: 41.00,
      customerRating: 4.9,
      totalTables: 22,
      occupancyRate: 78
    },
    isOpen: true,
    totalTablesCount: 22,
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    shifts: generateShiftsForRestaurant('rest-costa', ['u-5c'], ['u-7']),
    tables: generateTablesForRestaurant('rest-costa', 22, ['u-5c']),
    waiterPermissions: {
      canCancelOrders: false,
      canApplyDiscounts: false,
      canAssignTables: true,
      canSplitBills: true,
      requireSupervisorPin: true,
      maxActiveTables: 6
    },
    kitchenPermissions: {
      canMarkReady: true,
      canRejectItems: true,
      canManageStockOut: true,
      canReorderQueue: true,
      autoPrintTickets: true,
      soundAlerts: true,
      stationFilter: 'Barra Marina & Cebichería'
    },
    deliveryPermissions: {
      canAcceptCash: true,
      maxActiveOrders: 3,
      autoAssignZone: true,
      gpsSpeedTracking: true,
      allowedZones: ['Miraflores', 'San Isidro', 'Barranco']
    },
    customerAccessSettings: {
      qrOrderingEnabled: true,
      guestCheckout: true,
      allowCashAtTable: true,
      vipDiscountPercent: 12,
      maxOrderAmount: 600,
      welcomeMessage: 'Pesca artesanal del litoral peruano y ceviches al momento.',
      wifiPassword: 'CostaMarina2026'
    }
  }
];

export const INITIAL_CATEGORIES: MenuCategory[] = [
  // Brasas y Fuegos
  { id: 'cat-b-parrillas', restaurantId: 'rest-brasas', name: 'Parrillas Familiares', description: 'Cortes nobles madurados y parrilladas generosas para compartir en familia', sortOrder: 1, iconName: 'Flame' },
  { id: 'cat-b-entradas', restaurantId: 'rest-brasas', name: 'Entradas&Tablas', description: 'Anticuchos al carbón, tablas de charcutería artesanal y quesos fundidos', sortOrder: 2, iconName: 'Utensils' },
  { id: 'cat-b-bebidas', restaurantId: 'rest-brasas', name: 'Licores y Bebidas', description: 'Coctelería de autor con destilados premium, piscos macerados y vinos de cava', sortOrder: 3, iconName: 'Wine' },

  // Criollo & Tradición
  { id: 'cat-c-parrillas', restaurantId: 'rest-criollo', name: 'Parrillas Familiares', description: 'Cortes seleccionados a las brasas de leña para compartir en familia', sortOrder: 1, iconName: 'Flame' },
  { id: 'cat-c-entradas', restaurantId: 'rest-criollo', name: 'Entradas&Tablas', description: 'Anticuchos de corazón, causas señoriales y tablas criollas para compartir', sortOrder: 2, iconName: 'Utensils' },
  { id: 'cat-c-bebidas', restaurantId: 'rest-criollo', name: 'Licores y Bebidas', description: 'Pisco sour catedral, chilcanos macerados y chichas tradicionales', sortOrder: 3, iconName: 'Wine' },

  // Loop Burger
  { id: 'cat-l1', restaurantId: 'rest-loop', name: 'Smash Burgers', description: '100% carne de res con costra caramelizada', sortOrder: 1, iconName: 'Sandwich' },
  { id: 'cat-l2', restaurantId: 'rest-loop', name: 'Subs & Chicken', description: 'Pan brioche horneado a diario y pollo crocante', sortOrder: 2, iconName: 'Wheat' },
  { id: 'cat-l3', restaurantId: 'rest-loop', name: 'Fries & Sides', description: 'Papas sazonadas y dips adictivos', sortOrder: 3, iconName: 'Sparkles' },

  // Costa Marina
  { id: 'cat-m1', restaurantId: 'rest-costa', name: 'Ceviches & Tiraditos', description: 'Pesca artesanal fresca del litoral', sortOrder: 1, iconName: 'Fish' },
  { id: 'cat-m2', restaurantId: 'rest-costa', name: 'Chicharrones & Wok', description: 'Frituras crocantes y arroces marineros', sortOrder: 2, iconName: 'Waves' },
  { id: 'cat-m3', restaurantId: 'rest-costa', name: 'Cócteles de Autor', description: 'Chilcanos de maracuyá y pisco sour premium', sortOrder: 3, iconName: 'GlassWater' }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Brasas y Fuegos - Parrillas Familiares
  {
    id: 'item-bf-parrilla-1',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-parrillas',
    name: 'Gran Parrilla Suprema "Brasas y Fuegos"',
    description: 'Bife ancho Angus (500g), picaña madurada (400g), costillar glaseado y chorizo parrillero. Acompañado de papas nativas doradas al romero y chimichurri ahumado de la casa.',
    price: 185,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 30,
    allergens: [],
    tags: ['Para 4 a 5 Personas', 'Cortes Angus', 'Quebracho Blanco']
  },
  {
    id: 'item-bf-parrilla-2',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-parrillas',
    name: 'Parrilla Criolla Mixta Campestre',
    description: 'Lomo fino tierno al carbón, panceta crujiente, anticuchos de corazón y morcilla criolla. Servido con yucas crocantes al ajo y emulsión de ají rocoto parrillero.',
    price: 145,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 25,
    allergens: [],
    tags: ['Para 3 a 4 Personas', 'Sabor Tradicional']
  },
  {
    id: 'item-bf-parrilla-3',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-parrillas',
    name: 'Tabla de Cortes Nobles al Carbón',
    description: 'Ojo de bife Angus (450g) y entraña fina marinada al quebracho. Guarnición de papas trufadas con queso parmesano y reducción de vino malbec con chimichurri rústico.',
    price: 135,
    imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isChefSpecial: true,
    prepTimeMinutes: 25,
    allergens: ['Lácteos'],
    tags: ['Para 2 a 3 Personas', 'Maduración 28 Días']
  },
  {
    id: 'item-bf-parrilla-4',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-parrillas',
    name: 'Costillar Baby Back Ahumado Familiar',
    description: 'Rack entero de costillas tiernas ahumadas por 6 horas en leña de manzano. Con puré de camote rústico a la canela y glaseado BBQ artesanal con miel de algarrobina.',
    price: 120,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 20,
    allergens: [],
    tags: ['Ahumado Lento', 'BBQ Artesanal']
  },

  // Brasas y Fuegos - Entradas&Tablas
  {
    id: 'item-bf-entrada-1',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-entradas',
    name: 'Anticuchos de Corazón Selecto al Carbón',
    description: 'Tres brochetas jugosas de corazón de res maceradas en ají panca y vinagre de uva. Con papas doradas a la plancha, choclo tierno y ají carretillero de la casa.',
    price: 38,
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 15,
    allergens: [],
    tags: ['Receta Clásica', 'Ají Panca de Ica']
  },
  {
    id: 'item-bf-entrada-2',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-entradas',
    name: 'Provoleta al Hierro con Champiñones',
    description: 'Queso provolone hilado fundido con orégano silvestre y champiñones al ajillo. Acompañado de tostadas de pan de campo masa madre y oliva extra virgen.',
    price: 34,
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 12,
    allergens: ['Lácteos', 'Gluten'],
    tags: ['Vegetariano', 'Queso Fundido']
  },
  {
    id: 'item-bf-entrada-3',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-entradas',
    name: 'Mollejitas Crocantes al Limón Parrillero',
    description: 'Mollejas tiernas selladas a fuego vivo con sal marina de Maras y toque de limón sutil. Con yucas crocantes doradas y emulsión tártara rústica de huacatay.',
    price: 32,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 14,
    allergens: [],
    tags: ['Crujiente', 'Favorito']
  },
  {
    id: 'item-bf-entrada-4',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-entradas',
    name: 'Tabla de Chorizos & Morcilla Artesanal',
    description: 'Dúo de chorizos argentinos y morcilla criolla especiada al carbón. Servidos con champiñones parrillados, papas canchan asadas y chimichurri clásico.',
    price: 36,
    imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 15,
    allergens: [],
    tags: ['Embutidos Propios', 'Al Carbón']
  },

  // Brasas y Fuegos - Licores y Bebidas
  {
    id: 'item-bf-bebida-1',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-bebidas',
    name: 'Pisco Sour Quebranta Tradicional (Copa Doble)',
    description: 'Destilado 100% uva Quebranta de Ica (4 oz), zumo de limón sutil recién exprimido, clara batida y jarabe de goma artesanal con gotas de amargo de angostura.',
    price: 28,
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 5,
    allergens: ['Huevo'],
    tags: ['Coctel Bandera', '4 oz Pisco Puro']
  },
  {
    id: 'item-bf-bebida-2',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-bebidas',
    name: 'Chilcano de la Casa Macerado en Roble',
    description: 'Pisco acholado infusionado con jengibre fresco y hierba luisa silvestre, hielo tallado a mano, ginger ale botánico premium y perfume de cáscara de cítricos.',
    price: 26,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 5,
    allergens: [],
    tags: ['Refrescante', 'Macerado Propio']
  },
  {
    id: 'item-bf-bebida-3',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-bebidas',
    name: 'Malbec Gran Reserva "Brasas y Fuegos" (750ml)',
    description: 'Vino tinto varietal de altura del Valle de Uco, Mendoza. Crianza de 14 meses en roble francés, con notas aterciopeladas a ciruela, vainilla y chocolate negro.',
    price: 95,
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isChefSpecial: true,
    prepTimeMinutes: 3,
    allergens: ['Sulfitos'],
    tags: ['Maridaje Ideal', 'Cava Seleccionada']
  },
  {
    id: 'item-bf-bebida-4',
    restaurantId: 'rest-brasas',
    categoryId: 'cat-b-bebidas',
    name: 'Chicha Morada Ahumada Especial (Jarra 1L)',
    description: 'Bebida artesanal de maíz morado culli hervido con piña golden, manzana y canela aromática, aromatizada con un toque sutil de madera de manzano ahumada.',
    price: 24,
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 4,
    allergens: [],
    tags: ['Artesanal', 'Sin Alcohol', 'Jarra Familiar']
  },

  // Criollo & Tradición - Parrillas Familiares
  {
    id: 'item-c-parrilla-1',
    restaurantId: 'rest-criollo',
    categoryId: 'cat-c-parrillas',
    name: 'Gran Parrilla Criolla de Antaño',
    description: 'Cortes seleccionados de lomo de res marinado al ají panca, chuleta de cerdo a la leña y chorizo parrillero artesanal. Guarnecido con papas doradas al romero andino y choclo tierno con queso. Servido con chimichurri rústico de huacatay y ají carretillero batido.',
    price: 139.00,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 25,
    allergens: [],
    tags: ['Para 3 a 4 Personas', 'Especialidad a la Leña']
  },
  {
    id: 'item-c-parrilla-2',
    restaurantId: 'rest-criollo',
    categoryId: 'cat-c-parrillas',
    name: 'Costillar Criollo Glaseado al Algarrobo',
    description: 'Costillar tierno de cerdo confitado y laqueado a fuego lento en reducción de chicha de jora y miel de algarrobina. Servido con puré rústico de camote a la canela y ensalada fresca campestre. Acompañado de salsa agridulce de maracuyá y ají amarillo.',
    price: 118.00,
    imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 20,
    allergens: [],
    tags: ['Ahumado Lento', 'Sabor Dulce y Ahumado']
  },
  {
    id: 'item-c-parrilla-3',
    restaurantId: 'rest-criollo',
    categoryId: 'cat-c-parrillas',
    name: 'Parrilla Mixta Tradición & Fuego',
    description: 'Generosos anticuchos de corazón al carbón, un cuarto de pollo tierno marinado en hierbas de convento y morcilla criolla. Acompañado de yucas fritas crocantes al mojo de ajo y ensalada tibia de vainitas. Con emulsión de rocoto carretillero y tártara casera.',
    price: 98.00,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 22,
    allergens: [],
    tags: ['Para 2 Personas', 'Favorito Familiar']
  },

  // Criollo & Tradición - Entradas&Tablas
  {
    id: 'item-c-entrada-1',
    restaurantId: 'rest-criollo',
    categoryId: 'cat-c-entradas',
    name: 'Tabla Criolla Tres Sabores de Antaño',
    description: 'Brochetas jugosas de anticucho de corazón, trozos crocantes de chicharrón de cerdo con piel tostada y pastel de choclo limeño. Guarnecido con papitas nativas doradas y choclo salteado. Servido con salsa criolla de cebolla y ají limo, ají de huacatay y crema de rocoto.',
    price: 48.00,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 15,
    allergens: ['Lácteos'],
    tags: ['Para Picar', 'Trilogía Criolla']
  },
  {
    id: 'item-c-entrada-2',
    restaurantId: 'rest-criollo',
    categoryId: 'cat-c-entradas',
    name: 'Causa Limeña Señorial de Cangrejo & Palta',
    description: 'Pulpa tierna de cangrejo seleccionada aderezada en mayonesa suave de lima. Montada sobre masa artesanal de papa amarilla prensada con pasta de ají amarillo y gotas de limón sutil. Acompañada de abanico de palta fuerte, huevo de codorniz y coulis de aceituna botija.',
    price: 36.00,
    imageUrl: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 10,
    allergens: ['Mariscos', 'Huevo'],
    tags: ['Receta Señorial', 'Entrada Fría']
  },
  {
    id: 'item-c-entrada-3',
    restaurantId: 'rest-criollo',
    categoryId: 'cat-c-entradas',
    name: 'Anticuchos de Corazón Selecto al Carbón',
    description: 'Tres brochetas tiernas de corazón maceradas por 24 horas en ají panca, vinagre tinto y especias andinas. Con papas doradas a la plancha y rodajas de choclo dulce. Servido con ají carretillero de la casa y salsa verde de huacatay.',
    price: 34.00,
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 12,
    allergens: [],
    tags: ['Tradición Limeña', 'Al Carbón']
  },

  // Criollo & Tradición - Licores y Bebidas
  {
    id: 'item-c-bebida-1',
    restaurantId: 'rest-criollo',
    categoryId: 'cat-c-bebidas',
    name: 'Pisco Sour Quebranta Tradición (Copa Doble)',
    description: 'Destilado puro 4 oz de uva Quebranta de bodega tradicional iqueña, emulsionado con zumo de limón sutil recién exprimido y clara de huevo fresca batida. Jarabe de goma aromático elaborado en casa y perfume final de gotas de amargo de angostura.',
    price: 28.00,
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 5,
    allergens: ['Huevo'],
    tags: ['Cóctel Bandera', '4 oz Pisco Puro']
  },
  {
    id: 'item-c-bebida-2',
    restaurantId: 'rest-criollo',
    categoryId: 'cat-c-bebidas',
    name: 'Chilcano Clásico de Maracuyá & Hierba Luisa',
    description: 'Pisco acholado premium perfumado con hierba luisa silvestre, pulpa fresca de maracuyá colada al momento, hielo tallado y ginger ale botánico de alta gasificación. Coronado con twist de limón y ramita aromática.',
    price: 25.00,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 5,
    allergens: [],
    tags: ['Refrescante', 'Macerado Propio']
  },
  {
    id: 'item-c-bebida-3',
    restaurantId: 'rest-criollo',
    categoryId: 'cat-c-bebidas',
    name: 'Chicha Morada de Maíz Culli Tradicional (Jarra 1L)',
    description: 'Bebida emblemática elaborada con maíz morado culli hervido durante horas con piña golden, manzana membrillo y canela de Ceilán con clavo. Servida bien helada con dados de frutas y gotas frescas de limón recién exprimido.',
    price: 22.00,
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 3,
    allergens: [],
    tags: ['Sin Alcohol', '100% Natural', 'Jarra Familiar']
  },

  // Loop Burger & Subs
  {
    id: 'item-l1',
    restaurantId: 'rest-loop',
    categoryId: 'cat-l1',
    name: 'Loop Double Truffle Smash',
    description: 'Dos medallones smashed de 90g con costra crocante, doble queso cheddar americano, mayo de trufa negra y cebolla caramelizada.',
    price: 14.50,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 9,
    allergens: ['Gluten', 'Lácteos', 'Huevo'],
    tags: ['Top Seller', 'Smash Burger']
  },
  {
    id: 'item-l2',
    restaurantId: 'rest-loop',
    categoryId: 'cat-l2',
    name: 'Buffalo Crispy Chicken Sub',
    description: 'Pechuga marinada en suero de leche, empanizada hiper-crocante con salsa buffalo spicy y coleslaw fresco.',
    price: 13.00,
    imageUrl: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 11,
    allergens: ['Gluten', 'Lácteos'],
    tags: ['Picante Medio']
  },
  {
    id: 'item-l3',
    restaurantId: 'rest-loop',
    categoryId: 'cat-l3',
    name: 'Dirty Fries con Cheddar & Bacon Bits',
    description: 'Papas en corte crinkle bañadas en dip de tres quesos, trocitos crocantes de tocino ahumado y jalapeños encurtidos.',
    price: 8.50,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 8,
    allergens: ['Lácteos'],
    tags: ['Para Compartir']
  },

  // Costa Marina
  {
    id: 'item-m1',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m1',
    name: 'Ceviche Mixto Costa Marina',
    description: 'Corvina fresca de pesca del día, calamar tierno y langostinos del norte. Acompañado de choclo tierno desgranado y camote glaseado a la naranja. Aliñado con leche de tigre clásica al ají limo, apio y zumo de limón piurano.',
    price: 48.00,
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 10,
    allergens: ['Pescado', 'Mariscos'],
    tags: ['Especialidad de la Casa', 'Pesca del Día']
  },
  {
    id: 'item-m2',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m1',
    name: 'Tiradito Ahumado al Ají Amarillo & Maracuyá',
    description: 'Láminas finas de lenguado fresco curado con sal marina. Guarnecido con choclo crocante chulpe y cubos de palta fuerte. Bañado en emulsión sedosa de ají amarillo soasado con reducción de maracuyá y oliva virgen.',
    price: 42.00,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 8,
    allergens: ['Pescado'],
    tags: ['Tiradito', 'Toque Cítrico']
  },
  {
    id: 'item-m3',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m1',
    name: 'Ceviche Apaltado con Pulpo a la Brasa',
    description: 'Pesca blanca del día y tentáculo entero de pulpo sellado a la brasa. Acompañado de abanico de palta hass y canchita chulpi serrana. Sazonado con leche de tigre cremosa al rocoto ahumado y chimichurri parrillero.',
    price: 52.00,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isChefSpecial: true,
    prepTimeMinutes: 12,
    allergens: ['Pescado', 'Moluscos'],
    tags: ['Pulpo a la Brasa', 'Gourmet']
  },
  {
    id: 'item-m4',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m1',
    name: 'Tiradito Nikkei de Atún Aleta Amarilla',
    description: 'Cortes seleccionados de atún rojo aleta amarilla fresco. Servido con hilos de nabo encurtido y ajonjolí tostado. Aliñado con salsa ponzu artesanal de kion, shoyu añejo y gotas de aceite de sésamo prensado en frío.',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 8,
    allergens: ['Pescado', 'Soya'],
    tags: ['Fusión Nikkei', 'Atún Fresco']
  },

  // Costa Marina - Chicharrones & Wok
  {
    id: 'item-m5',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m2',
    name: 'Arroz con Mariscos Meloso al Wok de Leña',
    description: 'Langostinos jumbo, anillas de calamar tierno, pulpo y conchas de abanico flameados al pisco. Montado sobre arroz meloso con arvejas y pimientos asados. Con reducción de bisque de cangrejos y salsa criolla al ají limo.',
    price: 54.00,
    imageUrl: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 16,
    allergens: ['Mariscos', 'Pescado'],
    tags: ['Wok Marinero', 'Al Pisco']
  },
  {
    id: 'item-m6',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m2',
    name: 'Chicharrón de Corvina & Calamar Crocante',
    description: 'Filetes tiernos de corvina y anillas de calamar en rebozado ligero y crujiente. Guarnecido con bastones de yuca frita dorada y zarandaja aliñada. Acompañado de salsa tártara de la casa con alcaparras y crema de rocoto carretillero.',
    price: 46.00,
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 14,
    allergens: ['Pescado', 'Moluscos', 'Huevo'],
    tags: ['Fritura Perfecta', 'Para Picar']
  },
  {
    id: 'item-m7',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m2',
    name: 'Chaufa Marino Especial al Carbón',
    description: 'Mixtura selecta de mariscos flameados a fuego candente con trozos de pescado crocante. Arroz jazmín salteado al wok con cebollita china fresca y tortilla de huevo. Bañado en salsa de ostión, sillao de hongo y ajonjolí tostado.',
    price: 49.00,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 15,
    allergens: ['Mariscos', 'Pescado', 'Soya', 'Huevo'],
    tags: ['Wok Candente', 'Chaufa Especial']
  },

  // Costa Marina - Coctelería de Autor & Bebidas
  {
    id: 'item-m8',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m3',
    name: 'Pisco Sour Catedral Costa Marina (Copa Doble)',
    description: 'Destilado puro de uva Quebranta iqueña (4 oz) batido vigorosamente con clara de huevo fresca. Con zumo de limón piurano recién exprimido, jarabe simple aromático y gotas aromáticas de bitter Angostura.',
    price: 32.00,
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 5,
    allergens: ['Huevo'],
    tags: ['Cóctel Bandera', '4 oz Pisco Puro']
  },
  {
    id: 'item-m9',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m3',
    name: 'Chilcano Macerado de Maracuyá & Hierba Luisa',
    description: 'Pisco acholado premium macerado con hojas frescas de hierba luisa y pulpa de maracuyá. Con hielo tallado artesanal, zumo de lima y ginger ale botánico. Decorado con rodaja de naranja deshidratada.',
    price: 28.00,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 4,
    allergens: [],
    tags: ['Refrescante', 'Macerado de Casa']
  },
  {
    id: 'item-m10',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m3',
    name: 'Limonada de Hierba Luisa & Jengibre (Jarra 1L)',
    description: 'Zumo fresco de limones sutiles colado al momento con infusión helada de hierba luisa y jengibre fresco rallado. Endulzada con miel de caña natural y hojas de menta del huerto.',
    price: 24.00,
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 4,
    allergens: [],
    tags: ['Sin Alcohol', '100% Natural', 'Jarra Familiar']
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin-herly',
    name: 'Herly Lizarazo',
    email: 'herly.lizarazo@micarta.pe',
    dni: '00448157',
    password: 'password',
    role: 'ADMIN',
    phone: '952341165',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['all'],
    status: 'active',
    lastActive: 'En línea'
  },
  {
    id: 'u-1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@micarta.io',
    dni: '10203040',
    password: '12345678',
    role: 'ADMIN',
    phone: '+51 980 123 456',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['all'],
    status: 'active',
    lastActive: 'Hace 3 min'
  },
  {
    id: 'u-2',
    name: 'Valeria Rivas',
    email: 'valeria.rivas@grupoparrillero.com',
    dni: '20304050',
    password: '12345678',
    role: 'OWNER',
    phone: '+51 971 234 567',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-brasas', 'rest-loop'],
    status: 'active',
    lastActive: 'Hace 12 min'
  },
  {
    id: 'u-3',
    name: 'Mauricio Delgado',
    email: 'm.delgado@tradicioncriolla.pe',
    dni: '30405060',
    password: '12345678',
    role: 'OWNER',
    phone: '+51 962 345 678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-criollo', 'rest-costa'],
    status: 'active',
    lastActive: 'Hace 1 hora'
  },
  {
    id: 'u-4',
    name: 'Sofía Benavides',
    email: 'sofia.gerencia@brasasfuego.pe',
    dni: '40102030',
    password: '12345678',
    role: 'RESTAURANT_MANAGER',
    phone: '+51 953 456 789',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-brasas'],
    status: 'active',
    lastActive: 'En turno activo'
  },
  {
    id: 'u-5',
    name: 'Jorge Huamán',
    email: 'jorge.mesas@brasasfuego.pe',
    dni: '40506070',
    password: '12345678',
    role: 'WAITER',
    phone: '+51 944 567 890',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-brasas'],
    status: 'active',
    lastActive: 'Mesa 4 & 7 atendidas',
    assignedShift: 'TARDE',
    pinCode: '4490',
    createdByOwnerId: 'u-2',
    waiterPermissions: {
      canCancelOrders: false,
      canApplyDiscounts: true,
      canAssignTables: true,
      canSplitBills: true,
      requireSupervisorPin: true,
      maxActiveTables: 6
    }
  },
  {
    id: 'u-6',
    name: 'Ana Paula Torres',
    email: 'anapaula.salon@loopburgers.pe',
    dni: '40607080',
    password: '12345678',
    role: 'WAITER',
    phone: '+51 935 678 901',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-loop'],
    status: 'active',
    lastActive: 'Hace 5 min',
    assignedShift: 'NOCHE',
    pinCode: '8901',
    createdByOwnerId: 'u-2',
    waiterPermissions: {
      canCancelOrders: false,
      canApplyDiscounts: true,
      canAssignTables: true,
      canSplitBills: false,
      requireSupervisorPin: false,
      maxActiveTables: 5
    }
  },
  {
    id: 'u-5b',
    name: 'Mateo Cárdenas',
    email: 'mateo.salon@tradicioncriolla.pe',
    dni: '40708090',
    password: '12345678',
    role: 'WAITER',
    phone: '+51 922 888 777',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-criollo'],
    status: 'active',
    lastActive: 'Mesa 12 atendida',
    assignedShift: 'COMPLETO',
    pinCode: '1234',
    createdByOwnerId: 'u-3',
    waiterPermissions: {
      canCancelOrders: true,
      canApplyDiscounts: false,
      canAssignTables: true,
      canSplitBills: true,
      requireSupervisorPin: false,
      maxActiveTables: 8
    }
  },
  {
    id: 'u-5c',
    name: 'Lucía Benítez',
    email: 'lucia.mar@costamarina.pe',
    dni: '40809010',
    password: '12345678',
    role: 'WAITER',
    phone: '+51 911 333 444',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-costa'],
    status: 'active',
    lastActive: 'Mesa 3 atendida',
    assignedShift: 'MANANA',
    pinCode: '5678',
    createdByOwnerId: 'u-3',
    waiterPermissions: {
      canCancelOrders: false,
      canApplyDiscounts: false,
      canAssignTables: true,
      canSplitBills: true,
      requireSupervisorPin: true,
      maxActiveTables: 6
    }
  },
  {
    id: 'u-7',
    name: 'Raúl Quispe (Rider #12)',
    email: 'raul.moto@gastrodelivery.pe',
    dni: '50607080',
    password: '12345678',
    role: 'DELIVERY',
    phone: '+51 926 789 012',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-loop', 'rest-brasas'],
    status: 'active',
    lastActive: 'Ruta en curso: San Isidro',
    vehicleType: 'MOTO',
    licensePlate: '5482-3B',
    createdByOwnerId: 'u-2',
    deliveryPermissions: {
      canAcceptCash: true,
      maxActiveOrders: 3,
      autoAssignZone: true,
      gpsSpeedTracking: true,
      allowedZones: ['San Isidro', 'Miraflores', 'San Borja']
    }
  },
  {
    id: 'u-7b',
    name: 'Kevin Salazar (Rider #05)',
    email: 'kevin.rider@gastrodelivery.pe',
    dni: '50708090',
    password: '12345678',
    role: 'DELIVERY',
    phone: '+51 933 445 566',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-criollo'],
    status: 'active',
    lastActive: 'Esperando despacho',
    vehicleType: 'MOTO',
    licensePlate: '9120-1C',
    createdByOwnerId: 'u-3',
    deliveryPermissions: {
      canAcceptCash: true,
      maxActiveOrders: 4,
      autoAssignZone: true,
      gpsSpeedTracking: false,
      allowedZones: ['Centro de Lima', 'Breña', 'Jesús María']
    }
  },
  {
    id: 'u-7c',
    name: 'Marco Antonio Paz (Rider #19)',
    email: 'marco.bici@gastrodelivery.pe',
    dni: '50809010',
    password: '12345678',
    role: 'DELIVERY',
    phone: '+51 944 223 311',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-costa', 'rest-loop'],
    status: 'active',
    lastActive: 'En entrega Miraflores',
    vehicleType: 'BICI',
    licensePlate: 'ECO-BIKE',
    createdByOwnerId: 'u-2',
    deliveryPermissions: {
      canAcceptCash: false,
      maxActiveOrders: 3,
      autoAssignZone: true,
      gpsSpeedTracking: true,
      allowedZones: ['Miraflores', 'San Isidro', 'Barranco']
    }
  },
  {
    id: 'u-k1',
    name: 'Chef Walter Ramos',
    email: 'walter.cocina@brasasfuego.pe',
    dni: '70102030',
    password: '12345678',
    role: 'KITCHEN',
    phone: '+51 988 554 433',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-brasas'],
    status: 'active',
    lastActive: 'Parrilla activa - 4 comandas en fuego',
    assignedShift: 'TARDE',
    pinCode: '7010',
    createdByOwnerId: 'u-2',
    kitchenStation: 'Parrilla & Cortes Angus',
    kitchenPermissions: {
      canMarkReady: true,
      canRejectItems: true,
      canManageStockOut: true,
      canReorderQueue: true,
      autoPrintTickets: true,
      soundAlerts: true,
      stationFilter: 'Parrilla & Carnes'
    }
  },
  {
    id: 'u-k2',
    name: 'Chef Mario Silva',
    email: 'mario.ceviche@costamarina.pe',
    dni: '70203040',
    password: '12345678',
    role: 'KITCHEN',
    phone: '+51 977 443 322',
    avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-costa'],
    status: 'active',
    lastActive: 'Barra marina activa - ceviches al momento',
    assignedShift: 'MANANA',
    pinCode: '7020',
    createdByOwnerId: 'u-3',
    kitchenStation: 'Barra Marina & Cebichería',
    kitchenPermissions: {
      canMarkReady: true,
      canRejectItems: true,
      canManageStockOut: true,
      canReorderQueue: true,
      autoPrintTickets: true,
      soundAlerts: true,
      stationFilter: 'Barra Marina & Cebichería'
    }
  },
  {
    id: 'u-k3',
    name: 'Chef Rocío Morales',
    email: 'rocio.sazon@tradicioncriolla.pe',
    dni: '70304050',
    password: '12345678',
    role: 'KITCHEN',
    phone: '+51 966 332 211',
    avatar: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-criollo'],
    status: 'active',
    lastActive: 'Ollas y guisos en punto',
    assignedShift: 'COMPLETO',
    pinCode: '7030',
    createdByOwnerId: 'u-3',
    kitchenStation: 'Cocina Caliente & Guisos',
    kitchenPermissions: {
      canMarkReady: true,
      canRejectItems: true,
      canManageStockOut: true,
      canReorderQueue: true,
      autoPrintTickets: true,
      soundAlerts: true,
      stationFilter: 'Cocina Caliente & Guisos'
    }
  },
  {
    id: 'u-k4',
    name: 'Diego Montes',
    email: 'diego.smash@loopburgers.pe',
    dni: '70405060',
    password: '12345678',
    role: 'KITCHEN',
    phone: '+51 955 221 100',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-loop'],
    status: 'active',
    lastActive: 'Plancha smash al rojo vivo',
    assignedShift: 'NOCHE',
    pinCode: '7040',
    createdByOwnerId: 'u-2',
    kitchenStation: 'Plancha Smash & Frituras',
    kitchenPermissions: {
      canMarkReady: true,
      canRejectItems: true,
      canManageStockOut: true,
      canReorderQueue: true,
      autoPrintTickets: true,
      soundAlerts: true,
      stationFilter: 'Plancha Smash & Frituras'
    }
  },
  {
    id: 'u-8',
    name: 'Diego Alarcón',
    email: 'diego.cliente@gmail.com',
    dni: '60708090',
    password: '12345678',
    role: 'CUSTOMER',
    phone: '+51 917 890 123',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-brasas'],
    status: 'active',
    lastActive: 'Pedido QR Mesa 4',
    vipTier: 'STANDARD',
    totalOrdersCount: 4,
    creditBalance: 15.00,
    createdByOwnerId: 'u-2'
  },
  {
    id: 'u-8b',
    name: 'Valeria Montiel (VIP)',
    email: 'valeria.montiel@corporativo.com',
    dni: '60809010',
    password: '12345678',
    role: 'CUSTOMER',
    phone: '+51 988 777 665',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-costa', 'rest-brasas'],
    status: 'active',
    lastActive: 'Reserva & Pedido Costa Marina',
    vipTier: 'BLACK_VIP',
    totalOrdersCount: 28,
    creditBalance: 120.00,
    createdByOwnerId: 'u-3'
  },
  {
    id: 'u-8c',
    name: 'Fernando Beltrán',
    email: 'fernando.beltran@gmail.com',
    dni: '60901020',
    password: '12345678',
    role: 'CUSTOMER',
    phone: '+51 966 555 443',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-criollo'],
    status: 'active',
    lastActive: 'Pedido Takeaway',
    vipTier: 'GOLD',
    totalOrdersCount: 14,
    creditBalance: 45.00,
    createdByOwnerId: 'u-3'
  },
  {
    id: 'u-8d',
    name: 'Camila Zúñiga',
    email: 'camila.zuniga@gmail.com',
    dni: '60102030',
    password: '12345678',
    role: 'CUSTOMER',
    phone: '+51 977 444 888',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-loop'],
    status: 'active',
    lastActive: 'Pedido Delivery #LP-542',
    vipTier: 'SILVER',
    totalOrdersCount: 9,
    creditBalance: 20.00,
    createdByOwnerId: 'u-2'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    restaurantId: 'rest-brasas',
    orderNumber: 'BF-204',
    type: 'DINE_IN',
    status: 'IN_KITCHEN',
    tableNumber: 'Mesa 04 (Terraza)',
    customerId: 'u-8',
    customerName: 'Diego Alarcón',
    customerDni: '60708090',
    customerPhone: '+51 917 890 123',
    items: [
      { id: 'oi-1', menuItemId: 'item-b1', name: 'Bife de Chorizo Angus 400g', price: 38.50, quantity: 2, notes: 'Término medio / Jugoso' },
      { id: 'oi-2', menuItemId: 'item-b3', name: 'Provoleta Ahumada', price: 16.50, quantity: 1 }
    ],
    subtotal: 93.50,
    tax: 16.83,
    deliveryFee: 0,
    total: 110.33,
    paymentStatus: 'PENDING',
    createdAt: 'Hace 8 min',
    estimatedMinutes: 14,
    waiterId: 'u-5',
    waiterName: 'Jorge Huamán'
  },
  {
    id: 'ord-102',
    restaurantId: 'rest-loop',
    orderNumber: 'LP-542',
    type: 'DELIVERY',
    status: 'PENDING',
    customerId: 'u-8d',
    customerName: 'Camila Zúñiga',
    customerDni: '60102030',
    customerPhone: '+51 977 444 888',
    deliveryAddress: 'Av. Coronel Portillo 680, Dpto 402, San Isidro',
    items: [
      { id: 'oi-3', menuItemId: 'item-l1', name: 'Loop Double Truffle Smash', price: 14.50, quantity: 3, notes: 'Sin pepinillos en 1' },
      { id: 'oi-4', menuItemId: 'item-l3', name: 'Dirty Fries con Cheddar', price: 8.50, quantity: 2 }
    ],
    subtotal: 60.50,
    tax: 10.89,
    deliveryFee: 5.00,
    total: 76.39,
    paymentStatus: 'PAID',
    createdAt: 'Hace 3 min',
    estimatedMinutes: 25,
    courierName: 'Por asignar'
  },
  {
    id: 'ord-103',
    restaurantId: 'rest-criollo',
    orderNumber: 'CT-118',
    type: 'DINE_IN',
    status: 'READY',
    tableNumber: 'Mesa 12 (Salón Principal)',
    customerId: 'u-8c',
    customerName: 'Fernando Beltrán',
    customerDni: '60901020',
    items: [
      { id: 'oi-5', menuItemId: 'item-c1', name: 'Lomo Saltado al Wok', price: 26.00, quantity: 2 },
      { id: 'oi-6', menuItemId: 'item-c3', name: 'Causa con Cangrejo', price: 18.00, quantity: 1 }
    ],
    subtotal: 70.00,
    tax: 12.60,
    deliveryFee: 0,
    total: 82.60,
    paymentStatus: 'PAID',
    createdAt: 'Hace 19 min',
    estimatedMinutes: 0,
    waiterId: 'u-5b',
    waiterName: 'Mateo Cárdenas'
  },
  {
    id: 'ord-104',
    restaurantId: 'rest-costa',
    orderNumber: 'CM-087',
    type: 'DINE_IN',
    status: 'IN_KITCHEN',
    tableNumber: 'Mesa 02 (Vista al Mar)',
    customerId: 'u-8b',
    customerName: 'Valeria Montiel (VIP)',
    customerDni: '60809010',
    items: [
      { id: 'oi-7', menuItemId: 'item-m1', name: 'Ceviche Clásico Corvina', price: 24.50, quantity: 2, notes: 'Picante moderado' },
      { id: 'oi-8', menuItemId: 'item-m2', name: 'Arroz con Mariscos Meloso', price: 28.00, quantity: 1 }
    ],
    subtotal: 77.00,
    tax: 13.86,
    deliveryFee: 0,
    total: 90.86,
    paymentStatus: 'PENDING',
    createdAt: 'Hace 11 min',
    estimatedMinutes: 12,
    waiterId: 'u-5c',
    waiterName: 'Lucía Benítez'
  },
  {
    id: 'ord-105',
    restaurantId: 'rest-loop',
    orderNumber: 'LP-540',
    type: 'DELIVERY',
    status: 'ON_THE_WAY',
    customerId: 'u-8',
    customerName: 'Diego Alarcón',
    customerDni: '60708090',
    deliveryAddress: 'Calle Dos de Mayo 430, Miraflores',
    items: [
      { id: 'oi-9', menuItemId: 'item-l2', name: 'Buffalo Crispy Chicken Sub', price: 13.00, quantity: 2 },
      { id: 'oi-10', menuItemId: 'item-l3', name: 'Dirty Fries con Cheddar', price: 8.50, quantity: 1 }
    ],
    subtotal: 34.50,
    tax: 6.21,
    deliveryFee: 4.50,
    total: 45.21,
    paymentStatus: 'PAID',
    createdAt: 'Hace 28 min',
    estimatedMinutes: 7,
    courierId: 'u-7',
    courierName: 'Raúl Quispe (Rider #12)'
  },
  {
    id: 'ord-106',
    restaurantId: 'rest-brasas',
    orderNumber: 'BF-201',
    type: 'TAKEAWAY',
    status: 'DELIVERED',
    customerId: 'u-8b',
    customerName: 'Valeria Montiel (VIP)',
    customerDni: '60809010',
    items: [
      { id: 'oi-11', menuItemId: 'item-b2', name: 'Entraña Fina al Punto', price: 42.00, quantity: 1 }
    ],
    subtotal: 42.00,
    tax: 7.56,
    deliveryFee: 0,
    total: 49.56,
    paymentStatus: 'PAID',
    createdAt: 'Hace 45 min',
    estimatedMinutes: 0
  }
];
