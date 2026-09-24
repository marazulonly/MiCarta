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
  Flame, 
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

interface EditorialGrandMenuProps {
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

interface CartEntry {
  item: MenuItem;
  quantity: number;
  units: OrderItemUnit[];
}

export const EditorialGrandMenu: React.FC<EditorialGrandMenuProps> = ({
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
  isSavingFirebase = false,
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
    : [{ id: `cat-${restaurant.id}-general`, restaurantId: restaurant.id, name: 'Entradas & Especialidades', sortOrder: 1, isActive: true }];

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
  const darkBgColor = branding.darkBgColor || '#051811';
  const paperBgColor = branding.cardBgColor || '#FAF8F5';
  const accentGold = branding.primaryColor || '#D4AF37';
  const textColor = branding.textColor || '#1A1A1A';
  const buttonColor = branding.buttonColor || '#1A1A1A';
  const buttonTextColor = branding.buttonTextColor || '#FFFFFF';

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
      <div className="sticky top-0 z-50 bg-neutral-900/90 border-b border-amber-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between text-neutral-200 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Plantilla:</span> Editorial Grand Menu
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

              {onSaveToFirebase && (
                <button
                  onClick={onSaveToFirebase}
                  disabled={isSavingFirebase}
                  className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1 shrink-0 shadow"
                >
                  <Check className="w-3 h-3" />
                  <span>{isSavingFirebase ? 'Guardando...' : 'Guardar en Nube'}</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyShareLink}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer border border-neutral-700"
            title="Copiar Link de la Carta"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer border border-neutral-700 hidden sm:flex"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold transition cursor-pointer shadow-lg"
            title="Cerrar Carta"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER: DEEP EMERALD MARBLE WALLPAPER WITH PARCHMENT CARD */}
      <div 
        className="flex-1 py-6 px-3 sm:px-6 md:px-12 flex justify-center items-start min-h-screen"
        style={{
          backgroundColor: darkBgColor,
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 60%), radial-gradient(circle at 80% 90%, rgba(212,175,55,0.08) 0%, transparent 50%)`
        }}
      >
        
        {/* INNER PARCHMENT SHEET WITH DOUBLE GOLD & CHARCOAL BORDER */}
        <div 
          className="w-full max-w-2xl rounded-xl shadow-2xl p-4 sm:p-8 relative border-2 border-amber-500/40 my-2 overflow-hidden transition-all"
          style={{
            backgroundColor: paperBgColor,
            color: textColor,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.15)'
          }}
        >
          {/* Inner Decorative Gold Border Box */}
          <div className="absolute inset-2 border border-neutral-800/20 rounded-lg pointer-events-none" />
          <div className="absolute inset-3 border border-amber-600/30 rounded-lg pointer-events-none" />

          {/* CHANNEL SWITCHER (DINE-IN vs DELIVERY) */}
          {(isDineInEnabled && isDeliveryEnabled) && (
            <div className="flex justify-center mb-6 relative z-10">
              <div className="bg-neutral-900/10 p-1 rounded-full border border-neutral-900/20 flex gap-1 shadow-inner">
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
                  <span>Atención en Mesa</span>
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
                  <span>Pedido Delivery</span>
                </button>
              </div>
            </div>
          )}

          {/* HEADER: EDITORIAL BRANDING & RESTAURANT LOGO */}
          <header className="text-center pt-2 pb-6 border-b border-neutral-900/15 relative z-10">
            {/* Live edit button for header */}
            {isOwnerOrAdmin && isLiveEditActive && onEditHeader && (
              <button
                onClick={onEditHeader}
                className="mb-3 px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-sans font-bold shadow-md hover:bg-amber-300 transition cursor-pointer inline-flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Editar Logotipo & Título de Cabecera</span>
              </button>
            )}

            {/* Subtitle script font */}
            <p className="text-2xl sm:text-3xl font-serif italic text-neutral-800 tracking-wide font-normal">
              the
            </p>

            {/* Main Title / Logo */}
            {branding.headerLogoUrl ? (
              <div className="flex justify-center my-2">
                <img 
                  src={branding.headerLogoUrl} 
                  alt={restaurant.name} 
                  className="max-h-24 sm:max-h-32 object-contain"
                />
              </div>
            ) : null}

            {branding.showHeaderName !== false && (
              <h1 
                className="text-3xl sm:text-5xl font-black uppercase tracking-widest text-neutral-900 my-1 font-serif"
                style={{
                  fontFamily: branding.restaurantNameFont || branding.fontDisplay || 'inherit',
                  color: branding.restaurantNameColor || '#111827'
                }}
              >
                {restaurant.name}
              </h1>
            )}

            {branding.showHeaderTagline !== false && restaurant.tagline && (
              <p className="text-xs sm:text-sm font-serif italic text-neutral-600 mt-1 max-w-md mx-auto">
                {restaurant.tagline}
              </p>
            )}

            <div className="flex items-center justify-center gap-4 text-[11px] font-sans font-semibold text-neutral-700 mt-3 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {restaurant.address}
              </span>
              <button 
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center gap-1 hover:text-amber-700 transition underline cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Horarios & Info</span>
              </button>
            </div>
          </header>

          {/* CATEGORY NAV TABS (PARCHMENT ELEGANT BUTTONS) */}
          <nav className="py-4 my-2 flex items-center justify-center gap-2 overflow-x-auto scrollbar-none relative z-10 border-b border-neutral-900/10">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-sans font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap border ${
                activeCategory === 'all'
                  ? 'bg-neutral-900 text-amber-300 border-neutral-900 shadow-md'
                  : 'bg-white/60 text-neutral-800 border-neutral-300 hover:bg-white hover:border-neutral-900'
              }`}
            >
              Todas las Secciones
            </button>

            {currentCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-sans font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap border ${
                  activeCategory === cat.id
                    ? 'bg-neutral-900 text-amber-300 border-neutral-900 shadow-md'
                    : 'bg-white/60 text-neutral-800 border-neutral-300 hover:bg-white hover:border-neutral-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>

          {/* SECTION HEADER TITLE WITH DECORATIVE FLOURISH */}
          <div className="text-center my-6 relative z-10">
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-12 sm:w-20 bg-neutral-900/30" />
              <span className="text-neutral-800 text-xs">◆</span>
              <h2 className="text-xl sm:text-3xl font-black uppercase tracking-wider font-sans text-neutral-900">
                {activeCategory === 'all' ? 'Carta General' : activeCategoryObject?.name || 'Menú Especial'}
              </h2>
              <span className="text-neutral-800 text-xs">◆</span>
              <div className="h-[1px] w-12 sm:w-20 bg-neutral-900/30" />
            </div>

            {/* Owner Add Dish button */}
            {isOwnerOrAdmin && isLiveEditActive && onAddNewItem && (
              <button
                onClick={() => onAddNewItem(activeCategory !== 'all' ? activeCategory : undefined)}
                className="mt-3 px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-sans font-bold text-xs shadow transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Agregar Plato a esta Sección</span>
              </button>
            )}
          </div>

          {/* DISHES LIST: ALTERNATING ZIG-ZAG HALF-CIRCLE PHOTOS WITH VERTICAL DIVIDER LINE */}
          <div className="space-y-8 my-6 relative z-10">
            {displayedItems.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-neutral-400/40 rounded-xl">
                <Utensils className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600 font-sans font-medium">No hay platos registrados en esta sección.</p>
              </div>
            ) : (
              displayedItems.map((item, index) => {
                const isEven = index % 2 === 1; // Alternating layout flag!
                
                return (
                  <div 
                    key={item.id}
                    className="relative group border-b border-neutral-900/10 pb-6 transition-all hover:bg-neutral-900/[0.02] p-2 rounded-xl"
                  >
                    {/* Live Edit Controls Overlay for Dish */}
                    {isOwnerOrAdmin && isLiveEditActive && (
                      <div className="mb-3 p-2 rounded-lg bg-neutral-900 text-white font-sans text-xs flex items-center justify-between gap-2 shadow-lg z-20">
                        <span className="font-mono font-bold text-amber-300 line-clamp-1">{item.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {onQuickPriceItem && (
                            <button
                              onClick={() => onQuickPriceItem(item)}
                              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono font-bold"
                              title="Cambiar Precio"
                            >
                              S/ {item.price.toFixed(2)}
                            </button>
                          )}
                          {onQuickPhotoItem && (
                            <button
                              onClick={() => onQuickPhotoItem(item)}
                              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                              title="Cambiar Foto"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          )}
                          {onToggleAvailability && (
                            <button
                              onClick={() => onToggleAvailability(item)}
                              className={`px-2 py-1 rounded font-bold ${item.isAvailable ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                              title="Disponibilidad"
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

                    {/* ZIG-ZAG ALTERNATING ITEM CONTAINER */}
                    <div className={`flex items-center gap-4 sm:gap-6 ${isEven ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                      
                      {/* HALF-CIRCLE IMAGE WITH VERTICAL LINE */}
                      {item.imageUrl ? (
                        <div className={`shrink-0 flex items-center ${isEven ? 'pl-2 border-l-2 border-neutral-900' : 'pr-2 border-r-2 border-neutral-900'}`}>
                          <div 
                            className={`w-24 sm:w-36 h-24 sm:h-36 overflow-hidden bg-neutral-900/10 shadow-md border border-neutral-900/20 relative group-hover:scale-105 transition-transform duration-300 ${
                              isEven ? 'rounded-l-full' : 'rounded-r-full'
                            }`}
                          >
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                            />
                            {!item.isAvailable && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-1 text-center">
                                <span className="text-[10px] font-sans font-black uppercase tracking-wider text-red-400 border border-red-500 px-1.5 py-0.5 rounded">
                                  Agotado
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* DISH DETAILS (Title, Desc, Stars, Price & Action) */}
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 flex-wrap ${isEven ? 'justify-end' : 'justify-start'}`}>
                          <h3 
                            className="text-base sm:text-xl font-bold text-neutral-900 tracking-tight leading-snug font-serif"
                            style={{
                              fontFamily: branding.dishNameFont || branding.fontDisplay || 'inherit'
                            }}
                          >
                            {item.name}
                          </h3>

                          {/* Non-veg/Veg/Spicy badges */}
                          {item.tags?.includes('spicy') && (
                            <span className="text-[10px] text-red-600 font-sans font-bold flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                            </span>
                          )}
                          {item.isPopular && (
                            <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-sans font-extrabold uppercase">
                              Estrella
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p 
                            className="text-xs sm:text-sm text-neutral-700 font-serif italic mt-1 leading-relaxed"
                            style={{
                              fontFamily: branding.dishDescFont || 'inherit'
                            }}
                          >
                            {item.description}
                          </p>
                        )}

                        {/* Star Rating Line */}
                        <div className={`flex items-center gap-1 my-1.5 text-amber-500 ${isEven ? 'justify-end' : 'justify-start'}`}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                          ))}
                        </div>

                        {/* Price & Add Button */}
                        <div className={`mt-2 flex items-center gap-3 ${isEven ? 'justify-end' : 'justify-start'}`}>
                          <span 
                            className="text-base sm:text-xl font-black text-neutral-900 font-serif tracking-tight"
                            style={{
                              color: branding.priceColor || '#111827',
                              fontFamily: branding.dishPriceFont || 'inherit'
                            }}
                          >
                            S/ {item.price.toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(item, e)}
                            disabled={!item.isAvailable}
                            style={{
                              backgroundColor: buttonColor,
                              color: buttonTextColor
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition flex items-center gap-1 shadow-md cursor-pointer ${
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

          {/* FOOTER NOTICE */}
          <footer className="mt-8 pt-4 border-t border-neutral-900/15 text-center font-sans text-neutral-600 text-xs relative z-10">
            <p className="font-semibold text-neutral-800">Precios incluyen IGV & Servicio de Mesa.</p>
            <p className="text-[11px] mt-0.5 text-neutral-500">Carta digital impulsada por AI Studio MiCarta SaaS.</p>
          </footer>

        </div>
      </div>

      {/* FLOATING CART BAR AT BOTTOM */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-neutral-900 text-white rounded-2xl p-3 shadow-2xl border border-amber-400/50 flex items-center justify-between font-sans animate-slide-up">
          <div className="flex items-center gap-3 pl-2">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black font-black flex items-center justify-center text-sm shadow">
              {totalCartCount}
            </div>
            <div>
              <span className="text-[11px] text-amber-300 block font-mono">Tu Pedido</span>
              <span className="text-base font-black font-mono">S/ {totalCartPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ver Pedido</span>
          </button>
        </div>
      )}

      {/* UNIFIED CART DRAWER MODAL */}
      <UnifiedCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        restaurant={restaurant}
        cartItems={cart}
        onUpdateQuantity={(itemId, qty) => {
          setCart(prev => {
            if (qty <= 0) return prev.filter(c => c.item.id !== itemId);
            return prev.map(c => c.item.id === itemId ? { ...c, quantity: qty } : c);
          });
        }}
        onClearCart={() => setCart([])}
        onOrderCreated={(newOrder) => {
          onOrderCreated && onOrderCreated(newOrder);
          setCart([]);
          setIsCartDrawerOpen(false);
        }}
        initialMode={activeChannel}
        initialTableNumber={initialTableNumber}
      />

      {/* ITEM CUSTOMIZATION MODAL */}
      {selectedItemForCustomization && (
        <ItemOrderModal
          isOpen={Boolean(selectedItemForCustomization)}
          onClose={() => setSelectedItemForCustomization(null)}
          item={selectedItemForCustomization}
          onConfirm={handleAddToCartCustomized}
          themeAccentColor={restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#D97706'}
          themeDarkBg={restaurant.branding?.darkBgColor || '#18181B'}
          dishCardBgColor={restaurant.branding?.dishCardBgColor || restaurant.branding?.cardBgColor}
          buttonTextColor={restaurant.branding?.buttonTextColor || '#FFFFFF'}
          textColor={restaurant.branding?.textColor}
          secondaryColor={restaurant.branding?.secondaryColor}
          dishNameFont={restaurant.branding?.dishNameFont}
          dishDescFont={restaurant.branding?.dishDescFont}
          dishPriceFont={restaurant.branding?.dishPriceFont}
        />
      )}

      {/* SCHEDULE MODAL */}
      <ScheduleViewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        restaurant={restaurant}
      />

    </div>
  );
};
