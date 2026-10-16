import React, { useState, useMemo } from 'react';
import { 
  MenuTemplate, 
  Restaurant, 
  MenuItem, 
  MenuCategory, 
  TemplateDesignLayer 
} from '../types';
import { 
  VISUAL_TEMPLATES_DESIGN_LAYERS, 
  templateDesignLayerToMenuTemplate, 
  menuTemplateToDesignLayer 
} from '../data/visualTemplatesData';
import { 
  LayoutTemplate, 
  Search, 
  SlidersHorizontal, 
  Eye, 
  Check, 
  ArrowRight, 
  Store, 
  Copy, 
  Trash2, 
  ShieldCheck, 
  Palette, 
  FilePlus2, 
  X, 
  Info, 
  Sparkles,
  UtensilsCrossed,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

interface TemplateLibraryProps {
  templates: MenuTemplate[];
  restaurants: Restaurant[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  onOpenTemplateSplitEditor: (templateToLoad?: MenuTemplate | TemplateDesignLayer) => void;
  onUpdateRestaurant: (updated: Restaurant) => void;
  onSaveTemplate?: (template: MenuTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onOpenCustomerPreview?: (restaurant: Restaurant) => void;
}

const CATEGORY_FILTERS = [
  { id: 'ALL', label: 'Todas las Plantillas' },
  { id: 'GOURMET_PREMIUM', label: 'Gourmet Premium' },
  { id: 'EDITORIAL_MODERNO', label: 'Editorial Moderno' },
  { id: 'CLASICO_VINTAGE', label: 'Clásico Vintage' },
  { id: 'FAST_FOOD', label: 'Fast Food' },
  { id: 'MINIMALISTA', label: 'Minimalista' },
  { id: 'ELEGANTE', label: 'Elegante' },
  { id: 'GASTRONOMICO_FOTOGRAFICO', label: 'Gastronómico' },
  { id: 'CUSTOM', label: 'Personalizadas' },
];

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates = [],
  restaurants = [],
  categories = [],
  menuItems = [],
  onOpenTemplateSplitEditor,
  onUpdateRestaurant,
  onSaveTemplate,
  onDeleteTemplate,
  onOpenCustomerPreview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [applyingTemplate, setApplyingTemplate] = useState<MenuTemplate | null>(null);
  const [targetRestaurantId, setTargetRestaurantId] = useState<string>(restaurants[0]?.id || '');
  const [previewTemplate, setPreviewTemplate] = useState<MenuTemplate | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Combine loaded templates with default visual templates, ensuring no duplicates by ID
  const allTemplates = useMemo(() => {
    const list = [...templates];
    const existingIds = new Set(list.map(t => t.id));
    for (const defLayer of VISUAL_TEMPLATES_DESIGN_LAYERS) {
      if (!existingIds.has(defLayer.id)) {
        list.push(templateDesignLayerToMenuTemplate(defLayer));
        existingIds.add(defLayer.id);
      }
    }
    return list;
  }, [templates]);

  // Filtered templates list
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      const matchesSearch = 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'CUSTOM') {
        return t.isCustomizable || t.themeStyle === 'custom' || t.id.startsWith('custom-');
      }
      return (
        t.category === selectedCategory ||
        t.designLayer?.category === selectedCategory ||
        t.themeStyle?.toUpperCase().includes(selectedCategory)
      );
    });
  }, [allTemplates, searchTerm, selectedCategory]);

  // Handle applying ONLY design layer to selected restaurant (CRITICAL: Preserves dishes and categories!)
  const handleApplyDesignLayer = () => {
    if (!applyingTemplate || !targetRestaurantId) return;

    const targetRest = restaurants.find(r => r.id === targetRestaurantId);
    if (!targetRest) return;

    const designLayer = applyingTemplate.designLayer || menuTemplateToDesignLayer(applyingTemplate);

    // Build decoupled branding using strictly the visual properties of the design layer
    const updatedBranding = {
      ...targetRest.branding,
      primaryColor: designLayer.primaryColor,
      darkBgColor: designLayer.darkBgColor,
      cardBgColor: designLayer.cardBgColor || targetRest.branding?.cardBgColor,
      buttonColor: designLayer.buttonColor || designLayer.primaryColor,
      buttonTextColor: designLayer.buttonTextColor || '#FFFFFF',
      textColor: designLayer.textColor || targetRest.branding?.textColor || '#FFFFFF',
      fontDisplay: designLayer.fontDisplay,
      priceColor: designLayer.priceColor || designLayer.primaryColor,
      cardBorderRadius: designLayer.cardBorderRadius || '16px',
      cardStyle: designLayer.cardStyle || 'grid',
      headerStyle: designLayer.headerStyle || 'banner',
      layoutMode: designLayer.layoutMode || 'grid',
      dishNameFont: designLayer.dishNameFont || designLayer.fontDisplay,
      dishDescFont: designLayer.dishDescFont,
      dishPriceFont: designLayer.dishPriceFont || designLayer.fontDisplay,
      restaurantNameFont: designLayer.restaurantNameFont || designLayer.fontDisplay,
      restaurantNameColor: designLayer.restaurantNameColor,
      dishCardBgColor: designLayer.dishCardBgColor || designLayer.cardBgColor,
      dishCardBorderColor: designLayer.dishCardBorderColor,
      cardLayout: designLayer.cardLayout,
      cardElementOrder: designLayer.cardElementOrder,
      cardTextAlignment: designLayer.cardTextAlignment,
      cardPadding: designLayer.cardPadding,
      cardShadow: designLayer.cardShadow,
      cardBorderWidth: designLayer.cardBorderWidth,
      // Pass canvas elements & config if provided
      canvasElements: designLayer.canvasElements || targetRest.branding?.canvasElements,
      canvasConfig: designLayer.canvasConfig || targetRest.branding?.canvasConfig,
      backgroundColor: designLayer.backgroundColor || designLayer.darkBgColor,
    };

    const updatedRestaurant: Restaurant = {
      ...targetRest,
      templateId: applyingTemplate.id,
      branding: updatedBranding,
    };

    onUpdateRestaurant(updatedRestaurant);
    setApplyingTemplate(null);
    showToast(`✓ Diseño "${applyingTemplate.name}" aplicado a "${targetRest.name}". Platos y categorías conservados al 100%.`);
  };

  // Handle duplicating template
  const handleDuplicateTemplate = (tmpl: MenuTemplate) => {
    const clonedId = `custom-tpl-${Date.now()}`;
    const cloned: MenuTemplate = {
      ...tmpl,
      id: clonedId,
      name: `${tmpl.name} (Copia)`,
      badge: 'Copia Personalizada',
      isCustomizable: true,
      activeRestaurantsCount: 0,
      designLayer: tmpl.designLayer ? {
        ...tmpl.designLayer,
        id: clonedId,
        name: `${tmpl.name} (Copia)`,
        badge: 'Copia Personalizada',
        isCustomizable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : undefined,
    };

    if (onSaveTemplate) {
      onSaveTemplate(cloned);
      showToast(`✓ Plantilla "${cloned.name}" duplicada con éxito.`);
    }
  };

  // Sample dish for preview modal
  const sampleDish: MenuItem = menuItems[0] || {
    id: 'sample-p1',
    restaurantId: '',
    categoryId: 'c-sample',
    name: 'Ceviche Mixto Clasico de la Casa',
    description: 'Pescado fresco del dia, langostinos, calamares crocantes con leche de tigre, choclo desgranado y camote glaseado.',
    price: 38.50,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
    prepTimeMinutes: 15,
    allergens: ['Pescado', 'Mariscos'],
    tags: ['Especialidad', 'Recomendado'],
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[99999] px-5 py-3 rounded-2xl bg-neutral-900 text-white text-xs font-mono font-bold shadow-2xl flex items-center gap-2.5 animate-bounce border border-neutral-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Module Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Módulo de Gestión de Plantillas Visuales</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Biblioteca de Plantillas & Diseños
            </h1>
            <p className="text-sm text-neutral-600 max-w-2xl leading-relaxed">
              Explora y aplica estilos de alta gastronomía, editorial de vanguardia, clásico vintage o fast food comercial.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenTemplateSplitEditor()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-md cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4 text-emerald-400" />
              <span>+ Nueva Plantilla en Blanco</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenTemplateSplitEditor(filteredTemplates[0])}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-bold transition cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-neutral-600" />
              <span>Abrir Editor Canvas</span>
            </button>
          </div>
        </div>

        {/* Principle of 2 Layers Card Callout */}
        <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-700">
            <strong className="font-bold text-neutral-900">Principio de 2 Capas Independientes: </strong>
            La <span className="font-semibold text-neutral-900">Capa de Diseño</span> (paleta, tipografías, tarjetas y posiciones del lienzo) está 100% desacoplada de la <span className="font-semibold text-neutral-900">Capa de Contenido</span> (categorías, platos, descripciones y precios). Puedes aplicar cualquier diseño visual a tu restaurante sin que se sobreescriba ni un solo plato o categoría de tu carta.
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, etiqueta o estilo..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Count summary */}
        <div className="text-xs text-neutral-500 font-mono shrink-0 hidden lg:block">
          {filteredTemplates.length} de {allTemplates.length} plantillas
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const isCustom = template.isCustomizable || template.id.startsWith('custom-');
          const primary = template.primaryColor || '#D4AF37';
          const darkBg = template.darkBgColor || '#0A0A0A';
          const cardBg = template.cardBgColor || '#141414';
          const textCol = template.textColor || '#FFFFFF';

          return (
            <div 
              key={template.id}
              className="group bg-white rounded-3xl border border-neutral-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Thumbnail Container */}
              <div className="relative h-52 w-full overflow-hidden bg-neutral-900">
                <img 
                  src={template.thumbnailUrl} 
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Badge Overlay */}
                <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                  <span 
                    className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-sm"
                    style={{ backgroundColor: `${primary}E6`, color: darkBg === '#FFFFFF' || darkBg === '#FAF3E8' ? '#000' : '#FFF' }}
                  >
                    {template.badge || template.category}
                  </span>
                  {isCustom && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600/90 text-white backdrop-blur-sm">
                      Custom
                    </span>
                  )}
                </div>

                {/* Color Swatches Overlay */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">
                  <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: primary }} title={`Primario: ${primary}`} />
                  <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: darkBg }} title={`Fondo: ${darkBg}`} />
                  <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: cardBg }} title={`Tarjeta: ${cardBg}`} />
                </div>

                {/* Title & Font in Thumbnail Bottom */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-sm truncate">
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-300">
                    <span className="font-mono">{template.fontDisplay?.split(',')[0]?.replace(/['"]/g, '') || 'Serif'}</span>
                    <span>•</span>
                    <span className="capitalize">{template.layoutMode || 'Grid'}</span>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {(template.tags || []).slice(0, 4).map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-medium rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition cursor-pointer"
                      title="Previsualizar plantilla"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit in Canvas Editor */}
                    <button
                      type="button"
                      onClick={() => onOpenTemplateSplitEditor(template)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition cursor-pointer"
                      title="Abrir en el editor interactivo tipo Canva/Figma"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Editar</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicateTemplate(template)}
                      className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                      title="Duplicar plantilla"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete (only customizable) */}
                    {isCustom && onDeleteTemplate && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar la plantilla "${template.name}"?`)) {
                            onDeleteTemplate(template.id);
                            showToast(`Plantilla "${template.name}" eliminada.`);
                          }
                        }}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                        title="Eliminar plantilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Apply to Restaurant Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setApplyingTemplate(template);
                      setTargetRestaurantId(restaurants[0]?.id || '');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Aplicar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No results fallback */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200 p-8">
          <LayoutTemplate className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No se encontraron plantillas</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Intenta con otro término de búsqueda o selecciona otra categoría.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
            }}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl transition"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* MODAL: APLICAR CAPA DE DISEÑO AL RESTAURANTE */}
      {applyingTemplate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-6 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: applyingTemplate.primaryColor }}
                >
                  <Palette className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Aplicar Capa de Diseño</h3>
                  <p className="text-xs text-neutral-300">
                    Plantilla: <strong className="text-white">{applyingTemplate.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApplyingTemplate(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Guarantee Callout */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong className="font-bold">Garantía de Integridad de Carta: </strong>
                  Esta acción transferirá únicamente colores, fuentes, estilos de tarjeta y lienzos visuales. <strong className="underline">Tus categorías, platos, precios y fotos del restaurante no se borrarán ni modificarán.</strong>
                </div>
              </div>

              {/* Target Restaurant Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">
                  Selecciona el restaurante destino:
                </label>
                {restaurants.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No tienes restaurantes creados aún. Crea un restaurante primero en la pestaña "Locales".
                  </p>
                ) : (
                  <div className="relative">
                    <select
                      value={targetRestaurantId}
                      onChange={(e) => setTargetRestaurantId(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer appearance-none pr-10"
                    >
                      {restaurants.map((rest) => (
                        <option key={rest.id} value={rest.id}>
                          {rest.name} ({rest.cuisineType || 'Restaurante'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Design Transfer Summary */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2 text-xs">
                <span className="font-bold text-neutral-900 block">Parámetros que se aplicarán:</span>
                <div className="grid grid-cols-2 gap-2 text-neutral-600 pt-1">
                  <div>• Paleta: <span className="font-mono text-neutral-900">{applyingTemplate.primaryColor}</span></div>
                  <div>• Fondo: <span className="font-mono text-neutral-900">{applyingTemplate.darkBgColor}</span></div>
                  <div>• Tipografía: <span className="font-semibold text-neutral-900">{applyingTemplate.fontDisplay?.split(',')[0]?.replace(/['"]/g, '')}</span></div>
                  <div>• Ficha: <span className="capitalize text-neutral-900">{applyingTemplate.cardStyle || 'Grid'}</span></div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setApplyingTemplate(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyDesignLayer}
                disabled={!targetRestaurantId || restaurants.length === 0}
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Aplicar Diseño Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW DE PLANTILLA VISUAL */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-neutral-200 animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: previewTemplate.primaryColor }}
                />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Vista Previa: {previewTemplate.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Estilo visual aplicado a plato de muestra
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tmpl = previewTemplate;
                    setPreviewTemplate(null);
                    onOpenTemplateSplitEditor(tmpl);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Abrir en Canvas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Simulation Viewport */}
            <div 
              className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col items-center justify-center"
              style={{ backgroundColor: previewTemplate.darkBgColor }}
            >
              {/* Mock Header */}
              <div className="text-center max-w-md w-full mb-8">
                <span 
                  className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border mb-3 inline-block"
                  style={{ 
                    borderColor: previewTemplate.primaryColor,
                    color: previewTemplate.primaryColor,
                    backgroundColor: `${previewTemplate.primaryColor}15`
                  }}
                >
                  {previewTemplate.badge}
                </span>
                <h2 
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ 
                    fontFamily: previewTemplate.fontDisplay,
                    color: previewTemplate.textColor || '#FFFFFF'
                  }}
                >
                  RESTAURANTE DE PRUEBA
                </h2>
                <div 
                  className="w-16 h-0.5 mx-auto my-3"
                  style={{ backgroundColor: previewTemplate.primaryColor }}
                />
                <p 
                  className="text-xs opacity-70"
                  style={{ color: previewTemplate.textColor || '#FFFFFF' }}
                >
                  Carta Digital de Alta Experiencia Culinaria
                </p>
              </div>

              {/* Mock Product Card rendered with this template's design */}
              <div 
                className="max-w-md w-full rounded-2xl overflow-hidden border transition shadow-xl"
                style={{ 
                  backgroundColor: previewTemplate.cardBgColor || '#141414',
                  borderColor: previewTemplate.designLayer?.dishCardBorderColor || `${previewTemplate.primaryColor}40`,
                  borderRadius: previewTemplate.cardBorderRadius || '16px',
                  borderWidth: previewTemplate.designLayer?.cardBorderWidth || '1px'
                }}
              >
                <div className="h-52 w-full overflow-hidden relative">
                  <img 
                    src={sampleDish.imageUrl} 
                    alt={sampleDish.name}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black shadow-md"
                    style={{ 
                      backgroundColor: previewTemplate.primaryColor,
                      color: previewTemplate.darkBgColor === '#FFFFFF' || previewTemplate.darkBgColor === '#FAF3E8' ? '#000' : '#000'
                    }}
                  >
                    S/ {sampleDish.price.toFixed(2)}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h4 
                    className="text-lg font-bold"
                    style={{ 
                      fontFamily: previewTemplate.designLayer?.dishNameFont || previewTemplate.fontDisplay,
                      color: previewTemplate.textColor || '#FFFFFF'
                    }}
                  >
                    {sampleDish.name}
                  </h4>
                  <p 
                    className="text-xs opacity-80 leading-relaxed"
                    style={{ 
                      fontFamily: previewTemplate.designLayer?.dishDescFont || "'Plus Jakarta Sans', sans-serif",
                      color: previewTemplate.textColor || '#FFFFFF'
                    }}
                  >
                    {sampleDish.description}
                  </p>

                  <div className="pt-3 flex items-center justify-between border-t border-white/10">
                    <span 
                      className="text-xs font-mono font-bold"
                      style={{ color: previewTemplate.primaryColor }}
                    >
                      {sampleDish.prepTimeMinutes} min de preparación
                    </span>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      style={{ 
                        backgroundColor: previewTemplate.buttonColor || previewTemplate.primaryColor,
                        color: previewTemplate.buttonTextColor || '#000000'
                      }}
                    >
                      Pedir Plato
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-neutral-500 font-medium">
                Tipografía: <strong className="text-neutral-900">{previewTemplate.fontDisplay?.split(',')[0]}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 transition"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmpl = previewTemplate;
                    setPreviewTemplate(null);
                    setApplyingTemplate(tmpl);
                  }}
                  className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aplicar a un Local</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
