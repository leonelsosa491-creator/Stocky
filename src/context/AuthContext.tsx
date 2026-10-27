import React, { createContext, useContext, useState, useEffect } from 'react';
// @ts-ignore - Ignoramos validación de tipos si supabaseClient es .js puro
import { supabase, setRecordarSesion } from '../supabase/supabaseClient';
import { AppUser, Role } from '../types';

interface RegisterExtra {
  businessName?: string; // Dueña/o: nombre de la indumentaria (crea una boutique nueva)
  invitationCode?: string; // Encargada/o o empleada/o: se une a una boutique existente
  firstName?: string;
  lastName?: string;
  username?: string;
}

interface AuthContextType {
  user: AppUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string, remember?: boolean) => Promise<string>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: Role, // Se ignora: el rol lo define el servidor (dueña/o = admin, o el del código)
    extra?: RegisterExtra
  ) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (identifier: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const CUENTA_DESACTIVADA = 'Tu cuenta fue desactivada. Contactá a la administración de tu boutique.';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // El rol y la boutique se leen de la tabla "perfiles" (no de la metadata del
  // navegador, que cualquiera puede modificar).
  // Devuelve null (y cierra la sesión) si la cuenta fue desactivada desde Gestión de equipo.
  const cargarUsuario = async (sbUser: any): Promise<AppUser | null> => {
    const email = sbUser.email || '';
    const columnas = 'rol, username, nombre, apellido, boutique_id, boutiques(nombre)';

    let { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select(`${columnas}, activo`)
      .eq('id', sbUser.id)
      .maybeSingle();
    if (perfilError) {
      // Compatibilidad: la columna "activo" todavía no existe (migración sin correr)
      ({ data: perfil } = await supabase.from('perfiles').select(columnas).eq('id', sbUser.id).maybeSingle());
    }

    if (perfil?.activo === false) {
      await supabase.auth.signOut();
      return null;
    }

    const boutique = Array.isArray(perfil?.boutiques) ? perfil?.boutiques[0] : perfil?.boutiques;
    const nombreCompleto = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ');

    return {
      id: sbUser.id,
      name: nombreCompleto || sbUser.user_metadata?.name || email.split('@')[0] || 'Usuario',
      email,
      role: (perfil?.rol as Role) || 'vendedora', // Sin perfil: el rol con menos permisos
      username: perfil?.username ?? undefined,
      boutiqueId: perfil?.boutique_id ?? undefined,
      businessName: boutique?.nombre ?? undefined,
      status: 'activo',
    };
  };

  useEffect(() => {
    let activo = true;

    // 1. Revisar sesión activa al abrir la app
    supabase.auth.getSession().then(async (response: any) => {
      const session = response?.data?.session;
      if (session?.user) {
        const u = await cargarUsuario(session.user);
        if (activo) setUser(u);
      }
      if (activo) setIsLoading(false);
    });

    // 2. Escuchar cambios de login/registro/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        // setTimeout: no se deben hacer consultas a Supabase dentro de este callback
        setTimeout(async () => {
          const u = await cargarUsuario(session.user);
          if (activo) {
            setUser(u);
            setIsLoading(false);
          }
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  // Busca el correo asociado a un usuario (función SQL get_email_by_username)
  const findEmailByUsername = async (username: string): Promise<string | null> => {
    const { data, error } = await supabase.rpc('get_email_by_username', {
      p_username: username.trim(),
    });
    if (error) throw error;
    return (data as string | null) || null;
  };

  // Acepta usuario o correo. Devuelve el nombre del usuario autenticado.
  const login = async (identifier: string, password: string, remember = true): Promise<string> => {
    setRecordarSesion(remember);
    const value = identifier.trim();
    let email = value;

    if (!value.includes('@')) {
      const found = await findEmailByUsername(value);
      if (!found) throw new Error('Usuario o contraseña incorrectos.');
      email = found;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Usuario o contraseña incorrectos.');
      }
      throw error;
    }
    if (!data.user) throw new Error('No se pudo obtener el usuario autenticado.');
    const u = await cargarUsuario(data.user);
    if (!u) throw new Error(CUENTA_DESACTIVADA);
    setUser(u);
    return u.name;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    _role?: Role,
    extra: RegisterExtra = {}
  ) => {
    const username = extra.username?.trim().toLowerCase();
    if (username) {
      const taken = await findEmailByUsername(username);
      if (taken) throw new Error('Ese usuario ya está en uso.');
    }

    // Con código de invitación: se valida antes de crear la cuenta
    const invitationCode = extra.invitationCode?.trim().toUpperCase();
    if (invitationCode) {
      const { data: invitacion, error: invError } = await supabase.rpc('validar_invitacion', {
        p_codigo: invitationCode,
      });
      if (invError) throw invError;
      if (!invitacion) throw new Error('Código de invitación inválido o vencido.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          business_name: invitationCode ? undefined : extra.businessName,
          invitation_code: invitationCode,
          first_name: extra.firstName,
          last_name: extra.lastName,
          username,
        },
      },
    });
    if (error) throw error;
    if (!data.session) {
      throw new Error('Cuenta creada. Revisá tu correo para confirmarla y luego iniciá sesión.');
    }
    if (data.user) {
      setUser(await cargarUsuario(data.user));
    }
  };

  // Envía el correo de recuperación. No revela si la cuenta existe o no.
  const requestPasswordReset = async (identifier: string) => {
    const value = identifier.trim();
    const email = value.includes('@') ? value : await findEmailByUsername(value);
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-clave`,
    });
    if (error) {
      if (error.message?.toLowerCase().includes('rate limit')) {
        throw new Error('Se enviaron demasiados correos. Esperá unos minutos y volvé a intentar.');
      }
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
