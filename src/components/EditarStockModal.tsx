import React, { useState, useEffect } from 'react';
import { X, Edit, Package, Save, Trash2 } from 'lucide-react';
import { ProductItem } from '../types';

interface EditarStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onSaveProduct: (updated: ProductItem) => void;
}

export const EditarStockModal: React.FC<EditarStockModalProps> = ({
  isOpen,
  onClose,
  product,
  onSaveProduct,
}) => {
  const [formData, setFormData] = useState<ProductItem | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({ ...product });
    }
  }, [product]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // determine status automatically
    let status: ProductItem['status'] = 'ok';
    if (formData.stock === 0) {
      status = 'agotado';
    } else if (formData.stock <= formData.minStockThreshold) {
      status = 'bajo';
    }

    onSaveProduct({
      ...formData,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full card-shadow border border-[#c9c4d3]/40 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
                Editar Stock
              </h2>
              <p className="text-xs font-mono text-[#5e5d69]">{formData.sku}</p>
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
              Nombre de Prenda
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Descripción / Especificaciones
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Stock Físico Actual
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full text-sm font-bold text-[#42308f] px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Umbral de Stock Bajo
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.minStockThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, minStockThreshold: Number(e.target.value) })
                }
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ubicación Física
              </label>
              <select
                value={formData.locationFacility}
                onChange={(e) => setFormData({ ...formData, locationFacility: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none font-medium"
              >
                <option value="Perchero / Salón">Perchero / Salón</option>
                <option value="Depósito / Trastienda">Depósito / Trastienda</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Detalle / Perchero
              </label>
              <input
                type="text"
                value={formData.locationDetails}
                placeholder="Ej. Perchero 1, Estante..."
                onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] shadow-sm transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
