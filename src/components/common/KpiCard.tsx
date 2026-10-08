import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: 'emerald' | 'amber' | 'cyan' | 'rose' | 'indigo' | 'violet';
  badge?: React.ReactNode;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  accentColor = 'cyan',
  badge,
  onClick,
}) => {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 group-hover:border-cyan-500/40',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:border-rose-500/40',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/40',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20 group-hover:border-violet-500/40',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:shadow-lg ${
        onClick ? 'cursor-pointer hover:bg-slate-800/60' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-mono">
              {value}
            </span>
            {badge}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <p
              className={`mt-2 text-xs font-medium ${
                trendPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend}
            </p>
          )}
        </div>
        <div className={`rounded-xl border p-2.5 transition-transform group-hover:scale-105 ${colorMap[accentColor]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {/* Subtle indicator bar */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />
    </div>
  );
};
