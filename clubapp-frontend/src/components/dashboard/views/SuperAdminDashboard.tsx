import React from 'react';
import ClubMapWidget from '../ClubMapWidget';
import { Users, DollarSign, AlertCircle, UserPlus, Search } from 'lucide-react';

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Socios Activos</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">1.240</p>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">+12 este mes</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudación Mes</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">$ 4.850.000</p>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">85% Cobrado</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuotas Vencidas</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-400">18</p>
          <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">Revisar lista</span>
        </div>
      </div>

      {/* Grid Secundario */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ClubMapWidget />
        </div>

        {/* Acciones Rápidas de Administración */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4">Acciones de Gestión</h3>
            
            <div className="space-y-3">
              <button className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2">
                <UserPlus size={16} /> Registrar Nuevo Socio
              </button>

              <button className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 font-semibold rounded-2xl text-xs transition-all flex items-center justify-center gap-2">
                <Search size={16} /> Buscar Ficha de Socio
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-6 text-center">
            <p className="text-[10px] text-slate-500">ClubApp Panel Administrativo v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}