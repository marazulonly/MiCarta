import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Check, 
  Plus, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Share2, 
  Utensils, 
  Sparkles, 
  Star, 
  ChefHat, 
  Bike, 
  Clock, 
  MapPin, 
  Edit3, 
  Camera, 
  Sliders, 
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order } from '../types';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';
import { ScheduleViewModal } from './ScheduleViewModal';

interface StartersEditorialMenuProps {
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
}

interface CartEntry {
  item: MenuItem;
  quantity: number;
  units: OrderItemUnit[];
}

export const StartersEditorialMenu: React.FC<StartersEditorialMenuProps> = ({
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
  onToggleAvailability,
  onAddNewItem,
  onEditBranding,
  onEditHeader,
}) => {
  const isDineInEnabled = restaurant.menuAccessSettings?.enableDineIn !== false;
  const isDeliveryEnabled = restaurant.menuAccessSettings?.enableDelivery !== false;
  
  const defaultChannel: 'DINE_IN' | 'DELIVERY' = 
    (!isDineInEnabled && isDeliveryEnabled) ? 'DELIVERY' :
    (!isDeliveryEnabled && isDineInEnabled) ? 'DINE_IN' :
    (initialMode === 'DELIVERY' ? 'DELIVERY' : 'DINE_IN');

  // Filter categories for this restaurant with robust fallback
  const rawCategories = categories.filter(c => c.restaurantId === restaurant.id);
  const currentCategories = rawCategories.length > 0
    ? rawCategories
    : [{ id: `cat-${restaurant.id}-general`, restaurantId: restaurant.id, name: 'Starters', sortOrder: 1, isActive: true }];

  const [activeCategory, setActiveCategory] = useState<string>(currentCategories[0]?.id || `cat-${restaurant.id}-general`);
  const [activeChannel, setActiveChannel] = useState<'DINE_IN' | 'DELIVERY'>(defaultChannel);

  useEffect(() => {
    if (activeCategory !== 'all' && currentCategories.length > 0 && !currentCategories.some(c => c.id === activeCategory)) {
      setActiveCategory(currentCategories[0].id);
    }
  }, [currentCategories, activeCategory]);

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Item customization modal
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);

  if (!isOpen) return null;

  // Custom colors and typography from branding
  const branding = restaurant.branding || {};
  const darkBgColor = branding.darkBgColor || '#03140E';
  const paperBgColor = branding.cardBgColor || '#FFFFFF';
  const accentGold = branding.primaryColor || '#D4AF37';

  // Filter items for restaurant and category
  const restaurantItems = items.filter(item => item.restaurantId === restaurant.id);
  const displayedItems = activeCategory === 'all'
    ? restaurantItems
    : restaurantItems.filter(item => item.categoryId === activeCategory);

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalCartPrice = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);

  const handleAddToCartCustomized = (item: MenuItem, quantity: number, units: OrderItemUnit[]) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(c => c.item.id === item.id);
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: copy[existingIdx].quantity + quantity,
          units: [...copy[existingIdx].units, ...units]
        };
        return copy;
      }
      return [...prev, { item, quantity, units }];
    });
    setSelectedItemForCustomization(null);
  };

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    const defaultUnit: OrderItemUnit = { unitNumber: 1, observation: '', selectedAddons: [] };
    handleAddToCartCustomized(item, 1, [defaultUnit]);
  };

  const handleCopyShareLink = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/?r=${restaurant.slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeCategoryObject = currentCategories.find(c => c.id === activeCategory);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-neutral-950/95 backdrop-blur-md flex flex-col font-serif">
      
      {/* TOP FLOATING CONTROL BAR */}
      <div className="sticky top-0 z-50 bg-neutral-900/95 border-b border-amber-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between text-neutral-200 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Plantilla:</span> Starters Editorial Identical
          </span>

          {isOwnerOrAdmin && onToggleLiveEdit && (
            <button
              onClick={onToggleLiveEdit}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition cursor-pointer border shrink-0 ${
                isLiveEditActive 
                  ? 'bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-400/20' 
                  : 'bg-neutral-800 text-amber-300 border-neutral-700 hover:border-amber-400'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isLiveEditActive ? 'Modo Edición ACTIVO' : 'Activar Edición'}</span>
            </button>
          )}

          {isOwnerOrAdmin && isLiveEditActive && (
            <>
              {onEditBranding && (
                <button
                  onClick={onEditBranding}
                  className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition cursor-pointer border border-neutral-700 flex items-center gap-1 shrink-0"
                  title="Personalizar Colores, Logo y Tipografías"
                >
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span className="hidden md:inline">Colores & Marca</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyShareLink}
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Copiar enlace directo"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer hidden sm:block"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 hover:text-white transition cursor-pointer"
            title="Cerrar carta"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT: DARK EMERALD MARBLE BACKGROUND WITH GOLD FOIL BORDERS */}
      <div 
        className="flex-1 py-6 px-2 sm:px-6 md:px-12 flex justify-center items-start min-h-screen"
        style={{
          backgroundColor: darkBgColor,
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(212,175,55,0.25) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(212,175,55,0.20) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(3,20,14,0.95) 0%, rgba(1,10,7,0.98) 100%)
          `
        }}
      >
        
        {/* CENTRAL WHITE PAPER CANVAS WITH DOUBLE METALLIC GOLD BORDER */}
        <div 
          className="w-full max-w-lg sm:max-w-xl md:max-w-2xl bg-white text-neutral-900 rounded-none shadow-2xl p-5 sm:p-10 relative border-4 border-amber-500/80 my-2 overflow-hidden transition-all"
          style={{
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.85), 0 0 40px rgba(212, 175, 55, 0.25)',
            backgroundColor: paperBgColor
          }}
        >
          {/* Inner Golden Double Border Frame */}
          <div className="absolute inset-2 border-2 border-amber-500/60 pointer-events-none" />
          <div className="absolute inset-3 border border-amber-600/30 pointer-events-none" />

          {/* CHANNEL SWITCHER (DINE-IN vs DELIVERY) */}
          {(isDineInEnabled && isDeliveryEnabled) && (
            <div className="flex justify-center mb-6 relative z-10">
              <div className="bg-neutral-100 p-1 rounded-full border border-neutral-300 flex gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveChannel('DINE_IN')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-sans font-bold transition cursor-pointer ${
                    activeChannel === 'DINE_IN'
                      ? 'bg-neutral-900 text-amber-300 shadow-md'
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                  <span>En Mesa</span>
                  {initialTableNumber && <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-mono">Mesa {initialTableNumber}</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveChannel('DELIVERY')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-sans font-bold transition cursor-pointer ${
                    activeChannel === 'DELIVERY'
                      ? 'bg-neutral-900 text-amber-300 shadow-md'
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5 text-amber-400" />
                  <span>Delivery</span>
                </button>
              </div>
            </div>
          )}

          {/* TOP HEADER: IDENTICAL TYPOGRAPHY FROM ATTACHED IMAGE */}
          <header className="text-center pt-2 pb-4 relative z-10">
            {/* Live edit button */}
            {isOwnerOrAdmin && isLiveEditActive && onEditHeader && (
              <button
                onClick={onEditHeader}
                className="mb-3 px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-sans font-bold shadow-md hover:bg-amber-300 transition cursor-pointer inline-flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Editar Logotipo & Cabecera</span>
              </button>
            )}

            {/* Custom Header Logo if provided */}
            {(branding.headerLogoUrl || restaurant.logoUrl) && (
              <div className="flex justify-center mb-3">
                <img
                  src={branding.headerLogoUrl || restaurant.logoUrl}
                  alt={restaurant.name}
                  className="max-h-20 max-w-full object-contain mx-auto"
                />
              </div>
            )}

            {/* 1. "the" IN ELEGANT SCRIPT CURSIVE FONT */}
            <p 
              className="text-3xl sm:text-4xl text-neutral-900 font-normal tracking-wide -mb-2"
              style={{ fontFamily: "'Alex Brush', 'Dancing Script', cursive" }}
            >
              the
            </p>

            {/* 2. "MENU" IN HUGE SERIF EXTRA BOLD CAPITAL LETTERS */}
            <h1 
              className="text-5xl sm:text-7xl font-serif font-black tracking-[0.25em] text-neutral-900 uppercase my-0"
              style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
            >
              MENU
            </h1>

            {/* 3. "Starters" (Category Header) IN CONDENSED EXTRA BOLD SANS */}
            <h2 
              className="text-3xl sm:text-4xl font-black text-black tracking-tight mt-1 uppercase"
              style={{ fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif", fontWeight: 900 }}
            >
              {activeCategory === 'all' ? 'Starters' : activeCategoryObject?.name || 'Starters'}
            </h2>

            {/* 4. ORNAMENTAL DIVIDER WITH CENTRAL FLOURISH */}
            <div className="flex items-center justify-center gap-3 my-4">
              <div className="h-[1px] w-20 sm:w-32 bg-neutral-400" />
              <svg className="w-5 h-5 text-neutral-700 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
              <div className="h-[1px] w-20 sm:w-32 bg-neutral-400" />
            </div>

            {/* Address & Hours button */}
            <div className="flex items-center justify-center gap-4 text-[11px] font-sans font-semibold text-neutral-600 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {restaurant.address}
              </span>
              <button 
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center gap-1 hover:text-amber-800 transition underline cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Horarios & Info</span>
              </button>
            </div>
          </header>

          {/* CATEGORY NAV TABS */}
          {currentCategories.length > 1 && (
            <nav className="py-3 my-2 flex items-center justify-center gap-2 overflow-x-auto scrollbar-none relative z-10 border-b border-neutral-200">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-neutral-900 text-amber-300 shadow'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Todas
              </button>

              {currentCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-neutral-900 text-amber-300 shadow'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>
          )}

          {/* Owner Add Item Button */}
          {isOwnerOrAdmin && isLiveEditActive && onAddNewItem && (
            <div className="text-center my-3 relative z-10">
              <button
                onClick={() => onAddNewItem(activeCategory !== 'all' ? activeCategory : undefined)}
                className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-sans font-bold text-xs shadow transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Agregar Plato a esta Sección</span>
              </button>
            </div>
          )}

          {/* DISHES LIST: IDENTICAL ZIG-ZAG ALTERNATING CIRCLE CUTOUT LAYOUT */}
          <div className="space-y-8 my-6 relative z-10">
            {displayedItems.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-neutral-300 rounded-xl">
                <Utensils className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600 font-sans font-medium">No hay platos en esta sección.</p>
              </div>
            ) : (
              displayedItems.map((item, index) => {
                const isEven = index % 2 === 1; // Alternating zig-zag flag
                const isNonVeg = item.tags?.includes('non-veg') || item.allergens?.includes('carne') || item.name.toLowerCase().includes('mutton') || item.name.toLowerCase().includes('chingrir') || item.name.toLowerCase().includes('lomo') || item.name.toLowerCase().includes('pollo') || item.name.toLowerCase().includes('ceviche');

                return (
                  <div 
                    key={item.id}
                    className="relative group pb-4 transition-all hover:bg-neutral-50 p-2 rounded-xl"
                  >
                    {/* Live Edit Controls */}
                    {isOwnerOrAdmin && isLiveEditActive && (
                      <div className="mb-2 p-2 rounded-lg bg-neutral-900 text-white font-sans text-xs flex items-center justify-between gap-2 shadow-lg z-20">
                        <span className="font-mono font-bold text-amber-300 line-clamp-1">{item.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {onQuickPriceItem && (
                            <button
                              onClick={() => onQuickPriceItem(item)}
                              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono font-bold"
                            >
                              S/ {item.price.toFixed(2)}
                            </button>
                          )}
                          {onQuickPhotoItem && (
                            <button
                              onClick={() => onQuickPhotoItem(item)}
                              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          )}
                          {onToggleAvailability && (
                            <button
                              onClick={() => onToggleAvailability(item)}
                              className={`px-2 py-1 rounded font-bold ${item.isAvailable ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                            >
                              {item.isAvailable ? 'Disponible' : 'Agotado'}
                            </button>
                          )}
                          {onEditItem && (
                            <button
                              onClick={() => onEditItem(item)}
                              className="px-2 py-1 rounded bg-amber-400 text-black font-bold"
                              title="Editar plato"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteItem && (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar el plato "${item.name}" definitivamente?`)) {
                                  onDeleteItem(item.id);
                                }
                              }}
                              className="px-2 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition"
                              title="Borrar plato"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ZIG-ZAG ROW CONTAINER */}
                    <div className={`flex items-center gap-4 sm:gap-8 ${isEven ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                      
                      {/* CIRCULAR DISH PHOTO WITH VERTICAL BLACK CUTOUT LINE */}
                      {item.imageUrl ? (
                        <div className={`shrink-0 flex items-center ${isEven ? 'pl-2 border-l-2 border-black' : 'pr-2 border-r-2 border-black'}`}>
                          <div className="w-28 sm:w-36 h-28 sm:h-36 rounded-full overflow-hidden bg-neutral-100 shadow-md relative border border-neutral-300 group-hover:scale-105 transition-transform duration-300">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                            />
                            {!item.isAvailable && (
                              <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-1 text-center">
                                <span className="text-[10px] font-sans font-black uppercase tracking-wider text-red-400 border border-red-500 px-1.5 py-0.5 rounded">
                                  Agotado
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* TEXT INFORMATION & PRICE */}
                      <div className="flex-1 min-w-0">
                        {/* Title & Dietary Badge */}
                        <div className={`flex items-center gap-2 flex-wrap ${isEven ? 'justify-end' : 'justify-start'}`}>
                          <h3 
                            className="text-base sm:text-xl font-serif text-neutral-900 font-semibold leading-tight tracking-tight"
                            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
                          >
                            {item.name}
                          </h3>

                          {/* Non-veg / Veg Badge Icon (Square with triangle/circle) */}
                          <div 
                            className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 p-0.5 ${
                              isNonVeg ? 'border-red-600' : 'border-emerald-600'
                            }`}
                            title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
                          >
                            {isNonVeg ? (
                              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-600" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs sm:text-sm text-neutral-600 font-serif italic mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* 5 Rating Stars */}
                        <div className={`flex items-center gap-0.5 my-1 text-neutral-800 ${isEven ? 'justify-end' : 'justify-start'}`}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-neutral-800 text-neutral-800" />
                          ))}
                        </div>

                        {/* Price & Quick Add Button */}
                        <div className={`mt-2 flex items-center gap-3 ${isEven ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-lg sm:text-xl font-serif font-bold text-neutral-900 tracking-tight">
                            S/ {item.price.toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(item, e)}
                            disabled={!item.isAvailable}
                            className={`px-3 py-1 rounded text-xs font-sans font-bold transition flex items-center gap-1 shadow cursor-pointer bg-neutral-900 text-amber-300 hover:bg-neutral-800 ${
                              !item.isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pedir</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER */}
          <footer className="mt-8 pt-4 border-t border-neutral-300 text-center text-xs text-neutral-500 font-serif italic">
            <p>Precios expresados en moneda local e incluyen impuestos. Consulte al personal por alergias o restricciones alimentarias.</p>
          </footer>

        </div>
      </div>

      {/* FLOATING CART SUMMARY BAR */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] w-[92%] max-w-md bg-neutral-900 text-white rounded-2xl p-3 shadow-2xl border border-amber-500/40 flex items-center justify-between gap-3 animate-slide-up backdrop-blur-md">
          <div className="flex items-center gap-3 pl-2">
            <div className="relative">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-black font-sans font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            </div>
            <div>
              <p className="text-xs font-sans text-neutral-400 font-medium">Tu Pedido</p>
              <p className="text-sm font-sans font-extrabold text-amber-300">S/ {totalCartPrice.toFixed(2)}</p>
            </div>
          </div>

          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-sans font-extrabold text-xs transition shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <span>Ver Carrito</span>
            <Check className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}

      {/* ITEM CUSTOMIZATION MODAL */}
      {selectedItemForCustomization && (
        <ItemOrderModal
          isOpen={Boolean(selectedItemForCustomization)}
          onClose={() => setSelectedItemForCustomization(null)}
          item={selectedItemForCustomization}
          onConfirm={handleAddToCartCustomized}
          themeAccentColor={restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#F59E0B'}
          themeDarkBg={restaurant.branding?.darkBgColor || '#0D1117'}
          dishCardBgColor={restaurant.branding?.dishCardBgColor || restaurant.branding?.cardBgColor}
          buttonTextColor={restaurant.branding?.buttonTextColor || '#000000'}
          textColor={restaurant.branding?.textColor}
          secondaryColor={restaurant.branding?.secondaryColor}
          dishNameFont={restaurant.branding?.dishNameFont}
          dishDescFont={restaurant.branding?.dishDescFont}
          dishPriceFont={restaurant.branding?.dishPriceFont}
        />
      )}

      {/* UNIFIED CART DRAWER */}
      <UnifiedCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cart={cart}
        onUpdateQuantity={(itemId, qty) => {
          setCart(prev => {
            if (qty <= 0) return prev.filter(c => c.item.id !== itemId);
            return prev.map(c => c.item.id === itemId ? { ...c, quantity: qty } : c);
          });
        }}
        onClearCart={() => setCart([])}
        restaurant={restaurant}
        activeChannel={activeChannel}
        initialTableNumber={initialTableNumber}
        onOrderCreated={(newOrd) => {
          setCart([]);
          setIsCartDrawerOpen(false);
          if (onOrderCreated) onOrderCreated(newOrd);
        }}
      />

      {/* SCHEDULE & INFO MODAL */}
      <ScheduleViewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        restaurant={restaurant}
      />

    </div>
  );
};
