import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  QrCode, 
  CheckCircle2, 
  Sparkles, 
  Utensils, 
  Search, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { Restaurant, RestaurantTable } from '../types';

interface WaiterQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  tables: RestaurantTable[];
  onTableSelected: (table: RestaurantTable) => void;
}

export const WaiterQrScannerModal: React.FC<WaiterQrScannerModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  tables,
  onTableSelected,
}) => {
  const [searchTable, setSearchTable] = useState('');
  const [detectedTable, setDetectedTable] = useState<RestaurantTable | null>(null);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDetectedTable(null);
      setIsSimulatingScan(true);
      const timer = setTimeout(() => {
        setIsSimulatingScan(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTable = (tbl: RestaurantTable) => {
    setDetectedTable(tbl);
    setTimeout(() => {
      onTableSelected(tbl);
      onClose();
    }, 400);
  };

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchTable.toLowerCase()) ||
    t.number.toString().includes(searchTable) ||
    t.zone.toLowerCase().includes(searchTable.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col bg-neutral-950 border border-neutral-800 text-white shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                Escáner QR de Mesa en Salón
              </h3>
              <p className="text-[10px] text-neutral-400">
                {restaurant.name} • Mozo POS
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

        {/* Camera Simulation Viewport */}
        <div className="p-5 flex flex-col items-center space-y-4">
          
          <div className="relative w-full aspect-square max-w-[280px] rounded-2xl bg-neutral-900 border-2 border-dashed border-sky-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner">
            
            {/* Viewfinder Corners */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-sky-400 rounded-tl"></div>
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-sky-400 rounded-tr"></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-sky-400 rounded-bl"></div>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-sky-400 rounded-br"></div>

            {/* Laser scanning line */}
            <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-lg shadow-sky-400/80 animate-bounce"></div>

            {/* Center icon / state */}
            {detectedTable ? (
              <div className="text-center space-y-2 animate-in zoom-in-90">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <span className="text-xs font-bold text-emerald-300 block">
                  ¡{detectedTable.name} Detectada!
                </span>
                <span className="text-[10px] text-neutral-400">
                  Abriendo comanda...
                </span>
              </div>
            ) : (
              <div className="text-center space-y-2 p-4">
                <QrCode className="w-12 h-12 text-sky-400/60 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-neutral-200">
                  Apunta la cámara al QR de la mesa
                </p>
                <p className="text-[10px] text-neutral-400">
                  O selecciona una mesa de la lista rápida abajo
                </p>
              </div>
            )}
          </div>

          {/* Quick Selection or Search */}
          <div className="w-full space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Buscar por número o zona (ej: 4, Terraza)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="text-[11px] font-bold text-neutral-400 flex items-center justify-between">
              <span>Mesas Disponibles para Atender:</span>
              <span className="text-[10px] font-mono text-sky-400">
                {filteredTables.length} mesas
              </span>
            </div>

            {/* Table Buttons Grid */}
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredTables.map((tbl) => {
                const isOccupied = tbl.status === 'OCCUPIED';
                return (
                  <button
                    key={tbl.id}
                    onClick={() => handleSelectTable(tbl)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isOccupied 
                        ? 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500 text-amber-200' 
                        : 'bg-neutral-900 border-neutral-800 hover:border-sky-400 text-white'
                    }`}
                  >
                    <span className="text-xs font-black font-mono">
                      M-{tbl.number}
                    </span>
                    <span className="text-[9px] text-neutral-400 truncate max-w-full">
                      {tbl.zone}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
