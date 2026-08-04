import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Filter, Settings, Wrench, CheckCircle2, User } from 'lucide-react';
import type { Court, ClubScheduleConfig, SportDiscipline } from '../../types/reservation';
import { useAuth } from '../../context/AuthContext';
import BookingModal from '../dashboard/BookingModal'; 

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

  // Estado para controlar el modal de reserva seleccionado
  const [selectedSlot, setSelectedSlot] = useState<{ court: Court; slot: { start: string; end: string } } | null>(null);

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
              onClick={() => setShowConfigModal(!showConfigModal)}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-all flex items-center gap-2 text-xs font-semibold"
            >
              <Settings size={16} /> Configurar Horarios
            </button>
          )}
        </div>
      </div>

      {/* Modal Ajustes SuperAdmin */}
      {showConfigModal && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings size={16} className="text-emerald-400" /> Horarios Operativos del Club
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Apertura</label>
              <input
                type="time"
                value={config.openTime}
                onChange={(e) => setConfig({ ...config, openTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Cierre</label>
              <input
                type="time"
                value={config.closeTime}
                onChange={(e) => setConfig({ ...config, closeTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Intervalo Mantenimiento</label>
              <select
                value={config.bufferMinutes}
                onChange={(e) => setConfig({ ...config, bufferMinutes: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

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

                {filteredCourts.map((court, cIdx) => {
                  const isReserved = (index + cIdx) % 3 === 0;

                  return (
                    <div key={court.id} className="text-center">
                      {isReserved ? (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/20 text-slate-400 text-xs flex items-center justify-between px-3">
                          <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                            <User size={12} className="text-amber-400" /> Reservado
                          </span>
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
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
        />
      )}
    </div>
  );
}