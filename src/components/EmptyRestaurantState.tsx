import React from 'react';
import { Store, Plus, RefreshCw, AlertCircle, Building2 } from 'lucide-react';

interface EmptyRestaurantStateProps {
  title?: string;
  description?: string;
  onCreateRestaurant?: () => void;
  onRefresh?: () => void;
  roleName?: string;
}

export const EmptyRestaurantState: React.FC<EmptyRestaurantStateProps> = ({
  title = 'No hay ningún restaurante disponible',
  description = 'No se encontró un restaurante asociado a esta cuenta. Si acabas de registrarte, puedes crear uno nuevo o verificar tus permisos con el administrador.',
  onCreateRestaurant,
  onRefresh,
  roleName
}) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-neutral-100 rounded-3xl border border-neutral-200 flex items-center justify-center mb-5 shadow-sm text-neutral-800">
        <Building2 className="w-8 h-8 text-neutral-700" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-600 mb-3">
        <AlertCircle className="w-3.5 h-3.5 text-neutral-500" />
        <span>{roleName ? `Modo: ${roleName}` : 'Estado de Sede Inexistente'}</span>
      </div>

      <h2 className="text-2xl font-black text-neutral-900 mb-2 tracking-tight">
        {title}
      </h2>

      <p className="text-sm text-neutral-600 leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        {onCreateRestaurant && (
          <button
            onClick={onCreateRestaurant}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-sm hover:bg-neutral-800 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Mi Primer Restaurante</span>
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 font-medium text-sm hover:bg-neutral-50 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-neutral-500" />
            <span>Actualizar Datos</span>
          </button>
        )}
      </div>
    </div>
  );
};
