import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  DollarSign,
  Phone,
  MessageCircle,
  Package,
  ArrowRight,
  Filter,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  User,
} from 'lucide-react';
import { ReservaItem, ReservaStatus, ProductItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface ReservasViewProps {
  reservas: ReservaItem[];
  products: ProductItem[];
  onOpenNuevaReserva?: () => void;
  onOpenCreateReserva?: () => void;
  onMarcarRetirada: (
    reservaId: string,
    balancePaymentMethod: string
  ) => void;
  onEliminarReserva: (reservaId: string) => void;
  onEliminarCaducadas: () => void;
  onNavigateToStock: () => void;
}

export const ReservasView: React.FC<ReservasViewProps> = ({
  reservas,
  products,
  onOpenNuevaReserva,
  onOpenCreateReserva,
  onMarcarRetirada,
  onEliminarReserva,
  onEliminarCaducadas,
  onNavigateToStock,
}) => {
  const { user } = useAuth();
  const businessName = user?.businessName?.trim() || 'tu boutique';
  const handleOpenNewReserva = onOpenNuevaReserva || onOpenCreateReserva || (() => {});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReservaStatus>('all');
  const [reservaToPickup, setReservaToPickup] = useState<ReservaItem | null>(null);
  const [balancePaymentMethod, setBalancePaymentMethod] = useState<string>('efectivo');
  const [reservaToDelete, setReservaToDelete] = useState<ReservaItem | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const activas = reservas.filter((r) => r.status === 'activa');
    const caducadas = reservas.filter((r) => r.status === 'caducada');
    const retiradas = reservas.filter((r) => r.status === 'retirada');
    const totalSenasRetenidas = activas.reduce((acc, r) => acc + r.depositAmount, 0);

    return {
      total: reservas.length,
      activasCount: activas.length,
      caducadasCount: caducadas.length,
      retiradasCount: retiradas.length,
      totalSenasRetenidas,
    };
  }, [reservas]);

  // Filtered reservations
  const filtered = useMemo(() => {
    return reservas.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.garmentName.toLowerCase().includes(q) ||
        r.garmentSku.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.customerNotes && r.customerNotes.toLowerCase().includes(q))
      );
    });
  }, [reservas, statusFilter, searchTerm]);

  // WhatsApp reminder generator
  const handleOpenWhatsApp = (reserva: ReservaItem) => {
    const cleanPhone = reserva.customerPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;
    const text = encodeURIComponent(
      `Hola ${reserva.customerName}! Te saludamos de ${businessName}.\n\nTe recordamos que tu reserva de "${reserva.garmentName}" (Talle ${reserva.size}, ${reserva.colorName}) por un total de $${reserva.totalPrice.toLocaleString('es-AR')} tiene una seña registrada de $${reserva.depositAmount.toLocaleString('es-AR')}.\n\nEl saldo restante a abonar es de $${reserva.pendingBalance.toLocaleString('es-AR')}, con fecha límite de retiro hasta el ${reserva.expiresAt}.\n\n¡Te esperamos en el local!`
    );
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  const handleConfirmPickup = () => {
    if (!reservaToPickup) return;
    onMarcarRetirada(reservaToPickup.id, balancePaymentMethod);
    setReservaToPickup(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Reservas con Seña
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {stats.caducadasCount > 0 && (
            <button
              id="btn-limpiar-caducadas"
              onClick={onEliminarCaducadas}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-[#ba1a1a] text-xs font-bold rounded-full transition-all border border-rose-200 flex items-center gap-1.5"
              title="Eliminar todas las reservas vencidas y liberar prendas para el perchero"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpiar {stats.caducadasCount} Caducadas</span>
            </button>
          )}

          <button
            id="btn-nueva-reserva"
            onClick={handleOpenNewReserva}
            className="px-5 py-2.5 bg-[#42308f] hover:bg-[#5a49a8] text-white text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <span className="text-[11px] font-bold text-[#5e5d69] uppercase tracking-wider block">
            Activas en Perchero
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-2xl font-black text-[#42308f]">
              {stats.activasCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">Vigentes</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <span className="text-[11px] font-bold text-[#5e5d69] uppercase tracking-wider block">
            Caducadas / Vencidas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-2xl font-black text-[#ba1a1a]">
              {stats.caducadasCount}
            </span>
            <span className="text-[11px] text-rose-600 font-bold">Requieren atención</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <span className="text-[11px] font-bold text-[#5e5d69] uppercase tracking-wider block">
            Ya Retiradas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-2xl font-black text-emerald-700">
              {stats.retiradasCount}
            </span>
            <span className="text-[11px] text-gray-500">Completadas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <span className="text-[11px] font-bold text-[#5e5d69] uppercase tracking-wider block">
            Señas Retenidas
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-heading text-xl font-black text-[#0b1c30]">
              ${stats.totalSenasRetenidas.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#c9c4d3]/40 card-shadow overflow-x-auto">
          {[
            { id: 'all', label: 'Todas', count: stats.total },
            { id: 'activa', label: 'Activas', count: stats.activasCount },
            { id: 'caducada', label: 'Caducadas', count: stats.caducadasCount },
            { id: 'retirada', label: 'Retiradas', count: stats.retiradasCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#42308f] text-white shadow-xs'
                  : 'text-[#5e5d69] hover:text-[#42308f] hover:bg-[#f8f9ff]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-[#797583]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#797583] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por clienta, WhatsApp, prenda o código..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#c9c4d3]/40 rounded-full focus:outline-none focus:border-[#42308f]"
          />
        </div>
      </div>

      {/* Reservations List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#c9c4d3]/40 card-shadow">
          <div className="w-14 h-14 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#0b1c30]">
            No hay reservas en esta sección
          </h3>
          <p className="text-xs text-[#797583] max-w-sm mx-auto mt-1 mb-5">
            {searchTerm || statusFilter !== 'all'
              ? 'Probá ajustando el filtro de estado o el término de búsqueda.'
              : 'Cuando una clienta señe una prenda en el local, creá su reserva aquí para apartar la prenda y llevar el control.'}
          </p>
          <button
            onClick={handleOpenNewReserva}
            className="px-6 py-2.5 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] transition-all shadow-sm"
          >
            Crear Primera Reserva
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((res) => {
            const isCaducada = res.status === 'caducada';
            const isRetirada = res.status === 'retirada';
            const isActiva = res.status === 'activa';

            return (
              <div
                key={res.id}
                className={`bg-white rounded-3xl border transition-all card-shadow flex flex-col justify-between overflow-hidden ${
                  isCaducada
                    ? 'border-rose-300 bg-rose-50/20'
                    : isRetirada
                    ? 'border-gray-200 opacity-80'
                    : 'border-[#c9c4d3]/50 hover:border-[#42308f]/50'
                }`}
              >
                {/* Header Card */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#42308f] bg-[#eff4ff] px-2.5 py-1 rounded-xl border border-[#42308f]/20">
                        {res.code}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Creada el {res.createdAt}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isActiva
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isCaducada
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {isActiva && <Clock className="w-3 h-3 text-emerald-600" />}
                      {isCaducada && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      {isRetirada && <CheckCircle2 className="w-3 h-3 text-gray-600" />}
                      <span>
                        {isActiva
                          ? `Vence: ${res.expiresAt}`
                          : isCaducada
                          ? `Caducó (${res.expiresAt})`
                          : `Retirada (${res.pickedUpAt || 'Entregada'})`}
                      </span>
                    </span>
                  </div>

                  {/* Prenda details */}
                  <div className="p-3 bg-[#f8f9ff] rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#0b1c30]">
                        {res.garmentName}
                      </h4>
                      <p className="text-xs text-[#5e5d69] mt-0.5">
                        Talle <strong className="text-gray-800">{res.size}</strong> • Color:{' '}
                        <strong>{res.colorName}</strong> •{' '}
                        <span className="font-mono font-bold text-[#42308f]">
                          Cód: {res.garmentSku}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block font-medium">Total prenda</span>
                      <span className="font-heading font-extrabold text-sm text-[#0b1c30]">
                        ${res.totalPrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Client details & Notes */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-[#42308f] flex items-center justify-center font-bold text-xs">
                        {res.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{res.customerName}</p>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {res.customerPhone}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(res)}
                      className="px-2.5 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-colors border border-[#25D366]/30"
                      title="Enviar recordatorio de retiro por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>Recordar por WA</span>
                    </button>
                  </div>

                  {res.customerNotes && (
                    <p className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-xl italic border border-gray-100">
                      "{res.customerNotes}"
                    </p>
                  )}

                  {/* Financial Breakdown (Seña vs Saldo) */}
                  <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                        Seña Pagada ({res.depositPaymentMethod})
                      </span>
                      <span className="font-heading font-extrabold text-emerald-950 text-sm">
                        ${res.depositAmount.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      isRetirada 
                        ? 'bg-gray-50 border-gray-200 text-gray-400' 
                        : 'bg-amber-50/70 border-amber-200/60'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase block ${
                        isRetirada ? 'text-gray-500' : 'text-amber-800'
                      }`}>
                        {isRetirada ? 'Saldo Cancelado' : 'Saldo al Retirar'}
                      </span>
                      <span className={`font-heading font-extrabold text-sm ${
                        isRetirada ? 'text-gray-700' : 'text-[#42308f]'
                      }`}>
                        ${res.pendingBalance.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setReservaToDelete(res)}
                    className="text-xs font-bold text-gray-400 hover:text-[#ba1a1a] flex items-center gap-1 p-1 transition-colors"
                    title="Eliminar reserva y liberar prenda"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>

                  {!isRetirada && (
                    <button
                      type="button"
                      id={`btn-retirar-${res.id}`}
                      onClick={() => setReservaToPickup(res)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar como Retirada</span>
                    </button>
                  )}

                  {isRetirada && (
                    <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Retiro completado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Confirmar Retiro & Cobro de Saldo Restante */}
      {reservaToPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#c9c4d3]/40 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#0b1c30]">
                  Registrar Retiro de Prenda
                </h3>
                <p className="text-xs text-gray-500">
                  Reserva {reservaToPickup.code} • {reservaToPickup.customerName}
                </p>
              </div>
              <button
                onClick={() => setReservaToPickup(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#f8f9ff] rounded-2xl text-xs space-y-1">
              <p className="font-bold text-gray-900">{reservaToPickup.garmentName}</p>
              <p className="text-gray-500">
                Talle {reservaToPickup.size} • {reservaToPickup.colorName} (Cód: {reservaToPickup.garmentSku})
              </p>
              <div className="pt-2 border-t border-gray-200/60 flex justify-between font-bold text-sm text-[#0b1c30]">
                <span>Saldo pendiente a cobrar:</span>
                <span className="text-[#42308f] font-heading font-extrabold">
                  ${reservaToPickup.pendingBalance.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#5e5d69] block mb-1.5">
                ¿Cómo abona el saldo restante?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-3.5 h-3.5" /> },
                  { id: 'transferencia', label: 'MP / Transf', icon: <Smartphone className="w-3.5 h-3.5" /> },
                  { id: 'debito', label: 'Débito / Tarj', icon: <CreditCard className="w-3.5 h-3.5" /> },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setBalancePaymentMethod(m.id)}
                    className={`p-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      balancePaymentMethod === m.id
                        ? 'bg-[#42308f] text-white border-[#42308f]'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Al confirmar, la reserva pasará al estado "Retirada", se descontará la prenda del inventario y se asentará el cobro del saldo restante en los movimientos de caja.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReservaToPickup(null)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmPickup}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirmar y Entregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación de Reserva */}
      {reservaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-heading font-extrabold text-base text-[#0b1c30]">
                ¿Eliminar esta reserva?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Se eliminará el apartado de <strong>{reservaToDelete.garmentName}</strong> ({reservaToDelete.customerName}). La prenda quedará libre en el perchero para ser vendida.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReservaToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onEliminarReserva(reservaToDelete.id);
                  setReservaToDelete(null);
                }}
                className="flex-1 py-2.5 bg-[#ba1a1a] hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
