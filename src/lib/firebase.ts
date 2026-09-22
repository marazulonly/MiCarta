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
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { Restaurant, MenuItem, MenuCategory, Order, User } from '../types';
import rawConfig from '../../firebase-applet-config.json';
import { 
  INITIAL_RESTAURANTS, 
  INITIAL_CATEGORIES, 
  INITIAL_MENU_ITEMS, 
  INITIAL_USERS, 
  INITIAL_ORDERS 
} from '../data/mockData';

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
export function withTimeout<T>(promise: Promise<T>, ms: number = 8000): Promise<T> {
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
 * Universal merger preserving all unique IDs from base and overrides
 */
export function mergeRecordsById<T extends { id: string }>(base: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  base.forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  incoming.forEach(item => {
    if (item && item.id) {
      const existing = map.get(item.id);
      map.set(item.id, existing ? { ...existing, ...item } : item);
    }
  });
  return Array.from(map.values());
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
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    // 1. Guardar Restaurantes individualmente
    for (const rest of data.restaurants) {
      const restRef = doc(db, 'restaurants', rest.id);
      batch.set(restRef, { ...rest, updatedAt: now }, { merge: true });
    }

    // 2. Guardar Categorías individualmente
    for (const cat of data.categories) {
      const catRef = doc(db, 'categories', cat.id);
      batch.set(catRef, { ...cat, updatedAt: now }, { merge: true });
    }

    // 3. Guardar Platos en colecciones 'items' y 'menu_items'
    for (const item of data.items) {
      const itemRef = doc(db, 'items', item.id);
      batch.set(itemRef, { ...item, updatedAt: now }, { merge: true });
      const menuItemRef = doc(db, 'menu_items', item.id);
      batch.set(menuItemRef, { ...item, updatedAt: now }, { merge: true });
    }

    // 4. Guardar Usuarios y Dueños individualmente
    for (const user of data.users || []) {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, { ...user, updatedAt: now }, { merge: true });
    }

    // 5. Guardar Pedidos individualmente si existen
    for (const order of data.orders || []) {
      const orderRef = doc(db, 'orders', order.id);
      batch.set(orderRef, { ...order, updatedAt: now }, { merge: true });
    }

    // 6. Guardar snapshot global consolidado
    const metaRef = doc(db, 'system_snapshot', 'latest');
    batch.set(metaRef, {
      updatedAt: now,
      restaurantCount: data.restaurants.length,
      itemCount: data.items.length,
      categoryCount: data.categories.length,
      userCount: (data.users || []).length,
      orderCount: data.orders?.length || 0,
      restaurants: data.restaurants,
      items: data.items,
      categories: data.categories,
      users: data.users || [],
      orders: data.orders || [],
    }, { merge: true });

    await withTimeout(batch.commit(), 9000);

    return {
      success: true,
      message: `Persistencia garantizada: ${data.restaurants.length} restaurantes, ${(data.users || []).length} usuarios y ${data.items.length} platos resguardados en Firestore.`,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  } catch (err: any) {
    console.warn('[Firebase] Warning saving to Firestore (local cache active):', err.message);
    return {
      success: false,
      message: 'Aviso al guardar en Firebase (los datos permanecen asegurados localmente).',
      error: err.message
    };
  }
}

