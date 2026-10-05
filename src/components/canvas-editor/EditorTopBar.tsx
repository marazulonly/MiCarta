import React from 'react';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Grid, 
  Magnet, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Save, 
  Store, 
  Layers, 
  Sparkles,
  Download,
  Share2
} from 'lucide-react';
import { Restaurant } from '../../types';

interface EditorTopBarProps {
  restaurants: Restaurant[];
  selectedRestId: string;
  onSelectRestaurant: (restId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitCanvas: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showSnapGuides: boolean;
  onToggleSnapGuides: () => void;
  showSafetyMargins: boolean;
  onToggleSafetyMargins: () => void;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSave: () => void;
  onApplyToAll?: () => void;
  onClose?: () => void;
  isSaving?: boolean;
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  restaurants,
  selectedRestId,
  onSelectRestaurant,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitCanvas,
  showGrid,
  onToggleGrid,
  showSnapGuides,
  onToggleSnapGuides,
  showSafetyMargins,
  onToggleSafetyMargins,
  isPreviewMode,
  onTogglePreview,
  isFullscreen,
  onToggleFullscreen,
  onSave,
  onApplyToAll,
  onClose,
  isSaving = false
}) => {
  const selectedRest = restaurants.find(r => r.id === selectedRestId) || restaurants[0];

  return (
    <div className="h-16 px-3 sm:px-5 bg-[#0C1017] border-b border-neutral-800 flex items-center justify-between shrink-0 select-none z-30">
      
      {/* Left: Brand / Return & Restaurant Selector */}
      <div className="flex items-center gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
            title="Cerrar Editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-black text-sm shadow-md">
            M
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide uppercase font-mono flex items-center gap-1.5">
              <span>Studio Canvas</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">PRO</span>
            </h1>
            <p className="text-[10px] text-neutral-400">Editor Visual de Cartas Digitales</p>
          </div>
        </div>

        {/* Restaurant Selector */}
        <div className="flex items-center gap-1.5 bg-neutral-900/90 px-2.5 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-700 transition">
          <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <select
            value={selectedRestId}
            onChange={(e) => onSelectRestaurant(e.target.value)}
            className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
          >
            {restaurants.map(r => (
              <option key={r.id} value={r.id} className="bg-neutral-900 text-white">
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Undo/Redo, Zoom & Viewport Tools */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition ${
              canUndo ? 'text-neutral-200 hover:bg-neutral-800 cursor-pointer' : 'text-neutral-600 cursor-not-allowed'
            }`}
            title="Deshacer (Ctrl + Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition ${
              canRedo ? 'text-neutral-200 hover:bg-neutral-800 cursor-pointer' : 'text-neutral-600 cursor-not-allowed'
            }`}
            title="Rehacer (Ctrl + Shift + Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            className="p-1.5 rounded-lg text-neutral-300 hover:bg-neutral-800 transition cursor-pointer"
            title="Reducir Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onFitCanvas}
            className="px-2 py-1 text-[11px] font-mono font-bold text-neutral-200 hover:text-white transition cursor-pointer"
            title="Ajustar al área de trabajo"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.1))}
            className="p-1.5 rounded-lg text-neutral-300 hover:bg-neutral-800 transition cursor-pointer"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Toggles: Grid, Magnet Snapping, Safety Margins */}
        <div className="hidden lg:flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={onToggleGrid}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showGrid ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-neutral-400 hover:text-white'
            }`}
            title="Mostrar / Ocultar Cuadrícula"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleSnapGuides}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showSnapGuides ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40' : 'text-neutral-400 hover:text-white'
            }`}
            title="Guías Magnéticas de Alineación"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleSafetyMargins}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showSafetyMargins ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-neutral-400 hover:text-white'
            }`}
            title="Márgenes de Seguridad Móvil"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Preview Mode, Fullscreen & Save Actions */}
      <div className="flex items-center gap-2">
        {/* Toggle Preview */}
        <button
          onClick={onTogglePreview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
            isPreviewMode 
              ? 'bg-amber-400 text-black border-amber-300 shadow-md' 
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
          }`}
          title="Alternar entre modo Editor y Vista Previa limpia"
        >
          {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isPreviewMode ? 'Modo Editor' : 'Vista Previa'}</span>
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer hidden sm:block"
          title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Guardando...' : `Guardar en ${selectedRest?.name || 'Carta'}`}</span>
        </button>
      </div>
    </div>
  );
};
