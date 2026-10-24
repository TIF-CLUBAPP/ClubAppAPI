import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  /** Muestra un toast del tipo indicado. */
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 4000;
const MAX_VISIBLE_TOASTS = 4;

const TOAST_STYLE: Record<ToastType, { icon: typeof CheckCircle2; border: string; iconColor: string }> = {
  success: { icon: CheckCircle2, border: 'border-emerald-500/30', iconColor: 'text-emerald-400' },
  error: { icon: AlertCircle, border: 'border-rose-500/30', iconColor: 'text-rose-400' },
  info: { icon: Info, border: 'border-sky-500/30', iconColor: 'text-sky-400' },
};

/**
 * Sistema global de notificaciones flotantes (toasts).
 *
 * Reemplaza a los carteles verdes/rojos inline que empujaban el layout al
 * aparecer/desaparecer. Los toasts se renderizan en un contenedor fijo
 * (top-right) con animación suave de fade + slide-in, sin mover la grilla
 * ni las tablas de ninguna vista.
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE_TOASTS - 1)), { id, type, message }]);
      const timer = window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const success = useCallback((message: string) => push('success', message), [push]);
  const error = useCallback((message: string) => push('error', message), [push]);
  const info = useCallback((message: string) => push('info', message), [push]);

  // Limpia los timers pendientes al desmontar el provider.
  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast: push, success, error, info }}>
      {children}

      {/* Contenedor global de toasts flotantes */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-5 right-5 z-[60] flex w-[calc(100%-2.5rem)] max-w-sm flex-col items-end gap-2"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = TOAST_STYLE[toast.type];
            const Icon = style.icon;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-slate-900/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-md ${style.border}`}
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
                <p className="flex-1 text-sm font-medium leading-snug text-slate-100">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Cerrar notificación"
                  className="shrink-0 text-slate-500 transition-colors hover:text-white"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
};
