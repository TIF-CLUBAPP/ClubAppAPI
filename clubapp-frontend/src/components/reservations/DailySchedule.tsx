import { useState, useEffect } from 'react';
import { Calendar, Clock, Filter, Settings, Wrench, CheckCircle2, User } from 'lucide-react';
import type { Court, ClubScheduleConfig, SportDiscipline, Reservation } from '../../types/reservation';
import { useAuth } from '../../context/AuthContext';
import BookingModal from '../dashboard/BookingModal';
import { getReservations, saveReservation } from '../../services/reservationService';
import ConfigModal from './ConfigModal';

const INITIAL_COURTS: Court[] = [
  { id: 'c1', name: 'Cancha 1 - Polvo', discipline: 'Tenis', surface: 'Polvo de Ladrillo' },
  { id: 'c2', name: 'Cancha 2 - Rápida', discipline: 'Tenis', surface: 'Superficie Rápida' },
  { id: 'c3', name: 'Cancha Central', discipline: 'Pádel', surface: 'Césped Sintético' },
  { id: 'c4', name: 'Cancha 2 - Cristal', discipline: 'Pádel', surface: 'Panorámica' },
  { id: 'c5', name: 'Fútbol 7 Principal', discipline: 'Fútbol', surface: 'Sintético 50mm' },
];

export default function DailySchedule() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const [config, setConfig] = useState<ClubScheduleConfig>({
    openTime: '08:00',
    closeTime: '23:00',
    slotDurationMinutes: 60,
    bufferMinutes: 15,
  });

  const [selectedDiscipline, setSelectedDiscipline] = useState<SportDiscipline | 'Todas'>('Todas');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Estado para controlar el turno seleccionado para el modal de reserva
  const [selectedSlot, setSelectedSlot] = useState<{ court: Court; slot: { start: string; end: string } } | null>(null);

  // Cargar reservas
  const refreshReservations = () => {
    setReservations(getReservations());
  };

  useEffect(() => {
    refreshReservations();
  }, [selectedDate]);

  const generateTimeSlots = () => {
    const slots = [];
    const [openH, openM] = config.openTime.split(':').map(Number);
    const [closeH, closeM] = config.closeTime.split(':').map(Number);

    let current = new Date();
    current.setHours(openH, openM, 0, 0);

    const endLimit = new Date();
    endLimit.setHours(closeH, closeM, 0, 0);

    while (current < endLimit) {
      const startStr = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const endTurn = new Date(current.getTime() + config.slotDurationMinutes * 60000);
      const endTurnStr = endTurn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const endBuffer = new Date(endTurn.getTime() + config.bufferMinutes * 60000);

      if (endTurn <= endLimit) {
        slots.push({
          start: startStr,
          end: endTurnStr,
        });
      }

      current = endBuffer;
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const filteredCourts = selectedDiscipline === 'Todas' 
    ? INITIAL_COURTS 
    : INITIAL_COURTS.filter(c => c.discipline === selectedDiscipline);

  const handleBookingSuccess = () => {
    if (!selectedSlot) return;

    // Guardar en el almacenamiento local
    saveReservation({
      courtId: selectedSlot.court.id,
      userEmail: user?.email || 'socio@club.com',
      date: selectedDate,
      startTime: selectedSlot.slot.start,
      endTime: selectedSlot.slot.end,
      bufferEndTime: selectedSlot.slot.end,
    });

    // Actualizar la vista al instante
    refreshReservations();
  };

  return (
    <div className="space-y-6">
      {/* Controles de Filtro y Configuración */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter size={16} className="text-slate-400 shrink-0 mr-1" />
          {(['Todas', 'Tenis', 'Pádel', 'Fútbol'] as const).map((disc) => (
            <button
              key={disc}
              onClick={() => setSelectedDiscipline(disc)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedDiscipline === disc
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {disc}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Calendar size={14} className="text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            />
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-all flex items-center gap-2 text-xs font-semibold"
            >
              <Settings size={16} /> Configurar Horarios
            </button>
          )}
        </div>
      </div>

      {/* Modal Ajustes SuperAdmin */}
      <ConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        config={config}
        onSave={(newConfig) => setConfig(newConfig)}
      />

      {/* Tabla de Horarios */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-6 gap-3 pb-4 border-b border-slate-800 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
              <Clock size={14} /> Turno
            </div>
            {filteredCourts.map((court) => (
              <div key={court.id} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <p className="text-xs font-bold text-white truncate">{court.name}</p>
                <span className="text-[10px] text-emerald-400 font-medium">{court.discipline}</span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-800/60">
            {timeSlots.map((slot, index) => (
              <div key={index} className="grid grid-cols-6 gap-3 py-3 items-center">
                <div className="text-center">
                  <p className="text-xs font-bold text-white">{slot.start} - {slot.end}</p>
                  <span className="text-[9px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                    <Wrench size={10} className="text-amber-400" /> +{config.bufferMinutes}m buffer
                  </span>
                </div>

                {filteredCourts.map((court) => {
                  const existingRes = reservations.find(
                    r => r.courtId === court.id && r.date === selectedDate && r.startTime === slot.start && r.status === 'confirmed'
                  );

                  return (
                    <div key={court.id} className="text-center">
                      {existingRes ? (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/20 text-slate-400 text-xs flex items-center justify-between px-3">
                          <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1 truncate" title={existingRes.userEmail}>
                            <User size={12} className="text-amber-400 shrink-0" /> {existingRes.userEmail.split('@')[0]}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedSlot({ court, slot })}
                          className="w-full p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Reservar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup / Modal de Confirmación de Reserva */}
      {selectedSlot && (
        <BookingModal
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          zoneName={`${selectedSlot.court.name} (${selectedSlot.slot.start} hs)`}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}