import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Save,
  CheckCircle2,
  AlertCircle,
  Coins,
  Percent,
  Receipt
} from 'lucide-react';
import { FinancialSettings as SettingsType } from '../../types';
import { storage } from '../../lib/storage';
import { formatCurrency, formatPercentage } from '../../lib/calculations';

interface FinancialSettingsProps {
  onRefresh: () => void;
}

export const FinancialSettings: React.FC<FinancialSettingsProps> = ({ onRefresh }) => {
  const current = storage.getFinancialSettings();
  const [baseRate, setBaseRate] = useState<number | ''>(current.base_client_rate_brl);
  const [defaultDriverRate, setDefaultDriverRate] = useState<number | ''>(current.default_driver_rate_brl);
  const [avgCost, setAvgCost] = useState<number | ''>(current.avg_operational_cost_per_package);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (baseRate === '' || defaultDriverRate === '') {
      alert('Preencha os valores obrigatórios.');
      return;
    }

    storage.updateFinancialSettings({
      base_client_rate_brl: Number(baseRate),
      default_driver_rate_brl: Number(defaultDriverRate),
      avg_operational_cost_per_package: Number(avgCost || 0),
    });

    setIsSaved(true);
    onRefresh();
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Exemplo de cálculo da especificação: 150 pacotes
  const samplePackages = 150;
  const sampleClientRate = Number(baseRate || 4.70);
  const sampleDriverRate = 2.90; // Faixa de 96%
  const sampleRevenue = samplePackages * sampleClientRate;
  const samplePayout = samplePackages * sampleDriverRate;
  const sampleMargin = sampleRevenue - samplePayout;
  const sampleMarginPct = (sampleMargin / sampleRevenue) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-amber-400" />
          Configurações Financeiras da Transportadora
        </h2>
        <p className="text-xs text-slate-400">
          Gerenciamento do valor base recebido por pacote do embarcador, custo referencial e cálculo de margem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Configuração */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Parâmetros Globais de Faturamento</h3>
            <p className="text-xs text-slate-400">
              Esses valores são usados para projetar receitas e alimentar o fechamento automático
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Valor Recebido por Pacote do Cliente (R$) *</span>
                <span className="text-[10px] text-amber-400 font-normal">Padrão inicial R$ 4,70</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500 font-mono text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  max="100.00"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="4.70"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Remuneração contratual paga pelo cliente final/embarcador por pacote entregue com sucesso.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Valor Padrão de Referência do Motorista (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500 font-mono text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    max="100.00"
                    value={defaultDriverRate}
                    onChange={(e) => setDefaultDriverRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="3.00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Taxa usada caso o motorista ainda não possua faixas específicas configuradas.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Custo Operacional Médio / Pct (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-500 font-mono text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10.00"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.35"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Custos fixos de triagem, galpão, etiquetas e fita adesiva por volume.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {isSaved ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Valores salvos com sucesso!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 active:scale-98 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>SALVAR CONFIGURAÇÕES</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card Didático: Exemplo Real da Seção 11 */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Receipt className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Demonstração Financeira</h3>
                <p className="text-[11px] text-slate-400">Cálculo de margem por carga de 150 volumes</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">150 pacotes × {formatCurrency(sampleClientRate)} (Receita):</span>
                  <span className="font-mono font-bold text-cyan-400">{formatCurrency(sampleRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">150 pacotes × {formatCurrency(sampleDriverRate)} (Repasse):</span>
                  <span className="font-mono font-bold text-amber-400">{formatCurrency(samplePayout)}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between">
                  <span className="font-bold text-emerald-400">Margem Bruta Resultante:</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    {formatCurrency(sampleMargin)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-slate-400">Percentual de Margem:</span>
                <span className="font-mono font-bold text-emerald-400">{formatPercentage(sampleMarginPct)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-cyan-200/90 leading-relaxed">
                Essas fórmulas operam no fechamento diário e alimentam o fluxo de caixa sem intervenção manual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
