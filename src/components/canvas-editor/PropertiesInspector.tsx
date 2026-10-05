import React from 'react';
import { 
  Sliders, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Type,
  Palette,
  Sparkles,
  Maximize2,
  Square,
  CornerDownRight,
  Sun,
  Shield,
  RotateCw
} from 'lucide-react';
import { CanvasElement, CanvasConfig, CANVAS_FONTS, PRESET_COLOR_SWATCHES } from './types';
import { Restaurant } from '../../types';

interface PropertiesInspectorProps {
  selectedElement: CanvasElement | null;
  config: CanvasConfig;
  restaurant?: Restaurant;
  onUpdateElement: (updated: CanvasElement) => void;
  onUpdateConfig: (updatedConfig: Partial<CanvasConfig>) => void;
  onDuplicateElement: (element: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
  onReorderElement: (id: string, action: 'top' | 'up' | 'down' | 'bottom') => void;
  onAlignElement: (alignment: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => void;
}

export const PropertiesInspector: React.FC<PropertiesInspectorProps> = ({
  selectedElement,
  config,
  restaurant,
  onUpdateElement,
  onUpdateConfig,
  onDuplicateElement,
  onDeleteElement,
  onReorderElement,
  onAlignElement
}) => {
  if (!selectedElement) {
    // GLOBAL CANVAS PROPERTIES (When nothing is selected)
    return (
      <aside className="w-72 sm:w-80 bg-white border-l border-neutral-200 p-4 overflow-y-auto space-y-4 select-none text-neutral-900 shadow-xs z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-4 h-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950">
              Propiedades del Lienzo
            </h2>
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Ningún objeto seleccionado. Configura el fondo global y tamaño base de la carta.
          </p>
        </div>

        {/* Canvas Dimensions */}
        <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
            Dimensiones Base (px)
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-600 font-mono block mb-1">Ancho (W)</label>
              <input
                type="number"
                value={config.width}
                onChange={(e) => onUpdateConfig({ width: Math.max(320, parseInt(e.target.value) || 800) })}
                className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 font-bold focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-600 font-mono block mb-1">Alto (H)</label>
              <input
                type="number"
                value={config.height}
                onChange={(e) => onUpdateConfig({ height: Math.max(480, parseInt(e.target.value) || 1200) })}
                className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 font-bold focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>
          <p className="text-[10px] text-neutral-500">
            Base canónica: 800 × 1200 px (Escalado responsivo 1:1 en móvil y tablet).
          </p>
        </div>

        {/* Canvas Background Color */}
        <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
            Fondo de la Carta
          </span>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.backgroundColor.startsWith('#') ? config.backgroundColor : '#071A14'}
              onChange={(e) => onUpdateConfig({ backgroundColor: e.target.value })}
              className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
            />
            <input
              type="text"
              value={config.backgroundColor}
              onChange={(e) => onUpdateConfig({ backgroundColor: e.target.value })}
              className="flex-1 bg-white px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
              placeholder="#071A14"
            />
          </div>

          {/* Quick Swatches */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['#071A14', '#09090B', '#120404', '#18181B', '#09232F', '#000000', '#F8FAFC', '#EAEBDC'].map(col => (
              <button
                key={col}
                onClick={() => onUpdateConfig({ backgroundColor: col })}
                className="w-6 h-6 rounded-md border border-neutral-300 transition hover:scale-110 cursor-pointer shadow-2xs"
                style={{ backgroundColor: col }}
                title={col}
              />
            ))}
          </div>
        </div>

        {/* Instructions Card */}
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 space-y-1.5">
          <p className="font-bold text-neutral-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Atajos Rápidos
          </p>
          <p>• Haz clic sobre cualquier objeto para moverlo y transformarlo.</p>
          <p>• Usa las flechas del teclado para mover con precisión milimétrica (Shift para pasos de 10px).</p>
          <p>• Arrastra desde las esquinas con Shift presionado para mantener proporciones.</p>
        </div>
      </aside>
    );
  }

  // CONTEXTUAL INSPECTOR FOR SELECTED ELEMENT
  return (
    <aside className="w-72 sm:w-80 bg-white border-l border-neutral-200 p-4 overflow-y-auto space-y-4 select-none text-neutral-900 shadow-xs z-20">
      
      {/* Header with Element Name & Type */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-bold uppercase tracking-wider inline-block mb-1 border border-neutral-200">
            {selectedElement.type.replace('_', ' ')}
          </span>
          <input
            type="text"
            value={selectedElement.name}
            onChange={(e) => onUpdateElement({ ...selectedElement, name: e.target.value })}
            className="text-xs font-bold text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-neutral-900 focus:outline-none w-full"
          />
        </div>

        {/* Lock / Unlock Toggle */}
        <button
          onClick={() => onUpdateElement({ ...selectedElement, locked: !selectedElement.locked })}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            selectedElement.locked 
              ? 'bg-amber-50 text-amber-600 border-amber-300' 
              : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:text-black hover:bg-neutral-200'
          }`}
          title={selectedElement.locked ? 'Desbloquear objeto' : 'Bloquear objeto'}
        >
          {selectedElement.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 1. Coordenadas y Dimensiones Exactas */}
      <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
        <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
          📐 Posición & Dimensiones (px)
        </span>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">X (Horizontal)</label>
            <input
              type="number"
              value={selectedElement.x}
              onChange={(e) => onUpdateElement({ ...selectedElement, x: parseInt(e.target.value) || 0 })}
              className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 font-bold focus:outline-none focus:border-neutral-900"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">Y (Vertical)</label>
            <input
              type="number"
              value={selectedElement.y}
              onChange={(e) => onUpdateElement({ ...selectedElement, y: parseInt(e.target.value) || 0 })}
              className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 font-bold focus:outline-none focus:border-neutral-900"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">Ancho (W)</label>
            <input
              type="number"
              value={selectedElement.width}
              onChange={(e) => onUpdateElement({ ...selectedElement, width: Math.max(10, parseInt(e.target.value) || 10) })}
              className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 font-bold focus:outline-none focus:border-neutral-900"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">Alto (H)</label>
            <input
              type="number"
              value={selectedElement.height}
              onChange={(e) => onUpdateElement({ ...selectedElement, height: Math.max(10, parseInt(e.target.value) || 10) })}
              className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 font-bold focus:outline-none focus:border-neutral-900"
            />
          </div>
        </div>

        {/* Rotación y Opacidad */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200">
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1 flex items-center gap-1">
              <RotateCw className="w-2.5 h-2.5" /> Rotación (°)
            </label>
            <input
              type="number"
              value={selectedElement.rotation || 0}
              onChange={(e) => onUpdateElement({ ...selectedElement, rotation: (parseInt(e.target.value) || 0) % 360 })}
              className="w-full bg-white px-2 py-1 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1 flex items-center gap-1">
              <Sun className="w-2.5 h-2.5" /> Opacidad (%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedElement.opacity ?? 1}
              onChange={(e) => onUpdateElement({ ...selectedElement, opacity: parseFloat(e.target.value) })}
              className="w-full accent-neutral-900 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. Alineación Rápida */}
      <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
        <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
          🎯 Alineación en el Lienzo
        </span>

        <div className="grid grid-cols-6 gap-1">
          <button
            onClick={() => onAlignElement('left')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-700 hover:text-black flex items-center justify-center transition cursor-pointer border border-neutral-200 shadow-2xs"
            title="Alinear a la Izquierda"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlignElement('center-x')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-700 hover:text-black flex items-center justify-center transition cursor-pointer border border-neutral-200 shadow-2xs"
            title="Centrar Horizontalmente"
          >
            <AlignHorizontalDistributeCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlignElement('right')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-700 hover:text-black flex items-center justify-center transition cursor-pointer border border-neutral-200 shadow-2xs"
            title="Alinear a la Derecha"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlignElement('top')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-700 hover:text-black flex items-center justify-center transition cursor-pointer border border-neutral-200 shadow-2xs"
            title="Alinear Arriba"
          >
            <ArrowUpToLine className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlignElement('center-y')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-700 hover:text-black flex items-center justify-center transition cursor-pointer border border-neutral-200 shadow-2xs"
            title="Centrar Verticalmente"
          >
            <AlignVerticalDistributeCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlignElement('bottom')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-700 hover:text-black flex items-center justify-center transition cursor-pointer border border-neutral-200 shadow-2xs"
            title="Alinear Abajo"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Tipografía & Textos (Para elementos de texto) */}
      {(selectedElement.type.includes('text') || 
        selectedElement.type.includes('name') || 
        selectedElement.type.includes('desc') || 
        selectedElement.type.includes('price') || 
        selectedElement.type.includes('badge') || 
        selectedElement.type.includes('button') ||
        selectedElement.type.includes('addons') ||
        selectedElement.type.includes('observations')) && (
        <div className="space-y-2.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
          <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
            🔤 Tipografía & Estilo de Texto
          </span>

          {/* Text Content (if editable custom text) */}
          {!selectedElement.isDynamic && (
            <div>
              <label className="text-[10px] text-neutral-600 font-mono block mb-1">Contenido de Texto</label>
              <textarea
                value={selectedElement.text || ''}
                onChange={(e) => onUpdateElement({ ...selectedElement, text: e.target.value })}
                rows={2}
                className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 resize-none"
              />
            </div>
          )}

          {/* Font Family Selector */}
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">Familia Tipográfica</label>
            <select
              value={selectedElement.fontFamily || "'Plus Jakarta Sans', sans-serif"}
              onChange={(e) => onUpdateElement({ ...selectedElement, fontFamily: e.target.value })}
              className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
            >
              {CANVAS_FONTS.map(f => (
                <option key={f.value} value={f.value} className="bg-white text-neutral-900">
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-600 font-mono block mb-1">Tamaño (px)</label>
              <input
                type="number"
                value={selectedElement.fontSize || 16}
                onChange={(e) => onUpdateElement({ ...selectedElement, fontSize: parseInt(e.target.value) || 16 })}
                className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-600 font-mono block mb-1">Grosor (Peso)</label>
              <select
                value={selectedElement.fontWeight || 400}
                onChange={(e) => onUpdateElement({ ...selectedElement, fontWeight: parseInt(e.target.value) || e.target.value })}
                className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-none cursor-pointer"
              >
                <option value={400}>Regular (400)</option>
                <option value={500}>Medium (500)</option>
                <option value={600}>SemiBold (600)</option>
                <option value={700}>Bold (700)</option>
                <option value={800}>ExtraBold (800)</option>
                <option value={900}>Black (900)</option>
              </select>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">Color de Texto</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedElement.textColor?.startsWith('#') ? selectedElement.textColor : '#FFFFFF'}
                onChange={(e) => onUpdateElement({ ...selectedElement, textColor: e.target.value })}
                className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={selectedElement.textColor || '#FFFFFF'}
                onChange={(e) => onUpdateElement({ ...selectedElement, textColor: e.target.value })}
                className="flex-1 bg-white px-2 py-1 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none"
              />
            </div>

            {/* Quick Swatches */}
            <div className="flex flex-wrap gap-1 pt-1.5">
              {['#000000', '#111827', '#475569', '#FFFFFF', '#D4AF37', '#F59E0B', '#E11D48', '#0284C7', '#10B981'].map(c => (
                <button
                  key={c}
                  onClick={() => onUpdateElement({ ...selectedElement, textColor: c })}
                  className="w-5 h-5 rounded-md border border-neutral-300 transition hover:scale-110 cursor-pointer shadow-2xs"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">Alineación Horizontal</label>
            <div className="grid grid-cols-4 gap-1">
              {(['left', 'center', 'right', 'justify'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => onUpdateElement({ ...selectedElement, textAlign: align })}
                  className={`p-1.5 rounded-lg flex items-center justify-center transition cursor-pointer border ${
                    (selectedElement.textAlign || 'left') === align 
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' 
                      : 'bg-white text-neutral-700 hover:text-black border-neutral-200'
                  }`}
                >
                  {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                  {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                  {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                  {align === 'justify' && <AlignJustify className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Apariencia & Contenedores (Fondo, Bordes, Sombras) */}
      <div className="space-y-2.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
        <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
          🎨 Apariencia, Bordes & Sombra
        </span>

        {/* Background Color */}
        <div>
          <label className="text-[10px] text-neutral-600 font-mono block mb-1">Color de Fondo</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedElement.backgroundColor?.startsWith('#') ? selectedElement.backgroundColor : '#131D2D'}
              onChange={(e) => onUpdateElement({ ...selectedElement, backgroundColor: e.target.value })}
              className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
            />
            <input
              type="text"
              value={selectedElement.backgroundColor || ''}
              onChange={(e) => onUpdateElement({ ...selectedElement, backgroundColor: e.target.value })}
              placeholder="transparent"
              className="flex-1 bg-white px-2 py-1 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none"
            />
            <button
              onClick={() => onUpdateElement({ ...selectedElement, backgroundColor: 'transparent' })}
              className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-[10px] text-neutral-800 cursor-pointer font-medium"
            >
              Ninguno
            </button>
          </div>
        </div>

        {/* Border Radius & Border Width */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">Radio Esquinas (px)</label>
            <input
              type="number"
              value={typeof selectedElement.borderRadius === 'number' ? selectedElement.borderRadius : (parseInt(selectedElement.borderRadius as any) || 0)}
              onChange={(e) => onUpdateElement({ ...selectedElement, borderRadius: parseInt(e.target.value) || 0 })}
              className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">Grosor Borde (px)</label>
            <input
              type="number"
              value={selectedElement.borderWidth || 0}
              onChange={(e) => onUpdateElement({ ...selectedElement, borderWidth: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Border Color (if borderWidth > 0) */}
        {(selectedElement.borderWidth || 0) > 0 && (
          <div>
            <label className="text-[10px] text-neutral-600 font-mono block mb-1">Color del Borde</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedElement.borderColor?.startsWith('#') ? selectedElement.borderColor : '#D4AF37'}
                onChange={(e) => onUpdateElement({ ...selectedElement, borderColor: e.target.value })}
                className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={selectedElement.borderColor || '#D4AF37'}
                onChange={(e) => onUpdateElement({ ...selectedElement, borderColor: e.target.value })}
                className="flex-1 bg-white px-2 py-1 rounded-lg border border-neutral-300 text-xs font-mono text-neutral-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Shadow Presets */}
        <div>
          <label className="text-[10px] text-neutral-600 font-mono block mb-1">Sombra / Elevación</label>
          <select
            value={selectedElement.boxShadow ? 'custom' : 'none'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'none') onUpdateElement({ ...selectedElement, boxShadow: undefined });
              if (val === 'sutil') onUpdateElement({ ...selectedElement, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' });
              if (val === 'medium') onUpdateElement({ ...selectedElement, boxShadow: '0 12px 28px -8px rgba(0,0,0,0.15)' });
              if (val === 'intense') onUpdateElement({ ...selectedElement, boxShadow: '0 20px 45px -10px rgba(0,0,0,0.25)' });
              if (val === 'glow') onUpdateElement({ ...selectedElement, boxShadow: '0 0 25px rgba(212, 175, 55, 0.45)' });
            }}
            className="w-full bg-white px-2 py-1.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-none cursor-pointer"
          >
            <option value="none">Sin Sombra</option>
            <option value="sutil">Sutil (0 4px 12px)</option>
            <option value="medium">Media Elevada (0 12px 28px)</option>
            <option value="intense">Intensa Profunda (0 20px 45px)</option>
            <option value="glow">Brillo Dorado / Marca (Glow)</option>
          </select>
        </div>
      </div>

      {/* 5. Acciones de Capas & Gestión */}
      <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
        <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
          ⚡ Orden de Capas & Acciones
        </span>

        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => onReorderElement(selectedElement.id, 'top')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-800 flex flex-col items-center justify-center transition cursor-pointer text-[10px] border border-neutral-200 shadow-2xs font-medium"
            title="Traer al Frente"
          >
            <ArrowUpToLine className="w-3.5 h-3.5 mb-0.5 text-neutral-700" />
            <span>Frente</span>
          </button>
          <button
            onClick={() => onReorderElement(selectedElement.id, 'up')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-800 flex flex-col items-center justify-center transition cursor-pointer text-[10px] border border-neutral-200 shadow-2xs font-medium"
            title="Subir Capa"
          >
            <ArrowUp className="w-3.5 h-3.5 mb-0.5 text-neutral-700" />
            <span>Subir</span>
          </button>
          <button
            onClick={() => onReorderElement(selectedElement.id, 'down')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-800 flex flex-col items-center justify-center transition cursor-pointer text-[10px] border border-neutral-200 shadow-2xs font-medium"
            title="Bajar Capa"
          >
            <ArrowDown className="w-3.5 h-3.5 mb-0.5 text-neutral-700" />
            <span>Bajar</span>
          </button>
          <button
            onClick={() => onReorderElement(selectedElement.id, 'bottom')}
            className="p-2 bg-white hover:bg-neutral-100 rounded-lg text-neutral-800 flex flex-col items-center justify-center transition cursor-pointer text-[10px] border border-neutral-200 shadow-2xs font-medium"
            title="Enviar al Fondo"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 mb-0.5 text-neutral-700" />
            <span>Fondo</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={() => onDuplicateElement(selectedElement)}
            className="py-2 px-3 rounded-xl bg-black hover:bg-neutral-800 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Copy className="w-3.5 h-3.5 text-neutral-300" />
            <span>Duplicar</span>
          </button>

          {selectedElement.type !== 'background' && (
            <button
              onClick={() => onDeleteElement(selectedElement.id)}
              className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          )}
        </div>
      </div>

    </aside>
  );
};
