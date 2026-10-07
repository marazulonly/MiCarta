import { Restaurant, MenuCategory, MenuItem, User, Order, DaySchedule, RestaurantTable, StaffShift, TableZone } from '../types';

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { day: 'Lunes', isOpen: true, openTime: '12:00', closeTime: '23:00', notes: 'Almuerzo & Cena marina' },
  { day: 'Martes', isOpen: true, openTime: '12:00', closeTime: '23:00', notes: 'Almuerzo & Cena marina' },
  { day: 'Miércoles', isOpen: true, openTime: '12:00', closeTime: '23:30', notes: 'Cenas & Noches de Pisco' },
  { day: 'Jueves', isOpen: true, openTime: '12:00', closeTime: '00:00', notes: 'Horario nocturno extendido' },
  { day: 'Viernes', isOpen: true, openTime: '12:00', closeTime: '01:00', notes: 'Música en vivo & Cenas' },
  { day: 'Sábado', isOpen: true, openTime: '11:30', closeTime: '01:00', notes: 'Servicio continuo de fin de semana' },
  { day: 'Domingo', isOpen: true, openTime: '11:30', closeTime: '22:30', notes: 'Almuerzos familiares' },
];

export const generateTablesForRestaurant = (
  restaurantId: string, 
  count: number = 22,
  waiterIds: string[] = []
): RestaurantTable[] => {
  return Array.from({ length: count }, (_, idx) => {
    const num = idx + 1;
    const zone: TableZone = num <= 8 ? 'SALON' : num <= 14 ? 'TERRAZA' : num <= 18 ? 'VIP' : 'BARRA';
    const capacity = num % 4 === 0 ? 6 : num % 2 === 0 ? 4 : 2;
    const assignedWaiter = waiterIds.length > 0 ? [waiterIds[idx % waiterIds.length]] : [];
    
    return {
      id: `tbl-${restaurantId}-${num}`,
      restaurantId,
      number: num,
      name: `Mesa ${num < 10 ? '0' + num : num}`,
      zone,
      capacity,
      status: 'AVAILABLE',
      assignedWaiterIds: assignedWaiter,
      currentOrderId: undefined,
      qrCodeParam: `${num}`,
      notes: zone === 'TERRAZA' ? 'Zona exterior con vista' : zone === 'VIP' ? 'Box privado climatizado' : undefined
    };
  });
};

export const generateShiftsForRestaurant = (
  restaurantId: string,
  waiterIds: string[] = [],
  riderIds: string[] = []
): StaffShift[] => [
  {
    id: `shift-${restaurantId}-1`,
    restaurantId,
    name: 'Turno Mañana (Almuerzos Salón)',
    startTime: '11:00',
    endTime: '16:30',
    applicableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    roleTarget: 'WAITER',
    assignedUserIds: waiterIds,
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
    assignedUserIds: waiterIds,
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
    assignedUserIds: [],
    colorBadge: '#F97316'
  }
];

export const CEVICHITO_PLIZ_LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMTIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgQGltcG9ydCB1cmwoImh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9RnJlZG9rYTp3Z2h0QDcwMDs4MDAmYW1wO2Rpc3BsYXk9c3dhcCIpOwogICAgICAuYnJhbmQtdGl0bGUgeyBmb250LWZhbWlseTogIkZyZWRva2EiLCAiT3V0Zml0IiwgIkFyaWFsIEJsYWNrIiwgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDgwMDsgZmlsbDogIzExMTExMTsgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHRleHQgeD0iMjAwIiB5PSI1NSIgZm9udC1zaXplPSI0NCIgbGV0dGVyLXNwYWNpbmc9IjEuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgY2xhc3M9ImJyYW5kLXRpdGxlIiB0cmFuc2Zvcm09InJvdGF0ZSgtMS41IDIwMCA1NSkiPkNFVklDSElUTzwvdGV4dD4KICA8cG9seWdvbiBwb2ludHM9IjExMCw4OCAxMjYsODEgMTI2LDk1IiBmaWxsPSIjMTExMTExIi8+CiAgPHRleHQgeD0iMjAwIiB5PSI5NCIgZm9udC1zaXplPSIzOCIgbGV0dGVyLXNwYWNpbmc9IjMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJicmFuZC10aXRsZSIgdHJhbnNmb3JtPSJyb3RhdGUoLTEuNSAyMDAgOTQpIj5QTElaPC90ZXh0PgogIDxwb2x5Z29uIHBvaW50cz0iMjkwLDg4IDI3NCw4MSAyNzQsOTUiIGZpbGw9IiMxMTExMTEiLz4KPC9zdmc+';

