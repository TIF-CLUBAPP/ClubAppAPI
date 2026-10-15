import { useEffect, useRef, useState } from 'react';
import { Search, UserPlus, Check, X, Clock, UserCheck, UserX, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { friendService } from '../../services/friendService';
import type { FriendSearchResult } from '../../types/friend';

const initialsOf = (name: string, email: string): string => {
  const base = (name || email || '?').trim();
  const parts = base.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
};

const fullNameOf = (r: FriendSearchResult): string =>
  r.user.fullName || `${r.user.firstName} ${r.user.lastName}`.trim() || r.user.email;

export default function FriendSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selfEmail = user?.email?.toLowerCase();

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    setOpen(true);
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const found = await friendService.search(trimmed);
        setResults(found.filter((r) => r.user.email?.toLowerCase() !== selfEmail));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, selfEmail]);

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

  const applyResult = (id: number, patch: Partial<FriendSearchResult>) => {
    setResults((prev) => prev.map((r) => (r.user.id === id ? { ...r, ...patch } : r)));
  };

  const handleSend = async (r: FriendSearchResult) => {
    setActingId(r.user.id);
    try {
      const req = await friendService.sendRequest(r.user.id);
      applyResult(r.user.id, { relation: 'request_sent', requestId: req.id });
    } catch {
      // Se ignora el error; el usuario puede reintentar.
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (r: FriendSearchResult) => {
    if (!r.requestId) return;
    setActingId(r.user.id);
    try {
      await friendService.cancelRequest(r.requestId);
      applyResult(r.user.id, { relation: 'none', requestId: null });
    } finally {
      setActingId(null);
    }
  };

  const handleAccept = async (r: FriendSearchResult) => {
    if (!r.requestId) return;
    setActingId(r.user.id);
    try {
      await friendService.acceptRequest(r.requestId);
      applyResult(r.user.id, { relation: 'friends', requestId: null });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (r: FriendSearchResult) => {
    if (!r.requestId) return;
    setActingId(r.user.id);
    try {
      await friendService.rejectRequest(r.requestId);
      applyResult(r.user.id, { relation: 'none', requestId: null });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div ref={rootRef} className="relative w-44 sm:w-64">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Buscar personas…"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 transition"
        />
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {searching && (
              <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Buscando…
              </div>
            )}

            {!searching && query.trim() && results.length === 0 && (
              <p className="px-3 py-3 text-xs text-slate-500">No se encontraron personas.</p>
            )}

            {results.map((r) => (
              <div
                key={r.user.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-800/50 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-[11px] shrink-0">
                    {initialsOf(fullNameOf(r), r.user.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-100 font-medium truncate">{fullNameOf(r)}</p>
                    <p className="text-[11px] text-slate-500 truncate">{r.user.email}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {r.relation === 'friends' && (
                    <span title="Ya son amigos" aria-label="Ya son amigos" className="inline-flex items-center justify-center p-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <Check className="w-4 h-4" />
                    </span>
                  )}

                  {r.relation === 'none' && (
                    <button
                      type="button"
                      onClick={() => handleSend(r)}
                      disabled={actingId === r.user.id}
                      title="Agregar Amigo"
                      aria-label="Agregar Amigo"
                      className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}

                  {r.relation === 'request_sent' && (
                    <>
                      <span title="Solicitud Enviada" aria-label="Solicitud Enviada" className="inline-flex items-center justify-center p-2 text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancel(r)}
                        disabled={actingId === r.user.id}
                        title="Cancelar solicitud"
                        aria-label="Cancelar solicitud"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {r.relation === 'request_received' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAccept(r)}
                        disabled={actingId === r.user.id}
                        title="Aceptar solicitud"
                        aria-label="Aceptar solicitud"
                        className="p-2 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(r)}
                        disabled={actingId === r.user.id}
                        title="Rechazar solicitud"
                        aria-label="Rechazar solicitud"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
