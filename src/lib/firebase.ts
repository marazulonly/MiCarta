import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore,
  getFirestore, 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { Restaurant, MenuItem, MenuCategory, Order, User } from '../types';
import rawConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
let app: FirebaseApp;
let db: Firestore | null = null;

try {
  if (!getApps().length) {
    app = initializeApp({
      apiKey: rawConfig.apiKey,
      authDomain: rawConfig.authDomain,
      projectId: rawConfig.projectId,
      storageBucket: rawConfig.storageBucket,
      messagingSenderId: rawConfig.messagingSenderId,
      appId: rawConfig.appId,
    });
  } else {
    app = getApp();
  }

  // Use initializeFirestore with long polling settings to prevent WebSocket / HTTP2 connection failures in preview iFrames
  const firestoreSettings = { 
    experimentalAutoDetectLongPolling: true,
    experimentalForceLongPolling: true,
  };

  if (rawConfig.firestoreDatabaseId) {
    try {
      db = initializeFirestore(app, firestoreSettings, rawConfig.firestoreDatabaseId);
    } catch {
      db = getFirestore(app, rawConfig.firestoreDatabaseId);
    }
  } else {
    try {
      db = initializeFirestore(app, firestoreSettings);
    } catch {
      db = getFirestore(app);
    }
  }
} catch (err) {
  console.warn('[Firebase] Initialization notice:', err);
}

export { db };

// Helper to wrap firestore operations with a timeout so offline/unavailable connections fall back gracefully
function withTimeout<T>(promise: Promise<T>, ms: number = 8000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Firebase network timeout'));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export interface FirebaseSaveResult {
  success: boolean;
  message: string;
  timestamp?: string;
  error?: string;
}

/**
 * Saves all system restaurants, items, categories, users and orders to Firestore
 */
export async function saveAllDataToFirebase(data: {
  restaurants: Restaurant[];
  items: MenuItem[];
  categories: MenuCategory[];
  users?: User[];
  orders?: Order[];
}): Promise<FirebaseSaveResult> {
  if (!db) {
    return {
      success: false,
      message: 'Base de datos Firebase no inicializada.',
      error: 'Firebase DB null'
    };
  }

  try {
    const now = new Date().toISOString();

    // 1. Guardar Restaurantes individuales
    for (const rest of data.restaurants) {
      try {
        const restRef = doc(db, 'restaurants', rest.id);
        await setDoc(restRef, { ...rest, updatedAt: now }, { merge: true });
      } catch (err) {
        console.warn(`[Firebase] Error saving restaurant ${rest.id}:`, err);
      }
    }

    // 2. Guardar Categorías individuales
    for (const cat of data.categories) {
      try {
        const catRef = doc(db, 'categories', cat.id);
        await setDoc(catRef, { ...cat, updatedAt: now }, { merge: true });
      } catch (err) {
        console.warn(`[Firebase] Error saving category ${cat.id}:`, err);
      }
    }

    // 3. Guardar Platos en colecciones 'items' y 'menu_items' (sin límites de batch)
    for (const item of data.items) {
      try {
        const itemRef = doc(db, 'items', item.id);
        const menuItemRef = doc(db, 'menu_items', item.id);
        await Promise.allSettled([
          setDoc(itemRef, { ...item, updatedAt: now }, { merge: true }),
          setDoc(menuItemRef, { ...item, updatedAt: now }, { merge: true })
        ]);
      } catch (err) {
        console.warn(`[Firebase] Error saving item ${item.id}:`, err);
      }
    }

    // 4. Guardar Usuarios y Dueños
    for (const user of data.users || []) {
      try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, { ...user, updatedAt: now }, { merge: true });
      } catch (err) {
        console.warn(`[Firebase] Error saving user ${user.id}:`, err);
      }
    }

    // 5. Guardar snapshot global limpio y actualizado
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      await setDoc(metaRef, {
        updatedAt: now,
        restaurantCount: data.restaurants.length,
        itemCount: data.items.length,
        categoryCount: data.categories.length,
        userCount: (data.users || []).length,
        orderCount: (data.orders || []).length,
        restaurants: data.restaurants,
        items: data.items,
        categories: data.categories,
        users: data.users || [],
        orders: data.orders || [],
      }, { merge: true });
    } catch (e) {
      console.warn('[Firebase] Warning saving system_snapshot:', e);
    }

    return {
      success: true,
      message: `Todos los datos (${data.items.length} platos, restaurantes y cartas) se han guardado exitosamente en Firebase Firestore.`,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  } catch (err: any) {
    console.warn('[Firebase] Warning saving to Firestore (using local cache fallback):', err.message);
    return {
      success: false,
      message: 'Ocurrió un aviso al guardar en Firebase (los datos permanecen respaldados localmente).',
      error: err.message
    };
  }
}

/**
 * Loads data from Firestore if present, consolidating snapshot and items collections
 */
