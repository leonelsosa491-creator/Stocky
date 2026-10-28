import React, { useState } from 'react';
import {
  Store,
  BellRing,
  Save,
  Check,
  Trash2,
  AlertTriangle,
  RotateCcw,
  User as UserIcon,
  Upload,
  Sparkles
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { DEFAULT_SETTINGS, loadStoreSettings, saveStoreSettings } from '../utils/storage';
import { Can } from './auth/Can';
import { InvitacionesPanel } from './InvitacionesPanel';
import { EquipoPanel } from './EquipoPanel';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/supabaseClient';

interface ConfiguracionViewProps {
  users: AppUser[];
  currentUser: AppUser;
  onSwitchUser: (userId: string) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
  onClearAllTestData?: () => void;
}

const createAvatarSvg = (color1: string, color2: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g${color1}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#${color1}"/><stop offset="100%" stop-color="#${color2}"/></linearGradient></defs><circle cx="60" cy="60" r="60" fill="url(#g${color1})"/><circle cx="60" cy="46" r="22" fill="#ffffff"/><path d="M 18 120 C 18 90, 35 76, 60 76 C 85 76, 102 90, 102 120 Z" fill="#ffffff"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const PRESET_AVATARS = [
  createAvatarSvg('5a49a8', '42308f'),
  createAvatarSvg('d1d5db', '9ca3af'),
  createAvatarSvg('60a5fa', '2563eb'),
  createAvatarSvg('f472b6', 'db2777'),
  createAvatarSvg('34d399', '059669'),
];

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  onClearAllTestData,
}) => {
  const { user, role, refreshUser } = useAuth();
  
  const [saved, setSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  
  // Extraemos el nombre real o limpiamos el username por defecto
  const rawName = user?.name || '';
  const initialFirstName = rawName === 'lucerolasala' ? 'Lucero' : (rawName.includes(' ') ? rawName.split(' ')[0] : rawName);
  const initialLastName = rawName === 'lucerolasala' ? 'Lasala' : (rawName.includes(' ') ? rawName.split(' ').slice(1).join(' ') : '');

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || PRESET_AVATARS[0]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Recorta la foto al centro y la achica a 256x256 antes de subirla
const resizeImageToBlob = (file: File, size = 256): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen.'));
        return;
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))),
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen. Probá con un JPG o PNG.'));
    };
    img.src = url;
  });

