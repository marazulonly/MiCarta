import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Check, 
  Plus, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Share2,
  ChefHat,
  Bike,
  Sparkles,
  Clock,
  MapPin,
  Edit3,
  Camera,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order } from '../types';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';
import { ScheduleViewModal } from './ScheduleViewModal';

interface CriolloChalkboardMenuProps {
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
  onAddNewItem?: () => void;
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

export const CriolloChalkboardMenu: React.FC<CriolloChalkboardMenuProps> = ({
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
  const isDineInEnabled = restaurant.menuAccessSettings?.enableDineIn !== false;
  const isDeliveryEnabled = restaurant.menuAccessSettings?.enableDelivery !== false;
  
  const defaultChannel: 'DINE_IN' | 'DELIVERY' = 
    (!isDineInEnabled && isDeliveryEnabled) ? 'DELIVERY' :
    (!isDeliveryEnabled && isDineInEnabled) ? 'DINE_IN' :
    (initialMode === 'DELIVERY' ? 'DELIVERY' : 'DINE_IN');

  const [activeChannel, setActiveChannel] = useState<'DINE_IN' | 'DELIVERY'>(defaultChannel);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);

  if (!isOpen) return null;

  // Background customization from settings or branding
  const accessSettings = restaurant.menuAccessSettings;
  const isSeparate = accessSettings?.menuMode === 'SEPARATE';
  const brandingBg = restaurant.branding?.darkBgColor || restaurant.branding?.backgroundColor;
  
  let chalkboardStyle: React.CSSProperties = brandingBg
    ? { backgroundColor: brandingBg, backgroundImage: 'none' }
    : { backgroundColor: '#141716' };

  if (!brandingBg) {
    if (activeChannel === 'DELIVERY' && accessSettings?.deliveryBgType) {
      if (accessSettings.deliveryBgType === 'image' && accessSettings.deliveryBgValue) {
        chalkboardStyle = {
          backgroundImage: `linear-gradient(rgba(18, 20, 19, 0.88), rgba(10, 12, 11, 0.95)), url("${accessSettings.deliveryBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      } else if (accessSettings.deliveryBgType === 'color') {
        chalkboardStyle = { backgroundColor: accessSettings.deliveryBgValue || '#141716' };
      } else if (accessSettings.deliveryBgType === 'gradient') {
        chalkboardStyle = { background: accessSettings.deliveryBgValue || 'linear-gradient(180deg, #1f1a14 0%, #100e0b 100%)' };
      }
    } else if (activeChannel === 'DINE_IN' && accessSettings?.presentialBgType) {
      if (accessSettings.presentialBgType === 'image' && accessSettings.presentialBgValue) {
        chalkboardStyle = {
          backgroundImage: `linear-gradient(rgba(20, 23, 22, 0.86), rgba(12, 14, 13, 0.94)), url("${accessSettings.presentialBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      } else if (accessSettings.presentialBgType === 'color') {
        chalkboardStyle = { backgroundColor: accessSettings.presentialBgValue || '#141716' };
      } else if (accessSettings.presentialBgType === 'gradient') {
        chalkboardStyle = { background: accessSettings.presentialBgValue || 'linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)' };
      }
    } else if (activeChannel === 'DELIVERY' && accessSettings?.deliveryBgValue) {
      chalkboardStyle = { background: accessSettings.deliveryBgValue };
    } else if (activeChannel === 'DINE_IN' && accessSettings?.presentialBgValue) {
      chalkboardStyle = { background: accessSettings.presentialBgValue };
    }
  }

  // Filter categories and items for this restaurant with robust fallback
  const rawCategories = categories.filter(c => c.restaurantId === restaurant.id);
  const currentCategories = rawCategories.length > 0
    ? rawCategories
    : [{ id: `cat-${restaurant.id}-general`, restaurantId: restaurant.id, name: 'Especialidades Criollas', sortOrder: 1, isActive: true }];

  const currentItems = items.filter(i => {
    const matchRest = i.restaurantId === restaurant.id;
    if (!matchRest) return false;
    if (isSeparate) {
      if (activeChannel === 'DINE_IN' && i.targetMenuScope === 'DELIVERY') return false;
      if (activeChannel === 'DELIVERY' && i.targetMenuScope === 'DINE_IN') return false;
    }
    return true;
  });

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

  // Group items by category for chalkboard style with smart fallback for orphaned items
  const groupedCategories = currentCategories.map((cat, idx) => ({
    ...cat,
    items: currentItems.filter(i => {
      if (i.categoryId === cat.id) return true;
      const belongsToKnown = currentCategories.some(c => c.id === i.categoryId);
      if (!belongsToKnown && idx === 0) return true;
      return false;
    })
  })).filter(cat => cat.items.length > 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
        
        {/* Outer Blackboard Wood Frame */}
        <div 
          style={chalkboardStyle}
          className={`relative w-full ${
            isFullscreen ? 'max-w-4xl h-[96vh]' : 'max-w-xl h-[92vh] max-h-[860px]'
          } rounded-2xl overflow-hidden flex flex-col shadow-2xl border-4 border-[#5c3e23] text-[#e8ebe9] transition-all duration-300`}
        >
          {/* Top Bar */}
          <div className="relative z-30 px-4 py-2.5 bg-[#21160e] border-b border-[#5c3e23] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#f5d0a9] font-mono tracking-wider uppercase text-[11px] font-bold">
                Pizarra Criolla · {restaurant.name}
              </span>
              
              {/* Channel badge */}
              <div className="flex items-center gap-1 bg-[#120a05] p-0.5 rounded-lg border border-[#5c3e23]">
                <button
                  disabled={!isDineInEnabled}
                  onClick={() => setActiveChannel('DINE_IN')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                    !isDineInEnabled
                      ? 'opacity-40 cursor-not-allowed text-neutral-500'
                      : activeChannel === 'DINE_IN'
                      ? 'bg-[#f5d0a9] text-black font-bold'
                      : 'text-[#c2a281]'
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
                      ? 'bg-[#f5d0a9] text-black font-bold'
                      : 'text-[#c2a281]'
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
                      : 'bg-[#332014] text-[#f5d0a9] border-[#5c3e23] hover:bg-[#4a2e1d]'
                  }`}
                  title="Habilita la edición de la carta directamente sobre esta vista"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isLiveEditActive ? 'Edición Activa' : 'Editar Carta'}</span>
                </button>
              )}

              {initialTableNumber && (
                <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-[#f5d0a9] border border-amber-500/40 text-[10px] font-bold font-mono">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Mesa {initialTableNumber}</span>
                </span>
              )}
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="p-1.5 rounded bg-[#332014] text-[#f5d0a9] hover:bg-[#4a2e1d] transition cursor-pointer flex items-center gap-1"
                title="Ver Horarios de Atención"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[10px]">Horarios</span>
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded bg-[#332014] text-[#f5d0a9] hover:bg-[#4a2e1d] transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={copyUrl}
                className="p-1.5 rounded bg-[#332014] text-[#f5d0a9] hover:bg-[#4a2e1d] transition cursor-pointer flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-[10px]">{copiedLink ? 'Copiado' : 'Compartir'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded bg-[#332014] text-[#f5d0a9] hover:bg-[#4a2e1d] transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Live Edit Mode Floating Banner */}
          {isLiveEditActive && (
            <div className="relative z-30 px-3 py-2 bg-gradient-to-r from-amber-950/95 via-amber-900/95 to-amber-950/95 border-b border-amber-500/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-bold text-amber-200 text-xs">Modo Edición en Vivo:</span>
                <span className="text-amber-100/90 text-[11px] hidden sm:inline">
                  Toca sobre cualquier plato, precio, foto o marca para editar directamente en esta carta.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {onAddNewItem && (
                  <button
                    onClick={onAddNewItem}
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

          {/* Chalkboard Texture Canvas */}
          <div 
            className="relative flex-1 overflow-y-auto p-4 sm:p-6 pb-28 space-y-6"
            style={chalkboardStyle}
          >
            {/* Header Chalk script */}
            <div className="text-center space-y-1.5 border-b-2 border-dashed border-[#ffffff]/20 pb-4">
              {(() => {
                const headerLogo = restaurant.branding?.headerLogoUrl || restaurant.logoUrl;
                const isImageOnly = restaurant.branding?.headerDisplayMode === 'IMAGE_ONLY';
                const showName = !isImageOnly && (restaurant.branding?.showHeaderName !== false);
                const showTagline = !isImageOnly && (restaurant.branding?.showHeaderTagline !== false);
                const showBadge = !isImageOnly && (restaurant.branding?.showHeaderBadge !== false);
                const logoFit = restaurant.branding?.headerLogoFit || 'contain';
                const bannerHeight = restaurant.branding?.headerBannerHeight || 100;

                return (
                  <>
                    {headerLogo && (
                      <div 
                        className="flex justify-center items-center mb-1 cursor-pointer group relative"
                        onClick={onEditHeader || onEditBranding}
                        title={isOwnerOrAdmin ? "Clic para editar cabecera" : undefined}
                      >
                        <img 
                          src={headerLogo} 
                          alt={restaurant.name} 
                          style={{ maxHeight: `${bannerHeight}px` }}
                          className={`transition-all duration-300 ${
                            logoFit === 'cover' 
                              ? 'w-full object-cover rounded-2xl shadow-lg border border-amber-400/40' 
                              : 'max-w-full object-contain rounded-2xl border-2 border-amber-400/40 shadow-lg'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                        {(isLiveEditActive || isOwnerOrAdmin) && (
                          <span className="opacity-0 group-hover:opacity-100 transition absolute -bottom-2 bg-neutral-900/90 text-amber-300 border border-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-1 z-30">
                            <Sliders className="w-2.5 h-2.5" /> Editar Cabecera
                          </span>
                        )}
                      </div>
                    )}

                    {showBadge && (
                      <span className="text-amber-300 font-mono text-xs tracking-widest uppercase block">
                        {activeChannel === 'DELIVERY' ? 'Carta Pizarra Delivery' : 'Carta Salón Tradición'}
                      </span>
                    )}

                    {showName && (
                      <h1 
                        style={{ 
                          fontFamily: restaurant.branding?.restaurantNameFont || restaurant.branding?.fontDisplay || 'inherit',
                          color: restaurant.branding?.restaurantNameColor || undefined
                        }}
                        className="text-3xl sm:text-4xl font-black text-white tracking-wide"
                      >
                        {restaurant.name}
                      </h1>
                    )}

                    {showTagline && (
                      <p className="text-[11px] text-neutral-400 font-mono">
                        {restaurant.tagline || 'Sazón Criolla y Fuego a la Leña'} · Precios en Soles (S/.)
                      </p>
                    )}
                  </>
                );
              })()}

              {isLiveEditActive && (
                <div className="flex justify-center flex-wrap gap-2 pt-1">
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
            </div>

            {/* Categorized Chalkboard Lists */}
            {groupedCategories.map(cat => (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="h-[2px] w-6 bg-amber-400" />
                    <h2 className="text-base font-black text-amber-300 uppercase tracking-wider font-serif">
                      {cat.name}
                    </h2>
                    <span className="h-[2px] flex-1 bg-amber-400/30" />
                  </div>
                  {isLiveEditActive && onAddNewItem && (
                    <button
                      type="button"
                      onClick={onAddNewItem}
                      className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] flex items-center gap-1 cursor-pointer transition shadow"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>+ Plato</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {cat.items.map(item => {
                    const inCart = cart.find(c => c.item.id === item.id);
                    const btnColor = restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#f59e0b';
                    const btnTextColor = restaurant.branding?.buttonTextColor || '#000000';
                    const textColor = restaurant.branding?.textColor;
                    const dishCardBgColor = restaurant.branding?.dishCardBgColor || restaurant.branding?.darkBgColor;
                    const dishNameFont = restaurant.branding?.dishNameFont || 'inherit';
                    const dishDescFont = restaurant.branding?.dishDescFont || 'inherit';
                    const dishPriceFont = restaurant.branding?.dishPriceFont || 'monospace';

                    return (
                      <div 
                        key={item.id}
                        style={{ 
                          backgroundColor: dishCardBgColor || 'rgba(0, 0, 0, 0.40)', 
                          borderColor: btnColor ? `${btnColor}80` : undefined,
                          color: textColor || undefined 
                        }}
                        className="relative p-3 rounded-xl border hover:border-neutral-700 transition flex items-center justify-between gap-3 group"
                      >
                        {/* Live Edit Action Badges */}
                        {isLiveEditActive && (
                          <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-black/95 p-1 rounded-lg border border-amber-400 shadow-xl backdrop-blur">
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
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-14 h-14 rounded-lg object-cover border border-neutral-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h3 
                              style={{ fontFamily: dishNameFont, color: textColor || '#ffffff' }}
                              className="text-xs sm:text-sm font-bold"
                            >
                              {item.name}
                            </h3>
                            <p 
                              style={{ fontFamily: dishDescFont, color: textColor ? `${textColor}cc` : undefined }}
                              className="text-[11px] text-neutral-400 line-clamp-1"
                            >
                              {item.description}
                            </p>
                            <span 
                              style={{ fontFamily: dishPriceFont }}
                              className="text-xs font-black text-amber-300 mt-0.5 block"
                            >
                              S/ {item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedItemForCustomization(item)}
                          style={{ backgroundColor: btnColor, color: btnTextColor }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow hover:brightness-110"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{inCart ? `(${inCart.quantity}) Pedir` : 'Pedir'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Floating Cart Trigger */}
          {cart.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 z-30 p-3 bg-[#1e130b]/95 border-t border-[#5c3e23] shadow-2xl backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#e0cfbe] block">
                  {totalItemsCount} {totalItemsCount === 1 ? 'plato listo' : 'platos listos'} ({activeChannel === 'DELIVERY' ? 'Delivery' : 'Salón'})
                </span>
                <span className="text-sm font-bold text-amber-300 font-mono">
                  Total: S/ {cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Revisar y Enviar Pedido</span>
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
          themeAccentColor={restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#f59e0b'}
          themeDarkBg={restaurant.branding?.darkBgColor || '#141716'}
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
        initialOrderType={activeChannel}
        initialTableNumber={initialTableNumber}
        themeStyle="chalkboard"
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
