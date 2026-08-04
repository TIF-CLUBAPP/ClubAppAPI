import React from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';

// Vistas modulares por Rol
import SuperAdminDashboard from '../components/dashboard/views/SuperAdminDashboard';
import AdminDashboard from '../components/dashboard/views/AdminDashboard';
import MemberDashboard from '../components/dashboard/views/MemberDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  // Obtenemos el rol desde el AuthContext (MEMBER, ADMIN, SUPERADMIN)
  const role = user?.role || 'MEMBER';

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
          {renderDashboardByRole()}
        </main>
      </div>
    </div>
  );
}