import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, X, Printer } from 'lucide-react';
import type { MemberCuota } from '../../types/cuotas';
import { useAuth } from '../../context/AuthContext';

interface ReceiptModalProps {
  cuota: MemberCuota | null;
  onClose: () => void;
  formatCurrency: (val: number) => string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  cuota,
  onClose,
  formatCurrency,
}) => {
  const { user } = useAuth();

  if (!cuota) return null;

  return (
        <AnimatePresence>
      {cuota && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-print-root
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          id="receipt-modal-content"
          className="printable-receipt bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* Header Comprobante — se oculta al imprimir */}
          <div
            data-print-hide
            className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Comprobante Oficial
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar comprobante"
              data-print-hide
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo del Recibo */}
          <div className="p-6 space-y-6 text-slate-200">
            {/* Ticket: al imprimir es el ÚNICO elemento visible */}
            <div
              id="receipt-card"
              data-print-ticket
              className="printable-receipt print-box border border-slate-800 bg-slate-950 rounded-2xl p-5 space-y-4 shadow-inner"
            >
              {/* Branding del Club */}
              <div className="print-dashed flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h4 className="font-extrabold text-white text-base tracking-tight">CLUB ATLÉTICO</h4>
                  <p className="text-[10px] text-slate-500 uppercase">Sistema Oficial de Cuotas</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {cuota.receiptNumber || 'REC-2026-08012'}
                </span>
              </div>

              {/* Datos del Socio */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Socio:</span>
                  <span className="font-semibold text-white">
                    {user ? `${user.firstName || ''} ${user.lastName || ''}` : 'Socio Habilitado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-300">{user?.email || 'socio@clubatletico.com'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha de Pago:</span>
                  <span className="text-slate-300">{cuota.paidAt || '10/08/2026 14:32'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Método de Pago:</span>
                  <span className="text-slate-300">{cuota.paymentMethod || 'Mercado Pago'}</span>
                </div>
              </div>

              {/* Desglose */}
              <div className="print-dashed pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Concepto:</span>
                  <span className="font-medium text-slate-200">Cuota Social {cuota.periodo}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Monto Base:</span>
                  <span>{formatCurrency(cuota.baseAmount)}</span>
                </div>
                {cuota.discountPercentage > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Descuento Exención (-{cuota.discountPercentage}%):</span>
                    <span>-{formatCurrency((cuota.baseAmount * cuota.discountPercentage) / 100)}</span>
                  </div>
                )}
                <div className="print-dashed pt-2 border-t border-slate-800/80 flex justify-between font-bold text-sm text-white">
                  <span>Total Abonado:</span>
                  <span className="text-emerald-400 text-base">{formatCurrency(cuota.totalAmount)}</span>
                </div>
              </div>

              {/* Pie del ticket — también visible en la impresión */}
              <div className="print-dashed pt-3 border-t border-slate-800/80 text-center">
                <p className="text-[10px] text-slate-500">
                  Gracias por su pago. Conserve este comprobante.
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Documento no válido como factura.
                </p>
              </div>
            </div>

            {/* Acciones — se ocultan al imprimir */}
            <div data-print-hide className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition text-xs border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition text-xs shadow-md"
              >
                <span>Cerrar</span>
              </button>
            </div>
          </div>
                </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};
