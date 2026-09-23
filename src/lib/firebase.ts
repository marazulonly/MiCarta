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
 * Saves all system restaurants, items, categories, users and orders to Firestore, merging safely with existing records
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

    // 3. Guardar Platos en colecciones 'items' y 'menu_items'
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

    // 4. Guardar Usuarios y Dueños si vienen provistos
    if (data.users && data.users.length > 0) {
      for (const user of data.users) {
        try {
          const userRef = doc(db, 'users', user.id);
          await setDoc(userRef, { ...user, updatedAt: now }, { merge: true });
        } catch (err) {
          console.warn(`[Firebase] Error saving user ${user.id}:`, err);
        }
      }
    }

    // 5. Guardar/actualizar snapshot global fusionando de manera segura para NUNCA perder datos de otros restaurantes o usuarios
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 3500).catch(() => null);
      
      let mergedRestaurantsMap = new Map<string, Restaurant>();
      let mergedCategoriesMap = new Map<string, MenuCategory>();
      let mergedItemsMap = new Map<string, MenuItem>();
      let mergedUsersMap = new Map<string, User>();
      let mergedOrdersMap = new Map<string, Order>();

      const updatedRestIds = new Set((data.restaurants || []).map(r => r?.id).filter(Boolean));

      if (snap && snap.exists()) {
        const snapData = snap.data();
        if (Array.isArray(snapData.restaurants)) {
          snapData.restaurants.forEach((r: Restaurant) => r && r.id && mergedRestaurantsMap.set(r.id, r));
        }
        if (Array.isArray(snapData.categories)) {
          snapData.categories.forEach((c: MenuCategory) => {
            if (c && c.id && (!c.restaurantId || !updatedRestIds.has(c.restaurantId))) {
              mergedCategoriesMap.set(c.id, c);
            }
          });
        }
        if (Array.isArray(snapData.items)) {
          snapData.items.forEach((i: MenuItem) => {
            if (i && i.id && (!i.restaurantId || !updatedRestIds.has(i.restaurantId))) {
              mergedItemsMap.set(i.id, i);
            }
          });
        }
        if (Array.isArray(snapData.users)) {
          snapData.users.forEach((u: User) => u && u.id && mergedUsersMap.set(u.id, u));
        }
        if (Array.isArray(snapData.orders)) {
          snapData.orders.forEach((o: Order) => o && o.id && mergedOrdersMap.set(o.id, o));
        }
      }

      // Merge data provided in arguments
      data.restaurants.forEach(r => r && r.id && mergedRestaurantsMap.set(r.id, r));
      data.categories.forEach(c => c && c.id && mergedCategoriesMap.set(c.id, c));
      data.items.forEach(i => i && i.id && mergedItemsMap.set(i.id, i));
      if (data.users && data.users.length > 0) {
        data.users.forEach(u => u && u.id && mergedUsersMap.set(u.id, u));
      }
      if (data.orders && data.orders.length > 0) {
        data.orders.forEach(o => o && o.id && mergedOrdersMap.set(o.id, o));
      }

      const finalRestaurants = Array.from(mergedRestaurantsMap.values());
      const finalCategories = Array.from(mergedCategoriesMap.values());
      const finalItems = Array.from(mergedItemsMap.values());
      const finalUsers = Array.from(mergedUsersMap.values());
      const finalOrders = Array.from(mergedOrdersMap.values());

      await setDoc(metaRef, {
        updatedAt: now,
        restaurantCount: finalRestaurants.length,
        itemCount: finalItems.length,
        categoryCount: finalCategories.length,
        userCount: finalUsers.length,
        orderCount: finalOrders.length,
        restaurants: finalRestaurants,
        items: finalItems,
        categories: finalCategories,
        users: finalUsers,
        orders: finalOrders,
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
    console.warn('[Firebase] Warning saving to Firestore:', err.message);
    return {
      success: false,
      message: 'Ocurrió un aviso al guardar en Firebase.',
      error: err.message
    };
  }
}

/**
 * Saves a specific restaurant's menu, categories, and settings to Firestore without touching other restaurants or users
 */
