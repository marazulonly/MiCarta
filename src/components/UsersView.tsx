import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  Trash2, 
  Edit, 
  Camera, 
  AlertTriangle,
  X,
  Shield,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { User, UserRole, Restaurant } from '../types';
import { isDniDuplicate } from '../lib/userUtils';
import { processAndUploadImage } from '../lib/imageOptimizer';

interface UsersViewProps {
  users: User[];
  restaurants: Restaurant[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
  currentUser?: User | null;
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

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=180&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=180&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=180&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=180&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=180&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=180&auto=format&fit=crop&q=80'
];

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  restaurants,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser,
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newPassword, setNewPassword] = useState('12345678');
  const [newRole, setNewRole] = useState<UserRole>('WAITER');
  const [newPhone, setNewPhone] = useState('+51 980 000 111');
  const [newAvatar, setNewAvatar] = useState(PRESET_AVATARS[0]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([restaurants[0]?.id || 'rest-brasas']);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER' || !currentUser;

  const filteredUsers = users.filter(user => {
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (user.dni && user.dni.includes(searchTerm));
    return matchRole && matchSearch;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setNewName('');
    setNewEmail('');
    setNewDni('');
    setNewPassword('12345678');
    setNewRole('WAITER');
    setNewPhone('+51 980 000 111');
    setNewAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
    setSelectedRestaurants([restaurants[0]?.id || 'rest-brasas']);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setNewName(user.name);
    setNewEmail(user.email);
    setNewDni(user.dni || '');
    setNewPassword(user.password || '12345678');
    setNewRole(user.role);
    setNewPhone(user.phone || '+51 980 000 111');
    setNewAvatar(user.avatar || PRESET_AVATARS[0]);
    setSelectedRestaurants(user.restaurantIds || [restaurants[0]?.id || 'rest-brasas']);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload1to1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setFormError('La foto de perfil no debe superar los 8MB.');
      return;
    }

    processAndUploadImage(file, 'avatar', 'user')
      .then(res => {
        setNewAvatar(res.url);
      })
      .catch(err => {
        console.warn('Error processing avatar:', err);
        setFormError('Error al procesar la foto de perfil.');
      });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // DNI Validation: 8 numeric digits
    const cleanedDni = newDni.trim();
    if (!/^\d{8}$/.test(cleanedDni)) {
      setFormError('El DNI debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    // Uniqueness check
    if (isDniDuplicate(users, cleanedDni, editingUser?.id)) {
      setFormError(`El DNI ${cleanedDni} ya está registrado para otro usuario. Los usuarios y DNI no pueden duplicarse.`);
      return;
    }

    if (!newName.trim() || !newEmail.trim()) {
      setFormError('Por favor completa el nombre y correo electrónico.');
      return;
    }

    if (editingUser) {
      // Update User
      const updated: User = {
        ...editingUser,
        name: newName,
        email: newEmail,
        dni: cleanedDni,
        password: newPassword || '12345678',
        role: newRole,
        phone: newPhone,
        avatar: newAvatar,
        restaurantIds: newRole === 'ADMIN' ? ['all'] : selectedRestaurants,
      };
      onUpdateUser(updated);
    } else {
      // Create User
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: newName,
        email: newEmail,
        dni: cleanedDni,
        password: newPassword || '12345678',
        role: newRole,
        phone: newPhone,
        avatar: newAvatar,
        restaurantIds: newRole === 'ADMIN' ? ['all'] : selectedRestaurants,
        status: 'active',
        lastActive: 'Recién creado'
      };
      onAddUser(newUser);
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete && onDeleteUser) {
      onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    }
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
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-white" />
            <span>Usuarios y Niveles de Acceso</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Asignación de roles (Administrador, Dueños, Restaurante, Mesero, Repartidor, Cliente) con DNI único e irrepetible.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer self-start sm:self-auto shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          <span>Dar de Alta Nuevo Usuario</span>
        </button>
      </div>

      {/* 7 Roles Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {ROLES_INFO.map(r => (
          <button
            key={r.role}
            onClick={() => setRoleFilter(roleFilter === r.role ? 'all' : r.role)}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              roleFilter === r.role
                ? 'bg-white text-black border-white shadow'
                : 'bg-neutral-900/40 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            }`}
          >
            <span className="text-[11px] font-bold block truncate">{r.title}</span>
            <span className={`text-[10px] block mt-0.5 ${roleFilter === r.role ? 'text-neutral-700 font-semibold' : 'text-neutral-400'}`}>
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
            placeholder="Buscar por nombre, correo o DNI de 8 dígitos..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-white font-medium"
          />
        </div>

        {roleFilter !== 'all' && (
          <button
            onClick={() => setRoleFilter('all')}
            className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
          >
            Mostrar todos los roles ({users.length})
          </button>
        )}
      </div>

      {/* User Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-black text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Foto 1:1 & Usuario</th>
              <th className="py-3.5 px-4 font-semibold">DNI (Único)</th>
              <th className="py-3.5 px-4 font-semibold">Nivel / Rol</th>
              <th className="py-3.5 px-4 font-semibold">Sedes Asignadas</th>
              <th className="py-3.5 px-4 font-semibold">Estado</th>
              <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-neutral-500">
                  No se encontraron usuarios registrados con el filtro actual.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const assignedRests = user.restaurantIds.includes('all')
                  ? ['Todas las sedes (ADMIN)']
                  : user.restaurantIds.map(id => restaurants.find(r => r.id === id)?.name || id);

                return (
                  <tr key={user.id} className="hover:bg-neutral-900/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover aspect-square border-2 border-neutral-700 shrink-0 shadow"
                        />
                        <div>
                          <div className="font-bold text-white text-xs">{user.name}</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-white font-bold tracking-widest">
                        {user.dni || 'Sin DNI'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 font-semibold">
                        {user.role}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-neutral-300 max-w-[200px] truncate">
                      {assignedRests.join(', ')}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        user.status === 'active' 
                          ? 'bg-neutral-800 text-white border border-neutral-700' 
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}>
                        {user.status === 'active' ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit User Button */}
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition cursor-pointer"
                          title="Editar usuario y foto de perfil 1:1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Suspend / Activate Toggle */}
                        <button
                          onClick={() => {
                            onUpdateUser({
                              ...user,
                              status: user.status === 'active' ? 'inactive' : 'active'
                            });
                          }}
                          className="px-2 py-1 rounded text-[10px] font-mono underline text-neutral-400 hover:text-white cursor-pointer"
                        >
                          {user.status === 'active' ? 'Suspender' : 'Reactivar'}
                        </button>

                        {/* Delete User Button (For Administrators) */}
                        {onDeleteUser && (
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 rounded-lg bg-red-950/60 border border-red-900/80 hover:bg-red-900 text-red-300 transition cursor-pointer"
                            title="Eliminar usuario permanentemente (No afecta restaurantes ni cartas)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create or Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-white" />
              <span>{editingUser ? 'Editar Usuario' : 'Dar de Alta Nuevo Usuario'}</span>
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Profile Photo 1:1 Uploader */}
              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <label className="text-xs text-neutral-200 font-bold block">
                  Foto de Perfil (Formato 1:1)
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={newAvatar}
                      alt="Vista previa 1:1"
                      className="w-16 h-16 rounded-full object-cover aspect-square border-2 border-white shadow-md"
                    />
                    <label className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white text-black cursor-pointer shadow hover:bg-neutral-200 transition">
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload1to1}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer transition">
                        Subir Imagen (1:1)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload1to1}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-neutral-400">Archivos JPG / PNG</span>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pt-1">
                      {PRESET_AVATARS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewAvatar(preset)}
                          className={`w-7 h-7 rounded-full overflow-hidden border transition cursor-pointer shrink-0 ${
                            newAvatar === preset ? 'border-2 border-white scale-110' : 'border-neutral-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt="" className="w-full h-full object-cover aspect-square" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 font-bold block mb-1">
                    DNI (8 dígitos) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    pattern="\d{8}"
                    placeholder="Ej: 72918342"
                    value={newDni}
                    onChange={(e) => setNewDni(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-white"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Único e irrepetible</span>
                </div>

                <div>
                  <label className="text-xs text-neutral-300 font-bold block mb-1">
                    Clave de Acceso <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Por defecto: 12345678</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-300 block mb-1 font-bold">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-300 block mb-1 font-bold">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-300 block mb-1 font-bold">Teléfono</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-300 block mb-1 font-bold">Rol de Acceso (7 Niveles)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-white"
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
                  <label className="text-xs text-neutral-300 block mb-1 font-bold">Sedes Permitidas</label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
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

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer shadow-lg"
                >
                  {editingUser ? 'Guardar Cambios' : 'Confirmar Alta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400 mb-2">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white">
              ¿Eliminar usuario permanentemente?
            </h3>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Estás a punto de eliminar al usuario <strong className="text-white">{userToDelete.name}</strong> (DNI: <span className="font-mono text-white font-bold">{userToDelete.dni}</span>, Rol: {userToDelete.role}).
            </p>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 leading-normal">
              🛡️ <strong className="text-neutral-200">Garantía de integridad:</strong> Esta acción elimina la cuenta de usuario, pero <span className="text-emerald-400 font-bold">NO eliminará ni afectará a los restaurantes, cartas ni platos.</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition cursor-pointer shadow-lg"
              >
                Sí, Eliminar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
