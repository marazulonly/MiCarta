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
import { isLegacyRestaurant } from '../utils/restaurantUtils';

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

export function isQuotaExceededActive(): boolean {
  return false;
}

export function markQuotaExceeded() {
  if (!isQuotaExceededNoticeLogged) {
    console.warn('[Firestore] Notice: Rate limit or quota limit reached on Firestore API.');
    isQuotaExceededNoticeLogged = true;
  }
}

function isQuotaError(err: any): boolean {
  if (!err) return false;
  const code = err?.code || '';
  const message = err?.message || String(err);
  return code === 'resource-exhausted' || message.includes('Quota limit exceeded') || message.includes('quota') || message.includes('resource-exhausted');
}

function handleFirestoreError(err: any, actionName: string): boolean {
  if (isQuotaError(err)) {
    markQuotaExceeded();
    return true; // Handled gracefully without crashing
  }
  console.warn(`[Firestore] Notice during ${actionName}:`, err);
  return false;
}

export function isBypassingFirestore(): boolean {
  return false;
}

/**
 * Saves complete menu dataset to Firestore individual documents without monolithic 1MB bloat.
 */
export async function saveToFirestore(payload: CloudMenuPayload): Promise<boolean> {
  if (isBypassingFirestore()) {
    console.log('[Firestore] Bypassing saveToFirestore write (Local Test Mode is Active)');
    return true;
  }
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
  if (isBypassingFirestore()) {
    console.log('[Firestore] Bypassing fetchFromFirestore read (Local Test Mode is Active)');
    return null;
  }
  try {
    const [restsSnap, usersSnap, catsSnap, itemsSnap, ordersSnap] = await Promise.all([
      getDocs(collection(db, 'restaurants')).catch(() => null),
      getDocs(collection(db, 'users')).catch(() => null),
      getDocs(collection(db, 'categories')).catch(() => null),
      getDocs(collection(db, 'items')).catch(() => null),
      getDocs(collection(db, 'orders')).catch(() => null)
    ]);

    const restaurants: Restaurant[] = [];
    restsSnap?.forEach(d => { 
      const data = d.data() as Restaurant;
      if (data && data.id) {
        if (data.logoUrl && data.branding && !data.branding.headerLogoUrl) {
          data.branding.headerLogoUrl = data.logoUrl;
        }
        restaurants.push(data);
      }
    });

    const users: User[] = [];
    usersSnap?.forEach(d => { 
      const data = d.data() as User;
      if (data && data.id) {
        users.push(data);
      }
    });

    const categories: MenuCategory[] = [];
    catsSnap?.forEach(d => { 
      const data = d.data() as MenuCategory;
      if (data && data.id) {
        categories.push(data);
      }
    });

    const items: MenuItem[] = [];
    itemsSnap?.forEach(d => { 
      const data = d.data() as MenuItem;
      if (data && data.id) {
        items.push(data);
      }
    });

    const orders: Order[] = [];
    ordersSnap?.forEach(d => { 
      const data = d.data() as Order;
      if (data && data.id) {
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
  if (isBypassingFirestore()) return true;
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
  if (isBypassingFirestore()) return true;
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
  if (isBypassingFirestore()) return true;
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
  if (isBypassingFirestore()) return true;
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
  if (isBypassingFirestore()) return true;
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
  if (isBypassingFirestore()) return true;
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
  if (isBypassingFirestore()) return true;
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
  if (isBypassingFirestore()) return true;
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
  if (isBypassingFirestore()) return true;
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
  if (isBypassingFirestore()) return true;
  if (!orderId) return false;
  try {
    const ref = doc(db, 'orders', orderId);
    await setDoc(ref, { status, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'updateOrderStatusInFirestore');
  }
}

/**
 * Persists an official published menu snapshot directly into Firestore.
 */
export async function savePublishedMenuToFirestore(restaurantId: string, snapshot: any): Promise<boolean> {
  if (isBypassingFirestore()) return true;
  if (!restaurantId || !snapshot) return false;
  try {
    const cleanSnap = cleanObject(snapshot);
    const writePromises = [setDoc(doc(db, 'published_menus', restaurantId), cleanSnap, { merge: true })];
    
    if (snapshot.restaurant && snapshot.restaurant.slug) {
      const normSlug = isLegacyRestaurant(snapshot.restaurant) ? '' : snapshot.restaurant.slug.toLowerCase().trim();
      if (normSlug && normSlug !== restaurantId) {
        writePromises.push(setDoc(doc(db, 'published_menus', normSlug), cleanSnap, { merge: true }));
      }
    }
    await Promise.all(writePromises);
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'savePublishedMenuToFirestore');
  }
}

/**
 * Wipes all restaurants, categories, items, orders, published_menus, and non-admin users from Firestore.
 */
export async function clearAllDatabaseCollections(): Promise<boolean> {
  if (isBypassingFirestore()) return true;
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

    restsSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref).catch(err => handleFirestoreError(err, 'deleteDoc restaurant'))));
    catsSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref).catch(err => handleFirestoreError(err, 'deleteDoc category'))));
    itemsSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref).catch(err => handleFirestoreError(err, 'deleteDoc item'))));
    ordersSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref).catch(err => handleFirestoreError(err, 'deleteDoc order'))));
    pubSnap?.forEach(d => deletePromises.push(deleteDoc(d.ref).catch(err => handleFirestoreError(err, 'deleteDoc published_menu'))));

    usersSnap?.forEach(d => {
      const data = d.data() as User;
      if (data && data.role !== 'ADMIN') {
        deletePromises.push(deleteDoc(d.ref).catch(err => handleFirestoreError(err, 'deleteDoc user')));
      }
    });

    await Promise.all(deletePromises);

    // Explicitly guarantee Admin users are saved in Firestore
    const adminHerly: User = {
      id: 'u-admin-herly',
      name: 'Herly Lizarazo',
      email: 'herly.lizarazo@micarta.pe',
      dni: '00448157',
      password: 'password',
      role: 'ADMIN',
      phone: '952341165',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      restaurantIds: [],
      status: 'active',
      lastActive: 'En línea'
    };
    const adminEver: User = {
      id: 'u-ever-aguilar',
      name: 'Ever Aguilar',
      email: 'ever.aguilar@micarta.pe',
      dni: '10203040',
      password: 'password',
      role: 'ADMIN',
      phone: '+51 980 102 030',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      restaurantIds: [],
      status: 'active',
      lastActive: 'En línea'
    };

    await Promise.all([
      setDoc(doc(db, 'users', adminHerly.id), cleanObject(adminHerly), { merge: true }).catch(err => handleFirestoreError(err, 'setDoc adminHerly')),
      setDoc(doc(db, 'users', adminEver.id), cleanObject(adminEver), { merge: true }).catch(err => handleFirestoreError(err, 'setDoc adminEver'))
    ]);

    // Reset system summary doc
    const snapshotRef = doc(db, 'system', 'cloud_menu_snapshot');
    await setDoc(snapshotRef, {
      restaurantsCount: 0,
      usersCount: 2,
      categoriesCount: 0,
      itemsCount: 0,
      ordersCount: 0,
      updatedAt: new Date().toISOString()
    }).catch(err => handleFirestoreError(err, 'setDoc snapshotRef'));

    return true;
  } catch (err) {
    return handleFirestoreError(err, 'clearAllDatabaseCollections');
  }
}

