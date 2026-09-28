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
import { TableQrModal } from './TableQrModal';
import { EmptyRestaurantState } from './EmptyRestaurantState';
import { getSafeActiveRestaurant } from '../utils/restaurantUtils';

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
  const userRestIds = Array.isArray(currentUser?.restaurantIds) ? currentUser.restaurantIds : [];
  const waiterRestaurants = userRestIds.includes('all')
    ? (restaurants || []).filter(Boolean)
    : (restaurants || []).filter(r => r && userRestIds.includes(r.id));

  const [selectedRestId, setSelectedRestId] = useState<string>(
    waiterRestaurants[0]?.id || (restaurants || [])[0]?.id || ''
  );

  const activeRest = getSafeActiveRestaurant(waiterRestaurants, selectedRestId) ?? getSafeActiveRestaurant(restaurants, null);

  if (!activeRest) {
    return (
      <EmptyRestaurantState
        roleName="Mesero / Salón"
        title="No hay un restaurante asignado"
        description="No tienes ningún restaurante activo asignado en este momento. Consulta con el administrador o gerente para habilitar tu sede."
      />
    );
  }

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
    onOpenCustomerPreview(activeRest, 'DINE_IN', String(table.number).padStart(2, '0'));
  };

  const handleOrderSubmitted = (newOrder: Order) => {
    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">Portal de Atención en Salón</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-200 border border-neutral-700 font-bold">
                Rol: Mesero
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              Atendiendo como <strong className="text-white">{currentUser.name}</strong> (DNI: {currentUser.dni}). Selección de mesas, escaneo QR y toma de comandas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* QR Scanner Trigger */}
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition cursor-pointer shadow-sm"
          >
            <Camera className="w-4 h-4 text-black" />
            <span>Escanear QR de Mesa</span>
          </button>

          <button
            onClick={() => onOpenCustomerPreview(activeRest, 'DINE_IN')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-bold text-white hover:bg-neutral-700 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-300" />
            <span>Ver Carta ({activeRest.name})</span>
          </button>
        </div>
      </div>

      {/* Sede Selector & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        {/* Restaurant selector if multiple */}
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-neutral-600" />
          <span className="text-xs text-neutral-600 font-bold">Sede:</span>
          <select
            value={selectedRestId}
            onChange={(e) => setSelectedRestId(e.target.value)}
            className="bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-500 shadow-sm"
          >
            {waiterRestaurants.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.tables?.length || r.totalTablesCount || 0} mesas)
              </option>
            ))}
          </select>
        </div>

        {/* 3 Main Waiter Navigation Tabs */}
        <div className="flex items-center gap-1 bg-neutral-200/80 p-1 rounded-2xl border border-neutral-300 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'tables'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-700 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mesas & Salón ({restaurantTables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-700 hover:text-neutral-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Comandas Cocina ({salonOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'shifts'
                ? 'bg-neutral-900 text-white shadow-md'
                : 'text-neutral-700 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mis Turnos & Horarios</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: MESAS & SALÓN (SELECCIÓN Y QR DE MESAS - FONDO BLANCO)      */}
      {/* ================================================================= */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          
          {/* Table Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setTableFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tableFilter === 'all'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                Todas ({restaurantTables.length})
              </button>

              <button
                onClick={() => setTableFilter('my-tables')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  tableFilter === 'my-tables'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Mis Mesas Asignadas ({myAssignedTables.length})</span>
              </button>

              <button
                onClick={() => setTableFilter('available')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tableFilter === 'available'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                Disponibles ({restaurantTables.filter(t => t.status === 'AVAILABLE').length})
              </button>

              <button
                onClick={() => setTableFilter('occupied')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tableFilter === 'occupied'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                Con Comanda ({restaurantTables.filter(t => t.status === 'OCCUPIED').length})
              </button>
            </div>

            {/* Zone Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-700 font-bold">Zona:</span>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="bg-neutral-100 border border-neutral-300 rounded-xl px-3 py-1 text-xs font-bold text-neutral-900 shadow-sm"
              >
                <option value="all">Todas las Zonas</option>
                <option value="SALON">Salón Principal</option>
                <option value="TERRAZA">Terraza Exterior</option>
                <option value="VIP">Box VIP</option>
                <option value="BARRA">Barra</option>
              </select>
            </div>
          </div>

          {/* Interactive Tables Grid - White Cards with Clean Legible Text */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredTables.map((tbl) => {
              const isMine = tbl.assignedWaiterIds?.includes(currentUser.id);
              const isOccupied = tbl.status === 'OCCUPIED';
              const isReserved = tbl.status === 'RESERVED';

              return (
                <div
                  key={tbl.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-3 relative group bg-white shadow-sm hover:shadow-md ${
                    isOccupied
                      ? 'border-amber-400 ring-1 ring-amber-400/50'
                      : isReserved
                      ? 'border-purple-300'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 truncate">
                      {tbl.zone}
                    </span>

                    <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border shrink-0 ${
                      isOccupied ? 'bg-amber-100 text-amber-900 border-amber-300' :
                      isReserved ? 'bg-purple-100 text-purple-900 border-purple-300' :
                      'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      {isOccupied ? 'OCUPADA' : isReserved ? 'RESERVA' : 'LIBRE'}
                    </span>
                  </div>

                  {/* Table Center Graphic */}
                  <div className="text-center space-y-1 py-1">
                    <h4 className="text-base font-black text-neutral-900 font-mono">
                      {tbl.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-neutral-600">
                      Cap. {tbl.capacity} personas
                    </p>

                    {isMine && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-neutral-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shadow-sm">
                        <UserCheck className="w-2.5 h-2.5 text-amber-700" />
                        <span>Tu Mesa</span>
                      </span>
                    )}
                  </div>

                  {/* Table Actions */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => onOpenCustomerPreview(activeRest, 'DINE_IN', String(tbl.number).padStart(2, '0'))}
                      className="w-full py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3 h-3 text-white" />
                      <span>{isOccupied ? 'Ver / Pedir' : 'Tomar Pedido'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTableForQrPreview(tbl)}
                        className="flex-1 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 border border-neutral-200"
                        title="Ver Código QR de Mesa"
                      >
                        <QrCode className="w-2.5 h-2.5 text-neutral-600" />
                        <span>Ver QR</span>
                      </button>

                      <button
                        onClick={() => onOpenCustomerPreview(activeRest, 'DINE_IN', String(tbl.number).padStart(2, '0'))}
                        className="p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition cursor-pointer"
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
      {/* TAB 2: COMANDAS ACTIVAS DE COCINA (FONDO BLANCO)                   */}
      {/* ================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'PENDING', 'IN_KITCHEN', 'READY', 'DELIVERED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 shadow-sm'
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
            <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3">
              <Utensils className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs font-bold text-neutral-600">
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
                    className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-sm hover:border-neutral-300 hover:shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-neutral-900 font-mono font-bold text-xs flex items-center justify-center text-white shadow-sm shrink-0">
                            {order.orderNumber}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-900">{order.tableNumber || 'Mesa Sin Asignar'}</h4>
                            <span className="text-[11px] font-semibold text-neutral-600">{order.customerName}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase border shrink-0 ${
                          isPending ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          isInKitchen ? 'bg-sky-100 text-sky-900 border-sky-300' :
                          isReady ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          'bg-neutral-100 text-neutral-700 border-neutral-300'
                        }`}>
                          {isPending ? 'Pendiente' :
                           isInKitchen ? 'Cocina' :
                           isReady ? '¡Listo!' : 'Servido'}
                        </span>
                      </div>

                      {/* Items List with Observations - High contrast readable text */}
                      <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2">
                        {order.items.map(item => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-900 font-semibold">
                                <strong className="text-amber-700 font-mono mr-1">{item.quantity}x</strong>
                                {item.name}
                              </span>
                              <span className="font-mono font-bold text-neutral-900">
                                S/ {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>

                            {/* Unit observations if any */}
                            {item.units && item.units.length > 0 && (
                              <div className="pl-3 border-l-2 border-neutral-300 space-y-0.5">
                                {item.units.map(u => (
                                  <p key={u.unitNumber} className="text-[10px] text-neutral-600">
                                    • U{u.unitNumber}: {u.observation || 'Sin notas'} {u.selectedAddons && u.selectedAddons.length > 0 ? `(+${u.selectedAddons.map(a => a.name).join(', ')})` : ''}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                        <span className="text-neutral-600 font-bold">Total comanda:</span>
                        <span className="font-mono font-black text-neutral-900 text-sm">S/ {order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Actions Pipeline */}
                    <div className="pt-2">
                      {isPending && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'IN_KITCHEN')}
                          className="w-full py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>Enviar Comanda a Cocina</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isInKitchen && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'READY')}
                          className="w-full py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar Listo para Servir</span>
                        </button>
                      )}

                      {isReady && (
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'DELIVERED')}
                          className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Servido en Mesa y Cobrado</span>
                        </button>
                      )}

                      {isDelivered && (
                        <div className="text-center py-1.5 text-[11px] text-neutral-500 font-bold font-mono bg-neutral-100 rounded-xl border border-neutral-200">
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
      {/* TAB 3: MIS TURNOS & HORARIOS DE LA SEDE (FONDO BLANCO)             */}
      {/* ================================================================= */}
      {activeTab === 'shifts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* My Assigned Shifts */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-700" />
                <span>Mis Turnos Asignados ({currentUser.name})</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                {myShifts.length} turnos
              </span>
            </div>

            <div className="space-y-3">
              {myShifts.map(shift => (
                <div 
                  key={shift.id}
                  className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-neutral-900">{shift.name}</h4>
                    <span className="text-xs font-mono font-black text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-sm">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {shift.applicableDays.map(day => (
                      <span key={day} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-neutral-800 border border-neutral-200 shadow-2xs">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Restaurant Weekly Schedule */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-700" />
                <span>Horario General de la Sede ({activeRest.name})</span>
              </h3>
            </div>

            <div className="space-y-2">
              {(activeRest.weeklySchedule || []).map(sched => (
                <div 
                  key={sched.day}
                  className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-neutral-900">{sched.day}</span>
                  {sched.isOpen ? (
                    <span className="font-mono text-neutral-900 font-black">
                      {sched.openTime} - {sched.closeTime}
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[10px] font-bold">Cerrado</span>
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
