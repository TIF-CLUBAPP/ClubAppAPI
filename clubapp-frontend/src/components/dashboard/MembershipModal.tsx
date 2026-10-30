import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Loader2,
  Users,
  Heart,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MEMBERSHIP_CATEGORIES, membershipService } from '../../services/membershipService';
import type { MembershipCategory } from '../../services/membershipService';

const fmt = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const CATEGORY_ICONS: Record<string, typeof CreditCard> = {
  SOCIO_ACTIVO: ShieldCheck,
  SOCIO_ADHERENTE: Heart,
  SOCIO_FAMILIAR: Users,
};

interface MembershipModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'select' | 'confirm' | 'done';

export default function MembershipModal({ open, onClose }: MembershipModalProps) {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { success, error } = useToast();

  const [categories, setCategories] = useState<MembershipCategory[]>(MEMBERSHIP_CATEGORIES);
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<MembershipCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Obtención silenciosa de la tarifa oficial desde el backend al abrir el modal con fallback transparente
  useEffect(() => {
    if (open) {
      membershipService.getOfficialMonthlyPrice()
        .then((price) => {
          if (price && price > 0) {
            setCategories(prev =>
              prev.map(cat => (cat.id === 'SOCIO_ACTIVO' ? { ...cat, price } : cat))
            );
          }
        })
        .catch(() => {
          // Fallback silencioso sin alertar al usuario
        });
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    setStep('select');
    setSelected(null);
    onClose();
  };

  const handleSelect = (category: MembershipCategory) => {
    const activePrice = category.price ?? 150;
    setSelected({ ...category, price: activePrice });
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selected || selected.price === null || selected.price === undefined) return;
    setSubmitting(true);
    try {
      await membershipService.subscribe({
        membershipType: selected.id,
        monthlyPrice: selected.price,
      });

      updateUser({ isSocio: true });
      success('¡Suscripción exitosa! Ya sos socio del club.');
      setStep('done');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo completar la suscripción. Intentalo nuevamente.';
      error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl"
          >
            {/* Botón Cerrar */}
            <button
              onClick={handleClose}
              disabled={submitting}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-all disabled:opacity-50"
            >
              <X size={18} />
            </button>

            {/* Encabezado */}
            <div className="p-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Suscripción al Club</h3>
                  <p className="text-xs text-slate-400">
                    {step === 'select' && 'Elegí el plan de membresía que mejor se adapte a vos.'}
                    {step === 'confirm' && 'Revisá los detalles y confirmá tu suscripción.'}
                    {step === 'done' && '¡Ya sos parte del club!'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* ===== Paso 1: Selección ===== */}
              {step === 'select' && (
                <div className="space-y-4">
                  {categories.map((cat) => {
                    const IconComp = CATEGORY_ICONS[cat.id] || CreditCard;
                    const displayPrice = cat.price ?? 150;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleSelect(cat)}
                        className="group relative cursor-pointer rounded-2xl border border-slate-800 bg-slate-950 p-5 hover:border-emerald-500/60 hover:bg-slate-900/80 transition-all space-y-4"
                      >
                        {cat.highlight && (
                          <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <Sparkles size={11} /> Recomendado
                          </span>
                        )}

                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
                            <IconComp size={22} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {cat.name}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">{cat.description}</p>
                          </div>
                        </div>

                        {/* Lista de beneficios completa y vistosa */}
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 space-y-2">
                          <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Beneficios incluidos:</p>
                          <ul className="space-y-1.5">
                            {cat.features.map((feat, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                                {feat}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                          <div>
                            <span className="text-xl font-black text-white">{fmt(displayPrice)}</span>
                            <span className="text-xs text-slate-400"> / mes</span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md group-hover:scale-105">
                            Asociarme al Club <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ===== Paso 2: Confirmación ===== */}
              {step === 'confirm' && selected && (
                <div className="space-y-6">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Plan Seleccionado</p>
                        <h4 className="text-lg font-bold text-white mt-0.5">{selected.name}</h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {fmt(selected.price ?? 150)} / mes
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-300 font-semibold">Beneficios incluidos:</p>
                      <ul className="space-y-1.5">
                        {selected.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✓</span>
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-slate-300">
                    <p className="font-semibold text-emerald-400 mb-1">Información importante</p>
                    <p className="text-slate-400">
                      Al confirmar tu suscripción, se activará tu condición de Socio y se generará tu cuota social mensual por un valor de <strong className="text-emerald-400">{fmt(selected.price ?? 150)}</strong> en
                      la sección <strong className="text-slate-200">Mis Cuotas</strong>.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('select')}
                      disabled={submitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-700 bg-slate-950 hover:border-slate-600 text-slate-200 font-semibold text-sm transition-all disabled:opacity-50"
                    >
                      <ArrowLeft size={16} /> Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={submitting}
                      className="flex-[2] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Procesando...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} /> Asociarme al Club
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ===== Paso 3: Éxito ===== */}
              {step === 'done' && selected && (
                <div className="text-center py-6">
                  <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-xl font-black text-white">¡Suscripción completada!</h4>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                    Ya sos <strong className="text-emerald-400">{selected.name}</strong>. Podés ver tu
                    cuota social y abonarla desde la sección Mis Cuotas.
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/mis-cuotas');
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg"
                    >
                      <CreditCard size={16} /> Ver Mis Cuotas
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-700 bg-slate-950 hover:border-slate-600 text-slate-200 font-semibold text-sm transition-all"
                    >
                      Volver al Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
