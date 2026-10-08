import React, { useState } from 'react';
import {
  XCircle,
  Camera,
  Search,
  Filter,
  Calendar,
  ExternalLink,
  Eye,
  Download,
  AlertTriangle,
  User,
  Package
} from 'lucide-react';
import { DeliveryFailure } from '../../types';
import { PhotoViewerModal } from '../common/PhotoViewerModal';

interface FailuresLogProps {
  failures: DeliveryFailure[];
  onRefresh: () => void;
}

export const FailuresLog: React.FC<FailuresLogProps> = ({ failures }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('todos');
  const [selectedFailure, setSelectedFailure] = useState<DeliveryFailure | null>(null);

  const filtered = failures.filter((f) => {
    if (reasonFilter !== 'todos' && f.reason !== reasonFilter) return false;
    if (
      searchTerm &&
      !f.package_id.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !f.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !f.operation_code.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const exportFailuresCsv = () => {
    const headers = ['ID Pacote', 'Motorista', 'Operacao', 'Data e Hora', 'Motivo', 'Observacao', 'Foto URL'];
    const rows = filtered.map((f) => [
      f.package_id,
      `"${f.driver_name}"`,
      f.operation_code,
      f.registered_at,
      `"${f.reason}"`,
      `"${(f.notes || '').replace(/"/g, '""')}"`,
      f.photo_url,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `insucessos_comprovantes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-400" />
            Insucessos & Auditoria de Comprovantes ({failures.length})
          </h2>
          <p className="text-xs text-slate-400">
            Consulta de pacotes não entregues com fotos de etiquetas enviadas pelos motoristas em rota
          </p>
        </div>

        <button
          onClick={exportFailuresCsv}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Exportar Relatório</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        {/* Motivo */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="todos">Todos os Motivos</option>
            <option value="Cliente ausente">Cliente ausente</option>
            <option value="Endereço não localizado">Endereço não localizado</option>
            <option value="Endereço fechado">Endereço fechado</option>
            <option value="Recusa">Recusa</option>
            <option value="Problema no endereço">Problema no endereço</option>
            <option value="Problema operacional">Problema operacional</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        {/* Busca por ID ou Motorista */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID do pacote, motorista ou código..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid de Cards de Insucesso com Foto em Destaque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedFailure(item)}
            className="group rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden hover:border-slate-700 cursor-pointer transition-all shadow-md hover:shadow-xl flex flex-col justify-between"
          >
            {/* Foto da Etiqueta */}
            <div className="relative h-44 bg-black overflow-hidden flex items-center justify-center">
              <img
                src={item.photo_url}
                alt={`Etiqueta ${item.package_id}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

              <div className="absolute top-3 left-3">
                <span className="rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300 backdrop-blur-sm border border-white/10">
                  {item.package_id}
                </span>
              </div>

              <div className="absolute top-3 right-3">
                <span className="rounded-lg bg-rose-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                  {item.reason}
                </span>
              </div>

              <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-4 w-4" />
              </div>
            </div>

            {/* Metadados e Auditoria */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" /> {item.driver_name}
                </span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  {item.operation_code}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {new Date(item.registered_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-emerald-400 font-semibold">● Validado</span>
              </div>

              {item.notes && (
                <p className="text-[11px] text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 truncate">
                  "{item.notes}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum insucesso encontrado</h3>
          <p className="text-xs text-slate-400 mt-1">
            Nenhum registro corresponde aos filtros selecionados.
          </p>
        </div>
      )}

      {/* Modal de Foto Completa */}
      {selectedFailure && (
        <PhotoViewerModal
          failure={selectedFailure}
          onClose={() => setSelectedFailure(null)}
        />
      )}
    </div>
  );
};
