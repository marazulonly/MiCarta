import React, { useState } from 'react';
import { 
  ReceiptText, 
  Clock, 
  ChevronRight, 
  Check, 
  Plus
} from 'lucide-react';
import { Order, OrderStatus, Restaurant, OrderType } from '../types';

interface OrdersViewProps {
  orders: Order[];
  restaurants: Restaurant[];
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onSimulateNewOrder: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  restaurants,
  onUpdateOrderStatus,
  onSimulateNewOrder,
}) => {
  const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    const matchRest = restaurantFilter === 'all' || order.restaurantId === restaurantFilter;
    const matchType = typeFilter === 'all' || order.type === typeFilter;
    return matchRest && matchType;
  });

  const pendingOrders = filteredOrders.filter(o => o.status === 'PENDING');
  const kitchenOrders = filteredOrders.filter(o => o.status === 'IN_KITCHEN');
  const readyOrders = filteredOrders.filter(o => o.status === 'READY' || o.status === 'ON_THE_WAY');
  const completedOrders = filteredOrders.filter(o => o.status === 'DELIVERED');

  const getNextStatus = (current: OrderStatus, type: OrderType): OrderStatus => {
    switch (current) {
      case 'PENDING': return 'IN_KITCHEN';
      case 'IN_KITCHEN': return 'READY';
      case 'READY': return type === 'DELIVERY' ? 'ON_THE_WAY' : 'DELIVERED';
      case 'ON_THE_WAY': return 'DELIVERED';
      default: return 'DELIVERED';
    }
  };

  const getNextActionLabel = (current: OrderStatus, type: OrderType): string => {
    switch (current) {
      case 'PENDING': return 'A Cocina';
      case 'IN_KITCHEN': return 'Marcar Listo';
      case 'READY': return type === 'DELIVERY' ? 'Despachar' : 'Entregar';
      case 'ON_THE_WAY': return 'Confirmar';
      default: return 'Cerrado';
    }
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Comandera y Cocina (KDS)
          </h1>
          <p className="text-xs text-neutral-600 mt-1 font-medium">
            Control de flujo operativo en tiempo real para salón y delivery.
          </p>
        </div>

        <button
          onClick={onSimulateNewOrder}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E1F24] text-white hover:bg-black font-bold text-xs shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Simular Comanda</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Restaurant selector */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-600 font-medium">Local:</span>
          <select
            value={restaurantFilter}
            onChange={(e) => setRestaurantFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs font-medium text-neutral-900 shadow-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
          >
            <option value="all">Todos los Restaurantes</option>
            {(restaurants || []).filter(Boolean).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-neutral-200 shadow-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'DINE_IN', label: 'Salón' },
            { id: 'DELIVERY', label: 'Delivery' },
            { id: 'TAKEAWAY', label: 'Para Llevar' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer text-xs font-semibold ${
                typeFilter === t.id
                  ? 'bg-[#1E1F24] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

      </div>

      {/* Minimalist 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 items-start">
        
        {/* Column 1: PENDING */}
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-200/40 p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-300/70">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              1. Recibido
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-300 text-neutral-700 shadow-2xs">
              {pendingOrders.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingOrders.map(order => renderOrderCard(order))}
            {pendingOrders.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6 font-medium">Sin pedidos pendientes.</p>
            )}
          </div>
        </div>

        {/* Column 2: IN_KITCHEN */}
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-200/40 p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-300/70">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              2. En Cocina
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-300 text-neutral-700 shadow-2xs">
              {kitchenOrders.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {kitchenOrders.map(order => renderOrderCard(order))}
            {kitchenOrders.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6 font-medium">Cocina al día.</p>
            )}
          </div>
        </div>

        {/* Column 3: READY / ON_THE_WAY */}
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-200/40 p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-300/70">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              3. Listo / Despacho
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-300 text-neutral-700 shadow-2xs">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {readyOrders.map(order => renderOrderCard(order))}
            {readyOrders.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6 font-medium">Sin comandas listas.</p>
            )}
          </div>
        </div>

        {/* Column 4: DELIVERED */}
        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-200/40 p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-300/70">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              4. Entregado
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-300 text-neutral-700 shadow-2xs">
              {completedOrders.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {completedOrders.map(order => renderOrderCard(order, true))}
            {completedOrders.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6 font-medium">Sin comandas cerradas.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );

  function renderOrderCard(order: Order, isCompleted = false) {
    const rest = restaurants.find(r => r.id === order.restaurantId);
    const nextStatus = getNextStatus(order.status, order.type);
    const actionLabel = getNextActionLabel(order.status, order.type);

    return (
      <div 
        key={order.id}
        className="p-3.5 rounded-xl bg-white border border-neutral-200 shadow-xs hover:border-neutral-300 transition-all space-y-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono text-neutral-500 block uppercase font-medium">
              {rest?.name}
            </span>
            <span className="text-xs font-bold text-neutral-900 font-mono">
              {order.orderNumber}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
            {order.type === 'DINE_IN' ? (order.tableNumber || 'Salón') : order.type}
          </span>
        </div>

        <div className="text-xs text-neutral-600">
          <span className="font-bold text-neutral-900">{order.customerName}</span>
          {order.deliveryAddress && (
            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
              {order.deliveryAddress}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-neutral-100 space-y-1">
          {(order.items || []).filter(Boolean).map(i => (
            <div key={i.id} className="text-[11px] flex justify-between text-neutral-700">
              <span className="font-medium">{i.quantity}x {i.name}</span>
              <span className="font-mono text-neutral-500 font-semibold">S/ {((i.price || 0) * (i.quantity || 1)).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-neutral-950">
            S/ {(order.total || 0).toFixed(2)}
          </span>

          {!isCompleted ? (
            <button
              onClick={() => onUpdateOrderStatus(order.id, nextStatus)}
              className="px-3 py-1.5 rounded-lg bg-[#1E1F24] text-white font-bold text-xs hover:bg-black transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-[10px] font-mono font-medium text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" /> Cerrado
            </span>
          )}
        </div>

      </div>
    );
  }
};
