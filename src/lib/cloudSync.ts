import { Restaurant, MenuItem, MenuCategory, User, Order, MenuTemplate } from '../types';
import { INITIAL_RESTAURANTS, INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_USERS } from '../data/mockData';
import { 
  saveToFirestore,
  fetchFromFirestore,
  fetchUsersFromFirestore,
  saveRestaurantToFirestore,
  deleteRestaurantFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveItemToFirestore,
  deleteItemFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  savePublishedMenuToFirestore,
  fetchPublishedMenuFromFirestore,
  deletePublishedMenuFromFirestore,
  subscribeToFirestoreRealtime,
  subscribeToRestaurantOrdersRealtime,
  fetchSpecificRestaurantDataFromFirestore,
  fetchTemplatesFromFirestore,
  saveTemplateToFirestore,
  deleteTemplateFromFirestore
} from './firestoreSync';

export interface CloudMenuPayload {
  restaurants: Restaurant[];
  items: MenuItem[];
  categories: MenuCategory[];
  users?: User[];
  orders?: Order[];
  templates?: MenuTemplate[];
  updatedAt?: string;
}

export type CloudSyncListener = (event: {
  type: 'FULL_SYNC' | 'ITEM_UPDATED' | 'ITEM_DELETED' | 'RESTAURANT_UPDATED' | 'CATEGORY_UPDATED' | 'CATEGORY_DELETED' | 'USER_UPDATED' | 'USER_DELETED' | 'MENU_PUBLISHED' | 'ORDER_CREATED' | 'ORDER_UPDATED' | 'CONNECTED';
  data?: any;
  item?: MenuItem;
  items?: MenuItem[];
  itemId?: string;
  restaurant?: Restaurant;
  restaurants?: Restaurant[];
  category?: MenuCategory;
  categories?: MenuCategory[];
  categoryId?: string;
  user?: User;
  users?: User[];
  userId?: string;
  order?: Order;
  orders?: Order[];
  orderId?: string;
  restaurantId?: string;
  slug?: string;
  version?: number;
  publishedAt?: string;
  snapshot?: any;
}) => void;

export const UPSTASH_REST_URL = '';
export const UPSTASH_REST_TOKEN = '';

export function getUpstashConfig(): { url: string; token: string } {
  return { url: '', token: '' };
}

export function configureUpstashCredentials(_url: string, _token: string) {
  // Deprecated: Firestore is the sole source of truth
}

let isCloudSyncPaused = false;

export function setCloudSyncPaused(paused: boolean) {
  isCloudSyncPaused = paused;
}

export function normalizeSlug(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Legacy helper kept for import compatibility; writes directly to Firestore only.
 */
export async function saveIndividualRestaurantSnapshotToUpstash(slugOrId: string, snapshot: any): Promise<boolean> {
  return savePublishedMenuToFirestore(slugOrId, snapshot);
}

const LOGIN_USERS_CACHE_KEY = 'micarta_login_users_cache_v1';
const LOGIN_USERS_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Lightweight user list fetcher for the Login screen with 5-minute LocalStorage TTL cache.
 * Prevents downloading the entire database (items, categories, orders, restaurants) before login.
 */
export async function fetchLoginUsers(forceRefresh = false): Promise<User[]> {
  if (!forceRefresh && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOGIN_USERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0 && Date.now() - (parsed.ts || 0) < LOGIN_USERS_TTL_MS) {
          return parsed.users;
        }
      }
      // Also check if full download cache already has users
      const fullCache = window.localStorage.getItem('micarta_download_cache_v1');
      if (fullCache) {
        const parsedFull = JSON.parse(fullCache);
        if (parsedFull && Array.isArray(parsedFull.users) && parsedFull.users.length > 0 && Date.now() - (parsedFull.cachedAt || 0) < LOGIN_USERS_TTL_MS) {
          return parsedFull.users;
        }
      }
    } catch {}
  }

  const remoteUsers = await fetchUsersFromFirestore();
  if (remoteUsers && remoteUsers.length > 0) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LOGIN_USERS_CACHE_KEY, JSON.stringify({ users: remoteUsers, ts: Date.now() }));
      } catch {}
    }
    return remoteUsers;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOGIN_USERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          return parsed.users;
        }
      }
      const fullCache = window.localStorage.getItem('micarta_download_cache_v1');
      if (fullCache) {
        const parsedFull = JSON.parse(fullCache);
        if (parsedFull && Array.isArray(parsedFull.users) && parsedFull.users.length > 0) {
          return parsedFull.users;
        }
      }
    } catch {}
  }

  return INITIAL_USERS;
}

