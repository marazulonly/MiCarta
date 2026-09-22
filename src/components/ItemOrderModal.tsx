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
}

export const ItemOrderModal: React.FC<ItemOrderModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
  themeAccentColor = '#EAB308',
  themeDarkBg = '#171717',
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeUnitTab, setActiveUnitTab] = useState(0);
  const [units, setUnits] = useState<OrderItemUnit[]>([
    { unitNumber: 1, observation: '', selectedAddons: [] }
  ]);

  // Default suggested observations if not configured
  const defaultSuggestedObs = [
    'Término 3/4',
    'Bien cocido',
    'Término medio',
    'Sin cebolla',
    'Salsa aparte',
    'Bajo en sal',
    'Poco picante'
  ];

  // Default addons if none configured
  const defaultAddons: DishAddon[] = [
    { id: 'def-add-1', name: 'Porción de Papas Extra', price: 8.0 },
    { id: 'def-add-2', name: 'Huevo Frito Artesanal', price: 3.5 },
    { id: 'def-add-3', name: 'Salsa Especial de la Casa', price: 4.0 },
  ];

  const availableAddons = (item?.availableAddons && item.availableAddons.length > 0)
    ? item.availableAddons
    : defaultAddons;

  const suggestedObs = (item?.suggestedObservations && item.suggestedObservations.length > 0)
    ? item.suggestedObservations
    : defaultSuggestedObs;

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
        className="relative w-full max-w-xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-neutral-800 bg-neutral-950 text-white"
        style={{ borderColor: 'rgba(255,255,255,0.15)' }}
      >
        
        {/* Header with Dish Image preview & Close */}
        <div className="relative h-44 sm:h-48 w-full shrink-0 overflow-hidden bg-neutral-900">
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-neutral-300 hover:text-white border border-neutral-700 backdrop-blur-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-1">
              Personalizar Pedido
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
              {item.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-black text-amber-400 font-mono">
                S/ {item.price.toFixed(2)} c/u
              </span>
              {item.prepTimeMinutes && (
                <span className="text-[11px] text-neutral-400">
                  ⏱ {item.prepTimeMinutes} min de preparación
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Quantity Selector Banner */}
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Cantidad de platos</span>
              <span className="text-[11px] text-neutral-400 block">
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
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
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
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveUnitTab(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        activeUnitTab === idx
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      <span>Plato {idx + 1}</span>
                      {(hasAddons || hasObs) && (
                        <span className={`w-1.5 h-1.5 rounded-full ${activeUnitTab === idx ? 'bg-black' : 'bg-amber-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Unit Configuration Card */}
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                <span>Configuración de Plato #{activeUnitTab + 1}</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {quantity > 1 ? `Plato ${activeUnitTab + 1} de ${quantity}` : 'Plato único'}
              </span>
            </div>

            {/* 1. Adicionales de esta unidad */}
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
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                          : 'bg-black/50 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-amber-400 border-amber-400 text-black' : 'border-neutral-700 bg-neutral-900'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium">{addon.name}</span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${isSelected ? 'text-amber-400' : 'text-neutral-400'}`}>
                        +S/ {addon.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Observaciones / Instrucciones de preparación de esta unidad */}
            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Observaciones para cocina</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">Término, alergias, preferencias</span>
              </label>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {suggestedObs.map((chip, cIdx) => {
                  const isChipActive = currentUnit.observation?.includes(chip);
                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleAddChipToObservation(activeUnitTab, chip)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        isChipActive
                          ? 'bg-amber-400 text-black font-bold border-amber-400'
                          : 'bg-neutral-900 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>

              {/* Text Input for Custom Observation */}
              <textarea
                rows={2}
                value={currentUnit.observation || ''}
                onChange={(e) => handleSetObservation(activeUnitTab, e.target.value)}
                placeholder="Escribe detalles específicos de este plato (ej: término de cocción, sin sal, ají aparte...)"
                className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400 transition resize-none"
              />
            </div>
          </div>

          {/* Informative notice */}
          <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 flex items-start gap-2.5 text-[11px] text-neutral-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Las observaciones y adicionales ingresados serán enviados a cocina y comandas detallados por cada plato individual para una atención personalizada.
            </span>
          </div>

        </div>

        {/* Footer with Price calculation and Confirm button */}
        <div className="p-4 bg-black border-t border-neutral-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono block">
              Subtotal ({quantity} {quantity === 1 ? 'plato' : 'platos'})
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-amber-400 font-mono">
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
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
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
