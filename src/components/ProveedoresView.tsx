import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  MessageCircle,
  Factory,
  Building2,
} from 'lucide-react';
import { Supplier } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProveedoresViewProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

export const ProveedoresView: React.FC<ProveedoresViewProps> = ({
  suppliers,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
}) => {
  const { user } = useAuth();
  const userName = user?.name || 'tu equipo';
  const businessName = user?.businessName?.trim() || 'tu boutique';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Fábrica' | 'Proveedor'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'Proveedor' | 'Fábrica'>('Fábrica');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Open modal for new
  const handleOpenNew = () => {
    setEditingSupplier(null);
    setName('');
    setType('Fábrica');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCategoriesInput('Buzos, Remeras');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setType(sup.type || (sup.name.toLowerCase().includes('fábrica') ? 'Fábrica' : 'Proveedor'));
    setContactPerson(sup.contactPerson);
    setPhone(sup.phone);
    setEmail(sup.email || '');
    setAddress(sup.address);
    setCategoriesInput(sup.categories.join(', '));
    setNotes(sup.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  // Submit modal form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del proveedor o fábrica es obligatorio.');
      return;
    }
    if (!phone.trim()) {
      setError('El teléfono o WhatsApp de contacto es obligatorio.');
      return;
    }

    const parsedCategories = categoriesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (editingSupplier) {
      onEditSupplier({
        ...editingSupplier,
        name: name.trim(),
        type,
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        categories: parsedCategories.length > 0 ? parsedCategories : ['General'],
        notes: notes.trim() || undefined,
      });
    } else {
      onAddSupplier({
        name: name.trim(),
        type,
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        categories: parsedCategories.length > 0 ? parsedCategories : ['General'],
        notes: notes.trim() || undefined,
        active: true,
      });
    }

    setIsModalOpen(false);
  };

  // Filtered suppliers
  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      // Type filter
      if (typeFilter !== 'Todos') {
        const itemType = s.type || (s.name.toLowerCase().includes('fábrica') ? 'Fábrica' : 'Proveedor');
        if (itemType !== typeFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'Todas') {
        const hasCat = s.categories.some(
          (c) => c.toLowerCase() === categoryFilter.toLowerCase()
        );
        if (!hasCat) return false;
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.categories.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [suppliers, categoryFilter, typeFilter, searchTerm]);

  // WhatsApp link helper
  const handleWhatsApp = (phoneStr: string, nameStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    const phoneWithCode = clean.startsWith('54') ? clean : `549${clean}`;
    const text = encodeURIComponent(
      `Hola ${nameStr}! Te saludamos de parte de ${userName} (${businessName}). Nos comunicamos para coordinar pedidos de mercadería.`
    );
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
            Proveedores & Fábricas
          </h1>
        </div>

        <button
          id="btn-nuevo-proveedor"
          onClick={handleOpenNew}
          className="px-5 py-2.5 bg-[#42308f] hover:bg-[#5a49a8] text-white text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proveedor o Fábrica</span>
        </button>
      </div>

      {/* KPI Stats: Fábricas y Proveedores Activos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <span className="text-[11px] font-bold text-[#5e5d69] uppercase tracking-wider block">
            Total en Cartera
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-2xl font-black text-[#42308f]">
              {suppliers.filter((s) => s.active).length}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">Activos</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <span className="text-[11px] font-bold text-[#5e5d69] uppercase tracking-wider block flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5 text-blue-600" />
            Fábricas
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-2xl font-black text-blue-700">
              {suppliers.filter((s) => (s.type || (s.name.toLowerCase().includes('fábrica') ? 'Fábrica' : 'Proveedor')) === 'Fábrica').length}
            </span>
            <span className="text-[11px] text-[#5e5d69] font-medium">De indumentaria</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#c9c4d3]/40 card-shadow">
          <span className="text-[11px] font-bold text-[#5e5d69] uppercase tracking-wider block flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            Proveedores
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-heading text-2xl font-black text-emerald-700">
              {suppliers.filter((s) => (s.type || (s.name.toLowerCase().includes('fábrica') ? 'Fábrica' : 'Proveedor')) === 'Proveedor').length}
            </span>
            <span className="text-[11px] text-[#5e5d69] font-medium">Mayoristas textiles</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#c9c4d3]/40 card-shadow">
            {(['Todos', 'Fábrica', 'Proveedor'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  typeFilter === t
                    ? 'bg-[#42308f] text-white shadow-xs'
                    : 'text-[#5e5d69] hover:text-[#42308f] hover:bg-[#f8f9ff]'
                }`}
              >
                {t === 'Todos' ? 'Todos' : t === 'Fábrica' ? 'Fábricas' : 'Proveedores'}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#c9c4d3]/40 card-shadow overflow-x-auto">
            {['Todas', 'Buzos', 'Remeras', 'Pantalones', 'Abrigos'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#eff4ff] text-[#42308f] border border-[#42308f]/20'
                    : 'text-[#5e5d69] hover:text-[#42308f]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#797583] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por fábrica, proveedor, contacto..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#c9c4d3]/40 rounded-full focus:outline-none focus:border-[#42308f]"
          />
        </div>
      </div>

      {/* Supplier Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#c9c4d3]/40 card-shadow">
          <div className="w-14 h-14 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#0b1c30]">
            No se encontraron resultados
          </h3>
          <p className="text-xs text-[#797583] max-w-sm mx-auto mt-1 mb-5">
            {searchTerm || categoryFilter !== 'Todas' || typeFilter !== 'Todos'
              ? 'Probá ajustando el filtro de tipo, rubro o el texto de búsqueda.'
              : `Agregá los proveedores y fábricas con los que trabaja ${userName} para tener sus contactos centralizados.`}
          </p>
          <button
            onClick={handleOpenNew}
            className="px-6 py-2.5 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] transition-all shadow-sm"
          >
            Agregar Proveedor o Fábrica
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sup) => {
            const currentType = sup.type || (sup.name.toLowerCase().includes('fábrica') ? 'Fábrica' : 'Proveedor');
            const isFabrica = currentType === 'Fábrica';

            return (
              <div
                key={sup.id}
                className="bg-white rounded-3xl border border-[#c9c4d3]/40 hover:border-[#42308f]/50 transition-all card-shadow flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3.5">
                  {/* Card Title & Type Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono font-bold text-[#42308f] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                          {sup.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            isFabrica
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          }`}
                        >
                          {isFabrica ? <Factory className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                          {currentType}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-base text-[#0b1c30]">
                        {sup.name}
                      </h3>
                      <p className="text-xs text-[#5e5d69] font-medium mt-0.5">
                        Contacto: <strong className="text-gray-900">{sup.contactPerson}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sup)}
                        className="p-1.5 text-gray-400 hover:text-[#42308f] hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSupplierToDelete(sup)}
                        className="p-1.5 text-gray-400 hover:text-[#ba1a1a] hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Categories Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {sup.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 bg-[#f8f9ff] text-[#42308f] text-[10px] font-bold rounded-lg border border-[#42308f]/15"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Information rows */}
                  <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-mono text-gray-900 font-semibold">{sup.phone}</span>
                    </div>

                    {sup.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{sup.email}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight text-gray-700">{sup.address}</span>
                    </div>
                  </div>

                  {sup.notes && (
                    <p className="text-[11px] text-gray-500 italic bg-[#f8f9ff] p-2 rounded-xl border border-gray-100">
                      "{sup.notes}"
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isFabrica ? 'Fábrica Activa' : 'Proveedor Activo'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleWhatsApp(sup.phone, sup.contactPerson)}
                    className="px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-[#25D366]/30"
                    title="Escribir por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear / Editar Proveedor o Fábrica */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#c9c4d3]/40 space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#0b1c30]">
                  {editingSupplier ? 'Editar Proveedor o Fábrica' : 'Nuevo Proveedor o Fábrica'}
                </h3>
                <p className="text-xs text-gray-500">
                  {userName} trabaja exclusivamente con fábricas de confección y proveedores mayoristas.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              {/* Selector de Tipo: Fábrica o Proveedor */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Tipo de Entidad *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('Fábrica')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      type === 'Fábrica'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Factory className="w-4 h-4" />
                    <span>Fábrica de Indumentaria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('Proveedor')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      type === 'Proveedor'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Proveedor Textil</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Nombre del {type} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'Fábrica' ? 'Ej. Fábrica Textil Avellaneda' : 'Ej. Proveedor Mayorista Flores'}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Persona de Contacto *
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Ej. Roberto Gómez"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 11-4201-9943"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Email de Contacto (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@empresa.com"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Dirección o Zona
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Av. Mitre 2410, Avellaneda"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Rubros o Prendas que provee (separados por coma)
                </label>
                <input
                  type="text"
                  value={categoriesInput}
                  onChange={(e) => setCategoriesInput(e.target.value)}
                  placeholder="Ej. Buzos, Remeras, Joggers, Abrigos"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Excelente frisa invisible, envíos a mostrador..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#42308f] hover:bg-[#5a49a8] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  {editingSupplier ? 'Guardar Cambios' : 'Guardar Proveedor / Fábrica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-heading font-bold text-base text-[#0b1c30]">
              ¿Eliminar {supplierToDelete.type || 'registro'}?
            </h3>
            <p className="text-xs text-gray-600">
              Vas a eliminar a <strong>{supplierToDelete.name}</strong> de la cartera de proveedores de {userName}.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteSupplier(supplierToDelete.id);
                  setSupplierToDelete(null);
                }}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
