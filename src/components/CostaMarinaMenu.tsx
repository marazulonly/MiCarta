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

  const rawCategories = categories
    .filter(c => c.restaurantId === restaurant.id)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const currentCategories = rawCategories.length > 0
    ? rawCategories
    : [{ id: `cat-${restaurant.id}-general`, restaurantId: restaurant.id, name: 'De la Casa', sortOrder: 1, isActive: true }];

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    currentCategories[0]?.id || `cat-${restaurant.id}-general`
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
  const brandingBg = restaurant.branding?.darkBgColor || restaurant.branding?.backgroundColor;

  // 4 Palette Colors for Costa Marina (Cevichito Pliz) (Grayscale adaptation)
  const COLOR_TEAL = '#111111';      // Black (Barra superior, marcos, títulos, pestañas activas, badge de precio)
  const COLOR_CREAM = '#FFFFFF';     // White (Fondo general, tarjetas de platos, texto claro en botones)
  const COLOR_TERRACOTTA = '#111111'; // Black (Botón Pedir, acciones destacadas, alertas)
  const COLOR_OLIVE = '#71717A';      // Dark gray (Subtítulos, íconos, tiempo de preparación, bordes secundarios)

  let marineStyle: React.CSSProperties = {
    backgroundColor: restaurant.branding?.darkBgColor || COLOR_CREAM,
    color: restaurant.branding?.textColor || COLOR_TEAL,
  };

  if (!brandingBg) {
    if (activeChannel === 'DELIVERY' && accessSettings?.deliveryBgType) {
      if (accessSettings.deliveryBgType === 'image' && accessSettings.deliveryBgValue) {
        marineStyle = {
          backgroundImage: `linear-gradient(rgba(234, 235, 220, 0.92), rgba(234, 235, 220, 0.96)), url("${accessSettings.deliveryBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: COLOR_TEAL,
        };
      } else if (accessSettings.deliveryBgType === 'color') {
        marineStyle = { backgroundColor: accessSettings.deliveryBgValue || COLOR_CREAM, color: COLOR_TEAL };
      }
    } else if (activeChannel === 'DINE_IN' && accessSettings?.presentialBgType) {
      if (accessSettings.presentialBgType === 'image' && accessSettings.presentialBgValue) {
        marineStyle = {
          backgroundImage: `linear-gradient(rgba(234, 235, 220, 0.92), rgba(234, 235, 220, 0.96)), url("${accessSettings.presentialBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: COLOR_TEAL,
        };
      } else if (accessSettings.presentialBgType === 'color') {
        marineStyle = { backgroundColor: accessSettings.presentialBgValue || COLOR_CREAM, color: COLOR_TEAL };
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
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl overflow-y-auto"
      >
        
        {/* Outer Shell Marine Theme */}
        <div 
          style={{ ...marineStyle, borderColor: COLOR_TEAL }}
          className={`relative w-full ${
            isFullscreen ? 'max-w-4xl h-[96vh]' : 'max-w-xl h-[92vh] max-h-[860px]'
          } rounded-2xl overflow-hidden flex flex-col shadow-2xl border transition-all duration-300`}
        >
          {/* Top Bar - Únicamente visible para administradores y dueños, oculto para comensales y clientes anónimos */}
          {isOwnerOrAdmin && (
            <div 
              style={{ backgroundColor: COLOR_TEAL, borderColor: COLOR_OLIVE }}
              className="relative z-30 px-2.5 py-1.5 border-b flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span 
                  style={{ color: COLOR_CREAM }}
                  className="font-mono tracking-wider uppercase text-[11px] font-bold"
                >
                  {restaurant.name.toUpperCase()} · CARTA DIGITAL
                </span>
                
                {/* Channel switcher */}
                <div 
                  style={{ backgroundColor: `${COLOR_TEAL}e6`, borderColor: COLOR_OLIVE }}
                  className="flex items-center gap-1 p-0.5 rounded-lg border"
                >
                  <button
                    disabled={!isDineInEnabled}
                    onClick={() => setActiveChannel('DINE_IN')}
                    style={
                      activeChannel === 'DINE_IN'
                        ? { backgroundColor: COLOR_TERRACOTTA, color: COLOR_CREAM }
                        : { backgroundColor: 'transparent', color: COLOR_CREAM }
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
                        ? { backgroundColor: COLOR_TERRACOTTA, color: COLOR_CREAM }
                        : { backgroundColor: 'transparent', color: COLOR_CREAM }
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
                        ? { backgroundColor: COLOR_TERRACOTTA, color: COLOR_CREAM, borderColor: COLOR_CREAM }
                        : { backgroundColor: COLOR_TEAL, color: COLOR_CREAM, borderColor: COLOR_OLIVE }
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
                    style={{ backgroundColor: `${COLOR_OLIVE}30`, color: COLOR_CREAM, borderColor: COLOR_OLIVE }}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold font-mono"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Mesa {initialTableNumber}</span>
                  </span>
                )}
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  style={{ backgroundColor: COLOR_TEAL, color: COLOR_CREAM }}
                  className="p-1.5 rounded hover:brightness-110 transition cursor-pointer flex items-center gap-1"
                  title="Ver Horarios de Atención"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Horarios</span>
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  style={{ backgroundColor: COLOR_TEAL, color: COLOR_CREAM }}
                  className="p-1.5 rounded hover:brightness-110 transition cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={copyUrl}
                  style={{ backgroundColor: COLOR_TEAL, color: COLOR_CREAM }}
                  className="p-1.5 rounded hover:brightness-110 transition cursor-pointer flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline text-[10px]">{copiedLink ? 'Copiado' : 'Compartir'}</span>
                </button>
                <button
                  onClick={onClose}
                  style={{ backgroundColor: COLOR_TEAL, color: COLOR_CREAM }}
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
              style={{ backgroundColor: COLOR_TEAL, borderColor: COLOR_OLIVE, color: COLOR_CREAM }}
              className="relative z-30 px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span style={{ backgroundColor: COLOR_TERRACOTTA }} className="w-2 h-2 rounded-full animate-ping" />
                <span className="font-bold text-xs">Modo Edición en Vivo:</span>
                <span className="text-[11px] hidden sm:inline opacity-90">
                  Toca sobre cualquier plato, precio, foto o marca para editar directamente en esta carta.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {onAddNewItem && (
                  <button
                    onClick={onAddNewItem}
                    style={{ backgroundColor: COLOR_TERRACOTTA, color: COLOR_CREAM }}
                    className="px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow hover:brightness-110"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Agregar Plato</span>
                  </button>
                )}
                {onEditBranding && (
                  <button
                    onClick={onEditBranding}
                    style={{ backgroundColor: COLOR_TEAL, color: COLOR_CREAM, borderColor: COLOR_OLIVE }}
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
                    style={{ backgroundColor: COLOR_OLIVE, color: COLOR_CREAM }}
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
            <div className={`relative text-center space-y-1.5 ${!isOwnerOrAdmin ? 'pt-4 sm:pt-6' : ''}`}>
              {/* Discrete close button for anonymous clients */}
              {!isOwnerOrAdmin && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar carta"
                  style={{ backgroundColor: `${COLOR_TEAL}18`, color: COLOR_TEAL }}
                  className="absolute top-0 right-0 p-2 rounded-full hover:bg-black/10 transition cursor-pointer z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Header Logo / Banner Container (Autoajuste Magenta Area) */}
              {(() => {
                const headerLogo = restaurant.branding?.headerLogoUrl || restaurant.logoUrl;
                const isImageOnly = restaurant.branding?.headerDisplayMode === 'IMAGE_ONLY';
                const showName = !isImageOnly && (restaurant.branding?.showHeaderName !== false);
                const showTagline = !isImageOnly && (restaurant.branding?.showHeaderTagline !== false);
                const showBadge = !isImageOnly && (restaurant.branding?.showHeaderBadge !== false);
                const logoFit = restaurant.branding?.headerLogoFit || 'contain';
                const bannerHeight = restaurant.branding?.headerBannerHeight || 100;

                return (
                  <div className="space-y-1">
                    {headerLogo && (
                      <div 
                        className="w-full flex items-center justify-center px-2 py-1 relative group cursor-pointer"
                        onClick={onEditHeader || onEditBranding}
                        title={isOwnerOrAdmin ? "Clic para editar la cabecera" : undefined}
                      >
                        <img 
                          src={headerLogo} 
                          alt={restaurant.name} 
                          style={{ 
                            maxHeight: `${bannerHeight}px`,
                            borderColor: logoFit === 'cover' ? undefined : COLOR_TEAL 
                          }}
                          className={`transition-all duration-300 ${
                            logoFit === 'cover' 
                              ? 'w-full object-cover rounded-2xl shadow-md' 
                              : logoFit === 'auto'
                              ? 'max-w-full object-contain'
                              : 'max-w-full object-contain'
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
                        style={{ color: COLOR_OLIVE }}
                        className="text-[11px] font-mono tracking-widest uppercase font-bold block"
                      >
                        {activeChannel === 'DELIVERY' ? 'CEVICHERÍA DELIVERY EXPRESS' : 'CEVICHERÍA & COCINA MARINA'}
                      </span>
                    )}

                    {showName && (
                      <h1 
                        style={{ 
                          fontFamily: restaurant.branding?.restaurantNameFont || restaurant.branding?.fontDisplay || 'inherit',
                          color: COLOR_TEAL
                        }}
                        className="text-3xl font-black"
                      >
                        {restaurant.name}
                      </h1>
                    )}

                    {showTagline && (
                      <p 
                        style={{ color: COLOR_TEAL }}
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
                    style={{ backgroundColor: `${COLOR_OLIVE}20`, color: COLOR_TEAL, borderColor: COLOR_OLIVE }}
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
                        backgroundColor: COLOR_TERRACOTTA,
                        color: COLOR_CREAM,
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
                        backgroundColor: `${COLOR_TEAL}15`,
                        color: COLOR_TEAL,
                        borderColor: COLOR_TEAL
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
              style={{ borderColor: COLOR_OLIVE }}
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
                          ? { backgroundColor: COLOR_TEAL, color: COLOR_CREAM, borderColor: COLOR_TEAL }
                          : { backgroundColor: COLOR_CREAM, color: COLOR_TEAL, borderColor: COLOR_OLIVE }
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
                    backgroundColor: COLOR_TERRACOTTA,
                    color: COLOR_CREAM
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
                const dishNameFont = restaurant.branding?.dishNameFont || 'inherit';
                const dishDescFont = restaurant.branding?.dishDescFont || 'inherit';
                const dishPriceFont = restaurant.branding?.dishPriceFont || 'monospace';

                return (
                  <div
                    key={item.id}
                    style={{ 
                      backgroundColor: COLOR_CREAM, 
                      borderColor: COLOR_OLIVE,
                      color: COLOR_TEAL
                    }}
                    className="relative p-2 rounded-2xl border transition flex flex-col justify-between space-y-2 shadow-md group"
                  >
                    {/* Live Edit Action Badges */}
                    {isLiveEditActive && (
                      <div 
                        style={{ backgroundColor: COLOR_TEAL, borderColor: COLOR_OLIVE }}
                        className="absolute top-2 right-2 z-30 flex items-center gap-1 p-1 rounded-lg border shadow-xl backdrop-blur"
                      >
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEditItem && onEditItem(item); }}
                          style={{ backgroundColor: COLOR_TERRACOTTA, color: COLOR_CREAM }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow"
                          title="Editar nombre, descripción, precio y detalles"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onQuickPriceItem && onQuickPriceItem(item); }}
                          style={{ backgroundColor: COLOR_TEAL, color: COLOR_CREAM, borderColor: COLOR_OLIVE }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono cursor-pointer transition border"
                          title="Modificar precio rápido"
                        >
                          S/ {item.price.toFixed(2)}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onQuickPhotoItem && onQuickPhotoItem(item); }}
                          style={{ backgroundColor: COLOR_TEAL, color: COLOR_CREAM, borderColor: COLOR_OLIVE }}
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
                              ? { backgroundColor: COLOR_OLIVE, color: COLOR_CREAM, borderColor: COLOR_OLIVE }
                              : { backgroundColor: COLOR_TERRACOTTA, color: COLOR_CREAM, borderColor: COLOR_TERRACOTTA }
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
                          style={{ backgroundColor: COLOR_TEAL, color: COLOR_CREAM, borderColor: COLOR_OLIVE, fontFamily: dishPriceFont }}
                          className="absolute top-2 left-2 px-2.5 py-1 rounded-md text-xs font-extrabold shadow-md border"
                        >
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <h3 
                          style={{ fontFamily: dishNameFont, color: COLOR_TEAL }}
                          className="text-sm font-black uppercase tracking-tight"
                        >
                          {item.name}
                        </h3>
                        <p 
                          style={{ fontFamily: dishDescFont, color: COLOR_TEAL }}
                          className="text-xs line-clamp-2 mt-0.5 font-medium opacity-90"
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div 
                      style={{ borderColor: `${COLOR_OLIVE}60` }}
                      className="pt-2 border-t flex items-center justify-between"
                    >
                      <span 
                        style={{ color: COLOR_OLIVE }}
                        className="text-[11px] font-mono flex items-center gap-1 font-bold"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{item.prepTimeMinutes ? `${item.prepTimeMinutes} min` : 'Fresco'}</span>
                      </span>
                      <button
                        onClick={() => setSelectedItemForCustomization(item)}
                        style={{ backgroundColor: COLOR_TERRACOTTA, color: COLOR_CREAM }}
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
              style={{ backgroundColor: COLOR_TEAL, borderColor: COLOR_OLIVE }}
              className="absolute bottom-0 left-0 right-0 z-30 p-3 border-t shadow-2xl backdrop-blur-md flex items-center justify-between"
            >
              <div>
                <span style={{ color: COLOR_CREAM }} className="text-[11px] block font-mono">
                  {totalItemsCount} {totalItemsCount === 1 ? 'plato marino listo' : 'platos marinos listos'} ({activeChannel === 'DELIVERY' ? 'Delivery' : 'Salón'})
                </span>
                <span style={{ color: COLOR_CREAM }} className="text-sm font-black font-mono">
                  Total: S/ {cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                style={{ backgroundColor: COLOR_TERRACOTTA, color: COLOR_CREAM }}
                className="px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-2 hover:brightness-110"
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
          themeAccentColor={COLOR_TERRACOTTA}
          themeDarkBg={COLOR_CREAM}
          buttonTextColor={COLOR_CREAM}
          textColor={COLOR_TEAL}
          secondaryColor={COLOR_OLIVE}
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
