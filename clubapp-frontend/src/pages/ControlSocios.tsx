import { useCallback, useEffect, useState } from 'react';
import { Users, UserPlus, UserMinus, TrendingUp, RefreshCw, Loader2, ShieldAlert, Dumbbell, KeyRound } from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import type { ControlSocios, RangoTemporal } from '../types/dashboard';

const formatNumber = (value: number) => value.toLocaleString('es-AR');

const RANGOS: { value: RangoTemporal; label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
];

/** Gráfico de barras simple en SVG (altas/bajas) sin dependencias externas. */
function FlujoChart({ data }: { data: ControlSocios['serieTemporal'] }) {
  if (data.length === 0) {
    return <p className="text-xs text-slate-500 py-8 text-center">Sin datos para el rango seleccionado.</p>;
  }
  const W = 720;
  const H = 220;
  const pad = 24;
  const valid = data.map((d) => ({ ...d, altas: Math.max(0, d.altas), bajas: Math.max(0, d.bajas) }));
  const maxVal = Math.max(1, ...valid.map((d) => Math.max(d.altas, d.bajas)));
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;
  const slot = plotW / valid.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Gráfico de flujo de socios">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={pad} x2={W - pad} y1={pad + plotH * (1 - f)} y2={pad + plotH * (1 - f)} stroke="#1e293b" strokeWidth={1} />
      ))}
      {valid.map((d, i) => {
        const cx = pad + slot * i + slot / 2;
        const hA = (d.altas / maxVal) * plotH;
        const hB = (d.bajas / maxVal) * plotH;
        return (
          <g key={d.clave}>
            <rect x={cx - slot * 0.3} y={pad + plotH - hA} width={slot * 0.3} height={hA} rx={3} className="fill-emerald-500" />
            <rect x={cx} y={pad + plotH - hB} width={slot * 0.3} height={hB} rx={3} className="fill-rose-500" />
            <text x={cx + slot * 0.15} y={H - 6} textAnchor="middle" className="fill-slate-500" fontSize={9}>{d.etiqueta}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ControlSocios() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const [rango, setRango] = useState<RangoTemporal>('anio');
  const [data, setData] = useState<ControlSocios | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getControlSocios(rango);
      setData(res);
    } catch {
      setError('No se pudieron cargar las métricas de socios.');
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
                    <Users className="text-emerald-400" size={26} /> Control de Socios
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">Evolución del flujo de socios y usuarios del club.</p>
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
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard label="Socios Activos" value={formatNumber(data.sociosActivos)} icon={<Users size={18} />} tone="emerald" />
                    <MetricCard label="No Socios en Actividades" value={formatNumber(data.noSociosEnActividades)} icon={<Dumbbell size={18} />} tone="sky" />
                    <MetricCard label="Altas del Mes" value={`+${formatNumber(data.altasMes)}`} icon={<UserPlus size={18} />} tone="emerald" />
                    <MetricCard label="Bajas del Mes" value={`-${formatNumber(data.bajasMes)}`} icon={<UserMinus size={18} />} tone="rose" />
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-white flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" /> Flujo Temporal</h2>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Altas</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Bajas</span>
                      </div>
                    </div>
                    <FlujoChart data={data.serieTemporal} />
                  </div>


                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2"><KeyRound size={18} className="text-emerald-400" /> Estadísticas por Persona</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[560px]">
                        <thead>
                          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                            <th className="py-2 pr-4 font-semibold">Persona</th>
                            <th className="py-2 px-4 font-semibold">Tipo</th>
                            <th className="py-2 px-4 font-semibold text-center">Alquileres</th>
                            <th className="py-2 px-4 font-semibold text-center">Actividades</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.personas.map((p) => (
                            <tr key={p.userId} className="border-b border-slate-800/60">
                              <td className="py-2.5 pr-4 text-white font-medium">{p.fullName}</td>
                              <td className="py-2.5 px-4">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.esSocio ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-sky-500/10 text-sky-300 border-sky-500/20'}`}>
                                  {p.esSocio ? 'Socio' : 'No Socio'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center text-white font-bold">{p.alquileres}</td>
                              <td className="py-2.5 px-4 text-center text-white font-bold">{p.actividades}</td>
                            </tr>
                          ))}
                          {data.personas.length === 0 && (
                            <tr><td colSpan={4} className="py-6 text-center text-slate-500">Sin personas registradas.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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

function MetricCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'emerald' | 'sky' | 'rose' }) {
  const toneClasses = { emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20', rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
      <div className={`inline-flex p-2 rounded-xl border ${toneClasses[tone]}`}>{icon}</div>
      <p className="mt-3 text-2xl font-black text-white leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400 font-medium">{label}</p>
    </div>
  );
}