// Si la foto vieja estaba en nuestro Storage, devuelve su ruta para poder borrarla
const rutaAvatarEnStorage = (url?: string | null): string | null => {
  const marca = '/storage/v1/object/public/avatars/';
  const i = url ? url.indexOf(marca) : -1;
  return url && i >= 0 ? decodeURIComponent(url.slice(i + marca.length)) : null;
};

  const [initialSettings] = useState(() => loadStoreSettings());
  const initialStoreName =
    initialSettings.storeName === DEFAULT_SETTINGS.storeName
      ? user?.businessName?.trim() || initialSettings.storeName
      : initialSettings.storeName;
  const [storeName, setStoreName] = useState(initialStoreName);
  const [address, setAddress] = useState(initialSettings.address);
  const [minAlertStock, setMinAlertStock] = useState(initialSettings.minAlertStock);
  const [emailAlerts, setEmailAlerts] = useState(initialSettings.emailAlerts);

  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileError('El archivo tiene que ser una imagen.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setProfileError('La imagen pesa demasiado (máximo 10 MB).');
      return;
    }
    setProfileError('');
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file)); // vista previa
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    setProfileError('');

    try {
      let finalAvatar = avatarUrl;
      const previousAvatar = user.avatar;

      // Si eligió una foto nueva: se achica y se sube a Storage
      if (avatarFile) {
        const blob = await resizeImageToBlob(avatarFile);
        const path = `${user.id}/avatar-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '3600' });
        if (uploadError) throw uploadError;
        finalAvatar = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      }

      // Nombre, apellido y foto se guardan en "perfiles"
      const { error } = await supabase.rpc('actualizar_mi_perfil', {
        p_nombre: firstName.trim(),
        p_apellido: lastName.trim(),
        p_avatar_url: finalAvatar,
      });
      if (error) throw error;

      // Borra la foto anterior si estaba en Storage y ya no se usa
      const oldPath = rutaAvatarEnStorage(previousAvatar);
      if (oldPath && previousAvatar !== finalAvatar) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      await refreshUser(); // el Header y el resto se actualizan solos, sin recargar
      setAvatarFile(null);
      setAvatarUrl(finalAvatar);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err: any) {
      console.error('Error al guardar el perfil:', err);
      setProfileError(err?.message || 'No se pudo guardar tu perfil. Probá de nuevo.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreSettings({ storeName, address, minAlertStock, emailAlerts });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5e5d69]">
          SISTEMA & ACCESOS
        </span>
        <h1 className="font-heading text-3xl font-extrabold text-[#0b1c30] tracking-tight">
          Configuración General
        </h1>
        <p className="text-sm text-[#5e5d69] mt-1">
          Ajustes de tu perfil personal, la boutique y reglas de stock.
        </p>
      </div>

      {/* SECCIÓN 1: PERFIL DE USUARIO */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base text-[#0b1c30]">
              Perfil de Administrador
            </h3>
            <p className="text-xs text-[#797583]">
              Personaliza tu información personal y selecciona o sube tu foto de perfil.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#5a49a8] overflow-hidden flex items-center justify-center text-white ring-4 ring-[#5a49a8]/20 shadow-md">
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                }}
              />
            </div>
            
            <div className="w-full text-center flex flex-col gap-2">
              <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#f8f9ff] hover:bg-[#eff4ff] text-[#42308f] border border-[#c9c4d3]/50 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => { setAvatarFile(null); setAvatarUrl(PRESET_AVATARS[0]); }}
                className="text-[11px] font-bold text-[#797583] hover:text-[#42308f] transition-colors cursor-pointer"
              >
                Restaurar avatar por defecto
              </button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#42308f]" />
                <span>O elegí un avatar predefinido:</span>
              </label>
              <div className="flex items-center gap-3 py-1">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setAvatarFile(null); setAvatarUrl(url); }}
                    className={`w-10 h-10 rounded-full overflow-hidden transition-all cursor-pointer ring-2 ${
                      avatarUrl === url ? 'ring-[#42308f] scale-110 shadow-md' : 'ring-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

                        <div className="flex items-center gap-3 pt-3 flex-wrap">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {profileSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>
                  {isSavingProfile ? 'Guardando...' : profileSaved ? 'Perfil Actualizado' : 'Guardar Perfil'}
                </span>
              </button>
              {profileSaved && (
                <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                  ¡Perfil guardado!
                </span>
              )}
              {profileError && (
                <span className="text-xs font-bold text-rose-600">{profileError}</span>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* SECCIÓN 2: DATOS DE LA BOUTIQUE */}
      <form onSubmit={handleSaveStore} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0b1c30]">
                Información de la Boutique
              </h3>
              <p className="text-xs text-[#797583]">Datos de mostrador y facturación</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Dirección Central / Sucursal
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: REGLAS DE REPOSICIÓN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c9c4d3]/40 card-shadow space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0b1c30]">
                Reglas de Reposición y Alertas de Stock
              </h3>
              <p className="text-xs text-[#797583]">Disparadores automáticos para pedidos a fábricas y proveedores</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Alerta de Stock Mínimo por defecto (unidades)
              </label>
              <input
                type="number"
                min="1"
                value={minAlertStock === 0 ? '' : minAlertStock}
                onChange={(e) => setMinAlertStock(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#42308f] focus:outline-none font-bold text-[#42308f]"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Se marcará en ámbar en el resumen cuando la prenda quede por debajo de este valor.
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#42308f] rounded accent-[#42308f]"
                />
                <span className="text-xs font-bold text-gray-700">
                  Notificaciones automáticas a administradores
                </span>
              </label>
              <p className="text-[11px] text-gray-400 ml-6 mt-1">
                Enviar resumen diario matutino de artículos agotados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="px-8 py-3 bg-[#42308f] text-white text-xs font-bold rounded-full hover:bg-[#5a49a8] transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Cambios Guardados' : 'Guardar Parámetros'}</span>
          </button>
          {saved && (
            <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
              ¡Parámetros actualizados con éxito!
            </span>
          )}
        </div>
      </form>

      {/* SECCIÓN 4: INVITACIONES AL EQUIPO */}
      <Can role={['admin', 'developer']}>
        <InvitacionesPanel />
        <EquipoPanel />
      </Can>

      {/* SECCIÓN 5: ZONA DE PRUEBAS */}
      <Can
        role="developer"
        fallback={
          <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-200 card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-gray-800">
                  Operaciones Críticas de Base de Datos
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  El vaciado general de datos está restringido al rol <strong>'developer' (SuperAdmin)</strong>.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-gray-200 text-gray-600 px-3 py-1 rounded-full self-start sm:self-auto">
              Protegido por Rol
            </span>
          </div>
        }
      >
        <div className="bg-rose-50/40 rounded-3xl p-6 sm:p-8 border border-rose-200/80 card-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-200/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[#0b1c30]">
                  Zona de Pruebas y Depuración (Testing)
                </h3>
                <p className="text-xs text-[#797583]">
                  Herramientas para vaciar el sistema o reiniciar el entorno de pruebas
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200">
              Solo Developer
            </span>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-semibold text-rose-950">
                Eliminar todas las prendas, stock, movimientos, reservas, promociones y proveedores
              </p>
              <p className="text-[11px] text-[#5e5d69] mt-1 leading-relaxed">
                Permite vaciar completamente las tablas para cargar tus propios artículos desde cero o realizar pruebas exhaustivas de stock sin datos preexistentes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          

              {onClearAllTestData && (
                <button
                  type="button"
                  id="btn-eliminar-todos-datos-test"
                  onClick={() => setIsConfirmClearModalOpen(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                  title="Eliminar todas las prendas, stock, movimientos, reservas, promociones y proveedores"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Todo para Testear</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Can>

      {/* Modal Confirmación de Eliminación Total */}
      {isConfirmClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-extrabold text-lg text-[#0b1c30]">
                  ¿Eliminar todos los datos para testear?
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Esta acción vaciará completamente los registros del sistema:
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 rounded-2xl p-3.5 border border-rose-100 text-xs text-rose-900 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todas las <strong>prendas y niveles de stock</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todos los <strong>movimientos de stock</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todas las <strong>reservas de prendas</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todas las <strong>promociones</strong> y descuentos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Todos los <strong>proveedores</strong> registrados</span>
              </div>
            </div>

            <p className="text-[11px] text-[#797583] leading-tight">
              * Podrás volver a restaurar los datos iniciales de demostración en cualquier momento con el botón <strong>"Restaurar Demo"</strong>.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-eliminar-todo"
                onClick={() => {
                  if (onClearAllTestData) {
                    onClearAllTestData();
                  }
                  setIsConfirmClearModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sí, Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};