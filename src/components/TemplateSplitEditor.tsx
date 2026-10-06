import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Restaurant, 
  MenuTemplate, 
  MenuItem, 
  MenuCategory, 
  RestaurantBranding 
} from '../types';
import { INITIAL_MENU_TEMPLATES } from '../data/menuTemplatesData';
import { CanvasElement, CanvasConfig, HistoryState } from './canvas-editor/types';
import { 
  createBlankCanvas,
  createInitialCanvasElements, 
  sanitizeCanvasElement, 
  extractBrandingFromCanvas, 
  DEFAULT_CANVAS_WIDTH, 
  DEFAULT_CANVAS_HEIGHT 
} from './canvas-editor/canvasUtils';
import { EditorTopBar } from './canvas-editor/EditorTopBar';
import { ToolboxSidebar } from './canvas-editor/ToolboxSidebar';
import { InteractiveCanvas } from './canvas-editor/InteractiveCanvas';
import { PropertiesInspector } from './canvas-editor/PropertiesInspector';
import { 
  CheckCircle2, 
  Sparkles, 
  FolderOpen, 
  FilePlus2, 
  LayoutTemplate, 
  X, 
  AlertTriangle, 
  Store, 
  BookmarkPlus, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Palette
} from 'lucide-react';

interface TemplateSplitEditorProps {
  restaurants: Restaurant[];
  templates?: MenuTemplate[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  currentRestaurantId?: string;
  onUpdateRestaurant: (updated: Restaurant) => void;
  onOpenCustomerPreview: (restaurant: Restaurant) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onClose?: () => void;
}

export const TemplateSplitEditor: React.FC<TemplateSplitEditorProps> = ({
  restaurants = [],
  templates = INITIAL_MENU_TEMPLATES,
  menuItems = [],
  categories = [],
  currentRestaurantId,
  onUpdateRestaurant,
  onOpenCustomerPreview,
  onDeleteTemplate,
  onClose
}) => {
  // 1. Editor starts BLANK by default (No restaurant loaded initially)
  const [loadedRestaurant, setLoadedRestaurant] = useState<Restaurant | null>(null);
  const [isInitialBlankState, setIsInitialBlankState] = useState<boolean>(true);

  // Active sample item for dynamic preview
  const sampleItem: MenuItem = (loadedRestaurant 
    ? menuItems.find(i => i && i.restaurantId === loadedRestaurant.id)
    : menuItems[0]) || {
    id: 'sample-item-1',
    restaurantId: loadedRestaurant?.id || '',
    categoryId: 'cat-sample',
    name: 'Causa Acevichada Especial',
    description: 'Papa amarilla con ají amarillo, atún acevichado y palta fuerte.',
    price: 26.00,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 15,
    allergens: [],
    tags: ['Especialidad', 'Entrada'],
    availableAddons: [
      { id: 'add-1', name: 'Porción de Arroz', price: 6.00 },
      { id: 'add-2', name: 'Papas Nativas', price: 8.00 }
    ],
    suggestedObservations: ['Poco picante', 'Salsa aparte']
  };

  // 2. Canvas Elements & Config State (Start blank)
  const initialBlank = createBlankCanvas();
  const [elements, setElements] = useState<CanvasElement[]>(initialBlank.elements);
  const [config, setConfig] = useState<CanvasConfig>(initialBlank.config);

  // 3. Selection & Viewport State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState<number>(0.65);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [clipboard, setClipboard] = useState<CanvasElement | null>(null);

  // Modals
  const [isLoadMenuModalOpen, setIsLoadMenuModalOpen] = useState<boolean>(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [selectedRestaurantToApply, setSelectedRestaurantToApply] = useState<string>('');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('Nueva Plantilla Personalizada');
  const [newTemplateDesc, setNewTemplateDesc] = useState<string>('Diseño creado desde el editor gráfico');

  // 4. Undo / Redo History Stack
  const [history, setHistory] = useState<HistoryState[]>([
    { elements: initialBlank.elements, config: initialBlank.config, selectedId: null }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Show Toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Commit state to history stack
  const commitHistory = useCallback(() => {
    setHistory(prev => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      const nextState: HistoryState = {
        elements: elements.map((e, i) => sanitizeCanvasElement(e, i)),
        config: { ...config },
        selectedId
      };
      return [...upToCurrent, nextState];
    });
    setHistoryIndex(prev => prev + 1);
  }, [elements, config, selectedId, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const targetState = history[nextIndex];
      setElements(targetState.elements);
      setConfig(targetState.config);
      setSelectedId(targetState.selectedId);
      setHistoryIndex(nextIndex);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetState = history[nextIndex];
      setElements(targetState.elements);
      setConfig(targetState.config);
      setSelectedId(targetState.selectedId);
      setHistoryIndex(nextIndex);
    }
  }, [history, historyIndex]);

  // Fit canvas to screen
  const handleFitCanvas = useCallback(() => {
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetZoom = isMobileViewport ? 0.38 : 0.65;
    setZoom(targetZoom);
    setPan({ x: 0, y: 0 });
  }, []);

  // Update a single element
  const handleUpdateElement = useCallback((updated: CanvasElement) => {
    setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
  }, []);

  // Update canvas config
  const handleUpdateConfig = useCallback((updatedConfig: Partial<CanvasConfig>) => {
    setConfig(prev => ({ ...prev, ...updatedConfig }));
    commitHistory();
  }, [commitHistory]);

  // Add a new element to canvas
  const handleAddElement = useCallback((partial: Partial<CanvasElement>) => {
    setIsInitialBlankState(false);
    const nextZIndex = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) + 1 : 1;
    const newId = `elem-${partial.type || 'custom'}-${Date.now()}`;
    
    const defaultX = Math.round((config.width - (partial.width || 200)) / 2 + (Math.random() * 40 - 20));
    const defaultY = Math.round((config.height - (partial.height || 100)) / 2 + (Math.random() * 40 - 20));

    const newEl: CanvasElement = sanitizeCanvasElement({
      id: newId,
      name: partial.name || 'Nuevo Objeto',
      type: partial.type || 'text_custom',
      x: partial.x ?? defaultX,
      y: partial.y ?? defaultY,
      width: partial.width || 240,
      height: partial.height || 60,
      rotation: partial.rotation || 0,
      opacity: partial.opacity ?? 1,
      zIndex: nextZIndex,
      visible: true,
      locked: false,
      text: partial.text,
      fontSize: partial.fontSize || 16,
      fontFamily: partial.fontFamily || "'Plus Jakarta Sans', sans-serif",
      fontWeight: partial.fontWeight || 600,
      textColor: partial.textColor || '#111827',
      backgroundColor: partial.backgroundColor,
      borderRadius: partial.borderRadius,
      borderWidth: partial.borderWidth,
      borderColor: partial.borderColor,
      boxShadow: partial.boxShadow,
      isDynamic: partial.isDynamic,
      dynamicField: partial.dynamicField
    }, elements.length);

    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    commitHistory();
    showToast(`✓ Objeto "${newEl.name}" añadido al lienzo.`);
  }, [elements, config, commitHistory, showToast]);

  // Duplicate an element
  const handleDuplicateElement = useCallback((element: CanvasElement) => {
    const nextZIndex = Math.max(...elements.map(e => e.zIndex)) + 1;
    const dupId = `elem-${element.type}-${Date.now()}`;
    const duplicated: CanvasElement = {
      ...element,
      id: dupId,
      name: `${element.name} (Copia)`,
      x: element.x + 25,
      y: element.y + 25,
      zIndex: nextZIndex
    };

    setElements(prev => [...prev, duplicated]);
    setSelectedId(duplicated.id);
    commitHistory();
    showToast(`✓ Objeto duplicado.`);
  }, [elements, commitHistory, showToast]);

  // Delete an element
  const handleDeleteElement = useCallback((id: string) => {
    const target = elements.find(e => e.id === id);
    if (!target || target.type === 'background') return;

    setElements(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
    commitHistory();
    showToast(`✓ Objeto eliminado del lienzo.`);
  }, [elements, selectedId, commitHistory, showToast]);

  // Reorder layer
  const handleReorderElement = useCallback((id: string, action: 'top' | 'up' | 'down' | 'bottom') => {
    setElements(prev => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex(e => e.id === id);
      if (idx === -1) return prev;

      const item = sorted[idx];
      sorted.splice(idx, 1);

      if (action === 'top') {
        sorted.push(item);
      } else if (action === 'bottom') {
        sorted.unshift(item);
      } else if (action === 'up') {
        const nextIdx = Math.min(sorted.length, idx + 1);
        sorted.splice(nextIdx, 0, item);
      } else if (action === 'down') {
        const prevIdx = Math.max(0, idx - 1);
        sorted.splice(prevIdx, 0, item);
      }

      return sorted.map((el, i) => ({ ...el, zIndex: i }));
    });
    commitHistory();
  }, [commitHistory]);

  // Align element
  const handleAlignElement = useCallback((alignment: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => {
    if (!selectedId) return;
    const target = elements.find(e => e.id === selectedId);
    if (!target) return;

    let nextX = target.x;
    let nextY = target.y;

    if (alignment === 'left') nextX = 30;
    if (alignment === 'center-x') nextX = Math.round((config.width - target.width) / 2);
    if (alignment === 'right') nextX = config.width - target.width - 30;
    if (alignment === 'top') nextY = 30;
    if (alignment === 'center-y') nextY = Math.round((config.height - target.height) / 2);
    if (alignment === 'bottom') nextY = config.height - target.height - 30;

    handleUpdateElement({ ...target, x: nextX, y: nextY });
    commitHistory();
  }, [selectedId, elements, config, handleUpdateElement, commitHistory]);

  // 1. CARGAR CARTA (Carga temporal de una carta existente con fidelidad 1:1)
  const handleLoadRestaurantMenu = useCallback((restaurant: Restaurant) => {
    const itemForRest = menuItems.find(i => i.restaurantId === restaurant.id) || sampleItem;
    const loadedData = createInitialCanvasElements(
      restaurant, 
      restaurant.branding, 
      itemForRest,
      menuItems,
      categories
    );
    
    setLoadedRestaurant(restaurant);
    setSelectedRestaurantToApply(restaurant.id);
    setElements(loadedData.elements);
    setConfig(loadedData.config);
    setSelectedId(null);
    setSelectedIds([]);
    setIsInitialBlankState(false);
    setIsLoadMenuModalOpen(false);

    setHistory([{ elements: loadedData.elements, config: loadedData.config, selectedId: null }]);
    setHistoryIndex(0);

    showToast(`✓ Carta de "${restaurant.name}" importada con fidelidad 1:1. Modifica el diseño y haz clic en "Aplicar en carta" para guardar.`);
  }, [menuItems, categories, sampleItem, showToast]);

  // 2. CREAR LIENZO EN BLANCO
  const handleStartBlankCanvas = useCallback(() => {
    const blank = createBlankCanvas();
    setLoadedRestaurant(null);
    setSelectedRestaurantToApply('');
    setElements(blank.elements);
    setConfig(blank.config);
    setSelectedId(null);
    setSelectedIds([]);
    setIsInitialBlankState(false);

    setHistory([{ elements: blank.elements, config: blank.config, selectedId: null }]);
    setHistoryIndex(0);

    showToast(`✓ Lienzo en blanco listo para diseñar.`);
  }, [showToast]);

  // Apply template preset
  const handleApplyTemplatePreset = useCallback((template: MenuTemplate) => {
    setIsInitialBlankState(false);
    const primary = template.primaryColor || '#D4AF37';
    const darkBg = template.darkBgColor || '#071A14';
    const cardBg = template.cardBgColor || '#141E2E';
    const fontDisplay = template.fontDisplay || "'Cinzel', serif";

    setConfig(prev => ({ ...prev, backgroundColor: darkBg }));

    setElements(prev => prev.map(el => {
      if (el.type === 'background') {
        return { ...el, backgroundColor: darkBg };
      }
      if (el.type === 'shape_rect' && el.name.toLowerCase().includes('ficha')) {
        return { ...el, backgroundColor: cardBg, borderColor: `${primary}40` };
      }
      if (el.type === 'dish_name' || el.type === 'restaurant_name') {
        return { ...el, fontFamily: fontDisplay };
      }
      if (el.type === 'dish_price' || el.type === 'order_button' || el.type === 'shape_badge') {
        return { ...el, backgroundColor: el.type === 'dish_price' ? undefined : primary, textColor: el.type === 'dish_price' ? primary : '#000000' };
      }
      return el;
    }));

    commitHistory();
    showToast(`✓ Plantilla "${template.name}" aplicada al lienzo.`);
  }, [commitHistory, showToast]);

  // Apply color palette
  const handleApplyColorPalette = useCallback((palette: any) => {
    setIsInitialBlankState(false);
    setConfig(prev => ({ ...prev, backgroundColor: palette.darkBgColor }));

    setElements(prev => prev.map(el => {
      if (el.type === 'background') {
        return { ...el, backgroundColor: palette.darkBgColor };
      }
      if (el.type === 'shape_rect' && el.name.toLowerCase().includes('ficha')) {
        return { ...el, backgroundColor: palette.cardBgColor, borderColor: `${palette.buttonColor}40` };
      }
      if (el.type === 'dish_name') {
        return { ...el, textColor: palette.textColor };
      }
      if (el.type === 'dish_price') {
        return { ...el, textColor: palette.priceColor || palette.buttonColor };
      }
      if (el.type === 'order_button' || el.type === 'shape_badge') {
        return { ...el, backgroundColor: palette.buttonColor, textColor: palette.buttonTextColor || '#000000' };
      }
      return el;
    }));

    commitHistory();
    showToast(`✓ Paleta "${palette.name}" aplicada al diseño.`);
  }, [commitHistory, showToast]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, Ctrl+D, Del, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName || ''))) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z') || (isCtrlOrCmd && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (isCtrlOrCmd && e.key.toLowerCase() === 'c' && selectedId) {
        const target = elements.find(el => el.id === selectedId);
        if (target) {
          setClipboard(target);
          showToast(`📋 Objeto copiado al portapapeles.`);
        }
        return;
      }
      if (isCtrlOrCmd && e.key.toLowerCase() === 'v' && clipboard) {
        e.preventDefault();
        handleDuplicateElement(clipboard);
        return;
      }
      if (isCtrlOrCmd && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        const target = elements.find(el => el.id === selectedId);
        if (target) handleDuplicateElement(target);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDeleteElement(selectedId);
        return;
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, clipboard, handleUndo, handleRedo, handleDuplicateElement, handleDeleteElement, showToast]);

  // 3. APLICAR EN CARTA (Guarda en la carta seleccionada con confirmación)
  const handleConfirmApplyToRestaurant = useCallback(() => {
    const targetRestId = selectedRestaurantToApply || loadedRestaurant?.id || restaurants[0]?.id;
    const targetRest = restaurants.find(r => r.id === targetRestId);

    if (!targetRest) {
      showToast(`⚠️ Selecciona un restaurante válido para aplicar el diseño.`);
      return;
    }

    setIsSaving(true);

    try {
      const updatedBranding = extractBrandingFromCanvas(elements, config, targetRest.branding);
      const safeLogo = targetRest.branding?.headerLogoUrl || targetRest.logoUrl;

      const updatedRestaurant: Restaurant = {
        ...targetRest,
        logoUrl: safeLogo,
        branding: updatedBranding
      };

      onUpdateRestaurant(updatedRestaurant);
      setLoadedRestaurant(updatedRestaurant);
      setIsApplyModalOpen(false);
      showToast(`✓ Diseño gráfico aplicado exitosamente a la carta de "${targetRest.name}".`);
    } catch (err) {
      console.error('Error applying canvas template to restaurant:', err);
      showToast(`⚠️ Ocurrió un error al aplicar. Intenta nuevamente.`);
    } finally {
      setIsSaving(false);
    }
  }, [selectedRestaurantToApply, loadedRestaurant, restaurants, elements, config, onUpdateRestaurant, showToast]);

  // 4. GUARDAR COMO PLANTILLA
  const handleSaveAsTemplate = useCallback(() => {
    if (!newTemplateName.trim()) {
      showToast(`⚠️ Ingresa un nombre para la plantilla.`);
      return;
    }

    const primaryElem = elements.find(e => e.type === 'order_button' || e.type === 'shape_badge' || e.type === 'dish_price');
    const bgElem = elements.find(e => e.type === 'background');

    const createdTemplate: MenuTemplate = {
      id: `custom-tpl-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Plantilla personalizada guardada desde el editor visual',
      category: 'MODERN',
      themeStyle: 'custom',
      layoutMode: 'grid',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      badge: 'Personalizado',
      tags: ['Personalizado', 'Canvas'],
      isCustomizable: true,
      primaryColor: primaryElem?.backgroundColor || config.backgroundColor || '#D4AF37',
      darkBgColor: bgElem?.backgroundColor || config.backgroundColor || '#071A14',
      cardBgColor: '#141E2E',
      textColor: '#FFFFFF',
      fontDisplay: "'Cinzel', serif"
    };

    setIsSaveTemplateModalOpen(false);
    showToast(`✓ Plantilla "${createdTemplate.name}" guardada con éxito.`);
  }, [newTemplateName, newTemplateDesc, elements, config, showToast]);

  const selectedElement = elements.find(e => e.id === selectedId) || null;

  return (
    <div className={`fixed inset-0 z-50 bg-neutral-100 text-neutral-900 flex flex-col overflow-hidden font-sans ${isFullscreen ? 'p-0' : ''}`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-2xl bg-neutral-900 text-white text-xs font-mono font-bold shadow-2xl flex items-center gap-2 animate-bounce border border-neutral-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP CONTROLS BAR */}
      <EditorTopBar
        loadedRestaurant={loadedRestaurant}
        onOpenLoadMenuModal={() => setIsLoadMenuModalOpen(true)}
        onOpenApplyModal={() => {
          if (loadedRestaurant) {
            setSelectedRestaurantToApply(loadedRestaurant.id);
          } else if (restaurants[0]) {
            setSelectedRestaurantToApply(restaurants[0].id);
          }
          setIsApplyModalOpen(true);
        }}
        onOpenSaveTemplateModal={() => setIsSaveTemplateModalOpen(true)}
        onNewBlankCanvas={handleStartBlankCanvas}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitCanvas={handleFitCanvas}
        showGrid={Boolean(config.showGrid)}
        onToggleGrid={() => handleUpdateConfig({ showGrid: !config.showGrid })}
        showSnapGuides={Boolean(config.showSnapGuides)}
        onToggleSnapGuides={() => handleUpdateConfig({ showSnapGuides: !config.showSnapGuides })}
        showSafetyMargins={Boolean(config.showSafetyMargins)}
        onToggleSafetyMargins={() => handleUpdateConfig({ showSafetyMargins: !config.showSafetyMargins })}
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onClose={onClose}
        isSaving={isSaving}
      />

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Toolbox & Layers Sidebar */}
        {!isPreviewMode && (
          <ToolboxSidebar
            elements={elements}
            config={config}
            selectedId={selectedId}
            templates={templates}
            onSelectElement={setSelectedId}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onReorderElement={(id, dir) => handleReorderElement(id, dir)}
            onApplyTemplatePreset={handleApplyTemplatePreset}
            onApplyColorPalette={handleApplyColorPalette}
          />
        )}

        {/* Center: Interactive Graphic Canvas Workspace */}
        <main className="flex-1 h-full relative overflow-hidden flex items-center justify-center bg-[#E5E7EB]">
          
          {/* Initial Blank Start State Overlay */}
          {isInitialBlankState && elements.length <= 1 && (
            <div className="absolute z-20 max-w-lg w-[90%] p-6 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-neutral-300 shadow-2xl text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-4 text-neutral-800 shadow-xs">
                <LayoutTemplate className="w-7 h-7 text-neutral-900" />
              </div>

              <h2 className="text-lg sm:text-xl font-black text-neutral-950 tracking-tight">
                Comienza un nuevo diseño
              </h2>
              <p className="text-xs text-neutral-600 mt-1.5 mb-6 max-w-sm">
                Diseña tu carta digital desde un lienzo en blanco, carga una carta existente como base o elige una plantilla prediseñada.
              </p>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setIsLoadMenuModalOpen(true)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white text-left transition cursor-pointer shadow-md group"
                >
                  <div className="p-2.5 rounded-xl bg-white/10 group-hover:bg-white/20 transition">
                    <FolderOpen className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">Cargar carta</span>
                    <span className="block text-[10px] text-neutral-300">Usa una carta existente como base</span>
                  </div>
                </button>

                <button
                  onClick={handleStartBlankCanvas}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-900 text-left border border-neutral-300 transition cursor-pointer shadow-2xs group"
                >
                  <div className="p-2.5 rounded-xl bg-neutral-100 group-hover:bg-neutral-200 transition">
                    <FilePlus2 className="w-5 h-5 text-neutral-800" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-950">Lienzo en blanco</span>
                    <span className="block text-[10px] text-neutral-500">Diseña con objetos desde cero</span>
                  </div>
                </button>
              </div>

              <p className="text-[11px] text-neutral-400">
                La carta original no se modificará hasta que hagas clic en <strong>"Aplicar en carta"</strong>.
              </p>
            </div>
          )}

          <InteractiveCanvas
            elements={elements}
            config={config}
            selectedId={selectedId}
            selectedIds={selectedIds}
            zoom={zoom}
            pan={pan}
            isPreviewMode={isPreviewMode}
            restaurant={loadedRestaurant || undefined}
            sampleItem={sampleItem}
            onSelectElement={setSelectedId}
            onUpdateElement={handleUpdateElement}
            onAddElement={handleAddElement}
            onCommitHistory={commitHistory}
            onPanChange={setPan}
          />
        </main>

        {/* Right: Contextual Properties Inspector */}
        {!isPreviewMode && (
          <PropertiesInspector
            selectedElement={selectedElement}
            config={config}
            restaurant={loadedRestaurant || undefined}
            onUpdateElement={handleUpdateElement}
            onUpdateConfig={handleUpdateConfig}
            onDuplicateElement={handleDuplicateElement}
            onDeleteElement={handleDeleteElement}
            onReorderElement={handleReorderElement}
            onAlignElement={handleAlignElement}
          />
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* MODAL 1: CARGAR CARTA EXISTENTE */}
      {isLoadMenuModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-950">Cargar carta en el editor</h3>
                  <p className="text-xs text-neutral-500">Selecciona una carta existente para cargar su diseño como referencia.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLoadMenuModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice */}
            <div className="mx-5 mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Edición temporal:</strong> Al cargar una carta, se copiará su diseño visual al editor. La carta original permanecerá intacta hasta que pulses explícitamente <strong>"Aplicar en carta"</strong>.
              </span>
            </div>

            {/* Restaurant List */}
            <div className="p-5 space-y-2.5 max-h-[360px] overflow-y-auto">
              {restaurants.length === 0 ? (
                <p className="text-center text-xs text-neutral-500 py-6">No hay restaurantes registrados en el sistema.</p>
              ) : (
                restaurants.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleLoadRestaurantMenu(r)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-3">
                      {r.logoUrl ? (
                        <img 
                          src={r.logoUrl} 
                          alt={r.name} 
                          className="w-10 h-10 rounded-xl object-contain bg-white border border-neutral-200 p-0.5 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5 text-neutral-500" />
                        </div>
                      )}
                      <div>
                        <span className="block text-xs font-bold text-neutral-900 group-hover:text-black">
                          {r.name}
                        </span>
                        <span className="block text-[10px] text-neutral-500">
                          {r.cuisineType || 'Restaurante'} • Moneda: {r.currency || 'S/'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-neutral-600 group-hover:text-black">
                      <span>Cargar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setIsLoadMenuModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: APLICAR EN CARTA (CONFIRMACIÓN) */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-950">Aplicar diseño en carta</h3>
                  <p className="text-xs text-neutral-500">Confirma la aplicación del diseño actual sobre la carta digital.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Target Restaurant Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Restaurante destino:
                </label>
                <select
                  value={selectedRestaurantToApply}
                  onChange={(e) => setSelectedRestaurantToApply(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-neutral-950 cursor-pointer"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {loadedRestaurant?.id === r.id ? '(Carta abierta en el editor)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guarantees / Safety list */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5 text-xs">
                <div className="flex items-start gap-2 text-neutral-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Diseño gráfico actualizado:</strong> Se aplicarán fondos, colores, tipografías, tarjetas y elementos visuales.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-neutral-700">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Datos comerciales intactos:</strong> Los nombres de platos, precios, categorías, adicionales, observaciones y pedidos se mantendrán 100% seguros y sin modificaciones.
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmApplyToRestaurant}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isSaving ? 'Aplicando cambios...' : 'Confirmar y aplicar en carta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: GUARDAR PLANTILLA */}
      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-950">Guardar como Plantilla</h3>
                  <p className="text-xs text-neutral-500">Guarda este diseño para reutilizarlo en cualquier carta.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Nombre de la plantilla:</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-xs font-medium text-neutral-900 focus:outline-neutral-950"
                  placeholder="Ej: Elegancia Marina Oscura"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Descripción:</label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 text-xs font-medium text-neutral-900 focus:outline-neutral-950 resize-none"
                  placeholder="Describe el estilo y temática de esta plantilla..."
                />
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsTemplate}
                className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                Guardar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
