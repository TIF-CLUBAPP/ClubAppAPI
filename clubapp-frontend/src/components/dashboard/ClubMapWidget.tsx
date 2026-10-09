import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Info, Sparkles, Clock, Loader2, AlertCircle } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import type { SectorStatus, SectorStatusType } from '../../types/dashboard';

interface StatusConfig {
  label: string;
  bg: string;
  dot: string;
}

const STATUS_CONFIG: Record<SectorStatusType, StatusConfig> = {
  available: {
    label: 'Disponible',
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  occupied: {
    label: 'En Uso',
    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    dot: 'bg-amber-400',
  },
  maintenance: {
    label: 'Mantenimiento',
    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    dot: 'bg-rose-400',
  },
};

// Etiqueta de ocupación/capacidad mostrada en la tarjeta y el detalle.
const formatCapacity = (sector: SectorStatus): string => {
  if (sector.status === 'maintenance') return 'Cerrado';
  if (sector.status === 'occupied') {
    if (sector.capacity && sector.capacity > 0) {
      return `${sector.currentOccupancy}/${sector.capacity} Jugadores`;
    }
    return `${sector.currentOccupancy} en uso`;
  }
  return 'Disponible';
};

// Próximo turno legible para el detalle del sector.
const formatNextTurn = (sector: SectorStatus): string => {
  if (sector.status === 'maintenance') return 'No disponible';
  if (sector.nextTurn) return `${sector.nextTurn} hs`;
  return 'Abierto';
};

export default function ClubMapWidget() {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<SectorStatus[]>([]);
  const [selected, setSelected] = useState<SectorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('Todos');

  const loadSectors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getSectors();
      setSectors(data);
      setSelected((prev) => prev ?? data[0] ?? null);
    } catch {
      setError('No se pudo cargar el estado de los sectores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSectors();
  }, []);

  const counts = useMemo(() => {
    const free = sectors.filter((s) => s.status === 'available').length;
    const inUse = sectors.filter((s) => s.status === 'occupied').length;
    const maintenance = sectors.filter((s) => s.status === 'maintenance').length;
    return { free, inUse, maintenance };
  }, [sectors]);

  const categories = useMemo(() => {
    const unique = new Set(sectors.map((s) => s.sportCategory).filter(Boolean));
    return ['Todos', ...unique];
  }, [sectors]);

  const filteredSectors = useMemo(
    () => (filterCategory === 'Todos' ? sectors : sectors.filter((s) => s.sportCategory === filterCategory)),
    [sectors, filterCategory],
  );

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MapPin size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Sectores del Club <Sparkles size={16} className="text-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">Estado de instalaciones en tiempo real</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> {counts.free} Libres
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> {counts.inUse} En Uso
          </span>
          {counts.maintenance > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> {counts.maintenance} Cerrados
            </span>
          )}
        </div>
      </div>

      {sectors.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {categories.map((cat) => {
            const isActive = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                    : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex-1 grid place-items-center py-16">
          <Loader2 size={28} className="text-emerald-400 animate-spin" />
        </div>
      ) : error && sectors.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3">
          <AlertCircle size={28} className="text-rose-400" />
          <p className="text-sm text-slate-300 font-medium">{error}</p>
          <button
            onClick={loadSectors}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Reintentar
          </button>
        </div>
      ) : sectors.length === 0 ? (
        <div className="flex-1 grid place-items-center py-16 text-center">
          <p className="text-sm text-slate-400">No hay espacios físicos registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">
          <div className="md:col-span-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-2 gap-3">
              {filteredSectors.map((sector) => {
                const config = STATUS_CONFIG[sector.status];
                const isSelected = selected?.id === sector.id;

                return (
                  <motion.button
                    key={sector.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(sector)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500/50 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-medium leading-tight">{sector.sportCategory || sector.location}</span>
                      <span className={`w-2 h-2 rounded-full ${config.dot} shrink-0`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-[13px] mb-1 leading-tight">{sector.name}</h4>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium ${config.bg}`}>
                        {formatCapacity(sector)}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div className="sticky top-4 self-start h-fit">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Detalle del Sector</span>
                    <Info size={16} className="text-slate-500" />
                  </div>
                  <h4 className="font-bold text-white text-base">{selected.name}</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    {[selected.sportCategory, selected.location].filter(Boolean).join(' · ') || 'Instalaciones del Club'}
                  </p>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                      <span className="text-slate-400">Estado</span>
                      <span className={`px-2 py-0.5 rounded border ${STATUS_CONFIG[selected.status].bg} font-medium`}>
                        {STATUS_CONFIG[selected.status].label}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users size={14} /> Ocupación
                      </span>
                      <span className="text-white font-medium">{formatCapacity(selected)}</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock size={14} /> Próx. Turno
                      </span>
                      <span className="text-white font-medium">{formatNextTurn(selected)}</span>
                    </div>
                  </div>
                </div>

                {selected.isReservable ? (
                  <button
                    disabled={selected.status === 'maintenance'}
                    onClick={() =>
                      navigate('/canchas', {
                        state: { spaceId: selected.id, sportCategory: selected.sportCategory },
                      })
                    }
                    className="w-full mt-4 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {selected.status === 'maintenance' ? 'No disponible' : 'Reservar Turno'}
                  </button>
                ) : (
                  <div className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-semibold text-center">
                    <Info size={14} className="shrink-0" />
                    Espacio exclusivo para actividades / clases del club
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
