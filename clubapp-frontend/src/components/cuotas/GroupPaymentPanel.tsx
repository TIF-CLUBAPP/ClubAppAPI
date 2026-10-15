import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Link2,
  Share2,
  Timer,
  CheckCircle2,
  Clock,
  Check,
  X,
  Sparkles,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import type { GroupParticipant, GroupPaymentState } from '../../types/groupPayment';
import { groupPaymentService } from '../../services/groupPaymentService';
import { friendService } from '../../services/friendService';

interface GroupPaymentPanelProps {
  formatCurrency: (val: number) => string;
  /** Monto total a dividir (sin comisión). */
  totalAmount: number;
  /** Monto por persona ya calculado (total / participantes). */
  perPersonAmount: number;
  group: GroupPaymentState;
  organizerHasPaid: boolean;
  onTotalParticipantsChange: (n: number) => void;
  onAddParticipant: (p: GroupParticipant) => void;
  onRemoveParticipant: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

const statusPill = (status: GroupParticipant['status']) =>
  status === 'PAID' ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
      <CheckCircle2 size={11} /> Pagado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
      <Clock size={11} /> Pendiente
    </span>
  );

export const GroupPaymentPanel: React.FC<GroupPaymentPanelProps> = ({
  formatCurrency,
  totalAmount,
  perPersonAmount,
  group,
  organizerHasPaid,
  onTotalParticipantsChange,
  onAddParticipant,
  onRemoveParticipant,
  refreshing,
  onRefresh,
}) => {
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupParticipant[]>([]);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasFriends, setHasFriends] = useState<boolean | null>(null);

  // Temporizador regresivo hacia el deadline.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Búsqueda de usuarios con debounce.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const found = await groupPaymentService.searchFriends(query);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Detecta si el usuario tiene amigos confirmados para mostrar el mensaje vacío.
  useEffect(() => {
    let mounted = true;
    friendService
      .getFriends()
      .then((friends) => {
        if (mounted) setHasFriends(friends.length > 0);
      })
      .catch(() => {
        if (mounted) setHasFriends(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const totalParticipants = Math.max(1, group.totalParticipants);
  const paidCount = group.participants.filter((p) => p.status === 'PAID').length;
  const progressPct = Math.min(100, Math.round((paidCount / totalParticipants) * 100));
  const missingAmount = Math.max(0, (totalParticipants - paidCount) * perPersonAmount);
  const allPaid = paidCount >= totalParticipants;
  const isFull = group.participants.length >= totalParticipants;

  const deadlineMs = group.deadline ? new Date(group.deadline).getTime() : 0;
  const remainingMs = Math.max(0, deadlineMs - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');

  const isAlreadyInvited = (p: GroupParticipant) =>
    group.participants.some(
      (x) =>
        x.id === p.id ||
        (p.userId != null && x.userId === p.userId) ||
        (p.email && x.email === p.email),
    );

  const addParticipant = (p: GroupParticipant) => {
    if (isFull) return;
    onAddParticipant({ ...p, shareAmount: perPersonAmount });
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(groupPaymentService.buildPaymentLink(group.token));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(
      groupPaymentService.buildWhatsAppLink(group.token, formatCurrency(perPersonAmount)),
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-3 text-sm">
      {/* Encabezado: cálculo por persona */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Reserva Grupal</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total a dividir</p>
          <p className="text-base font-black text-white">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Número de participantes */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-2.5">
        <label className="text-xs text-slate-400 font-medium">N° de participantes</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTotalParticipantsChange(totalParticipants - 1)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
            aria-label="Restar participante"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={50}
            value={totalParticipants}
            onChange={(e) => onTotalParticipantsChange(Number(e.target.value) || 1)}
            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-white text-sm font-bold outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => onTotalParticipantsChange(totalParticipants + 1)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
            aria-label="Sumar participante"
          >
            +
          </button>
        </div>
      </div>

      {/* Cálculo por persona */}
      <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-300">Cada participante paga</span>
        </div>
        <span className="text-base font-black text-emerald-300">{formatCurrency(perPersonAmount)}</span>
      </div>

      {/* Buscador de amigos registrados */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar amigos por nombre, email o username…"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500"
          />
        </div>

        {hasFriends === false && (
          <p className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 leading-relaxed">
            Solo podés invitar a tus amigos. Agregalos desde el buscador superior o tu cuenta.
          </p>
        )}

        {searching && <p className="text-xs text-slate-500">Buscando usuarios…</p>}

        {!searching && hasFriends === true && query.trim() && results.length === 0 && (
          <p className="text-xs text-slate-500">No se encontraron amigos con ese criterio.</p>
        )}

        {!searching && results.length > 0 && (
          <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin">
            {results.map((p) => {
              const invited = isAlreadyInvited(p);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {p.username ? `@${p.username} · ` : ''}{p.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={invited || isFull}
                    onClick={() => addParticipant(p)}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {invited ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    {invited ? 'Invitado' : isFull ? 'Cupo lleno' : 'Invitar'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Participantes invitados */}
      {group.participants.length > 0 && (
        <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Participantes ({group.participants.length} de {totalParticipants}) {isFull && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5"><Users size={11} /> Cupo de invitados completo ({group.participants.length}/{totalParticipants})</span>}
          </p>
          {group.participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">
                  {p.name}
                  {p.isOrganizer && (
                    <span className="ml-1.5 text-[10px] font-bold text-emerald-400">(Organizador)</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatCurrency(perPersonAmount)} · {p.isOrganizer ? 'Tu cuota' : 'Cuota'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusPill(p.status)}
                {!p.isOrganizer && (
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(p.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800 transition"
                    aria-label="Quitar participante"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barra de progreso + estado del pago */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold">
            {paidCount} de {totalParticipants} pagados
          </span>
          <span className="text-slate-400">
            {allPaid ? 'Completado' : `Faltan ${formatCurrency(missingAmount)}`}
          </span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Temporizador regresivo */}
      {!allPaid && group.deadline && (
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          <Timer className="w-4 h-4" />
          <span className="font-semibold">Límite de pago:</span>
          <span className="font-mono font-bold tabular-nums">{hh}:{mm}:{ss}</span>
        </div>
      )}

      {/* Link de pago para invitados sin cuenta */}
      {group.token && (
      <div className="space-y-2 border-t border-slate-800 pt-2.5">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
          <Sparkles size={12} /> Cupos sin usuario asignado
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg px-2.5 py-2 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {copied ? '¡Link copiado!' : 'Copiar Link de Pago'}
          </button>
          <button
            type="button"
            onClick={shareWhatsApp}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg px-2.5 py-2 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartir por WhatsApp
          </button>
        </div>
      </div>
      )}

      {/* Estado del organizador + acción para refrescar el estado de los amigos */}
      {organizerHasPaid && !allPaid && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-sky-500/10 border border-sky-500/20 px-3 py-2.5">
          <p className="text-xs text-sky-200 font-medium">Tu cuota ya fue abonada. Esperando a tus amigos…</p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-sky-300 underline underline-offset-2 hover:text-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      )}

      {allPaid && (
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-semibold">Todos los participantes pagaron. Podés confirmar la reserva abajo.</span>
        </div>
      )}
    </div>
  );
};

