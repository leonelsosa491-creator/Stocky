import React from 'react';
import { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface CanProps {
  /**
   * Rol o roles que tienen permiso para visualizar este componente.
   * Ej: role="developer" o role={['developer', 'admin']}
   */
  role: Role | Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente utilitario para Renderizado Condicional en la UI según el Rol:
 * 
 * Ejemplos de uso:
 * 
 * 1. Ocultar componente crítico ("Borrar Base de Datos") para que solo lo vea el 'developer':
 *    <Can role="developer">
 *      <BotonBorrarBaseDatos onClick={handleDeleteDB} />
 *    </Can>
 * 
 * 2. Ocultar botón de "Nuevo Stock" para que lo vean 'developer' y 'admin', pero NO la 'vendedora':
 *    <Can role={['developer', 'admin']}>
 *      <BotonNuevoStock onClick={handleOpenModal} />
 *    </Can>
 */
export const Can: React.FC<CanProps> = ({ role, children, fallback = null }) => {
  const { hasRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  const allowed = Array.isArray(role) ? role : [role];
  const isAllowed = hasRole(allowed);

  return isAllowed ? <>{children}</> : <>{fallback}</>;
};
