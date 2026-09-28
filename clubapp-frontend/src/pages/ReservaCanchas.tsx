import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { CheckoutModal } from '../components/cuotas/CheckoutModal';
import { bookingService } from '../services/bookingService';
import type { Booking } from '../types/booking';
import type { MemberCuota } from '../types/cuotas';

interface Court {
  id: string;
  name: string;
  discipline: string;
}

const COURTS: Court[] = [
  { id: 'c1', name: 'Cancha 1 - Polvo', discipline: 'Tenis' },
  { id: 'c2', name: 'Cancha 2 - Rápida', discipline: 'Tenis' },
  { id: 'c3', name: 'Cancha Central', discipline: 'Pádel' },
  { id: 'c4', name: 'Cancha 2 - Cristal', discipline: 'Pádel' },
];

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const TURN_PRICE = 12000;

const fmt = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const toDateInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const pad = (n: number) => String(n).padStart(2, '0');

export default function ReservaCanchas() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<string>(toDateInput(today));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSlot, setCreatingSlot] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [checkoutCuota, setCheckoutCuota] = useState<MemberCuota | null>(null);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookingsByDate(selectedDate);
      setBookings(data);
    } catch (err: any) {
      setToast({ type: 'error', text: err?.response?.data?.detail ?? 'No se pudo consultar la disponibilidad.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedDate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const slots = useMemo(() => {
    const out: { key: string; start: string; end: string }[] = [];
    for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
      out.push({ key: `${pad(h)}:00`, start: `${pad(h)}:00`, end: `${pad(h + 1)}:00` });
    }
    return out;
  }, []);

  const slotDateRange = (slot: { start: string; end: string }) => {
    const start = new Date(`${selectedDate}T${slot.start}:00`);
    const end = new Date(`${selectedDate}T${slot.end}:00`);
    return { start, end };
  };

  const isOccupied = (court: Court, slot: { start: string; end: string }) => {
    const { start, end } = slotDateRange(slot);
    return bookings.some(
      (b) =>
        b.resourceName === court.name &&
        b.status !== 'Cancelled' &&
        new Date(b.startTime) < end &&
        start < new Date(b.endTime),
    );
  };

  const handleSelectSlot = async (court: Court, slot: { key: string; start: string; end: string }) => {
    const { start, end } = slotDateRange(slot);
    setCreatingSlot(`${court.id}-${slot.key}`);
    try {
      const booking = await bookingService.createBooking({
        resourceName: court.name,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        amount: TURN_PRICE,
      });

      setPendingBooking(booking);
      setCheckoutCuota(buildCheckoutCuota(booking, court));
      await load();
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.response?.data?.detail ?? err?.response?.data?.message ?? 'No se pudo reservar el turno.',
      });
      await load();
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
    await load();
  };

  const handleCloseCheckout = async () => {
    setCheckoutCuota(null);
    setPendingBooking(null);
    await load();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Encabezado */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} /> Reserva de Espacios
                </span>
                <h2 className="text-2xl font-black text-white mt-1">Canchas Disponibles</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Seleccioná un turno libre. El pago se procesa al confirmar (precio por turno: {fmt(TURN_PRICE)}).
                </p>
              </div>

              <div className="flex flex-col gap-2 self-start md:self-auto">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                  <Calendar size={12} /> Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={toDateInput(today)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
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

            {/* Grilla de turnos */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-slate-400 gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-sm font-medium">Consultando disponibilidad...</span>
                </div>
              ) : (
                <div className="min-w-[760px]">
                  <div className="grid gap-3 pb-4 border-b border-slate-800" style={{ gridTemplateColumns: `80px repeat(${COURTS.length}, minmax(0, 1fr))` }}>
                    <div className="text-xs font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
                      <Clock size={14} /> Turno
                    </div>
                    {COURTS.map((court) => (
                      <div key={court.id} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-center">
                        <p className="text-xs font-bold text-white truncate">{court.name}</p>
                        <span className="text-[10px] text-emerald-400 font-medium">{court.discipline}</span>
                      </div>
                    ))}
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {slots.map((slot) => (
                      <div
                        key={slot.key}
                        className="grid gap-3 py-2.5 items-center"
                        style={{ gridTemplateColumns: `80px repeat(${COURTS.length}, minmax(0, 1fr))` }}
                      >
                        <div className="text-center">
                          <p className="text-xs font-bold text-white">
                            {slot.start} - {slot.end}
                          </p>
                        </div>

                        {COURTS.map((court) => {
                          const occupied = isOccupied(court, slot);
                          const isCreating = creatingSlot === `${court.id}-${slot.key}`;

                          return (
                            <div key={court.id} className="text-center">
                              {occupied ? (
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/20 text-slate-500 text-xs flex items-center justify-center gap-1.5">
                                  <MapPin size={12} className="text-amber-400 shrink-0" />
                                  <span className="font-medium">Ocupado</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSelectSlot(court, slot)}
                                  disabled={!!creatingSlot}
                                  className="w-full p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                  {isCreating ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 size={12} /> Reservar
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
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

function buildCheckoutCuota(booking: Booking, court: Court): MemberCuota {
  return {
    id: `booking-${booking.id}`,
    idReal: booking.paymentId ?? undefined,
    periodo: `Reserva - ${court.name}`,
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