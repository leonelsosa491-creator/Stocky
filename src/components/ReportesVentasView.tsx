import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Download,
  ShieldCheck,
  Award,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Layers,
  Percent
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Can } from './auth/Can';

export const ReportesVentasView: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'mes' | 'semana' | 'anio'>('mes');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-[#eff4ff] text-[#42308f] rounded-full text-xs font-bold border border-[#c9c4d3]/60 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#42308f]" />
              Acceso Exclusivo: Dueña & Desarrollador (['developer', 'admin'])
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0b1c30]">
            Reportes Comerciales y Ventas
          </h1>
          <p className="text-xs sm:text-sm text-[#5e5d69] mt-1">
            Métricas financieras, ticket promedio y rentabilidad neta de la boutique Aries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#f8f9ff] p-1 rounded-2xl border border-[#c9c4d3]/50 text-xs font-bold text-[#484552]">
            <button
              onClick={() => setPeriod('semana')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                period === 'semana' ? 'bg-[#42308f] text-white shadow-xs' : 'hover:text-[#42308f]'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setPeriod('mes')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                period === 'mes' ? 'bg-[#42308f] text-white shadow-xs' : 'hover:text-[#42308f]'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setPeriod('anio')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                period === 'anio' ? 'bg-[#42308f] text-white shadow-xs' : 'hover:text-[#42308f]'
              }`}
            >
              2026
            </button>
          </div>

          <button
            onClick={() => alert('Exportando balance comercial en formato Excel/CSV')}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 shadow-2xs hover:text-[#42308f] transition-all"
            title="Descargar Reporte"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#c9c4d3]/40 card-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#797583] uppercase tracking-wider">Facturación Total</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-[#0b1c30]">$4.890.000</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-[#797583]">Comparado con el período anterior</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#c9c4d3]/40 card-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#797583] uppercase tracking-wider">Prendas Vendidas</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-[#0b1c30]">184 unidades</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +8.5%
            </span>
          </div>
          <p className="text-[11px] text-[#797583]">Mayor rotación en colección Buzos</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#c9c4d3]/40 card-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#797583] uppercase tracking-wider">Ticket Promedio</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-[#42308f] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-[#0b1c30]">$26.570</span>
            <span className="text-[11px] font-bold text-purple-600">Estable</span>
          </div>
          <p className="text-[11px] text-[#797583]">2.1 prendas por cada ticket cliente</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#c9c4d3]/40 card-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#797583] uppercase tracking-wider">Margen Bruto</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-[#0b1c30]">62.4%</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +3.1%
            </span>
          </div>
          <p className="text-[11px] text-[#797583]">Markup boutique sobre costo fabril</p>
        </div>
      </div>

      {/* Top Sellers Table */}
      <div className="bg-white rounded-3xl border border-[#c9c4d3]/40 card-shadow p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#0b1c30]">
              Modelos Estrella Más Vendidos
            </h3>
            <p className="text-xs text-[#797583]">Rotación en salón de venta y retiros de reservas</p>
          </div>
          <span className="text-xs font-bold text-[#42308f] bg-[#eff4ff] px-3 py-1 rounded-full">
            Top 5 del Período
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[#797583] font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Prenda / Modelo</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Unidades Vendidas</th>
                <th className="py-3 px-4">Ingresos Generados</th>
                <th className="py-3 px-4">Estado Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[#0b1c30]">
              <tr className="hover:bg-[#f8f9ff]/60 transition-colors">
                <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Buzo Oversize Rustico (#101)
                </td>
                <td className="py-3.5 px-4 text-gray-500">Buzos</td>
                <td className="py-3.5 px-4 font-bold text-[#42308f]">48 unidades</td>
                <td className="py-3.5 px-4 font-bold">$1.824.000</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Stock Saludable (24 u.)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#f8f9ff]/60 transition-colors">
                <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Remera Básica Algodón Peinado (#102)
                </td>
                <td className="py-3.5 px-4 text-gray-500">Remeras</td>
                <td className="py-3.5 px-4 font-bold text-[#42308f]">42 unidades</td>
                <td className="py-3.5 px-4 font-bold">$756.000</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Pocas unidades (8 u.)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#f8f9ff]/60 transition-colors">
                <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Pantalón Sastrero Wide Leg (#103)
                </td>
                <td className="py-3.5 px-4 text-gray-500">Pantalones</td>
                <td className="py-3.5 px-4 font-bold text-[#42308f]">35 unidades</td>
                <td className="py-3.5 px-4 font-bold">$1.470.000</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    Agotado (0 u.)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
