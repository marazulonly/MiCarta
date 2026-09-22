import React, { useState } from 'react';
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
  Share2
} from 'lucide-react';
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

  if (!isOpen) return null;

  const tableUrl = `https://micarta.io/r/${restaurant.slug}?mesa=${table.number}`;

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
    }, 400);
  };

  // Generate realistic SVG QR pattern
  const qrGridSize = 25;
  // Seed based on table number + restaurant id
  const getCellFilled = (r: number, c: number) => {
    // 3 Corner positioning patterns (top-left, top-right, bottom-left)
    if (r < 7 && c < 7) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    if (r < 7 && c >= qrGridSize - 7) {
      const cc = c - (qrGridSize - 7);
      if (r === 0 || r === 6 || cc === 0 || cc === 6) return true;
      if (r >= 2 && r <= 4 && cc >= 2 && cc <= 4) return true;
      return false;
    }
    if (r >= qrGridSize - 7 && c < 7) {
      const rr = r - (qrGridSize - 7);
      if (rr === 0 || rr === 6 || c === 0 || c === 6) return true;
      if (rr >= 2 && rr <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Pseudo-random deterministic fill based on table number
    const hash = (r * 31 + c * 17 + table.number * 23 + restaurant.name.length) % 100;
    return hash > 45;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col bg-neutral-950 border border-neutral-800 text-white shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Código QR de {table.name}</span>
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
        <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col items-center space-y-6">
          
          {/* Printable Graphic Card */}
          <div className="w-full max-w-xs rounded-2xl p-6 bg-gradient-to-b from-neutral-900 via-neutral-900 to-black border-2 border-amber-500/40 shadow-xl shadow-amber-950/20 text-center flex flex-col items-center space-y-4 relative overflow-hidden">
            
            {/* Top Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Micarta Digital</span>
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
              <p className="text-[11px] text-neutral-400">{restaurant.cuisineType}</p>
            </div>

            {/* Table Number Pill */}
            <div className="px-5 py-1.5 rounded-xl bg-amber-400 text-black font-black text-lg tracking-wide shadow-md">
              {table.name.toUpperCase()}
            </div>

            {/* High-Resolution QR Vector */}
            <div className="p-3 bg-white rounded-xl shadow-lg border border-neutral-200">
              <svg 
                viewBox={`0 0 ${qrGridSize} ${qrGridSize}`} 
                className="w-44 h-44"
                style={{ shapeRendering: 'crispEdges' }}
              >
                {Array.from({ length: qrGridSize }).map((_, r) =>
                  Array.from({ length: qrGridSize }).map((_, c) => {
                    const filled = getCellFilled(r, c);
                    return filled ? (
                      <rect 
                        key={`${r}-${c}`} 
                        x={c} 
                        y={r} 
                        width="1" 
                        height="1" 
                        fill="#0A0A0A" 
                      />
                    ) : null;
                  })
                )}
              </svg>
            </div>

            {/* Instructions */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-neutral-200">
                Escanea con la cámara de tu celular
              </p>
              <p className="text-[10px] text-neutral-400">
                Para ver la carta y hacer tu pedido directo a cocina
              </p>
            </div>

            {/* URL Footer */}
            <div className="pt-2 border-t border-neutral-800 w-full text-[10px] font-mono text-neutral-500 truncate">
              {tableUrl}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2.5">
            <button
              onClick={() => {
                onClose();
                onTestTableMenu(restaurant, String(table.number).padStart(2, '0'));
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Probar Carta como Cliente en {table.name}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Imprimir Ficha</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
