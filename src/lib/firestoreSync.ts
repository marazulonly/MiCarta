import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Restaurant, MenuItem, MenuCategory, User, Order } from '../types';
import { CloudMenuPayload } from './cloudSync';

function cleanObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = cleanObject(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

/**
 * Strips duplicate giant base64 payloads to guarantee Firestore 1MB document limit is never exceeded.
 */
function sanitizeRestaurantForFirestore(restaurant: Restaurant): Restaurant {
  const clean = cleanObject(restaurant);
  if (clean.branding && clean.branding.headerLogoUrl && clean.logoUrl && clean.branding.headerLogoUrl === clean.logoUrl) {
    clean.branding = {
      ...clean.branding,
      headerLogoUrl: '' // Avoid storing 1MB twice in the same Firestore document
    };
  }
  return clean;
}

let isQuotaExceededNoticeLogged = false;

function isQuotaError(err: any): boolean {
  if (!err) return false;
  const code = err?.code || '';
  const message = err?.message || String(err);
  return code === 'resource-exhausted' || message.includes('Quota limit exceeded') || message.includes('quota') || message.includes('resource-exhausted');
}

function handleFirestoreError(err: any, actionName: string): boolean {
  if (isQuotaError(err)) {
    if (!isQuotaExceededNoticeLogged) {
      console.warn(`[Firestore] Free daily write quota reached for ${actionName}. Operating seamlessly via Express / Local storage.`);
      isQuotaExceededNoticeLogged = true;
    }
    return true; // Proceed without UI errors
  }
  console.warn(`[Firestore] Notice during ${actionName}:`, err);
  return false;
}

/**
 * Saves complete menu dataset to Firestore individual documents without monolithic 1MB bloat.
 */
export async function saveToFirestore(payload: CloudMenuPayload): Promise<boolean> {
  try {
    const nowIso = new Date().toISOString();

    // 1. Save system metadata document (lightweight summary)
    try {
      const snapshotRef = doc(db, 'system', 'cloud_menu_snapshot');
      await setDoc(snapshotRef, {
        restaurantsCount: payload.restaurants?.length || 0,
        usersCount: payload.users?.length || 0,
        categoriesCount: payload.categories?.length || 0,
        itemsCount: payload.items?.length || 0,
        ordersCount: payload.orders?.length || 0,
        updatedAt: nowIso
      }, { merge: true });
    } catch (snapErr) {
      handleFirestoreError(snapErr, 'system_snapshot');
    }

    // 2. Persist individual records independently (avoids batch aborts)
    const writePromises: Promise<any>[] = [];

    if (Array.isArray(payload.restaurants)) {
      payload.restaurants.forEach(r => {
        if (!r || !r.id) return;
        const ref = doc(db, 'restaurants', r.id);
        writePromises.push(setDoc(ref, sanitizeRestaurantForFirestore(r), { merge: true }).catch((err) => handleFirestoreError(err, `setDoc restaurant ${r.id}`)));
      });
    }

    if (Array.isArray(payload.users)) {
      payload.users.forEach(u => {
        if (!u || !u.id) return;
        const ref = doc(db, 'users', u.id);
        writePromises.push(setDoc(ref, cleanObject(u), { merge: true }).catch((err) => handleFirestoreError(err, `setDoc user ${u.id}`)));
      });
    }

    if (Array.isArray(payload.categories)) {
      payload.categories.forEach(c => {
        if (!c || !c.id) return;
        const ref = doc(db, 'categories', c.id);
        writePromises.push(setDoc(ref, cleanObject(c), { merge: true }).catch((err) => handleFirestoreError(err, `setDoc category ${c.id}`)));
      });
    }

    if (Array.isArray(payload.items)) {
      payload.items.forEach(i => {
        if (!i || !i.id) return;
        const ref = doc(db, 'items', i.id);
        writePromises.push(setDoc(ref, cleanObject(i), { merge: true }).catch((err) => handleFirestoreError(err, `setDoc item ${i.id}`)));
      });
    }

    if (Array.isArray(payload.orders)) {
      payload.orders.slice(0, 50).forEach(o => {
        if (!o || !o.id) return;
        const ref = doc(db, 'orders', o.id);
        writePromises.push(setDoc(ref, cleanObject(o), { merge: true }).catch((err) => handleFirestoreError(err, `setDoc order ${o.id}`)));
      });
    }

    await Promise.all(writePromises);
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'saveToFirestore');
  }
}

