import React, { useState, useMemo } from 'react';
import {
  Download,
  Edit3,
  Plus,
  X,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LayoutList,
  LayoutGrid,
  ChevronRight,
  Search,
  Tag,
  RotateCcw,
  Shirt,
  Sparkles,
  PackagePlus,
  Layers,
  ShoppingBag,
  CalendarCheck,
  Trash2,
} from 'lucide-react';
import { ProductItem, Promotion, CategorySummary } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  MAIN_COLOR_FAMILIES,
  matchesColorFamily,
  getProductColorDisplay,
} from '../utils/colors';

interface StockDetailViewProps {
  products: ProductItem[];
  categories: CategorySummary[];
  selectedCategory: string;
  promotions?: Promotion[];
  initialStatusFilter?: 'all' | 'bajo' | 'agotado' | 'ok';
  onStatusFilterChange?: (status: 'all' | 'bajo' | 'agotado' | 'ok') => void;
  onNavigateToCategory: (cat: string) => void;
  onNavigateToResumen: () => void;
  onOpenCrearStock: () => void;
 onOpenCargarProducto: (cat?: string, productToEdit?: ProductItem | null, mode?: 'reponer' | 'nuevo') => void;
  onQuickReplenish?: (product: ProductItem) => void;
  onOpenRegistrarVenta?: (product?: ProductItem) => void;
  onOpenReserva?: (product?: ProductItem) => void;
  onEditStock: (product?: ProductItem) => void;
  onDeleteProduct?: (sku: string) => void;
  onExport: () => void;
  onUpdateProductStock: (sku: string, newStock: number) => void;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const AVAILABLE_SEASONS = ['Verano', 'Invierno', 'Otoño', 'Primavera'];

export const StockDetailView: React.FC<StockDetailViewProps> = ({
  products,
  categories,
  selectedCategory,
  promotions = [],
  initialStatusFilter = 'all',
  onStatusFilterChange,
  onNavigateToCategory,
  onNavigateToResumen,
  onOpenCrearStock,
  onOpenCargarProducto,
  onQuickReplenish,
  onOpenRegistrarVenta,
  onOpenReserva,
  onEditStock,
  onDeleteProduct,
  onExport,
  onUpdateProductStock,
}) => {
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'bajo' | 'agotado' | 'ok'>(
    initialStatusFilter || 'all'
  );
  const [sizeFilter, setSizeFilter] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [tableSearch, setTableSearch] = useState('');

  React.useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const handleSetStatusFilter = (newStatus: 'all' | 'bajo' | 'agotado' | 'ok') => {
    setStatusFilter(newStatus);
    onStatusFilterChange?.(newStatus);
  };

  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.colorName && !map.has(p.colorName)) {
        map.set(p.colorName, p.colorHex || '#18181b');
      }
    });
    if (!map.has('Negro')) map.set('Negro', '#18181b');
    if (!map.has('Blanco')) map.set('Blanco', '#ffffff');
    if (!map.has('Azul Marino')) map.set('Azul Marino', '#1e3a8a');
    if (!map.has('Rojo')) map.set('Rojo', '#ef4444');
    if (!map.has('Beige')) map.set('Beige', '#d4b996');
    if (!map.has('Gris')) map.set('Gris', '#6b7280');
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const scopedProducts = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'Todas') return products;
    return products.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [products, selectedCategory]);

  const countBajo = useMemo(() => {
    return scopedProducts.filter(
      (p) => p.status === 'bajo' || (p.stock > 0 && p.stock <= p.minStockThreshold)
    ).length;
  }, [scopedProducts]);

  const countAgotado = useMemo(() => {
    return scopedProducts.filter((p) => p.status === 'agotado' || p.stock === 0).length;
  }, [scopedProducts]);

  const countOk = useMemo(() => {
    return scopedProducts.filter((p) => p.status === 'ok' && p.stock > p.minStockThreshold).length;
  }, [scopedProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (
        selectedCategory &&
        selectedCategory !== 'Todas' &&
        item.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (sizeFilter && item.size !== sizeFilter) return false;
      if (seasonFilter && item.season !== seasonFilter) return false;
      if (colorFilter && !matchesColorFamily(item, colorFilter)) return false;

      if (statusFilter === 'bajo') {
        const isBajo = item.status === 'bajo' || (item.stock > 0 && item.stock <= item.minStockThreshold);
        if (!isBajo) return false;
      } else if (statusFilter === 'agotado') {
        const isAgotado = item.status === 'agotado' || item.stock === 0;
        if (!isAgotado) return false;
      } else if (statusFilter === 'ok') {
        const isOk = item.status === 'ok' && item.stock > item.minStockThreshold;
        if (!isOk) return false;
      }

      if (tableSearch) {
        const q = tableSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.colorName.toLowerCase().includes(q) ||
          (item.specificColor && item.specificColor.toLowerCase().includes(q)) ||
          (item.colorFamily && item.colorFamily.toLowerCase().includes(q)) ||
          item.locationFacility.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [products, selectedCategory, sizeFilter, seasonFilter, colorFilter, statusFilter, tableSearch]);

  const totalInView = filteredProducts.reduce((acc, p) => acc + p.stock, 0);

  const getActivePromotion = (prod: ProductItem) => {
    return promotions.find(
      (p) =>
        p.status === 'activa' &&
        (p.selectedProductSkus?.includes(prod.sku) || p.category === prod.category)
    );
  };

  const getStatusBadge = (status: ProductItem['status'], stock: number) => {
    if (stock === 0 || status === 'agotado') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
          <XCircle className="w-3.5 h-3.5" />
          Agotado
        </span>
      );
    }
    if (status === 'bajo') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fef3c7] text-[#92400e]">
          <AlertTriangle className="w-3.5 h-3.5" />
          Bajo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#d1fae5] text-[#065f46]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        OK
      </span>
    );
  };

  const getCategoryIcon = (iconName: string, catName: string) => {
    if (iconName === 'hoodie' || catName === 'Buzos') return <Package className="w-4 h-4" />;
    if (iconName === 'tshirt' || catName === 'Remeras') return <Shirt className="w-4 h-4" />;
    if (iconName === 'pants' || catName === 'Pantalones') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3v18l3-2 3 2 3-2 3 2V3H6z" />
        </svg>
      );
    }
    if (iconName === 'coat' || catName === 'Abrigos') return <Shirt className="w-4 h-4" />;
    if (iconName === 'dress') return <Sparkles className="w-4 h-4" />;
    if (iconName === 'shoes') return <ShoppingBag className="w-4 h-4" />;
    return <Layers className="w-4 h-4" />;
  };

  const hasActiveFilters = Boolean(
    sizeFilter || seasonFilter || colorFilter || tableSearch || statusFilter !== 'all'
  );

  const clearAllFilters = () => {
    setSizeFilter(null);
    setSeasonFilter(null);
    setColorFilter(null);
    handleSetStatusFilter('all');
    setTableSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="space-y-3">
        {/* Breadcrumb path */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-bold text-[#5e5d69] uppercase tracking-wider">
          <button
            onClick={onNavigateToResumen}
            className="hover:text-[#42308f] transition-colors"
          >
            STOCK GENERAL
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#c9c4d3]" />
          <span className="text-[#42308f] font-extrabold">
            {selectedCategory === 'Todas' ? 'TODAS LAS PRENDAS' : selectedCategory.toUpperCase()}
          </span>
          {sizeFilter && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#c9c4d3]" />
              <span className="text-[#0b1c30]">TALLE {sizeFilter}</span>
            </>
          )}
        </nav>

        {/* Title and Top Action Buttons - LIMPIO Y MINIMALISTA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight flex items-center gap-3">
              <span>Stock de {selectedCategory === 'Todas' ? 'Todas las Prendas' : selectedCategory}</span>
              <span className="text-xs font-bold font-sans bg-[#eff4ff] text-[#42308f] px-3 py-1 rounded-full border border-[#42308f]/20">
                {totalInView} unidades
              </span>
            </h1>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#c9c4d3]/60 rounded-full text-xs font-bold text-[#5e5d69] hover:text-[#42308f] hover:bg-[#eff4ff] transition-all shadow-2xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>

           {onOpenRegistrarVenta && (
              <button
                id="btn-stock-registrar-venta"
                onClick={() => onOpenRegistrarVenta()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Registrar venta y descontar stock"
              >
                <ShoppingBag className="w-4 h-4" />
                Registrar Venta
              </button>
            )}

            {/* NUEVO BOTÓN: Reponer Existente */}
            <button
             onClick={() => {
    // Le pasamos (categoría, null, 'reponer')
    onOpenCargarProducto(selectedCategory !== 'Todas' ? selectedCategory : undefined, null, 'reponer');
  }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#c9c4d3]/40 dark:border-[#2d2a3d] dark:bg-[#1e1b29] rounded-full text-xs font-bold text-[#42308f] dark:text-[#b8aee0] hover:bg-[#f8f9ff] dark:hover:bg-[#2a263d] transition-all shadow-sm cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reponer Existente
            </button>

            {/* NUEVO BOTÓN: Prenda Nueva */}
            <button
              onClick={() => {
    // Le pasamos (categoría, null, 'nuevo')
    onOpenCargarProducto(selectedCategory !== 'Todas' ? selectedCategory : undefined, null, 'nuevo');
  }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#42308f] rounded-full text-xs font-bold text-white hover:bg-[#5a49a8] transition-all shadow-sm cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              + Prenda Nueva
            </button>
          </div>
        </div>
      </div>

      {/* BANNER DE FILTRO DE STOCK ACTIVO */}
      {statusFilter !== 'all' && (
        <div
          id="banner-atencion-stock"
          className={`rounded-3xl p-5 border shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            statusFilter === 'bajo'
              ? 'bg-gradient-to-r from-amber-50 to-amber-100/60 border-amber-300/80 text-amber-950'
              : statusFilter === 'agotado'
              ? 'bg-gradient-to-r from-rose-50 to-rose-100/60 border-rose-300/80 text-rose-950'
              : 'bg-gradient-to-r from-emerald-50 to-emerald-100/60 border-emerald-300/80 text-emerald-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                statusFilter === 'bajo'
                  ? 'bg-amber-200 text-amber-900 ring-4 ring-amber-100'
                  : statusFilter === 'agotado'
                  ? 'bg-rose-200 text-rose-900 ring-4 ring-rose-100'
                  : 'bg-emerald-200 text-emerald-900 ring-4 ring-emerald-100'
              }`}
            >
              {statusFilter === 'bajo' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : statusFilter === 'agotado' ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-extrabold text-base tracking-tight text-[#0b1c30]">
                  {statusFilter === 'bajo'
                    ? 'Artículos con Stock Bajo'
                    : statusFilter === 'agotado'
                    ? 'Artículos sin stock (Agotados)'
                    : 'Artículos con stock óptimo'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs ${
                    statusFilter === 'bajo'
                      ? 'bg-amber-300/80 text-amber-950'
                      : statusFilter === 'agotado'
                      ? 'bg-rose-300/80 text-rose-950'
                      : 'bg-emerald-300/80 text-emerald-950'
                  }`}
                >
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>
              <p className="text-xs text-[#5e5d69] mt-0.5">
                {statusFilter === 'bajo'
                  ? 'Mostrando prendas con stock igual o inferior a su umbral mínimo de seguridad estipulado.'
                  : statusFilter === 'agotado'
                  ? 'Mostrando prendas sin unidades disponibles en ningún depósito.'
                  : 'Prendas con stock saludable y sin riesgo de quiebre.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => handleSetStatusFilter('all')}
              className="px-4 py-2 rounded-full bg-white hover:bg-gray-50 text-xs font-bold text-[#0b1c30] border border-[#c9c4d3]/70 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Ver todos los artículos
            </button>
            <button
              onClick={() => onOpenCargarProducto(selectedCategory !== 'Todas' ? selectedCategory : undefined)}
              className="px-4 py-2 rounded-full bg-[#42308f] hover:bg-[#5a49a8] text-xs font-bold text-white shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Reponer Stock
            </button>
          </div>
        </div>
      )}

      {/* 1. SELECCIÓN DE TIPO DE PRENDAS */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#c9c4d3]/40 card-shadow space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e5d69]">
            Seleccionar Tipo de Prenda / Stock
          </span>
          <span className="text-[11px] text-[#797583]">
            {categories.length} stocks registrados
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onNavigateToCategory('Todas')}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              selectedCategory === 'Todas'
                ? 'bg-[#42308f] text-white shadow-sm ring-2 ring-[#42308f]/20'
                : 'bg-[#f8f9ff] text-[#5e5d69] hover:bg-[#eff4ff] hover:text-[#42308f] border border-[#c9c4d3]/30'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Todos los Stocks</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategory === 'Todas'
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-[#5e5d69] border border-gray-200'
              }`}
            >
              {products.length}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            const catItemCount = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
            return (
              <button
                key={cat.name}
                onClick={() => onNavigateToCategory(cat.name)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#42308f] text-white shadow-sm ring-2 ring-[#42308f]/20'
                    : 'bg-[#f8f9ff] text-[#5e5d69] hover:bg-[#eff4ff] hover:text-[#42308f] border border-[#c9c4d3]/30'
                }`}
              >
                {getCategoryIcon(cat.icon, cat.name)}
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-[#5e5d69] border border-gray-200'
                  }`}
                >
                  {catItemCount}
                </span>
              </button>
            );
          })}

          <button
            onClick={onOpenCrearStock}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-[#eff4ff] text-[#42308f] hover:bg-[#e0e9ff] border border-dashed border-[#42308f]/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo</span>
          </button>
        </div>
      </div>

      {/* 2. SELECTORES INTERACTIVOS */}
      <div className="bg-white rounded-3xl p-5 border border-[#c9c4d3]/40 card-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-heading text-sm font-bold text-[#0b1c30]">
              Filtros Seleccionables
            </h3>
            <span className="text-xs text-[#797583]">
              (Estado, Talle, Temporada y Color)
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1 rounded-full self-start sm:self-auto transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar Filtros
            </button>
          )}
        </div>

        <div className="pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-700">Estado:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleSetStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#42308f] text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todos ({scopedProducts.length})
              </button>
              <button
                onClick={() => handleSetStatusFilter('bajo')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'bajo'
                    ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Stock Bajo ({countBajo})</span>
              </button>
              <button
                onClick={() => handleSetStatusFilter('agotado')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'agotado'
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/80'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Sin Stock ({countAgotado})</span>
              </button>
              <button
                onClick={() => handleSetStatusFilter('ok')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ok'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Stock Óptimo ({countOk})</span>
              </button>
            </div>
          </div>
          {statusFilter !== 'all' && (
            <button
              onClick={() => handleSetStatusFilter('all')}
              className="text-xs font-bold text-[#42308f] hover:underline self-start sm:self-auto cursor-pointer"
            >
              Ver todos los estados
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* SELECTOR DE TALLE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">Talle:</span>
              <span className="text-[#42308f] font-extrabold">{sizeFilter || 'Todos'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSizeFilter(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  sizeFilter === null
                    ? 'bg-[#42308f] text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todos
              </button>
              {AVAILABLE_SIZES.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSizeFilter(sizeFilter === sz ? null : sz)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sizeFilter === sz
                      ? 'bg-[#42308f] text-white shadow-xs ring-2 ring-[#42308f]/20'
                      : 'bg-[#f8f9ff] text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* SELECTOR DE TEMPORADA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">Temporada:</span>
              <span className="text-[#42308f] font-extrabold">{seasonFilter || 'Todas'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSeasonFilter(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  seasonFilter === null
                    ? 'bg-[#42308f] text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todas
              </button>
              {AVAILABLE_SEASONS.map((sea) => (
                <button
                  key={sea}
                  onClick={() => setSeasonFilter(seasonFilter === sea ? null : sea)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    seasonFilter === sea
                      ? 'bg-[#42308f] text-white shadow-xs ring-2 ring-[#42308f]/20'
                      : 'bg-[#f8f9ff] text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {sea}
                </button>
              ))}
            </div>
          </div>

          {/* SELECTOR DE COLOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">Familia de Color:</span>
              <span className="text-[#42308f] font-extrabold">{colorFilter || 'Todos'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setColorFilter(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  colorFilter === null
                    ? 'bg-[#42308f] text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todos ({scopedProducts.length})
              </button>
              {MAIN_COLOR_FAMILIES.map((col) => {
                const isSelected = colorFilter === col.name;
                const count = scopedProducts.filter((p) => matchesColorFamily(p, col.name)).length;
                return (
                  <button
                    key={col.name}
                    onClick={() => setColorFilter(isSelected ? null : col.name)}
                    title={`Filtrar por familia ${col.name} (${count} prendas)`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#42308f] text-white shadow-xs ring-2 ring-[#42308f]/20'
                        : 'bg-[#f8f9ff] text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0"
                      style={{
                        backgroundColor: col.hex,
                        border: col.hasBorder ? '1px solid #d1d5db' : 'none',
                      }}
                    />
                    <span>{col.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. LISTADO / CUADRÍCULA DE PRODUCTOS */}
      <div className="bg-white rounded-3xl border border-[#c9c4d3]/40 card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <h3 className="font-heading text-lg font-bold text-[#0b1c30]">
              Inventario de {selectedCategory === 'Todas' ? 'Todas las Categorías' : selectedCategory}
            </h3>
            <span className="text-xs text-[#797583] bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
              {filteredProducts.length} prendas
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#797583] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Buscar por SKU, nombre, color..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#f8f9ff] border border-[#c9c4d3]/40 rounded-full focus:outline-none focus:border-[#42308f] w-52 text-[#0b1c30]"
              />
            </div>

            <div className="flex items-center bg-[#eff4ff] p-0.5 rounded-xl border border-[#c9c4d3]/30">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-[#42308f] text-white shadow-xs' : 'text-[#5e5d69] hover:text-[#42308f]'
                }`}
                title="Vista de lista"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-[#42308f] text-white shadow-xs' : 'text-[#5e5d69] hover:text-[#42308f]'
                }`}
                title="Vista de cuadrícula"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center mx-auto">
              {statusFilter === 'bajo' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              ) : (
                <Package className="w-7 h-7" />
              )}
            </div>
            <div>
              <h4 className="font-heading text-lg font-bold text-[#0b1c30]">
                {statusFilter === 'bajo'
                  ? '¡Excelente! No hay prendas con stock bajo en esta selección'
                  : statusFilter === 'agotado'
                  ? 'No hay prendas agotadas en esta selección'
                  : 'No hay prendas cargadas en este stock con los filtros actuales'}
              </h4>
              <p className="text-xs text-[#5e5d69] max-w-md mx-auto mt-1">
                {statusFilter !== 'all'
                  ? 'Las prendas revisadas cuentan con niveles normales o no cumplen con los filtros adicionales seleccionados.'
                  : 'Puedes limpiar los filtros de talle, temporada y color, o cargar una nueva prenda directamente a este stock.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-full border border-[#c9c4d3]/60 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  Restablecer Filtros
                </button>
              )}
              <button
                onClick={() => onOpenCargarProducto(selectedCategory !== 'Todas' ? selectedCategory : undefined)}
                className="px-5 py-2 rounded-full bg-[#42308f] text-white text-xs font-bold hover:bg-[#5a49a8] flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                Cargar Prenda Ahora
              </button>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-[#f8f9ff] text-[#5e5d69] text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold w-36">CÓDIGO</th>
                  <th className="px-6 py-4 font-semibold">PRENDA / MODELO</th>
                  <th className="px-6 py-4 font-semibold w-24 text-center">TALLE</th>
                  <th className="px-6 py-4 font-semibold w-28">COLOR</th>
                  <th className="px-6 py-4 font-semibold w-32">TEMPORADA</th>
                  <th className="px-6 py-4 font-semibold w-28 text-right">STOCK</th>
                  <th className="px-6 py-4 font-semibold w-40">UBICACIÓN</th>
                  <th className="px-6 py-4 font-semibold w-28 text-center">ESTADO</th>
                  <th className="px-6 py-4 font-semibold w-24 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredProducts.map((prod) => {
                  const promo = getActivePromotion(prod);
                  return (
                    <tr
                      key={prod.sku}
                      className="hover:bg-[#f8f9ff] transition-colors group cursor-pointer"
                      onClick={() => onEditStock(prod)}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-bold text-[#42308f]">
                        {prod.sku}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#0b1c30] group-hover:text-[#42308f] transition-colors">
                              {prod.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {prod.category}
                            </span>
                            {promo && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#eff4ff] text-[#42308f] border border-[#42308f]/20 shadow-2xs"
                                title={`Promoción activa: ${promo.title}`}
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {promo.discountType === 'porcentaje'
                                  ? `${promo.discountValue}% OFF`
                                  : promo.discountType === 'dos_por_uno'
                                  ? '2x1'
                                  : `$${promo.discountValue} OFF`}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#5e5d69] mt-0.5">
                            {prod.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSizeFilter(prod.size);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#eff4ff] hover:text-[#42308f] text-xs font-bold text-[#0b1c30] transition-colors"
                          title={`Filtrar por talle ${prod.size}`}
                        >
                          {prod.size}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const colDisplay = getProductColorDisplay(prod);
                          return (
                            <div
                              className="inline-flex items-center gap-2 cursor-pointer group/color"
                              onClick={(e) => {
                                e.stopPropagation();
                                setColorFilter(colDisplay.family);
                              }}
                              title={colDisplay.tooltipText}
                            >
                              <span
                                className="w-4 h-4 rounded-full inline-block shadow-xs shrink-0 ring-1 ring-black/10"
                                style={{ backgroundColor: prod.colorHex }}
                              />
                              <div>
                                <span className="text-xs font-semibold text-gray-800 group-hover:text-[#42308f] block">
                                  {colDisplay.primary}
                                </span>
                                {colDisplay.hasSpecific && (
                                  <span className="text-[10px] text-gray-500 font-normal block">
                                    Fam. {colDisplay.family}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSeasonFilter(prod.season);
                          }}
                          className="text-xs font-medium text-[#5e5d69] hover:text-[#42308f] transition-colors"
                          title={`Filtrar por temporada ${prod.season}`}
                        >
                          {prod.season}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-heading text-lg font-extrabold ${
                            prod.stock === 0 ? 'text-[#ba1a1a]' : 'text-[#42308f]'
                          }`}
                        >
                          {prod.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#5e5d69]">
                        <div className="font-semibold text-[#0b1c30]">
                          {prod.locationFacility}
                        </div>
                        <div className="text-[11px] text-[#797583]">
                          {prod.locationDetails}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(prod.status, prod.stock)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`btn-reponer-row-${prod.sku}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onQuickReplenish) {
                                onQuickReplenish(prod);
                              } else {
                                onOpenCargarProducto(prod.category);
                              }
                            }}
                            className="p-1.5 text-[#42308f] hover:text-[#5a49a8] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                            title="Reponer stock rápido (+ unidades)"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {onOpenRegistrarVenta && (
                            <button
                              id={`btn-vender-row-${prod.sku}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenRegistrarVenta(prod);
                              }}
                              disabled={prod.stock === 0}
                              className={`p-1.5 rounded-lg transition-colors ${
                                prod.stock === 0
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={
                                prod.stock === 0
                                  ? 'Sin stock para vender'
                                  : 'Vender prenda (Descontar stock)'
                              }
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </button>
                          )}
                          {onOpenReserva && (
                            <button
                              id={`btn-reservar-row-${prod.sku}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenReserva(prod);
                              }}
                              disabled={prod.stock === 0}
                              className={`p-1.5 rounded-lg transition-colors ${
                                prod.stock === 0
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-[#42308f] hover:text-[#5a49a8] hover:bg-[#eff4ff]'
                              }`}
                              title={
                                prod.stock === 0
                                  ? 'Sin stock para reservar'
                                  : 'Reservar con seña (Apartar prenda en perchero)'
                              }
                            >
                              <CalendarCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditStock(prod);
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#42308f] hover:bg-[#eff4ff] rounded-lg transition-colors"
                            title="Editar prenda"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {onDeleteProduct && (
                            <button
                              id={`btn-eliminar-stock-${prod.sku}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductToDelete(prod);
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar prenda del inventario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => {
              const promo = getActivePromotion(prod);
              return (
                <div
                  key={prod.sku}
                  onClick={() => onEditStock(prod)}
                  className="bg-[#f8f9ff] hover:bg-white rounded-2xl p-4 border border-[#c9c4d3]/40 hover:border-[#42308f]/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-bold text-[#42308f] bg-[#eff4ff] px-2 py-0.5 rounded-lg border border-[#42308f]/20">
                        {prod.sku}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {promo && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#eff4ff] text-[#42308f]"
                            title={`Promoción activa: ${promo.title}`}
                          >
                            <Tag className="w-2.5 h-2.5" />
                            Promo
                          </span>
                        )}
                        <span
                          className="w-4 h-4 rounded-full shadow-2xs ring-1 ring-black/10 shrink-0"
                          style={{ backgroundColor: prod.colorHex }}
                          title={getProductColorDisplay(prod).tooltipText}
                        />
                        {onDeleteProduct && (
                          <button
                            id={`btn-eliminar-grid-${prod.sku}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToDelete(prod);
                            }}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Eliminar prenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-heading font-bold text-sm text-[#0b1c30] group-hover:text-[#42308f]">
                      {prod.name}
                    </h4>
                    <p className="text-xs text-[#5e5d69] line-clamp-2 mt-0.5 mb-3">
                      {prod.description}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs font-bold text-[#0b1c30]">
                        Talle {prod.size}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs font-medium text-[#5e5d69]">
                        {prod.season}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-xs font-medium text-[#5e5d69]"
                        title={getProductColorDisplay(prod).tooltipText}
                      >
                        {getProductColorDisplay(prod).primary}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#797583] block uppercase">Stock</span>
                      <span
                        className={`font-heading text-lg font-extrabold ${
                          prod.stock === 0 ? 'text-[#ba1a1a]' : 'text-[#42308f]'
                        }`}
                      >
                        {prod.stock} u.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onQuickReplenish) {
                            onQuickReplenish(prod);
                          } else {
                            onOpenCargarProducto(prod.category);
                          }
                        }}
                        className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-purple-50 text-[#42308f] hover:bg-[#42308f] hover:text-white transition-all shadow-2xs cursor-pointer"
                        title="Reponer stock (+ unidades)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Reponer</span>
                      </button>
                      {onOpenRegistrarVenta && (
                        <button
                          id={`btn-vender-grid-${prod.sku}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRegistrarVenta(prod);
                          }}
                          disabled={prod.stock === 0}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
                            prod.stock === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white shadow-2xs'
                          }`}
                          title="Registrar venta y descontar stock"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Vender</span>
                        </button>
                      )}
                      {onOpenReserva && (
                        <button
                          id={`btn-reservar-grid-${prod.sku}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReserva(prod);
                          }}
                          disabled={prod.stock === 0}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
                            prod.stock === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-purple-50 text-[#42308f] hover:bg-[#42308f] hover:text-white shadow-2xs'
                          }`}
                          title="Apartar / Reservar con seña"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>Señar</span>
                        </button>
                      )}
                      <div>{getStatusBadge(prod.status, prod.stock)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {productToDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(productToDelete)}
          onClose={() => setProductToDelete(null)}
          onConfirm={() => {
            if (productToDelete && onDeleteProduct) {
              onDeleteProduct(productToDelete.sku);
              setProductToDelete(null);
            }
          }}
          title="Eliminar Prenda"
          itemName={`${productToDelete?.name} (${productToDelete?.sku})`}
          itemType="la prenda del inventario"
          confirmText="Sí, Eliminar Prenda"
          itemDetail={`Categoría: ${productToDelete?.category} | Talle: ${productToDelete?.size} | Color: ${productToDelete?.colorName} | Stock actual: ${productToDelete?.stock} u.`}
        />
      )}
    </div>
  );
};