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
function withTimeout<T>(promise: Promise<T>, ms: number = 4000): Promise<T> {
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
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    // 1. Guardar Restaurantes
    for (const rest of data.restaurants) {
      const restRef = doc(db, 'restaurants', rest.id);
      batch.set(restRef, { ...rest, updatedAt: now }, { merge: true });
    }

    // 2. Guardar Categorías
    for (const cat of data.categories) {
      const catRef = doc(db, 'categories', cat.id);
      batch.set(catRef, { ...cat, updatedAt: now }, { merge: true });
    }

    // 3. Guardar Platos
    for (const item of data.items) {
      const itemRef = doc(db, 'items', item.id);
      batch.set(itemRef, { ...item, updatedAt: now }, { merge: true });
    }

    // 4. Guardar Usuarios y Dueños
    for (const user of data.users || []) {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, { ...user, updatedAt: now }, { merge: true });
    }

    // 5. Guardar snapshot global
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
    });

    await withTimeout(batch.commit(), 5000);

    return {
      success: true,
      message: 'Todos los datos (restaurantes, dueños, usuarios y cartas) se han guardado exitosamente en Firebase Firestore.',
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
 * Loads data from Firestore if present
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
    // Primero intenta leer el snapshot más reciente con tiempo límite
    const metaRef = doc(db, 'system_snapshot', 'latest');
    const snap = await withTimeout(getDoc(metaRef), 3500);

    if (snap.exists()) {
      const data = snap.data();
      if (data && data.restaurants && data.restaurants.length > 0) {
        return {
          restaurants: data.restaurants as Restaurant[],
          items: (data.items || []) as MenuItem[],
          categories: (data.categories || []) as MenuCategory[],
          users: (data.users || []) as User[],
          orders: (data.orders || []) as Order[],
        };
      }
    }

    // Fallback: leer colecciones individuales
    const restColl = collection(db, 'restaurants');
    const restDocs = await withTimeout(getDocs(restColl), 3500);
    if (!restDocs.empty) {
      const restaurants = restDocs.docs.map(d => d.data() as Restaurant);

      const itemsColl = collection(db, 'items');
      const itemDocs = await withTimeout(getDocs(itemsColl), 3500);
      const items = itemDocs.docs.map(d => d.data() as MenuItem);

      const catColl = collection(db, 'categories');
      const catDocs = await withTimeout(getDocs(catColl), 3500);
      const categories = catDocs.docs.map(d => d.data() as MenuCategory);

      const usersColl = collection(db, 'users');
      const userDocs = await withTimeout(getDocs(usersColl), 3500);
      const users = userDocs.docs.map(d => d.data() as User);

      return {
        restaurants,
        items,
        categories,
        users,
        orders: [],
      };
    }

    return null;
  } catch (err) {
    console.warn('[Firebase] No se pudieron cargar datos remotos (usando caché local):', err);
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
    await withTimeout(setDoc(restRef, { ...restaurant, updatedAt: new Date().toISOString() }, { merge: true }), 3500);
    return true;
  } catch (err) {
    console.warn('[Firebase] Notice saving restaurant offline:', err);
    return false;
  }
}

/**
 * Saves a single menu item to Firestore
 */
export async function saveMenuItemToFirebase(item: MenuItem): Promise<boolean> {
  if (!db) return false;
  try {
    const itemRef = doc(db, 'items', item.id);
    await withTimeout(setDoc(itemRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true }), 3500);
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
    await withTimeout(deleteDoc(itemRef), 3500);
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
