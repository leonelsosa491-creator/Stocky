import {
  ProductItem,
  CategorySummary,
  StockMovement,
  Promotion,
  ReservaItem,
  Supplier,
  AppUser,
  Role,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_MOVEMENTS,
  INITIAL_PROMOTIONS,
  INITIAL_RESERVAS,
  INITIAL_SUPPLIERS,
  INITIAL_USERS,
} from '../data/mockData';

export const STORAGE_KEYS = {
  INITIALIZED: 'melina_app_storage_initialized_v2',
  PRODUCTS: 'melina_products_v2',
  CATEGORIES: 'melina_categories_v2',
  MOVEMENTS: 'melina_movements_v2',
  PROMOTIONS: 'melina_promotions_v2',
  RESERVAS: 'melina_reservas_v2',
  SUPPLIERS: 'melina_suppliers_v2',
  USERS: 'melina_users_v2',
  CURRENT_USER: 'melina_current_user_v2',
  SETTINGS: 'melina_settings_v2',
};

export interface AppStoredData {
  products: ProductItem[];
  categoriesBase: CategorySummary[];
  movements: StockMovement[];
  promotions: Promotion[];
  reservas: ReservaItem[];
  suppliers: Supplier[];
  users: AppUser[];
  currentUser: AppUser;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  minAlertStock: number;
  emailAlerts: boolean;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Aries - Melina's Indumentaria",
  address: 'Av. Santa Fe 1840, Buenos Aires',
  minAlertStock: 15,
  emailAlerts: true,
};

function safeGet(key: string): string | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
  } catch (err) {
    console.warn(`Error reading from localStorage (${key}):`, err);
    return null;
  }
}

export function safeSet(key: string, value: unknown): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.warn(`Error writing to localStorage (${key}):`, err);
  }
}

export function safeRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`Error removing from localStorage (${key}):`, err);
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn('Error parsing JSON from localStorage:', err);
    return fallback;
  }
}

/**
 * Loads the application state from localStorage.
 * If this is the very first time the app is run, it seeds localStorage with mock data
 * and marks the storage as initialized.
 * In any subsequent run, it returns whatever is currently in localStorage (even if empty `[]`),
 * ensuring user changes and resets are permanently preserved.
 */
