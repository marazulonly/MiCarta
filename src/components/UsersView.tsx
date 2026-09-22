import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  Mail
} from 'lucide-react';
import { User, UserRole, Restaurant } from '../types';

interface UsersViewProps {
  users: User[];
  restaurants: Restaurant[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
}

const ROLES_INFO: { role: UserRole; title: string; desc: string }[] = [
  { role: 'ADMIN', title: '1. Administrador', desc: 'Control global del SaaS, base de datos y multi-tenants.' },
  { role: 'OWNER', title: '2. Dueño', desc: 'Supervisión de marcas y reportes consolidados.' },
  { role: 'RESTAURANT_MANAGER', title: '3. Restaurante', desc: 'Gestión operativa del local, carta y personal.' },
  { role: 'KITCHEN', title: '4. Cocina', desc: 'Gestión de comandas, estaciones de preparación y disponibilidad de platos.' },
  { role: 'WAITER', title: '5. Mesero', desc: 'Atención en salón, comandas y asignación de mesas.' },
  { role: 'DELIVERY', title: '6. Repartidor', desc: 'Despacho motorizado y confirmación de entrega.' },
  { role: 'CUSTOMER', title: '7. Cliente', desc: 'Acceso por QR a la carta digital del local.' },
];

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  restaurants,
  onAddUser,
  onUpdateUser,
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newPassword, setNewPassword] = useState('12345678');
  const [newRole, setNewRole] = useState<UserRole>('WAITER');
  const [newPhone, setNewPhone] = useState('+51 980 000 111');
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([restaurants[0]?.id || 'rest-brasas']);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (user.dni && user.dni.includes(searchTerm));
    return matchRole && matchSearch;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // DNI Validation: 8 numeric digits
    const cleanedDni = newDni.trim();
    if (!/^\d{8}$/.test(cleanedDni)) {
      setFormError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    // Uniqueness check
    const isDuplicate = users.some(u => u.dni === cleanedDni);
    if (isDuplicate) {
      setFormError(`El DNI ${cleanedDni} ya está registrado en el sistema. El DNI es único e irrepetible.`);
      return;
    }

    if (!newName || !newEmail) return;

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: newName,
      email: newEmail,
      dni: cleanedDni,
      password: newPassword || '12345678',
      role: newRole,
      phone: newPhone,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      restaurantIds: newRole === 'ADMIN' ? ['all'] : selectedRestaurants,
      status: 'active',
      lastActive: 'Recién creado'
    };

    onAddUser(newUser);
    setIsModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewDni('');
    setNewPassword('12345678');
    setFormError(null);
  };

  const toggleRestaurantInForm = (restId: string) => {
    setSelectedRestaurants(prev => 
      prev.includes(restId) ? prev.filter(id => id !== restId) : [...prev, restId]
    );
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Usuarios y Niveles de Acceso
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Asignación de roles (Administrador, Dueños, Restaurante, Mesero, Repartidor, Cliente) y permisos multi-sede.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Dar de Alta Usuario</span>
        </button>
      </div>

      {/* 6 Roles Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ROLES_INFO.map(r => (
          <button
            key={r.role}
            onClick={() => setRoleFilter(roleFilter === r.role ? 'all' : r.role)}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
              roleFilter === r.role
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900/40 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            }`}
          >
            <span className="text-[11px] font-bold block truncate">{r.title}</span>
            <span className={`text-[10px] block mt-0.5 ${roleFilter === r.role ? 'text-neutral-700' : 'text-neutral-400'}`}>
              {users.filter(u => u.role === r.role).length} asignados
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nombre o email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-white"
          />
        </div>

        {roleFilter !== 'all' && (
          <button
            onClick={() => setRoleFilter('all')}
            className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
          >
            Mostrar todos los roles
          </button>
        )}
      </div>

      {/* Minimalist Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-black text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4 font-semibold">Usuario</th>
              <th className="py-3 px-4 font-semibold">DNI (Único)</th>
              <th className="py-3 px-4 font-semibold">Nivel / Rol</th>
              <th className="py-3 px-4 font-semibold">Sedes Asignadas</th>
              <th className="py-3 px-4 font-semibold">Estado</th>
              <th className="py-3 px-4 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredUsers.map(user => {
              const assignedRests = user.restaurantIds.includes('all')
                ? ['Todas las sedes']
                : user.restaurantIds.map(id => restaurants.find(r => r.id === id)?.name || id);

              return (
                <tr key={user.id} className="hover:bg-neutral-900/50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{user.name}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{user.email}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-white font-bold tracking-wider">
                      {user.dni || 'Sin DNI'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {user.role}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[11px] text-neutral-300">
                    {assignedRests.join(', ')}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-mono ${user.status === 'active' ? 'text-white' : 'text-neutral-400'}`}>
                      {user.status === 'active' ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        onUpdateUser({
                          ...user,
                          status: user.status === 'active' ? 'inactive' : 'active'
                        });
                      }}
                      className="text-[10px] font-mono underline text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {user.status === 'active' ? 'Suspender' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Create User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              Dar de Alta Nuevo Usuario
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-bold block mb-1">
                    DNI (8 dígitos numéricos) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    pattern="\d{8}"
                    placeholder="Ej: 72918342"
                    value={newDni}
                    onChange={(e) => setNewDni(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-white"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Único e irrepetible</span>
                </div>
                <div>
                  <label className="text-xs text-neutral-300 font-bold block mb-1">
                    Clave de Acceso
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Por defecto: 12345678</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Rol de Acceso (7 Niveles)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                >
                  {ROLES_INFO.map(r => (
                    <option key={r.role} value={r.role}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              {newRole !== 'ADMIN' && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Sedes Permitidas</label>
                  <div className="space-y-1.5">
                    {restaurants.map(rest => {
                      const isChecked = selectedRestaurants.includes(rest.id);
                      return (
                        <button
                          key={rest.id}
                          type="button"
                          onClick={() => toggleRestaurantInForm(rest.id)}
                          className={`w-full px-3 py-1.5 rounded-lg border text-left text-xs transition flex items-center justify-between cursor-pointer ${
                            isChecked
                              ? 'bg-neutral-800 border-white text-white font-bold'
                              : 'bg-black border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span>{rest.name}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer"
                >
                  Confirmar Alta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
