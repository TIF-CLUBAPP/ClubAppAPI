import React from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import { 
  Activity, 
  Calendar, 
  CreditCard, 
  Users, 
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = user?.role || 'MEMBER';

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

          {role === 'SUPERADMIN' && (
            <Link 
              to="/pagos" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <CreditCard size={18} /> Pagos & Cuotas
            </Link>
          )}

          {(role === 'ADMIN' || role === 'SUPERADMIN') && (
            <Link 
              to="/socios" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <Users size={18} /> Socios & Alumnos
            </Link>
          )}
        </nav>
      </div>

      {/* Tarjeta Perfil & Logout */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
            {user?.email?.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
            <span className="inline-block text-[10px] font-bold text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
              {role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all"
        >
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}