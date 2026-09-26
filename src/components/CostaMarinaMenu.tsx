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
  Image as ImageIcon
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order } from '../types';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';
import { ScheduleViewModal } from './ScheduleViewModal';

interface CostaMarinaMenuProps {
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

export const CostaMarinaMenu: React.FC<CostaMarinaMenuProps> = ({
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

  const [activeChannel, setActiveChannel] = useState<'DINE_IN' | 'DELIVERY'>(defaultChannel);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);

  const restId = restaurant?.id || '';
  const rawCategories = (categories || [])
    .filter(c => c && c.restaurantId === restId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const currentCategories = rawCategories.length > 0
    ? rawCategories
    : [{ id: `cat-${restId}-general`, restaurantId: restId, name: 'De la Casa', sortOrder: 1, isActive: true }];

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    currentCategories[0]?.id || `cat-${restId}-general`
  );

  useEffect(() => {
    if (currentCategories.length > 0 && !currentCategories.some(c => c.id === selectedCategoryId)) {
      setSelectedCategoryId(currentCategories[0].id);
    }
  }, [currentCategories, selectedCategoryId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Background customization from settings or branding
  const accessSettings = restaurant.menuAccessSettings;
  const isSeparate = accessSettings?.menuMode === 'SEPARATE';
  const branding = restaurant.branding;
  const brandingBg = branding?.darkBgColor || branding?.backgroundColor;

  // Dynamic Palette Colors from branding with fallback defaults
  const COLOR_BG = branding?.darkBgColor || '#EAEBDC';
  const COLOR_CARD = branding?.dishCardBgColor || branding?.cardBgColor || '#FFFFFF';
  const COLOR_BTN = branding?.buttonColor || branding?.accentColor || '#111111';
  const COLOR_BTN_TEXT = branding?.buttonTextColor || '#FFFFFF';
  const COLOR_TEXT = branding?.textColor || '#111111';
  const COLOR_REST_NAME = branding?.restaurantNameColor || COLOR_TEXT;
  const COLOR_SUBTEXT = branding?.secondaryColor || '#71717A';

  const restNameFont = branding?.restaurantNameFont || branding?.fontDisplay || 'inherit';
  const dishNameFont = branding?.dishNameFont || 'inherit';
  const dishDescFont = branding?.dishDescFont || 'inherit';
  const dishPriceFont = branding?.dishPriceFont || 'monospace';

  let marineStyle: React.CSSProperties = {
    backgroundColor: COLOR_BG,
    color: COLOR_TEXT,
  };

  if (!brandingBg) {
    if (activeChannel === 'DELIVERY' && accessSettings?.deliveryBgType) {
      if (accessSettings.deliveryBgType === 'image' && accessSettings.deliveryBgValue) {
        marineStyle = {
          backgroundImage: `linear-gradient(rgba(234, 235, 220, 0.92), rgba(234, 235, 220, 0.96)), url("${accessSettings.deliveryBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: COLOR_TEXT,
        };
      } else if (accessSettings.deliveryBgType === 'color') {
        marineStyle = { backgroundColor: accessSettings.deliveryBgValue || COLOR_BG, color: COLOR_TEXT };
      }
    } else if (activeChannel === 'DINE_IN' && accessSettings?.presentialBgType) {
      if (accessSettings.presentialBgType === 'image' && accessSettings.presentialBgValue) {
        marineStyle = {
          backgroundImage: `linear-gradient(rgba(234, 235, 220, 0.92), rgba(234, 235, 220, 0.96)), url("${accessSettings.presentialBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: COLOR_TEXT,
        };
      } else if (accessSettings.presentialBgType === 'color') {
        marineStyle = { backgroundColor: accessSettings.presentialBgValue || COLOR_BG, color: COLOR_TEXT };
      }
    }
  }

  const currentItems = items.filter(i => {
    const matchRest = i.restaurantId === restaurant.id;
    if (!matchRest) return false;
    if (isSeparate) {
      if (activeChannel === 'DINE_IN' && i.targetMenuScope === 'DELIVERY') return false;
      if (activeChannel === 'DELIVERY' && i.targetMenuScope === 'DINE_IN') return false;
    }
    return true;
  });

  const activeCategory = currentCategories.find(c => c.id === selectedCategoryId) || currentCategories[0];
  const displayedItems = currentItems.filter(i => {
    if (!activeCategory) return true;
    if (i.categoryId === activeCategory.id) return true;
    const belongsToKnownCategory = currentCategories.some(c => c.id === i.categoryId);
    // If the dish has an orphaned or default categoryId, show it in the first/active category
    if (!belongsToKnownCategory && activeCategory.id === currentCategories[0]?.id) {
      return true;
    }
    return false;
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

  return (
    <>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
        style={marineStyle}
        className="fixed inset-0 z-50 flex flex-col w-full h-full min-h-screen overflow-y-auto selection:bg-black selection:text-white"
      >
        
        {/* Outer Shell Marine Theme: 100% full screen background, without outer borders */}
        <div 
          className="relative w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto min-h-screen flex flex-col transition-all duration-300 border-0 shadow-none bg-transparent"
        >
          {/* Top Bar - Únicamente visible para administradores y dueños, oculto para comensales y clientes anónimos */}
          {isOwnerOrAdmin && (
            <div 
              style={{ backgroundColor: COLOR_BTN, borderColor: COLOR_SUBTEXT }}
              className="relative z-30 px-2.5 py-1.5 border-b flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span 
                  style={{ color: COLOR_BTN_TEXT }}
                  className="font-mono tracking-wider uppercase text-[11px] font-bold"
                >
                  {restaurant.name.toUpperCase()} · CARTA DIGITAL
                </span>
                
                {/* Channel switcher */}
                <div 
                  style={{ backgroundColor: `${COLOR_BTN}e6`, borderColor: COLOR_SUBTEXT }}
                  className="flex items-center gap-1 p-0.5 rounded-lg border"
                >
                  <button
                    disabled={!isDineInEnabled}
                    onClick={() => setActiveChannel('DINE_IN')}
                    style={
                      activeChannel === 'DINE_IN'
                        ? { backgroundColor: COLOR_CARD, color: COLOR_TEXT }
                        : { backgroundColor: 'transparent', color: COLOR_BTN_TEXT }
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 font-bold ${
                      !isDineInEnabled ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                    title={!isDineInEnabled ? 'Canal Salón desactivado' : 'Carta Salón'}
                  >
                    <ChefHat className="w-2.5 h-2.5" />
                    <span>{isDineInEnabled ? 'Salón' : 'Salón (Pausado)'}</span>
                  </button>
                  <button
                    disabled={!isDeliveryEnabled}
                    onClick={() => setActiveChannel('DELIVERY')}
                    style={
                      activeChannel === 'DELIVERY'
                        ? { backgroundColor: COLOR_CARD, color: COLOR_TEXT }
                        : { backgroundColor: 'transparent', color: COLOR_BTN_TEXT }
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 font-bold ${
                      !isDeliveryEnabled ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                    title={!isDeliveryEnabled ? 'Canal Delivery desactivado' : 'Carta Delivery'}
                  >
                    <Bike className="w-2.5 h-2.5" />
                    <span>{isDeliveryEnabled ? 'Delivery' : 'Delivery (Pausado)'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onToggleLiveEdit && (
                  <button
                    onClick={onToggleLiveEdit}
                    style={
                      isLiveEditActive
                        ? { backgroundColor: COLOR_CARD, color: COLOR_TEXT, borderColor: COLOR_SUBTEXT }
                        : { backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT, borderColor: COLOR_SUBTEXT }
                    }
                    className="px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Habilita la edición de la carta directamente sobre esta vista"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isLiveEditActive ? 'Edición Activa' : 'Editar Carta'}</span>
                  </button>
                )}

                {initialTableNumber && (
                  <span 
                    style={{ backgroundColor: `${COLOR_SUBTEXT}30`, color: COLOR_BTN_TEXT, borderColor: COLOR_SUBTEXT }}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold font-mono"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Mesa {initialTableNumber}</span>
                  </span>
                )}
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  style={{ backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT }}
                  className="p-1.5 rounded hover:brightness-110 transition cursor-pointer flex items-center gap-1"
                  title="Ver Horarios de Atención"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Horarios</span>
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  style={{ backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT }}
                  className="p-1.5 rounded hover:brightness-110 transition cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={copyUrl}
                  style={{ backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT }}
                  className="p-1.5 rounded hover:brightness-110 transition cursor-pointer flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline text-[10px]">{copiedLink ? 'Copiado' : 'Compartir'}</span>
                </button>
                <button
                  onClick={onClose}
                  style={{ backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT }}
                  className="p-1.5 rounded hover:brightness-110 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Live Edit Mode Floating Banner */}
          {isLiveEditActive && (
            <div 
              style={{ backgroundColor: COLOR_BTN, borderColor: COLOR_SUBTEXT, color: COLOR_BTN_TEXT }}
              className="relative z-30 px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span style={{ backgroundColor: COLOR_CARD }} className="w-2 h-2 rounded-full animate-ping" />
                <span className="font-bold text-xs">Modo Edición en Vivo:</span>
                <span className="text-[11px] hidden sm:inline opacity-90">
                  Toca sobre cualquier plato, precio, foto o marca para editar directamente en esta carta.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {onAddNewItem && (
                  <button
                    onClick={() => onAddNewItem(activeCategory?.id)}
                    style={{ backgroundColor: COLOR_CARD, color: COLOR_TEXT }}
                    className="px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow hover:brightness-110"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Agregar Plato</span>
                  </button>
                )}
                {onEditBranding && (
                  <button
                    onClick={onEditBranding}
                    style={{ backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT, borderColor: COLOR_SUBTEXT }}
                    className="px-2.5 py-1 rounded-lg border font-bold text-[11px] flex items-center gap-1 cursor-pointer transition hover:brightness-110"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Marca & Fondos</span>
                  </button>
                )}
                {onEditHeader && (
                  <button
                    onClick={onEditHeader}
                    style={{ backgroundColor: '#D946EF', color: '#FFFFFF', borderColor: '#F472B6' }}
                    className="px-2.5 py-1 rounded-lg border font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow hover:brightness-110"
                    title="Editar cabecera de la carta, subir logo y autoajustar"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Cabecera & Logo</span>
                  </button>
                )}
                {onSaveToFirebase && (
                  <button
                    onClick={onSaveToFirebase}
                    disabled={isSavingFirebase}
                    style={{ backgroundColor: COLOR_SUBTEXT, color: '#FFFFFF' }}
                    className="px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow disabled:opacity-50 hover:brightness-110"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isSavingFirebase ? 'Guardando...' : 'Guardar Firebase'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Marine Body */}
          <div 
            className="relative flex-1 overflow-y-auto p-2 sm:p-2.5 pb-24 space-y-3"
            style={marineStyle}
          >
            {/* Header */}
            <div className="relative text-center space-y-1 pt-0 sm:pt-1">
              {/* Discrete close button for anonymous clients */}
              {!isOwnerOrAdmin && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar carta"
                  style={{ backgroundColor: `${COLOR_BTN}25`, color: COLOR_TEXT }}
                  className="absolute top-1 right-1 p-2 rounded-full hover:bg-black/15 transition cursor-pointer z-30"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Header Logo / Banner Container: grows upwards to the top */}
              {(() => {
                const headerLogo = restaurant.branding?.headerLogoUrl || restaurant.logoUrl;
                const isImageOnly = restaurant.branding?.headerDisplayMode === 'IMAGE_ONLY';
                const showName = !isImageOnly && (restaurant.branding?.showHeaderName !== false);
                const showTagline = !isImageOnly && (restaurant.branding?.showHeaderTagline !== false);
                const showBadge = !isImageOnly && (restaurant.branding?.showHeaderBadge !== false);
                const logoFit = restaurant.branding?.headerLogoFit || 'contain';
                const configuredHeight = restaurant.branding?.headerBannerHeight;
                const bannerHeight = configuredHeight && configuredHeight > 100 ? configuredHeight : 180;

                return (
                  <div className="space-y-1 pt-0">
                    {headerLogo && (
                      <div 
                        className="w-full flex items-center justify-center px-2 pt-0 pb-1 relative group cursor-pointer"
                        onClick={onEditHeader || onEditBranding}
                        title={isOwnerOrAdmin ? "Clic para editar la cabecera" : undefined}
                      >
                        <img 
                          src={headerLogo} 
                          alt={restaurant.name} 
                          style={{ 
                            maxHeight: `${bannerHeight}px`,
                            borderColor: logoFit === 'cover' ? undefined : COLOR_BTN 
                          }}
                          className={`transition-all duration-300 ${
                            logoFit === 'cover' 
                              ? 'w-full object-cover rounded-2xl shadow-md' 
                              : 'max-w-full w-auto h-auto max-h-44 sm:max-h-56 md:max-h-64 object-contain'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                        {(isLiveEditActive || isOwnerOrAdmin) && (
                          <span className="opacity-0 group-hover:opacity-100 transition absolute top-1 right-2 bg-neutral-900/90 text-amber-300 border border-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-1 z-30">
                            <Sliders className="w-2.5 h-2.5" /> Editar Cabecera
                          </span>
                        )}
                      </div>
                    )}

                    {showBadge && (
                      <span 
                        style={{ color: COLOR_SUBTEXT }}
                        className="text-[11px] font-mono tracking-widest uppercase font-bold block"
                      >
                        {activeChannel === 'DELIVERY' ? 'CEVICHERÍA DELIVERY EXPRESS' : 'CEVICHERÍA & COCINA MARINA'}
                      </span>
                    )}

                    {showName && (
                      <h1 
                        style={{ 
                          fontFamily: restNameFont,
                          color: COLOR_REST_NAME
                        }}
                        className="text-3xl font-black"
                      >
                        {restaurant.name}
                      </h1>
                    )}

                    {showTagline && (
                      <p 
                        style={{ color: COLOR_REST_NAME, fontFamily: dishDescFont }}
                        className="text-xs font-semibold"
                      >
                        {restaurant.tagline || 'Cevichería Contemporánea & Pesca Artesanal del Día'}
                      </p>
                    )}
                  </div>
                );
              })()}

              {initialTableNumber && (
                <div className="flex justify-center pt-0.5">
                  <span 
                    style={{ backgroundColor: `${COLOR_SUBTEXT}20`, color: COLOR_TEXT, borderColor: COLOR_SUBTEXT }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-bold font-mono shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Mesa {initialTableNumber}</span>
                  </span>
                </div>
              )}

              {isLiveEditActive && (
                <div className="flex justify-center flex-wrap gap-2 pt-1">
                  {onEditHeader && (
                    <button
                      type="button"
                      onClick={onEditHeader}
                      style={{
                        backgroundColor: COLOR_BTN,
                        color: COLOR_BTN_TEXT,
                      }}
                      className="px-3 py-1 rounded-lg hover:brightness-110 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition shadow"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>✏️ Editar Cabecera (Logo/Nombre/Slogan)</span>
                    </button>
                  )}
                  {onEditBranding && (
                    <button
                      type="button"
                      onClick={onEditBranding}
                      style={{
                        backgroundColor: `${COLOR_BTN}15`,
                        color: COLOR_TEXT,
                        borderColor: COLOR_BTN
                      }}
                      className="px-3 py-1 rounded-lg hover:brightness-125 border text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition shadow"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Marca & Colores</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Category Tabs */}
            <div 
              style={{ borderColor: `${COLOR_SUBTEXT}40` }}
              className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b"
            >
              <div className="flex items-center gap-2">
                {currentCategories.map(cat => {
                  const isSelected = selectedCategoryId === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      style={
                        isSelected
                          ? { backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT, borderColor: COLOR_BTN }
                          : { backgroundColor: COLOR_CARD, color: COLOR_TEXT, borderColor: `${COLOR_SUBTEXT}60` }
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                        isSelected ? 'shadow-md scale-[1.02]' : 'hover:brightness-95'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
              {isLiveEditActive && onAddNewItem && (
                <button
                  type="button"
                  onClick={() => onAddNewItem(selectedCategoryId)}
                  style={{
                    backgroundColor: COLOR_BTN,
                    color: COLOR_BTN_TEXT
                  }}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow hover:brightness-110"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Plato</span>
                </button>
              )}
            </div>

            {/* Dishes list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayedItems.map(item => {
                const inCart = cart.find(c => c.item.id === item.id);

                return (
                  <div
                    key={item.id}
                    style={{ 
                      backgroundColor: COLOR_CARD, 
                      borderColor: `${COLOR_BTN}50`,
                      color: COLOR_TEXT
                    }}
                    className="relative p-2 rounded-2xl border transition flex flex-col justify-between space-y-2 shadow-md group"
                  >
                    {/* Live Edit Action Badges */}
                    {isLiveEditActive && (
                      <div 
                        style={{ backgroundColor: COLOR_CARD, borderColor: COLOR_SUBTEXT }}
                        className="absolute top-2 right-2 z-30 flex items-center gap-1 p-1 rounded-lg border shadow-xl backdrop-blur"
                      >
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEditItem && onEditItem(item); }}
                          style={{ backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow"
                          title="Editar nombre, descripción, precio y detalles"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onQuickPriceItem && onQuickPriceItem(item); }}
                          style={{ backgroundColor: COLOR_CARD, color: COLOR_TEXT, borderColor: COLOR_SUBTEXT }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono cursor-pointer transition border"
                          title="Modificar precio rápido"
                        >
                          S/ {item.price.toFixed(2)}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onQuickPhotoItem && onQuickPhotoItem(item); }}
                          style={{ backgroundColor: COLOR_CARD, color: COLOR_TEXT, borderColor: COLOR_SUBTEXT }}
                          className="p-1 rounded text-[10px] cursor-pointer transition border"
                          title="Cambiar foto del plato"
                        >
                          <Camera className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onToggleAvailability && onToggleAvailability(item); }}
                          style={
                            item.isAvailable !== false
                              ? { backgroundColor: COLOR_SUBTEXT, color: '#FFFFFF', borderColor: COLOR_SUBTEXT }
                              : { backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT, borderColor: COLOR_BTN }
                          }
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono cursor-pointer transition border"
                          title="Alternar entre disponible o agotado"
                        >
                          {item.isAvailable !== false ? 'Disponible' : 'Agotado'}
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-black/10">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div 
                          style={{ backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT, fontFamily: dishPriceFont }}
                          className="absolute top-2 left-2 px-2.5 py-1 rounded-md text-xs font-extrabold shadow-md border border-white/20"
                        >
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <h3 
                          style={{ fontFamily: dishNameFont, color: COLOR_TEXT }}
                          className="text-sm font-black uppercase tracking-tight"
                        >
                          {item.name}
                        </h3>
                        <p 
                          style={{ fontFamily: dishDescFont, color: COLOR_TEXT }}
                          className="text-xs line-clamp-2 mt-0.5 font-medium opacity-85"
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div 
                      style={{ borderColor: `${COLOR_SUBTEXT}40` }}
                      className="pt-2 border-t flex items-center justify-between"
                    >
                      <span 
                        style={{ color: COLOR_SUBTEXT }}
                        className="text-[11px] font-mono flex items-center gap-1 font-bold"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{item.prepTimeMinutes ? `${item.prepTimeMinutes} min` : 'Fresco'}</span>
                      </span>
                      <button
                        onClick={() => setSelectedItemForCustomization(item)}
                        style={{ backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md hover:brightness-110 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{inCart ? `(${inCart.quantity}) Pedir` : 'Pedir'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Floating Cart Trigger */}
          {cart.length > 0 && (
            <div 
              style={{ backgroundColor: COLOR_BTN, color: COLOR_BTN_TEXT }}
              className="sticky sm:absolute bottom-0 left-0 right-0 z-30 p-3 pb-6 sm:pb-3 border-t shadow-2xl backdrop-blur-md flex items-center justify-between"
            >
              <div>
                <span style={{ color: COLOR_BTN_TEXT }} className="text-[11px] block font-mono opacity-90">
                  {totalItemsCount} {totalItemsCount === 1 ? 'plato listo' : 'platos listos'} ({activeChannel === 'DELIVERY' ? 'Delivery' : 'Salón'})
                </span>
                <span style={{ color: COLOR_BTN_TEXT }} className="text-sm font-black font-mono">
                  Total: S/ {cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                style={{ backgroundColor: COLOR_CARD, color: COLOR_TEXT, borderColor: COLOR_SUBTEXT }}
                className="px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition border cursor-pointer flex items-center gap-2 hover:brightness-110"
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
          themeAccentColor={COLOR_BTN}
          themeDarkBg={COLOR_BG}
          dishCardBgColor={COLOR_CARD}
          buttonTextColor={COLOR_BTN_TEXT}
          textColor={COLOR_TEXT}
          secondaryColor={COLOR_SUBTEXT}
          dishNameFont={dishNameFont}
          dishDescFont={dishDescFont}
          dishPriceFont={dishPriceFont}
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
        themeStyle="marine"
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
