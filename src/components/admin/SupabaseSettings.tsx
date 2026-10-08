import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Download,
  RotateCcw,
  ShieldCheck,
  Server,
  Code2,
  ExternalLink
} from 'lucide-react';
import { storage } from '../../lib/storage';

interface SupabaseSettingsProps {
  onRefresh: () => void;
}

const SQL_MIGRATION_TEXT = `-- ==============================================================================
-- RotaMaster - Migrations Seguras para Supabase (PostgreSQL)
-- NUNCA USAR DROP TABLE OU TRUNCATE - TOTALMENTE INCREMENTAL E SEGURO
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Perfis
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Motoristas
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

-- Regras e Faixas de Remuneração
CREATE TABLE IF NOT EXISTS driver_pay_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Tabela de Performance',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_pay_rule_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pay_rule_id UUID REFERENCES driver_pay_rules(id) ON DELETE CASCADE,
    min_percentage NUMERIC(5, 2) NOT NULL,
    max_percentage NUMERIC(5, 2) NOT NULL,
    package_rate_brl NUMERIC(10, 2) NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operações Diárias
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insucessos com trava de duplicidade por operação
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
    CONSTRAINT unique_package_per_operation UNIQUE (operation_id, package_id)
);

-- Fechamentos Imutáveis
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
    settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações Globais
CREATE TABLE IF NOT EXISTS financial_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_client_rate_brl NUMERIC(10, 2) DEFAULT 4.70 NOT NULL,
    default_driver_rate_brl NUMERIC(10, 2) DEFAULT 3.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sla_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    healthy_min NUMERIC(5, 2) DEFAULT 95.00 NOT NULL,
    warning_min NUMERIC(5, 2) DEFAULT 93.00 NOT NULL,
    risk_min NUMERIC(5, 2) DEFAULT 90.00 NOT NULL,
    critical_threshold NUMERIC(5, 2) DEFAULT 90.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_daily_operations_date ON daily_operations(operation_date);
CREATE INDEX IF NOT EXISTS idx_delivery_failures_op ON delivery_failures(operation_id);
CREATE INDEX IF NOT EXISTS idx_delivery_failures_pkg ON delivery_failures(package_id);
`;

export const SupabaseSettings: React.FC<SupabaseSettingsProps> = ({ onRefresh }) => {
  const currentConfig = storage.getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storage.setSupabaseConfig(url, anonKey);
    setSavedSuccess(true);
    onRefresh();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_TEXT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleResetData = () => {
    const confirmReset = window.confirm(
      'Deseja restaurar a base para os dados de demonstração iniciais?\n(João Silva, Carlos Eduardo, operações e insucessos com fotos)'
    );
    if (!confirmReset) return;
    storage.resetToInitialSeed();
    onRefresh();
    alert('Base restaurada com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-amber-400" />
          Conexão Supabase & Migrations SQL Seguras
        </h2>
        <p className="text-xs text-slate-400">
          Gerencie suas credenciais do Supabase ou execute as migrations PostgreSQL incrementais sem comandos destrutivos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conexão com Supabase */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                Configuração da Instância Supabase
              </h3>
              <p className="text-[11px] text-slate-400">
                O app funciona imediatamente offline/localmente e sincroniza com o seu projeto Supabase quando fornecido
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                currentConfig.connected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {currentConfig.connected ? '● Supabase Conectado' : '● Motor Local Reativo Ativo'}
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://seu-projeto.supabase.co"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Conexão salva com sucesso!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow transition-all"
              >
                Salvar Credenciais
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Banco de Demonstração:</span>
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar Cargas e Motoristas de Exemplo</span>
            </button>
          </div>
        </div>

        {/* Script SQL Seguro para Copiar e Colar no Supabase */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Script de Migração SQL Seguro
                </h3>
              </div>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-amber-300 border border-slate-700 transition-colors"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Execute este script na aba <strong>SQL Editor</strong> do painel do seu Supabase. Ele usa exclusivamente <code>CREATE TABLE IF NOT EXISTS</code> e <code>CREATE INDEX IF NOT EXISTS</code> para proteger dados existentes.
            </p>

            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl bg-slate-950 p-3 border border-slate-800/80 font-mono text-[10px] text-slate-300 leading-relaxed">
              <pre>{SQL_MIGRATION_TEXT}</pre>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              Em total conformidade com a diretriz: nenhuma tabela é apagada com DROP TABLE. Suas informações operacionais e financeiras permanecem seguras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
