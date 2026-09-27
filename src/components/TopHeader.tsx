import React from 'react';
import { 
  Building2, 
  Shield, 
  KeyRound,
  Sparkles,
  LogOut,
  SlidersHorizontal,
  Settings
} from 'lucide-react';
import { Restaurant, UserRole, TabType, User } from '../types';
import { getSafeActiveRestaurant } from '../utils/restaurantUtils';

interface TopHeaderProps {
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  onSelectRestaurant: (id: string) => void;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenCustomerPreview: () => void;
  onOpenTemplateSplitEditor?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  isSimulationActive?: boolean;
  onToggleSimulation?: (active: boolean) => void;
  onOpenProfileSettings?: () => void;
  onOpenLoginModal?: () => void;
}

const ROLES_LIST: { role: UserRole; label: string }[] = [
  { role: 'ADMIN', label: '1. Administrador' },
  { role: 'OWNER', label: '2. Dueño' },
  { role: 'RESTAURANT_MANAGER', label: '3. Restaurante' },
  { role: 'KITCHEN', label: '4. Cocina (KDS)' },
  { role: 'WAITER', label: '5. Mesero' },
  { role: 'DELIVERY', label: '6. Repartidor' },
  { role: 'CUSTOMER', label: '7. Cliente' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  activeRole,
  onRoleChange,
  activeTab,
  onTabChange,
  onOpenCustomerPreview,
  onOpenTemplateSplitEditor,
  currentUser,
  onLogout,
  isSimulationActive = false,
  onToggleSimulation,
  onOpenProfileSettings,
  onOpenLoginModal,
}) => {
  const currentRestaurant = getSafeActiveRestaurant(restaurants, selectedRestaurantId);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img 
              src="/huevofrito.png" 
              alt="Micarta" 
              className="w-8 h-8 object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest text-neutral-950 uppercase">
                  Micarta
                </span>
              </div>
              <div className="flex items-center gap-2 -mt-0.5 flex-wrap">
                <span className="text-[11px] text-neutral-500">
                  4 Restaurantes Conectados
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-neutral-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                  Auto-sync Nube ✓
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
            
            {/* Split-Screen Template Editor Trigger Button */}
            {onOpenTemplateSplitEditor && (
              <button
                type="button"
                onClick={onOpenTemplateSplitEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer shadow-md"
                title="Diseñar plantillas, colores y tarjetas en tiempo real"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Editor Pantalla Dividida</span>
                <span className="sm:hidden">Editor</span>
              </button>
            )}
            
            {/* Top Corner "Simulación" Check Toggle */}
            {onToggleSimulation && (
              <label
                id="header-check-simulation"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer select-none ${
                  isSimulationActive
                    ? 'bg-black text-white border-black shadow-md'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:border-neutral-400 hover:text-black'
                }`}
                title="Activar vista de simulación sincronizada en 3 pantallas móviles (PC)"
              >
                <input
                  type="checkbox"
                  checked={isSimulationActive}
                  onChange={(e) => onToggleSimulation(e.target.checked)}
                  className="w-4 h-4 rounded text-black focus:ring-0 accent-black cursor-pointer"
                />
                <Sparkles className={`w-3.5 h-3.5 ${isSimulationActive ? 'text-white fill-white' : 'text-neutral-700'}`} />
                <span>Simulación</span>
              </label>
            )}

            {/* Restaurant Selector */}
            <div className="relative hidden md:flex items-center bg-neutral-100 border border-neutral-300 rounded-lg px-2.5 py-1.5 hover:border-neutral-400 transition">
              <Building2 className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
              <select
                id="restaurant-selector"
                value={selectedRestaurantId}
                onChange={(e) => onSelectRestaurant(e.target.value)}
                className="bg-transparent text-xs text-neutral-800 font-medium focus:outline-none cursor-pointer pr-3"
              >
                <option value="all" className="bg-white text-neutral-800">Todos los Locales</option>
                {(restaurants || []).map(r => r && r.id ? (
                  <option key={r.id} value={r.id} className="bg-white text-neutral-800">
                    {r.name}
                  </option>
                ) : null)}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="relative hidden lg:flex items-center bg-neutral-100 border border-neutral-300 rounded-lg px-2.5 py-1.5 hover:border-neutral-400 transition">
              <Shield className="w-3.5 h-3.5 text-neutral-500 mr-2 shrink-0" />
              <select
                id="role-simulator-selector"
                value={activeRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-xs text-neutral-800 font-medium focus:outline-none cursor-pointer pr-3"
              >
                {ROLES_LIST.map(r => (
                  <option key={r.role} value={r.role} className="bg-white text-neutral-800">
                    Rol: {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Login / Current User Profile Button */}
            <button
              id="header-btn-login-modal"
              onClick={currentUser ? onOpenProfileSettings : onOpenLoginModal}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer text-neutral-800 shadow-sm"
              title={currentUser ? "Configuración de Perfil (Editar datos y foto)" : "Ingresar con tu DNI"}
            >
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-neutral-300"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-900 max-w-[90px] sm:max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black text-white">
                      DNI: {currentUser.dni}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-neutral-700">
                  <KeyRound className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Ingresar (DNI)</span>
                </div>
              )}
            </button>

            {/* Profile Settings Gear Button */}
            {currentUser && onOpenProfileSettings && (
              <button
                id="header-btn-profile-settings"
                onClick={onOpenProfileSettings}
                className="flex items-center justify-center p-2 rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer shadow-sm"
                title="Configuración de Perfil (Editar datos y foto)"
              >
                <Settings className="w-4 h-4 text-neutral-700 animate-spin-slow" />
              </button>
            )}

            {/* Logout Button */}
            {currentUser && onLogout && (
              <button
                id="header-btn-logout"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition cursor-pointer"
                title="Cerrar Sesión y Regresar al Login"
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-700" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