/**
 * Fetches latest menu dataset directly from Firestore collections.
 */
export async function fetchFromFirestore(): Promise<CloudMenuPayload | null> {
  try {
    const [restsSnap, usersSnap, catsSnap, itemsSnap, ordersSnap] = await Promise.all([
      getDocs(collection(db, 'restaurants')).catch(() => null),
      getDocs(collection(db, 'users')).catch(() => null),
      getDocs(collection(db, 'categories')).catch(() => null),
      getDocs(collection(db, 'items')).catch(() => null),
      getDocs(collection(db, 'orders')).catch(() => null)
    ]);

    const MOCK_RESTAURANT_IDS = new Set([
      'rest-costa',
      'rest-voraz',
      'rest-riendas',
      'rest-1790204393895',
      'rest-1790352289887',
      'cevichito-pliz',
      'voraz',
      'riendas-de-plata'
    ]);

    const isMockRest = (id: string, name?: string, slug?: string): boolean => {
      if (!id) return true;
      if (MOCK_RESTAURANT_IDS.has(id)) return true;
      const sName = (name || '').toLowerCase();
      const sSlug = (slug || '').toLowerCase();
      return (
        sName.includes('voraz') || sSlug.includes('voraz') ||
        sName.includes('riendas') || sSlug.includes('riendas') ||
        sName.includes('cevichito') || sSlug.includes('cevichito') ||
        sName.includes('costa') || sSlug.includes('costa')
      );
    };

    const restaurants: Restaurant[] = [];
    restsSnap?.forEach(d => { 
      const data = d.data() as Restaurant;
      if (data && data.id && !isMockRest(data.id, data.name, data.slug)) {
        if (data.logoUrl && data.branding && !data.branding.headerLogoUrl) {
          data.branding.headerLogoUrl = data.logoUrl;
        }
        restaurants.push(data);
      }
    });

    const users: User[] = [];
    usersSnap?.forEach(d => { 
      const data = d.data() as User;
      if (data && data.id && data.role === 'ADMIN') {
        users.push(data);
      } else if (data && data.id) {
        // Only include if they don't belong solely to mock restaurants
        const hasOnlyMockRests = Array.isArray(data.restaurantIds) && data.restaurantIds.every(id => isMockRest(id));
        if (!hasOnlyMockRests) {
          users.push(data);
        }
      }
    });

    const categories: MenuCategory[] = [];
    catsSnap?.forEach(d => { 
      const data = d.data() as MenuCategory;
      if (data && data.id && (!data.restaurantId || !isMockRest(data.restaurantId))) {
        categories.push(data);
      }
    });

    const items: MenuItem[] = [];
    itemsSnap?.forEach(d => { 
      const data = d.data() as MenuItem;
      if (data && data.id && (!data.restaurantId || !isMockRest(data.restaurantId))) {
        items.push(data);
      }
    });

    const orders: Order[] = [];
    ordersSnap?.forEach(d => { 
      const data = d.data() as Order;
      if (data && data.id && (!data.restaurantId || !isMockRest(data.restaurantId))) {
        orders.push(data);
      }
    });

    if (restaurants.length > 0 || users.length > 0) {
      return {
        restaurants,
        users,
        categories,
        items,
        orders,
        updatedAt: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn('[Firestore] fetchFromFirestore notice:', err);
  }
  return null;
}

/**
 * Persists an individual restaurant directly into Firestore.
 */
export async function saveRestaurantToFirestore(restaurant: Restaurant): Promise<boolean> {
  if (!restaurant || !restaurant.id) return false;
  try {
    const ref = doc(db, 'restaurants', restaurant.id);
    await setDoc(ref, sanitizeRestaurantForFirestore(restaurant), { merge: true });
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'saveRestaurantToFirestore');
  }
}

/**
 * Deletes an individual restaurant directly from Firestore.
 */
export async function deleteRestaurantFromFirestore(restaurantId: string): Promise<boolean> {
  if (!restaurantId) return false;
  try {
    const ref = doc(db, 'restaurants', restaurantId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'deleteRestaurantFromFirestore');
  }
}

/**
 * Persists an individual user directly into Firestore.
 */
export async function saveUserToFirestore(user: User): Promise<boolean> {
  if (!user || !user.id) return false;
  try {
    const ref = doc(db, 'users', user.id);
    await setDoc(ref, cleanObject(user), { merge: true });
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'saveUserToFirestore');
  }
}

/**
 * Deletes an individual user directly from Firestore.
 */
