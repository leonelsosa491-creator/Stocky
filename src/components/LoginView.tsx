import React, { useState } from 'react';
import {
  Store,
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound
} from 'lucide-react';
// Importamos la ropa específica y detallada
import {
  GiUnderwear,      // Lencería
  GiHighHeel,       // Tacos
  GiRunningShoe,    // Zapatillas
  GiSkirt,          // Faldas
  GiAmpleDress,     // Vestidos
  GiTrousers,       // Pantalones
  GiHandBag,        // Carteras
  GiPoloShirt       // Chombas
} from 'react-icons/gi';
import { FaShirt, FaSocks, FaGlasses, FaHatCowboy } from 'react-icons/fa6';
import type { IconType } from 'react-icons'; // Tipo para TypeScript

import { useAuth } from '../context/AuthContext';
// Importamos el logo unificado desde assets
import stockyLogoClaro from '../assets/logo-stocky-claro.png';
// @ts-ignore
import { getRecordarSesion } from '../supabase/supabaseClient';

interface LoginViewProps {
  onLoginSuccess: (name: string) => void;
  onBackToApp: () => void;
}

// Filas de prendas del fondo: se mueven en horizontal, cada una a su velocidad y dirección
const FILAS: { dir: 'left' | 'right'; segundos: number; size: number; iconos: IconType[] }[] = [
  { dir: 'left', segundos: 120, size: 60, iconos: [FaShirt, GiHighHeel, GiHandBag, FaGlasses, GiUnderwear, GiRunningShoe, FaShirt] },
  { dir: 'right', segundos: 90, size: 96, iconos: [GiAmpleDress, GiTrousers, FaSocks, GiSkirt, GiPoloShirt, FaHatCowboy] },
  { dir: 'left', segundos: 70, size: 48, iconos: [GiUnderwear, FaShirt, GiHandBag, GiHighHeel, FaGlasses, GiTrousers] },
  { dir: 'right', segundos: 140, size: 72, iconos: [GiRunningShoe, GiAmpleDress, FaShirt, FaSocks, GiPoloShirt, GiSkirt] },
];

// Estrellas de la cabecera de la tarjeta
const ESTRELLAS = [
  { top: '16px', left: '40px', size: 4, dur: 3, delay: 0 },
  { top: '32px', left: '25%', size: 6, dur: 4, delay: 1 },
  { top: '48px', right: '33%', size: 4, dur: 2.5, delay: 0.5 },
  { top: '24px', right: '40px', size: 8, dur: 5, delay: 2 },
  { bottom: '40px', left: '64px', size: 4, dur: 3.5, delay: 1.5 },
  { bottom: '48px', right: '64px', size: 6, dur: 4.5, delay: 0.2 },
];

