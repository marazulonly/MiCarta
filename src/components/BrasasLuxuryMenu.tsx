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
  Flame,
  Utensils,
  Wine,
  Sparkles,
  Star,
  Layers,
  ChefHat,
  Bike,
  Clock,
  MapPin
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
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('cat-b-parrillas');
  const [activeChannel, setActiveChannel] = useState<'DINE_IN' | 'DELIVERY'>(initialMode);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Item customization modal
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);

  if (!isOpen) return null;

  // Check background customizations from menuAccessSettings
  const accessSettings = restaurant.menuAccessSettings;
  const isSeparate = accessSettings?.menuMode === 'SEPARATE';
  
  // Dynamic background resolution
  let customBgStyle: React.CSSProperties = {
    background: 'radial-gradient(ellipse at 50% 0%, #0d362b 0%, #061c16 45%, #03100c 100%)',
  };

  if (activeChannel === 'DELIVERY' && accessSettings?.deliveryBgType) {
    if (accessSettings.deliveryBgType === 'color') {
      customBgStyle = { backgroundColor: accessSettings.deliveryBgValue || '#0A0A0A' };
    } else if (accessSettings.deliveryBgType === 'gradient') {
      customBgStyle = { background: accessSettings.deliveryBgValue || 'linear-gradient(180deg, #0d362b 0%, #150820 100%)' };
    }
  } else if (activeChannel === 'DINE_IN' && accessSettings?.presentialBgType) {
    if (accessSettings.presentialBgType === 'color') {
      customBgStyle = { backgroundColor: accessSettings.presentialBgValue || '#051813' };
    } else if (accessSettings.presentialBgType === 'gradient') {
      customBgStyle = { background: accessSettings.presentialBgValue || 'radial-gradient(ellipse at 50% 0%, #0d362b 0%, #061c16 45%, #03100c 100%)' };
    }
  }

  // Filter categories for this restaurant
  const currentCategories = categories.filter(c => c.restaurantId === restaurant.id);
  
  // Filter items based on active category & channel
  const currentItems = items.filter(i => {
    const matchRest = i.restaurantId === restaurant.id;
    if (!matchRest) return false;

    // Scope check
    if (isSeparate) {
      if (activeChannel === 'DINE_IN' && i.targetMenuScope === 'DELIVERY') return false;
      if (activeChannel === 'DELIVERY' && i.targetMenuScope === 'DINE_IN') return false;
    }

    if (activeCategory === 'all') return true;
    return i.categoryId === activeCategory;
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

  const fullUrl = `https://micarta.io/r/${restaurant.slug}`;

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
        
        {/* Outer Shell */}
        <div 
          className={`relative w-full ${
            isFullscreen ? 'max-w-4xl h-[96vh]' : 'max-w-xl h-[92vh] max-h-[860px]'
          } rounded-2xl overflow-hidden flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-[#b88e3d]/40 transition-all duration-300`}
          style={{
            backgroundColor: '#051813',
          }}
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
                  onClick={() => setActiveChannel('DINE_IN')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                    activeChannel === 'DINE_IN'
                      ? 'bg-[#dfb86c] text-black font-bold'
                      : 'text-[#ecd8a5] hover:text-white'
                  }`}
                >
                  <ChefHat className="w-2.5 h-2.5" />
                  <span>Salón</span>
                </button>
                <button
                  onClick={() => setActiveChannel('DELIVERY')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                    activeChannel === 'DELIVERY'
                      ? 'bg-[#dfb86c] text-black font-bold'
                      : 'text-[#ecd8a5] hover:text-white'
                  }`}
                >
                  <Bike className="w-2.5 h-2.5" />
                  <span>Delivery</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
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
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#07241c] hover:bg-[#0c392c] text-[#dfb86c] border border-[#b88e3d]/30 transition cursor-pointer"
                title="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

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

              {/* HEADER SECTION */}
              <div className="text-center pt-2 pb-5 space-y-0">
                <div 
                  className="text-[#eed799] tracking-normal font-normal text-3xl sm:text-4xl -mb-3 sm:-mb-4 select-none relative z-10"
                  style={{
                    fontFamily: "'Alex Brush', 'Dancing Script', cursive",
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                  }}
                >
                  {activeChannel === 'DELIVERY' ? 'delivery' : 'the'}
                </div>

                <h1 
                  className="text-4xl sm:text-5xl font-bold tracking-[0.24em] select-none uppercase"
                  style={{
                    fontFamily: "'Cinzel', 'Playfair Display', serif",
                    background: 'linear-gradient(180deg, #fff2cc 0%, #dfb86c 48%, #aa7c28 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))'
                  }}
                >
                  MENU
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
                {currentCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif transition-all cursor-pointer whitespace-nowrap border ${
                      activeCategory === cat.id
                        ? 'bg-gradient-to-r from-[#e7cb82] to-[#b88e3d] text-[#071d17] font-bold border-[#fff] shadow-[0_0_12px_rgba(223,184,108,0.4)]'
                        : 'bg-[#09261f]/80 text-[#d8be86] border-[#dfb86c]/30 hover:bg-[#0f372d] hover:text-white'
                    }`}
                  >
                    {getCategoryIcon(cat.name)}
                    <span>{cat.name}</span>
                  </button>
                ))}

                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-serif transition-all cursor-pointer whitespace-nowrap border ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-[#e7cb82] to-[#b88e3d] text-[#071d17] font-bold border-[#fff] shadow-[0_0_12px_rgba(223,184,108,0.4)]'
                      : 'bg-[#09261f]/80 text-[#d8be86] border-[#dfb86c]/30 hover:bg-[#0f372d] hover:text-white'
                  }`}
                >
                  Todas las Secciones
                </button>
              </div>

              {/* DISH CARDS LIST: Clean presentation (Adicionales & Observaciones only appear when ordering) */}
              <div className="space-y-6 sm:space-y-7 pt-3">
                {currentItems.map((item, idx) => {
                  const inCart = cart.find(c => c.item.id === item.id);
                  const isEven = idx % 2 === 0;

                  return (
                    <div key={item.id} className="relative group">
                      
                      {isEven ? (
                        /* LAYOUT A: Even Items (Circle Left, Card Right) */
                        <div className="flex items-center">
                          <div className="relative z-20 shrink-0 -mr-6 sm:-mr-8 cursor-pointer" onClick={() => handleOpenItemCustomizer(item)}>
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-[#dfb86c]/80 shadow-[0_8px_20px_rgba(0,0,0,0.8)] bg-black">
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>

                          <div className="flex-1 pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl bg-[#0a2720]/85 border border-[#1b4b3e]/80 backdrop-blur-md shadow-2xl relative overflow-hidden text-left">
                            <div className="flex flex-col justify-between h-full space-y-1.5">
                              <div>
                                <h3 
                                  className="text-sm sm:text-base font-semibold text-[#fffdfa] leading-tight flex items-center justify-between"
                                  style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
                                >
                                  <span>{item.name}</span>
                                </h3>
                                <p className="text-[11px] sm:text-xs text-[#cfdecb]/90 font-sans mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>

                              <div className="pt-1 flex items-end justify-between border-t border-[#dfb86c]/20">
                                <div className="flex items-center text-[#dfb86c] text-xs gap-0.5">
                                  <Star className="w-3 h-3 fill-[#dfb86c]" />
                                  <Star className="w-3 h-3 fill-[#dfb86c]" />
                                  <Star className="w-3 h-3 fill-[#dfb86c]" />
                                  <Star className="w-3 h-3 fill-[#dfb86c]" />
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-lg sm:text-xl font-bold text-[#f5df9e] font-serif tracking-tight">
                                    S/ {item.price.toFixed(2)}
                                  </span>

                                  <button
                                    onClick={() => handleOpenItemCustomizer(item)}
                                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#e7cb82] to-[#b88e3d] text-[#071d17] text-xs font-serif font-bold shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-1"
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
                          <div className="flex-1 pr-8 sm:pr-10 pl-3 sm:pl-4 py-3 sm:py-4 rounded-xl bg-[#0a2720]/85 border border-[#1b4b3e]/80 backdrop-blur-md shadow-2xl relative overflow-hidden text-left">
                            <div className="flex flex-col justify-between h-full space-y-1.5">
                              <div>
                                <h3 
                                  className="text-sm sm:text-base font-semibold text-[#fffdfa] leading-tight flex items-center justify-between"
                                  style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
                                >
                                  <span>{item.name}</span>
                                </h3>
                                <p className="text-[11px] sm:text-xs text-[#cfdecb]/90 font-sans mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>

                              <div className="pt-1 flex items-end justify-between border-t border-[#dfb86c]/20">
                                <div className="flex items-center text-[#dfb86c] text-xs gap-0.5">
                                  <Star className="w-3 h-3 fill-[#dfb86c]" />
                                  <Star className="w-3 h-3 fill-[#dfb86c]" />
                                  <Star className="w-3 h-3 fill-[#dfb86c]" />
                                  <Star className="w-3 h-3 fill-[#dfb86c]" />
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-lg sm:text-xl font-bold text-[#f5df9e] font-serif tracking-tight">
                                    S/ {item.price.toFixed(2)}
                                  </span>

                                  <button
                                    onClick={() => handleOpenItemCustomizer(item)}
                                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#e7cb82] to-[#b88e3d] text-[#071d17] text-xs font-serif font-bold shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{inCart ? `(${inCart.quantity}) Pedir` : 'Pedir'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="relative z-20 shrink-0 -ml-6 sm:-ml-8 cursor-pointer" onClick={() => handleOpenItemCustomizer(item)}>
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-[#dfb86c]/80 shadow-[0_8px_20px_rgba(0,0,0,0.8)] bg-black">
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
            <div className="absolute bottom-0 left-0 right-0 z-30 p-3 bg-[#03110d]/95 border-t border-[#b88e3d]/40 shadow-2xl backdrop-blur-lg flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#cfdecb] block">
                  {totalItemsCount} {totalItemsCount === 1 ? 'plato configurado' : 'platos configurados'} ({activeChannel === 'DELIVERY' ? 'Delivery' : 'Salón'})
                </span>
                <span className="text-sm font-bold text-[#f5df9e] font-serif tracking-wide">
                  Total: S/ {cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#e7cb82] to-[#b88e3d] text-[#071d17] font-serif font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-2"
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
          themeAccentColor="#dfb86c"
          themeDarkBg="#051813"
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
