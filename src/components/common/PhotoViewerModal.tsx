import React from 'react';
import { X, ZoomIn, Download, Calendar, User, Package, AlertCircle } from 'lucide-react';
import { DeliveryFailure } from '../../types';

interface PhotoViewerModalProps {
  failure: DeliveryFailure | null;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ failure, onClose }) => {
  if (!failure) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-mono">{failure.package_id}</h3>
                <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/30">
                  {failure.reason}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comprovante fotográfico da etiqueta de insucesso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
          {/* Imagem */}
          <div className="relative flex items-center justify-center bg-black p-4 min-h-[300px]">
            <img
              src={failure.photo_url}
              alt={`Etiqueta ${failure.package_id}`}
              className="max-h-[60vh] w-auto max-w-full rounded-lg object-contain shadow-lg border border-slate-800"
            />
            <div className="absolute bottom-6 right-6 rounded-lg bg-black/70 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-sm flex items-center gap-1.5 border border-white/10">
              <ZoomIn className="h-3.5 w-3.5" /> Foto com carimbo de tempo
            </div>
          </div>

          {/* Dados e Auditoria */}
          <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Detalhes do Registro
                </span>
                <div className="mt-2 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-slate-500" /> Motorista
                    </span>
                    <span className="font-semibold text-white">{failure.driver_name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-500" /> Data e Horário
                    </span>
                    <span className="font-mono text-slate-200">
                      {new Date(failure.registered_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Operação</span>
                    <span className="font-mono text-cyan-400">{failure.operation_code}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Status Validação</span>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                      ● Auditado e Válido
                    </span>
                  </div>
                </div>
              </div>

              {failure.notes && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Observação do Motorista
                  </span>
                  <p className="text-sm text-slate-300 italic">"{failure.notes}"</p>
                </div>
              )}

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Registro certificado no sistema. O ID <strong>{failure.package_id}</strong> está bloqueado para duplicidades nesta operação.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <a
                href={failure.photo_url}
                target="_blank"
                rel="noreferrer"
                download={`comprovante_${failure.package_id}.jpg`}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Abrir Original
              </a>
              <button
                onClick={onClose}
                className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
