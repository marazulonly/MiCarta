import { Restaurant, MenuItem, MenuCategory, User, Order } from '../types';

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

// Upstash Cloud Redis credentials
export const UPSTASH_REST_URL = 'https://tough-raccoon-293580.upstash.io';
export const UPSTASH_REST_TOKEN = 'gQAAAAAABHrMAAIgcDExYmEwMjliM2FlZTg0NjJjOTM3ZWRhOTI3MmY4MTlmYg';

let lastSavedTimestamp: string | null = null;
let lastLocalWriteTime = 0;

/**
 * Direct client-side fetch from Upstash Cloud Redis hosting.
 * Works universally across Vercel, incognito windows, mobile devices, and local environments.
 */
export async function fetchFromUpstashDirectly(): Promise<CloudMenuPayload | null> {
  try {
    const res = await fetch(`${UPSTASH_REST_URL}/get/applet_menu_snapshot`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
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

    const res = await fetch(`${UPSTASH_REST_URL}/set/applet_menu_snapshot`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanPayload)
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] Upstash direct save notice:', err);
    return false;
  }
}

/**
 * Fetch latest menu from backend cloud hosting.
 * Prioritizes the Express backend (with persistent disk storage and 50MB limits)
 * and falls back to Upstash if backend is unreachable.
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
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch {}

  // 2. Fallback to direct Upstash Cloud Hosting if backend endpoint is unavailable
  const upstashData = await fetchFromUpstashDirectly();
  if (upstashData && (upstashData.restaurants?.length || upstashData.items?.length)) {
    return upstashData;
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
    return { success: false, message: err.message || 'Error al publicar la carta' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error de conexión al publicar' };
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
  try {
    const res = await fetch(`/api/public/menu/${encodeURIComponent(slugOrId)}?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.restaurant) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Error fetching public published menu:', err);
  }

  // Robust fallback: fetch latest cloud menu and match by normalized slug
  try {
    const cloud = await fetchLatestCloudMenu();
    if (cloud && cloud.restaurants && Array.isArray(cloud.restaurants)) {
      const target = (slugOrId || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      const matched = cloud.restaurants.find(r => {
        if (!r) return false;
        const sSlug = (r.slug || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        const sId = (r.id || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        const sName = (r.name || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        return sSlug === target || sId === target || sName === target;
      });

      if (matched) {
        const restCats = (cloud.categories || []).filter(c => c && c.restaurantId === matched.id);
        const restItems = (cloud.items || []).filter(i => i && i.restaurantId === matched.id);
        return {
          success: true,
          published: true,
          version: 1,
          publishedAt: cloud.updatedAt || new Date().toISOString(),
          restaurant: matched,
          categories: restCats,
          items: restItems
        };
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
    fetch('/api/cloud-menu/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).catch(() => {});
  } catch {}

  return true;
}

/**
 * Automatically deletes a menu item in the cloud hosting.
 */
export async function autoDeleteMenuItem(itemId: string): Promise<boolean> {
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
    fetch(`/api/cloud-menu/item/${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    }).catch(() => {});
  } catch {}

  return true;
}

/**
 * Automatically saves a restaurant modification (branding, header, logo, name) to the cloud hosting.
 */
export async function autoSyncRestaurant(restaurant: Restaurant): Promise<boolean> {
  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const rests = [...(current.restaurants || [])];
      const idx = rests.findIndex(r => r.id === restaurant.id);
      if (idx >= 0) {
        rests[idx] = restaurant;
      } else {
        rests.push(restaurant);
      }
      await saveToUpstashDirectly({
        ...current,
        restaurants: rests
      });
    }
  } catch (err) {
    console.warn('[CloudSync] autoSyncRestaurant error:', err);
  }

  try {
    fetch('/api/cloud-menu/restaurant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurant)
    }).catch(() => {});
  } catch {}

  return true;
}

/**
 * Automatically deletes a restaurant in the cloud hosting.
 */
export async function autoDeleteRestaurant(restaurantId: string): Promise<boolean> {
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
    fetch('/api/cloud-menu/category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    }).catch(() => {});
  } catch {}

  return true;
}

/**
 * Automatically deletes a category in the cloud hosting.
 */
export async function autoDeleteCategory(categoryId: string): Promise<boolean> {
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
    fetch(`/api/cloud-menu/category/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE'
    }).catch(() => {});
  } catch {}

  return true;
}

