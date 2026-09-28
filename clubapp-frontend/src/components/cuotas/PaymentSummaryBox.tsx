import React from 'react';
import type { MemberCuota } from '../../types/cuotas';
import { DIGITAL_SERVICE_FEE_PERCENTAGE, DIGITAL_SERVICE_FEE_MAX_AMOUNT } from '../../config/fees';

interface PaymentSummaryBoxProps {
  cuota: MemberCuota;
  formatCurrency: (val: number) => string;
  /** Costo del servicio digital ATRIO ya calculado (0 si no aplica). */
  digitalServiceFee: number;
  /** Total final a abonar (incluye el costo del servicio si corresponde). */
  totalToPay: number;
}

export const PaymentSummaryBox: React.FC<PaymentSummaryBoxProps> = ({
  cuota,
  formatCurrency,
  digitalServiceFee,
  totalToPay,
}) => (
  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-1.5 text-sm">
    <div className="flex justify-between text-slate-400">
      <span>Concepto:</span>
      <span className="text-slate-200 font-medium">Cuota {cuota.periodo}</span>
    </div>
    <div className="flex justify-between text-slate-400">
      <span>Precio Base:</span>
      <span className="text-base text-slate-200 font-semibold">{formatCurrency(cuota.baseAmount)}</span>
    </div>
    {cuota.discountPercentage > 0 && (
      <div className="flex justify-between text-emerald-400">
        <span>Descuento Exención (-{cuota.discountPercentage}%):</span>
        <span className="text-base font-semibold">-{formatCurrency((cuota.baseAmount * cuota.discountPercentage) / 100)}</span>
      </div>
    )}
    {cuota.lateFeeAmount > 0 && (
      <div className="flex justify-between text-rose-400">
        <span>Recargo por Mora:</span>
        <span className="text-base font-semibold">+{formatCurrency(cuota.lateFeeAmount)}</span>
      </div>
    )}
    {digitalServiceFee > 0 && (
      <div className="flex justify-between text-sky-400">
        <span>
          Costo Servicio Digital ATRIO ({DIGITAL_SERVICE_FEE_PERCENTAGE}% - máx{' '}
          {formatCurrency(DIGITAL_SERVICE_FEE_MAX_AMOUNT)}):
        </span>
        <span className="text-base font-semibold">+{formatCurrency(digitalServiceFee)}</span>
      </div>
    )}
    <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-base text-white">
      <span>Total a Abonar:</span>
      <span className="text-emerald-400 text-lg">{formatCurrency(totalToPay)}</span>
    </div>
  </div>
);
