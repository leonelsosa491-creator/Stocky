import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { UnauthorizedView } from './UnauthorizedView';

interface RoleRouteProps {
  allowedRoles: Role[];
  children?: React.ReactNode;
  redirectTo?: string; // Opcional: si se prefiere redirigir en lugar de mostrar pantalla de no autorizado
}

/**
 * RoleRoute:
 * Controla el acceso escalonado según el rol del usuario autenticado.
 * - Si no está autenticado, delega la redirección a /login.
 * - Si el rol actual está incluido en allowedRoles, permite el acceso.
 * - Si el rol no tiene permisos, muestra la vista de acceso restringido o redirige.
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  children,
  redirectTo,
}) => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-3 border-[#42308f]/20 border-t-[#42308f] animate-spin mb-4" />
        <h2 className="font-heading font-bold text-lg text-[#0b1c30]">
          Verificando permisos de acceso...
        </h2>
        <p className="text-xs text-[#797583] mt-1">Control de acceso escalonado por rol</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAuthorized = hasRole(allowedRoles);

  if (!isAuthorized) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <UnauthorizedView allowedRoles={allowedRoles} currentRole={user.role} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
