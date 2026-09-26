import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Check, 
  Plus, 
  Maximize2, 
  Minimize2, 
  Share2,
  ChefHat,
  Bike,
  Clock,
  MapPin,
  Edit3,
  Image as ImageIcon,
  Utensils
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order } from '../types';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';
import { ScheduleViewModal } from './ScheduleViewModal';

interface MedioPlatoMenuProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  onOrderCreated?: (newOrder: Order) => void;
  initialMode?: 'DINE_IN' | 'DELIVERY';
  initialTableNumber?: string;
  isOwnerOrAdmin?: boolean;
  // Live Editing Props
  isLiveEditActive?: boolean;
  onToggleLiveEdit?: () => void;
  onEditItem?: (item: MenuItem) => void;
  onDeleteItem?: (itemId: string) => void;
  onQuickPriceItem?: (item: MenuItem) => void;
  onQuickPhotoItem?: (item: MenuItem) => void;
  onToggleAvailability?: (item: MenuItem) => void;
  onAddNewItem?: (categoryId?: string) => void;
  onEditBranding?: () => void;
  onEditHeader?: () => void;
  onSaveToFirebase?: () => void;
  isSavingFirebase?: boolean;
}

interface CartItemEntry {
  item: MenuItem;
  quantity: number;
  units: OrderItemUnit[];
}

// Dietary indicator matching the standard square format in medioplato2.jpg
const DietaryBadge: React.FC<{ isVeg?: boolean; isNonVeg?: boolean; className?: string }> = ({ isVeg, isNonVeg, className = '' }) => {
  if (isVeg) {
    return (
      <span 
        className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-emerald-600 rounded-[1.5px] p-[1.5px] bg-white shrink-0 align-middle ${className}`}
        title="Vegetariano"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
      </span>
    );
  }
  if (isNonVeg) {
    return (
      <span 
        className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-red-600 rounded-[1.5px] p-[1.5px] bg-white shrink-0 align-middle ${className}`}
        title="No Vegetariano"
      >
        <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-red-600" />
      </span>
    );
  }
  return null;
};

// Default high-fidelity sample items matching medioplato2.jpg if no items exist
const SAMPLE_MEDIO_PLATO_ITEMS: MenuItem[] = [
  {
    id: 'sample-mutton-goli',
    restaurantId: 'sample',
    categoryId: 'sample-cat',
    name: 'Mutton Goli Chaat (Bihari)',
    description: 'Mutton balls in sweet & spicy chaat',
    price: 340,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 20,
    allergens: ['carne'],
    tags: ['non-veg', 'origin:Bihari']
  },
  {
    id: 'sample-soya-goli',
    restaurantId: 'sample',
    categoryId: 'sample-cat',
    name: 'Soya Goli Chaat',
    description: 'Veg chaat with soy balls',
    price: 260,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 15,
    allergens: [],
    tags: ['veg']
  },
  {
    id: 'sample-tarua',
    restaurantId: 'sample',
    categoryId: 'sample-cat',
    name: 'Tarua (Bihari)',
    description: 'Mixed vegetable fritters',
    price: 260,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 18,
    allergens: [],
    tags: ['veg', 'origin:Bihari']
  },
  {
    id: 'sample-chingrir-chop',
    restaurantId: 'sample',
    categoryId: 'sample-cat',
    name: 'Chingrir Chop (West Bengal)',
    description: 'Crispy mashed prawn cutlet',
    price: 350,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 22,
    allergens: ['mariscos'],
    tags: ['non-veg', 'origin:West Bengal']
  }
];

