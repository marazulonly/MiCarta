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
  type: 'FULL_SYNC' | 'ITEM_UPDATED' | 'ITEM_DELETED' | 'RESTAURANT_UPDATED' | 'CATEGORY_UPDATED' | 'CATEGORY_DELETED' | 'CONNECTED';
  data?: any;
  item?: MenuItem;
  items?: MenuItem[];
  itemId?: string;
  restaurant?: Restaurant;
  restaurants?: Restaurant[];
  category?: MenuCategory;
  categories?: MenuCategory[];
  categoryId?: string;
}) => void;

// Upstash Cloud Redis credentials
export const UPSTASH_REST_URL = 'https://tough-raccoon-293580.upstash.io';
export const UPSTASH_REST_TOKEN = 'gQAAAAAABHrMAAIgcDExYmEwMjliM2FlZTg0NjJjOTM3ZWRhOTI3MmY4MTlmYg';

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
    const cleanPayload = {
      ...payload,
      updatedAt: new Date().toISOString()
    };
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
 * Fetch latest menu from cloud hosting (Upstash).
 * Prioritizes remote cloud hosting over anything local.
 */
export async function fetchLatestCloudMenu(): Promise<CloudMenuPayload | null> {
  // 1. Direct Upstash Cloud Hosting (Primary)
  const upstashData = await fetchFromUpstashDirectly();
  if (upstashData && (upstashData.restaurants?.length || upstashData.items?.length)) {
    return upstashData;
  }

  // 2. Fallback to Express backend endpoint if present
  try {
    const res = await fetch('/api/cloud-menu?_t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch {}

  return null;
}

/**
 * Save complete menu data to cloud hosting (Upstash).
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

  // 1. Save directly to Upstash Cloud Hosting
  const ok = await saveToUpstashDirectly(fullPayload);

  // 2. Mirror to Express server if reachable
  try {
    fetch('/api/cloud-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload)
    }).catch(() => {});
  } catch {}

  return ok;
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
export function subscribeToCloudUpdates(listener: CloudSyncListener): () => void {
  let isClosed = false;
  let lastSeenTimestamp: string | null = null;

  // Poll Upstash every 4 seconds
  const pollInterval = setInterval(async () => {
    if (isClosed) return;
    try {
      const remoteData = await fetchFromUpstashDirectly();
      if (remoteData) {
        const currentStamp = remoteData.updatedAt || 'initial';
        if (lastSeenTimestamp && currentStamp !== lastSeenTimestamp) {
          listener({ type: 'FULL_SYNC', data: remoteData });
        }
        lastSeenTimestamp = currentStamp;
      }
    } catch {}
  }, 4000);

  return () => {
    isClosed = true;
    clearInterval(pollInterval);
  };
}
