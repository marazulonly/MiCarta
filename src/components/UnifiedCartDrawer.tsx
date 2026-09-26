import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Check, 
  Trash2, 
  Pencil,
  Plus, 
  Minus, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Utensils, 
  Bike, 
  ChefHat, 
  AlertCircle, 
  Navigation,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  Restaurant, 
  MenuItem, 
  OrderItemUnit, 
  Order, 
  OrderType, 
  OrderItem 
} from '../types';

interface CartItemEntry {
  item: MenuItem;
  quantity: number;
  units: OrderItemUnit[];
}

interface UnifiedCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  cart: CartItemEntry[];
  onUpdateCart: (newCart: CartItemEntry[]) => void;
  onOrderCreated?: (newOrder: Order) => void;
  onEditCartEntry?: (item: MenuItem) => void;
  initialOrderType?: OrderType;
  initialMode?: 'DINE_IN' | 'DELIVERY';
  initialTableNumber?: string;
  themeStyle?: 'luxury' | 'chalkboard' | 'marine' | 'modern';
}

export const UnifiedCartDrawer: React.FC<UnifiedCartDrawerProps> = ({
  isOpen,
  onClose,
  restaurant,
  cart,
  onUpdateCart,
  onOrderCreated,
  onEditCartEntry,
  initialOrderType = 'DINE_IN',
  initialTableNumber,
  themeStyle = 'modern',
}) => {
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType);
  
  // Clean table string: e.g. "Mesa 04" -> "04"
  const cleanInitialTable = initialTableNumber 
    ? initialTableNumber.replace(/[^0-9]/g, '').padStart(2, '0') || initialTableNumber 
    : '04';

  // Presencial fields
  const [tableNumber, setTableNumber] = useState<string>(cleanInitialTable);
  const [dinerName, setDinerName] = useState<string>('Comensal');

  // Delivery fields
  const [customerWhatsapp, setCustomerWhatsapp] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryGpsLocation, setDeliveryGpsLocation] = useState<string>('');
  const [deliveryReference, setDeliveryReference] = useState<string>('');
  const [gpsDetected, setGpsDetected] = useState(false);

  // Validation errors
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderSent, setOrderSent] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  // View Confirmed Order Receipt Modal Screen
  if (confirmedOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in overflow-hidden">
        <div className="relative w-full max-w-none sm:max-w-xl h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl overflow-hidden flex flex-col bg-neutral-950 border-0 sm:border border-emerald-500/50 text-white shadow-2xl">
          
          {/* Receipt Header */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-emerald-950/70 border-b border-emerald-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold shrink-0">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-emerald-300">
                  ¡Pedido Confirmado con Éxito!
                </h3>
                <p className="text-[10px] sm:text-[11px] text-neutral-300 font-mono">
                  Orden {confirmedOrder.orderNumber} • {restaurant.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setConfirmedOrder(null);
                setOrderSent(false);
                onClose();
              }}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt Body */}
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Status Badge */}
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono block">Estado del Pedido</span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Enviado a Cocina / En Preparación</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono block">Tiempo Estimado</span>
                <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                  ⏱ ~{confirmedOrder.estimatedMinutes || 20} minutos
                </span>
              </div>
            </div>

            {/* Service & Customer Details */}
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-400">Tipo de Servicio:</span>
                <span className="font-bold text-white">
                  {confirmedOrder.type === 'DINE_IN' ? `Atención Presencial (${confirmedOrder.tableNumber || 'Mesa'})` : 'Delivery a Domicilio'}
                </span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-400">Comensal:</span>
                <span className="font-bold text-white">{confirmedOrder.customerName}</span>
              </div>
              {confirmedOrder.customerWhatsapp && (
                <div className="flex justify-between text-neutral-300">
                  <span className="text-neutral-400">WhatsApp:</span>
                  <span className="font-mono text-emerald-400 font-bold">{confirmedOrder.customerWhatsapp}</span>
                </div>
              )}
              {confirmedOrder.deliveryAddress && (
                <div className="flex justify-between text-neutral-300">
                  <span className="text-neutral-400">Dirección:</span>
                  <span className="font-medium text-white">{confirmedOrder.deliveryAddress}</span>
                </div>
              )}
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Detalle de Platos Confirmados ({confirmedOrder.items.length})
              </span>
              <div className="space-y-2">
                {confirmedOrder.items.map(item => (
                  <div key={item.id} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-mono text-amber-400 font-bold">S/ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {item.units && item.units.map(u => (
                      <div key={u.unitNumber} className="text-[11px] text-neutral-300 pl-2.5 border-l-2 border-amber-400/50">
                        <span className="font-mono font-bold text-amber-300">Plato #{u.unitNumber}:</span>{' '}
                        {u.selectedAddons && u.selectedAddons.length > 0 && (
                          <span className="text-neutral-200">Extras: {u.selectedAddons.map(a => a.name).join(', ')}. </span>
                        )}
                        {u.observation && <span className="italic text-neutral-400">"{u.observation}"</span>}
                        {!u.observation && (!u.selectedAddons || u.selectedAddons.length === 0) && (
                          <span className="italic text-neutral-500">Preparación estándar</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="p-4 rounded-xl bg-black border border-neutral-800 flex items-center justify-between">
              <span className="font-bold text-white text-sm">Total del Pedido:</span>
              <span className="font-black text-amber-400 font-mono text-lg">
                S/ {confirmedOrder.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-3.5 sm:p-4 pb-8 sm:pb-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-end shrink-0 z-10">
            <button
              onClick={() => {
                setConfirmedOrder(null);
                setOrderSent(false);
                onClose();
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold transition shadow-lg cursor-pointer text-center"
            >
              Entendido / Volver al Menú
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Calculate items subtotal and addon prices across all units
  const subtotal = cart.reduce((total, entry) => {
    const base = entry.item.price * entry.quantity;
    const addons = entry.units.reduce((uSum, u) => {
      const unitAddons = (u.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
      return uSum + unitAddons;
    }, 0);
    return total + base + addons;
  }, 0);

  const deliveryFee = orderType === 'DELIVERY' ? 6.00 : 0.00;
  const tax = subtotal * 0.10; // IGV / Service included/calculated
  const grandTotal = subtotal + deliveryFee;

  const handleGetGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
          setDeliveryGpsLocation(`GPS: ${coords} (https://maps.google.com/?q=${coords})`);
          setGpsDetected(true);
          setErrorMsg(null);
        },
        () => {
          setDeliveryGpsLocation('GPS: -12.1192, -77.0298 (Lima, Perú)');
          setGpsDetected(true);
        }
      );
    } else {
      setDeliveryGpsLocation('GPS: -12.1192, -77.0298 (Lima, Perú)');
      setGpsDetected(true);
    }
  };

  const handleRemoveEntry = (itemId: string) => {
    const updated = cart.filter(c => c.item.id !== itemId);
    onUpdateCart(updated);
  };

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg('No tienes platos seleccionados en tu pedido.');
      return;
    }

    if (orderType === 'DELIVERY') {
      // VALIDATE MANDATORY DELIVERY FIELDS
      const cleanWhatsapp = customerWhatsapp.trim();
      const cleanAddress = deliveryAddress.trim();

      if (!cleanWhatsapp) {
        setErrorMsg('El número de WhatsApp es OBLIGATORIO para pedidos de delivery.');
        return;
      }

      if (cleanWhatsapp.length < 8) {
        setErrorMsg('Por favor ingresa un número de WhatsApp válido (mínimo 8 dígitos).');
        return;
      }

      if (!cleanAddress) {
        setErrorMsg('La dirección de entrega es OBLIGATORIA para coordinar el despacho.');
        return;
      }
    }

    const orderNum = `#MC-${Math.floor(1000 + Math.random() * 9000)}`;
    setCreatedOrderNumber(orderNum);

    // Map Order items
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
      type: orderType,
      status: 'PENDING',
      tableNumber: orderType === 'DINE_IN' ? `Mesa ${tableNumber}` : undefined,
      customerName: dinerName.trim() || (orderType === 'DELIVERY' ? 'Cliente Delivery' : 'Comensal Salón'),
      customerWhatsapp: orderType === 'DELIVERY' ? customerWhatsapp.trim() : undefined,
      deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
      deliveryGpsLocation: orderType === 'DELIVERY' ? deliveryGpsLocation.trim() : undefined,
      deliveryReference: orderType === 'DELIVERY' ? deliveryReference.trim() : undefined,
      items: orderItems,
      subtotal,
      tax,
      deliveryFee,
      total: grandTotal,
      paymentStatus: 'PENDING',
      createdAt: 'Justo ahora',
      estimatedMinutes: orderType === 'DELIVERY' ? 35 : 20,
      waiterName: orderType === 'DINE_IN' ? 'Equipo de Mozos' : undefined,
      courierName: orderType === 'DELIVERY' ? 'Repartidor de Zona' : undefined,
    };

    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }

    setOrderSent(true);
    setConfirmedOrder(newOrder);
    onUpdateCart([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in overflow-hidden">
      <div className="relative w-full max-w-none sm:max-w-xl h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl overflow-hidden flex flex-col bg-neutral-950 border-0 sm:border border-neutral-800 text-white shadow-2xl">
        
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">
                Tu Pedido en {restaurant.name}
              </span>
              <span className="text-[10px] text-neutral-400 block font-mono">
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'} · {cart.reduce((s, c) => s + c.quantity, 0)} platos en total
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendOrder} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Channel Selector: Salón vs Delivery */}
          <div className="p-1 rounded-xl bg-neutral-900 border border-neutral-800 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setOrderType('DINE_IN');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                orderType === 'DINE_IN'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Presencial (En Salón)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderType('DELIVERY');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                orderType === 'DELIVERY'
                  ? 'bg-purple-400 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Delivery (A Domicilio)</span>
            </button>
          </div>

          {/* CHANNEL DETAILS BANNER */}
          {orderType === 'DINE_IN' ? (
            <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-sky-400" />
                  <span>Atención Presencial por Mozos</span>
                </span>
                <span className="text-[10px] text-sky-400 font-mono">
                  Comanda directa a Cocina
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-neutral-300">
                      Número de Mesa *
                    </label>
                    {initialTableNumber && (
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                        ⚡ QR Mesa
                      </span>
                    )}
                  </div>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition font-mono font-bold"
                  >
                    {restaurant.tables && restaurant.tables.length > 0 ? (
                      restaurant.tables.map((tbl) => (
                        <option key={tbl.id} value={String(tbl.number).padStart(2, '0')}>
                          {tbl.name} ({tbl.zone})
                        </option>
                      ))
                    ) : (
                      Array.from({ length: restaurant.totalTablesCount || 24 }).map((_, idx) => (
                        <option key={idx} value={String(idx + 1).padStart(2, '0')}>
                          Mesa {String(idx + 1).padStart(2, '0')}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Nombre del Comensal
                  </label>
                  <input
                    type="text"
                    value={dinerName}
                    onChange={(e) => setDinerName(e.target.value)}
                    placeholder="Ej: Carlos M."
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-purple-400" />
                  <span>Despacho Delivery Gestionado por Repartidores</span>
                </span>
                <span className="text-[10px] text-purple-300 font-mono">
                  Obligatorio WhatsApp y Dirección
                </span>
              </div>

              {/* Mandatory Field 1: WhatsApp */}
              <div>
                <label className="text-[11px] font-bold text-white block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Número de WhatsApp * (OBLIGATORIO)</span>
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                    Requerido
                  </span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerWhatsapp}
                  onChange={(e) => setCustomerWhatsapp(e.target.value)}
                  placeholder="Ej: +51 987 654 321 (para coordinar entrega)"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white font-mono placeholder:text-neutral-500 focus:border-purple-400 transition"
                />
              </div>

              {/* Mandatory Field 2: Delivery Address */}
              <div>
                <label className="text-[11px] font-bold text-white block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Dirección de Entrega * (OBLIGATORIO)</span>
                  </span>
                  <span className="text-[9px] text-purple-400 font-mono font-bold bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                    Requerido
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Ej: Av. Benavides 1420, Dpto 402, Miraflores"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white placeholder:text-neutral-500 focus:border-purple-400 transition"
                />
              </div>

              {/* Optional Field 3: GPS & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-neutral-300">
                      Ubicación GPS (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={handleGetGps}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Navigation className="w-2.5 h-2.5" />
                      <span>{gpsDetected ? 'GPS Listo' : '📍 Detectar GPS'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={deliveryGpsLocation}
                    onChange={(e) => setDeliveryGpsLocation(e.target.value)}
                    placeholder="Coordenadas o link Google Maps"
                    className="w-full px-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-[11px] font-mono text-neutral-300 focus:border-purple-400 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                    Referencia de domicilio (Opcional)
                  </label>
                  <input
                    type="text"
                    value={deliveryReference}
                    onChange={(e) => setDeliveryReference(e.target.value)}
                    placeholder="Ej: Frente al parque, reja negra"
                    className="w-full px-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-[11px] text-neutral-300 focus:border-purple-400 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DETAILED PER-UNIT DISHES BREAKDOWN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Detalle de Platos y Observaciones ({cart.length})
              </span>
              <span className="text-[10px] text-neutral-400">
                Desglose individual por plato
              </span>
            </div>

            <div className="space-y-2.5">
              {cart.map(entry => {
                const itemBase = entry.item.price * entry.quantity;
                const entryAddonsSum = entry.units.reduce((s, u) => {
                  return s + (u.selectedAddons || []).reduce((as, a) => as + a.price, 0);
                }, 0);
                const entryTotal = itemBase + entryAddonsSum;

                return (
                  <div 
                    key={entry.item.id}
                    className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5"
                  >
                    {/* Item Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={entry.item.imageUrl} 
                          alt={entry.item.name} 
                          className="w-10 h-10 rounded-lg object-cover border border-neutral-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            {entry.quantity}x {entry.item.name}
                          </h4>
                          <span className="text-[11px] text-amber-400 font-mono font-bold">
                            S/ {entryTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 items-center">
                        {onEditCartEntry && (
                          <button
                            type="button"
                            onClick={() => {
                              onEditCartEntry(entry.item);
                              onClose();
                            }}
                            className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-950/40 transition cursor-pointer"
                            title="Editar opciones de este plato"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveEntry(entry.item.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                          title="Quitar plato"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Unit breakdown */}
                    <div className="pl-2 border-l-2 border-amber-400/40 space-y-1 text-[11px]">
                      {entry.units.map(u => {
                        const unitAddons = u.selectedAddons || [];
                        const hasObs = !!u.observation?.trim();
                        return (
                          <div key={u.unitNumber} className="text-neutral-300 flex items-start gap-1.5">
                            <span className="font-bold text-amber-400 font-mono">
                              Plato #{u.unitNumber}:
                            </span>
                            <div className="flex-1">
                              {unitAddons.length > 0 && (
                                <span className="text-neutral-200">
                                  Extras: {unitAddons.map(a => `${a.name} (+S/${a.price})`).join(', ')}.
                                </span>
                              )}
                              {hasObs && (
                                <span className="text-neutral-400 italic ml-1">
                                  "{u.observation}"
                                </span>
                              )}
                              {unitAddons.length === 0 && !hasObs && (
                                <span className="text-neutral-500 italic">
                                  Preparación clásica estándar
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="p-8 text-center rounded-xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 text-xs">
                  Aún no has agregado platos a tu pedido.
                </div>
              )}
            </div>
          </div>

          {/* ERROR ALERT IF VALIDATION FAILS */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SUMMARY TOTALS */}
          <div className="p-4 rounded-xl bg-black border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal Platos y Extras</span>
              <span className="font-mono text-white">S/ {subtotal.toFixed(2)}</span>
            </div>

            {orderType === 'DELIVERY' && (
              <div className="flex justify-between text-purple-300">
                <span>Costo de Envío / Reparto</span>
                <span className="font-mono font-bold">S/ {deliveryFee.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-400 text-[11px]">
              <span>IGV y Servicios (Incluido)</span>
              <span className="font-mono">S/ {tax.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
              <span className="font-bold text-white text-sm">Total a Pagar</span>
              <span className="font-black text-amber-400 font-mono text-base">
                S/ {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="sticky bottom-0 bg-neutral-950/95 backdrop-blur-md pt-3 pb-8 sm:pb-2 border-t border-neutral-800 -mx-4 -mb-4 px-4 sm:static sm:bg-transparent sm:border-0 sm:mx-0 sm:mb-0 sm:px-0 z-10 shrink-0">
            <button
              type="submit"
              disabled={orderSent || cart.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                orderSent 
                  ? 'bg-emerald-500 text-black' 
                  : orderType === 'DELIVERY'
                    ? 'bg-purple-400 hover:bg-purple-300 text-black'
                    : 'bg-amber-400 hover:bg-amber-300 text-black'
              }`}
            >
              {orderSent ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Pedido {createdOrderNumber} Registrado con Éxito!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {orderType === 'DELIVERY'
                      ? `Confirmar Pedido Delivery · S/ ${grandTotal.toFixed(2)}`
                      : `Confirmar Pedido · S/ ${grandTotal.toFixed(2)}`}
                  </span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
