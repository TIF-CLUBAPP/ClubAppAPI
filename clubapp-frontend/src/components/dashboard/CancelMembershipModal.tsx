import { AlertTriangle } from 'lucide-react';

interface CancelMembershipModalProps {
  /** Abre/cierra el modal (AnimatePresence no es obligatorio: se monta solo cuando está abierto). */
  open: boolean;
  /** Cierra el modal sin cancelar (botón "Volver"). */
  onClose: () => void;
  /** Ejecuta la cancelación real de la membresía (botón "Confirmar Baja Programada"). */
  onConfirm: () => void;
  /** true mientras la solicitud de cancelación está en proceso (deshabilita ambos botones). */
  confirming?: boolean;
  /** Fecha de vencimiento del período vigente (para el aviso de no reembolso). */
  nextDueDate?: string;
}

const formatDate = (iso?: string): string => {
  if (!iso) return 'el vencimiento de tu período';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'el vencimiento de tu período';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Modal unificado y reutilizable para confirmar la baja de la membresía.
 *
 * Diseño único compartido entre el Dashboard (tarjeta de membresía) y la vista
 * "Mis Cuotas" (header). Aísla la presentación de la lógica de cancelación para
 * evitar divergencias visuales y de comportamiento entre ambas pantallas.
 */
export default function CancelMembershipModal({
  open,
  onClose,
  onConfirm,
  confirming = false,
  nextDueDate,
}: CancelMembershipModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-[#080d1a] border border-slate-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded-xl shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-xl font-bold tracking-tight">
              ¿Querés solicitar la baja de tu membresía?
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mt-2">
              Tu membresía del mes actual ya se encuentra pagada y no cuenta con reembolso.
              Mantendrás todos tus beneficios de Socio hasta la fecha de vencimiento de tu cuota
              ({formatDate(nextDueDate)}). A partir de ese día no se emitirán nuevas cuotas.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 font-medium px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-950/20 flex items-center gap-2 disabled:opacity-50"
          >
            {confirming ? 'Procesando...' : 'Confirmar Baja Programada'}
          </button>
        </div>
      </div>
    </div>
  );
}
