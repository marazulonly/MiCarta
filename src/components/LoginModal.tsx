import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  User as UserIcon, 
  Shield, 
  Building2, 
  ChefHat, 
  Bike, 
  UserCheck, 
  ArrowRight, 
  X, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [dniInput, setDniInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanDni = dniInput.trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      setErrorMessage('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    const matchedUser = users.find(u => u.dni === cleanDni);
    if (!matchedUser) {
      setErrorMessage(`No existe ningún usuario registrado con el DNI ${cleanDni}.`);
      return;
    }

    const expectedPassword = matchedUser.password || '12345678';
    if (passwordInput !== expectedPassword) {
      setErrorMessage('Clave de acceso incorrecta. (Para la simulación la clave es "12345678").');
      return;
    }

    onLogin(matchedUser);
    onClose();
  };

  const handleQuickLogin = (user: User) => {
    setDniInput(user.dni);
    setPasswordInput(user.password || '12345678');
    setErrorMessage(null);
    onLogin(user);
    onClose();
  };

  const roleBadges: Record<UserRole, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
    ADMIN: { label: 'Administrador', icon: Shield, color: 'bg-white text-black' },
    OWNER: { label: 'Dueño', icon: Building2, color: 'bg-amber-400 text-black' },
    RESTAURANT_MANAGER: { label: 'Gerente', icon: Building2, color: 'bg-emerald-400 text-black' },
    KITCHEN: { label: 'Cocina (KDS)', icon: Flame, color: 'bg-orange-500 text-white' },
    WAITER: { label: 'Mesero', icon: ChefHat, color: 'bg-sky-400 text-black' },
    DELIVERY: { label: 'Repartidor', icon: Bike, color: 'bg-purple-400 text-black' },
    CUSTOMER: { label: 'Cliente', icon: UserCheck, color: 'bg-neutral-200 text-black' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 w-full max-w-2xl rounded-2xl p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
              Autenticación de Acceso
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Ingreso con DNI y Clave de Acceso
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Cada usuario ingresa con su DNI único de 8 dígitos y clave. Para la simulación, la clave universal es <strong className="text-white font-mono">12345678</strong>.
          </p>
        </div>

        {/* Currently Logged-in Banner */}
        {currentUser && (
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-neutral-700"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{currentUser.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-bold">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  DNI: <strong className="text-neutral-200">{currentUser.dni}</strong> • {currentUser.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onLogout();
              }}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs text-red-400 hover:text-red-300 hover:bg-neutral-800 font-medium cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        {/* Real Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800/80">
          <div className="text-xs font-bold text-neutral-200 flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-white" />
            <span>Formulario de Inicio de Sesión</span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                DNI (8 dígitos numéricos) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={8}
                  pattern="\d{8}"
                  placeholder="Ej: 10203040"
                  value={dniInput}
                  onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-white"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Ingresa el DNI registrado
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Clave de Acceso <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 pr-9 rounded-lg bg-black border border-neutral-700 text-xs text-white font-mono focus:outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Simulación: 12345678
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer flex items-center gap-2"
            >
              <span>Ingresar al Sistema</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Test Switcher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">
              Acceso Rápido por Rol (Simulación de 1 Clic)
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              Haz clic para entrar de inmediato
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {users.slice(0, 8).map(user => {
              const badge = roleBadges[user.role] || roleBadges.CUSTOMER;
              const IconComp = badge.icon;
              const isSelected = currentUser?.id === user.id;

              return (
                <button
                  key={user.id}
                  onClick={() => handleQuickLogin(user)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800 border-white text-white'
                      : 'bg-black/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-neutral-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">{user.name}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${badge.color}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        DNI: <strong className="text-white">{user.dni}</strong> • Clave: 12345678
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
