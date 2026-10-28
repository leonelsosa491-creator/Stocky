import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ACTIONS, EVENTS, Joyride, STATUS } from 'react-joyride';
import type { EventData, Step, TooltipRenderProps } from 'react-joyride';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from './AuthContext';

export type TourEvent =
  | 'crear-categoria-abierto'
  | 'crear-categoria-cerrado'
  | 'categoria-creada'
  | 'categoria-creada-con-prenda'
  | 'cargar-prenda-abierto'
  | 'cargar-prenda-cerrado'
  | 'prenda-cargada'
  | 'venta-abierta'
  | 'venta-cerrada'
  | 'venta-carrito-listo'
  | 'venta-carrito-vacio'
  | 'venta-registrada';

interface TourContextType {
  isTourRunning: boolean;
  restartTour: () => void;
  notifyTour: (event: TourEvent) => void;
}

interface TourStepData {
  id: string;
  waitForAction?: boolean;
  requireInputId?: string;
  requireInputMessage?: string;
  hint?: string;
  primaryLabel?: string;
}

const TOUR_STORAGE_PREFIX = 'stocky_tutorial_visto_';
const ROLES_GESTION = ['developer', 'admin'];
const CATEGORY_MODAL_STEPS = ['categoria-datos', 'categoria-guardar'];
const PRENDA_MODAL_STEPS = ['prenda-datos', 'prenda-guardar'];
const INTERACTIVE_STEPS = ['crear-categoria', ...CATEGORY_MODAL_STEPS, 'cargar-prenda', ...PRENDA_MODAL_STEPS];
const VENTA_MODAL_STEPS = ['venta-elegir', 'venta-confirmar'];
const VENTA_STEPS = ['registrar-venta', ...VENTA_MODAL_STEPS];

const storageKey = (userId: string) => `${TOUR_STORAGE_PREFIX}${userId}`;

export const hasSeenTutorial = (userId: string) => {
  try {
    return localStorage.getItem(storageKey(userId)) === 'true';
  } catch {
    return true;
  }
};

const setSeenTutorial = (userId: string, seen: boolean) => {
  try {
    if (seen) localStorage.setItem(storageKey(userId), 'true');
    else localStorage.removeItem(storageKey(userId));
  } catch {
    // almacenamiento no disponible
  }
};

const findVisible = (...selectors: string[]) => () => {
  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && el.getClientRects().length > 0) return el;
  }
  return null;
};

const sidebarTarget = () =>
  window.matchMedia('(min-width: 768px)').matches
    ? document.getElementById('tour-sidebar')
    : document.getElementById('tour-btn-menu-movil');

