import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  ChefHat, 
  Bike, 
  UserCheck, 
  Flame, 
  LogOut, 
  KeyRound, 
  ExternalLink, 
  Shield, 
  Clock, 
  SlidersHorizontal, 
  Eye, 
  LayoutTemplate, 
  ChevronDown, 
  Check,
  Utensils,
  Layers,
  Calendar
} from 'lucide-react';
import { User, UserRole, Restaurant } from '../types';

interface RoleHeaderProps {
  currentUser: User;
  onLogout: () => void;
  restaurant?: Restaurant;
  restaurants?: Restaurant[];
  selectedRestaurantId?: string;
  onSelectRestaurant?: (id: string) => void;
  onOpenCustomerPreview?: (targetRestaurant?: Restaurant) => void;
  onOpenTemplateSplitEditor?: () => void;
  onOpenProfileSettings?: () => void;
  activeOwnerSubTab?: string;
  onSelectOwnerSubTab?: (tabId: string) => void;
  tablesCount?: number;
  shiftsCount?: number;
  kitchenCount?: number;
  waitersCount?: number;
  ridersCount?: number;
}

export const RoleHeader: React.FC<RoleHeaderProps> = ({
  currentUser,
  onLogout,
  restaurant,
  restaurants = [],
  selectedRestaurantId,
  onSelectRestaurant,
  onOpenCustomerPreview,
  onOpenTemplateSplitEditor,
  onOpenProfileSettings,
  activeOwnerSubTab,
  onSelectOwnerSubTab,
  tablesCount,
  shiftsCount,
  kitchenCount,
  waitersCount,
  ridersCount,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleBadgeConfig: Record<UserRole, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
    ADMIN: { label: 'Administrador', icon: Shield, color: 'bg-black text-white font-bold' },
    OWNER: { label: 'Dueño / Propietario', icon: Building2, color: 'bg-neutral-800 text-white font-bold' },
    RESTAURANT_MANAGER: { label: 'Gerente de Local', icon: Building2, color: 'bg-neutral-700 text-white font-bold' },
    KITCHEN: { label: 'Cocina (KDS)', icon: Flame, color: 'bg-neutral-800 text-neutral-100 font-bold' },
    WAITER: { label: 'Mesero / Salón', icon: ChefHat, color: 'bg-neutral-700 text-neutral-100 font-bold' },
    DELIVERY: { label: 'Repartidor', icon: Bike, color: 'bg-neutral-600 text-neutral-100 font-bold' },
    CUSTOMER: { label: 'Comensal', icon: UserCheck, color: 'bg-neutral-200 text-neutral-900 font-bold' },
  };

  const badge = roleBadgeConfig[currentUser.role] || roleBadgeConfig.CUSTOMER;
  const RoleIcon = badge.icon;

  const isOwnerOrManager = currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER';

  // Filter owned restaurants for owner/manager
  const ownedRestaurants = (restaurants || []).filter(r => {
    if (!r) return false;
    if (currentUser.role === 'ADMIN') return true;
    const isAssigned = Array.isArray(currentUser.restaurantIds) && (
      currentUser.restaurantIds.includes(r.id) || currentUser.restaurantIds.includes('all')
    );
    const isCreator = Boolean(
      r.ownerId && (r.ownerId === currentUser.id || (currentUser.email && r.ownerId === currentUser.email))
    );
    return isAssigned || isCreator;
  });

  const activeRest = (selectedRestaurantId && ownedRestaurants.find(r => r.id === selectedRestaurantId)) 
    || ownedRestaurants[0] 
    || restaurant;

  const brandCardBg = activeRest?.branding?.cardBgColor || activeRest?.branding?.darkBgColor || '#12111A';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Left Section: Owner Dropdown or Brand Logo */}
          <div className="flex items-center gap-2.5">
            {isOwnerOrManager && activeRest ? (
              <div className="flex items-center gap-2">
                {ownedRestaurants.length > 1 ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 transition cursor-pointer shadow-sm"
                    >
                      <div 
                        className="w-7 h-7 rounded-lg object-cover flex items-center justify-center overflow-hidden border border-neutral-300 shrink-0 shadow-inner"
                        style={{ backgroundColor: brandCardBg }}
                      >
                        {activeRest.logoUrl ? (
                          <img 
                            src={activeRest.logoUrl} 
                            alt={activeRest.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Building2 className="w-4 h-4 text-white" />
                        )}
                      </div>

                      <div className="text-left leading-tight">
                        <div className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                          <span className="truncate max-w-[140px] sm:max-w-[180px]">{activeRest.name}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <span className="text-[10px] text-neutral-500 block">Gestionando Sede</span>
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-neutral-200 shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95">
                        <div className="px-3 py-2 border-b border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Mis Restaurantes ({ownedRestaurants.length})
                        </div>
                        {ownedRestaurants.map(r => {
                          const isSelected = r.id === activeRest.id;
                          const rBg = r.branding?.cardBgColor || r.branding?.darkBgColor || '#12111A';
                          return (
                            <button
                              key={r.id}
                              onClick={() => {
                                if (onSelectRestaurant) onSelectRestaurant(r.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-neutral-50 transition cursor-pointer ${
                                isSelected ? 'bg-neutral-100/80 font-bold' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div 
                                  className="w-7 h-7 rounded-lg object-cover flex items-center justify-center overflow-hidden border border-neutral-200 shrink-0 shadow-sm"
                                  style={{ backgroundColor: rBg }}
                                >
                                  {r.logoUrl ? (
                                    <img src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Building2 className="w-3.5 h-3.5 text-white" />
                                  )}
                                </div>
                                <div className="truncate">
                                  <div className="text-xs font-bold text-neutral-900 truncate">{r.name}</div>
                                  <div className="text-[10px] text-neutral-500 truncate">{r.tagline || 'Restaurante'}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-neutral-900 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-neutral-300 shadow-sm">
                    <div 
                      className="w-7 h-7 rounded-lg object-cover flex items-center justify-center overflow-hidden border border-neutral-300 shrink-0"
                      style={{ backgroundColor: brandCardBg }}
                    >
                      {activeRest.logoUrl ? (
                        <img src={activeRest.logoUrl} alt={activeRest.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="text-left leading-tight">
                      <div className="text-xs font-black text-neutral-900 truncate max-w-[150px] sm:max-w-[200px]">
                        {activeRest.name}
                      </div>
                      <span className="text-[10px] text-neutral-500 block">Sede Activa</span>
                    </div>
                  </div>
                )}

                {/* Eye Button ("Ver Carta") next to the dropdown / badge */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCustomerPreview && activeRest) {
                      onOpenCustomerPreview(activeRest);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer shadow-sm"
                  title="Ver carta del restaurante activo (Probar como comensal)"
                >
                  <Eye className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">Ver Carta</span>
                </button>
              </div>
            ) : (
              /* Default Logo & Brand Info for non-owner views */
              <div className="flex items-center gap-3">
                <img 
                  src="/huevofrito.svg" 
                  alt="Micarta" 
                  className="w-9 h-9 object-contain border-0 shadow-none outline-none"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black tracking-widest text-neutral-950 uppercase">
                      Micarta
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color} flex items-center gap-1`}>
                      <RoleIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 block -mt-0.5">
                    {restaurant ? `${restaurant.name}` : 'Portal de Gestión Operativa'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Section: User Profile & Actions */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* User Profile Card - Clickable to open Profile / Account Settings */}
            <div 
              onClick={onOpenProfileSettings}
              role="button"
              tabIndex={0}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300 cursor-pointer transition select-none shadow-sm"
              title="Configuración de Cuenta"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-300 shrink-0"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-neutral-900 max-w-[130px] sm:max-w-[180px] truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-neutral-500 font-medium truncate leading-tight mt-0.5">
                  {badge.label}
                </div>
              </div>
            </div>

            {/* Logout Button (Icon only) */}
            <button
              id="role-header-btn-logout"
              onClick={onLogout}
              className="flex items-center justify-center p-2 rounded-xl border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer shadow-sm"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 text-neutral-700" />
            </button>

          </div>

        </div>
      </div>

      {/* Subtab Navigation Bar Attached Directly to the Header (Equidistante en todo el ancho) */}
      {isOwnerOrManager && onSelectOwnerSubTab && (() => {
        const filteredTabs = [
          { id: 'sales_monitor', label: 'Ventas', icon: Eye },
          { id: 'dishes', label: 'Carta', icon: Utensils },
          { id: 'tables', label: `Mesas (${tablesCount ?? 6})`, icon: Layers },
          { id: 'schedules', label: 'Horarios', icon: Clock },
          { id: 'shifts', label: `Turnos (${shiftsCount ?? 4})`, icon: Calendar },
          { id: 'kitchen', label: `Cocina (${kitchenCount ?? 1})`, icon: Flame },
          { id: 'waiters', label: `Mozos (${waitersCount ?? 1})`, icon: ChefHat },
          { id: 'delivery', label: `Riders (${ridersCount ?? 1})`, icon: Bike },
          { id: 'customers', label: 'Clientes', icon: UserCheck },
          { id: 'templates', label: 'Plantillas', icon: LayoutTemplate },
        ].filter(tab => {
          if (tab.id === 'templates' && (currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER')) {
            return false;
          }
          return true;
        });

        return (
          <div className="border-t border-neutral-200/80 bg-white w-full">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-1.5">
              <div 
                className="w-full grid gap-1 sm:gap-1.5 items-center justify-between"
                style={{ gridTemplateColumns: `repeat(${filteredTabs.length}, minmax(0, 1fr))` }}
              >
                {filteredTabs.map(tab => {
                  const isActive = activeOwnerSubTab === tab.id;
                  const IconComp = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onSelectOwnerSubTab(tab.id)}
                      title={tab.label}
                      aria-label={tab.label}
                      className={`w-full py-2 px-1 sm:px-1.5 lg:px-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs text-center ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                          : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent'
                      }`}
                    >
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span className="hidden xl:inline truncate whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </header>
  );
};
