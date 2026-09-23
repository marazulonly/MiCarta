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
  RefreshCw,
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
  onSyncFirebase?: () => void;
  isSyncingFirebase?: boolean;
}

export const RoleHeader: React.FC<RoleHeaderProps> = ({
  currentUser,
  onLogout,
  onOpenLoginModal,
  restaurant,
  onOpenCustomerPreview,
  onOpenTemplateSplitEditor,
  onSyncFirebase,
  isSyncingFirebase = false,
}) => {
  const roleBadgeConfig: Record<UserRole, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
    ADMIN: { label: 'Administrador', icon: Shield, color: 'bg-white text-black font-bold' },
    OWNER: { label: 'Dueño / Propietario', icon: Building2, color: 'bg-amber-400 text-black font-bold' },
    RESTAURANT_MANAGER: { label: 'Gerente de Local', icon: Building2, color: 'bg-emerald-400 text-black font-bold' },
    KITCHEN: { label: 'Cocina (KDS)', icon: Flame, color: 'bg-orange-500 text-white font-bold' },
    WAITER: { label: 'Mesero / Salón', icon: ChefHat, color: 'bg-sky-400 text-black font-bold' },
    DELIVERY: { label: 'Repartidor', icon: Bike, color: 'bg-purple-400 text-black font-bold' },
    CUSTOMER: { label: 'Comensal', icon: UserCheck, color: 'bg-neutral-200 text-black font-bold' },
  };

  const badge = roleBadgeConfig[currentUser.role] || roleBadgeConfig.CUSTOMER;
  const RoleIcon = badge.icon;

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Brand & Role info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm shadow">
              MC
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black tracking-widest text-white uppercase">
                  Micarta
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color} flex items-center gap-1`}>
                  <RoleIcon className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 block -mt-0.5">
                {restaurant ? `${restaurant.name}` : 'Portal de Gestión Operativa'}
              </span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Split-Screen Template Editor Button */}
            {(currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER') && onOpenTemplateSplitEditor && (
              <button
                type="button"
                onClick={onOpenTemplateSplitEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold bg-amber-400 hover:bg-amber-300 text-black transition cursor-pointer shadow-lg shadow-amber-400/20"
                title="Abrir Diseñador de Plantillas en Pantalla Dividida (Split-Screen)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Editor Pantalla Dividida</span>
              </button>
            )}

            {/* Customer preview button */}
            {(currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'RESTAURANT_MANAGER') && onOpenCustomerPreview && (
              <button
                type="button"
                onClick={onOpenCustomerPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold bg-white text-black hover:bg-neutral-200 transition cursor-pointer shadow"
                title="Previsualizar la carta digital de esta sede"
              >
                <Eye className="w-3.5 h-3.5 text-black" />
                <span>Previsualizar Carta</span>
              </button>
            )}

            {/* Sync from Firebase */}
            {onSyncFirebase && (
              <button
                onClick={onSyncFirebase}
                disabled={isSyncingFirebase}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-200 hover:text-white transition cursor-pointer shadow disabled:opacity-50"
                title="Recuperar y sincronizar platos desde Firebase Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirebase ? 'animate-spin text-amber-400' : 'text-neutral-400'}`} />
                <span>{isSyncingFirebase ? 'Recuperando...' : 'Recuperar Firebase'}</span>
              </button>
            )}

            {/* User Profile Card */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-700 shrink-0"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-white max-w-[130px] sm:max-w-[170px] truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5">
                  <span>DNI: <strong className="text-neutral-200">{currentUser.dni}</strong></span>
                  {currentUser.phone && (
                    <span className="hidden md:inline text-neutral-500">• {currentUser.phone}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Change User */}
            {onOpenLoginModal && (
              <button
                onClick={onOpenLoginModal}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 transition cursor-pointer"
                title="Cambiar a otro rol"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Cambiar</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              id="role-header-btn-logout"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/60 bg-red-950/40 hover:bg-red-900/60 hover:border-red-600 text-red-300 text-xs font-medium transition cursor-pointer"
              title="Cerrar Sesión y volver a la pantalla de ingreso"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
