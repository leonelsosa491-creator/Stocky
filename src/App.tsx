import React, { useState, useMemo, useEffect } from 'react';
import {
  NavScreen,
  ProductItem,
  CategorySummary,
  StockMovement,
  Promotion,
  ReservaItem,
  Supplier,
  AppUser,
  UserRole,
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_MOVEMENTS,
  INITIAL_PROMOTIONS,
  INITIAL_RESERVAS,
  INITIAL_SUPPLIERS,
} from './data/mockData';
import {
  loadInitialAppData,
  safeSet,
  STORAGE_KEYS,
  clearAllStoredData,
  restoreAllDemoData,
} from './utils/storage';
// @ts-ignore
import { supabase } from './supabase/supabaseClient';
import {
  fetchMovimientos, fetchReservas, fetchPromociones, fetchProveedores,
  upsertMovimientos, upsertReservas, upsertPromociones, upsertProveedores,
  deleteReservas, deletePromociones, deleteProveedores, vaciarTablasBoutique, generarSufijoId, descontarStock,
} from './supabase/tablas';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ResumenView } from './components/ResumenView';
import { StockDetailView } from './components/StockDetailView';
import { LoginView } from './components/LoginView';
import { RecuperarClaveView } from './components/RecuperarClaveView';
import { ProductosView } from './components/ProductosView';
import { MovimientosView } from './components/MovimientosView';
import { ConfiguracionView } from './components/ConfiguracionView';
import { PromocionesView } from './components/PromocionesView';
import { PromocionModal } from './components/PromocionModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { NuevoIngresoModal } from './components/NuevoIngresoModal';
import { EditarStockModal } from './components/EditarStockModal';
import { CrearStockModal } from './components/CrearStockModal';
import { CargarProductoModal } from './components/CargarProductoModal';
import { RegistrarVentaModal } from './components/RegistrarVentaModal';
import { ReservasView } from './components/ReservasView';
import { NuevaReservaModal } from './components/NuevaReservaModal';
import { ProveedoresView } from './components/ProveedoresView';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { ReportesVentasView } from './components/ReportesVentasView';
import { ConfiguracionSistemaView } from './components/ConfiguracionSistemaView';
import { CheckCircle2 } from 'lucide-react';
import { useTour } from './context/TourContext';
import { ModalPresence } from './components/ModalPresence';

// Traductores
const mapDbToProduct = (row: any): ProductItem => ({
  sku: row.sku,
  name: row.name,
  description: row.description || '',
  category: row.category,
  colorName: row.color_name,
  colorFamily: row.color_family || undefined,
  specificColor: row.specific_color || undefined,
  colorHex: row.color_hex,
  size: row.size,
  season: row.season,
  stock: Number(row.stock),
  minStockThreshold: Number(row.min_stock_threshold ?? 10),
  locationFacility: row.location_facility,
  locationDetails: row.location_details || '',
  price: Number(row.price),
  cost: Number(row.cost),
  status: row.status as ProductItem['status'],
});

