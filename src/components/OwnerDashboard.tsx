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
  DayOfWeek,
  RestaurantTable,
  StaffShift,
  TableZone,
  DEFAULT_FALLBACK_RESTAURANT
} from '../types';
import { OwnerMenuEditor } from './OwnerMenuEditor';
import { TableQrModal } from './TableQrModal';
import { TemplateSplitEditor } from './TemplateSplitEditor';
import { EmptyRestaurantState } from './EmptyRestaurantState';
import { OwnerOrderDetailModal } from './OwnerOrderDetailModal';
import { getSafeActiveRestaurant, getSafeBranding, getSafeMenuAccessSettings, generateSlug } from '../utils/restaurantUtils';
import { DEFAULT_WEEKLY_SCHEDULE, generateTablesForRestaurant, generateShiftsForRestaurant } from '../data/mockData';
import { Order, OrderStatus } from '../types';

interface OwnerDashboardProps {
  currentUser?: User;
  restaurants: Restaurant[];
  selectedRestaurantId?: string;
  onSelectRestaurant?: (id: string) => void;
  activeSubTab?: AccessSubTab;
  onSelectSubTab?: (subtab: AccessSubTab) => void;
  users: User[];
  templates: MenuTemplate[];
  menuItems?: MenuItem[];
  categories?: MenuCategory[];
  orders?: any[];
  onUpdateOrderStatus?: (orderId: string, nextStatus: OrderStatus) => void;
  onUpdateRestaurant: (updated: Restaurant) => void;
  onAddRestaurant?: (newRestaurant: Restaurant) => void;
  onDeleteRestaurant?: (restaurantId: string) => void;
  onAddUser?: (newUser: User) => void;
  onUpdateUser?: (updatedUser: User) => void;
  onAddMenuItem?: (newItem: MenuItem) => void;
  onUpdateMenuItem?: (updatedItem: MenuItem) => void;
  onDeleteMenuItem?: (itemId: string) => void;
  onReorderMenuItems?: (newItems: MenuItem[]) => void;
  onAddCategory?: (newCategory: MenuCategory) => void;
  onUpdateCategory?: (updatedCategory: MenuCategory) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onReorderCategories?: (newCategories: MenuCategory[]) => void;
  onOpenCustomerPreview: (restaurant: Restaurant, mode?: 'DINE_IN' | 'DELIVERY', tableNumber?: string) => void;
  onPublishMenu?: (
    restaurantId: string,
    restaurant: Restaurant,
    categories: MenuCategory[],
    items: MenuItem[]
  ) => Promise<{ success: boolean; version?: number; publishedAt?: string } | void> | void;
  onSwitchToAdminView: () => void;
  onImportBackupJSON?: (
    data: { restaurants: Restaurant[]; categories: MenuCategory[]; items: MenuItem[] },
    mode?: 'MERGE' | 'REPLACE',
    targetRestaurantId?: string
  ) => void;
}