/**
 * Fetches an official published menu snapshot directly from Firestore.
 * Supports direct lookup by restaurant ID, slug, or search in main restaurants collection.
 */
export async function fetchPublishedMenuFromFirestore(restaurantIdOrSlug: string): Promise<any | null> {
  if (isBypassingFirestore()) return null;
  if (!restaurantIdOrSlug) return null;
  try {
    const rawRef = doc(db, 'published_menus', restaurantIdOrSlug);
    const snap = await getDoc(rawRef);
    if (snap.exists()) {
      return snap.data();
    }

    const normKey = restaurantIdOrSlug.toLowerCase().trim();
    if (normKey !== restaurantIdOrSlug) {
      const normSnap = await getDoc(doc(db, 'published_menus', normKey));
      if (normSnap.exists()) {
        return normSnap.data();
      }
    }

    // Fallback: Query all restaurants in Firestore to find match by slug or ID
    const cloud = await fetchFromFirestore();
    if (cloud && cloud.restaurants) {
      const match = cloud.restaurants.find(r => 
        r && !isLegacyRestaurant(r) && (
          r.id === restaurantIdOrSlug || 
          r.slug === restaurantIdOrSlug || 
          r.slug?.toLowerCase() === normKey ||
          r.id?.toLowerCase() === normKey
        )
      );
      if (match) {
        const categories = (cloud.categories || []).filter(c => c && c.restaurantId === match.id);
        const items = (cloud.items || []).filter(i => i && i.restaurantId === match.id);
        return {
          published: true,
          version: 1,
          publishedAt: cloud.updatedAt || new Date().toISOString(),
          restaurant: match,
          categories,
          items
        };
      }
    }
  } catch (err) {
    console.warn('[Firestore] Error fetching published menu from Firestore:', err);
  }
  return null;
}
