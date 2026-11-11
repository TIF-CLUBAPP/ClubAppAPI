import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, RefreshCw, UserPlus, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import type { MemberCuota } from '../types/cuotas';
import type { User } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { useMisCuotas } from '../hooks/useMisCuotas';
import { useToast } from '../context/ToastContext';
import { AccountStatusCard } from '../components/cuotas/AccountStatusCard';
import { CuotasList } from '../components/cuotas/CuotasList';
import { CheckoutModal } from '../components/cuotas/CheckoutModal';
import { ReceiptModal } from '../components/cuotas/ReceiptModal';
import MembershipModal from '../components/dashboard/MembershipModal';
import CancelMembershipModal from '../components/dashboard/CancelMembershipModal';
import { membershipService } from '../services/membershipService';
import { cuotaNumericId } from '../utils/cuotaIds';

const fmt = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

export const MisCuotas: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success, error, info } = useToast();

  useEffect(() => {
    const status = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');

    if (status) {
      if (status === 'success') {
        success(`¡Pago registrado exitosamente! ${paymentId ? `(ID: ${paymentId})` : ''}`);
      } else if (status === 'failure') {
        error('El pago no pudo completarse. Por favor, intenta nuevamente.');
      } else if (status === 'pending') {
        info('Tu pago está pendiente de procesamiento.');
      }
      
      // Limpiar URL eliminando los parámetros de consulta
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, success, error, info]);


  const { updateUser, refreshMembershipState } = useAuth();
  const { loading, settings, exemptionLabel, cuotas, totalPending, globalStatus, updateCuota, updateCuotas, isSocio, reload } = useMisCuotas();
  const [selectedCuotaIds, setSelectedCuotaIds] = useState<number[]>([]);
  const [checkoutCuotas, setCheckoutCuotas] = useState<MemberCuota[] | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<MemberCuota | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string>('');
  const [nextDueDate, setNextDueDate] = useState<string | undefined>(undefined);

  // Obtiene el estado canónico de la membresía (GET /api/memberships/me) para detectar
  // la baja programada (CANCELED_PENDING_END) y su fecha de vencimiento.
  useEffect(() => {
    membershipService.getMyMembership()
      .then((m) => {
        setMembershipStatus(m?.status ?? '');
        setNextDueDate(m?.nextDueDate);
      })
      .catch(() => {
        setMembershipStatus('');
        setNextDueDate(undefined);
      });
  }, []);

  const isCanceledPendingEnd =
    membershipStatus.toUpperCase() === 'CANCELED_PENDING_END' ||
    membershipStatus.toUpperCase() === 'CANCELLED_PENDING_END';

  // Hay cuota/solicitud pendiente de pago (membresía aún no activa). Se usa para
  // decidir si mostrar el botón "Cancelar Membresía": solo cuando el usuario es
  // socio activo o tiene una suscripción en curso por pagar.
  const hasPendingCuota = cuotas.some((c) => c.status !== 'PAGADA' && c.status !== 'CANCELADA');
  const showCancelButton = isSocio || hasPendingCuota;

  const handleCancelSubscription = async () => {
    // Bloqueo estricto contra doble clic.
    if (cancelling) return;
    setCancelling(true);
    try {
      const result = await membershipService.cancelSubscription();
      if (result && !result.success) {
        error(result.message || 'No se pudo cancelar la membresía.');
        return;
      }
      setShowCancelModal(false);
      // Refleja la baja de forma inmediata en el estado global del usuario usando la
      // respuesta autoritativa del backend (rol + condición de socio ya cambiados).
      updateUser({
        isSocio: result?.user?.isSocio ?? false,
        role: (result?.user?.role as User['role']) ?? 'MEMBER',
      });
      // Sincroniza el estado de membresía con el backend (fuente de verdad) para
      // que Dashboard y Mis Cuotas queden alineados sin recarga completa de página.
      await refreshMembershipState();
      // CRÍTICO (post-mutation sync instantáneo): re-obtiene la membresía del backend
      // y actualiza `membershipStatus`/`nextDueDate` locales de forma síncrona, para
      // que el banner "Baja Solicitada" y el botón "Reactivar Membresía" aparezcan al
      // instante (sin esperar cambio de ruta ni recarga manual).
      const membership = await membershipService.getMyMembership();
      setMembershipStatus(membership?.status ?? result?.membershipStatus ?? 'CANCELED_PENDING_END');
      setNextDueDate(membership?.nextDueDate);
      // Re-obtiene perfil + cuotas del backend SIN recarga completa de página,
      // para que la vista refleje al instante que ya no hay membresía activa
      // (desaparecen "Activación de Membresía Pendiente" y el botón "Cancelar").
      await reload();
      success('Membresía cancelada con éxito.');
    } catch (err: any) {
      const data = err?.response?.data;
      error(data?.message ?? data?.detail ?? 'No se pudo cancelar la membresía.');
    } finally {
      setCancelling(false);
    }
  };

  // Reactivación directa de una membresía con baja programada (CANCELED_PENDING_END):
  // el backend la devuelve a ACTIVE sin cuota nueva ni cobro. Se refresca el estado
  // global y las cuotas para mostrar "Socio Activo" de inmediato.
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
      setMembershipStatus(result?.membershipStatus ?? 'ACTIVE');
      setNextDueDate(result?.nextDueDate);
      await reload();
      success(result?.message || 'Membresía reactivada con éxito.');
    } catch (err: any) {
      const data = err?.response?.data;
      error(data?.message ?? data?.detail ?? 'No se pudo reactivar la membresía.');
    } finally {
      setReactivating(false);
    }
  };

  // Cuotas abonables (Pendiente / En Mora) y sus IDs para la selección múltiple.
  const selectableCuotas = useMemo(() => cuotas.filter((c) => c.status !== 'PAGADA' && c.status !== 'CANCELADA'), [cuotas]);
  const selectableIds = useMemo(() => selectableCuotas.map((c) => cuotaNumericId(c)), [selectableCuotas]);

  const selectedCuotas = useMemo(
    () => cuotas.filter((c) => c.status !== 'PAGADA' && c.status !== 'CANCELADA' && selectedCuotaIds.includes(cuotaNumericId(c))),
    [cuotas, selectedCuotaIds],
  );
  const selectedTotal = selectedCuotas.reduce((s, c) => s + c.totalAmount, 0);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedCuotaIds.includes(id));

  // Cuota del mes vigente (abonable) para el botón "Pagar Cuota Actual".
  const currentMonthCuota = useMemo(() => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return cuotas.find((c) => c.mesAno === period && c.status !== 'PAGADA' && c.status !== 'CANCELADA' && c.totalAmount > 0);
  }, [cuotas]);

  // Si el usuario tildó cuotas, el botón paga la selección; si no (o solo tildó la vigente),
  // paga la cuota del mes actual.
  const onlyCurrentSelected =
    selectedCuotas.length === 1 && currentMonthCuota != null && selectedCuotas[0].id === currentMonthCuota.id;
  const payMode: 'current' | 'selected' =
    selectedCuotas.length === 0 || onlyCurrentSelected ? 'current' : 'selected';
  const cuotasToPay = payMode === 'current' ? (currentMonthCuota ? [currentMonthCuota] : []) : selectedCuotas;
  const canPay = payMode === 'current' ? currentMonthCuota != null : selectedCuotas.length > 0;

  const toggleCuota = (id: number) => {
    setSelectedCuotaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedCuotaIds(allSelected ? [] : [...selectableIds]);
  };

  const openCheckout = () => {
    if (cuotasToPay.length === 0) return;
    setCheckoutCuotas(cuotasToPay);
  };

  const handlePaymentSuccessMany = (paidCuotas: MemberCuota[]) => {
    updateCuotas(paidCuotas);
    setSelectedCuotaIds([]);
  };

  return (
    <div className="app-shell flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar y Header: interfaz de la app, se ocultan al imprimir */}
      <div data-print-hide className="print-hidden">
        <Sidebar />
      </div>
      <div className="app-main flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <div data-print-hide className="print-hidden">
          <Header />
        </div>
        <main className="flex-1 w-full min-w-0 overflow-y-auto pt-16 px-4 pb-32 md:pt-6 md:px-6 md:pb-6 space-y-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Encabezado */}
            <div data-print-hide className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Finanzas & Membresía
                </span>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5 mt-1">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                  Mis Cuotas
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Gestioná tus comprobantes, revisá tu estado de cuenta y aboná tus cuotas.
                </p>
              </div>
              {exemptionLabel && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 self-start md:self-auto">
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Beneficio Activo</p>
                    <p className="text-xs text-slate-300 font-medium">{exemptionLabel}</p>
                  </div>
                </div>
              )}
              <AnimatePresence mode="wait" initial={false}>
                {isCanceledPendingEnd ? (
                  <motion.div
                    key="reactivate"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="self-start md:self-auto"
                  >
                    <button
                      type="button"
                      onClick={handleReactivate}
                      disabled={reactivating}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all duration-300 ease-in-out flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      {reactivating ? 'Reactivando...' : 'Reactivar Membresía'}
                    </button>
                  </motion.div>
                ) : showCancelButton ? (
                  <motion.div
                    key="cancel"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="self-start md:self-auto"
                  >
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-semibold text-xs transition-all duration-300 ease-in-out flex items-center gap-2"
                    >
                      Cancelar Membresía
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="subscribe"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="self-start md:self-auto"
                  >
                    <button
                      type="button"
                      onClick={() => setShowMembershipModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all duration-300 ease-in-out flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <UserPlus className="w-4 h-4" />
                      Suscribirme al Club
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {isCanceledPendingEnd && (
                <motion.div
                  key="baja-banner"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">
                      Baja Solicitada - Activo hasta {nextDueDate ? new Date(nextDueDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'el vencimiento'}
                    </p>
                    <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                      Solicitaste la baja de tu membresía, pero tenés acceso total a las instalaciones hasta el vencimiento de tu cuota por haberla abonado. Podés reactivarla en cualquier momento sin cargo adicional.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-sm font-medium">Cargando tu estado de cuenta...</span>
              </div>
            ) : cuotas.length > 0 ? (
              <>
                {!isSocio && (
                  <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 md:p-5 flex items-center gap-3.5 shadow-xl">
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Activación de Membresía Pendiente</h4>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        Tu membresía se activará automáticamente una vez acreditado el pago de tu primera cuota social.
                      </p>
                    </div>
                  </div>
                )}
                <AccountStatusCard
                  globalStatus={globalStatus}
                  totalPendingAmount={totalPending}
                  mode={payMode}
                  selectedTotal={selectedTotal}
                  canPay={canPay}
                  onPay={openCheckout}
                  formatCurrency={fmt}
                />
                <CuotasList
                  cuotas={cuotas}
                  settings={settings}
                  selectedCuotaIds={selectedCuotaIds}
                  allSelected={allSelected}
                  onToggleSelectAll={toggleSelectAll}
                  onToggleCuota={toggleCuota}
                  onViewReceipt={setSelectedReceipt}
                  formatCurrency={fmt}
                />
              </>
            ) : !isSocio ? (
              <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-6 sm:px-12 bg-slate-900/60 rounded-3xl border border-slate-800/80 shadow-2xl w-full">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400 shadow-lg shadow-emerald-500/5">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">No tenés cuotas sociales asociadas</h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-2 mb-8 max-w-md leading-relaxed">
                  Asociate al club para acceder a todos los beneficios, reservas de canchas y descuentos exclusivos con tu membresía activa.
                </p>
                <button
                  type="button"
                  onClick={() => setShowMembershipModal(true)}
                  className="w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-6 sm:px-8 py-3 text-sm sm:text-base font-bold text-slate-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/25"
                >
                  <UserPlus className="w-5 h-5" />
                  Suscribirme al Club
                </button>
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-slate-900/50 rounded-3xl border border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/5">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Aún no tienes cuotas registradas</h3>
                <p className="text-slate-400 mt-2">Para comenzar, uníte a un club o seleccioná un plan de membresía.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <CheckoutModal
        cuota={null}
        cuotas={checkoutCuotas ?? undefined}
        onClose={() => setCheckoutCuotas(null)}
        onPaymentSuccess={(updated) => { updateCuota(updated); setSelectedCuotaIds([]); }}
        onPaymentSuccessMany={handlePaymentSuccessMany}
        onViewReceipt={(c) => { setCheckoutCuotas(null); const u = cuotas.find(q => q.id === c.id) || c; setSelectedReceipt(u); }}
        formatCurrency={fmt}
      />

      <ReceiptModal
        cuota={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        formatCurrency={fmt}
      />

      <MembershipModal
        open={showMembershipModal}
        onClose={() => {
          setShowMembershipModal(false);
          window.location.reload();
        }}
      />

      {showCancelModal && (
        <CancelMembershipModal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelSubscription}
          confirming={cancelling}
          nextDueDate={nextDueDate}
        />
      )}
    </div>
  );
};

export default MisCuotas;
