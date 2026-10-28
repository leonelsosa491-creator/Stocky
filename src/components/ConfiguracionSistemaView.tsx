import React, { useState } from 'react';
import {
  Code,
  Database,
  Trash2,
  Terminal,
  ShieldAlert,
  Server,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Lock,
  Layers,
  FileCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Can } from './auth/Can';

interface ConfiguracionSistemaProps {
  onClearDatabase?: () => void;
  onRestoreDatabase?: () => void;
}

export const ConfiguracionSistemaView: React.FC<ConfiguracionSistemaProps> = ({
  onClearDatabase,
  onRestoreDatabase,
}) => {
  const { user } = useAuth();
  const [supabaseUrl, setSupabaseUrl] = useState('https://xyzcompany.supabase.co');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockKey123...');
  const [isConfirmingPurge, setIsConfirmingPurge] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'supabase' | 'audit'>('database');

  const handleExecutePurge = () => {
    if (onClearDatabase) {
      onClearDatabase();
    } else {
      localStorage.clear();
    }
    setIsConfirmingPurge(false);
    setPurgeSuccess(true);
    setTimeout(() => setPurgeSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Nivel SuperAdmin: Solo Developer (['developer'])
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
            Configuración del Sistema & Backend
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Gestión de esquemas de bases de datos, variables de entorno de Supabase y registros de auditoría.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-800/90 rounded-2xl border border-slate-700 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>RLS Active: Supabase v2</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'database'
              ? 'bg-[#42308f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Gestión de Base de Datos</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'supabase'
              ? 'bg-[#42308f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Conexión Supabase (Auth + DB)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-[#42308f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Auditoría & Logs de Seguridad</span>
        </button>
      </div>

      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* CRITICAL ACTION DEMO: Renderizado Condicional ("Borrar Base de Datos") */}
          <div className="bg-rose-50 rounded-3xl p-6 sm:p-8 border border-rose-200 card-shadow space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-lg text-rose-950">
                    Operación Crítica: Purgar y Borrar Base de Datos
                  </h3>
                  <span className="px-2.5 py-0.5 bg-rose-200 text-rose-900 text-[10px] font-extrabold uppercase rounded-full">
                    Ejemplo Can role="developer"
                  </span>
                </div>
                <p className="text-xs text-rose-800/80 mt-1 max-w-2xl leading-relaxed">
                  Esta acción ejecuta un <code>TRUNCATE CASCADE</code> sobre todas las tablas de inventario (prendas, variantes, stock, reservas, movimientos de caja). 
                  Solo un usuario con rol <strong>'developer'</strong> tiene autorización para visualizar y ejecutar este control.
                </p>
              </div>
            </div>

            {/* DEMO DE RENDERIZADO CONDICIONAL CON <Can role="developer"> */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-rose-200/80">
              <div className="text-xs text-gray-500 font-mono">
                Componente: <code>&lt;Can role="developer"&gt; &lt;BotonBorrarBaseDatos /&gt; &lt;/Can&gt;</code>
              </div>

              <Can role="developer" fallback={<span className="text-xs text-gray-400 italic">Acción oculta para no desarrolladores</span>}>
                <div className="flex items-center gap-3">
                  {onRestoreDatabase && (
                    <button
                      onClick={onRestoreDatabase}
                      className="px-4 py-2.5 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-full text-xs font-bold transition-all shadow-2xs"
                    >
                      Restaurar Datos Iniciales
                    </button>
                  )}

                  <button
                    onClick={() => setIsConfirmingPurge(true)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Borrar Base de Datos</span>
                  </button>
                </div>
              </Can>
            </div>

            {purgeSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Base de datos purgada exitosamente por el desarrollador.</span>
              </div>
            )}
          </div>

          {/* Database Tables Overview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-[#0b1c30]">
                  Esquema de Tablas (Postgres / Supabase)
                </h3>
                <p className="text-xs text-[#797583]">Estructura relacional para la boutique</p>
              </div>
              <span className="text-xs font-bold text-gray-600 font-mono">7 Tablas Activas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {[
                { name: 'public.products', rows: '68 filas', desc: 'Prendas, talles, familias de color, precios' },
                { name: 'public.inventory_movements', rows: '142 filas', desc: 'Ingresos, ventas, egresos y ajustes' },
                { name: 'public.reservas', rows: '12 filas', desc: 'Prendas reservadas con seña' },
                { name: 'public.promotions', rows: '4 filas', desc: 'Reglas de descuentos 2x1 y estacionales' },
                { name: 'public.suppliers', rows: '3 filas', desc: 'Fábricas y talleres textiles' },
                { name: 'public.profiles', rows: '3 usuarios', desc: 'Metadata y roles (developer, admin, vendedora)' },
              ].map((table) => (
                <div key={table.name} className="p-4 bg-[#f8f9ff] rounded-2xl border border-[#c9c4d3]/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#42308f]">{table.name}</span>
                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">
                      {table.rows}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5e5d69]">{table.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'supabase' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow space-y-6">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#0b1c30] flex items-center gap-2">
              <Server className="w-5 h-5 text-[#42308f]" />
              Conexión y Variables de Entorno Supabase
            </h3>
            <p className="text-xs text-[#797583] mt-1">
              Configuración de credenciales de cliente para migrar el AuthContext hacia el cliente de Supabase.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                VITE_SUPABASE_URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full text-xs font-mono px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#42308f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                VITE_SUPABASE_ANON_KEY
              </label>
              <input
                type="text"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full text-xs font-mono px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#42308f] focus:outline-none"
              />
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl text-slate-200 font-mono text-xs overflow-x-auto space-y-2">
              <p className="text-slate-400">// Código de inicialización en src/lib/supabase.ts:</p>
              <p className="text-emerald-400">import &#123; createClient &#125; from '@supabase/supabase-js';</p>
              <p>export const supabase = createClient(</p>
              <p className="pl-4">import.meta.env.VITE_SUPABASE_URL,</p>
              <p className="pl-4">import.meta.env.VITE_SUPABASE_ANON_KEY</p>
              <p>);</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#0b1c30]">
                Registro de Eventos de Seguridad & Roles
              </h3>
              <p className="text-xs text-[#797583]">Inspección de accesos a rutas protegidas</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Sistema Seguro
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {[
              { time: '17:15:02', user: 'dev@example.com', role: 'developer', action: 'GET /configuracion-sistema', status: '200 OK (Autorizado)' },
              { time: '17:10:44', user: user?.name || 'Usuario actual', role: user?.role || 'admin', action: 'GET /reportes-ventas', status: '200 OK (Autorizado)' },
              { time: '16:55:18', user: 'sofia.ventas@example.com', role: 'vendedora', action: 'GET /dashboard', status: '200 OK (Autorizado)' },
              { time: '16:40:09', user: 'sofia.ventas@example.com', role: 'vendedora', action: 'ATTEMPT /configuracion-sistema', status: '403 FORBIDDEN (Bloqueado por RoleRoute)' },
            ].map((log, idx) => (
              <div key={idx} className="p-3 bg-[#f8f9ff] rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{log.time}</span>
                  <span className="font-bold text-[#42308f]">{log.user}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-700">
                    [{log.role}]
                  </span>
                  <span className="text-gray-600">{log.action}</span>
                </div>
                <span className={`font-bold ${log.status.includes('403') ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Database Purge */}
      {isConfirmingPurge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#0b1c30]">
                  ¿Confirmar borrado total de Base de Datos?
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Esta es una operación irreversible restringida a desarrolladores.
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-900 space-y-1">
              <p className="font-bold">Se eliminarán todos los registros:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800">
                <li>Prendas del catálogo e inventario físico</li>
                <li>Historial de movimientos y egresos</li>
                <li>Reservas activas con señas</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmingPurge(false)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecutePurge}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold uppercase transition-all shadow-md active:scale-95"
              >
                Sí, Purgar Base de Datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