const buildSteps = (canManage: boolean): Step[] => {
  const step = (data: TourStepData, rest: Omit<Step, 'data'>): Step => ({ ...rest, id: data.id, data });

  const steps: Step[] = [
    step(
      { id: 'bienvenida', primaryLabel: 'Empezar recorrido' },
      {
        target: 'body',
        placement: 'center',
        title: '¡Bienvenida a Stocky!',
        content:
          'Te vamos a mostrar en un minuto cómo organizar tu boutique: crear categorías, cargar prendas y registrar ventas.',
        buttons: ['skip', 'primary'],
      },
    ),
    step(
      { id: 'sidebar' },
      {
        target: sidebarTarget,
        placement: 'right',
        title: 'Tu menú principal',
        content:
          'Desde la barra lateral navegás entre el Resumen, el Stock Físico, tus Prendas, Movimientos, Reservas, Promociones y Proveedores.',
        spotlightRadius: 24,
      },
    ),
  ];

  if (canManage) {
    steps.push(
      step(
        { id: 'crear-categoria', waitForAction: true, hint: 'Hacé clic en el botón resaltado para continuar' },
        {
          target: '#btn-crear-categoria',
          placement: 'bottom',
          title: 'Creá tu primera categoría',
          content:
            'Las categorías agrupan tus prendas (Remeras, Vestidos, Camperas...). Hacé clic en "+ Crear Categoría".',
          buttons: ['back', 'skip'],
          spotlightRadius: 999,
          spotlightPadding: 6,
        },
      ),
      step(
        {
          id: 'categoria-datos',
          requireInputId: 'tour-categoria-nombre',
          requireInputMessage: 'Primero escribí un nombre para la categoría',
        },
        {
          target: '#tour-categoria-datos',
          spotlightTarget: '#tour-categoria-panel',
          placement: 'right',
          title: 'Completá los datos básicos',
          content:
            'Escribí el nombre (por ejemplo "Vestidos") y elegí un ícono para identificarla. Cuando termines, tocá Siguiente.',
          buttons: ['skip', 'primary'],
          spotlightRadius: 20,
        },
      ),
      step(
        {
          id: 'categoria-guardar',
          waitForAction: true,
          hint: 'Tocá "Crear Categoría" para guardarla',
        },
        {
          target: '#btn-guardar-categoria',
          spotlightTarget: '#tour-categoria-panel',
          placement: 'top',
          title: 'Guardá tu categoría',
          content:
            'Tocá "Crear Categoría" para guardarla. En el próximo paso te mostramos cómo cargar tu primera prenda.',
          buttons: ['skip'],
          spotlightRadius: 20,
        },
      ),
      step(
        { id: 'categoria-creada' },
        {
          target: 'body',
          placement: 'center',
          title: '¡Categoría creada!',
          content:
            'Ya la tenés en el Stock Físico. Ahora vamos a cargar tu primera prenda en esta categoría.',
          buttons: ['skip', 'primary'],
        },
      ),
      step(
        { id: 'cargar-prenda', waitForAction: true, hint: 'Hacé clic en "+ Prenda Nueva" para continuar' },
        {
          target: '#btn-prenda-nueva',
          placement: 'bottom',
          title: 'Cargá una prenda',
          content: 'Cada prenda es un modelo con su color, talle, cantidad y precio. Hacé clic en "+ Prenda Nueva".',
          buttons: ['skip'],
          spotlightRadius: 999,
          spotlightPadding: 6,
        },
      ),
      step(
        {
          id: 'prenda-datos',
          requireInputId: 'tour-prenda-nombre',
          requireInputMessage: 'Primero escribí el nombre de la prenda',
        },
        {
          target: '#tour-prenda-nombre',
          spotlightTarget: '#tour-prenda-panel',
          placement: 'right',
          title: 'Completá los datos de la prenda',
          content:
            'Escribí el nombre del modelo (ej. "Vestido Lino"), elegí la categoría y el color, y más abajo el talle, la cantidad y el precio. Cuando termines, tocá Siguiente.',
          buttons: ['skip', 'primary'],
          spotlightRadius: 20,
        },
      ),
      step(
        { id: 'prenda-guardar', waitForAction: true, hint: 'Tocá "Guardar y Cargar al Stock"' },
        {
          target: '#btn-guardar-prenda',
          spotlightTarget: '#tour-prenda-panel',
          placement: 'top',
          title: 'Guardá la prenda',
          content: 'Revisá los datos y tocá "Guardar y Cargar al Stock" para sumarla a tu inventario.',
          buttons: ['skip'],
          spotlightRadius: 20,
        },
      ),
      step(
        { id: 'prenda-cargada' },
        {
          target: 'body',
          placement: 'center',
          title: '¡Prenda cargada!',
          content:
            'Ya está en tu inventario. Desde el Stock Físico podés reponer unidades, editarla o reservarla. Ahora vamos a venderla.',
          buttons: ['skip', 'primary'],
        },
      ),
    );
  }

  steps.push(
    step(
      { id: 'registrar-venta', waitForAction: true, hint: 'Hacé clic en "Registrar Venta" para continuar' },
      {
        target: findVisible('#btn-resumen-registrar-venta', '#btn-stock-registrar-venta'),
        placement: 'bottom',
        title: 'Registrá tu primera venta',
        content:
          'Cada vez que vendés, lo registrás acá y el stock se descuenta solo. Hacé clic en "Registrar Venta".',
        buttons: ['skip'],
        spotlightRadius: 999,
        spotlightPadding: 6,
      },
    ),
    step(
      { id: 'venta-elegir', waitForAction: true, hint: 'Tocá "Vender" en una prenda de la lista' },
      {
        target: '#tour-venta-lista',
        spotlightTarget: '#modal-registrar-venta-container',
        placement: 'right',
        title: 'Elegí la prenda vendida',
        content:
          'Buscá la prenda por nombre o código y tocá "Vender" para sumarla al carrito. Podés agregar varias.',
        buttons: ['skip'],
        spotlightRadius: 24,
      },
    ),
    step(
      { id: 'venta-confirmar', waitForAction: true, hint: 'Tocá "Confirmar Venta y Descontar Stock"' },
      {
        target: '#btn-confirmar-venta-descontar-stock',
        spotlightTarget: '#modal-registrar-venta-container',
        placement: 'left',
        title: 'Confirmá la venta',
        content:
          'Revisá el carrito, elegí el medio de pago (y si querés, los datos de la clienta). Después tocá "Confirmar Venta y Descontar Stock".',
        buttons: ['skip'],
        spotlightRadius: 24,
      },
    ),
    step(
      { id: 'venta-registrada' },
      {
        target: 'body',
        placement: 'center',
        title: '¡Venta registrada!',
        content:
          'El stock ya se descontó y la venta quedó en tus movimientos. Desde el comprobante podés imprimirlo o mandarlo por WhatsApp.',
        buttons: ['skip', 'primary'],
      },
    ),
    step(
      { id: 'fin', primaryLabel: 'Terminar' },
      {
        target: 'body',
        placement: 'center',
        title: '¡Todo listo!',
        content:
          'Ya creaste una categoría, cargaste una prenda y registraste una venta. Podés volver a ver este tutorial cuando quieras desde Configuración › Sistema & Accesos.',
        buttons: ['primary'],
      },
    ),
  );

  return steps;
};

