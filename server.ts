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

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache
let cachedCloudData: any = null;

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
    return true;
  } catch (err) {
    console.error('[Server] Error saving cloud-menu.json:', err);
    return false;
  }
}

// Initialize on startup
loadCloudDataFromDisk();

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
