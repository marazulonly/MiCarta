import React, { useState, useEffect } from 'react';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Lock, 
  Settings, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Hash
} from 'lucide-react';
import { User } from '../types';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
}

// Helper to precisely format a base64 JPEG image to 72 DPI (editing JFIF segment)
export function formatJpegTo72Dpi(base64Str: string): string {
  const matches = base64Str.match(/^data:image\/jpeg;base64,(.*)$/);
  if (!matches) return base64Str;
  const pureBase64 = matches[1];
  
  const binaryStr = window.atob(pureBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  
  // JPEGSOI is always 0xFFD8
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    if (bytes[2] === 0xFF && bytes[3] === 0xE0) {
      // APP0 segment exists. Let's make sure the identifier is "JFIF\0"
      if (
        bytes[6] === 0x4A && // 'J'
        bytes[7] === 0x46 && // 'F'
        bytes[8] === 0x49 && // 'I'
        bytes[9] === 0x46 && // 'F'
        bytes[10] === 0x00   // '\0'
      ) {
        // Density unit byte is at index 13: 1 = dots per inch (DPI)
        bytes[13] = 1;
        
        // Horizontal density (X DPI) is 16-bit at index 14-15: 72 DPI (0x0048)
        bytes[14] = 0;
        bytes[15] = 72;
        
        // Vertical density (Y DPI) is 16-bit at index 16-17: 72 DPI (0x0048)
        bytes[16] = 0;
        bytes[17] = 72;
      }
    } else {
      // APP0 segment is missing, insert a standard 18-byte JFIF APP0 segment
      const jfifSegment = new Uint8Array([
        0xFF, 0xE0, // APP0 Marker
        0x00, 0x10, // Length of segment: 16 bytes
        0x4A, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
        0x01, 0x01, // Version 1.01
        0x01,       // Units: 1 = dots per inch (DPI)
        0x00, 0x48, // X density: 72 DPI
        0x00, 0x48, // Y density: 72 DPI
        0x00, 0x00  // Thumbnail dimensions
      ]);
      
      const newBytes = new Uint8Array(2 + jfifSegment.length + (bytes.length - 2));
      newBytes[0] = 0xFF;
      newBytes[1] = 0xD8;
      newBytes.set(jfifSegment, 2);
      newBytes.set(bytes.subarray(2), 2 + jfifSegment.length);
      
      let newBinaryStr = '';
      for (let i = 0; i < newBytes.length; i++) {
        newBinaryStr += String.fromCharCode(newBytes[i]);
      }
      return 'data:image/jpeg;base64,' + window.btoa(newBinaryStr);
    }
  }
  
  let newBinaryStr = '';
  for (let i = 0; i < bytes.length; i++) {
    newBinaryStr += String.fromCharCode(bytes[i]);
  }
  return 'data:image/jpeg;base64,' + window.btoa(newBinaryStr);
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setPassword(currentUser.password || '12345678');
      setDni(currentUser.dni || '');
      setAvatarPreview(currentUser.avatar || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          
          // Force EXACT 2:3 aspect ratio (e.g., standard 400x600 px)
          const targetWidth = 400;
          const targetHeight = 600;
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            const imgRatio = img.width / img.height;
            const targetRatio = 2 / 3;
            
            let sx = 0;
            let sy = 0;
            let sWidth = img.width;
            let sHeight = img.height;

            if (imgRatio > targetRatio) {
              // Image is wider than 2:3, crop sides
              sWidth = img.height * targetRatio;
              sx = (img.width - sWidth) / 2;
            } else if (imgRatio < targetRatio) {
              // Image is taller than 2:3, crop top and bottom
              sHeight = img.width / targetRatio;
              sy = (img.height - sHeight) / 2;
            }

            // Draw center-cropped image
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
            
            // Export as JPEG
            const base64Jpeg = canvas.toDataURL('image/jpeg', 0.9);
            
            // Format to 72 DPI explicitly in binary JFIF
            const formatted = formatJpegTo72Dpi(base64Jpeg);
            
            setAvatarPreview(formatted);
            setSuccessMsg('Foto cargada y formateada con éxito a formato 2:3 (72 DPI).');
          } else {
            setErrorMsg('No se pudo procesar la imagen.');
          }
        } catch (err: any) {
          setErrorMsg(`Error al formatear la imagen: ${err?.message || err}`);
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setErrorMsg('Error al cargar la imagen seleccionada.');
        setIsProcessingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('El nombre no puede estar vacío.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    // Optional phone validation
    if (phone.trim() && !/^\+?[\d\s-]{6,15}$/.test(phone)) {
      setErrorMsg('Por favor ingresa un número de teléfono válido.');
      return;
    }

    // Password validation
    if (!password || password.length < 4) {
      setErrorMsg('La clave de acceso debe tener al menos 4 caracteres.');
      return;
    }

    // Update user structure
    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password,
      avatar: avatarPreview || currentUser.avatar,
      lastActive: new Date().toISOString()
    };

    try {
      onUpdateUser(updatedUser);
      setSuccessMsg('¡Tus datos de perfil y foto 2:3 (72 DPI) han sido actualizados con éxito!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(`Error al guardar: ${err?.message || err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-950 border border-neutral-800 w-full max-w-2xl rounded-2xl p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-neutral-400 animate-spin-slow" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
              Configuración de Cuenta
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Editar Perfil de Usuario
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Modifica tus datos de acceso, información personal y actualiza tu foto de perfil de manera sincronizada.
          </p>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Photo Uploader with 2:3 Aspect Ratio and 72 DPI Requirement */}
            <div className="flex flex-col items-center justify-start space-y-4 md:border-r md:border-neutral-800 md:pr-6">
              <span className="text-xs font-bold text-neutral-300">Foto de Perfil</span>
              
              <div className="relative group">
                {/* 2:3 aspect ratio container (width: 140px, height: 210px) */}
                <div className="w-[140px] h-[210px] bg-neutral-900 border-2 border-neutral-700 rounded-xl overflow-hidden shadow-lg relative flex items-center justify-center transition group-hover:border-neutral-500">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center p-3">
                      <UserIcon className="w-10 h-10 text-neutral-500 mb-2" />
                      <span className="text-[10px] text-neutral-400">Sin foto</span>
                    </div>
                  )}
                  
                  {isProcessingImage && (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                      <span className="text-[10px] text-white font-mono animate-pulse">Procesando...</span>
                    </div>
                  )}
                </div>

                <label className="absolute -bottom-2 -right-2 p-2 bg-white text-black hover:bg-neutral-200 rounded-full cursor-pointer shadow-lg transition duration-200 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              <div className="text-center space-y-1">
                <div className="text-[11px] font-bold text-neutral-300">
                  Formato Requerido 2:3
                </div>
                <div className="text-[9px] text-neutral-500 leading-normal max-w-[160px]">
                  Cualquier imagen subida se recortará automáticamente al centro y se formateará a exactamente <strong className="text-neutral-400">72 DPI</strong>.
                </div>
              </div>
            </div>

            {/* Right Column: User Data Fields */}
            <div className="md:col-span-2 space-y-4">
              
              {/* Name field */}
              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* DNI (Read-only for security, unique identifier) */}
                <div>
                  <label className="text-xs font-medium text-neutral-400 block mb-1">
                    DNI (Identificador único)
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input
                      type="text"
                      disabled
                      value={dni}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-500 font-mono tracking-wider cursor-not-allowed"
                      title="El DNI es tu identificador único de cuenta y no se puede modificar directamente."
                    />
                  </div>
                  <span className="text-[9px] text-neutral-600 mt-1 block">
                    No editable por seguridad
                  </span>
                </div>

                {/* Rol / Cargo */}
                <div>
                  <label className="text-xs font-medium text-neutral-400 block mb-1">
                    Rol asignado en el Sistema
                  </label>
                  <div className="relative">
                    <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input
                      type="text"
                      disabled
                      value={currentUser.role}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-500 font-bold uppercase tracking-wider cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Email field */}
              <div>
                <label className="text-xs font-medium text-neutral-300 block mb-1">
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone field */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1">
                    Teléfono celular o WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="tel"
                      placeholder="999888777"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d\s+-]/g, ''))}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white transition"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1">
                    Clave de Acceso <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-black border border-neutral-700 text-xs text-white font-mono focus:outline-none focus:border-white transition"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Clave de acceso numérica o texto
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-neutral-800 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-white font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessingImage}
              className="px-5 py-2.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
            >
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
