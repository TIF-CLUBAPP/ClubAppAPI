import React from 'react';
import { useAuth } from '../context/AuthContext';
import ClubMapWidget from '../components/dashboard/ClubMapWidget';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import { 
  User, 
  LogOut, 
  Shield, 
  CreditCard, 
  Calendar, 
  Users, 
  CheckSquare, 
  TrendingUp, 
  Bell,
  Award,
  Activity
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();

  // El rol viene de JWT (MEMBER, ADMIN, SUPERADMIN)
  const role = user?.role || 'MEMBER';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. SIDEBAR PERSISTENTE (Desktop) */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between hidden md:flex">
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

          {/* Menú de Navegación */}
          <nav className="space-y-1 text-sm font-medium">
            <a href="#home" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity size={18} /> Dashboard
            </a>
            <a href="#activities" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
              <Calendar size={18} /> Reservas & Agenda
            </a>
            {role === 'SUPERADMIN' && (
              <a href="#finances" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
                <CreditCard size={18} /> Pagos & Cuotas
              </a>
            )}
            {(role === 'ADMIN' || role === 'SUPERADMIN') && (
              <a href="#users" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
                <Users size={18} /> Socios & Alumnos
              </a>
            )}
          </nav>
        </div>

        {/* Tarjeta de Perfil & Logout */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
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

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* HEADER TOP */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white">¡Hola de nuevo! 👋</h2>
            <p className="text-xs text-slate-400 mt-1">Bienvenido al panel principal de ClubApp</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          </div>
        </header>

        {/* 3. BENTO GRID SYSTEM (Top Widgets) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-8">
            <ClubMapWidget />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <WeatherWidget />
            {/* Widget Informativo Extra */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex-1 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                <Award size={16} /> Estado de Instalaciones
              </div>
              <p className="text-sm text-slate-300 my-2">
                Todas las canchas cuentan con iluminación LED apta para turnos nocturnos hasta las 23:00 hs.
              </p>
              <span className="text-xs text-slate-500">ClubApp v2.0 • 2026</span>
            </div>
          </div>
        </div>

        {/* 4. VISTA CONDICIONAL SEGÚN ROL */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          
          {/* A. VISTA SOCIO (MEMBER) */}
          {role === 'MEMBER' && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="text-emerald-400" size={20} /> Mi Membresía & Cuota
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Estado de Cuota</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">Al Día (Activa)</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Vencimiento</span>
                  <p className="text-base font-bold text-white mt-1">15 de Agosto</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400">Próximo Turno</span>
                    <p className="text-base font-bold text-white mt-1">Tenis 1 • 19:00 hs</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. VISTA PROFESOR / ENTRENADOR (ADMIN) */}
          {role === 'ADMIN' && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="text-emerald-400" size={20} /> Mis Clases de Hoy (Profesor)
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">Escuelita de Tenis - Menores</h4>
                    <p className="text-xs text-slate-400">Cancha 1 • 17:00 a 18:30 hs</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20">
                    Tomar Asistencia (12 alumnos)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* C. VISTA ADMINISTRATIVO (SUPERADMIN) */}
          {role === 'SUPERADMIN' && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-emerald-400" size={20} /> Métricas de Gestión (SuperAdmin)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Socios Activos</span>
                  <p className="text-2xl font-black text-white mt-1">1,240</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Cobros este mes</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">$4,850,000</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Cuotas por vencer (3 días)</span>
                  <p className="text-2xl font-black text-amber-400 mt-1">18 Socios</p>
                </div>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}