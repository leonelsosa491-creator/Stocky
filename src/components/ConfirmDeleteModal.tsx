import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  itemType?: string;
  confirmText?: string;
  itemDetail?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'el elemento',
  confirmText,
  itemDetail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl w-full max-w-md border border-[#c9c4d3]/50 shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#f8f9ff] text-[#797583] hover:text-[#0b1c30] flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-4">
            <h3 className="font-heading font-bold text-lg text-[#0b1c30]">
              {title}
            </h3>
            <p className="text-xs text-[#5e5d69] mt-1.5 leading-relaxed">
              ¿Estás segura de eliminar permanentemente {itemType}{' '}
              <span className="font-bold text-[#0b1c30]">"{itemName}"</span>?
            </p>

            {itemDetail && (
              <p className="text-[11px] font-mono text-[#797583] bg-[#f8f9ff] px-2.5 py-1.5 rounded-lg mt-2 border border-gray-100">
                {itemDetail}
              </p>
            )}

            <p className="text-[11px] text-rose-600 font-medium mt-2">
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#5e5d69] hover:text-[#0b1c30] rounded-full transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-all shadow-sm"
          >
            {confirmText || 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
