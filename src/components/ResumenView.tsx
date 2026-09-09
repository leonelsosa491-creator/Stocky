import React, { useState, useMemo } from 'react';
import {
  Download,
  Plus,
  Package,
  AlertTriangle,
  Ban,
  ArrowDownToLine,
  ArrowUpToLine,
  MoreVertical,
  Search,
  ArrowRight,
  Shirt,
  Sparkles,
  TrendingUp,
  Filter,
  ShoppingBag,
  Calendar,
  Sun,
  RotateCcw,
  X,
  History
} from 'lucide-react';
import { CategorySummary, ProductItem, StockMovement } from '../types';

interface ResumenViewProps {
  categories: CategorySummary[];
  products: ProductItem[];
  movements?: StockMovement[];
  onSelectCategory: (categoryName: string) => void;
  onOpenNuevoIngreso: () => void;
  onOpenCrearStock?: () => void;
  onOpenRegistrarVenta?: () => void;
  onNavigateToLowStock?: () => void;
  onNavigateToOutOfStock?: () => void;
  onSelectCategoryWithFilter?: (categoryName: string, filter: 'all' | 'bajo' | 'agotado' | 'ok') => void;
  onExport: () => void;
}

export const ResumenView: React.FC<ResumenViewProps> = ({
  categories,
  products,
  movements = [],
  onSelectCategory,
  onOpenNuevoIngreso,
  onOpenCrearStock,
  onOpenRegistrarVenta,
  onNavigateToLowStock,
  onNavigateToOutOfStock,
  onSelectCategoryWithFilter,
  onExport,
}) => {
  const [categorySearch, setCategorySearch] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Filters: Season & Date
  const [selectedSeason, setSelectedSeason] = useState<string>('Todas');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Date constants for quick buttons
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Format readable date in Spanish
  const formatReadableDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return date.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to match movements to selected date
  const matchesMovementDate = (m: StockMovement, filterDate: string) => {
    if (!filterDate) return true;
    if (m.rawDate && m.rawDate === filterDate) return true;

    const lower = (m.date || '').toLowerCase();
    if (filterDate === todayStr && lower.includes('hoy')) return true;
    if (filterDate === yesterdayStr && lower.includes('ayer')) return true;
    if (m.date && m.date.includes(filterDate)) return true;

    try {
      const parts = filterDate.split('-');
      if (parts.length === 3) {
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const mIdx = parseInt(parts[1], 10) - 1;
        const dayNum = parseInt(parts[2], 10);
        if (lower.includes(`${dayNum} ${monthNames[mIdx]}`) || lower.includes(`${parts[2]} ${monthNames[mIdx]}`)) {
          return true;
        }
      }
    } catch {
      // ignore
    }

    return false;
  };

  // Filter products by selected season
  const activeProducts = useMemo(() => {
    if (selectedSeason === 'Todas') return products;
    return products.filter((p) => p.season.toLowerCase() === selectedSeason.toLowerCase());
  }, [products, selectedSeason]);

  // Derived categories based on activeProducts (reflects the selected season)
  const activeCategories = useMemo(() => {
    return categories.map((cat) => {
      const catProds = activeProducts.filter(
        (p) => p.category.toLowerCase() === cat.name.toLowerCase()
      );
      const totalItems = catProds.reduce((acc, p) => acc + p.stock, 0);
      const lowStock = catProds.filter(
        (p) => p.status === 'bajo' || (p.stock > 0 && p.stock <= p.minStockThreshold)
      ).length;
      const outOfStock = catProds.filter((p) => p.status === 'agotado' || p.stock === 0).length;
      const inStock = catProds.filter(
        (p) => p.status === 'ok' && p.stock > p.minStockThreshold
      ).length;

      return {
        ...cat,
        totalItems,
        lowStock,
        outOfStock,
        inStock,
      };
    });
  }, [categories, activeProducts]);

  // Dynamic calculations computed directly from activeProducts
  const totalGarments = activeProducts.reduce((acc, p) => acc + p.stock, 0);
  const totalLowStock = activeProducts.filter(
    (p) => p.status === 'bajo' || (p.stock > 0 && p.stock <= p.minStockThreshold)
  ).length;
  const totalOutOfStock = activeProducts.filter((p) => p.status === 'agotado' || p.stock === 0).length;
  const totalInStock = activeProducts.filter(
    (p) => p.status === 'ok' && p.stock > p.minStockThreshold
  ).length;

  // Movements filtered by date
  const dateFilteredMovements = useMemo(() => {
    if (!selectedDate) return movements;
    return movements.filter((m) => matchesMovementDate(m, selectedDate));
  }, [movements, selectedDate, todayStr, yesterdayStr]);

  const totalIngresos = dateFilteredMovements
    .filter((m) => m.type === 'ingreso')
    .reduce((acc, m) => acc + Math.abs(m.quantity), 0);

  const totalEgresos = dateFilteredMovements
    .filter((m) => m.type === 'egreso')
    .reduce((acc, m) => acc + Math.abs(m.quantity), 0);

  const totalModels = activeProducts.length;
  const percentOk = totalModels > 0 ? Math.round((totalInStock / totalModels) * 100) : 0;
  const percentBajo = totalModels > 0 ? Math.round((totalLowStock / totalModels) * 100) : 0;
  const percentAgotado = totalModels > 0 ? Math.max(0, 100 - percentOk - percentBajo) : 0;

  const filteredCategories = activeCategories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Distribution chart max reference
  const maxCategoryCount = Math.max(...activeCategories.map((c) => c.totalItems), 10);

  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'Remeras':
        return <Shirt className="w-4 h-4 text-[#5a49a8]" />;
      case 'Buzos':
        return <Package className="w-4 h-4 text-[#5a49a8]" />;
      case 'Pantalones':
        return (
          <svg className="w-4 h-4 text-[#5a49a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v18l3-2 3 2 3-2 3 2V3H6z" />
          </svg>
        );
      case 'Abrigos':
        return <Shirt className="w-4 h-4 text-[#ba1a1a]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#5a49a8]" />;
    }
  };

  const isAnyFilterActive = selectedSeason !== 'Todas' || selectedDate !== '';

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e5d69]">
            PANEL DE CONTROL
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Resumen
          </h1>
          <p className="text-xs text-[#5e5d69] mt-0.5">
            Métricas generales, salud del stock y movimientos de Melina Indumentaria.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c9c4d3]/60 rounded-full text-xs font-bold text-[#42308f] hover:bg-[#eff4ff] transition-all shadow-xs active:scale-95"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          {onOpenCrearStock && (
            <button
              onClick={onOpenCrearStock}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#42308f]/40 rounded-full text-xs font-bold text-[#42308f] hover:bg-[#eff4ff] transition-all shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Crear Stock
            </button>
          )}
          {onOpenRegistrarVenta && (
            <button
              id="btn-resumen-registrar-venta"
              onClick={onOpenRegistrarVenta}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-full text-xs font-bold text-white transition-all shadow-sm active:scale-95"
              title="Registrar venta y descontar stock"
            >
              <ShoppingBag className="w-4 h-4" />
              Registrar Venta
            </button>
          )}
          <button
            onClick={onOpenNuevoIngreso}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#42308f] rounded-full text-xs font-bold text-white hover:bg-[#5a49a8] transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR: DIA (CALENDARIO) & TEMPORADA */}
      <div className="bg-white rounded-3xl p-5 border border-[#c9c4d3]/40 card-shadow space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Season Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b1c30] mr-1">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Temporada:</span>
            </div>
            {['Todas', 'Verano', 'Otoño', 'Invierno', 'Primavera'].map((season) => (
              <button
                key={season}
                type="button"
                onClick={() => setSelectedSeason(season)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedSeason === season
                    ? 'bg-[#42308f] text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-[#5e5d69] hover:text-[#42308f] hover:bg-[#eff4ff] border border-[#c9c4d3]/40'
                }`}
              >
                {season === 'Todas' ? 'Todas' : season}
              </button>
            ))}
          </div>

          {/* Calendar / Day Filter */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b1c30]">
              <Calendar className="w-4 h-4 text-[#42308f]" />
              <span>Filtrar por Día:</span>
            </div>

            {/* Quick shortcuts */}
            <div className="flex items-center gap-1 bg-[#f8f9ff] p-1 rounded-2xl border border-gray-200/70">
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedDate === ''
                    ? 'bg-[#42308f] text-white shadow-2xs'
                    : 'text-[#5e5d69] hover:text-[#0b1c30]'
                }`}
              >
                Histórico
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedDate === todayStr
                    ? 'bg-[#42308f] text-white shadow-2xs'
                    : 'text-[#5e5d69] hover:text-[#0b1c30]'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedDate === yesterdayStr
                    ? 'bg-[#42308f] text-white shadow-2xs'
                    : 'text-[#5e5d69] hover:text-[#0b1c30]'
                }`}
              >
                Ayer
              </button>
            </div>

            {/* HTML5 Native Calendar Date Picker */}
            <div className="relative flex items-center">
              <input
                id="resumen-date-filter"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 bg-[#f8f9ff] border border-[#c9c4d3]/60 rounded-xl text-[#0b1c30] focus:border-[#42308f] focus:outline-none cursor-pointer"
                title="Elegir una fecha específica desde el calendario"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="ml-1.5 p-1 text-gray-400 hover:text-rose-600 rounded-full transition-colors"
                  title="Limpiar fecha"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSeason('Todas');
                  setSelectedDate('');
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors border border-rose-200"
                title="Restablecer filtros de temporada y fecha"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary Bar */}
        {isAnyFilterActive && (
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap text-xs text-[#5e5d69]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#0b1c30]">Filtros aplicados:</span>
              {selectedSeason !== 'Todas' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-50 border border-[#42308f]/20 text-[#42308f] font-bold text-xs">
                  <Sun className="w-3 h-3 text-amber-500" />
                  Temporada: {selectedSeason}
                  <button
                    type="button"
                    onClick={() => setSelectedSeason('Todas')}
                    className="hover:text-rose-600 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedDate && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  Día: {formatReadableDate(selectedDate)}
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="hover:text-rose-600 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="text-[11px] text-[#797583]">
              Visualizando <strong>{totalGarments} prendas</strong> ({totalModels} modelos)
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Activity Highlight (When a day is selected via calendar) */}
      {selectedDate && (
        <div className="bg-gradient-to-r from-[#eff4ff] via-white to-[#fbf8ff] rounded-3xl p-5 border border-[#42308f]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#42308f] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#42308f]">
                  ACTIVIDAD DEL DÍA
                </span>
                <span className="px-2 py-0.2 rounded-full bg-white text-[#42308f] border border-[#42308f]/20 text-[10px] font-extrabold">
                  {dateFilteredMovements.length} movimientos
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-base text-[#0b1c30]">
                {formatReadableDate(selectedDate)}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                Ingresos
              </span>
              <span className="font-heading text-lg font-extrabold text-emerald-600">
                +{totalIngresos} u.
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase block">
                Egresos / Ventas
              </span>
              <span className="font-heading text-lg font-extrabold text-rose-600">
                -{totalEgresos} u.
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <span className="text-[10px] font-bold text-[#5e5d69] uppercase block">
                Balance Neto
              </span>
              <span
                className={`font-heading text-lg font-extrabold ${
                  totalIngresos - totalEgresos >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {totalIngresos - totalEgresos > 0 ? `+${totalIngresos - totalEgresos}` : totalIngresos - totalEgresos} u.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total de Prendas */}
        <div className="bg-white rounded-3xl p-6 border border-[#c9c4d3]/40 card-shadow relative overflow-hidden group hover:border-[#42308f]/30 transition-all">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#5e5d69] tracking-wider uppercase">
              TOTAL DE PRENDAS
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            {totalGarments.toLocaleString('es-AR')}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {totalModels} modelos en {activeCategories.length} categorías
              {selectedSeason !== 'Todas' ? ` (${selectedSeason})` : ''}
            </span>
          </div>
        </div>

        {/* Card 2: Stock Bajo */}
        <div
          id="card-resumen-stock-bajo"
          onClick={onNavigateToLowStock}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToLowStock?.();
            }
          }}
          className="bg-white rounded-3xl p-6 border border-[#c9c4d3]/40 card-shadow relative overflow-hidden group hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer select-none text-left active:scale-[0.99]"
          title="Hacer clic para ver en la pestaña Stock las prendas con stock bajo"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#5e5d69] tracking-wider uppercase group-hover:text-amber-700 transition-colors">
              STOCK BAJO
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[#0b1c30] tracking-tight group-hover:text-amber-600 transition-colors">
            {totalLowStock}
          </div>
          <div className="mt-2">
            <p className="text-xs text-[#5e5d69] group-hover:text-amber-900 transition-colors">
              {totalLowStock === 1 ? '1 modelo con stock crítico' : `${totalLowStock} modelos con stock crítico`}
            </p>
          </div>
        </div>

        {/* Card 3: Sin Stock */}
        <div
          id="card-resumen-sin-stock"
          onClick={onNavigateToOutOfStock || onNavigateToLowStock}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              (onNavigateToOutOfStock || onNavigateToLowStock)?.();
            }
          }}
          className="bg-white rounded-3xl p-6 border border-[#c9c4d3]/40 card-shadow relative overflow-hidden group hover:border-rose-400 hover:shadow-lg transition-all cursor-pointer select-none text-left active:scale-[0.99]"
          title="Hacer clic para ver en la pestaña Stock los artículos sin stock"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#ba1a1a] flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <Ban className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#5e5d69] tracking-wider uppercase group-hover:text-rose-700 transition-colors">
              SIN STOCK
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[#0b1c30] tracking-tight group-hover:text-[#ba1a1a] transition-colors">
            {totalOutOfStock}
          </div>
          <div className="mt-2">
            <p className="text-xs text-[#5e5d69] group-hover:text-rose-900 transition-colors">
              {totalOutOfStock === 1 ? '1 modelo agotado (0 un.)' : `${totalOutOfStock} modelos agotados (0 un.)`}
            </p>
          </div>
        </div>

        {/* Card 4: Ingresos de Stock */}
        <div className="bg-white rounded-3xl p-6 border border-[#c9c4d3]/40 card-shadow relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-[#5e5d69] tracking-wider uppercase">
              {selectedDate ? 'INGRESOS DEL DÍA' : 'INGRESOS DE STOCK'}
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            {totalIngresos.toLocaleString('es-AR')}
          </div>
          <p className="text-xs text-[#5e5d69] mt-2">
            {selectedDate
              ? `Prendas ingresadas el ${formatReadableDate(selectedDate)}`
              : 'Prendas ingresadas registradas'}
          </p>
        </div>
      </div>

      {/* Middle Row: Distribución por Categoría + Estado del Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Distribución por Categoría (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#c9c4d3]/40 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
                Distribución por Categoría {selectedSeason !== 'Todas' ? `(${selectedSeason})` : ''}
              </h2>
              <p className="text-xs text-[#5e5d69]">Cantidad de prendas físicas por tipo de stock</p>
            </div>
            <button className="text-[#797583] hover:text-[#42308f] p-1 rounded-full">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Visual Bar Chart */}
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-6 border-b border-gray-100 relative">
              {/* Background Guideline Lines */}
              <div className="absolute inset-x-0 top-0 border-b border-dashed border-gray-100 pointer-events-none"></div>
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-gray-100 pointer-events-none"></div>

              {activeCategories.map((cat) => {
                const heightPercent = Math.max(12, Math.round((cat.totalItems / maxCategoryCount) * 100));
                const isHovered = hoveredCategory === cat.name;

                return (
                  <div
                    key={cat.name}
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => onSelectCategory(cat.name)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  >
                    {/* Tooltip value */}
                    <div
                      className={`text-xs font-bold mb-1 transition-all ${
                        isHovered ? 'text-[#42308f] scale-110' : 'text-[#797583]'
                      }`}
                    >
                      {cat.totalItems} un.
                    </div>

                    {/* Bar graphic */}
                    <div className="w-full max-w-[48px] bg-[#eff4ff] rounded-t-xl overflow-hidden relative transition-all duration-300 group-hover:bg-[#d2c8ff]/50"
                         style={{ height: `${heightPercent}%` }}>
                      <div
                        className={`w-full h-full transition-all duration-300 rounded-t-xl ${
                          cat.outOfStock > 0
                            ? 'bg-gradient-to-t from-[#5a49a8] to-rose-500/80'
                            : cat.lowStock > 0
                            ? 'bg-gradient-to-t from-[#42308f] to-amber-500/80'
                            : 'bg-gradient-to-t from-[#42308f] to-[#7967c7]'
                        } opacity-90 group-hover:opacity-100`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category Names below bars */}
            <div className="flex items-center justify-between gap-3 sm:gap-6 px-2 sm:px-6 pt-3 text-xs font-semibold text-[#5e5d69]">
              {activeCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => onSelectCategory(cat.name)}
                  className="flex-1 text-center hover:text-[#42308f] transition-colors truncate"
                  title={cat.name}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Estado del Stock (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#c9c4d3]/40 card-shadow flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
              Estado del Stock
            </h2>
            <p className="text-xs text-[#5e5d69]">Salud del inventario en {totalModels} modelos</p>
          </div>

          <div className="space-y-5 my-auto">
            {/* Óptimo */}
            <div>
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <div className="flex items-center gap-2 text-[#0b1c30]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Óptimo</span>
                </div>
                <span className="text-emerald-600 font-bold">{percentOk}% ({totalInStock} modelos)</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percentOk}%` }}></div>
              </div>
            </div>

            {/* Bajo */}
            <div
              onClick={onNavigateToLowStock}
              role="button"
              className="cursor-pointer group p-2 -mx-2 rounded-xl hover:bg-amber-50/70 transition-all text-left"
              title="Click para ver artículos con stock bajo"
            >
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <div className="flex items-center gap-2 text-[#0b1c30] group-hover:text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Bajo</span>
                </div>
                <span className="text-amber-600 font-bold flex items-center gap-1 group-hover:underline text-xs">
                  {percentBajo}% ({totalLowStock} {totalLowStock === 1 ? 'modelo' : 'modelos'}) <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${percentBajo}%` }}></div>
              </div>
            </div>

            {/* Agotado */}
            <div
              onClick={onNavigateToOutOfStock || onNavigateToLowStock}
              role="button"
              className="cursor-pointer group p-2 -mx-2 rounded-xl hover:bg-rose-50/70 transition-all text-left"
              title="Click para ir al Stock con artículos agotados"
            >
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <div className="flex items-center gap-2 text-[#0b1c30] group-hover:text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Agotado</span>
                </div>
                <span className="text-rose-600 font-bold flex items-center gap-1 group-hover:underline text-xs">
                  {percentAgotado}% ({totalOutOfStock} {totalOutOfStock === 1 ? 'modelo' : 'modelos'}) <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${percentAgotado}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Resumen por Categoría Table */}
      <div className="bg-white rounded-3xl border border-[#c9c4d3]/40 card-shadow overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
              Resumen por Categoría
            </h2>
            <p className="text-xs text-[#5e5d69]">Prendas físicas y modelos registrados en cada colección</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#797583] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Buscar categoría..."
                className="pl-9 pr-4 py-1.5 text-xs bg-[#f8f9ff] border border-[#c9c4d3]/40 rounded-full focus:outline-none focus:border-[#42308f] focus:ring-1 focus:ring-[#42308f] text-[#0b1c30] w-48 transition-all"
              />
            </div>
            {onOpenCrearStock && (
              <button
                onClick={onOpenCrearStock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#eff4ff] text-[#42308f] hover:bg-[#e0e9ff] rounded-full text-xs font-bold transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                + Nuevo Stock
              </button>
            )}
            <button className="p-2 text-[#797583] hover:text-[#42308f] hover:bg-[#eff4ff] rounded-full transition-colors" title="Filtros">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-t border-b border-gray-100 text-[11px] font-bold text-[#5e5d69] tracking-wider uppercase">
                <th className="px-6 py-3.5">CATEGORÍA</th>
                <th className="px-6 py-3.5">TOTAL PRENDAS</th>
                <th className="px-6 py-3.5">MODELOS / ARTÍCULOS</th>
                <th className="px-6 py-3.5">ESTADO CRÍTICO</th>
                <th className="px-6 py-3.5 text-right">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredCategories.map((cat) => {
                const catProducts = activeProducts.filter(
                  (p) => p.category.toLowerCase() === cat.name.toLowerCase()
                );
                const hasCritical = cat.outOfStock > 0 || cat.lowStock > 0;

                return (
                  <tr
                    key={cat.name}
                    className="hover:bg-[#f8f9ff]/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectCategory(cat.name)}
                  >
                    {/* Categoría */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center shrink-0">
                          {getCategoryIcon(cat.name)}
                        </div>
                        <div>
                          <span className="font-semibold text-[#0b1c30] group-hover:text-[#42308f] transition-colors block">
                            {cat.name}
                          </span>
                          {cat.description && (
                            <span className="text-[11px] text-[#797583] block">
                              {cat.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total Prendas (Unidades físicas) */}
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-[#0b1c30]">
                        {cat.totalItems.toLocaleString('es-AR')}
                      </span>{' '}
                      <span className="text-xs text-[#5e5d69]">unidades</span>
                    </td>

                    {/* Modelos / Artículos registrados */}
                    <td className="px-6 py-4">
                      <span className="font-medium text-[#5e5d69]">
                        {catProducts.length} {catProducts.length === 1 ? 'modelo' : 'modelos'}
                      </span>
                    </td>

                    {/* Estado Crítico (Stock Bajo y Agotados) */}
                    <td
                      className="px-6 py-4"
                      onClick={(e) => {
                        if (cat.outOfStock > 0) {
                          e.stopPropagation();
                          onSelectCategoryWithFilter?.(cat.name, 'agotado');
                        } else if (cat.lowStock > 0) {
                          e.stopPropagation();
                          onSelectCategoryWithFilter?.(cat.name, 'bajo');
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {cat.outOfStock > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-[#ba1a1a] border border-rose-200/80 hover:bg-rose-100 cursor-pointer transition-colors"
                            title="Ver modelos agotados"
                          >
                            <Ban className="w-3 h-3" /> {cat.outOfStock} agotado{cat.outOfStock > 1 ? 's' : ''}
                          </span>
                        )}
                        {cat.lowStock > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 cursor-pointer transition-colors"
                            title="Ver modelos con stock bajo"
                          >
                            <AlertTriangle className="w-3 h-3" /> {cat.lowStock} stock bajo
                          </span>
                        )}
                        {!hasCritical && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Óptimo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Acción */}
                    <td className="px-6 py-4 text-right">
                      {hasCritical ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (cat.outOfStock > 0) {
                              onSelectCategoryWithFilter?.(cat.name, 'agotado');
                            } else {
                              onSelectCategoryWithFilter?.(cat.name, 'bajo');
                            }
                          }}
                          className="px-4 py-1.5 bg-[#ba1a1a] text-white text-xs font-bold rounded-full hover:bg-rose-700 transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          Revisar
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCategory(cat.name);
                          }}
                          className="px-4 py-1.5 border border-[#42308f] text-[#42308f] text-xs font-bold rounded-full hover:bg-[#42308f] hover:text-white transition-all inline-flex items-center gap-1 group-hover:bg-[#42308f] group-hover:text-white cursor-pointer"
                        >
                          Detalles
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
