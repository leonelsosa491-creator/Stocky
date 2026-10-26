import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Check, Trash2, UserPlus } from 'lucide-react';
// @ts-ignore - Ignoramos validación de tipos si supabaseClient es .js puro
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Invitacion } from '../types';

const ROL_LABEL: Record<Invitacion['rol'], string> = {
  admin: 'Encargada/o',
  vendedora: 'Empleada/o',
};

// Panel para generar códigos de invitación. Pegalo en la pantalla de Configuración.
// Solo se muestra a dueñas/os, encargadas/os y developer.
export const InvitacionesPanel: React.FC = () => {
  const { role } = useAuth();
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const puedeInvitar = role === 'admin' || role === 'developer';

  const cargar = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('invitaciones')
      .select('id, codigo, rol, creado_en, expira_en, usado_por')
      .is('usado_por', null)
      .gt('expira_en', new Date().toISOString())
      .order('creado_en', { ascending: false });
    if (err) {
      setError('No se pudieron cargar las invitaciones.');
      return;
    }
    setInvitaciones((data as Invitacion[]) || []);
  }, []);

  useEffect(() => {
    if (puedeInvitar) cargar();
  }, [puedeInvitar, cargar]);

  if (!puedeInvitar) return null;

  const crear = async (rolInvitado: Invitacion['rol']) => {
    setError('');
    setCreando(true);
    const { error: err } = await supabase.rpc('crear_invitacion', { p_rol: rolInvitado });
    setCreando(false);
    if (err) {
      setError(err.message || 'No se pudo crear la invitación.');
      return;
    }
    cargar();
  };

  const anular = async (id: string) => {
    setError('');
    const { error: err } = await supabase.from('invitaciones').delete().eq('id', id);
    if (err) {
      setError('No se pudo anular la invitación.');
      return;
    }
    setInvitaciones((prev) => prev.filter((i) => i.id !== id));
  };

  const copiar = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(codigo);
      setTimeout(() => setCopiado(null), 1500);
    } catch {
      setError('No se pudo copiar. Seleccioná el código y copialo a mano.');
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[#e8e9f4] p-6">
      <h3 className="font-heading text-lg font-bold text-[#1a1740]">Invitar al equipo</h3>
      <p className="mt-1 text-sm text-[#5e5f78]">
        Generá un código y pasáselo a la persona. Lo usa una sola vez al registrarse y vence en 7 días.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={creando}
          onClick={() => crear('admin')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white bg-[#6a3fd8] hover:bg-[#5a30c4] disabled:opacity-60 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Código para encargada/o
        </button>
        <button
          type="button"
          disabled={creando}
          onClick={() => crear('vendedora')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-[#6a3fd8] border border-[#6a3fd8]/40 hover:bg-[#f0ecfd] disabled:opacity-60 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Código para empleada/o
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {invitaciones.length > 0 && (
        <ul className="mt-5 divide-y divide-[#eef0f7]">
          {invitaciones.map((inv) => (
            <li key={inv.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-base font-semibold tracking-widest text-[#1a1740]">
                  {inv.codigo}
                </p>
                <p className="text-xs text-[#7b7c93]">
                  {ROL_LABEL[inv.rol]} · vence el {new Date(inv.expira_en).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => copiar(inv.codigo)}
                  aria-label="Copiar código"
                  className="p-2 rounded-full text-[#7b7c93] hover:text-[#6a3fd8] hover:bg-[#f0ecfd] transition-colors cursor-pointer"
                >
                  {copiado === inv.codigo ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => anular(inv.id)}
                  aria-label="Anular código"
                  className="p-2 rounded-full text-[#7b7c93] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
