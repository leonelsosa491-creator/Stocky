import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Destino del enlace de "¿Olvidaste tu clave?". Supabase abre la sesión de
// recuperación desde la URL y acá se define la nueva contraseña.
export const RecuperarClaveView: React.FC = () => {
  const { isAuthenticated, isLoading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (clave.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (clave !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setGuardando(true);
    try {
      await updatePassword(clave);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  const inputClass =
    'block w-full pl-11 pr-4 py-3.5 border border-[#e3e5f0] rounded-full text-sm bg-[#f4f5fb] text-[#1a1740] placeholder:text-[#9a9bb0] focus:bg-white focus:outline-none focus:border-[#6a3fd8] focus:ring-2 focus:ring-[#6a3fd8]/20 transition-colors';
  const iconClass = 'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7b7c93]';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f5fb] p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-[#1a1740] mb-2">Nueva contraseña</h1>
        {isLoading ? (
          <p className="text-sm text-[#5e5f78]">Verificando enlace…</p>
        ) : !isAuthenticated ? (
          <>
            <p className="text-sm text-[#5e5f78] mb-6">
              El enlace de recuperación es inválido o venció. Pedí uno nuevo desde la pantalla de inicio de sesión.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="font-semibold text-[#6a3fd8] hover:underline cursor-pointer"
            >
              Volver a iniciar sesión
            </button>
          </>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <p className="text-sm text-[#5e5f78]">Elegí una contraseña nueva para tu cuenta.</p>
            <div className="relative">
              <Lock className={iconClass} />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className={inputClass}
                placeholder="Nueva contraseña"
              />
            </div>
            <div className="relative">
              <Lock className={iconClass} />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className={inputClass}
                placeholder="Repetir contraseña"
              />
            </div>
            {error && <p className="text-sm text-rose-600 px-2">{error}</p>}
            <button
              type="submit"
              disabled={guardando}
              className="w-full flex justify-center items-center gap-2 py-3.5 rounded-full text-sm font-bold tracking-wide text-white bg-[#6a3fd8] hover:bg-[#5a30c4] disabled:opacity-70 transition-all cursor-pointer"
            >
              {guardando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  GUARDAR CONTRASEÑA
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
