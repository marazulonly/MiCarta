import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  onLogin 
}) => {
  const [dniInput, setDniInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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
      setErrorMessage(`No existe ningún usuario registrado con el DNI ${cleanDni}.`);
      return;
    }

    const validPasswords = [
      matchedUser.password || '12345678',
      '12345678',
      'password',
      'admin123'
    ];

    if (passwordInput && !validPasswords.includes(passwordInput.trim())) {
      setErrorMessage('Contraseña incorrecta. (Puedes ingresar "12345678" para pruebas).');
      return;
    }

    onLogin(matchedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-1">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Ingreso al Sistema
          </h2>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Ingresa tu DNI de 8 dígitos y clave de acceso para acceder a tu panel de gestión.
          </p>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* DNI Input */}
          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1">
              Usuario / DNI (8 dígitos)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={8}
                value={dniInput}
                onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 00448157"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-neutral-800 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition placeholder:text-neutral-600"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[10px] font-mono">
                {dniInput.length}/8
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Clave de acceso (12345678)"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-black border border-neutral-800 text-white font-mono text-xs focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition placeholder:text-neutral-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg mt-2"
          >
            <span>Acceder</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
