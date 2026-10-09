import { CanvasElement, CanvasConfig, SnapGuide } from './types';
import { Restaurant, RestaurantBranding, MenuItem, MenuCategory } from '../../types';
import { normalizeBranding } from '../../utils/restaurantUtils';

export const DEFAULT_CANVAS_WIDTH = 800;
export const DEFAULT_CANVAS_HEIGHT = 1500;

/**
 * Creates an initially blank/empty Canvas composition with just the background.
 */
export function createBlankCanvas(): { elements: CanvasElement[]; config: CanvasConfig } {
  const config: CanvasConfig = {
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    backgroundColor: '#FFFFFF',
    showGrid: true,
    gridSize: 20,
    showSnapGuides: true,
    showSafetyMargins: false,
    safetyMarginPadding: 40
  };

  const elements: CanvasElement[] = [
    {
      id: 'elem-bg-base',
      name: 'Fondo del Lienzo',
      type: 'background',
      x: 0,
      y: 0,
      width: DEFAULT_CANVAS_WIDTH,
      height: DEFAULT_CANVAS_HEIGHT,
      zIndex: 0,
      visible: true,
      locked: true,
      backgroundColor: '#FFFFFF',
      borderWidth: 0
    }
  ];

  return { elements, config };
}

/**
 * 1:1 VISUAL IMPORT ADAPTER (Source of Truth)
 * Converts any existing restaurant menu into an exact editable Canvas composition,
 * faithfully reproducing its real template engine, real colors, positions,
 * logos, category pills, product cards, typography, and layout structure.
 */
