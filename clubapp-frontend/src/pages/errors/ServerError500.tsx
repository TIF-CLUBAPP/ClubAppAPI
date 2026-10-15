import { ServerCrash, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ServerError500() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      {/* Glow de fondo animado */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden text-center"
      >
        {/* Ícono */}
        <motion.div
          animate={{ rotate: [0, -3, 3, -3, 3, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
          className="inline-flex p-5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-6"
        >
          <ServerCrash size={40} />
        </motion.div>

        {/* Título */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">500</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Error del Servidor</h2>
        
        {/* Mensaje */}
        <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-xs mx-auto">
          Algo salió mal en nuestro servidor. Nuestro equipo ya fue notificado 
          y está trabajando para solucionarlo.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRetry}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm border border-red-500/30 transition-all"
          >
            <RefreshCw size={18} className="animate-spin" /> Reintentar
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
            Error: Error interno del servidor · Código: 500
          </p>
        </div>
      </motion.div>
    </div>
  );
}