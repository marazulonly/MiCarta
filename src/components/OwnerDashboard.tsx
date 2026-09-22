import React, { useState, useEffect } from 'react';
import { 
  Store, 
  ChefHat, 
  Bike, 
  UserCheck, 
  LayoutTemplate, 
  Check, 
  Eye, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Wifi, 
  QrCode, 
  DollarSign, 
  Percent, 
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Building2,
  Sparkles,
  ArrowLeft,
  Info,
  Edit3,
  X,
  Mail,
  Phone,
  Shield,
  User as UserIcon,
  AlertCircle,
  Utensils,
  Calendar,
  Clock,
  MapPin,
  Layers,
  Users,
  Copy,
  Printer,
  Flame
} from 'lucide-react';
import { 
  Restaurant, 
  User, 
  MenuTemplate, 
  WaiterPermissions, 
  DeliveryPermissions, 
  KitchenPermissions,
  CustomerAccessSettings, 
  UserRole, 
  MenuItem, 
  MenuCategory,
  DaySchedule,
  RestaurantTable,
  StaffShift,
  TableZone
} from '../types';
import { OwnerMenuEditor } from './OwnerMenuEditor';
import { TableQrModal } from './TableQrModal';
import { DEFAULT_WEEKLY_SCHEDULE, generateTablesForRestaurant, generateShiftsForRestaurant } from '../data/mockData';

interface OwnerDashboardProps {
  currentUser?: User;
  restaurants: Restaurant[];
  users: User[];
  templates: MenuTemplate[];
  menuItems?: MenuItem[];
  categories?: MenuCategory[];
  onUpdateRestaurant: (updated: Restaurant) => void;
  onAddRestaurant?: (newRestaurant: Restaurant) => void;
  onAddUser?: (newUser: User) => void;
  onUpdateUser?: (updatedUser: User) => void;
  onAddMenuItem?: (newItem: MenuItem) => void;
  onUpdateMenuItem?: (updatedItem: MenuItem) => void;
  onDeleteMenuItem?: (itemId: string) => void;
  onAddCategory?: (newCategory: MenuCategory) => void;
  onUpdateCategory?: (updatedCategory: MenuCategory) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onOpenCustomerPreview: (restaurant: Restaurant, mode?: 'DINE_IN' | 'DELIVERY', tableNumber?: string) => void;
  onSwitchToAdminView: () => void;
}

