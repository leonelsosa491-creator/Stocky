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
  INITIAL_USERS,
} from './data/mockData';
import {
  loadInitialAppData,
  safeSet,
  STORAGE_KEYS,
  clearAllStoredData,
  restoreAllDemoData,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ResumenView } from './components/ResumenView';
import { StockDetailView } from './components/StockDetailView';
import { LoginView } from './components/LoginView';
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
import { Can } from './components/auth/Can';
import { ReportesVentasView } from './components/ReportesVentasView';
import { ConfiguracionSistemaView } from './components/ConfiguracionSistemaView';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout, loginWithRole, isAuthenticated } = useAuth();

  const currentScreen = useMemo<NavScreen>(() => {
    const path = location.pathname;
    if (path.startsWith('/stock')) return 'stock';
    if (path.startsWith('/productos')) return 'productos';
    if (path.startsWith('/movimientos')) return 'movimientos';
    if (path.startsWith('/reservas')) return 'reservas';
    if (path.startsWith('/promociones')) return 'promociones';
    if (path.startsWith('/proveedores')) return 'proveedores';
    if (path.startsWith('/configuracion')) return 'configuracion';
    if (path.startsWith('/reportes-ventas')) return 'resumen';
    return 'resumen';
  }, [location.pathname]);

  const [selectedCategory, setSelectedCategory] = useState<string>('Buzos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // App data state loaded from persistent storage
  const [initialData] = useState(() => loadInitialAppData());

  const [products, setProducts] = useState<ProductItem[]>(() => initialData.products);
  const [categoriesBase, setCategoriesBase] = useState<CategorySummary[]>(() => initialData.categoriesBase);
  const [movements, setMovements] = useState<StockMovement[]>(() => initialData.movements);
  const [promotions, setPromotions] = useState<Promotion[]>(() => initialData.promotions);
  const [reservas, setReservas] = useState<ReservaItem[]>(() => initialData.reservas);
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => initialData.suppliers);
  const [users, setUsers] = useState<AppUser[]>(() => initialData.users);
  const [currentUser, setCurrentUser] = useState<AppUser>(() => initialData.currentUser);

  // Synchronize state changes automatically to persistent localStorage
  useEffect(() => {
    safeSet(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.CATEGORIES, categoriesBase);
  }, [categoriesBase]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.MOVEMENTS, movements);
  }, [movements]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.PROMOTIONS, promotions);
  }, [promotions]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.RESERVAS, reservas);
  }, [reservas]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.SUPPLIERS, suppliers);
  }, [suppliers]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    safeSet(STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  // Dynamic categories computed directly from products (100% synchronized with inventory)
  const categories: CategorySummary[] = useMemo(() => {
    const baseMap = new Map<string, CategorySummary>(categoriesBase.map((c) => [c.name.toLowerCase(), c]));
    const allNames = Array.from(
      new Set([
        ...categoriesBase.map((c) => c.name),
        ...products.map((p) => p.category).filter(Boolean),
      ])
    );

    return allNames.map((name) => {
      const base = baseMap.get(name.toLowerCase());
      const catProducts = products.filter(
        (p) => p.category.toLowerCase() === name.toLowerCase()
      );
      const totalUnits = catProducts.reduce((sum, p) => sum + p.stock, 0);
      const lowStockCount = catProducts.filter(
        (p) => p.status === 'bajo' || (p.stock > 0 && p.stock <= p.minStockThreshold)
      ).length;
      const outOfStockCount = catProducts.filter(
        (p) => p.status === 'agotado' || p.stock === 0
      ).length;

      return {
        name,
        totalItems: totalUnits,
        inStock: totalUnits,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        actionType: outOfStockCount > 0 ? 'revisar' : 'detalles',
        icon: base?.icon || 'tshirt',
        description: base?.description || `Colección de ${name}`,
        facilityDefault: base?.facilityDefault || 'Depósito Central',
      };
    });
  }, [categoriesBase, products]);

  // Modals state
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
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenRegistrarVenta = (product?: ProductItem) => {
    setProductForVenta(product || null);
    setIsRegistrarVentaOpen(true);
  };

  const handleOpenNuevaReserva = (product?: ProductItem) => {
    setProductForReserva(product || null);
    setIsNuevaReservaOpen(true);
  };

  // Switch to Stock Detail view for a specific category
  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setStockStatusFilter('all');
    navigate('/stock');
  };

  // Switch to Stock Detail view filtered by status (e.g. low stock)
  const handleNavigateToStockWithStatus = (
    filter: 'all' | 'bajo' | 'agotado' | 'ok' = 'bajo',
    categoryName: string = 'Todas'
  ) => {
    setSelectedCategory(categoryName);
    setStockStatusFilter(filter);
    navigate('/stock');
    if (filter === 'bajo') {
      showToast('Mostrando prendas con stock bajo');
    } else if (filter === 'agotado') {
      showToast('Mostrando prendas agotadas');
    }
  };

  // Helper to get standard date and rawDate for movements
  const getMovementDateInfo = () => {
    const now = new Date();
    const rawDate = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return {
      date: `Hoy, ${timeStr}`,
      rawDate,
    };
  };

  // Add stock movement & update product
  const handleAddStock = (data: {
    sku: string;
    productName: string;
    category: ProductItem['category'];
    quantity: number;
    colorName: string;
    size: ProductItem['size'];
    locationFacility: string;
    locationDetails: string;
    supplier: string;
    notes: string;
  }) => {
    // 1. Update or create product
    let updatedProducts = [...products];
    const existingIndex = updatedProducts.findIndex((p) => p.sku === data.sku);

    if (existingIndex >= 0) {
      const existing = updatedProducts[existingIndex];
      const newStock = existing.stock + data.quantity;
      let status: ProductItem['status'] = 'ok';
      if (newStock === 0) status = 'agotado';
      else if (newStock <= existing.minStockThreshold) status = 'bajo';

      updatedProducts[existingIndex] = {
        ...existing,
        stock: newStock,
        status,
        locationFacility: data.locationFacility,
        locationDetails: data.locationDetails,
      };
    } else {
      updatedProducts.unshift({
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
      });
    }

    setProducts(updatedProducts);

    // 2. Add to movements log
    const dateInfo = getMovementDateInfo();
    const newMovement: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      date: dateInfo.date,
      rawDate: dateInfo.rawDate,
      sku: data.sku,
      productName: data.productName,
      type: 'ingreso',
      quantity: data.quantity,
      user: 'Melina Gomez',
      sourceOrDestination: data.supplier,
      notes: data.notes || 'Ingreso de mercadería',
    };
    setMovements([newMovement, ...movements]);

    // 3. Category totals are automatically synchronized via useMemo
    showToast(`+${data.quantity} unidades ingresadas a ${data.productName}`);
  };

  // Save edited product
  const handleSaveProduct = (updated: ProductItem) => {
    setProducts((prev) => prev.map((p) => (p.sku === updated.sku ? updated : p)));

    // Record adjustment movement if stock changed
    const original = products.find((p) => p.sku === updated.sku);
    if (original && original.stock !== updated.stock) {
      const diff = updated.stock - original.stock;
      const dateInfo = getMovementDateInfo();
      const newMovement: StockMovement = {
        id: `MOV-${Date.now().toString().slice(-4)}`,
        date: dateInfo.date,
        rawDate: dateInfo.rawDate,
        sku: updated.sku,
        productName: updated.name,
        type: 'ajuste',
        quantity: diff,
        user: 'Melina Gomez',
        sourceOrDestination: updated.locationFacility,
        notes: 'Ajuste manual de stock',
      };
      setMovements((m) => [newMovement, ...m]);
    }

    showToast(`Stock actualizado para ${updated.sku}`);
  };

  // Quick inline stock counter adjustment
  const handleUpdateProductStock = (sku: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === sku) {
          const safeStock = Math.max(0, newStock);
          let status: ProductItem['status'] = 'ok';
          if (safeStock === 0) status = 'agotado';
          else if (safeStock <= p.minStockThreshold) status = 'bajo';
          return { ...p, stock: safeStock, status };
        }
        return p;
      })
    );
  };

  // Export CSV
  const handleExport = () => {
    const headers = ['SKU', 'Producto', 'Categoría', 'Talle', 'Color', 'Temporada', 'Stock', 'Ubicación', 'Estado'];
    const rows = products.map((p) => [
      p.sku,
      `"${p.name}"`,
      p.category,
      p.size,
      p.colorName,
      p.season,
      p.stock,
      `"${p.locationFacility} ${p.locationDetails}"`,
      p.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventario_Aries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Archivo CSV exportado exitosamente');
  };

  // Promotions handlers (Crear, Modificar, Borrar, Alternar)
  const handleSavePromotion = (promo: Promotion) => {
    const exists = promotions.some((p) => p.id === promo.id);
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
    setPromotions((prev) => prev.filter((p) => p.id !== deletingPromotion.id));
    showToast(`Promoción "${title}" eliminada del sistema`);
    setDeletingPromotion(null);
  };

  const handleTogglePromotionStatus = (promoId: string) => {
    setPromotions((prev) =>
      prev.map((p) => {
        if (p.id === promoId) {
          const newStatus = p.status === 'activa' ? 'pausada' : 'activa';
          showToast(`Promoción "${p.title}" ahora está ${newStatus}`);
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  // Dynamic stock handlers
  const handleOpenCrearStock = () => {
    setIsCrearStockOpen(true);
  };

  const handleCreateStock = (newCat: CategorySummary, initialProduct?: ProductItem) => {
    setCategoriesBase((prev) => [...prev, newCat]);
    if (initialProduct) {
      setProducts((prev) => [initialProduct, ...prev]);
      const dateInfo = getMovementDateInfo();
      const newMovement: StockMovement = {
        id: `MOV-${Date.now().toString().slice(-4)}`,
        date: dateInfo.date,
        rawDate: dateInfo.rawDate,
        sku: initialProduct.sku,
        productName: initialProduct.name,
        type: 'ingreso',
        quantity: initialProduct.stock,
        user: 'Melina Gomez',
        sourceOrDestination: initialProduct.locationFacility,
        notes: `Carga inicial de stock para ${newCat.name}`,
      };
      setMovements((prev) => [newMovement, ...prev]);
    }
    setSelectedCategory(newCat.name);
    navigate('/stock');
    showToast(`Stock de "${newCat.name}" creado con éxito`);
  };

  const handleOpenCargarProducto = (
    category?: string,
    productToEdit?: ProductItem | null,
    initialMode: 'reponer' | 'nuevo' = 'reponer',
    itemToReplenish?: ProductItem | null
  ) => {
    const cat = category || (selectedCategory !== 'Todas' ? selectedCategory : 'Buzos');
    setCategoryForCargar(cat);
    setCargarProductToEdit(productToEdit || null);
    setProductToReplenish(itemToReplenish || null);
    setCargarModalInitialMode(initialMode);
    setIsCargarProductoOpen(true);
  };

  const handleQuickReplenish = (product: ProductItem) => {
    handleOpenCargarProducto(product.category, null, 'reponer', product);
  };

  const handleReplenishStock = (data: {
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
  }) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === data.sku) {
          const newStock = p.stock + data.quantity;
          let status: ProductItem['status'] = 'ok';
          if (newStock === 0) status = 'agotado';
          else if (newStock <= p.minStockThreshold) status = 'bajo';
          return {
            ...p,
            stock: newStock,
            status,
            locationFacility: data.locationFacility || p.locationFacility,
          };
        }
        return p;
      })
    );

    const dateInfo = getMovementDateInfo();
    const newMovement: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      date: dateInfo.date,
      rawDate: dateInfo.rawDate,
      sku: data.sku,
      productName: data.productName,
      type: 'ingreso',
      quantity: data.quantity,
      user: 'Melina Gomez',
      sourceOrDestination: data.locationFacility || 'Depósito Central',
      notes: `${data.notes || 'Reposición'} (${data.supplier || 'Taller Principal'})`,
    };
    setMovements((prev) => [newMovement, ...prev]);

    showToast(`+${data.quantity} unidades ingresadas a ${data.productName} (${data.sku})`);
  };

  const handleSaveBatchProducts = (batch: ProductItem[]) => {
    setProducts((prev) => [...batch, ...prev]);
    const totalQty = batch.reduce((sum, p) => sum + p.stock, 0);
    const firstCat = batch[0].category;

    const dateInfo = getMovementDateInfo();
    const newMovement: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      date: dateInfo.date,
      rawDate: dateInfo.rawDate,
      sku: batch.map((b) => b.sku).join(', '),
      productName: `${batch[0].name.split('(')[0].trim()} (Curva ${batch.length} talles)`,
      type: 'ingreso',
      quantity: totalQty,
      user: 'Melina Gomez',
      sourceOrDestination: batch[0].locationFacility,
      notes: `Carga de curva de talles para ${firstCat}`,
    };
    setMovements((prev) => [newMovement, ...prev]);

    showToast(`${batch.length} variantes (${totalQty} unidades) cargadas al stock`);
  };

  const handleCreateCategoryInline = (catName: string) => {
    const exists = categories.some((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (!exists) {
      const newCat: CategorySummary = {
        name: catName,
        totalItems: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        actionType: 'detalles',
        icon: 'tshirt',
        description: `Colección de ${catName}`,
        facilityDefault: 'Depósito Central',
      };
      setCategoriesBase((prev) => [...prev, newCat]);
    }
  };

  const handleSaveCargarProducto = (prod: ProductItem) => {
    const existingIndex = products.findIndex((p) => p.sku === prod.sku);
    if (existingIndex >= 0) {
      setProducts((prev) => prev.map((p) => (p.sku === prod.sku ? prod : p)));
      showToast(`Prenda "${prod.name}" (${prod.sku}) actualizada`);
    } else {
      setProducts((prev) => [prod, ...prev]);
      const dateInfo = getMovementDateInfo();
      const newMovement: StockMovement = {
        id: `MOV-${Date.now().toString().slice(-4)}`,
        date: dateInfo.date,
        rawDate: dateInfo.rawDate,
        sku: prod.sku,
        productName: prod.name,
        type: 'ingreso',
        quantity: prod.stock,
        user: 'Melina Gomez',
        sourceOrDestination: prod.locationFacility,
        notes: `Carga directa a stock de ${prod.category}`,
      };
      setMovements((prev) => [newMovement, ...prev]);

      showToast(`Prenda "${prod.name}" cargada al stock de ${prod.category}`);
    }
  };

  // Sale registration handler: Melina sells items and stock is deducted
  const handleConfirmSale = (saleData: {
    items: {
      sku: string;
      productName: string;
      category: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      resultingStock: number;
    }[];
    totalUnits: number;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: string;
    paymentDetails?: string;
    customerName: string;
    customerPhone?: string;
    saleNotes?: string;
    channel: string;
    ticketNumber: string;
  }) => {
    // 1. Deduct stock from products
    const soldSkuMap = new Map<string, number>();
    saleData.items.forEach((item) => {
      soldSkuMap.set(item.sku, (soldSkuMap.get(item.sku) || 0) + item.quantity);
    });

    const updatedProducts = products.map((prod) => {
      const soldQty = soldSkuMap.get(prod.sku);
      if (soldQty) {
        const newStock = Math.max(0, prod.stock - soldQty);
        let status: ProductItem['status'] = 'ok';
        if (newStock === 0) status = 'agotado';
        else if (newStock <= prod.minStockThreshold) status = 'bajo';
        return {
          ...prod,
          stock: newStock,
          status,
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // 2. Generate stock movements for each sold product under Melina Gomez
    const dateInfo = getMovementDateInfo();

    const newMovements: StockMovement[] = saleData.items.map((item, idx) => ({
      id: `MOV-VTA-${Date.now().toString().slice(-4)}-${idx}`,
      date: dateInfo.date,
      rawDate: dateInfo.rawDate,
      sku: item.sku,
      productName: item.productName,
      type: 'egreso',
      quantity: -item.quantity,
      user: 'Melina Gomez',
      sourceOrDestination: `${saleData.channel} #${saleData.ticketNumber}`,
      notes: `${saleData.paymentDetails || `Venta con ${saleData.paymentMethod}`} • Cliente: ${saleData.customerName}${saleData.customerPhone ? ` (Tel/WA: ${saleData.customerPhone})` : ''}${saleData.saleNotes ? ` • Nota: ${saleData.saleNotes}` : ''} ($${item.subtotal.toLocaleString('es-AR')})`,
    }));

    setMovements((prev) => [...newMovements, ...prev]);

    showToast(`¡Venta de Melina registrada! -${saleData.totalUnits} prendas descontadas del stock`);
  };

  // ----------------------------------------------------
  // RESERVAS HANDLERS (SEÑA <= 50%, RETIRO, CADUCIDAD)
  // ----------------------------------------------------
  const handleCreateReserva = (reservaData: Omit<ReservaItem, 'id' | 'code' | 'status' | 'createdAt'>) => {
    const nextNum = reservas.length + 104;
    const newRes: ReservaItem = {
      ...reservaData,
      id: `RES-${nextNum}`,
      code: `#RES-${nextNum}`,
      status: 'activa',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    // Apartar la prenda física del stock disponible
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === reservaData.garmentSku) {
          const nextStock = Math.max(0, p.stock - reservaData.quantity);
          return {
            ...p,
            stock: nextStock,
            status: nextStock === 0 ? 'agotado' : nextStock <= p.minStockThreshold ? 'bajo' : 'ok',
          };
        }
        return p;
      })
    );

    // Registrar ingreso por seña en movimientos
    const dateInfo = getMovementDateInfo();
    const newMov: StockMovement = {
      id: `MOV-RES-${Date.now().toString().slice(-4)}`,
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
    setMovements((prev) => [newMov, ...prev]);

    setReservas((prev) => [newRes, ...prev]);
    showToast(`¡Reserva ${newRes.code} creada! Seña de $${reservaData.depositAmount.toLocaleString('es-AR')} registrada.`);
  };

  const handleMarkReservaRetired = (reservaId: string, balancePaymentMethod: string) => {
    const target = reservas.find((r) => r.id === reservaId);
    if (!target) return;

    const nowStr = new Date().toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    setReservas((prev) =>
      prev.map((r) =>
        r.id === reservaId
          ? {
              ...r,
              status: 'retirada' as const,
              pendingBalance: 0,
              pickedUpAt: nowStr,
              balancePaymentMethod: balancePaymentMethod as any,
            }
          : r
      )
    );

    showToast(`¡Prenda retirada! Saldo de $${target.pendingBalance.toLocaleString('es-AR')} cobrado (${balancePaymentMethod}).`);
  };

  const handleDeleteReserva = (reservaId: string) => {
    const target = reservas.find((r) => r.id === reservaId);
    if (!target) return;

    // Si estaba activa, devolver la prenda al stock
    if (target.status === 'activa') {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.sku === target.garmentSku) {
            const nextStock = p.stock + target.quantity;
            return {
              ...p,
              stock: nextStock,
              status: nextStock <= p.minStockThreshold ? 'bajo' : 'ok',
            };
          }
          return p;
        })
      );
      showToast(`Reserva ${target.code} eliminada. La prenda volvió al stock de salón.`);
    } else {
      showToast(`Reserva ${target.code} eliminada del registro.`);
    }

    setReservas((prev) => prev.filter((r) => r.id !== reservaId));
  };

  const handleClearCaducadas = () => {
    const caducadas = reservas.filter((r) => r.status === 'caducada');
    if (caducadas.length === 0) {
      showToast('No hay reservas caducadas para eliminar.');
      return;
    }

    // Devolver prendas de reservas caducadas al stock
    setProducts((prev) =>
      prev.map((p) => {
        const itemCaducado = caducadas.find((c) => c.garmentSku === p.sku);
        if (itemCaducado) {
          const nextStock = p.stock + itemCaducado.quantity;
          return {
            ...p,
            stock: nextStock,
            status: nextStock <= p.minStockThreshold ? 'bajo' : 'ok',
          };
        }
        return p;
      })
    );

    setReservas((prev) => prev.filter((r) => r.status !== 'caducada'));
    showToast(`${caducadas.length} reservas caducadas eliminadas y prendas devueltas al perchero.`);
  };

  // ----------------------------------------------------
  // PROVEEDORES HANDLERS (CRUD)
  // ----------------------------------------------------
  const handleAddSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const nextId = `SUP-0${suppliers.length + 1}`;
    const newSup: Supplier = {
      ...supplierData,
      id: nextId,
    };
    setSuppliers((prev) => [...prev, newSup]);
    showToast(`¡Proveedor "${newSup.name}" agregado con éxito!`);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? supplier : s)));
    showToast(`¡Proveedor "${supplier.name}" actualizado!`);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const found = suppliers.find((s) => s.id === supplierId);
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    showToast(`Proveedor "${found?.name || supplierId}" eliminado.`);
  };

  // ----------------------------------------------------
  // USUARIOS & ROLES HANDLERS (ADMIN, NORMAL, DEV)
  // ----------------------------------------------------
  const handleSwitchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      showToast(`Sesión cambiada a: ${target.name} (${target.role})`);
    }
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }
    showToast(`Rol actualizado a "${newRole}" con éxito.`);
  };

  const handleAddUser = (userData: Omit<AppUser, 'id'>) => {
    const newUsr: AppUser = {
      ...userData,
      id: `USR-0${users.length + 1}`,
    };
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
    showToast(`Prenda "${target?.name || sku}" eliminada del inventario.`);
  };

  // ----------------------------------------------------
  // TESTING & RESET HANDLERS
  // ----------------------------------------------------
  const handleClearAllTestData = () => {
    clearAllStoredData();
    setProducts([]);
    setMovements([]);
    setReservas([]);
    setPromotions([]);
    setSuppliers([]);
    setEditingProduct(null);
    setProductForVenta(null);
    setProductForReserva(null);
    showToast('Se eliminaron todas las prendas, stock, movimientos, reservas, promociones y proveedores.');
  };

  const handleRestoreTestData = () => {
    restoreAllDemoData();
    setProducts(INITIAL_PRODUCTS);
    setMovements(INITIAL_MOVEMENTS);
    setReservas(INITIAL_RESERVAS);
    setPromotions(INITIAL_PROMOTIONS);
    setSuppliers(INITIAL_SUPPLIERS);
    setCategoriesBase(INITIAL_CATEGORIES);
    setSelectedCategory('Buzos');
    showToast('¡Datos de prueba iniciales restaurados con éxito!');
  };

  return (
    <>
      <Routes>
        {/* PANTALLA PÚBLICA DE LOGIN */}
        <Route
          path="/login"
          element={
            <LoginView
              onLoginSuccess={(email) => {
                showToast(`¡Bienvenida de vuelta, ${email.split('@')[0]}!`);
              }}
              onBackToApp={() => navigate('/dashboard')}
            />
          }
        />

        {/* ENRUTAMIENTO PROTEGIDO (ProtectedRoute): Bloquea si no hay sesión */}
        <Route element={<ProtectedRoute />}>
          {/* Main Layout Wrapper con Sidebar, Header y Modals */}
          <Route
            element={
              <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex font-body selection:bg-[#42308f]/20 selection:text-[#42308f]">
                {/* Sidebar Navigation */}
                <Sidebar
                  currentScreen={currentScreen}
                  onNavigate={(screen) => {
                    if (screen === 'stock' && currentScreen !== 'stock') {
                      setStockStatusFilter('all');
                    }
                    const routeMap: Record<NavScreen, string> = {
                      resumen: '/dashboard',
                      stock: '/stock',
                      productos: '/productos',
                      movimientos: '/movimientos',
                      reservas: '/reservas',
                      promociones: '/promociones',
                      proveedores: '/proveedores',
                      configuracion: '/configuracion',
                      login: '/login',
                    };
                    navigate(routeMap[screen] || '/dashboard');
                  }}
                  isOpenMobile={isMobileSidebarOpen}
                  onCloseMobile={() => setIsMobileSidebarOpen(false)}
                  isLoggedIn={true}
                  onOpenLogin={() => navigate('/login')}
                />

                {/* Main Content Area */}
                <div className="flex-1 md:ml-[270px] min-h-screen flex flex-col transition-all">
                  {/* Top Header */}
                  <Header
                    onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    currentScreen={currentScreen}
                    onNavigate={(screen) => {
                      const routeMap: Record<NavScreen, string> = {
                        resumen: '/dashboard',
                        stock: '/stock',
                        productos: '/productos',
                        movimientos: '/movimientos',
                        reservas: '/reservas',
                        promociones: '/promociones',
                        proveedores: '/proveedores',
                        configuracion: '/configuracion',
                        login: '/login',
                      };
                      navigate(routeMap[screen] || '/dashboard');
                    }}
                    onOpenLogin={() => navigate('/login')}
                    isLoggedIn={true}
                    onLogout={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    onOpenRegistrarVenta={() => handleOpenRegistrarVenta()}
                    currentUser={currentUser}
                  />

                  {/* Dynamic Routed View */}
                  <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    <Outlet />
                  </main>
                </div>

                {/* Nuevo Ingreso Modal */}
                <NuevoIngresoModal
                  isOpen={isNuevoIngresoOpen}
                  onClose={() => setIsNuevoIngresoOpen(false)}
                  products={products}
                  categories={categories.map((c) => c.name)}
                  onAddStock={handleAddStock}
                />

                {/* Crear Stock Modal */}
                <CrearStockModal
                  isOpen={isCrearStockOpen}
                  onClose={() => setIsCrearStockOpen(false)}
                  existingCategoryNames={categories.map((c) => c.name)}
                  onCreateStock={handleCreateStock}
                />

                {/* Cargar Producto / Reponer Stock Modal */}
                <CargarProductoModal
                  isOpen={isCargarProductoOpen}
                  onClose={() => {
                    setIsCargarProductoOpen(false);
                    setCargarProductToEdit(null);
                    setProductToReplenish(null);
                  }}
                  products={products}
                  categories={categories.map((c) => c.name)}
                  defaultCategory={categoryForCargar || (selectedCategory !== 'Todas' ? selectedCategory : 'Buzos')}
                  onSaveProduct={handleSaveCargarProducto}
                  onSaveBatchProducts={handleSaveBatchProducts}
                  onReplenishProduct={handleReplenishStock}
                  productToEdit={cargarProductToEdit}
                  productToReplenish={productToReplenish}
                  initialMode={cargarModalInitialMode}
                  onCreateCategory={handleCreateCategoryInline}
                />

                {/* Registrar Venta Modal (Melina Gomez) */}
                <RegistrarVentaModal
                  isOpen={isRegistrarVentaOpen}
                  onClose={() => {
                    setIsRegistrarVentaOpen(false);
                    setProductForVenta(null);
                  }}
                  products={products}
                  promotions={promotions}
                  initialProduct={productForVenta}
                  onConfirmSale={handleConfirmSale}
                />

                {/* Editar Stock Modal */}
                <EditarStockModal
                  isOpen={Boolean(editingProduct)}
                  onClose={() => setEditingProduct(null)}
                  product={editingProduct}
                  onSaveProduct={handleSaveProduct}
                />

                {/* Promocion Modal (Crear / Modificar) */}
                <PromocionModal
                  isOpen={isPromotionModalOpen}
                  onClose={() => {
                    setIsPromotionModalOpen(false);
                    setEditingPromotion(null);
                  }}
                  onSave={handleSavePromotion}
                  promotionToEdit={editingPromotion}
                  products={products}
                />

                {/* Nueva Reserva Modal */}
                <NuevaReservaModal
                  isOpen={isNuevaReservaOpen}
                  onClose={() => {
                    setIsNuevaReservaOpen(false);
                    setProductForReserva(null);
                  }}
                  products={products}
                  onCreateReserva={handleCreateReserva}
                  initialProduct={productForReserva}
                />

                {/* Confirmar Eliminación Modal */}
                <ConfirmDeleteModal
                  isOpen={Boolean(deletingPromotion)}
                  onClose={() => setDeletingPromotion(null)}
                  onConfirm={handleDeletePromotionConfirm}
                  title="Eliminar Promoción"
                  itemName={deletingPromotion?.title || ''}
                  itemDetail={
                    deletingPromotion
                      ? `Beneficio: ${
                          deletingPromotion.discountType === 'porcentaje'
                            ? `${deletingPromotion.discountValue}% OFF`
                            : deletingPromotion.discountType === 'monto_fijo'
                            ? `$${deletingPromotion.discountValue.toLocaleString('es-AR')} OFF`
                            : '2x1'
                        } • Días: ${deletingPromotion.dayOfWeek || 'Sábados'}`
                      : undefined
                  }
                />

                {/* Global Action Toast Notification */}
                {toastMessage && (
                  <div className="fixed bottom-6 right-6 z-50 bg-[#0b1c30] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold">{toastMessage}</span>
                  </div>
                )}
              </div>
            }
          >
            {/* ESCALÓN 1: Rutas accesibles por todos los roles ['developer', 'admin', 'vendedora'] */}
            <Route element={<RoleRoute allowedRoles={['developer', 'admin', 'vendedora']} />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ResumenView
                    categories={categories}
                    products={products}
                    movements={movements}
                    onSelectCategory={handleSelectCategory}
                    onOpenNuevoIngreso={() => setIsNuevoIngresoOpen(true)}
                    onOpenCrearStock={handleOpenCrearStock}
                    onOpenRegistrarVenta={() => handleOpenRegistrarVenta()}
                    onNavigateToLowStock={() => handleNavigateToStockWithStatus('bajo', 'Todas')}
                    onNavigateToOutOfStock={() => handleNavigateToStockWithStatus('agotado', 'Todas')}
                    onSelectCategoryWithFilter={(catName, filter) => handleNavigateToStockWithStatus(filter, catName)}
                    onExport={handleExport}
                  />
                }
              />
              <Route
                path="/stock"
                element={
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
                    onOpenCargarProducto={(cat, prod) => {
                      if (prod) {
                        handleOpenCargarProducto(cat, prod, 'nuevo');
                      } else {
                        handleOpenCargarProducto(cat, null, 'reponer');
                      }
                    }}
                    onQuickReplenish={handleQuickReplenish}
                    onOpenRegistrarVenta={(prod) => handleOpenRegistrarVenta(prod)}
                    onOpenReserva={handleOpenNuevaReserva}
                    onEditStock={(p) => {
                      if (p) {
                        handleOpenCargarProducto(p.category, p, 'nuevo');
                      } else {
                        handleOpenCargarProducto(selectedCategory !== 'Todas' ? selectedCategory : 'Buzos', null, 'reponer');
                      }
                    }}
                    onExport={handleExport}
                    onUpdateProductStock={handleUpdateProductStock}
                    onDeleteProduct={handleDeleteProduct}
                  />
                }
              />
              <Route
                path="/productos"
                element={
                  <ProductosView
                    products={products}
                    onSelectProduct={(p) => {
                      setSelectedCategory(p.category);
                      setEditingProduct(p);
                      navigate('/stock');
                    }}
                    onOpenNuevoIngreso={() => setIsNuevoIngresoOpen(true)}
                    onOpenRegistrarVenta={(prod) => handleOpenRegistrarVenta(prod)}
                    onDeleteProduct={handleDeleteProduct}
                  />
                }
              />
              <Route path="/movimientos" element={<MovimientosView movements={movements} />} />
              <Route
                path="/reservas"
                element={
                  <ReservasView
                    reservas={reservas}
                    products={products}
                    onOpenNuevaReserva={() => handleOpenNuevaReserva()}
                    onMarcarRetirada={handleMarkReservaRetired}
                    onEliminarReserva={handleDeleteReserva}
                    onEliminarCaducadas={handleClearCaducadas}
                    onNavigateToStock={() => navigate('/stock')}
                  />
                }
              />
              <Route
                path="/promociones"
                element={
                  <PromocionesView
                    promotions={promotions}
                    products={products}
                    onCreatePromotion={() => {
                      setEditingPromotion(null);
                      setIsPromotionModalOpen(true);
                    }}
                    onEditPromotion={(promo) => {
                      setEditingPromotion(promo);
                      setIsPromotionModalOpen(true);
                    }}
                    onDeletePromotion={(promo) => setDeletingPromotion(promo)}
                    onToggleStatus={handleTogglePromotionStatus}
                    onNavigateToStock={() => navigate('/stock')}
                    onSelectProductForStock={(category, sku) => {
                      if (category && category !== 'Todas') {
                        setSelectedCategory(category);
                      }
                      navigate('/stock');
                      if (sku) {
                        const targetProd = products.find((p) => p.sku === sku);
                        if (targetProd) {
                          setEditingProduct(targetProd);
                        }
                      }
                    }}
                  />
                }
              />
              <Route
                path="/proveedores"
                element={
                  <ProveedoresView
                    suppliers={suppliers}
                    onAddSupplier={handleAddSupplier}
                    onEditSupplier={handleEditSupplier}
                    onDeleteSupplier={handleDeleteSupplier}
                  />
                }
              />
              <Route
                path="/configuracion"
                element={
                  <ConfiguracionView
                    users={users}
                    currentUser={currentUser}
                    onSwitchUser={handleSwitchUser}
                    onUpdateUserRole={handleUpdateUserRole}
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                    onClearAllTestData={handleClearAllTestData}
                    onRestoreTestData={handleRestoreTestData}
                  />
                }
              />
            </Route>

            {/* ESCALÓN 2: RUTA /reportes-ventas permitida para ['developer', 'admin'] */}
            <Route element={<RoleRoute allowedRoles={['developer', 'admin']} />}>
              <Route path="/reportes-ventas" element={<ReportesVentasView />} />
            </Route>

            {/* ESCALÓN 3: RUTA /configuracion-sistema solo permitida para ['developer'] */}
            <Route element={<RoleRoute allowedRoles={['developer']} />}>
              <Route
                path="/configuracion-sistema"
                element={
                  <ConfiguracionSistemaView
                    onClearDatabase={handleClearAllTestData}
                    onRestoreDatabase={handleRestoreTestData}
                  />
                }
              />
            </Route>
          </Route>
        </Route>

        {/* Wildcard de seguridad */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
