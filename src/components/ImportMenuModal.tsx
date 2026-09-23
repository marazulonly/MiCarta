import React, { useState, useEffect } from 'react';
import { 
  FileJson, 
  Layers, 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle, 
  Utensils, 
  Store,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Restaurant, MenuCategory, MenuItem } from '../types';

export type ImportMenuMode = 'MERGE' | 'REPLACE';

export interface ImportMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  importedData: {
    restaurants: Restaurant[];
    categories: MenuCategory[];
    items: MenuItem[];
  } | null;
  currentRestaurant?: Restaurant;
  allRestaurants: Restaurant[];
  onConfirmImport: (
    data: {
      restaurants: Restaurant[];
      categories: MenuCategory[];
      items: MenuItem[];
    },
    mode: ImportMenuMode,
    targetRestaurantId?: string
  ) => void;
}

export const ImportMenuModal: React.FC<ImportMenuModalProps> = ({
  isOpen,
  onClose,
  importedData,
  currentRestaurant,
  allRestaurants,
  onConfirmImport,
}) => {
  const [selectedMode, setSelectedMode] = useState<ImportMenuMode>('MERGE');
  const [targetRestaurantId, setTargetRestaurantId] = useState<string>('');

  useEffect(() => {
    if (currentRestaurant) {
      setTargetRestaurantId(currentRestaurant.id);
    } else if (importedData?.restaurants?.[0]) {
      setTargetRestaurantId(importedData.restaurants[0].id);
    } else if (allRestaurants.length > 0) {
      setTargetRestaurantId(allRestaurants[0].id);
    }
  }, [currentRestaurant, importedData, allRestaurants]);

  if (!isOpen || !importedData) return null;

  const targetRest = allRestaurants.find(r => r.id === targetRestaurantId) || currentRestaurant || allRestaurants[0];
  const sourceRestName = importedData.restaurants.map(r => r.name).join(', ') || 'Restaurante del Archivo';
  const itemCount = importedData.items?.length || 0;
  const categoryCount = importedData.categories?.length || 0;

  const handleConfirm = () => {
    onConfirmImport(importedData, selectedMode, targetRestaurantId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Importar Carta desde Archivo JSON
              </h2>
              <p className="text-xs text-neutral-400">
                Selecciona cómo deseas aplicar la información a tu restaurante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* File summary pill */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider block">
                Contenido detectado en el archivo:
              </span>
              <span className="font-semibold text-white mt-0.5 block truncate max-w-xs">
                {sourceRestName}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-amber-300 font-mono font-bold text-[11px] flex items-center gap-1">
                <Utensils className="w-3 h-3" />
                {itemCount} {itemCount === 1 ? 'plato' : 'platos'}
              </span>
              <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-sky-300 font-mono font-bold text-[11px] flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {categoryCount} {categoryCount === 1 ? 'categoría' : 'categorías'}
              </span>
            </div>
          </div>

          {/* Target Restaurant Selector (if multiple restaurants exist) */}
          {allRestaurants.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Aplicar al Restaurante Destino:</span>
              </label>
              <select
                value={targetRestaurantId}
                onChange={(e) => setTargetRestaurantId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-medium focus:outline-none focus:border-amber-400/50"
              >
                {allRestaurants.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.slug})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Choice Cards */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-neutral-300 block">
              ¿Qué deseas hacer con la carta actual?
            </span>

            {/* Option 1: MERGE (Añadir / Fusionar) */}
            <div
              onClick={() => setSelectedMode('MERGE')}
              className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                selectedMode === 'MERGE'
                  ? 'bg-amber-400/10 border-amber-400/60 ring-1 ring-amber-400/40'
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition ${
                selectedMode === 'MERGE'
                  ? 'border-amber-400 bg-amber-400 text-black'
                  : 'border-neutral-600 bg-neutral-800'
              }`}>
                {selectedMode === 'MERGE' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Añadir a la Carta (Fusionar)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Conserva platos actuales
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Conserva todos los platos y categorías que ya tienes en <strong className="text-neutral-200">{targetRest?.name || 'el restaurante'}</strong> y suma los nuevos elementos del archivo JSON. Si un plato ya existe por código, actualiza su información.
                </p>
              </div>
            </div>

            {/* Option 2: REPLACE (Reemplazar) */}
            <div
              onClick={() => setSelectedMode('REPLACE')}
              className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                selectedMode === 'REPLACE'
                  ? 'bg-rose-500/10 border-rose-500/60 ring-1 ring-rose-500/40'
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition ${
                selectedMode === 'REPLACE'
                  ? 'border-rose-400 bg-rose-500 text-white'
                  : 'border-neutral-600 bg-neutral-800'
              }`}>
                {selectedMode === 'REPLACE' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reemplazar Carta Completa</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Sustitución total
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Sustituye por completo las categorías y platos de <strong className="text-neutral-200">{targetRest?.name || 'este restaurante'}</strong> con los del archivo JSON. Los platos antiguos que no estén en el archivo serán removidos.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Owner Security Guarantee */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Garantía de Seguridad:</strong> La importación solo afecta la carta de platos. Las cuentas de usuarios, dueños y otros restaurantes nunca se modifican.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer ${
              selectedMode === 'REPLACE'
                ? 'bg-rose-500 hover:bg-rose-400 text-white'
                : 'bg-amber-400 hover:bg-amber-300 text-black'
            }`}
          >
            <span>
              {selectedMode === 'REPLACE' ? 'Reemplazar Carta con JSON' : 'Añadir Platos a la Carta'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
