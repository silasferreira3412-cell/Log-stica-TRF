import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Truck,
  Calendar,
  Package,
  MapPin,
  FileText,
  Copy,
  Check,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { Driver, DailyOperation } from '../../types';
import { storage } from '../../lib/storage';

interface DistributeLoadModalProps {
  drivers: Driver[];
  selectedDate: string;
  onSuccess: (operation: DailyOperation) => void;
  onClose: () => void;
  onOpenDriverView: (tokenOrCode: string) => void;
}

export const DistributeLoadModal: React.FC<DistributeLoadModalProps> = ({
  drivers,
  selectedDate,
  onSuccess,
  onClose,
  onOpenDriverView,
}) => {
  const [driverId, setDriverId] = useState(drivers[0]?.id || '');
  const [operationDate, setOperationDate] = useState(selectedDate);
  const [packagesCount, setPackagesCount] = useState<number | ''>(150);
  const [routeName, setRouteName] = useState('Zona Leste - Mooca Express');
  const [notes, setNotes] = useState('Conferência 100% de pacotes no galpão. Saída às 07h45.');
  const [createdOperation, setCreatedOperation] = useState<DailyOperation | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId || !packagesCount || Number(packagesCount) <= 0) {
      alert('Selecione o motorista e informe a quantidade de pacotes.');
      return;
    }

    try {
      const newOp = storage.createOperation({
        driver_id: driverId,
        packages_received: Number(packagesCount),
        operation_date: operationDate,
        route_name: routeName.trim(),
        notes: notes.trim(),
      });

      setCreatedOperation(newOp);
      onSuccess(newOp);
    } catch (err: any) {
      alert(err?.message || 'Erro ao liberar carga.');
    }
  };

  const shareableUrl = createdOperation
    ? `${window.location.origin}/?op=${createdOperation.share_token}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Distribuir Carga Matinal</h2>
              <p className="text-xs text-slate-400">
                Lançar pacotes e liberar rota para o motorista
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Se a operação já foi criada, exibe o link exclusivo gerado */}
        {createdOperation ? (
          <div className="p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <span className="text-3xl">🎉</span>
              <h3 className="text-base font-bold text-emerald-400 mt-2">
                Carga Liberada com Sucesso!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                A operação <strong className="font-mono text-white">{createdOperation.code}</strong> foi gerada para{' '}
                <strong>{createdOperation.driver_name}</strong> com{' '}
                <strong>{createdOperation.packages_received} pacotes</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Link Exclusivo do Motorista</span>
                <span className="text-[10px] text-cyan-400 font-mono">Token: {createdOperation.share_token}</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-mono text-slate-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2.5 text-xs font-semibold text-white border border-slate-700 transition-colors"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Envie esse link no WhatsApp do motorista. Ele abrirá o portal móvel para registrar os insucessos diretamente pelo celular com a câmera.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenDriverView(createdOperation.share_token)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 py-3 text-xs font-bold text-white shadow transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Testar Visão do Motorista</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-semibold text-slate-200 transition-colors"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* 1. MOTORISTA */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-amber-400" /> Motorista *
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                required
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.name} — {d.vehicle_type} ({d.vehicle_plate})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. DATA & QUANTIDADE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" /> Data *
                </label>
                <input
                  type="date"
                  value={operationDate}
                  onChange={(e) => setOperationDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-amber-400" /> Pacotes *
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={packagesCount}
                  onChange={(e) => setPackagesCount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 150"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* 3. ROTA / REGIÃO */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" /> Rota / Região (Opcional)
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="Ex: Zona Leste - Mooca Express"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* 4. OBSERVAÇÃO */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-400" /> Observação (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Conferência 100% de pacotes no galpão matinal."
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* BOTÃO LIBERAR CARGA */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>LIBERAR CARGA</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
