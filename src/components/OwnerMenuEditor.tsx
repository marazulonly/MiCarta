import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Camera,
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
  Compass,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  FileText,
  Upload,
  GripVertical,
  GripHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Download,
  FileJson,
  Sliders,
  Copy
} from 'lucide-react';
import { 
  Restaurant, 
  MenuItem, 
  MenuCategory, 
  DishAddon, 
  MenuAccessSettings,
  MenuTemplate
} from '../types';
import { getSafeBranding, getSafeMenuAccessSettings } from '../utils/restaurantUtils';
import { downloadRestaurantJSON, parseImportedJSON } from '../lib/jsonExportImport';
import { ImportMenuModal, ImportMenuMode } from './ImportMenuModal';
import { HeaderEditorModal } from './HeaderEditorModal';
import { publishRestaurantMenu, fetchPublicPublishedMenu } from '../lib/cloudSync';

interface OwnerMenuEditorProps {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  templates?: MenuTemplate[];
  onUpdateRestaurant: (updated: Restaurant) => void;
  onAddMenuItem: (newItem: MenuItem) => void;
  onUpdateMenuItem: (updatedItem: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
  onReorderMenuItems?: (newItems: MenuItem[]) => void;
  onAddCategory: (newCategory: MenuCategory) => void;
  onUpdateCategory: (updatedCategory: MenuCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategories?: (newCategories: MenuCategory[]) => void;
  onOpenCustomerPreview: (restaurant: Restaurant, mode?: 'DINE_IN' | 'DELIVERY') => void;
  onPublishMenu?: (
    restaurantId: string,
    restaurant: Restaurant,
    categories: MenuCategory[],
    items: MenuItem[]
  ) => Promise<{ success: boolean; version?: number; publishedAt?: string } | void> | void;
  onImportBackupJSON?: (
    data: { restaurants: Restaurant[]; categories: MenuCategory[]; items: MenuItem[] },
    mode?: ImportMenuMode,
    targetRestaurantId?: string
  ) => void;
}

export const OwnerMenuEditor: React.FC<OwnerMenuEditorProps> = ({
  restaurant,
  categories,
  items,
  templates = [],
  onUpdateRestaurant,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onReorderMenuItems,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  onOpenCustomerPreview,
  onPublishMenu,
  onImportBackupJSON,
}) => {
  const [subTab, setSubTab] = useState<'items' | 'categories' | 'backgrounds'>('items');
  const [isListView, setIsListView] = useState<boolean>(true);
  const dishImageInputRef = useRef<HTMLInputElement>(null);
  const [hoveredOrClickedItemId, setHoveredOrClickedItemId] = useState<string | null>(null);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastPublishedVersion, setLastPublishedVersion] = useState<number | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);

  // Fetch current published version status
  useEffect(() => {
    fetchPublicPublishedMenu(restaurant.id).then(pub => {
      if (pub && pub.version) {
        setLastPublishedVersion(pub.version);
        setLastPublishedAt(pub.publishedAt);
      }
    });
  }, [restaurant.id]);

