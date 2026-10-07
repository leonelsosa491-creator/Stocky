import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  CheckCircle2,
  User,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Code,
  KeyRound,
  TrendingUp,
  Terminal,
  Store
} from 'lucide-react';
import { NavScreen, AppUser, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Can } from './auth/Can';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentScreen?: NavScreen;
  onNavigate?: (screen: NavScreen) => void;
  onOpenLogin?: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  onOpenRegistrarVenta?: () => void;
  currentUser?: AppUser;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  onNavigate,
  onOpenLogin,
  onOpenRegistrarVenta,
}) => {
  const navigate = useNavigate();
  const { user, role, logout, loginWithRole, isAuthenticated } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const userName = user?.name || 'Melina Gomez';
  const userRole = role || 'admin';
  const userAvatar = user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

  const roleLabels: Record<Role, { label: string; badgeClass: string }> = {
    developer: { label: 'SuperAdmin (Dev)', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' },
    admin: { label: 'Dueña (Admin)', badgeClass: 'bg-purple-100 text-[#42308f] border-purple-300' },
    vendedora: { label: 'Vendedora', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#f8f9ff]/90 backdrop-blur-md border-b border-[#c9c4d3]/30 px-4 md:px-8 py-3 flex items-center justify-between transition-all">
      {/* Mobile Menu Button & Brand */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-[#484552] hover:text-[#42308f] rounded-lg hover:bg-white transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#5a49a8] text-white flex items-center justify-center text-sm font-bold">
            A
          </div>
          <span className="font-heading font-bold text-[#42308f] text-base">Aries</span>
        </div>
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#797583] w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar prenda, modelo o categoría..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#c9c4d3]/60 rounded-full focus:outline-none focus:border-[#42308f] focus:ring-2 focus:ring-[#42308f]/15 placeholder:text-[#797583] text-[#0b1c30] shadow-2xs transition-all font-medium"
          />
        </div>
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
        {/* Active Role Indicator Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white border border-[#c9c4d3]/50 rounded-full shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-[#797583] font-bold">Rol:</span>
          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${roleLabels[userRole].badgeClass}`}>
            {roleLabels[userRole].label}
          </span>
        </div>

        {/* Quick Sale Button */}
        {onOpenRegistrarVenta && (
          <button
            id="btn-header-registrar-venta"
            onClick={onOpenRegistrarVenta}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Registrar venta en salón"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Venta Salón</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            className="p-2 text-[#484552] hover:text-[#42308f] hover:bg-white rounded-full transition-colors relative cursor-pointer"
            title="Notificaciones de stock"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#c9c4d3]/50 shadow-xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 pb-2 border-b border-[#c9c4d3]/30 flex justify-between items-center">
                <span className="font-heading font-bold text-sm text-[#0b1c30]">Notificaciones</span>
                <span className="text-[11px] text-[#42308f] font-semibold cursor-pointer">Marcar leídas</span>
              </div>
              <div className="divide-y divide-gray-50 text-xs">
                <div className="p-3 hover:bg-[#f8f9ff] flex gap-2.5 items-start cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 shrink-0"></span>
                  <div>
                    <p className="font-semibold text-gray-800">1 modelo agotado en Pantalones</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Pantalón Sastrero Wide Leg (#103)</p>
                  </div>
                </div>
                <div className="p-3 hover:bg-[#f8f9ff] flex gap-2.5 items-start cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                  <div>
                    <p className="font-semibold text-gray-800">Alerta de stock bajo en Remeras</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Remera Estampada 'Sunset' (12 u.)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-[#c9c4d3]/50 hidden sm:block"></div>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-full hover:bg-white text-[#0b1c30] transition-colors border border-transparent hover:border-[#c9c4d3]/40 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#5a49a8] overflow-hidden flex items-center justify-center text-white ring-2 ring-[#5a49a8]/20 shrink-0">
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="font-heading font-bold text-xs text-[#0b1c30] leading-tight">
                {userName}
              </span>
              <span className="text-[10px] uppercase font-extrabold text-[#42308f] tracking-tight">
                {userRole}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#797583] hidden sm:block" />
          </button>

          {/* User Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl border border-[#c9c4d3]/50 shadow-2xl py-3 px-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-[#c9c4d3]/20">
                <p className="font-heading font-extrabold text-sm text-[#0b1c30]">{userName}</p>
                <p className="text-xs text-[#5e5d69]">{user?.email}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${roleLabels[userRole].badgeClass}`}>
                    {roleLabels[userRole].label}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                  </div>
                </div>
              </div>

              {/* Role Emulation Switcher Inside Header Dropdown */}
              <div className="px-4 py-2.5 border-b border-[#c9c4d3]/20">
                <p className="text-[10px] font-extrabold uppercase text-[#797583] mb-1.5 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-[#42308f]" />
                  Simular Rol (Frontend Demo):
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(['developer', 'admin', 'vendedora'] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={async () => {
                        await loginWithRole(r);
                        setShowUserDropdown(false);
                      }}
                      className={`text-[10px] font-bold py-1 px-1 rounded-xl transition-all truncate text-center cursor-pointer ${
                        userRole === r
                          ? 'bg-[#42308f] text-white shadow-2xs'
                          : 'bg-[#f8f9ff] text-gray-700 hover:bg-[#e1deed] border border-gray-200'
                      }`}
                    >
                      {r === 'developer' ? 'Dev' : r === 'admin' ? 'Dueña' : 'Vendedora'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-1 text-xs text-[#484552]">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate('/dashboard');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#eff4ff] flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Store className="w-4 h-4 text-[#42308f]" /> Dashboard Principal
                </button>

                <Can role={['developer', 'admin']}>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/reportes-ventas');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#eff4ff] flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Reportes de Ventas
                  </button>
                </Can>

                <Can role="developer">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/configuracion-sistema');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 cursor-pointer text-rose-800 font-bold"
                  >
                    <Terminal className="w-4 h-4 text-rose-600" /> Config. Sistema (SuperAdmin)
                  </button>
                </Can>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate('/configuracion');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#eff4ff] flex items-center gap-2 cursor-pointer font-medium"
                >
                  <User className="w-4 h-4 text-[#42308f]" /> Parámetros Boutique
                </button>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#eff4ff] flex items-center gap-2 text-[#42308f] font-semibold cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Ir a Pantalla de Login
                </button>
              </div>

              <div className="pt-1 border-t border-[#c9c4d3]/20">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
