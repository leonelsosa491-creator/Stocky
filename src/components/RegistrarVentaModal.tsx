import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  Minus,
  Receipt,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
  Printer,
  Sparkles,
  Search,
  ArrowRight,
  Phone,
  MessageCircle,
  FileText,
  Clock,
  DollarSign,
} from 'lucide-react';
import { ProductItem, Promotion, StockMovement } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTour } from '../context/TourContext';

interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface RegistrarVentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  promotions?: Promotion[];
  initialProduct?: ProductItem | null;
  onConfirmSale: (saleData: {
    items: {
      sku: string;
      productName: string;
      category: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      resultingStock: number;
    }[];
    totalUnits: number;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: string;
    paymentDetails?: string;
    customerName: string;
    customerPhone?: string;
    saleNotes?: string;
    channel: string;
    ticketNumber: string;
  }) => void;
}

export const RegistrarVentaModal: React.FC<RegistrarVentaModalProps> = ({
  isOpen,
  onClose,
  products,
  promotions = [],
  initialProduct,
  onConfirmSale,
}) => {

  // Quién está vendiendo: la persona logueada y su boutique
  const { user, role } = useAuth();
  const { notifyTour } = useTour();
  const sellerName = user?.name?.trim() || 'Vendedor/a';
  const businessName = user?.businessName?.trim() || 'Stocky';
  const sellerRoleLabel =
    role === 'developer'
      ? 'Desarrollo & Administración'
      : role === 'admin'
      ? 'Administración & Ventas'
      : 'Vendedora';

  // Cart state: list of items being sold in this transaction
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('Todas');
  
  // Payment methods
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'debito' | 'credito' | 'anotado'>('efectivo');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [transferRef, setTransferRef] = useState<string>('');
  const [creditInstallments, setCreditInstallments] = useState<string>('1');
  const [anotadoPending, setAnotadoPending] = useState<string>('');

  // Channel & Customer info
  const [channel, setChannel] = useState<'mostrador' | 'online' | 'whatsapp'>('mostrador');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [activePromoApplied, setActivePromoApplied] = useState<Promotion | null>(null);

  // Success view state after completing sale
  const [completedSale, setCompletedSale] = useState<{
    ticketNumber: string;
    date: string;
    items: {
      sku: string;
      name: string;
      size: string;
      color: string;
      qty: number;
      unitPrice: number;
      subtotal: number;
      remainingStock: number;
    }[];
    totalUnits: number;
    subtotal: number;
    discountAmount: number;
    total: number;
    paymentMethod: string;
    paymentDetails: string;
    customerName: string;
    customerPhone: string;
    saleNotes: string;
  } | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCompletedSale(null);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setDiscountPercent(0);
      setActivePromoApplied(null);
      setSearchQuery('');
      setSelectedCategoryTab('Todas');
      setPaymentMethod('efectivo');
      setAmountTendered('');
      setTransferRef('');
      setCreditInstallments('1');
      setAnotadoPending('');

      if (initialProduct && initialProduct.stock > 0) {
        setCart([{ product: initialProduct, quantity: 1 }]);
      } else {
        setCart([]);
      }
    }
  }, [isOpen, initialProduct]);

  useEffect(() => {
    if (!isOpen || completedSale) return;
    notifyTour(cart.length > 0 ? 'venta-carrito-listo' : 'venta-carrito-vacio');
  }, [isOpen, cart.length, completedSale, notifyTour]);

  // Extract unique categories for quick tabs
  const categoryTabs = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['Todas', ...cats];
  }, [products]);

  // Filter available products for adding to cart
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryTab !== 'Todas' && p.category !== selectedCategoryTab) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.colorName.toLowerCase().includes(q) ||
          p.size.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategoryTab, searchQuery]);

  // Add a product to the cart
  const handleAddToCart = (product: ProductItem) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.sku === product.sku);
      if (existing) {
        // Increment if there's enough stock
        if (existing.quantity < product.stock) {
          return prev.map((item) =>
            item.product.sku === product.sku
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prev; // cannot exceed stock
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Change quantity in cart
  const handleUpdateQuantity = (sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.sku === sku) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stock) return item; // capped at stock
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  // Set quantity directly
  const handleSetQuantity = (sku: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.sku === sku) {
          const safeQty = Math.max(1, Math.min(qty || 1, item.product.stock));
          return { ...item, quantity: safeQty };
        }
        return item;
      })
    );
  };

  // Remove item from cart
  const handleRemoveFromCart = (sku: string) => {
    setCart((prev) => prev.filter((item) => item.product.sku !== sku));
  };

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const totalUnits = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Check applicable promotions for items in cart
  const applicablePromotions = useMemo(() => {
    if (cart.length === 0) return [];
    return promotions.filter((promo) => {
      if (promo.status !== 'activa') return false;
      // Check if matches category or sku
      const matchesCategory =
        promo.category === 'Todas' ||
        cart.some((item) => item.product.category.toLowerCase() === promo.category.toLowerCase());
      const matchesSku =
        promo.selectedProductSkus?.length > 0 &&
        cart.some((item) => promo.selectedProductSkus.includes(item.product.sku));

      return matchesCategory || matchesSku;
    });
  }, [cart, promotions]);

  const handleApplyPromo = (promo: Promotion) => {
    setActivePromoApplied(promo);
    if (promo.discountType === 'porcentaje') {
      setDiscountPercent(promo.discountValue);
    } else if (promo.discountType === 'dos_por_uno') {
      // 2x1 estimate
      setDiscountPercent(25);
    } else {
      // flat discount handled as percentage of subtotal or flat
      setDiscountPercent(15);
    }
  };

  const discountAmount = useMemo(() => {
    if (discountPercent <= 0) return 0;
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);

  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Submit sale
  const handleConfirm = () => {
    if (cart.length === 0) return;

    // Validate that no item exceeds available stock
    for (const item of cart) {
      if (item.quantity > item.product.stock) {
        alert(`No hay suficiente stock de "${item.product.name}". Stock disponible: ${item.product.stock}`);
        return;
      }
    }

    const ticketNumber = `VTA-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    })}, ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;

    const saleItems = cart.map((item) => ({
      sku: item.product.sku,
      productName: item.product.name,
      category: item.product.category,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: item.product.price * item.quantity,
      resultingStock: Math.max(0, item.product.stock - item.quantity),
    }));

    const tenderedNum = parseFloat(amountTendered) || 0;
    const change = tenderedNum > finalTotal ? tenderedNum - finalTotal : 0;

    let paymentMethodName = 'Efectivo';
    let paymentDetailsStr = '';

    if (paymentMethod === 'efectivo') {
      paymentMethodName = 'Efectivo';
      if (tenderedNum > 0) {
        paymentDetailsStr = `Efectivo • Entregó $${tenderedNum.toLocaleString('es-AR')}${change > 0 ? ` (Vuelto: $${change.toLocaleString('es-AR')})` : ''}`;
      } else {
        paymentDetailsStr = `Efectivo • Pago Exacto $${finalTotal.toLocaleString('es-AR')}`;
      }
    } else if (paymentMethod === 'transferencia') {
      paymentMethodName = 'Transferencia / MP';
      paymentDetailsStr = `Transferencia / MP${transferRef.trim() ? ` • Ref/Comprobante: #${transferRef.trim()}` : ''}`;
    } else if (paymentMethod === 'debito') {
      paymentMethodName = 'Tarjeta de Débito';
      paymentDetailsStr = 'Tarjeta de Débito';
    } else if (paymentMethod === 'credito') {
      paymentMethodName = 'Tarjeta de Crédito';
      paymentDetailsStr = `Tarjeta de Crédito (${creditInstallments === '1' ? '1 pago' : `${creditInstallments} cuotas`})`;
    } else if (paymentMethod === 'anotado') {
      paymentMethodName = 'Cuenta Corriente (Anotado)';
      const señaNum = parseFloat(anotadoPending) || 0;
      paymentDetailsStr = `Cuenta Corriente${señaNum > 0 ? ` • Seña: $${señaNum.toLocaleString('es-AR')} (Resta: $${Math.max(0, finalTotal - señaNum).toLocaleString('es-AR')})` : ' • Pendiente de pago'}`;
    }

    // Trigger parent callback to mutate application stock & movements
    onConfirmSale({
      items: saleItems,
      totalUnits,
      subtotal,
      discountAmount,
      totalAmount: finalTotal,
      paymentMethod: paymentMethodName,
      paymentDetails: paymentDetailsStr,
      customerName: customerName.trim() || 'Consumidor Final',
      customerPhone: customerPhone.trim(),
      saleNotes: notes.trim(),
      channel:
        channel === 'mostrador'
          ? `Venta Mostrador (Local ${businessName})`
          : channel === 'online'
          ? 'Tienda Online'
          : 'WhatsApp / Redes',
      ticketNumber,
    });

    // Set completed sale view
    setCompletedSale({
      ticketNumber,
      date: formattedDate,
      items: cart.map((item) => ({
        sku: item.product.sku,
        name: item.product.name,
        size: item.product.size,
        color: item.product.colorName,
        qty: item.quantity,
        unitPrice: item.product.price,
        subtotal: item.product.price * item.quantity,
        remainingStock: item.product.stock - item.quantity,
      })),
      totalUnits,
      subtotal,
      discountAmount,
      total: finalTotal,
      paymentMethod: paymentMethodName,
      paymentDetails: paymentDetailsStr,
      customerName: customerName.trim() || 'Consumidor Final',
      customerPhone: customerPhone.trim(),
      saleNotes: notes.trim(),
    });
  };

  const handleStartNewSale = () => {
    setCompletedSale(null);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setDiscountPercent(0);
    setActivePromoApplied(null);
    setAmountTendered('');
    setTransferRef('');
    setCreditInstallments('1');
    setAnotadoPending('');
  };

  const handleShareWhatsApp = () => {
    if (!completedSale) return;
    const itemsList = completedSale.items
      .map((it) => `• ${it.name} (${it.sku}) - Talle ${it.size} (${it.color}) × ${it.qty} u. = $${it.subtotal.toLocaleString('es-AR')}`)
      .join('\n');

    const text = 
      `*${businessName}*\n` +
      `*Ticket de Venta:* #${completedSale.ticketNumber}\n` +
      `*Fecha:* ${completedSale.date}\n` +
      `*Cliente:* ${completedSale.customerName}\n\n` +
      `*Prendas Llevadas:*\n${itemsList}\n\n` +
      (completedSale.discountAmount > 0 ? `*Descuento aplicado:* -$${completedSale.discountAmount.toLocaleString('es-AR')}\n` : '') +
      `*TOTAL:* $${completedSale.total.toLocaleString('es-AR')}\n` +
      `*Forma de Pago:* ${completedSale.paymentDetails}\n` +
      (completedSale.saleNotes ? `*Observación:* ${completedSale.saleNotes}\n` : '') +
      `\n¡Muchas gracias por elegir ${businessName}! Esperamos que disfrutes tu compra.`;

    const cleanPhone = completedSale.customerPhone ? completedSale.customerPhone.replace(/\D/g, '') : '';
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-registrar-venta-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-registrar-venta-container"
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-[#c9c4d3]/40 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#eff4ff] via-white to-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
                  Registrar Venta & Descontar Stock
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Descuenta Stock
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5e5d69] mt-0.5">
                <span className="font-bold text-[#42308f]">{sellerName}</span>
                <span>•</span>
                <span>{sellerRoleLabel}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-close-registrar-venta"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TICKET DE VENTA COMPLETADO (SUCCESS VIEW) */}
        {completedSale ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(92vh-100px)]">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-heading text-2xl font-extrabold text-[#0b1c30]">
                ¡Venta Registrada Exitosamente!
              </h3>
              <p className="text-xs text-[#5e5d69] max-w-md mx-auto">
                {sellerName} ha registrado la venta y el stock de cada prenda se ha descontado automáticamente del inventario.
              </p>
            </div>

            {/* Comprobante de Venta */}
            <div className="bg-[#f8f9ff] rounded-3xl p-6 border border-[#c9c4d3]/40 max-w-lg mx-auto shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#797583]">Comprobante</span>
                  <p className="font-mono text-base font-bold text-[#42308f]">
                    #{completedSale.ticketNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#797583]">Fecha & Hora</span>
                  <p className="text-xs font-semibold text-gray-800">{completedSale.date}</p>
                </div>
              </div>

              <div className="text-xs space-y-1.5 py-1">
                <div className="flex justify-between">
                  <span className="text-[#5e5d69]">Vendedora responsable:</span>
                  <span className="font-bold text-[#0b1c30]">{sellerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5e5d69]">Cliente:</span>
                  <span className="font-bold text-[#0b1c30]">
                    {completedSale.customerName}
                    {completedSale.customerPhone && (
                      <span className="text-[#5e5d69] font-normal ml-1.5">
                        ({completedSale.customerPhone})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[#5e5d69] shrink-0">Pago:</span>
                  <span className="font-bold text-emerald-700 text-right">
                    {completedSale.paymentDetails}
                  </span>
                </div>
                {completedSale.saleNotes && (
                  <div className="flex justify-between items-center text-[11px] bg-white p-2 rounded-xl border border-gray-200/70">
                    <span className="text-[#5e5d69]">Observación:</span>
                    <span className="font-medium text-gray-800">{completedSale.saleNotes}</span>
                  </div>
                )}
              </div>

              {/* Detalle de prendas y descuento de stock */}
              <div className="border-t border-b border-gray-200 py-3 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#797583] uppercase">
                  <span>Prenda / Talle</span>
                  <span className="text-right">Cant. | Nuevo Stock</span>
                </div>
                {completedSale.items.map((it) => (
                  <div key={it.sku} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-bold text-[#0b1c30]">{it.name}</p>
                      <p className="text-[11px] text-[#5e5d69]">
                        Talle {it.size} • {it.color} • <span className="font-mono font-bold text-[#42308f]">Cód: {it.sku}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0b1c30]">
                        {it.qty} u. × ${it.unitPrice.toLocaleString('es-AR')}
                      </p>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Quedan: {it.remainingStock} u. (-{it.qty})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-[#5e5d69]">
                  <span>Subtotal ({completedSale.totalUnits} prendas):</span>
                  <span>${completedSale.subtotal.toLocaleString('es-AR')}</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Descuento aplicado:</span>
                    <span>-${completedSale.discountAmount.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-[#0b1c30] pt-2 border-t border-gray-200">
                  <span>Total Cobrado:</span>
                  <span className="text-emerald-700">${completedSale.total.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            {/* Success Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="btn-compartir-whatsapp-ticket"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full text-xs font-bold transition-all shadow-xs"
                title="Compartir comprobante detallado por WhatsApp a la clienta"
              >
                <MessageCircle className="w-4 h-4" />
                Compartir por WhatsApp
              </button>
              <button
                id="btn-imprimir-ticket-venta"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#c9c4d3]/60 rounded-full text-xs font-bold text-[#5e5d69] hover:text-[#42308f] hover:bg-[#eff4ff] transition-all shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Imprimir Comprobante
              </button>
              <button
                id="btn-nueva-venta"
                onClick={handleStartNewSale}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Otra Venta
              </button>
              <button
                id="btn-cerrar-modal-venta"
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* PANTALLA PRINCIPAL DE VENTA */
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 overflow-y-auto max-h-[calc(92vh-80px)]">
            {/* COLUMNA IZQUIERDA: BÚSQUEDA Y SELECCIÓN DE PRENDAS (7 columnas) */}
            <div id="tour-venta-lista" className="lg:col-span-7 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-sm font-bold text-[#0b1c30]">
                    1. Seleccionar Prendas a Vender
                  </h3>
                  <p className="text-xs text-[#5e5d69]">
                    Elige los artículos que estás entregando o despachando
                  </p>
                </div>
                <span className="text-xs text-[#797583] font-medium bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {availableProducts.length} disponibles
                </span>
              </div>

              {/* Barra de Búsqueda */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#797583] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-buscar-prenda-venta"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por código (#101), nombre, color o talle..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#f8f9ff] border border-[#c9c4d3]/40 rounded-full focus:outline-none focus:border-[#42308f] focus:ring-1 focus:ring-[#42308f] text-[#0b1c30]"
                />
              </div>

              {/* Categorías Rápidas */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categoryTabs.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryTab(cat)}
                    className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      selectedCategoryTab === cat
                        ? 'bg-[#42308f] text-white shadow-xs'
                        : 'bg-[#f8f9ff] text-[#5e5d69] hover:bg-[#eff4ff] hover:text-[#42308f] border border-[#c9c4d3]/30'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Listado de Productos Disponibles */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {availableProducts.map((prod) => {
                  const inCart = cart.find((c) => c.product.sku === prod.sku);
                  const isOutOfStock = prod.stock <= 0;
                  const currentInCartQty = inCart ? inCart.quantity : 0;
                  const canAddMore = prod.stock > currentInCartQty;

                  return (
                    <div
                      key={prod.sku}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isOutOfStock
                          ? 'bg-gray-50/70 border-gray-200 opacity-60'
                          : inCart
                          ? 'bg-[#eff4ff]/60 border-[#42308f]/40 shadow-xs'
                          : 'bg-white border-gray-100 hover:border-[#42308f]/30 hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-1 ring-black/10"
                          style={{ backgroundColor: prod.colorHex }}
                          title={prod.colorName}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-[#0b1c30] truncate">
                              {prod.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-gray-100 text-gray-700">
                              Talle {prod.size}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5e5d69] font-mono mt-0.5">
                            <span className="font-bold text-[#42308f]">Cód: {prod.sku}</span> • {prod.category} • {prod.colorName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-xs text-[#0b1c30]">
                            ${prod.price.toLocaleString('es-AR')}
                          </p>
                          <span
                            className={`text-[10px] font-bold block ${
                              isOutOfStock
                                ? 'text-[#ba1a1a]'
                                : prod.stock <= prod.minStockThreshold
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {isOutOfStock ? 'Agotado (0 u.)' : `Stock: ${prod.stock} u.`}
                          </span>
                        </div>

                        {/* Botón Agregar / Cantidad en carrito */}
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Sin Stock
                          </span>
                        ) : inCart ? (
                          <div className="flex items-center gap-1 bg-white border border-[#42308f]/30 rounded-full px-2 py-0.5 shadow-2xs">
                            <button
                              onClick={() => handleUpdateQuantity(prod.sku, -1)}
                              className="p-1 text-gray-500 hover:text-rose-600"
                              title="Restar una unidad"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-extrabold text-[#42308f] w-5 text-center">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(prod.sku, 1)}
                              disabled={!canAddMore}
                              className={`p-1 ${
                                canAddMore
                                  ? 'text-gray-500 hover:text-[#42308f]'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              title={canAddMore ? 'Sumar una unidad' : 'Stock máximo alcanzado'}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`btn-agregar-prenda-${prod.sku}`}
                            onClick={() => handleAddToCart(prod)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-2xs active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Vender</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {availableProducts.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#5e5d69]">
                    No se encontraron prendas que coincidan con la búsqueda.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: TICKET DE VENTA, DESCUENTOS Y CONFIRMACIÓN (5 columnas) */}
            <div className="lg:col-span-5 p-5 sm:p-6 bg-[#f8f9ff]/50 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#42308f]" />
                    <h3 className="font-heading text-sm font-bold text-[#0b1c30]">
                      2. Carrito de Venta
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#42308f] bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {totalUnits} prendas
                  </span>
                </div>

                {/* Items seleccionados en el carrito */}
                {cart.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-xs font-semibold text-gray-600">
                      No has seleccionado prendas para la venta
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Haz clic en "Vender" en la lista de la izquierda para agregarlas aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {cart.map((item) => {
                      const resultingStock = item.product.stock - item.quantity;
                      return (
                        <div
                          key={item.product.sku}
                          className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#0b1c30] truncate">
                                {item.product.name}
                              </p>
                              <p className="text-[11px] text-[#5e5d69]">
                                Talle {item.product.size} • {item.product.colorName} • <span className="font-mono font-bold text-[#42308f]">Cód: {item.product.sku}</span>
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(item.product.sku)}
                              className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                              title="Quitar de la venta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Stepper & Pricing */}
                          <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-xs">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateQuantity(item.product.sku, -1)}
                                className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={item.product.stock}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleSetQuantity(item.product.sku, parseInt(e.target.value) || 1)
                                }
                                className="w-10 text-center font-extrabold text-[#42308f] text-xs bg-[#f8f9ff] border border-gray-200 rounded-md py-0.5"
                              />
                              <button
                                onClick={() => handleUpdateQuantity(item.product.sku, 1)}
                                disabled={item.quantity >= item.product.stock}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold ${
                                  item.quantity >= item.product.stock
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                              >
                                +
                              </button>
                            </div>

                            <div className="text-right">
                              <span className="font-extrabold text-[#0b1c30]">
                                ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                              </span>
                              <p className="text-[10px] text-emerald-700 font-medium">
                                Quedarán: {resultingStock} u.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Promoción Aplicable (si hay) */}
                {applicablePromotions.length > 0 && (
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Promociones disponibles para esta venta:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {applicablePromotions.map((p) => {
                        const isSelected = activePromoApplied?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleApplyPromo(p)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                              isSelected
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {p.title} ({p.discountType === 'porcentaje' ? `${p.discountValue}% OFF` : p.discountType})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Método de Pago */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5e5d69] block">
                    ¿Cómo abona el cliente?
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-3.5 h-3.5" /> },
                      { id: 'transferencia', label: 'MP / Transf.', icon: <Smartphone className="w-3.5 h-3.5" /> },
                      { id: 'debito', label: 'Débito', icon: <CreditCard className="w-3.5 h-3.5" /> },
                      { id: 'credito', label: 'Crédito', icon: <CreditCard className="w-3.5 h-3.5" /> },
                      { id: 'anotado', label: 'Anotado', icon: <FileText className="w-3.5 h-3.5" /> },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold border transition-all ${
                          paymentMethod === m.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {m.icon}
                        <span className="mt-1">{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Detalle específico según medio de pago */}
                  {paymentMethod === 'efectivo' && (
                    <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/80 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                          ¿Cuánto dinero entregó el cliente?
                        </label>
                        <button
                          type="button"
                          onClick={() => setAmountTendered(finalTotal.toString())}
                          className="text-[11px] font-bold text-emerald-700 hover:underline bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs"
                        >
                          Pago Exacto
                        </button>
                      </div>

                      <div className="flex gap-1.5 flex-wrap">
                        <div className="relative flex-1 min-w-[130px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amountTendered}
                            onChange={(e) => setAmountTendered(e.target.value)}
                            placeholder={finalTotal > 0 ? `${finalTotal}` : '0'}
                            className="w-full pl-6 pr-3 py-1.5 text-xs font-bold text-[#0b1c30] bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>

                        {/* Botones rápidos de billetes comunes */}
                        {[10000, 20000, 50000, 100000]
                          .filter((val) => val >= finalTotal)
                          .slice(0, 3)
                          .map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setAmountTendered(val.toString())}
                              className="px-2 py-1 bg-white hover:bg-emerald-100 text-[10px] font-bold text-emerald-800 rounded-lg border border-emerald-200 shadow-2xs"
                            >
                              ${(val / 1000).toFixed(0)}k
                            </button>
                          ))}
                      </div>

                      {/* Cálculo en vivo de Vuelto / Resto */}
                      {amountTendered && parseFloat(amountTendered) > 0 && (
                        <div>
                          {parseFloat(amountTendered) >= finalTotal ? (
                            <div className="flex items-center justify-between bg-emerald-600 text-white px-3 py-2 rounded-xl shadow-xs">
                              <span className="text-xs font-medium">Vuelto a entregar:</span>
                              <span className="font-heading text-sm font-extrabold">
                                ${(parseFloat(amountTendered) - finalTotal).toLocaleString('es-AR')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-medium">
                              <span>Faltan abonar:</span>
                              <span className="font-bold">
                                ${(finalTotal - parseFloat(amountTendered)).toLocaleString('es-AR')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'transferencia' && (
                    <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-200/80 space-y-1.5 animate-in fade-in duration-150">
                      <label className="text-xs font-bold text-blue-950 block">
                        Nº de Comprobante / Alias / Titular (Opcional)
                      </label>
                      <input
                        type="text"
                        value={transferRef}
                        onChange={(e) => setTransferRef(e.target.value)}
                        placeholder="Ej: Transf. MP #49281 o Alias de la cuenta"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-[#42308f]"
                      />
                    </div>
                  )}

                  {paymentMethod === 'credito' && (
                    <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-200/80 space-y-1.5 animate-in fade-in duration-150">
                      <label className="text-xs font-bold text-purple-950 block">
                        Cantidad de Cuotas
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: '1', label: '1 pago' },
                          { id: '3', label: '3 cuotas' },
                          { id: '6', label: '6 cuotas' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setCreditInstallments(c.id)}
                            className={`py-1 px-2 text-xs font-bold rounded-xl border transition-all ${
                              creditInstallments === c.id
                                ? 'bg-[#42308f] text-white border-[#42308f]'
                                : 'bg-white text-gray-700 border-purple-200 hover:bg-purple-100/50'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'anotado' && (
                    <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-950 block">
                          Cuenta Corriente / Fiado (Clienta de confianza)
                        </label>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-[11px] text-amber-900 font-medium shrink-0">Seña entregada: $</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={anotadoPending}
                          onChange={(e) => setAnotadoPending(e.target.value)}
                          placeholder="0 si abona todo después"
                          className="w-full px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-amber-800 leading-tight">
                        Se descontará el stock inmediatamente y quedará registrado que la clienta pasará a cancelar el saldo.
                      </p>
                    </div>
                  )}
                </div>

                {/* Canal de Venta & Datos de la Clienta */}
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#5e5d69] block mb-1">
                        Canal de Venta
                      </label>
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value as any)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#42308f]"
                      >
                        <option value="mostrador">Mostrador (Local)</option>
                        <option value="online">Tienda Online</option>
                        <option value="whatsapp">WhatsApp / Redes</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#5e5d69] block mb-1">
                        Nombre de la Clienta
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ej: Mariana Rossi"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#42308f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#5e5d69] block mb-1">
                        WhatsApp / Celular (Opcional)
                      </label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ej: 11-4829-1029"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#42308f]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#5e5d69] block mb-1">
                        Nota / Observación
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Para regalo, talle..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#42308f]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* TOTALES Y BOTÓN DE CONFIRMACIÓN */}
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#5e5d69]">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${subtotal.toLocaleString('es-AR')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Descuento ({discountPercent}%):</span>
                      <span>-${discountAmount.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-[#0b1c30] pt-1">
                    <span>Total a Cobrar:</span>
                    <span className="text-emerald-700 font-heading text-lg">
                      ${finalTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-confirmar-venta-descontar-stock"
                  onClick={handleConfirm}
                  disabled={cart.length === 0}
                  className={`w-full py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                    cart.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Venta y Descontar Stock ({totalUnits} u.)</span>
                </button>

                <p className="text-[10px] text-center text-[#797583]">
                  Al confirmar, las {totalUnits} unidades se descontarán en tiempo real y quedará asentado el egreso a nombre de {sellerName}.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
