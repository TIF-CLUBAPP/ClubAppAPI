import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, MapPin, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Layers, ChevronLeft, ChevronRight, ChevronDown, Check, ArrowRight, Clock, Plus, X } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useToast } from '../context/ToastContext';
import { CheckoutModal } from '../components/cuotas/CheckoutModal';
import { bookingService } from '../services/bookingService';
import { spaceService } from '../services/spaceService';
import { activityService } from '../services/activityService';
import type { Booking } from '../types/booking';
import type { Space } from '../types/space';
import type { Activity } from '../types/activity';
import type { MemberCuota } from '../types/cuotas';
import { computeDigitalServiceFee, DIGITAL_SERVICE_FEE_PERCENTAGE, DIGITAL_SERVICE_FEE_MAX_AMOUNT } from '../config/fees';

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

interface Slot {
  key: string;
  start: string;
  end: string;
  startMin: number;
  endMin: number;
}

// Grupo de turnos de una misma fecha (carrito multi-día del Paso 2).
interface CartItem {
  date: string;
  slots: Slot[];
}

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

const formatLongDateLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

// Formatea los turnos seleccionados para mostrarlos en resúmenes y confirmación.
const formatSlotsLabel = (slots: Slot[]): string => {
  if (slots.length === 0) return '—';
  const sorted = [...slots].sort((a, b) => a.startMin - b.startMin);
  if (sorted.length === 1) return `${sorted[0].start} – ${sorted[0].end}`;

  const contiguous = sorted.every((s, i) => i === 0 || s.startMin === sorted[i - 1].endMin);
  if (contiguous) return `${sorted[0].start} – ${sorted[sorted.length - 1].end}`;
  return sorted.map((s) => `${s.start}–${s.end}`).join(', ');
};

// Resumen legible del carrito multi-día: "vie 30/10: 08–09, 10–11 · sáb 31/10: 09–10".
const formatCartSummary = (items: CartItem[]): string =>
  items
    .map((i) => `${formatDateLabel(i.date)}: ${formatSlotsLabel(i.slots)}`)
    .join(' · ');

