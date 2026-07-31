import React from 'react';
import { Sun, CloudRain, Wind, Thermometer, ShieldCheck } from 'lucide-react';

export default function WeatherWidget() {
  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
      {/* Resplandor decorativo */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between relative z-10 mb-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Sun size={14} /> Clima Deportivo
          </span>
          <h3 className="text-2xl font-black text-white mt-1">24°C</h3>
          <p className="text-xs text-slate-400">Soleado, Buenos Aires</p>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
          <Sun size={28} />
        </div>
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-2 gap-2 my-2 relative z-10 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
          <Wind size={14} className="text-slate-500" />
          <span>Viento: 12 km/h</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
          <CloudRain size={14} className="text-slate-500" />
          <span>Lluvia: 0%</span>
        </div>
      </div>

      {/* Badge de recomendación UX */}
      <div className="mt-2 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-emerald-400 font-medium relative z-10">
        <ShieldCheck size={16} className="shrink-0" />
        <span>Ideal para actividades al aire libre (Tenis/Fútbol)</span>
      </div>
    </div>
  );
}