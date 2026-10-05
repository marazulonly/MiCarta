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
import { CheckCircle2, Sparkles, Smartphone, Tablet, Monitor } from 'lucide-react';

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
  // 1. Target Restaurant State
  const [selectedRestId, setSelectedRestId] = useState<string>(
    currentRestaurantId || restaurants[0]?.id || ''
  );
  const selectedRestaurant = (restaurants || []).find(r => r && r.id === selectedRestId) || restaurants[0];

  // 2. Active Sample Item for dynamic preview
  const restItems = (menuItems || []).filter(i => i && i.restaurantId === selectedRestaurant?.id);
  const sampleItem: MenuItem = restItems[0] || {
    id: 'sample-item-1',
    restaurantId: selectedRestaurant?.id || '',
    categoryId: 'cat-sample',
    name: 'Lomo Saltado Jugoso al Wok',
    description: 'Trozos de lomo fino salteados a fuego vivo con cebolla roja, tomate fresco, cilantro y toque de pisco. Acompañado de papas doradas y arroz con choclo.',
    price: 48.00,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    isPopular: true,
    prepTimeMinutes: 20,
    allergens: [],
    tags: ['Especialidad', 'Carne'],
    availableAddons: [
      { id: 'add-1', name: 'Porción de Arroz', price: 6.00 },
      { id: 'add-2', name: 'Papas Nativas', price: 8.00 },
      { id: 'add-3', name: 'Huevo Frito', price: 3.50 }
    ],
    suggestedObservations: ['Término medio', 'Sin cebolla', 'Poco picante', 'Salsa aparte']
  };

  // 3. Canvas Elements & Config State
  const initialData = createInitialCanvasElements(selectedRestaurant, selectedRestaurant?.branding, sampleItem);
  const [elements, setElements] = useState<CanvasElement[]>(initialData.elements);
  const [config, setConfig] = useState<CanvasConfig>(initialData.config);

  // 4. Selection & Viewport State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState<number>(0.65);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [clipboard, setClipboard] = useState<CanvasElement | null>(null);

  // 5. Undo / Redo History Stack
  const [history, setHistory] = useState<HistoryState[]>([
    { elements: initialData.elements, config: initialData.config, selectedId: null }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Show Toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Sync canvas when restaurant selection changes
  useEffect(() => {
    if (selectedRestaurant) {
      const fresh = createInitialCanvasElements(selectedRestaurant, selectedRestaurant.branding, sampleItem);
      setElements(fresh.elements);
      setConfig(fresh.config);
      setSelectedId(null);
      setSelectedIds([]);
      setHistory([{ elements: fresh.elements, config: fresh.config, selectedId: null }]);
      setHistoryIndex(0);
    }
  }, [selectedRestId]);

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
    const nextZIndex = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) + 1 : 1;
    const newId = `elem-${partial.type || 'custom'}-${Date.now()}`;
    
    // Position near center of canvas with slight random offset
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
      textColor: partial.textColor || '#FFFFFF',
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

      // Re-assign continuous zIndexes
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

  // Apply template preset
  const handleApplyTemplatePreset = useCallback((template: MenuTemplate) => {
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

      // Undo: Ctrl+Z
      if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z') || (isCtrlOrCmd && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
        return;
      }
      // Copy: Ctrl+C
      if (isCtrlOrCmd && e.key.toLowerCase() === 'c' && selectedId) {
        const target = elements.find(el => el.id === selectedId);
        if (target) {
          setClipboard(target);
          showToast(`📋 Objeto copiado al portapapeles.`);
        }
        return;
      }
      // Paste: Ctrl+V
      if (isCtrlOrCmd && e.key.toLowerCase() === 'v' && clipboard) {
        e.preventDefault();
        handleDuplicateElement(clipboard);
        return;
      }
      // Duplicate: Ctrl+D
      if (isCtrlOrCmd && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        const target = elements.find(el => el.id === selectedId);
        if (target) handleDuplicateElement(target);
        return;
      }
      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDeleteElement(selectedId);
        return;
      }
      // Deselect: Escape
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, clipboard, handleUndo, handleRedo, handleDuplicateElement, handleDeleteElement, showToast]);

  // SAVE TO RESTAURANT
  const handleSaveToRestaurant = useCallback(() => {
    if (!selectedRestaurant) return;
    setIsSaving(true);

    try {
      const updatedBranding = extractBrandingFromCanvas(elements, config, selectedRestaurant.branding);
      const safeLogo = selectedRestaurant.branding?.headerLogoUrl || selectedRestaurant.logoUrl;

      const updatedRestaurant: Restaurant = {
        ...selectedRestaurant,
        logoUrl: safeLogo,
        branding: updatedBranding
      };

      onUpdateRestaurant(updatedRestaurant);
      showToast(`✓ Carta y diseño gráfico guardados exitosamente en "${selectedRestaurant.name}".`);
    } catch (err) {
      console.error('Error saving canvas template:', err);
      showToast(`⚠️ Error al guardar. Verifica los valores e intenta nuevamente.`);
    } finally {
      setIsSaving(false);
    }
  }, [selectedRestaurant, elements, config, onUpdateRestaurant, showToast]);

  // Apply to ALL restaurants
  const handleApplyToAllRestaurants = useCallback(() => {
    setIsSaving(true);
    try {
      const updatedBranding = extractBrandingFromCanvas(elements, config);
      restaurants.forEach(r => {
        const updatedRest: Restaurant = {
          ...r,
          branding: {
            ...r.branding,
            ...updatedBranding,
            headerLogoUrl: r.branding?.headerLogoUrl || r.logoUrl
          }
        };
        onUpdateRestaurant(updatedRest);
      });
      showToast(`✓ Diseño gráfico aplicado a todas las sedes (${restaurants.length}).`);
    } catch (err) {
      console.error('Error applying to all restaurants:', err);
    } finally {
      setIsSaving(false);
    }
  }, [elements, config, restaurants, onUpdateRestaurant, showToast]);

  const selectedElement = elements.find(e => e.id === selectedId) || null;

  return (
    <div className={`fixed inset-0 z-50 bg-[#070A0F] text-neutral-200 flex flex-col overflow-hidden font-sans ${isFullscreen ? 'p-0' : ''}`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-2xl bg-neutral-900/95 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP CONTROLS BAR */}
      <EditorTopBar
        restaurants={restaurants}
        selectedRestId={selectedRestId}
        onSelectRestaurant={setSelectedRestId}
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
        onSave={handleSaveToRestaurant}
        onApplyToAll={handleApplyToAllRestaurants}
        onClose={onClose}
        isSaving={isSaving}
      />

      {/* 2. MAIN WORKSPACE (Toolbox Sidebar + Interactive Canvas + Properties Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Toolbox & Layers Sidebar (Hidden in Preview Mode) */}
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
        <main className="flex-1 h-full relative overflow-hidden flex items-center justify-center">
          <InteractiveCanvas
            elements={elements}
            config={config}
            selectedId={selectedId}
            selectedIds={selectedIds}
            zoom={zoom}
            pan={pan}
            isPreviewMode={isPreviewMode}
            restaurant={selectedRestaurant}
            sampleItem={sampleItem}
            onSelectElement={setSelectedId}
            onUpdateElement={handleUpdateElement}
            onCommitHistory={commitHistory}
            onPanChange={setPan}
          />
        </main>

        {/* Right: Contextual Properties Inspector (Hidden in Preview Mode) */}
        {!isPreviewMode && (
          <PropertiesInspector
            selectedElement={selectedElement}
            config={config}
            restaurant={selectedRestaurant}
            onUpdateElement={handleUpdateElement}
            onUpdateConfig={handleUpdateConfig}
            onDuplicateElement={handleDuplicateElement}
            onDeleteElement={handleDeleteElement}
            onReorderElement={handleReorderElement}
            onAlignElement={handleAlignElement}
          />
        )}
      </div>

    </div>
  );
};
