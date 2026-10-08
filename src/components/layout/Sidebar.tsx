import React from 'react';
import {
  LayoutDashboard,
  Package,
  Truck,
  TrendingUp,
  Target,
  XCircle,
  Camera,
  DollarSign,
  Trophy,
  BrainCircuit,
  FileSpreadsheet,
  Settings,
  Database,
  Smartphone,
  PlusCircle
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'operations'
  | 'drivers'
  | 'performance'
  | 'sla'
  | 'failures'
  | 'receipts'
  | 'financial'
  | 'settlement'
  | 'ranking'
  | 'intelligence'
  | 'reports'
  | 'settings'
  | 'supabase';

interface SidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onOpenDistributeModal: () => void;
  onOpenDriverPreview: () => void;
  activeOperationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenDistributeModal,
  onOpenDriverPreview,
  activeOperationsCount,
}) => {
  const menuItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Central da Operação', icon: LayoutDashboard },
    { id: 'operations', label: 'Operações do Dia', icon: Package, badge: activeOperationsCount.toString() },
    { id: 'drivers', label: 'Motoristas', icon: Truck },
    { id: 'performance', label: 'Performance & Metas', icon: TrendingUp },
    { id: 'sla', label: 'Gestão de SLA', icon: Target },
    { id: 'failures', label: 'Insucessos', icon: XCircle },
    { id: 'receipts', label: 'Comprovantes & Fotos', icon: Camera },
    { id: 'settlement', label: 'Fechamento Diário', icon: FileSpreadsheet },
    { id: 'financial', label: 'Financeiro & Margens', icon: DollarSign },
    { id: 'ranking', label: 'Ranking Operacional', icon: Trophy },
    { id: 'intelligence', label: 'Inteligência Logística', icon: BrainCircuit, badge: 'IA' },
    { id: 'reports', label: 'Relatórios & Exportação', icon: FileSpreadsheet },
    { id: 'settings', label: 'Configurações de Remuneração', icon: Settings },
    { id: 'supabase', label: 'Banco & Supabase', icon: Database },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              RotaMaster
              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                PRO
              </span>
            </h1>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
              Logistics Command
            </span>
          </div>
        </div>
      </div>

      {/* Ação Rápida: Distribuir Carga */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        <button
          onClick={onOpenDistributeModal}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 px-3 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          <span>DISTRIBUIR CARGA</span>
        </button>

        <button
          onClick={onOpenDriverPreview}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 py-2 px-3 text-xs font-bold text-slate-300 hover:text-white transition-all"
        >
          <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
          <span>Simular App Motorista</span>
        </button>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Menu Operacional
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Central Online
            </span>
            <span className="text-[10px] font-mono text-slate-500">v2.4.0</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400 truncate">
            Base: CD Matriz São Paulo (SPO-01)
          </p>
        </div>
      </div>
    </aside>
  );
};
