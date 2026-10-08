-- ==============================================================================
-- RotaMaster - Central de Operação Logística & Gestão de Entregas
-- Migrations SQL Seguras e Não-Destrutivas (Compatíveis com Supabase PostgreSQL)
-- NUNCA USAR DROP TABLE OU TRUNCATE - SEMPRE INCREMENTAL E SEGURO
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Motoristas
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    document_cpf TEXT UNIQUE,
    phone TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'Utilitário / Van',
    vehicle_plate TEXT,
    pix_key TEXT,
    target_sla NUMERIC(5, 2) DEFAULT 98.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Regras e Faixas de Remuneração por Motorista
CREATE TABLE IF NOT EXISTS driver_pay_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Tabela Padrão de Performance',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_pay_rule_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pay_rule_id UUID REFERENCES driver_pay_rules(id) ON DELETE CASCADE,
    min_percentage NUMERIC(5, 2) NOT NULL,
    max_percentage NUMERIC(5, 2) NOT NULL,
    package_rate_brl NUMERIC(10, 2) NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Configurações Financeiras Globais
CREATE TABLE IF NOT EXISTS financial_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_client_rate_brl NUMERIC(10, 2) DEFAULT 4.70 NOT NULL,
    default_driver_rate_brl NUMERIC(10, 2) DEFAULT 3.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Configurações de SLA
CREATE TABLE IF NOT EXISTS sla_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    healthy_min NUMERIC(5, 2) DEFAULT 95.00 NOT NULL,
    warning_min NUMERIC(5, 2) DEFAULT 93.00 NOT NULL,
    risk_min NUMERIC(5, 2) DEFAULT 90.00 NOT NULL,
    critical_threshold NUMERIC(5, 2) DEFAULT 90.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Operações Diárias (Carga matinal distribuída)
CREATE TABLE IF NOT EXISTS daily_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
    operation_date DATE DEFAULT CURRENT_DATE NOT NULL,
    packages_received INTEGER NOT NULL CHECK (packages_received > 0),
    route_name TEXT,
    notes TEXT,
    status TEXT DEFAULT 'in_route' CHECK (status IN ('dispatched', 'in_route', 'completed', 'settled', 'canceled')),
    share_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Motivos Padrão de Insucesso
CREATE TABLE IF NOT EXISTS failure_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'operational',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela de Registro de Insucessos
CREATE TABLE IF NOT EXISTS delivery_failures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID REFERENCES daily_operations(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
    package_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    notes TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'disputed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Regra crítica: impede o mesmo ID de ser registrado mais de uma vez na mesma operação
    CONSTRAINT unique_package_per_operation UNIQUE (operation_id, package_id)
);

-- 10. Tabela de Fechamentos Diários Imutáveis (Settlements)
CREATE TABLE IF NOT EXISTS daily_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID REFERENCES daily_operations(id) ON DELETE RESTRICT UNIQUE,
    driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT,
    settlement_date DATE NOT NULL,
    packages_received INTEGER NOT NULL,
    failures_count INTEGER NOT NULL,
    successful_deliveries INTEGER NOT NULL,
    final_performance NUMERIC(5, 2) NOT NULL,
    applied_rate_brl NUMERIC(10, 2) NOT NULL,
    client_rate_brl NUMERIC(10, 2) NOT NULL,
    total_payout_brl NUMERIC(10, 2) NOT NULL,
    total_revenue_brl NUMERIC(10, 2) NOT NULL,
    gross_margin_brl NUMERIC(10, 2) NOT NULL,
    applied_tier_label TEXT,
    is_locked BOOLEAN DEFAULT TRUE,
    settled_at TIMESTAMPTZ DEFAULT NOW(),
    settled_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 11. Tabela de Alertas Operacionais
CREATE TABLE IF NOT EXISTS operational_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'risk', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact TEXT,
    recommendation TEXT,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    operation_id UUID REFERENCES daily_operations(id) ON DELETE SET NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name TEXT,
    entity_name TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Índices para Performance de Consultas em Alta Carga
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_daily_operations_date ON daily_operations(operation_date);
CREATE INDEX IF NOT EXISTS idx_daily_operations_driver ON daily_operations(driver_id);
CREATE INDEX IF NOT EXISTS idx_daily_operations_code ON daily_operations(code);
CREATE INDEX IF NOT EXISTS idx_delivery_failures_op ON delivery_failures(operation_id);
CREATE INDEX IF NOT EXISTS idx_delivery_failures_pkg ON delivery_failures(package_id);
CREATE INDEX IF NOT EXISTS idx_daily_settlements_date ON daily_settlements(settlement_date);

-- ==============================================================================
-- Políticas de Segurança (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_pay_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_pay_rule_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Exemplo de Políticas Seguras (compatíveis com Auth do Supabase)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all profiles') THEN
        CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view operational config') THEN
        CREATE POLICY "Anyone can view operational config" ON financial_settings FOR SELECT USING (true);
    END IF;
END $$;
