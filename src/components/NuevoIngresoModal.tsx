import React, { useState } from 'react';
import { X, Plus, PackageCheck, Truck, MapPin } from 'lucide-react';
import { ProductItem } from '../types';

interface NuevoIngresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  categories?: string[];
  onAddStock: (data: {
    sku: string;
    productName: string;
    category: string;
    quantity: number;
    colorName: string;
    size: string;
    locationFacility: string;
    locationDetails: string;
    supplier: string;
    notes: string;
  }) => void;
}

export const NuevoIngresoModal: React.FC<NuevoIngresoModalProps> = ({
  isOpen,
  onClose,
  products,
  categories = ['Remeras', 'Buzos', 'Pantalones', 'Abrigos', 'Accesorios'],
  onAddStock,
}) => {
  const [selectedSku, setSelectedSku] = useState<string>(products[0]?.sku || '');
  const [category, setCategory] = useState<string>(categories[0] || 'Remeras');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(25);
  const [size, setSize] = useState<ProductItem['size']>('XL');
  const [colorName, setColorName] = useState('Rojo');
  const [locationFacility, setLocationFacility] = useState('Perchero / Salón');
  const [locationDetails, setLocationDetails] = useState('Perchero Principal');
  const [supplier, setSupplier] = useState('Textil Sur');
  const [notes, setNotes] = useState('Reposición boutique');

  if (!isOpen) return null;

  const handleSkuChange = (sku: string) => {
    setSelectedSku(sku);
    const found = products.find((p) => p.sku === sku);
    if (found) {
      setProductName(found.name);
      setCategory(found.category);
      setColorName(found.colorName);
      setSize(found.size);
      setLocationFacility(found.locationFacility !== '-' ? found.locationFacility : 'Perchero / Salón');
      setLocationDetails(found.locationDetails !== '-' ? found.locationDetails : 'Perchero Principal');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStock({
      sku: selectedSku || `REM-NUEVO-${Date.now().toString().slice(-4)}`,
      productName: productName || 'Prenda Ingresada',
      category,
      quantity: Number(quantity),
      colorName,
      size,
      locationFacility,
      locationDetails,
      supplier,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full card-shadow border border-[#c9c4d3]/40 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
                Nuevo Ingreso de Stock
              </h2>
              <p className="text-xs text-[#5e5d69]">
                Registrar entrada de mercadería al inventario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Seleccionar Producto Existente
            </label>
            <select
              value={selectedSku}
              onChange={(e) => handleSkuChange(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
            >
              <option value="">-- O crear nuevo --</option>
              {products.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} - {p.name} ({p.size}, {p.colorName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nombre de Prenda
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ej. Remera Básica Algodón"
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Talle
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              >
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity === 0 ? '' : quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none font-bold text-[#42308f]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ubicación / Depósito
              </label>
              <select
                value={locationFacility}
                onChange={(e) => setLocationFacility(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              >
                <option value="Depósito Central">Depósito Central</option>
                <option value="Tienda Principal">Tienda Principal</option>
                <option value="Depósito Norte">Depósito Norte</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Detalle Ubicación
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="Pasillo / Estantería / Caja"
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Proveedor
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nota / Remito
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] transition-all shadow-sm"
            >
              Confirmar Ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
