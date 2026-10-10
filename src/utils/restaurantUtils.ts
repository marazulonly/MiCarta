import { Restaurant, RestaurantBranding, MenuAccessSettings } from '../types';

export function isLegacyRestaurant(_r: any): boolean {
  // Never treat any restaurant as legacy or delete/filter it out.
  return false;
}

export function sanitizeRestaurantsList(list: any[]): Restaurant[] {
  if (!Array.isArray(list)) return [];
  return list.filter(r => r && r.id);
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
    const matched = validList.find(
      r => r.id === selectedId || r.slug === selectedId || generateSlug(r.slug || r.name || r.id) === generateSlug(selectedId)
    );
    if (matched) return matched;
  }
  return validList[0] || null;
}

/**
 * Consistently checks if a category or menu item's restaurantId belongs to the given restaurant
 * across ID, slug, or normalized slug without losing references.
 */
export function matchesRestaurantRef(
  itemOrCatRestaurantId: string | undefined | null,
  restaurant: Pick<Restaurant, 'id' | 'slug' | 'name'> | undefined | null
): boolean {
  if (!itemOrCatRestaurantId || !restaurant) return false;
  if (itemOrCatRestaurantId === restaurant.id) return true;
  if (restaurant.slug && itemOrCatRestaurantId === restaurant.slug) return true;
  const normRef = generateSlug(itemOrCatRestaurantId);
  if (!normRef) return false;
  if (restaurant.id && generateSlug(restaurant.id) === normRef) return true;
  if (restaurant.slug && generateSlug(restaurant.slug) === normRef) return true;
  if (restaurant.name && generateSlug(restaurant.name) === normRef) return true;
  return false;
}

/**
 * Returns signature default branding palette and typography for a template ID
 */
