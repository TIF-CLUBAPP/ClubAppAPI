import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, X, Save, Clock, MapPin,
  CheckCircle2, AlertCircle, AlertTriangle, Dumbbell, RefreshCw, Users,
  GraduationCap, UserPlus, ChevronDown, Receipt, Banknote, Search,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { activityService } from '../services/activityService';
import { spaceService } from '../services/spaceService';
import { userService } from '../services/userService';
import type { Activity, ActivityScheduleInput, SaveActivityRequest, ActivitySettlement } from '../types/activity';
import type { Space } from '../types/space';
import { SPORT_CATEGORIES } from '../types/space';
import type { UserListItem } from '../types/user';
import {
  WeeklyScheduleSelector,
  type RowConflict,
  type RowStatus,
  type ScheduleRow,
  type WeeklyScheduleBlock,
  schedulesToBlocks,
  blocksToSchedules,
  maskTimeInput,
} from '../components/activities/WeeklyScheduleSelector';
import Combobox from '../components/ui/Combobox';

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

const fmtCurrency = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const emptyForm = (): SaveActivityRequest => ({
  name: '',
  description: '',
  category: SPORT_CATEGORIES[0],
  priceMember: 0,
  priceNonMember: 0,
  facilityCanon: 0,
  aplicaDescuentoSocios: false,
  tipoDescuentoCanon: 'MONTO_FIJO',
  valorDescuentoPorSocio: 0,
  descuentoMaximoCanon: null,
  paymentCollector: 'CLUB',
  maxCapacity: 10,
  teacherId: null,
  instructorIds: [],
  spaceId: null,
  requiresBooking: false,
  isActive: true,
  schedule: '',
  schedules: [{ dayOfWeek: 1, startTime: '08:00', endTime: '20:00' }],
});

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-medium text-slate-200">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-1 transition-all duration-200 ${checked ? 'bg-emerald-500' : 'bg-slate-700/80'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

