import { Restaurant, MenuCategory, MenuItem } from '../types';

/**
 * Sanitizes restaurant data for JSON export by removing owner information.
 * Only menu content, branding, schedule, tables, and settings are preserved.
 */
function sanitizeRestaurantForExport(restaurant: Restaurant): Omit<Restaurant, 'ownerId'> {
  // Destructure and omit ownerId
  const { ownerId, ...cleanRestaurant } = restaurant;
  return cleanRestaurant;
}

export interface RestaurantExportPackage {
  version: '1.0';
  exportedAt: string;
  scope: 'RESTAURANT_MENU_ONLY';
  restaurant: Omit<Restaurant, 'ownerId'>;
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface FullSystemExportPackage {
  version: '1.0';
  exportedAt: string;
  scope: 'ALL_RESTAURANTS_MENUS_ONLY';
  restaurants: Omit<Restaurant, 'ownerId'>[];
  categories: MenuCategory[];
  items: MenuItem[];
}

/**
 * Downloads a single restaurant with all its categories and menu items as a JSON file to local disk.
 * Strictly excludes owner information and user credentials.
 */
export function downloadRestaurantJSON(
  restaurant: Restaurant,
  categories: MenuCategory[],
  items: MenuItem[]
) {
  const restCategories = categories.filter(c => c.restaurantId === restaurant.id);
  const restItems = items.filter(i => i.restaurantId === restaurant.id);

  const exportData: RestaurantExportPackage = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    scope: 'RESTAURANT_MENU_ONLY',
    restaurant: sanitizeRestaurantForExport(restaurant),
    categories: restCategories,
    items: restItems,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanName = (restaurant.slug || restaurant.name || 'restaurante')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `carta_${cleanName}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads all restaurants and menus as a single backup JSON file to local disk.
 * Strictly excludes owner information and user credentials.
 */
export function downloadFullSystemJSON(
  restaurants: Restaurant[],
  categories: MenuCategory[],
  items: MenuItem[]
) {
  const cleanRestaurants = restaurants.map(r => sanitizeRestaurantForExport(r));

  const exportData: FullSystemExportPackage = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    scope: 'ALL_RESTAURANTS_MENUS_ONLY',
    restaurants: cleanRestaurants,
    categories,
    items,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `cartas_backup_completo_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates a downloaded JSON file for importing.
 * Strictly ignores any owner or user data to protect owner accounts.
 */
export function parseImportedJSON(jsonText: string): {
  type: 'SINGLE' | 'FULL';
  restaurants: Restaurant[];
  categories: MenuCategory[];
  items: MenuItem[];
} {
  const parsed = JSON.parse(jsonText);

  if (parsed.restaurant && Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
    // Omit any owner fields if present in legacy files
    const { ownerId, ...cleanRest } = parsed.restaurant;
    return {
      type: 'SINGLE',
      restaurants: [cleanRest as Restaurant],
      categories: parsed.categories,
      items: parsed.items,
    };
  }

  if (Array.isArray(parsed.restaurants) && Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
    const cleanRestaurants = parsed.restaurants.map((r: any) => {
      const { ownerId, ...cleanRest } = r;
      return cleanRest as Restaurant;
    });

    return {
      type: 'FULL',
      restaurants: cleanRestaurants,
      categories: parsed.categories,
      items: parsed.items,
    };
  }

  throw new Error('El archivo JSON no tiene un formato válido de carta de restaurante MiCarta.');
}
