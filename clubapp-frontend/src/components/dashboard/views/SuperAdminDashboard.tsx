import ClubMapWidget from '../ClubMapWidget';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, AlertCircle, ArrowRight, UserPlus, Search, RefreshCw } from 'lucide-react';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import type { DashboardStats } from '../../../types/dashboard';

// Formato de números locales (ej: 1.240)
const formatNumber = (value: number) => value.toLocaleString('es-AR');

// Formato de moneda ARS sin decimales (ej: $ 4.850.000)
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

function SkeletonCard() {
  return (
    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 animate-pulse h-full">
      <div className="h-4 w-28 rounded bg-slate-800 mb-3" />
      <div className="h-8 w-24 rounded bg-slate-800 mb-2" />
      <div className="h-3 w-32 rounded bg-slate-800/60" />
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
  icon,
  iconClass,
  children,
}: {
  label: string;
  value: string;
  highlight?: string;
  icon: React.ReactNode;
  iconClass: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl border ${iconClass}`}>{icon}</div>
      </div>
      <p className={`text-3xl font-black ${highlight ?? 'text-white'}`}>{value}</p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

// Tarjeta de Socios: métrica principal (activos), crecimiento del mes,
// barra de progreso sobre el total y total registrado en badge claro.
function MembersStatsCard({ stats }: { stats: DashboardStats | null }) {
  const activos = stats?.sociosActivos ?? 0;
  const total = stats?.totalSocios ?? 0;
  const nuevos = stats?.nuevosEsteMes ?? 0;
  const activePercent = total > 0 ? Math.round((activos / total) * 100) : 0;

  return (
    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 relative overflow-hidden h-full">
      {/* Decoración sutil de fondo */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={15} className="text-emerald-400" /> Socios
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users size={18} />
          </div>
        </div>

        {/* Métrica principal + indicador de crecimiento */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-black text-white">{stats ? formatNumber(activos) : '—'}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Activos</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold whitespace-nowrap">
            +{formatNumber(nuevos)} este mes
          </span>
        </div>

        {/* Barra de progreso: % de activos sobre el total */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-500 font-medium">Activos sobre el total</span>
            <span className="text-[10px] font-bold text-emerald-400">{activePercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${activePercent}%` }}
            />
          </div>
        </div>

        {/* Footer: total registrados en badge claro */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-medium">Total registrados</span>
          <span className="text-xs font-bold text-white bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
            {stats ? `${formatNumber(activos)} / ${formatNumber(total)}` : '— / —'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Tarjeta de Cuotas Vencidas: cantidad real de cuotas impagas + monto total adeudado
// con botón interactivo que lleva a la vista de gestión de deudores (/deudores).
function OverdueFeesCard({ stats }: { stats: DashboardStats | null }) {
  const navigate = useNavigate();
  const vencidas = stats?.cuotasVencidas ?? 0;
  const montoDeuda = stats?.montoTotalDeuda ?? 0;
  const hasDebt = vencidas > 0;

  return (
    <div className="relative flex flex-col justify-between h-full min-h-55 p-5 rounded-2xl bg-slate-900/90 border border-rose-500/20 shadow-lg">
      {/* Decoración sutil de fondo */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col flex-1 min-w-0">
        {/* BLOQUE SUPERIOR: título + métricas */}
        <div>
          {/* Encabezado */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cuotas Vencidas
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle size={18} />
            </div>
          </div>

          {/* Métricas: cuota impaga y total adeudado */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-3xl font-bold text-rose-500">{stats ? formatNumber(vencidas) : '—'}</p>
              <p className="text-xs text-slate-400 mt-1">
                cuota{vencidas !== 1 ? 's' : ''} impaga{vencidas !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{stats ? formatCurrency(montoDeuda) : '—'}</p>
              <p className="text-xs text-slate-400 mt-1">Total adeudado</p>
            </div>
          </div>
        </div>

        {/* BLOQUE INFERIOR: botón anclado al fondo de la tarjeta */}
        <div className="mt-auto pt-4">
          <button
            onClick={() => navigate('/deudores')}
            disabled={!hasDebt}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {hasDebt ? (
              <>
                Revisar lista de deudores <ArrowRight size={16} />
              </>
            ) : (
              'Sin deudas pendientes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { stats, loading, refreshing, error, lastUpdated, refresh } = useDashboardStats();

  return (
    <div className="space-y-6">
      {/* KPIs Principales (datos reales en tiempo real) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Métricas del Club
            {lastUpdated && !refreshing && (
              <span className="text-[10px] font-medium text-slate-500">
                · actualizado {lastUpdated.toLocaleTimeString('es-AR')}
              </span>
            )}
          </h3>

          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-all disabled:opacity-50"
            title="Actualizar estadísticas ahora"
            aria-label="Actualizar estadísticas"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>

        {/* Skeletons en la primera carga */}
        {loading && !stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tarjeta de Socios (activos, total registrado y nuevos del mes) */}
              <MembersStatsCard stats={stats} />

              {/* Recaudación Mes */}
              <KpiCard
                label="Recaudación Mes"
                value={stats ? formatCurrency(stats.monthlyRevenue) : '—'}
                icon={<DollarSign size={18} />}
                iconClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              >
                <span className="text-[10px] text-emerald-400 font-bold inline-block">
                  {stats ? Math.round(stats.collectedPercentage) : 0}% Cobrado
                </span>
              </KpiCard>

              {/* Cuotas Vencidas */}
              <OverdueFeesCard stats={stats} />
            </div>

            {/* Aviso de error (mantiene los últimos datos visibles) */}
            {error && (
              <div className="mt-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-xs text-rose-300 font-medium">{error}</p>
                <button
                  onClick={refresh}
                  className="text-xs font-bold text-rose-300 hover:text-rose-200 underline underline-offset-2"
                >
                  Reintentar
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Grid Secundario */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ClubMapWidget />
        </div>

        {/* Acciones Rápidas de Administración */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4">Acciones de Gestión</h3>

            <div className="space-y-3">
              <button className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2">
                <UserPlus size={16} /> Registrar Nuevo Socio
              </button>

              <button className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 font-semibold rounded-2xl text-xs transition-all flex items-center justify-center gap-2">
                <Search size={16} /> Buscar Ficha de Socio
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-6 text-center">
            <p className="text-[10px] text-slate-500">ClubApp Panel Administrativo v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}


