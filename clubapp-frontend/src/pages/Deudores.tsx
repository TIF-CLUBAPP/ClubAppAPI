import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  IdCard,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Users,
  X,
  Lock,
  Unlock,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { cuotasService } from '../services/cuotasService';
import type { CuotaVencida, CuotasVencidasStats } from '../types/deudores';

const formatNumber = (value: number) => value.toLocaleString('es-AR');

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

const getInitials = (nombre: string, apellido: string) =>
  `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase() || '?';

/**
 * Mapeo de nombres de meses en español a número (0-11 para Date)
 */
const MESES_MAP: Record<string, number> = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
  'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
  'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
  'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3,
  'may': 4, 'jun': 5, 'jul': 6, 'ago': 7,
  'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
};

/**
 * Parsea un período string ("Mes Año" o "MM/YYYY") y devuelve un objeto Date
 * representando la fecha de vencimiento (día 10 del mes).
 * Retorna null si no se puede parsear.
 */
const parsePeriodoToDate = (periodo: string): Date | null => {
  if (!periodo) return null;
  
  // Formato MM/YYYY
  const matchMMYYYY = periodo.match(/^(\d{2})\/(\d{4})$/);
  if (matchMMYYYY) {
    const [, mesStr, añoStr] = matchMMYYYY;
    const mes = parseInt(mesStr, 10) - 1; // 0-indexed
    const año = parseInt(añoStr, 10);
    if (mes >= 0 && mes <= 11) {
      return new Date(año, mes, 10); // Día 10 como fecha de vencimiento
    }
    return null;
  }
  
  // Formato "Mes Año" (ej: "Julio 2026", "sep 2025")
  const matchMesAño = periodo.match(/^(\w+)\s+(\d{4})$/i);
  if (matchMesAño) {
    const [, mesStr, añoStr] = matchMesAño;
    const mesLower = mesStr.toLowerCase();
    const mes = MESES_MAP[mesLower] ?? MESES_MAP[mesLower.substring(0, 3)];
    const año = parseInt(añoStr, 10);
    if (mes !== undefined) {
      return new Date(año, mes, 10); // Día 10 como fecha de vencimiento
    }
    return null;
  }
  
  return null;
};

/**
 * Calcula los días de mora basándose en el período más antiguo adeudado.
 * Busca la fecha de vencimiento más antigua entre todos los periodosVencidos
 * y calcula la diferencia con la fecha actual.
 */
const calcularDiasMora = (periodosVencidos: string[]): number => {
  if (!periodosVencidos || periodosVencidos.length === 0) return 0;
  
  const hoy = new Date();
  // Normalizar a solo fecha (sin hora) para comparación justa
  hoy.setHours(0, 0, 0, 0);
  
  let fechaVencimientoMasAntigua: Date | null = null;
  
  for (const periodo of periodosVencidos) {
    const fechaVenc = parsePeriodoToDate(periodo);
    if (fechaVenc) {
      if (!fechaVencimientoMasAntigua || fechaVenc < fechaVencimientoMasAntigua) {
        fechaVencimientoMasAntigua = fechaVenc;
      }
    }
  }
  
  if (!fechaVencimientoMasAntigua) return 0;
  
  const diffTiempo = hoy.getTime() - fechaVencimientoMasAntigua.getTime();
  const diasMora = Math.max(0, Math.floor(diffTiempo / (1000 * 60 * 60 * 24)));
  
  return diasMora;
};

/**
 * Formatea un período de "Mes Año" (ej. "Julio 2026") a "MM/YYYY" (ej. "07/2026")
 * También maneja formatos como "MM/YYYY" directamente.
 */
const formatPeriodo = (periodo: string): string => {
  if (!periodo) return '—';
  
  // Si ya está en formato MM/YYYY, devolverlo tal cual
  if (/^\d{2}\/\d{4}$/.test(periodo)) return periodo;
  
  // Intentar parsear "Mes Año" o "MesAño"
  const match = periodo.match(/^(\w+)\s+(\d{4})$/i);
  if (match) {
    const [, mesStr, año] = match;
    const mesLower = mesStr.toLowerCase();
    const mesNum = MESES_MAP[mesLower] ?? MESES_MAP[mesLower.substring(0, 3)];
    if (mesNum !== undefined) {
      const mesFormatted = String(mesNum + 1).padStart(2, '0');
      return `${mesFormatted}/${año}`;
    }
  }
  
  // Fallback: devolver el original si no se puede parsear
  return periodo;
};

/**
 * Obtiene el texto formateado para mostrar en la columna "PERÍODOS ADEUDADOS".
 * Si no hay períodos válidos, devuelve "Adeuda cuota".
 */
function getTextoPeriodos(deudor: CuotaVencida): string {
  const periodosValidos = Array.isArray(deudor?.periodosVencidos)
    ? deudor.periodosVencidos.filter(p => p && String(p).trim() !== '')
    : [];

  if (periodosValidos.length > 0) {
    return periodosValidos.join(', ');
  }

  return 'Adeuda cuota';
}

type SortKey = 'deuda-desc' | 'deuda-asc' | 'atraso-desc' | 'atraso-asc' | 'nombre';

function SummaryCard({
  label,
  value,
  sub,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl border ${iconClass}`}>{icon}</div>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</p>}
    </div>
  );
}

