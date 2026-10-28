import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * ProtectedRoute:
 * Bloquea el acceso a rutas protegidas si el usuario no tiene una sesión activa.
 * Redirige automáticamente al /login preservando la ruta de origen en location.state.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-3 border-[#42308f]/20 border-t-[#42308f] animate-spin mb-4" />
        <h2 className="font-heading font-bold text-lg text-[#0b1c30]">
          Verificando credenciales...
        </h2>
        <p className="text-xs text-[#797583] mt-1">
          Cargando perfil de boutique {user?.businessName?.trim() || 'registrada'}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirige al login guardando la ruta intentada
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
