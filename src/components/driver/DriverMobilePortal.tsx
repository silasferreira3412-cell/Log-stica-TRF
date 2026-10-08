import React, { useState } from 'react';
import {
  Truck,
  AlertTriangle,
  CheckCircle2,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  History,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  LogOut,
  Camera
} from 'lucide-react';
import { DailyOperation, DeliveryFailure } from '../../types';
import { storage } from '../../lib/storage';
import { formatCurrency, formatPercentage } from '../../lib/calculations';
import { RegisterFailureModal } from './RegisterFailureModal';
import { PhotoViewerModal } from '../common/PhotoViewerModal';

interface DriverMobilePortalProps {
  operationTokenOrCode: string;
  onExitPortal?: () => void;
}

export const DriverMobilePortal: React.FC<DriverMobilePortalProps> = ({
  operationTokenOrCode,
  onExitPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'tiers'>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState<DeliveryFailure | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Recarrega os dados em tempo real
  const operation = storage.getOperationByTokenOrCode(operationTokenOrCode);
  const failures = operation ? storage.getFailures(operation.id) : [];
  const driver = operation ? storage.getDriverById(operation.driver_id) : null;
  const payRanges = driver?.pay_rule?.ranges || [];

  if (!operation) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold">Operação Não Localizada</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xs">
          O link ou código <span className="font-mono text-cyan-400">{operationTokenOrCode}</span> não foi encontrado ou expirou.
        </p>
        <button
          onClick={onExitPortal}
          className="mt-6 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
        >
          Voltar para Central
        </button>
      </div>
    );
  }

  const packagesReceived = operation.packages_received;
  const insucessos = failures.length;
  const entregues = Math.max(0, packagesReceived - insucessos);
  const performance = operation.performance_percentage ?? 100;
  const meta = driver?.target_sla ?? 98.0;
  const valorAtualPorPacote = operation.current_rate_brl ?? 3.0;
  const repasseEstimado = operation.estimated_payout_brl ?? (packagesReceived * valorAtualPorPacote);

  const isDentroDaMeta = performance >= meta;
  const isCritico = performance < 90.0;

  const handleFailureRegistered = () => {
    setIsModalOpen(false);
    setRefreshKey((prev) => prev + 1);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl relative pb-24">
      {/* Toast de Sucesso */}
      {showSuccessToast && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto rounded-2xl bg-emerald-600 text-white p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 border border-emerald-400/30">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm">Insucesso Registrado com Sucesso!</p>
            <p className="opacity-90">Sua performance e remuneração foram recalculadas.</p>
          </div>
        </div>
      )}

      {/* Top Header Mobile */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase block">
              Portal do Motorista
            </span>
            <h1 className="text-sm font-bold text-white truncate max-w-[180px]">
              {operation.driver_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Atualizar dados"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {onExitPortal && (
            <button
              onClick={onExitPortal}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 space-y-4 flex-1">
        {/* Banner com Título da Operação */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-amber-400" /> MINHA OPERAÇÃO
              </span>
              <p className="text-lg font-bold text-white font-mono mt-0.5">
                {operation.code}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                <Calendar className="h-3.5 w-3.5" /> Data
              </span>
              <p className="text-xs font-semibold text-slate-200">
                {new Date(operation.operation_date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {operation.route_name && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Rota: <strong className="text-slate-200">{operation.route_name}</strong>
            </div>
          )}
        </div>

        {/* TABS NAVEGAÇÃO DO MOTORISTA */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('home')}
            className={`rounded-lg py-2 transition-all ${
              activeTab === 'home'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Operação
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`rounded-lg py-2 transition-all flex items-center justify-center gap-1 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Insucessos ({insucessos})
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`rounded-lg py-2 transition-all ${
              activeTab === 'tiers'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Minhas Faixas
          </button>
        </div>

        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Status visual do SLA / Meta */}
            <div
              className={`rounded-2xl border p-4 text-center ${
                isDentroDaMeta
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isCritico
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-sm font-bold tracking-wide uppercase">
                <span className="text-base">
                  {isDentroDaMeta ? '🟢' : isCritico ? '🔴' : '🟡'}
                </span>
                <span>
                  {isDentroDaMeta
                    ? 'DENTRO DA META'
                    : isCritico
                    ? 'SITUAÇÃO CRÍTICA'
                    : 'ATENÇÃO NA META'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Meta estabelecida: <strong className="font-mono">{formatPercentage(meta)}</strong> • Sua performance: <strong className="font-mono">{formatPercentage(performance)}</strong>
              </p>
            </div>

            {/* Painel Central de Números - 4 Blocos Principais */}
            <div className="grid grid-cols-2 gap-3">
              {/* Pacotes Recebidos */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Pacotes Recebidos
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {packagesReceived}
                  </span>
                  <span className="text-xs text-slate-500">cx</span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-400 font-semibold">
                  ✓ {entregues} entregues
                </div>
              </div>

              {/* Insucessos */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Insucessos
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-rose-400 font-mono">
                    {insucessos}
                  </span>
                  <span className="text-xs text-slate-500">cx</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  {insucessos === 0 ? 'Nenhum insucesso' : `${insucessos} c/ foto etiqueta`}
                </div>
              </div>

              {/* Performance */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Performance
                </span>
                <div className="mt-1">
                  <span
                    className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                      isDentroDaMeta ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {formatPercentage(performance)}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  Meta da transportadora: {formatPercentage(meta)}
                </div>
              </div>

              {/* Valor Atual por Pacote */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
                  Valor Atual / Pacote
                </span>
                <div className="mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                    {formatCurrency(valorAtualPorPacote)}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 truncate" title={operation.current_tier_label}>
                  {operation.current_tier_label || 'Faixa vigente'}
                </div>
              </div>
            </div>

            {/* Repasse Total Estimado */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  Repasse total previsto do dia
                </span>
                <p className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
                  {formatCurrency(repasseEstimado)}
                </p>
                <p className="text-[11px] text-slate-500">
                  {packagesReceived} pacotes × {formatCurrency(valorAtualPorPacote)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>

            {/* BOTÃO PRINCIPAL GIGANTE: REGISTRAR INSUCESSO */}
            <div className="pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-amber-500 py-5 px-6 text-lg font-black text-slate-950 shadow-xl shadow-amber-500/25 hover:bg-amber-400 active:scale-[0.98] transition-all"
              >
                <Camera className="h-6 w-6" />
                <span>REGISTRAR INSUCESSO</span>
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Bipe ou digite o ID do pacote e fotografe a etiqueta da embalagem
              </p>
            </div>
          </div>
        )}

        {/* TAB HISTÓRICO DE INSUCESSOS DO MOTORISTA */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Insucessos Registrados ({failures.length})
              </h3>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                + Novo Insucesso
              </button>
            </div>

            {failures.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-white">Nenhum Insucesso!</p>
                <p className="text-xs text-slate-400 mt-1">
                  Todas as entregas estão correndo normalmente hoje.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {failures.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFailure(f)}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3 hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    <img
                      src={f.photo_url}
                      alt="Etiqueta"
                      className="h-14 w-14 rounded-lg object-cover border border-slate-700 bg-black shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white truncate">
                          {f.package_id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(f.registered_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className="inline-block rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/30 mt-1">
                        {f.reason}
                      </span>
                      {f.notes && (
                        <p className="text-[11px] text-slate-400 truncate mt-1 italic">
                          "{f.notes}"
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB MINHAS FAIXAS DE REMUNERAÇÃO */}
        {activeTab === 'tiers' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
              <span className="text-xs font-bold text-white block">
                Sua Tabela Individual de Remuneração
              </span>
              <p className="text-xs text-slate-400 mt-1">
                O valor por pacote é selecionado automaticamente conforme sua performance de entregas no final do dia.
              </p>
            </div>

            <div className="space-y-2">
              {payRanges.map((range) => {
                const isActiveRange =
                  performance >= range.min_percentage - 0.001 &&
                  performance <= range.max_percentage + 0.009;

                return (
                  <div
                    key={range.id}
                    className={`rounded-xl border p-3 flex items-center justify-between transition-all ${
                      isActiveRange
                        ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/40'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {formatPercentage(range.min_percentage)} a {formatPercentage(range.max_percentage)}
                        </span>
                        {isActiveRange && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase">
                            Sua Faixa Atual
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {range.label || 'Faixa de remuneração'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-amber-400 font-mono">
                        {formatCurrency(range.package_rate_brl)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/ pacote</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Registro de Insucesso */}
      {isModalOpen && (
        <RegisterFailureModal
          operationId={operation.id}
          operationCode={operation.code}
          driverName={operation.driver_name}
          onSuccess={handleFailureRegistered}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Modal de Foto e Comprovante */}
      {selectedFailure && (
        <PhotoViewerModal
          failure={selectedFailure}
          onClose={() => setSelectedFailure(null)}
        />
      )}
    </div>
  );
};
