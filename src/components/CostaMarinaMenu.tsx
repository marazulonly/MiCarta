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
  MapPin
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
}) => {
  const [activeChannel, setActiveChannel] = useState<'DINE_IN' | 'DELIVERY'>(initialMode);
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

  // Background customization from settings
  const accessSettings = restaurant.menuAccessSettings;
  const isSeparate = accessSettings?.menuMode === 'SEPARATE';

  let marineBg = 'linear-gradient(180deg, #041824 0%, #031018 100%)';
  if (activeChannel === 'DELIVERY' && accessSettings?.deliveryBgValue) {
    marineBg = accessSettings.deliveryBgValue;
  } else if (activeChannel === 'DINE_IN' && accessSettings?.presentialBgValue) {
    marineBg = accessSettings.presentialBgValue;
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
          className={`relative w-full ${
            isFullscreen ? 'max-w-4xl h-[96vh]' : 'max-w-xl h-[92vh] max-h-[860px]'
          } rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-sky-500/30 bg-[#041824] text-[#e0f2fe] transition-all duration-300`}
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
                  onClick={() => setActiveChannel('DINE_IN')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                    activeChannel === 'DINE_IN' ? 'bg-sky-400 text-black font-bold' : 'text-sky-200'
                  }`}
                >
                  <ChefHat className="w-2.5 h-2.5" />
                  <span>Salón</span>
                </button>
                <button
                  onClick={() => setActiveChannel('DELIVERY')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                    activeChannel === 'DELIVERY' ? 'bg-sky-400 text-black font-bold' : 'text-sky-200'
                  }`}
                >
                  <Bike className="w-2.5 h-2.5" />
                  <span>Delivery</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
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

          {/* Marine Body */}
          <div 
            className="relative flex-1 overflow-y-auto p-4 sm:p-5 pb-28 space-y-5"
            style={{ background: marineBg }}
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono tracking-widest text-sky-400 uppercase">
                {activeChannel === 'DELIVERY' ? 'Cevichería Delivery Express' : 'Cevichería & Cocina Marina'}
              </span>
              <h1 className="text-3xl font-black text-white font-serif">
                {restaurant.name}
              </h1>
              <p className="text-xs text-sky-200/80">
                Pescados del día, mariscos selectos y sazón de puerto
              </p>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-sky-900/50">
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

            {/* Dishes list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayedItems.map(item => {
                const inCart = cart.find(c => c.item.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#031521]/90 border border-sky-900/40 hover:border-sky-700/60 transition flex flex-col justify-between space-y-3 shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-black">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-sky-300 font-mono text-xs font-bold border border-sky-500/30">
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {item.name}
                        </h3>
                        <p className="text-xs text-sky-200/70 line-clamp-2 mt-0.5">
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
                        className="px-3 py-1.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-black text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow"
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
          themeAccentColor="#38bdf8"
          themeDarkBg="#041824"
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
