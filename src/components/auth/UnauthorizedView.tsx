import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Role } from '../../types';

interface UnauthorizedViewProps {
  allowedRoles: Role[];
  currentRole?: Role | null;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  allowedRoles,
  currentRole,
}) => {
  const navigate = useNavigate();

  const roleLabels: Record<Role, string> = {
    developer: 'Desarrollador / SuperAdmin',
    admin: 'Dueña / Administradora',
    vendedora: 'Vendedora / Empleada',
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/80 p-8 card-shadow shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-5 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase tracking-wider rounded-full mb-3">
          Acceso Restringido por Rol
        </span>

        <h2 className="font-heading font-extrabold text-2xl text-[#0b1c30] tracking-tight">
          Permisos Insuficientes
        </h2>

        <p className="text-xs text-[#5e5d69] mt-3 leading-relaxed">
          Tu rol actual es{' '}
          <strong className="text-[#42308f] font-bold">
            {currentRole ? roleLabels[currentRole] : 'No identificado'}
          </strong>
          . Esta sección requiere permisos exclusivos de:{' '}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 my-4">
          {allowedRoles.map((r) => (
            <span
              key={r}
              className="px-3 py-1 bg-[#eff4ff] text-[#42308f] border border-[#c9c4d3]/60 rounded-full text-xs font-bold"
            >
              {roleLabels[r]}
            </span>
          ))}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-5 w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-[#0b1c30] rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard Principal</span>
        </button>
      </div>
    </div>
  );
};
