import { Wrench, Clock, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Maintenance503() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      {/* Glow de fondo animado */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden text-center"
      >
        {/* Ícono */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          className="inline-flex p-5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6"
        >
          <Wrench size={40} />
        </motion.div>

        {/* Título */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">503</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Sitio en Mantenimiento</h2>
        
        {/* Mensaje */}
        <p className="text-slate-400 text-base leading-relaxed mb-6 max-w-xs mx-auto">
          Estamos optimizando el sistema para ofrecerte una mejor experiencia. 
          El servicio volverá a estar disponible pronto.
        </p>

        {/* Estado del servicio */}
        <motion.div
          className="mb-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700"
        >
          <div className="flex items-center justify-center gap-2 text-sm mb-2">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-blue-400"
            />
            <span className="text-blue-400 font-medium">Estado: Mantenimiento programado</span>
          </div>
          <p className="text-[12px] text-slate-500">
            Tiempo estimado: <span className="text-white font-mono">~15 min</span>
          </p>
        </motion.div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-sm border border-blue-500/30 transition-all"
          >
            <Clock size={18} className="animate-spin" /> Revisar luego
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition-all"
          >
            <Home size={18} /> Dashboard
          </motion.button>
        </div>

        {/* Detalles técnicos */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 font-mono">
            Servicio no disponible · Código: 503
          </p>
        </div>
      </motion.div>
    </div>
  );
}