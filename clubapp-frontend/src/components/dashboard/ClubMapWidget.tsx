import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Info, Sparkles, Clock } from 'lucide-react';
import BookingModal from './BookingModal';

interface Zone {
  id: string;
  name: string;
  category: string;
  status: 'available' | 'occupied' | 'maintenance';
  capacity: string;
  nextAvailable?: string;
}

const ZONES: Zone[] = [
  { id: '1', name: 'Cancha de Tenis 1', category: 'Polvo de Ladrillo', status: 'occupied', capacity: '2/4 Jugadores', nextAvailable: '18:00 hs' },
  { id: '2', name: 'Cancha de Tenis 2', category: 'Superficie Rápida', status: 'available', capacity: 'Disponible', nextAvailable: 'Ahora' },
  { id: '3', name: 'Cancha de Fútbol 7', category: 'Césped Sintético', status: 'occupied', capacity: '14/14 Jugadores', nextAvailable: '20:00 hs' },
  { id: '4', name: 'Gimnasio Principal', category: 'Musculación & Cardio', status: 'available', capacity: '45% Ocupación', nextAvailable: 'Abierto' },
  { id: '5', name: 'Pileta Climatizada', category: 'Natatorio Semi-Olímpico', status: 'maintenance', capacity: 'Cerrado temporalmente', nextAvailable: 'Mañana 08:00' },
];

export default function ClubMapWidget() {
  const [selectedZone, setSelectedZone] = useState<Zone | undefined>(ZONES[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadge = (status: Zone['status']) => {
    switch (status) {
      case 'available':
        return { label: 'Disponible', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', dot: 'bg-emerald-400' };
      case 'occupied':
        return { label: 'En Uso', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', dot: 'bg-amber-400' };
      case 'maintenance':
        return { label: 'Mantenimiento', bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', dot: 'bg-rose-400' };
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MapPin size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Sectores del Club <Sparkles size={16} className="text-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">Estado de instalaciones en tiempo real</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> 2 Libres
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> 2 En Uso
          </span>
        </div>
      </div>

      {/* Grid del Mapa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {ZONES.map((zone) => {
            const config = getStatusBadge(zone.status);
            const isSelected = selectedZone?.id === zone.id;

            return (
              <motion.button
                key={zone.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedZone(zone)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500/50 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-slate-400 font-medium">{zone.category}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">{zone.name}</h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${config.bg}`}>
                    {zone.capacity}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Panel lateral con detalle */}
        <AnimatePresence mode="wait">
          {selectedZone && (
            <motion.div
              key={selectedZone.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Detalle del Sector</span>
                  <Info size={16} className="text-slate-500" />
                </div>
                <h4 className="font-bold text-white text-base">{selectedZone.name}</h4>
                <p className="text-xs text-slate-400 mb-4">{selectedZone.category}</p>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                    <span className="text-slate-400">Estado</span>
                    <span className={`px-2 py-0.5 rounded border ${getStatusBadge(selectedZone.status).bg} font-medium`}>
                      {getStatusBadge(selectedZone.status).label}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Users size={14} /> Capacidad
                    </span>
                    <span className="text-white font-medium">{selectedZone.capacity}</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock size={14} /> Próx. Turno
                    </span>
                    <span className="text-white font-medium">{selectedZone.nextAvailable}</span>
                  </div>
                </div>
              </div>

              {/* Botón que dispara el modal */}
              <button
                disabled={selectedZone.status === 'maintenance'}
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-4 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedZone.status === 'maintenance' ? 'No disponible' : 'Reservar o Agendar'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Reserva */}
      <BookingModal
        zone={selectedZone}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}