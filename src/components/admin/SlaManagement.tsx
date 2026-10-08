import React, { useState } from 'react';
import { Target, Save, CheckCircle2, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { storage } from '../../lib/storage';
import { formatPercentage } from '../../lib/calculations';

interface SlaManagementProps {
  onRefresh: () => void;
}

export const SlaManagement: React.FC<SlaManagementProps> = ({ onRefresh }) => {
  const current = storage.getSlaSettings();
  const [healthyMin, setHealthyMin] = useState<number | ''>(current.healthy_min);
  const [warningMin, setWarningMin] = useState<number | ''>(current.warning_min);
  const [riskMin, setRiskMin] = useState<number | ''>(current.risk_min);
  const [targetSla, setTargetSla] = useState<number | ''>(current.target_operational_sla);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (healthyMin === '' || warningMin === '' || riskMin === '') {
      alert('Preencha todos os limiares de SLA.');
      return;
    }

    const h = Number(healthyMin);
    const w = Number(warningMin);
    const r = Number(riskMin);

    if (h <= w || w <= r) {
      alert('Regra de consistência: Saudável deve ser maior que Atenção, e Atenção maior que Risco.');
      return;
    }

    storage.updateSlaSettings({
      healthy_min: h,
      warning_min: w,
      risk_min: r,
      critical_threshold: r,
      target_operational_sla: Number(targetSla || 98.0),
    });

    setIsSaved(true);
    onRefresh();
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-400" />
          Gestão de Níveis de Serviço (SLA Operacional)
        </h2>
        <p className="text-xs text-slate-400">
          Configure as faixas de tolerância que acionam os semáforos visuais da operação (Verde, Amarelo, Laranja, Vermelho)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Configuração */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Parâmetros de Tolerância de SLA</h3>
            <p className="text-xs text-slate-400">
              Esses limites são aplicados instantaneamente na Central da Operação e nos alertas aos motoristas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Meta Geral */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Meta Geral da Transportadora (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="80"
                max="100"
                value={targetSla}
                onChange={(e) => setTargetSla(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="98.0"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            {/* Os 4 Semáforos Solicitados */}
            <div className="space-y-3 pt-2">
              {/* 🟢 Saudável */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🟢</span>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                      SLA Saudável (Mínimo em %)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Operação excelente sem risco de glosa
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">&gt;=</span>
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    value={healthyMin}
                    onChange={(e) => setHealthyMin(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 text-center"
                    required
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              {/* 🟡 Atenção */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🟡</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      SLA em Atenção (Mínimo em %)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Variação entre {warningMin}% e {(Number(healthyMin || 95) - 0.01).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">&gt;=</span>
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    value={warningMin}
                    onChange={(e) => setWarningMin(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono font-bold text-amber-400 text-center"
                    required
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              {/* 🟠 Risco */}
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🟠</span>
                  <div>
                    <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wide">
                      SLA em Risco (Mínimo em %)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Variação entre {riskMin}% e {(Number(warningMin || 93) - 0.01).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">&gt;=</span>
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    value={riskMin}
                    onChange={(e) => setRiskMin(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono font-bold text-orange-400 text-center"
                    required
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              {/* 🔴 Crítico */}
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔴</span>
                  <div>
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                      SLA Crítico
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Qualquer performance abaixo de {riskMin}% entra automaticamente em estado crítico
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-rose-500/20">
                  &lt; {riskMin}%
                </span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              {isSaved ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Parâmetros de SLA atualizados!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 active:scale-98 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>SALVAR NÍVEIS DE SLA</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card Explicativo */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Impacto no Painel</h3>
                <p className="text-[11px] text-slate-400">Como o SLA orienta a central</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <p>
                Os limiares de SLA servem para acionar gatilhos operacionais em tempo real:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Motoristas em <strong className="text-amber-300">Atenção</strong> recebem prioridade de contato pelo WhatsApp da expedição.</li>
                <li>Motoristas em <strong className="text-rose-400">Crítico</strong> disparam card de alerta destacado no topo da Central de Operação.</li>
                <li>A performance geral da transportadora recalcula o SLA global a cada novo insucesso registrado.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