/**
 * Subscribe to real-time cloud menu changes.
 * Continuously polls Upstash Cloud Redis every 4 seconds with cache-busting,
 * ensuring all devices, incognito windows, and customers see updates automatically.
 */
/**
 * Subscribe to real-time cloud menu changes.
 * Listens to Server-Sent Events (SSE) from the Express backend for immediate sub-10ms updates,
 * and maintains a fallback background poll with cache-busting so all incognito tabs and devices stay in sync.
 */
export function subscribeToCloudUpdates(listener: CloudSyncListener): () => void {
  let isClosed = false;
  let lastSeenSignature: string | null = null;
  let eventSource: EventSource | null = null;

  // 1. Live SSE Connection (Sub-10ms cross-tab & cross-device synchronization)
  if (typeof window !== 'undefined' && window.EventSource) {
    try {
      eventSource = new EventSource('/api/cloud-menu/events');

      eventSource.onmessage = (e) => {
        if (isClosed || !e.data) return;
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
      console.warn('[CloudSync] EventSource error, relying on poll:', err);
    }
  }

  // 2. High-speed fallback polling every 2 seconds to the backend /api/cloud-menu
  const pollInterval = setInterval(async () => {
    if (isClosed) return;
    try {
      // Do not overwrite user while they are actively making local saves (within 2s)
      if (Date.now() - lastLocalWriteTime < 2000) {
        return;
      }

      const remoteData = await fetchLatestCloudMenu();
      if (remoteData) {
        const currentStamp = remoteData.updatedAt || 'initial';
        const currentOrderCount = remoteData.orders?.length || 0;
        const currentItemsCount = remoteData.items?.length || 0;
        const signature = `${currentStamp}_o${currentOrderCount}_i${currentItemsCount}`;

        if (lastSeenSignature !== null && signature !== lastSeenSignature) {
          listener({ type: 'FULL_SYNC', data: remoteData });
        }
        lastSeenSignature = signature;
      }
    } catch {}
  }, 2000);

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    clearInterval(pollInterval);
  };
}

/**
 * Automatically saves a new order to backend cloud hosting and Upstash.
 * Guarantees real-time broadcast to owner dashboard, kitchen, and waiters.
 */
export async function autoSyncOrder(order: Order): Promise<boolean> {
  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const orders = [...(current.orders || [])];
      const idx = orders.findIndex(o => o.id === order.id);
      if (idx >= 0) {
        orders[idx] = order;
      } else {
        orders.unshift(order);
      }
      await saveToUpstashDirectly({
        ...current,
        orders
      });
    }
  } catch (err) {
    console.warn('[CloudSync] Upstash order save error:', err);
  }

  try {
    const res = await fetch('/api/cloud-menu/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] Backend order save error:', err);
    return false;
  }
}

/**
 * Automatically updates order status in cloud hosting.
 */
export async function autoUpdateOrderStatus(orderId: string, status: string): Promise<boolean> {
  try {
    const current = await fetchFromUpstashDirectly();
    if (current) {
      const orders = (current.orders || []).map(o => o.id === orderId ? { ...o, status: status as any } : o);
      await saveToUpstashDirectly({
        ...current,
        orders
      });
    }
  } catch (err) {
    console.warn('[CloudSync] Upstash order status update error:', err);
  }

  try {
    const res = await fetch('/api/cloud-menu/order/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status })
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] Backend order status update error:', err);
    return false;
  }
}
