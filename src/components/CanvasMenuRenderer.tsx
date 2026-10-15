import React, { useState } from 'react';
import { Restaurant, MenuItem, MenuCategory, Order, OrderItem } from '../types';
import { InteractiveCanvas } from './canvas-editor/InteractiveCanvas';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from './canvas-editor/canvasUtils';
import { ShoppingBag, X, Check, Plus, Minus, ChevronRight, Sparkles, Edit3, Camera, Store, Utensils, ArrowLeft } from 'lucide-react';

interface CanvasMenuRendererProps {
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
  onEditItem?: (item: MenuItem) => void;
  onQuickPriceItem?: (item: MenuItem) => void;
  onQuickPhotoItem?: (item: MenuItem) => void;
  onToggleAvailability?: (item: MenuItem) => void;
  onAddNewItem?: (catId?: string) => void;
  onEditBranding?: () => void;
}

export const CanvasMenuRenderer: React.FC<CanvasMenuRendererProps> = ({
  isOpen,
  onClose,
  restaurant,
  categories = [],
  items = [],
  onOrderCreated,
  initialMode = 'DINE_IN',
  initialTableNumber,
  isOwnerOrAdmin = false,
  isOrderActive = false,
  onOpenActiveOrderModal,
  onEditItem,
  onQuickPriceItem,
  onQuickPhotoItem,
  onToggleAvailability,
  onAddNewItem,
  onEditBranding
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'all');
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number; selectedAddons?: any[]; observation?: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(initialTableNumber || '5');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'DELIVERY' | 'TAKEAWAY'>(initialMode);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!isOpen) return null;

  const branding = restaurant.branding || {};
  const canvasElements = (branding as any).canvasElements || (restaurant as any).canvasElements || [];
  const canvasConfig = (branding as any).canvasConfig || (restaurant as any).canvasConfig || {
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    backgroundColor: (branding as any).darkBgColor || '#071A14'
  };

  const filteredItems = selectedCategoryId === 'all' 
    ? items 
    : items.filter(i => i.categoryId === selectedCategoryId);

  const cartSubtotal = cart.reduce((sum, c) => {
    const addonsTotal = (c.selectedAddons || []).reduce((s, a) => s + (a.price || 0), 0);
    return sum + (c.item.price + addonsTotal) * c.quantity;
  }, 0);
  const deliveryFee = orderType === 'DELIVERY' ? 5.00 : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable && !isOwnerOrAdmin) return;
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const orderItems: OrderItem[] = cart.map((c, i) => ({
        id: `ord-item-${Date.now()}-${i}`,
        menuItemId: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        units: Array.from({ length: c.quantity }).map((_, uIdx) => ({
          unitNumber: uIdx + 1,
          selectedAddons: c.selectedAddons || [],
          observation: c.observation
        }))
      }));

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        restaurantId: restaurant.id,
        orderNumber: String(Math.floor(1000 + Math.random() * 9000)),
        type: orderType === 'DINE_IN' ? 'DINE_IN' : orderType === 'DELIVERY' ? 'DELIVERY' : 'TAKEAWAY',
        status: 'PENDING',
        customerName: customerName.trim() || 'Cliente Invitado',
        customerPhone: customerPhone.trim() || '999999999',
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
        items: orderItems,
        subtotal: cartSubtotal,
        tax: 0,
        deliveryFee,
        total: cartTotal,
        paymentStatus: 'PENDING',
        estimatedMinutes: 25,
        createdAt: new Date().toISOString()
      };

      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }
      setIsSubmitting(false);
      setOrderSuccess(true);
      setCart([]);
      setTimeout(() => {
        setOrderSuccess(false);
        setIsCartOpen(false);
      }, 2500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-neutral-950 flex flex-col overflow-hidden font-sans text-white">
      {/* Top Navigation & Brand Bar */}
      <header className="h-16 px-4 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
            title="Regresar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            {restaurant.logoUrl && (
              <img src={restaurant.logoUrl} alt={restaurant.name} className="w-9 h-9 rounded-xl object-cover border border-neutral-700" />
            )}
            <div>
              <h1 className="text-sm font-black tracking-tight">{restaurant.name}</h1>
              <p className="text-[10px] text-emerald-400 font-mono">● Carta Interactiva (Diseño Gráfico 1:1)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwnerOrAdmin && onEditBranding && (
            <button
              onClick={onEditBranding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Marca</span>
            </button>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-lg"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ver Pedido</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-black shadow-md">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Categories Filter Bar */}
      {categories.length > 0 && (
        <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-amber-400 text-neutral-950 shadow-md'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            Todas las Secciones
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Content: Canvas Preview + Dynamic Items List */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center p-4 sm:p-8 bg-neutral-950">
        <div className="w-full max-w-4xl space-y-8">
          {/* Custom Canvas Graphic Layout */}
          {canvasElements.length > 0 && (
            <div className="w-full rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900">
              <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400">
                <span>🎨 Composición Gráfica de la Carta</span>
                <span>{canvasElements.length} objetos</span>
              </div>
              <div className="w-full overflow-x-auto flex justify-center p-4">
                <InteractiveCanvas
                  elements={canvasElements}
                  config={canvasConfig}
                  selectedId={null}
                  zoom={0.6}
                  pan={{ x: 0, y: 0 }}
                  isPreviewMode={true}
                  restaurant={restaurant}
                  onSelectElement={() => {}}
                  onUpdateElement={() => {}}
                />
              </div>
            </div>
          )}

          {/* Menu Items Grid */}
          <div className="space-y-4">
            <h2 className="text-sm font-mono text-amber-400 uppercase tracking-widest font-bold">
              Platos y Especialidades ({filteredItems.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition flex items-start gap-4 shadow-xl group relative overflow-hidden"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-neutral-700 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                      <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                        S/ {item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.isAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {item.isAvailable ? 'Disponible' : 'Agotado'}
                      </span>

                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.isAvailable && !isOwnerOrAdmin}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-md active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pedir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart & Checkout Modal Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 flex flex-col h-full shadow-2xl">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black">Tu Pedido</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {orderSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 animate-bounce">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-white">¡Pedido enviado con éxito!</h4>
                  <p className="text-xs text-neutral-400">Tu orden ha sido enviada a cocina. Puedes verificar su estado en tiempo real.</p>
                </div>
              ) : cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <Utensils className="w-10 h-10 text-neutral-600 mb-2" />
                  <p className="text-xs text-neutral-400">Tu carrito está vacío. Elige tus platos favoritos de la carta.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {cart.map((c, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-white truncate">{c.item.name}</p>
                          <p className="text-[11px] font-mono text-amber-400">S/ {c.item.price.toFixed(2)} x {c.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))}
                            className="p-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-5 text-center">{c.quantity}</span>
                          <button
                            onClick={() => setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item))}
                            className="p-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-3 pt-4 border-t border-neutral-800">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Nombre del Cliente:</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 mb-1">Tipo de Pedido:</label>
                        <select
                          value={orderType}
                          onChange={e => setOrderType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-amber-400 cursor-pointer"
                        >
                          <option value="DINE_IN">En Salón (Mesa)</option>
                          <option value="DELIVERY">Delivery</option>
                          <option value="TAKEAWAY">Para Llevar</option>
                        </select>
                      </div>

                      {orderType === 'DINE_IN' ? (
                        <div>
                          <label className="block text-xs font-bold text-neutral-300 mb-1">Nro. de Mesa:</label>
                          <input
                            type="text"
                            required
                            value={tableNumber}
                            onChange={e => setTableNumber(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-amber-400"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-neutral-300 mb-1">Teléfono:</label>
                          <input
                            type="text"
                            required
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            placeholder="999999999"
                            className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-amber-400"
                          />
                        </div>
                      )}
                    </div>

                    {orderType === 'DELIVERY' && (
                      <div>
                        <label className="block text-xs font-bold text-neutral-300 mb-1">Dirección de Entrega:</label>
                        <input
                          type="text"
                          required
                          value={deliveryAddress}
                          onChange={e => setDeliveryAddress(e.target.value)}
                          placeholder="Av. Larco 123, Miraflores"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-amber-400"
                        />
                      </div>
                    )}

                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between font-mono">
                      <span className="text-xs text-neutral-400">Total a Pagar:</span>
                      <span className="text-base font-black text-amber-400">S/ {cartTotal.toFixed(2)}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black transition cursor-pointer shadow-lg active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>{isSubmitting ? 'Enviando pedido...' : 'Confirmar y Enviar Pedido'}</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
