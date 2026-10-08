import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  DollarSign,
  Download,
  AlertCircle,
  Truck,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { DailyOperation, DailySettlement as SettlementType } from '../../types';
import { storage } from '../../lib/storage';
import { formatCurrency, formatPercentage } from '../../lib/calculations';

interface DailySettlementProps {
  operations: DailyOperation[];
  onRefresh: () => void;
}

export const DailySettlement: React.FC<DailySettlementProps> = ({
  operations,
  onRefresh,
}) => {
  const settlements = storage.getSettlements();
  const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');

  // Operações que ainda não foram fechadas
  const pendingOperations = operations.filter(
    (op) => !settlements.some((s) => s.operation_id === op.id)
  );

  const handleSettle = (op: DailyOperation) => {
    const confirmSettle = window.confirm(
      `Confirmar fechamento imutável da operação ${op.code} para ${op.driver_name}?\n\n` +
      `Pacotes: ${op.packages_received}\n` +
      `Insucessos: ${op.failures_count ?? 0}\n` +
      `Performance: ${formatPercentage(op.performance_percentage ?? 100)}\n` +
      `Valor por pacote: ${formatCurrency(op.current_rate_brl ?? 3.0)}\n` +
      `Repasse Total: ${formatCurrency(op.estimated_payout_brl ?? 0)}\n\n` +
      `Os valores serão congelados no histórico e preservados mesmo com alterações futuras de regras.`
    );

    if (!confirmSettle) return;

    try {
      storage.settleOperation(op.id, 'Administrador Operacional');
      onRefresh();
      alert(`Fechamento da operação ${op.code} registrado e travado no histórico!`);
    } catch (err: any) {
      alert(err?.message || 'Erro ao realizar fechamento.');
    }
  };

  const exportSettlementsCsv = () => {
    const headers = [
      'ID Fechamento',
      'Data',
      'Motorista',
      'Operacao',
      'Pacotes',
      'Entregues',
      'Insucessos',
      'Performance Final (%)',
      'Valor por Pacote (R$)',
      'Total Repasse (R$)',
      'Receita (R$)',
      'Margem (R$)',
      'Faixa Aplicada',
      'Data Fechamento',
      'Fechado Por'
    ];

    const rows = settlements.map((s) => [
      s.id,
      s.settlement_date,
      `"${s.driver_name}"`,
      s.operation_code,
      s.packages_received,
      s.successful_deliveries,
      s.failures_count,
      s.final_performance.toFixed(2),
      s.applied_rate_brl.toFixed(2),
      s.total_payout_brl.toFixed(2),
      s.total_revenue_brl.toFixed(2),
      s.gross_margin_brl.toFixed(2),
      `"${s.applied_tier_label}"`,
      s.settled_at,
      `"${s.settled_by_name}"`,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `fechamentos_financeiros_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-amber-400" />
            Fechamento Diário dos Motoristas
          </h2>
          <p className="text-xs text-slate-400">
            Imutabilidade financeira garantida: valores confirmados nunca sofrem alteração retroativa
          </p>
        </div>

        <button
          onClick={exportSettlementsCsv}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Exportar Fechamentos</span>
        </button>
      </div>

      {/* Tabs: Pendentes vs Histórico Fechado */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-900 p-1 border border-slate-800 w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`rounded-lg px-4 py-2 transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Operações Prontas para Fechamento</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px]">
            {pendingOperations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settled')}
          className={`rounded-lg px-4 py-2 transition-all flex items-center gap-2 ${
            activeTab === 'settled'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Histórico Congelado & Imutável</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px]">
            {settlements.length}
          </span>
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong>Como funciona a imutabilidade:</strong> Ao clicar em "Confirmar Fechamento", o sistema registra o percentual exato do dia, a faixa de remuneração aplicada e o valor total. Se amanhã as tabelas forem alteradas no cadastro, o fechamento deste dia permanecerá 100% preservado.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOperations.map((op) => {
              const perf = op.performance_percentage ?? 100;
              const unitRate = op.current_rate_brl ?? 3.0;
              const payout = op.estimated_payout_brl ?? 0;
              const revenue = op.estimated_revenue_brl ?? 0;
              const margin = op.estimated_margin_brl ?? 0;

              return (
                <div
                  key={op.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{op.driver_name}</h3>
                      <p className="text-xs text-cyan-400 font-mono">
                        {op.code} • {op.route_name || 'Geral'}
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                      Aguardando Trava
                    </span>
                  </div>

                  {/* Grade de valores do dia */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950/70 p-3 text-center border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Pacotes</span>
                      <span className="text-base font-mono font-bold text-white">
                        {op.packages_received}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Insucessos</span>
                      <span className="text-base font-mono font-bold text-rose-400">
                        {op.failures_count ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Performance</span>
                      <span className="text-base font-mono font-bold text-emerald-400">
                        {formatPercentage(perf)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Faixa Atingida:</span>
                      <span className="text-amber-300 font-semibold truncate max-w-[200px]">
                        {op.current_tier_label}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Valor por Pacote:</span>
                      <span className="text-white font-mono font-bold">
                        {formatCurrency(unitRate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                      <span className="text-slate-200 font-bold">Receita Gerada:</span>
                      <span className="text-cyan-400 font-mono font-bold">
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="text-amber-300 font-bold">Total do Repasse:</span>
                      <span className="text-amber-400 font-mono font-extrabold text-sm">
                        {formatCurrency(payout)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="text-emerald-300 font-bold">Margem Líquida:</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {formatCurrency(margin)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSettle(op)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 active:scale-98 transition-all"
                  >
                    <Lock className="h-4 w-4" />
                    <span>CONFIRMAR & TRAVAR FECHAMENTO</span>
                  </button>
                </div>
              );
            })}
          </div>

          {pendingOperations.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Todas as operações foram fechadas!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Não há cargas pendentes de conferência e trava diária.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settled' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Operação / Motorista</th>
                  <th className="py-3.5 px-4 text-center">Data</th>
                  <th className="py-3.5 px-4 text-center">Pacotes</th>
                  <th className="py-3.5 px-4 text-center">Entregues</th>
                  <th className="py-3.5 px-4 text-center">Performance Final</th>
                  <th className="py-3.5 px-4 text-center">Valor / Pct</th>
                  <th className="py-3.5 px-4 text-right">Repasse Total</th>
                  <th className="py-3.5 px-4 text-right">Receita</th>
                  <th className="py-3.5 px-4 text-right">Margem</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{s.driver_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {s.operation_code} • {s.applied_tier_label}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {s.settlement_date}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-100">
                      {s.packages_received}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      {s.successful_deliveries}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-300">
                      {formatPercentage(s.final_performance)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                      {formatCurrency(s.applied_rate_brl)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400">
                      {formatCurrency(s.total_payout_brl)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                      {formatCurrency(s.total_revenue_brl)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(s.gross_margin_brl)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        <Lock className="h-3 w-3" /> Travado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
