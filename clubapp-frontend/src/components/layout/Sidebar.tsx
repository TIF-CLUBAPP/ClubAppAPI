import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import { 
  Activity, 
  Calendar, 
  Users, 
  AlertTriangle,
  DollarSign,
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role ?? 'GUEST';
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Invitado' : 'Invitado';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word: string) => word[0].toUpperCase())
    .join('')
    .slice(0, 2) || displayName.slice(0, 2).toUpperCase();

  const roleBadge =
    role === 'SUPERADMIN' || role === 'ADMIN'
      ? {
          label: 'ADMINISTRADOR',
          badgeClasses: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        }
      : role === 'TEACHER'
      ? {
          label: 'PROFESOR',
          badgeClasses: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
        }
      : {
          label: 'MIEMBRO',
          badgeClasses: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
        };

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between hidden md:flex shrink-0 h-screen sticky top-0">
      <div>
        {/* Logo ClubApp */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
            C
          </div>
          <div>
            <h1 className="font-extrabold text-white leading-none">ClubApp</h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Gestión Deportiva</span>
          </div>
        </div>

        {/* Menú de Navegación con Links de React Router */}
        <nav className="space-y-1 text-sm font-medium">
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              location.pathname === '/dashboard'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity size={18} /> Dashboard
          </Link>

          <Link 
            to="/reservas" 
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              location.pathname === '/reservas'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Calendar size={18} /> Reservas & Agenda
          </Link>

          {(role === 'ADMIN' || role === 'SUPERADMIN') && (
            <Link 
              to="/pagos" 
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                location.pathname === '/pagos'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <DollarSign size={18} /> Pagos & Cuotas
            </Link>
          )}

          {role === 'SUPERADMIN' && (
            <Link
              to="/deudores"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                location.pathname === '/deudores'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <AlertTriangle size={18} /> Deudores & Cuotas
            </Link>
          )}

          {(role === 'ADMIN' || role === 'SUPERADMIN') && (
            <Link 
              to="/socios" 
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                location.pathname === '/socios'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users size={18} /> Socios
            </Link>
          )}
        </nav>
      </div>

      {/* Tarjeta Perfil & Logout */}
      <div className="pt-4 border-t border-slate-800/80">
        {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 px-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                  {initials || 'US'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadge.badgeClasses}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all"
              >
                <LogOut size={14} /> Cerrar Sesión
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 text-sm font-semibold rounded-xl border border-slate-700 text-slate-100 hover:border-emerald-500 hover:text-white transition-all"
              >
                Registrarme
              </button>
            </div>
          )}
        </div>
    </aside>
  );
}