export const VORAZ_LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMTIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj48ZGVmcz48c3R5bGU+QGltcG9ydCB1cmwoImh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9U3luZTp3Z2h0QDgwMCZhbXA7ZGlzcGxheT1zd2FwIik7IC5icmFuZC12b3JheiB7IGZvbnQtZmFtaWx5OiAiU3luZSIsICJPdXRmaXQiLCAiSW1wYWN0Iiwgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDgwMDsgZmlsbDogI0UxMUQ0ODsgfSAuYnJhbmQtc3ViIHsgZm9udC1mYW1pbHk6ICJTeW5lIiwgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDcwMDsgZmlsbDogI0ZGRkZGRjsgZm9udC1zaXplOiAxNXB4OyBsZXR0ZXItc3BhY2luZzogNnB4OyB9PC9zdHlsZT48L2RlZnM+PHRleHQgeD0iMjAwIiB5PSI2NSIgZm9udC1zaXplPSI1NCIgbGV0dGVyLXNwYWNpbmc9IjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJicmFuZC12b3JheiI+Vk9SQVo8L3RleHQ+PHRleHQgeD0iMjAwIiB5PSI5OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgY2xhc3M9ImJyYW5kLXN1YiI+RlVTScOTTiBVUkJBTkE8L3RleHQ+PC9zdmc+';

export const RIENDAS_DE_PLATA_LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMTIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj48ZGVmcz48c3R5bGU+QGltcG9ydCB1cmwoImh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9Q2luemVsOndnaHRANzAwOzkwMCZhbXA7ZGlzcGxheT1zd2FwIik7IC5icmFuZC10aXRsZSB7IGZvbnQtZmFtaWx5OiAiQ2luemVsIiwgIlBsYXlmYWlyIERpc3BsYXkiLCBzZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDsgZmlsbDogI0Q0QUYzNzsgfSAuYnJhbmQtc3ViIHsgZm9udC1mYW1pbHk6ICJDaW56ZWwiLCBzZXJpZjsgZm9udC13ZWlnaHQ6IDYwMDsgZmlsbDogI0U1RTdFQjsgZm9udC1zaXplOiAxM3B4OyBsZXR0ZXItc3BhY2luZzogNXB4OyB9PC9zdHlsZT48L2RlZnM+PHRleHQgeD0iMjAwIiB5PSI1NSIgZm9udC1zaXplPSIzNCIgbGV0dGVyLXNwYWNpbmc9IjMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJicmFuZC10aXRsZSI+UklFTkRBUyBERSBQTEFUQTwvdGV4dD48bGluZSB4MT0iOTAiIHkxPSI3MiIgeDI9IjMxMCIgeTI9IjcyIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Utb3BhY2l0eT0iMC43Ii8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iNzIiIHI9IjMuNSIgZmlsbD0iI0Q0QUYzNyIvPjx0ZXh0IHg9IjIwMCIgeT0iOTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJicmFuZC1zdWIiPlBBUlJJTExBICZhbXA7IENPUlRFUzwvdGV4dD48L3N2Zz4=';

