import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  Phone,
  CreditCard,
  CheckCircle2,
  X,
  AlertTriangle,
  Archive,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { Driver } from '../../types';
import { storage } from '../../lib/storage';

interface DriversManagementProps {
  drivers: Driver[];
  onRefresh: () => void;
  onOpenRemuneration: (driver: Driver) => void;
}

export const DriversManagement: React.FC<DriversManagementProps> = ({
  drivers,
  onRefresh,
  onOpenRemuneration,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Fiorino 1.4 EVO');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [targetSla, setTargetSla] = useState(98.0);

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      d.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingDriver(null);
    setName('');
    setCpf('');
    setPhone('');
    setVehicleType('Fiorino 1.4 EVO');
    setVehiclePlate('');
    setPixKey('');
    setTargetSla(98.0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setName(d.name);
    setCpf(d.document_cpf);
    setPhone(d.phone);
    setVehicleType(d.vehicle_type);
    setVehiclePlate(d.vehicle_plate);
    setPixKey(d.pix_key);
    setTargetSla(d.target_sla);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Preencha os campos obrigatórios (Nome e Telefone).');
      return;
    }

    storage.saveDriver({
      id: editingDriver?.id,
      name: name.trim(),
      document_cpf: cpf.trim() || '000.000.000-00',
      phone: phone.trim(),
      vehicle_type: vehicleType.trim(),
      vehicle_plate: vehiclePlate.trim().toUpperCase(),
      pix_key: pixKey.trim() || phone.trim(),
      target_sla: Number(targetSla),
      status: 'active',
    });

    setIsModalOpen(false);
    onRefresh();
  };

  const handleConfirmDelete = () => {
    if (!driverToDelete) return;
    const res = storage.deleteDriver(driverToDelete.id);
    if (res.success) {
      setDriverToDelete(null);
      if (editingDriver?.id === driverToDelete.id) {
        setIsModalOpen(false);
      }
      onRefresh();
    } else {
      alert(res.error || 'Erro ao excluir motorista.');
    }
  };

  const handleInactivate = () => {
    if (!driverToDelete) return;
    storage.toggleDriverStatus(driverToDelete.id, 'inactive');
    setDriverToDelete(null);
    if (editingDriver?.id === driverToDelete.id) {
      setIsModalOpen(false);
    }
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-400" />
            Gestão de Motoristas e Frota ({drivers.length})
          </h2>
          <p className="text-xs text-slate-400">
            Cadastre, edite, configure remuneração ou remova motoristas da operação
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>NOVO MOTORISTA</span>
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, placa ou telefone..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Grid de Cards de Motoristas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((driver) => {
          const tiersCount = driver.pay_rule?.ranges?.length || 0;
          const isInactive = driver.status === 'inactive';

          return (
            <div
              key={driver.id}
              className={`rounded-2xl border bg-slate-900/80 p-5 backdrop-blur-sm transition-all space-y-4 ${
                isInactive
                  ? 'border-slate-800/60 opacity-70 bg-slate-950/40'
                  : 'border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isInactive
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-gradient-to-tr from-amber-500 to-amber-700 text-slate-950'
                  }`}>
                    {driver.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{driver.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{driver.phone}</p>
                  </div>
                </div>
                {isInactive ? (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                    Inativo
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    Ativo
                  </span>
                )}
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3 space-y-1.5 text-xs border border-slate-800/80">
                <div className="flex justify-between text-slate-400">
                  <span>Veículo:</span>
                  <span className="text-slate-200 font-medium">
                    {driver.vehicle_type} ({driver.vehicle_plate || 'S/ Placa'})
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Meta de SLA:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {driver.target_sla}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Chave PIX:</span>
                  <span className="text-slate-300 font-mono truncate max-w-[150px]">
                    {driver.pix_key || driver.phone}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => onOpenRemuneration(driver)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 py-2 text-xs font-bold text-amber-300 transition-colors"
                >
                  <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                  <span>Tabela ({tiersCount} faixas)</span>
                </button>
                <button
                  onClick={() => handleOpenEdit(driver)}
                  className="flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white transition-colors"
                  title="Editar dados"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDriverToDelete(driver)}
                  className="flex items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/40 p-2 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Excluir motorista"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmação de Exclusão Segura */}
      {driverToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
              <div className="flex items-center gap-2.5 text-rose-400">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-base font-bold text-white">Excluir Motorista</h3>
              </div>
              <button
                onClick={() => setDriverToDelete(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Motorista Selecionado:</span>
                  <span className="text-sm font-bold text-white">{driverToDelete.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Veículo / Placa:</span>
                  <span className="text-slate-200">{driverToDelete.vehicle_type} ({driverToDelete.vehicle_plate || 'S/ Placa'})</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Telefone:</span>
                  <span className="text-slate-200 font-mono">{driverToDelete.phone}</span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>Preservação de Histórico:</strong> Ao excluir, o motorista não poderá mais receber novas cargas matinais. Todos os fechamentos e relatórios financeiros passados permanecerão intactos para auditoria fiscal.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 py-3 text-xs font-black text-white shadow-lg shadow-rose-600/30 transition-all active:scale-98"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>CONFIRMAR EXCLUSÃO DEFINITIVA</span>
                </button>

                <button
                  type="button"
                  onClick={handleInactivate}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-200 transition-colors"
                >
                  <Archive className="h-4 w-4 text-slate-400" />
                  <span>Apenas Inativar / Pausar Cadastro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDriverToDelete(null)}
                  className="w-full rounded-xl py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-400" />
                {editingDriver ? 'Editar Motorista' : 'Novo Motorista'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Telefone / Celular *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Modelo do Veículo
                  </label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    placeholder="Ex: Fiorino EVO"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Placa
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="BRA-2E19"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Chave para repasse"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Meta de SLA (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="80"
                    max="100"
                    value={targetSla}
                    onChange={(e) => setTargetSla(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Botão de Excluir dentro do Modal de Edição */}
              {editingDriver && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDriverToDelete(editingDriver);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir este motorista</span>
                  </button>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-amber-500/20"
                >
                  Salvar Motorista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
