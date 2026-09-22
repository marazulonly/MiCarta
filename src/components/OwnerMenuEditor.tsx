import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Image as ImageIcon, 
  Sparkles, 
  DollarSign, 
  Layers, 
  Palette, 
  Eye, 
  SlidersHorizontal, 
  Utensils, 
  AlertCircle,
  Tag,
  Clock,
  CheckCircle2,
  FolderPlus,
  Compass
} from 'lucide-react';
import { 
  Restaurant, 
  MenuItem, 
  MenuCategory, 
  DishAddon, 
  MenuAccessSettings 
} from '../types';

interface OwnerMenuEditorProps {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  onUpdateRestaurant: (updated: Restaurant) => void;
  onAddMenuItem: (newItem: MenuItem) => void;
  onUpdateMenuItem: (updatedItem: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
  onAddCategory: (newCategory: MenuCategory) => void;
  onUpdateCategory: (updatedCategory: MenuCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onOpenCustomerPreview: (restaurant: Restaurant, mode?: 'DINE_IN' | 'DELIVERY') => void;
}

export const OwnerMenuEditor: React.FC<OwnerMenuEditorProps> = ({
  restaurant,
  categories,
  items,
  onUpdateRestaurant,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onOpenCustomerPreview,
}) => {
  const [subTab, setSubTab] = useState<'items' | 'categories' | 'backgrounds'>('items');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter categories and items for this restaurant
  const restaurantCategories = categories.filter(c => c.restaurantId === restaurant.id);
  const restaurantItems = items.filter(i => {
    const matchRest = i.restaurantId === restaurant.id;
    if (selectedCategoryFilter === 'all') return matchRest;
    return matchRest && i.categoryId === selectedCategoryFilter;
  });

  // --- Modal: Crear / Editar Plato ---
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(35);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formPrepTime, setFormPrepTime] = useState<number>(20);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formTargetScope, setFormTargetScope] = useState<'ALL' | 'DINE_IN' | 'DELIVERY'>('ALL');
  const [formAddons, setFormAddons] = useState<DishAddon[]>([]);
  const [formObservations, setFormObservations] = useState<string[]>([]);

  // Temp inputs for adding new addon / observation
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState<number>(4);
  const [newObsText, setNewObsText] = useState('');

