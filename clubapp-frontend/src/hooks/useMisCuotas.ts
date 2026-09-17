import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentsService } from '../services/paymentsService';
import type { FeeSettings, UserExemption, RoleExemption, MemberCuota } from '../types/cuotas';

export function useMisCuotas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FeeSettings>({
    baseFeeAmount: 150000, lateFeePercentage: 10, lateFeeType: 'percentage', dueDayOfMonth: 15,
  });
  const [exemptionLabel, setExemptionLabel] = useState('');
  const [cuotas, setCuotas] = useState<MemberCuota[]>([]);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sData, eData] = await Promise.all([
        paymentsService.getSettings().catch(() => ({ baseFeeAmount: 150000, lateFeePercentage: 10, lateFeeType: 'percentage' as const, dueDayOfMonth: 15 })),
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
      buildCuotas(sData, discount, label);
    } catch (err) {
      console.error('Error al cargar datos de cuotas:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildCuotas = (s: FeeSettings, discount: number, reason: string) => {
    const base = s.baseFeeAmount ?? 150000;
    const due = s.dueDayOfMonth ?? 15;
    const lfType = s.lateFeeType ?? 'percentage';
    const lfVal = s.lateFeePercentage ?? 10;
    const today = new Date();
    const curDay = today.getDate();
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    const mNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const gen: MemberCuota[] = [];
    for (let i = 0; i < 4; i++) {
      let m = curMonth - i;
      let y = curYear;
      if (m < 0) { m += 12; y -= 1; }
      const isPaid = i > 0;
      const dd = String(due).padStart(2, '0');
      const mm = String(m + 1).padStart(2, '0');
      const fecha = `${dd}/${mm}/${y}`;
      const isOverdue = !isPaid && (y < curYear || (y === curYear && m < curMonth) || (y === curYear && m === curMonth && curDay > due));
      const discAmt = (base * discount) / 100;
      const afterDisc = Math.max(0, base - discAmt);
      let lf = 0; let ll = '';
      if (isOverdue && afterDisc > 0) {
        if (lfType === 'percentage') { lf = (afterDisc * lfVal) / 100; ll = `+${lfVal}% Mora`; }
        else { lf = lfVal; ll = `+$${lfVal.toLocaleString('es-AR')} Mora`; }
      }
      const total = afterDisc + lf;
      const status: MemberCuota['status'] = isPaid ? 'PAGADA' : isOverdue ? 'EN_MORA' : 'PENDIENTE';
      const methods = ['Mercado Pago', 'Tarjeta Débito Visa', 'Transferencia Bancaria'];
      gen.push({
        id: `cuota-${y}-${mm}`, periodo: `${mNames[m]} ${y}`, mesAno: `${y}-${mm}`, fechaVencimiento: fecha,
        baseAmount: base, discountPercentage: discount, discountReason: discount > 0 ? reason : undefined,
        isOverdue, lateFeeAmount: lf, lateFeeLabel: ll, totalAmount: total, status,
        paidAt: isPaid ? `${String(Math.floor(Math.random() * 15) + 1).padStart(2, '0')}/${mm}/${y} 14:30` : undefined,
        paymentMethod: isPaid ? methods[i - 1] || 'Mercado Pago' : undefined,
        receiptNumber: isPaid ? `REC-${y}-${mm}${Math.floor(100 + Math.random() * 900)}` : undefined,
      });
    }
    setCuotas(gen);
  };

  const updateCuota = (updated: MemberCuota) => {
    setCuotas(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const totalPending = cuotas.filter(c => c.status !== 'PAGADA').reduce((s, c) => s + c.totalAmount, 0);
  const hasOverdue = cuotas.some(c => c.status === 'EN_MORA');
  const hasPending = cuotas.some(c => c.status === 'PENDIENTE');
  const globalStatus: 'AL_DIA' | 'PENDIENTE' | 'EN_MORA' = hasOverdue ? 'EN_MORA' : hasPending ? 'PENDIENTE' : 'AL_DIA';

  return { loading, settings, exemptionLabel, cuotas, totalPending, globalStatus, updateCuota };
}
