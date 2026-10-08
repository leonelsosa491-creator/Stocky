import { supabase } from '../supabase/supabaseClient';
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginViewProps {
  onLoginSuccess?: (email: string) => void;
  onBackToApp?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onBackToApp,
}) => {
  // Ahora traemos el error directo desde nuestro AuthContext
  const { login, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [requestAccessModal, setRequestAccessModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [accessEmail, setAccessEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Por favor ingresa tu correo electrónico.');
      return;
    }
    
    if (!password) {
      setLocalError('Por favor ingresa tu contraseña.');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        if (onLoginSuccess) {
          onLoginSuccess(email);
        }
        navigate(from, { replace: true });
      } else {
        // Si Supabase devuelve false, mostramos el error para que no se quede mudo
        setLocalError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setLocalError(errorMsg);
    }
  };

  // Usamos el error local o el que venga del contexto
  const displayError = localError || authError;

  return (
    <div className="relative w-full min-h-screen bg-[#f8f9ff] flex overflow-x-hidden font-body">
      
      <div className="flex w-full min-h-screen">
        <div className="hidden lg:flex w-1/2 relative bg-[#42308f] items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center mix-blend-overlay opacity-30 scale-105"
            style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#2a1d63] via-[#42308f] to-[#5a49a8] opacity-95 z-10" />

          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="z-20 p-12 flex flex-col justify-between h-full w-full max-w-xl text-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="font-heading font-extrabold text-xl tracking-tight text-white block">
                  Stocky Boutique
                </span>
                <span className="text-[11px] font-medium text-white/70 tracking-wide uppercase">
                  Aries Indumentaria
                </span>
              </div>
            </div>

            <div className="my-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Gestión de Stock & Roles de Boutique</span>
              </div>

              <h1 className="font-heading text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                Control preciso de tu catálogo y stock.
              </h1>

              <p className="text-white/80 text-sm leading-relaxed max-w-md">
                Acceso escalonado para Dueña, Desarrollador y Equipo de Ventas. Preparado para autenticación segura en tiempo real con Supabase.
              </p>
            </div>

            <div className="text-xs text-white/60 font-medium">
              Aries Indumentaria © 2026 · Versión con Enrutamiento Escalonado
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col items-center justify-between p-6 sm:p-10 lg:p-12 bg-[#f8f9ff] overflow-y-auto">
          <div className="w-full max-w-md my-auto flex flex-col gap-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex lg:hidden items-center justify-center w-14 h-14 rounded-2xl bg-[#42308f] text-white mb-3 shadow-md">
                <Store className="w-7 h-7" />
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
                Iniciar Sesión
              </h2>
              <p className="text-xs sm:text-sm text-[#5e5d69] mt-1 font-medium">
                Ingresa con tus credenciales asignadas para acceder a tu panel de boutique.
              </p>
            </div>

            {displayError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#c9c4d3]/40 card-shadow p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="text-xs font-bold text-[#0b1c30] tracking-wide"
                >
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#797583] group-focus-within:text-[#42308f] transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lucerolasala@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#c9c4d3]/60 bg-[#f8f9ff] focus:bg-white focus:border-[#42308f] focus:ring-2 focus:ring-[#42308f]/20 outline-none transition-all text-xs sm:text-sm text-[#0b1c30] placeholder:text-[#797583]/50 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="login-password"
                    className="text-xs font-bold text-[#0b1c30] tracking-wide"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Se ha enviado un enlace de recuperación al correo')}
                    className="text-[11px] font-semibold text-[#42308f] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#797583] group-focus-within:text-[#42308f] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-2xl border border-[#c9c4d3]/60 bg-[#f8f9ff] focus:bg-white focus:border-[#42308f] focus:ring-2 focus:ring-[#42308f]/20 outline-none transition-all text-xs sm:text-sm text-[#0b1c30] placeholder:text-[#797583]/50 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#797583] hover:text-[#0b1c30] transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="remember-device"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#42308f] bg-white border-[#c9c4d3] rounded focus:ring-[#42308f] cursor-pointer accent-[#42308f]"
                />
                <label
                  htmlFor="remember-device"
                  className="text-xs text-[#5e5d69] font-medium cursor-pointer select-none"
                >
                  Recordar mi sesión en este dispositivo
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-6 bg-[#42308f] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#5a49a8] hover:shadow-lg hover:shadow-[#42308f]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Iniciando sesión...</span>
                ) : (
                  <>
                    <span>INGRESAR AL SISTEMA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setRequestSent(false);
                  setRequestAccessModal(true);
                }}
                className="text-xs font-bold text-[#42308f] hover:underline cursor-pointer"
              >
                ¿Aún no tienes cuenta? Solicitar Acceso
              </button>
            </div>

            <div className="text-center text-[11px] text-[#797583]">
              Stocky Aries Boutique · Conectividad Supabase Ready · 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};