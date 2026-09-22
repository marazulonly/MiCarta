import React, { useState } from 'react';
import { 
  Users, 
  Store, 
  ChefHat, 
  Bike, 
  UserCheck, 
  LayoutTemplate, 
  Edit3, 
  Search, 
  Check, 
  X, 
  ExternalLink, 
  Eye, 
  SlidersHorizontal,
  Plus,
  Shield,
  Phone,
  Mail,
  Building2,
  Palette,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Restaurant, User, MenuTemplate, UserRole } from '../types';

interface AdminDashboardProps {
  restaurants: Restaurant[];
  users: User[];
  templates: MenuTemplate[];
  onUpdateRestaurant: (updated: Restaurant) => void;
  onUpdateUser: (updated: User) => void;
  onAddUser: (newUser: User) => void;
  onUpdateTemplate: (updated: MenuTemplate) => void;
  onOpenCustomerPreview: (restaurant: Restaurant) => void;
  onSwitchToOwnerView: () => void;
}

type AdminSection = 'owners' | 'restaurants' | 'waiters' | 'delivery' | 'customers' | 'templates';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  restaurants,
  users,
  templates,
  onUpdateRestaurant,
  onUpdateUser,
  onAddUser,
  onUpdateTemplate,
  onOpenCustomerPreview,
  onSwitchToOwnerView,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('owners');
  const [searchTerm, setSearchTerm] = useState('');

  // Creation Modals
  const [isCreatingOwner, setIsCreatingOwner] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('+51 987 111 222');
  const [newOwnerDni, setNewOwnerDni] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('12345678');
  const [newOwnerRests, setNewOwnerRests] = useState<string[]>([]);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  // Editing Modals State
  const [editingOwner, setEditingOwner] = useState<User | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [editingWaiter, setEditingWaiter] = useState<User | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<User | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MenuTemplate | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Filtered lists
  const ownersList = users.filter(u => u.role === 'OWNER');
  const waitersList = users.filter(u => u.role === 'WAITER');
  const deliveryList = users.filter(u => u.role === 'DELIVERY');
  const customersList = users.filter(u => u.role === 'CUSTOMER');

  // Counts
  const metrics = [
    { id: 'owners', label: 'Dueños', count: ownersList.length, icon: Users, desc: 'Propietarios de cadenas' },
    { id: 'restaurants', label: 'Restaurantes', count: restaurants.length, icon: Store, desc: 'Sedes y marcas activas' },
    { id: 'waiters', label: 'Meseros', count: waitersList.length, icon: ChefHat, desc: 'Personal de salón' },
    { id: 'delivery', label: 'Repartidores', count: deliveryList.length, icon: Bike, desc: 'Flota motorizada' },
    { id: 'customers', label: 'Clientes', count: customersList.length, icon: UserCheck, desc: 'Comensales registrados' },
    { id: 'templates', label: 'Plantillas', count: templates.length, icon: LayoutTemplate, desc: 'Formatos de cartas' },
  ];

  // Search filtering
  const filterBySearch = (text: string) => text.toLowerCase().includes(searchTerm.toLowerCase());

  // Creation Handler for Owners
  const handleCreateOwner = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError(null);

    const cleanDni = newOwnerDni.trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      setOwnerError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    if (users.some(u => u.dni === cleanDni)) {
      setOwnerError(`El DNI ${cleanDni} ya está registrado en el sistema. El DNI es único e irrepetible.`);
      return;
    }

    if (!newOwnerName || !newOwnerEmail) return;

    const newOwnerId = `u-${Date.now()}`;
    const newOwner: User = {
      id: newOwnerId,
      name: newOwnerName,
      email: newOwnerEmail,
      dni: cleanDni,
      password: newOwnerPassword || '12345678',
      role: 'OWNER',
      phone: newOwnerPhone,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      restaurantIds: newOwnerRests,
      status: 'active',
      lastActive: 'Recién registrado'
    };

    onAddUser(newOwner);

    // Update assigned restaurants to link to this new owner
    newOwnerRests.forEach(rId => {
      const rest = restaurants.find(r => r.id === rId);
      if (rest) {
        onUpdateRestaurant({ ...rest, ownerId: newOwnerId });
      }
    });

    setIsCreatingOwner(false);
    setNewOwnerName('');
    setNewOwnerEmail('');
    setNewOwnerDni('');
    setNewOwnerPassword('12345678');
    setNewOwnerRests([]);
    setOwnerError(null);
  };

  // Save Handlers with DNI uniqueness checks
  const handleSaveOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOwner) return;
    setEditError(null);

    const cleanDni = editingOwner.dni.trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      setEditError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    const isDuplicate = users.some(u => u.id !== editingOwner.id && u.dni === cleanDni);
    if (isDuplicate) {
      setEditError(`El DNI ${cleanDni} ya pertenece a otro usuario registrado.`);
      return;
    }

    onUpdateUser({ ...editingOwner, dni: cleanDni });
    setEditingOwner(null);
    setEditError(null);
  };

  const handleSaveRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;
    onUpdateRestaurant(editingRestaurant);
    setEditingRestaurant(null);
  };

  const handleSaveWaiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWaiter) return;
    setEditError(null);

    const cleanDni = editingWaiter.dni.trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      setEditError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    const isDuplicate = users.some(u => u.id !== editingWaiter.id && u.dni === cleanDni);
    if (isDuplicate) {
      setEditError(`El DNI ${cleanDni} ya pertenece a otro usuario registrado.`);
      return;
    }

    onUpdateUser({ ...editingWaiter, dni: cleanDni });
    setEditingWaiter(null);
    setEditError(null);
  };

  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelivery) return;
    setEditError(null);

    const cleanDni = editingDelivery.dni.trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      setEditError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    const isDuplicate = users.some(u => u.id !== editingDelivery.id && u.dni === cleanDni);
    if (isDuplicate) {
      setEditError(`El DNI ${cleanDni} ya pertenece a otro usuario registrado.`);
      return;
    }

    onUpdateUser({ ...editingDelivery, dni: cleanDni });
    setEditingDelivery(null);
    setEditError(null);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditError(null);

    const cleanDni = editingCustomer.dni.trim();
    if (!/^\d{8}$/.test(cleanDni)) {
      setEditError('El DNI debe tener exactamente 8 dígitos numéricos.');
      return;
    }

    const isDuplicate = users.some(u => u.id !== editingCustomer.id && u.dni === cleanDni);
    if (isDuplicate) {
      setEditError(`El DNI ${cleanDni} ya pertenece a otro usuario registrado.`);
      return;
    }

    onUpdateUser({ ...editingCustomer, dni: cleanDni });
    setEditingCustomer(null);
    setEditError(null);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    onUpdateTemplate(editingTemplate);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* Header with Switch to Owner View */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white text-black font-bold">
              SUPERADMINISTRADOR
            </span>
            <span className="text-xs text-neutral-400 font-mono">Panel Global</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Dashboard de Administrador
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Control maestro de Dueños, Restaurantes, Meseros, Repartidores, Clientes y Plantillas de Cartas con edición en vivo.
          </p>
        </div>

        <button
          onClick={onSwitchToOwnerView}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-white transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Ir a Vista de Dueños</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {/* 6 Category Segment Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {metrics.map((m) => {
          const Icon = m.icon;
          const isActive = activeSection === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setActiveSection(m.id as AdminSection);
                setSearchTerm('');
              }}
              className={`p-3 rounded-xl border transition text-left cursor-pointer flex flex-col justify-between ${
                isActive 
                  ? 'bg-white text-black border-white shadow-lg' 
                  : 'bg-neutral-900/50 hover:bg-neutral-900 border-neutral-800 text-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                <span className={`text-base font-black ${isActive ? 'text-black' : 'text-white'}`}>
                  {m.count}
                </span>
              </div>
              <div className="mt-2">
                <div className={`text-xs font-bold ${isActive ? 'text-black' : 'text-white'}`}>
                  {m.label}
                </div>
                <div className={`text-[10px] truncate ${isActive ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  {m.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Section Search Bar & Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white capitalize">
            {activeSection === 'owners' && 'Gestión de Dueños'}
            {activeSection === 'restaurants' && 'Gestión de Restaurantes'}
            {activeSection === 'waiters' && 'Gestión de Meseros de Salón'}
            {activeSection === 'delivery' && 'Gestión de Flota de Repartidores'}
            {activeSection === 'customers' && 'Gestión de Clientes y Comensales'}
            {activeSection === 'templates' && 'Catálogo de Plantillas de Cartas'}
          </h2>
          <span className="text-xs text-neutral-400">· Edición habilitada</span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o sede..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SECCIÓN: DUEÑOS                                            */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'owners' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div>
              <p className="text-xs font-semibold text-white">Administración de Cuentas de Dueños de Franquicia</p>
              <p className="text-[11px] text-neutral-400">Crea nuevos propietarios con DNI único de 8 dígitos y asígnales los restaurantes a gestionar.</p>
            </div>
            <button
              onClick={() => {
                setOwnerError(null);
                setIsCreatingOwner(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer shrink-0 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Crear Cuenta de Dueño</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ownersList.filter(o => filterBySearch(o.name) || filterBySearch(o.email) || filterBySearch(o.dni || '')).map(owner => {
              const ownedRests = restaurants.filter(r => owner.restaurantIds.includes(r.id));
              return (
                <div
                  key={owner.id}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={owner.avatar} 
                        alt={owner.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-700" 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{owner.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            owner.status === 'active' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-red-950/80 text-red-400 border border-red-800/60'
                          }`}>
                            {owner.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black border border-neutral-700 font-mono text-amber-300 font-bold">
                            DNI: {owner.dni}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Clave: {owner.password}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-neutral-500" />
                          <span>{owner.email}</span>
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>{owner.phone}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditError(null);
                        setEditingOwner(owner);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-white hover:text-black text-xs font-semibold text-white border border-neutral-700 transition cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>

                  {/* Assigned Restaurants */}
                  <div className="pt-3 border-t border-neutral-800/80">
                    <span className="text-[11px] text-neutral-400 block font-medium mb-1.5">
                      Restaurantes Asignados ({ownedRests.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ownedRests.map(r => (
                        <span 
                          key={r.id} 
                          className="px-2 py-1 rounded bg-black border border-neutral-800 text-[11px] text-neutral-200 flex items-center gap-1.5 font-medium"
                        >
                          <Store className="w-3 h-3 text-neutral-400" />
                          <span>{r.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SECCIÓN: RESTAURANTES                                      */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'restaurants' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {restaurants.filter(r => filterBySearch(r.name) || filterBySearch(r.cuisineType) || filterBySearch(r.slug)).map(rest => {
              const currentTmpl = templates.find(t => t.id === rest.templateId) || templates[0];
              const owner = users.find(u => u.id === rest.ownerId);

              return (
                <div
                  key={rest.id}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={rest.logoUrl} 
                          alt={rest.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-700" 
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{rest.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              rest.isOpen ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {rest.isOpen ? 'Abierto' : 'Cerrado'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{rest.tagline}</p>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            Slug: /r/<strong className="text-white">{rest.slug}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onOpenCustomerPreview(rest)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition cursor-pointer"
                          title="Ver Carta Digital"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingRestaurant(rest)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata bar */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-800/80 text-[11px]">
                      <div>
                        <span className="text-neutral-500 block">Propietario</span>
                        <span className="font-semibold text-neutral-200 truncate block">
                          {owner?.name || 'Valeria Rivas'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Plantilla Carta</span>
                        <span className="font-semibold text-amber-400 truncate block">
                          {currentTmpl.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Capacidad</span>
                        <span className="font-semibold text-neutral-200 block">
                          {rest.metrics.totalTables} Mesas ({rest.metrics.occupancyRate}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SECCIÓN: MESEROS                                           */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'waiters' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {waitersList.filter(w => filterBySearch(w.name) || filterBySearch(w.email)).map(waiter => {
              const assignedRest = restaurants.find(r => waiter.restaurantIds.includes(r.id));
              return (
                <div
                  key={waiter.id}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={waiter.avatar} 
                        alt={waiter.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-700" 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{waiter.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            waiter.status === 'active' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {waiter.status === 'active' ? 'En Turno' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black border border-neutral-700 font-mono text-neutral-300 font-bold">
                            DNI: {waiter.dni}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                          <Store className="w-3 h-3 text-neutral-500" />
                          <span className="text-white font-medium">{assignedRest?.name || 'Sin Asignar'}</span>
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Turno: <strong className="text-neutral-300">{waiter.assignedShift || 'TARDE'}</strong> · PIN: <strong className="text-neutral-300 font-mono">{waiter.pinCode || '0000'}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingWaiter(waiter)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-white hover:text-black text-xs font-semibold text-white border border-neutral-700 transition cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>

                  <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Estado: {waiter.lastActive}</span>
                    <span>Tel: {waiter.phone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SECCIÓN: REPARTIDORES                                      */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'delivery' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliveryList.filter(d => filterBySearch(d.name) || filterBySearch(d.email)).map(rider => {
              const assignedRests = restaurants.filter(r => rider.restaurantIds.includes(r.id));
              return (
                <div
                  key={rider.id}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={rider.avatar} 
                        alt={rider.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-700" 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{rider.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-950 text-blue-400 border border-blue-800">
                            {rider.vehicleType || 'MOTO'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black border border-neutral-700 font-mono text-neutral-300 font-bold">
                            DNI: {rider.dni}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Placa: <strong className="text-neutral-200 font-mono">{rider.licensePlate || 'SIN-PLACA'}</strong> · Tel: {rider.phone}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Estado: {rider.lastActive}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingDelivery(rider)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-white hover:text-black text-xs font-semibold text-white border border-neutral-700 transition cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>

                  <div className="pt-2.5 border-t border-neutral-800/80 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-neutral-500">Sedes operativas:</span>
                    {assignedRests.map(r => (
                      <span key={r.id} className="text-[10px] px-1.5 py-0.5 rounded bg-black border border-neutral-800 text-neutral-300">
                        {r.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. SECCIÓN: CLIENTES                                          */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'customers' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customersList.filter(c => filterBySearch(c.name) || filterBySearch(c.email)).map(client => {
              return (
                <div
                  key={client.id}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={client.avatar} 
                        alt={client.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-700" 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{client.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            client.vipTier === 'BLACK_VIP' ? 'bg-neutral-800 text-amber-300 border border-amber-500/50' :
                            client.vipTier === 'GOLD' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            client.vipTier === 'SILVER' ? 'bg-neutral-800 text-neutral-300 border border-neutral-700' :
                            'bg-neutral-900 text-neutral-400 border border-neutral-800'
                          }`}>
                            {client.vipTier || 'STANDARD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black border border-neutral-700 font-mono text-neutral-300 font-bold">
                            DNI: {client.dni}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-neutral-500" />
                          <span>{client.email}</span>
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Tel: {client.phone} · Pedidos: <strong className="text-white">{client.totalOrdersCount || 0}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingCustomer(client)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-white hover:text-black text-xs font-semibold text-white border border-neutral-700 transition cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>

                  <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">{client.lastActive}</span>
                    <span className="text-emerald-400 font-medium">
                      Saldo a Favor: ${client.creditBalance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. SECCIÓN: PLANTILLAS DE CARTAS                              */}
      {/* ------------------------------------------------------------- */}
      {activeSection === 'templates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.filter(t => filterBySearch(t.name) || filterBySearch(t.category)).map(tmpl => {
              const activeCount = restaurants.filter(r => r.templateId === tmpl.id).length;

              return (
                <div
                  key={tmpl.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden flex flex-col justify-between group hover:border-neutral-700 transition"
                >
                  <div className="relative h-44 overflow-hidden bg-neutral-950">
                    <img 
                      src={tmpl.thumbnailUrl} 
                      alt={tmpl.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-black/80 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                        {tmpl.badge}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow" style={{ backgroundColor: tmpl.primaryColor }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow" style={{ backgroundColor: tmpl.darkBgColor }} />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">
                        {tmpl.category}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5 leading-tight">
                        {tmpl.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {tmpl.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-black border border-neutral-800 text-neutral-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                      <div className="text-[11px] text-neutral-400">
                        <span className="font-semibold text-white">{activeCount}</span> {activeCount === 1 ? 'local asignado' : 'locales asignados'}
                      </div>

                      <button
                        onClick={() => setEditingTemplate(tmpl)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Plantilla</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL CREAR NUEVO DUEÑO DE FRANQUICIA                         */}
      {/* ============================================================= */}
      {isCreatingOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-700 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Crear Cuenta de Dueño</h3>
                <p className="text-xs text-neutral-400">Asigna DNI único (8 dígitos), clave de acceso y restaurantes</p>
              </div>
              <button 
                onClick={() => {
                  setIsCreatingOwner(false);
                  setOwnerError(null);
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {ownerError && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-200">
                {ownerError}
              </div>
            )}

            <form onSubmit={handleCreateOwner} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej. Mateo Santisteban"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    DNI (8 dígitos numéricos, único) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    pattern="\d{8}"
                    placeholder="Ej. 10203040"
                    value={newOwnerDni}
                    onChange={(e) => setNewOwnerDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">{newOwnerDni.length}/8 dígitos</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Clave de Acceso <span className="text-neutral-400">(simulación)</span>
                  </label>
                  <input
                    type="text"
                    value={newOwnerPassword}
                    onChange={(e) => setNewOwnerPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">Por defecto: 12345678</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="mateo@costamarina.com"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    placeholder="+51 987 654 321"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Asignar Restaurantes para Gestión
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2.5 rounded-lg bg-black border border-neutral-800">
                  {restaurants.map(rest => {
                    const isChecked = newOwnerRests.includes(rest.id);
                    return (
                      <label key={rest.id} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...newOwnerRests, rest.id]
                              : newOwnerRests.filter(id => id !== rest.id);
                            setNewOwnerRests(updated);
                          }}
                          className="rounded border-neutral-700 text-white focus:ring-0"
                        />
                        <span>{rest.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">({rest.slug})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingOwner(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Crear Dueño</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL EDITAR DUEÑO                                             */}
      {/* ============================================================= */}
      {editingOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-700 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Editar Dueño de Franquicia</h3>
                <p className="text-xs text-neutral-400">ID: {editingOwner.id}</p>
              </div>
              <button 
                onClick={() => {
                  setEditingOwner(null);
                  setEditError(null);
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveOwner} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={editingOwner.name}
                  onChange={(e) => setEditingOwner({ ...editingOwner, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    DNI (8 dígitos numéricos, único) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={editingOwner.dni || ''}
                    onChange={(e) => setEditingOwner({ ...editingOwner, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">{editingOwner.dni?.length || 0}/8 dígitos</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Clave de Acceso <span className="text-neutral-400">(simulación)</span>
                  </label>
                  <input
                    type="text"
                    value={editingOwner.password || '12345678'}
                    onChange={(e) => setEditingOwner({ ...editingOwner, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editingOwner.email}
                    onChange={(e) => setEditingOwner({ ...editingOwner, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={editingOwner.phone}
                    onChange={(e) => setEditingOwner({ ...editingOwner, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Estado de Cuenta</label>
                <select
                  value={editingOwner.status}
                  onChange={(e) => setEditingOwner({ ...editingOwner, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                >
                  <option value="active">Activo - Acceso Total Permitido</option>
                  <option value="inactive">Inactivo - Acceso Temporalmente Suspendido</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Restaurantes / Franquicias Asignadas
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 rounded-lg bg-black border border-neutral-800">
                  {restaurants.map(rest => {
                    const isChecked = editingOwner.restaurantIds.includes(rest.id);
                    return (
                      <label key={rest.id} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...editingOwner.restaurantIds, rest.id]
                              : editingOwner.restaurantIds.filter(id => id !== rest.id);
                            setEditingOwner({ ...editingOwner, restaurantIds: newIds });
                          }}
                          className="rounded border-neutral-700 text-white focus:ring-0"
                        />
                        <span>{rest.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">({rest.slug})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingOwner(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL EDITAR RESTAURANTE                                       */}
      {/* ============================================================= */}
      {editingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-700 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Editar Restaurante</h3>
                <p className="text-xs text-neutral-400">ID: {editingRestaurant.id}</p>
              </div>
              <button 
                onClick={() => setEditingRestaurant(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRestaurant} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={editingRestaurant.name}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Slug URL (/r/slug)</label>
                  <input
                    type="text"
                    value={editingRestaurant.slug}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Eslogan / Subtítulo</label>
                <input
                  type="text"
                  value={editingRestaurant.tagline}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Tipo de Cocina</label>
                  <input
                    type="text"
                    value={editingRestaurant.cuisineType}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, cuisineType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingRestaurant.phone}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={editingRestaurant.address}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Plantilla de Carta Asignada</label>
                  <select
                    value={editingRestaurant.templateId || 'tmpl-luxury'}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, templateId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.badge})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Estado de Operación</label>
                  <select
                    value={editingRestaurant.isOpen ? 'open' : 'closed'}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, isOpen: e.target.value === 'open' })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                  >
                    <option value="open">Abierto (Recibiendo pedidos)</option>
                    <option value="closed">Cerrado (Fuera de horario)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingRestaurant(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL EDITAR MESERO                                            */}
      {/* ============================================================= */}
      {editingWaiter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-700 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Editar Mesero de Salón</h3>
                <p className="text-xs text-neutral-400">ID: {editingWaiter.id}</p>
              </div>
              <button 
                onClick={() => {
                  setEditingWaiter(null);
                  setEditError(null);
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveWaiter} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={editingWaiter.name}
                  onChange={(e) => setEditingWaiter({ ...editingWaiter, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    DNI (8 dígitos numéricos, único) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={editingWaiter.dni || ''}
                    onChange={(e) => setEditingWaiter({ ...editingWaiter, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">{editingWaiter.dni?.length || 0}/8 dígitos</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Clave de Acceso <span className="text-neutral-400">(simulación)</span>
                  </label>
                  <input
                    type="text"
                    value={editingWaiter.password || '12345678'}
                    onChange={(e) => setEditingWaiter({ ...editingWaiter, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingWaiter.phone}
                    onChange={(e) => setEditingWaiter({ ...editingWaiter, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Código PIN de Mozo</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editingWaiter.pinCode || '1234'}
                    onChange={(e) => setEditingWaiter({ ...editingWaiter, pinCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Restaurante Asignado</label>
                  <select
                    value={editingWaiter.restaurantIds[0] || restaurants[0]?.id}
                    onChange={(e) => setEditingWaiter({ ...editingWaiter, restaurantIds: [e.target.value] })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                  >
                    {restaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Turno Asignado</label>
                  <select
                    value={editingWaiter.assignedShift || 'TARDE'}
                    onChange={(e) => setEditingWaiter({ ...editingWaiter, assignedShift: e.target.value as 'MANANA' | 'TARDE' | 'NOCHE' | 'COMPLETO' })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                  >
                    <option value="MANANA">Turno Mañana (10:00 - 16:00)</option>
                    <option value="TARDE">Turno Tarde (16:00 - 22:00)</option>
                    <option value="NOCHE">Turno Noche (20:00 - 02:00)</option>
                    <option value="COMPLETO">Turno Completo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Estado de Conexión</label>
                <select
                  value={editingWaiter.status}
                  onChange={(e) => setEditingWaiter({ ...editingWaiter, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                >
                  <option value="active">En Turno Activo (Recibe comandas)</option>
                  <option value="inactive">Inactivo / Fuera de turno</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingWaiter(null);
                    setEditError(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL EDITAR REPARTIDOR                                       */}
      {/* ============================================================= */}
      {editingDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-700 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Editar Repartidor Motorizado</h3>
                <p className="text-xs text-neutral-400">ID: {editingDelivery.id}</p>
              </div>
              <button 
                onClick={() => {
                  setEditingDelivery(null);
                  setEditError(null);
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveDelivery} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre / Identificador</label>
                <input
                  type="text"
                  value={editingDelivery.name}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    DNI (8 dígitos numéricos, único) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={editingDelivery.dni || ''}
                    onChange={(e) => setEditingDelivery({ ...editingDelivery, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">{editingDelivery.dni?.length || 0}/8 dígitos</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Clave de Acceso <span className="text-neutral-400">(simulación)</span>
                  </label>
                  <input
                    type="text"
                    value={editingDelivery.password || '12345678'}
                    onChange={(e) => setEditingDelivery({ ...editingDelivery, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Tipo de Vehículo</label>
                  <select
                    value={editingDelivery.vehicleType || 'MOTO'}
                    onChange={(e) => setEditingDelivery({ ...editingDelivery, vehicleType: e.target.value as 'MOTO' | 'BICI' | 'AUTO' })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                  >
                    <option value="MOTO">Motocicleta</option>
                    <option value="BICI">Bicicleta / E-Bike</option>
                    <option value="AUTO">Automóvil</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Número de Placa</label>
                  <input
                    type="text"
                    value={editingDelivery.licensePlate || ''}
                    onChange={(e) => setEditingDelivery({ ...editingDelivery, licensePlate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={editingDelivery.phone}
                    onChange={(e) => setEditingDelivery({ ...editingDelivery, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Estado de Flota</label>
                  <select
                    value={editingDelivery.status}
                    onChange={(e) => setEditingDelivery({ ...editingDelivery, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                  >
                    <option value="active">Activo (Disponible para despacho)</option>
                    <option value="inactive">Inactivo / Fuera de ruta</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDelivery(null);
                    setEditError(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL EDITAR CLIENTE                                          */}
      {/* ============================================================= */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-700 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Editar Cliente / Comensal</h3>
                <p className="text-xs text-neutral-400">ID: {editingCustomer.id}</p>
              </div>
              <button 
                onClick={() => {
                  setEditingCustomer(null);
                  setEditError(null);
                }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    DNI (8 dígitos numéricos, único) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={editingCustomer.dni || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">{editingCustomer.dni?.length || 0}/8 dígitos</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Clave de Acceso <span className="text-neutral-400">(simulación)</span>
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.password || '12345678'}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Correo</label>
                  <input
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Nivel de Membresía VIP</label>
                  <select
                    value={editingCustomer.vipTier || 'STANDARD'}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, vipTier: e.target.value as 'STANDARD' | 'SILVER' | 'GOLD' | 'BLACK_VIP' })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                  >
                    <option value="STANDARD">Standard (Sin beneficios extra)</option>
                    <option value="SILVER">Silver (5% de descuento)</option>
                    <option value="GOLD">Gold (10% de descuento)</option>
                    <option value="BLACK_VIP">Black VIP (Mesa prioritaria + 15%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Saldo a Favor ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={editingCustomer.creditBalance || 0}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, creditBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL EDITAR PLANTILLA DE CARTA                               */}
      {/* ============================================================= */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-700 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Editar Plantilla de Carta</h3>
                <p className="text-xs text-neutral-400">ID: {editingTemplate.id}</p>
              </div>
              <button 
                onClick={() => setEditingTemplate(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Nombre de la Plantilla</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Insignia / Badge</label>
                  <input
                    type="text"
                    value={editingTemplate.badge}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Descripción de Estilo</label>
                <textarea
                  rows={2}
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Color Primario</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTemplate.primaryColor}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border border-neutral-700 bg-black cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingTemplate.primaryColor}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, primaryColor: e.target.value })}
                      className="w-full px-2 py-1.5 rounded bg-black border border-neutral-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Color de Fondo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTemplate.darkBgColor}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, darkBgColor: e.target.value })}
                      className="w-8 h-8 rounded border border-neutral-700 bg-black cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingTemplate.darkBgColor}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, darkBgColor: e.target.value })}
                      className="w-full px-2 py-1.5 rounded bg-black border border-neutral-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Modo de Layout</label>
                  <select
                    value={editingTemplate.layoutMode}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, layoutMode: e.target.value as 'grid' | 'alternating' | 'book' | 'compact' })}
                    className="w-full px-2 py-1.5 rounded bg-black border border-neutral-800 text-xs text-white cursor-pointer"
                  >
                    <option value="alternating">Alternado (Costa Marina)</option>
                    <option value="grid">Grid Cuadrícula (Brasas)</option>
                    <option value="compact">Compacto (Bistró)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Tipografía Principal</label>
                <select
                  value={editingTemplate.fontDisplay}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, fontDisplay: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 cursor-pointer"
                >
                  <option value="Cinzel, serif">Cinzel (Serifa Clásica Monumental)</option>
                  <option value="Plus Jakarta Sans, sans-serif">Plus Jakarta Sans (Moderna & Clara)</option>
                  <option value="Syne, sans-serif">Syne (Geométrica Urbana)</option>
                  <option value="Playfair Display, serif">Playfair Display (Editorial)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">URL Imagen Muestra</label>
                <input
                  type="text"
                  value={editingTemplate.thumbnailUrl}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, thumbnailUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
