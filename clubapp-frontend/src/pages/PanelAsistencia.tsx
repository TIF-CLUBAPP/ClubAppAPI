import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck, Users, Check, X, RefreshCw, CalendarDays, Clock, ShieldAlert,
  UserCheck, UserX, CalendarX2, Search,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useToast } from '../context/ToastContext';
import { attendanceService } from '../services/attendanceService';
import type { TeacherClass, AttendanceStatus } from '../types/attendance';

const toDateInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Devuelve la fecha de hoy (solo día, sin hora) para bloquear fechas futuras. */
const todayInput = () => toDateInput(new Date());

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT', label: 'Presente' },
  { value: 'ABSENT', label: 'Ausente' },
  { value: 'JUSTIFIED', label: 'Justificado' },
];

// Componente de estado vacío reutilizable
const EmptyState = ({ query, onClear }: { query: string; onClear: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
    <Search className="w-12 h-12 mb-3 opacity-20" />
    <p className="text-sm font-semibold">No encontramos alumnos con '{query}'</p>
    <p className="text-xs mb-4">Verificá el nombre o limpiá el filtro para ver toda la clase.</p>
    <button
      onClick={onClear}
      className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
    >
      Limpiar búsqueda
    </button>
  </div>
);


export default function PanelAsistencia() {
  const [date, setDate] = useState<string>(todayInput());
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [dailySearch, setDailySearch] = useState('');
  const [dailyFocused, setDailyFocused] = useState(false);
  const [trackingFocused, setTrackingFocused] = useState(false);
  const toast = useToast();

  const maxDate = useMemo(() => todayInput(), []);

  const load = async (opts?: { silent?: boolean; keepSelection?: boolean }) => {
    const { silent = false, keepSelection = false } = opts ?? {};
    if (!silent) setLoading(true);
    try {
      const data = await attendanceService.getClasses(date);
      const list = Array.isArray(data) ? data : [];
      setClasses(list);
      if (list.length > 0) {
        // Tras guardar, se mantiene seleccionada la clase actual en lugar de
        // saltar siempre a la primera, evitando cambios bruscos de contenido.
        const keepId = keepSelection ? selectedId : null;
        const target = list.find((c) => c.activityScheduleId === keepId) ?? list[0];
        setSelectedId(target.activityScheduleId);
        setAttendance(Object.fromEntries(target.students.map((s) => [s.userId, s.status])));
      } else {
        setSelectedId(null);
        setAttendance({});
      }
    } catch (err: any) {
      // Una respuesta vacía (404/204) o "sin clases para la fecha" NO es un error real:
      // se muestra únicamente el contenedor "No tenés clases asignadas para esta fecha".
      const status = err?.response?.status;
      if (status === 404 || status === 204) {
        setClasses([]);
        setSelectedId(null);
        setAttendance({});
      } else {
        toast.error(err?.response?.data?.detail ?? 'No se pudieron cargar las clases.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const selected = classes.find((c) => c.activityScheduleId === selectedId) ?? null;

  const handleSelectClass = (id: number) => {
    const c = classes.find((x) => x.activityScheduleId === id);
    setSelectedId(id);
    setAttendance(Object.fromEntries((c?.students ?? []).map((s) => [s.userId, s.status])));
  };

  const setStatus = (userId: number, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [userId]: status }));
  };

  const presentCount = selected
    ? selected.students.filter((s) => attendance[s.userId] === 'PRESENT').length
    : 0;

  // Métricas de la clase seleccionada (reactivas al toggle de asistencia).
  const stats = useMemo(() => {
    if (!selected) return null;
    const total = selected.students.length;
    let present = 0;
    let absent = 0;
    let justified = 0;
    for (const s of selected.students) {
      const st = attendance[s.userId] ?? 'ABSENT';
      if (st === 'PRESENT') present += 1;
      else if (st === 'JUSTIFIED') justified += 1;
      else absent += 1;
    }
    return { total, present, absent, justified };
  }, [selected, attendance]);

  // Alumnos filtrados por el buscador del seguimiento (ignora la fecha puntual).
  const filteredStudents = useMemo(() => {
    if (!selected) return [];
    const q = search.trim().toLowerCase();
    if (!q) return selected.students;
    return selected.students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [selected, search]);

  // Alumnos filtrados por el buscador de la toma de asistencia diaria.
  const dailyFilteredStudents = useMemo(() => {
    if (!selected) return [];
    const q = dailySearch.trim().toLowerCase();
    if (!q) return selected.students;
    return selected.students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [selected, dailySearch]);

  // Sugerencias del dropdown de la toma de asistencia diaria (solo alumnos de la clase).
  const dailySuggestions = useMemo(() => {
    if (!selected) return [];
    const q = dailySearch.trim().toLowerCase();
    if (!q) return [];
    return selected.students
      .filter((s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [selected, dailySearch]);

  // Sugerencias del dropdown del seguimiento (solo alumnos de la clase).
  const trackingSuggestions = useMemo(() => {
    if (!selected) return [];
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return selected.students
      .filter((s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [selected, search]);

  const changeDate = (value: string) => {
    // Bloqueo estricto de fechas futuras (además del atributo `max`).
    if (value && value > maxDate) {
      toast.error('No se puede tomar asistencia para fechas futuras.');
      setDate(maxDate);
      return;
    }
    setDate(value);
  };

  const goToday = () => setDate(todayInput());

  const handleSave = async () => {
    if (!selected || saving) return;

    // No se puede guardar asistencia si la clase no tiene alumnos inscriptos.
    if (selected.students.length === 0) {
      toast.info(
        'No hay alumnos inscriptos en esta clase. No es posible guardar asistencias sin participantes.\nLos alumnos deben inscribirse previamente a la actividad para poder registrar su asistencia.',
      );
      return;
    }

    setSaving(true);
    try {
      await attendanceService.markAttendance({
        activityScheduleId: selected.activityScheduleId,
        date,
        attendances: selected.students.map((s) => ({
          userId: s.userId,
          status: attendance[s.userId] ?? 'ABSENT',
        })),
      });
      toast.success('Asistencia guardada correctamente.');
      // Recarga en silencio (sin spinner de pantalla completa) y conservando la
      // clase seleccionada, para no provocar un salto de scroll ni alterar la vista.
      await load({ silent: true, keepSelection: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'No se pudo guardar la asistencia.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header />
        <main className="flex-1 w-full min-w-0 overflow-y-auto pt-16 px-4 pb-32 md:pt-6 md:px-6 md:pb-6">
          <div className="space-y-8 max-w-7xl mx-auto">
            {/* Encabezado */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Control Docente
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5 mt-1">
                <ClipboardCheck className="w-6 h-6 text-emerald-400" /> Asistencia
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Registrá y supervisá la asistencia de tus alumnos por clase.
              </p>
            </div>

            {/* Barra de controles: fecha + clase */}
            <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5 mb-2">
                    <CalendarDays size={12} /> Fecha de la clase
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={date}
                      max={maxDate}
                      onChange={(e) => changeDate(e.target.value)}
                      className="flex-1 min-w-0 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
                    />
                    {date !== todayInput() && (
                      <button
                        type="button"
                        onClick={goToday}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shrink-0"
                      >
                        Hoy
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5 mb-2">
                    <Clock size={12} /> Clase
                  </label>
                  <select
                    value={selectedId ?? ''}
                    onChange={(e) => handleSelectClass(Number(e.target.value))}
                    disabled={classes.length === 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {classes.length === 0 ? (
                      <option value="">Sin clases este día</option>
                    ) : (
                      classes.map((c) => (
                        <option key={c.activityScheduleId} value={c.activityScheduleId}>
                          {c.activityName} · {c.startTime}–{c.endTime}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Contenido */}
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-400 gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-sm font-medium">Cargando tus clases...</span>
              </div>
            ) : classes.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                  <CalendarDays className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">No tenés clases asignadas para esta fecha</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  Probá elegir otro día con el selector de fecha para ver y registrar asistencia.
                </p>
              </div>
            ) : selected ? (
              <>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white truncate">{selected.activityName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selected.startTime} – {selected.endTime} hs · {selected.students.length} inscriptos
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 shrink-0">
                    <Users size={15} /> {presentCount} presentes
                  </span>
                </div>

                {/* Panel de estadísticas de la clase seleccionada */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wide">
                        <Users size={14} className="text-sky-400" /> Inscriptos
                      </div>
                      <p className="mt-1.5 text-2xl font-black text-white">
                        {stats.total}
                        <span className="text-sm font-semibold text-slate-500 ml-1">(100%)</span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wide">
                        <UserCheck size={14} className="text-emerald-400" /> Presentes
                      </div>
                      <p className="mt-1.5 text-2xl font-black text-emerald-400">
                        {stats.present}
                        <span className="text-sm font-semibold text-slate-500 ml-1">
                          ({stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)
                        </span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wide">
                        <UserX size={14} className="text-rose-400" /> Ausentes
                      </div>
                      <p className="mt-1.5 text-2xl font-black text-rose-400">
                        {stats.absent}
                        <span className="text-sm font-semibold text-slate-500 ml-1">
                          ({stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%)
                        </span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wide">
                        <ShieldAlert size={14} className="text-amber-400" /> Justificados
                      </div>
                      <p className="mt-1.5 text-2xl font-black text-amber-400">
                        {stats.justified}
                        <span className="text-sm font-semibold text-slate-500 ml-1">
                          ({stats.total > 0 ? Math.round((stats.justified / stats.total) * 100) : 0}%)
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Buscador de alumnos en la toma de asistencia diaria */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="search"
                    name={`search-student-${Math.random()}`}
                    value={dailySearch}
                    onFocus={(e) => {
                      e.currentTarget.removeAttribute('readonly');
                      setDailyFocused(true);
                    }}
                    onBlur={() => setDailyFocused(false)}
                    onChange={(e) => setDailySearch(e.target.value)}
                    placeholder="Buscar alumno por nombre..."
                    autoComplete="new-password"
                    spellCheck={false}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                  {dailyFocused && dailySearch.trim() !== '' && dailySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#0B1221] border border-white/10 rounded-xl shadow-xl z-30 overflow-hidden">
                      {dailySuggestions.map((s) => {
                        const status = attendance[s.userId] ?? 'ABSENT';
                        return (
                          <button
                            key={s.userId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setDailySearch(s.fullName);
                              setDailyFocused(false);
                            }}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5 transition-colors"
                          >
                            <span className="truncate font-semibold">{s.fullName}</span>
                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border">
                              {status === 'PRESENT' ? (
                                <span className="text-emerald-400">Presente</span>
                              ) : status === 'JUSTIFIED' ? (
                                <span className="text-amber-400">Justificado</span>
                              ) : (
                                <span className="text-rose-400">Ausente</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selected.students.length > 0 ? (
                  <div className="space-y-2.5">
                    {selected.students.map((s) => {
                      const status = attendance[s.userId] ?? 'ABSENT';
                      const isMatch = dailySearch.trim() === '' || s.fullName.toLowerCase().includes(dailySearch.trim().toLowerCase());
                      return (
                        <div
                          key={s.userId}
                          className={`grid transition-all duration-300 ease-in-out ${
                            isMatch ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 bg-slate-950/60 border-slate-800 my-1">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{s.fullName}</p>
                              </div>

                              <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                                {STATUS_OPTIONS.map((opt) => {
                                  const active = status === opt.value;
                                  const color =
                                    opt.value === 'PRESENT'
                                      ? 'bg-emerald-500 text-slate-950'
                                      : opt.value === 'ABSENT'
                                      ? 'bg-rose-500 text-slate-950'
                                      : 'bg-amber-500 text-slate-950';
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => setStatus(s.userId, opt.value)}
                                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        active ? color : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      {opt.value === 'PRESENT' ? (
                                        <Check size={14} />
                                      ) : opt.value === 'ABSENT' ? (
                                        <X size={14} />
                                      ) : (
                                        <ShieldAlert size={14} />
                                      )}
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {dailyFilteredStudents.length === 0 && (
                      <EmptyState query={dailySearch} onClear={() => setDailySearch('')} />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No hay alumnos inscriptos en esta clase.
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || selected.students.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl transition text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <ClipboardCheck size={18} />
                  )}
                  {saving ? 'Guardando...' : 'Guardar Asistencia'}
                </button>
              </div>

              {/* Tarjeta independiente: Seguimiento de alumnos (consolidado histórico, no depende de la fecha) */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarX2 size={15} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                      Seguimiento de alumnos
                    </h3>
                  </div>
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="search"
                      name={`search-track-${Math.random()}`}
                      value={search}
                      onFocus={(e) => {
                        e.currentTarget.removeAttribute('readonly');
                        setTrackingFocused(true);
                      }}
                      onBlur={() => setTrackingFocused(false)}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar alumno por nombre..."
                      autoComplete="new-password"
                      spellCheck={false}
                      readOnly
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 placeholder:text-slate-500"
                    />
                    {trackingFocused && search.trim() !== '' && trackingSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#0B1221] border border-white/10 rounded-xl shadow-xl z-30 overflow-hidden">
                        {trackingSuggestions.map((s) => {
                          const active = (s.enrollmentStatus ?? 'ACTIVE').toUpperCase() === 'ACTIVE';
                          return (
                            <button
                              key={s.userId}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSearch(s.fullName);
                                setTrackingFocused(false);
                              }}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5 transition-colors"
                            >
                              <span className="truncate font-semibold">{s.fullName}</span>
                              <span
                                className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  active
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}
                              >
                                {active ? 'Activo' : 'Dejó la clase'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {selected.students.length > 0 ? (
                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full min-w-[720px] text-sm border-collapse table-fixed">
                      {filteredStudents.length > 0 && (
                        <thead>
                          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                            <th className="py-2 pr-4 font-semibold text-left">Alumno</th>
                            <th className="py-2 px-4 font-semibold text-center">Presentes</th>
                            <th className="py-2 px-4 font-semibold text-center">Ausentes</th>
                            <th className="py-2 px-4 font-semibold text-center">Justificados</th>
                            <th className="py-2 pl-4 font-semibold text-right">% Asistencia</th>
                          </tr>
                        </thead>
                      )}
                      <tbody>
          {filteredStudents.map((s) => {
            const active = (s.enrollmentStatus ?? 'ACTIVE').toUpperCase() === 'ACTIVE';
            const presents = s.presents ?? 0;
            const absents = s.absents ?? 0;
            const justified = s.justified ?? 0;
            const effectiveTotal = presents + absents;
            const pct = effectiveTotal > 0 ? Math.round((presents / effectiveTotal) * 100) : null;
            return (
              <tr key={s.userId} className="border-b border-slate-800/60 last:border-0">
                <td className="py-2.5 pr-4 align-top">
                  <p className="font-semibold text-white truncate">{s.fullName}</p>
                  <span className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    {active ? <UserCheck size={11} /> : <UserX size={11} />}
                    {active ? 'Activo' : 'Dejó la clase'}
                  </span>
                </td>
                <td className="py-2.5 px-4 align-top text-center whitespace-nowrap">
                  <span className="font-bold text-emerald-400">{presents}</span>
                  <span className="block text-[10px] text-slate-500">
                    {effectiveTotal > 0 ? `${Math.round((presents / effectiveTotal) * 100)}%` : '—'}
                  </span>
                </td>
                <td className="py-2.5 px-4 align-top text-center whitespace-nowrap">
                  <span className="font-bold text-rose-400">{absents}</span>
                  <span className="block text-[10px] text-slate-500">
                    {effectiveTotal > 0 ? `${Math.round((absents / effectiveTotal) * 100)}%` : '—'}
                  </span>
                </td>
                <td className="py-2.5 px-4 align-top text-center whitespace-nowrap">
                  <span className="font-bold text-amber-400">{justified}</span>
                  <span className="block text-[10px] text-slate-500">no penaliza</span>
                </td>
                <td className="py-2.5 pl-4 align-top text-right whitespace-nowrap">
                  {pct !== null ? (
                    <span className={`inline-flex items-center font-bold ${pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {pct}%
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-3">
                    No hay alumnos inscriptos para mostrar.
                  </p>
                )}
              </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

