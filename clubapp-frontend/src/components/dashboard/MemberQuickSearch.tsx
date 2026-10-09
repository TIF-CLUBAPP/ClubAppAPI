import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, Search, UserCheck, X } from 'lucide-react';
import { userService } from '../../services/userService';
import { cuotasService } from '../../services/cuotasService';
import type { UserListItem } from '../../types/user';
import type { CuotaVencida } from '../../types/cuotas';

/** Normaliza DNI (quita puntos y espacios) para comparar de forma robusta. */
const normalizeDni = (value: string) => value.replace(/[.\s]/g, '').toLowerCase();

type SearchHit = {
  user: UserListItem;
  debt: CuotaVencida | undefined;
};

/**
 * Omnibox de búsqueda rápida de socios por Nombre o DNI.
 * Cruza el padrón de deudores para mostrar el estado de cuota (AL DÍA / DEUDOR)
 * y permite ir a la ficha del socio o al cobro de cuota.
 */
export default function MemberQuickSearch() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [debtById, setDebtById] = useState<Map<number, CuotaVencida>>(new Map());
  const [debtByDni, setDebtByDni] = useState<Map<string, CuotaVencida>>(new Map());
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Carga una única vez el padrón de deudores para cruzar el estado de cuota.
  useEffect(() => {
    let active = true;
    cuotasService
      .getOverdueList()
      .then((list) => {
        if (!active) return;
        const byId = new Map<number, CuotaVencida>();
        const byDni = new Map<string, CuotaVencida>();
        for (const item of list) {
          byId.set(item.socioId, item);
          if (item.dni) byDni.set(normalizeDni(item.dni), item);
        }
        setDebtById(byId);
        setDebtByDni(byDni);
      })
      .catch(() => {
        // Backend no disponible: se omite el cruce de estado de cuota.
      });
    return () => {
      active = false;
    };
  }, []);

  // Búsqueda con debounce de 300ms.
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
        const found = await userService.getUsers({ searchQuery: trimmed });
        setResults(
          found.map((user) => ({
            user,
            debt: debtById.get(user.id) ?? (user.dni ? debtByDni.get(normalizeDni(user.dni)) : undefined),
          })),
        );
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, debtById, debtByDni]);

  // Cierra el dropdown al hacer click fuera o presionar Escape.
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const goTo = (path: string, state?: unknown) => {
    setOpen(false);
    setQuery('');
    navigate(path, { state });
  };

  const isDebtor = (hit: SearchHit) => (hit.debt?.cantidadCuotasImpagas ?? 0) > 0;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar socio por nombre o DNI..."
          className="pl-10 pr-4 py-2.5 w-full bg-slate-900/80 border border-slate-700 text-slate-100 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
        />
        {searching ? (
          <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
            aria-label="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f172a] border border-slate-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {searching && results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-500">Buscando socios…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-500">No se encontraron socios.</p>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {results.map((hit) => {
                const debtor = isDebtor(hit);
                const key = hit.user.dni || hit.user.fullName;
                return (
                  <li key={hit.user.id} className="flex items-center gap-3 px-3.5 py-3 hover:bg-slate-900/60 transition">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{hit.user.fullName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {hit.user.dni && <span className="text-[11px] text-slate-500">DNI {hit.user.dni}</span>}
                        <span
                          className={
                            debtor
                              ? 'rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300'
                              : 'rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300'
                          }
                        >
                          {debtor ? 'DEUDOR' : 'AL DÍA'}
                        </span>
                      </div>
                    </div>
                    {debtor ? (
                      <button
                        type="button"
                        onClick={() => goTo(`/deudores?q=${encodeURIComponent(key)}`)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
                      >
                        <CreditCard size={13} /> Cobrar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => goTo(`/socios/${hit.user.id}`, { member: hit.user })}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                      >
                        <UserCheck size={13} /> Ficha
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

