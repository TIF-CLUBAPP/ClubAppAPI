import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Dumbbell, Home, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: Home, match: ['/dashboard', '/'] },
  { to: '/mis-cuotas', label: 'Cuotas', icon: Wallet, match: ['/mis-cuotas', '/pagos'] },
  { to: '/actividades', label: 'Actividades', icon: Dumbbell, match: ['/actividades', '/gestion-actividades'] },
  { to: '/reservas', label: 'Agenda', icon: CalendarDays, match: ['/reservas'] },
];

export default function MobileNavbar() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const path = location.pathname;
  const isActive = (matches: string[]) =>
    matches.some((m) => (m === '/' ? path === '/' : path === m || path.startsWith(`${m}/`)));

  const displayName = user
    ? user.fullName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Usuario'
    : 'Usuario';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 2) || displayName.slice(0, 2).toUpperCase();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/70 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
      <div className="grid grid-cols-5 items-center h-16 px-1 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.match);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] font-semibold ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Perfil */}
        <Link
          to="/cuenta"
          aria-label="Perfil"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
            isActive(['/cuenta']) ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border ${
              isActive(['/cuenta'])
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-800 text-emerald-400 border-slate-700'
            }`}
          >
            {initials || 'US'}
          </span>
          <span className={`text-[10px] font-semibold ${isActive(['/cuenta']) ? 'text-emerald-400' : 'text-slate-500'}`}>
            Perfil
          </span>
        </Link>
      </div>
    </nav>
  );
}
