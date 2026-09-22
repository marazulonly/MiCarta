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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col bg-neutral-950 border border-neutral-800 text-white shadow-2xl">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Tomar Comanda: <span className="text-sky-400">{table.name}</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-amber-300 border border-neutral-700">
                  {table.zone} • Cap. {table.capacity}p
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Mozo: <strong className="text-neutral-200">{currentUser.name}</strong> • Sede: {restaurant.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: 2-Columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left / Center: Menu Catalog */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 overflow-hidden">
            
            {/* Search & Category Filter Bar */}
            <div className="p-3 bg-neutral-900/50 border-b border-neutral-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar plato en la carta..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-sky-400 text-black'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Todos ({restItems.length})
                </button>
                {categories.filter(c => c.restaurantId === restaurant.id).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-sky-400 text-black'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Grid */}
            <div className="flex-1 p-3.5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map(item => {
                const hasAddons = (item.availableAddons && item.availableAddons.length > 0) || 
                  (item.suggestedObservations && item.suggestedObservations.length > 0);

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition flex flex-col justify-between space-y-2 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-xs font-mono font-black text-amber-400 shrink-0">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                      {hasAddons ? (
                        <span className="text-[10px] text-neutral-500 font-mono">
                          +{item.availableAddons?.length || 0} Adicionales
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400/80 font-mono">
                          Directo
                        </span>
                      )}

                      <button
                        onClick={() => handleQuickAdd(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold transition cursor-pointer shadow"
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
          <div className="w-full md:w-80 lg:w-96 flex flex-col bg-neutral-900/30 overflow-hidden">
            
            {/* Diner Name & Info */}
            <div className="p-4 bg-neutral-900/60 border-b border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Comanda ({cart.reduce((s, c) => s + c.quantity, 0)} platos)</span>
                </span>
                <span className="text-[10px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  {table.name}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                  Nombre del Comensal (Opcional):
                </label>
                <input
                  type="text"
                  value={dinerName}
                  onChange={(e) => setDinerName(e.target.value)}
                  placeholder="Ej: Familia Ramírez / Mesa 4"
                  className="w-full px-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-2">
                  <Utensils className="w-8 h-8 mx-auto text-neutral-600" />
                  <p className="text-xs">No hay platos agregados a la comanda.</p>
                  <p className="text-[10px] text-neutral-600">Selecciona platos de la carta para empezar.</p>
                </div>
              ) : (
                cart.map(entry => (
                  <div 
                    key={entry.item.id}
                    className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-white">
                          <strong className="text-sky-400 mr-1">{entry.quantity}x</strong>
                          {entry.item.name}
                        </h5>
                        <span className="text-[11px] font-mono text-amber-400">
                          ${(entry.item.price * entry.quantity).toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveEntry(entry.item.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Unit Breakdown */}
                    {entry.units.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-neutral-800/80">
                        {entry.units.map(u => (
                          <div key={u.unitNumber} className="text-[10px] bg-black/40 px-2 py-1 rounded text-neutral-300 flex items-center justify-between">
                            <span>
                              <strong>U{u.unitNumber}:</strong> {u.observation || 'Sin notas especiales'}
                            </span>
                            {u.selectedAddons && u.selectedAddons.length > 0 && (
                              <span className="text-amber-400 font-mono">
                                +${u.selectedAddons.reduce((s, a) => s + a.price, 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Order Footer & Send Button */}
            <div className="p-4 bg-neutral-900 border-t border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Total Comanda:</span>
                <span className="text-base font-black font-mono text-white">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>

              {orderSent ? (
                <div className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-2 animate-in zoom-in">
                  <Check className="w-4 h-4" />
                  <span>¡Comanda Enviada a Cocina!</span>
                </div>
              ) : (
                <button
                  disabled={cart.length === 0}
                  onClick={handleSendOrder}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                    cart.length > 0
                      ? 'bg-sky-400 text-black hover:bg-sky-300 shadow-sky-950/40'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Enviar Comanda a Cocina</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Item Customization Modal */}
      <ItemOrderModal
        isOpen={!!selectedItemForCustomization}
        onClose={() => setSelectedItemForCustomization(null)}
        item={selectedItemForCustomization}
        onConfirmOrder={(item, quantity, units) => {
          handleAddItemToCart(item, quantity, units);
          setSelectedItemForCustomization(null);
        }}
      />

    </div>
  );
};
