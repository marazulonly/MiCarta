export type TabType = 'home' | 'restaurants' | 'users' | 'orders' | 'architecture' | 'templates';

export type UserRole = 
  | 'ADMIN'               // Superadministrador de la plataforma SaaS
  | 'OWNER'               // Propietarios de franquicias o cadenas
  | 'RESTAURANT_MANAGER'  // Administrador / Gerente de sede o restaurante
  | 'KITCHEN'             // Cocina / Chef de estación o KDS
  | 'WAITER'              // Mesero / Mozo para toma de comandas en mesa
  | 'DELIVERY'            // Repartidor motorizado para entregas
  | 'CUSTOMER';           // Cliente final (carta digital, pedidos QR)

export type OrderStatus = 
  | 'PENDING'             // Recibido / Por confirmar
  | 'IN_KITCHEN'          // En preparación en cocina
  | 'READY'               // Listo para entrega en mesa o despacho
  | 'ON_THE_WAY'          // En reparto motorizado
  | 'DELIVERED'           // Entregado y cobrado
  | 'CANCELLED';          // Cancelado

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface RestaurantBranding {
  primaryColor: string;       // Color primario de marca (ej: #EA580C)
  secondaryColor: string;     // Color secundario (ej: #F59E0B)
  accentColor: string;        // Color de acento para botones/badges
  darkBgColor: string;        // Fondo de la carta
  cardBgColor: string;        // Fondo de tarjetas
  textColor: string;          // Color principal de texto (platos y descripciones)
  fontDisplay: string;        // Tipografía para encabezados
  buttonColor?: string;       // Color de los botones y del borde del recuadro del plato
  buttonTextColor?: string;   // Color del texto de los botones
  dishNameFont?: string;      // Tipo de letra para el nombre del plato
  dishDescFont?: string;      // Tipo de letra para la descripción del plato
  dishPriceFont?: string;     // Tipo de letra para el precio del plato
  restaurantNameFont?: string;  // Tipo de letra para el nombre del restaurante
  restaurantNameColor?: string; // Color del texto del nombre del restaurante
  dishCardBgColor?: string;     // Fondo del recuadro / ficha del plato
  dishCardBorderColor?: string; // Color de borde del plato
  cardBorderRadius?: string;    // Radio de borde ('0px', '8px', '16px', '24px')
  cardStyle?: 'horizontal' | 'grid' | 'compact' | 'minimal' | 'photo-hero';
  priceColor?: string;          // Color del precio (ej: #dfb86c, #ffffff)
  headerStyle?: 'banner' | 'centered' | 'minimal' | 'split';
  // Header customization
  headerLogoUrl?: string;          // Logo o imagen de cabecera específica (JPG, PNG, SVG)
  headerDisplayMode?: 'IMAGE_AND_TEXT' | 'IMAGE_ONLY'; // Mostrar logo + nombre/slogan o solo la imagen
  showHeaderName?: boolean;        // Mostrar nombre del restaurante en la cabecera (default true)
  showHeaderTagline?: boolean;     // Mostrar slogan del restaurante en la cabecera (default true)
  showHeaderBadge?: boolean;       // Mostrar distintivo de canal/subtítulo superior
  headerLogoFit?: 'contain' | 'cover' | 'auto'; // Ajuste de la imagen en la cabecera
  headerBannerHeight?: number;     // Altura máxima del logo/cabecera en px (default 100)
}

export interface RestaurantMetrics {
  dailyRevenue: number;
  activeOrders: number;
  avgTicket: number;
  customerRating: number;
  totalTables: number;
  occupancyRate: number;
}

export interface WaiterPermissions {
  canCancelOrders: boolean;
  canApplyDiscounts: boolean;
  canAssignTables: boolean;
  canSplitBills: boolean;
  requireSupervisorPin: boolean;
  maxActiveTables: number;
}

export interface KitchenPermissions {
  canMarkReady: boolean;           // Puede marcar comandas como listas para servir/despachar
  canRejectItems: boolean;          // Puede solicitar anulación o rectificación al mozo
  canManageStockOut: boolean;       // Puede marcar platos agotados (Lista 86) en la carta
  canReorderQueue: boolean;         // Puede alterar prioridades de preparación
  autoPrintTickets: boolean;        // Envío de impresión automática de comanda
  soundAlerts: boolean;             // Alertas audibles con campana al ingresar pedido
  stationFilter?: string;           // Estación asignada (Parrilla, Calientes, Fríos, etc.)
}

export interface DeliveryPermissions {
  canAcceptCash: boolean;
  maxActiveOrders: number;
  autoAssignZone: boolean;
  gpsSpeedTracking: boolean;
  allowedZones: string[];
}

export interface CustomerAccessSettings {
  qrOrderingEnabled: boolean;
  guestCheckout: boolean;
  allowCashAtTable: boolean;
  vipDiscountPercent: number;
  maxOrderAmount: number;
  welcomeMessage?: string;
  wifiPassword?: string;
}

export interface MenuTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  themeStyle: 'luxury-gold' | 'chalkboard-dark' | 'marine-parchment' | 'neon-street' | 'minimalist' | 'warm-trattoria' | 'green-organic' | 'custom';
  fontDisplay: string;
  primaryColor: string;
  darkBgColor: string;
  cardBgColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  textColor?: string;
  cardBorderRadius?: string;
  cardStyle?: 'horizontal' | 'grid' | 'compact' | 'minimal' | 'photo-hero';
  headerStyle?: 'banner' | 'centered' | 'minimal' | 'split';
  layoutMode: 'grid' | 'alternating' | 'book' | 'compact';
  thumbnailUrl: string;
  badge: string;
  tags: string[];
  isCustomizable: boolean;
  activeRestaurantsCount?: number;
}

