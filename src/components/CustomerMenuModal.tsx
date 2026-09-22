import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Check, 
  Plus, 
  Minus,
  Sparkles,
  ChefHat,
  Bike
} from 'lucide-react';
import { Restaurant, MenuItem, MenuCategory, Order, OrderItemUnit } from '../types';
import { BrasasLuxuryMenu } from './BrasasLuxuryMenu';
import { CriolloChalkboardMenu } from './CriolloChalkboardMenu';
import { CostaMarinaMenu } from './CostaMarinaMenu';
import { ItemOrderModal } from './ItemOrderModal';
import { UnifiedCartDrawer } from './UnifiedCartDrawer';

interface CustomerMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  onOrderCreated?: (newOrder: Order) => void;
  initialMode?: 'DINE_IN' | 'DELIVERY';
  initialTableNumber?: string;
}

export const CustomerMenuModal: React.FC<CustomerMenuModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  categories,
  items,
  onOrderCreated,
  initialMode = 'DINE_IN',
  initialTableNumber,
}) => {
  const [activeChannel, setActiveChannel] = useState<'DINE_IN' | 'DELIVERY'>(initialMode);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number; units: OrderItemUnit[] }[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);

  if (!isOpen) return null;

  // Template resolution: check templateId first, fallback to slug/id
  const isMarineTemplate = restaurant.templateId === 'tmpl-marine' || 
    (!restaurant.templateId && (restaurant.id === 'rest-costa' || restaurant.slug === 'costa-marina' || restaurant.name.toLowerCase().includes('costa')));

  const isCriolloTemplate = restaurant.templateId === 'tmpl-criollo' || 
    (!restaurant.templateId && (restaurant.id === 'rest-criollo' || restaurant.slug === 'criollo-tradicion' || restaurant.name.toLowerCase().includes('criollo')));

  if (isMarineTemplate) {
    return (
      <CostaMarinaMenu
        isOpen={isOpen}
        onClose={onClose}
        restaurant={restaurant}
        categories={categories}
        items={items}
        onOrderCreated={onOrderCreated}
        initialMode={initialMode}
        initialTableNumber={initialTableNumber}
      />
    );
  }

  if (isCriolloTemplate) {
    return (
      <CriolloChalkboardMenu
        isOpen={isOpen}
        onClose={onClose}
        restaurant={restaurant}
        categories={categories}
        items={items}
        onOrderCreated={onOrderCreated}
        initialMode={initialMode}
        initialTableNumber={initialTableNumber}
      />
    );
  }

  // Default to Brasas Luxury Menu or standard
  return (
    <BrasasLuxuryMenu
      isOpen={isOpen}
      onClose={onClose}
      restaurant={restaurant}
      categories={categories}
      items={items}
      onOrderCreated={onOrderCreated}
      initialMode={initialMode}
      initialTableNumber={initialTableNumber}
    />
  );
};
