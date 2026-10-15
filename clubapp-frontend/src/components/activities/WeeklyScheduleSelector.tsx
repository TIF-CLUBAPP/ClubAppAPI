import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react';
import type { ActivityScheduleInput } from '../../types/activity';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const maskTimeInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export const WEEK_DAYS_PILLS = [
  { id: 1, label: 'L', name: 'Lunes' },
  { id: 2, label: 'M', name: 'Martes' },
  { id: 3, label: 'Mi', name: 'Miércoles' },
  { id: 4, label: 'J', name: 'Jueves' },
  { id: 5, label: 'V', name: 'Viernes' },
  { id: 6, label: 'S', name: 'Sábado' },
  { id: 0, label: 'D', name: 'Domingo' },
];

export interface WeeklyScheduleBlock {
  id: string;
  days: number[];
  startTime: string;
  endTime: string;
}

export interface RowConflict {
  activityName: string;
  category: string;
  sameSport: boolean;
}

export type RowStatus = 'free' | 'blocked' | 'shared';

export interface ScheduleRow extends ActivityScheduleInput {
  status: RowStatus;
  blockedBy: RowConflict[];
  sharedWith: RowConflict[];
}

export const schedulesToBlocks = (schedules: ActivityScheduleInput[]): WeeklyScheduleBlock[] => {
  if (!schedules || schedules.length === 0) {
    return [{ id: '1', days: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '20:00' }];
  }
  const map = new Map<string, { days: number[]; startTime: string; endTime: string }>();
  for (const s of schedules) {
    const key = `${s.startTime}_${s.endTime}`;
    if (!map.has(key)) {
      map.set(key, { days: [], startTime: s.startTime, endTime: s.endTime });
    }
    const current = map.get(key)!;
    if (!current.days.includes(s.dayOfWeek)) {
      current.days.push(s.dayOfWeek);
    }
  }

  let idx = 1;
  const result: WeeklyScheduleBlock[] = [];
  for (const val of map.values()) {
    result.push({
      id: String(idx++),
      days: val.days,
      startTime: val.startTime,
      endTime: val.endTime,
    });
  }
  return result.length > 0
    ? result
    : [{ id: '1', days: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '20:00' }];
};

export const blocksToSchedules = (blocks: WeeklyScheduleBlock[]): ActivityScheduleInput[] => {
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const schedules: ActivityScheduleInput[] = [];
  for (const b of blocks) {
    for (const d of b.days) {
      schedules.push({
        dayOfWeek: d,
        startTime: b.startTime,
        endTime: b.endTime,
      });
    }
  }
  return schedules.sort((a, b) => dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek));
};

interface WeeklyScheduleSelectorProps {
  blocks: WeeklyScheduleBlock[];
  onBlocksChange: (blocks: WeeklyScheduleBlock[]) => void;
  scheduleRows: ScheduleRow[];
}

