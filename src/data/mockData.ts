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
  waiterIds: string[] = ['u-5c']
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
      status: num === 2 ? 'OCCUPIED' : 'AVAILABLE',
      assignedWaiterIds: assignedWaiter,
      currentOrderId: num === 2 ? 'ord-104' : undefined,
      qrCodeParam: `${num}`,
      notes: zone === 'TERRAZA' ? 'Zona exterior con vista' : zone === 'VIP' ? 'Box privado climatizado' : undefined
    };
  });
};

export const generateShiftsForRestaurant = (
  restaurantId: string,
  waiterIds: string[] = ['u-5c'],
  riderIds: string[] = ['u-7c']
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
    assignedUserIds: ['u-k2'],
    colorBadge: '#F97316'
  }
];

export const CEVICHITO_PLIZ_LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMTIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgQGltcG9ydCB1cmwoImh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9RnJlZG9rYTp3Z2h0QDcwMDs4MDAmYW1wO2Rpc3BsYXk9c3dhcCIpOwogICAgICAuYnJhbmQtdGl0bGUgeyBmb250LWZhbWlseTogIkZyZWRva2EiLCAiT3V0Zml0IiwgIkFyaWFsIEJsYWNrIiwgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDgwMDsgZmlsbDogIzExMTExMTsgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHRleHQgeD0iMjAwIiB5PSI1NSIgZm9udC1zaXplPSI0NCIgbGV0dGVyLXNwYWNpbmc9IjEuNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgY2xhc3M9ImJyYW5kLXRpdGxlIiB0cmFuc2Zvcm09InJvdGF0ZSgtMS41IDIwMCA1NSkiPkNFVklDSElUTzwvdGV4dD4KICA8cG9seWdvbiBwb2ludHM9IjExMCw4OCAxMjYsODEgMTI2LDk1IiBmaWxsPSIjMTExMTExIi8+CiAgPHRleHQgeD0iMjAwIiB5PSI5NCIgZm9udC1zaXplPSIzOCIgbGV0dGVyLXNwYWNpbmc9IjMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJicmFuZC10aXRsZSIgdHJhbnNmb3JtPSJyb3RhdGUoLTEuNSAyMDAgOTQpIj5QTElaPC90ZXh0PgogIDxwb2x5Z29uIHBvaW50cz0iMjkwLDg4IDI3NCw4MSAyNzQsOTUiIGZpbGw9IiMxMTExMTEiLz4KPC9zdmc+';

