import React from 'react';
import { Calendar, Clock, Receipt } from 'lucide-react';
import type { MemberCuota, FeeSettings } from '../../types/cuotas';
import { cuotaNumericId } from '../../utils/cuotaIds';

interface CuotasListProps {
  cuotas: MemberCuota[];
  settings: FeeSettings;
  /** IDs numéricos de las cuotas seleccionadas para abonar (pago agrupado). */
  selectedCuotaIds: number[];
  onToggleCuota: (cuotaId: number) => void;
  onViewReceipt: (cuota: MemberCuota) => void;
  formatCurrency: (val: number) => string;
}

export const CuotasList: React.FC<CuotasListProps> = ({
  cuotas,
  settings,
  selectedCuotaIds,
  onToggleCuota,
  onViewReceipt,
  formatCurrency,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          Historial y Próximos Vencimientos
        </h2>
        <span className="text-xs text-slate-400">
          Vencimiento: día <span className="text-emerald-400 font-bold">{settings.dueDayOfMonth}</span>
        </span>
      </div>

      <div className="space-y-4">
        {cuotas.map((cuota) => {
          const isPaid = cuota.status === 'PAGADA';
          const isMora = cuota.status === 'EN_MORA';
          const selectable = !isPaid;
          const cuotaId = cuotaNumericId(cuota);
          const checked = selectable && selectedCuotaIds.includes(cuotaId);

          return (
            <div
              key={cuota.id}
              className={`bg-slate-950/80 border rounded-2xl p-5 transition-all ${
                checked
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : isMora
                  ? 'border-rose-500/30 bg-rose-950/10'
                  : !isPaid
                  ? 'border-amber-500/30 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {selectable ? (
                    <label
                      className="relative inline-flex items-center shrink-0 cursor-pointer"
                      aria-label={`Seleccionar cuota ${cuota.periodo}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleCuota(cuotaId)}
                        className="peer sr-only"
                      />
                      <span className="w-5 h-5 rounded-md border border-slate-600 bg-slate-900 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                        <svg
                          className={`w-3.5 h-3.5 text-slate-950 ${checked ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    </label>
                  ) : (
                    <span className="w-5 h-5 shrink-0" aria-hidden="true" />
                  )}

                  <div className="space-y-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{cuota.periodo}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        isMora ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isPaid ? 'Pagada' : isMora ? 'En Mora' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Vencimiento: <span className="font-semibold text-slate-300">{cuota.fechaVencimiento}</span>
                    </p>
                  </div>
                </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Base</span>
                    <span className="text-xs font-semibold text-slate-200">{formatCurrency(cuota.baseAmount)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Descuento</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {cuota.discountPercentage > 0 
                        ? `-${cuota.discountPercentage}% ${cuota.discountReason ? `(${cuota.discountReason.split(' ')[0]})` : ''}` 
                        : 'Sin desc.'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Recargo</span>
                    <span className="text-xs font-bold text-rose-400">{cuota.lateFeeAmount > 0 ? cuota.lateFeeLabel : 'Sin recargo'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4">
                  <div className="text-left lg:text-right">
                    <span className="block text-[10px] text-slate-400">Total</span>
                    <span className={`text-lg font-extrabold ${isMora ? 'text-rose-400' : !isPaid ? 'text-amber-400' : 'text-white'}`}>
                      {formatCurrency(cuota.totalAmount)}
                    </span>
                  </div>

                  {isPaid ? (
                    <button
                      onClick={() => onViewReceipt(cuota)}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3 py-2 rounded-xl border border-slate-700 transition text-xs"
                    >
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>Comprobante</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                      {checked ? 'Seleccionada' : 'Tildá para abonar'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
