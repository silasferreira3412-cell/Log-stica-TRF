import React from 'react';

interface BadgeProps {
  variant?: 'healthy' | 'warning' | 'risk' | 'critical' | 'neutral' | 'blue' | 'purple';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    healthy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    risk: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    critical: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    blue: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    purple: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  };

  const dotColors = {
    healthy: 'bg-emerald-400',
    warning: 'bg-amber-400',
    risk: 'bg-orange-400',
    critical: 'bg-rose-400',
    neutral: 'bg-slate-400',
    blue: 'bg-cyan-400',
    purple: 'bg-indigo-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />}
      {children}
    </span>
  );
};
