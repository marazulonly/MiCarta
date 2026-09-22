import React, { useState } from 'react';
import { 
  UserCheck, 
  QrCode, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  Store, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  MapPin,
  Utensils
} from 'lucide-react';
import { Restaurant, Order, User } from '../types';

interface CustomerPortalViewProps {
  currentUser: User;
  restaurants: Restaurant[];
  orders: Order[];
  onOpenCustomerPreview: (restaurant: Restaurant) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  currentUser,
  restaurants,
  orders,
  onOpenCustomerPreview,
}) => {
  const [selectedRestForQr, setSelectedRestForQr] = useState<Restaurant | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Orders made by this customer
  const myOrders = orders.filter(o => 
    o.customerId === currentUser.id || o.customerDni === currentUser.dni
  );

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/carta/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="space-y-8 pb-28">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-black border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-white/20 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">¡Hola, {currentUser.name}!</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-black font-bold">
                Cliente
              </span>
            </div>
            <div className="text-xs text-neutral-400 font-mono mt-0.5">
              DNI: <strong className="text-neutral-200">{currentUser.dni}</strong> • Acceso a cartas por QR/Link y seguimiento de pedidos
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-right">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block">Mis Pedidos</span>
            <span className="text-base font-mono font-black text-white">{myOrders.length} registrados</span>
          </div>
        </div>
      </div>

      {/* Section 1: Access to Digital Menus via Link or QR Code */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <QrCode className="w-5 h-5 text-white" />
            <span>Acceso a Cartas Digitales (Link & Código QR)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Ingresa a la carta de cualquiera de nuestros restaurantes directamente mediante enlace web o escaneando el código QR de mesa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {restaurants.map(rest => {
            const fullUrl = `https://carta.online/r/${rest.slug}`;
            const isCopied = copiedSlug === rest.slug;

            return (
              <div
                key={rest.id}
                className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {rest.cuisine}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>

                  <h3 className="text-sm font-black text-white">{rest.name}</h3>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                    {rest.tagline}
                  </p>

                  {/* Direct Link box */}
                  <div className="mt-3 p-2.5 rounded-xl bg-black/60 border border-neutral-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-neutral-300 truncate max-w-[140px]">
                      /r/{rest.slug}
                    </span>
                    <button
                      onClick={() => handleCopyLink(rest.slug)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                      title="Copiar Enlace Directo"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setSelectedRestForQr(rest)}
                    className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5 text-white" />
                    <span>Ver Código QR de Mesa</span>
                  </button>

                  <button
                    onClick={() => onOpenCustomerPreview(rest)}
                    className="w-full py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Abrir Carta Digital</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: My Orders (Live Tracking) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-white" />
            <span>Mis Pedidos Realizados (Seguimiento en Vivo)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Consulta el estado de preparación y despacho de tus órdenes en tiempo real.
          </p>
        </div>

        {myOrders.length === 0 ? (
          <div className="p-10 rounded-2xl border border-neutral-800 bg-neutral-900/20 text-center space-y-3">
            <Utensils className="w-10 h-10 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No tienes pedidos activos</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Abre la carta digital de cualquiera de los restaurantes para realizar tu primer pedido en salón o delivery.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map(order => {
              const rest = restaurants.find(r => r.id === order.restaurantId);
              
              const stepIndex = 
                order.status === 'PENDING' ? 1 :
                order.status === 'IN_KITCHEN' ? 2 :
                (order.status === 'READY' || order.status === 'ON_THE_WAY') ? 3 :
                4; // DELIVERED

              return (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4 hover:border-neutral-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-white">
                          Orden #{order.orderNumber}
                        </span>
                        <span className="text-xs font-bold text-neutral-300">
                          • {rest?.name || 'Restaurante'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          {order.type === 'DELIVERY' ? '🛵 A Domicilio' : '🍽️ En Salón'}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono mt-0.5 block">
                        Emitido: {order.createdAt} {order.tableNumber ? `• ${order.tableNumber}` : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-white">
                        ${order.total.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-mono block text-neutral-400">
                        {order.paymentStatus === 'PAID' ? '✓ Pagado' : 'Pendiente de pago'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Steps Tracker */}
                  <div className="py-2">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      
                      {/* Step 1 */}
                      <div className={`p-2 rounded-xl border transition ${
                        stepIndex >= 1 ? 'bg-white text-black border-white font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                      }`}>
                        <span className="text-[10px] block font-mono">Paso 1</span>
                        <span className="text-[11px] block truncate">Recibido</span>
                      </div>

                      {/* Step 2 */}
                      <div className={`p-2 rounded-xl border transition ${
                        stepIndex >= 2 ? 'bg-sky-400 text-black border-sky-400 font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                      }`}>
                        <span className="text-[10px] block font-mono">Paso 2</span>
                        <span className="text-[11px] block truncate">En Cocina</span>
                      </div>

                      {/* Step 3 */}
                      <div className={`p-2 rounded-xl border transition ${
                        stepIndex >= 3 ? 'bg-purple-400 text-black border-purple-400 font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                      }`}>
                        <span className="text-[10px] block font-mono">Paso 3</span>
                        <span className="text-[11px] block truncate">
                          {order.type === 'DELIVERY' ? 'En Camino' : '¡Listo!'}
                        </span>
                      </div>

                      {/* Step 4 */}
                      <div className={`p-2 rounded-xl border transition ${
                        stepIndex >= 4 ? 'bg-emerald-400 text-black border-emerald-400 font-bold' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                      }`}>
                        <span className="text-[10px] block font-mono">Paso 4</span>
                        <span className="text-[11px] block truncate">Entregado</span>
                      </div>

                    </div>
                  </div>

                  {/* Items Ordered */}
                  <div className="bg-black/50 p-3 rounded-xl border border-neutral-800/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-neutral-400 block tracking-wider">
                      Platos ordenados:
                    </span>
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-neutral-200">
                          <strong className="text-white font-mono mr-1">{item.quantity}x</strong>
                          {item.name}
                        </span>
                        <span className="font-mono text-neutral-400 text-[11px]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedRestForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-sm rounded-2xl p-6 text-center space-y-4 relative shadow-2xl">
            <button
              onClick={() => setSelectedRestForQr(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Código QR de Mesa
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {selectedRestForQr.name}
              </p>
            </div>

            {/* Generated QR Mock Canvas */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mx-auto">
              <div className="w-48 h-48 bg-neutral-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 p-3 relative overflow-hidden">
                {/* Visual QR Code Pattern */}
                <div className="grid grid-cols-6 gap-1 w-full h-full p-1">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${
                        (i % 2 === 0 || i % 7 === 0 || i === 0 || i === 5 || i === 30 || i === 35)
                          ? 'bg-black'
                          : 'bg-neutral-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="px-2 py-1 bg-black text-white text-[9px] font-mono font-bold rounded shadow">
                    {selectedRestForQr.slug}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              Apunta la cámara de tu smartphone para abrir la carta digital interactiva al instante.
            </p>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setSelectedRestForQr(null)}
                className="flex-1 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-700"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const rest = selectedRestForQr;
                  setSelectedRestForQr(null);
                  onOpenCustomerPreview(rest);
                }}
                className="flex-1 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold"
              >
                Abrir Carta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