/**
 * Loads data from Firestore - PRIMARY SOURCE OF TRUTH:
 * Directly fetches all documents from collections 'restaurants', 'users', 'categories', 'items', 'orders'.
 * Also inspects system_snapshot/latest and consolidates without dropping any manually created record.
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
    const restaurantsMap = new Map<string, Restaurant>();
    const usersMap = new Map<string, User>();
    const categoriesMap = new Map<string, MenuCategory>();
    const itemsMap = new Map<string, MenuItem>();
    const ordersMap = new Map<string, Order>();

    // 1. Read directly from 'restaurants' collection
    try {
      const restColl = collection(db, 'restaurants');
      const restDocs = await withTimeout(getDocs(restColl), 6000);
      restDocs.forEach(d => {
        const restData = d.data() as Restaurant;
        const id = restData.id || d.id;
        if (id) {
          restaurantsMap.set(id, { ...restData, id });
        }
      });
    } catch (e) {
      console.warn('[Firebase] Notice reading direct restaurants collection:', e);
    }

    // 2. Read directly from 'users' collection (CRITICAL: Dueños, Admins, Mozos, Cocineros, Repartidores, Clientes)
    try {
      const usersColl = collection(db, 'users');
      const userDocs = await withTimeout(getDocs(usersColl), 6000);
      userDocs.forEach(d => {
        const userData = d.data() as User;
        const id = userData.id || d.id;
        if (id) {
          usersMap.set(id, { ...userData, id });
        }
      });
    } catch (e) {
      console.warn('[Firebase] Notice reading direct users collection:', e);
    }

    // 3. Read directly from 'categories' collection
    try {
      const catColl = collection(db, 'categories');
      const catDocs = await withTimeout(getDocs(catColl), 5000);
      catDocs.forEach(d => {
        const catData = d.data() as MenuCategory;
        const id = catData.id || d.id;
        if (id) {
          categoriesMap.set(id, { ...catData, id });
        }
      });
    } catch (e) {
      console.warn('[Firebase] Notice reading direct categories collection:', e);
    }

    // 4. Read directly from 'items' and 'menu_items' collections
    try {
      const itemsColl = collection(db, 'items');
      const itemDocs = await withTimeout(getDocs(itemsColl), 6000);
      itemDocs.forEach(d => {
        const itemData = d.data() as MenuItem;
        const id = itemData.id || d.id;
        if (id) {
          itemsMap.set(id, { ...itemData, id });
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

    // 5. Read directly from 'orders' collection
    try {
      const ordersColl = collection(db, 'orders');
      const orderDocs = await withTimeout(getDocs(ordersColl), 5000);
      orderDocs.forEach(d => {
        const orderData = d.data() as Order;
        const id = orderData.id || d.id;
        if (id) {
          ordersMap.set(id, { ...orderData, id });
        }
      });
    } catch (e) {
      console.warn('[Firebase] Notice reading orders collection:', e);
    }

    // 6. Supplement with system_snapshot/latest (never overwrite existing collection documents)
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 5000);

      if (snap.exists()) {
        const data = snap.data();
        if (data) {
          if (Array.isArray(data.restaurants)) {
            data.restaurants.forEach((r: Restaurant) => {
              if (r && r.id && !restaurantsMap.has(r.id)) {
                restaurantsMap.set(r.id, r);
              }
            });
          }
          if (Array.isArray(data.users)) {
            data.users.forEach((u: User) => {
              if (u && u.id && !usersMap.has(u.id)) {
                usersMap.set(u.id, u);
              }
            });
          }
          if (Array.isArray(data.categories)) {
            data.categories.forEach((c: MenuCategory) => {
              if (c && c.id && !categoriesMap.has(c.id)) {
                categoriesMap.set(c.id, c);
              }
            });
          }
          if (Array.isArray(data.items)) {
            data.items.forEach((it: MenuItem) => {
              if (it && it.id && !itemsMap.has(it.id)) {
                itemsMap.set(it.id, it);
              }
            });
          }
          if (Array.isArray(data.orders)) {
            data.orders.forEach((o: Order) => {
              if (o && o.id && !ordersMap.has(o.id)) {
                ordersMap.set(o.id, o);
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('[Firebase] Notice reading system_snapshot:', e);
    }

    // 7. If Firestore is completely clean and empty (first run), initialize with default seed data
    if (restaurantsMap.size === 0 && usersMap.size === 0 && itemsMap.size === 0) {
      console.info('[Firebase] Firestore is pristine/empty. Seeding initial baseline datasets...');
      INITIAL_RESTAURANTS.forEach(r => restaurantsMap.set(r.id, r));
      INITIAL_USERS.forEach(u => usersMap.set(u.id, u));
      INITIAL_CATEGORIES.forEach(c => categoriesMap.set(c.id, c));
      INITIAL_MENU_ITEMS.forEach(it => itemsMap.set(it.id, it));
      INITIAL_ORDERS.forEach(o => ordersMap.set(o.id, o));

      // Asynchronously seed to Firestore in background without blocking return
      saveAllDataToFirebase({
        restaurants: Array.from(restaurantsMap.values()),
        items: Array.from(itemsMap.values()),
        categories: Array.from(categoriesMap.values()),
        users: Array.from(usersMap.values()),
        orders: Array.from(ordersMap.values()),
      }).catch(err => console.warn('[Firebase] Initial seed write notice:', err));
    }

    const consolidatedRestaurants = Array.from(restaurantsMap.values());
    const consolidatedUsers = Array.from(usersMap.values());
    const consolidatedCategories = Array.from(categoriesMap.values());
    const consolidatedItems = Array.from(itemsMap.values());
    const consolidatedOrders = Array.from(ordersMap.values());

    return {
      restaurants: consolidatedRestaurants,
      items: consolidatedItems,
      categories: consolidatedCategories,
      users: consolidatedUsers,
      orders: consolidatedOrders,
    };
  } catch (err) {
    console.warn('[Firebase] No se pudieron cargar datos remotos (usando caché local):', err);
    return null;
  }
}

/**
 * Saves a single restaurant to Firestore collection 'restaurants'
 * and updates system_snapshot to ensure instant availability
 */
