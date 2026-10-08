import React, { useState } from 'react';
import {
  Store,
  BellRing,
  Save,
  ShieldCheck,
  Check,
  Users,
  Code,
  Trash2,
  AlertTriangle,
  RotateCcw,
  User
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { loadStoreSettings, saveStoreSettings } from '../utils/storage';
import { Can } from './auth/Can';
import { useAuth } from '../context/AuthContext';

interface ConfiguracionViewProps {
  users: AppUser[];
  currentUser: AppUser;
  onSwitchUser: (userId: string) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
  onClearAllTestData?: () => void;
  onRestoreTestData?: () => void;
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  onClearAllTestData,
  onRestoreTestData,
}) => {
  // Conexión real a tu sesión de Supabase
  const { user, role } = useAuth();
  
  const [saved, setSaved] = useState(false);
  const [initialSettings] = useState(() => loadStoreSettings());
  const [storeName, setStoreName] = useState(initialSettings.storeName);
  const [address, setAddress] = useState(initialSettings.address);
  const [minAlertStock, setMinAlertStock] = useState(initialSettings.minAlertStock);
  const [emailAlerts, setEmailAlerts] = useState(initialSettings.emailAlerts);

  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreSettings({
      storeName,
      address,
      minAlertStock,
      emailAlerts,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const getRoleBadge = (currentRole: string | null | undefined) => {
    switch (currentRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#eff4ff] text-[#42308f] border border-[#42308f]/20 uppercase">
            <ShieldCheck className="w-3 h-3 text-[#42308f]" />
            Dueña (Admin)
          </span>
        );
      case 'vendedora':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase">
            <User className="w-3 h-3 text-indigo-600" />
            Vendedora (Empleada)
          </span>
        );
      case 'developer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-900 border border-rose-300 uppercase">
            <Code className="w-3 h-3 text-rose-600" />
            SuperAdmin (Developer)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e5d69]">
          SISTEMA & ACCESOS
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
          Configuración General
        </h1>
        <p className="text-sm text-[#5e5d69] mt-1">
          Ajustes de la boutique, reglas de stock y administración de accesos.
        </p>
      </div>

      {/* SECCIÓN 1: USUARIOS Y ROLES (Ahora conectado a la sesión real) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-[#0b1c30]">
                Gestión de Roles de Acceso
              </h3>
              <p className="text-xs text-[#797583]">
                La creación de usuarios ahora se administra de forma segura desde el panel de Supabase.
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Session Callout - REAL DATA */}
        <div className="p-3.5 bg-gradient-to-r from-[#eff4ff] to-white border border-[#42308f]/20 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#42308f] text-white font-bold flex items-center justify-center text-xs uppercase">
              {user?.email ? user.email.charAt(0) : 'U'}
            </div>
            <div>
              <p className="font-bold text-[#0b1c30]">
                Sesión activa actual
              </p>
              <p className="text-[11px] text-[#5e5d69]">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getRoleBadge(role)}
          </div>
        </div>

        {/* Roles Description Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-[#f8f9ff] border border-gray-100 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 font-heading font-bold text-xs text-[#42308f]">
              <ShieldCheck className="w-4 h-4" />
              <span>Administrador</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-snug">
              Control total: gestión de precios, promociones, proveedores, arqueo de caja y configuración del sistema.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 font-heading font-bold text-xs text-emerald-800">
              <User className="w-4 h-4" />
              <span>Usuario Normal</span>
            </div>
            <p className="text-[11px] text-emerald-950 leading-snug">
              Vendedora mostrador: registro de ventas, creación y entrega de reservas con seña, y consulta de stock en salón.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 font-heading font-bold text-xs text-amber-900">
              <Code className="w-4 h-4" />
              <span>Desarrollador</span>
            </div>
            <p className="text-[11px] text-amber-950 leading-snug">
              Soporte técnico: logs de movimientos, diagnóstico de base de datos, depuración y ajustes de servidor.
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DATOS DE LA BOUTIQUE */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0b1c30]">
                Información de la Boutique
              </h3>
              <p className="text-xs text-[#797583]">Datos de mostrador y facturación</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Dirección Central / Sucursal
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: REGLAS DE REPOSICIÓN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0b1c30]">
                Reglas de Reposición y Alertas de Stock
              </h3>
              <p className="text-xs text-[#797583]">Disparadores automáticos para pedidos a fábricas y proveedores</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Alerta de Stock Mínimo por defecto (unidades)
              </label>
              <input
                type="number"
                min="1"
                value={minAlertStock}
                onChange={(e) => setMinAlertStock(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none font-bold text-[#42308f]"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Se marcará en ámbar en el resumen cuando la prenda quede por debajo de este valor.
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#42308f] rounded accent-[#42308f]"
                />
                <span className="text-xs font-bold text-gray-700">
                  Notificaciones automáticas a administradores
                </span>
              </label>
              <p className="text-[11px] text-gray-400 ml-6 mt-1">
                Enviar resumen diario matutino de artículos agotados.
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="px-8 py-3 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] transition-all shadow-md flex items-center gap-2"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Cambios Guardados' : 'Guardar Parámetros'}</span>
          </button>
          {saved && (
            <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
              ¡Parámetros actualizados con éxito!
            </span>
          )}
        </div>
      </form>

      {/* SECCIÓN 4: ZONA DE PRUEBAS / DEPURACIÓN */}
      <Can
        role="developer"
        fallback={
          <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-200 card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-gray-800">
                  Operaciones Críticas de Base de Datos
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  El vaciado general de datos está restringido al rol <strong>'developer' (SuperAdmin)</strong>.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-gray-200 text-gray-600 px-3 py-1 rounded-full self-start sm:self-auto">
              Protegido por Rol
            </span>
          </div>
        }
      >
        <div className="bg-rose-50/40 rounded-3xl p-6 sm:p-8 border border-rose-200/80 card-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-200/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[#0b1c30]">
                  Zona de Pruebas y Depuración (Testing)
                </h3>
                <p className="text-xs text-[#797583]">
                  Herramientas para vaciar el sistema o reiniciar el entorno de pruebas
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200">
              Solo Developer
            </span>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-semibold text-rose-950">
                Eliminar todas las prendas, stock, movimientos, reservas, promociones y proveedores
              </p>
              <p className="text-[11px] text-[#5e5d69] mt-1 leading-relaxed">
                Permite vaciar completamente las tablas para cargar tus propios artículos desde cero o realizar pruebas exhaustivas de stock sin datos preexistentes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {onRestoreTestData && (
                <button
                  type="button"
                  id="btn-restaurar-datos-demo"
                  onClick={onRestoreTestData}
                  className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-full border border-gray-200 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Restaurar datos demo de prueba originales"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                  <span>Restaurar Demo</span>
                </button>
              )}

              {onClearAllTestData && (
                <button
                  type="button"
                  id="btn-eliminar-todos-datos-test"
                  onClick={() => setIsConfirmClearModalOpen(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                  title="Eliminar todas las prendas, stock, movimientos, reservas, promociones y proveedores"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Todo para Testear</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Can>

      {/* Modal Confirmación de Eliminación Total para Testear */}
      {isConfirmClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-extrabold text-lg text-[#0b1c30]">
                  ¿Eliminar todos los datos para testear?
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Esta acción vaciará completamente los registros del sistema:
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 rounded-2xl p-3.5 border border-rose-100 text-xs text-rose-900 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todas las <strong>prendas y niveles de stock</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todos los <strong>movimientos de stock</strong> (ingresos, egresos y ventas)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todas las <strong>reservas de prendas</strong> señadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todas las <strong>promociones</strong> y descuentos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todos los <strong>proveedores</strong> registrados</span>
              </div>
            </div>

            <p className="text-[11px] text-[#797583] leading-tight">
              * Podrás volver a restaurar los datos iniciales de demostración en cualquier momento con el botón <strong>"Restaurar Demo"</strong>.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-eliminar-todo"
                onClick={() => {
                  if (onClearAllTestData) {
                    onClearAllTestData();
                  }
                  setIsConfirmClearModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Sí, Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};