export const MedioPlatoMenu: React.FC<MedioPlatoMenuProps> = ({
  isOpen,
  onClose,
  restaurant,
  categories,
  items,
  onOrderCreated,
  initialMode = 'DINE_IN',
  initialTableNumber,
  isOwnerOrAdmin = false,
  isLiveEditActive = false,
  onToggleLiveEdit,
  onEditItem,
  onDeleteItem,
  onQuickPriceItem,
  onQuickPhotoItem,
  onAddNewItem,
  onEditBranding,
  onEditHeader
}) => {
  // Navigation & Channels
  const [activeChannel, setActiveChannel] = useState<'DINE_IN' | 'DELIVERY'>(initialMode);
  const isDineInEnabled = restaurant.menuAccessSettings?.enableDineIn !== false;
  const isDeliveryEnabled = restaurant.menuAccessSettings?.enableDelivery !== false;

  useEffect(() => {
    if (initialMode === 'DELIVERY' && isDeliveryEnabled) {
      setActiveChannel('DELIVERY');
    } else if (isDineInEnabled) {
      setActiveChannel('DINE_IN');
    } else if (isDeliveryEnabled) {
      setActiveChannel('DELIVERY');
    }
  }, [initialMode, isDineInEnabled, isDeliveryEnabled]);

  // Categories
  const currentCategories = categories && categories.length > 0 
    ? categories 
    : [{ id: `cat-${restaurant.id}-general`, restaurantId: restaurant.id, name: 'Starters', sortOrder: 1, isActive: true }];

  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Interactive Cart & Selection State
  const [cart, setCart] = useState<CartItemEntry[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Styling Variables
  const branding = restaurant.branding || {
    primaryColor: '#000000',
    secondaryColor: '#171717',
    accentColor: '#171717',
    darkBgColor: '#FFFFFF',
    cardBgColor: '#FFFFFF',
    textColor: '#111827',
    fontDisplay: "'Playfair Display', serif",
    buttonColor: '#000000',
    buttonTextColor: '#FFFFFF',
    dishNameFont: "'Playfair Display', serif",
    dishDescFont: "'Plus Jakarta Sans', sans-serif",
    dishPriceFont: "'Playfair Display', serif"
  };

  const dishNameFont = branding.dishNameFont || "'Playfair Display', 'Cormorant Garamond', Georgia, serif";
  const dishDescFont = branding.dishDescFont || "'Plus Jakarta Sans', sans-serif";
  const dishPriceFont = branding.dishPriceFont || "'Playfair Display', 'Cormorant Garamond', Georgia, serif";

  // Filter Items by channel and category
  const restaurantItems = items.filter(item => item.restaurantId === restaurant.id);
  const channelItems = restaurantItems.filter(item => {
    if (activeChannel === 'DINE_IN' && item.targetMenuScope === 'DELIVERY') return false;
    if (activeChannel === 'DELIVERY' && item.targetMenuScope === 'DINE_IN') return false;
    if (activeCategory === 'all') return true;
    return item.categoryId === activeCategory;
  });

  // If no items found, use sample items matching medioplato2.jpg for faithful presentation
  const displayedItems = channelItems.length > 0 ? channelItems : SAMPLE_MEDIO_PLATO_ITEMS;

  const isIndianMenu = displayedItems.some(i => /chaat|tarua|chingrir|bihari|mutton|soya goli/i.test(i.name)) || 
                       restaurant.name?.toLowerCase().includes('india');
  const currencySymbol = (restaurant as any).currencySymbol || (restaurant as any).currency || (isIndianMenu ? '₹' : 'S/');

  const cartTotalItemsCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartGrandTotal = cart.reduce((sum, c) => {
    const base = c.item.price * c.quantity;
    const addons = c.units.reduce((uSum, u) => {
      return uSum + (u.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
    }, 0);
    return sum + base + addons;
  }, 0);

  const handleConfirmItemUnits = (item: MenuItem, quantity: number, units: OrderItemUnit[]) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { item, quantity, units };
        return next;
      }
      return [...prev, { item, quantity, units }];
    });
  };

  const copyUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/?r=${restaurant.slug}` : '';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm"
    >
      {/* Main Menu Page Canvas: Pure clean white aesthetic matching medioplato2.jpg */}
      <div 
        className={`relative w-full ${
          isFullscreen ? 'max-w-4xl min-h-screen' : 'max-w-xl md:max-w-2xl min-h-[96vh]'
        } shadow-2xl transition-all duration-300 flex flex-col my-auto bg-white text-neutral-900 overflow-hidden sm:rounded-2xl`}
      >
        {/* Subtle Top Control Bar */}
        <div className="relative z-30 px-4 py-2.5 bg-neutral-950 text-white flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-serif font-bold tracking-wider text-neutral-200 uppercase text-[11px]">
              {restaurant.name} · Medio Plato
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOwnerOrAdmin && onToggleLiveEdit && (
              <button
                onClick={onToggleLiveEdit}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isLiveEditActive
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isLiveEditActive ? 'Edición Activa' : 'Editar Carta'}</span>
              </button>
            )}

            <button 
              onClick={copyUrl}
              className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Copiar enlace"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer hidden sm:block"
              title="Pantalla completa"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-md bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimal Channel & Category Bar (Subtle & clean) */}
        {(isDineInEnabled && isDeliveryEnabled || currentCategories.length > 1) && (
          <div className="px-4 pt-3 pb-1 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-2 bg-neutral-50/50">
            {/* Channel toggle */}
            {isDineInEnabled && isDeliveryEnabled && (
              <div className="flex items-center gap-1 bg-neutral-200/70 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveChannel('DINE_IN')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans transition cursor-pointer ${
                    activeChannel === 'DINE_IN'
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <ChefHat className="w-3 h-3 text-neutral-800" />
                  <span>Salón</span>
                  {initialTableNumber && (
                    <span className="text-[9px] bg-neutral-900 text-white px-1 py-0.2 rounded font-mono">
                      M.{initialTableNumber}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChannel('DELIVERY')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans transition cursor-pointer ${
                    activeChannel === 'DELIVERY'
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <Bike className="w-3 h-3 text-neutral-800" />
                  <span>Delivery</span>
                </button>
              </div>
            )}

            {/* Category tabs */}
            {currentCategories.length > 1 && (
              <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-2.5 py-1 text-xs rounded-md font-sans transition cursor-pointer whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                  }`}
                >
                  Todas
                </button>
                {currentCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs rounded-md font-sans transition cursor-pointer whitespace-nowrap ${
                      activeCategory === cat.id
                        ? 'bg-neutral-900 text-white font-semibold'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            )}

            {/* Quick add item for owner */}
            {isOwnerOrAdmin && isLiveEditActive && onAddNewItem && (
              <button
                onClick={() => onAddNewItem(activeCategory !== 'all' ? activeCategory : undefined)}
                className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-black text-white font-sans text-xs transition cursor-pointer inline-flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Agregar plato</span>
              </button>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MEDIO PLATO CANVAS — IDENTICAL TO medioplato2.jpg                         */}
        {/* Alternating rows, clean photos cut at vertical axis, full descriptions    */}
        {/* ========================================================================= */}
        <main className="flex-1 px-4 sm:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16 bg-white">
          {displayedItems.map((item, index) => {
            // Even rows (index 0, 2): Plate on Left, Info on Right
            // Odd rows (index 1, 3): Info on Left, Plate on Right
            const isLeftPlate = index % 2 === 0;

            const isNonVeg = item.tags?.some(t => /non-?veg|carne|pollo|res|cerdo|pescado|mariscos|prawn|mutton|meat/i.test(t)) ||
                             item.allergens?.some(a => /carne|pescado|mariscos/i.test(a)) ||
                             /mutton|chicken|carne|pollo|prawn|chingrir|lomo|pescado|beef|pork|fish/i.test(item.name);
            const isVeg = item.tags?.some(t => /veg|vegetariano|plant/i.test(t)) ||
                          /veg|soya|tarua|fritter|ensalada|tofu/i.test(item.name) ||
                          (!isNonVeg);

            // Title and Region parsing
            const originTag = item.tags?.find(t => t.startsWith('origin:') || t.startsWith('región:'))?.replace(/^(origin|región):/i, '')?.trim();
            const nameMatch = item.name.match(/^(.*?)\s*\((.*?)\)\s*$/);
            
            let mainName = item.name;
            let originText: string | null = null;

            if (nameMatch) {
              mainName = nameMatch[1].trim();
              originText = `(${nameMatch[2].trim()})`;
            } else if (originTag) {
              originText = `(${originTag})`;
            }

            // Decide whether origin is on a second line (like item 1 & item 4 in medioplato2.jpg)
            const isOriginOnSecondLine = Boolean(originText && mainName.length > 12);

            return (
              <div 
                key={item.id} 
                className="relative group transition-colors duration-150 rounded-xl hover:bg-neutral-50/50 p-1 sm:p-2"
              >
                {/* Live Edit Header Bar for Owners */}
                {isOwnerOrAdmin && isLiveEditActive && (
                  <div className="mb-3 p-2 rounded-lg bg-neutral-900 text-white font-sans text-xs flex items-center justify-between gap-2 shadow-sm z-20">
                    <span className="font-mono font-bold text-amber-300 line-clamp-1">{item.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onQuickPriceItem && (
                        <button
                          onClick={() => onQuickPriceItem(item)}
                          className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono font-bold"
                          title="Editar Precio"
                        >
                          {currencySymbol}{item.price.toFixed(0) === item.price.toString() ? item.price : item.price.toFixed(2)}
                        </button>
                      )}
                      {onQuickPhotoItem && (
                        <button
                          onClick={() => onQuickPhotoItem(item)}
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                          title="Cambiar Foto"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      )}
                      {onEditItem && (
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                          title="Editar Plato"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                      )}
                      {onDeleteItem && (
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 rounded bg-neutral-800 hover:bg-red-950 text-red-400"
                          title="Eliminar Plato"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 
                  MEDIO PLATO ROW:
                  - 2-column grid split down the center (50% / 50%).
                  - Plate sits as a clean semicircle flush against the center vertical line.
                  - Vertical dividing line extends slightly above and below the half-plate.
                  - Row alternates:
                    Left: Plate | Center Line | Right: Text (Left-aligned)
                    Left: Text (Right-aligned) | Center Line | Right: Plate
                */}
                <div className="grid grid-cols-2 items-center">
                  {isLeftPlate ? (
                    /* ------------------------------------------------------------- */
                    /* ODD ROW: PLATE ON LEFT, INFO ON RIGHT                         */
                    /* ------------------------------------------------------------- */
                    <>
                      {/* Left: Half-Plate Touching Center Line */}
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="relative flex items-center justify-end pr-0 cursor-pointer select-none group/plate"
                      >
                        {/* Half-Plate Semicircle Container */}
                        <div className="relative h-36 w-18 sm:h-52 sm:w-26 md:h-64 md:w-32 overflow-hidden rounded-l-full shadow-[0_4px_20px_rgba(0,0,0,0.12)] bg-neutral-50 shrink-0 transition-transform duration-300 group-hover/plate:scale-[1.02]">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="absolute right-0 top-0 h-full w-[200%] max-w-none object-cover pointer-events-none"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                              <Utensils className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                        </div>

                        {/* Crisp Vertical Dividing Line extending above and below */}
                        <div className="w-[1.5px] bg-neutral-900 shrink-0 h-44 sm:h-64 md:h-76 -mr-[0.75px] z-10" />
                      </div>

                      {/* Right: Text Block (Left-Aligned) */}
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="flex flex-col justify-center items-start text-left pl-5 sm:pl-8 md:pl-10 pr-2 sm:pr-4 cursor-pointer"
                      >
                        {/* Dish Name & Dietary Badge */}
                        {isOriginOnSecondLine ? (
                          <>
                            <h3 
                              className="text-base sm:text-xl md:text-2xl font-serif text-neutral-900 leading-snug tracking-tight font-normal"
                              style={{ fontFamily: dishNameFont }}
                            >
                              {mainName}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span 
                                className="text-base sm:text-xl md:text-2xl font-serif text-neutral-900 leading-snug tracking-tight font-normal"
                                style={{ fontFamily: dishNameFont }}
                              >
                                {originText}
                              </span>
                              <DietaryBadge isVeg={isVeg} isNonVeg={isNonVeg} />
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 
                              className="text-base sm:text-xl md:text-2xl font-serif text-neutral-900 leading-snug tracking-tight font-normal"
                              style={{ fontFamily: dishNameFont }}
                            >
                              {mainName}
                              {originText ? ` ${originText}` : ''}
                            </h3>
                            <DietaryBadge isVeg={isVeg} isNonVeg={isNonVeg} />
                          </div>
                        )}

                        {/* Dish Description: COMPLETELY VISIBLE, NO TRUNCATION */}
                        {item.description && (
                          <p 
                            className="text-xs sm:text-[13px] md:text-sm text-neutral-600 font-sans font-normal leading-relaxed mt-1 sm:mt-1.5"
                            style={{ fontFamily: dishDescFont }}
                          >
                            {item.description}
                          </p>
                        )}

                        {/* 5-Star Rating (★★★★☆) */}
                        <div className="flex items-center gap-0.5 text-[10px] sm:text-xs mt-3 sm:mt-4 tracking-wider">
                          <span className="text-neutral-900">★</span>
                          <span className="text-neutral-900">★</span>
                          <span className="text-neutral-900">★</span>
                          <span className="text-neutral-900">★</span>
                          <span className="text-neutral-300">★</span>
                        </div>

                        {/* Price */}
                        <div 
                          className="mt-3 sm:mt-4 md:mt-5 text-xl sm:text-2xl md:text-3xl font-serif text-neutral-900 font-normal tracking-tight"
                          style={{ fontFamily: dishPriceFont }}
                        >
                          {currencySymbol}{item.price % 1 === 0 ? item.price : item.price.toFixed(2)}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ------------------------------------------------------------- */
                    /* EVEN ROW: INFO ON LEFT, PLATE ON RIGHT                        */
                    /* ------------------------------------------------------------- */
                    <>
                      {/* Left: Text Block (Right-Aligned) */}
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="flex flex-col justify-center items-end text-right pr-5 sm:pr-8 md:pr-10 pl-2 sm:pl-4 cursor-pointer"
                      >
                        {/* Dish Name & Dietary Badge */}
                        {isOriginOnSecondLine ? (
                          <>
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <h3 
                                className="text-base sm:text-xl md:text-2xl font-serif text-neutral-900 leading-snug tracking-tight font-normal"
                                style={{ fontFamily: dishNameFont }}
                              >
                                {mainName}
                              </h3>
                              <DietaryBadge isVeg={isVeg} isNonVeg={isNonVeg} />
                            </div>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                              <span 
                                className="text-base sm:text-xl md:text-2xl font-serif text-neutral-900 leading-snug tracking-tight font-normal"
                                style={{ fontFamily: dishNameFont }}
                              >
                                {originText}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <h3 
                              className="text-base sm:text-xl md:text-2xl font-serif text-neutral-900 leading-snug tracking-tight font-normal"
                              style={{ fontFamily: dishNameFont }}
                            >
                              {mainName}
                              {originText ? ` ${originText}` : ''}
                            </h3>
                            <DietaryBadge isVeg={isVeg} isNonVeg={isNonVeg} />
                          </div>
                        )}

                        {/* Dish Description: COMPLETELY VISIBLE, NO TRUNCATION */}
                        {item.description && (
                          <p 
                            className="text-xs sm:text-[13px] md:text-sm text-neutral-600 font-sans font-normal leading-relaxed mt-1 sm:mt-1.5"
                            style={{ fontFamily: dishDescFont }}
                          >
                            {item.description}
                          </p>
                        )}

                        {/* 5-Star Rating (★★★★☆, Right-aligned) */}
                        <div className="flex items-center justify-end gap-0.5 text-[10px] sm:text-xs mt-3 sm:mt-4 tracking-wider">
                          <span className="text-neutral-900">★</span>
                          <span className="text-neutral-900">★</span>
                          <span className="text-neutral-900">★</span>
                          <span className="text-neutral-900">★</span>
                          <span className="text-neutral-300">★</span>
                        </div>

                        {/* Price */}
                        <div 
                          className="mt-3 sm:mt-4 md:mt-5 text-xl sm:text-2xl md:text-3xl font-serif text-neutral-900 font-normal tracking-tight"
                          style={{ fontFamily: dishPriceFont }}
                        >
                          {currencySymbol}{item.price % 1 === 0 ? item.price : item.price.toFixed(2)}
                        </div>
                      </div>

                      {/* Right: Half-Plate Touching Center Line */}
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="relative flex items-center justify-start pl-0 cursor-pointer select-none group/plate"
                      >
                        {/* Crisp Vertical Dividing Line extending above and below */}
                        <div className="w-[1.5px] bg-neutral-900 shrink-0 h-44 sm:h-64 md:h-76 -ml-[0.75px] z-10" />

                        {/* Half-Plate Semicircle Container */}
                        <div className="relative h-36 w-18 sm:h-52 sm:w-26 md:h-64 md:w-32 overflow-hidden rounded-r-full shadow-[0_4px_20px_rgba(0,0,0,0.12)] bg-neutral-50 shrink-0 transition-transform duration-300 group-hover/plate:scale-[1.02]">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="absolute left-0 top-0 h-full w-[200%] max-w-none object-cover pointer-events-none"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                              <Utensils className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </main>

        {/* Floating Cart Button */}
        {cartTotalItemsCount > 0 && (
          <div className="sticky bottom-4 z-40 px-4 flex justify-center pb-2">
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="px-6 py-3 rounded-full bg-neutral-950 text-white font-sans font-bold text-sm shadow-2xl flex items-center gap-3 hover:bg-black transition-transform duration-200 hover:scale-105 cursor-pointer border border-neutral-800"
            >
              <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-black">
                {cartTotalItemsCount}
              </div>
              <span>Ver Pedido</span>
              <span className="font-mono text-neutral-300 text-xs border-l border-neutral-800 pl-3">
                {currencySymbol} {cartGrandTotal.toFixed(2)}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Item Customization & Add to Cart Modal */}
      {selectedItemForCustomization && (
        <ItemOrderModal
          isOpen={Boolean(selectedItemForCustomization)}
          onClose={() => setSelectedItemForCustomization(null)}
          item={selectedItemForCustomization}
          onConfirmUnits={(qty, units) => {
            handleConfirmItemUnits(selectedItemForCustomization, qty, units);
            setSelectedItemForCustomization(null);
            setIsCartDrawerOpen(true);
          }}
          initialQuantity={1}
          branding={restaurant.branding}
        />
      )}

      {/* Unified Cart Drawer */}
      <UnifiedCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        restaurant={restaurant}
        cart={cart}
        onUpdateCart={setCart}
        onEditCartEntry={(item) => setSelectedItemForCustomization(item)}
        onOrderCreated={(order) => {
          if (onOrderCreated) onOrderCreated(order);
          setCart([]);
          setIsCartDrawerOpen(false);
        }}
        initialOrderType={activeChannel}
        initialTableNumber={initialTableNumber}
      />

      {/* Schedule Modal */}
      <ScheduleViewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        restaurant={restaurant}
      />
    </div>
  );
};
