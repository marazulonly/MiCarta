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

function loadCloudDataFromDisk() {
  try {
    if (fs.existsSync(CLOUD_STORAGE_FILE)) {
      const raw = fs.readFileSync(CLOUD_STORAGE_FILE, 'utf-8');
      cachedCloudData = JSON.parse(raw);
      return cachedCloudData;
    }
  } catch (err) {
    console.warn('[Server] Error reading cloud-menu.json:', err);
  }
  return null;
}

function saveCloudDataToDisk(data: any) {
  try {
    cachedCloudData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CLOUD_STORAGE_FILE, JSON.stringify(cachedCloudData, null, 2), 'utf-8');
    
    // Asynchronously push to Vercel KV if configured
    if (kvRestUrl && kvRestToken) {
      saveToVercelKV(cachedCloudData).catch(err => {
        console.warn('[Server] Background Vercel KV sync error:', err);
      });
    }

    return true;
  } catch (err) {
    console.error('[Server] Error saving cloud-menu.json:', err);
    return false;
  }
}

// Initialize on startup & query Vercel KV if available
loadCloudDataFromDisk();
if (kvRestUrl && kvRestToken) {
  fetchFromVercelKV().then(remoteData => {
    if (remoteData && (remoteData.restaurants?.length || remoteData.items?.length)) {
      cachedCloudData = remoteData;
      saveCloudDataToDisk(remoteData);
      console.log('[Server] Successfully hydrated cache from Vercel KV / Upstash');
    } else if (cachedCloudData && (cachedCloudData.restaurants?.length || cachedCloudData.items?.length)) {
      saveToVercelKV(cachedCloudData).then(() => {
        console.log('[Server] Initialized Upstash with local menu data snapshot');
      }).catch(err => {
        console.warn('[Server] Error pushing initial snapshot to Upstash:', err);
      });
    }
  }).catch(() => {});
}

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
  app.get('/api/cloud-menu', (req, res) => {
    if (!cachedCloudData) {
      loadCloudDataFromDisk();
    }
    res.json({
      success: true,
      data: cachedCloudData,
      timestamp: cachedCloudData?.updatedAt || new Date().toISOString()
    });
  });

  // POST: Full save or update of cloud menu
  app.post('/api/cloud-menu', (req, res) => {
    const { restaurants, items, categories, users, orders } = req.body;
    if (!restaurants && !items && !categories) {
      res.status(400).json({ success: false, message: 'Faltan datos de la carta' });
      return;
    }

    const current = cachedCloudData || {};
    const updatedData = {
      restaurants: restaurants || current.restaurants || [],
      items: items || current.items || [],
      categories: categories || current.categories || [],
      users: users || current.users || [],
      orders: orders || current.orders || [],
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
