import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Calendar,
  Check,
  Edit2,
  Trash2,
  Play,
  Pause,
  Percent,
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowRight,
  Package,
  Layers,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { Promotion, PromotionStatus, ProductItem } from '../types';

interface PromocionesViewProps {
  promotions: Promotion[];
  products: ProductItem[];
  onCreatePromotion: () => void;
  onEditPromotion: (promo: Promotion) => void;
  onDeletePromotion: (promo: Promotion) => void;
  onToggleStatus: (promoId: string) => void;
  onNavigateToStock: () => void;
  onSelectProductForStock?: (category: string, sku?: string) => void;
}

export const PromocionesView: React.FC<PromocionesViewProps> = ({
  promotions,
  products,
  onCreatePromotion,
  onEditPromotion,
  onDeletePromotion,
  onToggleStatus,
  onNavigateToStock,
  onSelectProductForStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PromotionStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Fast SKU lookup
  const productMap = useMemo(() => {
    const map: Record<string, ProductItem> = {};
    products.forEach((p) => {
      map[p.sku] = p;
    });
    return map;
  }, [products]);

  // Filtered promotions
  const filtered = useMemo(() => {
    return promotions.filter((promo) => {
      if (statusFilter !== 'all' && promo.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && promo.category !== categoryFilter) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesMain =
          promo.title.toLowerCase().includes(q) ||
          (promo.code && promo.code.toLowerCase().includes(q)) ||
          promo.appliesTo.toLowerCase().includes(q) ||
          (promo.notes && promo.notes.toLowerCase().includes(q));

        // Also search by linked garment name or SKU!
        const matchesGarment = promo.selectedProductSkus?.some((sku) => {
          const p = productMap[sku];
          if (!p) return sku.toLowerCase().includes(q);
          return (
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.colorName.toLowerCase().includes(q) ||
            p.size.toLowerCase().includes(q)
          );
        });

        if (!matchesMain && !matchesGarment) return false;
      }
      return true;
    });
  }, [promotions, statusFilter, categoryFilter, searchTerm, productMap]);

  // High-level metrics
  const activeCount = promotions.filter((p) => p.status === 'activa').length;
  const programmedCount = promotions.filter((p) => p.status === 'programada').length;
  const pausedCount = promotions.filter((p) => p.status === 'pausada').length;
  const expiredCount = promotions.filter((p) => p.status === 'expirada').length;
  const totalUsages = promotions.reduce((acc, p) => acc + (p.usageCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Promociones & Descuentos
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCreatePromotion}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#42308f] rounded-full text-xs font-bold text-white hover:bg-[#5a49a8] transition-all shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nueva Promoción
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5e5d69]">Activas Actualmente</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-[#0b1c30] mt-2">
            {activeCount}{' '}
            <span className="text-xs font-semibold text-[#797583]">
              / {promotions.length} totales
            </span>
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Vigentes en tienda y mostrador
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5e5d69]">Canjes Registrados</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-[#0b1c30] mt-2">
            {totalUsages}
          </p>
          <p className="text-[11px] text-[#5e5d69] mt-1">
            Prendas vendidas con beneficio
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5e5d69]">Programadas</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading text-2xl font-black text-[#0b1c30] mt-2">
            {programmedCount}{' '}
            <span className="text-xs font-semibold text-[#797583]">campañas</span>
          </p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">
            Próximos lanzamientos de moda
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#c9c4d3]/40 card-shadow">
          {[
            { id: 'all', label: 'Todas', count: promotions.length },
            { id: 'activa', label: 'Activas', count: activeCount },
            { id: 'programada', label: 'Programadas', count: programmedCount },
            { id: 'pausada', label: 'Pausadas', count: pausedCount },
            { id: 'expirada', label: 'Expiradas', count: expiredCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#42308f] text-white shadow-xs'
                  : 'text-[#5e5d69] hover:text-[#42308f] hover:bg-[#f8f9ff]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#797583]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Category & Search Filter */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-white border border-[#c9c4d3]/40 rounded-full focus:outline-none focus:border-[#42308f] text-[#5e5d69]"
          >
            <option value="all">Todas las Categorías</option>
            <option value="Remeras">Remeras</option>
            <option value="Buzos">Buzos</option>
            <option value="Pantalones">Pantalones</option>
            <option value="Abrigos">Abrigos</option>
            <option value="Accesorios">Accesorios</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#797583] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cupón, prenda o SKU..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#c9c4d3]/40 rounded-full focus:outline-none focus:border-[#42308f]"
            />
          </div>
        </div>
      </div>

      {/* Promotions Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#c9c4d3]/40 card-shadow">
          <div className="w-14 h-14 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center mx-auto mb-4">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#0b1c30]">
            No se encontraron promociones
          </h3>
          <p className="text-xs text-[#797583] max-w-sm mx-auto mt-1 mb-5">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Prueba ajustando los filtros de búsqueda o categoría.'
              : 'Todavía no hay promociones registradas. Comienza creando la primera campaña comercial vinculada al stock.'}
          </p>
          <button
            onClick={onCreatePromotion}
            className="px-6 py-2.5 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] transition-all shadow-sm"
          >
            Crear Promoción Ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((promo) => {
            const isExpired = promo.status === 'expirada';
            const isPaused = promo.status === 'pausada';
            const isActive = promo.status === 'activa';
            const isProgrammed = promo.status === 'programada';
            const hasLinkedProducts =
              Boolean(promo.selectedProductSkus && promo.selectedProductSkus.length > 0);

            return (
              <div
                key={promo.id}
                className="bg-white rounded-3xl border border-[#c9c4d3]/40 card-shadow hover:border-[#42308f]/40 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Card Area */}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#42308f] font-bold text-[10px]">
                      {promo.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isProgrammed
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : isPaused
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-500'
                              : isProgrammed
                              ? 'bg-blue-500'
                              : isPaused
                              ? 'bg-amber-500'
                              : 'bg-gray-400'
                          }`}
                        />
                        {promo.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Benefit badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading font-bold text-base text-[#0b1c30] group-hover:text-[#42308f] transition-colors leading-snug">
                      {promo.title}
                    </h3>
                    <div className="shrink-0 px-3 py-1 bg-[#42308f]/10 text-[#42308f] rounded-xl font-heading font-black text-sm tracking-tight">
                      {promo.discountType === 'porcentaje'
                        ? `${promo.discountValue}% OFF`
                        : promo.discountType === 'monto_fijo'
                        ? `$${promo.discountValue.toLocaleString('es-AR')} OFF`
                        : '2x1'}
                    </div>
                  </div>

                  <p className="text-xs text-[#5e5d69] mt-2 font-medium">
                    {promo.appliesTo}
                  </p>

                  {/* Direct application indicator (sin cupones) */}
                  <div className="mt-3.5 p-2.5 rounded-2xl bg-[#eff4ff]/60 border border-[#42308f]/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#42308f]" />
                      <span className="font-semibold text-xs text-[#0b1c30]">
                        {promo.dayOfWeek === 'sábados'
                          ? 'Válido los días Sábados'
                          : promo.dayOfWeek === 'fines_de_semana'
                          ? 'Válido Fines de Semana'
                          : 'Válido todos los días'}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#42308f] bg-white px-2 py-0.5 rounded-md border border-[#42308f]/20">
                      Mostrador Directo
                    </span>
                  </div>

                  {/* SPECIFIC STOCK GARMENT DISPLAY */}
                  {hasLinkedProducts ? (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#0b1c30] flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[#42308f]" />
                          Prenda{promo.selectedProductSkus.length > 1 ? 's' : ''} en Promoción ({promo.selectedProductSkus.length}):
                        </span>
                        <span className="text-[10px] font-medium text-[#797583]">
                          Stock disponible
                        </span>
                      </div>

                      <div className="space-y-2">
                        {promo.selectedProductSkus.map((sku) => {
                          const product = productMap[sku];
                          if (!product) {
                            return (
                              <div
                                key={sku}
                                className="p-2 rounded-xl bg-gray-50 text-[10px] text-gray-500 font-mono"
                              >
                                SKU: {sku}
                              </div>
                            );
                          }

                          // Compute promotional price
                          let promoPrice = product.price;
                          if (promo.discountType === 'porcentaje') {
                            promoPrice = Math.round(product.price * (1 - promo.discountValue / 100));
                          } else if (promo.discountType === 'monto_fijo') {
                            promoPrice = Math.max(0, product.price - promo.discountValue);
                          } else {
                            promoPrice = Math.round(product.price / 2);
                          }

                          return (
                            <div
                              key={sku}
                              className="p-2.5 rounded-2xl bg-[#f8f9ff] border border-[#c9c4d3]/50 hover:border-[#42308f]/40 hover:bg-white transition-all flex flex-col gap-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full ring-1 ring-black/15 shrink-0"
                                    style={{ backgroundColor: product.colorHex }}
                                    title={`Color: ${product.colorName}`}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-xs text-[#0b1c30] truncate">
                                        {product.name}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded bg-white text-[10px] font-bold text-gray-700 border border-gray-200">
                                        Talle {product.size}
                                      </span>
                                    </div>
                                    <div className="font-mono text-[10px] text-gray-500 font-medium mt-0.5">
                                      {product.sku} • {product.colorName}
                                    </div>
                                  </div>
                                </div>

                                {/* Price breakdown */}
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] text-gray-400 line-through block leading-none">
                                    ${product.price.toLocaleString('es-AR')}
                                  </span>
                                  <span className="font-heading font-extrabold text-xs text-[#42308f] block mt-0.5">
                                    {promo.discountType === 'dos_por_uno'
                                      ? `2x1 ($${promoPrice.toLocaleString('es-AR')} c/u)`
                                      : `$${promoPrice.toLocaleString('es-AR')}`}
                                  </span>
                                </div>
                              </div>

                              {/* Garment details bar: Stock, Location, and Navigate to Stock */}
                              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-200/60">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                                      product.stock === 0
                                        ? 'bg-rose-100 text-rose-700'
                                        : product.stock <= product.minStockThreshold
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        product.stock === 0
                                          ? 'bg-rose-500'
                                          : product.stock <= product.minStockThreshold
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                    />
                                    {product.stock === 0
                                      ? 'Agotado (0 u.)'
                                      : `${product.stock} u. en stock`}
                                  </span>

                                  <span className="text-gray-500 text-[10px] hidden sm:inline truncate max-w-[90px]">
                                    {product.locationFacility}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onSelectProductForStock?.(product.category, product.sku)}
                                  className="text-[10px] font-bold text-[#42308f] hover:text-[#5a49a8] flex items-center gap-0.5 hover:underline"
                                  title="Ver en el inventario"
                                >
                                  <span>Ver en Stock</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#797583]">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-gray-400" />
                        <span>Aplica a toda la categoría ({promo.category})</span>
                      </span>
                      <button
                        onClick={() => onEditPromotion(promo)}
                        className="text-[10px] font-bold text-[#42308f] hover:underline"
                      >
                        Vincular prenda
                      </button>
                    </div>
                  )}

                  {/* Dates & min purchase */}
                  <div className="mt-3.5 space-y-1 text-xs text-[#797583]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        Vigencia: <span className="font-semibold text-gray-700">{promo.startDate}</span> al{' '}
                        <span className="font-semibold text-gray-700">{promo.endDate}</span>
                      </span>
                    </div>

                    {promo.minPurchase && promo.minPurchase > 0 ? (
                      <p className="text-[11px] text-gray-500">
                        Compra mínima:{' '}
                        <span className="font-bold text-gray-700">
                          ${promo.minPurchase.toLocaleString('es-AR')}
                        </span>
                      </p>
                    ) : null}

                    {promo.notes && (
                      <p className="text-[11px] text-gray-500 italic line-clamp-1">
                        "{promo.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="px-5 py-3 bg-[#f8f9ff] border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#797583]">
                    {promo.usageCount} {promo.usageCount === 1 ? 'canje' : 'canjes'} en mostrador
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Toggle pause / play */}
                    <button
                      onClick={() => onToggleStatus(promo.id)}
                      className="p-1.5 rounded-lg text-[#5e5d69] hover:text-[#42308f] hover:bg-white transition-colors"
                      title={isActive ? 'Pausar promoción' : 'Activar promoción'}
                      aria-label="Alternar estado"
                    >
                      {isActive ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => onEditPromotion(promo)}
                      className="p-1.5 rounded-lg text-[#5e5d69] hover:text-[#42308f] hover:bg-white transition-colors"
                      title="Modificar prendas o descuento"
                      aria-label="Modificar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDeletePromotion(promo)}
                      className="p-1.5 rounded-lg text-[#5e5d69] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar promoción"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Helpful banner linking to stock */}
      <div className="bg-[#eff4ff] rounded-3xl p-5 sm:p-6 border border-[#c9c4d3]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#42308f] text-white flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-[#0b1c30]">
              Control y Despacho de Prendas en Promoción
            </h4>
            <p className="text-xs text-[#5e5d69]">
              Al despachar una venta o consultar el inventario, los empleados pueden ver directamente qué prenda tiene descuento aplicado y verificar el stock físico en perchero.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToStock}
          className="inline-flex items-center gap-2 px-5 py-2 bg-white text-[#42308f] border border-[#c9c4d3]/40 rounded-full text-xs font-bold hover:bg-[#42308f] hover:text-white transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <span>Ir a Gestión de Stock</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
