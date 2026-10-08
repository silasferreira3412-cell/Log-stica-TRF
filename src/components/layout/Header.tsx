import React from 'react';
import {
  Menu,
  Bell,
  RefreshCw,
  Calendar,
  Smartphone,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onRefreshData: () => void;
  onOpenDriverPreview: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onRefreshData,
  onOpenDriverPreview,
  selectedDate,
  onSelectDate,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            />
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            SLA Base: Operando em Tempo Real
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onRefreshData}
          className="flex items-center gap-1.5 rounded-xl border border-slate-750 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Recalcular métricas"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Atualizar</span>
        </button>

        <button
          onClick={onOpenDriverPreview}
          className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ver no Celular</span>
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2.5 pl-1">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-xs font-black text-slate-950">
            ADM
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-white leading-none">Gestor de Operação</p>
            <p className="text-[10px] text-slate-400 leading-none mt-1">CD São Paulo</p>
          </div>
        </div>
      </div>
    </header>
  );
};
