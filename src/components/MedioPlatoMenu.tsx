import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Check, 
  Plus, 
  Maximize2, 
  Minimize2, 
  Share2,
  ChefHat,
  Bike,
  Clock,
  MapPin,
  Edit3,
  Image as ImageIcon,
  Utensils
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order } from '../types';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';
import { ScheduleViewModal } from './ScheduleViewModal';

interface MedioPlatoMenuProps {
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

interface CartItemEntry {
  item: MenuItem;
  quantity: number;
  units: OrderItemUnit[];
}

// Sample items matching medioplato2.jpg if no restaurant items exist
const SAMPLE_MEDIO_PLATO_ITEMS: MenuItem[] = [
  {
    id: 'sample-causa-acevichada',
    restaurantId: 'sample',
    categoryId: 'sample-cat',
    name: 'CAUSA ACEVICHADA',
    description: 'Papa amarilla rellena de atún acevichado, acompañada de palta y tomate.',
    price: 26.00,
    imageUrl: '',
    isAvailable: true,
    prepTimeMinutes: 15,
    allergens: ['pescado'],
    tags: ['pescado']
  },
  {
    id: 'sample-causa-macho',
    restaurantId: 'sample',
    categoryId: 'sample-cat',
    name: 'CAUSA A LO MACHO',
    description: 'Bolas de papa amarilla aderezadas, acompañadas de mariscos y nuestra deliciosa salsa picante.',
    price: 28.00,
    imageUrl: '',
    isAvailable: true,
    prepTimeMinutes: 20,
    allergens: ['mariscos'],
    tags: ['mariscos']
  },
  {
    id: 'sample-pulpo-parrilla',
    restaurantId: 'sample',
    categoryId: 'sample-cat',
    name: 'PULPO A LA PARRILLA',
    description: 'Tentáculos de pulpo fresco cocinados sobre las brasas de nuestra parrilla; acompañados de papa doradita, choclo y vegetales.',
    price: 38.00,
    imageUrl: '',
    isAvailable: true,
    prepTimeMinutes: 25,
    allergens: ['mariscos'],
    tags: ['parrilla']
  },
  {
    id: 'sample-pulpo-aceituna',
    restaurantId: 'sample',
    categoryId: 'sample-cat',
    name: 'PULPO EN CREMA DE ACEITUNA',
    description: 'Láminas de pulpo aderezado en limón y sal, bañadas con nuestra suculenta crema moradita de aceitunas.',
    price: 35.00,
    imageUrl: '',
    isAvailable: true,
    prepTimeMinutes: 18,
    allergens: ['mariscos'],
    tags: ['frios']
  }
];

export const MedioPlatoMenu: React.FC<MedioPlatoMenuProps> = ({
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
  onAddNewItem,
  onEditBranding,
  onEditHeader
}) => {
  // Navigation & Channels
  const [activeChannel, setActiveChannel] = useState<'DINE_IN' | 'DELIVERY'>(initialMode);
  const isDineInEnabled = restaurant.menuAccessSettings?.enableDineIn !== false;
  const isDeliveryEnabled = restaurant.menuAccessSettings?.enableDelivery !== false;

  useEffect(() => {
    if (initialMode === 'DELIVERY' && isDeliveryEnabled) {
      setActiveChannel('DELIVERY');
    } else if (isDineInEnabled) {
      setActiveChannel('DINE_IN');
    } else if (isDeliveryEnabled) {
      setActiveChannel('DELIVERY');
    }
  }, [initialMode, isDineInEnabled, isDeliveryEnabled]);

  // Categories
  const restaurantCategories = categories.filter(c => c.restaurantId === restaurant.id);
  const currentCategories = restaurantCategories.length > 0 
    ? restaurantCategories 
    : [
        { id: 'cat-1', restaurantId: restaurant.id, name: 'Entradas & Piqueos', sortOrder: 1, isActive: true },
        { id: 'cat-2', restaurantId: restaurant.id, name: 'Nuestras Causitas', sortOrder: 2, isActive: true }
      ];

  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Interactive Cart & Selection State
  const [cart, setCart] = useState<CartItemEntry[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Palette & Branding matching medioplato2.jpg
  const branding = restaurant.branding || {
    primaryColor: '#000000',
    secondaryColor: '#D97757',
    accentColor: '#D97757',
    darkBgColor: '#E6E8DF',
    cardBgColor: '#E6E8DF',
    textColor: '#1A1A1A',
    fontDisplay: "'Playfair Display', serif",
    buttonColor: '#D97757',
    buttonTextColor: '#FFFFFF',
    dishNameFont: "'Playfair Display', serif",
    dishDescFont: "'Plus Jakarta Sans', sans-serif",
    dishPriceFont: "'Playfair Display', serif"
  };

  // The menu background color (fondo de la carta)
  const cartaBg = branding.darkBgColor || branding.cardBgColor || '#E6E8DF';
  const accentColor = branding.accentColor || '#D97757';
  const dishNameFont = branding.dishNameFont || "'Playfair Display', Georgia, serif";
  const dishDescFont = branding.dishDescFont || "'Plus Jakarta Sans', sans-serif";

  // Filter Items by channel and category
  const restaurantItems = items.filter(item => item.restaurantId === restaurant.id);
  const channelItems = restaurantItems.filter(item => {
    if (activeChannel === 'DINE_IN' && item.targetMenuScope === 'DELIVERY') return false;
    if (activeChannel === 'DELIVERY' && item.targetMenuScope === 'DINE_IN') return false;
    if (activeCategory === 'all') return true;
    return item.categoryId === activeCategory;
  });

  // Use real items if present, or fallback to sample items matching medioplato2.jpg
  const displayedItems = channelItems.length > 0 ? channelItems : SAMPLE_MEDIO_PLATO_ITEMS;

  const currencySymbol = (restaurant as any).currencySymbol || (restaurant as any).currency || 'S/';

  const cartTotalItemsCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartGrandTotal = cart.reduce((sum, c) => {
    const base = c.item.price * c.quantity;
    const addons = c.units.reduce((uSum, u) => {
      return uSum + (u.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
    }, 0);
    return sum + base + addons;
  }, 0);

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

  const copyUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/?r=${restaurant.slug}` : '';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{ backgroundColor: cartaBg }}
      className="fixed inset-0 z-50 flex flex-col w-full h-full min-h-screen overflow-y-auto selection:bg-black selection:text-white"
    >
      {/* Main Menu Page Canvas: Matches medioplato2.jpg with 100% screen background and no outer borders */}
      <div 
        className="relative w-full max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto min-h-screen flex flex-col border-0 shadow-none bg-transparent"
      >
        {/* Top Control Bar (Admin & Navigation) */}
        {isOwnerOrAdmin && (
          <div className="relative z-30 px-4 py-2.5 bg-neutral-950 text-white flex items-center justify-between text-xs select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-serif font-bold tracking-wider text-neutral-200 uppercase text-[11px]">
                {restaurant.name} · Medio Plato
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {onToggleLiveEdit && (
                <button
                  onClick={onToggleLiveEdit}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isLiveEditActive
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isLiveEditActive ? 'Edición Activa' : 'Editar'}</span>
                </button>
              )}

              <button 
                onClick={copyUrl}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                title="Copiar enlace"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>

              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer hidden sm:block"
                title="Pantalla completa"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button 
                onClick={onClose}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-red-600 text-neutral-300 hover:text-white transition cursor-pointer"
                title="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Header Hero Banner with Logo growing upwards to the top */}
        <header className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden bg-neutral-900 flex items-center justify-center select-none shrink-0 shadow-md">
          {/* Discrete close button for anonymous clients */}
          {!isOwnerOrAdmin && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar carta"
              className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition cursor-pointer z-30"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Banner background photo */}
          <img 
            src={restaurant.branding?.headerLogoUrl || restaurant.coverImageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80'}
            alt={restaurant.name}
            className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Logo Badge growing upwards to the top */}
          <div className="relative z-10 flex flex-col items-center justify-center p-2 w-full h-full">
            {restaurant.logoUrl ? (
              <img 
                src={restaurant.logoUrl} 
                alt={restaurant.name} 
                className="max-h-36 sm:max-h-48 md:max-h-56 max-w-[320px] w-auto h-auto object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="px-6 py-3 rounded-2xl border-2 border-cyan-500/80 bg-black/75 shadow-2xl backdrop-blur-sm text-center">
                <span className="font-serif font-black tracking-widest text-cyan-400 text-xl sm:text-3xl uppercase drop-shadow">
                  {restaurant.name}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Category Pills Navigation matching medioplato2.jpg */}
        <nav className="px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none select-none shrink-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold font-sans transition-all whitespace-nowrap cursor-pointer shadow-sm ${
              activeCategory === 'all'
                ? 'bg-[#D97757] text-white shadow-md'
                : 'bg-[#D6DAD1] text-neutral-800 hover:bg-[#CAD0C4]'
            }`}
          >
            Todas las Secciones
          </button>
          {currentCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold font-sans transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                activeCategory === cat.id
                  ? 'bg-[#D97757] text-white shadow-md'
                  : 'bg-[#D6DAD1] text-neutral-800 hover:bg-[#CAD0C4]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        {/* ========================================================================= */}
        {/* DISHES LIST: EXACT REPLICA OF medioplato2.jpg                             */}
        {/* - Card background = carta background (NO white card, NO border, NO shadow) */}
        {/* - Alternating enlarged photos:                                             */}
        {/*     Odd rows: Photo Left, Text Right (Left-aligned)                        */}
        {/*     Even rows: Text Left (Right-aligned), Photo Right                      */}
        {/* - Full description visible without cuts                                    */}
        {/* ========================================================================= */}
        <main className="flex-1 px-3 sm:px-6 py-4 space-y-6 sm:space-y-8 overflow-y-auto">
          {displayedItems.map((item, index) => {
            const isEven = index % 2 === 1;

            return (
              <div 
                key={item.id}
                className="relative group transition-opacity duration-200"
              >
                {/* Live Edit Controls Header for Owner */}
                {isOwnerOrAdmin && isLiveEditActive && (
                  <div className="mb-2 p-2 rounded-lg bg-neutral-900 text-white font-sans text-xs flex items-center justify-between gap-2 shadow-sm z-20">
                    <span className="font-mono font-bold text-amber-300 line-clamp-1">{item.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onQuickPriceItem && (
                        <button
                          onClick={() => onQuickPriceItem(item)}
                          className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono font-bold"
                          title="Editar Precio"
                        >
                          S/ {item.price.toFixed(2)}
                        </button>
                      )}
                      {onQuickPhotoItem && (
                        <button
                          onClick={() => onQuickPhotoItem(item)}
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                          title="Cambiar Foto"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      )}
                      {onEditItem && (
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                          title="Editar Plato"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                      )}
                      {onDeleteItem && (
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 rounded bg-neutral-800 hover:bg-red-950 text-red-400"
                          title="Eliminar Plato"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 
                  THE DISH CARD:
                  - Background matches the carta background (bg-transparent, no white box)
                  - NO border (border-0 border-transparent)
                  - NO shadow (shadow-none)
                */}
                <div 
                  onClick={() => setSelectedItemForCustomization(item)}
                  style={{ backgroundColor: 'transparent' }}
                  className="w-full border-0 border-transparent shadow-none rounded-none p-1 sm:p-2 cursor-pointer select-none"
                >
                  {!isEven ? (
                    /* ------------------------------------------------------------- */
                    /* ODD ROW: PHOTO ON LEFT, INFO ON RIGHT                         */
                    /* ------------------------------------------------------------- */
                    <div className="flex items-center gap-4 sm:gap-6">
                      {/* Photo on Left: Enlarged circular dish plate */}
                      <div className="shrink-0 flex items-center justify-center">
                        <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden bg-[#A30D0D] flex items-center justify-center transition-transform duration-200 hover:scale-105">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover pointer-events-none"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#A30D0D]" />
                          )}
                        </div>
                      </div>

                      {/* Info on Right: Left-aligned, full description without cuts */}
                      <div className="flex-1 min-w-0 text-left">
                        {/* Title: Uppercase Serif Bold */}
                        <h3 
                          className="font-serif font-black uppercase text-xs sm:text-base md:text-lg text-neutral-900 tracking-wide leading-tight"
                          style={{ fontFamily: dishNameFont }}
                        >
                          {item.name}
                        </h3>

                        {/* Description: 100% visible, no truncation or line-clamp */}
                        {item.description && (
                          <p 
                            className="text-[11px] sm:text-xs md:text-sm text-neutral-800 font-sans font-normal leading-relaxed mt-1"
                            style={{ fontFamily: dishDescFont }}
                          >
                            {item.description}
                          </p>
                        )}

                        {/* 5-Star Rating (★★★★★) */}
                        <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-neutral-900 mt-2 tracking-wider">
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                        </div>

                        {/* Price */}
                        <div className="mt-1 text-xs sm:text-sm md:text-base font-bold font-serif text-neutral-900">
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ------------------------------------------------------------- */
                    /* EVEN ROW: INFO ON LEFT (RIGHT-ALIGNED), PHOTO ON RIGHT         */
                    /* ------------------------------------------------------------- */
                    <div className="flex items-center gap-4 sm:gap-6 flex-row-reverse">
                      {/* Photo on Right: Enlarged circular dish plate */}
                      <div className="shrink-0 flex items-center justify-center">
                        <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden bg-[#A30D0D] flex items-center justify-center transition-transform duration-200 hover:scale-105">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover pointer-events-none"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#A30D0D]" />
                          )}
                        </div>
                      </div>

                      {/* Info on Left: Right-aligned, full description without cuts */}
                      <div className="flex-1 min-w-0 text-right">
                        {/* Title: Uppercase Serif Bold */}
                        <h3 
                          className="font-serif font-black uppercase text-xs sm:text-base md:text-lg text-neutral-900 tracking-wide leading-tight"
                          style={{ fontFamily: dishNameFont }}
                        >
                          {item.name}
                        </h3>

                        {/* Description: 100% visible, no truncation or line-clamp */}
                        {item.description && (
                          <p 
                            className="text-[11px] sm:text-xs md:text-sm text-neutral-800 font-sans font-normal leading-relaxed mt-1"
                            style={{ fontFamily: dishDescFont }}
                          >
                            {item.description}
                          </p>
                        )}

                        {/* 5-Star Rating (★★★★★, Right-aligned) */}
                        <div className="flex items-center justify-end gap-0.5 text-[10px] sm:text-xs text-neutral-900 mt-2 tracking-wider">
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                          <span>★</span>
                        </div>

                        {/* Price */}
                        <div className="mt-1 text-xs sm:text-sm md:text-base font-bold font-serif text-neutral-900">
                          S/ {item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </main>

        {/* Floating Cart Button */}
        {cartTotalItemsCount > 0 && (
          <div className="fixed bottom-4 left-0 right-0 z-40 px-4 flex justify-center animate-in slide-in-from-bottom-5">
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="px-6 py-3 rounded-full bg-neutral-950 text-white font-sans font-bold text-sm shadow-2xl flex items-center gap-3 hover:bg-black transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-neutral-800"
            >
              <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-black">
                {cartTotalItemsCount}
              </div>
              <span>Ver Pedido</span>
              <span className="font-mono text-neutral-300 text-xs border-l border-neutral-800 pl-3">
                {currencySymbol} {cartGrandTotal.toFixed(2)}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Item Customization & Add to Cart Modal */}
      {selectedItemForCustomization && (
        <ItemOrderModal
          isOpen={Boolean(selectedItemForCustomization)}
          onClose={() => setSelectedItemForCustomization(null)}
          item={selectedItemForCustomization}
          onConfirmUnits={(qty, units) => {
            handleConfirmItemUnits(selectedItemForCustomization, qty, units);
            setSelectedItemForCustomization(null);
            setIsCartDrawerOpen(true);
          }}
          initialQuantity={1}
          branding={restaurant.branding}
        />
      )}

      {/* Unified Cart Drawer */}
      <UnifiedCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        restaurant={restaurant}
        cart={cart}
        onUpdateCart={setCart}
        onEditCartEntry={(item) => setSelectedItemForCustomization(item)}
        onOrderCreated={(order) => {
          if (onOrderCreated) onOrderCreated(order);
          setCart([]);
          setIsCartDrawerOpen(false);
        }}
        initialOrderType={activeChannel}
        initialTableNumber={initialTableNumber}
      />

      {/* Schedule Modal */}
      <ScheduleViewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        restaurant={restaurant}
      />
    </div>
  );
};
