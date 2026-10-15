import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  CreditCard,
  Loader2,
  MapPin,
  Megaphone,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import type { NotificationCategory } from '../../types/notification';
import { useNotifications } from '../../context/NotificationContext';

const CATEGORY_STYLES: Record<
  NotificationCategory,
  { label: string; iconClass: string; labelClass: string }
> = {
  friend_request: {
    label: 'Amistad',
    iconClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    labelClass: 'text-sky-400',
  },
  rental: {
    label: 'Reservas & Canchas',
    iconClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    labelClass: 'text-emerald-400',
  },
  payment: {
    label: 'Pagos & Cuotas',
    iconClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    labelClass: 'text-amber-400',
  },
  announcement: {
    label: 'Avisos & Actividades',
    iconClass: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    labelClass: 'text-violet-400',
  },
};

function CategoryIcon({ category }: { category: NotificationCategory }) {
  const size = 16;
  switch (category) {
    case 'friend_request':
      return <UserPlus size={size} />;
    case 'rental':
      return <MapPin size={size} />;
    case 'payment':
      return <CreditCard size={size} />;
    default:
      return <Megaphone size={size} />;
  }
}

const formatTime = (iso: string): string => {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} h`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
};

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const {
    notifications: items,
    unreadCount,
    hasActionableUnread,
    loading,
    actingId,
    refresh,
    markAllRead,
    remove,
    resolveRequest,
  } = useNotifications();

  useEffect(() => {
    if (open) {
      void refresh();
    }
  }, [open, refresh]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-950 ${
              hasActionableUnread ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell size={16} className="text-slate-400" />
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <CheckCheck size={14} />
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {loading && items.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-4 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                Cargando notificaciones…
              </div>
            )}

            {!loading && items.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-slate-500">
                No tenés notificaciones 🎉
              </p>
            )}

            {items.map((n) => {
              const meta = CATEGORY_STYLES[n.category];
              const isUnread = !n.read;
              return (
                <div
                  key={n.id}
                  className={`group flex items-start gap-3 px-4 py-3 border-b border-slate-800/60 transition hover:bg-slate-800/40 ${
                    isUnread ? 'bg-slate-800/20' : ''
                  }`}
                >
                  <div className={`mt-0.5 p-2 rounded-xl border shrink-0 ${meta.iconClass}`}>
                    <CategoryIcon category={n.category} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-100 font-medium leading-snug flex items-center gap-1.5">
                      {n.title}
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.description}</p>

                    {n.category === 'friend_request' && n.requestId && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => resolveRequest(n, true)}
                          disabled={actingId === n.requestId}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Check size={13} />
                          Aceptar
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveRequest(n, false)}
                          disabled={actingId === n.requestId}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 border border-slate-700 text-[11px] font-semibold hover:text-rose-400 hover:border-rose-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X size={13} />
                          Rechazar
                        </button>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-500 mt-1.5">
                      <span className={`font-semibold uppercase tracking-wide ${meta.labelClass}`}>
                        {meta.label}
                      </span>
                      <span className="mx-1">·</span>
                      {formatTime(n.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(n.id)}
                    aria-label="Eliminar notificación"
                    title="Eliminar notificación"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
