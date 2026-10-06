import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Restaurant, MenuItem, MenuCategory, User, Order } from '../types';
import { CloudMenuPayload } from './cloudSync';

/**
 * Saves complete menu dataset atomically to Firestore system snapshot and individual collections.
 */
export async function saveToFirestore(payload: CloudMenuPayload): Promise<boolean> {
  try {
    const nowIso = new Date().toISOString();
    const cleanPayload = {
      ...payload,
      updatedAt: nowIso
    };

    // 1. Save system wide master snapshot metadata document (without bloated 14MB payload string)
    try {
      const snapshotRef = doc(db, 'system', 'cloud_menu_snapshot');
      await setDoc(snapshotRef, {
        restaurantsCount: cleanPayload.restaurants?.length || 0,
        usersCount: cleanPayload.users?.length || 0,
        categoriesCount: cleanPayload.categories?.length || 0,
        itemsCount: cleanPayload.items?.length || 0,
        ordersCount: cleanPayload.orders?.length || 0,
        updatedAt: nowIso
      });
    } catch (snapErr) {
      console.warn('[Firestore] Notice updating system snapshot doc:', snapErr);
    }

    // 2. Batch write individual entities to their respective collections for queries and reliability
    const batch = writeBatch(db);

    if (Array.isArray(cleanPayload.restaurants)) {
      cleanPayload.restaurants.forEach(r => {
        if (!r || !r.id) return;
        const ref = doc(db, 'restaurants', r.id);
        batch.set(ref, r, { merge: true });
      });
    }

    if (Array.isArray(cleanPayload.users)) {
      cleanPayload.users.forEach(u => {
        if (!u || !u.id) return;
        const ref = doc(db, 'users', u.id);
        batch.set(ref, u, { merge: true });
      });
    }

    if (Array.isArray(cleanPayload.categories)) {
      cleanPayload.categories.forEach(c => {
        if (!c || !c.id) return;
        const ref = doc(db, 'categories', c.id);
        batch.set(ref, c, { merge: true });
      });
    }

    if (Array.isArray(cleanPayload.items)) {
      cleanPayload.items.forEach(i => {
        if (!i || !i.id) return;
        const ref = doc(db, 'items', i.id);
        batch.set(ref, i, { merge: true });
      });
    }

    await batch.commit().catch(err => {
      console.warn('[Firestore] Batch write individual notice:', err);
    });

    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving full menu snapshot:', err);
    return false;
  }
}

/**
 * Fetches latest menu dataset from Firestore.
 */
export async function fetchFromFirestore(): Promise<CloudMenuPayload | null> {
  try {
    // 1. Try reading master snapshot document
    const snapshotRef = doc(db, 'system', 'cloud_menu_snapshot');
    const snap = await getDoc(snapshotRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data && data.payload) {
        try {
          const parsed = JSON.parse(data.payload);
          if (parsed && (parsed.restaurants?.length || parsed.users?.length || parsed.items?.length)) {
            return parsed as CloudMenuPayload;
          }
        } catch {}
      }
    }

    // 2. Fallback: Query collections directly
    const [restsSnap, usersSnap, catsSnap, itemsSnap, ordersSnap] = await Promise.all([
      getDocs(collection(db, 'restaurants')).catch(() => null),
      getDocs(collection(db, 'users')).catch(() => null),
      getDocs(collection(db, 'categories')).catch(() => null),
      getDocs(collection(db, 'items')).catch(() => null),
      getDocs(collection(db, 'orders')).catch(() => null)
    ]);

    const restaurants: Restaurant[] = [];
    restsSnap?.forEach(d => { if (d.data()) restaurants.push(d.data() as Restaurant); });

    const users: User[] = [];
    usersSnap?.forEach(d => { if (d.data()) users.push(d.data() as User); });

    const categories: MenuCategory[] = [];
    catsSnap?.forEach(d => { if (d.data()) categories.push(d.data() as MenuCategory); });

    const items: MenuItem[] = [];
    itemsSnap?.forEach(d => { if (d.data()) items.push(d.data() as MenuItem); });

    const orders: Order[] = [];
    ordersSnap?.forEach(d => { if (d.data()) orders.push(d.data() as Order); });

    if (restaurants.length > 0 || items.length > 0 || users.length > 0) {
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
 * Subscribes in real time to Firestore changes
 */
export function subscribeToFirestoreChanges(onUpdate: (data: CloudMenuPayload) => void): () => void {
  try {
    const snapshotRef = doc(db, 'system', 'cloud_menu_snapshot');
    return onSnapshot(snapshotRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.payload) {
          try {
            const parsed = JSON.parse(data.payload);
            if (parsed) onUpdate(parsed);
          } catch {}
        }
      }
    }, (err) => {
      console.warn('[Firestore] Real-time snapshot notice:', err);
    });
  } catch {
    return () => {};
  }
}

/**
 * Persists an individual restaurant directly into Firestore.
 */
export async function saveRestaurantToFirestore(restaurant: Restaurant): Promise<boolean> {
  if (!restaurant || !restaurant.id) return false;
  try {
    const ref = doc(db, 'restaurants', restaurant.id);
    await setDoc(ref, restaurant, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving single restaurant:', err);
    return false;
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
    console.warn('[Firestore] Error deleting single restaurant:', err);
    return false;
  }
}

/**
 * Persists an individual user directly into Firestore.
 */
export async function saveUserToFirestore(user: User): Promise<boolean> {
  if (!user || !user.id) return false;
  try {
    const ref = doc(db, 'users', user.id);
    await setDoc(ref, user, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving single user:', err);
    return false;
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
    console.warn('[Firestore] Error deleting single user:', err);
    return false;
  }
}

/**
 * Persists an individual menu item directly into Firestore.
 */
export async function saveItemToFirestore(item: MenuItem): Promise<boolean> {
  if (!item || !item.id) return false;
  try {
    const ref = doc(db, 'items', item.id);
    await setDoc(ref, item, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving single item:', err);
    return false;
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
    console.warn('[Firestore] Error deleting single item:', err);
    return false;
  }
}

/**
 * Persists an individual category directly into Firestore.
 */
export async function saveCategoryToFirestore(category: MenuCategory): Promise<boolean> {
  if (!category || !category.id) return false;
  try {
    const ref = doc(db, 'categories', category.id);
    await setDoc(ref, category, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving single category:', err);
    return false;
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
    console.warn('[Firestore] Error deleting single category:', err);
    return false;
  }
}
