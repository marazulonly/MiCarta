import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Utensils, 
  Store, 
  Volume2, 
  VolumeX, 
  Filter, 
  RefreshCw, 
  Eye, 
  Search, 
  Check, 
  X, 
  Bell, 
  Layers, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Ban,
  ArrowRight
} from 'lucide-react';
import { Restaurant, Order, MenuItem, MenuCategory, User, OrderStatus, DEFAULT_FALLBACK_RESTAURANT } from '../types';

interface KitchenViewProps {
  currentUser: User;
  restaurants: Restaurant[];
  orders: Order[];
  menuItems: MenuItem[];
  categories?: MenuCategory[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateMenuItem?: (item: MenuItem) => void;
  onSimulateNewOrder: () => void;
  onOpenCustomerPreview: (restaurant: Restaurant, mode?: 'DINE_IN' | 'DELIVERY', tableNumber?: string) => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({
  currentUser,
  restaurants,
  orders,
  menuItems,
  categories = [],
  onUpdateOrderStatus,
  onUpdateMenuItem,
  onSimulateNewOrder,
  onOpenCustomerPreview,
}) => {
  // Assigned restaurants
  const userRestIds = Array.isArray(currentUser?.restaurantIds) ? currentUser.restaurantIds : [];
  const kitchenRestaurants = userRestIds.includes('all')
    ? (restaurants || []).filter(Boolean)
    : (restaurants || []).filter(r => r && userRestIds.includes(r.id));

  const [selectedRestId, setSelectedRestId] = useState<string>(
    kitchenRestaurants[0]?.id || (restaurants || [])[0]?.id || ''
  );

  const activeRest = (restaurants || []).find(r => r && r.id === selectedRestId) || kitchenRestaurants[0] || (restaurants || [])[0] || DEFAULT_FALLBACK_RESTAURANT;

  // Sound alert state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter by Station
  const [stationFilter, setStationFilter] = useState<string>('all');

  // Filter by Order Type
  const [typeFilter, setTypeFilter] = useState<'all' | 'DINE_IN' | 'DELIVERY'>('all');

  // Modal 86 List (Platos Agotados)
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [dishSearch, setDishSearch] = useState('');

  // Audio synthesizer for kitchen bell
  const playKitchenChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Ignore audio failure
    }
  };

  // Orders for this restaurant
  const restaurantOrders = useMemo(() => {
    return orders.filter(o => o.restaurantId === activeRest.id);
  }, [orders, activeRest.id]);