export const WeeklyScheduleSelector = ({
  blocks,
  onBlocksChange,
  scheduleRows,
}: WeeklyScheduleSelectorProps) => {
  const totalConfiguredDays = blocks.reduce((acc, b) => acc + b.days.length, 0);

  const getAssignedInOtherBlocks = (currentBlockId: string): Set<number> => {
    const assigned = new Set<number>();
    for (const b of blocks) {
      if (b.id !== currentBlockId) {
        for (const d of b.days) {
          assigned.add(d);
        }
      }
    }
    return assigned;
  };

  const handleToggleDay = (blockId: string, dayId: number) => {
    const nextBlocks = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const isSelected = b.days.includes(dayId);
      const nextDays = isSelected ? b.days.filter((d) => d !== dayId) : [...b.days, dayId];
      return { ...b, days: nextDays };
    });
    onBlocksChange(nextBlocks);
  };

  const handleSelectWeekDays = (blockId: string) => {
    const otherDays = getAssignedInOtherBlocks(blockId);
    const availableWeekDays = [1, 2, 3, 4, 5].filter((d) => !otherDays.has(d));
    const nextBlocks = blocks.map((b) => (b.id === blockId ? { ...b, days: availableWeekDays } : b));
    onBlocksChange(nextBlocks);
  };

  const handleSelectWeekendDays = (blockId: string) => {
    const otherDays = getAssignedInOtherBlocks(blockId);
    const availableWeekend = [6, 0].filter((d) => !otherDays.has(d));
    const nextBlocks = blocks.map((b) => (b.id === blockId ? { ...b, days: availableWeekend } : b));
    onBlocksChange(nextBlocks);
  };

  const handleSelectAllAvailable = (blockId: string) => {
    const otherDays = getAssignedInOtherBlocks(blockId);
    const availableDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => !otherDays.has(d));
    const nextBlocks = blocks.map((b) => (b.id === blockId ? { ...b, days: availableDays } : b));
    onBlocksChange(nextBlocks);
  };

  const handleClearDays = (blockId: string) => {
    const nextBlocks = blocks.map((b) => (b.id === blockId ? { ...b, days: [] } : b));
    onBlocksChange(nextBlocks);
  };

  const handleStartTimeChange = (blockId: string, startTime: string) => {
    const nextBlocks = blocks.map((b) => (b.id === blockId ? { ...b, startTime } : b));
    onBlocksChange(nextBlocks);
  };

  const handleEndTimeChange = (blockId: string, endTime: string) => {
    const nextBlocks = blocks.map((b) => (b.id === blockId ? { ...b, endTime } : b));
    onBlocksChange(nextBlocks);
  };

  const handleAddBlock = () => {
    const allAssigned = new Set<number>();
    blocks.forEach((b) => b.days.forEach((d) => allAssigned.add(d)));
    const remainingDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => !allAssigned.has(d));
    const newBlock: WeeklyScheduleBlock = {
      id: String(Date.now()),
      days:
        remainingDays.length > 0
          ? remainingDays.includes(6) || remainingDays.includes(0)
            ? remainingDays.filter((d) => d === 6 || d === 0)
            : remainingDays
          : [],
      startTime: '08:00',
      endTime: '20:00',
    };
    onBlocksChange([...blocks, newBlock]);
  };

  const handleRemoveBlock = (blockId: string) => {
    if (blocks.length <= 1) return;
    const nextBlocks = blocks.filter((b) => b.id !== blockId);
    onBlocksChange(nextBlocks);
  };
  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        const otherAssignedDays = getAssignedInOtherBlocks(block.id);

        return (
          <div
            key={block.id}
            className="space-y-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 transition-all"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Bloque de horario {blocks.length > 1 ? `#${idx + 1}` : ''}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  ({block.days.length} {block.days.length === 1 ? 'día' : 'días'})
                </span>
              </div>

              {blocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveBlock(block.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center gap-1 transition"
                  title="Eliminar este bloque"
                >
                  <Trash2 size={12} />
                  <span>Eliminar bloque</span>
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Días del bloque
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSelectWeekDays(block.id)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition"
                  >
                    Lunes a Viernes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectWeekendDays(block.id)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-semibold border border-slate-700 transition"
                  >
                    Fin de semana
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllAvailable(block.id)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold border border-slate-700 transition"
                  >
                    Disponibles
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearDays(block.id)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-semibold border border-slate-700 transition"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {WEEK_DAYS_PILLS.map((d) => {
                  const isSelected = block.days.includes(d.id);
                  const isAssignedOther = otherAssignedDays.has(d.id);

                  if (isAssignedOther) {
                    return (
                      <button
                        key={d.id}
                        type="button"
                        disabled
                        className="py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 border bg-slate-900/30 border-slate-800/40 text-slate-600 opacity-40 cursor-not-allowed"
                        title={`${d.name} (asignado en otro bloque)`}
                      >
                        <span className="line-through">{d.label}</span>
                        <span className="text-[9px] font-normal hidden sm:inline">Ocupado</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleToggleDay(block.id, d.id)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                      title={d.name}
                    >
                      <span>{d.label}</span>
                      <span className="text-[9px] font-normal opacity-70 hidden sm:inline">
                        {d.name.slice(0, 3)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Hora Inicio</label>
                <div className="relative">
                  <input
                    type="text"
                    value={block.startTime}
                    onChange={(e) => handleStartTimeChange(block.id, maskTimeInput(e.target.value))}
                    placeholder="08:00"
                    maxLength={5}
                    inputMode="numeric"
                    autoComplete="off"
                    className="w-28 pl-3 pr-8 py-2 bg-slate-900/80 border border-slate-700 text-slate-100 rounded-lg text-sm text-center focus:border-emerald-500 focus:outline-none"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Hora Fin</label>
                <div className="relative">
                  <input
                    type="text"
                    value={block.endTime}
                    onChange={(e) => handleEndTimeChange(block.id, maskTimeInput(e.target.value))}
                    placeholder="20:00"
                    maxLength={5}
                    inputMode="numeric"
                    autoComplete="off"
                    className="w-28 pl-3 pr-8 py-2 bg-slate-900/80 border border-slate-700 text-slate-100 rounded-lg text-sm text-center focus:border-emerald-500 focus:outline-none"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleAddBlock}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-sm shadow-emerald-500/5"
        >
          <Plus size={14} />
          <span>Agregar otro rango/bloque de horario</span>
        </button>
      </div>

      {totalConfiguredDays === 0 ? (
        <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center">
          Seleccioná al menos un día en algún bloque para configurar el horario semanal.
        </p>
      ) : (
        <div className="pt-3 border-t border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Disponibilidad por día configurado ({scheduleRows.length} {scheduleRows.length === 1 ? 'día' : 'días'})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scheduleRows.map((row, idx) => {
              const badge =
                row.status === 'blocked'
                  ? { label: 'Bloqueado', cls: 'text-red-400 bg-red-500/10 border-red-500/30' }
                  : row.status === 'shared'
                    ? { label: 'Compartido', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' }
                    : { label: 'Libre', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };

              const styleCls =
                row.status === 'blocked'
                  ? 'border-red-500/50 bg-red-500/5'
                  : row.status === 'shared'
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-slate-800 bg-slate-950/40';

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${styleCls}`}
                >
                  <span className="font-semibold text-slate-200">
                    {DAYS[row.dayOfWeek]}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({row.startTime} - {row.endTime})
                    </span>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.cls}`}>
                    {row.status === 'blocked' ? (
                      <AlertCircle size={10} />
                    ) : row.status === 'shared' ? (
                      <AlertTriangle size={10} />
                    ) : (
                      <CheckCircle2 size={10} />
                    )}
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};