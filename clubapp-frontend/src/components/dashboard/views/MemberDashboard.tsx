import ClubMapWidget from '../ClubMapWidget';
import WeatherWidget from '../WeatherWidget';
import { CreditCard, CalendarCheck, ArrowRight, Building, UserPlus, Zap, AlertTriangle, Wallet, IdCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { dashboardService } from '../../../services/dashboardService';
import { membershipService } from '../../../services/membershipService';
import { paymentsService } from '../../../services/paymentsService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import type { DashboardDto } from '../../../types/dashboard';
import type { User } from '../../../types/auth';
import MembershipModal from '../MembershipModal';
import CancelMembershipModal from '../CancelMembershipModal';

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { user, updateUser, refreshMembershipState } = useAuth();
  const { success, error } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardDto | null>(null);
  const [membership, setMembership] = useState<{ status: string; nextDueDate?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMembership, setShowMembership] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [hasPendingCuota, setHasPendingCuota] = useState(false);

  useEffect(() => {
    refreshAll();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboard();
      setDashboardData(data);
    } catch {
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresca el estado de membresía desde GET /api/memberships/me (fuente de verdad
  // para CANCELED_PENDING_END y la fecha de vencimiento del período pagado).
  const refreshMembership = async () => {
    try {
      const m = await membershipService.getMyMembership();
      setMembership(m ? { status: m.status, nextDueDate: m.nextDueDate } : null);
    } catch {
      setMembership(null);
    }
  };

  // Refresca cuotas pendientes desde GET /api/payments/mine (fuente de verdad) y
  // actualiza `hasPendingCuota`, que controla el banner "¡Ya casi sos socio!".
  const refreshCuotas = async () => {
    try {
      const cuotas = await paymentsService.getMyCuotas();
      setHasPendingCuota(
        cuotas.some((c) =>
          ['PENDING', 'PENDIENTE', 'EN_MORA', 'OVERDUE'].includes(
            String(c?.status ?? '').toUpperCase(),
          ),
        ),
      );
    } catch {
      setHasPendingCuota(false);
    }
  };

  // Recarga el resumen del dashboard, la membresía y las cuotas pendientes. Se invoca
  // al montar y tras una suscripción/cancelación/reactivación para reflejar el nuevo
  // estado sin recargar la página.
  const refreshAll = () => {
    loadDashboard();
    refreshMembership();
    refreshCuotas();
  };

  const handleCancelSubscription = async () => {
    // Bloqueo estricto contra doble clic.
    if (cancelling) return;
    setCancelling(true);
    try {
      const result = await membershipService.cancelSubscription();
      if (result && !result.success) {
        throw new Error(result.message || 'No se pudo cancelar la membresía.');
      }
      setShowCancelModal(false);
      // Refleja la baja con la respuesta autoritativa del backend (rol + condición
      // de socio ya cambiados en la base de datos).
      updateUser({
        isSocio: result?.user?.isSocio ?? false,
        role: (result?.user?.role as User['role']) ?? 'MEMBER',
      });
      // Sincroniza con el backend (fuente de verdad) y refresca cuotas pendientes
      // para que Dashboard y Mis Cuotas queden alineados sin recargar la página.
      await refreshMembershipState();
      await refreshMembership();
      await refreshCuotas();
      loadDashboard();
    } catch (err) {
      const data = (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data;
      console.error(data?.message ?? data?.detail ?? (err as Error)?.message ?? 'No se pudo cancelar la membresía.');
    } finally {
      setCancelling(false);
    }
  };

  // Reactivación directa de una membresía con baja programada (CANCELED_PENDING_END):
  // el backend la devuelve a ACTIVE sin cuota nueva ni cobro. Se actualiza el estado
  // global y se refresca todo para mostrar "Socio Activo" de inmediato.
  const handleReactivate = async () => {
    if (reactivating) return;
    setReactivating(true);
    try {
      const result = await membershipService.reactivateSubscription();
      if (result && !result.success) {
        throw new Error(result.message || 'No se pudo reactivar la membresía.');
      }
      updateUser({
        isSocio: result?.user?.isSocio ?? true,
        role: (result?.user?.role as User['role']) ?? 'MEMBER',
      });
      await refreshMembershipState();
      await refreshMembership();
      await refreshCuotas();
      loadDashboard();
      success(result?.message || 'Membresía reactivada con éxito.');
    } catch (err) {
      const data = (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data;
      const msg = data?.message ?? data?.detail ?? (err as Error)?.message ?? 'No se pudo reactivar la membresía.';
      error(msg);
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <span className="text-sm font-medium">Verificando estado...</span>
      </div>
    );
  }

  // Determina si el usuario ya es SOCIO activo (cuotas al día / membresía activa).
  // Fuentes de verdad: el claim `isSocio` del AuthContext (se actualiza al acreditarse
  // el primer pago) y el resumen de membresía devuelto por el backend.
  const membershipSummary = dashboardData?.membershipSummary;
  const isActiveMember =
    user?.isSocio === true || membershipSummary?.hasActiveMembership === true;

  // Determina si el usuario no-activo ya tiene una cuota social generada y
  // pendiente de pago (status de membresía "Pendiente de Pago"/"INACTIVE" con la
  // suscripción iniciada, o una cuota en estado PENDING/OVERDUE vía /payments/mine).
  // El estado canónico y la fecha de vencimiento provienen de GET /api/memberships/me,
  // con el resumen del dashboard como fuente secundaria.
  const statusLabel = (membership?.status ?? membershipSummary?.status ?? '').toUpperCase();
  const nextDueDate = membership?.nextDueDate ?? membershipSummary?.nextDueDate;
  const isCanceledPendingEnd = statusLabel === 'CANCELED_PENDING_END' || statusLabel === 'CANCELLED_PENDING_END';
  const isPendingPayment = statusLabel === 'PENDING_PAYMENT';
  const hasPendingSubscription =
    isPendingPayment ||
    hasPendingCuota ||
    statusLabel.includes('PENDIENTE') ||
    statusLabel === 'INACTIVE' ||
    (dashboardData?.recentCuotas ?? []).some((c) =>
      ['PENDING', 'PENDIENTE', 'EN_MORA'].includes(String(c?.status ?? '').toUpperCase()),
    );

  // Si ya es SOCIO activo, se oculta por completo la tarjeta de asociación.
  // En caso contrario (incluye el fallback cuando el endpoint de dashboard no responde),
  // se muestra el flujo habitual de suscripción.
  if (!isActiveMember && dashboardData?.hasClub !== true) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-500/30 bg-linear-to-br from-slate-900 to-emerald-950/40 p-8 md:p-10 text-center relative overflow-hidden shadow-2xl">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 items-center justify-center shadow-lg shadow-emerald-500/5">
            <Building size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {isPendingPayment ? 'Tu solicitud de asociación fue registrada' : 'Aún no estás asociado a ningún Club'}
          </h2>
          <p className="mt-3 text-slate-300 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            {isPendingPayment
              ? 'Completá el pago de tu primera cuota social para activar tu carnet y comenzar a disfrutar de todos los beneficios.'
              : 'Para comenzar a disfrutar de nuestras instalaciones, actividades y servicios exclusivos, por favor elige una de las siguientes opciones:'}
          </p>

          {hasPendingSubscription && (
            <div className="mt-6 mx-auto max-w-xl flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-left">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-relaxed">
                {isCanceledPendingEnd
                  ? `Solicitaste la baja de tu membresía, pero tenés acceso total a las instalaciones hasta el ${nextDueDate ? new Date(nextDueDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'vencimiento de tu período pagado'} por haber abonado tu cuota. No se emitirán nuevas cuotas.`
                  : isPendingPayment
                    ? '¡Tu solicitud fue registrada! Abona tu primera cuota para activar tus beneficios de Socio.'
                    : '¡Ya casi sos socio! Abona tu primera cuota para activar tus beneficios.'}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {isCanceledPendingEnd ? (
              <button
                onClick={handleReactivate}
                disabled={reactivating}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center gap-2"
              >
                <CreditCard size={18} /> {reactivating ? 'Reactivando...' : 'Reactivar Membresía'}
              </button>
            ) : hasPendingSubscription ? (
              <button
                onClick={() => navigate('/mis-cuotas')}
                className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg flex items-center gap-2"
              >
                <Wallet size={18} /> Pagar Cuota Pendiente
              </button>
            ) : (
              <button
                onClick={() => setShowMembership(true)}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg flex items-center gap-2"
              >
                <CreditCard size={18} /> Suscribirme al Club
              </button>
            )}
            <button
              onClick={() => navigate('/actividades')}
              className="px-6 py-3.5 rounded-2xl border border-slate-700 bg-slate-950 hover:border-emerald-500 text-white font-bold text-sm transition-all flex items-center gap-2"
            >
              <UserPlus size={18} /> Inscribirme a Actividades
            </button>
            <button
              onClick={() => navigate('/reservar-cancha')}
              className="px-6 py-3.5 rounded-2xl border border-slate-700 bg-slate-950 hover:border-emerald-500 text-white font-bold text-sm transition-all flex items-center gap-2"
            >
              <Zap size={18} /> Alquilar Espacio / Cancha
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8"><ClubMapWidget /></div>
          <div className="lg:col-span-4"><WeatherWidget /></div>
        </div>

        <MembershipModal open={showMembership} onClose={() => { setShowMembership(false); refreshAll(); }} />
      </div>
    );
  }

  const ActionButtons = () => (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/actividades')}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 text-slate-950 font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
        >
          <UserPlus size={18} /> Inscribirme a Actividades
        </button>
        <button
          onClick={() => navigate('/reservar-cancha')}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 text-slate-950 font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
        >
          <Zap size={18} /> Alquilar Espacio / Cancha
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8"><ClubMapWidget /></div>
        <div className="lg:col-span-4 space-y-6">
          <WeatherWidget />
          {isActiveMember ? (
            <>
              <ActionButtons />
              <div className={`bg-slate-900/80 border ${isCanceledPendingEnd ? 'border-amber-500/30' : 'border-slate-800'} rounded-3xl p-6 relative overflow-hidden transition-colors duration-300`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={16} className={`transition-colors duration-300 ${isCanceledPendingEnd ? 'text-amber-400' : 'text-emerald-400'}`} /> 
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={isCanceledPendingEnd ? 'baja' : 'activa'}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      >
                        {isCanceledPendingEnd ? 'Membresía en Baja' : 'Membresía Activa'}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={isCanceledPendingEnd ? 'badge-baja' : 'badge-activo'}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`px-2.5 py-1 rounded-full ${isCanceledPendingEnd ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} text-[10px] font-bold`}
                    >
                      {isCanceledPendingEnd ? (
                        <>
                          Baja Solicitada - Activo hasta {nextDueDate ? new Date(nextDueDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'el vencimiento'}
                        </>
                      ) : (
                        'Socio Activo'
                      )}
                    </motion.span>
                  </AnimatePresence>
                </div>
                
                {isCanceledPendingEnd ? (
                  <motion.div
                    key="banner-baja"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3"
                  >
                    <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200 leading-relaxed">
                      Solicitaste la baja de tu membresía, pero tenés acceso total a las instalaciones hasta el {nextDueDate ? new Date(nextDueDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'vencimiento de tu período pagado'} por haber abonado tu cuota.
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key="amount"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="text-2xl font-black text-white"
                  >
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(membershipSummary?.amount ?? 0)}
                    <span className="text-xs font-normal text-slate-400"> / mes</span>
                  </motion.p>
                )}
                
                {nextDueDate && !isCanceledPendingEnd && (
                  <p className="text-xs text-slate-400 mt-1">
                    Próximo vencimiento: <strong className="text-white">{new Date(nextDueDate ?? '').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                  </p>
                )}
                
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => navigate('/mis-cuotas')}
                    className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    Ver Historial de Pagos <ArrowRight size={14} />
                  </button>
                  
                  <AnimatePresence mode="wait" initial={false}>
                    {isCanceledPendingEnd ? (
                      <motion.button
                        key="reactivate"
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onClick={handleReactivate}
                        disabled={reactivating}
                        className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all duration-300 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {reactivating ? 'Reactivando...' : 'Reactivar Membresía'}
                      </motion.button>
                    ) : (
                      <motion.button
                        key="cancel"
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onClick={() => setShowCancelModal(true)}
                        className="w-full py-2 px-3 bg-transparent hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 font-semibold rounded-xl text-xs transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                      >
                        Cancelar Membresía
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={16} className="text-slate-400" /> Membresía
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                  Inactivo
                </span>
              </div>
              <div className="flex flex-col items-center text-center pt-2 pb-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5 mb-4">
                  <IdCard size={32} />
                </div>
                <p className="text-sm font-bold text-white">Aún no tenés una membresía activa</p>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                {hasPendingSubscription
                  ? 'Tu suscripción está en proceso. Abona tu primera cuota para activar tu carnet.'
                  : 'Aún no estás asociado a ningún club.'}
              </p>
              {hasPendingSubscription && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200 leading-relaxed">
                    ¡Ya casi sos socio! Abona tu primera cuota para activar tus beneficios.
                  </p>
                </div>
              )}
              <button
                onClick={() => (hasPendingSubscription ? navigate('/mis-cuotas') : setShowMembership(true))}
                className={`w-full py-2.5 px-3 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                  hasPendingSubscription
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {hasPendingSubscription ? (
                  <>Pagar Cuota Pendiente <Wallet size={14} /></>
                ) : (
                  <>Suscribirme al Club <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      <MembershipModal open={showMembership} onClose={() => { setShowMembership(false); refreshAll(); }} />

      {showCancelModal && (
        <CancelMembershipModal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelSubscription}
          confirming={cancelling}
          nextDueDate={nextDueDate}
        />
      )}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <CalendarCheck size={18} className="text-emerald-400" /> Mis Próximos Turnos Reservados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(dashboardData?.upcomingReservations ?? []).length > 0 ? (
            (dashboardData?.upcomingReservations ?? []).map((res: any) => (
              <div key={res.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">{new Date(res.date).toLocaleDateString()}</span>
                  <h4 className="font-bold text-white text-sm mt-0.5">{res.description}</h4>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">Confirmado</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No tienes próximas reservas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
