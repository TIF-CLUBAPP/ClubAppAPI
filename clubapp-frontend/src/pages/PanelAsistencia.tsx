import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck, Users, Check, X, RefreshCw, CalendarDays, Clock, ShieldAlert,
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

export default function PanelAsistencia() {
  const [date, setDate] = useState<string>(todayInput());
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const maxDate = useMemo(() => todayInput(), []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getClasses(date);
      const list = Array.isArray(data) ? data : [];
      setClasses(list);
      if (list.length > 0) {
        setSelectedId(list[0].activityScheduleId);
        setAttendance(Object.fromEntries(list[0].students.map((s) => [s.userId, s.status])));
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
      setLoading(false);
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
    if (!selected) return;
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
      await load();
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
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5 mb-2">
                    <CalendarDays size={12} /> Fecha de la clase
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={date}
                      max={maxDate}
                      onChange={(e) => changeDate(e.target.value)}
                      className="flex-1 max-w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
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

                <div className="flex-1">
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


                {selected.students.length > 0 ? (
                  <div className="space-y-2.5">
                    {selected.students.map((s) => {
                      const status = attendance[s.userId] ?? 'ABSENT';
                      return (
                        <div
                          key={s.userId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all bg-slate-950/60 border-slate-800"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{s.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">{s.email}</p>
                          </div>

                          {/* Toggle de 3 estados: Presente / Ausente / Justificado */}
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
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No hay alumnos inscriptos en esta clase.
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl transition text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <ClipboardCheck size={18} />
                  )}
                  Guardar Asistencia
                </button>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

