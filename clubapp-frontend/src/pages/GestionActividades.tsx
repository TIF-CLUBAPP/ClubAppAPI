import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, X, Save, Clock, MapPin,
  CheckCircle2, AlertCircle, AlertTriangle, Dumbbell, RefreshCw, Users,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { activityService } from '../services/activityService';
import { spaceService } from '../services/spaceService';
import type { Activity, ActivityScheduleInput, SaveActivityRequest } from '../types/activity';
import type { Space } from '../types/space';
import { SPORT_CATEGORIES } from '../types/space';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const parseNumericInput = (raw: string): number => {
  const cleaned = raw.replace(/^0+(?=\d)/, '');
  return cleaned === '' ? 0 : Number(cleaned);
};

const timeToMin = (t: string): number => {
  const [h, m] = t.split(':').map((n) => Number(n));
  return (h || 0) * 60 + (m || 0);
};

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean =>
  timeToMin(aStart) < timeToMin(bEnd) && timeToMin(bStart) < timeToMin(aEnd);

const emptyForm = (): SaveActivityRequest => ({
  name: '',
  description: '',
  category: SPORT_CATEGORIES[0],
  price: 0,
  maxCapacity: 10,
  teacherId: null,
  spaceId: null,
  requiresBooking: false,
  isActive: true,
  schedule: '',
  schedules: [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }],
});

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-slate-400">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-1 transition-all duration-200 ${checked ? 'bg-emerald-500' : 'bg-slate-700/80'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

interface RowConflict {
  activityName: string;
  category: string;
  sameSport: boolean;
}

type RowStatus = 'free' | 'blocked' | 'shared';

interface ScheduleRow extends ActivityScheduleInput {
  status: RowStatus;
  blockedBy: RowConflict[];
  sharedWith: RowConflict[];
}

