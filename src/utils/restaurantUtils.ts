import { Restaurant, RestaurantBranding, MenuAccessSettings } from '../types';

export function isLegacyRestaurant(r: any): boolean {
  if (!r) return true;
  const id = String(r.id || '').toLowerCase();
  const slug = String(r.slug || '').toLowerCase();
  const name = String(r.name || '').toLowerCase();
  return (
    id === 'rest-riendas-de-plata' ||
    id === 'rest-cevichito-pliz' ||
    id === 'rest-voraz' ||
    id === 'rest-1' ||
    id === 'rest-2' ||
    id === 'rest-3' ||
    id === 'rest-fallback' ||
    slug === 'riendas-de-plata' ||
    slug === 'cevichito-pliz' ||
    slug === 'voraz' ||
    name.includes('riendas de plata') ||
    name.includes('cevichito pliz') ||
    name.includes('fuego voraz') ||
    name.includes('voraz')
  );
}

export function sanitizeRestaurantsList(list: any[]): Restaurant[] {
  if (!Array.isArray(list)) return [];
  return list.filter(r => r && r.id && !isLegacyRestaurant(r));
}

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
 * Returns signature default branding palette and typography for a template ID
 */
export function getTemplateDefaultBranding(templateId?: string): RestaurantBranding {
  const tmpl = templateId || 'tmpl-luxury';
  if (tmpl === 'tmpl-medio-plato' || tmpl.includes('medio')) {
    return {
      primaryColor: '#000000',
      secondaryColor: '#D97757',
      accentColor: '#D97757',
      darkBgColor: '#E6E8DF',
      cardBgColor: '#E6E8DF',
      dishCardBgColor: 'transparent',
      textColor: '#1A1A1A',
      buttonColor: '#D97757',
      buttonTextColor: '#FFFFFF',
      fontDisplay: "'Playfair Display', serif",
      dishNameFont: "'Playfair Display', serif",
      dishDescFont: "'Plus Jakarta Sans', sans-serif",
      dishPriceFont: "'Playfair Display', serif",
      restaurantNameFont: "'Playfair Display', serif",
      restaurantNameColor: '#1A1A1A',
      cardBorderRadius: '12px',
      cardStyle: 'horizontal',
      headerStyle: 'centered'
    };
  }
  if (tmpl === 'tmpl-marine' || tmpl.includes('marine') || tmpl.includes('costa') || tmpl.includes('cevichito')) {
    return {
      primaryColor: '#18181B',
      secondaryColor: '#0284C7',
      accentColor: '#0284C7',
      darkBgColor: '#09090B',
      cardBgColor: '#FFFFFF',
      dishCardBgColor: '#FFFFFF',
      textColor: '#18181B',
      buttonColor: '#18181B',
      buttonTextColor: '#FFFFFF',
      fontDisplay: 'Outfit, sans-serif',
      dishNameFont: 'Outfit, sans-serif',
      dishDescFont: 'Outfit, sans-serif',
      dishPriceFont: 'Outfit, monospace',
      restaurantNameFont: 'Outfit, sans-serif',
      restaurantNameColor: '#18181B',
      cardBorderRadius: '16px',
      cardStyle: 'horizontal',
      headerStyle: 'banner'
    };
  }
  if (tmpl === 'tmpl-criollo' || tmpl.includes('criollo') || tmpl.includes('chalkboard')) {
    return {
      primaryColor: '#000000',
      secondaryColor: '#D97757',
      accentColor: '#D97757',
      darkBgColor: '#18181B',
      cardBgColor: '#27272A',
      dishCardBgColor: '#27272A',
      textColor: '#FAFAFA',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#000000',
      fontDisplay: 'Plus Jakarta Sans, sans-serif',
      dishNameFont: 'Plus Jakarta Sans, sans-serif',
      dishDescFont: 'Plus Jakarta Sans, sans-serif',
      dishPriceFont: 'monospace',
      restaurantNameFont: 'Plus Jakarta Sans, sans-serif',
      restaurantNameColor: '#FFFFFF',
      cardBorderRadius: '8px',
      cardStyle: 'horizontal',
      headerStyle: 'centered'
    };
  }
  if (tmpl === 'tmpl-neon' || tmpl.includes('neon') || tmpl.includes('street')) {
    return {
      primaryColor: '#000000',
      secondaryColor: '#EF4444',
      accentColor: '#EF4444',
      darkBgColor: '#09090B',
      cardBgColor: '#18181B',
      dishCardBgColor: '#18181B',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#000000',
      fontDisplay: 'Syne, sans-serif',
      dishNameFont: 'Syne, sans-serif',
      dishDescFont: 'Syne, sans-serif',
      dishPriceFont: 'monospace',
      restaurantNameFont: 'Syne, sans-serif',
      restaurantNameColor: '#FFFFFF',
      cardBorderRadius: '20px',
      cardStyle: 'grid',
      headerStyle: 'split'
    };
  }
  if (tmpl === 'tmpl-minimalist' || tmpl.includes('minimal')) {
    return {
      primaryColor: '#FFFFFF',
      secondaryColor: '#E5E5E5',
      accentColor: '#FFFFFF',
      darkBgColor: '#000000',
      cardBgColor: '#0A0A0A',
      dishCardBgColor: '#0A0A0A',
      textColor: '#E5E5E5',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#000000',
      fontDisplay: 'Plus Jakarta Sans, sans-serif',
      dishNameFont: 'Plus Jakarta Sans, sans-serif',
      dishDescFont: 'Plus Jakarta Sans, sans-serif',
      dishPriceFont: 'monospace',
      restaurantNameFont: 'Plus Jakarta Sans, sans-serif',
      restaurantNameColor: '#FFFFFF',
      cardBorderRadius: '0px',
      cardStyle: 'compact',
      headerStyle: 'minimal'
    };
  }
  if (tmpl === 'tmpl-starters-editorial' || tmpl === 'tmpl-editorial' || tmpl.includes('editorial') || tmpl.includes('starters')) {
    return {
      primaryColor: '#000000',
      secondaryColor: '#D4AF37',
      accentColor: '#D4AF37',
      darkBgColor: '#071A14',
      cardBgColor: '#FFFFFF',
      dishCardBgColor: '#FFFFFF',
      textColor: '#1A1A1A',
      buttonColor: '#1A1A1A',
      buttonTextColor: '#FFFFFF',
      fontDisplay: "'Playfair Display', serif",
      dishNameFont: "'Playfair Display', serif",
      dishDescFont: "'Plus Jakarta Sans', sans-serif",
      dishPriceFont: "'Playfair Display', serif",
      restaurantNameFont: "'Playfair Display', serif",
      restaurantNameColor: '#FFFFFF',
      cardBorderRadius: '4px',
      cardStyle: 'horizontal',
      headerStyle: 'centered'
    };
  }
  // Default: Brasas Luxury Gold & Emerald (tmpl-luxury)
  return {
    primaryColor: '#000000',
    secondaryColor: '#D4AF37',
    accentColor: '#D4AF37',
    darkBgColor: '#0F172A',
    cardBgColor: '#1E293B',
    dishCardBgColor: '#1E293B',
    textColor: '#FFFFFF',
    buttonColor: '#D4AF37',
    buttonTextColor: '#000000',
    fontDisplay: 'Cinzel, serif',
    dishNameFont: 'Cinzel, serif',
    dishDescFont: 'Plus Jakarta Sans, sans-serif',
    dishPriceFont: 'monospace',
    restaurantNameFont: 'Cinzel, serif',
    restaurantNameColor: '#D4AF37',
    cardBorderRadius: '12px',
    cardStyle: 'grid',
    headerStyle: 'banner'
  };
}

/**
 * Safely gets branding settings with full default fallbacks based on template
 */
export function getSafeBranding(restaurant?: Restaurant | null): RestaurantBranding {
  const tmplDefaults = getTemplateDefaultBranding(restaurant?.templateId);
  if (!restaurant || !restaurant.branding) {
    return tmplDefaults;
  }
  return {
    ...tmplDefaults,
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
