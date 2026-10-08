// ==============================================================================
// RotaMaster - Definições de Tipos e Modelos de Dados
// ==============================================================================

export type UserRole = 'admin' | 'driver';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatar_url?: string;
}

export interface DriverPayRuleRange {
  id: string;
  pay_rule_id?: string;
  min_percentage: number; // e.g. 98.00
  max_percentage: number; // e.g. 100.00
  package_rate_brl: number; // e.g. 3.00
  label?: string; // e.g. 'Faixa Ouro (98% a 100%)'
}

export interface DriverPayRule {
  id: string;
  driver_id: string;
  name: string;
  is_active: boolean;
  ranges: DriverPayRuleRange[];
}

export interface Driver {
  id: string;
  name: string;
  document_cpf: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
  pix_key: string;
  target_sla: number; // default 98.00
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  pay_rule?: DriverPayRule;
}

export type OperationStatus = 'dispatched' | 'in_route' | 'completed' | 'settled' | 'canceled';

export interface DailyOperation {
  id: string;
  code: string; // e.g. 'OP-20261008-01' ou 'ABC123'
  driver_id: string;
  driver_name: string;
  operation_date: string; // YYYY-MM-DD
  packages_received: number; // e.g. 150
  route_name?: string; // e.g. 'Rota Sul - Setor B'
  notes?: string;
  status: OperationStatus;
  share_token: string;
  created_at: string;
  // Computed fields at runtime
  failures_count?: number;
  successful_deliveries?: number;
  performance_percentage?: number;
  current_rate_brl?: number;
  current_tier_label?: string;
  estimated_payout_brl?: number;
  estimated_revenue_brl?: number;
  estimated_margin_brl?: number;
  sla_status?: 'healthy' | 'warning' | 'risk' | 'critical';
}

export type FailureReason =
  | 'Cliente ausente'
  | 'Endereço não localizado'
  | 'Endereço fechado'
  | 'Recusa'
  | 'Problema no endereço'
  | 'Problema operacional'
  | 'Outros';

export interface DeliveryFailure {
  id: string;
  operation_id: string;
  operation_code: string;
  driver_id: string;
  driver_name: string;
  package_id: string;
  reason: FailureReason;
  photo_url: string;
  notes?: string;
  registered_at: string;
  status: 'verified' | 'pending' | 'disputed';
}

export interface DailySettlement {
  id: string;
  operation_id: string;
  operation_code: string;
  driver_id: string;
  driver_name: string;
  settlement_date: string;
  packages_received: number;
  failures_count: number;
  successful_deliveries: number;
  final_performance: number; // e.g. 96.00
  applied_rate_brl: number; // e.g. 2.90
  client_rate_brl: number; // e.g. 4.70
  total_payout_brl: number; // e.g. 435.00
  total_revenue_brl: number; // e.g. 705.00
  gross_margin_brl: number; // e.g. 270.00
  applied_tier_label: string;
  is_locked: boolean;
  settled_at: string;
  settled_by_name: string;
}

export interface FinancialSettings {
  base_client_rate_brl: number; // e.g. 4.70
  default_driver_rate_brl: number; // e.g. 3.00
  avg_operational_cost_per_package: number; // e.g. 0.35
  updated_at: string;
}

export interface SlaSettings {
  healthy_min: number; // e.g. >= 95.00%
  warning_min: number; // e.g. >= 93.00%
  risk_min: number;    // e.g. >= 90.00%
  critical_threshold: number; // < 90.00%
  target_operational_sla: number; // 98.00%
  updated_at: string;
}

export interface OperationalAlert {
  id: string;
  severity: 'info' | 'warning' | 'risk' | 'critical';
  title: string;
  description: string;
  impact?: string;
  recommendation?: string;
  driver_id?: string;
  driver_name?: string;
  operation_id?: string;
  created_at: string;
  is_resolved: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  actor_name: string;
  entity_name: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

export interface IntelligenceInsight {
  id: string;
  category: 'sla' | 'driver' | 'cost' | 'route' | 'failure';
  severity: 'healthy' | 'warning' | 'risk' | 'critical';
  problem_detected: string;
  impact: string;
  suggestion: string;
  recommended_action: string;
}
