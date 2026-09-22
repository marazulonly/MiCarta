import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Building2, 
  ChefHat, 
  Bike, 
  UserCheck, 
  Flame,
  CheckCircle2,
  Sparkles,
  Phone
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [dniInput, setDniInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanDni = dniInput.trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      setErrorMessage('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    const matchedUser = users.find(u => u.dni === cleanDni);
    if (!matchedUser) {
      setErrorMessage(`No existe ningún usuario registrado con el DNI ${cleanDni}. Verifica los accesos de prueba abajo.`);
      return;
    }

    const validPasswords = [
      matchedUser.password || '12345678',
      '12345678',
      'password',
      'admin123'
    ];

    if (passwordInput && !validPasswords.includes(passwordInput.trim())) {
      setErrorMessage('Contraseña incorrecta. (Puedes ingresar "12345678" o "password").');
      return;
    }

    onLogin(matchedUser);
  };

  const handleQuickLogin = (user: User) => {
    setDniInput(user.dni);
    setPasswordInput(user.password || '12345678');
    setErrorMessage(null);
    onLogin(user);
  };

  const handleFillCredentials = (user: User) => {
    setDniInput(user.dni);
    setPasswordInput(user.password || '12345678');
    setErrorMessage(null);
  };

  const herlyAdmin = users.find(u => u.dni === '00448157') || users[0];

  const roleMeta: Record<UserRole, { label: string; icon: React.FC<{ className?: string }>; badgeColor: string; roleDesc: string }> = {
    ADMIN: { 
      label: 'Administrador SaaS', 
      icon: Shield, 
      badgeColor: 'bg-white text-black font-bold',
      roleDesc: 'Vista global completa: Locales, Métricas, Usuarios, Pedidos, Arquitectura y Simulación PC.'
    },
    OWNER: { 
      label: 'Dueño / Propietario', 
      icon: Building2, 
      badgeColor: 'bg-amber-400 text-black font-bold',
      roleDesc: 'Panel de Dueño: Gestión de cartas, mesas QR, turnos, horarios y permisos de personal.'
    },
    RESTAURANT_MANAGER: { 
      label: 'Gerente de Local', 
      icon: Building2, 
      badgeColor: 'bg-emerald-400 text-black font-bold',
      roleDesc: 'Administración operativa de mesas, stock y despacho en salón.'
    },
    KITCHEN: { 
      label: 'Cocina / KDS', 
      icon: Flame, 
      badgeColor: 'bg-orange-500 text-white font-bold',
      roleDesc: 'Pantalla KDS táctil: Comanderas, tiempos de cocción, pase y control de agotados (Lista 86).'
    },
    WAITER: { 
      label: 'Mesero / Salón', 
      icon: ChefHat, 
      badgeColor: 'bg-sky-400 text-black font-bold',
      roleDesc: 'Atención de mesas, apertura de cuentas, toma de pedidos y comanda directa.'
    },
    DELIVERY: { 
      label: 'Repartidor / Motorizado', 
      icon: Bike, 
      badgeColor: 'bg-purple-400 text-black font-bold',
      roleDesc: 'Despacho de pedidos a domicilio, liquidación de efectivo y rutas de entrega.'
    },
    CUSTOMER: { 
      label: 'Cliente / Comensal', 
      icon: UserCheck, 
      badgeColor: 'bg-neutral-200 text-black font-bold',
      roleDesc: 'Portal comensal: Carta digital con QR, pedidos al mozo y seguimiento en vivo.'
    },
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      
      {/* Top Brand Bar */}
      <header className="w-full border-b border-neutral-900 bg-neutral-950/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-base shadow">
              MC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest text-white uppercase">
                  Micarta
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 text-amber-400 border border-neutral-800 font-mono">
                  SaaS Gastronómico
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 block -mt-0.5">
                Portal de Acceso Multi-Rol Unificado
              </span>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-neutral-400 block">Seguridad & RBAC</span>
            <span className="text-[11px] font-mono text-emerald-400 font-medium">● 4 Restaurantes en Red</span>
          </div>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col items-center justify-center">
        
        <div className="w-full max-w-xl space-y-8">
          
          {/* Headline */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Autenticación Requerida</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Iniciar Sesión
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
              Ingresa con tu <strong>DNI</strong> y <strong>Contraseña</strong>. La vista se adaptará automáticamente a los privilegios de tu rol asignado.
            </p>
          </div>

          {/* Form Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl space-y-6">
            
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* DNI Input */}
              <div>
                <label className="text-xs font-bold text-neutral-200 block mb-1.5 flex items-center justify-between">
                  <span>Usuario / DNI (8 dígitos)</span>
                  <span className="text-neutral-500 font-normal text-[11px]">Obligatorio</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={dniInput}
                    onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 00448157"
                    className="w-full px-4 py-3 rounded-xl bg-black border border-neutral-700 text-white font-mono text-base tracking-widest focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition placeholder:text-neutral-600"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-mono">
                    {dniInput.length}/8
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="text-xs font-bold text-neutral-200 block mb-1.5 flex items-center justify-between">
                  <span>Contraseña de Acceso</span>
                  <span className="text-neutral-500 font-normal text-[11px]">Universal: 12345678 o password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-black border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition placeholder:text-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-black text-sm hover:bg-neutral-200 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] mt-2"
              >
                <span>Acceder a Mi Cuenta</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-neutral-900 text-center">
              <span className="text-[11px] text-neutral-500">
                Al ingresar como <strong>Administrador</strong> tendrás acceso a la vista general SaaS y al simulador para PC.
              </span>
            </div>

          </div>

          {/* Featured Administrator Highlight: Herly Lizarazo */}
          {herlyAdmin && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={herlyAdmin.avatar}
                  alt={herlyAdmin.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{herlyAdmin.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-black font-black">
                      ADMINISTRADOR
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-emerald-400 font-mono">
                      Oficial
                    </span>
                  </div>
                  <div className="text-xs text-neutral-300 font-mono mt-0.5 flex items-center gap-3 flex-wrap">
                    <span>DNI: <strong className="text-white font-bold">{herlyAdmin.dni}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <strong>{herlyAdmin.phone || '952341165'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleFillCredentials(herlyAdmin)}
                  className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 cursor-pointer transition"
                >
                  Rellenar
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin(herlyAdmin)}
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-black cursor-pointer transition shadow flex items-center gap-1.5"
                >
                  <span>Entrar como Admin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Demo Switchers for Other Roles */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>O prueba directamente con otros roles registrados:</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                1 clic para entrar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {users
                .filter(u => u.dni !== '00448157') // don't repeat Herly since he's featured above
                .slice(0, 6)
                .map(user => {
                  const meta = roleMeta[user.role] || roleMeta.CUSTOMER;
                  const IconComp = meta.icon;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/70 transition flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 rounded-xl object-cover border border-neutral-800 shrink-0 group-hover:border-neutral-600"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate max-w-[130px]">{user.name}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${meta.badgeColor}`}>
                              {user.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                            DNI: <strong className="text-neutral-200">{user.dni}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-neutral-700 shrink-0 ml-2">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 bg-neutral-950/40 py-4 px-6 text-center text-xs text-neutral-500">
        MiCarta SaaS Gastronómico • Roles: Administrador, Dueño, Gerente, Cocina KDS, Mesero, Repartidor, Cliente
      </footer>

    </div>
  );
};
