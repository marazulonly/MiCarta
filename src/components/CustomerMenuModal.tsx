import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Sparkles, 
  Edit3, 
  Camera, 
  DollarSign, 
  Save, 
  ChefHat, 
  Bike, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, Order, MenuAccessSettings } from '../types';
import { BrasasLuxuryMenu } from './BrasasLuxuryMenu';
import { CriolloChalkboardMenu } from './CriolloChalkboardMenu';
import { CostaMarinaMenu } from './CostaMarinaMenu';
import { saveAllDataToFirebase } from '../lib/firebase';

interface CustomerMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  onOrderCreated?: (newOrder: Order) => void;
  initialMode?: 'DINE_IN' | 'DELIVERY';
  initialTableNumber?: string;
  // Live Editing Callbacks
  onUpdateRestaurant?: (updated: Restaurant) => void;
  onUpdateMenuItem?: (updated: MenuItem) => void;
  onAddMenuItem?: (newItem: MenuItem) => void;
  onDeleteMenuItem?: (itemId: string) => void;
  onUpdateCategory?: (updated: MenuCategory) => void;
  onAddCategory?: (newCat: MenuCategory) => void;
  isOwnerOrAdmin?: boolean;
}

const PRESET_DISH_PHOTOS = [
  { name: 'Pollo a la Brasa Clásico', url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80' },
  { name: '1/2 Pollo Gourmet Dorado', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80' },
  { name: '1/4 Pollo & Papas Nativas', url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80' },
  { name: 'Lomo Saltado Jugoso', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80' },
  { name: 'Ceviche Mixto Puerto', url: 'https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=800&q=80' },
  { name: 'Causa Rellena Limeña', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80' },
  { name: 'Arroz con Mariscos', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' },
  { name: 'Anticuchos Corazón', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80' },
  { name: 'Chicharrón de Calamar', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80' },
  { name: 'Pisco Sour Catedral', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80' },
  { name: 'Chicha Morada de Maíz', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80' },
  { name: 'Suspiro a la Limeña', url: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=800&q=80' },
];

export const CustomerMenuModal: React.FC<CustomerMenuModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  categories,
  items,
  onOrderCreated,
  initialMode = 'DINE_IN',
  initialTableNumber,
  onUpdateRestaurant,
  onUpdateMenuItem,
  onAddMenuItem,
  onDeleteMenuItem,
  onUpdateCategory,
  onAddCategory,
  isOwnerOrAdmin = false,
}) => {
  // Live Editing Mode (ONLY accessible to verified Owner or Admin, default false)
  const [isLiveEditActive, setIsLiveEditActive] = useState(false);
  
  // Modals for live editing
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [quickPriceItem, setQuickPriceItem] = useState<MenuItem | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<string>('');
  
  const [quickPhotoItem, setQuickPhotoItem] = useState<MenuItem | null>(null);
  const [quickPhotoUrl, setQuickPhotoUrl] = useState<string>('');
  
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  
  // Local state for brand customizer modal
  const [brandName, setBrandName] = useState(restaurant.name);
  const [brandTagline, setBrandTagline] = useState(restaurant.tagline || '');
  const [brandLogoUrl, setBrandLogoUrl] = useState(restaurant.logoUrl || '');
  const [brandCoverUrl, setBrandCoverUrl] = useState(restaurant.coverUrl || '');
  const [brandDarkBgColor, setBrandDarkBgColor] = useState(restaurant.branding?.darkBgColor || '#071A14');
  const [enableDineIn, setEnableDineIn] = useState(restaurant.menuAccessSettings?.enableDineIn !== false);
  const [enableDelivery, setEnableDelivery] = useState(restaurant.menuAccessSettings?.enableDelivery !== false);

  // New item form state
  const restaurantCategories = categories.filter(c => c.restaurantId === restaurant.id);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('35.00');
  const [newItemCategory, setNewItemCategory] = useState(restaurantCategories[0]?.id || '');
  const [newItemImgUrl, setNewItemImgUrl] = useState(PRESET_DISH_PHOTOS[0].url);
  const [newItemPrepTime, setNewItemPrepTime] = useState(25);

  // Edit item form state
  const [editItemName, setEditItemName] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemCategory, setEditItemCategory] = useState('');
  const [editItemImgUrl, setEditItemImgUrl] = useState('');
  const [editItemPrepTime, setEditItemPrepTime] = useState(25);
  const [editItemAvailable, setEditItemAvailable] = useState(true);

  // Firebase save status
  const [isSavingFirebase, setIsSavingFirebase] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!isOpen) return null;

  // --- Handlers ---
  const handleToggleLiveEdit = () => {
    setIsLiveEditActive(prev => !prev);
    showToast(!isLiveEditActive ? 'Modo edición en vivo activado' : 'Modo visualización activado');
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemDesc(item.description);
    setEditItemPrice(item.price.toString());
    setEditItemCategory(item.categoryId);
    setEditItemImgUrl(item.imageUrl);
    setEditItemPrepTime(item.prepTimeMinutes || 25);
    setEditItemAvailable(item.isAvailable !== false);
  };

  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !onUpdateMenuItem) return;
    const updated: MenuItem = {
      ...editingItem,
      name: editItemName.trim(),
      description: editItemDesc.trim(),
      price: Math.max(0.5, parseFloat(editItemPrice) || editingItem.price),
      categoryId: editItemCategory || editingItem.categoryId,
      imageUrl: editItemImgUrl.trim() || editingItem.imageUrl,
      prepTimeMinutes: Number(editItemPrepTime) || 20,
      isAvailable: editItemAvailable,
    };
    onUpdateMenuItem(updated);
    setEditingItem(null);
    showToast(`✓ Plato "${updated.name}" actualizado en la carta.`);
  };

  const handleOpenQuickPrice = (item: MenuItem) => {
    setQuickPriceItem(item);
    setQuickPriceVal(item.price.toString());
  };

  const handleSaveQuickPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceItem || !onUpdateMenuItem) return;
    const priceNum = parseFloat(quickPriceVal);
    if (isNaN(priceNum) || priceNum <= 0) return;
    const updated: MenuItem = {
      ...quickPriceItem,
      price: priceNum,
    };
    onUpdateMenuItem(updated);
    setQuickPriceItem(null);
    showToast(`✓ Precio de "${updated.name}" actualizado a S/ ${priceNum.toFixed(2)}`);
  };

  const handleOpenQuickPhoto = (item: MenuItem) => {
    setQuickPhotoItem(item);
    setQuickPhotoUrl(item.imageUrl);
  };

  const handleSaveQuickPhoto = (selectedUrl?: string) => {
    if (!quickPhotoItem || !onUpdateMenuItem) return;
    const targetUrl = selectedUrl || quickPhotoUrl;
    if (!targetUrl.trim()) return;
    const updated: MenuItem = {
      ...quickPhotoItem,
      imageUrl: targetUrl.trim(),
    };
    onUpdateMenuItem(updated);
    setQuickPhotoItem(null);
    showToast(`✓ Foto del plato "${updated.name}" actualizada con éxito.`);
  };

  const handleToggleAvailability = (item: MenuItem) => {
    if (!onUpdateMenuItem) return;
    const updated: MenuItem = {
      ...item,
      isAvailable: !item.isAvailable,
    };
    onUpdateMenuItem(updated);
    showToast(`Plato marcado como ${updated.isAvailable ? 'Disponible' : 'Agotado'}`);
  };

  const handleOpenAddItem = () => {
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('35.00');
    setNewItemCategory(restaurantCategories[0]?.id || '');
    setNewItemImgUrl(PRESET_DISH_PHOTOS[0].url);
    setNewItemPrepTime(25);
    setIsAddItemModalOpen(true);
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !onAddMenuItem) return;
    const newItem: MenuItem = {
      id: `item-${restaurant.id}-${Date.now()}`,
      restaurantId: restaurant.id,
      categoryId: newItemCategory || restaurantCategories[0]?.id || 'cat-general',
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      price: Math.max(0.5, parseFloat(newItemPrice) || 20),
      imageUrl: newItemImgUrl.trim() || PRESET_DISH_PHOTOS[0].url,
      prepTimeMinutes: Number(newItemPrepTime) || 25,
      allergens: [],
      tags: [],
      isAvailable: true,
      isPopular: false,
    };
    onAddMenuItem(newItem);
    setIsAddItemModalOpen(false);
    showToast(`✓ Nuevo plato "${newItem.name}" añadido a la carta.`);
  };

  const handleOpenBranding = () => {
    setBrandName(restaurant.name);
    setBrandTagline(restaurant.tagline || '');
    setBrandLogoUrl(restaurant.logoUrl || '');
    setBrandCoverUrl(restaurant.coverUrl || '');
    setBrandDarkBgColor(restaurant.branding?.darkBgColor || '#071A14');
    setEnableDineIn(restaurant.menuAccessSettings?.enableDineIn !== false);
    setEnableDelivery(restaurant.menuAccessSettings?.enableDelivery !== false);
    setIsBrandingModalOpen(true);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateRestaurant) return;
    const updatedRest: Restaurant = {
      ...restaurant,
      name: brandName.trim() || restaurant.name,
      tagline: brandTagline.trim(),
      logoUrl: brandLogoUrl.trim() || restaurant.logoUrl,
      coverUrl: brandCoverUrl.trim() || restaurant.coverUrl,
      branding: {
        ...restaurant.branding,
        darkBgColor: brandDarkBgColor,
      },
      menuAccessSettings: {
        ...restaurant.menuAccessSettings,
        enableDineIn,
        enableDelivery,
      } as MenuAccessSettings,
    };
    onUpdateRestaurant(updatedRest);
    setIsBrandingModalOpen(false);
    showToast('✓ Personalización de marca, fondos y canales guardada.');
  };

  const handleSaveToFirebase = async () => {
    setIsSavingFirebase(true);
    try {
      const res = await saveAllDataToFirebase({
        restaurants: [restaurant],
        items: items.filter(i => i.restaurantId === restaurant.id),
        categories: categories.filter(c => c.restaurantId === restaurant.id),
      });
      if (res.success) {
        showToast('✓ ' + res.message);
      } else {
        showToast('⚠️ ' + res.message);
      }
    } catch (err: any) {
      showToast('Error al conectar con Firebase: ' + (err.message || 'Error'));
    } finally {
      setIsSavingFirebase(false);
    }
  };

  // Template resolution: check templateId first, fallback to slug/id
  const isMarineTemplate = restaurant.templateId === 'tmpl-marine' || 
    (!restaurant.templateId && (restaurant.id === 'rest-costa' || restaurant.slug === 'costa-marina' || restaurant.name.toLowerCase().includes('costa')));

  const isCriolloTemplate = restaurant.templateId === 'tmpl-criollo' || 
    (!restaurant.templateId && (restaurant.id === 'rest-criollo' || restaurant.slug === 'criollo-tradicion' || restaurant.name.toLowerCase().includes('criollo')));

  const liveEditProps = {
    isLiveEditActive: Boolean(isOwnerOrAdmin && isLiveEditActive),
    onToggleLiveEdit: isOwnerOrAdmin ? handleToggleLiveEdit : undefined,
    onEditItem: isOwnerOrAdmin ? handleOpenEditItem : undefined,
    onQuickPriceItem: isOwnerOrAdmin ? handleOpenQuickPrice : undefined,
    onQuickPhotoItem: isOwnerOrAdmin ? handleOpenQuickPhoto : undefined,
    onToggleAvailability: isOwnerOrAdmin ? handleToggleAvailability : undefined,
    onAddNewItem: isOwnerOrAdmin ? handleOpenAddItem : undefined,
    onEditBranding: isOwnerOrAdmin ? handleOpenBranding : undefined,
    onSaveToFirebase: isOwnerOrAdmin ? handleSaveToFirebase : undefined,
    isSavingFirebase: isSavingFirebase,
  };

  return (
    <>
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl bg-neutral-900/95 text-amber-300 border border-amber-400/60 shadow-2xl backdrop-blur-md text-xs font-mono font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Render Appropriate Specialized Menu Template */}
      {isMarineTemplate ? (
        <CostaMarinaMenu
          isOpen={isOpen}
          onClose={onClose}
          restaurant={restaurant}
          categories={categories}
          items={items}
          onOrderCreated={onOrderCreated}
          initialMode={initialMode}
          initialTableNumber={initialTableNumber}
          {...liveEditProps}
        />
      ) : isCriolloTemplate ? (
        <CriolloChalkboardMenu
          isOpen={isOpen}
          onClose={onClose}
          restaurant={restaurant}
          categories={categories}
          items={items}
          onOrderCreated={onOrderCreated}
          initialMode={initialMode}
          initialTableNumber={initialTableNumber}
          {...liveEditProps}
        />
      ) : (
        <BrasasLuxuryMenu
          isOpen={isOpen}
          onClose={onClose}
          restaurant={restaurant}
          categories={categories}
          items={items}
          onOrderCreated={onOrderCreated}
          initialMode={initialMode}
          initialTableNumber={initialTableNumber}
          {...liveEditProps}
        />
      )}

      {/* MODAL 1: EDIT DISH IN LIVE PREVIEW */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl text-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Editar Plato sobre la Carta</h3>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 font-mono mb-1">Nombre del Plato</label>
                <input
                  type="text"
                  required
                  value={editItemName}
                  onChange={e => setEditItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">Descripción / Ingredientes</label>
                <textarea
                  rows={2}
                  value={editItemDesc}
                  onChange={e => setEditItemDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-mono mb-1">Precio (S/)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={editItemPrice}
                    onChange={e => setEditItemPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-mono mb-1">Categoría</label>
                  <select
                    value={editItemCategory}
                    onChange={e => setEditItemCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none"
                  >
                    {restaurantCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">URL de la Foto</label>
                <input
                  type="url"
                  value={editItemImgUrl}
                  onChange={e => setEditItemImgUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={editItemAvailable}
                  onChange={e => setEditItemAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <label htmlFor="availCheck" className="text-neutral-300">
                  Plato disponible para pedidos de Salón y Delivery
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold transition flex items-center gap-1 shadow"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK PRICE MODAL */}
      {quickPriceItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl text-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Cambio Rápido de Precio</h3>
              </div>
              <button 
                onClick={() => setQuickPriceItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Modifica el precio en vivo para <span className="text-amber-300 font-bold">{quickPriceItem.name}</span>:
            </p>

            <form onSubmit={handleSaveQuickPrice} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono text-amber-400 font-bold">S/</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  autoFocus
                  value={quickPriceVal}
                  onChange={e => setQuickPriceVal(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-2xl font-mono font-black text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickPriceItem(null)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow transition"
                >
                  Aplicar Precio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK PHOTO GALLERY */}
      {quickPhotoItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl text-white p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Cambiar Foto de {quickPhotoItem.name}</h3>
              </div>
              <button 
                onClick={() => setQuickPhotoItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">Galería Gastronómica Peruana Sugerida</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_DISH_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSaveQuickPhoto(preset.url)}
                      className="group relative rounded-xl overflow-hidden border border-neutral-700 hover:border-amber-400 transition cursor-pointer text-left"
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.name} 
                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 flex items-end">
                        <span className="text-[10px] font-bold text-white line-clamp-1">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">O ingresa una URL personalizada</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={quickPhotoUrl}
                    onChange={e => setQuickPhotoUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-mono text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveQuickPhoto()}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer shadow transition"
                  >
                    Guardar URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: BRAND & CHANNELS CUSTOMIZER */}
      {isBrandingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl text-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Personalizar Marca & Canales de la Carta</h3>
              </div>
              <button 
                onClick={() => setIsBrandingModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 font-mono mb-1">Nombre del Restaurante</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">Eslogan / Subtítulo</label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={e => setBrandTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">URL del Logo</label>
                <input
                  type="url"
                  value={brandLogoUrl}
                  onChange={e => setBrandLogoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">Color de Fondo Oscuro</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandDarkBgColor}
                    onChange={e => setBrandDarkBgColor(e.target.value)}
                    className="w-10 h-8 rounded-lg bg-neutral-800 border border-neutral-700 cursor-pointer p-0.5"
                  />
                  <span className="font-mono text-neutral-300">{brandDarkBgColor}</span>
                </div>
              </div>

              {/* Channel Checks */}
              <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-2">
                <span className="block font-mono text-[11px] font-bold text-amber-300">Canales de Venta Habilitados:</span>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDineIn}
                    onChange={e => setEnableDineIn(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Habilitar Carta Salón (Mesas & Presencial)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDelivery}
                    onChange={e => setEnableDelivery(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 text-amber-400" />
                    <span>Habilitar Carta Delivery (Pedidos a Domicilio)</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsBrandingModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center gap-1 shadow transition"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Aplicar a la Carta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD DISH DIRECTLY IN PREVIEW */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl text-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
                <h3 className="text-sm font-bold">Agregar Plato a la Carta</h3>
              </div>
              <button 
                onClick={() => setIsAddItemModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 font-mono mb-1">Nombre del Plato *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Seco de Res a la Norteña"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">Descripción / Acompañamientos</label>
                <textarea
                  rows={2}
                  placeholder="Con frejoles, arroz criollo y sarsa criolla"
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-mono mb-1">Precio (S/) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={newItemPrice}
                    onChange={e => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-mono mb-1">Sección de la Carta</label>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none"
                  >
                    {restaurantCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-mono mb-1">Foto del Plato</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newItemImgUrl}
                    onChange={e => setNewItemImgUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none font-mono text-[11px]"
                  />
                  <img 
                    src={newItemImgUrl} 
                    alt="preview" 
                    className="w-9 h-9 rounded-lg object-cover border border-neutral-700 shrink-0" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center gap-1 shadow transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Publicar en la Carta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