export function importCardToEditorModel(
  restaurant?: Restaurant,
  branding?: RestaurantBranding,
  sampleItem?: MenuItem,
  allItems: MenuItem[] = [],
  allCategories: MenuCategory[] = []
): { elements: CanvasElement[]; config: CanvasConfig } {
  const b = branding || restaurant?.branding || ({} as RestaurantBranding);
  const restId = restaurant?.id || '';

  // 1. If the restaurant already has custom-designed canvas elements saved, load them directly
  if (b.canvasElements && Array.isArray(b.canvasElements) && b.canvasElements.length > 0) {
    const canvasWidth = b.canvasConfig?.width || DEFAULT_CANVAS_WIDTH;
    const canvasHeight = b.canvasConfig?.height || DEFAULT_CANVAS_HEIGHT;
    const config: CanvasConfig = {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: b.canvasConfig?.backgroundColor || b.darkBgColor || '#0B0F17',
      backgroundImage: b.canvasConfig?.backgroundImage,
      showGrid: false,
      gridSize: 20,
      showSnapGuides: true,
      showSafetyMargins: false,
      safetyMarginPadding: 40
    };
    const validated = b.canvasElements.map((el, idx) => sanitizeCanvasElement(el, idx));
    return { elements: validated, config };
  }

  // 2. Resolve items & categories for this restaurant
  const restItems = allItems.filter(i => i && i.restaurantId === restId);
  const restCategories = allCategories.filter(c => c && c.restaurantId === restId);

  const item1: MenuItem = restItems[0] || sampleItem || {
    id: 'sample-1',
    restaurantId: restId,
    categoryId: 'cat-1',
    name: 'Causa Acevichada',
    description: 'Papa amarilla con atún acevichado, palta y tomate fresco.',
    price: 26.00,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 20,
    allergens: [],
    tags: ['Especialidad']
  };

  const item2: MenuItem = restItems[1] || {
    id: 'sample-2',
    restaurantId: restId,
    categoryId: 'cat-1',
    name: 'Hamburguesa de la Casa',
    description: 'Carne artesanal a la parrilla con queso fundido y vegetales.',
    price: 28.00,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 15,
    allergens: [],
    tags: ['Parrilla']
  };

  const cat1Name = restCategories[0]?.name || 'De la Casa';
  const cat2Name = restCategories[1]?.name || 'Especialidades';

  // 3. Detect Template Family
  const tmplId = restaurant?.templateId || '';
  const isMarine = tmplId === 'tmpl-marine' || 
    (!restaurant?.templateId && (
      restaurant?.id === 'rest-costa' || 
      restaurant?.slug === 'costa-marina' || 
      restaurant?.slug === 'cevichito-pliz' || 
      restaurant?.slug === 'voraz' || 
      restaurant?.name?.toLowerCase().includes('costa') || 
      restaurant?.name?.toLowerCase().includes('cevichito') || 
      restaurant?.name?.toLowerCase().includes('voraz') ||
      restaurant?.cuisineType?.toLowerCase().includes('mariscos') ||
      restaurant?.cuisineType?.toLowerCase().includes('pescados') ||
      restaurant?.cuisineType?.toLowerCase().includes('cevich')
    ));

  const isMedioPlato = tmplId === 'tmpl-medio-plato' || tmplId.includes('medio');
  const isCriollo = tmplId === 'tmpl-criollo' || restaurant?.slug === 'criollo-tradicion' || restaurant?.name?.toLowerCase().includes('criollo');
  const isNeon = tmplId === 'tmpl-neon' || tmplId.includes('neon') || tmplId.includes('street');
  const isMinimal = tmplId === 'tmpl-minimalist' || tmplId.includes('minimal');

  const canvasWidth = DEFAULT_CANVAS_WIDTH;
  let canvasHeight = 1500;

  // Visual Branding Variables
  const darkBgColor = b.darkBgColor || b.backgroundColor || (isMarine ? '#5c1626' : isCriollo ? '#18181B' : '#071A14');
  const cardBgColor = b.dishCardBgColor || b.cardBgColor || (isMarine ? '#DF9636' : isCriollo ? '#27272A' : '#141E2E');
  const buttonColor = b.buttonColor || b.accentColor || (isMarine ? '#111111' : '#D4AF37');
  const buttonTextColor = b.buttonTextColor || '#FFFFFF';
  const textColor = b.textColor || (isMarine ? '#111111' : '#FFFFFF');
  const secondaryColor = b.secondaryColor || (isMarine ? '#38BDF8' : '#D4AF37');
  const priceColor = b.priceColor || buttonColor;
  const logoUrl = b.headerLogoUrl || restaurant?.logoUrl || '';

  const fontDisplay = b.fontDisplay || (isMarine ? "'Plus Jakarta Sans', sans-serif" : "'Cinzel', serif");
  const restaurantNameFont = b.restaurantNameFont || fontDisplay;
  const restaurantNameColor = b.restaurantNameColor || '#FFFFFF';
  const dishNameFont = b.dishNameFont || fontDisplay;
  const dishDescFont = b.dishDescFont || "'Inter', sans-serif";
  const dishPriceFont = b.dishPriceFont || "'Roboto Mono', monospace";

  const config: CanvasConfig = {
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: darkBgColor,
    showGrid: false,
    gridSize: 20,
    showSnapGuides: true,
    showSafetyMargins: false,
    safetyMarginPadding: 40
  };

  const elements: CanvasElement[] = [];

  // =========================================================================
  // CASE 1: COSTA MARINA / MARINE / VORAZ TEMPLATE
  // =========================================================================
  if (isMarine) {
    canvasHeight = 1480;
    config.height = canvasHeight;

    // 1. Background
    elements.push({
      id: 'elem-bg-base',
      name: 'Fondo de la Carta (Vino/Oscuro)',
      type: 'background',
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      zIndex: 0,
      visible: true,
      locked: true,
      backgroundColor: darkBgColor,
      borderWidth: 0
    });

    // 2. Top Bar
    elements.push({
      id: 'elem-top-bar',
      name: 'Barra Superior de Carta',
      type: 'shape_rect',
      x: 0,
      y: 0,
      width: canvasWidth,
      height: 44,
      zIndex: 1,
      visible: true,
      locked: false,
      backgroundColor: 'rgba(0,0,0,0.3)',
      text: `${(restaurant?.name || 'VORAZ').toUpperCase()} • CARTA DIGITAL`,
      fontSize: 12,
      fontWeight: 700,
      textColor: '#FFFFFFE0',
      textAlign: 'left',
      letterSpacing: 1
    });

    // 3. List view checkbox pill
    elements.push({
      id: 'elem-view-toggle',
      name: 'Badge Vista Lista',
      type: 'shape_rect',
      x: 260,
      y: 60,
      width: 280,
      height: 38,
      zIndex: 2,
      visible: true,
      locked: false,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.15)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      text: '☑ Vista Lista (2 líneas sin foto)',
      fontSize: 12,
      fontWeight: 700,
      textColor: '#111111',
      textAlign: 'center'
    });

    // 4. Centered Restaurant Logo
    elements.push({
      id: 'elem-rest-logo',
      name: 'Logotipo de Marca',
      type: 'restaurant_logo',
      x: 260,
      y: 110,
      width: 280,
      height: 160,
      zIndex: 2,
      visible: true,
      locked: false,
      backgroundImage: logoUrl || undefined,
      objectFit: 'contain',
      isDynamic: true,
      dynamicField: 'restaurant_logo'
    });

    // 5. Subtitle Badge
    elements.push({
      id: 'elem-subtitle-badge',
      name: 'Subtítulo Especialidad',
      type: 'text_custom',
      x: 150,
      y: 280,
      width: 500,
      height: 24,
      zIndex: 2,
      visible: true,
      locked: false,
      text: 'CEVICHERÍA & COCINA MARINA',
      fontSize: 12,
      fontWeight: 800,
      fontFamily: "'Roboto Mono', monospace",
      textColor: secondaryColor,
      textAlign: 'center',
      letterSpacing: 2.5
    });

    // 6. Restaurant Name
    elements.push({
      id: 'elem-rest-name',
      name: 'Nombre del Restaurante',
      type: 'restaurant_name',
      x: 100,
      y: 308,
      width: 600,
      height: 48,
      zIndex: 2,
      visible: true,
      locked: false,
      text: restaurant?.name || 'Voraz',
      fontSize: 34,
      fontWeight: 900,
      fontFamily: restaurantNameFont,
      textColor: restaurantNameColor,
      textAlign: 'center',
      isDynamic: true,
      dynamicField: 'restaurant_name'
    });

    // 7. Restaurant Tagline
    elements.push({
      id: 'elem-rest-tagline',
      name: 'Slogan / Tagline',
      type: 'restaurant_tagline',
      x: 150,
      y: 358,
      width: 500,
      height: 24,
      zIndex: 2,
      visible: true,
      locked: false,
      text: restaurant?.tagline || 'Nuestra Cocina',
      fontSize: 14,
      fontWeight: 600,
      fontFamily: dishDescFont,
      textColor: '#FFFFFFE0',
      textAlign: 'center',
      isDynamic: true,
      dynamicField: 'restaurant_tagline'
    });

    // 8. Category Navigation Pills
    elements.push({
      id: 'elem-cat-pill-1',
      name: `Categoría: ${cat1Name}`,
      type: 'category_pill',
      x: 240,
      y: 398,
      width: 150,
      height: 38,
      zIndex: 2,
      visible: true,
      locked: false,
      backgroundColor: buttonColor === '#111111' ? '#DF9636' : buttonColor,
      textColor: '#111111',
      borderRadius: 19,
      text: cat1Name,
      fontSize: 13,
      fontWeight: 800,
      textAlign: 'center'
    });

    elements.push({
      id: 'elem-cat-pill-2',
      name: `Categoría: ${cat2Name}`,
      type: 'category_pill',
      x: 410,
      y: 398,
      width: 150,
      height: 38,
      zIndex: 2,
      visible: true,
      locked: false,
      backgroundColor: buttonColor === '#111111' ? '#DF9636' : buttonColor,
      textColor: '#111111',
      borderRadius: 19,
      text: cat2Name,
      fontSize: 13,
      fontWeight: 800,
      textAlign: 'center'
    });

    // 9. PRODUCT CARD 1 (Item 1)
    const card1Y = 455;
    elements.push({
      id: 'elem-card1-container',
      name: `Ficha de Plato 1 (${item1.name})`,
      type: 'shape_rect',
      x: 50,
      y: card1Y,
      width: 700,
      height: 480,
      zIndex: 1,
      visible: true,
      locked: false,
      backgroundColor: cardBgColor,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.35)'
    });

    elements.push({
      id: 'elem-card1-photo',
      name: `Foto Plato 1`,
      type: 'dish_image_container',
      x: 68,
      y: card1Y + 18,
      width: 664,
      height: 250,
      zIndex: 2,
      visible: true,
      locked: false,
      backgroundImage: item1.imageUrl,
      borderRadius: 18,
      objectFit: 'cover',
      isDynamic: true,
      dynamicField: 'dish_image'
    });

    elements.push({
      id: 'elem-card1-price',
      name: `Precio Plato 1`,
      type: 'shape_badge',
      x: 85,
      y: card1Y + 32,
      width: 115,
      height: 36,
      zIndex: 3,
      visible: true,
      locked: false,
      backgroundColor: buttonColor,
      textColor: buttonTextColor,
      borderRadius: 8,
      text: `S/ ${item1.price.toFixed(2)}`,
      fontSize: 14,
      fontWeight: 800,
      isDynamic: true,
      dynamicField: 'dish_price'
    });

    elements.push({
      id: 'elem-card1-name',
      name: `Nombre Plato 1`,
      type: 'dish_name',
      x: 75,
      y: card1Y + 280,
      width: 650,
      height: 34,
      zIndex: 2,
      visible: true,
      locked: false,
      text: item1.name.toUpperCase(),
      fontSize: 20,
      fontWeight: 900,
      fontFamily: dishNameFont,
      textColor: textColor,
      textAlign: 'left',
      isDynamic: true,
      dynamicField: 'dish_name'
    });

    elements.push({
      id: 'elem-card1-desc',
      name: `Descripción Plato 1`,
      type: 'dish_description',
      x: 75,
      y: card1Y + 320,
      width: 650,
      height: 60,
      zIndex: 2,
      visible: true,
      locked: false,
      text: item1.description,
      fontSize: 13,
      fontWeight: 500,
      fontFamily: dishDescFont,
      textColor: textColor,
      opacity: 0.9,
      textAlign: 'left',
      isDynamic: true,
      dynamicField: 'dish_description'
    });

    elements.push({
      id: 'elem-card1-time',
      name: `Tiempo Plato 1`,
      type: 'text_custom',
      x: 75,
      y: card1Y + 420,
      width: 150,
      height: 30,
      zIndex: 2,
      visible: true,
      locked: false,
      text: `⏱ ${item1.prepTimeMinutes || 20} min`,
      fontSize: 13,
      fontWeight: 700,
      textColor: textColor
    });

    elements.push({
      id: 'elem-card1-btn',
      name: `Botón Pedir 1`,
      type: 'order_button',
      x: 580,
      y: card1Y + 410,
      width: 150,
      height: 44,
      zIndex: 2,
      visible: true,
      locked: false,
      backgroundColor: buttonColor,
      textColor: buttonTextColor,
      borderRadius: 22,
      text: '+ Pedir',
      fontSize: 14,
      fontWeight: 800
    });

    // 10. PRODUCT CARD 2 (Item 2)
    const card2Y = card1Y + 505;
    elements.push({
      id: 'elem-card2-container',
      name: `Ficha de Plato 2 (${item2.name})`,
      type: 'shape_rect',
      x: 50,
      y: card2Y,
      width: 700,
      height: 480,
      zIndex: 1,
      visible: true,
      locked: false,
      backgroundColor: cardBgColor,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.35)'
    });

    elements.push({
      id: 'elem-card2-photo',
      name: `Foto Plato 2`,
      type: 'dish_image_container',
      x: 68,
      y: card2Y + 18,
      width: 664,
      height: 250,
      zIndex: 2,
      visible: true,
      locked: false,
      backgroundImage: item2.imageUrl,
      borderRadius: 18,
      objectFit: 'cover'
    });

    elements.push({
      id: 'elem-card2-price',
      name: `Precio Plato 2`,
      type: 'shape_badge',
      x: 85,
      y: card2Y + 32,
      width: 115,
      height: 36,
      zIndex: 3,
      visible: true,
      locked: false,
      backgroundColor: buttonColor,
      textColor: buttonTextColor,
      borderRadius: 8,
      text: `S/ ${item2.price.toFixed(2)}`,
      fontSize: 14,
      fontWeight: 800
    });

    elements.push({
      id: 'elem-card2-name',
      name: `Nombre Plato 2`,
      type: 'dish_name',
      x: 75,
      y: card2Y + 280,
      width: 650,
      height: 34,
      zIndex: 2,
      visible: true,
      locked: false,
      text: item2.name.toUpperCase(),
      fontSize: 20,
      fontWeight: 900,
      fontFamily: dishNameFont,
      textColor: textColor,
      textAlign: 'left'
    });

    elements.push({
      id: 'elem-card2-desc',
      name: `Descripción Plato 2`,
      type: 'dish_description',
      x: 75,
      y: card2Y + 320,
      width: 650,
      height: 60,
      zIndex: 2,
      visible: true,
      locked: false,
      text: item2.description,
      fontSize: 13,
      fontWeight: 500,
      fontFamily: dishDescFont,
      textColor: textColor,
      opacity: 0.9,
      textAlign: 'left'
    });

    elements.push({
      id: 'elem-card2-time',
      name: `Tiempo Plato 2`,
      type: 'text_custom',
      x: 75,
      y: card2Y + 420,
      width: 150,
      height: 30,
      zIndex: 2,
      visible: true,
      locked: false,
      text: `⏱ ${item2.prepTimeMinutes || 15} min`,
      fontSize: 13,
      fontWeight: 700,
      textColor: textColor
    });

    elements.push({
      id: 'elem-card2-btn',
      name: `Botón Pedir 2`,
      type: 'order_button',
      x: 580,
      y: card2Y + 410,
      width: 150,
      height: 44,
      zIndex: 2,
      visible: true,
      locked: false,
      backgroundColor: buttonColor,
      textColor: buttonTextColor,
      borderRadius: 22,
      text: '+ Pedir',
      fontSize: 14,
      fontWeight: 800
    });

    return { elements, config };
  }

  // =========================================================================
  // CASE 2: BRASAS LUXURY GOLD TEMPLATE (Default Luxury Engine)
  // =========================================================================
  canvasHeight = 1500;
  config.height = canvasHeight;

  // 1. Background
  elements.push({
    id: 'elem-bg-base',
    name: 'Fondo Imperial Oscuro',
    type: 'background',
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    zIndex: 0,
    visible: true,
    locked: true,
    backgroundColor: darkBgColor,
    borderWidth: 0
  });

  // 2. Gold Pinstripe Border Frame
  elements.push({
    id: 'elem-gold-frame',
    name: 'Marco Dorado Pinstripe',
    type: 'shape_rect',
    x: 30,
    y: 30,
    width: 740,
    height: 1440,
    zIndex: 1,
    visible: true,
    locked: false,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DFB86C60',
    borderRadius: 20
  });

  // 3. Header Logo with Gold Gradient
  elements.push({
    id: 'elem-rest-logo',
    name: 'Logo del Restaurante',
    type: 'restaurant_logo',
    x: 275,
    y: 60,
    width: 250,
    height: 140,
    zIndex: 2,
    visible: true,
    locked: false,
    backgroundImage: logoUrl || undefined,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#DFB86C',
    objectFit: 'contain',
    isDynamic: true,
    dynamicField: 'restaurant_logo'
  });

  // 4. Restaurant Name in Calligraphy/Cursive
  elements.push({
    id: 'elem-rest-name',
    name: 'Nombre del Restaurante',
    type: 'restaurant_name',
    x: 100,
    y: 215,
    width: 600,
    height: 48,
    zIndex: 2,
    visible: true,
    locked: false,
    text: restaurant?.name || 'Brasas & Fuego',
    fontSize: 32,
    fontWeight: 700,
    fontFamily: "'Dancing Script', 'Alex Brush', cursive",
    textColor: '#EED799',
    textAlign: 'center',
    isDynamic: true,
    dynamicField: 'restaurant_name'
  });

  // 5. Tagline
  elements.push({
    id: 'elem-rest-tagline',
    name: 'Slogan / Tagline',
    type: 'restaurant_tagline',
    x: 150,
    y: 265,
    width: 500,
    height: 24,
    zIndex: 2,
    visible: true,
    locked: false,
    text: restaurant?.tagline || 'Parrillas & Carnes Selectas',
    fontSize: 12,
    fontFamily: "'Cinzel', serif",
    textColor: '#DFB86C',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    isDynamic: true,
    dynamicField: 'restaurant_tagline'
  });

  // 6. Section Banner "LA CARTA"
  elements.push({
    id: 'elem-section-title',
    name: 'Título de Sección',
    type: 'text_custom',
    x: 150,
    y: 300,
    width: 500,
    height: 40,
    zIndex: 2,
    visible: true,
    locked: false,
    text: '✦ LA CARTA ✦',
    fontSize: 26,
    fontFamily: "'Cinzel', serif",
    fontWeight: 800,
    textColor: '#FFF2CC',
    textAlign: 'center',
    letterSpacing: 4
  });

  // 7. Category Pills
  elements.push({
    id: 'elem-cat-pill-1',
    name: `Categoría: ${cat1Name}`,
    type: 'category_pill',
    x: 240,
    y: 355,
    width: 150,
    height: 38,
    zIndex: 2,
    visible: true,
    locked: false,
    backgroundColor: '#D4AF37',
    textColor: '#000000',
    borderRadius: 19,
    text: cat1Name,
    fontSize: 13,
    fontWeight: 800,
    textAlign: 'center'
  });

  elements.push({
    id: 'elem-cat-pill-2',
    name: `Categoría: ${cat2Name}`,
    type: 'category_pill',
    x: 410,
    y: 355,
    width: 150,
    height: 38,
    zIndex: 2,
    visible: true,
    locked: false,
    backgroundColor: 'rgba(9, 38, 31, 0.8)',
    borderWidth: 1,
    borderColor: '#D4AF3750',
    textColor: '#D4AF37',
    borderRadius: 19,
    text: cat2Name,
    fontSize: 13,
    fontWeight: 800,
    textAlign: 'center'
  });

  // 8. LUXURY DISH CARD 1 (Even: Circular photo Left, Card Right)
  const lux1Y = 415;
  elements.push({
    id: 'elem-lux1-card',
    name: `Ficha de Plato 1`,
    type: 'shape_rect',
    x: 150,
    y: lux1Y,
    width: 590,
    height: 220,
    zIndex: 1,
    visible: true,
    locked: false,
    backgroundColor: cardBgColor,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D4AF3750',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
  });

  elements.push({
    id: 'elem-lux1-circle-photo',
    name: `Foto Circular 1`,
    type: 'dish_image_container',
    x: 60,
    y: lux1Y + 30,
    width: 160,
    height: 160,
    zIndex: 3,
    visible: true,
    locked: false,
    backgroundImage: item1.imageUrl,
    borderRadius: '9999px',
    borderWidth: 2,
    borderColor: '#DFB86C',
    objectFit: 'cover',
    boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
    isDynamic: true,
    dynamicField: 'dish_image'
  });

  elements.push({
    id: 'elem-lux1-name',
    name: `Nombre Plato 1`,
    type: 'dish_name',
    x: 235,
    y: lux1Y + 25,
    width: 480,
    height: 32,
    zIndex: 2,
    visible: true,
    locked: false,
    text: item1.name,
    fontSize: 18,
    fontWeight: 700,
    fontFamily: dishNameFont,
    textColor: textColor,
    textAlign: 'left',
    isDynamic: true,
    dynamicField: 'dish_name'
  });

  elements.push({
    id: 'elem-lux1-desc',
    name: `Descripción Plato 1`,
    type: 'dish_description',
    x: 235,
    y: lux1Y + 62,
    width: 480,
    height: 55,
    zIndex: 2,
    visible: true,
    locked: false,
    text: item1.description,
    fontSize: 13,
    fontFamily: dishDescFont,
    textColor: '#CFDECB',
    textAlign: 'left',
    isDynamic: true,
    dynamicField: 'dish_description'
  });

  elements.push({
    id: 'elem-lux1-price',
    name: `Precio Plato 1`,
    type: 'dish_price',
    x: 430,
    y: lux1Y + 155,
    width: 140,
    height: 36,
    zIndex: 2,
    visible: true,
    locked: false,
    text: `S/ ${item1.price.toFixed(2)}`,
    fontSize: 20,
    fontWeight: 800,
    fontFamily: dishPriceFont,
    textColor: priceColor,
    isDynamic: true,
    dynamicField: 'dish_price'
  });

  elements.push({
    id: 'elem-lux1-btn',
    name: `Botón Pedir 1`,
    type: 'order_button',
    x: 590,
    y: lux1Y + 150,
    width: 130,
    height: 44,
    zIndex: 2,
    visible: true,
    locked: false,
    backgroundColor: buttonColor,
    textColor: buttonTextColor,
    borderRadius: 12,
    text: 'Pedir',
    fontSize: 14,
    fontWeight: 800
  });

  // 9. LUXURY DISH CARD 2 (Odd: Card Left, Circular photo Right)
  const lux2Y = lux1Y + 260;
  elements.push({
    id: 'elem-lux2-card',
    name: `Ficha de Plato 2`,
    type: 'shape_rect',
    x: 60,
    y: lux2Y,
    width: 590,
    height: 220,
    zIndex: 1,
    visible: true,
    locked: false,
    backgroundColor: cardBgColor,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D4AF3750',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
  });

  elements.push({
    id: 'elem-lux2-circle-photo',
    name: `Foto Circular 2`,
    type: 'dish_image_container',
    x: 580,
    y: lux2Y + 30,
    width: 160,
    height: 160,
    zIndex: 3,
    visible: true,
    locked: false,
    backgroundImage: item2.imageUrl,
    borderRadius: '9999px',
    borderWidth: 2,
    borderColor: '#DFB86C',
    objectFit: 'cover',
    boxShadow: '0 8px 20px rgba(0,0,0,0.8)'
  });

  elements.push({
    id: 'elem-lux2-name',
    name: `Nombre Plato 2`,
    type: 'dish_name',
    x: 80,
    y: lux2Y + 25,
    width: 480,
    height: 32,
    zIndex: 2,
    visible: true,
    locked: false,
    text: item2.name,
    fontSize: 18,
    fontWeight: 700,
    fontFamily: dishNameFont,
    textColor: textColor,
    textAlign: 'left'
  });

  elements.push({
    id: 'elem-lux2-desc',
    name: `Descripción Plato 2`,
    type: 'dish_description',
    x: 80,
    y: lux2Y + 62,
    width: 480,
    height: 55,
    zIndex: 2,
    visible: true,
    locked: false,
    text: item2.description,
    fontSize: 13,
    fontFamily: dishDescFont,
    textColor: '#CFDECB',
    textAlign: 'left'
  });

  elements.push({
    id: 'elem-lux2-price',
    name: `Precio Plato 2`,
    type: 'dish_price',
    x: 280,
    y: lux2Y + 155,
    width: 140,
    height: 36,
    zIndex: 2,
    visible: true,
    locked: false,
    text: `S/ ${item2.price.toFixed(2)}`,
    fontSize: 20,
    fontWeight: 800,
    fontFamily: dishPriceFont,
    textColor: priceColor
  });

  elements.push({
    id: 'elem-lux2-btn',
    name: `Botón Pedir 2`,
    type: 'order_button',
    x: 440,
    y: lux2Y + 150,
    width: 130,
    height: 44,
    zIndex: 2,
    visible: true,
    locked: false,
    backgroundColor: buttonColor,
    textColor: buttonTextColor,
    borderRadius: 12,
    text: 'Pedir',
    fontSize: 14,
    fontWeight: 800
  });

  return { elements, config };
}

