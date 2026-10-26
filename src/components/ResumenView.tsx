import React, { useState, useMemo } from 'react';
import {
  Plus,
  Package,
  AlertTriangle,
  Ban,
  ArrowDownToLine,
  ArrowUpToLine,
  Search,
  ArrowRight,
  Shirt,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Filter,
  ShoppingBag,
  Calendar,
  Moon,
  Sun,
  RotateCcw,
  X,
  CheckCircle2,
  Activity,
  Layers,
  ShieldAlert,
  Printer
} from 'lucide-react';
import { CategorySummary, ProductItem, StockMovement, ReservaItem } from '../types';
import { Can, ROLES_GESTION } from './auth/Can';
import { ReporteImprimible } from './ReporteImprimible';

interface ResumenViewProps {
  categories: CategorySummary[];
  products: ProductItem[];
  movements?: StockMovement[];
  reservas?: ReservaItem[];
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
  reservas = [],
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
  
  // Estado fundamental para que funcione el switch
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isReporteOpen, setIsReporteOpen] = useState(false);

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

  // 1. FILTER PRODUCTS BY SELECTED SEASON
  const activeProducts = useMemo(() => {
    if (selectedSeason === 'Todas') return products;
    return products.filter((p) => (p.season || '').toLowerCase() === selectedSeason.toLowerCase());
  }, [products, selectedSeason]);

  // Set of active SKUs for the selected season to filter movements reactively
  const activeProductSkus = useMemo(() => {
    return new Set(activeProducts.map((p) => p.sku));
  }, [activeProducts]);

  // 2. DERIVED CATEGORIES (Calculamos el stock pero mantenemos TODAS las categorías creadas)
  const activeCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
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

      // Real physical units breakdown for stacked bars
      const okUnits = catProds
        .filter((p) => p.status === 'ok' && p.stock > p.minStockThreshold)
        .reduce((acc, p) => acc + p.stock, 0);

      const lowUnits = catProds
        .filter((p) => p.status === 'bajo' || (p.stock > 0 && p.stock <= p.minStockThreshold))
        .reduce((acc, p) => acc + p.stock, 0);

      return {
        ...cat,
        totalItems,
        lowStock,
        outOfStock,
        inStock,
        okUnits,
        lowUnits,
        modelsCount: catProds.length,
      };
    });
  }, [categories, activeProducts]);

  // Dynamic physical stock calculations computed directly from activeProducts
  const totalGarments = useMemo(() => {
    return activeProducts.reduce((acc, p) => acc + p.stock, 0);
  }, [activeProducts]);

  const totalLowStock = useMemo(() => {
    return activeProducts.filter(
      (p) => p.status === 'bajo' || (p.stock > 0 && p.stock <= p.minStockThreshold)
    ).length;
  }, [activeProducts]);

  const totalOutOfStock = useMemo(() => {
    return activeProducts.filter((p) => p.status === 'agotado' || p.stock === 0).length;
  }, [activeProducts]);

  const totalInStock = useMemo(() => {
    return activeProducts.filter(
      (p) => p.status === 'ok' && p.stock > p.minStockThreshold
    ).length;
  }, [activeProducts]);

  const outOfStockProducts = useMemo(() => {
    return activeProducts.filter((p) => p.status === 'agotado' || p.stock === 0);
  }, [activeProducts]);

  const lowStockProducts = useMemo(() => {
    return activeProducts.filter(
      (p) => p.status === 'bajo' || (p.stock > 0 && p.stock <= p.minStockThreshold)
    );
  }, [activeProducts]);

  // 3. MOVEMENTS FILTERED BY BOTH DATE AND SEASON
  const dateAndSeasonFilteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (selectedDate && !matchesMovementDate(m, selectedDate)) return false;
      if (selectedSeason !== 'Todas' && !activeProductSkus.has(m.sku)) return false;
      return true;
    });
  }, [movements, selectedDate, selectedSeason, activeProductSkus, todayStr, yesterdayStr]);

  const totalIngresos = useMemo(() => {
    return dateAndSeasonFilteredMovements
      .filter((m) => m.type === 'ingreso')
      .reduce((acc, m) => acc + Math.abs(m.quantity), 0);
  }, [dateAndSeasonFilteredMovements]);

  const totalEgresos = useMemo(() => {
    return dateAndSeasonFilteredMovements
      .filter((m) => m.type === 'egreso')
      .reduce((acc, m) => acc + Math.abs(m.quantity), 0);
  }, [dateAndSeasonFilteredMovements]);

  const totalModels = activeProducts.length;
  const percentOk = totalModels > 0 ? Math.round((totalInStock / totalModels) * 100) : 0;
  const percentBajo = totalModels > 0 ? Math.round((totalLowStock / totalModels) * 100) : 0;
  const percentAgotado = totalModels > 0 ? Math.max(0, 100 - percentOk - percentBajo) : 0;

  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius; 
  const okStroke = (percentOk / 100) * donutCircumference;
  const bajoStroke = (percentBajo / 100) * donutCircumference;
  const agotadoStroke = (percentAgotado / 100) * donutCircumference;

  const maxFlow = Math.max(totalIngresos, totalEgresos, 1);
  const flowBalance = totalIngresos - totalEgresos;
  const isDepleting = totalEgresos > totalIngresos;
  const hasFlowActivity = totalIngresos > 0 || totalEgresos > 0;

  const filteredCategories = useMemo(() => {
    return activeCategories.filter((c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [activeCategories, categorySearch]);

  const maxCategoryUnits = useMemo(() => {
    return Math.max(...activeCategories.map((c) => c.totalItems), 10);
  }, [activeCategories]);

  const mostCriticalCategory = useMemo(() => {
    if (activeCategories.length === 0) return null;
    return [...activeCategories].sort((a, b) => {
      if (b.outOfStock !== a.outOfStock) return b.outOfStock - a.outOfStock;
      return b.lowStock - a.lowStock;
    })[0];
  }, [activeCategories]);

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Resumen de Stock
          </h1>
        </div>
        
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* BOTÓN SWITCH MODO CLARO/OSCURO */}
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              // Activa el modo oscuro en toda la app
              document.documentElement.classList.toggle('dark'); 
            }}
            className={`relative inline-flex items-center h-[34px] w-[60px] rounded-full transition-colors cursor-pointer shadow-inner border ${
              isDarkMode ? 'bg-[#42308f] border-[#42308f]' : 'bg-[#f8f9ff] border-[#c9c4d3]/60'
            }`}
            title="Alternar Modo Oscuro"
          >
            <span
              className={`inline-flex items-center justify-center w-6 h-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                isDarkMode ? 'translate-x-[30px]' : 'translate-x-1'
              }`}
            >
              {isDarkMode ? <Moon className="w-3.5 h-3.5 text-[#42308f]" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            </span>
          </button>

          {onOpenCrearStock && (
            <Can role={['developer', 'admin']}>
              <button
                onClick={onOpenCrearStock}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#42308f]/40 rounded-full text-xs font-bold text-[#42308f] hover:bg-[#eff4ff] transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Crear Stock
              </button>
            </Can>
          )}
          {onOpenRegistrarVenta && (
            <button
              id="btn-resumen-registrar-venta"
              onClick={onOpenRegistrarVenta}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-full text-xs font-bold text-white transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Registrar venta y descontar stock"
            >
              <ShoppingBag className="w-4 h-4" />
              Registrar Venta
            </button>
          )}
          <Can role={['developer', 'admin']}>
            <button
              onClick={onOpenNuevoIngreso}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#42308f] rounded-full text-xs font-bold text-white hover:bg-[#5a49a8] transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Ingreso
            </button>
          </Can>
        </div>
      </div>

      {/* FILTER TOOLBAR: TEMPORADA & DÍA (REACTIVO EN TIEMPO REAL) */}
      <div className="bg-white rounded-3xl p-5 border border-[#c9c4d3]/40 card-shadow space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedSeason === season
                    ? 'bg-[#42308f] text-white shadow-xs'
                    : 'bg-[#f8f9ff] text-[#5e5d69] hover:text-[#42308f] hover:bg-[#eff4ff] border border-[#c9c4d3]/40'
                }`}
              >
                {season === 'Todas' ? 'Todas' : season}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b1c30]">
              <Calendar className="w-4 h-4 text-[#42308f]" />
              <span>Filtrar por Día:</span>
            </div>

            <div className="flex items-center gap-1 bg-[#f8f9ff] p-1 rounded-2xl border border-gray-200/70">
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDate === yesterdayStr
                    ? 'bg-[#42308f] text-white shadow-2xs'
                    : 'text-[#5e5d69] hover:text-[#0b1c30]'
                }`}
              >
                Ayer
              </button>
            </div>

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
                  className="ml-1.5 p-1 text-gray-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                  title="Limpiar filtro de fecha"
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
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors border border-rose-200 cursor-pointer"
                title="Restablecer filtros de temporada y fecha"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            )}
          </div>
        </div>

        {isAnyFilterActive && (
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap text-xs text-[#5e5d69]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#0b1c30]">Filtros activos:</span>
              {selectedSeason !== 'Todas' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-50 border border-[#42308f]/20 text-[#42308f] font-bold text-xs">
                  <Sun className="w-3 h-3 text-amber-500" />
                  Temporada: {selectedSeason}
                  <button
                    type="button"
                    onClick={() => setSelectedSeason('Todas')}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
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
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="text-[11px] text-[#797583]">
              Mostrando <strong>{totalGarments} prendas físicas</strong> ({totalModels} modelos)
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-[#c9c4d3]/40 card-shadow flex flex-col justify-between hover:border-[#42308f]/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-extrabold text-[#0b1c30]">
                    Salud del Inventario
                  </h3>
                  <span className="text-[11px] text-[#5e5d69]">
                    {selectedSeason !== 'Todas' ? `Catálogo de ${selectedSeason}` : 'Radiografía general de modelos'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#f8f9ff] border border-gray-200 text-[10px] font-bold text-[#42308f]">
                {totalModels} modelos
              </span>
            </div>

            <div className="flex items-center gap-5 pt-2 pb-1">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    className="stroke-gray-100"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {percentOk > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      stroke="#10b981"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={`${okStroke} ${donutCircumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  )}
                  {percentBajo > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      stroke="#f59e0b"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={`${bajoStroke} ${donutCircumference}`}
                      strokeDashoffset={`-${okStroke}`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  )}
                  {percentAgotado > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      stroke="#e11d48"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={`${agotadoStroke} ${donutCircumference}`}
                      strokeDashoffset={`-${okStroke + bajoStroke}`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  )}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-heading text-xl font-extrabold text-[#0b1c30] leading-none">
                    {percentOk}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mt-0.5">
                    Óptimo
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-700" title="Modelos con stock suficiente para la venta">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-[11px]">Óptimo:</span>
                  </div>
                  <span className="font-bold text-emerald-600 text-xs">
                    {percentOk}% <span className="text-gray-500 font-normal">({totalInStock} modelos)</span>
                  </span>
                </div>

                <div
                  onClick={onNavigateToLowStock}
                  className="flex items-center justify-between p-1 -mx-1 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors group"
                  title="Hacer clic para ver modelos con pocas unidades"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px] group-hover:text-amber-800">Stock Bajo:</span>
                  </div>
                  <span className="font-bold text-amber-600 text-xs flex items-center gap-1">
                    {percentBajo}% <span className="text-gray-500 font-normal">({totalLowStock} modelos)</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>

                <div
                  onClick={onNavigateToOutOfStock || onNavigateToLowStock}
                  className="flex items-center justify-between p-1 -mx-1 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors group"
                  title="Hacer clic para ver modelos agotados (0 unidades)"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px] group-hover:text-rose-800">Agotado:</span>
                  </div>
                  <span className="font-bold text-rose-600 text-xs flex items-center gap-1">
                    {percentAgotado}% <span className="text-gray-500 font-normal">({totalOutOfStock} modelos)</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#5e5d69]">
            <span>Total en percheros y depósito:</span>
            <span className="font-extrabold text-[#0b1c30]">
              {totalGarments.toLocaleString('es-AR')} prendas
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#c9c4d3]/40 card-shadow flex flex-col justify-between hover:border-[#42308f]/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#42308f] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-extrabold text-[#0b1c30]">
                    Entradas vs. Salidas
                  </h3>
                  <span className="text-[11px] text-[#5e5d69]">
                    {selectedDate
                      ? `Movimientos del ${formatReadableDate(selectedDate)}`
                      : 'Volumen físico de prendas'}
                  </span>
                </div>
              </div>

              {hasFlowActivity ? (
                isDepleting ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold flex items-center gap-1 animate-pulse">
                    <TrendingDown className="w-3 h-3" />
                    Desabastecimiento
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Abastecido
                  </span>
                )
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold">
                  Sin movimientos
                </span>
              )}
            </div>

            {hasFlowActivity ? (
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                      <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                      Prendas ingresadas
                    </span>
                    <span className="font-extrabold text-emerald-600">
                      +{totalIngresos.toLocaleString('es-AR')} unidades
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.round((totalIngresos / maxFlow) * 100))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-rose-800 flex items-center gap-1.5">
                      <ArrowUpToLine className="w-3.5 h-3.5 text-rose-600" />
                      Prendas vendidas o retiradas
                    </span>
                    <span className="font-extrabold text-rose-600">
                      -{totalEgresos.toLocaleString('es-AR')} unidades
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.round((totalEgresos / maxFlow) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#f8f9ff] rounded-2xl p-4 text-center my-2 border border-gray-100">
                <p className="text-xs font-semibold text-[#0b1c30]">
                  No se registraron movimientos en este período
                </p>
                <p className="text-[11px] text-[#5e5d69] mt-0.5">
                  No hubo ingresos ni egresos de prendas {selectedDate ? `el ${formatReadableDate(selectedDate)}` : 'para el filtro aplicado'}.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <div className="text-[11px] text-[#5e5d69]">
              {hasFlowActivity ? (
                isDepleting ? (
                  <span className="text-rose-700 font-semibold">
                    Salieron <strong>{Math.abs(flowBalance)} prendas más</strong> de las que ingresaron
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    Balance favorable: <strong>+{flowBalance} prendas</strong> en perchero
                  </span>
                )
              ) : (
                <span>Inventario estable sin altas ni bajas recientes</span>
              )}
            </div>
            <div className="text-[11px] font-bold text-[#42308f]">
              {dateAndSeasonFilteredMovements.length} registro{dateAndSeasonFilteredMovements.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div
          className={`rounded-3xl p-6 border card-shadow flex flex-col justify-between transition-all ${
            totalOutOfStock > 0
              ? 'bg-gradient-to-br from-rose-50/80 via-white to-red-50/40 border-rose-300/80 hover:border-rose-400'
              : totalLowStock > 0
              ? 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 border-amber-300/80 hover:border-amber-400'
              : 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 border-emerald-300/80 hover:border-emerald-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {totalOutOfStock > 0 ? (
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                ) : totalLowStock > 0 ? (
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0b1c30]">
                      SEMÁFORO DE REPOSICIÓN
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        totalOutOfStock > 0
                          ? 'bg-rose-500 ring-4 ring-rose-200 animate-ping'
                          : totalLowStock > 0
                          ? 'bg-amber-500 ring-4 ring-amber-200'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <h3 className="font-heading text-sm font-extrabold text-[#0b1c30]">
                    {totalOutOfStock > 0
                      ? 'Modelos en Quiebre'
                      : totalLowStock > 0
                      ? 'Stock Preventivo'
                      : 'Percheros Completos'}
                  </h3>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  totalOutOfStock > 0
                    ? 'bg-rose-600 text-white shadow-xs'
                    : totalLowStock > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {totalOutOfStock > 0 ? 'Crítico' : totalLowStock > 0 ? 'Alerta' : 'Óptimo'}
              </span>
            </div>

            <div className="mt-2 bg-white/85 backdrop-blur-xs p-3.5 rounded-2xl border border-rose-100/80 shadow-2xs space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase text-[#5e5d69]">
                  Prendas que requieren reposición
                </span>
                <span className="font-heading text-lg font-black text-rose-700">
                  {totalOutOfStock} modelo{totalOutOfStock !== 1 ? 's' : ''} agotado{totalOutOfStock !== 1 ? 's' : ''}
                </span>
              </div>

              {totalOutOfStock > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {outOfStockProducts.slice(0, 2).map((p) => (
                    <div
                      key={p.sku}
                      className="flex items-center justify-between text-[11px] bg-rose-50/60 px-2.5 py-1 rounded-lg border border-rose-100"
                    >
                      <span className="font-semibold text-gray-900 truncate max-w-[170px]" title={p.name}>
                        {p.name}
                      </span>
                      <span className="font-bold text-rose-700 shrink-0 text-[10px]">
                        0 un. (Talle {p.size})
                      </span>
                    </div>
                  ))}
                  {outOfStockProducts.length > 2 && (
                    <p className="text-[10px] text-gray-500 italic text-right">
                      + {outOfStockProducts.length - 2} modelo{outOfStockProducts.length - 2 > 1 ? 's' : ''} más sin stock
                    </p>
                  )}
                </div>
              ) : totalLowStock > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {lowStockProducts.slice(0, 2).map((p) => (
                    <div
                      key={p.sku}
                      className="flex items-center justify-between text-[11px] bg-amber-50/60 px-2.5 py-1 rounded-lg border border-amber-100"
                    >
                      <span className="font-semibold text-gray-900 truncate max-w-[170px]" title={p.name}>
                        {p.name}
                      </span>
                      <span className="font-bold text-amber-700 shrink-0 text-[10px]">
                        {p.stock} un. (Mín. {p.minStockThreshold})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-800 font-medium">
                  Todas las prendas tienen stock disponible por encima de su umbral mínimo de seguridad.
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-gray-100/80">
            {totalOutOfStock > 0 ? (
              <button
                onClick={onNavigateToOutOfStock || onNavigateToLowStock}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <span>Reponer {totalOutOfStock} modelo{totalOutOfStock !== 1 ? 's' : ''} agotado{totalOutOfStock !== 1 ? 's' : ''}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : totalLowStock > 0 ? (
              <button
                onClick={onNavigateToLowStock}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <span>Revisar {totalLowStock} modelo{totalLowStock !== 1 ? 's' : ''} con stock bajo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="w-full text-center text-xs font-bold text-emerald-700 py-1">
                ✓ Catálogo abastecido para atender clientes
              </div>
            )}
          </div>
        </div>
      </div>

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
                  {dateAndSeasonFilteredMovements.length} movimientos
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
                Prendas ingresadas
              </span>
              <span className="font-heading text-lg font-extrabold text-emerald-600">
                +{totalIngresos} unidades
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase block">
                Prendas egresadas / vendidas
              </span>
              <span className="font-heading text-lg font-extrabold text-rose-600">
                -{totalEgresos} unidades
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <span className="text-[10px] font-bold text-[#5e5d69] uppercase block">
                Balance Neto
              </span>
              <span
                className={`font-heading text-lg font-extrabold ${
                  flowBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {flowBalance > 0 ? `+${flowBalance}` : flowBalance} prendas
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedDate && dateAndSeasonFilteredMovements.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-[#c9c4d3]/40 card-shadow">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#42308f]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b1c30]">
                Prendas y movimientos del {formatReadableDate(selectedDate)}
              </h4>
            </div>
            <span className="text-xs text-[#5e5d69] font-semibold">
              {dateAndSeasonFilteredMovements.length} registro{dateAndSeasonFilteredMovements.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-bold text-[#5e5d69] uppercase border-b border-gray-100">
                  <th className="pb-2">Hora</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Prenda</th>
                  <th className="pb-2 text-right">Cant.</th>
                  <th className="pb-2">Destino / Proveedor</th>
                  <th className="pb-2">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dateAndSeasonFilteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-[#f8f9ff]">
                    <td className="py-2.5 pr-3 text-gray-500 font-medium whitespace-nowrap">
                      {m.date}
                    </td>
                    <td className="py-2.5 pr-3">
                      {m.type === 'ingreso' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 text-[10px]">
                          + Ingreso
                        </span>
                      )}
                      {m.type === 'egreso' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 text-[10px]">
                          - Egreso
                        </span>
                      )}
                      {m.type === 'ajuste' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-purple-50 text-[#42308f] text-[10px]">
                          Ajuste
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-gray-900">
                      {m.productName}
                      <span className="block font-mono text-[10px] text-[#42308f] font-normal">
                        {m.sku}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-extrabold">
                      <span
                        className={
                          m.quantity > 0
                            ? 'text-emerald-600'
                            : m.quantity < 0
                            ? 'text-rose-600'
                            : 'text-gray-700'
                        }
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-gray-700 font-medium">
                      {m.sourceOrDestination || '-'}
                    </td>
                    <td className="py-2.5 text-gray-500 text-[11px]">
                      {m.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#c9c4d3]/40 card-shadow overflow-hidden">
        <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
              Inventario por Colección
            </h2>
            <p className="text-xs text-[#5e5d69]">
              Prendas físicas en perchero y modelos que requieren reposición
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#797583] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Buscar colección..."
                className="pl-9 pr-4 py-1.5 text-xs bg-[#f8f9ff] border border-[#c9c4d3]/40 rounded-full focus:outline-none focus:border-[#42308f] focus:ring-1 focus:ring-[#42308f] text-[#0b1c30] w-48 transition-all"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {onOpenCrearStock && (
              <Can role={ROLES_GESTION}>
                <button
                  onClick={onOpenCrearStock}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#eff4ff] text-[#42308f] hover:bg-[#e0e9ff] rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Nuevo Stock
                </button>
              </Can>
            )}
            <button className="p-2 text-[#797583] hover:text-[#42308f] hover:bg-[#eff4ff] rounded-full transition-colors cursor-pointer" title="Filtros">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5e5d69]">
            <p className="font-semibold text-gray-900">
              No se encontraron colecciones con el término &quot;{categorySearch}&quot;
            </p>
            <button
              type="button"
              onClick={() => setCategorySearch('')}
              className="mt-2 text-[#42308f] font-bold hover:underline cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-t border-b border-gray-100 text-[11px] font-bold text-[#5e5d69] tracking-wider uppercase">
                  <th className="px-6 py-3.5">CATEGORÍA</th>
                  <th className="px-6 py-3.5">TOTAL PRENDAS</th>
                  <th className="px-6 py-3.5">MODELOS / ARTÍCULOS</th>
                  <th className="px-6 py-3.5">ESTADO DE REPOSICIÓN</th>
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

                      <td className="px-6 py-4">
                        <span className="font-extrabold text-[#0b1c30]">
                          {cat.totalItems.toLocaleString('es-AR')}
                        </span>{' '}
                        <span className="text-xs text-[#5e5d69]">prendas</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-medium text-[#5e5d69]">
                          {catProducts.length} {catProducts.length === 1 ? 'modelo' : 'modelos'}
                        </span>
                      </td>

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
                            Ver prendas
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
        )}
      </div>

      {/* Reporte Imprimible Modal */}
      {isReporteOpen && (
        <ReporteImprimible
          products={products}
          reservas={reservas}
          categories={categories}
          onClose={() => setIsReporteOpen(false)}
        />
      )}
    </div>
  );
};