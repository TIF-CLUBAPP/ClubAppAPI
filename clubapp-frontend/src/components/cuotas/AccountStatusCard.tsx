import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, CreditCard, ChevronRight, ListChecks, Eraser } from 'lucide-react';

interface AccountStatusCardProps {
  globalStatus: 'AL_DIA' | 'PENDIENTE' | 'EN_MORA';
  totalPendingAmount: number;
  /** Cantidad de cuotas seleccionadas para abonar. */
  selectedCount: number;
  /** Monto total de las cuotas seleccionadas. */
  selectedTotal: number;
  /** true si todas las cuotas abonables están seleccionadas. */
  allSelected: boolean;
  onPaySelected: () => void;
  onToggleSelectAll: () => void;
  formatCurrency: (val: number) => string;
}

export const AccountStatusCard: React.FC<AccountStatusCardProps> = ({
  globalStatus,
  totalPendingAmount,
  selectedCount,
  selectedTotal,
  allSelected,
  onPaySelected,
  onToggleSelectAll,
  formatCurrency,
}) => {
  return (
    <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
                className={`text-3xl md:text-4xl font-extrabold tracking-tight mt-0.5 ${
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
                : 'Seleccioná las cuotas que querés abonar y pagalas todas juntas en una sola operación, con acreditación inmediata.'}
            </p>
          </div>
        </div>

        {totalPendingAmount > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-slate-800 pt-5">
            <button
              onClick={onPaySelected}
              disabled={selectedCount === 0}
              className="flex-1 flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed"
            >
              <CreditCard className="w-5 h-5" />
              <span>
                Pagar Cuotas Seleccionadas ({selectedCount}){' '}
                <span className="font-extrabold">{formatCurrency(selectedTotal)}</span>
              </span>
              <ChevronRight className="w-4 h-4 opacity-75" />
            </button>

            <button
              onClick={onToggleSelectAll}
              className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition"
            >
              {allSelected ? (
                <>
                  <Eraser className="w-4 h-4" />
                  <span>Desmarcar Todas</span>
                </>
              ) : (
                <>
                  <ListChecks className="w-4 h-4" />
                  <span>Seleccionar Todas</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
