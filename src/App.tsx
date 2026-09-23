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
import { deduplicateUsers } from './lib/userUtils';
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
import { TemplateSplitEditor } from './components/TemplateSplitEditor';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  saveAllDataToFirebase, 
  loadAllDataFromFirebase,
  saveRestaurantToFirebase,
  deleteRestaurantFromFirebase,
  saveMenuItemToFirebase,
  deleteMenuItemFromFirebase,
  saveCategoryToFirebase,
  deleteCategoryFromFirebase,
  saveUserToFirebase,
  deleteUserFromFirebase,
  saveOrderToFirebase,
  FIRESTORE_UPGRADE_URL
} from './lib/firebase';
import {
  fetchLatestCloudMenu,
  saveFullCloudMenu,
  autoSyncMenuItem,
  autoDeleteMenuItem,
  autoSyncRestaurant,
  autoSyncCategory,
  autoDeleteCategory,
  subscribeToCloudUpdates,
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

// Helper function to locate a restaurant strictly by slug, ID, name, tagline, or custom alias
export const findRestaurantBySlug = (restaurantsList: Restaurant[], querySlug?: string | null): Restaurant | null => {
  if (!querySlug) return null;
  const target = normalizeSlug(querySlug);
  if (!target) return null;

  // 1. Exact match by slug, id, or name
  const exact = restaurantsList.find(r => 
    normalizeSlug(r.slug) === target || 
    normalizeSlug(r.id) === target || 
    normalizeSlug(r.name) === target
  );
  if (exact) return exact;

  // 2. Alias or fuzzy match
  const fuzzy = restaurantsList.find(r => {
    const slugNorm = normalizeSlug(r.slug);
    const idNorm = normalizeSlug(r.id);
    const nameNorm = normalizeSlug(r.name);
    const taglineNorm = normalizeSlug(r.tagline || '');

    // Cevichito Pliz / Costa Marina alias mapping
    if (
      r.id === 'rest-costa' || 
      slugNorm.includes('costa') || 
      slugNorm.includes('cevichito') || 
      nameNorm.includes('costa') || 
      nameNorm.includes('cevichito') ||
      taglineNorm.includes('cevichito')
    ) {
      if (
        target.includes('cevichito') || 
        target.includes('costa') || 
        target.includes('marina') || 
        target.includes('pliz')
      ) {
        return true;
      }
    }

    if (slugNorm.includes(target) || target.includes(slugNorm)) return true;
    if (nameNorm.includes(target) || target.includes(nameNorm)) return true;
    if (taglineNorm.includes(target)) return true;

    return false;
  });

  return fuzzy || null;
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

// Robust sanitization to guarantee Cevichito Pliz brand name and slug across all caches without overwriting custom branding
function sanitizeRestaurants(rests: Restaurant[]): Restaurant[] {
  return rests.map(r => {
    if (
      r.id === 'rest-costa' || 
      r.name === 'Costa Marina' || 
      r.slug === 'costa-marina' || 
      r.slug === 'cevichito-pliz' ||
      r.name?.toLowerCase().includes('costa marina')
    ) {
      return {
        ...r,
        id: 'rest-costa',
        name: r.name === 'Costa Marina' ? 'Cevichito Pliz' : r.name,
        slug: 'cevichito-pliz',
        tagline: r.tagline || 'Cevichería Contemporánea & Pesca Artesanal del Día',
        branding: r.branding ? { ...r.branding } : undefined
      };
    }
    return r;
  });
}

function sanitizeMenuItems(items: MenuItem[]): MenuItem[] {
  return items.map(it => {
    if (it.restaurantId === 'rest-costa' || it.name.includes('Costa Marina')) {
      return {
        ...it,
        name: it.name.replace(/Costa Marina/gi, 'Cevichito Pliz')
      };
    }
    return it;
  });
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
  let cachedRests = sanitizeRestaurants(INITIAL_RESTAURANTS);
  let cachedCategories = INITIAL_CATEGORIES;
  let cachedItems = sanitizeMenuItems(INITIAL_MENU_ITEMS);
  let cachedUsers = INITIAL_USERS;
  let cachedOrders = INITIAL_ORDERS;
  let cachedAuth: User | null = INITIAL_USERS[0] || null;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedRests = localStorage.getItem(STORAGE_KEYS.RESTS);
      if (storedRests) {
        const parsedRests = JSON.parse(storedRests);
        if (Array.isArray(parsedRests) && parsedRests.length > 0) {
          cachedRests = sanitizeRestaurants(parsedRests);
        }
      }

      const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (storedCats) {
        const parsedCats = JSON.parse(storedCats);
        if (Array.isArray(parsedCats)) {
          cachedCategories = parsedCats;
        }
      }

      const storedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        if (Array.isArray(parsedItems)) {
          cachedItems = sanitizeMenuItems(parsedItems);
        }
      }

      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strictly respect user deletions: use stored users as the source of truth
          cachedUsers = parsed;
        }
      }

      const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (storedAuth) {
        cachedAuth = JSON.parse(storedAuth);
      }
    } catch (e) {
      console.warn('[Storage] Error reading initial state:', e);
    }
  }

  const deduplicatedUsers = deduplicateUsers(cachedUsers);

  return {
    cachedRests,
    cachedCategories,
    cachedItems,
    cachedUsers: deduplicatedUsers,
    cachedOrders,
    cachedAuth
  };
}

