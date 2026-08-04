import React from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import DailySchedule from '../components/reservations/DailySchedule';

export default function Reservations() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          <div>
            <h2 className="text-2xl font-black text-white">Reservas & Agenda del Club</h2>
            <p className="text-xs text-slate-400 mt-1">
              Consulta disponibilidad en tiempo real, turnos asignados e intervalos de acondicionamiento de instalaciones.
            </p>
          </div>
          <DailySchedule />
        </main>
      </div>
    </div>
  );
}