export function getCachedCloudMenu(): CloudMenuPayload | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cached = window.localStorage.getItem('micarta_download_cache_v1');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
  }
  return null;
}

export function updateCachedCloudMenuPartial(partial: Partial<CloudMenuPayload>) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const existing = getCachedCloudMenu() || {
      restaurants: [],
      categories: [],
      items: [],
      users: [],
      orders: []
    };
    const merged = {
      ...existing,
      ...partial,
      cachedAt: Date.now(),
      updatedAt: new Date().toISOString()
    };
    window.localStorage.setItem('micarta_download_cache_v1', JSON.stringify(merged));
    if (partial.users && partial.users.length > 0) {
      window.localStorage.setItem(LOGIN_USERS_CACHE_KEY, JSON.stringify({ users: partial.users, ts: Date.now() }));
    }
  } catch {}
}

/**
 * Fetch latest menu directly and exclusively from Firestore persistent database.
 * Firestore is the sole source of truth.
 * Falls back to read-only LocalStorage cache ("datos de descarga") or default mock data on Firestore failure/quota limit.
 */
export async function fetchLatestCloudMenu(): Promise<CloudMenuPayload | null> {
  try {
    const firestoreData = await fetchFromFirestore();
    if (firestoreData) {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('micarta_download_cache_v1', JSON.stringify(firestoreData));
        } catch {}
      }
      return firestoreData;
    }
  } catch (err) {
    console.warn('[Firestore] Notice during direct Firestore fetch:', err);
  }

  // Fallback to downloaded cache (datos de descarga)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cached = window.localStorage.getItem('micarta_download_cache_v1');
      if (cached) {
        console.log('[Firestore Sync] Using downloaded cache due to rate limit/quota');
        return JSON.parse(cached);
      }
    } catch {}
  }

  // Fallback to mock data if there is absolutely no cache, to avoid a completely empty screen
  console.log('[Firestore Sync] Using default mock data fallback due to rate limit/quota');
  return {
    restaurants: INITIAL_RESTAURANTS,
    categories: INITIAL_CATEGORIES,
    items: INITIAL_MENU_ITEMS,
    users: INITIAL_USERS,
    orders: []
  };
}

/**
 * Save complete menu data directly and exclusively to Firestore.
 */
export async function saveFullCloudMenu(payload: {
  restaurants?: Restaurant[];
  items?: MenuItem[];
  categories?: MenuCategory[];
  users?: User[];
  orders?: Order[];
}): Promise<boolean> {
  const fullPayload: CloudMenuPayload = {
    restaurants: payload.restaurants || [],
    items: payload.items || [],
    categories: payload.categories || [],
    users: payload.users || [],
    orders: payload.orders || [],
    updatedAt: new Date().toISOString()
  };

  return await saveToFirestore(fullPayload);
}

/**
 * Atomically publishes a restaurant's menu snapshot directly to Firestore (Single Source of Truth).
 */