/**
 * Backward-compatible helper that proxies to importCardToEditorModel
 */
export function createInitialCanvasElements(
  restaurant?: Restaurant,
  branding?: RestaurantBranding,
  sampleItem?: MenuItem,
  allItems: MenuItem[] = [],
  allCategories: MenuCategory[] = []
): { elements: CanvasElement[]; config: CanvasConfig } {
  return importCardToEditorModel(restaurant, branding, sampleItem, allItems, allCategories);
}

export function getZoneForElement(
  el: Partial<CanvasElement>,
  headerHeight: number = 380,
  footerTop: number = 1300
): 'header' | 'body' | 'footer' {
  if (el.zone) return el.zone;
  const y = Number(el.y) || 0;
  const type = el.type || '';
  const dyn = el.dynamicField || '';
  const name = (el.name || '').toLowerCase();

  if (
    type === 'restaurant_logo' || 
    type === 'restaurant_name' || 
    type === 'restaurant_tagline' || 
    dyn === 'restaurant_logo' || 
    dyn === 'restaurant_name' || 
    dyn === 'restaurant_tagline' ||
    name.includes('logo') ||
    name.includes('slogan') ||
    name.includes('tagline') ||
    (y < headerHeight && !type.includes('dish'))
  ) {
    return 'header';
  }

  if (
    type === 'contact_info' ||
    type === 'footer_text' ||
    name.includes('pie') ||
    name.includes('contacto') ||
    name.includes('despedida') ||
    name.includes('horario') ||
    name.includes('igv') ||
    y >= footerTop
  ) {
    return 'footer';
  }

  return 'body';
}

