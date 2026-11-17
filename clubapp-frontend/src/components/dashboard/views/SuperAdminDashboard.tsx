import { useState } from 'react';
import ClubMapWidget from '../ClubMapWidget';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, AlertCircle, ArrowRight, UserPlus, RefreshCw, Wallet, X, ArrowUpRight, ArrowDownRight, MapPin, CreditCard, Dumbbell, Search } from 'lucide-react';
import { useDashboardStats } from '../../../hooks/useDashboardStats';
import type { DashboardStats } from '../../../types/dashboard';
import MemberQuickSearch from '../MemberQuickSearch';

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

// Tarjeta de Socios y Usuarios: muestra de forma transparente la cantidad de
// personas Socias, la cantidad de No Socias que participan en actividades y el
// flujo mensual de altas/bajas, sin porcentajes confusos.
function MembersStatsCard({ stats }: { stats: DashboardStats | null }) {
  const navigate = useNavigate();
  const activos = stats?.sociosActivos ?? 0;
  const total = stats?.totalSocios ?? 0;
  const noSocios = stats?.noSociosEnActividades ?? 0;
  const altas = stats?.nuevosEsteMes ?? 0;
  const bajas = stats?.bajasEsteMes ?? 0;

  return (
    <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden h-full">
      {/* Decoración sutil de fondo */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={15} className="text-emerald-400" /> Socios y Usuarios
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Franja central: 3 columnas */}
        <div className="grid grid-cols-3 items-center gap-2 my-1">
          {/* Col 1: Socios activos */}
          <div>
            <p className="text-2xl font-black text-white leading-none">
              {stats ? `${formatNumber(activos)}` : '—'}
              <span className="text-[11px] font-semibold text-slate-400 ml-1">/ {stats ? formatNumber(total) : '—'}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Socios activos</p>
          </div>
          {/* Col 2: No Socios */}
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-400 leading-none">
              {stats ? formatNumber(noSocios) : '—'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">No Socios</p>
          </div>
          {/* Col 3: Altas / Bajas */}
          <div className="flex flex-col items-end gap-1 text-[11px] font-semibold leading-tight text-right">
            <span className="flex items-center gap-1 text-emerald-400">
              <ArrowUpRight size={13} /> +{formatNumber(altas)} Altas
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <ArrowDownRight size={13} /> -{formatNumber(bajas)} Bajas
            </span>
          </div>
        </div>
      </div>

      {/* Botón de acceso al panel */}
      <div className="relative mt-3">
        <button
          onClick={() => navigate('/control-socios')}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all duration-200"
        >
          Ver Control de Socios <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// Tarjeta de Recaudación del Mes: total destacado en tamaño grande y prominente,
// con desglose por Cuotas y por Actividades debajo.
function RevenueCard({ stats }: { stats: DashboardStats | null }) {
  const navigate = useNavigate();
  const total = stats?.totalRecaudado ?? 0;
  const cuotas = stats?.recaudacionCuotas ?? 0;
  const actividades = stats?.recaudacionActividades ?? 0;

  return (
    <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden h-full">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign size={15} className="text-emerald-400" /> Recaudación del Mes
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Franja central: total (izq) + desglose (der) */}
        <div className="flex items-center justify-between gap-3 my-1">
          {/* Izquierda: Total recaudado */}
          <div>
            <p className="text-3xl font-black text-white leading-none tracking-tight">
              {stats ? formatCurrency(total) : '—'}
            </p>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1">Total recaudado</p>
          </div>
          {/* Derecha: desglose en 2 líneas */}
          <div className="flex flex-col gap-1 border-l border-white/10 pl-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Cuotas:</span>
              <span className="font-bold text-white">{stats ? formatCurrency(cuotas) : '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Actividades:</span>
              <span className="font-bold text-white">{stats ? formatCurrency(actividades) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de acceso al panel */}
      <div className="relative mt-3">
        <button
          onClick={() => navigate('/control-recaudacion')}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all duration-200"
        >
          Ver Control de Recaudación <ArrowRight size={14} />
        </button>
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
    <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-900/90 border border-rose-500/20 shadow-lg relative overflow-hidden h-full">
      {/* Decoración sutil de fondo */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col flex-1 min-w-0">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cuotas Vencidas
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Franja central: cuotas impagas (izq) vs total adeudado (der) */}
        <div className="flex items-center justify-between gap-3 my-1">
          <div>
            <p className="text-3xl font-black text-rose-500 leading-none">
              {stats ? formatNumber(vencidas) : '—'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              cuota{vencidas !== 1 ? 's' : ''} impaga{vencidas !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-white leading-none">
              {stats ? formatCurrency(montoDeuda) : '—'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Total adeudado</p>
          </div>
        </div>
      </div>

      {/* Botón anclado al fondo */}
      <div className="relative mt-3">
        <button
          onClick={() => navigate('/deudores')}
          disabled={!hasDebt}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          {hasDebt ? (
            <>
              Revisar lista de deudores <ArrowRight size={14} />
            </>
          ) : (
            'Sin deudas pendientes'
          )}
        </button>
      </div>
    </div>
  );
}

function QuickActionButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-[#0B1221] p-4 text-left transition-all hover:border-emerald-500/40 hover:bg-slate-900"
    >
      <span className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block text-[11px] leading-tight text-slate-400 mt-0.5">{description}</span>
      </span>
    </button>
  );
}

export default function SuperAdminDashboard() {
  const { stats, loading, refreshing, error, lastUpdated, refresh } = useDashboardStats();
  const navigate = useNavigate();
  // Modal "Nueva Alta de Socio" oculto temporalmente (flag `false` para reactivar a futuro).
  // El alta se realiza hoy de forma asistida directa vía /register?alta=titular.
  const [showNewSocioModal, setShowNewSocioModal] = useState(false);

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
              {/* Tarjeta de Socios y Usuarios (socios, no socios y altas/bajas) */}
              <MembersStatsCard stats={stats} />

              {/* Recaudación del Mes (total + desglose cuotas/actividades) */}
              <RevenueCard stats={stats} />

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

            {/* Buscador rápido de socio (Nombre / DNI) */}
            <MemberQuickSearch />

            {/* Acciones rápidas */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <QuickActionButton
                icon={<UserPlus size={18} />}
                title="Registrar Socio"
                description="Alta titular o menor"
                onClick={() => navigate('/register?alta=titular')}
              />
              <QuickActionButton
                icon={<Wallet size={18} />}
                title="Cobro Express"
                description="Cobro de cuota en caja"
                onClick={() => navigate('/deudores')}
              />
              <QuickActionButton
                icon={<MapPin size={18} />}
                title="Crear Espacio / Cancha"
                description="Alta o edición de sectores"
                onClick={() => navigate('/espacios')}
              />
              <QuickActionButton
                icon={<CreditCard size={18} />}
                title="Editar Pagos"
                description="Gestión de cuotas y tarifas"
                onClick={() => navigate('/pagos')}
              />
              <QuickActionButton
                icon={<Dumbbell size={18} />}
                title="Nueva Actividad"
                description="Crear disciplina o taller"
                onClick={() => navigate('/gestion-actividades')}
              />
              <QuickActionButton
                icon={<Search size={18} />}
                title="Buscar Socio"
                description="Ver padrón y perfiles"
                onClick={() => navigate('/socios')}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-6 text-center">
            <p className="text-[10px] text-slate-500">ClubApp Panel Administrativo v2.0</p>
          </div>
        </div>
      </div>

      {/* Modal: tipo de alta de socio (oculto por flag `false`; reactivar cambiando a `showNewSocioModal &&`) */}
      {false && showNewSocioModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          onClick={() => setShowNewSocioModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Nueva Alta de Socio</h3>
                <p className="text-xs text-slate-400 mt-1">Elegí el tipo de alta para continuar.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSocioModal(false)}
                className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowNewSocioModal(false);
                  navigate('/register?alta=titular');
                }}
                className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition-all hover:border-emerald-500/40 hover:bg-slate-900"
              >
                <span className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <UserPlus size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">Titular Independiente</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">Alta de socio mayor de edad sin vínculo familiar.</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowNewSocioModal(false);
                  navigate('/register?alta=vinculado');
                }}
                className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left transition-all hover:border-emerald-500/40 hover:bg-slate-900"
              >
                <span className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">Vinculado / Menor / Adulto Mayor</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">Alta asociada a un titular existente.</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


