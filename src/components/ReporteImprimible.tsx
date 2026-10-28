import React, { useMemo } from 'react';
import { Printer, X } from 'lucide-react';
import { ProductItem, ReservaItem, CategorySummary } from '../types';
import { useAuth } from '../context/AuthContext';

interface ReporteImprimibleProps {
  products: ProductItem[];
  reservas: ReservaItem[];
  categories: CategorySummary[];
  onClose: () => void;
}

export const ReporteImprimible: React.FC<ReporteImprimibleProps> = ({
  products,
  reservas,
  categories,
  onClose,
}) => {
  const { user } = useAuth();
  const hoy = new Date().toLocaleDateString('es-AR');
  const businessName = user?.businessName?.trim() || 'Stocky';

  // Cálculos para los resúmenes
  const stockBajo = products.filter(p => p.status === 'bajo' || (p.stock > 0 && p.stock <= p.minStockThreshold)).length;
  const sinStock = products.filter(p => p.status === 'agotado' || p.stock === 0).length;
  const reservasActivas = reservas.filter(r => r.status === 'activa');
  const reservasVencidas = reservas.filter(r => r.status === 'caducada');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-500/80 backdrop-blur-sm overflow-y-auto print:bg-white print:overflow-visible">
      {/* Barra superior de controles (No se imprime) */}
      <div className="sticky top-0 bg-[#0b1c30] text-white p-4 flex items-center justify-between shadow-md print:hidden z-50">
        <h2 className="font-heading font-bold text-lg">Vista Previa de Impresión</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-full font-bold text-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar PDF
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenedor Hoja A4 */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white my-8 p-[20mm] shadow-2xl print:m-0 print:p-0 print:shadow-none font-sans text-gray-900">
        
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Resumen y detalle de Stock</h1>
            <div className="mt-4 space-y-1 text-sm">
              <p><strong>Destinatario:</strong> {user?.name || 'Usuario'}</p>
              <p><strong>Fecha de emisión:</strong> {hoy}</p>
              <p><strong>Soporte:</strong> Papel A4</p>
            </div>
          </div>
          {/* Identificación de la boutique */}
          <div className="w-24 h-24 rounded-full border-4 border-amber-500 bg-[#0b1c30] flex items-center justify-center text-amber-500 font-heading font-bold text-2xl shadow-lg">
            {businessName}
          </div>
        </div>

        {/* 1. RESÚMENES */}
        <section className="mb-8">
          <h2 className="text-lg font-black bg-gray-100 p-2 mb-4 uppercase">1. Resúmenes</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* 1.1 Stock General */}
            <div>
              <h3 className="font-bold mb-2">1.1 Resumen de Stock General</h3>
              <table className="w-full text-sm border-collapse border border-gray-300">
                <tbody>
                  <tr className="border-b border-gray-300"><td className="p-2 font-semibold bg-gray-50 w-1/2">Fecha de emisión</td><td className="p-2">{hoy}</td></tr>
                  <tr className="border-b border-gray-300"><td className="p-2 font-semibold bg-gray-50">Total productos</td><td className="p-2">{products.length}</td></tr>
                  <tr className="border-b border-gray-300"><td className="p-2 font-semibold bg-gray-50">Stock bajo ⚠</td><td className="p-2 text-amber-600 font-bold">{stockBajo}</td></tr>
                  <tr className="border-b border-gray-300"><td className="p-2 font-semibold bg-gray-50">Sin stock ✗</td><td className="p-2 text-rose-600 font-bold">{sinStock}</td></tr>
                  <tr><td className="p-2 font-semibold bg-gray-50">Reservas activas</td><td className="p-2">{reservasActivas.length}</td></tr>
                </tbody>
              </table>
            </div>

            {/* 1.2 Por Categoría */}
            <div>
              <h3 className="font-bold mb-2">1.2 Resumen por Categoría</h3>
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-800 text-white">
                  <tr><th className="p-2 text-left">Categoría</th><th className="p-2 text-right">Disponibles</th></tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => {
                    const stockCat = products.filter(p => p.category === cat.name).reduce((acc, p) => acc + p.stock, 0);
                    const tieneBajo = products.some(p => p.category === cat.name && p.status !== 'ok');
                    return (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="p-2">{cat.name}</td>
                        <td className="p-2 text-right">{stockCat} {tieneBajo && <span className="text-amber-600 font-bold">⚠</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 2. DETALLES */}
        <section className="mb-8">
          <h2 className="text-lg font-black bg-gray-100 p-2 mb-4 uppercase">2. Detalles</h2>

          {/* 2.3 Alertas de Stock */}
          <h3 className="font-bold mb-2 mt-6">2.3 Alertas de Stock (Bajo o Agotado)</h3>
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-center">Talle</th>
                <th className="p-2 text-left">Color</th>
                <th className="p-2 text-center">Stock Actual</th>
                <th className="p-2 text-center">Mínimo</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.filter(p => p.status !== 'ok').map((p, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2 text-center">{p.size}</td>
                  <td className="p-2">{p.colorName}</td>
                  <td className="p-2 text-center font-bold">{p.stock}</td>
                  <td className="p-2 text-center">{p.minStockThreshold}</td>
                  <td className="p-2 text-center font-bold">
                    {p.status === 'agotado' ? <span className="text-rose-600">✗</span> : <span className="text-amber-600">⚠</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 2.4 Reservas Activas */}
          <h3 className="font-bold mb-2 mt-6">2.4 Reservas Activas</h3>
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-center">Fecha Reserva</th>
                <th className="p-2 text-right">Seña</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {reservasActivas.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No hay reservas activas en este momento.</td></tr>
              ) : (
                reservasActivas.map((r, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="p-2 font-medium">{r.garmentName}</td>
                    <td className="p-2 text-center">{r.createdAt}</td>
                    <td className="p-2 text-right">${r.depositAmount.toLocaleString('es-AR')}</td>
                    <td className="p-2 text-center">Pendiente</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* PIE DE PÁGINA */}
        <div className="mt-16 pt-6 border-t-2 border-gray-800 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-600">Información aportada por L&L Development</p>
          <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs text-center leading-tight shadow-md border-2 border-gray-300">
            L&L<br/>Dev.
          </div>
        </div>

      </div>
    </div>
  );
};