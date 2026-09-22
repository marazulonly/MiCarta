import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  ChefHat, 
  User as UserIcon, 
  Crown, 
  Check, 
  Clock, 
  Utensils, 
  Sparkles, 
  RotateCcw, 
  Bell, 
  Layers, 
  ArrowRight, 
  Plus, 
  Minus, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Flame, 
  Monitor, 
  QrCode, 
  Bike,
  Volume2,
  VolumeX,
  Play,
  Send,
  Coffee,
  Receipt
} from 'lucide-react';
import { 
  Restaurant, 
  MenuItem, 
  MenuCategory, 
  Order, 
  OrderStatus, 
  OrderType, 
  OrderItem, 
  User 
} from '../types';

interface AdminSimulationViewProps {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  users: User[];
  onCloseSimulation: () => void;
  onSyncGlobalOrder?: (order: Order) => void;
}

export const AdminSimulationView: React.FC<AdminSimulationViewProps> = ({
  restaurants,
  menuItems,
  categories,
  users,
  onCloseSimulation,
  onSyncGlobalOrder,
}) => {
  // Selected restaurant for simulation
  const [selectedRestId, setSelectedRestId] = useState<string>(restaurants[0]?.id || 'rest-brasas');
  const currentRest = restaurants.find(r => r.id === selectedRestId) || restaurants[0];

  // Simulation order source & parameters
  const [orderSource, setOrderSource] = useState<'CUSTOMER_DINE_IN' | 'CUSTOMER_DELIVERY' | 'WAITER_TABLE'>('CUSTOMER_DINE_IN');
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(4);
  const [customerName, setCustomerName] = useState<string>('Carlos Mendoza');
  const [customerDni, setCustomerDni] = useState<string>('10203040');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Av. Larco 743, Miraflores (Dpto 502)');
  const [deliveryPhone, setDeliveryPhone] = useState<string>('+51 987 654 321');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active simulated order state
  const [activeSimOrder, setActiveSimOrder] = useState<Order | null>(null);

  // Local simulated cart in Phone 3 (Customer)
  const [simCart, setSimCart] = useState<{
    item: MenuItem;
    quantity: number;
    observation: string;
    addons: { id: string; name: string; price: number }[];
  }[]>([]);

  // Phone 3 active view: 'menu' | 'cart' | 'status'
  const [customerPhoneView, setCustomerPhoneView] = useState<'menu' | 'cart' | 'status'>('menu');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('ALL');
  const [customerCallWaiterAlert, setCustomerCallWaiterAlert] = useState<string | null>(null);
  const [ownerNotification, setOwnerNotification] = useState<{ text: string; time: string } | null>(null);

  // Filter items and categories for current restaurant
  const restItems = menuItems.filter(i => i.restaurantId === currentRest.id);
  const restCategories = categories.filter(c => c.restaurantId === currentRest.id);

  // Filter waiters for current restaurant
  const assignedWaiters = users.filter(u => 
    u.role === 'WAITER' && (u.restaurantIds.includes(currentRest.id) || u.restaurantIds.includes('all'))
  );
  const currentWaiter = assignedWaiters[0] || {
    id: 'usr-waiter-1',
    name: 'Juan Pérez (Mozo)',
    dni: '40506070',
    role: 'WAITER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  // Play sound effect
  const playBeep = (type: 'order' | 'kitchen' | 'ready' | 'delivered') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (type === 'order') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
      } else if (type === 'kitchen') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2);
      } else if (type === 'ready') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context may be restricted
    }
  };

  // Seed default initial order for instant visual simulation
  useEffect(() => {
    const item1 = restItems[0] || menuItems[0];
    const item2 = restItems[1] || menuItems[1];

    if (item1 && item2 && !activeSimOrder) {
      const initialOrder: Order = {
        id: `sim-ord-${Date.now()}`,
        restaurantId: currentRest.id,
        orderNumber: `${currentRest.name.substring(0, 2).toUpperCase()}-402`,
        type: orderSource === 'CUSTOMER_DELIVERY' ? 'DELIVERY' : 'DINE_IN',
        status: 'PENDING',
        tableNumber: `Mesa ${selectedTableNumber < 10 ? '0' + selectedTableNumber : selectedTableNumber}`,
        customerName: customerName,
        customerDni: customerDni,
        customerPhone: deliveryPhone,
        customerWhatsapp: deliveryPhone,
        deliveryAddress: orderSource === 'CUSTOMER_DELIVERY' ? deliveryAddress : undefined,
        waiterName: orderSource === 'WAITER_TABLE' ? currentWaiter.name : undefined,
        waiterId: orderSource === 'WAITER_TABLE' ? currentWaiter.id : undefined,
        items: [
          {
            id: `sim-oi-1`,
            menuItemId: item1.id,
            name: item1.name,
            price: item1.price,
            quantity: 1,
            units: [
              {
                unitNumber: 1,
                observation: 'Término 3/4, con chimichurri extra',
                selectedAddons: item1.availableAddons?.slice(0, 1) || []
              }
            ]
          },
          {
            id: `sim-oi-2`,
            menuItemId: item2.id,
            name: item2.name,
            price: item2.price,
            quantity: 2,
            units: [
              {
                unitNumber: 1,
                observation: 'Bien frío, con hielo',
                selectedAddons: []
              },
              {
                unitNumber: 2,
                observation: 'Sin azúcar añadida',
                selectedAddons: []
              }
            ]
          }
        ],
        subtotal: item1.price + item2.price * 2,
        tax: (item1.price + item2.price * 2) * 0.18,
        deliveryFee: orderSource === 'CUSTOMER_DELIVERY' ? 6.00 : 0,
        total: (item1.price + item2.price * 2) * 1.18 + (orderSource === 'CUSTOMER_DELIVERY' ? 6.00 : 0),
        paymentStatus: 'PENDING',
        createdAt: 'Hace 1 min',
        estimatedMinutes: 20
      };

      setActiveSimOrder(initialOrder);
      setCustomerPhoneView('status');
      setOwnerNotification({
        text: `¡Nuevo pedido ${initialOrder.orderNumber} en ${initialOrder.tableNumber || 'Delivery'}!`,
        time: 'Ahora'
      });
    }
  }, [selectedRestId, orderSource]);

  // Handler: Update simulated order status across all 3 phones
  const handleUpdateSimStatus = (nextStatus: OrderStatus) => {
    if (!activeSimOrder) return;
    const updated = { ...activeSimOrder, status: nextStatus };
    setActiveSimOrder(updated);

    if (nextStatus === 'IN_KITCHEN') {
      playBeep('kitchen');
      setOwnerNotification({ text: `Pedido ${updated.orderNumber} ingresó a preparación en cocina`, time: 'Ahora' });
    } else if (nextStatus === 'READY') {
      playBeep('ready');
      setOwnerNotification({ text: `¡Comanda ${updated.orderNumber} lista para servir / despachar!`, time: 'Ahora' });
    } else if (nextStatus === 'DELIVERED') {
      playBeep('delivered');
      setOwnerNotification({ text: `Pedido ${updated.orderNumber} entregado y cobrado exitosamente`, time: 'Ahora' });
    }

    if (onSyncGlobalOrder) {
      onSyncGlobalOrder(updated);
    }
  };

  // Handler: Add item to Customer simulated cart
  const handleAddToCart = (item: MenuItem) => {
    const existingIndex = simCart.findIndex(c => c.item.id === item.id);
    if (existingIndex >= 0) {
      const updated = [...simCart];
      updated[existingIndex].quantity += 1;
      setSimCart(updated);
    } else {
      setSimCart([...simCart, {
        item,
        quantity: 1,
        observation: item.suggestedObservations?.[0] || 'Término estándar',
        addons: item.availableAddons?.slice(0, 1) || []
      }]);
    }
    playBeep('order');
  };

  // Handler: Submit Customer or Waiter cart as New Order
  const handleSubmitNewOrder = (sourceType: 'CUSTOMER' | 'WAITER') => {
    if (simCart.length === 0 && !activeSimOrder) return;

    const itemsToOrder = simCart.length > 0 
      ? simCart.map((c, idx) => ({
          id: `sim-oi-${Date.now()}-${idx}`,
          menuItemId: c.item.id,
          name: c.item.name,
          price: c.item.price,
          quantity: c.quantity,
          units: Array.from({ length: c.quantity }).map((_, uIdx) => ({
            unitNumber: uIdx + 1,
            observation: c.observation,
            selectedAddons: c.addons
          }))
        }))
      : (activeSimOrder?.items || []);

    const subtotal = itemsToOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.18;
    const deliveryFee = orderSource === 'CUSTOMER_DELIVERY' ? 6.00 : 0;
    const total = subtotal + tax + deliveryFee;

    const tableLabel = `Mesa ${selectedTableNumber < 10 ? '0' + selectedTableNumber : selectedTableNumber}`;

    const newOrder: Order = {
      id: `sim-ord-${Date.now()}`,
      restaurantId: currentRest.id,
      orderNumber: `${currentRest.name.substring(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      type: orderSource === 'CUSTOMER_DELIVERY' ? 'DELIVERY' : 'DINE_IN',
      status: 'PENDING',
      tableNumber: orderSource === 'CUSTOMER_DELIVERY' ? undefined : tableLabel,
      customerName: customerName.trim() || 'Comensal en Mesa',
      customerDni: customerDni,
      customerPhone: deliveryPhone,
      customerWhatsapp: deliveryPhone,
      deliveryAddress: orderSource === 'CUSTOMER_DELIVERY' ? deliveryAddress : undefined,
      waiterName: sourceType === 'WAITER' ? currentWaiter.name : undefined,
      waiterId: sourceType === 'WAITER' ? currentWaiter.id : undefined,
      items: itemsToOrder,
      subtotal,
      tax,
      deliveryFee,
      total,
      paymentStatus: 'PENDING',
      createdAt: 'Hace instantes',
      estimatedMinutes: 20
    };

    setActiveSimOrder(newOrder);
    setSimCart([]);
    setCustomerPhoneView('status');
    playBeep('order');
    setOwnerNotification({
      text: `🎉 ¡Nuevo pedido ${newOrder.orderNumber} ${sourceType === 'WAITER' ? 'tomado por Mozo' : 'desde QR Cliente'}!`,
      time: 'Ahora'
    });

    if (onSyncGlobalOrder) {
      onSyncGlobalOrder(newOrder);
    }
  };

  // Handler: Quick scenario presets
  const handleApplyScenario = (scenario: 'parrilla' | 'ceviche' | 'delivery') => {
    if (scenario === 'parrilla') {
      setSelectedRestId('rest-brasas');
      setOrderSource('CUSTOMER_DINE_IN');
      setSelectedTableNumber(4);
      setCustomerName('Gonzalo Vargas');
      const p1 = restItems.find(i => i.name.includes('Parrillada') || i.name.includes('Bife') || i.name.includes('Lomo')) || restItems[0];
      const p2 = restItems.find(i => i.name.includes('Chicha') || i.name.includes('Cerveza') || i.name.includes('Bebida')) || restItems[1];
      if (p1 && p2) {
        setSimCart([
          { item: p1, quantity: 1, observation: 'Término 3/4 con chimichurri extra', addons: p1.availableAddons?.slice(0, 1) || [] },
          { item: p2, quantity: 2, observation: 'Bien fría con limón', addons: [] }
        ]);
        setCustomerPhoneView('cart');
      }
    } else if (scenario === 'ceviche') {
      const rest = restaurants.find(r => r.id === 'rest-costa') || restaurants[0];
      setSelectedRestId(rest.id);
      setOrderSource('WAITER_TABLE');
      setSelectedTableNumber(8);
      setCustomerName('Luciana Ramos');
      const c1 = menuItems.find(i => i.restaurantId === rest.id && (i.name.includes('Ceviche') || i.name.includes('Tiradito'))) || menuItems[0];
      const c2 = menuItems.find(i => i.restaurantId === rest.id && (i.name.includes('Pisco') || i.name.includes('Chicha'))) || menuItems[1];
      if (c1 && c2) {
        setSimCart([
          { item: c1, quantity: 2, observation: 'Picante medio, sin culantro', addons: [] },
          { item: c2, quantity: 2, observation: 'Pisco Quebranta clásico', addons: [] }
        ]);
        setCustomerPhoneView('cart');
      }
    } else if (scenario === 'delivery') {
      setSelectedRestId('rest-criollo');
      setOrderSource('CUSTOMER_DELIVERY');
      setCustomerName('Martín Vizcarra');
      setDeliveryAddress('Calle Las Begonias 450, San Isidro (Of. 801)');
      const d1 = menuItems.find(i => i.restaurantId === 'rest-criollo') || menuItems[0];
      if (d1) {
        setSimCart([
          { item: d1, quantity: 2, observation: 'Enviar ají y cremas en envases separados', addons: [] }
        ]);
        setCustomerPhoneView('cart');
      }
    }
  };

  // Handler: Call waiter from customer phone
  const handleCustomerCallWaiter = () => {
    setCustomerCallWaiterAlert(`Mesa ${selectedTableNumber} solicita asistencia del mozo`);
    playBeep('ready');
    setTimeout(() => {
      setCustomerCallWaiterAlert(null);
    }, 6000);
  };

  return (
    <div className="w-full space-y-6 pb-20">
      
      {/* ============================================================= */}
      {/* PC ONLY WARNING BANNER (Shows only on < lg screens)           */}
      {/* ============================================================= */}
      <div className="lg:hidden p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
        <Monitor className="w-6 h-6 shrink-0 text-amber-400" />
        <div>
          <strong className="font-bold block">Vista Optimizada para PC / Pantalla Panorámica</strong>
          <span>Esta simulación sincronizada en tiempo real muestra 3 dispositivos móviles en paralelo. Te recomendamos ampliar la ventana o usar tu ordenador para una experiencia visual completa.</span>
        </div>
      </div>

      {/* ============================================================= */}
      {/* SIMULATION COMMAND CENTER HEADER                              */}
      {/* ============================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-md shadow-2xl space-y-5">
        
        {/* Top Title & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-400 text-black shadow-lg shadow-amber-400/20">
                <Sparkles className="w-5 h-5 font-black" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-white uppercase">
                    Simulador Multi-Dispositivo en Tiempo Real
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                    LIVE SYNC
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Visualiza en paralelo cómo un pedido realizado por el <strong>Cliente</strong> o <strong>Mesero</strong> impacta instantáneamente en las pantallas móviles del <strong>Dueño</strong>, del <strong>Mesero</strong> y del <strong>Cliente</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                soundEnabled 
                  ? 'bg-neutral-800 border-neutral-700 text-amber-400' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500'
              }`}
              title={soundEnabled ? 'Sonidos de alerta activados' : 'Sonidos silenciados'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
            </button>

            {/* Reset simulation */}
            <button
              onClick={() => {
                setActiveSimOrder(null);
                setSimCart([]);
                setCustomerPhoneView('menu');
                setOwnerNotification(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Simulación</span>
            </button>

            {/* Exit Simulation Checkbox toggle */}
            <button
              onClick={onCloseSimulation}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 text-black hover:bg-amber-300 font-bold text-xs transition shadow-lg shadow-amber-400/10 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Salir de Simulación</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Parameters & Quick Presets */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 pt-1">
          
          {/* 1. Restaurant Selector */}
          <div className="p-3 rounded-xl bg-black/50 border border-neutral-800 space-y-1">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              1. Restaurante Seleccionado:
            </label>
            <select
              value={selectedRestId}
              onChange={(e) => setSelectedRestId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.cuisineType})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Order Origin Selector */}
          <div className="p-3 rounded-xl bg-black/50 border border-neutral-800 space-y-1">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              2. Origen del Pedido:
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setOrderSource('CUSTOMER_DINE_IN')}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  orderSource === 'CUSTOMER_DINE_IN'
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <QrCode className="w-3 h-3 shrink-0" />
                <span className="truncate">QR Mesa</span>
              </button>
              <button
                onClick={() => setOrderSource('WAITER_TABLE')}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  orderSource === 'WAITER_TABLE'
                    ? 'bg-sky-400 text-black border-sky-300'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <ChefHat className="w-3 h-3 shrink-0" />
                <span className="truncate">Mozo</span>
              </button>
              <button
                onClick={() => setOrderSource('CUSTOMER_DELIVERY')}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  orderSource === 'CUSTOMER_DELIVERY'
                    ? 'bg-blue-400 text-black border-blue-300'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <Bike className="w-3 h-3 shrink-0" />
                <span className="truncate">Delivery</span>
              </button>
            </div>
          </div>

          {/* 3. Table / Delivery info */}
          <div className="p-3 rounded-xl bg-black/50 border border-neutral-800 space-y-1">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              {orderSource === 'CUSTOMER_DELIVERY' ? '3. Dirección de Entrega:' : '3. Número de Mesa Física:'}
            </label>
            {orderSource === 'CUSTOMER_DELIVERY' ? (
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white"
                placeholder="Av. Larco 743..."
              />
            ) : (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[1, 2, 4, 6, 8, 12].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedTableNumber(num)}
                    className={`px-2 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                      selectedTableNumber === num 
                        ? 'bg-emerald-400 text-black' 
                        : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                    }`}
                  >
                    Mesa {num < 10 ? '0' + num : num}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Quick Scenario Presets */}
          <div className="p-3 rounded-xl bg-black/50 border border-neutral-800 space-y-1">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              4. Cargar Escenarios Rápidos:
            </label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleApplyScenario('parrilla')}
                className="flex-1 py-1 px-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-300 text-[11px] font-semibold transition truncate cursor-pointer text-center"
              >
                🥩 Parrilla M04
              </button>
              <button
                onClick={() => handleApplyScenario('ceviche')}
                className="flex-1 py-1 px-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-sky-300 text-[11px] font-semibold transition truncate cursor-pointer text-center"
              >
                🐟 Ceviche M08
              </button>
              <button
                onClick={() => handleApplyScenario('delivery')}
                className="flex-1 py-1 px-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-emerald-300 text-[11px] font-semibold transition truncate cursor-pointer text-center"
              >
                🛵 Delivery
              </button>
            </div>
          </div>

        </div>

        {/* Global Pipeline Stepper Controls */}
        {activeSimOrder && (
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold text-white">
                Comanda Activa: <span className="font-mono text-amber-300">{activeSimOrder.orderNumber}</span> ({activeSimOrder.tableNumber || 'Delivery'})
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                Total: S/ {activeSimOrder.total.toFixed(2)}
              </span>
            </div>

            {/* Stepper Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleUpdateSimStatus('PENDING')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                  activeSimOrder.status === 'PENDING'
                    ? 'bg-amber-400 text-black border-amber-300 shadow'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <span>1. Recibido</span>
              </button>

              <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />

              <button
                onClick={() => handleUpdateSimStatus('IN_KITCHEN')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                  activeSimOrder.status === 'IN_KITCHEN'
                    ? 'bg-orange-500 text-white border-orange-400 shadow'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>2. En Cocina</span>
              </button>

              <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />

              <button
                onClick={() => handleUpdateSimStatus('READY')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                  activeSimOrder.status === 'READY'
                    ? 'bg-emerald-500 text-black border-emerald-400 font-black shadow'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <Bell className="w-3 h-3" />
                <span>3. Listo para Servir</span>
              </button>

              <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />

              <button
                onClick={() => handleUpdateSimStatus('DELIVERED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                  activeSimOrder.status === 'DELIVERED'
                    ? 'bg-purple-500 text-white border-purple-400 shadow'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>4. Servido / Cobrado</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================= */}
      {/* 3 COLUMNS: THREE LIVE SMARTPHONE MOCKUPS                      */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ------------------------------------------------------------- */}
        {/* COLUMN 1: MÓVIL DUEÑO (OWNER MOBILE VIEW)                     */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col items-center">
          {/* Column Header Label */}
          <div className="w-full max-w-[340px] flex items-center justify-between px-3 py-2 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">COLUMNA 1: Móvil Dueño</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">
              OWNER APP
            </span>
          </div>

          {/* Smartphone Mockup Frame */}
          <div className="w-full max-w-[340px] h-[640px] rounded-[36px] bg-neutral-950 border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-white/10">
            {/* Phone Notch & Status Bar */}
            <div className="h-6 bg-black flex items-center justify-between px-6 shrink-0 text-[10px] font-mono text-neutral-400 border-b border-neutral-900">
              <span>9:41</span>
              <div className="w-16 h-3 bg-neutral-800 rounded-full mx-auto" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span className="w-3 h-2 rounded-sm border border-neutral-400 inline-block bg-neutral-400" />
              </div>
            </div>

            {/* Owner App Content */}
            <div className="flex-1 overflow-y-auto bg-neutral-950 p-3.5 space-y-3">
              
              {/* App Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <img 
                    src={currentRest.logoUrl} 
                    alt={currentRest.name} 
                    className="w-7 h-7 rounded-lg object-cover border border-neutral-700" 
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">{currentRest.name}</h4>
                    <span className="text-[10px] text-emerald-400 font-semibold">● Panel de Gerencia</span>
                  </div>
                </div>
                <span className="p-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400">
                  <Bell className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Owner Real-time Financial Metric Card */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-neutral-900 to-black border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">
                  Ventas del Día en Vivo:
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-black font-mono text-white">
                    S/ {(currentRest.metrics.dailyRevenue + (activeSimOrder?.total || 0)).toFixed(2)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    +1 Comanda
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-neutral-800/60 text-[10px]">
                  <div>
                    <span className="text-neutral-500 block">Mesas Ocupadas:</span>
                    <strong className="text-neutral-200">
                      {activeSimOrder && activeSimOrder.type === 'DINE_IN' ? '5 / 12' : '4 / 12'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Tiempo Promedio:</span>
                    <strong className="text-amber-400">18 min</strong>
                  </div>
                </div>
              </div>

              {/* Real-time Order Notification Pop */}
              {ownerNotification && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs animate-in slide-in-from-top-1">
                  <div className="flex items-center gap-1.5 font-bold mb-0.5 text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Notificación Push de Gerencia</span>
                  </div>
                  <p className="text-[11px] leading-tight">{ownerNotification.text}</p>
                </div>
              )}

              {/* Active Order Card for Owner */}
              {activeSimOrder ? (
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 block">
                        {activeSimOrder.orderNumber}
                      </span>
                      <h5 className="text-xs font-bold text-white">
                        {activeSimOrder.tableNumber || 'Reparto a Domicilio'}
                      </h5>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      activeSimOrder.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      activeSimOrder.status === 'IN_KITCHEN' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                      activeSimOrder.status === 'READY' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {activeSimOrder.status === 'PENDING' ? 'Recibido' :
                       activeSimOrder.status === 'IN_KITCHEN' ? 'En Cocina' :
                       activeSimOrder.status === 'READY' ? 'Listo' : 'Entregado'}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="p-2 rounded-lg bg-black/50 text-[11px] space-y-0.5">
                    <div className="flex justify-between text-neutral-300">
                      <span>Cliente:</span>
                      <strong className="text-white">{activeSimOrder.customerName}</strong>
                    </div>
                    {activeSimOrder.deliveryAddress && (
                      <div className="text-[10px] text-neutral-400 truncate">
                        📍 {activeSimOrder.deliveryAddress}
                      </div>
                    )}
                  </div>

                  {/* Item List Summary */}
                  <div className="space-y-1.5 text-[11px]">
                    {activeSimOrder.items.map(item => (
                      <div key={item.id} className="flex items-start justify-between text-neutral-300">
                        <div className="flex items-start gap-1">
                          <span className="font-mono font-bold text-amber-400">{item.quantity}x</span>
                          <div>
                            <span className="text-white font-medium">{item.name}</span>
                            {item.units?.[0]?.observation && (
                              <p className="text-[9px] text-neutral-400 italic">
                                Nota: {item.units[0].observation}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-mono text-neutral-200">S/ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Quick Actions */}
                  <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Total con IGV:</span>
                      <span className="text-sm font-black font-mono text-white">
                        S/ {activeSimOrder.total.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleUpdateSimStatus(
                        activeSimOrder.status === 'PENDING' ? 'IN_KITCHEN' :
                        activeSimOrder.status === 'IN_KITCHEN' ? 'READY' : 'DELIVERED'
                      )}
                      className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-bold text-[10px] hover:bg-amber-300 transition cursor-pointer"
                    >
                      Avanzar Estado
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  Esperando que el cliente o mesero envíe un nuevo pedido...
                </div>
              )}
            </div>

            {/* Phone Home Bar */}
            <div className="h-4 bg-black flex items-center justify-center shrink-0">
              <div className="w-24 h-1 bg-neutral-700 rounded-full" />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* COLUMN 2: MÓVIL MESERO (WAITER MOBILE VIEW)                   */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col items-center">
          {/* Column Header Label */}
          <div className="w-full max-w-[340px] flex items-center justify-between px-3 py-2 mb-2 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-sky-300">COLUMNA 2: Móvil Mesero</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300 font-mono font-bold">
              WAITER APP
            </span>
          </div>

          {/* Smartphone Mockup Frame */}
          <div className="w-full max-w-[340px] h-[640px] rounded-[36px] bg-neutral-950 border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-white/10">
            {/* Phone Notch & Status Bar */}
            <div className="h-6 bg-black flex items-center justify-between px-6 shrink-0 text-[10px] font-mono text-neutral-400 border-b border-neutral-900">
              <span>9:41</span>
              <div className="w-16 h-3 bg-neutral-800 rounded-full mx-auto" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span className="w-3 h-2 rounded-sm border border-neutral-400 inline-block bg-neutral-400" />
              </div>
            </div>

            {/* Waiter App Content */}
            <div className="flex-1 overflow-y-auto bg-neutral-950 p-3.5 space-y-3">
              
              {/* Waiter Profile Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <img
                    src={currentWaiter.avatar}
                    alt={currentWaiter.name}
                    className="w-7 h-7 rounded-full object-cover border border-sky-500/50"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">{currentWaiter.name}</h4>
                    <span className="text-[10px] text-neutral-400">Mozo de Salón (DNI: {currentWaiter.dni})</span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 text-sky-400 border border-neutral-800 font-mono">
                  En Turno
                </span>
              </div>

              {/* Call Waiter Alert if triggered by Customer */}
              {customerCallWaiterAlert && (
                <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-xs animate-bounce">
                  <div className="flex items-center gap-1.5 font-bold text-red-300">
                    <Bell className="w-3.5 h-3.5" />
                    <span>¡Llamada de Mesa!</span>
                  </div>
                  <p className="text-[11px]">{customerCallWaiterAlert}</p>
                </div>
              )}

              {/* Waiter Quick Comanda Ticket (KDS Format) */}
              {activeSimOrder ? (
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center font-bold text-xs">
                        {activeSimOrder.tableNumber ? activeSimOrder.tableNumber.replace('Mesa ', '') : 'DL'}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-white">
                          {activeSimOrder.tableNumber || 'Pedido Delivery'}
                        </h5>
                        <span className="text-[10px] text-neutral-400 font-mono">{activeSimOrder.orderNumber}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      activeSimOrder.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' :
                      activeSimOrder.status === 'IN_KITCHEN' ? 'bg-orange-500/20 text-orange-300' :
                      activeSimOrder.status === 'READY' ? 'bg-emerald-500/20 text-emerald-300 animate-pulse' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      {activeSimOrder.status === 'PENDING' ? 'Por Atender' :
                       activeSimOrder.status === 'IN_KITCHEN' ? 'En Cocina' :
                       activeSimOrder.status === 'READY' ? '¡Servir!' : 'Servido'}
                    </span>
                  </div>

                  {/* Detailed Comanda Items with Unit Observations */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Comanda de Cocina (Detalle por unidad):
                    </span>
                    {activeSimOrder.items.map((item, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-black/50 border border-neutral-800 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">
                            <span className="text-sky-400 font-mono mr-1">{item.quantity}x</span> {item.name}
                          </span>
                          <span className="font-mono text-neutral-400 text-[11px]">S/ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>

                        {/* Units breakdown */}
                        {item.units && item.units.length > 0 && (
                          <div className="space-y-0.5 pt-1 border-t border-neutral-800/60">
                            {item.units.map(u => (
                              <div key={u.unitNumber} className="text-[10px] text-neutral-400 flex items-start gap-1">
                                <span className="font-mono text-neutral-500">U{u.unitNumber}:</span>
                                <span>{u.observation || 'Preparación estándar'}</span>
                                {u.selectedAddons && u.selectedAddons.length > 0 && (
                                  <span className="text-amber-300">
                                    (+{u.selectedAddons.map(a => a.name).join(', ')})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Waiter Stage Action Buttons */}
                  <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                    {activeSimOrder.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateSimStatus('IN_KITCHEN')}
                        className="w-full py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Enviar a Cocina</span>
                      </button>
                    )}

                    {activeSimOrder.status === 'IN_KITCHEN' && (
                      <button
                        onClick={() => handleUpdateSimStatus('READY')}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Marcar Listo para Servir</span>
                      </button>
                    )}

                    {activeSimOrder.status === 'READY' && (
                      <button
                        onClick={() => handleUpdateSimStatus('DELIVERED')}
                        className="w-full py-2 px-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Entregado a Mesa / Cobrar</span>
                      </button>
                    )}

                    {activeSimOrder.status === 'DELIVERED' && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center text-xs font-bold">
                        ✓ Mesa Atendida y Cobrada
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  Sin comandas asignadas en este momento.
                </div>
              )}

              {/* Waiter Take Order Button for Mesa */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setOrderSource('WAITER_TABLE');
                    setCustomerPhoneView('menu');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tomar Nueva Comanda en Mesa</span>
                </button>
              </div>

            </div>

            {/* Phone Home Bar */}
            <div className="h-4 bg-black flex items-center justify-center shrink-0">
              <div className="w-24 h-1 bg-neutral-700 rounded-full" />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* COLUMN 3: MÓVIL CLIENTE (CUSTOMER MOBILE VIEW)                */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col items-center">
          {/* Column Header Label */}
          <div className="w-full max-w-[340px] flex items-center justify-between px-3 py-2 mb-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">COLUMNA 3: Móvil Cliente</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono font-bold">
              CUSTOMER MENU
            </span>
          </div>

          {/* Smartphone Mockup Frame */}
          <div className="w-full max-w-[340px] h-[640px] rounded-[36px] bg-neutral-950 border-4 border-neutral-800 shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-white/10">
            {/* Phone Notch & Status Bar */}
            <div className="h-6 bg-black flex items-center justify-between px-6 shrink-0 text-[10px] font-mono text-neutral-400 border-b border-neutral-900">
              <span>9:41</span>
              <div className="w-16 h-3 bg-neutral-800 rounded-full mx-auto" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span className="w-3 h-2 rounded-sm border border-neutral-400 inline-block bg-neutral-400" />
              </div>
            </div>

            {/* Customer Navigation Bar inside phone */}
            <div className="bg-black/90 px-3 py-2 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-black font-bold font-mono">
                  {orderSource === 'CUSTOMER_DELIVERY' ? 'DELIVERY' : `MESA ${selectedTableNumber < 10 ? '0' + selectedTableNumber : selectedTableNumber}`}
                </span>
                <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
                  {currentRest.name}
                </span>
              </div>

              {/* View Switcher inside phone */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCustomerPhoneView('menu')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    customerPhoneView === 'menu' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Carta
                </button>
                <button
                  onClick={() => setCustomerPhoneView('cart')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                    customerPhoneView === 'cart' ? 'bg-amber-400 text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-2.5 h-2.5" />
                  <span>({simCart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                </button>
                {activeSimOrder && (
                  <button
                    onClick={() => setCustomerPhoneView('status')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      customerPhoneView === 'status' ? 'bg-emerald-400 text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Estado
                  </button>
                )}
              </div>
            </div>

            {/* Customer Content by View */}
            <div className="flex-1 overflow-y-auto bg-neutral-950 p-3 space-y-3">
              
              {/* VIEW A: DIGITAL MENU */}
              {customerPhoneView === 'menu' && (
                <div className="space-y-2.5">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                    <button
                      onClick={() => setSelectedCategoryTab('ALL')}
                      className={`px-2 py-1 rounded-full whitespace-nowrap font-bold transition ${
                        selectedCategoryTab === 'ALL' ? 'bg-amber-400 text-black' : 'bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      Todos ({restItems.length})
                    </button>
                    {restCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryTab(cat.id)}
                        className={`px-2 py-1 rounded-full whitespace-nowrap font-bold transition ${
                          selectedCategoryTab === cat.id ? 'bg-amber-400 text-black' : 'bg-neutral-900 text-neutral-400'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Dish List */}
                  <div className="space-y-2">
                    {restItems
                      .filter(i => selectedCategoryTab === 'ALL' || i.categoryId === selectedCategoryTab)
                      .slice(0, 6)
                      .map(item => (
                        <div 
                          key={item.id} 
                          className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-2"
                        >
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-12 h-12 rounded-lg object-cover border border-neutral-700 shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                            <span className="text-[10px] font-mono text-amber-400 font-bold block">
                              S/ {item.price.toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="p-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 font-bold text-xs transition cursor-pointer shrink-0"
                            title="Agregar al pedido"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>

                  {/* Sticky Cart Preview Banner if cart not empty */}
                  {simCart.length > 0 && (
                    <button
                      onClick={() => setCustomerPhoneView('cart')}
                      className="w-full p-2.5 rounded-xl bg-amber-400 text-black font-black text-xs flex items-center justify-between shadow-lg shadow-amber-400/20 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4" />
                        <span>Ver Carrito ({simCart.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                      </div>
                      <span className="font-mono">
                        S/ {simCart.reduce((sum, i) => sum + i.item.price * i.quantity, 0).toFixed(2)}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* VIEW B: CART & SUBMISSION */}
              {customerPhoneView === 'cart' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                    <h5 className="text-xs font-bold text-white">Tu Pedido Actual</h5>
                    <button
                      onClick={() => setCustomerPhoneView('menu')}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      + Agregar más
                    </button>
                  </div>

                  {simCart.length > 0 ? (
                    <div className="space-y-2">
                      {simCart.map((c, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">{c.item.name}</span>
                            <span className="font-mono text-amber-400 font-bold">
                              S/ {(c.item.price * c.quantity).toFixed(2)}
                            </span>
                          </div>

                          {/* Quantity adjust */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 bg-black/60 px-2 py-0.5 rounded border border-neutral-800">
                              <button
                                onClick={() => {
                                  const updated = [...simCart];
                                  if (updated[idx].quantity > 1) {
                                    updated[idx].quantity -= 1;
                                    setSimCart(updated);
                                  } else {
                                    setSimCart(simCart.filter((_, i) => i !== idx));
                                  }
                                }}
                                className="text-neutral-400 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-white font-bold">{c.quantity}</span>
                              <button
                                onClick={() => {
                                  const updated = [...simCart];
                                  updated[idx].quantity += 1;
                                  setSimCart(updated);
                                }}
                                className="text-neutral-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={c.observation}
                              onChange={(e) => {
                                const updated = [...simCart];
                                updated[idx].observation = e.target.value;
                                setSimCart(updated);
                              }}
                              placeholder="Nota: Ej. Término 3/4..."
                              className="text-[10px] bg-black/50 border border-neutral-800 rounded px-2 py-1 text-neutral-300 w-32"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Submit Order Buttons */}
                      <div className="pt-2 border-t border-neutral-800 space-y-2">
                        <div className="flex justify-between text-xs text-neutral-300 font-bold">
                          <span>Total Estimado:</span>
                          <span className="font-mono text-amber-400 text-sm">
                            S/ {(simCart.reduce((sum, i) => sum + i.item.price * i.quantity, 0) * 1.18).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleSubmitNewOrder('CUSTOMER')}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs flex items-center justify-center gap-1.5 transition shadow-lg cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Confirmar y Enviar Pedido</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-neutral-500 text-xs">
                      El carrito está vacío. Agrega platos desde la carta.
                    </div>
                  )}
                </div>
              )}

              {/* VIEW C: LIVE ORDER TRACKER */}
              {customerPhoneView === 'status' && activeSimOrder && (
                <div className="space-y-3">
                  {/* Live Progress Card */}
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {activeSimOrder.orderNumber}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {activeSimOrder.tableNumber || 'Delivery'}
                      </span>
                    </div>

                    {/* Stepper Timeline */}
                    <div className="space-y-2 py-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          activeSimOrder.status !== 'CANCELLED' ? 'bg-emerald-400 text-black' : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          ✓
                        </div>
                        <div className="text-xs">
                          <strong className="text-white block leading-none">1. Pedido Recibido</strong>
                          <span className="text-[10px] text-neutral-400">Comanda registrada en el sistema</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          activeSimOrder.status === 'IN_KITCHEN' || activeSimOrder.status === 'READY' || activeSimOrder.status === 'DELIVERED'
                            ? 'bg-orange-500 text-white animate-pulse'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          2
                        </div>
                        <div className="text-xs">
                          <strong className="text-white block leading-none">2. En Preparación en Cocina</strong>
                          <span className="text-[10px] text-neutral-400">El chef está cocinando tu plato</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          activeSimOrder.status === 'READY' || activeSimOrder.status === 'DELIVERED'
                            ? 'bg-emerald-400 text-black'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          3
                        </div>
                        <div className="text-xs">
                          <strong className="text-white block leading-none">3. Listo para Servir</strong>
                          <span className="text-[10px] text-neutral-400">El mozo se acerca a tu mesa</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          activeSimOrder.status === 'DELIVERED'
                            ? 'bg-purple-500 text-white'
                            : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          4
                        </div>
                        <div className="text-xs">
                          <strong className="text-white block leading-none">4. Servido / Cuenta Pagada</strong>
                          <span className="text-[10px] text-neutral-400">¡Buen provecho!</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Quick Interactions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCustomerCallWaiter}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Llamar al Mozo</span>
                    </button>

                    <button
                      onClick={() => {
                        handleCustomerCallWaiter();
                        setCustomerCallWaiterAlert(`Mesa ${selectedTableNumber} solicita la Cuenta (Total: S/ ${activeSimOrder.total.toFixed(2)})`);
                      }}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Pedir la Cuenta</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Phone Home Bar */}
            <div className="h-4 bg-black flex items-center justify-center shrink-0">
              <div className="w-24 h-1 bg-neutral-700 rounded-full" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
