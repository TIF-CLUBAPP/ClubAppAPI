import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, CreditCard, ChevronRight } from 'lucide-react';

interface AccountStatusCardProps {
  globalStatus: 'AL_DIA' | 'PENDIENTE' | 'EN_MORA';
  totalPendingAmount: number;
  /** 'current' => paga la cuota del mes vigente; 'selected' => paga las cuotas tildadas. */
  mode: 'current' | 'selected';
  /** Monto total de las cuotas tildadas (solo se muestra en modo 'selected'). */
  selectedTotal: number;
  /** Habilita el botón principal de pago. */
  canPay: boolean;
  onPay: () => void;
  formatCurrency: (val: number) => string;
}

export const AccountStatusCard: React.FC<AccountStatusCardProps> = ({
  globalStatus,
  totalPendingAmount,
  mode,
  selectedTotal,
  canPay,
  onPay,
  formatCurrency,
}) => {
  return (
    <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-5 shadow-2xl">
      {/* Glowing background FX */}
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
          globalStatus === 'AL_DIA'
            ? 'bg-emerald-500'
            : globalStatus === 'EN_MORA'
            ? 'bg-rose-500'
            : 'bg-amber-500'
        }`}
      />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Estado de Cuenta
              </span>
              {globalStatus === 'AL_DIA' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Al día
                </span>
              )}
              {globalStatus === 'PENDIENTE' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  Pendiente de Pago
                </span>
              )}
              {globalStatus === 'EN_MORA' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  En Mora
                </span>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-400">Monto Total Pendiente</span>
              <p
                className={`text-2xl md:text-3xl font-extrabold tracking-tight mt-0.5 ${
                  totalPendingAmount > 0
                    ? globalStatus === 'EN_MORA'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {formatCurrency(totalPendingAmount)}
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {globalStatus === 'AL_DIA'
                ? '¡Excelente! No tenés cuotas impagas en este momento. Mantenés tu carnet habilitado para reservas e instalaciones.'
                : 'Aboná tu cuota actual o tildá varias cuotas para pagarlas juntas en una sola operación, con acreditación inmediata.'}
            </p>
          </div>

          {/* Botón destacado: esquina superior derecha de la tarjeta. */}
          {canPay && (
            <div className="lg:self-center shrink-0">
              <button
                onClick={onPay}
                className="inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-sm">
                  {mode === 'selected' ? (
                    <>
                      Pagar Seleccionadas <span className="font-extrabold">{formatCurrency(selectedTotal)}</span>
                    </>
                  ) : (
                    'Pagar Cuota Actual'
                  )}
                </span>
                <ChevronRight className="w-4 h-4 opacity-75" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
