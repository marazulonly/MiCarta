import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
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
import { Restaurant, MenuItem, MenuCategory, Order } from '../types';
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

  // Use the custom firestoreDatabaseId if provided, or default database
  if (rawConfig.firestoreDatabaseId) {
    try {
      db = getFirestore(app, rawConfig.firestoreDatabaseId);
    } catch {
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }
} catch (err) {
  console.warn('[Firebase] Initialization notice:', err);
}

export { db };

export interface FirebaseSaveResult {
  success: boolean;
  message: string;
  timestamp?: string;
  error?: string;
}

/**
 * Saves all system restaurants, items, categories and orders to Firestore
 */
export async function saveAllDataToFirebase(data: {
  restaurants: Restaurant[];
  items: MenuItem[];
  categories: MenuCategory[];
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

    // 4. Guardar snapshot global
    const metaRef = doc(db, 'system_snapshot', 'latest');
    batch.set(metaRef, {
      updatedAt: now,
      restaurantCount: data.restaurants.length,
      itemCount: data.items.length,
      categoryCount: data.categories.length,
      orderCount: data.orders?.length || 0,
      restaurants: data.restaurants,
      items: data.items,
      categories: data.categories,
      orders: data.orders || [],
    });

    await batch.commit();

    return {
      success: true,
      message: 'Todos los datos de la página se han guardado exitosamente en Firebase Firestore.',
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  } catch (err: any) {
    console.error('[Firebase] Error saving all data:', err);
    return {
      success: false,
      message: 'Ocurrió un error al guardar en Firebase: ' + (err.message || 'Error desconocido'),
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
  orders: Order[];
} | null> {
  if (!db) return null;

  try {
    // Primero intenta leer el snapshot más reciente
    const metaRef = doc(db, 'system_snapshot', 'latest');
    const snap = await getDoc(metaRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data && data.restaurants && data.restaurants.length > 0) {
        return {
          restaurants: data.restaurants as Restaurant[],
          items: (data.items || []) as MenuItem[],
          categories: (data.categories || []) as MenuCategory[],
          orders: (data.orders || []) as Order[],
        };
      }
    }

    // Fallback: leer colecciones individuales
    const restColl = collection(db, 'restaurants');
    const restDocs = await getDocs(restColl);
    if (!restDocs.empty) {
      const restaurants = restDocs.docs.map(d => d.data() as Restaurant);

      const itemsColl = collection(db, 'items');
      const itemDocs = await getDocs(itemsColl);
      const items = itemDocs.docs.map(d => d.data() as MenuItem);

      const catColl = collection(db, 'categories');
      const catDocs = await getDocs(catColl);
      const categories = catDocs.docs.map(d => d.data() as MenuCategory);

      return {
        restaurants,
        items,
        categories,
        orders: [],
      };
    }

    return null;
  } catch (err) {
    console.warn('[Firebase] No se pudieron cargar datos remotos, usando estado local:', err);
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
    await setDoc(restRef, { ...restaurant, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error saving restaurant:', err);
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
    await setDoc(itemRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error saving item:', err);
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
    await deleteDoc(itemRef);
    return true;
  } catch (err) {
    console.error('[Firebase] Error deleting item:', err);
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
    await setDoc(catRef, { ...category, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error saving category:', err);
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
    await setDoc(orderRef, { ...order, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error saving order:', err);
    return false;
  }
}
