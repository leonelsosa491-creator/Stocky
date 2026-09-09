import React, { useState } from 'react';
import { Search, Bell, Menu, ChevronDown, LogOut, CheckCircle2, User, Sparkles, ShoppingBag, ShieldCheck, Code } from 'lucide-react';
import { NavScreen, AppUser } from '../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  onOpenRegistrarVenta?: () => void;
  currentUser?: AppUser;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  onNavigate,
  onOpenLogin,
  isLoggedIn,
  onLogout,
  onOpenRegistrarVenta,
  currentUser,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const userName = currentUser?.name || 'Melina Gomez';
  const userRole = currentUser?.role || 'administrador';
  const userAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

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
            placeholder="Buscar en inventario..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#c9c4d3]/60 rounded-full focus:outline-none focus:border-[#42308f] focus:ring-2 focus:ring-[#42308f]/15 placeholder:text-[#797583] text-[#0b1c30] shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4 ml-auto">
        {/* Quick Sale Button for Melina */}
        {onOpenRegistrarVenta && (
          <button
            id="btn-header-registrar-venta"
            onClick={onOpenRegistrarVenta}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Registrar venta realizada por Melina (Descuenta stock automáticamente)"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Registrar Venta</span>
            <span className="sm:hidden">Vender</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            className="p-2 text-[#484552] hover:text-[#42308f] hover:bg-white rounded-full transition-colors relative"
            title="Notificaciones de stock"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#c9c4d3]/50 shadow-xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 pb-2 border-b border-[#c9c4d3]/30 flex justify-between items-center">
                <span className="font-heading font-bold text-sm text-[#0b1c30]">Notificaciones</span>
                <span className="text-xs text-[#42308f] font-semibold cursor-pointer">Marcar leídas</span>
              </div>
              <div className="divide-y divide-gray-50 text-xs">
                <div className="p-3 hover:bg-[#f8f9ff] flex gap-2.5 items-start cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-[#ba1a1a] mt-1.5 shrink-0"></span>
                  <div>
                    <p className="font-semibold text-gray-800">8 artículos sin stock en Abrigos</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Trench Coat y camperas agotadas</p>
                  </div>
                </div>
                <div className="p-3 hover:bg-[#f8f9ff] flex gap-2.5 items-start cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] mt-1.5 shrink-0"></span>
                  <div>
                    <p className="font-semibold text-gray-800">Alerta de stock bajo en Remeras</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">Remera Estampada 'Sunset' (12 u.)</p>
                  </div>
                </div>
                <div className="p-3 hover:bg-[#f8f9ff] flex gap-2.5 items-start cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] mt-1.5 shrink-0"></span>
                  <div>
                    <p className="font-semibold text-gray-800">Ingreso completado</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">+40 Remera Deportiva DryFit registradas</p>
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
            className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1.5 rounded-full hover:bg-white text-[#0b1c30] transition-colors border border-transparent hover:border-[#c9c4d3]/40"
          >
            <div className="w-8 h-8 rounded-full bg-[#5a49a8] overflow-hidden flex items-center justify-center text-white ring-2 ring-[#5a49a8]/20">
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="font-heading font-semibold text-xs text-[#0b1c30]">
                {userName}
              </span>
              <span className="text-[10px] uppercase font-extrabold text-[#42308f] tracking-tight">
                {userRole}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#797583] hidden sm:block" />
          </button>

          {/* User Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#c9c4d3]/50 shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-[#c9c4d3]/20">
                <p className="font-heading font-bold text-sm text-[#0b1c30]">{userName}</p>
                <p className="text-xs text-[#5e5d69] capitalize">Rol: {userRole}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sesión Activa
                </div>
              </div>

              <div className="py-1 text-xs text-[#484552]">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigate('configuracion');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#eff4ff] flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-[#42308f]" /> Mi Perfil
                </button>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenLogin();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#eff4ff] flex items-center gap-2 text-[#42308f] font-semibold"
                >
                  <Sparkles className="w-4 h-4" /> Ver Pantalla de Login
                </button>
              </div>

              <div className="pt-1 border-t border-[#c9c4d3]/20">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#ba1a1a] hover:bg-rose-50 flex items-center gap-2"
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
