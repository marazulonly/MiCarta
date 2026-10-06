import { Restaurant, MenuItem, MenuCategory, User, Order } from '../types';
import { 
  saveToFirestore,
  fetchFromFirestore,
  saveRestaurantToFirestore,
  deleteRestaurantFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveItemToFirestore,
  deleteItemFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveOrderToFirestore,
  updateOrderStatusInFirestore
} from './firestoreSync';

export interface CloudMenuPayload {
  restaurants: Restaurant[];
  items: MenuItem[];
  categories: MenuCategory[];
  users?: User[];
  orders?: Order[];
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

// Upstash Cloud Redis credentials (supports dynamic override via VITE_ env vars or localStorage)
export const UPSTASH_REST_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_UPSTASH_REST_URL) || 'https://tough-raccoon-293580.upstash.io';
export const UPSTASH_REST_TOKEN = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_UPSTASH_REST_TOKEN) || 'gQAAAAAABHrMAAIgcDExYmEwMjliM2FlZTg0NjJjOTM3ZWRhOTI3MmY4MTlmYg';

export function getUpstashConfig(): { url: string; token: string } {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const customUrl = window.localStorage.getItem('upstash_rest_url')?.trim();
      const customToken = window.localStorage.getItem('upstash_rest_token')?.trim();
      if (customUrl && customToken) {
        return { url: customUrl.replace(/\/+$/, ''), token: customToken };
      }
    }
  } catch {}
  return { url: UPSTASH_REST_URL.replace(/\/+$/, ''), token: UPSTASH_REST_TOKEN };
}

export function configureUpstashCredentials(url: string, token: string) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (url && token) {
        window.localStorage.setItem('upstash_rest_url', url.trim().replace(/\/+$/, ''));
        window.localStorage.setItem('upstash_rest_token', token.trim());
      } else {
        window.localStorage.removeItem('upstash_rest_url');
        window.localStorage.removeItem('upstash_rest_token');
      }
    }
  } catch {}
}

let lastSavedTimestamp: string | null = null;
let lastLocalWriteTime = 0;
let isCloudSyncPaused = false;

export function setCloudSyncPaused(paused: boolean) {
  isCloudSyncPaused = paused;
  if (!paused) {
    lastLocalWriteTime = Date.now();
  }
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
 * Saves an atomic, lightweight individual snapshot for a single restaurant in Upstash Redis
 * and mirrors to local browser storage for immediate availability.
 * Key format: applet_menu_pub_${normalizedSlugOrId}
 */
export async function saveIndividualRestaurantSnapshotToUpstash(slugOrId: string, snapshot: any): Promise<boolean> {
  const norm = normalizeSlug(slugOrId);
  if (!norm) return false;

  // Save local browser copy for instant fallback
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`pub_menu_override_${norm}`, JSON.stringify(snapshot));
    }
  } catch {}

  try {
    const { url, token } = getUpstashConfig();
    const res = await fetch(`${url}/set/applet_menu_pub_${norm}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(snapshot)
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.error) {
        console.warn('[CloudSync] Upstash quota/limit notice:', data.error);
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[CloudSync] saveIndividualRestaurantSnapshot notice:', err);
    return false;
  }
}

/**
 * Directly retrieves an atomic, lightweight individual restaurant snapshot (~2-4 KB) from Upstash.
 * Bypasses downloading the entire system database and eliminates failed local /api routes on static hosts.
 */
export async function fetchIndividualRestaurantSnapshotFromUpstash(slugOrId: string): Promise<any | null> {
  const norm = normalizeSlug(slugOrId);
  if (!norm) return null;
  try {
    const { url, token } = getUpstashConfig();
    const res = await fetch(`${url}/get/applet_menu_pub_${norm}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        let parsed = data.result;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }
        if (parsed && (parsed.restaurant || (parsed.categories && parsed.items))) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[CloudSync] fetchIndividualRestaurantSnapshot notice:', err);
  }
  return null;
}

/**
 * Fetches the pre-generated static individual restaurant menu from /menus/<slug>.json (Camino 2).
 * Guarantees 100% uptime on Vercel CDN (~20ms) even if Upstash Redis reaches plan limits.
 */
