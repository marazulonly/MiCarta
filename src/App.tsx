import React, { useState, useEffect } from 'react';
import { 
  INITIAL_RESTAURANTS, 
  INITIAL_CATEGORIES, 
  INITIAL_MENU_ITEMS, 
  INITIAL_USERS, 
  INITIAL_ORDERS 
} from './data/mockData';
import { INITIAL_MENU_TEMPLATES } from './data/menuTemplatesData';
import { Restaurant, MenuCategory, MenuItem, User, Order, TabType, UserRole, OrderStatus, MenuTemplate } from './types';
import { TopHeader } from './components/TopHeader';
import { FloatingNavBar } from './components/FloatingNavBar';
import { HomeView } from './components/HomeView';
import { RestaurantsView } from './components/RestaurantsView';
import { UsersView } from './components/UsersView';
import { OrdersView } from './components/OrdersView';
import { ArchitectureView } from './components/ArchitectureView';
import { CustomerMenuModal } from './components/CustomerMenuModal';
import { LoginModal } from './components/LoginModal';
import { WaiterView } from './components/WaiterView';
import { DeliveryView } from './components/DeliveryView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { KitchenView } from './components/KitchenView';
import { AdminSimulationView } from './components/AdminSimulationView';
import { OwnerDashboard } from './components/OwnerDashboard';
import { LoginScreen } from './components/LoginScreen';
import { RoleHeader } from './components/RoleHeader';
import { Bell, CheckCircle2 } from 'lucide-react';
import { 
  saveAllDataToFirebase, 
  loadAllDataFromFirebase,
  saveRestaurantToFirebase,
  saveMenuItemToFirebase,
  deleteMenuItemFromFirebase,
  saveCategoryToFirebase,
  saveUserToFirebase,
  saveOrderToFirebase
} from './lib/firebase';

// Helper function to normalize slugs for matching URLs, names, and IDs
export const normalizeSlug = (str?: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// Parse initial URL search parameters synchronously before first render
const getInitialUrlParams = () => {
  if (typeof window === 'undefined') return { isQr: false, restSlug: null, table: undefined, mode: 'DINE_IN' as const };
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const rSlug = urlParams.get('r') || urlParams.get('rest') || urlParams.get('restaurant');
    const table = urlParams.get('mesa') || urlParams.get('table') || urlParams.get('m') || undefined;
    const mode = urlParams.get('mode') === 'DELIVERY' ? ('DELIVERY' as const) : ('DINE_IN' as const);
    return {
      isQr: Boolean(rSlug),
      restSlug: rSlug,
      table,
      mode
    };
  } catch {
    return { isQr: false, restSlug: null, table: undefined, mode: 'DINE_IN' as const };
  }
};

// Load cached initial state synchronously before React component initializes
const getInitialStateFromStorage = () => {
  let cachedRests = INITIAL_RESTAURANTS;
  let cachedCategories = INITIAL_CATEGORIES;
  let cachedItems = INITIAL_MENU_ITEMS;
  let cachedUsers = INITIAL_USERS;
  let cachedOrders = INITIAL_ORDERS;

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('micarta_system_state_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.restaurants?.length) cachedRests = parsed.restaurants;
        if (parsed.categories?.length) cachedCategories = parsed.categories;
        if (parsed.items?.length) cachedItems = parsed.items;
        if (parsed.users?.length) cachedUsers = parsed.users;
        if (parsed.orders?.length) cachedOrders = parsed.orders;
      }
    } catch {
      // Storage read error
    }
  }
  return { cachedRests, cachedCategories, cachedItems, cachedUsers, cachedOrders };
};

const initialState = getInitialStateFromStorage();
const initParams = getInitialUrlParams();

