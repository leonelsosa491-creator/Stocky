import React from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ArrowLeftRight,
  CalendarCheck,
  Tag,
  Truck,
  Settings,
  Store,
  X,
  LogIn
} from 'lucide-react';
import { NavScreen } from '../types';

interface SidebarProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  isLoggedIn,
  onOpenLogin,
}) => {
  const navItems: { id: NavScreen; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'stock', label: 'Stock', icon: <Package className="w-5 h-5" /> },
    { id: 'productos', label: 'Productos', icon: <Boxes className="w-5 h-5" /> },
    { id: 'movimientos', label: 'Movimientos', icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'reservas', label: 'Reservas', icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'promociones', label: 'Promociones', icon: <Tag className="w-5 h-5" /> },
    { id: 'proveedores', label: 'Proveedores', icon: <Truck className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 h-full w-[260px] bg-white border-r border-[#c9c4d3]/40 z-50 flex flex-col p-6 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden absolute top-4 right-4 p-2 text-[#5e5d69] hover:text-[#42308f] rounded-full"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div
          onClick={() => {
            onNavigate('resumen');
            onCloseMobile();
          }}
          className="flex items-center gap-3 mb-8 px-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-[#5a49a8] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-[#42308f] leading-tight">Aries</h1>
            <p className="font-body text-xs text-[#5e5d69] tracking-tight">Melina's Indumentaria</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 flex-grow overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#e1deed] text-[#42308f] shadow-xs'
                    : 'text-[#5e5d69] hover:bg-[#eff4ff] hover:text-[#42308f]'
                }`}
              >
                <span className={isActive ? 'text-[#42308f]' : 'text-[#797583]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Configuración & Login View Toggle */}
        <div className="pt-4 border-t border-[#c9c4d3]/30 flex flex-col gap-1 mt-auto">
          <button
            onClick={() => {
              onNavigate('configuracion');
              onCloseMobile();
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold transition-colors ${
              currentScreen === 'configuracion'
                ? 'bg-[#e1deed] text-[#42308f]'
                : 'text-[#5e5d69] hover:bg-[#eff4ff] hover:text-[#42308f]'
            }`}
          >
            <Settings className="w-5 h-5 text-[#797583]" />
            <span>Configuración</span>
          </button>

          <button
            onClick={() => {
              onOpenLogin();
              onCloseMobile();
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold text-[#42308f] bg-[#eff4ff] hover:bg-[#e1deed] transition-colors mt-1"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoggedIn ? 'Ver Pantalla Login' : 'Iniciar Sesión'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
