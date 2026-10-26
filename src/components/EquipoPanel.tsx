import React, { useCallback, useEffect, useState } from 'react';
import { Users, UserX, UserCheck, RefreshCw } from 'lucide-react';
// @ts-ignore - supabaseClient es .js puro
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface MiembroEquipo {
  id: string;
  nombre: string | null;
  apellido: string | null;
  username: string | null;
  email: string | null;
  rol: Role;
  activo: boolean;
}

const ROL_LABEL: Record<Role, string> = {
  developer: 'Developer',
  admin: 'Admin',
  vendedora: 'Vendedora',
};

// Gestión de integrantes de la boutique. Los permisos reales los validan las
// funciones SQL listar_equipo / actualizar_miembro (no se confía en el frontend).
export const EquipoPanel: React.FC = () => {
  const { user, role } = useAuth();
  const [miembros, setMiembros] = useState<MiembroEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error: err } = await supabase.rpc('listar_equipo');
    if (err) {
      setError('No se pudo cargar el equipo.');
    } else {
      setError('');
      setMiembros((data as MiembroEquipo[]) || []);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actualizar = async (miembro: MiembroEquipo, cambios: { rol?: Role; activo?: boolean }) => {
    setGuardandoId(miembro.id);
    setError('');
    const { error: err } = await supabase.rpc('actualizar_miembro', {
      p_id: miembro.id,
      p_rol: cambios.rol ?? null,
      p_activo: cambios.activo ?? null,
    });
    if (err) {
      setError(err.message || 'No se pudo actualizar la cuenta.');
    } else {
      setMiembros((prev) => prev.map((m) => (m.id === miembro.id ? { ...m, ...cambios } : m)));
    }
    setGuardandoId(null);
  };

  const rolesAsignables: Role[] = role === 'developer' ? ['vendedora', 'admin', 'developer'] : ['vendedora', 'admin'];

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-base text-[#0b1c30]">Equipo de la boutique</h3>
          <p className="text-xs text-[#797583]">
            Cambiá el rol de cada integrante o desactivá su cuenta. Una cuenta desactivada no puede ingresar ni ver datos.
          </p>
        </div>
        <button
          type="button"
          onClick={cargar}
          aria-label="Actualizar equipo"
          className="p-2 rounded-full text-[#797583] hover:text-[#42308f] hover:bg-[#eff4ff] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      {cargando && miembros.length === 0 ? (
        <p className="mt-4 text-sm text-[#797583]">Cargando equipo…</p>
      ) : miembros.length === 0 ? (
        <p className="mt-4 text-sm text-[#797583]">Todavía no hay integrantes en la boutique.</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {miembros.map((m) => {
            const esYo = m.id === user?.id;
            const bloqueado = esYo || (m.rol === 'developer' && role !== 'developer');
            const nombre = [m.nombre, m.apellido].filter(Boolean).join(' ') || m.username || m.email || 'Sin nombre';
            const guardando = guardandoId === m.id;
            return (
              <li key={m.id} className={`py-3 flex flex-wrap items-center gap-3 ${m.activo ? '' : 'opacity-60'}`}>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-bold text-[#0b1c30]">
                    {nombre}
                    {esYo && <span className="ml-2 text-xs font-semibold text-[#42308f]">(vos)</span>}
                    {!m.activo && <span className="ml-2 text-xs font-semibold text-rose-600">Desactivada</span>}
                  </p>
                  <p className="text-xs text-[#797583]">
                    {[m.username && `@${m.username}`, m.email].filter(Boolean).join(' · ')}
                  </p>
                </div>

                <select
                  value={m.rol}
                  disabled={bloqueado || guardando}
                  onChange={(e) => actualizar(m, { rol: e.target.value as Role })}
                  aria-label={`Rol de ${nombre}`}
                  className="text-sm border border-[#e3e5f0] rounded-full px-3 py-1.5 bg-[#f4f5fb] text-[#1a1740] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  {(rolesAsignables.includes(m.rol) ? rolesAsignables : [m.rol, ...rolesAsignables]).map((r) => (
                    <option key={r} value={r}>
                      {ROL_LABEL[r]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={bloqueado || guardando}
                  onClick={() => actualizar(m, { activo: !m.activo })}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                    m.activo ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {m.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  {m.activo ? 'Desactivar' : 'Reactivar'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
