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
  ChefHat, 
  Bike, 
  Sparkles, 
  Clock, 
  MapPin, 
  Edit3, 
  Camera, 
  Sliders, 
  Zap,
  Tag
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order } from '../types';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';
import { ScheduleViewModal } from './ScheduleViewModal';

interface NeonStreetMenuProps {
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

export const NeonStreetMenu: React.FC<NeonStreetMenuProps> = ({
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
    : [{ id: `cat-${restId}-street`, restaurantId: restId, name: 'Favoritos Street', sortOrder: 1, isActive: true }];

  const [activeCategory, setActiveCategory] = useState<string>(currentCategories[0]?.id || 'all');

  useEffect(() => {
    if (activeCategory !== 'all' && currentCategories.length > 0 && !currentCategories.some(c => c.id === activeCategory)) {
      setActiveCategory(currentCategories[0].id);
    }
  }, [currentCategories, activeCategory]);

  if (!isOpen || !restaurant) return null;

  const branding = restaurant.branding || {
    primaryColor: '#EF4444',
    secondaryColor: '#F59E0B',
    accentColor: '#EF4444',
    darkBgColor: '#09090B',
    cardBgColor: '#18181B',
    textColor: '#FFFFFF',
    fontDisplay: 'Syne, sans-serif',
    buttonColor: '#EF4444',
    buttonTextColor: '#FFFFFF'
  };

  const primaryColor = branding.buttonColor || branding.primaryColor || '#EF4444';
  const buttonTextColor = branding.buttonTextColor || '#FFFFFF';
  const darkBgColor = branding.darkBgColor || '#09090B';
  const cardBgColor = branding.dishCardBgColor || branding.cardBgColor || '#18181B';
  const textColor = branding.textColor || '#FFFFFF';
  const cardRadius = branding.cardBorderRadius || '18px';

  const currentItems = items.filter(i => {
    if (i.restaurantId !== restaurant.id) return false;
    if (activeCategory === 'all') return true;
    return i.categoryId === activeCategory;
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

  const copyUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/?r=${restaurant.slug}` : '';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div 
      style={{ backgroundColor: darkBgColor, color: textColor }}
      className="fixed inset-0 z-50 flex flex-col w-full h-full min-h-screen overflow-y-auto selection:bg-white selection:text-black"
    >
      <div 
        className="relative w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto min-h-screen border-0 shadow-none bg-transparent flex flex-col transition-all duration-300"
      >
        {/* Owner/Admin Bar */}
        {isOwnerOrAdmin && (
          <div className="relative z-30 px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: primaryColor }} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                {restaurant.name} · Neon Street
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {onToggleLiveEdit && (
                <button
                  onClick={onToggleLiveEdit}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isLiveEditActive
                      ? 'bg-amber-400 text-black'
                      : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isLiveEditActive ? 'Edición Activa' : 'Editar Carta'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hero Header */}
        <div className="relative overflow-hidden shrink-0 border-b border-neutral-800/80">
          <div className="relative h-52 sm:h-64 w-full bg-neutral-950">
            {restaurant.coverUrl ? (
              <img src={restaurant.coverUrl} alt={restaurant.name} className="w-full h-full object-cover brightness-75" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

            {/* Top action buttons */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button 
                onClick={copyUrl} 
                className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black transition cursor-pointer"
                title="Copiar enlace"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black transition cursor-pointer hidden sm:block"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {onClose && (
                <button 
                  onClick={onClose} 
                  className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-red-600 transition cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Brand overlay: logo grows upwards to the top */}
            <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3.5">
              {(branding.headerLogoUrl || restaurant.logoUrl) ? (
                <img 
                  src={branding.headerLogoUrl || restaurant.logoUrl} 
                  alt={restaurant.name} 
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-contain border-2 shadow-2xl bg-black/80 shrink-0"
                  style={{ borderColor: primaryColor }}
                />
              ) : (
                <div 
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl shrink-0"
                  style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                >
                  <Zap className="w-9 h-9" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                    {restaurant.name}
                  </h1>
                  <span 
                    className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow"
                    style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                  >
                    Street Food
                  </span>
                </div>
                {restaurant.tagline && (
                  <p 
                    style={{ color: branding.restaurantNameColor || undefined }}
                    className="text-xs line-clamp-1 mt-0.5"
                  >
                    {restaurant.tagline}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-3 border-b border-neutral-800/60 bg-neutral-950/80 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveCategory('all')}
            style={
              activeCategory === 'all'
                ? { backgroundColor: primaryColor, color: buttonTextColor }
                : { backgroundColor: '#18181B', color: '#A1A1AA' }
            }
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-sm"
          >
            🔥 Todos los Platos
          </button>
          {currentCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={
                activeCategory === cat.id
                  ? { backgroundColor: primaryColor, color: buttonTextColor }
                  : { backgroundColor: '#18181B', color: '#A1A1AA' }
              }
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-sm"
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dish List */}
        <div className="flex-1 overflow-y-auto p-4 pb-40 space-y-3.5">
          {isLiveEditActive && onAddNewItem && (
            <button
              onClick={() => onAddNewItem(activeCategory !== 'all' ? activeCategory : undefined)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-neutral-700 hover:border-amber-400 bg-neutral-900/50 hover:bg-neutral-900 text-xs font-bold text-neutral-300 hover:text-amber-300 transition flex items-center justify-center gap-2 cursor-pointer mb-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Agregar Nuevo Plato Street</span>
            </button>
          )}

          {currentItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No hay platos en esta categoría todavía.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentItems.map(item => {
                const inCart = cart.find(c => c.item.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => item.isAvailable && setSelectedItemForCustomization(item)}
                    style={{ 
                      backgroundColor: cardBgColor, 
                      borderRadius: cardRadius,
                      borderColor: inCart ? primaryColor : '#27272A' 
                    }}
                    className={`group relative overflow-hidden border p-3 flex flex-col justify-between transition cursor-pointer hover:border-neutral-500 shadow-md ${
                      !item.isAvailable ? 'opacity-50 grayscale' : ''
                    }`}
                  >
                    {/* Live edit badge */}
                    {isLiveEditActive && (
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/90 p-1 rounded-lg border border-amber-400">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEditItem && onEditItem(item); }}
                          className="px-2 py-0.5 rounded bg-amber-400 text-black text-[10px] font-bold"
                        >
                          Editar
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-900 shrink-0 relative">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        {item.isPopular && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-black font-black text-[8px] uppercase">
                            Top
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-amber-300 transition">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="text-sm font-black font-mono tracking-tight" style={{ color: primaryColor }}>
                        S/ {item.price.toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.isAvailable) setSelectedItemForCustomization(item);
                        }}
                        style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 hover:brightness-110 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCart ? `(${inCart.quantity}) Añadir` : 'Pedir'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart Button (Flush to bottom edge) */}
        {totalItemsCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-neutral-950/95 border-t border-neutral-800 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-neutral-400 block">{totalItemsCount} platos en orden</span>
                <span className="text-base font-black text-white font-mono">S/ {cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                className="px-5 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 shadow-xl hover:brightness-110 cursor-pointer shrink-0 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ver Comanda</span>
              </button>
            </div>
          </div>
        )}

        {/* Item customization modal */}
        {selectedItemForCustomization && (
          <ItemOrderModal
            isOpen={Boolean(selectedItemForCustomization)}
            onClose={() => setSelectedItemForCustomization(null)}
            item={selectedItemForCustomization}
            onConfirm={(item, qty, units) => {
              handleConfirmItemUnits(item, qty, units);
              setSelectedItemForCustomization(null);
            }}
            themeAccentColor={restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#38BDF8'}
            themeDarkBg={restaurant.branding?.darkBgColor || '#090D16'}
            dishCardBgColor={restaurant.branding?.dishCardBgColor || restaurant.branding?.cardBgColor}
            buttonTextColor={restaurant.branding?.buttonTextColor || '#000000'}
            textColor={restaurant.branding?.textColor}
            secondaryColor={restaurant.branding?.secondaryColor}
            dishNameFont={restaurant.branding?.dishNameFont}
            dishDescFont={restaurant.branding?.dishDescFont}
            dishPriceFont={restaurant.branding?.dishPriceFont}
          />
        )}

        {/* Cart Drawer */}
        <UnifiedCartDrawer
          isOpen={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
          cart={cart}
          onUpdateCart={setCart}
          onEditCartEntry={(item) => setSelectedItemForCustomization(item)}
          restaurant={restaurant}
          initialMode={activeChannel}
          initialTableNumber={initialTableNumber}
          onOrderCreated={onOrderCreated}
        />
      </div>
    </div>
  );
};
