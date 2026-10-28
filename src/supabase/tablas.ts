// Traductores y sincronización de movimientos, reservas, promociones y proveedores
// entre Supabase (snake_case) y TypeScript (camelCase). El aislamiento por boutique
// lo garantiza RLS; además mandamos boutique_id explícito en cada escritura.
// @ts-ignore - supabaseClient es .js puro
import { supabase } from './supabaseClient';
import { StockMovement, ReservaItem, Promotion, Supplier } from '../types';

export const generarSufijoId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

const mapDbToMovement = (row: any): StockMovement => ({
  id: row.id,
  date: row.fecha,
  rawDate: row.fecha_iso || undefined,
  sku: row.sku,
  productName: row.producto,
  type: row.tipo,
  quantity: Number(row.cantidad),
  user: row.usuario || '',
  userId: row.usuario_id || undefined,
  sourceOrDestination: row.origen_destino || '',
  notes: row.notas || '',
});

const mapMovementToDb = (m: StockMovement, boutiqueId: string) => ({
  boutique_id: boutiqueId,
  id: m.id,
  fecha: m.date,
  fecha_iso: m.rawDate || null,
  sku: m.sku,
  producto: m.productName,
  tipo: m.type,
  cantidad: m.quantity,
  usuario: m.user || '',
  origen_destino: m.sourceOrDestination || '',
  notas: m.notes || '',
});

const mapDbToReserva = (row: any): ReservaItem => ({
  id: row.id,
  code: row.codigo,
  garmentSku: row.sku,
  garmentName: row.prenda,
  category: row.categoria || '',
  colorName: row.color || '',
  size: row.talle || '',
  unitPrice: Number(row.precio_unitario),
  quantity: Number(row.cantidad),
  totalPrice: Number(row.precio_total),
  depositAmount: Number(row.sena),
  pendingBalance: Number(row.saldo_pendiente),
  depositPaymentMethod: row.metodo_pago_sena,
  customerName: row.cliente_nombre,
  customerPhone: row.cliente_telefono || '',
  customerNotes: row.cliente_notas || undefined,
  createdAt: row.creada_el,
  expiresAt: row.vence_el,
  status: row.estado,
  pickedUpAt: row.retirada_el || undefined,
  balancePaymentMethod: row.metodo_pago_saldo || undefined,
});

const mapReservaToDb = (r: ReservaItem, boutiqueId: string) => ({
  boutique_id: boutiqueId,
  id: r.id,
  codigo: r.code,
  sku: r.garmentSku,
  prenda: r.garmentName,
  categoria: r.category || '',
  color: r.colorName || '',
  talle: r.size || '',
  precio_unitario: r.unitPrice,
  cantidad: r.quantity,
  precio_total: r.totalPrice,
  sena: r.depositAmount,
  saldo_pendiente: r.pendingBalance,
  metodo_pago_sena: r.depositPaymentMethod,
  cliente_nombre: r.customerName,
  cliente_telefono: r.customerPhone || '',
  cliente_notas: r.customerNotes || null,
  creada_el: r.createdAt,
  vence_el: r.expiresAt,
  estado: r.status,
  retirada_el: r.pickedUpAt || null,
  metodo_pago_saldo: r.balancePaymentMethod || null,
});

const mapDbToPromotion = (row: any): Promotion => ({
  id: row.id,
  title: row.titulo,
  code: row.codigo || undefined,
  discountType: row.tipo_descuento,
  discountValue: Number(row.valor_descuento),
  category: row.categoria,
  appliesTo: row.aplica_a || '',
  selectedProductSkus: row.skus || [],
  dayOfWeek: row.dia_semana || undefined,
  startDate: row.fecha_inicio || '',
  endDate: row.fecha_fin || '',
  status: row.estado,
  minPurchase: row.compra_minima == null ? undefined : Number(row.compra_minima),
  usageCount: Number(row.usos ?? 0),
  notes: row.notas || undefined,
});

const mapPromotionToDb = (p: Promotion, boutiqueId: string) => ({
  boutique_id: boutiqueId,
  id: p.id,
  titulo: p.title,
  codigo: p.code || null,
  tipo_descuento: p.discountType,
  valor_descuento: p.discountValue,
  categoria: p.category,
  aplica_a: p.appliesTo || '',
  skus: p.selectedProductSkus || [],
  dia_semana: p.dayOfWeek || null,
  fecha_inicio: p.startDate || '',
  fecha_fin: p.endDate || '',
  estado: p.status,
  compra_minima: p.minPurchase ?? null,
  usos: p.usageCount ?? 0,
  notas: p.notes || null,
});