export async function publishRestaurantMenu(
  restaurantId: string,
  restaurant: Restaurant,
  categories: MenuCategory[],
  items: MenuItem[],
  publishedBy?: string
): Promise<{ success: boolean; version?: number; publishedAt?: string; message?: string }> {
  const nowIso = new Date().toISOString();
  const primarySlug = normalizeSlug(restaurant.slug || restaurant.name || restaurantId);
  const normalizedRest: Restaurant = {
    ...restaurant,
    slug: primarySlug
  };

  const snap = {
    success: true,
    published: true,
    version: 1,
    publishedAt: nowIso,
    publishedBy: publishedBy || 'Admin / Owner',
    restaurant: normalizedRest,
    categories: categories || [],
    items: items || []
  };

  const [restOk, menuOk] = await Promise.all([
    saveRestaurantToFirestore(normalizedRest, restaurantId),
    savePublishedMenuToFirestore(primarySlug, snap)
  ]);

  // Always update local public & download cache so edits (like logo or branding) persist even if quota is exceeded
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(`micarta_pub_download_cache_${primarySlug}`, JSON.stringify(snap));
      const existing = getCachedCloudMenu();
      if (existing) {
        const nextRests = Array.isArray(existing.restaurants)
          ? existing.restaurants.some(r => r.id === normalizedRest.id || normalizeSlug(r.slug) === primarySlug)
            ? existing.restaurants.map(r => (r.id === normalizedRest.id || normalizeSlug(r.slug) === primarySlug) ? normalizedRest : r)
            : [normalizedRest, ...existing.restaurants]
          : [normalizedRest];
        updateCachedCloudMenuPartial({ restaurants: nextRests });
      }
    } catch {}
  }

  return { 
    success: restOk && menuOk, 
    version: 1, 
    publishedAt: nowIso, 
    message: restOk && menuOk ? '✓ Carta publicada y guardada correctamente en Firestore.' : '✓ Guardado en memoria local (sincronización diferida por límite de cuota de Firestore).' 
  };
}

// In-flight request deduplication map to avoid duplicate network calls for the same slug
const pendingMenuRequests = new Map<string, Promise<any>>();

