import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import type { RegisterData } from '../types/auth';

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();

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
      toast.success('Cuenta creada con éxito. Iniciá sesión para continuar.');
      navigate('/login');
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message?.toLowerCase() || '';
      
      // Detectar 400, 409 o mensaje de correo ya registrado / existente
      if (status === 400 || status === 409 || message.includes('already') || message.includes('exist') || message.includes('registrad') || message.includes('correo') || message.includes('email')) {
        toast.info('Tu cuenta ya está registrada. Te redirigimos al inicio de sesión.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        toast.error(err?.response?.data?.message || 'Error en el registro. Verificá tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="text-center mb-6">
          <div className="inline-flex p-4 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 mb-3">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Crea tu cuenta ClubApp</h2>
          <p className="text-slate-400 text-xs mt-1">Completá tus datos para crear una cuenta.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Nombre</label>
              <input disabled={loading} className="mt-1 w-full rounded-xl p-2.5 bg-slate-950 text-white border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
              {errors.firstName && <p className="text-[11px] text-rose-400 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Apellido</label>
              <input disabled={loading} className="mt-1 w-full rounded-xl p-2.5 bg-slate-950 text-white border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
              {errors.lastName && <p className="text-[11px] text-rose-400 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Correo Electrónico</label>
            <input type="email" disabled={loading} className="mt-1 w-full rounded-xl p-2.5 bg-slate-950 text-white border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
            {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">DNI</label>
              <input disabled={loading} className="mt-1 w-full rounded-xl p-2.5 bg-slate-950 text-white border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50" value={form.dni} onChange={(e) => handleChange('dni', e.target.value)} />
              {errors.dni && <p className="text-[11px] text-rose-400 mt-1">{errors.dni}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Teléfono</label>
              <input disabled={loading} className="mt-1 w-full rounded-xl p-2.5 bg-slate-950 text-white border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Fecha de Nacimiento</label>
            <input type="date" disabled={loading} className="mt-1 w-full rounded-xl p-2.5 bg-slate-950 text-white border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50" value={form.birthDate} onChange={(e) => handleChange('birthDate', e.target.value)} />
            {errors.birthDate && <p className="text-[11px] text-rose-400 mt-1">{errors.birthDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Contraseña</label>
            <div className="relative flex items-center mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                disabled={loading}
                className="w-full rounded-xl p-2.5 pr-10 bg-slate-950 text-white border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Confirmar Contraseña</label>
            <div className="relative flex items-center mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                disabled={loading}
                className="w-full rounded-xl p-2.5 pr-10 bg-slate-950 text-white border border-slate-800 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-[11px] text-rose-400 mt-1">{errors.confirmPassword}</p>}
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>

          <div className="flex gap-3 pt-2">
            <button type="button" disabled={loading} onClick={() => navigate('/login')} className="w-full py-3 rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 font-semibold text-xs transition-all disabled:opacity-50">
              Volver a iniciar sesión
            </button>
            <button type="button" disabled={loading} onClick={() => navigate('/dashboard')} className="w-full py-3 rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 font-semibold text-xs transition-all disabled:opacity-50">
              <ArrowLeft size={14} className="inline-block mr-1.5"/> Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