type AccessSubTab = 'dishes' | 'tables' | 'schedules' | 'shifts' | 'kitchen' | 'waiters' | 'delivery' | 'customers' | 'templates' | 'sales_monitor';

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentUser,
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  activeSubTab: externalActiveSubTab,
  onSelectSubTab: externalOnSelectSubTab,
  users,
  templates,
  menuItems = [],
  categories = [],
  orders = [],
  onUpdateOrderStatus,
  onUpdateRestaurant,
  onAddRestaurant,
  onDeleteRestaurant,
  onAddUser,
  onUpdateUser,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onReorderMenuItems,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  onOpenCustomerPreview,
  onPublishMenu,
  onSwitchToAdminView,
  onImportBackupJSON,
}) => {
  const isOwnerLogged = Boolean(currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER'));

  // Delete Restaurant Confirmation State
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null);

  // Find available owners
  const ownersList = (users || []).filter(u => u && u.role === 'OWNER');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(
    currentUser?.role === 'OWNER' ? currentUser.id : (ownersList[0]?.id || 'u-2')
  );

  const currentOwner = isOwnerLogged ? currentUser! : (ownersList.find(o => o && o.id === selectedOwnerId) || ownersList[0]);

  // Restaurants owned or manually assigned to this owner:
  const targetOwner = isOwnerLogged ? currentUser! : currentOwner;
  const ownedRestaurants = (restaurants || []).filter(r => {
    if (!r) return false;
    // Admin has global access
    if (currentUser?.role === 'ADMIN') return true;
    if (!targetOwner) return false;

    // Explicitly assigned via restaurantIds (only ADMIN can use 'all')
    const isAssigned = Array.isArray(targetOwner.restaurantIds) && (
      targetOwner.restaurantIds.includes(r.id) || (targetOwner.role === 'ADMIN' && targetOwner.restaurantIds.includes('all'))
    );
    // Explicit creator match
    const isCreator = Boolean(
      r.ownerId && (r.ownerId === targetOwner.id || (targetOwner.email && r.ownerId === targetOwner.email))
    );

    return isAssigned || isCreator;
  });

  // Selected Restaurant being managed
  const [selectedRestId, setSelectedRestId] = useState<string>(
    ownedRestaurants[0]?.id || ''
  );

  const currentRestaurant = getSafeActiveRestaurant(ownedRestaurants, selectedRestId) ?? (ownedRestaurants[0] || null);

  // Filter owned orders for Sales Monitor (resilient matching by ID, slug, or name)
  const activeRestaurantsList = currentUser?.role === 'ADMIN' ? (restaurants || []) : ownedRestaurants;
  const monitorOrders = (orders || []).filter(o => {
    if (!o) return false;
    if (currentUser?.role === 'ADMIN') return true;
    return activeRestaurantsList.some(r => 
      r && (
        r.id === o.restaurantId || 
        (r.slug && r.slug === o.restaurantId) || 
        (r.name && o.restaurantId && r.name.toLowerCase() === o.restaurantId.toLowerCase())
      )
    );
  });

  const activeOrders = monitorOrders.filter(o => o && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');

  // Selected Order for Full Detail & Management Modal
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  // Active subtab inside restaurant management
  const [internalActiveSubTab, setInternalActiveSubTab] = useState<AccessSubTab>('sales_monitor');
  const activeSubTab = externalActiveSubTab || internalActiveSubTab;
  const setActiveSubTab = (tab: AccessSubTab) => {
    setInternalActiveSubTab(tab);
    if (externalOnSelectSubTab) externalOnSelectSubTab(tab);
  };

  // Real-time sales and orders monitor mode
  const [monitorMode, setMonitorMode] = useState<'restaurant' | 'table' | 'waiter' | 'kitchen'>('restaurant');

  // Split-Screen Template Editor State
  const [isSplitEditorOpen, setIsSplitEditorOpen] = useState(false);

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

  // Sync selectedRestId if selectedRestaurantId prop changes from parent / RoleHeader
  useEffect(() => {
    if (selectedRestaurantId && selectedRestaurantId !== selectedRestId) {
      handleSelectRestaurant(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

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
    if (!currentRestaurant) return;
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
      applicableDays: newShiftDays as DayOfWeek[],
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
  const handleSaveGeneralInfo = (updatedRestaurant: Restaurant) => {
    const newSlug = generateSlug(updatedRestaurant.name);
    onUpdateRestaurant({
      ...updatedRestaurant,
      slug: newSlug
    });
  };

  const handleCreateRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    setRestError(null);

    const cleanName = newRestName.trim();
    if (!cleanName) {
      setRestError('El nombre del restaurante no puede estar vacío.');
      return;
    }

    if (restaurants.some(r => r.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      setRestError(`Ya existe un restaurante registrado con el nombre "${cleanName}". No pueden haber 2 restaurantes con el mismo nombre.`);
      return;
    }

    const cleanSlug = generateSlug(newRestSlug || newRestName);

    if (restaurants.some(r => r.slug === cleanSlug)) {
      setRestError(`Ya existe un restaurante con el slug /${cleanSlug}. Por favor elige otro.`);
      return;
    }

    const newId = `rest-${Date.now()}`;
    const newRest: Restaurant = {
      id: newId,
      name: cleanName,
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
      if (onAddCategory) {
        const defaultCat: MenuCategory = {
          id: `cat-${newId}-general`,
          restaurantId: newId,
          name: 'De la Casa',
          sortOrder: 1,
          isActive: true,
        };
        onAddCategory(defaultCat);
      }
      if (onUpdateUser && currentOwner) {
        const updatedOwner: User = {
          ...currentOwner,
          restaurantIds: [...(currentOwner.restaurantIds || []), newId]
        };
        onUpdateUser(updatedOwner);
      }
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
    <div className="space-y-2.5 sm:space-y-6 pb-28">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950 text-emerald-200 border border-emerald-700 shadow-2xl animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PANEL DE EDICIÓN DE ACCESOS Y PLANTILLAS                   */}
      {/* ------------------------------------------------------------- */}
      {currentRestaurant && (
      <div className="rounded-2xl sm:rounded-[32px] border border-neutral-200 bg-white shadow-sm overflow-hidden">
        
        {/* ============================================================= */}
        {/* SUBTAB 0: CARTAS, PLATOS, FONDOS, ADICIONALES Y OBSERVACIONES */}
        {/* ============================================================= */}
        {activeSubTab === 'dishes' && (
          <div className="p-2.5 sm:p-6">
            <OwnerMenuEditor
              restaurant={currentRestaurant}
              categories={categories}
              items={menuItems}
              templates={templates}
              onUpdateRestaurant={onUpdateRestaurant}
              onAddMenuItem={onAddMenuItem || (() => {})}
              onUpdateMenuItem={onUpdateMenuItem || (() => {})}
              onDeleteMenuItem={onDeleteMenuItem || (() => {})}
              onReorderMenuItems={onReorderMenuItems}
              onAddCategory={onAddCategory || (() => {})}
              onUpdateCategory={onUpdateCategory || (() => {})}
              onDeleteCategory={onDeleteCategory || (() => {})}
              onReorderCategories={onReorderCategories}
              onOpenCustomerPreview={onOpenCustomerPreview}
              onPublishMenu={onPublishMenu}
              onImportBackupJSON={onImportBackupJSON}
            />
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB: MESAS Y CÓDIGOS QR                                   */}
        {/* ============================================================= */}
        {activeSubTab === 'tables' && (
          <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-5">
            <div className="flex items-center justify-between gap-2 pb-2 sm:pb-4 border-b border-neutral-200">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-base font-bold text-neutral-900 flex items-center gap-1.5 truncate">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-900 shrink-0" />
                  <span className="truncate">Mesas y Mozos ({currentRestaurant.name})</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-1 mt-0.5">
                  Define mesas físicas, capacidades y mozos asignados.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  className="flex items-center justify-center gap-1 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-bold transition cursor-pointer shadow-sm"
                  title="Agregar Mesa"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Agregar Mesa</span>
                </button>

                <button
                  onClick={handleSaveTables}
                  className="flex items-center justify-center gap-1 p-2 sm:px-4 sm:py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold transition shadow-md cursor-pointer"
                  title="Guardar Mesas"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Guardar Mesas</span>
                </button>
              </div>
            </div>

            {/* Quick Generator Toolbar */}
            <div className="p-2 sm:p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
                <span className="text-xs font-bold text-neutral-800">Generador Rápido:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">Mesas:</span>
                {[6, 12, 18, 24].map(count => (
                  <button
                    key={count}
                    onClick={() => handleBatchGenerateTables(count)}
                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                      tablesState.length === count 
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' 
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 border-neutral-300'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
              {tablesState.map((tbl) => {
                const assignedStaff = users.filter(u => tbl.assignedWaiterIds?.includes(u.id));

                return (
                  <div 
                    key={tbl.id} 
                    className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 shadow-sm transition flex flex-col justify-between gap-2 sm:gap-3"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono font-bold text-white text-xs sm:text-sm">
                            {tbl.number < 10 ? `0${tbl.number}` : tbl.number}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-900 leading-tight">{tbl.name}</h4>
                            <span className="text-[10px] sm:text-[11px] text-neutral-500 font-medium">{tbl.capacity} personas</span>
                          </div>
                        </div>

                        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-neutral-200 text-neutral-800 border-neutral-300">
                          {tbl.zone}
                        </span>
                      </div>

                      {/* Notes if any */}
                      {tbl.notes && (
                        <p className="text-[10px] sm:text-[11px] text-neutral-600 italic mb-1 line-clamp-1">
                          "{tbl.notes}"
                        </p>
                      )}

                      {/* Assigned Waiters */}
                      <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white border border-neutral-200 mb-1 sm:mb-2">
                        <span className="text-[9px] sm:text-[10px] text-neutral-500 block uppercase font-bold tracking-wider mb-0.5">
                          Mozos Asignados:
                        </span>
                        {assignedStaff.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedStaff.map(waiter => (
                              <span 
                                key={waiter.id} 
                                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 font-medium"
                              >
                                <ChefHat className="w-3 h-3 text-neutral-600" />
                                <span>{waiter.name.split(' ')[0]}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-[11px] text-neutral-500 italic">
                            Sin mozo asignado (Todos)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-1.5 sm:pt-2 border-t border-neutral-200 flex items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedTableForQr(tbl)}
                          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 transition cursor-pointer text-[10px] sm:text-[11px] font-bold shadow-sm"
                          title="Ver e Imprimir Código QR"
                        >
                          <QrCode className="w-3.5 h-3.5 text-neutral-700" />
                          <span className="hidden sm:inline">QR</span>
                        </button>

                        <button
                          onClick={() => onOpenCustomerPreview(currentRestaurant, 'DINE_IN', `${tbl.number}`)}
                          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 transition cursor-pointer text-[10px] sm:text-[11px] font-bold shadow-sm"
                          title="Probar Carta como Cliente en esta Mesa"
                        >
                          <Eye className="w-3.5 h-3.5 text-neutral-700" />
                          <span className="hidden sm:inline">Carta</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTable({ ...tbl })}
                          className="p-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition cursor-pointer shadow-sm"
                          title="Editar Mesa y Asignación"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTable(tbl.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200 transition cursor-pointer shadow-sm"
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
          <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-5">
            <div className="flex items-center justify-between gap-2 pb-2 sm:pb-4 border-b border-neutral-200">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-base font-bold text-neutral-900 flex items-center gap-1.5 truncate">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-900 shrink-0" />
                  <span className="truncate">Horarios de Atención ({currentRestaurant.name})</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-1 mt-0.5">
                  Configura los horarios de apertura y cierre de cada día de la semana.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleSaveWeeklySchedule}
                  className="flex items-center justify-center gap-1 p-2 sm:px-4 sm:py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold transition shadow-md cursor-pointer"
                  title="Guardar Horarios"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Guardar Horarios</span>
                </button>
              </div>
            </div>

            {/* Presets Toolbar */}
            <div className="p-2 sm:p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
                <span className="text-xs font-bold text-neutral-800">Plantillas Rápidas:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleApplySchedulePreset('standard')}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 text-[10px] sm:text-xs font-bold border border-neutral-200 transition cursor-pointer shadow-sm"
                >
                  Estándar (12:00 - 23:00)
                </button>
                <button
                  onClick={() => handleApplySchedulePreset('copy_monday')}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 text-[10px] sm:text-xs font-bold border border-neutral-200 transition cursor-pointer shadow-sm"
                >
                  Copiar Lunes
                </button>
                <button
                  onClick={() => handleApplySchedulePreset('weekend_extended')}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 text-[10px] sm:text-xs font-bold border border-neutral-200 transition cursor-pointer shadow-sm"
                >
                  Fin de Semana Ext.
                </button>
              </div>
            </div>

            {/* Days Table List */}
            <div className="space-y-1 sm:space-y-2">
              {scheduleState.map((dayItem, idx) => (
                <div 
                  key={dayItem.day} 
                  className={`p-2 sm:p-3.5 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-4 ${
                    dayItem.isOpen 
                      ? 'bg-neutral-50 border-neutral-200 shadow-sm' 
                      : 'bg-neutral-50/60 border-neutral-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between md:justify-start gap-2 min-w-[120px]">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-neutral-900 flex items-center justify-center font-bold text-[11px] sm:text-xs text-white">
                        {dayItem.day.slice(0, 2)}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">{dayItem.day}</h4>
                        <span className={`text-[10px] sm:text-[11px] font-bold ${dayItem.isOpen ? 'text-neutral-800' : 'text-neutral-400'}`}>
                          {dayItem.isOpen ? '● Abierto' : '○ Cerrado'}
                        </span>
                      </div>
                    </div>

                    <label className="flex md:hidden items-center gap-1 cursor-pointer text-[10px] font-bold text-neutral-800">
                      <input
                        type="checkbox"
                        checked={dayItem.isOpen}
                        onChange={(e) => {
                          const updated = [...scheduleState];
                          updated[idx] = { ...updated[idx], isOpen: e.target.checked };
                          setScheduleState(updated);
                        }}
                        className="w-3.5 h-3.5 rounded text-neutral-900 accent-neutral-900 focus:ring-0 border-neutral-300 bg-white cursor-pointer"
                      />
                      <span>{dayItem.isOpen ? 'Habilitado' : 'Cerrado'}</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 flex-1">
                    <label className="hidden md:flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                      <input
                        type="checkbox"
                        checked={dayItem.isOpen}
                        onChange={(e) => {
                          const updated = [...scheduleState];
                          updated[idx] = { ...updated[idx], isOpen: e.target.checked };
                          setScheduleState(updated);
                        }}
                        className="w-4 h-4 rounded text-neutral-900 accent-neutral-900 focus:ring-0 border-neutral-300 bg-white cursor-pointer"
                      />
                      <span>{dayItem.isOpen ? 'Habilitado' : 'Deshabilitado'}</span>
                    </label>

                    {dayItem.isOpen && (
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] sm:text-[11px] font-medium text-neutral-600">Apertura:</span>
                          <input
                            type="time"
                            value={dayItem.openTime}
                            onChange={(e) => {
                              const updated = [...scheduleState];
                              updated[idx] = { ...updated[idx], openTime: e.target.value };
                              setScheduleState(updated);
                            }}
                            className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white border border-neutral-300 text-xs font-mono font-bold text-neutral-900"
                          />
                        </div>

                        <span className="text-neutral-400">—</span>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] sm:text-[11px] font-medium text-neutral-600">Cierre:</span>
                          <input
                            type="time"
                            value={dayItem.closeTime}
                            onChange={(e) => {
                              const updated = [...scheduleState];
                              updated[idx] = { ...updated[idx], closeTime: e.target.value };
                              setScheduleState(updated);
                            }}
                            className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white border border-neutral-300 text-xs font-mono font-bold text-neutral-900"
                          />
                        </div>

                        <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                          <input
                            type="text"
                            placeholder="Nota opcional..."
                            value={dayItem.notes || ''}
                            onChange={(e) => {
                              const updated = [...scheduleState];
                              updated[idx] = { ...updated[idx], notes: e.target.value };
                              setScheduleState(updated);
                            }}
                            className="w-full px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400"
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
          <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-5">
            <div className="flex items-center justify-between gap-2 pb-2 sm:pb-4 border-b border-neutral-200">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-base font-bold text-neutral-900 flex items-center gap-1.5 truncate">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-900 shrink-0" />
                  <span className="truncate">Turnos de Personal ({currentRestaurant.name})</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-1 mt-0.5">
                  Define turnos operativos y asigna personal para salón y delivery.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  className="flex items-center justify-center gap-1 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-bold transition cursor-pointer shadow-sm"
                  title="Crear Nuevo Turno"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Crear Turno</span>
                </button>

                <button
                  onClick={handleSaveShifts}
                  className="flex items-center justify-center gap-1 p-2 sm:px-4 sm:py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold transition shadow-md cursor-pointer"
                  title="Guardar Turnos"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Guardar Turnos</span>
                </button>
              </div>
            </div>

            {/* Shifts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              {shiftsState.map((shift) => {
                const assignedUsers = users.filter(u => shift.assignedUserIds?.includes(u.id));

                return (
                  <div 
                    key={shift.id} 
                    className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 shadow-sm transition flex flex-col justify-between gap-2 sm:gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="p-1.5 sm:p-2 rounded-lg bg-neutral-900 text-white">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-900">{shift.name}</h4>
                            <span className="text-[10px] sm:text-[11px] text-neutral-600 font-mono font-bold">
                              {shift.startTime} — {shift.endTime}
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-neutral-200 text-neutral-800 border-neutral-300">
                          {shift.roleTarget === 'WAITER' ? 'Salón' : shift.roleTarget === 'DELIVERY' ? 'Riders' : 'General'}
                        </span>
                      </div>

                      {/* Applicable Days */}
                      <div className="mb-1.5 sm:mb-3">
                        <span className="text-[9px] sm:text-[10px] text-neutral-500 font-bold block mb-0.5">Días:</span>
                        <div className="flex flex-wrap gap-1">
                          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => {
                            const isIncluded = shift.applicableDays.includes(d as DayOfWeek);
                            return (
                              <span 
                                key={d} 
                                className={`text-[8px] sm:text-[10px] px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded font-mono ${
                                  isIncluded 
                                    ? 'bg-neutral-900 text-white font-bold' 
                                    : 'bg-neutral-200 text-neutral-400'
                                }`}
                              >
                                {d.slice(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Staff Assigned */}
                      <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white border border-neutral-200">
                        <span className="text-[9px] sm:text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-0.5">
                          Personal Asignado ({assignedUsers.length}):
                        </span>
                        {assignedUsers.length > 0 ? (
                          <div className="space-y-0.5 sm:space-y-1">
                            {assignedUsers.map(u => (
                              <div key={u.id} className="flex items-center justify-between text-[10px] sm:text-xs text-neutral-800 font-medium">
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                  {u.role === 'WAITER' ? <ChefHat className="w-3 h-3 text-neutral-600" /> : <Bike className="w-3 h-3 text-neutral-600" />}
                                  <span>{u.name}</span>
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-mono text-neutral-500">DNI: {u.dni}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-[11px] text-neutral-500 italic">Sin colaboradores asignados</span>
                        )}
                      </div>
                    </div>

                    {/* Shift Actions */}
                    <div className="pt-1.5 sm:pt-2 border-t border-neutral-200 flex items-center justify-end gap-1 sm:gap-1.5">
                      <button
                        onClick={() => setEditingShift({ ...shift })}
                        className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold border border-neutral-200 transition cursor-pointer shadow-sm"
                        title="Editar Turno"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 text-xs border border-neutral-200 transition cursor-pointer shadow-sm"
                        title="Eliminar Turno"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Eliminar</span>
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
          <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-6">
            
            {/* Header & Actions */}
            <div className="flex items-center justify-between gap-2 pb-2 sm:pb-4 border-b border-neutral-200">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-base font-bold text-neutral-900 flex items-center gap-1.5 truncate">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-900 shrink-0" />
                  <span className="truncate">Cocina & Pantalla KDS ({currentRestaurant.name})</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-1 mt-0.5">
                  Gestiona cocineros, pases de salón y control de platos agotados (Lista 86).
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  className="flex items-center justify-center gap-1 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-bold transition cursor-pointer shadow-sm"
                  title="Alta Personal Cocina"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Alta Cocina</span>
                </button>

                <button
                  onClick={handleSaveKitchenPerms}
                  className="flex items-center justify-center gap-1 p-2 sm:px-4 sm:py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold transition shadow-md cursor-pointer"
                  title="Guardar Configuración Cocina"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Guardar Configuración</span>
                </button>
              </div>
            </div>

            {/* Assigned Kitchen Staff Cards */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <h4 className="text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Equipo de Cocina ({assignedKitchen.length})</span>
                </h4>
              </div>

              {assignedKitchen.length === 0 ? (
                <div className="p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-dashed border-neutral-300 text-center text-xs text-neutral-600 bg-neutral-50">
                  <Flame className="w-5 h-5 text-neutral-400 mx-auto mb-1.5" />
                  <p className="font-medium">No hay cocineros asignados a esta sede.</p>
                  <button
                    onClick={() => {
                      setNewUserRole('KITCHEN');
                      setIsCreatingUser(true);
                    }}
                    className="mt-1.5 text-neutral-900 font-bold hover:underline cursor-pointer"
                  >
                    + Registrar primer personal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3.5">
                  {assignedKitchen.map((chef) => (
                    <div key={chef.id} className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition flex items-center justify-between gap-2.5 shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={chef.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80'} 
                          alt={chef.name} 
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover border border-neutral-200 shrink-0" 
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900 truncate">{chef.name}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-900 text-white font-mono font-bold shrink-0">
                              KDS
                            </span>
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 flex items-center gap-1 font-medium truncate">
                            <span>DNI: <strong className="font-mono text-neutral-900">{chef.dni}</strong></span>
                            <span>•</span>
                            <span className="text-neutral-700 font-bold truncate">{chef.kitchenStation || 'Cocina'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingUser(chef)}
                        className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-xs text-neutral-800 font-bold transition cursor-pointer shrink-0 shadow-sm"
                        title="Permisos"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 sm:hidden" />
                        <span className="hidden sm:inline">Permisos</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Master Kitchen Permissions & Policies */}
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-800" />
                <span>Políticas y Facultades del Rol Cocina</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                
                {/* canMarkReady */}
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900">Marcar Platos Listos para Servir</div>
                    <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                      Permite cambiar el estado de platos a "Listo" y notificar al mozo o pase.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.canMarkReady}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, canMarkReady: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                  />
                </div>

                {/* canManageStockOut (Lista 86) */}
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900">Control de Lista 86 (Platos Agotados)</div>
                    <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                      Faculta a cocina para agotar platos al instante cuando se terminan insumos.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.canManageStockOut}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, canManageStockOut: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                  />
                </div>

                {/* canRejectItems */}
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900">Observaciones y Ajustes con Salón</div>
                    <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                      Permite solicitar rectificación o confirmación al mozo de cocción o alergias.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.canRejectItems}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, canRejectItems: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                  />
                </div>

                {/* canReorderQueue */}
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900">Reordenar Cola de Comandas en Pantalla</div>
                    <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                      Permite priorizar tickets por orden de llegada o marcha de entradas.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.canReorderQueue}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, canReorderQueue: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                  />
                </div>

                {/* autoPrintTickets */}
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900">Recepción Inmediata en KDS</div>
                    <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                      Las comandas generadas por clientes vía QR ingresan al instante a pantalla.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.autoPrintTickets}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, autoPrintTickets: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                  />
                </div>

                {/* soundAlerts */}
                <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900">Campana Acústica de Nueva Comanda</div>
                    <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                      Emite un timbre sonoro en cocina cada vez que entra un nuevo pedido.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kitchenPerms.soundAlerts}
                    onChange={(e) => setKitchenPerms({ ...kitchenPerms, soundAlerts: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                  />
                </div>

              </div>
            </div>

            {/* Default Station Filter */}
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              <div>
                <span className="text-xs font-bold text-neutral-900 block">Estación Predeterminada del Local</span>
                <span className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 block">
                  Filtro visual por defecto aplicado a la vista KDS.
                </span>
              </div>
              <select
                value={kitchenPerms.stationFilter || 'Todas las estaciones'}
                onChange={(e) => setKitchenPerms({ ...kitchenPerms, stationFilter: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer shadow-sm"
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
          <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-6">
            <div className="flex items-center justify-between gap-2 pb-2 sm:pb-4 border-b border-neutral-200">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-base font-bold text-neutral-900 flex items-center gap-1.5 truncate">
                  <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-900 shrink-0" />
                  <span className="truncate">Personal de Salón ({currentRestaurant.name})</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-1 mt-0.5">
                  Define qué acciones pueden realizar los mozos sin autorización de gerencia.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setNewUserRole('WAITER');
                    setNewUserRestId(currentRestaurant.id);
                    setIsCreatingUser(true);
                  }}
                  className="flex items-center justify-center gap-1 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-bold transition cursor-pointer shadow-sm"
                  title="Registrar Mesero"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Registrar Mesero</span>
                </button>

                <button
                  onClick={handleSaveWaiterPerms}
                  className="flex items-center justify-center gap-1 p-2 sm:px-4 sm:py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold transition shadow-md cursor-pointer"
                  title="Guardar Accesos de Meseros"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Guardar Accesos</span>
                </button>
              </div>
            </div>

            {/* Waiter Switch List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Anular Platos y Comandas</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Permite al mozo dar de baja platos ya enviados a cocina sin clave de supervisor.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.canCancelOrders}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, canCancelOrders: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Aplicar Cortesías y Descuentos</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Permite al mesero aplicar descuentos promocionales directamente en la cuenta.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.canApplyDiscounts}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, canApplyDiscounts: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Reasignar Mesas y Juntar Cuentas</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Permite mover comensales entre mesas físicas o unir mesas para grupos.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.canAssignTables}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, canAssignTables: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Dividir Cuentas (Split Bill)</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Habilita cobro fraccionado por ítem o por comensal al cierre.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.canSplitBills}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, canSplitBills: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Exigir PIN de Supervisor para Cambios</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Bloquea cambios críticos si no se ingresa el PIN del administrador.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={waiterPerms.requireSupervisorPin}
                  onChange={(e) => setWaiterPerms({ ...waiterPerms, requireSupervisorPin: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Límite de Mesas Simultáneas</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Tope para garantizar un servicio ágil sin cuellos de botella.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={waiterPerms.maxActiveTables}
                    onChange={(e) => setWaiterPerms({ ...waiterPerms, maxActiveTables: parseInt(e.target.value) || 5 })}
                    className="w-14 px-2 py-1 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 font-mono font-bold text-center focus:outline-none focus:border-neutral-900"
                  />
                  <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">mesas</span>
                </div>
              </div>
            </div>

            {/* List of Assigned Waiters */}
            <div className="pt-2 sm:pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider block">
                  Meseros Registrados ({assignedWaiters.length}):
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {assignedWaiters.map(waiter => (
                  <div key={waiter.id} className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-2.5 shadow-sm hover:border-neutral-300 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={waiter.avatar} alt={waiter.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover border border-neutral-200 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 truncate">{waiter.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-800 border border-neutral-300">
                            DNI: {waiter.dni || 'No reg.'}
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-neutral-600 font-medium mt-0.5 truncate">
                          Turno: <strong className="text-neutral-800">{waiter.assignedShift || 'TARDE'}</strong> · PIN: <strong className="font-mono text-neutral-800">{waiter.pinCode || '1234'}</strong>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingUser(waiter)}
                      className="p-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition cursor-pointer shadow-sm shrink-0"
                      title="Editar Accesos y Permisos"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB 2: ACCESOS DE REPARTIDORES                             */}
        {/* ============================================================= */}
        {activeSubTab === 'delivery' && (
          <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-6">
            <div className="flex items-center justify-between gap-2 pb-2 sm:pb-4 border-b border-neutral-200">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-base font-bold text-neutral-900 flex items-center gap-1.5 truncate">
                  <Bike className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-900 shrink-0" />
                  <span className="truncate">Riders & Reparto ({currentRestaurant.name})</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-1 mt-0.5">
                  Configura parámetros de seguridad, cobro y despacho para motorizados.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setNewUserRole('DELIVERY');
                    setNewUserRestId(currentRestaurant.id);
                    setIsCreatingUser(true);
                  }}
                  className="flex items-center justify-center gap-1 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-bold transition cursor-pointer shadow-sm"
                  title="Registrar Repartidor"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Registrar Rider</span>
                </button>

                <button
                  onClick={handleSaveDeliveryPerms}
                  className="flex items-center justify-center gap-1 p-2 sm:px-4 sm:py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold transition shadow-md cursor-pointer"
                  title="Guardar Accesos de Repartidores"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Guardar Accesos</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Permitir Cobro en Efectivo contra Entrega</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Habilita a los repartidores recibir dinero en mano y reportar cuadre.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={deliveryPerms.canAcceptCash}
                  onChange={(e) => setDeliveryPerms({ ...deliveryPerms, canAcceptCash: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Asignación Inteligente GPS</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Asigna automáticamente el pedido al rider más cercano al local.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={deliveryPerms.autoAssignZone}
                  onChange={(e) => setDeliveryPerms({ ...deliveryPerms, autoAssignZone: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Telemetría y Control de Velocidad</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Envía avisos a gerencia si el motorizado excede límites de velocidad.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={deliveryPerms.gpsSpeedTracking}
                  onChange={(e) => setDeliveryPerms({ ...deliveryPerms, gpsSpeedTracking: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Máximo de Pedidos por Rider</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Evita que un motorizado lleve más órdenes de las que puede entregar en caliente.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={deliveryPerms.maxActiveOrders}
                    onChange={(e) => setDeliveryPerms({ ...deliveryPerms, maxActiveOrders: parseInt(e.target.value) || 3 })}
                    className="w-14 px-2 py-1 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 font-mono font-bold text-center focus:outline-none focus:border-neutral-900"
                  />
                  <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">pedidos</span>
                </div>
              </div>
            </div>

            {/* Allowed Delivery Zones */}
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1.5 sm:space-y-2">
              <span className="text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider block">Zonas de Cobertura Habilitadas:</span>
              <div className="flex flex-wrap gap-1.5">
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
                      className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer border ${
                        isZoneActive
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {isZoneActive ? `✓ ${zone}` : `+ ${zone}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of Assigned Delivery Personnel */}
            <div className="pt-2 sm:pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider block">
                  Repartidores Habilitados ({assignedRiders.length}):
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {assignedRiders.map(rider => (
                  <div key={rider.id} className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-2.5 shadow-sm hover:border-neutral-300 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={rider.avatar} alt={rider.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover border border-neutral-200 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 truncate">{rider.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-800 border border-neutral-300">
                            DNI: {rider.dni || 'No reg.'}
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-neutral-600 font-medium mt-0.5 truncate">
                          {rider.vehicleType} · Placa: <strong className="font-mono text-neutral-800">{rider.licensePlate || 'S/P'}</strong>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingUser(rider)}
                      className="p-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition cursor-pointer shadow-sm shrink-0"
                      title="Editar Accesos y Permisos"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB 3: ACCESOS DE CLIENTES & QR                            */}
        {/* ============================================================= */}
        {activeSubTab === 'customers' && (
          <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-6">
            <div className="flex items-center justify-between gap-2 pb-2 sm:pb-4 border-b border-neutral-200">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-base font-bold text-neutral-900 flex items-center gap-1.5 truncate">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-900 shrink-0" />
                  <span className="truncate">Clientes & Autoservicio QR ({currentRestaurant.name})</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-1 mt-0.5">
                  Controla la experiencia que ven los comensales cuando escanean el código QR en la mesa.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setNewUserRole('CUSTOMER');
                    setNewUserRestId(currentRestaurant.id);
                    setIsCreatingUser(true);
                  }}
                  className="flex items-center justify-center gap-1 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-bold transition cursor-pointer shadow-sm"
                  title="Registrar Cliente"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Registrar Cliente</span>
                </button>

                <button
                  onClick={handleSaveCustomerSettings}
                  className="flex items-center justify-center gap-1 p-2 sm:px-4 sm:py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold transition shadow-md cursor-pointer"
                  title="Guardar Accesos de Clientes & QR"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Guardar Accesos</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Pedido Directo desde QR (Self-Ordering)</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Permite al cliente enviar platos directo a cocina desde su smartphone.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customerSettings.qrOrderingEnabled}
                  onChange={(e) => setCustomerSettings({ ...customerSettings, qrOrderingEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Comanda como Invitado (Sin Registro)</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Los comensales no están forzados a crear una cuenta para ordenar.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customerSettings.guestCheckout}
                  onChange={(e) => setCustomerSettings({ ...customerSettings, guestCheckout: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Permitir Pago en Efectivo Llamando al Mozo</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Muestra el botón "Pagar en efectivo" en el checkout digital.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={customerSettings.allowCashAtTable}
                  onChange={(e) => setCustomerSettings({ ...customerSettings, allowCashAtTable: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 accent-neutral-900 cursor-pointer focus:ring-0 mt-0.5 shrink-0"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-start justify-between gap-2.5 hover:bg-neutral-100/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900">Descuento Automático Clientes VIP (%)</div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-600 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                    Beneficio directo aplicado en la carta para comensales frecuentes.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={customerSettings.vipDiscountPercent}
                    onChange={(e) => setCustomerSettings({ ...customerSettings, vipDiscountPercent: parseInt(e.target.value) || 0 })}
                    className="w-14 px-2 py-1 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 font-mono font-bold text-center focus:outline-none focus:border-neutral-900"
                  />
                  <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">%</span>
                </div>
              </div>
            </div>

            {/* Custom Welcome Message and WiFi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200">
                <label className="text-[11px] sm:text-xs font-bold text-neutral-900 block mb-1">
                  Mensaje de Bienvenida en la Carta Digital
                </label>
                <input
                  type="text"
                  value={customerSettings.welcomeMessage}
                  onChange={(e) => setCustomerSettings({ ...customerSettings, welcomeMessage: e.target.value })}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-sm"
                />
              </div>

              <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200">
                <label className="text-[11px] sm:text-xs font-bold text-neutral-900 block mb-1">
                  Contraseña de WiFi del Local (Visible al cliente)
                </label>
                <div className="relative">
                  <Wifi className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerSettings.wifiPassword}
                    onChange={(e) => setCustomerSettings({ ...customerSettings, wifiPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-xl bg-white border border-neutral-300 text-xs text-neutral-900 font-mono focus:outline-none focus:border-neutral-900 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* List of Registered Customers */}
            <div className="pt-2 sm:pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[11px] sm:text-xs font-bold text-neutral-900 uppercase tracking-wider block">
                  Clientes Registrados ({assignedCustomers.length}):
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {assignedCustomers.map(customer => (
                  <div key={customer.id} className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-2.5 shadow-sm hover:border-neutral-300 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={customer.avatar} alt={customer.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover border border-neutral-200 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 truncate">{customer.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-800 border border-neutral-300">
                            DNI: {customer.dni || 'No reg.'}
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-neutral-600 font-medium mt-0.5 truncate">
                          Nivel: <strong className="text-neutral-800">{customer.vipTier || 'STANDARD'}</strong> · Saldo: <strong className="text-neutral-800">S/ {customer.creditBalance || 0}</strong>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingUser(customer)}
                      className="p-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition cursor-pointer shadow-sm shrink-0"
                      title="Editar Accesos y Permisos"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SUBTAB 4: PLANTILLAS DE CARTAS PARA ESTE LOCAL                */}
        {/* ============================================================= */}
        {activeSubTab === 'templates' && (
          <div className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
              <div>
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-neutral-900" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    Personalización & Plantillas para {currentRestaurant.name}
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 mt-1">
                  Elige la plantilla y personaliza colores, tipografías y tarjetas con el editor en tiempo real.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSplitEditorOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Editor de Pantalla Dividida (Split-Screen)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCustomerPreview(currentRestaurant)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-800 border border-neutral-300 transition cursor-pointer shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Ver Carta Completa</span>
                </button>
              </div>
            </div>

            {/* Template Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tmpl) => {
                const isCurrent = (currentRestaurant.templateId || 'tmpl-luxury') === tmpl.id;

                return (
                  <div
                    key={tmpl.id}
                    className={`rounded-2xl border overflow-hidden transition flex flex-col justify-between shadow-sm ${
                      isCurrent
                        ? 'border-neutral-900 ring-2 ring-neutral-900/20 bg-white'
                        : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white'
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-black/80 text-white border border-neutral-700 backdrop-blur-md">
                          {tmpl.badge}
                        </span>
                      </div>

                      {isCurrent && (
                        <div className="absolute top-2.5 right-2.5">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white text-black shadow-lg">
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
                      <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>

                      <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between gap-2">
                        {/* Preview button */}
                        <button
                          type="button"
                          onClick={() => {
                            onOpenCustomerPreview({
                              ...currentRestaurant,
                              templateId: tmpl.id
                            });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-[11px] font-bold text-neutral-800 transition cursor-pointer border border-neutral-300 shadow-sm"
                          title="Previsualizar esta plantilla con los platos de este local"
                        >
                          <Eye className="w-3 h-3 text-neutral-700" />
                          <span>Previsualizar</span>
                        </button>

                        {isCurrent ? (
                          <span className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>En Uso</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectTemplate(tmpl.id)}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold transition cursor-pointer shadow-sm"
                          >
                            Activar
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

        {/* ============================================================= */}
        {/* SUBTAB 9: SUPERVISAR VENTAS Y PEDIDOS EN TIEMPO REAL          */}
        {/* ============================================================= */}
        {activeSubTab === 'sales_monitor' && (
          <div className="p-2 sm:p-6 space-y-3 sm:space-y-6 animate-in fade-in duration-200">
            {/* Minimalist Top KPI Bar (4 Columns on mobile & desktop) */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
              <div className="bg-white border border-neutral-100 rounded-xl sm:rounded-2xl p-1.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-1 sm:gap-0">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <span className="text-[8px] sm:text-[10px] text-neutral-400 uppercase tracking-wider font-mono block truncate">Pedidos Activos</span>
                  <div className="text-sm sm:text-xl font-black text-neutral-900 leading-none">
                    {monitorOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}
                  </div>
                </div>
                <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="bg-white border border-neutral-100 rounded-xl sm:rounded-2xl p-1.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-1 sm:gap-0">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <span className="text-[8px] sm:text-[10px] text-neutral-400 uppercase tracking-wider font-mono font-bold text-emerald-600 block truncate">Ventas Hoy</span>
                  <div className="text-xs sm:text-xl font-black text-neutral-900 leading-none truncate">
                    S/ {monitorOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="text-[10px] sm:text-sm font-black font-mono">S/</span>
                </div>
              </div>

              <div className="bg-white border border-neutral-100 rounded-xl sm:rounded-2xl p-1.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-1 sm:gap-0">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <span className="text-[8px] sm:text-[10px] text-neutral-400 uppercase tracking-wider font-mono font-bold text-orange-600 block truncate">En Cocina</span>
                  <div className="text-sm sm:text-xl font-black text-orange-600 flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1 leading-none">
                    <span>{monitorOrders.filter(o => o.status === 'IN_KITCHEN' || (o.status as any) === 'PREPARING').length}</span>
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 shrink-0" />
                  </div>
                </div>
                <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="bg-white border border-neutral-100 rounded-xl sm:rounded-2xl p-1.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left gap-1 sm:gap-0">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <span className="text-[8px] sm:text-[10px] text-neutral-400 uppercase tracking-wider font-mono block truncate">Listos p/ Servir</span>
                  <div className="text-sm sm:text-xl font-black text-emerald-600 leading-none">
                    {monitorOrders.filter(o => o.status === 'READY').length}
                  </div>
                </div>
                <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>

            {/* REAL-TIME CONTROLS / PERSPECTIVE SWITCHERS */}
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-1 bg-neutral-100 p-1 sm:p-1.5 rounded-xl w-full sm:w-auto">
                {[
                  { id: 'restaurant', label: 'Por Sede', icon: Store },
                  { id: 'table', label: 'Por Mesa', icon: Layers },
                  { id: 'waiter', label: 'Por Mozo', icon: ChefHat },
                  { id: 'kitchen', label: 'En Cocina', icon: Flame },
                ].map(mode => {
                  const isActive = monitorMode === mode.id;
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setMonitorMode(mode.id as any)}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 py-1.5 px-2 sm:px-4 rounded-lg font-bold text-[10px] sm:text-xs transition cursor-pointer ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Tiempo real activo</span>
              </div>
            </div>

            {/* MONITOR VIEWS PANELS */}
            {/* ======================= */}

            {/* 1. BY RESTAURANT */}
            {monitorMode === 'restaurant' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                {ownedRestaurants.map(rest => {
                  const restOrders = monitorOrders.filter(o => o.restaurantId === rest.id);
                  const active = restOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
                  const salesTotal = restOrders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0);

                  return (
                    <div key={rest.id} className="bg-white border border-neutral-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm space-y-2.5 sm:space-y-4 hover:border-neutral-200 transition">
                      <div className="flex items-center justify-between border-b border-neutral-50 pb-2 sm:pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-800">
                            {rest.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-800 truncate max-w-[120px] sm:max-w-none">{rest.name}</h4>
                            <p className="text-[10px] text-neutral-400">{rest.cuisineType || 'Restaurante'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 font-mono block">Ventas</span>
                          <span className="text-xs font-black text-neutral-900">S/ {salesTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Status Summary pill indicator */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center bg-neutral-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl">
                        <div>
                          <span className="text-[9px] text-neutral-400 block uppercase">Pendientes</span>
                          <span className="text-xs font-bold text-amber-600">{active.filter(o => o.status === 'PENDING').length}</span>
                        </div>
                        <div className="border-x border-neutral-200/50">
                          <span className="text-[9px] text-neutral-400 block uppercase">Cocina</span>
                          <span className="text-xs font-bold text-blue-600">{active.filter(o => o.status === 'IN_KITCHEN' || (o.status as any) === 'PREPARING').length}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-400 block uppercase">Listos</span>
                          <span className="text-xs font-bold text-emerald-600">{active.filter(o => o.status === 'READY').length}</span>
                        </div>
                      </div>

                      {/* Minimal orders list */}
                      <div className="space-y-1 pt-0.5">
                        <h5 className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Ordenes en Curso (Click para detalle)</h5>
                        {active.length === 0 ? (
                          <div className="text-center py-2 sm:py-4 text-[11px] text-neutral-400 italic">No hay órdenes activas</div>
                        ) : (
                          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                            {active.slice(0, 5).map(o => (
                              <div 
                                key={o.id} 
                                onClick={() => setSelectedOrderForModal(o)}
                                className="flex items-center justify-between text-xs p-1.5 sm:p-2 rounded-lg bg-neutral-50/60 hover:bg-amber-50/60 hover:border-amber-200 transition border border-neutral-100/40 cursor-pointer active:scale-[0.99]"
                                title="Click para ver detalle del pedido y gestionar comanda"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-neutral-600">{o.orderNumber}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-200/50 font-bold text-neutral-700">
                                    {o.tableNumber ? `Mesa ${o.tableNumber}` : 'Deliv'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-neutral-500 font-mono font-bold">S/ {o.total.toFixed(2)}</span>
                                  <span className={`w-2 h-2 rounded-full ${
                                    o.status === 'PENDING' ? 'bg-amber-500' : (o.status === 'IN_KITCHEN' || (o.status as any) === 'PREPARING') ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'
                                  }`} />
                                </div>
                              </div>
                            ))}
                            {active.length > 5 && (
                              <div className="text-[9px] text-center text-neutral-400 italic font-mono pt-1">
                                + {active.length - 5} órdenes más activas
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. BY TABLE */}
            {monitorMode === 'table' && (
              <div className="space-y-6">
                {ownedRestaurants.map(rest => {
                  const restOrders = monitorOrders.filter(o => o.restaurantId === rest.id && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
                  // Get active table orders
                  const dineInOrders = restOrders.filter(o => o.tableNumber);

                  return (
                    <div key={rest.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-neutral-700 uppercase tracking-wider">{rest.name}</h4>
                        <span className="text-[10px] text-neutral-400 font-mono">{dineInOrders.length} Mesas Activas</span>
                      </div>

                      {dineInOrders.length === 0 ? (
                        <div className="text-center py-6 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-xs text-neutral-400">
                          No hay mesas activas con pedidos en esta sede.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {Array.from(new Set(dineInOrders.map(o => o.tableNumber))).sort().map(tableNum => {
                            const tableOrders = dineInOrders.filter(o => o.tableNumber === tableNum);
                            const lastOrder = tableOrders[tableOrders.length - 1];
                            const isPending = tableOrders.some(o => o.status === 'PENDING');
                            const isPreparing = tableOrders.some(o => o.status === 'IN_KITCHEN' || (o.status as any) === 'PREPARING');
                            const isReady = tableOrders.some(o => o.status === 'READY');

                            let borderCol = 'border-neutral-100';
                            let bgCol = 'bg-white';
                            let badgeDot = 'bg-neutral-300';
                            if (isPending) {
                              borderCol = 'border-amber-200/80';
                              bgCol = 'bg-amber-50/20';
                              badgeDot = 'bg-amber-500';
                            } else if (isPreparing) {
                              borderCol = 'border-orange-200/80';
                              bgCol = 'bg-orange-50/20';
                              badgeDot = 'bg-orange-500 animate-ping';
                            } else if (isReady) {
                              borderCol = 'border-emerald-200/80';
                              bgCol = 'bg-emerald-50/20';
                              badgeDot = 'bg-emerald-500';
                            }

                            return (
                              <div 
                                key={tableNum} 
                                onClick={() => setSelectedOrderForModal(lastOrder)}
                                className={`border rounded-2xl p-4 shadow-sm space-y-3 hover:shadow-md transition flex flex-col justify-between cursor-pointer active:scale-[0.98] ${borderCol} ${bgCol}`}
                                title="Click para ver el listado y detalle de los pedidos de esta mesa"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-black">
                                    {tableNum}
                                  </span>
                                  <span className="relative flex h-2 w-2">
                                    {isPreparing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>}
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${badgeDot}`}></span>
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="text-[10px] text-neutral-400 truncate font-mono">
                                    Mozo: {lastOrder.waiterName || 'Cliente (QR)'}
                                  </div>
                                  <div className="text-xs font-black text-neutral-800">
                                    S/ {tableOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                                  </div>
                                </div>

                                <div className="text-[9px] font-mono text-neutral-400 border-t border-neutral-100/80 pt-2 flex items-center justify-between">
                                  <span>{tableOrders.length} {tableOrders.length === 1 ? 'Pedido' : 'Pedidos'}</span>
                                  <span className="font-bold text-neutral-600">#{lastOrder.orderNumber}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. BY WAITER */}
            {monitorMode === 'waiter' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(new Set(
                  monitorOrders
                    .filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
                    .map(o => o.waiterName || 'Pedido Cliente (Digital QR)')
                )).map((waiterName) => {
                  const waiterOrders = monitorOrders.filter(o => 
                    (o.waiterName || 'Pedido Cliente (Digital QR)') === waiterName &&
                    o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
                  );
                  const salesTotal = waiterOrders.reduce((sum, o) => sum + o.total, 0);

                  return (
                    <div key={waiterName} className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm hover:border-neutral-200 transition space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                            <UserIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-neutral-800 truncate max-w-[150px]">{waiterName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 font-mono block">En curso</span>
                          <span className="text-xs font-black text-neutral-800">S/ {salesTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {waiterOrders.map(o => (
                          <div 
                            key={o.id} 
                            onClick={() => setSelectedOrderForModal(o)}
                            className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 hover:bg-amber-50/60 hover:border-amber-200 transition border border-neutral-100/50 text-xs cursor-pointer active:scale-[0.99]"
                            title="Click para ver detalle del pedido"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-neutral-500">#{o.orderNumber}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-200 text-neutral-700">
                                {o.tableNumber ? `Mesa ${o.tableNumber}` : 'Deliv'}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-neutral-700">
                              {o.status === 'PENDING' ? '🟡' : (o.status === 'IN_KITCHEN' || (o.status as any) === 'PREPARING') ? '🔥' : '🟢'} S/ {o.total.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. IN KITCHEN (KITCHEN QUEUE AND READY TO DISPATCH) */}
            {monitorMode === 'kitchen' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. KITCHEN QUEUE */}
                <div className="space-y-3 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                      <h4 className="text-xs font-black text-neutral-700 uppercase tracking-wider">Cola de Cocina</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
                      {activeOrders.filter(o => o.status === 'PENDING' || o.status === 'IN_KITCHEN' || (o.status as any) === 'PREPARING').length} órdenes
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {activeOrders.filter(o => o.status === 'PENDING' || o.status === 'IN_KITCHEN' || (o.status as any) === 'PREPARING').length === 0 ? (
                      <div className="text-center py-10 text-neutral-400 italic text-xs">No hay platos cocinándose</div>
                    ) : (
                      activeOrders.filter(o => o.status === 'PENDING' || o.status === 'IN_KITCHEN' || (o.status as any) === 'PREPARING').map(o => (
                        <div 
                          key={o.id} 
                          onClick={() => setSelectedOrderForModal(o)}
                          className="bg-white hover:bg-amber-50/50 transition border border-neutral-100 rounded-xl p-3.5 shadow-sm space-y-2 cursor-pointer"
                          title="Click para ver detalle del pedido"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-neutral-400">Orden #{o.orderNumber}</span>
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-black ${
                              o.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800 animate-pulse'
                            }`}>
                              {o.status === 'PENDING' ? 'PTE' : 'PREP'}
                            </span>
                          </div>

                          <div className="divide-y divide-neutral-50">
                            {o.items.map((it, idx) => (
                              <div key={idx} className="py-1 text-xs text-neutral-800 flex items-center justify-between font-medium">
                                <span className="font-bold text-neutral-900">{it.quantity}x {it.name}</span>
                                {it.notes && <span className="text-[9px] text-neutral-400 italic">"{it.notes}"</span>}
                              </div>
                            ))}
                          </div>

                          <div className="text-[9px] text-neutral-400 border-t border-neutral-50 pt-2 flex items-center justify-between">
                            <span>Sede: {ownedRestaurants.find(r => r.id === o.restaurantId)?.name || 'Sede'}</span>
                            <span className="font-mono">{o.tableNumber ? `Mesa ${o.tableNumber}` : 'Para Llevar'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. READY TO DISPATCH */}
                <div className="space-y-3 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <h4 className="text-xs font-black text-neutral-700 uppercase tracking-wider">Listos / Para Servir</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {activeOrders.filter(o => o.status === 'READY').length} listos
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {activeOrders.filter(o => o.status === 'READY').length === 0 ? (
                      <div className="text-center py-10 text-neutral-400 italic text-xs">No hay órdenes listas esperando entrega</div>
                    ) : (
                      activeOrders.filter(o => o.status === 'READY').map(o => (
                        <div key={o.id} className="bg-white border border-emerald-100/40 rounded-xl p-3.5 shadow-sm space-y-2 border-l-4 border-l-emerald-500">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-neutral-900">Orden #{o.orderNumber}</span>
                            <span className="px-2 py-0.5 rounded font-mono text-[9px] font-black bg-emerald-100 text-emerald-800">
                              LISTO
                            </span>
                          </div>

                          <div className="divide-y divide-neutral-50">
                            {o.items.map((it, idx) => (
                              <div key={idx} className="py-1 text-xs text-neutral-800 flex items-center justify-between font-bold text-emerald-900">
                                <span>{it.quantity}x {it.name}</span>
                              </div>
                            ))}
                          </div>

                          <div className="text-[9px] text-neutral-400 border-t border-neutral-50 pt-2 flex items-center justify-between">
                            <span>Sede: {ownedRestaurants.find(r => r.id === o.restaurantId)?.name || 'Sede'}</span>
                            <span className="font-black text-neutral-800">{o.tableNumber ? `MESA ${o.tableNumber}` : 'Llevar'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
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
                <Store className="w-5 h-5 text-neutral-200" />
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
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Eslogan o Subtítulo</label>
                <input
                  type="text"
                  placeholder="Ej: Sabores del mar y tradición norteña"
                  value={newRestTagline}
                  onChange={(e) => setNewRestTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Dirección y Sede</label>
                <input
                  type="text"
                  placeholder="Av. Larco 1234, Miraflores, Lima"
                  value={newRestAddress}
                  onChange={(e) => setNewRestAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+51 987 654 321"
                  value={newRestPhone}
                  onChange={(e) => setNewRestPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Plantilla de Carta Inicial</label>
                <select
                  value={newRestTemplateId}
                  onChange={(e) => setNewRestTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
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
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition shadow"
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
                <UserIcon className="w-5 h-5 text-neutral-200" />
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
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
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
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
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
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs font-mono text-white focus:outline-none focus:border-white"
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
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs font-mono text-white focus:outline-none focus:border-white"
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
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Asignar a Sede / Restaurante *</label>
                <select
                  value={newUserRestId}
                  onChange={(e) => setNewUserRestId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
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
                      onChange={(e) => setNewUserShift(e.target.value as 'MANANA' | 'TARDE' | 'NOCHE')}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <option value="MANANA">Mañana (08:00 - 16:00)</option>
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
                      onChange={(e) => setNewUserVehicle(e.target.value as 'MOTO' | 'BICI' | 'AUTO')}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <option value="MOTO">Moto Lineal</option>
                      <option value="BICI">Bicicleta / Eléctrica</option>
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
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition shadow"
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
                <ShieldCheck className="w-5 h-5 text-neutral-200" />
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
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
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
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs font-mono text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Clave de Acceso *</label>
                  <input
                    type="text"
                    value={editingUser.password || '12345678'}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs font-mono text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Reasignar a Sede / Restaurante</label>
                <select
                  value={editingUser.restaurantIds?.[0] || currentRestaurant?.id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, restaurantIds: [e.target.value] })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
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
                      onChange={(e) => setEditingUser({ ...editingUser, assignedShift: e.target.value as 'MANANA' | 'TARDE' | 'NOCHE' })}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <option value="MANANA">Mañana</option>
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
                      onChange={(e) => setEditingUser({ ...editingUser, vehicleType: e.target.value as 'MOTO' | 'BICI' | 'AUTO' })}
                      className="w-full px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <option value="MOTO">Moto</option>
                      <option value="BICI">Bicicleta</option>
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
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition shadow"
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
                <Layers className="w-5 h-5 text-neutral-200" />
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
                              className="w-3.5 h-3.5 rounded text-neutral-900 focus:ring-0 border-neutral-700"
                            />
                            <span className="text-white font-medium">{waiter.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">DNI: {waiter.dni}</span>
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-xs text-neutral-400 italic block text-center py-2">
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
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition shadow"
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
                <Edit3 className="w-5 h-5 text-neutral-200" />
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
                              className="w-3.5 h-3.5 rounded text-neutral-900 focus:ring-0 border-neutral-700"
                            />
                            <span className="text-white font-medium">{waiter.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">DNI: {waiter.dni}</span>
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-xs text-neutral-400 italic block text-center py-2">
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
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition shadow"
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
                <Calendar className="w-5 h-5 text-neutral-200" />
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
                            ? 'bg-white text-black border-white font-bold' 
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
                              className="w-3.5 h-3.5 rounded text-neutral-900 focus:ring-0 border-neutral-700"
                            />
                            <span className="text-white font-medium">{u.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">DNI: {u.dni}</span>
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
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition shadow"
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
                <Edit3 className="w-5 h-5 text-neutral-200" />
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
                    const isSelected = editingShift.applicableDays.includes(day as DayOfWeek);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          const current = editingShift.applicableDays;
                          if (isSelected) {
                            setEditingShift({ ...editingShift, applicableDays: current.filter(d => d !== day) });
                          } else {
                            setEditingShift({ ...editingShift, applicableDays: [...current, day as DayOfWeek] });
                          }
                        }}
                        className={`px-2 py-1.5 rounded text-[11px] font-medium transition cursor-pointer border ${
                          isSelected 
                            ? 'bg-white text-black border-white font-bold' 
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
                              className="w-3.5 h-3.5 rounded text-neutral-900 focus:ring-0 border-neutral-700"
                            />
                            <span className="text-white font-medium">{u.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">DNI: {u.dni}</span>
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
                className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition shadow"
              >
                Guardar Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL CONFIRMACIÓN BORRAR RESTAURANTE POR DUEÑO               */}
      {/* ============================================================= */}
      {restaurantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-red-800/80 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/90 text-red-400 border border-red-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar este Restaurante?</h3>
                <p className="text-xs text-neutral-400 font-mono">/r/{restaurantToDelete.slug}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Nombre Sede:</span>
                <span className="font-bold text-white">{restaurantToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Cocina:</span>
                <span className="text-neutral-300">{restaurantToDelete.cuisineType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Dirección:</span>
                <span className="text-neutral-300 truncate max-w-[200px]">{restaurantToDelete.address || 'Principal'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                ¿Estás seguro de eliminar <strong>{restaurantToDelete.name}</strong>? Se borrará de tu lista de sedes y de la plataforma.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setRestaurantToDelete(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const toDeleteId = restaurantToDelete.id;
                  const toDeleteName = restaurantToDelete.name;
                  if (onDeleteRestaurant) {
                    onDeleteRestaurant(toDeleteId);
                  }
                  setRestaurantToDelete(null);
                  const remaining = ownedRestaurants.filter(r => r.id !== toDeleteId);
                  if (remaining.length > 0) {
                    handleSelectRestaurant(remaining[0].id);
                  }
                  showToast(`Sede "${toDeleteName}" eliminada correctamente.`);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-950"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Restaurante</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: SPLIT-SCREEN TEMPLATE & BRANDING EDITOR                */}
      {/* ============================================================= */}
      {isSplitEditorOpen && (
        <TemplateSplitEditor
          restaurants={ownedRestaurants}
          templates={templates}
          menuItems={menuItems || []}
          categories={categories || []}
          currentRestaurantId={selectedRestId}
          onUpdateRestaurant={(updated) => {
            onUpdateRestaurant(updated);
            showToast(`✓ Cambios de diseño guardados en "${updated.name}".`);
          }}
          onOpenCustomerPreview={onOpenCustomerPreview}
          onClose={() => setIsSplitEditorOpen(false)}
        />
      )}

      {/* ============================================================= */}
      {/* MODAL: ORDER DETAIL & REAL-TIME STATUS MANAGEMENT             */}
      {/* ============================================================= */}
      {selectedOrderForModal && (
        <OwnerOrderDetailModal
          order={selectedOrderForModal}
          onClose={() => setSelectedOrderForModal(null)}
          onUpdateStatus={(orderId, nextStatus) => {
            if (onUpdateOrderStatus) {
              onUpdateOrderStatus(orderId, nextStatus);
            }
            setSelectedOrderForModal(prev => prev && prev.id === orderId ? { ...prev, status: nextStatus } : prev);
            showToast(`✓ Comanda actualizada a estado "${nextStatus}".`);
          }}
          restaurantName={ownedRestaurants.find(r => r.id === selectedOrderForModal.restaurantId)?.name || currentRestaurant?.name}
        />
      )}
    </div>
  );
};

