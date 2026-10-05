import React, { useState } from 'react';
import { 
  X, 
  ChefHat, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Utensils, 
  Search, 
  Sparkles, 
  ArrowRight,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { 
  Restaurant, 
  RestaurantTable, 
  MenuItem, 
  MenuCategory, 
  Order, 
  OrderItem, 
  OrderItemUnit, 
  User 
} from '../types';
import { ItemOrderModal } from './ItemOrderModal';

interface WaiterTableOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  table: RestaurantTable;
  currentUser: User;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  onOrderCreated: (newOrder: Order) => void;
}

interface CartItemEntry {
  item: MenuItem;
  quantity: number;
  units: OrderItemUnit[];
}

export const WaiterTableOrderModal: React.FC<WaiterTableOrderModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  table,
  currentUser,
  categories,
  menuItems,
  onOrderCreated,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dinerName, setDinerName] = useState('Comensal');
  const [cart, setCart] = useState<CartItemEntry[]>([]);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);
  const [orderSent, setOrderSent] = useState(false);

  if (!isOpen) return null;

  // Filter items for this restaurant
  const restItems = menuItems.filter(i => 
    i.restaurantId === restaurant.id && (i.targetMenuScope !== 'DELIVERY')
  );

  const filteredItems = restItems.filter(item => {
    const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddItemToCart = (item: MenuItem, quantity: number, units: OrderItemUnit[]) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(c => c.item.id === item.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          item,
          quantity: updated[existingIdx].quantity + quantity,
          units: [...updated[existingIdx].units, ...units]
        };
        return updated;
      }
      return [...prev, { item, quantity, units }];
    });
  };

  const handleQuickAdd = (item: MenuItem) => {
    // If item has addons or suggested observations, open customization modal
    if ((item.availableAddons && item.availableAddons.length > 0) || 
        (item.suggestedObservations && item.suggestedObservations.length > 0)) {
      setSelectedItemForCustomization(item);
    } else {
      // Direct add 1 unit
      handleAddItemToCart(item, 1, [{ unitNumber: 1, observation: '', selectedAddons: [] }]);
    }
  };

  const handleRemoveEntry = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  // Subtotal calculation
  const subtotal = cart.reduce((total, entry) => {
    const base = entry.item.price * entry.quantity;
    const addons = entry.units.reduce((uSum, u) => {
      const unitAddons = (u.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
      return uSum + unitAddons;
    }, 0);
    return total + base + addons;
  }, 0);

  const tax = subtotal * 0.10;
  const grandTotal = subtotal;

  const handleSendOrder = () => {
    if (cart.length === 0) return;

    const orderNum = `#M-${table.number}-${Math.floor(100 + Math.random() * 900)}`;

    const orderItems: OrderItem[] = cart.map(c => ({
      id: `oi-${Date.now()}-${c.item.id}`,
      menuItemId: c.item.id,
      name: c.item.name,
      price: c.item.price,
      quantity: c.quantity,
      units: c.units,
      notes: c.units.map(u => `U${u.unitNumber}: ${u.observation || ''}`).filter(Boolean).join(' | ')
    }));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      restaurantId: restaurant.id,
      orderNumber: orderNum,
      type: 'DINE_IN',
      status: 'IN_KITCHEN',
      tableNumber: `${table.name} (${table.zone})`,
      customerName: dinerName.trim() || 'Comensal en Mesa',
      items: orderItems,
      subtotal,
      tax,
      deliveryFee: 0,
      total: grandTotal,
      paymentStatus: 'PENDING',
      createdAt: 'Justo ahora',
      estimatedMinutes: 18,
      waiterId: currentUser.id,
      waiterName: currentUser.name,
    };

    onOrderCreated(newOrder);
    setOrderSent(true);

    setTimeout(() => {
      setCart([]);
      setOrderSent(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] rounded-3xl overflow-hidden flex flex-col bg-white border border-neutral-200 text-neutral-900 shadow-2xl">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-neutral-900 text-white border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white">
                  Tomar Comanda: <span className="text-amber-400">{table.name}</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-amber-300 border border-neutral-700">
                  {table.zone} • Cap. {table.capacity}p
                </span>
              </div>
              <p className="text-[11px] text-neutral-300">
                Mozo: <strong className="text-white">{currentUser.name}</strong> • Sede: {restaurant.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: 2-Columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-neutral-100">
          
          {/* Left / Center: Menu Catalog */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-neutral-200 overflow-hidden bg-neutral-100">
            
            {/* Search & Category Filter Bar */}
            <div className="p-3 bg-white border-b border-neutral-200 space-y-2.5 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar plato en la carta..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                  }`}
                >
                  Todos ({restItems.length})
                </button>
                {categories.filter(c => c.restaurantId === restaurant.id).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Grid - Match menu cards structure, NO DESCRIPTIONS */}
            <div className="flex-1 p-3.5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map(item => {
                const hasAddons = (item.availableAddons && item.availableAddons.length > 0) || 
                  (item.suggestedObservations && item.suggestedObservations.length > 0);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 hover:border-neutral-300 hover:shadow-md transition flex flex-col justify-between space-y-3 group"
                  >
                    {/* Top Row: Dish Photo/Icon + Name + Price (NO DESCRIPTION) */}
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0 group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">
                          <Utensils className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 group-hover:text-amber-700 transition truncate">
                          {item.name}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                            S/ {item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Addons indicator & Add button */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      {hasAddons ? (
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          +{item.availableAddons?.length || 0} Opciones
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Directo
                        </span>
                      )}

                      <button
                        onClick={() => handleQuickAdd(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{hasAddons ? 'Configurar' : 'Agregar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Active Order Cart Drawer */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white border-t md:border-t-0 md:border-l border-neutral-200 shrink-0 overflow-hidden">
            
            {/* Diner Name & Info */}
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span>Comanda ({cart.reduce((s, c) => s + c.quantity, 0)} platos)</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-300 shadow-sm">
                  {table.name}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 block mb-1">
                  Nombre del Comensal (Opcional):
                </label>
                <input
                  type="text"
                  value={dinerName}
                  onChange={(e) => setDinerName(e.target.value)}
                  placeholder="Ej: Comensal / Mesa 1"
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-neutral-50/50">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2">
                  <Utensils className="w-8 h-8 mx-auto text-neutral-300" />
                  <p className="text-xs font-bold text-neutral-600">No hay platos en la comanda.</p>
                  <p className="text-[10px] text-neutral-400">Selecciona platos de la carta para empezar.</p>
                </div>
              ) : (
                cart.map(entry => (
                  <div 
                    key={entry.item.id}
                    className="p-3 rounded-xl bg-white border border-neutral-200 shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-neutral-900">
                          <strong className="text-amber-600 mr-1">{entry.quantity}x</strong>
                          {entry.item.name}
                        </h5>
                        <span className="text-[11px] font-mono font-bold text-neutral-700">
                          S/ {(entry.item.price * entry.quantity).toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveEntry(entry.item.id)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Eliminar plato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Unit notes */}
                    {entry.units && entry.units.length > 0 && (
                      <div className="pl-2 border-l-2 border-neutral-200 space-y-1 pt-1 text-[10px] text-neutral-600">
                        {entry.units.map(u => (
                          <div key={u.unitNumber}>
                            • U{u.unitNumber}: {u.observation || 'Sin nota'} 
                            {u.selectedAddons && u.selectedAddons.length > 0 && ` (+${u.selectedAddons.map(a => a.name).join(', ')})`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Total Footer & Send Button */}
            <div className="p-4 bg-white border-t border-neutral-200 space-y-3 shrink-0 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 font-bold">Total Comanda:</span>
                <span className="text-base font-black font-mono text-neutral-900">
                  S/ {grandTotal.toFixed(2)}
                </span>
              </div>

              {orderSent ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Comanda enviada a cocina exitosamente!</span>
                </div>
              ) : (
                <button
                  onClick={handleSendOrder}
                  disabled={cart.length === 0}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md ${
                    cart.length > 0
                      ? 'bg-neutral-900 hover:bg-black text-white cursor-pointer active:scale-95'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Enviar Comanda a Cocina</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Item Customization Modal (Addons / Observations) */}
      {selectedItemForCustomization && (
        <ItemOrderModal
          isOpen={!!selectedItemForCustomization}
          onClose={() => setSelectedItemForCustomization(null)}
          item={selectedItemForCustomization}
          onConfirm={(item, qty, units) => {
            handleAddItemToCart(item, qty, units);
            setSelectedItemForCustomization(null);
          }}
        />
      )}
    </div>
  );
};