export const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-picanteria-mar',
    name: 'Cevichito Pliz',
    tagline: 'Sazón Norteña & Pescados Frescos del Día',
    cuisineType: 'Cevichería & Mariscos',
    slug: 'cevichito-pliz',
    address: 'Av. La Marina 1420, San Miguel, Lima',
    phone: '+51 987 111 222',
    rating: 4.9,
    reviewCount: 148,
    logoUrl: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=200&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    templateId: 'tmpl-modern-seafood',
    ownerId: 'u-owner-carlos',
    isOpen: true,
    branding: {
      primaryColor: '#0284C7',
      secondaryColor: '#0EA5E9',
      accentColor: '#F59E0B',
      darkBgColor: '#0F172A',
      cardBgColor: '#1E293B',
      textColor: '#F8FAFC',
      fontDisplay: 'Outfit',
      cardStyle: 'grid',
      headerStyle: 'banner'
    },
    metrics: {
      dailyRevenue: 3420,
      activeOrders: 6,
      avgTicket: 58.5,
      customerRating: 4.9,
      totalTables: 12,
      occupancyRate: 75
    },
    tables: generateTablesForRestaurant('rest-picanteria-mar', 12, ['u-waiter-mateo', 'u-waiter-camila']),
    shifts: generateShiftsForRestaurant('rest-picanteria-mar', ['u-waiter-mateo'], ['u-delivery-diego']),
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    menuAccessSettings: {
      menuMode: 'SAME',
      enableDineIn: true,
      enableDelivery: true,
      presentialTitle: 'Carta Salón & Terraza',
      deliveryTitle: 'Delivery Marino',
      deliveryMinOrder: 30,
      deliveryEstimatedMinutes: 35
    }
  },
  {
    id: 'rest-fuego-criollo',
    name: 'El Fuego Criollo',
    tagline: 'Pollo a la Brasa & Parrillas a la Leña',
    cuisineType: 'Pollería & Parrillas',
    slug: 'fuego-criollo',
    address: 'Calle Primavera 850, Surco, Lima',
    phone: '+51 987 333 444',
    rating: 4.8,
    reviewCount: 210,
    logoUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    templateId: 'tmpl-fire-grill',
    ownerId: 'u-owner-mariana',
    isOpen: true,
    branding: {
      primaryColor: '#DC2626',
      secondaryColor: '#EA580C',
      accentColor: '#F59E0B',
      darkBgColor: '#18181B',
      cardBgColor: '#27272A',
      textColor: '#FAFAFA',
      fontDisplay: 'Outfit',
      cardStyle: 'horizontal',
      headerStyle: 'banner'
    },
    metrics: {
      dailyRevenue: 4890,
      activeOrders: 8,
      avgTicket: 68.0,
      customerRating: 4.8,
      totalTables: 16,
      occupancyRate: 82
    },
    tables: generateTablesForRestaurant('rest-fuego-criollo', 16, ['u-waiter-camila']),
    shifts: generateShiftsForRestaurant('rest-fuego-criollo', ['u-waiter-camila'], ['u-delivery-sofia']),
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    menuAccessSettings: {
      menuMode: 'SAME',
      enableDineIn: true,
      enableDelivery: true,
      presentialTitle: 'Carta de Salón & Parrillas',
      deliveryTitle: 'Delivery Pollo & Parrillas',
      deliveryMinOrder: 25,
      deliveryEstimatedMinutes: 30
    }
  }
];

