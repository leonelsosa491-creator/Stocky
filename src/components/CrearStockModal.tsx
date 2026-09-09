import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  Shirt,
  Sparkles,
  Layers,
  ShoppingBag,
  Scissors,
  Tag,
  Check,
  Plus,
} from 'lucide-react';
import { CategorySummary, ProductItem } from '../types';

interface CrearStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCategoryNames: string[];
  onCreateStock: (category: CategorySummary, initialProduct?: ProductItem) => void;
}

const AVAILABLE_ICONS = [
  { id: 'hoodie', label: 'Buzo / Prenda con capucha' },
  { id: 'tshirt', label: 'Remera / Top' },
  { id: 'pants', label: 'Pantalón / Inferior' },
  { id: 'coat', label: 'Abrigo / Campera' },
  { id: 'dress', label: 'Vestido / Gala' },
  { id: 'shoes', label: 'Calzado / Zapatos' },
  { id: 'sparkles', label: 'Accesorios / Especial' },
];

const PRESET_COLORS = [
  { name: 'Negro', hex: '#18181b' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Azul Marino', hex: '#1e3a8a' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Beige', hex: '#d4b996' },
  { name: 'Gris', hex: '#6b7280' },
  { name: 'Verde Oliva', hex: '#4d7c0f' },
  { name: 'Rosa Pastel', hex: '#f472b6' },
];

export const CrearStockModal: React.FC<CrearStockModalProps> = ({
  isOpen,
  onClose,
  existingCategoryNames,
  onCreateStock,
}) => {
  const [stockName, setStockName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tshirt');
  const [facilityDefault, setFacilityDefault] = useState('Perchero / Salón');
  const [nameError, setNameError] = useState('');

  // Initial product toggle & form
  const [addInitialProduct, setAddInitialProduct] = useState(true);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('#501');
  const [prodSize, setProdSize] = useState('M');
  const [prodSeason, setProdSeason] = useState('Invierno');
  const [prodColorName, setProdColorName] = useState('Negro');
  const [prodColorHex, setProdColorHex] = useState('#18181b');
  const [prodStock, setProdStock] = useState<number>(30);
  const [prodPrice, setProdPrice] = useState<number>(32000);
  const [prodCost, setProdCost] = useState<number>(14500);

  if (!isOpen) return null;

  // Auto-generate code suggestion when stock name or product name changes
  const handleStockNameChange = (val: string) => {
    setStockName(val);
    setNameError('');
    if (!prodSku || prodSku.startsWith('#')) {
      const rand = Math.floor(200 + Math.random() * 700);
      setProdSku(`#${rand}`);
    }
  };

  const handleSelectColor = (color: { name: string; hex: string }) => {
    setProdColorName(color.name);
    setProdColorHex(color.hex);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = stockName.trim();
    if (!trimmedName) {
      setNameError('Por favor ingresa un nombre para el nuevo stock');
      return;
    }

    if (
      existingCategoryNames.some(
        (c) => c.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      setNameError('Ya existe un stock o categoría con este nombre');
      return;
    }

    let initialProduct: ProductItem | undefined = undefined;

    if (addInitialProduct && prodName.trim()) {
      const finalSku =
        prodSku.trim() ||
        `${trimmedName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      initialProduct = {
        sku: finalSku,
        name: prodName.trim(),
        description: `Ingreso inicial en stock ${trimmedName}`,
        category: trimmedName,
        colorName: prodColorName,
        colorHex: prodColorHex,
        size: prodSize,
        season: prodSeason,
        stock: Number(prodStock) || 0,
        minStockThreshold: 10,
        locationFacility: facilityDefault,
        locationDetails: 'Sector Nuevo Ingreso',
        price: Number(prodPrice) || 0,
        cost: Number(prodCost) || 0,
        status: Number(prodStock) > 10 ? 'ok' : Number(prodStock) > 0 ? 'bajo' : 'agotado',
      };
    }

    const newCategory: CategorySummary = {
      name: trimmedName,
      totalItems: initialProduct ? initialProduct.stock : 0,
      inStock: initialProduct ? initialProduct.stock : 0,
      lowStock: 0,
      outOfStock: 0,
      actionType: 'detalles',
      icon: selectedIcon,
      description: description.trim() || `Línea de ${trimmedName}`,
      facilityDefault,
    };

    onCreateStock(newCategory, initialProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full card-shadow border border-[#c9c4d3]/40 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
                Crear Nuevo Stock / Tipo de Prenda
              </h2>
              <p className="text-xs text-[#5e5d69]">
                Registra un nuevo departamento de indumentaria y carga sus prendas
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

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Nombre y Descripción del Stock */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nombre del Stock / Tipo de Prenda *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Vestidos, Camperas, Calzado, Sweaters, Polleras..."
                value={stockName}
                onChange={(e) => handleStockNameChange(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 bg-[#f8f9ff] border rounded-xl focus:outline-none transition-colors ${
                  nameError
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-[#c9c4d3]/60 focus:border-[#42308f] focus:bg-white'
                }`}
              />
              {nameError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  {nameError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Descripción / Notas de Colección
              </label>
              <input
                type="text"
                placeholder="Ej. Colección de temporada, prendas de alta gama o sastrería"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2 bg-[#f8f9ff] border border-[#c9c4d3]/60 rounded-xl focus:border-[#42308f] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ubicación Predeterminada
                </label>
                <select
                  value={facilityDefault}
                  onChange={(e) => setFacilityDefault(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#f8f9ff] border border-[#c9c4d3]/60 rounded-xl focus:border-[#42308f] focus:outline-none font-medium"
                >
                  <option value="Perchero / Salón">Perchero / Salón</option>
                  <option value="Depósito / Trastienda">Depósito / Trastienda</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tipo de Prenda / Ícono
                </label>
                <select
                  value={selectedIcon}
                  onChange={(e) => setSelectedIcon(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#f8f9ff] border border-[#c9c4d3]/60 rounded-xl focus:border-[#42308f] focus:outline-none"
                >
                  {AVAILABLE_ICONS.map((ico) => (
                    <option key={ico.id} value={ico.id}>
                      {ico.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cargar Primer Producto Toggle */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addInitialProduct}
                  onChange={(e) => setAddInitialProduct(e.target.checked)}
                  className="w-4 h-4 rounded text-[#42308f] focus:ring-[#42308f]"
                />
                <span className="text-xs font-bold text-[#0b1c30]">
                  Cargar primera prenda / producto a este stock ahora
                </span>
              </label>
            </div>

            {addInitialProduct && (
              <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-[#c9c4d3]/50 space-y-3.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-[#42308f]">
                  <Shirt className="w-4 h-4" />
                  <span>Datos de la Prenda Inicial</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Nombre de la Prenda *
                    </label>
                    <input
                      type="text"
                      required={addInitialProduct}
                      placeholder="Ej. Vestido Largo Satén, Campera Parka..."
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Código de Prenda / Etiqueta
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. #501"
                      value={prodSku}
                      onChange={(e) => setProdSku(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Talle y Temporada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Talle Seleccionable
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setProdSize(sz)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                            prodSize === sz
                              ? 'bg-[#42308f] text-white shadow-xs'
                              : 'bg-white border border-gray-200 text-gray-700 hover:border-[#42308f]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Temporada
                    </label>
                    <select
                      value={prodSeason}
                      onChange={(e) => setProdSeason(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                    >
                      <option value="Verano">Verano</option>
                      <option value="Invierno">Invierno</option>
                      <option value="Otoño">Otoño</option>
                      <option value="Primavera">Primavera</option>
                    </select>
                  </div>
                </div>

                {/* Color Seleccionable */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Color: <span className="font-extrabold text-[#42308f]">{prodColorName}</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => handleSelectColor(col)}
                        title={col.name}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          prodColorName === col.name
                            ? 'ring-2 ring-offset-2 ring-[#42308f] scale-110'
                            : 'hover:scale-105 opacity-90'
                        }`}
                        style={{
                          backgroundColor: col.hex,
                          border: col.hex === '#ffffff' ? '1px solid #d1d5db' : 'none',
                        }}
                      >
                        {prodColorName === col.name && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              col.hex === '#ffffff' || col.hex === '#d4b996'
                                ? 'text-gray-900'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock y Precio */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prodStock}
                      onChange={(e) => setProdStock(Number(e.target.value))}
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none text-[#42308f]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Precio Venta ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Costo ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prodCost}
                      onChange={(e) => setProdCost(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex justify-end items-center gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] shadow-sm transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Crear Stock y Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
