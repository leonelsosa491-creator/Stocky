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

  // Función para buscar el perfil real en tu base de datos de Supabase
  const fetchProfile = async (authId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', authId)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: authId,
          name: data.nombre_completo || email.split('@')[0],
          email: email,
          role: data.rol as Role,
          status: data.estado || 'activo',
          lastActive: 'En línea',
        });
      }
    } catch (err) {
      console.error('Error al cargar perfil de Supabase:', err);
      // Solo en caso de error grave, asigna un rol seguro para no bloquear la app
      setUser({
        id: authId,
        name: email.split('@')[0],
        email: email,
        role: 'vendedora', 
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
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email!);
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