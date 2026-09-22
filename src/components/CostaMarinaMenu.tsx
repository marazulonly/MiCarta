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
  Star,
  ChefHat,
  Bike,
  Sparkles,
  Clock,
  MapPin,
  Edit3,
  Camera
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
  // Live Editing Props
  isLiveEditActive?: boolean;
  onToggleLiveEdit?: () => void;
  onEditItem?: (item: MenuItem) => void;
  onQuickPriceItem?: (item: MenuItem) => void;
  onQuickPhotoItem?: (item: MenuItem) => void;
  onToggleAvailability?: (item: MenuItem) => void;
  onAddNewItem?: () => void;
  onEditBranding?: () => void;
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
  isLiveEditActive = false,
  onToggleLiveEdit,
  onEditItem,
  onQuickPriceItem,
  onQuickPhotoItem,
  onToggleAvailability,
  onAddNewItem,
  onEditBranding,
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

  const currentCategories = categories.filter(c => c.restaurantId === restaurant.id);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    currentCategories[0]?.id || 'cat-m1'
  );

  if (!isOpen) return null;

  // Background customization from settings or branding
  const accessSettings = restaurant.menuAccessSettings;
  const isSeparate = accessSettings?.menuMode === 'SEPARATE';
  const brandingBg = restaurant.branding?.darkBgColor || restaurant.branding?.backgroundColor;

  let marineStyle: React.CSSProperties = brandingBg
    ? { backgroundColor: brandingBg, backgroundImage: 'none' }
    : { background: 'linear-gradient(180deg, #041824 0%, #031018 100%)' };

  if (!brandingBg) {
    if (activeChannel === 'DELIVERY' && accessSettings?.deliveryBgType) {
      if (accessSettings.deliveryBgType === 'image' && accessSettings.deliveryBgValue) {
        marineStyle = {
          backgroundImage: `linear-gradient(rgba(3, 20, 32, 0.88), rgba(2, 12, 20, 0.95)), url("${accessSettings.deliveryBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      } else if (accessSettings.deliveryBgType === 'color') {
        marineStyle = { backgroundColor: accessSettings.deliveryBgValue || '#041824' };
      } else if (accessSettings.deliveryBgType === 'gradient') {
        marineStyle = { background: accessSettings.deliveryBgValue || 'linear-gradient(180deg, #041824 0%, #031018 100%)' };
      }
    } else if (activeChannel === 'DINE_IN' && accessSettings?.presentialBgType) {
      if (accessSettings.presentialBgType === 'image' && accessSettings.presentialBgValue) {
        marineStyle = {
          backgroundImage: `linear-gradient(rgba(3, 24, 38, 0.85), rgba(1, 14, 24, 0.94)), url("${accessSettings.presentialBgValue}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      } else if (accessSettings.presentialBgType === 'color') {
        marineStyle = { backgroundColor: accessSettings.presentialBgValue || '#031f33' };
      } else if (accessSettings.presentialBgType === 'gradient') {
        marineStyle = { background: accessSettings.presentialBgValue || 'linear-gradient(180deg, #032b45 0%, #010d17 100%)' };
      }
    } else if (activeChannel === 'DELIVERY' && accessSettings?.deliveryBgValue) {
      marineStyle = { background: accessSettings.deliveryBgValue };
    } else if (activeChannel === 'DINE_IN' && accessSettings?.presentialBgValue) {
      marineStyle = { background: accessSettings.presentialBgValue };
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
  const displayedItems = currentItems.filter(i => i.categoryId === activeCategory?.id);

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

  const fullUrl = `https://micarta.io/r/${restaurant.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
        
        {/* Outer Shell Marine Theme */}
        <div 
          style={marineStyle}
          className={`relative w-full ${
            isFullscreen ? 'max-w-4xl h-[96vh]' : 'max-w-xl h-[92vh] max-h-[860px]'
          } rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-sky-500/30 text-[#e0f2fe] transition-all duration-300`}
        >
          {/* Top Bar */}
          <div className="relative z-30 px-4 py-2.5 bg-[#020e17] border-b border-sky-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-sky-300 font-mono tracking-wider uppercase text-[11px] font-bold">
                Costa Marina · {restaurant.name}
              </span>
              
              {/* Channel switcher */}
              <div className="flex items-center gap-1 bg-[#062438] p-0.5 rounded-lg border border-sky-800/40">
                <button
                  disabled={!isDineInEnabled}
                  onClick={() => setActiveChannel('DINE_IN')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                    !isDineInEnabled
                      ? 'opacity-40 cursor-not-allowed text-neutral-500'
                      : activeChannel === 'DINE_IN'
                      ? 'bg-sky-400 text-black font-bold'
                      : 'text-sky-200'
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
                      ? 'bg-sky-400 text-black font-bold'
                      : 'text-sky-200'
                  }`}
                  title={!isDeliveryEnabled ? 'Canal Delivery desactivado en la configuración' : 'Carta Delivery'}
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
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    isLiveEditActive
                      ? 'bg-sky-400 text-black border-sky-300 ring-2 ring-sky-400/50'
                      : 'bg-[#062438] text-sky-300 border-sky-600/40 hover:bg-[#0c3957]'
                  }`}
                  title="Habilita la edición de la carta directamente sobre esta vista"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isLiveEditActive ? 'Edición Activa' : 'Editar Carta'}</span>
                </button>
              )}

              {initialTableNumber && (
                <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold font-mono">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  <span>Mesa {initialTableNumber}</span>
                </span>
              )}
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="p-1.5 rounded bg-[#072a42] text-sky-300 hover:bg-[#0c3957] transition cursor-pointer flex items-center gap-1"
                title="Ver Horarios de Atención"
              >
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline text-[10px]">Horarios</span>
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded bg-[#072a42] text-sky-300 hover:bg-[#0c3957] transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={copyUrl}
                className="p-1.5 rounded bg-[#072a42] text-sky-300 hover:bg-[#0c3957] transition cursor-pointer flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-[10px]">{copiedLink ? 'Copiado' : 'Compartir'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded bg-[#072a42] text-sky-300 hover:bg-[#0c3957] transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Live Edit Mode Floating Banner */}
          {isLiveEditActive && (
            <div className="relative z-30 px-3 py-2 bg-gradient-to-r from-sky-950/95 via-sky-900/95 to-sky-950/95 border-b border-sky-500/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span className="font-bold text-sky-200 text-xs">Modo Edición en Vivo:</span>
                <span className="text-sky-100/90 text-[11px] hidden sm:inline">
                  Toca sobre cualquier plato, precio, foto o marca para editar directamente en esta carta.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {onAddNewItem && (
                  <button
                    onClick={onAddNewItem}
                    className="px-2.5 py-1 rounded-lg bg-sky-400 hover:bg-sky-300 text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Agregar Plato</span>
                  </button>
                )}
                {onEditBranding && (
                  <button
                    onClick={onEditBranding}
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black text-sky-300 border border-sky-400/50 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Marca & Fondos</span>
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

          {/* Marine Body */}
          <div 
            className="relative flex-1 overflow-y-auto p-4 sm:p-5 pb-28 space-y-5"
            style={marineStyle}
          >
            {/* Header */}
            <div className="text-center space-y-1.5">
              {restaurant.logoUrl && (
                <div className="flex justify-center mb-1">
                  <img 
                    src={restaurant.logoUrl} 
                    alt={restaurant.name} 
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-sky-400/50 shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <span className="text-[11px] font-mono tracking-widest text-sky-400 uppercase">
                {activeChannel === 'DELIVERY' ? 'Cevichería Delivery Express' : 'Cevichería & Cocina Marina'}
              </span>
              <h1 className="text-3xl font-black text-white font-serif">
                {restaurant.name}
              </h1>
              <p className="text-xs text-sky-200/80">
                {restaurant.tagline || 'Pescados del día, mariscos selectos y sazón de puerto'}
              </p>

              {isLiveEditActive && onEditBranding && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={onEditBranding}
                    className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/50 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition shadow"
                  >
                    <Edit3 className="w-3 h-3 text-sky-400" />
                    <span>✏️ Personalizar Logo, Nombre y Fondos</span>
                  </button>
                </div>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-sky-900/50">
              <div className="flex items-center gap-2">
                {currentCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedCategoryId === cat.id
                        ? 'bg-sky-400 text-black shadow-md'
                        : 'bg-[#062438] text-sky-200 hover:text-white border border-sky-800/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {isLiveEditActive && onAddNewItem && (
                <button
                  type="button"
                  onClick={onAddNewItem}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Plato</span>
                </button>
              )}
            </div>

            {/* Dishes list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayedItems.map(item => {
                const inCart = cart.find(c => c.item.id === item.id);
                const btnColor = restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#38bdf8';
                const dishNameFont = restaurant.branding?.dishNameFont || 'inherit';
                const dishDescFont = restaurant.branding?.dishDescFont || 'inherit';
                const dishPriceFont = restaurant.branding?.dishPriceFont || 'monospace';

                return (
                  <div
                    key={item.id}
                    style={{ borderColor: btnColor ? `${btnColor}80` : undefined }}
                    className="relative p-3.5 rounded-2xl bg-[#031521]/90 border transition flex flex-col justify-between space-y-3 shadow-lg group"
                  >
                    {/* Live Edit Action Badges */}
                    {isLiveEditActive && (
                      <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-black/95 p-1 rounded-lg border border-sky-400 shadow-xl backdrop-blur">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEditItem && onEditItem(item); }}
                          className="px-2 py-0.5 rounded bg-sky-400 hover:bg-sky-300 text-black text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow"
                          title="Editar nombre, descripción, precio y detalles"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onQuickPriceItem && onQuickPriceItem(item); }}
                          className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-sky-300 text-[10px] font-bold font-mono cursor-pointer transition border border-neutral-700"
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

                    <div className="space-y-2">
                      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-black">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div 
                          style={{ fontFamily: dishPriceFont }}
                          className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow"
                        >
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <h3 
                          style={{ fontFamily: dishNameFont }}
                          className="text-sm font-bold text-white"
                        >
                          {item.name}
                        </h3>
                        <p 
                          style={{ fontFamily: dishDescFont }}
                          className="text-xs text-sky-200/70 line-clamp-2 mt-0.5"
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-sky-900/30 flex items-center justify-between">
                      <span className="text-[11px] text-sky-400 font-mono">
                        {item.prepTimeMinutes ? `⏱ ${item.prepTimeMinutes} min` : 'Fresco al momento'}
                      </span>
                      <button
                        onClick={() => setSelectedItemForCustomization(item)}
                        style={{ backgroundColor: btnColor }}
                        className="px-3 py-1.5 rounded-lg text-black text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow hover:brightness-110"
                      >
                        <Plus className="w-3.5 h-3.5" />
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
            <div className="absolute bottom-0 left-0 right-0 z-30 p-3 bg-[#020e17]/95 border-t border-sky-900/60 shadow-2xl backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-[11px] text-sky-300 block">
                  {totalItemsCount} {totalItemsCount === 1 ? 'plato marino listo' : 'platos marinos listos'} ({activeChannel === 'DELIVERY' ? 'Delivery' : 'Salón'})
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  Total: S/ {cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-bold text-xs shadow-lg transition cursor-pointer flex items-center gap-2"
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
          themeAccentColor={restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#38bdf8'}
          themeDarkBg={restaurant.branding?.darkBgColor || '#031521'}
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
