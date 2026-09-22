import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Navigation, 
  Package, 
  MessageCircle, 
  ExternalLink,
  Compass,
  AlertCircle
} from 'lucide-react';
import { Restaurant, Order, User, OrderStatus } from '../types';

interface DeliveryViewProps {
  currentUser: User;
  restaurants: Restaurant[];
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  currentUser,
  restaurants,
  orders,
  onUpdateOrderStatus,
}) => {
  const courierRestaurants = currentUser.restaurantIds.includes('all')
    ? restaurants
    : restaurants.filter(r => currentUser.restaurantIds.includes(r.id));

  const deliveryOrders = orders.filter(o => {
    const isDelivery = o.type === 'DELIVERY';
    const isAssignedToCourier = o.courierId === currentUser.id;
    const isFromCourierRest = courierRestaurants.some(r => r.id === o.restaurantId);
    return isDelivery && (isAssignedToCourier || isFromCourierRest);
  });

  const [filterTab, setFilterTab] = useState<'active' | 'completed'>('active');

  const activeOrders = deliveryOrders.filter(o => o.status !== 'DELIVERED');
  const completedOrders = deliveryOrders.filter(o => o.status === 'DELIVERED');
  const displayedOrders = filterTab === 'active' ? activeOrders : completedOrders;

  const totalCashDelivered = completedOrders.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 pb-28">
      
      {/* Top Courier Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-neutral-900 to-black border border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Despacho y Reparto Motorizado</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                Rol: Repartidor
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Conectado como <strong className="text-neutral-200">{currentUser.name}</strong> (DNI: {currentUser.dni}). Acceso exclusivo a pedidos para despacho a domicilio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block">
              Entregas Realizadas Hoy
            </span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {completedOrders.length} despachos (S/ {totalCashDelivered.toFixed(2)})
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setFilterTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            filterTab === 'active'
              ? 'bg-purple-400 text-black shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Pedidos Activos en Reparto ({activeOrders.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            filterTab === 'completed'
              ? 'bg-white text-black shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Historial de Entregas ({completedOrders.length})</span>
        </button>
      </div>

      {/* Delivery Cards Grid */}
      {displayedOrders.length === 0 ? (
        <div className="p-12 rounded-2xl border border-neutral-800 bg-neutral-900/20 text-center space-y-3">
          <Bike className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">
            {filterTab === 'active' ? 'No tienes pedidos pendientes de reparto' : 'Aún no registras entregas el día de hoy'}
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Cuando un cliente realice un pedido desde la carta digital con modalidad delivery, aparecerá aquí con los datos de contacto y entrega.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedOrders.map(order => {
            const rest = restaurants.find(r => r.id === order.restaurantId);
            const isPending = order.status === 'PENDING';
            const isInKitchen = order.status === 'IN_KITCHEN';
            const isOnTheWay = order.status === 'ON_THE_WAY';
            const isDelivered = order.status === 'DELIVERED';

            const phone = order.customerWhatsapp || order.customerPhone || '+51 987 654 321';
            const cleanPhone = phone.replace(/[^0-9]/g, '');

            return (
              <div
                key={order.id}
                className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4 hover:border-neutral-700 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top line: Order # + Rest + Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-white">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs font-bold text-purple-300">
                          {rest?.name || 'Local'}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Pedido emitido {order.createdAt}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isOnTheWay ? 'bg-amber-400 text-black animate-pulse' :
                      isDelivered ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    }`}>
                      {isOnTheWay ? 'En Ruta (Motorizado)' :
                       isDelivered ? 'Entregado' :
                       isInKitchen ? 'Preparando en Cocina' : 'Por Despachar'}
                    </span>
                  </div>

                  {/* Customer and Address Information */}
                  <div className="p-3.5 rounded-xl bg-black border border-neutral-800 space-y-2.5 text-xs">
                    
                    {/* Address (Mandatory) */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">
                          Dirección de Entrega:
                        </span>
                        <span className="text-white font-bold text-xs">
                          {order.deliveryAddress || 'Dirección no especificada'}
                        </span>
                        {order.deliveryReference && (
                          <span className="text-[11px] text-neutral-400 block mt-0.5">
                            Ref: {order.deliveryReference}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* GPS Location (Optional) */}
                    {order.deliveryGpsLocation && (
                      <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
                        <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="text-[11px] text-neutral-300 font-mono flex-1 truncate">
                          {order.deliveryGpsLocation}
                        </span>
                        <a
                          href={order.deliveryGpsLocation.includes('http') 
                            ? order.deliveryGpsLocation 
                            : `https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-sky-400 hover:underline font-bold flex items-center gap-1 shrink-0"
                        >
                          <span>Ver Mapa</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* WhatsApp & Customer Name (Mandatory) */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${order.customerName}, soy tu repartidor de ${rest?.name || 'Micarta'}. Ya tengo tu pedido ${order.orderNumber} en camino.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition flex items-center gap-1.5 font-mono text-[11px] font-bold"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp: {phone}</span>
                        </a>
                      </div>

                      <span className="text-neutral-300 text-[11px] font-medium">
                        Cliente: <strong className="text-white">{order.customerName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Packaged Items with Individual Unit Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider font-bold">
                      Detalle de Platos a Entregar:
                    </span>
                    <div className="divide-y divide-neutral-800/60 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
                      {order.items.map(item => (
                        <div key={item.id} className="py-1.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-200 font-medium">
                              <strong className="text-amber-400 font-mono mr-1.5">{item.quantity}x</strong>
                              {item.name}
                            </span>
                            <span className="font-mono text-white text-xs font-bold">
                              S/ {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          {/* Per-unit observations and addons */}
                          {item.units && item.units.length > 0 ? (
                            <div className="pl-3 border-l border-neutral-700 space-y-0.5 text-[10px]">
                              {item.units.map(u => {
                                const unitAddons = u.selectedAddons || [];
                                const hasObs = !!u.observation?.trim();
                                return (
                                  <div key={u.unitNumber} className="text-neutral-400">
                                    <span className="text-amber-300 font-mono">U{u.unitNumber}:</span>{' '}
                                    {unitAddons.length > 0 && (
                                      <span className="text-neutral-300 font-medium">
                                        + {unitAddons.map(a => a.name).join(', ')}.{' '}
                                      </span>
                                    )}
                                    {hasObs && <span className="italic text-neutral-300">"{u.observation}"</span>}
                                    {unitAddons.length === 0 && !hasObs && <span>Estándar</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : item.notes ? (
                            <p className="text-[10px] text-neutral-400 pl-3 italic border-l border-neutral-800">
                              {item.notes}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="p-3 rounded-xl bg-black border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">
                        Monto Total con Delivery
                      </span>
                      <span className={`text-xs font-bold ${order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {order.paymentStatus === 'PAID' ? '✓ Pagado Online' : '⚠️ Cobrar en Efectivo / Yape'}
                      </span>
                    </div>
                    <span className="text-base font-mono font-black text-amber-400">
                      S/ {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-2">
                  {(isPending || isInKitchen) && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'ON_THE_WAY')}
                      className="w-full py-2.5 rounded-xl bg-purple-400 text-black font-bold text-xs hover:bg-purple-300 transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Tomar Pedido y Salir en Ruta</span>
                    </button>
                  )}

                  {isOnTheWay && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'DELIVERED')}
                      className="w-full py-2.5 rounded-xl bg-emerald-400 text-black font-bold text-xs hover:bg-emerald-300 transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>Confirmar Entrega en Domicilio</span>
                    </button>
                  )}

                  {isDelivered && (
                    <div className="text-center py-2 text-[11px] font-mono text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-950/30 rounded-xl border border-emerald-900/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Entrega Completada y Liquidada</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
