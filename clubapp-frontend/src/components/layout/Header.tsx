import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Sparkles } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-6 md:px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
          ¡Hola de nuevo! 👋
        </h2>
        <p className="text-xs text-slate-400 hidden sm:block">
          Bienvenido al panel de control de <strong className="text-slate-200">{user?.email}</strong>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Badge del sistema */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Sparkles size={14} className="text-emerald-400" />
          <span>Sistema Conectado</span>
        </div>

        {/* Botón Notificaciones */}
        <button 
          aria-label="Notificaciones"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all relative"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>
    </header>
  );
}