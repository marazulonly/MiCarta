import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Store, 
  Clock, 
  ArrowUpRight, 
  ExternalLink,
  ChevronRight,
  Shield,
  Building2,
  BarChart3
} from 'lucide-react';
import { Restaurant, Order, UserRole, User, MenuTemplate, MenuItem, MenuCategory } from '../types';
import { AdminDashboard } from './AdminDashboard';
import { OwnerDashboard } from './OwnerDashboard';

interface HomeViewProps {
  currentUser?: User | null;
  restaurants: Restaurant[];
  orders: Order[];
  users: User[];
  templates: MenuTemplate[];
  categories?: MenuCategory[];
  menuItems?: MenuItem[];
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigateToRestaurants: () => void;
  onNavigateToOrders: () => void;
  onOpenCustomerPreview: (restaurant: Restaurant, mode?: 'DINE_IN' | 'DELIVERY') => void;
  onUpdateRestaurant: (updated: Restaurant) => void;
  onAddRestaurant?: (newRestaurant: Restaurant) => void;
  onDeleteRestaurant?: (restaurantId: string) => void;
  onUpdateUser: (updated: User) => void;
  onAddUser?: (newUser: User) => void;
  onUpdateTemplate: (updated: MenuTemplate) => void;
  onAddMenuItem?: (newItem: MenuItem) => void;
  onUpdateMenuItem?: (updatedItem: MenuItem) => void;
  onDeleteMenuItem?: (itemId: string) => void;
  onAddCategory?: (newCategory: MenuCategory) => void;
  onUpdateCategory?: (updatedCategory: MenuCategory) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  restaurants,
  orders,
  users,
  templates,
  categories = [],
  menuItems = [],
  activeRole,
  onRoleChange,
  onNavigateToRestaurants,
  onNavigateToOrders,
  onOpenCustomerPreview,
  onUpdateRestaurant,
  onAddRestaurant,
  onDeleteRestaurant,
  onUpdateUser,
  onAddUser,
  onUpdateTemplate,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  // Determine view mode based on activeRole or manual user toggle
  const [viewMode, setViewMode] = useState<'admin' | 'owner' | 'overview'>(
    activeRole === 'OWNER' ? 'owner' : 'admin'
  );

  // Keep viewMode synced if activeRole changes from the header dropdown
  useEffect(() => {
    if (activeRole === 'OWNER') {
      setViewMode('owner');
    } else if (activeRole === 'ADMIN') {
      setViewMode('admin');
    }
  }, [activeRole]);

  const totalRevenue = restaurants.reduce((acc, r) => acc + r.metrics.dailyRevenue, 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  const avgOccupancy = Math.round(restaurants.reduce((acc, r) => acc + r.metrics.occupancyRate, 0) / restaurants.length);

  return (
    <div className="space-y-6">
      
      {/* Top View Switcher Pills */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-neutral-900">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/80 border border-neutral-800">
          <button
            onClick={() => {
              setViewMode('admin');
              onRoleChange('ADMIN');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Vista de Administrador</span>
          </button>

          <button
            onClick={() => {
              setViewMode('owner');
              onRoleChange('OWNER');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'owner'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Vista de Dueños</span>
          </button>

          <button
            onClick={() => setViewMode('overview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'overview'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Resumen Financiero</span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400 font-mono">
          Modo actual: <strong className="text-white uppercase">{viewMode}</strong>
        </div>
      </div>

      {/* Render Admin Dashboard */}
      {viewMode === 'admin' && (
        <AdminDashboard
          restaurants={restaurants}
          users={users}
          templates={templates}
          onUpdateRestaurant={onUpdateRestaurant}
          onAddRestaurant={onAddRestaurant}
          onDeleteRestaurant={onDeleteRestaurant}
          onUpdateUser={onUpdateUser}
          onAddUser={onAddUser || (() => {})}
          onUpdateTemplate={onUpdateTemplate}
          onOpenCustomerPreview={onOpenCustomerPreview}
          onSwitchToOwnerView={() => {
            setViewMode('owner');
            onRoleChange('OWNER');
          }}
        />
      )}

      {/* Render Owner Dashboard */}
      {viewMode === 'owner' && (
        <OwnerDashboard
          currentUser={currentUser || undefined}
          restaurants={restaurants}
          users={users}
          templates={templates}
          menuItems={menuItems}
          categories={categories}
          onUpdateRestaurant={onUpdateRestaurant}
          onAddRestaurant={onAddRestaurant}
          onDeleteRestaurant={onDeleteRestaurant}
          onAddUser={onAddUser}
          onUpdateUser={onUpdateUser}
          onAddMenuItem={onAddMenuItem}
          onUpdateMenuItem={onUpdateMenuItem}
          onDeleteMenuItem={onDeleteMenuItem}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
          onOpenCustomerPreview={onOpenCustomerPreview}
          onSwitchToAdminView={() => {
            setViewMode('admin');
            onRoleChange('ADMIN');
          }}
        />
      )}

      {/* Render General Financial Overview */}
      {viewMode === 'overview' && (
        <div className="space-y-8 pb-28">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-900 pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Resumen Financiero y Comandas
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Supervisión general de los 4 locales, enlaces públicos y comandas activas.
              </p>
            </div>

            <button
              onClick={onNavigateToOrders}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer self-start sm:self-auto"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Comandas Activas ({activeOrdersCount})</span>
            </button>
          </div>

          {/* Minimalist 4-Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Facturación Diaria</span>
                <DollarSign className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-white">
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-neutral-400 block mt-1">
                  En los 4 locales hoy
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Comandas Activas</span>
                <ShoppingBag className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-white">
                  {activeOrdersCount}
                </span>
                <span className="text-[11px] text-neutral-400 block mt-1">
                  En salón y delivery
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Ocupación Media</span>
                <Store className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-white">
                  {avgOccupancy}%
                </span>
                <span className="text-[11px] text-neutral-400 block mt-1">
                  82 mesas disponibles en total
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-medium">Ticket Promedio</span>
                <TrendingUp className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-white">
                  $36.15
                </span>
                <span className="text-[11px] text-neutral-400 block mt-1">
                  +8.4% vs semana previa
                </span>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/20 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Comandas Recientes en Tiempo Real</h3>
              <button
                onClick={onNavigateToOrders}
                className="text-xs text-neutral-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Tablero KDS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-neutral-800/80">
              {orders.slice(0, 4).map(order => {
                const rest = restaurants.find(r => r.id === order.restaurantId);
                return (
                  <div 
                    key={order.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-mono font-bold text-xs text-white">
                        {order.orderNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{order.customerName}</span>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            ({rest?.name})
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                      <span className="font-bold text-white font-mono">${order.total.toFixed(2)}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-900 text-neutral-300 border border-neutral-800">
                        {order.status === 'PENDING' ? 'Pendiente' :
                         order.status === 'IN_KITCHEN' ? 'En Cocina' :
                         order.status === 'READY' ? 'Listo' : 'Entregado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
