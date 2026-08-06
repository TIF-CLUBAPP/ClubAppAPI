import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getReservations, cancelReservation } from '../services/reservationService';
import type { Reservation } from '../types/reservation';

export default function Reservations() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled'>('active');

  // Cargar reservas del almacenamiento
  const loadData = () => {
    const all = getReservations();
    // Si es superadmin ve todas, si es socio ve solo las suyas
    if (isSuperAdmin) {
      setReservations(all);
    } else {
      setReservations(all.filter((r) => r.userEmail === user?.email));
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Cancelar reserva
  const handleCancel = (id: string) => {
    if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      cancelReservation(id);
      loadData();
    }
  };

  // Filtrado de lista
  const filteredReservations = reservations.filter((r) => {
    if (filter === 'active') return r.status === 'confirmed';
    if (filter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} /> Tu Historial
          </span>
          <h2 className="text-2xl font-black text-white mt-1">Mis Reservas</h2>
          <p className="text-xs text-slate-400">
            {isSuperAdmin
              ? 'Administrá todas las reservas registradas en el club.'
              : 'Consultá y gestioná tus turnos activos y pasados.'}
          </p>
        </div>

        {/* Botones de Filtro */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'active'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'cancelled'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Canceladas
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Lista de Reservas */}
      {filteredReservations.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
          <div className="inline-flex p-4 rounded-full bg-slate-950 text-slate-500 border border-slate-800">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-bold text-white">No se encontraron reservas</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {filter === 'active'
              ? 'No tenés ningún turno activo asignado en este momento.'
              : 'No hay registros en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredReservations.map((res) => {
              const isConfirmed = res.status === 'confirmed';

              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative bg-slate-900 border ${
                    isConfirmed ? 'border-slate-800 hover:border-emerald-500/40' : 'border-rose-950/40 opacity-75'
                  } rounded-3xl p-6 shadow-xl space-y-4 transition-all`}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isConfirmed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isConfirmed ? (
                        <>
                          <CheckCircle2 size={12} /> Confirmada
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} /> Cancelada
                        </>
                      )}
                    </span>

                    {isSuperAdmin && (
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={res.userEmail}>
                        {res.userEmail}
                      </span>
                    )}
                  </div>

                  {/* Info Cancha / Turno */}
                  <div>
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <MapPin size={16} className="text-emerald-400 shrink-0" />
                      Cancha #{res.courtId}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Calendar size={13} className="text-slate-500" /> {res.date}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <Clock size={13} className="text-slate-500" /> {res.startTime} - {res.endTime} hs
                    </p>
                  </div>

                  {/* Acciones */}
                  {isConfirmed && (
                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        onClick={() => handleCancel(res.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <Trash2 size={14} /> Cancelar Reserva
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}