import React from 'react';
import { Restaurant, MenuItem, MenuCategory } from '../types';
import { CanvasElement, CanvasConfig } from './canvas-editor/types';
import { CanvasObjectRenderer } from './canvas-editor/CanvasObjectRenderer';

interface CanvasRendererProps {
  elements: CanvasElement[];
  config: CanvasConfig;
  restaurant: Restaurant;
  menuItems: MenuItem[];
  categories: MenuCategory[];
  mode: 'editor' | 'public';
  onAddToCart?: (item: MenuItem) => void;
  onItemClick?: (item: MenuItem) => void;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  elements = [],
  config,
  restaurant,
  menuItems = [],
  categories = [],
  mode,
  onAddToCart,
  onItemClick
}) => {
  const width = config?.width || 1200;
  const height = config?.height || 1600;
  const bgColor = config?.backgroundColor || restaurant?.branding?.darkBgColor || '#0B0F17';
  const bgImage = config?.backgroundImage || restaurant?.coverUrl || restaurant?.branding?.headerLogoUrl;

  return (
    <div 
      className="relative w-full overflow-hidden select-none"
      style={{
        width: '100%',
        maxWidth: `${width}px`,
        aspectRatio: `${width} / ${height}`,
        backgroundColor: bgColor,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: restaurant?.branding?.cardBorderRadius || '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
      }}
    >
      {/* Background overlay */}
      {config?.backgroundOverlay && (
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ backgroundColor: config.backgroundOverlay }} 
        />
      )}

      {/* Render Canvas Elements in Absolute Positioning proportional to canvas dimensions */}
      <div className="absolute inset-0 w-full h-full">
        {elements.map((el) => {
          // Find sample item if element is dynamic
          const sampleItem = menuItems.length > 0 ? menuItems[0] : undefined;
          
          const leftPercent = (el.x / width) * 100;
          const topPercent = (el.y / height) * 100;
          const widthPercent = (el.width / width) * 100;
          const heightPercent = (el.height / height) * 100;

          return (
            <div
              key={el.id}
              className="absolute transition-all"
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                zIndex: el.zIndex || 1
              }}
              onClick={() => {
                if (mode === 'public' && el.isDynamic && sampleItem && onItemClick) {
                  onItemClick(sampleItem);
                }
              }}
            >
              <CanvasObjectRenderer
                element={el}
                restaurant={restaurant}
                sampleItem={sampleItem}
                isPreview={mode === 'public'}
              />
            </div>
          );
        })}
      </div>

      {/* Fallback if elements are empty: render categories and dishes */}
      {(!elements || elements.length === 0) && (
        <div className="absolute inset-0 p-8 flex flex-col overflow-y-auto text-white">
          <div className="text-center space-y-2 mb-8">
            {restaurant?.logoUrl && (
              <img 
                src={restaurant.logoUrl} 
                alt={restaurant.name} 
                className="w-20 h-20 object-contain mx-auto rounded-xl bg-transparent"
                referrerPolicy="no-referrer"
              />
            )}
            <h1 className="text-3xl font-black uppercase tracking-wider" style={{ color: restaurant?.branding?.textColor || '#FFF' }}>
              {restaurant?.name || 'Restaurante'}
            </h1>
            <p className="text-sm opacity-80">{restaurant?.tagline || 'Carta Digital'}</p>
          </div>

          <div className="space-y-6">
            {categories.map(cat => {
              const catItems = menuItems.filter(i => i.categoryId === cat.id && i.isAvailable !== false);
              if (catItems.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-3">
                  <h3 className="text-xl font-bold border-b border-white/20 pb-1 text-amber-400">
                    {cat.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catItems.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => onItemClick && onItemClick(item)}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/10 transition"
                      >
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-16 h-16 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.name}</h4>
                          <p className="text-xs opacity-75 line-clamp-1">{item.description}</p>
                          <span className="text-sm font-mono font-bold text-amber-400 mt-1 block">
                            S/ {item.price.toFixed(2)}
                          </span>
                        </div>
                        {onAddToCart && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(item);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold shrink-0 hover:bg-amber-300 transition"
                          >
                            Pedir
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
