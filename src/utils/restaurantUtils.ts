import { Restaurant, RestaurantBranding, MenuAccessSettings } from '../types';

export const DEFAULT_BRANDING: RestaurantBranding = {
  primaryColor: '#1E1F24',
  secondaryColor: '#3F3F46',
  accentColor: '#000000',
  darkBgColor: '#09090B',
  cardBgColor: '#18181B',
  textColor: '#FFFFFF',
  fontDisplay: 'Inter',
  dishNameFont: 'inherit',
  dishDescFont: 'inherit',
  dishPriceFont: 'monospace',
  restaurantNameFont: 'inherit',
  restaurantNameColor: '#FFFFFF',
  dishCardBgColor: '#18181B',
  dishCardBorderColor: '#27272A',
  cardBorderRadius: '16px',
  cardStyle: 'grid',
  headerStyle: 'banner'
};

export const DEFAULT_MENU_ACCESS_SETTINGS: MenuAccessSettings = {
  menuMode: 'SAME',
  enableDineIn: true,
  enableDelivery: true,
  presentialTitle: 'Carta Salón (Presencial)',
  deliveryTitle: 'Carta Delivery (A Domicilio)',
  deliveryMinOrder: 20,
  deliveryEstimatedMinutes: 35
};

export const DEFAULT_FALLBACK_RESTAURANT: Restaurant = {
  id: 'rest-fallback',
  name: 'Mi Restaurante',
  tagline: 'Sede Principal',
  cuisineType: 'VARIADA',
  slug: 'mi-restaurante',
  address: 'Calle Principal 123',
  phone: '900000000',
  rating: 5.0,
  reviewCount: 1,
  logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300',
  coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000',
  branding: DEFAULT_BRANDING,
  metrics: {
    dailyRevenue: 0,
    activeOrders: 0,
    avgTicket: 0,
    customerRating: 5.0,
    totalTables: 10,
    occupancyRate: 0
  },
  isOpen: true,
  ownerId: '',
  tables: [],
  shifts: [],
  weeklySchedule: [],
  menuAccessSettings: DEFAULT_MENU_ACCESS_SETTINGS
};

/**
 * Generates a URL-friendly slug from a restaurant name
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/**
 * Safely resolves the active restaurant from an array, returning null if empty or not found.
 */
export function getSafeActiveRestaurant(
  restaurants: Restaurant[] | null | undefined,
  selectedId?: string | null
): Restaurant | null {
  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    return null;
  }
  const validList = restaurants.filter((r): r is Restaurant => Boolean(r && r.id));
  if (validList.length === 0) {
    return null;
  }
  if (selectedId) {
    const matched = validList.find(r => r.id === selectedId);
    if (matched) return matched;
  }
  return validList[0] || null;
}

/**
 * Safely gets branding settings with full default fallbacks
 */
export function getSafeBranding(restaurant?: Restaurant | null): RestaurantBranding {
  if (!restaurant || !restaurant.branding) {
    return DEFAULT_BRANDING;
  }
  return {
    ...DEFAULT_BRANDING,
    ...restaurant.branding
  };
}

/**
 * Safely gets menu access settings with full default fallbacks
 */
export function getSafeMenuAccessSettings(restaurant?: Restaurant | null): MenuAccessSettings {
  if (!restaurant || !restaurant.menuAccessSettings) {
    return DEFAULT_MENU_ACCESS_SETTINGS;
  }
  return {
    ...DEFAULT_MENU_ACCESS_SETTINGS,
    ...restaurant.menuAccessSettings
  };
}
