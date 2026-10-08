import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  XCircle,
  Percent,
  CheckCircle2,
  Filter,
  FileDown,
  Share2,
  Copy,
  Check,
  Building2,
  X
} from 'lucide-react';
import { DailyOperation, DeliveryFailure, DailySettlement, Driver } from '../../types';
import { formatCurrency, formatPercentage } from '../../lib/calculations';
import { storage } from '../../lib/storage';
import { exportOperationsAndFinancialPdf } from '../../lib/pdfExport';

interface ReportsPageProps {
  operations: DailyOperation[];
  failures: DeliveryFailure[];
  settlements: DailySettlement[];
  drivers: Driver[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  operations,
  failures,
  settlements,
  drivers,
}) => {
  const [reportType, setReportType] = useState<'diario' | 'semanal' | 'mensal' | 'motoristas'>('diario');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [customCompanyName, setCustomCompanyName] = useState('RotaMaster Logística & Transportes');
  const [customNotes, setCustomNotes] = useState('Documento emitido para conferência gerencial e prestação de contas com parceiros.');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const financial = storage.getFinancialSettings();

  // Consolidação dos dados para relatório
  const totalPacotes = operations.reduce((acc, op) => acc + op.packages_received, 0);
  const totalInsucessos = failures.length;
  const totalEntregues = Math.max(0, totalPacotes - totalInsucessos);
  const performanceMedia = totalPacotes > 0 ? (totalEntregues / totalPacotes) * 100 : 100;

  const totalReceita = totalPacotes * financial.base_client_rate_brl;
  const totalRepasse = operations.reduce((acc, op) => acc + (op.estimated_payout_brl || 0), 0);
  const totalMargem = totalReceita - totalRepasse;
  const margemPct = totalReceita > 0 ? (totalMargem / totalReceita) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    exportOperationsAndFinancialPdf({
      reportType,
      operations,
      failures,
      settlements,
      drivers,
      financialSettings: financial,
      companyName: customCompanyName,
      notes: customNotes,
    });
    setIsPdfModalOpen(false);
  };

  const handleCopyWhatsappSummary = () => {
    const text = `📊 *RESUMO OPERACIONAL & FINANCEIRO - ${customCompanyName.toUpperCase()}*
📅 Data: ${new Date().toLocaleDateString('pt-BR')}
📦 *Pacotes Carregados:* ${totalPacotes}
✅ *Entregas Concluídas:* ${totalEntregues}
❌ *Insucessos:* ${totalInsucessos}
🎯 *SLA Geral:* ${formatPercentage(performanceMedia)}

💰 *Receita Operacional:* ${formatCurrency(totalReceita)}
💵 *Total de Repasses:* ${formatCurrency(totalRepasse)}
📈 *Margem Bruta:* ${formatCurrency(totalMargem)} (${formatPercentage(margemPct)})

Relatório completo gerado e arquivado via RotaMaster PRO.`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const exportConsolidatedCsv = () => {
    const headers = [
      'Relatorio',
      'Periodo',
      'Pacotes Totais',
      'Entregues',
      'Insucessos',
      'SLA Performance (%)',
      'Receita Bruta (R$)',
      'Repasse Motoristas (R$)',
      'Margem Bruta (R$)',
      'Margem (%)'
    ];

    const dataRow = [
      `"Relatorio ${reportType.toUpperCase()}"`,
      new Date().toLocaleDateString('pt-BR'),
      totalPacotes,
      totalEntregues,
      totalInsucessos,
      performanceMedia.toFixed(2),
      totalReceita.toFixed(2),
      totalRepasse.toFixed(2),
      totalMargem.toFixed(2),
      margemPct.toFixed(2),
    ];

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), dataRow.join(',')].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `relatorio_gerencial_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-amber-400" />
            Central de Relatórios & Exportações Executivas
          </h2>
          <p className="text-xs text-slate-400">
            Exportação profissional de desempenho e financeiro para parceiros, embarcadores e gestão
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Destaque: Exportar PDF */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <FileDown className="h-4 w-4" />
            <span>EXPORTAR PDF OFICIAL</span>
          </button>

          <button
            onClick={exportConsolidatedCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Planilha CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors"
            title="Imprimir visualização da página"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Seletor de Tipo de Relatório */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-900 p-1 border border-slate-800 w-fit text-xs font-semibold no-print">
        <button
          onClick={() => setReportType('diario')}
          className={`rounded-lg px-3 py-1.5 transition-all ${
            reportType === 'diario' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Fechamento Diário
        </button>
        <button
          onClick={() => setReportType('semanal')}
          className={`rounded-lg px-3 py-1.5 transition-all ${
            reportType === 'semanal' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Fechamento Semanal
        </button>
        <button
          onClick={() => setReportType('mensal')}
          className={`rounded-lg px-3 py-1.5 transition-all ${
            reportType === 'mensal' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Fechamento Mensal
        </button>
        <button
          onClick={() => setReportType('motoristas')}
          className={`rounded-lg px-3 py-1.5 transition-all ${
            reportType === 'motoristas' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Performance por Motorista
        </button>
      </div>

      {/* Relatório Imprimível / Visualizável */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
        {/* Cabeçalho do Relatório */}
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
              DEMONSTRATIVO LOGÍSTICO & FINANCEIRO
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">
              {customCompanyName} — Relatório {reportType.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Data de Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg font-bold"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Gerar PDF Deste Período</span>
            </button>
            <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              SLA Geral: {formatPercentage(performanceMedia)}
            </span>
          </div>
        </div>

        {/* Resumo de Indicadores Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Volume Total
            </span>
            <p className="text-2xl font-black text-white font-mono mt-1">
              {totalPacotes} cx
            </p>
            <span className="text-[11px] text-emerald-400 font-semibold">
              {totalEntregues} concluídas
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Receita Bruta Total
            </span>
            <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
              {formatCurrency(totalReceita)}
            </p>
            <span className="text-[11px] text-slate-500">
              Taxa base {formatCurrency(financial.base_client_rate_brl)}/pct
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Repasses aos Motoristas
            </span>
            <p className="text-2xl font-black text-amber-400 font-mono mt-1">
              {formatCurrency(totalRepasse)}
            </p>
            <span className="text-[11px] text-slate-500">
              Remuneração por performance
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Margem Bruta Líquida
            </span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {formatCurrency(totalMargem)}
            </p>
            <span className="text-[11px] text-emerald-400 font-bold">
              {formatPercentage(margemPct)} de rentabilidade
            </span>
          </div>
        </div>

        {/* Tabela Detalhada do Relatório */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Operação / Motorista</th>
                <th className="py-3 px-4 text-center">Pacotes</th>
                <th className="py-3 px-4 text-center">Insucessos</th>
                <th className="py-3 px-4 text-center">SLA %</th>
                <th className="py-3 px-4 text-right">Receita Bruta</th>
                <th className="py-3 px-4 text-right">Repasse Motorista</th>
                <th className="py-3 px-4 text-right">Margem Líquida</th>
                <th className="py-3 px-4 text-center">Rentabilidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {operations.map((op) => {
                const perf = op.performance_percentage ?? 100;
                const rec = op.packages_received * financial.base_client_rate_brl;
                const pay = op.estimated_payout_brl ?? 0;
                const marg = rec - pay;
                const pct = rec > 0 ? (marg / rec) * 100 : 0;

                return (
                  <tr key={op.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <strong className="text-white block">{op.driver_name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{op.code}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">{op.packages_received}</td>
                    <td className="py-3 px-4 text-center font-mono text-rose-400 font-bold">{op.failures_count ?? 0}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">{formatPercentage(perf)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(rec)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">{formatCurrency(pay)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(marg)}</td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-300">{formatPercentage(pct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Configuração e Exportação de PDF */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <FileDown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Exportar Relatório PDF Oficial</h3>
                  <p className="text-xs text-slate-400">
                    Gere o documento diagramado em PDF para envio a parceiros ou diretoria
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-amber-400" />
                  Nome da Empresa / Transportadora no Cabeçalho
                </label>
                <input
                  type="text"
                  value={customCompanyName}
                  onChange={(e) => setCustomCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Nome da sua transportadora"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Termo de Validação & Observações Gerenciais
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Observação que constará no rodapé assinado do PDF"
                />
              </div>

              {/* Prévia dos números que estarão no PDF */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dados a serem gerados no PDF:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>• {totalPacotes} pacotes ({totalEntregues} entregues)</div>
                  <div>• SLA Geral: <strong className="text-emerald-400">{formatPercentage(performanceMedia)}</strong></div>
                  <div>• Receita Bruta: <strong className="text-cyan-400">{formatCurrency(totalReceita)}</strong></div>
                  <div>• Repasses: <strong className="text-amber-400">{formatCurrency(totalRepasse)}</strong></div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
                >
                  <FileDown className="h-4 w-4" />
                  <span>BAIXAR ARQUIVO PDF AGORA</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyWhatsappSummary}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-200 transition-colors"
                >
                  {copiedSummary ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-cyan-400" />}
                  <span>{copiedSummary ? 'Copiado para o Clipboard!' : 'Copiar Resumo Formatado para WhatsApp'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