  const handlePublishClick = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      if (onPublishMenu) {
        const res = await onPublishMenu(restaurant.id, restaurant, categories, items);
        if (res && res.version) {
          setLastPublishedVersion(res.version);
          setLastPublishedAt(res.publishedAt || new Date().toISOString());
        }
      } else {
        const res = await publishRestaurantMenu(restaurant.id, restaurant, categories, items);
        if (res.success) {
          setLastPublishedVersion(res.version || 1);
          setLastPublishedAt(res.publishedAt || new Date().toISOString());
          showToast(`✓ ¡Carta publicada exitosamente (v${res.version})! Los comensales y visitantes anónimos ya pueden verla.`);
        } else {
          showToast(`⚠️ Error al publicar: ${res.message}`);
        }
      }
    } catch (err: any) {
      showToast(`⚠️ Error al publicar: ${err?.message || 'Error de red'}`);
    } finally {
      setIsPublishing(false);
    }
  };
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Local Disk File Upload Handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ La imagen es demasiado pesada. Elige una foto de menos de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        callback(result);
        showToast('✓ Imagen cargada exitosamente desde el disco');
      }
    };
    reader.readAsDataURL(file);
  };

  // Find linked system template (reference only - never mutated)
  const baseSystemTemplate = templates.find(t => t.id === restaurant?.templateId) || templates[0];

  // Restaurant Brand and Visual Customization State (Isolated per restaurant)
  const [brandName, setBrandName] = useState(restaurant?.name || '');
  const [brandTagline, setBrandTagline] = useState(restaurant?.tagline || '');
  const [brandLogoUrl, setBrandLogoUrl] = useState(restaurant?.logoUrl || '');
  const [brandCoverUrl, setBrandCoverUrl] = useState(restaurant?.coverUrl || '');
  const [brandPrimaryColor, setBrandPrimaryColor] = useState(restaurant?.branding?.primaryColor || '#D4AF37');
  const [brandDarkBgColor, setBrandDarkBgColor] = useState(restaurant?.branding?.darkBgColor || '#071A14');
  const [brandSecondaryColor, setBrandSecondaryColor] = useState(restaurant?.branding?.secondaryColor || '#FFFFFF');
  const [brandButtonColor, setBrandButtonColor] = useState(restaurant?.branding?.buttonColor || restaurant?.branding?.accentColor || '#38bdf8');
  const [brandDishNameFont, setBrandDishNameFont] = useState(restaurant?.branding?.dishNameFont || 'inherit');
  const [brandDishDescFont, setBrandDishDescFont] = useState(restaurant?.branding?.dishDescFont || 'inherit');
  const [brandDishPriceFont, setBrandDishPriceFont] = useState(restaurant?.branding?.dishPriceFont || 'monospace');

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ La imagen excede 5MB. Por favor selecciona una más liviana.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBrandLogoUrl(reader.result);
        showToast('✓ Logo cargado desde el disco.');
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
        showToast('✓ Portada cargada desde el disco.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick edit modal states for instant price & photo tweaking
  const [quickPriceItem, setQuickPriceItem] = useState<MenuItem | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<number>(0);

  const [quickPhotoItem, setQuickPhotoItem] = useState<MenuItem | null>(null);
  const [quickPhotoUrl, setQuickPhotoUrl] = useState<string>('');

  // Curated Gastronomy Presets for quick brand identity setup
  const PRESET_LOGOS = [
    { label: 'Brasas & Parrilla', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80' },
    { label: 'Cevichería Puerto', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200&auto=format&fit=crop&q=80' },
    { label: 'Sazón Criolla', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&auto=format&fit=crop&q=80' },
    { label: 'Craft Burgers', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80' },
    { label: 'Bistró & Cava', url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=200&auto=format&fit=crop&q=80' },
  ];

  const PRESET_COVERS = [
    { label: 'Fuego y Asador', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Marea y Océano', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Pizarra Colonial', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Lounge Nocturno', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Mármol & Luces', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80' },
  ];

  const PRESET_BACKGROUND_TEXTURES = [
    { label: 'Mármol Esmeralda & Oro', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Madera Caoba Rústica', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Pizarra Grafito Mate', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Océano Azul Profundo', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Cuero Noir & Asfalto', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Pergamino Marfil', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=1200&auto=format&fit=crop&q=80' },
  ];

  // Pre-selected stock photos for rapid dish creation & editing
  const STOCK_PHOTOS = [
    { label: 'Parrilla / Carnes', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80' },
    { label: 'Cortes Angus', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
    { label: 'Anticuchos / Brochetas', url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80' },
    { label: 'Ceviche Fresco', url: 'https://images.unsplash.com/photo-1535400255456-984241443b29?w=600&auto=format&fit=crop&q=80' },
    { label: 'Smash Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
    { label: 'Cóctel de Autor', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
    { label: 'Arroz con Mariscos', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80' },
    { label: 'Lomo Saltado', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80' },
  ];

  // Synchronize state when restaurant prop changes
  useEffect(() => {
    if (!restaurant) return;
    const branding = getSafeBranding(restaurant);
    setBrandName(restaurant.name || '');
    setBrandTagline(restaurant.tagline || '');
    setBrandLogoUrl(restaurant.logoUrl || '');
    setBrandCoverUrl(restaurant.coverUrl || '');
    setBrandPrimaryColor(branding.primaryColor || '#D4AF37');
    setBrandDarkBgColor(branding.darkBgColor || '#071A14');
    setBrandSecondaryColor(branding.secondaryColor || '#FFFFFF');
    setBrandButtonColor(branding.buttonColor || branding.accentColor || '#38bdf8');
    setBrandDishNameFont(branding.dishNameFont || 'inherit');
    setBrandDishDescFont(branding.dishDescFont || 'inherit');
    setBrandDishPriceFont(branding.dishPriceFont || 'monospace');
    setMenuSettings(getSafeMenuAccessSettings(restaurant));
  }, [restaurant?.id]);

  // Filter & sort categories and items for this restaurant
  const restaurantCategories = [...categories.filter(c => c.restaurantId === restaurant.id)]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const restaurantItems = items.filter(i => {
    const matchRest = i.restaurantId === restaurant.id;
    if (selectedCategoryFilter === 'all') return matchRest;
    return matchRest && i.categoryId === selectedCategoryFilter;
  });

  // --- Drag & Drop Reordering State ---
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Category Reorder Handlers
  const handleMoveCategory = (catId: string, direction: 'up' | 'down') => {
    const list = [...restaurantCategories];
    const idx = list.findIndex(c => c.id === catId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const [moved] = list.splice(idx, 1);
    list.splice(targetIdx, 0, moved);

    const reordered = list.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    if (onReorderCategories) {
      onReorderCategories(reordered);
    } else {
      reordered.forEach(c => onUpdateCategory(c));
    }
    showToast(`✓ Categoría "${moved.name}" movida`);
  };

  const handleCategoryDrop = (targetCatId: string) => {
    if (!draggedCatId || draggedCatId === targetCatId) return;
    const list = [...restaurantCategories];
    const fromIdx = list.findIndex(c => c.id === draggedCatId);
    const toIdx = list.findIndex(c => c.id === targetCatId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    const reordered = list.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    if (onReorderCategories) {
      onReorderCategories(reordered);
    } else {
      reordered.forEach(c => onUpdateCategory(c));
    }
    setDraggedCatId(null);
    setDragOverCatId(null);
    showToast(`✓ Categoría "${moved.name}" reordenada.`);
  };

  // Item Reorder Handlers
  const handleMoveItem = (itemId: string, direction: 'up' | 'down') => {
    const allRestItems = items.filter(i => i.restaurantId === restaurant.id);
    const currentList = [...restaurantItems];
    const idx = currentList.findIndex(i => i.id === itemId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;

    const [moved] = currentList.splice(idx, 1);
    currentList.splice(targetIdx, 0, moved);

    const otherCategoryItems = allRestItems.filter(i => !currentList.some(c => c.id === i.id));
    const fullList = [...currentList, ...otherCategoryItems];

    if (onReorderMenuItems) {
      onReorderMenuItems(fullList);
    } else {
      fullList.forEach(i => onUpdateMenuItem(i));
    }
    showToast(`✓ Plato "${moved.name}" movido.`);
  };

  const handleItemDrop = (targetItemId: string) => {
    if (!draggedItemId || draggedItemId === targetItemId) return;
    const allRestItems = items.filter(i => i.restaurantId === restaurant.id);
    const currentList = [...restaurantItems];
    const fromIdx = currentList.findIndex(i => i.id === draggedItemId);
    const toIdx = currentList.findIndex(i => i.id === targetItemId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = currentList.splice(fromIdx, 1);
    currentList.splice(toIdx, 0, moved);

    const otherCategoryItems = allRestItems.filter(i => !currentList.some(c => c.id === i.id));
    const fullList = [...currentList, ...otherCategoryItems];

    if (onReorderMenuItems) {
      onReorderMenuItems(fullList);
    } else {
      fullList.forEach(i => onUpdateMenuItem(i));
    }
    setDraggedItemId(null);
    setDragOverItemId(null);
    showToast(`✓ Plato "${moved.name}" reordenado.`);
  };

  // Duplicate Dish Handler (inherits addons, observations, allergens, tags, etc. with non-repeating name)
  const handleDuplicateItem = (itemToCopy: MenuItem) => {
    const allDishNames = items.map(i => i.name.toLowerCase().trim());
    let copyIndex = 1;
    let newName = `${itemToCopy.name.trim()} (Copia)`;
    while (allDishNames.includes(newName.toLowerCase().trim())) {
      copyIndex++;
      newName = `${itemToCopy.name.trim()} (Copia ${copyIndex})`;
    }

    const duplicatedItem: MenuItem = {
      ...itemToCopy,
      id: `item-${restaurant.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newName,
      availableAddons: itemToCopy.availableAddons ? JSON.parse(JSON.stringify(itemToCopy.availableAddons)) : [],
      suggestedObservations: itemToCopy.suggestedObservations ? [...itemToCopy.suggestedObservations] : [],
      allergens: itemToCopy.allergens ? [...itemToCopy.allergens] : [],
      tags: itemToCopy.tags ? [...itemToCopy.tags] : [],
    };

    onAddMenuItem(duplicatedItem);
    showToast(`✓ Plato duplicado como "${duplicatedItem.name}" heredando adicionales y observaciones.`);
  };

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
      const targetCatId = formCategoryId || restaurantCategories[0]?.id || `cat-${restaurant.id}-general`;
      if (!categories.some(c => c.id === targetCatId && c.restaurantId === restaurant.id)) {
        onAddCategory({
          id: targetCatId,
          restaurantId: restaurant.id,
          name: 'De la Casa',
          sortOrder: 1,
          isActive: true,
        });
      }
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        restaurantId: restaurant.id,
        categoryId: targetCatId,
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
    enableDineIn: true,
    enableDelivery: true,
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

  const handleSaveCustomization = () => {
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
        headerLogoUrl: safeLogo,
        primaryColor: brandPrimaryColor,
        darkBgColor: brandDarkBgColor,
        secondaryColor: brandSecondaryColor,
        buttonColor: brandButtonColor,
        accentColor: brandButtonColor,
        dishNameFont: brandDishNameFont,
        dishDescFont: brandDishDescFont,
        dishPriceFont: brandDishPriceFont,
      },
      menuAccessSettings: {
        ...menuSettings,
        enableDineIn: menuSettings.enableDineIn !== false,
        enableDelivery: menuSettings.enableDelivery !== false,
      },
    };
    onUpdateRestaurant(updatedRest);
    showToast('✓ Personalización de carta, marca y canales guardada exitosamente.');
  };

  const handleResetToOriginalTemplate = () => {
    if (!baseSystemTemplate) return;
    setBrandPrimaryColor(baseSystemTemplate.primaryColor);
    setBrandDarkBgColor(baseSystemTemplate.darkBgColor);
    const resetSettings: MenuAccessSettings = {
      ...menuSettings,
      presentialBgType: 'theme',
      presentialBgValue: baseSystemTemplate.darkBgColor,
      deliveryBgType: 'gradient',
      deliveryBgValue: `linear-gradient(180deg, ${baseSystemTemplate.darkBgColor} 0%, #0F2D24 100%)`,
    };
    setMenuSettings(resetSettings);
    const updatedRest: Restaurant = {
      ...restaurant,
      branding: {
        ...restaurant.branding,
        primaryColor: baseSystemTemplate.primaryColor,
        darkBgColor: baseSystemTemplate.darkBgColor,
      },
      menuAccessSettings: resetSettings,
    };
    onUpdateRestaurant(updatedRest);
    showToast(`✓ Se han restaurado los colores y fondos originales de la plantilla "${baseSystemTemplate.name}".`);
  };

  const handleToggleItemAvailability = (item: MenuItem) => {
    const updated: MenuItem = {
      ...item,
      isAvailable: !item.isAvailable,
    };
    onUpdateMenuItem(updated);
    showToast(`Plato marcado como ${updated.isAvailable ? 'Disponible' : 'Agotado (Lista 86)'}`);
  };

  const handleQuickSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceItem) return;
    const updated: MenuItem = {
      ...quickPriceItem,
      price: Number(quickPriceValue),
    };
    onUpdateMenuItem(updated);
    setQuickPriceItem(null);
    showToast(`✓ Precio de "${updated.name}" actualizado a S/ ${updated.price.toFixed(2)}`);
  };

  const handleQuickSavePhoto = (photoUrlToSave?: string) => {
    if (!quickPhotoItem) return;
    const targetUrl = photoUrlToSave || quickPhotoUrl;
    if (!targetUrl.trim()) return;
    const updated: MenuItem = {
      ...quickPhotoItem,
      imageUrl: targetUrl.trim(),
    };
    onUpdateMenuItem(updated);
    setQuickPhotoItem(null);
    showToast(`✓ Foto del plato "${updated.name}" actualizada con éxito`);
  };

  // State for Import Menu JSON modal with mode selection (MERGE vs REPLACE)
  const [pendingImportData, setPendingImportData] = useState<{
    restaurants: Restaurant[];
    categories: MenuCategory[];
    items: MenuItem[];
  } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;
        const parsed = parseImportedJSON(text);
        setPendingImportData(parsed);
        setIsImportModalOpen(true);
      } catch (err: any) {
        showToast('⚠️ Error al leer JSON: ' + (err.message || 'Formato no válido'));
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Gestión de Carta y Platos: {restaurant.name}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Crea y edita categorías, platos, adicionales, observaciones y fondos independientes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenNewCategoryModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5 text-neutral-600" />
            <span>+ Nueva Categoría</span>
          </button>

          <button
            onClick={handleOpenNewItemModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo Plato</span>
          </button>
        </div>
      </div>

      {/* Subtabs Selector */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 flex-wrap">
        <button
          onClick={() => setSubTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'items'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Platos y Precios ({restaurantItems.length})</span>
        </button>

        <button
          onClick={() => setSubTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'categories'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Categorías ({restaurantCategories.length})</span>
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
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                Todos los Platos ({items.filter(i => i.restaurantId === restaurant.id).length})
              </button>

              {restaurantCategories.map((cat, catIdx) => {
                const count = items.filter(i => i.restaurantId === restaurant.id && i.categoryId === cat.id).length;
                const isDragging = draggedCatId === cat.id;
                const isOver = dragOverCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', cat.id);
                      setDraggedCatId(cat.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverCatId(cat.id);
                    }}
                    onDragEnd={() => {
                      setDraggedCatId(null);
                      setDragOverCatId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleCategoryDrop(cat.id);
                    }}
                    className={`flex items-center gap-0.5 rounded-lg transition shrink-0 ${
                      isDragging ? 'opacity-40 scale-95' : ''
                    } ${isOver ? 'ring-2 ring-neutral-400 bg-neutral-100' : ''}`}
                  >
                    <button
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-grab active:cursor-grabbing flex items-center gap-1.5 ${
                        selectedCategoryFilter === cat.id
                          ? 'bg-neutral-900 text-white shadow font-bold'
                          : 'bg-white text-neutral-800 hover:bg-neutral-100 border border-neutral-200'
                      }`}
                      title="Arrastra para cambiar el orden de esta categoría"
                    >
                      <GripHorizontal className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>{cat.name} ({count})</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-50 text-xs font-bold cursor-pointer select-none shadow-sm">
                <input
                  type="checkbox"
                  checked={isListView}
                  onChange={(e) => setIsListView(e.target.checked)}
                  className="rounded accent-neutral-900 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Vista Lista (2 líneas)</span>
              </label>
            </div>
          </div>

          {/* Dishes Presentation: List or Grid */}
          {isListView ? (
            /* LIST VIEW: 2 Líneas por plato con Nombre, Categoría, Precio y Descripción debajo (Arrastrable para reordenar) */
            <div className="space-y-2">
              {restaurantItems.map((item, itemIdx) => {
                const catObj = restaurantCategories.find(c => c.id === item.categoryId);
                const isInteracted = hoveredOrClickedItemId === item.id;
                const isDragging = draggedItemId === item.id;
                const isOver = dragOverItemId === item.id;
                
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item.id);
                      setDraggedItemId(item.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverItemId(item.id);
                    }}
                    onDragEnd={() => {
                      setDraggedItemId(null);
                      setDragOverItemId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleItemDrop(item.id);
                    }}
                    onClick={() => setHoveredOrClickedItemId(hoveredOrClickedItemId === item.id ? null : item.id)}
                    onMouseEnter={() => setHoveredOrClickedItemId(item.id)}
                    onMouseLeave={() => setHoveredOrClickedItemId(null)}
                    className={`group p-3 sm:p-3.5 rounded-xl bg-white border transition-all cursor-grab active:cursor-grabbing relative flex flex-col justify-center gap-1.5 shadow-sm ${
                      isDragging ? 'opacity-30 scale-95 border-dashed border-neutral-400 bg-neutral-100' : ''
                    } ${
                      isOver ? 'ring-2 ring-neutral-400 border-neutral-400 bg-neutral-100 scale-[1.005]' : 'border-neutral-200 hover:border-neutral-300'
                    } ${
                      isInteracted && !isDragging && !isOver ? 'border-neutral-400 bg-neutral-50 shadow-md' : ''
                    }`}
                  >
                    {/* Línea 1: Columnas de Arrastre, Nombre, Categoría, Precio y Botones de acción */}
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-neutral-400 hover:text-neutral-700 shrink-0 cursor-grab active:cursor-grabbing" title="Arrastra para cambiar el orden de este plato">
                          <GripVertical className="w-4 h-4 text-neutral-400" />
                          <span className="text-[10px] text-neutral-400 font-mono font-bold">#{itemIdx + 1}</span>
                        </div>
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-7 h-7 rounded-lg object-cover border border-neutral-200 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <h4 className="text-sm font-bold text-neutral-900 truncate group-hover:text-black transition">
                          {item.name}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleItemAvailability(item);
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 transition ${
                            item.isAvailable 
                              ? 'bg-neutral-100 text-neutral-800 border border-neutral-300' 
                              : 'bg-neutral-200 text-neutral-500 border border-neutral-300'
                          }`}
                        >
                          {item.isAvailable ? 'Disponible' : 'Agotado'}
                        </button>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Categoría */}
                        <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {catObj?.name || 'Categoría'}
                        </span>

                        {/* Precio */}
                        <span className="font-mono font-bold text-neutral-900 text-sm whitespace-nowrap">
                          S/ {item.price.toFixed(2)}
                        </span>

                        {/* Botones de Editar y Borrar (visibles en hover o click) */}
                        <div className={`flex items-center gap-1.5 transition-opacity duration-150 ${
                          isInteracted ? 'opacity-100' : 'opacity-0 sm:opacity-0 group-hover:opacity-100'
                        }`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditItemModal(item);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1 border border-neutral-200 transition cursor-pointer shadow-sm"
                            title="Editar plato"
                          >
                            <Edit3 className="w-3 h-3 text-neutral-600" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Eliminar el plato "${item.name}"?`)) {
                                onDeleteMenuItem(item.id);
                                showToast(`Plato "${item.name}" eliminado`);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-red-50 hover:text-red-700 text-neutral-700 border border-neutral-200 transition cursor-pointer"
                            title="Eliminar plato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Línea 2: Debajo del nombre del plato, la descripción */}
                    <div className="pl-6 sm:pl-7 pr-2">
                      <p className="text-xs text-neutral-600 line-clamp-1 leading-relaxed">
                        {item.description || 'Sin descripción detallada'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID VIEW: 4 columnas en PC (lg:), 3 columnas en tablet (md:), 2 columnas en móvil (cols-2) */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {restaurantItems.map((item, itemIdx) => {
              const catObj = restaurantCategories.find(c => c.id === item.categoryId);
              const addonsCount = item.availableAddons?.length || 0;
              const obsCount = item.suggestedObservations?.length || 0;
              const isDragging = draggedItemId === item.id;
              const isOver = dragOverItemId === item.id;

              return (
                <div 
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                    setDraggedItemId(item.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverItemId(item.id);
                  }}
                  onDragEnd={() => {
                    setDraggedItemId(null);
                    setDragOverItemId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleItemDrop(item.id);
                  }}
                  className={`rounded-2xl bg-white border transition overflow-hidden flex flex-col justify-between shadow-sm ${
                    isDragging ? 'opacity-30 scale-95 border-neutral-400 border-dashed' : ''
                  } ${
                    isOver ? 'border-neutral-400 ring-2 ring-neutral-300 scale-[1.01]' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div>
                    {/* Reorder Bar & Drag Grip */}
                    <div className="px-3 py-1.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-[10px] text-neutral-600 font-mono">
                      <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing font-bold text-neutral-700 hover:text-black">
                        <GripVertical className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Arrastrar</span>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500">#{itemIdx + 1}</span>
                    </div>

                    {/* Image Header */}
                    <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-neutral-100">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap max-w-[70%]">
                        <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded font-mono font-bold bg-white/90 text-neutral-900 border border-neutral-200 backdrop-blur-md truncate shadow-sm">
                          {catObj?.name || 'Categoría'}
                        </span>
                        {item.targetMenuScope === 'DINE_IN' && (
                          <span className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded bg-white/90 text-neutral-800 border border-neutral-200 shadow-sm">
                            Salón
                          </span>
                        )}
                        {item.targetMenuScope === 'DELIVERY' && (
                          <span className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded bg-white/90 text-neutral-800 border border-neutral-200 shadow-sm">
                            Delivery
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={() => handleToggleItemAvailability(item)}
                          className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded font-bold font-mono transition cursor-pointer hover:scale-105 shadow-sm ${
                            item.isAvailable 
                              ? 'bg-white/90 text-neutral-900 border border-neutral-200' 
                              : 'bg-neutral-200/90 text-neutral-500 border border-neutral-300'
                          }`}
                          title="Clic para cambiar disponibilidad (Disponible / Agotado)"
                        >
                          {item.isAvailable ? 'Disponible' : 'Agotado'}
                        </button>
                      </div>

                      {/* Quick Photo Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPhotoItem(item);
                          setQuickPhotoUrl(item.imageUrl);
                        }}
                        className="absolute bottom-2 right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-white/90 hover:bg-white text-neutral-900 text-[9px] sm:text-[10px] font-bold flex items-center gap-1 border border-neutral-200 backdrop-blur-md cursor-pointer transition shadow-sm"
                        title="Cambiar foto de este plato"
                      >
                        <ImageIcon className="w-3 h-3 text-neutral-700" />
                        <span className="hidden sm:inline">Foto</span>
                      </button>

                      <div className="absolute bottom-2 left-2 sm:left-3 flex items-baseline gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setQuickPriceItem(item);
                            setQuickPriceValue(item.price);
                          }}
                          className="text-sm sm:text-base font-black text-neutral-900 font-mono bg-white/90 px-2 py-0.5 rounded-lg border border-neutral-200 shadow-sm flex items-center gap-1 cursor-pointer transition group"
                          title="Clic para editar precio rápidamente"
                        >
                          <span>S/ {item.price.toFixed(2)}</span>
                          <Edit3 className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-neutral-500 group-hover:text-black" />
                        </button>
                        {item.prepTimeMinutes && (
                          <span className="text-[9px] sm:text-[10px] text-white font-semibold drop-shadow flex items-center gap-0.5 sm:gap-1">
                            <Clock className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                            <span>{item.prepTimeMinutes}m</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                      <h3 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Addons & Observations metadata badge */}
                      <div className="pt-1.5 sm:pt-2 border-t border-neutral-100 flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px] text-neutral-600">
                        <span className="px-1.5 sm:px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                          {addonsCount} adic.
                        </span>
                        <span className="px-1.5 sm:px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                          {obsCount} obs.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-2 sm:p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-1.5 sm:gap-2">
                    <button
                      onClick={() => handleOpenEditItemModal(item)}
                      className="flex-1 py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-neutral-900 hover:bg-black text-[11px] sm:text-xs font-bold text-white transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Edit3 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-neutral-300" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateItem(item)}
                      className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      title="Duplicar plato (hereda adicionales y observaciones)"
                    >
                      <Copy className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-neutral-600" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el plato "${item.name}"?`)) {
                          onDeleteMenuItem(item.id);
                          showToast(`Plato "${item.name}" eliminado`);
                        }
                      }}
                      className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white hover:bg-red-50 text-neutral-700 hover:text-red-700 border border-neutral-200 transition cursor-pointer shadow-sm"
                      title="Eliminar plato"
                    >
                      <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
          )}

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
            {restaurantCategories.map((cat, catIdx) => {
              const dishCount = items.filter(i => i.restaurantId === restaurant.id && i.categoryId === cat.id).length;
              const isDragging = draggedCatId === cat.id;
              const isOver = dragOverCatId === cat.id;

              return (
                <div 
                  key={cat.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', cat.id);
                    setDraggedCatId(cat.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCatId(cat.id);
                  }}
                  onDragEnd={() => {
                    setDraggedCatId(null);
                    setDragOverCatId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleCategoryDrop(cat.id);
                  }}
                  className={`p-4 rounded-2xl bg-neutral-900 border space-y-3 flex flex-col justify-between transition ${
                    isDragging ? 'opacity-30 scale-95 border-amber-400 border-dashed' : ''
                  } ${
                    isOver ? 'border-amber-400 ring-2 ring-amber-400/50 scale-[1.01]' : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Reorder Grip Header */}
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pb-2 border-b border-neutral-800">
                      <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing font-bold text-amber-400/90 hover:text-amber-300">
                        <GripVertical className="w-3.5 h-3.5" />
                        <span>Arrastrar categoría</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-neutral-500 mr-1">#{catIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(cat.id, 'up')}
                          disabled={catIdx === 0}
                          className="px-1.5 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-white disabled:opacity-20 cursor-pointer"
                          title="Mover categoría arriba"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(cat.id, 'down')}
                          disabled={catIdx === restaurantCategories.length - 1}
                          className="px-1.5 py-0.5 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-white disabled:opacity-20 cursor-pointer"
                          title="Mover categoría abajo"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
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

      {/* SUBTAB 3: PERSONALIZACIÓN DE CARTA: FONDOS, LOGO, PORTADA Y MARCA */}
      {subTab === 'backgrounds' && (
        <div className="space-y-6">
          
          {/* Card 1: Garantía del Sistema - Plantilla Original Inmutable */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      Plantilla Maestra del Sistema Protegida (Inmutable)
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Aislamiento Seguro
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Plantilla asignada: <span className="text-amber-400 font-bold">{baseSystemTemplate?.name || 'Brasas Luxury Noir'}</span> ({baseSystemTemplate?.category || 'Gourmet'})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetToOriginalTemplate}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-neutral-700 cursor-pointer self-start sm:self-auto"
                title="Restaura los colores y fondos a los predeterminados de la plantilla original"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Restablecer a Valores de Fábrica</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-neutral-800/80 text-xs text-neutral-300 leading-relaxed space-y-1">
              <p className="font-semibold text-white">
                Regla de personalización independiente:
              </p>
              <p className="text-neutral-400 text-[11px]">
                Cada Dueño puede editar libremente su propia carta (fondos, fotos de platos, descripción del plato, precios, logo, portada y colores) para <strong className="text-white">{restaurant.name}</strong>. Estos cambios se guardan en el perfil único de tu restaurante y <span className="text-emerald-400 font-medium">no alteran la plantilla original del sistema</span> ni afectan a otros restaurantes.
              </p>
            </div>
          </div>

          {/* Card 2: Identidad Visual del Restaurante (Logo, Portada, Nombre y Eslogan) */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Identidad Visual, Logo y Portada de la Carta
              </h3>
            </div>

            {/* Logo Customizer */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-200 block">
                Logo del Restaurante
              </label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Logo Live Preview */}
                <div className="w-20 h-20 rounded-2xl bg-black border border-neutral-700 overflow-hidden flex items-center justify-center shrink-0 shadow-lg relative group">
                  {brandLogoUrl ? (
                    <img 
                      src={brandLogoUrl} 
                      alt="Logo preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-1 text-[10px] text-neutral-500 font-mono">Sin Logo</div>
                  )}
                </div>

                {/* Input & Presets */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer shadow transition flex items-center gap-1.5 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir logo del disco</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoFileUpload} 
                      />
                    </label>
                    <input
                      type="text"
                      value={brandLogoUrl}
                      onChange={(e) => setBrandLogoUrl(e.target.value)}
                      placeholder="O URL de logo (https://...)"
                      className="flex-1 px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-amber-400 transition"
                    />
                    {brandLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setBrandLogoUrl('')}
                        className="px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-rose-400 hover:text-rose-300 text-xs font-bold cursor-pointer flex items-center gap-1"
                        title="Quitar logo"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Quitar logo</span>
                      </button>
                    )}
                  </div>

                  {/* Preset Logos */}
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-1">
                      O selecciona un estilo de logo gastronómico predeterminado:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_LOGOS.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setBrandLogoUrl(preset.url)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                            brandLogoUrl === preset.url
                              ? 'bg-amber-400 text-black border-amber-400 shadow'
                              : 'bg-black text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                          }`}
                        >
                          <img 
                            src={preset.url} 
                            alt="" 
                            className="w-3.5 h-3.5 rounded object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover / Banner Customizer */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <label className="text-xs font-bold text-neutral-200 block">
                Foto de Portada / Banner de Cabecera
              </label>

              <div className="space-y-2">
                {/* Live Banner Preview */}
                <div className="w-full h-24 rounded-2xl bg-black border border-neutral-700 overflow-hidden relative shadow-lg">
                  {brandCoverUrl ? (
                    <img 
                      src={brandCoverUrl} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-mono">
                      Sin foto de portada (Usa el fondo de la carta)
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                    <span className="text-xs font-bold text-white drop-shadow">
                      {brandName} {brandTagline ? `· ${brandTagline}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs cursor-pointer border border-neutral-700 transition flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir portada del disco</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCoverFileUpload} 
                    />
                  </label>
                  <input
                    type="text"
                    value={brandCoverUrl}
                    onChange={(e) => setBrandCoverUrl(e.target.value)}
                    placeholder="O URL de portada/banner (https://...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-amber-400 transition"
                  />
                  {brandCoverUrl && (
                    <button
                      type="button"
                      onClick={() => setBrandCoverUrl('')}
                      className="px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-rose-400 hover:text-rose-300 text-xs font-bold cursor-pointer flex items-center gap-1"
                      title="Quitar portada"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Quitar portada</span>
                    </button>
                  )}
                </div>

                {/* Preset Covers */}
                <div>
                  <span className="text-[10px] text-neutral-400 block mb-1">
                    Portadas fotográficas recomendadas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COVERS.map((preset, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setBrandCoverUrl(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          brandCoverUrl === preset.url
                            ? 'bg-amber-400 text-black border-amber-400 shadow'
                            : 'bg-black text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                        }`}
                      >
                        <img 
                          src={preset.url} 
                          alt="" 
                          className="w-3.5 h-3.5 rounded object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Name, Tagline & Custom Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-800">
              <div>
                <label className="text-xs font-bold text-neutral-200 block mb-1">
                  Nombre Comercial en la Carta *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-amber-400 transition"
                  placeholder="Ej: Brasas & Carbón Gourmet"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-200 block mb-1">
                  Eslogan / Subtítulo Gastronómico
                </label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-amber-400 transition"
                  placeholder="Ej: Fuego a la Leña & Alta Cocina Criolla"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-200 block mb-1">
                  Color de Fondo de la Carta
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandDarkBgColor}
                    onChange={(e) => setBrandDarkBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-neutral-700 bg-black cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={brandDarkBgColor}
                    onChange={(e) => setBrandDarkBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  Color de Botones y Borde de Platos
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandButtonColor}
                    onChange={(e) => setBrandButtonColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-neutral-700 bg-black cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={brandButtonColor}
                    onChange={(e) => setBrandButtonColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-amber-400 transition"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  El borde de cada recuadro de plato coincidirá con este color.
                </span>
              </div>
            </div>

            {/* Typography Customizer Section */}
            <div className="pt-3 border-t border-neutral-800 space-y-3">
              <label className="text-xs font-bold text-amber-300 block">
                ✏️ Fuentes y Tipografía de Platos (Nombre, Descripción y Precio)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">Nombre del Plato</label>
                  <select
                    value={brandDishNameFont}
                    onChange={(e) => setBrandDishNameFont(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs outline-none focus:border-amber-400"
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
                  <label className="text-[11px] font-bold text-neutral-300 block mb-1">Descripción del Plato</label>
                  <select
                    value={brandDishDescFont}
                    onChange={(e) => setBrandDishDescFont(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs outline-none focus:border-amber-400"
                  >
                    <option value="inherit">Por defecto (Estilo de Plantilla)</option>
                    <option value="ui-sans-serif, system-ui, sans-serif">Sans-Serif Lectura Cómoda</option>
                    <option value="ui-serif, Georgia, serif">Serif Descriptiva</option>
                    <option value="'Montserrat', sans-serif">Montserrat Suave</option>
                    <option value="ui-monospace, monospace">Monospace Detallado</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-300 block mb-1">Precio del Plato</label>
                  <select
                    value={brandDishPriceFont}
                    onChange={(e) => setBrandDishPriceFont(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs outline-none focus:border-amber-400"
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

          </div>

          {/* Card 3: Modalidad de Carta (Misma carta o Cartas separadas) */}
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

            {/* Check para Salón y Check para Delivery */}
            <div className="pt-4 border-t border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Habilitación de Canales de Atención</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Marca o desmarca los checks para habilitar o suspender cada canal en tu restaurante.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Checkbox Salón */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                  menuSettings.enableDineIn !== false
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                    : 'bg-black/40 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={menuSettings.enableDineIn !== false}
                    onChange={(e) => setMenuSettings(prev => ({ ...prev, enableDineIn: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-neutral-900 border-neutral-700 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold">Carta Salón (Atención Presencial)</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        menuSettings.enableDineIn !== false ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-neutral-500'
                      }`}>
                        {menuSettings.enableDineIn !== false ? 'HABILITADO' : 'DESHABILITADO'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Atención para comensales en mesas, barra y terraza. Permite a los mozos tomar comandas en el salón.
                    </p>
                  </div>
                </label>

                {/* Checkbox Delivery */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                  menuSettings.enableDelivery !== false
                    ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-sm'
                    : 'bg-black/40 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}>
                  <input
                    type="checkbox"
                    checked={menuSettings.enableDelivery !== false}
                    onChange={(e) => setMenuSettings(prev => ({ ...prev, enableDelivery: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded text-purple-500 focus:ring-purple-400 bg-neutral-900 border-neutral-700 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold">Carta Delivery (Pedidos a Domicilio)</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        menuSettings.enableDelivery !== false ? 'bg-purple-400 text-black' : 'bg-neutral-800 text-neutral-500'
                      }`}>
                        {menuSettings.enableDelivery !== false ? 'HABILITADO' : 'DESHABILITADO'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Pedidos a domicilio para clientes externos, cálculo de despacho y entrega por repartidores motorizados.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Dual Customization Panes: Salón vs Delivery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Carta Presencial / Salón */}
            <div className={`p-5 rounded-2xl border space-y-4 transition ${
              menuSettings.enableDineIn !== false ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-950/70 border-neutral-800/60 opacity-80'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${menuSettings.enableDineIn !== false ? 'bg-amber-400' : 'bg-neutral-600'}`} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Carta Presencial / Salón
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    menuSettings.enableDineIn !== false ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                  }`}>
                    {menuSettings.enableDineIn !== false ? 'Habilitado' : 'Deshabilitado'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                    Atención: Mozos
                  </span>
                </div>
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
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'theme', label: 'Plantilla' },
                      { id: 'image', label: 'Foto/Textura' },
                      { id: 'color', label: 'Color Sólido' },
                      { id: 'gradient', label: 'Gradiente' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMenuSettings(prev => ({ ...prev, presentialBgType: t.id as any }))}
                        className={`p-2 rounded-lg text-center font-bold text-[10px] border transition cursor-pointer ${
                          menuSettings.presentialBgType === t.id
                            ? 'bg-amber-400 text-black border-amber-400 shadow'
                            : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Si es imagen/textura */}
                {menuSettings.presentialBgType === 'image' && (
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-neutral-300 block">
                      URL de Imagen de Fondo para Salón
                    </label>
                    <input
                      type="text"
                      value={menuSettings.presentialBgValue || ''}
                      onChange={(e) => setMenuSettings(prev => ({ ...prev, presentialBgValue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-amber-400 transition"
                      placeholder="https://... (textura o fondo fotográfico)"
                    />
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-1">
                        Texturas gastronómicas recomendadas:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {PRESET_BACKGROUND_TEXTURES.map((tex, tIdx) => (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => setMenuSettings(prev => ({ ...prev, presentialBgValue: tex.url }))}
                            className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 cursor-pointer transition ${
                              menuSettings.presentialBgValue === tex.url
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                                : 'bg-black border-neutral-800 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <img 
                              src={tex.url} 
                              alt="" 
                              className="w-4 h-4 rounded object-cover shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9px] font-bold truncate">{tex.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Si es color o gradiente */}
                {(menuSettings.presentialBgType === 'color' || menuSettings.presentialBgType === 'gradient') && (
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                      {menuSettings.presentialBgType === 'color' ? 'Código Hexadecimal del Color' : 'Valor de Gradiente CSS'}
                    </label>
                    <input
                      type="text"
                      value={menuSettings.presentialBgValue || ''}
                      onChange={(e) => setMenuSettings(prev => ({ ...prev, presentialBgValue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-amber-400 transition"
                      placeholder={menuSettings.presentialBgType === 'color' ? '#071A14' : 'linear-gradient(180deg, #071A14, #0F2D24)'}
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenCustomerPreview(restaurant, 'DINE_IN')}
                    className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-neutral-700"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Previsualizar Carta Salón</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Carta Delivery */}
            <div className={`p-5 rounded-2xl border space-y-4 transition ${
              menuSettings.enableDelivery !== false ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-950/70 border-neutral-800/60 opacity-80'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${menuSettings.enableDelivery !== false ? 'bg-purple-400' : 'bg-neutral-600'}`} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Carta Delivery a Domicilio
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    menuSettings.enableDelivery !== false ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                  }`}>
                    {menuSettings.enableDelivery !== false ? 'Habilitado' : 'Deshabilitado'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    Gestión: Repartidores
                  </span>
                </div>
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
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'theme', label: 'Plantilla' },
                      { id: 'image', label: 'Foto/Textura' },
                      { id: 'color', label: 'Color Sólido' },
                      { id: 'gradient', label: 'Gradiente' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMenuSettings(prev => ({ ...prev, deliveryBgType: t.id as any }))}
                        className={`p-2 rounded-lg text-center font-bold text-[10px] border transition cursor-pointer ${
                          menuSettings.deliveryBgType === t.id
                            ? 'bg-purple-400 text-black border-purple-400 shadow'
                            : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Si es imagen/textura */}
                {menuSettings.deliveryBgType === 'image' && (
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-neutral-300 block">
                      URL de Imagen de Fondo para Delivery
                    </label>
                    <input
                      type="text"
                      value={menuSettings.deliveryBgValue || ''}
                      onChange={(e) => setMenuSettings(prev => ({ ...prev, deliveryBgValue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-purple-400 transition"
                      placeholder="https://... (textura o fondo)"
                    />
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-1">
                        Texturas recomendadas:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {PRESET_BACKGROUND_TEXTURES.map((tex, tIdx) => (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => setMenuSettings(prev => ({ ...prev, deliveryBgValue: tex.url }))}
                            className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 cursor-pointer transition ${
                              menuSettings.deliveryBgValue === tex.url
                                ? 'bg-purple-400/20 border-purple-400 text-purple-300'
                                : 'bg-black border-neutral-800 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <img 
                              src={tex.url} 
                              alt="" 
                              className="w-4 h-4 rounded object-cover shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9px] font-bold truncate">{tex.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Si es color o gradiente */}
                {(menuSettings.deliveryBgType === 'color' || menuSettings.deliveryBgType === 'gradient') && (
                  <div>
                    <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                      {menuSettings.deliveryBgType === 'color' ? 'Código Hexadecimal del Color' : 'Valor de Gradiente CSS'}
                    </label>
                    <input
                      type="text"
                      value={menuSettings.deliveryBgValue || ''}
                      onChange={(e) => setMenuSettings(prev => ({ ...prev, deliveryBgValue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs font-mono focus:border-purple-400 transition"
                      placeholder={menuSettings.deliveryBgType === 'color' ? '#18181B' : 'linear-gradient(180deg, #18181B, #09090B)'}
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenCustomerPreview(restaurant, 'DELIVERY')}
                    className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-neutral-700"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>Previsualizar Carta Delivery</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons: Save Customization */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-neutral-400">
              Presiona guardar para actualizar el logo, portada, títulos, colores y fondos de <strong className="text-white">{restaurant.name}</strong>.
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveCustomization}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Guardar Personalización</span>
              </button>
            </div>
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
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Top Section: Foto del Plato (Arriba a la Izquierda) + Nombre & Categoría */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                
                {/* Foto del Plato (Arriba a la Izquierda) - Clic para reemplazar */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <label className="text-xs font-bold text-neutral-400 block self-start">
                    Foto del Plato
                  </label>
                  <div 
                    onClick={() => dishImageInputRef.current?.click()}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-amber-500/50 bg-neutral-900 hover:bg-neutral-800 transition cursor-pointer overflow-hidden flex flex-col items-center justify-center group shadow-md"
                    title="Haz clic para cambiar la imagen del plato"
                  >
                    {formImageUrl ? (
                      <>
                        <img 
                          src={formImageUrl} 
                          alt="Foto del plato" 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-center p-1">
                          <Camera className="w-5 h-5 text-amber-400 mb-0.5" />
                          <span className="text-[10px] font-bold">Cambiar Foto</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-center text-neutral-400 group-hover:text-amber-400 transition">
                        <Camera className="w-6 h-6 mb-1 text-amber-400" />
                        <span className="text-[10px] font-bold">Subir Foto</span>
                      </div>
                    )}
                  </div>
                  <input 
                    ref={dishImageInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageFileUpload(e, setFormImageUrl)} 
                  />
                  <span className="text-[9px] text-neutral-500 text-center">Clic para cambiar</span>
                </div>

                {/* Nombre del Plato & Categoría de Carta */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
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
                    <label className="text-xs font-bold text-neutral-400 block mb-1">
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

              </div>

              {/* Row 2: Descripción del Plato */}
              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">
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
                  <label className="text-xs font-bold text-neutral-400 block mb-1">
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
                  <label className="text-xs font-bold text-neutral-400 block mb-1">
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
                  <label className="text-xs font-bold text-neutral-400 block mb-1">
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

              {/* Row 4: Constructor de Adicionales */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Adicionales</span>
                  </label>
                </div>

                {/* List of current addons */}
                {formAddons.length > 0 && (
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
                  </div>
                )}

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

              {/* Row 5: Constructor de Observaciones */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Observaciones para cocina</span>
                  </label>
                </div>

                {formObservations.length > 0 && (
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
                  </div>
                )}

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
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black transition cursor-pointer shadow-lg shadow-amber-950/20"
                >
                  {editingItem ? 'Guardar Cambios' : '+ Crear Plato'}
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

      {/* MODAL: CAMBIO RÁPIDO DE PRECIO */}
      {quickPriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-950 border border-neutral-800 text-white shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block font-bold">
                  Precio Rápido
                </span>
                <h3 className="text-sm font-bold text-white truncate max-w-[240px]">
                  {quickPriceItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickPriceItem(null)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickSavePrice} className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <img
                  src={quickPriceItem.imageUrl}
                  alt={quickPriceItem.name}
                  className="w-12 h-12 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs">
                  <span className="text-neutral-400 block">Precio anterior:</span>
                  <span className="font-mono font-bold text-neutral-300">S/ {quickPriceItem.price.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Nuevo Precio (S/) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-amber-400 font-mono font-bold text-xs">S/</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    autoFocus
                    required
                    value={quickPriceValue}
                    onChange={(e) => setQuickPriceValue(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-base font-bold font-mono focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Quick increments */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-neutral-500 mr-1">Ajuste rápido:</span>
                {[-5, -2, -1, 1, 2, 5].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setQuickPriceValue((prev) => Math.max(0, prev + delta))}
                    className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono text-neutral-300 cursor-pointer"
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickPriceItem(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Precio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CAMBIO RÁPIDO DE FOTO DE PLATO */}
      {quickPhotoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-950 border border-neutral-800 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 block font-bold">
                  Personalizar Foto de Plato
                </span>
                <h3 className="text-sm font-bold text-white truncate max-w-[280px]">
                  {quickPhotoItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickPhotoItem(null)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Local Disk Upload Section */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-amber-500/40 space-y-2">
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
                        setQuickPhotoUrl(dataUrl);
                        handleQuickSavePhoto(dataUrl);
                      });
                    }} 
                  />
                </label>
              </div>

              {/* Photo Live Preview */}
              <div className="relative h-44 rounded-xl overflow-hidden bg-black border border-neutral-800">
                <img
                  src={quickPhotoUrl || quickPhotoItem.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-xs font-bold text-white drop-shadow">
                    {quickPhotoItem.name} — S/ {quickPhotoItem.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Direct URL input */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  URL de Imagen Personalizada
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickPhotoUrl}
                    onChange={(e) => setQuickPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... o enlace de tu imagen"
                    className="flex-1 px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white font-mono focus:border-amber-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickSavePhoto()}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold shrink-0 cursor-pointer shadow"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {/* Stock Photo Gallery */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 block">
                  Galería Gastronómica Rápida (1 Clic):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STOCK_PHOTOS.map((stock, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        setQuickPhotoUrl(stock.url);
                        handleQuickSavePhoto(stock.url);
                      }}
                      className="group text-left rounded-xl overflow-hidden border border-neutral-800 hover:border-amber-400 transition p-1 bg-black cursor-pointer"
                    >
                      <div className="h-16 w-full rounded-lg overflow-hidden bg-neutral-900 mb-1">
                        <img
                          src={stock.url}
                          alt={stock.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-300 group-hover:text-amber-300 block truncate px-1">
                        {stock.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickPhotoItem(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
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

      {/* Modal to choose between Merge (Añadir) or Replace (Reemplazar) when importing JSON */}
      <ImportMenuModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setPendingImportData(null);
        }}
        importedData={pendingImportData}
        currentRestaurant={restaurant}
        allRestaurants={[restaurant]}
        onConfirmImport={(data, mode, targetId) => {
          if (onImportBackupJSON) {
            onImportBackupJSON(data, mode, targetId || restaurant.id);
          }
        }}
      />

      {/* Header Editor Modal */}
      <HeaderEditorModal
        isOpen={isHeaderModalOpen}
        onClose={() => setIsHeaderModalOpen(false)}
        restaurant={restaurant}
        onUpdateRestaurant={onUpdateRestaurant}
      />

    </div>
  );
};
