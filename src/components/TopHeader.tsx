import React from 'react';
import { 
  Building2, 
  Shield, 
  Database,
  ExternalLink,
  LogIn,
  KeyRound,
  Sparkles,
  User as UserIcon,
  LogOut,
  Check,
  SlidersHorizontal,
  Eye,
  LayoutTemplate
} from 'lucide-react';
import { Restaurant, UserRole, TabType, User } from '../types';

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
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  isSimulationActive?: boolean;
  onToggleSimulation?: (active: boolean) => void;
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
  onOpenLoginModal,
  onLogout,
  isSimulationActive = false,
  onToggleSimulation,
}) => {
  const currentRestaurant = restaurants.find(r => r.id === selectedRestaurantId) || restaurants[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1E1F24] text-white flex items-center justify-center font-black text-sm tracking-tighter">
              MC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest text-[#1E1F24] uppercase">
                  Micarta
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200 font-mono">
                  SaaS v2.5
                </span>
              </div>
              <div className="flex items-center gap-2 -mt-0.5 flex-wrap">
                <span className="text-[11px] text-neutral-500">
                  4 Restaurantes Conectados
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-sync Nube (Incógnito listo) ✓
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E1F24] hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer shadow-md"
                title="Diseñar plantillas, colores y tarjetas en tiempo real"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Editor Pantalla Dividida</span>
                <span className="sm:hidden">Editor</span>
              </button>
            )}

            {/* Quick Preview Button */}
            {onOpenCustomerPreview && (
              <button
                type="button"
                onClick={onOpenCustomerPreview}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-700 hover:text-neutral-900 text-xs font-bold transition cursor-pointer"
                title="Previsualizar Carta Digital"
              >
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Previsualizar Carta</span>
              </button>
            )}
            
            {/* Top Corner "Simulación" Check Toggle */}
            {onToggleSimulation && (
              <label
                id="header-check-simulation"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer select-none ${
                  isSimulationActive
                    ? 'bg-[#1E1F24] text-white border-neutral-800 shadow-md'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:text-neutral-900'
                }`}
                title="Activar vista de simulación sincronizada en 3 pantallas móviles (PC)"
              >
                <input
                  type="checkbox"
                  checked={isSimulationActive}
                  onChange={(e) => onToggleSimulation(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1E1F24] focus:ring-0 accent-[#1E1F24] cursor-pointer"
                />
                <Sparkles className={`w-3.5 h-3.5 ${isSimulationActive ? 'text-white fill-white' : 'text-amber-500'}`} />
                <span>Simulación</span>
              </label>
            )}

            {/* Restaurant Selector */}
            <div className="relative hidden md:flex items-center bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 hover:border-neutral-300 transition">
              <Building2 className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
              <select
                id="restaurant-selector"
                value={selectedRestaurantId}
                onChange={(e) => onSelectRestaurant(e.target.value)}
                className="bg-transparent text-xs text-neutral-700 font-medium focus:outline-none cursor-pointer pr-3"
              >
                <option value="all" className="bg-white text-neutral-800">Todos los Locales</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id} className="bg-white text-neutral-800">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="relative hidden lg:flex items-center bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 hover:border-neutral-300 transition">
              <Shield className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
              <select
                id="role-simulator-selector"
                value={activeRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-xs text-neutral-700 font-medium focus:outline-none cursor-pointer pr-3"
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
              onClick={onOpenLoginModal}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 transition cursor-pointer text-neutral-700 shadow-sm"
              title="Cambiar Usuario o Ver Credenciales"
            >
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-neutral-200"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-800 max-w-[90px] sm:max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1E1F24] text-white">
                      DNI: {currentUser.dni}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-neutral-600">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ingresar (DNI)</span>
                </div>
              )}
            </button>

            {/* Logout Button */}
            {currentUser && onLogout && (
              <button
                id="header-btn-logout"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                title="Cerrar Sesión y Regresar al Login"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}

            {/* DB & Prisma Technical Deliverable */}
            <button
              id="header-btn-architecture"
              onClick={() => onTabChange(activeTab === 'architecture' ? 'home' : 'architecture')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border transition cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Esquema DB</span>
            </button>

            {/* Customer Digital Menu Preview */}
            <button
              id="header-btn-preview-menu"
              onClick={onOpenCustomerPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold bg-white text-black hover:bg-neutral-200 transition cursor-pointer shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Carta Digital</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
