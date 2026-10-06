import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Users,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { activityService } from '../services/activityService';
import type { Activity } from '../types/activity';

const fmtCurrency = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

export default function InscripcionActividades() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await activityService.getActivities();
      setActivities(data);
    } catch (err: any) {
      setToast({ type: 'error', text: err?.response?.data?.message ?? 'No se pudieron cargar las actividades.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleEnroll = async (activity: Activity) => {
    if (activity.availableSpots <= 0) {
      setToast({ type: 'error', text: 'No hay cupos disponibles para esta actividad.' });
      return;
    }
    try {
      setBusyId(activity.id);
      await activityService.enroll(activity.id);
      setToast({ type: 'ok', text: `¡Inscripción exitosa en ${activity.name}!` });
      await load();
    } catch (err: any) {
      setToast({ type: 'error', text: err?.response?.data?.message ?? 'No se pudo completar la inscripción.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
        <Header />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Encabezado */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} /> Actividades del Club
                </span>
                <h2 className="text-2xl font-black text-white mt-1">Inscripción a Actividades</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Elegí tu actividad y reservá tu lugar. Los cupos son limitados.
                </p>
              </div>

              <button
                onClick={load}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-white text-xs font-semibold transition-all self-start md:self-auto"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
              </button>
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
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-sm font-medium">Cargando actividades...</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                No hay actividades disponibles por el momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {activities.map((a) => {
                  const full = a.availableSpots <= 0;
                  const inactive = !a.isActive;

                  return (
                    <motion.article
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-slate-900/80 border ${
                        inactive ? 'border-slate-800 opacity-75' : 'border-slate-800 hover:border-emerald-500/40'
                      } rounded-3xl p-6 shadow-xl flex flex-col gap-4 transition-all`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                            <Dumbbell size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white leading-tight">{a.name}</h3>
                            {a.category && (
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                                {a.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            inactive
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {inactive ? 'INACTIVA' : 'ACTIVA'}
                        </span>
                      </div>

                      {a.description && <p className="text-xs text-slate-400 leading-relaxed">{a.description}</p>}

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Users size={13} className="text-slate-500" /> Cupos
                          </span>
                          <span className={`font-bold ${full ? 'text-rose-400' : 'text-emerald-400'}`}>
                            Disponibles: {Math.max(a.availableSpots, 0)} / {a.maxCapacity}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${full ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{
                              width: `${a.maxCapacity > 0 ? Math.min(100, (a.enrolledCount / a.maxCapacity) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {a.schedules.length > 0 ? (
                          a.schedules.map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1"
                            >
                              <Clock size={11} className="text-emerald-400" />
                              {s.dayName} {s.startTime}-{s.endTime}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                            <Clock size={11} /> {a.schedule || 'Horario a confirmar'}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                        <div className="flex flex-col">
                          {a.teacherName && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <UserCheck size={12} className="text-sky-400" /> {a.teacherName}
                            </span>
                          )}
                          <span className="text-sm font-bold text-white">
                            {a.price > 0 ? fmtCurrency(a.price) : 'Gratuita'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleEnroll(a)}
                          disabled={full || inactive || busyId === a.id}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            full || inactive
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          {busyId === a.id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : full ? (
                            'Cupos llenos'
                          ) : (
                            'Inscribirme'
                          )}
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}