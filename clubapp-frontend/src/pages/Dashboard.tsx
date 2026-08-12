import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import WeatherWidget from '../components/dashboard/WeatherWidget';

// Vistas modulares por Rol
import SuperAdminDashboard from '../components/dashboard/views/SuperAdminDashboard';
import AdminDashboard from '../components/dashboard/views/AdminDashboard';
import MemberDashboard from '../components/dashboard/views/MemberDashboard';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Obtenemos el rol desde el AuthContext (MEMBER, ADMIN, SUPERADMIN)
  const role = user?.role || 'MEMBER';
  const firstName =
    user?.firstName ?? user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuario';

  // Renderiza la vista completa adaptada al rol
  const renderDashboardByRole = () => {
    switch (role) {
      case 'SUPERADMIN':
        return <SuperAdminDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      case 'MEMBER':
      default:
        return <MemberDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Sidebar persiste a la izquierda */}
      <Sidebar />

      {/* 2. Área principal de contenido */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header superior */}
        <Header />

        {/* 3. Vista dinámica según el Rol (incluye los widgets y las métricas) */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {isAuthenticated ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Bienvenido, {firstName}</h1>
                <p className="mt-2 text-sm text-slate-400 max-w-3xl">
                  Aquí tenés tu resumen de reservas, instalaciones y clima en tiempo real para gestionar tu club con facilidad.
                </p>
              </div>
              {renderDashboardByRole()}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    ClubApp
                  </span>
                  <h1 className="mt-6 text-4xl font-extrabold text-white leading-tight sm:text-5xl">
                    Bienvenido a ClubApp 🏟️
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                    La plataforma integral para gestionar tus reservas de canchas, actividades y la vida de tu club en un solo lugar.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:from-emerald-400 hover:to-teal-400"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-emerald-500 hover:text-emerald-300"
                    >
                      Crear una Cuenta / Registrarme
                    </button>
                  </div>
                </div>
              </section>

              <aside>
                <WeatherWidget />
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}