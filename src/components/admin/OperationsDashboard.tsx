import React, { useState } from 'react';
import {
  Package,
  Truck,
  TrendingUp,
  Target,
  DollarSign,
  Coins,
  Percent,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { DailyOperation, DeliveryFailure, Driver } from '../../types';
import { KpiCard } from '../common/KpiCard';
import { Badge } from '../common/Badge';
import { formatCurrency, formatPercentage, getSlaStatus } from '../../lib/calculations';
import { storage } from '../../lib/storage';

interface OperationsDashboardProps {
  operations: DailyOperation[];
  failures: DeliveryFailure[];
  drivers: Driver[];
  onOpenDistributeModal: () => void;
  onOpenDriverView: (tokenOrCode: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  operations,
  failures,
  drivers,
  onOpenDistributeModal,
  onOpenDriverView,
  onNavigateToTab,
}) => {
  const financial = storage.getFinancialSettings();
  const slaSettings = storage.getSlaSettings();

  // Cálculos consolidados da operação do dia
  const totalPacotesRecebidos = operations.reduce((acc, op) => acc + op.packages_received, 0);
  const totalInsucessos = failures.length;
  const totalEntregasEstimadas = Math.max(0, totalPacotesRecebidos - totalInsucessos);
  
  const performanceGeral = totalPacotesRecebidos > 0
    ? (totalEntregasEstimadas / totalPacotesRecebidos) * 100
    : 100;

  const slaInfo = getSlaStatus(performanceGeral, slaSettings);

  const receitaPrevista = totalPacotesRecebidos * financial.base_client_rate_brl;
  const repassePrevisto = operations.reduce((acc, op) => acc + (op.estimated_payout_brl || 0), 0);
  const margemPrevista = receitaPrevista - repassePrevisto;
  const margemPercentual = receitaPrevista > 0 ? (margemPrevista / receitaPrevista) * 100 : 0;

  const motoristasAtivos = operations.length;
  const motoristasAbaixoMeta = operations.filter(
    (op) => (op.performance_percentage ?? 100) < slaSettings.healthy_min
  );
  const motoristasCriticos = operations.filter(
    (op) => (op.performance_percentage ?? 100) < slaSettings.critical_threshold
  );

  return (
    <div className="space-y-6">
      {/* Top Banner de Resumo da Central */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Central de Operação em Tempo Real
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-1">
              Painel de Comando e Distribuição Logística
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Monitoramento matinal de carregamento, baixas de insucesso em rota pelo app do motorista, SLA contratual e margens financeiras automáticas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDistributeModal}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>DISTRIBUIR CARGA</span>
            </button>
            <button
              onClick={() => onNavigateToTab('settlement')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-all"
            >
              <span>Fechamento Diário</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Alerta inteligente se houver motoristas em situação crítica */}
        {motoristasCriticos.length > 0 && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>
                <strong>Atenção Imediata:</strong> {motoristasCriticos.length} motorista(s) com performance abaixo de {formatPercentage(slaSettings.critical_threshold)} hoje.
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('performance')}
              className="text-xs font-bold text-rose-300 underline hover:text-white"
            >
              Verificar
            </button>
          </div>
        )}
      </div>

      {/* 8 CARDS VISUAIS SOLICITADOS NA ESPECIFICAÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 📦 PACOTES */}
        <KpiCard
          title="📦 PACOTES HOJE"
          value={totalPacotesRecebidos}
          subtitle={`${totalEntregasEstimadas} entregues • ${totalInsucessos} insucessos`}
          icon={Package}
          accentColor="cyan"
          trend={`${totalInsucessos} baixas registradas`}
          trendPositive={totalInsucessos === 0}
          onClick={() => onNavigateToTab('operations')}
        />

        {/* 🚚 MOTORISTAS */}
        <KpiCard
          title="🚚 MOTORISTAS ATIVOS"
          value={motoristasAtivos}
          subtitle={`${motoristasAbaixoMeta.length} abaixo da meta • ${motoristasCriticos.length} críticos`}
          icon={Truck}
          accentColor="indigo"
          badge={
            motoristasCriticos.length > 0 ? (
              <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                {motoristasCriticos.length} 🔴
              </span>
            ) : undefined
          }
          onClick={() => onNavigateToTab('drivers')}
        />

        {/* 📊 PERFORMANCE */}
        <KpiCard
          title="📊 PERFORMANCE GERAL"
          value={formatPercentage(performanceGeral)}
          subtitle={`Meta padrão de entrega: ${formatPercentage(slaSettings.target_operational_sla)}`}
          icon={TrendingUp}
          accentColor={performanceGeral >= slaSettings.healthy_min ? 'emerald' : 'amber'}
          trend={performanceGeral >= slaSettings.healthy_min ? 'Dentro do padrão' : 'Abaixo da meta'}
          trendPositive={performanceGeral >= slaSettings.healthy_min}
          onClick={() => onNavigateToTab('performance')}
        />

        {/* 🎯 SLA */}
        <KpiCard
          title="🎯 STATUS DO SLA"
          value={slaInfo.label.replace('SLA ', '')}
          subtitle={`Limiar saudável: >= ${formatPercentage(slaSettings.healthy_min)}`}
          icon={Target}
          accentColor={slaInfo.status === 'healthy' ? 'emerald' : slaInfo.status === 'warning' ? 'amber' : 'rose'}
          badge={
            <Badge variant={slaInfo.status} dot size="sm">
              {formatPercentage(performanceGeral)}
            </Badge>
          }
          onClick={() => onNavigateToTab('sla')}
        />

        {/* 💰 RECEITA */}
        <KpiCard
          title="💰 RECEITA PREVISTA"
          value={formatCurrency(receitaPrevista)}
          subtitle={`Contrato base: ${formatCurrency(financial.base_client_rate_brl)} / pacote`}
          icon={DollarSign}
          accentColor="emerald"
          onClick={() => onNavigateToTab('financial')}
        />

        {/* 💵 REPASSES */}
        <KpiCard
          title="💵 REPASSE MOTORISTAS"
          value={formatCurrency(repassePrevisto)}
          subtitle="Calculado pelas faixas de performance"
          icon={Coins}
          accentColor="amber"
          onClick={() => onNavigateToTab('financial')}
        />

        {/* 📈 MARGEM */}
        <KpiCard
          title="📈 MARGEM BRUTA"
          value={formatCurrency(margemPrevista)}
          subtitle={`${formatPercentage(margemPercentual)} de margem sobre a receita`}
          icon={Percent}
          accentColor="emerald"
          trend={`${formatPercentage(margemPercentual)} líquido`}
          trendPositive={margemPercentual >= 30}
          onClick={() => onNavigateToTab('financial')}
        />

        {/* 🚨 ALERTAS */}
        <KpiCard
          title="🚨 ALERTAS OPERAÇÃO"
          value={motoristasAbaixoMeta.length + (totalInsucessos > 5 ? 1 : 0)}
          subtitle="Diagnósticos em tempo real"
          icon={AlertTriangle}
          accentColor={motoristasAbaixoMeta.length > 0 ? 'rose' : 'emerald'}
          trend={motoristasAbaixoMeta.length > 0 ? 'Requer atenção' : 'Tudo regular'}
          trendPositive={motoristasAbaixoMeta.length === 0}
          onClick={() => onNavigateToTab('intelligence')}
        />
      </div>

      {/* Tabela Resumo das Operações do Dia */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-400" />
              Operações em Rota Hoje ({operations.length})
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhamento simultâneo de carregamentos e links de motoristas
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('operations')}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Ver todas as operações</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Código / Rota</th>
                <th className="py-3 px-4">Motorista</th>
                <th className="py-3 px-4 text-center">Pacotes</th>
                <th className="py-3 px-4 text-center">Insucessos</th>
                <th className="py-3 px-4 text-center">Performance</th>
                <th className="py-3 px-4 text-center">Faixa Vigente</th>
                <th className="py-3 px-4 text-right">Repasse Previsto</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {operations.map((op) => {
                const perf = op.performance_percentage ?? 100;
                const isMeta = perf >= slaSettings.healthy_min;
                const isCrit = perf < slaSettings.critical_threshold;

                return (
                  <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium">
                      <span className="text-cyan-400 font-bold block">{op.code}</span>
                      <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[150px]">
                        {op.route_name || 'Geral'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white block">{op.driver_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Link: {op.share_token}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-100">
                      {op.packages_received}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono font-bold ${
                          (op.failures_count ?? 0) > 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {op.failures_count ?? 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md text-xs ${
                          isMeta
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isCrit
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {isMeta ? '🟢' : isCrit ? '🔴' : '🟡'} {formatPercentage(perf)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-amber-400 font-mono font-bold block">
                        {formatCurrency(op.current_rate_brl ?? 3.0)}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[120px] mx-auto">
                        {op.current_tier_label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(op.estimated_payout_brl ?? 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenDriverView(op.share_token)}
                          title="Abrir como motorista no celular"
                          className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 border border-slate-700 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>App</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
