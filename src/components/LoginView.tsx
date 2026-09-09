import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
  onBackToApp: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onBackToApp,
}) => {
  const [email, setEmail] = useState('melina@indumentaria-aries.com');
  const [password, setPassword] = useState('boutique2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [requestAccessModal, setRequestAccessModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [accessEmail, setAccessEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess(email);
  };

  return (
    <div className="relative w-full h-screen min-h-[650px] bg-[#f8f9ff] flex overflow-hidden font-body">
      {/* Quick link to return to Dashboard */}
      <button
        onClick={onBackToApp}
        className="absolute top-4 right-4 z-50 inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md border border-[#c9c4d3]/60 rounded-full text-xs font-bold text-[#42308f] hover:bg-[#eff4ff] shadow-sm transition-all active:scale-95"
      >
        <Store className="w-3.5 h-3.5" />
        Ir al Panel de Inventario
      </button>

      <div className="flex w-full h-full">
        {/* Left Image/Branding Side (Hidden on Mobile) */}
        <div className="hidden lg:flex w-1/2 relative bg-[#cbdbf5] items-center justify-center overflow-hidden">
          {/* Background Image with Brand Tint */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center mix-blend-multiply opacity-85 scale-105 transition-transform duration-1000"
            style={{
              backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKFSYU_zgDXuzsxqLthkOHQqOUUAEEhM0E8o0dVXfJx5nIrXZMWRgFfyjaZekwJJPiHSe9kW8jjHGvsi2eoP4CFk0NlH_hH7n2hb1-OcGbsrj0W8pzm1vOEhM4zNZDeIqI3gwSTzaRhCK4_qIB0VL6Bpo2PsWKm7Zm-fLeYrsEAOWr371MfV52I4iDXzj46xGRW1Vl0wUP-HbaYdPIHP96fvxOjx1FgwaO2nBjA81HD9RtGL-jlThg")`,
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#42308f]/85 via-[#42308f]/40 to-transparent z-10" />

          {/* Branding Content */}
          <div className="z-20 p-12 flex flex-col h-full w-full max-w-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-heading font-bold text-lg tracking-wide text-white">
                Aries Indumentaria
              </span>
            </div>

            <div className="flex flex-col items-center justify-center h-full w-full text-center px-4">
              <h1 className="font-heading text-4xl xl:text-5xl font-extrabold text-white drop-shadow-md leading-tight">
                ¡Es un placer tenerte de vuelta!
              </h1>
              <p className="text-white/80 text-sm mt-4 max-w-md font-medium">
                Gestión inteligente de stock, talles y colecciones para tu tienda boutique.
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-between p-6 sm:p-10 lg:p-12 bg-[#f8f9ff] relative overflow-y-auto">
          {/* Decorative backdrop gradient on mobile */}
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-[#cbdbf5]/50 to-transparent lg:hidden pointer-events-none" />

          <div className="w-full max-w-md my-auto bg-white rounded-3xl border border-[#c9c4d3]/30 card-shadow p-8 sm:p-10 z-10 relative flex flex-col gap-6">
            {/* Logo & Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#5a49a8] text-white mb-4 shadow-md">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#42308f]">
                Stocky
              </h2>
              <p className="text-sm text-[#484552] font-medium">
                Boutique Aries
              </p>
              <p className="text-[11px] font-bold text-[#797583] uppercase tracking-wider mt-2">
                INICIO DE SESIÓN
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-bold text-[#0b1c30] tracking-wide"
                >
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#797583] group-focus-within:text-[#42308f] transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#c9c4d3]/60 bg-[#f8f9ff] focus:bg-white focus:border-[#42308f] focus:ring-2 focus:ring-[#42308f]/20 outline-none transition-all text-sm text-[#0b1c30] placeholder:text-[#797583]/50 font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    className="text-xs font-bold text-[#0b1c30] tracking-wide"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Se ha enviado un enlace de recuperación a tu correo')}
                    className="text-[11px] font-semibold text-[#42308f] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#797583] group-focus-within:text-[#42308f] transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-2xl border border-[#c9c4d3]/60 bg-[#f8f9ff] focus:bg-white focus:border-[#42308f] focus:ring-2 focus:ring-[#42308f]/20 outline-none transition-all text-sm text-[#0b1c30] placeholder:text-[#797583]/50 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#797583] hover:text-[#0b1c30] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#42308f] bg-white border-[#c9c4d3] rounded focus:ring-[#42308f] focus:ring-2 cursor-pointer accent-[#42308f]"
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-[#484552] font-medium cursor-pointer select-none"
                >
                  Recordarme en este dispositivo
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-4">
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-[#42308f] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#5a49a8] hover:shadow-lg hover:shadow-[#42308f]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>INICIAR SESIÓN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequestSent(false);
                    setRequestAccessModal(true);
                  }}
                  className="w-full py-2.5 px-6 bg-[#e1deed] text-[#42308f] rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#d2c8ff] transition-all active:scale-[0.98] cursor-pointer"
                >
                  SOLICITAR ACCESO
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="w-full flex flex-col items-center gap-1.5 py-4 text-xs text-[#5e5d69]">
            <p className="text-[11px] text-center">
              © 2026 L&L Development - Stocky. Todos los derechos reservados.
            </p>
            <div className="flex gap-4 text-[11px] font-medium text-[#484552]">
              <button onClick={() => alert('Soporte: ayuda@indumentaria-aries.com')} className="hover:text-[#42308f]">
                Soporte
              </button>
              <span>•</span>
              <button onClick={() => alert('Política de Privacidad de Aries')} className="hover:text-[#42308f]">
                Privacidad
              </button>
              <span>•</span>
              <button onClick={() => alert('Términos de servicio de Aries')} className="hover:text-[#42308f]">
                Términos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Solicitar Acceso Modal */}
      {requestAccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 card-shadow border border-[#c9c4d3]/40">
            {!requestSent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#42308f]">
                  <ShieldCheck className="w-6 h-6" />
                  <h3 className="font-heading font-bold text-lg">Solicitar Acceso a Aries</h3>
                </div>
                <p className="text-xs text-gray-600">
                  Ingresa tu correo corporativo para que la administradora Melina Gómez habilite tu rol en el sistema.
                </p>
                <input
                  type="email"
                  placeholder="nombre@indumentaria-aries.com"
                  value={accessEmail}
                  onChange={(e) => setAccessEmail(e.target.value)}
                  className="w-full px-4 py-2 text-sm border rounded-xl border-gray-300 focus:outline-none focus:border-[#42308f]"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setRequestAccessModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setRequestSent(true)}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#42308f] hover:bg-[#5a49a8] rounded-full"
                  >
                    Enviar Solicitud
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-heading font-bold text-base text-gray-900">
                  ¡Solicitud Enviada!
                </h4>
                <p className="text-xs text-gray-600">
                  Recibirás una notificación una vez aprobado tu acceso.
                </p>
                <button
                  onClick={() => setRequestAccessModal(false)}
                  className="px-6 py-2 text-xs font-bold bg-[#42308f] text-white rounded-full mt-2"
                >
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
