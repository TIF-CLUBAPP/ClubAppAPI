import ClubMapWidget from '../ClubMapWidget';
import WeatherWidget from '../WeatherWidget';
import { CreditCard, CalendarCheck, ArrowRight, Building, UserPlus, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardService } from '../../../services/dashboardService';
import { useNavigate } from 'react-router-dom';
import type { DashboardDto } from '../../../types/dashboard';
import MembershipModal from '../MembershipModal';

export default function MemberDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMembership, setShowMembership] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboard();
      setDashboardData(data);
    } catch {
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <span className="text-sm font-medium">Verificando estado...</span>
      </div>
    );
  }

  if (!dashboardData || dashboardData.hasClub === false) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-500/30 bg-linear-to-br from-slate-900 to-emerald-950/40 p-8 md:p-10 text-center relative overflow-hidden shadow-2xl">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-inner">
            <Building size={36} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Aún no estás asociado a ningún Club
          </h2>
          <p className="mt-3 text-slate-300 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Para comenzar a disfrutar de nuestras instalaciones, actividades y servicios exclusivos, por favor elige una de las siguientes opciones:
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setShowMembership(true)}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg flex items-center gap-2"
            >
              <CreditCard size={18} /> Suscribirme al Club
            </button>
            <button
              onClick={() => navigate('/actividades')}
              className="px-6 py-3.5 rounded-2xl border border-slate-700 bg-slate-950 hover:border-emerald-500 text-white font-bold text-sm transition-all flex items-center gap-2"
            >
              <UserPlus size={18} /> Inscribirme a Actividades
            </button>
            <button
              onClick={() => navigate('/reservar-cancha')}
              className="px-6 py-3.5 rounded-2xl border border-slate-700 bg-slate-950 hover:border-emerald-500 text-white font-bold text-sm transition-all flex items-center gap-2"
            >
              <Zap size={18} /> Alquilar Espacio / Cancha
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8"><ClubMapWidget /></div>
          <div className="lg:col-span-4"><WeatherWidget /></div>
        </div>

        <MembershipModal open={showMembership} onClose={() => setShowMembership(false)} />
      </div>
    );
  }

  const { membershipSummary } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8"><ClubMapWidget /></div>
        <div className="lg:col-span-4 space-y-6">
          <WeatherWidget />
          {membershipSummary?.hasActiveMembership && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={16} className="text-emerald-400" /> Mi Membresía
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  {membershipSummary.status}
                </span>
              </div>
              <p className="text-2xl font-black text-white">
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(membershipSummary.amount)}
                <span className="text-xs font-normal text-slate-400"> / mes</span>
              </p>
              {membershipSummary.nextDueDate && (
                <p className="text-xs text-slate-400 mt-1">
                  Próximo vencimiento: <strong className="text-white">{new Date(membershipSummary.nextDueDate).toLocaleDateString()}</strong>
                </p>
              )}
              <button 
                onClick={() => navigate('/mis-cuotas')}
                className="w-full mt-4 py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                Ver Historial de Pagos <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <CalendarCheck size={18} className="text-emerald-400" /> Mis Próximos Turnos Reservados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardData.upcomingReservations.length > 0 ? (
            dashboardData.upcomingReservations.map((res: any) => (
              <div key={res.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">{new Date(res.date).toLocaleDateString()}</span>
                  <h4 className="font-bold text-white text-sm mt-0.5">{res.description}</h4>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">Confirmado</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No tienes próximas reservas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
