import { CanvasElement, CanvasConfig, SnapGuide } from './types';
import { Restaurant, RestaurantBranding, MenuItem, MenuCategory } from '../../types';

export const DEFAULT_CANVAS_WIDTH = 800;
export const DEFAULT_CANVAS_HEIGHT = 1200;

/**
 * Generates an initial, fully-structured Canvas composition from a Restaurant and its Branding.
 * If the restaurant already has custom canvas elements saved, returns them.
 * Otherwise creates an aesthetic layout with header, background, dish presentation, addons, and actions.
 */
export function createInitialCanvasElements(
  restaurant?: Restaurant,
  branding?: RestaurantBranding,
  sampleItem?: MenuItem
): { elements: CanvasElement[]; config: CanvasConfig } {
  const b = branding || restaurant?.branding || ({} as RestaurantBranding);
  
  const canvasWidth = b.canvasConfig?.width || DEFAULT_CANVAS_WIDTH;
  const canvasHeight = b.canvasConfig?.height || DEFAULT_CANVAS_HEIGHT;
  const darkBg = b.darkBgColor || '#0B0F17';
  const primary = b.primaryColor || b.buttonColor || '#D4AF37';
  const textColor = b.textColor || '#FFFFFF';
  const cardBg = b.dishCardBgColor || b.cardBgColor || '#141E2E';
  const fontDisplay = b.fontDisplay || b.dishNameFont || "'Cinzel', serif";
  const fontDesc = b.dishDescFont || "'Inter', sans-serif";
  const fontPrice = b.dishPriceFont || "'Roboto Mono', monospace";
  const buttonTextColor = b.buttonTextColor || '#000000';
  const priceColor = b.priceColor || primary;

  const config: CanvasConfig = {
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: darkBg,
    backgroundImage: b.canvasConfig?.backgroundImage,
    showGrid: false,
    gridSize: 20,
    showSnapGuides: true,
    showSafetyMargins: false,
    safetyMarginPadding: 40
  };

  // If already persisted, return existing validated elements
  if (b.canvasElements && Array.isArray(b.canvasElements) && b.canvasElements.length > 0) {
    const validated = b.canvasElements.map((el, idx) => sanitizeCanvasElement(el, idx));
    return { elements: validated, config };
  }

  // Otherwise construct a rich, highly polished Canvas Composition
  const elements: CanvasElement[] = [
    // 1. Background base
    {
      id: 'elem-bg-base',
      name: 'Fondo de Carta',
      type: 'background',
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      zIndex: 0,
      visible: true,
      locked: true,
      backgroundColor: darkBg,
      borderWidth: 0
    },

    // 2. Header Gradient Panel
    {
      id: 'elem-header-panel',
      name: 'Cabecera de Marca',
      type: 'shape_rect',
      x: 30,
      y: 30,
      width: canvasWidth - 60,
      height: 160,
      zIndex: 1,
      visible: true,
      locked: false,
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: `${primary}35`,
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
    },

    // 3. Restaurant Logo
    {
      id: 'elem-rest-logo',
      name: 'Logo del Restaurante',
      type: 'restaurant_logo',
      x: 55,
      y: 55,
      width: 110,
      height: 110,
      zIndex: 2,
      visible: true,
      locked: false,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: primary,
      objectFit: 'cover',
      isDynamic: true,
      dynamicField: 'restaurant_logo'
    },

    // 4. Restaurant Badge / Oficial
    {
      id: 'elem-badge-official',
      name: 'Badge Oficial',
      type: 'shape_badge',
      x: 185,
      y: 55,
      width: 140,
      height: 28,
      zIndex: 2,
      visible: true,
      locked: false,
      backgroundColor: primary,
      textColor: buttonTextColor,
      text: 'CARTA OFICIAL',
      fontSize: 12,
      fontWeight: 700,
      fontFamily: fontDisplay,
      textAlign: 'center',
      borderRadius: 14,
      letterSpacing: 1.5,
      textTransform: 'uppercase'
    },

    // 5. Restaurant Name
    {
      id: 'elem-rest-name',
      name: 'Nombre del Restaurante',
      type: 'restaurant_name',
      x: 185,
      y: 90,
      width: 500,
      height: 40,
      zIndex: 2,
      visible: true,
      locked: false,
      text: restaurant?.name || 'Nombre del Restaurante',
      fontSize: 28,
      fontWeight: 800,
      fontFamily: fontDisplay,
      textColor: '#FFFFFF',
      textAlign: 'left',
      isDynamic: true,
      dynamicField: 'restaurant_name'
    },

    // 6. Restaurant Tagline / Slogan
    {
      id: 'elem-rest-tagline',
      name: 'Slogan / Ubicación',
      type: 'restaurant_tagline',
      x: 185,
      y: 135,
      width: 500,
      height: 25,
      zIndex: 2,
      visible: true,
      locked: false,
      text: restaurant?.tagline || 'Experiencia Gastronómica de Alta Cocina',
      fontSize: 14,
      fontWeight: 400,
      fontFamily: fontDesc,
      textColor: '#94A3B8',
      textAlign: 'left',
      isDynamic: true,
      dynamicField: 'restaurant_tagline'
    },

    // 7. Category Pill Bar / Section Separator
    {
      id: 'elem-category-bar',
      name: 'Separador de Sección',
      type: 'shape_rect',
      x: 30,
      y: 215,
      width: canvasWidth - 60,
      height: 48,
      zIndex: 1,
      visible: true,
      locked: false,
      backgroundColor: `${primary}15`,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${primary}30`
    },
    {
      id: 'elem-category-title',
      name: 'Título de Categoría',
      type: 'text_custom',
      x: 50,
      y: 228,
      width: 400,
      height: 24,
      zIndex: 2,
      visible: true,
      locked: false,
      text: '★ PLATOS DE LA CASA',
      fontSize: 15,
      fontWeight: 700,
      fontFamily: fontDisplay,
      textColor: primary,
      letterSpacing: 2,
      textTransform: 'uppercase'
    },

    // 8. Main Dish Card Container
    {
      id: 'elem-dish-card-container',
      name: 'Contenedor Ficha de Plato',
      type: 'shape_rect',
      x: 30,
      y: 285,
      width: canvasWidth - 60,
      height: 480,
      zIndex: 1,
      visible: true,
      locked: false,
      backgroundColor: cardBg,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: `${primary}30`,
      boxShadow: '0 20px 45px -15px rgba(0,0,0,0.6)'
    },

    // 9. Dish Image Box
    {
      id: 'elem-dish-image',
      name: 'Fotografía del Plato',
      type: 'dish_image_container',
      x: 55,
      y: 310,
      width: 320,
      height: 280,
      zIndex: 2,
      visible: true,
      locked: false,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: `${primary}50`,
      objectFit: 'cover',
      boxShadow: '0 12px 28px -8px rgba(0,0,0,0.65)',
      isDynamic: true,
      dynamicField: 'dish_image'
    },

    // 10. Dish Name
    {
      id: 'elem-dish-name',
      name: 'Nombre del Plato {{nombre_plato}}',
      type: 'dish_name',
      x: 400,
      y: 315,
      width: 340,
      height: 60,
      zIndex: 2,
      visible: true,
      locked: false,
      text: sampleItem?.name || 'Lomo Saltado Jugoso al Wok',
      fontSize: 26,
      fontWeight: 800,
      fontFamily: fontDisplay,
      textColor: textColor,
      textAlign: 'left',
      lineHeight: 1.2,
      isDynamic: true,
      dynamicField: 'dish_name'
    },

    // 11. Dish Description
    {
      id: 'elem-dish-desc',
      name: 'Descripción del Plato {{descripcion_plato}}',
      type: 'dish_description',
      x: 400,
      y: 385,
      width: 340,
      height: 80,
      zIndex: 2,
      visible: true,
      locked: false,
      text: sampleItem?.description || 'Trozos de lomo fino salteados a fuego vivo con cebolla roja, tomate fresco, cilantro y toque de pisco. Acompañado de papas doradas y arroz con choclo.',
      fontSize: 14,
      fontWeight: 400,
      fontFamily: fontDesc,
      textColor: '#CBD5E1',
      textAlign: 'left',
      lineHeight: 1.5,
      isDynamic: true,
      dynamicField: 'dish_description'
    },

    // 12. Dish Price
    {
      id: 'elem-dish-price',
      name: 'Precio del Plato {{precio}}',
      type: 'dish_price',
      x: 400,
      y: 475,
      width: 200,
      height: 45,
      zIndex: 2,
      visible: true,
      locked: false,
      text: `S/ ${sampleItem?.price ? sampleItem.price.toFixed(2) : '48.00'}`,
      fontSize: 28,
      fontWeight: 800,
      fontFamily: fontPrice,
      textColor: priceColor,
      textAlign: 'left',
      isDynamic: true,
      dynamicField: 'dish_price'
    },

    // 13. Order Button
    {
      id: 'elem-order-btn',
      name: 'Botón de Pedir (+)',
      type: 'order_button',
      x: 400,
      y: 535,
      width: 170,
      height: 46,
      zIndex: 2,
      visible: true,
      locked: false,
      text: 'Pedir al Plato',
      backgroundColor: primary,
      textColor: buttonTextColor,
      fontSize: 14,
      fontWeight: 700,
      fontFamily: fontDesc,
      textAlign: 'center',
      borderRadius: 14,
      boxShadow: `0 8px 24px -4px ${primary}60`
    },

    // 14. Dish Addons Box
    {
      id: 'elem-addons-box',
      name: 'Adicionales del Plato {{adicionales}}',
      type: 'dish_addons',
      x: 55,
      y: 610,
      width: 685,
      height: 65,
      zIndex: 2,
      visible: true,
      locked: false,
      text: '+ Adicionales: Porción de Arroz (S/ 6.00) · Papas Nativas (S/ 8.00) · Huevo Frito (S/ 3.50)',
      fontSize: 13,
      fontWeight: 500,
      fontFamily: fontDesc,
      textColor: '#94A3B8',
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      isDynamic: true,
      dynamicField: 'dish_addons'
    },

    // 15. Dish Observations
    {
      id: 'elem-observations-box',
      name: 'Observaciones / Término {{observaciones}}',
      type: 'dish_observations',
      x: 55,
      y: 685,
      width: 685,
      height: 55,
      zIndex: 2,
      visible: true,
      locked: false,
      text: '📝 Observaciones sugeridas: Término medio · Sin cebolla · Poco picante · Salsa aparte',
      fontSize: 12,
      fontWeight: 400,
      fontFamily: fontDesc,
      textColor: '#A0AEC0',
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
      isDynamic: true,
      dynamicField: 'dish_observations'
    },

    // 16. Decorative Footer Note
    {
      id: 'elem-footer-note',
      name: 'Pie de Página / Seguridad',
      type: 'text_custom',
      x: 50,
      y: 1140,
      width: canvasWidth - 100,
      height: 30,
      zIndex: 2,
      visible: true,
      locked: false,
      text: 'Precios incluyen I.G.V. y recargo al consumo · Imágenes referenciales',
      fontSize: 12,
      fontWeight: 400,
      fontFamily: fontDesc,
      textColor: '#64748B',
      textAlign: 'center'
    }
  ];

  return { elements, config };
}

/**
 * Ensures element coordinates and dimensions are strictly valid finite numbers (never NaN or Infinity).
 */
export function sanitizeCanvasElement(el: any, index: number): CanvasElement {
  const safeNum = (val: any, fallback: number) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    id: el.id || `elem-custom-${index}-${Date.now()}`,
    name: el.name || `Objeto ${index + 1}`,
    type: el.type || 'text_custom',
    x: Math.round(safeNum(el.x, 0)),
    y: Math.round(safeNum(el.y, 0)),
    width: Math.max(10, Math.round(safeNum(el.width, 100))),
    height: Math.max(10, Math.round(safeNum(el.height, 40))),
    rotation: safeNum(el.rotation, 0) % 360,
    opacity: Math.min(1, Math.max(0, safeNum(el.opacity, 1))),
    zIndex: Math.round(safeNum(el.zIndex, index)),
    visible: el.visible !== false,
    locked: Boolean(el.locked),
    text: el.text || '',
    fontSize: safeNum(el.fontSize, 16),
    fontFamily: el.fontFamily || "'Plus Jakarta Sans', sans-serif",
    fontWeight: el.fontWeight || 400,
    fontStyle: el.fontStyle || 'normal',
    textAlign: el.textAlign || 'left',
    textColor: el.textColor || '#FFFFFF',
    letterSpacing: safeNum(el.letterSpacing, 0),
    lineHeight: safeNum(el.lineHeight, 1.4),
    textTransform: el.textTransform || 'none',
    textShadow: el.textShadow,
    backgroundColor: el.backgroundColor,
    backgroundGradient: el.backgroundGradient,
    backgroundImage: el.backgroundImage,
    borderRadius: el.borderRadius,
    borderWidth: safeNum(el.borderWidth, 0),
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
 * Calculates magnetic snap guides when an element is dragged or resized.
 */
export function computeSnapGuides(
  target: { x: number; y: number; width: number; height: number },
  otherElements: CanvasElement[],
  canvasWidth: number,
  canvasHeight: number,
  snapThreshold: number = 8
): { snapX: number; snapY: number; guides: SnapGuide[] } {
  let snapX = target.x;
  let snapY = target.y;
  const guides: SnapGuide[] = [];

  const targetLeft = target.x;
  const targetCenterX = target.x + target.width / 2;
  const targetRight = target.x + target.width;

  const targetTop = target.y;
  const targetCenterY = target.y + target.height / 2;
  const targetBottom = target.y + target.height;

  // Snap X candidates: 0, canvasWidth / 2, canvasWidth
  const snapPointsX: number[] = [0, canvasWidth / 2, canvasWidth];
  const snapPointsY: number[] = [0, canvasHeight / 2, canvasHeight];

  // Add other elements' key coordinates
  otherElements.forEach(other => {
    if (!other.visible) return;
    snapPointsX.push(other.x, other.x + other.width / 2, other.x + other.width);
    snapPointsY.push(other.y, other.y + other.height / 2, other.y + other.height);
  });

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
  const cardElem = elements.find(e => e.type === 'shape_rect' && e.name.toLowerCase().includes('ficha'));
  const dishNameElem = elements.find(e => e.type === 'dish_name');
  const dishDescElem = elements.find(e => e.type === 'dish_description');
  const dishPriceElem = elements.find(e => e.type === 'dish_price');
  const restNameElem = elements.find(e => e.type === 'restaurant_name');
  const buttonElem = elements.find(e => e.type === 'order_button' || e.type === 'shape_badge');

  const primaryColor = buttonElem?.backgroundColor || currentBranding.primaryColor || '#D4AF37';
  const darkBgColor = bgElem?.backgroundColor || config.backgroundColor || currentBranding.darkBgColor || '#071A14';
  const cardBgColor = cardElem?.backgroundColor || currentBranding.cardBgColor || '#141E2E';
  const textColor = dishNameElem?.textColor || currentBranding.textColor || '#FFFFFF';
  const fontDisplay = dishNameElem?.fontFamily || restNameElem?.fontFamily || currentBranding.fontDisplay || "'Cinzel', serif";
  const dishNameFont = dishNameElem?.fontFamily || fontDisplay;
  const dishDescFont = dishDescElem?.fontFamily || currentBranding.dishDescFont || "'Inter', sans-serif";
  const dishPriceFont = dishPriceElem?.fontFamily || currentBranding.dishPriceFont || "'Roboto Mono', monospace";
  const priceColor = dishPriceElem?.textColor || primaryColor;
  const buttonColor = buttonElem?.backgroundColor || primaryColor;
  const buttonTextColor = buttonElem?.textColor || '#000000';

  return {
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
    // Canvas persistence fields
    canvasElements: elements.map((el, i) => sanitizeCanvasElement(el, i)),
    canvasConfig: {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      backgroundImage: config.backgroundImage
    }
  };
}
