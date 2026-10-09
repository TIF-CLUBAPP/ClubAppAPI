import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, CreditCard, Mail, Phone, ShieldAlert, User as UserIcon } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { userService } from '../services/userService';
import { cuotasService } from '../services/cuotasService';
import { getRoleConfig } from '../types/user';
import type { UserListItem } from '../types/user';
import type { CuotaVencida } from '../types/cuotas';

const formatCurrency = (value: number) =>
  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-950/50 border border-slate-800 px-4 py-3">
      <span className="text-slate-500">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function SocioFicha() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialMember = (location.state as { member?: UserListItem } | null)?.member ?? null;

  const [member, setMember] = useState<UserListItem | null>(initialMember);
  const [debt, setDebt] = useState<CuotaVencida | undefined>();
  const [loading, setLoading] = useState(!initialMember);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [debtors, users] = await Promise.all([
          cuotasService.getOverdueList(),
          initialMember ? Promise.resolve([] as UserListItem[]) : userService.getUsers(),
        ]);
        if (!active) return;
        setDebt(debtors.find((d) => d.socioId === Number(id)));
        if (!initialMember) {
          setMember(users.find((u) => String(u.id) === id) ?? null);
        }
      } catch {
        if (active) setError('No se pudo cargar la ficha del socio.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, initialMember]);

  const isDebtor = (debt?.cantidadCuotasImpagas ?? 0) > 0;
  const role = member ? getRoleConfig(member.role) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="max-w-3xl mx-auto space-y-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
            >
              <ArrowLeft size={16} /> Volver
            </button>

            {loading ? (
              <p className="text-sm text-slate-400">Cargando ficha…</p>
            ) : error ? (
              <p className="text-sm text-rose-400">{error}</p>
            ) : !member ? (
              <p className="text-sm text-slate-400">Socio no encontrado.</p>
            ) : (
              <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 shadow-2xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-xl">
                      {(member.firstName || member.fullName).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-white">{member.fullName}</h1>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {role && (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${role.badgeClasses}`}>
                            {role.label}
                          </span>
                        )}
                        <span
                          className={
                            isDebtor
                              ? 'rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300'
                              : 'rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300'
                          }
                        >
                          {isDebtor ? 'DEUDOR' : 'AL DÍA'}
                        </span>
                        {!member.isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            <ShieldAlert size={11} /> Bloqueado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isDebtor && debt ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/deudores?q=${encodeURIComponent(member.dni || member.fullName)}`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-300 transition hover:bg-rose-500/20"
                    >
                      <CreditCard size={16} /> Cobrar Cuota
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
                      <BadgeCheck size={16} /> Al día
                    </span>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={<UserIcon size={15} />} label="DNI" value={member.dni || '—'} />
                  <InfoRow icon={<BadgeCheck size={15} />} label="N° de Socio" value={member.badgeNum || '—'} />
                  <InfoRow icon={<Mail size={15} />} label="Email" value={member.email || '—'} />
                  <InfoRow icon={<Phone size={15} />} label="Teléfono" value={member.phone || '—'} />
                </div>

                {isDebtor && debt && (
                  <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <p className="text-sm font-bold text-rose-300">Deuda pendiente</p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Cuotas impagas</p>
                        <p className="font-bold text-white">{debt.cantidadCuotasImpagas}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Monto adeudado</p>
                        <p className="font-bold text-white">{formatCurrency(debt.montoTotalAdeudado)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Días de atraso</p>
                        <p className="font-bold text-white">{debt.diasDeAtraso}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}