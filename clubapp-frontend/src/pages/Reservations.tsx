import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { bookingService } from '../services/bookingService';
import { activityService } from '../services/activityService';
import type { Booking } from '../types/booking';
import type { MyEnrollment, ActivitySchedule } from '../types/activity';

type StatusTone = 'ok' | 'warn' | 'error';

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const BOOKING_STATUS_META: Record<string, StatusMeta> = {
  Confirmed: { label: 'Confirmada', tone: 'ok' },
  PendingPayment: { label: 'Pendiente de pago', tone: 'warn' },
  PendingApproval: { label: 'Pendiente de aprobación', tone: 'warn' },
  Cancelled: { label: 'Cancelada', tone: 'error' },
};

const ENROLLMENT_STATUS_META: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Inscripto', tone: 'ok' },
  CANCELED: { label: 'Cancelada', tone: 'error' },
};

const TONE_BADGE: Record<StatusTone, string> = {
  ok: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warn: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const formatShortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const groupSchedules = (schedules: ActivitySchedule[]): { days: string; time: string }[] => {
  if (!schedules || schedules.length === 0) return [];
  const map = new Map<string, { days: string[]; start: string; end: string }>();
  for (const s of schedules) {
    const key = `${s.startTime}|${s.endTime}`;
    const entry = map.get(key) ?? { days: [], start: s.startTime, end: s.endTime };
    entry.days.push(s.dayName || '—');
    map.set(key, entry);
  }
  return Array.from(map.values()).map((e) => ({
    days: e.days.join(', '),
    time: `${e.start} - ${e.end} hs`,
  }));
};

export default function Reservations() {
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const [filter, setFilter] = useState<'active' | 'all' | 'cancelled'>('active');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  const loadEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    setEnrollmentsError(null);
    try {
      const data = await activityService.getMyEnrollments();
      setEnrollments(data);
    } catch (err: any) {
      setEnrollmentsError(err?.response?.data?.message || 'No se pudieron cargar tus actividades.');
    } finally {
      setEnrollmentsLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err: any) {
      setBookingsError(err?.response?.data?.message || 'No se pudieron cargar tus reservas.');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnrollments();
    loadBookings();
  }, [loadEnrollments, loadBookings]);

  const openCancelConfirm = (booking: Booking) => {
    setBookingToCancel(booking);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    const id = bookingToCancel.id;
    setCancellingId(id);
    try {
      await bookingService.cancelBooking(id);
      setBookingToCancel(null);
      await loadBookings();
    } catch (err: any) {
      window.alert(err?.response?.data?.message || 'No se pudo cancelar la reserva.');
      setBookingToCancel(null);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'active') return b.status !== 'Cancelled';
    if (filter === 'cancelled') return b.status === 'Cancelled';
    return true;
  });

  const activeEnrollments = enrollments.filter((e) => e.status !== 'CANCELED');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
        <Header />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="space-y-8 max-w-7xl mx-auto">
            {/* ============ SECCIÓN SUPERIOR: MI CRONOGRAMA DE ACTIVIDADES ============ */}
            <section>
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} /> Mi Agenda Personal
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">🗓️ Mi Cronograma de Actividades</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Las clases y actividades en las que estás inscripto.
                  </p>
                </div>
              </div>

              <div className="mt-4">

                {enrollmentsLoading ? (
                  <EmptyState icon={<Loader2 size={32} className="animate-spin" />} title="Cargando actividades…" />
                ) : enrollmentsError ? (
                  <EmptyState icon={<AlertCircle size={32} className="text-rose-500" />} title="No se pudieron cargar tus actividades" subtitle={enrollmentsError} onRetry={loadEnrollments} />
                ) : activeEnrollments.length === 0 ? (
                  <EmptyState icon={<Calendar size={32} />} title="Todavía no estás inscripto en ninguna actividad" subtitle="Podés inscribirte desde la sección Actividades." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {activeEnrollments.map((enr) => (
                        <motion.div
                          key={enr.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-lg font-black text-white leading-snug">{enr.activityName}</h4>
                            <StatusBadge meta={ENROLLMENT_STATUS_META[enr.status] ?? { label: enr.status, tone: 'warn' }} />
                          </div>

                          <div className="space-y-2 text-xs text-slate-400">
                            {groupSchedules(enr.schedules).map((g, idx) => (
                              <p key={idx} className="flex items-center gap-2">
                                <Clock size={13} className="text-slate-500 shrink-0" />
                                <span>{g.days} · {g.time}</span>
                              </p>
                            ))}
                            {groupSchedules(enr.schedules).length === 0 && (
                              <p className="flex items-center gap-2">
                                <Clock size={13} className="text-slate-500 shrink-0" /> Sin horarios definidos
                              </p>
                            )}
                            <p className="flex items-center gap-2">
                              <MapPin size={13} className="text-slate-500 shrink-0" />
                              {enr.spaceName ?? 'Espacio a definir'}
                            </p>
                            <p className="flex items-center gap-2">
                              <GraduationCap size={13} className="text-slate-500 shrink-0" />
                              {enr.instructorName ? `Profesor: ${enr.instructorName}` : 'Sin profesor asignado'}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </section>


            {/* ============ SECCIÓN INFERIOR: MIS ALQUILERES DE CANCHAS ============ */}
            <section>
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} /> Reservas de Espacios
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">🎾 Mis Alquileres de Canchas</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Consultá y gestioná tus turnos de cancha.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
                  <FilterButton active={filter === 'active'} onClick={() => setFilter('active')} activeClass="bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20">Activas</FilterButton>
                  <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} activeClass="bg-slate-800 text-white">Todas</FilterButton>
                  <FilterButton active={filter === 'cancelled'} onClick={() => setFilter('cancelled')} activeClass="bg-rose-500 text-white shadow-md shadow-rose-500/20">Canceladas</FilterButton>
                </div>
              </div>

              <div className="mt-4">
                {bookingsLoading ? (
                  <EmptyState icon={<Loader2 size={32} className="animate-spin" />} title="Cargando reservas…" />
                ) : bookingsError ? (
                  <EmptyState icon={<AlertCircle size={32} className="text-rose-500" />} title="No se pudieron cargar tus reservas" subtitle={bookingsError} onRetry={loadBookings} />
                ) : filteredBookings.length === 0 ? (
                  <EmptyState icon={<Calendar size={32} />} title="No se encontraron reservas" subtitle={filter === 'active' ? 'No tenés ningún turno activo en este momento.' : 'No hay registros en esta categoría.'} />
                ) : (
                  <motion.div
                    key={filter}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[280px]"
                  >
                    <AnimatePresence>
                      {filteredBookings.map((b) => {
                        const meta = BOOKING_STATUS_META[b.status] ?? { label: b.status, tone: 'warn' as StatusTone };
                        const isCancelled = b.status === 'Cancelled';
                        const spaceName = b.spaceName || b.resourceName || 'Espacio';
                        return (
                          <motion.div
                            key={b.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`relative bg-slate-900 border ${isCancelled ? 'border-rose-950/40 opacity-75' : 'border-slate-800 hover:border-emerald-500/40'} rounded-3xl p-6 shadow-xl space-y-4 transition-all`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <StatusBadge meta={meta} />
                            </div>

                            <div>
                              <h4 className="text-lg font-black text-white flex items-center gap-2">
                                <MapPin size={16} className="text-emerald-400 shrink-0" />
                                {spaceName}
                              </h4>
                              <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                                <Calendar size={13} className="text-slate-500 shrink-0" /> {formatShortDate(b.startTime)}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <Clock size={13} className="text-slate-500 shrink-0" /> {formatTime(b.startTime)} - {formatTime(b.endTime)} hs
                              </p>
                            </div>

                            {!isCancelled && (
                              <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                                <button
                                  onClick={() => openCancelConfirm(b)}
                                  disabled={cancellingId === b.id}
                                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {cancellingId === b.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  Cancelar Reserva
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ============ MODAL DE CONFIRMACIÓN DE CANCELACIÓN ============ */}
      <AnimatePresence>
        {bookingToCancel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!cancellingId) setBookingToCancel(null);
            }}
          >
            <motion.div
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">¿Cancelar Reserva?</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    ¿Estás seguro de que deseas cancelar la reserva en{' '}
                    <span className="font-semibold text-white">
                      {bookingToCancel.spaceName || bookingToCancel.resourceName || 'Espacio'}
                    </span>{' '}
                    para el{' '}
                    <span className="font-semibold text-white">{formatShortDate(bookingToCancel.startTime)}</span>?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setBookingToCancel(null)}
                  disabled={cancellingId !== null}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mantener Reserva
                </button>
                <button
                  onClick={confirmCancelBooking}
                  disabled={cancellingId !== null}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingId === bookingToCancel.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Sí, Cancelar Reserva
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function StatusBadge({ meta }: { meta: StatusMeta }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${TONE_BADGE[meta.tone]}`}>
      {meta.tone === 'ok' && <CheckCircle2 size={12} />}
      {meta.tone === 'warn' && <Clock size={12} />}
      {meta.tone === 'error' && <AlertCircle size={12} />}
      {meta.label}
    </span>
  );
}

function FilterButton({ active, onClick, activeClass, children }: { active: boolean; onClick: () => void; activeClass: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${active ? activeClass : 'text-slate-400 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, subtitle, onRetry }: { icon: ReactNode; title: string; subtitle?: string; onRetry?: () => void }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
      <div className="inline-flex p-4 rounded-full bg-slate-950 text-slate-500 border border-slate-800">{icon}</div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 max-w-xs mx-auto">{subtitle}</p>}
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all">
          Reintentar
        </button>
      )}
    </div>
  );
}

