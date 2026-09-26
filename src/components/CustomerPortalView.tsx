import React, { useState, useRef } from 'react';
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
  Utensils,
  Smartphone,
  Download,
  Printer,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Restaurant, Order, User } from '../types';

interface CustomerPortalViewProps {
  currentUser: User;
  restaurants: Restaurant[];
  orders: Order[];
  onOpenCustomerPreview: (restaurant: Restaurant, mode?: 'DINE_IN' | 'DELIVERY', tableNumber?: string) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  currentUser,
  restaurants,
  orders,
  onOpenCustomerPreview,
}) => {
  const [selectedRestForQr, setSelectedRestForQr] = useState<Restaurant | null>(null);
  const [selectedTableNum, setSelectedTableNum] = useState<string>('01');
  const [selectedChannel, setSelectedChannel] = useState<'DINE_IN' | 'DELIVERY'>('DINE_IN');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Orders made by this customer
  const myOrders = (orders || []).filter(o => 
    o && ((currentUser?.id && o.customerId === currentUser.id) || (currentUser?.dni && o.customerDni === currentUser.dni))
  );

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://micarta-bay.vercel.app';

  const handleCopyLink = (slug: string) => {
    const url = `${origin}/?r=${slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const currentQrUrl = selectedRestForQr 
    ? `${origin}/?r=${selectedRestForQr.slug}&mesa=${selectedTableNum}&mode=${selectedChannel}`
    : '';

  const handleCopyQrUrl = () => {
    if (!currentQrUrl) return;
    navigator.clipboard?.writeText(currentQrUrl);
    setCopiedSlug('qr_modal');
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrRef.current || !selectedRestForQr) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 600;
    canvas.height = 600;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 500, 500);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_${selectedRestForQr.slug}_Mesa_${selectedTableNum}.png`;
        downloadLink.href = pngUrl;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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
            <span>Acceso a Cartas Digitales (Link & Códigos QR Reales)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Ingresa a la carta de cualquiera de nuestros restaurantes directamente mediante enlace web o escaneando el código QR de mesa real con tu smartphone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {restaurants.map(rest => {
            const isCopied = copiedSlug === rest.slug;
            const brandCardBg = rest.branding?.cardBgColor || rest.branding?.darkBgColor || '#12111A';
            const brandTextColor = rest.branding?.textColor || '#FFFFFF';
            const brandPrimaryColor = rest.branding?.buttonColor || rest.branding?.primaryColor || '#D4AF37';
            const brandButtonText = rest.branding?.buttonTextColor || '#000000';

            return (
              <div
                key={rest.id}
                style={{
                  backgroundColor: brandCardBg,
                  borderColor: `${brandPrimaryColor}60`,
                  color: brandTextColor
                }}
                className="p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-80" style={{ color: brandTextColor }}>
                      {rest.cuisine || rest.cuisineType}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brandPrimaryColor }} />
                  </div>

                  <h3 className="text-base font-black" style={{ color: brandTextColor }}>{rest.name}</h3>
                  <p className="text-xs opacity-80 line-clamp-2 mt-1">
                    {rest.tagline}
                  </p>

                  {/* Direct Link box */}
                  <div 
                    className="mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <span className="font-mono text-[11px] truncate max-w-[140px]" style={{ color: brandTextColor }}>
                      /?r={rest.slug}
                    </span>
                    <button
                      onClick={() => handleCopyLink(rest.slug)}
                      className="p-1 rounded hover:bg-white/10 transition cursor-pointer"
                      title="Copiar Enlace Directo para probar"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" style={{ color: brandTextColor }} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => onOpenCustomerPreview(rest, 'DINE_IN')}
                    style={{
                      backgroundColor: brandPrimaryColor,
                      color: brandButtonText
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
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

      {/* Real QR Code Modal for Real-World Customer Orders */}
      {selectedRestForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-3xl p-6 text-center space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRestForQr(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Código QR Real para Pruebas</span>
              </div>
              <h3 className="text-base font-black text-white">
                {selectedRestForQr.name}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Escanea este código con tu teléfono real para probar pedidos como comensal anónimo.
              </p>
            </div>

            {/* Table or Delivery Selection */}
            <div className="p-3 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-300">Seleccionar Mesa de Prueba:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedChannel('DINE_IN')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedChannel === 'DINE_IN' ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    🍽️ Salón
                  </button>
                  <button
                    onClick={() => setSelectedChannel('DELIVERY')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedChannel === 'DELIVERY' ? 'bg-sky-400 text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    🛵 Delivery
                  </button>
                </div>
              </div>

              {selectedChannel === 'DINE_IN' && (
                <div className="grid grid-cols-6 gap-1.5 pt-1">
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(num => (
                    <button
                      key={num}
                      onClick={() => setSelectedTableNum(num)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        selectedTableNum === num
                          ? 'bg-amber-400 text-black shadow'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      M{num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 100% Real Scannable SVG QR Code */}
            <div ref={qrRef} className="p-4 bg-white rounded-2xl inline-block shadow-2xl border border-neutral-200 mx-auto">
              <QRCodeSVG
                value={currentQrUrl}
                size={190}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: selectedRestForQr.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=64&q=80",
                  x: undefined,
                  y: undefined,
                  height: 38,
                  width: 38,
                  excavate: true,
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>
                  {selectedChannel === 'DINE_IN' ? `Mesa ${selectedTableNum} • En Salón` : 'Canal Delivery a Domicilio'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Apunta la cámara de tu smartphone para abrir la carta digital interactiva al instante sin registro.
              </p>
            </div>

            <div className="p-2 rounded-xl bg-black/60 border border-neutral-800 text-[10px] font-mono text-neutral-400 truncate text-center">
              {currentQrUrl}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const rest = selectedRestForQr;
                  const tableN = selectedTableNum;
                  const mode = selectedChannel;
                  setSelectedRestForQr(null);
                  onOpenCustomerPreview(rest, mode, tableN);
                }}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Probar Pedido como Comensal Anónimo (En Pantalla)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyQrUrl}
                  className="py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedSlug === 'qr_modal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSlug === 'qr_modal' ? '¡Copiado!' : 'Copiar Link'}</span>
                </button>

                <button
                  onClick={handleDownloadQR}
                  className="py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bajar QR PNG</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

