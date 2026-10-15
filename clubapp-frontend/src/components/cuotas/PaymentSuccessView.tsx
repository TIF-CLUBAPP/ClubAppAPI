import React from 'react';
import { CheckCircle2, Receipt } from 'lucide-react';
import type { MemberCuota } from '../../types/cuotas';

interface PaymentSuccessViewProps {
  /** Una o más cuotas que fueron abonadas en la operación. */
  cuotas: MemberCuota[];
  onViewReceipt: (cuota: MemberCuota) => void;
  formatCurrency?: (val: number) => string;
}

export const PaymentSuccessView: React.FC<PaymentSuccessViewProps> = ({
  cuotas,
  onViewReceipt,
  formatCurrency,
}) => {
  const periods = cuotas.map((c) => c.periodo).filter(Boolean);
  const totalPaid = cuotas.reduce((s, c) => s + (c.totalAmount || 0), 0);
  const receiptNumbers = cuotas.map((c) => c.receiptNumber).filter(Boolean);
  const method = cuotas[0]?.paymentMethod || 'En línea';

  return (
    <div className="py-6 text-center space-y-4">
      <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <h4 className="text-xl font-bold text-white">¡Pago Realizado con Éxito!</h4>
        <p className="text-xs text-slate-400 mt-1">
          Se acreditó correctamente el pago de{' '}
          <span className="text-white font-semibold">
            {periods.length > 1 ? `${periods.length} cuotas` : periods[0]}
          </span>
          {periods.length > 1 && <span className="text-slate-400">: {periods.join(', ')}</span>}.
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Comprobante{receiptNumbers.length !== 1 ? 's' : ''} Nº:</span>
          <span className="font-mono text-emerald-400 font-bold text-right">
            {receiptNumbers.length > 0 ? receiptNumbers.join(' · ') : 'REC-2026-9941'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Método:</span>
          <span className="text-slate-200 font-medium">{method}</span>
        </div>
        {formatCurrency && totalPaid > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Total abonado:</span>
            <span className="text-slate-200 font-medium">{formatCurrency(totalPaid)}</span>
          </div>
        )}
      </div>

      {cuotas.length === 1 ? (
        <button
          onClick={() => onViewReceipt(cuotas[0])}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg"
        >
          <Receipt className="w-4 h-4" />
          <span>Ver Comprobante Oficial</span>
        </button>
      ) : (
        <div className="space-y-2">
          {cuotas.map((c) => (
            <button
              key={c.id}
              onClick={() => onViewReceipt(c)}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition text-xs"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Ver comprobante {c.periodo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
