import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, ArrowLeft, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

export default function NewPasswordModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const state = location.state as { email?: string; code?: string } | null;
  const email = state?.email ?? '';
  const code = state?.code ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !code) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, code, navigate]);

  const hasMinLength = newPassword.length >= 6;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!hasMinLength) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!hasLetter || !hasNumber) {
      toast.error('La contraseña debe incluir letras y números.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPasswordWithCode({ email, code, newPassword });
      toast.success('¡Contraseña actualizada con éxito!');
      navigate('/login', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo actualizar la contraseña.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!email || !code) return null;

  const requirement = (met: boolean, label: string) => (
    <span className={`inline-flex items-center gap-1.5 text-xs ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
      <CheckCircle2 size={13} className={met ? 'text-emerald-400' : 'text-slate-600'} />
      {label}
    </span>
  );

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Nueva contraseña</h2>
          <p className="text-slate-400 text-sm mt-1">Definí una nueva contraseña para {email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nueva contraseña</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-500" size={18} />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label="Mostrar u ocultar contraseña"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {requirement(hasMinLength, 'Mínimo 6 caracteres')}
              {requirement(hasLetter, 'Al menos una letra')}
              {requirement(hasNumber, 'Al menos un número')}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Confirmar contraseña</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-500" size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 p-1 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label="Mostrar u ocultar contraseña"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-rose-400">Las contraseñas no coinciden.</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 px-4 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Guardar nueva contraseña</span>}
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
