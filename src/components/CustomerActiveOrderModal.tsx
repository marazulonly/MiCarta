import React from 'react';
import { Order, OrderStatus } from '../types';
import { Eye, Clock, CheckCircle2, ChefHat, Bell, X, MapPin, Phone, ShoppingBag, AlertCircle } from 'lucide-react';

interface CustomerActiveOrderModalProps {
  order: Order;
  onClose: () => void;
  restaurantName?: string;
}

export const CustomerActiveOrderModal: React.FC<CustomerActiveOrderModalProps> = ({
  order,
  onClose,
  restaurantName = 'Restaurante',
}) => {
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pendiente - Recibido en Cocina',
          subLabel: 'Tu comanda ha sido enviada y está en cola de atención',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: Clock,
          pulse: true,
        };
      case 'IN_KITCHEN':
        return {
          label: 'En Preparación en Cocina',
          subLabel: 'El equipo de cocina está preparando tus platos',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: ChefHat,
          pulse: true,
        };
      case 'ON_THE_WAY':
        return {
          label: 'En Camino / En Reparto',
          subLabel: 'El motorizado está en camino a tu dirección',
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          icon: ShoppingBag,
          pulse: true,
        };
      case 'READY':
        return {
          label: '¡Listo para Servir / Entregar!',
          subLabel: 'Tu pedido está preparado y saliendo a mesa o despacho',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: Bell,
          pulse: true,
        };
      case 'DELIVERED':
        return {
          label: 'Servido / Entregado',
          subLabel: '¡Buen provecho! Tu pedido ha sido completado',
          color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: CheckCircle2,
          pulse: false,
        };
      case 'CANCELLED':
        return {
          label: 'Pedido Cancelado',
          subLabel: 'Esta orden fue anulada por el establecimiento',
          color: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: AlertCircle,
          pulse: false,
        };
      default:
        return {
          label: 'Procesando',
          subLabel: 'Enviando comanda',
          color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: Clock,
          pulse: false,
        };
    }
  };

  const statusConfig = getStatusBadge(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight">Estado de Tu Pedido</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-amber-300 border border-neutral-700 font-bold">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">{restaurantName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Tracker Box */}
        <div className="p-4 bg-neutral-900 border-b border-neutral-800 shrink-0">
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${statusConfig.color}`}>
            <div className={`p-2 rounded-xl bg-neutral-950/60 shrink-0 ${statusConfig.pulse ? 'animate-bounce' : ''}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono tracking-wide uppercase">{statusConfig.label}</span>
                {statusConfig.pulse && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5 leading-snug">{statusConfig.subLabel}</p>
            </div>
          </div>

          {/* Details Row */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Modalidad</span>
              <span className="font-bold text-white text-xs">
                {order.type === 'DINE_IN' ? `Atención Presencial (${order.tableNumber || 'Mesa'})` : 'Delivery a Domicilio'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Tiempo Estimado</span>
              <span className="font-bold text-amber-300 text-xs">
                ⏱ ~{order.estimatedMinutes || 20} minutos
              </span>
            </div>
          </div>
        </div>

        {/* Order Items Breakdown */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
            <span>Detalle de Platos</span>
            <span className="text-white font-normal">({order.items.length} ítems)</span>
          </h4>

          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={item.id || idx} className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/60 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-400/10 text-amber-400 text-xs font-black font-mono">
                      {item.quantity}x
                    </span>
                    <span className="text-xs font-bold text-white">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-neutral-300 shrink-0">
                    S/ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                {/* Units / Observations if present */}
                {Array.isArray(item.units) && item.units.length > 0 && (
                  <div className="pl-7 space-y-1 pt-1 border-t border-neutral-800/40">
                    {item.units.map((u, uIdx) => (
                      <div key={uIdx} className="text-[11px] text-neutral-400 flex items-center justify-between">
                        <span>• Unidad {u.unitNumber}: {u.observation || 'Sin especificaciones'}</span>
                        {u.selectedAddons && u.selectedAddons.length > 0 && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            +{u.selectedAddons.map(a => a.name).join(', ')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Delivery Details if applicable */}
          {order.type === 'DELIVERY' && (order.deliveryAddress || order.customerWhatsapp) && (
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-mono text-neutral-500 font-bold block">Datos de Entrega</span>
              {order.customerName && <div className="text-white font-medium">Cliente: {order.customerName}</div>}
              {order.customerWhatsapp && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp: {order.customerWhatsapp}</span>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="flex items-start gap-1.5 text-neutral-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Dirección: {order.deliveryAddress}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Summary & Total */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase block">Total del Pedido</span>
            <span className="text-base font-extrabold text-amber-300 font-mono">
              S/ {order.total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs shadow-lg transition cursor-pointer active:scale-95"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
