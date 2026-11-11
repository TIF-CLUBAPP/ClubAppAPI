import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface ComboboxOption {
  /** Valor interno que se entrega a `onChange` al elegir la opción. */
  value: string;
  /** Texto visible principal. */
  label: string;
  /** Texto secundario opcional (ej: categoría del espacio). */
  secondary?: string;
}

interface ComboboxProps {
  /** Valor actualmente seleccionado (string). Usá '' o null para "sin selección". */
  value: string | null;
  options: ComboboxOption[];
  placeholder?: string;
  /** Texto a mostrar cuando no hay opciones que coincidan. */
  noResultsText?: string;
  onChange: (value: string | null) => void;
  /** Marca el campo como inválido (borde rojo). */
  error?: boolean;
}

/** Normaliza un texto: minúsculas + sin tildes (diacríticos). */
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Coincidencia tolerante: devuelve true si todas las letras del query aparecen
 * en orden dentro del texto (fuzzy), tolerando omisión de tildes y mayúsculas.
 */
const fuzzyMatch = (query: string, text: string): boolean => {
  const q = normalize(query);
  const t = normalize(text);
  if (q.length === 0) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
};

export default function Combobox({
  value,
  options,
  placeholder = 'Seleccionar…',
  noResultsText = 'Sin resultados',
  onChange,
  error = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  // Filtrado en tiempo real (fuzzy + tolerante a tildes/mayúsculas).
  const filtered = useMemo(() => {
    if (query.trim() === '') return options;
    return options.filter(
      (o) => fuzzyMatch(query, o.label) || (o.secondary ? fuzzyMatch(query, o.secondary) : false),
    );
  }, [query, options]);

  // Al abrir, foco automático en el buscador.
  useEffect(() => {
    if (open) {
      setQuery('');
      // Pequeño delay para asegurar el autoFocus tras el montaje del input.
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Cierra al hacer clic fuera del componente.
  useEffect(() => {
    if (!open) return;
    const handleDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const pick = (v: string | null) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 bg-[#0f172a] border text-slate-100 rounded-lg p-2.5 text-sm outline-none transition-colors ${
          error
            ? 'border-rose-500 focus:border-rose-500 hover:border-rose-500'
            : 'border-slate-700 focus:border-emerald-500 hover:border-slate-600'
        }`}
      >
        <span className={`truncate text-left ${selected ? 'text-slate-100' : 'text-slate-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Buscador en tiempo real con foco automático */}
          <div className="p-2 border-b border-slate-800">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-slate-500 pointer-events-none" />
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar…"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-500">{noResultsText}</p>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => pick(o.value)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                      active
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'text-slate-200 hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{o.label}</span>
                      {o.secondary && (
                        <span className="block text-[10px] text-slate-500 truncate">{o.secondary}</span>
                      )}
                    </span>
                    {active && <Check size={15} className="shrink-0 text-emerald-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
