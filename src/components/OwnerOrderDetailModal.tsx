import React from 'react';
import { Order, OrderStatus } from '../types';
import { 
  X, 
  Receipt, 
  Clock, 
  ChefHat, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  MessageSquare,
  DollarSign
} from 'lucide-react';

interface OwnerOrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => void;
  restaurantName?: string;
}

export const OwnerOrderDetailModal: React.FC<OwnerOrderDetailModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  restaurantName,
}) => {
  if (!order) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'PENDIENTE',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: Clock,
        };
      case 'IN_KITCHEN':
        return {
          label: 'EN COCINA',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: ChefHat,
        };
      case 'READY':
        return {
          label: 'LISTO / DESPACHO',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: Bell,
        };
      case 'ON_THE_WAY':
        return {
          label: 'EN CAMINO',
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          icon: Clock,
        };
      case 'DELIVERED':
        return {
          label: 'SERVIDO / COBRADO',
          color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: CheckCircle2,
        };
      case 'CANCELLED':
        return {
          label: 'CANCELADO',
          color: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: AlertCircle,
        };
      default:
        return {
          label: status,
          color: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          icon: Clock,
        };
    }
  };

  const statusInfo = getStatusBadge(order.status);
  const StatusIcon = statusInfo.icon;

  const handleWhatsAppContact = () => {
    if (!order.customerWhatsapp) return;
    const cleanNumber = order.customerWhatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${order.customerName || 'cliente'}, te saludamos de ${restaurantName || 'nuestro restaurante'} respecto a tu comanda ${order.orderNumber}.`);
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight">Detalle de Comanda</h3>
                <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">{restaurantName || 'Sede en línea'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Badge */}
        <div className="p-4 bg-neutral-900 border-b border-neutral-800 shrink-0">
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${statusInfo.color}`}>
            <div className="flex items-center gap-2.5">
              <StatusIcon className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">Estado Actual</span>
                <span className="text-xs font-black tracking-wide font-mono">{statusInfo.label}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950/60 px-2.5 py-1 rounded-lg border border-neutral-800">
              {order.createdAt || 'Hace unos minutos'}
            </span>
          </div>

          {/* Quick info row */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Canal / Mesa</span>
              <span className="font-bold text-white text-xs">
                {order.type === 'DINE_IN' ? `Salón (${order.tableNumber || 'Mesa'})` : 'Delivery'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
              <span className="text-[10px] text-neutral-500 uppercase font-mono block">Cliente / Mozo</span>
              <span className="font-bold text-white text-xs truncate block">
                {order.customerName || order.waiterName || 'Comensal'}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery / Customer Details if present */}
        {order.type === 'DELIVERY' && (order.deliveryAddress || order.customerWhatsapp) && (
          <div className="p-4 bg-neutral-950/60 border-b border-neutral-800 space-y-2 text-xs shrink-0">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">Datos de Despacho</span>
            {order.deliveryAddress && (
              <div className="flex items-start gap-2 text-neutral-200">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Dirección:</strong> {order.deliveryAddress}</span>
              </div>
            )}
            {order.customerWhatsapp && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 text-emerald-400 font-mono">
                  <Phone className="w-4 h-4" />
                  <span>{order.customerWhatsapp}</span>
                </div>
                <button
                  onClick={handleWhatsAppContact}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Escribir por WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dishes Breakdown */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
            <span>Platos Solicitados</span>
            <span className="text-white font-normal">({order.items.length} ítems)</span>
          </h4>

          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={item.id || idx} className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-neutral-950 text-xs font-black font-mono">
                      {item.quantity}x
                    </span>
                    <span className="text-xs font-bold text-white">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-amber-300 shrink-0">
                    S/ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                {/* Units & Observations */}
                {Array.isArray(item.units) && item.units.length > 0 && (
                  <div className="pl-7 space-y-1 pt-1.5 border-t border-neutral-800/60">
                    {item.units.map((u, uIdx) => (
                      <div key={uIdx} className="text-[11px] text-neutral-400 flex items-center justify-between">
                        <span>• Unidad {u.unitNumber}: <strong className="text-neutral-200">{u.observation || 'Sin cambios'}</strong></span>
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
        </div>

        {/* Change Status Action Control Bar */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 space-y-3 shrink-0">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="text-xs font-mono text-neutral-400 uppercase font-bold">Total a Cobrar</span>
            <span className="text-lg font-black text-amber-300 font-mono">
              S/ {order.total.toFixed(2)}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Cambiar Estado de Comanda en Tiempo Real</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onUpdateStatus(order.id, 'PENDING')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                  order.status === 'PENDING'
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                ⏳ Pendiente
              </button>

              <button
                onClick={() => onUpdateStatus(order.id, 'IN_KITCHEN')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                  order.status === 'IN_KITCHEN'
                    ? 'bg-blue-500 text-white border-blue-400 shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                👨‍🍳 En Cocina
              </button>

              <button
                onClick={() => onUpdateStatus(order.id, 'READY')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                  order.status === 'READY'
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                🛎️ Listo
              </button>

              <button
                onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                  order.status === 'DELIVERED'
                    ? 'bg-neutral-700 text-white border-neutral-600 shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                ✅ Servido/Cobrado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
