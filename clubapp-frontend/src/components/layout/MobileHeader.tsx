import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ChevronDown,
  ClipboardCheck,
  DollarSign,
  Dumbbell,
  Loader2,
  LogOut,
  Map,
  MapPin,
  Search,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { BasketballBall, FootballBall, PadelBall, TennisBall, VolleyballBall } from './SportBalls';
import type { SportBallIcon } from './SportBalls';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { friendService } from '../../services/friendService';
import type { FriendSearchResult } from '../../types/friend';

// Deportes disponibles para el ícono estático del header móvil.
// Se elige uno solo una vez por sesión (sessionStorage) y se mantiene fijo e inmóvil.
const SPORT_KEY = 'mobile-header-sport';

interface SportOption {
  key: string;
  label: string;
  icon: SportBallIcon;
}

const SPORTS: SportOption[] = [
  { key: 'futbol', label: 'Fútbol', icon: FootballBall },
  { key: 'tenis', label: 'Tenis', icon: TennisBall },
  { key: 'basquet', label: 'Básquet', icon: BasketballBall },
  { key: 'padel', label: 'Pádel', icon: PadelBall },
  { key: 'voley', label: 'Vóley', icon: VolleyballBall },
];

function pickSportIndex(): number {
  try {
    const stored = window.sessionStorage.getItem(SPORT_KEY);
    if (stored !== null) {
      const index = Number(stored);
      if (Number.isInteger(index) && index >= 0 && index < SPORTS.length) return index;
    }
    const index = Math.floor(Math.random() * SPORTS.length);
    window.sessionStorage.setItem(SPORT_KEY, String(index));
    return index;
  } catch {
    return Math.floor(Math.random() * SPORTS.length);
  }
}

interface MenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
}

const initialsOf = (u: { fullName?: string; firstName?: string; lastName?: string; email?: string }): string => {
  const base = (u.fullName || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || '?').trim();
  const parts = base.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
};

export default function MobileHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role ?? 'GUEST';

  const [sportIndex] = useState(pickSportIndex);
  const sport = SPORTS[sportIndex];
  const SportIcon = sport.icon;

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const rootRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  }, [location.pathname]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const found = await friendService.search(q);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  if (!isAuthenticated) return null;

  const isStaff = role === 'TEACHER' || role === 'ADMIN' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
  const isSuper = role === 'SUPERADMIN';

  const menuItems: MenuItem[] = [
    { to: '/canchas', label: 'Reservar Cancha', icon: MapPin, show: true },
    { to: '/pagos', label: 'Pagos & Cuotas', icon: DollarSign, show: isAdmin },
    { to: '/asistencia', label: 'Asistencia', icon: ClipboardCheck, show: isStaff },
    { to: '/gestion-actividades', label: 'Gestión de Actividades', icon: Dumbbell, show: isStaff },
    { to: '/deudores', label: 'Deudores & Cuotas', icon: AlertTriangle, show: isSuper },
    { to: '/espacios', label: 'Espacios & Canchas', icon: Map, show: isAdmin },
    { to: '/socios', label: 'Socios', icon: Users, show: isAdmin },
    { to: '/cuenta', label: 'Mi Cuenta', icon: UserCircle2, show: true },
  ];

  const goToMember = (r: FriendSearchResult) => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    navigate(`/socios/${r.user.id}`, { state: { member: r.user } });
  };

  return (
    <header
      ref={rootRef}
      className="md:hidden fixed top-0 inset-x-0 z-40 bg-slate-950/85 backdrop-blur-lg border-b border-slate-800/70"
    >
      <div className="h-14 grid grid-cols-3 items-center px-3">
        <button
          type="button"
          onClick={() => navigate('/reservar-cancha')}
          aria-label="Reservar Cancha"
          title={`Reservar Cancha · ${sport.label}`}
          className="justify-self-start w-9 h-9 rounded-full bg-linear-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center active:scale-90 transition-transform"
        >
          <SportIcon size={20} />
        </button>
        <div className="relative justify-self-center">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setSearchOpen(false);
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1 text-white font-extrabold tracking-tight text-lg"
          >
            ClubApp
            <ChevronDown size={15} className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Menú</p>
              </div>
              <nav className="p-1.5">
                {menuItems
                  .filter((m) => m.show)
                  .map((m) => {
                    const Icon = m.icon;
                    const active = location.pathname === m.to || location.pathname.startsWith(`${m.to}/`);
                    return (
                      <Link
                        key={m.to}
                        to={m.to}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                          active
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <Icon size={16} /> {m.label}
                      </Link>
                    );
                  })}
              </nav>
              <div className="p-1.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="justify-self-end flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
            aria-label="Buscar"
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <NotificationDropdown />
        </div>
      </div>

      {searchOpen && (
        <div className="absolute top-full inset-x-0 border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-xl z-50">
          <div className="px-3 py-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar socios…"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                  }}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {query.trim() && (
              <div className="mt-2 max-h-72 overflow-y-auto scrollbar-thin">
                {searching && (
                  <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
                    <Loader2 size={14} className="animate-spin" /> Buscando…
                  </div>
                )}
                {!searching && results.length === 0 && (
                  <p className="px-3 py-3 text-xs text-slate-500">No se encontraron socios.</p>
                )}
                {results.map((r) => (
                  <button
                    key={r.user.id}
                    type="button"
                    onClick={() => goToMember(r)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-[11px] shrink-0">
                      {initialsOf(r.user)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-100 font-medium truncate">
                        {r.user.fullName || `${r.user.firstName} ${r.user.lastName}`.trim() || r.user.email}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{r.user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