export function loadInitialAppData(): AppStoredData {
  const isInitialized = safeGet(STORAGE_KEYS.INITIALIZED);

  if (!isInitialized) {
    // First time launch: populate localStorage with default seed data
    safeSet(STORAGE_KEYS.INITIALIZED, 'true');
    safeSet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    safeSet(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    safeSet(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
    safeSet(STORAGE_KEYS.RESERVAS, INITIAL_RESERVAS);
    safeSet(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
    safeSet(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);

    return {
      products: INITIAL_PRODUCTS,
      categoriesBase: INITIAL_CATEGORIES,
      movements: INITIAL_MOVEMENTS,
      promotions: INITIAL_PROMOTIONS,
      reservas: INITIAL_RESERVAS,
      suppliers: INITIAL_SUPPLIERS,
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
    };
  }

  // Already initialized: strictly read what the user left stored
  const productsRaw = safeParse<ProductItem[]>(safeGet(STORAGE_KEYS.PRODUCTS), []);
  const products = productsRaw.map((p) => {
    if (!p.colorFamily) {
      let family = p.colorName || 'Negro';
      const lower = family.toLowerCase();
      if (lower.includes('beige')) family = 'Beige';
      else if (lower.includes('rojo') || lower.includes('bordo') || lower.includes('cherry')) family = 'Rojo';
      else if (lower.includes('azul') || lower.includes('navy')) family = 'Azul';
      else if (lower.includes('celeste')) family = 'Celeste';
      else if (lower.includes('naranja') || lower.includes('terracota')) family = 'Naranja';
      else if (lower.includes('amarillo') || lower.includes('mostaza')) family = 'Amarillo';
      else if (lower.includes('violeta') || lower.includes('lila')) family = 'Violeta';
      else if (lower.includes('rosa') || lower.includes('fucsia')) family = 'Rosado';
      else if (lower.includes('marrón') || lower.includes('marron') || lower.includes('chocolate')) family = 'Marrón';
      else if (lower.includes('gris')) family = 'Gris';
      else if (lower.includes('negro')) family = 'Negro';
      else if (lower.includes('blanco')) family = 'Blanco';

      return {
        ...p,
        colorFamily: family,
        specificColor: p.specificColor || p.colorName,
      };
    }
    return p;
  });
  const categoriesBase = safeParse<CategorySummary[]>(
    safeGet(STORAGE_KEYS.CATEGORIES),
    INITIAL_CATEGORIES
  );
  const movements = safeParse<StockMovement[]>(safeGet(STORAGE_KEYS.MOVEMENTS), []);
  const promotions = safeParse<Promotion[]>(safeGet(STORAGE_KEYS.PROMOTIONS), []);
  const reservas = safeParse<ReservaItem[]>(safeGet(STORAGE_KEYS.RESERVAS), []);
  const suppliers = safeParse<Supplier[]>(safeGet(STORAGE_KEYS.SUPPLIERS), []);
  const rawUsers = safeParse<AppUser[]>(safeGet(STORAGE_KEYS.USERS), INITIAL_USERS);
  const users = rawUsers.map((u) => {
    let role: Role = u.role as Role;
    const roleStr = String(u.role);
    if (roleStr === 'administrador') role = 'admin';
    else if (roleStr === 'usuario normal') role = 'vendedora';
    else if (roleStr === 'desarrollador') role = 'developer';
    else if (roleStr !== 'admin' && roleStr !== 'developer' && roleStr !== 'vendedora') role = 'admin';
    return { ...u, role };
  });
  const rawCurrentUser = safeParse<AppUser>(safeGet(STORAGE_KEYS.CURRENT_USER), users[0] || INITIAL_USERS[0]);
  let currentRole: Role = rawCurrentUser.role as Role;
  const currRoleStr = String(rawCurrentUser.role);
  if (currRoleStr === 'administrador') currentRole = 'admin';
  else if (currRoleStr === 'usuario normal') currentRole = 'vendedora';
  else if (currRoleStr === 'desarrollador') currentRole = 'developer';
  else if (currRoleStr !== 'admin' && currRoleStr !== 'developer' && currRoleStr !== 'vendedora') currentRole = 'admin';
  const currentUser = { ...rawCurrentUser, role: currentRole };

  return {
    products,
    categoriesBase,
    movements,
    promotions,
    reservas,
    suppliers,
    users,
    currentUser,
  };
}

/**
 * Loads store settings from localStorage
 */
export function loadStoreSettings(): StoreSettings {
  const raw = safeGet(STORAGE_KEYS.SETTINGS);
  return safeParse<StoreSettings>(raw, DEFAULT_SETTINGS);
}

/**
 * Persists store settings to localStorage
 */
export function saveStoreSettings(settings: StoreSettings): void {
  safeSet(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Clears all test data in localStorage, keeping storage marked as initialized.
 */
export function clearAllStoredData(): void {
  safeSet(STORAGE_KEYS.INITIALIZED, 'true');
  safeSet(STORAGE_KEYS.PRODUCTS, []);
  safeSet(STORAGE_KEYS.MOVEMENTS, []);
  safeSet(STORAGE_KEYS.RESERVAS, []);
  safeSet(STORAGE_KEYS.PROMOTIONS, []);
  safeSet(STORAGE_KEYS.SUPPLIERS, []);
}

/**
 * Restores initial demo test data in localStorage.
 */
export function restoreAllDemoData(): void {
  safeSet(STORAGE_KEYS.INITIALIZED, 'true');
  safeSet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  safeSet(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  safeSet(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
  safeSet(STORAGE_KEYS.RESERVAS, INITIAL_RESERVAS);
  safeSet(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
  safeSet(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
}