/**
 * Validates and ensures every required property is present on a canvas element.
 */
export function sanitizeCanvasElement(
  el: Partial<CanvasElement>, 
  index: number = 0,
  headerHeight: number = 380,
  footerTop: number = 1300
): CanvasElement {
  const resolvedZone = el.zone || getZoneForElement(el, headerHeight, footerTop);

  return {
    id: el.id || `elem-${el.type || 'custom'}-${Date.now()}-${index}`,
    name: el.name || 'Objeto de Diseño',
    type: el.type || 'text_custom',
    zone: resolvedZone,
    x: Number(el.x) || 0,
    y: Number(el.y) || 0,
    width: Math.max(10, Number(el.width) || 100),
    height: Math.max(10, Number(el.height) || 40),
    rotation: Number(el.rotation) || 0,
    opacity: el.opacity !== undefined ? Number(el.opacity) : 1,
    zIndex: el.zIndex !== undefined ? Number(el.zIndex) : index,
    visible: el.visible !== false,
    locked: Boolean(el.locked),
    text: el.text,
    fontSize: Number(el.fontSize) || 16,
    fontFamily: el.fontFamily || 'inherit',
    fontWeight: el.fontWeight || 400,
    fontStyle: el.fontStyle || 'normal',
    textAlign: el.textAlign || 'left',
    textColor: el.textColor || '#FFFFFF',
    letterSpacing: Number(el.letterSpacing) || 0,
    lineHeight: Number(el.lineHeight) || 1.4,
    textTransform: el.textTransform || 'none',
    textShadow: el.textShadow,
    backgroundColor: el.backgroundColor,
    backgroundGradient: el.backgroundGradient,
    backgroundImage: el.backgroundImage,
    borderRadius: el.borderRadius !== undefined ? el.borderRadius : 0,
    borderWidth: Number(el.borderWidth) || 0,
    borderColor: el.borderColor,
    borderStyle: el.borderStyle || 'solid',
    boxShadow: el.boxShadow,
    objectFit: el.objectFit || 'cover',
    iconName: el.iconName,
    badgeText: el.badgeText,
    isDynamic: Boolean(el.isDynamic),
    dynamicField: el.dynamicField
  };
}

