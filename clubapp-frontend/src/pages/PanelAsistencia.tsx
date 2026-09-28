import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Users, Check, X, RefreshCw, CheckCircle2, AlertCircle, Sparkles, CalendarDays } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { attendanceService } from '../services/attendanceService';
import type { TeacherClass } from '../types/attendance';

const toDateInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function PanelAsistencia() {
  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState<string>(toDateInput(today));
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getClasses(date);
      setClasses(data);
      if (data.length > 0) {
        setSelectedId(data[0].activityScheduleId);
        setAttendance(Object.fromEntries(data[0].students.map((s) => [s.userId, s.present])));
      } else {
        setSelectedId(null);
        setAttendance({});
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err?.response?.data?.detail ?? 'No se pudieron cargar las clases.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [date]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const selected = classes.find((c) => c.activityScheduleId === selectedId) ?? null;

  const handleSelectClass = (id: number) => {
    const c = classes.find((x) => x.activityScheduleId === id);
    setSelectedId(id);
    setAttendance(Object.fromEntries((c?.students ?? []).map((s) => [s.userId, s.present])));
  };

  const toggle = (userId: number) => {
    setAttendance((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const presentCount = selected
    ? selected.students.filter((s) => attendance[s.userId]).length
    : 0;

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await attendanceService.markAttendance({
        activityScheduleId: selected.activityScheduleId,
        date,
        attendances: selected.students.map((s) => ({ userId: s.userId, present: attendance[s.userId] ?? false })),
      });
      setToast({ type: 'ok', text: 'Asistencia guardada correctamente.' });
      await load();
    } catch (err: any) {
      setToast({ type: 'error', text: err?.response?.data?.detail ?? 'No se pudo guardar la asistencia.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Encabezado */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-6">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> Panel del Profesor
              </span>
              <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
                <ClipboardCheck className="text-emerald-400" size={24} /> Asistencia
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Registrá rápidamente quién asistió a tu clase del día.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                  <CalendarDays size={12} /> Fecha de la clase
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 max-w-[240px]"
                />
              </div>
            </div>

            {/* Toast */}
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium ${
                  toast.type === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {toast.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {toast.text}
              </motion.div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-400 gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-sm font-medium">Cargando tus clases...</span>
              </div>
            ) : classes.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                No tenés clases programadas para esta fecha.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <button
                      key={c.activityScheduleId}
                      onClick={() => handleSelectClass(c.activityScheduleId)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedId === c.activityScheduleId
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/40'
                      }`}
                    >
                      {c.activityName} · {c.startTime}-{c.endTime}
                    </button>
                  ))}
                </div>

                {selected && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">{selected.activityName}</h3>
                        <p className="text-xs text-slate-400">
                          {selected.startTime} - {selected.endTime} hs · {selected.students.length} inscriptos
                        </p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                        <Users size={15} /> {presentCount} presentes
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {selected.students.map((s) => {
                        const isPresent = !!attendance[s.userId];
                        return (
                          <div
                            key={s.userId}
                            className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                              isPresent
                                ? 'bg-emerald-500/5 border-emerald-500/30'
                                : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{s.fullName}</p>
                              <p className="text-xs text-slate-500 truncate">{s.email}</p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => toggle(s.userId)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isPresent
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                              >
                                <Check size={15} /> Presente
                              </button>
                              <button
                                onClick={() => toggle(s.userId)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  !isPresent
                                    ? 'bg-rose-500 text-slate-950'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                              >
                                <X size={15} /> Ausente
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selected.students.length === 0 && (
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
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}