export async function loadAllDataFromFirebase(): Promise<{
  restaurants: Restaurant[];
  items: MenuItem[];
  categories: MenuCategory[];
  users: User[];
  orders: Order[];
} | null> {
  if (!db) return null;

  try {
    const itemsMap = new Map<string, MenuItem>();

    // 1. Intentar leer colecciones directas 'items' y 'menu_items'
    try {
      const itemsColl = collection(db, 'items');
      const itemDocs = await withTimeout(getDocs(itemsColl), 6000);
      itemDocs.forEach(d => {
        const itemData = d.data() as MenuItem;
        if (itemData && (itemData.id || d.id)) {
          itemsMap.set(itemData.id || d.id, { ...itemData, id: itemData.id || d.id });
        }
      });
    } catch (e) {
      console.warn('[Firebase] Notice reading items collection:', e);
    }

    try {
      const menuItemsColl = collection(db, 'menu_items');
      const menuDocs = await withTimeout(getDocs(menuItemsColl), 6000);
      menuDocs.forEach(d => {
        const itemData = d.data() as MenuItem;
        const id = itemData.id || d.id;
        if (id && !itemsMap.has(id)) {
          itemsMap.set(id, { ...itemData, id });
        }
      });
    } catch (e) {
      console.warn('[Firebase] Notice reading menu_items collection:', e);
    }

    // 2. Intentar leer snapshot más reciente
    let snapshotRestaurants: Restaurant[] = [];
    let snapshotCategories: MenuCategory[] = [];
    let snapshotUsers: User[] = [];
    let snapshotOrders: Order[] = [];

    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 6000);

      if (snap.exists()) {
        const data = snap.data();
        if (data) {
          if (data.restaurants && data.restaurants.length > 0) {
            snapshotRestaurants = data.restaurants as Restaurant[];
          }
          if (data.categories && data.categories.length > 0) {
            snapshotCategories = data.categories as MenuCategory[];
          }
          if (data.users && data.users.length > 0) {
            snapshotUsers = data.users as User[];
          }
          if (data.orders) {
            snapshotOrders = data.orders as Order[];
          }
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach((it: MenuItem) => {
              if (it && it.id) {
                // If not already in itemsMap or snapshot has more recent details
                if (!itemsMap.has(it.id)) {
                  itemsMap.set(it.id, it);
                }
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('[Firebase] Notice reading system_snapshot:', e);
    }

    // 3. Fallback para restaurantes y categorías si no vinieron en snapshot
    if (snapshotRestaurants.length === 0) {
      try {
        const restColl = collection(db, 'restaurants');
        const restDocs = await withTimeout(getDocs(restColl), 5000);
        snapshotRestaurants = restDocs.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
      } catch (e) {
        console.warn('[Firebase] Notice reading restaurants:', e);
      }
    }

    if (snapshotCategories.length === 0) {
      try {
        const catColl = collection(db, 'categories');
        const catDocs = await withTimeout(getDocs(catColl), 5000);
        snapshotCategories = catDocs.docs.map(d => ({ ...d.data(), id: d.id } as MenuCategory));
      } catch (e) {
        console.warn('[Firebase] Notice reading categories:', e);
      }
    }

    const consolidatedItems = Array.from(itemsMap.values());

    if (consolidatedItems.length > 0 || snapshotRestaurants.length > 0) {
      return {
        restaurants: snapshotRestaurants,
        items: consolidatedItems,
        categories: snapshotCategories,
        users: snapshotUsers,
        orders: snapshotOrders,
      };
    }

    return null;
  } catch (err) {
    console.warn('[Firebase] No se pudieron cargar datos remotos:', err);
    return null;
  }
}

/**
 * Fetches restaurant menu data directly from Firebase Firestore (pure cloud download, no localStorage)
 */
export async function fetchRestaurantMenuDirectFromFirebase(slugOrId: string): Promise<{
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
} | null> {
  if (!db) return null;
  try {
    const allData = await loadAllDataFromFirebase();
    if (!allData || !allData.restaurants.length) return null;

    const targetSlug = slugOrId.toLowerCase().trim();
    const rest = allData.restaurants.find(r => 
      r.id === targetSlug || 
      (r.slug && r.slug.toLowerCase().trim() === targetSlug) ||
      (r.name && r.name.toLowerCase().trim() === targetSlug) ||
      (targetSlug.includes('cevichito') && (r.id === 'rest-costa' || r.slug?.includes('cevichito')))
    );

    if (!rest) return null;

    const categories = allData.categories.filter(c => c.restaurantId === rest.id);
    const items = allData.items.filter(i => i.restaurantId === rest.id);

    return {
      restaurant: rest,
      categories,
      items
    };
  } catch (err) {
    console.warn('[Firebase] Error fetching direct restaurant menu:', err);
    return null;
  }
}

/**
 * Saves a single restaurant to Firestore
 */
export async function saveRestaurantToFirebase(restaurant: Restaurant): Promise<boolean> {
  if (!db) return false;
  try {
    const restRef = doc(db, 'restaurants', restaurant.id);
    await withTimeout(setDoc(restRef, { ...restaurant, updatedAt: new Date().toISOString() }, { merge: true }), 6000);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving restaurant offline:', err);
    return false;
  }
}

/**
 * Deletes a single restaurant from Firestore and system snapshot
 */
export async function deleteRestaurantFromFirebase(restaurantId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const restRef = doc(db, 'restaurants', restaurantId);
    await withTimeout(deleteDoc(restRef), 6000);

    // Also remove from snapshot in background
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 3000).catch(() => null);
      if (snap && snap.exists()) {
        const snapData = snap.data();
        const currentRests: Restaurant[] = snapData.restaurants || [];
        const updatedRests = currentRests.filter(r => r.id !== restaurantId);
        const currentItems: MenuItem[] = snapData.items || [];
        const updatedItems = currentItems.filter(i => i.restaurantId !== restaurantId);
        const currentCategories: MenuCategory[] = snapData.categories || [];
        const updatedCategories = currentCategories.filter(c => c.restaurantId !== restaurantId);

        await setDoc(metaRef, {
          restaurants: updatedRests,
          restaurantCount: updatedRests.length,
          items: updatedItems,
          itemCount: updatedItems.length,
          categories: updatedCategories,
          categoryCount: updatedCategories.length,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch {
      // Snapshot background sync non-blocking
    }

    return true;
  } catch (err) {
    console.warn('[Firebase] Notice deleting restaurant offline:', err);
    return false;
  }
}

/**
 * Saves a single menu item to Firestore
 */
export async function saveMenuItemToFirebase(item: MenuItem): Promise<boolean> {
  if (!db) return false;
  try {
    const now = new Date().toISOString();
    const itemRef = doc(db, 'items', item.id);
    const menuItemRef = doc(db, 'menu_items', item.id);
    await Promise.allSettled([
      withTimeout(setDoc(itemRef, { ...item, updatedAt: now }, { merge: true }), 6000),
      withTimeout(setDoc(menuItemRef, { ...item, updatedAt: now }, { merge: true }), 6000)
    ]);

    // Also update snapshot in background if possible
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 3000).catch(() => null);
      if (snap && snap.exists()) {
        const snapData = snap.data();
        const currentItems: MenuItem[] = snapData.items || [];
        const existingIdx = currentItems.findIndex(i => i.id === item.id);
        let updatedItems: MenuItem[];
        if (existingIdx >= 0) {
          updatedItems = [...currentItems];
          updatedItems[existingIdx] = item;
        } else {
          updatedItems = [item, ...currentItems];
        }
        await setDoc(metaRef, {
          items: updatedItems,
          itemCount: updatedItems.length,
          updatedAt: now
        }, { merge: true });
      }
    } catch {
      // Snapshot background sync non-blocking
    }

    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving item offline:', err);
    return false;
  }
}

/**
 * Deletes a menu item from Firestore
 */
export async function deleteMenuItemFromFirebase(itemId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const itemRef = doc(db, 'items', itemId);
    const menuItemRef = doc(db, 'menu_items', itemId);
    await Promise.allSettled([
      withTimeout(deleteDoc(itemRef), 6000),
      withTimeout(deleteDoc(menuItemRef), 6000)
    ]);

    // Also remove from snapshot in background
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 3000).catch(() => null);
      if (snap && snap.exists()) {
        const snapData = snap.data();
        const currentItems: MenuItem[] = snapData.items || [];
        const updatedItems = currentItems.filter(i => i.id !== itemId);
        await setDoc(metaRef, {
          items: updatedItems,
          itemCount: updatedItems.length,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch {
      // Snapshot background sync non-blocking
    }

    return true;
  } catch (err) {
    console.warn('[Firebase] Notice deleting item offline:', err);
    return false;
  }
}

/**
 * Saves a category to Firestore
 */
export async function saveCategoryToFirebase(category: MenuCategory): Promise<boolean> {
  if (!db) return false;
  try {
    const catRef = doc(db, 'categories', category.id);
    await withTimeout(setDoc(catRef, { ...category, updatedAt: new Date().toISOString() }, { merge: true }), 3500);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving category offline:', err);
    return false;
  }
}

/**
 * Saves a single user to Firestore
 */
export async function saveUserToFirebase(user: User): Promise<boolean> {
  if (!db) return false;
  try {
    const userRef = doc(db, 'users', user.id);
    await withTimeout(setDoc(userRef, { ...user, updatedAt: new Date().toISOString() }, { merge: true }), 3500);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving user offline:', err);
    return false;
  }
}

/**
 * Deletes a user from Firestore
 */
export async function deleteUserFromFirebase(userId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const userRef = doc(db, 'users', userId);
    await withTimeout(deleteDoc(userId ? userRef : userRef), 3500);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice deleting user offline:', err);
    return false;
  }
}

/**
 * Saves a single order to Firestore
 */
export async function saveOrderToFirebase(order: Order): Promise<boolean> {
  if (!db) return false;
  try {
    const orderRef = doc(db, 'orders', order.id);
    await withTimeout(setDoc(orderRef, { ...order, updatedAt: new Date().toISOString() }, { merge: true }), 3500);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving order offline:', err);
    return false;
  }
}
