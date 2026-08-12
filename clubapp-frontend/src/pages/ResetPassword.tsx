import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, CheckCircle2, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !token) {
      setError('El enlace de restablecimiento es inválido (falta token o email).');
      return;
    }
    if (newPassword.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({ email, token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Restablecer Contraseña</h2>
          <p className="text-slate-400 text-sm mt-1">{email ? `Nueva contraseña para ${email}` : 'Ingresá tu nueva contraseña'}</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>¡Contraseña actualizada con éxito! Redirigiendo al Login...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nueva Contraseña</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-500" size={18} />
              <input type={showNewPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm" />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 p-1 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none" tabIndex={-1}>
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Confirmar Contraseña</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-500" size={18} />
              <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 p-1 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none" tabIndex={-1}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button type="submit" disabled={loading || success} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3.5 px-4 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Restablecer Contraseña</span>}
          </motion.button>

          <div className="pt-2 flex flex-col items-center">
            <Link to="/login" className="text-slate-400 hover:text-emerald-400 transition-colors text-xs font-medium inline-flex items-center gap-1.5">
              <ArrowLeft size={14} />
              <span>Volver al Login</span>
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
