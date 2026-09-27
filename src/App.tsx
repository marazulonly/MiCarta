import React, { useState, useEffect } from 'react';
import { 
  CEVICHITO_PLIZ_LOGO_SVG,
  VORAZ_LOGO_SVG,
  RIENDAS_DE_PLATA_LOGO_SVG
} from './data/mockData';
import { INITIAL_MENU_TEMPLATES } from './data/menuTemplatesData';
import { Restaurant, MenuCategory, MenuItem, User, Order, TabType, UserRole, OrderStatus, MenuTemplate, RestaurantMetrics, RestaurantBranding } from './types';
import { deduplicateUsers } from './lib/userUtils';
import { TopHeader } from './components/TopHeader';
import { FloatingNavBar } from './components/FloatingNavBar';
import { HomeView } from './components/HomeView';
import { RestaurantsView } from './components/RestaurantsView';
import { UsersView } from './components/UsersView';
import { OrdersView } from './components/OrdersView';
import { ArchitectureView } from './components/ArchitectureView';
import { CustomerMenuModal } from './components/CustomerMenuModal';
import { WaiterView } from './components/WaiterView';
import { DeliveryView } from './components/DeliveryView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { KitchenView } from './components/KitchenView';
import { AdminSimulationView } from './components/AdminSimulationView';
import { OwnerDashboard } from './components/OwnerDashboard';
import { LoginScreen } from './components/LoginScreen';
import { RoleHeader } from './components/RoleHeader';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { TemplateSplitEditor } from './components/TemplateSplitEditor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EmptyRestaurantState } from './components/EmptyRestaurantState';
import { LoadingRestaurantState } from './components/LoadingRestaurantState';
import { CustomerActiveOrderModal } from './components/CustomerActiveOrderModal';
import { getSafeActiveRestaurant, getSafeBranding, DEFAULT_BRANDING, DEFAULT_MENU_ACCESS_SETTINGS } from './utils/restaurantUtils';
import { Bell, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import {
  fetchLatestCloudMenu,
  saveFullCloudMenu,
  autoSyncMenuItem,
  autoDeleteMenuItem,
  autoSyncRestaurant,
  autoDeleteRestaurant,
  autoSyncCategory,
  autoDeleteCategory,
  autoSyncUser,
  autoDeleteUser,
  publishRestaurantMenu,
  fetchPublicPublishedMenu,
  subscribeToCloudUpdates,
  autoSyncOrder,
  autoUpdateOrderStatus,
} from './lib/cloudSync';

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

// Helper function to locate a restaurant strictly by slug, ID, or name
export const findRestaurantBySlug = (restaurantsList: Restaurant[], querySlug?: string | null): Restaurant | null => {
  if (!querySlug || !Array.isArray(restaurantsList)) return null;
  const target = normalizeSlug(querySlug);
  if (!target) return null;

  // Strict exact match by slug, id, or normalized name
  const exact = restaurantsList.find(r => 
    normalizeSlug(r.slug) === target || 
    normalizeSlug(r.id) === target || 
    normalizeSlug(r.name) === target
  );

  return exact || null;
};

// Parse initial URL search parameters synchronously before first render
const getInitialUrlParams = () => {
  if (typeof window === 'undefined') return { isQr: false, restSlug: null, table: undefined, mode: 'DINE_IN' as const, isStaffLogin: false };
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const rSlug = urlParams.get('r') || urlParams.get('rest') || urlParams.get('restaurant');
    const table = urlParams.get('mesa') || urlParams.get('table') || urlParams.get('m') || undefined;
    const mode = urlParams.get('mode') === 'DELIVERY' ? ('DELIVERY' as const) : ('DINE_IN' as const);
    const isStaffLogin = Boolean(
      urlParams.get('admin') || 
      urlParams.get('login') || 
      urlParams.get('staff') || 
      urlParams.get('panel') ||
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/login')
    );
    return {
      isQr: Boolean(rSlug),
      restSlug: rSlug,
      table,
      mode,
      isStaffLogin
    };
  } catch {
    return { isQr: false, restSlug: null, table: undefined, mode: 'DINE_IN' as const, isStaffLogin: false };
  }
};

// Sanitization function that preserves 100% of user modifications from cloud storage without mock data injection
function sanitizeRestaurants(rests: Restaurant[]): Restaurant[] {
  if (!Array.isArray(rests)) return [];
  const map = new Map<string, Restaurant>();
  rests.forEach(r => {
    if (!r || !r.id) return;
    const cleanSlug = r.slug ? normalizeSlug(r.slug) : normalizeSlug(r.name);
    const safeMetrics: RestaurantMetrics = {
      dailyRevenue: 0,
      activeOrders: 0,
      avgTicket: 0,
      customerRating: 5.0,
      totalTables: r.totalTablesCount || (r.tables?.length) || 10,
      occupancyRate: 0,
      ...(r.metrics || {})
    };
    const safeBranding: RestaurantBranding = {
      ...DEFAULT_BRANDING,
      ...(r.branding || {})
    };
    if (r.logoUrl && !safeBranding.headerLogoUrl) {
      safeBranding.headerLogoUrl = r.logoUrl;
    }
    const safeRest: Restaurant = {
      ...r,
      slug: cleanSlug,
      branding: safeBranding,
      metrics: safeMetrics,
      logoUrl: r.logoUrl || safeBranding.headerLogoUrl || '',
      menuAccessSettings: r.menuAccessSettings || DEFAULT_MENU_ACCESS_SETTINGS,
      tables: Array.isArray(r.tables) ? r.tables : [],
      weeklySchedule: Array.isArray(r.weeklySchedule) ? r.weeklySchedule : [],
      shifts: Array.isArray(r.shifts) ? r.shifts : []
    };
    map.set(r.id, safeRest);
  });
  return Array.from(map.values());
}

function sanitizeMenuItems(items: MenuItem[]): MenuItem[] {
  // Preserve user dish modifications exactly as stored in cloud
  return items;
}

// Helper to reliably merge menu items: remote cloud data is strictly authoritative
function mergeRemoteWithLocal(remoteItems: MenuItem[], fallbackLocal: MenuItem[]): MenuItem[] {
  const cleanRemote = sanitizeMenuItems(remoteItems);
  const remoteRestIds = new Set(cleanRemote.map(i => i.restaurantId).filter(Boolean));
  const remainingFallbacks = fallbackLocal.filter(i => !remoteRestIds.has(i.restaurantId));
  const map = new Map<string, MenuItem>();
  remainingFallbacks.forEach(it => {
    if (it && it.id) map.set(it.id, it);
  });
  cleanRemote.forEach(it => {
    if (it && it.id) map.set(it.id, it);
  });
  return Array.from(map.values());
}

function mergeRemoteCategoriesWithLocal(remoteCats: MenuCategory[], fallbackLocal: MenuCategory[]): MenuCategory[] {
  const remoteRestIds = new Set(remoteCats.map(c => c.restaurantId).filter(Boolean));
  const remainingFallbacks = fallbackLocal.filter(c => !remoteRestIds.has(c.restaurantId));
  const map = new Map<string, MenuCategory>();
  remainingFallbacks.forEach(c => {
    if (c && c.id) map.set(c.id, c);
  });
  remoteCats.forEach(c => {
    if (c && c.id) map.set(c.id, c);
  });
  return Array.from(map.values());
}

// Helper to reliably merge menu items by unique ID preserving manually entered and recovered dishes
function mergeMenuItemsById(baseList: MenuItem[], overrideList: MenuItem[]): MenuItem[] {
  const map = new Map<string, MenuItem>();
  baseList.forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  overrideList.forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values());
}

// Storage cache keys for instant offline-first persistence across all reloads
const STORAGE_KEYS = {
  RESTS: 'micarta_restaurants_v2',
  ITEMS: 'micarta_menu_items_v2',
  CATEGORIES: 'micarta_categories_v2',
  USERS: 'micarta_users_v2',
  ORDERS: 'micarta_orders_v2',
  AUTH: 'micarta_logged_user_v2'
};

