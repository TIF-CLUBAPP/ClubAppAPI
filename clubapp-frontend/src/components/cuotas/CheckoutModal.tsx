import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, RefreshCw, Copy, Check, ShieldCheck, Building2, Lock } from 'lucide-react';
import type { MemberCuota } from '../../types/cuotas';
import { PaymentSuccessView } from './PaymentSuccessView';
import { PaymentSummaryBox } from './PaymentSummaryBox';
import { paymentsService } from '../../services/paymentsService';
import { getMercadoPagoInstance } from '../../config/mercadopago';
import { computeDigitalServiceFee } from '../../config/fees';

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
  const [cardError, setCardError] = useState<string | null>(null);

  // Campos de tarjeta: NO se guardan en el state de React. Se leen desde el DOM
  // (refs) únicamente al confirmar, para tokenizarlos en el cliente vía Mercado Pago.
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const cardNameRef = useRef<HTMLInputElement>(null);
  const cardExpiryRef = useRef<HTMLInputElement>(null);
  const cardCvcRef = useRef<HTMLInputElement>(null);

  if (!cuota) return null;

  // Los cobros digitales (Mercado Pago / Tarjeta) suman el costo del servicio
  // ATRIO al total. Transferencia no lleva costo digital.
  const isDigital = method === 'mercadopago' || method === 'card';
  const digitalServiceFee = isDigital ? computeDigitalServiceFee(cuota.totalAmount) : 0;
  const totalToPay = cuota.totalAmount + digitalServiceFee;

  const handleProcess = async () => {
    console.log('--- INICIO HANDLE PAYMENT ---', cuota);

    try {
      const cuotaId = resolveCuotaId(cuota);
      if (cuotaId === null) {
        console.error('[pago] cuotaId inválido. No se enviará la petición.', {
          cuota,
          idReal: (cuota as any)?.idReal,
          cuotaIdField: (cuota as any)?.cuotaId,
          id: cuota?.id,
        });
        alert('No se pudo iniciar el pago: no se pudo identificar la cuota.');
        return;
      }

      // ========== Tarjeta: Tokenización Branded ==========
      // Los datos de la tarjeta se tokenizan en el navegador con el SDK de
      // Mercado Pago. El backend (.NET) recibe ÚNICAMENTE el token devuelto,
      // nunca los números de tarjeta ni datos sensibles.
      if (method === 'card') {
        setCardError(null);
        setIsProcessing(true);

        const cardNumber = (cardNumberRef.current?.value ?? '').replace(/\s+/g, '');
        const cardholderName = cardNameRef.current?.value?.trim() ?? '';
        const expiry = (cardExpiryRef.current?.value ?? '').trim();
        const securityCode = (cardCvcRef.current?.value ?? '').trim();

        if (cardNumber.length < 10 || !/^\d+$/.test(cardNumber)) {
          setCardError('Ingresá un número de tarjeta válido.');
          setIsProcessing(false);
          return;
        }
        const expiryMatch = /^(\d{1,2})\s*\/\s*(\d{2})$/.exec(expiry);
        if (!expiryMatch) {
          setCardError('Ingresá el vencimiento en formato MM/AA.');
          setIsProcessing(false);
          return;
        }
        if (!/^\d{3,4}$/.test(securityCode)) {
          setCardError('Ingresá un código de seguridad válido.');
          setIsProcessing(false);
          return;
        }

        const cardExpirationMonth = String(parseInt(expiryMatch[1], 10));
        const cardExpirationYear = `20${expiryMatch[2]}`;

        // Tokenización en el cliente (createCardToken). Los datos NO salen del
        // navegador: solo viaja el token resultante.
        const cardToken = await getMercadoPagoInstance().createCardToken({
          cardNumber,
          cardholderName,
          cardExpirationMonth,
          cardExpirationYear,
          securityCode,
        });

        if (!cardToken?.id) {
          throw new Error('No se pudo tokenizar la tarjeta con Mercado Pago.');
        }

        const result = await paymentsService.payWithCard(cuotaId, cardToken.id);

        if (result?.success && result.status === 'approved') {
          setIsProcessing(false);
          setIsSuccess(true);
          const now = new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          onPaymentSuccess({
            ...cuota,
            status: 'PAGADA',
            paidAt: now,
            paymentMethod: 'Tarjeta (Mercado Pago)',
            receiptNumber: `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            isOverdue: false,
          });
          return;
        }

        setIsProcessing(false);
        alert(result?.message ?? 'El pago no fue aprobado. Intentá nuevamente.');
        return;
      }

      // ========== Mercado Pago: redirección a Checkout Pro ==========
      if (method === 'mercadopago') {
        setIsProcessing(true);

        console.info('[create-order] Iniciando pago digital.', {
          cuotaId,
          method,
          digitalServiceFee,
          totalToPay,
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

      // ========== Transferencia: comportamiento simulado (sin cobro online) ==========
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        const now = new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const updated: MemberCuota = {
          ...cuota,
          status: 'PAGADA',
          paidAt: now,
          paymentMethod: 'Transferencia CBU',
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
      console.error('[pago] No se pudo procesar el pago.', {
        message: err?.message,
        status: err?.response?.status,
        responseData: err?.response?.data,
        cuota,
        method,
      });
      setIsProcessing(false);
      alert(err?.response?.data?.message ?? err?.message ?? 'No se pudo procesar el pago.');
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
                <PaymentSummaryBox
                  cuota={cuota}
                  formatCurrency={formatCurrency}
                  isDigital={isDigital}
                  digitalServiceFee={digitalServiceFee}
                  totalToPay={totalToPay}
                />

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
                  <div className="space-y-3">
                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-200 flex items-center gap-2">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>Tokenización segura: los datos se procesan en Mercado Pago y no se guardan en nuestro sistema.</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Titular de la tarjeta</label>
                      <input ref={cardNameRef} type="text" inputMode="text" autoComplete="cc-name" placeholder="Nombre como figura en la tarjeta" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Número de tarjeta</label>
                      <input ref={cardNumberRef} type="text" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 outline-none focus:border-emerald-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Vencimiento</label>
                        <input ref={cardExpiryRef} type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 outline-none focus:border-emerald-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Código de seguridad</label>
                        <input ref={cardCvcRef} type="text" inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 outline-none focus:border-emerald-500" />
                      </div>
                    </div>

                    {cardError && (
                      <p className="text-xs text-rose-400 font-medium">{cardError}</p>
                    )}
                  </div>
                )}

                <button onClick={handleProcess} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl transition text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Confirmar Pago {formatCurrency(totalToPay)}</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
