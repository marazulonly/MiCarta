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
  Utensils,
  Eye,
  Sparkles,
  Layout
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, OrderItemUnit, Order } from '../types';
import { getSafeBranding } from '../utils/restaurantUtils';
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
  isOrderActive = false,
  onOpenActiveOrderModal,
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

  // Palette & Branding matching normalized restaurant branding
  const branding = getSafeBranding(restaurant);

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

        {/* Live Edit Mode Floating Banner for Medio Plato */}
        {isOwnerOrAdmin && isLiveEditActive && (
          <div className="relative z-30 px-3.5 py-2.5 bg-neutral-900 border-b border-neutral-800 text-white flex flex-wrap items-center justify-between gap-2 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-bold text-xs">Modo Edición en Vivo:</span>
              <span className="text-[11px] hidden sm:inline text-neutral-300">
                Toca sobre cualquier plato, precio, foto o marca para editar directamente.
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {onAddNewItem && (
                <button
                  onClick={() => onAddNewItem(activeCategory !== 'all' ? activeCategory : undefined)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Plato</span>
                </button>
              )}
              {onEditBranding && (
                <button
                  onClick={onEditBranding}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Personalizar Marca</span>
                </button>
              )}
              {onEditHeader && (
                <button
                  onClick={onEditHeader}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <Layout className="w-3.5 h-3.5 text-blue-400" />
                  <span>Editar Cabecera</span>
                </button>
              )}
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

          {/* Eye button to view active order status */}
          {!isOwnerOrAdmin && isOrderActive && onOpenActiveOrderModal && (
            <button
              type="button"
              onClick={onOpenActiveOrderModal}
              aria-label="Ver comanda activa"
              className="absolute top-2 left-2 p-2 rounded-full bg-amber-400 hover:bg-amber-300 text-black transition cursor-pointer z-30 animate-pulse"
            >
              <Eye className="w-4 h-4 stroke-[2.5]" />
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
            style={
              activeCategory === 'all'
                ? { backgroundColor: branding.buttonColor || accentColor, color: branding.buttonTextColor || '#FFFFFF' }
                : undefined
            }
            className={`px-4 py-2 rounded-full text-xs font-bold font-sans transition-all whitespace-nowrap cursor-pointer shadow-sm ${
              activeCategory === 'all'
                ? 'shadow-md'
                : 'bg-[#D6DAD1] text-neutral-800 hover:bg-[#CAD0C4]'
            }`}
          >
            Todas las Secciones
          </button>
          {currentCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={
                activeCategory === cat.id
                  ? { backgroundColor: branding.buttonColor || accentColor, color: branding.buttonTextColor || '#FFFFFF' }
                  : undefined
              }
              className={`px-4 py-2 rounded-full text-xs font-bold font-sans transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                activeCategory === cat.id
                  ? 'shadow-md'
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
        <main className="flex-1 px-3 sm:px-6 py-4 pb-44 space-y-6 sm:space-y-8 overflow-y-auto">
          {displayedItems.map((item, index) => {
            const isEven = branding.cardUniformStyles ? false : (index % 2 === 1);

            // Extrae configuración dinámica par/impar desde branding
            const layoutOdd = branding.cardLayout || 'row';
            const elementOrderOdd = branding.cardElementOrder || 'image-first';
            const textAlignmentOdd = branding.cardTextAlignment || 'left';
            const paddingOdd = branding.cardPadding || 'normal';
            const shadowOdd = branding.cardShadow || 'medium';
            const borderW_Odd = branding.cardBorderWidth || '1px';

            const layoutEven = branding.cardLayoutEven || 'row';
            const elementOrderEven = branding.cardElementOrderEven || 'title-first';
            const textAlignmentEven = branding.cardTextAlignmentEven || 'right';
            const paddingEven = branding.cardPaddingEven || paddingOdd;
            const shadowEven = branding.cardShadowEven || shadowOdd;
            const borderW_Even = branding.cardBorderWidthEven || borderW_Odd;

            // Asigna estilos según el índice de la ficha (Par vs Impar)
            const layout = isEven ? layoutEven : layoutOdd;
            const elementOrder = isEven ? elementOrderEven : elementOrderOdd;
            const textAlignment = isEven ? textAlignmentEven : textAlignmentOdd;
            const padding = isEven ? paddingEven : paddingOdd;
            const shadow = isEven ? shadowEven : shadowOdd;
            const borderW = isEven ? borderW_Even : borderW_Odd;

            // Foto personalizada
            const photoShape = isEven ? (branding.cardPhotoShapeEven || 'square') : (branding.cardPhotoShape || 'square');
            const photoBorder = isEven ? (branding.cardPhotoBorderEven || 'none') : (branding.cardPhotoBorder || 'none');
            const photoShadow = isEven ? (branding.cardPhotoShadowEven || 'none') : (branding.cardPhotoShadow || 'none');
            const photoTranslate = isEven ? (branding.cardPhotoTranslateEven ?? 0) : (branding.cardPhotoTranslate ?? 0);

            const cardBg = branding.dishCardBgColor || 'transparent';
            const cardRadius = branding.cardBorderRadius || '12px';
            const cardBorder = branding.dishCardBorderColor || (branding.buttonColor ? `${branding.buttonColor}50` : 'rgba(0,0,0,0.1)');

            // Rellenos
            let paddingClass = 'p-3';
            if (padding === 'compact') paddingClass = 'p-2';
            if (padding === 'elegant') paddingClass = 'p-5';

            // Sombras & Glow de marca
            let shadowStyle = {};
            let shadowClass = '';
            if (shadow === 'sutil') {
              shadowClass = 'shadow-sm';
            } else if (shadow === 'medium') {
              shadowClass = 'shadow-md';
            } else if (shadow === 'intense') {
              shadowClass = 'shadow-2xl';
            } else if (shadow === 'glow') {
              shadowClass = 'shadow-lg';
              shadowStyle = {
                boxShadow: `0 8px 30px -4px ${(branding.buttonColor || '#D4AF37')}50`
              };
            }

            // Clases de contenedor de foto
            let photoShapeClass = 'rounded-xl';
            let photoShapeStyle: React.CSSProperties = {};
            if (photoShape === 'circle') photoShapeClass = 'rounded-full';
            if (photoShape === 'square') photoShapeClass = 'rounded-none';
            if (photoShape === 'none') photoShapeClass = 'bg-transparent border-0 shadow-none rounded-none';
            if (photoShape === 'medialuna-izq') {
              photoShapeClass = '';
              photoShapeStyle = { borderRadius: '9999px 0px 0px 9999px' };
            }
            if (photoShape === 'medialuna-der') {
              photoShapeClass = '';
              photoShapeStyle = { borderRadius: '0px 9999px 9999px 0px' };
            }

            let photoBorderClass = 'border-0';
            if (photoBorder === 'thin') photoBorderClass = 'border border-white/20';
            if (photoBorder === 'thick') photoBorderClass = 'border-4 border-amber-400/55';

            let photoShadowClass = 'shadow-none';
            if (photoShadow === 'sutil') photoShadowClass = 'shadow-sm';
            if (photoShadow === 'medium') photoShadowClass = 'shadow-md';
            if (photoShadow === 'intense') photoShadowClass = 'shadow-xl';

            const isRow = layout === 'row';
            const isColumn = layout === 'column';
            const isCover = layout === 'cover';

            const photoTranslateVal = photoTranslate || (isEven ? 100 : 1);
            const defaultPhotoWidth = isRow ? 80 : 110;
            const photoSize = isEven 
              ? (branding.cardPhotoSizeEven ?? defaultPhotoWidth) 
              : (branding.cardPhotoSize ?? defaultPhotoWidth);
            const isAbsolutePhoto = !isCover;

            // Elementos visuales
            const imageEl = item.imageUrl ? (
              <div 
                style={{
                  ...(isAbsolutePhoto ? {
                    position: 'absolute',
                    top: '12px',
                    width: `${photoSize}px`,
                    height: `${photoSize}px`,
                    left: `calc(${photoTranslateVal}% - (${photoTranslateVal / 100} * ${photoSize}px))`,
                  } : {}),
                  ...photoShapeStyle,
                  transition: 'left 0.15s ease-out, transform 0.15s ease-out, width 0.15s ease-out, height 0.15s ease-out'
                }}
                className={`overflow-hidden shrink-0 z-10 transition-all ${photoShapeClass} ${photoBorderClass} ${photoShadowClass} ${
                  photoShape === 'none' ? 'bg-transparent' : 'bg-black/40'
                } ${
                  !isAbsolutePhoto 
                    ? 'absolute inset-0 w-full h-full object-cover z-0 brightness-[0.35]' 
                    : ''
                }`}
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover pointer-events-none" 
                  loading="lazy"
                />
              </div>
            ) : null;

            const itemTextColor = branding.textColor || '#1A1A1A';
            const itemPriceColor = branding.priceColor || branding.textColor || '#1A1A1A';

            const textEl = (
              <div className={`flex-1 min-w-0 ${isCover ? 'relative z-10 p-4' : ''} ${
                textAlignment === 'center' ? 'text-center' : textAlignment === 'right' ? 'text-right' : 'text-left'
              }`}>
                <h3 
                  className="font-serif font-black uppercase text-xs sm:text-base md:text-lg tracking-wide leading-tight"
                  style={{ fontFamily: dishNameFont, color: itemTextColor }}
                >
                  {item.name}
                </h3>
                {item.description && (
                  <p 
                    className="text-[11px] sm:text-xs md:text-sm font-sans font-normal leading-relaxed mt-1"
                    style={{ fontFamily: dishDescFont, color: itemTextColor ? `${itemTextColor}dd` : '#262626' }}
                  >
                    {item.description}
                  </p>
                )}
                {/* 5-Star Rating */}
                <div 
                  style={{ color: itemTextColor }}
                  className={`flex items-center gap-0.5 text-[10px] sm:text-xs mt-2 tracking-wider ${
                  textAlignment === 'center' ? 'justify-center' : textAlignment === 'right' ? 'justify-end' : 'justify-start'
                }`}>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
              </div>
            );

            const hideOrderButton = isEven 
              ? (branding.cardHideOrderButtonEven === true) 
              : (branding.cardHideOrderButton === true);

            const priceStyle: React.CSSProperties = isAbsolutePhoto && item.imageUrl && photoTranslateVal < 50 ? {
              paddingLeft: `${photoSize - 4}px`,
              transition: 'padding 0.15s ease-out',
              color: itemPriceColor,
              fontFamily: branding.dishPriceFont || undefined
            } : {
              transition: 'padding 0.15s ease-out',
              color: itemPriceColor,
              fontFamily: branding.dishPriceFont || undefined
            };

            const footerEl = (
              <div className={`mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between ${
                isCover ? 'relative z-10 border-t-0 mt-2 px-4 pb-4' : ''
              }`}>
                <span 
                  className="text-xs sm:text-sm md:text-base font-bold font-serif transition-all duration-200"
                  style={priceStyle}
                >
                  S/ {item.price.toFixed(2)}
                </span>

                {!hideOrderButton && (
                  <button
                    type="button"
                    style={{
                      backgroundColor: branding.buttonColor || '#D4AF37',
                      color: branding.buttonTextColor || '#000000',
                      borderRadius: '8px'
                    }}
                    className="px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow active:scale-95"
                  >
                    + Pedir
                  </button>
                )}
              </div>
            );

            const first = elementOrder === 'title-first' ? textEl : imageEl;
            const second = elementOrder === 'title-first' ? imageEl : textEl;

            // Fullscreen mobile support (only visible on mobile size elements)
            const isMobileFullscreen = branding.cardMobileFullscreen === true;
            const fullscreenCardClass = isMobileFullscreen ? 'min-h-[440px] md:min-h-0 flex flex-col justify-between' : '';

            // Text wrapper style shifts itself dynamically to never overlap with absolute photo!
            const textWrapperStyle: React.CSSProperties = isAbsolutePhoto && item.imageUrl ? {
              paddingLeft: photoTranslateVal < 50 ? `${photoSize + 14}px` : '0px',
              paddingRight: photoTranslateVal >= 50 ? `${photoSize + 14}px` : '0px',
              transition: 'padding 0.15s ease-out'
            } : {};

                const cardHoverClass = hideOrderButton ? 'hover:scale-[1.01] hover:brightness-[1.03] active:scale-[0.99] transition duration-200 cursor-pointer' : 'cursor-pointer';

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

                    <div 
                      onClick={() => setSelectedItemForCustomization(item)}
                      style={{ 
                        backgroundColor: cardBg,
                        borderRadius: cardRadius,
                        borderColor: cardBorder,
                        borderWidth: borderW,
                        color: branding.textColor || '#1a1a1a',
                        ...shadowStyle
                      }}
                      className={`w-full relative overflow-hidden transition flex flex-col justify-between border ${paddingClass} ${shadowClass} ${fullscreenCardClass} ${cardHoverClass} select-none`}
                    >
                  {isCover ? (
                    <div className="relative w-full h-full flex flex-col justify-end min-h-[140px]">
                      {imageEl}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-5" />
                      {textEl}
                      {footerEl}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full justify-between flex-1 relative min-h-[110px]">
                      {imageEl}
                      <div style={textWrapperStyle}>
                        {textEl}
                      </div>
                      {footerEl}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </main>

        {/* Floating Cart Button (Flush to bottom edge) */}
        {cartTotalItemsCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-neutral-950/95 border-t border-neutral-800 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-neutral-300 block font-sans">
                  {cartTotalItemsCount} {cartTotalItemsCount === 1 ? 'plato listo' : 'platos listos'}
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  Total: {currencySymbol} {cartGrandTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-sans font-extrabold text-xs shadow-lg flex items-center gap-2 transition duration-200 active:scale-95 cursor-pointer shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-black text-amber-300 flex items-center justify-center text-[10px] font-black">
                  {cartTotalItemsCount}
                </div>
                <span>Ver Pedido</span>
              </button>
            </div>
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