const initialFoundRest = initParams.restSlug 
  ? (initialState.cachedRests.find(r => 
      normalizeSlug(r.slug) === normalizeSlug(initParams.restSlug!) || 
      normalizeSlug(r.id) === normalizeSlug(initParams.restSlug!) ||
      normalizeSlug(r.name) === normalizeSlug(initParams.restSlug!)
    ) || initialState.cachedRests[0])
  : initialState.cachedRests[0];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialState.cachedRests);
  const [categories, setCategories] = useState<MenuCategory[]>(initialState.cachedCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialState.cachedItems);
  const [users, setUsers] = useState<User[]>(initialState.cachedUsers);
  const [orders, setOrders] = useState<Order[]>(initialState.cachedOrders);
  const [templates, setTemplates] = useState<MenuTemplate[]>(INITIAL_MENU_TEMPLATES);
  
  // Selected restaurant filter context (or 'all')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(initialState.cachedRests[0]?.id || 'rest-brasas');
  
  // Authenticated user state: default to null (prompts for DNI and password upon entry)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Active Role Simulator (synced with currentUser)
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN');

  // Customer preview modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(initParams.isQr);
  const [previewRestaurant, setPreviewRestaurant] = useState<Restaurant>(initialFoundRest);
  const [previewMode, setPreviewMode] = useState<'DINE_IN' | 'DELIVERY'>(initParams.mode);
  const [previewTableNumber, setPreviewTableNumber] = useState<string | undefined>(initParams.table);

  // Firebase state
  const [isSavingFirebase, setIsSavingFirebase] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check URL search parameters on initial mount or when restaurants change for QR scanning
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const restaurantSlug = urlParams.get('r') || urlParams.get('rest') || urlParams.get('restaurant');
      const table = urlParams.get('mesa') || urlParams.get('table');
      const mode = urlParams.get('mode') as 'DINE_IN' | 'DELIVERY' | null;

      if (restaurantSlug) {
        const targetSlug = normalizeSlug(restaurantSlug);
        const foundRest = restaurants.find(r => 
          normalizeSlug(r.slug) === targetSlug || 
          normalizeSlug(r.id) === targetSlug || 
          normalizeSlug(r.name) === targetSlug
        );

        if (foundRest) {
          setPreviewRestaurant(foundRest);
          setPreviewMode(mode === 'DELIVERY' ? 'DELIVERY' : 'DINE_IN');
          if (table) setPreviewTableNumber(table);
          setIsCustomerModalOpen(true);
        }
      }
    } catch {
      // Ignored if window not available
    }
  }, [restaurants]);

  // Load from Firebase and LocalStorage fallback on initial mount if data exists
  useEffect(() => {
    // 1. First try loading from LocalStorage for instant zero-latency load
    try {
      const cached = localStorage.getItem('micarta_system_state_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.restaurants?.length) setRestaurants(parsed.restaurants);
        if (parsed.items?.length) setMenuItems(parsed.items);
        if (parsed.categories?.length) setCategories(parsed.categories);
        if (parsed.users?.length) setUsers(parsed.users);
        if (parsed.orders?.length) setOrders(parsed.orders);
      }
    } catch {
      // Local storage read error
    }

    // 2. Sync with remote Firebase Firestore database
    loadAllDataFromFirebase().then(remoteData => {
      if (remoteData) {
        if (remoteData.restaurants?.length) setRestaurants(remoteData.restaurants);
        if (remoteData.items?.length) setMenuItems(remoteData.items);
        if (remoteData.categories?.length) setCategories(remoteData.categories);
        if (remoteData.users?.length) {
          // Merge remote users with initial users to guarantee no accounts are lost
          setUsers(prev => {
            const map = new Map<string, User>();
            prev.forEach(u => map.set(u.id, u));
            remoteData.users.forEach(u => map.set(u.id, u));
            return Array.from(map.values());
          });
        }
        if (remoteData.orders?.length) setOrders(remoteData.orders);
        showToast('✓ Estado de restaurantes, dueños y cartas sincronizado con Firebase');
      }
    }).catch(err => {
      console.warn('Could not auto-load from Firebase:', err);
    });
  }, []);

  // Save to LocalStorage whenever critical data changes as backup
  useEffect(() => {
    try {
      localStorage.setItem('micarta_system_state_v1', JSON.stringify({
        restaurants,
        items: menuItems,
        categories,
        users,
        orders,
      }));
    } catch {
      // Storage quota error ignored
    }
  }, [restaurants, menuItems, categories, users, orders]);

  // Global save to Firebase handler
  const handleSaveAllToFirebase = async () => {
    setIsSavingFirebase(true);
    try {
      const result = await saveAllDataToFirebase({
        restaurants,
        items: menuItems,
        categories,
        users,
        orders,
      });
      if (result.success) {
        showToast('✓ ' + result.message);
      } else {
        showToast('⚠️ ' + result.message);
      }
    } catch (err: any) {
      showToast('Error al guardar en Firebase: ' + (err.message || 'Error'));
    } finally {
      setIsSavingFirebase(false);
    }
  };

  // Login handler
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveRole(user.role);
    if (user.role === 'WAITER' || user.role === 'DELIVERY' || user.role === 'CUSTOMER' || user.role === 'KITCHEN') {
      setActiveTab('home');
    }
    // Auto select first restaurant accessible by this user:
    // "Los dueños, solo podrán ver los restaurantes creados por ellos o si les fueron asignados."
    if (user.role === 'OWNER' || user.role === 'RESTAURANT_MANAGER') {
      const allowed = restaurants.filter(r => r.ownerId === user.id || user.restaurantIds?.includes(r.id) || user.restaurantIds?.includes('all'));
      if (allowed.length > 0) {
        setSelectedRestaurantId(allowed[0].id);
      }
    } else if (user.restaurantIds && user.restaurantIds.length > 0 && user.restaurantIds[0] !== 'all') {
      setSelectedRestaurantId(user.restaurantIds[0]);
    }
    showToast(`Sesión iniciada: ${user.name} (${user.role}) - DNI: ${user.dni}`);
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Has cerrado sesión exitosamente.');
  };

  // Play subtle order sound via Web Audio API
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext might be restricted until user gesture
    }
  };

  // Handlers
  const handleAddRestaurant = (newRestaurant: Restaurant) => {
    setRestaurants(prev => [newRestaurant, ...prev]);
    saveRestaurantToFirebase(newRestaurant);
    if (currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER')) {
      const updatedUser: User = {
        ...currentUser,
        restaurantIds: currentUser.restaurantIds.includes(newRestaurant.id)
          ? currentUser.restaurantIds
          : [...currentUser.restaurantIds, newRestaurant.id]
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      saveUserToFirebase(updatedUser);
    }
    setSelectedRestaurantId(newRestaurant.id);
    showToast(`Restaurante "${newRestaurant.name}" guardado automáticamente.`);
  };

  const handleUpdateRestaurant = (updated: Restaurant) => {
    setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
    if (previewRestaurant && previewRestaurant.id === updated.id) {
      setPreviewRestaurant(updated);
    }
    saveRestaurantToFirebase(updated);
    showToast(`Restaurante "${updated.name}" actualizado.`);
  };

  const handleUpdateMenuItem = (updated: MenuItem) => {
    setMenuItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    saveMenuItemToFirebase(updated);
    showToast(`Plato "${updated.name}" actualizado.`);
  };

  const handleAddMenuItem = (newItem: MenuItem) => {
    setMenuItems(prev => [newItem, ...prev]);
    saveMenuItemToFirebase(newItem);
    showToast(`Nuevo plato "${newItem.name}" guardado automáticamente.`);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(i => i.id !== itemId));
    deleteMenuItemFromFirebase(itemId);
    showToast(`Plato eliminado.`);
  };

  const handleAddCategory = (newCategory: MenuCategory) => {
    setCategories(prev => [...prev, newCategory]);
    saveCategoryToFirebase(newCategory);
    showToast(`Categoría "${newCategory.name}" agregada.`);
  };

  const handleUpdateCategory = (updatedCategory: MenuCategory) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    saveCategoryToFirebase(updatedCategory);
    showToast(`Categoría "${updatedCategory.name}" actualizada.`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    showToast(`Categoría eliminada.`);
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [newUser, ...prev]);
    saveUserToFirebase(newUser);
    showToast(`Usuario "${newUser.name}" (DNI ${newUser.dni}) guardado automáticamente en Firebase.`);
  };

  const handleUpdateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    saveUserToFirebase(updated);
    showToast(`Usuario "${updated.name}" actualizado.`);
  };

  const handleUpdateTemplate = (updated: MenuTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    showToast(`Plantilla "${updated.name}" actualizada con éxito.`);
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders(prev => {
      const updatedList = prev.map(o => {
        if (o.id === orderId) {
          const updatedOrder = { ...o, status: nextStatus };
          saveOrderToFirebase(updatedOrder);
          return updatedOrder;
        }
        return o;
      });
      return updatedList;
    });
    showToast(`Comanda actualizada a estado "${nextStatus}".`);
  };

  const handleCreateOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    saveOrderToFirebase(newOrder);
    playNotificationSound();
    const rest = restaurants.find(r => r.id === newOrder.restaurantId);
    showToast(`🎉 ¡Pedido ${newOrder.orderNumber} enviado a ${rest?.name || 'cocina'}!`);
  };

  const handleSimulateNewOrder = () => {
    const randomRest = restaurants[Math.floor(Math.random() * restaurants.length)];
    const restItems = menuItems.filter(i => i.restaurantId === randomRest.id);
    const item1 = restItems[0] || menuItems[0];
    const item2 = restItems[1] || menuItems[1];

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      restaurantId: randomRest.id,
      orderNumber: `${randomRest.name.substring(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      type: Math.random() > 0.5 ? 'DINE_IN' : 'DELIVERY',
      status: 'PENDING',
      tableNumber: `Mesa ${Math.floor(1 + Math.random() * 15)}`,
      customerName: ['Luciana Ramos', 'Martín Vizcarra', 'Gabriela Mistral', 'Gonzalo Vargas'][Math.floor(Math.random() * 4)],
      items: [
        { 
          id: `oi-${Date.now()}-1`, 
          menuItemId: item1.id, 
          name: item1.name, 
          price: item1.price, 
          quantity: 2,
          units: [
            { unitNumber: 1, observation: 'Término 3/4', selectedAddons: [] },
            { unitNumber: 2, observation: 'Bien cocido', selectedAddons: item1.availableAddons?.slice(0, 1) || [] }
          ]
        },
        { 
          id: `oi-${Date.now()}-2`, 
          menuItemId: item2.id, 
          name: item2.name, 
          price: item2.price, 
          quantity: 1,
          units: [
            { unitNumber: 1, observation: 'Sin picante', selectedAddons: [] }
          ]
        }
      ],
      subtotal: item1.price * 2 + item2.price,
      tax: (item1.price * 2 + item2.price) * 0.18,
      deliveryFee: 0,
      total: (item1.price * 2 + item2.price) * 1.18,
      paymentStatus: 'PENDING',
      createdAt: 'Hace instantes',
      estimatedMinutes: 20
    };

    setOrders(prev => [newOrder, ...prev]);
    playNotificationSound();
    showToast(`🔔 ¡Nueva comanda entrante! ${newOrder.orderNumber} en ${randomRest.name}`);
  };

  const handleOpenCustomerPreview = (restaurant?: Restaurant, mode?: 'DINE_IN' | 'DELIVERY', tableNumber?: string) => {
    const target = restaurant || restaurants.find(r => r.id === selectedRestaurantId) || restaurants[0];
    setPreviewRestaurant(target);
    setPreviewMode(mode || 'DINE_IN');
    setPreviewTableNumber(tableNumber);
    setIsCustomerModalOpen(true);
  };

  // Effective role user for specific role components
  const effectiveWaiterUser = currentUser?.role === 'WAITER' ? currentUser : (users.find(u => u.role === 'WAITER') || users[0]);
  const effectiveKitchenUser = currentUser?.role === 'KITCHEN' ? currentUser : (users.find(u => u.role === 'KITCHEN') || users[0]);
  const effectiveDeliveryUser = currentUser?.role === 'DELIVERY' ? currentUser : (users.find(u => u.role === 'DELIVERY') || users[0]);
  const effectiveCustomerUser = currentUser?.role === 'CUSTOMER' ? currentUser : (users.find(u => u.role === 'CUSTOMER') || users[0]);

  // Restaurants accessible by the current logged-in user
  const userAccessibleRestaurants = currentUser
    ? (currentUser.role === 'ADMIN'
        ? restaurants
        : restaurants.filter(r => r.ownerId === currentUser.id || currentUser.restaurantIds?.includes(r.id) || currentUser.restaurantIds?.includes('all')))
    : restaurants;

  // Current active restaurant branding for dynamic theme accent
  const currentSelectedRest = userAccessibleRestaurants.find(r => r.id === selectedRestaurantId) || userAccessibleRestaurants[0] || restaurants[0];
  const pendingOrdersCount = orders.filter(o => o.status === 'PENDING').length;

  // 1. Initial State: Prompt for DNI and Password if not logged in
  if (!currentUser) {
    // If an anonymous guest arrives via QR code / direct link or clicked "Probar Carta"
    if (isCustomerModalOpen) {
      return (
        <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black">
          <CustomerMenuModal
            isOpen={true}
            onClose={() => setIsCustomerModalOpen(false)}
            restaurant={previewRestaurant}
            categories={categories}
            items={menuItems}
            onOrderCreated={handleCreateOrder}
            initialMode={previewMode}
            initialTableNumber={previewTableNumber}
            onUpdateRestaurant={handleUpdateRestaurant}
            onUpdateMenuItem={handleUpdateMenuItem}
            onAddMenuItem={handleAddMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            onUpdateCategory={handleUpdateCategory}
            onAddCategory={handleAddCategory}
            isOwnerOrAdmin={false}
          />

          {/* Floating Toast Notification */}
          {toastMessage && (
            <div className="fixed top-6 right-4 z-[9999] animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-medium shadow-2xl flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black">
        <LoginScreen
          users={users}
          onLogin={handleLogin}
          restaurants={restaurants}
          onOpenCustomerPreview={handleOpenCustomerPreview}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-medium shadow-2xl flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Non-Admin Role Views: "Las vistas deberán corresponder al rol del usuario que se loguee"
  // "La vista actual, solo será vista cuando el que se loguee sea un administrador"
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black">
        
        {/* Dedicated Role Header with User Profile, Restaurant and Logout */}
        <RoleHeader
          currentUser={currentUser}
          restaurant={currentSelectedRest}
          onLogout={handleLogout}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenCustomerPreview={() => handleOpenCustomerPreview()}
        />

        {/* Role-Specific View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
          
          {/* OWNER & RESTAURANT MANAGER: Full Owner Dashboard with Menus, Tables/QR, Staff, Shifts, Schedules */}
          {(currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER') && (
            <OwnerDashboard
              currentUser={currentUser}
              restaurants={restaurants}
              users={users}
              templates={templates}
              menuItems={menuItems}
              categories={categories}
              onUpdateRestaurant={handleUpdateRestaurant}
              onAddRestaurant={handleAddRestaurant}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onAddMenuItem={handleAddMenuItem}
              onUpdateMenuItem={handleUpdateMenuItem}
              onDeleteMenuItem={handleDeleteMenuItem}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onOpenCustomerPreview={handleOpenCustomerPreview}
              onSwitchToAdminView={() => {
                showToast('Se requieren credenciales de Administrador (DNI: 00448157) para acceder a la vista global SaaS.');
                setIsLoginModalOpen(true);
              }}
            />
          )}

          {/* KITCHEN: Dedicated Kitchen Display System (KDS) & Dish 86 toggle */}
          {currentUser.role === 'KITCHEN' && (
            <KitchenView
              currentUser={currentUser}
              restaurants={restaurants}
              orders={orders}
              menuItems={menuItems}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {/* WAITER: Table management, live orders, waiter call service */}
          {currentUser.role === 'WAITER' && (
            <WaiterView
              currentUser={currentUser}
              restaurants={restaurants}
              orders={orders}
              menuItems={menuItems}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onSimulateNewOrder={handleSimulateNewOrder}
              onOpenCustomerPreview={handleOpenCustomerPreview}
            />
          )}

          {/* DELIVERY: Real-time dispatch, route assignments, driver status */}
          {currentUser.role === 'DELIVERY' && (
            <DeliveryView
              currentUser={currentUser}
              restaurants={restaurants}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {/* CUSTOMER: Digital dining portal, QR scan, order history */}
          {currentUser.role === 'CUSTOMER' && (
            <CustomerPortalView
              currentUser={currentUser}
              restaurants={restaurants}
              orders={orders}
              onOpenCustomerPreview={handleOpenCustomerPreview}
            />
          )}

        </main>

        {/* Interactive Public Digital Menu Preview Modal for Customers */}
        <CustomerMenuModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          restaurant={previewRestaurant}
          categories={categories}
          items={menuItems}
          onOrderCreated={handleCreateOrder}
          initialMode={previewMode}
          initialTableNumber={previewTableNumber}
          onUpdateRestaurant={handleUpdateRestaurant}
          onUpdateMenuItem={handleUpdateMenuItem}
          onAddMenuItem={handleAddMenuItem}
          onDeleteMenuItem={handleDeleteMenuItem}
          onUpdateCategory={handleUpdateCategory}
          onAddCategory={handleAddCategory}
          isOwnerOrAdmin={currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER'}
        />

        {/* Authentication Modal with DNI (8 digits) and Universal Access Key ("12345678") */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          users={users}
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-medium shadow-2xl flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

      </div>
    );
  }

  // 3. ADMIN ROLE VIEW: "La vista actual, solo será vista cuando el que se loguee sea un administrador"
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black">
      
      {/* Top Header with Profile / Login Trigger and Simulación Checkbox */}
      <TopHeader
        restaurants={restaurants}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={setSelectedRestaurantId}
        activeRole={activeRole}
        onRoleChange={(role) => {
          setActiveRole(role);
          // When admin previews another role in the dropdown
          const roleUser = users.find(u => u.role === role);
          if (roleUser) {
            setCurrentUser(roleUser);
          }
        }}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (isSimulationActive) {
            setIsSimulationActive(false);
          }
        }}
        onOpenCustomerPreview={() => handleOpenCustomerPreview()}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isSimulationActive={isSimulationActive}
        onToggleSimulation={(active) => {
          setIsSimulationActive(active);
          if (active) {
            setActiveRole('ADMIN');
            const adminUser = users.find(u => u.role === 'ADMIN') || users[0];
            if (adminUser) setCurrentUser(adminUser);
            showToast('🖥️ Modo Simulación Multi-Pantalla activado (Vista Administrador para PC)');
          } else {
            showToast('Modo Simulación desactivado');
          }
        }}
        onSaveFirebase={handleSaveAllToFirebase}
        isSavingFirebase={isSavingFirebase}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        
        {/* SIMULATION MODE (PC ONLY 3-COLUMN LIVE MOCKUPS) */}
        {isSimulationActive ? (
          <AdminSimulationView
            restaurants={restaurants}
            menuItems={menuItems}
            categories={categories}
            users={users}
            onCloseSimulation={() => setIsSimulationActive(false)}
            onSyncGlobalOrder={(order) => {
              setOrders(prev => {
                const existing = prev.find(o => o.id === order.id);
                if (existing) {
                  return prev.map(o => o.id === order.id ? order : o);
                }
                return [order, ...prev];
              });
            }}
          />
        ) : (
          <>
            {/* View Switching & RBAC Dynamic Routing for Admin */}
            {activeTab === 'home' && (
              <HomeView
                currentUser={currentUser}
                restaurants={restaurants}
                orders={orders}
                users={users}
                templates={templates}
                categories={categories}
                menuItems={menuItems}
                activeRole={activeRole}
                onRoleChange={setActiveRole}
                onNavigateToRestaurants={() => setActiveTab('restaurants')}
                onNavigateToOrders={() => setActiveTab('orders')}
                onOpenCustomerPreview={handleOpenCustomerPreview}
                onUpdateRestaurant={handleUpdateRestaurant}
                onAddRestaurant={handleAddRestaurant}
                onUpdateUser={handleUpdateUser}
                onAddUser={handleAddUser}
                onUpdateTemplate={handleUpdateTemplate}
                onAddMenuItem={handleAddMenuItem}
                onUpdateMenuItem={handleUpdateMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeTab === 'restaurants' && (
              <RestaurantsView
                restaurants={restaurants}
                categories={categories}
                items={menuItems}
                onUpdateRestaurant={handleUpdateRestaurant}
                onUpdateMenuItem={handleUpdateMenuItem}
                onAddMenuItem={handleAddMenuItem}
                onOpenCustomerPreview={handleOpenCustomerPreview}
              />
            )}

            {activeTab === 'users' && (
              <UsersView
                users={users}
                restaurants={restaurants}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView
                orders={orders}
                restaurants={restaurants}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onSimulateNewOrder={handleSimulateNewOrder}
              />
            )}

            {activeTab === 'architecture' && (
              <ArchitectureView />
            )}
          </>
        )}

      </main>

      {/* Floating Bottom Navigation Bar strictly for Admin */}
      <FloatingNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Interactive Public Digital Menu Preview Modal for Customers */}
      <CustomerMenuModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        restaurant={previewRestaurant}
        categories={categories}
        items={menuItems}
        onOrderCreated={handleCreateOrder}
        initialMode={previewMode}
        initialTableNumber={previewTableNumber}
        onUpdateRestaurant={handleUpdateRestaurant}
        onUpdateMenuItem={handleUpdateMenuItem}
        onAddMenuItem={handleAddMenuItem}
        onDeleteMenuItem={handleDeleteMenuItem}
        onUpdateCategory={handleUpdateCategory}
        onAddCategory={handleAddCategory}
        isOwnerOrAdmin={Boolean(currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER'))}
      />

      {/* Authentication Modal with DNI (8 digits) and Universal Access Key ("12345678") */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-medium shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}
