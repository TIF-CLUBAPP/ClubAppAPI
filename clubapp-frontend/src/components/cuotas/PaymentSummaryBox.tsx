import React from 'react';
import type { MemberCuota } from '../../types/cuotas';

interface PaymentSummaryBoxProps {
  cuota: MemberCuota;
  formatCurrency: (val: number) => string;
}

export const PaymentSummaryBox: React.FC<PaymentSummaryBoxProps> = ({ cuota, formatCurrency }) => (
  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1.5 text-xs">
    <div className="flex justify-between text-slate-400">
      <span>Concepto:</span>
      <span className="text-slate-200">Cuota {cuota.periodo}</span>
    </div>
    <div className="flex justify-between text-slate-400">
      <span>Precio Base:</span>
      <span>{formatCurrency(cuota.baseAmount)}</span>
    </div>
    {cuota.discountPercentage > 0 && (
      <div className="flex justify-between text-emerald-400">
        <span>Descuento Exención (-{cuota.discountPercentage}%):</span>
        <span>-{formatCurrency((cuota.baseAmount * cuota.discountPercentage) / 100)}</span>
      </div>
    )}
    {cuota.lateFeeAmount > 0 && (
      <div className="flex justify-between text-rose-400">
        <span>Recargo por Mora:</span>
        <span>+{formatCurrency(cuota.lateFeeAmount)}</span>
      </div>
    )}
    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
      <span>Total a Abonar:</span>
      <span className="text-emerald-400 text-base">{formatCurrency(cuota.totalAmount)}</span>
    </div>
  </div>
);
