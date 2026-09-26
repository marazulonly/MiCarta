import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Check, 
  Utensils, 
  Sparkles, 
  MessageSquare, 
  Layers 
} from 'lucide-react';
import { MenuItem, DishAddon, OrderItemUnit } from '../types';

interface ItemOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onConfirm: (item: MenuItem, quantity: number, units: OrderItemUnit[]) => void;
  themeAccentColor?: string;
  themeDarkBg?: string;
  dishCardBgColor?: string;
  buttonTextColor?: string;
  textColor?: string;
  secondaryColor?: string;
  dishNameFont?: string;
  dishDescFont?: string;
  dishPriceFont?: string;
}

function isLightColor(colorStr?: string): boolean {
  if (!colorStr) return false;
  let hex = colorStr.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export const ItemOrderModal: React.FC<ItemOrderModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
  themeAccentColor = '#f5a519',
  themeDarkBg,
  dishCardBgColor,
  buttonTextColor,
  textColor,
  secondaryColor,
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

  // Color calculation for clean contrast & harmony
  const modalBg = themeDarkBg || '#18181B';
  const bgIsLight = isLightColor(modalBg);

  const primaryText = textColor || (bgIsLight ? '#18181B' : '#F9FAFB');
  const textIsLight = isLightColor(primaryText);
  const subText = secondaryColor || (bgIsLight ? '#4B5563' : '#9CA3AF');
  const accentColor = themeAccentColor || '#f5a519';
  const btnTextColor = buttonTextColor || (isLightColor(accentColor) ? '#000000' : '#FFFFFF');

  const cardBg = dishCardBgColor || (bgIsLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.07)');
  const cardIsLight = isLightColor(cardBg) || bgIsLight;
  const cardBorder = bgIsLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)';
  
  const inputBg = cardIsLight ? '#FFFFFF' : 'rgba(0, 0, 0, 0.45)';
  const inputBorder = cardIsLight ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.2)';
  const inputText = cardIsLight ? '#111827' : '#F9FAFB';

  const footerBg = bgIsLight 
    ? (dishCardBgColor ? dishCardBgColor : 'rgba(0, 0, 0, 0.04)') 
    : 'rgba(0, 0, 0, 0.55)';

  // Contrast-enhanced styles for interactive addon buttons & observation chips
  const buttonUnselectedBg = bgIsLight 
    ? '#FFFFFF' 
    : 'rgba(255, 255, 255, 0.12)';
  const buttonUnselectedBorder = bgIsLight 
    ? 'rgba(0, 0, 0, 0.22)' 
    : 'rgba(255, 255, 255, 0.30)';
  const buttonUnselectedText = primaryText;

  const addonSelectedBg = bgIsLight
    ? `${accentColor}18`
    : `${accentColor}30`;
  const addonSelectedBorder = accentColor;

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
        const cleaned = currentObs.replace(chipText, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
        next[unitIdx] = { ...next[unitIdx], observation: cleaned };
      } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div 
        className="relative w-full h-full sm:h-auto max-w-none sm:max-w-xl min-h-screen sm:min-h-0 sm:max-h-[92vh] rounded-none sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl border-0 sm:border transition-all duration-300"
        style={{ 
          backgroundColor: modalBg,
          borderColor: cardBorder,
          color: primaryText
        }}
      >
        
        {/* Header with Dish Image preview & Close */}
        <div className="relative h-44 sm:h-52 w-full shrink-0 overflow-hidden bg-neutral-900">
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div 
            className="absolute inset-0"
            style={{ backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)` }} 
          />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-md transition cursor-pointer hover:scale-105"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span 
              style={{
                backgroundColor: accentColor,
                color: btnTextColor,
              }}
              className="text-[10px] uppercase tracking-wider font-mono font-bold px-2.5 py-0.5 rounded-md inline-block mb-1 shadow"
            >
              Personalizar Pedido
            </span>
            <h2 
              style={{ fontFamily: dishNameFont }}
              className="text-base sm:text-xl font-black leading-tight text-white drop-shadow-md"
            >
              {item.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span 
                style={{ fontFamily: dishPriceFont, color: '#FFFFFF' }}
                className="text-sm font-black font-mono bg-black/60 px-2.5 py-0.5 rounded-md border border-white/30 backdrop-blur-sm"
              >
                S/ {item.price.toFixed(2)} c/u
              </span>
              {item.prepTimeMinutes && (
                <span className="text-[11px] font-bold text-white/90 flex items-center gap-1 drop-shadow-sm">
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
              backgroundColor: cardBg,
              borderColor: cardBorder
            }}
            className="p-3.5 rounded-xl border flex items-center justify-between shadow-sm"
          >
            <div>
              <span style={{ color: primaryText }} className="text-xs font-black block">Cantidad de platos</span>
              <span style={{ color: subText }} className="text-[11px] font-medium block mt-0.5">
                {quantity === 1 ? '1 plato individual' : `${quantity} platos (personalizables por separado)`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                style={{ 
                  backgroundColor: accentColor, 
                  color: btnTextColor 
                }}
                className="w-8 h-8 rounded-lg disabled:opacity-30 font-bold flex items-center justify-center transition cursor-pointer shadow-sm hover:brightness-110"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span style={{ color: primaryText }} className="w-8 text-center font-black text-base font-mono">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                style={{ 
                  backgroundColor: accentColor, 
                  color: btnTextColor 
                }}
                className="w-8 h-8 rounded-lg font-bold flex items-center justify-center transition cursor-pointer shadow-sm hover:brightness-110"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* If quantity > 1, show Unit Selector Tabs */}
          {quantity > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label style={{ color: primaryText }} className="text-xs font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  <span>Selecciona la unidad a personalizar:</span>
                </label>
                <span style={{ color: subText }} className="text-[10px] font-mono font-medium">
                  Independientes por cada plato
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
                          ? { backgroundColor: accentColor, color: btnTextColor, borderColor: accentColor } 
                          : { backgroundColor: cardBg, color: primaryText, borderColor: cardBorder }
                      }
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                        isSelectedTab ? 'shadow-md scale-[1.02]' : 'hover:brightness-95'
                      }`}
                    >
                      <span>Plato {idx + 1}</span>
                      {(hasAddons || hasObs) && (
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={isSelectedTab ? { backgroundColor: btnTextColor } : { backgroundColor: accentColor }} 
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
              backgroundColor: cardBg,
              borderColor: cardBorder
            }}
            className="p-4 rounded-xl border space-y-4 shadow-sm"
          >
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between pb-2 border-b">
              <span className="text-xs font-black flex items-center gap-1.5" style={{ color: primaryText }}>
                <Utensils className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Configuración de Plato #{activeUnitTab + 1}</span>
              </span>
              <span style={{ color: subText }} className="text-[10px] font-mono font-bold">
                {quantity > 1 ? `Plato ${activeUnitTab + 1} de ${quantity}` : 'Plato único'}
              </span>
            </div>

            {/* 1. Adicionales de esta unidad */}
            {availableAddons.length > 0 && (
              <div className="space-y-2">
                <label style={{ color: primaryText }} className="text-xs font-bold block">
                  <span>Adicionales Opcionales</span>
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
                          backgroundColor: addonSelectedBg,
                          borderColor: addonSelectedBorder,
                          borderWidth: '1.5px',
                          color: buttonUnselectedText
                        } : {
                          backgroundColor: buttonUnselectedBg,
                          borderColor: buttonUnselectedBorder,
                          borderWidth: '1.5px',
                          color: buttonUnselectedText
                        }}
                        className="p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer shadow-sm hover:brightness-110 active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div 
                            style={isSelected 
                              ? { backgroundColor: accentColor, borderColor: accentColor } 
                              : { borderColor: bgIsLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.45)', backgroundColor: bgIsLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)' }
                            }
                            className="w-4 h-4 rounded flex items-center justify-center border transition shrink-0"
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" style={{ color: btnTextColor }} />}
                          </div>
                          <span className="text-xs font-bold leading-tight">{addon.name}</span>
                        </div>
                        <span 
                          style={{ color: accentColor, fontFamily: dishPriceFont }}
                          className="text-xs font-mono font-black shrink-0 ml-2"
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
            <div style={{ borderColor: cardBorder }} className="space-y-2 pt-2 border-t">
              <label style={{ color: primaryText }} className="text-xs font-bold flex items-center">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  <span>Observaciones para cocina</span>
                </span>
              </label>

              {/* Quick suggestion chips */}
              {suggestedObs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestedObs.map((chip, cIdx) => {
                    const isChipActive = currentUnit.observation?.includes(chip);
                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleAddChipToObservation(activeUnitTab, chip)}
                        style={isChipActive ? {
                          backgroundColor: accentColor,
                          borderColor: accentColor,
                          color: btnTextColor
                        } : {
                          backgroundColor: buttonUnselectedBg,
                          borderColor: buttonUnselectedBorder,
                          color: buttonUnselectedText
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer font-bold shadow-sm ${
                          isChipActive ? 'scale-[1.03] shadow-md' : 'hover:brightness-110 hover:scale-105'
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
                style={{ 
                  fontFamily: dishDescFont,
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: inputText
                }}
                className="w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none transition resize-none font-medium shadow-inner placeholder:text-neutral-400"
              />
            </div>
          </div>

        </div>

        {/* Footer with Price calculation and Confirm button */}
        <div 
          style={{ 
            backgroundColor: footerBg,
            borderColor: cardBorder
          }}
          className="p-4 border-t flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <span style={{ color: subText }} className="text-[10px] uppercase tracking-wider font-mono font-bold block">
              Subtotal ({quantity} {quantity === 1 ? 'plato' : 'platos'})
            </span>
            <div className="flex items-baseline gap-1.5">
              <span 
                style={{ color: accentColor, fontFamily: dishPriceFont }}
                className="text-xl font-black font-mono"
              >
                S/ {grandTotal.toFixed(2)}
              </span>
              {addonsTotal > 0 && (
                <span style={{ color: subText }} className="text-[11px] font-mono font-bold">
                  (incluye +S/ {addonsTotal.toFixed(2)} extras)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              style={{ 
                backgroundColor: cardBg, 
                color: primaryText,
                borderColor: cardBorder 
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition border cursor-pointer hover:brightness-90"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm(item, quantity, units);
                onClose();
              }}
              style={{ 
                backgroundColor: accentColor, 
                color: btnTextColor 
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold transition shadow-lg flex items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Agregar al Pedido</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
