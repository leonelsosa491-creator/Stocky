export type NavScreen = 
  | 'resumen' 
  | 'stock' 
  | 'productos' 
  | 'movimientos' 
  | 'reservas' 
  | 'promociones' 
  | 'proveedores' 
  | 'configuracion'
  | 'login';

export type StockStatus = 'ok' | 'bajo' | 'agotado';

export interface ProductItem {
  sku: string; // Internal unique identifier (e.g. #101, #102)
  name: string;
  description: string;
  category: string;
  colorName: string;
  colorFamily?: string; // Main color family: Blanco, Negro, Rojo, Naranja, Amarillo, Azul, Celeste, Violeta, Rosado, Marrón, Gris
  specificColor?: string; // Specific/commercial boutique color (e.g. "Bordó", "Rojo Cherry", "Marrón Oscuro")
  colorHex: string;
  size: string;
  season: string;
  stock: number;
  minStockThreshold: number;
  locationFacility: 'Perchero / Salón' | 'Depósito / Trastienda' | string;
  locationDetails: string;
  price: number;
  cost: number;
  status: StockStatus;
}

export interface CategorySummary {
  name: string;
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  actionType: 'detalles' | 'revisar';
  icon: string;
  description?: string;
  facilityDefault?: string;
}

export interface StockMovement {
  id: string;
  date: string;
  rawDate?: string;
  sku: string;
  productName: string;
  type: 'ingreso' | 'egreso' | 'ajuste';
  quantity: number;
  user: string;
  sourceOrDestination: string;
  notes: string;
}

export type PromotionStatus = 'activa' | 'programada' | 'pausada' | 'expirada';
export type DiscountType = 'porcentaje' | 'monto_fijo' | 'dos_por_uno';

export interface Promotion {
  id: string;
  title: string;
  code?: string;
  discountType: DiscountType;
  discountValue: number;
  category: 'Todas' | 'Buzos' | 'Remeras' | 'Pantalones' | 'Abrigos' | 'Accesorios' | string;
  appliesTo: string;
  selectedProductSkus: string[];
  dayOfWeek?: 'sábados' | 'todos' | 'fines_de_semana' | string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  minPurchase?: number;
  usageCount: number;
  notes?: string;
}

export type ReservaStatus = 'activa' | 'retirada' | 'caducada';

export interface ReservaItem {
  id: string;
  code: string; // e.g. #RES-101
  garmentSku: string;
  garmentName: string;
  category: string;
  colorName: string;
  size: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  depositAmount: number; // Seña abonada (obligatoria, la mitad o menos del total)
  pendingBalance: number; // Saldo a pagar al retirar
  depositPaymentMethod: 'efectivo' | 'transferencia' | 'debito';
  customerName: string;
  customerPhone: string;
  customerNotes?: string;
  createdAt: string; // YYYY-MM-DD o formato legible
  expiresAt: string; // Fecha límite de caducidad
  status: ReservaStatus;
  pickedUpAt?: string;
  balancePaymentMethod?: string;
}

export interface Supplier {
  id: string;
  name: string; // Nombre del Proveedor o Fábrica
  type?: 'Proveedor' | 'Fábrica';
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  categories: string[];
  leadTimeDays?: number;
  paymentTerms?: string;
  notes?: string;
  active: boolean;
}

export type Role = 'developer' | 'admin' | 'vendedora';
export type UserRole = Role;

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  lastActive?: string;
  status: 'activo' | 'inactivo';
}
