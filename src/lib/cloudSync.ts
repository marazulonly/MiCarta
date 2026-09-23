import { Restaurant, MenuItem, MenuCategory, User, Order } from '../types';
import { 
  saveAllDataToFirebase, 
  saveMenuItemToFirebase, 
  deleteMenuItemFromFirebase, 
  saveRestaurantToFirebase, 
  saveCategoryToFirebase, 
  deleteCategoryFromFirebase,
  loadAllDataFromFirebase
} from './firebase';

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

/**
 * Fetch latest menu from cloud.
 * Combines server storage and Firestore, prioritizing the freshest data.
 */
export async function fetchLatestCloudMenu(): Promise<CloudMenuPayload | null> {
  let serverData: CloudMenuPayload | null = null;
  let firestoreData: any = null;

  // 1. Fetch from server endpoint
  try {
    const res = await fetch('/api/cloud-menu');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        serverData = json.data;
      }
    }
  } catch (e) {
    console.warn('[CloudSync] Notice: local server API not reachable, trying Firestore:', e);
  }

  // 2. Query Firestore
  try {
    firestoreData = await loadAllDataFromFirebase();
  } catch (e) {
    console.warn('[CloudSync] Firestore load notice:', e);
  }

  // If server had data, verify if Firestore has anything newer or additional
  if (serverData && (serverData.items?.length || serverData.restaurants?.length)) {
    return serverData;
  }

  // If server had no data yet, but Firestore does:
  if (firestoreData && (firestoreData.items?.length || firestoreData.restaurants?.length)) {
    const payload: CloudMenuPayload = {
      restaurants: firestoreData.restaurants || [],
      items: firestoreData.items || [],
      categories: firestoreData.categories || [],
      users: firestoreData.users || [],
      orders: firestoreData.orders || [],
      updatedAt: new Date().toISOString()
    };
    // Seed server storage asynchronously
    saveFullCloudMenu(payload).catch(() => {});
    return payload;
  }

  return serverData;
}

/**
 * Save complete menu data to cloud (Server + Firestore).
 */
export async function saveFullCloudMenu(payload: {
  restaurants?: Restaurant[];
  items?: MenuItem[];
  categories?: MenuCategory[];
  users?: User[];
  orders?: Order[];
}): Promise<boolean> {
  let serverOk = false;

  // 1. Save to server backend
  try {
    const res = await fetch('/api/cloud-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const json = await res.json();
      serverOk = json.success;
    }
  } catch (e) {
    console.warn('[CloudSync] Server POST notice:', e);
  }

  // 2. Save to Firestore in background
  try {
    saveAllDataToFirebase({
      restaurants: payload.restaurants || [],
      items: payload.items || [],
      categories: payload.categories || [],
      users: payload.users || [],
      orders: payload.orders || []
    }).catch(err => {
      console.warn('[CloudSync] Firestore async sync notice:', err);
    });
  } catch (e) {
    console.warn('[CloudSync] Firestore trigger error:', e);
  }

  return serverOk;
}

/**
 * Automatically saves a menu item modification to the cloud.
 */
export async function autoSyncMenuItem(item: MenuItem): Promise<boolean> {
  let serverOk = false;
  try {
    const res = await fetch('/api/cloud-menu/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (res.ok) serverOk = true;
  } catch (e) {
    console.warn('[CloudSync] Server item sync notice:', e);
  }

  // Always attempt Firestore sync
  try {
    saveMenuItemToFirebase(item).catch(() => {});
  } catch {}

  return serverOk;
}

/**
 * Automatically deletes a menu item in the cloud.
 */
export async function autoDeleteMenuItem(itemId: string): Promise<boolean> {
  let serverOk = false;
  try {
    const res = await fetch(`/api/cloud-menu/item/${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    });
    if (res.ok) serverOk = true;
  } catch (e) {
    console.warn('[CloudSync] Server item delete notice:', e);
  }

  try {
    deleteMenuItemFromFirebase(itemId).catch(() => {});
  } catch {}

  return serverOk;
}

/**
 * Automatically saves a restaurant modification (e.g. branding, header, logo, name) to the cloud.
 */
export async function autoSyncRestaurant(restaurant: Restaurant): Promise<boolean> {
  let serverOk = false;
  try {
    const res = await fetch('/api/cloud-menu/restaurant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurant)
    });
    if (res.ok) serverOk = true;
  } catch (e) {
    console.warn('[CloudSync] Server restaurant sync notice:', e);
  }

  try {
    saveRestaurantToFirebase(restaurant).catch(() => {});
  } catch {}

  return serverOk;
}

/**
 * Automatically saves a category modification to the cloud.
 */
export async function autoSyncCategory(category: MenuCategory): Promise<boolean> {
  let serverOk = false;
  try {
    const res = await fetch('/api/cloud-menu/category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    if (res.ok) serverOk = true;
  } catch (e) {
    console.warn('[CloudSync] Server category sync notice:', e);
  }

  try {
    saveCategoryToFirebase(category).catch(() => {});
  } catch {}

  return serverOk;
}

/**
 * Automatically deletes a category in the cloud.
 */
export async function autoDeleteCategory(categoryId: string): Promise<boolean> {
  let serverOk = false;
  try {
    const res = await fetch(`/api/cloud-menu/category/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE'
    });
    if (res.ok) serverOk = true;
  } catch (e) {
    console.warn('[CloudSync] Server category delete notice:', e);
  }

  try {
    deleteCategoryFromFirebase(categoryId).catch(() => {});
  } catch {}

  return serverOk;
}

/**
 * Subscribe to real-time cloud menu changes using SSE (Server-Sent Events)
 * and periodic health check polling so all clients, including incognito windows,
 * receive menu updates automatically and immediately.
 */
export function subscribeToCloudUpdates(listener: CloudSyncListener): () => void {
  let eventSource: EventSource | null = null;
  let isClosed = false;

  function connectSSE() {
    if (isClosed) return;
    try {
      eventSource = new EventSource('/api/cloud-menu/events');
      
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          listener(data);
        } catch (err) {
          console.warn('[CloudSync] SSE parse error:', err);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Reconnect after 3 seconds
        if (!isClosed) {
          setTimeout(connectSSE, 3000);
        }
      };
    } catch {
      // EventSource not supported or failed, fallback to polling
    }
  }

  connectSSE();

  // Also set up a light polling interval (every 15 seconds) to ensure incognito windows
  // are never stale even if SSE connection drops.
  const pollInterval = setInterval(async () => {
    if (isClosed) return;
    try {
      const res = await fetch('/api/cloud-menu');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          listener({ type: 'FULL_SYNC', data: json.data });
        }
      }
    } catch {}
  }, 15000);

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    clearInterval(pollInterval);
  };
}
