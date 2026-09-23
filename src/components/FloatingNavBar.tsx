import React from 'react';
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
  const currentTabId = activeTab === 'architecture' ? 'home' : activeTab;

  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'restaurants' as TabType,
      label: 'Locales',
      icon: Store,
    },
    {
      id: 'users' as TabType,
      label: 'Usuarios',
      icon: Users,
    },
    {
      id: 'orders' as TabType,
      label: 'Pedidos',
      icon: ReceiptText,
      badge: pendingOrdersCount,
    },
  ];

  return (
    <nav 
      id="floating-bottom-nav" 
      aria-label="Navegación principal"
      className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="w-full max-w-[420px] bg-white border border-neutral-100 shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-2.5 flex items-center justify-between rounded-[32px] select-none">
        {tabs.map((tab) => {
          const isActive = currentTabId === tab.id;
          const IconComp = tab.icon;

          if (isActive) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1E1F24] text-white rounded-full font-bold text-xs transition-all duration-300 shadow-md transform scale-105 cursor-pointer"
              >
                <IconComp className="w-4 h-4 text-white stroke-[2.25]" />
                <span className="tracking-wide">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black bg-amber-400 text-black rounded-full leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative p-3.5 text-[#1E1F24]/70 hover:text-[#1E1F24] hover:bg-neutral-50 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center"
              title={tab.label}
            >
              <IconComp className="w-4 h-4 stroke-[1.75]" />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
