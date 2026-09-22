import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Check, 
  Utensils, 
  Sparkles, 
  MessageSquare, 
  Layers, 
  Info 
} from 'lucide-react';
import { MenuItem, DishAddon, OrderItemUnit } from '../types';

interface ItemOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onConfirm: (item: MenuItem, quantity: number, units: OrderItemUnit[]) => void;
  themeAccentColor?: string;
  themeDarkBg?: string;
  buttonTextColor?: string;
  textColor?: string;
  dishNameFont?: string;
  dishDescFont?: string;
  dishPriceFont?: string;
}

export const ItemOrderModal: React.FC<ItemOrderModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
  themeAccentColor = '#EAB308',
  themeDarkBg = '#171717',
  buttonTextColor = '#000000',
  textColor,
  dishNameFont,
  dishDescFont,
  dishPriceFont,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeUnitTab, setActiveUnitTab] = useState(0);
  const [units, setUnits] = useState<OrderItemUnit[]>([
    { unitNumber: 1, observation: '', selectedAddons: [] }
  ]);

  const availableAddons = item?.availableAddons || [];
  const suggestedObs = item?.suggestedObservations || [];

  // Reset when item opens
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(1);
      setActiveUnitTab(0);
      setUnits([
        { unitNumber: 1, observation: '', selectedAddons: [] }
      ]);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Adjust units array whenever quantity changes
  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1 || newQty > 20) return;
    setQuantity(newQty);
    setUnits(prev => {
      if (newQty > prev.length) {
        const next = [...prev];
        for (let i = prev.length; i < newQty; i++) {
          next.push({ unitNumber: i + 1, observation: '', selectedAddons: [] });
        }
        return next;
      } else {
        return prev.slice(0, newQty);
      }
    });
    if (activeUnitTab >= newQty) {
      setActiveUnitTab(newQty - 1);
    }
  };

  const handleToggleAddon = (unitIdx: number, addon: DishAddon) => {
    setUnits(prev => {
      const next = [...prev];
      const targetUnit = { ...next[unitIdx] };
      const currentAddons = targetUnit.selectedAddons || [];
      const exists = currentAddons.some(a => a.id === addon.id || a.name === addon.name);
      
      if (exists) {
        targetUnit.selectedAddons = currentAddons.filter(a => a.id !== addon.id && a.name !== addon.name);
      } else {
        targetUnit.selectedAddons = [...currentAddons, addon];
      }
      next[unitIdx] = targetUnit;
      return next;
    });
  };

  const handleSetObservation = (unitIdx: number, text: string) => {
    setUnits(prev => {
      const next = [...prev];
      next[unitIdx] = { ...next[unitIdx], observation: text };
      return next;
    });
  };

  const handleAddChipToObservation = (unitIdx: number, chipText: string) => {
    setUnits(prev => {
      const next = [...prev];
      const currentObs = next[unitIdx].observation || '';
      if (currentObs.includes(chipText)) {
        // remove chip
        const cleaned = currentObs.replace(chipText, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
        next[unitIdx] = { ...next[unitIdx], observation: cleaned };
      } else {
        // add chip
        const updated = currentObs ? `${currentObs}, ${chipText}` : chipText;
        next[unitIdx] = { ...next[unitIdx], observation: updated };
      }
      return next;
    });
  };

  // Calculate grand total including unit addons
  const baseItemTotal = item.price * quantity;
  const addonsTotal = units.reduce((sum, u) => {
    const unitAddonsSum = (u.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
    return sum + unitAddonsSum;
  }, 0);
  const grandTotal = baseItemTotal + addonsTotal;

  const currentUnit = units[activeUnitTab] || units[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl border text-white"
        style={{ 
          backgroundColor: themeDarkBg,
          borderColor: themeAccentColor ? `${themeAccentColor}60` : 'rgba(255,255,255,0.15)' 
        }}
      >
        
        {/* Header with Dish Image preview & Close */}
        <div className="relative h-44 sm:h-48 w-full shrink-0 overflow-hidden bg-neutral-900">
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div 
            className="absolute inset-0"
            style={{ backgroundImage: `linear-gradient(to top, ${themeDarkBg} 0%, rgba(0,0,0,0.6) 60%, transparent 100%)` }} 
          />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-neutral-300 hover:text-white border border-neutral-700 backdrop-blur-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <span 
              style={{
                backgroundColor: themeAccentColor ? `${themeAccentColor}25` : undefined,
                color: themeAccentColor || '#f59e0b',
                borderColor: themeAccentColor ? `${themeAccentColor}60` : undefined
              }}
              className="text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded border inline-block mb-1"
            >
              Personalizar Pedido
            </span>
            <h2 
              style={{ fontFamily: dishNameFont, color: textColor || '#ffffff' }}
              className="text-base sm:text-lg font-bold leading-tight"
            >
              {item.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span 
                style={{ color: themeAccentColor, fontFamily: dishPriceFont }}
                className="text-sm font-black font-mono"
              >
                S/ {item.price.toFixed(2)} c/u
              </span>
              {item.prepTimeMinutes && (
                <span className="text-[11px] text-neutral-300">
                  ⏱ {item.prepTimeMinutes} min de preparación
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Quantity Selector Banner */}
          <div 
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: themeAccentColor ? `${themeAccentColor}35` : 'rgba(255,255,255,0.1)'
            }}
            className="p-3 rounded-xl border flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-white block">Cantidad de platos</span>
              <span className="text-[11px] text-neutral-300 block">
                {quantity === 1 ? '1 plato individual' : `${quantity} platos (personalizables por separado)`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-black text-sm font-mono text-white">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* If quantity > 1, show Unit Selector Tabs */}
          {quantity > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" style={{ color: themeAccentColor }} />
                  <span>Selecciona la unidad a personalizar:</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Observaciones y adicionales independientes
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {units.map((u, idx) => {
                  const hasAddons = (u.selectedAddons && u.selectedAddons.length > 0);
                  const hasObs = !!u.observation?.trim();
                  const isSelectedTab = activeUnitTab === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveUnitTab(idx)}
                      style={
                        isSelectedTab 
                          ? { backgroundColor: themeAccentColor, color: buttonTextColor, borderColor: themeAccentColor } 
                          : { backgroundColor: 'rgba(0,0,0,0.4)', color: themeAccentColor, borderColor: `${themeAccentColor}60` }
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                        isSelectedTab ? 'shadow-md' : 'hover:brightness-125'
                      }`}
                    >
                      <span>Plato {idx + 1}</span>
                      {(hasAddons || hasObs) && (
                        <span 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={isSelectedTab ? { backgroundColor: buttonTextColor } : { backgroundColor: themeAccentColor }} 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Unit Configuration Card */}
          <div 
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderColor: themeAccentColor ? `${themeAccentColor}40` : 'rgba(255,255,255,0.1)'
            }}
            className="p-4 rounded-xl border space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: themeAccentColor }}>
                <Utensils className="w-3.5 h-3.5" />
                <span>Configuración de Plato #{activeUnitTab + 1}</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {quantity > 1 ? `Plato ${activeUnitTab + 1} de ${quantity}` : 'Plato único'}
              </span>
            </div>

            {/* 1. Adicionales de esta unidad */}
            {availableAddons.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Adicionales Opcionales</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Cargados a este plato</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableAddons.map(addon => {
                    const isSelected = (currentUnit.selectedAddons || []).some(a => a.id === addon.id || a.name === addon.name);
                    return (
                      <button
                        key={addon.id || addon.name}
                        type="button"
                        onClick={() => handleToggleAddon(activeUnitTab, addon)}
                        style={isSelected ? {
                          backgroundColor: `${themeAccentColor}20`,
                          borderColor: themeAccentColor,
                        } : undefined}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          !isSelected ? 'bg-black/50 border-neutral-800 text-neutral-300 hover:border-neutral-700' : 'text-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            style={isSelected ? { backgroundColor: themeAccentColor, borderColor: themeAccentColor } : undefined}
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              !isSelected ? 'border-neutral-700 bg-neutral-900' : ''
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" style={{ color: buttonTextColor }} />}
                          </div>
                          <span className="text-xs font-medium">{addon.name}</span>
                        </div>
                        <span 
                          style={{ color: isSelected ? themeAccentColor : undefined, fontFamily: dishPriceFont }}
                          className={`text-xs font-mono font-bold ${!isSelected ? 'text-neutral-400' : ''}`}
                        >
                          +S/ {addon.price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Observaciones / Instrucciones de preparación de esta unidad */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: themeAccentColor }} />
                  <span>Observaciones para cocina</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">Alergias, preferencias, sin ingredientes</span>
              </label>

              {/* Quick suggestion chips */}
              {suggestedObs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestedObs.map((chip, cIdx) => {
                    const isChipActive = currentUnit.observation?.includes(chip);
                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleAddChipToObservation(activeUnitTab, chip)}
                        style={isChipActive ? {
                          backgroundColor: themeAccentColor,
                          borderColor: themeAccentColor,
                          color: buttonTextColor
                        } : {
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          borderColor: `${themeAccentColor}60`,
                          color: themeAccentColor
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                          !isChipActive
                            ? 'hover:brightness-125'
                            : 'font-bold shadow-sm'
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text Input for Custom Observation */}
              <textarea
                rows={2}
                value={currentUnit.observation || ''}
                onChange={(e) => handleSetObservation(activeUnitTab, e.target.value)}
                placeholder="Escribe detalles específicos de este plato (ej: término de cocción, sin sal, ají aparte...)"
                style={{ fontFamily: dishDescFont }}
                className="w-full px-3 py-2 rounded-xl bg-black/80 border border-neutral-700 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 transition resize-none"
              />
            </div>
          </div>

          {/* Informative notice */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-start gap-2.5 text-[11px] text-neutral-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: themeAccentColor }} />
            <span>
              Las observaciones y adicionales ingresados serán enviados a cocina y comandas detallados por cada plato individual para una atención personalizada.
            </span>
          </div>

        </div>

        {/* Footer with Price calculation and Confirm button */}
        <div className="p-4 bg-black/80 border-t border-white/10 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono block">
              Subtotal ({quantity} {quantity === 1 ? 'plato' : 'platos'})
            </span>
            <div className="flex items-baseline gap-1.5">
              <span 
                style={{ color: themeAccentColor, fontFamily: dishPriceFont }}
                className="text-lg font-black font-mono"
              >
                S/ {grandTotal.toFixed(2)}
              </span>
              {addonsTotal > 0 && (
                <span className="text-[11px] text-neutral-400 font-mono">
                  (incluye +S/ {addonsTotal.toFixed(2)} en extras)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm(item, quantity, units);
                onClose();
              }}
              style={{ backgroundColor: themeAccentColor, color: buttonTextColor }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Agregar al Pedido</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