export function getTemplateDefaultBranding(templateId?: string): RestaurantBranding {
  const tmpl = templateId || 'tmpl-luxury';
  if (tmpl === 'tmpl-medio-plato' || tmpl.includes('medio')) {
    return {
      primaryColor: '#D97757',
      secondaryColor: '#D97757',
      accentColor: '#D97757',
      darkBgColor: '#E6E8DF',
      backgroundColor: '#E6E8DF',
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
  if (tmpl === 'tmpl-marine' || tmpl === 'tmpl-costa-marina' || tmpl === 'tmpl-modern-seafood' || tmpl.includes('marine') || tmpl.includes('costa') || tmpl.includes('cevichito') || tmpl.includes('seafood')) {
    return {
      primaryColor: '#111111',
      secondaryColor: '#71717A',
      accentColor: '#111111',
      darkBgColor: '#EAEBDC',
      backgroundColor: '#EAEBDC',
      cardBgColor: '#FFFFFF',
      dishCardBgColor: '#FFFFFF',
      textColor: '#111111',
      buttonColor: '#111111',
      buttonTextColor: '#FFFFFF',
      fontDisplay: 'Outfit, sans-serif',
      dishNameFont: 'Outfit, sans-serif',
      dishDescFont: 'Outfit, sans-serif',
      dishPriceFont: 'Outfit, monospace',
      restaurantNameFont: 'Outfit, sans-serif',
      restaurantNameColor: '#111111',
      cardBorderRadius: '16px',
      cardStyle: 'horizontal',
      headerStyle: 'banner'
    };
  }
  if (tmpl === 'tmpl-criollo' || tmpl === 'tmpl-fire-grill' || tmpl.includes('criollo') || tmpl.includes('chalkboard') || tmpl.includes('grill') || tmpl.includes('fuego')) {
    return {
      primaryColor: '#F59E0B',
      secondaryColor: '#D97757',
      accentColor: '#F59E0B',
      darkBgColor: '#141716',
      backgroundColor: '#141716',
      cardBgColor: '#27272A',
      dishCardBgColor: '#27272A',
      textColor: '#FAFAFA',
      buttonColor: '#F59E0B',
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
      primaryColor: '#EF4444',
      secondaryColor: '#EF4444',
      accentColor: '#EF4444',
      darkBgColor: '#09090B',
      backgroundColor: '#09090B',
      cardBgColor: '#18181B',
      dishCardBgColor: '#18181B',
      textColor: '#FFFFFF',
      buttonColor: '#EF4444',
      buttonTextColor: '#FFFFFF',
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
      darkBgColor: '#0A0A0A',
      backgroundColor: '#0A0A0A',
      cardBgColor: '#121212',
      dishCardBgColor: '#121212',
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
      primaryColor: '#D4AF37',
      secondaryColor: '#D4AF37',
      accentColor: '#D4AF37',
      darkBgColor: '#071A14',
      backgroundColor: '#071A14',
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
    primaryColor: '#D4AF37',
    secondaryColor: '#D4AF37',
    accentColor: '#D4AF37',
    darkBgColor: '#051813',
    backgroundColor: '#051813',
    cardBgColor: '#0A2720',
    dishCardBgColor: '#0A2720',
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
 * Canonical branding normalization: establishes a single source of truth across
 * equivalent properties (primaryColor, buttonColor, accentColor, darkBgColor, dishCardBgColor, etc.),
 * ensuring that custom colors are NEVER discarded when changing templates or saving.
 */
export function normalizeBranding(
  rawBranding?: Partial<RestaurantBranding> | null,
  templateId?: string
): RestaurantBranding {
  const tmplDefaults = getTemplateDefaultBranding(templateId);
  if (!rawBranding) {
    return tmplDefaults;
  }

  // Canonical mapping of user intentions across equivalent keys:
  // Brand color intent (buttonColor, accentColor, primaryColor)
  const brandAccentIntent = 
    rawBranding.buttonColor || 
    rawBranding.accentColor || 
    rawBranding.primaryColor;

  // Background intent (darkBgColor, backgroundColor)
  const bgIntent = 
    rawBranding.darkBgColor || 
    rawBranding.backgroundColor;

  // Dish Card / Card Background intent (dishCardBgColor, cardBgColor)
  const cardBgIntent = 
    rawBranding.dishCardBgColor || 
    rawBranding.cardBgColor;

  // Secondary color intent
  const secondaryIntent = 
    rawBranding.secondaryColor || 
    rawBranding.accentColor || 
    brandAccentIntent;

  // Text color intent
  const textIntent = rawBranding.textColor;

  // Resolve canonical properties prioritizing user's customized values
  const primaryColor = brandAccentIntent || tmplDefaults.primaryColor;
  const buttonColor = rawBranding.buttonColor || brandAccentIntent || tmplDefaults.buttonColor || primaryColor;
  const accentColor = rawBranding.accentColor || brandAccentIntent || tmplDefaults.accentColor || buttonColor;
  const secondaryColor = rawBranding.secondaryColor || secondaryIntent || tmplDefaults.secondaryColor;
  
  const darkBgColor = bgIntent || tmplDefaults.darkBgColor;
  const backgroundColor = bgIntent || tmplDefaults.backgroundColor || darkBgColor;

  const cardBgColor = cardBgIntent || tmplDefaults.cardBgColor;
  const dishCardBgColor = cardBgIntent || tmplDefaults.dishCardBgColor || cardBgColor;
  const dishCardBorderColor = rawBranding.dishCardBorderColor || (buttonColor ? `${buttonColor}40` : tmplDefaults.dishCardBorderColor);

  const textColor = textIntent || tmplDefaults.textColor;
  const restaurantNameColor = rawBranding.restaurantNameColor || textIntent || tmplDefaults.restaurantNameColor;
  const buttonTextColor = rawBranding.buttonTextColor || tmplDefaults.buttonTextColor || '#FFFFFF';
  const priceColor = rawBranding.priceColor || buttonColor || accentColor || tmplDefaults.priceColor;

  return {
    ...tmplDefaults,
    ...rawBranding,
    primaryColor,
    buttonColor,
    accentColor,
    secondaryColor,
    darkBgColor,
    backgroundColor,
    cardBgColor,
    dishCardBgColor,
    dishCardBorderColor,
    textColor,
    restaurantNameColor,
    buttonTextColor,
    priceColor,
    headerLogoUrl: rawBranding.headerLogoUrl !== undefined ? rawBranding.headerLogoUrl : (tmplDefaults.headerLogoUrl || ''),
    cardBorderRadius: rawBranding.cardBorderRadius || tmplDefaults.cardBorderRadius,
    cardStyle: rawBranding.cardStyle || tmplDefaults.cardStyle,
    headerStyle: rawBranding.headerStyle || tmplDefaults.headerStyle,
    fontDisplay: rawBranding.fontDisplay || tmplDefaults.fontDisplay,
    dishNameFont: rawBranding.dishNameFont || tmplDefaults.dishNameFont,
    dishDescFont: rawBranding.dishDescFont || tmplDefaults.dishDescFont,
    dishPriceFont: rawBranding.dishPriceFont || tmplDefaults.dishPriceFont,
    restaurantNameFont: rawBranding.restaurantNameFont || tmplDefaults.restaurantNameFont
  };
}

/**
 * Safely gets branding settings with canonical normalization and template fallbacks
 */
export function getSafeBranding(restaurant?: Restaurant | null): RestaurantBranding {
  const norm = normalizeBranding(restaurant?.branding, restaurant?.templateId);
  const logo = restaurant?.branding?.headerLogoUrl || restaurant?.logoUrl || '';
  if (logo && !norm.headerLogoUrl) {
    norm.headerLogoUrl = logo;
  }
  return norm;
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
