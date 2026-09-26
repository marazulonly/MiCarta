import React, { useState, useEffect } from 'react';
import { 
  X, 
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
    : [{ id: `cat-${restaurant.id}-general`, restaurantId: restaurant.id, name: 'Platos', sortOrder: 1, isActive: true }];

  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Interactive Cart & Selection State
  const [cart, setCart] = useState<CartItemEntry[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter Items by channel and category
  const filteredItems = items.filter(item => {
    if (item.restaurantId !== restaurant.id) return false;
    
    // Channel Scope
    if (activeChannel === 'DINE_IN' && item.targetMenuScope === 'DELIVERY') return false;
    if (activeChannel === 'DELIVERY' && item.targetMenuScope === 'DINE_IN') return false;

    // Category Scope
    if (activeCategory === 'all') return true;
    return item.categoryId === activeCategory;
  });

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
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-neutral-900 overflow-y-auto">
      {/* Top Floating Control Bar (Minimal & Unobtrusive) */}
      <div className="sticky top-0 z-40 px-4 py-2.5 bg-white/95 backdrop-blur-md border-b border-neutral-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-serif font-semibold text-neutral-800 text-[12px] tracking-wide">
            {restaurant.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOwnerOrAdmin && onToggleLiveEdit && (
            <button
              onClick={onToggleLiveEdit}
              className={`px-2.5 py-1 rounded text-[10px] font-sans font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isLiveEditActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isLiveEditActive ? 'Edición Activa' : 'Editar Carta'}</span>
            </button>
          )}

          <button 
            onClick={copyUrl}
            className="p-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
            title="Copiar enlace"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer hidden sm:block"
            title="Pantalla completa"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {isOwnerOrAdmin && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-600 transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Container - Pure White Canvas identical to medioplato2.jpg */}
      <div className={`w-full mx-auto ${isFullscreen ? 'max-w-4xl' : 'max-w-2xl'} px-3 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col`}>
        
        {/* Optional Secondary Channels Switcher & Category Filter (Minimal) */}
        {(isDineInEnabled && isDeliveryEnabled) || currentCategories.length > 1 ? (
          <div className="mb-8 flex flex-col items-center gap-3">
            {isDineInEnabled && isDeliveryEnabled && (
              <div className="bg-neutral-100 p-1 rounded-full flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveChannel('DINE_IN')}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-sans font-semibold transition cursor-pointer ${
                    activeChannel === 'DINE_IN'
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <ChefHat className="w-3 h-3" />
                  <span>En Salón</span>
                  {initialTableNumber && (
                    <span className="text-[10px] bg-neutral-700 text-white px-1 rounded">
                      Mesa {initialTableNumber}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChannel('DELIVERY')}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-sans font-semibold transition cursor-pointer ${
                    activeChannel === 'DELIVERY'
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Bike className="w-3 h-3" />
                  <span>Delivery</span>
                </button>
              </div>
            )}

            {currentCategories.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto max-w-full pb-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-sans font-medium transition cursor-pointer whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Todos
                </button>
                {currentCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-sans font-medium transition cursor-pointer whitespace-nowrap ${
                      activeCategory === cat.id
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Owner Quick Action: Add Item */}
        {isOwnerOrAdmin && isLiveEditActive && onAddNewItem && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={() => onAddNewItem(activeCategory !== 'all' ? activeCategory : undefined)}
              className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-sans font-medium text-xs shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Agregar Plato</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* "MEDIO PLATO" DISHES SECTION — FAITHFUL REPLICA OF medioplato2.jpg        */}
        {/* ========================================================================= */}
        <div className="space-y-12 sm:space-y-16">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 px-4 border border-dashed border-neutral-200 rounded-xl">
              <Utensils className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs font-sans text-neutral-500">
                No hay platos registrados en esta sección.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isEven = index % 2 === 1; // Alternation flag
              
              // Dietary Tag Detection (Veg / Non-Veg)
              const isExplicitNonVeg = item.tags?.includes('non-veg') || item.allergens?.includes('carne') || item.name.toLowerCase().includes('mutton') || item.name.toLowerCase().includes('chingrir') || item.name.toLowerCase().includes('lomo') || item.name.toLowerCase().includes('pollo') || item.name.toLowerCase().includes('carne') || item.name.toLowerCase().includes('prawn') || item.name.toLowerCase().includes('pescado');
              const isExplicitVeg = item.tags?.includes('veg') || item.tags?.includes('vegetariano') || item.name.toLowerCase().includes('soya') || item.name.toLowerCase().includes('tarua') || item.name.toLowerCase().includes('ensalada');
              const isVeg = isExplicitVeg && !isExplicitNonVeg;
              const isNonVeg = isExplicitNonVeg;

              // Parse name and origin if present e.g. "Mutton Goli Chaat (Bihari)" or "Chingrir Chop (West Bengal)"
              let displayName = item.name;
              let subtitle = '';

              const matchParens = item.name.match(/^(.*?)\s*(\(.*?\))\s*$/);
              if (matchParens) {
                displayName = matchParens[1].trim();
                subtitle = matchParens[2].trim();
              } else {
                const categoryObj = categories.find(c => c.id === item.categoryId);
                const tagOrigin = item.tags?.find(t => t.startsWith('origin:') || t.startsWith('región:'))?.replace(/^(origin|región):/i, '');
                if (tagOrigin) {
                  subtitle = `(${tagOrigin})`;
                } else if (categoryObj && categoryObj.name !== 'Platos' && categoryObj.name !== 'General') {
                  subtitle = `(${categoryObj.name})`;
                }
              }

              return (
                <div key={item.id} className="relative group">
                  {/* Live Edit Controls Header (if active) */}
                  {isOwnerOrAdmin && isLiveEditActive && (
                    <div className="mb-2 p-1.5 rounded bg-neutral-900 text-white font-sans text-xs flex items-center justify-between gap-2 shadow-sm">
                      <span className="font-mono font-bold text-amber-300 text-[11px] line-clamp-1">{item.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {onQuickPriceItem && (
                          <button
                            onClick={() => onQuickPriceItem(item)}
                            className="px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono text-[10px]"
                            title="Editar Precio"
                          >
                            S/ {item.price.toFixed(2)}
                          </button>
                        )}
                        {onQuickPhotoItem && (
                          <button
                            onClick={() => onQuickPhotoItem(item)}
                            className="p-1 rounded bg-neutral-800 text-neutral-200"
                            title="Cambiar Foto"
                          >
                            <ImageIcon className="w-3 h-3 text-amber-400" />
                          </button>
                        )}
                        {onEditItem && (
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1 rounded bg-neutral-800 text-neutral-200"
                            title="Editar Plato"
                          >
                            <Edit3 className="w-3 h-3 text-blue-400" />
                          </button>
                        )}
                        {onDeleteItem && (
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 rounded bg-neutral-800 text-red-400"
                            title="Eliminar Plato"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 
                    GRID OF 2 COLUMNS:
                    - Odd: [Image on Left | Cut at Center line with individual vertical line] | [Left-aligned text on Right]
                    - Even: [Right-aligned text on Left] | [Image on Right | Cut at Center line with individual vertical line]
                  */}
                  <div className="grid grid-cols-2 items-center">
                    
                    {/* ============================================================== */}
                    {/* LEFT COLUMN                                                    */}
                    {/* ============================================================== */}
                    {!isEven ? (
                      /* ODD ROW: PHOTO ON LEFT (Semi-circle touching center line) */
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="relative w-full flex justify-end items-center cursor-pointer select-none group/img"
                      >
                        {/* Semi-circle dish container (Right-half hidden at center edge) */}
                        <div className="relative flex justify-end items-center overflow-hidden h-36 sm:h-52 md:h-60 w-full pr-0">
                          {item.imageUrl ? (
                            <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full overflow-hidden shrink-0 translate-x-1/2 transition-transform duration-300 group-hover/img:scale-105">
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="w-full h-full object-cover select-none pointer-events-none"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 translate-x-1/2">
                              <Utensils className="w-6 h-6 text-neutral-400 -translate-x-3" />
                            </div>
                          )}
                        </div>

                        {/* Distinct vertical black cut line extending slightly above and below the diameter */}
                        <div 
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-[1.5px] bg-black z-10 pointer-events-none"
                          style={{ height: 'calc(100% + 20px)' }}
                        />
                      </div>
                    ) : (
                      /* EVEN ROW: TEXT ON LEFT (Right-aligned facing center) */
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="flex flex-col justify-center items-end text-right pr-4 sm:pr-8 cursor-pointer select-none"
                      >
                        {/* Title with dietary badge */}
                        <div className="flex flex-col items-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <h3 
                              className="text-base sm:text-2xl font-serif text-neutral-900 leading-snug tracking-tight font-medium"
                              style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                            >
                              {displayName}
                            </h3>

                            {/* Dietary Badge if no subtitle */}
                            {!subtitle && isVeg && (
                              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-emerald-600 flex items-center justify-center p-[2px] shrink-0" title="Vegetariano">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600" />
                              </span>
                            )}
                            {!subtitle && isNonVeg && (
                              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-red-600 flex items-center justify-center p-[2px] shrink-0" title="No Vegetariano">
                                <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-600" />
                              </span>
                            )}
                          </div>

                          {/* Subtitle / Origin on second line with badge */}
                          {subtitle && (
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                              <span 
                                className="text-sm sm:text-xl font-serif text-neutral-900 font-medium"
                                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                              >
                                {subtitle}
                              </span>

                              {isVeg && (
                                <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-emerald-600 flex items-center justify-center p-[2px] shrink-0" title="Vegetariano">
                                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600" />
                                </span>
                              )}
                              {isNonVeg && (
                                <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-red-600 flex items-center justify-center p-[2px] shrink-0" title="No Vegetariano">
                                  <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-600" />
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Full Description without clipping/truncation */}
                        {item.description && (
                          <p className="text-[11px] sm:text-xs text-neutral-600 font-sans mt-2 leading-relaxed break-words whitespace-normal text-right max-w-sm">
                            {item.description}
                          </p>
                        )}

                        {/* 5-Star Rating (★★★★★) */}
                        <div className="flex items-center justify-end gap-0.5 text-neutral-800 text-[10px] sm:text-[11px] mt-2 tracking-widest">
                          ★ ★ ★ ★ ★
                        </div>

                        {/* Price Display */}
                        <div 
                          className="mt-3 text-base sm:text-xl font-serif font-bold text-neutral-900"
                          style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                        >
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>
                    )}

                    {/* ============================================================== */}
                    {/* RIGHT COLUMN                                                   */}
                    {/* ============================================================== */}
                    {!isEven ? (
                      /* ODD ROW: TEXT ON RIGHT (Left-aligned facing center) */
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="flex flex-col justify-center items-start text-left pl-4 sm:pl-8 cursor-pointer select-none"
                      >
                        {/* Title with dietary badge */}
                        <div className="flex flex-col items-start">
                          <div className="flex items-center justify-start gap-1.5">
                            <h3 
                              className="text-base sm:text-2xl font-serif text-neutral-900 leading-snug tracking-tight font-medium"
                              style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                            >
                              {displayName}
                            </h3>

                            {/* Dietary Badge if no subtitle */}
                            {!subtitle && isVeg && (
                              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-emerald-600 flex items-center justify-center p-[2px] shrink-0" title="Vegetariano">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600" />
                              </span>
                            )}
                            {!subtitle && isNonVeg && (
                              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-red-600 flex items-center justify-center p-[2px] shrink-0" title="No Vegetariano">
                                <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-600" />
                              </span>
                            )}
                          </div>

                          {/* Subtitle / Origin on second line with badge */}
                          {subtitle && (
                            <div className="flex items-center justify-start gap-1.5 mt-0.5">
                              <span 
                                className="text-sm sm:text-xl font-serif text-neutral-900 font-medium"
                                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                              >
                                {subtitle}
                              </span>

                              {isVeg && (
                                <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-emerald-600 flex items-center justify-center p-[2px] shrink-0" title="Vegetariano">
                                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600" />
                                </span>
                              )}
                              {isNonVeg && (
                                <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-red-600 flex items-center justify-center p-[2px] shrink-0" title="No Vegetariano">
                                  <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-600" />
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Full Description without clipping/truncation */}
                        {item.description && (
                          <p className="text-[11px] sm:text-xs text-neutral-600 font-sans mt-2 leading-relaxed break-words whitespace-normal text-left max-w-sm">
                            {item.description}
                          </p>
                        )}

                        {/* 5-Star Rating (★★★★★) */}
                        <div className="flex items-center justify-start gap-0.5 text-neutral-800 text-[10px] sm:text-[11px] mt-2 tracking-widest">
                          ★ ★ ★ ★ ★
                        </div>

                        {/* Price Display */}
                        <div 
                          className="mt-3 text-base sm:text-xl font-serif font-bold text-neutral-900"
                          style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                        >
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      /* EVEN ROW: PHOTO ON RIGHT (Semi-circle touching center line) */
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="relative w-full flex justify-start items-center cursor-pointer select-none group/img"
                      >
                        {/* Distinct vertical black cut line extending slightly above and below the diameter */}
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[1.5px] bg-black z-10 pointer-events-none"
                          style={{ height: 'calc(100% + 20px)' }}
                        />

                        {/* Semi-circle dish container (Left-half hidden at center edge) */}
                        <div className="relative flex justify-start items-center overflow-hidden h-36 sm:h-52 md:h-60 w-full pl-0">
                          {item.imageUrl ? (
                            <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full overflow-hidden shrink-0 -translate-x-1/2 transition-transform duration-300 group-hover/img:scale-105">
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="w-full h-full object-cover select-none pointer-events-none"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 -translate-x-1/2">
                              <Utensils className="w-6 h-6 text-neutral-400 translate-x-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Cart Button */}
        {cartTotalItemsCount > 0 && (
          <div className="sticky bottom-6 z-40 px-4 flex justify-center pb-2 mt-8">
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="px-6 py-3 rounded-full bg-neutral-900 text-white font-sans font-semibold text-xs shadow-xl flex items-center gap-3 hover:bg-black transition-transform duration-200 hover:scale-105 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white text-neutral-900 flex items-center justify-center text-[11px] font-bold">
                {cartTotalItemsCount}
              </div>
              <span>Ver Pedido</span>
              <span className="font-mono text-neutral-300 text-xs border-l border-neutral-700 pl-3">
                S/ {cartGrandTotal.toFixed(2)}
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
