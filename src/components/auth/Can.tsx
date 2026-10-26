import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

// Roles que pueden crear, editar o borrar stock (la vendedora solo vende)
export const ROLES_GESTION: Role[] = ['developer', 'admin'];

interface CanProps {
  role: Role | Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const useCan = (role: Role | Role[]): boolean => {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return false;
  const allowedRoles = Array.isArray(role) ? role : [role];
  return allowedRoles.includes(user.role);
};

export const Can: React.FC<CanProps> = ({ role, children, fallback = null }) => {
  const { isLoading } = useAuth();
  const allowed = useCan(role);

  // Si todavía está cargando la sesión de Supabase, no renderizamos nada para evitar errores
  if (isLoading) return null;

  return <>{allowed ? children : fallback}</>;
};
