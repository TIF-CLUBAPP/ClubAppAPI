import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import type { RegisterData } from '../types/auth';

export default function Register() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [form, setForm] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dni: '',
    phone: '',
    birthDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado para completar perfil tras Google
  const [requiresCompletion, setRequiresCompletion] = useState(false);
  const [googleUserId, setGoogleUserId] = useState<number | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.firstName) e.firstName = 'El nombre es obligatorio.';
    if (!form.lastName) e.lastName = 'El apellido es obligatorio.';

    if (!form.email) e.email = 'El correo es obligatorio.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Email inválido.';

    if (!form.password) e.password = 'La contraseña es obligatoria.';
    else if (form.password.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres.';

    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden.';

    if (!/^\d{7,8}$/.test(form.dni)) e.dni = 'El DNI debe tener 7 u 8 dígitos numéricos.';
    if (!/^\+?\d{7,15}$/.test(form.phone)) e.phone = 'El teléfono no tiene un formato válido.';

    if (!form.birthDate) e.birthDate = 'La fecha de nacimiento es obligatoria.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };


  const handleChange = (key: keyof RegisterData, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register(form);
      navigate('/login');
    } catch (err: any) {
      setErrors({ form: err?.response?.data?.message || 'Error en el registro.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) return setErrors({ form: 'No se recibió token de Google.' });

    try {
      const res = await authService.googleSignIn(idToken);
      if (res.requiresProfileCompletion) {
        setRequiresCompletion(true);
        setGoogleUserId(res.userId ?? null);
      } else if (res.token) {
        setSession(res.token, res.user ?? null);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrors({ form: err?.response?.data?.message || 'Error autenticando con Google.' });
    }
  };

  const handleGoogleFailure = () => {
    setErrors({ form: 'Fallo en autenticación con Google.' });
  };

  const completeProfile = async (dni: string, phone: string, birthDate: string) => {
    if (!googleUserId) return;
    try {
      const res = await authService.completeGoogleProfile({ userId: googleUserId, dni, phone, birthDate });
      setRequiresCompletion(false);
      if (res.token) {
        setSession(res.token, res.user ?? null);
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setErrors({ form: err?.response?.data?.message || 'Error completando perfil.' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="text-center mb-4">
          <div className="inline-flex p-4 rounded-2xl bg-sky-500/10 text-sky-300 border border-sky-500/20 mb-3">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Crea tu cuenta ClubApp</h2>
          <p className="text-slate-400 text-sm mt-1">Completá tus datos para crear una cuenta.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300">Nombre</label>
              <input className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
              {errors.firstName && <p className="text-xs text-rose-400 mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm text-slate-300">Apellido</label>
              <input className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
              {errors.lastName && <p className="text-xs text-rose-400 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300">Email</label>
            <input type="email" className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
            {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-300">DNI</label>
            <input className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" value={form.dni} onChange={(e) => handleChange('dni', e.target.value)} />
            {errors.dni && <p className="text-xs text-rose-400 mt-1">{errors.dni}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-300">Teléfono</label>
            <input className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-300">Fecha de Nacimiento</label>
            <input type="date" className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" value={form.birthDate} onChange={(e) => handleChange('birthDate', e.target.value)} />
            {errors.birthDate && <p className="text-xs text-rose-400 mt-1">{errors.birthDate}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-300">Contraseña</label>
            <div className="relative flex items-center mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-md p-2 pr-10 bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 p-1 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-300">Confirmar Contraseña</label>
            <div className="relative flex items-center mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full rounded-md p-2 pr-10 bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 p-1 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-rose-400 mt-1">{errors.confirmPassword}</p>}
          </div>

          {errors.form && <p className="text-sm text-rose-400">{errors.form}</p>}

          <button disabled={loading} type="submit" className="w-full py-3 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold">
            Crear cuenta
          </button>

          <div className="text-center text-sm text-slate-300">O registrate con</div>

          <div className="flex justify-center">
            <GoogleLogin onSuccess={(res: any) => handleGoogleSuccess(res)} onError={handleGoogleFailure} />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/login')} className="w-full py-3 rounded-2xl border border-slate-700 text-slate-100 font-semibold">Volver a iniciar sesión</button>
            <button type="button" onClick={() => navigate('/dashboard')} className="w-full py-3 rounded-2xl border border-slate-700 text-slate-100 font-semibold"><ArrowLeft size={14} className="inline-block mr-2"/> Volver</button>
          </div>
        </form>

        {/* Modal / formulario rápido para completar perfil tras Google */}
        {requiresCompletion && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60">
            <div className="bg-slate-900 p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-bold text-white mb-3">Completar perfil</h3>
              <p className="text-sm text-slate-400 mb-4">Faltan algunos datos para finalizar tu registro con Google. Sólo necesitamos DNI, Teléfono y Fecha de Nacimiento.</p>

              <QuickCompleteForm onSubmit={async (d) => { await completeProfile(d.dni, d.phone, d.birthDate); }} onCancel={() => setRequiresCompletion(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickCompleteForm({ onSubmit, onCancel }: { onSubmit: (d: { dni: string; phone: string; birthDate: string }) => Promise<void>; onCancel: () => void }) {
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!/^\d{7,8}$/.test(dni)) e.dni = 'DNI inválido.';
    if (!/^\+?\d{7,15}$/.test(phone)) e.phone = 'Teléfono inválido.';
    if (!birthDate) e.birthDate = 'Fecha obligatoria.';
    else {
      // Permitimos completar perfil para menores; no bloqueamos aquí.
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    await onSubmit({ dni, phone, birthDate });
  };

  return (
    <div>
      <div>
        <label className="block text-sm text-slate-300">DNI</label>
        <input value={dni} onChange={(e) => setDni(e.target.value)} className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" />
        {errors.dni && <p className="text-xs text-rose-400 mt-1">{errors.dni}</p>}
      </div>

      <div>
        <label className="block text-sm text-slate-300">Teléfono</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" />
        {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm text-slate-300">Fecha de Nacimiento</label>
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="mt-1 w-full rounded-md p-2 bg-slate-800 text-white" />
        {errors.birthDate && <p className="text-xs text-rose-400 mt-1">{errors.birthDate}</p>}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={submit} className="flex-1 py-2 rounded-2xl bg-emerald-500 text-slate-950">Guardar</button>
        <button onClick={onCancel} className="flex-1 py-2 rounded-2xl border border-slate-700">Cancelar</button>
      </div>
    </div>
  );
}
