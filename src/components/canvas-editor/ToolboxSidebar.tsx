import React, { useState } from 'react';
import { 
  Layers, 
  PlusCircle, 
  LayoutTemplate, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Minus, 
  Tag, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Copy,
  Utensils,
  DollarSign,
  FileText,
  BadgePercent,
  Compass,
  Check
} from 'lucide-react';
import { CanvasElement, CanvasConfig, CANVAS_FONTS } from './types';
import { MenuTemplate, Restaurant } from '../../types';

interface ToolboxSidebarProps {
  elements: CanvasElement[];
  config: CanvasConfig;
  selectedId: string | null;
  templates: MenuTemplate[];
  onSelectElement: (id: string | null) => void;
  onAddElement: (newElement: Partial<CanvasElement>) => void;
  onUpdateElement: (updated: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
  onReorderElement: (id: string, direction: 'up' | 'down') => void;
  onApplyTemplatePreset: (template: MenuTemplate) => void;
  onApplyColorPalette: (palette: any) => void;
}

type SidebarTab = 'layers' | 'insert' | 'templates' | 'palettes';

const QUICK_PALETTES = [
  {
    name: 'Fuego Voraz',
    desc: 'Rojo Carmesí, Oro Brillante & Fondo Asfalto',
    darkBgColor: '#120404',
    cardBgColor: '#200a0a',
    buttonColor: '#E11D48',
    buttonTextColor: '#FFFFFF',
    textColor: '#FFF1F2',
    accentColor: '#F59E0B',
    priceColor: '#FBBF24'
  },
  {
    name: 'Oro & Esmeralda Imperial',
    desc: 'Verde Esmeralda Marmoleado & Acentos Oro',
    darkBgColor: '#071A14',
    cardBgColor: '#0c241c',
    buttonColor: '#D4AF37',
    buttonTextColor: '#000000',
    textColor: '#F5EFE0',
    accentColor: '#D4AF37',
    priceColor: '#DFB86C'
  },
  {
    name: 'Pizarra Grafito Criollo',
    desc: 'Tiza Blanca sobre Pizarra & Acento Ají Amarillo',
    darkBgColor: '#18181B',
    cardBgColor: '#27272A',
    buttonColor: '#F59E0B',
    buttonTextColor: '#000000',
    textColor: '#FAFAFA',
    accentColor: '#D97706',
    priceColor: '#FDE68A'
  },
  {
    name: 'Costa Marina Azul Petróleo',
    desc: 'Azul Profundo con Acentos Turquesa & Blanco Marfil',
    darkBgColor: '#09232F',
    cardBgColor: '#13394D',
    buttonColor: '#0284C7',
    buttonTextColor: '#FFFFFF',
    textColor: '#F0F9FF',
    accentColor: '#38BDF8',
    priceColor: '#BAE6FD'
  },
  {
    name: 'Cyber Neon Street',
    desc: 'Negro Profundo, Violeta Eléctrico & Rosa Neon',
    darkBgColor: '#09090B',
    cardBgColor: '#18181B',
    buttonColor: '#8B5CF6',
    buttonTextColor: '#FFFFFF',
    textColor: '#FFFFFF',
    accentColor: '#EC4899',
    priceColor: '#A78BFA'
  },
  {
    name: 'Bistró Minimal Monocromo',
    desc: 'Líneas Finas de 1px, Blanco Puro & Máxima Sobriedad',
    darkBgColor: '#000000',
    cardBgColor: '#121212',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#000000',
    textColor: '#E5E5E5',
    accentColor: '#A3A3A3',
    priceColor: '#FFFFFF'
  }
];

export const ToolboxSidebar: React.FC<ToolboxSidebarProps> = ({
  elements,
  config,
  selectedId,
  templates,
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onReorderElement,
  onApplyTemplatePreset,
  onApplyColorPalette
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('layers');

  // Sorted layers (top-most in z-index first)
  const layerList = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <aside className="w-72 sm:w-80 bg-[#0C1017] border-r border-neutral-800 flex flex-col shrink-0 select-none overflow-hidden z-20">
      
      {/* Navigation Segmented Control */}
      <div className="p-2 border-b border-neutral-800 bg-black/40 grid grid-cols-4 gap-1">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'layers' 
              ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
          title="Capas del Lienzo"
        >
          <Layers className="w-4 h-4 mb-1" />
          <span>Capas ({elements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('insert')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'insert' 
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700 shadow' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
          title="Añadir Elementos"
        >
          <PlusCircle className="w-4 h-4 mb-1" />
          <span>Añadir</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'templates' 
              ? 'bg-neutral-800 text-pink-400 border border-neutral-700 shadow' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
          title="Plantillas Predefinidas"
        >
          <LayoutTemplate className="w-4 h-4 mb-1" />
          <span>Estilos</span>
        </button>

        <button
          onClick={() => setActiveTab('palettes')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'palettes' 
              ? 'bg-neutral-800 text-emerald-400 border border-neutral-700 shadow' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
          title="Paletas de Color"
        >
          <Palette className="w-4 h-4 mb-1" />
          <span>Paletas</span>
        </button>
      </div>

      {/* BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        
        {/* ========================================================================= */}
        {/* TAB 1: LAYERS TREE                                                        */}
        {/* ========================================================================= */}
        {activeTab === 'layers' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                Jerarquía de Capas
              </span>
              <span className="text-[10px] text-neutral-500">
                Arriba = Frente
              </span>
            </div>

            {layerList.map((el, idx) => {
              const isSelected = selectedId === el.id;

              return (
                <div
                  key={el.id}
                  onClick={() => onSelectElement(el.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer group ${
                    isSelected 
                      ? 'bg-neutral-800/90 border-cyan-500/60 shadow-lg text-white ring-1 ring-cyan-500/30' 
                      : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800/40 hover:text-white'
                  }`}
                >
                  {/* Layer Type Icon */}
                  <div className="p-1.5 rounded-lg bg-black/40 text-neutral-400 shrink-0">
                    {el.type.includes('dish') ? (
                      <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    ) : el.type.includes('image') || el.type.includes('logo') ? (
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    ) : el.type.includes('text') || el.type.includes('name') ? (
                      <Type className="w-3.5 h-3.5 text-pink-400" />
                    ) : el.type.includes('badge') || el.type.includes('button') ? (
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                  </div>

                  {/* Name & Coordinates summary */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {el.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {el.width}×{el.height}px · ({el.x}, {el.y})
                    </p>
                  </div>

                  {/* Layer Action Icons */}
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    {/* Move Up in layer */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderElement(el.id, 'up');
                      }}
                      disabled={idx === 0}
                      className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Mover capa hacia el frente"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>

                    {/* Move Down in layer */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderElement(el.id, 'down');
                      }}
                      disabled={idx === layerList.length - 1}
                      className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Mover capa hacia atrás"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {/* Visibility Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElement({ ...el, visible: !el.visible });
                      }}
                      className={`p-1 rounded transition cursor-pointer ${
                        el.visible ? 'text-neutral-400 hover:text-white' : 'text-neutral-600'
                      }`}
                      title={el.visible ? 'Ocultar elemento' : 'Mostrar elemento'}
                    >
                      {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Lock Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateElement({ ...el, locked: !el.locked });
                      }}
                      className={`p-1 rounded transition cursor-pointer ${
                        el.locked ? 'text-amber-400' : 'text-neutral-400 hover:text-white'
                      }`}
                      title={el.locked ? 'Desbloquear elemento' : 'Bloquear elemento'}
                    >
                      {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete */}
                    {el.type !== 'background' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(el.id);
                        }}
                        className="p-1 text-neutral-500 hover:text-rose-400 rounded transition cursor-pointer"
                        title="Eliminar objeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INSERT TOOLBOX                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'insert' && (
          <div className="space-y-4">
            
            {/* 1. Elementos Dinámicos del Restaurante y Plato */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block font-bold">
                🍽️ Datos del Plato & Restaurante
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onAddElement({
                    name: 'Nombre del Plato {{nombre_plato}}',
                    type: 'dish_name',
                    width: 320,
                    height: 50,
                    fontSize: 24,
                    fontWeight: 800,
                    fontFamily: "'Cinzel', serif",
                    textColor: '#FFFFFF',
                    isDynamic: true,
                    dynamicField: 'dish_name'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-800 text-left transition cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">Nombre Plato</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{`{{nombre_plato}}`}</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Precio del Plato {{precio}}',
                    type: 'dish_price',
                    width: 160,
                    height: 44,
                    fontSize: 26,
                    fontWeight: 800,
                    fontFamily: "'Roboto Mono', monospace",
                    textColor: '#F59E0B',
                    isDynamic: true,
                    dynamicField: 'dish_price'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-800 text-left transition cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">Precio</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{`{{precio}}`}</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Descripción {{descripcion}}',
                    type: 'dish_description',
                    width: 340,
                    height: 70,
                    fontSize: 14,
                    fontWeight: 400,
                    fontFamily: "'Inter', sans-serif",
                    textColor: '#CBD5E1',
                    isDynamic: true,
                    dynamicField: 'dish_description'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-800 text-left transition cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">Descripción</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{`{{descripcion}}`}</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Foto del Plato',
                    type: 'dish_image_container',
                    width: 240,
                    height: 220,
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: '#D4AF3780',
                    isDynamic: true,
                    dynamicField: 'dish_image'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-800 text-left transition cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">Marco de Foto</p>
                  <p className="text-[10px] text-neutral-500 font-mono">Contenedor imagen</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Adicionales {{adicionales}}',
                    type: 'dish_addons',
                    width: 400,
                    height: 55,
                    fontSize: 12,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    isDynamic: true,
                    dynamicField: 'dish_addons'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-800 text-left transition cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">Adicionales</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{`{{adicionales}}`}</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Observaciones {{observaciones}}',
                    type: 'dish_observations',
                    width: 400,
                    height: 50,
                    fontSize: 12,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: 10,
                    isDynamic: true,
                    dynamicField: 'dish_observations'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 hover:bg-neutral-800 text-left transition cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">Observaciones</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{`{{termino/notas}}`}</p>
                </button>
              </div>
            </div>

            {/* 2. Textos Libres y Títulos */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                ✍️ Tipografía & Textos Libres
              </span>

              <div className="space-y-1.5">
                <button
                  onClick={() => onAddElement({
                    name: 'Título Principal',
                    type: 'text_custom',
                    text: 'ESPECIALIDADES DE LA CASA',
                    width: 420,
                    height: 48,
                    fontSize: 26,
                    fontWeight: 800,
                    fontFamily: "'Cinzel', serif",
                    textColor: '#D4AF37',
                    letterSpacing: 2
                  })}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-400/50 hover:bg-neutral-800 text-left flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-white">Título Principal Grande</p>
                    <p className="text-[10px] text-neutral-500">26px · Cinzel / Serif</p>
                  </div>
                  <Type className="w-4 h-4 text-cyan-400" />
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Subtítulo / Sección',
                    type: 'text_custom',
                    text: 'Selección exclusiva de la estación marina',
                    width: 380,
                    height: 32,
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textColor: '#E2E8F0'
                  })}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-400/50 hover:bg-neutral-800 text-left flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-white">Subtítulo de Sección</p>
                    <p className="text-[10px] text-neutral-500">15px · Medium</p>
                  </div>
                  <Type className="w-4 h-4 text-cyan-400" />
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Texto de Párrafo',
                    type: 'text_custom',
                    text: 'Todos nuestros platos son preparados al momento con ingredientes seleccionados de primera calidad.',
                    width: 400,
                    height: 55,
                    fontSize: 13,
                    fontWeight: 400,
                    fontFamily: "'Inter', sans-serif",
                    textColor: '#94A3B8'
                  })}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-400/50 hover:bg-neutral-800 text-left flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-white">Párrafo Informativo</p>
                    <p className="text-[10px] text-neutral-500">13px · Regular</p>
                  </div>
                  <FileText className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>

            {/* 3. Formas, Contenedores y Botones */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                🎨 Formas, Cajas & Acciones
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onAddElement({
                    name: 'Ficha / Contenedor',
                    type: 'shape_rect',
                    width: 740,
                    height: 420,
                    backgroundColor: '#131D2D',
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: '#D4AF3740',
                    boxShadow: '0 15px 35px -10px rgba(0,0,0,0.6)'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-400/50 hover:bg-neutral-800 text-left transition cursor-pointer"
                >
                  <Square className="w-4 h-4 text-emerald-400 mb-1" />
                  <p className="text-xs font-bold text-white">Tarjeta Plato</p>
                  <p className="text-[10px] text-neutral-500">Recuadro con sombra</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Badge / Distintivo',
                    type: 'shape_badge',
                    width: 140,
                    height: 28,
                    text: '★ ESPECIAL',
                    fontSize: 11,
                    fontWeight: 800,
                    backgroundColor: '#D4AF37',
                    textColor: '#000000',
                    borderRadius: 14
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-400/50 hover:bg-neutral-800 text-left transition cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-emerald-400 mb-1" />
                  <p className="text-xs font-bold text-white">Insignia / Badge</p>
                  <p className="text-[10px] text-neutral-500">Destacado / Nuevo</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Botón Pedir',
                    type: 'order_button',
                    width: 150,
                    height: 44,
                    text: 'Pedir al Plato',
                    fontSize: 13,
                    fontWeight: 700,
                    backgroundColor: '#D4AF37',
                    textColor: '#000000',
                    borderRadius: 12
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-400/50 hover:bg-neutral-800 text-left transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400 mb-1" />
                  <p className="text-xs font-bold text-white">Botón Pedir (+)</p>
                  <p className="text-[10px] text-neutral-500">Botón de orden</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Línea Separadora',
                    type: 'separator_line',
                    width: 500,
                    height: 20,
                    borderWidth: 2,
                    borderColor: '#D4AF3760'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-400/50 hover:bg-neutral-800 text-left transition cursor-pointer"
                >
                  <Minus className="w-4 h-4 text-emerald-400 mb-1" />
                  <p className="text-xs font-bold text-white">Separador</p>
                  <p className="text-[10px] text-neutral-500">Línea decorativa</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TEMPLATE PRESETS                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'templates' && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono text-pink-400 uppercase tracking-widest block font-bold">
              Plantillas Visuales
            </span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Selecciona un estilo base. Tus elementos del canvas se adaptarán manteniendo la composición.
            </p>

            {templates.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => onApplyTemplatePreset(tmpl)}
                className="w-full p-3 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-pink-400/50 hover:bg-neutral-800 text-left transition flex items-start gap-3 cursor-pointer group"
              >
                <img 
                  src={tmpl.thumbnailUrl} 
                  alt={tmpl.name} 
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-700 group-hover:scale-105 transition-transform" 
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold uppercase inline-block mb-1">
                    {tmpl.badge || 'Plantilla'}
                  </span>
                  <p className="text-xs font-bold text-white truncate group-hover:text-pink-300">
                    {tmpl.name}
                  </p>
                  <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                    {tmpl.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: QUICK COLOR PALETTES                                               */}
        {/* ========================================================================= */}
        {activeTab === 'palettes' && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
              Paletas de Color de Autor
            </span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Aplica combinaciones cromáticas de alta cocina a los fondos, botones y tarjetas con 1 clic.
            </p>

            {QUICK_PALETTES.map((pal, idx) => (
              <button
                key={`palette-${idx}`}
                onClick={() => onApplyColorPalette(pal)}
                className="w-full p-3 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-400/50 hover:bg-neutral-800 text-left transition flex flex-col gap-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300">
                    {pal.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pal.darkBgColor }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pal.buttonColor }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pal.priceColor }} />
                  </div>
                </div>

                <p className="text-[10px] text-neutral-400">
                  {pal.desc}
                </p>
              </button>
            ))}
          </div>
        )}

      </div>
    </aside>
  );
};