export default function GestionActividades() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<SaveActivityRequest>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [acts, sps] = await Promise.all([activityService.getActivities(), spaceService.getSpaces()]);
      setActivities(acts);
      setSpaces(sps);
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message ?? 'No se pudieron cargar las actividades.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === form.spaceId) ?? null,
    [spaces, form.spaceId],
  );
  const scheduleRows = useMemo<ScheduleRow[]>(() => {
    return form.schedules.map((row) => {
      const conflicts: RowConflict[] = [];

      if (form.spaceId != null) {
        for (const a of activities) {
          if (editing && a.id === editing.id) continue;
          if (a.spaceId !== form.spaceId) continue;

          for (const s of a.schedules) {
            if (s.dayOfWeek !== row.dayOfWeek) continue;
            if (!overlaps(row.startTime, row.endTime, s.startTime, s.endTime)) continue;

            const sameSport =
              a.category.trim().toLowerCase() === form.category.trim().toLowerCase();
            conflicts.push({ activityName: a.name, category: a.category, sameSport });
          }
        }
      }

      let status: RowStatus = 'free';
      const blockedBy: RowConflict[] = [];
      const sharedWith: RowConflict[] = [];

      for (const c of conflicts) {
        if (!selectedSpace?.permitir_superposicion || !c.sameSport) {
          status = 'blocked';
          blockedBy.push(c);
        } else {
          if (status !== 'blocked') status = 'shared';
          sharedWith.push(c);
        }
      }

      return { ...row, status, blockedBy, sharedWith };
    });
  }, [form.schedules, form.spaceId, form.category, activities, editing, selectedSpace]);

  const hasBlocked = scheduleRows.some((r) => r.status === 'blocked');
  const sharedWarnings = Array.from(
    new Set(
      scheduleRows
        .filter((r) => r.status === 'shared')
        .flatMap((r) => r.sharedWith.map((c) => c.activityName)),
    ),
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (a: Activity) => {
    setEditing(a);
    setForm({
      name: a.name,
      description: a.description,
      category: a.category,
      price: a.price,
      maxCapacity: a.maxCapacity,
      teacherId: a.teacherId ?? null,
      spaceId: a.spaceId ?? null,
      requiresBooking: a.requiresBooking,
      isActive: a.isActive,
      schedule: a.schedule,
      schedules:
        a.schedules.length > 0
          ? a.schedules.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime }))
          : [{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }],
    });
    setModalOpen(true);
  };

  const addScheduleRow = () => {
    setForm((f) => ({
      ...f,
      schedules: [...f.schedules, { dayOfWeek: 1, startTime: '18:00', endTime: '19:00' }],
    }));
  };

  const removeScheduleRow = (index: number) => {
    setForm((f) => ({ ...f, schedules: f.schedules.filter((_, i) => i !== index) }));
  };

  const updateScheduleRow = (index: number, patch: Partial<ActivityScheduleInput>) => {
    setForm((f) => ({
      ...f,
      schedules: f.schedules.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await activityService.deleteActivity(deleteTarget.id);
      setToast({ type: 'success', message: 'Actividad eliminada correctamente.' });
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message ?? 'No se pudo eliminar la actividad.' });
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasBlocked) {
      setToast({ type: 'error', message: 'Hay horarios bloqueados. Revisá los conflictos en rojo.' });
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await activityService.updateActivity(editing.id, form);
        setToast({ type: 'success', message: 'Actividad actualizada correctamente.' });
      } else {
        await activityService.createActivity(form);
        setToast({ type: 'success', message: 'Actividad creada correctamente.' });
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setToast({ type: 'error', message: err?.response?.data?.message ?? 'No se pudo guardar la actividad.' });
    } finally {
      setSaving(false);
    }
  };

  const rowStyle = (status: RowStatus) =>
    status === 'blocked'
      ? 'border-red-500/50 bg-red-500/5'
      : status === 'shared'
        ? 'border-amber-500/50 bg-amber-500/5'
        : 'border-slate-800 bg-slate-950/40';

  const rowBadge = (status: RowStatus) => {
    if (status === 'blocked') return { label: 'Bloqueado', cls: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (status === 'shared') return { label: 'Compartido', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Libre', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell size={14} /> Administración
                </span>
                <h2 className="text-2xl font-black text-white mt-1">Gestión de Actividades</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Creá y editá actividades, asigná espacios y validá la disponibilidad de horarios.
                </p>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all self-start md:self-auto"
              >
                <Plus size={14} /> Nueva Actividad
              </button>
            </div>

            {loading ? (
              <p className="text-slate-300">Cargando...</p>
            ) : activities.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                No hay actividades cargadas todavía.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activities.map((a) => (
                  <div key={a.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white truncate">{a.name}</h3>
                          {!a.isActive && (
                            <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          <Dumbbell size={11} className="inline mr-1 text-emerald-400" />
                          {a.category}
                          {a.spaceName && (
                            <>
                              <MapPin size={11} className="inline ml-2 mr-1 text-sky-400" />
                              {a.spaceName}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => openEdit(a)}
                          className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 border border-slate-700"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="p-2 bg-red-900/20 text-red-400 rounded-md hover:bg-red-900/40 border border-red-900/20"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
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
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                          <Clock size={11} className="inline mr-1" /> {a.schedule || 'Sin horario'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-violet-400" /> Cupo: {a.maxCapacity}
                      </span>
                      <span>{Math.max(a.availableSpots, 0)} disponibles</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">{editing ? 'Editar Actividad' : 'Nueva Actividad'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Deporte / Categoría</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                    >
                      {SPORT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Espacio físico</label>
                    <select
                      value={form.spaceId ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, spaceId: e.target.value ? Number(e.target.value) : null })
                      }
                      className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                    >
                      <option value="">— Sin espacio —</option>
                      {spaces.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.sportCategory})
                        </option>
                      ))}
                    </select>
                    {selectedSpace && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Superposición: {selectedSpace.permitir_superposicion ? 'permitida (mismo deporte)' : 'bloqueada'}.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Precio ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price === 0 ? '' : form.price}
                      onChange={(e) => setForm({ ...form, price: parseNumericInput(e.target.value) })}
                      className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Cupo máximo</label>
                    <input
                      type="number"
                      min={0}
                      value={form.maxCapacity === 0 ? '' : form.maxCapacity}
                      onChange={(e) => setForm({ ...form, maxCapacity: parseNumericInput(e.target.value) })}
                      className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-400">Días y horarios</label>
                    <button
                      type="button"
                      onClick={addScheduleRow}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold"
                    >
                      <Plus size={13} /> Agregar horario
                    </button>
                  </div>

                  <div className="space-y-2">
                    {scheduleRows.map((row, index) => {
                      const badge = rowBadge(row.status);
                      return (
                        <div key={index} className={`rounded-xl border p-3 ${rowStyle(row.status)}`}>
                          <div className="flex flex-wrap items-end gap-2">
                            <div className="flex-1 min-w-30">
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Día</label>
                              <select
                                value={row.dayOfWeek}
                                onChange={(e) => updateScheduleRow(index, { dayOfWeek: Number(e.target.value) })}
                                className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2 text-xs focus:border-emerald-500 outline-none"
                              >
                                {DAYS.map((d, i) => (
                                  <option key={d} value={i}>{d}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Inicio</label>
                              <input
                                type="time"
                                value={row.startTime}
                                onChange={(e) => updateScheduleRow(index, { startTime: e.target.value })}
                                className="bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2 text-xs focus:border-emerald-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Fin</label>
                              <input
                                type="time"
                                value={row.endTime}
                                onChange={(e) => updateScheduleRow(index, { endTime: e.target.value })}
                                className="bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2 text-xs focus:border-emerald-500 outline-none"
                              />
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${badge.cls}`}>
                              {row.status === 'blocked' ? <AlertCircle size={11} /> : row.status === 'shared' ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                              {badge.label}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeScheduleRow(index)}
                              className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-red-900/30 hover:text-red-400 border border-slate-700"
                              title="Quitar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {row.blockedBy.length > 0 && (
                            <p className="mt-2 text-[11px] text-red-400 flex items-start gap-1">
                              <AlertCircle size={12} className="shrink-0 mt-0.5" />
                              <span>
                                Bloqueado: colisiona con {row.blockedBy.map((c) => c.activityName).join(', ')}.
                                {!selectedSpace?.permitir_superposicion
                                  ? ' Este espacio no permite superposiciones.'
                                  : ' Son deportes distintos, incompatibles.'}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {sharedWarnings.length > 0 && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <span>
                        Atención: Horario superpuesto con {sharedWarnings.join(', ')}. Compartirán el espacio
                        (mismo deporte), se guardará igualmente.
                      </span>
                    </div>
                  )}

                  {hasBlocked && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>Hay conflictos en rojo. Resolvé los bloqueos para poder guardar.</span>
                    </div>
                  )}
                </div>

                <Toggle
                  label="Requiere reserva previa"
                  checked={form.requiresBooking}
                  onChange={(v) => setForm({ ...form, requiresBooking: v })}
                />

                <Toggle
                  label="Actividad activa"
                  checked={form.isActive}
                  onChange={(v) => setForm({ ...form, isActive: v })}
                />

                <button
                  type="submit"
                  disabled={hasBlocked || saving}
                  className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Eliminar actividad</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    ¿Seguro que deseas eliminar la actividad <strong className="text-slate-200">“{deleteTarget.name}”</strong>? Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  {deleting ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-400 shrink-0" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
