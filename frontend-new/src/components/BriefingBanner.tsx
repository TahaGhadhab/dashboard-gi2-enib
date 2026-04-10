import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Alert {
  level: 'red' | 'amber';
  message: string;
  module?: string;
  icon?: ReactNode;
}

interface BriefingBannerProps {
  alerts?: Alert[];
  className?: string;
}

export function BriefingBanner({ alerts = [], className }: BriefingBannerProps) {
  const hasAlerts = alerts.length > 0;

  return (
    <div className={cn(
      "w-full mb-8 animate-[bannerSlideDown_0.3s_ease] overflow-hidden rounded-xl border transition-all",
      hasAlerts 
        ? "bg-[var(--accent-red-glow)] border-[var(--accent-red)]/20 shadow-[0_4px_20px_-4px_rgba(240,68,56,0.1)]" 
        : "bg-[var(--accent-teal-glow)] border-[var(--accent-teal)]/20 shadow-[0_4px_20px_-4px_rgba(15,204,176,0.1)]",
      className
    )}>
      <div className="px-6 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasAlerts ? (
              <AlertTriangle className="h-5 w-5 text-accent-red" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-accent-teal" />
            )}
            <h3 className={cn(
              "text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]",
            )}>
              {hasAlerts ? `Attention : ${alerts.length} Alertes Critiques` : "État du Département : Stable"}
            </h3>
          </div>
          {!hasAlerts && (
            <p className="text-sm font-medium text-accent-teal">
              Aucune alerte critique — tous les indicateurs sont dans les seuils
            </p>
          )}
        </div>

        {hasAlerts && (
          <div className="divide-y divide-rose-500/10">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 first:pt-0 last:pb-0 group">
                <div className="flex items-center gap-3">
                  <div className="flex h-2 w-2 rounded-full bg-accent-red animate-pulse" />
                  <span className="text-sm font-medium text-primary-text">{alert.message}</span>
                </div>
                {alert.module && (
                  <NavLink 
                    to={`/${alert.module}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-accent-red hover:underline transition-all"
                  >
                    Voir Détails
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </NavLink>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