// Las animaciones solo corren si la persona no pidió "reducir movimiento"
const ANIMACIONES = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes stocky-marquee-left  { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
  @keyframes stocky-marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
  @keyframes stocky-twinkle { 0%, 100% { opacity: .2; transform: scale(.8); } 50% { opacity: .85; transform: scale(1.2); } }
  .stocky-row-left  { animation: stocky-marquee-left  var(--d) linear infinite; will-change: transform; }
  .stocky-row-right { animation: stocky-marquee-right var(--d) linear infinite; will-change: transform; }
  .stocky-star { animation: stocky-twinkle var(--d) ease-in-out infinite; }
}`;

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onBackToApp }) => {
  const { login, register, requestPasswordReset } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasInvite, setHasInvite] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recordar, setRecordar] = useState<boolean>(() => getRecordarSesion());
  const [isRecovering, setIsRecovering] = useState(false);
  const [notice, setNotice] = useState('');

  const compact = isRegistering || isRecovering;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsLoading(true);

    if (isRecovering) {
      try {
        await requestPasswordReset(email);
        setNotice('Si la cuenta existe, te enviamos un correo con un enlace para crear una nueva contraseña.');
      } catch (err: any) {
        setError(err?.message || 'No se pudo enviar el correo de recuperación.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      let loggedName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (isRegistering) {
        await register(`${firstName.trim()} ${lastName.trim()}`, email, password, undefined, {
          businessName: hasInvite ? undefined : businessName.trim(),
          invitationCode: hasInvite ? inviteCode.trim() : undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
        });
      } else {
        loggedName = await login(email, password, recordar);
      }
      onLoginSuccess(loggedName);
      onBackToApp();
    } catch (err: any) {
      setError(
        err?.message ||
          (isRegistering ? 'No se pudo crear la cuenta.' : 'Correo o contraseña incorrectos.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setIsRecovering(false);
    setHasInvite(false);
    setError('');
    setNotice('');
  };

  const toggleRecovering = () => {
    setIsRecovering(!isRecovering);
    setError('');
    setNotice('');
  };

  const toggleInvite = () => {
    setHasInvite(!hasInvite);
    setError('');
  };

  const inputClass =
    'block w-full pl-11 pr-4 py-3.5 bg-[#f3f4f6] border border-transparent rounded-full text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6b46c1]/30 focus:border-[#6b46c1]/50 focus:bg-white transition-all duration-200';

  const iconClass =
    'absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none';

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 antialiased">
      <style>{ANIMACIONES}</style>

      {/* ===== Fondo: prendas que se mueven en horizontal ===== */}
      <div
        className="pointer-events-none fixed inset-0 z-0 flex flex-col justify-evenly overflow-hidden bg-gradient-to-br from-[#2e1065] to-[#4c1d95]"
        aria-hidden="true"
      >
        {FILAS.map((fila, i) => (
          <div
            key={i}
            className={`flex w-max ${fila.dir === 'left' ? 'stocky-row-left' : 'stocky-row-right'}`}
            style={{ '--d': `${fila.segundos}s` } as React.CSSProperties & { '--d': string }}
          >
            {[0, 1].map((copia) => (
              <div key={copia} className="flex w-[200vw] shrink-0 items-center justify-around">
                {fila.iconos.map((Icono, j) => (
                  <Icono key={j} size={fila.size} className="text-white opacity-[0.07]" />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ===== Tarjeta ===== */}
      <div className="relative z-10 my-4 flex w-full max-w-[420px] flex-col overflow-hidden rounded-[2rem] bg-transparent shadow-2xl shadow-black/30">
        
        {/* Cabecera: degradado, estrellas, logo y onda */}
        <div
          className={`relative overflow-hidden bg-gradient-to-b from-[#3b2073] to-[#764aba] transition-all duration-300 ${
            compact ? 'pb-12 pt-7' : 'pb-14 pt-10'
          }`}
        >
          {ESTRELLAS.map((s, i) => {
            const { size, dur, delay, ...pos } = s;
            return (
              <span
                key={i}
                className="stocky-star absolute rounded-full bg-white"
                style={
                  {
                    ...pos,
                    width: size,
                    height: size,
                    opacity: 0.5,
                    animationDelay: `${delay}s`,
                    '--d': `${dur}s`,
                  } as React.CSSProperties & { '--d': string }
                }
              />
            );
          })}

          {/* Logo centrado */}
          <div className="relative z-10 flex items-center justify-center px-6">
            <img 
              src={stockyLogoClaro} 
              alt="Stocky" 
              className="h-16 w-auto object-contain drop-shadow-lg pointer-events-none transition-all duration-300 scale-110" 
            />
          </div>

          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block h-[40px] w-full" aria-hidden="true">
              <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118,137.9,114,203.4,98.66,243.6,89.17,282.88,72.6,321.39,56.44Z"
                className="fill-[#8b5cf6]/40"
              />
              <path
                d="M0,73.97c80-24.8,160-50.56,240-50.56s160,25.76,240,50.56,160,50.56,240,50.56,160-25.76,240-50.56,160-50.56,240-50.56V120H0Z"
                className="fill-white"
              />
            </svg>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white px-8 pb-8 pt-2">
          <h2 className={`font-heading text-[1.7rem] font-bold tracking-tight text-slate-900 ${compact ? 'mb-6' : 'mb-8'}`}>
            {isRegistering ? 'Crear cuenta' : isRecovering ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </h2>

          <form className={compact ? 'space-y-3.5' : 'space-y-5'} onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                {hasInvite ? (
                  <div className="relative">
                    <KeyRound className={iconClass} />
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      spellCheck={false}
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className={`${inputClass} tracking-widest`}
                      placeholder="Código de invitación"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Store className={iconClass} />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className={inputClass}
                      placeholder="Nombre de la indumentaria"
                    />
                  </div>
                )}
                <div className="relative">
                  <User className={iconClass} />
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                    placeholder={hasInvite ? 'Nombre' : 'Nombre de la propietaria/o'}
                  />
                </div>
                <div className="relative">
                  <User className={iconClass} />
                  <input
                    type="text"
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                    placeholder={hasInvite ? 'Apellido' : 'Apellido de la propietaria/o'}
                  />
                </div>
                <div className="relative">
                  <AtSign className={iconClass} />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                    className={inputClass}
                    placeholder="Usuario"
                  />
                </div>
              </>
            )}

            <div className="relative">
              {isRegistering ? <Mail className={iconClass} /> : <User className={iconClass} />}
              <input
                type={isRegistering ? 'email' : 'text'}
                required
                autoComplete={isRegistering ? 'email' : 'username'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder={isRegistering ? 'Correo electrónico' : 'Usuario o correo electrónico'}
              />
            </div>

            {isRecovering && (
              <p className="px-2 text-sm text-slate-500">
                Ingresá tu usuario o correo y te enviaremos un enlace para crear una nueva contraseña.
              </p>
            )}

            {!isRecovering && (
              <div className="relative">
                <Lock className={iconClass} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600 focus:text-[#6b46c1] focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            )}

            {!isRegistering && !isRecovering && (
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-2 pt-1">
                <label className="flex cursor-pointer select-none items-center whitespace-nowrap text-[13px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={recordar}
                    onChange={(e) => setRecordar(e.target.checked)}
                    className="mr-2.5 h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#6b46c1]"
                  />
                  Recordar mi sesión
                </label>
                <button
                  type="button"
                  onClick={toggleRecovering}
                  className="cursor-pointer whitespace-nowrap text-[13px] font-semibold text-[#6b46c1] transition-colors hover:text-[#4c1d95]"
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
            )}

            {error && <p className="px-2 text-sm text-rose-600">{error}</p>}
            {notice && <p className="px-2 text-sm text-emerald-600">{notice}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#6b46c1] py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_0_rgba(107,70,193,0.39)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4c1d95] hover:shadow-[0_6px_20px_rgba(107,70,193,0.23)] disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>{isRegistering ? 'CREAR CUENTA' : isRecovering ? 'ENVIAR ENLACE' : 'INGRESAR'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pie de la tarjeta */}
        <div className="space-y-1.5 border-t border-slate-100 bg-slate-50 p-6 text-center text-[14px] text-slate-500">
          {isRegistering && (
            <p>
              <button
                type="button"
                onClick={toggleInvite}
                className="cursor-pointer font-semibold text-[#6b46c1] transition-colors hover:text-[#4c1d95]"
              >
                {hasInvite ? 'Quiero registrar mi propia boutique' : 'Tengo un código de invitación'}
              </button>
            </p>
          )}

          {isRecovering && (
            <p>
              <button
                type="button"
                onClick={toggleRecovering}
                className="cursor-pointer font-semibold text-[#6b46c1] transition-colors hover:text-[#4c1d95]"
              >
                Volver a iniciar sesión
              </button>
            </p>
          )}

          <p>
            {isRegistering ? '¿Ya tenés cuenta? ' : '¿No tenés cuenta? '}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1 cursor-pointer font-semibold text-[#6b46c1] transition-colors hover:text-[#4c1d95]"
            >
              {isRegistering ? 'Iniciá sesión' : 'Registrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};