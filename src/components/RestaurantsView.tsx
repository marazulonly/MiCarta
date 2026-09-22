import React, { useState } from 'react';
import { 
  Globe, 
  Palette, 
  Utensils, 
  Plus, 
  Check, 
  Copy, 
  ExternalLink, 
  Save, 
  QrCode,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory } from '../types';

interface RestaurantsViewProps {
  restaurants: Restaurant[];
  categories: MenuCategory[];
  items: MenuItem[];
  onUpdateRestaurant: (updated: Restaurant) => void;
  onUpdateMenuItem: (updated: MenuItem) => void;
  onAddMenuItem: (newItem: MenuItem) => void;
  onOpenCustomerPreview: (restaurant: Restaurant) => void;
}

export const RestaurantsView: React.FC<RestaurantsViewProps> = ({
  restaurants,
  categories,
  items,
  onUpdateRestaurant,
  onUpdateMenuItem,
  onAddMenuItem,
  onOpenCustomerPreview,
}) => {
  const [selectedRestId, setSelectedRestId] = useState<string>(restaurants[0]?.id || 'rest-brasas');
  const [activeTab, setActiveTab] = useState<'link' | 'branding' | 'menu'>('link');
  
  const currentRestaurant = restaurants.find(r => r.id === selectedRestId) || restaurants[0];

  // Slug editing
  const [editableSlug, setEditableSlug] = useState<string>(currentRestaurant.slug);
  const [slugSaved, setSlugSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Palette editing
  const [primaryColor, setPrimaryColor] = useState(currentRestaurant.branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(currentRestaurant.branding.secondaryColor);
  const [accentColor, setAccentColor] = useState(currentRestaurant.branding.accentColor);
  const [darkBgColor, setDarkBgColor] = useState(currentRestaurant.branding.darkBgColor);
  const [paletteSaved, setPaletteSaved] = useState(false);

  // Switch restaurant
  const handleSelectRestaurant = (id: string) => {
    setSelectedRestId(id);
    const rest = restaurants.find(r => r.id === id);
    if (rest) {
      setEditableSlug(rest.slug);
      setPrimaryColor(rest.branding.primaryColor);
      setSecondaryColor(rest.branding.secondaryColor);
      setAccentColor(rest.branding.accentColor);
      setDarkBgColor(rest.branding.darkBgColor);
    }
  };

  const handleSaveSlug = () => {
    const clean = editableSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    setEditableSlug(clean);
    onUpdateRestaurant({
      ...currentRestaurant,
      slug: clean
    });
    setSlugSaved(true);
    setTimeout(() => setSlugSaved(false), 2500);
  };

  const handleSavePalette = () => {
    onUpdateRestaurant({
      ...currentRestaurant,
      branding: {
        ...currentRestaurant.branding,
        primaryColor,
        secondaryColor,
        accentColor,
        darkBgColor
      }
    });
    setPaletteSaved(true);
    setTimeout(() => setPaletteSaved(false), 2500);
  };

  const toggleDishAvailability = (item: MenuItem) => {
    onUpdateMenuItem({
      ...item,
      isAvailable: !item.isAvailable
    });
  };

  // Dish modal
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('18.00');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('');

  const currentCategories = categories.filter(c => c.restaurantId === currentRestaurant.id);
  const currentItems = items.filter(i => i.restaurantId === currentRestaurant.id);

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName) return;

    const newItem: MenuItem = {
      id: `item-custom-${Date.now()}`,
      restaurantId: currentRestaurant.id,
      categoryId: newDishCategory || currentCategories[0]?.id || 'cat-gen',
      name: newDishName,
      description: newDishDesc || 'Preparado con insumos frescos seleccionados.',
      price: parseFloat(newDishPrice) || 15.00,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      prepTimeMinutes: 15,
      allergens: [],
      tags: ['Nuevo']
    };

    onAddMenuItem(newItem);
    setIsDishModalOpen(false);
    setNewDishName('');
    setNewDishPrice('18.00');
    setNewDishDesc('');
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Gestión de Restaurantes
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configuración de enlaces únicos, identidad visual y cartas para cada sede.
          </p>
        </div>

        <button
          onClick={() => onOpenCustomerPreview(currentRestaurant)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer self-start sm:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Ver Carta Pública</span>
        </button>
      </div>

      {/* 4 Restaurant Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {restaurants.map(rest => {
          const isSelected = rest.id === currentRestaurant.id;
          return (
            <button
              key={rest.id}
              onClick={() => handleSelectRestaurant(rest.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                isSelected
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
            >
              {rest.name}
            </button>
          );
        })}
      </div>

      {/* Restaurant Overview Card */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-6">
        
        {/* Info Line */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{currentRestaurant.name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                {currentRestaurant.cuisineType}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{currentRestaurant.address}</p>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('link')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'link' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Link Único
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'menu' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Carta Digital ({currentItems.length})
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === 'branding' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Colores & Marca
            </button>
          </div>
        </div>

        {/* Tab 1: Unique Slug Link */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Enlace Único de la Carta
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Dirección web pública personalizada para menús QR y redes sociales.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 flex-1 focus-within:border-white transition">
                  <span className="text-xs text-neutral-400 font-mono">https://micarta.io/r/</span>
                  <input
                    type="text"
                    value={editableSlug}
                    onChange={(e) => setEditableSlug(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none flex-1 ml-1"
                  />
                </div>

                <button
                  onClick={handleSaveSlug}
                  className="px-4 py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer shrink-0"
                >
                  Guardar Slug
                </button>
              </div>

              {slugSaved && (
                <p className="text-xs text-neutral-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Enlace actualizado a <strong>https://micarta.io/r/{currentRestaurant.slug}</strong></span>
                </p>
              )}

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-400">
                  <QrCode className="w-4 h-4 text-white" />
                  <span>QR de mesa sincronizado con este link</span>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://micarta.io/r/${currentRestaurant.slug}`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white font-medium cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado' : 'Copiar URL'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Digital Menu */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Platos y Catálogo
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Control de disponibilidad inmediata (86'd) y precios.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenCustomerPreview(currentRestaurant)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-medium transition cursor-pointer"
                  title="Abrir la carta digital con el formato de la imagen de referencia"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#dfb86c]" />
                  <span>Ver Carta Digital</span>
                </button>

                <button
                  onClick={() => setIsDishModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Plato</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-neutral-800/80 border border-neutral-800 rounded-xl bg-black overflow-hidden">
              {currentItems.map(item => (
                <div 
                  key={item.id}
                  className={`p-3.5 flex items-center justify-between gap-3 ${
                    item.isAvailable ? 'hover:bg-neutral-900/50' : 'opacity-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.name}</span>
                      {!item.isAvailable && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                          Agotado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-white font-mono">
                      ${item.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => toggleDishAvailability(item)}
                      className={`text-[10px] font-mono uppercase px-2 py-1 rounded border cursor-pointer transition ${
                        item.isAvailable 
                          ? 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white' 
                          : 'border-neutral-800 bg-black text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {item.isAvailable ? 'Disponible' : 'Agotado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Branding & Colors */}
        {activeTab === 'branding' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Paleta Cromática del Local
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Valores hexadecimales para la personalización de la carta digital de {currentRestaurant.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-black border border-neutral-800 space-y-1.5">
                <span className="text-[11px] text-neutral-400 font-medium block">Color Primario</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: primaryColor }} />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black border border-neutral-800 space-y-1.5">
                <span className="text-[11px] text-neutral-400 font-medium block">Color Secundario</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: secondaryColor }} />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black border border-neutral-800 space-y-1.5">
                <span className="text-[11px] text-neutral-400 font-medium block">Color de Acento</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: accentColor }} />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black border border-neutral-800 space-y-1.5">
                <span className="text-[11px] text-neutral-400 font-medium block">Fondo Nocturno</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: darkBgColor }} />
                  <input
                    type="text"
                    value={darkBgColor}
                    onChange={(e) => setDarkBgColor(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {paletteSaved ? (
                <span className="text-xs text-neutral-300">✓ Paleta guardada</span>
              ) : <div />}

              <button
                onClick={handleSavePalette}
                className="px-4 py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer"
              >
                Guardar Colores
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal: Create Dish */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              Nuevo Plato — {currentRestaurant.name}
            </h3>

            <form onSubmit={handleCreateDish} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Precio ($ USD)</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Categoría</label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                  >
                    {currentCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