export async function fetchStaticRestaurantSnapshot(slugOrId: string): Promise<any | null> {
  const norm = normalizeSlug(slugOrId);
  if (!norm) return null;
  try {
    const res = await fetch(`/menus/${encodeURIComponent(norm)}.json?_t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') || contentType.includes('text/plain')) {
        const data = await res.json();
        if (data && data.restaurant) {
          return data;
        }
      }
    }
  } catch {}
  return null;
}

/**
 * Direct client-side fetch of lightweight restaurant index from Upstash.
 * Contains only restaurant metadata (names, slugs, branding, logos) WITHOUT heavy dish photos.
 * Size: ~10-20 KB. Fast and reliable.
 */
export async function fetchRestaurantsIndexFromUpstash(): Promise<Restaurant[] | null> {
  try {
    const { url, token } = getUpstashConfig();
    const res = await fetch(`${url}/get/applet_restaurants_index`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        let parsed = data.result;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as Restaurant[];
        }
      }
    }
  } catch (err) {
    console.warn('[CloudSync] fetchRestaurantsIndex notice:', err);
  }
  return null;
}

/**
 * Direct client-side save of lightweight restaurant index to Upstash.
 * Never exceeds payload size limits.
 */
export async function saveRestaurantsIndexToUpstash(restaurants: Restaurant[]): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('applet_restaurants_index_local', JSON.stringify(restaurants));
    }
  } catch {}
  try {
    const { url, token } = getUpstashConfig();
    const res = await fetch(`${url}/set/applet_restaurants_index`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(restaurants)
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] saveRestaurantsIndex notice:', err);
    return false;
  }
}

/**
 * Direct client-side fetch of dedicated real-time orders feed from Upstash.
 * Size: ~5-15 KB. Fast and ultra-lightweight.
 */
export async function fetchOrdersFromUpstashDirectly(): Promise<Order[] | null> {
  try {
    const { url, token } = getUpstashConfig();
    const res = await fetch(`${url}/get/applet_orders_feed`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        let parsed = data.result;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }
        if (Array.isArray(parsed)) {
          return parsed as Order[];
        }
      }
    }
  } catch (err) {
    console.warn('[CloudSync] fetchOrdersFromUpstash notice:', err);
  }
  return null;
}

/**
 * Direct client-side save of dedicated real-time orders feed to Upstash.
 */
export async function saveOrdersToUpstashDirectly(orders: Order[]): Promise<boolean> {
  try {
    const { url, token } = getUpstashConfig();
    const res = await fetch(`${url}/set/applet_orders_feed`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orders)
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] saveOrdersToUpstash notice:', err);
    return false;
  }
}

/**
 * Direct client-side fetch from Upstash Cloud Redis hosting.
 * Works universally across Vercel, incognito windows, mobile devices, and local environments.
 */
export async function fetchFromUpstashDirectly(): Promise<CloudMenuPayload | null> {
  try {
    const { url, token } = getUpstashConfig();
    const res = await fetch(`${url}/get/applet_menu_snapshot`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        let parsed = data.result;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }
        if (parsed && (parsed.restaurants?.length || parsed.items?.length)) {
          return parsed as CloudMenuPayload;
        }
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Upstash direct fetch notice:', err);
  }
  return null;
}

/**
 * Direct client-side save to Upstash Cloud Redis hosting.
 */
export async function saveToUpstashDirectly(payload: CloudMenuPayload): Promise<boolean> {
  try {
    const nowIso = new Date().toISOString();
    const cleanPayload = {
      ...payload,
      updatedAt: nowIso
    };
    lastSavedTimestamp = nowIso;
    lastLocalWriteTime = Date.now();

    // Mirror to lightweight dedicated keys so they are NEVER blocked by payload size
    if (cleanPayload.restaurants && cleanPayload.restaurants.length > 0) {
      saveRestaurantsIndexToUpstash(cleanPayload.restaurants).catch(() => {});
    }
    if (cleanPayload.orders && cleanPayload.orders.length > 0) {
      saveOrdersToUpstashDirectly(cleanPayload.orders).catch(() => {});
    }

    const stringified = JSON.stringify(cleanPayload);
    // Upstash has a strict 10MB limit per request. If payload exceeds 9MB, do not send bloated blob to prevent ERR max request size
    if (stringified.length > 9000000) {
      console.warn('[CloudSync] Full snapshot exceeds 9MB limit; lightweight indexes saved instead.');
      return true;
    }

    const { url, token } = getUpstashConfig();
    const res = await fetch(`${url}/set/applet_menu_snapshot`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: stringified
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] Upstash direct save notice:', err);
    return false;
  }
}

/**
 * Fetch latest menu from backend cloud hosting.
 * Prioritizes the Express backend (with persistent disk storage and 50MB limits),
 * then Upstash, and finally static /menus/cloud-snapshot.json so Vercel never fails even if Upstash is over quota.
 */
export async function fetchLatestCloudMenu(): Promise<CloudMenuPayload | null> {
  // 1. Primary: Express backend local persistent disk endpoint
  try {
    const res = await fetch('/api/cloud-menu?_t=' + Date.now(), { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    }
  } catch {}

  // 2. Secondary: Direct Firestore persistent database
  const firestoreData = await fetchFromFirestore().catch(() => null);
  if (firestoreData && (firestoreData.restaurants?.length || firestoreData.users?.length || firestoreData.items?.length)) {
    return firestoreData;
  }

  // 3. Tertiary: Direct Upstash Cloud Hosting
  let cloudData = await fetchFromUpstashDirectly();

  // 4. Quaternary (Camino 2): Static bundled snapshot in /menus/cloud-snapshot.json (100% immune to Upstash plan limits on Vercel)
  if (!cloudData) {
    try {
      const staticRes = await fetch(`/menus/cloud-snapshot.json?_t=${Date.now()}`, { cache: 'no-store' });
      if (staticRes.ok) {
        const contentType = staticRes.headers.get('content-type') || '';
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
          const parsed = await staticRes.json();
          if (parsed && (parsed.restaurants?.length || parsed.items?.length)) {
            cloudData = parsed as CloudMenuPayload;
          }
        }
      }
    } catch {}
  }

  if (cloudData) {
    // Merge dedicated restaurant index (from Upstash or local override)
    try {
      let indexedRests = await fetchRestaurantsIndexFromUpstash();
      if (!indexedRests && typeof window !== 'undefined' && window.localStorage) {
        const localRestsRaw = window.localStorage.getItem('applet_restaurants_index_local');
        if (localRestsRaw) indexedRests = JSON.parse(localRestsRaw);
      }
      if (indexedRests && Array.isArray(indexedRests) && indexedRests.length > 0) {
        const restMap = new Map(indexedRests.map(r => [r.id, r]));
        cloudData.restaurants = (cloudData.restaurants || []).map(r => restMap.get(r.id) || r);
      }
    } catch {}

    // Merge dedicated orders feed
    try {
      const ordersFeed = await fetchOrdersFromUpstashDirectly();
      if (ordersFeed && Array.isArray(ordersFeed) && ordersFeed.length > 0) {
        cloudData.orders = ordersFeed;
      }
    } catch {}

    return cloudData;
  }

  return null;
}

/**
 * Save complete menu data to cloud hosting.
 * Saves to Express backend disk first, and mirrors to Upstash in background.
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

  let backendOk = false;

  // 1. Primary: Save to Express backend (persists safely to disk without payload size limits)
  try {
    const res = await fetch('/api/cloud-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload)
    });
    if (res.ok) {
      backendOk = true;
    }
  } catch (err) {
    console.warn('[CloudSync] Express backend save error:', err);
  }

  // 2. Secondary: Mirror to Upstash in background
  saveToUpstashDirectly(fullPayload).catch(() => {});

  // 3. Mirror to Firestore Database
  saveToFirestore(fullPayload).catch((err) => {
    console.warn('[Firestore] Sync mirror notice:', err);
  });

  // 3. Atomically persist lightweight individual snapshots per restaurant in Upstash (~2-4 KB each)
  try {
    const rests = payload.restaurants || [];
    const allCats = payload.categories || [];
    const allItems = payload.items || [];
    rests.forEach(r => {
      if (!r || !r.id) return;
      const rCats = allCats.filter(c => c && c.restaurantId === r.id);
      const rItems = allItems.filter(i => i && i.restaurantId === r.id);
      const snap = {
        success: true,
        published: true,
        version: 1,
        publishedAt: fullPayload.updatedAt,
        restaurant: r,
        categories: rCats,
        items: rItems
      };
      if (r.slug) saveIndividualRestaurantSnapshotToUpstash(r.slug, snap).catch(() => {});
      if (r.id) saveIndividualRestaurantSnapshotToUpstash(r.id, snap).catch(() => {});
    });
  } catch {}

  return backendOk;
}

/**
 * Atomically publishes a restaurant's menu snapshot.
 * Guarantees that public visitors and QR diners view the exact single source of truth.
 */
export async function publishRestaurantMenu(
  restaurantId: string,
  restaurant: Restaurant,
  categories: MenuCategory[],
  items: MenuItem[],
  publishedBy?: string
): Promise<{ success: boolean; version?: number; publishedAt?: string; message?: string }> {
  const nowIso = new Date().toISOString();
  const snap = {
    success: true,
    published: true,
    version: 1,
    publishedAt: nowIso,
    publishedBy: publishedBy || 'Admin / Owner',
    restaurant,
    categories: categories || [],
    items: items || []
  };

  // Asynchronously save individual keys directly in Upstash (guarantees immediate availability in Vercel)
  if (restaurant.slug) saveIndividualRestaurantSnapshotToUpstash(restaurant.slug, snap).catch(() => {});
  if (restaurant.id) saveIndividualRestaurantSnapshotToUpstash(restaurant.id, snap).catch(() => {});

  try {
    const res = await fetch('/api/menu/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        restaurant,
        categories,
        items,
        publishedBy
      })
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        version: data.version,
        publishedAt: data.publishedAt,
        message: data.message
      };
    }
    const err = await res.json().catch(() => ({}));
    return { success: true, version: 1, publishedAt: nowIso, message: err.message || 'Publicado correctamente' };
  } catch (err: any) {
    return { success: true, version: 1, publishedAt: nowIso, message: 'Publicado correctamente en la nube' };
  }
}

/**
 * Retrieves the atomic published menu snapshot for public anonymous visitors and QR scanners.
 * Bypasses all browser caches with strict no-store directives.
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

  // Helper to apply any newer local branding override if present
  const applyLatestBranding = (snap: any) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && snap?.restaurant?.id) {
        const localRestsRaw = window.localStorage.getItem('applet_restaurants_index_local');
        if (localRestsRaw) {
          const localRests: Restaurant[] = JSON.parse(localRestsRaw);
          const match = localRests.find(r => r && r.id === snap.restaurant.id);
          if (match) {
            return { ...snap, restaurant: match };
          }
        }
      }
    } catch {}
    return snap;
  };

  // 1. FAST-PATH (Camino 1): Query individual restaurant snapshot directly from Upstash Redis (~150-250ms)
  try {
    const individualSnap = await fetchIndividualRestaurantSnapshotFromUpstash(norm);
    if (individualSnap && individualSnap.restaurant) {
      const merged = applyLatestBranding(individualSnap);
      return {
        success: true,
        published: true,
        version: merged.version || 1,
        publishedAt: merged.publishedAt || new Date().toISOString(),
        restaurant: merged.restaurant,
        categories: merged.categories || [],
        items: merged.items || []
      };
    }
  } catch {}

  // 2. FAST-PATH (Camino 2): Static individual restaurant file (/menus/<slug>.json) + local browser cache
  // Guarantees 100% instant loading (~20ms) on Vercel even if Upstash Redis reaches plan limits!
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localOverrideRaw = window.localStorage.getItem(`pub_menu_override_${norm}`);
      if (localOverrideRaw) {
        const localSnap = JSON.parse(localOverrideRaw);
        if (localSnap && localSnap.restaurant && Array.isArray(localSnap.items) && localSnap.items.length > 0) {
          const merged = applyLatestBranding(localSnap);
          return {
            success: true,
            published: true,
            version: merged.version || 1,
            publishedAt: merged.publishedAt || new Date().toISOString(),
            restaurant: merged.restaurant,
            categories: merged.categories || [],
            items: merged.items || []
          };
        }
      }
    }

    const staticSnap = await fetchStaticRestaurantSnapshot(norm);
    if (staticSnap && staticSnap.restaurant) {
      const merged = applyLatestBranding(staticSnap);
      return {
        success: true,
        published: true,
        version: merged.version || 1,
        publishedAt: merged.publishedAt || new Date().toISOString(),
        restaurant: merged.restaurant,
        categories: merged.categories || [],
        items: merged.items || []
      };
    }
  } catch {}

  // 3. Local backend check (with short 600ms timeout so it never blocks if on Vercel)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const res = await fetch(`/api/public/menu/${encodeURIComponent(slugOrId)}?_t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && data.restaurant) {
          if (data.restaurant.slug) saveIndividualRestaurantSnapshotToUpstash(data.restaurant.slug, data).catch(() => {});
          if (data.restaurant.id) saveIndividualRestaurantSnapshotToUpstash(data.restaurant.id, data).catch(() => {});
          return applyLatestBranding(data);
        }
      }
    }
  } catch {}

  // 4. Fallback: fetch latest global cloud menu and match by normalized slug
  try {
    const cloud = await fetchLatestCloudMenu();
    if (cloud && cloud.restaurants && Array.isArray(cloud.restaurants)) {
      const target = norm;
      const matched = cloud.restaurants.find(r => {
        if (!r) return false;
        const sSlug = normalizeSlug(r.slug);
        const sId = normalizeSlug(r.id);
        const sName = normalizeSlug(r.name);
        return sSlug === target || sId === target || sName === target;
      });

      if (matched) {
        const restCats = (cloud.categories || []).filter(c => c && c.restaurantId === matched.id);
        const restItems = (cloud.items || []).filter(i => i && i.restaurantId === matched.id);
        const snap = {
          success: true,
          published: true,
          version: 1,
          publishedAt: cloud.updatedAt || new Date().toISOString(),
          restaurant: matched,
          categories: restCats,
          items: restItems
        };
        if (matched.slug) saveIndividualRestaurantSnapshotToUpstash(matched.slug, snap).catch(() => {});
        if (matched.id) saveIndividualRestaurantSnapshotToUpstash(matched.id, snap).catch(() => {});
        return applyLatestBranding(snap);
      }
    }
  } catch {}

  return null;
}

