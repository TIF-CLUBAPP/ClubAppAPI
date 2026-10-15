import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound404() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      {/* Glow de fondo animado */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden text-center"
      >
        {/* Ícono */}
        <motion.div
          whileHover={{ rotate: [0, -5, 5, -5, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
          className="inline-flex p-5 rounded-2xl bg-slate-500/10 text-slate-400 border border-slate-500/20 mb-6"
        >
          <FileQuestion size={40} />
        </motion.div>

        {/* Título */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">404</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Página no encontrada</h2>
        
        {/* Mensaje */}
        <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-xs mx-auto">
          La ruta a la que intentas acceder no existe o fue movida.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.history.back()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition-all"
          >
            <ArrowLeft size={18} /> Volver
          </motion.button>
          
          <Link to="/dashboard">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
            >
              <Home size={18} /> Volver al Dashboard
            </motion.button>
          </Link>
        </div>

        {/* Detalles técnicos */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 font-mono">
            Error: Recurso no encontrado · Código: 404
          </p>
        </div>
      </motion.div>
    </div>
  );
}