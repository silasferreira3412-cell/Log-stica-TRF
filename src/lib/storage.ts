// ==============================================================================
// RotaMaster - Camada de Persistência, Supabase & Banco Local
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Driver,
  DailyOperation,
  DeliveryFailure,
  DailySettlement,
  FinancialSettings,
  SlaSettings,
  AuditLog,
  DriverPayRuleRange,
  FailureReason
} from '../types';
import { calculatePerformance, findMatchingPayTier } from './calculations';

// Chaves do LocalStorage
const STORAGE_KEYS = {
  DRIVERS: 'rotamaster_drivers_v1',
  OPERATIONS: 'rotamaster_operations_v1',
  FAILURES: 'rotamaster_failures_v1',
  SETTLEMENTS: 'rotamaster_settlements_v1',
  FINANCIAL: 'rotamaster_financial_settings_v1',
  SLA: 'rotamaster_sla_settings_v1',
  AUDIT: 'rotamaster_audit_logs_v1',
  SUPABASE_CONFIG: 'rotamaster_supabase_config_v1',
};

// Configurações padrão
const DEFAULT_FINANCIAL: FinancialSettings = {
  base_client_rate_brl: 4.70, // Exemplo do usuário: R$ 4,70 recebido por pacote
  default_driver_rate_brl: 3.00, // Valor padrão de referência
  avg_operational_cost_per_package: 0.35,
  updated_at: new Date().toISOString(),
};

const DEFAULT_SLA: SlaSettings = {
  healthy_min: 95.00, // 95% ou mais: 🟢 saudável
  warning_min: 93.00, // 93% a 94,99%: 🟡 atenção
  risk_min: 90.00,    // 90% a 92,99%: 🟠 risco
  critical_threshold: 90.00, // abaixo de 90%: 🔴 crítico
  target_operational_sla: 98.00,
  updated_at: new Date().toISOString(),
};

// Faixas padrão de remuneração (exemplo da especificação)
const DEFAULT_PAY_RANGES: DriverPayRuleRange[] = [
  { id: 'tier-1', min_percentage: 98.00, max_percentage: 100.00, package_rate_brl: 3.00, label: '98% a 100% (Meta Ouro)' },
  { id: 'tier-2', min_percentage: 96.00, max_percentage: 97.99, package_rate_brl: 2.90, label: '96% a 97,99% (Prata)' },
  { id: 'tier-3', min_percentage: 94.00, max_percentage: 95.99, package_rate_brl: 2.80, label: '94% a 95,99% (Bronze)' },
  { id: 'tier-4', min_percentage: 90.00, max_percentage: 93.99, package_rate_brl: 2.70, label: '90% a 93,99% (Alerta)' },
  { id: 'tier-5', min_percentage: 0.00,  max_percentage: 89.99, package_rate_brl: 2.60, label: '0% a 89,99% (Penalizado)' },
];

