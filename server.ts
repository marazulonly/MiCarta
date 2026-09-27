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
    }

    return true;
  } catch (err) {
    console.error('[Server] Error saving cloud-menu.json:', err);
    return false;
  }
}

async function ensureCloudDataHydrated() {
  if (cachedCloudData && (cachedCloudData.restaurants?.length || cachedCloudData.items?.length)) {
    return cachedCloudData;
  }

  // 1. Try Vercel KV / Upstash as primary source of truth
  if (kvRestUrl && kvRestToken) {
    try {
      const remoteData = await fetchFromVercelKV();
      if (remoteData && (remoteData.restaurants?.length || remoteData.items?.length)) {
        cachedCloudData = remoteData;
        if (!cachedCloudData.publishedMenus) {
          cachedCloudData.publishedMenus = {};
        }
        console.log('[Server] Successfully hydrated cachedCloudData from Vercel KV / Upstash');
        return cachedCloudData;
      }
    } catch (err) {
      console.warn('[Server] Notice: Vercel KV hydration skipped or failed:', err);
    }
  }

  // 2. Fallback to local disk file if remote KV is empty or unavailable
  loadCloudDataFromDisk();

  // If local disk has data but Vercel KV is empty/newly configured, seed the remote KV with local data
  if (cachedCloudData && (cachedCloudData.restaurants?.length || cachedCloudData.items?.length) && kvRestUrl && kvRestToken) {
    saveToVercelKV(cachedCloudData).then(() => {
      console.log('[Server] Initialized remote Vercel KV / Upstash with local seed data');
    }).catch(() => {});
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

    for (const [restId, snapshot] of Object.entries(publishedMenus)) {
      if (!snapshot) continue;
      const snapRest = (snapshot as any).restaurant;
      if (
        normalizeSlug(restId) === target || 
        normalizeSlug(snapRest?.id) === target || 
        normalizeSlug(snapRest?.slug) === target ||
        normalizeSlug(snapRest?.name) === target
      ) {
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

  // POST: Full save or update of cloud menu (with robust anti-erasure protection)
  app.post('/api/cloud-menu', async (req, res) => {
    const { restaurants, items, categories, users, orders } = req.body;
    if (!restaurants && !items && !categories) {
      res.status(400).json({ success: false, message: 'Faltan datos de la carta' });
      return;
    }

    await ensureCloudDataHydrated();
    const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [], publishedMenus: {} };

    // Intelligent additive merge: preserve existing entities unless explicitly deleted via DELETE endpoints
    const restMap = new Map<string, any>();
    (current.restaurants || []).forEach((r: any) => { if (r?.id) restMap.set(r.id, r); });
    (restaurants || []).forEach((r: any) => { if (r?.id) restMap.set(r.id, { ...(restMap.get(r.id) || {}), ...r }); });

    const userMap = new Map<string, any>();
    (current.users || []).forEach((u: any) => {
      const key = u?.id || (u?.dni ? `dni-${u.dni}` : null);
      if (key) userMap.set(key, u);
    });
    (users || []).forEach((u: any) => {
      const key = u?.id || (u?.dni ? `dni-${u.dni}` : null);
      if (key) userMap.set(key, { ...(userMap.get(key) || {}), ...u });
    });

    const catMap = new Map<string, any>();
    (current.categories || []).forEach((c: any) => { if (c?.id) catMap.set(c.id, c); });
    (categories || []).forEach((c: any) => { if (c?.id) catMap.set(c.id, { ...(catMap.get(c.id) || {}), ...c }); });

    const itemMap = new Map<string, any>();
    (current.items || []).forEach((i: any) => { if (i?.id) itemMap.set(i.id, i); });
    (items || []).forEach((i: any) => { if (i?.id) itemMap.set(i.id, { ...(itemMap.get(i.id) || {}), ...i }); });

    const updatedData = {
      ...current,
      restaurants: Array.from(restMap.values()),
      categories: Array.from(catMap.values()),
      items: Array.from(itemMap.values()),
      users: Array.from(userMap.values()),
      orders: orders || current.orders || [],
      publishedMenus: current.publishedMenus || {},
      updatedAt: new Date().toISOString()
    };

    const saved = saveCloudDataToDisk(updatedData);
    if (saved) {
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

  // POST: Update single menu item
  app.post('/api/cloud-menu/item', (req, res) => {
    const item = req.body;
    if (!item || !item.id) {
      res.status(400).json({ success: false, message: 'Item inválido' });
      return;
    }

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
    broadcastMenuUpdate({ type: 'ITEM_UPDATED', item, items });
    res.json({ success: true, message: `Plato "${item.name}" guardado en la nube`, item });
  });

  // DELETE: Delete menu item
  app.delete('/api/cloud-menu/item/:id', (req, res) => {
    const { id } = req.params;
    const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
    const items = (current.items || []).filter((i: any) => i.id !== id);

    const updatedData = {
      ...current,
      items,
      updatedAt: new Date().toISOString()
    };

    saveCloudDataToDisk(updatedData);
    broadcastMenuUpdate({ type: 'ITEM_DELETED', itemId: id, items });
    res.json({ success: true, message: 'Plato eliminado de la nube' });
  });

  // POST: Update single restaurant
  app.post('/api/cloud-menu/restaurant', (req, res) => {
    const restaurant = req.body;
    if (!restaurant || !restaurant.id) {
      res.status(400).json({ success: false, message: 'Restaurante inválido' });
      return;
    }

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
    broadcastMenuUpdate({ type: 'RESTAURANT_UPDATED', restaurant, restaurants });
    res.json({ success: true, message: `Restaurante "${restaurant.name}" guardado en la nube`, restaurant });
  });

  // DELETE: Delete restaurant
  app.delete('/api/cloud-menu/restaurant/:id', async (req, res) => {
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
    broadcastMenuUpdate({ type: 'FULL_SYNC', data: updatedData });
    res.json({ success: true, message: 'Restaurante eliminado permanentemente de la nube' });
  });

  // POST: Update or add category
  app.post('/api/cloud-menu/category', (req, res) => {
    const category = req.body;
    if (!category || !category.id) {
      res.status(400).json({ success: false, message: 'Categoría inválida' });
      return;
    }

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
    broadcastMenuUpdate({ type: 'CATEGORY_UPDATED', category, categories });
    res.json({ success: true, message: `Categoría "${category.name}" guardada en la nube`, category });
  });

  // DELETE: Delete category
  app.delete('/api/cloud-menu/category/:id', (req, res) => {
    const { id } = req.params;
    const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
    const categories = (current.categories || []).filter((c: any) => c.id !== id);

    const updatedData = {
      ...current,
      categories,
      updatedAt: new Date().toISOString()
    };

    saveCloudDataToDisk(updatedData);
    broadcastMenuUpdate({ type: 'CATEGORY_DELETED', categoryId: id, categories });
    res.json({ success: true, message: 'Categoría eliminada de la nube' });
  });

  // POST: Update or create user (guarantees photo and restaurant assignment persistence)
  app.post('/api/cloud-menu/user', async (req, res) => {
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
    broadcastMenuUpdate({ type: 'USER_UPDATED', user, users });
    res.json({ success: true, message: `Usuario "${user.name}" guardado permanentemente en la nube`, user });
  });

  // DELETE: Delete user
  app.delete('/api/cloud-menu/user/:id', async (req, res) => {
    const { id } = req.params;
    await ensureCloudDataHydrated();
    const current = cachedCloudData || { restaurants: [], items: [], categories: [], users: [], orders: [] };
    const users = (current.users || []).filter((u: any) => u.id !== id);

    const updatedData = {
      ...current,
      users,
      updatedAt: new Date().toISOString()
    };

    saveCloudDataToDisk(updatedData);
    broadcastMenuUpdate({ type: 'USER_DELETED', userId: id, users });
    res.json({ success: true, message: 'Usuario eliminado permanentemente de la nube' });
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
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
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
