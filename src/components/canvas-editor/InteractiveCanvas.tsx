import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CanvasElement, CanvasConfig, SnapGuide } from './types';
import { CanvasObjectRenderer } from './CanvasObjectRenderer';
import { computeSnapGuides } from './canvasUtils';
import { Restaurant, MenuItem } from '../../types';
import { RotateCw, Lock, Eye, EyeOff, Image as ImageIcon, Utensils, Plus, MapPin, Sparkles } from 'lucide-react';

interface InteractiveCanvasProps {
  elements: CanvasElement[];
  config: CanvasConfig;
  selectedId: string | null;
  selectedIds?: string[];
  zoom: number;
  pan: { x: number; y: number };
  isPreviewMode?: boolean;
  restaurant?: Restaurant;
  sampleItem?: MenuItem;
  onSelectElement: (id: string | null, isMulti?: boolean) => void;
  onUpdateElement: (updated: CanvasElement) => void;
  onUpdateElements?: (updatedList: CanvasElement[]) => void;
  onAddElement?: (newElement: Partial<CanvasElement>) => void;
  onCommitHistory?: () => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
}

type DragMode = 'move' | 'resize-nw' | 'resize-n' | 'resize-ne' | 'resize-e' | 'resize-se' | 'resize-s' | 'resize-sw' | 'resize-w' | 'rotate' | 'pan';

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  elements,
  config,
  selectedId,
  selectedIds = [],
  zoom,
  pan,
  isPreviewMode = false,
  restaurant,
  sampleItem,
  onSelectElement,
  onUpdateElement,
  onUpdateElements,
  onAddElement,
  onCommitHistory,
  onPanChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDragMode, setActiveDragMode] = useState<DragMode | null>(null);
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  
  // Drag state refs for high-frequency 60fps smooth manipulation
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    elemX: number;
    elemY: number;
    elemW: number;
    elemH: number;
    elemRotation: number;
    panStartX: number;
    panStartY: number;
  }>({
    pointerX: 0,
    pointerY: 0,
    elemX: 0,
    elemY: 0,
    elemW: 0,
    elemH: 0,
    elemRotation: 0,
    panStartX: 0,
    panStartY: 0
  });

  const selectedElement = elements.find(e => e.id === selectedId);

  // Deselect on clicking canvas background
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBg) {
      onSelectElement(null);
    }
  };

  // Convert client viewport coordinates to canonical canvas coordinates
  const clientToCanvasCoord = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  }, [pan, zoom]);

  // Start dragging an element (Move)
  const handleElementPointerDown = (e: React.PointerEvent, element: CanvasElement) => {
    if (isPreviewMode) return;
    if (element.locked) {
      onSelectElement(element.id, e.shiftKey);
      return;
    }

    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    onSelectElement(element.id, e.shiftKey);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      elemX: element.x,
      elemY: element.y,
      elemW: element.width,
      elemH: element.height,
      elemRotation: element.rotation || 0,
      panStartX: pan.x,
      panStartY: pan.y
    };

    setActiveDragMode('move');
  };

  // Start Transform (Resize or Rotate handle)
  const handleHandlePointerDown = (e: React.PointerEvent, mode: DragMode) => {
    if (isPreviewMode || !selectedElement || selectedElement.locked) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      elemX: selectedElement.x,
      elemY: selectedElement.y,
      elemW: selectedElement.width,
      elemH: selectedElement.height,
      elemRotation: selectedElement.rotation || 0,
      panStartX: pan.x,
      panStartY: pan.y
    };

    setActiveDragMode(mode);
  };

  // Canvas Pan start (Space bar or Middle click or clicking empty space with drag)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.altKey || (e.target === e.currentTarget)) {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartRef.current.panStartX = pan.x;
      dragStartRef.current.panStartY = pan.y;
      dragStartRef.current.pointerX = e.clientX;
      dragStartRef.current.pointerY = e.clientY;
      setActiveDragMode('pan');
    }
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragMode) return;

    if (activeDragMode === 'pan') {
      const dx = e.clientX - dragStartRef.current.pointerX;
      const dy = e.clientY - dragStartRef.current.pointerY;
      if (onPanChange) {
        onPanChange({
          x: dragStartRef.current.panStartX + dx,
          y: dragStartRef.current.panStartY + dy
        });
      }
      return;
    }

    if (!selectedElement || selectedElement.locked) return;

    const deltaX = (e.clientX - dragStartRef.current.pointerX) / zoom;
    const deltaY = (e.clientY - dragStartRef.current.pointerY) / zoom;

    if (activeDragMode === 'move') {
      let nextX = Math.round(dragStartRef.current.elemX + deltaX);
      let nextY = Math.round(dragStartRef.current.elemY + deltaY);

      // Snap calculation
      if (config.showSnapGuides !== false) {
        const otherElems = elements.filter(el => el.id !== selectedElement.id);
        const { snapX, snapY, guides } = computeSnapGuides(
          { x: nextX, y: nextY, width: selectedElement.width, height: selectedElement.height },
          otherElems,
          config.width,
          config.height,
          8 / zoom
        );
        nextX = snapX;
        nextY = snapY;
        setActiveGuides(guides);
      } else {
        setActiveGuides([]);
      }

      onUpdateElement({
        ...selectedElement,
        x: nextX,
        y: nextY
      });
      return;
    }

    if (activeDragMode === 'rotate') {
      // Calculate angle from element center
      const elemCenterX = selectedElement.x + selectedElement.width / 2;
      const elemCenterY = selectedElement.y + selectedElement.height / 2;
      const mouseCanvas = clientToCanvasCoord(e.clientX, e.clientY);
      
      const rad = Math.atan2(mouseCanvas.y - elemCenterY, mouseCanvas.x - elemCenterX);
      let deg = Math.round((rad * 180) / Math.PI + 90); // 0 at top
      if (deg < 0) deg += 360;

      // Snap to 0, 45, 90, 180, 270 if Shift key is held
      if (e.shiftKey) {
        deg = Math.round(deg / 45) * 45;
      }

      onUpdateElement({
        ...selectedElement,
        rotation: deg % 360
      });
      return;
    }

    // Resize modes
    let newX = dragStartRef.current.elemX;
    let newY = dragStartRef.current.elemY;
    let newW = dragStartRef.current.elemW;
    let newH = dragStartRef.current.elemH;

    const keepAspect = e.shiftKey;
    const aspect = dragStartRef.current.elemW / dragStartRef.current.elemH;

    if (activeDragMode.includes('e')) {
      newW = Math.max(20, Math.round(dragStartRef.current.elemW + deltaX));
      if (keepAspect) newH = Math.round(newW / aspect);
    }
    if (activeDragMode.includes('s')) {
      newH = Math.max(20, Math.round(dragStartRef.current.elemH + deltaY));
      if (keepAspect) newW = Math.round(newH * aspect);
    }
    if (activeDragMode.includes('w')) {
      const potentialW = Math.max(20, Math.round(dragStartRef.current.elemW - deltaX));
      newX = dragStartRef.current.elemX + (dragStartRef.current.elemW - potentialW);
      newW = potentialW;
      if (keepAspect) newH = Math.round(newW / aspect);
    }
    if (activeDragMode.includes('n')) {
      const potentialH = Math.max(20, Math.round(dragStartRef.current.elemH - deltaY));
      newY = dragStartRef.current.elemY + (dragStartRef.current.elemH - potentialH);
      newH = potentialH;
      if (keepAspect) newW = Math.round(newH * aspect);
    }

    onUpdateElement({
      ...selectedElement,
      x: newX,
      y: newY,
      width: newW,
      height: newH
    });
  };

  // Pointer Up Handler (Commit to undo history)
  const handlePointerUp = () => {
    if (activeDragMode) {
      setActiveDragMode(null);
      setActiveGuides([]);
      if (onCommitHistory) {
        onCommitHistory();
      }
    }
  };

  // Keyboard navigation for selected object (Nudge 1px / 10px)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreviewMode || !selectedElement || selectedElement.locked) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName || ''))) return;

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        onUpdateElement({
          ...selectedElement,
          x: selectedElement.x + dx,
          y: selectedElement.y + dy
        });
        if (onCommitHistory) onCommitHistory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, isPreviewMode, onUpdateElement, onCommitHistory]);

  // Sort elements by zIndex for rendering
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div 
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleBackgroundClick}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#E5E7EB] select-none cursor-default"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.12) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* CANVAS CONTAINER FRAME (Positioned & Scaled via transform) */}
      <div
        data-canvas-bg="true"
        style={{
          width: `${config.width}px`,
          height: `${config.height}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)'
        }}
        className="relative bg-white transition-transform duration-75 shrink-0 rounded-2xl overflow-hidden"
      >
        {/* Render Grid Overlay */}
        {config.showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none z-[990]"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)`,
              backgroundSize: `${config.gridSize || 20}px ${config.gridSize || 20}px`
            }}
          />
        )}

        {/* Render Safety Margins Overlay */}
        {config.showSafetyMargins && (
          <div 
            className="absolute pointer-events-none z-[991] border-2 border-dashed border-amber-600/60 rounded-2xl"
            style={{
              inset: `${config.safetyMarginPadding || 40}px`
            }}
          >
            <span className="absolute top-2 left-2 text-[10px] font-mono text-amber-900 font-bold uppercase tracking-widest bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded shadow-xs">
              Margen Seguro
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RENDER THE 3 DESIGNATED CANVA ZONES (Cabecera, Cuerpo, Pie)              */}
        {/* ========================================================================= */}
        {!isPreviewMode && (
          <div className="absolute inset-0 pointer-events-none z-[980]">
            {/* ZONE 1: CABECERA DE CARTA (ESTÁTICA) */}
            {(() => {
              const headerHeight = config.headerZoneHeight || 260;
              const hasLogo = elements.some(e => e.type === 'restaurant_logo' || e.dynamicField === 'restaurant_logo');

              return (
                <div 
                  className="absolute left-0 right-0 top-0 border-b-2 border-dashed border-blue-500/50 bg-blue-500/[0.02]"
                  style={{ height: `${headerHeight}px` }}
                >
                  <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-auto">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-blue-600 text-white shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-200 animate-pulse" />
                      1. Cabecera de Carta (Estática)
                    </span>
                    {!hasLogo && onAddElement && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddElement({
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
                          });
                        }}
                        className="text-[10px] font-sans font-bold px-2.5 py-1 rounded-md bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 transition shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Insertar logotipo en la cabecera"
                      >
                        <ImageIcon className="w-3 h-3 text-blue-600" />
                        <span>+ Insertar Logo</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ZONE 2: CUERPO DE LA CARTA (PLATOS DINÁMICOS) */}
            {(() => {
              const headerHeight = config.headerZoneHeight || 260;
              const footerHeight = config.footerZoneHeight || 180;
              const bodyHeight = Math.max(200, config.height - headerHeight - footerHeight);

              return (
                <div 
                  className="absolute left-0 right-0 border-b-2 border-dashed border-amber-500/50 bg-amber-500/[0.01]"
                  style={{ 
                    top: `${headerHeight}px`,
                    height: `${bodyHeight}px` 
                  }}
                >
                  <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-auto">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-amber-600 text-white shadow-sm flex items-center gap-1.5">
                      <Utensils className="w-3 h-3 text-amber-200" />
                      2. Cuerpo de Carta (Platos Dinámicos)
                    </span>
                    {onAddElement && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Compute next Y inside body area
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
                            backgroundColor: '#1E293B',
                            borderRadius: 16,
                            borderColor: '#334155',
                            borderWidth: 1,
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                          });
                        }}
                        className="text-[10px] font-sans font-bold px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 hover:border-amber-500 transition shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Añadir tarjeta de plato al cuerpo"
                      >
                        <Plus className="w-3 h-3 text-amber-600" />
                        <span>+ Añadir Plato al Cuerpo</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ZONE 3: PIE DE CARTA (FINAL DEL CANVA) */}
            {(() => {
              const footerHeight = config.footerZoneHeight || 180;
              const footerTop = config.height - footerHeight;

              return (
                <div 
                  className="absolute left-0 right-0 bottom-0 bg-purple-500/[0.02]"
                  style={{ 
                    top: `${footerTop}px`,
                    height: `${footerHeight}px` 
                  }}
                >
                  <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-auto">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-purple-600 text-white shadow-sm flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-purple-200" />
                      3. Pie de Carta (Final del Canva)
                    </span>
                    {onAddElement && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddElement({
                            name: 'Información y Contacto',
                            type: 'contact_info',
                            zone: 'footer',
                            text: restaurant ? `📍 ${restaurant.address} · 📞 ${restaurant.phone}` : '📍 Av. Principal 123 · 📞 +51 987 654 321 · Horario: 12:00pm - 11:00pm',
                            x: 40,
                            y: footerTop + 30,
                            width: config.width - 80,
                            height: 60,
                            fontSize: 14,
                            fontWeight: 600,
                            textAlign: 'center',
                            textColor: '#94A3B8'
                          });
                        }}
                        className="text-[10px] font-sans font-bold px-2.5 py-1 rounded-md bg-white border border-purple-300 text-purple-800 hover:bg-purple-50 hover:border-purple-500 transition shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Insertar pie de página de contacto"
                      >
                        <Plus className="w-3 h-3 text-purple-600" />
                        <span>+ Insertar Pie de Carta</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Render Snap Alignment Lines */}
        {activeGuides.map((guide, idx) => (
          <div
            key={`guide-${idx}`}
            className="absolute pointer-events-none z-[999]"
            style={{
              ...(guide.type === 'vertical' ? {
                left: `${guide.position}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: '#0284C7',
                boxShadow: '0 0 6px #0284C7'
              } : {
                top: `${guide.position}px`,
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: '#D97706',
                boxShadow: '0 0 6px #D97706'
              })
            }}
          />
        ))}

        {/* RENDER CANVAS OBJECTS */}
        {sortedElements.map((element) => {
          if (!element.visible && !isPreviewMode) {
            return null;
          }
          if (!element.visible && isPreviewMode) return null;

          const isSelected = selectedId === element.id || selectedIds.includes(element.id);

          return (
            <div
              key={element.id}
              onPointerDown={(e) => handleElementPointerDown(e, element)}
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height}px`,
                zIndex: element.zIndex,
                cursor: element.locked ? 'not-allowed' : 'move'
              }}
              className={`group transition-[outline] duration-75 ${
                !isPreviewMode && isSelected 
                  ? 'outline-none ring-2 ring-neutral-950 ring-offset-2 ring-offset-white' 
                  : !isPreviewMode && !element.locked 
                  ? 'hover:outline hover:outline-1 hover:outline-neutral-500' 
                  : ''
              }`}
            >
              <CanvasObjectRenderer
                element={element}
                restaurant={restaurant}
                sampleItem={sampleItem}
                isPreview={isPreviewMode}
              />

              {/* Locked Indicator on hover */}
              {element.locked && !isPreviewMode && (
                <div className="absolute top-1 right-1 bg-black/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
                  <Lock className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}

        {/* INTERACTIVE BOUNDING BOX FOR SELECTED ELEMENT (Canva/Figma Transform Box) */}
        {!isPreviewMode && selectedElement && !selectedElement.locked && (
          <div
            style={{
              position: 'absolute',
              left: `${selectedElement.x}px`,
              top: `${selectedElement.y}px`,
              width: `${selectedElement.width}px`,
              height: `${selectedElement.height}px`,
              zIndex: 9990,
              transform: selectedElement.rotation ? `rotate(${selectedElement.rotation}deg)` : undefined,
              transformOrigin: 'center center',
              pointerEvents: 'none'
            }}
            className="border-2 border-neutral-950 rounded-xs"
          >
            {/* Rotate Arm & Handle (Top Center) */}
            <div 
              style={{
                position: 'absolute',
                top: '-28px',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'auto'
              }}
              onPointerDown={(e) => handleHandlePointerDown(e, 'rotate')}
              className="w-5 h-5 rounded-full bg-white border-2 border-neutral-950 shadow-md flex items-center justify-center cursor-grab hover:scale-125 transition-transform"
              title="Rotar Objeto (Shift para ángulos fijos)"
            >
              <RotateCw className="w-2.5 h-2.5 text-black" />
            </div>
            <div 
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '1px',
                height: '14px',
                backgroundColor: '#000000'
              }} 
            />

            {/* Corner Resize Handles */}
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, 'resize-nw')}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-neutral-950 rounded-xs shadow-md cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
            />
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, 'resize-ne')}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-neutral-950 rounded-xs shadow-md cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
            />
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, 'resize-se')}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-neutral-950 rounded-xs shadow-md cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
            />
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, 'resize-sw')}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-neutral-950 rounded-xs shadow-md cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
            />

            {/* Side Edge Resize Handles */}
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, 'resize-n')}
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-2.5 bg-white border border-neutral-950 rounded-xs shadow-md cursor-ns-resize pointer-events-auto hover:scale-125 transition-transform"
            />
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, 'resize-s')}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-2.5 bg-white border border-neutral-950 rounded-xs shadow-md cursor-ns-resize pointer-events-auto hover:scale-125 transition-transform"
            />
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, 'resize-w')}
              className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-3.5 bg-white border border-neutral-950 rounded-xs shadow-md cursor-ew-resize pointer-events-auto hover:scale-125 transition-transform"
            />
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, 'resize-e')}
              className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-3.5 bg-white border border-neutral-950 rounded-xs shadow-md cursor-ew-resize pointer-events-auto hover:scale-125 transition-transform"
            />

            {/* Coordinates Floating Badge */}
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-mono font-bold whitespace-nowrap shadow-xl">
              X: {selectedElement.x} · Y: {selectedElement.y} · {selectedElement.width}×{selectedElement.height}px {selectedElement.rotation ? `· ${selectedElement.rotation}°` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
