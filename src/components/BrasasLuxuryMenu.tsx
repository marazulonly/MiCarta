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
  Wine,
  Sparkles,
  Star,
  Layers,
  ChefHat,
  Bike,
  Clock,
  MapPin,
  Edit3,
  Camera,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order, OrderType } from '../types';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';
import { ScheduleViewModal } from './ScheduleViewModal';

interface BrasasLuxuryMenuProps {
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

export const BrasasLuxuryMenu: React.FC<BrasasLuxuryMenuProps> = ({
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
  onQuickPriceItem,
  onQuickPhotoItem,
  onToggleAvailability,
  onAddNewItem,
  onEditBranding,
  onEditHeader,
  onSaveToFirebase,
  isSavingFirebase = false,
}) => {
  const isDineInEnabled = restaurant?.menuAccessSettings?.enableDineIn !== false;
  const isDeliveryEnabled = restaurant?.menuAccessSettings?.enableDelivery !== false;
  
  const defaultChannel: 'DINE_IN' | 'DELIVERY' = 
    (!isDineInEnabled && isDeliveryEnabled) ? 'DELIVERY' :
    (!isDeliveryEnabled && isDineInEnabled) ? 'DINE_IN' :
    (initialMode === 'DELIVERY' ? 'DELIVERY' : 'DINE_IN');

  const restId = restaurant?.id || '';
  // Filter categories for this restaurant with robust fallback
  const rawCategories = (categories || []).filter(c => c && c.restaurantId === restId);
  const currentCategories = rawCategories.length > 0
    ? rawCategories
    : [{ id: `cat-${restId}-general`, restaurantId: restId, name: 'Especialidades', sortOrder: 1, isActive: true }];

  const [activeCategory, setActiveCategory] = useState<string>(currentCategories[0]?.id || `cat-${restId}-general`);
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

  // Check background customizations from menuAccessSettings or restaurant.branding
  const accessSettings = restaurant.menuAccessSettings;
  const isSeparate = accessSettings?.menuMode === 'SEPARATE';
  const brandingBg = restaurant.branding?.darkBgColor || restaurant.branding?.backgroundColor;
  
  // Dynamic background resolution
  let customBgStyle: React.CSSProperties = brandingBg
    ? { backgroundColor: brandingBg, backgroundImage: 'none' }
    : { background: 'radial-gradient(ellipse at 50% 0%, #0d362b 0%, #061c16 45%, #03100c 100%)' };

  if (!brandingBg) {
    if (activeChannel === 'DELIVERY' && accessSettings?.deliveryBgType) {
      if (accessSettings.deliveryBgType === 'image' && accessSettings.deliveryBgValue) {
        customBgStyle = {
          backgroundImage: `linear-gradient(rgba(8, 12, 11, 0.88), rgba(4, 8, 7, 0.95)), url("${accessSettings.deliveryBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      } else if (accessSettings.deliveryBgType === 'color') {
        customBgStyle = { backgroundColor: accessSettings.deliveryBgValue || '#0A0A0A' };
      } else if (accessSettings.deliveryBgType === 'gradient') {
        customBgStyle = { background: accessSettings.deliveryBgValue || 'linear-gradient(180deg, #0d362b 0%, #150820 100%)' };
      }
    } else if (activeChannel === 'DINE_IN' && accessSettings?.presentialBgType) {
      if (accessSettings.presentialBgType === 'image' && accessSettings.presentialBgValue) {
        customBgStyle = {
          backgroundImage: `linear-gradient(rgba(5, 24, 19, 0.86), rgba(3, 16, 12, 0.94)), url("${accessSettings.presentialBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      } else if (accessSettings.presentialBgType === 'color') {
        customBgStyle = { backgroundColor: accessSettings.presentialBgValue || '#051813' };
      } else if (accessSettings.presentialBgType === 'gradient') {
        customBgStyle = { background: accessSettings.presentialBgValue || 'radial-gradient(ellipse at 50% 0%, #0d362b 0%, #061c16 45%, #03100c 100%)' };
      }
    }
  }

  // Filter items based on active category & channel with smart category binding
  const currentItems = items.filter(i => {
    const matchRest = i.restaurantId === restaurant.id;
    if (!matchRest) return false;

    // Scope check
    if (isSeparate) {
      if (activeChannel === 'DINE_IN' && i.targetMenuScope === 'DELIVERY') return false;
      if (activeChannel === 'DELIVERY' && i.targetMenuScope === 'DINE_IN') return false;
    }

    if (activeCategory === 'all') return true;
    if (i.categoryId === activeCategory) return true;

    // If item has an unknown or unassigned category, show it in the first category
    const belongsToKnown = currentCategories.some(c => c.id === i.categoryId);
    if (!belongsToKnown && activeCategory === currentCategories[0]?.id) {
      return true;
    }
    return false;
  });

  const activeCategoryObj = currentCategories.find(c => c.id === activeCategory);
  const activeCategoryTitle = activeCategory === 'all' 
    ? (activeChannel === 'DELIVERY' ? (accessSettings?.deliveryTitle || 'Carta Delivery') : (accessSettings?.presentialTitle || 'Carta Salón Completa'))
    : (activeCategoryObj?.name || 'Parrillas Familiares');

  // Handle dish customization confirmation
  const handleConfirmItemUnits = (item: MenuItem, quantity: number, units: OrderItemUnit[]) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(c => c.item.id === item.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          item,
          quantity,
          units
        };
        return next;
      }
      return [...prev, { item, quantity, units }];
    });
  };

  const handleOpenItemCustomizer = (item: MenuItem) => {
    setSelectedItemForCustomization(item);
  };

  const cartTotal = cart.reduce((sum, c) => {
    const base = c.item.price * c.quantity;
    const addons = c.units.reduce((uSum, u) => {
      return uSum + (u.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
    }, 0);
    return sum + base + addons;
  }, 0);

  const totalItemsCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const fullUrl = typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin}/?r=${restaurant.slug}`
    : `https://micarta-bay.vercel.app/?r=${restaurant.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const getCategoryIcon = (name: string) => {
    if (name.toLowerCase().includes('parrilla')) return <Flame className="w-3.5 h-3.5" />;
    if (name.toLowerCase().includes('entrada') || name.toLowerCase().includes('tabla')) return <Utensils className="w-3.5 h-3.5" />;
    if (name.toLowerCase().includes('licor') || name.toLowerCase().includes('bebida') || name.toLowerCase().includes('vino')) return <Wine className="w-3.5 h-3.5" />;
    return <Sparkles className="w-3.5 h-3.5" />;
  };

  return (
    <>
      <div 
        style={customBgStyle}
        className="fixed inset-0 z-50 flex flex-col w-full h-full min-h-screen overflow-y-auto selection:bg-black selection:text-white"
      >
        
        {/* Outer Shell: 100% full screen background, without outer borders */}
        <div 
          className="relative w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto min-h-screen flex flex-col transition-all duration-300 border-0 shadow-none bg-transparent"
        >
          
          {/* Top Operational Bar */}
          <div className="relative z-30 px-4 py-2.5 bg-[#03110d]/90 border-b border-[#b88e3d]/30 flex items-center justify-between text-xs backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#dfb86c] animate-pulse" />
              <span className="text-[#dfb86c] font-serif tracking-widest uppercase text-[11px] font-semibold">
                Micarta · {restaurant.name}
              </span>
              
              {/* Channel switcher badge */}
              <div className="flex items-center gap-1 bg-[#092b22] p-0.5 rounded-lg border border-[#b88e3d]/30">
                <button
                  disabled={!isDineInEnabled}
                  onClick={() => setActiveChannel('DINE_IN')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                    !isDineInEnabled
                      ? 'opacity-40 cursor-not-allowed text-neutral-500'
                      : activeChannel === 'DINE_IN'
                      ? 'bg-[#dfb86c] text-black font-bold'
                      : 'text-[#ecd8a5] hover:text-white'
                  }`}
                  title={!isDineInEnabled ? 'Canal Salón desactivado en la configuración' : 'Carta Salón'}
                >
                  <ChefHat className="w-2.5 h-2.5" />
                  <span>{isDineInEnabled ? 'Salón' : 'Salón (Pausado)'}</span>
                </button>
                <button
                  disabled={!isDeliveryEnabled}
                  onClick={() => setActiveChannel('DELIVERY')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                    !isDeliveryEnabled
                      ? 'opacity-40 cursor-not-allowed text-neutral-500'
                      : activeChannel === 'DELIVERY'
                      ? 'bg-[#dfb86c] text-black font-bold'
                      : 'text-[#ecd8a5] hover:text-white'
                  }`}
                  title={!isDeliveryEnabled ? 'Canal Delivery desactivado en la configuración' : 'Carta Delivery'}
                >
                  <Bike className="w-2.5 h-2.5" />
                  <span>{isDeliveryEnabled ? 'Delivery' : 'Delivery (Pausado)'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isOwnerOrAdmin && onToggleLiveEdit && (
                <button
                  onClick={onToggleLiveEdit}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    isLiveEditActive
                      ? 'bg-amber-400 text-black border-amber-300 ring-2 ring-amber-400/50'
                      : 'bg-[#092b22] text-[#dfb86c] border-[#dfb86c]/40 hover:bg-[#0c392c]'
                  }`}
                  title="Habilita la edición de la carta directamente sobre esta vista"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isLiveEditActive ? 'Edición Activa' : 'Editar Carta'}</span>
                </button>
              )}

              {initialTableNumber && (
                <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-[#dfb86c] border border-amber-500/40 text-[10px] font-bold font-mono">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Mesa {initialTableNumber}</span>
                </span>
              )}
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="p-1.5 rounded-lg bg-[#07241c] hover:bg-[#0c392c] text-[#dfb86c] border border-[#b88e3d]/30 transition cursor-pointer flex items-center gap-1"
                title="Ver Horarios de Atención"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[10px] font-medium">Horarios</span>
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg bg-[#07241c] hover:bg-[#0c392c] text-[#dfb86c] border border-[#b88e3d]/30 transition cursor-pointer"
                title={isFullscreen ? 'Reducir tamaño' : 'Pantalla completa'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={copyUrl}
                className="p-1.5 rounded-lg bg-[#07241c] hover:bg-[#0c392c] text-[#dfb86c] border border-[#b88e3d]/30 transition cursor-pointer flex items-center gap-1"
                title="Copiar URL del Menú"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-[10px] font-medium">{copiedLink ? 'Copiado' : 'Compartir'}</span>
              </button>
              {isOwnerOrAdmin && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-[#07241c] hover:bg-[#0c392c] text-[#dfb86c] border border-[#b88e3d]/30 transition cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Live Edit Mode Floating Banner */}
          {isLiveEditActive && (
            <div className="relative z-30 px-3 py-2 bg-gradient-to-r from-amber-950/95 via-amber-900/95 to-amber-950/95 border-b border-amber-500/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-bold text-amber-200 text-xs">Modo Edición en Vivo:</span>
                <span className="text-amber-100/90 text-[11px] hidden sm:inline">
                  Toca sobre cualquier plato, precio, foto o el botón de marca para editar directamente en esta carta.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {onAddNewItem && (
                  <button
                    onClick={() => onAddNewItem(activeCategory !== 'all' ? activeCategory : undefined)}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Agregar Plato</span>
                  </button>
                )}
                {onEditBranding && (
                  <button
                    onClick={onEditBranding}
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black text-amber-300 border border-amber-400/50 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Marca & Fondos</span>
                  </button>
                )}
                {onEditHeader && (
                  <button
                    onClick={onEditHeader}
                    className="px-2.5 py-1 rounded-lg bg-fuchsia-950/80 hover:bg-fuchsia-900 text-fuchsia-200 border border-fuchsia-500/60 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow hover:brightness-110"
                    title="Editar cabecera, subir logo y autoajustar"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Cabecera & Logo</span>
                  </button>
                )}
                {onSaveToFirebase && (
                  <button
                    onClick={onSaveToFirebase}
                    disabled={isSavingFirebase}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isSavingFirebase ? 'Guardando...' : 'Guardar Firebase'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Luxury Menu Content */}
          <div 
            className="relative flex-1 overflow-y-auto pb-28 scrollbar-thin scrollbar-thumb-[#b88e3d]/40 scrollbar-track-transparent"
            style={customBgStyle}
          >
            {/* Subtle Damask Pattern Background Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.07] z-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M40 40c0-11.046-8.954-20-20-20S0 28.954 0 40s8.954 20 20 20 20-8.954 20-20zm20-20c11.046 0 20-8.954 20-20S71.046-20 60-20s-20 8.954-20 20 8.954 20 20 20zm0 40c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20zm-40 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '80px 80px'
              }}
            />

            {/* Outer Gold Pinstripe Frame */}
            <div className="relative z-10 m-3 sm:m-4 p-3 sm:p-5 border border-[#dfb86c]/60 rounded-xl">
              
              {/* Inner Hairline Frame */}
              <div className="absolute inset-1 border border-[#dfb86c]/30 rounded-lg pointer-events-none" />
              
              {/* Corner Ornaments */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#dfb86c]" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#dfb86c]" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#dfb86c]" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#dfb86c]" />

              {/* HEADER SECTION: logo grows upwards to the top */}
              <div className="text-center pt-0 pb-5 space-y-1">
                {(() => {
                  const headerLogo = restaurant.branding?.headerLogoUrl || restaurant.logoUrl;
                  const isImageOnly = restaurant.branding?.headerDisplayMode === 'IMAGE_ONLY';
                  const showName = !isImageOnly && (restaurant.branding?.showHeaderName !== false);
                  const showTagline = !isImageOnly && (restaurant.branding?.showHeaderTagline !== false);
                  const logoFit = restaurant.branding?.headerLogoFit || 'contain';
                  const configuredHeight = restaurant.branding?.headerBannerHeight;
                  const bannerHeight = configuredHeight && configuredHeight > 100 ? configuredHeight : 180;

                  return (
                    <>
                      {headerLogo && (
                        <div 
                          className="flex justify-center items-center mb-1 cursor-pointer group relative pt-0"
                          onClick={onEditHeader || onEditBranding}
                          title={isOwnerOrAdmin ? "Clic para editar cabecera" : undefined}
                        >
                          <div className={`p-0.5 rounded-2xl ${logoFit === 'cover' ? 'w-full' : ''} bg-gradient-to-b from-[#dfb86c] to-[#aa7c28] shadow-lg`}>
                            <img 
                              src={headerLogo} 
                              alt={restaurant.name} 
                              style={{ maxHeight: `${bannerHeight}px` }}
                              className={`transition-all duration-300 ${
                                logoFit === 'cover' 
                                  ? 'w-full object-cover rounded-2xl' 
                                  : 'max-w-full w-auto h-auto max-h-44 sm:max-h-56 md:max-h-64 object-contain rounded-2xl border border-[#dfb86c]/60'
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          {(isLiveEditActive || isOwnerOrAdmin) && (
                            <span className="opacity-0 group-hover:opacity-100 transition absolute -bottom-2 bg-neutral-900/90 text-amber-300 border border-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-1 z-30">
                              <Sliders className="w-2.5 h-2.5" /> Editar Cabecera
                            </span>
                          )}
                        </div>
                      )}

                      {showName && (
                        <div 
                          className="tracking-normal font-normal text-2xl sm:text-3xl select-none relative z-10"
                          style={{
                            fontFamily: restaurant.branding?.restaurantNameFont && restaurant.branding.restaurantNameFont !== 'inherit'
                              ? restaurant.branding.restaurantNameFont
                              : "'Alex Brush', 'Dancing Script', cursive",
                            color: restaurant.branding?.restaurantNameColor || '#eed799',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                          }}
                        >
                          {restaurant.name}
                        </div>
                      )}

                      {showTagline && restaurant.tagline && (
                        <p 
                          style={{ color: restaurant.branding?.restaurantNameColor || '#dfb86c' }}
                          className="text-[10px] sm:text-[11px] uppercase tracking-widest font-serif max-w-sm mx-auto"
                        >
                          {restaurant.tagline}
                        </p>
                      )}
                    </>
                  );
                })()}

                {isLiveEditActive && (
                  <div className="flex justify-center flex-wrap gap-2 pt-1 pb-1">
                    {onEditHeader && (
                      <button
                        type="button"
                        onClick={onEditHeader}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 text-[10px] font-serif font-bold flex items-center gap-1.5 cursor-pointer transition shadow"
                      >
                        <Sliders className="w-3 h-3 text-amber-400" />
                        <span>✏️ Editar Cabecera (Logo/Nombre/Slogan)</span>
                      </button>
                    )}
                    {onEditBranding && (
                      <button
                        type="button"
                        onClick={onEditBranding}
                        className="px-3 py-1 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-serif font-bold flex items-center gap-1.5 cursor-pointer transition shadow"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" />
                        <span>Marca & Colores</span>
                      </button>
                    )}
                  </div>
                )}

                <h1 
                  className="text-3xl sm:text-4xl font-bold tracking-[0.24em] select-none uppercase pt-1"
                  style={{
                    fontFamily: "'Cinzel', 'Playfair Display', serif",
                    background: 'linear-gradient(180deg, #fff2cc 0%, #dfb86c 48%, #aa7c28 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))'
                  }}
                >
                  {activeChannel === 'DELIVERY' ? 'DELIVERY' : 'LA CARTA'}
                </h1>

                <div className="pt-2">
                  <span 
                    className="text-2xl sm:text-3xl font-medium tracking-wide text-[#f0d48f] block"
                    style={{
                      fontFamily: "'Dancing Script', 'Alex Brush', cursive",
                      textShadow: '0 2px 10px rgba(0,0,0,0.9)'
                    }}
                  >
                    {activeCategoryTitle}
                  </span>
                </div>

                {/* Ornate Gold Filigree Divider */}
                <div className="flex items-center justify-center gap-2 py-2 text-[#dfb86c]">
                  <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#dfb86c]/70 to-[#dfb86c]" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfb86c]">✦</span>
                  <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-[#dfb86c]/70 to-[#dfb86c]" />
                </div>

                <p className="text-[11px] sm:text-xs text-[#d6b77c]/90 font-serif tracking-widest uppercase">
                  Precios en Soles (S/.) · {activeChannel === 'DELIVERY' ? 'Despacho Delivery Rápido' : 'Atención en Mesa'}
                </p>
              </div>

              {/* CATEGORY SELECTOR TABS */}
              <div className="my-3 pb-3 border-b border-[#dfb86c]/20 flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none px-1">
                {currentCategories.map(cat => {
                  const isSelected = activeCategory === cat.id;
                  const btnColor = restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#dfb86c';
                  const btnTextColor = restaurant.branding?.buttonTextColor || '#000000';

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      style={
                        isSelected
                          ? { backgroundColor: btnColor, color: btnTextColor, borderColor: btnColor }
                          : { backgroundColor: 'rgba(9, 38, 31, 0.8)', color: btnColor, borderColor: `${btnColor}50` }
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif transition-all cursor-pointer whitespace-nowrap border ${
                        isSelected ? 'font-bold shadow-[0_0_12px_rgba(223,184,108,0.4)]' : 'hover:brightness-125'
                      }`}
                    >
                      {getCategoryIcon(cat.name)}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setActiveCategory('all')}
                  style={
                    activeCategory === 'all'
                      ? {
                          backgroundColor: restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#dfb86c',
                          color: restaurant.branding?.buttonTextColor || '#000000',
                          borderColor: restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#dfb86c'
                        }
                      : {
                          backgroundColor: 'rgba(9, 38, 31, 0.8)',
                          color: restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#dfb86c',
                          borderColor: `${restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#dfb86c'}50`
                        }
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-serif transition-all cursor-pointer whitespace-nowrap border ${
                    activeCategory === 'all' ? 'font-bold shadow-[0_0_12px_rgba(223,184,108,0.4)]' : 'hover:brightness-125'
                  }`}
                >
                  Todas las Secciones
                </button>
              </div>

              {/* DISH CARDS LIST: Clean presentation (Adicionales & Observaciones only appear when ordering) */}
              <div className="space-y-6 sm:space-y-7 pt-3">
                {isLiveEditActive && onAddNewItem && (
                  <div className="flex justify-end pb-1">
                    <button
                      type="button"
                      onClick={() => onAddNewItem(activeCategoryObj?.id)}
                      className="px-3.5 py-2 rounded-xl border border-dashed border-[#dfb86c]/70 bg-[#dfb86c]/15 hover:bg-[#dfb86c]/25 text-[#f5df9e] font-sans font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-amber-300" />
                      <span>+ Agregar Plato a esta Carta</span>
                    </button>
                  </div>
                )}

                {currentItems.map((item, idx) => {
                  const inCart = cart.find(c => c.item.id === item.id);
                  const isEven = idx % 2 === 0;

                  const customButtonColor = restaurant.branding?.buttonColor || restaurant.branding?.accentColor;
                  const customButtonTextColor = restaurant.branding?.buttonTextColor || '#000000';
                  const customTextColor = restaurant.branding?.textColor;
                  const customDishCardBgColor = restaurant.branding?.dishCardBgColor || restaurant.branding?.cardBgColor;
                  const dishNameFont = restaurant.branding?.dishNameFont && restaurant.branding.dishNameFont !== 'inherit' ? restaurant.branding.dishNameFont : "'Cinzel', 'Playfair Display', serif";
                  const dishDescFont = restaurant.branding?.dishDescFont && restaurant.branding.dishDescFont !== 'inherit' ? restaurant.branding.dishDescFont : 'inherit';
                  const dishPriceFont = restaurant.branding?.dishPriceFont || 'inherit';
                  const priceColor = restaurant.branding?.priceColor || customButtonColor || '#f5df9e';
                  const cardRadius = restaurant.branding?.cardBorderRadius || '12px';

                  const cardBorderStyle: React.CSSProperties = {
                    backgroundColor: customDishCardBgColor || 'rgba(10, 39, 32, 0.85)',
                    borderColor: customButtonColor ? `${customButtonColor}90` : '#1b4b3e',
                    color: customTextColor || '#fffdfa',
                    borderRadius: cardRadius
                  };

                  const btnStyle: React.CSSProperties = customButtonColor 
                    ? { backgroundColor: customButtonColor, color: customButtonTextColor, backgroundImage: 'none' } 
                    : { background: 'linear-gradient(to right, #e7cb82, #b88e3d)', color: '#071d17' };

                  return (
                    <div key={item.id} className="relative group">
                      
                      {/* Live Edit Action Badges */}
                      {isLiveEditActive && (
                        <div className="absolute -top-3 right-2 z-30 flex items-center gap-1 bg-black/95 p-1 rounded-lg border border-amber-400 shadow-xl backdrop-blur">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onEditItem && onEditItem(item); }}
                            className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow"
                            title="Editar nombre, descripción, precio y detalles"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onQuickPriceItem && onQuickPriceItem(item); }}
                            className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-[10px] font-bold font-mono cursor-pointer transition border border-neutral-700"
                            title="Modificar precio rápido"
                          >
                            S/ {item.price.toFixed(2)}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onQuickPhotoItem && onQuickPhotoItem(item); }}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10px] cursor-pointer transition border border-neutral-700"
                            title="Cambiar foto del plato"
                          >
                            <Camera className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleAvailability && onToggleAvailability(item); }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono cursor-pointer transition border ${
                              item.isAvailable !== false ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'
                            }`}
                            title="Alternar entre disponible o agotado"
                          >
                            {item.isAvailable !== false ? 'Disponible' : 'Agotado'}
                          </button>
                        </div>
                      )}
                      
                      {isEven ? (
                        /* LAYOUT A: Even Items (Circle Left, Card Right) */
                        <div className="flex items-center">
                          <div className="relative z-20 shrink-0 -mr-6 sm:-mr-8 cursor-pointer" onClick={() => handleOpenItemCustomizer(item)}>
                            <div 
                              style={{ borderColor: customButtonColor || '#dfb86c' }}
                              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 shadow-[0_8px_20px_rgba(0,0,0,0.8)] bg-black"
                            >
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>

                          <div 
                            style={cardBorderStyle}
                            className="flex-1 pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 sm:py-4 border backdrop-blur-md shadow-2xl relative overflow-hidden text-left"
                          >
                            <div className="flex flex-col justify-between h-full space-y-1.5">
                              <div>
                                <h3 
                                  className="text-sm sm:text-base font-semibold leading-tight flex items-center justify-between"
                                  style={{ fontFamily: dishNameFont, color: customTextColor || '#fffdfa' }}
                                >
                                  <span>{item.name}</span>
                                </h3>
                                <p 
                                  style={{ fontFamily: dishDescFont, color: customTextColor ? `${customTextColor}d0` : '#cfdecb' }}
                                  className="text-[11px] sm:text-xs font-sans mt-1 leading-relaxed opacity-90"
                                >
                                  {item.description}
                                </p>
                              </div>

                              <div className="pt-1 flex items-end justify-between border-t border-white/10">
                                <div className="flex items-center text-xs gap-0.5" style={{ color: customButtonColor || '#dfb86c' }}>
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                </div>

                                <div className="flex items-center gap-3">
                                  <span 
                                    style={{ fontFamily: dishPriceFont, color: priceColor }}
                                    className="text-lg sm:text-xl font-bold font-serif tracking-tight"
                                  >
                                    S/ {item.price.toFixed(2)}
                                  </span>

                                  <button
                                    onClick={() => handleOpenItemCustomizer(item)}
                                    style={btnStyle}
                                    className="px-3 py-1 rounded-lg text-xs font-serif font-bold shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{inCart ? `(${inCart.quantity}) Pedir` : 'Pedir'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* LAYOUT B: Odd Items (Card Left, Circle Right) */
                        <div className="flex items-center">
                          <div 
                            style={cardBorderStyle}
                            className="flex-1 pr-8 sm:pr-10 pl-3 sm:pl-4 py-3 sm:py-4 border backdrop-blur-md shadow-2xl relative overflow-hidden text-left"
                          >
                            <div className="flex flex-col justify-between h-full space-y-1.5">
                              <div>
                                <h3 
                                  className="text-sm sm:text-base font-semibold leading-tight flex items-center justify-between"
                                  style={{ fontFamily: dishNameFont, color: customTextColor || '#fffdfa' }}
                                >
                                  <span>{item.name}</span>
                                </h3>
                                <p 
                                  style={{ fontFamily: dishDescFont, color: customTextColor ? `${customTextColor}d0` : '#cfdecb' }}
                                  className="text-[11px] sm:text-xs font-sans mt-1 leading-relaxed opacity-90"
                                >
                                  {item.description}
                                </p>
                              </div>

                              <div className="pt-1 flex items-end justify-between border-t border-white/10">
                                <div className="flex items-center text-xs gap-0.5" style={{ color: customButtonColor || '#dfb86c' }}>
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                  <Star className="w-3 h-3 fill-current" />
                                </div>

                                <div className="flex items-center gap-3">
                                  <span 
                                    style={{ fontFamily: dishPriceFont, color: priceColor }}
                                    className="text-lg sm:text-xl font-bold font-serif tracking-tight"
                                  >
                                    S/ {item.price.toFixed(2)}
                                  </span>

                                  <button
                                    onClick={() => handleOpenItemCustomizer(item)}
                                    style={btnStyle}
                                    className="px-3 py-1 rounded-lg text-xs font-serif font-bold shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{inCart ? `(${inCart.quantity}) Pedir` : 'Pedir'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="relative z-20 shrink-0 -ml-6 sm:-ml-8 cursor-pointer" onClick={() => handleOpenItemCustomizer(item)}>
                            <div 
                              style={{ borderColor: customButtonColor || '#dfb86c' }}
                              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 shadow-[0_8px_20px_rgba(0,0,0,0.8)] bg-black"
                            >
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-4 border-t border-[#dfb86c]/30 text-center text-[10px] text-[#cbb17b]/70 font-serif tracking-widest uppercase">
                Micarta · {restaurant.name} · Carta Digital Gourmet
              </div>

            </div>
          </div>

          {/* Floating Order Trigger Drawer */}
          {cart.length > 0 && (
            <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 p-3.5 bg-[#03110d]/95 border border-[#b88e3d]/50 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
              <div>
                <span className="text-[11px] text-[#cfdecb] block">
                  {totalItemsCount} {totalItemsCount === 1 ? 'plato listo' : 'platos listos'} ({activeChannel === 'DELIVERY' ? 'Delivery' : 'Salón'})
                </span>
                <span className="text-sm font-bold text-[#f5df9e] font-serif tracking-wide">
                  Total: S/ {cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#e7cb82] to-[#b88e3d] text-[#071d17] font-serif font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-2 shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ver Pedido</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Item Unit Customization Modal */}
      {selectedItemForCustomization && (
        <ItemOrderModal
          isOpen={!!selectedItemForCustomization}
          onClose={() => setSelectedItemForCustomization(null)}
          item={selectedItemForCustomization}
          onConfirm={handleConfirmItemUnits}
          themeAccentColor={restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#dfb86c'}
          themeDarkBg={restaurant.branding?.darkBgColor || '#051813'}
          buttonTextColor={restaurant.branding?.buttonTextColor || '#000000'}
          textColor={restaurant.branding?.textColor}
          dishNameFont={restaurant.branding?.dishNameFont}
          dishDescFont={restaurant.branding?.dishDescFont}
          dishPriceFont={restaurant.branding?.dishPriceFont}
        />
      )}

      {/* Unified Cart / Checkout Drawer */}
      <UnifiedCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        restaurant={restaurant}
        cart={cart}
        onUpdateCart={setCart}
        onOrderCreated={onOrderCreated}
        onEditCartEntry={(item) => setSelectedItemForCustomization(item)}
        initialOrderType={activeChannel}
        initialTableNumber={initialTableNumber}
        themeStyle="luxury"
      />

      {/* Schedule View Modal */}
      <ScheduleViewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        restaurant={restaurant}
      />
    </>
  );
};
