import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Calculator,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Driver, DriverPayRuleRange } from '../../types';
import { storage } from '../../lib/storage';
import {
  calculatePerformance,
  findMatchingPayTier,
  formatCurrency,
  formatPercentage
} from '../../lib/calculations';

interface RemunerationConfigProps {
  drivers: Driver[];
  selectedDriverId?: string;
  onRefresh: () => void;
}

export const RemunerationConfig: React.FC<RemunerationConfigProps> = ({
  drivers,
  selectedDriverId,
  onRefresh,
}) => {
  const [currentDriverId, setCurrentDriverId] = useState<string>(
    selectedDriverId || drivers[0]?.id || ''
  );
  const currentDriver = drivers.find((d) => d.id === currentDriverId) || drivers[0];
  const [ranges, setRanges] = useState<DriverPayRuleRange[]>(
    currentDriver?.pay_rule?.ranges || []
  );

  // Estados para adicionar nova faixa
  const [newMin, setNewMin] = useState<number | ''>(96);
  const [newMax, setNewMax] = useState<number | ''>(97.99);
  const [newRate, setNewRate] = useState<number | ''>(2.9);
  const [newLabel, setNewLabel] = useState('');

  // Simulador de cálculo ao vivo
  const [simPackages, setSimPackages] = useState(150);
  const [simFailures, setSimFailures] = useState(6);

  // Atualiza faixas quando o motorista selecionado muda
  const handleSelectDriver = (id: string) => {
    setCurrentDriverId(id);
    const d = drivers.find((drv) => drv.id === id);
    setRanges(d?.pay_rule?.ranges || []);
  };

  const handleSaveRanges = () => {
    if (!currentDriver) return;
    storage.updateDriverPayRanges(currentDriver.id, ranges);
    onRefresh();
    alert(`Tabela de remuneração de ${currentDriver.name} salva com sucesso!`);
  };

  const handleAddRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMin === '' || newMax === '' || newRate === '') {
      alert('Preencha os valores mínimos, máximos e a taxa por pacote.');
      return;
    }

    const min = Number(newMin);
    const max = Number(newMax);
    const rate = Number(newRate);

    if (min < 0 || max > 100 || min > max) {
      alert('Percentuais inválidos. Certifique-se que o mínimo seja menor ou igual ao máximo e entre 0 e 100%.');
      return;
    }

    const newTier: DriverPayRuleRange = {
      id: `tier-${Date.now()}`,
      min_percentage: min,
      max_percentage: max,
      package_rate_brl: rate,
      label: newLabel.trim() || `${formatPercentage(min)} a ${formatPercentage(max)}`,
    };

    const updated = [...ranges, newTier].sort((a, b) => b.min_percentage - a.min_percentage);
    setRanges(updated);
    storage.updateDriverPayRanges(currentDriver.id, updated);
    onRefresh();

    setNewLabel('');
  };

  const handleDeleteRange = (id: string) => {
    if (ranges.length <= 1) {
      alert('O motorista precisa de pelo menos uma faixa cadastrada.');
      return;
    }
    const updated = ranges.filter((r) => r.id !== id);
    setRanges(updated);
    storage.updateDriverPayRanges(currentDriver.id, updated);
    onRefresh();
  };

  const handleResetToStandard = () => {
    const standard: DriverPayRuleRange[] = [
      { id: 'std-1', min_percentage: 98.0, max_percentage: 100.0, package_rate_brl: 3.0, label: '98% a 100% (Meta Ouro)' },
      { id: 'std-2', min_percentage: 96.0, max_percentage: 97.99, package_rate_brl: 2.9, label: '96% a 97,99% (Prata)' },
      { id: 'std-3', min_percentage: 94.0, max_percentage: 95.99, package_rate_brl: 2.8, label: '94% a 95,99% (Bronze)' },
      { id: 'std-4', min_percentage: 90.0, max_percentage: 93.99, package_rate_brl: 2.7, label: '90% a 93,99% (Alerta)' },
      { id: 'std-5', min_percentage: 0.0,  max_percentage: 89.99, package_rate_brl: 2.6, label: '0% a 89,99% (Penalizado)' },
    ];
    setRanges(standard);
    storage.updateDriverPayRanges(currentDriver.id, standard);
    onRefresh();
  };

  // Cálculo da simulação
  const simPerf = calculatePerformance(simPackages, simFailures);
  const matchedTier = findMatchingPayTier(simPerf, ranges, 3.0);
  const simPayout = simPackages * matchedTier.rate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-400" />
            Configuração de Remuneração Variável
          </h2>
          <p className="text-xs text-slate-400">
            Cada motorista possui sua tabela própria com faixas dinâmicas de performance e valores por pacote
          </p>
        </div>

        {/* Seletor de Motorista */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Motorista:</span>
          <select
            value={currentDriverId}
            onChange={(e) => handleSelectDriver(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.vehicle_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Tabela de Faixas Cadastradas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Faixas Vigentes para</span>
                  <span className="text-amber-400 underline">{currentDriver?.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  O sistema escolhe automaticamente a faixa correspondente à performance do motorista no dia
                </p>
              </div>

              <button
                onClick={handleResetToStandard}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700"
                title="Restaurar tabela padrão recomendada"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Restaurar Padrão</span>
              </button>
            </div>

            {/* Lista das Faixas */}
            <div className="space-y-2.5">
              {ranges.map((range, index) => (
                <div
                  key={range.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 font-mono text-xs font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {formatPercentage(range.min_percentage)} a {formatPercentage(range.max_percentage)}
                        </span>
                        {range.label && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                            {range.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-amber-400 font-mono">
                        {formatCurrency(range.package_rate_brl)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/ pacote</span>
                    </div>

                    <button
                      onClick={() => handleDeleteRange(range.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                      title="Excluir faixa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulário: Adicionar Nova Faixa */}
            <form onSubmit={handleAddRange} className="pt-4 border-t border-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                + Adicionar Nova Faixa de Performance
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                    Mínimo (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={newMin}
                    onChange={(e) => setNewMin(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="96"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                    Máximo (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={newMax}
                    onChange={(e) => setNewMax(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="97.99"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="50"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="2.90"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                    Identificação (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ex: Prata"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Faixa</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Coluna 3: Simulador em Tempo Real (Exemplo 9 do Briefing) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calculator className="h-5 w-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Simulador de Repasse</h3>
                <p className="text-[11px] text-slate-400">Exemplo real com as faixas do motorista</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Pacotes Recebidos
                </label>
                <input
                  type="number"
                  min="1"
                  value={simPackages}
                  onChange={(e) => setSimPackages(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Insucessos Registrados
                </label>
                <input
                  type="number"
                  min="0"
                  max={simPackages}
                  value={simFailures}
                  onChange={(e) => setSimFailures(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Resultado do Exemplo */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Entregues:</span>
                <span className="font-mono font-bold text-white">
                  {Math.max(0, simPackages - simFailures)} pacotes
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Performance Calculada:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {formatPercentage(simPerf)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Faixa Aplicada:</span>
                <span className="font-mono font-bold text-amber-300">
                  {matchedTier.label}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-amber-500/20 pt-2">
                <span className="text-slate-200 font-semibold">Valor Unitário:</span>
                <span className="font-mono font-extrabold text-white">
                  {formatCurrency(matchedTier.rate)}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-amber-500/20 pt-2">
                <span className="text-amber-300 font-black">Total Repasse:</span>
                <span className="font-mono font-black text-amber-400 text-lg">
                  {formatCurrency(simPayout)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic leading-relaxed">
              * Conforme a regra, o cálculo é: {simPackages} pacotes × {formatCurrency(matchedTier.rate)} = {formatCurrency(simPayout)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
