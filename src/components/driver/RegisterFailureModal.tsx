import React, { useState, useRef } from 'react';
import { Camera, X, AlertCircle, CheckCircle2, Upload, Barcode, ShieldAlert } from 'lucide-react';
import { FailureReason } from '../../types';
import { storage } from '../../lib/storage';

interface RegisterFailureModalProps {
  operationId: string;
  operationCode: string;
  driverName: string;
  onSuccess: () => void;
  onClose: () => void;
}

const FAILURE_REASONS: FailureReason[] = [
  'Cliente ausente',
  'Endereço não localizado',
  'Endereço fechado',
  'Recusa',
  'Problema no endereço',
  'Problema operacional',
  'Outros',
];

export const RegisterFailureModal: React.FC<RegisterFailureModalProps> = ({
  operationId,
  operationCode,
  driverName,
  onSuccess,
  onClose,
}) => {
  const [packageId, setPackageId] = useState('');
  const [reason, setReason] = useState<FailureReason>('Cliente ausente');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipulador de upload de foto / captura de câmera
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Converte para Base64 para visualização e persistência imediata
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPhotoUrl(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Fotos de exemplo rápidas para teste em computador
  const setQuickMockPhoto = (index: number) => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
    ];
    setPhotoUrl(samplePhotos[index % samplePhotos.length]);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPkg = packageId.trim().toUpperCase();
    if (!cleanPkg) {
      setError('Por favor, informe o ID do pacote ou bipe a etiqueta.');
      return;
    }

    if (!photoUrl) {
      setError('A foto da etiqueta é obrigatória para comprovação do insucesso.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = storage.registerFailure({
        operation_id: operationId,
        package_id: cleanPkg,
        reason,
        photo_url: photoUrl,
        notes: notes.trim(),
      });

      if (!result.success) {
        setError(result.error || 'Erro ao registrar insucesso.');
        setIsSubmitting(false);
        return;
      }

      // Sucesso
      setIsSubmitting(false);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Falha inesperada no envio.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header móvel */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Registrar Insucesso</h2>
              <p className="text-xs text-slate-400">
                Operação: <span className="font-mono text-cyan-400">{operationCode}</span> • {driverName}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-300 font-medium leading-relaxed">
                {error}
              </div>
            </div>
          )}

          {/* 1. ID DO PACOTE */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>ID do Pacote (Código de Barras) *</span>
              <span className="text-[10px] text-amber-400 font-normal">Anti-duplicidade ativo</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Barcode className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={packageId}
                onChange={(e) => setPackageId(e.target.value.toUpperCase())}
                placeholder="Ex: BR9876543210BR"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-24 py-3.5 text-base font-mono text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none uppercase"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setPackageId(`BR${Math.floor(100000000 + Math.random() * 900000000)}BR`)}
                className="absolute right-2 top-2 bottom-2 px-2.5 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Gerar ID
              </button>
            </div>
          </div>

          {/* 2. MOTIVO DO INSUCESSO */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Motivo do Insucesso *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as FailureReason)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3.5 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              {FAILURE_REASONS.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* 3. FOTO DA ETIQUETA */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Foto da Etiqueta (Comprovação Obrigatória) *
            </label>

            {/* Input escondido para acionar a câmera nativa do celular */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {photoUrl ? (
              <div className="relative rounded-xl border border-slate-700 bg-black overflow-hidden group">
                <img
                  src={photoUrl}
                  alt="Preview da Etiqueta"
                  className="w-full h-48 object-contain bg-slate-950"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow"
                  >
                    Tirar Outra
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow"
                  >
                    Remover
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[11px] font-semibold text-slate-950">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Foto capturada
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-6 text-center hover:bg-amber-500/10 hover:border-amber-500 transition-all active:scale-[0.99]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 mb-2">
                    <Camera className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-white">
                    Tirar Foto da Etiqueta
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Toque para abrir a câmera do celular ou escolher foto
                  </span>
                </button>

                {/* Alternativa para teste rápido */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Sem câmera agora?</span>
                  <button
                    type="button"
                    onClick={() => setQuickMockPhoto(0)}
                    className="text-amber-400 hover:underline font-semibold"
                  >
                    Usar foto de amostra
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. OBSERVAÇÃO (OPCIONAL) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Observação (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Interfone quebrado, aguardei 10 min, vizinho do 102 avisou que saiu."
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* BOTÃO GRANDE DE ENVIO */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-4 text-base font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Enviando Comprovação...</span>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>ENVIAR INSUCESSO</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
