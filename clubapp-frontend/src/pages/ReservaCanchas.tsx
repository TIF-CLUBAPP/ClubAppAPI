import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, RefreshCw, CheckCircle2, AlertCircle, Sparkles, GraduationCap, Layers, ChevronLeft, ChevronRight, ChevronDown, Check, X, ArrowRight } from 'lucide-react';
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

const WEEKDAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const formatDateLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

interface CalendarPickerProps {
  value: string;
  min: string;
  onChange: (date: string) => void;
}

function CalendarPicker({ value, min, onChange }: CalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(`${value}T12:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayIso = toDateInput(new Date());

  const cells: { day: number; iso: string }[] = [];
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ day: d, iso: toDateInput(new Date(year, month, d)) });
  }

  const openCalendar = () => {
    const d = new Date(`${value}T12:00:00`);
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setOpen(true);
  };

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openCalendar}
        className="w-full flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 hover:border-slate-700 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Calendar size={15} className="text-emerald-400" />
          <span className="capitalize">{formatDateLabel(value)}</span>
        </span>
        <ChevronDown size={15} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 left-0 mt-2 w-70 rounded-2xl border border-emerald-500/40 bg-slate-900 p-3 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Mes anterior"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-white capitalize">{MONTHS_ES[month]} {year}</span>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Mes siguiente"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center mb-1">
              {WEEKDAYS_ES.map((wd) => (
                <span key={wd} className="text-[10px] uppercase font-semibold text-slate-500 py-1">
                  {wd}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {cells.map(({ day, iso }) => {
                const isDisabled = iso < min;
                const isSelected = iso === value;
                const isToday = iso === todayIso;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'bg-emerald-400 text-slate-950'
                        : isDisabled
                          ? 'text-slate-600 cursor-not-allowed'
                          : isToday
                            ? 'border border-emerald-500/50 text-emerald-300 hover:bg-slate-800'
                            : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ReservaCanchas() {
  const today = useMemo(() => new Date(), []);
  const location = useLocation();
  const appliedPreSelection = useRef(false);
  const [selectedDate, setSelectedDate] = useState<string>(toDateInput(today));
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [pendingSlots, setPendingSlots] = useState<Slot[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
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

  // Limpia la selección múltiple al cambiar de fecha o de espacio/cancha.
  useEffect(() => {
    setSelectedSlots([]);
  }, [selectedSpaceId, selectedDate]);

  const activeSpaces = useMemo(
    () => spaces.filter((s) => s.isActive && s.allowReservations).sort((a, b) => a.name.localeCompare(b.name)),
    [spaces],
  );
  const maintenanceSpaces = useMemo(() => spaces.filter((s) => !s.isActive), [spaces]);

  const categories = useMemo(
    () => Array.from(new Set(activeSpaces.map((s) => s.sportCategory))).sort((a, b) => a.localeCompare(b)),
    [activeSpaces],
  );

  // Aplica la pre-selección recibida desde el Dashboard (navegación con estado).
  useEffect(() => {
    if (appliedPreSelection.current || spaces.length === 0) return;
    appliedPreSelection.current = true;

    const state = location.state as { spaceId?: number; sportCategory?: string } | null;
    if (!state) return;

    if (state.sportCategory) setSelectedCategory(state.sportCategory);
    if (state.spaceId != null && spaces.some((s) => s.id === state.spaceId)) {
      setSelectedSpaceId(state.spaceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaces, location.state]);

  const filteredSpaces = useMemo(
    () => (selectedCategory === '' ? [] : activeSpaces.filter((s) => s.sportCategory === selectedCategory)),
    [activeSpaces, selectedCategory],
  );

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

  const handleToggleSlot = (slot: Slot) => {
    if (!selectedSpace) return;
    setSelectedSlots((prev) =>
      prev.some((s) => s.key === slot.key)
        ? prev.filter((s) => s.key !== slot.key)
        : [...prev, slot],
    );
  };

  const handleCheckout = () => {
    if (!selectedSpace || selectedSlots.length === 0) return;

    // Abre el checkout SIN crear la reserva: la creación se difiere al confirmar
    // (Pago Total) o al inicializar la reserva grupal (Dividir con Amigos).
    // Los slots quedan en el estado local para poder crear la reserva al confirmar.
    setPendingSlots(selectedSlots);
    setPendingBookings([]);
    setCheckoutCuota(buildBatchCheckoutCuota(selectedSlots, selectedSpace, selectedDate));
    setSelectedSlots([]);
  };

  // Crea la reserva (y su pago asociado) recién al confirmar el Pago Total.
  // Devuelve el Payment.Id a cobrar; los bookings creados se guardan en
  // pendingBookings para confirmarlos en handlePaymentSuccess.
  const prepareBookingForTotal = async (): Promise<{ paymentId: number }> => {
    if (!selectedSpace || pendingSlots.length === 0) {
      throw new Error('No hay turnos seleccionados para reservar.');
    }

    setIsBatchProcessing(true);
    try {
      const created = await Promise.all(
        pendingSlots.map((slot) => {
          const { start, end } = slotRange(slot);
          return bookingService.createBooking({
            resourceName: selectedSpace.name,
            spaceId: selectedSpace.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            amount: selectedSpace.pricePerHour,
          });
        }),
      );

      setPendingBookings(created);

      const paymentId = created[0]?.paymentId ?? null;
      if (paymentId === null) {
        throw new Error('No se pudo generar el pago de la reserva.');
      }

      return { paymentId };
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (pendingBookings.length > 0) {
      for (const booking of pendingBookings) {
        try {
          await bookingService.confirmBooking(booking.id);
        } catch {
          /* el pago ya quedó registrado */
        }
      }
    }
    setToast({ type: 'ok', text: '¡Reservas confirmadas y pagadas!' });
    setCheckoutCuota(null);
    setPendingBookings([]);
    setPendingSlots([]);
    setSelectedSlots([]);
    await loadBookings();
  };

  const handleCloseCheckout = async () => {
    setCheckoutCuota(null);
    setPendingBookings([]);
    setPendingSlots([]);
    await loadBookings();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
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
                    onChange={(e) => {
                      const category = e.target.value;
                      setSelectedCategory(category);
                      if (category === '') {
                        setSelectedSpaceId(null);
                        return;
                      }
                      const matches = activeSpaces.filter((s) => s.sportCategory === category);
                      setSelectedSpaceId(matches.length === 1 ? matches[0].id : null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Seleccioná un deporte</option>
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
                    disabled={selectedCategory === '' || filteredSpaces.length === 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">Seleccioná un espacio / cancha</option>
                    {filteredSpaces.map((s) => (
                      <option key={s.id} value={s.id}>{s.sportCategory} · {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <Calendar size={12} /> Fecha
                  </label>
                  <CalendarPicker value={selectedDate} min={toDateInput(today)} onChange={setSelectedDate} />
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
                  <Calendar size={20} />
                  <span className="text-sm font-medium">
                    {selectedCategory === ''
                      ? 'Seleccioná un deporte y un espacio para ver los turnos disponibles.'
                      : 'Seleccioná un espacio para ver los turnos disponibles.'}
                  </span>
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
                      const isSelected = selectedSlots.some((s) => s.key === slot.key);

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
                          onClick={() => handleToggleSlot(slot)}
                          className={`rounded-2xl border p-3 flex flex-col items-center justify-center gap-1 text-center transition-all group ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-600/30 ring-2 ring-emerald-400/70 shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                              : 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950'
                          }`}
                        >
                          <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-white group-hover:text-slate-950'}`}>
                            {slot.start} – {slot.end}
                          </span>
                          <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-200' : 'text-emerald-300 group-hover:text-slate-900'}`}>
                            {fmt(selectedSpace.pricePerHour)}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${isSelected ? 'text-emerald-200' : 'text-emerald-300 group-hover:text-slate-900'}`}>
                            {isSelected ? <CheckCircle2 size={12} /> : <Check size={12} />}
                            {isSelected ? 'Seleccionado' : 'Seleccionar'}
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

      {selectedSlots.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-full px-6 py-3 shadow-2xl shadow-emerald-950/40">
          <span className="text-sm text-slate-300 whitespace-nowrap">
            <span className="font-bold text-white">{selectedSlots.length}</span>{' '}
            {selectedSlots.length === 1 ? 'turno seleccionado' : 'turnos seleccionados'}
          </span>
          <span className="h-6 w-px bg-slate-700/60" />
          <span className="text-sm font-black text-emerald-400 whitespace-nowrap">
            {fmt(selectedSlots.length * (selectedSpace?.pricePerHour ?? 0))}
          </span>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isBatchProcessing}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBatchProcessing ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            Ir a Pagar
          </button>
          <button
            type="button"
            onClick={() => setSelectedSlots([])}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
            aria-label="Limpiar selección"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <CheckoutModal
        cuota={checkoutCuota}
        onClose={handleCloseCheckout}
        onPaymentSuccess={handlePaymentSuccess}
        onViewReceipt={() => setCheckoutCuota(null)}
        formatCurrency={fmt}
        enableGroupPayment
        prepareBookingForTotal={prepareBookingForTotal}
      />
    </div>
  );
}

function buildBatchCheckoutCuota(slots: Slot[], space: Space, selectedDate: string): MemberCuota {
  const sorted = [...slots].sort((a, b) => a.startMin - b.startMin);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalBase = sorted.length * space.pricePerHour;

  const base = new Date(`${selectedDate}T00:00:00`).getTime();
  const startTime = new Date(base + first.startMin * 60000).toISOString();
  const endTime = new Date(base + last.endMin * 60000).toISOString();

  return {
    id: `booking-batch-${selectedDate}-${first.start}`,
    idReal: undefined,
    periodo: `Reserva - ${space.name} (${slots.length} turnos)`,
    mesAno: '',
    fechaVencimiento: new Date(startTime).toLocaleDateString('es-AR'),
    baseAmount: totalBase,
    discountPercentage: 0,
    isOverdue: false,
    lateFeeAmount: 0,
    totalAmount: totalBase,
    status: 'PENDIENTE',
    transferAlias: 'CLUB.ATLETICO.MP',
    payoutCollector: 'Club',
    reservation: {
      resourceName: space.name,
      spaceId: space.id,
      startTime,
      endTime,
    },
  };
}