export const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-costa',
    name: 'Cevichito Pliz',
    tagline: 'Cevichería Contemporánea & Pesca Artesanal del Día',
    cuisineType: 'Cevichería & Mariscos',
    slug: 'cevichito-pliz',
    address: 'Malecón de la Reserva 102, Miraflores',
    phone: '+51 945 678 901',
    rating: 4.9,
    reviewCount: 390,
    logoUrl: CEVICHITO_PLIZ_LOGO_SVG,
    coverUrl: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=900&auto=format&fit=crop&q=80',
    ownerId: 'u-owner-stephanie',
    templateId: 'tmpl-marine',
    branding: {
      primaryColor: '#18181B',       // Zinc oscuro / casi negro
      secondaryColor: '#52525B',     // Gris zinc intermedio
      accentColor: '#111111',        // Negro puro
      darkBgColor: '#FFFFFF',        // Fondo blanco
      cardBgColor: '#F4F4F5',        // Tarjetas gris claro
      dishCardBgColor: '#FFFFFF',    // Platos sobre fondo blanco
      textColor: '#18181B',          // Texto en zinc oscuro
      fontDisplay: 'Outfit, sans-serif',
      buttonColor: '#111111',        // Botón negro
      buttonTextColor: '#FFFFFF',    // Texto del botón blanco
      restaurantNameFont: 'Outfit, sans-serif',
      restaurantNameColor: '#18181B', // Nombre en zinc oscuro
      headerLogoUrl: CEVICHITO_PLIZ_LOGO_SVG,
      headerDisplayMode: 'IMAGE_ONLY',
      showHeaderName: false,
      showHeaderTagline: false,
      showHeaderBadge: false,
      headerLogoFit: 'contain',
      headerBannerHeight: 95
    },
    metrics: {
      dailyRevenue: 4150.20,
      activeOrders: 1,
      avgTicket: 41.00,
      customerRating: 4.9,
      totalTables: 22,
      occupancyRate: 5
    },
    isOpen: true,
    totalTablesCount: 22,
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
    shifts: generateShiftsForRestaurant('rest-costa', ['u-5c'], ['u-7c']),
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
      welcomeMessage: 'Bienvenidos a Cevichito Pliz - Pesca artesanal del litoral peruano y ceviches al momento.',
      wifiPassword: 'CevichitoPliz2026'
    }
  },
  {
    id: 'rest-1790204393895',
    name: 'Voraz',
    tagline: 'Cocina Urbana & Fusión',
    cuisineType: 'Fusión & Carnes',
    slug: 'voraz',
    address: 'Av. La Mar 850, Miraflores',
    phone: '+51 987 654 321',
    rating: 4.8,
    reviewCount: 120,
    logoUrl: '',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&auto=format&fit=crop&q=80',
    ownerId: 'u-owner-stephanie',
    templateId: 'tmpl-modern',
    branding: {
      primaryColor: '#E11D48',
      secondaryColor: '#4B5563',
      accentColor: '#111827',
      darkBgColor: '#0F172A',
      cardBgColor: '#1E293B',
      dishCardBgColor: '#0F172A',
      textColor: '#F8FAFC',
      fontDisplay: 'Outfit, sans-serif',
      buttonColor: '#E11D48',
      buttonTextColor: '#FFFFFF',
      restaurantNameFont: 'Outfit, sans-serif',
      restaurantNameColor: '#FFFFFF',
      headerDisplayMode: 'IMAGE_AND_TEXT',
      showHeaderName: true,
      showHeaderTagline: true,
      showHeaderBadge: true,
      headerLogoFit: 'contain',
      headerBannerHeight: 120
    },
    metrics: {
      dailyRevenue: 2850.00,
      activeOrders: 0,
      avgTicket: 35.00,
      customerRating: 4.8,
      totalTables: 16,
      occupancyRate: 0
    },
    isOpen: true,
    totalTablesCount: 16
  }
];

