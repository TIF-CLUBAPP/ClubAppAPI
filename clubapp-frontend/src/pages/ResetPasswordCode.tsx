import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, ShieldCheck, RotateCw } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 120;

export default function ResetPasswordCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const focusInput = (index: number) => {
    const input = inputRefs.current[index];
    if (input) input.focus();
  };

  const clearCode = () => {
    setDigits(Array(CODE_LENGTH).fill(''));
    focusInput(0);
  };

  const verifyCode = async (code: string) => {
    if (code.length !== CODE_LENGTH) return;
    setVerifying(true);
    try {
      await authService.verifyResetCode({ email, code });
      navigate('/new-password', { state: { email, code } });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo verificar el código.';
      toast.error(msg);
      clearCode();
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').split('');
    const next = [...digits];
    let cursor = index;
    for (let i = 0; i < cleaned.length && cursor < CODE_LENGTH; i++) {
      next[cursor] = cleaned[i];
      cursor += 1;
    }
    setDigits(next);

    const nextFocus = Math.min(cursor, CODE_LENGTH - 1);
    focusInput(nextFocus);

    const fullCode = next.join('');
    if (fullCode.length === CODE_LENGTH) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && digits[index] === '' && index > 0) {
      focusInput(index - 1);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    try {
      await authService.forgotPassword(email);
      toast.success('Te reenviamos el código de verificación.');
      setSecondsLeft(RESEND_SECONDS);
      clearCode();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo reenviar el código.';
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  const codeComplete = digits.every((d) => d !== '');

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
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3"
          >
            <ShieldCheck size={32} />
          </motion.div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Código de verificación</h2>
          <p className="text-slate-400 text-sm mt-1">
            Ingresá el código de 6 dígitos que enviamos a{' '}
            <span className="font-medium text-slate-200">{email}</span>.
          </p>
        </div>

        <div className="mb-6 flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={CODE_LENGTH}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={verifying}
              className="h-14 w-11 rounded-xl border border-slate-800 bg-slate-950/60 text-center text-xl font-bold text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 sm:h-16 sm:w-12 sm:text-2xl"
            />
          ))}
        </div>

        <motion.button
          type="button"
          onClick={() => verifyCode(digits.join(''))}
          disabled={!codeComplete || verifying}
          whileHover={{ scale: codeComplete ? 1.02 : 1 }}
          whileTap={{ scale: codeComplete ? 0.98 : 1 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-3.5 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
        >
          {verifying ? <Loader2 className="animate-spin" size={20} /> : <span>Verificar código</span>}
        </motion.button>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            {secondsLeft > 0 ? (
              <>
                Reenviar código en{' '}
                <span className="font-semibold tabular-nums text-emerald-400">{secondsLeft}s</span>
              </>
            ) : (
              <>¿No te llegó el código?</>
            )}
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={secondsLeft > 0 || resending}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 transition-colors hover:text-emerald-300 disabled:cursor-not-allowed disabled:text-slate-600"
          >
            {resending ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={15} />}
            <span>Reenviar código</span>
          </button>
        </div>

        <div className="flex flex-col items-center pt-6">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-emerald-400"
          >
            <ArrowLeft size={14} />
            <span>Cambiar correo</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