// Motoristas iniciais pré-cadastrados
const SEED_DRIVERS: Driver[] = [
  {
    id: 'drv-01',
    name: 'João Silva',
    document_cpf: '284.912.845-12',
    phone: '(11) 98765-4321',
    vehicle_type: 'Fiorino 1.4 EVO',
    vehicle_plate: 'BRA-2E19',
    pix_key: 'joao.silva@translog.com.br',
    target_sla: 98.0,
    status: 'active',
    created_at: '2026-09-01T08:00:00Z',
    pay_rule: {
      id: 'rule-drv-01',
      driver_id: 'drv-01',
      name: 'Tabela Padrão João',
      is_active: true,
      ranges: [...DEFAULT_PAY_RANGES],
    },
  },
  {
    id: 'drv-02',
    name: 'Carlos Eduardo',
    document_cpf: '345.892.112-98',
    phone: '(11) 97654-3210',
    vehicle_type: 'Renault Master',
    vehicle_plate: 'FTL-4A88',
    pix_key: '34589211298',
    target_sla: 98.0,
    status: 'active',
    created_at: '2026-09-05T08:00:00Z',
    pay_rule: {
      id: 'rule-drv-02',
      driver_id: 'drv-02',
      name: 'Tabela Master Carlos',
      is_active: true,
      ranges: [
        { id: 'c-1', min_percentage: 98.0, max_percentage: 100.0, package_rate_brl: 3.20, label: '98% a 100% (Especial Master)' },
        { id: 'c-2', min_percentage: 96.0, max_percentage: 97.99, package_rate_brl: 3.00, label: '96% a 97,99%' },
        { id: 'c-3', min_percentage: 94.0, max_percentage: 95.99, package_rate_brl: 2.85, label: '94% a 95,99%' },
        { id: 'c-4', min_percentage: 90.0, max_percentage: 93.99, package_rate_brl: 2.70, label: '90% a 93,99%' },
        { id: 'c-5', min_percentage: 0.0,  max_percentage: 89.99, package_rate_brl: 2.50, label: 'Abaixo de 90%' },
      ],
    },
  },
  {
    id: 'drv-03',
    name: 'Pedro Santos',
    document_cpf: '456.123.789-00',
    phone: '(11) 99123-4567',
    vehicle_type: 'Kangoo Express',
    vehicle_plate: 'RTY-9C44',
    pix_key: 'pedro.entregas@gmail.com',
    target_sla: 98.0,
    status: 'active',
    created_at: '2026-09-10T08:00:00Z',
    pay_rule: {
      id: 'rule-drv-03',
      driver_id: 'drv-03',
      name: 'Tabela Pedro',
      is_active: true,
      ranges: [...DEFAULT_PAY_RANGES],
    },
  },
  {
    id: 'drv-04',
    name: 'Amanda Lima',
    document_cpf: '512.981.654-33',
    phone: '(11) 98234-5678',
    vehicle_type: 'Partner Rapid',
    vehicle_plate: 'LOG-7K21',
    pix_key: '(11) 98234-5678',
    target_sla: 98.0,
    status: 'active',
    created_at: '2026-09-15T08:00:00Z',
    pay_rule: {
      id: 'rule-drv-04',
      driver_id: 'drv-04',
      name: 'Tabela Amanda',
      is_active: true,
      ranges: [...DEFAULT_PAY_RANGES],
    },
  },
  {
    id: 'drv-05',
    name: 'Marcos Souza',
    document_cpf: '623.456.789-11',
    phone: '(11) 97345-6789',
    vehicle_type: 'Peugeot Expert',
    vehicle_plate: 'TRN-1M05',
    pix_key: 'marcos.transporte@outlook.com',
    target_sla: 98.0,
    status: 'active',
    created_at: '2026-09-20T08:00:00Z',
    pay_rule: {
      id: 'rule-drv-05',
      driver_id: 'drv-05',
      name: 'Tabela Marcos',
      is_active: true,
      ranges: [...DEFAULT_PAY_RANGES],
    },
  },
];

// Operações matinais de hoje
const TODAY = '2026-10-08';
const SEED_OPERATIONS: DailyOperation[] = [
  {
    id: 'op-01',
    code: 'OP-1008-01',
    driver_id: 'drv-01',
    driver_name: 'João Silva',
    operation_date: TODAY,
    packages_received: 150, // Exemplo da especificação: 150 pacotes recebidos
    route_name: 'Setor A - Zona Leste (Mooca/Tatuapé)',
    notes: 'Saída matinal 07:30. Conferência 100% bipada no galpão.',
    status: 'in_route',
    share_token: 'ABC123', // Link /motorista/operacao/ABC123
    created_at: '2026-10-08T07:15:00Z',
  },
  {
    id: 'op-02',
    code: 'OP-1008-02',
    driver_id: 'drv-02',
    driver_name: 'Carlos Eduardo',
    operation_date: TODAY,
    packages_received: 180,
    route_name: 'Setor B - Centro Express & Bela Vista',
    notes: 'Prioridade em condomínios comerciais antes das 12h.',
    status: 'in_route',
    share_token: 'CARLOS88',
    created_at: '2026-10-08T07:20:00Z',
  },
  {
    id: 'op-03',
    code: 'OP-1008-03',
    driver_id: 'drv-03',
    driver_name: 'Pedro Santos',
    operation_date: TODAY,
    packages_received: 130,
    route_name: 'Setor C - Zona Sul 2 (Santo Amaro/Interlagos)',
    notes: 'Área com restrição de circulação após 17h.',
    status: 'in_route',
    share_token: 'PEDRO99',
    created_at: '2026-10-08T07:25:00Z',
  },
  {
    id: 'op-04',
    code: 'OP-1008-04',
    driver_id: 'drv-04',
    driver_name: 'Amanda Lima',
    operation_date: TODAY,
    packages_received: 160,
    route_name: 'Setor D - Zona Norte (Santana/Tucuruvi)',
    notes: 'Carga mista pacotes médios e miúdos.',
    status: 'in_route',
    share_token: 'AMANDA77',
    created_at: '2026-10-08T07:30:00Z',
  },
];

