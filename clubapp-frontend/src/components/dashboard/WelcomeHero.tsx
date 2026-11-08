import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export default function WelcomeHero() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950">
      {/* Background neon elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-xl p-8 md:p-12 rounded-3xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] text-center flex flex-col items-center">
        
        {/* Subtle Brand Tag */}
        <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-inner mb-6">
          ClubApp Platform
        </span>

        {/* Institutional Title */}
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Gestión Integral <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
            de tu Club
          </span>
        </h1>

        {/* Attractive Brief Description */}
        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mb-8">
          Accede a tu panel para gestionar reservas de canchas, inscripciones a actividades, membresías y eventos en un solo lugar.
        </p>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_-2px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5"
          >
            <LogIn size={18} />
            Iniciar Sesión
          </button>

          <button
            type="button"
            onClick={() => navigate('/register')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-slate-700 bg-slate-950/80 hover:border-emerald-500/50 hover:bg-slate-900 text-white font-bold text-sm transition-all shadow-lg transform hover:-translate-y-0.5"
          >
            <UserPlus size={18} className="text-emerald-400" />
            Crear Cuenta / Registrarme
          </button>
        </div>

      </div>
    </div>
  );
}

