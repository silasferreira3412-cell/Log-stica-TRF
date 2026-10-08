import React from 'react';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  PackageCheck,
  CheckCircle2,
  Sparkles,
  Truck
} from 'lucide-react';
import { DailyOperation, Driver } from '../../types';
import { formatPercentage, formatCurrency } from '../../lib/calculations';

interface RankingPageProps {
  operations: DailyOperation[];
  drivers: Driver[];
}

export const RankingPage: React.FC<RankingPageProps> = ({ operations, drivers }) => {
  // Constrói lista agregada de performance por motorista
  const ranked = operations
    .map((op) => {
      const driver = drivers.find((d) => d.id === op.driver_id);
      const perf = op.performance_percentage ?? 100;
      const entregues = op.successful_deliveries ?? (op.packages_received - (op.failures_count ?? 0));
      return {
        operationId: op.id,
        driverId: op.driver_id,
        driverName: op.driver_name,
        vehiclePlate: driver?.vehicle_plate || 'BRA-0000',
        route: op.route_name || 'Geral',
        packagesReceived: op.packages_received,
        successfulDeliveries: entregues,
        failuresCount: op.failures_count ?? 0,
        performance: perf,
        targetSla: driver?.target_sla ?? 98.0,
        currentRate: op.current_rate_brl ?? 3.0,
        payout: op.estimated_payout_brl ?? 0,
      };
    })
    .sort((a, b) => b.performance - a.performance || b.successfulDeliveries - a.successfulDeliveries);

  const topPerformance = ranked[0];
  const mostDeliveries = [...ranked].sort((a, b) => b.successfulDeliveries - a.successfulDeliveries)[0];
  const lowestFailures = [...ranked].sort((a, b) => a.failuresCount - b.failuresCount)[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Ranking Operacional de Motoristas
        </h2>
        <p className="text-xs text-slate-400">
          Reconhecimento de mérito e destaques da frota (a remuneração é estritamente vinculada às faixas individuais)
        </p>
      </div>

      {/* 3 Destaques do Pódio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Melhor Performance */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Líder de Performance
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              🥇
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-white mt-2">
            {topPerformance?.driverName || '—'}
          </h3>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">
            {topPerformance ? formatPercentage(topPerformance.performance) : '—'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {topPerformance ? `${topPerformance.failuresCount} insucessos em ${topPerformance.packagesReceived} pacotes` : ''}
          </p>
        </div>

        {/* Maior Volume de Entregas */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
              Maior Volume Entregue
            </span>
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
              📦
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-white mt-2">
            {mostDeliveries?.driverName || '—'}
          </h3>
          <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {mostDeliveries ? `${mostDeliveries.successfulDeliveries} pacotes` : '—'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {mostDeliveries ? `Taxa de conclusão: ${formatPercentage(mostDeliveries.performance)}` : ''}
          </p>
        </div>

        {/* Menor Índice de Insucessos */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Menor Taxa de Devolução
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              🎯
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-white mt-2">
            {lowestFailures?.driverName || '—'}
          </h3>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {lowestFailures ? `${lowestFailures.failuresCount} baixas` : '—'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {lowestFailures ? `Eficiência comprovada na rota ${lowestFailures.route}` : ''}
          </p>
        </div>
      </div>

      {/* Tabela do Ranking Completo */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            Classificação Operacional Geral
          </h3>
          <span className="text-[11px] text-slate-400">
            Atualizado a cada baixa de etiqueta no dia
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4 text-center">Posição</th>
                <th className="py-3 px-4">Motorista</th>
                <th className="py-3 px-4 text-center">Carga Recebida</th>
                <th className="py-3 px-4 text-center">Entregues</th>
                <th className="py-3 px-4 text-center">Insucessos</th>
                <th className="py-3 px-4 text-center">Performance</th>
                <th className="py-3 px-4 text-center">Meta Individual</th>
                <th className="py-3 px-4 text-center">Distintivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {ranked.map((item, index) => {
                const pos = index + 1;
                const isTop = pos === 1;
                const isSecond = pos === 2;
                const isThird = pos === 3;

                return (
                  <tr key={item.operationId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-xl font-mono text-xs font-black ${
                          isTop
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : isSecond
                            ? 'bg-slate-300 text-slate-950'
                            : isThird
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {pos}º
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{item.driverName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.vehiclePlate} • {item.route}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-100">
                      {item.packagesReceived}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      {item.successfulDeliveries}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                      {item.failuresCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-black text-amber-400 text-sm">
                      {formatPercentage(item.performance)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {formatPercentage(item.targetSla)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.performance >= 98.0 ? (
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/20">
                          ★ Elite Ouro
                        </span>
                      ) : item.performance >= 95.0 ? (
                        <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/20">
                          Prata Regular
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                          Em Recuperação
                        </span>
                      )}
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
