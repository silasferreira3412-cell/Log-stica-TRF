// ==============================================================================
// RotaMaster - Motor de Cálculos e Regras de Negócio
// ==============================================================================

import {
  DriverPayRuleRange,
  SlaSettings,
  FinancialSettings,
  DailyOperation,
  DeliveryFailure,
  IntelligenceInsight
} from '../types';

/**
 * Calcula a porcentagem de performance de entregas:
 * Performance = ((Pacotes recebidos - Insucessos) / Pacotes recebidos) * 100
 */
export function calculatePerformance(packagesReceived: number, failuresCount: number): number {
  if (!packagesReceived || packagesReceived <= 0) return 100;
  const successful = Math.max(0, packagesReceived - failuresCount);
  const percentage = (successful / packagesReceived) * 100;
  // Arredonda para 2 casas decimais precisas
  return Math.round(percentage * 100) / 100;
}

/**
 * Formata percentual no padrão brasileiro: ex: 98,00% ou 96,67%
 */
export function formatPercentage(value: number): string {
  if (isNaN(value)) return '0,00%';
  return `${value.toFixed(2).replace('.', ',')}%`;
}

/**
 * Formata valores monetários em BRL: ex: R$ 435,00
 */
export function formatCurrency(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Encontra a faixa de remuneração correspondente à performance atual do motorista
 */
export function findMatchingPayTier(
  performance: number,
  ranges: DriverPayRuleRange[] = [],
  fallbackRate = 3.00
): { rate: number; label: string } {
  if (!ranges || ranges.length === 0) {
    return {
      rate: fallbackRate,
      label: `Faixa Padrão (${formatCurrency(fallbackRate)})`,
    };
  }

  // Ordena por min_percentage decrescente para testar as melhores faixas primeiro
  const sorted = [...ranges].sort((a, b) => b.min_percentage - a.min_percentage);

  for (const range of sorted) {
    // Verificação inclusiva da faixa
    // Adicionamos tolerância infinitesimal para evitar erros de ponto flutuante (ex: 97.99 vs 97.991)
    if (performance >= range.min_percentage - 0.001 && performance <= range.max_percentage + 0.009) {
      return {
        rate: range.package_rate_brl,
        label: range.label || `${formatPercentage(range.min_percentage)} a ${formatPercentage(range.max_percentage)} (${formatCurrency(range.package_rate_brl)})`,
      };
    }
  }

  // Se o motorista estiver abaixo da menor faixa configurada, pega a menor taxa cadastrada
  const lowestRange = [...ranges].sort((a, b) => a.min_percentage - b.min_percentage)[0];
  if (lowestRange && performance < lowestRange.min_percentage) {
    return {
      rate: lowestRange.package_rate_brl,
      label: lowestRange.label || `< ${formatPercentage(lowestRange.min_percentage)} (${formatCurrency(lowestRange.package_rate_brl)})`,
    };
  }

  return {
    rate: fallbackRate,
    label: `Faixa de Referência (${formatCurrency(fallbackRate)})`,
  };
}

/**
 * Determina o status do SLA com base nas configurações
 */
export function getSlaStatus(
  sla: number,
  settings: SlaSettings
): {
  status: 'healthy' | 'warning' | 'risk' | 'critical';
  label: string;
  badgeClass: string;
  dotColor: string;
} {
  if (sla >= settings.healthy_min) {
    return {
      status: 'healthy',
      label: 'SLA Saudável',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  }
  if (sla >= settings.warning_min) {
    return {
      status: 'warning',
      label: 'SLA em Atenção',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-500',
    };
  }
  if (sla >= settings.risk_min) {
    return {
      status: 'risk',
      label: 'SLA em Risco',
      badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      dotColor: 'bg-orange-500',
    };
  }
  return {
    status: 'critical',
    label: 'SLA Crítico',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dotColor: 'bg-rose-500',
  };
}

/**
 * Gera diagnósticos inteligentes com base nas operações e insucessos do dia
 */
export function generateOperationalInsights(
  operations: DailyOperation[],
  failures: DeliveryFailure[],
  financialSettings: FinancialSettings,
  slaSettings: SlaSettings
): IntelligenceInsight[] {
  const insights: IntelligenceInsight[] = [];

  const totalPackages = operations.reduce((acc, op) => acc + op.packages_received, 0);
  const totalFailures = failures.length;
  const overallSla = calculatePerformance(totalPackages, totalFailures);

  // 1. Diagnóstico Geral de SLA
  if (overallSla < slaSettings.healthy_min) {
    const isCritical = overallSla < slaSettings.critical_threshold;
    insights.push({
      id: 'sla-alert',
      category: 'sla',
      severity: isCritical ? 'critical' : 'warning',
      problem_detected: `SLA geral da operação está em ${formatPercentage(overallSla)}, abaixo do nível saudável (${formatPercentage(slaSettings.healthy_min)}).`,
      impact: `Risco de penalidade contratual com o cliente contratante e insatisfação no porta a porta.`,
      suggestion: `Acionar suporte operacional nos setores com maior acúmulo de insucessos antes das 17h.`,
      recommended_action: `Reordenar rotas críticas e contatar motoristas em situação amarela/vermelha imediatamente.`,
    });
  } else {
    insights.push({
      id: 'sla-healthy',
      category: 'sla',
      severity: 'healthy',
      problem_detected: `Operação operando com SLA excelente de ${formatPercentage(overallSla)}.`,
      impact: `Meta contratual batida com margem e preservação do índice de pontualidade.`,
      suggestion: `Manter a cadência de saídas matinais pontuais e suporte em campo.`,
      recommended_action: `Reconhecer os motoristas líderes no ranking diário.`,
    });
  }

  // 2. Análise de Motivos de Insucesso
  if (failures.length > 0) {
    const reasonCounts: Record<string, number> = {};
    failures.forEach((f) => {
      reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
    });

    const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
    const [topReason, topCount] = sortedReasons[0];
    const topPercentage = ((topCount / failures.length) * 100).toFixed(1);

    if (topReason === 'Cliente ausente') {
      insights.push({
        id: 'reason-absent',
        category: 'failure',
        severity: 'warning',
        problem_detected: `O principal motivo de insucesso hoje é "Cliente ausente" (${topCount} casos, ${topPercentage}% do total).`,
        impact: `Custo de reentrega e tempo ocioso do motorista aguardando no interfone/portaria.`,
        suggestion: `Disparar SMS / WhatsApp automático informando aproximação da entrega ao destinatário 30 min antes.`,
        recommended_action: `Instruir motoristas a tentar contato via aplicativo com o vizinho ou portaria antes de registrar baixa.`,
      });
    } else if (topReason === 'Endereço não localizado' || topReason === 'Problema no endereço') {
      insights.push({
        id: 'reason-address',
        category: 'route',
        severity: 'risk',
        problem_detected: `Alta incidência de endereços com problema ou não localizados (${topCount} casos, ${topPercentage}%).`,
        impact: `Quilometragem extra rodada pelos motoristas e perda de velocidade no trecho.`,
        suggestion: `Higienizar a base de CEPs e validar endereços no momento da emissão matinal.`,
        recommended_action: `Enviar geolocalização e fotos de satélite para o motorista no WhatsApp da rota.`,
      });
    } else {
      insights.push({
        id: 'reason-generic',
        category: 'failure',
        severity: 'warning',
        problem_detected: `Motivo preponderante: "${topReason}" concentrando ${topPercentage}% dos insucessos.`,
        impact: `${topCount} pacotes não entregues necessitando de repasse no dia seguinte.`,
        suggestion: `Auditar os comprovantes fotográficos das etiquetas desse motivo na aba "Insucessos".`,
        recommended_action: `Revisar procedimento operacional padrão junto à equipe de carregamento matinal.`,
      });
    }
  }

  // 3. Concentração de Insucessos por Motorista
  const driverFailures: Record<string, { name: string; count: number; perf: number }> = {};
  operations.forEach((op) => {
    const opFailures = failures.filter((f) => f.operation_id === op.id).length;
    const perf = calculatePerformance(op.packages_received, opFailures);
    driverFailures[op.driver_id] = {
      name: op.driver_name,
      count: opFailures,
      perf,
    };
  });

  const criticalDrivers = Object.values(driverFailures).filter((d) => d.perf < slaSettings.critical_threshold);
  if (criticalDrivers.length > 0) {
    const driverNames = criticalDrivers.map((d) => d.name).slice(0, 3).join(', ');
    insights.push({
      id: 'critical-drivers',
      category: 'driver',
      severity: 'critical',
      problem_detected: `${criticalDrivers.length} motorista(s) estão com performance crítica abaixo de ${formatPercentage(slaSettings.critical_threshold)} (${driverNames}).`,
      impact: `Queda no repasse do motorista, frustração com remuneração e impacto severo no SLA da base.`,
      suggestion: `Verificar se a rota atribuída teve sinistro, trânsito atípico ou pacotes com avaria.`,
      recommended_action: `Chamar o motorista para alinhamento e verificar se necessita de apoio de um parceiro na mesma região.`,
    });
  }

  // 4. Margem Financeira e Repasses
  const totalRevenue = operations.reduce((acc, op) => acc + (op.packages_received * financialSettings.base_client_rate_brl), 0);
  const totalPayout = operations.reduce((acc, op) => {
    const opFailures = failures.filter((f) => f.operation_id === op.id).length;
    const perf = calculatePerformance(op.packages_received, opFailures);
    const { rate } = findMatchingPayTier(perf, [], financialSettings.default_driver_rate_brl);
    return acc + (op.packages_received * rate);
  }, 0);

  const grossMargin = totalRevenue - totalPayout;
  const marginPercentage = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

  insights.push({
    id: 'financial-margin',
    category: 'cost',
    severity: marginPercentage >= 35 ? 'healthy' : 'warning',
    problem_detected: `Margem bruta estimada em ${formatCurrency(grossMargin)} (${formatPercentage(marginPercentage)} da receita).`,
    impact: `Receita prevista de ${formatCurrency(totalRevenue)} vs Repasse aos motoristas de ${formatCurrency(totalPayout)}.`,
    suggestion: `Acompanhar o fechamento diário individual para travar os valores de repasse com precisão.`,
    recommended_action: `Manter a meta de rentabilidade operacional acima de 35% de margem líquida.`,
  });

  return insights;
}
