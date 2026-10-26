import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ArrowLeftRight,
  CalendarCheck,
  Tag,
  Truck,
  Store,
  X,
  TrendingUp,
  Terminal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NavScreen } from '../types';
import { useAuth } from '../context/AuthContext';
import { Can } from './auth/Can';

interface SidebarProps {
  currentScreen?: NavScreen;
  onNavigate?: (screen: NavScreen) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  onCollapseChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNav = (path: string, screenId: NavScreen) => {
    navigate(path);
    if (onNavigate) onNavigate(screenId);
    onCloseMobile();
  };

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onCollapseChange) onCollapseChange(newState);
  };

  const currentPath = location.pathname;

  const mainNavItems = [
    { id: 'resumen' as NavScreen, path: '/dashboard', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'stock' as NavScreen, path: '/stock', label: 'Stock Físico', icon: <Package className="w-4 h-4" /> },
    { id: 'productos' as NavScreen, path: '/productos', label: 'Prendas', icon: <Boxes className="w-4 h-4" /> },
    { id: 'movimientos' as NavScreen, path: '/movimientos', label: 'Movimientos', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'reservas' as NavScreen, path: '/reservas', label: 'Reservas', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'promociones' as NavScreen, path: '/promociones', label: 'Promociones', icon: <Tag className="w-4 h-4" /> },
    { id: 'proveedores' as NavScreen, path: '/proveedores', label: 'Proveedores', icon: <Truck className="w-4 h-4" /> },
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
        className={`fixed left-0 top-0 h-full bg-white border-r border-[#c9c4d3]/40 z-50 flex flex-col p-5 transition-all duration-300 ease-in-out ${
          isOpenMobile 
            ? 'translate-x-0 w-[270px]' 
            : `-translate-x-full md:translate-x-0 ${isCollapsed ? 'md:w-[88px] md:px-3' : 'md:w-[270px]'}`
        }`}
      >
        {/* Botón de Colapsar/Expandir */}
        <button
          onClick={handleToggleCollapse}
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-[#c9c4d3] rounded-full items-center justify-center text-[#42308f] hover:bg-[#eff4ff] hover:scale-110 transition-all z-50 shadow-sm cursor-pointer"
          aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

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
          onClick={() => handleNav('/dashboard', 'resumen')}
          className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2'} mb-6 cursor-pointer group transition-all`}
        >
          <div className="w-10 h-10 rounded-2xl bg-[#5a49a8] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2">
              <h1 className="font-heading text-lg font-bold text-[#42308f] leading-tight">Stocky</h1>
              <p className="font-body text-[11px] text-[#5e5d69] font-medium tracking-tight">Aries Boutique</p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 flex-grow overflow-y-auto overflow-x-hidden pr-1 pb-6 custom-scrollbar">
          
          {!isCollapsed ? (
            <span className="text-[10px] font-bold text-[#797583] uppercase tracking-wider px-3 py-1 whitespace-nowrap">
              General
            </span>
          ) : (
            <div className="h-4"></div>
          )}

          {mainNavItems.map((item) => {
            const isActive = currentPath === item.path || currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.path, item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${isCollapsed ? 'justify-center p-2.5 mx-auto w-11 h-11' : 'gap-3 px-3.5 py-2.5 w-full'} rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#e1deed] text-[#42308f] shadow-2xs font-extrabold'
                    : 'text-[#5e5d69] hover:bg-[#eff4ff] hover:text-[#42308f]'
                }`}
              >
                <span className={isActive ? 'text-[#42308f] shrink-0' : 'text-[#797583] shrink-0'}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}

          {/* PERMISO TIPO DJANGO: Solo Admin y Developer (Dueña) pueden ver Reportes */}
          <Can role={['developer', 'admin']}>
            <button
              onClick={() => handleNav('/reportes-ventas', 'reportes' as NavScreen)}
              title={isCollapsed ? "Reportes" : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center p-2.5 mx-auto w-11 h-11' : 'gap-3 px-3.5 py-2.5 w-full'} rounded-2xl text-xs font-bold transition-all ${
                currentPath === '/reportes-ventas'
                  ? 'bg-[#e1deed] text-[#42308f] shadow-2xs font-extrabold'
                  : 'text-[#5e5d69] hover:bg-[#eff4ff] hover:text-[#42308f]'
              }`}
            >
              <span className={currentPath === '/reportes-ventas' ? 'text-[#42308f] shrink-0' : 'text-[#797583] shrink-0'}>
                <TrendingUp className="w-4 h-4" />
              </span>
              {!isCollapsed && <span className="whitespace-nowrap">Reportes</span>}
            </button>
          </Can>

          {/* Configuración de Sistema (Solo Developer) */}
          <Can role="developer">
            <div className="pt-2">
              {!isCollapsed ? (
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider px-3 py-1 flex items-center justify-between whitespace-nowrap">
                  <span>SuperAdmin</span>
                </span>
              ) : (
                <div className="my-2 border-t border-rose-200 w-6 mx-auto"></div>
              )}

              <button
                onClick={() => handleNav('/configuracion-sistema', 'configuracion')}
                title={isCollapsed ? "Config. Sistema" : undefined}
                className={`flex items-center ${isCollapsed ? 'justify-center p-2.5 mx-auto w-11 h-11' : 'gap-3 px-3.5 py-2.5 w-full'} rounded-2xl text-xs font-bold transition-all ${
                  currentPath === '/configuracion-sistema'
                    ? 'bg-rose-100 text-rose-900 shadow-2xs font-extrabold'
                    : 'text-rose-900/80 hover:bg-rose-50 hover:text-rose-950'
                }`}
              >
                <Terminal className="w-4 h-4 text-rose-600 shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Config. Sistema</span>}
              </button>
            </div>
          </Can>
        </nav>
      </aside>
    </>
  );
};