// Tarjeta móvil de deudor (pantallas menores a md)
function DebtorCard({
  debtor,
  onPay,
  onNotify,
}: {
  debtor: CuotaVencida;
  onPay: (d: CuotaVencida) => void;
  onNotify: (d: CuotaVencida) => void;
}) {
  const hasPhone = (debtor.telefono || '').replace(/\D/g, '').length >= 8;
  const cuotasLabel = `${debtor.cantidadCuotasImpagas} cuota${debtor.cantidadCuotasImpagas !== 1 ? 's' : ''}`;
  const diasLabel = `${debtor.diasDeAtraso} día${debtor.diasDeAtraso !== 1 ? 's' : ''}`;

  return (
    <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900/80">
      {/* Encabezado: avatar, nombre y email */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-linear-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
          {getInitials(debtor.nombre, debtor.apellido)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white truncate">
            {debtor.nombre} {debtor.apellido}
          </p>
          <p className="text-xs text-slate-400 truncate">{debtor.email}</p>
        </div>
      </div>

      {/* DNI y teléfono */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <FileText size={11} className="shrink-0" />
        <span className="truncate">{debtor.dni || '—'}</span>
        <span className="text-slate-600 shrink-0">·</span>
        <Phone size={11} className="shrink-0" />
        <span className="truncate">{debtor.telefono || '—'}</span>
      </div>

      {/* Períodos adeudados */}
      <div className="mt-2.5">
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {getTextoPeriodos(debtor)}
          </span>
        </div>
      </div>

      {/* Monto adeudado + antigüedad */}
      <div className="mt-3 pt-3 border-t border-slate-800 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl font-black text-rose-400 truncate">
            {formatCurrency(debtor.montoTotalAdeudado)}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            {cuotasLabel} impaga{debtor.cantidadCuotasImpagas !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold whitespace-nowrap shrink-0">
          <Clock size={11} /> {diasLabel}
        </span>
      </div>

      {/* Acciones */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onPay(debtor)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
        >
          <CreditCard size={14} /> Registrar Pago
        </button>
        <button
          onClick={() => onNotify(debtor)}
          title="Notificar por WhatsApp o email"
          className="shrink-0 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all"
        >
          {hasPhone ? <MessageCircle size={16} /> : <Mail size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function Deudores() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const [debtors, setDebtors] = useState<CuotaVencida[]>([]);
  const [stats, setStats] = useState<CuotasVencidasStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('deuda-desc');

  const [paymentTarget, setPaymentTarget] = useState<CuotaVencida | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ debtor: CuotaVencida; status: boolean } | null>(null);
  const [modalStatus, setModalStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const toastTimer = useRef<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRaw, statsData] = await Promise.all([
        cuotasService.getOverdueList(),
        cuotasService.getOverdueStats(),
      ]);
      
      // Enriquecer con cálculo de días de mora real
      const list = listRaw.map(d => ({
        ...d,
        diasDeAtraso: calcularDiasMora(d.periodosVencidos)
      }));

      setDebtors(list);
      setStats(statsData);
    } catch (err) {
      console.error('Error cargando deudores:', err);
      setError('No se pudieron cargar los deudores en este momento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [loadData]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  };

  // Buscador por nombre / DNI / email
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return debtors;
    return debtors.filter(
      (d) =>
        `${d.nombre} ${d.apellido}`.toLowerCase().includes(term) ||
        d.dni.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term)
    );
  }, [debtors, search]);

  // Ordenamiento por monto o antigüedad de la deuda
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case 'deuda-asc':
        return list.sort((a, b) => a.montoTotalAdeudado - b.montoTotalAdeudado);
      case 'atraso-desc':
        return list.sort((a, b) => b.diasDeAtraso - a.diasDeAtraso);
      case 'atraso-asc':
        return list.sort((a, b) => a.diasDeAtraso - b.diasDeAtraso);
      case 'nombre':
        return list.sort((a, b) =>
          `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, 'es')
        );
      case 'deuda-desc':
      default:
        return list.sort((a, b) => b.montoTotalAdeudado - a.montoTotalAdeudado);
    }
  }, [filtered, sort]);

  const openPaymentModal = (debtor: CuotaVencida) => {
    setPaymentTarget(debtor);
    setModalStatus('idle');
    setModalError(null);
  };

  const closePaymentModal = () => {
    setPaymentTarget(null);
    setModalStatus('idle');
    setModalError(null);
  };

  // Registra el pago de todas las cuotas impagas del socio (una por una)
  const confirmPayment = async () => {
    if (!paymentTarget) return;
    setModalStatus('processing');
    setModalError(null);
    try {
      for (const id of paymentTarget.paymentIds) {
        await cuotasService.registrarPago(id);
      }
      setModalStatus('success');
    } catch (err) {
      console.error('Error registrando pago:', err);
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setModalError(apiMessage ?? 'No se pudo registrar el pago. Intentá nuevamente.');
      setModalStatus('error');
    }
  };

  // Alternar bloqueo manual
  const initiateToggleUserStatus = (debtor: CuotaVencida, currentStatus: boolean) => {
    setBlockTarget({ debtor, status: currentStatus });
  };

  const toggleUserStatus = async () => {
    if (!blockTarget) return;
    const { debtor, status: estaBloqueado } = blockTarget;
    
    try {
      await cuotasService.updateUserStatus(debtor.socioId, !estaBloqueado); // isActive = !estaBloqueado
      showToast(`Socio ${estaBloqueado ? 'bloqueado' : 'desbloqueado'} correctamente.`);
      setBlockTarget(null);
      loadData(); // Recargar datos
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      showToast('Error al actualizar el estado del socio.');
      setBlockTarget(null);
    }
  };

  const finishPayment = () => {
    const debtor = paymentTarget;
    closePaymentModal();
    loadData();
    if (debtor) {
      showToast(
        `Cobro registrado: ${debtor.nombre} ${debtor.apellido} · ${formatCurrency(debtor.montoTotalAdeudado)}`
      );
    }
  };

  const notifyByWhatsApp = (d: CuotaVencida) => {
    const periodosFormateados = d.periodosVencidos.map(p => formatPeriodo(p)).join(', ');
    const message =
      `Hola ${d.nombre}, te recordamos que tenés ${d.cantidadCuotasImpagas} cuota(s) impaga(s) ` +
      `(${periodosFormateados}) por un total de ${formatCurrency(d.montoTotalAdeudado)}. ` +
      `Acercate a caja para regularizar tu situación. ¡Gracias!`;
    const digits = (d.telefono || '').replace(/\D/g, '');
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  };

  const notifyByEmail = (d: CuotaVencida) => {
    const periodosFormateados = d.periodosVencidos.map(p => formatPeriodo(p)).join(', ');
    const message =
      `Hola ${d.nombre}, te recordamos que tenés ${d.cantidadCuotasImpagas} cuota(s) impaga(s) ` +
      `(${periodosFormateados}) por un total de ${formatCurrency(d.montoTotalAdeudado)}. ` +
      `Acercate a caja para regularizar tu situación. ¡Gracias!`;
    window.open(
        `mailto:${d.email}?subject=${encodeURIComponent('Recordatorio de cuota vencida')}&body=${encodeURIComponent(message)}`,
        '_blank',
        'noopener'
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          {!isStaff ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center max-w-lg mx-auto mt-10">
              <AlertTriangle className="mx-auto text-amber-400" size={40} />
              <h2 className="mt-4 text-xl font-black text-white">Acceso restringido</h2>
              <p className="mt-2 text-sm text-slate-400">
                Solo los administradores pueden gestionar deudores y cuotas impagas.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-6 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
              >
                Volver al Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Encabezado de la página */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Tesorería · Cobranzas
                  </span>
                  <h1 className="text-2xl font-black text-white mt-1">Gestión de Deudores</h1>
                  <p className="text-xs text-slate-400">
                    Cuotas impagas, cobros en caja y recordatorios de pago.
                  </p>
                </div>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-400' : ''} />
                  Actualizar
                </button>
              </div>

              {/* Resumen: deudores, cuotas impagas y monto total */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard
                  label="Deudores"
                  value={loading && !debtors.length ? '—' : formatNumber(debtors.length)}
                  sub="Socios con deuda activa"
                  icon={<Users size={18} />}
                  iconClass="bg-violet-500/10 text-violet-400 border-violet-500/20"
                />
                <SummaryCard
                  label="Cuotas impagas"
                  value={loading && !stats ? '—' : formatNumber(stats?.totalCuotasVencidas ?? 0)}
                  sub="Cuotas vencidas sin cobrar"
                  icon={<AlertTriangle size={18} />}
                  iconClass="bg-rose-500/10 text-rose-400 border-rose-500/20"
                />
                <SummaryCard
                  label="Monto total adeudado"
                  value={loading && !stats ? '—' : formatCurrency(stats?.montoTotalDeuda ?? 0)}
                  sub="Incluye recargo por mora"
                  icon={<Clock size={18} />}
                  iconClass="bg-amber-500/10 text-amber-400 border-amber-500/20"
                />
              </div>

              {/* Buscador y ordenamiento */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="relative w-full sm:flex-1 sm:max-w-md">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, DNI o email..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <ArrowUpDown size={15} className="text-slate-500 shrink-0" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="flex-1 sm:flex-none px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
                  >
                    <option value="deuda-desc">Monto: mayor a menor</option>
                    <option value="deuda-asc">Monto: menor a mayor</option>
                    <option value="atraso-desc">Antigüedad: mayor a menor</option>
                    <option value="atraso-asc">Antigüedad: menor a mayor</option>
                    <option value="nombre">Nombre (A-Z)</option>
                  </select>
                </div>
              </div>
              {/* Lista / tabla de deudores */}
              {loading && !debtors.length ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                  <div className="divide-y divide-slate-800/60">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="p-5 animate-pulse flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 rounded bg-slate-800" />
                          <div className="h-3 w-64 rounded bg-slate-800/60" />
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                ) : error && !debtors.length ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center">
                    <AlertCircle className="mx-auto text-rose-400" size={38} />
                    <h3 className="mt-3 text-base font-bold text-white">No se pudo cargar la lista</h3>
                    <p className="mt-1 text-xs text-slate-400">{error}</p>
                    <button
                      onClick={loadData}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all"
                    >
                      <RefreshCw size={13} /> Reintentar
                    </button>
                  </div>
                ) : !sorted.length ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center">
                    <Inbox className="mx-auto text-slate-600" size={38} />
                    <h3 className="mt-3 text-base font-bold text-white">
                      {search ? 'Sin resultados' : 'No hay deudores'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {search
                        ? 'Probá con otro término de búsqueda.'
                        : 'Todas las cuotas están al día. ¡Excelente!'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Tarjetas de deudores — pantallas pequeñas (menos de md) */}
                    <div className="md:hidden space-y-3">
                      {sorted.map((d) => (
                        <DebtorCard
                          key={d.socioId}
                          debtor={d}
                          onPay={openPaymentModal}
                          onNotify={notifyDebtor}
                        />
                      ))}
                    </div>

                    {/* Tabla de deudores — pantallas md en adelante */}
                    <div className="hidden md:block rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                      <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full text-left text-sm min-w-245">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3 sm:px-5 sm:py-3.5 text-center font-bold text-slate-500 whitespace-nowrap min-w-55">SOCIO</th>
                          <th className="px-4 py-3 sm:px-5 sm:py-3.5 text-center font-bold text-slate-500 whitespace-nowrap min-w-37.5">DNI / Teléfono</th>
                          <th className="px-4 py-3 sm:px-5 sm:py-3.5 text-center font-bold text-slate-500 whitespace-nowrap min-w-50">Períodos adeudados</th>
                          <th className="px-4 py-3 sm:px-5 sm:py-3.5 text-center font-bold text-slate-500 whitespace-nowrap min-w-30">Monto</th>
                          <th className="px-4 py-3 sm:px-5 sm:py-3.5 text-center font-bold text-slate-500 whitespace-nowrap min-w-27.5">DÍAS EN MORA</th>
                          <th className="px-4 py-3 sm:px-5 sm:py-3.5 text-center font-bold text-slate-500 whitespace-nowrap min-w-55">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {sorted.map((d) => (
                          <tr key={d.socioId} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3 sm:px-5 sm:py-4 min-w-55">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                                  {getInitials(d.nombre, d.apellido)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate">
                                    {d.nombre} {d.apellido}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate">{d.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center align-middle">
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-1.5 text-slate-300">
                                  <IdCard className="w-4 h-4 text-slate-400" />
                                  {d.dni ? Number(d.dni).toLocaleString('es-AR') : '—'}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Phone size={11} /> {d.telefono || '—'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 sm:px-5 sm:py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                {getTextoPeriodos(d)}
                              </span>
                            </td>
                            <td className="px-4 py-3 sm:px-5 sm:py-4 text-center whitespace-nowrap">
                              <p className="font-black text-rose-400">{formatCurrency(d.montoTotalAdeudado)}</p>
                              <p className="text-[10px] text-slate-500">
                                {d.cantidadCuotasImpagas} cuota{d.cantidadCuotasImpagas !== 1 ? 's' : ''}
                              </p>
                            </td>
                            <td className="px-4 py-3 sm:px-5 sm:py-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                                <Clock size={11} /> {d.diasDeAtraso} día{d.diasDeAtraso !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3 sm:px-5 sm:py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openPaymentModal(d)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                                >
                                  <CreditCard size={13} /> Registrar Pago
                                </button>
                                {/* Botón Bloquear/Desbloquear */}
                                <button
                                  onClick={() => initiateToggleUserStatus(d, d.estaBloqueado)}
                                  className={`p-2 rounded-xl border border-slate-700 transition-all ${
                                    d.estaBloqueado
                                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                                  }`}
                                  title={d.estaBloqueado ? 'Desbloquear socio' : 'Bloquear socio'}
                                >
                                  {d.estaBloqueado ? <Unlock size={15} /> : <Lock size={15} />}
                                </button>
                                <button
                                  onClick={() => notifyDebtor(d)}
                                  title="Notificar por WhatsApp o email"
                                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all"
                                >
                                  {(d.telefono || '').replace(/\D/g, '').length >= 8 ? (
                                    <MessageCircle size={15} />
                                  ) : (
                                    <Mail size={15} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}


            </div>
          )}
        </main>
      </div>

      {/* Modal de confirmación de cobro */}
      <AnimatePresence>
        {paymentTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={modalStatus === 'processing' ? undefined : closePaymentModal}
          >
            <motion.div
              className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              {modalStatus === 'success' ? (
                <div className="text-center py-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 size={28} className="text-emerald-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-white">¡Cobro registrado!</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-5">
                    Se registraron {paymentTarget.paymentIds.length} pago(s) por{' '}
                    {formatCurrency(paymentTarget.montoTotalAdeudado)} a favor de {paymentTarget.nombre}{' '}
                    {paymentTarget.apellido}.
                  </p>
                  <button
                    onClick={finishPayment}
                    className="mt-6 w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              ) : modalStatus === 'processing' ? (
                <div className="text-center py-8">
                  <Loader2 size={32} className="mx-auto animate-spin text-emerald-400" />
                  <p className="mt-4 text-sm font-bold text-white">Registrando pago...</p>
                  <p className="text-xs text-slate-400">Liquidando cuota(s) en caja.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                        Confirmación de cobro
                      </span>
                      <h3 className="mt-1 text-lg font-black text-white">Registrar Pago</h3>
                    </div>
                    <button
                      onClick={closePaymentModal}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                        {getInitials(paymentTarget.nombre, paymentTarget.apellido)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">
                          {paymentTarget.nombre} {paymentTarget.apellido}
                        </p>
                        <p className="text-xs text-slate-400">{paymentTarget.dni || paymentTarget.email}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {getTextoPeriodos(paymentTarget)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Total ({paymentTarget.cantidadCuotasImpagas} cuota
                        {paymentTarget.cantidadCuotasImpagas !== 1 ? 's' : ''})
                      </span>
                      <span className="text-xl font-black text-rose-400">
                        {formatCurrency(paymentTarget.montoTotalAdeudado)}
                      </span>
                    </div>
                  </div>

                  {modalStatus === 'error' && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                      <AlertCircle size={15} className="shrink-0" /> {modalError}
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={closePaymentModal}
                      className="py-3 rounded-2xl border border-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmPayment}
                      className="py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard size={15} /> Confirmar Cobro
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de Bloqueo/Desbloqueo */}
      <AnimatePresence>
        {blockTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setBlockTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
                     style={{
                       backgroundColor: blockTarget.status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                       borderColor: blockTarget.status ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                     }}>
                  {blockTarget.status ? (
                    <Unlock size={32} className="text-emerald-500" />
                  ) : (
                    <Lock size={32} className="text-red-500" />
                  )}
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">
                  {blockTarget.status ? 'Confirmar Desbloqueo de Cuenta' : 'Confirmar Bloqueo de Cuenta'}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {blockTarget.status
                    ? (
                      <>
                        Al desbloquear al usuario{' '}
                        <strong className="text-white">{blockTarget.debtor.nombre} {blockTarget.debtor.apellido}</strong>
                        , recuperará el acceso inmediato a todas las funciones de la plataforma.{' '}
                        <strong>¿Deseas continuar?</strong>
                      </>
                    )
                    : (
                      <>
                        Si bloqueas al usuario{' '}
                        <strong className="text-white">{blockTarget.debtor.nombre} {blockTarget.debtor.apellido}</strong>
                        , perderá inmediatamente el acceso a las funciones activas de la plataforma.{' '}
                        <strong>¿Deseas continuar?</strong>
                      </>
                    )}
                </p>
              </div>
              <div className="border-t border-slate-800 p-4 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setBlockTarget(null)}
                  className="flex-1 py-3 rounded-2xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={toggleUserStatus}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    blockTarget.status
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {blockTarget.status ? (
                    <>
                      <Unlock size={15} /> Confirmar Desbloqueo
                    </>
                  ) : (
                    <>
                      <Lock size={15} /> Confirmar Bloqueo
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast de éxito */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold shadow-2xl backdrop-blur-md"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

