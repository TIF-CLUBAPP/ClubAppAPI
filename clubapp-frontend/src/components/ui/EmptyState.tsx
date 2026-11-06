import React from 'react';
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
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-4 w-full flex flex-col items-center justify-center shadow-xl">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<any>, {
              className: 'w-8 h-8 sm:w-10 sm:h-10 text-emerald-400',
              strokeWidth: 1.5,
            })
          : icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">{subtitle}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs sm:text-sm font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
          Reintentar
        </button>
      )}
      {action}
    </div>
  );
}

