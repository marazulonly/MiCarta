import React, { useState, useRef } from 'react';
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
  Phone,
  QrCode,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Download,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { User, UserRole, Restaurant } from '../types';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  restaurants?: Restaurant[];
  onOpenCustomerPreview?: (restaurant: Restaurant, mode?: 'DINE_IN' | 'DELIVERY', tableNumber?: string) => void;
  onOpenTemplateSplitEditor?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  users, 
  onLogin,
  restaurants = [],
  onOpenCustomerPreview,
  onOpenTemplateSplitEditor
}) => {
  const [dniInput, setDniInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real QR anonymous testing modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedRestForQr, setSelectedRestForQr] = useState<Restaurant | undefined>(restaurants[0]);
  const [selectedTableNum, setSelectedTableNum] = useState<string>('01');
  const [selectedChannel, setSelectedChannel] = useState<'DINE_IN' | 'DELIVERY'>('DINE_IN');
  const [copiedLink, setCopiedLink] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const activeRest = selectedRestForQr || restaurants[0];
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://micarta.io';
  const qrUrl = activeRest 
    ? `${origin}/?r=${activeRest.slug}&mesa=${selectedTableNum}&mode=${selectedChannel}`
    : `${origin}/?r=cevichito-pliz&mesa=01&mode=DINE_IN`;

  const handleCopyQrLink = () => {
    navigator.clipboard?.writeText(qrUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQrPng = () => {
    if (!qrRef.current || !activeRest) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 600;
    canvas.height = 600;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 500, 500);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_${activeRest.slug}_Mesa_${selectedTableNum}.png`;
        downloadLink.href = pngUrl;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

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
      badgeColor: 'bg-neutral-900 text-white font-bold',
      roleDesc: 'Vista global completa: Locales, Métricas, Usuarios, Pedidos, Arquitectura y Simulación PC.'
    },
    OWNER: { 
      label: 'Dueño / Propietario', 
      icon: Building2, 
      badgeColor: 'bg-neutral-800 text-white font-bold',
      roleDesc: 'Panel de Dueño: Gestión de cartas, mesas QR, turnos, horarios y permisos de personal.'
    },
    RESTAURANT_MANAGER: { 
      label: 'Gerente de Local', 
      icon: Building2, 
      badgeColor: 'bg-neutral-700 text-white font-bold',
      roleDesc: 'Administración operativa de mesas, stock y despacho en salón.'
    },
    KITCHEN: { 
      label: 'Cocina / KDS', 
      icon: Flame, 
      badgeColor: 'bg-neutral-600 text-white font-bold',
      roleDesc: 'Pantalla KDS táctil: Comanderas, tiempos de cocción, pase y control de agotados (Lista 86).'
    },
    WAITER: { 
      label: 'Mesero / Salón', 
      icon: ChefHat, 
      badgeColor: 'bg-neutral-500 text-white font-bold',
      roleDesc: 'Atención de mesas, apertura de cuentas, toma de pedidos y comanda directa.'
    },
    DELIVERY: { 
      label: 'Repartidor / Motorizado', 
      icon: Bike, 
      badgeColor: 'bg-neutral-400 text-black font-bold',
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
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      
      {/* Top Brand Bar */}
      <header className="w-full border-b border-neutral-200/60 bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/huevofrito.png" 
              alt="Micarta" 
              className="w-9 h-9 object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block ml-2 border-l border-neutral-200 pl-3">
              <span className="text-xs text-neutral-500 block">Seguridad & RBAC</span>
              <span className="text-[11px] font-mono text-emerald-600 font-bold">● 4 Restaurantes en Red</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col items-center justify-center">
        
        <div className="w-full max-w-xl space-y-8">
          
          {/* Headline */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1E1F24]">
              Iniciar Sesión
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
              Ingresa con tu <strong>DNI</strong> y <strong>Contraseña</strong>. La vista se adaptará automáticamente a los privilegios de tu rol asignado.
            </p>
          </div>

          {/* Form Card */}
          <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-neutral-200/50 shadow-[0_12px_40px_rgba(0,0,0,0.06)] space-y-6">
            
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* DNI Input */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5 flex items-center justify-between">
                  <span>Usuario / DNI (8 dígitos)</span>
                  <span className="text-neutral-400 font-normal text-[11px]">Obligatorio</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={dniInput}
                    onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 00448157"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 font-mono text-base tracking-widest focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition placeholder:text-neutral-400"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-mono">
                    {dniInput.length}/8
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5 flex items-center justify-between">
                  <span>Contraseña de Acceso</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 font-mono text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-[#1E1F24] hover:bg-neutral-800 text-white font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] mt-2"
              >
                <span>Acceder</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </form>

            <div className="pt-4 border-t border-neutral-100 flex flex-col items-center gap-2">
              <p className="text-[11px] text-neutral-400 text-center">
                ¿Problemas con datos o sesiones antiguas guardadas en tu navegador?
              </p>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="text-[11px] text-red-500 hover:text-red-700 font-bold underline transition cursor-pointer"
              >
                Limpiar todo el Caché y Reiniciar Aplicación
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* Real QR Modal from Login Screen */}
      {isQrModalOpen && activeRest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-3xl p-6 text-center space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-white flex items-center justify-center mx-auto shadow-lg">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Códigos QR Reales para Comensales</span>
              </div>
              <h3 className="text-base font-black text-white">
                Probar Pedidos Anónimos
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Selecciona un restaurante y escanea con tu celular para abrir la carta sin registrarte.
              </p>
            </div>

            {/* Restaurant Selector Tabs */}
            {restaurants.length > 0 && (
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold text-neutral-400">Seleccionar Restaurante:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {restaurants.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRestForQr(r)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                        activeRest?.id === r.id
                          ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <img src={r.logoUrl} alt={r.name} className="w-6 h-6 rounded-lg object-cover" />
                      <span className="truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Table or Delivery Selection */}
            <div className="p-3 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-300">Mesa de Prueba:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('DINE_IN')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedChannel === 'DINE_IN' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    🍽️ Salón
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('DELIVERY')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedChannel === 'DELIVERY' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    🛵 Delivery
                  </button>
                </div>
              </div>

              {selectedChannel === 'DINE_IN' && (
                <div className="grid grid-cols-6 gap-1.5 pt-1">
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedTableNum(num)}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        selectedTableNum === num
                          ? 'bg-neutral-200 text-black shadow'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      M{num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Real QR Vector */}
            <div ref={qrRef} className="p-4 bg-white rounded-2xl inline-block shadow-2xl border border-neutral-200 mx-auto">
              <QRCodeSVG
                value={qrUrl}
                size={180}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: activeRest?.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=64&q=80",
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-neutral-400" />
                <span>
                  {(activeRest?.name || '')} • {selectedChannel === 'DINE_IN' ? `Mesa ${selectedTableNum}` : 'Delivery'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Apunta con la cámara de tu celular real para abrir la carta y enviar pedidos a cocina.
              </p>
            </div>

            <div className="p-2 rounded-xl bg-black/60 border border-neutral-800 text-[10px] font-mono text-neutral-400 truncate text-center">
              {qrUrl}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              {onOpenCustomerPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQrModalOpen(false);
                    onOpenCustomerPreview(activeRest, selectedChannel, selectedTableNum);
                  }}
                  className="w-full py-3 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-black text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-neutral-950/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Probar Carta y Pedido en esta Pantalla</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyQrLink}
                  className="py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-neutral-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                  <span>{copiedLink ? '¡Copiado!' : 'Copiar URL'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Bajar QR PNG</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 bg-neutral-950/40 py-4 px-6 text-center text-xs text-neutral-500">
        MiCarta 2026
      </footer>

    </div>
  );
};