const initialState = getInitialStorageState();
const initParams = getInitialUrlParams();

const initialRequestedSlug = initParams.restSlug;
const defaultFallbackRest = initialState.cachedRests.find(r => r.id === 'rest-costa' || r.slug === 'cevichito-pliz') || initialState.cachedRests[0];
const initialFoundRest = initialRequestedSlug 
  ? findRestaurantBySlug(initialState.cachedRests, initialRequestedSlug)
  : null;

function cleanseUserRestaurantAssociations(rawUsers: User[], rawRests: Restaurant[]) {
  const modifiedUsers: User[] = [];
  const modifiedRests: Restaurant[] = [];

  const updatedUsers = rawUsers.map(u => {
    if (u.dni === '89309927' || u.name.trim().toLowerCase().includes('stephanie leon')) {
      const targetIds = ['rest-costa'];
      if (JSON.stringify(u.restaurantIds) !== JSON.stringify(targetIds)) {
        const cleaned = {
          ...u,
          restaurantIds: targetIds
        };
        modifiedUsers.push(cleaned);
        return cleaned;
      }
    }
    return u;
  });

  const updatedRests = rawRests.map(r => {
    if (r.id === 'rest-brasas' || r.slug === 'brasas-y-fuegos') {
      const stephanie = rawUsers.find(u => u.dni === '89309927' || u.name.trim().toLowerCase().includes('stephanie leon'));
      if (stephanie && r.ownerId === stephanie.id) {
        const cleaned = {
          ...r,
          ownerId: 'u-2'
        };
        modifiedRests.push(cleaned);
        return cleaned;
      }
    }
    return r;
  });

  // Sync corrected entities to Firebase in background
  if (modifiedUsers.length > 0) {
    modifiedUsers.forEach(u => saveUserToFirebase(u).catch(() => {}));
  }
  if (modifiedRests.length > 0) {
    modifiedRests.forEach(r => saveRestaurantToFirebase(r).catch(() => {}));
  }

  return { cleanedUsers: updatedUsers, cleanedRests: updatedRests };
}

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
  
  // Authenticated user state: default to cachedAuth or null (prompts for DNI and password upon entry)
  const [currentUser, setCurrentUser] = useState<User | null>(initialState.cachedAuth);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Active Role Simulator (synced with currentUser)
  const [activeRole, setActiveRole] = useState<UserRole>(initialState.cachedAuth?.role || 'ADMIN');

  // Customer preview modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isMenuClosedByGuest, setIsMenuClosedByGuest] = useState<boolean>(false);
  const [isTemplateSplitEditorOpen, setIsTemplateSplitEditorOpen] = useState<boolean>(false);
  const [previewRestaurant, setPreviewRestaurant] = useState<Restaurant>(
    initialFoundRest || defaultFallbackRest
  );
  const [previewMode, setPreviewMode] = useState<'DINE_IN' | 'DELIVERY'>(initParams.mode);
  const [previewTableNumber, setPreviewTableNumber] = useState<string | undefined>(initParams.table);
  const [notFoundSlugError, setNotFoundSlugError] = useState<string | null>(
    (initialRequestedSlug && !initialFoundRest) ? initialRequestedSlug : null
  );

  // Synchronous LocalStorage write effects to guarantee zero data loss between renders or reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESTS, JSON.stringify(restaurants));
    } catch {}
  }, [restaurants]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(menuItems));
    } catch {}
  }, [menuItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    } catch {}
  }, [currentUser]);

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
        const foundRest = findRestaurantBySlug(restaurants, restaurantSlug);

        if (foundRest) {
          setPreviewRestaurant(foundRest);
          setPreviewMode(mode === 'DELIVERY' ? 'DELIVERY' : 'DINE_IN');
          if (table) setPreviewTableNumber(table);
          setIsCustomerModalOpen(true);
          setNotFoundSlugError(null);
        } else {
          // STRICT RULE: If the requested menu does NOT exist, DO NOT show a wrong fallback menu!
          setIsCustomerModalOpen(false);
          setNotFoundSlugError(restaurantSlug);
        }
      }
    } catch {
      // Ignored if window not available
    }
  }, [restaurants]);

  // Direct cloud fetch (combining Server cloud storage & Firestore) and Real-time SSE subscription
  useEffect(() => {
    let isMounted = true;

    // 1. Initial Cloud Fetch (works instantly in incognito mode with server backing & Firestore)
    fetchLatestCloudMenu().then(cloudData => {
      if (!isMounted) return;
      if (cloudData && (cloudData.restaurants?.length > 0 || cloudData.items?.length > 0 || cloudData.users?.length > 0)) {
        const rawLoadedRests = cloudData.restaurants?.length 
          ? sanitizeRestaurants(cloudData.restaurants) 
          : restaurants;
        const rawLoadedUsers = cloudData.users?.length 
          ? cloudData.users 
          : users;

        const { cleanedUsers, cleanedRests } = cleanseUserRestaurantAssociations(rawLoadedUsers, rawLoadedRests);

        setRestaurants(cleanedRests);

        setUsers(prev => {
          const map = new Map<string, User>();
          prev.forEach(u => map.set(u.id, u));
          cleanedUsers.forEach(u => map.set(u.id, u));
          return deduplicateUsers(Array.from(map.values()));
        });

        if (cloudData.categories?.length) {
          setCategories(cloudData.categories);
        }

        if (cloudData.items?.length) {
          setMenuItems(sanitizeMenuItems(cloudData.items));
        }

        if (cloudData.orders?.length) {
          setOrders(cloudData.orders);
        }

        // Update previewRestaurant immediately with the authoritative cloud branding & data
        setPreviewRestaurant(prev => {
          if (initialRequestedSlug) {
            const match = findRestaurantBySlug(cleanedRests, initialRequestedSlug);
            if (match) return match;
          }
          if (!prev) return cleanedRests[0];
          const match = cleanedRests.find(r => r.id === prev.id || r.slug === prev.slug);
          return match || cleanedRests[0];
        });
      }
    }).catch(err => {
      console.warn('[CloudSync] Notice during initial remote fetch:', err);
    });

    // 2. Real-time Subscription: updates all sessions and incognito windows instantly when any change occurs
    const unsubscribe = subscribeToCloudUpdates((event) => {
      if (!isMounted) return;
      if (event.type === 'FULL_SYNC' && event.data) {
        const d = event.data;
        if (d.restaurants?.length) {
          const cleanR = sanitizeRestaurants(d.restaurants);
          setRestaurants(cleanR);
          setPreviewRestaurant(prev => {
            if (initialRequestedSlug) {
              const match = findRestaurantBySlug(cleanR, initialRequestedSlug);
              if (match) return match;
            }
            return prev ? (cleanR.find(r => r.id === prev.id) || cleanR[0]) : cleanR[0];
          });
        }
        if (d.categories?.length) {
          setCategories(d.categories);
        }
        if (d.items?.length) {
          setMenuItems(sanitizeMenuItems(d.items));
        }
        if (d.orders?.length) {
          setOrders(d.orders);
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
        setRestaurants(prev => prev.map(r => r.id === event.restaurant!.id ? event.restaurant! : r));
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
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Keep previewRestaurant synchronized with restaurants array whenever restaurants update
  useEffect(() => {
    if (previewRestaurant) {
      const match = restaurants.find(r => r.id === previewRestaurant.id);
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

  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);

  // Manual explicit sync/recover from Firebase handler
  const handleSyncFromFirebase = async () => {
    setIsSyncingFirebase(true);
    try {
      const remoteData = await loadAllDataFromFirebase();
      if (remoteData) {
        let loadedRests = remoteData.restaurants?.length 
          ? sanitizeRestaurants(remoteData.restaurants) 
          : restaurants;
        let loadedUsers = remoteData.users?.length 
          ? remoteData.users 
          : users;

        const { cleanedUsers, cleanedRests } = cleanseUserRestaurantAssociations(loadedUsers, loadedRests);

        setRestaurants(cleanedRests);
        setUsers(prev => {
          const map = new Map<string, User>();
          prev.forEach(u => map.set(u.id, u));
          cleanedUsers.forEach(u => map.set(u.id, u));
          return deduplicateUsers(Array.from(map.values()));
        });

        if (remoteData.items?.length) {
          const cleanItems = sanitizeMenuItems(remoteData.items);
          setMenuItems(prev => mergeMenuItemsById(prev, cleanItems));
        }
        if (remoteData.categories?.length) {
          setCategories(remoteData.categories);
        }
        if (remoteData.orders?.length) {
          setOrders(remoteData.orders);
        }
        showToast(`✓ ¡Recuperados y sincronizados ${remoteData.items?.length || 0} platos desde Firebase!`);
      } else {
        showToast('✓ Platos y cartas al día con Firebase Firestore');
      }
    } catch (err: any) {
      showToast('Aviso de conexión Firebase: ' + (err.message || 'Error'));
    } finally {
      setIsSyncingFirebase(false);
    }
  };

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
    // Unique name validation
    const cleanName = newRestaurant.name.trim();
    if (restaurants.some(r => r.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      showToast(`Error: Ya existe un restaurante con el nombre "${cleanName}".`);
      return;
    }

    // Ensure the new restaurant has at least 1 default category
    const hasCategory = categories.some(c => c.restaurantId === newRestaurant.id);
    if (!hasCategory) {
      const defaultCat: MenuCategory = {
        id: `cat-${newRestaurant.id}-general`,
        restaurantId: newRestaurant.id,
        name: 'De la Casa',
        sortOrder: 1,
        isActive: true,
      };
      setCategories(prev => [...prev, defaultCat]);
      autoSyncCategory(defaultCat);
    }

    setRestaurants(prev => [newRestaurant, ...prev]);
    saveRestaurantToFirebase(newRestaurant);
    autoSyncRestaurant(newRestaurant);
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
    showToast(`Restaurante "${newRestaurant.name}" creado y guardado.`);
  };

  const handleUpdateRestaurant = (updated: Restaurant) => {
    const prevRest = restaurants.find(r => r.id === updated.id);
    const prevOwnerId = prevRest?.ownerId;
    const newOwnerId = updated.ownerId;

    // Unique name validation against other restaurants
    const cleanName = updated.name.trim();
    if (restaurants.some(r => r.id !== updated.id && r.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      showToast(`Error: Ya existe otro restaurante con el nombre "${cleanName}".`);
      return;
    }

    setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
    if (previewRestaurant && previewRestaurant.id === updated.id) {
      setPreviewRestaurant(updated);
    }
    saveRestaurantToFirebase(updated);

    // If owner was reassigned, update users state and Firebase
    if (prevOwnerId && prevOwnerId !== newOwnerId) {
      setUsers(prevUsers => {
        return prevUsers.map(u => {
          if (u.id === prevOwnerId) {
            const updatedUser: User = {
              ...u,
              restaurantIds: (u.restaurantIds || []).filter(id => id !== updated.id)
            };
            saveUserToFirebase(updatedUser);
            return updatedUser;
          }
          if (u.id === newOwnerId) {
            const updatedUser: User = {
              ...u,
              restaurantIds: (u.restaurantIds || []).includes(updated.id)
                ? u.restaurantIds
                : [...(u.restaurantIds || []), updated.id]
            };
            saveUserToFirebase(updatedUser);
            return updatedUser;
          }
          return u;
        });
      });
    } else if (newOwnerId) {
      // Ensure the designated owner has this restaurant in their list
      setUsers(prevUsers => {
        return prevUsers.map(u => {
          if (u.id === newOwnerId && !(u.restaurantIds || []).includes(updated.id)) {
            const updatedUser: User = {
              ...u,
              restaurantIds: [...(u.restaurantIds || []), updated.id]
            };
            saveUserToFirebase(updatedUser);
            return updatedUser;
          }
          return u;
        });
      });
    }

    showToast(`✓ Restaurante "${updated.name}" actualizado y sincronizado en la nube.`);
    autoSyncRestaurant(updated);
  };

  const handleDeleteRestaurant = (restaurantId: string) => {
    const targetRest = restaurants.find(r => r.id === restaurantId);
    const restName = targetRest ? targetRest.name : 'Restaurante';

    // 1. Remove from restaurants state
    const nextRestaurants = restaurants.filter(r => r.id !== restaurantId);
    setRestaurants(nextRestaurants);

    // 2. If previewing or selected, reset
    if (selectedRestaurantId === restaurantId) {
      setSelectedRestaurantId(nextRestaurants[0]?.id || '');
    }
    if (previewRestaurant && previewRestaurant.id === restaurantId) {
      setPreviewRestaurant(null);
    }

    // 3. Clean user restaurant assignments
    setUsers(prevUsers => {
      return prevUsers.map(u => {
        if (u.restaurantIds && u.restaurantIds.includes(restaurantId)) {
          const updatedUser: User = {
            ...u,
            restaurantIds: u.restaurantIds.filter(id => id !== restaurantId)
          };
          saveUserToFirebase(updatedUser);
          return updatedUser;
        }
        return u;
      });
    });

    if (currentUser && currentUser.restaurantIds && currentUser.restaurantIds.includes(restaurantId)) {
      setCurrentUser(prev => prev ? {
        ...prev,
        restaurantIds: prev.restaurantIds.filter(id => id !== restaurantId)
      } : null);
    }

    // 4. Delete from Firebase & Cloud
    deleteRestaurantFromFirebase(restaurantId);
    saveFullCloudMenu({
      restaurants: nextRestaurants,
      items: menuItems.filter(i => i.restaurantId !== restaurantId),
      categories: categories.filter(c => c.restaurantId !== restaurantId),
    });

    showToast(`Restaurante "${restName}" eliminado exitosamente.`);
  };

  const handleUpdateMenuItem = (updated: MenuItem) => {
    setMenuItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    autoSyncMenuItem(updated);
    showToast(`✓ Plato "${updated.name}" actualizado y guardado en la nube.`);
  };

  const handleAddMenuItem = (newItem: MenuItem) => {
    setMenuItems(prev => [newItem, ...prev]);
    autoSyncMenuItem(newItem);
    showToast(`✓ Plato "${newItem.name}" creado y guardado permanentemente en la nube.`);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    setMenuItems(prev => prev.filter(i => i.id !== itemId));
    autoDeleteMenuItem(itemId);
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
    const otherItems = menuItems.filter(i => i.restaurantId !== restId);
    const updatedList = [...otherItems, ...reorderedItems];
    setMenuItems(updatedList);
    saveFullCloudMenu({ items: updatedList, restaurants, categories, users, orders });
    showToast(`✓ Orden de platos guardado en la nube.`);
  };

  const handleAddCategory = (newCategory: MenuCategory) => {
    setCategories(prev => [...prev, newCategory]);
    autoSyncCategory(newCategory);
    showToast(`✓ Categoría "${newCategory.name}" agregada y guardada en la nube.`);
  };

  const handleUpdateCategory = (updatedCategory: MenuCategory) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    autoSyncCategory(updatedCategory);
    showToast(`✓ Categoría "${updatedCategory.name}" actualizada en la nube.`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    autoDeleteCategory(categoryId);
    showToast(`✓ Categoría eliminada de la nube.`);
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => deduplicateUsers([newUser, ...prev]));
    saveUserToFirebase(newUser);
    showToast(`Usuario "${newUser.name}" (DNI ${newUser.dni}) guardado automáticamente en Firebase.`);
  };

  const handleUpdateUser = (updated: User) => {
    setUsers(prev => deduplicateUsers(prev.map(u => u.id === updated.id ? updated : u)));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
    saveUserToFirebase(updated);
    showToast(`Usuario "${updated.name}" actualizado.`);
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    deleteUserFromFirebase(userId);
    showToast(`Usuario ${targetUser ? `"${targetUser.name}"` : ''} eliminado. Restaurantes y cartas sin cambios.`);
  };

  const handleUpdateTemplate = (updated: MenuTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    showToast(`Plantilla "${updated.name}" actualizada con éxito.`);
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

    // 1. Update restaurants (always preserve ownerId)
    if (preparedRestaurants && preparedRestaurants.length > 0) {
      setRestaurants(prev => {
        const map = new Map<string, Restaurant>();
        prev.forEach(r => map.set(r.id, r));
        preparedRestaurants.forEach(impRest => {
          const existing = map.get(impRest.id);
          const mergedRest: Restaurant = {
            ...impRest,
            ownerId: existing?.ownerId || impRest.ownerId,
          };
          map.set(impRest.id, mergedRest);
        });
        return Array.from(map.values());
      });
    }

    // 2. Update categories
    if (preparedCategories && preparedCategories.length > 0) {
      setCategories(prev => {
        if (mode === 'REPLACE') {
          // Replace categories belonging to target restaurants with the imported ones
          const remaining = prev.filter(c => !targetRestIds.has(c.restaurantId));
          return [...remaining, ...preparedCategories];
        } else {
          // Merge categories by ID
          const map = new Map<string, MenuCategory>();
          prev.forEach(c => map.set(c.id, c));
          preparedCategories.forEach(c => map.set(c.id, c));
          return Array.from(map.values());
        }
      });
    }

    // 3. Update menu items
    if (preparedItems && preparedItems.length > 0) {
      setMenuItems(prev => {
        if (mode === 'REPLACE') {
          // Replace items belonging to target restaurants with the imported ones
          const remaining = prev.filter(i => !targetRestIds.has(i.restaurantId));
          return [...remaining, ...preparedItems];
        } else {
          // Merge items by ID
          return mergeMenuItemsById(prev, preparedItems);
        }
      });
    }

    // 4. Immediately persist imported carta to cloud so incognito users and all devices see it
    setTimeout(() => {
      saveFullCloudMenu({
        restaurants: preparedRestaurants.length > 0 ? preparedRestaurants : restaurants,
        categories: preparedCategories.length > 0 ? preparedCategories : categories,
        items: preparedItems.length > 0 ? preparedItems : menuItems,
        users,
        orders,
      }).catch(() => {});
    }, 100);

    const modeText = mode === 'REPLACE' ? 'reemplazada completamente' : 'añadida / fusionada';
    showToast(`✓ Carta ${modeText} con éxito y guardada en la nube.`);
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

  const handleCustomerMenuClose = () => {
    if (currentUser) {
      setIsCustomerModalOpen(false);
    } else {
      try {
        window.close();
      } catch {}
      setIsMenuClosedByGuest(true);
    }
  };

  const handleOpenCustomerPreview = (restaurant?: Restaurant, mode?: 'DINE_IN' | 'DELIVERY', tableNumber?: string) => {
    const target = restaurant || restaurants.find(r => r.id === selectedRestaurantId) || restaurants[0];
    setPreviewRestaurant(target);
    setPreviewMode(mode || 'DINE_IN');
    setPreviewTableNumber(tableNumber);
    setIsMenuClosedByGuest(false);
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

  // 1. Initial State: Directly display Digital Menu ONLY for QR links / restaurant slug links without logged-in session
  if (!currentUser && (initParams.isQr || initParams.restSlug) && previewRestaurant) {
    // If the guest explicitly closed the menu, show ONLY the thank you screen
    if (isMenuClosedByGuest) {
      const restColor = previewRestaurant?.branding?.primaryColor || '#1B667A';
      const secColor = previewRestaurant?.branding?.secondaryColor || '#8A9B57';
      const btnColor = previewRestaurant?.branding?.buttonColor || '#D98262';
      const creamColor = previewRestaurant?.branding?.buttonTextColor || '#EAEBDC';

      return (
        <div 
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none font-sans"
          style={{ backgroundColor: `${restColor}F5`, color: creamColor }}
        >
          <div 
            className="max-w-md w-full p-8 rounded-3xl border shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in zoom-in-95 duration-200"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', borderColor: `${secColor}60` }}
          >
            <div 
              className="w-16 h-16 mx-auto rounded-full border flex items-center justify-center"
              style={{ backgroundColor: `${secColor}30`, borderColor: secColor }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: secColor }} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Fredoka, Outfit, sans-serif' }}>
                ¡Gracias por tu visita!
              </h2>
              <p className="text-sm opacity-85 leading-relaxed">
                Has cerrado la carta digital de <strong>{previewRestaurant?.name || 'nuestro restaurante'}</strong>. Ya puedes cerrar esta pestaña de tu navegador.
              </p>
            </div>
            
            <button
              onClick={() => {
                setIsMenuClosedByGuest(false);
                setIsCustomerModalOpen(true);
              }}
              style={{ backgroundColor: btnColor, color: creamColor }}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide transition shadow-lg cursor-pointer hover:brightness-110"
            >
              Volver a abrir la Carta Digital
            </button>
          </div>

          {/* Discrete staff portal trigger */}
          <div className="mt-8">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-xs opacity-35 hover:opacity-90 transition underline underline-offset-4 cursor-pointer"
            >
              Acceso exclusivo para el personal
            </button>
          </div>

          {/* Authentication Modal with DNI for Staff */}
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            users={users}
            currentUser={currentUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
          />
        </div>
      );
    }

    // Direct standalone full-screen digital menu for QR scan visitors
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black">
        <CustomerMenuModal
          isOpen={true}
          onClose={handleCustomerMenuClose}
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

        {/* Authentication Modal with DNI (if opened by staff) */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          users={users}
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
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
      <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black">
        <LoginScreen
          users={users}
          onLogin={handleLogin}
          restaurants={restaurants}
          onOpenCustomerPreview={handleOpenCustomerPreview}
        />
      </div>
    );
  }

  // 2. Non-Admin Role Views: "Las vistas deberán corresponder al rol del usuario que se loguee"
  // "La vista actual, solo será vista cuando el que se loguee sea un administrador"
  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black">
        
        {/* Dedicated Role Header with User Profile, Restaurant and Logout */}
        <RoleHeader
          currentUser={currentUser}
          restaurant={currentSelectedRest}
          onLogout={handleLogout}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenCustomerPreview={() => handleOpenCustomerPreview()}
          onSyncFirebase={handleSyncFromFirebase}
          isSyncingFirebase={isSyncingFirebase}
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
              onSwitchToAdminView={() => {
                showToast('Se requieren credenciales de Administrador (DNI: 00448157) para acceder a la vista global SaaS.');
                setIsLoginModalOpen(true);
              }}
              onImportBackupJSON={handleImportBackupJSON}
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
        onSyncFirebase={handleSyncFromFirebase}
        isSyncingFirebase={isSyncingFirebase}
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
                onDeleteRestaurant={handleDeleteRestaurant}
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
                onDeleteRestaurant={handleDeleteRestaurant}
                onUpdateMenuItem={handleUpdateMenuItem}
                onAddMenuItem={handleAddMenuItem}
                onOpenCustomerPreview={handleOpenCustomerPreview}
                onImportBackupJSON={handleImportBackupJSON}
              />
            )}

            {activeTab === 'users' && (
              <UsersView
                users={users}
                restaurants={restaurants}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                currentUser={currentUser}
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

      {/* Authentication Modal with DNI (8 digits) and Universal Access Key ("12345678") */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
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
          onClose={() => setIsTemplateSplitEditorOpen(false)}
        />
      )}

    </div>
  );
}
