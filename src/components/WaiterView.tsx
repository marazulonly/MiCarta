import React, { useState } from 'react';
import { 
  ChefHat, 
  Store, 
  Clock, 
  Utensils, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Eye, 
  ArrowRight,
  UserCheck,
  Search,
  Filter,
  QrCode,
  Camera,
  Calendar,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';
import { Restaurant, Order, MenuItem, MenuCategory, User, OrderStatus, RestaurantTable, StaffShift } from '../types';
import { WaiterQrScannerModal } from './WaiterQrScannerModal';
import { WaiterTableOrderModal } from './WaiterTableOrderModal';
import { TableQrModal } from './TableQrModal';

interface WaiterViewProps {
  currentUser: User;
  restaurants: Restaurant[];
  orders: Order[];
  menuItems: MenuItem[];
  categories?: MenuCategory[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onSimulateNewOrder: () => void;
  onOrderCreated?: (newOrder: Order) => void;
  onOpenCustomerPreview: (restaurant: Restaurant, mode?: 'DINE_IN' | 'DELIVERY', tableNumber?: string) => void;
}

type WaiterTab = 'tables' | 'orders' | 'shifts';

export const WaiterView: React.FC<WaiterViewProps> = ({
  currentUser,
  restaurants,
  orders,
  menuItems,
  categories = [],
  onUpdateOrderStatus,
  onSimulateNewOrder,
  onOrderCreated,
  onOpenCustomerPreview,
}) => {
  const [activeTab, setActiveTab] = useState<WaiterTab>('tables');

  // Waiter's assigned restaurants
  const waiterRestaurants = currentUser.restaurantIds.includes('all')
    ? restaurants
    : restaurants.filter(r => currentUser.restaurantIds.includes(r.id));

  const [selectedRestId, setSelectedRestId] = useState<string>(
    waiterRestaurants[0]?.id || restaurants[0]?.id
  );

  const activeRest = restaurants.find(r => r.id === selectedRestId) || restaurants[0];

  // Modals for Waiter QR Scan and Table Order
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<RestaurantTable | null>(null);
  const [selectedTableForQrPreview, setSelectedTableForQrPreview] = useState<RestaurantTable | null>(null);

  // Table filters
  const [tableFilter, setTableFilter] = useState<'all' | 'my-tables' | 'available' | 'occupied'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  // Salon/Dine-in orders for this restaurant
  const salonOrders = orders.filter(o => 
    o.restaurantId === activeRest.id && (o.type === 'DINE_IN' || o.type === 'TAKEAWAY')
  );

  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'IN_KITCHEN' | 'READY' | 'DELIVERED'>('all');

  const filteredOrders = salonOrders.filter(o => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  // Table list for the active restaurant
  const restaurantTables: RestaurantTable[] = activeRest.tables || [];

  const myAssignedTables = restaurantTables.filter(t => 
    t.assignedWaiterIds?.includes(currentUser.id)
  );

  const filteredTables = restaurantTables.filter(tbl => {
    if (tableFilter === 'my-tables') {
      if (!tbl.assignedWaiterIds?.includes(currentUser.id)) return false;
    }
    if (tableFilter === 'available' && tbl.status !== 'AVAILABLE') return false;
    if (tableFilter === 'occupied' && tbl.status !== 'OCCUPIED') return false;
    if (zoneFilter !== 'all' && tbl.zone !== zoneFilter) return false;
    return true;
  });

  // Waiter's shifts for this restaurant
  const myShifts: StaffShift[] = (activeRest.shifts || []).filter(s => 
    s.assignedUserIds?.includes(currentUser.id) || s.roleTarget === 'WAITER' || s.roleTarget === 'ALL'
  );

  // Handle table detection from QR scanner
  const handleTableDetected = (table: RestaurantTable) => {
    setSelectedTableForOrder(table);
  };

  const handleOrderSubmitted = (newOrder: Order) => {
    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-neutral-900 to-black border border-sky-900/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Portal de Atención en Salón</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                Rol: Mesero
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Atendiendo como <strong className="text-neutral-200">{currentUser.name}</strong> (DNI: {currentUser.dni}). Selección de mesas, escaneo QR y toma de comandas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* QR Scanner Trigger */}
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-black text-xs font-bold hover:brightness-110 transition cursor-pointer shadow-lg shadow-sky-950/40"
          >
            <Camera className="w-4 h-4" />
            <span>📸 Escanear QR de Mesa</span>
          </button>

          <button
            onClick={() => onOpenCustomerPreview(activeRest, 'DINE_IN')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Ver Carta ({activeRest.name})</span>
          </button>
        </div>
      </div>

      {/* Sede Selector & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        {/* Restaurant selector if multiple */}
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-sky-400" />
          <span className="text-xs text-neutral-400 font-medium">Sede:</span>
          <select
            value={selectedRestId}
            onChange={(e) => setSelectedRestId(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
          >
            {waiterRestaurants.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.tables?.length || r.totalTablesCount || 0} mesas)
              </option>
            ))}
          </select>
        </div>

        {/* 3 Main Waiter Navigation Tabs */}
        <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tables'
                ? 'bg-sky-400 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mesas & Salón ({restaurantTables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-sky-400 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Comandas Cocina ({salonOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'shifts'
                ? 'bg-sky-400 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mis Turnos & Horarios</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: MESAS & SALÓN (SELECCIÓN Y QR DE MESAS)                     */}
      {/* ================================================================= */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          
          {/* Table Filters Bar */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setTableFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tableFilter === 'all'
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Todas ({restaurantTables.length})
              </button>

              <button
                onClick={() => setTableFilter('my-tables')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  tableFilter === 'my-tables'
                    ? 'bg-sky-400 text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Mis Mesas Asignadas ({myAssignedTables.length})</span>
              </button>

              <button
                onClick={() => setTableFilter('available')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tableFilter === 'available'
                    ? 'bg-emerald-400 text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Disponibles ({restaurantTables.filter(t => t.status === 'AVAILABLE').length})
              </button>

              <button
                onClick={() => setTableFilter('occupied')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tableFilter === 'occupied'
                    ? 'bg-amber-400 text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                Con Comanda ({restaurantTables.filter(t => t.status === 'OCCUPIED').length})
              </button>
            </div>

            {/* Zone Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-medium">Zona:</span>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="bg-black border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white"
              >
                <option value="all">Todas las Zonas</option>
                <option value="SALON">Salón Principal</option>
                <option value="TERRAZA">Terraza Exterior</option>
                <option value="VIP">Box VIP</option>
                <option value="BARRA">Barra</option>
              </select>
            </div>
          </div>

          {/* Interactive Tables Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredTables.map((tbl) => {
              const isMine = tbl.assignedWaiterIds?.includes(currentUser.id);
              const isOccupied = tbl.status === 'OCCUPIED';
              const isReserved = tbl.status === 'RESERVED';

              return (
                <div
                  key={tbl.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-3 relative group ${
                    isOccupied
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-950/20'
                      : isReserved
                      ? 'bg-purple-950/30 border-purple-500/50'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-sky-500/80'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-neutral-300 border border-neutral-800">
                      {tbl.zone}
                    </span>

                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isOccupied ? 'bg-amber-400 text-black' :
                      isReserved ? 'bg-purple-400 text-black' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}>
                      {isOccupied ? 'OCUPADA' : isReserved ? 'RESERVA' : 'LIBRE'}
                    </span>
                  </div>

                  {/* Table Center Graphic */}
                  <div className="text-center space-y-1 py-1">
                    <h4 className="text-base font-black text-white font-mono">
                      {tbl.name}
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      Cap. {tbl.capacity} personas
                    </p>

                    {isMine && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800">
                        <UserCheck className="w-2.5 h-2.5" />
                        <span>Tu Mesa</span>
                      </span>
                    )}
                  </div>

                  {/* Table Actions */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                    <button
                      onClick={() => setSelectedTableForOrder(tbl)}
                      className="w-full py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isOccupied ? 'Ver / Pedir' : 'Tomar Pedido'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTableForQrPreview(tbl)}
                        className="flex-1 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
                        title="Ver Código QR de Mesa"
                      >
                        <QrCode className="w-2.5 h-2.5 text-amber-400" />
                        <span>Ver QR</span>
                      </button>

                      <button
                        onClick={() => onOpenCustomerPreview(activeRest, 'DINE_IN', String(tbl.number).padStart(2, '0'))}
                        className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                        title="Probar Carta de Mesa"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: COMANDAS ACTIVAS DE COCINA                                 */}
      {/* ================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['all', 'PENDING', 'IN_KITCHEN', 'READY', 'DELIVERED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-sky-400 text-black shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {st === 'all' && `Todas las Comandas (${salonOrders.length})`}
                {st === 'PENDING' && `Pendientes (${salonOrders.filter(o => o.status === 'PENDING').length})`}
                {st === 'IN_KITCHEN' && `En Cocina (${salonOrders.filter(o => o.status === 'IN_KITCHEN').length})`}
                {st === 'READY' && `Listos para Servir (${salonOrders.filter(o => o.status === 'READY').length})`}
                {st === 'DELIVERED' && `Servidos & Cerrados (${salonOrders.filter(o => o.status === 'DELIVERED').length})`}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-neutral-800 space-y-3">
              <Utensils className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-xs text-neutral-400">
                No hay comandas activas en este filtro para {activeRest.name}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => {
                const isPending = order.status === 'PENDING';
                const isInKitchen = order.status === 'IN_KITCHEN';
                const isReady = order.status === 'READY';
                const isDelivered = order.status === 'DELIVERED';

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3 relative hover:border-neutral-700 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 font-mono font-bold text-xs flex items-center justify-center text-white">
                            {order.orderNumber}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white">{order.tableNumber || 'Mesa Sin Asignar'}</h4>
                            <span className="text-[11px] text-neutral-400">{order.customerName}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isPending ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                          isInKitchen ? 'bg-sky-950/80 text-sky-300 border border-sky-800' :
                          isReady ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' :
                          'bg-neutral-800 text-neutral-400'
                        }`}>
                          {isPending ? 'Pendiente' :
                           isInKitchen ? 'Cocina' :
                           isReady ? '¡Listo!' : 'Servido'}
                        </span>
                      </div>

                      {/* Items List with Observations */}
                      <div className="bg-black/40 p-2.5 rounded-xl border border-neutral-800/80 space-y-2">
                        {order.items.map(item => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-200">
                                <strong className="text-white font-mono mr-1">{item.quantity}x</strong>
                                {item.name}
                              </span>
                              <span className="font-mono text-neutral-400">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>

                            {/* Unit observations if any */}
                            {item.units && item.units.length > 0 && (
                              <div className="pl-3 border-l border-neutral-800 space-y-0.5">
                                {item.units.map(u => (
                                  <p key={u.unitNumber} className="text-[10px] text-amber-300/80">
                                    • U{u.unitNumber}: {u.observation || 'Sin notas'} {u.selectedAddons && u.selectedAddons.length > 0 ? `(+${u.selectedAddons.map(a => a.name).join(', ')})` : ''}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800/60">
                        <span className="text-neutral-400">Total comanda:</span>
                        <span className="font-mono font-black text-white">${order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Actions Pipeline */}
                    <div className="pt-2">
                      {isPending && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'IN_KITCHEN')}
                          className="w-full py-2 rounded-xl bg-sky-500 text-black font-bold text-xs hover:bg-sky-400 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Enviar Comanda a Cocina</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isInKitchen && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'READY')}
                          className="w-full py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar Listo para Servir</span>
                        </button>
                      )}

                      {isReady && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'DELIVERED')}
                          className="w-full py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                          <span>Servido en Mesa y Cobrado</span>
                        </button>
                      )}

                      {isDelivered && (
                        <div className="text-center py-1.5 text-[11px] text-neutral-500 font-mono">
                          Comanda completada exitosamente
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: MIS TURNOS & HORARIOS DE LA SEDE                           */}
      {/* ================================================================= */}
      {activeTab === 'shifts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* My Assigned Shifts */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Mis Turnos Asignados ({currentUser.name})</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-400">
                {myShifts.length} turnos
              </span>
            </div>

            <div className="space-y-3">
              {myShifts.map(shift => (
                <div 
                  key={shift.id}
                  className="p-4 rounded-xl bg-black/50 border border-neutral-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{shift.name}</h4>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {shift.applicableDays.map(day => (
                      <span key={day} className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Restaurant Weekly Schedule */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Horario General de la Sede ({activeRest.name})</span>
              </h3>
            </div>

            <div className="space-y-2">
              {(activeRest.weeklySchedule || []).map(sched => (
                <div 
                  key={sched.day}
                  className="p-2.5 rounded-xl bg-black/40 border border-neutral-800/80 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-white">{sched.day}</span>
                  {sched.isOpen ? (
                    <span className="font-mono text-emerald-400">
                      {sched.openTime} - {sched.closeTime}
                    </span>
                  ) : (
                    <span className="text-rose-400 text-[10px] font-bold">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* QR Scanner Modal */}
      {isQrScannerOpen && (
        <WaiterQrScannerModal
          isOpen={isQrScannerOpen}
          onClose={() => setIsQrScannerOpen(false)}
          restaurant={activeRest}
          tables={restaurantTables}
          onTableSelected={handleTableDetected}
        />
      )}

      {/* Table Order Taker Modal */}
      {selectedTableForOrder && (
        <WaiterTableOrderModal
          isOpen={!!selectedTableForOrder}
          onClose={() => setSelectedTableForOrder(null)}
          restaurant={activeRest}
          table={selectedTableForOrder}
          currentUser={currentUser}
          categories={categories}
          menuItems={menuItems}
          onOrderCreated={handleOrderSubmitted}
        />
      )}

      {/* Table QR Card Preview Modal */}
      {selectedTableForQrPreview && (
        <TableQrModal
          isOpen={!!selectedTableForQrPreview}
          onClose={() => setSelectedTableForQrPreview(null)}
          restaurant={activeRest}
          table={selectedTableForQrPreview}
          onTestTableMenu={(rest, tblNum) => {
            onOpenCustomerPreview(rest, 'DINE_IN', tblNum);
          }}
        />
      )}

    </div>
  );
};
