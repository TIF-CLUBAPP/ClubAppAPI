import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import WelcomeHero from '../components/dashboard/WelcomeHero';

// Vistas modulares por Rol
import SuperAdminDashboard from '../components/dashboard/views/SuperAdminDashboard';
import AdminDashboard from '../components/dashboard/views/AdminDashboard';
import MemberDashboard from '../components/dashboard/views/MemberDashboard';

const WELCOME_KEY = 'clubapp_welcomeBannerDismissed';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  
  // Banner de bienvenida: se muestra solo si nunca fue descartado en localStorage
  const [showBanner, setShowBanner] = useState<boolean>(
    () => !localStorage.getItem(WELCOME_KEY)
  );

  const dismissBanner = () => {
    localStorage.setItem(WELCOME_KEY, '1');
    setShowBanner(false);
  };

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

  if (!isAuthenticated) {
    return <WelcomeHero />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Sidebar persiste a la izquierda */}
      <Sidebar />

      {/* 2. Área principal de contenido */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        {/* Header superior */}
        <Header />

        {/* 3. Vista dinámica según el Rol (incluye los widgets y las métricas) */}
        <main className="flex-1 w-full min-w-0 overflow-y-auto pt-16 px-4 pb-32 md:pt-6 md:px-6 md:pb-6">
          <div className="space-y-6">
            {/* Banner de bienvenida: solo se muestra la primera vez */}
            {showBanner && (
              <div className="relative rounded-3xl border border-slate-800 bg-slate-900/80 p-4 md:p-5">
                <button
                  type="button"
                  onClick={dismissBanner}
                  aria-label="Cerrar bienvenida"
                  className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <X size={16} />
                </button>
                <h1 className="text-xl md:text-2xl font-extrabold text-white pr-8">Bienvenido, {firstName}</h1>
                <p className="mt-2 text-sm text-slate-400 max-w-3xl">
                  Aquí tenés tu resumen de reservas, instalaciones y clima en tiempo real para gestionar tu club con facilidad.
                </p>
              </div>
            )}
            {renderDashboardByRole()}
          </div>
        </main>
      </div>
    </div>
  );
}
