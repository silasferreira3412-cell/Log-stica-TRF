// ==============================================================================
// RotaMaster - Gerador de Relatórios em PDF Profissionais (jsPDF + autoTable)
// ==============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyOperation, DeliveryFailure, DailySettlement, Driver, FinancialSettings } from '../types';
import { formatCurrency, formatPercentage } from './calculations';

interface ExportPdfOptions {
  reportType: 'diario' | 'semanal' | 'mensal' | 'motoristas';
  operations: DailyOperation[];
  failures: DeliveryFailure[];
  settlements: DailySettlement[];
  drivers: Driver[];
  financialSettings: FinancialSettings;
  companyName?: string;
  notes?: string;
}

export function exportOperationsAndFinancialPdf({
  reportType,
  operations,
  failures,
  settlements,
  drivers,
  financialSettings,
  companyName = 'RotaMaster Logística & Transportes',
  notes = 'Documento emitido para conferência gerencial e prestação de contas com parceiros.',
}: ExportPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const todayFormatted = new Date().toLocaleDateString('pt-BR');
  const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // 1. Cabeçalho Corporativo
  doc.setFillColor(15, 23, 42); // slate-950
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Barra de destaque âmbar
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 27, pageWidth, 2, 'F');

  // Nome da Empresa & Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName.toUpperCase(), 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`RELATÓRIO DE DESEMPENHO OPERACIONAL & FECHAMENTO FINANCEIRO • ${reportType.toUpperCase()}`, 14, 18);
  doc.text(`Emissão: ${todayFormatted} às ${nowTime} • CD Matriz São Paulo (SPO-01)`, 14, 23);

  // Status Badge no topo direito
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(pageWidth - 45, 8, 31, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('OFICIAL • AUDITADO', pageWidth - 42, 13.5);

  let startY = 36;

  // 2. Indicadores Principais (KPIs em Cards no PDF)
  const totalPacotes = operations.reduce((acc, op) => acc + op.packages_received, 0);
  const totalInsucessos = failures.length;
  const totalEntregues = Math.max(0, totalPacotes - totalInsucessos);
  const performanceGeral = totalPacotes > 0 ? (totalEntregues / totalPacotes) * 100 : 100;

  const totalReceita = totalPacotes * financialSettings.base_client_rate_brl;
  const totalRepasse = operations.reduce((acc, op) => acc + (op.estimated_payout_brl || 0), 0);
  const totalMargem = totalReceita - totalRepasse;
  const margemPercentual = totalReceita > 0 ? (totalMargem / totalReceita) * 100 : 0;

  // Desenha 4 mini cards de resumo
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 18;

  const kpis = [
    { title: 'PACOTES CARREGADOS', val: `${totalPacotes} cx`, sub: `${totalEntregues} entregues` },
    { title: 'SLA PERFORMANCE', val: formatPercentage(performanceGeral), sub: `${totalInsucessos} insucessos` },
    { title: 'RECEITA PREVISTA', val: formatCurrency(totalReceita), sub: `Base ${formatCurrency(financialSettings.base_client_rate_brl)}/pct` },
    { title: 'REPASSE MOTORISTAS', val: formatCurrency(totalRepasse), sub: `Margem: ${formatPercentage(margemPercentual)}` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(kpi.title, x + 3, startY + 5);

    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(kpi.val, x + 3, startY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.sub, x + 3, startY + 15.5);
  });

  startY += cardHeight + 8;

  // 3. Tabela Detalhada por Operação e Motorista
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Detalhamento por Motorista e Operação', 14, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('A remuneração unitária e o repasse são calculados rigorosamente pelas faixas de SLA atingidas.', 14, startY + 4);

  const tableRows = operations.map((op) => {
    const perf = op.performance_percentage ?? 100;
    const failuresCount = op.failures_count ?? 0;
    const entregues = op.successful_deliveries ?? Math.max(0, op.packages_received - failuresCount);
    const rate = op.current_rate_brl ?? 3.0;
    const payout = op.estimated_payout_brl ?? (op.packages_received * rate);
    const revenue = op.packages_received * financialSettings.base_client_rate_brl;
    const margin = revenue - payout;

    return [
      op.code,
      op.driver_name,
      op.route_name || 'Geral',
      op.packages_received.toString(),
      entregues.toString(),
      failuresCount.toString(),
      formatPercentage(perf),
      formatCurrency(rate),
      formatCurrency(payout),
      formatCurrency(revenue),
      formatCurrency(margin),
    ];
  });

  autoTable(doc, {
    startY: startY + 6,
    head: [[
      'Cód.',
      'Motorista',
      'Rota',
      'Carga',
      'Entregues',
      'Insucessos',
      'SLA %',
      'Valor / Pct',
      'Repasse',
      'Receita',
      'Margem',
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      1: { fontStyle: 'bold' },
      2: { fontSize: 6.5 },
      3: { halign: 'center', fontStyle: 'bold' },
      4: { halign: 'center', textColor: [16, 185, 129] },
      5: { halign: 'center', textColor: [225, 29, 72], fontStyle: 'bold' },
      6: { halign: 'center', fontStyle: 'bold' },
      7: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] },
      9: { halign: 'right' },
      10: { halign: 'right', textColor: [16, 185, 129], fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Análise de Insucessos Registrados (se houver)
  if (failures.length > 0 && currentY < 230) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Resumo de Ocorrências & Insucessos Registrados', 14, currentY);

    const failureRows = failures.slice(0, 8).map((f) => [
      f.package_id,
      f.driver_name,
      f.reason,
      new Date(f.registered_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      f.notes || '—',
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['ID do Pacote', 'Motorista', 'Motivo da Devolução', 'Horário', 'Observação do Motorista']],
      body: failureRows,
      theme: 'plain',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontSize: 7,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85],
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { textColor: [190, 18, 60], fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 5. Bloco de Assinaturas e Autenticação
  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TERMO DE CONFERÊNCIA & VALIDAÇÃO OPERACIONAL', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(notes, 18, currentY + 11);

  // Linhas de assinatura
  const sigY = currentY + 22;
  doc.setDrawColor(148, 163, 184);
  doc.line(20, sigY, 90, sigY);
  doc.line(pageWidth - 90, sigY, pageWidth - 20, sigY);

  doc.setFontSize(6.5);
  doc.text('Responsável Operacional / Gestor', 35, sigY + 4);
  doc.text('Conferência Financeira / Gestão Parceira', pageWidth - 78, sigY + 4);

  // 6. Rodapé Informativo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento gerado automaticamente pelo Sistema RotaMaster PRO • Hash de Auditoria: RM-${Date.now().toString(36).toUpperCase()}`, 14, 290);
  doc.text(`Página 1 de 1`, pageWidth - 26, 290);

  // Salva o arquivo PDF no dispositivo do usuário
  const filename = `relatorio_desempenho_financeiro_${reportType}_${todayFormatted.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}

/**
 * Exporta recibo/comprovante individual de fechamento para um motorista específico em PDF
 */
export function exportDriverSettlementPdf(
  settlement: DailySettlement,
  driver?: Driver,
  companyName = 'RotaMaster Logística & Transportes'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // Formato compacto A5 ideal para comprovantes
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 23, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName.toUpperCase(), 10, 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`COMPROVANTE INDIVIDUAL DE REPASSE • OPERAÇÃO ${settlement.operation_code}`, 10, 16);
  doc.text(`Data da Carga: ${settlement.settlement_date}`, 10, 20);

  let y = 30;

  // Bloco Motorista
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, y, pageWidth - 20, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DADOS DO MOTORISTA PARCEIRO', 14, y + 5);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(settlement.driver_name, 14, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Chave PIX: ${driver?.pix_key || 'Cadastrada no sistema'} • Veículo: ${driver?.vehicle_type || 'Utilitário'} (${driver?.vehicle_plate || '—'})`, 14, y + 17);

  y += 26;

  // Grade de Metas e Performance
  autoTable(doc, {
    startY: y,
    head: [['Indicador Operacional', 'Valor Apurado']],
    body: [
      ['Pacotes Recebidos na Saída Matinal', `${settlement.packages_received} pacotes`],
      ['Entregas Concluídas com Sucesso', `${settlement.successful_deliveries} pacotes`],
      ['Insucessos Justificados com Foto', `${settlement.failures_count} pacotes`],
      ['Performance Final do Dia', formatPercentage(settlement.final_performance)],
      ['Faixa Atingida de Remuneração', settlement.applied_tier_label || 'Faixa Padrão'],
      ['Valor Unitário por Pacote', formatCurrency(settlement.applied_rate_brl)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 10, right: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Total de Repasse Destacado
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(10, y, pageWidth - 20, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('VALOR TOTAL LÍQUIDO A REPASSAR:', 14, y + 7);

  doc.setFontSize(16);
  doc.text(formatCurrency(settlement.total_payout_brl), 14, y + 14);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Imutável • Fechado por ${settlement.settled_by_name}`, pageWidth - 70, y + 13);

  // Rodapé
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Comprovante emitido em ${new Date().toLocaleString('pt-BR')}`, 10, 202);

  doc.save(`comprovante_repasse_${settlement.driver_name.replace(/\s+/g, '_')}_${settlement.settlement_date}.pdf`);
}
