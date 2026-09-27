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

export const VORAZ_LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMTIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj48ZGVmcz48c3R5bGU+QGltcG9ydCB1cmwoImh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9U3luZTp3Z2h0QDgwMCZhbXA7ZGlzcGxheT1zd2FwIik7IC5icmFuZC12b3JheiB7IGZvbnQtZmFtaWx5OiAiU3luZSIsICJPdXRmaXQiLCAiSW1wYWN0Iiwgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDgwMDsgZmlsbDogI0UxMUQ0ODsgfSAuYnJhbmQtc3ViIHsgZm9udC1mYW1pbHk6ICJTeW5lIiwgc2Fucy1zZXJpZjsgZm9udC13ZWlnaHQ6IDcwMDsgZmlsbDogI0ZGRkZGRjsgZm9udC1zaXplOiAxNXB4OyBsZXR0ZXItc3BhY2luZzogNnB4OyB9PC9zdHlsZT48L2RlZnM+PHRleHQgeD0iMjAwIiB5PSI2NSIgZm9udC1zaXplPSI1NCIgbGV0dGVyLXNwYWNpbmc9IjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJicmFuZC12b3JheiI+Vk9SQVo8L3RleHQ+PHRleHQgeD0iMjAwIiB5PSI5OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgY2xhc3M9ImJyYW5kLXN1YiI+RlVTScOTTiBVUkJBTkE8L3RleHQ+PC9zdmc+';

export const RIENDAS_DE_PLATA_LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMTIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj48ZGVmcz48c3R5bGU+QGltcG9ydCB1cmwoImh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9Q2luemVsOndnaHRANzAwOzkwMCZhbXA7ZGlzcGxheT1zd2FwIik7IC5icmFuZC10aXRsZSB7IGZvbnQtZmFtaWx5OiAiQ2luemVsIiwgIlBsYXlmYWlyIERpc3BsYXkiLCBzZXJpZjsgZm9udC13ZWlnaHQ6IDkwMDsgZmlsbDogI0Q0QUYzNzsgfSAuYnJhbmQtc3ViIHsgZm9udC1mYW1pbHk6ICJDaW56ZWwiLCBzZXJpZjsgZm9udC13ZWlnaHQ6IDYwMDsgZmlsbDogI0U1RTdFQjsgZm9udC1zaXplOiAxM3B4OyBsZXR0ZXItc3BhY2luZzogNXB4OyB9PC9zdHlsZT48L2RlZnM+PHRleHQgeD0iMjAwIiB5PSI1NSIgZm9udC1zaXplPSIzNCIgbGV0dGVyLXNwYWNpbmc9IjMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJicmFuZC10aXRsZSI+UklFTkRBUyBERSBQTEFUQTwvdGV4dD48bGluZSB4MT0iOTAiIHkxPSI3MiIgeDI9IjMxMCIgeTI9IjcyIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2Utb3BhY2l0eT0iMC43Ii8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iNzIiIHI9IjMuNSIgZmlsbD0iI0Q0QUYzNyIvPjx0ZXh0IHg9IjIwMCIgeT0iOTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGNsYXNzPSJicmFuZC1zdWIiPlBBUlJJTExBICZhbXA7IENPUlRFUzwvdGV4dD48L3N2Zz4=';

export const INITIAL_RESTAURANTS: Restaurant[] = [];

export const INITIAL_CATEGORIES: MenuCategory[] = [];

export const INITIAL_MENU_ITEMS: MenuItem[] = [];

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1790352263608',
    name: 'Diego Castillo',
    email: 'diego.castillo@riendasdeplata.pe',
    dni: '72849102',
    password: 'password',
    role: 'OWNER',
    phone: '+51 982 341 550',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    restaurantIds: ['rest-1790352289887'],
    status: 'active',
    lastActive: 'En línea'
  },
  {
    id: 'u-owner-alonso',
    name: 'Alonso Jaramillo',
    email: 'alonso.jaramillo@cevichitopliz.pe',
    dni: '94639300',
    password: 'password',
    role: 'OWNER',
    phone: '+51 946 393 000',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
    status: 'active',
    lastActive: 'En línea'
  },
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
    id: 'u-1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@micarta.io',
    dni: '10203040',
    password: '12345678',
    role: 'ADMIN',
    phone: '+51 980 123 456',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    restaurantIds: [],
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
    restaurantIds: [],
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

export const INITIAL_ORDERS: Order[] = [];