/**
 * Computes magnetic snapping points against canvas edges, centers, and other objects.
 */
export function computeSnapGuides(
  target: { x: number; y: number; width: number; height: number },
  allElements: { x: number; y: number; width: number; height: number; id?: string; visible?: boolean }[],
  configWidthOrConfig: number | CanvasConfig,
  configHeightOrThreshold?: number,
  snapThresholdOrNone?: number
): { snapX: number; snapY: number; guides: SnapGuide[] } {
  const width = typeof configWidthOrConfig === 'number' ? configWidthOrConfig : configWidthOrConfig.width;
  const height = typeof configHeightOrThreshold === 'number' && typeof configWidthOrConfig === 'number' 
    ? configHeightOrThreshold 
    : (typeof configWidthOrConfig === 'object' ? configWidthOrConfig.height : 1200);
  const snapThreshold = typeof snapThresholdOrNone === 'number' 
    ? snapThresholdOrNone 
    : (typeof configHeightOrThreshold === 'number' && typeof configWidthOrConfig === 'object' ? configHeightOrThreshold : 6);

  let snapX = target.x;
  let snapY = target.y;
  const guides: SnapGuide[] = [];

  const snapPointsX: number[] = [0, width / 2, width];
  const snapPointsY: number[] = [0, height / 2, height];

  // Collect snap lines from other objects
  for (const el of allElements) {
    if (el.visible === false) continue;
    snapPointsX.push(el.x, el.x + el.width / 2, el.x + el.width);
    snapPointsY.push(el.y, el.y + el.height / 2, el.y + el.height);
  }

  const targetLeft = target.x;
  const targetCenterX = target.x + target.width / 2;
  const targetRight = target.x + target.width;

  const targetTop = target.y;
  const targetCenterY = target.y + target.height / 2;
  const targetBottom = target.y + target.height;

  // Snap Horizontal
  for (const px of snapPointsX) {
    // Left edge
    if (Math.abs(targetLeft - px) <= snapThreshold) {
      snapX = px;
      guides.push({ type: 'vertical', position: px });
      break;
    }
    // Center X
    if (Math.abs(targetCenterX - px) <= snapThreshold) {
      snapX = px - target.width / 2;
      guides.push({ type: 'vertical', position: px });
      break;
    }
    // Right edge
    if (Math.abs(targetRight - px) <= snapThreshold) {
      snapX = px - target.width;
      guides.push({ type: 'vertical', position: px });
      break;
    }
  }

  // Snap Vertical
  for (const py of snapPointsY) {
    // Top edge
    if (Math.abs(targetTop - py) <= snapThreshold) {
      snapY = py;
      guides.push({ type: 'horizontal', position: py });
      break;
    }
    // Center Y
    if (Math.abs(targetCenterY - py) <= snapThreshold) {
      snapY = py - target.height / 2;
      guides.push({ type: 'horizontal', position: py });
      break;
    }
    // Bottom edge
    if (Math.abs(targetBottom - py) <= snapThreshold) {
      snapY = py - target.height;
      guides.push({ type: 'horizontal', position: py });
      break;
    }
  }

  return { snapX, snapY, guides };
}

