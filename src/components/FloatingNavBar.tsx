import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Store, 
  Users, 
  ReceiptText 
} from 'lucide-react';
import { TabType } from '../types';

interface FloatingNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingOrdersCount?: number;
}

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({
  activeTab,
  onTabChange,
  pendingOrdersCount = 4,
}) => {
  // Normalize tab id
  const currentTabId = activeTab === 'architecture' ? 'home' : activeTab;
  
  const getActiveIndex = () => {
    switch (currentTabId) {
      case 'home': return 0;
      case 'restaurants': return 1;
      case 'users': return 2;
      case 'orders': return 3;
      default: return 0;
    }
  };

  const activeIndex = getActiveIndex();

  // Coordinates for liquid scoop: 4 tabs centered at 50, 150, 250, 350
  const tabCenters = [50, 150, 250, 350];
  const targetCx = tabCenters[activeIndex] ?? 50;

  const [animatedCx, setAnimatedCx] = useState(targetCx);

  useEffect(() => {
    let animationFrame: number;
    const startTime = performance.now();
    const duration = 260; // ms
    const initialCx = animatedCx;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = initialCx + (targetCx - initialCx) * ease;
      setAnimatedCx(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetCx]);

  // Dimensions of SVG dock
  const W = 400;
  const H = 64;
  const R = 22; // Pill radius
  const cx = animatedCx;
  const scoopWidth = 36;
  const scoopDepth = 30;

  const leftScoopStart = Math.max(cx - scoopWidth, R);
  const rightScoopEnd = Math.min(cx + scoopWidth, W - R);

  // Exact fluid liquid scoop path
  const pathD = `
    M 0,${R}
    A ${R} ${R} 0 0 1 ${R},0
    L ${leftScoopStart},0
    C ${cx - scoopWidth * 0.55} 0, ${cx - scoopWidth * 0.45} ${scoopDepth}, ${cx} ${scoopDepth}
    C ${cx + scoopWidth * 0.45} ${scoopDepth}, ${cx + scoopWidth * 0.55} 0, ${rightScoopEnd},0
    L ${W - R},0
    A ${R} ${R} 0 0 1 ${W},${R}
    L ${W},${H - R}
    A ${R} ${R} 0 0 1 ${W - R},${H}
    L ${R},${H}
    A ${R} ${R} 0 0 1 0,${H - R}
    Z
  `;

  return (
    <nav 
      id="floating-bottom-nav" 
      aria-label="Navegación principal"
      className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
    >
      <div className="relative w-full max-w-[390px] filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] pointer-events-auto select-none">
        
        {/* Minimalist Black SVG Pill with Curved Notch */}
        <svg 
          viewBox="0 0 400 64" 
          className="w-full h-[64px] overflow-visible block"
          style={{ willChange: 'transform' }}
        >
          <path
            d={pathD}
            fill="#050505"
            stroke="#262626"
            strokeWidth="1.2"
          />

          {/* Clean minimal rim highlight */}
          <path
            d={`M ${leftScoopStart},0 C ${cx - scoopWidth * 0.55} 0, ${cx - scoopWidth * 0.45} ${scoopDepth}, ${cx} ${scoopDepth} C ${cx + scoopWidth * 0.45} ${scoopDepth}, ${cx + scoopWidth * 0.55} 0, ${rightScoopEnd},0`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        {/* Elevated Circular Focal Button (Minimalist Black & White) */}
        <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
          <div 
            className="absolute -top-2.5 w-[46px] h-[46px] -ml-[23px] rounded-full flex items-center justify-center transition-all duration-300 ease-out shadow-[0_8px_20px_rgba(0,0,0,0.9)]"
            style={{ 
              left: `${(animatedCx / 400) * 100}%`,
            }}
          >
            <div className="w-full h-full rounded-full flex items-center justify-center border border-white/40 bg-neutral-900">
              <div className="w-full h-full rounded-full flex items-center justify-center bg-white text-black">
                {activeIndex === 0 && <Home className="w-4 h-4 text-black stroke-[2.2]" />}
                {activeIndex === 1 && <Store className="w-4 h-4 text-black stroke-[2.2]" />}
                {activeIndex === 2 && <Users className="w-4 h-4 text-black stroke-[2.2]" />}
                {activeIndex === 3 && (
                  <div className="relative">
                    <ReceiptText className="w-4 h-4 text-black stroke-[2.2]" />
                    {pendingOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-black ring-1 ring-white" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clickable Tab Triggers */}
        <div className="absolute inset-0 grid grid-cols-4 items-center">
          {/* 1. Home */}
          <button
            id="nav-btn-home"
            onClick={() => onTabChange('home')}
            className="relative flex flex-col items-center justify-center h-full group focus:outline-none cursor-pointer"
            aria-label="Home"
          >
            <div className={`transition-all duration-200 ${activeIndex === 0 ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-40 group-hover:opacity-100'}`}>
              <Home className="w-4 h-4 text-white" />
            </div>
            <span 
              className={`text-[10px] tracking-wide transition-all ${
                activeIndex === 0 ? 'text-white font-semibold transform translate-y-3' : 'text-neutral-400 opacity-60 group-hover:opacity-100'
              }`}
            >
              Home
            </span>
          </button>

          {/* 2. Restaurantes */}
          <button
            id="nav-btn-restaurants"
            onClick={() => onTabChange('restaurants')}
            className="relative flex flex-col items-center justify-center h-full group focus:outline-none cursor-pointer"
            aria-label="Restaurantes"
          >
            <div className={`transition-all duration-200 ${activeIndex === 1 ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-40 group-hover:opacity-100'}`}>
              <Store className="w-4 h-4 text-white" />
            </div>
            <span 
              className={`text-[10px] tracking-wide transition-all ${
                activeIndex === 1 ? 'text-white font-semibold transform translate-y-3' : 'text-neutral-400 opacity-60 group-hover:opacity-100'
              }`}
            >
              Locales
            </span>
          </button>

          {/* 3. Usuarios */}
          <button
            id="nav-btn-users"
            onClick={() => onTabChange('users')}
            className="relative flex flex-col items-center justify-center h-full group focus:outline-none cursor-pointer"
            aria-label="Usuarios"
          >
            <div className={`transition-all duration-200 ${activeIndex === 2 ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-40 group-hover:opacity-100'}`}>
              <Users className="w-4 h-4 text-white" />
            </div>
            <span 
              className={`text-[10px] tracking-wide transition-all ${
                activeIndex === 2 ? 'text-white font-semibold transform translate-y-3' : 'text-neutral-400 opacity-60 group-hover:opacity-100'
              }`}
            >
              Usuarios
            </span>
          </button>

          {/* 4. Pedidos */}
          <button
            id="nav-btn-orders"
            onClick={() => onTabChange('orders')}
            className="relative flex flex-col items-center justify-center h-full group focus:outline-none cursor-pointer"
            aria-label="Pedidos"
          >
            <div className={`relative transition-all duration-200 ${activeIndex === 3 ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-40 group-hover:opacity-100'}`}>
              <ReceiptText className="w-4 h-4 text-white" />
              {pendingOrdersCount > 0 && activeIndex !== 3 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white text-black">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            <span 
              className={`text-[10px] tracking-wide transition-all ${
                activeIndex === 3 ? 'text-white font-semibold transform translate-y-3' : 'text-neutral-400 opacity-60 group-hover:opacity-100'
              }`}
            >
              Pedidos
            </span>
          </button>
        </div>

      </div>
    </nav>
  );
};