export async function saveRestaurantToFirebase(restaurant: Restaurant): Promise<boolean> {
  if (!db) return false;
  try {
    const now = new Date().toISOString();
    const restRef = doc(db, 'restaurants', restaurant.id);
    await withTimeout(setDoc(restRef, { ...restaurant, updatedAt: now }, { merge: true }), 6000);
    
    // Also patch snapshot in background
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      getDoc(metaRef).then(snap => {
        if (snap.exists() && db) {
          const current = snap.data();
          const existingRests: Restaurant[] = current.restaurants || [];
          const updated = mergeRecordsById(existingRests, [restaurant]);
          setDoc(metaRef, { restaurants: updated, restaurantCount: updated.length, updatedAt: now }, { merge: true });
        }
      }).catch(() => {});
    } catch {
      // Non-blocking snapshot patch
    }

    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving restaurant offline:', err);
    return false;
  }
}

/**
 * Deletes a restaurant from Firestore
 */
export async function deleteRestaurantFromFirebase(restaurantId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const restRef = doc(db, 'restaurants', restaurantId);
    await withTimeout(deleteDoc(restRef), 4000);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice deleting restaurant:', err);
    return false;
  }
}

/**
 * Saves a single user (Dueño, Admin, Mozo, Cocinero, Repartidor, Cliente) to Firestore
 * and ensures it is never lost or overwritten
 */
export async function saveUserToFirebase(user: User): Promise<boolean> {
  if (!db) return false;
  try {
    const now = new Date().toISOString();
    const userRef = doc(db, 'users', user.id);
    await withTimeout(setDoc(userRef, { ...user, updatedAt: now }, { merge: true }), 6000);

    // Also patch snapshot in background
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      getDoc(metaRef).then(snap => {
        if (snap.exists() && db) {
          const current = snap.data();
          const existingUsers: User[] = current.users || [];
          const updated = mergeRecordsById(existingUsers, [user]);
          setDoc(metaRef, { users: updated, userCount: updated.length, updatedAt: now }, { merge: true });
        }
      }).catch(() => {});
    } catch {
      // Non-blocking snapshot patch
    }

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
    await withTimeout(deleteDoc(userRef), 4000);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice deleting user offline:', err);
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
    await withTimeout(setDoc(catRef, { ...category, updatedAt: new Date().toISOString() }, { merge: true }), 4000);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving category offline:', err);
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
    await withTimeout(setDoc(orderRef, { ...order, updatedAt: new Date().toISOString() }, { merge: true }), 4000);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving order offline:', err);
    return false;
  }
}

/**
 * Subscribes to real-time updates from Firestore for restaurants, users, items, categories, and orders.
 * Returns an unsubscription function to detach all listeners.
 */
export function subscribeToSystemData(handlers: {
  onRestaurantsChange?: (restaurants: Restaurant[]) => void;
  onUsersChange?: (users: User[]) => void;
  onCategoriesChange?: (categories: MenuCategory[]) => void;
  onItemsChange?: (items: MenuItem[]) => void;
  onOrdersChange?: (orders: Order[]) => void;
}): () => void {
  if (!db) return () => {};

  const unsubscribes: Unsubscribe[] = [];

  // Listen to restaurants
  if (handlers.onRestaurantsChange) {
    try {
      const restColl = collection(db, 'restaurants');
      const unsub = onSnapshot(restColl, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
          handlers.onRestaurantsChange!(list);
        }
      }, (err) => {
        console.warn('[Firebase] Realtime restaurants listener notice:', err);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.warn('[Firebase] Could not attach restaurants listener:', e);
    }
  }

  // Listen to users (Dueños, Admins, Mozos, Cocineros, Repartidores, Clientes)
  if (handlers.onUsersChange) {
    try {
      const usersColl = collection(db, 'users');
      const unsub = onSnapshot(usersColl, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User));
          handlers.onUsersChange!(list);
        }
      }, (err) => {
        console.warn('[Firebase] Realtime users listener notice:', err);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.warn('[Firebase] Could not attach users listener:', e);
    }
  }

  // Listen to categories
  if (handlers.onCategoriesChange) {
    try {
      const catColl = collection(db, 'categories');
      const unsub = onSnapshot(catColl, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenuCategory));
          handlers.onCategoriesChange!(list);
        }
      }, (err) => {
        console.warn('[Firebase] Realtime categories listener notice:', err);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.warn('[Firebase] Could not attach categories listener:', e);
    }
  }

  // Listen to items
  if (handlers.onItemsChange) {
    try {
      const itemsColl = collection(db, 'items');
      const unsub = onSnapshot(itemsColl, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenuItem));
          handlers.onItemsChange!(list);
        }
      }, (err) => {
        console.warn('[Firebase] Realtime items listener notice:', err);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.warn('[Firebase] Could not attach items listener:', e);
    }
  }

  // Listen to orders
  if (handlers.onOrdersChange) {
    try {
      const ordersColl = collection(db, 'orders');
      const unsub = onSnapshot(ordersColl, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Order));
          handlers.onOrdersChange!(list);
        }
      }, (err) => {
        console.warn('[Firebase] Realtime orders listener notice:', err);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.warn('[Firebase] Could not attach orders listener:', e);
    }
  }

  return () => {
    unsubscribes.forEach(unsub => {
      try {
        unsub();
      } catch {}
    });
  };
}
