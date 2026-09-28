import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, RefreshCw, Copy, Check, ShieldCheck, Building2, Lock, Clock } from 'lucide-react';
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

/** Resuelve el ID numÃ©rico primario de la cuota (Payment.Id) a partir del objeto cuota. */
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
  const [transferReference, setTransferReference] = useState('');
  const [transferPending, setTransferPending] = useState(false);
  const [transferProofFile, setTransferProofFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Campos de tarjeta: NO se guardan en el state de React. Se leen desde el DOM
  // (refs) Ãºnicamente al confirmar, para tokenizarlos en el cliente vÃ­a Mercado Pago.
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const cardNameRef = useRef<HTMLInputElement>(null);
  const cardExpiryRef = useRef<HTMLInputElement>(null);
  const cardCvcRef = useRef<HTMLInputElement>(null);

  if (!cuota) return null;

  // Todos los mÃ©todos (Mercado Pago, Tarjeta y Transferencia) suman el costo
  // del servicio digital ATRIO al total (3.5% - mÃ¡x $1.500).
  const digitalServiceFee = computeDigitalServiceFee(cuota.totalAmount);
  const totalToPay = cuota.totalAmount + digitalServiceFee;

  // Alias del receptor final del cobro (Club o Profesor). Viene resuelto por el backend
  // desde GET /api/payments/mine; si no está disponible, se usa el alias por defecto.
  const transferAlias = cuota.transferAlias || 'CLUB.ATLETICO.MP';
  const payoutCollector = cuota.payoutCollector || 'Club';

  const handleProcess = async () => {
    console.log('--- INICIO HANDLE PAYMENT ---', cuota);

    try {
      const cuotaId = resolveCuotaId(cuota);
      if (cuotaId === null) {
        console.error('[pago] cuotaId invÃ¡lido. No se enviarÃ¡ la peticiÃ³n.', {
          cuota,
          idReal: (cuota as any)?.idReal,
          cuotaIdField: (cuota as any)?.cuotaId,
          id: cuota?.id,
        });
        alert('No se pudo iniciar el pago: no se pudo identificar la cuota.');
        return;
      }

      // ========== Tarjeta: TokenizaciÃ³n Branded ==========
      // Los datos de la tarjeta se tokenizan en el navegador con el SDK de
      // Mercado Pago. El backend (.NET) recibe ÃšNICAMENTE el token devuelto,
      // nunca los nÃºmeros de tarjeta ni datos sensibles.
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

        // TokenizaciÃ³n en el cliente (createCardToken). Los datos NO salen del
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
        alert(result?.message ?? 'El pago no fue aprobado. IntentÃ¡ nuevamente.');
        return;
      }

      // ========== Mercado Pago: redirecciÃ³n a Checkout Pro ==========
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
        // tambiÃ©n se aceptan las variantes camelCase / sandbox por si cambia la
        // serializaciÃ³n o la versiÃ³n de la API de Mercado Pago.
        const initPoint = order?.init_point ?? order?.initPoint ?? order?.sandboxInitPoint;
        if (!initPoint) {
          console.error('[create-order] La respuesta no incluye init_point.', { order });
          throw new Error('No se recibiÃ³ init_point de Mercado Pago');
        }

        console.info('[create-order] Redirigiendo a init_point de Mercado Pago.', { initPoint });
        window.location.href = initPoint;
        return;
      }

      // ========== Transferencia bancaria ==========
      // Se registra en el backend como PENDING (pendiente de aprobaciÃ³n del club)
      // con la comisiÃ³n ATRIO (MarketplaceFee) para auditorÃ­a/facturaciÃ³n.
      if (method === 'transfer') {
        setIsProcessing(true);

        const reference = transferReference.trim();
        // Permite registrar transferencia con referencia o con comprobante (o ambos).
        if (!reference && !transferProofFile) {
          setIsProcessing(false);
          alert('Ingresá el N° de operación O adjuntá una foto/PDF del comprobante para continuar');
          return;
        }

        // Opcional: si hay archivo pero no referencia, dejamos referenceNumber null.
        const referenceNumber = reference || undefined;

        const result = await paymentsService.registerTransfer(
          {
            cuotaId,
            totalAmount: totalToPay,
            netAmount: cuota.totalAmount,
            marketplaceFee: digitalServiceFee,
            referenceNumber,
          },
          transferProofFile
        );

        setIsProcessing(false);

        if (result?.success) {
          setTransferPending(true);
          return;
        }

        alert(result?.message ?? 'No se pudo registrar la transferencia. IntentÃ¡ nuevamente.');
        return;
      }

      // No deberÃ­a llegar acÃ¡ (mÃ©todo no soportado).
      setIsProcessing(false);
      alert('MÃ©todo de pago no soportado.');
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-4 space-y-3 shadow-2xl text-base h-auto overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400"><CreditCard className="w-5 h-5" /></div>
              <div><h3 className="text-lg font-bold text-white">Pasarela de Pago</h3><p className="text-base text-slate-400">Cuota Social - {cuota.periodo}</p></div>
            </div>
            {!isProcessing && (<button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"><X className="w-5 h-5" /></button>)}
          </div>

              {transferPending ? (
                <div className="py-10 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><Clock className="w-7 h-7 text-amber-400" /></div>
                <div>
                  <h4 className="text-base font-bold text-white">Transferencia registrada</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-5">
                    Tu pago por <span className="text-slate-200 font-semibold">{formatCurrency(totalToPay)}</span> quedó
                    <span className="text-amber-300 font-semibold"> pendiente de aprobación</span> por el club.
                  </p>
                  <p className="text-base text-slate-500 mt-2">Referencia: {transferReference || '—'}</p>
                </div>
                <button onClick={onClose} className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition">
                  Entendido
                </button>
              </div>
            ) : isSuccess ? (
              <PaymentSuccessView cuota={cuota} onViewReceipt={onViewReceipt} />
            ) : isProcessing ? (
              <div className="py-12 text-center space-y-3"><RefreshCw className="w-9 h-9 animate-spin text-emerald-400 mx-auto" /><p className="text-sm font-bold text-white">Procesando pago seguro...</p></div>
            ) : (
              <>
                <PaymentSummaryBox
                  cuota={cuota}
                  formatCurrency={formatCurrency}
                  digitalServiceFee={digitalServiceFee}
                  totalToPay={totalToPay}
                />

                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setMethod('mercadopago')} className={`p-2.5 rounded-xl border text-base font-medium flex flex-col items-center gap-1 ${method === 'mercadopago' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="font-extrabold text-sm">mp</span><span>Mercado Pago</span></button>
                  <button type="button" onClick={() => setMethod('card')} className={`p-2.5 rounded-xl border text-base font-medium flex flex-col items-center gap-1 ${method === 'card' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><CreditCard className="w-4 h-4" /><span>Tarjeta</span></button>
                  <button type="button" onClick={() => setMethod('transfer')} className={`p-2.5 rounded-xl border text-base font-medium flex flex-col items-center gap-1 ${method === 'transfer' ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><Building2 className="w-4 h-4" /><span>Transferencia</span></button>
                </div>

                {method === 'transfer' && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-2.5 rounded-lg flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-slate-500 block text-[9px] uppercase">ALIAS CBU · {payoutCollector}</span>
                          <span className="font-mono text-slate-200 text-base font-bold truncate">{transferAlias}</span>
                        </div>

                        <button
                          onClick={() => copy(transferAlias)}
                          className="text-emerald-400 hover:underline text-[11px] flex items-center gap-1 shrink-0"
                          aria-label="Copiar alias CBU"
                        >
                          {copiedCbu ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCbu ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-base font-semibold text-slate-200">N° de Operación</label>
                        <input
                          type="text"
                          value={transferReference}
                          onChange={(e) => setTransferReference(e.target.value)}
                          placeholder="Ej: 000123456789"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-base text-white placeholder:text-slate-600 outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex-1 h-px bg-slate-800" />
                      — o bien —
                      <span className="flex-1 h-px bg-slate-800" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-base font-semibold text-slate-200">Comprobante (Foto o PDF)</label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,application/pdf"
                        className="sr-only"
                        tabIndex={-1}
                        aria-hidden="true"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (!file) {
                            setTransferProofFile(null);
                            return;
                          }

                          const allowed = ['image/jpeg','image/png','application/pdf'];
                          const maxSizeMb = 5;
                          const maxBytes = maxSizeMb * 1024 * 1024;

                          if (!allowed.includes(file.type)) {
                            alert('Formato no válido. Solo se aceptan JPG, PNG o PDF.');
                            e.target.value = '';
                            setTransferProofFile(null);
                            return;
                          }

                          if (file.size > maxBytes) {
                            alert(`El archivo es demasiado grande. Máximo ${maxSizeMb}MB.`);
                            e.target.value = '';
                            setTransferProofFile(null);
                            return;
                          }

                          setTransferProofFile(file);
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-purple-500/60 bg-purple-500/10 hover:bg-purple-500/15 text-purple-200 py-2 px-3 text-sm font-medium transition"
                        aria-label="Adjuntar comprobante (foto o PDF)"
                      >
                        <span aria-hidden="true">📁</span>
                        <span>{transferProofFile ? 'Cambiar archivo' : 'Adjuntar Comprobante (Foto o PDF)'}</span>
                      </button>

                      {transferProofFile && (
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                          <span className="text-xs font-semibold text-emerald-200 truncate">{transferProofFile.name}</span>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 hover:bg-emerald-500/15 px-2 py-0.5 font-bold text-xs"
                            aria-label="Quitar archivo"
                            onClick={() => {
                              setTransferProofFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            (X)
                          </button>
                        </div>
                      )}

                    </div>

                    <p className="text-sm text-slate-300">
                      Completa al menos uno de los dos datos para confirmar.
                    </p>
                  </div>
                )}
                
                {method === 'card' && (
                  <div className="space-y-3">
                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-base text-sky-200 flex items-center gap-2">
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

              </>
            )}
            {!transferPending && !isSuccess && !isProcessing && (
              <div className="border-t border-slate-800 pt-3">
                <button
                  onClick={handleProcess}
                  disabled={
                    isProcessing ||
                    (method === 'transfer' && !transferReference.trim() && !transferProofFile)
                  }
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 mb-1 rounded-2xl transition text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Confirmar Pago {formatCurrency(totalToPay)}</span>
                </button>
              </div>
            )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