type AccessSubTab = 'dishes' | 'tables' | 'schedules' | 'shifts' | 'kitchen' | 'waiters' | 'delivery' | 'customers' | 'templates';

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentUser,
  restaurants,
  users,
  templates,
  menuItems = [],
  categories = [],
  onUpdateRestaurant,
  onAddRestaurant,
  onAddUser,
  onUpdateUser,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onOpenCustomerPreview,
  onSwitchToAdminView,
}) => {
  const isOwnerLogged = Boolean(currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER'));

  // Find available owners
  const ownersList = users.filter(u => u.role === 'OWNER');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(
    currentUser?.role === 'OWNER' ? currentUser.id : (ownersList[0]?.id || 'u-2')
  );

  const currentOwner = isOwnerLogged ? currentUser! : (ownersList.find(o => o.id === selectedOwnerId) || ownersList[0]);

  // Restaurants owned or assigned to this owner:
  // "Los dueños, solo podrán ver los restaurantes creados por ellos o si les fueron asignados."
  const ownedRestaurants = restaurants.filter(r => {
    if (isOwnerLogged && currentUser) {
      return r.ownerId === currentUser.id || (currentUser.restaurantIds && (currentUser.restaurantIds.includes(r.id) || currentUser.restaurantIds.includes('all')));
    }
    return r.ownerId === currentOwner?.id || (currentOwner?.restaurantIds && currentOwner.restaurantIds.includes(r.id));
  });

  // Selected Restaurant being managed
  const [selectedRestId, setSelectedRestId] = useState<string>(
    ownedRestaurants[0]?.id || ''
  );

  const currentRestaurant = ownedRestaurants.find(r => r.id === selectedRestId) || ownedRestaurants[0];

  // Active subtab inside restaurant management
  const [activeSubTab, setActiveSubTab] = useState<AccessSubTab>('waiters');

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync state when restaurant switches
  const handleSelectRestaurant = (restId: string) => {
    setSelectedRestId(restId);
    const target = restaurants.find(r => r.id === restId);
    if (target) {
      if (target.waiterPermissions) setWaiterPerms(target.waiterPermissions);
      if (target.kitchenPermissions) setKitchenPerms(target.kitchenPermissions);
      if (target.deliveryPermissions) setDeliveryPerms(target.deliveryPermissions);
      if (target.customerAccessSettings) setCustomerSettings(target.customerAccessSettings);
      setScheduleState(target.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE);
      setShiftsState(target.shifts || generateShiftsForRestaurant(target.id));
      setTablesState(target.tables || generateTablesForRestaurant(target.id));
    }
  };

  // Sync selectedRestId if ownedRestaurants changes
  useEffect(() => {
    if (ownedRestaurants.length > 0) {
      if (!selectedRestId || !ownedRestaurants.some(r => r.id === selectedRestId)) {
        const nextId = ownedRestaurants[0].id;
        setSelectedRestId(nextId);
        handleSelectRestaurant(nextId);
      }
    } else {
      setSelectedRestId('');
    }
  }, [ownedRestaurants.length, selectedOwnerId]);

  // Local mutable state for currently selected restaurant permissions
  const [waiterPerms, setWaiterPerms] = useState<WaiterPermissions>(
    currentRestaurant?.waiterPermissions || {
      canCancelOrders: false,
      canApplyDiscounts: true,
      canAssignTables: true,
      canSplitBills: true,
      requireSupervisorPin: true,
      maxActiveTables: 6
    }
  );

  const [kitchenPerms, setKitchenPerms] = useState<KitchenPermissions>(
    currentRestaurant?.kitchenPermissions || {
      canMarkReady: true,
      canRejectItems: true,
      canManageStockOut: true,
      canReorderQueue: true,
      autoPrintTickets: true,
      soundAlerts: true,
      stationFilter: 'Todas las estaciones'
    }
  );

  const [deliveryPerms, setDeliveryPerms] = useState<DeliveryPermissions>(
    currentRestaurant?.deliveryPermissions || {
      canAcceptCash: true,
      maxActiveOrders: 3,
      autoAssignZone: true,
      gpsSpeedTracking: true,
      allowedZones: ['San Isidro', 'Miraflores']
    }
  );

  const [customerSettings, setCustomerSettings] = useState<CustomerAccessSettings>(
    currentRestaurant?.customerAccessSettings || {
      qrOrderingEnabled: true,
      guestCheckout: true,
      allowCashAtTable: true,
      vipDiscountPercent: 10,
      maxOrderAmount: 500,
      welcomeMessage: '¡Bienvenidos!',
      wifiPassword: 'WifiPassword123'
    }
  );

  // --- State for Weekly Schedules, Shifts, and Tables ---
  const [scheduleState, setScheduleState] = useState<DaySchedule[]>(
    currentRestaurant?.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE
  );

  const [shiftsState, setShiftsState] = useState<StaffShift[]>(
    currentRestaurant?.shifts || (currentRestaurant ? generateShiftsForRestaurant(currentRestaurant.id) : [])
  );

  const [tablesState, setTablesState] = useState<RestaurantTable[]>(
    currentRestaurant?.tables || (currentRestaurant ? generateTablesForRestaurant(currentRestaurant.id) : [])
  );

  // Modals for Tables & QR & Shifts
  const [selectedTableForQr, setSelectedTableForQr] = useState<RestaurantTable | null>(null);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [isCreatingShift, setIsCreatingShift] = useState(false);

  // New Table form state
  const [newTableName, setNewTableName] = useState('');
  const [newTableNumber, setNewTableNumber] = useState<number>(1);
  const [newTableZone, setNewTableZone] = useState<TableZone>('SALON');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);
  const [newTableWaiters, setNewTableWaiters] = useState<string[]>([]);
  const [newTableNotes, setNewTableNotes] = useState<string>('');

  // New Shift form state
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftRole, setNewShiftRole] = useState<'WAITER' | 'DELIVERY' | 'ALL'>('WAITER');
  const [newShiftStart, setNewShiftStart] = useState('11:00');
  const [newShiftEnd, setNewShiftEnd] = useState('16:30');
  const [newShiftDays, setNewShiftDays] = useState<string[]>(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
  const [newShiftUsers, setNewShiftUsers] = useState<string[]>([]);

  // --- Modal: Crear Restaurante para el Dueño ---
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);
  const [newRestName, setNewRestName] = useState('');
  const [newRestTagline, setNewRestTagline] = useState('');
  const [newRestCuisine, setNewRestCuisine] = useState('Pescados & Mariscos');
  const [newRestAddress, setNewRestAddress] = useState('Av. Costanera 1420, San Miguel');
  const [newRestPhone, setNewRestPhone] = useState('+51 987 112 233');
  const [newRestSlug, setNewRestSlug] = useState('');
  const [newRestTemplateId, setNewRestTemplateId] = useState('tmpl-marine');
  const [restError, setRestError] = useState<string | null>(null);

  // --- Modal: Crear Usuario (Mesero, Repartidor, Cliente, Cocina) ---
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState<'WAITER' | 'DELIVERY' | 'CUSTOMER' | 'KITCHEN'>('WAITER');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('+51 987 000 111');
  const [newUserDni, setNewUserDni] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('12345678');
  const [newUserRestId, setNewUserRestId] = useState<string>(ownedRestaurants[0]?.id || currentRestaurant?.id || '');
  const [newUserShift, setNewUserShift] = useState<'MANANA' | 'TARDE' | 'NOCHE' | 'COMPLETO'>('TARDE');
  const [newUserPin, setNewUserPin] = useState('1234');
  const [newUserKitchenStation, setNewUserKitchenStation] = useState('Parrilla & Brasas');
  const [newUserVehicle, setNewUserVehicle] = useState<'MOTO' | 'BICI' | 'AUTO'>('MOTO');
  const [newUserPlate, setNewUserPlate] = useState('MT-8822');
  const [newUserVipTier, setNewUserVipTier] = useState<'STANDARD' | 'SILVER' | 'GOLD' | 'BLACK_VIP'>('STANDARD');
  const [userError, setUserError] = useState<string | null>(null);

  // --- Modal: Editar Permisos de Usuario Existente ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserError, setEditUserError] = useState<string | null>(null);

  // Waiters assigned to this restaurant
  const assignedWaiters = currentRestaurant
    ? users.filter(u => u.role === 'WAITER' && (u.restaurantIds.includes(currentRestaurant.id) || u.restaurantIds.includes('all')))
    : [];
  
  // Kitchen staff assigned to this restaurant
  const assignedKitchen = currentRestaurant
    ? users.filter(u => u.role === 'KITCHEN' && (u.restaurantIds.includes(currentRestaurant.id) || u.restaurantIds.includes('all')))
    : [];

  // Delivery assigned to this restaurant
  const assignedRiders = currentRestaurant
    ? users.filter(u => u.role === 'DELIVERY' && (u.restaurantIds.includes(currentRestaurant.id) || u.restaurantIds.includes('all')))
    : [];

  // Customers (either assigned to this restaurant or global clients)
  const assignedCustomers = currentRestaurant
    ? users.filter(u => u.role === 'CUSTOMER' && (u.restaurantIds.includes(currentRestaurant.id) || u.restaurantIds.includes('all') || u.restaurantIds.length === 0))
    : [];

  // Save Kitchen Permissions
  const handleSaveKitchenPerms = () => {
    const updated: Restaurant = {
      ...currentRestaurant,
      kitchenPermissions: kitchenPerms
    };
    onUpdateRestaurant(updated);
    showToast('Permisos y configuración de Cocina / KDS actualizados.');
  };

  // Save Waiter Permissions
  const handleSaveWaiterPerms = () => {
    const updated: Restaurant = {
      ...currentRestaurant,
      waiterPermissions: waiterPerms
    };
    onUpdateRestaurant(updated);
    showToast('Permisos y accesos de meseros actualizados correctamente.');
  };

  // Save Delivery Permissions
  const handleSaveDeliveryPerms = () => {
    const updated: Restaurant = {
      ...currentRestaurant,
      deliveryPermissions: deliveryPerms
    };
    onUpdateRestaurant(updated);
    showToast('Accesos y reglas de reparto actualizados correctamente.');
  };

  // Save Customer Settings
  const handleSaveCustomerSettings = () => {
    const updated: Restaurant = {
      ...currentRestaurant,
      customerAccessSettings: customerSettings
    };
    onUpdateRestaurant(updated);
    showToast('Políticas de acceso para clientes y QR guardadas con éxito.');
  };

  // --- Schedule Handlers ---
  const handleSaveWeeklySchedule = () => {
    const updated: Restaurant = {
      ...currentRestaurant,
      weeklySchedule: scheduleState
    };
    onUpdateRestaurant(updated);
    showToast('Horarios semanales de atención guardados correctamente.');
  };

  const handleApplySchedulePreset = (presetType: 'standard' | 'copy_monday' | 'weekend_extended') => {
    if (presetType === 'copy_monday') {
      const monday = scheduleState.find(d => d.day === 'Lunes') || scheduleState[0];
      const copied = scheduleState.map(d => ({
        ...d,
        isOpen: monday.isOpen,
        openTime: monday.openTime,
        closeTime: monday.closeTime,
        notes: monday.notes
      }));
      setScheduleState(copied);
      showToast('Horario del Lunes replicado a toda la semana.');
    } else if (presetType === 'standard') {
      const standard: DaySchedule[] = scheduleState.map(d => ({
        ...d,
        isOpen: true,
        openTime: '12:00',
        closeTime: d.day === 'Viernes' || d.day === 'Sábado' ? '00:30' : '23:00',
        notes: d.day === 'Domingo' ? 'Almuerzos familiares' : 'Almuerzo y Cena'
      }));
      setScheduleState(standard);
      showToast('Preset estándar aplicado (12:00 - 23:00).');
    } else if (presetType === 'weekend_extended') {
      const extended: DaySchedule[] = scheduleState.map(d => ({
        ...d,
        isOpen: true,
        openTime: d.day === 'Sábado' || d.day === 'Domingo' ? '11:00' : '12:30',
        closeTime: d.day === 'Viernes' || d.day === 'Sábado' ? '02:00' : '23:30',
        notes: d.day === 'Viernes' || d.day === 'Sábado' ? 'Noche de música en vivo' : 'Servicio regular'
      }));
      setScheduleState(extended);
      showToast('Preset de fin de semana extendido aplicado.');
    }
  };

  // --- Shifts Handlers ---
  const handleSaveShifts = () => {
    const updated: Restaurant = {
      ...currentRestaurant,
      shifts: shiftsState
    };
    onUpdateRestaurant(updated);
    showToast('Turnos y cuadrillas de personal guardados correctamente.');
  };

  const handleCreateNewShift = () => {
    if (!newShiftName.trim()) {
      showToast('Ingresa un nombre para el turno.');
      return;
    }
    const newShift: StaffShift = {
      id: `shift-${currentRestaurant.id}-${Date.now()}`,
      restaurantId: currentRestaurant.id,
      name: newShiftName.trim(),
      startTime: newShiftStart,
      endTime: newShiftEnd,
      applicableDays: newShiftDays,
      roleTarget: newShiftRole,
      assignedUserIds: newShiftUsers,
      colorBadge: newShiftRole === 'WAITER' ? '#38BDF8' : newShiftRole === 'DELIVERY' ? '#F59E0B' : '#10B981'
    };
    const updatedShifts = [...shiftsState, newShift];
    setShiftsState(updatedShifts);
    setIsCreatingShift(false);
    setNewShiftName('');
    setNewShiftUsers([]);
    
    // Auto sync with parent
    onUpdateRestaurant({
      ...currentRestaurant,
      shifts: updatedShifts
    });
    showToast(`Turno "${newShift.name}" creado con éxito.`);
  };

  const handleSaveEditedShift = () => {
    if (!editingShift) return;
    const updatedShifts = shiftsState.map(s => s.id === editingShift.id ? editingShift : s);
    setShiftsState(updatedShifts);
    setEditingShift(null);
    onUpdateRestaurant({
      ...currentRestaurant,
      shifts: updatedShifts
    });
    showToast(`Turno "${editingShift.name}" actualizado.`);
  };

  const handleDeleteShift = (shiftId: string) => {
    const updatedShifts = shiftsState.filter(s => s.id !== shiftId);
    setShiftsState(updatedShifts);
    onUpdateRestaurant({
      ...currentRestaurant,
      shifts: updatedShifts
    });
    showToast('Turno eliminado correctamente.');
  };

  // --- Tables & QR Handlers ---
  const handleSaveTables = () => {
    const updated: Restaurant = {
      ...currentRestaurant,
      tables: tablesState,
      totalTablesCount: tablesState.length
    };
    onUpdateRestaurant(updated);
    showToast(`Configuración de ${tablesState.length} mesas y QR guardada.`);
  };

  const handleBatchGenerateTables = (count: number) => {
    const waiterIds = assignedWaiters.map(w => w.id);
    const generated = generateTablesForRestaurant(currentRestaurant.id, count, waiterIds);
    setTablesState(generated);
    onUpdateRestaurant({
      ...currentRestaurant,
      tables: generated,
      totalTablesCount: generated.length
    });
    showToast(`Se han configurado y generado ${count} mesas.`);
  };

  const handleCreateNewTable = () => {
    const num = newTableNumber || (tablesState.length + 1);
    const formattedNum = num < 10 ? `0${num}` : `${num}`;
    const name = newTableName.trim() || `Mesa ${formattedNum}`;
    
    const newTable: RestaurantTable = {
      id: `tbl-${currentRestaurant.id}-${num}-${Date.now()}`,
      restaurantId: currentRestaurant.id,
      number: num,
      name,
      zone: newTableZone,
      capacity: newTableCapacity,
      status: 'AVAILABLE',
      assignedWaiterIds: newTableWaiters,
      qrCodeParam: `${num}`,
      notes: newTableNotes.trim() || undefined
    };

    const updatedTables = [...tablesState, newTable].sort((a, b) => a.number - b.number);
    setTablesState(updatedTables);
    setIsCreatingTable(false);
    setNewTableName('');
    setNewTableWaiters([]);
    setNewTableNotes('');

    onUpdateRestaurant({
      ...currentRestaurant,
      tables: updatedTables,
      totalTablesCount: updatedTables.length
    });
    showToast(`Mesa "${name}" agregada con código QR listo.`);
  };

  const handleSaveEditedTable = () => {
    if (!editingTable) return;
    const updatedTables = tablesState.map(t => t.id === editingTable.id ? editingTable : t);
    setTablesState(updatedTables);
    setEditingTable(null);

    onUpdateRestaurant({
      ...currentRestaurant,
      tables: updatedTables,
      totalTablesCount: updatedTables.length
    });
    showToast(`Mesa "${editingTable.name}" actualizada con éxito.`);
  };

  const handleDeleteTable = (tableId: string) => {
    const updatedTables = tablesState.filter(t => t.id !== tableId);
    setTablesState(updatedTables);
    onUpdateRestaurant({
      ...currentRestaurant,
      tables: updatedTables,
      totalTablesCount: updatedTables.length
    });
    showToast('Mesa eliminada del restaurante.');
  };

  // Change Template for this Restaurant
  const handleSelectTemplate = (templateId: string) => {
    const updated: Restaurant = {
      ...currentRestaurant,
      templateId
    };
    onUpdateRestaurant(updated);
    showToast(`Plantilla de Carta cambiada a ${templates.find(t => t.id === templateId)?.name}.`);
  };

  // Create Restaurant for Owner
  const handleCreateRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    setRestError(null);

    const cleanSlug = (newRestSlug || newRestName)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    if (restaurants.some(r => r.slug === cleanSlug)) {
      setRestError(`Ya existe un restaurante con el slug /${cleanSlug}. Por favor elige otro.`);
      return;
    }

    const newId = `rest-${Date.now()}`;
    const newRest: Restaurant = {
      id: newId,
      name: newRestName.trim(),
      slug: cleanSlug,
      tagline: newRestTagline.trim() || 'Gastronomía de Autor & Excelencia',
      cuisineType: newRestCuisine,
      address: newRestAddress.trim(),
      phone: newRestPhone.trim(),
      rating: 4.9,
      reviewCount: 1,
      coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
      isOpen: true,
      templateId: newRestTemplateId,
      ownerId: currentOwner.id,
      branding: {
        primaryColor: '#0EA5E9',
        secondaryColor: '#38BDF8',
        accentColor: '#F59E0B',
        darkBgColor: '#0B1528',
        cardBgColor: '#132238',
        textColor: '#F0F9FF',
        fontDisplay: 'Playfair Display, serif',
      },
      metrics: {
        dailyRevenue: 0,
        activeOrders: 0,
        avgTicket: 45,
        customerRating: 4.9,
        totalTables: 12,
        occupancyRate: 0,
      },
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
        stationFilter: 'Todas las estaciones'
      },
      deliveryPermissions: {
        canAcceptCash: true,
        maxActiveOrders: 3,
        autoAssignZone: true,
        gpsSpeedTracking: true,
        allowedZones: ['Miraflores', 'San Isidro']
      },
      customerAccessSettings: {
        qrOrderingEnabled: true,
        guestCheckout: true,
        allowCashAtTable: true,
        vipDiscountPercent: 10,
        maxOrderAmount: 600,
        welcomeMessage: `¡Bienvenidos a ${newRestName}!`,
        wifiPassword: 'CostaMarinaWifi'
      }
    };

    if (onAddRestaurant) {
      onAddRestaurant(newRest);
    } else {
      onUpdateRestaurant(newRest);
    }

    if (onUpdateUser && currentOwner) {
      const updatedOwner: User = {
        ...currentOwner,
        restaurantIds: [...currentOwner.restaurantIds, newId]
      };
      onUpdateUser(updatedOwner);
    }

    setSelectedRestId(newId);
    setIsCreatingRestaurant(false);
    setNewRestName('');
    setNewRestTagline('');
    setNewRestSlug('');
    showToast(`¡Restaurante "${newRest.name}" creado y asignado a tu cuenta de Dueño!`);
  };

  // Create User by Owner (Waiter, Delivery, Customer)
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);

    const cleanDni = newUserDni.trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      setUserError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    if (users.some(u => u.dni === cleanDni)) {
      setUserError(`El DNI ${cleanDni} ya está registrado por otro usuario en el sistema. El DNI debe ser único.`);
      return;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim() || `${cleanDni}@costamarina.com`,
      phone: newUserPhone.trim(),
      role: newUserRole,
      status: 'active',
      avatar: newUserRole === 'WAITER' 
        ? 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80'
        : newUserRole === 'KITCHEN'
        ? 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80'
        : newUserRole === 'DELIVERY'
        ? 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      restaurantIds: [newUserRestId],
      dni: cleanDni,
      password: newUserPassword.trim() || '12345678',
      lastActive: 'Hace un momento',
      createdByOwnerId: currentOwner.id,
      assignedShift: (newUserRole === 'WAITER' || newUserRole === 'KITCHEN') ? newUserShift : undefined,
      pinCode: (newUserRole === 'WAITER' || newUserRole === 'KITCHEN') ? newUserPin : undefined,
      kitchenStation: newUserRole === 'KITCHEN' ? newUserKitchenStation : undefined,
      kitchenPermissions: newUserRole === 'KITCHEN' ? kitchenPerms : undefined,
      vehicleType: newUserRole === 'DELIVERY' ? newUserVehicle : undefined,
      licensePlate: newUserRole === 'DELIVERY' ? newUserPlate : undefined,
      vipTier: newUserRole === 'CUSTOMER' ? newUserVipTier : undefined,
      creditBalance: newUserRole === 'CUSTOMER' ? 0 : undefined,
    };

    if (onAddUser) {
      onAddUser(newUser);
    }
    setIsCreatingUser(false);
    setNewUserName('');
    setNewUserDni('');
    setNewUserEmail('');
    showToast(`Usuario ${newUser.name} (${newUser.role}) creado con DNI ${cleanDni} y clave 12345678.`);
  };

  // Save Edited User Permissions
  const handleSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserError(null);

    const cleanDni = (editingUser.dni || '').trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      setEditUserError('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    if (users.some(u => u.id !== editingUser.id && u.dni === cleanDni)) {
      setEditUserError(`El DNI ${cleanDni} ya está en uso por otro usuario.`);
      return;
    }

    if (onUpdateUser) {
      onUpdateUser({
        ...editingUser,
        dni: cleanDni,
        password: editingUser.password || '12345678'
      });
    }
    setEditingUser(null);
    showToast(`Accesos y permisos de ${editingUser.name} actualizados.`);
  };

  return (
    <div className="space-y-6 pb-28">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950 text-emerald-200 border border-emerald-700 shadow-2xl animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-black font-bold">
              PORTAL DE DUEÑOS
            </span>
            <span className="text-xs text-neutral-400 font-mono">Control de Franquicia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Gestión de Mis Restaurantes y Accesos
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {isOwnerLogged 
              ? `Bienvenido, ${currentOwner.name}. Aquí puedes gestionar únicamente tus sedes creadas o asignadas y personalizar tu carta.`
              : 'Administra tus locales, personal de salón, repartidores, accesos de clientes QR y diseña tu carta digital.'
            }
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Active Owner display */}
          {isOwnerLogged ? (
            <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-[11px] text-neutral-400">Dueño Activo:</span>
              <span className="text-xs text-amber-400 font-bold">{currentOwner.name}</span>
              <span className="text-[10px] text-neutral-400 font-mono">({currentOwner.dni})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-[11px] text-neutral-400">Ver como Dueño:</span>
              <select
                value={selectedOwnerId}
                onChange={(e) => {
                  setSelectedOwnerId(e.target.value);
                  const firstRest = restaurants.find(r => r.ownerId === e.target.value || users.find(u => u.id === e.target.value)?.restaurantIds.includes(r.id));
                  if (firstRest) handleSelectRestaurant(firstRest.id);
                }}
                className="bg-transparent text-xs text-white font-bold cursor-pointer focus:outline-none"
              >
                {ownersList.map(o => (
                  <option key={o.id} value={o.id} className="bg-neutral-900 text-white">
                    {o.name} ({o.dni})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onSwitchToAdminView}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neutral-400" />
            <span>Volver a Admin</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. LISTA DE RESTAURANTES DEL DUEÑO                            */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Mis Restaurantes ({ownedRestaurants.length})
            </h2>
            <span className="text-xs text-neutral-400 hidden sm:inline">· Sedes creadas o asignadas a tu cuenta</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCreatingRestaurant(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Restaurante</span>
            </button>

            <button
              onClick={() => setIsCreatingUser(true)}
              disabled={ownedRestaurants.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Crear Personal / Cliente</span>
            </button>
          </div>
        </div>

        {ownedRestaurants.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 text-center flex flex-col items-center justify-center gap-3">
            <Store className="w-10 h-10 text-neutral-600" />
            <h3 className="text-sm font-bold text-white">No tienes restaurantes creados ni asignados</h3>
            <p className="text-xs text-neutral-400 max-w-md">
              Como propietario, puedes crear tu propio restaurante o solicitar al administrador que te asigne una sede existente.
            </p>
            <button
              onClick={() => setIsCreatingRestaurant(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Mi Primer Restaurante</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ownedRestaurants.map((rest) => {
              const isSelected = rest.id === currentRestaurant?.id;
              const assignedTemplate = templates.find(t => t.id === rest.templateId) || templates[0];

              return (
                <div
                  key={rest.id}
                  onClick={() => handleSelectRestaurant(rest.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 relative ${
                    isSelected 
                      ? 'bg-neutral-900/90 border-amber-400/80 ring-1 ring-amber-400/50 shadow-lg' 
                      : 'bg-neutral-900/40 hover:bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-400 text-black">
                      Gestionando
                    </span>
                  )}

                  <div className="flex items-start gap-3">
                    <img 
                      src={rest.logoUrl} 
                      alt={rest.name} 
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0" 
                    />
                    <div className="pr-16">
                      <h3 className="text-sm font-bold text-white leading-tight">{rest.name}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{rest.tagline}</p>
                      <span className="text-[11px] text-neutral-400 font-mono mt-1 block">
                        /r/{rest.slug}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-neutral-500 block">Plantilla</span>
                      <span className="text-amber-400 font-semibold">{assignedTemplate.badge}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCustomerPreview(rest);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-white hover:text-amber-400 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Carta</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PANEL DE EDICIÓN DE ACCESOS Y PLANTILLAS                   */}
      {/* ------------------------------------------------------------- */}
      {currentRestaurant && (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        
        {/* Restaurant Header Banner */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={currentRestaurant.logoUrl} 
              alt={currentRestaurant.name} 
              className="w-11 h-11 rounded-xl object-cover border border-neutral-700" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {currentRestaurant.name}
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  currentRestaurant.isOpen ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {currentRestaurant.isOpen ? 'Sede Abierta' : 'Sede Cerrada'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Configurando permisos y accesos para esta sede
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenCustomerPreview(currentRestaurant)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Previsualizar Carta de Este Local</span>
          </button>
        </div>

        {/* 8 Access Navigation SubTabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 border-b border-neutral-800 bg-neutral-950/30 text-[11px] sm:text-xs">
          <button
            onClick={() => setActiveSubTab('dishes')}
            className={`py-3 px-2 font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeSubTab === 'dishes'
                ? 'border-amber-400 text-white bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Carta & Platos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tables')}
            className={`py-3 px-2 font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeSubTab === 'tables'
                ? 'border-emerald-400 text-white bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Mesas ({tablesState.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schedules')}
            className={`py-3 px-2 font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeSubTab === 'schedules'
                ? 'border-sky-400 text-white bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <Clock className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">Horarios</span>
          </button>

          <button
            onClick={() => setActiveSubTab('shifts')}
            className={`py-3 px-2 font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeSubTab === 'shifts'
                ? 'border-amber-400 text-white bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Turnos ({shiftsState.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('kitchen')}
            className={`py-3 px-2 font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeSubTab === 'kitchen'
                ? 'border-orange-500 text-white bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="truncate">Cocina ({assignedKitchen.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('waiters')}
            className={`py-3 px-2 font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeSubTab === 'waiters'
                ? 'border-amber-400 text-white bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <ChefHat className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Mozos ({assignedWaiters.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('delivery')}
            className={`py-3 px-2 font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeSubTab === 'delivery'
                ? 'border-blue-400 text-white bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <Bike className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="truncate">Riders ({assignedRiders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('customers')}
            className={`py-3 px-2 font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeSubTab === 'customers'
                ? 'border-emerald-400 text-white bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Clientes & QR</span>
          </button>

          <button
            onClick={() => setActiveSubTab('templates')}
            className={`py-3 px-2 font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              activeSubTab === 'templates'
                ? 'border-purple-400 text-white bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <LayoutTemplate className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate">Plantillas</span>
          </button>
        </div>

        {/* ============================================================= */}
        {/* SUBTAB 0: CARTAS, PLATOS, FONDOS, ADICIONALES Y OBSERVACIONES */}
        {/* ============================================================= */}
        {activeSubTab === 'dishes' && (
          <div className="p-4 sm:p-6">
            <OwnerMenuEditor
              restaurant={currentRestaurant}
              categories={categories}
              items={menuItems}
              templates={templates}
              onUpdateRestaurant={onUpdateRestaurant}
              onAddMenuItem={onAddMenuItem || (() => {})}
              onUpdateMenuItem={onUpdateMenuItem || (() => {})}
              onDeleteMenuItem={onDeleteMenuItem || (() => {})}
              onAddCategory={onAddCategory || (() => {})}
              onUpdateCategory={onUpdateCategory || (() => {})}
              onDeleteCategory={onDeleteCategory || (() => {})}
              onOpenCustomerPreview={onOpenCustomerPreview}
            />
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB: MESAS Y CÓDIGOS QR                                   */}
        {/* ============================================================= */}
        {activeSubTab === 'tables' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span>Configuración de Mesas y Asignación de Mozos</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Define la cantidad de mesas físicas, sus capacidades y qué mozos atenderán cada una. Los clientes escanearán el QR de cada mesa para abrir la carta con el número asignado.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const nextNum = (tablesState.length > 0 ? Math.max(...tablesState.map(t => t.number)) : 0) + 1;
                    setNewTableNumber(nextNum);
                    setNewTableName(`Mesa ${nextNum < 10 ? '0' + nextNum : nextNum}`);
                    setNewTableZone('SALON');
                    setNewTableCapacity(4);
                    setNewTableWaiters([]);
                    setNewTableNotes('');
                    setIsCreatingTable(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Mesa</span>
                </button>

                <button
                  onClick={handleSaveTables}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition shadow cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Mesas</span>
                </button>
              </div>
            </div>

            {/* Quick Generator Toolbar */}
            <div className="p-4 rounded-xl bg-black/40 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-neutral-300">Generador Rápido de Cuadrícula:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Total de mesas:</span>
                {[6, 12, 18, 24].map(count => (
                  <button
                    key={count}
                    onClick={() => handleBatchGenerateTables(count)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                      tablesState.length === count 
                        ? 'bg-amber-400 text-black' 
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {count} mesas
                  </button>
                ))}
              </div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tablesState.map((tbl) => {
                const assignedStaff = users.filter(u => tbl.assignedWaiterIds?.includes(u.id));
                const zoneColor = 
                  tbl.zone === 'SALON' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  tbl.zone === 'TERRAZA' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  tbl.zone === 'VIP' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                  'bg-sky-500/20 text-sky-300 border-sky-500/30';

                return (
                  <div 
                    key={tbl.id} 
                    className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-mono font-bold text-white text-sm">
                            {tbl.number < 10 ? `0${tbl.number}` : tbl.number}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight">{tbl.name}</h4>
                            <span className="text-[10px] text-neutral-400">{tbl.capacity} personas</span>
                          </div>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${zoneColor}`}>
                          {tbl.zone}
                        </span>
                      </div>

                      {/* Notes if any */}
                      {tbl.notes && (
                        <p className="text-[11px] text-neutral-400 italic mb-2 line-clamp-1">
                          "{tbl.notes}"
                        </p>
                      )}

                      {/* Assigned Waiters */}
                      <div className="p-2 rounded-lg bg-black/40 border border-neutral-800/80 mb-2">
                        <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider mb-1">
                          Mozos Asignados:
                        </span>
                        {assignedStaff.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedStaff.map(waiter => (
                              <span 
                                key={waiter.id} 
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 font-medium"
                              >
                                <ChefHat className="w-3 h-3 text-amber-400" />
                                <span>{waiter.name.split(' ')[0]}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-500 italic">
                            Sin mozo asignado (Todos)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedTableForQr(tbl)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition cursor-pointer text-[11px] font-medium"
                          title="Ver e Imprimir Código QR"
                        >
                          <QrCode className="w-3 h-3 text-emerald-400" />
                          <span>QR</span>
                        </button>

                        <button
                          onClick={() => onOpenCustomerPreview(currentRestaurant, 'DINE_IN', `${tbl.number}`)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition cursor-pointer text-[11px] font-medium"
                          title="Probar Carta como Cliente en esta Mesa"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>Carta</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTable({ ...tbl })}
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
                          title="Editar Mesa y Asignación"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTable(tbl.id)}
                          className="p-1 rounded bg-neutral-800 hover:bg-red-950 hover:text-red-400 text-neutral-400 transition cursor-pointer"
                          title="Eliminar Mesa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB: HORARIOS SEMANALES                                   */}
        {/* ============================================================= */}
        {activeSubTab === 'schedules' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-400" />
                  <span>Horarios de Atención Semanales ({currentRestaurant.name})</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Configura los horarios de apertura y cierre de cada día de la semana. Los clientes y mozos verán estos horarios en la carta digital y en la cabecera.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveWeeklySchedule}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition shadow cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Horarios</span>
                </button>
              </div>
            </div>

            {/* Presets Toolbar */}
            <div className="p-4 rounded-xl bg-black/40 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs font-semibold text-neutral-300">Plantillas de Horario Rápidas:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleApplySchedulePreset('standard')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition cursor-pointer"
                >
                  Horario Estándar (12:00 - 23:00)
                </button>
                <button
                  onClick={() => handleApplySchedulePreset('copy_monday')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition cursor-pointer"
                >
                  Copiar Lunes a toda la semana
                </button>
                <button
                  onClick={() => handleApplySchedulePreset('weekend_extended')}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition cursor-pointer"
                >
                  Fin de Semana Extendido (02:00 am)
                </button>
              </div>
            </div>

            {/* Days Table List */}
            <div className="space-y-2">
              {scheduleState.map((dayItem, idx) => (
                <div 
                  key={dayItem.day} 
                  className={`p-3.5 sm:p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    dayItem.isOpen 
                      ? 'bg-neutral-950/60 border-neutral-800' 
                      : 'bg-neutral-950/20 border-neutral-800/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <span className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-xs text-white">
                      {dayItem.day.slice(0, 2)}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{dayItem.day}</h4>
                      <span className={`text-[10px] font-semibold ${dayItem.isOpen ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {dayItem.isOpen ? 'Atención Abierta' : 'Cerrado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                      <input
                        type="checkbox"
                        checked={dayItem.isOpen}
                        onChange={(e) => {
                          const updated = [...scheduleState];
                          updated[idx] = { ...updated[idx], isOpen: e.target.checked };
                          setScheduleState(updated);
                        }}
                        className="w-4 h-4 rounded text-sky-500 focus:ring-0 border-neutral-700 bg-neutral-900 cursor-pointer"
                      />
                      <span>{dayItem.isOpen ? 'Habilitado' : 'Deshabilitado'}</span>
                    </label>

                    {dayItem.isOpen && (
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-neutral-400">Apertura:</span>
                          <input
                            type="time"
                            value={dayItem.openTime}
                            onChange={(e) => {
                              const updated = [...scheduleState];
                              updated[idx] = { ...updated[idx], openTime: e.target.value };
                              setScheduleState(updated);
                            }}
                            className="px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-xs font-mono text-white"
                          />
                        </div>

                        <span className="text-neutral-500">—</span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-neutral-400">Cierre:</span>
                          <input
                            type="time"
                            value={dayItem.closeTime}
                            onChange={(e) => {
                              const updated = [...scheduleState];
                              updated[idx] = { ...updated[idx], closeTime: e.target.value };
                              setScheduleState(updated);
                            }}
                            className="px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-xs font-mono text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                          <span className="text-[11px] text-neutral-400">Nota:</span>
                          <input
                            type="text"
                            placeholder="Ej: Almuerzos y cenas, DJ en vivo..."
                            value={dayItem.notes || ''}
                            onChange={(e) => {
                              const updated = [...scheduleState];
                              updated[idx] = { ...updated[idx], notes: e.target.value };
                              setScheduleState(updated);
                            }}
                            className="w-full px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB: TURNOS DE PERSONAL                                   */}
        {/* ============================================================= */}
        {activeSubTab === 'shifts' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>Turnos de Meseros y Repartidores ({currentRestaurant.name})</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Define los turnos operativos y asigna personal para la atención de salón y despacho de delivery.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setNewShiftName('');
                    setNewShiftRole('WAITER');
                    setNewShiftStart('11:00');
                    setNewShiftEnd('16:30');
                    setNewShiftDays(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
                    setNewShiftUsers([]);
                    setIsCreatingShift(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Nuevo Turno</span>
                </button>

                <button
                  onClick={handleSaveShifts}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition shadow cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Turnos</span>
                </button>
              </div>
            </div>

            {/* Shifts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shiftsState.map((shift) => {
                const assignedUsers = users.filter(u => shift.assignedUserIds?.includes(u.id));
                const roleBadge = 
                  shift.roleTarget === 'WAITER' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  shift.roleTarget === 'DELIVERY' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                return (
                  <div 
                    key={shift.id} 
                    className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white">
                            <Clock className="w-4 h-4 text-amber-400" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white">{shift.name}</h4>
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {shift.startTime} — {shift.endTime}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${roleBadge}`}>
                          {shift.roleTarget === 'WAITER' ? 'Salón / Mozos' : shift.roleTarget === 'DELIVERY' ? 'Delivery / Riders' : 'General'}
                        </span>
                      </div>

                      {/* Applicable Days */}
                      <div className="mb-3">
                        <span className="text-[10px] text-neutral-500 font-bold block mb-1">Días de Cobertura:</span>
                        <div className="flex flex-wrap gap-1">
                          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => {
                            const isIncluded = shift.applicableDays.includes(d);
                            return (
                              <span 
                                key={d} 
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  isIncluded 
                                    ? 'bg-neutral-800 text-neutral-200 border border-neutral-700' 
                                    : 'bg-neutral-950 text-neutral-600'
                                }`}
                              >
                                {d.slice(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Staff Assigned */}
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800/80">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-1.5">
                          Personal Asignado ({assignedUsers.length}):
                        </span>
                        {assignedUsers.length > 0 ? (
                          <div className="space-y-1">
                            {assignedUsers.map(u => (
                              <div key={u.id} className="flex items-center justify-between text-xs text-neutral-300">
                                <div className="flex items-center gap-2">
                                  {u.role === 'WAITER' ? <ChefHat className="w-3.5 h-3.5 text-amber-400" /> : <Bike className="w-3.5 h-3.5 text-blue-400" />}
                                  <span>{u.name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-neutral-500">DNI: {u.dni}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-500 italic">Sin colaboradores asignados a este turno</span>
                        )}
                      </div>
                    </div>

                    {/* Shift Actions */}
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingShift({ ...shift })}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 text-xs transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB: GESTIÓN DE COCINA & PANTALLAS KDS                     */}
        {/* ============================================================= */}
        {activeSubTab === 'kitchen' && (
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Gestión del Rol Cocina & Pantalla KDS ({currentRestaurant.name})</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Gestiona jefes de cocina, cocineros de partida, permisos de pase de salón y control de inventario de platos agotados (Lista 86).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setNewUserRole('KITCHEN');
                    setNewUserName('');
                    setNewUserDni('');
                    setNewUserEmail('');
                    setNewUserPhone('+51 988 000 222');
                    setNewUserKitchenStation('Parrilla & Carnes');
                    setNewUserShift('TARDE');
                    setIsCreatingUser(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Alta Personal Cocina</span>
                </button>

                <button
                  onClick={handleSaveKitchenPerms}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-xs font-bold transition shadow cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Configuración Cocina</span>
                </button>
              </div>
            </div>

            {/* Assigned Kitchen Staff Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Equipo de Cocina Asignado ({assignedKitchen.length})</span>
                </h4>
              </div>

              {assignedKitchen.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-neutral-800 text-center text-xs text-neutral-500">
                  <Flame className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
                  <p>No hay cocineros o jefes de cocina asignados a esta sede.</p>
                  <button
                    onClick={() => {
                      setNewUserRole('KITCHEN');
                      setIsCreatingUser(true);
                    }}
                    className="mt-2 text-orange-400 font-bold hover:underline cursor-pointer"
                  >
                    + Registrar primer personal de cocina
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {assignedKitchen.map((chef) => (
                    <div key={chef.id} className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={chef.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80'} 
                          alt={chef.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-neutral-700 shrink-0" 
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white">{chef.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-mono">
                              KDS
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
                            <span>DNI: <strong className="font-mono text-neutral-300">{chef.dni}</strong></span>
                            <span>•</span>
                            <span className="text-orange-300 font-medium">{chef.kitchenStation || 'Cocina General'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingUser(chef)}
                        className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 hover:border-white text-[11px] text-white font-medium transition cursor-pointer shrink-0"
                      >
                        Permisos
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Master Kitchen Permissions & Policies */}
            <div>
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
                <span>Políticas y Facultades del Rol Cocina</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* canMarkReady */}
                <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Marcar Platos Listos para Servir</div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Permite al personal de cocina cambiar el estado de platos a "Listo" y notificar automáticamente al mozo o pase de salón.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.canMarkReady}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, canMarkReady: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-orange-500 focus:ring-0 mt-1"
                  />
                </div>

                {/* canManageStockOut (Lista 86) */}
                <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Control de Lista 86 (Platos Agotados)</div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Faculta a cocina para agotar platos al instante cuando se terminan insumos, ocultándolos inmediatamente de las cartas QR.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.canManageStockOut}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, canManageStockOut: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-orange-500 focus:ring-0 mt-1"
                  />
                </div>

                {/* canRejectItems */}
                <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Observaciones y Ajustes con Salón</div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Permite solicitar rectificación o confirmación al mozo respecto a términos de cocción o alergias de la mesa.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.canRejectItems}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, canRejectItems: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-orange-500 focus:ring-0 mt-1"
                  />
                </div>

                {/* canReorderQueue */}
                <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Reordenar Cola de Comandas en Pantalla</div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Permite al Jefe de Cocina priorizar tickets por orden de llegada, marcha de entradas o cortes a punto.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.canReorderQueue}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, canReorderQueue: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-orange-500 focus:ring-0 mt-1"
                  />
                </div>

                {/* autoPrintTickets */}
                <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Recepción Inmediata en KDS</div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Las comandas generadas por clientes vía QR o mozos ingresan al instante a la pantalla de cocina sin retardo.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.autoPrintTickets}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, autoPrintTickets: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-orange-500 focus:ring-0 mt-1"
                  />
                </div>

                {/* soundAlerts */}
                <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Campana Acústica de Nueva Comanda</div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Emite un timbre sonoro en el dispositivo de cocina cada vez que ingresa un nuevo pedido de salón o delivery.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.soundAlerts}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, soundAlerts: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-orange-500 focus:ring-0 mt-1"
                  />
                </div>

              </div>
            </div>

            {/* Default Station Filter */}
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Estación Predeterminada del Local</span>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Filtro visual por defecto que se aplicará a la vista KDS para este restaurante.
                </span>
              </div>
              <select
                value={kitchenPerms.stationFilter || 'Todas las estaciones'}
                onChange={(e) => setKitchenPerms({ ...kitchenPerms, stationFilter: e.target.value })}
                className="px-3 py-1.5 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Todas las estaciones">Todas las estaciones</option>
                <option value="Parrilla & Carnes">Parrilla & Carnes</option>
                <option value="Cocina Caliente & Wok">Cocina Caliente & Wok</option>
                <option value="Barra Marina & Cebichería">Barra Marina & Cebichería</option>
                <option value="Plancha Smash & Frituras">Plancha Smash & Frituras</option>
              </select>
            </div>

          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB 1: ACCESOS DE MESEROS                                  */}
        {/* ============================================================= */}
        {activeSubTab === 'waiters' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Permisos Operativos del Personal de Salón ({currentRestaurant.name})
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Define qué acciones pueden realizar los mozos asignados a este restaurante sin requerir autorización de gerencia.
              </p>
            </div>

            {/* Waiter Switch List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Anular Platos y Comandas</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Permite al mozo dar de baja platos ya enviados a cocina sin clave de supervisor.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.canCancelOrders}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, canCancelOrders: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-amber-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Aplicar Cortesías y Descuentos</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Permite al mesero aplicar descuentos promocionales directamente en la cuenta.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.canApplyDiscounts}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, canApplyDiscounts: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-amber-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Reasignar Mesas y Juntar Cuentas</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Permite mover comensales entre mesas físicas o unir mesas para grupos grandes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.canAssignTables}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, canAssignTables: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-amber-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Dividir Cuentas (Split Bill)</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Habilita el cobro fraccionado por ítem o por comensal al momento del cierre.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.canSplitBills}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, canSplitBills: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-amber-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Exigir PIN de Supervisor para Modificaciones</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Bloquea cambios críticos si no se ingresa el código PIN del administrador.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.requireSupervisorPin}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, requireSupervisorPin: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-amber-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Límite de Mesas Simultáneas por Mozo</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Tope para garantizar un servicio ágil y sin cuellos de botella.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={waiterPerms.maxActiveTables}
                    onChange={(e) => setWaiterPerms({ ...waiterPerms, maxActiveTables: parseInt(e.target.value) || 5 })}
                    className="w-16 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-xs text-white font-mono text-center"
                  />
                  <span className="text-xs text-neutral-400">mesas</span>
                </div>
              </div>
            </div>

            {/* List of Assigned Waiters */}
            <div className="pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white block">
                  Meseros Registrados y Asignados a Esta Sede ({assignedWaiters.length}):
                </span>
                <button
                  onClick={() => {
                    setNewUserRole('WAITER');
                    setNewUserRestId(currentRestaurant.id);
                    setIsCreatingUser(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Mesero</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {assignedWaiters.map(waiter => (
                  <div key={waiter.id} className="p-3 rounded-lg bg-black/50 border border-neutral-800 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={waiter.avatar} alt={waiter.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white">{waiter.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-amber-300 border border-neutral-800">
                            DNI: {waiter.dni || 'No reg.'}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Turno: {waiter.assignedShift || 'TARDE'} · PIN: {waiter.pinCode || '1234'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingUser(waiter)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition cursor-pointer"
                      title="Editar Accesos y Permisos"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                onClick={handleSaveWaiterPerms}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer shadow"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Accesos de Meseros</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB 2: ACCESOS DE REPARTIDORES                             */}
        {/* ============================================================= */}
        {activeSubTab === 'delivery' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Reglas de Operación y Accesos de Reparto ({currentRestaurant.name})
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Configura los parámetros de seguridad, cobro y despacho para los motorizados de este local.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Permitir Cobro en Efectivo contra Entrega</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Habilita a los repartidores recibir dinero en mano y reportar cuadre en caja.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={deliveryPerms.canAcceptCash}
                  onChange={(e) => setDeliveryPerms({ ...deliveryPerms, canAcceptCash: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-blue-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Asignación Inteligente por Proximidad GPS</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Asigna automáticamente el pedido al rider más cercano al restaurante o al cliente.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={deliveryPerms.autoAssignZone}
                  onChange={(e) => setDeliveryPerms({ ...deliveryPerms, autoAssignZone: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-blue-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Telemetría y Control de Velocidad</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Envía avisos a gerencia si el motorizado excede límites de velocidad en ruta.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={deliveryPerms.gpsSpeedTracking}
                  onChange={(e) => setDeliveryPerms({ ...deliveryPerms, gpsSpeedTracking: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-blue-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Máximo de Pedidos Simultáneos por Rider</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Evita que un motorizado lleve más órdenes de las que puede entregar en caliente.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={deliveryPerms.maxActiveOrders}
                    onChange={(e) => setDeliveryPerms({ ...deliveryPerms, maxActiveOrders: parseInt(e.target.value) || 3 })}
                    className="w-16 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-xs text-white font-mono text-center"
                  />
                  <span className="text-xs text-neutral-400">pedidos</span>
                </div>
              </div>
            </div>

            {/* Allowed Delivery Zones */}
            <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 space-y-2">
              <span className="text-xs font-bold text-white block">Zonas de Cobertura Habilitadas:</span>
              <div className="flex flex-wrap gap-2">
                {['San Isidro', 'Miraflores', 'Barranco', 'Surco', 'San Borja', 'Jesús María', 'Magdalena', 'Lince', 'Breña', 'Centro de Lima'].map((zone) => {
                  const isZoneActive = deliveryPerms.allowedZones.includes(zone);
                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => {
                        const newZones = isZoneActive
                          ? deliveryPerms.allowedZones.filter(z => z !== zone)
                          : [...deliveryPerms.allowedZones, zone];
                        setDeliveryPerms({ ...deliveryPerms, allowedZones: newZones });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                        isZoneActive
                          ? 'bg-blue-950 text-blue-300 border-blue-700'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {isZoneActive ? `✓ ${zone}` : `+ ${zone}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of Assigned Delivery Personnel */}
            <div className="pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white block">
                  Repartidores Habilitados para {currentRestaurant.name} ({assignedRiders.length}):
                </span>
                <button
                  onClick={() => {
                    setNewUserRole('DELIVERY');
                    setNewUserRestId(currentRestaurant.id);
                    setIsCreatingUser(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Repartidor</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {assignedRiders.map(rider => (
                  <div key={rider.id} className="p-3 rounded-lg bg-black/50 border border-neutral-800 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={rider.avatar} alt={rider.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white">{rider.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-blue-300 border border-neutral-800">
                            DNI: {rider.dni || 'No reg.'}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {rider.vehicleType} · Placa: {rider.licensePlate || 'S/P'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingUser(rider)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition cursor-pointer"
                      title="Editar Accesos y Permisos"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                onClick={handleSaveDeliveryPerms}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer shadow"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Accesos de Repartidores</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB 3: ACCESOS DE CLIENTES & QR                            */}
        {/* ============================================================= */}
        {activeSubTab === 'customers' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Políticas de Autoservicio y Pedidos QR para Clientes ({currentRestaurant.name})
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Controla la experiencia que ven los comensales cuando escanean el código QR en la mesa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Habilitar Pedido Directo desde QR (Self-Ordering)</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Permite al cliente enviar platos directo a cocina desde su teléfono inteligente.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customerSettings.qrOrderingEnabled}
                  onChange={(e) => setCustomerSettings({ ...customerSettings, qrOrderingEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-emerald-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Permitir Comanda como Invitado (Sin Registro)</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Los comensales no están forzados a crear una cuenta ni dar contraseña para ordenar.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customerSettings.guestCheckout}
                  onChange={(e) => setCustomerSettings({ ...customerSettings, guestCheckout: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-emerald-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Permitir Pago en Efectivo Llamando al Mozo</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Muestra el botón "Pagar en efectivo" en el checkout digital de la carta.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customerSettings.allowCashAtTable}
                  onChange={(e) => setCustomerSettings({ ...customerSettings, allowCashAtTable: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 cursor-pointer text-emerald-500 focus:ring-0 mt-1"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">Descuento Automático Clientes VIP (%)</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Beneficio directo aplicado en la carta para comensales frecuentes reconocidos.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={customerSettings.vipDiscountPercent}
                    onChange={(e) => setCustomerSettings({ ...customerSettings, vipDiscountPercent: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-xs text-white font-mono text-center"
                  />
                  <span className="text-xs text-neutral-400">%</span>
                </div>
              </div>
            </div>

            {/* Custom Welcome Message and WiFi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Mensaje de Bienvenida en la Carta Digital
                </label>
                <input
                  type="text"
                  value={customerSettings.welcomeMessage}
                  onChange={(e) => setCustomerSettings({ ...customerSettings, welcomeMessage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Contraseña de WiFi del Local (Visible al cliente)
                </label>
                <div className="relative">
                  <Wifi className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerSettings.wifiPassword}
                    onChange={(e) => setCustomerSettings({ ...customerSettings, wifiPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>
            </div>

            {/* List of Registered Customers */}
            <div className="pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white block">
                  Clientes Registrados con Acceso al Portal y Carta ({assignedCustomers.length}):
                </span>
                <button
                  onClick={() => {
                    setNewUserRole('CUSTOMER');
                    setNewUserRestId(currentRestaurant.id);
                    setIsCreatingUser(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Cliente</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {assignedCustomers.map(customer => (
                  <div key={customer.id} className="p-3 rounded-lg bg-black/50 border border-neutral-800 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white">{customer.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-emerald-300 border border-neutral-800">
                            DNI: {customer.dni || 'No reg.'}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Nivel: {customer.vipTier || 'STANDARD'} · Saldo: S/ {customer.creditBalance || 0}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingUser(customer)}
                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition cursor-pointer"
                      title="Editar Accesos y Permisos"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                onClick={handleSaveCustomerSettings}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer shadow"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Accesos de Clientes & QR</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB 4: PLANTILLAS DE CARTAS PARA ESTE LOCAL                */}
        {/* ============================================================= */}
        {activeSubTab === 'templates' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Plantilla de Carta Digital Activa para {currentRestaurant.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Elige la plantilla de diseño oficial que verán los comensales al abrir la carta de esta sede.
                </p>
              </div>

              <button
                onClick={() => onOpenCustomerPreview(currentRestaurant)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white border border-neutral-700 transition cursor-pointer self-start sm:self-auto"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver Carta con esta Plantilla</span>
              </button>
            </div>

            {/* Template Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tmpl) => {
                const isCurrent = (currentRestaurant.templateId || 'tmpl-luxury') === tmpl.id;

                return (
                  <div
                    key={tmpl.id}
                    className={`rounded-xl border overflow-hidden transition flex flex-col justify-between ${
                      isCurrent
                        ? 'border-purple-500 ring-2 ring-purple-500/40 bg-neutral-900/90'
                        : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                    }`}
                  >
                    <div className="relative h-36 bg-black">
                      <img 
                        src={tmpl.thumbnailUrl} 
                        alt={tmpl.name} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                      
                      <div className="absolute top-2.5 left-2.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-black/80 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                          {tmpl.badge}
                        </span>
                      </div>

                      {isCurrent && (
                        <div className="absolute top-2.5 right-2.5">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-600 text-white shadow-lg">
                            ✓ Activa
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-2.5 left-3 right-3">
                        <h4 className="text-xs font-bold text-white leading-snug">
                          {tmpl.name}
                        </h4>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                      <p className="text-[11px] text-neutral-400 line-clamp-2">
                        {tmpl.description}
                      </p>

                      <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-400">
                          {tmpl.fontDisplay.split(',')[0]}
                        </span>

                        {isCurrent ? (
                          <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>En Uso</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectTemplate(tmpl.id)}
                            className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer"
                          >
                            Activar para este local
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CREAR NUEVO RESTAURANTE PARA EL DUEÑO                  */}
      {/* ============================================================= */}
      {isCreatingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Crear Nuevo Restaurante</h3>
              </div>
              <button
                onClick={() => setIsCreatingRestaurant(false)}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre del Restaurante *</label>
                <input
                  type="text"
                  placeholder="Ej: Costa Marina - Sede Miraflores"
                  value={newRestName}
                  onChange={(e) => setNewRestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Eslogan o Subtítulo</label>
                <input
                  type="text"
                  placeholder="Ej: Sabores del mar y tradición norteña"
                  value={newRestTagline}
                  onChange={(e) => setNewRestTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Dirección y Sede</label>
                <input
                  type="text"
                  placeholder="Av. Larco 1234, Miraflores, Lima"
                  value={newRestAddress}
                  onChange={(e) => setNewRestAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+51 987 654 321"
                  value={newRestPhone}
                  onChange={(e) => setNewRestPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Plantilla de Carta Inicial</label>
                <select
                  value={newRestTemplateId}
                  onChange={(e) => setNewRestTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.badge})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setIsCreatingRestaurant(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRestaurant}
                className="px-4 py-2 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition shadow"
              >
                Crear y Asignar a mi Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CREAR USUARIO (MESERO, REPARTIDOR, CLIENTE)             */}
      {/* ============================================================= */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Registrar Usuario para mis Sedes</h3>
              </div>
              <button
                onClick={() => setIsCreatingUser(false)}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Rol a Asignar *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'WAITER' | 'DELIVERY' | 'CUSTOMER' | 'KITCHEN')}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="KITCHEN">Cocina / Jefe de Partida / KDS</option>
                  <option value="WAITER">Mesero / Camarero</option>
                  <option value="DELIVERY">Repartidor / Motorizado</option>
                  <option value="CUSTOMER">Cliente Registrado</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Mendoza"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">DNI (8 dígitos) *</label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="12345678"
                    value={newUserDni}
                    onChange={(e) => setNewUserDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Identificador único</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Clave de Acceso *</label>
                  <input
                    type="text"
                    placeholder="12345678"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Por defecto: 12345678</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="carlos@ejemplo.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Asignar a Sede / Restaurante *</label>
                <select
                  value={newUserRestId}
                  onChange={(e) => setNewUserRestId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {ownedRestaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {newUserRole === 'KITCHEN' && (
                <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Estación de Cocina</label>
                    <select
                      value={newUserKitchenStation}
                      onChange={(e) => setNewUserKitchenStation(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <option value="Parrilla & Carnes">Parrilla & Carnes</option>
                      <option value="Cocina Caliente & Wok">Cocina Caliente & Wok</option>
                      <option value="Barra Marina & Cebichería">Barra Marina & Cebichería</option>
                      <option value="Plancha Smash & Frituras">Plancha Smash & Frituras</option>
                      <option value="Postres & Pastelería">Postres & Pastelería</option>
                      <option value="Jefe de Cocina (Todas)">Jefe de Cocina (Todas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">PIN KDS (4 d.)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={newUserPin}
                      onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>
              )}

              {newUserRole === 'WAITER' && (
                <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Turno de Trabajo</label>
                    <select
                      value={newUserShift}
                      onChange={(e) => setNewUserShift(e.target.value as 'MAÑANA' | 'TARDE' | 'NOCHE')}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <option value="MAÑANA">Mañana (08:00 - 16:00)</option>
                      <option value="TARDE">Tarde (12:00 - 20:00)</option>
                      <option value="NOCHE">Noche (16:00 - 00:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">PIN Rápido (4 d.)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={newUserPin}
                      onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>
              )}

              {newUserRole === 'DELIVERY' && (
                <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Tipo de Vehículo</label>
                    <select
                      value={newUserVehicle}
                      onChange={(e) => setNewUserVehicle(e.target.value as 'MOTO' | 'BICICLETA' | 'AUTO')}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <option value="MOTO">Moto Lineal</option>
                      <option value="BICICLETA">Bicicleta / Eléctrica</option>
                      <option value="AUTO">Automóvil</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Placa de Rodaje</label>
                    <input
                      type="text"
                      placeholder="Ej: 5432-1A"
                      value={newUserPlate}
                      onChange={(e) => setNewUserPlate(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}

              {newUserRole === 'CUSTOMER' && (
                <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Categoría VIP del Cliente</label>
                  <select
                    value={newUserVipTier}
                    onChange={(e) => setNewUserVipTier(e.target.value as 'STANDARD' | 'SILVER' | 'GOLD' | 'BLACK_VIP')}
                    className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="SILVER">Silver (5% desc.)</option>
                    <option value="GOLD">Gold (10% desc.)</option>
                    <option value="BLACK_VIP">Black VIP (15% desc.)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setIsCreatingUser(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition shadow"
              >
                Registrar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: EDITAR ACCESOS Y PERMISOS DE USUARIO ASIGNADO          */}
      {/* ============================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Editar Accesos y Permisos</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/50 border border-neutral-800">
              <img src={editingUser.avatar} alt={editingUser.name} className="w-11 h-11 rounded-lg object-cover" />
              <div>
                <div className="text-sm font-bold text-white">{editingUser.name}</div>
                <div className="text-xs text-neutral-400 font-mono">Rol: {editingUser.role}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">DNI (8 dígitos) *</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={editingUser.dni || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Clave de Acceso *</label>
                  <input
                    type="text"
                    value={editingUser.password || '12345678'}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Reasignar a Sede / Restaurante</label>
                <select
                  value={editingUser.restaurantId || currentRestaurant.id}
                  onChange={(e) => setEditingUser({ ...editingUser, restaurantId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {ownedRestaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {editingUser.role === 'WAITER' && (
                <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Turno</label>
                    <select
                      value={editingUser.assignedShift || 'TARDE'}
                      onChange={(e) => setEditingUser({ ...editingUser, assignedShift: e.target.value as 'MAÑANA' | 'TARDE' | 'NOCHE' })}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <option value="MAÑANA">Mañana</option>
                      <option value="TARDE">Tarde</option>
                      <option value="NOCHE">Noche</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">PIN</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={editingUser.pinCode || '1234'}
                      onChange={(e) => setEditingUser({ ...editingUser, pinCode: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>
              )}

              {editingUser.role === 'DELIVERY' && (
                <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Vehículo</label>
                    <select
                      value={editingUser.vehicleType || 'MOTO'}
                      onChange={(e) => setEditingUser({ ...editingUser, vehicleType: e.target.value as 'MOTO' | 'BICICLETA' | 'AUTO' })}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <option value="MOTO">Moto</option>
                      <option value="BICICLETA">Bicicleta</option>
                      <option value="AUTO">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Placa</label>
                    <input
                      type="text"
                      value={editingUser.licensePlate || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, licensePlate: e.target.value.toUpperCase() })}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}

              {editingUser.role === 'CUSTOMER' && (
                <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Nivel VIP</label>
                  <select
                    value={editingUser.vipTier || 'STANDARD'}
                    onChange={(e) => setEditingUser({ ...editingUser, vipTier: e.target.value as 'STANDARD' | 'SILVER' | 'GOLD' | 'BLACK_VIP' })}
                    className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="BLACK_VIP">Black VIP</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedUser}
                className="px-4 py-2 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition shadow"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: QR CODE DE MESA                                        */}
      {/* ============================================================= */}
      {selectedTableForQr && (
        <TableQrModal
          isOpen={!!selectedTableForQr}
          onClose={() => setSelectedTableForQr(null)}
          restaurant={currentRestaurant}
          table={selectedTableForQr}
          onTestTableMenu={(rest, tableNum) => {
            setSelectedTableForQr(null);
            onOpenCustomerPreview(rest, 'DINE_IN', tableNum);
          }}
        />
      )}

      {/* ============================================================= */}
      {/* MODAL: CREAR NUEVA MESA                                       */}
      {/* ============================================================= */}
      {isCreatingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Agregar Nueva Mesa</h3>
              </div>
              <button 
                onClick={() => setIsCreatingTable(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Número de Mesa</label>
                  <input
                    type="number"
                    min={1}
                    value={newTableNumber}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setNewTableNumber(val);
                      if (!newTableName || newTableName.startsWith('Mesa')) {
                        setNewTableName(`Mesa ${val < 10 ? '0' + val : val}`);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Capacidad (Personas)</label>
                  <select
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                  >
                    <option value={2}>2 personas</option>
                    <option value={4}>4 personas</option>
                    <option value={6}>6 personas</option>
                    <option value={8}>8 personas</option>
                    <option value={10}>10+ personas (Box)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre Visual de la Mesa</label>
                <input
                  type="text"
                  placeholder="Ej: Mesa 01, Terraza A, Box VIP"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Zona del Local</label>
                <select
                  value={newTableZone}
                  onChange={(e) => setNewTableZone(e.target.value as TableZone)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                >
                  <option value="SALON">Salón Principal</option>
                  <option value="TERRAZA">Terraza Exterior</option>
                  <option value="VIP">Box Privado / VIP</option>
                  <option value="BARRA">Barra / Mostrador</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Notas de Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej: Al costado de la ventana, cerca a cocina"
                  value={newTableNotes}
                  onChange={(e) => setNewTableNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                />
              </div>

              {/* Waiter Multi-select */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Asignar Mozos Responsables:
                </label>
                <div className="p-3 rounded-lg bg-black/40 border border-neutral-800 max-h-36 overflow-y-auto space-y-1.5">
                  {assignedWaiters.length > 0 ? (
                    assignedWaiters.map(waiter => {
                      const isSelected = newTableWaiters.includes(waiter.id);
                      return (
                        <label 
                          key={waiter.id} 
                          className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-800/60 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTableWaiters([...newTableWaiters, waiter.id]);
                                } else {
                                  setNewTableWaiters(newTableWaiters.filter(id => id !== waiter.id));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-0 border-neutral-700"
                            />
                            <span className="text-white font-medium">{waiter.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">DNI: {waiter.dni}</span>
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-xs text-neutral-500 italic block text-center py-2">
                      No hay mozos asignados a este restaurante.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setIsCreatingTable(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewTable}
                className="px-4 py-2 rounded-lg bg-emerald-400 text-black hover:bg-emerald-300 text-xs font-bold transition shadow"
              >
                Crear Mesa & Generar QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: EDITAR MESA EXISTENTE                                  */}
      {/* ============================================================= */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Editar Mesa {editingTable.name}</h3>
              </div>
              <button 
                onClick={() => setEditingTable(null)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Número de Mesa</label>
                  <input
                    type="number"
                    min={1}
                    value={editingTable.number}
                    onChange={(e) => setEditingTable({ ...editingTable, number: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Capacidad</label>
                  <select
                    value={editingTable.capacity}
                    onChange={(e) => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) || 4 })}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                  >
                    <option value={2}>2 personas</option>
                    <option value={4}>4 personas</option>
                    <option value={6}>6 personas</option>
                    <option value={8}>8 personas</option>
                    <option value={10}>10+ personas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre Visual</label>
                <input
                  type="text"
                  value={editingTable.name}
                  onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Zona</label>
                <select
                  value={editingTable.zone}
                  onChange={(e) => setEditingTable({ ...editingTable, zone: e.target.value as TableZone })}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                >
                  <option value="SALON">Salón Principal</option>
                  <option value="TERRAZA">Terraza Exterior</option>
                  <option value="VIP">Box Privado / VIP</option>
                  <option value="BARRA">Barra / Mostrador</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Notas</label>
                <input
                  type="text"
                  value={editingTable.notes || ''}
                  onChange={(e) => setEditingTable({ ...editingTable, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                />
              </div>

              {/* Waiters assignment */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Mozos Asignados:
                </label>
                <div className="p-3 rounded-lg bg-black/40 border border-neutral-800 max-h-36 overflow-y-auto space-y-1.5">
                  {assignedWaiters.length > 0 ? (
                    assignedWaiters.map(waiter => {
                      const isSelected = editingTable.assignedWaiterIds?.includes(waiter.id);
                      return (
                        <label 
                          key={waiter.id} 
                          className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-800/60 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const current = editingTable.assignedWaiterIds || [];
                                if (e.target.checked) {
                                  setEditingTable({ ...editingTable, assignedWaiterIds: [...current, waiter.id] });
                                } else {
                                  setEditingTable({ ...editingTable, assignedWaiterIds: current.filter(id => id !== waiter.id) });
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 border-neutral-700"
                            />
                            <span className="text-white font-medium">{waiter.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">DNI: {waiter.dni}</span>
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-xs text-neutral-500 italic block text-center py-2">
                      No hay mozos registrados en esta sede.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setEditingTable(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedTable}
                className="px-4 py-2 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition shadow"
              >
                Guardar Cambios de Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CREAR NUEVO TURNO                                      */}
      {/* ============================================================= */}
      {isCreatingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Crear Nuevo Turno</h3>
              </div>
              <button 
                onClick={() => setIsCreatingShift(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre del Turno</label>
                <input
                  type="text"
                  placeholder="Ej: Turno Mañana Salón, Turno Noche Delivery"
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Rol de Personal</label>
                <select
                  value={newShiftRole}
                  onChange={(e) => setNewShiftRole(e.target.value as 'WAITER' | 'DELIVERY' | 'ALL')}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                >
                  <option value="WAITER">Meseros / Personal de Salón</option>
                  <option value="DELIVERY">Repartidores / Delivery</option>
                  <option value="ALL">Todo el Personal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Applicable Days */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Días Aplicables</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => {
                    const isSelected = newShiftDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          if (isSelected) {
                            setNewShiftDays(newShiftDays.filter(d => d !== day));
                          } else {
                            setNewShiftDays([...newShiftDays, day]);
                          }
                        }}
                        className={`px-2 py-1.5 rounded text-[11px] font-medium transition cursor-pointer border ${
                          isSelected 
                            ? 'bg-amber-400 text-black border-amber-300 font-bold' 
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign Users */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Asignar Colaboradores:</label>
                <div className="p-3 rounded-lg bg-black/40 border border-neutral-800 max-h-36 overflow-y-auto space-y-1.5">
                  {users
                    .filter(u => 
                      (newShiftRole === 'ALL' || u.role === newShiftRole) &&
                      (u.restaurantIds.includes(currentRestaurant.id) || u.restaurantIds.includes('all'))
                    )
                    .map(u => {
                      const isSelected = newShiftUsers.includes(u.id);
                      return (
                        <label 
                          key={u.id} 
                          className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-800/60 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewShiftUsers([...newShiftUsers, u.id]);
                                } else {
                                  setNewShiftUsers(newShiftUsers.filter(id => id !== u.id));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 border-neutral-700"
                            />
                            <span className="text-white font-medium">{u.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">DNI: {u.dni}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setIsCreatingShift(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewShift}
                className="px-4 py-2 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition shadow"
              >
                Crear Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: EDITAR TURNO EXISTENTE                                 */}
      {/* ============================================================= */}
      {editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Editar {editingShift.name}</h3>
              </div>
              <button 
                onClick={() => setEditingShift(null)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre del Turno</label>
                <input
                  type="text"
                  value={editingShift.name}
                  onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Rol de Personal</label>
                <select
                  value={editingShift.roleTarget}
                  onChange={(e) => setEditingShift({ ...editingShift, roleTarget: e.target.value as 'WAITER' | 'DELIVERY' | 'ALL' })}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs text-white"
                >
                  <option value="WAITER">Meseros / Personal de Salón</option>
                  <option value="DELIVERY">Repartidores / Delivery</option>
                  <option value="ALL">Todo el Personal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={editingShift.startTime}
                    onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={editingShift.endTime}
                    onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-700 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Applicable Days */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Días Aplicables</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => {
                    const isSelected = editingShift.applicableDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          const current = editingShift.applicableDays;
                          if (isSelected) {
                            setEditingShift({ ...editingShift, applicableDays: current.filter(d => d !== day) });
                          } else {
                            setEditingShift({ ...editingShift, applicableDays: [...current, day] });
                          }
                        }}
                        className={`px-2 py-1.5 rounded text-[11px] font-medium transition cursor-pointer border ${
                          isSelected 
                            ? 'bg-amber-400 text-black border-amber-300 font-bold' 
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign Users */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Asignar Colaboradores:</label>
                <div className="p-3 rounded-lg bg-black/40 border border-neutral-800 max-h-36 overflow-y-auto space-y-1.5">
                  {users
                    .filter(u => 
                      (editingShift.roleTarget === 'ALL' || u.role === editingShift.roleTarget) &&
                      (u.restaurantIds.includes(currentRestaurant.id) || u.restaurantIds.includes('all'))
                    )
                    .map(u => {
                      const isSelected = editingShift.assignedUserIds?.includes(u.id);
                      return (
                        <label 
                          key={u.id} 
                          className="flex items-center justify-between p-1.5 rounded hover:bg-neutral-800/60 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const current = editingShift.assignedUserIds || [];
                                if (e.target.checked) {
                                  setEditingShift({ ...editingShift, assignedUserIds: [...current, u.id] });
                                } else {
                                  setEditingShift({ ...editingShift, assignedUserIds: current.filter(id => id !== u.id) });
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 border-neutral-700"
                            />
                            <span className="text-white font-medium">{u.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">DNI: {u.dni}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setEditingShift(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedShift}
                className="px-4 py-2 rounded-lg bg-amber-400 text-black hover:bg-amber-300 text-xs font-bold transition shadow"
              >
                Guardar Turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

