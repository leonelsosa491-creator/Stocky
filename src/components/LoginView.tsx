import React, { useState } from 'react';
import { Store, User, AtSign, Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import stockyLogo from '../assets/logo-stocky-recortado.png';
import stockyLogoClaro from '../assets/logo-stocky-claro.png';
// @ts-ignore - supabaseClient es .js puro
import { getRecordarSesion } from '../supabase/supabaseClient';

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
  onBackToApp: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onBackToApp }) => {
  const { login, register, requestPasswordReset } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  // En el registro: false = dueña/o que crea su boutique, true = se une con un código de invitación
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
      let loggedEmail = email;
      if (isRegistering) {
        // El rol lo define el servidor: dueña/o = admin, o el rol del código de invitación
        await register(`${firstName.trim()} ${lastName.trim()}`, email, password, undefined, {
          businessName: hasInvite ? undefined : businessName.trim(),
          invitationCode: hasInvite ? inviteCode.trim() : undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
        });
      } else {
        loggedEmail = await login(email, password, recordar);
      }
      onLoginSuccess(loggedEmail);
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
    'block w-full pl-11 pr-4 py-3.5 border border-[#e3e5f0] rounded-full text-sm bg-[#f4f5fb] text-[#1a1740] placeholder:text-[#9a9bb0] focus:bg-white focus:outline-none focus:border-[#6a3fd8] focus:ring-2 focus:ring-[#6a3fd8]/20 transition-colors';

  const iconClass =
    'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7b7c93] pointer-events-none';

  return (
    <div className="min-h-screen flex bg-[#f5f6fc]">
      {/* Panel izquierdo */}
      <aside className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#5a3aa8] via-[#4a2f96] to-[#3a2682] text-white px-14 py-14">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.10] pointer-events-none"
          viewBox="0 0 800 1000"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          stroke="white"
          strokeWidth="1"
          aria-hidden="true"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <path
              key={i}
              d={`M-50 ${650 + i * 28} C 150 ${600 + i * 28}, 300 ${760 + i * 28}, 500 ${690 + i * 28} S 750 ${620 + i * 28}, 850 ${700 + i * 28}`}
            />
          ))}
        </svg>

        <img
          src={stockyLogoClaro}
          alt="Stocky"
          className="relative w-[clamp(130px,12vw,240px)] h-auto self-start select-none"
          draggable={false}
        />

        <div className="relative max-w-xl">
          <h2 className="font-heading text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight">
            Control preciso de tu catálogo y stock.
          </h2>
          <p className="mt-6 text-xl xl:text-2xl font-light leading-snug text-[#cdbdf5] max-w-md">
            Gestioná tus prendas, variantes y ventas en tiempo real.
          </p>
        </div>

        <div />
      </aside>

      {/* Formulario */}
      <main className="flex-1 flex flex-col justify-center items-center px-5 py-12 sm:px-10">
        <div className="lg:hidden mb-10">
          <img src={stockyLogo} alt="Stocky" className="h-14 w-auto select-none" draggable={false} />
        </div>

        <div className="w-full max-w-md">
          <h2 className="font-heading text-4xl font-extrabold text-[#1a1740] tracking-tight mb-6">
            {isRegistering ? 'Crear cuenta' : isRecovering ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </h2>

          <div className="bg-white rounded-[2rem] border border-[#e8e9f4] shadow-xl shadow-[#42308f]/5 p-6 sm:p-8">
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                <p className="text-sm text-[#5e5f78] px-2">
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7b7c93] hover:text-[#6a3fd8] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              )}

              {!isRegistering && !isRecovering && (
                <div className="flex items-center justify-between px-2 text-sm">
                  <label className="flex items-center gap-2 text-[#5e5f78] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={recordar}
                      onChange={(e) => setRecordar(e.target.checked)}
                      className="h-4 w-4 rounded border-[#e3e5f0] accent-[#6a3fd8] cursor-pointer"
                    />
                    Recordar mi sesión
                  </label>
                  <button
                    type="button"
                    onClick={toggleRecovering}
                    className="font-semibold text-[#6a3fd8] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
              )}

              {error && <p className="text-sm text-rose-600 px-2">{error}</p>}
              {notice && <p className="text-sm text-emerald-600 px-2">{notice}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 rounded-full text-sm font-bold tracking-wide text-white bg-[#6a3fd8] hover:bg-[#5a30c4] shadow-lg shadow-[#6a3fd8]/25 disabled:opacity-70 active:scale-[0.99] transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegistering ? 'CREAR CUENTA' : isRecovering ? 'ENVIAR ENLACE' : 'INGRESAR'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {isRegistering && (
            <p className="mt-6 text-center text-sm">
              <button
                type="button"
                onClick={toggleInvite}
                className="font-semibold text-[#6a3fd8] hover:underline cursor-pointer"
              >
                {hasInvite ? 'Quiero registrar mi propia boutique' : 'Tengo un código de invitación'}
              </button>
            </p>
          )}

          {isRecovering && (
            <p className="mt-6 text-center text-sm">
              <button
                type="button"
                onClick={toggleRecovering}
                className="font-semibold text-[#6a3fd8] hover:underline cursor-pointer"
              >
                Volver a iniciar sesión
              </button>
            </p>
          )}

          <p className="mt-4 text-center text-sm text-[#5e5f78]">
            {isRegistering ? '¿Ya tenés cuenta? ' : '¿No tenés cuenta? '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-[#6a3fd8] hover:underline cursor-pointer"
            >
              {isRegistering ? 'Iniciá sesión' : 'Registrate'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};
