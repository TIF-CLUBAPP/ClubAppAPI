import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export interface Zone {
  id: string;
  name: string;
  category: string;
  status: 'available' | 'occupied' | 'maintenance';
  capacity: string;
}

interface BookingModalProps {
  zoneName?: string;
  zone?: Zone | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (bookingData: { date: string; slot: string }) => void; // 👈 Callback de éxito
}

const TIME_SLOTS = [
  { id: '1', time: '16:00 - 17:00 hs', available: true },
  { id: '2', time: '17:00 - 18:00 hs', available: false },
  { id: '3', time: '18:00 - 19:00 hs', available: true },
  { id: '4', time: '19:00 - 20:00 hs', available: true },
  { id: '5', time: '20:00 - 21:00 hs', available: false },
  { id: '6', time: '21:00 - 22:00 hs', available: true },
];

export default function BookingModal({ zone, zoneName, isOpen, onClose, onSuccess }: BookingModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  // Toma zoneName si viene de DailySchedule, o zone.name si viene de Dashboard
  const title = zoneName || zone?.name || 'Reserva de Cancha';
  const category = zone?.category || 'Instalaciones del Club';

  const handleBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setLoading(true);

    // Simulación de guardado
    setTimeout(() => {
      setLoading(false);
      setConfirmed(true);

      // Notificamos al componente padre que la reserva fue exitosa
      if (onSuccess) {
        onSuccess({ date, slot: selectedSlot });
      }
    }, 1200);
  };

  const handleClose = () => {
    setConfirmed(false);
    setSelectedSlot(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
        >
          {/* Botón Cerrar */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-all"
          >
            <X size={18} />
          </button>

          {!confirmed ? (
            <div>
              {/* Encabezado */}
              <div className="mb-6">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} /> Nueva Reserva
                </span>
                <h3 className="text-2xl font-black text-white mt-1">{title}</h3>
                <p className="text-xs text-slate-400">{category}</p>
              </div>

              <form onSubmit={handleBooking} className="space-y-5">
                {/* Seleccionar Fecha */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-400" /> Fecha
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                  />
                </div>

                {/* Seleccionar Turno */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-400" /> Turno Disponible
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`p-3 rounded-xl border text-xs font-medium transition-all text-left flex items-center justify-between ${
                          !slot.available
                            ? 'bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed'
                            : selectedSlot === slot.time
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-sm shadow-emerald-500/20'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{slot.time}</span>
                        {!slot.available && <span className="text-[10px] text-rose-500 font-semibold">Ocupado</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botón Confirmar */}
                <motion.button
                  type="submit"
                  disabled={!selectedSlot || loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <span>Confirmar Reserva</span>
                  )}
                </motion.button>
              </form>
            </div>
          ) : (
            /* Estado Confirmado */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-black text-white">¡Reserva Confirmada!</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Reservaste <strong>{title}</strong> para el día <strong>{date}</strong> en el turno de <strong>{selectedSlot}</strong>.
              </p>
              <button
                onClick={handleClose}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all mt-4"
              >
                Volver
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}