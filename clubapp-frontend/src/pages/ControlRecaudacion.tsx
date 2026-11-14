import { useCallback, useEffect, useState } from 'react';
import { DollarSign, CreditCard, KeyRound, Dumbbell, TrendingUp, RefreshCw, Loader2, ShieldAlert } from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import type { ControlRecaudacion, RangoTemporal } from '../types/dashboard';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

const RANGOS: { value: RangoTemporal; label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
];

/** Gráfico de barras apiladas (cuotas/alquileres/actividades) en SVG, sin dependencias. */
function IngresosChart({ data }: { data: ControlRecaudacion['serieTemporal'] }) {
  if (data.length === 0) {
    return <p className="text-xs text-slate-500 py-8 text-center">Sin ingresos para el rango seleccionado.</p>;
  }
  const W = 720;
  const H = 220;
  const pad = 24;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;
  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const slot = plotW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Gráfico de ingresos">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={pad} x2={W - pad} y1={pad + plotH * (1 - f)} y2={pad + plotH * (1 - f)} stroke="#1e293b" strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const cx = pad + slot * i + slot / 2;
        const bw = slot * 0.5;
        const hCuo = (d.cuotas / maxTotal) * plotH;
        const hAlq = (d.alquileres / maxTotal) * plotH;
        const hAct = (d.actividades / maxTotal) * plotH;
        const yAct = pad + plotH - hAct;
        const yAlq = yAct - hAlq;
        const yCuo = yAlq - hCuo;
        return (
          <g key={d.clave}>
            <rect x={cx - bw / 2} y={yAct} width={bw} height={hAct} className="fill-sky-500" />
            <rect x={cx - bw / 2} y={yAlq} width={bw} height={hAlq} className="fill-amber-500" />
            <rect x={cx - bw / 2} y={yCuo} width={bw} height={hCuo} className="fill-emerald-500" />
            <text x={cx} y={H - 6} textAnchor="middle" className="fill-slate-500" fontSize={9}>{d.etiqueta}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ControlRecaudacion() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const [rango, setRango] = useState<RangoTemporal>('anio');
  const [data, setData] = useState<ControlRecaudacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getControlRecaudacion(rango);
      setData(res);
    } catch {
      setError('No se pudieron cargar los datos de recaudación.');
    } finally {
      setLoading(false);
    }
  }, [rango]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-emerald-500 selection:text-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header />
        <main className="flex-1 w-full min-w-0 overflow-y-auto pt-16 px-4 pb-32 md:pt-6 md:px-6 md:pb-6">
          {!isAdmin ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center max-w-lg mx-auto mt-10">
              <ShieldAlert size={40} className="mx-auto text-rose-400" />
              <h2 className="mt-3 text-lg font-bold text-white">Acceso restringido</h2>
              <p className="mt-1 text-sm text-slate-400">Solo los administradores pueden ver este panel.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <DollarSign className="text-emerald-400" size={26} /> Control de Recaudación
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">Ingresos del club desglosados por categoría.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-1">
                    {RANGOS.map((r) => (
                      <button key={r.value} onClick={() => setRango(r.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${rango === r.value ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={load} disabled={loading} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 transition disabled:opacity-50" aria-label="Actualizar">
                    <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-400' : ''} />
                  </button>
                </div>
              </div>

              {error && <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">{error}</div>}

              {loading && !data ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-16 flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-emerald-400" />
                </div>
              ) : data ? (
                <>
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Recaudado</p>
                    <p className="text-4xl font-black text-white leading-none">{formatCurrency(data.totalGeneral)}</p>
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <BreakdownItem label="Por Cuotas" value={formatCurrency(data.totalCuotas)} icon={<CreditCard size={18} />} tone="emerald" />
                      <BreakdownItem label="Por Alquileres" value={formatCurrency(data.totalAlquileres)} icon={<KeyRound size={18} />} tone="amber" />
                      <BreakdownItem label="Por Actividades" value={formatCurrency(data.totalActividades)} icon={<Dumbbell size={18} />} tone="sky" />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-white flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" /> Ingresos Temporales</h2>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Cuotas</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Alquileres</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Actividades</span>
                      </div>
                    </div>
                    <IngresosChart data={data.serieTemporal} />
                  </div>
                </>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


function BreakdownItem({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'emerald' | 'amber' | 'sky' }) {
  const toneClasses = { emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20', sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20' };
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className={`inline-flex p-2 rounded-xl border ${toneClasses[tone]}`}>{icon}</div>
      <p className="mt-3 text-xl font-black text-white leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400 font-medium">{label}</p>
    </div>
  );
}