export async function saveRestaurantMenuToFirebase(data: {
  restaurant: Restaurant;
  items: MenuItem[];
  categories: MenuCategory[];
}): Promise<FirebaseSaveResult> {
  return saveAllDataToFirebase({
    restaurants: [data.restaurant],
    items: data.items,
    categories: data.categories
  });
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
    const restaurantsMap = new Map<string, Restaurant>();
    const categoriesMap = new Map<string, MenuCategory>();
    const itemsMap = new Map<string, MenuItem>();
    const usersMap = new Map<string, User>();
    const ordersMap = new Map<string, Order>();

    // 1. Leer snapshot 'system_snapshot/latest' como base inicial si existe
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 5000);
      if (snap.exists()) {
        const data = snap.data();
        if (data) {
          if (Array.isArray(data.restaurants)) {
            data.restaurants.forEach((r: Restaurant) => {
              if (r && r.id) restaurantsMap.set(r.id, r);
            });
          }
          if (Array.isArray(data.categories)) {
            data.categories.forEach((c: MenuCategory) => {
              if (c && c.id) categoriesMap.set(c.id, c);
            });
          }
          if (Array.isArray(data.items)) {
            data.items.forEach((i: MenuItem) => {
              if (i && i.id) itemsMap.set(i.id, i);
            });
          }
          if (Array.isArray(data.users)) {
            data.users.forEach((u: User) => {
              if (u && u.id) usersMap.set(u.id, u);
            });
          }
          if (Array.isArray(data.orders)) {
            data.orders.forEach((o: Order) => {
              if (o && o.id) ordersMap.set(o.id, o);
            });
          }
        }
      }
    } catch (e) {
      console.warn('[Firebase] Notice reading system_snapshot:', e);
    }

    // 2. Leer SIEMPRE directamente de todas las colecciones independientes de Firestore (Fuente Viva de Verdad)
    await Promise.allSettled([
      // Colección 'restaurants'
      (async () => {
        try {
          const restColl = collection(db, 'restaurants');
          const restDocs = await withTimeout(getDocs(restColl), 5000);
          restDocs.forEach(d => {
            const data = d.data() as Restaurant;
            const id = data.id || d.id;
            if (id) {
              const existing = restaurantsMap.get(id);
              restaurantsMap.set(id, { ...existing, ...data, id });
            }
          });
        } catch (e) {
          console.warn('[Firebase] Notice reading restaurants collection:', e);
        }
      })(),

      // Colección 'categories'
      (async () => {
        try {
          const catColl = collection(db, 'categories');
          const catDocs = await withTimeout(getDocs(catColl), 5000);
          catDocs.forEach(d => {
            const data = d.data() as MenuCategory;
            const id = data.id || d.id;
            if (id) {
              const existing = categoriesMap.get(id);
              categoriesMap.set(id, { ...existing, ...data, id });
            }
          });
        } catch (e) {
          console.warn('[Firebase] Notice reading categories collection:', e);
        }
      })(),

      // Colecciones 'items' y 'menu_items'
      (async () => {
        try {
          const itemsColl = collection(db, 'items');
          const itemDocs = await withTimeout(getDocs(itemsColl), 5000);
          itemDocs.forEach(d => {
            const data = d.data() as MenuItem;
            const id = data.id || d.id;
            if (id) {
              const existing = itemsMap.get(id);
              itemsMap.set(id, { ...existing, ...data, id });
            }
          });
        } catch (e) {
          console.warn('[Firebase] Notice reading items collection:', e);
        }

        try {
          const menuItemsColl = collection(db, 'menu_items');
          const menuDocs = await withTimeout(getDocs(menuItemsColl), 5000);
          menuDocs.forEach(d => {
            const data = d.data() as MenuItem;
            const id = data.id || d.id;
            if (id) {
              const existing = itemsMap.get(id);
              itemsMap.set(id, { ...existing, ...data, id });
            }
          });
        } catch (e) {
          console.warn('[Firebase] Notice reading menu_items collection:', e);
        }
      })(),

      // Colección 'users' (Dueños, Administradores, Meseros, Repartidores)
      (async () => {
        try {
          const userColl = collection(db, 'users');
          const userDocs = await withTimeout(getDocs(userColl), 5000);
          userDocs.forEach(d => {
            const data = d.data() as User;
            const id = data.id || d.id;
            if (id) {
              const existing = usersMap.get(id);
              usersMap.set(id, { ...existing, ...data, id });
            }
          });
        } catch (e) {
          console.warn('[Firebase] Notice reading users collection:', e);
        }
      })(),

      // Colección 'orders'
      (async () => {
        try {
          const orderColl = collection(db, 'orders');
          const orderDocs = await withTimeout(getDocs(orderColl), 5000);
          orderDocs.forEach(d => {
            const data = d.data() as Order;
            const id = data.id || d.id;
            if (id) {
              ordersMap.set(id, { ...data, id });
            }
          });
        } catch (e) {
          console.warn('[Firebase] Notice reading orders collection:', e);
        }
      })()
    ]);

    const consolidatedRestaurants = Array.from(restaurantsMap.values());
    const consolidatedCategories = Array.from(categoriesMap.values());
    const consolidatedItems = Array.from(itemsMap.values());
    const consolidatedUsers = Array.from(usersMap.values());
    const consolidatedOrders = Array.from(ordersMap.values());

    if (
      consolidatedRestaurants.length > 0 || 
      consolidatedItems.length > 0 || 
      consolidatedUsers.length > 0
    ) {
      return {
        restaurants: consolidatedRestaurants,
        items: consolidatedItems,
        categories: consolidatedCategories,
        users: consolidatedUsers,
        orders: consolidatedOrders,
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
 * Saves a single restaurant to Firestore and syncs system snapshot
 */
export async function saveRestaurantToFirebase(restaurant: Restaurant): Promise<boolean> {
  if (!db) return false;
  try {
    const now = new Date().toISOString();
    const restRef = doc(db, 'restaurants', restaurant.id);
    await withTimeout(setDoc(restRef, { ...restaurant, updatedAt: now }, { merge: true }), 6000);

    // Sync in system_snapshot
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 3000).catch(() => null);
      if (snap && snap.exists()) {
        const snapData = snap.data();
        const currentRests: Restaurant[] = snapData.restaurants || [];
        const idx = currentRests.findIndex(r => r.id === restaurant.id);
        let updatedRests: Restaurant[];
        if (idx >= 0) {
          updatedRests = [...currentRests];
          updatedRests[idx] = restaurant;
        } else {
          updatedRests = [...currentRests, restaurant];
        }
        await setDoc(metaRef, {
          restaurants: updatedRests,
          restaurantCount: updatedRests.length,
          updatedAt: now
        }, { merge: true });
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving restaurant offline:', err);
    return false;
  }
}

/**
 * Deletes a single restaurant from Firestore and system snapshot WITHOUT deleting or affecting owners
 */
export async function deleteRestaurantFromFirebase(restaurantId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const restRef = doc(db, 'restaurants', restaurantId);
    await withTimeout(deleteDoc(restRef), 6000);

    // Also update snapshot in background preserving all users and owners intact
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
        
        // Preserve all owners and users, only unlinking this restaurant from their restaurantIds
        const currentUsers: User[] = snapData.users || [];
        const updatedUsers = currentUsers.map(u => ({
          ...u,
          restaurantIds: (u.restaurantIds || []).filter(id => id !== restaurantId)
        }));

        await setDoc(metaRef, {
          restaurants: updatedRests,
          restaurantCount: updatedRests.length,
          items: updatedItems,
          itemCount: updatedItems.length,
          categories: updatedCategories,
          categoryCount: updatedCategories.length,
          users: updatedUsers,
          userCount: updatedUsers.length,
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
 * Saves a category to Firestore and syncs system snapshot
 */
export async function saveCategoryToFirebase(category: MenuCategory): Promise<boolean> {
  if (!db) return false;
  try {
    const now = new Date().toISOString();
    const catRef = doc(db, 'categories', category.id);
    await withTimeout(setDoc(catRef, { ...category, updatedAt: now }, { merge: true }), 3500);

    // Sync in system_snapshot
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 3000).catch(() => null);
      if (snap && snap.exists()) {
        const snapData = snap.data();
        const currentCategories: MenuCategory[] = snapData.categories || [];
        const idx = currentCategories.findIndex(c => c.id === category.id);
        let updatedCategories: MenuCategory[];
        if (idx >= 0) {
          updatedCategories = [...currentCategories];
          updatedCategories[idx] = category;
        } else {
          updatedCategories = [...currentCategories, category];
        }
        await setDoc(metaRef, {
          categories: updatedCategories,
          categoryCount: updatedCategories.length,
          updatedAt: now
        }, { merge: true });
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving category offline:', err);
    return false;
  }
}

/**
 * Deletes a category from Firestore and system snapshot
 */
export async function deleteCategoryFromFirebase(categoryId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const catRef = doc(db, 'categories', categoryId);
    await withTimeout(deleteDoc(catRef), 3500);

    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 3000).catch(() => null);
      if (snap && snap.exists()) {
        const snapData = snap.data();
        const currentCategories: MenuCategory[] = snapData.categories || [];
        const updatedCategories = currentCategories.filter(c => c.id !== categoryId);
        await setDoc(metaRef, {
          categories: updatedCategories,
          categoryCount: updatedCategories.length,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn('[Firebase] Notice deleting category offline:', err);
    return false;
  }
}

/**
 * Saves a single user to Firestore and syncs system snapshot
 */
export async function saveUserToFirebase(user: User): Promise<boolean> {
  if (!db) return false;
  try {
    const now = new Date().toISOString();
    const userRef = doc(db, 'users', user.id);
    await withTimeout(setDoc(userRef, { ...user, updatedAt: now }, { merge: true }), 3500);

    // Sync in system_snapshot
    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 3000).catch(() => null);
      if (snap && snap.exists()) {
        const snapData = snap.data();
        const currentUsers: User[] = snapData.users || [];
        const idx = currentUsers.findIndex(u => u.id === user.id);
        let updatedUsers: User[];
        if (idx >= 0) {
          updatedUsers = [...currentUsers];
          updatedUsers[idx] = user;
        } else {
          updatedUsers = [...currentUsers, user];
        }
        await setDoc(metaRef, {
          users: updatedUsers,
          userCount: updatedUsers.length,
          updatedAt: now
        }, { merge: true });
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving user offline:', err);
    return false;
  }
}

/**
 * Deletes a user from Firestore and system snapshot
 */
export async function deleteUserFromFirebase(userId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const userRef = doc(db, 'users', userId);
    await withTimeout(deleteDoc(userRef), 3500);

    try {
      const metaRef = doc(db, 'system_snapshot', 'latest');
      const snap = await withTimeout(getDoc(metaRef), 3000).catch(() => null);
      if (snap && snap.exists()) {
        const snapData = snap.data();
        const currentUsers: User[] = snapData.users || [];
        const updatedUsers = currentUsers.filter(u => u.id !== userId);
        await setDoc(metaRef, {
          users: updatedUsers,
          userCount: updatedUsers.length,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch {}

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
