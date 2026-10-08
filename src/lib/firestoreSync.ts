import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Restaurant, MenuItem, MenuCategory, User, Order } from '../types';
import { CloudMenuPayload } from './cloudSync';

export function normalizeSlugKey(str?: string): string {
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
 * Strips duplicate giant base64 payloads to guarantee Firestore 1MB document limit is never exceeded,
 * and ensures the restaurant's primary identifier is its normalized slug.
 */
function sanitizeRestaurantForFirestore(restaurant: Restaurant): Restaurant {
  const clean = cleanObject(restaurant);
  const slugKey = normalizeSlugKey(clean.slug || clean.name || clean.id);
  if (slugKey) {
    clean.slug = slugKey;
  }
  if (clean.branding && clean.branding.headerLogoUrl && clean.logoUrl && clean.branding.headerLogoUrl === clean.logoUrl) {
    clean.branding = {
      ...clean.branding,
      headerLogoUrl: '' // Avoid storing 1MB twice in the same Firestore document
    };
  }
  return clean;
}

let quotaExceededState = false;
let isQuotaExceededNoticeLogged = false;

const quotaListeners = new Set<(active: boolean) => void>();

export function isQuotaExceededActive(): boolean {
  return quotaExceededState;
}

export function subscribeToQuotaChanges(listener: (active: boolean) => void): () => void {
  quotaListeners.add(listener);
  listener(quotaExceededState);
  return () => {
    quotaListeners.delete(listener);
  };
}

export function markQuotaExceeded() {
  if (!quotaExceededState) {
    quotaExceededState = true;
    quotaListeners.forEach(l => {
      try { l(true); } catch {}
    });
  }
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
    return true;
  }
  console.warn(`[Firestore] Notice during ${actionName}:`, err);
  return false;
}

export function isBypassingFirestore(): boolean {
  return false;
}

/**
 * Saves complete menu dataset directly to Firestore individual documents.
 * Uses slug as the primary document key for restaurants and published_menus.
 */
