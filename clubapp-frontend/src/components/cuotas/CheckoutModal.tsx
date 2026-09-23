import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, RefreshCw, Copy, Check, ShieldCheck, Building2 } from 'lucide-react';
import type { MemberCuota } from '../../types/cuotas';
import { PaymentSuccessView } from './PaymentSuccessView';
import { PaymentSummaryBox } from './PaymentSummaryBox';
import { paymentsService } from '../../services/paymentsService';
import { hasMercadoPagoPublicKey } from '../../config/mercadopago';

interface CheckoutModalProps {
  cuota: MemberCuota | null;
  onClose: () => void;
  onPaymentSuccess: (paidCuota: MemberCuota) => void;
  onViewReceipt: (cuota: MemberCuota) => void;
  formatCurrency: (val: number) => string;
}

/** Resuelve el ID numérico primario de la cuota (Payment.Id) a partir del objeto cuota. */
const resolveCuotaId = (cuota: MemberCuota): number | null => {
  const cuotaObj = cuota as any;
  const raw = cuotaObj.idReal ?? cuotaObj.cuotaId ?? cuotaObj.id;

  if (typeof raw === 'number') {
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  }

  const digits = String(raw ?? '').replace(/\D/g, '');
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cuota,
  onClose,
  onPaymentSuccess,
  onViewReceipt,
  formatCurrency,
}) => {
  const [method, setMethod] = useState<'mercadopago' | 'card' | 'transfer'>('mercadopago');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);

  if (!cuota) return null;

  const handleProcess = async () => {
    console.log('--- INICIO HANDLE PAYMENT ---', cuota);

    try {
      // Mercado Pago: redirección a init_point
      if (method === 'mercadopago') {
        setIsProcessing(true);

        // En este flujo, "cuota" representa el pago/Payment en backend.
        // Se resuelve el ID numérico primario (Payment.Id) de forma robusta.
        const cuotaId = resolveCuotaId(cuota);
        if (cuotaId === null) {
          console.error('[create-order] cuotaId inválido. No se enviará la petición.', {
            cuota,
            idReal: (cuota as any)?.idReal,
            cuotaIdField: (cuota as any)?.cuotaId,
            id: cuota?.id,
          });
          setIsProcessing(false);
          alert('No se pudo iniciar el pago: no se pudo identificar la cuota.');
          return;
        }

        console.info('[create-order] Iniciando pago con Mercado Pago.', {
          cuotaId,
          publicKeyConfigurada: hasMercadoPagoPublicKey(),
        });

        const order = await paymentsService.createOrder(cuotaId);

        // El backend actual devuelve `init_point` (snake_case). Por robustez,
        // también se aceptan las variantes camelCase / sandbox por si cambia la
        // serialización o la versión de la API de Mercado Pago.
        const initPoint = order?.init_point ?? order?.initPoint ?? order?.sandboxInitPoint;
        if (!initPoint) {
          console.error('[create-order] La respuesta no incluye init_point.', { order });
          throw new Error('No se recibió init_point de Mercado Pago');
        }

        console.info('[create-order] Redirigiendo a init_point de Mercado Pago.', { initPoint });
        window.location.href = initPoint;
        return;
      }

      // Otros métodos: comportamiento simulado existente
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        const now = new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const updated: MemberCuota = {
          ...cuota,
          status: 'PAGADA',
          paidAt: now,
          paymentMethod:
            method === 'card' ? 'Tarjeta Débito/Crédito' : 'Transferencia CBU',
          receiptNumber: `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          isOverdue: false,
          lateFeeAmount: 0,
        };
        onPaymentSuccess(updated);
      }, 1500);
    } catch (err: any) {
      console.error('Error antes del POST:', err);
      console.error('Error detallado:', err);
      if (err?.response) {
        console.error('Respuesta original del backend:', err.response);
        console.error('Datos de la respuesta original:', err.response.data);
      }
      console.error('[create-order] No se pudo iniciar el pago con Mercado Pago.', {
        message: err?.message,
        status: err?.response?.status,
        responseData: err?.response?.data,
        cuota,
        publicKeyConfigurada: hasMercadoPagoPublicKey(),
      });
      setIsProcessing(false);
      alert(err?.response?.data?.message ?? 'No se pudo iniciar el pago con Mercado Pago.');
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCbu(true);
    setTimeout(() => setCopiedCbu(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400"><CreditCard className="w-5 h-5" /></div>
              <div><h3 className="text-base font-bold text-white">Pasarela de Pago</h3><p className="text-xs text-slate-400">Cuota Social - {cuota.periodo}</p></div>
            </div>
            {!isProcessing && (<button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"><X className="w-5 h-5" /></button>)}
          </div>

          <div className="p-6 space-y-5">
            {isSuccess ? (
              <PaymentSuccessView cuota={cuota} onViewReceipt={onViewReceipt} />
            ) : isProcessing ? (
              <div className="py-12 text-center space-y-3"><RefreshCw className="w-9 h-9 animate-spin text-emerald-400 mx-auto" /><p className="text-sm font-bold text-white">Procesando pago seguro...</p></div>
            ) : (
              <>
                <PaymentSummaryBox cuota={cuota} formatCurrency={formatCurrency} />

                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setMethod('mercadopago')} className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 ${method === 'mercadopago' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="font-extrabold text-sm">mp</span><span>Mercado Pago</span></button>
                  <button type="button" onClick={() => setMethod('card')} className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 ${method === 'card' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><CreditCard className="w-4 h-4" /><span>Tarjeta</span></button>
                  <button type="button" onClick={() => setMethod('transfer')} className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 ${method === 'transfer' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><Building2 className="w-4 h-4" /><span>Transferencia</span></button>
                </div>

                {method === 'transfer' && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <div><span className="text-slate-500 block text-[9px] uppercase">ALIAS CBU</span><span className="font-mono text-slate-200 font-bold">CLUB.ATLETICO.MP</span></div>
                      <button onClick={() => copy('CLUB.ATLETICO.MP')} className="text-emerald-400 hover:underline text-[11px] flex items-center gap-1">{copiedCbu ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}<span>{copiedCbu ? 'Copiado' : 'Copiar'}</span></button>
                    </div>
                  </div>
                )}
                
                {method === 'card' && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <input type="text" placeholder="Número de tarjeta" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="MM/AA" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500" />
                      <input type="text" placeholder="CVC" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500" />
                    </div>
                  </div>
                )}

                <button onClick={handleProcess} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl transition text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Confirmar Pago {formatCurrency(cuota.totalAmount)}</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
