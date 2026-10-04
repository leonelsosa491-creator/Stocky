import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Role, AppUser } from '../types';
import { INITIAL_USERS } from '../data/mockData';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  status: 'activo' | 'inactivo';
  lastActive?: string;
}

export interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /**
   * Autenticación con email y contraseña.
   * Listo para conectar con: supabase.auth.signInWithPassword({ email, password })
   */
  login: (email: string, password?: string) => Promise<boolean>;
  /**
   * Cierre de sesión.
   * Listo para conectar con: supabase.auth.signOut()
   */
  logout: () => Promise<void>;
  /**
   * Función para cambiar o emular rápidamente un rol en el frontend
   */
  loginWithRole: (role: Role) => Promise<void>;
  /**
   * Helper para verificar si el usuario tiene uno de los roles permitidos
   */
  hasRole: (allowedRoles: Role[]) => boolean;
  /**
   * Helpers rápidos por rol
   */
  isDeveloper: boolean;
  isAdmin: boolean;
  isVendedora: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'stocky_auth_user_session_v1';

// Mocks de usuarios para demostración de 3 roles
export const DEMO_CREDENTIALS: Record<Role, { email: string; pass: string; name: string; description: string }> = {
  developer: {
    email: 'dev@indumentaria-aries.com',
    pass: 'admin123',
    name: 'Lucas V. (Dev)',
    description: 'SuperAdmin / Acceso total al sistema y base de datos',
  },
  admin: {
    email: 'melina@indumentaria-aries.com',
    pass: 'boutique2026',
    name: 'Melina Gómez',
    description: 'Dueña / Administradora del negocio y reportes',
  },
  vendedora: {
    email: 'sofia.ventas@indumentaria-aries.com',
    pass: 'ventas2026',
    name: 'Sofía Martínez',
    description: 'Vendedora / Gestión de catálogo, ventas y reservas',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inicialización de sesión desde localStorage o sesión por defecto (Admin)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email && parsed.role) {
          setUser(parsed);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Error reading auth session from storage:', e);
    }

    // Por defecto, iniciamos sesión como Admin para una experiencia fluida
    const defaultUser: User = {
      id: INITIAL_USERS[0].id,
      name: INITIAL_USERS[0].name,
      email: INITIAL_USERS[0].email,
      role: 'admin',
      avatar: INITIAL_USERS[0].avatar,
      status: 'activo',
      lastActive: 'En línea',
    };
    setUser(defaultUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUser));
    setIsLoading(false);

    /**
     * CONEXIÓN CON SUPABASE EN PRODUCCIÓN:
     * 
     * useEffect(() => {
     *   // Obtener sesión inicial
     *   supabase.auth.getSession().then(({ data: { session } }) => {
     *     if (session?.user) {
     *       // Obtener rol desde metadata o tabla 'profiles'
     *       const role = (session.user.user_metadata?.role as Role) || 'vendedora';
     *       setUser({
     *         id: session.user.id,
     *         email: session.user.email!,
     *         name: session.user.user_metadata?.full_name || 'Usuario',
     *         role: role,
     *         status: 'activo',
     *       });
     *     }
     *     setIsLoading(false);
     *   });
     *
     *   // Escuchar cambios de autenticación en tiempo real
     *   const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
     *     if (session?.user) {
     *       const role = (session.user.user_metadata?.role as Role) || 'vendedora';
     *       setUser({ ... });
     *     } else {
     *       setUser(null);
     *     }
     *   });
     *   return () => subscription.unsubscribe();
     * }, []);
     */
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    // Simulación de latencia de red (250ms)
    await new Promise((resolve) => setTimeout(resolve, 250));

    const cleanEmail = email.trim().toLowerCase();

    // Determinar rol según credencial o usuario registrado
    let matchedUser = INITIAL_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    let assignedRole: Role = 'vendedora';

    if (cleanEmail.includes('dev') || cleanEmail.includes('soporte.tech')) {
      assignedRole = 'developer';
    } else if (cleanEmail.includes('melina') || cleanEmail.includes('admin') || cleanEmail.includes('dueña')) {
      assignedRole = 'admin';
    } else if (matchedUser) {
      assignedRole = matchedUser.role;
    }

    const authUser: User = {
      id: matchedUser ? matchedUser.id : `USR-${Date.now().toString().slice(-4)}`,
      name: matchedUser ? matchedUser.name : (cleanEmail.split('@')[0].toUpperCase()),
      email: cleanEmail,
      role: assignedRole,
      avatar: matchedUser?.avatar || (assignedRole === 'developer'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
        : assignedRole === 'admin'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'),
      status: 'activo',
      lastActive: 'En línea ahora',
    };

    setUser(authUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } catch (e) {
      console.warn('Could not persist session:', e);
    }

    setIsLoading(false);
    return true;
  };

  const loginWithRole = async (targetRole: Role): Promise<void> => {
    setIsLoading(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 150));

    const demo = DEMO_CREDENTIALS[targetRole];
    const authUser: User = {
      id: targetRole === 'developer' ? 'USR-03' : targetRole === 'admin' ? 'USR-01' : 'USR-02',
      name: demo.name,
      email: demo.email,
      role: targetRole,
      avatar: targetRole === 'developer'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
        : targetRole === 'admin'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      status: 'activo',
      lastActive: 'En línea ahora',
    };

    setUser(authUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } catch (e) {
      console.warn('Could not persist session:', e);
    }
    setIsLoading(false);
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear auth storage:', e);
    }
    setIsLoading(false);
  };

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const clearError = () => setError(null);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: user ? user.role : null,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      logout,
      loginWithRole,
      hasRole,
      isDeveloper: user?.role === 'developer',
      isAdmin: user?.role === 'admin',
      isVendedora: user?.role === 'vendedora',
      clearError,
    }),
    [user, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
