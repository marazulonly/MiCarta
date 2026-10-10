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
import { Restaurant, MenuItem, MenuCategory, User, Order, MenuTemplate } from '../types';
import { CloudMenuPayload } from './cloudSync';
import { normalizeBranding } from '../utils/restaurantUtils';
import { ensureOptimizedImageUrl, needsBase64Migration } from './imageOptimizer';

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
 * ensures the restaurant's primary identifier is its normalized slug, and keeps logoUrl and headerLogoUrl synced.
 */
function sanitizeRestaurantForFirestore(restaurant: Restaurant): Restaurant {
  const clean = cleanObject(restaurant);
  const slugKey = normalizeSlugKey(clean.slug || clean.name || clean.id);
  if (slugKey) {
    clean.slug = slugKey;
  }
  const resolvedLogo = clean.branding?.headerLogoUrl || clean.logoUrl || '';
  clean.logoUrl = resolvedLogo;
  clean.branding = normalizeBranding(
    { ...(clean.branding || {}), headerLogoUrl: resolvedLogo },
    clean.templateId
  );
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
    return false;
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
        const targetDocId = r.id || normalizeSlugKey(r.slug || r.name);
        if (!targetDocId) return;
        const primarySlug = normalizeSlugKey(r.slug || r.name || targetDocId);
        const sanitized = sanitizeRestaurantForFirestore({ ...r, id: targetDocId, slug: primarySlug });
        const ref = doc(db, 'restaurants', targetDocId);
        writePromises.push(setDoc(ref, sanitized, { merge: true }).catch((err) => handleFirestoreError(err, `setDoc restaurant ${targetDocId}`)));
        // IMPORTANT: NEVER delete original documents to preserve category/dish relationships!
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

    const restMapById = new Map<string, Restaurant>();
    restsSnap?.forEach(d => { 
      const data = d.data() as Restaurant;
      if (data && (data.slug || data.name || data.id)) {
        const docId = data.id || d.id;
        const cleanSlug = normalizeSlugKey(data.slug || data.name || docId);
        data.id = docId;
        data.slug = cleanSlug || docId;
        const resolvedLogo = data.branding?.headerLogoUrl || data.logoUrl || '';
        data.logoUrl = resolvedLogo;
        data.branding = normalizeBranding(
          { ...(data.branding || {}), headerLogoUrl: resolvedLogo },
          data.templateId
        );
        restMapById.set(docId, data);
      }
    });
    const restaurants = Array.from(restMapById.values());

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
 * Persists an individual restaurant directly into Firestore using its stable canonical ID.
 * NEVER deletes original documents so that categories, items, and owners never lose references.
 */
export async function saveRestaurantToFirestore(restaurant: Restaurant, _previousSlugOrId?: string): Promise<boolean> {
  if (isBypassingFirestore()) return true;
  if (!restaurant || (!restaurant.slug && !restaurant.id && !restaurant.name)) return false;
  try {
    const targetDocId = restaurant.id || normalizeSlugKey(restaurant.slug || restaurant.name);
    if (!targetDocId) return false;
    const primarySlug = normalizeSlugKey(restaurant.slug || restaurant.name || targetDocId);
    const sanitized = sanitizeRestaurantForFirestore({
      ...restaurant,
      id: targetDocId,
      slug: primarySlug || targetDocId
    });
    const ref = doc(db, 'restaurants', targetDocId);
    await setDoc(ref, sanitized, { merge: true });
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
 * Fetches only the users collection (or returns cached users) for authentication before full staff session starts.
 */
export async function fetchUsersFromFirestore(): Promise<User[] | null> {
  if (isBypassingFirestore()) return null;
  try {
    const usersSnap = await getDocs(collection(db, 'users')).catch((err) => {
      handleFirestoreError(err, 'fetch users only');
      return null;
    });
    if (!usersSnap) return null;
    const users: User[] = [];
    usersSnap.forEach(d => {
      const data = d.data() as User;
      if (data && data.id) {
        users.push(data);
      }
    });
    return users;
  } catch (err) {
    console.warn('[Firestore] fetchUsersFromFirestore notice:', err);
    return null;
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
    
    const validIds = new Set<string>([
      targetId, 
      restaurantId, 
      primarySlug, 
      normalizeSlugKey(targetId), 
      normalizeSlugKey(restaurantId)
    ].filter(Boolean));

    const cleanCats = Array.isArray(snapshot.categories) 
      ? snapshot.categories.filter((c: any) => c && (validIds.has(c.restaurantId) || normalizeSlugKey(c.restaurantId) === primarySlug || validIds.has(normalizeSlugKey(c.restaurantId))))
      : [];
    const cleanItems = Array.isArray(snapshot.items)
      ? snapshot.items.filter((i: any) => i && (validIds.has(i.restaurantId) || normalizeSlugKey(i.restaurantId) === primarySlug || validIds.has(normalizeSlugKey(i.restaurantId))))
      : [];

    const finalCats = cleanCats.length > 0
      ? cleanCats
      : (Array.isArray(snapshot.categories) && snapshot.categories.length > 0
          ? snapshot.categories.map((c: any) => ({ ...c, restaurantId: targetId }))
          : []);
    const finalItems = cleanItems.length > 0
      ? cleanItems
      : (Array.isArray(snapshot.items) && snapshot.items.length > 0
          ? snapshot.items.map((i: any) => ({ ...i, restaurantId: targetId }))
          : []);

    const optimizedSnapshot = cleanObject({
      published: true,
      version: snapshot.version || 1,
      publishedAt: snapshot.publishedAt || new Date().toISOString(),
      publishedBy: snapshot.publishedBy || 'Admin / Owner',
      restaurant: cleanRest,
      categories: finalCats,
      items: finalItems
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
 * Fetches an official published menu snapshot directly from Firestore.
 * 1. Checks published_menus/{slug} first (ultra-fast single document read).
 * 2. If already complete (has restaurant, categories and items), returns it immediately with zero extra reads and zero writes.
 * 3. Only if missing or incomplete, performs parallel targeted queries (using where() filters instead of downloading entire collections).
 * 4. Never writes to Firestore on a guest read visit.
 */
export async function fetchPublishedMenuFromFirestore(restaurantIdOrSlug: string): Promise<any | null> {
  if (isBypassingFirestore()) return null;
  if (!restaurantIdOrSlug) return null;
  const normKey = normalizeSlugKey(restaurantIdOrSlug);

  try {
    // 1. Prioritize published_menus/{slug} (Fast path: 1 single document read!)
    const [pubNormSnap, pubRawSnap] = await Promise.all([
      getDoc(doc(db, 'published_menus', normKey)).catch(() => null),
      restaurantIdOrSlug !== normKey
        ? getDoc(doc(db, 'published_menus', restaurantIdOrSlug)).catch(() => null)
        : Promise.resolve(null)
    ]);

    const pubData = (pubNormSnap && pubNormSnap.exists())
      ? pubNormSnap.data()
      : ((pubRawSnap && pubRawSnap.exists()) ? pubRawSnap.data() : null);

    // If published_menus exists and has valid restaurant + items or categories, return immediately!
    if (pubData && pubData.restaurant && (
      (Array.isArray(pubData.items) && pubData.items.length > 0) ||
      (Array.isArray(pubData.categories) && pubData.categories.length > 0)
    )) {
      const rLogo = pubData.restaurant.branding?.headerLogoUrl || pubData.restaurant.logoUrl || '';
      pubData.restaurant.logoUrl = rLogo;
      pubData.restaurant.branding = normalizeBranding(
        { ...(pubData.restaurant.branding || {}), headerLogoUrl: rLogo },
        pubData.restaurant.templateId
      );
      return pubData;
    }

    // 2. Fallback: Lookup restaurant by document ID or query by slug in parallel
    const [directRestNormSnap, directRestRawSnap, slugQuerySnap] = await Promise.all([
      getDoc(doc(db, 'restaurants', normKey)).catch(() => null),
      restaurantIdOrSlug !== normKey
        ? getDoc(doc(db, 'restaurants', restaurantIdOrSlug)).catch(() => null)
        : Promise.resolve(null),
      getDocs(query(collection(db, 'restaurants'), where('slug', '==', normKey))).catch(() => null)
    ]);

    let matchedRest: Restaurant | null = null;
    if (directRestNormSnap && directRestNormSnap.exists()) {
      matchedRest = directRestNormSnap.data() as Restaurant;
    } else if (directRestRawSnap && directRestRawSnap.exists()) {
      matchedRest = directRestRawSnap.data() as Restaurant;
    } else if (slugQuerySnap && !slugQuerySnap.empty) {
      matchedRest = slugQuerySnap.docs[0].data() as Restaurant;
    }

    const activeRest: Restaurant | null = matchedRest || pubData?.restaurant || null;
    if (activeRest) {
      const rLogo = activeRest.branding?.headerLogoUrl || activeRest.logoUrl || '';
      activeRest.logoUrl = rLogo;
      activeRest.branding = normalizeBranding(
        { ...(activeRest.branding || {}), headerLogoUrl: rLogo },
        activeRest.templateId
      );
      const primarySlug = normalizeSlugKey(activeRest.slug || activeRest.name || activeRest.id);
      activeRest.slug = primarySlug;

      // Query ONLY categories and items targeted for this specific restaurant using where() queries in parallel
      const possibleIds = Array.from(new Set([activeRest.id, primarySlug, normKey].filter(Boolean)));
      
      const categoryPromises = possibleIds.map(targetId =>
        getDocs(query(collection(db, 'categories'), where('restaurantId', '==', targetId))).catch(() => null)
      );
      const itemPromises = possibleIds.map(targetId =>
        getDocs(query(collection(db, 'items'), where('restaurantId', '==', targetId))).catch(() => null)
      );

      const [catResults, itemResults] = await Promise.all([
        Promise.all(categoryPromises),
        Promise.all(itemPromises)
      ]);

      const catMap = new Map<string, MenuCategory>();
      catResults.forEach(snap => {
        snap?.forEach(d => {
          const c = d.data() as MenuCategory;
          if (c && c.id) catMap.set(c.id, c);
        });
      });

      const itemMap = new Map<string, MenuItem>();
      itemResults.forEach(snap => {
        snap?.forEach(d => {
          const i = d.data() as MenuItem;
          if (i && i.id) itemMap.set(i.id, i);
        });
      });

      const liveCategories = Array.from(catMap.values());
      const liveItems = Array.from(itemMap.values());

      const finalCategories = liveCategories.length > 0 ? liveCategories : (pubData?.categories || []);
      const finalItems = liveItems.length > 0 ? liveItems : (pubData?.items || []);

      return {
        published: true,
        version: pubData?.version || 1,
        publishedAt: pubData?.publishedAt || new Date().toISOString(),
        restaurant: activeRest,
        categories: finalCategories,
        items: finalItems
      };
    }

    if (pubData) {
      return pubData;
    }
  } catch (err) {
    console.warn('[Firestore] Error fetching published menu from Firestore:', err);
  }
  return null;
}

/**
 * Fetches saved templates from the Firestore 'templates' collection (one-time getDocs).
 */
export async function fetchTemplatesFromFirestore(): Promise<MenuTemplate[] | null> {
  if (isBypassingFirestore()) return null;
  try {
    const snap = await getDocs(collection(db, 'templates')).catch((err) => {
      handleFirestoreError(err, 'fetch templates');
      return null;
    });
    if (!snap) return null;
    const templates: MenuTemplate[] = [];
    snap.forEach(d => {
      const data = d.data() as MenuTemplate;
      if (data && (data.id || d.id) && data.name) {
        templates.push({ ...data, id: data.id || d.id });
      }
    });
    return templates;
  } catch (err) {
    console.warn('[Firestore] fetchTemplatesFromFirestore notice:', err);
    return null;
  }
}

/**
 * Saves a custom template to Firestore 'templates' collection.
 */
export async function saveTemplateToFirestore(template: MenuTemplate): Promise<boolean> {
  if (isBypassingFirestore()) return true;
  if (!template || !template.id) return false;
  try {
    await setDoc(doc(db, 'templates', template.id), cleanObject(template), { merge: true });
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'saveTemplateToFirestore');
  }
}

/**
 * Deletes a template from Firestore 'templates' collection.
 */
export async function deleteTemplateFromFirestore(templateId: string): Promise<boolean> {
  if (isBypassingFirestore()) return true;
  if (!templateId) return false;
  try {
    await deleteDoc(doc(db, 'templates', templateId));
    return true;
  } catch (err) {
    return handleFirestoreError(err, 'deleteTemplateFromFirestore');
  }
}

/**
 * Fetches data for a specific restaurant ONLY using doc(db, 'restaurants', id) and where('restaurantId', '==', id).
 * Never reads entire collections.
 */
export async function fetchSpecificRestaurantDataFromFirestore(restaurantId: string): Promise<{
  restaurant: Restaurant | null;
  categories: MenuCategory[];
  items: MenuItem[];
  orders: Order[];
} | null> {
  if (isBypassingFirestore() || !restaurantId) return null;
  try {
    const normSlug = normalizeSlugKey(restaurantId);
    const possibleIds = Array.from(new Set([restaurantId, normSlug].filter(Boolean)));

    const [restDocSnap, restNormSnap, ...queryResults] = await Promise.all([
      getDoc(doc(db, 'restaurants', restaurantId)).catch((err) => { handleFirestoreError(err, 'getDoc restaurant'); return null; }),
      normSlug && normSlug !== restaurantId
        ? getDoc(doc(db, 'restaurants', normSlug)).catch(() => null)
        : Promise.resolve(null),
      ...possibleIds.map(id => getDocs(query(collection(db, 'categories'), where('restaurantId', '==', id))).catch(() => null)),
      ...possibleIds.map(id => getDocs(query(collection(db, 'items'), where('restaurantId', '==', id))).catch(() => null)),
      ...possibleIds.map(id => getDocs(query(collection(db, 'orders'), where('restaurantId', '==', id))).catch(() => null))
    ]);

    let restaurant: Restaurant | null = null;
    const rawSnap = (restDocSnap && restDocSnap.exists()) ? restDocSnap : ((restNormSnap && restNormSnap.exists()) ? restNormSnap : null);
    if (rawSnap) {
      const data = rawSnap.data() as Restaurant;
      const docId = data.id || rawSnap.id;
      const cleanSlug = normalizeSlugKey(data.slug || data.name || docId);
      const resolvedLogo = data.branding?.headerLogoUrl || data.logoUrl || '';
      restaurant = {
        ...data,
        id: docId,
        slug: cleanSlug || docId,
        logoUrl: resolvedLogo,
        branding: normalizeBranding({ ...(data.branding || {}), headerLogoUrl: resolvedLogo }, data.templateId)
      };
    }

    const n = possibleIds.length;
    const catSnaps = queryResults.slice(0, n);
    const itemSnaps = queryResults.slice(n, n * 2);
    const orderSnaps = queryResults.slice(n * 2, n * 3);

    const catMap = new Map<string, MenuCategory>();
    catSnaps.forEach(s => s?.forEach(d => {
      const c = d.data() as MenuCategory;
      if (c && c.id) catMap.set(c.id, c);
    }));

    const itemMap = new Map<string, MenuItem>();
    itemSnaps.forEach(s => s?.forEach(d => {
      const i = d.data() as MenuItem;
      if (i && i.id) itemMap.set(i.id, i);
    }));

    const orderMap = new Map<string, Order>();
    orderSnaps.forEach(s => s?.forEach(d => {
      const o = d.data() as Order;
      if (o && o.id) orderMap.set(o.id, o);
    }));

    return {
      restaurant,
      categories: Array.from(catMap.values()),
      items: Array.from(itemMap.values()),
      orders: Array.from(orderMap.values())
    };
  } catch (err) {
    handleFirestoreError(err, 'fetchSpecificRestaurantDataFromFirestore');
    return null;
  }
}

/**
 * Subscribes in real-time ONLY to a single specific restaurant document and/or its filtered orders
 * using doc(db, 'restaurants', restaurantId) and where('restaurantId', '==', restaurantId).
 * NEVER listens to entire collections.
 */
export function subscribeToRestaurantOrdersRealtime(
  restaurantId: string,
  onOrdersUpdate: (orders: Order[]) => void,
  onRestaurantDocUpdate?: (restaurant: Restaurant) => void
): () => void {
  if (isBypassingFirestore() || !restaurantId || restaurantId === 'all') return () => {};
  const unsubs: (() => void)[] = [];

  try {
    // 1. Optional single-document listener on doc(db, 'restaurants', restaurantId)
    if (onRestaurantDocUpdate) {
      unsubs.push(
        onSnapshot(
          doc(db, 'restaurants', restaurantId),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as Restaurant;
              if (data && (data.slug || data.name || data.id)) {
                const docId = data.id || docSnap.id;
                const cleanSlug = normalizeSlugKey(data.slug || data.name || docId);
                const resolvedLogo = data.branding?.headerLogoUrl || data.logoUrl || '';
                data.id = docId;
                data.slug = cleanSlug || docId;
                data.logoUrl = resolvedLogo;
                data.branding = normalizeBranding(
                  { ...(data.branding || {}), headerLogoUrl: resolvedLogo },
                  data.templateId
                );
                onRestaurantDocUpdate(data);
              }
            }
          },
          (err) => handleFirestoreError(err, `onSnapshot doc restaurant ${restaurantId}`)
        )
      );
    }

    // 2. Filtered listener ONLY for orders of this specific restaurantId
    const ordersQuery = query(collection(db, 'orders'), where('restaurantId', '==', restaurantId));
    unsubs.push(
      onSnapshot(
        ordersQuery,
        (snap) => {
          const orders: Order[] = [];
          snap.forEach(d => {
            const data = d.data() as Order;
            if (data && data.id) orders.push(data);
          });
          onOrdersUpdate(orders);
        },
        (err) => handleFirestoreError(err, `onSnapshot orders where restaurantId==${restaurantId}`)
      )
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeToRestaurantOrdersRealtime');
  }

  return () => {
    unsubs.forEach(u => {
      try { u(); } catch {}
    });
  };
}

/**
 * Replaces the old 5-collection perpetual onSnapshot with a single one-time fetch (getDocs once)
 * so that editing or navigating the panel NEVER keeps open collection-wide onSnapshot listeners.
 */
export function subscribeToFirestoreRealtime(
  onUpdate: (payload: Partial<CloudMenuPayload>) => void
): () => void {
  if (isBypassingFirestore()) return () => {};
  let cancelled = false;

  fetchFromFirestore()
    .then((payload) => {
      if (!cancelled && payload) {
        onUpdate(payload);
      }
    })
    .catch((err) => {
      handleFirestoreError(err, 'initial one-time fetchFromFirestore');
    });

  return () => {
    cancelled = true;
  };
}
