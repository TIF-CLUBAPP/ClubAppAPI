import { useCallback, useEffect, useState } from 'react';
import {
  Mail,
  Shield,
  User,
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  Clock,
  RefreshCw,
  Pencil,
  Save,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { friendService } from '../services/friendService';
import { userService, type UpdateProfilePayload } from '../services/userService';
import type { Friend, FriendRequestsState } from '../types/friend';

type Tab = 'perfil' | 'amigos' | 'solicitudes';

const initialsOf = (name: string, email: string): string => {
  const base = (name || email || '?').trim();
  const parts = base.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
};

const roleMeta = (role?: string): { label: string; badgeClasses: string } => {
  switch (role) {
    case 'SUPERADMIN':
      return { label: 'Super Administrador', badgeClasses: 'text-violet-400 bg-violet-500/10 border-violet-500/20' };
    case 'ADMIN':
      return { label: 'Administrador', badgeClasses: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    case 'TEACHER':
      return { label: 'Profesor', badgeClasses: 'text-sky-300 bg-sky-500/10 border-sky-500/20' };
    default:
      return { label: 'Miembro', badgeClasses: 'text-slate-200 bg-slate-500/10 border-slate-500/30' };
  }
};

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const nameOf = (u: { fullName?: string; firstName?: string; lastName?: string; email?: string }): string =>
  u.fullName || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || '';

const isStaffRole = (role?: string): boolean => {
  const r = (role ?? '').trim().toUpperCase();
  return r === 'SUPERADMIN' || r === 'ADMIN' || r === 'TEACHER' || r === 'STAFF' || r === 'PROFESOR';
};

export default function Cuenta() {
  const { user, token, setSession } = useAuth();
  const [tab, setTab] = useState<Tab>('perfil');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequestsState>({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dni: '',
  });

  const displayName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Usuario'
    : 'Usuario';
  const email = user?.email ?? '—';
  const role = roleMeta(user?.role);
  const showRole = isStaffRole(user?.role);
  const initials = initialsOf(displayName, user?.email ?? '');

  const showFeedback = (type: 'ok' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => setFeedback(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendService.getFriends(),
        friendService.getRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch {
      setError('No pudimos cargar tus amigos y solicitudes. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    setProfileForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      dni: user?.dni ?? '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setProfileForm({ firstName: '', lastName: '', email: '', phone: '', dni: '' });
  };

  const handleSaveProfile = async () => {
    if (!user || user.id == null) {
      showFeedback('error', 'No pudimos identificar tu cuenta. Volvé a iniciar sesión.');
      return;
    }

    setSaving(true);
    try {
      await userService.updateProfile(user.id, profileForm);

      const updatedUser = {
        ...user,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
        dni: profileForm.dni,
      };
      if (token) setSession(token, updatedUser);

      setIsEditing(false);
      showFeedback('ok', 'Tus datos fueron actualizados correctamente.');
    } catch {
      showFeedback('error', 'No se pudieron guardar los cambios. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFriend = async (f: Friend) => {
    setActingId(f.id);
    try {
      await friendService.removeFriend(f.id);
      setFriends((prev) => prev.filter((x) => x.id !== f.id));
      showFeedback('ok', `${nameOf(f.friend)} fue eliminado de tus amigos.`);
    } catch {
      showFeedback('error', 'No se pudo eliminar al amigo.');
    } finally {
      setActingId(null);
    }
  };

  const handleAccept = async (id: number) => {
    setActingId(id);
    try {
      const friend = await friendService.acceptRequest(id);
      setRequests((prev) => ({ ...prev, received: prev.received.filter((r) => r.id !== id) }));
      setFriends((prev) => [friend, ...prev]);
      showFeedback('ok', 'Solicitud aceptada. ¡Ahora son amigos!');
    } catch {
      showFeedback('error', 'No se pudo aceptar la solicitud.');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActingId(id);
    try {
      await friendService.rejectRequest(id);
      setRequests((prev) => ({ ...prev, received: prev.received.filter((r) => r.id !== id) }));
      showFeedback('ok', 'Solicitud rechazada.');
    } catch {
      showFeedback('error', 'No se pudo rechazar la solicitud.');
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (id: number) => {
    setActingId(id);
    try {
      await friendService.cancelRequest(id);
      setRequests((prev) => ({ ...prev, sent: prev.sent.filter((r) => r.id !== id) }));
      showFeedback('ok', 'Solicitud cancelada.');
    } catch {
      showFeedback('error', 'No se pudo cancelar la solicitud.');
    } finally {
      setActingId(null);
    }
  };

  const receivedCount = requests.received.length;
  const sentCount = requests.sent.length;

  const tabs: { key: Tab; label: string; icon: typeof User; badge?: number }[] = [
    { key: 'perfil', label: 'Perfil', icon: User },
    { key: 'amigos', label: 'Mis Amigos', icon: Users, badge: friends.length },
    { key: 'solicitudes', label: 'Solicitudes', icon: UserPlus, badge: receivedCount },
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-hidden">
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Encabezado */}
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Mi Cuenta</span>
              <h2 className="text-2xl font-black text-white mt-1">Perfil & Amigos</h2>
              <p className="text-xs text-slate-400 mt-1">
                Gestioná tus datos, tus amigos y tus solicitudes de amistad.
              </p>
            </div>

            {feedback && (
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  feedback.type === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                }`}
              >
                <span>{feedback.text}</span>
                <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Tarjeta de perfil */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-extrabold text-white truncate">{displayName}</h3>
                {showRole && (
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-1 ${role.badgeClasses}`}>
                    {role.label}
                  </span>
                )}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p className="flex items-center gap-2 text-slate-300">
                    <Mail size={14} className="text-slate-500 shrink-0" />
                    <span className="truncate">{email}</span>
                  </p>
                  {showRole && (
                    <p className="flex items-center gap-2 text-slate-300">
                      <Shield size={14} className="text-slate-500 shrink-0" />
                      {role.label}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
                      active
                        ? 'border-emerald-400 text-emerald-300'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    {t.label}
                    {typeof t.badge === 'number' && t.badge > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold">
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Contenido de pestaña */}
            {tab === 'perfil' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="font-bold text-white">Datos personales</h3>
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg px-3 py-1.5 transition"
                    >
                      <Pencil size={13} /> Editar Perfil
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
                      >
                        <X size={13} /> Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
                      >
                        {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />} Guardar Cambios
                      </button>
                    </div>
                  )}
                </div>

                {!isEditing ? (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500 uppercase tracking-wider">Nombre</dt>
                    <dd className="text-slate-100 mt-1">{user?.firstName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 uppercase tracking-wider">Apellido</dt>
                    <dd className="text-slate-100 mt-1">{user?.lastName || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 uppercase tracking-wider">Email</dt>
                    <dd className="text-slate-100 mt-1 break-all">{email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 uppercase tracking-wider">DNI</dt>
                    <dd className="text-slate-100 mt-1">{user?.dni || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 uppercase tracking-wider">Teléfono</dt>
                    <dd className="text-slate-100 mt-1">{user?.phone || '—'}</dd>
                  </div>
                    {showRole && (
                      <div>
                        <dt className="text-xs text-slate-500 uppercase tracking-wider">Rol</dt>
                        <dd className="text-slate-100 mt-1">{role.label}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <form
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveProfile();
                    }}
                  >
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Nombre</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Apellido</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">DNI</label>
                      <input
                        type="text"
                        value={profileForm.dni}
                        onChange={(e) => setProfileForm((p) => ({ ...p, dni: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400"
                      />
                    </div>
                    {showRole && (
                      <div>
                        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Rol</label>
                        <input
                          type="text"
                          value={role.label}
                          disabled
                          className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}

            {tab === 'amigos' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Mis Amigos ({friends.length})</h3>
                  <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-50 transition"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Actualizar
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{error}</p>
                )}

                {!loading && !error && friends.length === 0 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center">
                    <Users size={32} className="mx-auto text-slate-600" />
                    <p className="mt-3 text-sm font-semibold text-white">Todavía no tenés amigos</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Agregalos desde el buscador superior de la barra de navegación.
                    </p>
                  </div>
                )}

                {!loading && friends.length > 0 && (
                  <ul className="space-y-2">
                    {friends.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                            {initialsOf(nameOf(f.friend), f.friend.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{nameOf(f.friend)}</p>
                            <p className="text-[11px] text-slate-500 truncate">{f.friend.email}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Amigo{f.since ? ` · desde ${formatDate(f.since)}` : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(f)}
                          disabled={actingId === f.id}
                          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <UserMinus size={13} />
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'solicitudes' && (
              <div className="space-y-6">
                {/* Recibidas */}
                <section className="space-y-3">
                  <h3 className="font-bold text-white flex items-center gap-2">Recibidas ({receivedCount})</h3>

                  {error && (
                    <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{error}</p>
                  )}

                  {!loading && !error && receivedCount === 0 && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-6 text-sm text-slate-400">
                      No tenés solicitudes de amistad recibidas.
                    </div>
                  )}

                  {!loading && receivedCount > 0 && (
                    <ul className="space-y-2">
                      {requests.received.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                              {initialsOf(nameOf(r.user), r.user.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{nameOf(r.user)}</p>
                              <p className="text-[11px] text-slate-500 truncate">{r.user.email}</p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAccept(r.id)}
                              disabled={actingId === r.id}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50"
                            >
                              <Check size={13} /> Aceptar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(r.id)}
                              disabled={actingId === r.id}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50"
                            >
                              <X size={13} /> Rechazar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Enviadas */}
                <section className="space-y-3">
                  <h3 className="font-bold text-white flex items-center gap-2">Enviadas ({sentCount})</h3>

                  {!loading && !error && sentCount === 0 && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-6 text-sm text-slate-400">
                      No tenés solicitudes de amistad enviadas.
                    </div>
                  )}

                  {!loading && sentCount > 0 && (
                    <ul className="space-y-2">
                      {requests.sent.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                              {initialsOf(nameOf(r.user), r.user.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{nameOf(r.user)}</p>
                              <p className="text-[11px] text-slate-500 truncate">{r.user.email}</p>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 mt-0.5">
                                <Clock size={11} /> Pendiente de respuesta
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancel(r.id)}
                            disabled={actingId === r.id}
                            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50"
                          >
                            <X size={13} /> Cancelar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