export function getCachedPublicMenu(slugOrId: string): any | null {
  const norm = normalizeSlug(slugOrId);
  if (!norm || typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const cached = window.localStorage.getItem(`micarta_pub_download_cache_${norm}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.restaurant || (parsed.items && parsed.items.length > 0))) {
        return {
          success: true,
          published: true,
          version: parsed.version || 1,
          publishedAt: parsed.publishedAt || new Date().toISOString(),
          restaurant: parsed.restaurant,
          categories: parsed.categories || [],
          items: parsed.items || []
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Retrieves the published menu snapshot for public anonymous visitors and QR scanners
 * strictly from Firestore (Single Source of Truth), with robust fallback to "datos de descarga" cache or mockData.
 * Deduplicates in-flight requests to eliminate duplicate calls across components.
 */
export async function fetchPublicPublishedMenu(slugOrId: string): Promise<{
  success: boolean;
  published: boolean;
  version: number;
  publishedAt: string;
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
} | null> {
  const norm = normalizeSlug(slugOrId);
  if (!norm) return null;

  // Deduplicate in-flight requests: if a request is already running for this slug, return the same promise
  if (pendingMenuRequests.has(norm)) {
    return pendingMenuRequests.get(norm)!;
  }

  const fetchPromise = (async () => {
    try {
      const firestoreSnap = await fetchPublishedMenuFromFirestore(norm);
      if (firestoreSnap && firestoreSnap.restaurant) {
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(`micarta_pub_download_cache_${norm}`, JSON.stringify(firestoreSnap));
          } catch {}
        }
        return {
          success: true,
          published: true,
          version: firestoreSnap.version || 1,
          publishedAt: firestoreSnap.publishedAt || new Date().toISOString(),
          restaurant: firestoreSnap.restaurant,
          categories: firestoreSnap.categories || [],
          items: firestoreSnap.items || []
        };
      }
    } catch (err) {
      console.warn('[Firestore] Notice fetching public menu from Firestore:', err);
    }

    // Fallback to public downloaded cache
    const cached = getCachedPublicMenu(norm);
    if (cached) {
      return cached;
    }

    // Fallback to mock data for specific slug
    const fallbackRest = INITIAL_RESTAURANTS.find(r => normalizeSlug(r.slug) === norm || normalizeSlug(r.id) === norm);
    if (fallbackRest) {
      const mSlug = normalizeSlug(fallbackRest.slug || fallbackRest.name || fallbackRest.id);
      const restCats = INITIAL_CATEGORIES.filter(c => c.restaurantId === fallbackRest.id || normalizeSlug(c.restaurantId) === mSlug);
      const restItems = INITIAL_MENU_ITEMS.filter(i => i.restaurantId === fallbackRest.id || normalizeSlug(i.restaurantId) === mSlug);
      return {
        success: true,
        published: true,
        version: 1,
        publishedAt: new Date().toISOString(),
        restaurant: fallbackRest,
        categories: restCats,
        items: restItems
      };
    }

    return null;
  })().finally(() => {
    pendingMenuRequests.delete(norm);
  });

  pendingMenuRequests.set(norm, fetchPromise);
  return fetchPromise;
}

/**
 * Automatically saves a user modification directly to Firestore and updates local cache.
 */
export async function autoSyncUser(user: User): Promise<boolean> {
  try {
    const existing = getCachedCloudMenu();
    if (existing && Array.isArray(existing.users)) {
      const next = existing.users.some(u => u.id === user.id)
        ? existing.users.map(u => u.id === user.id ? user : u)
        : [user, ...existing.users];
      updateCachedCloudMenuPartial({ users: next });
    }
  } catch {}
  return await saveUserToFirestore(user);
}

/**
 * Automatically deletes a user directly from Firestore and updates local cache.
 */
export async function autoDeleteUser(userId: string): Promise<boolean> {
  try {
    const existing = getCachedCloudMenu();
    if (existing && Array.isArray(existing.users)) {
      updateCachedCloudMenuPartial({ users: existing.users.filter(u => u.id !== userId) });
    }
  } catch {}
  return await deleteUserFromFirestore(userId);
}

/**
 * Automatically saves a menu item modification directly to Firestore and updates local cache.
 */
export async function autoSyncMenuItem(item: MenuItem): Promise<boolean> {
  try {
    const existing = getCachedCloudMenu();
    if (existing && Array.isArray(existing.items)) {
      const next = existing.items.some(i => i.id === item.id)
        ? existing.items.map(i => i.id === item.id ? item : i)
        : [item, ...existing.items];
      updateCachedCloudMenuPartial({ items: next });
    }
  } catch {}
  return await saveItemToFirestore(item);
}

/**
 * Automatically deletes a menu item directly from Firestore and updates local cache.
 */
export async function autoDeleteMenuItem(itemId: string): Promise<boolean> {
  try {
    const existing = getCachedCloudMenu();
    if (existing && Array.isArray(existing.items)) {
      updateCachedCloudMenuPartial({ items: existing.items.filter(i => i.id !== itemId) });
    }
  } catch {}
  return await deleteItemFromFirestore(itemId);
}

/**
 * Automatically saves a restaurant modification directly to Firestore and updates local cache.
 */
export async function autoSyncRestaurant(restaurant: Restaurant, previousSlugOrId?: string): Promise<boolean> {
  try {
    const existing = getCachedCloudMenu();
    if (existing && Array.isArray(existing.restaurants)) {
      const next = existing.restaurants.some(r => r.id === restaurant.id)
        ? existing.restaurants.map(r => r.id === restaurant.id ? restaurant : r)
        : [restaurant, ...existing.restaurants];
      updateCachedCloudMenuPartial({ restaurants: next });
    }
  } catch {}
  return await saveRestaurantToFirestore(restaurant, previousSlugOrId);
}

/**
 * Automatically deletes a restaurant directly from Firestore and updates local cache.
 */
export async function autoDeleteRestaurant(restaurantId: string, slug?: string): Promise<boolean> {
  try {
    const existing = getCachedCloudMenu();
    if (existing && Array.isArray(existing.restaurants)) {
      updateCachedCloudMenuPartial({
        restaurants: existing.restaurants.filter(r => r.id !== restaurantId && (!slug || normalizeSlug(r.slug) !== normalizeSlug(slug)))
      });
    }
  } catch {}
  const [firestoreOk] = await Promise.all([
    deleteRestaurantFromFirestore(restaurantId, slug),
    deletePublishedMenuFromFirestore(restaurantId),
    slug ? deletePublishedMenuFromFirestore(slug) : Promise.resolve(true)
  ]);

  return firestoreOk;
}

/**
 * Automatically saves a category modification directly to Firestore and updates local cache.
 */
export async function autoSyncCategory(category: MenuCategory): Promise<boolean> {
  try {
    const existing = getCachedCloudMenu();
    if (existing && Array.isArray(existing.categories)) {
      const next = existing.categories.some(c => c.id === category.id)
        ? existing.categories.map(c => c.id === category.id ? category : c)
        : [...existing.categories, category];
      updateCachedCloudMenuPartial({ categories: next });
    }
  } catch {}
  return await saveCategoryToFirestore(category);
}

/**
 * Automatically deletes a category directly from Firestore and updates local cache.
 */
export async function autoDeleteCategory(categoryId: string): Promise<boolean> {
  try {
    const existing = getCachedCloudMenu();
    if (existing && Array.isArray(existing.categories)) {
      updateCachedCloudMenuPartial({ categories: existing.categories.filter(c => c.id !== categoryId) });
    }
  } catch {}
  return await deleteCategoryFromFirestore(categoryId);
}

const TEMPLATES_CACHE_KEY = 'micarta_templates_cache_v1';

export function getCachedTemplates(): MenuTemplate[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(TEMPLATES_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return [];
}

export function setCachedTemplates(templates: MenuTemplate[]) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(TEMPLATES_CACHE_KEY, JSON.stringify(templates));
    } catch {}
  }
}

export async function fetchCloudTemplates(): Promise<MenuTemplate[]> {
  const remote = await fetchTemplatesFromFirestore();
  if (remote !== null) {
    setCachedTemplates(remote);
    return remote;
  }
  return getCachedTemplates();
}

export async function autoSyncTemplate(template: MenuTemplate): Promise<boolean> {
  const current = getCachedTemplates();
  const next = current.some(t => t.id === template.id)
    ? current.map(t => t.id === template.id ? template : t)
    : [template, ...current];
  setCachedTemplates(next);
  return await saveTemplateToFirestore(template);
}

export async function autoDeleteTemplate(templateId: string): Promise<boolean> {
  const current = getCachedTemplates();
  setCachedTemplates(current.filter(t => t.id !== templateId));
  return await deleteTemplateFromFirestore(templateId);
}

/**
 * Performs a one-time fetch of Firestore data upon staff login (no perpetual 5-collection onSnapshot).
 */
export function subscribeToCloudUpdates(listener: CloudSyncListener): () => void {
  return subscribeToFirestoreRealtime((partialPayload) => {
    if (isCloudSyncPaused) return;
    updateCachedCloudMenuPartial(partialPayload);
    listener({
      type: 'FULL_SYNC',
      data: partialPayload
    });
  });
}

/**
 * Targeted real-time subscription ONLY for orders (and optional single restaurant doc) of a specific restaurantId.
 */
export function subscribeToOrdersFeed(
  restaurantId: string,
  onOrdersUpdate: (orders: Order[]) => void,
  onRestaurantDocUpdate?: (restaurant: Restaurant) => void
): () => void {
  return subscribeToRestaurantOrdersRealtime(restaurantId, onOrdersUpdate, onRestaurantDocUpdate);
}

export { fetchSpecificRestaurantDataFromFirestore };

/**
 * Automatically saves a new order directly to Firestore.
 */
export async function autoSyncOrder(order: Order): Promise<boolean> {
  return await saveOrderToFirestore(order);
}

/**
 * Automatically updates order status directly in Firestore.
 */
export async function autoUpdateOrderStatus(orderId: string, status: string): Promise<boolean> {
  return await updateOrderStatusInFirestore(orderId, status);
}
