import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Clock, Timer, DollarSign, Save, Sparkles } from 'lucide-react';
import type { ClubScheduleConfig } from '../../types/reservation';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClubScheduleConfig;
  onSave: (newConfig: ClubScheduleConfig) => void;
}

export default function ConfigModal({ isOpen, onClose, config, onSave }: ConfigModalProps) {
  const [formData, setFormData] = useState<ClubScheduleConfig>(config);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
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
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-all"
          >
            <X size={18} />
          </button>

          {/* Encabezado */}
          <div className="mb-6">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> Panel de Administración
            </span>
            <h3 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Settings className="text-emerald-400" size={24} /> Configurar Horarios
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ajustá la grilla operativa y la duración de los bloques de reserva.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Horarios Apertura / Cierre */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-400" /> Apertura
                </label>
                <input
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-rose-400" /> Cierre
                </label>
                <input
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Duración de Turno y Buffer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Timer size={14} className="text-emerald-400" /> Duración Turno
                </label>
                <select
                  value={formData.slotDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, slotDurationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                >
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos (1 hs)</option>
                  <option value={90}>90 minutos (1.5 hs)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Timer size={14} className="text-amber-400" /> Buffer / Limpieza
                </label>
                <select
                  value={formData.bufferMinutes}
                  onChange={(e) => setFormData({ ...formData, bufferMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                >
                  <option value={0}>Sin descanso (0 min)</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                </select>
              </div>
            </div>

            {/* Tarifa Base */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-400" /> Precio Base por Turno ($)
              </label>
              <input
                type="number"
                placeholder="Ej: 12000"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
              />
            </div>

            {/* Botón Guardar */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3.5 px-4 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-6 ${
                saved
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20'
              }`}
            >
              <Save size={18} />
              <span>{saved ? '¡Configuración Guardada!' : 'Guardar Cambios'}</span>
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}