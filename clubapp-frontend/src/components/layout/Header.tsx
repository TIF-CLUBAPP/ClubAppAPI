import { useAuth } from '../../context/AuthContext';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import FriendSearch from './FriendSearch';
import NotificationDropdown from './NotificationDropdown';

const greetings = [
  '¡Hola de nuevo! 👋',
  '¡Qué bueno verte por acá! 👋',
  '¡Excelente día para un partido! 🎾',
  '¡Listo para otra jornada deportiva! 💪',
];

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Usuario' : 'Usuario';
  
  const randomGreeting = useMemo(() => {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, []); // Solo se calcula al montar

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  
  const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/': 'Dashboard',
    '/reservas': 'Reservas & Agenda',
    '/reservar-cancha': 'Reservar Cancha',
    '/actividades': 'Actividades',
    '/gestion-actividades': 'Gestión de Actividades',
    '/mis-cuotas': 'Mis Cuotas',
    '/pagos': 'Pagos & Cuotas',
    '/deudores': 'Deudores & Cuotas',
    '/espacios': 'Espacios & Canchas',
    '/socios': 'Socios',
    '/asistencia': 'Asistencia',
    '/cuenta': 'Mi Cuenta'
  };
  
  const pageTitle = pageTitles[location.pathname] || '';

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-6 md:px-8 flex items-center justify-between gap-4 shrink-0 relative z-10">
      <div className="flex-1 min-w-0">
        <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2 truncate">
          {isDashboard ? randomGreeting : pageTitle}
        </h2>
        <p className="text-xs text-slate-400 hidden sm:block">
          Bienvenido, <strong className="text-slate-200">{displayName}</strong>
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <FriendSearch />
        {/* Centro de Notificaciones */}
        <NotificationDropdown />
      </div>
    </header>
  );
}