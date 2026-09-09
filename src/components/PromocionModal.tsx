import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Tag,
  Calendar,
  Check,
  Search,
  Boxes,
  CheckSquare,
  Square,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Promotion, DiscountType, PromotionStatus, ProductItem } from '../types';

interface PromocionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promo: Promotion) => void;
  promotionToEdit: Promotion | null;
  products: ProductItem[];
}

export const PromocionModal: React.FC<PromocionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  promotionToEdit,
  products,
}) => {
  const isEditing = Boolean(promotionToEdit);

  // Form states
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<'sábados' | 'todos' | 'fines_de_semana'>('sábados');
  const [discountType, setDiscountType] = useState<DiscountType>('porcentaje');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [category, setCategory] = useState<Promotion['category']>('Todas');
  const [appliesTo, setAppliesTo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<PromotionStatus>('activa');
  const [minPurchase, setMinPurchase] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Mode: select specific garments from stock vs broad category
  const [selectionMode, setSelectionMode] = useState<'stock' | 'categoria'>('stock');
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);

  // Stock picker search & filters
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('Todas');

  // When modal opens or promotionToEdit changes, load data
  useEffect(() => {
    if (promotionToEdit) {
      setTitle(promotionToEdit.title);
      setDayOfWeek((promotionToEdit.dayOfWeek as any) || 'sábados');
      setDiscountType(promotionToEdit.discountType);
      setDiscountValue(promotionToEdit.discountValue);
      setCategory(promotionToEdit.category);
      setAppliesTo(promotionToEdit.appliesTo);
      setStartDate(promotionToEdit.startDate);
      setEndDate(promotionToEdit.endDate);
      setStatus(promotionToEdit.status);
      setMinPurchase(promotionToEdit.minPurchase ? String(promotionToEdit.minPurchase) : '');
      setNotes(promotionToEdit.notes || '');
      const existingSkus = promotionToEdit.selectedProductSkus || [];
      setSelectedSkus(existingSkus);
      setSelectionMode(existingSkus.length > 0 ? 'stock' : 'categoria');
      setError(null);
    } else {
      // Default new promotion values (Prenda Estrella default)
      const today = new Date().toISOString().slice(0, 10);
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 60);
      const inTwoMonths = nextMonth.toISOString().slice(0, 10);

      setTitle('Prenda Estrella (Sábados)');
      setDayOfWeek('sábados');
      setDiscountType('porcentaje');
      setDiscountValue(20);
      setCategory('Todas');
      setAppliesTo('Prenda estrella destacada de los sábados');
      setStartDate(today);
      setEndDate(inTwoMonths);
      setStatus('activa');
      setMinPurchase('');
      setNotes('Descuento directo en mostrador los sábados');
      setSelectedSkus([]);
      setSelectionMode('stock');
      setError(null);
    }
    setStockSearch('');
    setStockCategoryFilter('Todas');
  }, [promotionToEdit, isOpen]);

  // Filter products for the stock picker
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        stockCategoryFilter === 'Todas' || p.category === stockCategoryFilter;
      const term = stockSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.colorName.toLowerCase().includes(term) ||
        p.size.toLowerCase().includes(term) ||
        p.locationFacility.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [products, stockCategoryFilter, stockSearch]);

  // Selected products details lookup
  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedSkus.includes(p.sku));
  }, [products, selectedSkus]);

  if (!isOpen) return null;

  // Toggle item selection in stock
  const handleToggleProduct = (product: ProductItem) => {
    let nextSkus: string[];
    const isAlreadySelected = selectedSkus.includes(product.sku);

    if (isAlreadySelected) {
      nextSkus = selectedSkus.filter((sku) => sku !== product.sku);
    } else {
      nextSkus = [...selectedSkus, product.sku];
    }

    setSelectedSkus(nextSkus);

    // Auto-update appliesTo and category to help the employee
    if (nextSkus.length > 0) {
      const nextProducts = products.filter((p) => nextSkus.includes(p.sku));
      
      // Auto-set category if all products share category
      const firstCat = nextProducts[0]?.category;
      const allSameCat = nextProducts.every((p) => p.category === firstCat);
      if (allSameCat && firstCat) {
        setCategory(firstCat);
      } else {
        setCategory('Todas');
      }

      // Auto-generate appliesTo description
      if (nextProducts.length === 1) {
        const item = nextProducts[0];
        setAppliesTo(`${item.name} (${item.size} - ${item.colorName})`);
        if (!title.trim() && !isEditing) {
          setTitle(`Promo Especial ${item.name} ${item.size}`);
        }
      } else if (nextProducts.length === 2) {
        setAppliesTo(`${nextProducts[0].name} (${nextProducts[0].size}) y ${nextProducts[1].name} (${nextProducts[1].size})`);
      } else {
        setAppliesTo(`${nextProducts.length} prendas seleccionadas del stock`);
      }
    } else {
      setAppliesTo('');
    }
  };

  const handleSelectAllFiltered = () => {
    const combined = Array.from(new Set([...selectedSkus, ...filteredProducts.map((p) => p.sku)]));
    setSelectedSkus(combined);
    setAppliesTo(`${combined.length} prendas seleccionadas del stock`);
  };

  const handleClearSelection = () => {
    setSelectedSkus([]);
    setAppliesTo('');
  };

  // Helper to compute promo price for a product
  const calculatePromoPrice = (originalPrice: number) => {
    if (discountType === 'porcentaje') {
      return Math.round(originalPrice * (1 - discountValue / 100));
    } else if (discountType === 'monto_fijo') {
      return Math.max(0, originalPrice - discountValue);
    } else {
      // 2x1 -> half price per unit
      return Math.round(originalPrice / 2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Por favor ingresa un título para la promoción.');
      return;
    }
    if (discountType !== 'dos_por_uno' && discountValue <= 0) {
      setError('El valor del descuento debe ser mayor a 0.');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setError('La fecha de inicio no puede ser posterior a la fecha de finalización.');
      return;
    }

    if (selectionMode === 'stock' && selectedSkus.length === 0) {
      setError('Por favor selecciona al menos una prenda del stock o cambia a modo "Toda una categoría".');
      return;
    }

    const savedPromo: Promotion = {
      id: promotionToEdit ? promotionToEdit.id : `PROMO-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      discountType,
      discountValue: discountType === 'dos_por_uno' ? 50 : Number(discountValue),
      category,
      appliesTo:
        appliesTo.trim() ||
        (selectedSkus.length > 0
          ? `${selectedSkus.length} prendas seleccionadas`
          : 'Prendas seleccionadas'),
      selectedProductSkus: selectionMode === 'stock' ? selectedSkus : [],
      dayOfWeek,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || new Date().toISOString().slice(0, 10),
      status,
      minPurchase: minPurchase ? Number(minPurchase) : undefined,
      usageCount: promotionToEdit ? promotionToEdit.usageCount : 0,
      notes: notes.trim() || undefined,
    };

    onSave(savedPromo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="bg-white rounded-3xl w-full max-w-3xl border border-[#c9c4d3]/50 shadow-2xl p-6 sm:p-8 relative my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-[#f8f9ff] text-[#797583] hover:text-[#0b1c30] flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-[#eff4ff] text-[#42308f] flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#0b1c30]">
              {isEditing ? 'Modificar Promoción' : 'Crear Nueva Promoción'}
            </h2>
            <p className="text-xs text-[#797583]">
              {isEditing
                ? `Editando campaña: ${promotionToEdit?.title}`
                : 'Configura descuentos vinculados directamente a prendas del stock real'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
          {/* Row 1: Title & Application Day */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Título de la Promoción *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Prenda Estrella (Sábados)"
                className="w-full text-xs px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-xl focus:border-[#42308f] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Días de Aplicación
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as any)}
                className="w-full text-xs font-bold px-3.5 py-2.5 bg-[#eff4ff] border border-[#42308f]/30 rounded-xl focus:border-[#42308f] focus:outline-none text-[#42308f]"
              >
                <option value="sábados">Sábados (Prenda Estrella)</option>
                <option value="fines_de_semana">Fines de Semana</option>
                <option value="todos">Todos los Días</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Sin cupones: directo en caja.</p>
            </div>
          </div>

          {/* Row 2: Discount Type & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tipo de Beneficio
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-xl focus:border-[#42308f] focus:outline-none"
              >
                <option value="porcentaje">Porcentaje (% OFF)</option>
                <option value="monto_fijo">Monto Fijo ($ Descuento)</option>
                <option value="dos_por_uno">2x1 / Par Bonificado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {discountType === 'porcentaje'
                  ? 'Porcentaje de Descuento (%)'
                  : discountType === 'monto_fijo'
                  ? 'Monto a Descontar ($ ARS)'
                  : 'Equivalente Estimado (%)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={discountType === 'porcentaje' ? 100 : 500000}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  disabled={discountType === 'dos_por_uno'}
                  className="w-full text-xs font-bold px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-xl focus:border-[#42308f] focus:outline-none disabled:opacity-60"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  {discountType === 'porcentaje' ? '%' : discountType === 'monto_fijo' ? 'ARS' : '2x1'}
                </span>
              </div>
            </div>
          </div>

          {/* STOCK GARMENT SELECTION SECTION */}
          <div className="p-4 rounded-3xl bg-[#f8f9ff] border border-[#c9c4d3]/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0b1c30]">
                    Selección de Prenda(s) desde el Stock
                  </h3>
                  <p className="text-[11px] text-[#797583]">
                    El personal podrá ver el producto específico, su foto/color, talle, stock disponible y precio con promo.
                  </p>
                </div>
              </div>

              {/* Selection Mode Toggle */}
              <div className="flex items-center bg-white p-1 rounded-full border border-[#c9c4d3]/40 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectionMode('stock')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    selectionMode === 'stock'
                      ? 'bg-[#42308f] text-white shadow-xs'
                      : 'text-[#797583] hover:text-[#0b1c30]'
                  }`}
                >
                  Desde el Stock ({selectedSkus.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('categoria')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    selectionMode === 'categoria'
                      ? 'bg-[#42308f] text-white shadow-xs'
                      : 'text-[#797583] hover:text-[#0b1c30]'
                  }`}
                >
                  Todo el Stock
                </button>
              </div>
            </div>

            {selectionMode === 'stock' ? (
              <div className="space-y-2.5 pt-1">
                {/* Search and Category Filter for Stock */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#797583] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      placeholder="Buscar por prenda, SKU, talle o color..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#c9c4d3]/50 rounded-full focus:outline-none focus:border-[#42308f]"
                    />
                    {stockSearch && (
                      <button
                        type="button"
                        onClick={() => setStockSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <select
                    value={stockCategoryFilter}
                    onChange={(e) => setStockCategoryFilter(e.target.value)}
                    className="text-xs font-medium px-3 py-1.5 bg-white border border-[#c9c4d3]/50 rounded-full focus:outline-none focus:border-[#42308f] text-[#5e5d69]"
                  >
                    <option value="Todas">Todas las categorías</option>
                    <option value="Remeras">Remeras</option>
                    <option value="Buzos">Buzos</option>
                    <option value="Pantalones">Pantalones</option>
                    <option value="Abrigos">Abrigos</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>

                  {/* Bulk selection actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-[10px] font-bold text-[#42308f] hover:underline px-2 py-1 bg-white rounded-lg border border-[#c9c4d3]/40"
                    >
                      Marcar mostradas
                    </button>
                    {selectedSkus.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-[10px] font-bold text-rose-600 hover:underline px-2 py-1 bg-white rounded-lg border border-[#c9c4d3]/40"
                      >
                        Desmarcar
                      </button>
                    )}
                  </div>
                </div>

                {/* Stock List with Visual Previews */}
                <div className="max-h-56 overflow-y-auto pr-1 space-y-2 rounded-2xl border border-gray-200/80 bg-white p-2">
                  {filteredProducts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#797583]">
                      No se encontraron prendas en el stock con los filtros actuales.
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = selectedSkus.includes(p.sku);
                      const promoPrice = calculatePromoPrice(p.price);

                      return (
                        <div
                          key={p.sku}
                          onClick={() => handleToggleProduct(p)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#eff4ff] border-[#42308f] shadow-xs'
                              : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-[#fcfcff]'
                          }`}
                        >
                          {/* Left: Checkbox + Color Swatch + Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 text-[#42308f]">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </div>

                            <span
                              className="w-4 h-4 rounded-full ring-1 ring-black/15 shrink-0"
                              style={{ backgroundColor: p.colorHex }}
                              title={`Color: ${p.colorName}`}
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-[#0b1c30] truncate">
                                  {p.name}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-mono text-gray-600 font-medium">
                                  {p.sku}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-700">
                                  Talle {p.size}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[#797583] mt-0.5">
                                <span>{p.category}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  <strong
                                    className={
                                      p.stock === 0
                                        ? 'text-rose-600'
                                        : p.stock <= p.minStockThreshold
                                        ? 'text-amber-600'
                                        : 'text-emerald-600'
                                    }
                                  >
                                    {p.stock === 0 ? 'Sin stock (0)' : `${p.stock} u. en stock`}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span className="truncate">{p.locationFacility}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Original Price and Promo Calculation */}
                          <div className="text-right shrink-0">
                            <div className="text-[11px] text-gray-400 line-through">
                              ${p.price.toLocaleString('es-AR')}
                            </div>
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-heading font-extrabold text-xs text-[#42308f]">
                                {discountType === 'dos_por_uno'
                                  ? `2x1 ($${promoPrice.toLocaleString('es-AR')} c/u)`
                                  : `$${promoPrice.toLocaleString('es-AR')}`}
                              </span>
                              {discountType === 'porcentaje' && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold text-[9px]">
                                  -{discountValue}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Products Badges summary */}
                {selectedProducts.length > 0 && (
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-[#0b1c30]">
                      Prendas asignadas ({selectedProducts.length}):
                    </span>
                    {selectedProducts.map((item) => (
                      <span
                        key={item.sku}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#42308f]/30 text-[10px] font-bold text-[#42308f] shadow-xs"
                      >
                        <span
                          className="w-2 h-2 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span>
                          {item.name} ({item.size})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(item)}
                          className="hover:text-rose-600 ml-0.5"
                          title="Remover"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-2xl border border-gray-100 text-xs text-[#5e5d69] space-y-2">
                <p>
                  Esta promoción aplicará de manera general a <strong>todas las prendas del local</strong>.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#797583]">
                  <Sparkles className="w-3.5 h-3.5 text-[#42308f]" />
                  <span>
                    Consejo: Si deseas que el personal vea exactamente la prenda en mostrador con su precio rebajado, seleccioná la opción <strong>"Desde el Stock"</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Applies to description & Min Purchase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Descripción del Alcance / Cartelería
              </label>
              <input
                type="text"
                value={appliesTo}
                onChange={(e) => setAppliesTo(e.target.value)}
                placeholder="Ej. Remera Estampada Sunset (XL) - Rojo"
                className="w-full text-xs px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Compra Mínima (Opcional en ARS)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="Sin mínimo (dejar vacío o 0)"
                className="w-full text-xs px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-xl focus:border-[#42308f] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Fecha Vencimiento
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-xl focus:border-[#42308f] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Estado de la Campaña
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PromotionStatus)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-xl focus:border-[#42308f] focus:outline-none font-bold"
              >
                <option value="activa">Activa</option>
                <option value="programada">Programada</option>
                <option value="pausada">Pausada</option>
                <option value="expirada">Expirada</option>
              </select>
            </div>
          </div>

          {/* Row 5: Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Notas y Condiciones para el Empleado / Mostrador
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Verificar estado de la prenda en perchero. Válido pago efectivo o transferencia."
              rows={2}
              className="w-full text-xs px-3.5 py-2 bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-xl focus:border-[#42308f] focus:outline-none resize-none"
            />
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 rounded-2xl bg-[#eff4ff]/70 border border-[#42308f]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#42308f] text-white flex items-center justify-center font-bold shrink-0">
                {discountType === 'porcentaje'
                  ? `%`
                  : discountType === 'monto_fijo'
                  ? `$`
                  : `2x1`}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#0b1c30] truncate">
                  {title || 'Título de la promoción'}
                </p>
                <p className="text-[11px] text-[#5e5d69] truncate">
                  <span className="font-semibold text-[#42308f]">Mostrador Directo</span> •{' '}
                  {discountType === 'porcentaje'
                    ? `${discountValue}% OFF`
                    : discountType === 'monto_fijo'
                    ? `$${Number(discountValue).toLocaleString('es-AR')} OFF`
                    : '2x1'}{' '}
                  • {selectedProducts.length > 0 ? `${selectedProducts.length} prenda(s) del stock` : category}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase self-start sm:self-auto shrink-0 ${
                status === 'activa'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'programada'
                  ? 'bg-blue-100 text-blue-800'
                  : status === 'pausada'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {status}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-[#5e5d69] hover:text-[#0b1c30] rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] transition-all shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Modificaciones' : 'Crear Promoción'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