  // Pre-selected stock photos for rapid dish creation
  const STOCK_PHOTOS = [
    { label: 'Parrilla / Carnes', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80' },
    { label: 'Cortes Angus', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
    { label: 'Anticuchos / Brochetas', url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80' },
    { label: 'Ceviche Fresco', url: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=600&auto=format&fit=crop&q=80' },
    { label: 'Smash Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
    { label: 'Cóctel de Autor', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
  ];

  const handleOpenNewItemModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormPrice(38);
    setFormCategoryId(restaurantCategories[0]?.id || '');
    setFormImageUrl(STOCK_PHOTOS[0].url);
    setFormPrepTime(20);
    setFormIsAvailable(true);
    setFormTargetScope('ALL');
    setFormAddons([
      { id: `add-${Date.now()}-1`, name: 'Porción de Papas Extra', price: 6.0 },
      { id: `add-${Date.now()}-2`, name: 'Huevo Frito Artesanal', price: 3.5 }
    ]);
    setFormObservations([
      'Término medio',
      'Bien cocido',
      'Sin cebolla',
      'Salsa aparte'
    ]);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price);
    setFormCategoryId(item.categoryId);
    setFormImageUrl(item.imageUrl);
    setFormPrepTime(item.prepTimeMinutes || 15);
    setFormIsAvailable(item.isAvailable);
    setFormTargetScope(item.targetMenuScope || 'ALL');
    setFormAddons(item.availableAddons ? [...item.availableAddons] : []);
    setFormObservations(item.suggestedObservations ? [...item.suggestedObservations] : []);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      const updated: MenuItem = {
        ...editingItem,
        name: formName.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        categoryId: formCategoryId || restaurantCategories[0]?.id,
        imageUrl: formImageUrl || STOCK_PHOTOS[0].url,
        prepTimeMinutes: Number(formPrepTime),
        isAvailable: formIsAvailable,
        targetMenuScope: formTargetScope,
        availableAddons: formAddons,
        suggestedObservations: formObservations,
      };
      onUpdateMenuItem(updated);
      showToast(`Plato "${updated.name}" actualizado con éxito`);
    } else {
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        restaurantId: restaurant.id,
        categoryId: formCategoryId || restaurantCategories[0]?.id || `cat-${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        imageUrl: formImageUrl || STOCK_PHOTOS[0].url,
        isAvailable: formIsAvailable,
        isPopular: false,
        isChefSpecial: false,
        prepTimeMinutes: Number(formPrepTime),
        allergens: [],
        tags: [],
        targetMenuScope: formTargetScope,
        availableAddons: formAddons,
        suggestedObservations: formObservations,
      };
      onAddMenuItem(newItem);
      showToast(`Nuevo plato "${newItem.name}" creado con éxito`);
    }
    setIsItemModalOpen(false);
  };

  // --- Modal: Crear / Editar Categoría ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIcon, setCatIcon] = useState('Flame');

  const handleOpenNewCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setCatIcon('Flame');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description);
    setCatIcon(cat.iconName || 'Flame');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCategory) {
      const updated: MenuCategory = {
        ...editingCategory,
        name: catName.trim(),
        description: catDescription.trim(),
        iconName: catIcon,
      };
      onUpdateCategory(updated);
      showToast(`Categoría "${updated.name}" actualizada`);
    } else {
      const newCat: MenuCategory = {
        id: `cat-${restaurant.id}-${Date.now()}`,
        restaurantId: restaurant.id,
        name: catName.trim(),
        description: catDescription.trim(),
        sortOrder: restaurantCategories.length + 1,
        iconName: catIcon,
      };
      onAddCategory(newCat);
      showToast(`Categoría "${newCat.name}" creada con éxito`);
    }
    setIsCategoryModalOpen(false);
  };

  // --- Configuración de Cartas y Fondos (Presencial vs Delivery) ---
  const initialSettings: MenuAccessSettings = restaurant.menuAccessSettings || {
    menuMode: 'SAME',
    presentialTitle: `Carta Salón - ${restaurant.name}`,
    presentialBgType: 'theme',
    presentialBgValue: restaurant.branding.darkBgColor || '#071A14',
    deliveryTitle: `Carta Delivery - ${restaurant.name}`,
    deliveryBgType: 'gradient',
    deliveryBgValue: 'linear-gradient(180deg, #071A14 0%, #0F2D24 100%)',
    deliveryMinOrder: 40,
    deliveryEstimatedMinutes: 35,
  };

  const [menuSettings, setMenuSettings] = useState<MenuAccessSettings>(initialSettings);

  const handleSaveMenuSettings = () => {
    const updatedRest: Restaurant = {
      ...restaurant,
      menuAccessSettings: menuSettings,
    };
    onUpdateRestaurant(updatedRest);
    showToast('Configuración de cartas, accesos y fondos guardada con éxito');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">
              Gestión Integral de Carta y Platos: {restaurant.name}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
              Plantilla: {restaurant.templateId || 'Bespoke'} (Intacta)
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Crea y edita categorías, platos, adicionales, observaciones y fondos independientes para Salón y Delivery sin alterar la plantilla maestra.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenCustomerPreview(restaurant, 'DINE_IN')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition border border-neutral-700 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Carta Salón</span>
          </button>

          <button
            onClick={() => onOpenCustomerPreview(restaurant, 'DELIVERY')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition border border-neutral-700 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Ver Carta Delivery</span>
          </button>

          <button
            onClick={handleOpenNewItemModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo Plato</span>
          </button>
        </div>
      </div>

      {/* Subtabs Selector */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setSubTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'items'
              ? 'bg-white text-black shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Platos y Precios ({restaurantItems.length})</span>
        </button>

        <button
          onClick={() => setSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'categories'
              ? 'bg-white text-black shadow-sm'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Categorías ({restaurantCategories.length})</span>
        </button>

        <button
          onClick={() => setSubTab('backgrounds')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'backgrounds'
              ? 'bg-amber-400 text-black shadow-sm font-bold'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Cartas: Salón vs Delivery & Fondos</span>
        </button>
      </div>

      {/* SUBTAB 1: GESTIÓN DE PLATOS */}
      {subTab === 'items' && (
        <div className="space-y-4">
          
          {/* Category Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-white text-black'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                Todos los Platos ({items.filter(i => i.restaurantId === restaurant.id).length})
              </button>

              {restaurantCategories.map(cat => {
                const count = items.filter(i => i.restaurantId === restaurant.id && i.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedCategoryFilter === cat.id
                        ? 'bg-white text-black'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleOpenNewCategoryModal}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Nueva Categoría</span>
            </button>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurantItems.map(item => {
              const catObj = restaurantCategories.find(c => c.id === item.categoryId);
              const addonsCount = item.availableAddons?.length || 0;
              const obsCount = item.suggestedObservations?.length || 0;

              return (
                <div 
                  key={item.id}
                  className="rounded-2xl bg-neutral-900/90 border border-neutral-800 overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative h-40 w-full overflow-hidden bg-black">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                      
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-black/80 text-amber-300 border border-neutral-700 backdrop-blur-md">
                          {catObj?.name || 'Categoría'}
                        </span>
                        {item.targetMenuScope === 'DINE_IN' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                            Solo Salón
                          </span>
                        )}
                        {item.targetMenuScope === 'DELIVERY' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                            Solo Delivery
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2 right-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                          item.isAvailable 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {item.isAvailable ? 'Disponible' : 'Agotado'}
                        </span>
                      </div>

                      <div className="absolute bottom-2 left-3 right-3 flex items-baseline justify-between">
                        <span className="text-lg font-black text-amber-400 font-mono">
                          S/ {item.price.toFixed(2)}
                        </span>
                        {item.prepTimeMinutes && (
                          <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.prepTimeMinutes}m</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-bold text-white line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Addons & Observations metadata badge */}
                      <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2 flex-wrap text-[11px] text-neutral-300">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                          {addonsCount} adicionales
                        </span>
                        <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                          {obsCount} sugerencias cocina
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-black/60 border-t border-neutral-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditItemModal(item)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Editar Plato</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el plato "${item.name}"?`)) {
                          onDeleteMenuItem(item.id);
                          showToast(`Plato "${item.name}" eliminado`);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition cursor-pointer"
                      title="Eliminar plato"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {restaurantItems.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
              <Utensils className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-sm font-bold text-white">No hay platos en esta categoría</p>
              <button
                onClick={handleOpenNewItemModal}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear el primer plato</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB 2: GESTIÓN DE CATEGORÍAS */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">
              Categorías de Carta ({restaurantCategories.length})
            </span>
            <button
              onClick={handleOpenNewCategoryModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nueva Categoría</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {restaurantCategories.map(cat => {
              const dishCount = items.filter(i => i.restaurantId === restaurant.id && i.categoryId === cat.id).length;
              return (
                <div 
                  key={cat.id}
                  className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-neutral-800 text-neutral-300">
                        {dishCount} platos
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {cat.description || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                    <button
                      onClick={() => handleOpenEditCategoryModal(cat)}
                      className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-amber-400" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar categoría "${cat.name}"? Los platos se desasociarán.`)) {
                          onDeleteCategory(cat.id);
                          showToast(`Categoría "${cat.name}" eliminada`);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: PERSONALIZACIÓN DE CARTAS: SALÓN VS DELIVERY & FONDOS */}
      {subTab === 'backgrounds' && (
        <div className="space-y-6">
          
          {/* Card: Modalidad de Carta (Misma carta o Cartas separadas) */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Modalidad de Acceso: Cartas Presencial y Delivery</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Define si tu restaurante ofrece la misma carta para ambos canales o cartas con fondos y platos diferenciados.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMenuSettings(prev => ({ ...prev, menuMode: 'SAME' }))}
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                  menuSettings.menuMode === 'SAME'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md'
                    : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Misma Carta (Unificada)</span>
                  {menuSettings.menuMode === 'SAME' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Salón y Delivery comparten el mismo catálogo y fondo visual con selector de canal.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMenuSettings(prev => ({ ...prev, menuMode: 'SEPARATE' }))}
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                  menuSettings.menuMode === 'SEPARATE'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md'
                    : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Dos Cartas Separadas</span>
                  {menuSettings.menuMode === 'SEPARATE' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Carta Salón (Presencial atendida por mozos) y Carta Delivery (Gestionada por repartidores) con fondos y platos exclusivos.
                </p>
              </button>
            </div>
          </div>

          {/* Dual Customization Panes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Carta Presencial / Salón */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Carta Presencial / Salón
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                  Atención: Mozos
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Título de la Carta Salón
                  </label>
                  <input
                    type="text"
                    value={menuSettings.presentialTitle || ''}
                    onChange={(e) => setMenuSettings(prev => ({ ...prev, presentialTitle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-amber-400 transition"
                    placeholder="Ej: Carta Salón Noble"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Tipo de Fondo Personalizado
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'theme', label: 'Tema Plantilla' },
                      { id: 'color', label: 'Color Sólido' },
                      { id: 'gradient', label: 'Gradiente' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMenuSettings(prev => ({ ...prev, presentialBgType: t.id as any }))}
                        className={`p-2 rounded-lg text-center font-bold text-[11px] border transition cursor-pointer ${
                          menuSettings.presentialBgType === t.id
                            ? 'bg-amber-400 text-black border-amber-400'
                            : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {menuSettings.presentialBgType !== 'theme' && (
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                      Valor de Color / Gradiente CSS
                    </label>
                    <input
                      type="text"
                      value={menuSettings.presentialBgValue || ''}
                      onChange={(e) => setMenuSettings(prev => ({ ...prev, presentialBgValue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-amber-400 transition"
                      placeholder="Ej: #071A14 o linear-gradient(180deg, #071A14, #0F2D24)"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenCustomerPreview(restaurant, 'DINE_IN')}
                    className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Previsualizar Carta Salón</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Carta Delivery */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Carta Delivery a Domicilio
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  Gestión: Repartidores
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Título de la Carta Delivery
                  </label>
                  <input
                    type="text"
                    value={menuSettings.deliveryTitle || ''}
                    onChange={(e) => setMenuSettings(prev => ({ ...prev, deliveryTitle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-purple-400 transition"
                    placeholder="Ej: Carta Delivery Express"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                      Pedido Mínimo (S/)
                    </label>
                    <input
                      type="number"
                      value={menuSettings.deliveryMinOrder || 30}
                      onChange={(e) => setMenuSettings(prev => ({ ...prev, deliveryMinOrder: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-purple-400 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                      Tiempo estimado (min)
                    </label>
                    <input
                      type="number"
                      value={menuSettings.deliveryEstimatedMinutes || 35}
                      onChange={(e) => setMenuSettings(prev => ({ ...prev, deliveryEstimatedMinutes: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-purple-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                    Tipo de Fondo Personalizado
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'theme', label: 'Tema Plantilla' },
                      { id: 'color', label: 'Color Sólido' },
                      { id: 'gradient', label: 'Gradiente' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMenuSettings(prev => ({ ...prev, deliveryBgType: t.id as any }))}
                        className={`p-2 rounded-lg text-center font-bold text-[11px] border transition cursor-pointer ${
                          menuSettings.deliveryBgType === t.id
                            ? 'bg-purple-400 text-black border-purple-400'
                            : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {menuSettings.deliveryBgType !== 'theme' && (
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                      Valor de Color / Gradiente CSS
                    </label>
                    <input
                      type="text"
                      value={menuSettings.deliveryBgValue || ''}
                      onChange={(e) => setMenuSettings(prev => ({ ...prev, deliveryBgValue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-purple-400 transition"
                      placeholder="Ej: #18181B o linear-gradient(180deg, #18181B, #09090B)"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenCustomerPreview(restaurant, 'DELIVERY')}
                    className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>Previsualizar Carta Delivery</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveMenuSettings}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar Personalización de Cartas y Fondos</span>
            </button>
          </div>

        </div>
      )}

      {/* MODAL: CREAR / EDITAR PLATO */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[92vh] rounded-2xl overflow-hidden flex flex-col bg-neutral-950 border border-neutral-800 text-white shadow-2xl">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block font-bold">
                  {editingItem ? 'Editar Plato Existente' : 'Nuevo Plato para la Carta'}
                </span>
                <h3 className="text-sm font-bold text-white">
                  {editingItem ? editingItem.name : 'Configuración de Producto Gastronómico'}
                </h3>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Row 1: Nombre & Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Nombre del Plato *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Lomo Saltado Especial al Wok"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Categoría de Carta *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition"
                  >
                    {restaurantCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Descripción */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Descripción del Plato (Ingredientes, técnica de cocción)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Lomo fino flambeado con cebolla morada, tomate en gajos, ají amarillo y papas nativas."
                  className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition resize-none"
                />
              </div>

              {/* Row 3: Precio, Tiempo, Ámbito y Disponibilidad */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Precio Base (S/) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs font-mono font-bold text-amber-400 focus:border-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Cocina (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Ámbito de Carta
                  </label>
                  <select
                    value={formTargetScope}
                    onChange={(e) => setFormTargetScope(e.target.value as any)}
                    className="w-full px-2 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition"
                  >
                    <option value="ALL">Salón y Delivery</option>
                    <option value="DINE_IN">Solo Salón</option>
                    <option value="DELIVERY">Solo Delivery</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-black border border-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsAvailable}
                      onChange={(e) => setFormIsAvailable(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span className="text-xs font-bold text-white">Disponible</span>
                  </label>
                </div>
              </div>

              {/* Row 4: Foto del Plato */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 block">
                  Foto del Plato (URL o Seleccionar del catálogo)
                </label>
                
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs font-mono text-white focus:border-amber-400 transition"
                  />
                </div>

                {/* Stock photo suggestions */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[10px] text-neutral-400 shrink-0">Fotos rápidas:</span>
                  {STOCK_PHOTOS.map((ph, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormImageUrl(ph.url)}
                      className={`text-[10px] px-2 py-1 rounded-lg border shrink-0 transition cursor-pointer ${
                        formImageUrl === ph.url
                          ? 'bg-amber-400 text-black font-bold border-amber-400'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {ph.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: Constructor de Adicionales */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Adicionales disponibles para este plato</span>
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    Se cobran y seleccionan por unidad de plato pedida
                  </span>
                </div>

                {/* List of current addons */}
                <div className="space-y-1.5">
                  {formAddons.map((addon, aIdx) => (
                    <div 
                      key={addon.id || aIdx}
                      className="p-2 rounded-lg bg-black border border-neutral-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{addon.name}</span>
                        <span className="text-amber-400 font-mono font-bold">+S/ {addon.price.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormAddons(prev => prev.filter((_, idx) => idx !== aIdx))}
                        className="p-1 rounded text-rose-400 hover:text-rose-300 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {formAddons.length === 0 && (
                    <p className="text-[11px] text-neutral-500 italic">No hay adicionales configurados para este plato.</p>
                  )}
                </div>

                {/* Add new addon inputs */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                  <input
                    type="text"
                    placeholder="Nombre del adicional (ej: Queso extra)"
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-400">S/</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={newAddonPrice}
                      onChange={(e) => setNewAddonPrice(Number(e.target.value))}
                      className="w-16 px-2 py-1.5 rounded-lg bg-black border border-neutral-800 text-xs font-mono text-amber-400 focus:border-amber-400 transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAddonName.trim()) return;
                      setFormAddons(prev => [
                        ...prev,
                        { id: `add-${Date.now()}`, name: newAddonName.trim(), price: Number(newAddonPrice) }
                      ]);
                      setNewAddonName('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Row 6: Constructor de Observaciones Sugeridas */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Observaciones sugeridas para cocina</span>
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    Opciones rápidas para el mozo o cliente
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {formObservations.map((obs, oIdx) => (
                    <div
                      key={oIdx}
                      className="px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5"
                    >
                      <span>{obs}</span>
                      <button
                        type="button"
                        onClick={() => setFormObservations(prev => prev.filter((_, idx) => idx !== oIdx))}
                        className="text-neutral-400 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {formObservations.length === 0 && (
                    <p className="text-[11px] text-neutral-500 italic">No hay sugerencias predeterminadas.</p>
                  )}
                </div>

                {/* Add new observation chip */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                  <input
                    type="text"
                    placeholder="Añadir opción rápida (ej: Sin cebolla, Salsa aparte, Término 3/4)"
                    value={newObsText}
                    onChange={(e) => setNewObsText(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newObsText.trim()) return;
                      setFormObservations(prev => [...prev, newObsText.trim()]);
                      setNewObsText('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition cursor-pointer"
                  >
                    + Añadir
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Plato</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR CATEGORÍA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden flex flex-col bg-neutral-950 border border-neutral-800 text-white shadow-2xl">
            <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría de Carta'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej: Parrillas Familiares, Entradas, Bebidas"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Descripción breve
                </label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Descripción para orientar al comensal"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:border-amber-400 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Categoría</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 animate-in slide-in-from-top-2 fade-in">
          <div className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-amber-400 text-white text-xs font-bold shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
};