// Insucessos iniciais realistas registrados durante o dia
const SEED_FAILURES: DeliveryFailure[] = [
  {
    id: 'fail-01',
    operation_id: 'op-01',
    operation_code: 'OP-1008-01',
    driver_id: 'drv-01',
    driver_name: 'João Silva',
    package_id: 'BR984712039BR',
    reason: 'Cliente ausente',
    photo_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    notes: 'Aguardei 12 minutos na frente da casa nº 412, interfone sem resposta.',
    registered_at: '2026-10-08T10:45:12Z',
    status: 'verified',
  },
  {
    id: 'fail-02',
    operation_id: 'op-01',
    operation_code: 'OP-1008-01',
    driver_id: 'drv-01',
    driver_name: 'João Silva',
    package_id: 'BR984712040BR',
    reason: 'Endereço fechado',
    photo_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    notes: 'Loja comercial fechada no horário de almoço.',
    registered_at: '2026-10-08T12:15:30Z',
    status: 'verified',
  },
  {
    id: 'fail-03',
    operation_id: 'op-01',
    operation_code: 'OP-1008-01',
    driver_id: 'drv-01',
    driver_name: 'João Silva',
    package_id: 'BR984712041BR',
    reason: 'Cliente ausente',
    photo_url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
    notes: 'Vizinho informou que o morador só retorna após as 19h.',
    registered_at: '2026-10-08T14:20:00Z',
    status: 'verified',
  },
  {
    id: 'fail-04',
    operation_id: 'op-02',
    operation_code: 'OP-1008-02',
    driver_id: 'drv-02',
    driver_name: 'Carlos Eduardo',
    package_id: 'BR771209384BR',
    reason: 'Endereço não localizado',
    photo_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
    notes: 'Numeração irregular na rua, prédio sem identificação.',
    registered_at: '2026-10-08T11:30:15Z',
    status: 'verified',
  },
  {
    id: 'fail-05',
    operation_id: 'op-03',
    operation_code: 'OP-1008-03',
    driver_id: 'drv-03',
    driver_name: 'Pedro Santos',
    package_id: 'BR554901238BR',
    reason: 'Recusa',
    photo_url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
    notes: 'Destinatário cancelou a compra e recusou o recebimento.',
    registered_at: '2026-10-08T13:40:55Z',
    status: 'verified',
  },
];

// Settlements passados (para histórico e relatórios de ontem)
const SEED_SETTLEMENTS: DailySettlement[] = [
  {
    id: 'stl-01',
    operation_id: 'op-yesterday-01',
    operation_code: 'OP-1007-01',
    driver_id: 'drv-01',
    driver_name: 'João Silva',
    settlement_date: '2026-10-07',
    packages_received: 150,
    failures_count: 3,
    successful_deliveries: 147,
    final_performance: 98.0,
    applied_rate_brl: 3.0,
    client_rate_brl: 4.7,
    total_payout_brl: 450.0,
    total_revenue_brl: 705.0,
    gross_margin_brl: 255.0,
    applied_tier_label: '98% a 100% (Meta Ouro)',
    is_locked: true,
    settled_at: '2026-10-07T19:30:00Z',
    settled_by_name: 'Administrador Operacional',
  },
  {
    id: 'stl-02',
    operation_id: 'op-yesterday-02',
    operation_code: 'OP-1007-02',
    driver_id: 'drv-02',
    driver_name: 'Carlos Eduardo',
    settlement_date: '2026-10-07',
    packages_received: 180,
    failures_count: 5,
    successful_deliveries: 175,
    final_performance: 97.22,
    applied_rate_brl: 3.0,
    client_rate_brl: 4.7,
    total_payout_brl: 540.0,
    total_revenue_brl: 846.0,
    gross_margin_brl: 306.0,
    applied_tier_label: '96% a 97,99%',
    is_locked: true,
    settled_at: '2026-10-07T20:00:00Z',
    settled_by_name: 'Administrador Operacional',
  },
];

