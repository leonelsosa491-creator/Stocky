import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface CanProps {
  role: Role | Role[];
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ role, children }) => {
  const { user, isLoading } = useAuth();

  // Si todavía está cargando la sesión de Supabase, no renderizamos nada para evitar errores
  if (isLoading || !user) {
    return null;
  }

  const userRole = user.role;
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  return null;
};