const TourTooltip: React.FC<TooltipRenderProps> = ({
  index,
  size,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}) => {
  const data = (step.data || {}) as TourStepData;
  const [error, setError] = useState('');
  const showBack = step.buttons.includes('back') && index > 0;
  const showSkip = step.buttons.includes('skip');
  const showPrimary = step.buttons.includes('primary');

  const handlePrimary: React.MouseEventHandler<HTMLElement> = (e) => {
    if (data.requireInputId) {
      const input = document.getElementById(data.requireInputId) as HTMLInputElement | null;
      if (input && !input.value.trim()) {
        e.preventDefault();
        setError(data.requireInputMessage || 'Completá este campo para continuar');
        input.focus();
        return;
      }
    }
    primaryProps.onClick(e);
  };

  return (
    <div
      {...tooltipProps}
      className="bg-white text-[#0b1c30] rounded-2xl shadow-2xl border border-[#c9c4d3]/50 p-5 w-[340px] max-w-[calc(100vw-32px)] text-left font-body animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 shrink-0 rounded-full bg-[#eff4ff] text-[#42308f] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </span>
          {step.title && <h3 className="font-heading text-base font-extrabold leading-tight">{step.title}</h3>}
        </div>
        {showSkip && (
          <button
            {...skipProps}
            aria-label="Cerrar tutorial"
            title="Cerrar tutorial"
            className="p-1 -mr-1 -mt-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="text-[13px] leading-relaxed text-[#5e5d69] mt-3">{step.content}</div>

      {data.hint && (
        <p className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[#42308f] bg-[#eff4ff] rounded-xl px-3 py-2">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#42308f] opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-[#42308f]" />
          </span>
          {data.hint}
        </p>
      )}

      {error && <p className="mt-2 text-[11px] font-semibold text-rose-600">{error}</p>}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1" aria-label={`Paso ${index + 1} de ${size}`}>
          {Array.from({ length: size }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-4 bg-[#42308f]' : 'w-1.5 bg-[#c9c4d3]'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {showSkip && index < size - 1 && (
            <button
              {...skipProps}
              className="px-3 py-2 text-xs font-bold text-[#797583] hover:text-[#42308f] rounded-full transition-colors cursor-pointer"
            >
              Saltar
            </button>
          )}
          {showBack && (
            <button
              {...backProps}
              className="px-4 py-2 text-xs font-bold text-[#42308f] bg-[#eff4ff] hover:bg-[#e1deed] rounded-full transition-colors cursor-pointer"
            >
              Atrás
            </button>
          )}
          {showPrimary && (
            <button
              {...primaryProps}
              onClick={handlePrimary}
              className="px-5 py-2 text-xs font-bold text-white bg-[#42308f] hover:bg-[#5a49a8] rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {data.primaryLabel || 'Siguiente'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const indexRef = useRef(0);

  const canManage = Boolean(user && ROLES_GESTION.includes(user.role));
  const steps = useMemo(() => buildSteps(canManage), [canManage]);
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const goTo = useCallback((index: number) => {
    indexRef.current = index;
    setStepIndex(index);
  }, []);

  const indexOf = useCallback((id: string) => steps.findIndex((s) => s.id === id), [steps]);

  const finishTour = useCallback(() => {
    if (user) setSeenTutorial(user.id, true);
    setRun(false);
    goTo(0);
  }, [user, goTo]);

  // Inicio automático: la primera vez que el usuario entra al Dashboard
  useEffect(() => {
    if (!isAuthenticated || !user || run) return;
    if (location.pathname !== '/dashboard') return;
    if (hasSeenTutorial(user.id)) return;
    const timer = setTimeout(() => {
      goTo(0);
      setRun(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, location.pathname, run, goTo]);

  useEffect(() => {
    if (!isAuthenticated && run) setRun(false);
  }, [isAuthenticated, run]);

  const restartTour = useCallback(() => {
    if (user) setSeenTutorial(user.id, false);
    setRun(false);
    goTo(0);
    navigate('/dashboard');
  }, [user, navigate, goTo]);

  const notifyTour = useCallback(
    (event: TourEvent) => {
      if (!run) return;
      const currentId = steps[indexRef.current]?.id;
      if (event === 'crear-categoria-abierto' && currentId === 'crear-categoria') {
        goTo(indexOf('categoria-datos'));
      } else if (event === 'crear-categoria-cerrado' && currentId && CATEGORY_MODAL_STEPS.includes(currentId)) {
        goTo(indexOf('crear-categoria'));
      } else if (event === 'categoria-creada' && currentId && CATEGORY_MODAL_STEPS.includes(currentId)) {
        goTo(indexOf('categoria-creada'));
      } else if (event === 'categoria-creada-con-prenda' && currentId && CATEGORY_MODAL_STEPS.includes(currentId)) {
        goTo(indexOf('prenda-cargada'));
      } else if (event === 'cargar-prenda-abierto' && currentId === 'cargar-prenda') {
        goTo(indexOf('prenda-datos'));
      } else if (event === 'cargar-prenda-cerrado' && currentId && PRENDA_MODAL_STEPS.includes(currentId)) {
        goTo(indexOf('cargar-prenda'));
      } else if (event === 'prenda-cargada' && currentId && PRENDA_MODAL_STEPS.includes(currentId)) {
        goTo(indexOf('prenda-cargada'));
      } else if (event === 'venta-abierta' && currentId === 'registrar-venta') {
        goTo(indexOf('venta-elegir'));
      } else if (event === 'venta-cerrada' && currentId && VENTA_MODAL_STEPS.includes(currentId)) {
        goTo(indexOf('registrar-venta'));
      } else if (event === 'venta-carrito-listo' && currentId === 'venta-elegir') {
        goTo(indexOf('venta-confirmar'));
      } else if (event === 'venta-carrito-vacio' && currentId === 'venta-confirmar') {
        goTo(indexOf('venta-elegir'));
      } else if (event === 'venta-registrada' && currentId && VENTA_MODAL_STEPS.includes(currentId)) {
        goTo(indexOf('venta-registrada'));
      }
    },
    [run, steps, goTo, indexOf],
  );

  const handleEvent = useCallback(
    (data: EventData) => {
      const { type, action, index, status } = data;

      if (status === STATUS.SKIPPED || status === STATUS.FINISHED || type === EVENTS.TOUR_END) {
        finishTour();
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        if (action === ACTIONS.PREV) {
          goTo(Math.max(0, index - 1));
        } else if (action === ACTIONS.NEXT || action === ACTIONS.CLOSE) {
          if (index + 1 >= steps.length) finishTour();
          else goTo(index + 1);
        }
        return;
      }

      if (type === EVENTS.TARGET_NOT_FOUND) {
        const currentId = steps[index]?.id;
        if (currentId && VENTA_STEPS.includes(currentId)) {
          goTo(indexOf('fin'));
        } else if (currentId && INTERACTIVE_STEPS.includes(currentId)) {
          const ventaIndex = indexOf('registrar-venta');
          goTo(ventaIndex >= 0 ? ventaIndex : index + 1);
        } else if (index + 1 >= steps.length) {
          finishTour();
        } else {
          goTo(index + 1);
        }
      }
    },
    [steps, goTo, finishTour, indexOf],
  );

  const value = useMemo(() => ({ isTourRunning: run, restartTour, notifyTour }), [run, restartTour, notifyTour]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {isAuthenticated && (
        <Joyride
          steps={steps}
          run={run}
          stepIndex={stepIndex}
          continuous
          onEvent={handleEvent}
          tooltipComponent={TourTooltip}
          options={{
            arrowColor: isDark ? '#1e1b29' : '#ffffff',
            backgroundColor: isDark ? '#1e1b29' : '#ffffff',
            primaryColor: '#42308f',
            textColor: '#0b1c30',
            overlayColor: 'rgba(11, 28, 48, 0.55)',
            zIndex: 1000,
            skipBeacon: true,
            disableFocusTrap: true,
            overlayClickAction: false,
            dismissKeyAction: false,
            targetWaitTimeout: 3000,
            spotlightRadius: 16,
            scrollOffset: 80,
          }}
          styles={{ floater: { filter: 'drop-shadow(0 12px 32px rgba(66, 48, 143, 0.18))' } }}
        />
      )}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour debe usarse dentro de TourProvider');
  return ctx;
};