/**
 * Synchronizes the Canvas visual state into standard RestaurantBranding fields
 * so all existing customer menus and backend snapshots remain 100% compatible.
 */
export function extractBrandingFromCanvas(
  elements: CanvasElement[],
  config: CanvasConfig,
  currentBranding: RestaurantBranding = {} as RestaurantBranding
): RestaurantBranding {
  // Find key elements to extract standard properties
  const bgElem = elements.find(e => e.type === 'background');
  const cardElem = elements.find(e => e.type === 'shape_rect' && (e.name.toLowerCase().includes('ficha') || e.name.toLowerCase().includes('card') || e.name.toLowerCase().includes('plato')));
  const dishNameElem = elements.find(e => e.type === 'dish_name');
  const dishDescElem = elements.find(e => e.type === 'dish_description');
  const dishPriceElem = elements.find(e => e.type === 'dish_price');
  const restNameElem = elements.find(e => e.type === 'restaurant_name');
  const buttonElem = elements.find(e => e.type === 'order_button' || e.type === 'shape_badge' || e.type === 'category_pill');
  const logoElem = elements.find(e => e.type === 'restaurant_logo' || e.dynamicField === 'restaurant_logo');

  const primaryColor = buttonElem?.backgroundColor || currentBranding.primaryColor || '#D4AF37';
  const darkBgColor = bgElem?.backgroundColor || config.backgroundColor || currentBranding.darkBgColor || '#071A14';
  const cardBgColor = cardElem?.backgroundColor || currentBranding.cardBgColor || currentBranding.dishCardBgColor || '#141E2E';
  const textColor = dishNameElem?.textColor || currentBranding.textColor || '#FFFFFF';
  const fontDisplay = dishNameElem?.fontFamily || restNameElem?.fontFamily || currentBranding.fontDisplay || "'Cinzel', serif";
  const dishNameFont = dishNameElem?.fontFamily || fontDisplay;
  const dishDescFont = dishDescElem?.fontFamily || currentBranding.dishDescFont || "'Inter', sans-serif";
  const dishPriceFont = dishPriceElem?.fontFamily || currentBranding.dishPriceFont || "'Roboto Mono', monospace";
  const priceColor = dishPriceElem?.textColor || primaryColor;
  const buttonColor = buttonElem?.backgroundColor || primaryColor;
  const buttonTextColor = buttonElem?.textColor || '#000000';

  return normalizeBranding({
    ...currentBranding,
    primaryColor,
    secondaryColor: currentBranding.secondaryColor || primaryColor,
    accentColor: buttonColor,
    darkBgColor,
    backgroundColor: darkBgColor,
    cardBgColor,
    dishCardBgColor: cardBgColor,
    textColor,
    fontDisplay,
    dishNameFont,
    dishDescFont,
    dishPriceFont,
    priceColor,
    buttonColor,
    buttonTextColor,
    restaurantNameFont: restNameElem?.fontFamily || fontDisplay,
    restaurantNameColor: restNameElem?.textColor || '#FFFFFF',
    headerLogoUrl: logoElem?.backgroundImage || currentBranding.headerLogoUrl,
    // Canvas persistence fields
    canvasElements: elements.map((el, i) => sanitizeCanvasElement(el, i)),
    canvasConfig: {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      backgroundImage: config.backgroundImage
    }
  });
}
