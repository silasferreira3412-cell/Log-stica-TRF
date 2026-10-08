import React, { useState } from 'react';
import {
  TrendingUp,
  Filter,
  Calendar,
  Search,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck
} from 'lucide-react';
import { DailyOperation, Driver } from '../../types';
import { formatCurrency, formatPercentage } from '../../lib/calculations';
import { storage } from '../../lib/storage';

interface PerformanceTableProps {
  operations: DailyOperation[];
  drivers: Driver[];
  onOpenDriverView: (tokenOrCode: string) => void;
}

export const PerformanceTable: React.FC<PerformanceTableProps> = ({
  operations,
  drivers,
  onOpenDriverView,
}) => {
  const slaSettings = storage.getSlaSettings();
  const [periodFilter, setPeriodFilter] = useState<'hoje' | 'ontem' | 'semana' | 'mes' | 'todos'>('hoje');
  const [driverFilter, setDriverFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = operations.filter((op) => {
    if (driverFilter !== 'todos' && op.driver_id !== driverFilter) return false;
    if (searchTerm && !op.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) && !op.code.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const exportCsv = () => {
    const headers = ['Motorista', 'Codigo Operacao', 'Data', 'Pacotes Recebidos', 'Entregues', 'Insucessos', 'Performance (%)', 'Meta (%)', 'Valor por Pacote (R$)', 'Repasse Previsto (R$)'];
    const rows = filtered.map((op) => {
      const perf = op.performance_percentage ?? 100;
      const driver = drivers.find((d) => d.id === op.driver_id);
      return [
        `"${op.driver_name}"`,
        op.code,
        op.operation_date,
        op.packages_received,
        op.successful_deliveries ?? (op.packages_received - (op.failures_count ?? 0)),
        op.failures_count ?? 0,
        perf.toFixed(2),
        driver?.target_sla ?? 98.0,
        op.current_rate_brl ?? 3.0,
        (op.estimated_payout_brl ?? 0).toFixed(2),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `performance_motoristas_${periodFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            Performance Operacional dos Motoristas
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhamento em tempo real da taxa de entregas, faixas atingidas e status do SLA
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Barra de Filtros (Hoje, Ontem, Semana, Mês, Motorista, Rota) */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        {/* Filtro de Período */}
        <div className="flex items-center gap-1 bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-semibold">
          {(['hoje', 'ontem', 'semana', 'mes', 'todos'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                periodFilter === p
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Filtro por Motorista */}
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-slate-400" />
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="todos">Todos os Motoristas</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Busca por texto */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código ou motorista..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabela Solicitada na Seção 15 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Motorista</th>
                <th className="py-3.5 px-4 text-center">Pacotes</th>
                <th className="py-3.5 px-4 text-center">Entregues</th>
                <th className="py-3.5 px-4 text-center">Insucessos</th>
                <th className="py-3.5 px-4 text-center">Performance</th>
                <th className="py-3.5 px-4 text-center">Meta</th>
                <th className="py-3.5 px-4 text-center">Valor Atual</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Repasse Total</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filtered.map((op) => {
                const perf = op.performance_percentage ?? 100;
                const driver = drivers.find((d) => d.id === op.driver_id);
                const target = driver?.target_sla ?? 98.0;

                const isHealthy = perf >= slaSettings.healthy_min;
                const isCrit = perf < slaSettings.critical_threshold;

                const entregues = op.successful_deliveries ?? Math.max(0, op.packages_received - (op.failures_count ?? 0));
                const insucessos = op.failures_count ?? 0;

                return (
                  <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{op.driver_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {op.code} • {op.route_name || 'Geral'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-100">
                      {op.packages_received}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      {entregues}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                      {insucessos}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          isHealthy
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : isCrit
                            ? 'text-rose-400 bg-rose-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {formatPercentage(perf)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {formatPercentage(target)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                      {formatCurrency(op.current_rate_brl ?? 3.0)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-base">
                      {isHealthy ? '🟢' : isCrit ? '🔴' : '🟡'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(op.estimated_payout_brl ?? 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenDriverView(op.share_token)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 transition-colors"
                      >
                        Ver Celular
                      </button>
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
