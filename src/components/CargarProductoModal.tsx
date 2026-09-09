import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Shirt,
  Check,
  Save,
  Package,
  RefreshCw,
  Sparkles,
  Search,
  Minus,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  MapPin,
  Truck,
  Building,
} from 'lucide-react';
import { ProductItem } from '../types';

interface CargarProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  categories: string[];
  defaultCategory?: string;
  onSaveProduct: (product: ProductItem) => void;
  onSaveBatchProducts?: (products: ProductItem[]) => void;
  onReplenishProduct?: (data: {
    sku: string;
    productName: string;
    category: string;
    quantity: number;
    colorName: string;
    size: ProductItem['size'];
    locationFacility: string;
    locationDetails: string;
    supplier: string;
    notes: string;
  }) => void;
  productToEdit?: ProductItem | null;
  productToReplenish?: ProductItem | null;
  initialMode?: 'reponer' | 'nuevo';
  onCreateCategory?: (categoryName: string) => void;
}

const PRESET_COLORS = [
  { name: 'Negro', hex: '#18181b' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Azul Marino', hex: '#1e3a8a' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Beige', hex: '#d4b996' },
  { name: 'Gris', hex: '#6b7280' },
  { name: 'Verde Oliva', hex: '#4d7c0f' },
  { name: 'Camel', hex: '#c2925b' },
  { name: 'Rosa Pastel', hex: '#f472b6' },
];

const STANDARD_SIZES: ProductItem['size'][] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const CargarProductoModal: React.FC<CargarProductoModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  defaultCategory = 'Buzos',
  onSaveProduct,
  onSaveBatchProducts,
  onReplenishProduct,
  productToEdit,
  productToReplenish,
  initialMode = 'reponer',
  onCreateCategory,
}) => {
  // Mode: 'reponer' (existing item) or 'nuevo' (create brand new product)
  const [activeTab, setActiveTab] = useState<'reponer' | 'nuevo'>('reponer');

  // ==========================================
  // STATE: MODO 1 - REPONER EXISTENTE
  // ==========================================
  const [replenishSearch, setReplenishSearch] = useState('');
  const [selectedProductSku, setSelectedProductSku] = useState<string>('');
  const [replenishQuantity, setReplenishQuantity] = useState<number>(10);
  const [replenishSupplier, setReplenishSupplier] = useState('Fábrica Textil');
  const [replenishNotes, setReplenishNotes] = useState('Reposición boutique');
  const [replenishFacility, setReplenishFacility] = useState('Perchero / Salón');
  const [showReplenishDetails, setShowReplenishDetails] = useState(false);

  // ==========================================
  // STATE: MODO 2 - PRENDA NUEVA
  // ==========================================
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [price, setPrice] = useState<number>(35000);
  const [cost, setCost] = useState<number>(16000);
  const [colorName, setColorName] = useState('Negro');
  const [colorHex, setColorHex] = useState('#18181b');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState('Invierno');
  const [minStockThreshold, setMinStockThreshold] = useState<number>(10);
  const [locationFacility, setLocationFacility] = useState('Perchero / Salón');
  const [locationDetails, setLocationDetails] = useState('Perchero Salón');
  const [showAdvancedNew, setShowAdvancedNew] = useState(false);

  // Curva de talles vs talle individual
  const [isCurvaTalles, setIsCurvaTalles] = useState(false);
  const [singleSize, setSingleSize] = useState<ProductItem['size']>('M');
  const [singleQuantity, setSingleQuantity] = useState<number>(20);
  const [curvaQuantities, setCurvaQuantities] = useState<Record<string, number>>({
    S: 5,
    M: 10,
    L: 10,
    XL: 5,
  });

  // Reset or initialize state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setActiveTab('nuevo');
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setDescription(productToEdit.description);
      setCategory(productToEdit.category);
      setSingleSize(productToEdit.size);
      setIsCurvaTalles(false);
      setSeason(productToEdit.season);
      setColorName(productToEdit.colorName);
      setColorHex(productToEdit.colorHex);
      setSingleQuantity(productToEdit.stock);
      setMinStockThreshold(productToEdit.minStockThreshold);
      setPrice(productToEdit.price);
      setCost(productToEdit.cost);
      setLocationFacility(productToEdit.locationFacility);
      setLocationDetails(productToEdit.locationDetails);
    } else if (productToReplenish) {
      setActiveTab('reponer');
      setSelectedProductSku(productToReplenish.sku);
      setReplenishFacility(productToReplenish.locationFacility || 'Perchero / Salón');
      setReplenishQuantity(10);
    } else {
      // Default behavior
      if (initialMode) {
        setActiveTab(initialMode);
      } else {
        setActiveTab(products.length > 0 ? 'reponer' : 'nuevo');
      }

      // Pre-select first product for replenish if available
      if (products.length > 0) {
        setSelectedProductSku(products[0].sku);
        setReplenishFacility(products[0].locationFacility || 'Perchero / Salón');
      }

      // Find next boutique ID number
      const existingNums = products
        .map((p) => {
          const match = p.sku.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter((n) => !isNaN(n) && n > 0);
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 101;

      // New product defaults
      setName('');
      setCategory(defaultCategory || categories[0] || 'Remeras');
      setIsCreatingNewCategory(false);
      setNewCategoryName('');
      setSku(`#${nextNum}`);
      setDescription('');
      setSingleSize('M');
      setIsCurvaTalles(false);
      setSeason('Invierno');
      setColorName('Negro');
      setColorHex('#18181b');
      setSingleQuantity(20);
      setMinStockThreshold(10);
      setPrice(35000);
      setCost(16000);
      setLocationFacility('Perchero / Salón');
      setLocationDetails('Perchero Salón');
      setReplenishQuantity(10);
      setReplenishSearch('');
    }
  }, [isOpen, productToEdit, productToReplenish, defaultCategory, categories, initialMode, products]);

  // Selected product in Reponer mode
  const selectedReplenishProduct = useMemo(() => {
    return products.find((p) => p.sku === selectedProductSku) || products[0] || null;
  }, [products, selectedProductSku]);

  // Filtered products list for Reponer search
  const filteredReplenishProducts = useMemo(() => {
    if (!replenishSearch.trim()) return products.slice(0, 8);
    const q = replenishSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.colorName.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q)
    );
  }, [products, replenishSearch]);

  // Generate code dynamically for new product (only if user hasn't typed one)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!productToEdit && !sku) {
      const existingNums = products
        .map((p) => {
          const match = p.sku.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter((n) => !isNaN(n) && n > 0);
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 101;
      setSku(`#${nextNum}`);
    }
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
  };

  const handleColorSelect = (col: { name: string; hex: string }) => {
    setColorName(col.name);
    setColorHex(col.hex);
  };

  const handleSingleSizeChange = (sz: ProductItem['size']) => {
    setSingleSize(sz);
  };

  // Submit Reponer Existente
  const handleReplenishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReplenishProduct || replenishQuantity <= 0) return;

    if (onReplenishProduct) {
      onReplenishProduct({
        sku: selectedReplenishProduct.sku,
        productName: selectedReplenishProduct.name,
        category: selectedReplenishProduct.category,
        quantity: Number(replenishQuantity),
        colorName: selectedReplenishProduct.colorName,
        size: selectedReplenishProduct.size,
        locationFacility: replenishFacility || selectedReplenishProduct.locationFacility,
        locationDetails: selectedReplenishProduct.locationDetails,
        supplier: replenishSupplier,
        notes: replenishNotes,
      });
    }
    onClose();
  };

  // Submit Prenda Nueva
  const handleNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = isCreatingNewCategory && newCategoryName.trim()
      ? newCategoryName.trim()
      : category;

    if (isCreatingNewCategory && newCategoryName.trim() && onCreateCategory) {
      onCreateCategory(newCategoryName.trim());
    }

    if (isCurvaTalles && onSaveBatchProducts) {
      // Create one product entry for each size that has > 0 units
      const batch: ProductItem[] = [];
      const baseSku = sku.replace(/-[A-Z0-9]+$/, '');

      Object.entries(curvaQuantities).forEach(([sz, rawQty]) => {
        const qty = Number(rawQty);
        if (qty > 0) {
          const itemSku = `${baseSku}-${sz}-${Math.floor(10 + Math.random() * 90)}`;
          batch.push({
            sku: itemSku,
            name: `${name.trim()} (Talle ${sz})`,
            description: description.trim() || `Prenda confeccionada de ${finalCategory}`,
            category: finalCategory,
            colorName,
            colorHex,
            size: sz as ProductItem['size'],
            season,
            stock: qty,
            minStockThreshold: Number(minStockThreshold),
            price: Number(price),
            cost: Number(cost),
            locationFacility,
            locationDetails,
            status: qty <= minStockThreshold ? 'bajo' : 'ok',
          });
        }
      });

      if (batch.length > 0) {
        onSaveBatchProducts(batch);
        onClose();
        return;
      }
    }

    // Single item creation or editing
    const currentStock = Number(singleQuantity);
    let status: ProductItem['status'] = 'ok';
    if (currentStock === 0) status = 'agotado';
    else if (currentStock <= minStockThreshold) status = 'bajo';

    const finalProduct: ProductItem = {
      sku: sku.trim() || `${finalCategory.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      description: description.trim() || `Prenda confeccionada de ${finalCategory}`,
      category: finalCategory,
      colorName,
      colorHex,
      size: singleSize,
      season,
      stock: currentStock,
      minStockThreshold: Number(minStockThreshold),
      price: Number(price),
      cost: Number(cost),
      locationFacility,
      locationDetails,
      status,
    };

    onSaveProduct(finalProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full card-shadow border border-[#c9c4d3]/40 p-5 sm:p-7 animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-[#0b1c30] tracking-tight flex items-center gap-2">
              <span>{productToEdit ? 'Editar Prenda' : 'Ingresar al Stock'}</span>
            </h2>
            <p className="text-xs text-[#5e5d69] mt-0.5">
              {productToEdit
                ? `Modificando características de ${productToEdit.name} (${productToEdit.sku})`
                : 'Sumá unidades a prendas que ya tenés o agregá un modelo nuevo al inventario.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WORKFLOW TABS (Solo si NO estamos editando una prenda existente) */}
        {!productToEdit && (
          <div className="pt-4 pb-2 shrink-0">
            <div className="grid grid-cols-2 p-1 bg-[#eff4ff] rounded-2xl border border-[#c9c4d3]/30">
              <button
                type="button"
                onClick={() => setActiveTab('reponer')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'reponer'
                    ? 'bg-white text-[#42308f] shadow-xs font-extrabold'
                    : 'text-[#5e5d69] hover:text-[#42308f]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${activeTab === 'reponer' ? 'text-[#42308f]' : ''}`} />
                <span>Reponer Existente</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('nuevo')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'nuevo'
                    ? 'bg-white text-[#42308f] shadow-xs font-extrabold'
                    : 'text-[#5e5d69] hover:text-[#42308f]'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'nuevo' ? 'text-[#42308f]' : ''}`} />
                <span>+ Prenda Nueva</span>
              </button>
            </div>
          </div>
        )}

        {/* MODAL BODY (Scrollable) */}
        <div className="overflow-y-auto flex-1 py-3 pr-1 space-y-4">
          {/* ============================================================== */}
          {/* TAB 1: REPONER STOCK EXISTENTE                                */}
          {/* ============================================================== */}
          {!productToEdit && activeTab === 'reponer' && (
            <form onSubmit={handleReplenishSubmit} className="space-y-4">
              {/* Buscador de prenda */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  1. Seleccioná la prenda que ingresó
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscá por nombre, talle, color o SKU (ej. Buzo, Negro, M)..."
                    value={replenishSearch}
                    onChange={(e) => setReplenishSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/60 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#42308f]"
                  />
                  {replenishSearch && (
                    <button
                      type="button"
                      onClick={() => setReplenishSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Lista de selección rápida */}
                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-2xl divide-y divide-gray-50 bg-[#fafbff]">
                  {filteredReplenishProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No encontramos prendas con esa búsqueda. Podés{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('nuevo')}
                        className="text-[#42308f] font-bold underline"
                      >
                        cargarla como prenda nueva
                      </button>
                      .
                    </div>
                  ) : (
                    filteredReplenishProducts.map((p) => {
                      const isSelected = p.sku === selectedReplenishProduct?.sku;
                      return (
                        <div
                          key={p.sku}
                          onClick={() => setSelectedProductSku(p.sku)}
                          className={`p-2.5 flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#eff4ff] text-[#42308f] font-bold border-l-4 border-[#42308f]'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 shrink-0"
                              style={{ backgroundColor: p.colorHex }}
                            />
                            <div className="truncate">
                              <span className="font-semibold text-[#0b1c30] mr-1.5">{p.name}</span>
                              <span className="text-[11px] text-gray-500 font-mono">[{p.sku}]</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-bold">
                              Talle {p.size}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                p.stock === 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : p.stock <= p.minStockThreshold
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stock} u.
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tarjeta de Prenda Seleccionada y Calculadora de Stock */}
              {selectedReplenishProduct && (
                <div className="bg-gradient-to-br from-[#eff4ff]/60 to-white rounded-2xl p-4 border border-[#42308f]/20 space-y-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#42308f]/10">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#42308f]">
                        Prenda Seleccionada
                      </span>
                      <h4 className="font-heading font-bold text-sm text-[#0b1c30]">
                        {selectedReplenishProduct.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-mono">
                        SKU: {selectedReplenishProduct.sku} • {selectedReplenishProduct.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-2xs">
                        Talle {selectedReplenishProduct.size}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-2xs flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: selectedReplenishProduct.colorHex }}
                        />
                        {selectedReplenishProduct.colorName}
                      </span>
                    </div>
                  </div>

                  {/* Contador de reposición */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      2. ¿Cuántas unidades ingresan?
                    </label>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white border-2 border-[#42308f]/40 rounded-2xl p-1 shadow-xs">
                        <button
                          type="button"
                          onClick={() => setReplenishQuantity((q) => Math.max(1, q - 5))}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          required
                          value={replenishQuantity}
                          onChange={(e) => setReplenishQuantity(Math.max(1, Number(e.target.value)))}
                          className="w-16 text-center font-heading text-lg font-black text-[#42308f] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setReplenishQuantity((q) => q + 5)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#42308f] hover:bg-[#5a49a8] text-white font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Botones rápidos de cantidad */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[5, 10, 20, 50].map((quick) => (
                          <button
                            key={quick}
                            type="button"
                            onClick={() => setReplenishQuantity((q) => q + quick)}
                            className="px-2.5 py-1.5 bg-white hover:bg-[#eff4ff] border border-[#c9c4d3]/60 rounded-xl text-xs font-bold text-[#42308f] transition-all hover:scale-105 active:scale-95 shadow-2xs"
                          >
                            +{quick}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resumen visual de impacto en el stock */}
                  <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-gray-100 text-center">
                    <div>
                      <span className="text-[10px] text-gray-500 font-semibold block">Stock Actual</span>
                      <span className="text-sm font-extrabold text-gray-800">
                        {selectedReplenishProduct.stock} u.
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 font-semibold block">Ingresan</span>
                      <span className="text-sm font-extrabold text-emerald-600">
                        +{replenishQuantity} u.
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#42308f] font-semibold block">Nuevo Stock</span>
                      <span className="text-base font-black text-[#42308f]">
                        {selectedReplenishProduct.stock + Number(replenishQuantity)} u.
                      </span>
                    </div>
                  </div>

                  {/* Acordeón Opcional de Detalles */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowReplenishDetails(!showReplenishDetails)}
                      className="text-xs font-bold text-[#5e5d69] hover:text-[#42308f] flex items-center gap-1 transition-colors"
                    >
                      {showReplenishDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showReplenishDetails ? 'Ocultar detalles de lote' : 'Detalles de lote / proveedor (Opcional)'}</span>
                    </button>

                    {showReplenishDetails && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Fábrica / Proveedor
                          </label>
                          <input
                            type="text"
                            value={replenishSupplier}
                            onChange={(e) => setReplenishSupplier(e.target.value)}
                            placeholder="Ej. Fábrica Avellaneda, Textil Flores..."
                            className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Notas de la partida
                          </label>
                          <input
                            type="text"
                            value={replenishNotes}
                            onChange={(e) => setReplenishNotes(e.target.value)}
                            placeholder="Ej. Lote invierno, corte nuevo..."
                            className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botón de Confirmación Principal */}
              <div className="pt-3 flex justify-end items-center gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={!selectedReplenishProduct}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-full shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Ingreso (+{replenishQuantity} u.)</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CARGAR PRENDA NUEVA O EDITAR PRENDA                    */}
          {/* ============================================================== */}
          {(productToEdit || activeTab === 'nuevo') && (
            <form onSubmit={handleNewProductSubmit} className="space-y-4">
              {/* 1. Nombre de la prenda */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Modelo / Prenda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Buzo Oversize Capucha, Remera Boxy..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full text-sm font-semibold px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                />
              </div>

              {/* 2. Categoría / Tipo de Stock */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">
                    Tipo de Prenda / Categoría de Stock *
                  </label>
                  {!productToEdit && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCategory(!isCreatingNewCategory)}
                      className="text-[11px] font-bold text-[#42308f] hover:underline"
                    >
                      {isCreatingNewCategory ? '← Elegir de la lista' : '+ Crear nueva categoría'}
                    </button>
                  )}
                </div>

                {isCreatingNewCategory ? (
                  <input
                    type="text"
                    required
                    placeholder="Nombre del nuevo tipo (ej. Camisas, Polleras)..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-[#eff4ff] border border-[#42308f]/50 rounded-xl focus:border-[#42308f] focus:outline-none text-[#42308f]"
                  />
                ) : (
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-[#f8f9ff] border border-[#c9c4d3]/60 rounded-xl focus:border-[#42308f] focus:outline-none text-[#42308f]"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 3. Color Seleccionable */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Color: <span className="text-[#42308f] font-extrabold">{colorName}</span>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => handleColorSelect(col)}
                      title={col.name}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        colorName === col.name
                          ? 'ring-2 ring-offset-2 ring-[#42308f] scale-110 shadow-xs'
                          : 'hover:scale-105 opacity-90'
                      }`}
                      style={{
                        backgroundColor: col.hex,
                        border: col.hex === '#ffffff' ? '1px solid #d1d5db' : 'none',
                      }}
                    >
                      {colorName === col.name && (
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

              {/* 4. Talle y Cantidad */}
              {!productToEdit && (
                <div className="bg-[#f8f9ff] p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Configuración de Talle y Stock</span>
                    <button
                      type="button"
                      onClick={() => setIsCurvaTalles(!isCurvaTalles)}
                      className="text-[11px] font-bold text-[#42308f] hover:underline"
                    >
                      {isCurvaTalles ? 'Modo talle único' : '⚡ Cargar varios talles (Curva)'}
                    </button>
                  </div>

                  {isCurvaTalles ? (
                    <div>
                      <p className="text-[11px] text-gray-500 mb-2">
                        Indicá cuántas unidades ingresan de cada talle para este modelo:
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {['S', 'M', 'L', 'XL'].map((sz) => (
                          <div key={sz} className="bg-white p-2 rounded-xl border border-gray-200 text-center">
                            <span className="text-xs font-extrabold text-[#42308f] block mb-1">
                              Talle {sz}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={curvaQuantities[sz] || 0}
                              onChange={(e) =>
                                setCurvaQuantities({
                                  ...curvaQuantities,
                                  [sz]: Math.max(0, Number(e.target.value)),
                                })
                              }
                              className="w-full text-center text-sm font-bold border border-gray-200 rounded-lg py-1 focus:border-[#42308f] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-right text-xs font-bold text-gray-700">
                        Total de prendas a ingresar:{' '}
                        <span className="text-[#42308f] font-black">
                          {Object.values(curvaQuantities).reduce<number>((sum, val) => sum + Number(val), 0)} unidades
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Talle
                        </label>
                        <div className="flex gap-1 flex-wrap">
                          {STANDARD_SIZES.map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleSingleSizeChange(sz)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                singleSize === sz
                                  ? 'bg-[#42308f] text-white shadow-xs'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Cantidad Inicial (Unidades)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            required
                            value={singleQuantity}
                            onChange={(e) => setSingleQuantity(Number(e.target.value))}
                            className="w-full text-sm font-bold text-[#42308f] px-3 py-1.5 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                          />
                          <div className="flex gap-1 shrink-0">
                            {[10, 25].map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => setSingleQuantity((prev) => prev + q)}
                                className="px-2 py-1 text-[10px] font-bold bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                              >
                                +{q}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Si estamos editando un producto existente: Talle y stock simple */}
              {productToEdit && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Talle</label>
                    <div className="flex gap-1 flex-wrap">
                      {STANDARD_SIZES.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSingleSize(sz)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                            singleSize === sz
                              ? 'bg-[#42308f] text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Stock Actual</label>
                    <input
                      type="number"
                      min="0"
                      value={singleQuantity}
                      onChange={(e) => setSingleQuantity(Number(e.target.value))}
                      className="w-full text-sm font-bold text-[#42308f] px-3 py-1.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 5. Precio de Venta y Código de Prenda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Precio de Venta ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full text-sm font-extrabold text-emerald-700 px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código de Prenda / Etiqueta (Ej. #101)
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="#101"
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                  />
                </div>
              </div>

              {/* 6. Sección colapsable: Más Opciones Avanzadas */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedNew(!showAdvancedNew)}
                  className="text-xs font-bold text-[#5e5d69] hover:text-[#42308f] flex items-center gap-1 transition-colors"
                >
                  {showAdvancedNew ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showAdvancedNew ? 'Ocultar opciones avanzadas' : 'Más opciones (Costo, Alerta y Ubicación)'}</span>
                </button>

                {showAdvancedNew && (
                  <div className="pt-3 space-y-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Costo de Confección ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={cost}
                          onChange={(e) => setCost(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Alerta de Stock Bajo (Mínimo)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={minStockThreshold}
                          onChange={(e) => setMinStockThreshold(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Temporada
                        </label>
                        <select
                          value={season}
                          onChange={(e) => setSeason(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                        >
                          <option value="Invierno">Invierno</option>
                          <option value="Verano">Verano</option>
                          <option value="Otoño">Otoño</option>
                          <option value="Primavera">Primavera</option>
                          <option value="Atemporal">Atemporal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Ubicación Física
                        </label>
                        <select
                          value={locationFacility}
                          onChange={(e) => setLocationFacility(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none font-medium"
                        >
                          <option value="Perchero / Salón">Perchero / Salón</option>
                          <option value="Depósito / Trastienda">Depósito / Trastienda</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Detalle Ubicación / Perchero
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Perchero Central, Estante 2..."
                        value={locationDetails}
                        onChange={(e) => setLocationDetails(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Descripción o notas de tela
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Algodón rústico con friza pesada..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-3 flex justify-end items-center gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#42308f] text-white text-xs font-extrabold rounded-full hover:bg-[#5a49a8] shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{productToEdit ? 'Guardar Cambios' : 'Guardar y Cargar al Stock'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
