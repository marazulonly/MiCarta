import React from 'react';
import { CanvasElement } from './types';
import { Restaurant, MenuItem } from '../../types';
import { 
  Utensils, 
  Sparkles, 
  Star, 
  Plus, 
  Check, 
  Award, 
  Tag, 
  Info,
  Clock,
  Heart,
  ChevronRight
} from 'lucide-react';

interface CanvasObjectRendererProps {
  element: CanvasElement;
  restaurant?: Restaurant;
  sampleItem?: MenuItem;
  isPreview?: boolean;
}

export const CanvasObjectRenderer: React.FC<CanvasObjectRendererProps> = ({
  element,
  restaurant,
  sampleItem,
  isPreview = false
}) => {
  const {
    type,
    width,
    height,
    rotation = 0,
    opacity = 1,
    text,
    fontSize = 16,
    fontFamily = 'inherit',
    fontWeight = 400,
    fontStyle = 'normal',
    textAlign = 'left',
    textColor = '#FFFFFF',
    letterSpacing = 0,
    lineHeight = 1.4,
    textTransform = 'none',
    textShadow,
    backgroundColor,
    backgroundGradient,
    backgroundImage,
    borderRadius,
    borderWidth = 0,
    borderColor,
    borderStyle = 'solid',
    boxShadow,
    objectFit = 'cover',
    iconName,
    badgeText,
    isDynamic,
    dynamicField
  } = element;

  // Resolve dynamic values
  let resolvedText = text;
  let resolvedImage = backgroundImage;

  if (isDynamic || dynamicField) {
    if (dynamicField === 'dish_name') {
      resolvedText = sampleItem?.name || text || 'Nombre del Plato';
    } else if (dynamicField === 'dish_description') {
      resolvedText = sampleItem?.description || text || 'Descripción del plato con ingredientes frescos y preparación de la casa.';
    } else if (dynamicField === 'dish_price') {
      resolvedText = sampleItem?.price !== undefined ? `S/ ${sampleItem.price.toFixed(2)}` : (text || 'S/ 45.00');
    } else if (dynamicField === 'dish_image') {
      resolvedImage = sampleItem?.imageUrl || backgroundImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
    } else if (dynamicField === 'restaurant_name') {
      resolvedText = restaurant?.name || text || 'Nombre del Restaurante';
    } else if (dynamicField === 'restaurant_tagline') {
      resolvedText = restaurant?.tagline || text || 'Alta Cocina & Especialidades';
    } else if (dynamicField === 'restaurant_logo') {
      resolvedImage = backgroundImage || restaurant?.logoUrl || restaurant?.branding?.headerLogoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80';
    } else if (dynamicField === 'dish_addons') {
      if (sampleItem?.availableAddons && sampleItem.availableAddons.length > 0) {
        resolvedText = `+ Adicionales: ` + sampleItem.availableAddons.map(a => `${a.name} (+S/ ${a.price.toFixed(2)})`).join(' · ');
      }
    } else if (dynamicField === 'dish_observations') {
      if (sampleItem?.suggestedObservations && sampleItem.suggestedObservations.length > 0) {
        resolvedText = `📝 Observaciones: ` + sampleItem.suggestedObservations.join(' · ');
      }
    }
  }

  // Base container styles
  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    opacity,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: 'center center',
    boxShadow,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : (borderRadius || '0px'),
    borderWidth: borderWidth ? `${borderWidth}px` : undefined,
    borderColor: borderColor || undefined,
    borderStyle: borderWidth ? borderStyle : undefined,
    backgroundColor: backgroundColor || undefined,
    backgroundImage: backgroundGradient || undefined,
    color: textColor,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  };

  switch (type) {
    case 'background':
      return (
        <div 
          style={{
            ...containerStyle,
            backgroundColor: backgroundColor || '#0B0F17',
            backgroundImage: resolvedImage ? `url("${resolvedImage}")` : (backgroundGradient || undefined),
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          className="w-full h-full relative"
        >
          {resolvedImage && (
            <div className="absolute inset-0 bg-black/50" />
          )}
        </div>
      );

    case 'dish_image_container':
    case 'restaurant_logo':
    case 'image_custom': {
      const imgUrl = backgroundImage || resolvedImage || (type === 'dish_image_container' 
        ? 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
        : type === 'restaurant_logo'
        ? (element.backgroundImage || restaurant?.logoUrl || restaurant?.branding?.headerLogoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80')
        : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80');

      return (
        <div style={containerStyle} className="relative select-none pointer-events-none">
          <img 
            src={imgUrl} 
            alt={element.name} 
            className="w-full h-full"
            style={{ 
              objectFit: objectFit || 'cover',
              borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : (borderRadius || '0px')
            }}
            draggable={false}
          />
        </div>
      );
    }

    case 'dish_name':
    case 'restaurant_name':
    case 'text_custom':
    case 'footer_text': {
      return (
        <div 
          style={{
            ...containerStyle,
            justifyContent: 'center',
            padding: '2px 4px'
          }}
          className="select-none"
        >
          <span
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight,
              fontStyle,
              textAlign,
              color: textColor,
              letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
              lineHeight,
              textTransform,
              textShadow,
              wordBreak: 'break-word',
              display: 'block'
            }}
          >
            {resolvedText || element.name}
          </span>
        </div>
      );
    }

    case 'contact_info': {
      return (
        <div 
          style={{
            ...containerStyle,
            justifyContent: 'center',
            alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            padding: '6px 12px',
            gap: '4px'
          }}
          className="select-none"
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight,
                color: textColor,
                textAlign
              }}
            >
              {resolvedText || '📍 Av. Principal 123 · 📞 +51 987 654 321'}
            </span>
          </div>
        </div>
      );
    }

    case 'dish_description':
    case 'restaurant_tagline': {
      return (
        <div 
          style={{
            ...containerStyle,
            justifyContent: 'flex-start',
            padding: '4px'
          }}
          className="select-none"
        >
          <p
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight,
              fontStyle,
              textAlign,
              color: textColor,
              letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
              lineHeight,
              textTransform,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: Math.max(1, Math.floor(height / (fontSize * lineHeight))),
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {resolvedText || element.name}
          </p>
        </div>
      );
    }

    case 'dish_price': {
      return (
        <div 
          style={{
            ...containerStyle,
            justifyContent: 'center',
            alignItems: textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start',
            padding: '2px 6px'
          }}
          className="select-none"
        >
          <div className="flex items-baseline gap-1">
            <span
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight: fontWeight || 800,
                color: textColor,
                letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
                textShadow
              }}
            >
              {resolvedText || 'S/ 48.00'}
            </span>
          </div>
        </div>
      );
    }

    case 'dish_addons':
    case 'dish_observations': {
      return (
        <div 
          style={{
            ...containerStyle,
            padding: '8px 12px',
            justifyContent: 'center',
            backgroundColor: backgroundColor || 'rgba(255,255,255,0.03)'
          }}
          className="select-none"
        >
          <span
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight,
              color: textColor,
              lineHeight: 1.4,
              display: 'block'
            }}
          >
            {resolvedText}
          </span>
        </div>
      );
    }

    case 'shape_badge': {
      return (
        <div 
          style={{
            ...containerStyle,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: backgroundColor || '#D4AF37',
            padding: '4px 12px'
          }}
          className="select-none font-bold shadow-md"
        >
          <span
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight || 700,
              color: textColor || '#000000',
              letterSpacing: letterSpacing ? `${letterSpacing}px` : '1.5px',
              textTransform: textTransform || 'uppercase'
            }}
          >
            {resolvedText || badgeText || 'DESTACADO'}
          </span>
        </div>
      );
    }

    case 'order_button': {
      return (
        <div 
          style={{
            ...containerStyle,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: backgroundColor || '#D4AF37',
            cursor: isPreview ? 'pointer' : 'default',
            padding: '6px 16px',
            gap: '6px'
          }}
          className="select-none font-bold shadow-lg flex-row items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 shrink-0" style={{ color: textColor || '#000000' }} />
          <span
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight || 700,
              color: textColor || '#000000'
            }}
          >
            {resolvedText || 'Pedir'}
          </span>
        </div>
      );
    }

    case 'separator_line': {
      return (
        <div 
          style={{
            ...containerStyle,
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              width: '100%',
              height: `${Math.max(1, borderWidth || 2)}px`,
              backgroundColor: borderColor || backgroundColor || '#D4AF37',
              opacity
            }} 
          />
        </div>
      );
    }

    case 'shape_circle': {
      return (
        <div 
          style={{
            ...containerStyle,
            borderRadius: '9999px',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          className="select-none"
        >
          {resolvedText && (
            <span style={{ fontFamily, fontSize: `${fontSize}px`, color: textColor, fontWeight }}>
              {resolvedText}
            </span>
          )}
        </div>
      );
    }

    case 'shape_rect':
    case 'category_pill':
    default: {
      return (
        <div 
          style={{
            ...containerStyle,
            justifyContent: 'center',
            alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            padding: resolvedText ? '6px 12px' : 0
          }}
          className="select-none"
        >
          {resolvedText && (
            <span style={{ fontFamily, fontSize: `${fontSize}px`, color: textColor, fontWeight }}>
              {resolvedText}
            </span>
          )}
        </div>
      );
    }
  }
};
