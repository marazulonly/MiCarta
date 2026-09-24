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
  AlertCircle,
  Upload,
  Sliders
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, Order, MenuAccessSettings } from '../types';
import { BrasasLuxuryMenu } from './BrasasLuxuryMenu';
import { CriolloChalkboardMenu } from './CriolloChalkboardMenu';
import { CostaMarinaMenu } from './CostaMarinaMenu';
import { NeonStreetMenu } from './NeonStreetMenu';
import { MinimalistBistroMenu } from './MinimalistBistroMenu';
import { EditorialGrandMenu } from './EditorialGrandMenu';
import { StartersEditorialMenu } from './StartersEditorialMenu';
import { HeaderEditorModal } from './HeaderEditorModal';

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
  publishedSnapshotInfo?: {
    version: number;
    publishedAt: string;
  };
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
  publishedSnapshotInfo,
}) => {
  // Scoped categories and items for this specific restaurant to prevent cross-contamination
  const scopedCategories = categories.filter(c => c.restaurantId === restaurant.id);
  const effectiveCategories = scopedCategories.length > 0 ? scopedCategories : categories;
  const scopedItems = items.filter(i => i.restaurantId === restaurant.id);
  const effectiveItems = scopedItems.length > 0 ? scopedItems : items;

  // Live Editing Mode (ONLY accessible to verified Owner or Admin, default false)
  const [isLiveEditActive, setIsLiveEditActive] = useState(false);
  
  // Modals for live editing
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [quickPriceItem, setQuickPriceItem] = useState<MenuItem | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<string>('');
  
  const [quickPhotoItem, setQuickPhotoItem] = useState<MenuItem | null>(null);
  const [quickPhotoUrl, setQuickPhotoUrl] = useState<string>('');
  
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  
  // Local state for brand customizer modal
  const [brandName, setBrandName] = useState(restaurant.name);
  const [brandTagline, setBrandTagline] = useState(restaurant.tagline || '');
  const [brandLogoUrl, setBrandLogoUrl] = useState(restaurant.logoUrl || '');
  const [brandCoverUrl, setBrandCoverUrl] = useState(restaurant.coverUrl || '');
  const [brandDarkBgColor, setBrandDarkBgColor] = useState(restaurant.branding?.darkBgColor || '#071A14');
  const [brandButtonColor, setBrandButtonColor] = useState(restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#38bdf8');
  const [brandButtonTextColor, setBrandButtonTextColor] = useState(restaurant.branding?.buttonTextColor || '#000000');
  const [brandTextColor, setBrandTextColor] = useState(restaurant.branding?.textColor || '#ffffff');
  const [brandRestaurantNameFont, setBrandRestaurantNameFont] = useState(restaurant.branding?.restaurantNameFont || 'inherit');
  const [brandRestaurantNameColor, setBrandRestaurantNameColor] = useState(restaurant.branding?.restaurantNameColor || '#ffffff');
  const [brandDishCardBgColor, setBrandDishCardBgColor] = useState(restaurant.branding?.dishCardBgColor || '');
  const [brandDishNameFont, setBrandDishNameFont] = useState(restaurant.branding?.dishNameFont || 'inherit');
  const [brandDishDescFont, setBrandDishDescFont] = useState(restaurant.branding?.dishDescFont || 'inherit');
  const [brandDishPriceFont, setBrandDishPriceFont] = useState(restaurant.branding?.dishPriceFont || 'monospace');
  const [enableDineIn, setEnableDineIn] = useState(restaurant.menuAccessSettings?.enableDineIn !== false);
  const [enableDelivery, setEnableDelivery] = useState(restaurant.menuAccessSettings?.enableDelivery !== false);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ La imagen excede 5MB. Selecciona una más liviana.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBrandLogoUrl(reader.result);
        showToast('✓ Logo subido desde el disco.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ La imagen excede 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBrandCoverUrl(reader.result);
        showToast('✓ Portada subida desde el disco.');
      }
    };
    reader.readAsDataURL(file);
  };

  // New item form state
  const availableCats = categories.filter(c => c.restaurantId === restaurant.id);
  const restaurantCategories = availableCats.length > 0 
    ? availableCats 
    : [{ id: `cat-${restaurant.id}-general`, restaurantId: restaurant.id, name: 'De la Casa', sortOrder: 1, isActive: true }];

  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('35.00');
  const [newItemCategory, setNewItemCategory] = useState(restaurantCategories[0]?.id || `cat-${restaurant.id}-general`);
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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Disk Image Upload Handler (reads file from local disk as DataURL base64)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ La foto es demasiado pesada. Elige una imagen de menos de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        callback(result);
        showToast('✓ Foto del plato cargada exitosamente desde el disco');
      }
    };
    reader.readAsDataURL(file);
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

  const handleOpenAddItem = (preselectedCatId?: string) => {
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('35.00');
    setNewItemCategory(preselectedCatId || restaurantCategories[0]?.id || `cat-${restaurant.id}-general`);
    setNewItemImgUrl(PRESET_DISH_PHOTOS[0].url);
    setNewItemPrepTime(25);
    setIsAddItemModalOpen(true);
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !onAddMenuItem) return;

    const targetCatId = newItemCategory || restaurantCategories[0]?.id || `cat-${restaurant.id}-general`;

    // Ensure category exists in categories state
    if (onAddCategory && !categories.some(c => c.id === targetCatId && c.restaurantId === restaurant.id)) {
      const newCat: MenuCategory = {
        id: targetCatId,
        restaurantId: restaurant.id,
        name: 'De la Casa',
        sortOrder: 1,
        isActive: true,
      };
      onAddCategory(newCat);
    }

    const newItem: MenuItem = {
      id: `item-${restaurant.id}-${Date.now()}`,
      restaurantId: restaurant.id,
      categoryId: targetCatId,
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
    setBrandButtonColor(restaurant.branding?.buttonColor || restaurant.branding?.accentColor || '#38bdf8');
    setBrandButtonTextColor(restaurant.branding?.buttonTextColor || '#000000');
    setBrandTextColor(restaurant.branding?.textColor || '#ffffff');
    setBrandRestaurantNameFont(restaurant.branding?.restaurantNameFont || 'inherit');
    setBrandRestaurantNameColor(restaurant.branding?.restaurantNameColor || '#ffffff');
    setBrandDishCardBgColor(restaurant.branding?.dishCardBgColor || restaurant.branding?.darkBgColor || '');
    setBrandDishNameFont(restaurant.branding?.dishNameFont || 'inherit');
    setBrandDishDescFont(restaurant.branding?.dishDescFont || 'inherit');
    setBrandDishPriceFont(restaurant.branding?.dishPriceFont || 'monospace');
    setEnableDineIn(restaurant.menuAccessSettings?.enableDineIn !== false);
    setEnableDelivery(restaurant.menuAccessSettings?.enableDelivery !== false);
    setIsBrandingModalOpen(true);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateRestaurant) return;
    const safeLogo = brandLogoUrl.trim() || restaurant.branding?.headerLogoUrl || restaurant.logoUrl;
    const safeCover = brandCoverUrl.trim() || restaurant.coverUrl;
    const updatedRest: Restaurant = {
      ...restaurant,
      name: brandName.trim() || restaurant.name,
      tagline: brandTagline.trim(),
      logoUrl: safeLogo,
      coverUrl: safeCover,
      branding: {
        ...restaurant.branding,
        headerLogoUrl: restaurant.branding?.headerLogoUrl || safeLogo,
        darkBgColor: brandDarkBgColor,
        buttonColor: brandButtonColor,
        buttonTextColor: brandButtonTextColor,
        accentColor: brandButtonColor,
        textColor: brandTextColor,
        restaurantNameFont: brandRestaurantNameFont,
        restaurantNameColor: brandRestaurantNameColor,
        dishCardBgColor: brandDishCardBgColor,
        dishNameFont: brandDishNameFont,
        dishDescFont: brandDishDescFont,
        dishPriceFont: brandDishPriceFont,
      },
      menuAccessSettings: {
        ...restaurant.menuAccessSettings,
        enableDineIn,
        enableDelivery,
      } as MenuAccessSettings,
    };
    onUpdateRestaurant(updatedRest);
    setIsBrandingModalOpen(false);
    showToast('✓ Personalización de marca, colores, fuentes y canales guardada.');
  };

  // Template resolution: strict templateId checking with intuitive fallbacks
  const tmplId = restaurant.templateId || 'tmpl-luxury';
  const isStartersEditorialTemplate = tmplId === 'tmpl-starters-editorial' || tmplId === 'tmpl-editorial' || tmplId.includes('editorial') || tmplId.includes('zigzag') || tmplId.includes('grand') || tmplId.includes('starters');
  const isNeonTemplate = tmplId === 'tmpl-neon' || tmplId.includes('neon') || tmplId.includes('street');
  const isMinimalTemplate = tmplId === 'tmpl-minimalist' || tmplId.includes('minimal') || tmplId.includes('bistro');
  const isMarineTemplate = tmplId === 'tmpl-marine' || 
    (!restaurant.templateId && (
      restaurant.id === 'rest-costa' || 
      restaurant.slug === 'costa-marina' || 
      restaurant.slug === 'cevichito-pliz' || 
      restaurant.name.toLowerCase().includes('costa') || 
      restaurant.name.toLowerCase().includes('cevichito')
    ));

  const isCriolloTemplate = tmplId === 'tmpl-criollo' || 
    (!restaurant.templateId && (restaurant.id === 'rest-criollo' || restaurant.slug === 'criollo-tradicion' || restaurant.name.toLowerCase().includes('criollo')));

  const liveEditProps = {
    isLiveEditActive: Boolean(isOwnerOrAdmin && isLiveEditActive),
    onToggleLiveEdit: isOwnerOrAdmin ? handleToggleLiveEdit : undefined,
    onEditItem: isOwnerOrAdmin ? handleOpenEditItem : undefined,
    onDeleteItem: isOwnerOrAdmin && onDeleteMenuItem ? (itemId: string) => {
      onDeleteMenuItem(itemId);
      showToast('✓ Plato eliminado correctamente');
    } : undefined,
    onQuickPriceItem: isOwnerOrAdmin ? handleOpenQuickPrice : undefined,
    onQuickPhotoItem: isOwnerOrAdmin ? handleOpenQuickPhoto : undefined,
    onToggleAvailability: isOwnerOrAdmin ? handleToggleAvailability : undefined,
    onAddNewItem: isOwnerOrAdmin ? handleOpenAddItem : undefined,
    onEditBranding: isOwnerOrAdmin ? handleOpenBranding : undefined,
    onEditHeader: isOwnerOrAdmin ? () => setIsHeaderModalOpen(true) : undefined,
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
      {isStartersEditorialTemplate ? (
        <StartersEditorialMenu
          isOpen={isOpen}
          onClose={onClose}
          restaurant={restaurant}
          categories={effectiveCategories}
          items={effectiveItems}
          onOrderCreated={onOrderCreated}
          initialMode={initialMode}
          initialTableNumber={initialTableNumber}
          isOwnerOrAdmin={Boolean(isOwnerOrAdmin)}
          {...liveEditProps}
        />
      ) : isNeonTemplate ? (
        <NeonStreetMenu
          isOpen={isOpen}
          onClose={onClose}
          restaurant={restaurant}
          categories={effectiveCategories}
          items={effectiveItems}
          onOrderCreated={onOrderCreated}
          initialMode={initialMode}
          initialTableNumber={initialTableNumber}
          isOwnerOrAdmin={Boolean(isOwnerOrAdmin)}
          {...liveEditProps}
        />
      ) : isMinimalTemplate ? (
        <MinimalistBistroMenu
          isOpen={isOpen}
          onClose={onClose}
          restaurant={restaurant}
          categories={effectiveCategories}
          items={effectiveItems}
          onOrderCreated={onOrderCreated}
          initialMode={initialMode}
          initialTableNumber={initialTableNumber}
          isOwnerOrAdmin={Boolean(isOwnerOrAdmin)}
          {...liveEditProps}
        />
      ) : isMarineTemplate ? (
        <CostaMarinaMenu
          isOpen={isOpen}
          onClose={onClose}
          restaurant={restaurant}
          categories={effectiveCategories}
          items={effectiveItems}
          onOrderCreated={onOrderCreated}
          initialMode={initialMode}
          initialTableNumber={initialTableNumber}
          isOwnerOrAdmin={Boolean(isOwnerOrAdmin)}
          {...liveEditProps}
        />
      ) : isCriolloTemplate ? (
        <CriolloChalkboardMenu
          isOpen={isOpen}
          onClose={onClose}
          restaurant={restaurant}
          categories={effectiveCategories}
          items={effectiveItems}
          onOrderCreated={onOrderCreated}
          initialMode={initialMode}
          initialTableNumber={initialTableNumber}
          isOwnerOrAdmin={Boolean(isOwnerOrAdmin)}
          {...liveEditProps}
        />
      ) : (
        <BrasasLuxuryMenu
          isOpen={isOpen}
          onClose={onClose}
          restaurant={restaurant}
          categories={effectiveCategories}
          items={effectiveItems}
          onOrderCreated={onOrderCreated}
          initialMode={initialMode}
          initialTableNumber={initialTableNumber}
          isOwnerOrAdmin={Boolean(isOwnerOrAdmin)}
          {...liveEditProps}
        />
      )}

      {/* Discrete Official Published Badge for Public Diners & QR Guests */}
      {publishedSnapshotInfo && (
        <div className="fixed bottom-4 left-4 z-[9998] px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/60 text-emerald-300 text-[11px] font-mono flex items-center gap-2 shadow-2xl pointer-events-none select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            <strong>Carta Oficial Publicada</strong> • v{publishedSnapshotInfo.version}
          </span>
        </div>
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
                <label className="block text-neutral-400 font-mono mb-1">Foto del Plato</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="URL de la imagen o sube desde tu equipo..."
                      value={editItemImgUrl}
                      onChange={e => setEditItemImgUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none font-mono text-[11px]"
                    />
                    {editItemImgUrl && (
                      <img 
                        src={editItemImgUrl} 
                        alt="Preview" 
                        className="w-9 h-9 rounded-lg object-cover border border-neutral-700 shrink-0" 
                      />
                    )}
                  </div>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-dashed border-amber-500/50 cursor-pointer text-amber-400 text-xs font-semibold transition">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>📁 Reemplazar foto subiendo desde el disco</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageFileUpload(e, setEditItemImgUrl)} 
                    />
                  </label>
                </div>
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
              {/* Local Disk Upload Section */}
              <div className="p-3.5 rounded-2xl bg-neutral-800/80 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Subir Foto de Reemplazo desde el Disco:</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">JPG, PNG, WEBP (máx. 5MB)</span>
                </div>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer shadow-md transition">
                  <Upload className="w-4 h-4 stroke-[2.5]" />
                  <span>📁 Seleccionar Imagen del Equipo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      handleImageFileUpload(e, (dataUrl) => {
                        handleSaveQuickPhoto(dataUrl);
                      });
                    }} 
                  />
                </label>
              </div>

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
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl text-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Personalizar Marca, Colores & Fuentes</h3>
              </div>
              <button 
                onClick={() => setIsBrandingModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
              {/* Direct Banner to Header Editor */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-fuchsia-950/40 via-neutral-900 to-amber-950/40 border border-fuchsia-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-300 shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Editar Cabecera (Logo JPG/PNG/SVG)</h4>
                    <p className="text-[10px] text-neutral-400">Autoajuste, alternar nombre, eslogan o solo imagen</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsBrandingModalOpen(false);
                    setIsHeaderModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-black font-bold text-[11px] flex items-center gap-1 shadow transition cursor-pointer shrink-0"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Configurar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-mono mb-1 font-bold">Nombre del Restaurante</label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-mono mb-1 font-bold">Eslogan / Subtítulo</label>
                  <input
                    type="text"
                    value={brandTagline}
                    onChange={e => setBrandTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-200 font-bold font-mono">Logo del Restaurante</label>
                  {brandLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setBrandLogoUrl('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Quitar logo</span>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {brandLogoUrl ? (
                    <img 
                      src={brandLogoUrl} 
                      alt="Logo preview" 
                      className="w-12 h-12 rounded-xl object-cover border border-amber-400/50 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-dashed border-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 shrink-0">
                      Sin Logo
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer shadow transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir logo desde el disco</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoFileUpload} 
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="O pega URL de imagen (https://...)"
                      value={brandLogoUrl}
                      onChange={e => setBrandLogoUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-[11px] font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Photo Section */}
              <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-200 font-bold font-mono">Portada / Banner de la Carta</label>
                  {brandCoverUrl && (
                    <button
                      type="button"
                      onClick={() => setBrandCoverUrl('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Quitar portada</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-amber-300 font-bold text-xs cursor-pointer border border-neutral-600 shadow transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir portada desde el disco</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCoverFileUpload} 
                    />
                  </label>
                </div>
              </div>

              {/* Color Customization */}
              <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-3">
                <span className="block font-mono text-xs font-bold text-amber-300 border-b border-neutral-700 pb-1">
                  🎨 Colores de la Carta y Elementos
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-mono mb-1">Color de Fondo de la Carta</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandDarkBgColor}
                        onChange={e => setBrandDarkBgColor(e.target.value)}
                        className="w-10 h-8 rounded-lg bg-neutral-900 border border-neutral-700 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandDarkBgColor}
                        onChange={e => setBrandDarkBgColor(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-mono mb-1">Color de Fondo de la Ficha del Plato</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandDishCardBgColor || brandDarkBgColor}
                        onChange={e => setBrandDishCardBgColor(e.target.value)}
                        className="w-10 h-8 rounded-lg bg-neutral-900 border border-neutral-700 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        placeholder="Mismo del fondo si está vacío"
                        value={brandDishCardBgColor}
                        onChange={e => setBrandDishCardBgColor(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-mono mb-1">Color de Botones y Borde de Platos</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandButtonColor}
                        onChange={e => setBrandButtonColor(e.target.value)}
                        className="w-10 h-8 rounded-lg bg-neutral-900 border border-neutral-700 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandButtonColor}
                        onChange={e => setBrandButtonColor(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-mono mb-1">Color del Texto de los Botones</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandButtonTextColor}
                        onChange={e => setBrandButtonTextColor(e.target.value)}
                        className="w-10 h-8 rounded-lg bg-neutral-900 border border-neutral-700 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandButtonTextColor}
                        onChange={e => setBrandButtonTextColor(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-mono mb-1">Color de Textos (Platos/Nombres)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandTextColor}
                        onChange={e => setBrandTextColor(e.target.value)}
                        className="w-10 h-8 rounded-lg bg-neutral-900 border border-neutral-700 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandTextColor}
                        onChange={e => setBrandTextColor(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-mono mb-1">Color del Nombre del Restaurante</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandRestaurantNameColor}
                        onChange={e => setBrandRestaurantNameColor(e.target.value)}
                        className="w-10 h-8 rounded-lg bg-neutral-900 border border-neutral-700 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandRestaurantNameColor}
                        onChange={e => setBrandRestaurantNameColor(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Customization */}
              <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-3">
                <span className="block font-mono text-xs font-bold text-amber-300 border-b border-neutral-700 pb-1">
                  ✏️ Tipografía y Fuentes
                </span>

                <div className="space-y-2">
                  <div>
                    <label className="block text-neutral-300 text-[11px] font-mono mb-1 font-bold text-amber-300">Tipo de letra para el Nombre del Restaurante</label>
                    <select
                      value={brandRestaurantNameFont}
                      onChange={e => setBrandRestaurantNameFont(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-xs outline-none"
                    >
                      <option value="inherit">Por defecto (Estilo de Plantilla)</option>
                      <option value="ui-serif, Georgia, Cambria, serif font-serif">Serif Elegante (Georgia / Playfair)</option>
                      <option value="ui-sans-serif, system-ui, sans-serif font-sans">Sans-Serif Limpia (Inter / Arial)</option>
                      <option value="'Montserrat', sans-serif">Montserrat (Urbana / Vanguardia)</option>
                      <option value="'Oswald', sans-serif">Oswald (Impacto / Condensada)</option>
                      <option value="'Cinzel', serif">Cinzel (Clásica / Alta Gastronomía)</option>
                      <option value="cursive">Pacifico / Cursiva (Gourmet / Cárnica)</option>
                      <option value="ui-monospace, monospace">Monospace (Técnica / Pizarra)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 text-[11px] font-mono mb-1">Tipo de letra para el Nombre del Plato</label>
                    <select
                      value={brandDishNameFont}
                      onChange={e => setBrandDishNameFont(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-xs outline-none"
                    >
                      <option value="inherit">Por defecto (Estilo de Plantilla)</option>
                      <option value="ui-sans-serif, system-ui, sans-serif">Sans-Serif Limpia (Moderna / Inter)</option>
                      <option value="ui-serif, Georgia, Cambria, serif">Serif Elegante (Playfair / Georgia)</option>
                      <option value="'Montserrat', sans-serif">Montserrat (Urbana / Vanguardia)</option>
                      <option value="'Oswald', sans-serif">Oswald (Impacto / Condensada)</option>
                      <option value="'Cinzel', serif">Cinzel (Clásica / Alta Cocina)</option>
                      <option value="ui-monospace, monospace">Monospace (Técnica / Pizarra)</option>
                      <option value="cursive">Pacifico / Cursiva (Gourmet / Cárnica)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 text-[11px] font-mono mb-1">Tipo de letra para la Descripción</label>
                    <select
                      value={brandDishDescFont}
                      onChange={e => setBrandDishDescFont(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-xs outline-none"
                    >
                      <option value="inherit">Por defecto (Estilo de Plantilla)</option>
                      <option value="ui-sans-serif, system-ui, sans-serif">Sans-Serif Lectura Cómoda</option>
                      <option value="ui-serif, Georgia, serif">Serif Descriptiva</option>
                      <option value="'Montserrat', sans-serif">Montserrat Suave</option>
                      <option value="ui-monospace, monospace">Monospace Detallado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 text-[11px] font-mono mb-1 font-bold text-amber-300">Tipo de letra para el Precio</label>
                    <select
                      value={brandDishPriceFont}
                      onChange={e => setBrandDishPriceFont(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-xs outline-none"
                    >
                      <option value="ui-monospace, monospace">Monospace (Destacado Claro)</option>
                      <option value="ui-sans-serif, system-ui, sans-serif">Sans-Serif Negrita</option>
                      <option value="ui-serif, Georgia, serif">Serif Tradicional</option>
                      <option value="'Oswald', sans-serif">Oswald Numérico</option>
                      <option value="'Montserrat', sans-serif">Montserrat Precio</option>
                    </select>
                  </div>
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
                  className="px-3 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center gap-1 shadow transition cursor-pointer"
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
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL de la imagen o sube desde tu equipo..."
                      value={newItemImgUrl}
                      onChange={e => setNewItemImgUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:border-amber-400 outline-none font-mono text-[11px]"
                    />
                    {newItemImgUrl && (
                      <img 
                        src={newItemImgUrl} 
                        alt="preview" 
                        className="w-9 h-9 rounded-lg object-cover border border-neutral-700 shrink-0" 
                      />
                    )}
                  </div>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-dashed border-amber-500/50 cursor-pointer text-amber-400 text-xs font-semibold transition">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>📁 Subir foto desde el disco</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageFileUpload(e, setNewItemImgUrl)} 
                    />
                  </label>
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

      {/* MODAL 6: HEADER EDITOR MODAL */}
      <HeaderEditorModal
        isOpen={isHeaderModalOpen}
        onClose={() => setIsHeaderModalOpen(false)}
        restaurant={restaurant}
        onUpdateRestaurant={(upd) => {
          onUpdateRestaurant && onUpdateRestaurant(upd);
        }}
      />
    </>
  );
};
