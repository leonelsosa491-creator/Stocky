import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  Shirt,
  Check,
  Plus
} from 'lucide-react';
import { CategorySummary, ProductItem } from '../types';
import { MAIN_COLOR_FAMILIES } from '../utils/colors';

interface CrearStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCategoryNames: string[];
  onCreateStock: (category: CategorySummary, initialProduct?: ProductItem) => void;
}

// ==========================================
// ÍCONOS DE ROPA DIBUJADOS A MEDIDA (SVG)
// ==========================================
const IconoPantalon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3h14l-1.5 18h-4L12 11l-1.5 10h-4L5 3z" />
  </svg>
);

const IconoShort = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h14l-1 11h-4.5L12 9l-1.5 6H6L5 4z" />
  </svg>
);

const IconoCampera = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9l-3 6h3v6h14v-6h3l-3-6c0-2-1-3-4-3H9c-3 0-4 1-4 3z" />
    <path d="M12 6v15" />
  </svg>
);

const IconoBuzo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 10l-3 6h3v5h14v-5h3l-3-6c0-2-1-3-4-3H9c-3 0-4 1-4 3z" />
    <path d="M8 7c0-3 1.5-5 4-5s4 2 4 5" />
    <path d="M8 15h8l1 4H7z" />
  </svg>
);

const IconoCollar = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3 C7 10 10 14 12 14.5 C14 14 17 10 17 3" />
    <circle cx="12" cy="17.5" r="2.5" />
  </svg>
);

const IconoLenceria = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9h18v1c0 4-3 6-5 8H8c-2-2-5-4-5-8V9z" />
    <path d="M10 7.5L12 9l2-1.5v3L12 9l-2 1.5z" />
  </svg>
);

const AVAILABLE_ICONS = [
  { id: 'remera', label: 'Remera', icon: <Shirt className="w-5 h-5" /> },
  { id: 'pantalon', label: 'Pantalón', icon: <IconoPantalon /> },
  { id: 'short', label: 'Short', icon: <IconoShort /> },
  { id: 'campera', label: 'Campera', icon: <IconoCampera /> },
  { id: 'buzo', label: 'Buzo', icon: <IconoBuzo /> },
  { id: 'collar', label: 'Accesorio (Collar)', icon: <IconoCollar /> },
  { id: 'lenceria', label: 'Lencería', icon: <IconoLenceria /> },
];

export const CrearStockModal: React.FC<CrearStockModalProps> = ({
  isOpen,
  onClose,
  existingCategoryNames,
  onCreateStock,
}) => {
  const [stockName, setStockName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('remera');
  const [nameError, setNameError] = useState('');

  // Initial product toggle & form
  const [addInitialProduct, setAddInitialProduct] = useState(true);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('#501');
  const [prodSize, setProdSize] = useState('M');
  const [prodSeason, setProdSeason] = useState('Invierno');
  const [prodColorFamily, setProdColorFamily] = useState('Negro');
  const [prodSpecificColor, setProdSpecificColor] = useState('');
  const [prodColorHex, setProdColorHex] = useState('#18181b');
  const [prodStock, setProdStock] = useState<number>(30);
  const [prodPrice, setProdPrice] = useState<number>(32000);
  const [prodCost, setProdCost] = useState<number>(14500);

  if (!isOpen) return null;

  const handleStockNameChange = (val: string) => {
    setStockName(val);
    setNameError('');
    if (!prodSku || prodSku.startsWith('#')) {
      const rand = Math.floor(200 + Math.random() * 700);
      setProdSku(`#${rand}`);
    }
  };

  const handleSelectColor = (color: { name: string; hex: string }) => {
    setProdColorFamily(color.name);
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
        colorName: prodSpecificColor.trim() || prodColorFamily,
        colorFamily: prodColorFamily,
        specificColor: prodSpecificColor.trim() || undefined,
        colorHex: prodColorHex,
        size: prodSize,
        season: prodSeason,
        stock: Number(prodStock) || 0,
        minStockThreshold: 10,
        locationFacility: 'Perchero / Salón',
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
      facilityDefault: 'Perchero / Salón',
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
                Crear Nuevo Stock
              </h2>
              <p className="text-xs text-[#5e5d69]">
                Registra un nuevo departamento de indumentaria y sus prendas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nombre de la Colección / Stock *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Vestidos, Camperas, Calzado, Sweaters..."
                value={stockName}
                onChange={(e) => handleStockNameChange(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/60 rounded-xl focus:border-[#42308f] focus:bg-white focus:outline-none transition-colors ${
                  nameError ? 'border-rose-400 focus:border-rose-500' : ''
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
                Descripción (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Colección de temporada, prendas de alta gama o sastrería"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2 bg-[#f8f9ff] border border-[#c9c4d3]/60 rounded-xl focus:border-[#42308f] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="pt-1">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Ícono Visual (Para el menú)
              </label>
              <div className="flex flex-wrap gap-2.5">
                {AVAILABLE_ICONS.map((ico) => (
                  <button
                    key={ico.id}
                    type="button"
                    onClick={() => setSelectedIcon(ico.id)}
                    title={ico.label}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                      selectedIcon === ico.id
                        ? 'bg-[#42308f] text-white shadow-md ring-2 ring-[#42308f]/30 scale-105'
                        : 'bg-[#f8f9ff] text-[#5e5d69] hover:bg-[#eff4ff] hover:text-[#42308f] border border-[#c9c4d3]/30'
                    }`}
                  >
                    {ico.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addInitialProduct}
                  onChange={(e) => setAddInitialProduct(e.target.checked)}
                  className="w-4 h-4 rounded text-[#42308f] focus:ring-[#42308f] bg-white border-gray-300"
                />
                <span className="text-xs font-bold text-[#0b1c30]">
                  Cargar primera prenda a este stock ahora
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
                      placeholder="Ej. Remera Básica..."
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
                      className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none text-[#42308f]"
                    />
                  </div>
                </div>

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
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-gray-700">
                      Familia de Color Principal: <span className="font-extrabold text-[#42308f]">{prodColorFamily}</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {MAIN_COLOR_FAMILIES.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => handleSelectColor(col)}
                        title={col.name}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          prodColorFamily === col.name
                            ? 'ring-2 ring-offset-2 ring-[#42308f] scale-110 shadow-xs'
                            : 'hover:scale-105 opacity-90'
                        }`}
                        style={{
                          backgroundColor: col.hex,
                          border: col.hasBorder ? '1px solid #d1d5db' : 'none',
                        }}
                      >
                        {prodColorFamily === col.name && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              col.name === 'Blanco' || col.name === 'Amarillo' || col.name === 'Celeste'
                                ? 'text-gray-900'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Color Específico o Comercial (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder={`Ej. ${prodColorFamily === 'Rojo' ? 'Bordó, Rojo Cherry...' : prodColorFamily === 'Marrón' ? 'Marrón Oscuro, Chocolate...' : 'Tono comercial de la boutique...'}`}
                      value={prodSpecificColor}
                      onChange={(e) => setProdSpecificColor(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                    />
                  </div>
                </div>

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

          <div className="pt-3 flex justify-end items-center gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Crear Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};