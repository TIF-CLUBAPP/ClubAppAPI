import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onRetry?: () => void;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, onRetry, action }: EmptyStateProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-3 w-full">
      <div className="inline-flex p-4 rounded-2xl bg-slate-900/90 text-emerald-400 border border-emerald-500/30 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 max-w-xs mx-auto">{subtitle}</p>}
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all">
          Reintentar
        </button>
      )}
      {action}
    </div>
  );
}

