import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  LogIn,
  TrendingUp,
  Terminal,
  ShieldCheck,
  LogOut,
  UserCheck,
  Lock
} from 'lucide-react';
import { NavScreen, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Can } from './auth/Can';

interface SidebarProps {
  currentScreen?: NavScreen;
  onNavigate?: (screen: NavScreen) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  onOpenLogin,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout, loginWithRole, isAuthenticated } = useAuth();

  const handleNav = (path: string, screenId: NavScreen) => {
    navigate(path);
    if (onNavigate) onNavigate(screenId);
    onCloseMobile();
  };

  const currentPath = location.pathname;

  const mainNavItems = [
    { id: 'resumen' as NavScreen, path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
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
        className={`fixed left-0 top-0 h-full w-[270px] bg-white border-r border-[#c9c4d3]/40 z-50 flex flex-col p-5 transition-transform duration-300 ease-in-out ${
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
          onClick={() => handleNav('/dashboard', 'resumen')}
          className="flex items-center gap-3 mb-6 px-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#5a49a8] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-[#42308f] leading-tight">Stocky</h1>
            <p className="font-body text-[11px] text-[#5e5d69] font-medium tracking-tight">Aries Boutique</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 flex-grow overflow-y-auto pr-1">
          <span className="text-[10px] font-bold text-[#797583] uppercase tracking-wider px-3 py-1">
            General
          </span>
          {mainNavItems.map((item) => {
            const isActive = currentPath === item.path || currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.path, item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#e1deed] text-[#42308f] shadow-2xs font-extrabold'
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

          {/* RUTA PROTEGIDA ESCALONADA 1: /reportes-ventas (['developer', 'admin']) */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-[#797583] uppercase tracking-wider px-3 py-1 flex items-center justify-between">
              <span>Gestión Comercial</span>
              <span className="text-[9px] font-bold text-[#42308f] bg-[#eff4ff] px-1.5 py-0.2 rounded">
                Dueña / Dev
              </span>
            </span>

            <Can
              role={['developer', 'admin']}
              fallback={
                <div
                  onClick={() => handleNav('/reportes-ventas', 'resumen')}
                  className="flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs text-gray-400 hover:bg-gray-50 cursor-pointer opacity-70"
                  title="Bloqueado para rol vendedora"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-gray-300" />
                    <span>Reportes Ventas</span>
                  </div>
                  <Lock className="w-3 h-3 text-gray-400" />
                </div>
              }
            >
              <button
                onClick={() => handleNav('/reportes-ventas', 'resumen')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  currentPath === '/reportes-ventas'
                    ? 'bg-[#e1deed] text-[#42308f] shadow-2xs font-extrabold'
                    : 'text-[#5e5d69] hover:bg-[#eff4ff] hover:text-[#42308f]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-[#42308f]" />
                  <span>Reportes Ventas</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Finanzas
                </span>
              </button>
            </Can>
          </div>

          {/* RUTA PROTEGIDA ESCALONADA 2: /configuracion-sistema (['developer']) */}
          <Can role="developer">
            <div className="pt-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
                <span>SuperAdmin</span>
                <span className="text-[9px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                  Solo Dev
                </span>
              </span>

              <button
                onClick={() => handleNav('/configuracion-sistema', 'configuracion')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  currentPath === '/configuracion-sistema'
                    ? 'bg-rose-100 text-rose-900 shadow-2xs font-extrabold'
                    : 'text-rose-900/80 hover:bg-rose-50 hover:text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-rose-600" />
                  <span>Config. Sistema & DB</span>
                </div>
              </button>
            </div>
          </Can>
        </nav>

        {/* User Card & Role Switcher */}
        <div className="pt-3 border-t border-[#c9c4d3]/30 flex flex-col gap-2 mt-auto">
          {isAuthenticated && user ? (
            <div className="bg-[#f8f9ff] p-3 rounded-2xl border border-[#c9c4d3]/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-[#42308f] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#0b1c30] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#797583] truncate">{user.email}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                    role === 'developer'
                      ? 'bg-rose-100 text-rose-800'
                      : role === 'admin'
                      ? 'bg-purple-100 text-[#42308f]'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {role}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[11px]">
                <button
                  onClick={() => handleNav('/configuracion', 'configuracion')}
                  className="font-bold text-[#5e5d69] hover:text-[#42308f] flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Ajustes</span>
                </button>

                <button
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                navigate('/login');
                onCloseMobile();
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-xs font-bold text-white bg-[#42308f] hover:bg-[#5a49a8] transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
