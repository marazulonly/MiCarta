import React, { useState } from 'react';
import { 
  Layers, 
  PlusCircle, 
  Plus,
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
  Sliders,
  Check,
  MapPin,
  FolderOpen
} from 'lucide-react';
import { CanvasElement, CanvasConfig, CANVAS_FONTS } from './types';
import { MenuTemplate, Restaurant } from '../../types';
import { getZoneForElement } from './canvasUtils';

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
  savedTemplates?: MenuTemplate[];
}

type SidebarTab = 'layers' | 'insert' | 'templates' | 'palettes' | 'saved-templates';

const QUICK_PALETTES = [
  {
    name: 'Fuego Voraz (Rojo & Oro)',
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
  onApplyColorPalette,
  savedTemplates
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('layers');

  // Sorted layers (top-most in z-index first)
  const layerList = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <aside className="w-72 sm:w-80 bg-white border-r border-neutral-200 flex flex-col shrink-0 select-none overflow-hidden z-20 text-neutral-900 shadow-xs">
      
      {/* Navigation Segmented Control */}
      <div className="p-2 border-b border-neutral-200 bg-neutral-100 grid grid-cols-5 gap-1">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'layers' 
              ? 'bg-white text-neutral-950 border border-neutral-300 shadow-xs' 
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
          }`}
          title="Capas del Lienzo"
        >
          <Layers className="w-4 h-4 mb-1 text-neutral-700" />
          <span>Capas ({elements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('insert')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'insert' 
              ? 'bg-white text-neutral-950 border border-neutral-300 shadow-xs' 
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
          }`}
          title="Añadir Elementos"
        >
          <PlusCircle className="w-4 h-4 mb-1 text-neutral-800" />
          <span>Añadir</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'templates' 
              ? 'bg-white text-neutral-950 border border-neutral-300 shadow-xs' 
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
          }`}
          title="Plantillas Predefinidas"
        >
          <LayoutTemplate className="w-4 h-4 mb-1 text-neutral-700" />
          <span>Estilos</span>
        </button>

        <button
          onClick={() => setActiveTab('saved-templates')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'saved-templates' 
              ? 'bg-white text-neutral-950 border border-neutral-300 shadow-xs' 
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
          }`}
          title="Mis Plantillas"
        >
          <FolderOpen className="w-4 h-4 mb-1 text-neutral-700" />
          <span>Mis</span>
        </button>

        <button
          onClick={() => setActiveTab('palettes')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'palettes' 
              ? 'bg-white text-neutral-950 border border-neutral-300 shadow-xs' 
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
          }`}
          title="Paletas de Color"
        >
          <Palette className="w-4 h-4 mb-1 text-neutral-700" />
          <span>Paletas</span>
        </button>
      </div>

      {/* BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-neutral-50/50">
        
        {/* ========================================================================= */}
        {/* TAB 1: LAYERS TREE (GROUPED BY THE 3 ZONES)                               */}
        {/* ========================================================================= */}
        {activeTab === 'layers' && (() => {
          const headerElems = layerList.filter(e => (e.zone === 'header' || getZoneForElement(e) === 'header') && e.type !== 'background');
          const bodyElems = layerList.filter(e => (e.zone === 'body' || (!e.zone && getZoneForElement(e) === 'body')) && e.type !== 'background');
          const footerElems = layerList.filter(e => (e.zone === 'footer' || getZoneForElement(e) === 'footer') && e.type !== 'background');
          const bgElem = layerList.find(e => e.type === 'background');

          const renderLayerItem = (el: CanvasElement, idx: number) => {
            const isSelected = selectedId === el.id;
            return (
              <div
                key={el.id}
                onClick={() => onSelectElement(el.id)}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer group shadow-xs ${
                  isSelected 
                    ? 'bg-neutral-900 border-neutral-900 shadow-md text-white ring-2 ring-neutral-400/40' 
                    : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100 hover:border-neutral-300'
                }`}
              >
                {/* Layer Type Icon */}
                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                  {el.type.includes('dish') ? (
                    <Utensils className="w-3.5 h-3.5 text-amber-500" />
                  ) : el.type.includes('image') || el.type.includes('logo') ? (
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  ) : el.type.includes('text') || el.type.includes('name') ? (
                    <Type className="w-3.5 h-3.5 text-purple-600" />
                  ) : el.type.includes('badge') || el.type.includes('button') ? (
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                </div>

                {/* Name & Coordinates summary */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                    {el.name}
                  </p>
                  <p className={`text-[10px] font-mono ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {el.width}×{el.height}px · ({el.x}, {el.y})
                  </p>
                </div>

                {/* Layer Action Icons */}
                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateElement({ ...el, visible: !el.visible });
                    }}
                    className={`p-1 rounded transition cursor-pointer ${
                      isSelected 
                        ? (el.visible ? 'text-white' : 'text-neutral-500') 
                        : (el.visible ? 'text-neutral-700 hover:text-black' : 'text-neutral-400')
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
                      el.locked ? 'text-amber-500' : (isSelected ? 'text-neutral-300 hover:text-white' : 'text-neutral-500 hover:text-black')
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
                      className="p-1 text-rose-500 hover:text-rose-700 rounded transition cursor-pointer"
                      title="Eliminar objeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-4">
              
              {/* SECTION 1: CABECERA DE CARTA (ESTÁTICA) */}
              <div className="space-y-1.5 p-2.5 rounded-2xl bg-blue-50/50 border border-blue-200/70">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[11px] font-mono text-blue-900 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    1. Cabecera (Estática)
                  </span>
                  <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-100 px-1.5 py-0.5 rounded">
                    {headerElems.length} capas
                  </span>
                </div>
                {headerElems.length === 0 ? (
                  <p className="text-[11px] text-blue-600/80 italic px-2 py-1">Sin elementos en la cabecera.</p>
                ) : (
                  headerElems.map((el, i) => renderLayerItem(el, i))
                )}
                <button
                  onClick={() => onAddElement({
                    name: 'Logo del Restaurante',
                    type: 'restaurant_logo',
                    zone: 'header',
                    x: Math.round((config.width - 160) / 2),
                    y: 35,
                    width: 160,
                    height: 80,
                    isDynamic: true,
                    dynamicField: 'restaurant_logo',
                    objectFit: 'contain'
                  })}
                  className="w-full mt-1 py-1.5 px-2 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-[10px] font-bold text-blue-800 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                  <span>Insertar Logo / Elemento</span>
                </button>
              </div>

              {/* SECTION 2: CUERPO DE LA CARTA (PLATOS DINÁMICOS) */}
              <div className="space-y-1.5 p-2.5 rounded-2xl bg-amber-50/50 border border-amber-200/70">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[11px] font-mono text-amber-900 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    <Utensils className="w-3 h-3 text-amber-600" />
                    2. Cuerpo de Carta (Platos)
                  </span>
                  <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                    {bodyElems.length} capas
                  </span>
                </div>
                {bodyElems.length === 0 ? (
                  <p className="text-[11px] text-amber-700/80 italic px-2 py-1">Sin platos en el cuerpo.</p>
                ) : (
                  bodyElems.map((el, i) => renderLayerItem(el, i))
                )}
                <button
                  onClick={() => {
                    const headerHeight = config.headerZoneHeight || 380;
                    const footerHeight = config.footerZoneHeight || 180;
                    const bElems = elements.filter(el => el.y >= headerHeight && el.y < (config.height - footerHeight));
                    const maxY = bElems.length > 0 ? Math.max(...bElems.map(el => el.y + el.height)) : headerHeight + 20;
                    const nextY = Math.min(maxY + 20, config.height - footerHeight - 160);

                    onAddElement({
                      name: 'Ficha de Plato Nuevo',
                      type: 'shape_rect',
                      zone: 'body',
                      x: 40,
                      y: nextY,
                      width: config.width - 80,
                      height: 140,
                      backgroundColor: '#1E293B',
                      borderRadius: 16,
                      borderColor: '#334155',
                      borderWidth: 1,
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                    });
                  }}
                  className="w-full mt-1 py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3 text-amber-200" />
                  <span>+ Añadir Plato al Cuerpo</span>
                </button>
              </div>

              {/* SECTION 3: PIE DE CARTA (FINAL) */}
              <div className="space-y-1.5 p-2.5 rounded-2xl bg-purple-50/50 border border-purple-200/70">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[11px] font-mono text-purple-900 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-purple-600" />
                    3. Pie de Carta (Final)
                  </span>
                  <span className="text-[10px] text-purple-800 font-mono font-bold bg-purple-100 px-1.5 py-0.5 rounded">
                    {footerElems.length} capas
                  </span>
                </div>
                {footerElems.length === 0 ? (
                  <p className="text-[11px] text-purple-700/80 italic px-2 py-1">Sin elementos en pie de carta.</p>
                ) : (
                  footerElems.map((el, i) => renderLayerItem(el, i))
                )}
                <button
                  onClick={() => {
                    const footerHeight = config.footerZoneHeight || 180;
                    const footerTop = config.height - footerHeight;
                    onAddElement({
                      name: 'Información & Contacto',
                      type: 'contact_info',
                      zone: 'footer',
                      text: '📍 Av. Principal 123 · 📞 +51 987 654 321 · Horario: 12:00pm - 11:00pm',
                      x: 40,
                      y: footerTop + 25,
                      width: config.width - 80,
                      height: 50,
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'center',
                      textColor: '#94A3B8'
                    });
                  }}
                  className="w-full mt-1 py-1.5 px-2 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-[10px] font-bold text-purple-800 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-purple-600" />
                  <span>Insertar Pie de Carta</span>
                </button>
              </div>

              {/* SECTION 4: FONDO DEL LIENZO */}
              {bgElem && (
                <div className="pt-2 border-t border-neutral-200">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block font-bold mb-1 px-1">
                    Fondo Base
                  </span>
                  {renderLayerItem(bgElem, 0)}
                </div>
              )}
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 2: INSERT TOOLBOX                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'insert' && (
          <div className="space-y-4">

            {/* ===================================================================== */}
            {/* ZONA 1: CABECERA DE CARTA (ESTÁTICA)                                  */}
            {/* ===================================================================== */}
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-blue-900 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  1. Cabecera (Estática)
                </span>
                <span className="text-[9px] font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                  Fija en superior
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddElement({
                    name: 'Logo del Restaurante',
                    type: 'restaurant_logo',
                    zone: 'header',
                    x: Math.round((config.width - 160) / 2),
                    y: 35,
                    width: 160,
                    height: 80,
                    isDynamic: true,
                    dynamicField: 'restaurant_logo',
                    objectFit: 'contain'
                  })}
                  className="p-2.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-left transition cursor-pointer shadow-xs group col-span-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 group-hover:text-blue-900">🖼️ Logo de Restaurante</p>
                      <p className="text-[10px] text-neutral-500 font-mono">Zona estática de cabecera</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Nombre del Restaurante',
                    type: 'restaurant_name',
                    zone: 'header',
                    x: 40,
                    y: 125,
                    width: config.width - 80,
                    height: 48,
                    fontSize: 28,
                    fontWeight: 800,
                    fontFamily: "'Cinzel', serif",
                    textAlign: 'center',
                    textColor: '#111827',
                    isDynamic: true,
                    dynamicField: 'restaurant_name'
                  })}
                  className="p-2 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-left transition cursor-pointer shadow-xs group"
                >
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-blue-900">Nombre Marca</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{`{{nombre}}`}</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Eslogan / Tagline',
                    type: 'restaurant_tagline',
                    zone: 'header',
                    x: 40,
                    y: 175,
                    width: config.width - 80,
                    height: 32,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textAlign: 'center',
                    textColor: '#64748B',
                    isDynamic: true,
                    dynamicField: 'restaurant_tagline'
                  })}
                  className="p-2 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-left transition cursor-pointer shadow-xs group"
                >
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-blue-900">Eslogan / Tagline</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{`{{eslogan}}`}</p>
                </button>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* ZONA 2: CUERPO DE LA CARTA (PLATOS DINÁMICOS)                        */}
            {/* ===================================================================== */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-900 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  2. Cuerpo de Carta (Platos)
                </span>
                <span className="text-[9px] font-mono text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  Dinámico
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    const headerHeight = config.headerZoneHeight || 260;
                    const footerHeight = config.footerZoneHeight || 180;
                    const bodyElems = elements.filter(el => el.y >= headerHeight && el.y < (config.height - footerHeight));
                    const maxY = bodyElems.length > 0 
                      ? Math.max(...bodyElems.map(el => el.y + el.height))
                      : headerHeight + 20;
                    const nextY = Math.min(maxY + 20, config.height - footerHeight - 160);

                    onAddElement({
                      name: 'Tarjeta de Plato Completa',
                      type: 'shape_rect',
                      zone: 'body',
                      x: 40,
                      y: nextY,
                      width: config.width - 80,
                      height: 140,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      borderColor: '#E2E8F0',
                      borderWidth: 1,
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)'
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-left transition cursor-pointer shadow-sm group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-200" />
                    <div>
                      <p className="text-xs font-bold text-white">+ Añadir Tarjeta de Plato</p>
                      <p className="text-[10px] text-amber-100">Se añade automáticamente al cuerpo</p>
                    </div>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onAddElement({
                      name: 'Categoría {{nombre_categoria}}',
                      type: 'category_pill',
                      zone: 'body',
                      text: 'ENTRADAS & CEVICHES',
                      width: 280,
                      height: 40,
                      fontSize: 16,
                      fontWeight: 800,
                      fontFamily: "'Cinzel', serif",
                      backgroundColor: '#FEF3C7',
                      textColor: '#92400E',
                      borderRadius: 10,
                      textAlign: 'center'
                    })}
                    className="p-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-left transition cursor-pointer shadow-xs"
                  >
                    <p className="text-xs font-bold text-neutral-900">Píldora Categoría</p>
                    <p className="text-[10px] text-neutral-500 font-mono">Separador sección</p>
                  </button>

                  <button
                    onClick={() => onAddElement({
                      name: 'Botón Pedir Plato',
                      type: 'order_button',
                      zone: 'body',
                      text: 'Pedir',
                      width: 110,
                      height: 38,
                      fontSize: 14,
                      fontWeight: 700,
                      backgroundColor: '#D97706',
                      textColor: '#FFFFFF',
                      borderRadius: 10
                    })}
                    className="p-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-left transition cursor-pointer shadow-xs"
                  >
                    <p className="text-xs font-bold text-neutral-900">Botón de Pedido</p>
                    <p className="text-[10px] text-neutral-500 font-mono">Acción interactiva</p>
                  </button>
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* ZONA 3: PIE DE CARTA (FINAL DEL CANVA)                                */}
            {/* ===================================================================== */}
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-purple-900 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  3. Pie de Carta (Final)
                </span>
                <span className="text-[9px] font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                  Inferior
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const footerHeight = config.footerZoneHeight || 180;
                    const footerTop = config.height - footerHeight;
                    onAddElement({
                      name: 'Información & Contacto',
                      type: 'contact_info',
                      zone: 'footer',
                      text: '📍 Av. Principal 123 · 📞 +51 987 654 321 · ⏰ 12:00pm - 11:00pm',
                      x: 40,
                      y: footerTop + 25,
                      width: config.width - 80,
                      height: 50,
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'center',
                      textColor: '#64748B'
                    });
                  }}
                  className="p-2.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-left transition cursor-pointer shadow-xs col-span-2 group"
                >
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-purple-900">📍 Contacto, Dirección & Horario</p>
                  <p className="text-[10px] text-neutral-500 font-mono">Pie de página con datos del local</p>
                </button>

                <button
                  onClick={() => {
                    const footerHeight = config.footerZoneHeight || 180;
                    const footerTop = config.height - footerHeight;
                    onAddElement({
                      name: 'Mensaje de Despedida',
                      type: 'footer_text',
                      zone: 'footer',
                      text: '¡Gracias por su visita! Todos los precios incluyen IGV.',
                      x: 40,
                      y: footerTop + 85,
                      width: config.width - 80,
                      height: 35,
                      fontSize: 12,
                      fontWeight: 500,
                      textAlign: 'center',
                      textColor: '#94A3B8'
                    });
                  }}
                  className="p-2 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-left transition cursor-pointer shadow-xs col-span-2"
                >
                  <p className="text-xs font-bold text-neutral-900">💬 Mensaje de Despedida & IGV</p>
                  <p className="text-[10px] text-neutral-500 font-mono">Agradecimiento al comensal</p>
                </button>
              </div>
            </div>

            {/* Otros elementos individuales */}
            <div className="space-y-2 pt-2 border-t border-neutral-200">
              <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
                🍽️ Elementos de Plato Individuales
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddElement({
                    name: 'Nombre del Plato {{nombre_plato}}',
                    type: 'dish_name',
                    width: 320,
                    height: 50,
                    fontSize: 24,
                    fontWeight: 800,
                    fontFamily: "'Cinzel', serif",
                    textColor: '#111827',
                    isDynamic: true,
                    dynamicField: 'dish_name'
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs group"
                >
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-black">Nombre Plato</p>
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
                    textColor: '#D97706',
                    isDynamic: true,
                    dynamicField: 'dish_price'
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs group"
                >
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-black">Precio</p>
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
                    textColor: '#475569',
                    isDynamic: true,
                    dynamicField: 'dish_description'
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs group"
                >
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-black">Descripción</p>
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
                    borderColor: '#00000020',
                    isDynamic: true,
                    dynamicField: 'dish_image'
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs group"
                >
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-black">Marco de Foto</p>
                  <p className="text-[10px] text-neutral-500 font-mono">Contenedor imagen</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Adicionales {{adicionales}}',
                    type: 'dish_addons',
                    width: 400,
                    height: 55,
                    fontSize: 12,
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    borderRadius: 10,
                    isDynamic: true,
                    dynamicField: 'dish_addons'
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs group"
                >
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-black">Adicionales</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{`{{adicionales}}`}</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Observaciones {{observaciones}}',
                    type: 'dish_observations',
                    width: 400,
                    height: 50,
                    fontSize: 12,
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    borderRadius: 10,
                    isDynamic: true,
                    dynamicField: 'dish_observations'
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs group"
                >
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-black">Observaciones</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{`{{termino/notas}}`}</p>
                </button>
              </div>
            </div>

            {/* 2. Textos Libres y Títulos */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
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
                    textColor: '#111827',
                    letterSpacing: 2
                  })}
                  className="w-full p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left flex items-center justify-between transition cursor-pointer shadow-xs"
                >
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Título Principal Grande</p>
                    <p className="text-[10px] text-neutral-500">26px · Cinzel / Serif</p>
                  </div>
                  <Type className="w-4 h-4 text-neutral-600" />
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Subtítulo / Sección',
                    type: 'text_custom',
                    text: 'Selección exclusiva de la estación marina',
                    width: 380,
                    height: 32,
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textColor: '#334155'
                  })}
                  className="w-full p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left flex items-center justify-between transition cursor-pointer shadow-xs"
                >
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Subtítulo de Sección</p>
                    <p className="text-[10px] text-neutral-500">15px · Medium</p>
                  </div>
                  <Type className="w-4 h-4 text-neutral-600" />
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
                    textColor: '#64748B'
                  })}
                  className="w-full p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left flex items-center justify-between transition cursor-pointer shadow-xs"
                >
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Párrafo Informativo</p>
                    <p className="text-[10px] text-neutral-500">13px · Regular</p>
                  </div>
                  <FileText className="w-4 h-4 text-neutral-600" />
                </button>
              </div>
            </div>

            {/* 3. Formas, Contenedores y Botones */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
                🎨 Formas, Cajas & Acciones
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddElement({
                    name: 'Ficha / Contenedor',
                    type: 'shape_rect',
                    width: 740,
                    height: 420,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)'
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs"
                >
                  <Square className="w-4 h-4 text-neutral-700 mb-1" />
                  <p className="text-xs font-bold text-neutral-900">Tarjeta Plato</p>
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
                    backgroundColor: '#000000',
                    textColor: '#FFFFFF',
                    borderRadius: 14
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs"
                >
                  <Tag className="w-4 h-4 text-neutral-700 mb-1" />
                  <p className="text-xs font-bold text-neutral-900">Insignia / Badge</p>
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
                    backgroundColor: '#000000',
                    textColor: '#FFFFFF',
                    borderRadius: 12
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 text-neutral-700 mb-1" />
                  <p className="text-xs font-bold text-neutral-900">Botón Pedir (+)</p>
                  <p className="text-[10px] text-neutral-500">Botón de orden</p>
                </button>

                <button
                  onClick={() => onAddElement({
                    name: 'Línea Separadora',
                    type: 'separator_line',
                    width: 500,
                    height: 20,
                    borderWidth: 2,
                    borderColor: '#CBD5E1'
                  })}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition cursor-pointer shadow-xs"
                >
                  <Minus className="w-4 h-4 text-neutral-700 mb-1" />
                  <p className="text-xs font-bold text-neutral-900">Separador</p>
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
            <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
              Plantillas Visuales
            </span>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Selecciona un estilo base. Tus elementos del canvas se adaptarán manteniendo la composición.
            </p>

            {templates.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => onApplyTemplatePreset(tmpl)}
                className="w-full p-3 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition flex items-start gap-3 cursor-pointer shadow-xs group"
              >
                <img 
                  src={tmpl.thumbnailUrl} 
                  alt={tmpl.name} 
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-200 group-hover:scale-105 transition-transform" 
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-bold uppercase inline-block mb-1 border border-neutral-200">
                    {tmpl.badge || 'Plantilla'}
                  </span>
                  <p className="text-xs font-bold text-neutral-900 truncate group-hover:text-black">
                    {tmpl.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                    {tmpl.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3.5: MIS PLANTILLAS GUARDADAS                                         */}
        {/* ========================================================================= */}
        {activeTab === 'saved-templates' && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
              Mis Plantillas
            </span>
            {savedTemplates && savedTemplates.length > 0 ? (
              savedTemplates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => onApplyTemplatePreset(tmpl)}
                  className="w-full p-3 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition flex items-start gap-3 cursor-pointer shadow-xs group"
                >
                  <img 
                    src={tmpl.thumbnailUrl} 
                    alt={tmpl.name} 
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-200 group-hover:scale-105 transition-transform" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate">
                      {tmpl.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6 px-4 border-2 border-dashed border-neutral-200 rounded-2xl">
                <FolderOpen className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                <p className="text-xs text-neutral-600">Aún no has guardado ninguna plantilla personalizada.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: QUICK COLOR PALETTES                                               */}
        {/* ========================================================================= */}
        {activeTab === 'palettes' && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono text-neutral-700 uppercase tracking-widest block font-bold">
              Paletas de Color de Autor
            </span>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Aplica combinaciones cromáticas de alta cocina a los fondos, botones y tarjetas con 1 clic.
            </p>

            {QUICK_PALETTES.map((pal, idx) => (
              <button
                key={`palette-${idx}`}
                onClick={() => onApplyColorPalette(pal)}
                className="w-full p-3 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-left transition flex flex-col gap-2 cursor-pointer shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-neutral-900 group-hover:text-black">
                    {pal.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300" style={{ backgroundColor: pal.darkBgColor }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300" style={{ backgroundColor: pal.buttonColor }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300" style={{ backgroundColor: pal.priceColor }} />
                  </div>
                </div>

                <p className="text-[10px] text-neutral-500">
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
