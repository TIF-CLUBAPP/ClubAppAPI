import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, RefreshCw, Sparkles } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import type { MemberCuota } from '../types/cuotas';
import { useMisCuotas } from '../hooks/useMisCuotas';
import { AccountStatusCard } from '../components/cuotas/AccountStatusCard';
import { CuotasList } from '../components/cuotas/CuotasList';
import { CheckoutModal } from '../components/cuotas/CheckoutModal';
import { ReceiptModal } from '../components/cuotas/ReceiptModal';
import { cuotaNumericId } from '../utils/cuotaIds';

const fmt = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

export const MisCuotas: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');

    if (status) {
      if (status === 'success') {
        alert(`¡Pago registrado exitosamente! ${paymentId ? `(ID: ${paymentId})` : ''}`);
      } else if (status === 'failure') {
        alert('El pago no pudo completarse. Por favor, intenta nuevamente.');
      } else if (status === 'pending') {
        alert('Tu pago está pendiente de procesamiento.');
      }
      
      // Limpiar URL eliminando los parámetros de consulta
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);


  const { loading, settings, exemptionLabel, cuotas, totalPending, globalStatus, updateCuota, updateCuotas } = useMisCuotas();
  const [selectedCuotaIds, setSelectedCuotaIds] = useState<number[]>([]);
  const [checkoutCuotas, setCheckoutCuotas] = useState<MemberCuota[] | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<MemberCuota | null>(null);

  // Cuotas abonables (Pendiente / En Mora) y sus IDs para la selección múltiple.
  const selectableCuotas = useMemo(() => cuotas.filter((c) => c.status !== 'PAGADA'), [cuotas]);
  const selectableIds = useMemo(() => selectableCuotas.map((c) => cuotaNumericId(c)), [selectableCuotas]);

  const selectedCuotas = useMemo(
    () => cuotas.filter((c) => c.status !== 'PAGADA' && selectedCuotaIds.includes(cuotaNumericId(c))),
    [cuotas, selectedCuotaIds],
  );
  const selectedTotal = selectedCuotas.reduce((s, c) => s + c.totalAmount, 0);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedCuotaIds.includes(id));

  const toggleCuota = (id: number) => {
    setSelectedCuotaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedCuotaIds(allSelected ? [] : [...selectableIds]);
  };

  const openCheckout = () => {
    if (selectedCuotas.length === 0) return;
    setCheckoutCuotas(selectedCuotas);
  };

  const handlePaymentSuccessMany = (paidCuotas: MemberCuota[]) => {
    updateCuotas(paidCuotas);
  };

  return (
    <div className="app-shell flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar y Header: interfaz de la app, se ocultan al imprimir */}
      <div data-print-hide className="print-hidden">
        <Sidebar />
      </div>
      <div className="app-main flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
        <div data-print-hide className="print-hidden">
          <Header />
        </div>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin space-y-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Encabezado */}
            <div data-print-hide className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-emerald-400" />
                  Mis Cuotas
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Gestioná tus comprobantes, revisá tu estado de cuenta y aboná tus cuotas.
                </p>
              </div>
              {exemptionLabel && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 self-start md:self-auto">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
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
            ) : (
              <>
                <AccountStatusCard
                  globalStatus={globalStatus}
                  totalPendingAmount={totalPending}
                  selectedCount={selectedCuotas.length}
                  selectedTotal={selectedTotal}
                  allSelected={allSelected}
                  onPaySelected={openCheckout}
                  onToggleSelectAll={toggleSelectAll}
                  formatCurrency={fmt}
                />
                <CuotasList
                  cuotas={cuotas}
                  settings={settings}
                  selectedCuotaIds={selectedCuotaIds}
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
        onPaymentSuccess={(updated) => { updateCuota(updated); }}
        onPaymentSuccessMany={handlePaymentSuccessMany}
        onViewReceipt={(c) => { setCheckoutCuotas(null); const u = cuotas.find(q => q.id === c.id) || c; setSelectedReceipt(u); }}
        formatCurrency={fmt}
      />

      <ReceiptModal
        cuota={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        formatCurrency={fmt}
      />
    </div>
  );
};

export default MisCuotas;
