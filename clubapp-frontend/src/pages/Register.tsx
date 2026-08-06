import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-sky-500/10 text-sky-300 border border-sky-500/20 mb-3">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Crea tu cuenta ClubApp</h2>
          <p className="text-slate-400 text-sm mt-1">Próximamente podrás registrarte y empezar a gestionar tu club.</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 text-center">
            <p className="text-sm text-slate-300">Por ahora el registro se encuentra disponible solo desde el panel administrativo. Si ya tenés una cuenta, iniciá sesión para continuar.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold transition-all hover:from-emerald-400 hover:to-teal-400"
          >
            Volver a Iniciar Sesión
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 rounded-2xl border border-slate-700 text-slate-100 font-semibold transition-all hover:border-emerald-500 hover:text-emerald-300"
          >
            <ArrowLeft size={16} className="inline-block mr-2" /> Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
