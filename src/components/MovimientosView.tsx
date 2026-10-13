import React, { useState } from 'react';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, SlidersHorizontal, Search } from 'lucide-react';
import { StockMovement } from '../types';

interface MovimientosViewProps {
  movements: StockMovement[];
}

export const MovimientosView: React.FC<MovimientosViewProps> = ({ movements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ingreso' | 'egreso' | 'ajuste'>('all');

  const filtered = movements.filter((m) => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        m.productName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.user.toLowerCase().includes(q) ||
        m.sourceOrDestination.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Movimientos de Stock
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-[#c9c4d3]/40 shadow-xs">
          {(['all', 'ingreso', 'egreso', 'ajuste'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs font-bold rounded-full capitalize transition-colors ${
                typeFilter === t
                  ? 'bg-[#42308f] text-white'
                  : 'text-[#5e5d69] hover:text-[#42308f]'
              }`}
            >
              {t === 'all' ? 'Todos' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#c9c4d3]/40 card-shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-[#797583] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por prenda, usuario o código..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#f8f9ff] border border-[#c9c4d3]/40 rounded-full focus:outline-none focus:border-[#42308f]"
            />
          </div>
          <span className="text-xs text-[#797583] font-medium">
            {filtered.length} movimientos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#f8f9ff] text-[#5e5d69] text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3.5">FECHA</th>
                <th className="px-6 py-3.5">TIPO</th>
                <th className="px-6 py-3.5">PRENDA</th>
                <th className="px-6 py-3.5 text-right">CANTIDAD</th>
                <th className="px-6 py-3.5">RESPONSABLE</th>
                <th className="px-6 py-3.5">DETALLE / COBRO & CLIENTE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">
                    {m.date}
                  </td>
                  <td className="px-6 py-3.5">
                    {m.type === 'ingreso' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                        <ArrowDownLeft className="w-3 h-3" /> Ingreso
                      </span>
                    )}
                    {m.type === 'egreso' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700">
                        <ArrowUpRight className="w-3 h-3" /> Egreso
                      </span>
                    )}
                    {m.type === 'ajuste' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-[#42308f]">
                        <ArrowLeftRight className="w-3 h-3" /> Ajuste
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="font-bold text-gray-900">{m.productName}</p>
                    <p className="font-mono text-[10px] text-[#42308f] font-bold">Cód: {m.sku}</p>
                  </td>
                  <td className="px-6 py-3.5 text-right font-extrabold text-sm">
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
                  <td className="px-6 py-3.5 text-gray-700 font-medium">
                    {m.user}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500">
                    <p className="font-bold text-gray-900">{m.sourceOrDestination}</p>
                    <p className="text-[11px] text-[#5e5d69] mt-0.5">{m.notes}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
