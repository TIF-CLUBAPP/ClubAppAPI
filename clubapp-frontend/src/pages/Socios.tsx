import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Inbox,
  Loader2,
  Lock,
  LockOpen,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { ROLE_OPTIONS, getRoleConfig, type UserListItem } from '../types/user';
import type { UserRole } from '../types/auth';

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
};

/** Extrae el mensaje de error devuelto por el backend (axios). */
const extractApiMessage = (err: unknown): string | null =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? null;

function SummaryCard({
  label,
  value,
  sub,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl border ${iconClass}`}>{icon}</div>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</p>}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const config = getRoleConfig(role);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap ${config.badgeClasses}`}
    >
      {config.label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Bloqueado
    </span>
  );
}

/** Botones de acción rápida con tooltip. */
function ActionButtons({
  item,
  isSelf,
  canManage,
  onRole,
  onStatus,
  onDelete,
}: {
  item: UserListItem;
  isSelf: boolean;
  canManage: boolean;
  onRole: (u: UserListItem) => void;
  onStatus: (u: UserListItem) => void;
  onDelete: (u: UserListItem) => void;
}) {
  const disabled = isSelf || !canManage;
  const disabledTooltip = isSelf
    ? 'No podés modificar tu propia cuenta'
    : 'Solo un Super Admin puede gestionar este usuario';

  const baseClass =
    'p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onRole(item)}
        disabled={disabled}
        title={disabled ? disabledTooltip : 'Cambiar rol'}
        className={`${baseClass} hover:bg-sky-500/15 hover:text-sky-300`}
      >
        <UserCog size={16} />
      </button>
      <button
        onClick={() => onStatus(item)}
        disabled={disabled}
        title={disabled ? disabledTooltip : item.isActive ? 'Bloquear usuario' : 'Desbloquear usuario'}
        className={`${baseClass} hover:bg-amber-500/15 hover:text-amber-300`}
      >
        {item.isActive ? <Lock size={16} /> : <LockOpen size={16} />}
      </button>
      <button
        onClick={() => onDelete(item)}
        disabled={disabled}
        title={disabled ? disabledTooltip : 'Eliminar usuario'}
        className={`${baseClass} hover:bg-rose-500/15 hover:text-rose-300`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

/** Tarjeta móvil de usuario (pantallas menores a md). */
function UserCard({
  item,
  isSelf,
  canManage,
  onRole,
  onStatus,
  onDelete,
}: {
  item: UserListItem;
  isSelf: boolean;
  canManage: boolean;
  onRole: (u: UserListItem) => void;
  onStatus: (u: UserListItem) => void;
  onDelete: (u: UserListItem) => void;
}) {
  return (
    <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900/80">
      {/* Encabezado: avatar, nombre y email */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-linear-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
          {getInitials(item.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white truncate">{item.fullName}</p>
          <p className="text-xs text-slate-400 truncate">{item.email}</p>
        </div>
        <StatusBadge active={item.isActive} />
      </div>

      {/* DNI y teléfono */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <FileText size={11} className="shrink-0" />
        <span className="truncate">{item.dni || '—'}</span>
        <span className="text-slate-600 shrink-0">·</span>
        <Phone size={11} className="shrink-0" />
        <span className="truncate">{item.phone || '—'}</span>
      </div>

      {/* Rol + acciones */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <RoleBadge role={item.role} />
        <ActionButtons
          item={item}
          isSelf={isSelf}
          canManage={canManage}
          onRole={onRole}
          onStatus={onStatus}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}


/** Contenedor base de modal con backdrop y animación. */
function ModalShell({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Modal para cambiar el rol de un usuario. */
function RoleModal({
  user,
  value,
  onChange,
  processing,
  error,
  onConfirm,
  onClose,
}: {
  user: UserListItem;
  value: UserRole;
  onChange: (role: UserRole) => void;
  processing: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300">
          <UserCog size={20} />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <h3 className="mt-4 text-lg font-black text-white">Cambiar Rol de Usuario</h3>
      <p className="mt-1 text-xs text-slate-400">
        Estás por cambiar el rol de{' '}
        <strong className="text-slate-200">{user.fullName}</strong>. El nuevo rol se aplica de
        inmediato.
      </p>

      <label className="mt-5 block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
        Nuevo rol
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as UserRole)}
        className="mt-1.5 w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold focus:border-sky-500 focus:outline-none transition-all"
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r.value} value={r.value} className="bg-slate-900">
            {r.label}
          </option>
        ))}
      </select>

      {error && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={onClose}
          disabled={processing}
          className="py-3 rounded-2xl border border-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={processing}
          className="py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {processing ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
          Confirmar
        </button>
      </div>
    </ModalShell>
  );
}


/** Modal de advertencia (ámbar) o peligro (rojo) con confirmación explícita. */
function ConfirmModal({
  variant,
  title,
  description,
  confirmLabel,
  processing,
  error,
  onConfirm,
  onClose,
}: {
  variant: 'warning' | 'danger';
  title: string;
  description: string;
  confirmLabel: string;
  processing: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isDanger = variant === 'danger';
  const iconBox = isDanger
    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
    : 'bg-amber-500/10 border-amber-500/20 text-amber-400';
  const confirmClass = isDanger
    ? 'bg-rose-500 hover:bg-rose-400 text-slate-950'
    : 'bg-amber-500 hover:bg-amber-400 text-slate-950';

  return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className={`p-3.5 rounded-2xl border ${iconBox}`}>
          {isDanger ? <AlertTriangle size={26} /> : <ShieldAlert size={26} />}
        </div>

        <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
        <p className="mt-1.5 text-xs text-slate-400 max-w-xs">{description}</p>

        {error && (
          <div className="mt-4 w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-left">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        <div className="mt-6 w-full grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="py-3 rounded-2xl border border-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className={`py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${confirmClass}`}
          >
            {processing ? <Loader2 size={15} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default function Socios() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

  // Modal de cambio de rol
  const [roleTarget, setRoleTarget] = useState<UserListItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('MEMBER');
  const [roleProcessing, setRoleProcessing] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Modal de bloqueo / desbloqueo
  const [statusTarget, setStatusTarget] = useState<UserListItem | null>(null);
  const [statusProcessing, setStatusProcessing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Modal de eliminación
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await userService.getUsers();
      setUsers(list);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError('No se pudieron cargar los socios y alumnos en este momento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [loadData]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  };

  // Filtrado en tiempo real (cliente)
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesTerm =
        !term ||
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.dni.toLowerCase().includes(term) ||
        u.phone.toLowerCase().includes(term);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.isActive) ||
        (statusFilter === 'BLOCKED' && !u.isActive);
      return matchesTerm && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      blocked: users.filter((u) => !u.isActive).length,
    }),
    [users]
  );

  const isSelf = (u: UserListItem) => String(currentUser?.id) === String(u.id);
  const canManage = (u: UserListItem) => isSuperAdmin || u.role !== 'SUPERADMIN';
  const hasFilters = search.trim() !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };


  // Apertura de modales
  const openRoleModal = (u: UserListItem) => {
    setRoleTarget(u);
    setSelectedRole(u.role);
    setRoleError(null);
  };
  const openStatusModal = (u: UserListItem) => {
    setStatusTarget(u);
    setStatusError(null);
  };
  const openDeleteModal = (u: UserListItem) => {
    setDeleteTarget(u);
    setDeleteError(null);
  };

  const closeRoleModal = () => {
    if (!roleProcessing) setRoleTarget(null);
  };
  const closeStatusModal = () => {
    if (!statusProcessing) setStatusTarget(null);
  };
  const closeDeleteModal = () => {
    if (!deleteProcessing) setDeleteTarget(null);
  };

  // Confirmación: cambiar rol
  const confirmRole = async () => {
    if (!roleTarget) return;
    const target = roleTarget;
    if (selectedRole === target.role) {
      setRoleError('El usuario ya tiene ese rol.');
      return;
    }
    setRoleProcessing(true);
    setRoleError(null);
    try {
      const config = getRoleConfig(selectedRole);
      await userService.updateRole(target.id, config.numeric);
      setRoleTarget(null);
      showToast('success', `Rol de ${target.fullName} actualizado a ${config.label}.`);
      loadData();
    } catch (err) {
      const apiMessage = extractApiMessage(err);
      setRoleError(apiMessage ?? 'No se pudo actualizar el rol. Intentá nuevamente.');
      showToast('error', 'No se pudo actualizar el rol del usuario.');
    } finally {
      setRoleProcessing(false);
    }
  };

  // Confirmación: bloquear / desbloquear
  const confirmStatus = async () => {
    if (!statusTarget) return;
    const target = statusTarget;
    const blocking = target.isActive;
    setStatusProcessing(true);
    setStatusError(null);
    try {
      await userService.updateStatus(target.id, !target.isActive);
      setStatusTarget(null);
      showToast(
        'success',
        blocking
          ? `${target.fullName} fue bloqueado. Ya no podrá ingresar a la app.`
          : `${target.fullName} fue desbloqueado.`
      );
      loadData();
    } catch (err) {
      const apiMessage = extractApiMessage(err);
      setStatusError(apiMessage ?? 'No se pudo cambiar el estado. Intentá nuevamente.');
      showToast('error', 'No se pudo cambiar el estado del usuario.');
    } finally {
      setStatusProcessing(false);
    }
  };

  // Confirmación: eliminar
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteProcessing(true);
    setDeleteError(null);
    try {
      await userService.deleteUser(target.id);
      setDeleteTarget(null);
      showToast('success', `El usuario ${target.fullName} fue eliminado.`);
      loadData();
    } catch (err) {
      const apiMessage = extractApiMessage(err);
      setDeleteError(apiMessage ?? 'No se pudo eliminar el usuario. Intentá nuevamente.');
      showToast('error', 'No se pudo eliminar el usuario.');
    } finally {
      setDeleteProcessing(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          {!isStaff ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center max-w-lg mx-auto mt-10">
              <AlertTriangle className="mx-auto text-amber-400" size={40} />
              <h2 className="mt-4 text-xl font-black text-white">Acceso restringido</h2>
              <p className="mt-2 text-sm text-slate-400">
                Solo los administradores pueden gestionar socios y alumnos.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-6 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
              >
                Volver al Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Encabezado de la página */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} /> Administración · Miembros
                  </span>
                  <h1 className="text-2xl font-black text-white mt-1">Socios &amp; Alumnos</h1>
                  <p className="text-xs text-slate-400">
                    Buscá, filtrá y gestioná los usuarios registrados en el club.
                  </p>
                </div>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
                  Actualizar
                </button>
              </div>


              {/* Resumen: total, activos y bloqueados */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard
                  label="Total de usuarios"
                  value={loading && !users.length ? '—' : String(counts.total)}
                  sub="Cuentas registradas"
                  icon={<Users size={18} />}
                  iconClass="bg-violet-500/10 text-violet-400 border-violet-500/20"
                />
                <SummaryCard
                  label="Activos"
                  value={loading && !users.length ? '—' : String(counts.active)}
                  sub="Pueden ingresar a la app"
                  icon={<CheckCircle2 size={18} />}
                  iconClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                />
                <SummaryCard
                  label="Bloqueados"
                  value={loading && !users.length ? '—' : String(counts.blocked)}
                  sub="Acceso suspendido"
                  icon={<ShieldAlert size={18} />}
                  iconClass="bg-rose-500/10 text-rose-400 border-rose-500/20"
                />
              </div>

              {/* Barra de búsqueda y filtros */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
                <div className="relative w-full lg:flex-1 lg:max-w-md">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, DNI, email o teléfono..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
                    className="w-full sm:w-44 px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-300 font-semibold focus:border-emerald-500 focus:outline-none transition-all"
                  >
                    <option value="ALL" className="bg-slate-900">Todos los roles</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value} className="bg-slate-900">
                        {r.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'BLOCKED')}
                    className="w-full sm:w-44 px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-300 font-semibold focus:border-emerald-500 focus:outline-none transition-all"
                  >
                    <option value="ALL" className="bg-slate-900">Todos los estados</option>
                    <option value="ACTIVE" className="bg-slate-900">Activos</option>
                    <option value="BLOCKED" className="bg-slate-900">Bloqueados</option>
                  </select>

                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3.5 py-2.5 rounded-2xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-bold transition-all"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>


              {loading ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center">
                  <Loader2 className="mx-auto animate-spin text-emerald-400" size={32} />
                  <p className="mt-3 text-xs text-slate-400 font-medium">
                    Cargando socios y alumnos...
                  </p>
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-10 text-center">
                  <AlertCircle className="mx-auto text-rose-400" size={36} />
                  <h3 className="mt-3 text-base font-bold text-white">Error de conexión</h3>
                  <p className="mt-1 text-xs text-slate-400">{error}</p>
                  <button
                    onClick={loadData}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all"
                  >
                    <RefreshCw size={13} /> Reintentar
                  </button>
                </div>
              ) : !filtered.length ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center">
                  <Inbox className="mx-auto text-slate-600" size={38} />
                  <h3 className="mt-3 text-base font-bold text-white">
                    {hasFilters ? 'Sin resultados' : 'No hay usuarios'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {hasFilters
                      ? 'Probá con otros términos de búsqueda o filtros.'
                      : 'Todavía no hay socios ni alumnos registrados.'}
                  </p>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Tarjetas de usuario — pantallas pequeñas (menos de md) */}
                  <div className="md:hidden space-y-3">
                    {filtered.map((u) => (
                      <UserCard
                        key={u.id}
                        item={u}
                        isSelf={isSelf(u)}
                        canManage={canManage(u)}
                        onRole={openRoleModal}
                        onStatus={openStatusModal}
                        onDelete={openDeleteModal}
                      />
                    ))}
                  </div>


                  {/* Tabla de usuarios — pantallas md en adelante */}
                  <div className="hidden md:block rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-left text-sm min-w-245">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3 sm:px-5 sm:py-3.5 font-bold whitespace-nowrap min-w-55">Usuario</th>
                            <th className="px-4 py-3 sm:px-5 sm:py-3.5 font-bold whitespace-nowrap min-w-37.5">DNI / Teléfono</th>
                            <th className="px-4 py-3 sm:px-5 sm:py-3.5 font-bold whitespace-nowrap min-w-30">Rol</th>
                            <th className="px-4 py-3 sm:px-5 sm:py-3.5 font-bold whitespace-nowrap min-w-27.5">Estado</th>
                            <th className="px-4 py-3 sm:px-5 sm:py-3.5 font-bold whitespace-nowrap text-right min-w-40">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filtered.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                              <td className="px-4 py-3 sm:px-5 sm:py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-linear-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                                    {getInitials(u.fullName)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-white truncate">{u.fullName}</p>
                                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 sm:px-5 sm:py-4">
                                <div className="flex flex-col gap-1 text-xs">
                                  <span className="text-slate-300 font-semibold inline-flex items-center gap-1.5">
                                    <FileText size={12} className="text-slate-500 shrink-0" />
                                    {u.dni || '—'}
                                  </span>
                                  <span className="text-slate-400 inline-flex items-center gap-1.5">
                                    <Phone size={12} className="text-slate-500 shrink-0" />
                                    {u.phone || '—'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 sm:px-5 sm:py-4">
                                <RoleBadge role={u.role} />
                              </td>
                              <td className="px-4 py-3 sm:px-5 sm:py-4">
                                <StatusBadge active={u.isActive} />
                              </td>
                              <td className="px-4 py-3 sm:px-5 sm:py-4">
                                <div className="flex justify-end">
                                  <ActionButtons
                                    item={u}
                                    isSelf={isSelf(u)}
                                    canManage={canManage(u)}
                                    onRole={openRoleModal}
                                    onStatus={openStatusModal}
                                    onDelete={openDeleteModal}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}


            </div>
          )}

          {/* Modal: cambiar rol */}
          <AnimatePresence>
            {roleTarget && (
              <RoleModal
                user={roleTarget}
                value={selectedRole}
                onChange={setSelectedRole}
                processing={roleProcessing}
                error={roleError}
                onConfirm={confirmRole}
                onClose={closeRoleModal}
              />
            )}
          </AnimatePresence>

          {/* Modal: bloquear / desbloquear */}
          <AnimatePresence>
            {statusTarget && (
              <ConfirmModal
                variant="warning"
                title={
                  statusTarget.isActive
                    ? `¿Estás seguro de bloquear a ${statusTarget.fullName}?`
                    : `¿Estás seguro de desbloquear a ${statusTarget.fullName}?`
                }
                description={
                  statusTarget.isActive
                    ? 'El usuario no podrá ingresar a la app hasta que sea desbloqueado.'
                    : 'El usuario volverá a poder ingresar a la app con su cuenta.'
                }
                confirmLabel={statusTarget.isActive ? 'Sí, bloquear' : 'Sí, desbloquear'}
                processing={statusProcessing}
                error={statusError}
                onConfirm={confirmStatus}
                onClose={closeStatusModal}
              />
            )}
          </AnimatePresence>

          {/* Modal: eliminar usuario */}
          <AnimatePresence>
            {deleteTarget && (
              <ConfirmModal
                variant="danger"
                title={`¿Eliminar definitivamente a ${deleteTarget.fullName}?`}
                description="Esta acción no se puede deshacer. La cuenta será eliminada y el usuario perderá el acceso a la app."
                confirmLabel="Eliminar definitivamente"
                processing={deleteProcessing}
                error={deleteError}
                onConfirm={confirmDelete}
                onClose={closeDeleteModal}
              />
            )}
          </AnimatePresence>

          {/* Toast de notificación */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-2xl backdrop-blur-md ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-rose-400 shrink-0" />
                )}
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

