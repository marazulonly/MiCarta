import { Restaurant, MenuCategory, MenuItem, User } from '../types';

export interface RestaurantExportPackage {
  version: '1.0';
  exportedAt: string;
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface FullSystemExportPackage {
  version: '1.0';
  exportedAt: string;
  restaurants: Restaurant[];
  categories: MenuCategory[];
  items: MenuItem[];
  users?: User[];
}

/**
 * Downloads a single restaurant with all its categories and menu items as a JSON file to local disk
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
    restaurant,
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
  link.setAttribute('download', `micarta_${cleanName}_backup.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads all restaurants and system data as a single backup JSON file to local disk
 */
export function downloadFullSystemJSON(
  restaurants: Restaurant[],
  categories: MenuCategory[],
  items: MenuItem[],
  users?: User[]
) {
  const exportData: FullSystemExportPackage = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    restaurants,
    categories,
    items,
    users,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `micarta_backup_completo_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates a downloaded JSON file for importing
 */
export function parseImportedJSON(jsonText: string): {
  type: 'SINGLE' | 'FULL';
  restaurants: Restaurant[];
  categories: MenuCategory[];
  items: MenuItem[];
  users?: User[];
} {
  const parsed = JSON.parse(jsonText);

  if (parsed.restaurant && Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
    return {
      type: 'SINGLE',
      restaurants: [parsed.restaurant],
      categories: parsed.categories,
      items: parsed.items,
    };
  }

  if (Array.isArray(parsed.restaurants) && Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
    return {
      type: 'FULL',
      restaurants: parsed.restaurants,
      categories: parsed.categories,
      items: parsed.items,
      users: parsed.users,
    };
  }

  throw new Error('El archivo JSON no tiene un formato válido de backup de MiCarta.');
}