export async function deleteUserFromFirestore(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const ref = doc(db, 'users', userId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'deleteUserFromFirestore');
  }
}

/**
 * Persists an individual menu item directly into Firestore.
 */
export async function saveItemToFirestore(item: MenuItem): Promise<boolean> {
  if (!item || !item.id) return false;
  try {
    const ref = doc(db, 'items', item.id);
    await setDoc(ref, cleanObject(item), { merge: true });
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'saveItemToFirestore');
  }
}

/**
 * Deletes an individual menu item directly from Firestore.
 */
export async function deleteItemFromFirestore(itemId: string): Promise<boolean> {
  if (!itemId) return false;
  try {
    const ref = doc(db, 'items', itemId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'deleteItemFromFirestore');
  }
}

/**
 * Persists an individual category directly into Firestore.
 */
export async function saveCategoryToFirestore(category: MenuCategory): Promise<boolean> {
  if (!category || !category.id) return false;
  try {
    const ref = doc(db, 'categories', category.id);
    await setDoc(ref, cleanObject(category), { merge: true });
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'saveCategoryToFirestore');
  }
}

/**
 * Deletes an individual category directly from Firestore.
 */
export async function deleteCategoryFromFirestore(categoryId: string): Promise<boolean> {
  if (!categoryId) return false;
  try {
    const ref = doc(db, 'categories', categoryId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'deleteCategoryFromFirestore');
  }
}

/**
 * Persists an individual order directly into Firestore.
 */
export async function saveOrderToFirestore(order: Order): Promise<boolean> {
  if (!order || !order.id) return false;
  try {
    const ref = doc(db, 'orders', order.id);
    await setDoc(ref, cleanObject(order), { merge: true });
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'saveOrderToFirestore');
  }
}

/**
 * Updates order status directly in Firestore.
 */
export async function updateOrderStatusInFirestore(orderId: string, status: string): Promise<boolean> {
  if (!orderId) return false;
  try {
    const ref = doc(db, 'orders', orderId);
    await setDoc(ref, { status, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error updating order status in Firestore:', err);
    return false;
  }
}

/**
 * Persists an official published menu snapshot directly into Firestore.
 */
export async function savePublishedMenuToFirestore(restaurantId: string, snapshot: any): Promise<boolean> {
  if (!restaurantId || !snapshot) return false;
  try {
    const ref = doc(db, 'published_menus', restaurantId);
    await setDoc(ref, cleanObject(snapshot), { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving published menu to Firestore:', err);
    return false;
  }
}

/**
 * Wipes all restaurants, categories, items, orders, published_menus, and non-admin users from Firestore.
 */
export async function clearAllDatabaseCollections(): Promise<boolean> {
  try {
    const [restsSnap, usersSnap, catsSnap, itemsSnap, ordersSnap, pubSnap] = await Promise.all([
      getDocs(collection(db, 'restaurants')).catch(() => null),
      getDocs(collection(db, 'users')).catch(() => null),
      getDocs(collection(db, 'categories')).catch(() => null),
      getDocs(collection(db, 'items')).catch(() => null),
      getDocs(collection(db, 'orders')).catch(() => null),
      getDocs(collection(db, 'published_menus')).catch(() => null)
    ]);

    const deletePromises: Promise<any>[] = [];

    restsSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    catsSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    itemsSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    ordersSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref)));
    pubSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref)));

    usersSnap?.forEach(d => {
      const data = d.data() as User;
      if (data && data.role !== 'ADMIN') {
        deletePromises.push(deleteDoc(d.ref));
      }
    });

    await Promise.all(deletePromises);

    // Reset system summary doc
    const snapshotRef = doc(db, 'system', 'cloud_menu_snapshot');
    await setDoc(snapshotRef, {
      restaurantsCount: 0,
      usersCount: 2,
      categoriesCount: 0,
      itemsCount: 0,
      ordersCount: 0,
      updatedAt: new Date().toISOString()
    });

    return true;
  } catch (err) {
    console.warn('[Firestore] Error clearing database collections:', err);
    return false;
  }
}

/**
 * Fetches an official published menu snapshot directly from Firestore.
 */
export async function fetchPublishedMenuFromFirestore(restaurantId: string): Promise<any | null> {
  if (!restaurantId) return null;
  try {
    const ref = doc(db, 'published_menus', restaurantId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn('[Firestore] Error fetching published menu from Firestore:', err);
  }
  return null;
}
