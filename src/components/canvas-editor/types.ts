import { Restaurant, RestaurantBranding, MenuTemplate, MenuItem, MenuCategory } from '../../types';

export type CanvasElementType =
  | 'background'
  | 'dish_image_container'
  | 'dish_name'
  | 'dish_description'
  | 'dish_price'
  | 'dish_addons'
  | 'dish_observations'
  | 'restaurant_logo'
  | 'restaurant_name'
  | 'restaurant_tagline'
  | 'text_custom'
  | 'shape_rect'
  | 'shape_circle'
  | 'shape_badge'
  | 'separator_line'
  | 'image_custom'
  | 'order_button'
  | 'category_pill'
  | 'footer_text'
  | 'contact_info';

export type CanvasZone = 'header' | 'body' | 'footer';

export interface CanvasElement {
  id: string;
  name: string;
  type: CanvasElementType;
  zone?: CanvasZone;       // Design zone categorization: header (static), body (items), footer (bottom)
  x: number;               // Absolute coordinate X in canvas pixels (e.g. 0 to 1080)
  y: number;               // Absolute coordinate Y in canvas pixels (e.g. 0 to 1920)
  width: number;           // Width in canvas pixels
  height: number;          // Height in canvas pixels
  rotation?: number;       // Angle in degrees (0 - 360)
  opacity?: number;        // Opacity 0 to 1
  zIndex: number;          // Layer order
  visible: boolean;        // Visible on screen
  locked: boolean;         // Locked against accidental selection/drag
  // Typography
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textShadow?: string;
  // Appearance & Styling
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  borderRadius?: number | string;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  boxShadow?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  // Badge / Shape specific
  iconName?: string;
  badgeText?: string;
  // Dynamic linking flag
  isDynamic?: boolean;
  dynamicField?: 'dish_name' | 'dish_description' | 'dish_price' | 'dish_image' | 'dish_addons' | 'dish_observations' | 'restaurant_name' | 'restaurant_logo' | 'restaurant_tagline';
}

export interface CanvasConfig {
  width: number;          // Canonical canvas width (default 800)
  height: number;         // Canonical canvas height (default 1500)
  backgroundColor: string;
  backgroundImage?: string;
  showGrid?: boolean;
  gridSize?: number;      // e.g. 20px
  showSnapGuides?: boolean;
  showSafetyMargins?: boolean;
  safetyMarginPadding?: number; // e.g. 40px
  showZoneGuides?: boolean;     // Visual dividers for Header, Body and Footer zones
  headerZoneHeight?: number;    // Height allocated for static header (default 260px)
  footerZoneHeight?: number;    // Height allocated for footer (default 180px)
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;
}

export interface HistoryState {
  elements: CanvasElement[];
  config: CanvasConfig;
  selectedId: string | null;
}

export const CANVAS_FONTS = [
  { label: 'Cinzel (Serifa Romana Monumental)', value: "'Cinzel', 'Playfair Display', serif", preview: 'Cinzel' },
  { label: 'Playfair Display (Elegancia Clásica)', value: "'Playfair Display', serif", preview: 'Playfair' },
  { label: 'Plus Jakarta Sans (Moderna & Nítida)', value: "'Plus Jakarta Sans', sans-serif", preview: 'Plus Jakarta' },
  { label: 'Outfit (Contemporánea Geométrica)', value: "'Outfit', sans-serif", preview: 'Outfit' },
  { label: 'Syne (Urbana e Impactante)', value: "'Syne', sans-serif", preview: 'Syne' },
  { label: 'Inter (Alta Legibilidad)', value: "'Inter', sans-serif", preview: 'Inter' },
  { label: 'Montserrat (Publicitaria Premium)', value: "'Montserrat', sans-serif", preview: 'Montserrat' },
  { label: 'Dancing Script (Cursiva & Caligráfica)', value: "'Dancing Script', cursive", preview: 'Dancing Script' },
  { label: 'Roboto Mono (Técnica & Monospace)', value: "'Roboto Mono', monospace", preview: 'Roboto Mono' }
];

export const PRESET_COLOR_SWATCHES = [
  '#FFFFFF', '#F8FAFC', '#E2E8F0', '#94A3B8', '#475569', '#1E293B', '#0F172A', '#000000',
  '#E11D48', '#F43F5E', '#FB7185', '#EA580C', '#F97316', '#FB923C', '#F59E0B', '#FBBF24',
  '#EAB308', '#FACC15', '#10B981', '#34D399', '#06B6D4', '#38BDF8', '#0284C7', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#D4AF37', '#DFB86C', '#13394D'
];
