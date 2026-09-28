import React, { useState, useEffect } from 'react';
import { 
  LayoutTemplate, 
  Eye, 
  Save, 
  RotateCcw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Palette, 
  Type, 
  Layers, 
  Check, 
  Sparkles, 
  Sliders, 
  Store, 
  Utensils, 
  ChevronRight, 
  ArrowLeft,
  X,
  Flame,
  Zap,
  Info,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { 
  Restaurant, 
  MenuTemplate, 
  MenuItem, 
  MenuCategory, 
  RestaurantBranding 
} from '../types';
import { INITIAL_MENU_TEMPLATES } from '../data/menuTemplatesData';

interface TemplateSplitEditorProps {
  restaurants: Restaurant[];
  templates: MenuTemplate[];
  menuItems: MenuItem[];
  categories: MenuCategory[];
  currentRestaurantId?: string;
  onUpdateRestaurant: (updated: Restaurant) => void;
  onOpenCustomerPreview: (restaurant: Restaurant) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onClose?: () => void;
}

type InspectorTab = 'templates' | 'colors' | 'typography' | 'cards' | 'header' | 'assign';

const QUICK_PALETTES = [
  {
    name: 'Fuego Voraz (Rojo & Oro)',
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
    darkBgColor: '#09232F',
    cardBgColor: '#13394D',
    buttonColor: '#0284C7',
    buttonTextColor: '#FFFFFF',
    textColor: '#F0F9FF',
    accentColor: '#38BDF8',
    priceColor: '#BAE6FD'
  },
  {
    name: 'Neon Cyber Punk',
    darkBgColor: '#09090B',
    cardBgColor: '#18181B',
    buttonColor: '#8B5CF6',
    buttonTextColor: '#FFFFFF',
    textColor: '#FFFFFF',
    accentColor: '#EC4899',
    priceColor: '#A78BFA'
  },
  {
    name: 'Minimal Monocromo',
    darkBgColor: '#000000',
    cardBgColor: '#121212',
    buttonColor: '#FFFFFF',
    buttonTextColor: '#000000',
    textColor: '#E5E5E5',
    accentColor: '#A3A3A3',
    priceColor: '#FFFFFF'
  }
];

const FONT_OPTIONS = [
  { label: 'Cinzel (Serifa Monumental Romana)', value: "'Cinzel', 'Playfair Display', serif" },
  { label: 'Playfair Display (Elegancia Clásica)', value: "'Playfair Display', serif" },
  { label: 'Plus Jakarta Sans (Moderna y Nítida)', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Outfit (Contemporánea Geométrica)', value: "'Outfit', sans-serif" },
  { label: 'Syne (Urbana e Impactante)', value: "'Syne', sans-serif" },
  { label: 'Inter (Alta Legibilidad)', value: "'Inter', sans-serif" },
  { label: 'Montserrat (Publicitaria Premium)', value: "'Montserrat', sans-serif" },
  { label: 'Dancing Script (Cursiva Tradicional)', value: "'Dancing Script', cursive" },
  { label: 'Roboto Mono (Técnica & Monospace)', value: "'Roboto Mono', monospace" }
];

export const TemplateSplitEditor: React.FC<TemplateSplitEditorProps> = ({
  restaurants,
  templates = INITIAL_MENU_TEMPLATES,
  menuItems,
  categories,
  currentRestaurantId,
  onUpdateRestaurant,
  onOpenCustomerPreview,
  onDeleteTemplate,
  onClose,
}) => {
  // Selected restaurant for live editing
  const [selectedRestId, setSelectedRestId] = useState<string>(
    currentRestaurantId || restaurants[0]?.id || ''
  );

  const selectedRestaurant = (restaurants || []).find(r => r && r.id === selectedRestId) || (restaurants || [])[0];

  // Active Template & Branding working state
  const [activeTemplateId, setActiveTemplateId] = useState<string>(
    selectedRestaurant?.templateId || 'tmpl-luxury'
  );

  const defaultBranding: RestaurantBranding = {
    primaryColor: '#D4AF37',
    secondaryColor: '#F59E0B',
    accentColor: '#D4AF37',
    darkBgColor: '#071A14',
    cardBgColor: '#0c241c',
    textColor: '#f5efe0',
    fontDisplay: "'Cinzel', serif",
    buttonColor: '#D4AF37',
    buttonTextColor: '#000000',
    dishCardBgColor: '#0c241c',
    dishCardBorderColor: '#D4AF3760',
    cardBorderRadius: '12px',
    cardStyle: 'grid',
    dishNameFont: "'Cinzel', serif",
    dishDescFont: "'Inter', sans-serif",
    dishPriceFont: "'Roboto Mono', monospace",
    restaurantNameFont: "'Cinzel', serif",
    restaurantNameColor: '#FFFFFF',
    priceColor: '#DFB86C',
    headerStyle: 'banner',
    headerDisplayMode: 'IMAGE_AND_TEXT',
    showHeaderName: true,
    showHeaderTagline: true,
    showHeaderBadge: true,
    headerBannerHeight: 120
  };

  const [workingBranding, setWorkingBranding] = useState<RestaurantBranding>({
    ...defaultBranding,
    ...(selectedRestaurant?.branding || {})
  });

  // Device simulation frame
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  // Inspector sub-tab
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('templates');
  // Card customization sub-tab (Odd vs Even styling)
  const [cardDesignSubtab, setCardDesignSubtab] = useState<'odd' | 'even'>('odd');
  // Preview active category
  const [previewCategory, setPreviewCategory] = useState<string>('all');
  // Notification toast
  const [toast, setToast] = useState<string | null>(null);

  // Sync state when restaurant selection changes
  useEffect(() => {
    if (selectedRestaurant) {
      setActiveTemplateId(selectedRestaurant.templateId || 'tmpl-luxury');
      setWorkingBranding({
        ...defaultBranding,
        ...(selectedRestaurant.branding || {})
      });
    }
  }, [selectedRestId]);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to update branding property
  const updateBranding = (key: keyof RestaurantBranding, val: any) => {
    setWorkingBranding(prev => ({
      ...prev,
      [key]: val
    }));
  };

  // Quick Apply Palette
  const applyPalette = (pal: typeof QUICK_PALETTES[0]) => {
    setWorkingBranding(prev => ({
      ...prev,
      darkBgColor: pal.darkBgColor,
      cardBgColor: pal.cardBgColor,
      dishCardBgColor: pal.cardBgColor,
      buttonColor: pal.buttonColor,
      buttonTextColor: pal.buttonTextColor,
      textColor: pal.textColor,
      accentColor: pal.accentColor,
      priceColor: pal.priceColor,
      dishCardBorderColor: `${pal.buttonColor}60`
    }));
    showNotification(`Paleta "${pal.name}" aplicada a la vista previa.`);
  };

  // Apply a template preset (Only alters template visualization structure, preserving user's custom colors & logos)
  const handleSelectTemplate = (tmpl: MenuTemplate) => {
    setActiveTemplateId(tmpl.id);
    setWorkingBranding(prev => ({
      ...prev,
      fontDisplay: tmpl.fontDisplay || prev.fontDisplay,
      cardBorderRadius: tmpl.cardBorderRadius || prev.cardBorderRadius || '12px',
      cardStyle: tmpl.cardStyle || prev.cardStyle || 'grid',
      headerStyle: tmpl.headerStyle || prev.headerStyle || 'banner'
    }));
    showNotification(`Plantilla "${tmpl.name}" seleccionada. Tus colores y logo se conservan intactos.`);
  };

  // Save changes to current restaurant
  const handleSaveToRestaurant = () => {
    if (!selectedRestaurant) return;

    const safeHeaderLogo = workingBranding.headerLogoUrl || selectedRestaurant.branding?.headerLogoUrl || selectedRestaurant.logoUrl || '';
    const updatedRest: Restaurant = {
      ...selectedRestaurant,
      templateId: activeTemplateId,
      logoUrl: safeHeaderLogo || selectedRestaurant.logoUrl,
      branding: {
        ...selectedRestaurant.branding,
        ...workingBranding,
        headerLogoUrl: safeHeaderLogo,
      }
    };

    onUpdateRestaurant(updatedRest);
    showNotification(`✓ Configuración y colores guardados exitosamente en "${selectedRestaurant.name}".`);
  };

  // Save changes to ALL restaurants
  const handleApplyToAllRestaurants = () => {
    restaurants.forEach(rest => {
      const safeHeaderLogo = rest.branding?.headerLogoUrl || rest.logoUrl;
      const updatedRest: Restaurant = {
        ...rest,
        templateId: activeTemplateId,
        branding: {
          ...rest.branding,
          ...workingBranding,
          headerLogoUrl: safeHeaderLogo,
        }
      };
      onUpdateRestaurant(updatedRest);
    });
    showNotification(`✓ Plantilla y colores aplicados a todos los restaurantes (${restaurants.length}).`);
  };

  // Filter items for preview
  const restCategories = categories.filter(c => c.restaurantId === selectedRestaurant?.id);
  const currentCategories = restCategories.length > 0 ? restCategories : [
    { id: 'cat-demo-1', restaurantId: selectedRestaurant?.id || '', name: 'Platos Principales', sortOrder: 1, isActive: true },
    { id: 'cat-demo-2', restaurantId: selectedRestaurant?.id || '', name: 'Entradas & Piques', sortOrder: 2, isActive: true },
    { id: 'cat-demo-3', restaurantId: selectedRestaurant?.id || '', name: 'Bebidas & Cocteles', sortOrder: 3, isActive: true }
  ];

  const restItems = menuItems.filter(i => i.restaurantId === selectedRestaurant?.id);
  const currentItems = restItems.length > 0 ? restItems : [
    {
      id: 'demo-1',
      restaurantId: selectedRestaurant?.id || '',
      categoryId: currentCategories[0]?.id || 'cat-demo-1',
      name: 'Plato Insignia Especial',
      description: 'Preparación artesanal con ingredientes frescos de primera calidad y sazón de la casa.',
      price: 48.00,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      isPopular: true
    },
    {
      id: 'demo-2',
      restaurantId: selectedRestaurant?.id || '',
      categoryId: currentCategories[0]?.id || 'cat-demo-1',
      name: 'Especialidad Tradicional',
      description: 'Acompañado de guarnición clásica, ensalada fresca y salsas exclusivas.',
      price: 36.50,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      isPopular: false
    },
    {
      id: 'demo-3',
      restaurantId: selectedRestaurant?.id || '',
      categoryId: currentCategories[1]?.id || 'cat-demo-2',
      name: 'Entrada Seleccionada',
      description: 'Porción ideal para compartir al centro de la mesa con toques aromáticos.',
      price: 24.00,
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      isPopular: true
    }
  ];

  const previewFilteredItems = currentItems.filter(i => {
    if (previewCategory === 'all') return true;
    return i.categoryId === previewCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-neutral-200 flex flex-col overflow-hidden font-sans">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl bg-neutral-900 border border-amber-400 text-amber-300 text-xs font-mono font-bold shadow-2xl animate-bounce">
          {toast}
        </div>
      )}

      {/* TOP CONTROLS BAR */}
      <div className="h-16 px-4 sm:px-6 bg-black border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-amber-400" />
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Editor Visual de Plantillas (Pantalla Dividida)
              </h1>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Previsualiza y edita colores, tipografías y tarjetas en tiempo real.
            </p>
          </div>
        </div>

        {/* Restaurant selector & Device simulation & Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Restaurant Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <Store className="w-3.5 h-3.5 text-neutral-400 ml-1.5" />
            <select
              value={selectedRestId}
              onChange={(e) => setSelectedRestId(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none pr-2 cursor-pointer"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id} className="bg-neutral-900 text-white">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Device toggle */}
          <div className="hidden md:flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                deviceMode === 'mobile' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista Móvil (390px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                deviceMode === 'tablet' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista Tablet (640px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                deviceMode === 'desktop' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
              title="Vista Pantalla Completa"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Preview button */}
          <button
            onClick={() => {
              if (selectedRestaurant) {
                onOpenCustomerPreview({
                  ...selectedRestaurant,
                  templateId: activeTemplateId,
                  branding: workingBranding
                });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-bold transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Previsualizar</span>
          </button>

          {/* Save & Apply button */}
          <button
            onClick={handleSaveToRestaurant}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer shadow-lg"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar en {selectedRestaurant?.name || 'Local'}</span>
          </button>
        </div>
      </div>

      {/* SPLIT SCREEN BODY */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT PANEL: LIVE INTERACTIVE PREVIEW                                      */}
        {/* ========================================================================= */}
        <div className="flex-1 bg-black/60 p-3 sm:p-6 overflow-y-auto flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-r border-neutral-800">
          
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Vista Previa en Vivo · {templates.find(t => t.id === activeTemplateId)?.name || 'Plantilla'}
            </span>

            <span className="text-[11px] font-mono text-neutral-500">
              {deviceMode === 'mobile' ? 'Móvil (390px)' : deviceMode === 'tablet' ? 'Tablet (640px)' : 'Escritorio'}
            </span>
          </div>

          {/* Device Shell Simulator */}
          <div 
            className={`w-full transition-all duration-300 rounded-3xl overflow-hidden border shadow-2xl flex flex-col ${
              deviceMode === 'mobile'
                ? 'max-w-[400px] min-h-[680px]'
                : deviceMode === 'tablet'
                ? 'max-w-[640px] min-h-[720px]'
                : 'max-w-full min-h-[760px]'
            }`}
            style={{
              backgroundColor: workingBranding.darkBgColor || '#071A14',
              borderColor: workingBranding.buttonColor ? `${workingBranding.buttonColor}40` : '#27272a',
              color: workingBranding.textColor || '#FFFFFF'
            }}
          >
            {/* Template Header Simulation */}
            <div className="relative overflow-hidden shrink-0 border-b border-white/10">
              <div 
                className="relative w-full bg-neutral-950 flex flex-col justify-end p-4 sm:p-6"
                style={{
                  minHeight: `${workingBranding.headerBannerHeight || 120}px`
                }}
              >
                {selectedRestaurant?.coverUrl && (
                  <img 
                    src={selectedRestaurant.coverUrl} 
                    alt={selectedRestaurant.name} 
                    className="absolute inset-0 w-full h-full object-cover brightness-50"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                <div className="relative z-10 flex items-center gap-3">
                  {selectedRestaurant?.logoUrl && (
                    <img 
                      src={selectedRestaurant.logoUrl} 
                      alt={selectedRestaurant.name} 
                      className="w-14 h-14 rounded-2xl object-cover border-2 shadow-xl shrink-0"
                      style={{ borderColor: workingBranding.buttonColor || '#D4AF37' }}
                    />
                  )}
                  <div>
                    {workingBranding.showHeaderBadge !== false && (
                      <span 
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mb-1 shadow"
                        style={{
                          backgroundColor: workingBranding.buttonColor || '#D4AF37',
                          color: workingBranding.buttonTextColor || '#000000'
                        }}
                      >
                        Carta Oficial
                      </span>
                    )}

                    {workingBranding.showHeaderName !== false && (
                      <h2 
                        className="text-xl sm:text-2xl font-black tracking-tight"
                        style={{
                          fontFamily: workingBranding.restaurantNameFont || workingBranding.fontDisplay || 'inherit',
                          color: workingBranding.restaurantNameColor || '#FFFFFF'
                        }}
                      >
                        {selectedRestaurant?.name || 'Nombre del Restaurante'}
                      </h2>
                    )}

                    {workingBranding.showHeaderTagline !== false && selectedRestaurant?.tagline && (
                      <p className="text-xs text-neutral-300 line-clamp-1 mt-0.5">
                        {selectedRestaurant.tagline}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 bg-black/20">
              <button
                onClick={() => setPreviewCategory('all')}
                style={
                  previewCategory === 'all'
                    ? {
                        backgroundColor: workingBranding.buttonColor || '#D4AF37',
                        color: workingBranding.buttonTextColor || '#000000'
                      }
                    : {
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: workingBranding.textColor || '#FFFFFF'
                      }
                }
                className="px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-sm"
              >
                Todas las Secciones
              </button>

              {currentCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setPreviewCategory(cat.id)}
                  style={
                    previewCategory === cat.id
                      ? {
                          backgroundColor: workingBranding.buttonColor || '#D4AF37',
                          color: workingBranding.buttonTextColor || '#000000'
                        }
                      : {
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: workingBranding.textColor || '#FFFFFF'
                        }
                  }
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer shadow-sm"
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Dishes list */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {previewFilteredItems.map((item, idx) => {
                const isEven = workingBranding.cardUniformStyles ? false : (idx % 2 === 1);

                // Odd (Impar) configuration
                const layoutOdd = workingBranding.cardLayout || 'row';
                const elementOrderOdd = workingBranding.cardElementOrder || 'image-first';
                const textAlignmentOdd = workingBranding.cardTextAlignment || 'left';
                const paddingOdd = workingBranding.cardPadding || 'normal';
                const shadowOdd = workingBranding.cardShadow || 'medium';
                const borderW_Odd = workingBranding.cardBorderWidth || '1px';

                // Even (Par) configuration (defaults to alternating styles if template is Medio Plato or similar, otherwise defaults to Odd styles)
                const isMedioPlato = activeTemplateId === 'tmpl-editorial' || activeTemplateId === 'tmpl-medio-plato' || activeTemplateId === 'tmpl-starters-editorial';
                
                const layoutEven = workingBranding.cardLayoutEven || (isMedioPlato ? 'row' : layoutOdd);
                const elementOrderEven = workingBranding.cardElementOrderEven || (isMedioPlato ? 'title-first' : elementOrderOdd);
                const textAlignmentEven = workingBranding.cardTextAlignmentEven || (isMedioPlato ? 'right' : textAlignmentOdd);
                const paddingEven = workingBranding.cardPaddingEven || paddingOdd;
                const shadowEven = workingBranding.cardShadowEven || shadowOdd;
                const borderW_Even = workingBranding.cardBorderWidthEven || borderW_Odd;

                // Determine active style set based on card index (Par vs Impar)
                const layout = isEven ? layoutEven : layoutOdd;
                const elementOrder = isEven ? elementOrderEven : elementOrderOdd;
                const textAlignment = isEven ? textAlignmentEven : textAlignmentOdd;
                const padding = isEven ? paddingEven : paddingOdd;
                const shadow = isEven ? shadowEven : shadowOdd;
                const borderW = isEven ? borderW_Even : borderW_Odd;

                // Photo Customizations
                const photoShape = isEven ? (workingBranding.cardPhotoShapeEven || 'square') : (workingBranding.cardPhotoShape || 'square');
                const photoBorder = isEven ? (workingBranding.cardPhotoBorderEven || 'none') : (workingBranding.cardPhotoBorder || 'none');
                const photoShadow = isEven ? (workingBranding.cardPhotoShadowEven || 'none') : (workingBranding.cardPhotoShadow || 'none');
                const photoTranslate = isEven ? (workingBranding.cardPhotoTranslateEven ?? 0) : (workingBranding.cardPhotoTranslate ?? 0);

                const cardBg = workingBranding.dishCardBgColor || workingBranding.cardBgColor || 'rgba(255,255,255,0.05)';
                const cardRadius = workingBranding.cardBorderRadius || '12px';
                const cardBorder = workingBranding.dishCardBorderColor || (workingBranding.buttonColor ? `${workingBranding.buttonColor}50` : 'rgba(255,255,255,0.1)');
                
                // Paddings
                let paddingClass = 'p-3.5';
                if (padding === 'compact') paddingClass = 'p-2.5';
                if (padding === 'elegant') paddingClass = 'p-5';

                // Shadows & Glowing
                let shadowStyle = {};
                let shadowClass = 'shadow-md';
                if (shadow === 'none') {
                  shadowClass = 'shadow-none';
                } else if (shadow === 'sutil') {
                  shadowClass = 'shadow-sm';
                } else if (shadow === 'medium') {
                  shadowClass = 'shadow-md';
                } else if (shadow === 'intense') {
                  shadowClass = 'shadow-2xl';
                } else if (shadow === 'glow') {
                  shadowClass = 'shadow-lg';
                  shadowStyle = {
                    boxShadow: `0 8px 30px -4px ${(workingBranding.buttonColor || '#D4AF37')}50`
                  };
                }

                // Photo borders, shadows and shape
                let photoShapeClass = 'rounded-xl';
                let photoShapeStyle: React.CSSProperties = {};
                if (photoShape === 'circle') photoShapeClass = 'rounded-full';
                if (photoShape === 'square') photoShapeClass = 'rounded-none';
                if (photoShape === 'none') photoShapeClass = 'bg-transparent border-0 shadow-none rounded-none';
                if (photoShape === 'medialuna-izq') {
                  photoShapeClass = '';
                  photoShapeStyle = { borderRadius: '9999px 0px 0px 9999px' };
                }
                if (photoShape === 'medialuna-der') {
                  photoShapeClass = '';
                  photoShapeStyle = { borderRadius: '0px 9999px 9999px 0px' };
                }

                let photoBorderClass = 'border-0';
                if (photoBorder === 'thin') photoBorderClass = 'border border-white/20';
                if (photoBorder === 'thick') photoBorderClass = 'border-4 border-amber-400/55';

                let photoShadowClass = 'shadow-none';
                if (photoShadow === 'sutil') photoShadowClass = 'shadow-sm';
                if (photoShadow === 'medium') photoShadowClass = 'shadow-md';
                if (photoShadow === 'intense') photoShadowClass = 'shadow-xl';

                const isRow = layout === 'row';
                const isColumn = layout === 'column';
                const isCover = layout === 'cover';

                // We default photoTranslate value (between 1 and 100). If it is not set or is 0, we can default it to 1% (leftmost edge) for ODD, or 100% (rightmost edge) for EVEN if we want to follow a nice default.
                const photoTranslateVal = photoTranslate || (isEven ? 100 : 1);

                // Width of the photo container
                const photoWidth = isRow ? 72 : 110; 
                const isAbsolutePhoto = !isCover;

                // Build element render structures with percentage offset absolute alignment
                const imageEl = item.imageUrl ? (
                  <div 
                    style={{
                      ...(isAbsolutePhoto ? {
                        position: 'absolute',
                        top: '12px',
                        width: `${photoWidth}px`,
                        height: `${photoWidth}px`,
                        left: `calc(${photoTranslateVal}% - (${photoTranslateVal / 100} * ${photoWidth}px))`,
                      } : {}),
                      ...photoShapeStyle,
                      transition: 'left 0.15s ease-out, transform 0.15s ease-out'
                    }}
                    className={`overflow-hidden shrink-0 z-10 transition-all ${photoShapeClass} ${photoBorderClass} ${photoShadowClass} ${
                      photoShape === 'none' ? 'bg-transparent' : 'bg-black/40'
                    } ${
                      !isAbsolutePhoto 
                        ? 'absolute inset-0 w-full h-full object-cover z-0 brightness-[0.35]' 
                        : ''
                    }`}
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : null;

                const textEl = (
                  <div className={`flex-1 min-w-0 ${isCover ? 'relative z-10' : ''} ${
                    textAlignment === 'center' ? 'text-center' : textAlignment === 'right' ? 'text-right' : 'text-left'
                  }`}>
                    <h3 
                      className="text-sm font-bold line-clamp-1"
                      style={{
                        fontFamily: workingBranding.dishNameFont || workingBranding.fontDisplay || 'inherit'
                      }}
                    >
                      {item.name}
                    </h3>
                    <p 
                      className="text-xs opacity-80 mt-1 line-clamp-2 leading-relaxed"
                      style={{
                        fontFamily: workingBranding.dishDescFont || 'inherit'
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                );

                const footerEl = (
                  <div className={`mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between ${
                    isCover ? 'relative z-10 border-t-0 mt-2' : ''
                  }`}>
                    <span 
                      className="text-sm font-black font-mono"
                      style={{
                        fontFamily: workingBranding.dishPriceFont || 'monospace',
                        color: workingBranding.priceColor || workingBranding.buttonColor || '#D4AF37'
                      }}
                    >
                      S/ {item.price.toFixed(2)}
                    </span>

                    <button
                      type="button"
                      style={{
                        backgroundColor: workingBranding.buttonColor || '#D4AF37',
                        color: workingBranding.buttonTextColor || '#000000',
                        borderRadius: '8px'
                      }}
                      className="px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow"
                    >
                      + Pedir
                    </button>
                  </div>
                );

                // Order of composition inside the card
                const first = elementOrder === 'title-first' ? textEl : imageEl;
                const second = elementOrder === 'title-first' ? imageEl : textEl;

                // Support Fullscreen mobile card look
                const isMobileFullscreen = workingBranding.cardMobileFullscreen && deviceMode === 'mobile';
                const fullscreenCardClass = isMobileFullscreen ? 'min-h-[440px] flex flex-col justify-between' : '';

                // Text wrapper style shifts itself dynamically to never overlap with absolute photo!
                const textWrapperStyle: React.CSSProperties = isAbsolutePhoto && item.imageUrl ? {
                  paddingLeft: photoTranslateVal < 50 ? `${photoWidth + 14}px` : '0px',
                  paddingRight: photoTranslateVal >= 50 ? `${photoWidth + 14}px` : '0px',
                  transition: 'padding 0.15s ease-out'
                } : {};

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: cardBg,
                      borderRadius: cardRadius,
                      borderColor: cardBorder,
                      borderWidth: borderW,
                      color: workingBranding.textColor || '#FFFFFF',
                      ...shadowStyle
                    }}
                    className={`relative overflow-hidden transition border flex flex-col justify-between ${paddingClass} ${shadowClass} ${fullscreenCardClass}`}
                  >
                    {isCover ? (
                      <div className="relative w-full h-full flex flex-col justify-end min-h-[140px] flex-1">
                        {imageEl}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-5" />
                        {textEl}
                        {footerEl}
                      </div>
                    ) : (
                      <div className="flex flex-col h-full justify-between flex-1 relative min-h-[110px]">
                        {imageEl}
                        <div style={textWrapperStyle}>
                          {textEl}
                        </div>
                        {footerEl}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: ELEMENT PROPERTIES INSPECTOR & CONTROLS                      */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[460px] xl:w-[500px] bg-neutral-950 border-l border-neutral-800 flex flex-col shrink-0 overflow-hidden">
          
          {/* Inspector Tabs */}
          <div className="flex items-center border-b border-neutral-800 overflow-x-auto scrollbar-none bg-black px-2 shrink-0">
            {[
              { id: 'templates' as InspectorTab, label: 'Plantillas Base', icon: LayoutTemplate },
              { id: 'colors' as InspectorTab, label: 'Paleta de Colores', icon: Palette },
              { id: 'typography' as InspectorTab, label: 'Tipografías', icon: Type },
              { id: 'cards' as InspectorTab, label: 'Tarjetas & Bordes', icon: Layers },
              { id: 'assign' as InspectorTab, label: 'Asignar a Locales', icon: Store }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = inspectorTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setInspectorTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-amber-400 text-amber-300 bg-neutral-900/60'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            
            {/* ------------------------------------------------------------- */}
            {/* TAB 1: SELECCION DE PLANTILLA BASE                            */}
            {/* ------------------------------------------------------------- */}
            {inspectorTab === 'templates' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
                    Galería de Plantillas
                  </h2>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Selecciona el tema de diseño base para {selectedRestaurant?.name}.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {templates.map(tmpl => {
                    const isSelected = activeTemplateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-amber-400 bg-neutral-900/90 ring-2 ring-amber-400/20'
                            : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={tmpl.thumbnailUrl} 
                            alt={tmpl.name} 
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-800" 
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{tmpl.name}</span>
                              {isSelected && (
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-400 text-black">
                                  ✓ Activa
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-amber-300 font-mono block mt-0.5">
                              {tmpl.badge} · {tmpl.category}
                            </span>
                            <p className="text-[11px] text-neutral-400 line-clamp-1 mt-1">
                              {tmpl.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onDeleteTemplate && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`¿Estás seguro de que deseas eliminar la plantilla "${tmpl.name}"?`)) {
                                  onDeleteTemplate(tmpl.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800/80 transition cursor-pointer"
                              title="Borrar plantilla"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-neutral-600'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: PALETA DE COLORES & FONDOS                             */}
            {/* ------------------------------------------------------------- */}
            {inspectorTab === 'colors' && (
              <div className="space-y-6">
                
                {/* 1-Click Quick Palettes */}
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold block">
                    ⚡ Paletas Rápidas de 1 Clic
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PALETTES.map(pal => (
                      <button
                        key={pal.name}
                        onClick={() => applyPalette(pal)}
                        className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-left transition cursor-pointer flex flex-col gap-1.5"
                      >
                        <span className="text-[11px] font-bold text-white truncate">{pal.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: pal.darkBgColor }} />
                          <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: pal.cardBgColor }} />
                          <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: pal.buttonColor }} />
                          <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: pal.textColor }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Color Pickers */}
                <div className="space-y-3 pt-4 border-t border-neutral-800">
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold block">
                    Personalización Precisa de Elementos
                  </span>

                  {/* Dark Background */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Color de Fondo de la Carta</span>
                      <span className="text-[10px] text-neutral-400">Lienzo general detrás de los platos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={workingBranding.darkBgColor || '#071A14'}
                        onChange={(e) => updateBranding('darkBgColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={workingBranding.darkBgColor || '#071A14'}
                        onChange={(e) => updateBranding('darkBgColor', e.target.value)}
                        className="w-20 px-2 py-1 bg-black border border-neutral-700 text-xs font-mono text-white rounded text-center"
                      />
                    </div>
                  </div>

                  {/* Card Background */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Fondo de Tarjetas de Platos</span>
                      <span className="text-[10px] text-neutral-400">Color del recuadro de cada plato</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={workingBranding.dishCardBgColor || workingBranding.cardBgColor || '#0c241c'}
                        onChange={(e) => {
                          updateBranding('dishCardBgColor', e.target.value);
                          updateBranding('cardBgColor', e.target.value);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={workingBranding.dishCardBgColor || workingBranding.cardBgColor || '#0c241c'}
                        onChange={(e) => {
                          updateBranding('dishCardBgColor', e.target.value);
                          updateBranding('cardBgColor', e.target.value);
                        }}
                        className="w-20 px-2 py-1 bg-black border border-neutral-700 text-xs font-mono text-white rounded text-center"
                      />
                    </div>
                  </div>

                  {/* Button / Primary Color */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Color Primario & Botones</span>
                      <span className="text-[10px] text-neutral-400">Botón de pedir, destacados y acentos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={workingBranding.buttonColor || workingBranding.primaryColor || '#D4AF37'}
                        onChange={(e) => {
                          updateBranding('buttonColor', e.target.value);
                          updateBranding('primaryColor', e.target.value);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={workingBranding.buttonColor || workingBranding.primaryColor || '#D4AF37'}
                        onChange={(e) => {
                          updateBranding('buttonColor', e.target.value);
                          updateBranding('primaryColor', e.target.value);
                        }}
                        className="w-20 px-2 py-1 bg-black border border-neutral-700 text-xs font-mono text-white rounded text-center"
                      />
                    </div>
                  </div>

                  {/* Button Text Color */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Texto de Botones</span>
                      <span className="text-[10px] text-neutral-400">Para garantizar contraste óptimo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={workingBranding.buttonTextColor || '#000000'}
                        onChange={(e) => updateBranding('buttonTextColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={workingBranding.buttonTextColor || '#000000'}
                        onChange={(e) => updateBranding('buttonTextColor', e.target.value)}
                        className="w-20 px-2 py-1 bg-black border border-neutral-700 text-xs font-mono text-white rounded text-center"
                      />
                    </div>
                  </div>

                  {/* General Text Color */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Texto de Platos & Descripciones</span>
                      <span className="text-[10px] text-neutral-400">Color principal de lectura</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={workingBranding.textColor || '#FFFFFF'}
                        onChange={(e) => updateBranding('textColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={workingBranding.textColor || '#FFFFFF'}
                        onChange={(e) => updateBranding('textColor', e.target.value)}
                        className="w-20 px-2 py-1 bg-black border border-neutral-700 text-xs font-mono text-white rounded text-center"
                      />
                    </div>
                  </div>

                  {/* Price Color */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Color de los Precios</span>
                      <span className="text-[10px] text-neutral-400">Destacado monetario S/.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={workingBranding.priceColor || workingBranding.buttonColor || '#DFB86C'}
                        onChange={(e) => updateBranding('priceColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={workingBranding.priceColor || workingBranding.buttonColor || '#DFB86C'}
                        onChange={(e) => updateBranding('priceColor', e.target.value)}
                        className="w-20 px-2 py-1 bg-black border border-neutral-700 text-xs font-mono text-white rounded text-center"
                      />
                    </div>
                  </div>

                  {/* Card Border Color */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Borde de Tarjeta</span>
                      <span className="text-[10px] text-neutral-400">Marco fino perimetral</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={workingBranding.dishCardBorderColor || '#D4AF37'}
                        onChange={(e) => updateBranding('dishCardBorderColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={workingBranding.dishCardBorderColor || '#D4AF37'}
                        onChange={(e) => updateBranding('dishCardBorderColor', e.target.value)}
                        className="w-20 px-2 py-1 bg-black border border-neutral-700 text-xs font-mono text-white rounded text-center"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: TIPOGRAFIAS                                            */}
            {/* ------------------------------------------------------------- */}
            {inspectorTab === 'typography' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold block">
                    Tipografías & Fuentes
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Define la identidad tipográfica para títulos, platos y precios.
                  </p>
                </div>

                {/* Dish Name Font */}
                <div className="space-y-1.5 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <label className="text-xs font-bold text-white block">Fuente del Nombre del Plato:</label>
                  <select
                    value={workingBranding.dishNameFont || workingBranding.fontDisplay || FONT_OPTIONS[0].value}
                    onChange={(e) => updateBranding('dishNameFont', e.target.value)}
                    className="w-full p-2 rounded-lg bg-black border border-neutral-700 text-xs text-white"
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Restaurant Name Font */}
                <div className="space-y-1.5 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <label className="text-xs font-bold text-white block">Fuente del Nombre del Restaurante:</label>
                  <select
                    value={workingBranding.restaurantNameFont || workingBranding.fontDisplay || FONT_OPTIONS[0].value}
                    onChange={(e) => updateBranding('restaurantNameFont', e.target.value)}
                    className="w-full p-2 rounded-lg bg-black border border-neutral-700 text-xs text-white"
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description Font */}
                <div className="space-y-1.5 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <label className="text-xs font-bold text-white block">Fuente de las Descripciones:</label>
                  <select
                    value={workingBranding.dishDescFont || "'Inter', sans-serif"}
                    onChange={(e) => updateBranding('dishDescFont', e.target.value)}
                    className="w-full p-2 rounded-lg bg-black border border-neutral-700 text-xs text-white"
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Price Font */}
                <div className="space-y-1.5 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <label className="text-xs font-bold text-white block">Fuente de los Precios (S/.):</label>
                  <select
                    value={workingBranding.dishPriceFont || "'Roboto Mono', monospace"}
                    onChange={(e) => updateBranding('dishPriceFont', e.target.value)}
                    className="w-full p-2 rounded-lg bg-black border border-neutral-700 text-xs text-white"
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: TARJETAS & BORDES (ATOMIC CARD DESIGNER)               */}
            {/* ------------------------------------------------------------- */}
            {inspectorTab === 'cards' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold block">
                    Constructor Atómico de Fichas (Tarjetas)
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Modifica sombras, bordes, espaciados y arrastre visual de forma independiente para fichas pares e impares.
                  </p>
                </div>

                {/* Checkbox global: Todas las tarjetas son iguales */}
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Tarjetas Uniformes (Sin Par/Impar)</span>
                    <span className="text-[10px] text-neutral-400">Todas las fichas heredarán el diseño Impar</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={workingBranding.cardUniformStyles === true}
                    onChange={(e) => updateBranding('cardUniformStyles', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 text-amber-400 cursor-pointer"
                  />
                </div>

                {/* Sub-tabs selector for Odd vs Even card types (Only visible if cards are NOT uniform) */}
                {!workingBranding.cardUniformStyles && (
                  <div className="flex border border-neutral-800 bg-neutral-900 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setCardDesignSubtab('odd')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold text-center transition cursor-pointer ${
                        cardDesignSubtab === 'odd'
                          ? 'bg-amber-400 text-black shadow-sm font-black'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                      }`}
                    >
                      Ficha Impar (Platos 1, 3, 5...)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardDesignSubtab('even')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold text-center transition cursor-pointer ${
                        cardDesignSubtab === 'even'
                          ? 'bg-amber-400 text-black shadow-sm font-black'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                      }`}
                    >
                      Ficha Par (Platos 2, 4, 6...)
                    </button>
                  </div>
                )}

                {(() => {
                  const isEditingEven = !workingBranding.cardUniformStyles && cardDesignSubtab === 'even';
                  const layoutVal = isEditingEven ? (workingBranding.cardLayoutEven || 'row') : (workingBranding.cardLayout || 'row');
                  const orderVal = isEditingEven ? (workingBranding.cardElementOrderEven || 'image-first') : (workingBranding.cardElementOrder || 'image-first');
                  const alignVal = isEditingEven ? (workingBranding.cardTextAlignmentEven || 'left') : (workingBranding.cardTextAlignment || 'left');
                  const paddingVal = isEditingEven ? (workingBranding.cardPaddingEven || 'normal') : (workingBranding.cardPadding || 'normal');
                  const borderWVal = isEditingEven ? (workingBranding.cardBorderWidthEven || '1px') : (workingBranding.cardBorderWidth || '1px');
                  const shadowVal = isEditingEven ? (workingBranding.cardShadowEven || 'medium') : (workingBranding.cardShadow || 'medium');

                  const photoShape = isEditingEven ? (workingBranding.cardPhotoShapeEven || 'square') : (workingBranding.cardPhotoShape || 'square');
                  const photoBorder = isEditingEven ? (workingBranding.cardPhotoBorderEven || 'none') : (workingBranding.cardPhotoBorder || 'none');
                  const photoShadow = isEditingEven ? (workingBranding.cardPhotoShadowEven || 'none') : (workingBranding.cardPhotoShadow || 'none');
                  const photoTranslate = isEditingEven ? (workingBranding.cardPhotoTranslateEven ?? 0) : (workingBranding.cardPhotoTranslate ?? 0);
                  const photoTranslateVal = photoTranslate || (isEditingEven ? 100 : 1);

                  return (
                    <div className="space-y-4 pt-1">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-amber-300 font-bold bg-amber-400/5 px-2.5 py-1 rounded border border-amber-400/20">
                        Editando: {isEditingEven ? 'Estilo de Ficha PAR (Pares)' : 'Estilo de Ficha IMPAR (Impares / General)'}
                      </div>

                      {/* 1. Mover de Lugar / Disposición General (Card Layout) */}
                      <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                        <span className="text-xs font-bold text-white block">1. Estilo de Disposición (Layout):</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'row' as const, label: 'Fila Compacta' },
                            { id: 'column' as const, label: 'Tarjeta Vertical' },
                            { id: 'cover' as const, label: 'Fondo de Imagen' }
                          ].map(lay => (
                            <button
                              type="button"
                              key={lay.id}
                              onClick={() => updateBranding(isEditingEven ? 'cardLayoutEven' : 'cardLayout', lay.id)}
                              className={`p-2 rounded-xl text-xs transition cursor-pointer border font-bold ${
                                layoutVal === lay.id
                                  ? 'bg-amber-400 text-black border-amber-400'
                                  : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                              }`}
                            >
                              {lay.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Coordenada / Orden de Elementos */}
                      <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                        <span className="text-xs font-bold text-white block">2. Secuencia de Elementos (Orden):</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'image-first' as const, label: 'Imagen Primero' },
                            { id: 'title-first' as const, label: 'Textos Primero' }
                          ].map(order => (
                            <button
                              type="button"
                              key={order.id}
                              onClick={() => updateBranding(isEditingEven ? 'cardElementOrderEven' : 'cardElementOrder', order.id)}
                              className={`p-2 rounded-xl text-xs transition cursor-pointer border font-bold ${
                                orderVal === order.id
                                  ? 'bg-amber-400 text-black border-amber-400'
                                  : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                              }`}
                            >
                              {order.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Propiedades de la Foto del Plato (Alineación, forma, bordes, sombras) */}
                      <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-4">
                        <span className="text-xs font-bold text-amber-300 block uppercase tracking-wider font-mono">
                          📸 Propiedades de la Foto del Plato
                        </span>

                        {/* Translación con topes magnéticos */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white font-medium">Traslación X (Alineación Horizontal):</span>
                            <span className="text-amber-400 font-mono font-bold">
                              {photoTranslateVal}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={100}
                            step={33}
                            value={photoTranslateVal}
                            onChange={(e) => updateBranding(isEditingEven ? 'cardPhotoTranslateEven' : 'cardPhotoTranslate', parseInt(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-neutral-500 px-1 font-mono">
                            <span>Borde Izq (1%)</span>
                            <span>Un Tercio (34%)</span>
                            <span>Dos Tercios (67%)</span>
                            <span>Borde Der (100%)</span>
                          </div>
                        </div>

                        {/* Forma de contenedor */}
                        <div className="space-y-1.5">
                          <span className="text-xs text-white block font-medium">Forma de Foto:</span>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'square' as const, label: 'Cuadrado' },
                              { id: 'circle' as const, label: 'Circular' },
                              { id: 'medialuna-izq' as const, label: 'Medialuna Izq' },
                              { id: 'medialuna-der' as const, label: 'Medialuna Der' },
                              { id: 'none' as const, label: 'Sin Contenedor', colSpan: true }
                            ].map(shape => (
                              <button
                                type="button"
                                key={shape.id}
                                onClick={() => updateBranding(isEditingEven ? 'cardPhotoShapeEven' : 'cardPhotoShape', shape.id)}
                                className={`p-1.5 rounded-lg text-xs transition cursor-pointer border font-bold ${
                                  shape.colSpan ? 'col-span-2' : ''
                                } ${
                                  photoShape === shape.id
                                    ? 'bg-amber-400 text-black border-amber-400'
                                    : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                                }`}
                              >
                                {shape.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Borde de foto */}
                        <div className="space-y-1.5">
                          <span className="text-xs text-white block font-medium">Borde de Foto:</span>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'none' as const, label: 'Ninguno' },
                              { id: 'thin' as const, label: 'Fino' },
                              { id: 'thick' as const, label: 'Grueso Oro' }
                            ].map(bord => (
                              <button
                                type="button"
                                key={bord.id}
                                onClick={() => updateBranding(isEditingEven ? 'cardPhotoBorderEven' : 'cardPhotoBorder', bord.id)}
                                className={`p-1.5 rounded-lg text-xs transition cursor-pointer border font-bold ${
                                  photoBorder === bord.id
                                    ? 'bg-amber-400 text-black border-amber-400'
                                    : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                                }`}
                              >
                                {bord.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sombra de foto */}
                        <div className="space-y-1.5">
                          <span className="text-xs text-white block font-medium">Sombra de Foto:</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { id: 'none' as const, label: 'Ninguna' },
                              { id: 'sutil' as const, label: 'Sutil' },
                              { id: 'medium' as const, label: 'Media' },
                              { id: 'intense' as const, label: 'Intensa' }
                            ].map(shd => (
                              <button
                                type="button"
                                key={shd.id}
                                onClick={() => updateBranding(isEditingEven ? 'cardPhotoShadowEven' : 'cardPhotoShadow', shd.id)}
                                className={`p-1 rounded-lg text-[10px] transition cursor-pointer border font-bold text-center ${
                                  photoShadow === shd.id
                                    ? 'bg-amber-400 text-black border-amber-400'
                                    : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                                }`}
                              >
                                {shd.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 4. Alineación de Textos */}
                      <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                        <span className="text-xs font-bold text-white block">4. Alineación del Texto:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'left' as const, label: 'Izquierda' },
                            { id: 'center' as const, label: 'Centro' },
                            { id: 'right' as const, label: 'Derecha' }
                          ].map(align => (
                            <button
                              type="button"
                              key={align.id}
                              onClick={() => updateBranding(isEditingEven ? 'cardTextAlignmentEven' : 'cardTextAlignment', align.id)}
                              className={`p-2 rounded-xl text-xs transition cursor-pointer border font-bold ${
                                alignVal === align.id
                                  ? 'bg-amber-400 text-black border-amber-400'
                                  : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                              }`}
                            >
                              {align.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 5. Espaciado / Relleno (Card Padding) */}
                      <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                        <span className="text-xs font-bold text-white block">5. Relleno Interno (Padding):</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'compact' as const, label: 'Compacto' },
                            { id: 'normal' as const, label: 'Balanceado' },
                            { id: 'elegant' as const, label: 'Elegante' }
                          ].map(pad => (
                            <button
                              type="button"
                              key={pad.id}
                              onClick={() => updateBranding(isEditingEven ? 'cardPaddingEven' : 'cardPadding', pad.id)}
                              className={`p-2 rounded-xl text-xs transition cursor-pointer border font-bold ${
                                paddingVal === pad.id
                                  ? 'bg-amber-400 text-black border-amber-400'
                                  : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                              }`}
                            >
                              {pad.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 6. Grosor de Borde (Card Border Width) */}
                      <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                        <span className="text-xs font-bold text-white block">6. Grosor del Borde:</span>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Ninguno', val: '0px' },
                            { label: 'Fino', val: '1px' },
                            { label: 'Grueso', val: '2px' },
                            { label: 'X-Grueso', val: '4px' }
                          ].map(b => (
                            <button
                              type="button"
                              key={b.val}
                              onClick={() => updateBranding(isEditingEven ? 'cardBorderWidthEven' : 'cardBorderWidth', b.val)}
                              className={`p-2 rounded-xl text-xs transition cursor-pointer border font-bold ${
                                borderWVal === b.val
                                  ? 'bg-amber-400 text-black border-amber-400'
                                  : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 7. Sombras & Glow de Marca (Card Shadow Intensity) */}
                      <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                        <span className="text-xs font-bold text-white block">7. Sombra & Brillo (Neon Glow):</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'none' as const, label: 'Sin Sombra' },
                            { id: 'sutil' as const, label: 'Sutil' },
                            { id: 'medium' as const, label: 'Media' },
                            { id: 'intense' as const, label: 'Intensa' },
                            { id: 'glow' as const, label: 'Brillo Marca' }
                          ].map(sh => (
                            <button
                              type="button"
                              key={sh.id}
                              onClick={() => updateBranding(isEditingEven ? 'cardShadowEven' : 'cardShadow', sh.id)}
                              className={`p-2 rounded-xl text-xs transition cursor-pointer border font-bold ${
                                shadowVal === sh.id
                                  ? 'bg-amber-400 text-black border-amber-400'
                                  : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                              }`}
                            >
                              {sh.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* General/Global Parameters */}
                <div className="pt-4 border-t border-neutral-800 space-y-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold block">
                    Parámetros Generales de Diseño
                  </span>

                  {/* Mostrar ficha a pantalla completa en vista móvil */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Ficha Móvil a Pantalla Completa</span>
                      <span className="text-[10px] text-neutral-400">Las tarjetas tomarán el alto total de pantalla móvil</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={workingBranding.cardMobileFullscreen === true}
                      onChange={(e) => updateBranding('cardMobileFullscreen', e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-700 text-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* Curvatura de Esquinas (Border Radius) */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                    <span className="text-xs font-bold text-white block">Curvatura de Esquinas (Radio):</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Recto (0px)', val: '0px' },
                        { label: 'Sutil (8px)', val: '8px' },
                        { label: 'Curvo (16px)', val: '16px' },
                        { label: 'Píldora (24px)', val: '24px' }
                      ].map(r => (
                        <button
                          type="button"
                          key={r.val}
                          onClick={() => updateBranding('cardBorderRadius', r.val)}
                          className={`p-2 rounded-xl text-xs font-mono transition cursor-pointer border ${
                            workingBranding.cardBorderRadius === r.val
                              ? 'bg-amber-400 text-black font-bold border-amber-400'
                              : 'bg-black border-neutral-800 text-neutral-300 hover:border-neutral-600'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Altura del Banner / Cabecera */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Altura de Cabecera / Banner:</span>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        {workingBranding.headerBannerHeight || 120} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={260}
                      step={10}
                      value={workingBranding.headerBannerHeight || 120}
                      onChange={(e) => updateBranding('headerBannerHeight', parseInt(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* Elementos Visibles de Cabecera */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                    <span className="text-xs font-bold text-white block">Elementos Visibles de Cabecera:</span>
                    
                    <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                      <span>Mostrar Nombre de Restaurante</span>
                      <input
                        type="checkbox"
                        checked={workingBranding.showHeaderName !== false}
                        onChange={(e) => updateBranding('showHeaderName', e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-700 text-amber-400 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                      <span>Mostrar Slogan / Subtítulo</span>
                      <input
                        type="checkbox"
                        checked={workingBranding.showHeaderTagline !== false}
                        onChange={(e) => updateBranding('showHeaderTagline', e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-700 text-amber-400 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                      <span>Mostrar Distintivo de Carta</span>
                      <input
                        type="checkbox"
                        checked={workingBranding.showHeaderBadge !== false}
                        onChange={(e) => updateBranding('showHeaderBadge', e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-700 text-amber-400 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 5: ASIGNAR A LOCALES                                      */}
            {/* ------------------------------------------------------------- */}
            {inspectorTab === 'assign' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold block">
                    Asignación & Guardado Multi-Sede
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Guarda los estilos en el local activo o replícalos en toda tu cadena.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Guardar únicamente en "{selectedRestaurant?.name}"
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Aplica la plantilla y paleta de colores exclusivamente a este restaurante.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveToRestaurant}
                    className="w-full py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar en {selectedRestaurant?.name}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Aplicar a Todas las Sedes ({restaurants.length})
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Unifica la identidad visual en todos los restaurantes registrados.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyToAllRestaurants}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <Check className="w-4 h-4" />
                    <span>Replicar en Todos los Locales</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Footer Actions */}
          <div className="p-4 bg-black border-t border-neutral-800 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                setWorkingBranding({ ...defaultBranding });
                showNotification('Estilos restablecidos a los valores por defecto.');
              }}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>

            <button
              onClick={handleSaveToRestaurant}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
