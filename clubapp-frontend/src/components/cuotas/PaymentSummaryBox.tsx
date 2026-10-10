import React from 'react';
import type { MemberCuota } from '../../types/cuotas';
import { DIGITAL_SERVICE_FEE_PERCENTAGE, DIGITAL_SERVICE_FEE_MAX_AMOUNT } from '../../config/fees';

interface PaymentSummaryBoxProps {
  /** Una o más cuotas a abonar en la misma operación (pago individual o agrupado). */
  cuotas: MemberCuota[];
  formatCurrency: (val: number) => string;
  /** Costo del servicio digital ATRIO ya calculado (0 si no aplica). */
  digitalServiceFee: number;
  /** Total final a abonar (incluye el costo del servicio si corresponde). */
  totalToPay: number;
}

/** Etiqueta del concepto: período único o listado de períodos seleccionados. */
const conceptLabel = (cuotas: MemberCuota[]): string => {
  const periods = cuotas.map((c) => c.periodo).filter(Boolean);
  if (periods.length <= 1) return `Cuota Social - ${periods[0] ?? ''}`;
  return `Cuotas Sociales: ${periods.join(', ')}`;
};

export const PaymentSummaryBox: React.FC<PaymentSummaryBoxProps> = ({
  cuotas,
  formatCurrency,
  digitalServiceFee,
  totalToPay,
}) => {
  const baseAmount = cuotas.reduce((s, c) => s + (c.baseAmount || 0), 0);
  const discountAmount = cuotas.reduce(
    (s, c) => s + ((c.baseAmount || 0) * (c.discountPercentage || 0)) / 100,
    0,
  );
  const lateFeeAmount = cuotas.reduce((s, c) => s + (c.lateFeeAmount || 0), 0);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-1.5 text-sm">
      <div className="flex justify-between text-slate-400 gap-4">
        <span className="shrink-0">Concepto:</span>
        <span className="text-slate-200 font-medium text-right">{conceptLabel(cuotas)}</span>
      </div>
      <div className="flex justify-between text-slate-400">
        <span>Precio Base:</span>
        <span className="text-base text-slate-200 font-semibold">{formatCurrency(baseAmount)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-emerald-400">
          <span>Descuento Exención:</span>
          <span className="text-base font-semibold">-{formatCurrency(discountAmount)}</span>
        </div>
      )}
      {lateFeeAmount > 0 && (
        <div className="flex justify-between text-rose-400">
          <span>Recargo por Mora:</span>
          <span className="text-base font-semibold">+{formatCurrency(lateFeeAmount)}</span>
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
};

