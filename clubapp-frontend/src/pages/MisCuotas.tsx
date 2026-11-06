import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, RefreshCw, UserPlus } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import type { MemberCuota } from '../types/cuotas';
import { useMisCuotas } from '../hooks/useMisCuotas';
import { useToast } from '../context/ToastContext';
import { AccountStatusCard } from '../components/cuotas/AccountStatusCard';
import { CuotasList } from '../components/cuotas/CuotasList';
import { CheckoutModal } from '../components/cuotas/CheckoutModal';
import { ReceiptModal } from '../components/cuotas/ReceiptModal';
import MembershipModal from '../components/dashboard/MembershipModal';
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


  const { loading, settings, exemptionLabel, cuotas, totalPending, globalStatus, updateCuota, updateCuotas, isSocio } = useMisCuotas();
  const [selectedCuotaIds, setSelectedCuotaIds] = useState<number[]>([]);
  const [checkoutCuotas, setCheckoutCuotas] = useState<MemberCuota[] | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<MemberCuota | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);

  // Cuotas abonables (Pendiente / En Mora) y sus IDs para la selección múltiple.
  const selectableCuotas = useMemo(() => cuotas.filter((c) => c.status !== 'PAGADA'), [cuotas]);
  const selectableIds = useMemo(() => selectableCuotas.map((c) => cuotaNumericId(c)), [selectableCuotas]);

  const selectedCuotas = useMemo(
    () => cuotas.filter((c) => c.status !== 'PAGADA' && selectedCuotaIds.includes(cuotaNumericId(c))),
    [cuotas, selectedCuotaIds],
  );
  const selectedTotal = selectedCuotas.reduce((s, c) => s + c.totalAmount, 0);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedCuotaIds.includes(id));

  // Cuota del mes vigente (abonable) para el botón "Pagar Cuota Actual".
  const currentMonthCuota = useMemo(() => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return cuotas.find((c) => c.mesAno === period && c.status !== 'PAGADA' && c.totalAmount > 0);
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
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-sm font-medium">Cargando tu estado de cuenta...</span>
              </div>
            ) : !isSocio ? (
              <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-6 sm:px-12 bg-slate-900/60 rounded-3xl border border-slate-800/80 shadow-2xl w-full">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-400 shadow-inner">
                  <CreditCard className="w-8 h-8 sm:w-10 sm:h-10" />
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
            ) : cuotas.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-900/50 rounded-3xl border border-slate-800">
                <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white">Aún no tienes cuotas registradas</h3>
                <p className="text-slate-400 mt-2">Para comenzar, uníte a un club o seleccioná un plan de membresía.</p>
              </div>
            ) : (
              <>
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
    </div>
  );
};

export default MisCuotas;
