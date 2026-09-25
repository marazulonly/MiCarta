import React from 'react';
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
  LayoutTemplate
} from 'lucide-react';
import { User, UserRole, Restaurant } from '../types';

interface RoleHeaderProps {
  currentUser: User;
  onLogout: () => void;
  onOpenLoginModal?: () => void;
  restaurant?: Restaurant;
  onOpenCustomerPreview?: () => void;
  onOpenTemplateSplitEditor?: () => void;
}

export const RoleHeader: React.FC<RoleHeaderProps> = ({
  currentUser,
  onLogout,
  onOpenLoginModal,
  restaurant,
  onOpenCustomerPreview,
  onOpenTemplateSplitEditor,
}) => {
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

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Brand & Role info */}
          <div className="flex items-center gap-3">
            <img 
              src="/huevofrito.png" 
              alt="Micarta" 
              className="w-9 h-9 object-contain"
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

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">

            {/* User Profile Card */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-300">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-300 shrink-0"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-neutral-900 max-w-[130px] sm:max-w-[170px] truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-neutral-600 font-mono flex items-center gap-1.5">
                  <span>DNI: <strong className="text-neutral-900">{currentUser.dni}</strong></span>
                  {currentUser.phone && (
                    <span className="hidden md:inline text-neutral-500">• {currentUser.phone}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="role-header-btn-logout"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition cursor-pointer"
              title="Cerrar Sesión y volver a la pantalla de ingreso"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-700" />
              <span>Cerrar Sesión</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