function getInitialStorageState() {
  let cachedRests: Restaurant[] = [];
  let cachedCategories: MenuCategory[] = [];
  let cachedItems: MenuItem[] = [];
  let cachedUsers: User[] = [];
  let cachedOrders: Order[] = [];
  let cachedAuth: User | null = null;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (storedOrders) {
        cachedOrders = JSON.parse(storedOrders);
      }
      const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (storedAuth) {
        cachedAuth = JSON.parse(storedAuth);
        if (cachedAuth && (cachedAuth.id === 'u-owner-alonso' || cachedAuth.dni === '94639300')) {
          cachedAuth.restaurantIds = Array.isArray(cachedAuth.restaurantIds)
            ? cachedAuth.restaurantIds.filter(id => id !== 'all' && id !== 'rest-costa' && id !== 'rest-1790204393895')
            : [];
        }
      }
    } catch (e) {
      console.warn('[Storage] Error reading initial cache:', e);
    }
  }

  return {
    cachedRests,
    cachedCategories,
    cachedItems,
    cachedUsers,
    cachedOrders,
    cachedAuth
  };
}

const initialState = getInitialStorageState();
const initParams = getInitialUrlParams();

const initialRequestedSlug = initParams.restSlug;
const initialFoundRest = null;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialState.cachedOrders);
  const [templates, setTemplates] = useState<MenuTemplate[]>(INITIAL_MENU_TEMPLATES);
  
  // Selected restaurant filter context (or 'all')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [ownerActiveSubTab, setOwnerActiveSubTab] = useState<string>('sales_monitor');
  
  // Authenticated user state: default to cachedAuth or null (prompts for DNI and password upon entry)
  const [currentUser, setCurrentUser] = useState<User | null>(initialState.cachedAuth);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  // Active Role Simulator (synced with currentUser)
  const [activeRole, setActiveRole] = useState<UserRole>(initialState.cachedAuth?.role || 'ADMIN');

  // Customer preview modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isMenuClosedByGuest, setIsMenuClosedByGuest] = useState<boolean>(false);
  const [isTemplateSplitEditorOpen, setIsTemplateSplitEditorOpen] = useState<boolean>(false);
  const [previewRestaurant, setPreviewRestaurant] = useState<Restaurant | null>(null);
  const [previewMode, setPreviewMode] = useState<'DINE_IN' | 'DELIVERY'>(initParams.mode);
  const [previewTableNumber, setPreviewTableNumber] = useState<string | undefined>(initParams.table);
  const [notFoundSlugError, setNotFoundSlugError] = useState<string | null>(null);

  // Authoritative Published Menu state for public anonymous visitors and QR diners
  const [publishedMenuData, setPublishedMenuData] = useState<{
    published: boolean;
    version: number;
    publishedAt: string;
    restaurant: Restaurant;
    categories: MenuCategory[];
    items: MenuItem[];
  } | null>(null);
  const [isLoadingPublishedMenu, setIsLoadingPublishedMenu] = useState<boolean>(Boolean(initialRequestedSlug));
  const [isInitialCloudFetchDone, setIsInitialCloudFetchDone] = useState<boolean>(false);

  // Active Customer Order Tracking (persists until served/cancelled for floating "Ver Pedido" button)
  const [customerActiveOrderId, setCustomerActiveOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('micarta_active_order_id');
    }
    return null;
  });
  const [isCustomerActiveOrderModalOpen, setIsCustomerActiveOrderModalOpen] = useState<boolean>(false);

  // Keep user authentication session synced
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    } catch {}
  }, [currentUser]);

  // Keep orders synced to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  }, [orders]);

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
      const restaurantSlug = urlParams.get('r') || urlParams.get('rest') || urlParams.get('restaurant') || initialRequestedSlug;
      const table = urlParams.get('mesa') || urlParams.get('table');
      const mode = urlParams.get('mode') as 'DINE_IN' | 'DELIVERY' | null;

      if (restaurantSlug) {
        setIsLoadingPublishedMenu(true);
        fetchPublicPublishedMenu(restaurantSlug).then(pub => {
          if (pub && pub.success && pub.restaurant) {
            setPublishedMenuData(pub);
            setPreviewRestaurant(pub.restaurant);
            setPreviewMode(mode === 'DELIVERY' ? 'DELIVERY' : 'DINE_IN');
            if (table) setPreviewTableNumber(table);
            setIsCustomerModalOpen(true);
            setNotFoundSlugError(null);
          } else {
            setPreviewRestaurant(null);
            setPublishedMenuData(null);
            setIsCustomerModalOpen(false);
            setNotFoundSlugError(restaurantSlug);
          }
        }).catch(() => {
          setPreviewRestaurant(null);
          setPublishedMenuData(null);
          setIsCustomerModalOpen(false);
          setNotFoundSlugError(restaurantSlug);
        }).finally(() => {
          setIsLoadingPublishedMenu(false);
        });
      }
    } catch {
      // Ignored if window not available
    }
  }, [restaurants]);

  // Direct cloud fetch (combining Server cloud storage & Firestore) and Real-time SSE subscription
  useEffect(() => {
    let isMounted = true;

    // 1. Initial Cloud Fetch from authoritative backend
    fetchLatestCloudMenu().then(cloudData => {
      if (!isMounted) return;

      const cleanLoadedRests = cloudData?.restaurants && Array.isArray(cloudData.restaurants)
        ? sanitizeRestaurants(cloudData.restaurants.filter((r: any) => r && r.id))
        : [];
      const cleanLoadedUsers = cloudData?.users && Array.isArray(cloudData.users)
        ? cloudData.users.filter((u: any) => u && u.id && u.dni)
        : [];
      const cleanLoadedCategories = cloudData?.categories && Array.isArray(cloudData.categories)
        ? cloudData.categories.filter((c: any) => c && c.id && c.name)
        : [];
      const cleanLoadedItems = cloudData?.items && Array.isArray(cloudData.items)
        ? sanitizeMenuItems(cloudData.items.filter((i: any) => i && i.id && i.name && i.price !== undefined))
        : [];
      const cleanLoadedOrders = cloudData?.orders && Array.isArray(cloudData.orders)
        ? cloudData.orders
        : [];

      setRestaurants(cleanLoadedRests);
      setCategories(cleanLoadedCategories);
      setMenuItems(cleanLoadedItems);
      setUsers(deduplicateUsers(cleanLoadedUsers));
      setOrders(cleanLoadedOrders);

      // Verify and synchronize currentUser with verified cloud users
      if (currentUser) {
        const fresh = cleanLoadedUsers.find(u => u.id === currentUser.id || (u.dni && u.dni === currentUser.dni));
        if (fresh) {
          setCurrentUser(fresh);
        } else {
          setCurrentUser(null);
        }
      }

      // If accessing via link/slug, locate the restaurant in verified cloud data
      if (initialRequestedSlug && cleanLoadedRests.length > 0) {
        const match = findRestaurantBySlug(cleanLoadedRests, initialRequestedSlug);
        if (match) {
          setPreviewRestaurant(match);
          const restCats = cleanLoadedCategories.filter(c => c && c.restaurantId === match.id);
          const restItems = cleanLoadedItems.filter(i => i && i.restaurantId === match.id);
          setPublishedMenuData({
            published: true,
            version: 1,
            publishedAt: new Date().toISOString(),
            restaurant: match,
            categories: restCats,
            items: restItems
          });
          setNotFoundSlugError(null);
        }
      }
      
      setIsInitialCloudFetchDone(true);
    }).catch(err => {
      console.warn('[CloudSync] Notice during initial remote fetch:', err);
    }).finally(() => {
      if (isMounted) {
        setIsInitialCloudFetchDone(true);
      }
    });

    // 2. Real-time Subscription: updates all sessions and incognito windows instantly when any change occurs
    const unsubscribe = subscribeToCloudUpdates((event) => {
      if (!isMounted) return;
      if (event.type === 'FULL_SYNC' && event.data) {
        const d = event.data;
        if (d.restaurants && Array.isArray(d.restaurants) && d.restaurants.length > 0) {
          const cleanR = sanitizeRestaurants(d.restaurants);
          setRestaurants(prev => {
            const map = new Map<string, Restaurant>();
            cleanR.forEach(r => { if (r?.id) map.set(r.id, r); });
            prev.forEach(r => { if (r?.id && !map.has(r.id)) map.set(r.id, r); });
            return Array.from(map.values());
          });
          setPreviewRestaurant(p => {
            if (initialRequestedSlug) {
              const match = findRestaurantBySlug(cleanR, initialRequestedSlug);
              if (match) return match;
              return p;
            }
            return p ? (cleanR.find(r => r.id === p.id) || p) : null;
          });
        }
        if (d.categories && Array.isArray(d.categories)) {
          setCategories(prev => {
            const map = new Map<string, MenuCategory>();
            d.categories.forEach((c: MenuCategory) => { if (c?.id) map.set(c.id, c); });
            prev.forEach(c => { if (c?.id && !map.has(c.id)) map.set(c.id, c); });
            return Array.from(map.values());
          });
        }
        if (d.items && Array.isArray(d.items)) {
          const cleanItems = sanitizeMenuItems(d.items);
          setMenuItems(prev => {
            const map = new Map<string, MenuItem>();
            cleanItems.forEach((i: MenuItem) => { if (i?.id) map.set(i.id, i); });
            prev.forEach(i => { if (i?.id && !map.has(i.id)) map.set(i.id, i); });
            return Array.from(map.values());
          });
        }
        if (d.users && Array.isArray(d.users)) {
          setUsers(prev => {
            const map = new Map<string, User>();
            d.users.forEach((u: User) => {
              const key = u.id || (u.dni ? `dni-${u.dni}` : null);
              if (key) map.set(key, u);
            });
            prev.forEach(u => {
              const key = u.id || (u.dni ? `dni-${u.dni}` : null);
              if (key && !map.has(key)) map.set(key, u);
            });
            return deduplicateUsers(Array.from(map.values()));
          });
        }
        if (d.orders && Array.isArray(d.orders)) {
          setOrders(d.orders);
        }
      } else if (event.type === 'MENU_PUBLISHED') {
        const targetId = event.restaurantId || event.slug;
        if (targetId) {
          fetchPublicPublishedMenu(targetId).then(pubData => {
            if (pubData && pubData.restaurant) {
              setPublishedMenuData(pubData);
              if (previewRestaurant && (previewRestaurant.id === pubData.restaurant.id || previewRestaurant.slug === pubData.restaurant.slug)) {
                setPreviewRestaurant(pubData.restaurant);
              }
            }
          });
        }
      } else if (event.type === 'ITEM_UPDATED' && event.item) {
        setMenuItems(prev => {
          const idx = prev.findIndex(i => i.id === event.item!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = event.item!;
            return next;
          }
          return [event.item!, ...prev];
        });
      } else if (event.type === 'ITEM_DELETED' && event.itemId) {
        setMenuItems(prev => prev.filter(i => i.id !== event.itemId));
      } else if (event.type === 'RESTAURANT_UPDATED' && event.restaurant) {
        setRestaurants(prev => {
          const idx = prev.findIndex(r => r.id === event.restaurant!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = event.restaurant!;
            return next;
          }
          return [event.restaurant!, ...prev];
        });
        setPreviewRestaurant(prev => (prev && prev.id === event.restaurant!.id ? event.restaurant! : prev));
      } else if (event.type === 'CATEGORY_UPDATED' && event.category) {
        setCategories(prev => {
          const idx = prev.findIndex(c => c.id === event.category!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = event.category!;
            return next;
          }
          return [...prev, event.category!];
        });
      } else if (event.type === 'CATEGORY_DELETED' && event.categoryId) {
        setCategories(prev => prev.filter(c => c.id !== event.categoryId));
      } else if (event.type === 'USER_UPDATED' && event.user) {
        setUsers(prev => deduplicateUsers(prev.map(u => (u.id === event.user!.id || (event.user!.dni && u.dni === event.user!.dni)) ? event.user! : u)));
        if (currentUser && (currentUser.id === event.user.id || (event.user.dni && currentUser.dni === event.user.dni))) {
          setCurrentUser(event.user);
        }
      } else if (event.type === 'USER_DELETED' && event.userId) {
        setUsers(prev => prev.filter(u => u.id !== event.userId));
      } else if (event.type === 'ORDER_CREATED' && event.order) {
        setOrders(prev => {
          const exists = prev.some(o => o.id === event.order!.id);
          if (exists) return prev;
          return [event.order!, ...prev];
        });
        playNotificationSound();
        const rest = (restaurants || []).find(r => r && r.id === event.order!.restaurantId);
        showToast(`🔔 ¡Nueva comanda recibida en tiempo real! ${event.order!.orderNumber} (${rest?.name || 'Restaurante'})`);
      } else if (event.type === 'ORDER_UPDATED' && event.order) {
        setOrders(prev => prev.map(o => o.id === event.order!.id ? event.order! : o));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser]);

  // Keep previewRestaurant synchronized with restaurants array whenever restaurants update
  useEffect(() => {
    if (previewRestaurant) {
      const match = (restaurants || []).find(r => r && r.id === previewRestaurant.id);
      if (match && JSON.stringify(match) !== JSON.stringify(previewRestaurant)) {
        setPreviewRestaurant(match);
      }
    }
  }, [restaurants, previewRestaurant]);

  // Synchronize currentUser whenever users or restaurants are updated
  useEffect(() => {
    if (currentUser) {
      const freshUser = users.find(u => u.id === currentUser.id || (u.dni && u.dni === currentUser.dni));
      if (freshUser) {
        if (JSON.stringify(freshUser.restaurantIds) !== JSON.stringify(currentUser.restaurantIds)) {
          setCurrentUser(freshUser);
        }
      }
    }
  }, [users, currentUser]);

  // Login handler
  const handleLogin = (rawUser: User) => {
    if (!rawUser) return;
    const isOwnerRole = rawUser.role === 'OWNER' || rawUser.role === 'RESTAURANT_MANAGER';
    const isAdminRole = rawUser.role === 'ADMIN';

    const user: User = {
      ...rawUser,
      id: rawUser.id || `usr-${Date.now()}`,
      name: rawUser.name || 'Usuario',
      email: rawUser.email || 'usuario@micarta.pe',
      dni: String(rawUser.dni || '00000000'),
      role: rawUser.role || 'ADMIN',
      phone: rawUser.phone || '900000000',
      avatar: rawUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      restaurantIds: Array.isArray(rawUser.restaurantIds) ? rawUser.restaurantIds.filter(Boolean) : [],
      status: rawUser.status || 'active',
      lastActive: rawUser.lastActive || 'Ahora mismo'
    };

    setCurrentUser(user);
    setActiveRole(user.role);
    if (user.role === 'WAITER' || user.role === 'DELIVERY' || user.role === 'CUSTOMER' || user.role === 'KITCHEN') {
      setActiveTab('home');
    }
    if (isOwnerRole) {
      const userAccessible = safeRestaurants.filter(r => r && (
        (r.ownerId && (r.ownerId === user.id || (user.email && r.ownerId === user.email))) ||
        (Array.isArray(user.restaurantIds) && user.restaurantIds.includes(r.id))
      ));
      if (userAccessible.length > 0) {
        setSelectedRestaurantId(userAccessible[0].id);
      } else {
        setSelectedRestaurantId('');
      }
    } else if (!isAdminRole && user.restaurantIds && user.restaurantIds.length > 0 && user.restaurantIds[0] !== 'all') {
      setSelectedRestaurantId(user.restaurantIds[0]);
    } else if (safeRestaurants.length > 0) {
      setSelectedRestaurantId(safeRestaurants[0].id);
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
  // Helper to force automatic cloud publication of a specific restaurant
  const triggerCloudUpdate = async (restaurantId: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return;

    // Ensure slug is normalized before sending to cloud
    const normalizedRest = {
      ...restaurant,
      slug: normalizeSlug(restaurant.slug)
    };

    const filterCats = categories.filter(c => c.restaurantId === restaurantId);
    const filterItems = menuItems.filter(i => i.restaurantId === restaurantId);

    try {
      await publishRestaurantMenu(restaurantId, normalizedRest, filterCats, filterItems, currentUser?.name || 'Administrador');
    } catch (e) {
      console.error('Error triggering cloud update:', e);
    }
  };

  const handleAddRestaurant = (newRestaurant: Restaurant) => {
    // Unique name validation
    const cleanName = newRestaurant.name.trim();
    if (restaurants.some(r => r.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      showToast(`Error: Ya existe un restaurante con el nombre "${cleanName}".`);
      return;
    }

    // Ensure the new restaurant has at least 1 default category
    const hasCategory = categories.some(c => c.restaurantId === newRestaurant.id);
    const defaultCat: MenuCategory = {
      id: `cat-${newRestaurant.id}-general`,
      restaurantId: newRestaurant.id,
      name: 'De la Casa',
      sortOrder: 1,
      isActive: true,
    };
    const nextCategories = hasCategory ? categories : [...categories, defaultCat];
    if (!hasCategory) {
      setCategories(nextCategories);
      autoSyncCategory(defaultCat);
    }

    const nextRestaurants = [newRestaurant, ...restaurants];
    setRestaurants(nextRestaurants);
    autoSyncRestaurant(newRestaurant);

    // If an owner created this restaurant or it's assigned, ensure owner has it
    let nextUsers = users;
    const targetOwnerId = newRestaurant.ownerId || (currentUser?.role === 'OWNER' ? currentUser.id : null);
    if (targetOwnerId) {
      nextUsers = users.map(u => {
        if (u.id === targetOwnerId || (currentUser && u.id === currentUser.id)) {
          const currentIds = u.restaurantIds || [];
          return {
            ...u,
            restaurantIds: currentIds.includes(newRestaurant.id) ? currentIds : [...currentIds, newRestaurant.id]
          };
        }
        return u;
      });
      setUsers(nextUsers);
      const updatedUser = nextUsers.find(u => u.id === targetOwnerId);
      if (updatedUser) autoSyncUser(updatedUser);
      if (currentUser && (currentUser.id === targetOwnerId || currentUser.role === 'OWNER')) {
        setCurrentUser(prev => prev ? {
          ...prev,
          restaurantIds: (prev.restaurantIds || []).includes(newRestaurant.id) ? prev.restaurantIds : [...(prev.restaurantIds || []), newRestaurant.id]
        } : null);
      }
    }

    // Full atomic persistence to server disk and remote backup
    saveFullCloudMenu({
      restaurants: nextRestaurants,
      categories: nextCategories,
      items: menuItems,
      users: nextUsers,
      orders
    }).catch(() => {});
    
    triggerCloudUpdate(newRestaurant.id);

    setSelectedRestaurantId(newRestaurant.id);
    showToast(`Restaurante "${newRestaurant.name}" creado y guardado permanentemente.`);
  };

  const handleUpdateRestaurant = (updated: Restaurant) => {
    const prevRest = (restaurants || []).find(r => r && r.id === updated.id);
    const prevOwnerId = prevRest?.ownerId;
    const newOwnerId = updated.ownerId;

    // Unique name validation against other restaurants
    const cleanName = updated.name.trim();
    if (restaurants.some(r => r.id !== updated.id && r.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      showToast(`Error: Ya existe otro restaurante con el nombre "${cleanName}".`);
      return;
    }

    const nextRestaurants = restaurants.map(r => r.id === updated.id ? updated : r);
    setRestaurants(nextRestaurants);
    if (previewRestaurant && previewRestaurant.id === updated.id) {
      setPreviewRestaurant(updated);
    }

    let nextUsers = users;

    // If owner was reassigned, update users state
    if (prevOwnerId && prevOwnerId !== newOwnerId) {
      nextUsers = users.map(u => {
        if (u.id === prevOwnerId) {
          const updatedUser: User = {
            ...u,
            restaurantIds: (u.restaurantIds || []).filter(id => id !== updated.id)
          };
          autoSyncUser(updatedUser);
          return updatedUser;
        }
        if (u.id === newOwnerId) {
          const updatedUser: User = {
            ...u,
            restaurantIds: (u.restaurantIds || []).includes(updated.id)
              ? u.restaurantIds
              : [...(u.restaurantIds || []), updated.id]
          };
          autoSyncUser(updatedUser);
          return updatedUser;
        }
        return u;
      });
      setUsers(nextUsers);
    } else if (newOwnerId) {
      // Ensure the designated owner has this restaurant in their list
      nextUsers = users.map(u => {
        if (u.id === newOwnerId && !(u.restaurantIds || []).includes(updated.id)) {
          const updatedUser: User = {
            ...u,
            restaurantIds: [...(u.restaurantIds || []), updated.id]
          };
          autoSyncUser(updatedUser);
          return updatedUser;
        }
        return u;
      });
      setUsers(nextUsers);
    }

    autoSyncRestaurant(updated);
    publishRestaurantMenu(updated.id, updated, categories, menuItems).catch(() => {});
    saveFullCloudMenu({
      restaurants: nextRestaurants,
      categories,
      items: menuItems,
      users: nextUsers,
      orders
    }).catch(() => {});

    showToast(`✓ Restaurante "${updated.name}" actualizado y sincronizado en la nube.`);
  };

  const handleDeleteRestaurant = (restaurantId: string) => {
    const targetRest = (restaurants || []).find(r => r && r.id === restaurantId);
    const restName = targetRest ? targetRest.name : 'Restaurante';

    // 1. Remove from restaurants state
    const nextRestaurants = (restaurants || []).filter(r => r && r.id !== restaurantId);
    setRestaurants(nextRestaurants);

    // 2. If previewing or selected, reset
    if (selectedRestaurantId === restaurantId) {
      setSelectedRestaurantId(nextRestaurants[0]?.id || '');
    }
    if (previewRestaurant && previewRestaurant.id === restaurantId) {
      setPreviewRestaurant(null);
    }

    // 3. Clean user restaurant assignments
    const nextUsers = users.map(u => {
      if (u.restaurantIds && u.restaurantIds.includes(restaurantId)) {
        return {
          ...u,
          restaurantIds: u.restaurantIds.filter(id => id !== restaurantId)
        };
      }
      return u;
    });
    setUsers(nextUsers);

    if (currentUser && currentUser.restaurantIds && currentUser.restaurantIds.includes(restaurantId)) {
      setCurrentUser(prev => prev ? {
        ...prev,
        restaurantIds: prev.restaurantIds.filter(id => id !== restaurantId)
      } : null);
    }

    const nextItems = menuItems.filter(i => i.restaurantId !== restaurantId);
    const nextCategories = categories.filter(c => c.restaurantId !== restaurantId);

    // 4. Delete from Cloud
    autoDeleteRestaurant(restaurantId).catch(() => {});
    saveFullCloudMenu({
      restaurants: nextRestaurants,
      items: nextItems,
      categories: nextCategories,
      users: nextUsers,
      orders
    });

    showToast(`Restaurante "${restName}" eliminado exitosamente.`);
  };

  const handleUpdateMenuItem = (updated: MenuItem) => {
    const nextItems = menuItems.map(i => i.id === updated.id ? updated : i);
    setMenuItems(nextItems);
    autoSyncMenuItem(updated);
    saveFullCloudMenu({ restaurants, categories, items: nextItems, users, orders }).catch(() => {});
    triggerCloudUpdate(updated.restaurantId);
    showToast(`✓ Plato "${updated.name}" actualizado y guardado en la nube.`);
  };

  const handleAddMenuItem = (newItem: MenuItem) => {
    const nextItems = [newItem, ...menuItems.filter(i => i.id !== newItem.id)];
    setMenuItems(nextItems);
    autoSyncMenuItem(newItem);
    saveFullCloudMenu({ restaurants, categories, items: nextItems, users, orders }).catch(() => {});
    triggerCloudUpdate(newItem.restaurantId);
    showToast(`✓ Plato "${newItem.name}" creado y guardado permanentemente en la nube.`);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    const updatedItems = menuItems.filter(i => i.id !== itemId);
    setMenuItems(updatedItems);
    autoDeleteMenuItem(itemId);
    saveFullCloudMenu({ restaurants, categories, items: updatedItems, users, orders });
    showToast(`✓ Plato eliminado y actualizado en la nube.`);
  };

  const handleReorderCategories = (reorderedCats: MenuCategory[]) => {
    const restId = reorderedCats[0]?.restaurantId;
    if (!restId) return;
    const otherCats = categories.filter(c => c.restaurantId !== restId);
    const updatedList = [...otherCats, ...reorderedCats];
    setCategories(updatedList);
    saveFullCloudMenu({ categories: updatedList, restaurants, items: menuItems, users, orders });
    showToast(`✓ Orden de categorías guardado en la nube.`);
  };

  const handleReorderMenuItems = (reorderedItems: MenuItem[]) => {
    const restId = reorderedItems[0]?.restaurantId;
    if (!restId) return;
    const reorderedMap = new Map<string, MenuItem>();
    reorderedItems.forEach(item => reorderedMap.set(item.id, item));

    const otherItems = menuItems.filter(i => i.restaurantId !== restId);
    const existingRestItemsNotInReordered = menuItems.filter(i => i.restaurantId === restId && !reorderedMap.has(i.id));

    const updatedList = [...otherItems, ...reorderedItems, ...existingRestItemsNotInReordered];
    setMenuItems(updatedList);
    saveFullCloudMenu({ items: updatedList, restaurants, categories, users, orders });
    showToast(`✓ Orden de platos guardado en la nube.`);
  };

  const handleAddCategory = (newCategory: MenuCategory) => {
    const nextCategories = [...categories.filter(c => c.id !== newCategory.id), newCategory];
    setCategories(nextCategories);
    autoSyncCategory(newCategory);
    saveFullCloudMenu({ restaurants, categories: nextCategories, items: menuItems, users, orders }).catch(() => {});
    triggerCloudUpdate(newCategory.restaurantId);
    showToast(`✓ Categoría "${newCategory.name}" agregada y guardada en la nube.`);
  };

  const handleUpdateCategory = (updatedCategory: MenuCategory) => {
    const nextCategories = categories.map(c => c.id === updatedCategory.id ? updatedCategory : c);
    setCategories(nextCategories);
    autoSyncCategory(updatedCategory);
    saveFullCloudMenu({ restaurants, categories: nextCategories, items: menuItems, users, orders }).catch(() => {});
    triggerCloudUpdate(updatedCategory.restaurantId);
    showToast(`✓ Categoría "${updatedCategory.name}" actualizada en la nube.`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    setCategories(updatedCategories);
    autoDeleteCategory(categoryId);
    saveFullCloudMenu({ restaurants, categories: updatedCategories, items: menuItems, users, orders });
    showToast(`✓ Categoría eliminada de la nube.`);
  };

  const handleAddUser = (newUser: User) => {
    const nextUsers = deduplicateUsers([newUser, ...users]);
    setUsers(nextUsers);
    autoSyncUser(newUser);
    saveFullCloudMenu({ restaurants, categories, items: menuItems, users: nextUsers, orders });
    showToast(`✓ Usuario "${newUser.name}" (DNI ${newUser.dni}) guardado permanentemente.`);
  };

  const handleUpdateUser = (updated: User) => {
    const nextUsers = deduplicateUsers(users.map(u => u.id === updated.id ? updated : u));
    setUsers(nextUsers);
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
    if (currentUser?.id === updated.id) {
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(updated));
      } catch {}
    }
    autoSyncUser(updated);
    saveFullCloudMenu({ restaurants, categories, items: menuItems, users: nextUsers, orders });
    showToast(`✓ Usuario "${updated.name}" actualizado y guardado permanentemente.`);
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    const nextUsers = users.filter(u => u.id !== userId);
    setUsers(nextUsers);
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    if (currentUser?.id === userId) {
      try {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      } catch {}
    }
    autoDeleteUser(userId);
    saveFullCloudMenu({
      restaurants,
      categories,
      items: menuItems,
      users: nextUsers,
      orders
    }).catch(() => {});
    showToast(`✓ Usuario ${targetUser ? `"${targetUser.name}"` : ''} eliminado.`);
  };

  const handlePublishMenu = async (
    restaurantId: string,
    restaurant: Restaurant,
    restCategories: MenuCategory[],
    restItems: MenuItem[]
  ) => {
    const filterCats = restCategories.filter(c => c.restaurantId === restaurantId);
    const filterItems = restItems.filter(i => i.restaurantId === restaurantId);
    const res = await publishRestaurantMenu(restaurantId, restaurant, filterCats, filterItems, currentUser?.name || 'Administrador');
    if (res.success) {
      const newSnapshot = {
        published: true,
        version: res.version || 1,
        publishedAt: res.publishedAt || new Date().toISOString(),
        restaurant,
        categories: filterCats,
        items: filterItems
      };
      setPublishedMenuData(newSnapshot);
      setRestaurants(prev => prev.map(r => r.id === restaurantId ? restaurant : r));
      if (previewRestaurant && previewRestaurant.id === restaurantId) {
        setPreviewRestaurant(restaurant);
      }
      showToast(`✓ ¡Carta oficial de "${restaurant.name}" publicada con éxito (Versión ${res.version})!`);
    } else {
      showToast(`⚠️ Error al publicar carta: ${res.message || 'Error de conexión'}`);
    }
    return res;
  };

  const handleUpdateTemplate = (updated: MenuTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    showToast(`Plantilla "${updated.name}" actualizada con éxito.`);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const targetTmpl = templates.find(t => t.id === templateId);
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    showToast(`✓ Plantilla ${targetTmpl ? `"${targetTmpl.name}"` : ''} eliminada de la plataforma.`);
  };

  const handleImportBackupJSON = (
    imported: {
      restaurants: Restaurant[];
      categories: MenuCategory[];
      items: MenuItem[];
    },
    mode: 'MERGE' | 'REPLACE' = 'MERGE',
    targetRestaurantId?: string
  ) => {
    let preparedCategories = [...imported.categories];
    let preparedItems = [...imported.items];
    let preparedRestaurants = [...imported.restaurants];

    // If targetRestaurantId was explicitly selected and imported data has 1 restaurant,
    // remap categories and items to target restaurant ID
    if (targetRestaurantId && imported.restaurants.length === 1) {
      const singleRest = imported.restaurants[0];
      if (singleRest.id !== targetRestaurantId) {
        preparedCategories = imported.categories.map(c => ({
          ...c,
          restaurantId: targetRestaurantId
        }));
        preparedItems = imported.items.map(i => ({
          ...i,
          restaurantId: targetRestaurantId
        }));
        preparedRestaurants = [{
          ...singleRest,
          id: targetRestaurantId
        }];
      }
    }

    const targetRestIds = new Set<string>();
    if (targetRestaurantId) {
      targetRestIds.add(targetRestaurantId);
    } else {
      preparedRestaurants.forEach(r => targetRestIds.add(r.id));
    }

    // 1. Calculate merged restaurants while preserving ALL existing restaurants in system
    let nextRestaurants = [...restaurants];
    if (preparedRestaurants && preparedRestaurants.length > 0) {
      const restMap = new Map<string, Restaurant>();
      restaurants.forEach(r => restMap.set(r.id, r));
      preparedRestaurants.forEach(impRest => {
        const existing = restMap.get(impRest.id);
        const mergedRest: Restaurant = {
          ...(existing || {}),
          ...impRest,
          ownerId: existing?.ownerId || impRest.ownerId,
          branding: {
            ...(existing ? existing.branding : {}),
            ...(impRest.branding || {})
          } as RestaurantBranding
        };
        restMap.set(impRest.id, mergedRest);
      });
      nextRestaurants = sanitizeRestaurants(Array.from(restMap.values()));
    }

    // 2. Calculate merged categories
    let nextCategories: MenuCategory[] = [...categories];
    if (preparedCategories && preparedCategories.length > 0) {
      if (mode === 'REPLACE') {
        const remaining = categories.filter(c => !targetRestIds.has(c.restaurantId));
        nextCategories = [...remaining, ...preparedCategories];
      } else {
        const catMap = new Map<string, MenuCategory>();
        categories.forEach(c => catMap.set(c.id, c));
        preparedCategories.forEach(c => catMap.set(c.id, c));
        nextCategories = Array.from(catMap.values());
      }
    }

    // 3. Calculate merged menu items
    let nextItems: MenuItem[] = [...menuItems];
    if (preparedItems && preparedItems.length > 0) {
      if (mode === 'REPLACE') {
        const remaining = menuItems.filter(i => !targetRestIds.has(i.restaurantId));
        nextItems = [...remaining, ...preparedItems];
      } else {
        nextItems = mergeMenuItemsById(menuItems, preparedItems);
      }
    }

    // 4. Update local state
    setRestaurants(nextRestaurants);
    setCategories(nextCategories);
    setMenuItems(nextItems);

    if (previewRestaurant && targetRestIds.has(previewRestaurant.id)) {
      const updatedPrev = nextRestaurants.find(r => r.id === previewRestaurant.id);
      if (updatedPrev) setPreviewRestaurant(updatedPrev);
    }

    // 5. Immediately persist full merged dataset to cloud (Server Disk & Upstash)
    saveFullCloudMenu({
      restaurants: nextRestaurants,
      categories: nextCategories,
      items: nextItems,
      users,
      orders,
    }).catch(err => {
      console.error('[Import] Error saving to cloud:', err);
    });

    const modeText = mode === 'REPLACE' ? 'reemplazada completamente' : 'añadida / fusionada';
    showToast(`✓ Carta ${modeText} con éxito y guardada en la nube.`);
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders(prev => {
      const updatedList = prev.map(o => {
        if (o.id === orderId) {
          const updatedOrder = { ...o, status: nextStatus };
          return updatedOrder;
        }
        return o;
      });
      return updatedList;
    });
    showToast(`Comanda actualizada a estado "${nextStatus}".`);
    autoUpdateOrderStatus(orderId, nextStatus).catch(err => {
      console.warn('[CloudSync] Error updating order status:', err);
    });
  };

  const handleCreateOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
    setCustomerActiveOrderId(newOrder.id);
    try {
      localStorage.setItem('micarta_active_order_id', newOrder.id);
    } catch {}
    playNotificationSound();
    const rest = (restaurants || []).find(r => r && r.id === newOrder.restaurantId);
    showToast(`🎉 ¡Pedido ${newOrder.orderNumber} enviado a ${rest?.name || 'cocina'}!`);
    autoSyncOrder(newOrder).catch(err => {
      console.warn('[CloudSync] Error saving order to cloud:', err);
    });
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
    autoSyncOrder(newOrder).catch(() => {});
  };

  const handleCustomerMenuClose = () => {
    setIsCustomerModalOpen(false);
    if (!currentUser) {
      if (initParams.isQr || initParams.restSlug) {
        setIsMenuClosedByGuest(true);
      }
    }
  };

  const handleOpenCustomerPreview = (restaurant?: Restaurant, mode?: 'DINE_IN' | 'DELIVERY', tableNumber?: string) => {
    const target = restaurant || (restaurants || []).find(r => r && r.id === selectedRestaurantId) || (restaurants || []).filter(Boolean)[0];
    setPreviewRestaurant(target);
    setPreviewMode(mode || 'DINE_IN');
    setPreviewTableNumber(tableNumber);
    setIsMenuClosedByGuest(false);
    setIsCustomerModalOpen(true);
    if (target) {
      fetchPublicPublishedMenu(target.slug || target.id).then(pub => {
        if (pub && pub.restaurant) {
          setPublishedMenuData(pub);
        }
      }).catch(() => {});
    }
  };

  // Robust state sanitization to guarantee children components never receive null/undefined elements
  const safeRestaurants = (restaurants || []).filter(Boolean);
  const safeCategories = (categories || []).filter(Boolean);
  const safeMenuItems = (menuItems || []).filter(Boolean);
  const safeUsers = (users || []).filter(Boolean);
  const safeOrders = (orders || []).filter(Boolean);
  const safeTemplates = (templates || []).filter(Boolean);

  // Effective role user for specific role components
  const effectiveWaiterUser = currentUser?.role === 'WAITER' ? currentUser : (safeUsers.find(u => u && u.role === 'WAITER') || safeUsers[0]);
  const effectiveKitchenUser = currentUser?.role === 'KITCHEN' ? currentUser : (safeUsers.find(u => u && u.role === 'KITCHEN') || safeUsers[0]);
  const effectiveDeliveryUser = currentUser?.role === 'DELIVERY' ? currentUser : (safeUsers.find(u => u && u.role === 'DELIVERY') || safeUsers[0]);
  const effectiveCustomerUser = currentUser?.role === 'CUSTOMER' ? currentUser : (safeUsers.find(u => u && u.role === 'CUSTOMER') || safeUsers[0]);

  // Restaurants accessible by the current logged-in user
  const userAccessibleRestaurants = currentUser
    ? (currentUser.role === 'ADMIN'
        ? safeRestaurants
        : safeRestaurants.filter(r => r && (
            (r.ownerId && (r.ownerId === currentUser.id || (currentUser.email && r.ownerId === currentUser.email))) ||
            (Array.isArray(currentUser.restaurantIds) && currentUser.restaurantIds.includes(r.id)) ||
            (currentUser.role === 'ADMIN' && currentUser.restaurantIds?.includes('all'))
          )))
    : safeRestaurants;

  // Current active restaurant branding for dynamic theme accent
  const currentSelectedRest = getSafeActiveRestaurant(userAccessibleRestaurants, selectedRestaurantId) ?? 
    (userAccessibleRestaurants[0] || (currentUser?.role === 'ADMIN' ? getSafeActiveRestaurant(safeRestaurants, null) : null));
  const pendingOrdersCount = safeOrders.filter(o => o && o.status === 'PENDING').length;

  // Is this a direct public link access via QR or URL slug (and not explicitly requesting staff login)?
  const isDirectLinkAccess = Boolean((initParams.isQr || initParams.restSlug) && !initParams.isStaffLogin);

  // Global loading screen while fetching initial cloud data from authoritative backend
  if (!isInitialCloudFetchDone || (isDirectLinkAccess && isLoadingPublishedMenu && !publishedMenuData && !previewRestaurant)) {
    if (isDirectLinkAccess) {
      const preloadedBranding = (typeof window !== 'undefined' && (window as any).__PRELOADED_RESTAURANT_BRANDING__) || null;
      const targetRest = previewRestaurant || publishedMenuData?.restaurant;
      const activeBgColor = targetRest?.branding?.backgroundColor || targetRest?.branding?.darkBgColor || targetRest?.branding?.primaryColor || preloadedBranding?.bgColor || '#852323';
      const activeLogo = targetRest?.branding?.headerLogoUrl || targetRest?.logoUrl || preloadedBranding?.logoUrl || null;
      const activeName = targetRest?.name || preloadedBranding?.name || '';
      return (
        <div 
          className="min-h-screen flex flex-col items-center justify-center transition-all duration-300"
          style={{ backgroundColor: activeBgColor }}
        >
          {activeLogo && (
            <img 
              src={activeLogo} 
              alt={activeName} 
              className="w-28 h-28 sm:w-36 sm:h-36 object-contain animate-pulse" 
            />
          )}
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // 2. If accessing via link but no matching restaurant exists anywhere (not in cloud, not in local)
  if (isDirectLinkAccess && !isLoadingPublishedMenu && isInitialCloudFetchDone && !previewRestaurant && !publishedMenuData) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 selection:bg-amber-400 selection:text-black">
        <div className="w-full max-w-md p-8 rounded-3xl bg-neutral-900 border border-amber-500/40 text-white shadow-2xl space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-amber-300">Carta No Disponible</h3>
            <p className="text-xs text-neutral-300 mt-2">
              Se intentó acceder a la carta digital con el parámetro:
            </p>
            <div className="mt-3 px-4 py-2 rounded-xl bg-black/60 border border-neutral-800 text-amber-400 font-mono text-sm inline-block font-bold">
              ?r={notFoundSlugError || initialRequestedSlug || ''}
            </div>
            <p className="text-xs text-neutral-400 mt-4 leading-relaxed">
              No se encontró ninguna carta registrada para esta dirección. Por política de seguridad y fidelidad, no se mostrará la carta de ningún otro restaurante.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Initial State: Directly display Digital Menu ONLY for QR links / restaurant slug links or when customer preview is open without logged-in session
  const effectivePreviewRest = (
    isDirectLinkAccess && publishedMenuData?.restaurant
      ? publishedMenuData.restaurant
      : (previewRestaurant || publishedMenuData?.restaurant)
  );

  if ((isDirectLinkAccess || (!currentUser && isCustomerModalOpen)) && effectivePreviewRest) {
    const targetRest = effectivePreviewRest;
    // If the guest explicitly closed the menu, show ONLY the thank you screen without any login buttons
    if (isMenuClosedByGuest) {
      const restColor = targetRest?.branding?.darkBgColor || targetRest?.branding?.primaryColor || '#1B667A';
      const secColor = targetRest?.branding?.secondaryColor || '#8A9B57';
      const btnColor = targetRest?.branding?.buttonColor || '#D98262';
      const creamColor = targetRest?.branding?.buttonTextColor || '#EAEBDC';
      const restLogo = targetRest?.branding?.headerLogoUrl || targetRest?.logoUrl;
      const textColor = targetRest?.branding?.textColor || '#FFFFFF';

      return (
        <div 
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none font-sans"
          style={{ backgroundColor: restColor, color: textColor }}
        >
          <div 
            className="max-w-md w-full p-8 space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Restaurant Logo - Clean, no borders/shadow/background/padding */}
            {restLogo ? (
              <img 
                src={restLogo} 
                alt={targetRest?.name} 
                className="max-h-28 max-w-[240px] object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-16 h-16 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: secColor }} />
              </div>
            )}
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: targetRest?.branding?.restaurantNameFont || 'Fredoka, Outfit, sans-serif', color: textColor }}>
                Vuelve siempre! Te esperamos
              </h2>
            </div>

            {(targetRest?.address || targetRest?.phone) && (
              <div className="p-3 text-xs space-y-1 w-full font-mono opacity-80" style={{ color: textColor }}>
                {targetRest.address && <div>📍 {targetRest.address}</div>}
                {targetRest.phone && <div>📞 {targetRest.phone}</div>}
              </div>
            )}
            
            <button
              onClick={() => {
                setIsMenuClosedByGuest(false);
                setIsCustomerModalOpen(true);
              }}
              style={{ backgroundColor: btnColor, color: creamColor }}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide transition shadow-lg cursor-pointer hover:brightness-110"
            >
              Regresar
            </button>
          </div>
        </div>
      );
    }

    // Direct standalone full-screen digital menu for QR scan / public visitors (authoritative published snapshot)
    const isTargetPublished = Boolean(
      publishedMenuData && (
        normalizeSlug(publishedMenuData.restaurant?.id) === normalizeSlug(targetRest.id) ||
        normalizeSlug(publishedMenuData.restaurant?.slug) === normalizeSlug(targetRest.slug)
      )
    );
    const targetCategories = isTargetPublished && publishedMenuData 
      ? publishedMenuData.categories 
      : categories.filter(c => c.restaurantId === targetRest.id);
    const targetItems = isTargetPublished && publishedMenuData 
      ? publishedMenuData.items 
      : menuItems.filter(i => i.restaurantId === targetRest.id);

    return (
      <div 
        style={{ backgroundColor: targetRest.branding?.darkBgColor || targetRest.branding?.backgroundColor || '#0F172A' }}
        className="min-h-screen w-full flex flex-col selection:bg-white selection:text-black overflow-x-hidden"
      >
        <CustomerMenuModal
          isOpen={true}
          onClose={handleCustomerMenuClose}
          restaurant={targetRest}
          categories={targetCategories}
          items={targetItems}
          onOrderCreated={handleCreateOrder}
          initialMode={previewMode}
          initialTableNumber={previewTableNumber}
          isLoading={isLoadingPublishedMenu}
          customerActiveOrderId={customerActiveOrderId}
          orders={orders}
          onOpenActiveOrderModal={() => setIsCustomerActiveOrderModalOpen(true)}
          onUpdateRestaurant={handleUpdateRestaurant}
          onUpdateMenuItem={handleUpdateMenuItem}
          onAddMenuItem={handleAddMenuItem}
          onDeleteMenuItem={handleDeleteMenuItem}
          onUpdateCategory={handleUpdateCategory}
          onAddCategory={handleAddCategory}
          isOwnerOrAdmin={false}
          publishedSnapshotInfo={isTargetPublished && publishedMenuData ? {
            version: publishedMenuData.version,
            publishedAt: publishedMenuData.publishedAt
          } : undefined}
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

  // If no user is logged in, display the Login Screen (Pantalla de Logueo)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col selection:bg-neutral-800 selection:text-white">
        <LoginScreen
          users={safeUsers}
          onLogin={handleLogin}
          restaurants={safeRestaurants}
          onOpenCustomerPreview={handleOpenCustomerPreview}
          onOpenTemplateSplitEditor={() => setIsTemplateSplitEditorOpen(true)}
        />
      </div>
    );
  }

  // 2. Non-Admin Role Views: "Las vistas deberán corresponder al rol del usuario que se loguee"
  // "La vista actual, solo será vista when el que se loguee sea un administrador"
  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <ErrorBoundary fallbackTitle="Ocurrió un problema en la vista operativa">
        <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col selection:bg-neutral-800 selection:text-white">
        
        {/* Dedicated Role Header with User Profile, Restaurant Selector and Logout */}
        <RoleHeader
          currentUser={currentUser}
          restaurant={currentSelectedRest}
          restaurants={safeRestaurants}
          selectedRestaurantId={selectedRestaurantId}
          onSelectRestaurant={setSelectedRestaurantId}
          onLogout={handleLogout}
          onOpenCustomerPreview={(targetRest) => handleOpenCustomerPreview(targetRest)}
          onOpenTemplateSplitEditor={() => setIsTemplateSplitEditorOpen(true)}
          onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
          activeOwnerSubTab={ownerActiveSubTab}
          onSelectOwnerSubTab={setOwnerActiveSubTab}
          tablesCount={currentSelectedRest?.tables?.length || 6}
          shiftsCount={currentSelectedRest?.shifts?.length || 4}
          kitchenCount={safeUsers.filter(u => u.role === 'KITCHEN').length}
          waitersCount={safeUsers.filter(u => u.role === 'WAITER').length}
          ridersCount={safeUsers.filter(u => u.role === 'DELIVERY').length}
        />

        {/* Role-Specific View Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 pt-1 sm:pt-3 pb-20">
          
          {/* OWNER & RESTAURANT MANAGER: Full Owner Dashboard with Menus, Tables/QR, Staff, Shifts, Schedules */}
          {(currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER') && (
            <OwnerDashboard
              currentUser={currentUser}
              restaurants={safeRestaurants}
              selectedRestaurantId={selectedRestaurantId}
              onSelectRestaurant={setSelectedRestaurantId}
              activeSubTab={ownerActiveSubTab as any}
              onSelectSubTab={setOwnerActiveSubTab as any}
              users={safeUsers}
              templates={safeTemplates}
              menuItems={safeMenuItems}
              categories={safeCategories}
              orders={safeOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateRestaurant={handleUpdateRestaurant}
              onAddRestaurant={handleAddRestaurant}
              onDeleteRestaurant={handleDeleteRestaurant}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onAddMenuItem={handleAddMenuItem}
              onUpdateMenuItem={handleUpdateMenuItem}
              onDeleteMenuItem={handleDeleteMenuItem}
              onReorderMenuItems={handleReorderMenuItems}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onReorderCategories={handleReorderCategories}
              onOpenCustomerPreview={handleOpenCustomerPreview}
              onPublishMenu={handlePublishMenu}
              onSwitchToAdminView={() => {
                showToast('Cierra sesión e ingresa con DNI de Administrador (00448157) para acceder a la vista global SaaS.');
                handleLogout();
              }}
              onImportBackupJSON={handleImportBackupJSON}
            />
          )}

          {/* KITCHEN: Dedicated Kitchen Display System (KDS) & Dish 86 toggle */}
          {currentUser.role === 'KITCHEN' && (
            <KitchenView
              currentUser={currentUser}
              restaurants={safeRestaurants}
              orders={safeOrders}
              menuItems={safeMenuItems}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onSimulateNewOrder={handleSimulateNewOrder}
              onOpenCustomerPreview={handleOpenCustomerPreview}
            />
          )}

          {/* WAITER: Table management, live orders, waiter call service */}
          {currentUser.role === 'WAITER' && (
            <WaiterView
              currentUser={currentUser}
              restaurants={safeRestaurants}
              orders={safeOrders}
              menuItems={safeMenuItems}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onSimulateNewOrder={handleSimulateNewOrder}
              onOpenCustomerPreview={handleOpenCustomerPreview}
            />
          )}

          {/* DELIVERY: Real-time dispatch, route assignments, driver status */}
          {currentUser.role === 'DELIVERY' && (
            <DeliveryView
              currentUser={currentUser}
              restaurants={safeRestaurants}
              orders={safeOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {/* CUSTOMER: Digital dining portal, QR scan, order history */}
          {currentUser.role === 'CUSTOMER' && (
            <CustomerPortalView
              currentUser={currentUser}
              restaurants={safeRestaurants}
              orders={safeOrders}
              onOpenCustomerPreview={handleOpenCustomerPreview}
            />
          )}

        </main>

        {/* Interactive Public Digital Menu Preview Modal for Customers */}
        <CustomerMenuModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          restaurant={previewRestaurant || currentSelectedRest}
          categories={safeCategories}
          items={safeMenuItems}
          onOrderCreated={handleCreateOrder}
          initialMode={previewMode}
          initialTableNumber={previewTableNumber}
          customerActiveOrderId={customerActiveOrderId}
          orders={orders}
          onOpenActiveOrderModal={() => setIsCustomerActiveOrderModalOpen(true)}
          onUpdateRestaurant={handleUpdateRestaurant}
          onUpdateMenuItem={handleUpdateMenuItem}
          onAddMenuItem={handleAddMenuItem}
          onDeleteMenuItem={handleDeleteMenuItem}
          onUpdateCategory={handleUpdateCategory}
          onAddCategory={handleAddCategory}
          isOwnerOrAdmin={(currentUser.role as string) === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER'}
        />

        {/* Profile Settings Modal */}
        <ProfileSettingsModal
          isOpen={isProfileSettingsOpen}
          onClose={() => setIsProfileSettingsOpen(false)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
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
      </ErrorBoundary>
    );
  }

  // 3. ADMIN ROLE VIEW: "La vista actual, solo será vista cuando el que se loguee sea un administrador"
  return (
    <ErrorBoundary fallbackTitle="Ocurrió un problema en el panel de administración">
      <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col selection:bg-neutral-800 selection:text-white">
      
      {/* Top Header with Profile / Login Trigger and Simulación Checkbox */}
      <TopHeader
        restaurants={safeRestaurants}
        selectedRestaurantId={selectedRestaurantId}
        onSelectRestaurant={setSelectedRestaurantId}
        activeRole={activeRole}
        onRoleChange={(role) => {
          setActiveRole(role);
          // When admin previews another role in the dropdown
          const roleUser = safeUsers.find(u => u && u.role === role);
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
        onOpenTemplateSplitEditor={() => setIsTemplateSplitEditorOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isSimulationActive={isSimulationActive}
        onToggleSimulation={(active) => {
          setIsSimulationActive(active);
          if (active) {
            setActiveRole('ADMIN');
            const adminUser = safeUsers.find(u => u && u.role === 'ADMIN') || safeUsers[0];
            if (adminUser) setCurrentUser(adminUser);
            showToast('🖥️ Modo Simulación Multi-Pantalla activado (Vista Administrador para PC)');
          } else {
            showToast('Modo Simulación desactivado');
          }
        }}
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        
        {/* SIMULATION MODE (PC ONLY 3-COLUMN LIVE MOCKUPS) */}
        {isSimulationActive ? (
          <AdminSimulationView
            restaurants={safeRestaurants}
            menuItems={safeMenuItems}
            categories={safeCategories}
            users={safeUsers}
            onCloseSimulation={() => setIsSimulationActive(false)}
            onSyncGlobalOrder={(order) => {
              setOrders(prev => {
                const existing = (prev || []).filter(Boolean).find(o => o && o.id === order.id);
                if (existing) {
                  return prev.map(o => o && o.id === order.id ? order : o);
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
                restaurants={safeRestaurants}
                orders={safeOrders}
                users={safeUsers}
                templates={safeTemplates}
                categories={safeCategories}
                menuItems={safeMenuItems}
                activeRole={activeRole}
                onRoleChange={setActiveRole}
                onNavigateToRestaurants={() => setActiveTab('restaurants')}
                onNavigateToOrders={() => setActiveTab('orders')}
                onOpenCustomerPreview={handleOpenCustomerPreview}
                onUpdateRestaurant={handleUpdateRestaurant}
                onAddRestaurant={handleAddRestaurant}
                onDeleteRestaurant={handleDeleteRestaurant}
                onUpdateUser={handleUpdateUser}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                onUpdateTemplate={handleUpdateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
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
                restaurants={safeRestaurants}
                categories={safeCategories}
                items={safeMenuItems}
                onUpdateRestaurant={handleUpdateRestaurant}
                onDeleteRestaurant={handleDeleteRestaurant}
                onUpdateMenuItem={handleUpdateMenuItem}
                onAddMenuItem={handleAddMenuItem}
                onOpenCustomerPreview={handleOpenCustomerPreview}
                onPublishMenu={handlePublishMenu}
                onImportBackupJSON={handleImportBackupJSON}
              />
            )}

            {activeTab === 'users' && (
              <UsersView
                users={safeUsers}
                restaurants={safeRestaurants}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView
                orders={safeOrders}
                restaurants={safeRestaurants}
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
        restaurant={previewRestaurant || currentSelectedRest}
        categories={safeCategories}
        items={safeMenuItems}
        onOrderCreated={handleCreateOrder}
        initialMode={previewMode}
        initialTableNumber={previewTableNumber}
        customerActiveOrderId={customerActiveOrderId}
        orders={orders}
        onOpenActiveOrderModal={() => setIsCustomerActiveOrderModalOpen(true)}
        onUpdateRestaurant={handleUpdateRestaurant}
        onUpdateMenuItem={handleUpdateMenuItem}
        onAddMenuItem={handleAddMenuItem}
        onDeleteMenuItem={handleDeleteMenuItem}
        onUpdateCategory={handleUpdateCategory}
        onAddCategory={handleAddCategory}
        isOwnerOrAdmin={Boolean(currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER'))}
      />

      {/* Strict Warning Modal when URL requested slug does not exist */}
      {notFoundSlugError && !isCustomerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl bg-neutral-900 border border-amber-500/40 text-white shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300">Carta No Disponible</h3>
              <p className="text-xs text-neutral-300 mt-2">
                Se intentó acceder a la carta digital con el parámetro:
              </p>
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-black/60 border border-neutral-800 text-amber-400 font-mono text-xs inline-block font-bold">
                ?r={notFoundSlugError}
              </div>
              <p className="text-[11px] text-neutral-400 mt-3 leading-relaxed">
                No se encontró ninguna carta registrada para esta dirección. Por política de seguridad y fidelidad, no se mostrará la carta de ningún otro restaurante.
              </p>
            </div>
            <button
              onClick={() => setNotFoundSlugError(null)}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition cursor-pointer shadow-lg"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
      />

      {/* FLOATING TOP-LEFT "VER PEDIDO" BUTTON FOR ANONYMOUS CUSTOMER / QR DINER */}
      {(() => {
        const activeOrder = customerActiveOrderId 
          ? (orders || []).find(o => o.id === customerActiveOrderId) 
          : null;
        const isOrderActive = Boolean(
          activeOrder && 
          activeOrder.status !== 'DELIVERED' && 
          activeOrder.status !== 'CANCELLED'
        );

        if (!isOrderActive || !activeOrder) return null;

        return (
          <>
            <button
              type="button"
              onClick={() => setIsCustomerActiveOrderModalOpen(true)}
              className="fixed top-4 left-4 z-50 px-3.5 py-2.5 bg-neutral-950/95 hover:bg-black text-white border border-amber-400/50 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center gap-2.5 transition cursor-pointer active:scale-95 group animate-in fade-in"
              title={`Ver comanda activa ${activeOrder.orderNumber}`}
            >
              <div className="w-6 h-6 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-sm">
                <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-white group-hover:text-amber-300 transition">
                    Ver Pedido
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                    {activeOrder.orderNumber}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-neutral-400 block -mt-0.5">
                  {activeOrder.status === 'PENDING' ? '⏳ Recibido' : (activeOrder.status === 'IN_KITCHEN' ? '👨‍🍳 En cocina' : (activeOrder.status === 'READY' ? '🛎️ ¡Listo!' : (activeOrder.status === 'ON_THE_WAY' ? '🛵 En camino' : 'En curso')))}
                </span>
              </div>
              <span className="flex h-2 w-2 relative ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </button>

            {isCustomerActiveOrderModalOpen && (
              <CustomerActiveOrderModal
                order={activeOrder}
                onClose={() => setIsCustomerActiveOrderModalOpen(false)}
                restaurantName={(restaurants || []).find(r => r.id === activeOrder.restaurantId)?.name}
              />
            )}
          </>
        );
      })()}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-medium shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Split-Screen Template Editor Modal */}
      {isTemplateSplitEditorOpen && (
        <TemplateSplitEditor
          restaurants={restaurants}
          templates={templates}
          menuItems={menuItems}
          categories={categories}
          currentRestaurantId={selectedRestaurantId}
          onUpdateRestaurant={(updated) => {
            handleUpdateRestaurant(updated);
            showToast(`✓ Diseño guardado exitosamente en "${updated.name}".`);
          }}
          onOpenCustomerPreview={(r) => handleOpenCustomerPreview(r)}
          onDeleteTemplate={handleDeleteTemplate}
          onClose={() => setIsTemplateSplitEditorOpen(false)}
        />
      )}

    </div>
    </ErrorBoundary>
  );
}
