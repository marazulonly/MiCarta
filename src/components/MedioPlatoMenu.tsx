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
  Star,
  ChefHat,
  Bike,
  Sparkles,
  Clock,
  MapPin,
  Edit3,
  Camera,
  Sliders,
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
  onToggleAvailability,
  onAddNewItem,
  onEditBranding,
  onEditHeader,
  onSaveToFirebase,
  isSavingFirebase
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
    secondaryColor: '#D4AF37',
    accentColor: '#D4AF37',
    darkBgColor: '#0B1E19',
    cardBgColor: '#FFFFFF',
    textColor: '#1A1A1A',
    fontDisplay: "'Playfair Display', serif",
    buttonColor: '#000000',
    buttonTextColor: '#FFFFFF',
    dishNameFont: "'Playfair Display', serif",
    dishDescFont: "'Plus Jakarta Sans', sans-serif",
    dishPriceFont: "'Playfair Display', serif"
  };

  const outerBg = branding.darkBgColor || '#0B1E19';
  const paperBg = branding.cardBgColor || '#FFFFFF';
  const textColor = branding.textColor || '#1A1A1A';
  const dishNameFont = branding.dishNameFont || "'Playfair Display', 'Cinzel', serif";
  const dishDescFont = branding.dishDescFont || "'Plus Jakarta Sans', sans-serif";
  const dishPriceFont = branding.dishPriceFont || "'Playfair Display', serif";

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 overflow-y-auto"
      style={{ backgroundColor: outerBg }}
    >
      {/* Background Luxury Texture Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30 bg-cover bg-center"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.15), transparent 70%), linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8))'
        }}
      />

      {/* Main Menu Page Canvas */}
      <div 
        className={`relative w-full ${
          isFullscreen ? 'max-w-5xl min-h-screen' : 'max-w-2xl min-h-[96vh]'
        } shadow-2xl transition-all duration-300 flex flex-col my-auto border-y sm:border-x sm:border-y border-amber-500/60 overflow-hidden`}
        style={{ 
          backgroundColor: paperBg,
          color: textColor,
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9), 0 0 35px rgba(212, 175, 55, 0.2)'
        }}
      >
        {/* Top Control Bar (Admin & Sharing) */}
        <div className="relative z-30 px-4 py-2.5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-serif font-bold tracking-wider text-amber-300 uppercase text-[11px]">
              {restaurant.name} · Carta Medio Plato
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOwnerOrAdmin && onToggleLiveEdit && (
              <button
                onClick={onToggleLiveEdit}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
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
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
              title="Copiar enlace"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer hidden sm:block"
              title="Pantalla completa"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {isOwnerOrAdmin && (
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white transition cursor-pointer"
                title="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Outer Golden Border Frame (Matching Reference Elegance) */}
        <div className="absolute inset-2 sm:inset-3 border border-amber-500/40 pointer-events-none z-20" />
        <div className="absolute inset-3 sm:inset-4 border border-amber-600/20 pointer-events-none z-20" />

        {/* Header Area: The Menu Starters */}
        <header className="relative z-10 pt-8 sm:pt-10 pb-4 px-6 text-center">
          {/* Channel Selector if both enabled */}
          {isDineInEnabled && isDeliveryEnabled && (
            <div className="flex justify-center mb-5">
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
                  <span>En Salón</span>
                  {initialTableNumber && (
                    <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-mono">
                      Mesa {initialTableNumber}
                    </span>
                  )}
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

          {/* Cursive "the" */}
          <p 
            className="text-3xl sm:text-4xl text-neutral-900 font-normal tracking-wide -mb-3"
            style={{ fontFamily: "'Alex Brush', 'Dancing Script', cursive" }}
          >
            the
          </p>

          {/* Huge Serif "MENU" */}
          <h1 
            className="text-5xl sm:text-7xl font-serif font-black tracking-[0.25em] text-neutral-900 uppercase my-0"
            style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
          >
            MENU
          </h1>

          {/* Active Category Title (e.g. Starters) */}
          <h2 
            className="text-3xl sm:text-4xl font-black text-black tracking-tight mt-1 uppercase"
            style={{ fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif", fontWeight: 900 }}
          >
            {activeCategory === 'all' ? (currentCategories[0]?.name || 'Starters') : (currentCategories.find(c => c.id === activeCategory)?.name || 'Starters')}
          </h2>

          {/* Flourish Divider */}
          <div className="flex items-center justify-center gap-3 my-4">
            <div className="h-[1px] w-20 sm:w-32 bg-neutral-400" />
            <svg className="w-5 h-5 text-neutral-700 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            <div className="h-[1px] w-20 sm:w-32 bg-neutral-400" />
          </div>

          {/* Location & Info */}
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

          {/* Category Pills Navigation */}
          {currentCategories.length > 1 && (
            <nav className="mt-5 pb-2 flex items-center justify-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
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
                  className={`px-3.5 py-1 rounded-full text-xs font-sans font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
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

          {/* Owner Quick Action: Add Item */}
          {isOwnerOrAdmin && isLiveEditActive && onAddNewItem && (
            <div className="mt-4">
              <button
                onClick={() => onAddNewItem(activeCategory !== 'all' ? activeCategory : undefined)}
                className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-sans font-bold text-xs shadow transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Agregar Plato a esta Sección</span>
              </button>
            </div>
          )}
        </header>

        {/* ========================================================================= */}
        {/* "MEDIO PLATO" DISHES SECTION — FAITHFUL VISUAL REPLICATION               */}
        {/* Alternating rows, clean photos with half-cut at center line, serif info  */}
        {/* ========================================================================= */}
        <main className="relative z-10 flex-1 px-3 sm:px-8 py-6 space-y-10 sm:space-y-14">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-neutral-300 rounded-2xl">
              <Utensils className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <p className="text-sm font-sans font-medium text-neutral-600">
                No hay platos registrados en esta sección.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isEven = index % 2 === 1; // Alternation flag
              const isNonVeg = item.tags?.includes('non-veg') || item.allergens?.includes('carne') || item.name.toLowerCase().includes('mutton') || item.name.toLowerCase().includes('chingrir') || item.name.toLowerCase().includes('lomo') || item.name.toLowerCase().includes('pollo') || item.name.toLowerCase().includes('carne') || item.name.toLowerCase().includes('pescado') || item.name.toLowerCase().includes('ceviche');
              const isVeg = item.tags?.includes('veg') || item.tags?.includes('vegetariano') || item.name.toLowerCase().includes('veg') || item.name.toLowerCase().includes('soya') || item.name.toLowerCase().includes('tarua') || item.name.toLowerCase().includes('ensalada');

              const categoryObj = categories.find(c => c.id === item.categoryId);
              const originOrCategory = item.tags?.find(t => t.startsWith('origin:') || t.startsWith('región:'))?.replace(/^(origin|región):/i, '') || categoryObj?.name;

              return (
                <div 
                  key={item.id}
                  className="relative group transition-colors duration-200 rounded-xl hover:bg-neutral-50/70 p-2 sm:p-3"
                >
                  {/* Live Edit Controls Header (if active) */}
                  {isOwnerOrAdmin && isLiveEditActive && (
                    <div className="mb-3 p-2 rounded-lg bg-neutral-900 text-white font-sans text-xs flex items-center justify-between gap-2 shadow-md">
                      <span className="font-mono font-bold text-amber-300 line-clamp-1">{item.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onQuickPriceItem && (
                          <button
                            onClick={() => onQuickPriceItem(item)}
                            className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono font-bold"
                            title="Editar Precio"
                          >
                            S/ {item.price.toFixed(2)}
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
                            title="Editar Plato Completo"
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
                    "MEDIO PLATO" ROW COMPOSITION:
                    - 50% left, 50% right.
                    - Sliced half plate touching the central dividing vertical line.
                    - Odd: [Image on Left (right-half cut)] | [Info on Right]
                    - Even: [Info on Left] | [Image on Right (left-half cut)]
                  */}
                  <div className="grid grid-cols-2 items-center min-h-[160px] sm:min-h-[210px]">
                    {/* LEFT COLUMN */}
                    {!isEven ? (
                      /* ODD ROW: PHOTO ON LEFT (Semi-circle touching center line) */
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="relative w-full h-36 sm:h-52 md:h-60 flex justify-end items-center overflow-hidden border-r-[1.5px] border-neutral-900 cursor-pointer pr-0 select-none group/img"
                      >
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
                            <Utensils className="w-8 h-8 text-neutral-400 -translate-x-4" />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* EVEN ROW: INFORMATION ON LEFT */
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="flex flex-col justify-center items-center text-center px-3 sm:px-8 py-2 border-r-[1.5px] border-neutral-900 cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                      >
                        {/* Dish Name + Dietary Badge */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <h3 
                            className="text-base sm:text-xl md:text-2xl font-serif font-bold text-neutral-900 leading-snug tracking-tight"
                            style={{ fontFamily: dishNameFont }}
                          >
                            {item.name}
                          </h3>

                          {/* Origin in parenthesis if exists */}
                          {originOrCategory && (
                            <span 
                              className="text-xs sm:text-sm font-serif font-medium text-red-700"
                              style={{ fontFamily: dishNameFont }}
                            >
                              ({originOrCategory})
                            </span>
                          )}

                          {/* Veg / Non-Veg Standard Dietary Badge */}
                          {isVeg ? (
                            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-emerald-600 flex items-center justify-center p-[2px] shrink-0" title="Vegetariano">
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600" />
                            </span>
                          ) : isNonVeg ? (
                            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-red-600 flex items-center justify-center p-[2px] shrink-0" title="No Vegetariano">
                              <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-600" />
                            </span>
                          ) : null}
                        </div>

                        {/* Dish Description */}
                        {item.description && (
                          <p 
                            className="text-[11px] sm:text-xs text-neutral-600 font-sans mt-1.5 line-clamp-2 max-w-xs"
                            style={{ fontFamily: dishDescFont }}
                          >
                            {item.description}
                          </p>
                        )}

                        {/* 5-Star Rating (★★★★★) */}
                        <div className="flex items-center gap-0.5 text-neutral-900 text-[10px] sm:text-xs mt-2 tracking-widest">
                          ★ ★ ★ ★ ★
                        </div>

                        {/* Price Display */}
                        <div 
                          className="mt-2.5 text-sm sm:text-lg md:text-xl font-bold text-neutral-900 font-serif"
                          style={{ fontFamily: dishPriceFont }}
                        >
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>
                    )}

                    {/* RIGHT COLUMN */}
                    {!isEven ? (
                      /* ODD ROW: INFORMATION ON RIGHT */
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="flex flex-col justify-center items-center text-center px-3 sm:px-8 py-2 cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                      >
                        {/* Dish Name + Dietary Badge */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <h3 
                            className="text-base sm:text-xl md:text-2xl font-serif font-bold text-neutral-900 leading-snug tracking-tight"
                            style={{ fontFamily: dishNameFont }}
                          >
                            {item.name}
                          </h3>

                          {/* Origin in parenthesis if exists */}
                          {originOrCategory && (
                            <span 
                              className="text-xs sm:text-sm font-serif font-medium text-red-700"
                              style={{ fontFamily: dishNameFont }}
                            >
                              ({originOrCategory})
                            </span>
                          )}

                          {/* Veg / Non-Veg Standard Dietary Badge */}
                          {isVeg ? (
                            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-emerald-600 flex items-center justify-center p-[2px] shrink-0" title="Vegetariano">
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600" />
                            </span>
                          ) : isNonVeg ? (
                            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border border-red-600 flex items-center justify-center p-[2px] shrink-0" title="No Vegetariano">
                              <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-600" />
                            </span>
                          ) : null}
                        </div>

                        {/* Dish Description */}
                        {item.description && (
                          <p 
                            className="text-[11px] sm:text-xs text-neutral-600 font-sans mt-1.5 line-clamp-2 max-w-xs"
                            style={{ fontFamily: dishDescFont }}
                          >
                            {item.description}
                          </p>
                        )}

                        {/* 5-Star Rating (★★★★★) */}
                        <div className="flex items-center gap-0.5 text-neutral-900 text-[10px] sm:text-xs mt-2 tracking-widest">
                          ★ ★ ★ ★ ★
                        </div>

                        {/* Price Display */}
                        <div 
                          className="mt-2.5 text-sm sm:text-lg md:text-xl font-bold text-neutral-900 font-serif"
                          style={{ fontFamily: dishPriceFont }}
                        >
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      /* EVEN ROW: PHOTO ON RIGHT (Semi-circle touching center line) */
                      <div 
                        onClick={() => setSelectedItemForCustomization(item)}
                        className="relative w-full h-36 sm:h-52 md:h-60 flex justify-start items-center overflow-hidden cursor-pointer pl-0 select-none group/img"
                      >
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
                            <Utensils className="w-8 h-8 text-neutral-400 translate-x-4" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </main>

        {/* Floating Cart Button */}
        {cartTotalItemsCount > 0 && (
          <div className="sticky bottom-4 z-40 px-4 flex justify-center pb-4">
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="px-6 py-3 rounded-full bg-neutral-900 text-amber-300 font-sans font-bold text-sm shadow-2xl flex items-center gap-3 hover:bg-black transition-transform duration-200 hover:scale-105 cursor-pointer border border-amber-400/40"
            >
              <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-black">
                {cartTotalItemsCount}
              </div>
              <span>Ver Pedido</span>
              <span className="font-mono text-white text-xs border-l border-neutral-700 pl-3">
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
