import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';

interface KPICardProps {
  label: string;
  value: string | number | null | undefined;
  icon: ReactNode;
  trend?: number;
  reverseTrend?: boolean; // if true, positive trend is red (e.g. absences)
  variant?: 'success' | 'warning' | 'neutral' | 'danger';
  index?: number; // for staggered animation delay
}

export function KPICard({ label, value, icon, trend, reverseTrend, variant = 'neutral', index = 0 }: KPICardProps) {
  
  const isPositiveTrend = trend !== undefined && trend >= 0;
  const isGoodTrend = reverseTrend ? !isPositiveTrend : isPositiveTrend;

  // Handle empty state
  const isEmpty = value === null || value === undefined || value === '' || value === '—';
  
  // Animate numeric values
  const animatedValue = useCountUp(isEmpty ? 0 : value);
  
  // Format display value
  let displayValue = isEmpty ? "Aucune donnée" : value;
  if (!isEmpty && typeof value === 'string' && value.includes('%')) {
    displayValue = `${animatedValue}%`;
  } else if (!isEmpty && typeof value === 'string' && value.includes('/')) {
    const suffix = value.split('/')[1];
    displayValue = `${animatedValue}/${suffix}`;
  } else if (!isEmpty && typeof value === 'number') {
    displayValue = animatedValue;
  }

  const borderStyles = {
    success: 'border-l-kpi-ok',
    warning: 'border-l-kpi-warning animate-[borderPulseAmber_3s_infinite]',
    danger: 'border-l-kpi-danger animate-[borderPulseRed_2s_infinite]',
    neutral: 'border-l-kpi-neutral',
  };

  const glowStyles = {
    success: 'hover:bg-glow-teal',
    warning: 'bg-glow-amber/5 hover:bg-glow-amber',
    danger: 'bg-glow-red/5 hover:bg-glow-red',
    neutral: 'hover:bg-glow-blue',
  };

  const semanticIconColors = {
    success: 'text-accent-teal icon-glow-teal',
    warning: 'text-accent-amber icon-glow-amber',
    danger: 'text-accent-red icon-glow-red',
    neutral: 'text-accent-blue icon-glow-blue',
  };

  return (
    <div 
      className={cn(
        "kpi-card-reveal glass-panel relative flex flex-col justify-between overflow-hidden rounded-xl p-5 md:p-6 border-l-[3.5px] transition-all duration-300",
        borderStyles[variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : variant === 'danger' ? 'danger' : 'neutral'],
        glowStyles[variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : variant === 'danger' ? 'danger' : 'neutral'],
        "hover:translate-y-[-2px] hover:shadow-[var(--shadow-elevated)]"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] icon-glow-target",
          semanticIconColors[variant]
        )}>
          {/* Ensure icon inside is h-5 w-5 */}
          <div className="h-5 w-5 flex items-center justify-center child-icon-size">
            {icon}
          </div>
        </div>
        
        {trend !== undefined && !isEmpty && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-bold",
            isGoodTrend ? "text-accent-teal" : "text-accent-red"
          )}>
            {isPositiveTrend ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[0.75rem] font-medium text-secondary-text uppercase tracking-[0.08em] font-sans">
          {label}
        </p>
        <h3 className={cn(
          "text-[2rem] leading-none font-semibold font-mono tracking-tight",
          isEmpty ? "text-muted-text italic text-sm" : "text-primary-text"
        )}>
          {isEmpty ? 'Aucune donnée' : displayValue}
        </h3>
      </div>
    </div>
  );
}