export const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat-m-entradas', restaurantId: 'rest-costa', name: 'Entradas & Piqueos', description: 'Tequeños crocantes, tiraditos y piqueos marinos para compartir', sortOrder: 1, iconName: 'Utensils' },
  { id: 'cat-m-causitas', restaurantId: 'rest-costa', name: 'Nuestras Causitas', description: 'Masa de papa amarilla prensada con ají amarillo, palta Hass y coronaciones marinas', sortOrder: 2, iconName: 'Sparkles' },
  { id: 'cat-m-arroces', restaurantId: 'rest-costa', name: 'Arroces', description: 'Arroces marineros al wok, chaufa de mariscos y melosos al pisco', sortOrder: 3, iconName: 'Waves' },
  { id: 'cat-m-pulpos', restaurantId: 'rest-costa', name: 'Pulpos', description: 'Tentáculos enteros de pulpo a la brasa y al olivo', sortOrder: 4, iconName: 'Flame' },
  { id: 'cat-m-ceviches', restaurantId: 'rest-costa', name: 'Ceviches & Cevichitos', description: 'Pesca artesanal fresca del litoral, leche de tigre y tiraditos', sortOrder: 5, iconName: 'Fish' },
  { id: 'cat-m3', restaurantId: 'rest-costa', name: 'Cócteles de Autor', description: 'Chilcanos de maracuyá y pisco sour premium', sortOrder: 6, iconName: 'GlassWater' },
  { id: 'cat-m4', restaurantId: 'rest-costa', name: 'Bebidas', description: 'Chicha morada tradicional, limonadas y bebidas refrescantes', sortOrder: 7, iconName: 'GlassWater' }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // 1. Entradas & Piqueos (cat-m-entradas)
  {
    id: 'item-m-tequenos-queso',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-entradas',
    name: 'TEQUEÑOS DE QUESO (X8)',
    description: 'Masa wantan rellena de queso acompañado con guacamole de la casa.',
    price: 18.00,
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 20,
    allergens: ['Lácteos', 'Gluten'],
    tags: ['Para Picar', 'Entrada'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m-tiradito-entrada',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-entradas',
    name: 'TIRADITO',
    description: 'Tiras delgadas de pescado fresco marinadas en la crema de su preferencia: Tradicional, Ají Amarillo o Rocoto.',
    price: 22.00,
    imageUrl: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 20,
    allergens: ['Pescado'],
    tags: ['Frescura Marina', 'Entrada'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m-tequenos-mariscos',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-entradas',
    name: 'TEQUEÑOS DE MARISCOS (X8)',
    description: 'Masa wantan rellena de mixtura de mariscos, decorada con nuestra salsa agridulce.',
    price: 22.00,
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 20,
    allergens: ['Mariscos', 'Gluten'],
    tags: ['Entrada', 'Mariscos'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m-choritos-chalaca',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-entradas',
    name: 'CHORITOS A LA CHALACA (X8)',
    description: 'Mejillones bañados en aceite de oliva, jugo de limón y decorado con ají verde, choclo, cebolla picada y cilantro.',
    price: 24.00,
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 20,
    allergens: ['Moluscos'],
    tags: ['Tradición Chalaca', 'Entrada'],
    targetMenuScope: 'ALL'
  },

  // 2. Nuestras Causitas (cat-m-causitas)
  {
    id: 'item-m-causa-acevichada',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-causitas',
    name: 'CAUSA ACEVICHADA AL AJÍ AMARILLO',
    description: 'Suave masa de papa amarilla prensada con pasta de ají amarillo y limón sutil, rellena de palta hass y cubierta con ceviche fresco bañado en salsa acevichada.',
    price: 32.00,
    imageUrl: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 12,
    allergens: ['Pescado', 'Huevo'],
    tags: ['Fusión Marina', 'Favorito'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m-causa-pulpo',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-causitas',
    name: 'CAUSA DE PULPO AL OLIVO',
    description: 'Papa amarilla sazonada rellena de palta cremosa y coronada con láminas de pulpo tierno marinadas en crema de aceitunas botija iqueñas.',
    price: 34.00,
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 10,
    allergens: ['Moluscos', 'Huevo'],
    tags: ['Gourmet', 'Pulpo'],
    targetMenuScope: 'ALL'
  },

  // 3. Arroces (cat-m-arroces)
  {
    id: 'item-m5',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-arroces',
    name: 'ARROZ CON MARISCOS MELOSO AL WOK DE LEÑA',
    description: 'Langostinos jumbo, anillas de calamar tierno, pulpo y conchas de abanico flameados al pisco. Montado sobre arroz meloso con arvejas y pimientos asados.',
    price: 54.00,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 16,
    allergens: ['Mariscos', 'Pescado'],
    tags: ['Wok Marinero', 'Al Pisco']
  },
  {
    id: 'item-m7',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-arroces',
    name: 'CHAUFA MARINO ESPECIAL AL CARBÓN',
    description: 'Mixtura selecta de mariscos flameados a fuego candente con trozos de pescado crocante. Arroz jazmín salteado al wok con cebollita china fresca.',
    price: 49.00,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 15,
    allergens: ['Mariscos', 'Pescado', 'Soya', 'Huevo'],
    tags: ['Wok Candente', 'Chaufa Especial']
  },

  // 4. Pulpos (cat-m-pulpos)
  {
    id: 'item-m3',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-pulpos',
    name: 'PULPO A LA BRASA CON PAPAS COCHAYUYO',
    description: 'Tentáculo entero de pulpo sellado a la brasa con salsa anticuchera de la casa y papas doradas.',
    price: 52.00,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isChefSpecial: true,
    prepTimeMinutes: 12,
    allergens: ['Moluscos'],
    tags: ['Pulpo a la Brasa', 'Gourmet']
  },

  // 5. Ceviches & Cevichitos (cat-m-ceviches)
  {
    id: 'item-m1',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-ceviches',
    name: 'CEVICHE MIXTO CEVICHITO PLIZ',
    description: 'Corvina fresca de pesca del día, calamar tierno y langostinos del norte. Acompañado de choclo tierno desgranado y camote glaseado a la naranja.',
    price: 48.00,
    imageUrl: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 10,
    allergens: ['Pescado', 'Mariscos'],
    tags: ['Especialidad de la Casa', 'Pesca del Día']
  },
  {
    id: 'item-m-ceviche-clasico',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-ceviches',
    name: 'CEVICHE CLÁSICO DE PESCA DEL DÍA',
    description: 'Corvina fresca marinada al momento con zumo de limón piurano recién exprimido, ají limo, cebolla roja pluma, camote glaseado a la naranja y choclo tierno.',
    price: 38.00,
    imageUrl: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 10,
    allergens: ['Pescado'],
    tags: ['Clásico', 'Pesca del Día']
  },
  {
    id: 'item-m-ceviche-carretillero',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-ceviches',
    name: 'CEVICHE CARRETILLERO CON CALAMAR CROCANTE',
    description: 'Pesca fresca marinada al ají limo y limón piurano servida con generosa porción de chicharrón de calamar crujiente al momento y crema de rocoto carretillero.',
    price: 44.00,
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 14,
    allergens: ['Pescado', 'Moluscos', 'Gluten'],
    tags: ['Carretillero', 'Crocante & Fresco'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m2',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-ceviches',
    name: 'TIRADITO AHUMADO AL AJÍ AMARILLO & MARACUYÁ',
    description: 'Láminas finas de lenguado fresco curado con sal marina. Guarnecido con choclo crocante chulpe y cubos de palta fuerte.',
    price: 42.00,
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 8,
    allergens: ['Pescado'],
    tags: ['Tiradito', 'Toque Cítrico']
  },
  {
    id: 'item-m4',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-ceviches',
    name: 'TIRADITO NIKKEI DE ATÚN ALETA AMARILLA',
    description: 'Cortes seleccionados de atún rojo aleta amarilla fresco. Servido con hilos de nabo encurtido y ajonjolí tostado.',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 8,
    allergens: ['Pescado', 'Soya'],
    tags: ['Fusión Nikkei', 'Atún Fresco']
  },

  // 6. Cócteles & Bebidas
  {
    id: 'item-m8',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m3',
    name: 'Pisco Sour Catedral Cevichito Pliz (Copa Doble)',
    description: 'Destilado puro de uva Quebranta iqueña (4 oz) batido vigorosamente con clara de huevo fresca y zumo de limón piurano.',
    price: 32.00,
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 5,
    allergens: ['Huevo'],
    tags: ['Cóctel Bandera', '4 oz Pisco Puro']
  },
  {
    id: 'item-m9',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m3',
    name: 'Chilcano Macerado de Maracuyá & Hierba Luisa',
    description: 'Pisco acholado premium macerado con hojas frescas de hierba luisa y pulpa de maracuyá.',
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
    categoryId: 'cat-m4',
    name: 'Limonada de Hierba Luisa & Jengibre (Jarra 1L)',
    description: 'Zumo fresco de limones sutiles colado al momento con infusión helada de hierba luisa y jengibre fresco rallado.',
    price: 24.00,
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 4,
    allergens: [],
    tags: ['Sin Alcohol', '100% Natural', 'Jarra Familiar']
  },
  {
    id: 'item-m-chicha',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m4',
    name: 'Chicha Morada Tradicional de la Casa (Jarra 1L)',
    description: 'Elaborada artesanalmente con maíz morado selecto, piña dulce madura, manzana israel, membrillo, canela en rama y clavo de olor, con toque de limón sutil al momento.',
    price: 18.00,
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 3,
    allergens: [],
    tags: ['100% Natural', 'Jarra Familiar'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m-chicharron-mixto',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-entradas',
    name: 'Chicharrón Mixto de Pescado & Mariscos',
    description: 'Generosa mixtura crocante de pescado blanco, langostinos y calamares con yucas doradas, zarza criolla al limón y crema tártara casera.',
    price: 44.00,
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 16,
    allergens: ['Pescado', 'Mariscos', 'Huevo', 'Gluten'],
    tags: ['Para Compartir', 'Crocante'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m-choritos',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-entradas',
    name: 'Choritos a la Chalaca al Limón Piurano (x8)',
    description: 'Choritos frescos al vapor aderezados con chalaquita criolla de cebolla morada, tomate concasse, ají limo picado, cilantro y choclo desgranado.',
    price: 28.00,
    imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b3e55fdd4f?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 8,
    allergens: ['Moluscos'],
    tags: ['Clásico Chalaco', 'Mariscos Frescos'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m-pulpo-olivo',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-causitas',
    name: 'Pulpo al Olivo con Palta Fuerte',
    description: 'Láminas tiernas de pulpo marinadas en suave crema de aceitunas botija peruanas, con cubos de palta fuerte, aceite de oliva virgen y galletas de soda.',
    price: 38.00,
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 10,
    allergens: ['Moluscos', 'Huevo'],
    tags: ['Gourmet', 'Pulpo'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m-pulpo-parrilla',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-pulpos',
    name: 'Pulpo a la Parrilla con Chimichurri Anticuchero',
    description: 'Tentáculos enteros de pulpo sellados a las brasas con marinada anticuchera de ají panca, acompañados de papas nativas doradas y salsa chimichurri rústica.',
    price: 56.00,
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    isChefSpecial: true,
    prepTimeMinutes: 16,
    allergens: ['Moluscos'],
    tags: ['A la Brasa', 'Especialidad'],
    targetMenuScope: 'ALL'
  },
  {
    id: 'item-m-tequenos',
    restaurantId: 'rest-costa',
    categoryId: 'cat-m-entradas',
    name: 'Tequeños de Mariscos & Salsa Tártara (x8)',
    description: 'Wantanes crocantes artesanales rellenos de mixtura de mariscos flameados al vino blanco con salsa agridulce especial y tártara casera.',
    price: 26.00,
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 10,
    allergens: ['Mariscos', 'Gluten'],
    tags: ['Piqueo Marino', 'Recomendado'],
    targetMenuScope: 'ALL'
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
    id: 'u-owner-stephanie',
    name: 'Stephanie Leon',
    email: 'stephanie.leon@cevichitopliz.pe',
    dni: '89309927',
    password: 'password',
    role: 'OWNER',
    phone: '+51 989 309 927',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-costa', 'rest-1790204393895'],
    status: 'active',
    lastActive: 'En línea'
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
    createdByOwnerId: 'u-owner-stephanie',
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
    id: 'u-7c',
    name: 'Marco Antonio Paz (Rider #19)',
    email: 'marco.bici@gastrodelivery.pe',
    dni: '50809010',
    password: '12345678',
    role: 'DELIVERY',
    phone: '+51 944 223 311',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-costa'],
    status: 'active',
    lastActive: 'En entrega Miraflores',
    vehicleType: 'BICI',
    licensePlate: 'ECO-BIKE',
    createdByOwnerId: 'u-owner-stephanie',
    deliveryPermissions: {
      canAcceptCash: false,
      maxActiveOrders: 3,
      autoAssignZone: true,
      gpsSpeedTracking: true,
      allowedZones: ['Miraflores', 'San Isidro', 'Barranco']
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
    createdByOwnerId: 'u-owner-stephanie',
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
    id: 'u-8b',
    name: 'Valeria Montiel (VIP)',
    email: 'valeria.montiel@corporativo.com',
    dni: '60809010',
    password: '12345678',
    role: 'CUSTOMER',
    phone: '+51 988 777 665',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-costa'],
    status: 'active',
    lastActive: 'Reserva & Pedido Cevichito Pliz',
    vipTier: 'BLACK_VIP',
    totalOrdersCount: 28,
    creditBalance: 120.00,
    createdByOwnerId: 'u-owner-stephanie'
  }
];

export const INITIAL_ORDERS: Order[] = [
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
      { id: 'oi-7', menuItemId: 'item-m1', name: 'CEVICHE MIXTO CEVICHITO PLIZ', price: 48.00, quantity: 2, notes: 'Picante moderado' },
      { id: 'oi-8', menuItemId: 'item-m5', name: 'ARROZ CON MARISCOS MELOSO AL WOK DE LEÑA', price: 54.00, quantity: 1 }
    ],
    subtotal: 150.00,
    tax: 27.00,
    deliveryFee: 0,
    total: 177.00,
    paymentStatus: 'PENDING',
    createdAt: 'Hace 11 min',
    estimatedMinutes: 12,
    waiterId: 'u-5c',
    waiterName: 'Lucía Benítez'
  }
];
