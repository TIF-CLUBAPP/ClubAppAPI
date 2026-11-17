import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  /** Valor interno que se entrega a `onChange` al elegir la opción. */
  value: string;
  /** Texto visible principal. */
  label: string;
  /** Valor que se entrega a `onChange` (por defecto `value`). */
  handler?: string;
  /** Texto secundario opcional. */
  secondary?: string;
}

interface SelectProps {
  /** Valor actualmente seleccionado (string). Usá '' o null para \"sin selección\". */
  value: string | null;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  /** Marca el campo como inválido (borde rojo). */
  error?: boolean;
  /** Clases extra aplicadas al trigger (ancho, alto, padding, etc.). */
  triggerClassName?: string;
  /** Contenido opcional a la izquierda de la etiqueta (ej: color del día). */
  renderLabel?: (value: string | null) => ReactNode;
}

/**
 * Select simple estilizado en oscuro, sin buscador.
 * Mantiene la misma línea estética que el resto de inputs de la app:
 * trigger `bg-[#0B1221] border border-white/10` y un menú desplegable flotante
 * oscuro con hover esmeralda/slate, en lugar del `<select>` nativo del navegador.
 */
export default function Select({
  value,
  options,
  placeholder = 'Seleccionar…',
  onChange,
  error = false,
  triggerClassName = '',
  renderLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) ?? null;

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

  const pick = (value: string) => {
    onChange(value);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 bg-[#0B1221] border text-white rounded-lg p-2.5 text-sm outline-none transition-colors ${
          error
            ? 'border-rose-500 focus:border-rose-500 hover:border-rose-500'
            : 'border-white/10 focus:border-emerald-500 hover:border-white/25'
        } ${triggerClassName}`}
      >
        <span className={`flex items-center gap-2 truncate text-left ${selected ? 'text-white' : 'text-slate-500'}`}>
          {renderLabel && renderLabel(value)}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-[#0B1221] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => pick(o.handler ?? o.value)}
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
            })}
          </div>
        </div>
      )}
    </div>
  );
}
