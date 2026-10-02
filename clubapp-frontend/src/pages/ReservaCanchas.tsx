import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, RefreshCw, CheckCircle2, AlertCircle, Sparkles, GraduationCap, Layers } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { CheckoutModal } from '../components/cuotas/CheckoutModal';
import { bookingService } from '../services/bookingService';
import { spaceService } from '../services/spaceService';
import { activityService } from '../services/activityService';
import type { Booking } from '../types/booking';
import type { Space } from '../types/space';
import type { Activity } from '../types/activity';
import type { MemberCuota } from '../types/cuotas';

const fmt = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const toDateInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const pad = (n: number) => String(n).padStart(2, '0');

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map((v) => Number(v));
  return h * 60 + m;
};

const parseTime = (t?: string | null): number => {
  if (!t) return -1;
  const mins = toMinutes(t);
  return Number.isNaN(mins) ? -1 : mins;
};

interface Slot {
  key: string;
  start: string;
  end: string;
  startMin: number;
  endMin: number;
}

type SlotStatus = 'available' | 'booked' | 'class';

export default function ReservaCanchas() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<string>(toDateInput(today));
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSlot, setCreatingSlot] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [checkoutCuota, setCheckoutCuota] = useState<MemberCuota | null>(null);

  const loadSpacesAndActivities = async () => {
    try {
      const [spacesData, activitiesData] = await Promise.all([
        spaceService.getSpaces(),
        activityService.getActivities(),
      ]);
      setSpaces(spacesData);
      setActivities(activitiesData);
    } catch (err: any) {
      setToast({ type: 'error', text: err?.response?.data?.detail ?? 'No se pudieron cargar los espacios.' });
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await bookingService.getBookingsByDate(selectedDate);
      setBookings(bookingsData);
    } catch (err: any) {
      setToast({ type: 'error', text: err?.response?.data?.detail ?? 'No se pudo consultar la disponibilidad.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpacesAndActivities();
  }, []);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const activeSpaces = useMemo(
    () => spaces.filter((s) => s.isActive && s.allowReservations).sort((a, b) => a.name.localeCompare(b.name)),
    [spaces],
  );
  const maintenanceSpaces = useMemo(() => spaces.filter((s) => !s.isActive), [spaces]);

  const categories = useMemo(
    () => Array.from(new Set(activeSpaces.map((s) => s.sportCategory))).sort((a, b) => a.localeCompare(b)),
    [activeSpaces],
  );

  const filteredSpaces = useMemo(
    () => (selectedCategory === '' ? activeSpaces : activeSpaces.filter((s) => s.sportCategory === selectedCategory)),
    [activeSpaces, selectedCategory],
  );

  // Mantiene una selección válida al cambiar de categoría o al cargar los espacios.
  useEffect(() => {
    if (selectedSpaceId != null && filteredSpaces.some((s) => s.id === selectedSpaceId)) return;
    setSelectedSpaceId(filteredSpaces[0]?.id ?? null);
  }, [filteredSpaces, selectedSpaceId]);

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === selectedSpaceId) ?? null,
    [spaces, selectedSpaceId],
  );

  const dayOfWeek = useMemo(() => new Date(`${selectedDate}T12:00:00`).getDay(), [selectedDate]);
  const selectedDayLabel = useMemo(
    () => new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
    [selectedDate],
  );

  const slots = useMemo<Slot[]>(() => {
    if (!selectedSpace) return [];

    const duration = selectedSpace.slotDurationMinutes > 0 ? selectedSpace.slotDurationMinutes : 60;

    let startMin: number;
    let endMin: number;

    if (selectedSpace.is24Hours) {
      startMin = 0;
      endMin = 1440;
    } else {
      const open = parseTime(selectedSpace.openTime);
      const close = parseTime(selectedSpace.closeTime);
      startMin = open >= 0 ? open : 8 * 60;
      endMin = close >= 0 ? close : 22 * 60;
      // Si el rango cruza medianoche (o está mal configurado), se limita al final del día.
      if (endMin <= startMin) endMin = 1440;
    }

    const out: Slot[] = [];
    for (let m = startMin; m + duration <= endMin; m += duration) {
      out.push({
        key: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`,
        start: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`,
        end: `${pad(Math.floor((m + duration) / 60))}:${pad((m + duration) % 60)}`,
        startMin: m,
        endMin: m + duration,
      });
    }
    return out;
  }, [selectedSpace]);

  const slotRange = (slot: Slot) => {
    const base = new Date(`${selectedDate}T00:00:00`).getTime();
    const start = new Date(base + slot.startMin * 60000);
    const end = new Date(base + slot.endMin * 60000);
    return { start, end };
  };

  const bookingOccupied = (slot: Slot): boolean => {
    if (!selectedSpace) return false;
    const { start, end } = slotRange(slot);
    return bookings.some((b) => {
      if (b.status === 'Cancelled') return false;
      const matchesSpace =
        b.spaceId === selectedSpace.id || (b.spaceId == null && b.resourceName === selectedSpace.name);
      if (!matchesSpace) return false;
      return new Date(b.startTime) < end && start < new Date(b.endTime);
    });
  };

  const classSchedules = useMemo(() => {
    if (!selectedSpace) return [] as { name: string; startMin: number; endMin: number }[];
    return activities
      .filter((a) => a.isActive && a.spaceId === selectedSpace.id)
      .flatMap((a) =>
        (a.schedules ?? [])
          .filter((s) => s.dayOfWeek === dayOfWeek)
          .map((s) => ({ name: a.name, startMin: toMinutes(s.startTime), endMin: toMinutes(s.endTime) })),
      );
  }, [activities, selectedSpace, dayOfWeek]);

  const classOccupied = (slot: Slot): boolean => {
    if (!selectedSpace) return false;
    return classSchedules.some((s) => s.startMin < slot.endMin && slot.startMin < s.endMin);
  };

  const slotStatus = (slot: Slot): SlotStatus => {
    if (classOccupied(slot)) return 'class';
    if (bookingOccupied(slot)) return 'booked';
    return 'available';
  };

  const handleSelectSlot = async (slot: Slot) => {
    if (!selectedSpace) return;
    const { start, end } = slotRange(slot);
    setCreatingSlot(slot.key);
    try {
      const booking = await bookingService.createBooking({
        resourceName: selectedSpace.name,
        spaceId: selectedSpace.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        amount: selectedSpace.pricePerHour,
      });
      setPendingBooking(booking);
      setCheckoutCuota(buildCheckoutCuota(booking, selectedSpace));
      await loadBookings();
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.response?.data?.detail ?? err?.response?.data?.message ?? 'No se pudo reservar el turno.',
      });
      await loadBookings();
    } finally {
      setCreatingSlot(null);
    }
  };

  const handlePaymentSuccess = async () => {
    if (pendingBooking) {
      try {
        await bookingService.confirmBooking(pendingBooking.id);
      } catch {
        /* el pago ya quedó registrado */
      }
    }
    setToast({ type: 'ok', text: '¡Reserva confirmada y pagada!' });
    setCheckoutCuota(null);
    setPendingBooking(null);
    await loadBookings();
  };

  const handleCloseCheckout = async () => {
    setCheckoutCuota(null);
    setPendingBooking(null);
    await loadBookings();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Encabezado */}
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> Reserva de Espacios
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Reservar Cancha</h2>
              <p className="text-xs text-slate-400 mt-1">
                Elegí deporte, espacio y fecha. Los turnos en gris están ocupados y los azules los dicta una clase del club.
              </p>
            </div>

            {/* Barra de filtros */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <Layers size={12} /> Deporte / Categoría
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Todas</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <MapPin size={12} /> Espacio / Cancha
                  </label>
                  <select
                    value={selectedSpaceId ?? ''}
                    onChange={(e) => setSelectedSpaceId(e.target.value ? Number(e.target.value) : null)}
                    disabled={filteredSpaces.length === 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    {filteredSpaces.length === 0 ? (
                      <option value="">Sin espacios disponibles</option>
                    ) : (
                      filteredSpaces.map((s) => (
                        <option key={s.id} value={s.id}>{s.sportCategory} · {s.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <Calendar size={12} /> Fecha
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={toDateInput(today)}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
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

            {/* Aviso de espacios en mantenimiento */}
            {maintenanceSpaces.length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
                <p className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <AlertCircle size={16} /> Espacios en mantenimiento
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {maintenanceSpaces.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200"
                    >
                      <AlertCircle size={12} /> {s.name} — Desactivado por mantenimiento
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de horarios */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-slate-400 gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-sm font-medium">Consultando disponibilidad...</span>
                </div>
              ) : !selectedSpace ? (
                <div className="flex items-center justify-center h-40 text-slate-400 gap-3">
                  <MapPin size={20} />
                  <span className="text-sm font-medium">No hay espacios disponibles para esta selección.</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-white">{selectedSpace.name}</p>
                      <p className="text-xs text-emerald-400 capitalize">
                        {selectedSpace.sportCategory} · {selectedDayLabel}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Disponible</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Ocupado</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Clase</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pt-4">
                    {slots.map((slot) => {
                      const status = slotStatus(slot);
                      const isCreating = creatingSlot === slot.key;

                      if (status === 'class') {
                        return (
                          <div
                            key={slot.key}
                            className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3 flex flex-col items-center justify-center gap-1.5 text-center"
                          >
                            <span className="text-sm font-bold text-white">{slot.start} – {slot.end}</span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-full px-2 py-0.5">
                              <GraduationCap size={12} /> Clase
                            </span>
                          </div>
                        );
                      }

                      if (status === 'booked') {
                        return (
                          <div
                            key={slot.key}
                            className="rounded-2xl border border-slate-700/40 bg-slate-900/60 p-3 flex flex-col items-center justify-center gap-1.5 text-center opacity-60"
                          >
                            <span className="text-sm font-bold text-slate-400">{slot.start} – {slot.end}</span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-800/60 rounded-full px-2 py-0.5">
                              <MapPin size={12} /> Ocupado
                            </span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => handleSelectSlot(slot)}
                          disabled={!!creatingSlot}
                          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex flex-col items-center justify-center gap-1 text-center transition-all hover:bg-emerald-500 hover:text-slate-950 group disabled:opacity-50"
                        >
                          <span className="text-sm font-bold text-white group-hover:text-slate-950">
                            {slot.start} – {slot.end}
                          </span>
                          <span className="text-xs font-semibold text-emerald-300 group-hover:text-slate-900">{fmt(selectedSpace.pricePerHour)}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 group-hover:text-slate-900">
                            {isCreating ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            {isCreating ? 'Reservando…' : 'Reservar'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <CheckoutModal
        cuota={checkoutCuota}
        onClose={handleCloseCheckout}
        onPaymentSuccess={handlePaymentSuccess}
        onViewReceipt={() => setCheckoutCuota(null)}
        formatCurrency={fmt}
      />
    </div>
  );
}

function buildCheckoutCuota(booking: Booking, space: Space): MemberCuota {
  return {
    id: `booking-${booking.id}`,
    idReal: booking.paymentId ?? undefined,
    periodo: `Reserva - ${space.name}`,
    mesAno: '',
    fechaVencimiento: new Date(booking.startTime).toLocaleDateString('es-AR'),
    baseAmount: booking.amount,
    discountPercentage: 0,
    isOverdue: false,
    lateFeeAmount: 0,
    totalAmount: booking.amount,
    status: 'PENDIENTE',
    transferAlias: booking.transferAlias || 'CLUB.ATLETICO.MP',
    payoutCollector: booking.payoutCollector || 'Club',
  };
}




