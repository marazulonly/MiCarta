import React from 'react';
import { Loader2, Store } from 'lucide-react';

interface LoadingRestaurantStateProps {
  message?: string;
}

export const LoadingRestaurantState: React.FC<LoadingRestaurantStateProps> = ({
  message = 'Cargando la información del restaurante...'
}) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-4 shadow-sm relative">
        <Store className="w-6 h-6 text-neutral-700" />
        <Loader2 className="w-10 h-10 text-neutral-900 animate-spin absolute -top-1 -right-1" />
      </div>
      <p className="text-sm font-semibold text-neutral-800 animate-pulse">
        {message}
      </p>
      <span className="text-xs text-neutral-400 mt-1">
        Micarta OS · Sincronizando datos de sede...
      </span>
    </div>
  );
};
