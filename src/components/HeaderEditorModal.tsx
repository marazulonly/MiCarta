import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  Image as ImageIcon, 
  Sliders, 
  Eye, 
  Sparkles, 
  Type, 
  Trash2,
  Maximize2,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Restaurant, RestaurantBranding } from '../types';
import { generateSlug } from '../utils/restaurantUtils';

interface HeaderEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  onUpdateRestaurant: (updated: Restaurant) => void;
}

export const HeaderEditorModal: React.FC<HeaderEditorModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  onUpdateRestaurant,
}) => {
  const currentBranding = restaurant.branding || {} as RestaurantBranding;

  const [headerLogoUrl, setHeaderLogoUrl] = useState<string>(
    currentBranding.headerLogoUrl || restaurant.logoUrl || ''
  );
  const [headerDisplayMode, setHeaderDisplayMode] = useState<'IMAGE_AND_TEXT' | 'IMAGE_ONLY'>(
    currentBranding.headerDisplayMode || 'IMAGE_AND_TEXT'
  );
  const [showHeaderName, setShowHeaderName] = useState<boolean>(
    currentBranding.showHeaderName !== undefined ? currentBranding.showHeaderName : true
  );
  const [showHeaderTagline, setShowHeaderTagline] = useState<boolean>(
    currentBranding.showHeaderTagline !== undefined ? currentBranding.showHeaderTagline : true
  );
  const [showHeaderBadge, setShowHeaderBadge] = useState<boolean>(
    currentBranding.showHeaderBadge !== undefined ? currentBranding.showHeaderBadge : true
  );
  const [headerLogoFit, setHeaderLogoFit] = useState<'contain' | 'cover' | 'auto'>(
    currentBranding.headerLogoFit || 'contain'
  );
  const [headerBannerHeight, setHeaderBannerHeight] = useState<number>(
    currentBranding.headerBannerHeight || 100
  );
  const [restaurantName, setRestaurantName] = useState<string>(restaurant.name);
  const [restaurantTagline, setRestaurantTagline] = useState<string>(restaurant.tagline || '');
  const [showGuideOutline, setShowGuideOutline] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state whenever the restaurant prop changes or modal opens
  React.useEffect(() => {
    if (restaurant) {
      const cb = restaurant.branding || {} as RestaurantBranding;
      setHeaderLogoUrl(cb.headerLogoUrl || restaurant.logoUrl || '');
      setHeaderDisplayMode(cb.headerDisplayMode || 'IMAGE_AND_TEXT');
      setShowHeaderName(cb.showHeaderName !== undefined ? cb.showHeaderName : true);
      setShowHeaderTagline(cb.showHeaderTagline !== undefined ? cb.showHeaderTagline : true);
      setShowHeaderBadge(cb.showHeaderBadge !== undefined ? cb.showHeaderBadge : true);
      setHeaderLogoFit(cb.headerLogoFit || 'contain');
      setHeaderBannerHeight(cb.headerBannerHeight || 100);
      setRestaurantName(restaurant.name);
      setRestaurantTagline(restaurant.tagline || '');
    }
  }, [restaurant.id, isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!isOpen) return null;

// File Upload for JPG, PNG, SVG
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml';
    
    if (!validTypes.includes(file.type) && !isSvg) {
      alert('Por favor selecciona una imagen válida en formato JPG, PNG o SVG.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('El archivo supera los 15MB. Por favor sube una imagen más optimizada.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawResult = reader.result;
        
        // For SVGs, keep as raw data URL or string
        if (isSvg) {
          setHeaderLogoUrl(rawResult);
          showToast('✓ Logotipo SVG vectorial guardado');
          return;
        }

        // For bitmap images (JPG/PNG/WEBP), compress lightly via canvas to ensure it fits safely in localStorage & Cloud Redis
        const img = new Image();
        img.onload = () => {
          const maxDim = 1400;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
            setHeaderLogoUrl(optimizedDataUrl);
            showToast('✓ Foto de cabecera optimizada y cargada con éxito');
          } else {
            setHeaderLogoUrl(rawResult);
            showToast('✓ Imagen cargada con éxito');
          }
        };
        img.onerror = () => {
          setHeaderLogoUrl(rawResult);
          showToast('✓ Imagen cargada con éxito');
        };
        img.src = rawResult;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleModeChange = (mode: 'IMAGE_AND_TEXT' | 'IMAGE_ONLY') => {
    setHeaderDisplayMode(mode);
    if (mode === 'IMAGE_ONLY') {
      setShowHeaderName(false);
      setShowHeaderTagline(false);
      setShowHeaderBadge(false);
    } else {
      setShowHeaderName(true);
      setShowHeaderTagline(true);
      setShowHeaderBadge(true);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const updatedBranding: RestaurantBranding = {
      ...restaurant.branding,
      headerLogoUrl: headerLogoUrl.trim(),
      headerDisplayMode,
      showHeaderName: headerDisplayMode === 'IMAGE_ONLY' ? false : showHeaderName,
      showHeaderTagline: headerDisplayMode === 'IMAGE_ONLY' ? false : showHeaderTagline,
      showHeaderBadge: headerDisplayMode === 'IMAGE_ONLY' ? false : showHeaderBadge,
      headerLogoFit,
      headerBannerHeight,
    };

    const cleanNewName = restaurantName.trim() || restaurant.name;
    const nameChanged = cleanNewName.toLowerCase() !== (restaurant.name || '').trim().toLowerCase();

    const updatedRestaurant: Restaurant = {
      ...restaurant,
      name: cleanNewName,
      slug: nameChanged ? generateSlug(cleanNewName) : restaurant.slug,
      tagline: restaurantTagline.trim(),
      logoUrl: headerLogoUrl.trim() || restaurant.logoUrl,
      branding: updatedBranding,
    };

    onUpdateRestaurant(updatedRestaurant);
    showToast('✓ Cabecera de la carta actualizada');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  // Respect custom restaurant branding colors, using theme defaults only if unconfigured
  const isMarine = restaurant.templateId === 'tmpl-costa-marina' || restaurant.id === 'rest-cevichito-pliz';
  const previewBgColor = restaurant.branding?.darkBgColor || restaurant.branding?.backgroundColor || (isMarine ? '#EAEBDC' : '#171717');
  const previewTextColor = restaurant.branding?.textColor || (isMarine ? '#1B667A' : '#ffffff');
  const previewAccentColor = restaurant.branding?.buttonColor || restaurant.branding?.accentColor || (isMarine ? '#8A9B57' : '#f59e0b');

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-xl bg-neutral-950 text-white border border-neutral-700 shadow-2xl flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Personalizar Cabecera de la Carta</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700">
                  JPG · PNG · SVG
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Ajusta el logo en el área de cabecera y define si mostrar nombre, eslogan o solo la imagen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

          {/* Section 1: Modo de Visualización (Imagen + Texto vs Solo Imagen) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-neutral-400" />
              <span>1. Formato de la Cabecera</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Imagen + Texto */}
              <div
                onClick={() => handleModeChange('IMAGE_AND_TEXT')}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  headerDisplayMode === 'IMAGE_AND_TEXT'
                    ? 'bg-neutral-800/80 border-white ring-1 ring-white/20'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                    headerDisplayMode === 'IMAGE_AND_TEXT'
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-600'
                  }`}>
                    {headerDisplayMode === 'IMAGE_AND_TEXT' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Logo + Nombre y Slogan</h3>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      Muestra la imagen/logo autoajustado en la cabecera y debajo el nombre del restaurante y su eslogan.
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center gap-1 text-[10px] text-neutral-300 font-mono">
                  <span>Recomendado para cartas tradicionales</span>
                </div>
              </div>

              {/* Option B: Solamente la Imagen */}
              <div
                onClick={() => handleModeChange('IMAGE_ONLY')}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  headerDisplayMode === 'IMAGE_ONLY'
                    ? 'bg-neutral-800/80 border-white ring-1 ring-white/20'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                    headerDisplayMode === 'IMAGE_ONLY'
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-600'
                  }`}>
                    {headerDisplayMode === 'IMAGE_ONLY' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Solamente Imagen / Banner</h3>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      Oculta el nombre y el eslogan en texto plano. La cabecera mostrará únicamente tu imagen/banner subido.
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center gap-1 text-[10px] text-neutral-300 font-mono">
                  <span>Ideal para logos con tipografía integrada o banners</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Carga de Archivo (JPG, PNG, SVG) */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-neutral-400" />
                <span>2. Logotipo / Imagen de Cabecera (JPG, PNG o SVG)</span>
              </label>

              {headerLogoUrl && (
                <button
                  type="button"
                  onClick={() => setHeaderLogoUrl('')}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Quitar imagen</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* File upload button */}
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer shadow transition shrink-0">
                <Upload className="w-4 h-4" />
                <span>Subir archivo JPG / PNG / SVG</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="O pega el enlace URL de la imagen (https://...)"
                  value={headerLogoUrl}
                  onChange={(e) => setHeaderLogoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-mono text-xs focus:border-white outline-none"
                />
              </div>
            </div>

            {/* Hint */}
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span>
                Formatos recomendados: <strong>SVG</strong> (vectorial nítido sin pixelar), <strong>PNG</strong> (con fondo transparente) o <strong>JPG</strong> de alta resolución.
              </span>
            </div>
          </div>

          {/* Section 3: Opciones de Autoajuste y Dimensiones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Autoajuste fit */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
              <label className="text-xs font-bold text-neutral-300 block">
                Tipo de Autoajuste en el Área:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setHeaderLogoFit('contain')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    headerLogoFit === 'contain'
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                >
                  Autoajuste
                </button>
                <button
                  type="button"
                  onClick={() => setHeaderLogoFit('cover')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    headerLogoFit === 'cover'
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                >
                  Banner ancho
                </button>
                <button
                  type="button"
                  onClick={() => setHeaderLogoFit('auto')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    headerLogoFit === 'auto'
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                >
                  Centrado libre
                </button>
              </div>
              <p className="text-[10px] text-neutral-400">
                {headerLogoFit === 'contain' && 'El logo se ajusta proporcionalmente sin recortarse en el recuadro.'}
                {headerLogoFit === 'cover' && 'La imagen cubre todo el ancho de la cabecera como un banner panorámico.'}
                {headerLogoFit === 'auto' && 'Mantiene la escala natural centrada de tu imagen o vector SVG.'}
              </p>
            </div>

            {/* Height Slider */}
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300">
                  Altura Máxima de la Cabecera:
                </label>
                <span className="text-xs font-mono font-bold text-white">
                  {headerBannerHeight}px
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="200"
                step="5"
                value={headerBannerHeight}
                onChange={(e) => setHeaderBannerHeight(Number(e.target.value))}
                className="w-full accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>Compacto (60px)</span>
                <span>Normal (100px)</span>
                <span>Amplio (200px)</span>
              </div>
            </div>
          </div>

          {/* Section 4: Textos Opcionales (si el modo lo permite) */}
          {headerDisplayMode === 'IMAGE_AND_TEXT' && (
            <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider block">
                3. Textos Visibles en la Cabecera
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 text-[11px] font-mono mb-1">Nombre del Restaurante</label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 text-[11px] font-mono mb-1">Eslogan / Subtítulo</label>
                  <input
                    type="text"
                    value={restaurantTagline}
                    onChange={(e) => setRestaurantTagline(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={showHeaderName}
                    onChange={(e) => setShowHeaderName(e.target.checked)}
                    className="w-4 h-4 rounded text-black accent-white"
                  />
                  <span>Mostrar Nombre en Texto</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={showHeaderTagline}
                    onChange={(e) => setShowHeaderTagline(e.target.checked)}
                    className="w-4 h-4 rounded text-black accent-white"
                  />
                  <span>Mostrar Eslogan en Texto</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={showHeaderBadge}
                    onChange={(e) => setShowHeaderBadge(e.target.checked)}
                    className="w-4 h-4 rounded text-black accent-white"
                  />
                  <span>Mostrar Distintivo de Cocina / Canal</span>
                </label>
              </div>
            </div>
          )}

          {/* Section 5: VISTA PREVIA EN VIVO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-neutral-400" />
                <span>Vista Previa de la Cabecera</span>
              </label>

              <button
                type="button"
                onClick={() => setShowGuideOutline(!showGuideOutline)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition cursor-pointer flex items-center gap-1.5 ${
                  showGuideOutline
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
                title="Muestra u oculta el marco de área de cabecera"
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>{showGuideOutline ? 'Marco: Activo' : 'Ocultar Marco'}</span>
              </button>
            </div>

            {/* Preview Box styled with the restaurant's active colors */}
            <div 
              className="rounded-2xl p-4 sm:p-6 transition-all duration-300 relative shadow-inner overflow-hidden border border-neutral-700"
              style={{ backgroundColor: previewBgColor, color: previewTextColor }}
            >
              {/* Discrete Close Button (simulated) */}
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs opacity-60">
                <X className="w-3.5 h-3.5" />
              </div>

              {/* Box Guide */}
              <div 
                className={`w-full transition-all duration-200 flex flex-col items-center justify-center rounded-xl relative ${
                  showGuideOutline ? 'border-2 border-dashed border-neutral-400/50 bg-black/5 p-2' : 'p-1'
                }`}
                style={{
                  minHeight: `${headerBannerHeight + 10}px`
                }}
              >
                {showGuideOutline && (
                  <span className="absolute -top-2.5 left-3 px-2 py-0.2 rounded bg-neutral-900 text-white font-mono text-[9px] font-bold tracking-wider uppercase shadow border border-neutral-700">
                    Área de Cabecera (Autoajuste)
                  </span>
                )}

                {/* The Logo/Image inside the container */}
                {headerLogoUrl ? (
                  <div 
                    className="w-full flex items-center justify-center"
                    style={{ maxHeight: `${headerBannerHeight}px` }}
                  >
                    <img
                      src={headerLogoUrl}
                      alt={restaurantName}
                      className={`transition-all duration-300 ${
                        headerLogoFit === 'cover'
                          ? 'w-full object-cover rounded-xl'
                          : headerLogoFit === 'auto'
                          ? 'max-w-full object-contain'
                          : 'max-w-full object-contain'
                      }`}
                      style={{
                        maxHeight: `${headerBannerHeight}px`,
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-neutral-400">
                    <ImageIcon className="w-8 h-8 opacity-40 mb-1 text-current" />
                    <span className="text-[11px] font-mono">Sin imagen asignada en cabecera</span>
                  </div>
                )}

                {/* Subtitle inside area if applicable and enabled */}
                {headerDisplayMode === 'IMAGE_AND_TEXT' && showHeaderBadge && (
                  <span 
                    style={{ color: previewAccentColor }}
                    className="text-[10px] font-mono tracking-widest uppercase font-bold mt-1 block text-center"
                  >
                    COCINA & ESPECIALIDADES
                  </span>
                )}
              </div>

              {/* Restaurant Name and Tagline below the box */}
              {headerDisplayMode === 'IMAGE_AND_TEXT' && (
                <div className="text-center pt-2 space-y-1">
                  {showHeaderName && (
                    <h1 
                      style={{ 
                        fontFamily: restaurant.branding?.restaurantNameFont || 'inherit',
                        color: previewTextColor
                      }}
                      className="text-2xl sm:text-3xl font-black"
                    >
                      {restaurantName || restaurant.name}
                    </h1>
                  )}

                  {showHeaderTagline && (
                    <p 
                      style={{ color: previewTextColor }}
                      className="text-xs font-semibold opacity-90"
                    >
                      {restaurantTagline || restaurant.tagline || 'Especialidades gastronómicas del día'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between gap-3">
          <div className="text-[11px] text-neutral-400 hidden sm:block">
            Modo activo: <strong className="text-white">{headerDisplayMode === 'IMAGE_ONLY' ? 'Solamente Imagen' : 'Imagen + Nombre y Slogan'}</strong>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition shadow-lg cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Guardar Cabecera</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