class StorageService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initSupabaseClient();
    this.ensureSeedData();
  }

  // Inicializa o cliente Supabase se configurado
  public initSupabaseClient(): SupabaseClient | null {
    try {
      const configStr = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      let url = '';
      let anonKey = '';

      if (configStr) {
        const config = JSON.parse(configStr);
        url = config.url || '';
        anonKey = config.anonKey || '';
      }

      // Suporte também a env vars Vite caso estejam disponíveis
      const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

      const finalUrl = url || envUrl;
      const finalKey = anonKey || envKey;

      if (finalUrl && finalKey && finalUrl.startsWith('http')) {
        this.supabase = createClient(finalUrl, finalKey);
      } else {
        this.supabase = null;
      }
    } catch {
      this.supabase = null;
    }
    return this.supabase;
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  public getSupabaseConfig(): { url: string; anonKey: string; connected: boolean } {
    try {
      const configStr = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      if (configStr) {
        const parsed = JSON.parse(configStr);
        return {
          url: parsed.url || '',
          anonKey: parsed.anonKey || '',
          connected: Boolean(this.supabase),
        };
      }
    } catch {}
    return { url: '', anonKey: '', connected: Boolean(this.supabase) };
  }

  public setSupabaseConfig(url: string, anonKey: string): void {
    localStorage.setItem(
      STORAGE_KEYS.SUPABASE_CONFIG,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
    this.initSupabaseClient();
  }

  private ensureSeedData(): void {
    if (!localStorage.getItem(STORAGE_KEYS.DRIVERS)) {
      localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(SEED_DRIVERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OPERATIONS)) {
      localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(SEED_OPERATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAILURES)) {
      localStorage.setItem(STORAGE_KEYS.FAILURES, JSON.stringify(SEED_FAILURES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTLEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(SEED_SETTLEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FINANCIAL)) {
      localStorage.setItem(STORAGE_KEYS.FINANCIAL, JSON.stringify(DEFAULT_FINANCIAL));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SLA)) {
      localStorage.setItem(STORAGE_KEYS.SLA, JSON.stringify(DEFAULT_SLA));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log-01',
          action: 'SISTEMA_INICIADO',
          actor_name: 'Sistema',
          entity_name: 'DailyOperations',
          details: 'Central de Operação RotaMaster iniciada com sucesso.',
          created_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(initialLogs));
    }
  }

  // --- MOTORISTAS ---
  public getDrivers(): Driver[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRIVERS);
      return data ? JSON.parse(data) : SEED_DRIVERS;
    } catch {
      return SEED_DRIVERS;
    }
  }

  public getDriverById(id: string): Driver | undefined {
    return this.getDrivers().find((d) => d.id === id);
  }

  public saveDriver(driver: Partial<Driver> & { name: string; phone: string }): Driver {
    const drivers = this.getDrivers();
    if (driver.id) {
      // Edição
      const index = drivers.findIndex((d) => d.id === driver.id);
      if (index !== -1) {
        drivers[index] = { ...drivers[index], ...driver };
        localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
        this.addAuditLog('MOTORISTA_ATUALIZADO', drivers[index].name, 'drivers', drivers[index].id);
        return drivers[index];
      }
    }

    // Novo motorista
    const newId = `drv-${Date.now().toString().slice(-4)}`;
    const newDriver: Driver = {
      id: newId,
      name: driver.name,
      document_cpf: driver.document_cpf || '000.000.000-00',
      phone: driver.phone,
      vehicle_type: driver.vehicle_type || 'Utilitário',
      vehicle_plate: driver.vehicle_plate || 'ABC-0000',
      pix_key: driver.pix_key || driver.phone,
      target_sla: driver.target_sla || 98.0,
      status: driver.status || 'active',
      created_at: new Date().toISOString(),
      pay_rule: {
        id: `rule-${newId}`,
        driver_id: newId,
        name: `Tabela ${driver.name}`,
        is_active: true,
        ranges: [...DEFAULT_PAY_RANGES],
      },
    };

    drivers.push(newDriver);
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    this.addAuditLog('MOTORISTA_CADASTRADO', newDriver.name, 'drivers', newDriver.id);
    return newDriver;
  }

  public deleteDriver(driverId: string): { success: boolean; error?: string } {
    const drivers = this.getDrivers();
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) {
      return { success: false, error: 'Motorista não encontrado.' };
    }

    // Registra a exclusão no log de auditoria antes da remoção
    this.addAuditLog(
      'MOTORISTA_EXCLUIDO',
      `Motorista ${driver.name} (CPF: ${driver.document_cpf}, Placa: ${driver.vehicle_plate}) foi excluído pelo administrador.`,
      'drivers',
      driverId
    );

    const updated = drivers.filter((d) => d.id !== driverId);
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(updated));
    return { success: true };
  }

  public toggleDriverStatus(driverId: string, status: 'active' | 'inactive' | 'suspended'): boolean {
    const drivers = this.getDrivers();
    const index = drivers.findIndex((d) => d.id === driverId);
    if (index === -1) return false;

    drivers[index].status = status;
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    this.addAuditLog('STATUS_MOTORISTA_ALTERADO', `Status de ${drivers[index].name} alterado para ${status}`, 'drivers', driverId);
    return true;
  }

  public updateDriverPayRanges(driverId: string, ranges: DriverPayRuleRange[]): boolean {
    const drivers = this.getDrivers();
    const index = drivers.findIndex((d) => d.id === driverId);
    if (index === -1) return false;

    if (!drivers[index].pay_rule) {
      drivers[index].pay_rule = {
        id: `rule-${driverId}`,
        driver_id: driverId,
        name: `Tabela ${drivers[index].name}`,
        is_active: true,
        ranges: [],
      };
    }

    drivers[index].pay_rule!.ranges = ranges;
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    this.addAuditLog('TABELA_REMUNERACAO_ATUALIZADA', drivers[index].name, 'driver_pay_rules', driverId);
    return true;
  }

  // --- OPERAÇÕES ---
  public getOperations(date?: string): DailyOperation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OPERATIONS);
      const ops: DailyOperation[] = data ? JSON.parse(data) : SEED_OPERATIONS;
      const failures = this.getFailures();
      const financial = this.getFinancialSettings();
      const sla = this.getSlaSettings();
      const drivers = this.getDrivers();

      // Enriquece com cálculos em tempo real
      const enriched = ops.map((op) => {
        const opFailures = failures.filter((f) => f.operation_id === op.id);
        const failCount = opFailures.length;
        const perf = calculatePerformance(op.packages_received, failCount);
        const driver = drivers.find((d) => d.id === op.driver_id);
        const ranges = driver?.pay_rule?.ranges || DEFAULT_PAY_RANGES;
        const tier = findMatchingPayTier(perf, ranges, financial.default_driver_rate_brl);

        const rev = op.packages_received * financial.base_client_rate_brl;
        const pay = op.packages_received * tier.rate;
        const marg = rev - pay;

        let slaSt: 'healthy' | 'warning' | 'risk' | 'critical' = 'healthy';
        if (perf >= sla.healthy_min) slaSt = 'healthy';
        else if (perf >= sla.warning_min) slaSt = 'warning';
        else if (perf >= sla.risk_min) slaSt = 'risk';
        else slaSt = 'critical';

        return {
          ...op,
          failures_count: failCount,
          successful_deliveries: Math.max(0, op.packages_received - failCount),
          performance_percentage: perf,
          current_rate_brl: tier.rate,
          current_tier_label: tier.label,
          estimated_revenue_brl: rev,
          estimated_payout_brl: pay,
          estimated_margin_brl: marg,
          sla_status: slaSt,
        };
      });

      if (date) {
        return enriched.filter((o) => o.operation_date === date);
      }
      return enriched;
    } catch {
      return SEED_OPERATIONS;
    }
  }

  public getOperationByTokenOrCode(tokenOrCode: string): DailyOperation | undefined {
    const ops = this.getOperations();
    return ops.find(
      (o) =>
        o.share_token.toLowerCase() === tokenOrCode.toLowerCase() ||
        o.code.toLowerCase() === tokenOrCode.toLowerCase() ||
        o.id === tokenOrCode
    );
  }

  public createOperation(data: {
    driver_id: string;
    packages_received: number;
    operation_date: string;
    route_name?: string;
    notes?: string;
  }): DailyOperation {
    const drivers = this.getDrivers();
    const driver = drivers.find((d) => d.id === data.driver_id);
    if (!driver) throw new Error('Motorista não encontrado');

    const ops = this.getOperations();
    const codeNum = ops.length + 1;
    const dateFormatted = data.operation_date.replace(/-/g, '').slice(4); // MMDD
    const code = `OP-${dateFormatted}-${codeNum.toString().padStart(2, '0')}`;
    const shareToken = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newOp: DailyOperation = {
      id: `op-${Date.now()}`,
      code,
      driver_id: driver.id,
      driver_name: driver.name,
      operation_date: data.operation_date,
      packages_received: Number(data.packages_received),
      route_name: data.route_name || 'Rota Geral',
      notes: data.notes || '',
      status: 'in_route',
      share_token: shareToken,
      created_at: new Date().toISOString(),
    };

    ops.push(newOp);
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(ops));
    this.addAuditLog(
      'CARGA_LIBERADA',
      `Liberados ${newOp.packages_received} pacotes para ${driver.name}`,
      'daily_operations',
      newOp.id
    );
    return newOp;
  }

  // --- INSUCESSOS (COM VALIDAÇÃO DE DUPLICIDADE) ---
  public getFailures(operationId?: string): DeliveryFailure[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAILURES);
      const fails: DeliveryFailure[] = data ? JSON.parse(data) : SEED_FAILURES;
      if (operationId) {
        return fails.filter((f) => f.operation_id === operationId);
      }
      return fails;
    } catch {
      return SEED_FAILURES;
    }
  }

  public registerFailure(payload: {
    operation_id: string;
    package_id: string;
    reason: FailureReason;
    photo_url: string;
    notes?: string;
  }): { success: boolean; failure?: DeliveryFailure; error?: string } {
    const cleanPackageId = payload.package_id.trim().toUpperCase();
    if (!cleanPackageId) {
      return { success: false, error: 'O ID do pacote é obrigatório.' };
    }
    if (!payload.photo_url) {
      return { success: false, error: 'A foto da etiqueta é obrigatória para comprovação.' };
    }

    const allFailures = this.getFailures();

    // 1. Validar e impedir duplicidade na mesma operação
    const duplicate = allFailures.find(
      (f) =>
        f.operation_id === payload.operation_id &&
        f.package_id.toUpperCase() === cleanPackageId
    );

    if (duplicate) {
      return {
        success: false,
        error: `O pacote ${cleanPackageId} já foi registrado como insucesso nesta operação às ${new Date(duplicate.registered_at).toLocaleTimeString('pt-BR')}.`,
      };
    }

    const op = this.getOperationByTokenOrCode(payload.operation_id);
    if (!op) {
      return { success: false, error: 'Operação não localizada.' };
    }

    const newFailure: DeliveryFailure = {
      id: `fail-${Date.now()}`,
      operation_id: op.id,
      operation_code: op.code,
      driver_id: op.driver_id,
      driver_name: op.driver_name,
      package_id: cleanPackageId,
      reason: payload.reason,
      photo_url: payload.photo_url,
      notes: payload.notes || '',
      registered_at: new Date().toISOString(),
      status: 'verified',
    };

    allFailures.unshift(newFailure);
    localStorage.setItem(STORAGE_KEYS.FAILURES, JSON.stringify(allFailures));

    this.addAuditLog(
      'INSUCESSO_REGISTRADO',
      `Pacote ${cleanPackageId} (${payload.reason}) por ${op.driver_name}`,
      'delivery_failures',
      newFailure.id
    );

    return { success: true, failure: newFailure };
  }

  // --- FECHAMENTO DIÁRIO (IMUTÁVEL) ---
  public getSettlements(): DailySettlement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
      return data ? JSON.parse(data) : SEED_SETTLEMENTS;
    } catch {
      return SEED_SETTLEMENTS;
    }
  }

  public isOperationSettled(operationId: string): boolean {
    return this.getSettlements().some((s) => s.operation_id === operationId);
  }

  public settleOperation(operationId: string, settledByName = 'Administrador'): DailySettlement {
    const settlements = this.getSettlements();
    const existing = settlements.find((s) => s.operation_id === operationId);
    if (existing) {
      return existing; // Já fechado e imutável
    }

    const op = this.getOperationByTokenOrCode(operationId);
    if (!op) throw new Error('Operação não encontrada');

    const failures = this.getFailures(op.id);
    const failCount = failures.length;
    const finalPerf = calculatePerformance(op.packages_received, failCount);

    const driver = this.getDriverById(op.driver_id);
    const financial = this.getFinancialSettings();
    const ranges = driver?.pay_rule?.ranges || DEFAULT_PAY_RANGES;
    const tier = findMatchingPayTier(finalPerf, ranges, financial.default_driver_rate_brl);

    const totalPayout = op.packages_received * tier.rate;
    const totalRev = op.packages_received * financial.base_client_rate_brl;
    const grossMargin = totalRev - totalPayout;

    const newSettlement: DailySettlement = {
      id: `stl-${Date.now()}`,
      operation_id: op.id,
      operation_code: op.code,
      driver_id: op.driver_id,
      driver_name: op.driver_name,
      settlement_date: op.operation_date,
      packages_received: op.packages_received,
      failures_count: failCount,
      successful_deliveries: Math.max(0, op.packages_received - failCount),
      final_performance: finalPerf,
      applied_rate_brl: tier.rate,
      client_rate_brl: financial.base_client_rate_brl,
      total_payout_brl: totalPayout,
      total_revenue_brl: totalRev,
      gross_margin_brl: grossMargin,
      applied_tier_label: tier.label,
      is_locked: true, // Imutabilidade garantida
      settled_at: new Date().toISOString(),
      settled_by_name: settledByName,
    };

    settlements.unshift(newSettlement);
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));

    // Atualiza status da operação
    const ops = this.getOperations();
    const opIdx = ops.findIndex((o) => o.id === op.id);
    if (opIdx !== -1) {
      ops[opIdx].status = 'settled';
      localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(ops));
    }

    this.addAuditLog(
      'FECHAMENTO_CONFIRMADO',
      `Operação ${op.code} fechada com repasse ${totalPayout.toFixed(2)} BRL`,
      'daily_settlements',
      newSettlement.id
    );

    return newSettlement;
  }

  // --- CONFIGURAÇÕES ---
  public getFinancialSettings(): FinancialSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FINANCIAL);
      return data ? JSON.parse(data) : DEFAULT_FINANCIAL;
    } catch {
      return DEFAULT_FINANCIAL;
    }
  }

  public updateFinancialSettings(settings: Partial<FinancialSettings>): FinancialSettings {
    const current = this.getFinancialSettings();
    const updated: FinancialSettings = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.FINANCIAL, JSON.stringify(updated));
    this.addAuditLog(
      'CONFIG_FINANCEIRA_ATUALIZADA',
      `Novo valor base por pacote: R$ ${updated.base_client_rate_brl}`,
      'financial_settings'
    );
    return updated;
  }

  public getSlaSettings(): SlaSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLA);
      return data ? JSON.parse(data) : DEFAULT_SLA;
    } catch {
      return DEFAULT_SLA;
    }
  }

  public updateSlaSettings(settings: Partial<SlaSettings>): SlaSettings {
    const current = this.getSlaSettings();
    const updated: SlaSettings = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.SLA, JSON.stringify(updated));
    this.addAuditLog(
      'CONFIG_SLA_ATUALIZADA',
      `Novo SLA saudável mínimo: ${updated.healthy_min}%`,
      'sla_settings'
    );
    return updated;
  }

  // --- LOGS DE AUDITORIA ---
  public getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addAuditLog(action: string, details: string, entity_name: string, entity_id?: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      actor_name: 'Usuário Ativo',
      entity_name,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Mantém os últimos 200 logs
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
  }

  // Reset para demonstração
  public resetToInitialSeed(): void {
    localStorage.removeItem(STORAGE_KEYS.DRIVERS);
    localStorage.removeItem(STORAGE_KEYS.OPERATIONS);
    localStorage.removeItem(STORAGE_KEYS.FAILURES);
    localStorage.removeItem(STORAGE_KEYS.SETTLEMENTS);
    localStorage.removeItem(STORAGE_KEYS.FINANCIAL);
    localStorage.removeItem(STORAGE_KEYS.SLA);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    this.ensureSeedData();
  }
}

export const storage = new StorageService();
