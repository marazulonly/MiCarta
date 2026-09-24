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
  ChefHat, 
  Bike, 
  Sparkles, 
  Clock, 
  MapPin, 
  Edit3, 
  Camera, 
  Sliders,
  Utensils
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order } from '../types';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';

interface MinimalistBistroMenuProps {
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
}

interface CartEntry {
  item: MenuItem;
  quantity: number;
  units: OrderItemUnit[];
}

export const MinimalistBistroMenu: React.FC<MinimalistBistroMenuProps> = ({
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
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);

  const rawCategories = categories
    .filter(c => c.restaurantId === restaurant.id)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const currentCategories = rawCategories.length > 0
    ? rawCategories
    : [{ id: `cat-${restaurant.id}-bistro`, restaurantId: restaurant.id, name: 'Platos del Día', sortOrder: 1, isActive: true }];

  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const branding = restaurant.branding || {
    primaryColor: '#FFFFFF',
    secondaryColor: '#A3A3A3',
    accentColor: '#FFFFFF',
    darkBgColor: '#0A0A0A',
    cardBgColor: '#121212',
    textColor: '#E5E5E5',
    fontDisplay: 'Plus Jakarta Sans, sans-serif',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#000000'
  };

  const primaryColor = branding.buttonColor || branding.primaryColor || '#FFFFFF';
  const buttonTextColor = branding.buttonTextColor || '#000000';
  const darkBgColor = branding.darkBgColor || '#0A0A0A';
  const cardBgColor = branding.dishCardBgColor || branding.cardBgColor || '#121212';
  const textColor = branding.textColor || '#E5E5E5';
  const priceColor = branding.priceColor || primaryColor;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
      <div 
        className={`relative w-full ${
          isFullscreen ? 'max-w-4xl h-[96vh]' : 'max-w-xl h-[92vh] max-h-[860px]'
        } rounded-none border border-neutral-800 flex flex-col shadow-2xl transition-all duration-300`}
        style={{ backgroundColor: darkBgColor, color: textColor }}
      >
        {/* Editorial Top Bar */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-start justify-between">
          <div>
            {(branding.headerLogoUrl || restaurant.logoUrl) && (
              <div className="mb-2">
                <img
                  src={branding.headerLogoUrl || restaurant.logoUrl}
                  alt={restaurant.name}
                  className="max-h-16 max-w-full object-contain"
                />
              </div>
            )}
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 block mb-1">
              {restaurant.cuisineType || 'Bistró & Gastronomía'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white uppercase">
              {restaurant.name}
            </h1>
            {restaurant.tagline && (
              <p className="text-xs text-neutral-400 mt-1 font-serif italic">
                {restaurant.tagline}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={copyUrl} 
              className="p-2 text-neutral-400 hover:text-white transition cursor-pointer"
              title="Compartir carta"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Minimal Categories Nav */}
        <div className="px-4 sm:px-6 py-3 border-b border-neutral-800/80 flex items-center gap-6 overflow-x-auto scrollbar-none text-xs uppercase tracking-wider font-mono">
          <button
            onClick={() => setActiveCategory('all')}
            className={`transition cursor-pointer pb-1 border-b-2 whitespace-nowrap ${
              activeCategory === 'all'
                ? 'border-white text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Todos
          </button>
          {currentCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`transition cursor-pointer pb-1 border-b-2 whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'border-white text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items List - Clean Rows */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-neutral-900 space-y-4">
          {isLiveEditActive && onAddNewItem && (
            <button
              onClick={() => onAddNewItem(activeCategory !== 'all' ? activeCategory : undefined)}
              className="w-full py-2.5 border border-dashed border-neutral-700 hover:border-white text-xs text-neutral-300 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer mb-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Añadir Plato a la Carta</span>
            </button>
          )}

          {currentItems.map(item => {
            const inCart = cart.find(c => c.item.id === item.id);
            return (
              <div 
                key={item.id}
                onClick={() => item.isAvailable && setSelectedItemForCustomization(item)}
                className="pt-4 first:pt-0 group flex items-start justify-between gap-4 cursor-pointer hover:bg-neutral-900/30 p-2 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-medium text-white group-hover:text-amber-200 transition">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 font-light mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-2">
                  <span className="text-xs font-mono font-medium" style={{ color: priceColor }}>
                    S/ {item.price.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.isAvailable) setSelectedItemForCustomization(item);
                    }}
                    style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                    className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-bold transition hover:opacity-90"
                  >
                    {inCart ? `(${inCart.quantity}) +` : 'Añadir'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Order Summary */}
        {totalItemsCount > 0 && (
          <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">{totalItemsCount} selección(es)</span>
              <span className="text-sm font-mono font-bold text-white">S/ {cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              style={{ backgroundColor: primaryColor, color: buttonTextColor }}
              className="px-4 py-2 font-mono uppercase text-xs font-bold transition hover:opacity-90 cursor-pointer"
            >
              Completar Pedido →
            </button>
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
          />
        )}

        {/* Cart Drawer */}
        <UnifiedCartDrawer
          isOpen={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
          cart={cart}
          onUpdateQuantity={(itemId, delta) => {
            setCart(prev => {
              return prev.map(c => {
                if (c.item.id === itemId) {
                  const newQ = c.quantity + delta;
                  return newQ > 0 ? { ...c, quantity: newQ } : null;
                }
                return c;
              }).filter(Boolean) as CartEntry[];
            });
          }}
          onRemoveItem={(itemId) => {
            setCart(prev => prev.filter(c => c.item.id !== itemId));
          }}
          onClearCart={() => setCart([])}
          restaurant={restaurant}
          initialMode={activeChannel}
          initialTableNumber={initialTableNumber}
          onOrderCreated={(order) => {
            if (onOrderCreated) onOrderCreated(order);
            setCart([]);
            setIsCartDrawerOpen(false);
          }}
        />
      </div>
    </div>
  );
};