const mapDbToSupplier = (row: any): Supplier => ({
  id: row.id,
  name: row.nombre,
  type: row.tipo || undefined,
  contactPerson: row.contacto || '',
  phone: row.telefono || '',
  email: row.email || undefined,
  address: row.direccion || '',
  categories: row.categorias || [],
  leadTimeDays: row.demora_dias ?? undefined,
  paymentTerms: row.condiciones_pago || undefined,
  notes: row.notas || undefined,
  active: Boolean(row.activo),
});

const mapSupplierToDb = (s: Supplier, boutiqueId: string) => ({
  boutique_id: boutiqueId,
  id: s.id,
  nombre: s.name,
  tipo: s.type || null,
  contacto: s.contactPerson || '',
  telefono: s.phone || '',
  email: s.email || null,
  direccion: s.address || '',
  categorias: s.categories || [],
  demora_dias: s.leadTimeDays ?? null,
  condiciones_pago: s.paymentTerms || null,
  notas: s.notes || null,
  activo: s.active,
});

const logError = (accion: string, error: any) => {
  if (error) console.error(`Supabase (${accion}):`, error.message);
};

const fetchTabla = async <T>(tabla: string, mapper: (row: any) => T): Promise<T[] | null> => {
  const { data, error } = await supabase
    .from(tabla)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    logError(`cargar ${tabla}`, error);
    return null;
  }
  return (data || []).map(mapper);
};

const upsertTabla = async (tabla: string, rows: object[]) => {
  if (rows.length === 0) return;
  const { error } = await supabase.from(tabla).upsert(rows, { onConflict: 'boutique_id,id' });
  logError(`guardar ${tabla}`, error);
};

const deleteTabla = async (tabla: string, boutiqueId: string, ids: string[]) => {
  if (ids.length === 0) return;
  const { error } = await supabase.from(tabla).delete().eq('boutique_id', boutiqueId).in('id', ids);
  logError(`eliminar ${tabla}`, error);
};

// Devuelve null si la tabla no se pudo leer (p. ej. la migración todavía no se corrió)
export const fetchMovimientos = () => fetchTabla('movimientos', mapDbToMovement);
export const fetchReservas = () => fetchTabla('reservas', mapDbToReserva);
export const fetchPromociones = () => fetchTabla('promociones', mapDbToPromotion);
export const fetchProveedores = () => fetchTabla('proveedores', mapDbToSupplier);

export const upsertMovimientos = (boutiqueId: string, items: StockMovement[]) =>
  upsertTabla('movimientos', items.map((m) => mapMovementToDb(m, boutiqueId)));
export const upsertReservas = (boutiqueId: string, items: ReservaItem[]) =>
  upsertTabla('reservas', items.map((r) => mapReservaToDb(r, boutiqueId)));
export const upsertPromociones = (boutiqueId: string, items: Promotion[]) =>
  upsertTabla('promociones', items.map((p) => mapPromotionToDb(p, boutiqueId)));
export const upsertProveedores = (boutiqueId: string, items: Supplier[]) =>
  upsertTabla('proveedores', items.map((s) => mapSupplierToDb(s, boutiqueId)));

export const deleteReservas = (boutiqueId: string, ids: string[]) => deleteTabla('reservas', boutiqueId, ids);
export const deletePromociones = (boutiqueId: string, ids: string[]) => deleteTabla('promociones', boutiqueId, ids);
export const deleteProveedores = (boutiqueId: string, ids: string[]) => deleteTabla('proveedores', boutiqueId, ids);

export const vaciarTablasBoutique = async (boutiqueId: string) => {
  try {
    // Borramos todo en orden (ahora incluimos las categorías)
    await supabase.from('productos').delete().eq('boutique_id', boutiqueId);
    await supabase.from('categorias').delete().eq('boutique_id', boutiqueId);
    await supabase.from('movimientos').delete().eq('boutique_id', boutiqueId);
    await supabase.from('reservas').delete().eq('boutique_id', boutiqueId);
    await supabase.from('promociones').delete().eq('boutique_id', boutiqueId);
    await supabase.from('proveedores').delete().eq('boutique_id', boutiqueId);
    return true;
  } catch (error) {
    console.error("Error vaciando tablas:", error);
    return false;
  }
};

// Ventas y reservas: descuento atómico vía RPC (la vendedora no puede escribir productos directamente)
export const descontarStock = async (items: { sku: string; cantidad: number }[]) => {
  if (items.length === 0) return;
  const { error } = await supabase.rpc('descontar_stock', { p_items: items });
  logError('descontar stock', error);
};
