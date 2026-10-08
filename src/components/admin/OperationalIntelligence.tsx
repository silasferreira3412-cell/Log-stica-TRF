import React, { useState } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  PieChart,
  BarChart3,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Truck
} from 'lucide-react';
import { DailyOperation, DeliveryFailure, Driver } from '../../types';
import { generateOperationalInsights, formatPercentage, formatCurrency } from '../../lib/calculations';
import { storage } from '../../lib/storage';

interface OperationalIntelligenceProps {
  operations: DailyOperation[];
  failures: DeliveryFailure[];
  drivers: Driver[];
}

export const OperationalIntelligence: React.FC<OperationalIntelligenceProps> = ({
  operations,
  failures,
  drivers,
}) => {
  const financial = storage.getFinancialSettings();
  const slaSettings = storage.getSlaSettings();

  const insights = generateOperationalInsights(operations, failures, financial, slaSettings);

  // Análise estatística dos motivos de insucesso
  const reasonCounts: Record<string, number> = {};
  failures.forEach((f) => {
    reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
  });

  const totalFailures = failures.length;
  const sortedReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalFailures > 0 ? (count / totalFailures) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Cores visuais para o gráfico de motivos
  const reasonColors: Record<string, string> = {
    'Cliente ausente': 'bg-amber-500',
    'Endereço não localizado': 'bg-rose-500',
    'Endereço fechado': 'bg-cyan-500',
    'Recusa': 'bg-purple-500',
    'Problema no endereço': 'bg-orange-500',
    'Problema operacional': 'bg-indigo-500',
    'Outros': 'bg-slate-500',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Inteligência */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Central de Inteligência Operacional
                </h2>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/40">
                  Motor Preditivo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Diagnósticos automatizados que transformam dados de entregas em decisões práticas para o gestor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico e Distribuição dos Motivos de Insucesso (Seção 17) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              Análise dos Motivos de Insucesso ({totalFailures} baixas registradas)
            </h3>
            <p className="text-[11px] text-slate-400">
              Identificação de causas-raiz para orientar correções no carregamento e rota
            </p>
          </div>
        </div>

        {totalFailures === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum insucesso registrado até o momento. Operação rodando com 100% de entregas!
          </div>
        ) : (
          <div className="space-y-4">
            {/* Barra multi-colorida empilhada */}
            <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
              {sortedReasons.map((item) => (
                <div
                  key={item.reason}
                  style={{ width: `${item.percentage}%` }}
                  className={`h-full ${reasonColors[item.reason] || 'bg-slate-500'} transition-all`}
                  title={`${item.reason}: ${item.count} (${item.percentage.toFixed(1)}%)`}
                />
              ))}
            </div>

            {/* Grid dos Motivos com Percentual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {sortedReasons.map((item) => (
                <div
                  key={item.reason}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-3 w-3 rounded-md ${reasonColors[item.reason] || 'bg-slate-500'}`} />
                    <span className="text-xs font-semibold text-slate-200">
                      {item.reason}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-white">
                      {item.count} cx
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      ({formatPercentage(item.percentage)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CARDS DE DIAGNÓSTICO E SUGESTÃO (Seção 18 da especificação) */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Diagnósticos e Recomendações Estratégicas
          </h3>
          <p className="text-xs text-slate-400">
            Ações recomendadas geradas a partir do cruzamento de SLA, repasse e concentração de falhas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const isCritical = insight.severity === 'critical';
            const isWarning = insight.severity === 'warning';
            const isRisk = insight.severity === 'risk';

            const borderClass = isCritical
              ? 'border-rose-500/40 bg-rose-500/5'
              : isRisk
              ? 'border-orange-500/40 bg-orange-500/5'
              : isWarning
              ? 'border-amber-500/40 bg-amber-500/5'
              : 'border-emerald-500/40 bg-emerald-500/5';

            const badgeClass = isCritical
              ? 'bg-rose-500/20 text-rose-300'
              : isRisk
              ? 'bg-orange-500/20 text-orange-300'
              : isWarning
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-emerald-500/20 text-emerald-300';

            return (
              <div
                key={insight.id}
                className={`rounded-2xl border ${borderClass} p-5 space-y-3.5 backdrop-blur-sm shadow-md flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                      {insight.category.toUpperCase()} • {insight.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* PROBLEMA DETECTADO */}
                  <div className="mt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                      PROBLEMA DETECTADO
                    </span>
                    <h4 className="text-sm font-bold text-white leading-snug">
                      {insight.problem_detected}
                    </h4>
                  </div>

                  {/* IMPACTO */}
                  <div className="mt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                      IMPACTO
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {insight.impact}
                    </p>
                  </div>

                  {/* SUGESTÃO */}
                  <div className="mt-3 rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block mb-0.5 flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" /> SUGESTÃO
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {insight.suggestion}
                    </p>
                  </div>
                </div>

                {/* AÇÃO RECOMENDADA */}
                <div className="rounded-xl bg-slate-900 p-3 border border-slate-700/80 flex items-center gap-2.5">
                  <ArrowRight className="h-4 w-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[9px] font-black uppercase text-cyan-400 block">
                      AÇÃO RECOMENDADA
                    </span>
                    <p className="text-xs font-bold text-white">
                      {insight.recommended_action}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
