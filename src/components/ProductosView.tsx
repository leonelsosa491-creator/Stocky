import React, { useState } from 'react';
import { Boxes, Plus, Search, Tag, ArrowRight, ShoppingBag, Package } from 'lucide-react';
import { ProductItem } from '../types';

interface ProductosViewProps {
  products: ProductItem[];
  onSelectProduct: (p: ProductItem) => void;
  onOpenNuevoIngreso: () => void;
  onOpenRegistrarVenta?: (product?: ProductItem) => void;
}

export const ProductosView: React.FC<ProductosViewProps> = ({
  products,
  onSelectProduct,
  onOpenNuevoIngreso,
  onOpenRegistrarVenta,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = products.filter((p) => {
    if (selectedCat !== 'all' && p.category !== selectedCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.colorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e5d69]">
            CATÁLOGO BOUTIQUE
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Colección & Productos
          </h1>
          <p className="text-sm text-[#5e5d69] mt-1">
            Gestión de artículos, precios, temporadas y variantes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {onOpenRegistrarVenta && (
            <button
              id="btn-productos-registrar-venta"
              onClick={() => onOpenRegistrarVenta()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-full text-xs font-bold text-white transition-all shadow-sm active:scale-95"
              title="Registrar venta y descontar stock"
            >
              <ShoppingBag className="w-4 h-4" />
              Registrar Venta
            </button>
          )}
          <button
            onClick={onOpenNuevoIngreso}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#42308f] rounded-full text-xs font-bold text-white hover:bg-[#5a49a8] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Añadir Producto
          </button>
        </div>
      </div>

      {/* Filter Chips & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'Remeras', 'Buzos', 'Pantalones', 'Abrigos', 'Accesorios'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCat === cat
                  ? 'bg-[#42308f] text-white shadow-xs'
                  : 'bg-white border border-[#c9c4d3]/40 text-[#5e5d69] hover:text-[#42308f]'
              }`}
            >
              {cat === 'all' ? 'Todas las Categorías' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#797583] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar prenda..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-[#c9c4d3]/50 rounded-full focus:outline-none focus:border-[#42308f]"
          />
        </div>
      </div>

      {/* Product Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#c9c4d3]/40 card-shadow flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-[#42308f] flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-extrabold text-lg text-[#0b1c30]">
            No hay prendas en el catálogo
          </h3>
          <p className="text-xs text-[#5e5d69] max-w-sm mt-1.5 mb-5">
            {search || selectedCat !== 'all'
              ? 'No se encontraron prendas con los filtros aplicados.'
              : 'El inventario está vacío. Podés registrar nuevos artículos con el botón "Nuevo Ingreso".'}
          </p>
          <button
            id="btn-catalogo-cargar-primera"
            onClick={onOpenNuevoIngreso}
            className="px-6 py-2.5 bg-[#42308f] hover:bg-[#5a49a8] text-white text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Cargar Primera Prenda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((item) => (
            <div
              key={item.sku}
              onClick={() => onSelectProduct(item)}
              className="bg-white rounded-3xl p-5 border border-[#c9c4d3]/40 card-shadow hover:border-[#42308f]/40 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#797583] mb-3">
                  <span className="font-mono text-[11px] font-semibold">{item.sku}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#42308f] font-bold text-[10px]">
                    {item.category}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-base text-[#0b1c30] group-hover:text-[#42308f] transition-colors leading-snug">
                  {item.name}
                </h3>
                <p className="text-xs text-[#5e5d69] mt-1">{item.description}</p>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-2xs inline-block"
                    style={{ backgroundColor: item.colorHex }}
                  />
                  <span className="text-gray-700 font-medium">{item.colorName}</span>
                  <span className="text-gray-300">•</span>
                  <span className="font-bold text-[#42308f]">{item.size}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">{item.season}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#797583]">Precio Venta</span>
                  <p className="font-heading text-base font-extrabold text-[#0b1c30]">
                    ${item.price.toLocaleString('es-AR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenRegistrarVenta && (
                    <button
                      id={`btn-vender-catalogo-${item.sku}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRegistrarVenta(item);
                      }}
                      disabled={item.stock === 0}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        item.stock === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white shadow-2xs'
                      }`}
                      title="Vender prenda y descontar de stock"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Vender</span>
                    </button>
                  )}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#797583]">En Stock</span>
                    <p
                      className={`font-heading text-base font-extrabold ${
                        item.stock === 0 ? 'text-[#ba1a1a]' : 'text-[#42308f]'
                      }`}
                    >
                      {item.stock} u.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
