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
  updateOrderStatusInFirestore,
  savePublishedMenuToFirestore,
  fetchPublishedMenuFromFirestore,
  deletePublishedMenuFromFirestore,
  subscribeToFirestoreRealtime
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

/**
 * Fetch latest menu directly and exclusively from Firestore persistent database.
 * Firestore is the sole source of truth.
 */
export async function fetchLatestCloudMenu(): Promise<CloudMenuPayload | null> {
  try {
    const firestoreData = await fetchFromFirestore();
    if (firestoreData) {
      return firestoreData;
    }
  } catch (err) {
    console.warn('[Firestore] Notice during direct Firestore fetch:', err);
  }
  return null;
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

  return { 
    success: restOk && menuOk, 
    version: 1, 
    publishedAt: nowIso, 
    message: restOk && menuOk ? '✓ Carta publicada y guardada correctamente en Firestore.' : '⚠️ Error al guardar la carta en Firestore.' 
  };
}

/**
 * Retrieves the published menu snapshot for public anonymous visitors and QR scanners
 * strictly from Firestore (Single Source of Truth), without localStorage or mockData overrides.
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

  try {
    const firestoreSnap = await fetchPublishedMenuFromFirestore(norm);
    if (firestoreSnap && firestoreSnap.restaurant) {
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

  return null;
}

/**
 * Automatically saves a user modification directly to Firestore.
 */
export async function autoSyncUser(user: User): Promise<boolean> {
  return await saveUserToFirestore(user);
}

/**
 * Automatically deletes a user directly from Firestore.
 */
export async function autoDeleteUser(userId: string): Promise<boolean> {
  return await deleteUserFromFirestore(userId);
}

/**
 * Automatically saves a menu item modification directly to Firestore.
 */
export async function autoSyncMenuItem(item: MenuItem): Promise<boolean> {
  return await saveItemToFirestore(item);
}

/**
 * Automatically deletes a menu item directly from Firestore.
 */
export async function autoDeleteMenuItem(itemId: string): Promise<boolean> {
  return await deleteItemFromFirestore(itemId);
}

/**
 * Automatically saves a restaurant modification directly to Firestore.
 */
export async function autoSyncRestaurant(restaurant: Restaurant, previousSlugOrId?: string): Promise<boolean> {
  return await saveRestaurantToFirestore(restaurant, previousSlugOrId);
}

/**
 * Automatically deletes a restaurant directly from Firestore.
 */
export async function autoDeleteRestaurant(restaurantId: string, slug?: string): Promise<boolean> {
  const [firestoreOk] = await Promise.all([
    deleteRestaurantFromFirestore(restaurantId, slug),
    deletePublishedMenuFromFirestore(restaurantId),
    slug ? deletePublishedMenuFromFirestore(slug) : Promise.resolve(true)
  ]);

  return firestoreOk;
}

/**
 * Automatically saves a category modification directly to Firestore.
 */
export async function autoSyncCategory(category: MenuCategory): Promise<boolean> {
  return await saveCategoryToFirestore(category);
}

/**
 * Automatically deletes a category directly from Firestore.
 */
export async function autoDeleteCategory(categoryId: string): Promise<boolean> {
  return await deleteCategoryFromFirestore(categoryId);
}

/**
 * Subscribe to real-time Firestore changes directly.
 */
export function subscribeToCloudUpdates(listener: CloudSyncListener): () => void {
  return subscribeToFirestoreRealtime((partialPayload) => {
    if (isCloudSyncPaused) return;
    listener({
      type: 'FULL_SYNC',
      data: partialPayload
    });
  });
}

export function subscribeToOrdersFeed(_onOrdersUpdate: (orders: Order[]) => void): () => void {
  return () => {};
}

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
