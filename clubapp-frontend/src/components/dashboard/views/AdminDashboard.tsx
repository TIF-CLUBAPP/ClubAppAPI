import { useState } from 'react';
import WeatherWidget from '../WeatherWidget';
import { Users, CheckSquare, Clock, MapPin, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const [attended, setAttended] = useState<Record<string, boolean>>({});

  const toggleAttendance = (id: string) => {
    setAttended(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Clases Asignadas */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-emerald-400" /> Mis Clases de Hoy
              </h3>
              <p className="text-xs text-slate-400">Gestión de entrenamientos y alumnos asignados</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              2 Clases Hoy
            </span>
          </div>

          <div className="space-y-4">
            {/* Clase 1 */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-900">
                <div>
                  <h4 className="font-extrabold text-white text-base">Escuelita de Tenis - Nivel Avanzado</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Clock size={14} className="text-emerald-400" /> 17:00 a 18:30 hs</span>
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-emerald-400" /> Cancha 1 y 2</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 self-start sm:self-auto">
                  12 Alumnos Inscriptos
                </span>
              </div>

              {/* Lista Rápida de Asistencia */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tomar Asistencia Rápidamente:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Lucas González', 'Mateo Rossi', 'Sofía Benítez', 'Valentina Paz'].map((student, idx) => {
                    const isChecked = !!attended[`c1-${idx}`];
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleAttendance(`c1-${idx}`)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{student}</span>
                        {isChecked ? <CheckCircle2 size={16} /> : <CheckSquare size={16} className="text-slate-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral: Clima */}
        <div className="lg:col-span-4">
          <WeatherWidget />
        </div>
      </div>
    </div>
  );
}