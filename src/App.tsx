import React, { useState, useEffect } from 'react';
import {
  Truck,
  LayoutDashboard,
  Package,
  TrendingUp,
  Target,
  XCircle,
  Camera,
  DollarSign,
  Trophy,
  BrainCircuit,
  FileSpreadsheet,
  Settings,
  Database,
  Smartphone,
  PlusCircle,
  ArrowLeft,
  RefreshCw,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { storage } from './lib/storage';
import { DailyOperation, Driver, DeliveryFailure } from './types';
import { Sidebar, AdminTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OperationsDashboard } from './components/admin/OperationsDashboard';
import { DistributeLoadModal } from './components/admin/DistributeLoadModal';
import { DriversManagement } from './components/admin/DriversManagement';
import { RemunerationConfig } from './components/admin/RemunerationConfig';
import { PerformanceTable } from './components/admin/PerformanceTable';
import { FailuresLog } from './components/admin/FailuresLog';
import { DailySettlement } from './components/admin/DailySettlement';
import { FinancialSettings } from './components/admin/FinancialSettings';
import { SlaManagement } from './components/admin/SlaManagement';
import { OperationalIntelligence } from './components/admin/OperationalIntelligence';
import { RankingPage } from './components/admin/RankingPage';
import { ReportsPage } from './components/admin/ReportsPage';
import { SupabaseSettings } from './components/admin/SupabaseSettings';
import { DriverMobilePortal } from './components/driver/DriverMobilePortal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-08');
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modo Motorista
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [activeDriverToken, setActiveDriverToken] = useState<string>('ABC123');
  const [selectedDriverForRemun, setSelectedDriverForRemun] = useState<Driver | undefined>(undefined);

  // Checa se veio parâmetro de operação na URL (?op=ABC123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const opParam = params.get('op');
    if (opParam) {
      setActiveDriverToken(opParam);
      setIsDriverMode(true);
    }
  }, []);

  // Dados reativos carregados do armazenamento
  const operations = storage.getOperations(selectedDate);
  const allOperations = storage.getOperations();
  const failures = storage.getFailures();
  const drivers = storage.getDrivers();
  const settlements = storage.getSettlements();

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOpenDriverPreview = (tokenOrCode?: string) => {
    if (tokenOrCode) {
      setActiveDriverToken(tokenOrCode);
    } else {
      // Pega a primeira operação ativa do dia ou padrão ABC123
      const firstOp = operations[0] || allOperations[0];
      setActiveDriverToken(firstOp ? firstOp.share_token : 'ABC123');
    }
    setIsDriverMode(true);
  };

  const handleExitDriverPortal = () => {
    setIsDriverMode(false);
    // Limpa URL param se existir
    if (window.history.pushState) {
      const newUrl = window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    handleRefresh();
  };

  const handleOpenRemuneration = (driver: Driver) => {
    setSelectedDriverForRemun(driver);
    setCurrentTab('settings');
  };

  // Se o usuário estiver no modo motorista (visualização no celular)
  if (isDriverMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start">
        {/* Barra superior de controle para alternar de volta para o admin */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 z-50">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Visualização Mobile do Motorista</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor rápido de motorista para teste */}
            <select
              value={activeDriverToken}
              onChange={(e) => setActiveDriverToken(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 font-mono"
            >
              {allOperations.map((o) => (
                <option key={o.id} value={o.share_token}>
                  {o.driver_name} ({o.code})
                </option>
              ))}
            </select>

            <button
              onClick={handleExitDriverPortal}
              className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1 font-bold text-slate-950 shadow transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar à Central Admin</span>
            </button>
          </div>
        </div>

        {/* Portal móvel do motorista */}
        <DriverMobilePortal
          operationTokenOrCode={activeDriverToken}
          onExitPortal={handleExitDriverPortal}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenDistributeModal={() => setIsDistributeModalOpen(true)}
          onOpenDriverPreview={() => handleOpenDriverPreview()}
          activeOperationsCount={operations.length}
        />
      </div>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left-4 duration-200">
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <span className="font-extrabold text-white text-base">Menu Operacional</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenDistributeModal={() => {
                setIsDistributeModalOpen(true);
                setMobileMenuOpen(false);
              }}
              onOpenDriverPreview={() => {
                handleOpenDriverPreview();
                setMobileMenuOpen(false);
              }}
              activeOperationsCount={operations.length}
            />
          </div>
        </div>
      )}

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onRefreshData={handleRefresh}
          onOpenDriverPreview={() => handleOpenDriverPreview()}
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(date)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* 1. CENTRAL DA OPERAÇÃO (DASHBOARD) */}
          {currentTab === 'dashboard' && (
            <OperationsDashboard
              operations={operations}
              failures={failures}
              drivers={drivers}
              onOpenDistributeModal={() => setIsDistributeModalOpen(true)}
              onOpenDriverView={(token) => handleOpenDriverPreview(token)}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {/* 2. OPERAÇÕES DO DIA */}
          {currentTab === 'operations' && (
            <PerformanceTable
              operations={operations}
              drivers={drivers}
              onOpenDriverView={(token) => handleOpenDriverPreview(token)}
            />
          )}

          {/* 3. MOTORISTAS */}
          {currentTab === 'drivers' && (
            <DriversManagement
              drivers={drivers}
              onRefresh={handleRefresh}
              onOpenRemuneration={handleOpenRemuneration}
            />
          )}

          {/* 4. PERFORMANCE */}
          {currentTab === 'performance' && (
            <PerformanceTable
              operations={operations}
              drivers={drivers}
              onOpenDriverView={(token) => handleOpenDriverPreview(token)}
            />
          )}

          {/* 5. SLA */}
          {currentTab === 'sla' && (
            <SlaManagement onRefresh={handleRefresh} />
          )}

          {/* 6. INSUCESSOS */}
          {currentTab === 'failures' && (
            <FailuresLog failures={failures} onRefresh={handleRefresh} />
          )}

          {/* 7. COMPROVANTES & FOTOS */}
          {currentTab === 'receipts' && (
            <FailuresLog failures={failures} onRefresh={handleRefresh} />
          )}

          {/* 8. FECHAMENTO DIÁRIO */}
          {currentTab === 'settlement' && (
            <DailySettlement operations={operations} onRefresh={handleRefresh} />
          )}

          {/* 9. FINANCEIRO */}
          {currentTab === 'financial' && (
            <FinancialSettings onRefresh={handleRefresh} />
          )}

          {/* 10. RANKING */}
          {currentTab === 'ranking' && (
            <RankingPage operations={operations} drivers={drivers} />
          )}

          {/* 11. INTELIGÊNCIA */}
          {currentTab === 'intelligence' && (
            <OperationalIntelligence
              operations={operations}
              failures={failures}
              drivers={drivers}
            />
          )}

          {/* 12. RELATÓRIOS */}
          {currentTab === 'reports' && (
            <ReportsPage
              operations={operations}
              failures={failures}
              settlements={settlements}
              drivers={drivers}
            />
          )}

          {/* 13. CONFIGURAÇÕES DE REMUNERAÇÃO */}
          {currentTab === 'settings' && (
            <RemunerationConfig
              drivers={drivers}
              selectedDriverId={selectedDriverForRemun?.id}
              onRefresh={handleRefresh}
            />
          )}

          {/* 14. BANCO & SUPABASE */}
          {currentTab === 'supabase' && (
            <SupabaseSettings onRefresh={handleRefresh} />
          )}
        </main>
      </div>

      {/* Modal de Distribuição de Carga */}
      {isDistributeModalOpen && (
        <DistributeLoadModal
          drivers={drivers}
          selectedDate={selectedDate}
          onSuccess={() => {
            handleRefresh();
          }}
          onClose={() => setIsDistributeModalOpen(false)}
          onOpenDriverView={(token) => {
            setIsDistributeModalOpen(false);
            handleOpenDriverPreview(token);
          }}
        />
      )}
    </div>
  );
}
