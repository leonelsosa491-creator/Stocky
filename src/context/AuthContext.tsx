import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Role } from '../types';
import { supabase } from '../supabase/supabaseClient';

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
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (allowedRoles: Role[]) => boolean;
  isDeveloper: boolean;
  isAdmin: boolean;
  isVendedora: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Ahora recibimos el authUser completo para poder leer sus metadatos
  const fetchProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // Si el error es distinto a "No se encontraron filas", lo lanzamos
      if (error && error.code !== 'PGRST116') throw error;

      // Extraemos los metadatos donde guardamos tu foto y tu nombre real
      const metadata = authUser.user_metadata || {};

      setUser({
        id: authUser.id,
        // Prioridad 1: Tu nombre personalizado. Prioridad 2: El de la tabla. Prioridad 3: Tu correo.
        name: metadata.name || data?.nombre_completo || authUser.email.split('@')[0],
        email: authUser.email,
        role: (data?.rol as Role) || 'vendedora',
        status: data?.estado || 'activo',
        avatar: metadata.avatar, // <-- AQUÍ CONECTAMOS EL AVATAR
        lastActive: 'En línea',
      });
    } catch (err) {
      console.error('Error al cargar perfil de Supabase:', err);
      
      const metadata = authUser.user_metadata || {};
      
      // Fallback seguro usando tus metadatos si falla la tabla perfiles
      setUser({
        id: authUser.id,
        name: metadata.name || authUser.email.split('@')[0],
        email: authUser.email,
        role: 'vendedora', 
        avatar: metadata.avatar,
        status: 'activo',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Inicialización de sesión real con Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Le pasamos el objeto user completo en vez de solo id y email
        fetchProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '',
      });
      
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError('Correo o contraseña incorrectos.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
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