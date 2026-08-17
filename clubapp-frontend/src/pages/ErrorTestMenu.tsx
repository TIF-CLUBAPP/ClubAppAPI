import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  UserX,
  ServerCrash,
  Wrench,
  X,
  Bug,
  LayoutDashboard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const errorRoutes = [
  { path: '/404', label: 'Not Found (404)', icon: AlertTriangle, color: 'text-slate-400', bg: 'bg-slate-800' },
  { path: '/403', label: 'Forbidden (403)', icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { path: '/401', label: 'Unauthorized (401)', icon: UserX, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { path: '/500', label: 'Server Error (500)', icon: ServerCrash, color: 'text-red-400', bg: 'bg-red-500/10' },
  { path: '/503', label: 'Maintenance (503)', icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-500/10' },
];

export default function ErrorTestMenu() {
  // Guard clause: solo renderizar en entorno de desarrollo
  if (!import.meta.env.DEV) return null;

  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Botón flotante para abrir/cerrar el menú */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl backdrop-blur-md transition-all hover:bg-emerald-500/20"
        aria-label="Menú de pruebas de errores"
      >
        <Bug size={22} className={isOpen ? 'animate-spin' : ''} />
      </motion.button>

      {/* Panel desplegable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-16 right-6 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header del panel */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug size={20} className="text-emerald-400" />
                <h3 className="font-bold text-white">Pruebas de Errores</h3>
                <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-800">DEV</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                aria-label="Cerrar menú"
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Lista de errores */}
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {errorRoutes.map(({ path, label, icon: Icon, color, bg }) => (
                <motion.div
                  key={path}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left ${isActive(path) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-slate-800/50'}`}
                >
                  <Link
                    to={path}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 flex items-center gap-3"
                  >
                    <div className={`p-2.5 rounded-xl ${bg} border border-slate-700/50 flex-shrink-0`}>
                      <Icon size={18} className={color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{label}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{path}</p>
                    </div>
                  </Link>
                  {isActive(path) && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Activo
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer con acceso rápido al dashboard */}
            <div className="p-3 border-t border-slate-800">
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
              >
                <LayoutDashboard size={16} /> Volver al Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para cerrar al hacer click fuera */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}