// Mensajes de error por campo en el formulario de actividad.
type FieldErrors = {
  name?: string;
  category?: string;
  spaceId?: string;
  maxCapacity?: string;
  schedules?: string;
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Devuelve los errores de validación previa de los campos obligatorios.
const validateForm = (form: SaveActivityRequest): FieldErrors => {
  const errors: FieldErrors = {};

  if (!form.name.trim()) errors.name = 'Este campo es obligatorio';

  if (!form.category || !form.category.trim()) errors.category = 'Selecciona un deporte';

  if (form.spaceId == null) errors.spaceId = 'Selecciona un espacio físico';

  if (!form.maxCapacity || form.maxCapacity <= 0) {
    errors.maxCapacity = 'Ingresa un cupo mayor a 0';
  }

  const validSchedules = (form.schedules ?? []).filter(
    (s) => TIME_RE.test(s.startTime) && TIME_RE.test(s.endTime) && timeToMin(s.startTime) < timeToMin(s.endTime),
  );
  if (validSchedules.length === 0) {
    errors.schedules = 'Agrega al menos un horario válido (inicio antes del fin)';
  }

  return errors;
};

export default function GestionActividades() {
  const { user: currentUser } = useAuth();
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [professors, setProfessors] = useState<UserListItem[]>([]);
  const [instructorsOpen, setInstructorsOpen] = useState(false);
  const [instructorSearch, setInstructorSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'mine' | 'all'>('mine');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<SaveActivityRequest>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [settlementTarget, setSettlementTarget] = useState<Activity | null>(null);
  const [settlement, setSettlement] = useState<ActivitySettlement | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [proposeTarget, setProposeTarget] = useState<Activity | null>(null);
  const [proposePrice, setProposePrice] = useState<number>(0);
  const [proposeCanon, setProposeCanon] = useState<number>(0);
  const [proposeSaving, setProposeSaving] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'detailed' | 'massive'>('detailed');
  const [massiveBlocks, setMassiveBlocks] = useState<WeeklyScheduleBlock[]>([
    { id: '1', days: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '20:00' },
  ]);

  const toast = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const [acts, sps] = await Promise.all([activityService.getActivities(), spaceService.getSpaces()]);
      setActivities(acts);
      setSpaces(sps);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'No se pudieron cargar las actividades.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfessors = async () => {
    try {
      const [teachers, admins, superAdmins] = await Promise.all([
        userService.getUsers({ role: 'TEACHER' }),
        userService.getUsers({ role: 'ADMIN' }),
        userService.getUsers({ role: 'SUPERADMIN' }),
      ]);
      const unique = Array.from(
        new Map([...teachers, ...admins, ...superAdmins].map((u) => [u.id, u])).values(),
      );
      setProfessors(unique);
    } catch {
      // Si un TEACHER abre la página no puede listar /users; no debe bloquear la carga.
      setProfessors([]);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!isStaff) return;
    loadProfessors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === form.spaceId) ?? null,
    [spaces, form.spaceId],
  );

  // Opciones del Combobox de deportes (SPORT_CATEGORIES es un array de strings).
  const sportOptions = useMemo(
    () => SPORT_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
    [],
  );

  // Opciones del Combobox de espacios físicos (id como value, nombre + categoría).
  const spaceOptions = useMemo(
    () => spaces.map((s) => ({ value: String(s.id), label: s.name, secondary: s.sportCategory })),
    [spaces],
  );

  // Determina si el usuario logueado puede editar/eliminar una actividad.
  // Los administradores pueden gestionar todo; un profesor solo las que tiene a cargo.
  const canManageActivity = (a: Activity): boolean => {
    if (isStaff) return true;
    if (currentUser?.role === 'TEACHER') {
      const myId = currentUser.id ? Number(currentUser.id) : null;
      if (myId == null) return false;
      const inInstructors = (a.instructors ?? []).some((i) => i.id === myId);
      const isTeacher = a.teacherId === myId;
      return inInstructors || isTeacher;
    }
    return false;
  };

  // Lista filtrada según el alcance seleccionado (Mis Actividades vs Todas).
  const visibleActivities = useMemo(() => {
    if (scopeFilter === 'all' || isStaff) return activities;
    const myId = currentUser?.id ? Number(currentUser.id) : null;
    if (myId == null) return [];
    return activities.filter((a) => {
      const inInstructors = (a.instructors ?? []).some((i) => i.id === myId);
      return inInstructors || a.teacherId === myId;
    });
  }, [activities, scopeFilter, isStaff, currentUser]);

  // Profesores filtrados por el texto de búsqueda en el selector.
  const filteredProfessors = useMemo(() => {
    const q = instructorSearch.trim().toLowerCase();
    if (!q) return professors;
    return professors.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q),
    );
  }, [professors, instructorSearch]);


  // Determina si el profesor a cargo es INDEPENDIENTE (paga canon/convenio).
  const isIndependentTeacher = useMemo(() => {
    const id = form.teacherId ?? form.instructorIds?.[0] ?? editing?.teacherId;
    if (id != null) {
      const p = professors.find((x) => x.id === id);
      if (p?.tipoProfesor === 'INDEPENDIENTE') return true;
    }
    if (currentUser?.role === 'TEACHER') {
      return currentUser.tipoProfesor === 'INDEPENDIENTE';
    }
    return false;
  }, [form.teacherId, form.instructorIds, editing, professors, currentUser]);

  // Precompleta el canon de instalaciones y descuentos con los del espacio al crear.
  useEffect(() => {
    if (!editing && selectedSpace) {
      setForm((f) => ({
        ...f,
        facilityCanon: f.facilityCanon === 0 ? selectedSpace.canonBase : f.facilityCanon,
        aplicaDescuentoSocios: selectedSpace.aplicaDescuentoSocios,
        tipoDescuentoCanon: selectedSpace.tipoDescuentoCanon,
        valorDescuentoPorSocio: selectedSpace.valorDescuentoPorSocio,
        descuentoMaximoCanon: selectedSpace.descuentoMaximoCanon,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpace, editing]);
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
    setFieldErrors({});
    setServerError(null);
    setScheduleMode('detailed');
    setMassiveBlocks([{ id: '1', days: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '20:00' }]);
    setModalOpen(true);
  };

  const openEdit = (a: Activity) => {
    setEditing(a);
    setFieldErrors({});
    setServerError(null);
    const initialSchedules =
      a.schedules.length > 0
        ? a.schedules.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime }))
        : [{ dayOfWeek: 1, startTime: '08:00', endTime: '20:00' }];
    setForm({
      name: a.name,
      description: a.description,
      category: a.category,
      priceMember: a.priceMember,
      priceNonMember: a.priceNonMember,
      facilityCanon: a.facilityCanon,
      aplicaDescuentoSocios: a.aplicaDescuentoSocios,
      tipoDescuentoCanon: a.tipoDescuentoCanon,
      valorDescuentoPorSocio: a.valorDescuentoPorSocio,
      descuentoMaximoCanon: a.descuentoMaximoCanon,
      paymentCollector: a.paymentCollector,
      maxCapacity: a.maxCapacity,
      teacherId: a.teacherId ?? null,
      instructorIds: (a.instructors ?? []).map((i) => i.id),
      spaceId: a.spaceId ?? null,
      requiresBooking: a.requiresBooking,
      isActive: a.isActive,
      schedule: a.schedule,
      schedules: initialSchedules,
    });
    setScheduleMode('detailed');
    setMassiveBlocks(schedulesToBlocks(initialSchedules));
    setModalOpen(true);
  };

  const instructorLabel = (id: number): string => {
    const p = professors.find((x) => x.id === id);
    if (p) return p.fullName;
    const e = editing?.instructors?.find((x) => x.id === id);
    if (e) return e.fullName;
    if (currentUser && Number(currentUser.id) === id) {
      return `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim() || currentUser.email || `#${id}`;
    }
    return `#${id}`;
  };

  const handleAssignMe = () => {
    const myId = currentUser?.id ? Number(currentUser.id) : null;
    if (!myId || Number.isNaN(myId)) {
      toast.error('No se pudo identificar tu usuario para asignarte.');
      return;
    }
    setForm((f) => ({
      ...f,
      instructorIds: (f.instructorIds ?? []).includes(myId)
        ? f.instructorIds
        : [...(f.instructorIds ?? []), myId],
    }));
  };

  const removeInstructor = (id: number) => {
    setForm((f) => ({ ...f, instructorIds: (f.instructorIds ?? []).filter((x) => x !== id) }));
  };

  const addInstructor = (id: number) => {
    setForm((f) => ({
      ...f,
      instructorIds: (f.instructorIds ?? []).includes(id)
        ? f.instructorIds
        : [...(f.instructorIds ?? []), id],
    }));
  };

  const handleEditClick = (a: Activity) => {
    if (!canManageActivity(a)) {
      toast.error('No tenés permisos para gestionar esta actividad');
      return;
    }
    openEdit(a);
  };

  const handleDeleteClick = (a: Activity) => {
    if (!canManageActivity(a)) {
      toast.error('No tenés permisos para gestionar esta actividad');
      return;
    }
    setDeleteTarget(a);
  };

  const handleMassiveBlocksChange = (newBlocks: WeeklyScheduleBlock[]) => {
    setMassiveBlocks(newBlocks);
    setForm((f) => ({ ...f, schedules: blocksToSchedules(newBlocks) }));
    if (fieldErrors.schedules) setFieldErrors({ ...fieldErrors, schedules: undefined });
  };

  const handleTabSwitch = (mode: 'detailed' | 'massive') => {
    if (mode === 'massive') {
      const blocks = schedulesToBlocks(form.schedules);
      setMassiveBlocks(blocks);
      setForm((f) => ({ ...f, schedules: blocksToSchedules(blocks) }));
    }
    setScheduleMode(mode);
  };

  const addScheduleRow = () => {
    setForm((f) => ({
      ...f,
      schedules: [...f.schedules, { dayOfWeek: 1, startTime: '08:00', endTime: '20:00' }],
    }));
    if (fieldErrors.schedules) setFieldErrors({ ...fieldErrors, schedules: undefined });
  };

  const removeScheduleRow = (index: number) => {
    setForm((f) => ({ ...f, schedules: f.schedules.filter((_, i) => i !== index) }));
    if (fieldErrors.schedules) setFieldErrors({ ...fieldErrors, schedules: undefined });
  };

  const updateScheduleRow = (index: number, patch: Partial<ActivityScheduleInput>) => {
    setForm((f) => ({
      ...f,
      schedules: f.schedules.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
    if (fieldErrors.schedules) setFieldErrors({ ...fieldErrors, schedules: undefined });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await activityService.deleteActivity(deleteTarget.id);
      toast.success('Actividad eliminada correctamente.');
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'No se pudo eliminar la actividad.');
    } finally {
      setDeleting(false);
    }
  };

  const openSettlement = async (activity: Activity) => {
    setSettlementTarget(activity);
    setSettlement(null);
    setSettlementError(null);
    setSettlementLoading(true);
    try {
      const data = await activityService.getSettlement(activity.id);
      setSettlement(data);
    } catch (err: any) {
      setSettlementError(err?.response?.data?.message ?? 'No se pudo cargar la liquidación.');
    } finally {
      setSettlementLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (hasBlocked) {
      toast.error('Hay horarios bloqueados. Revisá los conflictos en rojo.');
      return;
    }

    const errors = validateForm(form);
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      setFieldErrors(errors);
      // Enfocar el primer campo con error para que el usuario lo corrija de inmediato.
      const firstKey = Object.keys(errors)[0];
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
        el?.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);
      if (editing) {
        await activityService.updateActivity(editing.id, form);
        toast.success('Actividad actualizada correctamente.');
      } else {
        await activityService.createActivity(form);
        toast.success('Actividad creada correctamente.');
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.response?.data?.detail ?? null;
      setServerError(message ?? 'No se pudo guardar la actividad.');
      toast.error(message ?? 'No se pudo guardar la actividad.');
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptNegotiation = async (a: Activity) => {
    try {
      await activityService.acceptNegotiation(a.id);
      toast.success('Acuerdo aprobado correctamente.');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'No se pudo aprobar el acuerdo.');
    }
  };

  const openProposeModal = (a: Activity) => {
    setProposeTarget(a);
    setProposePrice(a.proposedPriceMember ?? a.priceMember);
    setProposeCanon(a.proposedFacilityCanon ?? a.facilityCanon);
  };

  const confirmPropose = async () => {
    if (!proposeTarget) return;
    setProposeSaving(true);
    try {
      await activityService.proposeNegotiation(proposeTarget.id, {
        priceMember: proposePrice,
        facilityCanon: proposeCanon,
      });
      toast.success('Contraoferta enviada.');
      setProposeTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'No se pudo proponer el nuevo valor.');
    } finally {
      setProposeSaving(false);
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header />
        <main className="flex-1 w-full min-w-0 overflow-y-auto pt-16 px-4 pb-32 md:pt-6 md:px-6 md:pb-6">
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Administración
                </span>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5 mt-1">
                  <Dumbbell className="w-6 h-6 text-emerald-400" /> Administración de Clases y Actividades
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Creá y editá actividades, asigná espacios y validá la disponibilidad de horarios.
                </p>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all self-start md:self-auto shadow-lg shadow-emerald-500/20"
              >
                <Plus size={14} /> Nueva Actividad
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
              <button
                onClick={() => setScopeFilter('mine')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  scopeFilter === 'mine'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mis Actividades
              </button>
              <button
                onClick={() => setScopeFilter('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  scopeFilter === 'all'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas las Actividades
              </button>
            </div>

            {loading ? (
              <p className="text-slate-300">Cargando...</p>
            ) : visibleActivities.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                {scopeFilter === 'mine' && !isStaff
                  ? 'No tenés actividades a cargo todavía.'
                  : 'No hay actividades cargadas todavía.'}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleActivities.map((a) => (
                  <div key={a.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-white truncate">{a.name}</h3>
                          {!a.isActive && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-300 mt-1">
                          <Dumbbell size={14} className="inline mr-1 text-emerald-400" />
                          {a.category}
                          {a.spaceName && (
                            <>
                              <MapPin size={14} className="inline ml-2 mr-1 text-sky-400" />
                              {a.spaceName}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {canManageActivity(a) ? (
                          <>
                            <button
                              onClick={() => handleEditClick(a)}
                              className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
                              title="Editar"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(a)}
                              className="p-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 border border-red-900/20 transition"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-semibold px-2 py-1 bg-slate-900/40 border border-slate-800 rounded-lg self-center">
                            Sin permisos
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {a.schedules.length > 0 ? (
                        a.schedules.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1"
                          >
                            <Clock size={14} className="text-emerald-400" />
                            {s.dayName} {s.startTime}-{s.endTime}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1">
                          <Clock size={14} className="inline text-emerald-400" /> {a.schedule || 'Sin horario'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-300 mt-auto">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Users size={14} className="text-violet-400 shrink-0" />
                        <span className="truncate">
                          Cupo: {a.maxCapacity}
                          {(a.instructors ?? []).length > 0 && (
                            <span className="text-slate-400">
                              {' · '}
                              <GraduationCap size={14} className="inline mr-0.5 text-sky-400" />
                              {(a.instructors ?? []).map((i) => i.fullName).join(', ')}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="font-semibold text-emerald-400 shrink-0">{Math.max(a.availableSpots, 0)} disponibles</span>
                    </div>

                    {a.paymentCollector === 'PROFESSOR_DIRECT' && (
                      <button
                        onClick={() => openSettlement(a)}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold hover:bg-violet-500/20 transition"
                      >
                        <Receipt size={14} /> Ver Liquidación
                      </button>
                    )}

                    {a.estadoNegociacion === 'PENDIENTE' && (
                      <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                          <AlertTriangle size={14} /> Negociación pendiente
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Propuesta: Socio {fmtCurrency(a.proposedPriceMember ?? a.priceMember)} · Canon{' '}
                          {fmtCurrency(a.proposedFacilityCanon ?? a.facilityCanon)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleAcceptNegotiation(a)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-bold hover:bg-emerald-400 transition"
                          >
                            <CheckCircle2 size={13} /> Aceptar Acuerdo
                          </button>
                          <button
                            onClick={() => openProposeModal(a)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold hover:bg-slate-700 transition"
                          >
                            <Banknote size={13} /> Proponer Nuevo Valor
                          </button>
                        </div>
                      </div>
                    )}

                    {a.estadoNegociacion === 'APROBADO' && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                        <CheckCircle2 size={13} /> Acuerdo aprobado
                      </div>
                    )}
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    data-field="name"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                    }}
                    className={`w-full bg-[#0f172a] border text-slate-100 rounded-lg p-2.5 text-sm outline-none ${
                      fieldErrors.name
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div data-field="category">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Deporte / Categoría</label>
                    <Combobox
                      value={form.category}
                      options={sportOptions}
                      placeholder="Seleccionar deporte…"
                      noResultsText="No hay deportes que coincidan"
                      error={!!fieldErrors.category}
                      onChange={(v) => {
                        setForm({ ...form, category: v ?? SPORT_CATEGORIES[0] });
                        if (fieldErrors.category) setFieldErrors({ ...fieldErrors, category: undefined });
                      }}
                    />
                    {fieldErrors.category && (
                      <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.category}
                      </p>
                    )}
                  </div>

                  <div data-field="spaceId">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Espacio físico</label>
                    <Combobox
                      value={form.spaceId != null ? String(form.spaceId) : null}
                      options={spaceOptions}
                      placeholder="— Sin espacio —"
                      noResultsText="No hay espacios que coincidan"
                      error={!!fieldErrors.spaceId}
                      onChange={(v) => {
                        setForm({ ...form, spaceId: v ? Number(v) : null });
                        if (fieldErrors.spaceId) setFieldErrors({ ...fieldErrors, spaceId: undefined });
                      }}
                    />
                    {fieldErrors.spaceId && (
                      <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.spaceId}
                      </p>
                    )}
                    {selectedSpace && !fieldErrors.spaceId && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Superposición: {selectedSpace.permitir_superposicion ? 'permitida (mismo deporte)' : 'bloqueada'}.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Cupo máximo</label>
                    <input
                      type="number"
                      min={0}
                      data-field="maxCapacity"
                      value={form.maxCapacity === 0 ? '' : form.maxCapacity}
                      onChange={(e) => {
                        setForm({ ...form, maxCapacity: parseNumericInput(e.target.value) });
                        if (fieldErrors.maxCapacity) setFieldErrors({ ...fieldErrors, maxCapacity: undefined });
                      }}
                      className={`w-full bg-[#0f172a] border text-slate-100 rounded-lg p-2.5 text-sm outline-none ${
                        fieldErrors.maxCapacity
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    {fieldErrors.maxCapacity && (
                      <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.maxCapacity}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Cobro</label>
                  <select
                    value={form.paymentCollector}
                    onChange={(e) =>
                      setForm({ ...form, paymentCollector: e.target.value as SaveActivityRequest['paymentCollector'] })
                    }
                    className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="CLUB">Cobrado por el Club</option>
                    <option value="PROFESSOR_DIRECT">Cobrado por el Profesor</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Precio Socio ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.priceMember === 0 ? '' : form.priceMember}
                      onChange={(e) => setForm({ ...form, priceMember: parseNumericInput(e.target.value) })}
                      className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Precio No Socio ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.priceNonMember === 0 ? '' : form.priceNonMember}
                      onChange={(e) => setForm({ ...form, priceNonMember: parseNumericInput(e.target.value) })}
                      className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {isIndependentTeacher && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-violet-300">Canon de Instalaciones y Descuentos</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Canon que el profesor independiente abona al club por el uso del espacio.
                        {selectedSpace?.canonBase ? ` Base del espacio: ${fmtCurrency(selectedSpace.canonBase)}.` : ''}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Canon de Instalaciones ($)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.facilityCanon === 0 ? '' : form.facilityCanon}
                        onChange={(e) => setForm({ ...form, facilityCanon: parseNumericInput(e.target.value) })}
                        className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="pt-2 border-t border-violet-500/20 space-y-3">
                      <Toggle
                        label="Descuento por Volumen de Socios"
                        checked={form.aplicaDescuentoSocios}
                        onChange={(val) => setForm({ ...form, aplicaDescuentoSocios: val })}
                      />

                      {form.aplicaDescuentoSocios && (
                        <div className="space-y-3 pl-2 border-l-2 border-emerald-500/30">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Descuento</label>
                            <select
                              value={form.tipoDescuentoCanon}
                              onChange={(e) => setForm({ ...form, tipoDescuentoCanon: e.target.value as 'MONTO_FIJO' | 'PORCENTAJE' })}
                              className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                            >
                              <option value="MONTO_FIJO">Monto Fijo ($ por socio)</option>
                              <option value="PORCENTAJE">Porcentaje (% del canon por socio)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                              {form.tipoDescuentoCanon === 'PORCENTAJE' ? 'Porcentaje de Descuento por Socio (%)' : 'Monto de Descuento por Socio ($)'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.valorDescuentoPorSocio === 0 ? '' : form.valorDescuentoPorSocio}
                              onChange={(e) => setForm({ ...form, valorDescuentoPorSocio: parseNumericInput(e.target.value) })}
                              className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Descuento Máximo Total ($ o vacío)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.descuentoMaximoCanon == null ? '' : form.descuentoMaximoCanon}
                              onChange={(e) => setForm({ ...form, descuentoMaximoCanon: e.target.value === '' ? null : parseNumericInput(e.target.value) })}
                              className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">Profesores a cargo</label>
                    <button
                      type="button"
                      onClick={handleAssignMe}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-sm font-medium hover:bg-sky-500/20 transition"
                    >
                      <UserPlus size={14} /> Asignarme a mí
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {(form.instructorIds ?? []).length === 0 ? (
                      <span className="text-sm text-slate-500">Sin profesores asignados.</span>
                    ) : (
                      (form.instructorIds ?? []).map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-200 text-sm font-medium"
                        >
                          <GraduationCap size={15} />
                          {instructorLabel(id)}
                          <button
                            type="button"
                            onClick={() => removeInstructor(id)}
                            className="text-sky-400 hover:text-white ml-0.5"
                            title="Quitar"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {isStaff && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setInstructorsOpen((v) => !v);
                          setInstructorSearch('');
                        }}
                        className="w-full flex items-center justify-between gap-2 bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                      >
                        <span className="text-slate-400">Buscar y asignar profesores…</span>
                        <ChevronDown size={16} className={`transition-transform ${instructorsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {instructorsOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
                          <div className="p-2 border-b border-slate-700">
                            <div className="relative flex items-center">
                              <Search size={14} className="absolute left-2.5 text-slate-500 pointer-events-none" />
                              <input
                                autoFocus
                                type="text"
                                value={instructorSearch}
                                onChange={(e) => setInstructorSearch(e.target.value)}
                                placeholder="Buscar profesor…"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto scrollbar-thin">
                            {filteredProfessors.length === 0 ? (
                              <p className="px-3 py-3 text-center text-xs text-slate-500">No hay profesores que coincidan.</p>
                            ) : (
                              filteredProfessors.map((p) => {
                                const assigned = (form.instructorIds ?? []).includes(p.id);
                                return (
                                  <button
                                    type="button"
                                    key={p.id}
                                    onClick={() => (assigned ? removeInstructor(p.id) : addInstructor(p.id))}
                                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-slate-700/60"
                                  >
                                    <span className="flex-1 min-w-0">
                                      <span className="block truncate text-slate-200">{p.fullName}</span>
                                      <span className="block text-[10px] text-slate-500 truncate">{p.email}</span>
                                    </span>
                                    {assigned ? (
                                      <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                                    ) : (
                                      <Plus size={16} className="shrink-0 text-slate-500" />
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
                    <label className="block text-base font-bold text-white">Días y horarios</label>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleTabSwitch('detailed')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          scheduleMode === 'detailed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Día por día
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabSwitch('massive')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          scheduleMode === 'massive'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Horario semanal / Masivo
                      </button>
                    </div>
                  </div>

                  {fieldErrors.schedules && (
                    <p className="mb-2 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {fieldErrors.schedules}
                    </p>
                  )}

                  {scheduleMode === 'massive' ? (
                    <WeeklyScheduleSelector
                      blocks={massiveBlocks}
                      onBlocksChange={handleMassiveBlocksChange}
                      scheduleRows={scheduleRows}
                    />
                  ) : (
                    <div>
                      <div className="flex items-center justify-end mb-2">
                        <button
                          type="button"
                          onClick={addScheduleRow}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-sm font-semibold border border-slate-700 transition"
                        >
                          <Plus size={15} /> Agregar horario
                        </button>
                      </div>

                      <div className="space-y-2">
                        {scheduleRows.map((row, index) => {
                          const badge = rowBadge(row.status);
                          return (
                            <div key={index} className={`rounded-xl border p-3 ${rowStyle(row.status)}`}>
                              <div className="flex flex-wrap items-end gap-2">
                                <div className="flex-1 min-w-30">
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Día</label>
                                  <select
                                    value={row.dayOfWeek}
                                    onChange={(e) => updateScheduleRow(index, { dayOfWeek: Number(e.target.value) })}
                                    className="w-full h-10 bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg px-3 text-sm font-medium focus:border-emerald-500 outline-none"
                                  >
                                    {DAYS.map((d, i) => (
                                      <option key={d} value={i}>{d}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Inicio</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={row.startTime}
                                      onChange={(e) => updateScheduleRow(index, { startTime: maskTimeInput(e.target.value) })}
                                      placeholder="08:00"
                                      maxLength={5}
                                      inputMode="numeric"
                                      autoComplete="off"
                                      className="w-28 h-10 pl-3 pr-8 bg-slate-900/80 border border-slate-700 text-slate-100 rounded-lg text-sm font-medium text-center focus:border-emerald-500 focus:outline-none"
                                    />
                                    <Clock className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Fin</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={row.endTime}
                                      onChange={(e) => updateScheduleRow(index, { endTime: maskTimeInput(e.target.value) })}
                                      placeholder="20:00"
                                      maxLength={5}
                                      inputMode="numeric"
                                      autoComplete="off"
                                      className="w-28 h-10 pl-3 pr-8 bg-slate-900/80 border border-slate-700 text-slate-100 rounded-lg text-sm font-medium text-center focus:border-emerald-500 focus:outline-none"
                                    />
                                    <Clock className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>
                                </div>

                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${badge.cls}`}>
                                  {row.status === 'blocked' ? <AlertCircle size={14} /> : row.status === 'shared' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
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
                    </div>
                  )}
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

                {serverError && (
                  <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60"
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
        {settlementTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                    <Receipt size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Liquidación de Canon</h3>
                    <p className="text-sm text-slate-400">{settlementTarget.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettlementTarget(null)}
                  className="text-slate-400 hover:text-white p-1"
                  title="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              {settlementLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
                  <RefreshCw size={18} className="animate-spin text-violet-400" /> Cargando liquidación...
                </div>
              ) : settlementError ? (
                <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl p-4">
                  {settlementError}
                </div>
              ) : settlement ? (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-white">{settlement.memberEnrollments}</p>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Alumnos Socios
                      </p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-white">{settlement.nonMemberEnrollments}</p>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        Alumnos No Socios
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Alumnos × Canon de Instalaciones</span>
                      <span className="font-semibold text-white">
                        {settlement.totalEnrollments} × {fmtCurrency(settlement.facilityCanon)}
                      </span>
                    </div>
                    {settlement.discountApplied > 0 && (
                      <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
                        <span>Descuento por Socios Aplicado</span>
                        <span>- {fmtCurrency(settlement.discountApplied)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Banknote size={15} className="text-emerald-400" /> Total a Pagar al Club
                      </span>
                      <span className="text-xl font-black text-emerald-400">
                        {fmtCurrency(settlement.totalSettlement)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSettlementTarget(null)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {proposeTarget && (
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
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Proponer Nuevo Valor</h3>
                <button onClick={() => setProposeTarget(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Ingresá tu contraoferta para <strong className="text-slate-200">{proposeTarget.name}</strong>.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Precio Socio ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={proposePrice === 0 ? '' : proposePrice}
                    onChange={(e) => setProposePrice(parseNumericInput(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Canon de Instalaciones ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={proposeCanon === 0 ? '' : proposeCanon}
                    onChange={(e) => setProposeCanon(parseNumericInput(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-700 text-slate-100 rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setProposeTarget(null)}
                  disabled={proposeSaving}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPropose}
                  disabled={proposeSaving}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-bold"
                >
                  {proposeSaving ? <RefreshCw size={14} className="animate-spin" /> : <Banknote size={14} />}
                  Enviar Propuesta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
