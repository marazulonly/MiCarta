import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const CLOUD_STORAGE_FILE = path.join(DATA_DIR, 'cloud-menu.json');

// Read .env if present
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache
let cachedCloudData: any = null;
let cloudDataLock: Promise<any> = Promise.resolve();

function withCloudDataLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = cloudDataLock.then(() => fn(), () => fn());
  cloudDataLock = result.then(() => {}, () => {});
  return result;
}

// Upstash Redis / Vercel KV configuration
let kvRestUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || 'https://tough-raccoon-293580.upstash.io';
let kvRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAABHrMAAIgcDExYmEwMjliM2FlZTg0NjJjOTM3ZWRhOTI3MmY4MTlmYg';

async function fetchFromVercelKV(): Promise<any> {
  if (!kvRestUrl || !kvRestToken) return null;
  try {
    const cleanUrl = kvRestUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/get/applet_menu_snapshot`, {
      headers: {
        Authorization: `Bearer ${kvRestToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        let parsed = data.result;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            // Keep raw if not json
          }
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Server] Error reading from Vercel KV / Upstash:', err);
  }
  return null;
}

async function saveToVercelKV(data: any): Promise<boolean> {
  if (!kvRestUrl || !kvRestToken) return false;
  try {
    const cleanUrl = kvRestUrl.replace(/\/+$/, '');
    const stringified = JSON.stringify(data);
    const res = await fetch(`${cleanUrl}/set/applet_menu_snapshot`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvRestToken}`,
        'Content-Type': 'application/json',
      },
      body: stringified,
    });
    return res.ok;
  } catch (err) {
    console.warn('[Server] Error saving to Vercel KV / Upstash:', err);
    return false;
  }
}

async function saveIndividualToVercelKV(slugOrId: string, data: any): Promise<boolean> {
  if (!kvRestUrl || !kvRestToken) return false;
  const norm = normalizeSlug(slugOrId);
  if (!norm) return false;
  try {
    const cleanUrl = kvRestUrl.replace(/\/+$/, '');
    const stringified = JSON.stringify(data);
    const res = await fetch(`${cleanUrl}/set/applet_menu_pub_${norm}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvRestToken}`,
        'Content-Type': 'application/json',
      },
      body: stringified,
    });
    return res.ok;
  } catch (err) {
    console.warn('[Server] Error saving individual key to Vercel KV / Upstash:', err);
    return false;
  }
}

// Helper function to normalize slugs for matching URLs, names, and IDs
function normalizeSlug(str?: string): string {
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

function loadCloudDataFromDisk() {
  try {
    if (fs.existsSync(CLOUD_STORAGE_FILE)) {
      const raw = fs.readFileSync(CLOUD_STORAGE_FILE, 'utf-8');
      cachedCloudData = JSON.parse(raw);
      if (!cachedCloudData.publishedMenus) {
        cachedCloudData.publishedMenus = {};
      }
      return cachedCloudData;
    }
  } catch (err) {
    console.warn('[Server] Error reading cloud-menu.json:', err);
  }
  return null;
}

function syncAllPublishedMenus(data: any) {
  if (!data) return;
  data.publishedMenus = data.publishedMenus || {};
  const rests = data.restaurants || [];
  const categories = data.categories || [];
  const items = data.items || [];

  rests.forEach((r: any) => {
    if (!r || !r.id) return;
    const prevSnapshot = data.publishedMenus[r.id];
    const restCategories = categories.filter((c: any) => c.restaurantId === r.id);
    const restItems = items.filter((i: any) => i.restaurantId === r.id);

    // Keep existing version or default to 1, update fields to ensure fresh draft updates are live
    const nextVersion = prevSnapshot ? (prevSnapshot.version || 1) : 1;
    
    data.publishedMenus[r.id] = {
      version: nextVersion,
      publishedAt: prevSnapshot?.publishedAt || new Date().toISOString(),
      publishedBy: prevSnapshot?.publishedBy || 'System Auto-Sync',
      restaurant: r,
      categories: restCategories,
      items: restItems
    };
  });

  // Clean up deleted restaurants from published snapshot list
  const restIds = new Set(rests.map((r: any) => r.id));
  Object.keys(data.publishedMenus).forEach(id => {
    if (!restIds.has(id)) {
      delete data.publishedMenus[id];
    }
  });
}

function saveCloudDataToDisk(data: any) {
  try {
    syncAllPublishedMenus(data);
    cachedCloudData = {
      ...data,
      publishedMenus: data.publishedMenus || cachedCloudData?.publishedMenus || {},
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CLOUD_STORAGE_FILE, JSON.stringify(cachedCloudData, null, 2), 'utf-8');
    
    // Asynchronously push to Vercel KV if configured (do not let Upstash errors fail the operation)
    if (kvRestUrl && kvRestToken) {
      saveToVercelKV(cachedCloudData).catch(err => {
        console.warn('[Server] Background Vercel KV sync notice (size/payload):', err);
      });
      if (cachedCloudData.publishedMenus) {
        Object.values(cachedCloudData.publishedMenus).forEach((snap: any) => {
          if (snap?.restaurant?.slug) saveIndividualToVercelKV(snap.restaurant.slug, snap).catch(() => {});
          if (snap?.restaurant?.id) saveIndividualToVercelKV(snap.restaurant.id, snap).catch(() => {});
        });
      }
    }

    return true;
  } catch (err) {
    console.error('[Server] Error saving cloud-menu.json:', err);
    return false;
  }
}

async function ensureCloudDataHydrated() {
  if (cachedCloudData) {
    syncAllPublishedMenus(cachedCloudData);
    return cachedCloudData;
  }

  // 1. Primary: Load persistent local disk file
  if (fs.existsSync(CLOUD_STORAGE_FILE)) {
    loadCloudDataFromDisk();
    if (cachedCloudData) {
      syncAllPublishedMenus(cachedCloudData);
      return cachedCloudData;
    }
  }

  // 2. Secondary: If disk is completely empty or missing, try Vercel KV / Upstash
  if (kvRestUrl && kvRestToken) {
    try {
      const remoteData = await fetchFromVercelKV();
      if (remoteData && Array.isArray(remoteData.users)) {
        // Strip non-admin demo records
        remoteData.users = remoteData.users.filter((u: any) => u && u.role === 'ADMIN');
        cachedCloudData = remoteData;
        syncAllPublishedMenus(cachedCloudData);
        console.log('[Server] Successfully hydrated cachedCloudData from Vercel KV / Upstash');
        return cachedCloudData;
      }
    } catch (err) {
      console.warn('[Server] Notice: Vercel KV hydration skipped or failed:', err);
    }
  }

  if (cachedCloudData) {
    syncAllPublishedMenus(cachedCloudData);
  }

  return cachedCloudData;
}

// Pre-warm the cache at startup asynchronously
ensureCloudDataHydrated().catch(() => {});

// Connected SSE clients for live menu updates
const sseClients = new Set<express.Response>();

function broadcastMenuUpdate(payload: any) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Helper to look up restaurant branding for direct link access & preloading
async function getRestaurantBrandingForSlug(slugOrId: string) {
  if (!slugOrId) return null;
  await ensureCloudDataHydrated();
  const current = cachedCloudData || { restaurants: [], publishedMenus: {} };
  const targetSlug = normalizeSlug(slugOrId);

  // 1. Check publishedMenus
  if (current.publishedMenus) {
    for (const [restId, snapshot] of Object.entries(current.publishedMenus)) {
      if (!snapshot) continue;
      const snapRest = (snapshot as any).restaurant;
      if (
        normalizeSlug(restId) === targetSlug ||
        normalizeSlug(snapRest?.slug) === targetSlug ||
        normalizeSlug(snapRest?.name) === targetSlug
      ) {
        return snapRest;
      }
    }
  }

  // 2. Check restaurants list
  if (Array.isArray(current.restaurants)) {
    const found = current.restaurants.find((r: any) => {
      if (!r) return false;
      return (
        normalizeSlug(r.id) === targetSlug ||
        normalizeSlug(r.slug) === targetSlug ||
        normalizeSlug(r.name) === targetSlug
      );
    });
    if (found) return found;
  }

  return null;
}

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 50MB (for base64 logos, photos, etc.)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // GET: Retrieve latest cloud menu
  app.get('/api/cloud-menu', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    await ensureCloudDataHydrated();
    res.json({
      success: true,
      data: cachedCloudData,
      timestamp: cachedCloudData?.updatedAt || new Date().toISOString()
    });
  });

  // GET: Retrieve atomic published menu for a restaurant (for anonymous visitors & public QR)
  app.get('/api/public/menu/:slugOrId', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    await ensureCloudDataHydrated();
    const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [], publishedMenus: {} };
    const { slugOrId } = req.params;
    const target = normalizeSlug(slugOrId);

    // 1. Look in publishedMenus by restaurantId or slug
    const publishedMenus = current.publishedMenus || {};
    let matchedSnapshot: any = null;

    // Normalizamos el objetivo una sola vez
    const targetSlug = normalizeSlug(slugOrId);
    console.log(`[Server Debug] Buscando slugOrId: "${slugOrId}", targetSlug: "${targetSlug}"`);
    console.log(`[Server Debug] Keys in publishedMenus: ${Object.keys(publishedMenus).join(', ')}`);

    for (const [restId, snapshot] of Object.entries(publishedMenus)) {
      if (!snapshot) continue;
      const snapRest = (snapshot as any).restaurant;
      
      // Creamos slugs normalizados de los campos de comparación
      const snapRestId = normalizeSlug(restId);
      const snapRestSlug = normalizeSlug(snapRest?.slug);
      const snapRestName = normalizeSlug(snapRest?.name);
      
      console.log(`[Server Debug] Comparando contra restId: "${restId}" (norm: "${snapRestId}"), slug: "${snapRest?.slug}" (norm: "${snapRestSlug}"), name: "${snapRest?.name}" (norm: "${snapRestName}")`);

      if (
        snapRestId === targetSlug || 
        snapRestSlug === targetSlug ||
        snapRestName === targetSlug
      ) {
        console.log(`[Server Debug] ¡Match encontrado!`);
        matchedSnapshot = snapshot;
        break;
      }
    }

    // 2. If already published, return the atomic snapshot
    if (matchedSnapshot) {
      res.json({
        success: true,
        published: true,
        version: matchedSnapshot.version || 1,
        publishedAt: matchedSnapshot.publishedAt || current.updatedAt,
        restaurant: matchedSnapshot.restaurant,
        categories: matchedSnapshot.categories || [],
        items: matchedSnapshot.items || []
      });
      return;
    }

    // 2b. Fallback: Search in current.restaurants and auto-generate published snapshot
    if (current.restaurants && Array.isArray(current.restaurants)) {
      const foundRest = current.restaurants.find((r: any) => {
        if (!r) return false;
        return (
          normalizeSlug(r.id) === targetSlug ||
          normalizeSlug(r.slug) === targetSlug ||
          normalizeSlug(r.name) === targetSlug
        );
      });

      if (foundRest) {
        const restCategories = (current.categories || []).filter((c: any) => c && c.restaurantId === foundRest.id);
        const restItems = (current.items || []).filter((i: any) => i && i.restaurantId === foundRest.id);
        const newSnapshot = {
          version: 1,
          publishedAt: current.updatedAt || new Date().toISOString(),
          publishedBy: 'System Auto-Sync',
          restaurant: foundRest,
          categories: restCategories,
          items: restItems
        };
        if (!current.publishedMenus) current.publishedMenus = {};
        current.publishedMenus[foundRest.id] = newSnapshot;
        saveCloudDataToDisk(current);

        res.json({
          success: true,
          published: true,
          version: 1,
          publishedAt: newSnapshot.publishedAt,
          restaurant: foundRest,
          categories: restCategories,
          items: restItems
        });
        return;
      }
    }

    res.status(404).json({
      success: false,
      message: `No se encontró la carta para el identificador "${slugOrId}"`
    });
  });

  // POST: Publish a restaurant's menu atomically (guaranteeing exact single source of truth for public visitors)
  app.post('/api/menu/publish', async (req, res) => {
    const { restaurantId, restaurant, categories, items, publishedBy } = req.body;
    if (!restaurantId || !restaurant) {
      res.status(400).json({ success: false, message: 'Se requiere restaurantId y datos del restaurante para publicar' });
      return;
    }

    await ensureCloudDataHydrated();
    const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [], publishedMenus: {} };
    const publishedMenus = current.publishedMenus || {};
    const prevSnapshot = publishedMenus[restaurantId];
    const nextVersion = (prevSnapshot?.version || 0) + 1;
    const nowIso = new Date().toISOString();

    const newSnapshot = {
      version: nextVersion,
      publishedAt: nowIso,
      publishedBy: publishedBy || 'Admin / Owner',
      restaurant,
      categories: categories || [],
      items: items || []
    };

    publishedMenus[restaurantId] = newSnapshot;

    // Synchronize current draft restaurant, categories, and items with the published version
    const updatedRestaurants = [...(current.restaurants || [])];
    const rIdx = updatedRestaurants.findIndex((r: any) => r.id === restaurantId);
    if (rIdx >= 0) {
      updatedRestaurants[rIdx] = restaurant;
    } else {
      updatedRestaurants.push(restaurant);
    }

    // Replace items of this restaurant with published items
    const otherItems = (current.items || []).filter((i: any) => i.restaurantId !== restaurantId);
    const updatedItems = [...otherItems, ...(items || [])];

    // Replace categories of this restaurant with published categories
    const otherCategories = (current.categories || []).filter((c: any) => c.restaurantId !== restaurantId);
    const updatedCategories = [...otherCategories, ...(categories || [])];

    const updatedData = {
      ...current,
      restaurants: updatedRestaurants,
      categories: updatedCategories,
      items: updatedItems,
      publishedMenus,
      updatedAt: nowIso
    };

    saveCloudDataToDisk(updatedData);

    if (restaurant.slug) saveIndividualToVercelKV(restaurant.slug, newSnapshot).catch(() => {});
    if (restaurant.id) saveIndividualToVercelKV(restaurant.id, newSnapshot).catch(() => {});

    // Broadcast publish event to all connected devices and incognito tabs
    broadcastMenuUpdate({
      type: 'MENU_PUBLISHED',
      restaurantId,
      slug: restaurant.slug,
      version: nextVersion,
      publishedAt: nowIso,
      snapshot: newSnapshot
    });

    res.json({
      success: true,
      message: `¡Carta de "${restaurant.name}" publicada con éxito (Versión ${nextVersion})!`,
      version: nextVersion,
      publishedAt: nowIso
    });
  });

  // POST: Reparación forzada de todos los slugs y republicación de todos los menús
  app.post('/api/menu/republish-all', async (req, res) => {
    await ensureCloudDataHydrated();
    const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [], publishedMenus: {} };
    const publishedMenus = current.publishedMenus || {};
    const nowIso = new Date().toISOString();

    (current.restaurants || []).forEach((r: any) => {
      const restaurantId = r.id;
      const normalizedSlug = normalizeSlug(r.name);
      r.slug = normalizedSlug;
      
      const prevSnapshot = publishedMenus[restaurantId];
      const nextVersion = (prevSnapshot?.version || 0) + 1;
      
      const restCategories = (current.categories || []).filter((c: any) => c.restaurantId === restaurantId);
      const restItems = (current.items || []).filter((i: any) => i.restaurantId === restaurantId);

      publishedMenus[restaurantId] = {
        version: nextVersion,
        publishedAt: nowIso,
        publishedBy: 'System Auto-Repair',
        restaurant: r,
        categories: restCategories,
        items: restItems
      };
    });

    const updatedData = {
      ...current,
      publishedMenus,
      updatedAt: nowIso
    };

    saveCloudDataToDisk(updatedData);
    res.json({ success: true, message: '¡Todos los slugs normalizados y cartas republicadas exitosamente!' });
  });

  // Helper to deduplicate restaurants by ID, slug, and name
  function deduplicateServerRestaurants(rests: any[]): any[] {
    if (!Array.isArray(rests)) return [];
    const mapById = new Map<string, any>();
    const mapBySlugOrName = new Map<string, any>();

    rests.forEach((r: any) => {
      if (!r || !r.id || !r.name) return;
      const cleanSlug = normalizeSlug(r.slug || r.name);
      const cleanName = r.name.trim().toLowerCase();
      const slugKey = cleanSlug || cleanName;

      const existing = mapBySlugOrName.get(slugKey) || mapById.get(r.id);
      if (!existing) {
        const item = { ...r, slug: cleanSlug };
        mapById.set(r.id, item);
        mapBySlugOrName.set(slugKey, item);
      } else {
        // Merge towards the most complete record
        const merged = {
          ...existing,
          ...r,
          ownerId: r.ownerId || existing.ownerId,
          templateId: r.templateId || existing.templateId,
          branding: { ...(existing.branding || {}), ...(r.branding || {}) }
        };
        mapById.delete(existing.id);
        mapById.set(merged.id, merged);
        mapBySlugOrName.set(slugKey, merged);
      }
    });

    return Array.from(mapById.values());
  }

  // POST: Full save or update of cloud menu
  app.post('/api/cloud-menu', async (req, res) => {
    return withCloudDataLock(async () => {
      const { restaurants, items, categories, users, orders } = req.body;
      if (!restaurants && !items && !categories) {
        res.status(400).json({ success: false, message: 'Faltan datos de la carta' });
        return;
      }

      await ensureCloudDataHydrated();
      const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [], publishedMenus: {} };

      // Explicit authoritative arrays provided by the client (sanitized and deduplicated)
      const nextRestaurants = Array.isArray(restaurants) 
        ? deduplicateServerRestaurants(restaurants) 
        : (current.restaurants || []);

      const userMap = new Map<string, any>();
      if (Array.isArray(users) && users.length > 0) {
        users.forEach((u: any) => {
          const key = u?.id || (u?.dni ? `dni-${u.dni}` : null);
          if (key) userMap.set(key, u);
        });
      } else {
        (current.users || []).forEach((u: any) => {
          const key = u?.id || (u?.dni ? `dni-${u.dni}` : null);
          if (key) userMap.set(key, u);
        });
      }

      const nextCategories = Array.isArray(categories) ? categories : (current.categories || []);
      const nextItems = Array.isArray(items) ? items : (current.items || []);

      const updatedData = {
        ...current,
        restaurants: nextRestaurants,
        categories: nextCategories,
        items: nextItems,
        users: Array.from(userMap.values()),
        orders: orders || current.orders || [],
        publishedMenus: current.publishedMenus || {},
        updatedAt: new Date().toISOString()
      };

      const saved = saveCloudDataToDisk(updatedData);
      if (saved) {
        await saveToVercelKV(updatedData);
        broadcastMenuUpdate({ type: 'FULL_SYNC', data: updatedData });
        res.json({
          success: true,
          message: 'Carta guardada permanentemente en la nube',
          updatedAt: updatedData.updatedAt
        });
      } else {
        res.status(500).json({ success: false, message: 'Error al persistir en disco' });
      }
    });
  });

  // POST: Complete clean wipe
  app.post('/api/admin/clean-all', async (req, res) => {
    return withCloudDataLock(async () => {
      const cleanData = {
        restaurants: [],
        categories: [],
        items: [],
        orders: [],
        users: [
          {
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
          },
          {
            id: 'u-ever-aguilar',
            name: 'Ever Aguilar',
            email: 'ever.aguilar@micarta.pe',
            dni: '10203040',
            password: '12345678',
            role: 'ADMIN',
            phone: '+51 980 102 030',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
            restaurantIds: [],
            status: 'active',
            lastActive: 'En línea'
          }
        ],
        publishedMenus: {},
        updatedAt: new Date().toISOString()
      };
      saveCloudDataToDisk(cleanData);
      await saveToVercelKV(cleanData);
      broadcastMenuUpdate({ type: 'FULL_SYNC', data: cleanData });
      res.json({ success: true, message: 'Database wiped clean' });
    });
  });

  // POST: Update single menu item
  app.post('/api/cloud-menu/item', async (req, res) => {
    return withCloudDataLock(async () => {
      const item = req.body;
      if (!item || !item.id) {
        res.status(400).json({ success: false, message: 'Item inválido' });
        return;
      }

      await ensureCloudDataHydrated();
      const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
      const items = [...(current.items || [])];
      const idx = items.findIndex((i: any) => i.id === item.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...item };
      } else {
        items.unshift(item);
      }

      const updatedData = {
        ...current,
        items,
        updatedAt: new Date().toISOString()
      };

      saveCloudDataToDisk(updatedData);
      await saveToVercelKV(updatedData);
      broadcastMenuUpdate({ type: 'ITEM_UPDATED', item, items });
      res.json({ success: true, message: `Plato "${item.name}" guardado en la nube`, item });
    });
  });

  // DELETE: Delete menu item
  app.delete('/api/cloud-menu/item/:id', async (req, res) => {
    return withCloudDataLock(async () => {
      const { id } = req.params;
      await ensureCloudDataHydrated();
      const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
      const items = (current.items || []).filter((i: any) => i.id !== id);

      const updatedData = {
        ...current,
        items,
        updatedAt: new Date().toISOString()
      };

      saveCloudDataToDisk(updatedData);
      await saveToVercelKV(updatedData);
      broadcastMenuUpdate({ type: 'ITEM_DELETED', itemId: id, items });
      res.json({ success: true, message: 'Plato eliminado de la nube' });
    });
  });

  // POST: Update single restaurant
  app.post('/api/cloud-menu/restaurant', async (req, res) => {
    return withCloudDataLock(async () => {
      const restaurant = req.body;
      if (!restaurant || !restaurant.id) {
        res.status(400).json({ success: false, message: 'Restaurante inválido' });
        return;
      }

      await ensureCloudDataHydrated();
      const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
      const restaurants = [...(current.restaurants || [])];
      const idx = restaurants.findIndex((r: any) => r.id === restaurant.id);
      if (idx >= 0) {
        restaurants[idx] = { ...restaurants[idx], ...restaurant };
      } else {
        restaurants.push(restaurant);
      }

      const updatedData = {
        ...current,
        restaurants,
        updatedAt: new Date().toISOString()
      };

      saveCloudDataToDisk(updatedData);
      await saveToVercelKV(updatedData);

      // Also persist individual snapshot for immediate CDN/public access
      if (restaurant.slug) {
        saveIndividualToVercelKV(restaurant.slug, {
          success: true,
          published: true,
          version: 1,
          publishedAt: updatedData.updatedAt,
          restaurant,
          categories: (updatedData.categories || []).filter((c: any) => c.restaurantId === restaurant.id),
          items: (updatedData.items || []).filter((i: any) => i.restaurantId === restaurant.id)
        }).catch(() => {});
      }

      broadcastMenuUpdate({ type: 'RESTAURANT_UPDATED', restaurant, restaurants });
      res.json({ success: true, message: `Restaurante "${restaurant.name}" guardado en la nube`, restaurant });
    });
  });

  // DELETE: Delete restaurant
  app.delete('/api/cloud-menu/restaurant/:id', async (req, res) => {
    return withCloudDataLock(async () => {
      const { id } = req.params;
      await ensureCloudDataHydrated();
      const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
      const restaurants = (current.restaurants || []).filter((r: any) => r.id !== id);
      const categories = (current.categories || []).filter((c: any) => c.restaurantId !== id);
      const items = (current.items || []).filter((i: any) => i.restaurantId !== id);

      const updatedData = {
        ...current,
        restaurants,
        categories,
        items,
        updatedAt: new Date().toISOString()
      };

      saveCloudDataToDisk(updatedData);
      await saveToVercelKV(updatedData);
      broadcastMenuUpdate({ type: 'FULL_SYNC', data: updatedData });
      res.json({ success: true, message: 'Restaurante eliminado permanentemente de la nube' });
    });
  });

  // POST: Update or add category
  app.post('/api/cloud-menu/category', async (req, res) => {
    return withCloudDataLock(async () => {
      const category = req.body;
      if (!category || !category.id) {
        res.status(400).json({ success: false, message: 'Categoría inválida' });
        return;
      }

      await ensureCloudDataHydrated();
      const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
      const categories = [...(current.categories || [])];
      const idx = categories.findIndex((c: any) => c.id === category.id);
      if (idx >= 0) {
        categories[idx] = { ...categories[idx], ...category };
      } else {
        categories.push(category);
      }

      const updatedData = {
        ...current,
        categories,
        updatedAt: new Date().toISOString()
      };

      saveCloudDataToDisk(updatedData);
      await saveToVercelKV(updatedData);
      broadcastMenuUpdate({ type: 'CATEGORY_UPDATED', category, categories });
      res.json({ success: true, message: `Categoría "${category.name}" guardada en la nube`, category });
    });
  });

  // DELETE: Delete category
  app.delete('/api/cloud-menu/category/:id', async (req, res) => {
    return withCloudDataLock(async () => {
      const { id } = req.params;
      await ensureCloudDataHydrated();
      const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
      const categories = (current.categories || []).filter((c: any) => c.id !== id);

      const updatedData = {
        ...current,
        categories,
        updatedAt: new Date().toISOString()
      };

      saveCloudDataToDisk(updatedData);
      await saveToVercelKV(updatedData);
      broadcastMenuUpdate({ type: 'CATEGORY_DELETED', categoryId: id, categories });
      res.json({ success: true, message: 'Categoría eliminada de la nube' });
    });
  });

  // POST: Update or create user (guarantees photo and restaurant assignment persistence)
  app.post('/api/cloud-menu/user', async (req, res) => {
    return withCloudDataLock(async () => {
      const user = req.body;
      if (!user || (!user.id && !user.dni)) {
        res.status(400).json({ success: false, message: 'Usuario inválido' });
        return;
      }

      await ensureCloudDataHydrated();
      const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
      const users = [...(current.users || [])];
      const idx = users.findIndex((u: any) => u.id === user.id || (user.dni && u.dni === user.dni));

      if (idx >= 0) {
        users[idx] = { ...users[idx], ...user };
      } else {
        users.unshift(user);
      }

      const updatedData = {
        ...current,
        users,
        updatedAt: new Date().toISOString()
      };

      saveCloudDataToDisk(updatedData);
      await saveToVercelKV(updatedData);
      broadcastMenuUpdate({ type: 'USER_UPDATED', user, users });
      res.json({ success: true, message: `Usuario "${user.name}" guardado permanentemente en la nube`, user });
    });
  });

  // DELETE: Delete user
  app.delete('/api/cloud-menu/user/:id', async (req, res) => {
    return withCloudDataLock(async () => {
      const { id } = req.params;
      await ensureCloudDataHydrated();
      const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
      const target = id.trim().toLowerCase();
      const users = (current.users || []).filter((u: any) => {
        if (!u) return false;
        if (u.id && u.id.toLowerCase() === target) return false;
        if (u.dni && u.dni.toLowerCase() === target) return false;
        if (u.name && u.name.trim().toLowerCase() === target) return false;
        return true;
      });

      const updatedData = {
        ...current,
        users,
        updatedAt: new Date().toISOString()
      };

      saveCloudDataToDisk(updatedData);
      await saveToVercelKV(updatedData);
      broadcastMenuUpdate({ type: 'USER_DELETED', userId: id, users });
      res.json({ success: true, message: 'Usuario eliminado permanentemente de la nube' });
    });
  });

  // POST: Create or sync new order (instant cloud save and real-time SSE broadcast)
  app.post('/api/cloud-menu/order', async (req, res) => {
    const order = req.body;
    if (!order || !order.id || !order.restaurantId) {
      res.status(400).json({ success: false, message: 'Comanda o pedido inválido' });
      return;
    }

    await ensureCloudDataHydrated();
    const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
    const orders = [...(current.orders || [])];
    const idx = orders.findIndex((o: any) => o.id === order.id);

    if (idx >= 0) {
      orders[idx] = { ...orders[idx], ...order };
    } else {
      orders.unshift(order);
    }

    const updatedData = {
      ...current,
      orders,
      updatedAt: new Date().toISOString()
    };

    saveCloudDataToDisk(updatedData);
    if (kvRestUrl && kvRestToken) {
      saveToVercelKV(updatedData).catch(() => {});
    }

    broadcastMenuUpdate({ type: 'ORDER_CREATED', order, orders });
    res.json({ success: true, message: `Comanda ${order.orderNumber || ''} guardada en tiempo real en la nube`, order });
  });

  // POST: Update order status
  app.post('/api/cloud-menu/order/status', async (req, res) => {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      res.status(400).json({ success: false, message: 'ID de comanda y estado requeridos' });
      return;
    }

    await ensureCloudDataHydrated();
    const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
    const orders = [...(current.orders || [])];
    const idx = orders.findIndex((o: any) => o.id === orderId);

    let updatedOrder = null;
    if (idx >= 0) {
      orders[idx] = { ...orders[idx], status };
      updatedOrder = orders[idx];
    }

    const updatedData = {
      ...current,
      orders,
      updatedAt: new Date().toISOString()
    };

    saveCloudDataToDisk(updatedData);
    if (kvRestUrl && kvRestToken) {
      saveToVercelKV(updatedData).catch(() => {});
    }

    if (updatedOrder) {
      broadcastMenuUpdate({ type: 'ORDER_UPDATED', order: updatedOrder, orders });
    }
    res.json({ success: true, message: 'Estado de comanda actualizado en tiempo real', order: updatedOrder });
  });

  // POST: Configure and verify Vercel KV / Upstash Redis directly
  app.post('/api/cloud-menu/setup-kv', async (req, res) => {
    const { url, token } = req.body;
    if (!url || !token) {
      res.status(400).json({ success: false, message: 'Se requiere url y token de Vercel KV / Upstash' });
      return;
    }

    try {
      const cleanUrl = url.trim().replace(/\/+$/, '');
      const cleanToken = token.trim();

      // Test ping
      const testRes = await fetch(`${cleanUrl}/set/ping_test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ping: Date.now() }),
      });

      if (!testRes.ok) {
        res.status(401).json({ 
          success: false, 
          message: 'No se pudo conectar a la base de datos con las credenciales proporcionadas. Revisa la URL y el Token.' 
        });
        return;
      }

      // Set runtime configuration
      kvRestUrl = cleanUrl;
      kvRestToken = cleanToken;

      // Immediately sync current menu snapshot to Vercel KV
      if (cachedCloudData) {
        await saveToVercelKV(cachedCloudData);
      }

      res.json({
        success: true,
        message: '¡Conexión exitosa con Vercel KV / Upstash! Los cambios ahora se sincronizan en la nube permanentemente.',
        connected: true,
      });
    } catch (err: any) {
      res.status(500).json({ 
        success: false, 
        message: `Error al probar conexión: ${err?.message || 'Error desconocido'}` 
      });
    }
  });

  // GET: Real-time SSE channel for instant menu updates across all browsers & incognito tabs
  app.get('/api/cloud-menu/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Initial ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Mount Vite or Serve Static Files
  let vite: any = null;
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
  } else {
    vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'custom',
    });
  }

  // Handle HTML document requests with instant branding & logo preload for direct menu links
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    // Pass non-HTML requests (API, Vite internal modules, static assets)
    if (
      url.startsWith('/api') ||
      url.startsWith('/@') ||
      url.startsWith('/src') ||
      url.startsWith('/node_modules') ||
      (url.split('?')[0].includes('.') && !url.split('?')[0].endsWith('.html'))
    ) {
      if (vite) {
        return vite.middlewares(req, res, next);
      }
      return next();
    }

    try {
      const isProd = process.env.NODE_ENV === 'production';
      const indexPath = isProd 
        ? path.resolve(__dirname, 'dist', 'index.html')
        : path.resolve(__dirname, 'index.html');

      if (!fs.existsSync(indexPath)) {
        if (vite) return vite.middlewares(req, res, next);
        return next();
      }

      let template = fs.readFileSync(indexPath, 'utf-8');
      if (!isProd && vite) {
        template = await vite.transformIndexHtml(url, template);
      }

      const requestedSlug = (req.query.r || req.query.rest || req.query.restaurant) as string;
      if (requestedSlug) {
        const foundRest = await getRestaurantBrandingForSlug(requestedSlug);
        if (foundRest) {
          const bgColor = foundRest.branding?.backgroundColor || foundRest.branding?.darkBgColor || foundRest.branding?.primaryColor || '#852323';
          const logoUrl = foundRest.branding?.headerLogoUrl || foundRest.logoUrl || '';
          const restName = foundRest.name || 'Carta Digital';

          // Preload style: Instant background color on html/body/#root so there is zero dark flicker
          const preloadStyle = `
  <style id="menu-preload-style">
    html, body {
      background-color: ${bgColor} !important;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    #root {
      background-color: ${bgColor} !important;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    @keyframes splashLogoFade {
      0% { opacity: 0; transform: scale(0.92); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes splashLogoPulse {
      0%, 100% { opacity: 0.85; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.04); }
    }
    #initial-preload-splash {
      min-height: 100vh;
      width: 100%;
      background-color: ${bgColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
    }
    #initial-preload-splash img {
      width: 120px;
      height: 120px;
      object-fit: contain;
      animation: splashLogoFade 0.3s ease-out forwards, splashLogoPulse 1.8s ease-in-out infinite 0.3s;
    }
  </style>`;

          // Image preload tag (if URL)
          const preloadLink = logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('/'))
            ? `<link rel="preload" as="image" href="${logoUrl}" />`
            : '';

          // Preloaded branding data injected into client window
          const preloadScript = `
  <script>
    window.__PRELOADED_RESTAURANT_BRANDING__ = ${JSON.stringify({
      id: foundRest.id,
      slug: foundRest.slug,
      name: foundRest.name,
      bgColor: bgColor,
      logoUrl: logoUrl,
    })};
  </script>`;

          // Initial visual placeholder inside #root
          const initialSplashHtml = `
    <div id="initial-preload-splash">
      ${logoUrl ? `<img src="${logoUrl}" alt="${restName}" />` : ''}
    </div>`;

          // Inject into template
          template = template.replace('</head>', `${preloadStyle}\n${preloadLink}\n${preloadScript}\n</head>`);
          template = template.replace('<div id="root"></div>', `<div id="root">${initialSplashHtml}</div>`);

          res.status(200).set({
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }).end(template);
          return;
        }
      }

      // Default HTML response (for /, /admin, etc.)
      if (!isProd) {
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } else {
        res.sendFile(indexPath);
      }
    } catch (err) {
      if (vite) return vite.middlewares(req, res, next);
      next(err);
    }
  });

  if (vite) {
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Micarta Server] Cloud sync backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Micarta Server] Failed to start:', err);
  process.exit(1);
});
