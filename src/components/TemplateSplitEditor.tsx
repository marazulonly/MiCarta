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
  ExternalLink
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
  onClose,
}) => {
  // Selected restaurant for live editing
  const [selectedRestId, setSelectedRestId] = useState<string>(
    currentRestaurantId || restaurants[0]?.id || ''
  );

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestId) || restaurants[0];

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

  // Apply a template preset
  const handleSelectTemplate = (tmpl: MenuTemplate) => {
    setActiveTemplateId(tmpl.id);
    setWorkingBranding(prev => ({
      ...prev,
      primaryColor: tmpl.primaryColor,
      accentColor: tmpl.primaryColor,
      darkBgColor: tmpl.darkBgColor,
      cardBgColor: tmpl.cardBgColor || tmpl.darkBgColor,
      dishCardBgColor: tmpl.cardBgColor || tmpl.darkBgColor,
      buttonColor: tmpl.buttonColor || tmpl.primaryColor,
      buttonTextColor: tmpl.buttonTextColor || '#000000',
      textColor: tmpl.textColor || '#FFFFFF',
      fontDisplay: tmpl.fontDisplay,
      cardBorderRadius: tmpl.cardBorderRadius || '12px',
      cardStyle: tmpl.cardStyle || 'grid',
      headerStyle: tmpl.headerStyle || 'banner'
    }));
    showNotification(`Plantilla "${tmpl.name}" seleccionada.`);
  };

  // Save changes to current restaurant
  const handleSaveToRestaurant = () => {
    if (!selectedRestaurant) return;

    const updatedRest: Restaurant = {
      ...selectedRestaurant,
      templateId: activeTemplateId,
      branding: {
        ...workingBranding
      }
    };

    onUpdateRestaurant(updatedRest);
    showNotification(`✓ Configuración y colores guardados exitosamente en "${selectedRestaurant.name}".`);
  };

  // Save changes to ALL restaurants
  const handleApplyToAllRestaurants = () => {
    restaurants.forEach(rest => {
      const updatedRest: Restaurant = {
        ...rest,
        templateId: activeTemplateId,
        branding: {
          ...workingBranding
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
                const isEditorial = activeTemplateId === 'tmpl-editorial';
                const isEven = idx % 2 === 1;

                if (isEditorial) {
                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: workingBranding.cardBgColor || '#FAF8F5',
                        color: workingBranding.textColor || '#1A1A1A'
                      }}
                      className="p-3 border border-neutral-900/10 rounded-xl transition flex items-center gap-3 shadow-md"
                    >
                      <div className={`flex items-center gap-3 w-full ${isEven ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                        {item.imageUrl && (
                          <div className={`shrink-0 flex items-center ${isEven ? 'pl-2 border-l-2 border-neutral-900' : 'pr-2 border-r-2 border-neutral-900'}`}>
                            <div className={`w-16 h-16 overflow-hidden bg-neutral-900/10 shadow border border-neutral-900/20 ${isEven ? 'rounded-l-full' : 'rounded-r-full'}`}>
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 
                            className="text-xs sm:text-sm font-bold font-serif line-clamp-1 text-neutral-900"
                            style={{
                              fontFamily: workingBranding.dishNameFont || workingBranding.fontDisplay || 'serif'
                            }}
                          >
                            {item.name}
                          </h3>
                          <p 
                            className="text-[11px] opacity-80 mt-0.5 line-clamp-1 italic font-serif"
                            style={{
                              fontFamily: workingBranding.dishDescFont || 'serif'
                            }}
                          >
                            {item.description}
                          </p>
                          <div className={`flex items-center gap-2 mt-1.5 ${isEven ? 'justify-end' : 'justify-start'}`}>
                            <span 
                              className="text-xs font-bold font-serif"
                              style={{
                                color: workingBranding.priceColor || '#111827',
                                fontFamily: workingBranding.dishPriceFont || 'serif'
                              }}
                            >
                              S/ {item.price.toFixed(2)}
                            </span>
                            <span className="text-[10px] bg-neutral-900 text-amber-300 px-2 py-0.5 rounded font-sans font-bold">
                              + Pedir
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                const cardBg = workingBranding.dishCardBgColor || workingBranding.cardBgColor || 'rgba(255,255,255,0.05)';
                const cardRadius = workingBranding.cardBorderRadius || '12px';
                const cardBorder = workingBranding.dishCardBorderColor || (workingBranding.buttonColor ? `${workingBranding.buttonColor}50` : 'rgba(255,255,255,0.1)');

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: cardBg,
                      borderRadius: cardRadius,
                      borderColor: cardBorder,
                      color: workingBranding.textColor || '#FFFFFF'
                    }}
                    className="p-3.5 border transition flex flex-col justify-between shadow-md"
                  >
                    <div className="flex gap-3">
                      {item.imageUrl && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/40 shrink-0">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 
                            className="text-sm font-bold line-clamp-1"
                            style={{
                              fontFamily: workingBranding.dishNameFont || workingBranding.fontDisplay || 'inherit'
                            }}
                          >
                            {item.name}
                          </h3>
                        </div>

                        <p 
                          className="text-xs opacity-80 mt-1 line-clamp-2 leading-relaxed"
                          style={{
                            fontFamily: workingBranding.dishDescFont || 'inherit'
                          }}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
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

                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-neutral-600'}`} />
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
            {/* TAB 4: TARJETAS & BORDES                                      */}
            {/* ------------------------------------------------------------- */}
            {inspectorTab === 'cards' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold block">
                    Formato de Tarjetas & Cuadrícula
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Modifica el radio de las esquinas y proporciones de las fichas.
                  </p>
                </div>

                {/* Border Radius */}
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <span className="text-xs font-bold text-white block">Curvatura de Esquinas (Border Radius):</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Recto (0px)', val: '0px' },
                      { label: 'Sutil (8px)', val: '8px' },
                      { label: 'Curvo (16px)', val: '16px' },
                      { label: 'Píldora (24px)', val: '24px' }
                    ].map(r => (
                      <button
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

                {/* Header Height */}
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

                {/* Header elements toggles */}
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                  <span className="text-xs font-bold text-white block">Elementos Visibles de Cabecera:</span>
                  
                  <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                    <span>Mostrar Nombre de Restaurante</span>
                    <input
                      type="checkbox"
                      checked={workingBranding.showHeaderName !== false}
                      onChange={(e) => updateBranding('showHeaderName', e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-700 text-amber-400"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                    <span>Mostrar Slogan / Subtítulo</span>
                    <input
                      type="checkbox"
                      checked={workingBranding.showHeaderTagline !== false}
                      onChange={(e) => updateBranding('showHeaderTagline', e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-700 text-amber-400"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
                    <span>Mostrar Distintivo de Carta</span>
                    <input
                      type="checkbox"
                      checked={workingBranding.showHeaderBadge !== false}
                      onChange={(e) => updateBranding('showHeaderBadge', e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-700 text-amber-400"
                    />
                  </label>
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