// Horario genérico de la grilla del Paso 2 (08:00 a 22:00, turnos de 60 minutos).
const GENERIC_OPEN_MIN = 8 * 60;
const GENERIC_CLOSE_MIN = 22 * 60;
const GENERIC_SLOT_MIN = 60;

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
        className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Calendar size={16} className="text-emerald-400" />
          {formatDateLabel(value)}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 z-50 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-white capitalize">
                {MONTHS_ES[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {WEEKDAYS_ES.map((w) => (
                <span key={w} className="text-[10px] font-semibold text-slate-500 uppercase">
                  {w}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {cells.map(({ day, iso }) => {
                const isSelected = iso === value;
                const isDisabled = iso < min;
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

type StepId = 1 | 2 | 3 | 4;

interface StepDef {
  id: StepId;
  label: string;
}

const STEPS: StepDef[] = [
  { id: 1, label: 'Deporte / Espacio' },
  { id: 2, label: 'Fecha y Horario' },
  { id: 3, label: 'Espacios Disponibles' },
  { id: 4, label: 'Pago' },
];

export default function ReservaCanchas() {
  const today = useMemo(() => new Date(), []);
  const location = useLocation();
  const appliedPreSelection = useRef(false);
  const toast = useToast();

  const [step, setStep] = useState<StepId>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(toDateInput(today));
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);

  // Carrito multi-día: acumula { fecha, turnos } antes de avanzar al Paso 3.
  const [cart, setCart] = useState<CartItem[]>([]);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, Booking[]>>({});
  const [loading, setLoading] = useState(true);

  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [pendingItems, setPendingItems] = useState<CartItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
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
      toast.error(err?.response?.data?.detail ?? 'No se pudieron cargar los espacios.');
    }
  };

  const loadedDatesRef = useRef<Set<string>>(new Set());

  // Carga (y cachea) las reservas de cada fecha del carrito para evaluar disponibilidad real.
  const loadBookingsForDates = async (dates: string[]) => {
    const unique = Array.from(new Set(dates)).filter(Boolean);
    const toLoad = unique.filter((d) => !loadedDatesRef.current.has(d));
    if (toLoad.length === 0) return;
    setLoading(true);
    try {
      const entries = await Promise.all(
        toLoad.map(async (date) => [date, await bookingService.getBookingsByDate(date)] as const),
      );
      loadedDatesRef.current = new Set([...loadedDatesRef.current, ...toLoad]);
      setBookingsByDate((prev) => ({
        ...prev,
        ...(Object.fromEntries(entries) as Record<string, Booking[]>),
      }));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'No se pudo consultar la disponibilidad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpacesAndActivities();
    loadBookingsForDates([selectedDate]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSpaces = useMemo(
    () => spaces.filter((s) => s.isActive && s.allowReservations).sort((a, b) => a.name.localeCompare(b.name)),
    [spaces],
  );

  const categories = useMemo(
    () => Array.from(new Set(activeSpaces.map((s) => s.sportCategory))).sort((a, b) => a.localeCompare(b)),
    [activeSpaces],
  );

  const categorySpaces = useMemo(
    () => (selectedCategory === '' ? [] : activeSpaces.filter((s) => s.sportCategory === selectedCategory)),
    [activeSpaces, selectedCategory],
  );

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === selectedSpaceId) ?? null,
    [spaces, selectedSpaceId],
  );

  // Turnos de la fecha actualmente visible en el selector (derivado del carrito).
  const selectedSlots = useMemo(
    () => cart.find((c) => c.date === selectedDate)?.slots ?? [],
    [cart, selectedDate],
  );

  // Total de turnos acumulados en todas las fechas del carrito.
  const totalSlotCount = useMemo(
    () => cart.reduce((n, c) => n + c.slots.length, 0),
    [cart],
  );

  // Subtotal del alquiler y estimación del costo del servicio digital ATRIO
  // (3.5% - máx $1.500) para mostrarlo antes de abrir la pasarela de pago.
  const reservationSubtotal = selectedSpace ? selectedSpace.pricePerHour * totalSlotCount : 0;
  const estimatedServiceFee = computeDigitalServiceFee(reservationSubtotal);
  const estimatedTotalWithService = reservationSubtotal + estimatedServiceFee;

  // Pre-selección recibida desde el Dashboard (ClubMapWidget).
  useEffect(() => {
    if (appliedPreSelection.current || spaces.length === 0) return;
    appliedPreSelection.current = true;

    const state = location.state as { spaceId?: number; sportCategory?: string } | null;
    if (!state) return;

    if (state.sportCategory) {
      setSelectedCategory(state.sportCategory);
      setStep(2);
    }
    if (state.spaceId != null && spaces.some((s) => s.id === state.spaceId)) {
      setSelectedSpaceId(state.spaceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaces, location.state]);

  // Grilla genérica de turnos del Paso 2.
  const genericSlots = useMemo<Slot[]>(() => {
    const out: Slot[] = [];
    for (let m = GENERIC_OPEN_MIN; m + GENERIC_SLOT_MIN <= GENERIC_CLOSE_MIN; m += GENERIC_SLOT_MIN) {
      out.push({
        key: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`,
        start: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`,
        end: `${pad(Math.floor((m + GENERIC_SLOT_MIN) / 60))}:${pad((m + GENERIC_SLOT_MIN) % 60)}`,
        startMin: m,
        endMin: m + GENERIC_SLOT_MIN,
      });
    }
    return out;
  }, []);

  const isPastSlot = (slot: Slot): boolean => {
    if (selectedDate !== toDateInput(new Date())) return false;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return slot.startMin <= nowMin;
  };

  const slotRange = (slot: Slot, date: string) => {
    const base = new Date(`${date}T00:00:00`).getTime();
    const start = new Date(base + slot.startMin * 60000);
    const end = new Date(base + slot.endMin * 60000);
    return { start, end };
  };

  // Disponibilidad real por espacio para TODOS los días y turnos del carrito.
  const isCourtAvailable = (space: Space): boolean => {
    if (cart.length === 0) return false;

    return cart.every(({ date, slots }) => {
      const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
      const dayBookings = bookingsByDate[date] ?? [];

      return slots.every((slot) => {
        const { start, end } = slotRange(slot, date);

        const hasBooking = dayBookings.some((b) => {
          if (b.status === 'Cancelled') return false;
          const matches = b.spaceId === space.id || (b.spaceId == null && b.resourceName === space.name);
          if (!matches) return false;
          return new Date(b.startTime) < end && start < new Date(b.endTime);
        });
        if (hasBooking) return false;

        const hasClass = activities
          .filter((a) => a.isActive && a.spaceId === space.id)
          .flatMap((a) => (a.schedules ?? []).filter((s) => s.dayOfWeek === dayOfWeek))
          .some((s) => toMinutes(s.startTime) < slot.endMin && slot.startMin < toMinutes(s.endTime));
        if (hasClass) return false;

        return true;
      });
    });
  };

  const availableCourts = useMemo(
    () => categorySpaces.filter(isCourtAvailable),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categorySpaces, bookingsByDate, activities, cart],
  );

  const stepCompleted = (n: StepId): boolean => {
    if (n === 1) return selectedCategory !== '';
    if (n === 2) return totalSlotCount > 0;
    if (n === 3) return selectedSpaceId !== null;
    return false;
  };

  const canGoTo = (n: StepId): boolean => n <= step || stepCompleted(n);

  const goTo = (n: StepId) => {
    if (!canGoTo(n)) return;
    setStep(n);
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setCart([]);
    setSelectedSpaceId(null);
    setStep(2);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSpaceId(null);
    setStep(2);
  };

  // Alterna un turno en el carrito, asociado a la fecha actualmente visible.
  const handleToggleSlot = (slot: Slot) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.date === selectedDate);
      const current = idx >= 0 ? prev[idx].slots : [];
      const exists = current.some((s) => s.key === slot.key);
      const nextSlots = exists
        ? current.filter((s) => s.key !== slot.key)
        : [...current, slot].sort((a, b) => a.startMin - b.startMin);

      if (idx >= 0) {
        if (nextSlots.length === 0) return prev.filter((c) => c.date !== selectedDate);
        const next = [...prev];
        next[idx] = { ...next[idx], slots: nextSlots };
        return next;
      }
      if (nextSlots.length === 0) return prev;
      return [...prev, { date: selectedDate, slots: nextSlots }].sort((a, b) => a.date.localeCompare(b.date));
    });
    setSelectedSpaceId(null);
  };

  // Agrega "otro día u horario": avanza el selector al día siguiente para seguir sumando fechas.
  const handleAddAnotherDay = () => {
    const next = new Date(`${selectedDate}T12:00:00`);
    next.setDate(next.getDate() + 1);
    setSelectedDate(toDateInput(next));
    setSelectedSpaceId(null);
  };

  const removeCartItem = (date: string) => {
    setCart((prev) => prev.filter((c) => c.date !== date));
    setSelectedSpaceId(null);
  };

  const clearCart = () => {
    setCart([]);
    setSelectedSpaceId(null);
  };

  const handleContinueToCourts = async () => {
    if (cart.length === 0) return;
    setSelectedSpaceId(null);
    await loadBookingsForDates(cart.map((c) => c.date));
    setStep(3);
  };

  const handleSelectSpace = (spaceId: number) => {
    setSelectedSpaceId(spaceId);
    setStep(4);
  };

  const handleGoBack = () => {
    if (step === 4) setStep(3);
    else if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleCheckout = () => {
    if (!selectedSpace || cart.length === 0) return;
    setPendingItems([...cart]);
    setPendingBookings([]);
    setCheckoutCuota(buildCheckoutCuota(cart, selectedSpace));
  };

  const prepareBookingForTotal = async (): Promise<{ paymentId: number }> => {
    if (!selectedSpace || pendingItems.length === 0) {
      throw new Error('No hay turnos seleccionados para reservar.');
    }
    setIsBatchProcessing(true);
    try {
      const created = await Promise.all(
        pendingItems.flatMap(({ date, slots }) =>
          slots.map((slot) => {
            const { start, end } = slotRange(slot, date);
            return bookingService.createBooking({
              resourceName: selectedSpace.name,
              spaceId: selectedSpace.id,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              amount: selectedSpace.pricePerHour,
            });
          }),
        ),
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
    const bookedDates = cart.map((c) => c.date);
    toast.success('¡Reservas confirmadas y pagadas!');
    setCheckoutCuota(null);
    setPendingBookings([]);
    setPendingItems([]);
    setSelectedCategory('');
    setCart([]);
    setSelectedSpaceId(null);
    setStep(1);
    await loadBookingsForDates(bookedDates);
  };

  const handleCloseCheckout = async () => {
    setCheckoutCuota(null);
    setPendingBookings([]);
    setPendingItems([]);
    await loadBookingsForDates(cart.map((c) => c.date));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header />
        <main className="flex-1 w-full min-w-0 overflow-y-auto pt-16 px-4 pb-40 md:pt-6 md:px-6 md:pb-28">
          <div className="space-y-6 w-full max-w-5xl mx-auto">
            {/* Encabezado */}
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> Reserva de Espacios
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Reservar un Espacio</h2>
              <p className="text-xs text-slate-400 mt-1">
                Completá los 4 pasos para reservar tu espacio. Podés volver atrás en cualquier momento para corregir tu selección.
              </p>
            </div>

            {/* Stepper visual superior */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between max-w-3xl mx-auto relative">
                <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-800 -translate-y-1/2 z-0 hidden sm:block" />
                {STEPS.map((s) => {
                  const isActive = step === s.id;
                  const isCompleted = stepCompleted(s.id) && !isActive;
                  const isClickable = canGoTo(s.id);

                  return (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => goTo(s.id)}
                      className={`relative z-10 flex flex-col items-center gap-2 ${isClickable ? 'cursor-pointer group' : 'cursor-default'}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 scale-105'
                            : isCompleted
                              ? 'bg-slate-900 border-2 border-emerald-500 text-emerald-400'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isCompleted ? <Check size={18} strokeWidth={3} /> : s.id}
                      </div>
                      <span
                        className={`text-xs font-semibold text-center transition-colors ${
                          isActive ? 'text-emerald-400' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
            {/* PASO 1: Deporte / Espacio */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers size={18} className="text-emerald-400" /> Elegí un Espacio
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{categories.length} categorías de espacio disponibles</span>
                </div>

                {categories.length === 0 ? (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No hay espacios habilitados para reservas en este momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => {
                      const count = activeSpaces.filter((s) => s.sportCategory === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleSelectCategory(cat)}
                          className="bg-slate-900 border border-slate-800 hover:border-emerald-400/80 rounded-2xl p-5 text-left transition-all duration-300 group hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.99] active:border-emerald-400 flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-lg transition">
                              {cat.charAt(0)}
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                              {count} {count === 1 ? 'espacio' : 'espacios'}
                            </span>
                          </div>
                          <div className="mt-4">
                            <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition">{cat}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Seleccioná un espacio para continuar</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* PASO 2: Fecha y Horario */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Calendar size={18} className="text-emerald-400" /> Fecha y Horario
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Deporte / Espacio elegido: <span className="text-emerald-400 font-semibold">{selectedCategory}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl px-3 py-2 transition flex items-center gap-1.5"
                  >
                    <ChevronLeft size={14} /> Volver
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5">
                  <div className="max-w-sm">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1.5">
                      Fecha de Reserva
                    </label>
                    <CalendarPicker value={selectedDate} min={toDateInput(today)} onChange={handleSelectDate} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Elegí tus horarios (de 08:00 a 22:00)
                      </p>
                      {loading && (
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <RefreshCw size={12} className="animate-spin text-emerald-400" /> Consultando disponibilidad…
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {genericSlots.map((slot) => {
                        const past = isPastSlot(slot);
                        const isSelected = selectedSlots.some((s) => s.key === slot.key);
                        return (
                          <button
                            key={slot.key}
                            type="button"
                            disabled={past}
                            onClick={() => handleToggleSlot(slot)}
                            className={`rounded-2xl border p-3 flex flex-col items-center justify-center gap-1.5 text-center transition-all duration-300 ${
                              past
                                ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                                : isSelected
                                  ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.03]'
                                  : 'bg-slate-950 border-slate-800 hover:border-emerald-500/60 hover:scale-[1.03] text-white'
                            }`}
                          >
                            <span className="text-sm font-bold flex items-center gap-1.5">
                              <Clock size={14} className={past ? 'text-slate-600' : 'text-emerald-400'} />
                              {slot.start} – {slot.end}
                            </span>
                            <span className={`text-[11px] font-semibold ${past ? 'text-slate-600' : isSelected ? 'text-slate-800' : 'text-emerald-400'}`}>
                              {past ? 'No disponible' : isSelected ? 'Seleccionado' : 'Seleccionar'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                      <Plus size={13} className="text-emerald-400" />
                      ¿Reservás en más de un día? Agregá otro día u horario desde la barra inferior.
                    </p>
                  </div>
                </div>

                {/* Carrito multi-día: turnos acumulados de distintas fechas */}
                {cart.length > 0 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Turnos en tu reserva ({totalSlotCount})
                      </p>
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 transition"
                      >
                        Limpiar todo
                      </button>
                    </div>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.date} className="flex items-start justify-between gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white capitalize">{formatLongDateLabel(item.date)}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{formatSlotsLabel(item.slots)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.date)}
                            className="shrink-0 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            aria-label={`Quitar ${formatLongDateLabel(item.date)}`}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* PASO 3: Espacios Disponibles */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MapPin size={18} className="text-emerald-400" /> Espacios Disponibles
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedCategory} · {formatCartSummary(cart)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl px-3 py-2 transition flex items-center gap-1.5"
                  >
                    <ChevronLeft size={14} /> Volver
                  </button>
                </div>

                {availableCourts.length === 0 ? (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">
                      No hay espacios disponibles para esos horarios. Probá con otros turnos o fecha.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availableCourts.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSpace(s.id)}
                        className="bg-slate-900 border border-slate-800 hover:border-emerald-400/80 rounded-2xl p-5 text-left transition-all duration-300 group hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.99] active:border-emerald-400"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-emerald-500/50 flex items-center justify-center text-emerald-400">
                            <MapPin size={18} />
                          </div>
                          <span className="text-xs font-black text-emerald-400">{fmt(s.pricePerHour)}</span>
                        </div>
                        <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition mt-4">{s.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{s.location || 'Ubicación principal'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* PASO 4: Pago */}
            {step === 4 && selectedSpace && cart.length > 0 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" /> Confirmá tu Reserva
                  </h3>
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl px-3 py-2 transition flex items-center gap-1.5"
                  >
                    <ChevronLeft size={14} /> Volver
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Deporte / Espacio</p>
                      <p className="text-sm font-bold text-white mt-1">{selectedCategory}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Espacio</p>
                      <p className="text-sm font-bold text-white mt-1">{selectedSpace.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedSpace.location || 'Ubicación principal'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      Turnos reservados ({totalSlotCount} {totalSlotCount === 1 ? 'turno' : 'turnos'})
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {cart.map((item) => (
                        <div key={item.date} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-400 capitalize">{formatLongDateLabel(item.date)}</span>
                          <span className="font-bold text-white text-right">{formatSlotsLabel(item.slots)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                    <span className="text-sm text-slate-300">Precio por hora</span>
                    <span className="text-sm font-bold text-white">{fmt(selectedSpace.pricePerHour)}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Desglose estimado de tu pago</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Subtotal alquiler ({totalSlotCount} {totalSlotCount === 1 ? 'turno' : 'turnos'})</span>
                      <span className="text-sm font-semibold text-white">{fmt(reservationSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Costo servicio digital ATRIO ({DIGITAL_SERVICE_FEE_PERCENTAGE}% - máx {fmt(DIGITAL_SERVICE_FEE_MAX_AMOUNT)})</span>
                      <span className="text-sm font-semibold text-sky-400">+{fmt(estimatedServiceFee)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                      <span className="text-sm font-bold text-white">Total estimado a abonar con servicio</span>
                      <span className="text-xl font-black text-emerald-400">{fmt(estimatedTotalWithService)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 leading-relaxed">
                    ¿Van con amigos? En la pasarela de pago podés <span className="text-emerald-300 font-semibold">Dividir con Amigos</span> y abonar solo tu parte. El total es estimado y puede variar según el método de pago.
                  </p>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Barra de acción flotante (fija en la parte inferior) */}
      {(step === 2 || step === 4) && (
        <div className="fixed bottom-0 left-0 right-0 md:left-60 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl shadow-black/40 pb-[env(safe-area-inset-bottom)]">
          <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {step === 2 ? (
              <>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Turnos en tu reserva</p>
                  <p className="text-sm font-bold text-white truncate">
                    {totalSlotCount === 0
                      ? 'Todavía no seleccionaste horarios'
                      : `${totalSlotCount} ${totalSlotCount === 1 ? 'horario' : 'horarios'} · ${cart.length} ${cart.length === 1 ? 'día' : 'días'}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAddAnotherDay}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl px-3 py-2.5 transition"
                  >
                    <Plus size={16} /> Agregar otro día u horario
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueToCourts}
                    disabled={totalSlotCount === 0}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 font-bold text-base px-5 py-2.5 rounded-2xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
                  >
                    <ArrowRight size={18} />
                    Continuar con {totalSlotCount} {totalSlotCount === 1 ? 'horario' : 'horarios'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total estimado a abonar</p>
                  <p className="text-sm font-bold text-white truncate">
                    {totalSlotCount} {totalSlotCount === 1 ? 'turno' : 'turnos'} · {fmt(estimatedTotalWithService)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-2.5 transition"
                  >
                    <ChevronLeft size={16} /> Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isBatchProcessing}
                    className="inline-flex items-center justify-center gap-2 font-bold text-base px-5 py-2.5 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
                  >
                    {isBatchProcessing ? <RefreshCw size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                    Ir a Pagar
                  </button>
                </div>
              </>
            )}
          </div>
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

function buildCheckoutCuota(items: CartItem[], space: Space): MemberCuota {
  const flat = items.flatMap(({ date, slots }) =>
    slots.map((slot) => ({ date, slot })),
  );
  flat.sort((a, b) =>
    a.date === b.date ? a.slot.startMin - b.slot.startMin : a.date.localeCompare(b.date),
  );

  const total = space.pricePerHour * flat.length;
  const first = flat[0];
  const last = flat[flat.length - 1];
  const baseFirst = new Date(`${first.date}T00:00:00`).getTime();
  const baseLast = new Date(`${last.date}T00:00:00`).getTime();
  const startTime = new Date(baseFirst + first.slot.startMin * 60000).toISOString();
  const endTime = new Date(baseLast + last.slot.endMin * 60000).toISOString();
  const dayCount = new Set(items.map((i) => i.date)).size;

  return {
    id: `booking-${first.date}-${last.date}-${flat.length}`,
    periodo: `Reserva - ${space.name} (${flat.length} ${flat.length === 1 ? 'turno' : 'turnos'} · ${dayCount} ${dayCount === 1 ? 'día' : 'días'})`,
    mesAno: '',
    fechaVencimiento: new Date(startTime).toLocaleDateString('es-AR'),
    baseAmount: total,
    discountPercentage: 0,
    isOverdue: false,
    lateFeeAmount: 0,
    totalAmount: total,
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