export const INITIAL_CATEGORIES: MenuCategory[] = [
  // Categorías La Picantería del Mar
  {
    id: 'cat-mar-1',
    restaurantId: 'rest-picanteria-mar',
    name: 'Ceviches & Entradas Marinas',
    description: 'Pescados frescos del día con ají limo, camote glaseado y choclo desgranado',
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'cat-mar-2',
    restaurantId: 'rest-picanteria-mar',
    name: 'Platos de Fondo & Arroces',
    description: 'Especialidades calientes salteadas al wok y guisos marinos',
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'cat-mar-3',
    restaurantId: 'rest-picanteria-mar',
    name: 'Bebidas & Cocteles',
    description: 'Refrescos naturales y cocteles de autor',
    sortOrder: 3,
    isActive: true
  },

  // Categorías El Fuego Criollo
  {
    id: 'cat-fuego-1',
    restaurantId: 'rest-fuego-criollo',
    name: 'Pollos a la Brasa & Combos',
    description: 'Sabor tradicional a la leña acompañado de papas crocantes y ensalada',
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'cat-fuego-2',
    restaurantId: 'rest-fuego-criollo',
    name: 'Cortes a la Parrilla',
    description: 'Cortes selectos al término de su preferencia con chimichurri de la casa',
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'cat-fuego-3',
    restaurantId: 'rest-fuego-criollo',
    name: 'Guarniciones & Bebidas',
    description: 'Papas, ensaladas extras y gaseosas frías',
    sortOrder: 3,
    isActive: true
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Platos La Picantería del Mar
  {
    id: 'item-mar-1',
    restaurantId: 'rest-picanteria-mar',
    categoryId: 'cat-mar-1',
    name: 'Ceviche Clásico Mixto',
    description: 'Pesca del día, calamar, langostino y pulpo con leche de tigre tradicional, cancha y camote',
    price: 42.00,
    imageUrl: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 12,
    allergens: ['Mariscos', 'Pescado'],
    tags: ['Ceviche', 'Popular', 'Pescados'],
    suggestedObservations: ['Sin Picante', 'Picante Medio', 'Bien Picante']
  },
  {
    id: 'item-mar-2',
    restaurantId: 'rest-picanteria-mar',
    categoryId: 'cat-mar-1',
    name: 'Chicharrón de Calamar Crocante',
    description: 'Aros de calamar crujientes acompañados de yuca frita y salsa tártara de la casa',
    price: 38.00,
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: false,
    prepTimeMinutes: 15,
    allergens: ['Mariscos', 'Gluten'],
    tags: ['Chicharrón', 'Entrada']
  },
  {
    id: 'item-mar-3',
    restaurantId: 'rest-picanteria-mar',
    categoryId: 'cat-mar-2',
    name: 'Arroz con Mariscos a la Norteña',
    description: 'Arroz criollo ahumado al wok con mariscos seleccionados, sarza criolla y toque de ají amarillo',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 18,
    allergens: ['Mariscos'],
    tags: ['Arroz', 'Fondo']
  },
  {
    id: 'item-mar-4',
    restaurantId: 'rest-picanteria-mar',
    categoryId: 'cat-mar-3',
    name: 'Chicha Morada Artesanal 1L',
    description: 'Elaborada diariamente con maíz morado, piña, membrillo, manzana y especias',
    price: 18.00,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: false,
    prepTimeMinutes: 3,
    allergens: [],
    tags: ['Bebida', 'Refresco']
  },

  // Platos El Fuego Criollo
  {
    id: 'item-fuego-1',
    restaurantId: 'rest-fuego-criollo',
    categoryId: 'cat-fuego-1',
    name: '1/2 Pollo a la Brasa + Papas + Ensalada',
    description: 'Medio pollo dorado a la leña, papas amarillas crocantes, ensalada fresca y cremas artesanales',
    price: 39.00,
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 15,
    allergens: [],
    tags: ['Pollo', 'Brasa', 'Combo']
  },
  {
    id: 'item-fuego-2',
    restaurantId: 'rest-fuego-criollo',
    categoryId: 'cat-fuego-1',
    name: 'Pollo Entero Familiar + Papas Grandes',
    description: '1 pollo entero a la brasa, porción familiar de papas crocantes, ensalada familiar y cremas',
    price: 72.00,
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 20,
    allergens: [],
    tags: ['Familiar', 'Pollo']
  },
  {
    id: 'item-fuego-3',
    restaurantId: 'rest-fuego-criollo',
    categoryId: 'cat-fuego-2',
    name: 'Bife de Ancho 350g a la Leña',
    description: 'Corte jugoso de res madurada, sazonada con sal marina y chimichurri artesanal de hierbas',
    price: 58.00,
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: false,
    prepTimeMinutes: 22,
    allergens: [],
    tags: ['Parrilla', 'Carne']
  },
  {
    id: 'item-fuego-4',
    restaurantId: 'rest-fuego-criollo',
    categoryId: 'cat-fuego-3',
    name: 'Inca Kola 1.5L',
    description: 'Gaseosa helada en botella familiar',
    price: 12.00,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: false,
    prepTimeMinutes: 2,
    allergens: [],
    tags: ['Bebida', 'Gaseosa']
  }
];

export const INITIAL_USERS: User[] = [
  // 1. ADMIN (2 usuarios)
  {
    id: 'u-admin-herly',
    name: 'Herly Lizarazo',
    email: 'herly.lizarazo@micarta.pe',
    dni: '00448157',
    password: 'password',
    role: 'ADMIN',
    phone: '952341165',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'En línea'
  },
  {
    id: 'u-ever-aguilar',
    name: 'Ever Aguilar',
    email: 'ever.aguilar@micarta.pe',
    dni: '10203040',
    password: '12345678',
    role: 'ADMIN',
    phone: '+51 980 102 030',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'En línea'
  },

  // 2. OWNER - Dueños (2 usuarios)
  {
    id: 'u-owner-carlos',
    name: 'Carlos Mendoza (Dueño)',
    email: 'carlos.owner@micarta.pe',
    dni: '21001001',
    password: '12345678',
    role: 'OWNER',
    phone: '+51 987 654 321',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-picanteria-mar'],
    status: 'active',
    lastActive: 'Recién registrado'
  },
  {
    id: 'u-owner-mariana',
    name: 'Mariana Silva (Dueño)',
    email: 'mariana.owner@micarta.pe',
    dni: '21001002',
    password: '12345678',
    role: 'OWNER',
    phone: '+51 987 654 322',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-fuego-criollo'],
    status: 'active',
    lastActive: 'Recién registrado'
  },

  // 3. RESTAURANT_MANAGER - Administrador de Sede (2 usuarios)
  {
    id: 'u-manager-roberto',
    name: 'Roberto Paredes (Gerente)',
    email: 'roberto.manager@micarta.pe',
    dni: '31001001',
    password: '12345678',
    role: 'RESTAURANT_MANAGER',
    phone: '+51 987 654 323',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  },
  {
    id: 'u-manager-valeria',
    name: 'Valeria Gómez (Gerente)',
    email: 'valeria.manager@micarta.pe',
    dni: '31001002',
    password: '12345678',
    role: 'RESTAURANT_MANAGER',
    phone: '+51 987 654 324',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  },

  // 4. KITCHEN - Cocina (2 usuarios)
  {
    id: 'u-kitchen-gaston',
    name: 'Chef Gastón Rivas (Cocina)',
    email: 'gaston.chef@micarta.pe',
    dni: '41001001',
    password: '12345678',
    role: 'KITCHEN',
    phone: '+51 987 654 325',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  },
  {
    id: 'u-kitchen-lucia',
    name: 'Chef Lucía Morales (Cocina)',
    email: 'lucia.chef@micarta.pe',
    dni: '41001002',
    password: '12345678',
    role: 'KITCHEN',
    phone: '+51 987 654 326',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  },

  // 5. WAITER - Mesero (2 usuarios)
  {
    id: 'u-waiter-mateo',
    name: 'Mateo Flores (Mesero)',
    email: 'mateo.mesero@micarta.pe',
    dni: '51001001',
    password: '12345678',
    role: 'WAITER',
    phone: '+51 987 654 327',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  },
  {
    id: 'u-waiter-camila',
    name: 'Camila Vega (Mesero)',
    email: 'camila.mesero@micarta.pe',
    dni: '51001002',
    password: '12345678',
    role: 'WAITER',
    phone: '+51 987 654 328',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  },

  // 6. DELIVERY - Repartidor (2 usuarios)
  {
    id: 'u-delivery-diego',
    name: 'Diego Quispe (Delivery)',
    email: 'diego.rider@micarta.pe',
    dni: '61001001',
    password: '12345678',
    role: 'DELIVERY',
    phone: '+51 987 654 329',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  },
  {
    id: 'u-delivery-sofia',
    name: 'Sofía Torres (Delivery)',
    email: 'sofia.rider@micarta.pe',
    dni: '61001002',
    password: '12345678',
    role: 'DELIVERY',
    phone: '+51 987 654 330',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  },

  // 7. CUSTOMER - Cliente (2 usuarios)
  {
    id: 'u-customer-andres',
    name: 'Andrés Castro (Cliente)',
    email: 'andres.cliente@micarta.pe',
    dni: '71001001',
    password: '12345678',
    role: 'CUSTOMER',
    phone: '+51 987 654 331',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  },
  {
    id: 'u-customer-elena',
    name: 'Elena Navarro (Cliente)',
    email: 'elena.cliente@micarta.pe',
    dni: '71001002',
    password: '12345678',
    role: 'CUSTOMER',
    phone: '+51 987 654 332',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'Recién registrado'
  }
];

export const INITIAL_ORDERS: Order[] = [];
