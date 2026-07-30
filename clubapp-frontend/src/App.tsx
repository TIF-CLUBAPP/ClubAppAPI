import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [count, setCount] = useState<number>(0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center"
      >
        <div className="flex justify-center mb-4 text-emerald-400">
          <ShieldCheck size={48} />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          ClubApp Frontend
        </h1>
        
        <p className="text-slate-400 mt-2 text-sm">
          React + TypeScript + Tailwind CSS + Framer Motion
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCount((prev) => prev + 1)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-colors"
          >
            <Sparkles size={18} />
            Toques "Juicy": {count}
          </motion.button>

          {count > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 text-emerald-400 text-xs font-semibold"
            >
              <CheckCircle size={14} /> ¡Animación y estado en TS respondiendo!
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}