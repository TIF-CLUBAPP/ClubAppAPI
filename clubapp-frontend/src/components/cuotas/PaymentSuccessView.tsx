import React from 'react';
import { CheckCircle2, Receipt } from 'lucide-react';
import type { MemberCuota } from '../../types/cuotas';

interface PaymentSuccessViewProps {
  cuota: MemberCuota;
  onViewReceipt: (cuota: MemberCuota) => void;
}

export const PaymentSuccessView: React.FC<PaymentSuccessViewProps> = ({
  cuota,
  onViewReceipt,
}) => {
  return (
    <div className="py-6 text-center space-y-4">
      <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <h4 className="text-xl font-bold text-white">¡Pago Realizado con Éxito!</h4>
        <p className="text-xs text-slate-400 mt-1">
          Se acreditó correctamente el pago de <span className="text-white font-semibold">{cuota.periodo}</span>.
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Comprobante Nº:</span>
          <span className="font-mono text-emerald-400 font-bold">{cuota.receiptNumber || 'REC-2026-9941'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Método:</span>
          <span className="text-slate-200 font-medium">{cuota.paymentMethod || 'En línea'}</span>
        </div>
      </div>

      <button
        onClick={() => onViewReceipt(cuota)}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg"
      >
        <Receipt className="w-4 h-4" />
        <span>Ver Comprobante Oficial</span>
      </button>
    </div>
  );
};
