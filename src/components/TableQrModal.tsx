import React, { useState, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Utensils, 
  MapPin, 
  Download,
  Share2,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Restaurant, RestaurantTable } from '../types';

interface TableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  table: RestaurantTable;
  onTestTableMenu: (restaurant: Restaurant, tableNumber: string) => void;
}

export const TableQrModal: React.FC<TableQrModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  table,
  onTestTableMenu,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Real URL pointing to this app's current origin with query params for the restaurant and table
  const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/micarta') ? '/micarta' : '';
  const origin = typeof window !== 'undefined' ? `${window.location.origin}${basePath}` : 'https://micarta.io';
  const tableUrl = `${origin}/?r=${restaurant.slug}&mesa=${table.number}&mode=DINE_IN`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
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
        downloadLink.download = `QR_${restaurant.slug}_${table.name.replace(/\s+/g, '_')}.png`;
        downloadLink.href = pngUrl;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col bg-neutral-950 border border-neutral-800 text-white shadow-2xl max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Código QR Real • {table.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-amber-400 border border-neutral-700">
                  {table.zone}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                {restaurant.name} • Capacidad {table.capacity} personas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Printable Table Card */}
        <div className="p-6 overflow-y-auto flex flex-col items-center space-y-5">
          
          {/* Real Printable Graphic Card */}
          <div className="w-full max-w-xs rounded-2xl p-6 bg-gradient-to-b from-neutral-900 via-neutral-900 to-black border-2 border-amber-500/40 shadow-xl shadow-amber-950/20 text-center flex flex-col items-center space-y-4 relative overflow-hidden">
            
            {/* Top Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>MiCarta • QR Oficial</span>
            </div>

            {/* Restaurant Logo & Name */}
            <div>
              <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-700 mx-auto mb-2 bg-neutral-800 shadow">
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="text-base font-black text-white">{restaurant.name}</h4>
              <p className="text-[11px] text-neutral-400">{restaurant.cuisineType || restaurant.cuisine}</p>
            </div>

            {/* Table Number Pill */}
            <div className="px-5 py-1.5 rounded-xl bg-amber-400 text-black font-black text-lg tracking-wide shadow-md">
              {table.name.toUpperCase()}
            </div>

            {/* 100% Real High-Resolution QR Vector generated from tableUrl */}
            <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-xl border border-neutral-200 inline-block">
              <QRCodeSVG
                value={tableUrl}
                size={180}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: restaurant.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=64&q=80",
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </div>

            {/* Instructions */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-neutral-200 flex items-center justify-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Escanea con la cámara de tu celular</span>
              </p>
              <p className="text-[10px] text-neutral-400">
                Abre la carta digital y pide directo a cocina como cliente anónimo
              </p>
            </div>

            {/* URL Footer */}
            <div className="pt-2 border-t border-neutral-800 w-full text-[10px] font-mono text-neutral-400 truncate text-center">
              {tableUrl}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-sm space-y-2.5">
            <button
              onClick={() => {
                onClose();
                onTestTableMenu(restaurant, String(table.number).padStart(2, '0'));
              }}
              className="w-full py-3 px-4 rounded-xl bg-amber-400 text-black text-xs font-black hover:bg-amber-300 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20 active:scale-[0.99]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Probar Pedido como Comensal Anónimo en {table.name}</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCopyLink}
                className="py-2.5 px-2 rounded-xl bg-neutral-900 border border-neutral-700 text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center gap-1"
                title="Copiar URL para compartir o probar en otra pestaña"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                <span>{copied ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>

              <button
                onClick={handleDownloadQR}
                className="py-2.5 px-2 rounded-xl bg-neutral-900 border border-neutral-700 text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center gap-1"
                title="Descargar imagen PNG de alta resolución"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bajar PNG</span>
              </button>

              <button
                onClick={handlePrint}
                className="py-2.5 px-2 rounded-xl bg-neutral-900 border border-neutral-700 text-[11px] font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center gap-1"
                title="Imprimir ficha de mesa"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
