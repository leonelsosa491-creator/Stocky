import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CalendarCheck,
  Search,
  DollarSign,
  AlertCircle,
  Clock,
  User,
  Phone,
  FileText,
  Sparkles,
  Check,
  Calendar,
} from 'lucide-react';
import { ProductItem, ReservaItem } from '../types';

interface NuevaReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onCreateReserva: (reserva: Omit<ReservaItem, 'id' | 'code' | 'createdAt' | 'status'>) => void;
  initialProduct?: ProductItem | null;
}

const getTodayDateStr = () => new Date().toISOString().slice(0, 10);
const getFutureDateStr = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const NuevaReservaModal: React.FC<NuevaReservaModalProps> = ({
  isOpen,
  onClose,
  products,
  onCreateReserva,
  initialProduct,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(initialProduct || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [depositInput, setDepositInput] = useState<string>('');
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<'efectivo' | 'transferencia' | 'debito'>('efectivo');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [expirationDate, setExpirationDate] = useState<string>(getFutureDateStr(2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(initialProduct || null);
      setSearchQuery('');
      setQuantity(1);
      setDepositInput('');
      setDepositPaymentMethod('efectivo');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerNotes('');
      setExpirationDate(getFutureDateStr(2));
      setError(null);
    }
  }, [isOpen, initialProduct]);

  // Filter in-stock products
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.stock <= 0) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.colorName.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery]);

  if (!isOpen) return null;

  const totalPrice = selectedProduct ? selectedProduct.price * quantity : 0;
  const maxDepositAllowed = Math.floor(totalPrice / 2);
  const depositNum = parseFloat(depositInput) || 0;
  const pendingBalance = Math.max(0, totalPrice - depositNum);

  // Quick deposit percentage helper
  const handleSetDepositPercentage = (pct: number) => {
    if (!totalPrice) return;
    const calc = Math.floor((totalPrice * pct) / 100);
    setDepositInput(calc.toString());
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProduct) {
      setError('Por favor seleccioná la prenda que la clienta desea reservar.');
      return;
    }

    if (!customerName.trim()) {
      setError('El nombre de la clienta es obligatorio para identificar la reserva.');
      return;
    }

    if (!customerPhone.trim()) {
      setError('Ingresá el número de teléfono o WhatsApp para contactar a la clienta.');
      return;
    }

    if (depositNum <= 0) {
      setError('Las reservas requieren obligatoriamente señar dinero.');
      return;
    }

    // Regla solicitada: "las reservas solo se hacen señando dinero, la mitad o menos"
    if (depositNum > maxDepositAllowed) {
      setError(
        `Por política del local, la seña máxima permitida es la mitad ($${maxDepositAllowed.toLocaleString('es-AR')}) o menos. Para montos mayores debe registrarse directamente como venta.`
      );
      return;
    }

    if (!expirationDate) {
      setError('Por favor seleccioná una fecha de vencimiento desde el calendario.');
      return;
    }

    const expiresAt = expirationDate;

    onCreateReserva({
      garmentSku: selectedProduct.sku,
      garmentName: selectedProduct.name,
      category: selectedProduct.category,
      colorName: selectedProduct.colorName,
      size: selectedProduct.size,
      unitPrice: selectedProduct.price,
      quantity,
      totalPrice,
      depositAmount: depositNum,
      pendingBalance,
      depositPaymentMethod,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerNotes: customerNotes.trim(),
      expiresAt,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#c9c4d3]/40">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#42308f]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg text-[#0b1c30]">
                Nueva Reserva con Seña
              </h2>
              <p className="text-xs text-[#5e5d69]">
                Apartado de prenda en perchero. Seña requerida: la mitad (50%) o menos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Seleccionar Prenda en Stock */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5e5d69] block">
              1. Prenda a Reservar
            </label>

            {selectedProduct ? (
              <div className="p-3.5 bg-[#eff4ff]/60 border border-[#42308f]/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full ring-1 ring-black/20"
                    style={{ backgroundColor: selectedProduct.colorHex }}
                  />
                  <div>
                    <p className="text-xs font-bold text-[#0b1c30]">
                      {selectedProduct.name}
                    </p>
                    <p className="text-[11px] text-[#5e5d69]">
                      Talle {selectedProduct.size} • {selectedProduct.colorName} •{' '}
                      <span className="font-mono font-bold text-[#42308f]">
                        Cód: {selectedProduct.sku}
                      </span>{' '}
                      • Disp: {selectedProduct.stock} u.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-extrabold text-sm text-[#42308f]">
                    ${selectedProduct.price.toLocaleString('es-AR')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="text-xs font-bold text-[#ba1a1a] hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#797583] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar prenda por nombre, código #101, talle o color..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#42308f]"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-2xl divide-y divide-gray-100 bg-[#f8f9ff]">
                  {availableProducts.slice(0, 6).map((prod) => (
                    <button
                      key={prod.sku}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(prod);
                        setDepositInput('');
                      }}
                      className="w-full p-2.5 text-left hover:bg-white flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full ring-1 ring-black/15 shrink-0"
                          style={{ backgroundColor: prod.colorHex }}
                        />
                        <div>
                          <p className="text-xs font-bold text-[#0b1c30] group-hover:text-[#42308f]">
                            {prod.name}
                          </p>
                          <p className="text-[10px] text-[#5e5d69]">
                            Talle {prod.size} • {prod.colorName} •{' '}
                            <span className="font-mono font-semibold text-[#42308f]">
                              {prod.sku}
                            </span>{' '}
                            • {prod.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900 block">
                          ${prod.price.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          {prod.stock} disp.
                        </span>
                      </div>
                    </button>
                  ))}
                  {availableProducts.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No se encontraron prendas disponibles con ese criterio.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Regla de Seña (Obligatoria: 50% o menos) */}
          {selectedProduct && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-950 block">
                    2. Seña Abonada (La mitad o menos)
                  </span>
                  <p className="text-[11px] text-amber-800">
                    Total de la prenda:{' '}
                    <strong className="font-heading">
                      ${totalPrice.toLocaleString('es-AR')}
                    </strong>{' '}
                    • Máximo de seña permitido (50%):{' '}
                    <strong className="text-emerald-800">
                      ${maxDepositAllowed.toLocaleString('es-AR')}
                    </strong>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetDepositPercentage(30)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-[11px] font-bold text-amber-900 rounded-lg border border-amber-300 shadow-2xs"
                  >
                    30% (${Math.floor((totalPrice * 0.3)).toLocaleString('es-AR')})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDepositPercentage(50)}
                    className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-[11px] font-bold text-white rounded-lg shadow-2xs"
                  >
                    50% Máx (${maxDepositAllowed.toLocaleString('es-AR')})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">
                    Monto de Seña ($):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      min="100"
                      max={maxDepositAllowed}
                      step="0.01"
                      value={depositInput}
                      onChange={(e) => {
                        setDepositInput(e.target.value);
                        setError(null);
                      }}
                      placeholder={`Ej: ${maxDepositAllowed}`}
                      className="w-full pl-6 pr-3 py-1.5 text-xs font-bold text-emerald-950 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">
                    ¿Cómo abonó la seña?
                  </label>
                  <select
                    value={depositPaymentMethod}
                    onChange={(e) => setDepositPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-white border border-amber-300 rounded-xl focus:outline-none"
                  >
                    <option value="efectivo">Efectivo (Mostrador)</option>
                    <option value="transferencia">MP / Transferencia</option>
                    <option value="debito">Tarjeta Débito</option>
                  </select>
                </div>
              </div>

              {/* Live breakdown */}
              {depositNum > 0 && (
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                  <span className="text-amber-900">
                    Seña recibida: <strong>${depositNum.toLocaleString('es-AR')}</strong> (
                    {Math.round((depositNum / totalPrice) * 100)}% del total)
                  </span>
                  <span className="text-[#42308f] font-bold">
                    Saldo a pagar al retirar: <strong>${pendingBalance.toLocaleString('es-AR')}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3. Datos de la Clienta */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5e5d69] block">
              3. Datos de la Clienta
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Florencia Castro"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#42308f]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  WhatsApp / Celular *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: 11-5421-9988"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#42308f]"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Fecha de Vencimiento de la Reserva (Selección desde Calendario) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5e5d69] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#42308f]" />
                <span>4. Fecha de Vencimiento de la Reserva</span>
              </label>
              <span className="text-xs font-bold text-[#42308f] capitalize">
                {formatDisplayDate(expirationDate)}
              </span>
            </div>

            <div className="p-3 bg-[#f8f9ff] border border-[#c9c4d3]/60 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Elegir fecha de vencimiento en el calendario:
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="input-fecha-vencimiento-reserva"
                      min={getTodayDateStr()}
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-bold text-[#0b1c30] bg-white border border-gray-300 rounded-xl focus:border-[#42308f] focus:outline-none shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div className="sm:w-auto">
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    Atajos rápidos:
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: '+48 hs (2 días)', days: 2 },
                      { label: '+72 hs (3 días)', days: 3 },
                      { label: '+5 días', days: 5 },
                      { label: '+7 días (1 sem)', days: 7 },
                    ].map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setExpirationDate(getFutureDateStr(opt.days))}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          expirationDate === getFutureDateStr(opt.days)
                            ? 'bg-[#42308f] text-white border-[#42308f] shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-600 block mb-1">
                  Nota u observación de la reserva (Opcional):
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Ej: Pasa a retirar con su hermana, talle apartado en bolsa..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#42308f]"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedProduct || depositNum <= 0 || depositNum > maxDepositAllowed}
            className="px-6 py-2.5 bg-[#42308f] hover:bg-[#5a49a8] disabled:bg-gray-300 text-white text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Reserva y Apartar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
