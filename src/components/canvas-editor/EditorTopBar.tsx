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
  FolderOpen,
  Sparkles,
  BookmarkPlus,
  FilePlus2,
  CheckCircle2
} from 'lucide-react';
import { Restaurant } from '../../types';
import { getAssetUrl } from '../../utils/urlBase';

interface EditorTopBarProps {
  loadedRestaurant: Restaurant | null;
  onOpenLoadMenuModal: () => void;
  onOpenApplyModal: () => void;
  onOpenSaveTemplateModal: () => void;
  onNewBlankCanvas: () => void;
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
  onClose?: () => void;
  isSaving?: boolean;
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  loadedRestaurant,
  onOpenLoadMenuModal,
  onOpenApplyModal,
  onOpenSaveTemplateModal,
  onNewBlankCanvas,
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
  onClose,
  isSaving = false
}) => {
  return (
    <header className="h-16 px-3 sm:px-5 bg-white border-b border-neutral-200 shadow-xs flex items-center justify-between shrink-0 select-none z-30 text-neutral-900">
      
      {/* Left: Brand / Return & Carta Status */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 border border-neutral-300 transition cursor-pointer"
            title="Cerrar editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <img 
            src={getAssetUrl('/huevofrito.svg')} 
            alt="Micarta" 
            className="w-7 h-7 object-contain shrink-0 border-0 shadow-none outline-none"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black tracking-tight text-neutral-950 uppercase">
                Editor de Plantillas
              </span>
            </div>
            
            {/* Status Indicator */}
            {loadedRestaurant ? (
              <div className="flex items-center gap-1 text-[11px] text-amber-800 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="truncate max-w-[120px] sm:max-w-[180px]">
                  Carta: <strong className="text-neutral-900">{loadedRestaurant.name}</strong> (Borrador temporal)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-400" />
                <span>Lienzo nuevo / Sin carta cargada</span>
              </div>
            )}
          </div>
        </div>

        {/* Action: Cargar Carta */}
        <button
          onClick={onOpenLoadMenuModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-black border border-neutral-300 transition cursor-pointer text-xs font-bold shadow-2xs"
          title="Cargar una carta existente como base de edición temporal"
        >
          <FolderOpen className="w-3.5 h-3.5 text-neutral-700" />
          <span>Cargar carta</span>
        </button>

        {/* Action: Nuevo Lienzo */}
        <button
          onClick={onNewBlankCanvas}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-600 hover:text-black border border-neutral-200 transition cursor-pointer text-xs"
          title="Comenzar un nuevo diseño en blanco"
        >
          <FilePlus2 className="w-3.5 h-3.5" />
          <span>Lienzo nuevo</span>
        </button>
      </div>

      {/* Center: Undo/Redo, Zoom & Viewport Tools */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition ${
              canUndo ? 'text-neutral-800 hover:bg-white hover:shadow-xs cursor-pointer' : 'text-neutral-400 cursor-not-allowed'
            }`}
            title="Deshacer (Ctrl + Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition ${
              canRedo ? 'text-neutral-800 hover:bg-white hover:shadow-xs cursor-pointer' : 'text-neutral-400 cursor-not-allowed'
            }`}
            title="Rehacer (Ctrl + Shift + Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
          <button
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            className="p-1.5 rounded-lg text-neutral-700 hover:bg-white hover:shadow-xs transition cursor-pointer"
            title="Reducir Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onFitCanvas}
            className="px-2.5 py-1 text-[11px] font-mono font-bold text-neutral-800 hover:text-black transition cursor-pointer"
            title="Ajustar al área de trabajo"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.1))}
            className="p-1.5 rounded-lg text-neutral-700 hover:bg-white hover:shadow-xs transition cursor-pointer"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Toggles: Grid, Magnet Snapping, Safety Margins */}
        <div className="hidden lg:flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            onClick={onToggleGrid}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showGrid ? 'bg-white text-black border border-neutral-300 shadow-xs' : 'text-neutral-500 hover:text-black'
            }`}
            title="Mostrar / Ocultar Cuadrícula"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleSnapGuides}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showSnapGuides ? 'bg-white text-black border border-neutral-300 shadow-xs' : 'text-neutral-500 hover:text-black'
            }`}
            title="Guías Magnéticas de Alineación"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleSafetyMargins}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showSafetyMargins ? 'bg-white text-black border border-neutral-300 shadow-xs' : 'text-neutral-500 hover:text-black'
            }`}
            title="Márgenes de Seguridad Móvil"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Preview Mode, Guardar Plantilla & Aplicar en Carta */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Toggle Preview */}
        <button
          onClick={onTogglePreview}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
            isPreviewMode 
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' 
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
          }`}
          title="Alternar entre modo Editor y Vista Previa limpia"
        >
          {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isPreviewMode ? 'Editor' : 'Vista Previa'}</span>
        </button>

        {/* Guardar como Plantilla */}
        <button
          onClick={onOpenSaveTemplateModal}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-black border border-neutral-300 text-xs font-bold transition cursor-pointer"
          title="Guardar este diseño como una plantilla reutilizable"
        >
          <BookmarkPlus className="w-3.5 h-3.5 text-neutral-600" />
          <span>Guardar Plantilla</span>
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black border border-neutral-300 transition cursor-pointer hidden xl:block"
          title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Main CTA: APLICAR EN CARTA */}
        <button
          onClick={onOpenApplyModal}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {loadedRestaurant ? `Aplicar en ${loadedRestaurant.name}` : 'Aplicar en carta'}
          </span>
        </button>
      </div>
    </header>
  );
};
