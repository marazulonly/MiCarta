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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Comandera y Cocina (KDS)
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Control de flujo operativo en tiempo real para salón y delivery.
          </p>
        </div>

        <button
          onClick={onSimulateNewOrder}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Simular Comanda</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Restaurant selector */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">Local:</span>
          <select
            value={restaurantFilter}
            onChange={(e) => setRestaurantFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-white cursor-pointer"
          >
            <option value="all">Todos los Restaurantes</option>
            {(restaurants || []).filter(Boolean).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'DINE_IN', label: 'Salón' },
            { id: 'DELIVERY', label: 'Delivery' },
            { id: 'TAKEAWAY', label: 'Para Llevar' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                typeFilter === t.id
                  ? 'bg-white text-black font-bold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

      </div>

      {/* Minimalist 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
        
        {/* Column 1: PENDING */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              1. Recibido
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              {pendingOrders.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingOrders.map(order => renderOrderCard(order))}
            {pendingOrders.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6">Sin pedidos pendientes.</p>
            )}
          </div>
        </div>

        {/* Column 2: IN_KITCHEN */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              2. En Cocina
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              {kitchenOrders.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {kitchenOrders.map(order => renderOrderCard(order))}
            {kitchenOrders.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6">Cocina al día.</p>
            )}
          </div>
        </div>

        {/* Column 3: READY / ON_THE_WAY */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              3. Listo / Despacho
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {readyOrders.map(order => renderOrderCard(order))}
            {readyOrders.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6">Sin comandas listas.</p>
            )}
          </div>
        </div>

        {/* Column 4: DELIVERED */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              4. Entregado
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              {completedOrders.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {completedOrders.map(order => renderOrderCard(order, true))}
            {completedOrders.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6">Sin comandas cerradas.</p>
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
        className="p-3 rounded-lg bg-black border border-neutral-800 space-y-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 block uppercase">
              {rest?.name}
            </span>
            <span className="text-xs font-bold text-white font-mono">
              {order.orderNumber}
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-300">
            {order.type === 'DINE_IN' ? (order.tableNumber || 'Salón') : order.type}
          </span>
        </div>

        <div className="text-xs text-neutral-400">
          <span className="text-white">{order.customerName}</span>
          {order.deliveryAddress && (
            <p className="text-[10px] text-neutral-400 truncate mt-0.5">
              {order.deliveryAddress}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-neutral-900 space-y-1">
          {order.items.map(i => (
            <div key={i.id} className="text-[11px] flex justify-between text-neutral-300">
              <span>{i.quantity}x {i.name}</span>
              <span className="font-mono text-neutral-400">${(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-white">
            ${order.total.toFixed(2)}
          </span>

          {!isCompleted ? (
            <button
              onClick={() => onUpdateOrderStatus(order.id, nextStatus)}
              className="px-3 py-1 rounded bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer flex items-center gap-1"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
              <Check className="w-3 h-3 text-white" /> Cerrado
            </span>
          )}
        </div>

      </div>
    );
  }
};