const mapProductToDb = (prod: ProductItem, boutiqueId: string) => ({
  boutique_id: boutiqueId,
  sku: prod.sku,
  name: prod.name,
  description: prod.description || '',
  category: prod.category,
  color_name: prod.colorName,
  color_family: prod.colorFamily || null,
  specific_color: prod.specificColor || null,
  color_hex: prod.colorHex,
  size: prod.size,
  season: prod.season,
  stock: prod.stock,
  min_stock_threshold: prod.minStockThreshold,
  location_facility: prod.locationFacility,
  location_details: prod.locationDetails || '',
  price: prod.price,
  cost: prod.cost,
  status: prod.status,
});

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifyTour } = useTour();
  const boutiqueId = user?.boutiqueId;

  const currentScreen = useMemo<NavScreen>(() => {
    const path = location.pathname;
    if (path.startsWith('/stock')) return 'stock';
    if (path.startsWith('/productos')) return 'productos';
    if (path.startsWith('/movimientos')) return 'movimientos';
    if (path.startsWith('/reservas')) return 'reservas';
    if (path.startsWith('/promociones')) return 'promociones';
    if (path.startsWith('/proveedores')) return 'proveedores';
    if (path.startsWith('/configuracion')) return 'configuracion';
    if (path.startsWith('/reportes-ventas')) return 'reportes'; 
    return 'resumen';
  }, [location.pathname]);

  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [initialData] = useState(() => loadInitialAppData());

  const [products, setProducts] = useState<ProductItem[]>(() => initialData.products);
  const [categoriesBase, setCategoriesBase] = useState<CategorySummary[]>(() => initialData.categoriesBase);
  const [movements, setMovements] = useState<StockMovement[]>(() => initialData.movements);
  const [promotions, setPromotions] = useState<Promotion[]>(() => initialData.promotions);
  const [reservas, setReservas] = useState<ReservaItem[]>(() => initialData.reservas);
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => initialData.suppliers);
  const [users, setUsers] = useState<AppUser[]>(() => initialData.users);
  const [currentUser, setCurrentUser] = useState<AppUser>(() => initialData.currentUser);

  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user]);

  // Cargar productos y categorías oficiales desde Supabase
  useEffect(() => {
    const fetchCoreData = async () => {
      if (!boutiqueId) return;

      // 1. Traer Productos (Filtrados por cuenta)
      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .eq('boutique_id', boutiqueId) // 🔒 FILTRO DE SEGURIDAD
        .order('created_at', { ascending: false });

      if (prodError) console.error('Error cargando productos:', prodError.message);
      const productosDescargados = (prodData || []).map(mapDbToProduct);
      setProducts(productosDescargados);

      // 2. Traer Categorías (Filtradas por cuenta)
      const { data: catData, error: catError } = await supabase
        .from('categorias')
        .select('*')
        .eq('boutique_id', boutiqueId) // 🔒 FILTRO DE SEGURIDAD
        .order('name', { ascending: true });

      if (catError) console.error('Error cargando categorias:', catError.message);
      
      const categoriasBD: CategorySummary[] = (catData || []).map((c: any) => ({
        name: c.name,
        totalItems: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        actionType: 'detalles',
        icon: c.icon || 'tshirt',
        description: c.description || `Categoría de ${c.name}`,
        facilityDefault: c.facility_default || 'Depósito Central',
      }));

      setCategoriesBase(categoriasBD);
    };

    fetchCoreData();
  }, [boutiqueId]);

  useEffect(() => {
    if (!boutiqueId) return;
    let cancelado = false;
    (async () => {
      const [movs, res, promos, provs] = await Promise.all([
        fetchMovimientos(), fetchReservas(), fetchPromociones(), fetchProveedores(),
      ]);
      if (cancelado) return;
      if (movs) setMovements(movs);
      if (res) setReservas(res);
      if (promos) setPromotions(promos);
      if (provs) setSuppliers(provs);
    })();
    return () => { cancelado = true; };
  }, [boutiqueId]);

  const registrarMovimientos = (nuevos: StockMovement[]) => {
    setMovements((prev) => [...nuevos, ...prev]);
    if (boutiqueId) upsertMovimientos(boutiqueId, nuevos);
  };

  const syncProductToSupabase = async (prod: ProductItem): Promise<ProductItem | null> => {
    if (!boutiqueId) return null;
    const { sku, ...restoDelObjeto } = mapProductToDb(prod, boutiqueId);
    const dbObj = sku ? { sku, ...restoDelObjeto } : restoDelObjeto; 

    const { data, error } = await supabase
      .from('productos')
      .upsert(dbObj, { onConflict: 'boutique_id,sku' })
      .select()
      .single();

    if (error) {
      console.error('Error guardando en Supabase:', error.message);
      return null;
    }
    return data ? mapDbToProduct(data) : null;
  };

  const syncBatchProductsToSupabase = async (batch: ProductItem[]): Promise<ProductItem[]> => {
    if (!boutiqueId || batch.length === 0) return [];
    const dbObjs = batch.map((p) => {
      const { sku, ...restoDelObjeto } = mapProductToDb(p, boutiqueId);
      return sku ? { sku, ...restoDelObjeto } : restoDelObjeto;
    });

    const { data, error } = await supabase
      .from('productos')
      .upsert(dbObjs, { onConflict: 'boutique_id,sku' })
      .select();

    if (error) {
      console.error('Error guardando lote en Supabase:', error.message);
      return [];
    }
    return data ? data.map(mapDbToProduct) : [];
  };

  const deleteProductFromSupabase = async (sku: string) => {
    if (!boutiqueId) return;
    const { error } = await supabase.from('productos').delete().eq('boutique_id', boutiqueId).eq('sku', sku);
    if (error) console.error('Error eliminando en Supabase:', error.message);
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    await supabase.from('productos').update({ category: newName }).eq('category', oldName);
    await supabase.from('categorias').update({ name: newName }).eq('name', oldName);
    setProducts((prev) => prev.map((prod) => prod.category === oldName ? { ...prod, category: newName } : prod));
    setCategoriesBase((prev) => prev.map((cat) => cat.name === oldName ? { ...cat, name: newName } : cat));
    showToast(`La categoría "${oldName}" ahora se llama "${newName}"`);
  };

  const handleDeleteCategory = async (categoryName: string) => {
    await supabase.from('productos').delete().eq('category', categoryName);
    await supabase.from('categorias').delete().eq('name', categoryName);
    setProducts((prev) => prev.filter((prod) => prod.category !== categoryName));
    setCategoriesBase((prev) => prev.filter((cat) => cat.name !== categoryName));
    showToast(`Se eliminó permanentemente la categoría "${categoryName}"`);
  };

  useEffect(() => { safeSet(STORAGE_KEYS.PRODUCTS, products); }, [products]);
  useEffect(() => { safeSet(STORAGE_KEYS.CATEGORIES, categoriesBase); }, [categoriesBase]);
  useEffect(() => { safeSet(STORAGE_KEYS.MOVEMENTS, movements); }, [movements]);
  useEffect(() => { safeSet(STORAGE_KEYS.PROMOTIONS, promotions); }, [promotions]);
  useEffect(() => { safeSet(STORAGE_KEYS.RESERVAS, reservas); }, [reservas]);
  useEffect(() => { safeSet(STORAGE_KEYS.SUPPLIERS, suppliers); }, [suppliers]);
  useEffect(() => { safeSet(STORAGE_KEYS.USERS, users); }, [users]);
  useEffect(() => { safeSet(STORAGE_KEYS.CURRENT_USER, currentUser); }, [currentUser]);

  const categories: CategorySummary[] = useMemo(() => {
    const baseMap = new Map<string, CategorySummary>(categoriesBase.map((c) => [c.name.toLowerCase(), c]));
    
    return categoriesBase.map((base) => {
      const name = base.name;
      const catProducts = products.filter((p) => p.category.toLowerCase() === name.toLowerCase());
      const totalUnits = catProducts.reduce((sum, p) => sum + p.stock, 0);
      const lowStockCount = catProducts.filter((p) => p.status === 'bajo' || (p.stock > 0 && p.stock <= p.minStockThreshold)).length;
      const outOfStockCount = catProducts.filter((p) => p.status === 'agotado' || p.stock === 0).length;

      return {
        name,
        totalItems: totalUnits,
        inStock: totalUnits,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        actionType: outOfStockCount > 0 ? 'revisar' : 'detalles',
        icon: base.icon || 'tshirt',
        description: base.description || `Categoría de ${name}`,
        facilityDefault: base.facilityDefault || 'Depósito Central',
      };
    });
  }, [categoriesBase, products]);

  const [isNuevoIngresoOpen, setIsNuevoIngresoOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isCrearStockOpen, setIsCrearStockOpen] = useState(false);
  const [isCargarProductoOpen, setIsCargarProductoOpen] = useState(false);
  const [categoryForCargar, setCategoryForCargar] = useState<string>('Buzos');
  const [cargarProductToEdit, setCargarProductToEdit] = useState<ProductItem | null>(null);
  const [productToReplenish, setProductToReplenish] = useState<ProductItem | null>(null);
  const [cargarModalInitialMode, setCargarModalInitialMode] = useState<'reponer' | 'nuevo'>('reponer');
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);
  const [isRegistrarVentaOpen, setIsRegistrarVentaOpen] = useState(false);
  const [isNuevaReservaOpen, setIsNuevaReservaOpen] = useState(false);
  const [productForVenta, setProductForVenta] = useState<ProductItem | null>(null);
  const [productForReserva, setProductForReserva] = useState<ProductItem | null>(null);
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'bajo' | 'agotado' | 'ok'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => { setToastMessage(null); }, 3000);
  };

  const handleOpenRegistrarVenta = (product?: ProductItem) => {
    if (products.length === 0) {
      showToast('⚠️ No hay prendas en el inventario para registrar ventas.');
      return;
    }
    setProductForVenta(product || null);
    setIsRegistrarVentaOpen(true);
  };

  const handleOpenNuevaReserva = (product?: ProductItem) => {
    if (products.length === 0) {
      showToast('⚠️ No hay prendas en el inventario para reservar.');
      return;
    }
    setProductForReserva(product || null);
    setIsNuevaReservaOpen(true);
  };

  const handleOpenCargarProducto = (category?: string, productToEdit?: ProductItem | null, initialMode: 'reponer' | 'nuevo' = 'reponer', itemToReplenish?: ProductItem | null) => {
    if (categoriesBase.length === 0) {
      showToast('⚠️ Aún debes crear una categoría (botón "+ Crear Categoría") para cargar prendas.');
      return;
    }
    const cat = category || (selectedCategory !== 'Todas' ? selectedCategory : categoriesBase[0]?.name || 'General');
    setCategoryForCargar(cat);
    setCargarProductToEdit(productToEdit || null);
    setProductToReplenish(itemToReplenish || null);
    setCargarModalInitialMode(initialMode);
    setIsCargarProductoOpen(true);
    if (initialMode === 'nuevo' && !productToEdit) notifyTour('cargar-prenda-abierto');
  };

  const handleOpenCrearStock = () => {
    setIsCrearStockOpen(true);
    notifyTour('crear-categoria-abierto');
  };

  const handleCloseCrearStock = () => {
    setIsCrearStockOpen(false);
    notifyTour('crear-categoria-cerrado');
  };

  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setStockStatusFilter('all');
    navigate('/stock');
  };

  const handleNavigateToStockWithStatus = (filter: 'all' | 'bajo' | 'agotado' | 'ok' = 'bajo', categoryName: string = 'Todas') => {
    setSelectedCategory(categoryName);
    setStockStatusFilter(filter);
    navigate('/stock');
  };

  const getMovementDateInfo = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const rawDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return { date: `Hoy, ${timeStr}`, rawDate };
  };

  const handleAddStock = (data: any) => {
    let updatedProducts = [...products];
    const existingIndex = updatedProducts.findIndex((p) => p.sku === data.sku);
    let targetProd: ProductItem;

    if (existingIndex >= 0) {
      const existing = updatedProducts[existingIndex];
      const newStock = existing.stock + data.quantity;
      let status: ProductItem['status'] = 'ok';
      if (newStock === 0) status = 'agotado';
      else if (newStock <= existing.minStockThreshold) status = 'bajo';

      targetProd = {
        ...existing,
        stock: newStock,
        status,
        locationFacility: data.locationFacility,
        locationDetails: data.locationDetails,
      };
      updatedProducts[existingIndex] = targetProd;
    } else {
      targetProd = {
        sku: data.sku,
        name: data.productName,
        description: `Confección ${data.supplier}`,
        category: data.category,
        colorName: data.colorName,
        colorHex: '#ef4444',
        size: data.size,
        season: 'Verano',
        stock: data.quantity,
        minStockThreshold: 10,
        locationFacility: data.locationFacility,
        locationDetails: data.locationDetails,
        price: 21000,
        cost: 9000,
        status: 'ok',
      };
      updatedProducts.unshift(targetProd);
    }

    setProducts(updatedProducts);
    syncProductToSupabase(targetProd);

    const dateInfo = getMovementDateInfo();
    const newMovement: StockMovement = {
      id: `MOV-${generarSufijoId()}`,
      date: dateInfo.date,
      rawDate: dateInfo.rawDate,
      sku: data.sku,
      productName: data.productName,
      type: 'ingreso',
      quantity: data.quantity,
      user: currentUser.name,
      sourceOrDestination: data.supplier,
      notes: data.notes || 'Ingreso de mercadería',
    };
    registrarMovimientos([newMovement]);
    showToast(`+${data.quantity} unidades ingresadas a ${data.productName}`);
  };

  const handleSaveProduct = (updated: ProductItem) => {
    setProducts((prev) => prev.map((p) => (p.sku === updated.sku ? updated : p)));
    syncProductToSupabase(updated);

    const original = products.find((p) => p.sku === updated.sku);
    if (original && original.stock !== updated.stock) {
      const diff = updated.stock - original.stock;
      const dateInfo = getMovementDateInfo();
      const newMovement: StockMovement = {
        id: `MOV-${generarSufijoId()}`,
        date: dateInfo.date,
        rawDate: dateInfo.rawDate,
        sku: updated.sku,
        productName: updated.name,
        type: 'ajuste',
        quantity: diff,
        user: currentUser.name,
        sourceOrDestination: updated.locationFacility,
        notes: 'Ajuste manual de stock',
      };
      registrarMovimientos([newMovement]);
    }
    showToast(`Stock actualizado para ${updated.sku}`);
  };

  const handleCreateStock = async (newCat: CategorySummary, initialProduct?: ProductItem) => {
    notifyTour(initialProduct ? 'categoria-creada-con-prenda' : 'categoria-creada');
    if (boutiqueId) {
      await supabase.from('categorias').upsert({
        boutique_id: boutiqueId,
        name: newCat.name,
        icon: newCat.icon,
        description: newCat.description,
        facility_default: newCat.facilityDefault
      });
    }

    setCategoriesBase((prev) => [...prev, newCat]);
    
    if (initialProduct) {
      const savedProd = await syncProductToSupabase(initialProduct);
      if (savedProd) {
        setProducts((prev) => [savedProd, ...prev]);

        const dateInfo = getMovementDateInfo();
        const newMovement: StockMovement = {
          id: `MOV-${generarSufijoId()}`,
          date: dateInfo.date,
          rawDate: dateInfo.rawDate,
          sku: savedProd.sku,
          productName: savedProd.name,
          type: 'ingreso',
          quantity: savedProd.stock,
          user: currentUser.name,
          sourceOrDestination: savedProd.locationFacility,
          notes: `Carga inicial de stock para ${newCat.name}`,
        };
        registrarMovimientos([newMovement]);
      }
    }
    setSelectedCategory(newCat.name);
    navigate('/stock');
    showToast(`Categoría "${newCat.name}" creada con éxito`);
  };

  const handleCreateCategoryInline = async (catName: string) => {
    const exists = categoriesBase.some((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (!exists && boutiqueId) {
      await supabase.from('categorias').upsert({
        boutique_id: boutiqueId,
        name: catName,
        icon: 'tshirt',
        description: `Categoría de ${catName}`,
        facility_default: 'Depósito Central'
      });
      setCategoriesBase((prev) => [...prev, { name: catName, totalItems: 0, inStock: 0, lowStock: 0, outOfStock: 0, actionType: 'detalles', icon: 'tshirt', description: `Categoría de ${catName}`, facilityDefault: 'Depósito Central' }]);
    }
  };

  const handleSaveCargarProducto = async (prod: ProductItem) => {
    if (!prod.sku) notifyTour('prenda-cargada');
    const isNew = !prod.sku;
    const savedProd = await syncProductToSupabase(prod);

    if (!savedProd) {
      showToast('❌ Error al guardar la prenda.');
      return;
    }

    if (isNew) {
      setProducts((prev) => [savedProd, ...prev]);
      const dateInfo = getMovementDateInfo();
      const newMovement: StockMovement = {
        id: `MOV-${generarSufijoId()}`,
        date: dateInfo.date,
        rawDate: dateInfo.rawDate,
        sku: savedProd.sku,
        productName: savedProd.name,
        type: 'ingreso',
        quantity: savedProd.stock,
        user: currentUser.name,
        sourceOrDestination: savedProd.locationFacility,
        notes: `Carga directa a stock de ${savedProd.category}`,
      };
      registrarMovimientos([newMovement]);
      showToast(`Prenda "${savedProd.name}" cargada al stock de ${savedProd.category}`);
    } else {
      setProducts((prev) => prev.map((p) => (p.sku === savedProd.sku || p.sku === prod.sku ? savedProd : p)));
      showToast(`Prenda "${savedProd.name}" (${savedProd.sku}) actualizada`);
    }
  };

  const handleSaveBatchProducts = async (batch: ProductItem[]) => {
    notifyTour('prenda-cargada');
    const savedBatch = await syncBatchProductsToSupabase(batch);

    if (savedBatch.length > 0) {
      setProducts((prev) => [...savedBatch, ...prev]);

      const totalQty = savedBatch.reduce((sum, p) => sum + p.stock, 0);
      const firstCat = savedBatch[0].category;
      const dateInfo = getMovementDateInfo();
      const newMovement: StockMovement = {
        id: `MOV-${generarSufijoId()}`,
        date: dateInfo.date,
        rawDate: dateInfo.rawDate,
        sku: savedBatch.map((b) => b.sku).join(', '),
        productName: `${savedBatch[0].name.split('(')[0].trim()} (Curva ${savedBatch.length} talles)`,
        type: 'ingreso',
        quantity: totalQty,
        user: currentUser.name,
        sourceOrDestination: savedBatch[0].locationFacility,
        notes: `Carga de curva de talles para ${firstCat}`,
      };
      registrarMovimientos([newMovement]);
      showToast(`${savedBatch.length} variantes (${totalQty} unidades) cargadas al stock`);
    } else {
      showToast('❌ Error al guardar la curva de talles.');
    }
  };

  const handleQuickReplenish = (product: ProductItem) => {
    handleOpenCargarProducto(product.category, null, 'reponer', product);
  };

  const handleReplenishStock = (data: any) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === data.sku) {
          const newStock = p.stock + data.quantity;
          let status: ProductItem['status'] = 'ok';
          if (newStock === 0) status = 'agotado';
          else if (newStock <= p.minStockThreshold) status = 'bajo';
          const updated = { ...p, stock: newStock, status, locationFacility: data.locationFacility || p.locationFacility };
          syncProductToSupabase(updated);
          return updated;
        }
        return p;
      })
    );
    const dateInfo = getMovementDateInfo();
    const newMovement: StockMovement = {
      id: `MOV-${generarSufijoId()}`,
      date: dateInfo.date,
      rawDate: dateInfo.rawDate,
      sku: data.sku,
      productName: data.productName,
      type: 'ingreso',
      quantity: data.quantity,
      user: currentUser.name,
      sourceOrDestination: data.locationFacility || 'Depósito Central',
      notes: `${data.notes || 'Reposición'} (${data.supplier || 'Taller Principal'})`,
    };
    registrarMovimientos([newMovement]);
    showToast(`+${data.quantity} unidades ingresadas a ${data.productName} (${data.sku})`);
  };

  const handleUpdateProductStock = (sku: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === sku) {
          const safeStock = Math.max(0, newStock);
          let status: ProductItem['status'] = 'ok';
          if (safeStock === 0) status = 'agotado';
          else if (safeStock <= p.minStockThreshold) status = 'bajo';
          const updated = { ...p, stock: safeStock, status };
          syncProductToSupabase(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const handleExport = () => {
    const headers = ['SKU', 'Producto', 'Categoría', 'Talle', 'Color', 'Temporada', 'Stock', 'Ubicación', 'Estado'];
    const rows = products.map((p) => [
      p.sku, `"${p.name}"`, p.category, p.size, p.colorName, p.season, p.stock, `"${p.locationFacility} ${p.locationDetails}"`, p.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const businessNameForFile = (user?.businessName?.trim() || 'Stocky').replace(/[<>:"/\\|?*]/g, '_');
    link.setAttribute('download', `Inventario_${businessNameForFile}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Archivo CSV exportado exitosamente');
  };

  const handleSavePromotion = (promo: Promotion) => {
    const exists = promotions.some((p) => p.id === promo.id);
    if (boutiqueId) upsertPromociones(boutiqueId, [promo]);
    if (exists) {
      setPromotions((prev) => prev.map((p) => (p.id === promo.id ? promo : p)));
      showToast(`Promoción "${promo.title}" modificada con éxito`);
    } else {
      setPromotions((prev) => [promo, ...prev]);
      showToast(`Promoción "${promo.title}" creada con éxito`);
    }
  };

  const handleDeletePromotionConfirm = () => {
    if (!deletingPromotion) return;
    const title = deletingPromotion.title;
    const promoId = deletingPromotion.id;
    setPromotions((prev) => prev.filter((p) => p.id !== promoId));
    if (boutiqueId) deletePromociones(boutiqueId, [promoId]);
    showToast(`Promoción "${title}" eliminada del sistema`);
    setDeletingPromotion(null);
  };

  const handleTogglePromotionStatus = (promoId: string) => {
    const target = promotions.find((p) => p.id === promoId);
    if (!target) return;
    const newStatus: Promotion['status'] = target.status === 'activa' ? 'pausada' : 'activa';
    const updated: Promotion = { ...target, status: newStatus };
    setPromotions((prev) => prev.map((p) => (p.id === promoId ? updated : p)));
    if (boutiqueId) upsertPromociones(boutiqueId, [updated]);
    showToast(`Promoción "${target.title}" ahora está ${newStatus}`);
  };

  const handleConfirmSale = (saleData: any) => {
    const soldSkuMap = new Map<string, number>();
    saleData.items.forEach((item: any) => { soldSkuMap.set(item.sku, (soldSkuMap.get(item.sku) || 0) + item.quantity); });
    
    const updatedProducts = products.map((prod) => {
      const soldQty = soldSkuMap.get(prod.sku);
      if (soldQty) {
        const newStock = Math.max(0, prod.stock - soldQty);
        let status: ProductItem['status'] = 'ok';
        if (newStock === 0) status = 'agotado';
        else if (newStock <= prod.minStockThreshold) status = 'bajo';
        const updated = { ...prod, stock: newStock, status };
        return updated;
      }
      return prod;
    });
    setProducts(updatedProducts);
    descontarStock(Array.from(soldSkuMap, ([sku, cantidad]) => ({ sku, cantidad })));

    const dateInfo = getMovementDateInfo();
    const newMovements: StockMovement[] = saleData.items.map((item: any, idx: number) => ({
      id: `MOV-VTA-${generarSufijoId()}-${idx}`,
      date: dateInfo.date,
      rawDate: dateInfo.rawDate,
      sku: item.sku,
      productName: item.productName,
      type: 'egreso',
      quantity: -item.quantity,
      user: currentUser.name,
      sourceOrDestination: `${saleData.channel} #${saleData.ticketNumber}`,
      notes: `${saleData.paymentDetails || `Venta con ${saleData.paymentMethod}`} • Cliente: ${saleData.customerName}${saleData.customerPhone ? ` (Tel/WA: ${saleData.customerPhone})` : ''}${saleData.saleNotes ? ` • Nota: ${saleData.saleNotes}` : ''} ($${item.subtotal.toLocaleString('es-AR')})`,
    }));
    registrarMovimientos(newMovements);
    showToast(`¡Venta registrada! -${saleData.totalUnits} prendas descontadas del stock`);
  };

  const handleCreateReserva = (reservaData: any) => {
    const nextNum = Math.max(103, ...reservas.map((r) => parseInt(r.id.replace(/\D/g, ''), 10) || 0)) + 1;
    const newRes: ReservaItem = { ...reservaData, id: `RES-${nextNum}`, code: `#RES-${nextNum}`, status: 'activa', createdAt: new Date().toISOString().slice(0, 10) };
    setProducts((prev) => prev.map((p) => {
      if (p.sku === reservaData.garmentSku) {
        const nextStock = Math.max(0, p.stock - reservaData.quantity);
        const updated: ProductItem = { ...p, stock: nextStock, status: nextStock === 0 ? 'agotado' : nextStock <= p.minStockThreshold ? 'bajo' : 'ok' };
        return updated;
      }
      return p;
    }));
    descontarStock([{ sku: reservaData.garmentSku, cantidad: reservaData.quantity }]);
    const dateInfo = getMovementDateInfo();
    const newMov: StockMovement = {
      id: `MOV-RES-${generarSufijoId()}`,
      date: dateInfo.date,
      rawDate: dateInfo.rawDate,
      sku: reservaData.garmentSku,
      productName: reservaData.garmentName,
      type: 'egreso',
      quantity: -reservaData.quantity,
      user: currentUser.name,
      sourceOrDestination: `Reserva ${newRes.code} (Seña: $${reservaData.depositAmount.toLocaleString('es-AR')})`,
      notes: `Prenda apartada para ${reservaData.customerName} (Seña pagada con ${reservaData.depositPaymentMethod}). Resta saldo: $${reservaData.pendingBalance.toLocaleString('es-AR')}`,
    };
    registrarMovimientos([newMov]);
    setReservas((prev) => [newRes, ...prev]);
    if (boutiqueId) upsertReservas(boutiqueId, [newRes]);
    showToast(`¡Reserva ${newRes.code} creada! Seña de $${reservaData.depositAmount.toLocaleString('es-AR')} registrada.`);
  };

  const handleMarkReservaRetired = (reservaId: string, balancePaymentMethod: string) => {
    const target = reservas.find((r) => r.id === reservaId);
    if (!target) return;
    const nowStr = new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const retirada: ReservaItem = { ...target, status: 'retirada', pendingBalance: 0, pickedUpAt: nowStr, balancePaymentMethod: balancePaymentMethod as any };
    setReservas((prev) => prev.map((r) => (r.id === reservaId ? retirada : r)));
    if (boutiqueId) upsertReservas(boutiqueId, [retirada]);
    showToast(`¡Prenda retirada! Saldo de $${target.pendingBalance.toLocaleString('es-AR')} cobrado (${balancePaymentMethod}).`);
  };

  const handleDeleteReserva = (reservaId: string) => {
    const target = reservas.find((r) => r.id === reservaId);
    if (!target) return;
    if (target.status === 'activa') {
      setProducts((prev) => prev.map((p) => {
        if (p.sku === target.garmentSku) {
          const nextStock = p.stock + target.quantity;
          const updated: ProductItem = { ...p, stock: nextStock, status: nextStock <= p.minStockThreshold ? 'bajo' : 'ok' };
          syncProductToSupabase(updated);
          return updated;
        }
        return p;
      }));
      showToast(`Reserva ${target.code} eliminada. La prenda volvió al stock de salón.`);
    } else {
      showToast(`Reserva ${target.code} eliminada del registro.`);
    }
    setReservas((prev) => prev.filter((r) => r.id !== reservaId));
    if (boutiqueId) deleteReservas(boutiqueId, [reservaId]);
  };

  const handleClearCaducadas = () => {
    const caducadas = reservas.filter((r) => r.status === 'caducada');
    if (caducadas.length === 0) { showToast('No hay reservas caducadas para eliminar.'); return; }
    setProducts((prev) => prev.map((p) => {
      const itemCaducado = caducadas.find((c) => c.garmentSku === p.sku);
      if (itemCaducado) {
        const nextStock = p.stock + itemCaducado.quantity;
        const updated: ProductItem = { ...p, stock: nextStock, status: nextStock <= p.minStockThreshold ? 'bajo' : 'ok' };
        syncProductToSupabase(updated);
        return updated;
      }
      return p;
    }));
    setReservas((prev) => prev.filter((r) => r.status !== 'caducada'));
    if (boutiqueId) deleteReservas(boutiqueId, caducadas.map((c) => c.id));
    showToast(`${caducadas.length} reservas caducadas eliminadas y prendas devueltas al perchero.`);
  };

  const handleAddSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const nextNum = Math.max(0, ...suppliers.map((s) => parseInt(s.id.replace(/\D/g, ''), 10) || 0)) + 1;
    const nuevo: Supplier = { ...supplierData, id: `SUP-${String(nextNum).padStart(2, '0')}` };
    setSuppliers((prev) => [...prev, nuevo]);
    if (boutiqueId) upsertProveedores(boutiqueId, [nuevo]);
    showToast(`¡Proveedor "${supplierData.name}" agregado con éxito!`);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? supplier : s)));
    if (boutiqueId) upsertProveedores(boutiqueId, [supplier]);
    showToast(`¡Proveedor "${supplier.name}" actualizado!`);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const found = suppliers.find((s) => s.id === supplierId);
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    if (boutiqueId) deleteProveedores(boutiqueId, [supplierId]);
    showToast(`Proveedor "${found?.name || supplierId}" eliminado.`);
  };

  const handleSwitchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) { setCurrentUser(target); showToast(`Sesión cambiada a: ${target.name} (${target.role})`); }
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    if (currentUser.id === userId) { setCurrentUser((prev) => ({ ...prev, role: newRole })); }
    showToast(`Rol actualizado a "${newRole}" con éxito.`);
  };

  const handleAddUser = (userData: Omit<AppUser, 'id'>) => {
    const newUsr: AppUser = { ...userData, id: `USR-0${users.length + 1}` };
    setUsers((prev) => [...prev, newUsr]);
    showToast(`¡Usuario "${newUsr.name}" creado con rol ${newUsr.role}!`);
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(`Usuario "${target?.name || userId}" eliminado.`);
  };

  const handleDeleteProduct = (sku: string) => {
    const target = products.find((p) => p.sku === sku);
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
    deleteProductFromSupabase(sku);
    showToast(`Prenda "${target?.name || sku}" eliminada del inventario.`);
  };

  const handleClearAllTestData = async () => {
    clearAllStoredData();
    setProducts([]); 
    setCategoriesBase([]); 
    setSelectedCategory('Todas'); // 👉 ¡Agregá esta línea!
    setMovements([]); 
    setReservas([]); 
    setPromotions([]); 
    setSuppliers([]);
    setEditingProduct(null); 
    setProductForVenta(null); 
    setProductForReserva(null);
    
    if (boutiqueId) {
      await vaciarTablasBoutique(boutiqueId);
    }
    showToast('Base de datos vaciada: Se eliminaron prendas, categorías, movimientos y reservas.');
  };

  return (
    <>
      <Routes>
        <Route path="/recuperar-clave" element={<RecuperarClaveView />} />
        <Route path="/login" element={<LoginView onLoginSuccess={(name) => { showToast(`¡Bienvenida, ${name}!`); }} onBackToApp={() => navigate('/dashboard')} />} />
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex font-body selection:bg-[#42308f]/20 selection:text-[#42308f]">
                <Sidebar
                  currentScreen={currentScreen}
                  onNavigate={(screen) => {
                    if (screen === 'stock' && currentScreen !== 'stock') { setStockStatusFilter('all'); }
                    const routeMap: Record<NavScreen, string> = { resumen: '/dashboard', stock: '/stock', productos: '/productos', movimientos: '/movimientos', reservas: '/reservas', promociones: '/promociones', proveedores: '/proveedores', configuracion: '/configuracion', login: '/login', reportes: '/reportes-ventas' };
                    navigate(routeMap[screen] || '/dashboard');
                  }}
                  isOpenMobile={isMobileSidebarOpen}
                  onCloseMobile={() => setIsMobileSidebarOpen(false)}
                  isLoggedIn={true}
                  onOpenLogin={() => navigate('/login')}
                  onCollapseChange={setIsSidebarCollapsed}
                />
                <div className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-[88px]' : 'md:ml-[270px]'}`}>
                  <Header
                    onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    currentScreen={currentScreen}
                    onNavigate={(screen) => {
                      const routeMap: Record<NavScreen, string> = { resumen: '/dashboard', stock: '/stock', productos: '/productos', movimientos: '/movimientos', reservas: '/reservas', promociones: '/promociones', proveedores: '/proveedores', configuracion: '/configuracion', login: '/login', reportes: '/reportes-ventas' };
                      navigate(routeMap[screen] || '/dashboard');
                    }}
                    onOpenLogin={() => navigate('/login')}
                    isLoggedIn={true}
                    onLogout={async () => { await logout(); navigate('/login'); }}
                    onOpenRegistrarVenta={() => handleOpenRegistrarVenta()}
                    currentUser={currentUser}
                  />
                  <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"><Outlet /></main>
                </div>
                <ModalPresence show={isNuevoIngresoOpen}><NuevoIngresoModal isOpen={isNuevoIngresoOpen} onClose={() => setIsNuevoIngresoOpen(false)} products={products} categories={categories.map((c) => c.name)} onAddStock={handleAddStock} /></ModalPresence>
                <ModalPresence show={isCrearStockOpen}><CrearStockModal isOpen={isCrearStockOpen} onClose={handleCloseCrearStock} existingCategoryNames={categories.map((c) => c.name)} onCreateStock={handleCreateStock} /></ModalPresence>
                <ModalPresence show={isCargarProductoOpen}><CargarProductoModal isOpen={isCargarProductoOpen} onClose={() => { setIsCargarProductoOpen(false); setCargarProductToEdit(null); setProductToReplenish(null); notifyTour('cargar-prenda-cerrado'); }} products={products} categories={categories.map((c) => c.name)} defaultCategory={categoryForCargar || (selectedCategory !== 'Todas' ? selectedCategory : 'Buzos')} onSaveProduct={handleSaveCargarProducto} onSaveBatchProducts={handleSaveBatchProducts} onReplenishProduct={handleReplenishStock} productToEdit={cargarProductToEdit} productToReplenish={productToReplenish} initialMode={cargarModalInitialMode} onCreateCategory={handleCreateCategoryInline} /></ModalPresence>
                <ModalPresence show={isRegistrarVentaOpen}><RegistrarVentaModal isOpen={isRegistrarVentaOpen} onClose={() => { setIsRegistrarVentaOpen(false); setProductForVenta(null); }} products={products} promotions={promotions} initialProduct={productForVenta} onConfirmSale={handleConfirmSale} /></ModalPresence>
                <ModalPresence show={Boolean(editingProduct)}><EditarStockModal isOpen={Boolean(editingProduct)} onClose={() => setEditingProduct(null)} product={editingProduct} onSaveProduct={handleSaveProduct} /></ModalPresence>
                <ModalPresence show={isPromotionModalOpen}><PromocionModal isOpen={isPromotionModalOpen} onClose={() => { setIsPromotionModalOpen(false); setEditingPromotion(null); }} onSave={handleSavePromotion} promotionToEdit={editingPromotion} products={products} /></ModalPresence>
                <ModalPresence show={isNuevaReservaOpen}><NuevaReservaModal isOpen={isNuevaReservaOpen} onClose={() => { setIsNuevaReservaOpen(false); setProductForReserva(null); }} products={products} onCreateReserva={handleCreateReserva} initialProduct={productForReserva} /></ModalPresence>
                <ModalPresence show={Boolean(deletingPromotion)}><ConfirmDeleteModal isOpen={Boolean(deletingPromotion)} onClose={() => setDeletingPromotion(null)} onConfirm={handleDeletePromotionConfirm} title="Eliminar Promoción" itemName={deletingPromotion?.title || ''} itemDetail={deletingPromotion ? `Beneficio: ${deletingPromotion.discountType === 'porcentaje' ? `${deletingPromotion.discountValue}% OFF` : deletingPromotion.discountType === 'monto_fijo' ? `$${deletingPromotion.discountValue.toLocaleString('es-AR')} OFF` : '2x1'} • Días: ${deletingPromotion.dayOfWeek || 'Sábados'}` : undefined} /></ModalPresence>
                {toastMessage && (
                  <div className="fixed bottom-6 right-6 z-50 bg-[#0b1c30] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold">{toastMessage}</span>
                  </div>
                )}
              </div>
            }
          >
            <Route element={<RoleRoute allowedRoles={['developer', 'admin', 'vendedora']} />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ResumenView categories={categories} products={products} movements={movements} onSelectCategory={handleSelectCategory} onOpenNuevoIngreso={() => setIsNuevoIngresoOpen(true)} onOpenCrearStock={handleOpenCrearStock} onOpenRegistrarVenta={() => handleOpenRegistrarVenta()} onNavigateToLowStock={() => handleNavigateToStockWithStatus('bajo', 'Todas')} onNavigateToOutOfStock={() => handleNavigateToStockWithStatus('agotado', 'Todas')} onSelectCategoryWithFilter={(catName, filter) => handleNavigateToStockWithStatus(filter, catName)} onExport={handleExport} />} />
              <Route path="/stock" element={
                <StockDetailView 
                  products={products} 
                  categories={categories} 
                  selectedCategory={selectedCategory} 
                  promotions={promotions} 
                  initialStatusFilter={stockStatusFilter} 
                  onStatusFilterChange={setStockStatusFilter} 
                  onNavigateToCategory={(cat) => setSelectedCategory(cat)} 
                  onNavigateToResumen={() => navigate('/dashboard')} 
                  onOpenCrearStock={handleOpenCrearStock} 
                  onOpenCargarProducto={(cat, prod, mode) => handleOpenCargarProducto(cat, prod, mode || 'reponer')} 
                  onQuickReplenish={handleQuickReplenish} 
                  onOpenRegistrarVenta={(prod) => handleOpenRegistrarVenta(prod)} 
                  onOpenReserva={handleOpenNuevaReserva} 
                  onEditStock={(p) => { if (p) { handleOpenCargarProducto(p.category, p, 'nuevo'); } else { handleOpenCargarProducto(selectedCategory !== 'Todas' ? selectedCategory : 'Buzos', null, 'reponer'); } }} 
                  onExport={handleExport} 
                  onUpdateProductStock={handleUpdateProductStock} 
                  onDeleteProduct={handleDeleteProduct} 
                  onRenameCategory={handleRenameCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              } />
              <Route path="/productos" element={<ProductosView products={products} onSelectProduct={(p) => { setSelectedCategory(p.category); setEditingProduct(p); navigate('/stock'); }} onOpenNuevoIngreso={() => setIsNuevoIngresoOpen(true)} onOpenRegistrarVenta={(prod) => handleOpenRegistrarVenta(prod)} onDeleteProduct={handleDeleteProduct} />} />
              <Route path="/movimientos" element={<MovimientosView movements={movements} />} />
              <Route path="/reservas" element={<ReservasView reservas={reservas} products={products} onOpenNuevaReserva={() => handleOpenNuevaReserva()} onMarcarRetirada={handleMarkReservaRetired} onEliminarReserva={handleDeleteReserva} onEliminarCaducadas={handleClearCaducadas} onNavigateToStock={() => navigate('/stock')} />} />
              <Route path="/promociones" element={<PromocionesView promotions={promotions} products={products} onCreatePromotion={() => { setEditingPromotion(null); setIsPromotionModalOpen(true); }} onEditPromotion={(promo) => { setEditingPromotion(promo); setIsPromotionModalOpen(true); }} onDeletePromotion={(promo) => setDeletingPromotion(promo)} onToggleStatus={handleTogglePromotionStatus} onNavigateToStock={() => navigate('/stock')} onSelectProductForStock={(category, sku) => { if (category && category !== 'Todas') { setSelectedCategory(category); } navigate('/stock'); if (sku) { const targetProd = products.find((p) => p.sku === sku); if (targetProd) { setEditingProduct(targetProd); } } }} />} />
              <Route path="/proveedores" element={<ProveedoresView suppliers={suppliers} onAddSupplier={handleAddSupplier} onEditSupplier={handleEditSupplier} onDeleteSupplier={handleDeleteSupplier} />} />
              <Route path="/configuracion" element={<ConfiguracionView users={users} currentUser={currentUser} onSwitchUser={handleSwitchUser} onUpdateUserRole={handleUpdateUserRole} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} onClearAllTestData={handleClearAllTestData} />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={['developer', 'admin']} />}><Route path="/reportes-ventas" element={<ReportesVentasView />} /></Route>
            <Route element={<RoleRoute allowedRoles={['developer']} />}><Route path="/configuracion-sistema" element={<ConfiguracionSistemaView onClearDatabase={handleClearAllTestData} />} /></Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}