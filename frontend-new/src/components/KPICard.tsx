import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  reverseTrend?: boolean; // if true, positive trend is red (e.g. absences)
  variant?: 'success' | 'warning' | 'neutral';
}

export function KPICard({ label, value, icon, trend, reverseTrend, variant = 'neutral' }: KPICardProps) {
  
  const isPositiveTrend = trend !== undefined && trend >= 0;
  const isGoodTrend = reverseTrend ? !isPositiveTrend : isPositiveTrend;

  const bgStyles = {
    success: 'bg-card-success',
    warning: 'bg-card-warning',
    neutral: 'bg-card-neutral',
  };

  const iconBgStyles = {
    success: 'bg-teal-500/20 text-teal-400',
    warning: 'bg-purple-500/20 text-purple-400',
    neutral: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[2rem] p-6 backdrop-blur-xl border border-border shadow-2xl transition-all duration-300 hover:scale-[1.02]",
      bgStyles[variant]
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full shadow-inner", iconBgStyles[variant])}>
          {icon}
        </div>
        
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-bold",
            isGoodTrend ? "text-emerald-400" : "text-rose-400"
          )}>
            {isPositiveTrend ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div>
        <h3 className="text-4xl font-bold text-foreground tracking-tight mb-2">
          {value}
        </h3>
        <p className="text-sm font-medium text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
