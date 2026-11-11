import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentsService } from '../services/paymentsService';
import type { FeeSettings, UserExemption, RoleExemption, MemberCuota, UserCuota } from '../types/cuotas';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_MAP: Record<string, MemberCuota['status']> = {
  PAID: 'PAGADA',
  OVERDUE: 'EN_MORA',
  PENDING: 'PENDIENTE',
  EXEMPT: 'PENDIENTE',
  CANCELLED: 'CANCELADA',
};

/** Convierte "yyyy-MM" a "Mes Año" (ej: "2026-09" -> "Septiembre 2026"). */
const formatPeriodName = (period: string): string => {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (match) {
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) return `${MONTH_NAMES[month - 1]} ${match[1]}`;
  }
  return period;
};

const formatPaidAt = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/** Mapea la cuota del backend (con ID numérico real) a la forma que consume la UI. */
const mapCuota = (p: UserCuota, s: FeeSettings): MemberCuota => {
  const dueDay = s.dueDayOfMonth ?? 15;
  const parts = p.period?.split('-');
  const year = parts?.[0] ?? '';
  const month = Number(parts?.[1] ?? 0);
  const mm = String(month).padStart(2, '0');
  const fecha = `${String(dueDay).padStart(2, '0')}/${mm}/${year}`;

  const status = STATUS_MAP[p.status] ?? 'PENDIENTE';
  const lateFee = Number(p.lateFeeApplied ?? 0);
  const total = Number(p.amount ?? 0) + lateFee;

  return {
    id: String(p.id),
    idReal: p.id,
    periodo: formatPeriodName(p.period),
    mesAno: p.period,
    fechaVencimiento: fecha,
    baseAmount: Number(p.amount ?? 0),
    discountPercentage: 0,
    isOverdue: status === 'EN_MORA',
    lateFeeAmount: lateFee,
    lateFeeLabel: lateFee > 0 ? `+${s.lateFeePercentage ?? 0}% Mora` : undefined,
    totalAmount: total,
    status,
    paidAt: p.paymentDate ? formatPaidAt(p.paymentDate) : undefined,
    paymentMethod: p.paymentMethod || undefined,
    receiptNumber: status === 'PAGADA' ? `REC-${year}-${mm}` : undefined,
    transferAlias: p.transferAlias || 'CLUB.ATLETICO.MP',
    payoutCollector: p.payoutCollector || 'Club',
  };
};

export function useMisCuotas() {
  const { user } = useAuth();
  const isSocio = user?.isSocio === true;
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FeeSettings>({
    baseFeeAmount: 15000, lateFeePercentage: 10, lateFeeType: 'percentage', dueDayOfMonth: 15,
  });
  const [exemptionLabel, setExemptionLabel] = useState('');
  const [cuotas, setCuotas] = useState<MemberCuota[]>([]);

  useEffect(() => { loadData(); }, [user, isSocio]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sData, eData] = await Promise.all([
        paymentsService.getSettings().catch(() => ({ baseFeeAmount: 15000, lateFeePercentage: 10, lateFeeType: 'percentage' as const, dueDayOfMonth: 15 })),
        paymentsService.getExemptions().catch(() => ({ Roles: [], Users: [] })),
      ]);
      setSettings(sData);

      let discount = 0;
      let label = '';
      if (user) {
        const ux = eData.Users?.find((u: UserExemption) => String(u.UserId) === String(user.id));
        if (ux?.IsExemptFromFees) {
          discount = ux.discountPercentage || 100;
          label = `Exención ${ux.category || 'Individual'} (-${discount}%)`;
        } else {
          const role = (user.role || 'SOCIO').toUpperCase();
          const rx = eData.Roles?.find((r: RoleExemption) => r.Role.toUpperCase() === role);
          if (rx?.AreFeesExempt) {
            discount = rx.discountPercentage ?? 100;
            label = `Exención Rol ${role} (-${discount}%)`;
          }
        }
      }
      setExemptionLabel(label);

      // Fuente de datos REAL: las cuotas vienen del backend con su ID numérico primario.
      const raw = await paymentsService.getMyCuotas();
      setCuotas(raw.map((p) => mapCuota(p, sData)));
    } catch (err) {
      console.error('Error al cargar datos de cuotas:', err);
      // Sin cuotas en el backend (o error): no fabricamos deudas fantasma.
      // La UI debe reflejar que el usuario no tiene membresía activa.
      setCuotas([]);
    } finally {
      setLoading(false);
    }
  };

  const updateCuota = (updated: MemberCuota) => {
    setCuotas(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const updateCuotas = (updatedList: MemberCuota[]) => {
    setCuotas(prev =>
      prev.map(c => {
        const match = updatedList.find(u => u.id === c.id);
        return match ?? c;
      }),
    );
  };

  const totalPending = cuotas.filter(c => c.status !== 'PAGADA' && c.status !== 'CANCELADA').reduce((s, c) => s + c.totalAmount, 0);
  const hasOverdue = cuotas.some(c => c.status === 'EN_MORA');
  const hasPending = cuotas.some(c => c.status === 'PENDIENTE');
  const globalStatus: 'AL_DIA' | 'PENDIENTE' | 'EN_MORA' = hasOverdue ? 'EN_MORA' : hasPending ? 'PENDIENTE' : 'AL_DIA';

  return { loading, settings, exemptionLabel, cuotas, totalPending, globalStatus, updateCuota, updateCuotas, isSocio, reload: loadData };
}
