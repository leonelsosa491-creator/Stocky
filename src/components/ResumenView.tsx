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
  Sunrise,
  RotateCcw,
  X,
  CheckCircle2,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { CategorySummary, ProductItem, StockMovement, ReservaItem } from '../types';
import { Can, ROLES_GESTION } from './auth/Can';
import { ReporteImprimible } from './ReporteImprimible';
import { useAuth } from '../context/AuthContext';

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

/* ------------------------------------------------------------------ */
/* Tokens de diseño compartidos (un solo lugar para mantener la armonía) */
/* ------------------------------------------------------------------ */
const CARD = 'bg-white rounded-3xl border border-[#c9c4d3]/40 card-shadow card-hover';
const FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42308f]/40 focus-visible:ring-offset-1';

// Colores semánticos del gráfico (éxito / advertencia / crítico)
const COLOR_OK = '#0c9b72';
const COLOR_LOW = '#e99a00';
const COLOR_OUT = '#e63858';

const plural = (n: number, singular: string, pluralForm: string) => (n === 1 ? singular : pluralForm);

/* Encabezado reutilizable para todas las tarjetas del dashboard */
interface CardHeaderProps {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({ icon, iconClass, title, subtitle, right }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-heading text-base font-bold text-[#0b1c30] leading-tight whitespace-nowrap">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-[#5e5d69] mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
    {right && <div className="shrink-0">{right}</div>}
  </div>
);

/* Fila de la leyenda del gráfico (clickeable solo si tiene acción) */
interface LegendRowProps {
  dotClass: string;
  textClass: string;
  label: string;
  percent: number;
  count: number;
  title: string;
  onClick?: () => void;
}

const LegendRow: React.FC<LegendRowProps> = ({ dotClass, textClass, label, percent, count, title, onClick }) => {
  const content = (
    <>
      <span className="flex items-center gap-2 min-w-0">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-[13px] font-semibold text-[#0b1c30] truncate">{label}</span>
      </span>
      <span className="text-right shrink-0">
        <span className={`block text-[13px] font-bold tabular-nums leading-tight ${textClass}`}>{percent}%</span>
        <span className="block text-xs text-[#5e5d69] leading-tight">
          {count} {plural(count, 'modelo', 'modelos')}
        </span>
      </span>
    </>
  );

  const base = 'flex items-center justify-between gap-3 w-full rounded-xl px-2 py-1.5 text-left';

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${base} hover:bg-[#f8f9ff] transition-colors cursor-pointer ${FOCUS}`}
    >
      {content}
    </button>
  ) : (
    <div title={title} className={base}>
      {content}
    </div>
  );
};

const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
  // Saludo según la hora, con el nombre de pila de quien está logueada
  const { user } = useAuth();
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buen día' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';
  const nombrePila = user?.name?.trim().split(' ')[0] ?? '';
  const SaludoIcono = hora < 12 ? Sunrise : hora < 20 ? Sun : Moon;
  const saludoIconColor = hora < 20 ? 'text-amber-500' : 'text-[#42308f]';

  const [categorySearch, setCategorySearch] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const [isReporteOpen, setIsReporteOpen] = useState(false);

  // Filters: Season & Date
  const [selectedSeason, setSelectedSeason] = useState<string>('Todas');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Date constants for quick buttons
  const todayStr = useMemo(() => toLocalISO(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toLocalISO(d);
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

  // Estado del semáforo de reposición (misma semántica de siempre: agotado > bajo > ok)
  const alertTone: 'critical' | 'warning' | 'ok' =
    totalOutOfStock > 0 ? 'critical' : totalLowStock > 0 ? 'warning' : 'ok';

  const toneStyles = {
    critical: {
      iconBox: 'bg-rose-50 text-rose-600',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      button: 'bg-rose-600 hover:bg-rose-700',
      Icon: ShieldAlert,
      title: 'Modelos en Quiebre',
      badgeText: 'Crítico',
    },
    warning: {
      iconBox: 'bg-amber-50 text-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      button: 'bg-amber-600 hover:bg-amber-700',
      Icon: AlertTriangle,
      title: 'Stock Preventivo',
      badgeText: 'Alerta',
    },
    ok: {
      iconBox: 'bg-emerald-50 text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      Icon: CheckCircle2,
      title: 'Percheros Completos',
      badgeText: 'Óptimo',
    },
  }[alertTone];

  // Lista corta para la tarjeta: primero los agotados, después los de stock bajo
  const outOfStockSkus = new Set(outOfStockProducts.map((p) => p.sku));
  const alertList = [
    ...outOfStockProducts.map((p) => ({ product: p, kind: 'agotado' as const })),
    ...lowStockProducts
      .filter((p) => !outOfStockSkus.has(p.sku))
      .map((p) => ({ product: p, kind: 'bajo' as const })),
  ];
  const ALERT_LIST_LIMIT = 3;
  const alertListShown = alertList.slice(0, ALERT_LIST_LIMIT);
  const alertListRemaining = alertList.length - alertListShown.length;

  // Clases comunes de botones del encabezado (misma altura y radio)
  const headerBtn =
    'inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#42308f]/15 active:scale-95 active:translate-y-0 cursor-pointer';

  // Clases comunes de controles de filtro (misma altura)
  const pillBase = `h-9 px-4 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${FOCUS}`;
  const segBase = `h-7 px-3.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${FOCUS}`;

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 mb-1 font-heading text-lg font-semibold tracking-tight text-[#5e5d69]">
            <span>
              {saludo}
              {nombrePila && (
                <>
                  ,{' '}
                  <span className="font-extrabold text-[#42308f]">{nombrePila}</span>
                </>
              )}
            </span>
            <SaludoIcono className={`w-5 h-5 ${saludoIconColor}`} />
          </p>
          <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Resumen de Stock
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {onOpenCrearStock && (
            <Can role={['developer', 'admin']}>
              <button
                id="btn-crear-categoria"
                onClick={onOpenCrearStock}
                className={`${headerBtn} tour-step-crear-categoria bg-white border border-[#42308f]/40 text-[#42308f] hover:bg-[#f8f9ff] ${FOCUS}`}
              >
                <Plus className="w-4 h-4" />
                Crear Categoría
              </button>
            </Can>
          )}
          {onOpenRegistrarVenta && (
            <button
              id="btn-resumen-registrar-venta"
              onClick={onOpenRegistrarVenta}
              className={`${headerBtn} bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ${FOCUS}`}
              title="Registrar venta y descontar stock"
            >
              <ShoppingBag className="w-4 h-4" />
              Registrar Venta
            </button>
          )}
          <Can role={['developer', 'admin']}>
            <button
              onClick={onOpenNuevoIngreso}
              className={`${headerBtn} bg-[#42308f] hover:bg-[#5a49a8] text-white shadow-sm ${FOCUS}`}
            >
              <Plus className="w-4 h-4" />
              Nuevo Ingreso
            </button>
          </Can>
        </div>
      </div>

      {/* FILTER TOOLBAR: TEMPORADA & DÍA (REACTIVO EN TIEMPO REAL) */}
      <div className={`${CARD} p-5 space-y-4`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#0b1c30] mr-1">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Temporada</span>
            </div>
            {['Todas', 'Verano', 'Otoño', 'Invierno', 'Primavera'].map((season) => (
              <button
                key={season}
                type="button"
                aria-pressed={selectedSeason === season}
                onClick={() => setSelectedSeason(season)}
                className={`${pillBase} ${
                  selectedSeason === season
                    ? 'bg-[#42308f] text-white'
                    : 'bg-white text-[#5e5d69] border border-[#c9c4d3]/60 hover:text-[#42308f] hover:bg-[#f8f9ff]'
                }`}
              >
                {season}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#0b1c30]">
              <Calendar className="w-4 h-4 text-[#42308f]" />
              <span>Filtrar por día</span>
            </div>

            <div className="inline-flex items-center h-9 p-1 gap-0.5 bg-[#f8f9ff] rounded-full border border-[#c9c4d3]/40">
              <button
                type="button"
                aria-pressed={selectedDate === ''}
                onClick={() => setSelectedDate('')}
                className={`${segBase} ${
                  selectedDate === '' ? 'bg-[#42308f] text-white' : 'text-[#5e5d69] hover:text-[#0b1c30]'
                }`}
              >
                Histórico
              </button>
              <button
                type="button"
                aria-pressed={selectedDate === todayStr}
                onClick={() => setSelectedDate(todayStr)}
                className={`${segBase} ${
                  selectedDate === todayStr ? 'bg-[#42308f] text-white' : 'text-[#5e5d69] hover:text-[#0b1c30]'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                aria-pressed={selectedDate === yesterdayStr}
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`${segBase} ${
                  selectedDate === yesterdayStr ? 'bg-[#42308f] text-white' : 'text-[#5e5d69] hover:text-[#0b1c30]'
                }`}
              >
                Ayer
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                id="resumen-date-filter"
                type="date"
                aria-label="Elegir una fecha específica"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`h-9 text-[13px] font-semibold px-4 bg-white border border-[#c9c4d3]/60 rounded-full text-[#0b1c30] focus:border-[#42308f] cursor-pointer ${FOCUS}`}
                title="Elegir una fecha específica desde el calendario"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  aria-label="Limpiar filtro de fecha"
                  className={`ml-1.5 p-1.5 text-gray-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer ${FOCUS}`}
                  title="Limpiar filtro de fecha"
                >
                  <X className="w-4 h-4" />
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
                className={`inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-colors border border-rose-200 cursor-pointer ${FOCUS}`}
                title="Restablecer filtros de temporada y fecha"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            )}
          </div>
        </div>

        {isAnyFilterActive && (
          <div className="pt-4 border-t border-[#c9c4d3]/30 flex items-center justify-between gap-3 flex-wrap text-xs text-[#5e5d69]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#0b1c30]">Filtros activos:</span>
              {selectedSeason !== 'Todas' && (
                <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#f4f1fb] border border-[#42308f]/20 text-[#42308f] font-semibold text-xs">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Temporada: {selectedSeason}
                  <button
                    type="button"
                    onClick={() => setSelectedSeason('Todas')}
                    aria-label="Quitar filtro de temporada"
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {selectedDate && (
                <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#f4f1fb] border border-[#42308f]/20 text-[#42308f] font-semibold text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  Día: {formatReadableDate(selectedDate)}
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    aria-label="Quitar filtro de fecha"
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>

            <div className="text-xs text-[#5e5d69]">
              Mostrando <strong className="text-[#0b1c30]">{totalGarments} prendas físicas</strong> ({totalModels} {plural(totalModels, 'modelo', 'modelos')})
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* ---------------- SALUD DEL INVENTARIO ---------------- */}
        <div className={`${CARD} p-6 flex flex-col justify-between`}>
          <div>
            <CardHeader
              icon={<Activity className="w-5 h-5" />}
              iconClass="bg-emerald-50 text-emerald-600"
              title="Salud del Inventario"
              subtitle={selectedSeason !== 'Todas' ? `Catálogo de ${selectedSeason}` : 'Radiografía general de modelos'}
              right={
                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#f4f1fb] text-xs font-semibold text-[#42308f] whitespace-nowrap">
                  {totalModels} {plural(totalModels, 'modelo', 'modelos')}
                </span>
              }
            />

            <div className="flex items-center gap-4 pt-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                  role="img"
                  aria-label={`Inventario: ${percentOk}% óptimo, ${percentBajo}% stock bajo, ${percentAgotado}% agotado`}
                >
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
                      stroke={COLOR_OK}
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
                      stroke={COLOR_LOW}
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
                      stroke={COLOR_OUT}
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
                  <span className="font-heading text-xl font-extrabold text-[#0b1c30] leading-none tabular-nums">
                    {percentOk}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mt-1">
                    Óptimo
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <LegendRow
                  dotClass="bg-[#0c9b72]"
                  textClass="text-emerald-700"
                  label="Óptimo"
                  percent={percentOk}
                  count={totalInStock}
                  title="Modelos con stock suficiente para la venta"
                />
                <LegendRow
                  dotClass="bg-[#e99a00]"
                  textClass="text-amber-700"
                  label="Stock bajo"
                  percent={percentBajo}
                  count={totalLowStock}
                  title="Hacer clic para ver modelos con pocas unidades"
                  onClick={onNavigateToLowStock}
                />
                <LegendRow
                  dotClass="bg-[#e63858]"
                  textClass="text-rose-700"
                  label="Agotado"
                  percent={percentAgotado}
                  count={totalOutOfStock}
                  title="Hacer clic para ver modelos agotados (0 unidades)"
                  onClick={onNavigateToOutOfStock || onNavigateToLowStock}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#c9c4d3]/30 min-h-[40px] flex items-center justify-between text-xs text-[#5e5d69]">
            <span>Total en percheros y depósito</span>
            <span className="text-sm font-extrabold text-[#0b1c30] tabular-nums">
              {totalGarments.toLocaleString('es-AR')} prendas
            </span>
          </div>
        </div>

        {/* ---------------- ENTRADAS VS. SALIDAS ---------------- */}
        <div className={`${CARD} p-6 flex flex-col justify-between`}>
          <div>
            <CardHeader
              icon={<TrendingUp className="w-5 h-5" />}
              iconClass="bg-[#f4f1fb] text-[#42308f]"
              title="Entradas vs. Salidas"
              subtitle={
                selectedDate
                  ? `Movimientos del ${formatReadableDate(selectedDate)}`
                  : 'Volumen físico de prendas'
              }
            />

            <div className="mt-4">
              {hasFlowActivity ? (
                isDepleting ? (
                  <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Desabastecimiento
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Abastecido
                  </span>
                )
              ) : (
                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-gray-100 text-[#5e5d69] text-xs font-semibold">
                  Sin movimientos
                </span>
              )}
            </div>

            {hasFlowActivity ? (
              <div className="space-y-5 pt-5">
                <div>
                  <div className="flex justify-between items-center gap-3 text-[13px] mb-2">
                    <span className="font-semibold text-[#0b1c30] flex items-center gap-2">
                      <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                      Prendas ingresadas
                    </span>
                    <span className="font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                      +{totalIngresos.toLocaleString('es-AR')} un.
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        backgroundColor: COLOR_OK,
                        width: `${Math.min(100, Math.round((totalIngresos / maxFlow) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center gap-3 text-[13px] mb-2">
                    <span className="font-semibold text-[#0b1c30] flex items-center gap-2">
                      <ArrowUpToLine className="w-4 h-4 text-rose-600" />
                      Prendas vendidas o retiradas
                    </span>
                    <span className="font-bold text-rose-700 tabular-nums whitespace-nowrap">
                      -{totalEgresos.toLocaleString('es-AR')} un.
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        backgroundColor: COLOR_OUT,
                        width: `${Math.min(100, Math.round((totalEgresos / maxFlow) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#f8f9ff] p-4 text-center mt-5">
                <p className="text-[13px] font-semibold text-[#0b1c30]">
                  No se registraron movimientos en este período
                </p>
                <p className="text-xs text-[#5e5d69] mt-1">
                  No hubo ingresos ni egresos de prendas {selectedDate ? `el ${formatReadableDate(selectedDate)}` : 'para el filtro aplicado'}.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#c9c4d3]/30 min-h-[40px] flex items-center justify-between gap-3 text-xs">
            <div className="text-[#5e5d69]">
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
            <div className="font-bold text-[#42308f] whitespace-nowrap">
              {dateAndSeasonFilteredMovements.length} registro{dateAndSeasonFilteredMovements.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* ---------------- SEMÁFORO DE REPOSICIÓN ---------------- */}
        <div className={`${CARD} p-6 flex flex-col justify-between md:col-span-2 xl:col-span-1`}>
          <div>
            <CardHeader
              icon={<toneStyles.Icon className="w-5 h-5" />}
              iconClass={toneStyles.iconBox}
              title={toneStyles.title}
              subtitle="Semáforo de reposición"
              right={
                <span
                  className={`inline-flex items-center h-6 px-2.5 rounded-full border text-xs font-semibold ${toneStyles.badge}`}
                >
                  {toneStyles.badgeText}
                </span>
              }
            />

            {alertTone === 'ok' ? (
              <div className="mt-6 rounded-2xl bg-emerald-50/60 p-4 text-[13px] text-emerald-800 font-medium">
                Todas las prendas tienen stock disponible por encima de su umbral mínimo de seguridad.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <div>
                    <p className="text-xs font-semibold text-[#5e5d69]">Agotados</p>
                    <p className="font-heading text-2xl font-extrabold text-rose-600 tabular-nums leading-tight mt-0.5">
                      {totalOutOfStock}{' '}
                      <span className="text-xs font-semibold text-[#5e5d69]">
                        {plural(totalOutOfStock, 'modelo', 'modelos')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#5e5d69]">Stock bajo</p>
                    <p className="font-heading text-2xl font-extrabold text-amber-600 tabular-nums leading-tight mt-0.5">
                      {totalLowStock}{' '}
                      <span className="text-xs font-semibold text-[#5e5d69]">
                        {plural(totalLowStock, 'modelo', 'modelos')}
                      </span>
                    </p>
                  </div>
                </div>

                <ul className="mt-5 divide-y divide-[#c9c4d3]/30">
                  {alertListShown.map(({ product: p, kind }) => (
                    <li key={`${kind}-${p.sku}`} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            kind === 'agotado' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-semibold text-[#0b1c30] truncate" title={p.name}>
                          {p.name}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 font-semibold tabular-nums ${
                          kind === 'agotado' ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        {kind === 'agotado'
                          ? `Agotado · Talle ${p.size}`
                          : `${p.stock} un. · Mín. ${p.minStockThreshold}`}
                      </span>
                    </li>
                  ))}
                </ul>
                {alertListRemaining > 0 && (
                  <p className="text-xs text-[#5e5d69] text-right mt-1">
                    + {alertListRemaining} modelo{alertListRemaining > 1 ? 's' : ''} más
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#c9c4d3]/30">
            {alertTone === 'critical' ? (
              <button
                onClick={onNavigateToOutOfStock || onNavigateToLowStock}
                className={`w-full inline-flex items-center justify-center gap-2 h-10 px-4 text-white text-sm font-bold rounded-full transition-all active:scale-95 cursor-pointer ${toneStyles.button} ${FOCUS}`}
              >
                <span>Reponer {totalOutOfStock} modelo{totalOutOfStock !== 1 ? 's' : ''} agotado{totalOutOfStock !== 1 ? 's' : ''}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : alertTone === 'warning' ? (
              <button
                onClick={onNavigateToLowStock}
                className={`w-full inline-flex items-center justify-center gap-2 h-10 px-4 text-white text-sm font-bold rounded-full transition-all active:scale-95 cursor-pointer ${toneStyles.button} ${FOCUS}`}
              >
                <span>Revisar {totalLowStock} modelo{totalLowStock !== 1 ? 's' : ''} con stock bajo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full min-h-[40px] flex items-center justify-center text-sm font-bold text-emerald-700">
                ✓ Catálogo abastecido para atender clientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- ACTIVIDAD DEL DÍA ---------------- */}
      {selectedDate && (
        <div className={`${CARD} p-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f4f1fb] text-[#42308f] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#42308f]">
                  Actividad del día
                </span>
                <span className="inline-flex items-center h-5 px-2 rounded-full bg-[#f4f1fb] text-[#42308f] text-xs font-semibold">
                  {dateAndSeasonFilteredMovements.length} movimientos
                </span>
              </div>
              <h3 className="font-heading font-bold text-base text-[#0b1c30]">
                {formatReadableDate(selectedDate)}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
            <div>
              <span className="text-xs font-semibold text-[#5e5d69] block">
                Prendas ingresadas
              </span>
              <span className="font-heading text-lg font-extrabold text-emerald-700 tabular-nums">
                +{totalIngresos} unidades
              </span>
            </div>
            <div className="h-8 w-px bg-[#c9c4d3]/40 hidden sm:block" />
            <div>
              <span className="text-xs font-semibold text-[#5e5d69] block">
                Prendas egresadas / vendidas
              </span>
              <span className="font-heading text-lg font-extrabold text-rose-700 tabular-nums">
                -{totalEgresos} unidades
              </span>
            </div>
            <div className="h-8 w-px bg-[#c9c4d3]/40 hidden sm:block" />
            <div>
              <span className="text-xs font-semibold text-[#5e5d69] block">
                Balance neto
              </span>
              <span
                className={`font-heading text-lg font-extrabold tabular-nums ${
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
        <div className={`${CARD} p-6`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h4 className="font-heading text-base font-bold text-[#0b1c30]">
              Prendas y movimientos del {formatReadableDate(selectedDate)}
            </h4>
            <span className="text-xs text-[#5e5d69] font-semibold whitespace-nowrap">
              {dateAndSeasonFilteredMovements.length} registro{dateAndSeasonFilteredMovements.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] min-w-[640px]">
              <thead>
                <tr className="text-xs font-semibold text-[#5e5d69] uppercase tracking-wider border-b border-[#c9c4d3]/30">
                  <th className="pb-3 pr-3">Hora</th>
                  <th className="pb-3 pr-3">Tipo</th>
                  <th className="pb-3 pr-3">Prenda</th>
                  <th className="pb-3 pr-3 text-right">Cant.</th>
                  <th className="pb-3 pr-3">Destino / Proveedor</th>
                  <th className="pb-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9c4d3]/20">
                {dateAndSeasonFilteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-[#f8f9ff]">
                    <td className="py-3 pr-3 text-[#5e5d69] font-medium whitespace-nowrap">
                      {m.date}
                    </td>
                    <td className="py-3 pr-3">
                      {m.type === 'ingreso' && (
                        <span className="inline-flex items-center h-6 px-2.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 text-xs">
                          + Ingreso
                        </span>
                      )}
                      {m.type === 'egreso' && (
                        <span className="inline-flex items-center h-6 px-2.5 rounded-full font-semibold bg-rose-50 text-rose-700 text-xs">
                          - Egreso
                        </span>
                      )}
                      {m.type === 'ajuste' && (
                        <span className="inline-flex items-center h-6 px-2.5 rounded-full font-semibold bg-[#f4f1fb] text-[#42308f] text-xs">
                          Ajuste
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 font-semibold text-[#0b1c30]">
                      {m.productName}
                      <span className="block font-mono text-xs text-[#42308f] font-normal">
                        {m.sku}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right font-extrabold tabular-nums">
                      <span
                        className={
                          m.quantity > 0
                            ? 'text-emerald-700'
                            : m.quantity < 0
                            ? 'text-rose-700'
                            : 'text-gray-700'
                        }
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[#0b1c30] font-medium">
                      {m.sourceOrDestination || '-'}
                    </td>
                    <td className="py-3 text-[#5e5d69] text-xs">
                      {m.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- INVENTARIO POR CATEGORÍA ---------------- */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#0b1c30]">
              Inventario por Categoría
            </h2>
            <p className="text-xs text-[#5e5d69] mt-0.5">
              Prendas físicas en perchero y modelos que requieren reposición
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-[#797583] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Buscar categoría..."
                aria-label="Buscar categoría"
                className={`h-9 pl-10 pr-9 text-[13px] bg-[#f8f9ff] border border-[#c9c4d3]/50 rounded-full focus:border-[#42308f] text-[#0b1c30] w-full sm:w-56 transition-all ${FOCUS}`}
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  aria-label="Borrar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {onOpenCrearStock && (
              <Can role={ROLES_GESTION}>
                <button
                  onClick={onOpenCrearStock}
                  className={`inline-flex items-center gap-1.5 h-9 px-4 bg-[#f4f1fb] text-[#42308f] hover:bg-[#ebe6f7] rounded-full text-[13px] font-bold transition-colors cursor-pointer ${FOCUS}`}
                >
                  <Plus className="w-4 h-4" />
                  Nueva Categoría
                </button>
              </Can>
            )}
            <button
              className={`inline-flex items-center justify-center w-9 h-9 text-[#797583] hover:text-[#42308f] hover:bg-[#f4f1fb] rounded-full transition-colors cursor-pointer ${FOCUS}`}
              title="Filtros"
              aria-label="Filtros"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#5e5d69]">
            <p className="font-semibold text-[#0b1c30]">
              No se encontraron categorías con el término &quot;{categorySearch}&quot;
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
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-t border-b border-[#c9c4d3]/30 bg-[#fafbff] text-xs font-semibold text-[#5e5d69] tracking-wider uppercase">
                  <th className="px-6 py-3">Categoría</th>
                  <th className="px-6 py-3">Total prendas</th>
                  <th className="px-6 py-3">Modelos / artículos</th>
                  <th className="px-6 py-3">Estado de reposición</th>
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9c4d3]/20 text-sm">
                {filteredCategories.map((cat) => {
                  const catProducts = activeProducts.filter(
                    (p) => p.category.toLowerCase() === cat.name.toLowerCase()
                  );
                  const hasCritical = cat.outOfStock > 0 || cat.lowStock > 0;

                  return (
                    <tr
                      key={cat.name}
                      tabIndex={0}
                      className={`hover:bg-[#f8f9ff] transition-colors group cursor-pointer ${FOCUS}`}
                      onClick={() => onSelectCategory(cat.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target === e.currentTarget) onSelectCategory(cat.name);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f4f1fb] flex items-center justify-center shrink-0">
                            {getCategoryIcon(cat.name)}
                          </div>
                          <div>
                            <span className="font-semibold text-[#0b1c30] group-hover:text-[#42308f] transition-colors block">
                              {cat.name}
                            </span>
                            {cat.description && (
                              <span className="text-xs text-[#797583] block">
                                {cat.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-extrabold text-[#0b1c30] tabular-nums">
                          {cat.totalItems.toLocaleString('es-AR')}
                        </span>{' '}
                        <span className="text-[13px] text-[#5e5d69]">prendas</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-[13px] font-medium text-[#5e5d69]">
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
                              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer transition-colors"
                              title="Ver modelos agotados"
                            >
                              <Ban className="w-3.5 h-3.5" /> {cat.outOfStock} agotado{cat.outOfStock > 1 ? 's' : ''}
                            </span>
                          )}
                          {cat.lowStock > 0 && (
                            <span
                              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer transition-colors"
                              title="Ver modelos con stock bajo"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> {cat.lowStock} stock bajo
                            </span>
                          )}
                          {!hasCritical && (
                            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
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
                            className={`h-9 px-4 border border-rose-200 text-rose-700 text-[13px] font-bold rounded-full hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer ${FOCUS}`}
                          >
                            Revisar
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCategory(cat.name);
                            }}
                            className={`h-9 px-4 border border-[#42308f]/40 text-[#42308f] text-[13px] font-bold rounded-full hover:bg-[#42308f] hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer ${FOCUS}`}
                          >
                            Ver prendas
                            <ArrowRight className="w-3.5 h-3.5" />
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