export async function saveToFirestore(payload: CloudMenuPayload): Promise<boolean> {
  if (isBypassingFirestore()) return true;
  try {
    const nowIso = new Date().toISOString();

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

    const writePromises: Promise<any>[] = [];

    if (Array.isArray(payload.restaurants)) {
      payload.restaurants.forEach(r => {
        if (!r || (!r.slug && !r.id && !r.name)) return;
        const primarySlug = normalizeSlugKey(r.slug || r.name || r.id);
        if (!primarySlug) return;
        const sanitized = sanitizeRestaurantForFirestore({ ...r, slug: primarySlug });
        const ref = doc(db, 'restaurants', primarySlug);
        writePromises.push(setDoc(ref, sanitized, { merge: true }).catch((err) => handleFirestoreError(err, `setDoc restaurant ${primarySlug}`)));
        if (r.id && r.id !== primarySlug) {
          writePromises.push(deleteDoc(doc(db, 'restaurants', r.id)).catch(() => {}));
        }
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
 * Fetches latest menu dataset directly from Firestore collections (Single Source of Truth).
 */
export async function fetchFromFirestore(): Promise<CloudMenuPayload | null> {
  if (isBypassingFirestore()) return null;
  try {
    const [restsSnap, usersSnap, catsSnap, itemsSnap, ordersSnap] = await Promise.all([
      getDocs(collection(db, 'restaurants')).catch((err) => { handleFirestoreError(err, 'fetch restaurants'); return null; }),
      getDocs(collection(db, 'users')).catch((err) => { handleFirestoreError(err, 'fetch users'); return null; }),
      getDocs(collection(db, 'categories')).catch((err) => { handleFirestoreError(err, 'fetch categories'); return null; }),
      getDocs(collection(db, 'items')).catch((err) => { handleFirestoreError(err, 'fetch items'); return null; }),
      getDocs(collection(db, 'orders')).catch((err) => { handleFirestoreError(err, 'fetch orders'); return null; })
    ]);

    // If any of the essential collections (restaurants, users, categories, items) failed to fetch, 
    // do NOT return a half-empty payload as it will cause data loss on subsequent syncs.
    if (restsSnap === null || usersSnap === null || catsSnap === null || itemsSnap === null) {
      console.warn('[Firestore] Fetch failed for one or more core collections. Aborting to prevent data loss.');
      return null;
    }

    const restMapBySlug = new Map<string, Restaurant>();
    restsSnap?.forEach(d => { 
      const data = d.data() as Restaurant;
      if (data && (data.slug || data.name || data.id)) {
        const cleanSlug = normalizeSlugKey(data.slug || data.name || data.id);
        if (!cleanSlug) return;
        data.slug = cleanSlug;
        if (!data.id) data.id = cleanSlug;
        if (data.logoUrl && data.branding && !data.branding.headerLogoUrl) {
          data.branding.headerLogoUrl = data.logoUrl;
        }
        // Prefer document whose doc.id matches the slug
        const existing = restMapBySlug.get(cleanSlug);
        if (!existing || d.id === cleanSlug) {
          restMapBySlug.set(cleanSlug, data);
        }
      }
    });
    const restaurants = Array.from(restMapBySlug.values());

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

    return {
      restaurants,
      users,
      categories,
      items,
      orders,
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn('[Firestore] fetchFromFirestore notice:', err);
  }
  return null;
}

/**
 * Persists an individual restaurant directly into Firestore using slug as primary document ID.
 */
export async function saveRestaurantToFirestore(restaurant: Restaurant, previousSlugOrId?: string): Promise<boolean> {
  if (isBypassingFirestore()) return true;
  if (!restaurant || (!restaurant.slug && !restaurant.id && !restaurant.name)) return false;
  try {
    const primarySlug = normalizeSlugKey(restaurant.slug || restaurant.name || restaurant.id);
    if (!primarySlug) return false;
    const sanitized = sanitizeRestaurantForFirestore({ ...restaurant, slug: primarySlug });
    const ref = doc(db, 'restaurants', primarySlug);
    await setDoc(ref, sanitized, { merge: true });

    // Clean up any legacy document keyed by old ID or old slug so there are never duplicates
    const cleanupPromises: Promise<any>[] = [];
    if (restaurant.id && restaurant.id !== primarySlug) {
      cleanupPromises.push(deleteDoc(doc(db, 'restaurants', restaurant.id)).catch(() => {}));
    }
    if (previousSlugOrId) {
      const normPrev = normalizeSlugKey(previousSlugOrId);
      if (normPrev && normPrev !== primarySlug) {
        cleanupPromises.push(deleteDoc(doc(db, 'restaurants', normPrev)).catch(() => {}));
      }
      if (previousSlugOrId !== primarySlug) {
        cleanupPromises.push(deleteDoc(doc(db, 'restaurants', previousSlugOrId)).catch(() => {}));
      }
    }
    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises);
    }
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'saveRestaurantToFirestore');
  }
}

/**
 * Deletes an individual restaurant directly from Firestore by slug and ID.
 */
export async function deleteRestaurantFromFirestore(restaurantIdOrSlug: string, slug?: string): Promise<boolean> {
  if (isBypassingFirestore()) return true;
  if (!restaurantIdOrSlug && !slug) return false;
  try {
    const keysToDelete = new Set<string>();
    if (restaurantIdOrSlug) {
      keysToDelete.add(restaurantIdOrSlug.trim());
      keysToDelete.add(normalizeSlugKey(restaurantIdOrSlug));
    }
    if (slug) {
      keysToDelete.add(slug.trim());
      keysToDelete.add(normalizeSlugKey(slug));
    }
    await Promise.all(
      Array.from(keysToDelete)
        .filter(Boolean)
        .map(k => deleteDoc(doc(db, 'restaurants', k)).catch(() => {}))
    );
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
 * Persists an official published menu snapshot directly into Firestore using the restaurant's slug as primary key.
 */
export async function savePublishedMenuToFirestore(restaurantId: string, snapshot: any): Promise<boolean> {
  if (isBypassingFirestore()) return true;
  if (!restaurantId || !snapshot) return false;
  try {
    const targetId = snapshot.restaurant?.id || restaurantId;
    const primarySlug = normalizeSlugKey(snapshot.restaurant?.slug || snapshot.restaurant?.name || targetId);
    const cleanRest = snapshot.restaurant ? sanitizeRestaurantForFirestore({ ...snapshot.restaurant, slug: primarySlug }) : null;
    
    const validIds = new Set<string>([targetId, restaurantId, primarySlug].filter(Boolean));

    const cleanCats = Array.isArray(snapshot.categories) 
      ? snapshot.categories.filter((c: any) => c && (validIds.has(c.restaurantId) || normalizeSlugKey(c.restaurantId) === primarySlug))
      : [];
    const cleanItems = Array.isArray(snapshot.items)
      ? snapshot.items.filter((i: any) => i && (validIds.has(i.restaurantId) || normalizeSlugKey(i.restaurantId) === primarySlug))
      : [];

    const optimizedSnapshot = cleanObject({
      published: true,
      version: snapshot.version || 1,
      publishedAt: snapshot.publishedAt || new Date().toISOString(),
      publishedBy: snapshot.publishedBy || 'Admin / Owner',
      restaurant: cleanRest,
      categories: cleanCats,
      items: cleanItems
    });

    const keysToPublish = new Set<string>();
    if (primarySlug) keysToPublish.add(primarySlug);
    if (targetId) keysToPublish.add(normalizeSlugKey(targetId));

    const writePromises = Array.from(keysToPublish)
      .filter(Boolean)
      .map(k => setDoc(doc(db, 'published_menus', k), optimizedSnapshot));

    await Promise.all(writePromises);
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'savePublishedMenuToFirestore');
  }
}

/**
 * Deletes an official published menu document directly from Firestore by key (slug or id).
 */
export async function deletePublishedMenuFromFirestore(slugOrId: string): Promise<boolean> {
  if (isBypassingFirestore()) return true;
  if (!slugOrId) return false;
  try {
    const rawKey = slugOrId.trim();
    const normKey = normalizeSlugKey(slugOrId);
    await Promise.all([
      deleteDoc(doc(db, 'published_menus', rawKey)).catch(() => {}),
      normKey ? deleteDoc(doc(db, 'published_menus', normKey)).catch(() => {}) : Promise.resolve()
    ]);
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'deletePublishedMenuFromFirestore');
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
 * Fetches an official published menu snapshot directly from Firestore (Single Source of Truth).
 * Looks up the live restaurant by slug/ID and combines with live categories/items in Firestore,
 * falling back to published_menus so direct links ALWAYS display the exact live menu.
 */
export async function fetchPublishedMenuFromFirestore(restaurantIdOrSlug: string): Promise<any | null> {
  if (isBypassingFirestore()) return null;
  if (!restaurantIdOrSlug) return null;
  const normKey = normalizeSlugKey(restaurantIdOrSlug);

  try {
    // 1. Check live restaurants collection first so branding, template, and dishes are 100% up-to-date
    let matchedRest: Restaurant | null = null;
    const directRestSnap = await getDoc(doc(db, 'restaurants', normKey)).catch(() => null);
    if (directRestSnap && directRestSnap.exists()) {
      matchedRest = directRestSnap.data() as Restaurant;
    } else if (restaurantIdOrSlug !== normKey) {
      const rawRestSnap = await getDoc(doc(db, 'restaurants', restaurantIdOrSlug)).catch(() => null);
      if (rawRestSnap && rawRestSnap.exists()) {
        matchedRest = rawRestSnap.data() as Restaurant;
      }
    }

    if (!matchedRest) {
      const allRestsSnap = await getDocs(collection(db, 'restaurants')).catch(() => null);
      allRestsSnap?.forEach(d => {
        if (matchedRest) return;
        const r = d.data() as Restaurant;
        if (r && (
          normalizeSlugKey(r.slug) === normKey ||
          normalizeSlugKey(r.id) === normKey ||
          normalizeSlugKey(r.name) === normKey
        )) {
          matchedRest = r;
        }
      });
    }

    // Also check published_menus snapshot in parallel
    let pubSnapData: any = null;
    const pubDoc = await getDoc(doc(db, 'published_menus', normKey)).catch(() => null);
    if (pubDoc && pubDoc.exists()) {
      pubSnapData = pubDoc.data();
    } else if (restaurantIdOrSlug !== normKey) {
      const rawPubDoc = await getDoc(doc(db, 'published_menus', restaurantIdOrSlug)).catch(() => null);
      if (rawPubDoc && rawPubDoc.exists()) {
        pubSnapData = rawPubDoc.data();
      }
    }

    const activeRest: Restaurant | null = matchedRest || pubSnapData?.restaurant || null;
    if (activeRest) {
      if (activeRest.logoUrl && activeRest.branding && !activeRest.branding.headerLogoUrl) {
        activeRest.branding.headerLogoUrl = activeRest.logoUrl;
      }
      const primarySlug = normalizeSlugKey(activeRest.slug || activeRest.name || activeRest.id);
      activeRest.slug = primarySlug;

      // Query live categories and items from Firestore matching either id or slug
      const possibleRestIds = Array.from(new Set([activeRest.id, primarySlug, normKey].filter(Boolean)));
      const [allCatsSnap, allItemsSnap] = await Promise.all([
        getDocs(collection(db, 'categories')).catch(() => null),
        getDocs(collection(db, 'items')).catch(() => null)
      ]);

      const liveCategories: MenuCategory[] = [];
      allCatsSnap?.forEach(d => {
        const c = d.data() as MenuCategory;
        if (c && (possibleRestIds.includes(c.restaurantId) || normalizeSlugKey(c.restaurantId) === primarySlug)) {
          liveCategories.push(c);
        }
      });

      const liveItems: MenuItem[] = [];
      allItemsSnap?.forEach(d => {
        const i = d.data() as MenuItem;
        if (i && (possibleRestIds.includes(i.restaurantId) || normalizeSlugKey(i.restaurantId) === primarySlug)) {
          liveItems.push(i);
        }
      });

      const finalCategories = liveCategories.length > 0 ? liveCategories : (pubSnapData?.categories || []);
      const finalItems = liveItems.length > 0 ? liveItems : (pubSnapData?.items || []);

      const generatedSnap = {
        published: true,
        version: (pubSnapData?.version || 1),
        publishedAt: pubSnapData?.publishedAt || new Date().toISOString(),
        restaurant: activeRest,
        categories: finalCategories,
        items: finalItems
      };

      // Keep published_menus synced with latest live state in Firestore
      savePublishedMenuToFirestore(primarySlug, generatedSnap).catch(() => {});
      return generatedSnap;
    }

    if (pubSnapData) {
      return pubSnapData;
    }
  } catch (err) {
    console.warn('[Firestore] Error fetching published menu from Firestore:', err);
  }
  return null;
}

/**
 * Real-time Firestore listener on all collections so changes propagate immediately across tabs/links.
 */
export function subscribeToFirestoreRealtime(
  onUpdate: (payload: Partial<CloudMenuPayload>) => void
): () => void {
  if (isBypassingFirestore()) return () => {};
  const unsubs: (() => void)[] = [];

  try {
    unsubs.push(
      onSnapshot(collection(db, 'restaurants'), (snap) => {
        const restMap = new Map<string, Restaurant>();
        snap.forEach(d => {
          const data = d.data() as Restaurant;
          if (data && (data.slug || data.name || data.id)) {
            const cleanSlug = normalizeSlugKey(data.slug || data.name || data.id);
            if (!cleanSlug) return;
            data.slug = cleanSlug;
            if (!data.id) data.id = cleanSlug;
            if (data.logoUrl && data.branding && !data.branding.headerLogoUrl) {
              data.branding.headerLogoUrl = data.logoUrl;
            }
            const existing = restMap.get(cleanSlug);
            if (!existing || d.id === cleanSlug) {
              restMap.set(cleanSlug, data);
            }
          }
        });
        onUpdate({ restaurants: Array.from(restMap.values()) });
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'categories'), (snap) => {
        const categories: MenuCategory[] = [];
        snap.forEach(d => {
          const data = d.data() as MenuCategory;
          if (data && data.id) categories.push(data);
        });
        onUpdate({ categories });
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'items'), (snap) => {
        const items: MenuItem[] = [];
        snap.forEach(d => {
          const data = d.data() as MenuItem;
          if (data && data.id) items.push(data);
        });
        onUpdate({ items });
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'users'), (snap) => {
        const users: User[] = [];
        snap.forEach(d => {
          const data = d.data() as User;
          if (data && data.id) users.push(data);
        });
        onUpdate({ users });
      }, () => {})
    );

    unsubs.push(
      onSnapshot(collection(db, 'orders'), (snap) => {
        const orders: Order[] = [];
        snap.forEach(d => {
          const data = d.data() as Order;
          if (data && data.id) orders.push(data);
        });
        onUpdate({ orders });
      }, () => {})
    );
  } catch (err) {
    console.warn('[Firestore] Realtime subscription notice:', err);
  }

  return () => {
    unsubs.forEach(u => {
      try { u(); } catch {}
    });
  };
}
