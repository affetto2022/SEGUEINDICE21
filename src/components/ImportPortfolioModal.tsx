import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { IndexComposition } from '../types';

interface ImportPortfolioModalProps {
  currentComposition: IndexComposition | null;
  onImportSuccess: (message: string) => void;
  onClose: () => void;
}

export const ImportPortfolioModal: React.FC<ImportPortfolioModalProps> = ({
  currentComposition,
  onImportSuccess,
  onClose,
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const sampleCsv = `# Carteira Teórica do Ibovespa - B3 Exemplo
Ticker;Nome;Peso;Setor
VALE3;Vale ON;12.18;Materiais Básicos
PETR4;Petrobras PN;8.42;Petróleo e Gás
ITUB4;Itaú Unibanco PN;7.35;Financeiro
PETR3;Petrobras ON;4.88;Petróleo e Gás
BBDC4;Bradesco PN;3.79;Financeiro
BBAS3;Banco do Brasil ON;3.62;Financeiro
B3SA3;B3 ON;3.51;Financeiro
ELET3;Eletrobras ON;3.38;Utilidade Pública
ABEV3;Ambev ON;3.12;Consumo Não Cíclico
WEGE3;WEG ON;2.98;Bens Industriais`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvContent(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleSubmit = async () => {
    if (!csvContent.trim()) {
      setFeedback({ type: 'error', text: 'Por favor, insira o conteúdo CSV da carteira.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/index/composition/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: csvContent }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        onImportSuccess(data.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: data.message || 'Erro ao importar carteira.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', text: `Erro de rede: ${msg}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0B132B]">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Importar Composição do Ibovespa (CSV)
              </h3>
              <p className="text-xs text-slate-400">
                Atualize os ativos e pesos vigentes do índice B3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          {/* Current Composition Info */}
          {currentComposition && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200">Carteira Atual em Memória:</span>
                <span className="block text-slate-400 text-[11px]">
                  {currentComposition.source} • Ref: {currentComposition.referenceDate}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {currentComposition.assetCount} ativos
                </span>
                <span className="block text-[11px] text-slate-400">
                  Peso Total: {currentComposition.totalWeight.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer border border-slate-700 transition">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Carregar Arquivo .CSV</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => setCsvContent(sampleCsv)}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              Inserir modelo de exemplo B3
            </button>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">
              Cole o conteúdo CSV (separador ponto-e-vírgula ou vírgula):
            </label>
            <textarea
              rows={9}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Ticker;Nome;Peso;Setor&#10;VALE3;Vale ON;12.18;Materiais Básicos&#10;PETR4;Petrobras PN;8.42;Petróleo e Gás"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Processando...' : 'Aplicar Nova Carteira'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
