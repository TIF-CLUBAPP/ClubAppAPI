import ClubMapWidget from '../ClubMapWidget';
import WeatherWidget from '../WeatherWidget';
import { CreditCard, CalendarCheck, ArrowRight } from 'lucide-react';

export default function MemberDashboard() {
  return (
    <div className="space-y-6">
      {/* Bento Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ClubMapWidget />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <WeatherWidget />

          {/* Tarjeta de Estado de Cuota */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={16} className="text-emerald-400" /> Mi Membresía
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                AL DÍA
              </span>
            </div>
            <p className="text-2xl font-black text-white">$ 12.500 <span className="text-xs font-normal text-slate-400">/ mes</span></p>
            <p className="text-xs text-slate-400 mt-1">Próximo vencimiento: <strong className="text-white">15 de Agosto</strong></p>
            
            <button className="w-full mt-4 py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2">
              Ver Historial de Pagos <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Próximas Reservas del Socio */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <CalendarCheck size={18} className="text-emerald-400" /> Mis Próximos Turnos Reservados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Hoy • 19:00 hs</span>
              <h4 className="font-bold text-white text-sm mt-0.5">Cancha de Tenis 1</h4>
              <p className="text-xs text-slate-400">Polvo de Ladrillo</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              Confirmado
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase">Sábado • 16:00 hs</span>
              <h4 className="font-bold text-white text-sm mt-0.5">Cancha de Fútbol 7</h4>
              <p className="text-xs text-slate-400">Césped Sintético</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
              Pendiente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}