export interface DishAddon {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  prepTimeMinutes: number;
  allergens: string[];
  tags: string[];
  availableAddons?: DishAddon[];           // Lista de adicionales configurados por el dueño
  suggestedObservations?: string[];       // Observaciones sugeridas (ej: Término medio, Sin cebolla)
  targetMenuScope?: 'ALL' | 'DINE_IN' | 'DELIVERY'; // Visibilidad en Carta Salón / Carta Delivery
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  sortOrder: number;
  iconName?: string;
  isActive?: boolean;
  targetMenuScope?: 'ALL' | 'DINE_IN' | 'DELIVERY';
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface DaySchedule {
  day: DayOfWeek;
  isOpen: boolean;
  openTime: string;   // e.g. "12:00"
  closeTime: string;  // e.g. "23:30"
  notes?: string;     // e.g. "Horario Corrido", "Atención en Salón y Delivery"
}

export interface StaffShift {
  id: string;
  restaurantId: string;
  name: string;
  startTime: string;   // e.g. "11:00"
  endTime: string;     // e.g. "17:00"
  applicableDays: DayOfWeek[];
  roleTarget: 'WAITER' | 'DELIVERY' | 'KITCHEN' | 'ALL';
  assignedUserIds: string[];
  colorBadge?: string;
}

export type TableZone = 'SALON' | 'TERRAZA' | 'BARRA' | 'VIP' | 'BALCON';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  number: number;
  name: string;
  zone: TableZone;
  capacity: number;
  status: TableStatus;
  assignedWaiterIds: string[];
  currentOrderId?: string;
  qrCodeParam: string;
  notes?: string;
}

export interface MenuAccessSettings {
  menuMode: 'SAME' | 'SEPARATE';          // Misma carta o cartas independientes para salón y delivery
  enableDineIn?: boolean;                 // Checkbox: Habilitar canal Salón (Presencial / Mozos)
  enableDelivery?: boolean;               // Checkbox: Habilitar canal Delivery (A Domicilio / Motorizados)
  presentialTitle?: string;
  presentialBgType?: 'color' | 'image' | 'gradient' | 'theme';
  presentialBgValue?: string;              // Hex, URL de imagen o gradiente
  presentialCustomTheme?: string;
  deliveryTitle?: string;
  deliveryBgType?: 'color' | 'image' | 'gradient' | 'theme';
  deliveryBgValue?: string;                // Hex, URL de imagen o gradiente
  deliveryCustomTheme?: string;
  deliveryMinOrder?: number;
  deliveryEstimatedMinutes?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  cuisineType: string;
  slug: string;               // Link único editable (ej: brasas-fuego)
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  logoUrl: string;
  coverUrl: string;
  branding: RestaurantBranding;
  metrics: RestaurantMetrics;
  isOpen: boolean;
  ownerId?: string;
  templateId?: string;
  menuAccessSettings?: MenuAccessSettings; // Configuración de cartas Salón vs Delivery y fondos
  waiterPermissions?: WaiterPermissions;
  kitchenPermissions?: KitchenPermissions;
  deliveryPermissions?: DeliveryPermissions;
  customerAccessSettings?: CustomerAccessSettings;
  weeklySchedule?: DaySchedule[];
  shifts?: StaffShift[];
  tables?: RestaurantTable[];
  totalTablesCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  dni: string;                // OCHO dígitos numéricos. Campo único e irrepetible.
  password?: string;          // Clave de acceso (para la simulación es "12345678")
  role: UserRole;
  phone: string;
  avatar: string;
  restaurantIds: string[];    // Sedes asignadas (o todas si es ADMIN)
  status: 'active' | 'inactive';
  lastActive: string;
  createdByOwnerId?: string;  // Registra qué dueño creó este usuario
  waiterPermissions?: WaiterPermissions;
  kitchenPermissions?: KitchenPermissions;
  kitchenStation?: string;    // Estación de cocina (Parrilla, Fríos, Calientes, etc.)
  deliveryPermissions?: DeliveryPermissions;
  vipTier?: 'STANDARD' | 'SILVER' | 'GOLD' | 'BLACK_VIP';
  vehicleType?: 'MOTO' | 'BICI' | 'AUTO';
  licensePlate?: string;
  assignedShift?: 'MANANA' | 'TARDE' | 'NOCHE' | 'COMPLETO';
  creditBalance?: number;
  totalOrdersCount?: number;
  notes?: string;
  pinCode?: string;
}

export interface OrderItemUnit {
  unitNumber: number;                     // Unidad 1, Unidad 2, etc.
  observation?: string;                   // Observación de ESTA unidad (ej: "Bien cocido, sin sal")
  selectedAddons?: DishAddon[];           // Adicionales de ESTA unidad (ej: "Huevo frito +S/3")
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  units?: OrderItemUnit[];                // Detalle por cada unidad pedida
  notes?: string;
  modifiers?: string[];
}

export interface Order {
  id: string;
  restaurantId: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  tableNumber?: string;
  customerId?: string;        // ID del cliente para tracking personal
  customerName: string;
  customerDni?: string;       // DNI del cliente
  customerPhone?: string;
  customerWhatsapp?: string;  // OBLIGATORIO para pedidos Delivery
  deliveryAddress?: string;   // OBLIGATORIO para pedidos Delivery
  deliveryGpsLocation?: string; // Opcional (coordenadas GPS / link de ubicación)
  deliveryReference?: string; // Opcional (ej: Piso 4, Dpto 402, frente al parque)
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  estimatedMinutes: number;
  waiterName?: string;
  waiterId?: string;
  courierName?: string;
  courierId?: string;
}