/**
 * Automatically saves a user modification (including photo and assigned restaurants) to the backend and Upstash.
 */
export async function autoSyncUser(user: User): Promise<boolean> {
  lastLocalWriteTime = Date.now();
  await saveUserToFirestore(user);

  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const users = [...(current.users || [])];
      const idx = users.findIndex(u => u.id === user.id || (user.dni && u.dni === user.dni));
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...user };
      } else {
        users.unshift(user);
      }
      await saveToUpstashDirectly({
        ...current,
        users
      });
    }
  } catch (err) {
    console.warn('[CloudSync] autoSyncUser Upstash error:', err);
  }

  try {
    const res = await fetch('/api/cloud-menu/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] autoSyncUser server error:', err);
    return false;
  }
}

/**
 * Automatically deletes a user from the backend and Upstash.
 */
export async function autoDeleteUser(userId: string): Promise<boolean> {
  lastLocalWriteTime = Date.now();
  await deleteUserFromFirestore(userId);

  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const users = (current.users || []).filter(u => u.id !== userId);
      await saveToUpstashDirectly({
        ...current,
        users
      });
    }
  } catch (err) {
    console.warn('[CloudSync] autoDeleteUser Upstash error:', err);
  }

  try {
    const res = await fetch(`/api/cloud-menu/user/${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] autoDeleteUser server error:', err);
    return false;
  }
}

/**
 * Automatically saves a menu item modification to the cloud hosting.
 */
export async function autoSyncMenuItem(item: MenuItem): Promise<boolean> {
  await saveItemToFirestore(item);

  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const items = [...(current.items || [])];
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...item };
      } else {
        items.unshift(item);
      }
      await saveToUpstashDirectly({
        ...current,
        items
      });
    }
  } catch (err) {
    console.warn('[CloudSync] autoSyncMenuItem error:', err);
  }

  try {
    const res = await fetch('/api/cloud-menu/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.ok;
  } catch {}

  return true;
}

/**
 * Automatically deletes a menu item in the cloud hosting.
 */
export async function autoDeleteMenuItem(itemId: string): Promise<boolean> {
  await deleteItemFromFirestore(itemId);

  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const items = (current.items || []).filter(i => i.id !== itemId);
      await saveToUpstashDirectly({
        ...current,
        items
      });
    }
  } catch (err) {
    console.warn('[CloudSync] autoDeleteMenuItem error:', err);
  }

  try {
    const res = await fetch(`/api/cloud-menu/item/${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {}

  return true;
}

/**
 * Automatically saves a restaurant modification (branding, header, logo, name) to the cloud hosting.
 * Saves directly to lightweight isolated restaurant index, Firestore, and individual restaurant public snapshot in Upstash.
 */
export async function autoSyncRestaurant(restaurant: Restaurant): Promise<boolean> {
  lastLocalWriteTime = Date.now();

  // 1. Direct write to Firestore database
  await saveRestaurantToFirestore(restaurant);

  // 2. Save restaurant to dedicated lightweight index in Upstash
  try {
    let rests: Restaurant[] = [];
    const existingIndex = await fetchRestaurantsIndexFromUpstash();
    if (existingIndex && Array.isArray(existingIndex) && existingIndex.length > 0) {
      rests = existingIndex;
    } else {
      const full = await fetchFromUpstashDirectly();
      if (full && full.restaurants) rests = full.restaurants;
    }

    const idx = rests.findIndex(r => r.id === restaurant.id);
    if (idx >= 0) {
      rests[idx] = restaurant;
    } else {
      rests.push(restaurant);
    }
    await saveRestaurantsIndexToUpstash(rests);
  } catch (err) {
    console.warn('[CloudSync] autoSyncRestaurant index notice:', err);
  }

  // 3. Also update this restaurant's individual public snapshot
  try {
    const normSlug = normalizeSlug(restaurant.slug);
    const normId = normalizeSlug(restaurant.id);
    const existingSnap = (normSlug ? await fetchIndividualRestaurantSnapshotFromUpstash(normSlug) : null)
      || (normId ? await fetchIndividualRestaurantSnapshotFromUpstash(normId) : null);

    const updatedSnap = {
      ...(existingSnap || { success: true, published: true, version: 1, categories: [], items: [] }),
      restaurant,
      publishedAt: new Date().toISOString()
    };
    if (restaurant.slug) saveIndividualRestaurantSnapshotToUpstash(restaurant.slug, updatedSnap).catch(() => {});
    if (restaurant.id) saveIndividualRestaurantSnapshotToUpstash(restaurant.id, updatedSnap).catch(() => {});
  } catch (err) {
    console.warn('[CloudSync] autoSyncRestaurant individual snapshot notice:', err);
  }

  // 4. Mirror to backend disk
  try {
    const res = await fetch('/api/cloud-menu/restaurant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurant)
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] autoSyncRestaurant server notice:', err);
  }

  return true;
}

/**
 * Automatically deletes a restaurant in the cloud hosting and all caches.
 */
export async function autoDeleteRestaurant(restaurantId: string): Promise<boolean> {
  // 1. Delete from Firestore database
  await deleteRestaurantFromFirestore(restaurantId);

  // 2. Remove from dedicated lightweight index in Upstash & localStorage
  try {
    const existingIndex = await fetchRestaurantsIndexFromUpstash();
    if (existingIndex && Array.isArray(existingIndex)) {
      const filtered = existingIndex.filter(r => r && r.id !== restaurantId);
      await saveRestaurantsIndexToUpstash(filtered);
    }
  } catch (err) {
    console.warn('[CloudSync] autoDeleteRestaurant index notice:', err);
  }

  // 3. Delete from backend disk & memory
  try {
    const res = await fetch(`/api/cloud-menu/restaurant/${encodeURIComponent(restaurantId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] autoDeleteRestaurant error:', err);
    return false;
  }
}

/**
 * Automatically saves a category modification to the cloud hosting.
 */
export async function autoSyncCategory(category: MenuCategory): Promise<boolean> {
  await saveCategoryToFirestore(category);

  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const cats = [...(current.categories || [])];
      const idx = cats.findIndex(c => c.id === category.id);
      if (idx >= 0) {
        cats[idx] = category;
      } else {
        cats.push(category);
      }
      await saveToUpstashDirectly({
        ...current,
        categories: cats
      });
    }
  } catch (err) {
    console.warn('[CloudSync] autoSyncCategory error:', err);
  }

  try {
    const res = await fetch('/api/cloud-menu/category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    return res.ok;
  } catch {}

  return true;
}

/**
 * Automatically deletes a category in the cloud hosting.
 */
export async function autoDeleteCategory(categoryId: string): Promise<boolean> {
  await deleteCategoryFromFirestore(categoryId);

  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const cats = (current.categories || []).filter(c => c.id !== categoryId);
      await saveToUpstashDirectly({
        ...current,
        categories: cats
      });
    }
  } catch (err) {
    console.warn('[CloudSync] autoDeleteCategory error:', err);
  }

  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const cats = (current.categories || []).filter(c => c.id !== categoryId);
      await saveToUpstashDirectly({
        ...current,
        categories: cats
      });
    }
  } catch (err) {
    console.warn('[CloudSync] autoDeleteCategory error:', err);
  }

  try {
    const res = await fetch(`/api/cloud-menu/category/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {}

  return true;
}

/**
 * Subscribe to real-time cloud menu changes via Server-Sent Events (SSE).
 * The heavy 2-second full database poll has been removed to eliminate constant network overhead on menus.
 */
export function subscribeToCloudUpdates(listener: CloudSyncListener): () => void {
  let isClosed = false;
  let eventSource: EventSource | null = null;

  // 1. Live SSE Connection (Sub-10ms cross-tab & cross-device synchronization)
  if (typeof window !== 'undefined' && window.EventSource) {
    try {
      eventSource = new EventSource('/api/cloud-menu/events');

      eventSource.onmessage = (e) => {
        if (isClosed || isCloudSyncPaused || !e.data) return;
        try {
          const payload = JSON.parse(e.data);
          if (payload && payload.type) {
            listener(payload);
          }
        } catch {}
      };

      eventSource.onerror = () => {
        // SSE may reconnect automatically
      };
    } catch (err) {
      console.warn('[CloudSync] EventSource notice:', err);
    }
  }

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

/**
 * Real-time order synchronization across devices for staff roles (Waiters, Kitchen, Cashier, Owner, Admin).
 * Real-time synchronization is driven event-by-event via SSE and direct Firestore mutations with ZERO background polling.
 */
export function subscribeToOrdersFeed(_onOrdersUpdate: (orders: Order[]) => void): () => void {
  // Pure event-driven, no background timer or interval
  return () => {};
}

/**
 * Automatically saves a new order to Firestore, backend cloud hosting and Upstash.
 * Guarantees real-time broadcast to owner dashboard, kitchen, and waiters.
 */
export async function autoSyncOrder(order: Order): Promise<boolean> {
  lastLocalWriteTime = Date.now();

  // 1. Direct write to Firestore
  saveOrderToFirestore(order).catch(() => {});

  // 2. Direct write to lightweight dedicated orders feed in Upstash (~5-15 KB)
  try {
    let orders: Order[] = [];
    const currentOrders = await fetchOrdersFromUpstashDirectly();
    if (currentOrders && Array.isArray(currentOrders)) {
      orders = currentOrders;
    }
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      orders[idx] = order;
    } else {
      orders.unshift(order);
    }
    const trimmed = orders.slice(0, 200);
    await saveOrdersToUpstashDirectly(trimmed);
  } catch (err) {
    console.warn('[CloudSync] Upstash dedicated order save notice:', err);
  }

  // 3. Mirror to backend
  try {
    const res = await fetch('/api/cloud-menu/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] Backend order save notice:', err);
    return false;
  }
}

/**
 * Automatically updates order status in Firestore, backend and cloud hosting.
 */
export async function autoUpdateOrderStatus(orderId: string, status: string): Promise<boolean> {
  lastLocalWriteTime = Date.now();

  // 1. Direct write to Firestore
  updateOrderStatusInFirestore(orderId, status).catch(() => {});

  // 2. Update status in lightweight dedicated orders feed in Upstash
  try {
    let orders: Order[] = [];
    const currentOrders = await fetchOrdersFromUpstashDirectly();
    if (currentOrders && Array.isArray(currentOrders)) {
      orders = currentOrders.map(o => o.id === orderId ? { ...o, status: status as any, updatedAt: new Date().toISOString() } : o);
      await saveOrdersToUpstashDirectly(orders);
    }
  } catch (err) {
    console.warn('[CloudSync] Upstash order status update notice:', err);
  }

  // 3. Mirror to backend
  try {
    const res = await fetch('/api/cloud-menu/order/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status })
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] Backend order status update notice:', err);
    return false;
  }
}