  // Play sound when a new PENDING order appears
  const pendingCount = restaurantOrders.filter(o => o.status === 'PENDING').length;
  useEffect(() => {
    if (pendingCount > 0) {
      playKitchenChime();
    }
  }, [pendingCount]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return restaurantOrders.filter(o => {
      if (typeFilter !== 'all' && o.type !== typeFilter) return false;
      return true;
    });
  }, [restaurantOrders, typeFilter]);

  // Order buckets for KDS columns
  const pendingOrders = filteredOrders.filter(o => o.status === 'PENDING');
  const inKitchenOrders = filteredOrders.filter(o => o.status === 'IN_KITCHEN');
  const readyOrders = filteredOrders.filter(o => o.status === 'READY');
  const recentDelivered = filteredOrders.filter(o => o.status === 'DELIVERED').slice(0, 5);

  // Restaurant dishes for 86 list
  const currentDishes = useMemo(() => {
    return menuItems.filter(m => m.restaurantId === activeRest.id);
  }, [menuItems, activeRest.id]);

  const filteredDishes = useMemo(() => {
    return currentDishes.filter(d => 
      d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
      d.categoryName?.toLowerCase().includes(dishSearch.toLowerCase())
    );
  }, [currentDishes, dishSearch]);

  const outOfStockCount = currentDishes.filter(d => !d.isAvailable).length;

  // Toggle dish availability (86 item)
  const handleToggleDishStock = (dish: MenuItem) => {
    if (onUpdateMenuItem) {
      const updated: MenuItem = {
        ...dish,
        isAvailable: !dish.isAvailable
      };
      onUpdateMenuItem(updated);
    }
  };

  return (
    <div className="space-y-6 pb-28 text-white">
      
      {/* Top KDS Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
        
        {/* Left: Chef identity & Restaurant */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Pantalla KDS Cocina</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700 font-mono">
                  EN VIVO
                </span>
              </h1>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
              <span>Chef: <strong className="text-white">{currentUser.name}</strong></span>
              <span>•</span>
              <span>DNI: <strong className="text-neutral-300 font-mono">{currentUser.dni}</strong></span>
              {currentUser.kitchenStation && (
                <>
                  <span>•</span>
                  <span className="text-neutral-300 font-semibold">{currentUser.kitchenStation}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Restaurant Switcher if multi-restaurant */}
          {kitchenRestaurants.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
              <Store className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={selectedRestId}
                onChange={(e) => setSelectedRestId(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                {kitchenRestaurants.map(r => (
                  <option key={r.id} value={r.id} className="bg-neutral-900 text-white">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              soundEnabled
                ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white'
            }`}
            title={soundEnabled ? 'Campana sonora activada' : 'Campana silenciada'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Sonido ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sonido OFF</span>
              </>
            )}
          </button>

          {/* 86 List / Platos Agotados Trigger */}
          <button
            onClick={() => setIsStockOutModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              outOfStockCount > 0
                ? 'bg-neutral-800 border-neutral-600 text-white'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-neutral-400" />
            <span>Lista 86 {outOfStockCount > 0 && `(${outOfStockCount} agotados)`}</span>
          </button>

          {/* Simulate New Order button */}
          <button
            onClick={onSimulateNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer shadow-lg"
            title="Generar comanda de prueba en cocina"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>+ Simular Comanda</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap text-xs bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-neutral-400 font-medium">Filtro Tipo:</span>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              typeFilter === 'all' ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            Todos ({restaurantOrders.length})
          </button>
          <button
            onClick={() => setTypeFilter('DINE_IN')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              typeFilter === 'DINE_IN' ? 'bg-neutral-200 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            Mesas Salón
          </button>
          <button
            onClick={() => setTypeFilter('DELIVERY')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              typeFilter === 'DELIVERY' ? 'bg-neutral-200 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            Delivery / Para Llevar
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-neutral-400 font-medium">Estación:</span>
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs font-medium focus:outline-none"
          >
            <option value="all">Todas las Estaciones</option>
            <option value="parrilla">Parrilla & Brasas</option>
            <option value="caliente">Cocina Caliente & Wok</option>
            <option value="fria">Barra Fría / Cebichería</option>
          </select>
        </div>
      </div>

      {/* 3-Column KDS Command Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* ========================================================================= */}
        {/* COLUMNA 1: NUEVAS COMANDAS (PENDING)                                      */}
        {/* ========================================================================= */}
        <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <h2 className="font-bold text-sm text-neutral-200 uppercase tracking-wider">
                1. Nuevas / Por Iniciar
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-white font-mono font-bold text-xs border border-neutral-700">
              {pendingOrders.length}
            </span>
          </div>

          <div className="space-y-3.5 flex-1">
            {pendingOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-neutral-600 mb-2" />
                <p>Sin comandas pendientes por iniciar.</p>
                <p className="text-[11px] text-neutral-600 mt-1">Nuevos pedidos de clientes o mozos aparecerán aquí automáticamente.</p>
              </div>
            ) : (
              pendingOrders.map(order => (
                <KitchenTicketCard
                  key={order.id}
                  order={order}
                  onAdvance={() => {
                    onUpdateOrderStatus(order.id, 'IN_KITCHEN');
                    playKitchenChime();
                  }}
                  advanceLabel="Empezar a Cocinar"
                  advanceColor="bg-white hover:bg-neutral-200 text-black font-bold"
                />
              ))
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 2: EN PREPARACIÓN / FUEGO (IN_KITCHEN)                           */}
        {/* ========================================================================= */}
        <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-neutral-300" />
              <h2 className="font-bold text-sm text-neutral-200 uppercase tracking-wider">
                2. En Cocción
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-white font-mono font-bold text-xs border border-neutral-700">
              {inKitchenOrders.length}
            </span>
          </div>

          <div className="space-y-3.5 flex-1">
            {inKitchenOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
                <Flame className="w-8 h-8 text-neutral-600 mb-2" />
                <p>No hay platos en cocción activa.</p>
              </div>
            ) : (
              inKitchenOrders.map(order => (
                <KitchenTicketCard
                  key={order.id}
                  order={order}
                  onAdvance={() => {
                    onUpdateOrderStatus(order.id, 'READY');
                    playKitchenChime();
                  }}
                  advanceLabel="Listo para Servir"
                  advanceColor="bg-white hover:bg-neutral-200 text-black font-bold"
                />
              ))
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 3: LISTOS PARA DESPACHO / SERVIR (READY)                         */}
        {/* ========================================================================= */}
        <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <h2 className="font-bold text-sm text-neutral-200 uppercase tracking-wider">
                3. Listos / Pase de Salón
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-white font-mono font-bold text-xs border border-neutral-700">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-3.5 flex-1">
            {readyOrders.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-neutral-600 mb-2" />
                <p>No hay platos en el pase de salida.</p>
              </div>
            ) : (
              readyOrders.map(order => (
                <KitchenTicketCard
                  key={order.id}
                  order={order}
                  onAdvance={() => {
                    onUpdateOrderStatus(order.id, 'DELIVERED');
                  }}
                  advanceLabel="Completar / Servido"
                  advanceColor="bg-neutral-800 hover:bg-neutral-700 text-white font-bold border border-neutral-700"
                />
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL LISTA 86 (CONTROL DE INVENTARIO Y PLATOS AGOTADOS POR COCINA) */}
      {isStockOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col">
            
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Lista 86: Platos Agotados en Cocina</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono">
                      Tiempo Real
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Desactiva al instante platos cuyos insumos se agotaron. Desaparecerán automáticamente de las cartas QR de los clientes.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsStockOutModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder="Buscar plato o categoría..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
              />
            </div>

            {/* Dish List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-neutral-900">
              {filteredDishes.map(dish => (
                <div 
                  key={dish.id} 
                  className={`pt-2.5 pb-2 flex items-center justify-between gap-3 ${
                    !dish.isAvailable ? 'opacity-60 bg-red-950/10 px-3 py-2 rounded-xl border border-red-900/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {dish.imageUrl ? (
                      <img src={dish.imageUrl} alt={dish.name} className="w-10 h-10 rounded-lg object-cover border border-neutral-800 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 shrink-0">
                        <Utensils className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white leading-tight">{dish.name}</span>
                        {!dish.isAvailable && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-bold tracking-wider uppercase">
                            AGOTADO (86)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 mt-0.5 block">
                        {dish.categoryName || 'Plato'} • S/ {dish.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleDishStock(dish)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                      dish.isAvailable
                        ? 'bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-red-500 hover:text-red-400'
                        : 'bg-emerald-500 text-black hover:bg-emerald-400'
                    }`}
                  >
                    {dish.isAvailable ? 'Marcar Agotado' : 'Reactivar en Carta'}
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-800 pt-3 flex justify-between items-center text-xs text-neutral-400">
              <span>Total platos en carta: {currentDishes.length}</span>
              <button
                onClick={() => setIsStockOutModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition cursor-pointer"
              >
                Cerrar Lista 86
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: KITCHEN TICKET CARD (KDS FORMAT)
// =========================================================================
interface KitchenTicketCardProps {
  order: Order;
  onAdvance: () => void;
  advanceLabel: string;
  advanceColor: string;
}

const KitchenTicketCard: React.FC<KitchenTicketCardProps> = ({
  order,
  onAdvance,
  advanceLabel,
  advanceColor,
}) => {
  // Compute minutes since order
  const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
  const minutesAgo = Math.max(0, Math.floor((Date.now() - orderTime) / 60000));
  
  // Timer color: <10m normal, 10-15m warning, >15m emergency
  const timerBadgeColor = minutesAgo < 10 
    ? 'bg-neutral-900 text-neutral-300 border-neutral-800' 
    : minutesAgo < 15 
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
    : 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';

  return (
    <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 shadow-md space-y-3 relative hover:border-neutral-700 transition">
      
      {/* Header: Table / Destination & Timer */}
      <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            {order.type === 'DINE_IN' ? (
              <span className="px-2.5 py-1 rounded-lg bg-white text-black font-black text-xs tracking-wider">
                MESA {order.tableNumber || '01'}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-neutral-200 text-black font-black text-xs tracking-wider">
                DELIVERY
              </span>
            )}
            <span className="text-xs text-neutral-400 font-mono">
              #{order.id.slice(-4).toUpperCase()}
            </span>
          </div>

          <span className="text-[11px] text-neutral-400 block mt-1">
            {order.customerName ? `Cliente: ${order.customerName}` : 'Comanda Salón'}
          </span>
        </div>

        {/* Time elapsed */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs border ${timerBadgeColor}`}>
          <Clock className="w-3 h-3" />
          <span>{minutesAgo === 0 ? 'Ahora' : `${minutesAgo} min`}</span>
        </div>
      </div>

      {/* Dish Items & Per-unit Observations */}
      <div className="space-y-2 divide-y divide-neutral-800/60">
        {order.items.map((item, idx) => (
          <div key={idx} className="pt-2 first:pt-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-neutral-800 text-white font-black text-xs flex items-center justify-center shrink-0 border border-neutral-700">
                  {item.quantity}x
                </span>
                <span className="text-xs font-bold text-white leading-snug">
                  {item.menuItem.name}
                </span>
              </div>
            </div>

            {/* Per-unit specifications / observations */}
            {item.unitDetails && item.unitDetails.length > 0 && (
              <div className="pl-8 space-y-1 mt-1">
                {item.unitDetails.map((unit) => (
                  <div key={unit.unitNumber} className="text-[11px] bg-neutral-800/80 border border-neutral-700 px-2 py-0.5 rounded text-neutral-200">
                    <span className="font-bold text-white">U#{unit.unitNumber}:</span> {unit.observation || 'Sin especificaciones'}
                    {unit.selectedAddons && unit.selectedAddons.length > 0 && (
                      <span className="text-neutral-300 font-semibold block text-[10px]">
                        + {unit.selectedAddons.map(a => a.name).join(', ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Global Order Notes */}
      {order.notes && (
        <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 italic">
          "{order.notes}"
        </div>
      )}

      {/* Action button */}
      <div className="pt-2 border-t border-neutral-800">
        <button
          onClick={onAdvance}
          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${advanceColor}`}
        >
          <span>{advanceLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
