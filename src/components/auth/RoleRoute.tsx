import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface RoleRouteProps {
  allowedRoles: Role[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user, role, isLoading } = useAuth();

  // Si Supabase sigue verificando la sesión, mostramos un indicador temporal para evitar el choque de tipos
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#42308f]/20 border-t-[#42308f] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si no hay usuario o el rol no está permitido, redirigimos al login o dashboard
  if (!user || !role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};