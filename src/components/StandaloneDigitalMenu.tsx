import React, { useState, useEffect, useMemo } from 'react';
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
  Image as ImageIcon,
  Eye,
  Search,
  CheckCircle2,
  Flame,
  Award,
  ChevronRight
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order } from '../types';
import { getSafeBranding, matchesRestaurantRef } from '../utils/restaurantUtils';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';
import { ScheduleViewModal } from './ScheduleViewModal';

interface StandaloneDigitalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  onOrderCreated?: (newOrder: Order) => void;
  initialMode?: 'DINE_IN' | 'DELIVERY';
  initialTableNumber?: string;
  isOwnerOrAdmin?: boolean;
  isOrderActive?: boolean;
  onOpenActiveOrderModal?: () => void;
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

interface CartEntry {
  item: MenuItem;
  quantity: number;
  units: OrderItemUnit[];
}

export const StandaloneDigitalMenu: React.FC<StandaloneDigitalMenuProps> = ({
  isOpen,
  onClose,
  restaurant,
  categories,
  items,
  onOrderCreated,
  initialMode = 'DINE_IN',
  initialTableNumber,
  isOwnerOrAdmin = false,
  isOrderActive = false,
  onOpenActiveOrderModal,
  isLiveEditActive = false,
  onToggleLiveEdit,
  onEditItem,
  onDeleteItem,
  onQuickPriceItem,
  onQuickPhotoItem,
  onToggleAvailability,
  onAddNewItem,
  onEditBranding,
  onEditHeader,
  onSaveToFirebase,
  isSavingFirebase = false,
}) => {
  // Cloned visual branding configuration (100% autonomous per restaurant)
  const branding = getSafeBranding(restaurant);
  const bgColor = branding.darkBgColor || branding.backgroundColor || '#0F172A';
  const cardBgColor = branding.cardBgColor || '#1E293B';
  const primaryColor = branding.buttonColor || branding.accentColor || '#38BDF8';
  const textColor = branding.textColor || '#F8FAFC';
  const fontDisplay = branding.fontDisplay || branding.fontFamily || "'Inter', sans-serif";
  const currency = restaurant.currency || 'S/.';

  // State
  const [activeChannel, setActiveChannel] = useState<'DINE_IN' | 'DELIVERY'>(initialMode);
  const [tableNumber, setTableNumber] = useState<string>(initialTableNumber || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Safe category and items scoping
  const validCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter(c => c && matchesRestaurantRef(c.restaurantId, restaurant.id, restaurant.slug));
  }, [categories, restaurant.id, restaurant.slug]);

  const validItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter(i => {
      if (!i) return false;
      return matchesRestaurantRef(i.restaurantId, restaurant.id, restaurant.slug);
    });
  }, [items, restaurant.id, restaurant.slug]);

  // Dish filtering based on category, search, and channel
  const filteredDishes = useMemo(() => {
    return validItems.filter(item => {
      // Channel scope filter
      if (activeChannel === 'DINE_IN' && item.targetMenuScope === 'DELIVERY') return false;
      if (activeChannel === 'DELIVERY' && item.targetMenuScope === 'DINE_IN') return false;

      // Category filter
      if (selectedCategoryId !== 'ALL') {
        const matchesCat = item.categoryId === selectedCategoryId || 
          (item as any).category === selectedCategoryId;
        if (!matchesCat) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [validItems, activeChannel, selectedCategoryId, searchQuery]);

  // Cart total calculations
  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, entry) => sum + entry.quantity, 0);
  }, [cart]);

  const totalCartAmount = useMemo(() => {
    return Object.values(cart).reduce((sum, entry) => {
      const unitsPrice = entry.units?.reduce((uSum, u) => uSum + (u.extraPrice || 0), 0) || 0;
      return sum + ((entry.item.price + unitsPrice) * entry.quantity);
    }, 0);
  }, [cart]);

  // Cart manipulation
  const handleAddToCart = (dish: MenuItem) => {
    if (dish.options && dish.options.length > 0) {
      setSelectedItemForCustomization(dish);
      return;
    }

    setCart(prev => {
      const current = prev[dish.id];
      const nextQty = (current?.quantity || 0) + 1;
      return {
        ...prev,
        [dish.id]: {
          item: dish,
          quantity: nextQty,
          units: current?.units || []
        }
      };
    });
    showToast(`✓ +1 ${dish.name} agregado`);
  };

  const handleRemoveFromCart = (dishId: string) => {
    setCart(prev => {
      const current = prev[dishId];
      if (!current) return prev;
      if (current.quantity <= 1) {
        const { [dishId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [dishId]: {
          ...current,
          quantity: current.quantity - 1
        }
      };
    });
  };

  const handleConfirmCustomUnits = (item: MenuItem, quantity: number, units: OrderItemUnit[]) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        item,
        quantity,
        units
      }
    }));
    setSelectedItemForCustomization(null);
    showToast(`✓ ${item.name} personalizado agregado al pedido`);
  };

  const handleClearCart = () => {
    setCart({});
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  const headerLogo = branding.headerLogoUrl || restaurant.logoUrl;
  const headerCover = branding.coverImageUrl || restaurant.coverUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex flex-col font-sans select-none"
      style={{ 
        backgroundColor: bgColor, 
        color: textColor,
        fontFamily: fontDisplay 
      }}
    >
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2 rounded-2xl bg-black/85 text-white text-xs font-bold border border-white/20 shadow-2xl animate-bounce backdrop-blur-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {headerLogo ? (
            <img 
              src={headerLogo} 
              alt={restaurant.name} 
              className="w-10 h-10 object-contain rounded-xl border border-white/15 p-0.5 bg-black/20"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base text-white border border-white/20"
              style={{ backgroundColor: primaryColor }}
            >
              {restaurant.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-tight line-clamp-1">
              {restaurant.name}
            </h1>
            <p className="text-[11px] text-white/60 line-clamp-1">
              {restaurant.tagline || restaurant.cuisineType || 'Carta Digital'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Live Edit Badge & Toggle (Admins / Owners only) */}
          {isOwnerOrAdmin && onToggleLiveEdit && (
            <button
              onClick={onToggleLiveEdit}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                isLiveEditActive 
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md animate-pulse' 
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
              }`}
              title="Alternar Modo Edición en Vivo"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isLiveEditActive ? 'Modo Edición Activo' : 'Editar Carta'}</span>
            </button>
          )}

          {isLiveEditActive && onEditBranding && (
            <button
              onClick={onEditBranding}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer"
              title="Personalizar Colores y Marca"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer"
            title="Horarios y Ubicación"
          >
            <Clock className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer hidden sm:flex"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/40 transition cursor-pointer"
            title="Cerrar carta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Banner with Cloned Restaurant Info */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden shrink-0">
        <img 
          src={headerCover} 
          alt={restaurant.name} 
          className="w-full h-full object-cover filter brightness-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {isLiveEditActive && onEditHeader && (
          <button
            onClick={onEditHeader}
            className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-amber-400 text-xs font-bold border border-amber-400/40 backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Editar Portada</span>
          </button>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-black"
                style={{ backgroundColor: primaryColor }}
              >
                {restaurant.cuisineType || 'Gastronomía'}
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-300 font-bold bg-black/40 px-2 py-0.5 rounded-full border border-amber-300/30">
                <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                <span>{restaurant.rating || 4.9}</span>
              </span>
              <span className="text-[11px] text-white/70">
                • {validItems.length} platos disponibles
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {restaurant.name}
            </h2>
            {restaurant.address && (
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-white/60 shrink-0" />
                <span className="line-clamp-1">{restaurant.address}</span>
              </p>
            )}
          </div>

          {/* Mode Selector: Mesa / Domicilio */}
          <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/20 backdrop-blur-md self-start sm:self-auto">
            <button
              onClick={() => setActiveChannel('DINE_IN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeChannel === 'DINE_IN'
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>En Mesa</span>
            </button>
            <button
              onClick={() => setActiveChannel('DELIVERY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeChannel === 'DELIVERY'
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Delivery</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Number Prompt if in Mesa mode */}
      {activeChannel === 'DINE_IN' && (
        <div className="px-4 py-2.5 bg-black/30 border-b border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-emerald-400" />
            <span className="text-white/80 font-medium">Consumo en restaurante:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-white/60">Número de Mesa:</label>
            <input 
              type="text" 
              value={tableNumber} 
              onChange={e => setTableNumber(e.target.value)}
              placeholder="Ej: 4"
              className="w-16 px-2 py-1 rounded-lg bg-white/10 border border-white/25 text-white text-xs font-bold text-center focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>
      )}

      {/* Search & Categories Bar */}
      <div className="sticky top-[57px] z-30 bg-black/50 backdrop-blur-md border-b border-white/10 py-3 px-4 space-y-2.5">
        {/* Search Input */}
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar ceviches, platos, bebidas..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-white/40 focus:outline-hidden focus:border-white/40 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Tabs: Always shows "Todos los platos" by default + individual categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
              selectedCategoryId === 'ALL'
                ? 'text-black shadow-md border-transparent'
                : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
            }`}
            style={{ 
              backgroundColor: selectedCategoryId === 'ALL' ? primaryColor : undefined 
            }}
          >
            <span>Todos los Platos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
              {validItems.length}
            </span>
          </button>

          {validCategories.map(cat => {
            const count = validItems.filter(i => i.categoryId === cat.id || (i as any).category === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-black shadow-md border-transparent'
                    : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/10'
                }`}
                style={{ 
                  backgroundColor: isSelected ? primaryColor : undefined 
                }}
              >
                <span>{cat.name}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                  {count}
                </span>
              </button>
            );
          })}

          {isLiveEditActive && onAddNewItem && (
            <button
              onClick={() => onAddNewItem(selectedCategoryId !== 'ALL' ? selectedCategoryId : undefined)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Plato</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dishes Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {filteredDishes.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/40">
              <ChefHat className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {searchQuery ? 'No se encontraron platos que coincidan' : 'No hay platos en esta categoría'}
            </h3>
            <p className="text-xs text-white/60 max-w-sm mb-4">
              {searchQuery 
                ? 'Prueba con otro término de búsqueda o selecciona "Todos los Platos".' 
                : 'Añade nuevos platos o selecciona otra categoría para explorar.'}
            </p>
            {isLiveEditActive && onAddNewItem && (
              <button
                onClick={() => onAddNewItem(selectedCategoryId !== 'ALL' ? selectedCategoryId : undefined)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-2 cursor-pointer shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Primer Plato</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDishes.map(dish => {
              const inCart = cart[dish.id];
              const isAvailable = dish.isAvailable !== false;

              return (
                <div
                  key={dish.id}
                  className={`group relative rounded-3xl overflow-hidden border transition flex flex-col ${
                    !isAvailable ? 'opacity-65' : ''
                  }`}
                  style={{
                    backgroundColor: cardBgColor,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Dish Image */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-black/30 shrink-0">
                    {dish.imageUrl ? (
                      <img 
                        src={dish.imageUrl} 
                        alt={dish.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    {/* Stock status badge */}
                    {!isAvailable && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[10px] font-black tracking-wide border border-rose-500/40">
                        AGOTADO
                      </div>
                    )}

                    {/* Tags / Badges */}
                    {dish.tags && dish.tags.length > 0 && isAvailable && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                        {dish.tags.slice(0, 2).map((tag, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-black bg-white/90 backdrop-blur-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Live Edit Quick Actions Overlay */}
                    {isLiveEditActive && (
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                        {onQuickPhotoItem && (
                          <button
                            onClick={() => onQuickPhotoItem(dish)}
                            className="p-1.5 rounded-lg bg-black/80 text-white hover:text-amber-400 border border-white/20 transition cursor-pointer"
                            title="Cambiar foto rápida"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onQuickPriceItem && (
                          <button
                            onClick={() => onQuickPriceItem(dish)}
                            className="p-1.5 rounded-lg bg-black/80 text-white hover:text-emerald-400 border border-white/20 transition cursor-pointer"
                            title="Modificar precio rápido"
                          >
                            <span className="text-[10px] font-mono font-bold">{currency}</span>
                          </button>
                        )}
                        {onToggleAvailability && (
                          <button
                            onClick={() => onToggleAvailability(dish)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isAvailable 
                                ? 'bg-black/80 text-emerald-400 border-white/20' 
                                : 'bg-rose-900/80 text-rose-300 border-rose-600'
                            }`}
                            title={isAvailable ? 'Marcar como agotado' : 'Marcar como disponible'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onEditItem && (
                          <button
                            onClick={() => onEditItem(dish)}
                            className="p-1.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition cursor-pointer"
                            title="Editar plato completo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Price Tag in Image */}
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-white font-mono font-black text-sm">
                      {currency} {dish.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Dish Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1 mb-1">
                        {dish.name}
                      </h3>
                      <p className="text-xs text-white/65 line-clamp-2 leading-relaxed">
                        {dish.description || 'Deliciosa preparación artesanal elaborada con ingredientes frescos de la mejor calidad.'}
                      </p>
                    </div>

                    {/* Card Footer: Add to Cart Buttons */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-black text-white/80">
                        {currency} {dish.price.toFixed(2)}
                      </span>

                      {isAvailable ? (
                        inCart ? (
                          <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl border border-white/20">
                            <button
                              onClick={() => handleRemoveFromCart(dish.id)}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                              title="Restar una unidad"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-mono font-black text-white px-1">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => handleAddToCart(dish)}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                              title="Sumar una unidad"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(dish)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-black transition flex items-center gap-1.5 cursor-pointer shadow-md hover:brightness-110 active:scale-95"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-rose-400 font-bold">
                          No disponible
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <div className="sticky bottom-4 z-40 max-w-lg w-[92%] mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-4 rounded-2xl text-black font-bold shadow-2xl flex items-center justify-between transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/20 text-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black uppercase tracking-wider">
                  Ver Mi Pedido ({totalCartCount} {totalCartCount === 1 ? 'item' : 'items'})
                </span>
                <span className="block text-[10px] text-black/75">
                  {activeChannel === 'DINE_IN' ? `Mesa: ${tableNumber || 'Sin asignar'}` : 'Envío a Domicilio'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-black">
                {currency} {totalCartAmount.toFixed(2)}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Unified Cart Drawer */}
      <UnifiedCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        restaurant={restaurant}
        channel={activeChannel}
        tableNumber={tableNumber}
        onUpdateQuantity={(dishId, delta) => {
          if (delta > 0) {
            const entry = cart[dishId];
            if (entry) handleAddToCart(entry.item);
          } else {
            handleRemoveFromCart(dishId);
          }
        }}
        onClearCart={handleClearCart}
        onOrderCreated={(newOrder) => {
          handleClearCart();
          setIsCartOpen(false);
          if (onOrderCreated) onOrderCreated(newOrder);
          showToast('✓ Pedido generado exitosamente');
        }}
      />

      {/* Item Order Customization Modal */}
      {selectedItemForCustomization && (
        <ItemOrderModal
          isOpen={Boolean(selectedItemForCustomization)}
          onClose={() => setSelectedItemForCustomization(null)}
          item={selectedItemForCustomization}
          restaurant={restaurant}
          initialQuantity={cart[selectedItemForCustomization.id]?.quantity || 1}
          initialUnits={cart[selectedItemForCustomization.id]?.units || []}
          onConfirm={(qty, units) => handleConfirmCustomUnits(selectedItemForCustomization, qty, units)}
        />
      )}

      {/* Schedule & Location Modal */}
      <ScheduleViewModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        restaurant={restaurant}
      />
    </div>
  );
};
